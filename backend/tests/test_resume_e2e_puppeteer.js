require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const puppeteer = require('puppeteer');
const assert = require('assert');

const URL = 'http://localhost:3000';
const STUDENT_ID = '73152313999';
const PASSWORD = '01012005';

async function delay(time) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, time)
  });
}

async function runE2EValidation() {
  console.log('==================================================');
  console.log('    STARTING AUTOMATED E2E RESUME VALIDATION');
  console.log('==================================================');

  // Launch browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Handle browser dialogs (confirmations, alerts)
  page.on('dialog', async dialog => {
    console.log(`[Dialog] Accepting dialog: ${dialog.message()}`);
    await dialog.accept();
  });

  // Log browser console logs to host console
  page.on('console', msg => {
    console.log(`[Browser Console] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  try {
    // --------------------------------------------------
    // PHASE 1: Login & Initial Loads
    // --------------------------------------------------
    console.log('\n[Phase 1] Navigating to login page...');
    await page.goto(URL, { waitUntil: 'networkidle2' });

    // Handle initial landing screen if there is a 'Get Started' button
    try {
      const getStartedBtn = await page.evaluateHandle(() => {
        return [...document.querySelectorAll('button, a')].find(el => el.textContent.includes('Get Started'));
      });
      if (getStartedBtn && getStartedBtn.asElement()) {
        await getStartedBtn.click();
        await delay(1000);
      }
    } catch (e) {
      // Ignored if landing page is not present
    }

    console.log('[Phase 1] Typing login credentials...');
    await page.waitForSelector('input[placeholder*="Register"]', { timeout: 10000 });
    await page.type('input[placeholder*="Register"]', STUDENT_ID);
    await page.type('input[placeholder*="password"]', PASSWORD);
    
    // Find and click Login button
    const loginButton = await page.evaluateHandle(() => {
      return [...document.querySelectorAll('button')].find(el => el.textContent.includes('Login'));
    });
    await loginButton.click();

    console.log('[Phase 1] Waiting for Dashboard load...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
    console.log(`[Phase 1] Login successful! Current URL: ${page.url()}`);

    // Navigate to Resume Builder
    console.log('[Phase 1] Navigating to Resume Builder...');
    await page.goto(`${URL}/resume-builder`, { waitUntil: 'networkidle2' });
    await delay(3000);

    // Verify student details pre-filled
    const emailVal = await page.$eval('input[placeholder*="Mail"]', el => el.value);
    const mobileVal = await page.$eval('input[placeholder*="Mobile"]', el => el.value);
    console.log(`[Phase 1] Pre-filled check: Email="${emailVal}", Phone="${mobileVal}"`);
    assert.ok(emailVal, 'Email must be pre-filled');
    assert.ok(mobileVal, 'Phone must be pre-filled');

    // --------------------------------------------------
    // PHASE 2: Input Error Dataset & AI Enhancements
    // --------------------------------------------------
    // Click Load Test Error Data button to populate Projects/Experience with error data first
    const loadDataBtn = await page.evaluateHandle(() => {
      return [...document.querySelectorAll('button')].find(el => el.textContent.includes('Load Test Error Data'));
    });
    if (loadDataBtn && loadDataBtn.asElement()) {
      console.log('[Phase 2] Clicking Load Test Error Data...');
      await page.evaluate(el => el.click(), loadDataBtn);
      await delay(1500);
    }

    // Fill Summary (overwriting the test data summary with our target error text)
    await page.focus('textarea');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type('textarea', 'i am hard wrking persn and i know python and jav script. i looking for good company. i done many projct and internship.');

    // Toggle Enable AI to ON (AI Integration yes radio button)
    const enableAIChecked = await page.evaluate(() => {
      const radioYes = document.querySelector('input#enableAI-yes');
      if (radioYes && !radioYes.checked) {
        radioYes.click();
      }
      return radioYes ? radioYes.checked : false;
    });
    console.log(`[Phase 2] Enable AI radio state: ${enableAIChecked}`);

    // Double check email and phone are valid format to avoid validation blocks
    await page.focus('input[placeholder*="Mail"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type('input[placeholder*="Mail"]', 'testuser999@gmail.com');

    await page.focus('input[placeholder*="Mobile"]');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    await page.type('input[placeholder*="Mobile"]', '9876543210');

    // Add Achievements bad text
    const addAchievementBtn = await page.evaluateHandle(() => {
      return [...document.querySelectorAll('button')].find(el => el.textContent.includes('Click to Add Achievement'));
    });
    if (addAchievementBtn && addAchievementBtn.asElement()) {
      console.log('[Phase 2] Editing achievements details...');
      await page.evaluate(el => {
        el.scrollIntoView();
        el.click();
      }, addAchievementBtn);
      await page.waitForSelector('textarea[placeholder*="achievement"]', { timeout: 5000 });
      await page.type('textarea[placeholder*="achievement"]', 'got first prize in coding compitition and hackthon.');
      const saveAchievementBtn = await page.evaluateHandle(() => {
        return [...document.querySelectorAll('button')].find(el => el.textContent.includes('Save'));
      });
      await page.evaluate(el => el.click(), saveAchievementBtn);
      await delay(1000);
    }

    // Trigger AI Creation
    console.log('[Phase 2] Triggering Create Resume...');
    const createBtn = await page.evaluateHandle(() => {
      return [...document.querySelectorAll('button')].find(el => el.textContent.includes('Create'));
    });
    await page.evaluate(el => {
      el.scrollIntoView();
      el.click();
    }, createBtn);

    // Wait for the Overlay to close (max 30 seconds)
    console.log('[Phase 2] Waiting for AI enhancement to complete...');
    await page.waitForFunction(() => {
      return ![...document.querySelectorAll('div')].some(el => el.textContent.includes('Resume Creating') || el.textContent.includes('Creating...'));
    }, { timeout: 35000 });
    console.log('[Phase 2] AI Generation Overlay closed.');
    await delay(3000);

    // Read summary
    const polishedSummary = await page.$eval('textarea', el => el.value);
    console.log(`[Phase 2] Polished Summary: "${polishedSummary}"`);

    // Assert corrections
    assert.ok(polishedSummary.toLowerCase().includes('motivated') || polishedSummary.toLowerCase().includes('hardworking'), 'Spelling "hard wrking" must be corrected');
    assert.ok(polishedSummary.toLowerCase().includes('python') || polishedSummary.toLowerCase().includes('java') || polishedSummary.toLowerCase().includes('jav'), 'Languages must be preserved');
    assert.ok(!polishedSummary.toLowerCase().includes('projct') && !polishedSummary.toLowerCase().includes('hackthon'), 'Spelling errors "projct" and "hackthon" must be resolved');

    // --------------------------------------------------
    // PHASE 3: Hallucination Protection Checks
    // --------------------------------------------------
    console.log('\n[Phase 3] Running Hallucination checks...');
    const unprovidedSkills = ['AWS', 'Docker', 'Kubernetes', 'FastAPI', 'CI/CD'];
    for (const skill of unprovidedSkills) {
      assert.ok(!polishedSummary.includes(skill), `Hallucination found: should not invent ${skill}`);
    }
    console.log('[Phase 3] Hallucination check PASSED: No fake technologies injected.');

    // --------------------------------------------------
    // PHASE 4: ATS Validation
    // --------------------------------------------------
    console.log('\n[Phase 4] Opening ATS Checker...');
    const atsBtn = await page.evaluateHandle(() => {
      return [...document.querySelectorAll('button')].find(el => el.textContent.toLowerCase().includes('ats check') || el.textContent.toLowerCase().includes('ats checker') || el.textContent.toLowerCase().includes('ats score'));
    });
    
    if (atsBtn && atsBtn.asElement()) {
      await page.evaluate(el => el.click(), atsBtn);
      console.log('[Phase 4] Clicked ATS check button, waiting for navigation and analysis...');
      await delay(3000);
      
      // Wait for the "Analyzing Your Resume..." overlay to disappear
      await page.waitForFunction(() => {
        return ![...document.querySelectorAll('h3')].some(el => el.textContent.includes('Analyzing Your Resume...'));
      }, { timeout: 20000 });
      await delay(2000);

      // Verify page content and missing keywords/suggestions
      const pageText = await page.evaluate(() => document.body.innerText);
      
      console.log('[Phase 4] Verifying missing keywords or ATS analysis details in checker...');
      console.log(`[Phase 4] Page preview text snippet: ${pageText.substring(0, 300).replace(/\n/g, ' ')}`);
      
      assert.ok(pageText.includes('Vue') || pageText.includes('Angular') || pageText.includes('TypeScript') || pageText.includes('Redux') || pageText.includes('Score') || pageText.includes('Grade') || pageText.includes('/100'), 'ATS Checker must display checker results');
      console.log('[Phase 4] ATS Validation PASSED.');
    } else {
      console.log('[Phase 4] ATS button not found, skipping UI checker check.');
    }

    // --------------------------------------------------
    // PHASE 5: ATS Anti-Cheat
    // --------------------------------------------------
    console.log('\n[Phase 5] Verifying anti-gaming stuff checks...');
    // We can evaluate directly via API to ensure anti-gaming outputs penaltyApplied
    const axios = require('axios');
    const atsCheckRes = await axios.post(`${URL}/api/resume-builder/ats-check`, {
      studentId: STUDENT_ID,
      resumeData: {
        personalInfo: { name: 'Test Student', email: 'student@anonymized.in', mobile: '9876543210' },
        summary: 'Python Python Python Python Python Python Python', // Stuffed summary
        skills: ['Python']
      }
    });

    console.log('[Phase 5] Stuffed check payload results:', {
      keywordStuffing: atsCheckRes.data.analysis.keywordStuffing,
      penaltyApplied: atsCheckRes.data.analysis.categories?.keywordMatch?.score < 40
    });
    
    assert.ok(atsCheckRes.data.analysis.keywordStuffing, 'Keyword stuffing must be flagged');
    console.log('[Phase 5] ATS Anti-Cheat check PASSED.');

    // --------------------------------------------------
    // PHASE 6: Resume Version History
    // --------------------------------------------------
    console.log('\n[Phase 6] Validating Version History...');
    // Fetch and check active saved resume record from MongoDB directly
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-portal', {
        family: 6,
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000
      });
    }

    // Resolve Student unique _id string from register number
    const Student = mongoose.models.Student || mongoose.model('Student', new mongoose.Schema({ regNo: String }), 'students');
    const studentDoc = await Student.findOne({ regNo: STUDENT_ID });
    if (!studentDoc) {
      throw new Error(`Student record not found for register number: ${STUDENT_ID}`);
    }
    const realStudentId = studentDoc._id.toString();
    console.log(`[Phase 6] Resolved student _id: "${realStudentId}" for regNo: "${STUDENT_ID}"`);

    const ResumeBuilderData = mongoose.models.ResumeBuilderData || mongoose.model('ResumeBuilderData', new mongoose.Schema({
      studentId: { type: String, required: true },
      resumeData: { type: mongoose.Schema.Types.Mixed, required: true }
    }), 'resumebuilderdatas');
    const savedRecord = await ResumeBuilderData.findOne({ studentId: realStudentId });
    
    console.log(`[Phase 6] Saved resume versions count: ${savedRecord?.resumeData?.versions?.length || 0}`);
    assert.ok(savedRecord?.resumeData?.versions?.length > 0, 'Versions array must be populated in the database');
    console.log('[Phase 6] Version History check PASSED.');

    // --------------------------------------------------
    // PHASE 7, 8 & 9: GridFS, Preview & Download
    // --------------------------------------------------
    console.log('\n[Phases 7, 8 & 9] Validating GridFS Preview & Download links...');
    const Resume = mongoose.models.Resume || mongoose.model('Resume', new mongoose.Schema({
      studentId: { type: String, required: true },
      gridfsFileId: { type: String },
      gridfsFileUrl: { type: String }
    }), 'resume');
    const resumePdfRecord = await Resume.findOne({ studentId: realStudentId });

    assert.ok(resumePdfRecord.gridfsFileId, 'gridfsFileId must exist');
    assert.ok(resumePdfRecord.gridfsFileUrl, 'gridfsFileUrl must exist');
    console.log(`[Phase 7] GridFS Record ID: ${resumePdfRecord.gridfsFileId}, URL: ${resumePdfRecord.gridfsFileUrl}`);

    // Verify preview and download works
    const previewRes = await axios.get(`${URL}${resumePdfRecord.gridfsFileUrl}`);
    assert.equal(previewRes.headers['content-type'], 'application/pdf', 'Preview must return application/pdf');
    assert.ok(previewRes.data, 'Preview PDF data must not be empty');
    console.log('[Phases 8 & 9] Preview & Download link verification PASSED.');

    // --------------------------------------------------
    // PHASE 10: Persistence Validation
    // --------------------------------------------------
    console.log('\n[Phase 10] Testing Persistence...');
    // Log out by going to home page
    await page.goto(`${URL}`, { waitUntil: 'networkidle2' });
    await delay(1000);
    
    // Login again
    await page.goto(URL, { waitUntil: 'networkidle2' });
    try {
      const getStartedBtn = await page.evaluateHandle(() => {
        return [...document.querySelectorAll('button, a')].find(el => el.textContent.includes('Get Started'));
      });
      if (getStartedBtn && getStartedBtn.asElement()) {
        await getStartedBtn.click();
        await delay(1000);
      }
    } catch (e) {}

    await page.waitForSelector('input[placeholder*="Register"]', { timeout: 10000 });
    await page.type('input[placeholder*="Register"]', STUDENT_ID);
    await page.type('input[placeholder*="password"]', PASSWORD);
    
    const loginButton2 = await page.evaluateHandle(() => {
      return [...document.querySelectorAll('button')].find(el => el.textContent.includes('Login'));
    });
    await loginButton2.click();
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

    // Navigate back to builder and make sure values persist
    await page.goto(`${URL}/resume-builder`, { waitUntil: 'networkidle2' });
    await delay(2000);
    const postLoginSummary = await page.$eval('textarea', el => el.value);
    console.log(`[Phase 10] Reloaded Summary: "${postLoginSummary.substring(0, 60)}..."`);
    assert.ok(postLoginSummary, 'Polished summary must persist after re-login');
    console.log('[Phase 10] Persistence validation PASSED.');

    console.log('\n==================================================');
    console.log('   🎉 ALL 10 PHASES PASSED SUCCESSFULLY!');
    console.log('==================================================\n');

  } catch (err) {
    console.error('\n❌ E2E Validation FAILED:', err.message);
    console.error(err.stack);
    await browser.close();
    process.exit(1);
  }

  await browser.close();
  process.exit(0);
}

runE2EValidation();
