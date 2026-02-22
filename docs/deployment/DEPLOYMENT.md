# ODX Deployment Guide

## Overview
ODX (Options Decision Intelligence) is a microservices-based trading dashboard for intraday NIFTY/BANKNIFTY options trading. This guide covers deployment options for production environments.

---

## Architecture

**Frontend:**
- Next.js 14 (React 18, TypeScript)
- Real-time Socket.io connections
- TailwindCSS styling

**Backend Services:**
- API Gateway (Spring Boot) - Port 8080
- Market Data Service (Spring Boot + Socket.io) - Port 8081, 9092
- Option Chain Service (Spring Boot + Socket.io) - Port 8082, 9093
- Quant Engine (Python FastAPI + Socket.io) - Port 8001
- AI Reasoning Service (Python FastAPI) - Port 8002
- Risk Service (Spring Boot) - Port 8083
- Journal Service (Spring Boot) - Port 8084

**Database:**
- MongoDB (for snapshots, scores, trades)

**External APIs:**
- FYERS API (market data streaming)

---

## Deployment Options

### Option 1: Self-Hosted (VPS/Dedicated Server)

**Recommended Providers:**
- **DigitalOcean** ($40-80/month for 8GB RAM droplet)
- **AWS  EC2** (t3.large or t3.xlarge ~$60-150/month)
- **Google Cloud Platform** (e2-standard-4 ~$100/month)
- **Linode** ($48-96/month)
- **Vultr** ($48-96/month)

**Minimum Requirements:**
- 8GB RAM
- 4 CPU cores
- 80GB SSD storage
- Ubuntu 22.04 LTS

**Setup Steps:**

1. **Install Docker & Docker Compose:**
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

2. **Clone Repository:**
```bash
git clone <your-repo-url> odx
cd odx
```

3. **Configure Environment:**
```bash
cp .env.example .env
nano .env
```

