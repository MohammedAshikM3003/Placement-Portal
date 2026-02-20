/**
 * Ollama Integration Test Script
 * Tests: Resume AI generation, ATS analysis, resume analysis
 * Measures: Response time, output quality, JSON parsing reliability
 */

const {
  callOllama,
  cleanJson,
  analyzeResume,
  generateContent,
  analyzeATS,
  checkOllamaStatus,
  OLLAMA_URL,
  OLLAMA_MODEL,
} = require("./ollamaService");

// ─── Sample Resume for Testing ────────────────────────────
const SAMPLE_RESUME = `
RAHUL SHARMA
Email: rahul.sharma@email.com | Phone: +91-9876543210
LinkedIn: linkedin.com/in/rahulsharma | GitHub: github.com/rahulsharma

SUMMARY
Computer Science student with experience in web development and machine learning.
Looking for opportunities in software development.

EDUCATION
B.Tech in Computer Science and Engineering
XYZ Institute of Technology, Bangalore — CGPA: 8.5/10 (2021 – 2025)

SKILLS
Languages: Java, Python, JavaScript, C++
Frameworks: React, Node.js, Express, Django
Databases: MongoDB, MySQL, PostgreSQL
Tools: Git, Docker, AWS, Jenkins
ML: TensorFlow, Scikit-learn, Pandas, NumPy

EXPERIENCE
Software Development Intern — ABC Tech Solutions (May 2024 – Jul 2024)
- Worked on backend APIs using Node.js
- Helped with database queries
- Did some testing

PROJECTS
E-Commerce Platform
- Built a website using React and Node.js
- Added payment gateway
- Used MongoDB for data storage

ML-Based Attendance System
- Used face recognition to mark attendance
- Built with Python and OpenCV
- Achieved good accuracy

CERTIFICATIONS
- AWS Cloud Practitioner
- Google Data Analytics Certificate

ACHIEVEMENTS
- Won coding competition at college fest
- Published paper in IEEE conference
`;

// ─── Utility ──────────────────────────────────────────────
function elapsed(start) {
  return ((Date.now() - start) / 1000).toFixed(2) + "s";
}

function separator(title) {
  console.log("\n" + "═".repeat(60));
  console.log(`  ${title}`);
  console.log("═".repeat(60));
}

function printJSON(obj, maxLen = 300) {
  if (!obj) {
    console.log("  ❌ NULL (JSON parse failed)");
    return;
  }
  const str = JSON.stringify(obj, null, 2);
  if (str.length > maxLen) {
    console.log(str.substring(0, maxLen) + "\n  ... (truncated)");
  } else {
    console.log(str);
  }
}

// ─── Tests ────────────────────────────────────────────────

async function testOllamaStatus() {
  separator("TEST 1: Ollama Status Check");
  const start = Date.now();
  const status = await checkOllamaStatus();
  console.log(`  ⏱  Time: ${elapsed(start)}`);
  console.log(`  Running: ${status.running}`);
  console.log(`  Models: ${status.models.join(", ")}`);
  console.log(`  Has required model (${status.requiredModel}): ${status.hasRequiredModel}`);
  if (!status.running) {
    console.log("  ❌ FAIL — Ollama is not running!");
    process.exit(1);
  }
  if (!status.hasRequiredModel) {
    console.log(`  ❌ FAIL — Model ${status.requiredModel} not found! Run: ollama pull ${status.requiredModel}`);
    process.exit(1);
  }
  console.log("  ✅ PASS");
  return true;
}

async function testBasicGeneration() {
  separator("TEST 2: Basic Text Generation (warm-up)");
  const prompt = "Write a one-line professional summary for a software developer with 2 years of experience in React and Node.js.";
  const start = Date.now();
  const result = await callOllama(prompt, { max_tokens: 200 });
  const time = elapsed(start);
  console.log(`  ⏱  Time: ${time}`);
  console.log(`  Output length: ${result.length} chars`);
  console.log(`  Response: ${result.substring(0, 200)}`);
  console.log(result.length > 10 ? "  ✅ PASS" : "  ❌ FAIL — Response too short");
  return { time, length: result.length };
}

async function testResumeContentGeneration() {
  separator("TEST 3: Resume Content Generation (Summary)");
  const prompt = `Generate a professional summary for a resume with these details:
- Name: Rahul Sharma
- Role: Full Stack Developer
- Experience: 2 years
- Skills: React, Node.js, Python, MongoDB, AWS
- Focus: Building scalable web applications

Write 3-4 sentences that are ATS-friendly and highlight key technical skills.`;

  const start = Date.now();
  const result = await generateContent(prompt, "summary");
  const time = elapsed(start);
  console.log(`  ⏱  Time: ${time}`);
  console.log(`  Output length: ${result.length} chars`);
  console.log(`  Response:\n  ${result.substring(0, 500)}`);

  const hasKeywords = ["React", "Node", "AWS", "Full Stack"].some((k) =>
    result.toLowerCase().includes(k.toLowerCase())
  );
  console.log(`  Keywords present: ${hasKeywords}`);
  console.log(hasKeywords ? "  ✅ PASS" : "  ⚠️  WARN — Expected keywords missing");
  return { time, length: result.length, hasKeywords };
}

