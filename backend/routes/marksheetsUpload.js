/**
 * Marksheet Upload & Extraction Routes
 * ────────────────────────────────────────────────────────
 * POST /upload       - Upload PDF and extract marksheets
 * POST /confirm      - Confirm extraction and save to DB
 * GET  /:studentId   - Get marksheets for a student
 * GET  /semester/:id - Get marksheet for specific semester
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const mongoose = require('mongoose');

// Models
const Student = require('../models/Student');
const StudentMarksheet = require('../models/StudentMarksheet');
const Subject = require('../models/Subject');
const MarksheetReview = require('../models/MarksheetReview');
const MarksheetAuditLog = require('../models/MarksheetAuditLog');
const CorrectionMemory = require('../models/CorrectionMemory');
const SemesterUploadHistory = require('../models/SemesterUploadHistory');
const { marksheetQueue } = require('../queues/marksheetQueue');
const { autoSaveSemesterRecords } = require('../services/semesterAutoSave');

// Service
const {
  extractAllMarksheetsFromPDF,
  matchStudentFromDatabase,
  formatStudentName,
  normalizeStudentName
} = require('../services/marksheetExtractionService');

const {
  validateMarksheetData,
  scoreMarksheetConfidence,
  requiresManualReview
} = require('../services/marksheetValidation');

const {
  buildSubjectLookup,
  buildSubjectNameLookup,
  matchCourseCode,
  matchSubjectName,
  matchSubjectSemantic
} = require('../services/subjectMatcher');

const getAcademicYearFromSemester = (semester) => {
  const sem = Number(semester);
  if (!Number.isFinite(sem) || sem < 1) return null;
  return Math.ceil(sem / 2);
};

const normalizeNameValue = (value) => String(value || '').trim().replace(/\s+/g, ' ');
const countNameWords = (value) => {
  const normalized = normalizeNameValue(value);
  return normalized ? normalized.split(/\s+/).filter(Boolean).length : 0;
};
const pickMostCompleteName = (candidates = []) => {
  let best = '';
  for (const candidate of candidates) {
    const normalized = normalizeNameValue(candidate);
    if (!normalized) continue;
    if (!best) {
      best = normalized;
      continue;
    }
    const bestParts = countNameWords(best);
    const nextParts = countNameWords(normalized);
    if (nextParts > bestParts || (nextParts === bestParts && normalized.length > best.length)) {
      best = normalized;
    }
  }
  return best;
};

function detectRegulationFromCodes(subjects, text = '') {
  const regexReg = /regulation[s]?\s*(\d{4})/i;
  const match = text.match(regexReg);
  if (match && match[1]) {
    return 'Regulation ' + match[1];
  }

  const counts = {};
  for (const s of subjects) {
    const code = s.courseCode || '';
    const digits = code.match(/^\d{2}/);
    if (digits) {
      const regYear = '20' + digits[0];
      counts[regYear] = (counts[regYear] || 0) + 1;
    }
  }

  let maxCount = 0;
  let bestYear = null;
  for (const [year, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      bestYear = year;
    }
  }

  if (bestYear) {
    return 'Regulation ' + bestYear;
  }
  return 'Regulation 2020';
}
const buildStudentFullName = (student) => {
  if (!student) return '';

  const explicitCandidates = [
    student.studentName,
    student.fullName,
    student.name
  ].filter(Boolean);

  const partCandidates = [
    student.firstName,
    student.middleName,
    student.lastName,
    student.initials,
    student.suffix
  ].filter(Boolean);

  const derived = partCandidates.length > 0 ? partCandidates.join(' ').trim() : '';
  const allCandidates = derived ? [...explicitCandidates, derived] : explicitCandidates;
  return pickMostCompleteName(allCandidates);
};


// Middleware - Verify coordinator role
const coordinatorAuth = (req, res, next) => {
  if (process.env.MARKSHEET_UPLOAD_BYPASS_AUTH === '1') {
    console.warn('[Marksheet Upload] Auth bypass enabled (MARKSHEET_UPLOAD_BYPASS_AUTH=1)');
    return next();
  }

  if (req.user?.role !== 'coordinator' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only coordinators can upload marksheets' });
  }
  next();
};

// Multer: Store PDF in memory (max 50MB for full semester marksheets)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are supported'));
    }
  }
});
const uploadRateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_UPLOADS_PER_WINDOW = 10;

const limitUploads = (req, res, next) => {
  if (process.env.MARKSHEET_UPLOAD_BYPASS_AUTH === '1') {
    return next();
  }
  const userId = String(req.user?._id || req.ip);
  const now = Date.now();
  
  if (!uploadRateLimiter.has(userId)) {
    uploadRateLimiter.set(userId, []);
  }
  
  const timestamps = uploadRateLimiter.get(userId).filter(t => now - t < RATE_LIMIT_WINDOW);
  timestamps.push(now);
  uploadRateLimiter.set(userId, timestamps);
  
  if (timestamps.length > MAX_UPLOADS_PER_WINDOW) {
    return res.status(429).json({
      error: 'Too many upload requests. Please wait a minute before trying again.'
    });
  }
  next();
};

/**
 * POST /upload
 * Upload PDF and extract marksheets (preview before saving)
 */
