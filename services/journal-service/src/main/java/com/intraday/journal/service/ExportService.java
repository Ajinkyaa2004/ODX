package com.intraday.journal.service;

import com.intraday.journal.model.Trade;
import com.intraday.journal.repository.TradeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExportService {
    
    private final TradeRepository tradeRepository;
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    
    /**
     * Export trades to CSV format
     */
    public Mono<String> exportToCsv(String symbol, LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Exporting trades to CSV for symbol: {}, range: {} to {}", symbol, startDate, endDate);
        
        return (symbol != null && !symbol.isEmpty()
                ? tradeRepository.findBySymbolAndEntryTimestampBetween(symbol, startDate, endDate)
                : tradeRepository.findByEntryTimestampBetween(startDate, endDate))
                .collectList()
                .map(this::convertToCsv)
                .doOnSuccess(csv -> log.info("CSV export completed successfully"))
                .doOnError(error -> log.error("Error exporting to CSV", error));
    }
    
    /**
     * Convert list of trades to CSV string
     */
    private String convertToCsv(List<Trade> trades) {
        StringBuilder csv = new StringBuilder();
        
        // Header
        csv.append("Trade ID,Symbol,Option Type,Strike,Entry Time,Entry Price,Exit Time,Exit Price,")
           .append("Quantity,Position Value,Holding Duration (min),Setup Score,No-Trade Score,")
           .append("Trend,VWAP Status,Volatility Regime,Time Category,OI Confirmation,Risk Mode,")
           .append("Exit Reason,Gross PnL,Charges,Net PnL,ROI %,Outcome,Emotional State,")
           .append("Entry Notes,Exit Notes,Tags\n");
        
        // Data rows
        for (Trade trade : trades) {
            csv.append(escapeCSV(trade.getTradeId())).append(",");
            csv.append(escapeCSV(trade.getSymbol())).append(",");
            csv.append(escapeCSV(trade.getOptionType())).append(",");
            csv.append(trade.getStrike()).append(",");
            csv.append(escapeCSV(formatDateTime(trade.getEntryTimestamp()))).append(",");
            csv.append(trade.getEntryPrice()).append(",");
            csv.append(escapeCSV(formatDateTime(trade.getExitTimestamp()))).append(",");
            csv.append(trade.getExitPrice() != null ? trade.getExitPrice() : "").append(",");
            csv.append(trade.getQuantity()).append(",");
            csv.append(trade.getPositionValue()).append(",");
            csv.append(trade.getHoldingDurationMinutes() != null ? trade.getHoldingDurationMinutes() : "").append(",");
            csv.append(trade.getSetupScore() != null ? trade.getSetupScore() : "").append(",");
            csv.append(trade.getNoTradeScore() != null ? trade.getNoTradeScore() : "").append(",");
            
            // Market regime fields
            if (trade.getMarketRegime() != null) {
                csv.append(escapeCSV(trade.getMarketRegime().getTrend())).append(",");
                csv.append(escapeCSV(trade.getMarketRegime().getVwapStatus())).append(",");
                csv.append(escapeCSV(trade.getMarketRegime().getVolatilityRegime())).append(",");
                csv.append(escapeCSV(trade.getMarketRegime().getTimeCategory())).append(",");
                csv.append(escapeCSV(trade.getMarketRegime().getOiConfirmation())).append(",");
            } else {
                csv.append(",,,,,");
            }
            
            csv.append(escapeCSV(trade.getRiskMode())).append(",");
            csv.append(escapeCSV(trade.getExitReason())).append(",");
            csv.append(trade.getGrossPnl() != null ? trade.getGrossPnl() : "").append(",");
            csv.append(trade.getTotalCharges() != null ? trade.getTotalCharges() : "").append(",");
            csv.append(trade.getNetPnl() != null ? trade.getNetPnl() : "").append(",");
            csv.append(trade.getRoiPercentage() != null ? trade.getRoiPercentage() : "").append(",");
            csv.append(escapeCSV(trade.getOutcome())).append(",");
            csv.append(escapeCSV(trade.getEmotionalState())).append(",");
            csv.append(escapeCSV(trade.getEntryNotes())).append(",");
            csv.append(escapeCSV(trade.getExitNotes())).append(",");
            csv.append(escapeCSV(formatTags(trade.getTags())));
            csv.append("\n");
        }
        
        return csv.toString();
    }
    
    /**
     * Escape CSV special characters
     */
    private String escapeCSV(String value) {
        if (value == null) {
            return "";
        }
        
        // If the value contains comma, quote, or newline, wrap it in quotes and escape internal quotes
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        
        return value;
    }
    
    /**
     * Format datetime
     */
    private String formatDateTime(LocalDateTime dateTime) {
        if (dateTime == null) {
            return "";
        }
        return dateTime.format(formatter);
    }
    
    /**
     * Format tags list
     */
    private String formatTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return "";
        }
        return String.join("; ", tags);
    }
}
