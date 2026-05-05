const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  // Subject Identification
  courseCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  courseName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Subject Details
  credits: {
    type: Number,
    default: 0
  },
  semester: {
    type: Number,
    min: 1,
    max: 8,
    default: null
  },
  year: {
    type: Number,
    min: 1,
    max: 4,
    default: null
  },
  department: {
    type: String,
    enum: ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'IT', 'GENERAL', ''],
    default: ''
  },
  category: {
    type: String,
    enum: ['Core', 'Elective', 'Lab', 'Theory', 'Practical', ''],
    default: ''
  },
  
  // Additional Info
  minGPA: {
    type: Number,
    default: 0
  },
  maxGPA: {
    type: Number,
    default: 4
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
subjectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

subjectSchema.pre('validate', function(next) {
  if (this.semester && !this.year) {
    this.year = Math.ceil(Number(this.semester) / 2);
  }
  next();
});

// Index for quick lookup by course code
subjectSchema.index({ courseCode: 1 });

module.exports = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);
