package com.intraday.optionchain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents complete data for a single strike price
 * Contains both Call and Put option data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StrikeData {
    
    /**
     * Strike price
     */
    private Double strikePrice;
    
    /**
     * Call option data
     */
    private OptionData call;
    
    /**
     * Put option data
     */
    private OptionData put;
    
    /**
     * Distance from ATM strike (in percentage)
     */
    private Double atmDistance;
    
    /**
     * Is this the ATM strike?
     */
    private Boolean isAtm;
    
    /**
     * Composite score for this strike (0-10)
     * Considers OI, volume, liquidity, and OI changes
     */
    private Double compositeScore;
    
    /**
     * Total OI for this strike (Call OI + Put OI)
     */
    private Long totalOI;
    
    /**
     * PCR for this strike (Put OI / Call OI)
     */
    private Double strikePCR;
    
    /**
     * Calculate composite score for this strike
     * Used for ranking best strikes for entry/exit
     */
    public void calculateCompositeScore() {
        if (call == null || put == null) {
            this.compositeScore = 0.0;
            return;
        }
        
        double score = 0.0;
        
        // 1. Liquidity (30%) - Average of call and put liquidity
        double avgLiquidity = (call.getLiquidityScore() + put.getLiquidityScore()) / 2.0;
        score += avgLiquidity * 0.3;
        
        // 2. OI Build-up (40%) - Strong OI increase indicates conviction
        double oiScore = 0.0;
        if (call.hasStrongOIBuildUp()) oiScore += 5.0;
        if (put.hasStrongOIBuildUp()) oiScore += 5.0;
        if (call.hasOIUnwinding()) oiScore -= 3.0;
        if (put.hasOIUnwinding()) oiScore -= 3.0;
        oiScore = Math.max(0, Math.min(10, oiScore)); // Clamp to 0-10
        score += oiScore * 0.4;
        
        // 3. ATM proximity (20%) - Closer to ATM = better
        double atmScore = 10.0 - (Math.abs(atmDistance != null ? atmDistance : 100.0) / 2.0);
        atmScore = Math.max(0, Math.min(10, atmScore));
        score += atmScore * 0.2;
        
        // 4. Volume (10%) - Higher volume = better execution
        double volumeScore = Math.min((call.getVolume() + put.getVolume()) / 20000.0, 10.0);
        score += volumeScore * 0.1;
        
        this.compositeScore = Math.round(score * 100.0) / 100.0;
    }
    
    /**
     * Calculate total OI (Call + Put)
     */
    public void calculateTotalOI() {
        long callOI = call != null && call.getOpenInterest() != null ? call.getOpenInterest() : 0L;
        long putOI = put != null && put.getOpenInterest() != null ? put.getOpenInterest() : 0L;
        this.totalOI = callOI + putOI;
    }
    
    /**
     * Calculate PCR for this strike
     */
    public void calculateStrikePCR() {
        if (call == null || put == null || 
            call.getOpenInterest() == null || put.getOpenInterest() == null ||
            call.getOpenInterest() == 0) {
            this.strikePCR = 0.0;
            return;
        }
        
        this.strikePCR = (double) put.getOpenInterest() / call.getOpenInterest();
    }
    
    /**
     * Check if this strike is experiencing net Call OI build-up
     */
    public boolean hasCallOIBuildUp() {
        if (call == null || call.getOiChange() == null) return false;
        long callChange = call.getOiChange();
        long putChange = put != null && put.getOiChange() != null ? put.getOiChange() : 0L;
        return callChange > 0 && callChange > putChange;
    }
    
    /**
     * Check if this strike is experiencing net Put OI build-up
     */
    public boolean hasPutOIBuildUp() {
        if (put == null || put.getOiChange() == null) return false;
        long putChange = put.getOiChange();
        long callChange = call != null && call.getOiChange() != null ? call.getOiChange() : 0L;
        return putChange > 0 && putChange > callChange;
    }
}
