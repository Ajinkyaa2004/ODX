# 🗺️ **PHASE-WISE IMPLEMENTATION PLAN**

## **PHASE 0 - Project Setup & Infrastructure** ⚙️

### **Duration:** 2-3 days

### **What We'll Do:**
1. Create monorepo structure
2. Setup Docker Compose for local development
3. Initialize all service directories
4. Configure MongoDB Atlas connection
5. Setup basic Spring Boot services (skeleton)
6. Setup Python FastAPI services (skeleton)
7. Initialize Next.js frontend
8. Configure environment variables
9. Setup API Gateway routing
10. Test inter-service connectivity

### **Technologies:**
- Docker & Docker Compose
- Spring Boot 3.2 (Maven)
- FastAPI + Uvicorn
- Next.js 14 (App Router)
- MongoDB Atlas
- VS Code / Antigravity

### **Deliverables:**
```
intraday_decision/
├── services/
│   ├── market-data-service/     ✅ Spring Boot running on :8081
│   ├── option-chain-service/    ✅ Spring Boot running on :8082
│   ├── risk-service/            ✅ Spring Boot running on :8083
│   ├── journal-service/         ✅ Spring Boot running on :8084
│   ├── api-gateway/             ✅ Gateway running on :8080
│   ├── quant-engine/            ✅ FastAPI running on :8001
│   └── ai-reasoning-service/    ✅ FastAPI running on :8002
├── frontend/                     ✅ Next.js running on :3000
├── docker-compose.yml            ✅ All services orchestrated
└── .env.example                  ✅ Environment template
```

### **Success Criteria:**
- ✅ All services start via `docker-compose up`
- ✅ API Gateway routes requests correctly
- ✅ MongoDB connection established
- ✅ Frontend displays "Hello World"
- ✅ Health check endpoints working

---

## **PHASE 1 - Market Data Service + Live Data Pipeline** 📡

### **Duration:** 4-5 days

### **What We'll Do:**

#### **Backend (Market Data Service - Spring Boot):**
1. Integrate FYERS WebSocket API
2. Implement NIFTY & BANKNIFTY 1m OHLC fetching
3. Build data normalization layer
4. Create WebSocket handlers for:
   - Price updates
   - Futures OI
   - Connection management
5. Store processed snapshots in MongoDB (every 3 min)
6. Implement market hours gating logic (9:15–3:30 IST)
7. Create REST endpoints to fetch latest data
8. Implement Socket.io server for frontend push

#### **Backend (Quant Engine - Python):**
1. Create data models (Pydantic)
2. Build EMA calculation engine:
   - 5m: EMA 9, 20, 50
   - 15m: EMA 9, 20, 50
3. Build VWAP calculator
4. Implement EMA slope detection
5. Create REST endpoint to compute indicators
6. Add scheduler for 3-minute evaluation cycle

#### **Frontend (Next.js):**
1. Create live dashboard layout
2. Build real-time price ticker component
3. Add Socket.io client connection
4. Display:
   - NIFTY live price
   - BANKNIFTY live price
   - Last updated time
   - Connection status
5. Add auto-reconnect logic

### **Technologies:**
- FYERS WebSocket API
- Spring WebFlux (reactive streams)
- Socket.io (Java server + React client)
- Python Pandas + NumPy
- APScheduler (Python)
- MongoDB (time-series data)

### **Data Models:**

**MongoDB Collections:**
```javascript
// market_snapshots
{
  _id: ObjectId,
  symbol: "NIFTY",
  timestamp: ISODate,
  price: 22450.50,
  ohlc_1m: { open, high, low, close, volume },
  ema_5m: { ema9, ema20, ema50, slope },
  ema_15m: { ema9, ema20, ema50, slope },
  vwap: 22445.30,
  futures_oi: 12500000
}
```

### **REST Endpoints:**
```
GET  /api/market-data/live/{symbol}          - Latest price
GET  /api/market-data/indicators/{symbol}    - EMA + VWAP
POST /api/quant/calculate-indicators         - Compute indicators
WS   /api/market-data/stream                 - Real-time updates
```

### **Deliverables:**
- ✅ Live NIFTY & BANKNIFTY prices streaming
- ✅ EMA (9, 20, 50) calculated for 5m and 15m
- ✅ VWAP calculated
- ✅ Data stored every 3 minutes
- ✅ Market hours gating active
- ✅ Frontend displays live prices with auto-refresh

### **Success Criteria:**
- ✅ Frontend shows live price updates (< 1 sec delay)
- ✅ EMA values visible and updating
- ✅ System only processes during market hours
- ✅ No data processing outside 9:15–3:30 IST
- ✅ MongoDB has processed snapshots (not raw ticks)

---

## **PHASE 2 - Basic Scoring Engine** 🎯

