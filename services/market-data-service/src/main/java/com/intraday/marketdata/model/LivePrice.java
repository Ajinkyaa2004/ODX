package com.intraday.marketdata.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Live price data for real-time updates
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LivePrice {
    
    private String symbol;
    private BigDecimal price;
    private BigDecimal change;
    private BigDecimal changePercent;
    private LocalDateTime timestamp;
    private OHLC ohlc;
    private Boolean isMarketOpen;
    private String connectionStatus;
}
