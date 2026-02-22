# Free Deployment Guide for ODX Dashboard

## 🆓 Total Cost: $0/month

### Architecture Overview
- **Frontend:** Vercel (Free tier)
- **Critical Backend Services:** Render.com (Free tier)
- **Database:** MongoDB Atlas M0 (Free tier)
- **AI Service:** GROQ API (Free tier - 30 requests/min)

---

## Step-by-Step Free Deployment

### 1. MongoDB Atlas (Database) - FREE

1. **Sign up:** https://www.mongodb.com/cloud/atlas/register
2. **Create free M0 cluster:**
   ```
   - Choose: AWS or GCP
   - Region: Choose closest to your users
   - Cluster Tier: M0 Sandbox (FREE)
   - Cluster Name: odx-cluster
   ```
3. **Create database user:**
   - Username: `odx_user`
   - Password: Generate strong password
4. **Whitelist IP:** `0.0.0.0/0` (allow from anywhere)
5. **Get connection string:**
   ```
   mongodb+srv://odx_user:<password>@odx-cluster.xxxxx.mongodb.net/odx?retryWrites=true&w=majority
   ```

---

### 2. Backend Services - Render.com (FREE)

**Limitation:** Services sleep after 15 min inactivity (30-60s cold start)

#### Deploy API Gateway (Spring Boot)

1. **Sign up:** https://dashboard.render.com/register
2. **New Web Service:**
   - **Repository:** Connect your GitHub repo
   - **Name:** `odx-api-gateway`
   - **Region:** Oregon (US West)
   - **Branch:** `main`
   - **Root Directory:** `services/api-gateway`
   - **Build Command:** `./mvnw clean package -DskipTests`
   - **Start Command:** `java -jar target/api-gateway-0.0.1-SNAPSHOT.jar`
   - **Instance Type:** Free
   
3. **Environment Variables:**
   ```bash
   SPRING_PROFILES_ACTIVE=production
   MONGODB_URI=mongodb+srv://odx_user:<password>@odx-cluster.xxxxx.mongodb.net/odx
   MARKET_DATA_SERVICE_URL=https://odx-market-data.onrender.com
   OPTION_CHAIN_SERVICE_URL=https://odx-option-chain.onrender.com
   QUANT_ENGINE_URL=https://odx-quant-engine.onrender.com
   RISK_SERVICE_URL=https://odx-risk.onrender.com
   JOURNAL_SERVICE_URL=https://odx-journal.onrender.com
   ```

#### Deploy Market Data Service (Spring Boot + Socket.io)

1. **New Web Service:**
   - **Name:** `odx-market-data`
   - **Root Directory:** `services/market-data-service`
   - **Build Command:** `./mvnw clean package -DskipTests`
   - **Start Command:** `java -jar target/market-data-service-0.0.1-SNAPSHOT.jar`
   - **Instance Type:** Free
   
2. **Environment Variables:**
   ```bash
   SPRING_PROFILES_ACTIVE=production
   MONGODB_URI=mongodb+srv://odx_user:<password>@odx-cluster.xxxxx.mongodb.net/odx
   FYERS_APP_ID=your_fyers_app_id
   FYERS_ACCESS_TOKEN=your_fyers_access_token
   SOCKET_IO_PORT=9092
   ```

#### Deploy Quant Engine (Python + Socket.io)

1. **New Web Service:**
   - **Name:** `odx-quant-engine`
   - **Root Directory:** `services/quant-engine`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python -m uvicorn app.main:app --host 0.0.0.0 --port 8001`
   - **Instance Type:** Free
   
2. **Environment Variables:**
   ```bash
   MONGODB_URI=mongodb+srv://odx_user:<password>@odx-cluster.xxxxx.mongodb.net/odx
   PYTHONUNBUFFERED=1
   ```

#### Optional: Deploy AI Reasoning Service

1. **New Web Service:**
   - **Name:** `odx-ai-reasoning`
   - **Root Directory:** `services/ai-reasoning-service`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python -m uvicorn app.main:app --host 0.0.0.0 --port 8002`
   - **Instance Type:** Free
   
2. **Environment Variables:**
   ```bash
   GROQ_API_KEY=your_groq_api_key
   MONGODB_URI=mongodb+srv://odx_user:<password>@odx-cluster.xxxxx.mongodb.net/odx
   ```

---

### 3. Frontend - Vercel (FREE)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Configure environment variables:**
   Create `frontend/.env.production`:
   ```bash
   NEXT_PUBLIC_API_BASE_URL=https://odx-api-gateway.onrender.com
   NEXT_PUBLIC_MARKET_DATA_SOCKET_URL=https://odx-market-data.onrender.com
   NEXT_PUBLIC_OPTION_CHAIN_SOCKET_URL=https://odx-option-chain.onrender.com
   NEXT_PUBLIC_QUANT_ENGINE_SOCKET_URL=https://odx-quant-engine.onrender.com
   ```

