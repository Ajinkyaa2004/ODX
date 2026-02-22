package com.intraday.journal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarketRegime {
    private String trend;                  // BULLISH, BEARISH, NEUTRAL
    private String vwapStatus;             // ABOVE, BELOW
    private String volatilityRegime;       // EXPANSION, NORMAL, COMPRESSION
    private String timeCategory;           // OPENING_NOISE, PRIME_TIME, CHOP_HOUR, LATE_SESSION
    private String oiConfirmation;         // STRONG, MODERATE, WEAK
}
