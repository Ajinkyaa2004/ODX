package com.intraday.journal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsOverall {
    private Integer totalTrades;
    private Integer wins;
    private Integer losses;
    private Double winRate;
    private Double totalPnl;
    private Double avgWin;
    private Double avgLoss;
    private Double profitFactor;
    private Double expectancy;
    private Integer consecutiveWins;
    private Integer consecutiveLosses;
    private Integer maxConsecutiveWins;
    private Integer maxConsecutiveLosses;
}
