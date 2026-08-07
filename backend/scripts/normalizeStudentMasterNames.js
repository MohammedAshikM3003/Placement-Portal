/* eslint-disable no-console */
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', 'env.production') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const Student = require('../models/Student');
const { normalizeStudentName } = require('../services/marksheetExtractionService');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DB_URI;
const applyUpdates = process.argv.includes('--apply');

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

const buildDerivedName = (student) => {
  const parts = [
    student.firstName,
    student.middleName,
    student.lastName,
    student.initials,
    student.suffix
  ].filter(Boolean);

  if (parts.length === 0) return '';
  return parts.join(' ').trim();
};

async function run() {
  if (!MONGO_URI) {
    throw new Error('Mongo URI not found. Set MONGODB_URI, MONGO_URI, or DB_URI in backend .env');
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const students = await Student.find({})
    .select('firstName middleName lastName initials suffix studentName fullName name regNo')
    .lean();

  const updates = [];

  students.forEach((student) => {
    const normalizedFirstName = normalizeStudentName(student.firstName || '');
    const normalizedMiddleName = normalizeStudentName(student.middleName || '');
    const normalizedLastName = normalizeStudentName(student.lastName || '');
    const normalizedInitials = normalizeStudentName(student.initials || '');
    const normalizedSuffix = normalizeStudentName(student.suffix || '');

    const explicitCandidates = [
      student.studentName,
      student.fullName,
      student.name
    ].filter(Boolean);

    const derived = buildDerivedName({
      firstName: normalizedFirstName,
      middleName: normalizedMiddleName,
      lastName: normalizedLastName,
      initials: normalizedInitials,
      suffix: normalizedSuffix
    });

    const bestName = pickMostCompleteName(derived ? [...explicitCandidates, derived] : explicitCandidates);
    const normalizedBest = bestName ? normalizeStudentName(bestName) : '';

    const update = {};

    if (student.firstName && normalizedFirstName && normalizedFirstName !== student.firstName) {
      update.firstName = normalizedFirstName;
    }
    if (student.middleName && normalizedMiddleName && normalizedMiddleName !== student.middleName) {
      update.middleName = normalizedMiddleName;
    }
    if (student.lastName && normalizedLastName && normalizedLastName !== student.lastName) {
      update.lastName = normalizedLastName;
    }
    if (student.initials && normalizedInitials && normalizedInitials !== student.initials) {
      update.initials = normalizedInitials;
    }
    if (student.suffix && normalizedSuffix && normalizedSuffix !== student.suffix) {
      update.suffix = normalizedSuffix;
    }
    if (normalizedBest && normalizedBest !== student.studentName) {
      update.studentName = normalizedBest;
    }
    if (normalizedBest && normalizedBest !== student.fullName) {
      update.fullName = normalizedBest;
    }

    if (Object.keys(update).length === 0) return;

    updates.push({
      updateOne: {
        filter: { _id: student._id },
        update: { $set: update }
      }
    });
  });

  if (!applyUpdates) {
    console.log(`Dry-run: ${updates.length} student updates ready.`);
  } else if (updates.length > 0) {
    const result = await Student.bulkWrite(updates, { ordered: false });
    console.log(`Updated ${result.modifiedCount || 0} students.`);
  } else {
    console.log('No student updates needed.');
  }

  if (!applyUpdates) {
    console.log('Dry-run mode. Re-run with --apply to persist changes.');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(async (error) => {
  console.error('normalizeStudentMasterNames failed:', error.message);
  try {
    await mongoose.disconnect();
  } catch (_) {
    // ignore
  }
  process.exit(1);
});
