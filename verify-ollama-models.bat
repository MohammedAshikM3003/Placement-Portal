@echo off
echo.
echo ═══════════════════════════════════════════════════════════
echo   Ollama Model Verification for Placement Portal
echo ═══════════════════════════════════════════════════════════
echo.

echo Checking Ollama installation...
ollama --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Ollama is not installed!
    echo Download it from: https://ollama.com/download
    pause
    exit /b 1
)
echo ✅ Ollama is installed
echo.

echo ───────────────────────────────────────────────────────────
echo Checking installed models...
echo ───────────────────────────────────────────────────────────
ollama list
echo.

echo ───────────────────────────────────────────────────────────
echo Checking required models for this project...
echo ───────────────────────────────────────────────────────────
echo.

echo Required models:
echo   1. llama3:8b    (Resume AI, ATS analysis)
echo   2. minicpm-v    (Marksheet OCR)
echo.

ollama list | findstr "llama3:8b" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ llama3:8b is installed
) else (
    echo ❌ llama3:8b is NOT installed
    echo    Run: ollama pull llama3:8b
)

ollama list | findstr "minicpm-v" >nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ minicpm-v is installed
) else (
    echo ❌ minicpm-v is NOT installed
    echo    Run: ollama pull minicpm-v
)

echo.
echo ───────────────────────────────────────────────────────────
echo Testing Ollama service...
echo ───────────────────────────────────────────────────────────
curl -s http://localhost:11434/api/tags >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Ollama service is running at http://localhost:11434
) else (
    echo ⚠️  Ollama service is not responding
    echo    Start it with: ollama serve
    echo    Or make sure Ollama app is running
)

echo.
echo ═══════════════════════════════════════════════════════════
echo   Verification Complete
echo ═══════════════════════════════════════════════════════════
echo.
pause
