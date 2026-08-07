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
 * Validate LLM-generated filters against the original query
 * Removes filters that weren't mentioned in the query to prevent hallucination
 */
function validateFiltersAgainstQuery(filters, query) {
  const q = query.toLowerCase();
  const validated = { ...filters };

  // Keep name filter if any proper noun or name-like pattern is in query
  // (already extracted by LLM, just keep it)

  // Remove department if not mentioned
  if (validated.department && !new RegExp(`\\b${validated.department}\\b`, 'i').test(query)) {
    validated.department = '';
  }

  // Remove CGPA filters if not mentioned
  if (!/(cgpa|gpa)/i.test(q)) {
    validated.cgpaMin = null;
    validated.cgpaMax = null;
  }

  // Remove drive filters if not mentioned
  if (!/(drive|attendance|attended)/i.test(q)) {
    validated.driveCountMin = null;
    validated.driveCountMax = null;
    validated.companyName = '';
    validated.jobRole = '';
  }

  // Remove placement filters if not mentioned
  if (!/(placed|placement|unplaced)/i.test(q)) {
    validated.isPlaced = null;
    validated.placedCompany = '';
    validated.packageMin = null;
  }

  // Remove blocked filter if not mentioned
  if (!/blocked/i.test(q)) {
    validated.isBlocked = null;
  }

  // Remove skills filter if not mentioned
  if (!/(skill|know|proficient|python|java|react|javascript|c\+\+)/i.test(q)) {
    validated.skills = '';
  }

  // Remove year filter if not mentioned
  if (!/(year|first|second|third|fourth|final|1st|2nd|3rd|4th)/i.test(q)) {
    validated.currentYear = '';
  }

  // Remove batch filter if not mentioned
  if (!/\b20\d{2}[-–]20\d{2}\b/.test(query) && !/batch/i.test(q)) {
    validated.batch = '';
  }

  // Remove backlog filter if not mentioned
  if (!/(backlog|arrear)/i.test(q)) {
    validated.hasBacklogs = null;
  }

  return validated;
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

/**
 * AI-powered student database filter
 * Parses natural language queries into structured database filters
 * @param {string} prompt - Natural language query from admin
 * @returns {object} - Structured filter object with filters, columns, and reason
 */
async function parseStudentFilterQuery(prompt) {
  const systemPrompt = `CRITICAL: Output ONLY valid JSON. No text, no markdown, no explanations.

You are converting a natural language query about students into a JSON database filter.

STUDENT DATABASE FIELDS:
- name: student name (firstName, lastName) - use for name searches
- regNo: registration number (e.g., "73152313074")
- department/branch: CSE, ECE, MECH, CIVIL, EEE, IT, CSD
- batch: year range like "2023-2027"
- currentYear: I, II, III, IV (Roman numerals)
- overallCGPA: 0-10 scale
- skillSet: programming skills, technologies
- isBlocked: true/false
- driveCount: number of placement drives attended
- isPlaced: true if student got placed
- placedCompany: company name where placed
- package: salary package (LPA)

JSON OUTPUT FORMAT:
{"filters":{"name":"","regNo":"","department":"","branch":"","batch":"","section":"","currentYear":"","currentSemester":"","gender":"","city":"","cgpaMin":null,"cgpaMax":null,"tenthMin":null,"twelfthMin":null,"hasBacklogs":null,"skills":"","companyName":"","jobRole":"","isBlocked":null,"isPlaced":null,"placedCompany":"","packageMin":null,"driveCountMin":null,"driveCountMax":null,"sortBy":"regNo","sortOrder":"asc"},"columns":[],"reason":""}

PARSING RULES:
- Name search: "show me John Doe" → name: "John Doe"
- Name search: "find ashik" → name: "ashik"
- Name search: "Mohammed Ashik record" → name: "Mohammed Ashik"
- RegNo search: "73152313074" → regNo: "73152313074"
- CGPA filter: "CGPA above 8" → cgpaMin: 8
- Drive filter: "attended 3 drives" → driveCountMin: 3
- Placement: "placed students" → isPlaced: true
- Unplaced: "not placed" → isPlaced: false
- Company placed: "placed at TCS" → isPlaced: true, placedCompany: "TCS"
- Skills: "knows Python" → skills: "Python"
- Year: "final year" → currentYear: "IV"
- Blocked: "blocked students" → isBlocked: true

COLUMNS TO INCLUDE (based on what's being searched):
- For name/record queries: driveCount, lastDriveDate, placementStatus, placedCompany, package
- For drive queries: driveCount, lastDriveDate
- For placement queries: placementStatus, placedCompany, package
- For CGPA queries: cgpa
- For skills queries: skills

Query: "${prompt}"

JSON:`;

  // Try up to 3 times to get valid JSON
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await callOllama(systemPrompt, {
        temperature: attempt === 1 ? 0.1 : 0.05,
        max_tokens: 800,
      });

      const parsed = cleanJson(result);
      if (parsed && typeof parsed === 'object') {
        if (!parsed.filters) parsed.filters = {};
        if (!Array.isArray(parsed.columns)) parsed.columns = [];
        if (typeof parsed.reason !== 'string') parsed.reason = '';

        // IMPORTANT: Remove hallucinated filters not mentioned in the query
        parsed.filters = validateFiltersAgainstQuery(parsed.filters, prompt);

        // If it looks like a simple name search but LLM added too many filters, use fallback
        const isSimpleNameSearch = /^(show|find|get|search|display)\s+(me\s+)?[a-z]+(\s+[a-z]+)?\s*(record|details|info|profile|student|data)?$/i.test(prompt.trim());
        if (isSimpleNameSearch) {
          const filterCount = Object.values(parsed.filters).filter(v => v !== null && v !== '' && v !== 'regNo' && v !== 'asc').length;
          if (filterCount > 2) {
            // Too many filters for a simple name search, use fallback
            console.log('🔄 Simple name search detected, using fallback parser');
            return buildFallbackFilter(prompt);
          }
        }

        // Validate that at least something useful was parsed
        const hasFilter = Object.values(parsed.filters).some(v =>
          v !== null && v !== '' && v !== 'regNo' && v !== 'asc'
        );
        if (hasFilter || parsed.columns.length > 0) {
          return parsed;
        }
        console.warn(`⚠️ Attempt ${attempt}: Empty filters, retrying...`);
      } else {
        console.warn(`⚠️ Attempt ${attempt}: Invalid JSON structure, retrying...`);
      }
    } catch (error) {
      console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
    }
  }

  // If all attempts fail, use regex fallback
  console.log('🔄 Using regex fallback for query:', prompt);
  return buildFallbackFilter(prompt);
}

