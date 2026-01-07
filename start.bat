@echo off
echo ========================================
echo  SETUKPA - Sistem Manajemen Makalah
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js tidak ditemukan!
    echo Silakan install Node.js terlebih dahulu dari https://nodejs.org
    pause
    exit /b 1
)

echo [INFO] Memeriksa dependencies...
echo.

REM Check backend dependencies
if not exist "backend\node_modules\" (
    echo [INFO] Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

REM Check frontend dependencies
if not exist "frontend\node_modules\" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo [SUCCESS] Dependencies ready!
echo.
echo ========================================
echo  Starting SETUKPA Application
echo ========================================
echo.
echo Backend akan berjalan di: http://localhost:3001
echo Frontend akan berjalan di: http://localhost:5173
echo.
echo Tekan Ctrl+C untuk menghentikan server
echo.

REM Start backend in new window
start "SETUKPA Backend" cmd /k "cd backend && npm run dev"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in current window
cd frontend
call npm run dev
