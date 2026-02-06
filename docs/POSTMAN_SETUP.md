# Postman API Setup for Hugging Face Resume Analysis

## Overview
This document explains how to set up Postman API integration with Hugging Face for intelligent resume analysis.

## Architecture Flow
```
Student Upload → Backend → Postman API → Hugging Face API → Analysis Results → Backend → Frontend
```

## Postman API Setup

### 1. Create Postman Collection
Create a new collection called "Resume Analysis API" with the following structure:

```
Resume Analysis API/
├── Resume Analysis/
│   ├── POST Upload Resume File
│   └── POST Analyze Resume Content
├── Hugging Face API Tests/
│   ├── POST Test Resume Text Extraction
│   └── POST Test Resume Analysis
└── Resume Analysis Results/
    ├── GET Get Analysis Results
    └── GET Get All Resume Analyses
```

### 2. Environment Variables
Set up the following environment variables in Postman:

```json
{
  "base_url": "https://your-postman-api.com",
  "hugging_face_api_key": "YOUR_HUGGING_FACE_API_KEY_HERE",
  "studentId": "{{studentId}}"
}
```

### 3. API Endpoints

#### POST Analyze Resume Content
- **URL**: `{{base_url}}/api/resume/analyze`
- **Method**: POST
- **Headers**:
  ```
  Content-Type: application/json
  Authorization: Bearer {{hugging_face_api_key}}
  ```
- **Body** (JSON):
  ```json
  {
    "fileData": "base64_encoded_file_data",
    "fileName": "resume.pdf",
    "checklist": [
      { "id": "name", "text": "Include Full Name" },
      { "id": "phone_no", "text": "Add Mobile Number" },
      { "id": "email", "text": "Provide valid Email ID" },
      { "id": "linkedin", "text": "Add LinkedIn Profile" },
      { "id": "github", "text": "Add GitHub Profile" },
      { "id": "summary", "text": "Include Summary/About Section" },
      { "id": "skills", "text": "List Technical Skills" },
      { "id": "experience", "text": "Include Experience/Internships" },
      { "id": "projects", "text": "Showcase Projects (1-5+ projects)" },
      { "id": "education", "text": "Mention Education/Degree" },
      { "id": "certifications", "text": "Include Certifications" },
      { "id": "achievements", "text": "Highlight Achievements" },
      { "id": "page_limit", "text": "Keep Resume within 1-2 Pages" }
    ]
  }
  ```

### 4. Hugging Face Integration

#### Text Extraction Endpoint
- **URL**: `https://api-inference.huggingface.co/models/microsoft/layoutlmv3-base`
- **Method**: POST
- **Headers**:
  ```
  Authorization: Bearer {{hugging_face_api_key}}
  Content-Type: application/json
  ```

#### Resume Analysis Endpoint
- **URL**: `https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium`
- **Method**: POST
- **Headers**:
  ```
  Authorization: Bearer {{hugging_face_api_key}}
  Content-Type: application/json
  ```

### 5. Postman Scripts

#### Pre-request Script (for analysis endpoint)
```javascript
// Convert base64 to buffer if needed
if (pm.environment.get("fileData")) {
    const fileData = pm.environment.get("fileData");
    pm.environment.set("fileBuffer", Buffer.from(fileData, 'base64'));
}
```

#### Test Script (for analysis endpoint)
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has analysis result", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('analysisResult');
    pm.expect(jsonData.analysisResult).to.have.property('percentage');
    pm.expect(jsonData.analysisResult).to.have.property('checklistResults');
});

// Save analysis result to environment
pm.test("Save analysis result", function () {
    const jsonData = pm.response.json();
    pm.environment.set("analysisResult", JSON.stringify(jsonData.analysisResult));
});
```

### 6. Backend Configuration

Update your `.env-atlas` file with:
```env
# Postman API Configuration
POSTMAN_API_URL=https://your-postman-api.com/api/resume/analyze
POSTMAN_API_KEY=your-postman-api-key
```

### 7. Testing Flow

1. **Upload Resume**: Student uploads resume file
2. **Backend Processing**: Backend converts file to base64
3. **Postman API Call**: Backend calls Postman API with file data
4. **Hugging Face Analysis**: Postman calls Hugging Face API for analysis
5. **Results Processing**: Postman processes and formats results
6. **Response**: Analysis results returned to backend
7. **Frontend Update**: Results displayed in resume checklist

### 8. Expected Response Format

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
      { "id": "name", "isCompleted": true },
      { "id": "phone_no", "isCompleted": true },
      { "id": "email", "isCompleted": true },
      { "id": "linkedin", "isCompleted": false },
      { "id": "github", "isCompleted": true },
      { "id": "summary", "isCompleted": true },
      { "id": "skills", "isCompleted": true },
      { "id": "experience", "isCompleted": true },
      { "id": "projects", "isCompleted": true },
      { "id": "education", "isCompleted": true },
      { "id": "certifications", "isCompleted": false },
      { "id": "achievements", "isCompleted": true },
      { "id": "page_limit", "isCompleted": true }
    ]
  }
}
```

### 9. Error Handling

The system includes fallback mechanisms:
- If Postman API is unavailable, uses basic analysis
- If Hugging Face API fails, provides default results
- Graceful degradation ensures system always works

### 10. Next Steps

1. Set up your Postman API endpoint
2. Configure Hugging Face API integration
3. Test the complete flow
4. Update environment variables
5. Deploy and test with real resume files

## Benefits

- **Intelligent Analysis**: AI-powered resume analysis
- **Accurate Results**: Better than basic rule-based analysis
- **Scalable**: Can handle multiple resume formats
- **Reliable**: Fallback mechanisms ensure system stability
- **Professional**: Industry-standard analysis capabilities
