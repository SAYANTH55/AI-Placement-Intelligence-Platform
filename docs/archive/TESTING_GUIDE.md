# 🧪 TESTING GUIDE FOR NEW FEATURES

Quick guide to verify all Phase 4 features work correctly.

---

## ⚡ QUICK START

Run all tests:
```bash
cd backend
python -m pytest ../tests/ -v
```

---

## 🧪 TEST 1: Email OTP Functionality

### Test OTP Email Sending

```bash
# Start backend
python backend/main.py

# Test 1a: Send OTP email
curl -X POST http://localhost:8000/forgot_password \
  -H "Content-Type: application/json" \
  -d '{"email": "your_test_email@gmail.com"}'

# Expected Response:
# {
#   "status": "success",
#   "message": "OTP sent to your_test_email@gmail.com"
# }
```

**What to check**:
- ✅ Check your email (check spam folder)
- ✅ OTP email should arrive in ~5 seconds
- ✅ Subject line: "AI Placement - Password Reset Code"
- ✅ Contains 6-digit OTP code

### Test OTP Expiry

```python
# Run this Python snippet:
from backend.services.email_service import is_otp_expired
from datetime import datetime, timedelta

# OTP created 6 minutes ago (should be expired)
old_time = datetime.utcnow() - timedelta(minutes=6)
print("OTP expired?", is_otp_expired(old_time))  # Should print: True

# OTP created 2 minutes ago (should NOT be expired)
new_time = datetime.utcnow() - timedelta(minutes=2)
print("OTP expired?", is_otp_expired(new_time))  # Should print: False
```

**Expected Results**:
- ✅ OTP valid for exactly 5 minutes
- ✅ After 5 mins, needs new OTP

---

## 🧪 TEST 2: Rate Limiting

### Test 2a: Rate Limit (Hourly)

```bash
# Upload resume 21 times in 1 hour
for i in {1..21}; do
  curl -X POST http://localhost:8000/upload_resume \
    -F "file=@resume.pdf" \
    -F "user_id=123"
  echo "Upload $i"
  sleep 5
done

# Expected:
# - First 20: 200 OK
# - 21st: 429 (Too Many Requests)
# - Response: {"detail": "Rate limit exceeded. Reset in 3456 seconds"}
```

### Test 2b: Rate Limit (Burst - 5min window)

```bash
# Upload resume 6 times quickly (within 5 minutes)
for i in {1..6}; do
  curl -X POST http://localhost:8000/upload_resume \
    -F "file=@resume.pdf" \
    -F "user_id=124"
  echo "Burst upload $i"
done

# Expected:
# - First 5: 200 OK
# - 6th: 429 (Burst limit exceeded)
# - Response: {"detail": "Burst limit exceeded. Wait 300 seconds"}
```

### Test 2c: Rate Limit Reset

```bash
# Upload 20 times, wait 1 hour, upload again (should succeed)
curl -X POST http://localhost:8000/upload_resume \
  -F "file=@resume.pdf" \
  -F "user_id=125"

# Wait 3600 seconds (1 hour)...
sleep 3600

# Try again
curl -X POST http://localhost:8000/upload_resume \
  -F "file=@resume.pdf" \
  -F "user_id=125"

# Expected: 200 OK (counter reset after 1 hour)
```

---

## 🧪 TEST 3: Resume History

### Test 3a: Store Analysis

```bash
# Upload resume (triggers automatic storage in ResumeAnalysis table)
curl -X POST http://localhost:8000/upload_resume \
  -F "file=@resume.pdf" \
  -F "user_id=1"

# Response includes analysis_id in database
```

### Test 3b: Get History

```bash
# Get all past analyses for a user
curl -X GET "http://localhost:8000/api/resume-history?user_id=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response:
# [
#   {
#     "id": 1,
#     "filename": "resume.pdf",
#     "created_at": "2026-04-17T10:30:00",
#     "top_matching_role": "Backend Developer",
#     "top_role_match_percent": 82,
#     "placement_readiness": "High"
#   },
#   ...
# ]
```

**Expected:**
- ✅ Returns all analyses for user
- ✅ Sorted by date (newest first)
- ✅ Includes metadata (role, score, readiness)
- ✅ Can limit to N results

### Test 3c: Get Details

```bash
curl -X GET "http://localhost:8000/api/resume-history/1?user_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected Response includes:
# - All fields from summary PLUS
# - extracted_skills: ["Python", "React", ...]
# - extracted_text: "Full resume parsed text..."
# - role_matches: [complete match results]
```

### Test 3d: Delete Analysis

```bash
curl -X DELETE "http://localhost:8000/api/resume-history/1?user_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected:
# {"status": "success", "message": "Analysis deleted"}

# Verify it's deleted:
curl -X GET "http://localhost:8000/api/resume-history/1?user_id=1"
# Returns: {"detail": "Analysis not found"}
```

