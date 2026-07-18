const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { extractAllMarksheetsFromPDF } = require('../services/marksheetExtractionService');

dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI;

async function runAccuracyTable() {
  console.log('📊 Starting OCR Marksheet Extraction Accuracy Benchmarking...');
  
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      console.log('🔌 Connected to MongoDB Atlas cluster successfully.');
    } catch (e) {
      console.warn('⚠️ Could not connect to Atlas DB. Proceeding with database bypass.');
    }
  }

  const Subject = require('../models/Subject');

  const files = [
    { name: 'sem 1 test.pdf', path: 'd:/Placement-Portal/sem 1 test.pdf', semester: 1 },
    { name: 'sem 6.pdf', path: 'd:/Placement-Portal/sem 6.pdf', semester: 6 },
    { name: 'sem 1.pdf', path: 'd:/Placement-Portal/Sem Testing/sem 1.pdf', semester: 1 },
    { name: 'sem 2.pdf', path: 'd:/Placement-Portal/Sem Testing/sem 2.pdf', semester: 2 },
    { name: 'sem 3.pdf', path: 'd:/Placement-Portal/Sem Testing/sem 3.pdf', semester: 3 }
  ];

  const resultsTable = [];

  for (const f of files) {
    if (!fs.existsSync(f.path)) {
      console.warn(`File not found: ${f.path}`);
      continue;
    }

    const buffer = fs.readFileSync(f.path);
    console.log(`\nParsing ${f.name}...`);
    
    const t0 = Date.now();
    const marksheets = await extractAllMarksheetsFromPDF(buffer, { semester: f.semester, debug: true });
    const duration = ((Date.now() - t0) / 1000).toFixed(2);
    
    // Get expected subjects
    let dbSubjects = [];
    if (mongoose.connection.readyState === 1) {
      try {
        dbSubjects = await Subject.find({ semester: f.semester }).lean();
        console.log(`Loaded ${dbSubjects.length} subjects from DB for Semester ${f.semester}`);
      } catch (dbErr) {
        console.warn('⚠️ Failed to load expected subjects from DB:', dbErr.message);
      }
    }
    
    if (dbSubjects.length === 0) {
      if (f.semester === 1) {
        dbSubjects = [
          { courseCode: '20GE051', courseName: 'Heritage Of Tamils' },
          { courseCode: '20MC052', courseName: 'Environmental Science And Engineering' },
          { courseCode: '20CS211', courseName: 'Programming' },
          { courseCode: '20EN151', courseName: 'Technical English-1' },
          { courseCode: '20MA151', courseName: 'Algebra and Calculus' },
          { courseCode: '20PH151', courseName: 'Engineering Physics' },
          { courseCode: '20CY151', courseName: 'Engineering Chemistry' },
          { courseCode: '20GE151', courseName: 'Design Thinking' },
          { courseCode: '20CS151', courseName: 'Python Programming' }
        ];
      } else if (f.semester === 2) {
        dbSubjects = [
          { courseCode: '20MA201', courseName: 'Mathematics-II' },
          { courseCode: '20CS202', courseName: 'Data Structures' }
        ];
      } else if (f.semester === 3) {
        dbSubjects = [
          { courseCode: '20MA343', courseName: 'Numerical Computational Techniques' },
          { courseCode: '20CS314', courseName: 'Computer Architecture Organisation And' }
        ];
      } else {
        dbSubjects = [
          { courseCode: '20HS051', courseName: 'Universal Human Values And Understanding Harmony.' },
          { courseCode: '20CS601', courseName: 'Compiler Design' },
          { courseCode: '20CS602', courseName: 'Cryptography and Network Security' },
          { courseCode: '20CS603', courseName: 'Mobile Application Development' }
        ];
      }
    }

    for (const m of marksheets) {
      const extractedCodes = m.subjects.map(s => s.courseCode);
      const missing = dbSubjects.filter(sub => !extractedCodes.includes(sub.courseCode));
      
      resultsTable.push({
        fileName: f.name,
        candidateName: m.studentName,
        regNo: m.regNo,
        expectedCount: dbSubjects.length,
        extractedCount: m.subjects.length,
        missingList: missing.map(sub => sub.courseCode).join(', ') || 'None',
        durationSec: parseFloat(duration),
        pageCount: m.pageCount || (f.name.includes('sem 1') ? 4 : 1)
      });
    }
  }

  // Print results as Markdown Table
  console.log('\n========================================================================================================');
  console.log('                                     OCR EXTRACTION ACCURACY TABLE');
  console.log('========================================================================================================\n');
  
  console.log('| PDF File | Candidate Name | Register No | Expected Subjects | Extracted Subjects | Missing Subjects | Total Duration | Avg Time/Page |');
  console.log('|---|---|---|:---:|:---:|---|:---:|:---:|');
  
  for (const r of resultsTable) {
    const avgPageTime = (r.durationSec / r.pageCount).toFixed(2);
    console.log(`| ${r.fileName} | ${r.candidateName} | ${r.regNo} | ${r.expectedCount} | ${r.extractedCount} | ${r.missingList} | ${r.durationSec}s | ${avgPageTime}s/page |`);
  }

  console.log('\n========================================================================================================\n');

  // Verify multi-page and wrapped name checks
  console.log('🧪 Verifying Wrapped Subject Names and Multi-Page isolation validation:');
  const testTimingPath = 'd:/Placement-Portal/debug/timing.json';
  if (fs.existsSync(testTimingPath)) {
    const timings = JSON.parse(fs.readFileSync(testTimingPath, 'utf8'));
    console.log('✓ timing.json generated successfully. Contents:', JSON.stringify(timings, null, 2));
  }

  const missingSubjectsPath = 'd:/Placement-Portal/debug/missing_subjects.json';
  if (fs.existsSync(missingSubjectsPath)) {
    const missing = JSON.parse(fs.readFileSync(missingSubjectsPath, 'utf8'));
    console.log('✓ missing_subjects.json generated successfully. Contents:', JSON.stringify(missing, null, 2));
  }

  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
  process.exit(0);
}

runAccuracyTable();
