const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// In-memory storage (MongoDB Atlas has SSL issues with Node.js v22)
let students = [];
let users = [];
let resumeAnalyses = [];

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
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'In-Memory Storage (MongoDB Atlas SSL Issue)',
    connection: 'Fallback Mode',
    students: students.length,
    analyses: resumeAnalyses.length,
    note: 'MongoDB Atlas connection failed due to SSL issues with Node.js v22. Using in-memory storage for development.'
  });
});

// Student Routes
app.post('/api/students', async (req, res) => {
  try {
    const studentData = req.body;
    
    // Check if student already exists
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
      message: 'Student registered successfully (in-memory storage)',
      studentId: studentId,
      userId: user.id,
      note: 'Data stored in memory due to MongoDB Atlas SSL issues'
    });
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

    const student = students.find(s => s.regNo === regNo && s.dob === dob);
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found. Please check your registration number and date of birth.' });
    }

    if (student.isBlocked) {
      return res.status(403).json({ error: 'Account is blocked. Please contact administrator.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: student.id, 
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
        id: student.id,
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
    const student = students.find(s => s.id === req.params.id);
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
    const studentIndex = students.findIndex(s => s.id === req.params.id);
    
    if (studentIndex === -1) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    students[studentIndex] = {
      ...students[studentIndex],
      ...req.body,
      updatedAt: new Date()
    };
    
    res.json({ message: 'Student updated successfully', student: students[studentIndex] });
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
      id: Date.now().toString(),
      studentId: req.body.studentId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      fileURL: req.file.path,
      uploadedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    resumeAnalyses.push(analysisData);

    res.json({
      message: 'Resume uploaded successfully',
      analysisId: analysisData.id,
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
    const analyses = resumeAnalyses.filter(a => a.studentId === req.params.studentId)
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    
    res.json(analyses);
  } catch (error) {
    console.error('Error fetching resume analyses:', error);
    res.status(500).json({ error: 'Failed to fetch analyses', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Placement Portal Backend Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: In-Memory Storage (MongoDB Atlas SSL Issue)`);
  console.log(`Status: Ready for development`);
  console.log(`Note: MongoDB Atlas connection failed due to SSL issues with Node.js v22.17.0`);
  console.log(`Students in memory: ${students.length}`);
});
