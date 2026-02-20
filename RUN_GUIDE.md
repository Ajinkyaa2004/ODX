# 🚀 Quick Start Guide

## Prerequisites

Check if you have Docker installed:
```bash
docker --version
docker compose version
```

If not installed, download from: https://www.docker.com/products/docker-desktop

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/Ajinkyaa2004/ODX.git
cd ODX
```

---

## Step 2: Set Up Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit the `.env` file with your credentials:
```bash
nano .env
# or
code .env
```

**Required Variables:**
- `MONGODB_URI` - Your MongoDB Atlas connection string
- `FYERS_CLIENT_ID` - Your FYERS API client ID
- `FYERS_SECRET_KEY` - Your FYERS API secret
- `FYERS_ACCESS_TOKEN` - Your FYERS access token
- `GROQ_API_KEY` - Your GROQ API key

---

## Step 3: Build and Run All Services

```bash
docker compose up --build -d
```

**What this does:**
- `--build` - Rebuilds all Docker images
- `-d` - Runs containers in detached mode (background)

Wait 30-60 seconds for all services to start.

---

## Step 4: Check Running Services

```bash
docker compose ps
```

You should see 8 services running.

---

## Step 5: Access the Application

Open your browser and visit:

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:3000 |
| **API Gateway** | http://localhost:8080 |
| **Market Data Service** | http://localhost:8081/health |
| **Option Chain Service** | http://localhost:8082/health |
| **Risk Service** | http://localhost:8083/health |
| **Journal Service** | http://localhost:8084/health |
| **Quant Engine** | http://localhost:8001/health |
| **AI Reasoning Service** | http://localhost:8002/health |

---

## Common Commands

### View Logs

View all logs:
```bash
docker compose logs -f
```

View specific service logs:
```bash
docker compose logs -f frontend
docker compose logs -f api-gateway
docker compose logs -f market-data-service
docker compose logs -f quant-engine
docker compose logs -f ai-reasoning-service
```

### Stop Services

Stop all services (keeps containers):
```bash
docker compose stop
```

### Restart Services

Restart all services:
```bash
docker compose restart
```

Restart specific service:
```bash
docker compose restart frontend
```

### Stop and Remove Everything

```bash
docker compose down
```

Remove everything including volumes:
```bash
docker compose down -v
```

### Rebuild After Code Changes

```bash
docker compose up --build -d
```

---

## Health Check Script

Run the automated health check:

**On macOS/Linux:**
```bash
chmod +x scripts/health-check.sh
./scripts/health-check.sh
```

**On Windows:**
```cmd
scripts\health-check.bat
```

---

## Troubleshooting

### Services Not Starting

1. Check logs for errors:
```bash
docker compose logs -f
```

2. Check if ports are already in use:
```bash
lsof -i :3000  # Frontend
lsof -i :8080  # API Gateway
lsof -i :8081  # Market Data
```

3. Restart Docker Desktop and try again.

### Build Failures

Clean everything and rebuild:
```bash
docker compose down -v
docker system prune -a
docker compose up --build -d
```

### Environment Variable Issues

Ensure `.env` file exists and has correct values:
```bash
cat .env
```

### MongoDB Connection Error

Verify your MongoDB Atlas URI:
- Check if IP is whitelisted in MongoDB Atlas
- Verify username/password are correct
- Test connection string format

---

## Development Mode

If you want to run services individually for development:

### Backend Services (Spring Boot)
```bash
cd services/api-gateway
./mvnw spring-boot:run
```

### Python Services
```bash
cd services/quant-engine
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Stopping Everything

When you're done for the day:

```bash
docker compose down
```

This stops and removes all containers while keeping your images and volumes.

---

## Next Steps

Once everything is running:

1. Check [PHASES.md](PHASES.md) to see the development roadmap
2. Read [PHASE_0_COMPLETE.md](PHASE_0_COMPLETE.md) for what's implemented
3. Visit http://localhost:3000 to access the frontend
4. Explore the API at http://localhost:8080

---

## Quick Reference

```bash
# Start everything
docker compose up -d

# View logs
docker compose logs -f

# Stop everything
docker compose down

# Rebuild and restart
docker compose up --build -d

# Check status
docker compose ps

# Health check
./scripts/health-check.sh
```
