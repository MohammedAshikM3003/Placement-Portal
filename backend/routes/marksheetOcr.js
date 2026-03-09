/**
 * Marksheet Parse Routes — PDF text extraction + Ollama Vision OCR
 * ----------------------------------------------------------------
 * POST /parse  — Upload PDF/image, extract text (pdf-parse or Ollama vision model)
 * 
 * Supports both digitally-generated PDFs and scanned/photo marksheets.
 * Uses Ollama vision models (minicpm-v / qwen2-vl / llava) for scanned documents.
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_VISION_MODEL = process.env.OLLAMA_VISION_MODEL || 'minicpm-v';

// Multer: store file in memory (max 5MB for marksheet PDFs)
const ALLOWED_MIMES = ['application/pdf'];
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_MIMES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are supported. Please upload your marksheet as a PDF.'));
        }
    }
});

// ─────────────────────────────────────────────────────────
// Document Type Detection
// ─────────────────────────────────────────────────────────

const RESULT_SHEET_KEYWORDS = [
    'UG & PG END SEMESTER',
    'END SEMESTER EXAMINATION',
    'PROVISIONAL RESULT',
    'EXAM RESULT',
    'RESULT SHEET',
    'SEMESTER EXAMINATION RESULT',
];

const ORIGINAL_MARKSHEET_KEYWORDS = [
    'GRADE SHEET',
    'STATEMENT OF MARKS',
    'CHOICE BASED CREDIT SYSTEM',
    'CONSOLIDATED GRADE',
    'ORIGINAL MARKSHEET',
    'TRANSCRIPT',
];

function detectDocumentType(text) {
    const upper = text.toUpperCase();
    for (const kw of ORIGINAL_MARKSHEET_KEYWORDS) {
        if (upper.includes(kw)) return 'original_marksheet';
    }
    for (const kw of RESULT_SHEET_KEYWORDS) {
        if (upper.includes(kw)) return 'result_sheet';
    }
    return 'unknown';
}

// ─────────────────────────────────────────────────────────
// Student Info Extraction (regex-based)
// ─────────────────────────────────────────────────────────

function extractStudentInfo(text) {
    const info = {};
    const upper = text.toUpperCase();

    // Name
    const namePatterns = [
        /NAME\s*(?:OF\s*(?:THE\s*)?CANDIDATE)?\s*[:;\-.\u2013]\s*([A-Z][A-Z\s.]+)/i,
        /STUDENT\s*NAME\s*[:;\-.\u2013]\s*([A-Z][A-Z\s.]+)/i,
        /NAME\s*[:;\-.\u2013]\s*([A-Z][A-Z\s.]+)/i,
    ];
    const NAME_STOP_WORDS = /\b(PROGRAMME|BRANCH|REGISTER|REG\s*NO|DATE|DOB|SEMESTER|YEAR|DEGREE|REGULATION|EXAM|RESULT|CREDIT|SUBJECT|COURSE|SGPA|CGPA|GPA)\b/i;
    for (const pat of namePatterns) {
        const m = upper.match(pat);
        if (m) {
            let name = m[1].trim().replace(/\d+$/, '').replace(/[:;]+$/, '').trim();
            // Stop at known keywords that may follow the name on the same line
            const stopMatch = name.match(NAME_STOP_WORDS);
            if (stopMatch) {
                name = name.substring(0, stopMatch.index).trim();
            }
            if (name) {
                info.name = name.split(/\s+/).map(w =>
                    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
                ).join(' ');
            }
            break;
        }
    }

    // Register Number
    const regPatterns = [
        /REG(?:ISTER)?\s*(?:NO|NUMBER|NUM)\.?\s*[:;.\u2013-]?\s*(\d{8,15})/i,
        /REGISTER\s*NUMBER\s*[:;.\u2013-]?\s*(\d{8,15})/i,
    ];
    for (const pat of regPatterns) {
        const m = text.match(pat);
        if (m) { info.register_number = m[1].trim(); break; }
    }
    if (!info.register_number) {
        const fallback = text.match(/\b(\d{11,13})\b/);
        if (fallback) info.register_number = fallback[1];
    }

    // Date of Birth
    const dobPatterns = [
        /D(?:ATE)?\s*(?:OF)?\s*B(?:IRTH)?\s*[:;.\u2013-]?\s*(\d{2}[/.-]\d{2}[/.-]\d{4})/i,
        /DOB\s*[:;.\u2013-]?\s*(\d{2}[/.-]\d{2}[/.-]\d{4})/i,
        /D\s*O\s*B\s*[:;.\u2013-]?\s*(\d{2}[/.-]\d{2}[/.-]\d{4})/i,
    ];
    for (const pat of dobPatterns) {
        const m = text.match(pat);
        if (m) { info.date_of_birth = m[1].trim(); break; }
    }

    // Programme / Branch
    const progPatterns = [
        /PROGRAMME\s*[:;.\u2013-]?\s*(.+?)(?:\n|$)/i,
        /BRANCH\s*[:;.\u2013-]?\s*(.+?)(?:\n|$)/i,
        /DEGREE\s*[:;.\u2013-]?\s*(.+?)(?:\n|$)/i,
        /(B\.?E\.?\s*[\u2013-]?\s*(?:COMPUTER\s*SCIENCE|CSE|ECE|EEE|MECH|CIVIL|IT)[^\n]*)/i,
    ];
    for (const pat of progPatterns) {
        const m = text.match(pat);
        if (m) {
            info.programme = m[1].trim().replace(/\s+/g, ' ');
            break;
        }
    }

    // Semester
    const romanMap = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8 };
    const semMatch = text.match(/SEMESTER\s*[:;.\u2013-]?\s*(\d+|[IVX]+)/i);
    if (semMatch) {
        const val = semMatch[1].trim();
        info.semester = romanMap[val] || (isNaN(val) ? val : parseInt(val));
    }

    // Year
    const yearMatch = text.match(/\bYEAR\s*[:;.\u2013-]?\s*(\d+|[IVX]+)/i);
    if (yearMatch) {
        const val = yearMatch[1].trim();
        const yearRoman = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4 };
        info.year = yearRoman[val] || (isNaN(val) ? val : parseInt(val));
    }

    // Exam Month/Year
    const examPatterns = [
        /EXAM\s*(?:MONTH|MM)\s*[/]?\s*(?:YEAR|YY)\s*[:;.\u2013-]?\s*([A-Z]+\s*\d{4})/i,
        /((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\w*\s*[/-]?\s*\d{4})/i,
    ];
    for (const pat of examPatterns) {
        const m = text.match(pat);
        if (m) { info.exam_month_year = m[1].trim(); break; }
    }

    // Regulation
    const regRegMatch = text.match(/REGULATION\s*[:;.\u2013-]?\s*(\d{4})/i);
    if (regRegMatch) info.regulation = regRegMatch[1];

    // SGPA / GPA
    const sgpaMatch = text.match(/(?:SGPA|GPA|CURRENT\s*SGPA)\s*[:;.\u2013-]?\s*(\d+\.?\d*)/i);
    if (sgpaMatch) info.sgpa = sgpaMatch[1];

    // CGPA
    const cgpaMatch = text.match(/(?:CGPA|OVERALL\s*CGPA|CUMULATIVE\s*GPA)\s*[:;.\u2013-]?\s*(\d+\.?\d*)/i);
    if (cgpaMatch) info.cgpa = cgpaMatch[1];

    // Credits
    const attemptedMatch = text.match(/(?:CREDITS?\s*REGISTERED|ATTEMPTED)\s*[:;.\u2013-]?\s*(\d+)/i);
    if (attemptedMatch) info.credits_attempted = attemptedMatch[1];

    const earnedMatch = text.match(/(?:CREDITS?\s*EARNED|CLEARED)\s*[:;.\u2013-]?\s*(\d+)/i);
    if (earnedMatch) info.credits_earned = earnedMatch[1];

    const pendingMatch = text.match(/PENDING\s*[:;.\u2013-]?\s*(\d+)/i);
    if (pendingMatch) info.credits_pending = pendingMatch[1];

    // Published date
    const pubMatch = text.match(/PUBLISHED\s*[:;.\u2013-]?\s*(\d{2}[/.-]\d{2}[/.-]\d{4})/i);
    if (pubMatch) info.published_date = pubMatch[1];

    return info;
}

// ─────────────────────────────────────────────────────────
// Grade Normalization
// ─────────────────────────────────────────────────────────

const VALID_GRADES = ['O', 'A+', 'A', 'B+', 'B', 'C', 'U', 'S', 'AB', 'RA', 'SA', 'W'];

// OCR often misreads '+' as '-'. Since A- and B- don't exist in this grading system, fix them.
const GRADE_CORRECTIONS = { 'A-': 'A+', 'B-': 'B+' };

// Grade to grade-point mapping (K.S.R. College grading system)
const GRADE_POINTS = {
    'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6,
    'C': 5, 'U': 0, 'RA': 0, 'AB': 0, 'SA': 0, 'W': 0,
};

function normalizeGrade(grade) {
    if (!grade) return '';
    const upper = grade.trim().toUpperCase();
    return GRADE_CORRECTIONS[upper] || upper;
}

/**
 * Calculate SGPA from subjects when not available in the marksheet.
 * Uses equal weight (1 credit each) when credit info is not available.
 * Formula: SGPA = Σ(Ci × GPi) / Σ(Ci)
 */
