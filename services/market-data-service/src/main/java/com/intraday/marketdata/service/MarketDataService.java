package com.intraday.marketdata.service;

import com.intraday.marketdata.model.*;
import com.intraday.marketdata.repository.MarketSnapshotRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Main service for market data processing
 */
@Slf4j
@Service
public class MarketDataService {
    
    private final MarketSnapshotRepository snapshotRepository;
    private final MarketHoursService marketHoursService;
    private final SocketIOService socketIOService;
    private final FyersWebSocketClient fyersWebSocketClient;
    
    @Value("${evaluation.interval-minutes:3}")
    private int evaluationIntervalMinutes;
    
    @Value("${SYMBOLS:NIFTY,BANKNIFTY}")
    private String symbolsString;
    
    private List<String> symbols;
    private final Map<String, LivePriceData> currentPrices = new ConcurrentHashMap<>();
    private final Map<String, BigDecimal> previousClosePrices = new ConcurrentHashMap<>();
    private boolean marketOpenNotificationSent = false;
    
    public MarketDataService(
            MarketSnapshotRepository snapshotRepository,
            MarketHoursService marketHoursService,
            SocketIOService socketIOService,
            @Lazy FyersWebSocketClient fyersWebSocketClient) {
        this.snapshotRepository = snapshotRepository;
        this.marketHoursService = marketHoursService;
        this.socketIOService = socketIOService;
        this.fyersWebSocketClient = fyersWebSocketClient;
    }
    