### **Duration:** 5-6 days

### **What We'll Do:**

#### **Quant Engine (Python):**
1. **Build Trend Scoring Module (25% weight):**
   - EMA alignment check (5m & 15m)
   - Slope consistency
   - Bullish/Bearish classification
   - Score: 0-10

2. **Build VWAP Scoring Module (15% weight):**
   - Price vs VWAP position
   - Distance from VWAP
   - Score: 0-10

3. **Build Structure Scoring Module (15% weight):**
   - Higher highs / Lower lows detection
   - Support/Resistance proximity
   - Score: 0-10

4. **Build Simple Momentum Module (10% weight):**
   - RSI calculation (14-period)
   - Rate of change
   - Score: 0-10

5. **Build Market Internals (5% weight):**
   - Futures OI classification
   - VIX direction
   - NIFTY vs BankNIFTY divergence
   - Score: 0-10

6. **Implement Weighted Linear Scoring:**
   ```python
   setup_score = (
       trend_score * 0.25 +
       vwap_score * 0.15 +
       structure_score * 0.15 +
       momentum_score * 0.10 +
       internals_score * 0.05 +
       0.20  # OI placeholder (Phase 3)
       0.10  # Volatility placeholder (Phase 3)
   )
   ```

7. Create evaluation scheduler (every 3 min)
8. Store scoring snapshots in MongoDB

#### **Backend (Spring Boot):**
1. Create DTO models for scores
2. Build REST endpoints to fetch scores
3. Implement score history retrieval

#### **Frontend (Next.js):**
1. Build scoring dashboard:
   - Setup Score gauge (0-10)
   - Individual component scores breakdown
   - Trend indicator (Bullish/Bearish/Neutral)
   - VWAP status (Above/Below)
   - Last evaluation time
2. Add visual indicators:
   - Color-coded scores (red/yellow/green)
   - Score history chart
3. Add symbol selector (NIFTY / BANKNIFTY)

### **Technologies:**
- Pandas-TA / TA-Lib (technical indicators)
- Python dataclasses / Pydantic
- NumPy (vectorized calculations)
- Recharts (frontend visualization)
- TailwindCSS + shadcn/ui

### **Data Models:**

**MongoDB Collections:**
```javascript
// scoring_snapshots
{
  _id: ObjectId,
  symbol: "NIFTY",
  timestamp: ISODate,
  setup_score: 7.2,
  components: {
    trend: { score: 8.5, weight: 0.25, weighted: 2.125 },
    vwap: { score: 7.0, weight: 0.15, weighted: 1.05 },
    structure: { score: 6.5, weight: 0.15, weighted: 0.975 },
    momentum: { score: 7.5, weight: 0.10, weighted: 0.75 },
    internals: { score: 6.0, weight: 0.05, weighted: 0.30 }
  },
  market_bias: "BULLISH",
  evaluation_time_seconds: 0.045
}
```

### **REST Endpoints:**
```
GET  /api/quant/score/{symbol}               - Latest score
GET  /api/quant/score/{symbol}/history       - Last N scores
POST /api/quant/evaluate                     - Trigger evaluation
```

### **Deliverables:**
- ✅ Partial Setup Score (0-10) displaying
- ✅ Trend, VWAP, Structure, Momentum, Internals scored
- ✅ Component breakdown visible
- ✅ Score evaluated every 3 minutes
- ✅ Historical score chart
- ✅ Market bias indicator (Bullish/Bearish/Neutral)

### **Success Criteria:**
- ✅ Setup Score calculated using weighted formula
- ✅ Scores change based on market conditions
- ✅ Frontend updates every 3 minutes
- ✅ Score history stored in MongoDB
- ✅ All weights sum to 1.0 (100%)

---

## **PHASE 3 - Option Chain Intelligence & Strike Ranking** 📊

### **Duration:** 5-6 days

### **What We'll Do:**

#### **Option Chain Service (Spring Boot):**
1. Integrate FYERS Option Chain API
2. Fetch ATM ±2 strikes for:
   - NIFTY (50 lot size)
   - BANKNIFTY (15 lot size)
3. Calculate for each strike:
   - OI change (absolute & percentage)
   - OI acceleration (rate of change)
   - Volume spike detection
   - Liquidity score (bid-ask spread)
   - Implied delta approximation
4. Implement strike scoring algorithm
5. Rank strikes by composite score
6. Store strike data every 3 minutes
7. Create REST endpoints

#### **Quant Engine (Python):**
1. **Update OI Confirmation Score (20% weight):**
   - Bullish OI pattern (call writing at resistance, put writing at support)
   - Bearish OI pattern (put writing at support, call writing at resistance)
   - OI consistency with price movement
   - Score: 0-10

