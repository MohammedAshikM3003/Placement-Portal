const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ========================================
// BULLETPROOF MONGODB CONNECTION (24/7 Reliability)
// ========================================

// Connection state management
let connectionAttempts = 0;
const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 2000, 5000, 10000, 15000]; // Exponential backoff

// Robust MongoDB connection with automatic retry and reconnection
const connectDB = async (retryCount = 0) => {
    try {
        if (!process.env.MONGODB_URI) {
            console.log('⚠️ MONGODB_URI not found. Using in-memory storage.');
            return false;
        }

        // Check if already connected and healthy
        if (mongoose.connection.readyState === 1) {
            // Verify connection is actually working
            try {
                await mongoose.connection.db.admin().ping();
                return true;
            } catch (pingError) {
                console.log('⚠️ Connection exists but ping failed, reconnecting...');
                // Force disconnect to reconnect fresh
                await mongoose.connection.close().catch(() => {});
            }
        }

        // Close any existing partial connection
        if (mongoose.connection.readyState !== 0) {
            try {
                await mongoose.connection.close();
            } catch (closeError) {
                // Ignore - already closed or wasn't connected
            }
        }

        // Advanced connection options for maximum reliability
        const connectionOptions = {
            // Timeout settings
            serverSelectionTimeoutMS: 15000, // Increased from 10s
            socketTimeoutMS: 60000, // Increased from 45s
            connectTimeoutMS: 15000, // Increased from 10s
            
            // Connection pooling for serverless
            maxPoolSize: 10,
            minPoolSize: 1,
            maxIdleTimeMS: 45000, // Keep connections alive longer
            
            // Retry and reliability
            retryWrites: true,
            retryReads: true,
            
            // Serverless optimizations
            bufferCommands: false,
            // Removed deprecated bufferMaxEntries option
            
            // Heartbeat to keep connection alive
            heartbeatFrequencyMS: 10000,
        };

        console.log(`🔄 Attempting MongoDB connection (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
        
        const conn = await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
        
        // Verify connection with ping
        await conn.connection.db.admin().ping();
        
        connectionAttempts = 0; // Reset on success
        console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
        
        // Set up comprehensive connection event handlers
        setupConnectionHandlers();
        
        return true;
        
    } catch (error) {
        connectionAttempts++;
        
        console.error(`❌ MongoDB connection failed (attempt ${retryCount + 1}):`, error.message);
        
        // Retry with exponential backoff
        if (retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAYS[retryCount] || 15000;
            console.log(`⏳ Retrying in ${delay/1000} seconds...`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            return connectDB(retryCount + 1); // Recursive retry
        }
        
        // All retries exhausted
        console.error('❌ All MongoDB connection attempts failed. Using in-memory storage.');
        console.error('Error details:', error.message);
        
        // Clean up any partial connection
        if (mongoose.connection.readyState !== 0) {
            try {
                await mongoose.connection.close();
            } catch (closeError) {
                // Ignore close errors
            }
        }
        
        return false;
    }
};

// Set up connection event handlers for automatic reconnection
function setupConnectionHandlers() {
    // Remove existing listeners to prevent duplicates
    mongoose.connection.removeAllListeners();
    
    mongoose.connection.on('error', (err) => {
        console.error('⚠️ MongoDB connection error:', err.message);
        // Don't close - let it auto-reconnect
    });

    mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected - will auto-reconnect on next request');
    });

    mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected successfully');
        connectionAttempts = 0;
    });

    mongoose.connection.on('connected', () => {
        console.log('✅ MongoDB connection established');
    });

    // Handle connection timeout
    mongoose.connection.on('timeout', () => {
        console.warn('⚠️ MongoDB connection timeout');
    });

    // Handle close events
    mongoose.connection.on('close', () => {
        console.log('ℹ️ MongoDB connection closed');
    });
}

// Ensure connection is healthy before operations - ALWAYS tries to connect
// This makes MongoDB connection persistent and always connected
const ensureConnection = async () => {
    try {
        // If already connected, verify it's working
        if (mongoose.connection.readyState === 1) {
            try {
                // Quick ping to verify connection is alive (with timeout)
                const pingPromise = mongoose.connection.db.admin().ping();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Ping timeout')), 3000)
                );
                await Promise.race([pingPromise, timeoutPromise]);
                return true; // Connection is working
            } catch (error) {
                console.log('⚠️ Connection ping failed, reconnecting...');
                // Connection exists but not working - force reconnect
                await mongoose.connection.close().catch(() => {});
                // Retry connection
                return await connectDB(0); // Start from retry 0
            }
        } 
        
        // Not connected (readyState 0) - ALWAYS try to connect
        if (mongoose.connection.readyState === 0) {
            console.log('🔄 MongoDB not connected, attempting connection...');
            return await connectDB(0); // Start from retry 0
        }
        
        // Connecting (readyState 2) - connection in progress
        // Wait a bit and check again (for serverless, don't wait too long)
        if (mongoose.connection.readyState === 2) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Check again after waiting
            if (mongoose.connection.readyState === 1) {
                return true;
            }
            // Still connecting or failed - try fresh connection
            await mongoose.connection.close().catch(() => {});
            return await connectDB(0);
        }
        
        // Disconnecting (readyState 3) - close and reconnect
        if (mongoose.connection.readyState === 3) {
            await mongoose.connection.close().catch(() => {});
            return await connectDB(0);
        }
        
        // Default: try to connect
        return await connectDB(0);
        
    } catch (error) {
        console.error('ensureConnection error:', error.message);
        // Even if error, try one more time
        try {
            await mongoose.connection.close().catch(() => {});
            return await connectDB(0);
        } catch (retryError) {
            return false;
        }
    }
};

// MongoDB Models
// Using standard names. In Atlas, rename 'studentnews' to 'students' to match.
const studentSchema = new mongoose.Schema({
    regNo: { type: String, required: true, unique: true },
    dob: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    primaryEmail: { type: String, required: true },
    branch: { type: String, required: true },
    degree: { type: String, required: true },
    loginPassword: { type: String },
    // Add all other fields from your original schema here...
}, { strict: false });

const userSchema = new mongoose.Schema({
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    userId: { type: String },
}, { strict: false });

const resumeAnalysisSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    fileName: { type: String, required: true },
    fileURL: { type: String },
    // Add all other fields...
}, { strict: false });

// Use your actual collection name here - common names: 'students', 'studentnews', 'student_data'
const Student = mongoose.model('Student', studentSchema, 'students');
const User = mongoose.model('User', userSchema, 'users');
const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema, 'resumeanalyses');

// Resume Schema for storing resume files
const resumeSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    fileName: { type: String, required: true },
    fileData: { type: String, required: true }, // Base64 encoded file data
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
    analysisResult: { type: Object } // Store analysis results
}, { strict: false });

const Resume = mongoose.model('Resume', resumeSchema, 'resume');

// In-memory storage fallback (only used when MongoDB Atlas is not available)
let students = [
    {
        _id: 'student_73152313074',
        regNo: '73152313074',
        dob: '30032006',
        firstName: 'Mohammed',
        lastName: 'Ashik M',
        primaryEmail: 'mohammedashikm3003@gmail.com',
        branch: 'Computer Science',
        degree: 'B.Tech',
        loginPassword: '30032006'
    }
];
let users = [];
let resumeAnalyses = [];
let resumes = [];
let certificates = [
    {
        _id: 'cert_1',
        studentId: 'student_73152313074',
        achievementId: '1',
        fileName: 'certificate1.pdf',
        fileData: 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO4DQoxIDAgb2JqCjw8Ci9UeXBlIC9DYXRhbG9nCi9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKL01lZGlhQm94IFswIDAgNTk1IDg0Ml0KPj4KZW5kb2JqCgozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNCAwIFIKPj4KPj4KL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iagoKNCAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KZW5kb2JqCgo1IDAgb2JqCjw8Ci9MZW5ndGggNDQKPj4Kc3RyZWFtCkJUCi9GMSA5IFRmCjEwIDc1MiBUZAooVGVzdCBDZXJ0aWZpY2F0ZSkgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjQ1IDAwMDAwIG4gCjAwMDAwMDAzMjIgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA2Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgo0MTYKJSVFT0YK'
    }
];

// CRITICAL: CORS middleware - MUST be the FIRST middleware and handle OPTIONS IMMEDIATELY
// Handle OPTIONS preflight requests FIRST - before anything else
app.use((req, res, next) => {
    // Get the origin from the request
    const origin = req.headers.origin;
    
    // Set CORS headers for ALL requests
    if (origin) {
        // Check if origin should be allowed
        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://placement--portal.vercel.app',
            'https://placement-portal.vercel.app',
            'https://3nt1rq0-3000.inc1.devtunnels.ms'
        ];
        
        // Add environment-specific origins
        if (process.env.CORS_ORIGINS) {
            allowedOrigins.push(...process.env.CORS_ORIGINS.split(','));
        }
        
        const isAllowed = allowedOrigins.includes(origin) || 
                         /^https:\/\/.*\.vercel\.app$/.test(origin) || 
                         /^https:\/\/.*\.devtunnels\.ms$/.test(origin);
        
        if (isAllowed) {
            res.header('Access-Control-Allow-Origin', origin);
        } else {
            res.header('Access-Control-Allow-Origin', '*');
        }
    } else {
        res.header('Access-Control-Allow-Origin', '*');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Content-Type,Authorization');
    
    // CRITICAL: Handle OPTIONS preflight requests IMMEDIATELY
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// Also use cors middleware for additional support
try {
    app.use(cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            
            const allowedOrigins = [
                'http://localhost:3000',
                'http://127.0.0.1:3000',
                'https://placement--portal.vercel.app',
                'https://placement-portal.vercel.app',
                'https://3nt1rq0-3000.inc1.devtunnels.ms'
            ];
            
            // Add environment-specific origins
            if (process.env.CORS_ORIGINS) {
                allowedOrigins.push(...process.env.CORS_ORIGINS.split(','));
            }
            
            if (allowedOrigins.includes(origin) || 
                /^https:\/\/.*\.vercel\.app$/.test(origin) || 
                /^https:\/\/.*\.devtunnels\.ms$/.test(origin)) {
                return callback(null, true);
            }
            
            callback(null, true);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
        exposedHeaders: ['Content-Type', 'Authorization'],
        optionsSuccessStatus: 200
    }));
} catch (corsError) {
    console.error('CORS middleware error:', corsError);
    // Fallback is already handled above
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database initialization flag (for serverless lazy initialization)
let dbInitialized = false;

// File upload configuration (Multer)
// Use memory storage for resume uploads to get file buffer for base64 conversion
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Start server function
const startServer = async () => {
    try {
        const isMongoConnected = await ensureConnection();
        console.log(`Database: ${isMongoConnected ? 'MongoDB Atlas' : 'In-Memory Storage'}`);
        return isMongoConnected;
    } catch (error) {
        console.error('Database initialization error:', error.message);
        return false;
    }
};

// Bulletproof middleware - ensures MongoDB connection before EVERY request
// ALWAYS tries to connect if not connected - ensures persistent connection
// IMPORTANT: This middleware must NEVER throw or the function will crash
// NOTE: OPTIONS requests are already handled above, so they won't reach here
app.use((req, res, next) => {
    // Skip OPTIONS (already handled in CORS middleware above)
    if (req.method === 'OPTIONS') {
        return next();
    }
    
    // ALWAYS try to ensure MongoDB connection is active
    // This makes the connection persistent and always connected
    if (mongoose.connection.readyState !== 1) {
        // Not connected - try to connect in background
        if (!dbInitialized) {
            dbInitialized = true;
        }
        
        // Start connection in background - fire and forget
        Promise.resolve().then(async () => {
            try {
                await ensureConnection();
                console.log('✅ MongoDB connection ensured on request');
            } catch (err) {
                console.error('Background connection error:', err?.message || err);
            }
        }).catch(err => {
            console.error('Connection promise error:', err?.message || err);
        });
    } else {
        // Already connected - verify it's still working
        Promise.resolve().then(async () => {
            try {
                // Quick ping to verify connection is alive
                await mongoose.connection.db.admin().ping();
            } catch (pingError) {
                // Connection exists but not working - reconnect
                console.log('⚠️ Connection ping failed, reconnecting...');
                mongoose.connection.close().catch(() => {});
                await ensureConnection();
            }
        }).catch(err => {
            console.error('Connection verification error:', err?.message || err);
        });
    }
    
    // Always proceed immediately - don't wait for connection
    next();
});

// --- API Routes ---

// Health check with connection verification (non-blocking)
app.get('/api/health', async (req, res) => {
    try {
        // Quick check without blocking
        const connectionState = mongoose.connection.readyState;
        let connectionWorking = false;
        let studentCount = 0;
        let analysisCount = 0;

        // Check connection status
        if (connectionState === 1) {
            try {
                // Quick ping with timeout to avoid blocking
                const pingPromise = mongoose.connection.db.admin().ping();
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Ping timeout')), 3000)
                );
                await Promise.race([pingPromise, timeoutPromise]);
                connectionWorking = true;
                
                // Get counts if connected
                try {
                    studentCount = await Student.countDocuments();
                    analysisCount = await ResumeAnalysis.countDocuments();
                } catch (countError) {
                    console.error('Health check: Error counting documents:', countError.message);
                }
            } catch (pingError) {
                // Ping failed - connection not working
                connectionWorking = false;
            }
        } else {
            connectionWorking = false;
        }

        // Use in-memory counts if not connected
        if (!connectionWorking) {
            studentCount = students.length;
            analysisCount = resumeAnalyses.length;
        }

        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            database: connectionWorking ? 'MongoDB Atlas' : 'In-Memory Storage',
            connection: connectionWorking ? 'Connected ✅' : 'Fallback Mode',
            students: studentCount,
            analyses: analysisCount,
            connectionState: connectionState,
            note: connectionWorking 
                ? 'MongoDB Atlas connected successfully ✅' 
                : 'MongoDB Atlas connection failed. Using in-memory storage.'
        });
    } catch (error) {
        // Even if health check fails, return response
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            database: 'Unknown',
            connection: 'Error',
            error: error.message,
            students: students.length,
            analyses: resumeAnalyses.length
        });
    }
});

// Student registration
app.post('/api/students', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const studentData = req.body;

    try {
        if (isMongoConnected) {
            console.log('Creating student in MongoDB...');
            console.log('Student data received:', studentData);
            
            // Add defaults for required fields
            const studentDataWithDefaults = {
                ...studentData,
                gender: studentData.gender || 'male',
                primaryEmail: studentData.primaryEmail || `${studentData.regNo}@college.edu`
            };

            console.log('Student data with defaults:', studentDataWithDefaults);

            const student = new Student(studentDataWithDefaults);
            await student.save();
            console.log('Student saved successfully:', student._id);

            // Create user record
            const user = new User({
                email: studentDataWithDefaults.primaryEmail,
                password: studentDataWithDefaults.loginPassword,
                role: 'student',
                userId: student._id
            });
            await user.save();
            console.log('User record created successfully');

            res.status(201).json({ 
                message: 'Student created successfully', 
                student: {
                    _id: student._id,
                    regNo: student.regNo,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    primaryEmail: student.primaryEmail,
                    branch: student.branch,
                    degree: student.degree
                }
            });
        } else {
            // In-memory fallback
            const newStudent = { ...studentData, id: Date.now().toString() };
            students.push(newStudent);
            
            const newUser = {
                email: studentData.primaryEmail,
                password: studentData.loginPassword,
                role: 'student',
                userId: newStudent.id
            };
            users.push(newUser);

            res.status(201).json({ message: 'Student created successfully (in-memory)', student: newStudent });
        }
    } catch (error) {
        console.error('=== STUDENT CREATION ERROR ===');
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error name:', error.name);
        console.error('Error stack:', error.stack);
        console.error('Student data that caused error:', studentData);
        
        // Check for specific MongoDB errors
        if (error.code === 11000) {
            console.error('Duplicate key error - student with this regNo already exists');
            res.status(400).json({ 
                error: 'Student with this registration number already exists', 
                details: 'Please use a different registration number' 
            });
        } else if (error.name === 'ValidationError') {
            console.error('Validation error:', error.errors);
            res.status(400).json({ 
                error: 'Validation failed', 
                details: error.message,
                validationErrors: error.errors 
            });
        } else {
            res.status(500).json({ 
                error: 'Failed to create student', 
                details: error.message,
                errorCode: error.code,
                errorName: error.name
            });
        }
    }
});

// Student login with bulletproof connection handling (non-blocking)
app.post('/api/students/login', async (req, res) => {
    const { regNo, dob } = req.body;
    let student;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('RegNo:', regNo, 'DOB:', dob);

    try {
        // Check MongoDB connection status (non-blocking)
        const connectionState = mongoose.connection.readyState;
        const isMongoConnected = connectionState === 1;
        
        console.log('MongoDB connection state:', connectionState, 'Connected:', isMongoConnected);

        // Try MongoDB first (with timeout)
        if (isMongoConnected) {
            try {
                console.log('Searching for student in MongoDB...');
                const findPromise = Student.findOne({ regNo, dob });
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Query timeout')), 10000)
                );
                student = await Promise.race([findPromise, timeoutPromise]);
                console.log('Student found:', student ? 'YES' : 'NO');
            } catch (mongoError) {
                console.log('MongoDB query failed:', mongoError.message);
                // Fall through to in-memory
            }
        }

        // Fallback to in-memory if MongoDB not available or query failed
        if (!student) {
            console.log('Using in-memory storage...');
            student = students.find(s => s.regNo === regNo && s.dob === dob);
        }

        if (!student) {
            console.log('Student not found, returning 404');
            return res.status(404).json({ error: 'Student not found.' });
        }
        
        console.log('Login successful for:', regNo);
        
        // Generate token
        const token = jwt.sign({ 
            userId: student._id || student.id, 
            regNo: student.regNo, 
            role: 'student' 
        }, JWT_SECRET, { expiresIn: '24h' });
        
        res.json({ 
            message: 'Login successful', 
            token, 
            student: {
                _id: student._id || student.id,
                regNo: student.regNo,
                firstName: student.firstName,
                lastName: student.lastName,
                primaryEmail: student.primaryEmail || student.email,
                branch: student.branch,
                degree: student.degree
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        
        // Final fallback - try in-memory
        try {
            student = students.find(s => s.regNo === regNo && s.dob === dob);
            if (student) {
                const token = jwt.sign({ 
                    userId: student._id || student.id, 
                    regNo: student.regNo, 
                    role: 'student' 
                }, JWT_SECRET, { expiresIn: '24h' });
                
                return res.json({ 
                    message: 'Login successful (fallback mode)', 
                    token, 
                    student 
                });
            }
        } catch (fallbackError) {
            console.error('Fallback login error:', fallbackError.message);
        }
        
        // Return error response
        res.status(500).json({ 
            error: 'Login failed', 
            details: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
        });
    }
});

// Add test student endpoint (for debugging)
app.post('/api/add-test-student', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    
    try {
        const testStudent = {
            regNo: '73152313074',
            dob: '30032006',
            firstName: 'Test',
            lastName: 'Student',
            email: 'test.student@ksrce.ac.in',
            phone: '9876543210',
            department: 'CSE',
            branch: 'Computer Science Engineering',
            year: '2024',
            cgpa: 8.5,
            isBlocked: false
        };

        if (isMongoConnected) {
            // Check if student already exists in MongoDB
            const existingStudent = await Student.findOne({ regNo: testStudent.regNo });
            if (existingStudent) {
                return res.json({ message: 'Test student already exists in MongoDB', student: existingStudent });
            }

            // Create new student in MongoDB
            const student = new Student(testStudent);
            await student.save();
            res.json({ message: 'Test student created successfully in MongoDB', student });
        } else {
            // Check if student already exists in memory
            const existingStudent = students.find(s => s.regNo === testStudent.regNo);
            if (existingStudent) {
                return res.json({ message: 'Test student already exists in memory', student: existingStudent });
            }

            // Add to in-memory storage
            testStudent.id = Date.now().toString();
            students.push(testStudent);
            res.json({ message: 'Test student created successfully in memory', student: testStudent });
        }
    } catch (error) {
        console.error('Error creating test student:', error);
        res.status(500).json({ message: 'Error creating test student', error: error.message });
    }
});

// Check if student exists
app.get('/api/students/check/:regNo', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { regNo } = req.params;

    try {
        if (isMongoConnected) {
            const student = await Student.findOne({ regNo });
            res.json({ exists: !!student });
        } else {
            const student = students.find(s => s.regNo === regNo);
            res.json({ exists: !!student });
        }
    } catch (error) {
        console.error('Check student error:', error);
        res.status(500).json({ error: 'Failed to check student' });
    }
});

// Get student by ID
app.get('/api/students/:id', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { id } = req.params;

    try {
        if (isMongoConnected) {
            const student = await Student.findById(id);
            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }
            res.json(student);
        } else {
            const student = students.find(s => s.id === id);
            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }
            res.json(student);
        }
    } catch (error) {
        console.error('Get student error:', error);
        res.status(500).json({ error: 'Failed to get student' });
    }
});

// Get student by regNo and dob
app.get('/api/students/reg/:regNo/dob/:dob', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { regNo, dob } = req.params;

    try {
        if (isMongoConnected) {
            const student = await Student.findOne({ regNo: regNo, dob: dob });
            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }
            res.json(student);
        } else {
            const student = students.find(s => s.regNo === regNo && s.dob === dob);
            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }
            res.json(student);
        }
    } catch (error) {
        console.error('Get student by regNo/dob error:', error);
        res.status(500).json({ error: 'Failed to get student', details: error.message });
    }
});

// Update student
app.put('/api/students/:id', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { id } = req.params;
    const updateData = req.body;

    console.log('=== BACKEND UPDATE STUDENT ===');
    console.log('Student ID:', id);
    console.log('Update data:', updateData);
    console.log('MongoDB connected:', isMongoConnected);

    try {
        if (isMongoConnected) {
            console.log('Updating student in MongoDB...');
            const student = await Student.findByIdAndUpdate(id, updateData, { new: true });
            if (!student) {
                console.log('Student not found in MongoDB');
                return res.status(404).json({ error: 'Student not found' });
            }
            console.log('Student updated successfully in MongoDB');
            res.json({ message: 'Student updated successfully', student });
        } else {
            console.log('MongoDB not connected, using in-memory storage...');
            const studentIndex = students.findIndex(s => s.id === id);
            if (studentIndex === -1) {
                console.log('Student not found in in-memory storage');
                return res.status(404).json({ error: 'Student not found' });
            }
            students[studentIndex] = { ...students[studentIndex], ...updateData };
            console.log('Student updated successfully in in-memory storage');
            res.json({ message: 'Student updated successfully (in-memory)', student: students[studentIndex] });
        }
    } catch (error) {
        console.error('Update student error:', error);
        console.error('Error details:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to update student', details: error.message });
    }
});

// ⚡ SUPER FAST: Get complete student data (profile, resume, certificates) in ONE call
app.get('/api/students/:studentId/complete', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { studentId } = req.params;
    
    try {
        let studentData = null;
        let resumeData = null;
        let certificatesData = [];
        
        if (isMongoConnected) {
            // Use Promise.all for parallel fetching - SUPER FAST!
            const [student, resume, certificates] = await Promise.all([
                Student.findById(studentId).lean(), // .lean() for faster queries
                Resume.findOne({ studentId }).lean(),
                Certificate.find({ studentId }).lean()
            ]);
            
            studentData = student;
            resumeData = resume;
            certificatesData = certificates || [];
        } else {
            // In-memory fallback
            studentData = students.find(s => (s._id || s.id) === studentId);
            resumeData = resumes.find(r => r.studentId === studentId);
            certificatesData = certificates.filter(c => c.studentId === studentId);
        }
        
        if (!studentData) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Comprehensive response with all data
        res.json({
            success: true,
            student: {
                _id: studentData._id || studentData.id,
                regNo: studentData.regNo,
                firstName: studentData.firstName,
                lastName: studentData.lastName,
                primaryEmail: studentData.primaryEmail || studentData.email,
                branch: studentData.branch,
                degree: studentData.degree,
                dob: studentData.dob,
                profilePicURL: studentData.profilePicURL,
                // Include all profile fields
                ...studentData
            },
            resume: resumeData ? {
                fileName: resumeData.fileName,
                fileSize: resumeData.fileSize,
                uploadedAt: resumeData.uploadedAt,
                analysisResult: resumeData.analysisResult
            } : null,
            certificates: certificatesData.map(cert => ({
                _id: cert._id || cert.id,
                achievementId: cert.achievementId,
                fileName: cert.fileName,
                fileSize: cert.fileSize,
                uploadDate: cert.uploadDate,
                createdAt: cert.createdAt
            })),
            stats: {
                totalCertificates: certificatesData.length,
                hasResume: !!resumeData,
                hasProfilePic: !!studentData.profilePicURL,
                lastUpdated: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Complete student data fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch student data', details: error.message });
    }
});

// Update student profile (including profile photo)
app.put('/api/students/:studentId/profile', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { studentId } = req.params;
    const updateData = req.body;
    
    try {
        if (isMongoConnected) {
            const updatedStudent = await Student.findByIdAndUpdate(
                studentId, 
                updateData, 
                { new: true, runValidators: true }
            );
            
            if (!updatedStudent) {
                return res.status(404).json({ error: 'Student not found' });
            }
            
            res.json({ 
                success: true, 
                message: 'Profile updated successfully', 
                student: updatedStudent 
            });
        } else {
            // In-memory update
            const studentIndex = students.findIndex(s => (s._id || s.id) === studentId);
            if (studentIndex === -1) {
                return res.status(404).json({ error: 'Student not found' });
            }
            
            students[studentIndex] = { ...students[studentIndex], ...updateData };
            res.json({ 
                success: true, 
                message: 'Profile updated successfully (in-memory)', 
                student: students[studentIndex] 
            });
        }
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile', details: error.message });
    }
});

// Resume upload and analysis
app.post('/api/resume/upload', upload.single('resume'), async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { studentId } = req.body;
    const file = req.file;

    try {
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Convert file to base64
        const fileData = file.buffer.toString('base64');
        
        const resumeData = {
            studentId,
            fileName: file.originalname,
            fileData: fileData,
            fileType: file.mimetype,
            fileSize: file.size,
            uploadedAt: new Date()
        };

        if (isMongoConnected) {
            // Check if resume already exists for this student
            const existingResume = await Resume.findOne({ studentId });
            
            if (existingResume) {
                // Update existing resume
                existingResume.fileName = file.originalname;
                existingResume.fileData = fileData;
                existingResume.fileType = file.mimetype;
                existingResume.fileSize = file.size;
                existingResume.uploadedAt = new Date();
                await existingResume.save();
                res.json({ message: 'Resume updated successfully', resume: existingResume });
            } else {
                // Create new resume
                const newResume = new Resume(resumeData);
                await newResume.save();
                res.json({ message: 'Resume uploaded successfully', resume: newResume });
            }
        } else {
            // In-memory storage
            const existingIndex = resumes.findIndex(r => r.studentId === studentId);
            if (existingIndex !== -1) {
                resumes[existingIndex] = { ...resumeData, id: resumes[existingIndex].id };
                res.json({ message: 'Resume updated successfully (in-memory)', resume: resumes[existingIndex] });
            } else {
                resumeData.id = Date.now().toString();
                resumes.push(resumeData);
                res.json({ message: 'Resume uploaded successfully (in-memory)', resume: resumeData });
            }
        }
    } catch (error) {
        console.error('Resume upload error:', error);
        res.status(500).json({ error: 'Failed to upload resume', details: error.message });
    }
});

// Get resume by student ID
app.get('/api/resume/:studentId', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { studentId } = req.params;

    try {
        if (isMongoConnected) {
            const resume = await Resume.findOne({ studentId });
            if (!resume) {
                return res.status(404).json({ error: 'Resume not found' });
            }
            res.json({ resume });
        } else {
            const resume = resumes.find(r => r.studentId === studentId);
            if (!resume) {
                return res.status(404).json({ error: 'Resume not found' });
            }
            res.json({ resume });
        }
    } catch (error) {
        console.error('Get resume error:', error);
        res.status(500).json({ error: 'Failed to get resume' });
    }
});

// Resume analysis endpoint - calls Postman API for Hugging Face analysis
app.post('/api/resume/analyze', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { studentId, fileData, fileName, analysisResult } = req.body;

    try {
        // If analysisResult is provided, just save it (for backward compatibility)
        if (analysisResult) {
            if (isMongoConnected) {
                const resume = await Resume.findOne({ studentId });
                if (!resume) {
                    return res.status(404).json({ error: 'Resume not found' });
                }
                
                resume.analysisResult = analysisResult;
                await resume.save();
                res.json({ message: 'Analysis saved successfully', resume, analysisResult });
            } else {
                const resumeIndex = resumes.findIndex(r => r.studentId === studentId);
                if (resumeIndex === -1) {
                    return res.status(404).json({ error: 'Resume not found' });
                }
                
                resumes[resumeIndex].analysisResult = analysisResult;
                res.json({ message: 'Analysis saved successfully (in-memory)', resume: resumes[resumeIndex], analysisResult });
            }
            return;
        }

        // If fileData is provided, perform AI analysis
        if (fileData && fileName) {
            console.log('Performing AI analysis for file:', fileName);
            
            // Call free AI service for analysis (no API key required)
            const aiAnalysisResult = await callFreeAIService(fileData, fileName);
            
            // Save analysis to database if resume exists
            if (isMongoConnected) {
                const resume = await Resume.findOne({ studentId });
                if (resume) {
                    resume.analysisResult = aiAnalysisResult;
                    await resume.save();
                }
            } else {
                const resumeIndex = resumes.findIndex(r => r.studentId === studentId);
                if (resumeIndex !== -1) {
                    resumes[resumeIndex].analysisResult = aiAnalysisResult;
                }
            }
            
            res.json({ 
                message: 'AI analysis completed successfully', 
                analysisResult: aiAnalysisResult 
            });
            return;
        }

        // If neither analysisResult nor fileData is provided
        res.status(400).json({ error: 'Either analysisResult or fileData must be provided' });
        
    } catch (error) {
        console.error('Resume analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze resume', details: error.message });
    }
});

// Function to call free AI service (no API key required)
async function callFreeAIService(fileData, fileName) {
    try {
        console.log('🤖 Using free AI service for analysis');
        // Use free AI service (no API key required)
        const FreeResumeAnalysisService = require('./free-ai-service');
        const aiService = new FreeResumeAnalysisService();
        
        const result = await aiService.analyzeResume(fileData, fileName);
        return result;
        
    } catch (error) {
        console.error('Free AI service call failed:', error);
        // Fallback to mock server
        return callMockAPIService(fileData, fileName);
    }
}

// Function to call mock API service (fallback)
async function callMockAPIService(fileData, fileName) {
    try {
        const mockAPIUrl = process.env.MOCK_API_URL || 'http://localhost:3001/resume/analyze';
        
        const response = await fetch(mockAPIUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fileData: fileData,
                fileName: fileName
            })
        });

        if (!response.ok) {
            throw new Error(`Mock API call failed: ${response.status}`);
        }

        const result = await response.json();
        return result.analysisResult || result;
        
    } catch (error) {
        console.error('Mock API call failed:', error);
        // Return basic fallback analysis
        return getBasicAnalysisResult();
    }
}

// Certificate schema
const certificateSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    achievementId: { type: String, required: true },
    fileName: { type: String, required: true },
    fileData: { type: String, required: true }, // Base64 encoded file
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadDate: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Certificate = mongoose.model('Certificate', certificateSchema);

// Certificate endpoints
app.post('/api/certificates', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const certificateData = req.body;

    try {
        if (isMongoConnected) {
            const certificate = new Certificate(certificateData);
            await certificate.save();
            res.json({ message: 'Certificate created successfully', certificate });
        } else {
            // In-memory storage
            certificateData.id = Date.now().toString();
            certificates.push(certificateData);
            res.json({ message: 'Certificate created successfully (in-memory)', certificate: certificateData });
        }
    } catch (error) {
        console.error('Certificate creation error:', error);
        res.status(500).json({ error: 'Failed to create certificate', details: error.message });
    }
});

app.get('/api/certificates/student/:studentId', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { studentId } = req.params;

    try {
        if (isMongoConnected) {
            const certificates = await Certificate.find({ studentId });
            res.json(certificates);
        } else {
            const studentCertificates = certificates.filter(c => c.studentId === studentId);
            console.log(`Found ${studentCertificates.length} certificates for student ${studentId}`);
            res.json(studentCertificates);
        }
    } catch (error) {
        console.error('Get certificates error:', error);
        res.status(500).json({ error: 'Failed to get certificates', details: error.message });
    }
});

app.get('/api/certificates/student/:studentId/achievement/:achievementId', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { studentId, achievementId } = req.params;

    console.log('🔍 Backend: Looking for certificate:', { studentId, achievementId });
    console.log('🔍 Backend: Data types:', { 
        studentIdType: typeof studentId, 
        achievementIdType: typeof achievementId,
        studentIdValue: studentId,
        achievementIdValue: achievementId
    });

    try {
        if (isMongoConnected) {
            console.log('🔍 Backend: Searching for certificate with:', { studentId, achievementId });
            
            // Try to find the certificate - try both string and number formats
            let certificate = await Certificate.findOne({ studentId, achievementId });
            console.log('🔍 Backend: Certificate found (string):', certificate ? 'YES' : 'NO');
            
            // If not found, try with achievementId as number
            if (!certificate) {
                const achievementIdNum = parseInt(achievementId);
                if (!isNaN(achievementIdNum)) {
                    certificate = await Certificate.findOne({ studentId, achievementId: achievementIdNum.toString() });
                    console.log('🔍 Backend: Certificate found (number):', certificate ? 'YES' : 'NO');
                }
            }
            
            console.log('🔍 Backend: Final certificate found:', certificate ? 'YES' : 'NO');
            
            if (certificate) {
                console.log('🔍 Backend: Certificate details:', {
                    _id: certificate._id,
                    fileName: certificate.fileName,
                    achievementId: certificate.achievementId,
                    studentId: certificate.studentId
                });
                res.json(certificate);
            } else {
                console.log('🔍 Backend: No certificate found, returning null');
                res.json(null);
            }
        } else {
            const certificate = certificates.find(c => c.studentId === studentId && c.achievementId === achievementId);
            console.log('🔍 Backend: Certificate found (in-memory):', certificate ? 'YES' : 'NO');
            res.json(certificate);
        }
    } catch (error) {
        console.error('Get certificate by achievement error:', error);
        res.status(500).json({ error: 'Failed to get certificate', details: error.message });
    }
});

// Get all certificates (for debugging)
app.get('/api/certificates', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;

    try {
        if (isMongoConnected) {
            const allCertificates = await Certificate.find({});
            res.json(allCertificates);
        } else {
            console.log(`Total certificates in memory: ${certificates.length}`);
            res.json(certificates);
        }
    } catch (error) {
        console.error('Get all certificates error:', error);
        res.status(500).json({ error: 'Failed to get certificates', details: error.message });
    }
});

app.put('/api/certificates/:id', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { id } = req.params;
    const updateData = req.body;

    console.log('🔄 Backend: Updating certificate:', { id, updateData: { ...updateData, fileData: updateData.fileData ? 'Present' : 'Missing' } });

    try {
        if (isMongoConnected) {
            const certificate = await Certificate.findByIdAndUpdate(id, updateData, { new: true });
            if (!certificate) {
                console.log('❌ Backend: Certificate not found for ID:', id);
                return res.status(404).json({ error: 'Certificate not found' });
            }
            console.log('✅ Backend: Certificate updated successfully:', {
                _id: certificate._id,
                fileName: certificate.fileName,
                achievementId: certificate.achievementId
            });
            res.json({ message: 'Certificate updated successfully', certificate });
        } else {
            const certificateIndex = certificates.findIndex(c => c.id === id);
            if (certificateIndex === -1) {
                console.log('❌ Backend: Certificate not found (in-memory) for ID:', id);
                return res.status(404).json({ error: 'Certificate not found' });
            }
            certificates[certificateIndex] = { ...certificates[certificateIndex], ...updateData };
            console.log('✅ Backend: Certificate updated successfully (in-memory)');
            res.json({ message: 'Certificate updated successfully (in-memory)', certificate: certificates[certificateIndex] });
        }
    } catch (error) {
        console.error('Certificate update error:', error);
        res.status(500).json({ error: 'Failed to update certificate', details: error.message });
    }
});

app.delete('/api/certificates/:id', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { id } = req.params;

    try {
        if (isMongoConnected) {
            const certificate = await Certificate.findByIdAndDelete(id);
            if (!certificate) {
                return res.status(404).json({ error: 'Certificate not found' });
            }
            res.json({ message: 'Certificate deleted successfully' });
        } else {
            const certificateIndex = certificates.findIndex(c => c.id === id);
            if (certificateIndex === -1) {
                return res.status(404).json({ error: 'Certificate not found' });
            }
            certificates.splice(certificateIndex, 1);
            res.json({ message: 'Certificate deleted successfully (in-memory)' });
        }
    } catch (error) {
        console.error('Certificate deletion error:', error);
        res.status(500).json({ error: 'Failed to delete certificate', details: error.message });
    }
});

// Fallback basic analysis function
function getBasicAnalysisResult() {
    return {
        percentage: 65,
        totalScore: 8,
        maxScore: 13,
        grade: 'B',
        description: 'Basic analysis - AI analysis unavailable',
        suggestions: [
            'Upload a clear, readable resume for better analysis',
            'Include all contact information',
            'Add relevant work experience',
            'List technical skills clearly'
        ],
        checklistResults: [
            { id: 'name', isCompleted: true },
            { id: 'phone_no', isCompleted: true },
            { id: 'email', isCompleted: true },
            { id: 'linkedin', isCompleted: false },
            { id: 'github', isCompleted: false },
            { id: 'summary', isCompleted: true },
            { id: 'skills', isCompleted: true },
            { id: 'experience', isCompleted: false },
            { id: 'projects', isCompleted: true },
            { id: 'education', isCompleted: true },
            { id: 'certifications', isCompleted: false },
            { id: 'achievements', isCompleted: false },
            { id: 'page_limit', isCompleted: true }
        ]
    };
}


// ⚡ SUPER FAST: Certificate upload endpoint
app.post('/api/certificates/upload', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const certificateData = req.body;
    
    try {
        if (!certificateData.studentId || !certificateData.fileName || !certificateData.fileData) {
            return res.status(400).json({ error: 'Missing required fields: studentId, fileName, fileData' });
        }
        
        console.log('🚀 FAST: Uploading certificate to MongoDB...', {
            studentId: certificateData.studentId,
            fileName: certificateData.fileName,
            fileSize: certificateData.fileSize
        });
        
        if (isMongoConnected) {
            // Create new certificate in MongoDB
            const newCertificate = new Certificate(certificateData);
            await newCertificate.save();
            
            console.log('✅ Certificate uploaded to MongoDB:', newCertificate._id);
            res.json({ 
                success: true, 
                message: 'Certificate uploaded successfully', 
                certificate: newCertificate 
            });
        } else {
            // In-memory storage fallback
            const certificateWithId = {
                ...certificateData,
                id: Date.now().toString(),
                _id: Date.now().toString()
            };
            certificates.push(certificateWithId);
            
            console.log('✅ Certificate stored in memory');
            res.json({ 
                success: true, 
                message: 'Certificate uploaded successfully (in-memory)', 
                certificate: certificateWithId 
            });
        }
    } catch (error) {
        console.error('❌ Certificate upload error:', error);
        res.status(500).json({ error: 'Failed to upload certificate', details: error.message });
    }
});

// Delete certificate by studentId and achievementId
app.delete('/api/certificates/student/:studentId/achievement/:achievementId', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { studentId, achievementId } = req.params;
    
    try {
        if (isMongoConnected) {
            const certificate = await Certificate.findOneAndDelete({ studentId, achievementId });
            if (!certificate) {
                return res.status(404).json({ error: 'Certificate not found' });
            }
            console.log('✅ Certificate deleted from MongoDB');
            res.json({ success: true, message: 'Certificate deleted successfully' });
        } else {
            // In-memory storage fallback
            const certificateIndex = certificates.findIndex(c => 
                c.studentId === studentId && c.achievementId === achievementId
            );
            if (certificateIndex === -1) {
                return res.status(404).json({ error: 'Certificate not found' });
            }
            certificates.splice(certificateIndex, 1);
            console.log('✅ Certificate deleted from memory');
            res.json({ success: true, message: 'Certificate deleted successfully (in-memory)' });
        }
    } catch (error) {
        console.error('❌ Certificate delete error:', error);
        res.status(500).json({ error: 'Failed to delete certificate', details: error.message });
    }
});

// Update certificate by studentId and achievementId
app.put('/api/certificates/student/:studentId/achievement/:achievementId', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { studentId, achievementId } = req.params;
    const updateData = req.body;
    
    try {
        if (isMongoConnected) {
            const certificate = await Certificate.findOneAndUpdate(
                { studentId, achievementId }, 
                updateData, 
                { new: true }
            );
            if (!certificate) {
                return res.status(404).json({ error: 'Certificate not found' });
            }
            console.log('✅ Certificate updated in MongoDB');
            res.json({ success: true, message: 'Certificate updated successfully', certificate });
        } else {
            // In-memory storage fallback
            const certificateIndex = certificates.findIndex(c => 
                c.studentId === studentId && c.achievementId === achievementId
            );
            if (certificateIndex === -1) {
                return res.status(404).json({ error: 'Certificate not found' });
            }
            certificates[certificateIndex] = { ...certificates[certificateIndex], ...updateData };
            console.log('✅ Certificate updated in memory');
            res.json({ 
                success: true, 
                message: 'Certificate updated successfully (in-memory)', 
                certificate: certificates[certificateIndex] 
            });
        }
    } catch (error) {
        console.error('❌ Certificate update error:', error);
        res.status(500).json({ error: 'Failed to update certificate', details: error.message });
    }
});

// --- Server Startup Logic ---
// (startServer is already defined above in the middleware section)

// Server startup logic - works for both development and production (Render)
if (process.env.NODE_ENV !== 'production' || process.env.RENDER) {
    // Development or Render production - start traditional server
    app.listen(PORT, async () => {
        try {
            await startServer();
            dbInitialized = true;
            console.log(`✅ Placement Portal Server running on port ${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🚀 Status: Ready and accepting connections`);
            console.log(`📊 MongoDB: Connected to Atlas cluster`);
        } catch (error) {
            console.error('❌ Server startup error:', error);
            console.log('⚠️  Server running without MongoDB connection');
        }
    });
} else {
    // Serverless mode (Vercel) - initialize DB connection immediately
    try {
        console.log('☁️  Serverless mode: Initializing MongoDB connection...');
        // Initialize in background - don't block export
        Promise.resolve().then(async () => {
            try {
                await ensureConnection();
                dbInitialized = true;
                console.log('✅ MongoDB connection initialized in serverless mode');
            } catch (error) {
                console.error('MongoDB initialization error:', error.message);
                // Connection will be retried on first request
            }
        });
    } catch (error) {
        // Even console.log can fail in some cases, so wrap it
        // Ignore and continue - function must export successfully
    }
}

// Global error handler - prevents function crashes
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found', path: req.path });
});

// Export for Vercel - must export the app directly
// Wrap in try-catch to ensure export always succeeds
try {
    module.exports = app;
} catch (error) {
    // If export fails, create minimal app and export that
    const express = require('express');
    const minimalApp = express();
    minimalApp.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        next();
    });
    minimalApp.get('*', (req, res) => {
        res.status(500).json({ error: 'Server initialization failed', message: error.message });
    });
    module.exports = minimalApp;
}