package com.intraday.journal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TradeExitRequest {
    @NotNull(message = "Exit price is required")
    @Positive(message = "Exit price must be positive")
    private Double exitPrice;
    
    @NotNull(message = "Exit reason is required")
    private String exitReason;              // TARGET, STOP_LOSS, MANUAL, TIME_BASED
    
    private Double totalCharges;
    
    private String exitNotes;
    private String emotionalState;          // DISCIPLINED, FEARFUL, GREEDY, CONFIDENT
}
