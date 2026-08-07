const fs = require('fs');
const pdfParse = require('pdf-parse');

async function testExtraction() {
  try {
    const pdfBuffer = fs.readFileSync('D:\\Placement-Portal\\0 MERGED.pdf');
    console.log(`PDF Size: ${pdfBuffer.length} bytes`);
    
    const data = await pdfParse(pdfBuffer);
    console.log(`\n✓ PDF parsed successfully`);
    console.log(`Total pages: ${data.numpages}`);
    console.log(`\n📄 FULL PDF TEXT:\n${'='.repeat(80)}\n`);
    console.log(data.text);
    console.log(`\n${'='.repeat(80)}\n`);
    
    // Also show per-page
    const pages = data.text.split(/\f/);
    console.log(`\nTotal page splits by form feed: ${pages.length}`);
    for (let i = 0; i < pages.length; i++) {
      console.log(`\n📖 PAGE ${i + 1}:\n${'─'.repeat(80)}`);
      console.log(pages[i].trim());
      console.log(`${'─'.repeat(80)}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testExtraction();
