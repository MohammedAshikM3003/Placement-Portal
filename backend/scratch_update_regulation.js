const fs = require('fs');
const file = 'backend/routes/marksheetsUpload.js';

let content = fs.readFileSync(file, 'utf8');

const targetStr = `          if (correctionCount > 0) {
            m.validationWarnings = m.validationWarnings || [];
            m.validationWarnings.push(\`Auto-corrected \${correctionCount} course code(s) from master list\`);
            m.extractionConfidence = Math.max(0, (m.extractionConfidence || 0) - (0.02 * correctionCount));
          }`;

// Find target string regardless of carriage returns (\r\n vs \n)
const targetNormalized = targetStr.replace(/\r?\n/g, '\n');
const contentNormalized = content.replace(/\r?\n/g, '\n');

if (contentNormalized.includes(targetNormalized)) {
  console.log('Target block found! Applying replacement...');
  const replacement = targetNormalized + `\n          const regulation = detectRegulationFromCodes(m.subjects, m.rawText || '');\n          m.regulation = regulation;\n          m.detectedRegulation = regulation;`;
  
  // Re-run on the original content by finding the indices or doing a regex replace
  const index = contentNormalized.indexOf(targetNormalized);
  // Restore original line ending style (\r\n if file uses CRLF)
  const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
  
  const targetOriginal = targetStr.replace(/\r?\n/g, lineEnding);
  const replacementOriginal = replacement.replace(/\r?\n/g, lineEnding);
  
  content = content.replace(targetOriginal, replacementOriginal);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully updated marksheetsUpload.js');
} else {
  console.error('Target block not found in file!');
}
