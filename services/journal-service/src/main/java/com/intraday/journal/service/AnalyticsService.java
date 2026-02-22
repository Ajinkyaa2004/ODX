package com.intraday.journal.service;

import com.intraday.journal.dto.AnalyticsResponse;
import com.intraday.journal.model.AnalyticsByCategory;
import com.intraday.journal.model.AnalyticsOverall;
import com.intraday.journal.model.Trade;
import com.intraday.journal.repository.TradeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {
    
    private final TradeRepository tradeRepository;
    
    /**
     * Get comprehensive analytics
     */
    public Mono<AnalyticsResponse> getAnalytics(String symbol, LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Computing analytics for symbol: {}, range: {} to {}", symbol, startDate, endDate);
        
        // Fetch all closed trades (those with exit data)
        return (symbol != null && !symbol.isEmpty() 
                ? tradeRepository.findBySymbolAndEntryTimestampBetween(symbol, startDate, endDate)
                : tradeRepository.findByEntryTimestampBetween(startDate, endDate))
                .filter(trade -> trade.getExitTimestamp() != null)  // Only closed trades
                .collectList()
                .map(trades -> {
                    if (trades.isEmpty()) {
                        return createEmptyAnalytics();
                    }
                    
                    AnalyticsOverall overall = computeOverallMetrics(trades);
                    List<AnalyticsByCategory> byScoreRange = computeByScoreRange(trades);
                    List<AnalyticsByCategory> byTime = computeByTimeOfDay(trades);
                    List<AnalyticsByCategory> byRegime = computeByVolatilityRegime(trades);
                    List<AnalyticsByCategory> byRiskMode = computeByRiskMode(trades);
                    
                    return AnalyticsResponse.builder()
                            .overall(overall)
                            .byScoreRange(byScoreRange)
                            .byTime(byTime)
                            .byRegime(byRegime)
                            .byRiskMode(byRiskMode)
                            .build();
                })
                .doOnSuccess(response -> log.info("Analytics computed successfully"))
                .doOnError(error -> log.error("Error computing analytics", error));
    }
    
    /**
     * Compute overall analytics metrics
     */
    private AnalyticsOverall computeOverallMetrics(List<Trade> trades) {
        int totalTrades = trades.size();
        List<Trade> wins = trades.stream().filter(t -> "WIN".equals(t.getOutcome())).collect(Collectors.toList());
        List<Trade> losses = trades.stream().filter(t -> "LOSS".equals(t.getOutcome())).collect(Collectors.toList());
        
        int winCount = wins.size();
        int lossCount = losses.size();
        
        double winRate = totalTrades > 0 ? ((double) winCount / totalTrades) * 100 : 0.0;
        
        double totalPnl = trades.stream()
                .mapToDouble(t -> t.getNetPnl() != null ? t.getNetPnl() : 0.0)
                .sum();
        
        double avgWin = winCount > 0 
                ? wins.stream().mapToDouble(t -> t.getNetPnl() != null ? t.getNetPnl() : 0.0).average().orElse(0.0)
                : 0.0;
        
        double avgLoss = lossCount > 0
                ? losses.stream().mapToDouble(t -> t.getNetPnl() != null ? t.getNetPnl() : 0.0).average().orElse(0.0)
                : 0.0;
        
        double totalWins = wins.stream().mapToDouble(t -> t.getNetPnl() != null ? t.getNetPnl() : 0.0).sum();
        double totalLosses = Math.abs(losses.stream().mapToDouble(t -> t.getNetPnl() != null ? t.getNetPnl() : 0.0).sum());
        
        double profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0.0;
        double expectancy = totalTrades > 0 ? totalPnl / totalTrades : 0.0;
        
        // Calculate consecutive wins/losses
        int[] consecutive = calculateConsecutiveStats(trades);
        
        return AnalyticsOverall.builder()
                .totalTrades(totalTrades)
                .wins(winCount)
                .losses(lossCount)
                .winRate(Math.round(winRate * 100.0) / 100.0)
                .totalPnl(Math.round(totalPnl * 100.0) / 100.0)
                .avgWin(Math.round(avgWin * 100.0) / 100.0)
                .avgLoss(Math.round(avgLoss * 100.0) / 100.0)
                .profitFactor(Math.round(profitFactor * 100.0) / 100.0)
                .expectancy(Math.round(expectancy * 100.0) / 100.0)
                .consecutiveWins(consecutive[0])
                .consecutiveLosses(consecutive[1])
                .maxConsecutiveWins(consecutive[2])
                .maxConsecutiveLosses(consecutive[3])
                .build();
    }
    
    /**
     * Calculate consecutive wins/losses
     */
    private int[] calculateConsecutiveStats(List<Trade> trades) {
        int currentWins = 0;
        int currentLosses = 0;
        int maxWins = 0;
        int maxLosses = 0;
        
        for (Trade trade : trades) {
            if ("WIN".equals(trade.getOutcome())) {
                currentWins++;
                currentLosses = 0;
                maxWins = Math.max(maxWins, currentWins);
            } else if ("LOSS".equals(trade.getOutcome())) {
                currentLosses++;
                currentWins = 0;
                maxLosses = Math.max(maxLosses, currentLosses);
            }
        }
        
        return new int[]{currentWins, currentLosses, maxWins, maxLosses};
    }
    
    /**
     * Compute analytics by score range
     */
    private List<AnalyticsByCategory> computeByScoreRange(List<Trade> trades) {
        Map<String, List<Trade>> grouped = trades.stream()
                .filter(t -> t.getSetupScore() != null)
                .collect(Collectors.groupingBy(t -> getScoreRange(t.getSetupScore())));
        
        return grouped.entrySet().stream()
                .map(entry -> createCategoryAnalytics(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(AnalyticsByCategory::getCategory).reversed())
                .collect(Collectors.toList());
    }
    
    /**
     * Compute analytics by time of day
     */
    private List<AnalyticsByCategory> computeByTimeOfDay(List<Trade> trades) {
        Map<String, List<Trade>> grouped = trades.stream()
                .collect(Collectors.groupingBy(t -> getTimeCategory(t.getEntryTimestamp())));
        
        return grouped.entrySet().stream()
                .map(entry -> createCategoryAnalytics(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparing(AnalyticsByCategory::getCategory))
                .collect(Collectors.toList());
    }
    
    /**
     * Compute analytics by volatility regime
     */
    private List<AnalyticsByCategory> computeByVolatilityRegime(List<Trade> trades) {
        Map<String, List<Trade>> grouped = trades.stream()
                .filter(t -> t.getMarketRegime() != null && t.getMarketRegime().getVolatilityRegime() != null)
                .collect(Collectors.groupingBy(t -> t.getMarketRegime().getVolatilityRegime()));
        
        return grouped.entrySet().stream()
                .map(entry -> createCategoryAnalytics(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
    }
    
    /**
     * Compute analytics by risk mode
     */
    private List<AnalyticsByCategory> computeByRiskMode(List<Trade> trades) {
        Map<String, List<Trade>> grouped = trades.stream()
                .filter(t -> t.getRiskMode() != null)
                .collect(Collectors.groupingBy(Trade::getRiskMode));
        
        return grouped.entrySet().stream()
                .map(entry -> createCategoryAnalytics(entry.getKey(), entry.getValue()))
                .collect(Collectors.toList());
    }
    
    /**
     * Create analytics for a category
     */
    private AnalyticsByCategory createCategoryAnalytics(String category, List<Trade> trades) {
        int totalTrades = trades.size();
        long wins = trades.stream().filter(t -> "WIN".equals(t.getOutcome())).count();
        double winRate = totalTrades > 0 ? ((double) wins / totalTrades) * 100 : 0.0;
        double avgPnl = trades.stream()
                .mapToDouble(t -> t.getNetPnl() != null ? t.getNetPnl() : 0.0)
                .average()
                .orElse(0.0);
        
        return AnalyticsByCategory.builder()
                .category(category)
                .trades(totalTrades)
                .winRate(Math.round(winRate * 100.0) / 100.0)
                .avgPnl(Math.round(avgPnl * 100.0) / 100.0)
                .build();
    }
    
    /**
     * Get score range category
     */
    private String getScoreRange(Double score) {
        if (score >= 8.0) return "8.0-10.0";
        if (score >= 7.0) return "7.0-7.9";
        if (score >= 6.0) return "6.0-6.9";
        if (score >= 5.0) return "5.0-5.9";
        return "0.0-4.9";
    }
    
    /**
     * Get time category
     */
    private String getTimeCategory(LocalDateTime timestamp) {
        int hour = timestamp.getHour();
        int minute = timestamp.getMinute();
        
        if (hour == 9 && minute < 30) return "09:15-09:30";
        if (hour == 9 && minute >= 30) return "09:30-10:00";
        if (hour == 10) return "10:00-11:00";
        if (hour == 11) return "11:00-12:00";
        if (hour == 12) return "12:00-13:00";
        if (hour == 13) return "13:00-14:00";
        if (hour == 14) return "14:00-15:00";
        if (hour >= 15) return "15:00-15:30";
        
        return "Other";
    }
    
    /**
     * Create empty analytics when no trades exist
     */
    private AnalyticsResponse createEmptyAnalytics() {
        return AnalyticsResponse.builder()
                .overall(AnalyticsOverall.builder()
                        .totalTrades(0)
                        .wins(0)
                        .losses(0)
                        .winRate(0.0)
                        .totalPnl(0.0)
                        .avgWin(0.0)
                        .avgLoss(0.0)
                        .profitFactor(0.0)
                        .expectancy(0.0)
                        .consecutiveWins(0)
                        .consecutiveLosses(0)
                        .maxConsecutiveWins(0)
                        .maxConsecutiveLosses(0)
                        .build())
                .byScoreRange(new ArrayList<>())
                .byTime(new ArrayList<>())
                .byRegime(new ArrayList<>())
                .byRiskMode(new ArrayList<>())
                .build();
    }
}