function calculateSGPA(subjects) {
    if (!subjects || subjects.length === 0) return null;
    const validSubjects = subjects.filter(s => {
        const grade = (s.grade || '').toUpperCase();
        return grade && grade in GRADE_POINTS && (s.result === 'P' || s.result === 'PASS');
    });
    if (validSubjects.length === 0) return null;

    let totalCredits = 0;
    let totalGradePoints = 0;
    for (const s of validSubjects) {
        const credit = parseFloat(s.credit) || 1; // default 1 credit if not available
        const gp = GRADE_POINTS[(s.grade || '').toUpperCase()] || 0;
        totalCredits += credit;
        totalGradePoints += credit * gp;
    }
    if (totalCredits === 0) return null;
    return (totalGradePoints / totalCredits).toFixed(3);
}

// ─────────────────────────────────────────────────────────
// Subject Table Extraction
// ─────────────────────────────────────────────────────────

function extractSubjects(text) {
    const subjects = [];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Course code pattern (e.g. 20CS511, CS8691, MA8551, OCS552)
    const courseCodeRe = /(\d{2}[A-Z]{2,4}\d{2,4}|[A-Z]{2,4}\d{3,5})/;
    // Valid grade tokens — sorted longest first so A+ matches before A
    const GRADES = ['A+', 'A-', 'B+', 'B-', 'AB', 'RA', 'SA', 'O', 'A', 'B', 'C', 'U', 'S', 'W'];
    const escapedGrades = GRADES.map(g => g.replace(/[+]/g, '\\+').replace(/[-]/g, '\\-'));
    // Result at end of string
    const resultEndRe = /(PASS|FAIL|P|F)\s*$/i;
    // Grade at end (after removing result) — with word boundary
    const gradeEndRe = new RegExp('\\b(' + escapedGrades.join('|') + ')\\s*$');
    // Grade at end without word boundary — for when grade is concatenated to course name
    const gradeEndNoWbRe = new RegExp('(' + escapedGrades.join('|') + ')\\s*$');

    let snoCounter = 1;

    for (const line of lines) {
        const codeMatch = line.match(courseCodeRe);
        if (!codeMatch) continue;

        const courseCode = codeMatch[1];
        const codeEnd = codeMatch.index + codeMatch[0].length;

        // Everything before the course code
        const before = line.substring(0, codeMatch.index);
        // Everything after the course code
        let after = line.substring(codeEnd);

        // --- Extract Semester from 'before' ---
        let semester = null;
        const beforeDigits = before.replace(/\s/g, '');
        if (beforeDigits.length >= 1) {
            const lastDigit = beforeDigits.charAt(beforeDigits.length - 1);
            if (lastDigit >= '1' && lastDigit <= '8') {
                semester = parseInt(lastDigit);
            }
        }
        // Fallback: derive semester from course code (e.g. 20CS5xx → semester 5)
        if (!semester) {
            const codeDigitsAfterLetters = courseCode.match(/[A-Z]+(\d)/);
            if (codeDigitsAfterLetters) {
                const d = codeDigitsAfterLetters[1];
                if (d >= '1' && d <= '8') semester = parseInt(d);
            }
        }

        // --- Extract Result from the end ---
        let result = null;
        const resultMatch = after.match(resultEndRe);
        if (resultMatch) {
            result = resultMatch[1].toUpperCase();
            if (result === 'PASS') result = 'P';
            if (result === 'FAIL') result = 'F';
            after = after.substring(0, resultMatch.index).trimEnd();
        }

        // --- Extract Grade ---
        let grade = null;

        // Strategy 1: grade at end of line (after removing result)
        const gradeMatchEnd = after.match(gradeEndRe);
        if (gradeMatchEnd) {
            grade = gradeMatchEnd[1];
            after = after.substring(0, gradeMatchEnd.index).trimEnd();
        }

        // Strategy 2: if nothing at end, look for a standalone grade token anywhere after course code
        // This handles lines like "20CS511 Data Structures 4 A+ P" where credits sit between name and grade
        if (!grade) {
            // Remove any trailing digits (credits) to find grade before them
            const trimmedAfter = after.replace(/\s+\d+\s*$/, '');
            const gradeMatchAnywhere = trimmedAfter.match(gradeEndRe);
            if (gradeMatchAnywhere) {
                grade = gradeMatchAnywhere[1];
                after = trimmedAfter.substring(0, gradeMatchAnywhere.index).trimEnd();
            }
        }

        // Strategy 3: grade concatenated directly to course name (no space)
        // e.g. "Principles of Compiler DesignB+" or "Web ProgrammingB"
        if (!grade) {
            const gradeMatchConcat = after.match(gradeEndNoWbRe);
            if (gradeMatchConcat) {
                grade = gradeMatchConcat[1];
                after = after.substring(0, gradeMatchConcat.index).trimEnd();
            }
        }

        // --- Remaining text is course name ---
        let courseName = after.replace(/\s+/g, ' ').trim();
        // Remove leading/trailing non-alpha chars and trailing credit digits
        courseName = courseName.replace(/^[^A-Za-z]+/, '').replace(/[^A-Za-z)]+$/, '').trim();

        if (courseCode && (courseName || grade)) {
            subjects.push({
                sno: snoCounter++,
                semester,
                courseCode,
                courseName: courseName || courseCode,
                grade: normalizeGrade(grade),
                result: result || '',
            });
        }
    }

    return subjects;
}

