package com.intraday.optionchain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents option data (Call or Put) for a specific strike
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptionData {
    
    /**
     * Open Interest - Total number of outstanding contracts
     */
    private Long openInterest;
    
    /**
     * Change in Open Interest from previous snapshot
     */
    private Long oiChange;
    
    /**
     * Percentage change in Open Interest
     */
    private Double oiChangePercent;
    
    /**
     * OI Acceleration - Rate of change of OI change (2nd derivative)
     */
    private Double oiAcceleration;
    
    /**
     * Trading volume for the day
     */
    private Long volume;
    
    /**
     * Bid price
     */
    private Double bid;
    
    /**
     * Ask price
     */
    private Double ask;
    
    /**
     * Last traded price (LTP)
     */
    private Double ltp;
    
    /**
     * Bid-ask spread width
     */
    private Double spread;
    
    /**
     * Liquidity score (0-10) based on volume and OI
     */
    private Double liquidityScore;
    
    /**
     * IV (Implied Volatility) - if available from FYERS
     */
    private Double iv;
    
    /**
     * Greeks - Delta
     */
    private Double delta;
    
    /**
     * Greeks - Gamma
     */
    private Double gamma;
    
    /**
     * Greeks - Theta
     */
    private Double theta;
    
    /**
     * Greeks - Vega
     */
    private Double vega;
    
    /**
     * Calculate liquidity score based on volume and OI
     */
    public void calculateLiquidityScore() {
        if (volume == null || openInterest == null) {
            this.liquidityScore = 0.0;
            return;
        }
        
        // Simple scoring: higher volume and OI = better liquidity
        // Volume weight: 40%, OI weight: 60%
        double volumeScore = Math.min(volume / 10000.0, 10.0); // Normalize to 0-10
        double oiScore = Math.min(openInterest / 50000.0, 10.0); // Normalize to 0-10
        
        this.liquidityScore = (volumeScore * 0.4) + (oiScore * 0.6);
    }
    
    /**
     * Calculate bid-ask spread
     */
    public void calculateSpread() {
        if (bid != null && ask != null && bid > 0) {
            this.spread = ((ask - bid) / bid) * 100.0; // Percentage spread
        } else {
            this.spread = 0.0;
        }
    }
    
    /**
     * Check if this option has strong OI build-up
     */
    public boolean hasStrongOIBuildUp() {
        return oiChange != null && oiChange > 0 && oiChangePercent != null && oiChangePercent > 15.0;
    }
    
    /**
     * Check if this option is experiencing OI unwinding
     */
    public boolean hasOIUnwinding() {
        return oiChange != null && oiChange < 0 && oiChangePercent != null && oiChangePercent < -10.0;
    }
}
