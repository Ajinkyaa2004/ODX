package com.intraday.optionchain.service;

import com.corundumstudio.socketio.SocketIOServer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service to push real-time option chain updates to frontend via Socket.io
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SocketIOService {
    
    private final SocketIOServer socketIOServer;
    private final Set<String> connectedClients = ConcurrentHashMap.newKeySet();
    
    @PostConstruct
    public void startServer() {
        socketIOServer.addConnectListener(client -> {
            String sessionId = client.getSessionId().toString();
            connectedClients.add(sessionId);
            log.info("Socket.io client connected: {} (Total: {})", sessionId, connectedClients.size());
        });
        
        socketIOServer.addDisconnectListener(client -> {
            String sessionId = client.getSessionId().toString();
            connectedClients.remove(sessionId);
            log.info("Socket.io client disconnected: {} (Total: {})", sessionId, connectedClients.size());
        });
        
        // Handle subscription events
        socketIOServer.addEventListener("subscribe", String.class, (client, symbol, ackRequest) -> {
            log.info("Client {} subscribed to symbol: {}", client.getSessionId(), symbol);
            client.joinRoom(symbol);
        });
        
        socketIOServer.addEventListener("unsubscribe", String.class, (client, symbol, ackRequest) -> {
            log.info("Client {} unsubscribed from symbol: {}", client.getSessionId(), symbol);
            client.leaveRoom(symbol);
        });
        
        socketIOServer.start();
        log.info("Socket.io server started on port: {}", socketIOServer.getConfiguration().getPort());
    }
    
    @PreDestroy
    public void stopServer() {
        socketIOServer.stop();
        log.info("Socket.io server stopped");
    }
    
    /**
     * Broadcast option chain update to all subscribers of a symbol
     */
    public void broadcastOptionChainUpdate(String symbol, Map<String, Object> data) {
        try {
            socketIOServer.getRoomOperations(symbol).sendEvent("option_chain_update", data);
            log.debug("Broadcasted option chain update for {}", symbol);
        } catch (Exception e) {
            log.error("Error broadcasting option chain update for {}: {}", symbol, e.getMessage());
        }
    }
    
    /**
     * Broadcast OI analysis update to all subscribers of a symbol
     */
    public void broadcastOIAnalysisUpdate(String symbol, Map<String, Object> data) {
        try {
            socketIOServer.getRoomOperations(symbol).sendEvent("oi_analysis_update", data);
            log.debug("Broadcasted OI analysis update for {}", symbol);
        } catch (Exception e) {
            log.error("Error broadcasting OI analysis update for {}: {}", symbol, e.getMessage());
        }
    }
    
    /**
     * Broadcast strike recommendation update to all subscribers
     */
    public void broadcastStrikeRecommendation(String symbol, Map<String, Object> data) {
        try {
            socketIOServer.getRoomOperations(symbol).sendEvent("strike_recommendation_update", data);
            log.debug("Broadcasted strike recommendation for {}", symbol);
        } catch (Exception e) {
            log.error("Error broadcasting strike recommendation for {}: {}", symbol, e.getMessage());
        }
    }
    
    /**
     * Get count of connected clients
     */
    public int getConnectedClientsCount() {
        return connectedClients.size();
    }
}
