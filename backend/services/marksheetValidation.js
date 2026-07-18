const VALID_GRADES = new Set(['O', 'S', 'A+', 'A', 'B+', 'B', 'C', 'U', 'AB', 'RA', 'SA', 'W', 'WD']);
const VALID_RESULTS = new Set(['P', 'F', 'AB', 'W', '']);
const COURSE_CODE_RE = /^(?:\d{2}[A-Z]{2,4}\d{2,4}[A-Z]?|[A-Z]{2,4}\d{3,5}[A-Z]?|\d{2}[A-Z]{3,4}\d{2,4}|[A-Z0-9]{5,10})$/;

const DEFAULTS = {
  minOcrConfidence: Number(process.env.OCR_MIN_CONF || 0.65),
  minSubjects: Number(process.env.MARKSHEET_MIN_SUBJECTS || 4),
  maxSubjects: Number(process.env.MARKSHEET_MAX_SUBJECTS || 14),
  confidenceReject: Number(process.env.MARKSHEET_CONFIDENCE_REJECT || 0.72),
  sgpaTolerance: Number(process.env.MARKSHEET_SGPA_TOLERANCE || 0.15)
};

const GRADE_POINTS = {
  'O': 10,
  'S': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'U': 0,
  'RA': 0,
  'AB': 0,
  'SA': 0,
  'W': 0,
  'WD': 0
};

function normalizeGrade(grade) {
  if (!grade) return '';
  const upper = String(grade).trim().toUpperCase();
  if (upper === 'A-') return 'A+';
  if (upper === 'B-') return 'B+';
  if (upper === '5A') return 'SA';
  return upper;
}

function normalizeResult(result) {
  if (!result) return '';
  const upper = String(result).trim().toUpperCase();
  if (upper === 'PASS') return 'P';
  if (upper === 'FAIL') return 'F';
  return upper;
}

function normalizeCourseCode(code) {
  if (!code) return '';
  let value = String(code).trim().toUpperCase().replace(/\s+/g, '');
  value = value.replace(/O(?=\d)|(?<=\d)O/g, '0');
  value = value.replace(/I(?=\d)|(?<=\d)I/g, '1');
  value = value.replace(/5A/g, 'SA');
  return value;
}

function calculateSgpa(subjects) {
  if (!Array.isArray(subjects) || subjects.length === 0) return null;
  let totalCredits = 0;
  let totalPoints = 0;
  for (const s of subjects) {
    const grade = normalizeGrade(s.grade);
    const credits = Number(s.credits || s.credit || 0) || 0;
    if (!grade || !(grade in GRADE_POINTS)) continue;
    totalCredits += credits || 1; // fallback to 1 credit if missing
    totalPoints += (credits || 1) * GRADE_POINTS[grade];
  }
  if (totalCredits === 0) return null;
  return Number((totalPoints / totalCredits).toFixed(2));
}

