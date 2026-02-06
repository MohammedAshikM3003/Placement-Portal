@echo off
echo ========================================
echo Starting Placement Portal Backend
echo ========================================

echo.
echo [1/3] Checking MongoDB...

:: Check if MongoDB is running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo ✓ MongoDB is already running
) else (
    echo ! MongoDB is not running
    echo Starting MongoDB...
    
    :: Try common MongoDB installation paths
    if exist "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" (
        start /B "MongoDB" "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"
        echo ✓ MongoDB started
    ) else if exist "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" (
        start /B "MongoDB" "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath "C:\data\db"
        echo ✓ MongoDB started
    ) else if exist "C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe" (
        start /B "MongoDB" "C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe" --dbpath "C:\data\db"
        echo ✓ MongoDB started
    ) else (
        echo × MongoDB not found in standard locations
        echo Please install MongoDB or start it manually
        echo Download from: https://www.mongodb.com/try/download/community
        pause
        exit /b 1
    )
    
    :: Wait for MongoDB to start
    echo Waiting for MongoDB to initialize...
    timeout /t 3 /nobreak >NUL
)

echo.
echo [2/3] Checking MongoDB connection...
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/placement_portal').then(() => {console.log('✓ MongoDB connection successful'); process.exit(0);}).catch(err => {console.error('× MongoDB connection failed:', err.message); process.exit(1);});"

if %ERRORLEVEL% neq 0 (
    echo.
    echo × Failed to connect to MongoDB
    echo Please make sure MongoDB is installed and running
    pause
    exit /b 1
)

echo.
echo [3/3] Starting Express server...
echo Server will run on http://localhost:5000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

node server-mongodb.js
