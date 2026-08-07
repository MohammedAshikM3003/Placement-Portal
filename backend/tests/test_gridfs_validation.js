/**
 * GridFS Resume Preview & Download Path Validation Suite
 * Runs 100 full create-save-load-preview-download cycles against the active Node backend.
 */

const BACKEND_URL = 'http://localhost:5000';

function generateMockResumeData(index) {
  return {
    personalInfo: {
      name: `Test Student ${index}`,
      email: `test.student.${index}@anonymized.in`,
      mobile: `98765432${index.toString().padStart(2, '0')}`,
      linkedin: `linkedin.com/in/teststudent${index}`,
      github: `github.com/teststudent${index}`,
      portfolio: ''
    },
    summary: 'Detail-oriented test student showing hands-on experience in building systems.',
    education: {
      college: 'Test University',
      degree: 'B.E.',
      branch: 'Computer Science',
      cgpa: '8.5',
      graduationYear: '2026'
    },
    skills: [
      { category: 'Technical', items: ['JavaScript', 'React', 'Node.js', 'SQL'] }
    ],
    experiences: [
      {
        title: 'Software Engineer Intern',
        companyName: 'Mock Company',
        location: 'Remote',
        mode: 'remote',
        fromDate: '2024-01-01',
        toDate: '2024-04-01',
        description: 'Assisted team in frontend rendering and fixed bugs.',
        technologies: ['React', 'JavaScript']
      }
    ],
    projects: [
      {
        name: 'Mock Project',
        description: 'Made an e-commerce platform with login flow.',
        technologies: ['Node.js', 'Express', 'MongoDB']
      }
    ],
    certifications: [],
    achievements: [],
    platforms: [],
    resumeSettings: {
      jobRole: 'Software Engineer',
      customJobRole: '',
      fontStyle: 'Arial',
      pages: '1',
      enableAI: false,
      linkType: 'HyperLink'
    }
  };
}

async function runGridFSValidation() {
  console.log('==================================================');
  console.log('       STARTING GRIDFS RESUME PATH VALIDATION');
  console.log('==================================================');
  console.log(`Target Backend: ${BACKEND_URL}`);
  console.log('Running 100 iterations of save/load/preview/download...\n');

  let successCount = 0;
  let failureCount = 0;

  for (let i = 1; i <= 100; i++) {
    const studentId = `mock_student_id_${1000 + i}`;
    const resumeData = generateMockResumeData(i);

    try {
      // 1. Create & Generate PDF (this saves it to GridFS and Resume collections)
      const generateResponse = await fetch(`${BACKEND_URL}/api/resume-builder/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, studentId })
      });

      if (!generateResponse.ok) {
        throw new Error(`Failed to generate PDF resume: HTTP ${generateResponse.status}`);
      }

      const pdfBuffer = await generateResponse.arrayBuffer();
      if (pdfBuffer.byteLength === 0) {
        throw new Error('Generated PDF buffer is empty');
      }

      // 2. Load resume PDF meta-data (simulates page refresh or login)
      const pdfMetaResponse = await fetch(`${BACKEND_URL}/api/resume-builder/pdf/${studentId}`);
      if (!pdfMetaResponse.ok) {
        throw new Error(`Failed to load PDF meta-data: HTTP ${pdfMetaResponse.status}`);
      }

      const pdfMetaData = await pdfMetaResponse.json();
      if (!pdfMetaData.success || !pdfMetaData.resume) {
        throw new Error('PDF meta-data response indicates failure or missing resume');
      }

      const gridfsUrl = pdfMetaData.resume.gridfsFileUrl;
      if (!gridfsUrl) {
        throw new Error('gridfsFileUrl is missing in resume meta-data');
      }

      // 3. Download the PDF via GridFS URL (simulates preview / download flow)
      // Note: gridfsUrl starts with /api/file/, so we append it to BACKEND_URL
      const downloadResponse = await fetch(`${BACKEND_URL}${gridfsUrl}`);
      if (!downloadResponse.ok) {
        throw new Error(`Failed to download PDF from GridFS URL: HTTP ${downloadResponse.status}`);
      }

      const contentType = downloadResponse.headers.get('content-type');
      if (contentType !== 'application/pdf') {
        throw new Error(`Invalid content-type: expected application/pdf, got ${contentType}`);
      }

      const downloadedBuffer = await downloadResponse.arrayBuffer();
      if (downloadedBuffer.byteLength === 0) {
        throw new Error('Downloaded PDF buffer from GridFS is empty');
      }

      successCount++;
      if (i % 10 === 0 || i === 100) {
        console.log(`  Progress: ${i}/100 cycles completed successfully.`);
      }
    } catch (error) {
      failureCount++;
      console.error(`❌ Cycle #${i} failed for studentId ${studentId}: ${error.message}`);
    }
  }

  console.log('\n==================================================');
  console.log('       GRIDFS VALIDATION CYCLE RESULTS');
  console.log('==================================================');
  console.log(`Total Cycles Run:  100`);
  console.log(`Successful:        ${successCount}/100`);
  console.log(`Failed:            ${failureCount}/100`);
  console.log(`Status:            ${failureCount === 0 ? 'PASSED (10/10 READY)' : 'FAILED'}`);
  console.log('==================================================\n');

  if (failureCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runGridFSValidation();
