# Postman Mock Server Setup for Resume Analysis

## Quick Setup Guide

### 1. Create Postman Mock Server

1. **Open Postman**
2. **Create New Collection** → "Resume Analysis API"
3. **Add Request** → POST `/resume/analyze`
4. **Create Mock Server**:
   - Click "Mock" tab
   - Click "Create Mock Server"
   - Name: "Resume Analysis Mock"
   - Environment: "Resume Analysis"

### 2. Mock Response Setup

**Request Configuration:**
- **Method**: POST
- **URL**: `/resume/analyze`
- **Headers**: `Content-Type: application/json`

**Response (200 OK):**
```json
{
  "analysisResult": {
    "percentage": 85,
    "totalScore": 11,
    "maxScore": 13,
    "grade": "A-",
    "description": "Excellent resume with minor improvements needed",
    "suggestions": [
      "Add more project details",
      "Include relevant certifications",
      "Highlight achievements more prominently"
    ],
    "checklistResults": [
      {"id": "name", "isCompleted": true},
      {"id": "phone_no", "isCompleted": true},
      {"id": "email", "isCompleted": true},
      {"id": "linkedin", "isCompleted": false},
      {"id": "github", "isCompleted": true},
      {"id": "summary", "isCompleted": true},
      {"id": "skills", "isCompleted": true},
      {"id": "experience", "isCompleted": true},
      {"id": "projects", "isCompleted": true},
      {"id": "education", "isCompleted": true},
      {"id": "certifications", "isCompleted": false},
      {"id": "achievements", "isCompleted": true},
      {"id": "page_limit", "isCompleted": true}
    ]
  }
}
```

### 3. Get Mock Server URL

After creating the mock server, you'll get a URL like:
```
https://your-mock-id.mock.pstmn.io/resume/analyze
```

### 4. Update Backend Configuration

Update your `.env-atlas` file:
```env
# Postman Mock Server Configuration
POSTMAN_API_URL=https://your-mock-id.mock.pstmn.io
POSTMAN_API_KEY=your-postman-api-key
```

### 5. Test the Integration

1. **Start your backend server**
2. **Upload a resume** through the frontend
3. **Check console logs** for API calls
4. **Verify analysis results** in the UI

## Alternative: Use ngrok for Local Testing

### 1. Install ngrok
```bash
npm install -g ngrok
```

### 2. Create Local API Server
Create a simple Express server to handle the analysis:

```javascript
// mock-api-server.js
const express = require('express');
const app = express();

app.use(express.json());

app.post('/resume/analyze', (req, res) => {
  console.log('Received analysis request:', req.body);
  
  // Mock AI analysis result
  const analysisResult = {
    percentage: 85,
    totalScore: 11,
    maxScore: 13,
    grade: "A-",
    description: "Excellent resume with minor improvements needed",
    suggestions: [
      "Add more project details",
      "Include relevant certifications",
      "Highlight achievements more prominently"
    ],
    checklistResults: [
      {"id": "name", "isCompleted": true},
      {"id": "phone_no", "isCompleted": true},
      {"id": "email", "isCompleted": true},
      {"id": "linkedin", "isCompleted": false},
      {"id": "github", "isCompleted": true},
      {"id": "summary", "isCompleted": true},
      {"id": "skills", "isCompleted": true},
      {"id": "experience", "isCompleted": true},
      {"id": "projects", "isCompleted": true},
      {"id": "education", "isCompleted": true},
      {"id": "certifications", "isCompleted": false},
      {"id": "achievements", "isCompleted": true},
      {"id": "page_limit", "isCompleted": true}
    ]
  };
  
  res.json({ analysisResult });
});

app.listen(3001, () => {
  console.log('Mock API server running on port 3001');
});
```

### 3. Run ngrok
```bash
ngrok http 3001
```

### 4. Update Backend Configuration
Use the ngrok URL in your `.env-atlas`:
```env
POSTMAN_API_URL=https://your-ngrok-url.ngrok.io
```

## Testing Steps

1. **Set up mock server** (choose one method above)
2. **Update environment variables** in `.env-atlas`
3. **Restart backend server**
4. **Upload a resume** through the frontend
5. **Check analysis results** in the UI

## Expected Results

After setup, you should see:
- ✅ Resume uploads successfully
- ✅ AI analysis results appear
- ✅ Checklist shows completed/incomplete items
- ✅ Score and grade are displayed
- ✅ Suggestions are provided

## Troubleshooting

### Common Issues:
1. **CORS Errors** → Add CORS headers to mock server
2. **API Key Issues** → Verify API key in environment
3. **URL Not Found** → Check mock server URL
4. **Timeout Errors** → Increase timeout in backend

### Debug Steps:
1. Check browser console for errors
2. Check backend server logs
3. Test API endpoint directly in Postman
4. Verify environment variables
