package com.intraday.journal.service;

import com.intraday.journal.dto.TradeEntryRequest;
import com.intraday.journal.dto.TradeExitRequest;
import com.intraday.journal.dto.TradeResponse;
import com.intraday.journal.model.MarketRegime;
import com.intraday.journal.model.Trade;
import com.intraday.journal.repository.TradeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class TradeService {
    
    private final TradeRepository tradeRepository;
    
    /**
     * Log a new trade entry
     */
    public Mono<TradeResponse> logEntry(TradeEntryRequest request) {
        log.info("Logging trade entry for {} {} {}", request.getSymbol(), request.getOptionType(), request.getStrike());
        
        LocalDateTime now = LocalDateTime.now();
        String tradeId = generateTradeId(request.getSymbol(), now);
        
        MarketRegime regime = MarketRegime.builder()
                .trend(request.getTrend())
                .vwapStatus(request.getVwapStatus())
                .volatilityRegime(request.getVolatilityRegime())
                .timeCategory(request.getTimeCategory())
                .oiConfirmation(request.getOiConfirmation())
                .build();
        
        Trade trade = Trade.builder()
                .tradeId(tradeId)
                .symbol(request.getSymbol())
                .optionType(request.getOptionType())
                .strike(request.getStrike())
                .expiry(request.getExpiry())
                .entryTimestamp(now)
                .entryPrice(request.getEntryPrice())
                .quantity(request.getQuantity())
                .positionValue(request.getEntryPrice() * request.getQuantity())
                .spotPrice(request.getSpotPrice())
                .setupScore(request.getSetupScore())
                .noTradeScore(request.getNoTradeScore())
                .marketRegime(regime)
                .riskMode(request.getRiskMode())
                .entryNotes(request.getEntryNotes())
                .tags(request.getTags())
                .createdAt(now)
                .updatedAt(now)
                .build();
        
        return tradeRepository.save(trade)
                .map(this::toTradeResponse)
                .doOnSuccess(response -> log.info("Trade entry logged successfully: {}", tradeId))
                .doOnError(error -> log.error("Error logging trade entry", error));
    }
    
    /**
     * Log trade exit
     */
    public Mono<TradeResponse> logExit(String tradeId, TradeExitRequest request) {
        log.info("Logging exit for trade: {}", tradeId);
        
        return tradeRepository.findByTradeId(tradeId)
                .switchIfEmpty(Mono.error(new RuntimeException("Trade not found: " + tradeId)))
                .flatMap(trade -> {
                    LocalDateTime exitTime = LocalDateTime.now();
                    
                    // Calculate holding duration
                    long durationMinutes = Duration.between(trade.getEntryTimestamp(), exitTime).toMinutes();
                    
                    // Calculate PnL
                    double priceDiff = request.getExitPrice() - trade.getEntryPrice();
                    double grossPnl = priceDiff * trade.getQuantity();
                    double totalCharges = request.getTotalCharges() != null ? request.getTotalCharges() : 0.0;
                    double netPnl = grossPnl - totalCharges;
                    double roi = (netPnl / trade.getPositionValue()) * 100;
                    
                    // Determine outcome
                    String outcome = netPnl >= 0 ? "WIN" : "LOSS";
                    
                    // Update trade
                    trade.setExitTimestamp(exitTime);
                    trade.setExitPrice(request.getExitPrice());
                    trade.setExitReason(request.getExitReason());
                    trade.setHoldingDurationMinutes(durationMinutes);
                    trade.setGrossPnl(grossPnl);
                    trade.setTotalCharges(totalCharges);
                    trade.setNetPnl(netPnl);
                    trade.setRoiPercentage(roi);
                    trade.setOutcome(outcome);
                    trade.setExitNotes(request.getExitNotes());
                    trade.setEmotionalState(request.getEmotionalState());
                    trade.setUpdatedAt(exitTime);
                    
                    return tradeRepository.save(trade);
                })
                .map(this::toTradeResponse)
                .doOnSuccess(response -> log.info("Trade exit logged successfully: {}", tradeId))
                .doOnError(error -> log.error("Error logging trade exit", error));
    }
    
    /**
     * Get all trades
     */
    public Flux<TradeResponse> getAllTrades() {
        return tradeRepository.findAllByOrderByEntryTimestampDesc()
                .map(this::toTradeResponse);
    }
    
    /**
     * Get trades by symbol
     */
    public Flux<TradeResponse> getTradesBySymbol(String symbol) {
        return tradeRepository.findBySymbolOrderByEntryTimestampDesc(symbol)
                .map(this::toTradeResponse);
    }
    
    /**
     * Get single trade by ID
     */
    public Mono<TradeResponse> getTradeById(String tradeId) {
        return tradeRepository.findByTradeId(tradeId)
                .map(this::toTradeResponse)
                .switchIfEmpty(Mono.error(new RuntimeException("Trade not found: " + tradeId)));
    }
    
    /**
     * Get trades within date range
     */
    public Flux<TradeResponse> getTradesByDateRange(LocalDateTime start, LocalDateTime end, String symbol) {
        if (symbol != null && !symbol.isEmpty()) {
            return tradeRepository.findBySymbolAndEntryTimestampBetween(symbol, start, end)
                    .map(this::toTradeResponse);
        } else {
            return tradeRepository.findByEntryTimestampBetween(start, end)
                    .map(this::toTradeResponse);
        }
    }
    
    /**
     * Generate unique trade ID
     */
    private String generateTradeId(String symbol, LocalDateTime timestamp) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
        String dateTime = timestamp.format(formatter);
        return String.format("TRD_%s_%s", symbol, dateTime);
    }
    
    /**
     * Convert Trade to TradeResponse
     */
    private TradeResponse toTradeResponse(Trade trade) {
        return TradeResponse.builder()
                .id(trade.getId())
                .tradeId(trade.getTradeId())
                .symbol(trade.getSymbol())
                .optionType(trade.getOptionType())
                .strike(trade.getStrike())
                .expiry(trade.getExpiry())
                .entryTimestamp(trade.getEntryTimestamp())
                .entryPrice(trade.getEntryPrice())
                .quantity(trade.getQuantity())
                .positionValue(trade.getPositionValue())
                .spotPrice(trade.getSpotPrice())
                .setupScore(trade.getSetupScore())
                .noTradeScore(trade.getNoTradeScore())
                .marketRegime(trade.getMarketRegime())
                .riskMode(trade.getRiskMode())
                .exitTimestamp(trade.getExitTimestamp())
                .exitPrice(trade.getExitPrice())
                .exitReason(trade.getExitReason())
                .holdingDurationMinutes(trade.getHoldingDurationMinutes())
                .grossPnl(trade.getGrossPnl())
                .totalCharges(trade.getTotalCharges())
                .netPnl(trade.getNetPnl())
                .roiPercentage(trade.getRoiPercentage())
                .outcome(trade.getOutcome())
                .riskRewardAchieved(trade.getRiskRewardAchieved())
                .entryNotes(trade.getEntryNotes())
                .exitNotes(trade.getExitNotes())
                .emotionalState(trade.getEmotionalState())
                .tags(trade.getTags())
                .createdAt(trade.getCreatedAt())
                .updatedAt(trade.getUpdatedAt())
                .build();
    }
}
