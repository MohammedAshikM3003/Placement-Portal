const express = require('express');
const router = express.Router();

const SemesterRecord = require('../models/SemesterRecord');

const buildRecordKey = (payload) => {
  const regNo = (payload.regNo || '').toString().trim();
  const semester = (payload.semester || '').toString().trim();
  const batch = (payload.batch || '').toString().trim();
  const studentId = (payload.studentId || '').toString().trim();
  return [regNo || studentId, semester, batch].filter(Boolean).join(':');
};

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const records = Array.isArray(body.records) ? body.records : (Array.isArray(body.students) ? body.students : []);
    const fileName = body.fileName || '';
    const fileType = body.fileType || 'application/pdf';
    const subjects = Array.isArray(body.subjects) ? body.subjects : [];
    const uploadedBy = body.uploadedBy || 'Coordinator';

    if (!records.length) {
      return res.status(400).json({ success: false, error: 'No semester records provided' });
    }

    const savedRecords = [];

    for (const record of records) {
      const regNo = (record.regNo || '').toString().trim();
      const studentName = (record.studentName || record.name || '').toString().trim();
      const semester = (record.semester || '').toString().trim();

      if (!regNo || !studentName || !semester) {
        continue;
      }

      const recordKey = buildRecordKey(record);
      const cleanedStudent = {
        studentId: (record.studentId || record.id || '').toString().trim(),
        regNo,
        studentName,
        year: (record.year || '').toString().trim(),
        semester,
        section: (record.section || '').toString().trim(),
        cleared: Number(record.cleared || 0),
        arrear: Number(record.arrear || 0),
        sgpa: (record.sgpa ?? '0.0').toString(),
        cgpa: (record.cgpa ?? record.overallCgpa ?? '0.0').toString()
      };

      const saved = await SemesterRecord.findOneAndUpdate(
        { recordKey },
        {
          $set: {
            recordKey,
            studentId: cleanedStudent.studentId,
            regNo: cleanedStudent.regNo,
            studentName: cleanedStudent.studentName,
            department: record.department || '',
            batch: record.batch || '',
            year: cleanedStudent.year,
            semester: cleanedStudent.semester,
            section: cleanedStudent.section,
            fileName,
            fileType,
            totalStudents: Number(body.totalStudents || records.length || 0),
            allClearStudents: Number(body.allClearStudents || 0),
            arrearStudents: Number(body.arrearStudents || 0),
            subjects,
            students: records,
            uploadedBy,
            uploadedAt: new Date()
          }
        },
        { upsert: true, new: true }
      ).lean();

      savedRecords.push(saved);
    }

    return res.status(200).json({
      success: true,
      saved: savedRecords.length,
      records: savedRecords
    });
  } catch (error) {
    console.error('[SemesterRecords] Save failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save semester records',
      details: error.message
    });
  }
});

router.get('/', async (req, res) => {
  try {
    const { regNo, studentId, semester, batch } = req.query;

    const query = {};
    if (regNo) query.regNo = String(regNo).trim();
    if (studentId) query.studentId = String(studentId).trim();
    if (semester) query.semester = String(semester).trim();
    if (batch) query.batch = String(batch).trim();

    const records = await SemesterRecord.find(query)
      .sort({ uploadedAt: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      records,
      total: records.length
    });
  } catch (error) {
    console.error('[SemesterRecords] Fetch failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch semester records',
      details: error.message
    });
  }
});

// Get semester record by registration number and semester
router.get('/:regNo/:semester', async (req, res) => {
  try {
    const { regNo, semester } = req.params;

    if (!regNo || !semester) {
      return res.status(400).json({
        success: false,
        error: 'Registration number and semester are required'
      });
    }

    console.log(`[SemesterRecords] Fetching record for regNo: ${regNo}, semester: ${semester}`);

    const record = await SemesterRecord.findOne({
      regNo: String(regNo).trim(),
      semester: String(semester).trim()
    }).lean();

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'No semester record found',
        record: null
      });
    }

    return res.status(200).json({
      success: true,
      record,
      ...record // Spread record data for backward compatibility
    });
  } catch (error) {
    console.error('[SemesterRecords] Fetch by ID failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch semester record',
      details: error.message
    });
  }
});

module.exports = router;