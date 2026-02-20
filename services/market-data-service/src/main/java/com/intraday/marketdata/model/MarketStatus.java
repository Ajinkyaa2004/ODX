package com.intraday.marketdata.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Market status information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarketStatus {
    
    private Boolean isOpen;
    private LocalDateTime currentTime;
    private LocalDateTime nextOpen;
    private LocalDateTime nextClose;
    private String message;
}
