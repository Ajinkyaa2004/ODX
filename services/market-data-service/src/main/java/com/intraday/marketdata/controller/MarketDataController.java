package com.intraday.marketdata.controller;

import com.intraday.marketdata.model.LivePrice;
import com.intraday.marketdata.model.MarketStatus;
import com.intraday.marketdata.service.MarketDataService;
import com.intraday.marketdata.service.MarketHoursService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * REST Controller for market data endpoints
 */
@Slf4j
@RestController
@RequestMapping("/api/market-data")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class MarketDataController {
    
    private final MarketDataService marketDataService;
    private final MarketHoursService marketHoursService;
    
    /**
     * Get latest price for a symbol
     */
    @GetMapping(value = "/live/{symbol}", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<LivePrice> getLatestPrice(@PathVariable String symbol) {
        log.info("Fetching latest price for: {}", symbol);
        return marketDataService.getLatestPrice(symbol.toUpperCase());
    }
    
    /**
     * Get historical snapshots
     */
    @GetMapping(value = "/history/{symbol}", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<Map<String, Object>> getHistoricalSnapshots(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "1") int hours) {
        log.info("Fetching historical snapshots for {} (last {} hours)", symbol, hours);
        return marketDataService.getHistoricalSnapshots(symbol.toUpperCase(), hours);
    }
    
    /**
     * Get market status
     */
    @GetMapping(value = "/status", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<MarketStatus> getMarketStatus() {
        log.info("Fetching market status");
        return Mono.just(marketHoursService.getMarketStatus());
    }
}