async function testResumeJSONGeneration() {
  separator("TEST 4: Resume JSON Generation (Experience Bullets)");
  const prompt = `Generate 4 improved bullet points for this work experience, as a JSON array of strings:

Role: Software Development Intern at ABC Tech Solutions
Original bullets:
- Worked on backend APIs using Node.js
- Helped with database queries
- Did some testing

Return ONLY a JSON array like: ["bullet1", "bullet2", "bullet3", "bullet4"]
Use strong action verbs, quantify impact where possible.`;

  const start = Date.now();
  const result = await generateContent(prompt, "json");
  const time = elapsed(start);
  console.log(`  ⏱  Time: ${time}`);
  console.log(`  Raw output length: ${result.length} chars`);

  // Try to parse the JSON
  let parsed = null;
  try {
    let cleaned = result.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const arrMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrMatch) cleaned = arrMatch[0];
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.log(`  ⚠️  JSON parse error: ${e.message}`);
  }

  if (parsed && Array.isArray(parsed)) {
    console.log(`  Parsed ${parsed.length} bullets:`);
    parsed.forEach((b, i) => console.log(`    ${i + 1}. ${b.substring(0, 120)}`));
    console.log("  ✅ PASS — Valid JSON array");
  } else {
    console.log(`  Raw: ${result.substring(0, 300)}`);
    console.log("  ❌ FAIL — Could not parse JSON array");
  }
  return { time, parsed };
}

async function testATSAnalysis() {
  separator("TEST 5: ATS Resume Analysis");
  const start = Date.now();
  const result = await analyzeATS(SAMPLE_RESUME);
  const time = elapsed(start);
  console.log(`  ⏱  Time: ${time}`);

  if (!result) {
    console.log("  ❌ FAIL — No JSON result returned (parse failed)");
    return { time, pass: false };
  }

  const expectedKeys = [
    "atsParseRate",
    "quantifyingImpact",
    "repetition",
    "spellingGrammar",
    "contentIssues",
    "formatIssues",
    "styleIssues",
    "sectionIssues",
    "skillsIssues",
    "strengths",
    "criticalFixes",
    "overallTips",
  ];

  const presentKeys = expectedKeys.filter((k) => result[k] !== undefined);
  const missingKeys = expectedKeys.filter((k) => result[k] === undefined);

  console.log(`  Keys present: ${presentKeys.length}/${expectedKeys.length}`);
  if (missingKeys.length > 0) {
    console.log(`  Missing keys: ${missingKeys.join(", ")}`);
  }

  // Print scores
  console.log(`\n  📊 ATS Scores:`);
  console.log(`    ATS Parse Rate:     ${result.atsParseRate ?? "N/A"}%`);
  console.log(`    Quantifying Impact: ${result.quantifyingImpact ?? "N/A"}%`);
  console.log(`    Repetition:         ${result.repetition ?? "N/A"}%`);
  console.log(`    Spelling & Grammar: ${result.spellingGrammar ?? "N/A"}%`);

  // Print issues
  if (result.contentIssues?.length) {
    console.log(`\n  📝 Content Issues:`);
    result.contentIssues.slice(0, 3).forEach((i) => console.log(`    - ${i}`));
  }
  if (result.strengths?.length) {
    console.log(`\n  💪 Strengths:`);
    result.strengths.slice(0, 3).forEach((s) => console.log(`    - ${s}`));
  }
  if (result.criticalFixes?.length) {
    console.log(`\n  🔧 Critical Fixes:`);
    result.criticalFixes.slice(0, 3).forEach((f) => console.log(`    - ${f}`));
  }

  const pass = presentKeys.length >= 8;
  console.log(pass ? "\n  ✅ PASS" : "\n  ⚠️  PARTIAL — Some keys missing");
  return { time, pass, scores: { atsParseRate: result.atsParseRate, quantifyingImpact: result.quantifyingImpact, spellingGrammar: result.spellingGrammar } };
}

async function testFullResumeAnalysis() {
  separator("TEST 6: Full Resume Analysis & Improvement");
  const start = Date.now();
  const result = await analyzeResume(SAMPLE_RESUME, "Full Stack Developer");
  const time = elapsed(start);
  console.log(`  ⏱  Time: ${time}`);

  if (!result) {
    console.log("  ❌ FAIL — No JSON result returned (parse failed)");
    return { time, pass: false };
  }

  const expectedKeys = [
    "improved_resume",
    "ats_score",
    "keyword_match_score",
    "grammar_score",
    "missing_keywords",
    "suggestions",
  ];

  const presentKeys = expectedKeys.filter((k) => result[k] !== undefined);
  const missingKeys = expectedKeys.filter((k) => result[k] === undefined);

  console.log(`  Keys present: ${presentKeys.length}/${expectedKeys.length}`);
  if (missingKeys.length) console.log(`  Missing keys: ${missingKeys.join(", ")}`);

  console.log(`\n  📊 Scores:`);
  console.log(`    ATS Score:           ${result.ats_score ?? "N/A"}`);
  console.log(`    Keyword Match Score: ${result.keyword_match_score ?? "N/A"}`);
  console.log(`    Grammar Score:       ${result.grammar_score ?? "N/A"}`);

  if (result.missing_keywords?.length) {
    console.log(`\n  🔑 Missing Keywords: ${result.missing_keywords.slice(0, 8).join(", ")}`);
  }
  if (result.suggestions?.length) {
    console.log(`\n  💡 Suggestions:`);
    result.suggestions.slice(0, 4).forEach((s) => console.log(`    - ${s}`));
  }
  if (result.improved_resume) {
    console.log(`\n  📄 Improved Resume (first 300 chars):`);
    console.log(`    ${result.improved_resume.substring(0, 300)}...`);
  }

  const pass = presentKeys.length >= 4;
  console.log(pass ? "\n  ✅ PASS" : "\n  ⚠️  PARTIAL — Some keys missing");
  return { time, pass };
}

