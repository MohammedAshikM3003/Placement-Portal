const pdfParse = require('pdf-parse');
const fs = require('fs');

async function testPDF() {
  try {
    const pdfBuffer = fs.readFileSync('d:\\Placement-Portal\\0 MERGED.pdf');
    const data = await pdfParse(pdfBuffer);
    
    console.log('\n========== PDF TEXT ANALYSIS ==========\n');
    console.log(`Total pages: ${data.numpages}`);
    console.log(`Total text length: ${data.text.length} characters`);
    console.log('\n--- First 2000 characters of extracted text ---\n');
    console.log(data.text.substring(0, 2000));
    
    console.log('\n--- Looking for table headers ---\n');
    const lines = data.text.split('\n');
    console.log(`Total lines: ${lines.length}`);
    
    for (let i = 0; i < Math.min(100, lines.length); i++) {
      const line = lines[i];
      if (line.includes('S.NO') || line.includes('SEMESTER') || line.includes('COURSE') || line.includes('GRADE') || line.includes('RESULT')) {
        console.log(`Line ${i}: ${line}`);
      }
    }
    
    console.log('\n--- Checking for Register Number sections ---\n');
    const sections = data.text.split(/(?=Register Number:)/);
    console.log(`Found ${sections.length} sections by "Register Number:"`);
    
    if (sections.length > 0 && sections[1]) {
      console.log('\n--- First 1500 characters of first student section ---\n');
      console.log(sections[1].substring(0, 1500));
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

testPDF();