router.post('/upload', coordinatorAuth, limitUploads, upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  const userId = req.user?._id || 'unauthenticated';
  const timestamp = new Date().toISOString();

  try {
    // ─────────────────────────────────────────────────────────
    // 1. Validate file upload
    // ─────────────────────────────────────────────────────────
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`[OCR AUDIT] ${timestamp} - Upload start for user=${userId}, file=${req.file.originalname} (${req.file.size} bytes)`);

    // PDF validation & Page Count Check using pdf-parse
    let pageCount = 0;
    try {
      const pdfParse = require('pdf-parse');
      const pdfInfo = await pdfParse(req.file.buffer);
      pageCount = pdfInfo.numpages || 0;
      if (pageCount > 15) {
        console.warn(`[OCR SECURITY] PDF page count (${pageCount}) exceeds 15 page limit for user=${userId}`);
        return res.status(400).json({
          error: `PDF page count (${pageCount}) exceeds the maximum limit of 15 pages. Please split your file and try again.`
        });
      }
    } catch (pdfError) {
      console.error(`[OCR SECURITY] PDF integrity check failed for user=${userId}:`, pdfError.message);
      return res.status(400).json({
        error: 'Uploaded PDF is corrupted, malformed, or password-protected. Please upload a valid unencrypted PDF.'
      });
    }

    // ─────────────────────────────────────────────────────────
    // 2. Extract marksheets from PDF
    // ─────────────────────────────────────────────────────────
    const { updateProgress } = require('./marksheetProgress');
    const jobId = req.body?.jobId;
    const debugEnabled = process.env.DEBUG_MODE === 'true' || req.body?.debug === 'true' || !!jobId;
    if (jobId) {
      updateProgress(jobId, {
        totalMarksheets: pageCount || 0,
        processedMarksheets: 0,
        currentRegisterNo: '',
        currentStage: 'Running OCR',
        status: 'processing',
        currentPage: 0,
        totalPages: pageCount || 0,
        studentsFound: 0,
        studentsProcessed: 0,
        subjectsExtracted: 0,
        currentSemester: req.body?.semester ? Number(req.body.semester) : null
      });
    }

    let marksheets;
    try {
      marksheets = await extractAllMarksheetsFromPDF(req.file.buffer, {
        semester: req.body?.semester ? Number(req.body.semester) : null,
        jobId: jobId,
        debug: debugEnabled
      });
    } catch (error) {
      const durationErr = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`[OCR AUDIT] ${new Date().toISOString()} - Upload extraction failed for user=${userId}, file=${req.file.originalname}, duration=${durationErr}s, error=${error.message}`);
      return res.status(400).json({
        error: 'Failed to extract marksheets from PDF',
        details: error.message
      });
    }

    if (!marksheets || marksheets.length === 0) {
      const durationErr = ((Date.now() - startTime) / 1000).toFixed(2);
      console.warn(`[OCR AUDIT] ${new Date().toISOString()} - Upload returned 0 marksheets for user=${userId}, file=${req.file.originalname}, duration=${durationErr}s`);
      return res.status(400).json({
        error: 'No marksheets found in PDF'
      });
    }

    console.log(`[Marksheet Upload] Extracted ${marksheets.length} marksheets`);

    console.log('🧠 OCR extraction completed');

    if (jobId && marksheets) {
      updateProgress(jobId, {
        totalMarksheets: marksheets.length,
        processedMarksheets: marksheets.length,
        currentRegisterNo: '',
        currentStage: 'Validating',
        status: 'processing'
      });
    }

    // ─────────────────────────────────────────────────────────
    // 3. Validate and match with students
    // ─────────────────────────────────────────────────────────
    const extractedMarksheets = [];
    const warnings = [];
    let totalMatched = 0;

    for (const marksheet of marksheets) {
      // Validate marksheet data
      const validation = marksheet.validation || validateMarksheetData(marksheet);
      const confidence = Number.isFinite(marksheet.extractionConfidence)
        ? marksheet.extractionConfidence
        : scoreMarksheetConfidence(marksheet, marksheet.ocrMeta || {}, validation);
      const needsReview = marksheet.requiresReview === true
        ? true
        : requiresManualReview(confidence, validation);

      marksheet.validation = validation;
      marksheet.extractionConfidence = confidence;
      marksheet.requiresReview = needsReview;

      try {
        await MarksheetAuditLog.create({
          regNo: marksheet.regNo || '',
          studentName: marksheet.studentName || '',
          semester: marksheet.semester || null,
          page: marksheet.ocrMeta?.page || null,
          ocrMeta: marksheet.ocrMeta || {},
          rawText: marksheet.rawText || '',
          extracted: marksheet,
          validation,
          confidence
        });
      } catch (err) {
        console.warn('[Marksheet Upload] Failed to write audit log:', err.message);
      }
      if (!validation.isValid) {
        console.log(`[Marksheet Upload] Validation failed for regNo ${marksheet.regNo}:`, validation.errors);
        warnings.push({
          regNo: marksheet.regNo || 'Unknown',
          errors: validation.errors
        });
        // Still include invalid marksheet for preview with validation flag
        marksheet.studentId = marksheet.regNo;
        marksheet.matched = false;
        marksheet.isValid = false;
        marksheet.validationErrors = validation.errors;
        marksheet.validationWarnings = validation.warnings;
        marksheet.extractionConfidence = confidence;
        marksheet.requiresReview = true;

        try {
          const review = await MarksheetReview.create({
            status: 'pending',
            regNo: marksheet.regNo || '',
            studentName: marksheet.studentName || '',
            semester: marksheet.semester || null,
            page: marksheet.ocrMeta?.page || null,
            confidence,
            validation,
            extracted: marksheet,
            ocrMeta: marksheet.ocrMeta || {},
            source: 'PDF_UPLOAD',
            uploadedBy: req.user?._id || null
          });
          marksheet.reviewId = review._id;
        } catch (err) {
          console.warn('[Marksheet Upload] Failed to create review queue item:', err.message);
        }
        console.log(`[Marksheet Upload] Adding invalid marksheet to extractedMarksheets:`, marksheet.regNo);
        extractedMarksheets.push(marksheet);
        continue;
      }

      // Match student in database
      try {
        const match = await matchStudentFromDatabase(marksheet.regNo, marksheet.studentName, Student);
        
        if (!match.isMatched) {
          warnings.push({
            regNo: marksheet.regNo,
            warning: match.warning,
            studentName: marksheet.studentName
          });
          // Still add unmatched student for preview
          marksheet.studentId = marksheet.regNo;
          marksheet.matched = false;
          extractedMarksheets.push(marksheet);
          continue;
        }

        // Add warnings if name mismatch
        if (match.warning) {
          warnings.push({
            regNo: marksheet.regNo,
            warning: match.warning,
            severity: 'info'
          });
        }

        // Add student info to marksheet
        const ocrName = (marksheet.studentName || '').trim();
        const dbName = buildStudentFullName(match.student);
        const finalName = dbName || ocrName;
        const normalizedFinalName = normalizeStudentName(finalName);

        marksheet.studentName = normalizedFinalName;

        console.log('📛 OCR NAME:', ocrName);
        console.log('📛 DB NAME:', dbName);
        console.log('✅ FINAL NAME:', normalizedFinalName);

        marksheet.studentId = match.student._id;
        marksheet.matched = true;
        marksheet.isValid = validation.isValid;
        marksheet.validationErrors = validation.errors;
        marksheet.validationWarnings = validation.warnings;
        marksheet.extractionConfidence = confidence;
        marksheet.requiresReview = needsReview;

        if (needsReview) {
          try {
            const review = await MarksheetReview.create({
              status: 'pending',
              regNo: marksheet.regNo || '',
              studentName: marksheet.studentName || '',
              semester: marksheet.semester || null,
              page: marksheet.ocrMeta?.page || null,
              confidence,
              validation,
              extracted: marksheet,
              ocrMeta: marksheet.ocrMeta || {},
              source: 'PDF_UPLOAD',
              uploadedBy: req.user?._id || null
            });
            marksheet.reviewId = review._id;
          } catch (err) {
            console.warn('[Marksheet Upload] Failed to create review queue item:', err.message);
          }
        }

        extractedMarksheets.push(marksheet);
        totalMatched++;
      } catch (error) {
        warnings.push({
          regNo: marksheet.regNo,
          error: error.message
        });
        // Still include in preview even if error
        marksheet.studentId = marksheet.regNo;
        marksheet.matched = false;
        extractedMarksheets.push(marksheet);
      }
    }

    console.log(`[Marksheet Upload] Matched ${totalMatched} out of ${marksheets.length} marksheets`);

    // ─────────────────────────────────────────────────────────
    // 4. Return preview for user confirmation
    // ─────────────────────────────────────────────────────────
    // Annotate extracted subjects with existing Subject info (credits) if present
    let existingSubjects = [];
    try {
      // Collect unique course codes, names, and semesters for deterministic lookups
      const courseCodes = new Set();
      const semesters = new Set();
      for (const m of extractedMarksheets) {
        const marksheetSemester = Number(m.semester);
        if (Number.isFinite(marksheetSemester) && marksheetSemester > 0) {
          semesters.add(marksheetSemester);
        }
        if (Array.isArray(m.subjects)) {
          for (const s of m.subjects) {
            const codeValue = String(s.courseCode || '').trim().toUpperCase();
            const subjectSemester = Number(s.semester ?? s.sem ?? null);

            if (codeValue) courseCodes.add(codeValue);
            if (Number.isFinite(subjectSemester) && subjectSemester > 0) {
              semesters.add(subjectSemester);
            }
          }
        }
      }

      const codesArray = Array.from(courseCodes);
      const semesterArray = Array.from(semesters);
      const orFilters = [];
      if (semesterArray.length > 0) {
        orFilters.push({ semester: { $in: semesterArray } }, { semester: null });
      }
      if (codesArray.length > 0) {
        orFilters.push({ courseCode: { $in: codesArray } });
      }

      const subjectQuery = orFilters.length > 0 ? { $or: orFilters } : {};
      existingSubjects = await Subject.find(
        subjectQuery,
        'courseCode courseName credits semester year'
      ).lean();
      const subjectLookup = buildSubjectLookup(existingSubjects);
      const subjectNameLookup = buildSubjectNameLookup(existingSubjects);

      // Attach flags to extracted marksheets and apply corrections
      for (const m of extractedMarksheets) {
        if (!Array.isArray(m.subjects)) continue;
        let correctionCount = 0;

        const { normalizeSubjectName } = require('../services/subjectNormalizer');

        for (const s of m.subjects) {
          const rawCode = String(s.courseCode || '').trim().toUpperCase();
          let rawName = String(s.courseName || '').trim();

          const confidence = s.confidence !== undefined ? s.confidence : 1.0;
          const normResult = normalizeSubjectName(rawName, confidence);
          s.courseName = normResult.normalized;
          rawName = normResult.normalized;

          if (normResult.shouldReview) {
            s.reviewStatus = 'NEEDS_REVIEW';
            s.warnings = s.warnings || [];
            s.warnings.push('Low OCR confidence score. Manual review required.');
          }

          if (rawCode) {
            s.courseCode = rawCode;
          }

          // 1. Correction Memory match strategy (Phase B & Phase G)
          if (rawCode) {
            const historicCorrection = await CorrectionMemory.findOne({
              field: 'courseCode',
              originalValue: rawCode,
              approvalStatus: 'APPROVED'
            }).lean();

            if (historicCorrection) {
              const learnedCode = historicCorrection.correctedValue;
              const learnedMatch = subjectLookup[learnedCode];
              if (learnedMatch) {
                s.existsInMaster = true;
                s.masterCredits = learnedMatch.credits ?? null;
                s.masterSemester = learnedMatch.semester ?? null;
                s.masterYear = learnedMatch.year ?? null;
                s.credits = learnedMatch.credits ?? null;
                s.originalCourseName = rawName;
                s.courseCode = learnedCode;
                s.matchMethod = 'CORRECTION_MEMORY';
                s.matchConfidence = 0.95;
                s.correctionReason = `Learned correction applied: mapped '${rawCode}' to '${learnedCode}' based on historic coordinator edits.`;
                if (learnedMatch.courseName && learnedMatch.courseName !== rawName) {
                  s.courseName = learnedMatch.courseName;
                  s.correctedFromMaster = true;
                }
                if (s.semester === undefined || s.semester === null || s.semester === '') {
                  s.semester = learnedMatch.semester ?? null;
                }
                if (s.year === undefined || s.year === null || s.year === '') {
                  s.year = learnedMatch.year ?? null;
                }
                console.log(`[LEARNED CORRECTION] Mapped ${rawCode} -> ${learnedCode}`);
                continue;
              }
            }
          }

          const exactMatch = rawCode ? subjectLookup[rawCode] : null;
          if (exactMatch) {
            s.existsInMaster = true;
            s.masterCredits = exactMatch.credits ?? null;
            s.masterSemester = exactMatch.semester ?? null;
            s.masterYear = exactMatch.year ?? null;
            s.credits = exactMatch.credits ?? null;
            s.originalCourseName = rawName;
            s.matchMethod = 'EXACT_CODE';
            s.matchConfidence = 1.0;
            s.correctionReason = 'Exact match found in the master database by course code.';
            if (exactMatch.courseName && exactMatch.courseName !== rawName) {
              s.courseName = exactMatch.courseName;
              s.correctedFromMaster = true;
            }
            if (s.semester === undefined || s.semester === null || s.semester === '') {
              s.semester = exactMatch.semester ?? null;
            }
            if (s.year === undefined || s.year === null || s.year === '') {
              s.year = exactMatch.year ?? null;
            }
            console.log(`[MATCH FOUND] ${rawCode} -> credits=${s.credits}`);
            continue;
          }

          const corrected = rawCode ? matchCourseCode(rawCode, subjectLookup, 1) : { match: null };
          if (corrected.match) {
            correctionCount += 1;
            s.correctedCourseCode = corrected.correctedCode;
            s.courseCode = corrected.correctedCode;
            s.originalCourseName = rawName;
            s.matchMethod = 'FUZZY_CODE';
            s.matchConfidence = corrected.distance === 0 ? 1.0 : Number((1 - (corrected.distance / Math.max(rawCode.length, corrected.correctedCode.length))).toFixed(3));
            s.correctionReason = `Course code corrected from '${rawCode}' via master list distance mapping.`;
            if (corrected.match.courseName && corrected.match.courseName !== rawName) {
              s.courseName = corrected.match.courseName;
              s.correctedFromMaster = true;
            }
            s.masterCredits = corrected.match.credits ?? null;
            s.masterSemester = corrected.match.semester ?? null;
            s.masterYear = corrected.match.year ?? null;
            s.credits = corrected.match.credits ?? null;
            if (s.semester === undefined || s.semester === null || s.semester === '') {
              s.semester = corrected.match.semester ?? null;
            }
            if (s.year === undefined || s.year === null || s.year === '') {
              s.year = corrected.match.year ?? null;
            }
            s.existsInMaster = true;
            s.correctedFromMaster = true;
            console.log(`[MATCH FOUND] ${rawCode} -> corrected=${corrected.correctedCode} credits=${s.credits}`);
            continue;
          }

          const nameMatch = rawName ? matchSubjectName(rawName, subjectNameLookup) : null;
          if (nameMatch && nameMatch.match) {
            s.existsInMaster = true;
            s.masterCredits = nameMatch.match.credits ?? null;
            s.masterSemester = nameMatch.match.semester ?? null;
            s.masterYear = nameMatch.match.year ?? null;
            s.credits = nameMatch.match.credits ?? null;
            s.originalCourseName = rawName;
            s.matchMethod = nameMatch.exact ? 'EXACT_NAME' : 'FUZZY_NAME';
            s.matchConfidence = Number(nameMatch.similarity.toFixed(3));
            s.courseName = nameMatch.match.courseName;
            s.correctedFromMaster = true;
            s.correctionReason = nameMatch.exact 
              ? 'Course name matches database exactly. Course code resolved from master database.' 
              : `Course name matched database via fuzzy similarity (${Math.round(nameMatch.similarity * 100)}%). Course code resolved.`;
            
            if (!rawCode && nameMatch.match.courseCode) {
              s.courseCode = String(nameMatch.match.courseCode).trim().toUpperCase();
            }
            
            if (!nameMatch.exact) {
              s.warnings = s.warnings || [];
              s.warnings.push(`Fuzzy matched course name '${rawName}' to DB '${nameMatch.match.courseName}' (${Math.round(nameMatch.similarity * 100)}% similarity)`);
              if (nameMatch.similarity < 0.90) {
                s.errors = s.errors || [];
                s.errors.push(`Low similarity subject name match (${Math.round(nameMatch.similarity * 100)}%). Manual review required.`);
              }
            }

            if (s.semester === undefined || s.semester === null || s.semester === '') {
              s.semester = nameMatch.match.semester ?? null;
            }
            if (s.year === undefined || s.year === null || s.year === '') {
              s.year = nameMatch.match.year ?? null;
            }
            console.log(`[NAME MATCH] "${rawName || '--'}" matched DB subject ${nameMatch.match.courseCode || ''}`);
            continue;
          }

          // 4. Semantic similarity match strategy (Phase G / Component 1)
          if (rawName) {
            const semanticMatch = matchSubjectSemantic(rawName, subjectNameLookup);
            if (semanticMatch && semanticMatch.match) {
              s.existsInMaster = true;
              s.masterCredits = semanticMatch.match.credits ?? null;
              s.masterSemester = semanticMatch.match.semester ?? null;
              s.masterYear = semanticMatch.match.year ?? null;
              s.credits = semanticMatch.match.credits ?? null;
              s.originalCourseName = rawName;
              s.matchMethod = 'SEMANTIC_NAME';
              s.matchConfidence = Number(semanticMatch.similarity.toFixed(3));
              s.courseName = semanticMatch.match.courseName;
              s.correctedFromMaster = true;
              s.correctionReason = `Subject matched via vector N-gram cosine similarity (${Math.round(semanticMatch.similarity * 100)}%).`;
              
              if (!rawCode && semanticMatch.match.courseCode) {
                s.courseCode = String(semanticMatch.match.courseCode).trim().toUpperCase();
              }
              if (s.semester === undefined || s.semester === null || s.semester === '') {
                s.semester = semanticMatch.match.semester ?? null;
              }
              if (s.year === undefined || s.year === null || s.year === '') {
                s.year = semanticMatch.match.year ?? null;
              }
              console.log(`[SEMANTIC MATCH] "${rawName}" matched DB subject ${semanticMatch.match.courseCode}`);
              continue;
            }
          }

           s.existsInMaster = false;
           s.masterCredits = null;
           s.masterSemester = null;
           s.masterYear = null;
           s.credits = null;
           s.matchMethod = 'NOMATCH';
           s.matchConfidence = 0.0;
           s.correctionReason = 'No matching subject found in the database by course code or course name.';
           console.log(`[MATCH FAILED] ${rawCode || rawName || 'UNKNOWN'} -> no subject found`);
         }

         // Propagate subject-level errors and warnings to the parent marksheet level
         let subjectLookupErrors = 0;
         let subjectLookupWarnings = 0;

         for (const s of m.subjects) {
           if (!s.existsInMaster) {
             subjectLookupWarnings += 1;
             m.validationWarnings = m.validationWarnings || [];
             m.validationWarnings.push(`Subject code ${s.courseCode || '--'} not found in database master table`);
           }
           if (s.errors && s.errors.length > 0) {
             subjectLookupErrors += s.errors.length;
             m.validationErrors = m.validationErrors || [];
             for (const err of s.errors) {
               m.validationErrors.push(err);
             }
           }
           if (s.warnings && s.warnings.length > 0) {
             subjectLookupWarnings += s.warnings.length;
             m.validationWarnings = m.validationWarnings || [];
             for (const warn of s.warnings) {
               m.validationWarnings.push(warn);
             }
           }
         }

         if (subjectLookupErrors > 0) {
           m.isValid = false;
           m.validation.isValid = false;
           m.requiresReview = true;
           m.validationErrors = m.validationErrors || [];
           m.validation.errors = m.validation.errors || [];
           for (const err of m.validationErrors) {
             if (!m.validation.errors.includes(err)) {
               m.validation.errors.push(err);
             }
           }
         }

         if (subjectLookupWarnings > 0) {
           m.validationWarnings = m.validationWarnings || [];
           m.validation.warnings = m.validation.warnings || [];
           for (const warn of m.validationWarnings) {
             if (!m.validation.warnings.includes(warn)) {
               m.validation.warnings.push(warn);
             }
           }
         }

         if (correctionCount > 0) {
           m.validationWarnings = m.validationWarnings || [];
           m.validationWarnings.push(`Auto-corrected ${correctionCount} course code(s) from master list`);
           m.extractionConfidence = Math.max(0, (m.extractionConfidence || 0) - (0.02 * correctionCount));
         }
          const regulation = detectRegulationFromCodes(m.subjects, m.rawText || '');
          m.regulation = regulation;
          m.detectedRegulation = regulation;

          // Categorize marksheet into human review queues (Phase 14)
          let reviewStatus = 'AUTO_ACCEPTED';
          const finalConf = m.extractionConfidence || 1.0;
          const hasValidationErrors = m.validation && m.validation.errors && m.validation.errors.length > 0;
          const hasValidationWarnings = m.validation && m.validation.warnings && m.validation.warnings.length > 0;
          
          if (finalConf < 0.70 || hasValidationErrors || m.requiresReview) {
            reviewStatus = 'MANUAL_REVIEW_REQUIRED';
          } else if (finalConf < 0.85 || hasValidationWarnings) {
            reviewStatus = 'NEEDS_REVIEW';
          }
          
          m.reviewStatus = reviewStatus;
          
          // Propagate to subjects
          if (Array.isArray(m.subjects)) {
            for (const s of m.subjects) {
              s.confidence = s.matchConfidence ? Math.round(s.matchConfidence * 100) : Math.round(finalConf * 100);
              let sReview = 'AUTO_ACCEPTED';
              if (s.confidence < 70 || (s.errors && s.errors.length > 0)) {
                sReview = 'MANUAL_REVIEW_REQUIRED';
              } else if (s.confidence < 85 || (s.warnings && s.warnings.length > 0) || !s.existsInMaster) {
                sReview = 'NEEDS_REVIEW';
              }
              s.reviewStatus = sReview;
            }
          }

       }
    } catch (err) {
      console.warn('[Marksheet Upload] Could not annotate subjects with master list:', err.message);
    }

    const extractedPdfName = req.file?.originalname || '';

    // Generate unique uploadId format SEM_UPLOAD_YYYYMMDD_XXX
    let uploadId;
    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const prefix = `SEM_UPLOAD_${year}${month}${day}_`;
      
      const latestHistory = await SemesterUploadHistory.findOne({
        uploadId: new RegExp('^' + prefix)
      }).sort({ uploadId: -1 }).lean();
      
      let nextNum = 1;
      if (latestHistory && latestHistory.uploadId) {
        const parts = latestHistory.uploadId.split('_');
        const lastPart = parts[parts.length - 1];
        const parsedNum = parseInt(lastPart, 10);
        if (!isNaN(parsedNum)) {
          nextNum = parsedNum + 1;
        }
      }
      uploadId = `${prefix}${String(nextNum).padStart(3, '0')}`;
      console.log(`Generated uploadId: ${uploadId}`);
    } catch (idErr) {
      console.error('Failed to generate uploadId, using timestamp fallback:', idErr);
      uploadId = `SEM_UPLOAD_${Date.now()}`;
    }

    // Upload the PDF file to GridFS student_files bucket
    let gridfsFileId = null;
    let gridfsFileUrl = null;
    try {
      const { GridFSBucket } = require('mongodb');
      const { Readable } = require('stream');
      const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'student_files' });
      
      const filename = `${Date.now()}_${req.file.originalname}`;
      const readable = new Readable();
      readable.push(req.file.buffer);
      readable.push(null);

      const uploadStream = bucket.openUploadStream(filename, {
        contentType: req.file.mimetype,
        metadata: { category: 'semester_marksheet', originalName: req.file.originalname }
      });

      gridfsFileId = await new Promise((resolve, reject) => {
        readable.pipe(uploadStream)
          .on('error', reject)
          .on('finish', () => resolve(uploadStream.id.toString()));
      });
      gridfsFileUrl = `/api/file/${gridfsFileId}`;
      console.log(`✅ Uploaded marksheet PDF to GridFS: ${gridfsFileId}`);
    } catch (gridfsErr) {
      console.error('❌ Failed to upload PDF to GridFS:', gridfsErr);
    }

    extractedMarksheets.forEach((marksheet) => {
      if (marksheet.submitted === undefined) {
        marksheet.submitted = false;
      }
      if (!marksheet.extractedPdfName) {
        marksheet.extractedPdfName = extractedPdfName;
      }
    });

    let autoSaveResult = { saved: 0 };
    try {
      if (jobId && marksheets) {
        updateProgress(jobId, {
          totalMarksheets: marksheets.length,
          processedMarksheets: marksheets.length,
          currentRegisterNo: '',
          currentStage: 'Saving',
          status: 'processing'
        });
      }
      console.log('📦 AUTO SAVING SEMESTER RECORDS...', extractedMarksheets.length);
      autoSaveResult = await autoSaveSemesterRecords({
        extractedMarksheets,
        extractedPdfName,
        uploadedBy: req.user?.fullName || req.user?.username || 'Coordinator',
        semester: req.body?.semester,
        uploadId,
        gridfsFileId,
        gridfsFileUrl
      });
      console.log(`✅ Semester records saved: ${autoSaveResult.saved}`);
    } catch (autoSaveError) {
      console.error('Semester auto-save failed', autoSaveError);
    }

    console.log('[Marksheet Upload] Response names:', extractedMarksheets.map((m) => ({
      regNo: m.regNo,
      studentName: m.studentName
    })));

    // ─────────────────────────────────────────────────────────
    // Missing Subject Detection (Stage 10) & Debug logging (Stage 9)
    // ─────────────────────────────────────────────────────────
    const missingSubjects = [];
    for (const m of extractedMarksheets) {
      const studentSem = Number(m.semester);
      if (!studentSem) continue;

      // Find expected subjects for this semester in the database master list
      const expectedForSem = (existingSubjects || []).filter(sub => sub.semester === studentSem);

      if (expectedForSem.length === 0) {
        missingSubjects.push({
          registerNumber: m.regNo || 'Unknown',
          studentName: m.studentName || 'Unknown',
          courseCode: 'N/A',
          courseName: 'N/A',
          pipelineStage: 'Database / Curriculum Validation',
          reason: `Database Coverage Unknown (No expected subjects found in the database curriculum for semester ${studentSem})`,
          confidence: 0.0,
          tr_id: null
        });
        continue;
      }

      const extractedCodes = new Set(m.subjects.map(s => s.courseCode));
      const rawTextUpper = (m.rawText || '').toUpperCase();

      for (const expSub of expectedForSem) {
        if (!extractedCodes.has(expSub.courseCode)) {
          // Check if course code is present in raw text
          const isInRawText = rawTextUpper.includes(expSub.courseCode);
          
          // Find matching tracer ID from OCR lines metadata if present
          let matchingTrId = null;
          if (m.ocrMeta && Array.isArray(m.ocrMeta.lines)) {
            const matchLine = m.ocrMeta.lines.find(line => (line.text || '').toUpperCase().includes(expSub.courseCode));
            if (matchLine) {
              matchingTrId = matchLine.tr_id;
            }
          }

          missingSubjects.push({
            registerNumber: m.regNo || 'Unknown',
            studentName: m.studentName || 'Unknown',
            courseCode: expSub.courseCode,
            courseName: expSub.courseName,
            pipelineStage: isInRawText ? 'Subject Builder' : 'OCR / Line Detection',
            reason: isInRawText 
              ? 'Lost in Subject Builder (likely coordinate clustering or split OCR row issues)' 
              : 'Not found in raw OCR text (OCR failed to recognize it or page image is low quality)',
            confidence: isInRawText ? 0.70 : 0.0,
            tr_id: matchingTrId
          });
        }
      }
    }

    if (debugEnabled) {
      try {
        const fs = require('fs');
        const path = require('path');
        const debugDir = 'd:/Placement-Portal/debug';
        if (!fs.existsSync(debugDir)) {
          fs.mkdirSync(debugDir, { recursive: true });
        }
        
        // Save missing_subjects.json (Stage 10)
        fs.writeFileSync(
          path.join(debugDir, 'missing_subjects.json'),
          JSON.stringify(missingSubjects, null, 2),
          'utf-8'
        );
        
        // Save backend.json (Stage 9)
        const debugResponse = {
          success: true,
          uploadId,
          extractedMarksheets,
          extractedPdfName,
          savedCount: autoSaveResult.saved,
          warnings,
          summary: {
            totalExtracted: marksheets.length,
            totalMatched,
            totalWarnings: warnings.length,
            readyToConfirm: totalMatched > 0
          }
        };
        fs.writeFileSync(
          path.join(debugDir, 'backend.json'),
          JSON.stringify(debugResponse, null, 2),
          'utf-8'
        );
        runPipelineIntegrityValidator(extractedMarksheets, debugEnabled);
      } catch (debugErr) {
        console.error('[DEBUG FILE WRITE ERROR]', debugErr.message);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[OCR AUDIT] ${new Date().toISOString()} - Upload success for user=${userId}, file=${req.file.originalname}, duration=${duration}s, count=${marksheets.length}`);

    if (jobId && marksheets) {
      updateProgress(jobId, {
        totalMarksheets: marksheets.length,
        processedMarksheets: marksheets.length,
        currentRegisterNo: '',
        currentStage: 'Completed ✓',
        status: 'completed'
      });
    }

    res.status(200).json({
      success: true,
      uploadId,
      extractedMarksheets,
      extractedPdfName,
      savedCount: autoSaveResult.saved,
      warnings,
      summary: {
        totalExtracted: marksheets.length,
        totalMatched,
        totalWarnings: warnings.length,
        readyToConfirm: totalMatched > 0
      },
      sessionId: req.sessionID // Client can use to confirm upload
    });
  } catch (error) {
    console.error('[Marksheet Upload] Error:', error);
    res.status(500).json({
      error: 'Internal server error during marksheet processing',
      details: error.message
    });
  }
});

/**
 * POST /upload-async
 * Enqueue OCR extraction for background processing
 */
router.post('/upload-async', coordinatorAuth, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const job = await marksheetQueue.add('extract', {
      pdfBase64: req.file.buffer.toString('base64'),
      semester: req.body?.semester ? Number(req.body.semester) : null,
      uploaderId: req.user?._id || null
    });

    return res.status(202).json({ success: true, jobId: job.id });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to enqueue OCR job', details: err.message });
  }
});

/**
 * POST /confirm
 * Confirm extracted marksheets and save to database
 * 
 * Request:
 *   - marksheets: Array of marksheet objects to confirm
 *   - semester: Semester number
 * 
 * Response:
 *   - saved: Count of successfully saved marksheets
 *   - failed: Array of failures
 */
router.post('/confirm', coordinatorAuth, async (req, res) => {
  try {
    const { marksheets, semester, forceSave } = req.body;
    const coordinatorId = req.user._id;

    if (!marksheets || !Array.isArray(marksheets) || marksheets.length === 0) {
      return res.status(400).json({ error: 'No marksheets provided for confirmation' });
    }

    if (!semester) {
      return res.status(400).json({ error: 'Semester is required' });
    }

    // ─────────────────────────────────────────────────────────
    // 1. Build Subject Lookup (Create if not exist)
    // ─────────────────────────────────────────────────────────
    const allCourses = new Map();
    for (const marksheet of marksheets) {
      for (const subject of marksheet.subjects) {
        if (!allCourses.has(subject.courseCode)) {
          allCourses.set(subject.courseCode, subject);
        }
      }
    }

    // Upsert subjects to database (ensure credits stored as number)
    for (const [courseCode, courseData] of allCourses) {
      const semesterNumber = Number(courseData.semester || semester) || null;
      const creditsValue = Number(courseData.credits ?? courseData.masterCredits) || 0;
      await Subject.updateOne(
        { courseCode },
        {
          $set: {
            courseCode,
            courseName: courseData.courseName,
            credits: creditsValue,
            semester: semesterNumber,
            year: getAcademicYearFromSemester(semesterNumber)
          }
        },
        { upsert: true }
      );
    }

    console.log(`[Confirm Marksheets] Processed ${allCourses.size} unique subjects`);

    // ─────────────────────────────────────────────────────────
    // 2. Save marksheets and update student records (atomic transactions)
    // ─────────────────────────────────────────────────────────
    const saved = [];
    const failed = [];

    // Grade -> points mapping (KSRCE)
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

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        for (const marksheet of marksheets) {
          if (marksheet.requiresReview && !forceSave) {
            failed.push({
              regNo: marksheet.regNo,
              error: 'Marksheet requires manual review before saving',
              reviewId: marksheet.reviewId || null
            });
            continue;
          }
          try {
            const studentId = marksheet.studentId;
            const currentSem = parseInt(semester, 10);

            // Fetch student
            const student = await Student.findById(studentId).session(session);
            if (!student) throw new Error('Student not found');

            // Build subjects for current semester and collect older-semester subjects
            const currentSubjects = [];
            const olderSubjects = [];

            for (const s of marksheet.subjects) {
              const subj = {
                courseCode: (s.courseCode || '').toUpperCase(),
                courseName: s.courseName || s.course || '',
                credits: Number(s.credits || s.masterCredits || 0),
                grade: (s.grade || '').toString().trim(),
                result: (s.result || '').toString().trim() || 'P',
                confidence: s.confidence,
                reviewStatus: s.reviewStatus
              };

              // Self learning logs (Phase B)
              const originalCode = s.originalCourseCode || s.courseCode;
              const originalName = s.originalCourseName || s.courseName;
              if (originalCode && originalCode !== subj.courseCode) {
                await CorrectionMemory.create([{
                  originalValue: originalCode,
                  correctedValue: subj.courseCode,
                  field: 'courseCode',
                  layoutSignature: marksheet.ocrMeta?.documentType || 'unknown',
                  regulation: marksheet.regulation || 'Regulation 2020',
                  university: marksheet.university || 'KSR',
                  approvalStatus: 'APPROVED'
                }], { session });
              }
              if (originalName && originalName !== subj.courseName) {
                await CorrectionMemory.create([{
                  originalValue: originalName,
                  correctedValue: subj.courseName,
                  field: 'courseName',
                  layoutSignature: marksheet.ocrMeta?.documentType || 'unknown',
                  regulation: marksheet.regulation || 'Regulation 2020',
                  university: marksheet.university || 'KSR',
                  approvalStatus: 'APPROVED'
                }], { session });
              }

              const subjSem = Number(s.semester || currentSem);
              if (subjSem < currentSem) {
                olderSubjects.push(Object.assign({}, subj, { semester: subjSem }));
              } else {
                currentSubjects.push(subj);
              }
            }

            // 1) Update older semester records: mark subject as cleared in older semester
            for (const os of olderSubjects) {
              // Try to update existing older semester marksheet subject to cleared
              const filter = {
                studentId,
                semester: os.semester,
                'subjects.courseCode': os.courseCode
              };
              const update = {
                $set: {
                  'subjects.$.result': 'P',
                  'subjects.$.clearedInSemester': currentSem,
                  'subjects.$.clearedGrade': os.grade
                }
              };

              const updatedOlder = await StudentMarksheet.findOneAndUpdate(filter, update, {
                session,
                new: true
              });

              // If older semester marksheet not found, create minimal older semester doc
              if (!updatedOlder) {
                const createOlder = new StudentMarksheet({
                  studentId,
                  regNo: marksheet.regNo,
                  studentName: marksheet.studentName,
                  semester: os.semester,
                  examDate: marksheet.examDate || '',
                  programme: marksheet.programme || '',
                  subjects: [Object.assign({}, os, { result: 'P', clearedInSemester: currentSem, clearedGrade: os.grade })],
                  uploadedBy: coordinatorId,
                  importedFrom: 'PDF_UPLOAD'
                });
                await createOlder.save({ session });
              }
            }

            // 2) Compute SGPA for current semester
            let totalCredits = 0;
            let totalPoints = 0;
            let hasFail = false;

            for (const cs of currentSubjects) {
              const grade = (cs.grade || '').toUpperCase();
              const points = GRADE_POINTS.hasOwnProperty(grade) ? GRADE_POINTS[grade] : 0;
              totalCredits += Number(cs.credits || 0);
              totalPoints += Number(cs.credits || 0) * points;
              if (grade === 'U' || grade === 'RA' || cs.result === 'F' || cs.result === 'AB') {
                hasFail = true;
              }
            }

            let sgpa = null;
            if (!hasFail && totalCredits > 0) {
              sgpa = +(totalPoints / totalCredits).toFixed(2);
            }

            // Prepare marksheet payload for current semester
            const marksheetPayload = {
              studentId,
              regNo: marksheet.regNo,
              studentName: marksheet.studentName,
              programme: marksheet.programme || '',
              examDate: marksheet.examDate || '',
              semester: currentSem,
              subjects: currentSubjects.map(s => ({
                courseCode: s.courseCode,
                courseName: s.courseName,
                credits: s.credits || 0,
                grade: s.grade,
                result: (s.grade === 'U' || s.grade === 'RA') ? 'F' : (s.result || 'P'),
                isArrear: (s.grade === 'U' || s.grade === 'RA' || s.result === 'F' || s.result === 'AB'),
                confidence: s.confidence || 100,
                reviewStatus: s.reviewStatus || 'AUTO_ACCEPTED'
              })),
              sgpa,
              totalCredits,
              uploadedBy: coordinatorId,
              importedFrom: 'PDF_UPLOAD',
              pdfFileName: req.file?.originalname || 'imported',
              extractionConfidence: marksheet.extractionConfidence || null,
              extractionWarnings: marksheet.validationWarnings || [],
              extractionMeta: marksheet.ocrMeta || {},
              reviewStatus: marksheet.reviewStatus || 'AUTO_ACCEPTED'
            };

            // Upsert current semester marksheet
            const upserted = await StudentMarksheet.findOneAndUpdate(
              { studentId, semester: currentSem },
              { $set: marksheetPayload },
              { upsert: true, new: true, session }
            );

            // 3) Update Student arrear history atomically
            const updatedArrearHistory = student.arrearHistory || [];
            const currentArears = [];

            // Process current subjects to update arrear history
            for (const subj of marksheetPayload.subjects) {
              if (subj.isArrear) {
                currentArears.push({
                  courseCode: subj.courseCode,
                  courseName: subj.courseName,
                  semester: currentSem,
                  grade: subj.grade
                });

                const exists = updatedArrearHistory.find(a => a.courseCode === subj.courseCode && !a.clearedInSemester);
                if (!exists) {
                  updatedArrearHistory.push({
                    semester: currentSem,
                    courseCode: subj.courseCode,
                    courseName: subj.courseName,
                    failedGrade: subj.grade,
                    clearedInSemester: null,
                    clearedGrade: null
                  });
                }
              } else {
                // If passed, clear any previous arrear in history
                const toClear = updatedArrearHistory.find(a => a.courseCode === subj.courseCode && !a.clearedInSemester);
                if (toClear) {
                  toClear.clearedInSemester = currentSem;
                  toClear.clearedGrade = subj.grade;
                }
              }
            }

            // Also, any olderSubjects we cleared above should be reflected in arrear history
            for (const os of olderSubjects) {
              const ah = updatedArrearHistory.find(a => a.courseCode === os.courseCode && !a.clearedInSemester);
              if (ah) {
                ah.clearedInSemester = currentSem;
                ah.clearedGrade = os.grade;
              }
            }

            student.arrearHistory = updatedArrearHistory;
            student.currentArears = currentArears;
            student.lastMarksheetUpdate = new Date();

            // Update student's semester GPA field if applicable
            if (currentSem <= 8) {
              student[`semester${currentSem}GPA`] = sgpa || '';
            }

            await student.save({ session });

            if (marksheet.reviewId) {
              await MarksheetReview.updateOne(
                { _id: marksheet.reviewId },
                { $set: { status: 'resolved', resolvedBy: coordinatorId, resolvedAt: new Date() } },
                { session }
              );
            }

            saved.push({ regNo: marksheet.regNo, studentName: marksheet.studentName, studentId, success: true });
          } catch (innerErr) {
            failed.push({ regNo: marksheet.regNo, error: innerErr.message });
            console.error(`[Confirm] Failed to save ${marksheet.regNo}:`, innerErr.message);
            // Abort the transaction by throwing
            throw innerErr;
          }
        }
      });
    } catch (txErr) {
      console.error('[Confirm Marksheets] Transaction failed:', txErr.message);
      return res.status(500).json({ error: 'Transaction failed', details: txErr.message });
    } finally {
      session.endSession();
    }

    res.status(200).json({
      success: true,
      saved: saved.length,
      failed: failed.length,
      details: {
        saved,
        failed
      }
    });
  } catch (error) {
    console.error('[Confirm Marksheets] Error:', error);
    res.status(500).json({
      error: 'Error confirming marksheets',
      details: error.message
    });
  }
});

/**
 * GET /student/:studentId
 * Get all marksheets for a student
 */
router.get('/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const marksheets = await StudentMarksheet.find({ studentId })
      .sort({ semester: 1 });

    if (!marksheets || marksheets.length === 0) {
      return res.status(404).json({
        message: 'No marksheets found for this student'
      });
    }

    res.status(200).json({
      success: true,
      count: marksheets.length,
      marksheets
    });
  } catch (error) {
    console.error('[Get Student Marksheets] Error:', error);
    res.status(500).json({
      error: 'Error retrieving marksheets',
      details: error.message
    });
  }
});

/**
 * GET /semester/:studentId/:semester
 * Get marksheet for a specific semester
 */
router.get('/semester/:studentId/:semester', async (req, res) => {
  try {
    const { studentId, semester } = req.params;

    const marksheet = await StudentMarksheet.findOne({
      studentId,
      semester: parseInt(semester, 10)
    });

    if (!marksheet) {
      return res.status(404).json({
        message: `No marksheet found for semester ${semester}`
      });
    }

    res.status(200).json({
      success: true,
      marksheet
    });
  } catch (error) {
    console.error('[Get Semester Marksheet] Error:', error);
    res.status(500).json({
      error: 'Error retrieving marksheet',
      details: error.message
    });
  }
});

module.exports = router;

function runPipelineIntegrityValidator(extractedMarksheets, debugEnabled) {
  const integrityReports = [];
  
  for (const m of extractedMarksheets) {
    const telemetry = m.ocrMeta?.integrity_telemetry || {};
    const ocrLines = telemetry.ocr_lines || 0;
    const detectedCourseCodes = telemetry.detected_course_codes || 0;
    const logicalRows = telemetry.logical_rows || 0;
    const subjectObjects = telemetry.subject_objects || 0;
    const validatedSubjects = telemetry.validated_subjects || 0;
    
    const backendSubjects = m.subjects?.length || 0;
    const apiResponseCount = backendSubjects; // Sent directly in response
    
    // Check for mismatches
    let status = 'SUCCESS';
    let failedStage = null;
    let missingObjectsCount = 0;
    let cause = null;
    
    if (validatedSubjects !== backendSubjects) {
      status = 'FAILED';
      failedStage = 'Backend Mapping (normalizeSubject)';
      missingObjectsCount = Math.abs(validatedSubjects - backendSubjects);
      cause = 'Accidental filtering, duplicate detection, or mapping exception in Express service layer';
    } else if (subjectObjects !== validatedSubjects) {
      status = 'WARNING';
      failedStage = 'OCR Layout Filter (subject_builder)';
      missingObjectsCount = Math.abs(subjectObjects - validatedSubjects);
      cause = 'Dynamic repetitive headers/footers or blocked keywords matching';
    } else if (logicalRows !== subjectObjects) {
      status = 'WARNING';
      failedStage = 'OCR Subject Parser (subject_builder)';
      missingObjectsCount = Math.abs(logicalRows - subjectObjects);
      cause = 'Clustered row did not contain valid grade/credits formatting or course code pattern';
    }
    
    integrityReports.push({
      registerNumber: m.regNo || 'Unknown',
      studentName: m.studentName || 'Unknown',
      status,
      failedStage,
      missingObjectsCount,
      cause,
      stages: [
        { stage: '1. OCR Lines', count: ocrLines },
        { stage: '2. Course Codes', count: detectedCourseCodes },
        { stage: '3. Logical Rows', count: logicalRows },
        { stage: '4. Subject Objects', count: subjectObjects },
        { stage: '5. Validation', count: validatedSubjects },
        { stage: '6. Backend', count: backendSubjects },
        { stage: '7. API', count: apiResponseCount }
      ]
    });
  }

  console.log('📊 [Pipeline Integrity Validator] Run Completed.');
  for (const rep of integrityReports) {
    console.log(`   - Student: ${rep.studentName} (${rep.registerNumber}): Status = ${rep.status}`);
    if (rep.status !== 'SUCCESS') {
      console.warn(`     ⚠️ Mismatch in stage: ${rep.failedStage}. Missing: ${rep.missingObjectsCount}. Cause: ${rep.cause}`);
    }
  }

  if (debugEnabled) {
    try {
      const fs = require('fs');
      const path = require('path');
      const debugDir = 'd:/Placement-Portal/debug';
      fs.writeFileSync(
        path.join(debugDir, 'pipeline_integrity_report.json'),
        JSON.stringify(integrityReports, null, 2),
        'utf-8'
      );
      console.log('📂 [Pipeline Integrity Validator] Saved pipeline_integrity_report.json to debug directory.');
    } catch (err) {
      console.error('Failed to write pipeline integrity report file:', err.message);
    }
  }

  return integrityReports;
}
