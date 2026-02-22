package com.intraday.journal.repository;

import com.intraday.journal.model.AnalyticsSnapshot;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Mono;

import java.time.LocalDate;

@Repository
public interface AnalyticsRepository extends ReactiveMongoRepository<AnalyticsSnapshot, String> {
    
    Mono<AnalyticsSnapshot> findByDateAndSymbol(LocalDate date, String symbol);
    
    Mono<AnalyticsSnapshot> findTopBySymbolOrderByDateDesc(String symbol);
}
