@echo off
setlocal enabledelayedexpansion
color 0A
echo.
echo ================================================================
echo  AI Placement Intelligence Platform - Startup Script
echo  Version: 3.0.0 (Preparation + Practice + Tracking Engines)
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
echo [OK] Virtual environment activated

echo.
echo [3/8] Installing / Verifying Python Dependencies...
python -m pip install --upgrade pip >nul 2>&1
pip install -r requirements.txt >nul 2>&1
if errorlevel 1 (
    echo [WARN] Some dependencies may have failed - attempting to continue...
) else (
    echo [OK] Python dependencies ready
)

echo.
echo [4/8] Downloading spaCy NLP Model...
python -m spacy download en_core_web_sm >nul 2>&1
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

echo.
echo [6/8] Verifying Database Schema (UserProgress table)...
cd backend
python -c "from database.db import engine; from database import models; models.Base.metadata.create_all(bind=engine); print('DB OK')" 2>nul
if errorlevel 1 (
    echo [WARN] DB migration check failed - will retry on server start
) else (
    echo [OK] Database schema up to date (user_progress table ready)
)
cd ..

echo.
echo [7/8] Running Engine Smoke Test...
cd backend
python smoke_test.py 2>nul | findstr /C:"[OK]" /C:"[FAIL]"
cd ..
echo [OK] Smoke test complete

echo.
echo [8/8] Starting All Services...
echo.
echo ================================================================

REM ── API Keys (replace with your actual keys) ────────────────────
set GEMINI_API_KEY=YOUR_PRIMARY_GEMINI_API_KEY_HERE
set FALLBACK_GEMINI_API_KEY=YOUR_FALLBACK_GEMINI_API_KEY_HERE

REM ── Start Backend ───────────────────────────────────────────────
echo.
echo [>>] Launching FastAPI Backend (v3.0.0) on port 8000...
start "Backend - AI Placement Intelligence v3" cmd /k "cd /d "%CD%" && call venv\Scripts\activate.bat && cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 || (echo. && echo [ERROR] BACKEND FAILED - SEE ABOVE && pause)"

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
echo  [OK] Startup Sequence Complete - v3.0.0
echo ================================================================
echo.
echo  Application URLs:
echo    Frontend App      :  http://localhost:5173
echo    API Docs (Swagger):  http://localhost:8000/docs
echo    API Health Check  :  http://localhost:8000/health
echo.
echo  New Engine Endpoints (v3.0.0):
echo    POST /preparation/plan        - Learning roadmap from skill gaps
echo    POST /practice/set            - Role-filtered question set
echo    POST /tracking/record         - Record practice session
echo    GET  /tracking/progress/{id}  - Score evolution history
echo    POST /tracking/feedback       - Feedback loop re-scoring
echo.
echo  Server Windows:
echo    Backend  : "Backend - AI Placement Intelligence v3"
echo    Frontend : "Frontend - AI Placement Intelligence v3"
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


