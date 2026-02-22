# 🚀 Phase 5 Quick Start Guide

## What's New in Phase 5?

Phase 5 adds a comprehensive **Risk Engine and Brokerage Calculator** to the ODX platform.

### Features:
✅ **Position Sizing Calculator** - Calculate optimal lot sizes based on capital and risk  
✅ **Brokerage Calculator** - Accurate charges for Angel One & FYERS  
✅ **Live PnL Simulator** - Real-time profit/loss tracking  
✅ **Break-even Price** - Know exactly when you're profitable  
✅ **ROI Calculator** - See your return on investment  

---

## Quick Start

### 1. Build the Risk Service
```bash
cd services/risk-service
mvn clean package -DskipTests
```

### 2. Start All Services
```bash
# From project root
docker-compose up -d
```

### 3. Access the Dashboard
```
http://localhost:3000/dashboard
```

Scroll down to see the **Risk Calculator** and **PnL Simulator** panels for both NIFTY and BANKNIFTY.

---

## Using the Risk Calculator

### Step 1: Enter Trade Details
- **Capital:** Your trading capital (e.g., ₹100,000)
- **Risk %:** How much to risk per trade (1%, 2%, or 3%)
- **Entry Price:** Your planned entry price
- **Stop Loss:** Your stop loss price
- **Target:** Your target price
- **Strike:** Option strike price
- **Option Type:** CALL or PUT
- **Broker:** Angel One or FYERS

### Step 2: Click "Calculate Position"

The calculator will show:
- **Lot Size:** Contract lot size (NIFTY: 50, BANKNIFTY: 15)
- **Max Lots:** How many lots you should trade
- **Position Size:** Total quantity
- **Risk Amount:** Total money at risk
- **Reward Amount:** Potential profit
- **Risk-Reward Ratio:** E.g., 1:1.86
- **Charges Breakdown:** All transaction costs
- **Break-even Price:** Price needed to break even
- **Net PnL at Target:** After all charges
- **ROI:** Return on investment percentage

---

## Using the PnL Simulator

### Real-time PnL Tracking

Enter:
- **Entry Price:** Your entry price
- **Exit Price:** Current or planned exit price
- **Quantity:** Number of contracts
- **Option Type:** CALL or PUT
- **Broker:** Angel One or FYERS

The simulator automatically calculates:
- **Net PnL:** After all charges
- **Status:** PROFIT / LOSS / BREAKEVEN
- **Gross PnL:** Before charges
- **Total Charges:** All transaction costs
- **Break-even Price:** 
- **ROI:** Return on investment

---

## API Endpoints

### Position Sizing
```bash
curl -X POST http://localhost:8080/api/risk/calculate-position \
  -H "Content-Type: application/json" \
  -d '{
    "capital": 100000,
    "riskPercentage": 2.0,
    "entryPrice": 125.50,
    "stopLoss": 115.00,
    "target": 145.00,
    "symbol": "NIFTY",
    "optionType": "CALL",
    "strike": 22450,
    "broker": "ANGEL_ONE"
  }'
```

### PnL Calculation
```bash
curl -X POST http://localhost:8080/api/risk/calculate-pnl \
  -H "Content-Type: application/json" \
  -d '{
    "entryPrice": 125.50,
    "currentPrice": 135.00,
    "quantity": 150,
    "symbol": "NIFTY",
    "optionType": "CALL",
    "broker": "ANGEL_ONE"
  }'
```

---

## Charge Structure

### Angel One & FYERS
- **Brokerage:** ₹20 per order (₹40 total for entry + exit)
- **STT:** 0.05% on sell side only
- **Exchange Charges:** 0.05% on both sides
- **SEBI Charges:** ₹10 per crore turnover
- **GST:** 18% on (brokerage + exchange + SEBI)
- **Stamp Duty:** 0.003% on buy side only

---

## Example Calculation

### Input:
- Capital: ₹100,000
- Risk: 2% (₹2,000)
- Entry: ₹125.50
- Stop Loss: ₹115.00
- Target: ₹145.00
- Symbol: NIFTY (lot size: 50)

### Output:
- Risk per unit: ₹10.50
- Max quantity: 190 → 3 lots (150 qty)
- Position value: ₹18,825
- Risk amount: ₹1,575
- Reward amount: ₹2,925
- Risk-Reward: 1:1.86
- **Total Charges: ₹70.19**
- Break-even: ₹125.97
- **Net PnL at Target: ₹2,854.81**
- **ROI: 181.26%**

---

## Configuration

### Lot Sizes (configurable in `application.yml`)
```yaml
lot-sizes:
  nifty: 50
  banknifty: 15
```

### Brokerage Fees (configurable in `application.yml`)
```yaml
brokerage:
  angel-one: 20
  fyers: 20
```

---

## Troubleshooting

### Risk Service Not Starting
```bash
# Rebuild the service
cd services/risk-service
mvn clean package -DskipTests

# Check logs
docker-compose logs risk-service
```

### API Not Responding
```bash
# Check if service is running
curl http://localhost:8083/health

# Check API Gateway routing
curl http://localhost:8080/api/risk/health
```

### Frontend Not Showing Components
1. Clear browser cache
2. Check browser console for errors
3. Verify API Gateway is running: `http://localhost:8080`
4. Check environment variables in `.env.local`

---

## What's Next?

**Phase 6: Trade Journal & Analytics**
- Trade entry/exit logging
- Win rate calculations
- Performance analytics
- Pattern analysis
- Best time windows
- Export functionality

---

## Support

For issues or questions:
1. Check [PHASE_5_COMPLETE.md](PHASE_5_COMPLETE.md) for detailed documentation
2. Review API Gateway logs: `docker-compose logs api-gateway`
3. Check Risk Service logs: `docker-compose logs risk-service`
4. Verify MongoDB connection

---

**Phase 5 Status:** ✅ COMPLETE  
**Date:** 22 February 2026  
**Version:** 1.0.0
