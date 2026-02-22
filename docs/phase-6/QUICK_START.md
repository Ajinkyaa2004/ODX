# Phase 6: Quick Start Guide

## Overview
Phase 6 adds a complete Trade Journal and Analytics system to track, analyze, and improve your trading performance.

## Quick Access
**Frontend URL:** `http://localhost:3000/journal`

## What Does It Do?

### 1. Trade Entry Logging
- Record trades with complete market context
- Capture setup scores, market regime, and risk mode
- Pre-filled with current market conditions

### 2. Trade Journal
- View all your trades in one place
- Filter by symbol, outcome, or search
- See P&L and ROI at a glance
- Export to CSV for external analysis

### 3. Performance Analytics
- Overall metrics (win rate, profit factor, expectancy)
- Win rate by setup score range
- Best trading time windows
- Performance by volatility regime
- Results by risk mode

## How to Use

### Log a Trade Entry
1. Go to http://localhost:3000/journal
2. Click **Entry** tab
3. Fill in:
   - Symbol (NIFTY/BANKNIFTY)
   - Option type (CALL/PUT)
   - Strike price
   - Entry price
   - Quantity
4. Add optional notes
5. Click **Log Trade Entry**

### View Your Journal
1. Click **Journal** tab
2. Use filters to find specific trades
3. Export to CSV if needed

### Check Analytics
1. Click **Analytics** tab
2. Review overall performance
3. Identify best trading patterns
4. Find optimal time windows

## API Endpoints

### Log Trade Entry
```bash
POST http://localhost:8080/api/journal/entry
Content-Type: application/json

{
  "symbol": "NIFTY",
  "optionType": "CALL",
  "strike": 22450,
  "entryPrice": 125.50,
  "quantity": 150,
  "setupScore": 7.8,
  "noTradeScore": 3.2
}
```

### Log Trade Exit
```bash
POST http://localhost:8080/api/journal/exit/{tradeId}
Content-Type: application/json

{
  "exitPrice": 145.00,
  "exitReason": "TARGET",
  "totalCharges": 70.19
}
```

### Get All Trades
```bash
GET http://localhost:8080/api/journal/trades
```

### Get Analytics
```bash
GET http://localhost:8080/api/journal/analytics
```

### Export to CSV
```bash
GET http://localhost:8080/api/journal/export
```

## Key Metrics

### Win Rate
Percentage of winning trades. Target: >60%

### Profit Factor
`Total Wins / Total Losses`. Target: >2.0 for strong edge

### Expectancy
Average profit per trade. Must be positive for profitability

### Best Setup Score Range
Identifies which score ranges perform best (validates scoring system)

### Best Time Windows
Shows which hours have highest win rate

## What's Tracked

For each trade, the system captures:
- Entry/exit prices and times
- Quantity and P&L
- Setup score and no-trade score
- Market regime (trend, volatility, time category)
- OI confirmation status
- Risk mode used
- Holding duration
- ROI percentage
- Entry/exit notes
- Tags for categorization

## Tips for Usage

1. **Log trades immediately** - Don't rely on memory
2. **Add notes** - Document your reasoning
3. **Use tags** - Categorize setups (e.g., "OI_PATTERN", "TREND_FOLLOWING")
4. **Review analytics weekly** - Identify patterns
5. **Export regularly** - Backup your data
6. **Track emotional state** - Learn when you trade best

## Visual Indicators

### Outcome Badges
- 🟢 **WIN** - Green badge
- 🔴 **LOSS** - Red badge
- 🟡 **OPEN** - Grey badge (trade not exited)

### P&L Colors
- **Green** - Positive P&L
- **Red** - Negative P&L

### Win Rate Badges
- **Excellent** - Win rate ≥ 60%
- **Good** - Win rate ≥ 50%
- **Needs Work** - Win rate < 50%

## Integration with Other Phases

The journal automatically captures data from:
- **Phase 2** - Setup scores
- **Phase 3** - OI confirmation status
- **Phase 4** - No-trade scores, volatility regime
- **Phase 5** - Risk calculator outputs

This creates a complete picture of each trade's context.

## Troubleshooting

### No trades showing
- Check MongoDB connection
- Ensure journal service is running on port 8084
- Check API Gateway is routing correctly

### Analytics not loading
- Verify at least one closed trade exists
- Check date range (defaults to last 30 days)
- Open browser console for errors

### CSV export fails
- Check browser download settings
- Verify export endpoint returns data
- Try with smaller date range

## Next: Phase 7 - AI Reasoning

Once you have trade data, Phase 7 will add:
- AI-powered trade explanations
- Context-aware reasoning
- Pattern suggestions
- Performance insights

---

**Need Help?** Check [PHASE_6_COMPLETE.md](PHASE_6_COMPLETE.md) for detailed technical documentation.
