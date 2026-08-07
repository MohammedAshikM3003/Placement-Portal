// Local AI bridge for Resume Builder
// Routes AI calls through the Node backend -> local AI service
// No API keys needed for local rule-based service

import { joinApiUrl } from '../utils/apiConfig';

class AiService {
  constructor() {
    this.isAvailable = true; // Assume local AI service is available
    console.log('✅ Local AI service bridge initialized');
  }

  cleanJson(text) {
    if (!text) return null;

    console.log('🔍 Raw AI response (first 500 chars):', text.substring(0, 500));

    let cleaned = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) cleaned = jsonMatch[0];

    try {
      return JSON.parse(cleaned);
    } catch (firstErr) {
      console.log('🔧 First parse failed, repairing JSON...', firstErr.message);

      let fixed = cleaned;
      fixed = fixed.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
      fixed = fixed.replace(/,\s*([\]}])/g, '$1');
      // eslint-disable-next-line no-control-regex
      fixed = fixed.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');

      try {
        return JSON.parse(fixed);
      } catch (secondErr) {
        console.log('🔧 Second parse failed, trying line-by-line rebuild...', secondErr.message);

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
              result += ' ';
              continue;
            }
            result += ch;
          }
          result = result.replace(/,\s*([\]}])/g, '$1');
          return JSON.parse(result);
        } catch (thirdErr) {
          console.log('🔧 Char-by-char rebuild failed, trying field extraction...', thirdErr.message);
        }

        try {
          const result = {};
          const src = fixed.replace(/\n/g, ' ').replace(/\r/g, '');
          const summaryMatch = src.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
          if (summaryMatch) result.summary = summaryMatch[1].replace(/\\"/g, '"').replace(/\\n/g, ' ');

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

  async generateContent(prompt, type = 'summary') {
    try {
      console.log(`🤖 Calling backend AI proxy (type=${type})...`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 120000);

      if (type === 'json') {
        const resp = await fetch(joinApiUrl('/ai/resume/enhance-batch'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ sections: prompt && typeof prompt === 'object' ? prompt : {} }),
        });
        clearTimeout(timeout);
        if (resp.ok) {
          const data = await resp.json();
          console.log('✅ Batch AI content generated via AI service');
          return JSON.stringify(data);
        }
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `AI generation failed (status ${resp.status})`);
      }

      const resp = await fetch(joinApiUrl('/ai/resume/enhance'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ text: prompt }),
      });
      clearTimeout(timeout);

      if (resp.ok) {
        const data = await resp.json();
        if (data.enhanced) return data.enhanced;
        if (data.corrected) return data.corrected;
        if (typeof data === 'string') return data;
      }

      const errData = await resp.json().catch(() => ({}));
      console.error('❌ AI backend error:', resp.status, errData.error || '');
      throw new Error(errData.error || `AI generation failed (status ${resp.status})`);
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('AI request timed out. Please try again.');
      }
      console.error('❌ AI call failed:', error.message);
      throw error;
    }
  }

  isServiceAvailable() {
    return this.isAvailable;
  }
}

const aiService = new AiService();
export default aiService;