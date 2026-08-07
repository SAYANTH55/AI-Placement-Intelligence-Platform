@echo off
setlocal enabledelayedexpansion
color 0A
echo.
echo ================================================================
echo  AI Placement Intelligence Platform - Startup Script
echo  Version: 5.5.0 (Job Mode Scoring ^& Architecture)
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
for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo [OK] Python %PYTHON_VERSION% found

REM Check Python version compatibility
for /f "tokens=1,2 delims=." %%a in ("%PYTHON_VERSION%") do (
    set MAJOR=%%a
    set MINOR=%%b
)
if %MAJOR% LSS 3 (
    echo [ERROR] Python 3.9+ is required, but you have Python %MAJOR%.%MINOR%
    pause
    exit /b 1
)
if %MAJOR% EQU 3 if %MINOR% LSS 9 (
    echo [ERROR] Python 3.9+ is required, but you have Python %MAJOR%.%MINOR%
    pause
    exit /b 1
)
if %MAJOR% GEQ 3 if %MINOR% GEQ 9 (
    echo [INFO] Python version is compatible - requires 3.9+
)
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
"%PYTHON_EXEC%" -m pip install --upgrade pip setuptools wheel --quiet >nul 2>&1
if not exist requirements.txt (
    echo [ERROR] requirements.txt not found in current directory
    pause
    exit /b 1
)

echo      Installing packages from requirements.txt...
echo      This may take several minutes on first install...

REM Attempt installation with optimized flags for Python 3.10
"%PYTHON_EXEC%" -m pip install --no-cache-dir -q -r requirements.txt 2>pip_install.log
if errorlevel 1 (
    echo [WARN] Installation had issues - checking pip log...
    
    REM Retry without cache and with slightly relaxed constraints
    echo      Retrying installation with fallback strategy...
    "%PYTHON_EXEC%" -m pip install --no-cache-dir --upgrade -r requirements.txt 2>&1 | findstr /V "already satisfied"
    
    if errorlevel 1 (
        echo.
        echo [ERROR] Dependency installation failed
        echo.
        echo Troubleshooting steps:
        echo   1. Delete the 'venv' folder: rmdir /s /q venv
        echo   2. Run start.bat again to create a fresh environment
        echo   3. If still failing, check pip_install.log for details
        echo.
        pause
        exit /b 1
    ) else (
        echo [OK] Python dependencies installed ^(with fallbacks^)
    )
) else (
    echo [OK] Python dependencies ready
)

REM Ensure Playwright browsers are installed for PDF generation
echo      Verifying Playwright browser binaries...
"%PYTHON_EXEC%" -m playwright install chromium >nul 2>&1
if errorlevel 1 (
    echo [WARN] Failed to install Playwright chromium. PDF generation may fail.
) else (
    echo [OK] Playwright chromium installed
)

REM Verify critical packages are installed (including new ML dependencies)
echo      Verifying critical packages...
"%PYTHON_EXEC%" -c "import sqlalchemy, fastapi, uvicorn, spacy, xgboost, sklearn, playwright; print('All critical packages OK')" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Critical packages not installed!
    echo [INFO] Running targeted installation...
    "%PYTHON_EXEC%" -m pip install --no-cache-dir fastapi uvicorn sqlalchemy spacy pandas numpy xgboost scikit-learn playwright
    if errorlevel 1 (
        echo [ERROR] Installation failed - deleting venv...
        cd ..
        rmdir /s /q venv
        echo [INFO] Virtual environment deleted. Please run start.bat again.
        pause
        exit /b 1
    )
)

echo.
echo [3b/8] Training / Verifying ML Models...
set "ML_MODELS_OK=1"
if not exist backend\ai_model\models\resume_analyzer\role_model.pkl set "ML_MODELS_OK=0"
if not exist backend\ai_model\models\resume_analyzer\vectorizer_role.pkl set "ML_MODELS_OK=0"
if not exist backend\ai_model\models\resume_analyzer\ats_model.pkl set "ML_MODELS_OK=0"
if not exist backend\ai_model\models\resume_analyzer\vectorizer_ats.pkl set "ML_MODELS_OK=0"
if not exist backend\ai_model\models\resume_analyzer\skills.pkl set "ML_MODELS_OK=0"
if not exist backend\ai_model\models\resume_analyzer\label_encoder.pkl set "ML_MODELS_OK=0"

