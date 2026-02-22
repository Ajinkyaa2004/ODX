package com.intraday.risk.service;

import com.intraday.risk.dto.ChargesBreakdown;
import com.intraday.risk.dto.PnLCalculationRequest;
import com.intraday.risk.dto.PnLCalculationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class PnLCalculatorService {
    
    private final ChargesCalculatorService chargesCalculatorService;
    
    public PnLCalculationResponse calculatePnL(PnLCalculationRequest request) {
        
        // Calculate gross PnL
        BigDecimal priceDiff = request.getCurrentPrice().subtract(request.getEntryPrice());
        BigDecimal grossPnL = priceDiff
                .multiply(BigDecimal.valueOf(request.getQuantity()))
                .setScale(2, RoundingMode.HALF_UP);
        
        // Calculate charges
        ChargesBreakdown charges = chargesCalculatorService.calculateCharges(
                request.getEntryPrice(),
                request.getCurrentPrice(),
                request.getQuantity(),
                request.getBroker()
        );
        
        // Calculate net PnL
        BigDecimal netPnL = grossPnL
                .subtract(charges.getTotalCharges())
                .setScale(2, RoundingMode.HALF_UP);
        
        // Calculate break-even price
        BigDecimal chargesPerUnit = charges.getTotalCharges()
                .divide(BigDecimal.valueOf(request.getQuantity()), 4, RoundingMode.HALF_UP);
        BigDecimal breakEvenPrice = request.getEntryPrice()
                .add(chargesPerUnit)
                .setScale(2, RoundingMode.HALF_UP);
        
        // Calculate ROI (based on invested amount)
        BigDecimal investedAmount = request.getEntryPrice()
                .multiply(BigDecimal.valueOf(request.getQuantity()));
        BigDecimal roi = netPnL
                .divide(investedAmount, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
        
        // Determine status
        String status;
        if (netPnL.compareTo(BigDecimal.ZERO) > 0) {
            status = "PROFIT";
        } else if (netPnL.compareTo(BigDecimal.ZERO) < 0) {
            status = "LOSS";
        } else {
            status = "BREAKEVEN";
        }
        
        return PnLCalculationResponse.builder()
                .entryPrice(request.getEntryPrice())
                .currentPrice(request.getCurrentPrice())
                .quantity(request.getQuantity())
                .symbol(request.getSymbol())
                .grossPnL(grossPnL)
                .charges(charges)
                .netPnL(netPnL)
                .roi(roi)
                .breakEvenPrice(breakEvenPrice)
                .status(status)
                .build();
    }
}
