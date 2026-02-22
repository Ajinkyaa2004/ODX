# ODX Production Deployment Checklist

## Pre-Deployment

- [ ] All TypeScript compilation errors resolved
- [ ] All services build successfully
- [ ] MongoDB connection credentials updated
- [ ] FYERS API credentials configured
- [ ] GROQ API key for AI service added
- [ ] Environment variables set in `.env`
- [ ] Docker and Docker Compose installed
- [ ] Ports 3000, 8080-8084, 8001-8002, 9092-9093 available
- [ ] Sufficient server resources (8GB RAM, 4 CPU cores minimum)

## Security Configuration

- [ ] Changed all default passwords
- [ ] Created strong MongoDB admin password
- [ ] Configured firewall rules (UFW/iptables)
- [ ] SSL certificates installed (Let's Encrypt)
- [ ] API rate limiting enabled
- [ ] CORS origins properly configured
- [ ] Secrets not committed to version control
- [ ] Webhook URLs secured (if using)

## Service Configuration

### Market Data Service
- [ ] FYERS_APP_ID set
- [ ] FYERS_ACCESS_TOKEN set (renew daily)
- [ ] Market timings configured (IST)
- [ ] Socket.io port 9092 exposed
- [ ] WebSocket connection tested

### Option Chain Service
- [ ] FYERS credentials configured
- [ ] Socket.io port 9093 exposed
- [ ] Option chain API endpoints tested

### Quant Engine
- [ ] Python dependencies installed
- [ ] Socket.io integration working
- [ ] Score calculation scheduler running
- [ ] MongoDB connection verified

### AI Reasoning Service
- [ ] GROQ_API_KEY configured
- [ ] Model selection set
- [ ] API quotas checked

### Frontend
- [ ] NEXT_PUBLIC_API_BASE_URL pointing to production API Gateway
- [ ] Socket.io connections configured
- [ ] Build optimization enabled
- [ ] Static assets served via CDN (optional)

## Database Setup

- [ ] MongoDB instance running (Atlas or self-hosted)
- [ ] Database user created with appropriate permissions
- [ ] Connection string tested
- [ ] Initial collections created
- [ ] Indexes created for performance

## Deployment Steps

### 1. Build Production Images
```bash
docker-compose -f docker-compose.prod.yml build
```

### 2. Start Services
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Verify Services
```bash
docker ps
curl http://localhost:8080/actuator/health
curl http://localhost:8001/health
curl http://localhost:3000
```

### 4. Check Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

## Post-Deployment Verification

- [ ] All containers running (`docker ps`)
- [ ] API Gateway responding (http://localhost:8080/actuator/health)
- [ ] Frontend accessible (http://localhost:3000)
- [ ] Market data WebSocket connecting
- [ ] Option chain data loading
- [ ] Setup scores calculating
- [ ] Charts rendering
- [ ] Real-time price updates working
- [ ] LIVE badges appearing on Setup Score cards
- [ ] No Console errors in browser
- [ ] MongoDB receiving data
- [ ] Logs showing no critical errors

## Monitoring Setup

- [ ] Health check endpoints responding
- [ ] Uptime monitoring configured (Uptime Robot, Pingdom)
- [ ] Log aggregation setup (Loki, ELK)
- [ ] Resource monitoring (CPU, Memory, Disk)
- [ ] Alert notifications configured (Discord, Slack, Email)
- [ ] Backup cron jobs scheduled

## Backup Strategy

### Daily MongoDB Backup
```bash
#!/bin/bash
# Add to crontab: 0 2 * * * /path/to/backup.sh
timestamp=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out=/backup/odx_$timestamp
find /backup -name "odx_*" -mtime +7 -exec rm -rf {} \;
```

### Docker Volume Backup
```bash
docker run --rm -v odx_mongodb_data:/data -v $(pwd)/backup:/backup ubuntu tar czf /backup/mongodb_backup.tar.gz /data
```

## Maintenance Schedule

### Daily
- [ ] Check FYERS token validity
- [ ] Review error logs
- [ ] Verify data flow
- [ ] Monitor resource usage

### Weekly
- [ ] Review performance metrics
- [ ] Check disk space
- [ ] Update security patches
- [ ] Test backup restoration

### Monthly
- [ ] Update dependencies
- [ ] Review and optimize queries
- [ ] Rotate logs
- [ ] Security audit

## Rollback Plan

If deployment fails:
```bash
# Stop new deployment
docker-compose -f docker-compose.prod.yml down

# Restore from backup
mongorestore --uri="$MONGODB_URI" /backup/odx_YYYYMMDD_HHMMSS

# Start previous version
git checkout <previous-commit>
docker-compose -f docker-compose.prod.yml up -d
```

## Emergency Contacts

- **FYERS Support:** fyers.in/contact
- **MongoDB Atlas Support:** mongodb.com/cloud/atlas/support
- **Heroku/Cloud Provider Status:** status.heroku.com
- **Your DevOps Team:** [Add contact info]

## Performance Benchmarks

### Target Metrics
- API Response Time: < 200ms (p95)
- WebSocket Latency: < 50ms
- Setup Score Calculation: < 2s
- Memory Usage: < 70%
- CPU Usage: < 60% average
- Uptime: > 99.5%

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| Service won't start | Check logs: `docker-compose logs [service]` |
| MongoDB connection error | Verify MONGODB_URI and network access |
| FYERS WebSocket disconnected | Renew access token |
| High memory usage | Restart services, check for memory leaks |
| Slow API responses | Check database indexes, add caching |
| Frontend not loading | Check NEXT_PUBLIC_API_BASE_URL |

## Post-Deployment Optimization

- [ ] Enable Redis caching for frequently accessed data
- [ ] Optimize MongoDB queries with proper indexes
- [ ] Configure CDN for static assets
- [ ] Enable gzip compression
- [ ] Implement connection pooling
- [ ] Add database read replicas (if needed)
- [ ] Setup horizontal pod autoscaling (Kubernetes)

## Success Criteria

Deployment is successful when:
- ✅ All services showing healthy status
- ✅ Real-time data streaming without errors
- ✅ Dashboard fully functional with LIVE indicators
- ✅ No memory leaks after 24 hours
- ✅ Response times meet benchmarks
- ✅ Backup and monitoring systems operational
- ✅ Team can access and use the dashboard

---

**Deployment Date:** _________________
**Deployed By:** _________________
**Server/Platform:** _________________
**Version:** _________________
