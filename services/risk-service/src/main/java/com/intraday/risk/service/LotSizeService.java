package com.intraday.risk.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class LotSizeService {
    
    @Value("${lot-sizes.nifty:50}")
    private int niftyLotSize;
    
    @Value("${lot-sizes.banknifty:15}")
    private int bankniftyLotSize;
    
    public int getLotSize(String symbol) {
        return switch (symbol.toUpperCase()) {
            case "NIFTY" -> niftyLotSize;
            case "BANKNIFTY", "BANKNIFTY_BANK" -> bankniftyLotSize;
            default -> throw new IllegalArgumentException("Unknown symbol: " + symbol);
        };
    }
}