// ─────────────────────────────────────────────────────────
// Ollama Vision OCR for scanned PDFs and images
// ─────────────────────────────────────────────────────────

const MARKSHEET_VISION_PROMPT = `You are a professional university registrar and document AI system. Analyze this marksheet/grade sheet photo carefully.

IMPORTANT: Ignore ALL watermarks, background patterns, seals, signatures, stamps, and decorative elements. Focus ONLY on the printed/typed text and tables.

STEP 1 — Detect the document type.
If the document says "UG & PG END SEMESTER EXAMINATIONS", "RESULT SHEET", "PROVISIONAL RESULT", "EXAM RESULT" → document_type = "result_sheet".
If the document says "GRADE SHEET", "STATEMENT OF MARKS", "CHOICE BASED CREDIT SYSTEM", "CONSOLIDATED GRADE" → document_type = "original_marksheet".
Otherwise → document_type = "unknown".

STEP 2 — Extract student information:
- name (full name of the candidate)
- register_number (numeric ID, usually 11-13 digits)
- date_of_birth (DD/MM/YYYY or DD-MM-YYYY)
- programme (degree and branch, e.g. "B.E - Computer Science and Engineering")
- regulation (year, e.g. "2020")
- exam_month_year (e.g. "NOV 2024")
- semester (numeric, 1-8)

STEP 3 — Extract GPA values: sgpa, cgpa.

STEP 4 — Extract the marks/grades table. For EVERY row in the table, extract:
- semester (numeric)
- course_code (e.g. "20CS511", "MA8551")
- course_name (full subject name, cleaned up)
- grade (O, A+, A, B+, B, C, U, S, AB, RA — if OCR reads A- treat it as A+, if B- treat it as B+)
- result (P for Pass/PASS, F for Fail/FAIL)

CRITICAL ACCURACY RULES:
- Read each grade EXACTLY as printed in the grade column. Do NOT guess or infer grades.
- Each row's grade must come from the Grade column ONLY, not from adjacent columns or other rows.
- Double-check every grade value against the original document. A wrong grade is worse than no grade.
- For the student name, read ONLY the name field from the student info section. Do not mix it with other text.
- For SGPA and CGPA, look for labels like "SGPA", "GPA", "SEMESTER GPA", "CGPA", "CUMULATIVE GPA", "OVERALL GPA" and extract the numeric value next to them.

STEP 4 — Extract the marks/grades table. For EVERY row in the table, extract:
- semester (numeric)
- course_code (e.g. "20CS511", "MA8551")
- course_name (full subject name, cleaned up)
- credit (number of credits for the course, if available in the table)
- grade (O, A+, A, B+, B, C, U, S, AB, RA — if OCR reads A- treat it as A+, if B- treat it as B+)
- result (P for Pass/PASS, F for Fail/FAIL)

CRITICAL ACCURACY RULES:
- Read each grade EXACTLY as printed in the grade column. Do NOT guess or infer grades.
- Each row's grade must come from the Grade column ONLY, not from adjacent columns or other rows.
- Double-check every grade value against the original document. A wrong grade is worse than no grade.
- For the student name, read ONLY the name field from the student info section. Do not mix it with other text.
- For SGPA and CGPA, look for labels like "SGPA", "GPA", "SEMESTER GPA", "CGPA", "CUMULATIVE GPA", "OVERALL GPA" and extract the numeric value next to them.
- If the document does NOT have SGPA or CGPA printed, leave them as empty strings.

Read the ENTIRE table carefully. Do not skip any rows. If the table has columns like SNO, Semester, Course Code, Course Title, Grade, Result — extract all of them.

STEP 5 — Return ONLY a valid JSON object. No markdown, no explanations, no text before or after the JSON:
{
  "document_type": "",
  "student_info": {
    "name": "",
    "register_number": "",
    "date_of_birth": "",
    "programme": "",
    "regulation": "",
    "exam_month_year": "",
    "semester": ""
  },
  "gpa_info": {
    "sgpa": "",
    "cgpa": ""
  },
  "subjects": [
    {
      "semester": "",
      "course_code": "",
      "course_name": "",
      "credit": "",
      "grade": "",
      "result": ""
    }
  ]
}`;

