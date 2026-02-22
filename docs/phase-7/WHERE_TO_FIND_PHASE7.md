# 📍 Where to Find Phase 7 Files

## Backend - AI Reasoning Service

### Main Service Directory
```
services/ai-reasoning-service/
```

### Core Files

#### 1. Application Entry Point
**File:** `services/ai-reasoning-service/app/main.py`
- FastAPI app initialization
- Router registration
- CORS middleware
- Lifespan management

#### 2. Data Models
**File:** `services/ai-reasoning-service/app/models.py`
- `EvaluationInput` - Input schema
- `AIReasoning` - Output schema
- `ReasoningRequest` - API request model
- `ReasoningResponse` - API response model

#### 3. Prompt Engineering
**File:** `services/ai-reasoning-service/app/prompts.py`
- `SYSTEM_PROMPT` - System instructions
- `build_user_prompt()` - Comprehensive prompt builder
- `build_lightweight_prompt()` - Quick prompt builder

#### 4. AI Service Logic
**File:** `services/ai-reasoning-service/app/service.py`
- `ReasoningService` class
- Groq API integration
- Retry logic with exponential backoff
- Mock reasoning fallback
- Error handling

#### 5. API Routes
**File:** `services/ai-reasoning-service/app/routes.py`
- `POST /api/ai/generate-reasoning`
- `POST /api/ai/quick-reasoning`
- `GET /api/ai/test-connection`
- `GET /api/ai/health`

#### 6. Configuration
**File:** `services/ai-reasoning-service/app/config.py`
- Groq API key settings
- Model configuration
- MongoDB settings
- Cache TTL settings

#### 7. Dependencies
**File:** `services/ai-reasoning-service/requirements.txt`
- FastAPI
- Groq SDK
- Pydantic
- HTTPx
- Uvicorn

#### 8. Dockerfile
**File:** `services/ai-reasoning-service/Dockerfile`
- Python 3.11 base image
- Service containerization

---

## Frontend - AI Components

### AI Reasoning Panel Component
**File:** `frontend/src/components/AIReasoningPanel.tsx`

**Features:**
- Collapsible card interface
- Manual/auto generation toggle
- Loading states
- Error handling
- Color-coded sections
- Confidence badges

**Props:**
```typescript
interface AIReasoningPanelProps {
  symbol: string;
  evaluationData?: any;
  autoGenerate?: boolean;
}
```

### Dashboard Integration
**File:** `frontend/src/app/dashboard/page.tsx`

**Integration Points:**
- Line 7: Import statement
- Line 341: NIFTY AI panel
- Line 544: BANKNIFTY AI panel

**Sample Usage:**
```tsx
<AIReasoningPanel 
  symbol="NIFTY" 
  evaluationData={{...}}
  autoGenerate={false}
/>
```

---

## Documentation

### 1. Complete Phase Documentation
**File:** `docs/phase-7/PHASE_7_COMPLETE.md`
- Overview
- Implementation details
- Data flow
- API endpoints
- Testing guide
- Success criteria

### 2. Quick Start Guide
**File:** `docs/phase-7/QUICK_START.md`
- Setup instructions
- API testing
- Common issues
- Development mode

### 3. This File
**File:** `docs/phase-7/WHERE_TO_FIND_PHASE7.md`
- File locations
- Code structure
- Integration points

---

## Docker Configuration

### Docker Compose
**File:** `docker-compose.yml`

**AI Service Section:**
```yaml
ai-reasoning-service:
  build: ./services/ai-reasoning-service
  ports:
    - "8002:8002"
  environment:
    - GROQ_API_KEY=${GROQ_API_KEY}
    - GROQ_MODEL=llama-3.1-70b-versatile
```

---

## Environment Configuration

### AI Service Environment
**File:** `services/ai-reasoning-service/.env` (create if not exists)

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-70b-versatile
MONGODB_URI=mongodb://localhost:27017
MONGODB_DATABASE=intraday_decision
CACHE_TTL_MINUTES=5
```

---

## API Endpoints Reference

### Base URL
```
http://localhost:8002
```

### Endpoints

| Method | Path | Purpose | File |
|--------|------|---------|------|
| GET | `/health` | Health check | `app/main.py` |
| GET | `/api/ai/health` | AI health check | `app/routes.py` |
| POST | `/api/ai/generate-reasoning` | Generate full reasoning | `app/routes.py` |
| POST | `/api/ai/quick-reasoning` | Generate quick reasoning | `app/routes.py` |
| GET | `/api/ai/test-connection` | Test Groq connection | `app/routes.py` |
| GET | `/docs` | Swagger UI | FastAPI auto |
| GET | `/redoc` | ReDoc UI | FastAPI auto |

---

## Testing Files

### Manual Testing
```bash
# Test from command line
curl http://localhost:8002/health
curl http://localhost:8002/api/ai/test-connection

