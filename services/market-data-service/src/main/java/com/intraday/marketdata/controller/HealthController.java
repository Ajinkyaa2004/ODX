package com.intraday.marketdata.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping
public class HealthController {

    @GetMapping("/health")
    public Mono<ResponseEntity<Map<String, Object>>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("service", "market-data-service");
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("port", 8081);
        
        return Mono.just(ResponseEntity.ok(response));
    }

    @GetMapping("/api/market-data/health")
    public Mono<ResponseEntity<Map<String, Object>>> apiHealth() {
        return health();
    }
}
