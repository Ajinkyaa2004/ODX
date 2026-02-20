# Intraday Options Decision Intelligence Engine

> A real-time intraday decision-support system for NIFTY & BANKNIFTY options trading

## 🎯 Project Overview

This is a **deterministic, multi-layer intraday decision-support system** that:
- Runs 24/7, processes only during market hours (9:15–3:30 IST)
- Uses weighted linear scoring (Setup Score + No-Trade Score)
- Analyzes ATM ±2 strikes with OI confirmation
- Includes brokerage-aware PnL calculator
- Provides AI-powered explanations (LLM assists, never overrides)

**This is NOT a signal bot. This is NOT a prediction engine.**

## 🏗️ Architecture

```
Frontend (Next.js) → API Gateway (Spring Boot) → Microservices
                                                  ├── Market Data Service
                                                  ├── Option Chain Service
                                                  ├── Risk Service
                                                  ├── Journal Service
                                                  ├── Quant Engine (Python)
                                                  └── AI Reasoning (Python)
                                                           ↓
                                                  MongoDB Atlas
```

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, TailwindCSS, shadcn/ui
- **Backend (Java):** Spring Boot 3.2, WebFlux, MongoDB Reactive
- **Backend (Python):** FastAPI, Pandas, NumPy, Pandas-TA
- **Database:** MongoDB Atlas
- **AI:** Groq API (Llama 3.1)
- **DevOps:** Docker, Docker Compose

## 📂 Project Structure

```
intraday_decision/
├── services/
│   ├── market-data-service/      (Spring Boot - Port 8081)
│   ├── option-chain-service/     (Spring Boot - Port 8082)
│   ├── risk-service/             (Spring Boot - Port 8083)
│   ├── journal-service/          (Spring Boot - Port 8084)
│   ├── api-gateway/              (Spring Boot - Port 8080)
│   ├── quant-engine/             (Python FastAPI - Port 8001)
│   └── ai-reasoning-service/     (Python FastAPI - Port 8002)
├── frontend/                      (Next.js - Port 3000)
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- MongoDB Atlas account

### 1. Clone and Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
# - MongoDB Atlas URI
# - FYERS API credentials
# - Groq API key
```

### 2. Start All Services

```bash
# Start all services using Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

### 3. Access Services

- **Frontend:** http://localhost:3000
- **API Gateway:** http://localhost:8080
- **Market Data Service:** http://localhost:8081
- **Option Chain Service:** http://localhost:8082
- **Risk Service:** http://localhost:8083
- **Journal Service:** http://localhost:8084
- **Quant Engine:** http://localhost:8001
- **AI Reasoning Service:** http://localhost:8002

### 4. Health Checks

```bash
# Check all services
curl http://localhost:8080/api/health
curl http://localhost:8001/health
curl http://localhost:8002/health
```

## 📊 Core Scoring Model

### Setup Score (0-10)
```
Trend (25%) + VWAP (15%) + Structure (15%) + OI Confirmation (20%) 
+ Volatility (10%) + Momentum (10%) + Internals (5%)
```

### No-Trade Score (0-10)
```
Time Risk (30%) + Chop Detection (25%) + Resistance Proximity (20%) 
+ Volatility Compression (15%) + Consecutive Loss Guard (10%)
```

### Risk Mode Thresholds

| Mode         | Setup Score | No-Trade Score |
|-------------|-------------|----------------|
| Conservative| ≥ 8.0       | ≤ 4.0          |
| Balanced    | ≥ 7.0       | ≤ 6.0          |
| Aggressive  | ≥ 6.0       | ≤ 7.0          |

## 🎯 Development Phases

- ✅ **Phase 0:** Project Setup & Infrastructure
- 🔄 **Phase 1:** Market Data Service + Live Pipeline
- ⏳ **Phase 2:** Basic Scoring Engine
- ⏳ **Phase 3:** Option Chain Intelligence
- ⏳ **Phase 4:** Advanced Filters & No-Trade Score
- ⏳ **Phase 5:** Risk Engine & Brokerage Calculator
- ⏳ **Phase 6:** Trade Journal & Analytics
- ⏳ **Phase 7:** AI Reasoning Layer
- ⏳ **Phase 8:** Global Sentiment & Deployment

## 📝 Environment Variables

Required environment variables (see `.env.example`):

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# FYERS API
FYERS_APP_ID=...
FYERS_ACCESS_TOKEN=...

# Groq API
GROQ_API_KEY=...

# Application
NODE_ENV=development
SPRING_PROFILES_ACTIVE=development
```

## 🔒 Non-Negotiable Rules

- ❌ No machine learning models
- ❌ No price predictions
- ❌ No raw tick data storage (processed only)
- ❌ AI never generates trade signals
- ❌ No scope beyond NIFTY & BANKNIFTY
- ✅ All scoring must be deterministic & explainable

## 🤝 Contributing

This is a structured project following strict architectural principles. 
See [PHASES.md](PHASES.md) for implementation roadmap.

## 📄 License

Private project - Not for distribution

---

**Built with clean architecture, deterministic logic, and explainability at its core.**
# ODX
