const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true,
    index: true
  },
  regNo: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  // Legacy Base64 fields (deprecated - use GridFS instead)
  pdfData: {
    type: String,
    required: false,
    default: ''
  },
  url: {
    type: String,
    required: false,
    default: ''
  },
  // GridFS fields (preferred)
  gridfsFileId: {
    type: String,
    index: true
  },
  gridfsFileUrl: {
    type: String
  },
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  fileType: {
    type: String,
    default: 'application/pdf'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  resumeData: {
    type: mongoose.Schema.Types.Mixed, // Store the form data
    default: null
  },
  atsAnalysis: {
    overallScore: {
      type: Number,
      default: null
    },
    totalIssues: {
      type: Number,
      default: 0
    },
    categories: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    suggestions: {
      type: [String],
      default: []
    },
    strengths: {
      type: [String],
      default: []
    },
    criticalFixes: {
      type: [String],
      default: []
    },
    overallTips: {
      type: [String],
      default: []
    },
    aiEnhanced: {
      type: Boolean,
      default: false
    },
    analyzedAt: {
      type: Date,
      default: null
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
resumeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for faster queries
resumeSchema.index({ studentId: 1, createdAt: -1 });
resumeSchema.index({ regNo: 1, createdAt: -1 });

module.exports = mongoose.model('Resume', resumeSchema, 'resume');
