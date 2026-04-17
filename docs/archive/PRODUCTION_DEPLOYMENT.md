# 🚀 PRODUCTION DEPLOYMENT CHECKLIST

Complete checklist before deploying to production.

---

## 📋 PRE-DEPLOYMENT VERIFICATION

### 1. Code Quality

- [ ] All tests passing: `pytest tests/ -v`
- [ ] No syntax errors: `python -m py_compile backend/**/*.py`
- [ ] No hardcoded secrets in code
- [ ] Type hints present on public functions
- [ ] Docstrings on all classes/functions
- [ ] No debug print statements
- [ ] Requirements.txt up to date

### 2. Security

- [ ] All secrets in `.env` (not in code)
- [ ] Password hashing enabled (passlib)
- [ ] JWT tokens implemented (python-jose)
- [ ] Rate limiting configured
- [ ] CORS properly configured (specific origins, not *)
- [ ] SQL injection prevention (SQLAlchemy ORM used)
- [ ] Input validation on all endpoints

### 3. Database

- [ ] MySQL database created and configured
- [ ] All tables created: `users`, `resume_analyses`, `otp_records`, `rate_limit_trackers`
- [ ] Backup strategy in place
- [ ] Indexes on frequently queried columns (user_id, email)
- [ ] Database user has limited privileges (not root)
- [ ] Connection pooling configured

### 4. Email Service

- [ ] BREVO_API_KEY obtained and configured
- [ ] Test email sent successfully
- [ ] OTP templates validated (no broken links)
- [ ] Reset password emails tested
- [ ] Email bounce handling configured

### 5. API Endpoints

- [ ] All endpoints tested locally
- [ ] Error responses consistent (400, 404, 429, 500)
- [ ] Response time acceptable (<1s for most requests)
- [ ] Pagination works (limit/skip parameters)
- [ ] File upload validated (size limit, file type)

### 6. Frontend

- [ ] API endpoints hardcoded → environment variables
- [ ] Build optimization: `npm run build`
- [ ] No console errors in dev tools
- [ ] Mobile responsive tested
- [ ] All new features UI present

---

## 🔐 ENVIRONMENT VARIABLES

Create `.env` file with all required variables:

```env
# Database
DATABASE_URL=mysql://user:password@localhost/ai_placement_prod

# Email
BREVO_API_KEY=your_actual_api_key_here
FROM_EMAIL=noreply@company.com

# Authentication
SECRET_KEY=your_super_secret_key_min_32_chars
ALGORITHM=HS256

# Rate Limiting
REDIS_URL=redis://localhost:6379

# API
API_VERSION=2.0.0
CORS_ORIGINS=["https://yourdomain.com", "https://www.yourdomain.com"]
MAX_UPLOAD_SIZE=25000000  # 25MB

# File Storage
UPLOAD_DIR=/var/uploads
TEMP_DIR=/var/temp

# Logging
LOG_LEVEL=INFO
LOG_FILE=/var/log/api.log
```

**Security**: Never commit `.env` to Git!

---

## 🗄️ DATABASE SETUP

### 1. Create Database

```sql
CREATE DATABASE ai_placement_prod;
CREATE USER 'api_user'@'localhost' IDENTIFIED BY 'strong_password_123';
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_placement_prod.* TO 'api_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Initialize Tables

```bash
# Tables auto-created on first run, but verify:
python backend/main.py

# Check tables created:
mysql -u api_user -p ai_placement_prod -e "SHOW TABLES;"
```

Expected output:
```
Tables_in_ai_placement_prod
users
resume_analyses
otp_records
rate_limit_trackers
```

### 3. Create Indexes

```sql
-- Optimize query performance
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_id_email ON users(id, email);
CREATE INDEX idx_analysis_user ON resume_analyses(user_id);
CREATE INDEX idx_analysis_created ON resume_analyses(created_at);
CREATE INDEX idx_analysis_hash ON resume_analyses(file_hash);
CREATE INDEX idx_otp_user_email ON otp_records(user_id, email);
CREATE INDEX idx_rate_limit_user_endpoint ON rate_limit_trackers(user_id, endpoint);
```

### 4. Backup Strategy

```bash
# Daily backup script (add to cron)
#!/bin/bash
BACKUP_DIR="/var/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)

