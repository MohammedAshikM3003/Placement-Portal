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

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:5001';
const OCR_V2_ENDPOINT = '/parse-marksheet-pages-v2';
const OCR_HEALTH_ENDPOINT = '/health';

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
  grade: normalizeGrade(subject.grade || ''),
  result: normalizeResult(subject.result || ''),
  credits: Number(subject.credit || subject.credits || 0) || 0
});

async function callOcrServiceForPages(pdfBuffer) {
  try {
    await checkOcrHealth();
    console.log(`[OCR REQUEST] Sending file to OCR service: ${buildOcrUrl(OCR_V2_ENDPOINT)}`);

    const formData = new FormData();
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    formData.append('file', pdfBlob, 'marksheet.pdf');

    const response = await fetch(buildOcrUrl(OCR_V2_ENDPOINT), {
      method: 'POST',
      body: formData
    });

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
    const ocrResult = await callOcrServiceForPages(pdfBuffer);

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

      const marksheet = {
        regNo: info.register_number || '',
        studentName: info.name || 'Unknown',
        programme: info.programme || '',
        examDate: info.exam_month_year || '',
        dob: info.date_of_birth || '--',
        semester,
        subjects,
        sgpa: info.sgpa || calculateSgpa(subjects),
        extractedAt: new Date(),
        rawText: page.raw_text || '',
        ocrMeta: {
          page: index + 1,
          documentType: page.document_type || 'unknown',
          avgConf: page.ocr_meta?.avg_conf || 0,
          lineCount: page.ocr_meta?.line_count || 0,
          attempts: page.ocr_meta?.attempts || [],
          selected: page.ocr_meta?.selected || null
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

    return marksheets;
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
  matchStudentFromDatabase
};
