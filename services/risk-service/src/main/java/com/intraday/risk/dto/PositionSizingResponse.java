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
public class PositionSizingResponse {
    
    // Input fields
    private BigDecimal capital;
    private Double riskPercentage;
    private BigDecimal entryPrice;
    private BigDecimal stopLoss;
    private BigDecimal target;
    private String symbol;
    private String optionType;
    private Integer strike;
    private String broker;
    
    // Calculated fields
    private BigDecimal riskPerUnit;
    private BigDecimal rewardPerUnit;
    private Integer lotSize;
    private Integer maxLots;
    private Integer positionSize;
    private BigDecimal positionValue;
    private BigDecimal riskAmount;
    private BigDecimal rewardAmount;
    private BigDecimal riskRewardRatio;
    
    // Charges
    private ChargesBreakdown charges;
    
    // PnL
    private BigDecimal breakEvenPrice;
    private BigDecimal grossPnLAtTarget;
    private BigDecimal netPnLAtTarget;
    private BigDecimal roi;
}
