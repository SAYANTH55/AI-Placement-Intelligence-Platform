@echo off
echo ========================================================
echo Starting AI Placement Intelligence Platform Pipeline...
echo ========================================================

echo.
echo [1/4] Setting up Python Virtual Environment...
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate

echo.
echo [2/4] Installing Python Dependencies and AI Models...
python -m pip install --upgrade pip
pip install -r requirements.txt
echo Downloading spaCy AI model (en_core_web_sm)...
python -m spacy download en_core_web_sm

echo.
echo [3/4] Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo.
echo [4/4] Starting the Services...
echo Starting Backend Server (FastAPI)...
start "Backend API" cmd /k "call venv\Scripts\activate && cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo Starting Frontend Server (React/Vite)...
start "Frontend UI" cmd /k "cd frontend && npm run dev"

echo.
echo Waiting for servers to initialize...
timeout /t 7 /nobreak > nul

echo.
echo Launching Application in Browser...
start http://localhost:5173

echo.
echo Pipeline started successfully!
echo You can manage the servers from the new command windows that opened.
echo Close this window to exit this launcher (servers will keep running).
pause
