package com.intraday.optionchain.service;

import com.intraday.optionchain.client.FyersOptionChainClient;
import com.intraday.optionchain.model.*;
import com.intraday.optionchain.repository.OptionChainRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for option chain data processing and analysis
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OptionChainService {
    
    private final FyersOptionChainClient fyersClient;
    private final OptionChainRepository repository;
    private final WebClient.Builder webClientBuilder;
    
    /**
     * Fetch and process option chain for a symbol
     * Stores snapshot in MongoDB and returns processed data
     */
    public Mono<OptionChainSnapshot> fetchAndProcessOptionChain(String symbol) {
        log.info("Fetching and processing option chain for {}", symbol);
        
        // Get current spot price from market-data-service
        return getSpotPrice(symbol)
            .flatMap(spotPrice -> {
                String expiry = fyersClient.getCurrentExpiry();
                
                // Fetch option chain from FYERS
                return fyersClient.fetchOptionChain(symbol, spotPrice, expiry)
                    .map(strikes -> {
                        // Create snapshot
                        OptionChainSnapshot snapshot = OptionChainSnapshot.builder()
                            .symbol(symbol)
                            .spotPrice(spotPrice)
                            .atmStrike(calculateATMStrike(spotPrice, symbol))
                            .strikes(strikes)
                            .timestamp(LocalDateTime.now())
                            .source("FYERS")
                            .expiry(expiry)
                            .build();
                        
                        // Calculate all derived metrics
                        snapshot.calculatePCR();
                        snapshot.calculateMaxPain();
                        snapshot.calculateOIChanges();
                        snapshot.determineSentiment();
                        
                        return snapshot;
                    });
            })
            .flatMap(snapshot -> 
                // Save to MongoDB and return
                repository.save(snapshot)
                    .doOnSuccess(saved -> log.info("Saved option chain snapshot for {}: PCR={}, Sentiment={}", 
                        symbol, saved.getPcr(), saved.getSentiment()))
            )
            .onErrorResume(e -> {
                log.error("Error processing option chain for {}: {}", symbol, e.getMessage());
                return Mono.empty();
            });
    }
    
    /**
     * Get spot price from market-data-service
     */
    private Mono<Double> getSpotPrice(String symbol) {
        String marketDataUrl = "http://market-data-service:8081/api/market-data/latest?symbol=" + symbol;
        
        WebClient webClient = webClientBuilder.baseUrl("http://market-data-service:8081").build();
        
        return webClient.get()
            .uri("/api/market-data/latest?symbol=" + symbol)
            .retrieve()
            .bodyToMono(MarketDataResponse.class)
            .map(MarketDataResponse::getClose)
            .onErrorResume(e -> {
                log.warn("Failed to fetch spot price from market-data-service, using mock: {}", e.getMessage());
                // Fallback mock spot prices
                return Mono.just("NIFTY".equals(symbol) ? 21500.0 : 46000.0);
            });
    }
    
    /**
     * Calculate ATM strike based on spot price
     */
    private double calculateATMStrike(double spotPrice, String symbol) {
        int strikeInterval = "BANKNIFTY".equals(symbol) ? 100 : 50;
        return Math.round(spotPrice / strikeInterval) * strikeInterval;
    }
    
    /**
     * Get latest option chain snapshot
     */
    public Mono<OptionChainSnapshot> getLatestSnapshot(String symbol) {
        return repository.findFirstBySymbolOrderByTimestampDesc(symbol)
            .switchIfEmpty(Mono.defer(() -> {
                log.info("No existing snapshot for {}, fetching new data", symbol);
                return fetchAndProcessOptionChain(symbol);
            }));
    }
    
    /**
     * Get historical snapshots
     */
    public Flux<OptionChainSnapshot> getSnapshotHistory(String symbol, int limit) {
        return repository.findTop20BySymbolOrderByTimestampDesc(symbol)
            .take(limit);
    }
    
    /**
     * Get strike recommendations for trading
     * Returns top 2 calls and top 2 puts based on composite scoring
     */
    public Mono<List<StrikeRecommendation>> getStrikeRecommendations(String symbol) {
        return getLatestSnapshot(symbol)
            .map(snapshot -> {
                List<StrikeRecommendation> recommendations = new ArrayList<>();
                
                // Sort strikes by composite score
                List<StrikeData> sortedStrikes = snapshot.getStrikes().stream()
                    .sorted(Comparator.comparing(StrikeData::getCompositeScore).reversed())
                    .collect(Collectors.toList());
                
                // Get best call strikes (top 2)
                List<StrikeData> callCandidates = sortedStrikes.stream()
                    .filter(s -> s.hasCallOIBuildUp() || s.getCall().hasStrongOIBuildUp())
                    .limit(2)
                    .collect(Collectors.toList());
                
                for (StrikeData strike : callCandidates) {
                    recommendations.add(StrikeRecommendation.builder()
                        .symbol(symbol)
                        .recommendationType("CALL_BUY")
                        .strikePrice(strike.getStrikePrice())
                        .confidence(strike.getCompositeScore())
                        .reason(String.format("Strong Call OI build-up: %+d (%.2f%%)", 
                            strike.getCall().getOiChange(), 
                            strike.getCall().getOiChangePercent()))
                        .premium(strike.getCall().getLtp())
                        .liquidity(strike.getCall().getLiquidityScore())
                        .openInterest(strike.getCall().getOpenInterest())
                        .oiChange(strike.getCall().getOiChange())
                        .volume(strike.getCall().getVolume())
                        .delta(strike.getCall().getDelta())
                        .atmDistance(strike.getAtmDistance())
                        .expectedBehavior("BREAKOUT")
                        .marketBias(snapshot.getSentiment())
                        .build());
                }
                
                // Get best put strikes (top 2)
                List<StrikeData> putCandidates = sortedStrikes.stream()
                    .filter(s -> s.hasPutOIBuildUp() || s.getPut().hasStrongOIBuildUp())
                    .limit(2)
                    .collect(Collectors.toList());
                
                for (StrikeData strike : putCandidates) {
                    recommendations.add(StrikeRecommendation.builder()
                        .symbol(symbol)
                        .recommendationType("PUT_BUY")
                        .strikePrice(strike.getStrikePrice())
                        .confidence(strike.getCompositeScore())
                        .reason(String.format("Strong Put OI build-up: %+d (%.2f%%)", 
                            strike.getPut().getOiChange(), 
                            strike.getPut().getOiChangePercent()))
                        .premium(strike.getPut().getLtp())
                        .liquidity(strike.getPut().getLiquidityScore())
                        .openInterest(strike.getPut().getOpenInterest())
                        .oiChange(strike.getPut().getOiChange())
                        .volume(strike.getPut().getVolume())
                        .delta(strike.getPut().getDelta())
                        .atmDistance(strike.getAtmDistance())
                        .expectedBehavior("SUPPORT")
                        .marketBias(snapshot.getSentiment())
                        .build());
                }
                
                log.info("Generated {} recommendations for {}", recommendations.size(), symbol);
                return recommendations;
            });
    }
    
    /**
     * Get OI analysis for Phase 2 integration
     * This is called by quant-engine for scoring
     */
    public Mono<OIAnalysis> getOIAnalysis(String symbol) {
        return getLatestSnapshot(symbol)
            .map(snapshot -> {
                OIAnalysis analysis = OIAnalysis.builder()
                    .symbol(symbol)
                    .pcr(snapshot.getPcr())
                    .pcrInterpretation(snapshot.getPcrInterpretation())
                    .maxPainStrike(snapshot.getMaxPainStrike())
                    .spotPrice(snapshot.getSpotPrice())
                    .maxPainDistance(snapshot.getSpotPrice() - snapshot.getMaxPainStrike())
                    .netCallOIChange(snapshot.getNetCallOIChange())
                    .netPutOIChange(snapshot.getNetPutOIChange())
                    .oiTrend(snapshot.getOiTrend())
                    .sentiment(snapshot.getSentiment())
                    .timestamp(snapshot.getTimestamp().toString())
                    .build();
                
                // Calculate scores
                analysis.calculateScores();
                
                return analysis;
            });
    }
    
    /**
     * Helper class for market data API response
     */
    @lombok.Data
    private static class MarketDataResponse {
        private String symbol;
        private Double close;
        private String timestamp;
    }
}