Update:
- `MONGODB_URI` (use MongoDB Atlas or local instance)
- `FYERS_APP_ID` and `FYERS_ACCESS_TOKEN`
- `GROQ_API_KEY` (for AI reasoning)
- `NEXT_PUBLIC_API_BASE_URL` (your server's public IP/domain)

4. **Build and Deploy:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

5. **Verify Services:**
```bash
docker ps
curl http://localhost:8080/actuator/health
```

6. **Setup Nginx Reverse Proxy (Optional but Recommended):**
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/odx
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /socket.io/ {
        proxy_pass http://localhost:9092/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/odx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

7. **Setup SSL (Let's Encrypt):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

### Option 2: Cloud Platform as a Service (PaaS)

#### **Frontend (Vercel - Recommended)**

**Pros:** Free tier, automatic deployments, CDN, SSL
**Deployment:**

1. Push frontend code to GitHub
2. Import on vercel.com
3. Set environment variables:
   - `NEXT_PUBLIC_API_BASE_URL`
   - `NEXT_PUBLIC_WS_URL`
4. Deploy

**Cost:** Free (Hobby tier sufficient)

#### **Backend Services (Cloud Run / App Engine / Heroku)**

**Google Cloud Run:**
- Build each service as container
- Deploy individually
- Pay per request (~$10-50/month)

**Heroku:**
- Use buildpacks for Java/Python
- Deploy each service
- ~$7/dyno/month × 7 = $49/month

---

### Option 3: Kubernetes (For Scale)

**Providers:**
- **Google Kubernetes Engine (GKE)**
- **AWS EKS**
- **Azure AKS**
- **DigitalOcean Kubernetes**

**Cost:** ~$150-300/month minimum
**Use Case:** High traffic, need auto-scaling

---

## Database Options

### MongoDB Atlas (Managed - Recommended)

**Pros:** Free tier (512MB), managed backups, automatic scaling
**Setup:**
1. Create cluster at mongodb.com/cloud/atlas
2. Add IP whitelist (0.0.0.0/0 for testing)
3. Create database user
4. Copy connection string to `.env`

**Cost:** Free tier → $9/month (M2) → $25/month (M5)

### Self-Hosted MongoDB

**Docker Deployment:**
```yaml
mongodb:
  image: mongo:7
  container_name: odx-mongodb
  ports:
    - "27017:27017"
  environment:
    MONGO_INITDB_ROOT_USERNAME: admin
    MONGO_INITDB_ROOT_PASSWORD: strong_password
  volumes:
    - mongodb_data:/data/db
  restart: always

volumes:
  mongodb_data:
```

---

## Recommended Production Stack

**For Individual Traders ($0-$60/month):**
- **Frontend:** Vercel (Free)
- **Backend:** DigitalOcean $48/month droplet
- **Database:** MongoDB Atlas Free Tier
- **Total:** ~$48/month

**For Small Teams ($100-$150/month):**
- **Frontend:** Vercel Pro ($20/month)
- **Backend:** AWS EC2 t3.large ($70/month)
- **Database:** MongoDB Atlas M5 ($25/month)
- **Load Balancer:** AWS ALB ($20/month)
- **Total:** ~$135/month

**For Production Trading Firm ($300-$500/month):**
- **Frontend:** Vercel + CDN
- **Backend:** Kubernetes cluster (GKE/EKS)
- **Database:** MongoDB Atlas M30 ($150/month)
- **Monitoring:** Datadog/New Relic ($50/month)
- **Total:** ~$400-500/month

---

## Security Checklist

- [ ] Change all default passwords
- [ ] Enable firewall (only expose necessary ports)
- [ ] Use SSL/TLS certificates
- [ ] Secure MongoDB with authentication
- [ ] Never commit `.env` files
- [ ] Use secrets management (AWS Secrets Manager, Vault)
- [ ] Enable rate limiting on API Gateway
- [ ] Implement CORS properly
- [ ] Use secure WebSocket connections (WSS)
- [ ] Enable Docker security scanning
- [ ] Setup log monitoring (Loki, Elasticsearch)
- [ ] Implement backup strategy (daily MongoDB exports)

---

## Monitoring & Maintenance

**Health Checks:**
```bash
# Check all services
docker ps

# View logs
docker-compose logs -f market-data-service

# Restart service
docker-compose restart quant-engine
```

**Automated Monitoring:**
- Setup Uptime Robot (free) for service availability
- Use Grafana + Prometheus for metrics
- Configure Discord/Slack alerts

**Backup Strategy:**
```bash
# MongoDB backup script
#!/bin/bash
timestamp=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out=/backup/odx_$timestamp
```

---

## Scaling Considerations

**When to Scale:**
- Response times > 500ms
- CPU usage consistently > 70%
- Memory usage > 80%
- More than 100 concurrent users

**Scaling Strategies:**
1. Vertical: Upgrade server resources
2. Horizontal: Load balance multiple instances
3. Database: Add read replicas
4. Caching: Redis for frequently accessed data

---

## Cost Breakdown Summary

| Deployment Type | Monthly Cost | Best For |
|----------------|-------------|----------|
| Local Development | $0 | Testing |
| Basic VPS + Free Tiers | $48 | Individual trader |
| Full VPS Stack | $80-120 | Small team |
| Cloud PaaS (Vercel + Cloud Run) | $50-100 | Low maintenance |
| Kubernetes Production | $300-500 | Trading firms |

---

## Quick Start Commands

**Development:**
```bash
docker-compose up
```

**Production:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

**Stop All:**
```bash
docker-compose down
```

**Update & Restart:**
```bash
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

**View Logs:**
```bash
docker-compose logs -f [service-name]
```

---

## Support & Troubleshooting

**Common Issues:**

1. **Services not starting:** Check logs with `docker-compose logs`
2. **MongoDB connection failed:** Verify MONGODB_URI and network access
3. **FYERS WebSocket not connecting:** Check access token validity
4. **Port conflicts:** Ensure ports 3000, 8080-8084, 8001-8002 are free
5. **Out of memory:** Increase Docker memory limit or upgrade server

**Performance Tuning:**
- Adjust JVM memory: `-Xms512m -Xmx2g` in Dockerfile
- Enable Spring Boot lazy initialization
- Use Redis caching for frequent queries
- Optimize MongoDB indexes

---

## Next Steps After Deployment

1. **Get FYERS Access Token** (renew daily or use refresh token)
2. **Monitor first market session:** Check logs for errors
3. **Test real-time features:** Verify Socket.io connections
4. **Setup alerts:** Configure Discord/Telegram notifications
5. **Document your trades:** Use journal service
6. **Optimize:** Monitor performance and adjust resources

---

For questions or issues, check:
- Project README.md
- Docker logs
- Service health endpoints
- Community forums
