const SemesterRecord = require('../models/SemesterRecord');

const FAIL_GRADES = new Set(['U', 'RA', 'SA', 'W', 'WD', 'AB']);

const extractExamYear = (value) => {
  if (!value) return '';
  const text = String(value);
  const match = text.match(/(\d{4})/);
  return match ? match[1] : '';
};

const normalizeStatus = (grade) => (FAIL_GRADES.has(String(grade || '').toUpperCase()) ? 'Arrear' : 'Cleared');

const buildRecordKey = (regNo, semester, year) => {
  const parts = [regNo, semester, year].map((part) => String(part || '').trim()).filter(Boolean);
  return parts.join(':');
};

const resolveSemester = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return '';
};

const autoSaveSemesterRecords = async ({ extractedMarksheets, extractedPdfName, uploadedBy, semester }) => {
  const marksheets = Array.isArray(extractedMarksheets) ? extractedMarksheets : [];
  if (!marksheets.length) {
    return { saved: 0, records: [] };
  }

  console.log('[Semester AutoSave] Model collection:', SemesterRecord?.collection?.name);
  console.log('[Semester AutoSave] Incoming marksheets:', marksheets.length);

  const savedRecords = [];
  const recordsToInsert = [];

  for (const [index, marksheet] of marksheets.entries()) {
    const regNo = (marksheet.regNo || marksheet.registerNumber || '').toString().trim();
    const studentNameRaw = (marksheet.studentName || marksheet.name || '').toString().trim();
    const studentName = studentNameRaw || 'Unknown';
    const resolvedSemester = resolveSemester(marksheet.semester, semester);
    const year = extractExamYear(marksheet.examDate || marksheet.exam_month_year || marksheet.examYear || marksheet.year);
    const subjects = Array.isArray(marksheet.subjects) ? marksheet.subjects : [];
    const matchedStatus = marksheet.matched;
    const sgpaValue = marksheet.sgpa ?? '0.0';
    const cgpaValue = marksheet.cgpa ?? marksheet.overallCgpa ?? '0.0';
    const saveAllowed = Boolean(regNo);

    console.log('================================');
    console.log('📘 STUDENT:', studentNameRaw || '(missing)');
    console.log('🆔 REG NO:', regNo || '(missing)');
    console.log('📚 SEMESTER:', resolvedSemester || '(missing)');
    console.log('📄 SUBJECT COUNT:', subjects.length);
    console.log('📊 SGPA:', sgpaValue);
    console.log('📊 CGPA:', cgpaValue);
    console.log('📦 READY FOR SAVE:', saveAllowed);

    console.log('[Semester AutoSave] Record candidate:', {
      index,
      regNo,
      studentName,
      semester: resolvedSemester,
      year,
      studentId: marksheet.studentId || null,
      matched: matchedStatus,
      subjectsCount: subjects.length,
      sgpa: sgpaValue
    });

    if (!regNo) {
      console.warn('❌ SKIPPED: Missing register number');
      continue;
    }

    if (matchedStatus === false) {
      console.warn('⚠️ STUDENT MATCH FAILED: continuing insert');
    }

    if (!studentNameRaw) {
      console.warn('⚠️ MISSING STUDENT NAME: using fallback');
    }

    if (!resolvedSemester) {
      console.warn('⚠️ MISSING SEMESTER: continuing insert');
    }

    if (!subjects.length) {
      console.warn('⚠️ EMPTY SUBJECTS: continuing insert');
    }

    console.log('✅ SAVED NAME:', studentName);

    console.log('📘 FINAL SEMESTER:', resolvedSemester);

    const recordKey = buildRecordKey(regNo, resolvedSemester, year);

    const normalizedSubjects = subjects.map((subject) => {
      const grade = (subject.grade || subject.resultGrade || 'U').toString().trim().toUpperCase();
      const status = normalizeStatus(grade);
      return {
        courseCode: (subject.courseCode || subject.subjectCode || subject.code || '').toString().trim().toUpperCase(),
        courseName: (subject.courseName || subject.subjectName || subject.name || '').toString().trim(),
        subjectCode: (subject.subjectCode || subject.courseCode || subject.code || '').toString().trim().toUpperCase(),
        subjectName: (subject.subjectName || subject.courseName || subject.name || '').toString().trim(),
        credits: Number(subject.credits) || 0,
        grade,
        status
      };
    });

    const arrearSubjects = normalizedSubjects.filter((subject) => subject.status === 'Arrear').length;
    const clearedSubjects = normalizedSubjects.length - arrearSubjects;

    const payload = {
      recordKey,
      studentId: (marksheet.studentId || '').toString().trim(),
      regNo,
      registerNumber: regNo,
      studentName,
      department: marksheet.department || marksheet.programme || '',
      year,
      semester: resolvedSemester,
      section: marksheet.section || '',
      sgpa: (marksheet.sgpa ?? '0.0').toString(),
      cgpa: (marksheet.cgpa ?? marksheet.overallCgpa ?? '0.0').toString(),
      clearedSubjects,
      arrearSubjects,
      subjects: normalizedSubjects,
      extractedPdfName: extractedPdfName || marksheet.extractedPdfName || '',
      extractedAt: new Date(),
      reviewed: false,
      submitted: false,
      submittedAt: null,
      extractionStatus: marksheet.extractionStatus || 'success',
      uploadedBy: uploadedBy || 'Coordinator'
    };

    recordsToInsert.push(payload);
    console.log('📦 RECORD ADDED:', regNo);
  }

  console.log('📦 FINAL SEMESTER RECORDS:', JSON.stringify(recordsToInsert, null, 2));
  console.log('[Semester AutoSave] Prepared records:', recordsToInsert.length);
  if (recordsToInsert.length > 0) {
    console.log('[Semester AutoSave] Preview record:', recordsToInsert[0]);
  }

  console.log('✅ INSERT ATTEMPTED:', recordsToInsert.length);

  for (const payload of recordsToInsert) {
    try {
      const duplicateQuery = {
        regNo: payload.regNo,
        semester: payload.semester,
        year: payload.year
      };
      console.log('🔍 DUPLICATE CHECK:', duplicateQuery);

      const existing = await SemesterRecord.findOne(duplicateQuery).lean();

      if (existing) {
        console.warn('⚠️ DUPLICATE RECORD FOUND, updating existing', {
          regNo: payload.regNo,
          semester: payload.semester,
          year: payload.year
        });
      }

      const saved = await SemesterRecord.findOneAndUpdate(
        duplicateQuery,
        { $set: payload },
        { upsert: true, new: true }
      ).lean();

      savedRecords.push(saved);
      console.log('[Semester AutoSave] Inserted/Updated:', {
        regNo: payload.regNo,
        semester: payload.semester,
        year: payload.year
      });
    } catch (error) {
      if (error?.code === 11000) {
        console.error('❌ SKIPPED: Duplicate semester record', {
          regNo: payload.regNo,
          semester: payload.semester,
          year: payload.year,
          recordKey: payload.recordKey
        });
      } else if (error?.name === 'ValidationError') {
        console.error('❌ SKIPPED: Validation failed', error.errors || error.message);
      } else {
        console.error('❌ SKIPPED: Mongo insert error', error);
      }
    }
  }

  console.log('📊 EXTRACTED:', marksheets.length);
  console.log('📊 PREPARED:', recordsToInsert.length);
  console.log('📊 INSERTED:', savedRecords.length);

  return { saved: savedRecords.length, records: savedRecords };
};

module.exports = {
  autoSaveSemesterRecords
};
