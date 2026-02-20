package com.intraday.marketdata.repository;

import com.intraday.marketdata.model.MarketSnapshot;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

/**
 * Repository for market snapshots
 */
@Repository
public interface MarketSnapshotRepository extends ReactiveMongoRepository<MarketSnapshot, String> {
    
    Flux<MarketSnapshot> findBySymbolAndTimestampAfterOrderByTimestampDesc(String symbol, LocalDateTime after);
    
    Mono<MarketSnapshot> findFirstBySymbolOrderByTimestampDesc(String symbol);
    
    Flux<MarketSnapshot> findBySymbolOrderByTimestampDesc(String symbol);
}
