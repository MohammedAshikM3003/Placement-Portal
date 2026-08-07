// backend/tests/test_accuracy_benchmark.js
const fs = require('fs');
const path = require('path');
const { extractAllMarksheetsFromPDF } = require('../services/marksheetExtractionService');

const DATASET = [
  {
    filepath: 'd:/Placement-Portal/sem 1 test.pdf',
    semester: 1,
    expectedName: 'Aarkesh M',
    expectedRegNo: '73152213001',
    expectedCodes: ['20EN151', '20MA151', '20PH151', '20CY151', '20CS151', '20ME151', '20CS152', '20ME152', '20HS001'],
    pageCount: 4
  },
  {
    filepath: 'd:/Placement-Portal/sem 6.pdf',
    semester: 6,
    expectedName: 'Mohammed Ashik M',
    expectedRegNo: '73152313074',
    expectedCodes: ['20CS601', '20CS602', '20CS603', '20CS604', '20CS605', '20HS051'],
    pageCount: 1
  },
  {
    filepath: 'd:/Placement-Portal/eee.pdf',
    semester: 6,
    expectedName: 'Hari Haran S',
    expectedRegNo: '73152314014',
    expectedCodes: ['20EE611', '20EE612', '20EE613', '20EE614', '20EE615', '20EE616', '20EE617', '20CS432', '20EE511'],
    pageCount: 1
  }
];