### Test 3e: Duplicate Detection

```bash
# Upload SAME resume twice
# First upload: 5 seconds processing
# Second upload: Instant response (from cache)

curl -X POST http://localhost:8000/upload_resume \
  -F "file=@resume.pdf" \
  -F "user_id=1"
# Response: {"analysis_id": 1} (5 seconds)

curl -X POST http://localhost:8000/upload_resume \
  -F "file=@resume.pdf" \
  -F "user_id=1"
# Response: {"analysis_id": 1} (instant, same ID as first)
```

---

## 🧪 TEST 4: JD Comparison

### Test 4a: Parse Job Description

```bash
# Save this as sample_jd.txt
cat > sample_jd.txt << 'EOF'
Senior Backend Developer at TechCorp

We're looking for a Senior Backend Developer with 5+ years experience.

Requirements:
- 5+ years Python development
- Experience with Docker and Kubernetes
- AWS expertise (EC2, Lambda, RDS)
- RESTful API design
- SQL and NoSQL databases
- Microservices architecture

Nice to have:
- Apache Kafka
- GraphQL
- Machine Learning basics

Salary: $140,000 - $180,000/year
Remote: Yes
Location: San Francisco, CA (Remote)
EOF

# Compare resume to JD
curl -X POST http://localhost:8000/api/compare-jd \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "job_description": "'$(cat sample_jd.txt)'",
    "resume_analysis_id": 1,
    "user_id": 1
  }'
```

### Expected Response Structure:

```json
{
  "jd_insights": {
    "required_skills": ["Python", "Docker", "Kubernetes", "AWS", "REST", "SQL", "NoSQL"],
    "skill_count": 7,
    "seniority": "Senior",
    "salary": "$140,000 - $180,000",
    "location_type": "Remote",
    "inferred_roles": [
      {
        "name": "Backend Developer",
        "match_percent": 95,
        "matching_skills": ["Python", "Docker", "AWS"]
      },
      {
        "name": "DevOps Engineer",
        "match_percent": 78,
        "matching_skills": ["Docker", "Kubernetes", "AWS"]
      }
    ]
  },
  "role_match": {
    "match_percent": 82,
    "confidence": 0.92
  },
  "gap_analysis": {
    "missing_skills": ["Kubernetes", "Microservices", "GraphQL"],
    "present_skills": ["Python", "Docker", "AWS", "SQL"],
    "learning_path": [
      {"skill": "Kubernetes", "importance": "high", "learn_time_weeks": 4},
      {"skill": "Microservices", "importance": "high", "learn_time_weeks": 6},
      {"skill": "GraphQL", "importance": "low", "learn_time_weeks": 2}
    ]
  }
}
```

### Test 4b: Verify JD Parsing

```python
# Python test to verify JD parser
from ai_model.job_matcher.jd_analyzer import parse_job_description

jd = """
Senior Python Developer
Requirements:
- 5+ years Python
- React or Vue.js
- PostgreSQL
- Docker & Kubernetes
- AWS or GCP
Salary: $120k-$150k
Remote: Yes
"""

result = parse_job_description(jd)

# Verify results:
print("Skills extracted:", result['required_skills'])  # Should find Python, React, PostgreSQL, Docker, Kubernetes, AWS
print("Seniority:", result['seniority'])  # Should be "Senior"
print("Salary:", result['salary'])  # Should be "$120,000 - $150,000"
print("Location:", result['location_type'])  # Should be "Remote"
print("Roles:", result['inferred_roles'])  # Should infer Backend Dev, Frontend Dev, etc.
```

**Expected Results**:
- ✅ Extracts 5-8 relevant skills
- ✅ Correctly detects Senior/Mid/Junior
- ✅ Parses salary range
- ✅ Detects Remote/Onsite/Hybrid
- ✅ Infers role(s) from skills

---

## 🧪 TEST 5: PDF Export

### Test 5a: Export Analysis as PDF

```bash
# Export analysis 1 as PDF
curl -X GET "http://localhost:8000/api/export-analysis/1?user_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  > report.pdf

# Check file created
ls -lh report.pdf
# Should be 40-100 KB

# Open PDF
open report.pdf  # or: start report.pdf on Windows
```

### Test 5b: Verify PDF Content

Open the generated PDF and check:
- ✅ Title: "Resume Analysis Report"
- ✅ Summary table with: Role, Score, Readiness, Diversity, Experience
- ✅ Extracted Skills section with all skills listed
- ✅ Top Matching Roles section
- ✅ Professional formatting

### Test 5c: PDF Error Handling

