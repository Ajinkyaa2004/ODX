package com.intraday.journal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsByCategory {
    private String category;               // e.g., "8.0-10.0" or "09:30-10:00"
    private Integer trades;
    private Double winRate;
    private Double avgPnl;
}
