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
  pdfData: {
    type: String, // Base64 encoded PDF
    required: true
  },
  url: {
    type: String, // Data URL for easy access
    required: true
  },
  resumeData: {
    type: mongoose.Schema.Types.Mixed, // Store the form data
    default: null
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
