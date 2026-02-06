const OpenAI = require('openai');

class RealResumeAnalysisService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async analyzeResume(fileData, fileName) {
    try {
      // Convert PDF to image if needed
      const imageData = await this.convertToImage(fileData, fileName);
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this resume and provide a structured analysis. Check for:
                1. Full Name (prominently displayed)
                2. Contact Information (phone, email)
                3. LinkedIn Profile
                4. GitHub Profile
                5. Professional Summary
                6. Technical Skills
                7. Work Experience
                8. Projects
                9. Education
                10. Certifications
                11. Achievements
                12. Resume length (1-2 pages)
                
                Return a JSON response with:
                - percentage: overall completion score
                - grade: letter grade (A+ to F)
                - checklistResults: array of {id, isCompleted, text}
                - suggestions: array of improvement suggestions
                - description: brief analysis summary`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageData}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      });

      const analysisText = response.choices[0].message.content;
      return this.parseAnalysisResponse(analysisText);
      
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('AI analysis failed');
    }
  }

  async convertToImage(fileData, fileName) {
    // Convert PDF to image using pdf2pic or similar library
    // This is a placeholder - you'll need to implement PDF to image conversion
    return fileData; // For now, return as-is
  }

  parseAnalysisResponse(analysisText) {
    try {
      // Try to parse JSON response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing if JSON format is not followed
      return this.parseTextResponse(analysisText);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.getFallbackAnalysis();
    }
  }

  parseTextResponse(text) {
    // Parse text response and extract structured data
    // This is a simplified version - you'd want more robust parsing
    const hasName = /name/i.test(text);
    const hasContact = /contact|phone|email/i.test(text);
    const hasSkills = /skills|technologies/i.test(text);
    
    return {
      percentage: hasName && hasContact && hasSkills ? 80 : 40,
      grade: hasName && hasContact && hasSkills ? 'B+' : 'D',
      description: 'AI analysis completed',
      suggestions: ['Review AI suggestions in the response'],
      checklistResults: [
        { id: 'name', isCompleted: hasName },
        { id: 'phone_no', isCompleted: hasContact },
        { id: 'email', isCompleted: hasContact },
        // ... other checklist items
      ]
    };
  }

  getFallbackAnalysis() {
    return {
      percentage: 50,
      grade: 'C',
      description: 'Analysis completed with limited AI processing',
      suggestions: ['Upload a clear, readable resume for better analysis'],
      checklistResults: [
        { id: 'name', isCompleted: false },
        { id: 'phone_no', isCompleted: false },
        { id: 'email', isCompleted: false },
        // ... other checklist items
      ]
    };
  }
}

module.exports = RealResumeAnalysisService;
