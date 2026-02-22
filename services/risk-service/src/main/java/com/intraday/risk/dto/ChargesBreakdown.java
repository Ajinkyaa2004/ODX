package com.intraday.risk.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChargesBreakdown {
    private BigDecimal brokerage;
    private BigDecimal stt;
    private BigDecimal exchangeCharges;
    private BigDecimal sebiCharges;
    private BigDecimal gst;
    private BigDecimal stampDuty;
    private BigDecimal totalCharges;
}
