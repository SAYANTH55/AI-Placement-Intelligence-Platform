# ⚡ PHASE 4 QUICK REFERENCE

Quick lookup for Phase 4 new features (Email OTP fix, Rate limiting, Resume History, JD Comparison, PDF Export).

---

## 📌 COMMON TASKS

### Task: Upload Resume and Get Analysis

```python
# Using curl
curl -X POST http://localhost:8000/upload_resume \
  -F "file=@resume.pdf" \
  -F "user_id=1"

# Response:
# {
#   "analysis_id": 1,
#   "top_role": "Backend Developer",
#   "score": 82,
#   "readiness": "High"
# }
```

### Task: Check Rate Limit Status For User

```python
# Python
from backend.middleware import check_rate_limit

is_allowed, error_msg = check_rate_limit("/upload_resume", user_id=1)
if not is_allowed:
    print(error_msg)  # "Rate limit exceeded. Reset in 3456 seconds"
```

### Task: Send OTP Email to User

```python
# Python
from backend.services.email_service import send_otp_email

result = send_otp_email("user@gmail.com", "123456")
if result["success"]:
    print("OTP sent successfully!")
    print("Message:", result["message"])
else:
    print("Error:", result["error"])
```

### Task: List All Past Resume Analyses

```bash
curl -X GET "http://localhost:8000/api/resume-history?user_id=1&limit=10&skip=0"

# Response: [
#   {
#     "id": 1,
#     "filename": "resume_v1.pdf",
#     "created_at": "2026-04-17T10:30:00",
#     "top_matching_role": "Backend Developer",
#     "top_role_match_percent": 82,
#     "placement_readiness": "High",
#     "diversity_score": 75
#   }
# ]
```

### Task: Get Full Details of One Analysis

```bash
curl -X GET "http://localhost:8000/api/resume-history/1?user_id=1"

# Response includes:
# - All summary fields +
# - extracted_skills: ["Python", "React", ...]
# - extracted_text: "Full parsed resume..."
# - role_matches: [all role match details]
```

### Task: Delete Old Analysis

```bash
curl -X DELETE "http://localhost:8000/api/resume-history/1?user_id=1"

# Response: {"status": "success", "message": "Analysis deleted"}
```

### Task: Compare Resume to Job Description

```bash
JD="Senior Python Developer with 5+ years experience. Requirements: Python, Docker, AWS..."

curl -X POST http://localhost:8000/api/compare-jd \
  -H "Content-Type: application/json" \
  -d "{
    \"job_description\": \"$JD\",
    \"resume_analysis_id\": 1,
    \"user_id\": 1
  }"

# Response:
# {
#   "jd_insights": {
#     "required_skills": ["Python", "Docker", "AWS"],
#     "seniority": "Senior",
#     "salary": "$140k - $180k"
#   },
#   "role_match": {
#     "match_percent": 82
#   },
#   "gap_analysis": {
#     "missing_skills": ["Kubernetes"],
#     "learning_path": [...]
#   }
# }
```

### Task: Export Analysis as PDF Report

```bash
curl -X GET "http://localhost:8000/api/export-analysis/1?user_id=1" \
  > my_analysis_report.pdf

# Opens or saves PDF with:
# - Summary table (role, score, readiness, etc.)
# - Extracted skills
# - Top matching roles
# - Professional formatting
```

---

## 🔑 PHASE 4 API ENDPOINTS

| Method | Endpoint | What It Does | Rate Limit |
|--------|----------|-------------|-----------|
| POST | `/forgot_password` | Send OTP email | 3/hour |
| POST | `/upload_resume` | Upload & analyze resume | 20/hour, 5/5min |
| GET | `/api/resume-history` | List past analyses | 100/hour |
| GET | `/api/resume-history/{id}` | Get full details | 100/hour |
| DELETE | `/api/resume-history/{id}` | Delete analysis | 50/hour |
| POST | `/api/compare-jd` | Compare to job posting | 50/hour |
| GET | `/api/export-analysis/{id}` | Download PDF report | 50/hour |

