package com.intraday.marketdata.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.intraday.marketdata.config.FyersConfig;
import com.intraday.marketdata.model.OHLC;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * WebSocket client for FYERS API
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FyersWebSocketClient {
    
    private final FyersConfig fyersConfig;
    private final MarketDataService marketDataService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    private WebSocket webSocket;
    private OkHttpClient client;
    private final AtomicBoolean connected = new AtomicBoolean(false);
    private final Map<String, Map<String, BigDecimal>> symbolData = new HashMap<>();
    
    // FYERS symbol format: NSE:NIFTY50-INDEX, NSE:NIFTYBANK-INDEX
    private static final Map<String, String> SYMBOL_MAP = Map.of(
        "NIFTY", "NSE:NIFTY50-INDEX",
        "BANKNIFTY", "NSE:NIFTYBANK-INDEX"
    );
    
    @PostConstruct
    public void initialize() {
        this.client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .pingInterval(30, TimeUnit.SECONDS)
                .build();
        
        log.info("FYERS WebSocket client initialized");
    }
    
    /**
     * Connect to FYERS WebSocket
     */
    public void connect(List<String> symbols) {
        if (connected.get()) {
            log.warn("WebSocket already connected");
            return;
        }
        
        Request request = new Request.Builder()
                .url(fyersConfig.getWebsocketUrl())
                .addHeader("Authorization", fyersConfig.getAuthToken())
                .build();
        
        webSocket = client.newWebSocket(request, new WebSocketListener() {
            @Override
            public void onOpen(WebSocket webSocket, Response response) {
                connected.set(true);
                log.info("FYERS WebSocket connected successfully");
                
                // Subscribe to symbols
                subscribeToSymbols(symbols);
            }
            
            @Override
            public void onMessage(WebSocket webSocket, String text) {
                handleMessage(text);
            }
            
            @Override
            public void onFailure(WebSocket webSocket, Throwable t, Response response) {
                connected.set(false);
                log.error("FYERS WebSocket connection failed: {}", t.getMessage());
                
                // Retry connection after 5 seconds
                scheduleReconnect(symbols);
            }
            
            @Override
            public void onClosing(WebSocket webSocket, int code, String reason) {
                connected.set(false);
                log.warn("FYERS WebSocket closing: {} - {}", code, reason);
            }
            
            @Override
            public void onClosed(WebSocket webSocket, int code, String reason) {
                connected.set(false);
                log.info("FYERS WebSocket closed: {} - {}", code, reason);
            }
        });
    }
    
    private void subscribeToSymbols(List<String> symbols) {
        try {
            Map<String, Object> subscribeMessage = new HashMap<>();
            subscribeMessage.put("T", "SUB_L2");
            
            List<String> fyersSymbols = symbols.stream()
                    .map(s -> SYMBOL_MAP.getOrDefault(s, s))
                    .toList();
            
            subscribeMessage.put("SLIST", fyersSymbols);
            subscribeMessage.put("SUB_T", 1); // Subscribe to touchline data
            
            String message = objectMapper.writeValueAsString(subscribeMessage);
            webSocket.send(message);
            
            log.info("Subscribed to symbols: {}", symbols);
        } catch (Exception e) {
            log.error("Error subscribing to symbols: {}", e.getMessage(), e);
        }
    }
    
    private void handleMessage(String message) {
        try {
            JsonNode root = objectMapper.readTree(message);
            
            // Check message type
            String type = root.has("T") ? root.get("T").asText() : "";
            
            if ("df".equals(type)) { // Data feed message
                String symbol = root.has("s") ? root.get("s").asText() : "";
                String normalizedSymbol = getNormalizedSymbol(symbol);
                
                if (normalizedSymbol != null) {
                    BigDecimal ltp = root.has("lp") ? 
                            new BigDecimal(root.get("lp").asText()) : null;
                    BigDecimal open = root.has("op") ? 
                            new BigDecimal(root.get("op").asText()) : null;
                    BigDecimal high = root.has("hp") ? 
                            new BigDecimal(root.get("hp").asText()) : null;
                    BigDecimal low = root.has("lp") ? 
                            new BigDecimal(root.get("low_price").asText()) : null;
                    Long volume = root.has("v") ? 
                            root.get("v").asLong() : null;
                    
                    OHLC ohlc = OHLC.builder()
                            .open(open)
                            .high(high)
                            .low(low)
                            .close(ltp)
                            .volume(volume)
                            .build();
                    
                    // Process the data
                    marketDataService.processLiveData(normalizedSymbol, ltp, ohlc);
                }
            }
        } catch (Exception e) {
            log.error("Error handling WebSocket message: {}", e.getMessage());
        }
    }
    
    private String getNormalizedSymbol(String fyersSymbol) {
        return SYMBOL_MAP.entrySet().stream()
                .filter(entry -> entry.getValue().equals(fyersSymbol))
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse(null);
    }
    
    private void scheduleReconnect(List<String> symbols) {
        new Thread(() -> {
            try {
                Thread.sleep(5000);
                log.info("Attempting to reconnect to FYERS WebSocket...");
                connect(symbols);
            } catch (InterruptedException e) {
                log.error("Reconnect interrupted: {}", e.getMessage());
            }
        }).start();
    }
    
    /**
     * Disconnect from FYERS WebSocket
     */
    @PreDestroy
    public void disconnect() {
        if (webSocket != null) {
            webSocket.close(1000, "Application shutdown");
            connected.set(false);
            log.info("FYERS WebSocket disconnected");
        }
        
        if (client != null) {
            client.dispatcher().executorService().shutdown();
            client.connectionPool().evictAll();
        }
    }
    
    public boolean isConnected() {
        return connected.get();
    }
}
