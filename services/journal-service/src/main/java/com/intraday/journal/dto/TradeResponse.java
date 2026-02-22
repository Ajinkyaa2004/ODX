package com.intraday.journal.dto;

import com.intraday.journal.model.MarketRegime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TradeResponse {
    private String id;
    private String tradeId;
    
    // Basic Info
    private String symbol;
    private String optionType;
    private Integer strike;
    private LocalDateTime expiry;
    
    // Entry
    private LocalDateTime entryTimestamp;
    private Double entryPrice;
    private Integer quantity;
    private Double positionValue;
    
    // Market Conditions
    private Double spotPrice;
    private Double setupScore;
    private Double noTradeScore;
    private MarketRegime marketRegime;
    private String riskMode;
    
    // Exit
    private LocalDateTime exitTimestamp;
    private Double exitPrice;
    private String exitReason;
    private Long holdingDurationMinutes;
    
    // PnL
    private Double grossPnl;
    private Double totalCharges;
    private Double netPnl;
    private Double roiPercentage;
    
    // Classification
    private String outcome;
    private Double riskRewardAchieved;
    
    // Notes
    private String entryNotes;
    private String exitNotes;
    private String emotionalState;
    private List<String> tags;
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