async function checkVisionModel() {
    try {
        const response = await axios.get(`${OLLAMA_URL}/api/tags`, {
            timeout: 5000,
            headers: { 'ngrok-skip-browser-warning': 'true' },
        });
        const models = (response.data.models || []).map(m => m.name);
        const hasVisionModel = models.some(m => m.startsWith(OLLAMA_VISION_MODEL.split(':')[0]));
        return { ollamaRunning: true, hasVisionModel, models };
    } catch {
        return { ollamaRunning: false, hasVisionModel: false, models: [] };
    }
}

async function ocrWithOllama(imageBase64) {
    const response = await axios.post(
        `${OLLAMA_URL}/api/generate`,
        {
            model: OLLAMA_VISION_MODEL,
            prompt: MARKSHEET_VISION_PROMPT,
            images: [imageBase64],
            stream: false,
            options: {
                temperature: 0.1,
                num_predict: 4096,
            },
        },
        {
            timeout: 180000, // 3 minutes for vision processing
            headers: { 'ngrok-skip-browser-warning': 'true' },
        }
    );
    return response.data.response;
}

function parseOllamaJson(text) {
    try {
        let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) cleaned = jsonMatch[0];
        return JSON.parse(cleaned);
    } catch {
        // Try fixing common JSON issues
        try {
            let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (jsonMatch) cleaned = jsonMatch[0];
            cleaned = cleaned.replace(/(?<=:\s*"[^"]*)\n/g, '\\n');
            return JSON.parse(cleaned);
        } catch {
            return null;
        }
    }
}

