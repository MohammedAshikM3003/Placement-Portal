// OpenAI Service for Resume Builder
// Drop-in replacement for geminiService

class OpenAIService {
  constructor() {
    this.apiKey = process.env.REACT_APP_OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE';
    
    if (this.apiKey === 'YOUR_OPENAI_API_KEY_HERE') {
      console.warn('⚠️ OpenAI API key not set. Please add your API key to use AI content generation.');
      this.isAvailable = false;
    } else {
      this.isAvailable = true;
      console.log('✅ OpenAI API initialized successfully');
    }
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
  // Routes through backend proxy first, then falls back to direct API
  async generateContent(prompt, type = 'summary') {
    // Try backend proxy first
    try {
      console.log(`🤖 Calling backend OpenAI proxy (type=${type})...`);
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
        if (data.text) {
          console.log('✅ Content generated via backend OpenAI proxy');
          return data.text;
        }
      }
      
      const errData = await resp.json().catch(() => ({}));
      
      // If rate limited, throw error immediately
      if (resp.status === 429 || errData.error === 'RATE_LIMITED') {
        console.error('⛔ OpenAI API rate limited. Wait 1-2 minutes.');
        throw new Error('RATE_LIMITED: API rate-limited. Please wait 1-2 minutes and try again.');
      }
      
      console.warn('⚠️ Backend proxy failed:', resp.status, errData.error || 'Falling back to direct API');
    } catch (backendErr) {
      // Re-throw rate limit errors
      if (backendErr.message?.includes('RATE_LIMITED')) {
        throw backendErr;
      }
      if (backendErr.name === 'AbortError') {
        console.warn('⚠️ Backend proxy timed out, trying direct API...');
      } else {
        console.warn('⚠️ Backend proxy unreachable, trying direct API...', backendErr.message);
      }
    }

    // Fallback: Direct API call
    if (!this.isAvailable) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      console.log(`🤖 Making direct OpenAI API call (type=${type})...`);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert Technical Recruiter and Professional Resume Writer specializing in the software engineering industry. Use strong action verbs and emphasize technical implementation and project impact. Ensure all output is ATS-friendly with industry-specific keywords. ALWAYS generate complete, detailed responses.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: type === 'json' ? 2000 : 500,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.error('⛔ OpenAI API rate limited.');
          throw new Error('RATE_LIMITED: API rate-limited. Please wait 1-2 minutes and try again.');
        }
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Quality gate: check word count for non-JSON responses
      if (type !== 'json') {
        const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
        if (wordCount < 25) {
          console.warn(`⚠️ OpenAI returned too short (${wordCount} words), retrying...`);
          throw new Error('Response too short, please try again');
        }
        console.log(`✅ Content generated successfully (${wordCount} words)`);
      } else {
        console.log('✅ JSON content generated successfully');
      }

      return content;
      
    } catch (error) {
      console.error('❌ OpenAI direct API call failed:', error);
      if (error.message?.includes('RATE_LIMITED')) {
        throw error;
      }
      throw new Error('Failed to generate content. Please try again.');
    }
  }

  // Check if service is available
  isServiceAvailable() {
    return this.isAvailable;
  }
}

const openaiService = new OpenAIService();
export default openaiService;
