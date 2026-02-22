package com.intraday.journal.controller;

import com.intraday.journal.dto.AnalyticsResponse;
import com.intraday.journal.service.AnalyticsService;
import com.intraday.journal.service.ExportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/journal")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AnalyticsController {
    
    private final AnalyticsService analyticsService;
    private final ExportService exportService;
    
    /**
     * GET /api/journal/analytics - Get comprehensive analytics
     */
    @GetMapping("/analytics")
    public Mono<ResponseEntity<AnalyticsResponse>> getAnalytics(
            @RequestParam(required = false) String symbol,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        log.info("GET /api/journal/analytics - symbol: {}, startDate: {}, endDate: {}", symbol, startDate, endDate);
        
        // Default to last 30 days if not provided
        LocalDateTime start = startDate != null ? startDate : LocalDateTime.now().minusDays(30);
        LocalDateTime end = endDate != null ? endDate : LocalDateTime.now();
        
        return analyticsService.getAnalytics(symbol, start, end)
                .map(ResponseEntity::ok)
                .onErrorResume(error -> {
                    log.error("Error fetching analytics", error);
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
                });
    }
    
    /**
     * GET /api/journal/export - Export trades to CSV
     */
    @GetMapping("/export")
    public Mono<ResponseEntity<String>> exportToCsv(
            @RequestParam(required = false) String symbol,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        log.info("GET /api/journal/export - Exporting to CSV");
        
        // Default to last 30 days if not provided
        LocalDateTime start = startDate != null ? startDate : LocalDateTime.now().minusDays(30);
        LocalDateTime end = endDate != null ? endDate : LocalDateTime.now();
        
        return exportService.exportToCsv(symbol, start, end)
                .map(csv -> {
                    HttpHeaders headers = new HttpHeaders();
                    headers.setContentType(MediaType.parseMediaType("text/csv"));
                    headers.setContentDispositionFormData("attachment", "trades_export.csv");
                    return ResponseEntity.ok()
                            .headers(headers)
                            .body(csv);
                })
                .onErrorResume(error -> {
                    log.error("Error exporting to CSV", error);
                    return Mono.just(ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build());
                });
    }
}