# Test reasoning generation
curl -X POST http://localhost:8002/api/ai/generate-reasoning \
  -H "Content-Type: application/json" \
  -d @test_evaluation.json
```

### Browser Testing
- **Swagger UI:** http://localhost:8002/docs
- **Frontend Dashboard:** http://localhost:3000/dashboard

---

## Key Code Snippets

### Backend: Generate Reasoning
**File:** `services/ai-reasoning-service/app/service.py`
**Lines:** ~45-120

```python
async def generate_reasoning(
    self, 
    eval_data: EvaluationInput,
    use_lightweight: bool = False
) -> AIReasoning:
    # Groq API call with retry logic
    # Returns structured AIReasoning object
```

### Frontend: AI Panel Component
**File:** `frontend/src/components/AIReasoningPanel.tsx`
**Lines:** ~35-75

```typescript
const generateReasoning = async () => {
  const response = await fetch(
    "http://localhost:8002/api/ai/generate-reasoning",
    { method: "POST", body: JSON.stringify({...}) }
  );
  // Handle response and update UI
};
```

---

## Integration Points

### 1. Quant Engine → AI Service (Future)
**Where:** `services/quant-engine/app/service.py`
**When:** After evaluation completes
**What:** Call AI service to generate reasoning

### 2. Frontend → AI Service (Current)
**Where:** `frontend/src/components/AIReasoningPanel.tsx`
**When:** User clicks "Generate" button
**What:** POST request to generate reasoning

### 3. Dashboard → AI Panel (Current)
**Where:** `frontend/src/app/dashboard/page.tsx`
**When:** Page loads
**What:** Render AI panel with evaluation data

---

## Logs & Debugging

### View AI Service Logs
```bash
# Docker logs
docker-compose logs ai-reasoning-service -f

# Local development logs
# Automatically printed to console when running uvicorn
```

### Log Locations
- **Docker:** stdout (visible via `docker-compose logs`)
- **Local:** Terminal stdout
- **Format:** `[timestamp] - [name] - [level] - [message]`

---

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| API Gateway | 8080 | http://localhost:8080 |
| Quant Engine | 8001 | http://localhost:8001 |
| **AI Reasoning** | **8002** | **http://localhost:8002** |

---

## Quick Navigation

```
📁 Project Root (odx/)
│
├── 📁 services/
│   └── 📁 ai-reasoning-service/        ← AI SERVICE HERE
│       ├── 📁 app/
│       │   ├── main.py                 ← Entry point
│       │   ├── models.py               ← Data models
│       │   ├── prompts.py              ← Prompt templates
│       │   ├── service.py              ← Groq integration
│       │   ├── routes.py               ← API endpoints
│       │   └── config.py               ← Configuration
│       ├── requirements.txt            ← Dependencies
│       └── Dockerfile                  ← Container config
│
├── 📁 frontend/
│   └── 📁 src/
│       ├── 📁 components/
│       │   └── AIReasoningPanel.tsx    ← AI Component
│       └── 📁 app/
│           └── 📁 dashboard/
│               └── page.tsx            ← Dashboard integration
│
└── 📁 docs/
    └── 📁 phase-7/                     ← Documentation
        ├── PHASE_7_COMPLETE.md         ← Full documentation
        ├── QUICK_START.md              ← Setup guide
        └── WHERE_TO_FIND_PHASE7.md     ← This file
```

---

## Summary

- **Backend:** `services/ai-reasoning-service/`
- **Frontend Component:** `frontend/src/components/AIReasoningPanel.tsx`
- **Dashboard Integration:** `frontend/src/app/dashboard/page.tsx`
- **Documentation:** `docs/phase-7/`
- **API:** `http://localhost:8002/api/ai/`
- **UI:** `http://localhost:3000/dashboard` (scroll to AI panels)

---

**Everything you need is organized and documented!** 🎯