function validateMarksheetData(marksheet, options = {}) {
  const config = { ...DEFAULTS, ...options };
  const errors = [];
  const warnings = [];

  if (!marksheet.regNo) errors.push('Register Number is required');
  if (!marksheet.studentName) errors.push('Student Name is required');

  const semester = Number(marksheet.semester);
  if (!Number.isFinite(semester) || semester < 1 || semester > 8) {
    errors.push('Semester must be between 1-8');
  }

  if (!Array.isArray(marksheet.subjects) || marksheet.subjects.length === 0) {
    errors.push('No subjects found in marksheet');
    return { isValid: false, errors, warnings, stats: { totalSubjects: 0 } };
  }

  const seenCodes = new Set();
  let validSubjects = 0;
  let validCodes = 0;
  let validGrades = 0;

  marksheet.subjects.forEach((subject, idx) => {
    subject.courseCode = normalizeCourseCode(subject.courseCode);
    subject.grade = normalizeGrade(subject.grade);
    subject.result = normalizeResult(subject.result);

    if (!subject.courseCode) errors.push(`Subject ${idx + 1}: Course Code is missing`);
    if (subject.courseCode && !COURSE_CODE_RE.test(subject.courseCode)) {
      errors.push(`Subject ${idx + 1}: Invalid course code ${subject.courseCode}`);
    }
    if (!subject.courseName) warnings.push(`Subject ${idx + 1}: Course Name is missing`);
    if (!subject.grade) warnings.push(`Subject ${idx + 1}: Grade is missing`);
    if (!subject.result) warnings.push(`Subject ${idx + 1}: Result is missing`);

    const subjSemester = Number(subject.semester);
    if (Number.isFinite(subjSemester) && (subjSemester < 1 || subjSemester > 8)) {
      warnings.push(`Subject ${idx + 1}: Invalid semester ${subject.semester}`);
    }

    const grade = subject.grade;
    const result = subject.result;
    if (['U', 'RA'].includes(grade) && result === 'P') {
      errors.push(`Subject ${idx + 1}: Grade ${grade} cannot be Pass`);
    }
    if (result === 'F' && grade && !['U', 'RA', 'AB'].includes(grade)) {
      warnings.push(`Subject ${idx + 1}: Result is Fail but grade is ${grade}`);
    }

    if (subject.courseCode && COURSE_CODE_RE.test(subject.courseCode)) validCodes += 1;
    if (subject.grade && VALID_GRADES.has(subject.grade)) validGrades += 1;

    if (subject.courseCode) {
      if (seenCodes.has(subject.courseCode)) {
        errors.push(`Duplicate course code: ${subject.courseCode}`);
      } else {
        seenCodes.add(subject.courseCode);
      }
    }

    if (subject.courseCode || subject.courseName) validSubjects += 1;
  });

  if (validSubjects < config.minSubjects) {
    warnings.push(`Too few subjects detected (${validSubjects})`);
  }
  if (validSubjects > config.maxSubjects) {
    warnings.push(`Unusually high subject count (${validSubjects})`);
  }

  const sgpa = Number(marksheet.sgpa);
  if (Number.isFinite(sgpa)) {
    const computed = calculateSgpa(marksheet.subjects);
    if (computed !== null && Math.abs(computed - sgpa) > config.sgpaTolerance) {
      warnings.push(`SGPA mismatch (reported ${sgpa}, computed ${computed})`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalSubjects: marksheet.subjects.length,
      validSubjects,
      validCodes,
      validGrades
    }
  };
}

function scoreMarksheetConfidence(marksheet, ocrMeta = {}, validation = null, options = {}) {
  const config = { ...DEFAULTS, ...options };
  const stats = validation?.stats || {};

  const ocrScore = Math.max(0, Math.min(1, Number(ocrMeta.avg_conf || ocrMeta.ocrConfidence || 0)));
  const subjectRatio = stats.totalSubjects ? stats.validSubjects / stats.totalSubjects : 0;
  const codeRatio = stats.totalSubjects ? stats.validCodes / stats.totalSubjects : 0;
  const gradeRatio = stats.totalSubjects ? stats.validGrades / stats.totalSubjects : 0;

  let score = 0.45 * ocrScore + 0.25 * subjectRatio + 0.2 * codeRatio + 0.1 * gradeRatio;

  if (validation && validation.errors && validation.errors.length > 0) score -= 0.2;
  if (validation && validation.warnings && validation.warnings.length > 0) score -= 0.05;

  score = Math.max(0, Math.min(1, score));
  return Number(score.toFixed(3));
}

function requiresManualReview(confidence, validation, options = {}) {
  const config = { ...DEFAULTS, ...options };
  if (!validation?.isValid) return true;
  if (confidence < config.confidenceReject) return true;
  return false;
}

module.exports = {
  normalizeGrade,
  normalizeResult,
  normalizeCourseCode,
  validateMarksheetData,
  scoreMarksheetConfidence,
  requiresManualReview,
  calculateSgpa
};