```bash
# Try to export non-existent analysis
curl -X GET "http://localhost:8000/api/export-analysis/9999?user_id=1"

# Expected:
# {
#   "detail": "Analysis not found"
# }
```

---

## 🧪 TEST 6: Database Models

### Test 6a: Check Database Tables

```bash
# Connect to MySQL
mysql -u root -p

# In MySQL:
USE ai_placement;
SHOW TABLES;

# Should show:
# - users
# - resume_analyses
# - otp_records
# - rate_limit_trackers
```

### Test 6b: Verify Relationships

```python
# Python test
from backend.database.db import SessionLocal
from backend.database.models import User, ResumeAnalysis

session = SessionLocal()

# Get user with all resume analyses
user = session.query(User).filter(User.id == 1).first()
print("User:", user.name)
print("Analyses:", user.resume_analyses)  # Should show relationship

# Check analysis fields
analysis = user.resume_analyses[0]
print("Skills:", analysis.extracted_skills)  # JSON
print("Role:", analysis.top_matching_role)
print("Score:", analysis.top_role_match_percent)
```

---

## 🧪 TEST 7: Integration Test

### Complete User Flow

```bash
#!/bin/bash

# 1. User registers (existing endpoint)
echo "1. Register user..."
RESPONSE=$(curl -X POST http://localhost:8000/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@test.com",
    "password": "Test123!"
  }')
USER_ID=$(echo $RESPONSE | jq -r '.user_id')
echo "User ID: $USER_ID"

# 2. User uploads resume
echo "2. Upload resume..."
curl -X POST http://localhost:8000/upload_resume \
  -F "file=@resume.pdf" \
  -F "user_id=$USER_ID"

# 3. User views history
echo "3. Get resume history..."
curl -X GET "http://localhost:8000/api/resume-history?user_id=$USER_ID"

# 4. User compares to job
echo "4. Compare to JD..."
curl -X POST http://localhost:8000/api/compare-jd \
  -H "Content-Type: application/json" \
  -d "{
    \"job_description\": \"Senior Python Developer...\",
    \"resume_analysis_id\": 1,
    \"user_id\": $USER_ID
  }"

# 5. User exports PDF
echo "5. Export PDF..."
curl -X GET "http://localhost:8000/api/export-analysis/1?user_id=$USER_ID" \
  > report.pdf

echo "✅ All tests completed!"
```

---

## 📊 AUTOMATED TESTS

Create `tests/test_new_features.py`:

```python
import pytest
from backend.database.db import SessionLocal
from backend.database.models import ResumeAnalysis, OTPRecord, RateLimitTracker

def test_resume_history_storage():
    """Test that resume analyses are stored"""
    session = SessionLocal()
    analyses = session.query(ResumeAnalysis).filter(
        ResumeAnalysis.user_id == 1
    ).all()
    assert len(analyses) > 0

def test_otp_record_creation():
    """Test that OTP records are created"""
    session = SessionLocal()
    otps = session.query(OTPRecord).all()
    assert len(otps) > 0

def test_rate_limit_tracking():
    """Test that rate limits are tracked"""
    session = SessionLocal()
    limits = session.query(RateLimitTracker).all()
    assert len(limits) > 0

def test_duplicate_detection():
    """Test that duplicate files are detected"""
    # Upload same file twice
    # Check that file_hash is identical
    pass
```

Run tests:
```bash
pytest tests/test_new_features.py -v
```

---

## ✅ TEST CHECKLIST

- [ ] Test 1: Email OTP sends and expires correctly
- [ ] Test 2: Rate limiting prevents abuse (hourly + burst)
- [ ] Test 3: Resume history stores and retrieves analyses
- [ ] Test 4: JD comparison extracts and compares correctly
- [ ] Test 5: PDF export generates valid PDFs
- [ ] Test 6: Database tables created with correct relationships
- [ ] Test 7: Complete user flow works end-to-end
- [ ] Test 8: All endpoints return correct error codes (400, 404, 429, etc)

---

## 🐛 TROUBLESHOOTING

**OTP not sending?**
- Check BREVO_API_KEY in .env
- Check email spam folder
- Check backend logs: `tail -f backend.log`

**Rate limit not working?**
- Check database has `rate_limit_trackers` table
- Verify user_id is being passed correctly
- Check rate limit config is reasonable

**Resume history empty?**
- Upload a resume first
- Check database has `resume_analyses` table
- Verify user_id matches

**JD comparison failing?**
- Check JD text is valid (not empty)
- Verify `resume_analysis_id` exists
- Check AI backend is running

**PDF export blank?**
- Ensure `reportlab` installed: `pip install reportlab`
- Check analysis exists in database
- Verify `user_id` matches

---

**All tests green? You're ready for production! 🚀**
