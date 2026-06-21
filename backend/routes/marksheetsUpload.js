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
  matchSubjectName
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

/**
 * POST /upload
 * Upload PDF and extract marksheets (preview before saving)
 * 
 * Request:
 *   - file: PDF file (multipart/form-data)
 *   - semester: (optional) semester number for metadata
 * 
 * Response:
 *   - extractedMarksheets: Array of extracted marksheet objects
 *   - warnings: Array of matching warnings/issues
 *   - totalExtracted: Count
 *   - totalMatched: Count of successfully matched students
 */
router.post('/upload', coordinatorAuth, upload.single('file'), async (req, res) => {
  try {
    // ─────────────────────────────────────────────────────────
    // 1. Validate file upload
    // ─────────────────────────────────────────────────────────
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('📤 Upload request received');
    console.log('📄 File:', req.file?.originalname || 'unknown');
    console.log('📘 Incoming semester:', req.body?.semester);

    console.log(`[Marksheet Upload] Processing file: ${req.file.originalname} (${req.file.size} bytes)`);

    // ─────────────────────────────────────────────────────────
    // 2. Extract marksheets from PDF
    // ─────────────────────────────────────────────────────────
    let marksheets;
    try {
      marksheets = await extractAllMarksheetsFromPDF(req.file.buffer, {
        semester: req.body?.semester ? Number(req.body.semester) : null
      });
    } catch (error) {
      console.error('[Marksheet Upload] Extraction failed:', error);
      return res.status(400).json({
        error: 'Failed to extract marksheets from PDF',
        details: error.message
      });
    }

    if (!marksheets || marksheets.length === 0) {
      return res.status(400).json({
        error: 'No marksheets found in PDF'
      });
    }

    console.log(`[Marksheet Upload] Extracted ${marksheets.length} marksheets`);
    console.log('🧠 OCR extraction completed');

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
      const existingSubjects = await Subject.find(
        subjectQuery,
        'courseCode courseName credits semester year'
      ).lean();
      const subjectLookup = buildSubjectLookup(existingSubjects);
      const subjectNameLookup = buildSubjectNameLookup(existingSubjects);

      // Attach flags to extracted marksheets and apply corrections
      for (const m of extractedMarksheets) {
        if (!Array.isArray(m.subjects)) continue;
        let correctionCount = 0;

        for (const s of m.subjects) {
          const rawCode = String(s.courseCode || '').trim().toUpperCase();
          const rawName = String(s.courseName || '').trim();

          if (rawCode) {
            s.courseCode = rawCode;
          }

          const exactMatch = rawCode ? subjectLookup[rawCode] : null;
          if (exactMatch) {
            s.existsInMaster = true;
            s.masterCredits = exactMatch.credits ?? null;
            s.masterSemester = exactMatch.semester ?? null;
            s.masterYear = exactMatch.year ?? null;
            s.credits = exactMatch.credits ?? null;
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
            s.courseName = corrected.match.courseName || s.courseName;
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
          if (nameMatch) {
            s.existsInMaster = true;
            s.masterCredits = nameMatch.credits ?? null;
            s.masterSemester = nameMatch.semester ?? null;
            s.masterYear = nameMatch.year ?? null;
            s.credits = nameMatch.credits ?? null;
            if (!rawCode && nameMatch.courseCode) {
              s.courseCode = String(nameMatch.courseCode).trim().toUpperCase();
            }
            if (!rawName && nameMatch.courseName) {
              s.courseName = nameMatch.courseName;
            }
            if (s.semester === undefined || s.semester === null || s.semester === '') {
              s.semester = nameMatch.semester ?? null;
            }
            if (s.year === undefined || s.year === null || s.year === '') {
              s.year = nameMatch.year ?? null;
            }
            console.log(`[NAME MATCH] "${rawName || '--'}" matched DB subject ${nameMatch.courseCode || ''}`);
            continue;
          }

          s.existsInMaster = false;
          s.masterCredits = null;
          s.masterSemester = null;
          s.masterYear = null;
          s.credits = null;
          console.log(`[MATCH FAILED] ${rawCode || rawName || 'UNKNOWN'} -> no subject found`);
        }

        if (correctionCount > 0) {
          m.validationWarnings = m.validationWarnings || [];
          m.validationWarnings.push(`Auto-corrected ${correctionCount} course code(s) from master list`);
          m.extractionConfidence = Math.max(0, (m.extractionConfidence || 0) - (0.02 * correctionCount));
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
      console.log('📦 AUTO SAVING SEMESTER RECORDS...', extractedMarksheets.length);
      autoSaveResult = await autoSaveSemesterRecords({
        extractedMarksheets,
        extractedPdfName,
        uploadedBy: req.user?.fullName || req.user?.username || 'Coordinator',
        semester: req.body?.semester,
        uploadId
      });
      console.log(`✅ Semester records saved: ${autoSaveResult.saved}`);
    } catch (autoSaveError) {
      console.error('Semester auto-save failed', autoSaveError);
    }

    console.log('[Marksheet Upload] Response names:', extractedMarksheets.map((m) => ({
      regNo: m.regNo,
      studentName: m.studentName
    })));

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
                result: (s.result || '').toString().trim() || 'P'
              };

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
                isArrear: (s.grade === 'U' || s.grade === 'RA' || s.result === 'F' || s.result === 'AB')
              })),
              sgpa,
              totalCredits,
              uploadedBy: coordinatorId,
              importedFrom: 'PDF_UPLOAD',
              pdfFileName: req.file?.originalname || 'imported',
              extractionConfidence: marksheet.extractionConfidence || null,
              extractionWarnings: marksheet.validationWarnings || [],
              extractionMeta: marksheet.ocrMeta || {}
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