2. **Update Setup Score:**
   ```python
   setup_score = (
       trend_score * 0.25 +
       vwap_score * 0.15 +
       structure_score * 0.15 +
       oi_score * 0.20 +      # NOW ACTIVE
       momentum_score * 0.10 +
       internals_score * 0.05 +
       0.10  # Volatility placeholder (Phase 4)
   )
   ```

3. Integrate strike recommendation logic

#### **Frontend (Next.js):**
1. Build Option Chain panel:
   - ATM ±2 strikes table
   - OI change heatmap
   - Volume bars
   - Liquidity indicators
2. Add strike recommendation card:
   - Best call strike
   - Best put strike
   - Confidence score
   - Delta value
3. Add OI analysis section:
   - Net OI change chart
   - PCR (Put-Call Ratio)
   - Max pain level

### **Technologies:**
- FYERS Option Chain API
- Spring Data MongoDB Reactive
- Recharts (heatmaps)
- TailwindCSS tables

### **Data Models:**

**MongoDB Collections:**
```javascript
// option_chain_snapshots
{
  _id: ObjectId,
  symbol: "NIFTY",
  timestamp: ISODate,
  spot_price: 22450.50,
  atm_strike: 22450,
  strikes: [
    {
      strike: 22350,
      position: "ATM-2",
      call: {
        oi: 1250000,
        oi_change: +50000,
        oi_change_pct: 4.2,
        volume: 125000,
        bid: 125.50,
        ask: 126.00,
        liquidity_score: 8.5
      },
      put: { /* same structure */ },
      delta_call: 0.65,
      delta_put: -0.35,
      composite_score: 7.8
    },
    // ... 4 more strikes
  ],
  pcr: 1.15,
  max_pain: 22400
}
```

### **REST Endpoints:**
```
GET  /api/option-chain/{symbol}              - Latest chain
GET  /api/option-chain/{symbol}/recommended  - Best strikes
GET  /api/option-chain/{symbol}/analysis     - OI analysis
```

### **Deliverables:**
- ✅ ATM ±2 strikes fetched and displayed
- ✅ OI change calculated and visualized
- ✅ Strike ranking algorithm working
- ✅ OI Confirmation Score (20%) integrated
- ✅ Setup Score now at 90% completion
- ✅ Recommended call/put strikes shown

### **Success Criteria:**
- ✅ Option chain updates every 3 minutes
- ✅ Strike scores calculated correctly
- ✅ OI patterns detected (bullish/bearish)
- ✅ Setup Score includes OI component
- ✅ Frontend shows best strikes with confidence

---

## **PHASE 4 - Advanced Filters & No-Trade Score** 🚫

### **Duration:** 5-6 days

### **What We'll Do:**

#### **Quant Engine (Python):**
1. **Build Volatility Regime Detection (10% weight):**
   - ATR calculation (14-period)
   - ATR expansion percentage
   - Range comparison (current vs 20-period avg)
   - Classify: Compression / Normal / Expansion
   - Score: 0-10

2. **Build Fake Breakout Detector:**
   - Breakout without OI confirmation
   - RSI divergence detection
   - Weak follow-through (volume analysis)
   - Flag potential traps

3. **Build Volume Profile Engine:**
   - POC (Point of Control) calculation
   - VAH (Value Area High)
   - VAL (Value Area Low)
   - Current price position relative to value area

4. **Build Time-of-Day Filter:**
   - First 15 min (9:15-9:30): Opening noise block
   - 11:00-12:30: Chop hour penalty
   - After 3:00 PM: Late session caution
   - Score reduction based on time risk

5. **Build No-Trade Score (0-10):**
   ```python
   no_trade_score = (
       time_risk * 0.30 +
       chop_detection * 0.25 +
       resistance_proximity * 0.20 +
       volatility_compression * 0.15 +
       consecutive_loss_guard * 0.10
   )
   ```

6. **Complete Setup Score (100%):**
   - Add Volatility Score (10%)
   - Final weighted calculation

7. **Implement Trade Gating Logic:**
   ```python
   if setup_score >= threshold and no_trade_score <= threshold:
       return "TRADE_ALLOWED"
   else:
       return "TRADE_BLOCKED"
   ```

#### **Backend (Spring Boot):**
1. Create DTOs for No-Trade Score components
2. Build endpoints for trade gating status
3. Implement risk mode configuration

#### **Frontend (Next.js):**
1. Build No-Trade Score panel:
   - No-Trade gauge (0-10)
   - Component breakdown
   - Blocking reasons (if blocked)
2. Add trade signal indicator:
   - Large visual cue (GREEN/RED/YELLOW)
   - "TRADE ALLOWED" / "TRADE BLOCKED"
   - Threshold bars for risk modes
