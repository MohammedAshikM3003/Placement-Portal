// Ollama AI Service for Resume Builder
// Routes all AI calls through the Node backend → Ollama (local)
// No API keys needed, no rate limits, unlimited usage

class OllamaService {
  constructor() {
    this.isAvailable = true; // Always available (Ollama runs locally)
    console.log('✅ Ollama AI Service initialized (local AI via backend)');
  }

  // Helper: Clean JSON response — handles common LLM JSON quirks
  cleanJson(text) {
    if (!text) return null;

    // Log raw AI output for debugging
    console.log('🔍 Raw AI response (first 500 chars):', text.substring(0, 500));

    // Step 1: Remove markdown code fences
    let cleaned = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Step 2: Extract JSON object
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    // Step 3: Try parsing as-is first
    try {
      return JSON.parse(cleaned);
    } catch (firstErr) {
      console.log('🔧 First parse failed, repairing JSON...', firstErr.message);

      // Step 4: Aggressive multi-pass repair
      let fixed = cleaned;

      // 4a: Remove comments
      fixed = fixed.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

      // 4b: Remove trailing commas
      fixed = fixed.replace(/,\s*([\]}])/g, '$1');

      // 4c: Remove control characters (keep newlines/tabs for structure)
      // eslint-disable-next-line no-control-regex
      fixed = fixed.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');

      // 4d: Rebuild JSON string by extracting key-value pairs manually
      // This handles cases where the LLM puts unescaped newlines, extra text, etc.
      try {
        return JSON.parse(fixed);
      } catch (secondErr) {
        console.log('🔧 Second parse failed, trying line-by-line rebuild...', secondErr.message);

        // 4e: Try to rebuild by joining lines and fixing string boundaries
        // Replace actual newlines inside string values with spaces
        // Strategy: walk through char by char tracking string state
        try {
          let result = '';
          let inString = false;
          let escaped = false;
          for (let i = 0; i < fixed.length; i++) {
            const ch = fixed[i];
            if (escaped) {
              result += ch;
              escaped = false;
              continue;
            }
            if (ch === '\\' && inString) {
              result += ch;
              escaped = true;
              continue;
            }
            if (ch === '"') {
              inString = !inString;
              result += ch;
              continue;
            }
            if (inString && (ch === '\n' || ch === '\r')) {
              result += ' '; // Replace newlines inside strings with spaces
              continue;
            }
            result += ch;
          }
          // Remove trailing commas again after rebuild
          result = result.replace(/,\s*([\]}])/g, '$1');
          return JSON.parse(result);
        } catch (thirdErr) {
          console.log('🔧 Char-by-char rebuild failed, trying field extraction...', thirdErr.message);
        }

        // Step 5: Last resort — extract individual fields via regex
        try {
          const result = {};
          const src = fixed.replace(/\n/g, ' ').replace(/\r/g, '');
          
          // Extract summary
          const summaryMatch = src.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          if (summaryMatch) result.summary = summaryMatch[1].replace(/\\"/g, '"').replace(/\\n/g, ' ');
          
          // Extract arrays
          const arrayFields = ['experiences', 'projects', 'certifications', 'achievements'];
          for (const field of arrayFields) {
            const arrMatch = src.match(new RegExp(`"${field}"\\s*:\\s*\\[([^\\]]*?)\\]`));
            if (arrMatch) {
              const strings = [];
              const strRegex = /"((?:[^"\\]|\\.)*)"/g;
              let m;
              while ((m = strRegex.exec(arrMatch[1])) !== null) {
                strings.push(m[1].replace(/\\"/g, '"').replace(/\\n/g, ' '));
              }
              if (strings.length) result[field] = strings;
            }
          }
          
          if (Object.keys(result).length > 0) {
            console.log('✅ Recovered partial JSON via field extraction:', Object.keys(result));
            return result;
          }
        } catch (extractErr) {
          console.warn('Field extraction also failed:', extractErr.message);
        }

        console.warn('❌ Failed to parse JSON after all repair attempts. Raw text:', cleaned.substring(0, 300));
        return null;
      }
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