/**
 * Build a filter object using regex patterns when LLM fails
 */
function buildFallbackFilter(prompt) {
  const text = prompt.toLowerCase();
  const filters = {
    name: '', regNo: '', department: '', branch: '', batch: '', section: '',
    currentYear: '', currentSemester: '', gender: '', city: '',
    cgpaMin: null, cgpaMax: null, tenthMin: null, twelfthMin: null,
    hasBacklogs: null, skills: '', companyName: '', jobRole: '',
    isBlocked: null, isPlaced: null, placedCompany: '', packageMin: null,
    driveCountMin: null, driveCountMax: null, sortBy: 'regNo', sortOrder: 'asc',
  };
  const columns = [];

  // ===== NAME DETECTION (IMPORTANT) =====
  // Pattern 1: "show me [Name]", "find [Name]", "search [Name]"
  const nameMatch1 = prompt.match(/(?:show\s*(?:me)?|find|search|get|display)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
  // Pattern 2: "[Name] record/details/info/profile/student"
  const nameMatch2 = prompt.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:record|details|info|profile|student|data)/i);
  // Pattern 3: "student named [Name]" or "name [Name]"
  const nameMatch3 = prompt.match(/(?:student\s+)?(?:named?|called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
  // Pattern 4: Just names (capitalized words not matching keywords)
  const keywords = ['show', 'me', 'the', 'all', 'students', 'student', 'find', 'search', 'get', 'display', 'list', 'from', 'with', 'who', 'record', 'details', 'info', 'profile', 'data', 'cse', 'ece', 'mech', 'civil', 'eee', 'it', 'csd', 'placed', 'unplaced', 'blocked', 'drives', 'drive', 'cgpa', 'batch', 'year'];
  const words = prompt.split(/\s+/);
  const potentialNames = words.filter(w =>
    /^[A-Z][a-z]+$/.test(w) && !keywords.includes(w.toLowerCase())
  );

  if (nameMatch1) {
    filters.name = nameMatch1[1].trim();
  } else if (nameMatch2) {
    filters.name = nameMatch2[1].trim();
  } else if (nameMatch3) {
    filters.name = nameMatch3[1].trim();
  } else if (potentialNames.length > 0) {
    filters.name = potentialNames.join(' ');
  }

  // Add comprehensive columns for name searches
  if (filters.name) {
    columns.push('driveCount', 'lastDriveDate', 'placementStatus', 'placedCompany', 'package', 'skills');
  }

  // ===== REGISTRATION NUMBER DETECTION =====
  const regNoMatch = prompt.match(/\b(\d{11})\b/) || prompt.match(/reg(?:no|istration)?[:\s]*(\d+)/i);
  if (regNoMatch) {
    filters.regNo = regNoMatch[1];
    columns.push('driveCount', 'lastDriveDate', 'placementStatus', 'placedCompany', 'package');
  }

  // Department detection
  const deptMatch = prompt.match(/\b(CSE|ECE|MECH|CIVIL|EEE|IT|CSD)\b/i);
  if (deptMatch) filters.department = deptMatch[1].toUpperCase();

  // Batch detection
  const batchMatch = prompt.match(/\b(20\d{2})[-–](20\d{2})\b/);
  if (batchMatch) filters.batch = `${batchMatch[1]}-${batchMatch[2]}`;

  // Year detection
  if (/\b(final\s*year|4th\s*year|fourth\s*year)\b/i.test(text)) filters.currentYear = 'IV';
  else if (/\b(3rd\s*year|third\s*year)\b/i.test(text)) filters.currentYear = 'III';
  else if (/\b(2nd\s*year|second\s*year)\b/i.test(text)) filters.currentYear = 'II';
  else if (/\b(1st\s*year|first\s*year)\b/i.test(text)) filters.currentYear = 'I';

  // CGPA detection
  const cgpaMatch = text.match(/cgpa\s*(?:above|greater|>=?|more than|at least|minimum)\s*(\d+(?:\.\d+)?)/i) ||
                    text.match(/(?:above|greater|>=?|more than|at least)\s*(\d+(?:\.\d+)?)\s*cgpa/i);
  if (cgpaMatch) { filters.cgpaMin = parseFloat(cgpaMatch[1]); columns.push('cgpa'); }

  // Drive count detection
  const driveMatch = text.match(/(?:at least|minimum|more than|>=?)\s*(\d+)\s*(?:drives?|placement)/i) ||
                     text.match(/(\d+)\s*(?:or more|\+)\s*(?:drives?)/i) ||
                     text.match(/attended\s*(?:at least)?\s*(\d+)/i);
  if (driveMatch) { filters.driveCountMin = parseInt(driveMatch[1], 10); columns.push('driveCount', 'lastDriveDate'); }

  // Drive keywords
  if (/\b(drive|drives|attended|attendance)\b/i.test(text) && !columns.includes('driveCount')) {
    columns.push('driveCount', 'lastDriveDate');
  }

  // Company name for drives
  const companyDriveMatch = prompt.match(/(?:attended|for|from)\s+([A-Za-z0-9]+(?:\s+[A-Za-z0-9]+)?)\s+(?:company\s+)?drive/i);
  if (companyDriveMatch && !['the', 'a', 'at', 'least'].includes(companyDriveMatch[1].toLowerCase())) {
    filters.companyName = companyDriveMatch[1].trim();
  }

  // Placement status
  if (/\b(placed|placement)\b/i.test(text) && !/\b(not placed|unplaced)\b/i.test(text)) {
    filters.isPlaced = true;
    columns.push('placementStatus', 'placedCompany', 'package');
  }
  if (/\b(not placed|unplaced)\b/i.test(text)) {
    filters.isPlaced = false;
    columns.push('placementStatus', 'driveCount');
  }

  // Placed company
  const placedCoMatch = prompt.match(/placed\s+(?:at|in|by|from)\s+([A-Za-z0-9]+)/i);
  if (placedCoMatch && filters.isPlaced !== false) {
    const co = placedCoMatch[1].trim();
    if (!['students', 'who', 'are', 'the'].includes(co.toLowerCase())) {
      filters.placedCompany = co; filters.isPlaced = true;
      if (!columns.includes('placedCompany')) columns.push('placedCompany', 'package', 'placementStatus');
    }
  }

  // Blocked
  if (/\bblocked\b/i.test(text)) filters.isBlocked = true;

  // Skills
  const skillMatch = prompt.match(/(?:know|knows|skilled in|skills?|proficient|familiar with)\s+([A-Za-z0-9#+.]+)/i);
  if (skillMatch) { filters.skills = skillMatch[1].trim(); columns.push('skills'); }

  // Backlogs
  if (/\bbacklog|arrear\b/i.test(text)) {
    filters.hasBacklogs = /\b(no|without|zero|clear)\b/i.test(text) ? false : true;
    columns.push('backlogs');
  }

  // Sorting
  if (/sort.*(?:drives?|attendance)|(?:drives?)\s*desc/i.test(text)) { filters.sortBy = 'driveCount'; filters.sortOrder = 'desc'; }
  else if (/sort.*cgpa|cgpa\s*desc/i.test(text)) { filters.sortBy = 'cgpa'; filters.sortOrder = 'desc'; }

  return { filters, columns: [...new Set(columns)], reason: `Parsed: "${prompt.substring(0, 50)}..."` };
}

module.exports = {
  callOllama,
  cleanJson,
  analyzeResume,
  generateContent,
  analyzeATS,
  checkOllamaStatus,
  parseStudentFilterQuery,
  OLLAMA_URL,
  OLLAMA_MODEL,
};
