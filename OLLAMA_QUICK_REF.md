# Ollama Quick Reference - Placement Portal

## 🚀 Quick Start

1. **Install Ollama**: https://ollama.com/download (restart after install)
2. **Run setup script**: `setup-ollama.bat` or `setup-ollama.ps1`
3. **Verify**: `node backend/test-ollama.js`

---

## 📦 Required Models

| Model | Size | Purpose | Command |
|-------|------|---------|---------|
| `llama3:8b` | 4.7 GB | Resume AI, ATS analysis | `ollama pull llama3:8b` |
| `minicpm-v` | 2.6 GB | Marksheet OCR | `ollama pull minicpm-v` |

---

## ⚡ Essential Commands

```bash
# Check version
ollama --version

# List installed models
ollama list

# Pull a model
ollama pull llama3:8b

# Remove a model
ollama rm llama3:8b

# Test a model
ollama run llama3:8b "test prompt"

# Start service (usually auto-starts)
ollama serve

# Check service status
curl http://localhost:11434/api/tags
```

---

## 🔧 Troubleshooting

### "ollama: command not found"
1. Restart computer
2. Or add to PATH: `C:\Users\<username>\AppData\Local\Programs\Ollama`

### "Connection refused"
```bash
ollama serve
```

### Out of disk space?
```bash
# Use smaller model
ollama pull llama3:3b
```

### Port 11434 in use?
```bash
# Find and kill the process
netstat -ano | findstr :11434
taskkill /PID <PID> /F
```

---

## 📁 File Locations

- **Models**: `C:\Users\<username>\.ollama\models\`
- **Config**: `C:\Users\<username>\.ollama\`
- **Size**: ~7.3 GB total

---

## 🎯 Testing

```bash
# Full test suite
cd backend
node test-ollama.js

# Quick test
ollama run llama3:8b "Write a professional summary for a software developer"
```

---

## ⚙️ Backend Configuration

**File**: `backend/.env`

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b
OLLAMA_VISION_MODEL=minicpm-v
```

---

## 💡 Alternative Models (If Space Limited)

### Smaller Text Model
```bash
ollama pull llama3:3b  # Only 2.0 GB
```
Update `.env`: `OLLAMA_MODEL=llama3:3b`

### Alternative Vision
```bash
ollama pull llava:7b   # 4.5 GB, better quality
```
Update `.env`: `OLLAMA_VISION_MODEL=llava:7b`

---

## 📊 Performance

- **First load**: 5-10 seconds
- **Subsequent**: Near instant (cached in RAM)
- **RAM usage**: 2-4 GB per active model
- **Auto-unload**: After 5 min inactivity

---

## 🗑️ Cleanup

```bash
# Remove unused models
ollama rm llama3:8b
ollama rm minicpm-v

# Free up space: Delete entire cache
# Windows: C:\Users\<username>\.ollama\models
```

---

## 📚 Resources

- **Docs**: https://ollama.com/docs
- **Models**: https://ollama.com/library
- **Discord**: https://discord.gg/ollama

---

## ✅ Success Checklist

- [ ] Ollama installed
- [ ] Computer restarted
- [ ] `ollama --version` works
- [ ] `ollama list` shows both models
- [ ] `curl http://localhost:11434/api/tags` responds
- [ ] `node backend/test-ollama.js` passes
- [ ] Backend `.env` configured

---

**Need help?** Check `OLLAMA_SETUP_GUIDE.md` for detailed instructions.