---

## 🗄️ NEW DATABASE TABLES

### ResumeAnalysis (Store all analyses)
```sql
CREATE TABLE resume_analyses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  filename VARCHAR(255),
  file_hash VARCHAR(64) UNIQUE,
  extracted_skills JSON,
  experience_years INT,
  placement_probability FLOAT,
  top_matching_role VARCHAR(100),
  top_role_match_percent INT,
  diversity_score INT,
  skill_gaps JSON,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### OTPRecord (Track OTP codes)
```sql
CREATE TABLE otp_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  email VARCHAR(255),
  otp_code VARCHAR(6),
  is_verified BOOL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (DATE_ADD(NOW(), INTERVAL 5 MINUTE)),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### RateLimitTracker (Track API usage)
```sql
CREATE TABLE rate_limit_trackers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  endpoint VARCHAR(100),
  request_count INT,
  window_start TIMESTAMP,
  window_end TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## ⚙️ CONFIGURATION

### Rate Limits (in `backend/middleware/rate_limiter.py`)
```python
RATE_LIMITS = {
    "/upload_resume": {
        "requests_per_hour": 20,      # ← Adjust here
        "burst_limit": 5,             # ← Adjust here
    },
    "/api/compare-jd": {
        "requests_per_hour": 50,
    },
    "/api/predict_placement": {
        "requests_per_hour": 100,
    }
}
```

### OTP Settings (in `backend/services/email_service.py`)
```python
OTP_EXPIRY_MINUTES = 5     # ← Expires after 5 minutes
OTP_LENGTH = 6              # ← 6-digit code
```

### Email Configuration (in `.env`)
```env
BREVO_API_KEY=your_key_here
FROM_EMAIL=noreply@company.com
```

---

## 🚨 RATE LIMITING BEHAVIOR

**Hourly Limit** (20 uploads/hour per user):
```
Upload count resets every 1 hour
Returns 429 if exceeded
Error: "Rate limit exceeded. Reset in X seconds"
```

**Burst Limit** (5 uploads per 5 minutes):
```
Prevents spam within 5-minute window
Returns 429 if exceeded
Error: "Burst limit exceeded. Wait X seconds"
```

**Duplicate Detection**:
```
Same file (same MD5 hash) = instant response
No processing time, returns cached analysis_id
```

---

## 🐛 COMMON ISSUES & QUICK FIXES

| Problem | Cause | Solution |
|---------|-------|----------|
| OTP not sending | No BREVO key | Add `BREVO_API_KEY` to `.env` |
| Rate limit too low | Settings too strict | Increase `requests_per_hour` in code |
| Resume history empty | No uploads yet | Upload a resume first |
| JD parser fails | Empty JD text | Provide valid job description |
| PDF export fails | reportlab not installed | `pip install reportlab` |
| Duplicate not detected | File changed slightly | MD5 hash must match exactly |

---

## 📊 USEFUL SQL QUERIES

### Find duplicate uploads by one user
```sql
SELECT file_hash, COUNT(*) as count, GROUP_CONCAT(id) as analysis_ids
FROM resume_analyses
WHERE user_id = 1
GROUP BY file_hash
HAVING COUNT(*) > 1;
```

### Check rate limit violations
```sql
SELECT user_id, endpoint, request_count, window_end - NOW() as time_remaining
FROM rate_limit_trackers
WHERE request_count > 10
ORDER BY request_count DESC;
```

### Check OTP success rate (last hour)
```sql
SELECT 
  ROUND(100 * SUM(is_verified) / COUNT(*), 2) as success_rate
