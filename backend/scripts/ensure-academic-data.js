/* eslint-disable no-console */
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', 'env.production') });
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const StudentMarksheet = require('../models/StudentMarksheet');
const Subject = require('../models/Subject');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DB_URI;
const applyFixes = process.argv.includes('--apply');
const fixFromMaxGpa = process.argv.includes('--fix-from-maxgpa');

async function ensureIndexes() {
  const created = await StudentMarksheet.collection.createIndex(
    { studentId: 1, semester: 1 },
    { unique: true, name: 'studentId_1_semester_1_unique' }
  );
  return created;
}

async function reportSubjectCredits() {
  const total = await Subject.countDocuments({});
  const zeroCredits = await Subject.countDocuments({ credits: { $lte: 0 } });
  const missingCredits = await Subject.countDocuments({
    $or: [{ credits: { $exists: false } }, { credits: null }]
  });

  console.log(`Total subjects: ${total}`);
  console.log(`Subjects with credits <= 0: ${zeroCredits}`);
  console.log(`Subjects with missing/null credits: ${missingCredits}`);

  const sample = await Subject.find({ credits: { $lte: 0 } })
    .select('courseCode courseName credits maxGPA')
    .limit(20)
    .lean();

  if (sample.length > 0) {
    console.log('Sample zero-credit subjects (max 20):');
    console.table(
      sample.map((s) => ({
        courseCode: s.courseCode,
        courseName: s.courseName,
        credits: s.credits,
        maxGPA: s.maxGPA
      }))
    );
  }

  return { total, zeroCredits, missingCredits };
}

async function applySubjectFixes() {
  // Normalize bad/missing numeric values first.
  const normalized = await Subject.updateMany(
    {
      $or: [
        { credits: { $exists: false } },
        { credits: null },
        { credits: { $type: 'string' } },
        { credits: { $lt: 0 } }
      ]
    },
    [{ $set: { credits: { $max: [0, { $toDouble: { $ifNull: ['$credits', 0] } }] } } }]
  );

  console.log(`Normalized invalid credits in ${normalized.modifiedCount || 0} subjects.`);

  if (fixFromMaxGpa) {
    // Optional emergency migration for environments where credits were mistakenly put into maxGPA.
    const copied = await Subject.updateMany(
      {
        credits: { $lte: 0 },
        maxGPA: { $gt: 0 }
      },
      [{ $set: { credits: { $toDouble: '$maxGPA' } } }]
    );
    console.log(`Copied maxGPA -> credits in ${copied.modifiedCount || 0} subjects.`);
  }
}

async function run() {
  if (!MONGO_URI) {
    throw new Error('Mongo URI not found. Set MONGODB_URI or MONGO_URI in backend .env');
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const indexName = await ensureIndexes();
  console.log(`Ensured index: ${indexName}`);

  const before = await reportSubjectCredits();

  if (applyFixes) {
    await applySubjectFixes();
    const after = await reportSubjectCredits();
    console.log(`Zero-credit subjects: ${before.zeroCredits} -> ${after.zeroCredits}`);
  } else {
    console.log('Dry-run mode. Use --apply to normalize invalid credits.');
    console.log('Optional: add --fix-from-maxgpa to copy maxGPA into credits where credits <= 0.');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch(async (err) => {
  console.error('ensure-academic-data failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch (_) {
    // ignore
  }
  process.exit(1);
});
