const fs = require('fs');
const pdfParse = require('pdf-parse');
const { extractAllMarksheetsFromPDF } = require('./services/marksheetExtractionService');

async function testFullExtraction() {
  try {
    const pdfBuffer = fs.readFileSync('D:\\Placement-Portal\\0 MERGED.pdf');
    console.log(`📄 PDF Size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    // First, let's see how many pages are split by form feed
    const data = await pdfParse(pdfBuffer);
    const pages = data.text.split(/\f/);
    console.log(`📄 Total pages (form-feed split): ${pages.length}`);
    console.log(`📄 Total PDF pages: ${data.numpages}`);
    
    const marksheets = await extractAllMarksheetsFromPDF(pdfBuffer);
    
    console.log(`\n✓ Extraction complete!`);
    console.log(`Total marksheets extracted: ${marksheets.length}`);
    
    // Show summary of each
    for (let i = 0; i < Math.min(marksheets.length, 10); i++) {
      const m = marksheets[i];
      console.log(`\n  ${i + 1}. ${m.regNo} - ${m.studentName}`);
      console.log(`     Programme: ${m.programme}`);
      console.log(`     Semester: ${m.semester}`);
      console.log(`     Subjects: ${m.subjects?.length || 0}`);
      if (m.subjects && m.subjects.length > 0) {
        console.log(`     First subject: ${m.subjects[0].courseCode} - ${m.subjects[0].courseName}`);
      }
    }
    
    if (marksheets.length > 10) {
      console.log(`\n  ... and ${marksheets.length - 10} more`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testFullExtraction();
