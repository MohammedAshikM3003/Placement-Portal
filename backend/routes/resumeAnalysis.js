const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const Student = require('../models/Student');
const resumeAnalysisService = require('../services/resumeAnalysisService');
require('dotenv').config();

const router = express.Router();

// File upload configuration for resumes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/resumes';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  }
});

// Upload resume and analyze
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const studentId = req.user.userId;
    const fileUrl = `/uploads/resumes/${req.file.filename}`;

    console.log('🚀 Starting resume analysis...');
    console.log('📄 File:', req.file.originalname);
    console.log('📊 Size:', req.file.size);

    // Analyze resume
    const analysisResult = await resumeAnalysisService.analyzeResume(req.file);

    // Save analysis to database
    const resumeAnalysis = new ResumeAnalysis({
      studentId: studentId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: path.extname(req.file.originalname).substring(1),
      extractedText: analysisResult.extractedText,
      analysisResult: analysisResult.analysisResult,
      apiProvider: analysisResult.analysisMethod,
      processingTime: analysisResult.processingTime || 0,
      isResumeFile: analysisResult.isResumeFile
    });

    await resumeAnalysis.save();

    // Update student with resume URL
    await Student.findByIdAndUpdate(studentId, {
      resumeURL: fileUrl,
      'resumeAnalysis.fileName': req.file.originalname,
      'resumeAnalysis.fileSize': req.file.size,
      'resumeAnalysis.analysisResult': analysisResult.analysisResult,
      updatedAt: new Date()
    });

    res.json({
      message: 'Resume uploaded and analyzed successfully',
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      analysisResult: analysisResult.analysisResult
    });

  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Analyze resume text directly
router.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text content is required' });
    }

    console.log('🧠 Analyzing resume text...');
    console.log('📝 Text length:', text.length);

    // Create a mock file object for analysis
    const mockFile = {
      name: 'text-resume.txt',
      size: text.length,
      type: 'text/plain'
    };

    // Analyze the text
    const analysisResult = await resumeAnalysisService.analyzeResume(mockFile, text);

    res.json({
      message: 'Resume analysis completed',
      analysisResult: analysisResult.analysisResult,
      extractedText: analysisResult.extractedText,
      analysisMethod: analysisResult.analysisMethod,
      processingTime: analysisResult.processingTime
    });

  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get analysis results for a student
router.get('/analysis/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    const analysis = await ResumeAnalysis.findOne({ studentId })
      .sort({ createdAt: -1 });

    if (!analysis) {
      return res.status(404).json({ message: 'No analysis found for this student' });
    }

    res.json(analysis);

  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all resume analyses
router.get('/analyses', async (req, res) => {
  try {
    const analyses = await ResumeAnalysis.find()
      .populate('studentId', 'regNo firstName lastName department')
      .sort({ createdAt: -1 });

    res.json(analyses);

  } catch (error) {
    console.error('Get analyses error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get analysis statistics
router.get('/stats', async (req, res) => {
  try {
    const totalAnalyses = await ResumeAnalysis.countDocuments();
    const resumeFiles = await ResumeAnalysis.countDocuments({ isResumeFile: true });
    const nonResumeFiles = await ResumeAnalysis.countDocuments({ isResumeFile: false });

    const avgScore = await ResumeAnalysis.aggregate([
      { $match: { isResumeFile: true } },
      { $group: { _id: null, avgScore: { $avg: '$analysisResult.totalScore' } } }
    ]);

    const scoreDistribution = await ResumeAnalysis.aggregate([
      { $match: { isResumeFile: true } },
      {
        $bucket: {
          groupBy: '$analysisResult.percentage',
          boundaries: [0, 50, 70, 85, 100],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            avgScore: { $avg: '$analysisResult.totalScore' }
          }
        }
      }
    ]);

    res.json({
      totalAnalyses,
      resumeFiles,
      nonResumeFiles,
      averageScore: avgScore[0]?.avgScore || 0,
      scoreDistribution
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
