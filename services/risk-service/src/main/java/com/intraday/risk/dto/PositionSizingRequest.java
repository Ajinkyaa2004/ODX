package com.intraday.risk.dto;

import com.intraday.risk.model.Broker;
import com.intraday.risk.model.OptionType;
import com.intraday.risk.model.RiskMode;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PositionSizingRequest {
    
    @NotNull(message = "Capital is required")
    @Positive(message = "Capital must be positive")
    private BigDecimal capital;
    
    @NotNull(message = "Risk percentage is required")
    @DecimalMin(value = "0.1", message = "Risk percentage must be at least 0.1%")
    @DecimalMax(value = "5.0", message = "Risk percentage must not exceed 5%")
    private Double riskPercentage;
    
    @NotNull(message = "Entry price is required")
    @Positive(message = "Entry price must be positive")
    private BigDecimal entryPrice;
    
    @NotNull(message = "Stop loss is required")
    @Positive(message = "Stop loss must be positive")
    private BigDecimal stopLoss;
    
    @NotNull(message = "Target is required")
    @Positive(message = "Target must be positive")
    private BigDecimal target;
    
    @NotBlank(message = "Symbol is required")
    private String symbol;
    
    @NotNull(message = "Option type is required")
    private OptionType optionType;
    
    @NotNull(message = "Strike is required")
    @Positive(message = "Strike must be positive")
    private Integer strike;
    
    @NotNull(message = "Broker is required")
    private Broker broker;
    
    private RiskMode riskMode;
}