async function ocrFromImageOllama(imageBuffer) {
    const base64 = imageBuffer.toString('base64');
    console.log('🤖 Sending image to Ollama vision model...');
    const rawResponse = await ocrWithOllama(base64);
    console.log(`\n🤖 Ollama response length: ${rawResponse.length} chars`);
    return rawResponse;
}

async function ocrFromPDFOllama(buffer) {
    const { convert } = await import('pdf-to-img');
    const allResponses = [];

    const pages = await convert(buffer, { scale: 2.0 });
    let pageNum = 0;
    for await (const pageImage of pages) {
        pageNum++;
        console.log(`📷 Ollama OCR processing page ${pageNum}...`);
        const base64 = Buffer.from(pageImage).toString('base64');
        const pageResponse = await ocrWithOllama(base64);
        allResponses.push(pageResponse);
    }

    return allResponses;
}

// Helper: normalize Ollama vision JSON into standard response shape
function buildVisionResponse(parsed) {
    const subjects = (parsed.subjects || []).map((s, i) => ({
        sno: i + 1,
        semester: s.semester || null,
        courseCode: s.course_code || '',
        courseName: s.course_name || '',
        grade: normalizeGrade(s.grade),
        credit: s.credit || null,
        result: s.result === 'PASS' ? 'P' : s.result === 'FAIL' ? 'F' : (s.result || ''),
    }));

    // Calculate SGPA if not provided (temporary marksheets don't have it)
    const gpaInfo = parsed.gpa_info || {};
    if (!gpaInfo.sgpa) {
        const calculated = calculateSGPA(subjects);
        if (calculated) gpaInfo.sgpa = calculated;
    }

    return {
        success: true,
        document_type: parsed.document_type || 'unknown',
        student_info: parsed.student_info || {},
        gpa_info: gpaInfo,
        subjects,
    };
}

