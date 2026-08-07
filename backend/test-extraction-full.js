const fs = require('fs');
const { extractAllMarksheetsFromPDF } = require('./services/marksheetExtractionService');

async function testExtraction() {
  try {
    const pdfBuffer = fs.readFileSync('d:\\Placement-Portal\\0 MERGED testing.pdf');
    
    console.log('\n========== RUNNING FULL EXTRACTION ==========\n');
    
    const marksheets = await extractAllMarksheetsFromPDF(pdfBuffer);
    
    console.log(`\n========== EXTRACTION COMPLETE ==========`);
    console.log(`Total marksheets: ${marksheets.length}`);
    
    if (marksheets.length > 0) {
      console.log(`\n--- First Student ---`);
      const first = marksheets[0];
      console.log(`Reg No: ${first.regNo}`);
      console.log(`Name: ${first.studentName}`);
      console.log(`Semester: ${first.semester}`);
      console.log(`Subjects Count: ${first.subjects ? first.subjects.length : 0}`);
      
      if (first.subjects && first.subjects.length > 0) {
        console.log(`\nFirst 3 subjects:`);
        first.subjects.slice(0, 3).forEach((s, idx) => {
          console.log(`  ${idx + 1}. ${s.courseCode} - ${s.courseName} | Grade: ${s.grade} | Result: ${s.result}`);
        });
      } else {
        console.log(`NO SUBJECTS EXTRACTED!`);
      }
    }
    
    // Check if any marksheet has subjects
    const marksheetsWith = marksheets.filter(m => m.subjects && m.subjects.length > 0);
    console.log(`\nMarksheets with subjects: ${marksheetsWith.length}/${marksheets.length}`);
    
    // Analyze first few
    if (marksheetsWith.length > 0) {
      console.log(`\nSample marksheet with subjects:`);
      const sample = marksheetsWith[0];
      console.log(`  ${sample.regNo}: ${sample.subjects.length} subjects`);
      sample.subjects.slice(0, 2).forEach(s => {
        console.log(`    - ${s.courseCode}: ${s.grade}/${s.result}`);
      });
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

testExtraction();
