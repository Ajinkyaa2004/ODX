package com.intraday.journal.repository;

import com.intraday.journal.model.Trade;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Repository
public interface TradeRepository extends ReactiveMongoRepository<Trade, String> {
    
    Flux<Trade> findBySymbol(String symbol);
    
    Flux<Trade> findBySymbolAndEntryTimestampBetween(String symbol, LocalDateTime start, LocalDateTime end);
    
    Flux<Trade> findByEntryTimestampBetween(LocalDateTime start, LocalDateTime end);
    
    Flux<Trade> findByOutcome(String outcome);
    
    Flux<Trade> findByRiskMode(String riskMode);
    
    Mono<Trade> findByTradeId(String tradeId);
    
    Flux<Trade> findAllByOrderByEntryTimestampDesc();
    
    Flux<Trade> findBySymbolOrderByEntryTimestampDesc(String symbol);
}
