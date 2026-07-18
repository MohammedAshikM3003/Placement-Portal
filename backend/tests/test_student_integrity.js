// backend/tests/test_student_integrity.js
const { spawn } = require('child_process');
const path = require('path');

console.log('🛡️ Launching OCR Student Continuation Chain & Integrity Tests...');

const pythonPath = path.join(__dirname, '../../.venv310/Scripts/python.exe');
const scriptPath = path.join(__dirname, '../ocr-service/test_student_integrity_runner.py');

const testRun = spawn(pythonPath, [scriptPath], { stdio: 'inherit' });

testRun.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Student Integrity tests failed with code: ${code}`);
    process.exit(1);
  } else {
    console.log('🎉 E2E Student Integrity validation tests successfully completed!');
    process.exit(0);
  }
});
