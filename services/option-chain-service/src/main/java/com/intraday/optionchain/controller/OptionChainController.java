package com.intraday.optionchain.controller;

import com.intraday.optionchain.model.OIAnalysis;
import com.intraday.optionchain.model.OptionChainSnapshot;
import com.intraday.optionchain.model.StrikeRecommendation;
import com.intraday.optionchain.scheduler.OptionChainScheduler;
import com.intraday.optionchain.service.OptionChainService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for option chain operations
 */
@Slf4j
@RestController
@RequestMapping("/api/option-chain")
@RequiredArgsConstructor
public class OptionChainController {
    
    private final OptionChainService optionChainService;
    private final OptionChainScheduler scheduler;
    
    /**
     * Get latest option chain snapshot for a symbol
     * 
     * @param symbol NIFTY or BANKNIFTY
     * @return Latest option chain data with all strikes (ATM ±2)
     */
    @GetMapping("/{symbol}")
    public Mono<ResponseEntity<OptionChainSnapshot>> getOptionChain(@PathVariable String symbol) {
        log.info("GET /api/option-chain/{}", symbol);
        
        return optionChainService.getLatestSnapshot(symbol)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }
    
    /**
     * Get strike recommendations for trading
     * Returns best call and put strikes based on OI analysis
     * 
     * @param symbol NIFTY or BANKNIFTY
     * @return List of recommended strikes with confidence scores
     */
    @GetMapping("/{symbol}/recommended")
    public Mono<ResponseEntity<List<StrikeRecommendation>>> getRecommendedStrikes(@PathVariable String symbol) {
        log.info("GET /api/option-chain/{}/recommended", symbol);
        
        return optionChainService.getStrikeRecommendations(symbol)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }
    
    /**
     * Get OI analysis summary
     * Used by quant-engine for Phase 2 scoring integration
     * 
     * @param symbol NIFTY or BANKNIFTY
     * @return OI analysis with PCR, max pain, sentiment, scores
     */
    @GetMapping("/{symbol}/analysis")
    public Mono<ResponseEntity<OIAnalysis>> getOIAnalysis(@PathVariable String symbol) {
        log.info("GET /api/option-chain/{}/analysis", symbol);
        
        return optionChainService.getOIAnalysis(symbol)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }
    
    /**
     * Get historical option chain snapshots
     * 
     * @param symbol NIFTY or BANKNIFTY
     * @param limit Number of snapshots to return (default 20)
     * @return Historical snapshots ordered by timestamp desc
     */
    @GetMapping("/{symbol}/history")
    public Flux<OptionChainSnapshot> getHistory(
        @PathVariable String symbol,
        @RequestParam(defaultValue = "20") int limit
    ) {
        log.info("GET /api/option-chain/{}/history?limit={}", symbol, limit);
        return optionChainService.getSnapshotHistory(symbol, limit);
    }
    
    /**
     * Manual trigger for option chain fetch
     * Useful for testing or on-demand updates
     * 
     * @param symbol NIFTY or BANKNIFTY
     * @return Success message
     */
    @PostMapping("/{symbol}/fetch")
    public Mono<ResponseEntity<Map<String, String>>> triggerFetch(@PathVariable String symbol) {
        log.info("POST /api/option-chain/{}/fetch", symbol);
        
        scheduler.triggerManualFetch(symbol);
        
        return Mono.just(ResponseEntity.ok(Map.of(
            "status", "triggered",
            "symbol", symbol,
            "message", "Option chain fetch triggered successfully"
        )));
    }
}