mysqldump -u api_user -p$MYSQL_PASSWORD ai_placement_prod > \
  $BACKUP_DIR/ai_placement_$DATE.sql

# Keep only last 30 days
find $BACKUP_DIR -mtime +30 -delete
```

---

## 🔧 SERVER SETUP

### 1. Production Server Requirements

**Minimum**:
- 2 CPU cores
- 4 GB RAM
- 20 GB storage
- ≥ 99% uptime SLA

**Recommended**:
- 4 CPU cores
- 8 GB RAM
- 50 GB storage
- Load balancer
- SSL certificate

### 2. Dependencies Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.10+
sudo apt install python3.10 python3-pip -y

# Install Redis (for rate limiting)
sudo apt install redis-server -y
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Install MySQL
sudo apt install mysql-server -y

# Clone project
git clone <your-repo> /var/www/ai-placement
cd /var/www/ai-placement

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configure Uvicorn Server

Create `/etc/systemd/system/ai-placement.service`:

```ini
[Unit]
Description=AI Placement Backend
After=network.target mysql.service redis.service

[Service]
Type=notify
User=www-data
WorkingDirectory=/var/www/ai-placement
Environment="PATH=/var/www/ai-placement/venv/bin"
ExecStart=/var/www/ai-placement/venv/bin/uvicorn \
  backend.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4 \
  --access-log \
  --log-config logging.yaml

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Start service:
```bash
sudo systemctl daemon-reload
sudo systemctl start ai-placement
sudo systemctl enable ai-placement
sudo systemctl status ai-placement
```

### 4. Configure Nginx (Reverse Proxy)