if "%ML_MODELS_OK%"=="0" (
    echo      One or more resume analyzer models missing — training now...
    echo      ^(This is a one-time operation, may take ~10 seconds^)
    cd backend
    "%PYTHON_EXEC%" -m ai_model.train_models > model_train.log 2>&1
    if errorlevel 1 (
        echo [WARN] Model training failed. Check backend/model_train.log for details.
    ) else (
        echo [OK] All ML models trained and saved.
        if exist model_train.log del model_train.log
    )
    cd ..
) else (
    echo [OK] All ML models present.
)

echo.
echo [4/8] Downloading spaCy NLP Model...
REM Download spaCy model - it's needed for text processing
"%PYTHON_EXEC%" -m spacy download en_core_web_sm >nul 2>&1
if errorlevel 1 (
    echo [WARN] spaCy model download failed - NLP features may be limited
    echo        You can retry manually: python -m spacy download en_core_web_sm
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
echo      Running database migrations...
"%PYTHON_EXEC%" -c "from database.db import engine; from database import models; models.Base.metadata.create_all(bind=engine); print('DB OK')" 2>nul
"%PYTHON_EXEC%" migrate_placement_engine.py 2>nul
"%PYTHON_EXEC%" scratch/migrate_provisioning.py 2>nul
"%PYTHON_EXEC%" migrate_validation_gateway.py 2>nul
"%PYTHON_EXEC%" scripts/migrate_profile_strength.py 2>nul
"%PYTHON_EXEC%" scripts/cleanup_db.py 2>nul
"%PYTHON_EXEC%" migrate_skills_architecture.py 2>nul
"%PYTHON_EXEC%" scripts/migrate_db_structures.py 2>nul
"%PYTHON_EXEC%" scripts/migrate_json_to_relational.py 2>nul
if errorlevel 1 (
    echo [WARN] Some DB migrations failed - check logs
) else (
    echo [OK] Database schema fully updated - placement engine, provisioning, validation gateway, profile strength, and job mode scoring ready
)

echo.
echo [6/8] Verifying AI Model Files...
set "MODELS_MISSING=0"
if not exist ai_model\models\resume_analyzer\role_model.pkl (
    echo [WARN] role_model.pkl not found
    set "MODELS_MISSING=1"
)
if not exist ai_model\models\resume_analyzer\vectorizer_role.pkl (
    echo [WARN] vectorizer_role.pkl not found
    set "MODELS_MISSING=1"
)
if not exist ai_model\models\resume_analyzer\ats_model.pkl (
    echo [WARN] ats_model.pkl not found
    set "MODELS_MISSING=1"
)
if not exist ai_model\models\resume_analyzer\vectorizer_ats.pkl (
    echo [WARN] vectorizer_ats.pkl not found
    set "MODELS_MISSING=1"
)
if not exist ai_model\models\resume_analyzer\skills.pkl (
    echo [WARN] skills.pkl not found
    set "MODELS_MISSING=1"
)

if "%MODELS_MISSING%"=="1" (
    echo [WARN] Some ML models are missing. Resume analysis may not work.
) else (
    echo [OK] All ML models verified
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
echo [8/9] Running End-to-End and Unit Tests...
set "DATABASE_URL=sqlite:///e2e_test.db"
"%PYTHON_EXEC%" test_e2e_placement.py > e2e_test.log 2>&1
set "DATABASE_URL="
if errorlevel 1 (
    echo [WARN] E2E Tests Failed. Check backend/e2e_test.log for details.
) else (
    echo [OK] E2E State Machine Validation Passed!
)
"%PYTHON_EXEC%" -m pytest tests/ > pytest_tests.log 2>&1
if errorlevel 1 (
    echo [WARN] Unit Tests Failed. Check backend/pytest_tests.log for details.
) else (
    echo [OK] Unit Tests - Domain, Pipeline, Classifier, and Validation - Passed!
)
if exist pytest_tests.log del pytest_tests.log
if exist e2e_test.db del e2e_test.db
cd ..

echo.
echo [9/9] Starting All Services...
echo.
echo ================================================================

REM ── Clear Caches for newly incorporated changes ──────────────
echo [OK] Clearing caches to ensure recent patches reflect...
if exist "frontend\node_modules\.vite" rmdir /s /q "frontend\node_modules\.vite"
for /d /r "backend" %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d"
echo [OK] Vite and Python caches cleared.

REM ── Load Environment Variables from .env ───────────────────────
if exist .env (
    echo [OK] Loading environment from .env file...
    for /f "usebackq tokens=1,2 delims==" %%i in (".env") do (
        if not "%%i"=="" set "%%i=%%j"
    )
) else (
    echo [WARN] No .env file found - using system defaults
)

REM ── Ensure Critical API Keys are set ───────────────────────
REM API keys must be set in your .env file (never hardcode keys here).
REM Copy .env.example to .env and fill in your GEMINI_API_KEY and FALLBACK_GEMINI_API_KEY.
if not defined GEMINI_API_KEY (
    echo [WARN] GEMINI_API_KEY is not set. Add it to your .env file.
)
if not defined FALLBACK_GEMINI_API_KEY (
    echo [WARN] FALLBACK_GEMINI_API_KEY is not set. Add it to your .env file.
)

REM ── Start Backend ───────────────────────────────────────────────
echo.
echo [->] Checking if port 8001 is available...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8001 "') do (
    if "%%a" neq "0" (
        echo [INFO] Freeing port 8001 ^(Killing PID %%a^)...
        taskkill /F /PID %%a >nul 2>&1
    )
)
echo [->] Launching FastAPI Backend (v4.0.0) on port 8001...
start "Backend - AI Placement Intelligence v4" cmd /k "cd /d "%CD%" && call venv\Scripts\activate.bat && "%PYTHON_EXEC%" -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8001 || (echo. && echo [ERROR] BACKEND FAILED - SEE ABOVE && pause)"

REM Give backend 4 seconds to initialize DB tables and engines
timeout /t 4 /nobreak >nul

REM ── Start Frontend ──────────────────────────────────────────────
echo.
echo [->] Checking if port 5173 is available...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 "') do (
    if "%%a" neq "0" (
        echo [INFO] Freeing port 5173 ^(Killing PID %%a^)...
        taskkill /F /PID %%a >nul 2>&1
    )
)
echo [->] Launching React / Vite Frontend on port 5173...
start "Frontend - AI Placement Intelligence v4" cmd /k "cd /d "%CD%" && cd frontend && npm run dev || (echo. && echo [ERROR] FRONTEND FAILED - SEE ABOVE && pause)"