3. Add risk mode selector:
   - Conservative / Balanced / Aggressive
   - Dynamic threshold display
4. Add advanced filters section:
   - Volatility regime indicator
   - Fake breakout warnings
   - Time-of-day risk meter
   - Volume profile chart

### **Technologies:**
- Pandas-TA (ATR, RSI)
- NumPy (volume profile calculations)
- Python datetime (IST timezone handling)
- Recharts (volume profile visualization)

### **Data Models:**

**MongoDB Collections:**
```javascript
// evaluation_snapshots
{
  _id: ObjectId,
  symbol: "NIFTY",
  timestamp: ISODate,
  
  // Setup Score (0-10)
  setup_score: 7.8,
  components: {
    trend: 8.5,
    vwap: 7.0,
    structure: 6.5,
    oi_confirmation: 8.0,
    volatility: 7.5,        // NOW ACTIVE
    momentum: 7.5,
    internals: 6.0
  },
  
  // No-Trade Score (0-10)
  no_trade_score: 3.2,
  no_trade_components: {
    time_risk: 2.0,         // Low (good time)
    chop_detection: 4.0,
    resistance_proximity: 3.5,
    volatility_compression: 2.5,
    consecutive_loss: 0.0
  },
  
  // Advanced Filters
  volatility_regime: "NORMAL",
  fake_breakout_risk: false,
  volume_profile: {
    poc: 22445,
    vah: 22480,
    val: 22410
  },
  time_of_day_category: "PRIME_TIME",
  
  // Trade Decision
  risk_mode: "BALANCED",
  setup_threshold: 7.0,
  no_trade_threshold: 6.0,
  trade_allowed: true,
  decision: "TRADE_ALLOWED"
}
```

### **REST Endpoints:**
```
GET  /api/quant/evaluation/{symbol}          - Complete evaluation
GET  /api/quant/no-trade-score/{symbol}      - No-Trade breakdown
POST /api/quant/set-risk-mode                - Change risk mode
GET  /api/quant/trade-decision/{symbol}      - Gate status
```

### **Deliverables:**
- ✅ Setup Score 100% complete (all 7 components)
- ✅ No-Trade Score (0-10) working
- ✅ Trade gating logic active
- ✅ Risk mode selector functional
- ✅ Volatility regime detection
- ✅ Fake breakout warnings
- ✅ Time-of-day filtering
- ✅ Volume profile visualization

### **Success Criteria:**
- ✅ System blocks trades during opening noise (9:15-9:30)
- ✅ No-Trade Score correctly identifies chop conditions
- ✅ Trade decision changes based on risk mode
- ✅ All thresholds enforced:
  - Conservative: Setup ≥8, NoTrade ≤4
  - Balanced: Setup ≥7, NoTrade ≤6
  - Aggressive: Setup ≥6, NoTrade ≤7
- ✅ Frontend clearly shows ALLOWED/BLOCKED status

---

## **PHASE 5 - Risk Engine & Brokerage Calculator** 💰

### **Duration:** 4-5 days

### **What We'll Do:**

#### **Risk Service (Spring Boot):**
1. **Build Position Sizing Module:**
   - Risk per trade calculator
   - Lot size calculation based on:
     - Account capital
     - Risk percentage (1-3%)
     - Stop loss distance
     - Risk mode
   - Max position limits

2. **Build Brokerage Calculator:**
   - Angel One charges model
   - FYERS charges model
   - Per-order fee: ₹20
   
3. **Build Charges Calculator:**
   ```
   STT:           0.05% (sell side for options)
   Exchange:      0.05%
   SEBI:          ₹10 per crore
   GST:           18% on (brokerage + exchange + SEBI)
   Stamp duty:    0.003% (buy side)
   ```

4. **Build PnL Calculator:**
   - Gross PnL
   - Total charges
   - Net PnL
   - Break-even price
   - ROI percentage

5. **Build Live PnL Tracker:**
   - Entry price storage
   - Current price monitoring
   - Real-time PnL updates

6. Create REST endpoints

#### **Frontend (Next.js):**
1. Build risk calculator panel:
   - Capital input
   - Risk percentage slider (1-3%)
   - Entry price input
   - Stop loss input
   - Target input
   - Brokerage selector (Angel One / FYERS)
2. Display calculations:
   - Suggested lot size
   - Position value
   - Risk amount
   - Reward amount
   - Risk-reward ratio
3. Build charges breakdown table:
   - All charge components
   - Total charges
   - Break-even price
4. Build PnL simulator:
   - Entry price
   - Current price
   - Quantity
   - Live gross PnL
   - Live net PnL (after charges)
   - ROI %
5. Add preset buttons:
   - 1% risk (Conservative)
   - 2% risk (Balanced)
   - 3% risk (Aggressive)

