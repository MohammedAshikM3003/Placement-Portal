const express = require('express');
const router = express.Router();

const SemesterRecord = require('../models/SemesterRecord');
const SemesterUploadHistory = require('../models/SemesterUploadHistory');
const Notification = require('../models/Notification');
const Subject = require('../models/Subject');
const Student = require('../models/Student');
const { autoSaveSemesterRecords } = require('../services/semesterAutoSave');

const normalizeLookupValue = (value) => String(value || '').trim();

const buildSemesterSearchVariants = (query = {}) => {
  const extractedPdfName = normalizeLookupValue(query.extractedPdfName);
  const regNo = normalizeLookupValue(query.regNo);
  const registerNumber = normalizeLookupValue(query.registerNumber);
  const studentId = normalizeLookupValue(query.studentId);
  const semester = normalizeLookupValue(query.semester);
  const year = normalizeLookupValue(query.year);
  const uploadId = normalizeLookupValue(query.uploadId);
  const submitted = query.submitted !== undefined ? String(query.submitted) === 'true' : undefined;

  const baseQuery = {};
  if (extractedPdfName) baseQuery.extractedPdfName = extractedPdfName;
  if (semester) baseQuery.semester = semester;
  if (uploadId) baseQuery.uploadId = uploadId;
  if (submitted !== undefined) baseQuery.submitted = submitted;

  const identifierValues = [...new Set([regNo, registerNumber, studentId].filter(Boolean))];
  const identifierQueries = identifierValues.length
    ? identifierValues.flatMap((identifier) => ([
        { regNo: identifier },
        { registerNumber: identifier },
        { studentId: identifier }
      ]))
    : [{}];

  const variants = [];
  for (const identifierQuery of identifierQueries) {
    if (year) {
      variants.push({ ...baseQuery, ...identifierQuery, year });
    }
    variants.push({ ...baseQuery, ...identifierQuery });
  }

  if (!variants.length) {
    variants.push(baseQuery);
  }

  return variants;
};

const findSemesterRecords = async (query = {}) => {
  const variants = buildSemesterSearchVariants(query);

  for (const variant of variants) {
    const records = await SemesterRecord.find(variant)
      .sort({ semester: 1, uploadedAt: -1 })
      .lean();

    if (records.length) {
      return { records, matchedQuery: variant };
    }
  }

  return { records: [], matchedQuery: null };
};

const FAIL_GRADES = new Set(['U', 'RA', 'SA', 'W', 'WD', 'AB']);
const GRADE_POINTS = {
  O: 10,
  'A+': 9,
  A: 8,
  'B+': 7,
  B: 6,
  C: 5,
  U: 0,
  RA: 0,
  SA: 0,
  W: 0,
  WD: 0,
  AB: 0
};

const normalizeGrade = (value) => String(value || 'U').trim().toUpperCase();

const calculateSgpa = (subjects) => {
  const totals = subjects.reduce((acc, subject) => {
    const credits = Number(subject.credits) || 0;
    const points = GRADE_POINTS[subject.grade] ?? 0;
    return {
      credits: acc.credits + credits,
      points: acc.points + credits * points
    };
  }, { credits: 0, points: 0 });

  if (!totals.credits) return '0.0';
  return (totals.points / totals.credits).toFixed(1);
};

const updateSemesterRecord = async (req, res) => {
  try {
    console.log('✅ Updating semester record');

    const body = req.body || {};
    const recordId = req.params.id || body._id || body.id;
    const regNo = (body.regNo || body.registerNumber || '').toString().trim();
    const semester = (body.semester || '').toString().trim();
    const year = (body.year || '').toString().trim();
    const subjectsInput = Array.isArray(body.subjects) ? body.subjects : [];

    let record = null;
    if (recordId && /^[0-9a-f]{24}$/i.test(recordId)) {
      record = await SemesterRecord.findById(recordId);
    }

    if (!record && regNo && semester && year) {
      record = await SemesterRecord.findOne({
        regNo,
        semester,
        year
      });
    }

    if (!record && regNo && semester) {
      record = await SemesterRecord.findOne({
        regNo,
        semester
      });
    }

    if (!record) {
      if (!regNo || !semester) {
        return res.status(400).json({
          success: false,
          error: 'Missing register number or semester to initialize a new record'
        });
      }

      const studentDoc = await Student.findOne({
        $or: [
          { regNo: regNo },
          { registerNumber: regNo }
        ]
      }).lean();

      const studentId = studentDoc?._id || studentDoc?.id || null;
      const recordKey = [regNo, semester, year].map((part) => String(part || '').trim()).filter(Boolean).join(':');

      record = new SemesterRecord({
        recordKey,
        studentId,
        regNo,
        registerNumber: regNo,
        studentName: body.studentName || `${studentDoc?.firstName || ''} ${studentDoc?.lastName || ''}`.trim() || 'Unknown',
        semester,
        year: year || studentDoc?.currentYear || '',
        submitted: false,
        reviewed: false,
        uploadedBy: req.user?.fullName || req.user?.username || 'Coordinator'
      });
    }

    const normalizedSubjects = subjectsInput.map((subject) => {
      const courseCode = (subject.courseCode || subject.subjectCode || subject.code || '')
        .toString()
        .trim()
        .toUpperCase();
      const courseName = (subject.courseName || subject.subjectName || subject.name || '').toString().trim();
      const grade = normalizeGrade(subject.grade || subject.resultGrade);
      const status = FAIL_GRADES.has(grade) ? 'Arrear' : 'Cleared';
      const credits = Number(subject.credits) || 0;

      console.log('📘 Updating subject:', courseCode || courseName || 'UNKNOWN');

      return {
        courseCode,
        courseName,
        subjectCode: (subject.subjectCode || courseCode || '').toString().trim().toUpperCase(),
        subjectName: (subject.subjectName || courseName || '').toString().trim(),
        credits,
        grade,
        status
      };
    });

    console.log('📊 Recalculating SGPA');

    const recalculatedSgpa = calculateSgpa(normalizedSubjects);
    const recalculatedCgpa = recalculatedSgpa;
    const arrearSubjects = normalizedSubjects.filter((subject) => subject.status === 'Arrear').length;
    const clearedSubjects = normalizedSubjects.length - arrearSubjects;
    const allClearStudents = arrearSubjects ? 0 : 1;
    const arrearStudents = arrearSubjects ? 1 : 0;

    record.subjects = normalizedSubjects;
    record.sgpa = recalculatedSgpa;
    record.cgpa = recalculatedCgpa;
    record.arrearSubjects = arrearSubjects;
    record.clearedSubjects = clearedSubjects;
    record.allClearStudents = allClearStudents;
    record.arrearStudents = arrearStudents;

    const updatedRecord = await record.save();

    console.log('✅ Semester record updated successfully');

    return res.status(200).json({
      success: true,
      updatedRecord
    });
  } catch (error) {
    console.error('[Semester] Update failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update semester record',
      details: error.message
    });
  }
};

