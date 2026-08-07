@echo off
echo ================================================
echo   Verify Round Indexing
echo ================================================
echo.
echo This script verifies that rounds are correctly
echo numbered (1-indexed) in the Reports collection.
echo.
pause

cd backend
echo.
echo Running verification...
node scripts\verify-round-indexing.js

echo.
echo ================================================
pause
