const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  // Basic Information
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
  
  // Contact Information
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  primaryEmail: {
    type: String,
    default: '',
    trim: true
  },
  domainEmail: {
    type: String,
    default: '',
    trim: true
  },
  mobileNo: {
    type: String,
    default: '',
    trim: true
  },
  
  // Academic Information
  batch: {
    type: String,
    default: ''
  },
  degree: {
    type: String,
    default: ''
  },
  branch: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    enum: ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'IT', '']
  },
  currentYear: {
    type: String,
    default: ''
  },
  currentSemester: {
    type: String,
    default: ''
  },
  section: {
    type: String,
    default: ''
  },
  
  // Personal Details
  gender: {
    type: String,
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  bloodGroup: {
    type: String,
    default: ''
  },
  community: {
    type: String,
    default: ''
  },
  mediumOfStudy: {
    type: String,
    default: ''
  },
  
  // Family Details
  fatherName: {
    type: String,
    default: ''
  },
  fatherOccupation: {
    type: String,
    default: ''
  },
  fatherMobile: {
    type: String,
    default: ''
  },
  motherName: {
    type: String,
    default: ''
  },
  motherOccupation: {
    type: String,
    default: ''
  },
  motherMobile: {
    type: String,
    default: ''
  },
  guardianName: {
    type: String,
    default: ''
  },
  guardianNumber: {
    type: String,
    default: ''
  },
  aadhaarNo: {
    type: String,
    default: ''
  },
  
  // Academic Background
  studyCategory: {
    type: String,
    default: '12th'
  },
  tenthInstitution: {
    type: String,
    default: ''
  },
  tenthBoard: {
    type: String,
    default: ''
  },
  tenthPercentage: {
    type: String,
    default: ''
  },
  tenthYear: {
    type: String,
    default: ''
  },
  twelfthInstitution: {
    type: String,
    default: ''
  },
  twelfthBoard: {
    type: String,
    default: ''
  },
  twelfthPercentage: {
    type: String,
    default: ''
  },
  twelfthYear: {
    type: String,
    default: ''
  },
  twelfthCutoff: {
    type: String,
    default: ''
  },
  diplomaInstitution: {
    type: String,
    default: ''
  },
  diplomaBranch: {
    type: String,
    default: ''
  },
  diplomaPercentage: {
    type: String,
    default: ''
  },
  diplomaYear: {
    type: String,
    default: ''
  },
  
  // Semester GPA
  semester1GPA: {
    type: String,
    default: ''
  },
  semester2GPA: {
    type: String,
    default: ''
  },
  semester3GPA: {
    type: String,
    default: ''
  },
  semester4GPA: {
    type: String,
    default: ''
  },
  semester5GPA: {
    type: String,
    default: ''
  },
  semester6GPA: {
    type: String,
    default: ''
  },
  semester7GPA: {
    type: String,
    default: ''
  },
  semester8GPA: {
    type: String,
    default: ''
  },
  overallCGPA: {
    type: String,
    default: ''
  },
  
  // Academic Status
  clearedBacklogs: {
    type: String,
    default: ''
  },
  currentBacklogs: {
    type: String,
    default: ''
  },
  arrearStatus: {
    type: String,
    default: ''
  },
  yearOfGap: {
    type: String,
    default: ''
  },
  gapReason: {
    type: String,
    default: ''
  },
  
  // Other Details
  residentialStatus: {
    type: String,
    default: ''
  },
  quota: {
    type: String,
    default: ''
  },
  languagesKnown: {
    type: String,
    default: ''
  },
  firstGraduate: {
    type: String,
    default: ''
  },
  passportNo: {
    type: String,
    default: ''
  },
  skillSet: {
    type: String,
    default: ''
  },
  valueAddedCourses: {
    type: String,
    default: ''
  },
  aboutSibling: {
    type: String,
    default: ''
  },
  rationCardNo: {
    type: String,
    default: ''
  },
  familyAnnualIncome: {
    type: String,
    default: ''
  },
  panNo: {
    type: String,
    default: ''
  },
  willingToSignBond: {
    type: String,
    default: ''
  },
  preferredModeOfDrive: {
    type: String,
    default: ''
  },
  githubLink: {
    type: String,
    default: ''
  },
  linkedinLink: {
    type: String,
    default: ''
  },
  companyTypes: {
    type: String,
    default: ''
  },
  preferredJobLocation: {
    type: String,
    default: ''
  },
  
  // Login Details
  loginRegNo: {
    type: String,
    default: ''
  },
  loginPassword: {
    type: String,
    default: ''
  },
  
  // Media Files
  profilePicURL: {
    type: String,
    default: ''
  },
  resumeURL: {
    type: String,
    default: ''
  },
  resumeData: {
    url: String,
    name: String,
    createdAt: Date
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
  timestamps: true,
  strict: false // Allow fields not in schema to be saved
});

// ========================================
// OPTIMIZED INDEXES FOR FAST QUERIES
// ========================================
// Single field indexes
studentSchema.index({ regNo: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ department: 1 });
studentSchema.index({ branch: 1 });
studentSchema.index({ batch: 1 });
studentSchema.index({ firstName: 1 });
studentSchema.index({ lastName: 1 });
studentSchema.index({ isBlocked: 1 });
studentSchema.index({ blocked: 1 });
studentSchema.index({ createdAt: -1 });

// Compound indexes for common filter combinations (most specific first)
studentSchema.index({ department: 1, batch: 1, regNo: 1 });
studentSchema.index({ branch: 1, batch: 1, regNo: 1 });
studentSchema.index({ department: 1, batch: 1 });
studentSchema.index({ batch: 1, department: 1 });
studentSchema.index({ firstName: 1, lastName: 1 });

// Text index for name search (optional but powerful for fuzzy search)
studentSchema.index({ firstName: 'text', lastName: 'text' });

module.exports = mongoose.model('Student', studentSchema);
