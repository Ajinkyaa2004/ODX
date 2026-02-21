package com.intraday.optionchain.client;

import com.intraday.optionchain.model.OptionData;
import com.intraday.optionchain.model.StrikeData;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Client for fetching option chain data from FYERS API
 * Currently uses mock data - will be replaced with actual FYERS API integration
 */
@Slf4j
@Component
public class FyersOptionChainClient {
    
    private final WebClient webClient;
    private final String fyersApiKey;
    private final String fyersAccessToken;
    private final Random random = new Random();
    
    public FyersOptionChainClient(
        WebClient.Builder webClientBuilder,
        @Value("${fyers.api.key:MOCK_KEY}") String fyersApiKey,
        @Value("${fyers.api.token:MOCK_TOKEN}") String fyersAccessToken
    ) {
        this.webClient = webClientBuilder
            .baseUrl("https://api.fyers.in/data-rest/v2")
            .build();
        this.fyersApiKey = fyersApiKey;
        this.fyersAccessToken = fyersAccessToken;
        
        log.info("FYERS Option Chain Client initialized (mode: {})", 
            "MOCK_KEY".equals(fyersApiKey) ? "MOCK" : "LIVE");
    }
    
    /**
     * Fetch option chain data for a symbol
     * Currently returns mock data for development/testing
     * 
     * @param symbol NIFTY or BANKNIFTY
     * @param spotPrice Current spot price
     * @param expiry Expiry date (format: YYYYMMDD)
     * @return List of strike data (ATM ±2 strikes)
     */
    public Mono<List<StrikeData>> fetchOptionChain(String symbol, double spotPrice, String expiry) {
        log.debug("Fetching option chain for {} at spot {}", symbol, spotPrice);
        
        // For now, use mock data
        // TODO: Replace with actual FYERS API call when ready
        if ("MOCK_KEY".equals(fyersApiKey)) {
            return Mono.just(generateMockOptionChain(symbol, spotPrice));
        }
        
        // Actual FYERS API implementation (placeholder)
        return fetchFromFyersAPI(symbol, spotPrice, expiry)
            .onErrorResume(e -> {
                log.error("Error fetching from FYERS API, falling back to mock data: {}", e.getMessage());
                return Mono.just(generateMockOptionChain(symbol, spotPrice));
            });
    }
    
    /**
     * Fetch option chain from FYERS API (actual implementation)
     * This is a placeholder - needs actual FYERS option chain endpoint
     */
    private Mono<List<StrikeData>> fetchFromFyersAPI(String symbol, double spotPrice, String expiry) {
        // FYERS option chain endpoint format (example):
        // GET /optionchain?symbol={symbol}&expiry={expiry}
        
        // TODO: Implement actual FYERS API call
        // For now, return mock data
        return Mono.just(generateMockOptionChain(symbol, spotPrice));
    }
    
    /**
     * Generate mock option chain data for testing
     */
    private List<StrikeData> generateMockOptionChain(String symbol, double spotPrice) {
        List<StrikeData> strikes = new ArrayList<>();
        
        // Determine strike interval based on symbol
        int strikeInterval = "BANKNIFTY".equals(symbol) ? 100 : 50;
        
        // Calculate ATM strike (rounded to nearest strike interval)
        double atmStrike = Math.round(spotPrice / strikeInterval) * strikeInterval;
        
        // Generate ATM ±2 strikes (5 strikes total)
        for (int i = -2; i <= 2; i++) {
            double strike = atmStrike + (i * strikeInterval);
            
            StrikeData strikeData = StrikeData.builder()
                .strikePrice(strike)
                .isAtm(i == 0)
                .atmDistance(((strike - atmStrike) / atmStrike) * 100.0)
                .call(generateMockOptionData("CALL", strike, spotPrice))
                .put(generateMockOptionData("PUT", strike, spotPrice))
                .build();
            
            // Calculate derived fields
            strikeData.calculateTotalOI();
            strikeData.calculateStrikePCR();
            strikeData.calculateCompositeScore();
            
            strikes.add(strikeData);
        }
        
        log.debug("Generated {} mock strikes for {} (ATM: {})", strikes.size(), symbol, atmStrike);
        return strikes;
    }
    
    /**
     * Generate mock option data (Call or Put)
     */
    private OptionData generateMockOptionData(String type, double strike, double spotPrice) {
        // Calculate ITM/OTM status
        boolean isITM = ("CALL".equals(type) && spotPrice > strike) || 
                        ("PUT".equals(type) && spotPrice < strike);
        
        // Generate realistic OI and volume
        long baseOI = 100000 + random.nextInt(400000);
        long baseVolume = 10000 + random.nextInt(40000);
        
        // ITM options have higher OI
        long oi = isITM ? (long)(baseOI * 1.5) : baseOI;
        long volume = isITM ? (long)(baseVolume * 1.3) : baseVolume;
        
        // Generate OI change (-10% to +30%)
        long oiChange = (long)(oi * (random.nextDouble() * 0.4 - 0.1));
        double oiChangePercent = (oiChange / (double) oi) * 100.0;
        
        // Generate price data
        double distance = Math.abs(spotPrice - strike);
        double intrinsicValue = Math.max(0, isITM ? distance : 0);
        double timeValue = 20 + random.nextDouble() * 50;
        double ltp = intrinsicValue + timeValue;
        
        double bid = ltp * 0.98;
        double ask = ltp * 1.02;
        
        OptionData optionData = OptionData.builder()
            .openInterest(oi)
            .oiChange(oiChange)
            .oiChangePercent(oiChangePercent)
            .oiAcceleration(random.nextDouble() * 2000 - 1000)
            .volume(volume)
            .ltp(ltp)
            .bid(bid)
            .ask(ask)
            .iv(0.15 + random.nextDouble() * 0.20) // IV between 15% and 35%
            .delta("CALL".equals(type) ? 
                (isITM ? 0.6 + random.nextDouble() * 0.3 : 0.1 + random.nextDouble() * 0.3) :
                (isITM ? -0.6 - random.nextDouble() * 0.3 : -0.1 - random.nextDouble() * 0.3))
            .build();
        
        // Calculate spread and liquidity
        optionData.calculateSpread();
        optionData.calculateLiquidityScore();
        
        return optionData;
    }
    
    /**
     * Get current expiry date
     * For now, returns a mock expiry (current week's Thursday)
     */
    public String getCurrentExpiry() {
        // TODO: Implement actual expiry calculation (weekly/monthly)
        // For NIFTY/BANKNIFTY weekly options expire on Thursday
        return "20240214"; // Mock expiry
    }
}
