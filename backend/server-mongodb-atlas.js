const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// MongoDB Connection
const connectDB = async () => {
  try {
    // Try with SSL bypass options for Node.js v22 compatibility
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      ssl: true,
      sslValidate: false,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true
    });
    console.log(`MongoDB Atlas Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('Falling back to in-memory storage for development...');
    return false;
  }
};

// Connect to MongoDB
let isMongoConnected = false;
connectDB().then(connected => {
  isMongoConnected = connected;
});

// In-memory storage fallback
let students = [];
let users = [];
let resumeAnalyses = [];

// MongoDB Models
const studentSchema = new mongoose.Schema({
  regNo: { type: String, required: true, unique: true },
  dob: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  degree: { type: String, required: true },
  branch: { type: String, required: true },
  currentYear: { type: String, required: true },
  currentSemester: { type: String, required: true },
  gender: { type: String },
  address: { type: String },
  city: { type: String },
  primaryEmail: { type: String, required: true },
  domainEmail: { type: String, required: true },
  mobileNo: { type: String, required: true },
  fatherName: { type: String, required: true },
  fatherOccupation: { type: String },
  fatherMobile: { type: String },
  motherName: { type: String, required: true },
  motherOccupation: { type: String },
  motherMobile: { type: String },
  community: { type: String, required: true },
  bloodGroup: { type: String },
  aadhaarNo: { type: String, required: true },
  mediumOfStudy: { type: String, required: true },
  guardianName: { type: String },
  guardianMobile: { type: String },
  // Academic data
  studyCategory: { type: String },
  tenthInstitution: { type: String, required: true },
  tenthBoard: { type: String, required: true },
  tenthPercentage: { type: String, required: true },
  tenthYear: { type: String, required: true },
  twelfthInstitution: { type: String },
  twelfthBoard: { type: String },
  twelfthPercentage: { type: String },
  twelfthYear: { type: String },
  twelfthCutoff: { type: String },
  diplomaInstitution: { type: String },
  diplomaBranch: { type: String },
  diplomaPercentage: { type: String },
  diplomaYear: { type: String },
  // Semester data
  semester1GPA: { type: String },
  semester2GPA: { type: String },
  semester3GPA: { type: String },
  semester4GPA: { type: String },
  semester5GPA: { type: String },
  semester6GPA: { type: String },
  semester7GPA: { type: String },
  semester8GPA: { type: String },
  overallCGPA: { type: String },
  clearedBacklogs: { type: String },
  currentBacklogs: { type: String },
  yearOfGap: { type: String },
  gapReason: { type: String },
  // Other details
  residentialStatus: { type: String, required: true },
  quota: { type: String, required: true },
  languagesKnown: { type: String },
  firstGraduate: { type: String, required: true },
  passportNo: { type: String },
  skillSet: { type: String, required: true },
  valueAddedCourses: { type: String },
  aboutSibling: { type: String },
  rationCardNo: { type: String, required: true },
  familyAnnualIncome: { type: String, required: true },
  panNo: { type: String, required: true },
  willingToSignBond: { type: String },
  preferredModeOfDrive: { type: String },
  githubLink: { type: String },
  linkedinLink: { type: String },
  companyTypes: { type: String },
  preferredJobLocation: { type: String },
  profilePicURL: { type: String },
  profileUploadDate: { type: String },
  // Login credentials
  loginRegNo: { type: String, required: true },
  loginPassword: { type: String, required: true },
  isBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'coordinator', 'admin'], default: 'student' },
  userId: { type: String, required: true },
  isBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const resumeAnalysisSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number },
  fileType: { type: String },
  fileURL: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  analysisResult: { type: Object },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);
const User = mongoose.model('User', userSchema);
const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload configuration
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    let studentCount, analysisCount;
    
    if (isMongoConnected) {
      studentCount = await Student.countDocuments();
      analysisCount = await ResumeAnalysis.countDocuments();
    } else {
      studentCount = students.length;
      analysisCount = resumeAnalyses.length;
    }
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: isMongoConnected ? 'MongoDB Atlas Connected' : 'In-Memory Storage (MongoDB SSL Issue)',
      connection: isMongoConnected ? 'Connected' : 'Fallback Mode',
      students: studentCount,
      analyses: analysisCount
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      timestamp: new Date().toISOString(),
      database: 'MongoDB Atlas',
      connection: 'Error',
      error: error.message
    });
  }
});

// Student Routes
app.post('/api/students', async (req, res) => {
  try {
    const studentData = req.body;
    
    if (isMongoConnected) {
      // Use MongoDB
      const existingStudent = await Student.findOne({ regNo: studentData.regNo });
      if (existingStudent) {
        return res.status(400).json({ 
          error: 'Student with this registration number already exists',
          studentId: existingStudent._id 
        });
      }

      const student = new Student(studentData);
      await student.save();

      const hashedPassword = await bcrypt.hash(studentData.loginPassword, 10);
      const user = new User({
        email: studentData.primaryEmail,
        password: hashedPassword,
        role: 'student',
        userId: student._id.toString()
      });
      await user.save();

      res.status(201).json({
        message: 'Student registered successfully',
        studentId: student._id,
        userId: user._id
      });
    } else {
      // Use in-memory storage
      const existingStudent = students.find(s => s.regNo === studentData.regNo);
      if (existingStudent) {
        return res.status(400).json({ 
          error: 'Student with this registration number already exists',
          studentId: existingStudent.id 
        });
      }

      const studentId = Date.now().toString();
      const student = {
        id: studentId,
        _id: studentId,
        ...studentData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      students.push(student);

      const hashedPassword = await bcrypt.hash(studentData.loginPassword, 10);
      const user = {
        id: Date.now().toString(),
        email: studentData.primaryEmail,
        password: hashedPassword,
        role: 'student',
        userId: studentId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      users.push(user);

      res.status(201).json({
        message: 'Student registered successfully (in-memory)',
        studentId: studentId,
        userId: user.id
      });
    }
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student', details: error.message });
  }
});

app.post('/api/students/login', async (req, res) => {
  try {
    const { regNo, dob } = req.body;

    if (!regNo || !dob) {
      return res.status(400).json({ error: 'Registration number and date of birth are required' });
    }

    let student;
    
    if (isMongoConnected) {
      // Use MongoDB
      student = await Student.findOne({ regNo: regNo, dob: dob });
    } else {
      // Use in-memory storage
      student = students.find(s => s.regNo === regNo && s.dob === dob);
    }
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found. Please check your registration number and date of birth.' });
    }

    if (student.isBlocked) {
      return res.status(403).json({ error: 'Account is blocked. Please contact administrator.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: student._id || student.id, 
        regNo: student.regNo, 
        role: 'student' 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token: token,
      student: {
        id: student._id || student.id,
        regNo: student.regNo,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.primaryEmail,
        branch: student.branch,
        currentYear: student.currentYear,
        currentSemester: student.currentSemester
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

app.get('/api/students/:id', authenticateToken, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ error: 'Failed to fetch student', details: error.message });
  }
});

app.put('/api/students/:id', authenticateToken, async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    res.json({ message: 'Student updated successfully', student });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student', details: error.message });
  }
});

// Resume Analysis Routes
app.post('/api/resume/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const analysisData = {
      studentId: req.body.studentId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      fileURL: req.file.path,
      uploadedAt: new Date()
    };

    const analysis = new ResumeAnalysis(analysisData);
    await analysis.save();

    res.json({
      message: 'Resume uploaded successfully',
      analysisId: analysis._id,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({ error: 'Failed to upload resume', details: error.message });
  }
});

app.get('/api/resume/analysis/:studentId', authenticateToken, async (req, res) => {
  try {
    const analyses = await ResumeAnalysis.find({ studentId: req.params.studentId })
      .sort({ uploadedAt: -1 });
    
    res.json(analyses);
  } catch (error) {
    console.error('Error fetching resume analyses:', error);
    res.status(500).json({ error: 'Failed to fetch analyses', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`MongoDB Atlas Backend Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: MongoDB Atlas`);
  console.log(`Status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
});
