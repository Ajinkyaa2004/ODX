# 📡 PHASE 1 - Market Data Service + Live Data Pipeline

## 🎯 Overview

Phase 1 implements the core live market data infrastructure, connecting to FYERS WebSocket API and streaming real-time NIFTY & BANKNIFTY prices with technical indicators (EMA, VWAP) to the frontend dashboard.

---

## 📋 Phase 1 Deliverables

### Backend (Market Data Service - Spring Boot)
- ✅ FYERS WebSocket API integration
- ✅ Live 1-minute OHLC data fetching for NIFTY & BANKNIFTY
- ✅ Data normalization layer
- ✅ WebSocket connection management with auto-reconnect
- ✅ Market hours gating (9:15 AM - 3:30 PM IST)
- ✅ MongoDB storage (snapshots every 3 minutes)
- ✅ REST endpoints for latest market data
- ✅ Socket.io server for frontend push notifications

### Backend (Quant Engine - Python)
- ✅ EMA calculation engine (9, 20, 50 for 5m & 15m timeframes)
- ✅ VWAP calculator
- ✅ EMA slope detection
- ✅ Indicator computation REST endpoints
- ✅ APScheduler for 3-minute evaluation cycles
- ✅ Pydantic data models

### Frontend (Next.js)
- ✅ Live market dashboard layout
- ✅ Real-time price ticker component
- ✅ Socket.io client integration
- ✅ Live NIFTY & BANKNIFTY price display
- ✅ EMA and VWAP indicators display
- ✅ Connection status monitoring
- ✅ Auto-reconnect logic

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                       │
│                  ← Socket.io Client Connection →                 │
└─────────────────────────────────────────────────────────────────┘
                                 ↓ REST API
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Port 8080)                     │
└─────────────────────────────────────────────────────────────────┘
                    ↓                              ↓
    ┌───────────────────────────┐    ┌───────────────────────────┐
    │  Market Data Service      │    │     Quant Engine          │
    │  (Spring Boot - 8081)     │    │  (Python FastAPI - 8001)  │
    │                           │    │                           │
    │  • FYERS WebSocket        │    │  • EMA Calculation        │
    │  • OHLC Fetching          │    │  • VWAP Calculation       │
    │  • Data Normalization     │    │  • Slope Detection        │
    │  • Socket.io Server       │    │  • 3-min Scheduler        │
    │  • Market Hours Gate      │    │  • Indicator Storage      │
    └───────────────────────────┘    └───────────────────────────┘
                    ↓                              ↓
                    └──────────────┬───────────────┘
                                   ↓
                    ┌───────────────────────────┐
                    │     MongoDB Atlas         │
                    │                           │
                    │  • market_snapshots       │
                    │  • indicator_data         │
                    └───────────────────────────┘
```

---

## 📊 Data Models

### MongoDB Collections

#### 1. market_snapshots
```javascript
{
  _id: ObjectId,
  symbol: "NIFTY",              // NIFTY or BANKNIFTY
  timestamp: ISODate,            // Snapshot time
  price: 22450.50,               // Current price
  ohlc_1m: {
    open: 22448.00,
    high: 22452.00,
    low: 22445.00,
    close: 22450.50,
    volume: 125000
  },
  futures_oi: 12500000,          // Open Interest (Phase 1: placeholder)
  snapshot_interval: 3,          // Minutes
  created_at: ISODate
}
```

#### 2. indicator_data
```javascript
{
  _id: ObjectId,
  symbol: "NIFTY",
  timestamp: ISODate,
  timeframe: "5m",               // 5m or 15m
  ema: {
    ema9: 22447.30,
    ema20: 22445.80,
    ema50: 22442.10,
    slope: "bullish"             // bullish, bearish, neutral
  },
  vwap: 22445.30,
  calculated_at: ISODate
}
```

---

## 🔌 REST API Endpoints

### Market Data Service (8081)

#### Get Latest Price
```http
GET /api/market-data/live/{symbol}

Response:
{
  "symbol": "NIFTY",
  "price": 22450.50,
  "timestamp": "2026-02-20T10:30:00Z",
  "ohlc": {
    "open": 22448.00,
    "high": 22452.00,
    "low": 22445.00,
    "close": 22450.50,
    "volume": 125000
  },
  "isMarketOpen": true
}
```

#### Get Historical Snapshots
```http
GET /api/market-data/history/{symbol}?hours=1

