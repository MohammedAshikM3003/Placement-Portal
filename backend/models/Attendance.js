const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  // Unique Drive Identifier
  driveId: {
    type: String,
    required: true,
    index: true
  },
  // Company Drive Info
  companyName: {
    type: String,
    required: true
  },
  jobRole: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  
  // Overall Statistics
  totalStudents: {
    type: Number,
    required: true
  },
  totalPresent: {
    type: Number,
    required: true
  },
  totalAbsent: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  
  // Student Details
  students: [{
    studentId: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    regNo: {
      type: String,
      required: true
    },
    branch: {
      type: String,
      required: true
    },
    batch: {
      type: String,
      required: true
    },
    yearSec: {
      type: String,
      required: true
    },
    semester: {
      type: String,
      required: true
    },
    phoneNo: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['Present', 'Absent', '-']
    }
  }],
  
  // Metadata
  submittedAt: {
    type: Date,
    default: Date.now
  },
  submittedBy: {
    type: String,
    default: 'Admin'
  }
}, {
  timestamps: true
});

// Index for faster queries
attendanceSchema.index({ driveId: 1 });
attendanceSchema.index({ companyName: 1, jobRole: 1, startDate: 1 });
attendanceSchema.index({ 'students.studentId': 1 });
attendanceSchema.index({ 'students.regNo': 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
