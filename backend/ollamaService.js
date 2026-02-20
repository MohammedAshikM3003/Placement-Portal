// Ollama Local AI Service
// Replaces OpenAI and Gemini — runs fully locally via Ollama
// No API keys, no rate limits, unlimited usage

const axios = require("axios");

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3:8b";

/**
 * Call Ollama local AI model
 * @param {string} prompt - The prompt to send
 * @param {object} options - Optional generation parameters
 * @returns {string} - The generated text response
 */
async function callOllama(prompt, options = {}) {
  try {
    const response = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.4,
          top_p: options.top_p ?? 0.9,
          num_predict: options.max_tokens ?? 2000,
        },
      },
      {
        timeout: options.timeout ?? 120000, // 2 minute timeout default
        headers: { 'ngrok-skip-browser-warning': 'true' },
      }
    );

    return response.data.response;
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      console.error("❌ Ollama is not running. Start it with: ollama serve");
      throw new Error(
        "Ollama is not running. Please start Ollama on your machine."
      );
    }
    console.error("❌ Ollama error:", error.message);
    throw new Error("AI generation failed: " + error.message);
  }
}

/**
 * Clean JSON from Ollama response (strips markdown code blocks, extra text)
 */
function cleanJson(text) {
  try {
    // Remove markdown code blocks
    let cleaned = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    // Try to extract JSON object if there's extra text around it
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    // First attempt — direct parse
    try {
      return JSON.parse(cleaned);
    } catch (_) {
      // Fall through to repair
    }

    // Repair: fix control characters inside JSON string values
    // Replace raw newlines/tabs inside strings with escaped versions
    cleaned = cleaned.replace(
      /"([^"\\]*(?:\\.[^"\\]*)*)"|([^"]+)/gs,
      (match, strContent, nonStr) => {
        if (strContent !== undefined) {
          // Inside a quoted string — escape raw control chars
          const fixed = strContent
            .replace(/\r\n/g, "\\n")
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\n")
            .replace(/\t/g, "\\t");
          return `"${fixed}"`;
        }
        return match; // outside quotes — leave as-is
      }
    );

    try {
      return JSON.parse(cleaned);
    } catch (_) {
      // Fall through to last resort
    }

    // Last resort — aggressive cleanup: replace ALL unescaped newlines
    cleaned = cleaned.replace(/(?<=:\s*"[^"]*)\n/g, "\\n");
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("⚠️ Failed to parse JSON from Ollama:", e.message);
    console.warn("Raw response:", text.substring(0, 500));
    return null;
  }
}

/**
 * Analyze resume text and return structured JSON analysis
 */
async function analyzeResume(text, jobRole = "Software Developer") {
  const prompt = `You are an expert ATS Resume Writer and Technical Recruiter.

Analyze and improve the resume for the job role: ${jobRole}

Rules:
- Fix grammar completely
- Improve keywords for ATS
- Keep resume 1–2 pages
- Improve summary and projects
- Make it ATS friendly

CRITICAL: Return ONLY valid JSON. No extra text before or after. No markdown.
CRITICAL: Inside JSON string values, use \\n for newlines, never raw line breaks. All text must be on ONE line per string value.

{
  "improved_resume": "RAHUL SHARMA\\nEmail: ...\\nSUMMARY\\nResults-driven developer...",
  "ats_score": 75,
  "keyword_match_score": 70,
  "grammar_score": 85,
  "missing_keywords": ["keyword1", "keyword2"],
  "suggestions": ["suggestion1", "suggestion2"]
}

Resume:
${text.substring(0, 4000)}`;

  const result = await callOllama(prompt, { temperature: 0.3 });
  return cleanJson(result);
}

/**
 * Generate content for resume builder (summary, experience descriptions, etc.)
 */
async function generateContent(prompt, type = "summary") {
  const systemPrompt =
    "You are an expert Technical Recruiter and Professional Resume Writer specializing in the software engineering industry. Use strong action verbs and a confident, professional tone. Emphasize technical implementation and project impact. Ensure all output is ATS-friendly with industry-specific keywords. ALWAYS generate complete, detailed responses.";

  const fullPrompt = `${systemPrompt}\n\n${prompt}${
    type === "json"
      ? "\n\nIMPORTANT: Return ONLY valid JSON, no markdown code blocks, no extra text."
      : ""
  }`;

  const result = await callOllama(fullPrompt, {
    temperature: 0.7,
    max_tokens: type === "json" ? 4096 : 1024,
  });

  return result;
}

/**
 * ATS analysis using Ollama
 */
async function analyzeATS(resumeText) {
  const prompt = `You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze this resume and return a JSON object with EXACTLY this structure (no markdown, no code blocks, pure JSON only):
{
  "atsParseRate": 75,
  "quantifyingImpact": 60,
  "repetition": 80,
  "spellingGrammar": 90,
  "contentIssues": ["issue1", "issue2"],
  "formatIssues": ["issue1", "issue2"],
  "styleIssues": ["issue1", "issue2"],
  "sectionIssues": ["issue1", "issue2"],
  "skillsIssues": ["issue1", "issue2"],
  "strengths": ["strength1", "strength2"],
  "criticalFixes": ["fix1", "fix2"],
  "overallTips": ["tip1", "tip2"]
}

Evaluate:
- ATS Parse Rate: Can ATS software correctly parse all sections?
- Quantifying Impact: Does the resume use numbers, percentages, metrics?
- Repetition: Are there repeated phrases or redundant information?
- Spelling & Grammar: Any errors?
- Content: Quality and relevance of descriptions, action verbs
- Format & Brevity: Appropriate length, concise bullet points
- Style: Consistent tense, professional tone, active voice
- Sections: Are standard sections present (Contact, Education, Experience, Skills, Projects)?
- Skills: Are skills relevant and properly categorized?

Resume:
${resumeText.substring(0, 4000)}`;

  const result = await callOllama(prompt, { temperature: 0.3 });
  return cleanJson(result);
}

/**
 * Check if Ollama is running and the model is available
 */
async function checkOllamaStatus() {
  try {
    const response = await axios.get(`${OLLAMA_URL}/api/tags`, {
      timeout: 5000,
      headers: { 'ngrok-skip-browser-warning': 'true' },
    });
    const models = response.data.models || [];
    const hasModel = models.some((m) => m.name.startsWith(OLLAMA_MODEL.split(":")[0]));
    return {
      running: true,
      models: models.map((m) => m.name),
      hasRequiredModel: hasModel,
      requiredModel: OLLAMA_MODEL,
    };
  } catch (error) {
    return {
      running: false,
      models: [],
      hasRequiredModel: false,
      requiredModel: OLLAMA_MODEL,
      error: error.message,
    };
  }
}

module.exports = {
  callOllama,
  cleanJson,
  analyzeResume,
  generateContent,
  analyzeATS,
  checkOllamaStatus,
  OLLAMA_URL,
  OLLAMA_MODEL,
};
