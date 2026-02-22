package com.intraday.risk.service;

import com.intraday.risk.dto.ChargesBreakdown;
import com.intraday.risk.dto.PositionSizingRequest;
import com.intraday.risk.dto.PositionSizingResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class PositionSizingService {
    
    private final LotSizeService lotSizeService;
    private final ChargesCalculatorService chargesCalculatorService;
    
    public PositionSizingResponse calculatePositionSize(PositionSizingRequest request) {
        
        // Get lot size for the symbol
        int lotSize = lotSizeService.getLotSize(request.getSymbol());
        
        // Calculate risk and reward per unit
        BigDecimal riskPerUnit = request.getEntryPrice().subtract(request.getStopLoss()).abs();
        BigDecimal rewardPerUnit = request.getTarget().subtract(request.getEntryPrice()).abs();
        
        // Calculate risk amount based on capital and risk percentage
        BigDecimal riskAmount = request.getCapital()
                .multiply(BigDecimal.valueOf(request.getRiskPercentage()))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        
        // Calculate maximum quantity to risk
        int maxQuantity = riskAmount.divide(riskPerUnit, 0, RoundingMode.DOWN).intValue();
        
        // Calculate max lots (rounded down to whole lots)
        int maxLots = maxQuantity / lotSize;
        
        // Ensure at least 1 lot if capital allows
        if (maxLots == 0 && request.getCapital().compareTo(request.getEntryPrice().multiply(BigDecimal.valueOf(lotSize))) > 0) {
            maxLots = 1;
        }
        
        // Calculate position size
        int positionSize = maxLots * lotSize;
        
        // Calculate position value
        BigDecimal positionValue = request.getEntryPrice()
                .multiply(BigDecimal.valueOf(positionSize))
                .setScale(2, RoundingMode.HALF_UP);
        
        // Recalculate actual risk and reward amounts
        BigDecimal actualRiskAmount = riskPerUnit
                .multiply(BigDecimal.valueOf(positionSize))
                .setScale(2, RoundingMode.HALF_UP);
        
        BigDecimal rewardAmount = rewardPerUnit
                .multiply(BigDecimal.valueOf(positionSize))
                .setScale(2, RoundingMode.HALF_UP);
        
        // Calculate risk-reward ratio
        BigDecimal riskRewardRatio = BigDecimal.ZERO;
        if (riskPerUnit.compareTo(BigDecimal.ZERO) > 0) {
            riskRewardRatio = rewardPerUnit
                    .divide(riskPerUnit, 2, RoundingMode.HALF_UP);
        }
        
        // Calculate charges
        ChargesBreakdown charges = chargesCalculatorService.calculateCharges(
                request.getEntryPrice(),
                request.getTarget(),
                positionSize,
                request.getBroker()
        );
        
        // Calculate break-even price
        BigDecimal chargesPerUnit = charges.getTotalCharges()
                .divide(BigDecimal.valueOf(positionSize), 2, RoundingMode.HALF_UP);
        BigDecimal breakEvenPrice = request.getEntryPrice()
                .add(chargesPerUnit)
                .setScale(2, RoundingMode.HALF_UP);
        
        // Calculate PnL at target
        BigDecimal grossPnLAtTarget = rewardAmount;
        BigDecimal netPnLAtTarget = grossPnLAtTarget
                .subtract(charges.getTotalCharges())
                .setScale(2, RoundingMode.HALF_UP);
        
        // Calculate ROI
        BigDecimal roi = BigDecimal.ZERO;
        if (actualRiskAmount.compareTo(BigDecimal.ZERO) > 0) {
            roi = netPnLAtTarget
                    .divide(actualRiskAmount, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        }
        
        return PositionSizingResponse.builder()
                .capital(request.getCapital())
                .riskPercentage(request.getRiskPercentage())
                .entryPrice(request.getEntryPrice())
                .stopLoss(request.getStopLoss())
                .target(request.getTarget())
                .symbol(request.getSymbol())
                .optionType(request.getOptionType().toString())
                .strike(request.getStrike())
                .broker(request.getBroker().toString())
                .riskPerUnit(riskPerUnit)
                .rewardPerUnit(rewardPerUnit)
                .lotSize(lotSize)
                .maxLots(maxLots)
                .positionSize(positionSize)
                .positionValue(positionValue)
                .riskAmount(actualRiskAmount)
                .rewardAmount(rewardAmount)
                .riskRewardRatio(riskRewardRatio)
                .charges(charges)
                .breakEvenPrice(breakEvenPrice)
                .grossPnLAtTarget(grossPnLAtTarget)
                .netPnLAtTarget(netPnLAtTarget)
                .roi(roi)
                .build();
    }
}