### **Technologies:**
- Spring Boot validation
- Java BigDecimal (precise calculations)
- React Hook Form (frontend forms)
- Zod (TypeScript validation)

### **Data Models:**

**MongoDB Collections:**
```javascript
// position_calculator
{
  _id: ObjectId,
  user_id: "user123",          // Future use
  timestamp: ISODate,
  
  // Input
  capital: 100000,
  risk_percentage: 2.0,
  entry_price: 125.50,
  stop_loss: 115.00,
  target: 145.00,
  symbol: "NIFTY",
  option_type: "CALL",
  strike: 22450,
  broker: "ANGEL_ONE",
  
  // Calculation
  risk_per_unit: 10.50,        // entry - stop_loss
  reward_per_unit: 19.50,      // target - entry
  lot_size: 50,                // NIFTY lot
  max_lots: 3,                 // Based on 2% risk
  position_size: 150,          // 3 * 50
  position_value: 18825,       // 150 * 125.50
  risk_amount: 1575,           // 150 * 10.50
  reward_amount: 2925,         // 150 * 19.50
  risk_reward_ratio: 1.86,
  
  // Charges
  brokerage: 40,               // ₹20 buy + ₹20 sell
  stt: 9.41,
  exchange_charges: 9.41,
  sebi_charges: 0.19,
  gst: 10.62,
  stamp_duty: 0.56,
  total_charges: 70.19,
  
  // PnL
  break_even_price: 125.97,
  gross_pnl_at_target: 2925,
  net_pnl_at_target: 2854.81,
  roi: 152%
}
```

### **REST Endpoints:**
```
POST /api/risk/calculate-position              - Position sizing
POST /api/risk/calculate-charges               - Brokerage breakdown
POST /api/risk/calculate-pnl                   - PnL computation
POST /api/risk/track-position                  - Start tracking
GET  /api/risk/live-pnl/{position_id}          - Live PnL
```

### **Deliverables:**
- ✅ Position sizing calculator working
- ✅ Lot size calculated based on risk
- ✅ Angel One & FYERS charge models implemented
- ✅ Complete charges breakdown
- ✅ Break-even price calculated
- ✅ Live PnL tracking functional
- ✅ Risk-reward ratio displayed
- ✅ ROI percentage shown

### **Success Criteria:**
- ✅ Calculator suggests correct lot size for given risk
- ✅ Charges match Angel One/FYERS actual fees
- ✅ Break-even price is accurate
- ✅ Net PnL = Gross PnL - Total Charges
- ✅ Live PnL updates with price changes
- ✅ Risk mode affects position sizing

---

## **PHASE 6 - Trade Journal & Analytics** 📊

### **Duration:** 4-5 days

### **What We'll Do:**

#### **Journal Service (Spring Boot):**
1. **Build Trade Entry Logger:**
   - Capture:
     - Symbol
     - Option type (CE/PE)
     - Strike
     - Entry price
     - Entry time
     - Quantity
     - Setup Score at entry
     - No-Trade Score
     - Market regime
     - Time-of-day category
     - Risk mode
     - Trend direction
     - Volatility regime
     - OI confirmation status
     - Notes/Tags
   
2. **Build Trade Exit Logger:**
   - Exit price
   - Exit time
   - Exit reason (Target/SL/Manual/Time-based)
   - Holding duration
   - Gross PnL
   - Net PnL
   - ROI %
   - Emotional notes

3. **Build Analytics Engine:**
   - Win rate calculation
   - Average win size
   - Average loss size
   - Expectancy
   - Profit factor
   - Win rate by:
     - Setup Score range
     - Time of day
     - Volatility regime
     - Trend alignment
     - Risk mode
   - Best performing patterns
   - Worst performing patterns
   - Consecutive wins/losses tracker

4. Create REST endpoints

#### **Frontend (Next.js):**
1. **Build Trade Entry Form:**
   - Pre-filled with current analysis
   - Entry price input
   - Quantity input
   - SL/Target inputs
   - Notes field
   - Save button

2. **Build Trade Journal Table:**
   - All trades list
   - Sortable columns
   - Filter by:
     - Date range
     - Symbol
     - Win/Loss
     - Risk mode
   - Search functionality
   - Export to CSV

3. **Build Analytics Dashboard:**
   - Summary cards:
     - Total trades
     - Win rate %
     - Total PnL
     - Average RR
   - Win rate by score chart
   - Win rate by time chart
   - PnL curve (cumulative)
   - Best time windows heatmap
   - EMA setup accuracy
   - OI pattern performance

4. **Build Trade Detail View:**
   - Entry/exit snapshot
   - Market conditions at entry
   - Score breakdown
   - Timeline visualization
   - Replay button (future)

