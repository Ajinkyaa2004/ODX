package com.intraday.journal.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "analytics_cache")
public class AnalyticsSnapshot {
    @Id
    private String id;
    
    private LocalDate date;
    private String symbol;
    
    private AnalyticsOverall overall;
    private List<AnalyticsByCategory> byScoreRange;
    private List<AnalyticsByCategory> byTime;
    private List<AnalyticsByCategory> byRegime;
    private List<AnalyticsByCategory> byRiskMode;
}