    @PostConstruct
    public void initialize() {
        this.symbols = Arrays.asList(symbolsString.split(","));
        log.info("Market Data Service initialized for symbols: {}", symbols);
    }
    
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        log.info("Application ready, connecting to FYERS WebSocket");
        connectToFyers();
    }
    
    private void connectToFyers() {
        try {
            fyersWebSocketClient.connect(symbols);
            log.info("Connected to FYERS WebSocket for symbols: {}", symbols);
        } catch (Exception e) {
            log.error("Failed to connect to FYERS: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Process live data from FYERS WebSocket
     */
    public void processLiveData(String symbol, BigDecimal price, OHLC ohlc) {
        if (!marketHoursService.isMarketOpen()) {
            log.debug("Market closed. Ignoring data for {}", symbol);
            return;
        }
        
        try {
            // Update current price
            LivePriceData priceData = currentPrices.computeIfAbsent(symbol, k -> new LivePriceData());
            priceData.setPrice(price);
            priceData.setOhlc(ohlc);
            priceData.setTimestamp(LocalDateTime.now());
            
            // Calculate change
            BigDecimal previousPrice = previousClosePrices.get(symbol);
            if (previousPrice != null && previousPrice.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal change = price.subtract(previousPrice);
                BigDecimal changePercent = change.divide(previousPrice, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100));
                priceData.setChange(change);
                priceData.setChangePercent(changePercent);
            }
            
            // Broadcast to frontend
            broadcastPriceUpdate(symbol, priceData);
            
        } catch (Exception e) {
            log.error("Error processing live data for {}: {}", symbol, e.getMessage());
        }
    }
    
    private void broadcastPriceUpdate(String symbol, LivePriceData priceData) {
        Map<String, Object> data = new HashMap<>();
        data.put("symbol", symbol);
        data.put("price", priceData.getPrice());
        data.put("change", priceData.getChange());
        data.put("changePercent", priceData.getChangePercent());
        data.put("timestamp", priceData.getTimestamp());
        
        socketIOService.broadcastPriceUpdate(symbol, data);
    }
    
    /**
     * Scheduled task to save snapshots every 3 minutes
     */
    @Scheduled(fixedDelayString = "${evaluation.interval-minutes}00000", initialDelay = 60000)
    public void saveSnapshots() {
        if (!marketHoursService.isMarketOpen()) {
            return;
        }
        
        log.info("Saving market snapshots...");
        
        symbols.forEach(symbol -> {
            LivePriceData priceData = currentPrices.get(symbol);
            if (priceData != null && priceData.getPrice() != null) {
                MarketSnapshot snapshot = MarketSnapshot.builder()
                        .symbol(symbol)
                        .timestamp(LocalDateTime.now())
                        .price(priceData.getPrice())
                        .ohlc1m(priceData.getOhlc())
                        .futuresOi(0L) // Placeholder for Phase 3
                        .snapshotIntervalMinutes(evaluationIntervalMinutes)
                        .createdAt(LocalDateTime.now())
                        .isMarketOpen(true)
                        .build();
                
                snapshotRepository.save(snapshot)
                        .subscribe(
                            saved -> log.info("Saved snapshot for {} at {}", symbol, saved.getTimestamp()),
                            error -> log.error("Error saving snapshot for {}: {}", symbol, error.getMessage())
                        );
            }
        });
    }
    
    /**
     * Scheduled task to check market status
     */
    @Scheduled(fixedRate = 60000) // Check every minute
    public void checkMarketStatus() {
        boolean isOpen = marketHoursService.isMarketOpen();
        
        if (isOpen && !marketOpenNotificationSent) {
            Map<String, Object> data = new HashMap<>();
            data.put("isOpen", true);
            data.put("message", "Market opened at 09:15 IST");
            socketIOService.broadcastMarketStatus(data);
            marketOpenNotificationSent = true;
            log.info("Market open notification sent");
        } else if (!isOpen && marketOpenNotificationSent) {
            marketOpenNotificationSent = false;
            log.info("Market closed");
        }
    }
    
    /**
     * Get latest price for a symbol
     */
    public Mono<LivePrice> getLatestPrice(String symbol) {
        return Mono.fromCallable(() -> {
            LivePriceData priceData = currentPrices.get(symbol);
            boolean isOpen = marketHoursService.isMarketOpen();
            
            if (priceData == null) {
                return LivePrice.builder()
                        .symbol(symbol)
                        .price(BigDecimal.ZERO)
                        .isMarketOpen(isOpen)
                        .connectionStatus(fyersWebSocketClient.isConnected() ? "connected" : "disconnected")
                        .build();
            }
            
            return LivePrice.builder()
                    .symbol(symbol)
                    .price(priceData.getPrice())
                    .change(priceData.getChange())
                    .changePercent(priceData.getChangePercent())
                    .timestamp(priceData.getTimestamp())
                    .ohlc(priceData.getOhlc())
                    .isMarketOpen(isOpen)
                    .connectionStatus(fyersWebSocketClient.isConnected() ? "connected" : "disconnected")
                    .build();
        });
    }
    
    /**
     * Get historical snapshots
     */
    public Mono<Map<String, Object>> getHistoricalSnapshots(String symbol, int hours) {
        LocalDateTime startTime = LocalDateTime.now().minusHours(hours);
        
        return snapshotRepository.findBySymbolAndTimestampAfterOrderByTimestampDesc(symbol, startTime)
                .collectList()
                .map(snapshots -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("symbol", symbol);
                    result.put("count", snapshots.size());
                    result.put("snapshots", snapshots);
                    return result;
                });
    }
    
    /**
     * Get OHLC data for charting with technical indicators
     */
    public Mono<java.util.List<Map<String, Object>>> getOHLCData(String symbol, String timeframe, int limit) {
        LocalDateTime startTime = LocalDateTime.now().minusHours(6); // Get last 6 hours of data
        
        return snapshotRepository.findBySymbolAndTimestampAfterOrderByTimestampDesc(symbol, startTime)
                .collectList()
                .map(snapshots -> {
                    java.util.List<Map<String, Object>> ohlcList = new java.util.ArrayList<>();
                    
                    // Group snapshots by timeframe and create OHLC candles
                    // For simplicity, using the stored 1m OHLC data directly
                    // In production, aggregate 1m candles to create 5m, 15m candles
                    
                    snapshots.stream()
                            .limit(limit)
                            .forEach(snapshot -> {
                                Map<String, Object> candle = new HashMap<>();
                                candle.put("timestamp", snapshot.getTimestamp().toString());
                                
                                OHLC ohlc = snapshot.getOhlc1m();
                                if (ohlc != null) {
                                    candle.put("open", ohlc.getOpen());
                                    candle.put("high", ohlc.getHigh());
                                    candle.put("low", ohlc.getLow());
                                    candle.put("close", ohlc.getClose());
                                    candle.put("volume", ohlc.getVolume() != null ? ohlc.getVolume() : 0L);
                                    
                                    // Add mock indicators (in production, calculate from actual data)
                                    BigDecimal close = ohlc.getClose();
                                    if (close != null) {
                                        candle.put("ema9", close.multiply(BigDecimal.valueOf(0.998))); // Mock EMA9
                                        candle.put("ema20", close.multiply(BigDecimal.valueOf(0.996))); // Mock EMA20
                                        candle.put("ema50", close.multiply(BigDecimal.valueOf(0.993))); // Mock EMA50
                                        candle.put("vwap", close.multiply(BigDecimal.valueOf(0.9985))); // Mock VWAP
                                    }
                                    
                                    ohlcList.add(candle);
                                }
                            });
                    
                    // Reverse to show oldest to newest
                    java.util.Collections.reverse(ohlcList);
                    return ohlcList;
                });
    }
    
    // Inner class to hold live price data
    private static class LivePriceData {
        private BigDecimal price;
        private BigDecimal change;
        private BigDecimal changePercent;
        private LocalDateTime timestamp;
        private OHLC ohlc;
        
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public BigDecimal getChange() { return change; }
        public void setChange(BigDecimal change) { this.change = change; }
        public BigDecimal getChangePercent() { return changePercent; }
        public void setChangePercent(BigDecimal changePercent) { this.changePercent = changePercent; }
        public LocalDateTime getTimestamp() { return timestamp; }
        public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
        public OHLC getOhlc() { return ohlc; }
        public void setOhlc(OHLC ohlc) { this.ohlc = ohlc; }
    }
}