// Helper: check if regex-based extraction yielded useful results
function isExtractionWeak(studentInfo, subjects) {
    const infoKeys = Object.keys(studentInfo).filter(k => studentInfo[k]);
    // Weak = fewer than 2 student fields AND fewer than 2 subjects
    return infoKeys.length < 2 && subjects.length < 2;
}

// Helper: run Ollama vision on a file buffer (image or PDF) and return parsed JSON or null
async function tryVisionExtraction(fileBuffer, isImage) {
    const visionStatus = await checkVisionModel();
    if (!visionStatus.ollamaRunning || !visionStatus.hasVisionModel) {
        return { available: false, visionStatus };
    }

    let rawResponse;
    if (isImage) {
        rawResponse = await ocrFromImageOllama(fileBuffer);
        const parsed = parseOllamaJson(rawResponse);
        return { available: true, parsed, rawText: rawResponse };
    } else {
        const pdfResponses = await ocrFromPDFOllama(fileBuffer);
        for (const pageResp of pdfResponses) {
            const parsed = parseOllamaJson(pageResp);
            if (parsed) return { available: true, parsed, rawText: pageResp };
        }
        return { available: true, parsed: null, rawText: pdfResponses.join('\n') };
    }
}

// ─────────────────────────────────────────────────────────
// POST /parse
// ─────────────────────────────────────────────────────────

