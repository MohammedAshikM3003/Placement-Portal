# Ollama Setup Guide for Placement Portal

This guide will help you install and configure Ollama with the required models for the Placement Portal.

## Prerequisites
- Windows 11 (you have this ✓)
- ~7.3 GB free disk space for models
- ~8 GB RAM recommended
- Administrator access

---

## Step 1: Download and Install Ollama

### Option A: Direct Download (Recommended)
1. **Open your browser** and go to: https://ollama.com/download
2. **Click on "Download for Windows"**
3. **Run the installer** (`OllamaSetup.exe`)
4. **Follow the installation wizard**
   - Click "Next"
   - Accept the license agreement
   - Choose installation location (default is fine)
   - Click "Install"
5. **Wait for installation to complete**
6. **Restart your computer** (important for PATH updates)

### Option B: Using PowerShell
```powershell
# Download Ollama installer
Invoke-WebRequest -Uri "https://ollama.com/download/OllamaSetup.exe" -OutFile "$env:TEMP\OllamaSetup.exe"

# Run the installer
Start-Process -FilePath "$env:TEMP\OllamaSetup.exe" -Wait
```

---

## Step 2: Verify Ollama Installation

After installation and restart, open **Command Prompt** or **PowerShell** and run:

```cmd
ollama --version
```

**Expected output:**
```
ollama version is X.X.X
```

If you see "command not found", restart your computer or add Ollama to PATH manually.

---

## Step 3: Install Required Models

Your Placement Portal needs **2 models**:

### Model 1: llama3:8b (Text Generation)
**Used for:** Resume analysis, ATS scoring, content generation

```cmd
ollama pull llama3:8b
```

**Download details:**
- Size: ~4.7 GB
- Time: 5-15 minutes (depending on internet speed)
- Location: `C:\Users\<username>\.ollama\models`

**What you'll see:**
```
pulling manifest
pulling 365c0bd3c000... 100% ▕████████████████▏ 4.7 GB
pulling 8ab4849b038c... 100% ▕████████████████▏ 1.5 KB
pulling 577073ffcc6c... 100% ▕████████████████▏ 110 B
...
success
```

---

### Model 2: minicpm-v (Vision/OCR)
**Used for:** Marksheet OCR, scanned document processing

```cmd
ollama pull minicpm-v
```

**Download details:**
- Size: ~2.6 GB
- Time: 3-10 minutes

---

## Step 4: Verify Models Installation

Check installed models:

```cmd
ollama list
```

**Expected output:**
```
NAME            ID              SIZE      MODIFIED
llama3:8b       365c0bd3c000    4.7 GB    2 minutes ago
minicpm-v       xxx             2.6 GB    1 minute ago
```

---

## Step 5: Start Ollama Service

Ollama should start automatically, but you can verify:

```cmd
ollama serve
```

**If already running, you'll see:**
```
Error: listen tcp 127.0.0.1:11434: bind: Only one usage of each socket address...
```
*(This is normal - it means Ollama is already running)*

**To check if service is responding:**
```cmd
curl http://localhost:11434/api/tags
```

---

## Step 6: Test Your Models

### Test Text Generation (llama3:8b)
```cmd
ollama run llama3:8b "Write a one-line professional summary for a software developer"
```

### Test Vision Model (minicpm-v)
```cmd
ollama run minicpm-v "Describe this image" --image path/to/image.jpg
```

---

## Step 7: Configure Backend Environment

Update your backend `.env` file:

```env
# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b
OLLAMA_VISION_MODEL=minicpm-v
```

---

## Step 8: Test with Your Project

Navigate to your backend directory and run the test script:

```cmd
cd d:\Placement-Portal\backend
node test-ollama.js
```

**Expected output:**
```
╔══════════════════════════════════════════════════════════╗
║        OLLAMA RESUME AI — FULL TEST SUITE               ║
╚══════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════
  TEST 1: Ollama Status Check
═══════════════════════════════════════════════════════
  ⏱  Time: 0.15s
  Running: true
  Models: llama3:8b, minicpm-v
  Has required model (llama3:8b): true
  ✅ PASS
...
```

---

## 💾 Storage & Performance

### Disk Space Usage
```
C:\Users\<username>\.ollama\models\
├── llama3:8b     → 4.7 GB
├── minicpm-v     → 2.6 GB
└── Total         → ~7.3 GB
```

### Memory Usage (When Running)
- **Idle:** ~100 MB
- **Processing:** ~2-4 GB per model
- **Recommended RAM:** 8 GB minimum

### Performance Tips
1. **SSD Impact:** Models are loaded into RAM, so after initial download there's minimal SSD wear
2. **First Run:** Models take 5-10 seconds to load initially
3. **Subsequent Runs:** Models stay in memory for faster responses
4. **Auto-unload:** Models automatically unload after ~5 minutes of inactivity

---

## 🔧 Troubleshooting

### Issue 1: "ollama: command not found"
**Solution:**
1. Restart your computer
2. Add to PATH manually:
   - Press `Win + X` → System → Advanced Settings → Environment Variables
   - Add `C:\Users\<username>\AppData\Local\Programs\Ollama` to PATH

### Issue 2: "Connection refused"
**Solution:**
```cmd
# Start Ollama service manually
ollama serve
```

### Issue 3: Model download fails
**Solution:**
```cmd
# Clear cache and retry
ollama rm llama3:8b
ollama pull llama3:8b
```

### Issue 4: Port 11434 already in use
**Solution:**
```cmd
# Check what's using the port
netstat -ano | findstr :11434

# Kill the process if needed (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue 5: Out of disk space
**Solution:**
- Free up at least 10 GB before installation
- Or use smaller models (see Alternative Models below)

---

## 🔄 Alternative Models (If Space is Limited)

### Smaller Text Model
Instead of `llama3:8b` (4.7 GB), use:
```cmd
ollama pull llama3:3b
```
**Size:** 2.0 GB
**Trade-off:** Slightly lower quality but faster

**Update `.env`:**
```env
OLLAMA_MODEL=llama3:3b
```

### Alternative Vision Models
Instead of `minicpm-v`, use:
```cmd
# Option 1: LLaVA (better quality, larger)
ollama pull llava:7b         # 4.5 GB

# Option 2: LLaVA (smallest)
ollama pull llava:13b        # 7.3 GB (best quality)
```

**Update `.env`:**
```env
OLLAMA_VISION_MODEL=llava:7b
```

---

## 🗑️ Removing Models

To free up space, you can remove unused models:

```cmd
# List all models
ollama list

# Remove a specific model
ollama rm model-name

# Examples:
ollama rm llama3:8b
ollama rm minicpm-v
```

---

## 🚀 Next Steps

After successful installation:

1. ✅ Start your backend server:
   ```cmd
   cd d:\Placement-Portal\backend
   npm start
   ```

2. ✅ Test resume analysis feature in your app

3. ✅ Test marksheet OCR upload

4. ✅ Monitor performance and adjust models if needed

---

## 📞 Support

- **Ollama Docs:** https://ollama.com/docs
- **Ollama Discord:** https://discord.gg/ollama
- **Model Library:** https://ollama.com/library

---

## ✨ Quick Command Reference

```cmd
# Check version
ollama --version

# List installed models
ollama list

# Pull a model
ollama pull model-name

# Remove a model
ollama rm model-name

# Test a model
ollama run model-name "your prompt"

# Start service
ollama serve

# Check service status
curl http://localhost:11434/api/tags
```

---

**Last Updated:** 2026-03-20
**For Project:** Placement Portal
**Required Models:** llama3:8b, minicpm-v
