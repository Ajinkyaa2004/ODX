package com.intraday.marketdata.service;

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
 * Service to push real-time updates to frontend via Socket.io
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
     * Broadcast price update to all subscribers of a symbol
     */
    public void broadcastPriceUpdate(String symbol, Map<String, Object> data) {
        try {
            socketIOServer.getRoomOperations(symbol).sendEvent("price_update", data);
            log.debug("Broadcasted price update for {}: {}", symbol, data.get("price"));
        } catch (Exception e) {
            log.error("Error broadcasting price update for {}: {}", symbol, e.getMessage());
        }
    }
    
    /**
     * Broadcast indicator update to all subscribers
     */
    public void broadcastIndicatorUpdate(String symbol, Map<String, Object> data) {
        try {
            socketIOServer.getRoomOperations(symbol).sendEvent("indicator_update", data);
            log.debug("Broadcasted indicator update for {}", symbol);
        } catch (Exception e) {
            log.error("Error broadcasting indicator update for {}: {}", symbol, e.getMessage());
        }
    }
    
    /**
     * Broadcast market status change to all clients
     */
    public void broadcastMarketStatus(Map<String, Object> data) {
        try {
            socketIOServer.getBroadcastOperations().sendEvent("market_status", data);
            log.info("Broadcasted market status: {}", data.get("message"));
        } catch (Exception e) {
            log.error("Error broadcasting market status: {}", e.getMessage());
        }
    }
    
    /**
     * Get count of connected clients
     */
    public int getConnectedClientsCount() {
        return connectedClients.size();
    }
}
