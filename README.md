# ODX - Options Decision Intelligence Engine

> A real-time intraday decision-support system for NIFTY & BANKNIFTY options trading

[![Phase](https://img.shields.io/badge/Phase-0%20Complete-brightgreen)](https://github.com/Ajinkyaa2004/ODX)
[![Services](https://img.shields.io/badge/Services-8%20Running-blue)](#services)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Private-red)]()

## 🎯 Project Status

**✅ Phase 0 Complete** - Microservices Infrastructure fully operational!

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

## 🎯 Services Overview

| Service | Port | Technology | Status | Purpose |
|---------|------|------------|--------|---------|
| **API Gateway** | 8080 | Spring Cloud Gateway | ✅ Running | Central routing & CORS |
| **Market Data** | 8081 | Spring Boot + WebFlux | ✅ Running | FYERS WebSocket integration |
| **Option Chain** | 8082 | Spring Boot + WebFlux | ✅ Running | Options data & OI analysis |
| **Risk Service** | 8083 | Spring Boot + WebFlux | ✅ Running | Risk calculation & PnL |
| **Journal** | 8084 | Spring Boot + WebFlux | ✅ Running | Trade logging & analytics |
| **Quant Engine** | 8001 | Python FastAPI | ✅ Running | Scoring & indicators |
| **AI Reasoning** | 8002 | Python FastAPI | ✅ Running | LLM-powered explanations |
| **Frontend** | 3000 | Next.js 14 | ✅ Running | Real-time dashboard |

## 🔧 Development Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs (all services)
docker compose logs -f

# View logs (specific service)
docker compose logs -f market-data-service

# Rebuild after code changes
docker compose up --build -d

# Check running containers
docker compose ps

# Run health checks
./scripts/health-check.sh
```

## 📂 Project Documentation

- [PHASES.md](PHASES.md) - Complete development roadmap
- [PHASE_0_COMPLETE.md](PHASE_0_COMPLETE.md) - Phase 0 completion report
- [PHASE_0_SETUP.md](PHASE_0_SETUP.md) - Setup instructions

## 🔐 Security Note

⚠️ **Important:** Never commit your `.env` file! It contains sensitive API keys.
- The `.gitignore` is configured to exclude `.env`
- Use `.env.example` as a template
- Store production secrets in secure vaults (AWS Secrets Manager, etc.)

## 📊 Current Implementation Status

### ✅ Completed (Phase 0)
- Microservices architecture setup
- Docker containerization for all services
- API Gateway with routing configuration
- MongoDB Atlas connection
- Environment configuration system
- Health check endpoints
- Development scripts

### 🔄 In Progress (Phase 1)
- FYERS WebSocket integration
- Real-time market data pipeline
- EMA & VWAP calculations
- Frontend live dashboard

## 🚀 Deployment

Will be deployed to:
- AWS ECS/EKS for container orchestration
- MongoDB Atlas for database
- CloudFront for CDN
- API Gateway for load balancing

## 📄 License

Private Project - Not for distribution

---

**Built with clean architecture, deterministic logic, and explainability at its core.**

🔗 **Repository:** [github.com/Ajinkyaa2004/ODX](https://github.com/Ajinkyaa2004/ODX)

## 📄 License

Private project - Not for distribution

---

**Built with clean architecture, deterministic logic, and explainability at its core.**
# ODX
