# Phase 6 - File Structure

## Backend Files (Journal Service)

### Domain Models (`src/main/java/com/intraday/journal/model/`)
```
✅ Trade.java                    - Main trade entity
✅ MarketRegime.java             - Market conditions at trade time
✅ AnalyticsSnapshot.java        - Pre-computed analytics cache
✅ AnalyticsOverall.java         - Overall performance metrics
✅ AnalyticsByCategory.java      - Category-wise breakdowns
```

### DTOs (`src/main/java/com/intraday/journal/dto/`)
```
✅ TradeEntryRequest.java        - Request for new trade entry
✅ TradeExitRequest.java         - Request for trade exit
✅ TradeResponse.java            - Trade response with all details
✅ AnalyticsResponse.java        - Complete analytics response
```

### Repositories (`src/main/java/com/intraday/journal/repository/`)
```
✅ TradeRepository.java          - Reactive MongoDB repository for trades
✅ AnalyticsRepository.java      - Repository for analytics caching
```

### Services (`src/main/java/com/intraday/journal/service/`)
```
✅ TradeService.java             - Trade entry/exit logic, PnL calculations
✅ AnalyticsService.java         - Compute all analytics metrics
✅ ExportService.java            - CSV export functionality
```

### Controllers (`src/main/java/com/intraday/journal/controller/`)
```
✅ JournalController.java        - Trade CRUD endpoints
✅ AnalyticsController.java      - Analytics and export endpoints
```

## Frontend Files

### Components (`frontend/src/components/`)
```
✅ TradeEntryForm.tsx            - Form to log new trades
✅ TradeJournalTable.tsx         - Table with all trades + filters
✅ AnalyticsDashboard.tsx        - Performance charts and metrics
```

### UI Components (`frontend/src/components/ui/`)
```
✅ card.tsx                      - Card container components
✅ button.tsx                    - Button component
✅ input.tsx                     - Input field component
✅ label.tsx                     - Label component
✅ textarea.tsx                  - Textarea component
✅ badge.tsx                     - Badge component for tags
✅ select.tsx                    - Select dropdown component
✅ tabs.tsx                      - Tabbed interface component
✅ scroll-area.tsx               - Scrollable area component
```

### Pages (`frontend/src/app/`)
```
✅ journal/page.tsx              - Main journal page with tabs
```

### Utilities (`frontend/src/lib/`)
```
✅ utils.ts                      - cn() utility for className merging
```

## Documentation Files

```
✅ docs/phase-6/PHASE_6_COMPLETE.md     - Complete implementation guide
✅ docs/phase-6/QUICK_START.md          - Quick start guide
✅ docs/phase-6/WHERE_TO_FIND_PHASE6.md - File structure reference
```

## Configuration Files (No Changes)

- `services/journal-service/pom.xml` - Already configured
- `frontend/package.json` - No new dependencies needed
- `docker-compose.yml` - Journal service already defined

## MongoDB Collections

### Trades Collection
```
Collection: trades
Purpose: Store all trade entries and exits
Indexes: 
  - tradeId (unique)
  - symbol
  - entryTimestamp
  - outcome
```

### Analytics Cache Collection (Optional)
```
Collection: analytics_cache
Purpose: Pre-computed analytics for faster retrieval
Indexes:
  - date + symbol (compound)
```

## API Endpoints Summary

### Journal Service (Port 8084, via Gateway 8080)

```
POST   /api/journal/entry              - Log new trade
POST   /api/journal/exit/{tradeId}     - Log trade exit
GET    /api/journal/trades             - Get all trades
GET    /api/journal/trades/{tradeId}   - Get single trade
GET    /api/journal/analytics          - Get analytics
GET    /api/journal/export             - Export CSV
```

## Component Props Reference

### TradeEntryForm Props
```typescript
interface TradeEntryFormProps {
  marketConditions?: MarketConditions;  // Current market data
  onSuccess?: () => void;               // Callback after successful entry
}
```

### TradeJournalTable Props
```typescript
// No props - self-contained component
```

### AnalyticsDashboard Props
```typescript
// No props - self-contained component
```

## Total Files Created

- **Backend**: 14 files (models, DTOs, repositories, services, controllers)
- **Frontend**: 13 files (components, UI, pages, utilities)
- **Documentation**: 3 files
- **Total**: 30 new files

## Directory Structure Visualization

```
intraday_decision/
├── services/
│   └── journal-service/
│       └── src/main/java/com/intraday/journal/
│           ├── model/          (5 files)
│           ├── dto/            (4 files)
│           ├── repository/     (2 files)
│           ├── service/        (3 files)
│           └── controller/     (2 files)
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── TradeEntryForm.tsx
│       │   ├── TradeJournalTable.tsx
│       │   ├── AnalyticsDashboard.tsx
│       │   └── ui/             (9 files)
│       ├── app/
│       │   └── journal/
│       │       └── page.tsx
│       └── lib/
│           └── utils.ts
│
└── docs/
    └── phase-6/                (3 files)
```

## Integration Points

### With Phase 2 (Scoring Engine)
- Captures setupScore from quant engine

### With Phase 3 (Option Chain)
- Records OI confirmation status

### With Phase 4 (No-Trade Score)
- Logs no-trade score and volatility regime

### With Phase 5 (Risk Management)
- Can store risk calculator outputs (future enhancement)

## Next Phase Preview

**Phase 7: AI Reasoning Layer**
- Will read from trade journal
- Generate insights from analytics
- Suggest improvements based on patterns
- Explain trade context using LLM