3. **Deploy:**
   ```bash
   cd frontend
   vercel --prod
   ```

4. **Set environment variables in Vercel dashboard:**
   - Go to: https://vercel.com/dashboard
   - Select your project
   - Settings → Environment Variables
   - Add all variables from `.env.production`

---

## Free Tier Limitations & Workarounds

### ⚠️ Cold Starts (Services Sleep)

**Problem:** Render free tier services sleep after 15 minutes of inactivity.

**Impact:**
- First request takes 30-60 seconds to wake up
- Socket.io connections may drop

**Workarounds:**

#### Option 1: Keep-Alive Pinger (Free)
Use **UptimeRobot** (free) to ping services every 5 minutes:
```bash
# Add these monitors (free account allows 50 monitors):
https://odx-api-gateway.onrender.com/actuator/health
https://odx-market-data.onrender.com/actuator/health
https://odx-quant-engine.onrender.com/health
```

**Sign up:** https://uptimerobot.com/

#### Option 2: Cron Job Pinger
Create a GitHub Action to ping services:

`.github/workflows/keep-alive.yml`:
```yaml
name: Keep Services Alive
on:
  schedule:
    - cron: '*/14 * * * *'  # Every 14 minutes
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping API Gateway
        run: curl https://odx-api-gateway.onrender.com/actuator/health
      
      - name: Ping Market Data
        run: curl https://odx-market-data.onrender.com/actuator/health
      
      - name: Ping Quant Engine
        run: curl https://odx-quant-engine.onrender.com/health
```

### ⚠️ Storage Limitations

**MongoDB Atlas M0:**
- 512MB storage limit
- Shared CPU/RAM

**Workarounds:**
- Implement data retention policy (delete old data after 30 days)
- Archive historical trades to JSON files
- Only store essential fields

**Add to backend services:**
```java
@Scheduled(cron = "0 0 2 * * *")  // Daily at 2 AM
public void cleanupOldData() {
    LocalDate cutoffDate = LocalDate.now().minusDays(30);
    mongoTemplate.remove(
        Query.query(Criteria.where("timestamp").lt(cutoffDate)),
        "trades"
    );
}
```

### ⚠️ FYERS Token Renewal

**Problem:** FYERS access token expires daily.

**Solution:** Create a token refresh endpoint and call it daily:

```bash
# Add to crontab or GitHub Action
curl -X POST https://odx-market-data.onrender.com/api/refresh-fyers-token
```

---

## Minimal Service Deployment (Most Critical Only)

If you want to deploy just the essentials:

### Must-Have Services (3):
1. ✅ **API Gateway** - Routes all requests
2. ✅ **Market Data Service** - Live price streaming (most important!)
3. ✅ **Quant Engine** - Setup score calculations

### Can Skip Initially (Deploy Later):
- ❌ Option Chain Service (can fetch from FYERS directly in frontend as fallback)
- ❌ Risk Service (calculate PnL in frontend initially)
- ❌ Journal Service (use MongoDB directly or localStorage)
- ❌ AI Reasoning Service (optional feature)

---

## Free API Alternatives

### GROQ API (LLM for AI Reasoning) - FREE
- **Free tier:** 30 requests/min, 7000 requests/day
- **No credit card required**
- **Sign up:** https://console.groq.com/
- **Models:** llama3-70b, mixtral-8x7b

### FYERS API - FREE (with trading account)
- **Cost:** Need FYERS trading account
- **Free for existing FYERS clients**
- **Alternative:** Use Yahoo Finance API (limited data)

---

## Deployment Cost Comparison

| Option | Monthly Cost | Best For |
|--------|--------------|----------|
| **100% Free** | **$0** | Testing, learning, low usage |
| Render Free + MongoDB M0 | $0 | Personal use, accept cold starts |
| Railway ($5 credit) + MongoDB M0 | $0 (with limits) | Better uptime |
| VPS + Self-hosted | $5-10 | Full control, Oracle Cloud free tier |
| **Recommended Paid** | $48-93 | Production, real trading |

---

## Oracle Cloud Free Tier (Advanced Option)

**Alternative 100% Free:** Oracle Cloud has a generous "Always Free" tier:

- 2 AMD VMs (1GB RAM each)
- 4 ARM VMs (24GB RAM total!)
- 200GB storage
- 10TB bandwidth/month

**Deploy all services on ARM VM:**
```bash
# SSH into Oracle Cloud VM
ssh ubuntu@your-vm-ip

# Install Docker
curl -fsSL https://get.docker.com | sh

# Clone and deploy
git clone <your-repo>
cd odx
docker-compose up -d
```

