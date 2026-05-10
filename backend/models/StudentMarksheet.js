const mongoose = require('mongoose');

const studentMarksheetSchema = new mongoose.Schema({
  // Student Reference
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  regNo: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Academic Term
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  examDate: {
    type: String,
    default: '' // e.g., "June - 2023"
  },
  
  // Programme Info
  programme: {
    type: String,
    default: '' // e.g., "B.E - Computer Science and Engineering"
  },
  
  // Subjects/Courses in this semester
  subjects: [{
    _id: false,
    courseCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    courseName: {
      type: String,
      required: true,
      trim: true
    },
    credits: {
      type: Number,
      default: 0
    },
    grade: {
      type: String,
      required: true,
      enum: ['O', 'A+', 'A', 'B+', 'B', 'C', 'U', 'AB', 'W', '']
    },
    result: {
      type: String,
      required: true,
      enum: ['P', 'F', 'AB', 'W', ''], // P=Pass, F=Fail, AB=Absent, W=Withdrawn
      default: 'P'
    },
    isArrear: {
      type: Boolean,
      default: false // true if result is 'F'
    },
    clearedInSemester: {
      type: Number,
      default: null // Semester number in which this arrear was cleared
    },
    clearedGrade: {
      type: String,
      default: null // Grade obtained when clearing the arrear
    }
  }],
  
  // GPA/Aggregate
  sgpa: {
    type: Number,
    default: null // Semester GPA
  },
  cgpa: {
    type: Number,
    default: null // Cumulative GPA (updated across semesters)
  },
  
  // Statistics
  totalCredits: {
    type: Number,
    default: 0
  },
  creditsEarned: {
    type: Number,
    default: 0
  },
  arrearCount: {
    type: Number,
    default: 0
  },
  
  // Upload/Import Tracking
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Coordinator who uploaded
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  importedFrom: {
    type: String,
    enum: ['PDF_UPLOAD', 'MANUAL_ENTRY', 'SYSTEM_IMPORT'],
    default: 'PDF_UPLOAD'
  },
  pdfFileName: {
    type: String,
    default: '' // Name of the PDF from which this was extracted
  },
  extractionConfidence: {
    type: Number,
    default: null
  },
  extractionWarnings: {
    type: [String],
    default: []
  },
  extractionMeta: {
    type: Object,
    default: {}
  },
  
  // Status
  verified: {
    type: Boolean,
    default: false // Whether admin has verified this marksheet
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
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

// Compound index for unique student marksheet per semester
studentMarksheetSchema.index({ studentId: 1, semester: 1 }, { unique: true });
studentMarksheetSchema.index({ regNo: 1, semester: 1 });
studentMarksheetSchema.index({ uploadedAt: -1 });

// Update the updatedAt timestamp before saving
studentMarksheetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Calculate arrear count and total subjects
  if (this.subjects && this.subjects.length > 0) {
    this.arrearCount = this.subjects.filter(s => s.result === 'F' && !s.clearedInSemester).length;
    this.totalCredits = this.subjects.reduce((sum, s) => sum + (s.credits || 0), 0);
    this.creditsEarned = this.subjects
      .filter(s => s.result === 'P' || (s.clearedInSemester && s.clearedGrade))
      .reduce((sum, s) => sum + (s.credits || 0), 0);
  }
  
  next();
});

module.exports = mongoose.models.StudentMarksheet || mongoose.model('StudentMarksheet', studentMarksheetSchema);
