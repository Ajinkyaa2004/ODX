package com.intraday.risk.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PnLCalculationResponse {
    
    private BigDecimal entryPrice;
    private BigDecimal currentPrice;
    private Integer quantity;
    private String symbol;
    
    private BigDecimal grossPnL;
    private ChargesBreakdown charges;
    private BigDecimal netPnL;
    private BigDecimal roi;
    private BigDecimal breakEvenPrice;
    
    private String status; // PROFIT, LOSS, BREAKEVEN
}
