const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');
const { Readable } = require('stream');
const http = require('http');
const https = require('https');

// GridFS bucket
let gridFSBucket;
function getBucket() {
  if (!gridFSBucket && mongoose.connection.readyState === 1) {
    gridFSBucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'student_files' });
  }
  return gridFSBucket;
}

// Initialize bucket
mongoose.connection.once('open', () => {
  gridFSBucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'student_files' });
});

// Upload buffer to GridFS
function uploadToGridFS(buffer, filename, contentType, metadata = {}) {
  return new Promise((resolve, reject) => {
    const bucket = getBucket();
    if (!bucket) return reject(new Error('GridFS bucket not initialized'));
    
    // Create a proper readable stream from buffer
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null); // Signal end of stream
    
    const uploadStream = bucket.openUploadStream(filename, { contentType, metadata });
    
    uploadStream.on('finish', () => resolve({ id: uploadStream.id.toString(), filename }));
    uploadStream.on('error', reject);
    readableStream.pipe(uploadStream);
  });
}

// Lazy model getters - resolve at call time to avoid "Cannot overwrite model" errors
function getResumeModel() {
  return mongoose.models.Resume || require('../models/Resume');
}
function getStudentModel() {
  return mongoose.models.Student || require('../models/Student');
}

/**
 * Resume Builder Backend Routes
 * Handles: Save resume data, Generate PDF, LaTeX compilation
 */

// ===== MIDDLEWARE: Auth check (optional - uses JWT if available) =====
const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'placement-portal-secret');
      req.userId = decoded.id || decoded.userId;
    }
  } catch (e) {
    // Continue without auth
  }
  next();
};

// ===== POST /api/resume-builder/save =====
// Save resume form data to database
router.post('/save', optionalAuth, async (req, res) => {
  try {
    const { studentId, resumeData } = req.body;
    if (!studentId || !resumeData) {
      return res.status(400).json({ error: 'Missing studentId or resumeData' });
    }

    // Save to MongoDB if available
    try {
      const mongoose = require('mongoose');
      if (mongoose.connection.readyState === 1) {
        // Use a dedicated collection for resume builder data
        const ResumeBuilderData = mongoose.models.ResumeBuilderData || mongoose.model('ResumeBuilderData', new mongoose.Schema({
          studentId: { type: String, required: true, index: true, unique: true },
          resumeData: { type: mongoose.Schema.Types.Mixed, required: true },
          updatedAt: { type: Date, default: Date.now },
          createdAt: { type: Date, default: Date.now },
        }));

        await ResumeBuilderData.findOneAndUpdate(
          { studentId },
          { resumeData, updatedAt: new Date() },
          { upsert: true, new: true }
        );
      }
    } catch (dbError) {
      console.warn('DB save failed (non-critical):', dbError.message);
    }

    res.json({ success: true, message: 'Resume data saved' });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: 'Failed to save resume data' });
  }
});

// ===== GET /api/resume-builder/load/:studentId =====
// Load saved resume form data
router.get('/load/:studentId', optionalAuth, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const ResumeBuilderData = mongoose.models.ResumeBuilderData || mongoose.model('ResumeBuilderData', new mongoose.Schema({
      studentId: { type: String, required: true, index: true, unique: true },
      resumeData: { type: mongoose.Schema.Types.Mixed, required: true },
      updatedAt: { type: Date, default: Date.now },
      createdAt: { type: Date, default: Date.now },
    }));

    const data = await ResumeBuilderData.findOne({ studentId });
    if (!data) {
      return res.status(404).json({ error: 'No saved data found' });
    }

    res.json({ success: true, resumeData: data.resumeData });
  } catch (error) {
    console.error('Load error:', error);
    res.status(500).json({ error: 'Failed to load resume data' });
  }
});

// ===== POST /api/resume-builder/generate =====
// Generate PDF resume from form data using Puppeteer
router.post('/generate', optionalAuth, async (req, res) => {
  try {
    const { resumeData, studentId } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: 'Missing resumeData' });
    }

    const html = await buildResumeHTML(resumeData, req);

    // Try Puppeteer PDF generation
    let pdfBuffer;
    try {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=medium',
        ],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '0.4in', right: '0.3in', bottom: '0.4in', left: '0.3in' },
        printBackground: true,
      });
      await browser.close();
    } catch (puppeteerErr) {
      console.error('Puppeteer failed:', puppeteerErr.message);
      // Return HTML for client-side printing as fallback
      return res.status(200).set('Content-Type', 'text/html').send(html);
    }

    // Save to MongoDB if studentId is provided
    if (studentId && pdfBuffer) {
      try {
        if (mongoose.connection.readyState === 1) {
          const Resume = getResumeModel();
          const Student = getStudentModel();

          console.log(`📝 Saving resume to MongoDB for studentId: ${studentId}`);

          // Get student info - try findById first, fall back to string query
          let student = null;
          try {
            if (mongoose.Types.ObjectId.isValid(studentId)) {
              student = await Student.findById(studentId);
            }
            if (!student) {
              student = await Student.findOne({ _id: studentId });
            }
          } catch (findErr) {
            console.warn('⚠️ Student lookup failed:', findErr.message);
            // Try by regNo as last resort
            try {
              student = await Student.findOne({ regNo: studentId });
            } catch (e) {
              console.warn('⚠️ Student regNo lookup also failed:', e.message);
            }
          }

          const studentName = resumeData.personalInfo?.name || 
                               (student ? `${student.firstName || ''} ${student.lastName || ''}`.trim() : 'Unknown');
          const regNo = student?.regNo || studentId;

          console.log(`📝 Student found: ${!!student}, name: ${studentName}, regNo: ${regNo}`);

          // Upload PDF to GridFS
          const filename = `resume_${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
          const metadata = { category: 'resume', studentId: String(studentId), originalName: `${studentName}_Resume.pdf` };
          
          let gridfsFileId = null;
          let gridfsFileUrl = null;
          
          try {
            const uploaded = await uploadToGridFS(pdfBuffer, filename, 'application/pdf', metadata);
            gridfsFileId = uploaded.id;
            gridfsFileUrl = `/api/file/${gridfsFileId}`;
            console.log(`✅ PDF uploaded to GridFS: ${gridfsFileId}`);
          } catch (gridfsErr) {
            console.error('❌ GridFS upload failed:', gridfsErr.message);
            // Continue without GridFS if it fails
          }

          // Find existing resume and delete old GridFS file if it exists
          const existingResume = await Resume.findOne({ studentId: String(studentId) });
          if (existingResume && existingResume.gridfsFileId && gridfsFileId) {
            try {
              const bucket = getBucket();
              if (bucket) {
                await bucket.delete(new ObjectId(existingResume.gridfsFileId));
                console.log(`🗑️ Deleted old GridFS file: ${existingResume.gridfsFileId}`);
              }
            } catch (e) {
              console.warn('⚠️ Could not delete old GridFS file:', e.message);
            }
          }

          // Save or update resume in Resume collection (NO BASE64 DATA)
          const savedResume = await Resume.findOneAndUpdate(
            { studentId: String(studentId) },
            {
              studentId: String(studentId),
              regNo: regNo,
              name: studentName,
              fileName: `${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf`,
              fileSize: pdfBuffer.length,
              fileType: 'application/pdf',
              gridfsFileId: gridfsFileId,
              gridfsFileUrl: gridfsFileUrl,
              resumeData: resumeData,
              updatedAt: new Date(),
              uploadedAt: existingResume ? existingResume.uploadedAt : new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );

          console.log(`✅ Resume saved to 'resume' collection, _id: ${savedResume._id}`);
          console.log(`✅ GridFS URL: ${gridfsFileUrl}`);

          // Update Student model with GridFS URL for compatibility
          if (student && gridfsFileUrl) {
            student.resumeURL = gridfsFileUrl;
            student.resumeData = {
              url: gridfsFileUrl,
              name: `${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf`,
              createdAt: existingResume ? existingResume.uploadedAt : new Date()
            };
            await student.save();
            console.log(`✅ Student model updated with GridFS URL`);
          }

          console.log(`✅ Resume fully saved for student: ${studentName} (${regNo})`);
        } else {
          console.warn('⚠️ MongoDB not connected (readyState:', mongoose.connection.readyState, ')');
        }
      } catch (dbError) {
        console.error('❌ DB save failed:', dbError.message);
        console.error('❌ DB save stack:', dbError.stack);
      }
    } else {
      console.warn('⚠️ Resume not saved to DB - studentId:', studentId, 'pdfBuffer:', !!pdfBuffer);
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${(resumeData.personalInfo?.name || 'Resume').replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ error: 'Failed to generate resume PDF' });
  }
});

// ===== GET /api/resume-builder/pdf/:studentId =====
// Fetch the generated resume PDF data from the resume collection
router.get('/pdf/:studentId', optionalAuth, async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`🔍 GET /api/resume-builder/pdf/${studentId}`);
    
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log('❌ MongoDB not connected');
      return res.status(503).json({ error: 'Database not connected' });
    }

    const Resume = getResumeModel();
    const resume = await Resume.findOne({ studentId: String(studentId) });
    
    if (!resume) {
      console.log(`❌ Resume not found for studentId: ${studentId}`);
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Prefer GridFS URL over legacy Base64 URL
    const resumeUrl = resume.gridfsFileUrl || resume.url;
    
    console.log(`✅ Resume found: ${resume.name}`);
    console.log(`🔍 Using URL: ${resumeUrl}`);
    console.log(`🔍 GridFS File ID: ${resume.gridfsFileId || 'none'}`);
    
    res.json({ 
      success: true, 
      resume: {
        name: resume.name,
        url: resumeUrl,
        regNo: resume.regNo,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
        atsAnalysis: (resume.atsAnalysis && resume.atsAnalysis.overallScore) ? resume.atsAnalysis : null
      }
    });
  } catch (error) {
    console.error('❌ Fetch resume PDF error:', error);
    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

// ===== POST /api/resume-builder/generate-latex =====
// Generate resume using LaTeX template (Overleaf-style) 
router.post('/generate-latex', optionalAuth, async (req, res) => {
  try {
    const { resumeData } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: 'Missing resumeData' });
    }

    const latex = buildResumeLatex(resumeData);

    // Try compiling with latex.online API
    const LATEX_API_KEY = process.env.LATEX_API_KEY;
    const LATEX_API_URL = process.env.LATEX_API_URL || 'https://latexonline.cc/compile';

    if (LATEX_API_KEY || LATEX_API_URL) {
      try {
        const response = await fetch(`${LATEX_API_URL}?text=${encodeURIComponent(latex)}`, {
          method: 'GET',
          headers: LATEX_API_KEY ? { 'Authorization': `Bearer ${LATEX_API_KEY}` } : {},
          timeout: 30000,
        });

        if (response.ok) {
          const pdfBuffer = Buffer.from(await response.arrayBuffer());
          res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${(resumeData.personalInfo?.name || 'Resume').replace(/[^a-zA-Z0-9]/g, '_')}_Resume.pdf"`,
          });
          return res.send(pdfBuffer);
        }
      } catch (latexErr) {
        console.warn('LaTeX API failed, falling back to Puppeteer:', latexErr.message);
      }
    }

    // Fallback to Puppeteer HTML
    const html = await buildResumeHTML(resumeData);
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', margin: { top: '0.4in', right: '0.3in', bottom: '0.4in', left: '0.3in' }, printBackground: true });
    await browser.close();

    res.set({ 'Content-Type': 'application/pdf' });
    res.send(pdfBuffer);
  } catch (error) {
    console.error('LaTeX generate error:', error);
    res.status(500).json({ error: 'Failed to generate LaTeX resume' });
  }
});

