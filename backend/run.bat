@echo off
REM AMOKK Mock Backend - Windows Startup Script

echo ===========================================
echo 🎤 AMOKK Mock Backend Launcher
echo ===========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8 or higher from https://www.python.org/
    pause
    exit /b 1
)

echo ✅ Python version:
python --version
echo.

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
    echo ✅ Virtual environment created
) else (
    echo ✅ Virtual environment exists
)

echo.

REM Activate virtual environment
echo 🔧 Activating virtual environment...
call venv\Scripts\activate.bat

echo ✅ Virtual environment activated
echo.

REM Install/update dependencies
echo 📥 Installing dependencies...
pip install -q -r requirements.txt
echo ✅ Dependencies installed

echo.
echo ===========================================
echo 🚀 Starting AMOKK Mock Backend...
echo ===========================================
echo.

REM Run the server
python main.py

pause
