package com.intraday.optionchain.scheduler;

import com.intraday.optionchain.service.OptionChainService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Scheduler for automatic option chain data fetching
 * Runs every 3 minutes during market hours
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OptionChainScheduler {
    
    private final OptionChainService optionChainService;
    
    // Market hours: 9:15 AM to 3:30 PM IST
    private static final LocalTime MARKET_OPEN = LocalTime.of(9, 15);
    private static final LocalTime MARKET_CLOSE = LocalTime.of(15, 30);
    
    /**
     * Fetch option chain data every 3 minutes (180000 ms)
     * Only runs during market hours
     */
    @Scheduled(fixedDelay = 180000, initialDelay = 10000)
    public void fetchOptionChainData() {
        LocalTime now = LocalTime.now();
        
        // Check if within market hours
        if (!isMarketHours(now)) {
            log.debug("Outside market hours, skipping option chain fetch");
            return;
        }
        
        log.info("========================================");
        log.info("Scheduled Option Chain Fetch - {}", LocalDateTime.now());
        log.info("========================================");
        
        // Fetch for NIFTY
        optionChainService.fetchAndProcessOptionChain("NIFTY")
            .doOnSuccess(snapshot -> log.info("✓ NIFTY option chain updated: PCR={}, Sentiment={}", 
                snapshot.getPcr(), snapshot.getSentiment()))
            .doOnError(e -> log.error("✗ Failed to fetch NIFTY option chain: {}", e.getMessage()))
            .subscribe();
        
        // Fetch for BANKNIFTY
        optionChainService.fetchAndProcessOptionChain("BANKNIFTY")
            .doOnSuccess(snapshot -> log.info("✓ BANKNIFTY option chain updated: PCR={}, Sentiment={}", 
                snapshot.getPcr(), snapshot.getSentiment()))
            .doOnError(e -> log.error("✗ Failed to fetch BANKNIFTY option chain: {}", e.getMessage()))
            .subscribe();
    }
    
    /**
     * Check if current time is within market hours
     */
    private boolean isMarketHours(LocalTime time) {
        // For development, allow fetching outside market hours
        // Comment out the return true below for production
        return true; // Development mode - always fetch
        
        // Production:
        // return time.isAfter(MARKET_OPEN) && time.isBefore(MARKET_CLOSE);
    }
    
    /**
     * Manual trigger for option chain fetch (for testing)
     * Can be called via REST endpoint
     */
    public void triggerManualFetch(String symbol) {
        log.info("Manual trigger for {} option chain fetch", symbol);
        
        optionChainService.fetchAndProcessOptionChain(symbol)
            .doOnSuccess(snapshot -> log.info("✓ Manual fetch successful for {}: PCR={}", 
                symbol, snapshot.getPcr()))
            .doOnError(e -> log.error("✗ Manual fetch failed for {}: {}", symbol, e.getMessage()))
            .subscribe();
    }
}