router.post('/parse', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    try {
        console.log(`📄 Processing marksheet: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)}KB)`);

        const forceVision = req.query.forceVision === 'true' || req.body?.forceVision === true;

        // ── PDF uploads only ──
        // If forceVision is set, skip pdf-parse entirely and send PDF pages as images
        if (forceVision) {
            console.log('🔬 forceVision=true, skipping pdf-parse, sending PDF to vision model...');
            const result = await tryVisionExtraction(req.file.buffer, false);

            if (!result.available) {
                const vs = result.visionStatus;
                if (!vs.ollamaRunning) {
                    return res.status(503).json({ success: false, error: 'Ollama is not running. Start it with: ollama serve' });
                }
                return res.status(503).json({
                    success: false,
                    error: `Vision model "${OLLAMA_VISION_MODEL}" not found. Pull it with: ollama pull ${OLLAMA_VISION_MODEL}\nAvailable models: ${vs.models.join(', ') || 'none'}`,
                });
            }

            if (result.parsed) {
                console.log('✅ Ollama (forceVision) extracted structured data from PDF');
                return res.json(buildVisionResponse(result.parsed));
            }

            // Raw text fallback
            const fullText = result.rawText || '';
            if (!fullText.trim()) {
                return res.status(400).json({ success: false, error: 'Vision model could not extract text from this PDF.' });
            }
            const ftInfo = extractStudentInfo(fullText);
            const ftSubjects = extractSubjects(fullText);
            const ftGpa = {};
            if (ftInfo.sgpa) ftGpa.sgpa = ftInfo.sgpa;
            else {
                const calc = calculateSGPA(ftSubjects);
                if (calc) ftGpa.sgpa = calc;
            }
            if (ftInfo.cgpa) ftGpa.cgpa = ftInfo.cgpa;
            return res.json({
                success: true,
                document_type: detectDocumentType(fullText),
                student_info: ftInfo,
                gpa_info: ftGpa,
                subjects: ftSubjects,
            });
        }

        // ── Path C: Normal PDF — try digital text first, fallback to vision ──
        const pdfData = await pdfParse(req.file.buffer);
        let fullText = pdfData.text || '';

        if (!fullText.trim()) {
            // No embedded text — scanned PDF
            console.log('📷 No text in PDF, using Ollama vision model...');
            const result = await tryVisionExtraction(req.file.buffer, false);

            if (!result.available) {
                const vs = result.visionStatus;
                if (!vs.ollamaRunning) {
                    return res.status(503).json({ success: false, error: 'Ollama is not running. Start it with: ollama serve' });
                }
                return res.status(503).json({
                    success: false,
                    error: `Vision model "${OLLAMA_VISION_MODEL}" not found. Pull it with: ollama pull ${OLLAMA_VISION_MODEL}`,
                });
            }

            if (result.parsed) {
                console.log('✅ Ollama extracted structured data from scanned PDF');
                return res.json(buildVisionResponse(result.parsed));
            }

            fullText = result.rawText || '';
            if (!fullText.trim()) {
                return res.status(400).json({
                    success: false,
                    error: 'No text found in the PDF and Ollama vision returned nothing. Please upload a clearer document.',
                });
            }
        }

        // Have text — try regex extraction
        console.log(`📝 Extracted ${fullText.length} characters (digital PDF)`);
        console.log(`📄 Raw text (first 1500 chars):\n${fullText.substring(0, 1500)}`);

        const docType = detectDocumentType(fullText);
        const studentInfo = extractStudentInfo(fullText);
        const subjects = extractSubjects(fullText);
        console.log(`📋 Document type: ${docType} | 👤 Student fields: ${Object.keys(studentInfo).length} | 📚 Subjects: ${subjects.length}`);

        // ── Smart fallback: if regex yielded poor results, try vision model ──
        if (isExtractionWeak(studentInfo, subjects)) {
            console.log('⚠️ Regex extraction yielded weak results, trying Ollama vision fallback...');
            try {
                const result = await tryVisionExtraction(req.file.buffer, false);
                if (result.available && result.parsed) {
                    const visionSubjects = (result.parsed.subjects || []);
                    // Only use vision result if it's actually better
                    if (visionSubjects.length > subjects.length) {
                        console.log(`✅ Vision fallback found ${visionSubjects.length} subjects (regex found ${subjects.length})`);
                        return res.json(buildVisionResponse(result.parsed));
                    }
                }
            } catch (fallbackErr) {
                console.log('⚠️ Vision fallback failed, returning regex results:', fallbackErr.message);
            }
        }

        // Calculate SGPA if not extracted from text (temporary marksheets)
        const gpaInfo = {};
        if (studentInfo.sgpa) {
            gpaInfo.sgpa = studentInfo.sgpa;
        } else {
            const calculated = calculateSGPA(subjects);
            if (calculated) gpaInfo.sgpa = calculated;
        }
        if (studentInfo.cgpa) {
            gpaInfo.cgpa = studentInfo.cgpa;
        }

        return res.json({
            success: true,
            document_type: docType,
            student_info: studentInfo,
            gpa_info: gpaInfo,
            subjects,
        });

    } catch (error) {
        console.error('❌ Marksheet parse error:', error.message);
        return res.status(500).json({
            success: false,
            error: 'Failed to parse the marksheet. Please try again.',
        });
    }
});

// ─────────────────────────────────────────────────────────
// GET /ocr-status
// ─────────────────────────────────────────────────────────

router.get('/ocr-status', async (req, res) => {
    const visionStatus = await checkVisionModel();
    res.json({
        success: true,
        service: 'pdf-parse + ollama-vision',
        status: 'running',
        vision_model: OLLAMA_VISION_MODEL,
        ollama_running: visionStatus.ollamaRunning,
        vision_model_available: visionStatus.hasVisionModel,
        available_models: visionStatus.models,
    });
});

module.exports = router;
