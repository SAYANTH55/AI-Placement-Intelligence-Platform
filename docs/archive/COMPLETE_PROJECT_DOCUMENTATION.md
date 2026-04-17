# 📚 AI Placement Intelligence Platform - Complete Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Features Breakdown](#features-breakdown)
4. [Complete Data Pipeline](#complete-data-pipeline)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture](#backend-architecture)
7. [AI/ML Model Details](#aiml-model-details)
8. [File Structure & Relationships](#file-structure--relationships)
9. [Authentication & Security](#authentication--security)
10. [Database Schema](#database-schema)
11. [Dependencies & Libraries](#dependencies--libraries)
12. [Processing Pipeline Deep Dive](#processing-pipeline-deep-dive)

---

## Project Overview

### What is it?
The **AI Placement Intelligence Platform** is a web application that helps students:
- Upload their resume (PDF/DOCX)
- Get AI-powered analysis of their skills
- Find skill gaps for target roles
- Get placement readiness score
- Receive personalized learning recommendations

### Key Users
- 👨‍🎓 **Students**: Upload resumes, view analysis
- 👨‍🏫 **Teachers**: Monitor student progress (future feature)
- 👔 **Placement Officers**: View analytics (future feature)

### Current Status (v2.0.0)
- ✅ Resume parsing with fuzzy skill matching
- ✅ Role-based skill matching with weights
- ✅ Placement prediction ML model
- ✅ Resume history tracking per user
- ✅ PDF export of analysis
- ✅ Rate limiting on endpoints
- ✅ Email OTP verification
- ✅ User authentication

---

## Architecture & Tech Stack

### System Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     USER BROWSER                             │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React/Vite) - Port 5173                          │
│  ├─ Login/Register Pages                                    │
│  ├─ Dashboard (Overview, Analysis, Gap, Score, Recommend) │
│  ├─ Resume Upload Component                                 │
│  └─ Results Display                                         │
└────────────┬────────────────────────────────────────────────┘
             │ HTTP/REST API (Port 8000)
             ▼
┌─────────────────────────────────────────────────────────────┐
│           Backend (FastAPI) - Port 8000                      │
├─────────────────────────────────────────────────────────────┤
│  API Routes:                                                 │
│  ├─ POST /upload_resume (main analysis endpoint)            │
│  ├─ POST /analyze_jd (job description parsing)              │
│  ├─ GET /resume_history (user's previous uploads)           │
│  ├─ POST /export_pdf (generate PDF report)                  │
│  ├─ POST /login (authentication)                            │
│  └─ POST /verify_otp (email verification)                   │
│                                                              │
│  Business Logic:                                             │
│  ├─ Resume Parser (text extraction)                         │
│  ├─ Skill Matcher (fuzzy matching + weighted scoring)       │
│  ├─ Placement Predictor (ML model)                          │
│  └─ Rate Limiter (abuse prevention)                         │
└────────────┬────────────────────────────────────────────────┘
             │ Data Processing
             ▼
┌─────────────────────────────────────────────────────────────┐
│        AI/ML Processing Layer                                │
├─────────────────────────────────────────────────────────────┤
│  resume_parser/                                              │
│  ├─ parser.py (PDF/DOCX text extraction)                    │
│  ├─ scorer.py (skill scoring)                               │
│                                                              │
│  job_matcher/                                                │
│  ├─ matcher.py (role matching)                              │
│                                                              │
│  prediction_model/                                           │
│  ├─ predictor.py (ML model inference)                       │
│                                                              │
│  data/                                                       │
│  ├─ skills_data.py (skill dictionary & role requirements)   │
│                                                              │
│  utils/                                                      │
│  ├─ skill_normalizer.py (fuzzy matching, synonyms)          │
└────────────┬────────────────────────────────────────────────┘
             │ Data Storage
             ▼
┌─────────────────────────────────────────────────────────────┐
│              Database (SQLite)                               │
├─────────────────────────────────────────────────────────────┤
│  Tables:                                                     │
│  ├─ users (id, email, password_hash, name)                  │
│  ├─ resume_uploads (id, user_id, file_path, analysis_data) │
│  ├─ rate_limit_tracker (id, user_id, endpoint, timestamp)   │
│  └─ otp_tracker (id, email, code, created_at)               │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 (UI framework)
- Vite (bundler)
- React Router (routing)
- Framer Motion (animations)
- Axios (HTTP client)
- Tailwind CSS (styling)
- Lucide React (icons)

**Backend:**
- FastAPI (REST API framework)
- SQLAlchemy (ORM)
- Pydantic (data validation)
- SQLite (database)
- Uvicorn (ASGI server)

**AI/ML:**
- spaCy (NLP for text processing)
- scikit-learn (ML models)
- pandas (data manipulation)
- joblib (model serialization)
- pdfplumber (PDF extraction)
- python-docx (DOCX extraction)

**Additional:**
- Brevo API (email sending)
- reportlab (PDF generation)
- slowapi (rate limiting)
- redis (rate limit caching - optional)
- JWT (token authentication)

---

## Features Breakdown

### 1. Resume Upload & Analysis
**What**: User uploads PDF/DOCX resume, system extracts and analyzes it

**Input**: Resume file (PDF/DOCX)

**Processing**:
1. Extract text from file
2. Parse skills using fuzzy matching
3. Extract experience years
4. Match against role requirements
5. Predict placement probability

**Output**: Analyzed resume data with skills, matches, and scores

**File Involved**: 
- Frontend: `UploadBox.jsx`
- Backend: `endpoints.py` → `/upload_resume`
- AI: `parser.py`, `matcher.py`, `predictor.py`

---

### 2. Skill Gap Analysis
**What**: Shows which skills user has for each role and which skills are missing

**Input**: Extracted skills from resume

**Processing**:
1. Load role requirements from SKILLS_DICTIONARY
2. Match extracted skills against each role
3. Calculate present skills (weighted match)
4. Calculate missing skills for learning
5. Sort by match percentage

**Output**: For each role: `{present_skills: [], missing_skills: [], match_percentage: 85}`

**File Involved**:
- Backend: `matcher.py` → `calculate_role_matches()`
- Frontend: Dashboard → "Skill Gap" tab

---

### 3. Placement Score
**What**: Predicts user's placement readiness as a percentage

**Input**: Skills count, experience years, GPA, projects

**Processing**:
1. Load trained ML model (Random Forest)
2. Create feature vector from user data
3. Run model inference
4. Get probability of placement
5. Convert to 0-100 score

**Output**: Placement score (0-100%), readiness level (High/Medium/Low)

**File Involved**:
- Backend: `predictor.py` → `predict_placement()`
- Model: `ai_model/models/placement_predictor.pkl` (trained with scikit-learn)
- Frontend: Dashboard → "Placement Score" tab

---

### 4. Skill Recommendations
**What**: Generates personalized learning path based on target role and gaps

**Input**: Missing skills from top-matched role

**Processing**:
1. Get top role match
2. Identify missing skills
3. Create recommendations: "Master {skill} to improve {role} readiness"
4. Order by importance/frequency in job market

**Output**: List of actionable learning recommendations

**File Involved**:
- Backend: `endpoints.py` (formats output)
- Frontend: Dashboard → "Recommendations" tab

---

### 5. Resume History
**What**: Stores all previous resume uploads per user

**Input**: Each resume upload

**Processing**:
1. Store file path in database
2. Store analysis results as JSON
3. Track timestamp
4. Associate with user_id

**Output**: List of previous analyses with timestamps

**File Involved**:
- Backend: `resume_routes.py` → `get_resume_history()`
- Database: `resume_uploads` table
- Frontend: Dashboard (future feature)

---

### 6. PDF Export
**What**: Generates professional PDF report of analysis

**Input**: Analysis data

**Processing**:
1. Load reportlab library
2. Create document with analysis data
3. Add charts/visuals
4. Format as PDF
5. Return to browser as download

**Output**: PDF file: `analysis_{id}_{date}.pdf`

**File Involved**:
- Backend: `resume_routes.py` → `export_analysis_as_pdf()`
- Frontend: Dashboard → Export button

---

### 7. User Authentication
**What**: User login/register with email verification

**Input**: Email, password, name

**Processing**:
1. Hash password with bcrypt
2. Store in database
3. Send OTP to email (Brevo API)
4. Verify OTP
5. Generate JWT token

**Output**: JWT token for authenticated requests

**File Involved**:
- Backend: `auth.py`
- Frontend: Login.jsx, Register.jsx, VerifyOTP.jsx

---

### 8. Rate Limiting
**What**: Prevents API abuse by limiting requests per user

**Input**: User ID, endpoint, timestamp

**Processing**:
1. Check if user exceeded limit for endpoint
2. Track requests in database
3. Return 429 (Too Many Requests) if exceeded
4. Clean up old records

**Output**: Allow/deny request

**File Involved**:
- Backend: `middleware/rate_limiter.py`
- Database: `rate_limit_tracker` table

---

## Complete Data Pipeline

### Resume Upload Flow

```
User Action: Upload Resume
    ↓
Frontend (UploadBox.jsx)
├─ File validation (PDF/DOCX/TXT)
├─ Show progress bar
└─ POST /upload_resume with FormData
    ↓
Backend (endpoints.py)
├─ Receive file upload
├─ Save to temp directory
│   ↓
│   AI Processing:
│   ├─ Extract text (pdfplumber/python-docx)
│   ├─ Fuzzy match skills against dictionary
│   ├─ Extract experience years (regex patterns)
│   ├─ Load ML model and predict placement probability
│   ├─ Match skills against all role requirements (weighted scoring)
│   ├─ Calculate diversity score
│   └─ Generate diversity insights
│   ↓
├─ Format response with:
│   ├─ extractedText
│   ├─ skills (list)
│   ├─ experience (string: "5 years")
│   ├─ prediction (probability: 0.85, readiness: "High")
│   ├─ roleMatches (array with present/missing per role)
│   ├─ topRole (best match)
│   └─ diversityScore
└─ Return JSON response
    ↓
Frontend (UploadBox.jsx)
├─ Parse response
├─ Validate data structure
├─ Format for display:
│   ├─ Calculate recommendation text
│   ├─ Map role objects
│   └─ Generate learning path
└─ Call onAnalyzeComplete(formattedData)
    ↓
State Update (Dashboard.jsx)
├─ setAnalyzedData(formattedData)
└─ Navigation to results pages available
    ↓
Display to User
├─ Overview: Extracted text + skills
├─ Skill Gap: Per-role analysis
├─ Score: Placement readiness
└─ Recommendations: Learning path
```

### Key Decision Points

1. **File Type Check**: PDF → pdfplumber | DOCX → python-docx | TXT → read()
2. **Skill Extraction**: 
   - First try exact match from SKILLS_DICTIONARY
   - Then try fuzzy match (80% similarity threshold)
   - Return normalized/canonical skill name
3. **Role Matching**:
   - For each role requirement list
   - Calculate weighted match (core skills weighted higher)
   - Confidence score included
4. **Score Calculation**:
   - Features: experience, skills_count, gpa, projects
   - ML Model: RandomForestClassifier
   - Output: probability (0-1) → percentage (0-100)

---

## Frontend Architecture

### Directory Structure
```
frontend/
├─ public/
│  └─ favicon, assets
├─ src/
│  ├─ App.jsx                    # Main router setup
│  ├─ App.css
│  ├─ main.jsx                   # Entry point
│  ├─ index.css
│  │
│  ├─ pages/
│  │  ├─ LandingPage.jsx         # Home page (public)
│  │  ├─ Login.jsx               # Login form
│  │  ├─ Register.jsx            # Registration form
│  │  ├─ ForgotPassword.jsx       # Password reset
│  │  ├─ VerifyOTP.jsx           # OTP verification
│  │  ├─ ResetPassword.jsx        # New password form
│  │  ├─ Dashboard.jsx           # ⭐ MAIN - All analysis pages
│  │  ├─ Features.jsx            # Feature showcase
│  │  ├─ HowItWorks.jsx          # Tutorial
│  │  ├─ Contact.jsx             # Contact page
│  │  ├─ NotFound.jsx            # 404 page
│  │  ├─ JobInput.jsx            # Job input (future)
│  │  ├─ Results.jsx             # Results display (future)
│  │  ├─ UploadResume.jsx        # Legacy upload
│  │  └─ (CSS files for pages)
│  │
│  ├─ components/
│  │  ├─ common/
│  │  │  ├─ Navbar.jsx           # Top navigation
│  │  │  ├─ Sidebar.jsx          # Left sidebar (dashboard)
│  │  │  ├─ Logo.jsx             # Logo component
│  │  │  ├─ Loader.jsx           # Loading spinner
│  │  │  ├─ EdgeGlow.jsx         # Background effect
│  │  │  ├─ MobileNav.jsx        # Mobile menu
│  │  │  └─ (CSS files)
│  │  │
│  │  └─ dashboard/
│  │     ├─ UploadBox.jsx        # ⭐ Resume upload (main feature)
│  │     ├─ InsightCards.jsx     # Score display
│  │     ├─ SkillBadge.jsx       # Skill tag component
│  │     ├─ ScoreRing.jsx        # Circular score display
│  │     ├─ ProgressBar.jsx      # Progress indicator
│  │     ├─ CompanyList.jsx      # Target companies
│  │     ├─ Recommendations.jsx  # Learning recommendations
│  │     ├─ ScoreCard.jsx        # Score card
│  │     ├─ SkillGapList.jsx     # Skill gap display
│  │     ├─ Tabs.jsx             # Tab navigation
│  │     ├─ MobileNav.jsx        # Mobile navigation
│  │     └─ (CSS files)
│  │
│  ├─ context/
│  │  └─ AppContext.jsx          # Global state (user, auth)
│  │
│  ├─ services/
│  │  ├─ api.js                  # ⭐ Axios instance (all API calls)
│  │  └─ endpoints.js            # API endpoint URLs
│  │
│  ├─ utils/
│  │  └─ mockData.js             # Demo data
│  │
│  └─ data/
│     └─ countries.json          # Country list
│
├─ package.json                  # Dependencies + scripts
├─ vite.config.js               # Vite configuration
├─ eslint.config.js             # Linter config
└─ index.html                    # Entry HTML
```

### Component Hierarchy

```
App
├─ Router (BrowserRouter)
└─ Routes
   ├─ / (LandingPage)
   ├─ /login (Login)
   ├─ /register (Register)
   ├─ /forgot-password (ForgotPassword)
   ├─ /verify-otp (VerifyOTP)
   ├─ /reset-password (ResetPassword)
   ├─ /features (Features)
   ├─ /how-it-works (HowItWorks)
   ├─ /contact (Contact)
   └─ /dashboard/* (Protected)
       └─ Dashboard
           ├─ Sidebar
           ├─ MobileNav
           ├─ UploadBox (Resume upload component)
           └─ Routes (nested)
               ├─ / (OverviewPage - shows analysis tabs)
               ├─ /analysis (AnalysisPage)
               ├─ /skills (SkillsPage)
               ├─ /score (ScorePage)
               └─ /recommendations (RecommendationsPage)
```

### Key Frontend Files

**App.jsx** - Main router
- Sets up all routes
- Applies global layout (Navbar, EdgeGlow)
- Handles navbar visibility per page

**Dashboard.jsx** - Analysis hub (1000+ lines)
- Manages all analysis state
- Sub-pages: OverviewPage, AnalysisPage, SkillsPage, ScorePage, RecommendationsPage
- Tab navigation for analysis overview
- Calls UploadBox for file upload
- Displays results with animations

**UploadBox.jsx** - Resume upload component
- File dropzone
- Progress bar simulation
- API call to /upload_resume
- Error handling with detailed messages
- Formats response for dashboard
- Console logging for debugging

**AppContext.jsx** - Global state
- Stores current user info
- Auth token
- Provides useAppContext hook

**api.js** - Axios instance
- Base URL: http://localhost:8000
- All API calls go through here
- Can add interceptors for auth headers

### Frontend Data Flow

```
User uploads resume
    ↓
UploadBox.jsx
├─ Validates file type
├─ Shows progress (0-90%)
├─ Calls API.post('/upload_resume')
│  └─ Sends FormData with file + target_role
├─ Receives response:
│  └─ {status, data: {extractedText, skills, roleMatches, prediction, ...}}
├─ Formats data into:
│  └─ {score, status, allDetected, jobRoles, recommendations, ...}
└─ Calls onAnalyzeComplete(formattedData)
    ↓
Dashboard.jsx (setAnalyzedData)
├─ Stores in component state
└─ Updates UI
    ├─ InsightCards shows extracted info
    ├─ Tabs available: Overview, Analysis, Recommendations
    └─ Can navigate to: /analysis, /skills, /score, /recommendations

User navigates to /dashboard/skills
    ↓
SkillsPage component
├─ Receives analyzedData from parent
├─ Shows role selector
├─ For selected role shows:
│  ├─ Present skills (green)
│  └─ Missing skills (orange)
└─ Uses selectedRoleIndex from Dashboard state
```

### Styling Approach
- **Tailwind CSS**: Utility-first CSS framework
- **Dark theme**: `bg-[#060606]`, `text-white`, `bg-[#F97316]` (orange accent)
- **Animations**: Framer Motion for smooth transitions
- **Responsive**: Mobile-first, then md: and lg: breakpoints
- **Glass morphism**: Semi-transparent backgrounds with blur

---

## Backend Architecture

### Directory Structure
```
backend/
├─ main.py                      # ⭐ FastAPI app entry point
│
├─ api/
│  ├─ __init__.py              # Package init
│  ├─ endpoints.py             # ⭐ Main endpoints (upload_resume, etc)
│  ├─ auth.py                  # Authentication endpoints
│  └─ resume_routes.py         # Resume history & PDF export
│
├─ database/
│  ├─ __init__.py              # Package init
│  ├─ db.py                    # Database connection & setup
│  └─ models.py                # SQLAlchemy ORM models
│
├─ services/
│  ├─ __init__.py              # Package init
│  ├─ ai_service.py            # AI/ML integration (future)
│  └─ email_service.py         # Brevo email API
│
├─ middleware/
│  ├─ __init__.py              # Package init
│  └─ rate_limiter.py          # Request rate limiting
│
└─ ai_placement.db             # SQLite database file
```

### main.py - FastAPI Application Setup

```python
# Imports all API routes and database setup
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import endpoints, auth, resume_routes
from database.db import engine
from database import models

# Create tables automatically
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="AI Placement Intelligence Platform API",
    description="AI-powered placement prediction and skill matching",
    version="2.0.0"
)

# Enable CORS for frontend requests
app.add_middleware(CORSMiddleware, 
    allow_origins=["http://localhost:5173", ...],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Register routers
app.include_router(endpoints.router, tags=["resume-analysis"])
app.include_router(auth.router, tags=["authentication"])
app.include_router(resume_routes.router, tags=["resume-history"])

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Welcome...", "features": [...], "docs": "/docs"}
```

### endpoints.py - Main Analysis Endpoint

**POST /upload_resume** (Main feature)
```
Input:
  - file: UploadFile (PDF/DOCX/TXT)
  - target_role: Optional[str]

Process:
  1. Save file to temp directory
  2. Extract text using parser.py
  3. Parse resume_parser.parse_resume() → {skills, experience, text}
  4. Predict placement using predictor.py
  5. Match skills against roles using matcher.py
  6. Calculate diversity score
  7. Format response
  8. Delete temp file
  9. Return JSON

Output: {
  "status": "success",
  "filename": "resume.pdf",
  "data": {
    "extractedText": "...",
    "skills": ["Python", "React", ...],
    "experience": "5 years",
    "prediction": {
      "placement_probability": 0.85,
      "readiness": "High",
      "features": {...}
    },
    "roleMatches": [
      {
        "role": "Full Stack Developer",
        "match": 85,
        "present": ["Python", "React", ...],
        "missing": ["Kubernetes", ...],
        "salary": "$100k - $150k",
        "confidence": 0.92
      }
    ],
    "topRole": {...},
    "diversityScore": {
      "overall": 7.5,
      "categoriesCovered": ["Frontend", "Backend", "DevOps"],
      "categoriesMissing": ["ML", "Security"],
      "recommendation": "..."
    }
  }
}
```

**POST /analyze_jd** (Job Description analysis)
```
Input: {description: "Job posting text"}
Output: {status: "JD Analyzed", insights: ["Python", "Management", ...]}
```

**GET /get_dashboard** (User stats)
```
Output: {stats: {total_users: N, placements: M}}
```

### auth.py - Authentication

**POST /register**
```
Input: {email, password, name}
Process:
  1. Validate email format
  2. Check if user exists
  3. Hash password with bcrypt
  4. Create user record
  5. Send verification OTP email
Output: {message: "User created", user_id: N}
```

**POST /login**
```
Input: {email, password}
Process:
  1. Find user by email
  2. Verify password hash
  3. Generate JWT token
  4. Return token
Output: {token: "jwt...", user: {...}}
```

**POST /verify_otp**
```
Input: {email, otp_code}
Process:
  1. Check if OTP matches and not expired
  2. Mark email as verified
  3. Return success
Output: {verified: true}
```

### resume_routes.py - Resume History & Export

**GET /resume_history/{user_id}**
```
Output: [
  {
    "id": 1,
    "filename": "resume.pdf",
    "uploaded_at": "2024-04-17",
    "score": 85,
    "top_role": "Backend Developer"
  }
]
```

**POST /export_analysis_as_pdf**
```
Input: {analysis_id, analysis_data}
Process:
  1. Load reportlab
  2. Create PDF document
  3. Add analysis data
  4. Format as readable report
  5. Return as BytesIO
Output: PDF file download
```

### Database Models (models.py)

```python
class User(Base):
    id: int
    email: str (unique)
    password_hash: str
    name: str
    created_at: datetime
    otp_verified: bool

class ResumeUpload(Base):
    id: int
    user_id: int (FK)
    filename: str
    file_path: str
    analysis_data: JSON
    uploaded_at: datetime

class RateLimitTracker(Base):
    id: int
    user_id: int (FK)
    endpoint: str
    timestamp: datetime

class OTPTracker(Base):
    id: int
    email: str
    otp_code: str
    created_at: datetime
    expires_at: datetime
```

### Middleware - Rate Limiter

**Rate Limiting Rules**
```python
RATE_LIMITS = {
    "/upload_resume": {
        "requests_per_hour": 20,
        "burst_limit": 5  # max 5 within 5 minutes
    },
    "/predict_placement": {
        "requests_per_hour": 100
    },
    "/analyze_jd": {
        "requests_per_hour": 50
    }
}

Functions:
- get_user_id_from_request() → Extract user from JWT
- check_rate_limit(endpoint, user_id) → (is_allowed, error_message)
- cleanup_old_records() → Delete expired records
```

---

## AI/ML Model Details

### Directory Structure
```
ai_model/
├─ __init__.py
├─ README.md
├─ train_models.py              # ⭐ Script to train ML model
│
├─ data/
│  ├─ __init__.py
│  └─ skills_data.py            # ⭐ Skill dictionary & role requirements
│
├─ resume_parser/
│  ├─ __init__.py
│  ├─ parser.py                 # ⭐ Resume text extraction
│  └─ scorer.py                 # Skill scoring
│
├─ job_matcher/
│  ├─ __init__.py
│  └─ matcher.py                # ⭐ Role matching algorithm
│
├─ prediction_model/
│  ├─ __init__.py
│  └─ predictor.py              # ⭐ ML model inference
│
├─ utils/
│  ├─ __init__.py
│  └─ skill_normalizer.py        # ⭐ Fuzzy matching & synonyms
│
└─ models/
   ├─ placement_predictor.pkl   # Trained ML model (RandomForest)
   └─ skill_vectorizer.pkl      # TF-IDF vectorizer
```

### 1. skills_data.py - Skill Dictionary

**SKILLS_DICTIONARY** - Categorized list of 200+ skills
```python
{
    "Frontend": ["React", "Vue", "Angular", "HTML5", ...],
    "Backend": ["Python", "Java", "Node.js", "Django", ...],
    "Database": ["SQL", "PostgreSQL", "MongoDB", "Redis", ...],
    "AI/ML": ["TensorFlow", "PyTorch", "Scikit-Learn", ...],
    "Cloud/DevOps": ["AWS", "Docker", "Kubernetes", ...],
    "Security": ["Penetration Testing", "Cryptography", ...],
    "Data Engineering": ["Spark", "Hadoop", "Kafka", ...],
    "Mobile": ["React Native", "Flutter", "Swift", ...],
    "Design": ["Figma", "Adobe XD", "Sketch", ...]
}
```

**ALL_SKILLS** - Flat list of all skills for extraction

**ROLE_REQUIREMENTS** - What skills each role needs
```python
{
    "Full Stack Developer": ["Python", "React", "Node.js", "SQL", ...],
    "Backend Developer": ["Python", "Java", "SQL", "Docker", ...],
    "Frontend Developer": ["React", "Vue", "HTML5", "CSS3", ...],
    "Data Scientist": ["Python", "TensorFlow", "SQL", "Pandas", ...],
    "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", ...],
    ...
}
```

**ROLE_SALARIES** - Expected salary ranges per role

---

### 2. parser.py - Resume Text Extraction

**extract_text_from_pdf(file_path)**
```
Input: Path to PDF file
Process:
  1. Open PDF with pdfplumber
  2. Iterate through pages
  3. Extract text from each page
  4. Concatenate all pages
Output: Full text from PDF
```

**extract_text_from_docx(file_path)**
```
Input: Path to DOCX file
Process:
  1. Load document with python-docx
  2. Iterate through paragraphs
  3. Extract text from each paragraph
Output: Full text from DOCX
```

**extract_skills_with_fuzzy_matching(text, SKILL_DICT)**
```
Process (FIX 2 - Improved):
  1. Split text into words and phrases
  2. For each candidate word:
     a. Try exact match in SKILL_DICT
     b. If not found, try fuzzy match (threshold=0.80)
     c. Return canonical skill name
  3. Remove duplicates
  4. Return unique skills
  
Example:
  "ReactJS" → Fuzzy match → "React"
  "PostgreSQL" → Fuzzy match → "SQL"
  "k8s" → Fuzzy match → "Kubernetes"
```

**extract_experience_years(text)**
```
Process (FIX 5 - Better patterns):
  1. Try pattern: "N years" → return N
  2. Try pattern: "Since YYYY" → calculate from current year
  3. Try pattern: "employed for N years" → return N
  4. Try job titles count → estimate experience
Output: Years as string ("5 years")
```

**parse_resume(file_path)**
```
Main function that orchestrates:
  1. Detect file type by extension
  2. Extract text using appropriate function
  3. Extract skills with fuzzy matching
  4. Extract experience years
  5. Return {skills, experience, extracted_text}
```

---

### 3. matcher.py - Role Matching

**calculate_weighted_match(extracted_skills, required_skills, role_name, use_weights=True)**
```
Process (FIX 1, 2, 3 - Fuzzy + Weighted):
  1. For each required skill in role:
     a. Try exact match in extracted skills
     b. If not found, try fuzzy match
     c. Mark as present with weight
  2. Calculate weighted percentage:
     - Core skills (Backend skills for Backend role) = 2x weight
     - Secondary skills (Testing, Tools) = 1x weight
  3. Calculate confidence score (quality of match)
  4. Return {match_percent, present_skills, missing_skills, confidence}

Output:
{
  "match_percent": 85,
  "present_skills": ["Python", "React", ...],
  "missing_skills": ["Kubernetes", "GraphQL", ...],
  "confidence": 0.92,
  "fuzzy_matches": {"react.js": "React", ...}
}
```

**calculate_role_matches(extracted_skills, target_role=None)**
```
Process:
  1. For each role in ROLE_REQUIREMENTS:
     a. Calculate weighted match
     b. Store as entry
  2. Sort by (match_percent, confidence)
  3. If target_role specified, move to top
  4. Return sorted list

Output: [
  {
    "role": "Full Stack Developer",
    "match": 85,
    "present": ["Python", "React", ...],
    "missing": [...],
    "salary": "$100k - $150k",
    "confidence": 0.92
  },
  ...
]
```

**get_job_fits_with_diversity(extracted_skills)**
```
Process:
  1. Get role matches
  2. Calculate diversity score
  3. Combine results

Output: {
  "role_matches": [...],
  "diversity_analysis": {...},
  "top_role": {...}
}
```

---

### 4. skill_normalizer.py - Fuzzy Matching

**SKILL_SYNONYMS** - Maps variants to canonical forms
```python
{
    "react.js": "react",
    "reactjs": "react",
    "postgresql": "postgresql",
    "postgres": "postgresql",
    "k8s": "kubernetes",
    "docker container": "docker",
    ...
}
```

**normalize_skill(skill)**
```
Process:
  1. Convert to lowercase
  2. Remove special characters
  3. Map to synonym if exists
  4. Return canonical form
```

**fuzzy_match_skill(candidate, skill, threshold=0.85)**
```
Process:
  1. Use difflib.SequenceMatcher
  2. Calculate similarity ratio
  3. Return True if ratio >= threshold
```

**calculate_weighted_match(extracted_skills, required_skills, role_name, use_weights)**
```
Returns weighted match considering role weights:
- Backend role: Python, Java, SQL have 2x weight
- Frontend role: React, Vue, HTML5 have 2x weight
- etc.
```

**get_skill_diversity_score(skills)**
```
Process:
  1. Count skills per category
  2. Calculate diversity across categories
  3. Identify missing categories
  4. Return diversity metrics

Output: {
  "diversity_score": 7.5,  # out of 10
  "categories_covered": ["Frontend", "Backend", "DevOps"],
  "categories_missing": ["ML", "Security"]
}
```

---

### 5. predictor.py - ML Model Inference

**load_placement_model()**
```
Process:
  1. Check if model file exists
  2. Load with joblib: placement_predictor.pkl
  3. Return model or None if not found
Model: RandomForestClassifier trained on synthetic data
```

**predict_placement(skills, experience_str)**
```
Process:
  1. Load trained model
  2. Extract numeric experience from string
  3. Create feature vector:
     - experience (years)
     - skills_count (number of skills)
     - gpa (default 3.5 if not available)
     - projects (estimated from skills count)
  4. Run model.predict_proba()
  5. Get probability for class 1 (Placed)
  6. Determine readiness level:
     - > 0.75 = "High"
     - > 0.40 = "Medium"
     - else = "Low"
  7. Return {placement_probability, readiness, features}

Output: {
  "placement_probability": 0.85,
  "readiness": "High",
  "features": {
    "experience": 5,
    "skills_count": 12
  }
}
```

---

### 6. train_models.py - Model Training

**generate_synthetic_data(n_samples=1000)**
```
Process:
  1. Generate random features:
     - experience: 0-5 years
     - skills_count: 1-15 skills
     - gpa: 2.5-4.0
     - projects: 0-8 projects
  2. Calculate placement probability:
     score = (exp * 2) + (skills * 0.5) + (gpa * 3) + (proj * 1.5) + noise
  3. Mark top 40% as "placed"
  4. Return DataFrame with features + target
```

**train_placement_model()**
```
Process:
  1. Generate synthetic data
  2. Split into train (80%) and test (20%)
  3. Train RandomForestClassifier
  4. Evaluate on test set
  5. Save to placement_predictor.pkl with joblib
  
Model Hyperparameters:
  - n_estimators: 100
  - max_depth: 10
  - random_state: 42
```

---

## File Structure & Relationships

### Frontend File Relationships

```
index.html (entry point)
    ↓
main.jsx (renders App)
    ↓
App.jsx (Router setup)
    ├─ AppContext (global state provider)
    └─ Routes
        ├─ LandingPage
        ├─ Login → auth.py backend
        ├─ Register → auth.py backend
        ├─ VerifyOTP → auth.py backend
        ├─ Dashboard (protected)
        │   ├─ Sidebar (navigation)
        │   ├─ UploadBox (main feature)
        │   │   └─ api.js → endpoints.py /upload_resume
        │   ├─ AnalysisPage
        │   ├─ SkillsPage
        │   ├─ ScorePage
        │   └─ RecommendationsPage
        └─ [Other public pages]
```

### Backend File Relationships

```
main.py (entry point)
    ├─ Initializes FastAPI app
    ├─ Sets up CORS middleware
    ├─ Imports and registers routers:
    │   ├─ api/endpoints.py → router
    │   │   ├─ POST /upload_resume
    │   │   │   ├─ resume_parser.parser.parse_resume()
    │   │   │   ├─ prediction_model.predictor.predict_placement()
    │   │   │   ├─ job_matcher.matcher.get_job_fits_with_diversity()
    │   │   │   └─ utils.skill_normalizer.get_skill_diversity_score()
    │   │   ├─ POST /analyze_jd
    │   │   └─ GET /get_dashboard
    │   │
    │   ├─ api/auth.py → router
    │   │   ├─ POST /register
    │   │   │   ├─ services.email_service.send_otp_email()
    │   │   │   └─ database.models.User.create()
    │   │   ├─ POST /login
    │   │   │   └─ database.models.User.verify_password()
    │   │   └─ POST /verify_otp
    │   │       └─ database.models.OTPTracker.verify()
    │   │
    │   └─ api/resume_routes.py → router
    │       ├─ GET /resume_history
    │       │   └─ database.models.ResumeUpload.query()
    │       └─ POST /export_pdf
    │           └─ reportlab PDF generation
    │
    ├─ database/db.py (SQLAlchemy setup)
    ├─ database/models.py (ORM models)
    └─ middleware/rate_limiter.py (request rate limiting)
```

### AI/ML File Relationships

```
data/skills_data.py (skill dictionary)
    ├─ SKILLS_DICTIONARY (200+ skills)
    ├─ ROLE_REQUIREMENTS (role needs)
    └─ ROLE_SALARIES (salary ranges)

utils/skill_normalizer.py (skill processing)
    ├─ SKILL_SYNONYMS
    ├─ normalize_skill()
    ├─ fuzzy_match_skill()
    ├─ calculate_weighted_match()
    └─ get_skill_diversity_score()

resume_parser/parser.py (text extraction)
    ├─ extract_text_from_pdf()
    ├─ extract_text_from_docx()
    ├─ extract_skills_with_fuzzy_matching()
    │   └─ Uses: data.skills_data.SKILLS_DICTIONARY
    │   └─ Uses: utils.skill_normalizer
    ├─ extract_experience_years()
    └─ parse_resume() ← MAIN ENTRY

job_matcher/matcher.py (role matching)
    ├─ calculate_role_matches()
    │   ├─ Uses: data.skills_data.ROLE_REQUIREMENTS
    │   ├─ Uses: utils.skill_normalizer.calculate_weighted_match()
    │   └─ Uses: data.skills_data.ROLE_SALARIES
    └─ get_job_fits_with_diversity()
        ├─ Uses: calculate_role_matches()
        └─ Uses: utils.skill_normalizer.get_skill_diversity_score()

prediction_model/predictor.py (ML inference)
    ├─ load_placement_model()
    │   └─ Loads: models/placement_predictor.pkl
    └─ predict_placement()

train_models.py (model training - run once)
    ├─ generate_synthetic_data()
    ├─ train_placement_model()
    │   └─ Saves: models/placement_predictor.pkl
    └─ (Run manually: python train_models.py)
```

---

## Authentication & Security

### Login Flow

```
User Action: Login
    ↓
Frontend (Login.jsx)
├─ Input: email, password
├─ POST /login
└─ Response: {token: "jwt...", user: {...}}
    ↓
Frontend stores token in:
├─ localStorage (or sessionStorage)
├─ Passes in Authorization header for protected routes
    ↓
Backend (auth.py /login)
├─ Find user by email
├─ Verify password hash with bcrypt
├─ Generate JWT token
└─ Return token

Subsequent requests:
    ↓
Frontend
├─ Include header: Authorization: Bearer <token>
    ↓
Backend
├─ Verify JWT token
├─ Extract user_id
└─ Process request
```

### Register Flow

```
User Action: Register
    ↓
Frontend (Register.jsx)
├─ Input: email, password, name
├─ POST /register
└─ Response: {message: "...", user_id: N}
    ↓
Backend (auth.py /register)
├─ Validate email format (email-validator)
├─ Check if user exists
├─ Hash password (bcrypt)
├─ Create user in DB
├─ Generate OTP code (6 digits)
├─ Send OTP email (Brevo API)
└─ Store OTP in OTPTracker table

User checks email:
    ↓
Frontend (VerifyOTP.jsx)
├─ Input: email, otp_code
├─ POST /verify_otp
└─ Response: {verified: true}
    ↓
Backend (auth.py /verify_otp)
├─ Find OTP record
├─ Check if code matches
├─ Check if not expired (5 min)
├─ Mark user as verified
└─ Delete OTP record
```

### Security Features

1. **Password Hashing**: bcrypt (not stored in plain text)
2. **JWT Tokens**: For stateless authentication
3. **OTP Verification**: Email verification on signup
4. **Rate Limiting**: Prevents brute force attacks
5. **CORS**: Only allows requests from frontend domain
6. **SQL Injection Prevention**: SQLAlchemy parameterized queries

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    otp_verified BOOLEAN DEFAULT FALSE
);
```

### Resume Uploads Table
```sql
CREATE TABLE resume_uploads (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    filename VARCHAR NOT NULL,
    file_path VARCHAR NOT NULL,
    analysis_data JSON,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Rate Limit Tracker Table
```sql
CREATE TABLE rate_limit_tracker (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    endpoint VARCHAR NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### OTP Tracker Table
```sql
CREATE TABLE otp_tracker (
    id INTEGER PRIMARY KEY,
    email VARCHAR NOT NULL,
    otp_code VARCHAR NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);
```

---

## Dependencies & Libraries

### Frontend (package.json)

**Core:**
- `react` (UI library)
- `react-dom` (React rendering)
- `react-router-dom` (routing)
- `vite` (bundler - replaces webpack)

**Animations & Effects:**
- `framer-motion` (smooth animations)
- `react-intersection-observer` (lazy animation)

**Styling:**
- `tailwindcss` (utility CSS)
- `postcss` (CSS preprocessing)

**HTTP:**
- `axios` (API calls)

**Icons:**
- `lucide-react` (500+ icons)

**UI Components:**
- `react-dropzone` (file upload dropzone)

### Backend (requirements.txt)

**Core:**
- `fastapi` (REST API framework)
- `uvicorn` (ASGI server)
- `starlette` (async web framework)

**Database:**
- `sqlalchemy` (ORM)
- `sqlalchemy-utils` (SQL utilities)

**Data Validation:**
- `pydantic` (request validation)

**Text Processing:**
- `spacy` (NLP engine)
- `pdfplumber` (PDF extraction)
- `python-docx` (DOCX extraction)
- `pdfminer.six` (PDF mining)
- `lxml` (XML parsing)

**ML/Data:**
- `scikit-learn` (ML models)
- `pandas` (data manipulation)
- `numpy` (numerical computing)
- `joblib` (model serialization)

**PDF Generation:**
- `reportlab` (PDF creation)
- `pypdfium2` (PDF utilities)

**Security:**
- `bcrypt` (password hashing)
- `cryptography` (encryption)
- `python-jose` (JWT tokens)
- `passlib` (password utilities)
- `email-validator` (email validation)

**Email:**
- `sib-api-v3-sdk` (Brevo email API)

**Rate Limiting:**
- `slowapi` (request rate limiting)
- `redis` (cache - optional)

**Testing:**
- `pytest` (testing framework)

---

## Processing Pipeline Deep Dive

### Complete Resume Analysis Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER UPLOADS RESUME                                          │
├─────────────────────────────────────────────────────────────────┤
│ Frontend: UploadBox.jsx                                         │
│ - User drags PDF/DOCX file                                      │
│ - Form validation: file type, size check                        │
│ - Progress bar 0-90%                                            │
└─────────────────┬───────────────────────────────────────────────┘
                  │ FormData: {file, target_role}
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. API CALL TO BACKEND                                          │
├─────────────────────────────────────────────────────────────────┤
│ POST http://localhost:8000/upload_resume                       │
│ - CORS headers checked                                          │
│ - Rate limiter checked (20 per hour)                            │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. FILE HANDLING                                                │
├─────────────────────────────────────────────────────────────────┤
│ Backend: endpoints.py upload_resume()                           │
│ - Save to temp directory                                        │
│ - Detect file type by extension                                 │
│ - Validate file not corrupted                                   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. TEXT EXTRACTION                                              │
├─────────────────────────────────────────────────────────────────┤
│ AI: resume_parser/parser.py parse_resume()                      │
│ IF PDF:                                                         │
│   - Open with pdfplumber                                        │
│   - Iterate pages                                               │
│   - Extract text from each page                                 │
│   - Concatenate                                                 │
│ ELSE IF DOCX:                                                   │
│   - Open with python-docx                                       │
│   - Extract from paragraphs                                     │
│ ELSE:                                                           │
│   - Read as text file                                           │
│                                                                 │
│ Output: raw_text (first 2000 chars truncated)                   │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. SKILL EXTRACTION WITH FUZZY MATCHING                         │
├─────────────────────────────────────────────────────────────────┤
│ AI: parser.extract_skills_with_fuzzy_matching()                 │
│ Process:                                                        │
│   1. Load SKILLS_DICTIONARY (200+ skills)                       │
│   2. Split text into words/phrases                              │
│   3. For each candidate:                                        │
│      - Try exact match in dictionary (fast)                     │
│      - If not found, try fuzzy match (difflib 80% threshold)    │
│      - If match found, normalize to canonical form              │
│      - Add to detected_skills list                              │
│   4. Remove duplicates (keep order)                             │
│   5. Return unique skills list                                  │
│                                                                 │
│ Example:                                                        │
│   "ReactJS" → No exact match → Fuzzy "React" (87%) → Add       │
│   "k8s" → No exact match → Fuzzy "Kubernetes" (92%) → Add      │
│   "PostGres" → No exact match → Fuzzy "PostgreSQL" (88%) → Add │
│                                                                 │
│ Output: ["React", "Python", "SQL", "Docker", ...]              │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. EXPERIENCE EXTRACTION                                        │
├─────────────────────────────────────────────────────────────────┤
│ AI: parser.extract_experience_years()                           │
│ Pattern matching (in priority order):                           │
│   1. "5 years" or "5 yrs" → Extract number                      │
│   2. "Since 2021" → Calculate: 2026 - 2021 = 5                 │
│   3. "working for 3 years" → Extract number                     │
│   4. Count job titles (3+ titles = estimate 5 years)            │
│   5. Default: "0 years"                                         │
│                                                                 │
│ Output: "5 years"                                               │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. PLACEMENT PREDICTION (ML MODEL)                              │
├─────────────────────────────────────────────────────────────────┤
│ AI: prediction_model/predictor.predict_placement()              │
│                                                                 │
│ Features:                                                       │
│   - experience: 5 (years)                                       │
│   - skills_count: 12                                            │
│   - gpa: 3.5 (default)                                          │
│   - projects: 3 (estimated)                                     │
│                                                                 │
│ ML Model: RandomForestClassifier                                │
│   - Trained on synthetic data                                   │
│   - 100 trees, max depth 10                                     │
│   - Loaded from: models/placement_predictor.pkl                 │
│                                                                 │
│ Inference:                                                      │
│   1. Create feature vector [5, 12, 3.5, 3]                      │
│   2. Run model.predict_proba()                                  │
│   3. Get probability for class 1 (Placed)                       │
│   4. Example output: 0.85 (85% chance of placement)             │
│                                                                 │
│ Readiness Level:                                                │
│   - prob > 0.75 = "High"                                        │
│   - prob > 0.40 = "Medium"                                      │
│   - else = "Low"                                                │
│                                                                 │
│ Output: {                                                       │
│   "placement_probability": 0.85,                                │
│   "readiness": "High",                                          │
│   "features": {...}                                             │
│ }                                                               │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. ROLE MATCHING WITH WEIGHTED SCORING                          │
├─────────────────────────────────────────────────────────────────┤
│ AI: job_matcher/matcher.py calculate_role_matches()             │
│                                                                 │
│ For each role in ROLE_REQUIREMENTS:                             │
│   ┌────────────────────────────────────────────────┐            │
│   │ Example: "Full Stack Developer"                │            │
│   │ Required: ["Python", "React", "SQL", "Node.js"]│            │
│   │ Extracted: ["Python", "React", "Docker"]       │            │
│   │                                                │            │
│   │ Weighted Matching:                             │            │
│   │   - Python (Backend skill) → Present, 2x      │            │
│   │   - React (Frontend skill) → Present, 2x      │            │
│   │   - SQL (Database skill) → Missing, 0         │            │
│   │   - Node.js (Backend skill) → Missing, 0      │            │
│   │                                                │            │
│   │ Calculation:                                   │            │
│   │   Present weight: 2 + 2 = 4                    │            │
│   │   Required weight: 2 + 2 + 1 + 2 = 7          │            │
│   │   Match %: (4 / 7) * 100 = 57%                │            │
│   │                                                │            │
│   │ Confidence: 0.88 (high because present skills  │            │
│   │ are core skills, not tools)                    │            │
│   └────────────────────────────────────────────────┘            │
│                                                                 │
│ Repeat for all roles and sort by match percentage               │
│                                                                 │
│ Output: [                                                       │
│   {                                                             │
│     "role": "Full Stack Developer",                             │
│     "match": 85,                                                │
│     "present": ["Python", "React", ...],                        │
│     "missing": ["SQL", "Kubernetes", ...],                      │
│     "salary": "$100k - $150k",                                  │
│     "confidence": 0.88                                          │
│   },                                                            │
│   ...                                                           │
│ ]                                                               │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. SKILL DIVERSITY ANALYSIS                                     │
├─────────────────────────────────────────────────────────────────┤
│ AI: skill_normalizer.get_skill_diversity_score()                │
│                                                                 │
│ Process:                                                        │
│   1. Categorize each skill:                                     │
│      - "Python" → Backend                                       │
│      - "React" → Frontend                                       │
│      - "Docker" → DevOps                                        │
│                                                                 │
│   2. Count categories covered: Frontend, Backend, DevOps = 3    │
│   3. Identify missing: ML, Security, Data Engineering = 3       │
│   4. Diversity score: (categories_covered * 2) / 10 = 6.0       │
│   5. Recommendation: "You have 3 categories covered..."         │
│                                                                 │
│ Output: {                                                       │
│   "diversity_score": 6.0,                                       │
│   "categories_covered": ["Frontend", "Backend", "DevOps"],      │
│   "categories_missing": ["ML", "Security", "Data Eng"],         │
│   "recommendation": "..."                                       │
│ }                                                               │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 10. FORMAT RESPONSE                                             │
├─────────────────────────────────────────────────────────────────┤
│ Backend: endpoints.py (format response)                         │
│                                                                 │
│ Response: {                                                     │
│   "status": "success",                                          │
│   "filename": "resume.pdf",                                     │
│   "data": {                                                     │
│     "extractedText": "...",                                     │
│     "skills": ["Python", "React", ...],                         │
│     "experience": "5 years",                                    │
│     "prediction": {                                             │
│       "placement_probability": 0.85,                            │
│       "readiness": "High"                                       │
│     },                                                          │
│     "roleMatches": [...],  # from step 8                        │
│     "topRole": {...},                                           │
│     "diversityScore": {...}  # from step 9                      │
│   }                                                             │
│ }                                                               │
│                                                                 │
│ Delete temp file                                                │
│ Return to frontend                                              │
└─────────────────┬───────────────────────────────────────────────┘
                  │ JSON response (Port 8000 → 5173)
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 11. FRONTEND RECEIVES RESPONSE                                  │
├─────────────────────────────────────────────────────────────────┤
│ Frontend: UploadBox.jsx (receive & format)                      │
│                                                                 │
│ Parse response:                                                 │
│   1. Validate structure exists                                  │
│   2. Check skills array not empty                               │
│   3. Check roleMatches array exists                             │
│   4. Format for display:                                        │
│      - score: Math.round(prob * 100) = 85                       │
│      - Map roleMatches to objects with title/match              │
│      - Generate recommendation text                             │
│      - Set companies list                                       │
│   5. Call onAnalyzeComplete(formattedData)                      │
│                                                                 │
│ Progress bar: 100%                                              │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 12. STATE UPDATE IN DASHBOARD                                   │
├─────────────────────────────────────────────────────────────────┤
│ Frontend: Dashboard.jsx (state update)                          │
│                                                                 │
│ setAnalyzedData(formattedData)                                  │
│   - Stores in component state                                   │
│   - Available to all sub-pages                                  │
│   - InsightCards updates with data                              │
│   - Navigation to /analysis, /skills, /score available          │
└─────────────────┬───────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│ 13. DISPLAY ANALYSIS RESULTS                                    │
├─────────────────────────────────────────────────────────────────┤
│ Frontend: Multiple pages display different views                │
│                                                                 │
│ Overview Page:                                                  │
│   - Shows extracted text                                        │
│   - Lists all detected skills                                   │
│   - Tabs for deeper analysis                                    │
│                                                                 │
│ Analysis/Skill Gap Page:                                        │
│   - Role selector buttons                                       │
│   - For selected role:                                          │
│     • Green section: "Skills You Have"                          │
│     • Orange section: "Skills to Learn"                         │
│                                                                 │
│ Placement Score Page:                                           │
│   - Circular progress (85%)                                     │
│   - "Overall Readiness" metric                                  │
│   - "Interview Confidence" metric                               │
│   - "Technical Depth" metric                                    │
│   - Dimension breakdown bars                                    │
│   - Target companies list                                       │
│                                                                 │
│ Recommendations Page:                                           │
│   - Target Roles section (top 5 matches)                        │
│   - Learning Path section (numbered steps):                     │
│     1. Master Kubernetes...                                     │
│     2. Learn GraphQL...                                         │
│     3. Study system design...                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Error Handling & Edge Cases

### Handled Errors:

1. **File Upload Errors**
   - Invalid file type → 422 error
   - Corrupted PDF → Text extraction fails gracefully
   - Empty file → No skills extracted

2. **Skill Extraction Errors**
   - Resume with no recognized skills → Empty skills array
   - Fuzzy matching no matches → No skills detected
   - Text encoding issues → Try UTF-8 fallback

3. **ML Model Errors**
   - Model file missing → Return default 0.5 probability
   - Invalid features → Clamp values to valid range
   - Prediction NaN → Return 0.5

4. **API Errors**
   - Rate limit exceeded → 429 (Too Many Requests)
   - CORS origin not allowed → 403
   - Endpoint not found → 404
   - Server error → 500 with details

5. **Database Errors**
   - User not found → 404
   - Duplicate email → 400 (User already exists)
   - Invalid OTP → 401 (Verification failed)

### Edge Cases Handled:

- Resume with only 1 skill
- Resume from 2020 (old experience date)
- Resume with typos in skill names (fuzzy matching catches ~80%)
- Multiple pages of PDF (all concatenated)
- Special characters in resume text
- Very long resumes (truncated to 2000 chars)

---

## Performance Optimizations

1. **Frontend**:
   - Lazy loading of components with React.lazy()
   - Memoization of expensive calculations
   - Debounced event handlers
   - CSS animations (GPU accelerated)

2. **Backend**:
   - Caching of SKILLS_DICTIONARY (loaded once)
   - Caching of ML model (loaded once)
   - Temporary file cleanup
   - Index optimization on database queries

3. **AI/ML**:
   - Fuzzy matching threshold set to 0.80 (fast enough)
   - RandomForest chosen over deep learning (faster inference)
   - Skill synonyms cached

---

## Testing & Verification

### Unit Tests (tests/test_basic.py)

Tests for:
- Resume parsing
- Skill extraction
- Role matching
- ML prediction
- API endpoints

### Manual Testing

1. Upload PDF resume with skills
2. Verify skills extracted correctly
3. Verify role matches calculated
4. Check placement score (0-100%)
5. Navigate to all dashboard pages
6. Test login/register flow
7. Upload multiple resumes (check history)

---

## Build & Deployment

### For Development:

```bash
# Terminal 1: Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r ../requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```

### For Production:

```bash
# Build frontend
cd frontend
npm run build
# Deploy dist/ folder to web server

# Start backend
gunicorn -w 4 -b 0.0.0.0:8000 backend.main:app
# Or use systemd service

# Use production database (PostgreSQL instead of SQLite)
# Add environment variables for secrets
# Set DEBUG = False
```

---

## Summary

This platform is a comprehensive resume analysis system that:

1. **Accepts** PDF/DOCX resumes from users
2. **Extracts** text and skills using advanced NLP
3. **Matches** skills against 20+ job roles with weighted scoring
4. **Predicts** placement readiness using ML model
5. **Analyzes** skill diversity across categories
6. **Recommends** personalized learning paths
7. **Stores** analysis history per user
8. **Exports** professional PDF reports

All powered by:
- FastAPI backend (REST API)
- React frontend (modern UI)
- spaCy NLP (text processing)
- scikit-learn ML (placement prediction)
- Fuzzy matching (skill normalization)
- SQLite database (data persistence)

The complete pipeline processes user input through multiple layers of AI/ML processing to deliver actionable career insights.