### **Technologies:**
- Spring Data MongoDB
- Aggregation pipelines
- Recharts (analytics charts)
- React Table / TanStack Table
- CSV export library

### **Data Models:**

**MongoDB Collections:**
```javascript
// trades
{
  _id: ObjectId,
  trade_id: "TRD_20260220_001",
  
  // Basic Info
  symbol: "NIFTY",
  option_type: "CALL",
  strike: 22450,
  expiry: ISODate("2026-02-26"),
  
  // Entry
  entry_timestamp: ISODate,
  entry_price: 125.50,
  quantity: 150,
  position_value: 18825,
  
  // Market Conditions at Entry
  spot_price: 22435.50,
  setup_score: 7.8,
  no_trade_score: 3.2,
  market_regime: {
    trend: "BULLISH",
    vwap_status: "ABOVE",
    volatility_regime: "NORMAL",
    time_category: "PRIME_TIME",
    oi_confirmation: "STRONG"
  },
  risk_mode: "BALANCED",
  
  // Exit
  exit_timestamp: ISODate,
  exit_price: 145.00,
  exit_reason: "TARGET",
  holding_duration_minutes: 45,
  
  // PnL
  gross_pnl: 2925,
  total_charges: 70.19,
  net_pnl: 2854.81,
  roi_percentage: 15.16,
  
  // Classification
  outcome: "WIN",
  risk_reward_achieved: 1.81,
  
  // Notes
  entry_notes: "Strong OI buildup at support",
  exit_notes: "Reached target smoothly",
  emotional_state: "DISCIPLINED",
  tags: ["OI_PATTERN", "TREND_FOLLOWING"]
}

// analytics_cache (pre-computed)
{
  _id: ObjectId,
  date: ISODate("2026-02-20"),
  symbol: "NIFTY",
  
  overall: {
    total_trades: 45,
    wins: 28,
    losses: 17,
    win_rate: 62.22,
    total_pnl: 45230.50,
    avg_win: 2450.30,
    avg_loss: -1230.50,
    profit_factor: 1.99,
    expectancy: 1004.01
  },
  
  by_score_range: [
    { range: "8.0-10.0", trades: 12, win_rate: 83.33 },
    { range: "7.0-7.9", trades: 18, win_rate: 66.67 },
    { range: "6.0-6.9", trades: 15, win_rate: 40.00 }
  ],
  
  by_time: [
    { hour: "09:30-10:00", trades: 5, win_rate: 40.00 },
    { hour: "10:00-11:00", trades: 12, win_rate: 75.00 },
    // ...
  ],
  
  by_regime: [
    { volatility: "EXPANSION", trades: 20, win_rate: 70.00 },
    { volatility: "NORMAL", trades: 18, win_rate: 61.11 },
    { volatility: "COMPRESSION", trades: 7, win_rate: 28.57 }
  ]
}
```

### **REST Endpoints:**
```
POST /api/journal/entry                        - Log entry
POST /api/journal/exit/{trade_id}              - Log exit
GET  /api/journal/trades                       - Get all trades
GET  /api/journal/trades/{trade_id}            - Single trade
GET  /api/journal/analytics                    - Get analytics
GET  /api/journal/analytics/by-score           - Win rate by score
GET  /api/journal/analytics/by-time            - Win rate by time
GET  /api/journal/export                       - Export CSV
```

### **Deliverables:**
- ✅ Trade entry form functional
- ✅ Trade exit form functional
- ✅ Trade journal table with filters
- ✅ Analytics dashboard with key metrics
- ✅ Win rate by score chart
- ✅ Win rate by time chart
- ✅ PnL curve visualization
- ✅ CSV export working

### **Success Criteria:**
- ✅ Trades logged with all market conditions
- ✅ Analytics accurate and insightful
- ✅ Win rate calculated correctly
- ✅ Best patterns identified
- ✅ Data persists across sessions
- ✅ CSV export includes all fields

---

## **PHASE 7 - AI Reasoning Layer** 🤖

### **Duration:** 3-4 days

### **What We'll Do:**

#### **AI Reasoning Service (Python FastAPI):**
1. **Setup Groq API Integration:**
   - API key configuration
   - Model selection (llama-3.1-70b-versatile)
   - Rate limiting
   - Error handling

2. **Build Structured Prompt Engine:**
   - Input: JSON with all scores and conditions
   - Template construction
   - Context injection

3. **Define Expected Output Schema:**
   ```json
   {
     "trade_reasoning": "...",
     "key_strengths": ["...", "..."],
     "key_risks": ["...", "..."],
     "invalidation_condition": "...",
     "confidence_level": "HIGH/MEDIUM/LOW",
     "suggested_action": "..."
   }
   ```

