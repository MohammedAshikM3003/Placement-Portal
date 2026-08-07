# Production Deployment Checklist

## Phase 1: Prerequisites ✓ (Pre-Deployment)

- [ ] **Code Review**
  - [ ] All Python modules have docstrings
  - [ ] All Node services have error handling
  - [ ] No hardcoded credentials or API keys
  - [ ] No console.log statements in production code

- [ ] **Dependencies Installed**
  ```bash
  cd backend
  npm install fastest-levenshtein ioredis bullmq
  pip install -r ocr-service/requirements.txt
  # Verify: pip list | grep -E "paddleocr|pdfplumber|pillow|opencv"
  ```

- [ ] **Environment Variables**
  - [ ] Create `.env.production` from `env.example`
  - [ ] Set `OCR_SERVICE_URL` to deployed OCR microservice
  - [ ] Set `REDIS_URL` to production Redis cluster
  - [ ] Set `MONGODB_URI` to replica set (for transactions)
  - [ ] Set `JWT_SECRET` to strong random string (not dev secret)

---

## Phase 2: Infrastructure Setup

### **MongoDB**
- [ ] Create replica set (required for transactions)
  ```bash
  mongod --replSet "rs0" --port 27017
  rs.initiate()
  rs.add("host2:27017")
  ```
- [ ] Create indices for performance
  ```javascript
  db.MarksheetAuditLog.createIndex({ "regNo": 1, "semester": 1, "createdAt": -1 });
  db.MarksheetReview.createIndex({ "status": 1, "createdAt": -1 });
  db.Marksheets.createIndex({ "regNo": 1, "semester": 1 }, { unique: true });
  ```
- [ ] Set up automatic backups (daily, 30-day retention)
- [ ] Enable authentication
  ```javascript
  db.createUser({ user: "app", pwd: "strong-password", roles: ["readWrite"] })
  ```

### **Redis**
- [ ] Install Redis 6.2+
  ```bash
  sudo apt-get install redis-server
  redis-server --daemonize yes --logfile "/var/log/redis.log"
  ```
- [ ] Enable persistence
  ```
  appendonly yes
  appendfsync everysec
  ```
- [ ] Configure firewall (only allow backend connection)
- [ ] Set up monitoring (redis-cli INFO)

### **OCR Microservice**
- [ ] Deploy Python service
  ```bash
  cd backend/ocr-service
  python ocr_server.py --host 0.0.0.0 --port 5001
  # OR via Docker:
  docker build -t ocr-service .
  docker run -p 5001:5001 ocr-service
  ```
- [ ] Verify startup logs (PaddleOCR model downloads)
- [ ] Test health endpoint
  ```bash
  curl http://localhost:5001/health
  # Expected: {"status": "ok"}
  ```

### **Node Backend**
- [ ] Set environment variables
  ```bash
  export NODE_ENV=production
  export MONGODB_URI="mongodb://app:pwd@host1,host2,host3/placement-portal?replicaSet=rs0"
  export REDIS_URL="redis://:password@host:6379"
  export OCR_SERVICE_URL="http://ocr-service:5001"
  ```
- [ ] Build/Start backend
  ```bash
  npm run build  # if applicable
  npm start
  # Verify logs: "Server running on port 5000"
  ```
- [ ] Test health endpoint
  ```bash
  curl http://localhost:5000/api/health
  # Expected: {"status": "ok"}
  ```

### **Marksheet Worker**
- [ ] Start worker process
  ```bash
  node backend/workers/marksheetWorker.js
  # Verify logs: "Worker listening for jobs..."
  ```
- [ ] Optionally run multiple workers for throughput
  ```bash
  for i in {1..4}; do
    node backend/workers/marksheetWorker.js &
  done
  ```

---

## Phase 3: Data Initialization

- [ ] **Subject Master Collection**
  ```bash
  node backend/scripts/seed-subjects.js
  # Imports all university course codes, credits, semesters
  # Verify: db.Subjects.count() >= 100
  ```

- [ ] **Admin User Creation**
  ```bash
  node backend/create-admin.js --email admin@college.edu --password strong-pwd
  # Verify: db.Users.findOne({ role: 'admin' })
  ```

- [ ] **Coordinator Accounts** (if using role-based access)
  ```bash
  node backend/create-coordinator.js --email coord1@college.edu --department "CSE"
  ```

---

## Phase 4: Integration Testing

- [ ] **Run Integration Tests**
  ```bash
  npm run test:integration
  # Expected: ✓ ALL TESTS PASSED
  ```

- [ ] **Run Benchmark on Sample Dataset**
  ```bash
  npm run benchmark:marksheets
  # Expected: benchmark-results.json with accuracy > 90%
  ```

- [ ] **Manual Upload Test**
  - [ ] Upload 1 clean PDF → should auto-save (confidence > 0.75)
  - [ ] Upload 1 low-quality PDF → should go to review queue
  - [ ] Verify audit logs created in DB
  - [ ] Verify confidence scores reasonable

- [ ] **Review Queue Test**
  - [ ] GET /api/marksheets/review/pending → returns low-confidence extractions
  - [ ] POST /api/marksheets/review/:id/resolve with corrections
  - [ ] Verify saved marksheet matches corrected data

---

## Phase 5: Monitoring & Alerting

- [ ] **Application Metrics**
  - [ ] Set up logging (Winston/Morgan)
  - [ ] Monitor error rates: `GET /api/metrics/extraction-errors`
  - [ ] Monitor extraction confidence distribution
  - [ ] Alert if > 20% of extractions go to review queue

