@echo off
REM Warm Transfer LiveKit Application - Windows Setup Script
REM Attack Capital Assignment

echo =====================================================
echo 🚀 Setting up Warm Transfer LiveKit Application...
echo =====================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.8+ from python.org
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js 18+ from nodejs.org
    pause
    exit /b 1
)

echo [SUCCESS] Prerequisites check passed
echo.

REM Setup backend
echo [INFO] Setting up backend...
cd backend

REM Create virtual environment
echo [INFO] Creating Python virtual environment...
python -m venv venv

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

REM Upgrade pip
echo [INFO] Upgrading pip...
python -m pip install --upgrade pip

REM Install requirements
echo [INFO] Installing Python dependencies...
pip install -r requirements.txt

REM Copy environment file if it doesn't exist
if not exist .env (
    echo [INFO] Creating .env file from template...
    copy .env.example .env
    echo [WARNING] Please edit backend\.env with your API keys before running
) else (
    echo [SUCCESS] Backend .env file already exists
)

cd ..
echo [SUCCESS] Backend setup completed
echo.

REM Setup frontend
echo [INFO] Setting up frontend...
cd frontend

REM Install dependencies
echo [INFO] Installing Node.js dependencies...
npm install

REM Copy environment file if it doesn't exist
if not exist .env.local (
    echo [INFO] Creating .env.local file from template...
    copy .env.example .env.local
    echo [WARNING] Please edit frontend\.env.local with your configuration
) else (
    echo [SUCCESS] Frontend .env.local file already exists
)

cd ..
echo [SUCCESS] Frontend setup completed
echo.

REM Setup root
echo [INFO] Setting up project root...
if exist package.json (
    echo [INFO] Installing root dependencies...
    npm install
)

REM Create logs directory
if not exist logs mkdir logs

echo [SUCCESS] Root setup completed
echo.

echo =========================
echo 📋 CONFIGURATION REQUIRED
echo =========================
echo.
echo [WARNING] Before running the application, you need to configure:
echo.
echo 1. Backend Configuration (backend\.env):
echo    - LIVEKIT_URL: Your LiveKit server URL
echo    - LIVEKIT_API_KEY: Your LiveKit API key
echo    - LIVEKIT_API_SECRET: Your LiveKit API secret
echo    - LLM Provider API key (OpenAI, Groq, or OpenRouter)
echo    - Optional: Twilio credentials for phone integration
echo.
echo 2. Frontend Configuration (frontend\.env.local):
echo    - NEXT_PUBLIC_LIVEKIT_URL: Same as backend LIVEKIT_URL
echo    - NEXT_PUBLIC_API_BASE_URL: Backend URL (http://localhost:8000)
echo.
echo 📚 See README.md and DEVELOPMENT_GUIDE.md for detailed setup instructions
echo.

echo ===============
echo 🎯 QUICK START
echo ===============
echo.
echo [SUCCESS] Setup completed! Next steps:
echo.
echo 1. Configure your API keys (see above)
echo.
echo 2. Start the backend:
echo    cd backend
echo    venv\Scripts\activate.bat
echo    python run.py
echo.
echo 3. In a new terminal, start the frontend:
echo    cd frontend
echo    npm run dev
echo.
echo 4. Open your browser:
echo    http://localhost:3000 (Frontend)
echo    http://localhost:8000/docs (Backend API docs)
echo.
echo 🐳 Alternative: Use Docker Compose
echo    docker-compose up --build
echo.
echo 💡 For development workflow, see DEVELOPMENT_GUIDE.md
echo.

echo [SUCCESS] 🎉 Setup completed successfully!
pause