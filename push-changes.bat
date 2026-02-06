@echo off
echo ========================================
echo   Quick Git Push Script
echo ========================================
echo.

echo Checking git status...
git status

echo.
echo ========================================
echo   Adding all changes...
git add .

echo.
echo ========================================
echo   Committing changes...
git commit -m "Update project - %date% %time%"

echo.
echo ========================================
echo   Pushing to GitHub (Vercel auto-deploys)...
git push origin main

echo.
echo ========================================
echo   Done! Check Vercel dashboard for deployment
echo ========================================
pause

