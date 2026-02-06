@echo off
echo ========================================
echo    Placement Portal - Starting...
echo ========================================
echo.
echo Installing dependencies (if needed)...
call npm install
echo.
echo Starting both Frontend and Backend...
echo.
echo Frontend will be available at: http://localhost:3000
echo Backend API will be available at: http://localhost:5000
echo.
echo Press Ctrl+C to stop both servers
echo.
call npm run dev
