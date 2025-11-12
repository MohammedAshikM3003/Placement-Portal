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
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      this.isAvailable = true;
      console.log('✅ Gemini API initialized successfully');
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
}

const geminiService = new GeminiService();
export default geminiService;