function levenshteinDistance(s1, s2) {
  const a = s1.toLowerCase();
  const b = s2.toLowerCase();
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function calculateStringSimilarity(s1, s2) {
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1.0;
  return (maxLen - levenshteinDistance(s1, s2)) / maxLen;
}

function scanCommonOcrMistakes(extractedSubjects) {
  const mistakes = [];
  let confusionCount = 0;

  for (const s of extractedSubjects) {
    const code = s.courseCode || '';
    const grade = s.grade || '';

    const prefix = code.slice(0, 2);
    const suffix = code.slice(4);
    
    if (prefix.includes('O') || suffix.includes('O')) {
      mistakes.push({ field: `${code} (Code)`, type: 'O -> 0 Confusion', frequency: 1 });
      confusionCount++;
    }
    if (prefix.includes('I') || suffix.includes('I')) {
      mistakes.push({ field: `${code} (Code)`, type: 'I -> 1 Confusion', frequency: 1 });
      confusionCount++;
    }
    if (prefix.includes('S') || suffix.includes('S')) {
      mistakes.push({ field: `${code} (Code)`, type: 'S -> 5 Confusion', frequency: 1 });
      confusionCount++;
    }
    if (grade === '8' || grade === 'B') {
      mistakes.push({ field: `${code} (Grade)`, type: '8 -> B Confusion', frequency: 1 });
      confusionCount++;
    }
  }

  return {
    confusion_count: confusionCount,
    common_errors: mistakes
  };
}

async function runBenchmark() {
  console.log('🚀 Launching OCR Accuracy Continuous Evaluation & Benchmark Suite...\n');
  const results = [];
  
  let totalNameAcc = 0;
  let totalRegAcc = 0;
  let totalF1 = 0;
  let totalTime = 0;
  let totalPages = 0;
  let allExtractedSubjects = [];

  for (const tc of DATASET) {
    console.log(`Analyzing: ${path.basename(tc.filepath)}`);
    if (!fs.existsSync(tc.filepath)) {
      console.error(`❌ File not found: ${tc.filepath}`);
      continue;
    }

    const fileBuffer = fs.readFileSync(tc.filepath);
    const t0 = Date.now();
    const marksheets = await extractAllMarksheetsFromPDF(fileBuffer, {
      semester: tc.semester,
      debug: true
    });
    const durationSec = (Date.now() - t0) / 1000;
    totalTime += durationSec;
    totalPages += tc.pageCount;

    const m = marksheets && marksheets[0] ? marksheets[0] : {};
    const extractedName = m.studentName || '';
    const extractedReg = m.regNo || '';
    const extractedCodes = (m.subjects || []).map(s => s.courseCode);
    
    if (m.subjects) {
      allExtractedSubjects = allExtractedSubjects.concat(m.subjects);
    }

    // Compute similarities
    const nameAcc = calculateStringSimilarity(extractedName, tc.expectedName);
    totalNameAcc += nameAcc;

    const regAcc = extractedReg === tc.expectedRegNo ? 1.0 : 0.0;
    totalRegAcc += regAcc;

    const expectedSet = new Set(tc.expectedCodes);
    const extractedSet = new Set(extractedCodes);
    
    let intersection = 0;
    for (const code of extractedSet) {
      if (expectedSet.has(code)) intersection++;
    }

    const precision = extractedCodes.length > 0 ? intersection / extractedCodes.length : 0.0;
    const recall = tc.expectedCodes.length > 0 ? intersection / tc.expectedCodes.length : 0.0;
    const f1 = (precision + recall) > 0 ? 2 * (precision * recall) / (precision + recall) : 0.0;
    totalF1 += f1;

    results.push({
      file: path.basename(tc.filepath),
      metrics: {
        nameAccuracy: nameAcc,
        registerAccuracy: regAcc,
        courseCodePrecision: precision,
        courseCodeRecall: recall,
        courseCodeF1: f1
      },
      duration_seconds: durationSec
    });
  }

  const avgNameAcc = totalNameAcc / DATASET.length;
  const avgRegAcc = totalRegAcc / DATASET.length;
  const avgF1 = totalF1 / DATASET.length;
  const throughput = totalPages / totalTime;

  // Run mistranscription scanner
  const mistakesLogs = scanCommonOcrMistakes(allExtractedSubjects);

  // Load and compare baseline metrics (Phase 19)
  const reportDir = 'd:/Placement-Portal/backend/debug';
  const baselinePath = path.join(reportDir, 'benchmark_baseline.json');
  let baseline = null;
  let regressionDetected = false;
  let performanceDegraded = false;

  if (fs.existsSync(baselinePath)) {
    try {
      baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      if (avgF1 < baseline.overall.subjectF1Score) {
        regressionDetected = true;
      }
      if (throughput < baseline.overall.throughputPagesPerSecond) {
        performanceDegraded = true;
      }
    } catch (e) {
      console.warn('Could not load baseline JSON:', e.message);
    }
  }

  const summaryReport = {
    timestamp: new Date().toISOString(),
    ocr_engine_version: "v1.2.0-stable",
    overall: {
      studentNameAccuracy: avgNameAcc,
      registerNumberAccuracy: avgRegAcc,
      subjectF1Score: avgF1,
      totalPagesProcessed: totalPages,
      totalExecutionTimeSeconds: totalTime,
      throughputPagesPerSecond: throughput,
      regressionDetected,
      performanceDegraded
    },
    ocr_mistakes_analysis: mistakesLogs,
    versions_history: baseline ? baseline.versions : [],
    testCases: results
  };

  const outputDir = 'd:/Placement-Portal/debug';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(path.join(outputDir, 'benchmark_report.json'), JSON.stringify(summaryReport, null, 2));
  console.log(`📊 Benchmark Report saved successfully to ${path.join(outputDir, 'benchmark_report.json')}`);
  console.log('========================================');
  console.log(`🎉 OVERALL METRICS:`);
  console.log(`  Name Accuracy: ${(avgNameAcc * 100).toFixed(1)}%`);
  console.log(`  Register Accuracy: ${(avgRegAcc * 100).toFixed(1)}%`);
  console.log(`  Subject F1: ${(avgF1 * 100).toFixed(1)}%`);
  console.log(`  Throughput: ${throughput.toFixed(2)} pages/sec`);
  console.log(`  Regression Status: ${regressionDetected ? '❌ REGRESSION DETECTED' : '✅ PASSED'}`);
  console.log(`  Performance Degraded: ${performanceDegraded ? '❌ DEGRADED' : '✅ PASSED'}`);
  console.log('========================================');
  
  process.exit(0);
}

runBenchmark().catch(err => {
  console.error('Benchmark suite crashed:', err);
  process.exit(1);
});
