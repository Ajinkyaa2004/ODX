package com.intraday.optionchain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

/**
 * MongoDB document representing a complete option chain snapshot
 * Stored for historical analysis and tracking
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "option_chain_snapshots")
public class OptionChainSnapshot {
    
    @Id
    private String id;
    
    /**
     * Symbol (NIFTY or BANKNIFTY)
     */
    private String symbol;
    
    /**
     * Current spot price of underlying
     */
    private Double spotPrice;
    
    /**
     * ATM strike price
     */
    private Double atmStrike;
    
    /**
     * List of strike data (ATM ±2 strikes minimum)
     */
    private List<StrikeData> strikes;
    
    /**
     * Put-Call Ratio based on OI
     */
    private Double pcr;
    
    /**
     * PCR interpretation: BULLISH, BEARISH, NEUTRAL
     */
    private String pcrInterpretation;
    
    /**
     * Max Pain strike price
     * Strike where maximum losses occur for option buyers
     */
    private Double maxPainStrike;
    
    /**
     * Net Call OI change across all strikes
     */
    private Long netCallOIChange;
    
    /**
     * Net Put OI change across all strikes
     */
    private Long netPutOIChange;
    
    /**
     * OI trend direction: CALL_HEAVY, PUT_HEAVY, BALANCED
     */
    private String oiTrend;
    
    /**
     * Overall market sentiment: BULLISH, BEARISH, NEUTRAL
     */
    private String sentiment;
    
    /**
     * Timestamp of data fetch
     */
    private LocalDateTime timestamp;
    
    /**
     * Data source (FYERS, MOCK, etc.)
     */
    private String source;
    
    /**
     * Expiry date of options in this chain
     */
    private String expiry;
    
    /**
     * Calculate PCR (Put OI / Call OI) across all strikes
     */
    public void calculatePCR() {
        if (strikes == null || strikes.isEmpty()) {
            this.pcr = 0.0;
            this.pcrInterpretation = "NEUTRAL";
            return;
        }
        
        long totalCallOI = strikes.stream()
            .filter(s -> s.getCall() != null && s.getCall().getOpenInterest() != null)
            .mapToLong(s -> s.getCall().getOpenInterest())
            .sum();
        
        long totalPutOI = strikes.stream()
            .filter(s -> s.getPut() != null && s.getPut().getOpenInterest() != null)
            .mapToLong(s -> s.getPut().getOpenInterest())
            .sum();
        
        if (totalCallOI == 0) {
            this.pcr = 0.0;
            this.pcrInterpretation = "NEUTRAL";
            return;
        }
        
        this.pcr = (double) totalPutOI / totalCallOI;
        
        // Interpret PCR
        if (pcr > 1.3) {
            this.pcrInterpretation = "BULLISH"; // Heavy put writing by sellers
        } else if (pcr < 0.7) {
            this.pcrInterpretation = "BEARISH"; // Heavy call writing
        } else {
            this.pcrInterpretation = "NEUTRAL";
        }
    }
    
    /**
     * Calculate Max Pain - strike with maximum total OI
     * Simplified version: actual max pain requires price calculation
     */
    public void calculateMaxPain() {
        if (strikes == null || strikes.isEmpty()) {
            this.maxPainStrike = atmStrike;
            return;
        }
        
        StrikeData maxPainCandidate = strikes.stream()
            .max((s1, s2) -> Long.compare(
                s1.getTotalOI() != null ? s1.getTotalOI() : 0L,
                s2.getTotalOI() != null ? s2.getTotalOI() : 0L
            ))
            .orElse(null);
        
        if (maxPainCandidate != null) {
            this.maxPainStrike = maxPainCandidate.getStrikePrice();
        } else {
            this.maxPainStrike = atmStrike;
        }
    }
    
    /**
     * Calculate net OI changes
     */
    public void calculateOIChanges() {
        if (strikes == null || strikes.isEmpty()) {
            this.netCallOIChange = 0L;
            this.netPutOIChange = 0L;
            this.oiTrend = "BALANCED";
            return;
        }
        
        this.netCallOIChange = strikes.stream()
            .filter(s -> s.getCall() != null && s.getCall().getOiChange() != null)
            .mapToLong(s -> s.getCall().getOiChange())
            .sum();
        
        this.netPutOIChange = strikes.stream()
            .filter(s -> s.getPut() != null && s.getPut().getOiChange() != null)
            .mapToLong(s -> s.getPut().getOiChange())
            .sum();
        
        // Determine trend
        long diff = Math.abs(netCallOIChange - netPutOIChange);
        if (diff < 10000) {
            this.oiTrend = "BALANCED";
        } else if (netCallOIChange > netPutOIChange) {
            this.oiTrend = "CALL_HEAVY";
        } else {
            this.oiTrend = "PUT_HEAVY";
        }
    }
    
    /**
     * Determine overall sentiment based on PCR and OI trend
     */
    public void determineSentiment() {
        if (pcr == null || oiTrend == null) {
            this.sentiment = "NEUTRAL";
            return;
        }
        
        int bullishSignals = 0;
        int bearishSignals = 0;
        
        // PCR signal
        if ("BULLISH".equals(pcrInterpretation)) bullishSignals++;
        if ("BEARISH".equals(pcrInterpretation)) bearishSignals++;
        
        // OI trend signal
        if ("PUT_HEAVY".equals(oiTrend)) bullishSignals++; // Put build-up can be bullish
        if ("CALL_HEAVY".equals(oiTrend)) bearishSignals++; // Call build-up can be bearish
        
        if (bullishSignals > bearishSignals) {
            this.sentiment = "BULLISH";
        } else if (bearishSignals > bullishSignals) {
            this.sentiment = "BEARISH";
        } else {
            this.sentiment = "NEUTRAL";
        }
    }
}
