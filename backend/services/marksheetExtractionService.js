/**
 * Marksheet PDF Extraction Service
 * ─────────────────────────────────────────────────────────
 * Extracts structured marksheet data from PDFs
 * Uses OCR service v2 for deterministic coordinate-aware parsing
 */

const {
  normalizeCourseCode,
  normalizeGrade,
  normalizeResult,
  validateMarksheetData,
  scoreMarksheetConfidence,
  requiresManualReview,
  calculateSgpa
} = require('./marksheetValidation');

const normalizeStudentName = (name = '') => {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : ''))
    .join(' ')
    .trim();
};

const formatStudentName = (name = '') => normalizeStudentName(name);

const NAME_LABEL_RE = /Name\s+of\s+the\s+Candidate\s*[:\-]?\s*(.*)/i;
const NAME_TAIL_CLEAN_RE = /\s+(REG(?:ISTER)?(?:\s*NO|\s*NUMBER)?|SEMESTER|PROGRAMME|DOB|DATE\s+OF\s+BIRTH|EXAM|SGPA|CGPA|YEAR)\b.*$/i;
const looksLikeNameLine = (line = '') => {
  const cleaned = String(line || '').trim();
  if (!cleaned) return false;
  if (NAME_TAIL_CLEAN_RE.test(cleaned)) return false;
  return /^[A-Z .]+$/i.test(cleaned);
};

const extractLeadingNameSegment = (line = '') => {
  const cleaned = String(line || '').replace(NAME_TAIL_CLEAN_RE, '').trim();
  if (!cleaned) return '';
  const match = cleaned.match(/^([A-Z][A-Z.\s]*)(?=\s+\d|\s+REG|\s+REGISTER|$)/i);
  if (match && match[1]) {
    return match[1].replace(/\s+/g, ' ').trim();
  }
  if (/^[A-Z.\s]+$/i.test(cleaned)) {
    return cleaned.replace(/\s+/g, ' ').trim();
  }
  return '';
};

const extractNameFromRawText = (rawText = '') => {
  const text = String(rawText || '');
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const labelRegex = /Name\s+of\s+the\s+Candidate/i;
  const candidateRegex = /Name\s+of\s+the\s+Candidate\s*:\s*([A-Z\s.]{3,})/im;

  let rawLine = '';
  let extractedName = '';

  const match = text.match(candidateRegex);
  if (match && match[1]) {
    extractedName = match[1].replace(/\s+/g, ' ').trim();
  }

  if (lines.length > 0) {
    rawLine = lines.find((line) => labelRegex.test(line)) || '';
  }

  if (!extractedName && rawLine) {
    const colonIndex = rawLine.indexOf(':');
    if (colonIndex !== -1) {
      extractedName = rawLine.slice(colonIndex + 1).trim();
    } else {
      extractedName = rawLine.replace(labelRegex, '').replace(/^[-–:]+/, '').trim();
    }
  }

  if (!extractedName && rawLine) {
    const rawIndex = lines.findIndex((line) => labelRegex.test(line));
    if (rawIndex !== -1 && lines[rawIndex + 1]) {
      extractedName = lines[rawIndex + 1].trim();
    }
  }

  extractedName = extractedName.replace(NAME_TAIL_CLEAN_RE, '').trim();

  console.log('📄 OCR RAW LINE:', rawLine);
  console.log('📛 RAW OCR NAME (text):', extractedName);

  return extractedName;
};

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:5001';
const OCR_V2_ENDPOINT = '/parse-marksheet-pages-v2';
const OCR_HEALTH_ENDPOINT = '/health';
const OCR_TIMEOUT_MS = Number(process.env.OCR_TIMEOUT_MS) || 180000;
console.log(`[OCR] Configured Timeout = ${OCR_TIMEOUT_MS} ms`);

const buildOcrUrl = (path) => `${OCR_SERVICE_URL}${path}`;

async function checkOcrHealth() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(buildOcrUrl(OCR_HEALTH_ENDPOINT), {
      method: 'GET',
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`OCR health check failed (status ${response.status})`);
    }

    const data = await response.json().catch(() => ({}));
    if (data.status !== 'ok') {
      throw new Error('OCR health check returned non-ok status');
    }
  } finally {
    clearTimeout(timeout);
  }
}

