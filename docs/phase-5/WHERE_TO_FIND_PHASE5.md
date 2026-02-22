# 📍 Where to Find Phase 5 Components

## Your Dashboard Structure (Top to Bottom)

### ✅ Visible in Your Screenshot:
1. **Header** - ODX Live Dashboard, Market Status
2. **NIFTY Section:**
   - Live Price Ticker ✅
   - Setup Score Cards (5m & 15m) - showing errors
   - Option Chain Panel - showing error
   - OI Analysis Panel - showing error
   - Strike Recommendation Card - showing error
   
3. **BANKNIFTY Section:**
   - Live Price Ticker ✅
   - Setup Score Cards (5m & 15m) - showing errors
   - Option Chain Panel - showing error
   - OI Analysis Panel - showing error  
   - Strike Recommendation Card - showing error

### 🎯 NOT VISIBLE - Need to Scroll Down:

4. **NIFTY Phase 5 Components** (just below Strike Recommendations):
   - 🆕 **Risk Calculator Panel** (left side)
     - Capital input
     - Risk % slider
     - Entry/SL/Target inputs
     - Position sizing results
     - Charges breakdown
     - Break-even & ROI
   
   - 🆕 **PnL Simulator** (right side)
     - Entry/Exit price inputs
     - Live PnL calculation
     - Net profit/loss display
     - ROI percentage
     - Status indicator

5. **Technical Indicators** (5m & 15m panels)

6. **BANKNIFTY Phase 5 Components** (same as NIFTY):
   - 🆕 **Risk Calculator Panel**
   - 🆕 **PnL Simulator**

7. **Technical Indicators** (5m & 15m panels)

---

## 🔴 Current Issues in Screenshot

Your Phase 2, 3, 4 components are showing errors:
- "Error loading score" - Phase 2 Setup Score
- "Error loading option chain" - Phase 3 Option Chain
- "Error loading OI analysis" - Phase 3 OI Analysis
- "Error loading recommendations" - Phase 3 Strike Recommendations

**This means your backend services are not running or not connected properly.**

---

## ✅ Phase 5 Status

**Your frontend IS updated with Phase 5!** 

Components are:
- ✅ Properly imported
- ✅ Correctly placed in dashboard
- ✅ Successfully compiled
- ✅ No TypeScript errors
- ✅ Ready to use

---

## 🚀 To See Phase 5 Components

### Option 1: Scroll Down
Just scroll down on your dashboard past the Strike Recommendations section!

### Option 2: Direct Access
The components are at:
- **NIFTY Phase 5**: After NIFTY Strike Recommendations
- **BANKNIFTY Phase 5**: After BANKNIFTY Strike Recommendations

---

## 💡 To Fix Backend Errors

Start all services:
```bash
cd /Users/ajinkya/Desktop/odx
docker-compose up -d
```

Or check which services are running:
```bash
docker-compose ps
```

The Phase 5 Risk Calculator will work even if other services have errors, because it calls the risk-service directly at port 8083.

---

## 📊 What You'll See (Phase 5)

### Risk Calculator Panel:
```
┌──────────────────────────────────────────┐
│  💰 Risk Calculator                       │
│                                           │
│  Capital: [₹100,000        ]             │
│  Risk %:  [2.0%] [1%][2%][3%]            │
│  Entry:   [₹125.50         ]             │
│  SL:      [₹115.00         ]             │
│  Target:  [₹145.00         ]             │
│                                           │
│  [Calculate Position]                     │
│                                           │
│  📊 Position Summary                      │
│  Lots: 3  |  Size: 150  |  Value: ₹18,825│
│                                           │
│  💸 Risk/Reward                           │
│  Risk: ₹1,575  |  Reward: ₹2,925         │
│  R:R = 1:1.86                            │
│                                           │
│  📋 Charges: ₹70.19                       │
│  • Brokerage: ₹40.00                     │
│  • STT: ₹9.41                            │
│  • Exchange: ₹9.41                       │
│  • SEBI: ₹0.19                           │
│  • GST: ₹10.62                           │
│  • Stamp: ₹0.56                          │
│                                           │
│  ✅ PnL at Target                         │
│  Net PnL: ₹2,854.81  |  ROI: 181.26%    │
└──────────────────────────────────────────┘
```

### PnL Simulator:
```
┌──────────────────────────────────────────┐
│  📈 Live PnL Simulator                    │
│                                           │
│  Entry:    [₹125.50]                     │
│  Exit:     [₹135.00]                     │
│  Quantity: [150    ]                     │
│                                           │
│  ╔════════════════════════════════════╗  │
│  ║         Net PnL                     ║  │
│  ║      ₹1,358.21                     ║  │
│  ║      Status: PROFIT ✅              ║  │
│  ╚════════════════════════════════════╝  │
│                                           │
│  Gross PnL: ₹1,425.00                    │
│  Charges:   -₹66.79                      │
│  ROI:       7.21%                        │
└──────────────────────────────────────────┘
```

---

## ✅ Conclusion

**Your frontend IS updated with Phase 5 components!**

They're just **below the current viewport** - scroll down to see them! 🎉
