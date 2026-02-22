package com.intraday.journal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "trades")
public class Trade {
    @Id
    private String id;
    
    private String tradeId;                // TRD_20260220_001
    
    // Basic Info
    private String symbol;                 // NIFTY, BANKNIFTY
    private String optionType;             // CALL, PUT
    private Integer strike;
    private LocalDateTime expiry;
    
    // Entry
    private LocalDateTime entryTimestamp;
    private Double entryPrice;
    private Integer quantity;
    private Double positionValue;
    
    // Market Conditions at Entry
    private Double spotPrice;
    private Double setupScore;
    private Double noTradeScore;
    private MarketRegime marketRegime;
    private String riskMode;               // CONSERVATIVE, BALANCED, AGGRESSIVE
    
    // Exit
    private LocalDateTime exitTimestamp;
    private Double exitPrice;
    private String exitReason;             // TARGET, STOP_LOSS, MANUAL, TIME_BASED
    private Long holdingDurationMinutes;
    
    // PnL
    private Double grossPnl;
    private Double totalCharges;
    private Double netPnl;
    private Double roiPercentage;
    
    // Classification
    private String outcome;                // WIN, LOSS
    private Double riskRewardAchieved;
    
    // Notes
    private String entryNotes;
    private String exitNotes;
    private String emotionalState;         // DISCIPLINED, FEARFUL, GREEDY, CONFIDENT
    private List<String> tags;
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
