package com.intraday.marketdata.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * OHLC (Open, High, Low, Close) data model
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OHLC {
    
    private BigDecimal open;
    private BigDecimal high;
    private BigDecimal low;
    private BigDecimal close;
    private Long volume;
    
    public BigDecimal getTypicalPrice() {
        if (high == null || low == null || close == null) {
            return BigDecimal.ZERO;
        }
        return high.add(low).add(close).divide(BigDecimal.valueOf(3));
    }
}