const normalizeSubject = (subject = {}) => ({
  sno: subject.sno,
  semester: subject.semester || null,
  courseCode: normalizeCourseCode(subject.courseCode || subject.course_code || ''),
  courseName: subject.courseName || subject.course_name || '',
  originalCourseName: subject.originalCourseName || subject.courseName || subject.course_name || '',
  normalizedCourseName: subject.normalizedCourseName || subject.courseName || subject.course_name || '',
  grade: normalizeGrade(subject.grade || ''),
  result: normalizeResult(subject.result || ''),
  credits: Number(subject.credit || subject.credits || 0) || 0,
  confidence: Number(subject.confidence) || 0,
  gradeConfidence: Number(subject.gradeConfidence) ?? 1.0,
  warnings: Array.isArray(subject.warnings) ? subject.warnings : [],
  errors: Array.isArray(subject.errors) ? subject.errors : [],
  tr_ids: Array.isArray(subject.tr_ids) ? subject.tr_ids : []
});

async function callOcrServiceForPages(pdfBuffer, options = {}) {
  try {
    await checkOcrHealth();
    console.log(`[OCR REQUEST] Sending file to OCR service: ${buildOcrUrl(OCR_V2_ENDPOINT)}`);

    const formData = new FormData();
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    formData.append('file', pdfBlob, 'marksheet.pdf');
    
    // Add options (including jobId) to form data
    formData.append('options', JSON.stringify({
      semester: options.semester || null,
      jobId: options.jobId || null,
      debug: options.debug || false
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS);

    const response = await fetch(buildOcrUrl(OCR_V2_ENDPOINT), {
      method: 'POST',
      body: formData,
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      console.error('[OCR ERROR] OCR service returned non-200 status');
      throw new Error(text || 'OCR service failed to parse PDF');
    }

    const result = await response.json();
    console.log('[OCR RESPONSE] Extraction completed');
    return result;
  } catch (error) {
    console.error('[OCR ERROR] Connection failed:', error.message);
    throw error;
  }
}

/**
 * Extract all marksheets from PDF buffer
 * Returns array of marksheet objects (one per student)
 */
async function extractAllMarksheetsFromPDF(pdfBuffer, options = {}) {
  try {
    const ocrResult = await callOcrServiceForPages(pdfBuffer, options);

    const pages = Array.isArray(ocrResult?.pages) ? ocrResult.pages : [];
    if (pages.length === 0) {
      throw new Error('No marksheets found in PDF via OCR service');
    }

    console.log(`[OCR Extraction] Found ${pages.length} page(s) in PDF`);

    const marksheets = pages.map((page, index) => {
      const info = page.student_info || {};
      const subjects = Array.isArray(page.subjects)
        ? page.subjects.map((subject) => normalizeSubject(subject))
        : [];

      const semester = info.semester || options.semester || null;
      const rawNameFromInfo = info.name || '';
      const rawNameFromText = extractNameFromRawText(page.raw_text || '');
      const rawName = rawNameFromText.length >= rawNameFromInfo.length
        ? rawNameFromText
        : (rawNameFromInfo || rawNameFromText);
      const formattedName = normalizeStudentName(rawName);

      console.log('📛 RAW OCR NAME (info):', rawNameFromInfo);
      console.log('📛 RAW OCR NAME (text):', rawNameFromText);
      console.log('📛 RAW OCR NAME (picked):', rawName);
      console.log('✅ FORMATTED OCR NAME:', formattedName);

      const marksheet = {
        regNo: info.register_number || '',
        studentName: formattedName || rawName || (info.name ? info.name : 'Unknown'),
        programme: info.programme || '',
        examDate: info.exam_month_year || '',
        dob: info.date_of_birth || '--',
        semester,
        subjects,
        sgpa: info.sgpa || calculateSgpa(subjects),
        extractedAt: new Date(),
        rawText: page.raw_text || '',
        candidate_metadata: page.candidate_metadata || null,
        ocrMeta: {
          page: index + 1,
          documentType: page.document_type || 'unknown',
          avgConf: page.ocr_meta?.avg_conf || 0,
          lineCount: page.ocr_meta?.line_count || 0,
          attempts: page.ocr_meta?.attempts || [],
          selected: page.ocr_meta?.selected || null,
          integrity_telemetry: page.ocr_meta?.integrity_telemetry || null
        }
      };

      const validation = validateMarksheetData(marksheet, options.validation);
      const confidence = scoreMarksheetConfidence(marksheet, page.ocr_meta || {}, validation, options.confidence);
      const requiresReview = requiresManualReview(confidence, validation, options.confidence);

      marksheet.validation = validation;
      marksheet.extractionConfidence = confidence;
      marksheet.requiresReview = requiresReview;
      return marksheet;
    });

    // Group and merge marksheets by regNo to ensure one student record per register number
    const mergedMarksheetsMap = new Map();
    for (const marksheet of marksheets) {
      const regNo = marksheet.regNo ? marksheet.regNo.trim().toUpperCase() : 'UNKNOWN';
      if (regNo === 'UNKNOWN') {
        const uniqueKey = `UNKNOWN_${Date.now()}_${Math.random()}`;
        mergedMarksheetsMap.set(uniqueKey, marksheet);
        continue;
      }
      
      if (!mergedMarksheetsMap.has(regNo)) {
        mergedMarksheetsMap.set(regNo, marksheet);
      } else {
        const existing = mergedMarksheetsMap.get(regNo);
        console.log(`[OCR Extraction] Merging duplicate marksheet pages for candidate ${regNo}`);
        
        // Merge subjects
        const existingSubjectCodes = new Set(existing.subjects.map(s => s.courseCode));
        for (const sub of marksheet.subjects) {
          if (!existingSubjectCodes.has(sub.courseCode)) {
            existing.subjects.push(sub);
            existingSubjectCodes.add(sub.courseCode);
          }
        }
        
        // Update basic info if missing
        if ((!existing.studentName || existing.studentName === 'Unknown') && marksheet.studentName && marksheet.studentName !== 'Unknown') {
          existing.studentName = marksheet.studentName;
        }
        if (!existing.programme && marksheet.programme) {
          existing.programme = marksheet.programme;
        }
        if ((!existing.dob || existing.dob === '--') && marksheet.dob && marksheet.dob !== '--') {
          existing.dob = marksheet.dob;
        }
        
        existing.sgpa = calculateSgpa(existing.subjects);
        existing.rawText += `\n\n--- Page Break ---\n\n` + marksheet.rawText;
        
        const validation = validateMarksheetData(existing, options.validation);
        const confidence = scoreMarksheetConfidence(existing, existing.ocrMeta || {}, validation, options.confidence);
        const requiresReview = requiresManualReview(confidence, validation, options.confidence);
        
        existing.validation = validation;
        existing.extractionConfidence = confidence;
        existing.requiresReview = requiresReview;
      }
    }
    
    return Array.from(mergedMarksheetsMap.values());
  } catch (error) {
    throw new Error(`OCR parsing failed: ${error.message}`);
  }
}

/**
 * Match student from database based on regNo and name
 * Returns { isMatched, student, warnings }
 */
async function matchStudentFromDatabase(regNo, studentName, Student) {
  try {
    // Exact match on registration number
    const student = await Student.findOne({ regNo: regNo.trim() });
    
    if (!student) {
      return {
        isMatched: false,
        student: null,
        warning: `No student found with Register Number: ${regNo}`
      };
    }
    
    // Verify name matches (case-insensitive, partial match allowed)
    const extractedNameLower = studentName.toLowerCase().trim();
    const storedNameLower = `${student.firstName} ${student.lastName}`.toLowerCase();
    
    // Check if names are similar enough (at least first and last name match)
    const nameMatch = storedNameLower.includes(extractedNameLower) ||
                      extractedNameLower.includes(storedNameLower);
    
    if (!nameMatch) {
      return {
        isMatched: true,
        student,
        warning: `Name mismatch: PDF shows "${studentName}", DB has "${student.firstName} ${student.lastName}"`
      };
    }
    
    return {
      isMatched: true,
      student,
      warning: null
    };
  } catch (error) {
    throw new Error(`Database lookup failed: ${error.message}`);
  }
}

module.exports = {
  extractAllMarksheetsFromPDF,
  matchStudentFromDatabase,
  formatStudentName,
  normalizeStudentName
};
