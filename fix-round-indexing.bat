@echo off
echo ================================================
echo   Fix Round Indexing Migration Script
echo ================================================
echo.
echo This script will update the Reports collection
echo to use 1-indexed rounds (starting from 1).
echo.
echo Press Ctrl+C to cancel, or
pause

cd backend
echo.
echo Running migration...
node scripts\fix-round-indexing.js

echo.
echo ================================================
pause