Response:
{
  "symbol": "NIFTY",
  "count": 20,
  "snapshots": [
    {
      "timestamp": "2026-02-20T10:27:00Z",
      "price": 22448.30,
      "ohlc": { ... }
    }
  ]
}
```

#### Market Status
```http
GET /api/market-data/status

Response:
{
  "isOpen": true,
  "currentTime": "2026-02-20T10:30:00+05:30",
  "nextOpen": null,
  "nextClose": "2026-02-20T15:30:00+05:30"
}
```

### Quant Engine (8001)

#### Calculate Indicators
```http
POST /api/quant/calculate-indicators
Content-Type: application/json

Request:
{
  "symbol": "NIFTY",
  "timeframe": "5m"
}

Response:
{
  "symbol": "NIFTY",
  "timeframe": "5m",
  "timestamp": "2026-02-20T10:30:00Z",
  "indicators": {
    "ema": {
      "ema9": 22447.30,
      "ema20": 22445.80,
      "ema50": 22442.10,
      "slope": "bullish",
      "alignment": "bullish"
    },
    "vwap": {
      "value": 22445.30,
      "position": "above",
      "distance": 5.20
    }
  }
}
```

#### Get Latest Indicators
```http
GET /api/quant/indicators/{symbol}?timeframe=5m

Response: Same as above
```

---

## 🔄 WebSocket Events (Socket.io)

### Client → Server

#### Subscribe to Symbol
```javascript
socket.emit('subscribe', { symbol: 'NIFTY' });
```

#### Unsubscribe from Symbol
```javascript
socket.emit('unsubscribe', { symbol: 'NIFTY' });
```

### Server → Client

#### Price Update
```javascript
socket.on('price_update', (data) => {
  // data = {
  //   symbol: 'NIFTY',
  //   price: 22450.50,
  //   change: 15.30,
  //   changePercent: 0.068,
  //   timestamp: '2026-02-20T10:30:00Z'
  // }
});
```

#### Indicator Update
```javascript
socket.on('indicator_update', (data) => {
  // data = {
  //   symbol: 'NIFTY',
  //   timeframe: '5m',
  //   ema: { ema9, ema20, ema50, slope },
  //   vwap: { value, position, distance },
  //   timestamp: '2026-02-20T10:30:00Z'
  // }
});
```

#### Market Status Change
```javascript
socket.on('market_status', (data) => {
  // data = {
  //   isOpen: true,
  //   message: 'Market opened at 09:15 IST'
  // }
});
```

---

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Market Data Service** | Spring Boot 3.2 + WebFlux | Reactive data streaming |
| **WebSocket Client** | FYERS Java SDK | Live market data |
| **Real-time Push** | Socket.io (Java) | Frontend notifications |
| **Quant Engine** | FastAPI + Python 3.11 | Technical calculations |
| **Indicators** | Pandas + NumPy + Pandas-TA | EMA, VWAP computation |
| **Scheduler** | APScheduler | 3-minute cycles |
| **Database** | MongoDB Atlas | Time-series storage |
| **Frontend** | Next.js 14 + Socket.io Client | Live dashboard |

---

## 📦 Dependencies Added

### Market Data Service (Maven - pom.xml)
```xml
<!-- FYERS SDK -->
<dependency>
    <groupId>io.github.fyers-api</groupId>
    <artifactId>fyers-java-sdk</artifactId>
    <version>1.0.0</version>
</dependency>

<!-- Socket.io Server -->
<dependency>
    <groupId>com.corundumstudio.socketio</groupId>
    <artifactId>netty-socketio</artifactId>
    <version>2.0.3</version>
</dependency>

<!-- WebSocket -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

### Quant Engine (requirements.txt)
```txt
# Existing
fastapi==0.109.0
uvicorn[standard]==0.27.0
motor==3.3.2
pydantic==2.5.3
python-dotenv==1.0.0

# Phase 1 Additions
pandas==2.1.4
numpy==1.26.3
pandas-ta==0.3.14b
APScheduler==3.10.4
aiohttp==3.9.1
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "socket.io-client": "^4.7.2",
    "recharts": "^2.10.3",
    "date-fns": "^3.0.6"
  }
}
```

---

## ⏱️ Execution Flow

### 1. System Startup (9:00 AM)
```
1. All services start via docker-compose
2. Market Data Service connects to FYERS WebSocket
3. Quant Engine initializes APScheduler
4. Frontend establishes Socket.io connection
5. System waits for market open (9:15 AM)
```

