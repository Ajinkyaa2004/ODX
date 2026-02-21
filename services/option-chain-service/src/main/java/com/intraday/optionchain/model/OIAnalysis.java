package com.intraday.optionchain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * OI Analysis summary for integration with Phase 2 scoring
 * This is returned to quant-engine for OI confirmation scoring
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OIAnalysis {
    
    /**
     * Symbol (NIFTY or BANKNIFTY)
     */
    private String symbol;
    
    /**
     * Put-Call Ratio
     */
    private Double pcr;
    
    /**
     * PCR interpretation: BULLISH, BEARISH, NEUTRAL
     */
    private String pcrInterpretation;
    
    /**
     * Max Pain strike
     */
    private Double maxPainStrike;
    
    /**
     * Current spot price
     */
    private Double spotPrice;
    
    /**
     * Distance from max pain (spot - max pain)
     */
    private Double maxPainDistance;
    
    /**
     * Net Call OI change
     */
    private Long netCallOIChange;
    
    /**
     * Net Put OI change
     */
    private Long netPutOIChange;
    
    /**
     * OI trend: CALL_HEAVY, PUT_HEAVY, BALANCED
     */
    private String oiTrend;
    
    /**
     * Overall sentiment: BULLISH, BEARISH, NEUTRAL
     */
    private String sentiment;
    
    /**
     * Bullish strength score (0-10)
     */
    private Double bullishScore;
    
    /**
     * Bearish strength score (0-10)
     */
    private Double bearishScore;
    
    /**
     * Pattern strength (0-10) - How clear/confident the pattern is
     */
    private Double patternStrength;
    
    /**
     * Data timestamp
     */
    private String timestamp;
    
    /**
     * Calculate bullish/bearish scores based on OI analysis
     */
    public void calculateScores() {
        double bullish = 0.0;
        double bearish = 0.0;
        
        // 1. PCR contribution (40% weight)
        if (pcr != null) {
            if (pcr > 1.3) {
                bullish += 4.0; // High PCR = bullish
            } else if (pcr < 0.7) {
                bearish += 4.0; // Low PCR = bearish
            } else {
                bullish += 2.0;
                bearish += 2.0; // Neutral PCR
            }
        }
        
        // 2. OI Trend contribution (30% weight)
        if ("PUT_HEAVY".equals(oiTrend)) {
            bullish += 3.0; // Put build-up can indicate support
        } else if ("CALL_HEAVY".equals(oiTrend)) {
            bearish += 3.0; // Call build-up can indicate resistance
        } else {
            bullish += 1.5;
            bearish += 1.5;
        }
        
        // 3. Max Pain distance contribution (30% weight)
        if (maxPainDistance != null) {
            if (maxPainDistance > 0) {
                // Spot above max pain - gravitational pull down (slightly bearish)
                bearish += 1.5;
                bullish += 1.0;
            } else {
                // Spot below max pain - gravitational pull up (slightly bullish)
                bullish += 1.5;
                bearish += 1.0;
            }
        }
        
        this.bullishScore = Math.min(10.0, bullish);
        this.bearishScore = Math.min(10.0, bearish);
        
        // Pattern strength - how decisive the signals are
        double diff = Math.abs(bullish - bearish);
        this.patternStrength = Math.min(10.0, diff * 1.5);
    }
}
