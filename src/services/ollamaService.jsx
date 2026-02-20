// Ollama AI Service for Resume Builder
// Routes all AI calls through the Node backend → Ollama (local)
// No API keys needed, no rate limits, unlimited usage

class OllamaService {
  constructor() {
    this.isAvailable = true; // Always available (Ollama runs locally)
    console.log('✅ Ollama AI Service initialized (local AI via backend)');
  }

  // Helper: Clean JSON response
  cleanJson(text) {
    try {
      // Remove markdown code blocks
      const cleaned = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      // Try to extract JSON object if there's extra text
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return JSON.parse(cleaned);
    } catch (e) {
      console.warn('Failed to parse JSON:', e);
      return null;
    }
  }

  // Generate content from a prompt (used by Resume Builder)
  // Routes through backend → Ollama
  async generateContent(prompt, type = 'summary') {
    try {
      console.log(`🤖 Calling backend Ollama proxy (type=${type})...`);
      const API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000); // 120s timeout

      const resp = await fetch(`${API_BASE}/api/resume-builder/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ prompt, type }),
      });
      clearTimeout(timeout);

      if (resp.ok) {
        const data = await resp.json();

        // For JSON requests, return the raw text for client to parse
        if (type === 'json' && data.text) {
          console.log('✅ JSON content generated via Ollama');
          return data.text;
        }

        if (data.text) {
          const wordCount = data.text.split(/\s+/).filter(w => w.length > 0).length;
          console.log(`✅ Content generated via Ollama (${wordCount} words)`);
          return data.text;
        }
      }

      const errData = await resp.json().catch(() => ({}));
      console.error('❌ Ollama backend error:', resp.status, errData.error || '');
      throw new Error(errData.error || `AI generation failed (status ${resp.status})`);

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('AI request timed out. Please try again.');
      }
      console.error('❌ AI call failed:', error.message);
      throw error;
    }
  }

  // Check if service is available
  isServiceAvailable() {
    return this.isAvailable;
  }
}

const ollamaService = new OllamaService();
export default ollamaService;
