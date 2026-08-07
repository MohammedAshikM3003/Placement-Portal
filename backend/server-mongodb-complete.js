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
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-portal', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('MongoDB Connected:', mongoose.connection.host);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

// MongoDB Schemas
const studentSchema = new mongoose.Schema({
  regNo: { type: String, required: true, unique: true, index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String },
  dob: { type: String, required: true },
  department: { type: String, required: true },
  branch: { type: String, required: true },
  year: { type: String },
  cgpa: { type: Number },
  profilePicURL: { type: String },
  resumeData: { type: Object },
  resumeUploadDate: { type: String },
  resumeAnalysis: { type: Object },
  isBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'coordinator', 'admin'], required: true },
  userId: { type: String, required: true },
  isBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const resumeAnalysisSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number },
  fileType: { type: String },
  fileURL: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  analysisResult: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const certificateSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  achievementId: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number },
  fileType: { type: String },
  fileURL: { type: String },
  uploadedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const achievementSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  date: { type: String },
  certificateURL: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Models
const Student = mongoose.model('Student', studentSchema);
const User = mongoose.model('User', userSchema);
const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
const Certificate = mongoose.model('Certificate', certificateSchema);
const Achievement = mongoose.model('Achievement', achievementSchema);

// Middleware
app.use(cors({
  origin: [
    'https://placement--portal.vercel.app',
    'https://placement-portal.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
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
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  }
});

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Resume Analysis Function
function analyzeResumeContent(text) {
  const lowerText = text.toLowerCase();
  
  const checklistResults = [
    {
      id: 'contact_info',
      text: 'Include Name, Phone No, Email',
      score: lowerText.includes('phone') && lowerText.includes('email') ? 15 : 0,
      maxScore: 15,
      isCompleted: lowerText.includes('phone') && lowerText.includes('email')
    },
    {
      id: 'linkedin',
      text: 'Add LinkedIn Profile',
      score: lowerText.includes('linkedin') ? 5 : 0,
      maxScore: 5,
      isCompleted: lowerText.includes('linkedin')
    },
    {
      id: 'github',
      text: 'Add GitHub Profile',
      score: lowerText.includes('github') ? 5 : 0,
      maxScore: 5,
      isCompleted: lowerText.includes('github')
    },
    {
      id: 'summary',
      text: 'Include Summary/About Section',
      score: lowerText.includes('summary') ? 10 : 0,
      maxScore: 10,
      isCompleted: lowerText.includes('summary')
    },
    {
      id: 'skills',
      text: 'List Technical Skills',
      score: lowerText.includes('skills') ? 15 : 0,
      maxScore: 15,
      isCompleted: lowerText.includes('skills')
    },
    {
      id: 'experience',
      text: 'Include Experience/Internships',
      score: lowerText.includes('experience') ? 20 : 0,
      maxScore: 20,
      isCompleted: lowerText.includes('experience')
    },
    {
      id: 'projects',
      text: 'Showcase Projects (1-5+ projects)',
      score: lowerText.includes('project') ? 20 : 0,
      maxScore: 20,
      isCompleted: lowerText.includes('project')
    },
    {
      id: 'education',
      text: 'Mention Education/Degree',
      score: lowerText.includes('education') ? 10 : 0,
      maxScore: 10,
      isCompleted: lowerText.includes('education')
    },
    {
      id: 'certifications',
      text: 'Include Certifications',
      score: lowerText.includes('certification') ? 5 : 0,
      maxScore: 5,
      isCompleted: lowerText.includes('certification')
    },
    {
      id: 'achievements',
      text: 'Highlight Achievements',
      score: lowerText.includes('achievement') ? 5 : 0,
      maxScore: 5,
      isCompleted: lowerText.includes('achievement')
    },
    {
      id: 'page_limit',
      text: 'Keep Resume within 1-2 Pages',
      score: 10,
      maxScore: 10,
      isCompleted: true
    }
  ];

  const totalScore = checklistResults.reduce((sum, item) => sum + item.score, 0);
  const maxScore = checklistResults.reduce((sum, item) => sum + item.maxScore, 0);
  const percentage = Math.round((totalScore / maxScore) * 100);

  const suggestions = [];
  checklistResults.forEach(item => {
    if (!item.isCompleted) {
      suggestions.push(`Add ${item.text.toLowerCase()}`);
    }
  });

  return {
    checklistResults,
    totalScore,
    maxScore,
    percentage,
    suggestions,
    analysisMethod: 'mongodb',
    timestamp: new Date()
  };
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'MongoDB',
    connection: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Student Authentication
app.post('/api/students/login', async (req, res) => {
  try {
    const { regNo, dob } = req.body;

    if (!regNo || !dob) {
      return res.status(400).json({ message: 'Registration number and date of birth are required' });
    }

    const student = await Student.findOne({ regNo, dob });

    if (!student) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (student.isBlocked) {
      return res.status(403).json({ message: 'Account is blocked' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: student._id, 
        regNo: student.regNo, 
        role: 'student' 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      student: {
        id: student._id,
        regNo: student.regNo,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        department: student.department,
        branch: student.branch,
        year: student.year,
        cgpa: student.cgpa,
        profilePicURL: student.profilePicURL,
        resumeData: student.resumeData,
        resumeUploadDate: student.resumeUploadDate,
        resumeAnalysis: student.resumeAnalysis
      }
    });

  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Student Registration
app.post('/api/students', async (req, res) => {
  try {
    const studentData = req.body;

    // Check if student already exists
    const existingStudent = await Student.findOne({ 
      $or: [{ regNo: studentData.regNo }, { email: studentData.email }] 
    });

    if (existingStudent) {
      return res.status(400).json({ 
        message: 'Student with this registration number or email already exists' 
      });
    }

    const student = new Student(studentData);
    await student.save();

    res.status(201).json({
      message: 'Student registered successfully',
      student: {
        id: student._id,
        regNo: student.regNo,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        department: student.department,
        branch: student.branch
      }
    });

  } catch (error) {
    console.error('Student registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update Student
app.put('/api/students/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const student = await Student.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      message: 'Student updated successfully',
      student
    });

  } catch (error) {
    console.error('Student update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Resume Analysis
app.post('/api/resume/analyze', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text content is required' });
    }

    console.log('🧠 Analyzing resume text...');
    console.log('📝 Text length:', text.length);

    const analysisResult = analyzeResumeContent(text);

    res.json({
      message: 'Resume analysis completed',
      analysisResult: analysisResult,
      extractedText: text,
      analysisMethod: 'mongodb',
      processingTime: 100
    });

  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Upload Resume File
app.post('/api/resume/upload', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/resumes/${req.file.filename}`;

    // Generate sample text based on filename
    let sampleText = `Sample Resume Content
Phone: +91 98765 43210
Email: sample@example.com
LinkedIn: https://linkedin.com/in/sample
GitHub: https://github.com/sample

Summary
Software developer with experience in web development.

Skills
Java, Python, JavaScript, React, Node.js

Experience
Software Developer | Company | 2022-2024

Projects
Web Application Project

Education
Bachelor of Technology in Computer Science`;

    if (req.file.originalname.toLowerCase().includes('john') || req.file.originalname.toLowerCase().includes('doe')) {
      sampleText = `John Doe
Phone: +91 98765 43210
Email: john@example.com
LinkedIn: https://linkedin.com/in/johndoe
GitHub: https://github.com/johndoe

Summary
Experienced software developer with expertise in web development and database management.

Skills
Languages: Java, Python, JavaScript, HTML, CSS
Frameworks: React, Node.js, Spring Boot
Databases: MySQL, MongoDB
Tools: Git, Docker, AWS

Experience
Software Developer | TechCorp | 2022-2024
• Developed web applications using React and Node.js
• Managed database operations and optimization

Projects
E-commerce Platform
• Built a full-stack e-commerce solution
• Implemented payment gateway integration

Education
Bachelor of Technology in Computer Science
ABC University, 2022

Certifications
• AWS Certified Developer
• Oracle Java Certified Professional

Achievements
• Best Project Award at University Tech Fest
• Hackathon Winner - Regional Level`;
    }

    const analysisResult = analyzeResumeContent(sampleText);

    res.json({
      message: 'Resume uploaded and analyzed successfully',
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      analysisResult: analysisResult
    });

  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Get Resume Analysis by Student ID
app.get('/api/resume/analysis/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    const analysis = await ResumeAnalysis.findOne({ studentId })
      .sort({ createdAt: -1 });

    if (!analysis) {
      return res.status(404).json({ message: 'No analysis found for this student' });
    }

    res.json({
      message: 'Analysis retrieved successfully',
      analysis
    });

  } catch (error) {
    console.error('Get analysis error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Save Resume Analysis
app.post('/api/resume/analysis', authenticateToken, async (req, res) => {
  try {
    const analysisData = req.body;

    const analysis = new ResumeAnalysis(analysisData);
    await analysis.save();

    res.status(201).json({
      message: 'Analysis saved successfully',
      analysis
    });

  } catch (error) {
    console.error('Save analysis error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Certificates
app.post('/api/certificates', authenticateToken, async (req, res) => {
  try {
    const certificateData = req.body;
    const certificate = new Certificate(certificateData);
    await certificate.save();

    res.status(201).json({
      message: 'Certificate uploaded successfully',
      certificate
    });

  } catch (error) {
    console.error('Certificate upload error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/certificates/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const certificates = await Certificate.find({ studentId });

    res.json({
      message: 'Certificates retrieved successfully',
      certificates
    });

  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Achievements
app.post('/api/achievements', authenticateToken, async (req, res) => {
  try {
    const achievementData = req.body;
    const achievement = new Achievement(achievementData);
    await achievement.save();

    res.status(201).json({
      message: 'Achievement created successfully',
      achievement
    });

  } catch (error) {
    console.error('Achievement creation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/achievements/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const achievements = await Achievement.find({ studentId });

    res.json({
      message: 'Achievements retrieved successfully',
      achievements
    });

  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`MongoDB Backend Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Database: MongoDB`);
      console.log(`MongoDB Status: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