4. **Build Reasoning Generator:**
   - Parse evaluation snapshot
   - Generate explanation
   - Validate output structure
   - Cache results (5-min TTL)

5. Create REST endpoint

#### **Quant Engine Integration:**
1. Call AI service after each evaluation
2. Attach reasoning to snapshot
3. Store in MongoDB

#### **Frontend (Next.js):**
1. **Build AI Reasoning Panel:**
   - Collapsible card
   - Trade reasoning section
   - Key strengths list (green)
   - Key risks list (red)
   - Invalidation condition (bold)
   - Confidence badge
   - Suggested action
   - Timestamp
2. Add "Generate Explanation" button (manual trigger option)
3. Add loading skeleton
4. Add error fallback

### **Technologies:**
- Groq API (Fast LLM inference)
- LangChain (optional, for structured output)
- Redis (caching, optional)
- Markdown renderer (frontend)

### **Prompt Template:**
```python
SYSTEM_PROMPT = """
You are an expert options trading analyst. 
You explain deterministic scoring outcomes.
You NEVER generate trade signals.
You ONLY explain existing analysis results.
Be concise, factual, and structured.
"""

USER_PROMPT = f"""
Analyze this options trade setup for {symbol}:

SCORING BREAKDOWN:
- Setup Score: {setup_score}/10 (Threshold: {threshold})
- No-Trade Score: {no_trade_score}/10 (Threshold: {nt_threshold})
- Decision: {decision}

COMPONENTS:
- Trend: {trend_score}/10 ({trend_direction})
- VWAP: {vwap_score}/10 ({vwap_status})
- Structure: {structure_score}/10
- OI Confirmation: {oi_score}/10 ({oi_pattern})
- Volatility: {vol_score}/10 ({vol_regime})
- Momentum: {mom_score}/10
- Internals: {internal_score}/10

ADVANCED FILTERS:
- Time Risk: {time_risk}
- Fake Breakout Risk: {fake_breakout}
- Volatility Regime: {vol_regime}

RECOMMENDED STRIKE: {strike} {option_type}

Provide:
1. Trade reasoning (2-3 sentences)
2. Key strengths (2-3 points)
3. Key risks (2-3 points)
4. Invalidation condition (1 sentence)
5. Confidence level (HIGH/MEDIUM/LOW)
6. Suggested action

Output as JSON matching the schema.
"""
```

### **Data Models:**

**MongoDB Collections:**
```javascript
// evaluation_snapshots (updated)
{
  _id: ObjectId,
  symbol: "NIFTY",
  timestamp: ISODate,
  
  // ... existing fields ...
  
  ai_reasoning: {
    trade_reasoning: "The setup shows strong bullish alignment with EMA slopes positive on both 5m and 15m timeframes. VWAP support is holding, and OI data confirms call buying at key support levels.",
    key_strengths: [
      "Multi-timeframe EMA alignment (5m + 15m)",
      "Strong OI confirmation at support",
      "Trading in prime time window"
    ],
    key_risks: [
      "Approaching resistance zone at 22480",
      "Moderate chop detected in recent candles",
      "Volume slightly below average"
    ],
    invalidation_condition: "Price breaks below VWAP (22445) with increasing volume",
    confidence_level: "HIGH",
    suggested_action: "Consider CALL entry at 22450 strike with tight stop below VWAP",
    generated_at: ISODate,
    model: "llama-3.1-70b-versatile",
    generation_time_ms: 450
  }
}
```

### **REST Endpoints:**
```
POST /api/ai/generate-reasoning                - Generate explanation
GET  /api/ai/reasoning/{symbol}                - Get latest reasoning
```

### **Deliverables:**
- ✅ Groq API integrated
- ✅ Structured prompt working
- ✅ AI generates consistent JSON output
- ✅ Reasoning attached to evaluations
- ✅ Frontend displays AI panel
- ✅ Error handling for API failures

### **Success Criteria:**
- ✅ AI explanations are clear and concise
- ✅ AI never contradicts deterministic scores
- ✅ Output matches expected schema
- ✅ Generation time < 2 seconds
- ✅ Reasoning updates every 3 minutes
- ✅ Fallback works when API fails

---

## **PHASE 8 - Global Sentiment, Polishing & Deployment** 🚀

### **Duration:** 4-5 days

### **What We'll Do:**

#### **Market Data Service Enhancement:**
1. **Add Global Indices Data:**
   - S&P 500 Futures
   - Nasdaq Futures
   - Dow Futures
   - Nikkei 225
   - Hang Seng
   - India VIX
2. Fetch data every 5 minutes
3. Store snapshots
4. Create REST endpoints

#### **Frontend (Next.js):**
1. **Build Global Sentiment Navbar:**
   - Horizontal ticker at top
   - Display:
     - Index name
     - Current value
     - % change (color-coded)
     - Directional arrow
   - Auto-scroll animation
   - Click to expand details