Create `/etc/nginx/sites-available/ai-placement`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    
    # Proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_redirect off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Frontend
    location / {
        root /var/www/ai-placement/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/ai-placement/etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL Certificates (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot certonly --nginx -d yourdomain.com -d www.yourdomain.com
```

Auto-renewal:
```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## 📊 MONITORING & LOGGING

### 1. Application Logs

```bash
# View real-time logs
tail -f /var/log/api.log

# Check for errors
grep ERROR /var/log/api.log

# Rotate logs (add to cron daily)
logrotate -f /etc/logrotate.d/ai-placement
```

Create `/etc/logrotate.d/ai-placement`:
```
/var/log/api.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data www-data
}
```

### 2. Health Checks

```bash
# Check API health
curl https://yourdomain.com/api/health

# Expected response:
# {"status": "healthy", "version": "2.0.0"}
```

Configure monitoring tool to check `/api/health` every 5 minutes.

### 3. Database Monitoring

```bash
# Check connection pool status
mysql -u api_user -p ai_placement_prod -e "SHOW PROCESSLIST;"

# Monitor slow queries
mysql -u api_user -p ai_placement_prod -e "SHOW VARIABLES LIKE 'slow_query_log';"
```

### 4. Rate Limiting Monitoring

```bash
# Check rate limit violations
mysql -u api_user -p ai_placement_prod \
  -e "SELECT user_id, endpoint, request_count FROM rate_limit_trackers ORDER BY request_count DESC LIMIT 10;"

# Alert if user exceeds 50+ requests/hour on /upload_resume
```

### 5. Email Service Monitoring

```bash
# Check OTP success rate
mysql -u api_user -p ai_placement_prod \
  -e "SELECT COUNT(*), SUM(is_verified) FROM otp_records;"

# Alert if <90% success rate
```

---

## 🔄 CONTINUOUS DEPLOYMENT

### 1. GitHub Actions CI/CD

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      - run: pip install -r requirements.txt
      - run: pytest tests/ -v
      - run: python -m py_compile backend/**/*.py

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to production
        env:
          DEPLOY_KEY: ${{ secrets.DEPLOY_KEY }}
          SERVER_IP: ${{ secrets.SERVER_IP }}
        run: |
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan $SERVER_IP >> ~/.ssh/known_hosts
          ssh -i ~/.ssh/deploy_key ubuntu@$SERVER_IP 'cd /var/www/ai-placement && git pull && systemctl restart ai-placement'
```

### 2. Rollback Plan

```bash
# Keep last 3 versions
/var/www/ai-placement/releases/
  ├── v2.0.0-current
  ├── v1.9.9-backup1
  └── v1.9.8-backup2

# Rollback script
#!/bin/bash
cd /var/www/ai-placement
git revert HEAD
systemctl restart ai-placement
```

---

## 🚨 INCIDENT RESPONSE

### 1. Performance Degradation

```bash
# Check CPU/Memory
top -b -n 1

# Check database connections
mysql -u api_user -p ai_placement_prod -e "SHOW PROCESSLIST;"

# Check disk space
df -h

# Check API response time
curl -i https://yourdomain.com/api/health | grep -i time
```

### 2. High Error Rate

```bash
# Check error logs
grep ERROR /var/log/api.log | tail -50

# Check database connectivity
mysql -u api_user -p ai_placement_prod -e "SELECT 1;"

# Check API status
systemctl status ai-placement
```

### 3. Rate Limiting Issues

```bash
# Check if legitimate users are being blocked
SELECT user_id, endpoint, COUNT(*) as attempts 
FROM rate_limit_trackers 
GROUP BY user_id, endpoint 
HAVING COUNT(*) > 10;

# Whitelist trusted users if needed
```

### 4. Email Service Failures

```bash
# Verify BREVO credentials
curl -H "api-key: $BREVO_API_KEY" https://api.brevo.com/v3/account

# Check OTP batch failure
SELECT COUNT(*) as total, SUM(is_verified) as verified 
FROM otp_records 
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR);

# If <80%, trigger alert
```

---

## ✅ FINAL CHECKLIST

### Day Before Deployment

- [ ] All tests passing on production-like environment
- [ ] Load test completed (at least 100 concurrent users)
- [ ] All secrets configured in .env
- [ ] Database backups automated
- [ ] SSL certificate installed
- [ ] Nginx configured and tested
- [ ] Monitoring/alerting configured
- [ ] Incident response procedures documented
- [ ] Team trained on deployment process
- [ ] Rollback plan tested

### Deployment Day

- [ ] Take database backup
- [ ] Stop application traffic (optional maintenance mode)
- [ ] Deploy code
- [ ] Run database migrations
- [ ] Verify all services started: `systemctl status ai-placement redis-server mysql`
- [ ] Run smoke tests: `pytest tests/test_smoke.py`
- [ ] Check health endpoint: `/api/health`
- [ ] Monitor logs for errors
- [ ] Gradually ramp up traffic
- [ ] Monitor core metrics (response time, error rate)

### Post-Deployment (24 hours)

- [ ] No unusual error spikes
- [ ] Email service delivery 95%+
- [ ] Response times <1000ms p95
- [ ] Database performance normal
- [ ] All user-facing features working
- [ ] Rate limiting functioning correctly
- [ ] No alerts from monitoring

---

## 📞 SUPPORT CONTACTS

| Role | Contact | Escalation |
|------|---------|-----------|
| DevOps | devops@company.com | CTO |
| Database | dba@company.com | DevOps Lead |
| Backend | backend-team@company.com | Tech Lead |
| On-Call | on-call@company.com | Manager |

---

## 📚 DOCUMENTATION

- [API Documentation](API.md)
- [Architecture Document](ARCHITECTURE.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Scaling Guide](SCALING.md)

---

**Ready for production deployment! 🚀**

If any issues arise, refer to the troubleshooting guide or contact the on-call engineer.
