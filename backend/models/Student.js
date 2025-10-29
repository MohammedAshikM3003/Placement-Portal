const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  regNo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  dob: {
    type: String,
    required: true,
    match: /^\d{8}$/ // DDMMYYYY format
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  department: {
    type: String,
    required: true,
    enum: ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'IT']
  },
  profilePicURL: {
    type: String,
    default: ''
  },
  resumeURL: {
    type: String,
    default: ''
  },
  resumeAnalysis: {
    fileName: String,
    fileSize: Number,
    analysisResult: {
      checklistResults: [{
        id: String,
        text: String,
        score: Number,
        maxScore: Number,
        isCompleted: Boolean,
        details: String
      }],
      totalScore: Number,
      maxScore: Number,
      percentage: Number,
      suggestions: [String],
      extractedText: String,
      analysisMethod: String,
      timestamp: Date
    }
  },
  certificates: [{
    name: String,
    url: String,
    uploadedAt: Date
  }],
  semesterMarks: {
    type: Map,
    of: {
      subjects: [{
        name: String,
        marks: Number,
        maxMarks: Number,
        grade: String
      }],
      totalMarks: Number,
      maxTotalMarks: Number,
      percentage: Number,
      cgpa: Number
    }
  },
  achievements: [{
    title: String,
    description: String,
    date: Date,
    category: String,
    certificateURL: String
  }],
  attendance: {
    type: Map,
    of: {
      totalDays: Number,
      presentDays: Number,
      percentage: Number
    }
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
studentSchema.index({ regNo: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ department: 1 });

module.exports = mongoose.model('Student', studentSchema);
