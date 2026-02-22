package com.intraday.journal.controller;

import com.intraday.journal.dto.TradeEntryRequest;
import com.intraday.journal.dto.TradeExitRequest;
import com.intraday.journal.dto.TradeResponse;
import com.intraday.journal.service.TradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/journal")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class JournalController {
    
    private final TradeService tradeService;
    
    /**
     * POST /api/journal/entry - Log a new trade entry
     */
    @PostMapping("/entry")
    public Mono<ResponseEntity<TradeResponse>> logEntry(@Valid @RequestBody TradeEntryRequest request) {
        log.info("POST /api/journal/entry - Logging new trade");
        return tradeService.logEntry(request)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response))
                .onErrorResume(error -> {
                    log.error("Error logging trade entry", error);
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
                });
    }
    
    /**
     * POST /api/journal/exit/{tradeId} - Log trade exit
     */
    @PostMapping("/exit/{tradeId}")
    public Mono<ResponseEntity<TradeResponse>> logExit(
            @PathVariable String tradeId,
            @Valid @RequestBody TradeExitRequest request) {
        log.info("POST /api/journal/exit/{} - Logging trade exit", tradeId);
        return tradeService.logExit(tradeId, request)
                .map(ResponseEntity::ok)
                .onErrorResume(error -> {
                    log.error("Error logging trade exit", error);
                    if (error.getMessage().contains("not found")) {
                        return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
                    }
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
                });
    }
    
    /**
     * GET /api/journal/trades - Get all trades
     */
    @GetMapping("/trades")
    public Flux<TradeResponse> getAllTrades(
            @RequestParam(required = false) String symbol,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        log.info("GET /api/journal/trades - symbol: {}, startDate: {}, endDate: {}", symbol, startDate, endDate);
        
        // If date range provided, filter by it
        if (startDate != null && endDate != null) {
            return tradeService.getTradesByDateRange(startDate, endDate, symbol);
        }
        
        // Otherwise, filter by symbol or get all
        if (symbol != null && !symbol.isEmpty()) {
            return tradeService.getTradesBySymbol(symbol);
        }
        
        return tradeService.getAllTrades();
    }
    
    /**
     * GET /api/journal/trades/{tradeId} - Get single trade
     */
    @GetMapping("/trades/{tradeId}")
    public Mono<ResponseEntity<TradeResponse>> getTradeById(@PathVariable String tradeId) {
        log.info("GET /api/journal/trades/{} - Get trade by ID", tradeId);
        return tradeService.getTradeById(tradeId)
                .map(ResponseEntity::ok)
                .onErrorResume(error -> {
                    log.error("Error fetching trade", error);
                    if (error.getMessage().contains("not found")) {
                        return Mono.just(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
                    }
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
                });
    }
}