// ─── Performance Benchmark ───────────────────────────────

async function benchmarkPerformance() {
  separator("BENCHMARK: Multiple Generations (3 rounds)");
  const prompts = [
    "Write 2 ATS-friendly bullet points for a React developer who built a dashboard.",
    "Write a short professional summary for a data science intern.",
    "List 5 technical skills relevant for a DevOps engineer role.",
  ];

  const times = [];
  for (let i = 0; i < prompts.length; i++) {
    const start = Date.now();
    const result = await callOllama(prompts[i], { max_tokens: 300 });
    const ms = Date.now() - start;
    times.push(ms);
    console.log(`  Round ${i + 1}: ${(ms / 1000).toFixed(2)}s (${result.length} chars)`);
  }

  const avg = (times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(2);
  const min = (Math.min(...times) / 1000).toFixed(2);
  const max = (Math.max(...times) / 1000).toFixed(2);

  console.log(`\n  📊 Performance Summary:`);
  console.log(`    Average: ${avg}s`);
  console.log(`    Min:     ${min}s`);
  console.log(`    Max:     ${max}s`);

  return { avg, min, max };
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  console.log("\n╔══════════════════════════════════════════════════════════╗");
  console.log("║        OLLAMA RESUME AI — FULL TEST SUITE               ║");
  console.log(`║  Model: ${OLLAMA_MODEL.padEnd(20)} URL: ${OLLAMA_URL.padEnd(20)}  ║`);
  console.log("╚══════════════════════════════════════════════════════════╝");

  const results = {};
  const totalStart = Date.now();

  try {
    // 1. Status check
    await testOllamaStatus();

    // 2. Basic generation
    results.basic = await testBasicGeneration();

    // 3. Resume content
    results.content = await testResumeContentGeneration();

    // 4. JSON generation
    results.json = await testResumeJSONGeneration();

    // 5. ATS analysis
    results.ats = await testATSAnalysis();

    // 6. Full resume analysis
    results.resume = await testFullResumeAnalysis();

    // 7. Performance benchmark
    results.benchmark = await benchmarkPerformance();

  } catch (error) {
    console.error("\n  ❌ FATAL ERROR:", error.message);
  }

  // ─── Final Report ────────────────────────────────────
  const totalTime = elapsed(totalStart);
  separator("FINAL REPORT");
  console.log(`  Total execution time: ${totalTime}`);
  console.log(`  Model: ${OLLAMA_MODEL}`);
  console.log(`  URL: ${OLLAMA_URL}`);
  console.log("");

  console.log("  ┌──────────────────────────────┬───────────┐");
  console.log("  │ Test                         │ Time      │");
  console.log("  ├──────────────────────────────┼───────────┤");
  if (results.basic) console.log(`  │ Basic Generation              │ ${results.basic.time.padStart(9)} │`);
  if (results.content) console.log(`  │ Resume Content (Summary)     │ ${results.content.time.padStart(9)} │`);
  if (results.json) console.log(`  │ JSON Generation (Bullets)    │ ${results.json.time.padStart(9)} │`);
  if (results.ats) console.log(`  │ ATS Analysis                 │ ${results.ats.time.padStart(9)} │`);
  if (results.resume) console.log(`  │ Full Resume Analysis         │ ${results.resume.time.padStart(9)} │`);
  if (results.benchmark) console.log(`  │ Benchmark (avg of 3)        │ ${(results.benchmark.avg + "s").padStart(9)} │`);
  console.log("  └──────────────────────────────┴───────────┘");

  if (results.benchmark) {
    console.log(`\n  ⚡ Performance Rating:`);
    const avgSec = parseFloat(results.benchmark.avg);
    if (avgSec < 5) console.log("    🟢 EXCELLENT — Under 5s average");
    else if (avgSec < 15) console.log("    🟡 GOOD — Under 15s average");
    else if (avgSec < 30) console.log("    🟠 ACCEPTABLE — Under 30s average");
    else console.log("    🔴 SLOW — Over 30s average. Consider a smaller model or GPU acceleration.");
  }

  console.log("\n  Done! ✅\n");
}

main();
