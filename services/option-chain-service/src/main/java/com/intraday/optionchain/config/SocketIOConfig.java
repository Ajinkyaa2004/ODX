package com.intraday.optionchain.config;

import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.Configuration;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

/**
 * Socket.io server configuration for real-time option chain updates
 */
@Slf4j
@org.springframework.context.annotation.Configuration
public class SocketIOConfig {
    
    @Value("${socket.io.port:9093}")
    private int socketIOPort;
    
    @Value("${socket.io.host:0.0.0.0}")
    private String socketIOHost;
    
    @Bean
    public SocketIOServer socketIOServer() {
        Configuration config = new Configuration();
        config.setHostname(socketIOHost);
        config.setPort(socketIOPort);
        config.setOrigin("*");
        config.setAllowCustomRequests(true);
        config.setMaxFramePayloadLength(1024 * 1024);
        config.setMaxHttpContentLength(1024 * 1024);
        
        SocketIOServer server = new SocketIOServer(config);
        
        server.addConnectListener(client -> {
            log.info("Client connected: {}", client.getSessionId());
        });
        
        server.addDisconnectListener(client -> {
            log.info("Client disconnected: {}", client.getSessionId());
        });
        
        return server;
    }
}
