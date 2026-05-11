const express = require('express');
const router = express.Router();

const SemesterRecord = require('../models/SemesterRecord');
const { autoSaveSemesterRecords } = require('../services/semesterAutoSave');

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
      return res.status(404).json({
        success: false,
        error: 'Semester record not found'
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
    if (!extractedPdfName) {
      return res.status(400).json({
        success: false,
        error: 'extractedPdfName is required'
      });
    }

    const now = new Date();
    const result = await SemesterRecord.updateMany(
      { extractedPdfName },
      { $set: { submitted: true, submittedAt: now, reviewed: true } }
    );

    return res.status(200).json({
      success: true,
      matched: result.matchedCount ?? result.n,
      modified: result.modifiedCount ?? result.nModified
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
    const { extractedPdfName, regNo, semester, year, submitted } = req.query || {};
    const query = {};

    if (extractedPdfName) query.extractedPdfName = String(extractedPdfName).trim();
    if (regNo) query.regNo = String(regNo).trim();
    if (semester) query.semester = String(semester).trim();
    if (year) query.year = String(year).trim();
    if (submitted !== undefined) query.submitted = String(submitted) === 'true';

    const records = await SemesterRecord.find(query)
      .sort({ extractedAt: -1, uploadedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      records,
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
