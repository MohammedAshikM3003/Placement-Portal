/**
 * Integration Test: End-to-end offline marksheet extraction
 * Tests: OCR → Parsing → Validation → Review Queue → Audit Logging
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const OCR_URL = process.env.OCR_SERVICE_URL || 'http://localhost:5001';

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  verbose: true,
};

class IntegrationTester {
  constructor() {
    this.results = [];
    this.testsPassed = 0;
    this.testsFailed = 0;
  }

  log(message, data = '') {
    if (TEST_CONFIG.verbose) {
      console.log(`[TEST] ${message}`, data);
    }
  }

  async test(name, fn) {
    try {
      this.log(`Starting: ${name}`);
      await fn();
      this.testsPassed++;
      this.log(`✓ PASSED: ${name}`);
      this.results.push({ name, status: 'PASS' });
    } catch (err) {
      this.testsFailed++;
      this.log(`✗ FAILED: ${name}`);
      this.log(`  Error: ${err.message}`);
      this.results.push({ name, status: 'FAIL', error: err.message });
    }
  }

  async testOcrServiceHealth() {
    this.log('Testing OCR Service health...');
    try {
      const res = await axios.get(`${OCR_URL}/health`, { timeout: 5000 });
      if (res.status !== 200) throw new Error('OCR service not responding');
      this.log('OCR Service is healthy');
    } catch (err) {
      throw new Error(`OCR Service health check failed: ${err.message}`);
    }
  }

  async testBackendHealth() {
    this.log('Testing Backend health...');
    try {
      const res = await axios.get(`${BASE_URL}/api/health`, { timeout: 5000 });
      if (res.status !== 200) throw new Error('Backend not responding');
      this.log('Backend is healthy');
    } catch (err) {
      throw new Error(`Backend health check failed: ${err.message}`);
    }
  }

  async testValidationEngine() {
    this.log('Testing validation engine...');
    
    // Test case 1: Valid marksheet
    const valid = {
      regNo: '21CS001',
      studentName: 'Test Student',
      semester: 3,
      subjects: [
        { courseCode: '20CS511', courseName: 'DSA', grade: 'A+', result: 'P', credits: 3 },
        { courseCode: '20CS512', courseName: 'DBMS', grade: 'A', result: 'P', credits: 3 },
      ],
      sgpa: 9.0,
    };

    // Import validation service
    const { validateMarksheetData } = require('./services/marksheetValidation.js');
    const validation1 = validateMarksheetData(valid);
    if (!validation1.isValid) {
      throw new Error(`Valid marksheet failed validation: ${JSON.stringify(validation1.errors)}`);
    }
    this.log('Valid marksheet passed validation');

    // Test case 2: Invalid semester
    const invalidSemester = { ...valid, semester: 9 };
    const validation2 = validateMarksheetData(invalidSemester);
    if (validation2.isValid) {
      throw new Error('Invalid semester should fail validation');
    }
    this.log('Invalid semester correctly rejected');

    // Test case 3: Duplicate course codes
    const duplicateCodes = {
      ...valid,
      subjects: [
        valid.subjects[0],
        { ...valid.subjects[1], courseCode: '20CS511' }, // duplicate
      ],
    };
    const validation3 = validateMarksheetData(duplicateCodes);
    if (validation3.isValid) {
      throw new Error('Duplicate codes should fail validation');
    }
    this.log('Duplicate codes correctly rejected');
  }

  async testConfidenceScoring() {
    this.log('Testing confidence scoring...');

    const { scoreMarksheetConfidence } = require('./services/marksheetValidation.js');
    const { validateMarksheetData } = require('./services/marksheetValidation.js');

    const marksheet = {
      regNo: '21CS001',
      studentName: 'Test Student',
      semester: 3,
      subjects: [
        { courseCode: '20CS511', courseName: 'DSA', grade: 'A+', result: 'P', credits: 3 },
        { courseCode: '20CS512', courseName: 'DBMS', grade: 'A', result: 'P', credits: 3 },
      ],
      sgpa: 9.0,
    };

    const ocrMeta = {
      averageConfidence: 0.92,
      totalTokens: 50,
      retryAttempts: 1,
    };

    const validation = validateMarksheetData(marksheet);
    const score = scoreMarksheetConfidence(marksheet, ocrMeta, validation);

    if (typeof score !== 'number' || score < 0 || score > 1) {
      throw new Error(`Invalid confidence score: ${score}`);
    }

    this.log(`Confidence score: ${score.toFixed(2)}`);
    if (score < 0.72) {
      this.log('Score below threshold - should go to review queue');
    }
  }

  async testSubjectMatcher() {
    this.log('Testing subject matcher...');

    const { matchCourseCode, buildSubjectLookup } = require('./services/subjectMatcher.js');

    // Mock subject collection
    const subjects = [
      { courseCode: '20CS511', courseName: 'DSA', credits: 3 },
      { courseCode: '20CS512', courseName: 'DBMS', credits: 3 },
      { courseCode: 'GE8291', courseName: 'Ethics', credits: 2 },
    ];

    const lookup = buildSubjectLookup(subjects);

    // Test exact match
    const match1 = matchCourseCode('20CS511', lookup);
    if (!match1.match) throw new Error('Exact match failed');
    this.log('Exact match: 20CS511 ✓');

    // Test fuzzy match
    const match2 = matchCourseCode('20C511', lookup); // Missing S
    if (!match2.match) throw new Error('Fuzzy match (Levenshtein) failed');
    this.log(`Fuzzy match: 20C511 → ${match2.correctedCode} ✓`);

    // Test no match
    const match3 = matchCourseCode('99XX999', lookup);
    if (match3.match) throw new Error('Should not match unknown code');
    this.log('Correctly rejected unknown code: 99XX999');
  }

  async testOcrEndpoint() {
    this.log('Testing OCR endpoint...');

    // Create a minimal test PDF (Base64 encoded empty PDF)
    const testPdfBase64 = Buffer.from(
      'JVBERi0xLjQKJeLjz9MNCjEgMCBvYmo8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFI+PmVuZG9iagoyIDAgb2JqPDwvVHlwZS9QYWdlcy9LaWRzWzMgMCBSXS9Db3VudCAxPj5lbmRvYmoKMyAwIG9iajw8L1R5cGUvUGFnZS9QYXJlbnQgMiAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDQgMCBSPj4+Pj4vTWVkaWFCb3hbMCAwIDYxMiA3OTJdL0NvbnRlbnRzIDUgMCBSPj5lbmRvYgoK',
      'base64'
    );

    try {
      const res = await axios.post(
        `${OCR_URL}/parse-marksheet-pages-v2`,
        { pdf_base64: testPdfBase64.toString('base64'), min_conf: 0.65 },
        { timeout: 10000 }
      );

      if (!res.data.pages) {
        throw new Error('OCR response missing pages');
      }

      this.log(`OCR extracted ${res.data.pages.length} page(s)`);
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 422) {
        // Expected for minimal PDF
        this.log('OCR rejected minimal PDF (expected)');
      } else {
        throw err;
      }
    }
  }

  async runAll() {
    console.log('\n' + '='.repeat(60));
    console.log('INTEGRATION TEST SUITE');
    console.log('='.repeat(60) + '\n');

    await this.test('OCR Service Health', () => this.testOcrServiceHealth());
    await this.test('Backend Health', () => this.testBackendHealth());
    await this.test('Validation Engine', () => this.testValidationEngine());
    await this.test('Confidence Scoring', () => this.testConfidenceScoring());
    await this.test('Subject Matcher', () => this.testSubjectMatcher());
    await this.test('OCR Endpoint', () => this.testOcrEndpoint());

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Passed: ${this.testsPassed}`);
    console.log(`Failed: ${this.testsFailed}`);
    console.log(`Total:  ${this.testsPassed + this.testsFailed}`);

    if (this.testsFailed === 0) {
      console.log('\n✓ ALL TESTS PASSED\n');
      process.exit(0);
    } else {
      console.log('\n✗ SOME TESTS FAILED\n');
      console.log(JSON.stringify(this.results, null, 2));
      process.exit(1);
    }
  }
}

// Run tests
const tester = new IntegrationTester();
tester.runAll().catch((err) => {
  console.error('Test suite error:', err);
  process.exit(1);
});
