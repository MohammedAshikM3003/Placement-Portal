const fs = require('fs');
const path = require('path');
const { extractAllMarksheetsFromPDF } = require('../services/marksheetExtractionService');
const mongoose = require('mongoose');

const testCases = [
  {
    name: 'Single-Page Mixed (sem 1 test.pdf)',
    filepath: 'd:/Placement-Portal/sem 1 test.pdf',
    semester: 1,
    expectedStudents: 4,
    expectedMetadata: [
      { regNo: '73152213001', name: 'Aarkesh M', pages: [1] },
      { regNo: '73152213002', name: 'Abdul Rahuman S', pages: [2] },
      { regNo: '73152213004', name: 'Abinayaa J', pages: [3] },
      { regNo: '73152213003', name: 'Abinaya N', pages: [4] }
    ]
  },
  {
    name: 'Multi-Page Student (eee.pdf)',
    filepath: 'd:/Placement-Portal/eee.pdf',
    semester: 6,
    expectedStudents: 1,
    expectedMetadata: [
      { regNo: '73152314014', name: 'Hari Haran S', pages: [1, 2] }
    ]
  },
  {
    name: 'Single-Page Scanned (sem 6.pdf)',
    filepath: 'd:/Placement-Portal/sem 6.pdf',
    semester: 6,
    expectedStudents: 1,
    expectedMetadata: [
      { regNo: '73152313074', name: 'Mohammed Ashik M', pages: [1] }
    ]
  }
];

async function runGroupingTests() {
  console.log('🏁 Starting E2E Candidate Grouping & Segmentation Regression Suite...\n');
  let passedCount = 0;
  
  for (const tc of testCases) {
    console.log(`--------------------------------------------------`);
    console.log(`📝 CASE: ${tc.name}`);
    console.log(`--------------------------------------------------`);
    
    if (!fs.existsSync(tc.filepath)) {
      console.error(`❌ Skip: File missing: ${tc.filepath}`);
      continue;
    }

    try {
      const buffer = fs.readFileSync(tc.filepath);
      console.log(`File: ${path.basename(tc.filepath)} (${(buffer.length / 1024).toFixed(1)} KB)`);
      
      const t0 = Date.now();
      const marksheets = await extractAllMarksheetsFromPDF(buffer, {
        semester: tc.semester,
        debug: true
      });
      const duration = ((Date.now() - t0) / 1000).toFixed(2);
      console.log(`Duration: ${duration}s`);
      console.log(`Students Extracted: ${marksheets.length} (Expected: ${tc.expectedStudents})`);

      let casePassed = true;
      const diagnostics = [];

      if (marksheets.length !== tc.expectedStudents) {
        casePassed = false;
        diagnostics.push(`Mismatch in student count: got ${marksheets.length}, expected ${tc.expectedStudents}`);
      }

      for (let i = 0; i < Math.max(marksheets.length, tc.expectedMetadata.length); i++) {
        const actual = marksheets[i];
        const expected = tc.expectedMetadata[i];

        if (!actual) {
          casePassed = false;
          diagnostics.push(`Missing actual student at index ${i} (Expected: ${expected.regNo})`);
          continue;
        }
        if (!expected) {
          casePassed = false;
          diagnostics.push(`Unexpected student extracted at index ${i}: RegNo=${actual.regNo}, Name=${actual.studentName}`);
          continue;
        }

        // Assertions
        const isRegOk = actual.regNo === expected.regNo;
        const isNameOk = actual.studentName.toLowerCase().includes(expected.name.toLowerCase());
        
        // Check page assignment
        const meta = actual.candidate_metadata || {};
        const sourcePages = meta.source_pages || [];
        const isPagesOk = Array.isArray(sourcePages) && 
                          sourcePages.length === expected.pages.length && 
                          sourcePages.every((p, idx) => p === expected.pages[idx]);

        console.log(`  👤 Student ${i+1}:`);
        console.log(`     - RegNo: "${actual.regNo}" ${isRegOk ? '✅' : '❌ (Expected: "' + expected.regNo + '")'}`);
        console.log(`     - Name: "${actual.studentName}" ${isNameOk ? '✅' : '❌ (Expected to contain: "' + expected.name + '")'}`);
        console.log(`     - Assigned Pages: [${sourcePages.join(', ')}] ${isPagesOk ? '✅' : '❌ (Expected: [' + expected.pages.join(', ') + '])'}`);
        console.log(`     - Subjects: ${actual.subjects ? actual.subjects.length : 0}`);

        if (!isRegOk || !isNameOk || !isPagesOk) {
          casePassed = false;
          diagnostics.push(`Student index ${i} mismatch details:
            RegNo matches: ${isRegOk} (Got: "${actual.regNo}", Expected: "${expected.regNo}")
            Name matches: ${isNameOk} (Got: "${actual.studentName}", Expected to contain: "${expected.name}")
            Pages match: ${isPagesOk} (Got: [${sourcePages.join(', ')}], Expected: [${expected.pages.join(', ')}])`);
        }
      }

      if (casePassed) {
        console.log(`\n✅ PASS: ${tc.name} grouped perfectly!`);
        passedCount++;
      } else {
        console.error(`\n❌ FAIL: ${tc.name} had grouping errors:`);
        diagnostics.forEach(d => console.error(`   - ${d}`));
      }

    } catch (err) {
      console.error(`❌ CRASHED: ${tc.name} encountered an error:`, err);
    }
  }

  console.log(`\n========================================`);
  console.log(`📊 Summary of Grouping & Segmentation Regression`);
  console.log(`========================================`);
  console.log(`Passed: ${passedCount} / ${testCases.length}`);
  console.log(`========================================\n`);

  if (passedCount === testCases.length) {
    console.log('🎉 ALL GROUPING TEST SCENARIOS PASSED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('❌ GROUPING TEST FAILURE DETECTED!');
    process.exit(1);
  }
}

// Load env
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  runGroupingTests();
} else {
  mongoose.connect(mongoUri)
    .then(() => {
      runGroupingTests();
    })
    .catch(err => {
      console.warn('⚠️ DB Connection bypassed:', err.message);
      runGroupingTests();
    });
}
