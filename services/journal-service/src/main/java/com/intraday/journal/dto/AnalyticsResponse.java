package com.intraday.journal.dto;

import com.intraday.journal.model.AnalyticsByCategory;
import com.intraday.journal.model.AnalyticsOverall;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {
    private AnalyticsOverall overall;
    private List<AnalyticsByCategory> byScoreRange;
    private List<AnalyticsByCategory> byTime;
    private List<AnalyticsByCategory> byRegime;
    private List<AnalyticsByCategory> byRiskMode;
}
