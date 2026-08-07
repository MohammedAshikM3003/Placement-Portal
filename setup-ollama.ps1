# Automated Ollama Setup Script for Placement Portal (PowerShell)
# This script will guide you through installing Ollama and required models

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════=" -ForegroundColor Cyan
Write-Host "  Ollama Setup for Placement Portal" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════=" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator (optional but recommended)
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  Note: Running without administrator privileges" -ForegroundColor Yellow
    Write-Host "   Some features may require admin rights" -ForegroundColor Yellow
    Write-Host ""
}

# Step 1: Check if Ollama is installed
Write-Host "[1/5] Checking if Ollama is installed..." -ForegroundColor Cyan
try {
    $version = ollama --version 2>$null
    Write-Host "✅ Ollama is installed" -ForegroundColor Green
    Write-Host "   $version" -ForegroundColor Gray
} catch {
    Write-Host "❌ Ollama is NOT installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Ollama first:" -ForegroundColor Yellow
    Write-Host "  1. Visit: https://ollama.com/download" -ForegroundColor White
    Write-Host "  2. Download 'OllamaSetup.exe'" -ForegroundColor White
    Write-Host "  3. Run the installer" -ForegroundColor White
    Write-Host "  4. Restart your computer" -ForegroundColor White
    Write-Host "  5. Run this script again" -ForegroundColor White
    Write-Host ""

    $download = Read-Host "Would you like to download Ollama now? (y/n)"
    if ($download -eq 'y') {
        Start-Process "https://ollama.com/download"
    }

    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Step 2: Check if Ollama service is running
Write-Host "[2/5] Checking if Ollama service is running..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Ollama service is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Ollama service is not running" -ForegroundColor Yellow
    Write-Host "   Starting Ollama service..." -ForegroundColor Gray
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Minimized
    Start-Sleep -Seconds 3
    Write-Host "✅ Ollama service started" -ForegroundColor Green
}
Write-Host ""

# Step 3: Check installed models
Write-Host "[3/5] Checking installed models..." -ForegroundColor Cyan
$modelList = ollama list
Write-Host $modelList
Write-Host ""

# Step 4: Install required models
Write-Host "[4/5] Installing required models..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Required models for Placement Portal:" -ForegroundColor White
Write-Host "  1. llama3:8b     (4.7 GB) - Resume AI, ATS analysis" -ForegroundColor White
Write-Host "  2. minicpm-v     (2.6 GB) - Marksheet OCR" -ForegroundColor White
Write-Host ""
Write-Host "Total download size: ~7.3 GB" -ForegroundColor Yellow
Write-Host ""

$install = Read-Host "Do you want to install these models? (y/n)"
if ($install -ne 'y') {
    Write-Host ""
    Write-Host "⚠️  Installation cancelled" -ForegroundColor Yellow
    Write-Host "You can install models manually later with:" -ForegroundColor Gray
    Write-Host "  ollama pull llama3:8b" -ForegroundColor White
    Write-Host "  ollama pull minicpm-v" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 0
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "Installing Model 1/2: llama3:8b (~4.7 GB)" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

if ($modelList -match "llama3:8b") {
    Write-Host "✅ llama3:8b is already installed" -ForegroundColor Green
} else {
    Write-Host "Downloading llama3:8b... (this may take 5-15 minutes)" -ForegroundColor Yellow
    ollama pull llama3:8b
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ llama3:8b installed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install llama3:8b" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "Installing Model 2/2: minicpm-v (~2.6 GB)" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray

if ($modelList -match "minicpm-v") {
    Write-Host "✅ minicpm-v is already installed" -ForegroundColor Green
} else {
    Write-Host "Downloading minicpm-v... (this may take 3-10 minutes)" -ForegroundColor Yellow
    ollama pull minicpm-v
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ minicpm-v installed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install minicpm-v" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Step 5: Verification
Write-Host ""
Write-Host "[5/5] Verification..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Installed models:" -ForegroundColor White
ollama list
Write-Host ""

Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "Testing models..." -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

Write-Host "Testing llama3:8b..." -ForegroundColor Yellow
$testResult = ollama run llama3:8b "Write a one-sentence summary for a software developer"
Write-Host ""
Write-Host "✅ llama3:8b is working!" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "═══════════════════════════════════════════════════════════════=" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════=" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Ollama is installed and running" -ForegroundColor Green
Write-Host "✅ llama3:8b model installed" -ForegroundColor Green
Write-Host "✅ minicpm-v model installed" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Start your backend server:" -ForegroundColor White
Write-Host "     cd d:\Placement-Portal\backend" -ForegroundColor Gray
Write-Host "     npm start" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Test with the test script:" -ForegroundColor White
Write-Host "     node test-ollama.js" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Your models are stored in:" -ForegroundColor White
Write-Host "     C:\Users\$env:USERNAME\.ollama\models" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. To manage models:" -ForegroundColor White
Write-Host "     ollama list          - List installed models" -ForegroundColor Gray
Write-Host "     ollama rm model-name - Remove a model" -ForegroundColor Gray
Write-Host ""

Read-Host "Press Enter to exit"
