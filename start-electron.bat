@echo off
REM AMOKK Electron App - Windows Development Launcher

echo ===========================================
echo 🚀 AMOKK Electron Development Launcher
echo ===========================================
echo.

REM Build React frontend
echo 🔨 Building React frontend...
call npm run build
if errorlevel 1 exit /b 1

REM Compile Electron main process
echo 📦 Compiling Electron main process...
call npx tsc -p tsconfig.electron.json
if errorlevel 1 exit /b 1

REM Start Electron
echo 🎬 Starting Electron app...
call npx electron .

echo.
echo ===========================================
echo ✅ Done
echo ===========================================

pause
