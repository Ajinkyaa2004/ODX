package com.intraday.optionchain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents recommended strikes for trading
 * Based on composite scoring and OI analysis
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StrikeRecommendation {
    
    /**
     * Symbol (NIFTY or BANKNIFTY)
     */
    private String symbol;
    
    /**
     * Recommendation type: CALL_BUY, CALL_SELL, PUT_BUY, PUT_SELL
     */
    private String recommendationType;
    
    /**
     * Recommended strike price
     */
    private Double strikePrice;
    
    /**
     * Confidence score (0-10)
     */
    private Double confidence;
    
    /**
     * Reason for recommendation
     */
    private String reason;
    
    /**
     * Current premium/LTP
     */
    private Double premium;
    
    /**
     * Liquidity score for this strike
     */
    private Double liquidity;
    
    /**
     * OI for this option
     */
    private Long openInterest;
    
    /**
     * OI change
     */
    private Long oiChange;
    
    /**
     * Volume
     */
    private Long volume;
    
    /**
     * Delta (if available)
     */
    private Double delta;
    
    /**
     * Distance from ATM (in percentage)
     */
    private Double atmDistance;
    
    /**
     * Expected behavior: SUPPORT, RESISTANCE, BREAKOUT
     */
    private String expectedBehavior;
    
    /**
     * Market bias alignment
     */
    private String marketBias;
}
