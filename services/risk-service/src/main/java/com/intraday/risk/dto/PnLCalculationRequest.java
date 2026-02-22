package com.intraday.risk.dto;

import com.intraday.risk.model.Broker;
import com.intraday.risk.model.OptionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PnLCalculationRequest {
    
    @NotNull(message = "Entry price is required")
    @Positive(message = "Entry price must be positive")
    private BigDecimal entryPrice;
    
    @NotNull(message = "Current price is required")
    @Positive(message = "Current price must be positive")
    private BigDecimal currentPrice;
    
    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;
    
    @NotBlank(message = "Symbol is required")
    private String symbol;
    
    @NotNull(message = "Option type is required")
    private OptionType optionType;
    
    @NotNull(message = "Broker is required")
    private Broker broker;
}