- [ ] **Database Monitoring**
  - [ ] Monitor MongoDB oplog replication lag
  - [ ] Monitor query performance (slow query log)
  - [ ] Alert on replication failures

- [ ] **Redis Monitoring**
  - [ ] Monitor queue length: `redis-cli LLEN marksheet-extraction`
  - [ ] Monitor memory usage: `redis-cli INFO memory`
  - [ ] Alert if queue stalls (no processing)

- [ ] **System Monitoring**
  - [ ] CPU/Memory/Disk usage on each server
  - [ ] Network latency between services
  - [ ] Uptime monitoring for all services

---

## Phase 6: Load Testing

- [ ] **Simulate Production Load**
  ```bash
  npm run test:load --concurrent=10 --iterations=100
  # 10 concurrent PDF uploads, 100 iterations
  # Expected: < 5 second average response time
  ```

- [ ] **Monitor During Load**
  - [ ] OCR service CPU stays < 80%
  - [ ] Redis queue processes smoothly
  - [ ] MongoDB write latency stays < 100ms
  - [ ] No error spikes

---

## Phase 7: Backup & Disaster Recovery

- [ ] **Automated MongoDB Backups**
  ```bash
  mongodump --uri="mongodb://..." --out=/backup/$(date +%Y%m%d)
  # Schedule daily via cron
  ```

- [ ] **Test Restore Process**
  - [ ] Restore from backup to staging DB
  - [ ] Verify all data intact
  - [ ] Document restore procedure

- [ ] **Redis Persistence**
  - [ ] RDB snapshots: `BGSAVE` every 6 hours
  - [ ] AOF rewrite: `BGREWRITEAOF` on schedule
  - [ ] Verify backup files exist

---

## Phase 8: Security Hardening

- [ ] **API Security**
  - [ ] Enable HTTPS on all endpoints
  - [ ] Set CORS headers correctly
  - [ ] Implement rate limiting: `npm install express-rate-limit`
  - [ ] Validate all input (no SQL injection via course codes)

- [ ] **Database Security**
  - [ ] Enable MongoDB authentication
  - [ ] Create read-only roles for non-critical apps
  - [ ] Encrypt data at rest (if supported by MongoDB host)

- [ ] **Network Security**
  - [ ] Firewall: only allow backend → Redis, MongoDB
  - [ ] Firewall: only allow students/admins → backend API
  - [ ] VPN for admin access to servers

- [ ] **Secrets Management**
  - [ ] Use environment variables (not .env file in prod)
  - [ ] Or use secret manager: AWS Secrets Manager / HashiCorp Vault
  - [ ] Rotate JWT_SECRET annually

---

## Phase 9: Documentation & Runbooks

- [ ] **Operations Documentation**
  - [ ] How to restart services
  - [ ] How to scale OCR workers
  - [ ] How to troubleshoot low extraction accuracy
  - [ ] How to manually fix corrupted audit logs

- [ ] **Runbook: Recover from Failed Extraction**
  ```markdown
  1. Identify failed job ID from Redis LLEN
  2. View failed job details: GET /api/marksheets/review/:id
  3. Manually correct via POST /api/marksheets/review/:id/resolve
  4. Verify saved in DB: db.Marksheets.findOne({ regNo: "..." })
  ```

- [ ] **Runbook: Scale OCR Workers**
  ```bash
  # Add new worker
  node backend/workers/marksheetWorker.js &
  # Monitor: redis-cli LLEN marksheet-extraction
  ```

---

## Phase 10: Go-Live Checklist

- [ ] All services running and healthy
- [ ] All integration tests passing
- [ ] Backup system verified working
- [ ] Monitoring dashboards active
- [ ] Alert channels configured (email/Slack)
- [ ] On-call schedule set for incident response
- [ ] Runbooks reviewed with team
- [ ] Production database seeded with subject master
- [ ] Admin accounts created
- [ ] Load testing completed successfully
- [ ] Security audit passed
- [ ] Documentation complete and accessible

---

## Post-Deployment (Week 1)

- [ ] Monitor extraction accuracy daily
- [ ] Check review queue for patterns (high failure categories)
- [ ] Tune confidence thresholds if needed
- [ ] Verify no corrupted data in MongoDB
- [ ] Performance baseline documented
- [ ] Team trained on incident response

---

## Rollback Plan

If critical issues discovered in first 24 hours:

1. **Stop new uploads**: Set maintenance mode
2. **Restore MongoDB from backup**: `mongorestore --uri="..." /backup/YYYYMMDD`
3. **Flush Redis queue**: `redis-cli FLUSHDB`
4. **Restart backend**: `npm start`
5. **Notify users**: Restoration complete, resume uploads

**RTO (Recovery Time Objective): < 30 minutes**  
**RPO (Recovery Point Objective): < 1 hour**

---

## Success Metrics

After 1 week of production operation:

- ✓ **Extraction accuracy**: 99%+ on production marksheets
- ✓ **Review queue rate**: < 5% (high-confidence auto-saves dominate)
- ✓ **Database integrity**: 0 corrupted records, 100% audit trail complete
- ✓ **System uptime**: 99.9%+ (< 50 minutes downtime)
- ✓ **Response time**: 50th percentile < 2s, 95th percentile < 5s
- ✓ **No alert fatigue**: < 2 false alarms per day

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| DevOps Lead | | | |
| Database Admin | | | |
| Security Officer | | | |
| Product Owner | | | |

---

*Document Version: 1.0*  
*Last Updated: [Today's Date]*  
*Next Review: [30 days]*
