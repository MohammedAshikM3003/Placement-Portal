@echo off
echo ========================================
echo    Placement Portal - Quick Start
echo ========================================
echo.
echo Backend: In-Memory Storage (No MongoDB needed)
echo Frontend: React Development Server
echo.
echo Starting servers...
echo - Backend will be ready at: http://localhost:5000
echo - Frontend will be ready at: http://localhost:3000
echo.
echo Please wait for "Compiled successfully!" message...
echo.
start "Backend Server" cmd /k "cd backend && node server-mongodb.js"
timeout /t 3 /nobreak > nul
start "Frontend Server" cmd /k "npm start"
echo.
echo Both servers are starting in separate windows.
echo Close those windows to stop the servers.
pause
