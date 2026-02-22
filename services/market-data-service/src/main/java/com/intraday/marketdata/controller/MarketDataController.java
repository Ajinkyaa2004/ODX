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
    
    /**
     * Get OHLC data for charting with indicators
     */
    @GetMapping(value = "/ohlc/{symbol}", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<java.util.List<Map<String, Object>>> getOHLCData(
            @PathVariable String symbol,
            @RequestParam(defaultValue = "5m") String timeframe,
            @RequestParam(defaultValue = "50") int limit) {
        log.info("Fetching OHLC data for {} (timeframe: {}, limit: {})", symbol, timeframe, limit);
        return marketDataService.getOHLCData(symbol.toUpperCase(), timeframe, limit);
    }
    
    /**
     * Get global market indices
     * Returns major global indices like S&P 500, Nasdaq, Dow, Nikkei, Hang Seng, India VIX
     */
    @GetMapping(value = "/global-indices", produces = MediaType.APPLICATION_JSON_VALUE)
    public Mono<Map<String, Object>> getGlobalIndices() {
        log.info("Fetching global indices");
        // Return mock data for now - can be replaced with real API integration later
        return Mono.just(Map.of(
            "indices", java.util.List.of(
                Map.of("name", "S&P 500", "symbol", "SPX", "value", 5850.23, "change", 45.12, "changePercent", 0.78),
                Map.of("name", "Nasdaq", "symbol", "NDX", "value", 18432.65, "change", -23.45, "changePercent", -0.13),
                Map.of("name", "Dow", "symbol", "DJI", "value", 42156.78, "change", 123.45, "changePercent", 0.29),
                Map.of("name", "Nikkei", "symbol", "N225", "value", 38245.12, "change", 89.34, "changePercent", 0.23),
                Map.of("name", "Hang Seng", "symbol", "HSI", "value", 20123.45, "change", -156.78, "changePercent", -0.77),
                Map.of("name", "India VIX", "symbol", "INDIAVIX", "value", 14.25, "change", 0.45, "changePercent", 3.26)
            ),
            "timestamp", System.currentTimeMillis()
        ));
    }
}
