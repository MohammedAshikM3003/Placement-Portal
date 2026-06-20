const mongoose = require('mongoose');
require('dotenv').config();
const SemesterRecord = require('../models/SemesterRecord');

const semesterToAcademicYear = (sem) => {
  const s = parseInt(sem, 10);
  if (s === 1 || s === 2) return 'I';
  if (s === 3 || s === 4) return 'II';
  if (s === 5 || s === 6) return 'III';
  if (s === 7 || s === 8) return 'IV';
  return '';
};

async function runMigration() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set in environment variables');
    }
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const records = await SemesterRecord.find({});
    console.log(`Found ${records.length} total semester records to inspect.`);

    let updatedCount = 0;
    for (const record of records) {
      let changed = false;

      // 1. Academic Year
      const computedAcademicYear = semesterToAcademicYear(record.semester);
      if (!record.academicYear && computedAcademicYear) {
        record.academicYear = computedAcademicYear;
        changed = true;
      }

      // 2. Exam Year
      if (!record.examYear && record.year) {
        record.examYear = record.year;
        changed = true;
      }

      // 3. Exam Month
      if (!record.examMonth) {
        record.examMonth = 'UNKNOWN';
        changed = true;
      }

      // 4. Exam Month Year
      if (!record.examMonthYear) {
        const yearVal = record.examYear || record.year || 'UNKNOWN';
        record.examMonthYear = `UNKNOWN ${yearVal}`;
        changed = true;
      }

      if (changed) {
        // Use markModified if needed, or simply save
        await record.save();
        updatedCount++;
      }
    }

    console.log(`Migration finished! Updated ${updatedCount} out of ${records.length} records.`);
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