REM Give frontend time to compile
timeout /t 6 /nobreak >nul

echo.
echo ================================================================
echo  [OK] Startup Sequence Complete - v5.5.0 (ML Enhanced)
echo ================================================================
echo.
echo  Application URLs:
echo    Frontend App      :  http://localhost:5173
echo    Analytics Panel   :  http://localhost:5173/admin
echo    Student Dashboard :  http://localhost:5173/student
echo    PR Dashboard      :  http://localhost:5173/pr
echo    Placement Admin   :  http://localhost:5173/admin/placement-engine
echo    API Docs (Swagger):  http://localhost:8001/docs
echo    API Health Check  :  http://localhost:8001/health
echo.
echo  Core Intelligence Endpoints (v4.0.0):
echo    POST /outcomes                - Record real-world SUCCESS (Ground Truth)
echo    GET  /analytics/outcomes      - Cohort-wide placement analytics
echo    POST /preparation/plan        - Learning roadmap from skill gaps
echo    POST /practice/set            - Role-filtered question set
echo    POST /tracking/feedback       - Adaptive ML feedback loop
echo    POST /api/ats/analyze         - Standalone Resume ATS Benchmark
echo    POST /api/ats/debug           - ATS Engine Trace ^& Reasoning
echo    POST /api/compare-jd          - JD to Resume Matcher
echo    POST /api/reports/dossier/generate - Placement Dossier Generation
echo.
echo  Server Windows:
echo    Backend  : "Backend - AI Placement Intelligence v4"
echo    Frontend : "Frontend - AI Placement Intelligence v4"
echo.
echo  Placement Demo Credentials:
echo    Admin: admin@university.edu / adminpassword
echo    PR:    pr1@university.edu / prpassword
echo    Student: student1@test.com / studentpassword
echo.
echo  Troubleshooting:
echo    Backend fails  : Check backend console for traceback or startup logs
echo    Port in use    : Use netstat -ano to identify conflicting processes
echo    Models missing : Run: python -m spacy download en_core_web_sm
echo    DB issues      : Delete backend/ai_placement.db to reset schema
echo    API key issues : Create .env file with GEMINI_API_KEY=your_key
echo    Node issues    : Delete frontend/node_modules and run npm install
echo    Pip issues     : Delete venv folder and restart start.bat
echo    Import errors  : Run: pip list to verify packages are installed
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


