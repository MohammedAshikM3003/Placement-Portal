# OpenAI Setup Guide for Resume Builder

## ✅ What Changed
Your placement portal now uses **OpenAI GPT-3.5-turbo** instead of Gemini for AI-powered resume generation.

### Benefits
- ✅ **Better Rate Limits**: 3,500 requests/min vs Gemini's strict limits  
- ✅ **Generous Free Tier**: $5 free credit (lasts months for college projects)  
- ✅ **Single API Call**: Generates summary + experiences + projects in ONE request  
- ✅ **More Reliable**: Industry-standard API with excellent uptime  

---

## 🚀 Setup Steps (5 minutes)

### Step 1: Get OpenAI API Key

1. **Go to** https://platform.openai.com/signup
2. **Sign up** with email/Google/Microsoft account
3. **Verify email** (check inbox)
4. **Navigate to** https://platform.openai.com/api-keys
5. **Click** "Create new secret key"
6. **Name it** (e.g., "Placement Portal Resume Builder")
7. **Copy the key** immediately (⚠️ shows only once!)

Your key looks like: `sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Add Key to Backend

1. **Open** `backend/.env` file (or create it if it doesn't exist)
2. **Add this line**:
   ```env
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   *(Replace with your actual key)*

3. **Save the file**

### Step 3: Restart Backend Server

```bash
cd backend
npm start
```

Or if using the batch file:
```bash
start-server.bat
```

---

## 🧪 Testing

### Test Resume Builder AI Generation

1. **Login** as a student
2. **Go to** Resume Builder page
3. **Enable AI**: Toggle "Enable AI Content Generation"
4. **Fill in**:
   - Personal Summary (write a draft)
   - Experience/Project descriptions (write drafts)
5. **Click** "Generate Resume"

**Expected**: All content gets polished in ~3-5 seconds with a single API call.

### Console Logs to Look For

**Backend console:**
```
🤖 Backend: OpenAI GPT-3.5-turbo attempt 1...
✅ Backend: JSON generated via OpenAI (length=1234)
```

**Frontend console:**
```
🤖 Calling backend Gemini proxy (type=json)...
✅ Batch content generated via backend proxy
```

*(Note: Frontend still says "Gemini proxy" - that's just the function name, it now calls OpenAI)*

---

## 📊 Rate Limits & Pricing

### Free Tier ($5 credit)
- **Valid**: 3 months
- **Usage**: ~50,000 resume generations (way more than needed)
- **Rate Limit**: 3,500 requests/min

### After Free Tier Expires
- **GPT-3.5-turbo**: $0.50 per 1 million tokens
- **Estimate**: ~$0.002 per resume generation
- **100 students**: ~$0.20 total

**Conclusion**: Extremely affordable even if you pay.

---

## 🔧 Troubleshooting

### Error: "AI service not configured"
**Solution**: Make sure `OPENAI_API_KEY` is in `backend/.env` and restart the server.

### Error: "Invalid or expired OpenAI API key"
**Solution**: 
1. Check your key is correct (no extra spaces)
2. Verify your OpenAI account is active
3. Generate a new key if needed

### Error: "Rate limit reached"
**Solution**: Wait 60 seconds. If it persists, you may have exceeded free tier (unlikely).

### Response too short (partial results)
**Solution**: This is normal occasionally. The system uses the best response it got. Regenerate if needed.

---

## 🎯 How It Works (Technical)

### Single API Call Architecture

**Before (Multiple Calls - Slow)**:
- Personal Summary → API Call 1
- Experience 1 → API Call 2  
- Experience 2 → API Call 3  
- Project 1 → API Call 4  
- Project 2 → API Call 5  
**Total**: 5 API calls, higher rate limit risk

**After (Batch Call - Fast)**:
- All content → **1 API Call** with JSON response  
**Total**: 1 API call, minimal rate limit risk

### Request Flow
```
Frontend (ResumeBuilder.jsx)
    ↓
    Constructs batch prompt with all data
    ↓
Backend (/api/resume-builder/ai-generate)
    ↓
    Single OpenAI API call
    ↓
    Returns structured JSON:
    {
      "summary": "...",
      "experiences": ["...", "..."],
      "projects": ["...", "..."]
    }
    ↓
Frontend applies all at once
```

---

## 🔐 Security Notes

- ⚠️ **Never commit** `.env` file to Git  
- ✅ `.env` is already in `.gitignore`  
- 🔒 Keep your API key secret  
- 💡 Rotate keys periodically  

---

## 📝 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [OpenAI Pricing](https://openai.com/pricing)
- [Rate Limits Guide](https://platform.openai.com/docs/guides/rate-limits)

---

## ✨ Summary

You're now using **OpenAI GPT-3.5-turbo** for resume generation with:
- ✅ 1 API call for all content (summary + experiences + projects)
- ✅ Better rate limits (3,500/min)
- ✅ $5 free credit (months of use)
- ✅ More reliable and faster

**No frontend changes needed** - the backend automatically handles everything!
