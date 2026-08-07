@echo off
REM Automated Ollama Setup Script for Placement Portal
REM This script will guide you through installing Ollama and required models

echo.
echo ════════════════════════════════════════════════════════════════
echo   Ollama Setup for Placement Portal
echo ════════════════════════════════════════════════════════════════
echo.

REM Check if Ollama is installed
echo [1/5] Checking if Ollama is installed...
ollama --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ollama is NOT installed
    echo.
    echo Please install Ollama first:
    echo   1. Visit: https://ollama.com/download
    echo   2. Download "OllamaSetup.exe"
    echo   3. Run the installer
    echo   4. Restart your computer
    echo   5. Run this script again
    echo.
    pause
    exit /b 1
) else (
    echo ✅ Ollama is installed
    ollama --version
)
echo.

REM Check if Ollama service is running
echo [2/5] Checking if Ollama service is running...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  Ollama service is not running
    echo Starting Ollama service...
    start "Ollama Service" /MIN ollama serve
    timeout /t 3 /nobreak >nul
    echo ✅ Ollama service started
) else (
    echo ✅ Ollama service is running
)
echo.

REM Check installed models
echo [3/5] Checking installed models...
ollama list
echo.

REM Ask user if they want to install models
echo [4/5] Installing required models...
echo.
echo Required models for Placement Portal:
echo   1. llama3:8b     (4.7 GB) - Resume AI, ATS analysis
echo   2. minicpm-v     (2.6 GB) - Marksheet OCR
echo.
echo Total download size: ~7.3 GB
echo.

set /p INSTALL="Do you want to install these models? (y/n): "
if /i not "%INSTALL%"=="y" (
    echo.
    echo ⚠️  Installation cancelled
    echo You can install models manually later with:
    echo   ollama pull llama3:8b
    echo   ollama pull minicpm-v
    echo.
    pause
    exit /b 0
)

echo.
echo ──────────────────────────────────────────────────────────────
echo Installing Model 1/2: llama3:8b (~4.7 GB)
echo ──────────────────────────────────────────────────────────────
ollama list | findstr "llama3:8b" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ llama3:8b is already installed
) else (
    echo Downloading llama3:8b... (this may take 5-15 minutes)
    ollama pull llama3:8b
    if %ERRORLEVEL% EQU 0 (
        echo ✅ llama3:8b installed successfully
    ) else (
        echo ❌ Failed to install llama3:8b
        pause
        exit /b 1
    )
)

echo.
echo ──────────────────────────────────────────────────────────────
echo Installing Model 2/2: minicpm-v (~2.6 GB)
echo ──────────────────────────────────────────────────────────────
ollama list | findstr "minicpm-v" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ minicpm-v is already installed
) else (
    echo Downloading minicpm-v... (this may take 3-10 minutes)
    ollama pull minicpm-v
    if %ERRORLEVEL% EQU 0 (
        echo ✅ minicpm-v installed successfully
    ) else (
        echo ❌ Failed to install minicpm-v
        pause
        exit /b 1
    )
)

echo.
echo [5/5] Verification...
echo.
echo Installed models:
ollama list
echo.

REM Test the installation
echo ──────────────────────────────────────────────────────────────
echo Testing models...
echo ──────────────────────────────────────────────────────────────
echo.

echo Testing llama3:8b...
ollama run llama3:8b "Write a one-sentence summary for a software developer" --verbose=false
echo.

echo ✅ llama3:8b is working!
echo.

echo ════════════════════════════════════════════════════════════════
echo   Setup Complete!
echo ════════════════════════════════════════════════════════════════
echo.
echo ✅ Ollama is installed and running
echo ✅ llama3:8b model installed
echo ✅ minicpm-v model installed
echo.
echo Next steps:
echo   1. Start your backend server:
echo      cd d:\Placement-Portal\backend
echo      npm start
echo.
echo   2. Test with the test script:
echo      node test-ollama.js
echo.
echo   3. Your models are stored in:
echo      C:\Users\%USERNAME%\.ollama\models
echo.
echo   4. To manage models:
echo      ollama list          - List installed models
echo      ollama rm model-name - Remove a model
echo.
pause
