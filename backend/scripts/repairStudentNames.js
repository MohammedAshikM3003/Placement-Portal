/* eslint-disable no-console */
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', 'env.production') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const SemesterRecord = require('../models/SemesterRecord');
const Student = require('../models/Student');
const { normalizeStudentName } = require('../services/marksheetExtractionService');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DB_URI;
const applyUpdates = process.argv.includes('--apply');

const normalizeNameValue = (value) => String(value || '').trim().replace(/\s+/g, ' ');
const countNameWords = (value) => {
  const normalized = normalizeNameValue(value);
  return normalized ? normalized.split(/\s+/).filter(Boolean).length : 0;
};

const pickMoreCompleteName = (currentName, candidateName) => {
  const current = normalizeNameValue(currentName);
  const candidate = normalizeNameValue(candidateName);

  if (!current) return candidate;
  if (!candidate) return current;

  const currentParts = countNameWords(current);
  const candidateParts = countNameWords(candidate);

  if (candidateParts > currentParts) return candidate;
  if (candidateParts === currentParts && candidate.length > current.length) return candidate;
  return current;
};

const splitName = (fullName) => {
  const normalized = normalizeStudentName(fullName);
  const parts = normalized.split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ')
  };
};

async function buildBestNameMap() {
  const bestByRegNo = new Map();
  const records = await SemesterRecord.find({})
    .select('_id regNo studentName students')
    .lean();

  const considerName = (regNo, name) => {
    const key = normalizeNameValue(regNo);
    if (!key) return;
    const currentBest = bestByRegNo.get(key) || '';
    const nextBest = pickMoreCompleteName(currentBest, name);
    if (nextBest && nextBest !== currentBest) {
      bestByRegNo.set(key, nextBest);
    }
  };

  records.forEach((record) => {
    considerName(record.regNo, record.studentName);
    if (Array.isArray(record.students)) {
      record.students.forEach((student) => {
        considerName(student.regNo, student.studentName);
      });
    }
  });

  return { bestByRegNo, records };
}

async function updateStudents(bestByRegNo) {
  const students = await Student.find({})
    .select('_id regNo firstName lastName')
    .lean();

  const updates = [];

  students.forEach((student) => {
    const regNo = normalizeNameValue(student.regNo);
    if (!regNo) return;

    const dbName = normalizeNameValue([student.firstName, student.lastName].filter(Boolean).join(' '));
    const candidate = bestByRegNo.get(regNo) || '';
    const finalName = pickMoreCompleteName(dbName, candidate);

    if (!finalName || finalName === dbName) return;

    const split = splitName(finalName);
    updates.push({
      updateOne: {
        filter: { _id: student._id },
        update: {
          $set: {
            firstName: split.firstName,
            lastName: split.lastName
          }
        }
      }
    });
  });

  if (!applyUpdates) {
    console.log(`Dry-run: ${updates.length} student updates ready.`);
    return { modified: 0, planned: updates.length };
  }

  if (updates.length === 0) {
    console.log('No student updates needed.');
    return { modified: 0, planned: 0 };
  }

  const result = await Student.bulkWrite(updates, { ordered: false });
  return { modified: result.modifiedCount || 0, planned: updates.length };
}

async function updateSemesterRecords(bestByRegNo, records) {
  const updates = [];

  records.forEach((record) => {
    const recordRegNo = normalizeNameValue(record.regNo);
    if (!recordRegNo) return;

    let updated = false;
    const bestName = pickMoreCompleteName(record.studentName, bestByRegNo.get(recordRegNo) || '');
    const normalizedBest = bestName ? normalizeStudentName(bestName) : '';

    let updatedStudents = record.students || [];
    if (Array.isArray(record.students)) {
      updatedStudents = record.students.map((student) => {
        const studentRegNo = normalizeNameValue(student.regNo);
        const studentBest = pickMoreCompleteName(student.studentName, bestByRegNo.get(studentRegNo) || '');
        const normalizedStudentBest = studentBest ? normalizeStudentName(studentBest) : '';

        if (normalizedStudentBest && normalizedStudentBest !== student.studentName) {
          updated = true;
          return { ...student, studentName: normalizedStudentBest };
        }

        return student;
      });
    }

    if (normalizedBest && normalizedBest !== record.studentName) {
      updated = true;
    }

    if (!updated) return;

    updates.push({
      updateOne: {
        filter: { _id: record._id },
        update: {
          $set: {
            ...(normalizedBest ? { studentName: normalizedBest } : {}),
            students: updatedStudents
          }
        }
      }
    });
  });

  if (!applyUpdates) {
    console.log(`Dry-run: ${updates.length} semester record updates ready.`);
    return { modified: 0, planned: updates.length };
  }

  if (updates.length === 0) {
    console.log('No semester record updates needed.');
    return { modified: 0, planned: 0 };
  }

  const result = await SemesterRecord.bulkWrite(updates, { ordered: false });
  return { modified: result.modifiedCount || 0, planned: updates.length };
}

async function run() {
  if (!MONGO_URI) {
    throw new Error('Mongo URI not found. Set MONGODB_URI, MONGO_URI, or DB_URI in backend .env');
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const { bestByRegNo, records } = await buildBestNameMap();
  console.log(`Collected name hints for ${bestByRegNo.size} students from semester records.`);

  const studentResult = await updateStudents(bestByRegNo);
  const semesterResult = await updateSemesterRecords(bestByRegNo, records);

  console.log(`Student updates: ${studentResult.modified}/${studentResult.planned}`);
  console.log(`Semester updates: ${semesterResult.modified}/${semesterResult.planned}`);

  if (!applyUpdates) {
    console.log('Dry-run mode. Re-run with --apply to persist changes.');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(async (error) => {
  console.error('repairStudentNames failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch (_) {
    // ignore
  }
  process.exit(1);
});
