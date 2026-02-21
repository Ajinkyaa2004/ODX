package com.intraday.optionchain.repository;

import com.intraday.optionchain.model.OptionChainSnapshot;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

/**
 * Reactive MongoDB repository for option chain snapshots
 */
@Repository
public interface OptionChainRepository extends ReactiveMongoRepository<OptionChainSnapshot, String> {
    
    /**
     * Find latest snapshot by symbol
     */
    Mono<OptionChainSnapshot> findFirstBySymbolOrderByTimestampDesc(String symbol);
    
    /**
     * Find all snapshots for a symbol, ordered by timestamp descending
     */
    Flux<OptionChainSnapshot> findBySymbolOrderByTimestampDesc(String symbol);
    
    /**
     * Find last N snapshots for a symbol
     */
    Flux<OptionChainSnapshot> findTop20BySymbolOrderByTimestampDesc(String symbol);
    
    /**
     * Delete old snapshots (for cleanup)
     */
    Mono<Long> deleteBySymbolAndTimestampBefore(String symbol, java.time.LocalDateTime timestamp);
}
