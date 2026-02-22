# 🚀 Phase 7 Quick Start Guide

## Prerequisites
- Docker and Docker Compose installed
- Groq API key (optional - will use mock data without it)
- All previous phases working

## Step 1: Configure Groq API (Optional)

### Get Groq API Key
1. Visit [https://console.groq.com](https://console.groq.com)
2. Sign up / Log in
3. Navigate to API Keys section
4. Create new API key
5. Copy the key

### Set Environment Variable
```bash
# Create or edit .env file in services/ai-reasoning-service/
echo "GROQ_API_KEY=your_api_key_here" > services/ai-reasoning-service/.env
echo "GROQ_MODEL=llama-3.1-70b-versatile" >> services/ai-reasoning-service/.env
```

**Note:** If you skip this step, the service will use mock reasoning (still functional for testing).

## Step 2: Start Services

### Start All Services
```bash
cd /path/to/odx
docker-compose up -d
```

### Verify AI Service is Running
```bash
# Check service health
curl http://localhost:8002/health

# Test Groq connection
curl http://localhost:8002/api/ai/test-connection
```

Expected response (with API key):
```json
{
  "status": "CONNECTED",
  "message": "Groq API connection successful",
  "model": "llama-3.1-70b-versatile",
  "generation_time_ms": 890
}
```

Expected response (without API key - mock mode):
```json
{
  "status": "NOT_CONFIGURED",
  "message": "Groq API key not set. Service will use mock reasoning.",
  "model": "llama-3.1-70b-versatile"
}
```

## Step 3: Access Frontend

1. Open browser: `http://localhost:3000/dashboard`
2. Scroll to "NIFTY" or "BANKNIFTY" section
3. Find the **"🤖 AI Trade Analysis"** panel
4. Click **"Generate"** button

### What to Expect
- Loading spinner appears: "Generating AI analysis..."
- After 1-2 seconds, reasoning appears with:
  - Trade Reasoning (blue box)
  - Key Strengths (green box)
  - Key Risks (red box)
  - Invalidation Condition (orange box)
  - Suggested Action (purple box)
  - Confidence badge (HIGH/MEDIUM/LOW)

## Step 4: Test API Directly

### Generate Reasoning via API
```bash
curl -X POST http://localhost:8002/api/ai/generate-reasoning \
  -H "Content-Type: application/json" \
  -d '{
    "evaluation_data": {
      "symbol": "NIFTY",
      "setup_score": 7.5,
      "no_trade_score": 3.2,
      "decision": "TRADE",
      "threshold": 6.5,
      "no_trade_threshold": 5.0,
      "trend_score": 8.5,
      "trend_direction": "BULLISH",
      "vwap_score": 7.0,
      "vwap_status": "Above VWAP",
      "structure_score": 7.5,
      "oi_score": 8.0,
      "oi_pattern": "Call buying at support",
      "volatility_score": 6.5,
      "volatility_regime": "MODERATE",
      "momentum_score": 7.8,
      "internal_score": 7.2,
      "time_risk": "PRIME_TIME",
      "fake_breakout_risk": "LOW",
      "recommended_strike": 22450,
      "option_type": "CALL"
    },
    "force_regenerate": false
  }'
```

## Step 5: Verify Logs

### Check AI Service Logs
```bash
docker-compose logs ai-reasoning-service -f
```

Look for:
```
INFO:     AI Reasoning Service Starting...
INFO:     Groq API Configured: True
INFO:     Generating reasoning for NIFTY
INFO:     Successfully generated reasoning in 1450ms
```

## Common Issues & Solutions

### Issue 1: "Failed to connect to AI service"
**Solution:**
```bash
# Check if service is running
docker-compose ps ai-reasoning-service

# Restart service
docker-compose restart ai-reasoning-service

# Check logs
docker-compose logs ai-reasoning-service
```

### Issue 2: "Rate limit exceeded"
**Solution:**
- Wait 1 minute and retry
- Service automatically retries with exponential backoff
- Free tier has usage limits

### Issue 3: Mock data instead of real reasoning
**Solution:**
```bash
# Verify API key is set
docker-compose exec ai-reasoning-service env | grep GROQ_API_KEY

# If not set, add to .env and restart
docker-compose down
docker-compose up -d
```

### Issue 4: JSON parse error
**Solution:**
- Service automatically retries (3 attempts)
- Falls back to mock reasoning if all retries fail
- Check logs for detailed error messages

## Development Mode

### Run AI Service Locally
```bash
cd services/ai-reasoning-service

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export GROQ_API_KEY=your_key_here
export GROQ_MODEL=llama-3.1-70b-versatile

# Run with auto-reload
uvicorn app.main:app --reload --port 8002
```

### Test Prompt Generation
```bash
cd services/ai-reasoning-service
python -m app.prompts
```

## API Documentation

Access interactive API docs:
- **Swagger UI:** http://localhost:8002/docs
- **ReDoc:** http://localhost:8002/redoc

## Quick Test Script

Save as `test_phase7.sh`:
```bash
#!/bin/bash

echo "Testing Phase 7 - AI Reasoning Layer"
echo "===================================="

echo "\n1. Testing service health..."
curl -s http://localhost:8002/health | jq

echo "\n2. Testing Groq connection..."
curl -s http://localhost:8002/api/ai/test-connection | jq

echo "\n3. Generating reasoning..."
curl -s -X POST http://localhost:8002/api/ai/generate-reasoning \
  -H "Content-Type: application/json" \
  -d '{
    "evaluation_data": {
      "symbol": "NIFTY",
      "setup_score": 7.5,
      "no_trade_score": 3.2,
      "decision": "TRADE",
      "threshold": 6.5,
      "no_trade_threshold": 5.0,
      "trend_score": 8.5,
      "trend_direction": "BULLISH",
      "vwap_score": 7.0,
      "vwap_status": "Above VWAP",
      "structure_score": 7.5,
      "oi_score": 8.0,
      "oi_pattern": "Call buying",
      "volatility_score": 6.5,
      "volatility_regime": "MODERATE",
      "momentum_score": 7.8,
      "internal_score": 7.2,
      "time_risk": "PRIME_TIME",
      "fake_breakout_risk": "LOW"
    }
  }' | jq

echo "\n✅ Phase 7 testing complete!"
```

Run it:
```bash
chmod +x test_phase7.sh
./test_phase7.sh
```

## Next Steps

1. ✅ Verify all components working
2. Test with different evaluation scores
3. Try both NIFTY and BANKNIFTY
4. Monitor generation times
5. Review reasoning quality
6. Move to Phase 8 (Optimization)

## Support

- **API Documentation:** http://localhost:8002/docs
- **Service Health:** http://localhost:8002/health
- **Frontend:** http://localhost:3000/dashboard

---

**Ready to use!** Phase 7 is now operational. 🎉
