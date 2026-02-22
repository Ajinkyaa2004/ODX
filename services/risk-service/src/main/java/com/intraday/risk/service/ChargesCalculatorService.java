package com.intraday.risk.service;

import com.intraday.risk.dto.ChargesBreakdown;
import com.intraday.risk.model.Broker;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class ChargesCalculatorService {
    
    @Value("${brokerage.angel-one:20}")
    private int angelOneBrokerage;
    
    @Value("${brokerage.fyers:20}")
    private int fyersBrokerage;
    
    // Charge rates
    private static final BigDecimal STT_RATE = new BigDecimal("0.0005"); // 0.05% on sell side
    private static final BigDecimal EXCHANGE_RATE = new BigDecimal("0.0005"); // 0.05%
    private static final BigDecimal SEBI_RATE_PER_CRORE = new BigDecimal("10"); // ₹10 per crore
    private static final BigDecimal GST_RATE = new BigDecimal("0.18"); // 18%
    private static final BigDecimal STAMP_DUTY_RATE = new BigDecimal("0.00003"); // 0.003% on buy side
    
    public ChargesBreakdown calculateCharges(
            BigDecimal entryPrice, 
            BigDecimal exitPrice, 
            int quantity, 
            Broker broker) {
        
        // Brokerage (flat per order - entry + exit)
        BigDecimal brokerage = calculateBrokerage(broker);
        
        // Position values
        BigDecimal entryValue = entryPrice.multiply(BigDecimal.valueOf(quantity));
        BigDecimal exitValue = exitPrice.multiply(BigDecimal.valueOf(quantity));
        
        // STT (0.05% on sell side only for options)
        BigDecimal stt = exitValue.multiply(STT_RATE).setScale(2, RoundingMode.HALF_UP);
        
        // Exchange charges (0.05% on both entry and exit)
        BigDecimal entryExchange = entryValue.multiply(EXCHANGE_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal exitExchange = exitValue.multiply(EXCHANGE_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal exchangeCharges = entryExchange.add(exitExchange);
        
        // SEBI charges (₹10 per crore on both sides)
        BigDecimal totalTurnover = entryValue.add(exitValue);
        BigDecimal crores = totalTurnover.divide(new BigDecimal("10000000"), 10, RoundingMode.HALF_UP);
        BigDecimal sebiCharges = crores.multiply(SEBI_RATE_PER_CRORE).setScale(2, RoundingMode.HALF_UP);
        
        // GST (18% on brokerage + exchange + SEBI)
        BigDecimal taxableAmount = brokerage.add(exchangeCharges).add(sebiCharges);
        BigDecimal gst = taxableAmount.multiply(GST_RATE).setScale(2, RoundingMode.HALF_UP);
        
        // Stamp duty (0.003% on buy side only)
        BigDecimal stampDuty = entryValue.multiply(STAMP_DUTY_RATE).setScale(2, RoundingMode.HALF_UP);
        
        // Total charges
        BigDecimal totalCharges = brokerage
                .add(stt)
                .add(exchangeCharges)
                .add(sebiCharges)
                .add(gst)
                .add(stampDuty);
        
        return ChargesBreakdown.builder()
                .brokerage(brokerage)
                .stt(stt)
                .exchangeCharges(exchangeCharges)
                .sebiCharges(sebiCharges)
                .gst(gst)
                .stampDuty(stampDuty)
                .totalCharges(totalCharges)
                .build();
    }
    
    private BigDecimal calculateBrokerage(Broker broker) {
        int flatFee = (broker == Broker.ANGEL_ONE) ? angelOneBrokerage : fyersBrokerage;
        // Flat fee per order x 2 (entry + exit)
        return BigDecimal.valueOf(flatFee * 2);
    }
}
