package com.intraday.marketdata.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.LocalTime;

/**
 * Market hours configuration
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "market")
public class MarketConfig {
    
    private String startTime;
    private String endTime;
    private String timezone;
    
    public LocalTime getStartTimeAsLocalTime() {
        return LocalTime.parse(startTime);
    }
    
    public LocalTime getEndTimeAsLocalTime() {
        return LocalTime.parse(endTime);
    }
}
