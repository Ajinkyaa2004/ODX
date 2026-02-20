<div align="center">

# 📈 ODX - Options Decision Intelligence Engine

### AI-Powered Intraday Options Trading Decision Support System

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?style=flat&logo=spring&logoColor=white)](https://spring.io/projects/spring-boot)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![Phase](https://img.shields.io/badge/Phase-0_Complete-brightgreen?style=flat)](https://github.com/Ajinkyaa2004/ODX)
[![License](https://img.shields.io/badge/License-Private-red?style=flat)](LICENSE)

[🚀 Features](#-features) • [📦 Quick Start](#-quick-start) • [🛠️ Tech Stack](#️-tech-stack) • [📖 Documentation](#-documentation) • [🏗️ Architecture](#️-architecture)

</div>

---

## 🎯 Overview

**ODX** is a cutting-edge intraday options trading decision support system that combines real-time market data with deterministic scoring algorithms and AI-powered reasoning. Built specifically for **NIFTY & BANKNIFTY** options trading, ODX provides data-driven insights through multi-layered analysis, helping traders make informed decisions during market hours (9:15 AM - 3:30 PM IST).

### Why This Platform?

| Feature | Description |
|---------|-------------|
| 🎯 **Deterministic Scoring** | Scientific weighted linear scoring system combining 7 technical factors with explainable logic |
| 📊 **Real-Time Data** | Integrates with FYERS WebSocket API for live 1-minute OHLC data and options chain updates |
| ⚡ **Lightning Fast** | Microservices architecture with reactive Spring Boot and async FastAPI for sub-second responses |
| 🤖 **AI-Powered Insights** | GROQ's Llama 3.1 70B provides intelligent reasoning without overriding deterministic signals |
| 🔒 **Production-Ready** | Dockerized microservices with MongoDB Atlas, API Gateway, and comprehensive health monitoring |
| 💰 **Brokerage-Aware** | Built-in PnL calculator with accurate brokerage, STT, and exchange fee calculations |

---

## 📦 Quick Start

```bash
# Clone the repository
git clone https://github.com/Ajinkyaa2004/ODX.git && cd ODX

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI, FYERS credentials, and GROQ API key

# Start all 8 services with Docker Compose
docker compose up -d

# Check service health
./scripts/health-check.sh
```

Open [http://localhost:3000](http://localhost:3000) to see the dashboard 🎉

📚 Need detailed setup? See [PHASE_0_SETUP.md](PHASE_0_SETUP.md)

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Architecture](#️-architecture)
- [Installation](#-installation)
- [Project Structure](#-project-structure)
- [Services Overview](#-services-overview)
- [Deployment](#-deployment)
- [Phase Roadmap](#-phase-roadmap)
- [Documentation](#-documentation)

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 📊 Setup Score Engine

- 🎯 7-factor weighted scoring system
- 📈 Trend Analysis (EMA 9, 20, 50)
- 💹 VWAP-based mean reversion logic
- 📊 Market structure evaluation
- 🔢 OI confirmation from options chain
- ⚡ Volatility & momentum indicators
- 🌍 Market internals integration

</td>
<td width="50%">

### 🚫 No-Trade Score

- ⏰ Time-based risk assessment
- 📉 Chop detection algorithms
- 🎯 Resistance proximity checks
- 📊 Volatility compression detection
- 🛡️ Consecutive loss guard
- 🎚️ Dynamic threshold adjustments
- ⚖️ 3 modes: Conservative, Balanced, Aggressive

</td>
</tr>
<tr>
<td width="50%">

### 🔄 Real-Time Market Data

- 🔌 FYERS WebSocket integration
- ⏱️ 1-minute OHLC candles
- 📡 Live price updates
- 📊 Futures OI tracking
- ⏰ Market hours gating (9:15-3:30 IST)
- 💾 3-minute snapshot storage
- 🔄 Auto-reconnection handling

</td>
<td width="50%">

### 📈 Options Chain Intelligence

- 🎯 ATM ±2 strike analysis
- 📊 Open Interest tracking
- 💰 Greeks calculation
- 📉 IV surface mapping
- 🔢 Lot size configuration
- 💹 Premium analysis
- 🎯 Strike selection logic

</td>
</tr>
<tr>
<td width="50%">

### 💰 Risk & PnL Engine

- 📊 Position sizing calculator
- 💵 Brokerage-inclusive PnL
- 🏦 Multi-broker support (Angel One, FYERS)
- 📈 Real-time P&L tracking
- 🎯 Risk-reward ratios
- 🛡️ Max loss enforcement
- 📉 Drawdown monitoring

</td>
<td width="50%">

### 📝 Trade Journal

- 📊 Complete trade lifecycle tracking
- 📈 Performance analytics
- 🎯 Win rate calculations
- 📉 Loss pattern analysis
- 📅 Historical data storage
- 🔍 Filter & search capabilities
- 📊 Exportable reports

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

### Core Technologies

![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

<details>
<summary><b>📋 Complete Technology Breakdown</b></summary>

### Backend - Java Services (Spring Boot 3.2)

| Service | Port | Technology Stack |
|---------|------|------------------|
| **API Gateway** | 8080 | Spring Cloud Gateway, WebFlux, Reactive MongoDB |
| **Market Data** | 8081 | Spring WebFlux, WebSocket Client, MongoDB Reactive |
| **Option Chain** | 8082 | Spring WebFlux, Reactive Streams, MongoDB |
| **Risk Service** | 8083 | Spring WebFlux, MongoDB Reactive, Bean Validation |
| **Journal Service** | 8084 | Spring WebFlux, MongoDB Reactive, Metrics |

### Backend - Python Services (FastAPI)

| Service | Port | Technology Stack |
|---------|------|------------------|
| **Quant Engine** | 8001 | FastAPI, Pandas, NumPy, Motor (Async MongoDB) |
| **AI Reasoning** | 8002 | FastAPI, GROQ SDK, Motor, Pydantic |

### Frontend Stack

- **Next.js** 14.1.0 - React framework with App Router
- **TypeScript** 5.3+ - Type-safe development
- **TailwindCSS** 3.4 - Utility-first styling
- **Socket.io Client** 4.6.1 - Real-time communication
- **React Query** 5.17 - Server state management
- **Zustand** 4.5 - Client state management
- **Recharts** 2.10 - Data visualization

</details>

---

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

### Design Patterns

| Pattern | Implementation | Benefit |
|---------|----------------|---------|
| **Microservices Architecture** | 8 independent services | Scalability, fault isolation |
| **API Gateway Pattern** | Spring Cloud Gateway | Single entry point, routing |
| **Reactive Programming** | Spring WebFlux | Non-blocking I/O |
| **Event-Driven** | WebSocket + Socket.io | Real-time updates |

---

## 💻 Installation

### Prerequisites

- ☕ **Java** 17 or higher
- 🐍 **Python** 3.11 or higher
- 📦 **Node.js** 18 or higher
- 🐳 **Docker** & Docker Compose
- 🍃 **MongoDB Atlas** account

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Ajinkyaa2004/ODX.git
cd ODX
```

### 2️⃣ Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/intraday_decision

# FYERS API
FYERS_APP_ID=your_fyers_app_id
FYERS_ACCESS_TOKEN=your_fyers_access_token

# GROQ API
GROQ_API_KEY=your_groq_api_key

# Service Ports (defaults)
API_GATEWAY_PORT=8080
MARKET_DATA_SERVICE_PORT=8081
OPTION_CHAIN_SERVICE_PORT=8082
RISK_SERVICE_PORT=8083
JOURNAL_SERVICE_PORT=8084
QUANT_ENGINE_PORT=8001
AI_REASONING_SERVICE_PORT=8002
FRONTEND_PORT=3000
```

### 3️⃣ Start All Services

```bash
# Using Docker Compose (Recommended)
docker compose up -d

# Check container status
docker compose ps

# View logs
docker compose logs -f
```

### 4️⃣ Verify Services

```bash
# Run health check script
./scripts/health-check.sh

# Or manually check each service
curl http://localhost:8080/actuator/health  # API Gateway
curl http://localhost:8001/health           # Quant Engine
curl http://localhost:8002/health           # AI Reasoning
```

Open [http://localhost:3000](http://localhost:3000) 🚀

---

## 📁 Project Structure

```
ODX/
├── services/
│   ├── api-gateway/              # API Gateway (Port 8080)
│   │   ├── src/main/java/
│   │   │   └── com/intraday/gateway/
│   │   │       ├── ApiGatewayApplication.java
│   │   │       └── controller/HealthController.java
│   │   ├── Dockerfile
│   │   └── pom.xml
│   │
│   ├── market-data-service/      # Market Data  (Port 8081)
│   │   ├── src/main/java/
│   │   │   └── com/intraday/marketdata/
│   │   │       ├── MarketDataServiceApplication.java
│   │   │       └── controller/HealthController.java
│   │   ├── Dockerfile
│   │   └── pom.xml
│   │
│   ├── option-chain-service/     # Option Chain (Port 8082)
│   │   └── [Similar structure]
│   │
│   ├── risk-service/             # Risk Service (Port 8083)
│   │   └── [Similar structure]
│   │
│   ├── journal-service/          # Journal (Port 8084)
│   │   └── [Similar structure]
│   │
│   ├── quant-engine/             # Quant Engine (Port 8001)
│   │   ├── app/
│   │   │   ├── main.py           # FastAPI application
│   │   │   └── config.py         # Configuration
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   └── ai-reasoning-service/     # AI Reasoning (Port 8002)
│       ├── app/
│       │   ├── main.py           # FastAPI application
│       │   └── config.py         # Configuration
│       ├── Dockerfile
│       └── requirements.txt
│
├── frontend/                     # Next.js Frontend (Port 3000)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx        # Root layout
│   │   │   ├── page.tsx          # Landing page
│   │   │   └── globals.css       # Global styles
│   │   └── components/           # React components
│   ├── Dockerfile
│   └── package.json
│
├── scripts/
│   ├── health-check.sh           # Health check script
│   ├── start.sh                  # Start services
│   └── stop.sh                   # Stop services
│
├── docker-compose.yml            # Docker orchestration
├── .env.example                  # Environment template
├── .gitignore                    # Git exclusions
├── README.md                     # This file
├── PHASES.md                     # Implementation roadmap
├── PHASE_0_COMPLETE.md           # Phase 0 report
└── PHASE_0_SETUP.md              # Setup guide
```

---

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

---

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

---

## 🚀 Deployment

### Quick Deployment Options

- ☁️ **AWS ECS/EKS** - Container orchestration
- 🌐 **Azure Container Instances** - Managed containers
- 🔧 **Google Cloud Run** - Serverless containers
- 🐳 **Docker Swarm** - Native Docker orchestration
- ☸️ **Kubernetes** - Production-grade orchestration

### Environment Variables for Production

```env
# Required
MONGODB_URI=mongodb+srv://production_user:password@cluster.mongodb.net/
FYERS_APP_ID=production_app_id
FYERS_ACCESS_TOKEN=production_token
GROQ_API_KEY=production_groq_key

# Optional
NODE_ENV=production
SPRING_PROFILES_ACTIVE=production
```

> ⚠️ **Security Note**: Never commit `.env` to version control. Use secret management services in production.

---

## 🗺️ Phase Roadmap

### ✅ Phase 0 - Infrastructure (COMPLETED)

- [x] Monorepo structure setup
- [x] Docker Compose orchestration
- [x] 5 Spring Boot microservices (API Gateway, Market Data, Option Chain, Risk, Journal)
- [x] 2 Python FastAPI services (Quant Engine, AI Reasoning)
- [x] Next.js 14 frontend
- [x] MongoDB Atlas integration
- [x] Health check endpoints
- [x] Development scripts

### 🚧 Phase 1 - Market Data & Live Pipeline (IN PROGRESS)

- [ ] FYERS WebSocket integration
- [ ] Real-time 1min OHLC data fetching
- [ ] EMA calculation (9, 20, 50)
- [ ] VWAP calculator
- [ ] Frontend live ticker
- [ ] Socket.io server for push updates

### 📅 Phase 2 - Basic Scoring Engine

- [ ] Setup Score calculation
- [ ] Component scoring (Trend, VWAP, Structure)
- [ ] Score aggregation logic
- [ ] Frontend score display
- [ ] REST endpoints for scores

### 📅 Phase 3 - Option Chain Intelligence

- [ ] Real-time option chain fetching
- [ ] ATM ±2 strike filtering
- [ ] OI analysis algorithms
- [ ] Greeks calculation
- [ ] Premium tracking
- [ ] Strike selection logic

### 📅 Phase 4 - Advanced Filters & No-Trade Score

- [ ] No-Trade Score implementation
- [ ] Time risk assessment
- [ ] Chop detection
- [ ] Volatility compression
- [ ] Consecutive loss guard
- [ ] Final signal generation

### 📅 Phase 5 - Risk Engine & PnL Calculator

- [ ] Position sizing logic
- [ ] Brokerage calculation
- [ ] PnL tracking
- [ ] Risk-reward ratios
- [ ] Max loss enforcement
- [ ] Multi-broker support

### 📅 Phase 6 - Trade Journal & Analytics

- [ ] Trade entry/exit logging
- [ ] Performance analytics
- [ ] Win rate calculations
- [ ] Historical data analysis
- [ ] Export functionality
- [ ] Filter & search

### 📅 Phase 7 - AI Reasoning Layer

- [ ] GROQ Llama 3.1 integration
- [ ] Context preparation
- [ ] Score explanation generation
- [ ] Risk narrative creation
- [ ] Frontend AI chat interface

### 📅 Phase 8 - Global Sentiment & Deployment

- [ ] Global market indicators
- [ ] VIX integration
- [ ] News sentiment
- [ ] Production deployment
- [ ] Monitoring & logging
- [ ] Performance optimization

---

## 📖 Documentation

- 📘 [PHASE_0_SETUP.md](PHASE_0_SETUP.md) - Detailed setup instructions
- 🏗️ [PHASE_0_COMPLETE.md](PHASE_0_COMPLETE.md) - Phase 0 completion report
- 🗺️ [PHASES.md](PHASES.md) - Complete development roadmap

---

## 🔒 Non-Negotiable Rules

- ❌ No machine learning models
- ❌ No price predictions
- ❌ No raw tick data storage (processed only)
- ❌ AI never generates trade signals
- ❌ No scope beyond NIFTY & BANKNIFTY
- ✅ All scoring must be deterministic & explainable

---

## 🤝 Contributing

This is a structured project following strict architectural principles.

### Development Workflow

```bash
# Fork and clone
git clone https://github.com/Ajinkyaa2004/ODX.git
cd ODX

# Create feature branch
git checkout -b feature/my-feature

# Make changes and test
docker compose up --build

# Commit and push
git add .
git commit -m "feat: add amazing feature"
git push origin feature/my-feature
```

---

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

---

<div align="center">

## 📈 ODX - Options Decision Intelligence Engine

Made with ❤️ for intraday options traders

[GitHub Repository](https://github.com/Ajinkyaa2004/ODX) • [Documentation](PHASES.md) • [Report Issues](https://github.com/Ajinkyaa2004/ODX/issues)

**⭐ Star this project if you find it useful!**

---

**Built with clean architecture, deterministic logic, and explainability at its core.**

🔗 **Phase 0 Complete** - Ready for Phase 1 Development

</div>