FROM otp_records
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR);
```

### List all analyses for a user with scores
```sql
SELECT id, filename, top_matching_role, top_role_match_percent, created_at
FROM resume_analyses
WHERE user_id = 1
ORDER BY created_at DESC;
```

### Find users with most uploads
```sql
SELECT user_id, COUNT(*) as analysis_count, MAX(created_at) as last_upload
FROM resume_analyses
GROUP BY user_id
ORDER BY analysis_count DESC
LIMIT 10;
```

---

## 🔧 DEBUGGING TIPS

### Check if rate limit working
```bash
# Upload 6 times quickly in new terminal windows
for i in {1..6}; do
  curl -X POST http://localhost:8000/upload_resume \
    -F "file=@resume.pdf" \
    -F "user_id=999"
  echo "Upload $i: $?"
done
# Should see 5 successes, 1 burst limit error
```

### Check if OTP expiring
```python
from backend.services.email_service import is_otp_expired
from datetime import datetime, timedelta

# 6 minutes old (expired)
old = datetime.utcnow() - timedelta(minutes=6)
print(is_otp_expired(old))  # True

# 2 minutes old (valid)
new = datetime.utcnow() - timedelta(minutes=2)
print(is_otp_expired(new))  # False
```

### Check duplicate detection
```sql
-- After uploading same resume twice
SELECT file_hash, COUNT(*) FROM resume_analyses WHERE user_id = 1 GROUP BY file_hash;
-- Should show same hash with count = 2
```

### Check JD parser
```python
from ai_model.job_matcher.jd_analyzer import parse_job_description

jd = "Senior Python Developer with 5+ years. Docker, AWS, PostgreSQL required."
result = parse_job_description(jd)
print("Skills:", result['required_skills'])
print("Seniority:", result['seniority'])
print("Salary:", result['salary'])
```

---

## 📱 FRONTEND INTEGRATION SNIPPETS

### React: Fetch Resume History
```javascript
const [history, setHistory] = useState([]);

useEffect(() => {
  fetch(`/api/resume-history?user_id=${userId}&limit=10`)
    .then(r => r.json())
    .then(data => setHistory(data));
}, [userId]);
```

### React: Compare to Job
```javascript
const handleJDComparison = async () => {
  const response = await fetch('/api/compare-jd', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      job_description: jdText,
      resume_analysis_id: selectedAnalysis,
      user_id: userId
    })
  });
  const result = await response.json();
  setComparison(result);
};
```

### React: Download PDF
```javascript
const downloadPDF = async (analysisId) => {
  const response = await fetch(`/api/export-analysis/${analysisId}?user_id=${userId}`);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'analysis_report.pdf';
  a.click();
};
```

---

## 🚀 DEPLOYMENT

**Before Production:**
- [ ] Test OTP sending with valid Brevo key
- [ ] Verify rate limits work (upload 6 resumes in 5 min)
- [ ] Test resume history retrieval
- [ ] Test JD comparison with real job posting
- [ ] Test PDF export and file generation
- [ ] Database tables created: `SHOW TABLES;`
- [ ] All 5 dependencies installed (slowapi, redis, reportlab, python-jose, email-validator)

**Deployment Command:**
```bash
pip install -r requirements.txt
python backend/main.py  # Tables auto-created
```

**Verify Deployed:**
```bash
curl http://yourdomain.com/api/health
```

---

## 📞 QUICK SUPPORT

| Question | Answer | File |
|----------|--------|------|
| How to enable features? | Just run backend, all auto-enabled | main.py |
| How to customize rate limits? | Edit `RATE_LIMITS` dict | rate_limiter.py |
| How to change OTP expiry? | Edit `OTP_EXPIRY_MINUTES` | email_service.py |
| How to see all endpoints? | Check code or `GET /docs` | main.py |
| How to test everything? | See [TESTING_GUIDE.md](TESTING_GUIDE.md) | All tests |

---

**Phase 4 Complete! ✅**  
**Email OTP, Rate Limiting, Resume History, JD Comparison, PDF Export all ready.**
