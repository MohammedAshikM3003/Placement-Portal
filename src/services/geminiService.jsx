// Gemini AI Service for Resume Analysis
import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    // You need to add your Gemini API key here
    // Get it from: https://aistudio.google.com/
    this.apiKey = process.env.REACT_APP_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';
    
    if (this.apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      console.warn('⚠️ Gemini API key not set. Please add your API key to use real analysis.');
      this.isAvailable = false;
    } else {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: "gemini-1.5-flash", // Using 1.5-flash for more stable free-tier rate limits
        systemInstruction: "You are an expert Technical Recruiter and Professional Resume Writer specializing in the software engineering industry. Use strong action verbs (e.g., 'Engineered', 'Integrated', 'Optimized') and a confident, professional tone. Emphasize technical implementation and project impact over generic soft skills. Ensure all output is ATS-friendly with industry-specific keywords. ALWAYS generate complete, detailed responses — never give short or truncated answers."
      });
      this.isAvailable = true;
      console.log('✅ Gemini API initialized successfully with gemini-1.5-flash');
    }
  }

  // Extract text from PDF using Gemini Vision
  async extractTextFromPDF(file) {
    if (!this.isAvailable) {
      throw new Error('Gemini API key not configured');
    }

    try {
      console.log('🔍 Extracting text from PDF using Gemini Vision...');
      
      // Convert file to base64
      const base64 = await this.fileToBase64(file);
      
      // Use Gemini Vision to extract text from PDF
      const prompt = `
        Extract all text content from this PDF document. 
        Return only the extracted text, no additional formatting or explanations.
        If the PDF contains images or scanned content, try to extract any visible text.
      `;

      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64,
            mimeType: file.type
          }
        }
      ]);

      const response = await result.response;
      const extractedText = response.text();
      
      console.log('✅ Text extracted successfully, length:', extractedText.length);
      return extractedText;
      
    } catch (error) {
      console.error('❌ Error extracting text with Gemini:', error);
      throw new Error('Failed to extract text from PDF. Please try again.');
    }
  }

  // Analyze resume content using Gemini
  async analyzeResumeContent(text) {
    if (!this.isAvailable) {
      throw new Error('Gemini API key not configured');
    }

    try {
      console.log('🧠 Analyzing resume content with Gemini...');
      
      const prompt = `
        Analyze this resume text and provide a detailed analysis based on these criteria:
        
        1. College Email: Does it contain a college email address (like @ksrce.ac.in)?
        2. One Page: Is the content concise and likely to fit on one page?
        3. CGPA and School: Does it mention CGPA/GPA and school information?
        4. Board Percentage: Does it include 10th and 12th board percentages?
        5. Skills and Projects: Does it list technical skills and projects?
        6. GitHub and LinkedIn: Does it include GitHub and LinkedIn profile links?
        7. Professional Format: Is it professional without personal photos?
        
        For each criterion, respond with:
        - "YES" if the criterion is met
        - "NO" if the criterion is not met
        - "PARTIAL" if partially met
        
        Format your response as JSON:
        {
          "college_email": "YES/NO/PARTIAL",
          "one_page": "YES/NO/PARTIAL", 
          "cgpa_school": "YES/NO/PARTIAL",
          "board_percentage": "YES/NO/PARTIAL",
          "skills_projects": "YES/NO/PARTIAL",
          "github_linkedin": "YES/NO/PARTIAL",
          "professional_format": "YES/NO/PARTIAL",
          "overall_score": "percentage (0-100)",
          "suggestions": ["suggestion1", "suggestion2", "suggestion3"]
        }
        
        Resume text:
        ${text.substring(0, 4000)} // Limit to avoid token limits
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();
      
      console.log('✅ Resume analysis completed');
      
      // Parse JSON response
      try {
        const analysis = JSON.parse(analysisText);
        return analysis;
      } catch (parseError) {
        console.error('❌ Error parsing Gemini response:', parseError);
        // Fallback to text parsing
        return this.parseTextResponse(analysisText);
      }
      
    } catch (error) {
      console.error('❌ Error analyzing resume with Gemini:', error);
      throw new Error('Failed to analyze resume. Please try again.');
    }
  }

  // Parse text response if JSON parsing fails
  parseTextResponse(text) {
    const analysis = {
      college_email: "NO",
      one_page: "NO", 
      cgpa_school: "NO",
      board_percentage: "NO",
      skills_projects: "NO",
      github_linkedin: "NO",
      professional_format: "NO",
      overall_score: 30,
      suggestions: ["Unable to parse analysis. Please try again."]
    };

    // Simple text parsing as fallback
    if (text.toLowerCase().includes('college email') || text.includes('@')) {
      analysis.college_email = "YES";
    }
    if (text.toLowerCase().includes('cgpa') || text.toLowerCase().includes('gpa')) {
      analysis.cgpa_school = "YES";
    }
    if (text.toLowerCase().includes('skills') || text.toLowerCase().includes('projects')) {
      analysis.skills_projects = "YES";
    }

    return analysis;
  }

  // Convert file to base64
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:application/pdf;base64, prefix
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }

  // Check if service is available
  isServiceAvailable() {
    return this.isAvailable;
  }

  // Helper: Clean JSON response
  cleanJson(text) {
    try {
      // Remove markdown code blocks
      const cleaned = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.warn('Failed to parse JSON:', e);
      return null;
    }
  }

  // Generate content from a prompt (used by Resume Builder)
  // Routes through backend proxy to avoid browser SSL certificate issues
  async generateContent(prompt, type = 'summary') {
    // Try backend proxy first (bypasses browser SSL issues)
    try {
      console.log(`🤖 Calling backend Gemini proxy (type=${type})...`);
      const API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90000); // 90s timeout for batch
      
      const resp = await fetch(`${API_BASE}/api/resume-builder/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ prompt, type }),
      });
      clearTimeout(timeout);

      if (resp.ok) {
        const data = await resp.json();
        // If requesting JSON, return possibly parsed object or text for client to parse
        if (type === 'json' && data.text) {
           console.log('✅ Batch content generated via backend proxy');
           return data.text;
        }

        if (data.text) {
          // Quality gate on proxy response too
          const wordCount = data.text.split(/\s+/).filter(w => w.length > 0).length;
          if (wordCount >= 25) {
            console.log(`✅ Content generated via backend proxy (${wordCount} words)`);
            return data.text;
          }
          console.warn(`⚠️ Backend proxy returned too short (${wordCount} words), falling through to direct API...`);
        }
      }
      const errData = await resp.json().catch(() => ({}));
      // If rate limited, do NOT fall through to direct API — tell user to wait
      if (resp.status === 429 || errData.error === 'RATE_LIMITED') {
        console.error('⛔ Gemini API rate limited. Wait 1-2 minutes.');
        throw new Error('RATE_LIMITED: API rate-limited. Please wait 1-2 minutes and try again.');
      }
      console.warn('⚠️ Backend proxy failed:', resp.status, errData.error || '');
      // Fall through to direct API call only for non-rate-limit errors
    } catch (backendErr) {
      // Re-throw rate limit errors — don't fall through
      if (backendErr.message?.includes('RATE_LIMITED')) {
        throw backendErr;
      }
      if (backendErr.name === 'AbortError') {
        console.warn('⚠️ Backend proxy timed out, trying direct API...');
      } else {
        console.warn('⚠️ Backend proxy unreachable, trying direct API...', backendErr.message);
      }
    }

    // Fallback: Direct API call (may fail due to browser SSL issues)
    if (!this.isAvailable) {
      throw new Error('Gemini API key not configured');
    }

    const models = ['gemini-1.5-flash', 'gemini-1.5-flash-8b'];
    let lastError = null;
    const MAX_RETRIES = 3;

    for (let i = 0; i < models.length; i++) {
      const modelName = models[i];

      for (let retry = 0; retry < MAX_RETRIES; retry++) {
        try {
          console.log(`🤖 Attempting direct ${modelName} (attempt ${retry + 1}/${MAX_RETRIES})...`);
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 60000);

          const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { 
                  temperature: 0.7, 
                  maxOutputTokens: type === 'json' ? 4096 : 1024, // More tokens for batch
                  topP: 0.95, 
                  topK: 40,
                  responseMimeType: type === 'json' ? 'application/json' : 'text/plain' 
                },
              }),
            }
          );
          clearTimeout(timeout);

          if (resp.status === 429) {
            const backoffMs = (retry + 1) * 20000; // Increased to 20s, 40s, 60s for 2026 Free Tier
            console.warn(`⏳ ${modelName} rate limited. Waiting ${backoffMs / 1000}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
            lastError = new Error('RATE_LIMITED');
            continue; // retry same model
          }

          if (!resp.ok) {
            const errData = await resp.json().catch(() => ({}));
            const errorMsg = errData.error?.message || resp.statusText;
            console.error(`❌ ${modelName} error ${resp.status}:`, errorMsg);
            lastError = new Error(`API error ${resp.status}: ${errorMsg}`);
            break; // move to next model on non-429 error
          }

          const data = await resp.json();
          let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (text) {
            if (type !== 'json') {
                text = text.trim()
                .replace(/^["'`]+|["'`]+$/g, '')
                .replace(/^(Professional Summary|Summary|Here is|Here's)[:\s]*/i, '')
                .replace(/\*\*/g, '').replace(/\*/g, '')
                .trim();
            
                const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
                if (wordCount < 30 && i < models.length - 1) {
                    console.warn(`⚠️ ${modelName} returned only ${wordCount} words, trying next model...`);
                    lastError = new Error(`Too short: ${wordCount} words`);
                    break; // try next model
                }
            }
            
            console.log(`✅ Content generated successfully via ${modelName}`);
            return text;
          }
          throw new Error('Empty response');
        } catch (error) {
          if (error.message === 'RATE_LIMITED') continue;
          console.error(`❌ Error with ${modelName}:`, error.message);
          lastError = error;
          if (error.name === 'AbortError') {
            lastError = new Error('Request timed out');
          }
          break; // move to next model
        }
      }
    }

    if (lastError?.message?.includes('RATE_LIMITED') || lastError?.message?.includes('429')) {
      throw new Error('RATE_LIMITED: API rate-limited. Please wait 1-2 minutes and try again.');
    }
    throw lastError || new Error('Failed to generate content with any available model');
  }
}

const geminiService = new GeminiService();
export default geminiService;