2. **Add Alert System:**
   - Browser notifications
   - Sound alerts when:
     - Trade decision changes
     - Setup Score crosses threshold
     - High-confidence setup appears
   - Settings panel:
     - Enable/disable sounds
     - Volume control
     - Notification preferences

3. **Polish UI/UX:**
   - Responsive design (mobile/tablet)
   - Dark mode toggle
   - Loading states
   - Error boundaries
   - Skeleton loaders
   - Smooth animations
   - Tooltips on all metrics

4. **Add Settings Panel:**
   - Risk mode selector
   - Capital input (persist)
   - Broker selection (persist)
   - Alert preferences
   - Refresh interval
   - Theme selection

5. **Build Help/Documentation:**
   - Scoring explanation modal
   - Component breakdown guide
   - Risk mode comparison table
   - Keyboard shortcuts
   - FAQ section

#### **Backend Optimization:**
1. Add Redis caching for:
   - Latest scores
   - Latest prices
   - Global indices
2. Implement connection pooling
3. Add request rate limiting
4. Optimize MongoDB queries
5. Add health check endpoints
6. Implement graceful shutdown

#### **DevOps:**
1. **Create Production Docker Compose:**
   - All services
   - MongoDB
   - Redis
   - Restart policies
   - Resource limits

2. **Setup Environment Config:**
   - Development
   - Staging
   - Production
   - Secret management

3. **Deploy to Cloud:**
   - Setup AWS/Azure/DigitalOcean
   - Configure load balancer
   - Setup SSL certificates
   - Configure domain
   - Setup monitoring (Prometheus + Grafana)
   - Configure log aggregation

4. **CI/CD Pipeline:**
   - GitHub Actions workflow
   - Automated testing
   - Docker image builds
   - Automated deployment

5. **Documentation:**
   - README.md with:
     - Project overview
     - Setup instructions
     - Architecture diagram
     - API documentation
     - Environment variables
   - Postman collection
   - Demo video/screenshots

### **Technologies:**
- Redis (caching)
- Docker Swarm / Kubernetes
- Nginx (reverse proxy)
- Let's Encrypt (SSL)
- GitHub Actions
- AWS/Azure/DigitalOcean

### **REST Endpoints:**
```
GET  /api/market-data/global-indices            - All indices
GET  /api/health                                - System health
GET  /api/metrics                               - Prometheus metrics
```

### **Deliverables:**
- ✅ Global sentiment navbar displaying live
- ✅ Browser notifications working
- ✅ Sound alerts functional
- ✅ Settings panel with persistence
- ✅ Responsive design (mobile-friendly)
- ✅ Dark mode implemented
- ✅ Help documentation complete
- ✅ Redis caching active
- ✅ Production-ready Docker setup
- ✅ Deployed to cloud
- ✅ CI/CD pipeline working
- ✅ Monitoring dashboard live
- ✅ Complete README documentation

### **Success Criteria:**
- ✅ System runs 24/7 without crashes
- ✅ All services auto-restart on failure
- ✅ API response time < 200ms (cached)
- ✅ Frontend loads in < 2 seconds
- ✅ Alerts fire correctly
- ✅ Global indices update every 5 minutes
- ✅ Documentation is clear and complete
- ✅ Demo video showcases all features
- ✅ Mobile experience is smooth

---

## **📋 PHASE COMPLETION CHECKLIST**

### After Each Phase:
- [ ] All features implemented
- [ ] Manual testing completed
- [ ] No console errors
- [ ] MongoDB data validated
- [ ] API endpoints tested (Postman)
- [ ] Frontend displays correctly
- [ ] Git commit with clear message
- [ ] Phase documentation updated

---

## **🎯 FINAL PROJECT OUTCOME**

After Phase 8, you will have:

✅ **Fully functional real-time decision engine**  
✅ **Complete scoring system (Setup + No-Trade)**  
✅ **Option chain analysis with strike ranking**  
✅ **Risk-aware calculator with brokerage**  
✅ **Trade journal with analytics**  
✅ **AI explanation layer**  
✅ **Global sentiment display**  
✅ **Production-ready deployment**  
✅ **Complete documentation**  
✅ **Resume-worthy portfolio project**

---

## **🚀 HOW TO USE THIS PLAN**

For each phase, provide the prompt:

> **"Start Phase [N]: [Phase Name]"**

Example:
> **"Start Phase 1: Market Data Service + Live Data Pipeline"**

The assistant will:
1. Create necessary directory structure
2. Implement all backend services
3. Build frontend components
4. Test connections and data flow
5. Validate against success criteria
6. Confirm phase completion

---

**Ready to begin Phase 0!** 🎯
