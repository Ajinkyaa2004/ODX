package com.intraday.journal.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TradeEntryRequest {
    @NotNull(message = "Symbol is required")
    private String symbol;
    
    @NotNull(message = "Option type is required")
    private String optionType;              // CALL, PUT
    
    @NotNull(message = "Strike is required")
    private Integer strike;
    
    private LocalDateTime expiry;
    
    @NotNull(message = "Entry price is required")
    @Positive(message = "Entry price must be positive")
    private Double entryPrice;
    
    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;
    
    // Market conditions at entry
    private Double spotPrice;
    private Double setupScore;
    private Double noTradeScore;
    private String trend;
    private String vwapStatus;
    private String volatilityRegime;
    private String timeCategory;
    private String oiConfirmation;
    private String riskMode;
    
    // Optional notes
    private String entryNotes;
    private List<String> tags;
}
