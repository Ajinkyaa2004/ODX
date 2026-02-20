package com.intraday.marketdata.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * FYERS API configuration
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "fyers")
public class FyersConfig {
    
    private String appId;
    private String accessToken;
    private String websocketUrl;
    
    public String getAuthToken() {
        return appId + ":" + accessToken;
    }
}
