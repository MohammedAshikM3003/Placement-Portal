// backend/routes/ocrV1.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { extractAllMarksheetsFromPDF } = require('../services/marksheetExtractionService');

// Auth middleware matching main route rules
const coordinatorAuth = (req, res, next) => {
  if (process.env.MARKSHEET_UPLOAD_BYPASS_AUTH === '1') {
    return next();
  }
  if (req.user?.role !== 'coordinator' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only coordinators can upload marksheets' });
  }
  next();
};

// Multer storage with 10MB limits (Phase 15 - Component 10)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Upload and Extract V1 Endpoint
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }

  const mime = req.file.mimetype;
  if (mime !== 'application/pdf' && !mime.startsWith('image/')) {
    return res.status(400).json({ success: false, error: 'Unsupported file type. Use PDF or image.' });
  }

  try {
    // Validate Page limits on PDF (Phase 15)
    if (mime === 'application/pdf') {
      const pdfInfo = await pdfParse(req.file.buffer);
      const pageCount = pdfInfo.numpages || 0;
      if (pageCount > 15) {
        return res.status(400).json({
          success: false,
          error: `PDF page count (${pageCount}) exceeds the maximum limit of 15 pages.`
        });
      }
    }

    const debugEnabled = req.body?.debug === 'true' || process.env.DEBUG_MODE === 'true';
    const marksheets = await extractAllMarksheetsFromPDF(req.file.buffer, {
      semester: req.body?.semester ? Number(req.body.semester) : null,
      debug: debugEnabled
    });

    const { analyzeAcademicProfile, classifyCourse } = require('../services/academicAnalytics');
    const { generateAdvisoryFeedback } = require('../services/academicAdvisor');
    const { matchStudentPlacementDrives } = require('../services/placementMatcher');

    const enrichedMarksheets = marksheets.map(m => {
      const analytics = analyzeAcademicProfile(m.subjects || [], m.semester || 1, []);
      const advice = generateAdvisoryFeedback(analytics);
      const placements = matchStudentPlacementDrives(analytics, m.programme || 'General');
      
      const subjectsWithClassification = (m.subjects || []).map(s => {
        return Object.assign({}, s, {
          category: classifyCourse(s.courseCode, s.courseName)
        });
      });

      return Object.assign({}, m, {
        subjects: subjectsWithClassification,
        analytics: analytics,
        advisoryFeedback: advice,
        placementEligibility: placements
      });
    });

    return res.status(200).json({
      success: true,
      filename: req.file.originalname,
      total_marksheets: enrichedMarksheets.length,
      marksheets: enrichedMarksheets
    });

  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// CSV Export Route (Phase 20 - Component 2)
router.get('/export', async (req, res) => {
  try {
    const StudentMarksheet = require('../models/StudentMarksheet');
    const marksheets = await StudentMarksheet.find().lean();
    
    let csv = 'Register Number,Student Name,Semester,Course Code,Course Name,Grade,Result,Category\n';
    for (const m of marksheets) {
      const reg = m.regNo || m.registerNumber || '';
      const name = m.studentName || m.name || '';
      const sem = m.semester || '';
      
      for (const s of m.subjects || []) {
        const code = s.courseCode || '';
        const courseName = (s.courseName || '').replace(/,/g, ' ');
        const grade = s.grade || '';
        const result = s.result || '';
        const category = s.category || 'Professional Core';
        csv += `${reg},${name},${sem},${code},${courseName},${grade},${result},${category}\n`;
      }
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=marksheets_export.csv');
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