### 2. Market Open (9:15 AM)
```
1. FYERS WebSocket starts streaming 1-minute OHLC
2. Market Data Service normalizes data
3. Data stored in MongoDB every 3 minutes
4. Quant Engine evaluates indicators every 3 minutes
5. Frontend receives real-time updates via Socket.io
```

### 3. 3-Minute Cycle (e.g., 9:18 AM, 9:21 AM, ...)
```
1. [9:18] Market Data Service triggers snapshot storage
2. [9:18] Quant Engine fetches latest OHLC from MongoDB
3. [9:18] Calculate EMA (9, 20, 50) for 5m & 15m
4. [9:18] Calculate VWAP
5. [9:18] Detect EMA slope (bullish/bearish/neutral)
6. [9:18] Store indicators in MongoDB
7. [9:18] Push updates to frontend via Socket.io
8. [9:18] Frontend updates dashboard
```

### 4. Market Close (3:30 PM)
```
1. Market Data Service stops processing new data
2. Final snapshot stored
3. Final indicators calculated
4. WebSocket connection maintained (for reconnect)
5. System goes idle until next market open
```

---

## 🧪 Testing Checklist

### Phase 1 Testing
- [ ] FYERS WebSocket connects successfully
- [ ] Live NIFTY price updates every second
- [ ] Live BANKNIFTY price updates every second
- [ ] Market hours gating prevents processing outside 9:15-3:30
- [ ] MongoDB receives snapshots every 3 minutes
- [ ] EMA (9, 20, 50) calculated correctly for 5m timeframe
- [ ] EMA (9, 20, 50) calculated correctly for 15m timeframe
- [ ] VWAP calculated accurately
- [ ] EMA slope detection works (bullish/bearish/neutral)
- [ ] Frontend receives Socket.io price updates
- [ ] Frontend displays live prices with < 1 second delay
- [ ] Frontend shows EMA indicators
- [ ] Frontend shows VWAP
- [ ] Connection status indicator works
- [ ] Auto-reconnect works after disconnect
- [ ] System handles FYERS API rate limits
- [ ] Error handling for network failures

---

## 🚀 Deployment Steps

### Step 1: Update Dependencies
```bash
# Market Data Service
cd services/market-data-service
mvn clean install

# Quant Engine
cd services/quant-engine
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### Step 2: Verify Environment Variables
```bash
# Check .env file has:
# - FYERS_APP_ID
# - FYERS_ACCESS_TOKEN
# - MONGODB_URI
# - MONGODB_DATABASE
```

### Step 3: Start Services
```bash
# From project root
docker-compose down
docker-compose build
docker-compose up -d
```

### Step 4: Monitor Logs
```bash
# Market Data Service
docker-compose logs -f market-data-service

# Quant Engine
docker-compose logs -f quant-engine

# Frontend
docker-compose logs -f frontend
```

### Step 5: Access Dashboard
```
Open: http://localhost:3000/dashboard
```

---

## 📊 Success Criteria

### ✅ Phase 1 Complete When:
1. **Live Data Flowing**: NIFTY & BANKNIFTY prices update in real-time on frontend
2. **Indicators Calculating**: EMA and VWAP values visible and updating every 3 minutes
3. **Market Hours Working**: System only processes during 9:15 AM - 3:30 PM IST
4. **Data Persisting**: MongoDB contains market_snapshots and indicator_data
5. **No Errors**: No crashes, connection failures handled gracefully
6. **Performance**: Price updates arrive within 1 second, UI responsive

---

## 🔜 Next: Phase 2

Phase 2 will build the **Setup Score Engine** using the indicators calculated in Phase 1:
- Trend scoring (25% weight)
- VWAP scoring (15% weight)
- Structure scoring (15% weight)
- Momentum scoring (10% weight)
- Market internals (5% weight)
- Weighted linear scoring system

---

## 📞 Support

If you encounter issues during Phase 1:
1. Check service logs: `docker-compose logs <service-name>`
2. Verify FYERS credentials are valid
3. Ensure MongoDB Atlas IP whitelist includes your IP
4. Check market hours (system won't process outside 9:15-3:30 IST)

---

**Phase 1 Start Date**: February 20, 2026  
**Expected Completion**: February 25, 2026 (5 days)  
**Status**: 🚧 In Progress
