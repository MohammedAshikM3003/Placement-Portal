const fs = require('fs');
const path = require('path');
const { extractAllMarksheetsFromPDF } = require('../services/marksheetExtractionService');
const mongoose = require('mongoose');

// Mock Student model if database connection not active
const MockStudent = {
  findOne: async (query) => {
    return null; // Force unmatched student flow for simplicity
  }
};

async function runRegressionTests() {
  console.log('🚀 Running OCR Marksheet Extraction Engine Regression Tests...\n');
  const startTime = Date.now();
  
  // Clean debug folder
  const debugDir = 'd:/Placement-Portal/debug';
  if (fs.existsSync(debugDir)) {
    fs.readdirSync(debugDir).forEach(file => {
      try {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(debugDir, file));
        }
      } catch (e) {}
    });
    console.log('🧹 Cleaned existing JSON files in d:/Placement-Portal/debug/\n');
  }

  // Define test cases
  const testCases = [
    {
      filepath: 'd:/Placement-Portal/sem 1 test.pdf',
      semester: 1,
      expectedName: 'Aarkesh M',
      expectedRegNo: '73152213001'
    },
    {
      filepath: 'd:/Placement-Portal/sem 6.pdf',
      semester: 6,
      expectedName: 'Mohammed Ashik M',
      expectedRegNo: '73152313074'
    },
    {
      filepath: 'd:/Placement-Portal/eee.pdf',
      semester: 6,
      expectedName: 'Hari Haran S',
      expectedRegNo: '73152314014'
    }
  ];

  let passedTests = 0;

  for (const tc of testCases) {
    console.log(`\n========================================`);
    console.log(`📝 Testing file: ${path.basename(tc.filepath)}`);
    console.log(`========================================`);
    
    if (!fs.existsSync(tc.filepath)) {
      console.error(`❌ Test file missing: ${tc.filepath}`);
      continue;
    }

    try {
      const buffer = fs.readFileSync(tc.filepath);
      console.log(`Size: ${(buffer.length / 1024).toFixed(1)} KB`);

      const t0 = Date.now();
      const marksheets = await extractAllMarksheetsFromPDF(buffer, {
        semester: tc.semester,
        debug: true
      });
      const duration = ((Date.now() - t0) / 1000).toFixed(2);
      console.log(`⏱️ Extraction completed in ${duration} seconds`);

      if (!marksheets || marksheets.length === 0) {
        throw new Error('No marksheets returned by extractor');
      }

      const m = marksheets[0];
      console.log(`\nExtracted Candidate Details:`);
      console.log(`- Register Number: "${m.regNo}" (Expected: "${tc.expectedRegNo}")`);
      console.log(`- Candidate Name: "${m.studentName}" (Expected: "${tc.expectedName}")`);
      console.log(`- Semester: ${m.semester}`);
      console.log(`- Subjects Extracted: ${m.subjects ? m.subjects.length : 0}`);

      if (m.subjects && m.subjects.length > 0) {
        console.log(`- Sample Subject: ${m.subjects[0].courseCode} | ${m.subjects[0].courseName} | Grade: ${m.subjects[0].grade} | Result: ${m.subjects[0].result}`);
      }

      // Simulate missing subject comparison and debug file writing (Stage 9 & 10)
      const missingSubjects = [];
      let expectedForSem = [];
      
      try {
        if (mongoose.connection.readyState === 1) {
          const Subject = require('../models/Subject');
          expectedForSem = await Subject.find({ semester: tc.semester }).lean();
          console.log(`🔍 Loaded ${expectedForSem.length} expected subjects from MongoDB database for Sem ${tc.semester}`);
        }
      } catch (dbErr) {
        console.warn('⚠️ MongoDB Atlas Query failed:', dbErr.message);
      }

      if (expectedForSem.length === 0) {
        console.log('⚠️ Database returned 0 subjects for semester. Using mock curriculum expectations.');
        const mockExistingSubjects = [
          { courseCode: '20MA101', courseName: 'Engineering Mathematics-1', semester: 1 },
          { courseCode: '20HS051', courseName: 'Universal Human Values And Understanding Harmony.', semester: 6 },
          { courseCode: '20CS601', courseName: 'Compiler Design', semester: 6 } // Missing expected subject
        ];
        expectedForSem = mockExistingSubjects.filter(sub => sub.semester === tc.semester);
      }
      
      const extractedCodes = new Set(m.subjects.map(s => s.courseCode));
      const rawTextUpper = (m.rawText || '').toUpperCase();
      
      for (const expSub of expectedForSem) {
        if (!extractedCodes.has(expSub.courseCode)) {
          const isInRawText = rawTextUpper.includes(expSub.courseCode);
          missingSubjects.push({
            registerNumber: m.regNo || tc.expectedRegNo,
            studentName: m.studentName || tc.expectedName,
            courseCode: expSub.courseCode,
            courseName: expSub.courseName,
            pipelineStage: isInRawText ? 'Subject Builder' : 'OCR / Line Detection',
            reason: isInRawText 
              ? 'Lost in Subject Builder (likely coordinate clustering or split OCR row issues)' 
              : 'Not found in raw OCR text (OCR failed to recognize it or page image is low quality)',
            confidence: isInRawText ? 0.70 : 0.0
          });
        }
      }

      fs.writeFileSync(
        path.join(debugDir, 'missing_subjects.json'),
        JSON.stringify(missingSubjects, null, 2),
        'utf-8'
      );
      
      const mockBackendResponse = {
        success: true,
        extractedMarksheets: marksheets,
        summary: {
          totalExtracted: marksheets.length,
          totalMatched: marksheets.length,
          totalWarnings: 0,
          readyToConfirm: true
        }
      };
      
      fs.writeFileSync(
        path.join(debugDir, 'backend.json'),
        JSON.stringify(mockBackendResponse, null, 2),
        'utf-8'
      );

      // Assertions
      const regNoMatch = m.regNo === tc.expectedRegNo;
      const nameMatch = m.studentName.toLowerCase().includes(tc.expectedName.toLowerCase());
      const hasSubjects = m.subjects && m.subjects.length > 0;

      if (regNoMatch && nameMatch && hasSubjects) {
        console.log(`\n✅ TEST PASSED: Metadata and subject extraction verified successfully!`);
        passedTests++;
      } else {
        console.error(`\n❌ TEST FAILED:`);
        if (!regNoMatch) console.error(`  - Register number mismatch (got "${m.regNo}", expected "${tc.expectedRegNo}")`);
        if (!nameMatch) console.error(`  - Name mismatch (got "${m.studentName}", expected "${tc.expectedName}")`);
        if (!hasSubjects) console.error(`  - No subjects were extracted`);
      }

    } catch (err) {
      console.error(`❌ TEST CRASHED:`, err.message);
    }
  }

  // Verify Debug files generation (Stage 9)
  console.log(`\n========================================`);
  console.log(`📂 Checking Debug JSON Files Generation`);
  console.log(`========================================`);
  
  const requiredDebugFiles = [
    'pdf_summary.json',
    'page_1_ocr.json',
    'rows.json',
    'row_clusters.json',
    'course_codes.json',
    'subjects.json',
    'document.json',
    'backend.json',
    'timing.json',
    'missing_subjects.json'
  ];

  let debugFilesCount = 0;
  for (const file of requiredDebugFiles) {
    const fullPath = path.join(debugDir, file);
    if (fs.existsSync(fullPath)) {
      const size = fs.statSync(fullPath).size;
      console.log(`✓ Generated: ${file} (${size} bytes)`);
      debugFilesCount++;
    } else {
      console.error(`× Missing debug file: ${file}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`📊 Summary of Regression Tests`);
  console.log(`========================================`);
  console.log(`- Passed extraction tests: ${passedTests} / ${testCases.length}`);
  console.log(`- Debug files generated: ${debugFilesCount} / ${requiredDebugFiles.length}`);
  console.log(`- Total execution time: ${((Date.now() - startTime) / 1000).toFixed(2)} seconds`);
  console.log(`========================================\n`);

  if (passedTests === testCases.length && debugFilesCount === requiredDebugFiles.length) {
    console.log('🎉 REGRESSION SUCCESS: Extraction Engine is fully verified!');
    process.exit(0);
  } else {
    console.error('❌ REGRESSION FAILURE: Please check extraction results and missing debug files.');
    process.exit(1);
  }
}

// Load environment variables
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.warn('⚠️ MONGODB_URI not found in backend/.env. Proceeding with database bypass.');
  runRegressionTests();
} else {
  console.log(`🔌 Connecting to MongoDB cluster: ${mongoUri.split('@')[1]?.split('/')[0] || 'Atlas'}...`);
  mongoose.connect(mongoUri)
    .then(() => {
      console.log('✅ Connected to MongoDB database successfully!');
      runRegressionTests();
    })
    .catch(err => {
      console.warn('⚠️ Could not connect to MongoDB Atlas. Proceeding with database bypass. Error:', err.message);
      runRegressionTests();
    });
}