**Pros:**
- Truly free forever (not a trial)
- Enough resources for all 8 services
- No cold starts

**Cons:**
- More complex setup
- Need to manage VM manually
- Learning curve

---

## Quick Start: Deploy in 10 Minutes

### 1. MongoDB Atlas (2 min)
```bash
1. Sign up: mongodb.com/cloud/atlas/register
2. Create M0 cluster
3. Copy connection string
```

### 2. Render.com Services (5 min)
```bash
1. Sign up: dashboard.render.com/register
2. Connect GitHub repository
3. Deploy 3 services (API Gateway, Market Data, Quant Engine)
4. Add environment variables
```

### 3. Vercel Frontend (2 min)
```bash
cd frontend
vercel --prod
# Add environment variables in Vercel dashboard
```

### 4. UptimeRobot Keep-Alive (1 min)
```bash
1. Sign up: uptimerobot.com
2. Add 3 monitors for your Render services
3. Check interval: 5 minutes
```

**Total time:** ~10 minutes
**Total cost:** $0/month

---

## Testing Your Free Deployment

### 1. Verify Services
```bash
# API Gateway
curl https://odx-api-gateway.onrender.com/actuator/health

# Market Data
curl https://odx-market-data.onrender.com/actuator/health

# Quant Engine
curl https://odx-quant-engine.onrender.com/health
```

### 2. Test Frontend
Visit your Vercel URL and check:
- ✅ Dashboard loads
- ✅ Real-time price updates (may take 30s to wake up)
- ✅ Setup scores calculating
- ✅ Charts rendering

### 3. Monitor Cold Starts
- First request: 30-60s delay (expected)
- After wake-up: <200ms response time
- Services stay awake for 15 minutes

---

## When to Upgrade to Paid

Consider upgrading when:
- ❌ Cold starts become annoying (30-60s delays)
- ❌ Socket.io disconnects frequently
- ❌ You're trading real money (need reliability)
- ❌ Multiple users accessing dashboard
- ❌ Need 24/7 monitoring without sleep

**Recommended first upgrade:** Render.com Starter ($7/service/month)
- No cold starts
- Always-on services
- Better for Socket.io connections

---

## Troubleshooting Free Deployment

### Issue: Service Won't Start
```bash
# Check Render logs
# Go to: dashboard.render.com → Your Service → Logs

# Common issues:
- Build timeout (free tier has limits)
- Memory exceeded (reduce heap size)
- Port binding errors
```

### Issue: Socket.io Connections Failing
```bash
# Problem: CORS or WebSocket upgrade issues
# Solution: Add to application.properties

server.forward-headers-strategy=native
spring.webflux.cors.allowed-origins=*
```

### Issue: MongoDB Connection Timeout
```bash
# Problem: IP not whitelisted
# Solution: In MongoDB Atlas
1. Network Access
2. Add IP: 0.0.0.0/0
3. Save
```

### Issue: FYERS API 401 Unauthorized
```bash
# Problem: Access token expired (daily)
# Solution: Renew token daily
# Use: myapi.fyers.in/token-generator
```

---

## Free Deployment Checklist

- [ ] MongoDB Atlas M0 cluster created
- [ ] Database user created with strong password
- [ ] IP whitelist set to 0.0.0.0/0
- [ ] Render.com account created
- [ ] GitHub repository connected to Render
- [ ] 3 services deployed (API Gateway, Market Data, Quant Engine)
- [ ] Environment variables added to all services
- [ ] FYERS API credentials configured
- [ ] Vercel CLI installed
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables set
- [ ] UptimeRobot monitors added (3 services)
- [ ] Services responding to health checks
- [ ] Frontend loading successfully
- [ ] Real-time data streaming working

---

## Success Metrics for Free Tier

Your free deployment is successful if:
- ✅ Services respond within 1 minute (including cold start)
- ✅ Real-time data updates during market hours
- ✅ Dashboard accessible 24/7 from Vercel
- ✅ MongoDB storing data correctly
- ✅ No costs incurred for 30 days

---

## Conclusion

**YES, 100% free deployment is possible!**

**Limitations to accept:**
- 30-60 second cold starts after inactivity
- 512MB MongoDB storage (delete old data regularly)
- FYERS token manual renewal daily
- Reduced reliability compared to paid options

**Perfect for:**
- Learning and testing
- Personal paper trading
- Low-frequency usage
- MVP/prototype demonstration

**When ready to scale:** Upgrade to DigitalOcean VPS ($48/mo) for 24/7 uptime.

Need help with the free deployment? Let me know which platform you want to start with!
