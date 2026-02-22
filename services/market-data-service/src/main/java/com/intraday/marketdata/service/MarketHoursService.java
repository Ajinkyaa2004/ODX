package com.intraday.marketdata.service;

import com.intraday.marketdata.config.MarketConfig;
import com.intraday.marketdata.model.MarketStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.*;

/**
 * Service to manage market hours and determine if market is open
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MarketHoursService {
    
    private final MarketConfig marketConfig;
    
    /**
     * Check if market is currently open
     */
    public boolean isMarketOpen() {
        ZoneId zoneId = ZoneId.of(marketConfig.getTimezone());
        LocalTime now = LocalTime.now(zoneId);
        DayOfWeek dayOfWeek = LocalDate.now(zoneId).getDayOfWeek();
        
        // Market closed on weekends
        if (dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY) {
            return false;
        }
        
        LocalTime startTime = marketConfig.getStartTimeAsLocalTime();
        LocalTime endTime = marketConfig.getEndTimeAsLocalTime();
        
        boolean isOpen = now.isAfter(startTime) && now.isBefore(endTime);
        
        log.debug("Market status check - Current time: {}, Start: {}, End: {}, IsOpen: {}", 
                  now, startTime, endTime, isOpen);
        
        return isOpen;
    }
    
    /**
     * Get detailed market status
     */
    public MarketStatus getMarketStatus() {
        ZoneId zoneId = ZoneId.of(marketConfig.getTimezone());
        LocalDateTime now = LocalDateTime.now(zoneId);
        boolean isOpen = isMarketOpen();
        
        LocalDateTime nextOpen = calculateNextOpen(now);
        LocalDateTime nextClose = calculateNextClose(now);
        
        String message = isOpen 
            ? String.format("Market is open. Closes at %s IST", marketConfig.getEndTime())
            : String.format("Market is closed. Opens at %s IST", marketConfig.getStartTime());
        
        return MarketStatus.builder()
                .isOpen(isOpen)
                .currentTime(now)
                .nextOpen(nextOpen)
                .nextClose(nextClose)
                .message(message)
                .build();
    }
    
    private LocalDateTime calculateNextOpen(LocalDateTime now) {
        LocalTime startTime = marketConfig.getStartTimeAsLocalTime();
        LocalDate today = now.toLocalDate();
        LocalDateTime nextOpen = LocalDateTime.of(today, startTime);
        
        // If already past today's open time, move to next trading day
        if (now.isAfter(nextOpen)) {
            nextOpen = nextOpen.plusDays(1);
        }
        
        // Skip weekends
        while (nextOpen.getDayOfWeek() == DayOfWeek.SATURDAY || 
               nextOpen.getDayOfWeek() == DayOfWeek.SUNDAY) {
            nextOpen = nextOpen.plusDays(1);
        }
        
        return nextOpen;
    }
    
    private LocalDateTime calculateNextClose(LocalDateTime now) {
        if (!isMarketOpen()) {
            return null;
        }
        
        LocalTime endTime = marketConfig.getEndTimeAsLocalTime();
        LocalDate today = now.toLocalDate();
        return LocalDateTime.of(today, endTime);
    }
}
