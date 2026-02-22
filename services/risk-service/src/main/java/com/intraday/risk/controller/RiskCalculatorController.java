package com.intraday.risk.controller;

import com.intraday.risk.dto.PnLCalculationRequest;
import com.intraday.risk.dto.PnLCalculationResponse;
import com.intraday.risk.dto.PositionSizingRequest;
import com.intraday.risk.dto.PositionSizingResponse;
import com.intraday.risk.service.PnLCalculatorService;
import com.intraday.risk.service.PositionSizingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

@Slf4j
@RestController
@RequestMapping
@RequiredArgsConstructor
public class RiskCalculatorController {
    
    private final PositionSizingService positionSizingService;
    private final PnLCalculatorService pnlCalculatorService;
    
    @PostMapping("/calculate-position")
    public Mono<ResponseEntity<PositionSizingResponse>> calculatePosition(
            @Valid @RequestBody PositionSizingRequest request) {
        
        log.info("Calculating position size for symbol: {}, capital: {}, risk: {}%", 
                request.getSymbol(), request.getCapital(), request.getRiskPercentage());
        
        try {
            PositionSizingResponse response = positionSizingService.calculatePositionSize(request);
            log.info("Position calculated - Lots: {}, Position Size: {}, Risk Amount: {}", 
                    response.getMaxLots(), response.getPositionSize(), response.getRiskAmount());
            
            return Mono.just(ResponseEntity.ok(response));
        } catch (Exception e) {
            log.error("Error calculating position size", e);
            return Mono.just(ResponseEntity.internalServerError().build());
        }
    }
    
    @PostMapping("/calculate-pnl")
    public Mono<ResponseEntity<PnLCalculationResponse>> calculatePnL(
            @Valid @RequestBody PnLCalculationRequest request) {
        
        log.info("Calculating PnL for symbol: {}, entry: {}, current: {}, quantity: {}", 
                request.getSymbol(), request.getEntryPrice(), request.getCurrentPrice(), request.getQuantity());
        
        try {
            PnLCalculationResponse response = pnlCalculatorService.calculatePnL(request);
            log.info("PnL calculated - Gross: {}, Net: {}, Status: {}", 
                    response.getGrossPnL(), response.getNetPnL(), response.getStatus());
            
            return Mono.just(ResponseEntity.ok(response));
        } catch (Exception e) {
            log.error("Error calculating PnL", e);
            return Mono.just(ResponseEntity.internalServerError().build());
        }
    }
}