router.post('/auto-save', async (req, res) => {
  try {
    const body = req.body || {};
    const extractedPdfName = body.extractedPdfName || body.fileName || '';
    const extractedMarksheets = body.extractedMarksheets || body.marksheets || body.students || [];
    const uploadedBy = body.uploadedBy || req.user?.fullName || req.user?.username || 'Coordinator';
    const semester = body.semester || body.selectedSemester || '';

    const result = await autoSaveSemesterRecords({
      extractedMarksheets,
      extractedPdfName,
      uploadedBy,
      semester
    });

    return res.status(200).json({
      success: true,
      saved: result.saved,
      records: result.records
    });
  } catch (error) {
    console.error('[Semester] Auto-save failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to auto-save semester records',
      details: error.message
    });
  }
});

router.put('/submit', async (req, res) => {
  try {
    const extractedPdfName = (req.body?.extractedPdfName || '').toString().trim();
    const uploadId = (req.body?.uploadId || '').toString().trim();
    const year = (req.body?.year || '').toString().trim();
    const semester = req.body?.semester ? parseInt(req.body.semester, 10) : null;

    if (!extractedPdfName) {
      return res.status(400).json({
        success: false,
        error: 'extractedPdfName is required'
      });
    }

    if (!uploadId) {
      return res.status(400).json({
        success: false,
        error: 'uploadId is required'
      });
    }

    const now = new Date();

    // 1. Fetch matching semester records to collect student details and subject counts
    const query = { extractedPdfName };
    if (uploadId) {
      query.uploadId = uploadId;
    }
    const records = await SemesterRecord.find(query).lean();

    const uploadedStudentCount = records.length;
    const uniqueCourseCodes = new Set();
    const extractedStudents = [];

    for (const record of records) {
      if (record.studentId && record.regNo) {
        extractedStudents.push({
          regNo: record.regNo,
          studentId: record.studentId
        });
      }
      if (Array.isArray(record.subjects)) {
        for (const sub of record.subjects) {
          if (sub.courseCode) {
            uniqueCourseCodes.add(sub.courseCode);
          }
        }
      }
    }

    const uploadedSubjectCount = uniqueCourseCodes.size;

    // 2. Update SemesterRecord documents to submitted
    const result = await SemesterRecord.updateMany(
      query,
      { $set: { submitted: true, submittedAt: now, reviewed: true } }
    );

    // 3. Create the upload history record
    const coordinatorId = req.user?.userId || req.user?._id || null;
    const history = await SemesterUploadHistory.create({
      uploadId,
      coordinatorId,
      fileName: extractedPdfName,
      filePath: '',
      year: year || 'I',
      semester: semester || 1,
      uploadedAt: now,
      uploadedStudentCount,
      uploadedSubjectCount,
      extractedStudents,
      status: "ACTIVE"
    });

    // 4. Generate student notifications
    const notifications = extractedStudents.map(student => ({
      studentId: student.studentId,
      registerNumber: student.regNo,
      uploadId,
      sourceType: "SEMESTER_UPLOAD",
      semester: semester || 1,
      year: year || 'I',
      message: 'Result Published',
      subtitle: `${year || 'I'} - ${semester || 1}`,
      notificationRead: false,
      createdAt: now
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
      console.log(`Generated ${notifications.length} semester upload notifications.`);
    }

    return res.status(200).json({
      success: true,
      matched: result.matchedCount ?? result.n,
      modified: result.modifiedCount ?? result.nModified,
      uploadId,
      historyId: history._id
    });
  } catch (error) {
    console.error('[Semester] Submit failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit semester records',
      details: error.message
    });
  }
});

router.get('/list', async (req, res) => {
  try {
    const { records, matchedQuery } = await findSemesterRecords(req.query || {});

    return res.status(200).json({
      success: true,
      records,
      matchedQuery,
      total: records.length
    });
  } catch (error) {
    console.error('[Semester] List failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch semester records',
      details: error.message
    });
  }
});

router.put('/update', updateSemesterRecord);
router.put('/:id', updateSemesterRecord);

module.exports = router;
