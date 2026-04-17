@echo off
setlocal enabledelayedexpansion
color 0A
echo.
echo ========================================================
echo AI Placement Intelligence Platform - Startup Script
echo Version: 2.0.0 (Rate Limiting, PDF Export, Resume History)
echo ========================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: Python is not installed or not in PATH
    echo Please install Python 3.9+ from https://www.python.org/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

echo ✓ Python found
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  WARNING: Node.js not found, but will try to continue
    echo If frontend fails, install Node.js from https://nodejs.org/
) else (
    echo ✓ Node.js found
)
echo.

echo [1/6] Setting up Python Virtual Environment...
if not exist venv (
    echo Creating new virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
)
echo ✓ Virtual environment ready

echo.
echo [2/6] Activating Virtual Environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ❌ Failed to activate virtual environment
    pause
    exit /b 1
)
echo ✓ Virtual environment activated

echo.
echo [3/6] Installing Python Dependencies...
python -m pip install --upgrade pip >nul 2>&1
pip install -r requirements.txt >nul 2>&1
if errorlevel 1 (
    echo ⚠️  WARNING: Some dependencies may have failed to install
    echo Attempting to continue anyway...
) else (
    echo ✓ Dependencies installed
)

echo.
echo [4/6] Downloading spaCy NLP Model...
python -m spacy download en_core_web_sm >nul 2>&1
if errorlevel 1 (
    echo ⚠️  WARNING: spaCy model download failed, but will try to continue
) else (
    echo ✓ spaCy model ready
)

echo.
echo [5/6] Installing Frontend Dependencies...
if exist frontend (
    cd frontend
    call npm install >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  WARNING: npm install failed
        cd ..
    ) else (
        echo ✓ Frontend dependencies installed
        cd ..
    )
) else (
    echo ⚠️  Frontend directory not found
)

echo.
echo [6/6] Starting Services...
echo.
echo ========================================================
echo.

REM Set Hybrid AI Configuration
set GEMINI_API_KEY=YOUR_PRIMARY_GEMINI_API_KEY_HERE
set FALLBACK_GEMINI_API_KEY=YOUR_FALLBACK_GEMINI_API_KEY_HERE

REM Start Backend in a way that shows errors
echo 🚀 Starting Hybrid AI Backend Server (FastAPI on port 8000)...
echo.
echo Command: uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
echo.
start "Backend - AI Placement Intelligence" cmd /k "cd /d "%CD%" && call venv\Scripts\activate.bat && cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 || (echo. && echo ❌ BACKEND FAILED TO START - SEE ERROR ABOVE && echo. && pause)"

REM Give backend time to start
timeout /t 3 /nobreak >nul

REM Start Frontend
echo.
echo 🚀 Starting Frontend Server (React/Vite on port 5173)...
echo.
start "Frontend - AI Placement Intelligence" cmd /k "cd /d "%CD%" && cd frontend && npm run dev || (echo. && echo ❌ FRONTEND FAILED TO START - SEE ERROR ABOVE && echo. && pause)"

REM Give frontend time to start
timeout /t 5 /nobreak >nul

echo.
echo ========================================================
echo ✅ Startup sequence complete!
echo ========================================================
echo.
echo 📍 Access the Application:
echo    • Frontend App:    http://localhost:5173
echo    • API Docs:        http://localhost:8000/docs
echo    • API Health:      http://localhost:8000/
echo.
echo 💻 Server Windows:
echo    • Backend:         "Backend - AI Placement Intelligence" window
echo    • Frontend:        "Frontend - AI Placement Intelligence" window
echo.
echo ⚠️  IMPORTANT NOTES:
echo    1. If you see errors, check the respective server windows
echo    2. Backend window will show import/initialization errors
echo    3. Frontend window will show compilation errors
echo    4. Look for lines starting with ❌ ERROR or stacktraces
echo    5. Common issues: Missing dependencies, port conflicts, or corrupted files
echo.
echo 🔧 Troubleshooting:
echo    • If backend fails: Check backend console window for detailed error
echo    • If frontend fails: Check frontend console window for detailed error
echo    • If port 8000 in use: Close other applications or change port in backend/main.py
echo    • If models missing: Run: python backend/ai_model/train_models.py
echo.
echo ℹ️  This launcher will close automatically. Servers will keep running.
echo.
timeout /t 8 /nobreak

REM Attempt to open browser
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" http://localhost:5173
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" http://localhost:5173
) else if exist "%ProgramFiles%\Mozilla Firefox\firefox.exe" (
    start "" "%ProgramFiles%\Mozilla Firefox\firefox.exe" http://localhost:5173
) else (
    echo 📂 Please open your browser and navigate to: http://localhost:5173
)

echo.
echo ✨ Everything should be running now!
echo.
pause
