@echo off
setlocal enabledelayedexpansion
color 0A
echo.
echo ================================================================
echo  AI Placement Intelligence Platform - Startup Script
echo  Version: 4.2.0 (ML Compatibility + State Machine Integrity)
echo ================================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.9+ from https://www.python.org/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)
echo [OK] Python found
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [WARN] Node.js not found - frontend may fail
    echo        Install Node.js from https://nodejs.org/
) else (
    echo [OK] Node.js found
)
echo.

echo [1/8] Setting up Python Virtual Environment...
if not exist venv (
    echo      Creating new virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        pause
        exit /b 1
    )
)
echo [OK] Virtual environment ready

echo.
echo [2/8] Activating Virtual Environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)
set "PYTHON_EXEC=%CD%\venv\Scripts\python.exe"
echo [OK] Virtual environment activated

echo.
echo [3/8] Installing / Verifying Python Dependencies...
"%PYTHON_EXEC%" -m pip install --upgrade pip >nul 2>&1
"%PYTHON_EXEC%" -m pip install -r requirements.txt >nul 2>&1
if errorlevel 1 (
    echo [WARN] Some dependencies may have failed - attempting to continue...
) else (
    echo [OK] Python dependencies ready
)

echo.
echo [4/8] Downloading spaCy NLP Model...
"%PYTHON_EXEC%" -m spacy download en_core_web_sm >nul 2>&1
if errorlevel 1 (
    echo [WARN] spaCy model download failed - NLP features may be limited
) else (
    echo [OK] spaCy model ready
)

echo.
echo [5/8] Installing Frontend Dependencies...
if exist frontend (
    cd frontend
    call npm install >nul 2>&1
    if errorlevel 1 (
        echo [WARN] npm install failed - check Node.js installation
        cd ..
    ) else (
        echo [OK] Frontend dependencies ready
        cd ..
    )
) else (
    echo [WARN] Frontend directory not found
)

cd backend
"%PYTHON_EXEC%" -c "from database.db import engine; from database import models; models.Base.metadata.create_all(bind=engine); print('DB OK')" 2>nul
if errorlevel 1 (
    echo [WARN] DB migration check failed - will retry on server start
) else (
    echo [OK] Database schema up to date (outcomes + tracking tables ready)
)

echo.
echo [?] Would you like to re-seed the Placement Database with mock data?
echo     (This will provide demo students, drives, and outcomes)
set /p SEED_CHOICE="Seed database now? (y/n): "
if /i "!SEED_CHOICE!"=="y" (
    echo      Seeding database...
    "%PYTHON_EXEC%" seed_placement.py
    echo [OK] Placement data seeded successfully
)
cd ..

echo.
echo [X] Initializing Logs Directory...
if not exist backend\logs mkdir backend\logs
echo [OK] Logs directory ready

echo.
echo [7/8] Running Engine Smoke Test...
cd backend
"%PYTHON_EXEC%" smoke_test.py 2>nul | findstr /C:"[OK]" /C:"[FAIL]"
echo [OK] Smoke test complete

echo.
echo [8/9] Running End-to-End State Machine Tests...
set "DATABASE_URL=sqlite:///e2e_test.db"
"%PYTHON_EXEC%" test_e2e_placement.py > e2e_test.log 2>&1
set "DATABASE_URL="
if errorlevel 1 (
    echo [WARN] E2E Tests Failed. Check backend/e2e_test.log for details.
) else (
    echo [OK] E2E State Machine Validation Passed!
)
if exist e2e_test.db del e2e_test.db
cd ..

echo.
echo [9/9] Starting All Services...
echo.
echo ================================================================

REM ── API Keys (replace with your actual keys) ────────────────────
set GEMINI_API_KEY=YOUR_PRIMARY_GEMINI_API_KEY_HERE
set FALLBACK_GEMINI_API_KEY=YOUR_FALLBACK_GEMINI_API_KEY_HERE

REM ── Start Backend ───────────────────────────────────────────────
echo.
echo [>>] Launching FastAPI Backend (v3.0.0) on port 8000...
start "Backend - AI Placement Intelligence v3" cmd /k "cd /d "%CD%" && call venv\Scripts\activate.bat && "%PYTHON_EXEC%" -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000 || (echo. && echo [ERROR] BACKEND FAILED - SEE ABOVE && pause)"

REM Give backend 4 seconds to initialize DB tables and engines
timeout /t 4 /nobreak >nul

REM ── Start Frontend ──────────────────────────────────────────────
echo.
echo [>>] Launching React / Vite Frontend on port 5173...
start "Frontend - AI Placement Intelligence v3" cmd /k "cd /d "%CD%" && cd frontend && npm run dev || (echo. && echo [ERROR] FRONTEND FAILED - SEE ABOVE && pause)"

REM Give frontend time to compile
timeout /t 6 /nobreak >nul

echo.
echo ================================================================
echo  [OK] Startup Sequence Complete - v4.2.0 (ML Integration Ready)
echo ================================================================
echo.
echo  Application URLs:
echo    Frontend App      :  http://localhost:5173
echo    Analytics Panel   :  http://localhost:5173/admin
echo    Student Dashboard :  http://localhost:5173/student
echo    PR Dashboard      :  http://localhost:5173/pr
echo    API Docs (Swagger):  http://localhost:8000/docs
echo    API Health Check  :  http://localhost:8000/health
echo.
echo  Core Intelligence Endpoints (v4.0.0):
echo    POST /outcomes                - Record real-world SUCCESS (Ground Truth)
echo    GET  /analytics/outcomes      - Cohort-wide placement analytics
echo    POST /preparation/plan        - Learning roadmap from skill gaps
echo    POST /practice/set            - Role-filtered question set
echo    POST /tracking/feedback       - Adaptive ML feedback loop
echo.
echo  Server Windows:
echo    Backend  : "Backend - AI Placement Intelligence Platform"
echo    Frontend : "Frontend - AI Placement Intelligence Platform"
echo.
echo  Placement Demo Credentials:
echo    Admin: admin@university.edu / adminpassword
echo    PR:    pr1@university.edu / prpassword
echo    Student: student1@test.com / studentpassword
echo.
echo  Troubleshooting:
echo    Backend fails  : Check backend console for import / port errors
echo    Frontend fails : Check frontend console for build errors
echo    Port 8000 busy : Close other apps or change port in backend/main.py
echo    Models missing : Run: python backend/ai_model/train_models.py
echo    DB issues      : Delete backend/ai_placement.db to reset schema
echo.
echo  This launcher will close in 10 seconds. Servers keep running.
echo.
timeout /t 10 /nobreak

REM ── Open Browser ────────────────────────────────────────────────
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" http://localhost:5173
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" http://localhost:5173
) else if exist "%ProgramFiles%\Mozilla Firefox\firefox.exe" (
    start "" "%ProgramFiles%\Mozilla Firefox\firefox.exe" http://localhost:5173
) else (
    start "" http://localhost:5173
)

echo.
echo  Platform is live. Happy Placement Prep!
echo.
pause


