package com.intraday.marketdata.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Market snapshot stored every 3 minutes
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "market_snapshots")
public class MarketSnapshot {
    
    @Id
    private String id;
    
    @Indexed
    private String symbol;
    
    @Indexed
    private LocalDateTime timestamp;
    
    private BigDecimal price;
    
    private OHLC ohlc1m;
    
    private Long futuresOi;
    
    private Integer snapshotIntervalMinutes;
    
    private LocalDateTime createdAt;
    
    private Boolean isMarketOpen;
}
