const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    index: true
  },
  studentName: {
    type: String,
    default: ''
  },
  regNo: {
    type: String,
    default: ''
  },
  // ATS Analysis Results
  overallScore: {
    type: Number,
    default: 0
  },
  totalIssues: {
    type: Number,
    default: 0
  },
  aiEnhanced: {
    type: Boolean,
    default: false
  },
  categories: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  suggestions: [{
    type: String
  }],
  strengths: [{
    type: String
  }],
  criticalFixes: [{
    type: String
  }],
  overallTips: [{
    type: String
  }],
  // Resume data snapshot used for analysis
  resumeSnapshot: {
    personalInfo: { type: mongoose.Schema.Types.Mixed, default: {} },
    skills: [{ type: String }],
    experienceCount: { type: Number, default: 0 },
    projectCount: { type: Number, default: 0 },
    certificationCount: { type: Number, default: 0 },
    hasSummary: { type: Boolean, default: false },
    jobRole: { type: String, default: '' }
  },
  // Legacy fields for file-upload-based analysis (optional)
  fileName: {
    type: String,
    default: 'Resume Builder'
  },
  fileSize: {
    type: Number,
    default: 0
  },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'builder'],
    default: 'builder'
  },
  extractedText: {
    type: String,
    default: ''
  },
  analysisResult: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  apiProvider: {
    type: String,
    enum: ['huggingface', 'openai', 'gemini', 'fallback', 'rule-based'],
    default: 'rule-based'
  },
  processingTime: {
    type: Number,
    default: 0
  },
  isResumeFile: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
resumeAnalysisSchema.index({ studentId: 1, createdAt: -1 });
resumeAnalysisSchema.index({ 'overallScore': 1 });

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