// ===== POST /api/resume-builder/score =====
// Score the resume based on completeness and ATS compatibility
router.post('/score', optionalAuth, async (req, res) => {
  try {
    const { resumeData } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: 'Missing resumeData' });
    }

    const score = calculateResumeScore(resumeData);
    res.json({ success: true, score });
  } catch (error) {
    console.error('Score error:', error);
    res.status(500).json({ error: 'Failed to score resume' });
  }
});

// ===== AI GENERATE DESCRIPTION (via Ollama local AI) =====
router.post('/ai-generate', optionalAuth, async (req, res) => {
  // Extend Express timeout for batch AI requests
  req.setTimeout(120000); // 120s
  res.setTimeout(120000); // 120s
  
  try {
    const { prompt, type } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    const { callOllama, checkOllamaStatus } = require('../ollamaService');

    // Check if Ollama is running
    const status = await checkOllamaStatus();
    if (!status.running) {
      return res.status(503).json({ 
        error: 'Ollama is not running. Please start Ollama on your machine.',
        details: 'Run: ollama serve'
      });
    }

    const MIN_WORDS = 30;
    const MAX_RETRIES = 2;

    // Helper: clean AI response text
    function cleanText(raw) {
      return raw.trim()
        .replace(/^["'`]+|["'`]+$/g, '')
        .replace(/^(Professional Summary|Summary|Here is|Here's|Here is your|Sure)[:\s,]*/i, '')
        .replace(/\*\*/g, '').replace(/\*/g, '')
        .replace(/^["'`]+|["'`]+$/g, '')
        .trim();
    }

    // Helper: ensure text ends with punctuation
    function fixPunctuation(text) {
      const lastChar = text[text.length - 1];
      if (['.', '!', '?'].includes(lastChar)) return text;
      const lastEnd = Math.max(text.lastIndexOf('.'), text.lastIndexOf('!'), text.lastIndexOf('?'));
      if (lastEnd > text.length * 0.6) {
        return text.substring(0, lastEnd + 1).trim();
      }
      return text + '.';
    }

    let lastError = null;
    let bestResponse = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        let currentPrompt = prompt;
        if (attempt > 0) {
          currentPrompt = `IMPORTANT: Your previous response was too short. You MUST write AT LEAST 60 words. Do NOT write less than 50 words under any circumstances.\n\n${prompt}\n\nREMINDER: The response MUST be 60-80 words long. Count your words before responding.`;
        }

        const systemPrompt = 'You are an expert Technical Recruiter and Professional Resume Writer specializing in the software engineering industry. Use strong action verbs and a confident, professional tone. Emphasize technical implementation and project impact. Ensure all output is ATS-friendly with industry-specific keywords.';
        const fullPrompt = `${systemPrompt}\n\n${currentPrompt}${type === 'json' ? '\n\nIMPORTANT: Return ONLY valid JSON, no markdown code blocks, no extra text.' : ''}`;

        console.log(`🤖 Backend: Ollama attempt ${attempt + 1}...`);
        const text_raw = await callOllama(fullPrompt, {
          temperature: 0.7,
          max_tokens: type === 'json' ? 4096 : 1024,
        });

        if (!text_raw) {
          lastError = new Error('Empty response from Ollama');
          break;
        }

        let text = text_raw.trim();

        // Special handling for JSON batch requests
        if (type && type === 'json') {
          text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
          console.log(`✅ Backend: JSON generated via Ollama (length=${text.length})`);
          return res.json({ success: true, text, model: 'ollama', wordCount: text.length });
        }

        text = cleanText(text);
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
        console.log(`📊 Ollama: cleaned wordCount=${wordCount}`);

        if (!bestResponse || wordCount > bestResponse.wordCount) {
          bestResponse = { text, wordCount, model: 'ollama' };
        }

        if (wordCount >= MIN_WORDS) {
          text = fixPunctuation(text);
          console.log(`✅ Backend: Content generated via Ollama (${wordCount} words)`);
          return res.json({ success: true, text, model: 'ollama', wordCount });
        }

        console.warn(`⚠️ Ollama: Only ${wordCount} words (need ${MIN_WORDS}+), ${attempt === 0 ? 'retrying with enhanced prompt...' : 'using best response...'}`);
        lastError = new Error(`Response too short: ${wordCount} words`);
        
      } catch (err) {
        console.error(`❌ Ollama failed:`, err.message);
        lastError = err;
        break;
      }
    }

    // If we got any response, use the best one
    if (bestResponse && bestResponse.wordCount >= 10) {
      const text = fixPunctuation(bestResponse.text);
      console.warn(`⚠️ Using best available response (${bestResponse.wordCount} words)`);
      return res.json({ 
        success: true, 
        text, 
        model: 'ollama', 
        wordCount: bestResponse.wordCount, 
        partial: true 
      });
    }

    throw lastError || new Error('AI generation failed');
  } catch (error) {
    console.error('AI generate error:', error);
    res.status(500).json({ error: 'AI generation failed: ' + error.message });
  }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

async function buildResumeHTML(data, req = null) {
  const { personalInfo = {}, summary = '', education = {}, platforms = [], skills = [], experiences = [], projects = [], certifications = [], achievements = [], additionalInfo = [], resumeSettings = {} } = data;
  
  // Get font style from settings, default to Arial
  const fontFamily = resumeSettings.fontStyle || 'Arial';
  console.log('📝 Building resume with font style:', fontFamily, '| Full resumeSettings:', resumeSettings);
  
  // Map font names to Google Fonts imports (so fonts work on any server, no installation needed)
  const googleFontsMap = {
    'Arial': { import: 'Arimo:wght@400;700', stack: "'Arimo', 'Arial', 'Helvetica', sans-serif" },
    'Times New Roman': { import: 'Tinos:wght@400;700', stack: "'Tinos', 'Times New Roman', 'Times', serif" },
    'Calibri': { import: 'Carlito:wght@400;700', stack: "'Carlito', 'Calibri', 'Candara', sans-serif" },
    'Georgia': { import: 'Tinos:wght@400;700', stack: "'Tinos', 'Georgia', 'Times New Roman', serif" },
    'Helvetica': { import: 'Arimo:wght@400;700', stack: "'Arimo', 'Helvetica', 'Arial', sans-serif" },
    'Cambria': { import: 'Caladea:wght@400;700', stack: "'Caladea', 'Cambria', 'Georgia', serif" },
    'Garamond': { import: 'EB+Garamond:wght@400;700', stack: "'EB Garamond', 'Garamond', 'Georgia', serif" },
    'Verdana': { import: 'Open+Sans:wght@400;700', stack: "'Open Sans', 'Verdana', 'Geneva', sans-serif" }
  };
  
  const fontConfig = googleFontsMap[fontFamily] || googleFontsMap['Arial'];
  const fontStack = fontConfig.stack;
  const googleFontImport = fontConfig.import;
  console.log('🎨 Applied font stack:', fontStack, '| Google Font:', googleFontImport);

  // Ensure mobile has +91 prefix
  const rawMobile = personalInfo.mobile || '';
  const formattedMobile = rawMobile && !rawMobile.startsWith('+') ? `+91 ${rawMobile.replace(/^0+/, '')}` : rawMobile;

  // Get link type preference (HyperLink or URL)
  const linkType = resumeSettings.linkType || 'HyperLink';
  const useFullURL = linkType === 'URL';
  console.log('🔗 Link type:', linkType, '| Using full URLs:', useFullURL);

  // Build contact parts: plain text for mobile, mailto for email, labeled links for LinkedIn/GitHub/Portfolio
  const contactItems = [];
  if (formattedMobile) contactItems.push(escapeHtml(formattedMobile));
  if (personalInfo.email) contactItems.push(`<a href="mailto:${escapeHtml(personalInfo.email)}">${escapeHtml(personalInfo.email)}</a>`);
  if (personalInfo.linkedin) {
    const linkedinUrl = personalInfo.linkedin.startsWith('http') ? personalInfo.linkedin : 'https://' + personalInfo.linkedin;
    const displayText = useFullURL ? escapeHtml(linkedinUrl) : 'LinkedIn';
    contactItems.push(`<a href="${escapeHtml(linkedinUrl)}" target="_blank">${displayText}</a>`);
  }
  if (personalInfo.github) {
    const githubUrl = personalInfo.github.startsWith('http') ? personalInfo.github : 'https://' + personalInfo.github;
    const displayText = useFullURL ? escapeHtml(githubUrl) : 'GitHub';
    contactItems.push(`<a href="${escapeHtml(githubUrl)}" target="_blank">${displayText}</a>`);
  }
  if (personalInfo.portfolio) {
    const portfolioUrl = personalInfo.portfolio.startsWith('http') ? personalInfo.portfolio : 'https://' + personalInfo.portfolio;
    const displayText = useFullURL ? escapeHtml(portfolioUrl) : 'Portfolio';
    contactItems.push(`<a href="${escapeHtml(portfolioUrl)}" target="_blank">${displayText}</a>`);
  }
  if (personalInfo.address) contactItems.push(escapeHtml(personalInfo.address));

  // Build coding profile links for second contact line
  const codingProfileItems = platforms.filter(p => p.url && p.name).map(p => {
    const url = p.url.startsWith('http') ? p.url : 'https://' + p.url;
    const displayText = useFullURL ? escapeHtml(url) : escapeHtml(p.name);
    return `<a href="${escapeHtml(url)}" target="_blank">${displayText}</a>`;
  });

  // Profile photo settings
  const showProfilePhoto = resumeSettings.profilePhoto === true;
  const photoPosition = resumeSettings.photoPosition || 'Left';
  let profilePhotoUrl = personalInfo.photo || personalInfo.profilePhotoUrl || '';
  
  console.log('📷 Initial photo URL from personalInfo:', profilePhotoUrl);
  console.log('📷 personalInfo.photo:', personalInfo.photo);
  console.log('📷 personalInfo.profilePhotoUrl:', personalInfo.profilePhotoUrl);
  
  // Convert to base64 data URL if it's a GridFS file ID
  if (showProfilePhoto && profilePhotoUrl) {
    // Extract GridFS file ID
    let fileId = null;
    if (profilePhotoUrl.startsWith('/api/file/')) {
      fileId = profilePhotoUrl.replace('/api/file/', '');
    } else if (profilePhotoUrl.startsWith('/file/')) {
      fileId = profilePhotoUrl.replace('/file/', '');
    } else if (/^[a-f0-9]{24}$/.test(profilePhotoUrl)) {
      fileId = profilePhotoUrl;
    } else if (profilePhotoUrl.includes('/file/')) {
      // Handle full URLs like http://localhost:5000/file/abc123
      const match = profilePhotoUrl.match(/\/file\/([a-f0-9]{24})/);
      if (match) fileId = match[1];
    }
    
    if (fileId && mongoose.connection.readyState === 1) {
      try {
        console.log('📷 Converting GridFS file to base64, fileId:', fileId);
        const bucket = getBucket();
        if (bucket) {
          const chunks = [];
          const downloadStream = bucket.openDownloadStream(new ObjectId(fileId));
          await new Promise((resolve, reject) => {
            downloadStream.on('data', (chunk) => chunks.push(chunk));
            downloadStream.on('end', resolve);
            downloadStream.on('error', reject);
          });
          const buffer = Buffer.concat(chunks);
          const base64 = buffer.toString('base64');
          // Try to detect content type from file metadata
          let contentType = 'image/jpeg';
          try {
            const files = await mongoose.connection.db.collection('student_files.files').findOne({ _id: new ObjectId(fileId) });
            if (files?.contentType) contentType = files.contentType;
          } catch (e) { /* use default */ }
          profilePhotoUrl = `data:${contentType};base64,${base64}`;
          console.log('📷 ✅ Converted to base64 data URL (length:', profilePhotoUrl.length, ')');
        }
      } catch (gridfsErr) {
        console.error('📷 ❌ GridFS base64 conversion failed:', gridfsErr.message);
        // Fallback: convert to full URL
        const protocol = req?.protocol || 'http';
        const host = req?.get('host') || 'localhost:5000';
        if (!profilePhotoUrl.startsWith('http')) {
          profilePhotoUrl = `${protocol}://${host}${profilePhotoUrl.startsWith('/') ? '' : '/'}${profilePhotoUrl}`;
        }
      }
    } else if (!profilePhotoUrl.startsWith('data:') && !profilePhotoUrl.startsWith('http')) {
      // Relative URL - convert to full URL as fallback
      const protocol = req?.protocol || 'http';
      const host = req?.get('host') || 'localhost:5000';
      profilePhotoUrl = `${protocol}://${host}${profilePhotoUrl.startsWith('/') ? '' : '/'}${profilePhotoUrl}`;
      console.log('📷 Converted relative URL to:', profilePhotoUrl);
    }
  }
  
  console.log('📷 Profile photo enabled:', showProfilePhoto, '| Position:', photoPosition, '| Has photo:', !!profilePhotoUrl, '| URL type:', profilePhotoUrl?.startsWith('data:') ? 'base64' : 'url');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Resume - ${personalInfo.name || 'Resume'}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${googleFontImport}&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: ${fontStack} !important; }
  html, body { width: 100%; margin: 0; padding: 0; }
  body { font-family: ${fontStack} !important; font-size: 10.5pt; line-height: 1.45; color: #2d2d2d; background: #fff; }
  .resume { width: 100%; margin: 0; padding: 0 0.3in; overflow: visible; }
  .header-container { display: flex; align-items: center; justify-content: center; gap: 20px; margin-bottom: 10px; }
  .header-container.photo-left { flex-direction: row; }
  .header-container.photo-right { flex-direction: row-reverse; }
  .header-container.no-photo .header-text { text-align: center; width: 100%; }
  .header-text { flex: 1; text-align: center; }
  .profile-photo { width: 90px; height: 110px; border-radius: 4px; object-fit: cover; border: 2px solid #333; flex-shrink: 0; display: block; }
  h1 { font-family: ${fontStack} !important; font-size: 22pt; font-weight: 700; text-align: center; color: #1a1a1a; margin-bottom: 4px; letter-spacing: 0.5px; }
  h2, h3, h4, h5, h6, p, span, div, a, li, td, th { font-family: ${fontStack} !important; }
  .contact { text-align: center; font-size: 9pt; color: #555; margin-bottom: 14px; line-height: 1.6; }
  .contact a { color: #1565c0; text-decoration: none; }
  .section { margin-bottom: 10px; }
  .section-title { font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #1a1a1a; border-bottom: 2px solid #333; padding-bottom: 3px; margin-bottom: 8px; font-family: ${fontStack} !important; }
  .entry { margin-bottom: 8px; page-break-inside: avoid; }
  .entry-header { display: flex; justify-content: space-between; align-items: baseline; gap: 15px; width: 100%; }
  .entry-title { font-weight: 700; font-size: 10.5pt; color: #1a1a1a; font-family: ${fontStack} !important; min-width: 0; }
  .entry-date { font-size: 9.5pt; color: #666; font-style: italic; white-space: nowrap; flex-shrink: 0; text-align: right; padding-right: 5px; }
  .entry-sub { font-size: 9.5pt; color: #555; font-style: italic; margin-bottom: 3px; }
  .entry-desc { font-size: 10pt; color: #444; margin: 3px 0 3px 12px; }
  .tech-line { font-size: 9.5pt; color: #666; margin-left: 12px; }
  ul { margin-left: 20px; }
  li { font-size: 10pt; margin-bottom: 3px; color: #444; }
  .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill-tag { background: #f0f4f8; padding: 3px 10px; border-radius: 3px; font-size: 9.5pt; color: #333; border: 1px solid #d0d7de; font-family: ${fontStack} !important; }
  .summary-text { font-size: 10pt; color: #444; line-height: 1.5; font-family: ${fontStack} !important; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .resume { padding: 0; } }
</style>
</head>
<body>
<div class="resume">
  ${showProfilePhoto && profilePhotoUrl ? `
  <div class="header-container photo-${photoPosition.toLowerCase()}" id="header-container">
    <img src="${escapeHtml(profilePhotoUrl)}" alt="" class="profile-photo" onerror="document.getElementById('header-container').outerHTML='<h1>${escapeHtml((personalInfo.name || 'Your Name').replace(/'/g, "\\'"))}</h1><div class=\\'contact\\'>${contactItems.join(' &nbsp;|&nbsp; ').replace(/'/g, "\\'")}${codingProfileItems.length ? '<br/>' + codingProfileItems.join(' &nbsp;|&nbsp; ').replace(/'/g, "\\'") : ''}</div>';" />
    <div class="header-text">
      <h1>${escapeHtml(personalInfo.name || 'Your Name')}</h1>
      <div class="contact">${contactItems.join(' &nbsp;|&nbsp; ')}${codingProfileItems.length ? '<br/>' + codingProfileItems.join(' &nbsp;|&nbsp; ') : ''}</div>
    </div>
  </div>` : `
  <h1>${escapeHtml(personalInfo.name || 'Your Name')}</h1>
  <div class="contact">${contactItems.join(' &nbsp;|&nbsp; ')}${codingProfileItems.length ? '<br/>' + codingProfileItems.join(' &nbsp;|&nbsp; ') : ''}</div>`}

  ${summary ? `<div class="section"><div class="section-title">Professional Summary</div><p class="summary-text">${escapeHtml(summary)}</p></div>` : ''}

  ${(Array.isArray(skills) && skills.length && ((typeof skills[0] === 'object' && skills[0].category) ? skills.some(c => c.items?.length > 0) : true)) ? `<div class="section"><div class="section-title">Skills</div>${(typeof skills[0] === 'object' && skills[0].category) ? `<ul style="margin-left:16px;font-size:10pt;">${skills.filter(c => c.items?.length > 0).map(c => `<li><strong>${escapeHtml(c.category)}:</strong> ${c.items.map(i => escapeHtml(i)).join(', ')}</li>`).join('')}</ul>` : `<div class="skills-grid">${skills.map(s => `<span class="skill-tag">${escapeHtml(String(s))}</span>`).join('')}</div>`}</div>` : ''}

  ${experiences.length ? `<div class="section"><div class="section-title">Internship</div>
    ${experiences.map(e => {
      const formatDate = (d) => { if (!d) return ''; const parts = d.split('-'); return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : d; };
      const modeLabel = e.mode === 'remote' ? 'Remote' : e.mode === 'hybrid' ? 'Hybrid' : e.mode === 'in-person' ? 'On-Site' : '';
      const titleParts = [];
      if (e.companyName) titleParts.push(escapeHtml(e.companyName));
      if (e.location) titleParts.push(escapeHtml(e.location));
      const titleStr = titleParts.join(', ') + (modeLabel ? ' (' + modeLabel + ')' : '');
      return `<div class="entry">
      <div class="entry-header"><span class="entry-title">${titleStr}</span><span class="entry-date">${formatDate(e.fromDate)}${e.fromDate ? ' to ' : ''}${formatDate(e.toDate) || 'Present'}</span></div>
      ${e.description ? `<div class="entry-desc">${escapeHtml(typeof e.description === 'string' ? e.description.trim() : (e.description?.input || e.description?.text || e.description?.description || '').trim())}</div>` : ''}
      ${e.technologies?.length ? `<div class="tech-line"><strong>Technologies:</strong> ${e.technologies.map(t => escapeHtml(typeof t === 'string' ? t : (t?.name || String(t)))).join(', ')}</div>` : ''}
    </div>`;
    }).join('')}
  </div>` : ''}

  ${projects.length ? `<div class="section"><div class="section-title">Projects</div>
    ${projects.map(p => typeof p === 'string' ? `<div class="entry"><div class="entry-header"><span class="entry-title">${escapeHtml(p)}</span></div></div>` : `<div class="entry">
      <div class="entry-header"><span class="entry-title">${escapeHtml(p.name || '')}</span><span class="entry-date">${p.githubRepo ? `<a href="${escapeHtml(p.githubRepo)}" target="_blank" style="color:#1565c0;text-decoration:none;">GitHub</a>` : ''}${p.githubRepo && p.hostingLink ? ' | ' : ''}${p.hostingLink ? `<a href="${escapeHtml(p.hostingLink)}" target="_blank" style="color:#1565c0;text-decoration:none;">Live Demo</a>` : ''}</span></div>
      ${p.description ? `<div class="entry-desc">${escapeHtml(typeof p.description === 'string' ? p.description : (p.description?.input || p.description?.text || p.description?.description || ''))}</div>` : ''}
      ${p.technologies?.length ? `<div class="tech-line"><strong>Technologies:</strong> ${p.technologies.map(t => escapeHtml(typeof t === 'string' ? t : (t?.name || String(t)))).join(', ')}</div>` : ''}
    </div>`).join('')}
  </div>` : ''}

  ${certifications.length ? `<div class="section"><div class="section-title">Certifications</div>
    ${certifications.map(c => `<div class="entry" style="margin-bottom:4px;">
      <div class="entry-header"><span class="entry-title">${escapeHtml(c.certificateName || '')}</span></div>
      ${c.description ? `<div class="entry-desc">${escapeHtml(typeof c.description === 'string' ? c.description : (c.description?.input || c.description?.text || c.description?.description || ''))}</div>` : ''}
    </div>`).join('')}
  </div>` : ''}

  ${achievements.length ? `<div class="section"><div class="section-title">Achievements</div><ul>
    ${achievements.map(a => `<li>${escapeHtml(a.details || '')}</li>`).join('')}
  </ul></div>` : ''}

  ${additionalInfo.length ? `<div class="section"><div class="section-title">Additional Information</div><ul>
    ${additionalInfo.map(a => `<li>${escapeHtml(a.info || '')}</li>`).join('')}
  </ul></div>` : ''}

  ${(education.college || education.school12 || education.school10) ? `<div class="section"><div class="section-title">Education</div>
    ${education.college ? `<div class="entry"><div class="entry-header"><span class="entry-title">${escapeHtml(education.degree || 'B.E.')} in ${escapeHtml(education.branch || 'Engineering')} - ${escapeHtml(education.college)}</span><span class="entry-date">${escapeHtml(education.graduationYear || '')}</span></div><div class="entry-sub">CGPA: ${escapeHtml(education.cgpa || 'N/A')}</div></div>` : ''}
    ${education.school12 ? `<div class="entry"><div class="entry-header"><span class="entry-title">12th Standard - ${escapeHtml(education.school12)}</span><span class="entry-date">${escapeHtml(education.batch12 || '')}</span></div><div class="entry-sub">Percentile: ${escapeHtml(education.percentile12 || 'N/A')}</div></div>` : ''}
    ${education.school10 ? `<div class="entry"><div class="entry-header"><span class="entry-title">10th Standard - ${escapeHtml(education.school10)}</span><span class="entry-date">${escapeHtml(education.batch10 || '')}</span></div><div class="entry-sub">Percentile: ${escapeHtml(education.percentile10 || 'N/A')}</div></div>` : ''}
  </div>` : ''}
</div>
</body></html>`;
}

function buildResumeLatex(data) {
  const { personalInfo = {}, summary = '', education = {}, skills = [], experiences = [], projects = [], certifications = [], achievements = [], platforms = [], additionalInfo = [] } = data;

  const escLatex = (s) => (s || '').replace(/[&%$#_{}~^\\]/g, '\\$&');

  return `\\documentclass[a4paper,10pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.25in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{8pt}{4pt}
\\setlength{\\parindent}{0pt}
\\pagestyle{empty}

\\begin{document}

{\\centering {\\LARGE \\textbf{${escLatex(personalInfo.name || 'Your Name')}}} \\\\[4pt]
${[(() => { const m = personalInfo.mobile || ''; return m && !m.startsWith('+') ? `+91 ${m.replace(/^0+/, '')}` : m; })(), personalInfo.email, personalInfo.linkedin, personalInfo.github].filter(Boolean).map(c => escLatex(c)).join(' $|$ ')} \\\\[8pt]}

${summary ? `\\section*{Professional Summary}
${escLatex(summary)}` : ''}

${(education.college || education.school12 || education.school10) ? `\\section*{Education}
${education.college ? `\\textbf{${escLatex(education.degree || 'B.E.')} in ${escLatex(education.branch || 'Engineering')} -- ${escLatex(education.college)}} \\hfill ${escLatex(education.graduationYear || '')} \\\\ CGPA: ${escLatex(education.cgpa || 'N/A')}` : ''}
${education.school12 ? `\\\\[4pt] \\textbf{12th Standard -- ${escLatex(education.school12)}} \\hfill ${escLatex(education.batch12 || '')} \\\\ Percentile: ${escLatex(education.percentile12 || 'N/A')}` : ''}
${education.school10 ? `\\\\[4pt] \\textbf{10th Standard -- ${escLatex(education.school10)}} \\hfill ${escLatex(education.batch10 || '')} \\\\ Percentile: ${escLatex(education.percentile10 || 'N/A')}` : ''}` : ''}

${(Array.isArray(skills) && skills.length) ? `\\section*{Skills}
${(typeof skills[0] === 'object' && skills[0].category) ? `\\begin{itemize}[leftmargin=*,nosep]
${skills.filter(c => c.items?.length > 0).map(c => `\\item \\textbf{${escLatex(c.category)}:} ${c.items.map(i => escLatex(i)).join(', ')}`).join('\n')}
\\end{itemize}` : skills.map(s => escLatex(String(s))).join(' $\\cdot$ ')}` : ''}

${experiences.length ? `\\section*{Internship}
${experiences.map(e => `\\textbf{${escLatex(e.title || '')}} \\hfill ${escLatex(e.fromDate || '')} -- ${escLatex(e.toDate || 'Present')}
${e.companyName ? `\\\\ \\textit{${escLatex(e.companyName)}${e.location ? ', ' + escLatex(e.location) : ''}}` : ''}
${e.description ? `\\\\ ${escLatex(e.description)}` : ''}
${e.technologies?.length ? `\\\\ \\textit{Technologies: ${e.technologies.map(t => escLatex(t)).join(', ')}}` : ''}
\\\\[4pt]`).join('\n')}` : ''}

${projects.length ? `\\section*{Projects}
${projects.map(p => `\\textbf{${escLatex(p.name || '')}}
${p.description ? `\\\\ ${escLatex(p.description)}` : ''}
${p.technologies?.length ? `\\\\ \\textit{Technologies: ${p.technologies.map(t => escLatex(t)).join(', ')}}` : ''}
${p.githubRepo ? `\\\\ \\href{${p.githubRepo}}{GitHub}` : ''}
\\\\[4pt]`).join('\n')}` : ''}

${certifications.length ? `\\section*{Certifications}
\\begin{itemize}[leftmargin=*,nosep]
${certifications.map(c => `\\item ${escLatex(c.certificateName || '')}${c.issuedBy ? ' -- ' + escLatex(c.issuedBy) : ''}`).join('\n')}
\\end{itemize}` : ''}

${achievements.length ? `\\section*{Achievements}
\\begin{itemize}[leftmargin=*,nosep]
${achievements.map(a => `\\item ${escLatex(a.details || '')}`).join('\n')}
\\end{itemize}` : ''}

${additionalInfo.length ? `\\section*{Additional Information}
\\begin{itemize}[leftmargin=*,nosep]
${additionalInfo.map(a => `\\item ${escLatex(a.info || '')}`).join('\n')}
\\end{itemize}` : ''}

\\end{document}`;
}

function calculateResumeScore(data) {
  const { personalInfo = {}, summary = '', education = {}, skills = [], experiences = [], projects = [], certifications = [], achievements = [], platforms = [], additionalInfo = [] } = data;
  
  let totalScore = 0;
  let maxScore = 100;
  const breakdown = [];

  // Calculate total skill count (supports both flat array and categorized format)
  const totalSkillCount = Array.isArray(skills) && skills.length > 0 && typeof skills[0] === 'object' && skills[0].category
    ? skills.reduce((sum, c) => sum + (c.items?.length || 0), 0)
    : (Array.isArray(skills) ? skills.length : 0);

  // ATS Compatibility (30 points)
  let atsScore = 0;
  if (personalInfo.name) atsScore += 5;
  if (personalInfo.email) atsScore += 5;
  if (personalInfo.mobile) atsScore += 5;
  if (summary) atsScore += 5;
  if (totalSkillCount >= 3) atsScore += 5;
  if (education.school12 || education.school10) atsScore += 5;
  if (education.college) atsScore += 3;
  breakdown.push({ category: 'ATS Compatibility', score: atsScore, max: 33, weight: '33%' });
  totalScore += atsScore;

  // Content Quality (25 points)
  let contentScore = 0;
  if (experiences.length > 0) contentScore += 8;
  if (experiences.some(e => e.description && e.description.length > 50)) contentScore += 5;
  if (projects.length > 0) contentScore += 7;
  if (projects.some(p => p.description && p.description.length > 30)) contentScore += 5;
  breakdown.push({ category: 'Content Quality', score: contentScore, max: 25, weight: '25%' });
  totalScore += contentScore;

  // Completeness (20 points)
  let completenessScore = 0;
  if (personalInfo.linkedin) completenessScore += 3;
  if (personalInfo.github) completenessScore += 3;
  if (certifications.length > 0) completenessScore += 4;
  if (achievements.length > 0) completenessScore += 4;
  if (platforms.some(p => p.url)) completenessScore += 3;
  if (additionalInfo.length > 0) completenessScore += 3;
  breakdown.push({ category: 'Completeness', score: completenessScore, max: 20, weight: '20%' });
  totalScore += completenessScore;

  // Skills Match (15 points)
  let skillsScore = 0;
  if (totalSkillCount >= 1) skillsScore += 3;
  if (totalSkillCount >= 3) skillsScore += 4;
  if (totalSkillCount >= 5) skillsScore += 4;
  if (totalSkillCount >= 8) skillsScore += 4;
  breakdown.push({ category: 'Skills Match', score: skillsScore, max: 15, weight: '15%' });
  totalScore += skillsScore;

  // Design & Format (10 points)
  let formatScore = 0;
  if (personalInfo.name && personalInfo.email && personalInfo.mobile) formatScore += 4;
  if (summary && summary.length > 30 && summary.length < 500) formatScore += 3;
  if (experiences.length <= 5 && projects.length <= 5) formatScore += 3; // Not overstuffed
  breakdown.push({ category: 'Design & Format', score: formatScore, max: 10, weight: '10%' });
  totalScore += formatScore;

  // Suggestions
  const suggestions = [];
  if (!personalInfo.linkedin) suggestions.push('Add your LinkedIn profile URL');
  if (!personalInfo.github) suggestions.push('Add your GitHub/Portfolio URL');
  if (!summary) suggestions.push('Add a professional summary (2-3 sentences)');
  if (totalSkillCount < 5) suggestions.push('Add more core skills (aim for 5-10)');
  if (experiences.length === 0) suggestions.push('Add work experience or internships');
  if (projects.length === 0) suggestions.push('Add at least 2 projects with descriptions');
  if (certifications.length === 0) suggestions.push('Add relevant certifications');
  if (achievements.length === 0) suggestions.push('Add achievements to stand out');
  if (!experiences.some(e => e.description?.length > 50)) suggestions.push('Add detailed descriptions to your experiences');

  const percentage = Math.round((totalScore / maxScore) * 100);
  let grade;
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B+';
  else if (percentage >= 60) grade = 'B';
  else if (percentage >= 50) grade = 'C';
  else grade = 'D';

  return { totalScore, maxScore, percentage, grade, breakdown, suggestions };
}

// ===== GET /api/resume-builder/ats-data/:studentId =====
// Fetch resume data from resume collection for ATS analysis
router.get('/ats-data/:studentId', optionalAuth, async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`🔍 GET /api/resume-builder/ats-data/${studentId}`);

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    // 1. Try resume collection first (has both PDF and resumeData)
    const Resume = getResumeModel();
    const resume = await Resume.findOne({ studentId: String(studentId) });

    if (resume && resume.resumeData) {
      console.log(`✅ Resume data found in resume collection for: ${resume.name}`);
      return res.json({ 
        success: true, 
        source: 'resume',
        resumeData: resume.resumeData,
        studentName: resume.name,
        updatedAt: resume.updatedAt
      });
    }

    // 2. Fallback to resumebuilderdatas collection
    const ResumeBuilderData = mongoose.models.ResumeBuilderData || mongoose.model('ResumeBuilderData', new mongoose.Schema({
      studentId: { type: String, required: true, index: true, unique: true },
      resumeData: { type: mongoose.Schema.Types.Mixed, required: true },
      updatedAt: { type: Date, default: Date.now }
    }, { timestamps: true }), 'resumebuilderdatas');

    const builderData = await ResumeBuilderData.findOne({ studentId: String(studentId) });

    if (builderData && builderData.resumeData) {
      console.log(`✅ Resume data found in resumebuilderdatas collection`);
      return res.json({ 
        success: true, 
        source: 'resumebuilderdatas',
        resumeData: builderData.resumeData
      });
    }

    console.log(`❌ No resume data found for studentId: ${studentId}`);
    return res.status(404).json({ error: 'No resume data found' });
  } catch (error) {
    console.error('❌ ATS data fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch resume data for ATS analysis' });
  }
});

// ===== POST /api/resume-builder/ats-check =====
// Comprehensive Enhancv-style ATS Resume Analysis
router.post('/ats-check', optionalAuth, async (req, res) => {
  const startTime = Date.now();
  try {
    const { resumeData, studentId } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: 'Missing resumeData' });
    }

    const analysis = performATSAnalysis(resumeData);

    // Try AI-enhanced analysis with Ollama (local)
    try {
      const { analyzeATS } = require('../ollamaService');
      const resumeText = buildPlainText(resumeData);
      const aiAnalysis = await analyzeATS(resumeText);
      
      if (aiAnalysis) {
        // Merge AI insights into our analysis
        if (aiAnalysis.atsParseRate !== undefined) {
          analysis.categories.content.checks[0].score = Math.min(100, aiAnalysis.atsParseRate);
          analysis.categories.content.checks[0].status = aiAnalysis.atsParseRate >= 70 ? 'pass' : 'fail';
        }
        if (aiAnalysis.quantifyingImpact !== undefined) {
          analysis.categories.content.checks[1].score = Math.min(100, aiAnalysis.quantifyingImpact);
          analysis.categories.content.checks[1].status = aiAnalysis.quantifyingImpact >= 60 ? 'pass' : 'fail';
        }
        if (aiAnalysis.repetition !== undefined) {
          analysis.categories.content.checks[2].score = Math.min(100, aiAnalysis.repetition);
          analysis.categories.content.checks[2].status = aiAnalysis.repetition >= 70 ? 'pass' : 'fail';
        }
        if (aiAnalysis.spellingGrammar !== undefined) {
          analysis.categories.content.checks[3].score = Math.min(100, aiAnalysis.spellingGrammar);
          analysis.categories.content.checks[3].status = aiAnalysis.spellingGrammar >= 80 ? 'pass' : 'fail';
        }
        // Add AI issues
        if (aiAnalysis.contentIssues?.length) analysis.categories.content.issues = aiAnalysis.contentIssues;
        if (aiAnalysis.formatIssues?.length) analysis.categories.formatBrevity.issues = aiAnalysis.formatIssues;
        if (aiAnalysis.styleIssues?.length) analysis.categories.style.issues = aiAnalysis.styleIssues;
        if (aiAnalysis.sectionIssues?.length) analysis.categories.sections.issues = aiAnalysis.sectionIssues;
        if (aiAnalysis.skillsIssues?.length) analysis.categories.skills.issues = aiAnalysis.skillsIssues;
        if (aiAnalysis.strengths?.length) analysis.strengths = aiAnalysis.strengths;
        if (aiAnalysis.criticalFixes?.length) analysis.criticalFixes = aiAnalysis.criticalFixes;
        if (aiAnalysis.overallTips?.length) analysis.overallTips = aiAnalysis.overallTips;

        // Recalculate overall score with AI data
        recalculateOverallScore(analysis);
        analysis.aiEnhanced = true;
      } else {
        analysis.aiEnhanced = false;
      }
    } catch (aiErr) {
      console.warn('AI analysis failed, using rule-based:', aiErr.message);
      analysis.aiEnhanced = false;
    }

    res.json({ success: true, analysis });

    // Save analysis to resumeanalyses collection (async, don't block response)
    if (studentId && mongoose.connection.readyState === 1) {
      try {
        const ResumeAnalysis = mongoose.models.ResumeAnalysis || require('../models/ResumeAnalysis');
        const processingTime = Date.now() - startTime;

        // Get student info for name/regNo
        let studentName = resumeData.personalInfo?.name || '';
        let regNo = '';
        try {
          const Student = getStudentModel();
          let student = null;
          if (mongoose.Types.ObjectId.isValid(studentId)) {
            student = await Student.findById(studentId);
          }
          if (!student) {
            student = await Student.findOne({ _id: studentId });
          }
          if (student) {
            studentName = studentName || `${student.firstName || ''} ${student.lastName || ''}`.trim();
            regNo = student.regNo || '';
          }
        } catch (e) { /* ignore student lookup errors */ }

        // Build resume snapshot for quick reference
        const resumeSnapshot = {
          personalInfo: {
            name: resumeData.personalInfo?.name,
            email: resumeData.personalInfo?.email,
            mobile: resumeData.personalInfo?.mobile,
            hasLinkedin: !!resumeData.personalInfo?.linkedin,
            hasGithub: !!resumeData.personalInfo?.github
          },
          skills: resumeData.skills || [],
          experienceCount: resumeData.experiences?.length || 0,
          projectCount: resumeData.projects?.length || 0,
          certificationCount: resumeData.certifications?.length || 0,
          hasSummary: !!resumeData.summary,
          jobRole: resumeData.resumeSettings?.jobRole || ''
        };

        // Upsert: update existing or create new analysis for this student
        await ResumeAnalysis.findOneAndUpdate(
          { studentId: String(studentId) },
          {
            studentId: String(studentId),
            studentName,
            regNo,
            overallScore: analysis.overallScore,
            totalIssues: analysis.totalIssues,
            aiEnhanced: analysis.aiEnhanced || false,
            categories: analysis.categories,
            suggestions: analysis.suggestions || [],
            strengths: analysis.strengths || [],
            criticalFixes: analysis.criticalFixes || [],
            overallTips: analysis.overallTips || [],
            resumeSnapshot,
            fileName: 'Resume Builder',
            fileType: 'builder',
            extractedText: buildPlainText(resumeData),
            apiProvider: analysis.aiEnhanced ? 'ollama' : 'rule-based',
            processingTime,
            isResumeFile: false,
            updatedAt: new Date()
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(`✅ ATS analysis saved to resumeanalyses for student: ${studentName} (score: ${analysis.overallScore})`);
        
        // Also save ATS analysis to the resume collection for the Resume page display
        try {
          const Resume = getResumeModel();
          const resumeDoc = await Resume.findOneAndUpdate(
            { studentId: String(studentId) },
            { 
              atsAnalysis: {
                overallScore: analysis.overallScore,
                totalIssues: analysis.totalIssues,
                categories: analysis.categories,
                suggestions: analysis.suggestions || [],
                strengths: analysis.strengths || [],
                criticalFixes: analysis.criticalFixes || [],
                overallTips: analysis.overallTips || [],
                aiEnhanced: analysis.aiEnhanced || false,
                analyzedAt: new Date()
              },
              updatedAt: new Date()
            },
            { new: true }
          );
          if (resumeDoc) {
            console.log(`✅ ATS analysis also saved to resume collection for: ${resumeDoc.name}`);
          } else {
            console.log(`⚠️ Resume not found in resume collection for studentId: ${studentId} (ATS saved only in resumeanalyses)`);
          }
        } catch (resumeSaveErr) {
          console.error('❌ Failed to save ATS to resume collection:', resumeSaveErr.message);
        }
        
      } catch (dbErr) {
        console.error('❌ Failed to save ATS analysis to MongoDB:', dbErr.message);
      }
    }
  } catch (error) {
    console.error('ATS check error:', error);
    res.status(500).json({ error: 'Failed to perform ATS analysis' });
  }
});

// ===== GET /api/resume-builder/ats-result/:studentId =====
// Fetch previously saved ATS analysis result
router.get('/ats-result/:studentId', optionalAuth, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const ResumeAnalysis = mongoose.models.ResumeAnalysis || require('../models/ResumeAnalysis');
    const result = await ResumeAnalysis.findOne({ studentId: String(studentId) }).sort({ updatedAt: -1 });

    if (!result) {
      return res.status(404).json({ error: 'No ATS analysis found' });
    }

    console.log(`✅ ATS analysis loaded for student: ${result.studentName} (score: ${result.overallScore})`);
    
    const analysisData = {
      overallScore: result.overallScore,
      totalIssues: result.totalIssues,
      aiEnhanced: result.aiEnhanced,
      categories: result.categories,
      suggestions: result.suggestions,
      strengths: result.strengths,
      criticalFixes: result.criticalFixes,
      overallTips: result.overallTips
    };
    
    // Sync to resume collection if not already there
    try {
      const Resume = getResumeModel();
      const resumeDoc = await Resume.findOne({ studentId: String(studentId) });
      if (resumeDoc && (!resumeDoc.atsAnalysis || !resumeDoc.atsAnalysis.overallScore)) {
        await Resume.findOneAndUpdate(
          { studentId: String(studentId) },
          { 
            atsAnalysis: {
              ...analysisData,
              analyzedAt: result.updatedAt || new Date()
            },
            updatedAt: new Date()
          }
        );
        console.log(`✅ Synced ATS analysis to resume collection for: ${resumeDoc.name}`);
      }
    } catch (syncErr) {
      console.warn('⚠️ Could not sync ATS to resume collection:', syncErr.message);
    }
    
    res.json({
      success: true,
      analysis: analysisData,
      analyzedAt: result.updatedAt
    });
  } catch (error) {
    console.error('❌ Fetch ATS result error:', error);
    res.status(500).json({ error: 'Failed to fetch ATS analysis' });
  }
});

// ========================================
// ATS ANALYSIS HELPERS
// ========================================

function performATSAnalysis(data) {
  const { personalInfo = {}, summary = '', education = {}, skills = [], experiences = [], projects = [], certifications = [], achievements = [], platforms = [] } = data;

  // ---- CONTENT ANALYSIS ----
  const contentChecks = [];

  // ATS Parse Rate
  let atsParseScore = 100;
  const atsIssues = [];
  if (!personalInfo.name) { atsParseScore -= 15; atsIssues.push('Missing name'); }
  if (!personalInfo.email) { atsParseScore -= 15; atsIssues.push('Missing email'); }
  if (!personalInfo.mobile) { atsParseScore -= 10; atsIssues.push('Missing phone number'); }
  if (personalInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email)) { atsParseScore -= 10; atsIssues.push('Invalid email format'); }
  if (personalInfo.mobile && !/^[\d\s+()-]{7,15}$/.test(personalInfo.mobile)) { atsParseScore -= 5; atsIssues.push('Phone format may not parse correctly'); }
  contentChecks.push({ name: 'ATS Parse Rate', score: Math.max(0, atsParseScore), status: atsParseScore >= 70 ? 'pass' : 'fail', issues: atsIssues });

  // Quantifying Impact
  let quantifyScore = 0;
  const allDescriptions = [
    ...experiences.map(e => e.description || ''),
    ...projects.map(p => p.description || ''),
    summary
  ].filter(Boolean);
  const numberPattern = /\d+%|\d+\+|\d+x|\$\d+|\d+\s*(users|clients|projects|hours|days|team|people|percent|million|billion|thousand)/gi;
  const totalDescCount = allDescriptions.length || 1;
  const descsWithNumbers = allDescriptions.filter(d => numberPattern.test(d)).length;
  quantifyScore = Math.round((descsWithNumbers / totalDescCount) * 100);
  const quantifyIssues = [];
  if (quantifyScore < 50) quantifyIssues.push('Add metrics and numbers to your descriptions (e.g., "Increased performance by 40%")');
  if (descsWithNumbers === 0) quantifyIssues.push('No quantified achievements found - add numbers to stand out');
  contentChecks.push({ name: 'Quantifying Impact', score: quantifyScore, status: quantifyScore >= 60 ? 'pass' : 'fail', issues: quantifyIssues });

  // Repetition
  let repetitionScore = 100;
  const repetitionIssues = [];
  const allText = allDescriptions.join(' ').toLowerCase();
  const words = allText.split(/\s+/).filter(w => w.length > 4);
  const wordFreq = {};
  words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
  const repeatedWords = Object.entries(wordFreq).filter(([, count]) => count > 3).map(([word]) => word);
  if (repeatedWords.length > 3) { repetitionScore -= 30; repetitionIssues.push(`Overused words: ${repeatedWords.slice(0, 5).join(', ')}`); }
  else if (repeatedWords.length > 0) { repetitionScore -= 10; }

  // Check for repeated phrases
  const phrases = [];
  experiences.forEach(e => { if (e.description) phrases.push(e.description.toLowerCase().substring(0, 50)); });
  const uniquePhrases = new Set(phrases);
  if (phrases.length > uniquePhrases.size) { repetitionScore -= 20; repetitionIssues.push('Some experience descriptions start similarly - vary your language'); }
  contentChecks.push({ name: 'Repetition', score: Math.max(0, repetitionScore), status: repetitionScore >= 70 ? 'pass' : 'fail', issues: repetitionIssues });

  // Spelling & Grammar (basic checks)
  let spellingScore = 90;
  const spellingIssues = [];
  const commonMistakes = [/teh /gi, /recieved/gi, /occured/gi, /seperate/gi, /definately/gi, /occassion/gi, /accomodate/gi, /acheive/gi, /wierd/gi, /calender/gi, /goverment/gi, /enviroment/gi];
  const fullText = [summary, ...allDescriptions, personalInfo.name || ''].join(' ');
  commonMistakes.forEach(pattern => {
    if (pattern.test(fullText)) { spellingScore -= 10; spellingIssues.push(`Possible spelling error detected`); }
  });
  // Check for ALL CAPS abuse
  const capsWords = fullText.match(/\b[A-Z]{4,}\b/g) || [];
  if (capsWords.length > 5) { spellingScore -= 10; spellingIssues.push('Excessive use of ALL CAPS - use proper capitalization'); }
  contentChecks.push({ name: 'Spelling & Grammar', score: Math.max(0, spellingScore), status: spellingScore >= 80 ? 'pass' : 'fail', issues: spellingIssues });

  // Summarize Resume
  let summarizeScore = 0;
  const summarizeIssues = [];
  if (summary && summary.length >= 30) {
    summarizeScore = 100;
    if (summary.length > 500) { summarizeScore = 60; summarizeIssues.push('Summary is too long - keep it under 3-4 sentences'); }
    if (summary.length < 50) { summarizeScore = 50; summarizeIssues.push('Summary is too short - expand to highlight key strengths'); }
  } else {
    summarizeIssues.push('Add a professional summary to give recruiters a quick overview');
  }
  contentChecks.push({ name: 'Summarize Resume', score: summarizeScore, status: summarizeScore >= 60 ? 'pass' : 'locked', issues: summarizeIssues });

  const contentScore = Math.round(contentChecks.reduce((sum, c) => sum + c.score, 0) / contentChecks.length);

  // ---- FORMAT & BREVITY ----
  let formatScore = 0;
  const formatIssues = [];
  const formatChecks = { totalSections: 0, properlySized: 0 };

  // Check bullet point length
  const longDescriptions = allDescriptions.filter(d => d.length > 300);
  if (longDescriptions.length === 0) { formatScore += 25; formatChecks.properlySized++; }
  else { formatIssues.push(`${longDescriptions.length} description(s) are too long - keep bullets under 2 lines`); }

  // Resume isn't overstuffed
  if (experiences.length <= 6 && projects.length <= 6) { formatScore += 25; }
  else { formatIssues.push('Too many entries - focus on the most relevant 4-5 experiences and projects'); }

  // Has action verbs
  const actionVerbs = /^(developed|built|created|managed|led|designed|implemented|architected|optimized|improved|reduced|increased|launched|delivered|collaborated|coordinated|analyzed|resolved|automated|streamlined|mentored|established|spearheaded|orchestrated)/i;
  const descsWithActionVerbs = allDescriptions.filter(d => actionVerbs.test(d.trim())).length;
  if (descsWithActionVerbs >= Math.min(2, totalDescCount)) { formatScore += 25; }
  else { formatIssues.push('Start descriptions with strong action verbs (e.g., "Developed", "Led", "Implemented")'); }

  // Consistent date format
  const dates = [...experiences.map(e => e.fromDate), ...experiences.map(e => e.toDate)].filter(Boolean);
  if (dates.length > 0) { formatScore += 25; }
  else if (experiences.length > 0) { formatIssues.push('Add date ranges to your experiences'); }
  else { formatScore += 25; } // No experiences, no penalty

  // ---- STYLE ----
  let styleScore = 0;
  const styleIssues = [];

  // Professional tone
  const casualWords = /\b(awesome|cool|stuff|things|got|gonna|wanna|kinda|basically|really|very|super)\b/gi;
  const casualMatches = fullText.match(casualWords) || [];
  if (casualMatches.length === 0) { styleScore += 35; }
  else { styleScore += 10; styleIssues.push(`Avoid casual language: ${[...new Set(casualMatches.map(w => w.toLowerCase()))].slice(0, 3).join(', ')}`); }

  // First person usage
  const firstPerson = /\b(I |my |me |myself )/gi;
  const firstPersonMatches = (summary + ' ' + allDescriptions.join(' ')).match(firstPerson) || [];
  if (firstPersonMatches.length === 0) { styleScore += 35; }
  else { styleScore += 10; styleIssues.push('Avoid first-person pronouns (I, my, me) in resume descriptions'); }

  // Consistent tense
  const pastTense = allDescriptions.filter(d => /^(developed|built|created|managed|led|designed|implemented)/i.test(d.trim())).length;
  const presentTense = allDescriptions.filter(d => /^(develop|build|create|manage|lead|design|implement)/i.test(d.trim())).length;
  if (pastTense > 0 && presentTense > 0 && Math.abs(pastTense - presentTense) < pastTense) {
    styleScore += 10;
    styleIssues.push('Mix of past and present tense - use past tense for previous roles, present for current');
  } else {
    styleScore += 30;
  }

  // ---- SECTIONS ----
  let sectionsScore = 0;
  const sectionIssues = [];
  const requiredSections = [
    { name: 'Contact Information', present: !!(personalInfo.name && personalInfo.email), weight: 20 },
    { name: 'Education', present: !!(education.school12 || education.school10), weight: 20 },
    { name: 'Skills', present: skills.length > 0, weight: 20 },
    { name: 'Experience', present: experiences.length > 0, weight: 20 },
    { name: 'Projects', present: projects.length > 0, weight: 20 },
  ];
  requiredSections.forEach(section => {
    if (section.present) { sectionsScore += section.weight; }
    else { sectionIssues.push(`Missing "${section.name}" section`); }
  });

  // Bonus for optional sections
  const optionalSections = [
    { name: 'Summary', present: !!summary },
    { name: 'Certifications', present: certifications.length > 0 },
    { name: 'Achievements', present: achievements.length > 0 },
    { name: 'Coding Profiles', present: platforms.some(p => p.url) },
  ];
  const optionalPresent = optionalSections.filter(s => s.present).length;
  if (optionalPresent < 2) sectionIssues.push('Add more sections (Certifications, Achievements, Summary) to strengthen your resume');

  // ---- SKILLS ----
  let skillsScore = 0;
  const skillsIssues = [];
  if (skills.length === 0) { skillsIssues.push('Add technical and soft skills'); }
  else if (skills.length < 3) { skillsScore = 30; skillsIssues.push('Add more skills (aim for 6-10 relevant skills)'); }
  else if (skills.length < 6) { skillsScore = 60; skillsIssues.push('Good start! Consider adding a few more domain-specific skills'); }
  else if (skills.length <= 15) { skillsScore = 100; }
  else { skillsScore = 75; skillsIssues.push('Too many skills listed - focus on the most relevant 8-12'); }

  // Check skill relevance (tech skills)
  const techSkills = skills.filter(s => /javascript|python|java|react|node|sql|html|css|typescript|c\+\+|c#|ruby|go|rust|aws|azure|docker|kubernetes|git|mongodb|postgresql|mysql|redis|graphql|rest|api|agile|scrum|machine learning|data|algorithm/i.test(s));
  if (techSkills.length > 0 && skills.length > 0) {
    const techRatio = techSkills.length / skills.length;
    if (techRatio < 0.3) skillsIssues.push('Add more technical/hard skills - most resumes need a strong technical skills section');
  }

  // ---- CALCULATE OVERALL ----
  const categories = {
    content: {
      name: 'CONTENT',
      score: contentScore,
      weight: 30,
      checks: contentChecks,
      issues: [],
      color: '#2DBE7F'
    },
    formatBrevity: {
      name: 'FORMAT & BREVITY',
      score: formatScore,
      weight: 20,
      issues: formatIssues,
      color: '#4A90D9'
    },
    style: {
      name: 'STYLE',
      score: styleScore,
      weight: 15,
      issues: styleIssues,
      color: '#9B59B6'
    },
    sections: {
      name: 'SECTIONS',
      score: sectionsScore,
      weight: 20,
      issues: sectionIssues,
      color: '#E67E22'
    },
    skills: {
      name: 'SKILLS',
      score: skillsScore,
      weight: 15,
      issues: skillsIssues,
      color: '#E74C3C'
    }
  };

  // Weighted overall score
  const overallScore = Math.round(
    Object.values(categories).reduce((sum, cat) => sum + (cat.score * cat.weight / 100), 0)
  );

  // Count total issues
  const totalIssueCount = Object.values(categories).reduce((sum, cat) => {
    return sum + (cat.issues?.length || 0) + (cat.checks?.reduce((s, c) => s + (c.issues?.length || 0), 0) || 0);
  }, 0);

  // Generate suggestions
  const suggestions = [];
  if (!personalInfo.linkedin) suggestions.push('Add LinkedIn profile URL');
  if (!personalInfo.github) suggestions.push('Add GitHub/portfolio link');
  if (experiences.length === 0 && projects.length === 0) suggestions.push('Add experiences or projects to demonstrate practical skills');
  if (skills.length < 5) suggestions.push('List at least 5-8 relevant skills');
  if (!summary) suggestions.push('Write a 2-3 sentence professional summary');

  return {
    overallScore,
    totalIssues: totalIssueCount,
    categories,
    suggestions,
    strengths: [],
    criticalFixes: [],
    overallTips: [],
    aiEnhanced: false
  };
}

function recalculateOverallScore(analysis) {
  const cats = analysis.categories;
  // Recalculate content score from checks
  if (cats.content.checks?.length) {
    cats.content.score = Math.round(cats.content.checks.reduce((sum, c) => sum + c.score, 0) / cats.content.checks.length);
  }
  analysis.overallScore = Math.round(
    Object.values(cats).reduce((sum, cat) => sum + (cat.score * cat.weight / 100), 0)
  );
  analysis.totalIssues = Object.values(cats).reduce((sum, cat) => {
    return sum + (cat.issues?.length || 0) + (cat.checks?.reduce((s, c) => s + (c.issues?.length || 0), 0) || 0);
  }, 0);
}

function buildPlainText(data) {
  const { personalInfo = {}, summary = '', education = {}, skills = [], experiences = [], projects = [], certifications = [], achievements = [], platforms = [] } = data;
  const parts = [];
  parts.push(`Name: ${personalInfo.name || 'N/A'}`);
  parts.push(`Email: ${personalInfo.email || 'N/A'}`);
  parts.push(`Phone: ${personalInfo.mobile || 'N/A'}`);
  if (personalInfo.linkedin) parts.push(`LinkedIn: ${personalInfo.linkedin}`);
  if (personalInfo.github) parts.push(`GitHub: ${personalInfo.github}`);
  if (summary) parts.push(`\nSummary: ${summary}`);
  if (education.school12) parts.push(`\nEducation: 12th - ${education.school12}, Percentile: ${education.percentile12 || 'N/A'}`);
  if (education.school10) parts.push(`10th - ${education.school10}, Percentile: ${education.percentile10 || 'N/A'}`);
  if (skills.length) parts.push(`\nSkills: ${skills.join(', ')}`);
  experiences.forEach((e, i) => {
    parts.push(`\nExperience ${i + 1}: ${e.title || ''} at ${e.companyName || ''} (${e.fromDate || ''} - ${e.toDate || 'Present'})`);
    if (e.description) parts.push(`Description: ${e.description}`);
    if (e.technologies?.length) parts.push(`Technologies: ${e.technologies.join(', ')}`);
  });
  projects.forEach((p, i) => {
    parts.push(`\nProject ${i + 1}: ${p.name || ''}`);
    if (p.description) parts.push(`Description: ${p.description}`);
    if (p.technologies?.length) parts.push(`Technologies: ${p.technologies.join(', ')}`);
  });
  certifications.forEach(c => parts.push(`\nCertification: ${c.certificateName || ''} - ${c.issuedBy || ''}`));
  achievements.forEach(a => parts.push(`\nAchievement: ${a.details || ''}`));
  platforms.filter(p => p.url).forEach(p => parts.push(`\n${p.name}: ${p.url}`));
  return parts.join('\n');
}

function escapeHtml(text) {
  if (!text) return '';
  // Safely convert non-string types to avoid [object Object]
  let str;
  if (typeof text === 'string') {
    str = text;
  } else if (typeof text === 'number' || typeof text === 'boolean') {
    str = String(text);
  } else if (Array.isArray(text)) {
    str = text.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join(', ');
  } else if (typeof text === 'object') {
    // Extract a meaningful string from common object shapes
    str = text.input || text.description || text.name || text.title || text.text || text.value || '';
    if (typeof str !== 'string') str = JSON.stringify(text);
  } else {
    str = String(text);
  }
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===== POST /api/resume-builder/save-ats-analysis =====
// Save ATS analysis results to the resume collection
router.post('/save-ats-analysis', optionalAuth, async (req, res) => {
  try {
    const { studentId, atsAnalysis } = req.body;
    
    if (!studentId || !atsAnalysis) {
      console.log('❌ Missing required data:', { hasStudentId: !!studentId, hasAtsAnalysis: !!atsAnalysis });
      return res.status(400).json({ error: 'Missing studentId or atsAnalysis' });
    }

    console.log(`💾 ========================================`);
    console.log(`💾 SAVING ATS ANALYSIS`);
    console.log(`💾 StudentId: ${studentId}`);
    console.log(`💾 Overall Score: ${atsAnalysis.overallScore}`);
    console.log(`💾 Total Issues: ${atsAnalysis.totalIssues}`);
    console.log(`💾 Suggestions Count: ${atsAnalysis.suggestions?.length || 0}`);
    console.log(`💾 ========================================`);

    if (mongoose.connection.readyState !== 1) {
      console.log('❌ MongoDB not connected, readyState:', mongoose.connection.readyState);
      return res.status(503).json({ error: 'Database not connected' });
    }

    const Resume = getResumeModel();
    
    // First check if resume exists
    const existingResume = await Resume.findOne({ studentId: String(studentId) });
    if (!existingResume) {
      console.log(`❌ Resume not found for studentId: ${studentId}`);
      console.log(`❌ Please build your resume first in the Resume Builder`);
      return res.status(404).json({ error: 'Resume not found. Please build your resume first.' });
    }
    
    console.log(`✅ Found existing resume: ${existingResume.name}`);
    
    // Update the resume with ATS analysis
    const resume = await Resume.findOneAndUpdate(
      { studentId: String(studentId) },
      { 
        atsAnalysis: {
          overallScore: atsAnalysis.overallScore,
          totalIssues: atsAnalysis.totalIssues,
          categories: atsAnalysis.categories,
          suggestions: atsAnalysis.suggestions || [],
          strengths: atsAnalysis.strengths || [],
          criticalFixes: atsAnalysis.criticalFixes || [],
          overallTips: atsAnalysis.overallTips || [],
          aiEnhanced: atsAnalysis.aiEnhanced || false,
          analyzedAt: new Date()
        },
        updatedAt: new Date()
      },
      { new: true }
    );

    console.log(`✅ ========================================`);
    console.log(`✅ ATS ANALYSIS SAVED SUCCESSFULLY!`);
    console.log(`✅ Resume Name: ${resume.name}`);
    console.log(`✅ Collection: resume`);
    console.log(`✅ Document ID: ${resume._id}`);
    console.log(`✅ Score: ${atsAnalysis.overallScore}/100`);
    console.log(`✅ Issues: ${atsAnalysis.totalIssues}`);
    console.log(`✅ Check MongoDB Atlas -> Database -> Collections -> resume`);
    console.log(`✅ Look for document with studentId: ${studentId}`);
    console.log(`✅ ========================================`);

    res.json({ 
      success: true, 
      message: 'ATS analysis saved successfully',
      resume: {
        name: resume.name,
        atsAnalysis: resume.atsAnalysis
      }
    });
  } catch (error) {
    console.error('❌ Save ATS analysis error:', error);
    res.status(500).json({ error: 'Failed to save ATS analysis' });
  }
});

// ===== GET /api/resume-builder/ats-analysis/:studentId =====
// Fetch saved ATS analysis - checks resume collection first, then falls back to resumeanalyses
router.get('/ats-analysis/:studentId', optionalAuth, async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`🔍 GET /api/resume-builder/ats-analysis/${studentId}`);
    
    if (mongoose.connection.readyState !== 1) {
      console.log('❌ MongoDB not connected');
      return res.status(503).json({ error: 'Database not connected' });
    }

    const Resume = getResumeModel();
    const resume = await Resume.findOne({ studentId: String(studentId) });
    
    if (!resume) {
      console.log(`❌ Resume not found for studentId: ${studentId}`);
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Check if ATS analysis exists in resume collection
    if (resume.atsAnalysis && resume.atsAnalysis.overallScore) {
      console.log(`✅ ATS analysis found in resume collection: Score ${resume.atsAnalysis.overallScore}`);
      return res.json({ 
        success: true, 
        hasAnalysis: true,
        atsAnalysis: resume.atsAnalysis,
        analyzedAt: resume.atsAnalysis.analyzedAt
      });
    }

    // Fallback: check resumeanalyses collection and sync to resume
    console.log(`⚠️ No ATS in resume collection, checking resumeanalyses...`);
    try {
      const ResumeAnalysis = mongoose.models.ResumeAnalysis || require('../models/ResumeAnalysis');
      const analysisResult = await ResumeAnalysis.findOne({ studentId: String(studentId) }).sort({ updatedAt: -1 });
      
      if (analysisResult && analysisResult.overallScore) {
        console.log(`✅ Found ATS analysis in resumeanalyses: Score ${analysisResult.overallScore}`);
        
        const atsData = {
          overallScore: analysisResult.overallScore,
          totalIssues: analysisResult.totalIssues,
          categories: analysisResult.categories,
          suggestions: analysisResult.suggestions || [],
          strengths: analysisResult.strengths || [],
          criticalFixes: analysisResult.criticalFixes || [],
          overallTips: analysisResult.overallTips || [],
          aiEnhanced: analysisResult.aiEnhanced || false,
          analyzedAt: analysisResult.updatedAt || new Date()
        };
        
        // Sync to resume collection
        await Resume.findOneAndUpdate(
          { studentId: String(studentId) },
          { atsAnalysis: atsData, updatedAt: new Date() }
        );
        console.log(`✅ Synced ATS analysis from resumeanalyses to resume collection`);
        
        return res.json({ 
          success: true, 
          hasAnalysis: true,
          atsAnalysis: atsData,
          analyzedAt: atsData.analyzedAt
        });
      }
    } catch (fallbackErr) {
      console.warn('⚠️ Fallback to resumeanalyses failed:', fallbackErr.message);
    }

    console.log(`⚠️ No ATS analysis found in any collection for studentId: ${studentId}`);
    return res.json({ 
      success: true, 
      hasAnalysis: false,
      message: 'No ATS analysis available. Please check your resume on the ATS Checker page.'
    });
  } catch (error) {
    console.error('❌ Fetch ATS analysis error:', error);
    res.status(500).json({ error: 'Failed to fetch ATS analysis' });
  }
});

module.exports = router;
