const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { Readable } = require('stream');
// const fs = require('fs'); // Unused - commented out
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
mongoose.set('bufferCommands', false);
mongoose.set('bufferTimeoutMS', 0);
// Load environment variables from backend directory
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Debug: Log environment variable status on startup
console.log('🔍 ENV DEBUG:');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('  RENDER:', process.env.RENDER || 'not set');
console.log('  MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('  JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('  PORT:', process.env.PORT || 'not set');

/**
 * ========================================
 * PERFORMANCE OPTIMIZATIONS FOR 1000+ STUDENTS
 * ========================================
 * 
 * This server implements several critical optimizations:
 * 
 * 1. PAGINATION: /api/students returns 50 records at a time (not all 3000+)
 * 2. FIELD PROJECTIONS: Heavy binary data (images, PDFs) excluded from list views
 * 3. SERVER-SIDE AGGREGATION: Branch coordinator counts calculated by MongoDB
 * 4. DATABASE INDEXES: Fast lookups on regNo, department, batch
 * 5. LEAN QUERIES: Returns plain JS objects (50% faster than Mongoose docs)
 * 
 * These changes ensure the app remains responsive at scale.
 * ========================================
 */

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register fatal process handlers early, before any async startup work begins.
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', reason);
    // Keep process alive; request handlers already return 503 when DB is unavailable.
});

process.on('uncaughtException', (error) => {
    console.error('⚠️  Uncaught Exception:', error);
    // Keep process alive to preserve local development availability.
});

// File upload configuration (Multer - memory storage for upload routes)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

// =====================================================
// GLOBAL CORS HANDLING (must run before all routes)
// =====================================================
app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin) {
        const allowedOrigins = [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://placement--portal.vercel.app',
            'https://placement-portal.vercel.app',
            'https://3nt1rq0-3000.inc1.devtunnels.ms'
        ];

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
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin,Cache-Control,Pragma,Expires');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Content-Type,Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});

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
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma', 'Expires'],
        exposedHeaders: ['Content-Type', 'Authorization'],
        optionsSuccessStatus: 200
    }));
} catch (corsError) {
    console.error('CORS middleware error:', corsError);
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ========================================
// JWT Token Decode Cache (Performance)
// ========================================
// Caches decoded JWT payloads in-memory to skip repeated jwt.verify() calls
// for the same token within a short window. Dramatically speeds up burst API calls.
const jwtCache = new Map();
const JWT_CACHE_MAX_SIZE = 500;
const JWT_CACHE_TTL_MS = 60 * 1000; // 60 seconds

// Periodic cleanup every 2 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of jwtCache) {
        if (now - entry.cachedAt > JWT_CACHE_TTL_MS) {
            jwtCache.delete(key);
        }
    }
}, 120 * 1000);

// ========================================
// Login Document Cache (Performance)
// ========================================
// Caches admin/coordinator/student docs after first DB fetch to avoid
// repeated slow queries on MongoDB Atlas free tier (3-10s cold start)
const loginDocCache = new Map();
const LOGIN_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes (increased from 5min for better performance)

const getLoginCache = (key) => {
    const entry = loginDocCache.get(key);
    if (entry && (Date.now() - entry.cachedAt < LOGIN_CACHE_TTL_MS)) {
        return entry.doc;
    }
    loginDocCache.delete(key);
    return null;
};

const setLoginCache = (key, doc) => {
    if (loginDocCache.size >= 200) {
        const firstKey = loginDocCache.keys().next().value;
        loginDocCache.delete(firstKey);
    }
    loginDocCache.set(key, { doc, cachedAt: Date.now() });
};

// Reserved for future use - clears cache for specific key
// eslint-disable-next-line no-unused-vars
const _invalidateLoginCache = (key) => {
    loginDocCache.delete(key);
};

const getStudentLoginCacheKey = (studentDoc) => {
    if (!studentDoc) return null;
    const regNo = (studentDoc.regNo || '').toString().trim();
    const dob = (studentDoc.dob || '').toString().trim();
    if (!regNo || !dob) return null;
    return `student:${regNo}:${dob}`;
};

const invalidateStudentLoginCache = (studentDoc) => {
    const cacheKey = getStudentLoginCacheKey(studentDoc);
    if (!cacheKey) return;
    loginDocCache.delete(cacheKey);
};

// JWT Authentication Middleware (with cache)
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.sendStatus(401);
    }
    
    // Check cache first
    const cached = jwtCache.get(token);
    if (cached && (Date.now() - cached.cachedAt < JWT_CACHE_TTL_MS)) {
        req.user = cached.user;
        return next();
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            // Remove from cache if it was there
            jwtCache.delete(token);
            return res.sendStatus(403);
        }
        
        // Cache the decoded token
        if (jwtCache.size >= JWT_CACHE_MAX_SIZE) {
            // Evict oldest entry
            const firstKey = jwtCache.keys().next().value;
            jwtCache.delete(firstKey);
        }
        jwtCache.set(token, { user, cachedAt: Date.now() });
        
        req.user = user;
        next();
    });
};

// Role-based authorization middleware
const checkRole = (...allowedRoles) => {
    return (req, res, next) => {
        console.log(`🎯 Role Check: User role '${req.user?.role}', Required: [${allowedRoles.join(', ')}]`);
        
        if (!req.user) {
            console.log('❌ Role Check: No user in request');
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        if (!allowedRoles.includes(req.user.role)) {
            console.log(`❌ Role Check: Access denied for role '${req.user.role}'`);
            return res.status(403).json({ 
                message: 'Access denied. Insufficient permissions.',
                requiredRoles: allowedRoles,
                currentRole: req.user.role
            });
        }
        
        console.log(`✅ Role Check: Access granted for role '${req.user.role}'`);
        next();
    };
};

// ========================================
// BULLETPROOF MONGODB CONNECTION (24/7 Reliability)
// ========================================

// Connection state management
// eslint-disable-next-line no-unused-vars
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
            // DNS resolution - Force IPv4 to avoid IPv6 connection issues
            family: 4,

            // Timeout settings - Increased for Atlas Free Tier cold starts
            serverSelectionTimeoutMS: 45000, // 45 seconds for cluster wake-up
            socketTimeoutMS: 75000, // 75 seconds
            connectTimeoutMS: 45000, // 45 seconds for initial connection

            // Connection pooling for serverless
            maxPoolSize: 10,
            minPoolSize: 1,
            maxIdleTimeMS: 45000, // Keep connections alive longer

            // Retry and reliability
            retryWrites: true,
            retryReads: true,

            // Fail fast when DB is unavailable instead of buffering queries
            bufferCommands: false,

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

// Coordinator management
app.get('/api/coordinators', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { department, coordinatorId } = req.query;

    try {
        if (isMongoConnected) {
            const query = {};
            if (department) query.department = department;
            if (coordinatorId) query.coordinatorId = coordinatorId;

            const coordinatorDocs = await Coordinator.find(query).sort({ createdAt: -1 });
            const result = coordinatorDocs.map(doc => sanitizeCoordinator(doc));
            return res.json({ coordinators: result });
        }

        return res.status(503).json({
            error: 'Coordinator data unavailable',
            details: 'MongoDB is not connected, so coordinator data cannot be retrieved right now.'
        });
    } catch (error) {
        console.error('Get coordinators error:', error);
        res.status(500).json({ error: 'Failed to fetch coordinators', details: error.message });
    }
});

// -------------------------------------------------
// Admin Profile APIs
// -------------------------------------------------
try {
    const adminProfileRoutes = require('./routes/adminProfile');
    
    // PUBLIC ROUTE: College images (no authentication required)
    // This must come BEFORE the authenticated routes to match first
    app.use('/api/public', adminProfileRoutes);
    console.log('✅ Public college images route loaded successfully');
    
    // Apply JWT authentication to all other admin profile routes
    app.use('/api/admin', authenticateToken, adminProfileRoutes);
    console.log('✅ Admin profile routes loaded successfully with JWT authentication');
} catch (error) {
    console.error('❌ Failed to load admin profile routes:', error.message);
}

// -------------------------------------------------
// Resume Builder APIs
// -------------------------------------------------
try {
    const resumeBuilderRoutes = require('./routes/resumeBuilder');
    app.use('/api/resume-builder', resumeBuilderRoutes);
    console.log('✅ Resume builder routes loaded successfully');
} catch (error) {
    console.error('❌ Failed to load resume builder routes:', error.message);
}

// -------------------------------------------------
// Marksheet OCR APIs
// -------------------------------------------------
try {
    const marksheetOcrRoutes = require('./routes/marksheetOcr');
    app.use('/api/marksheet', marksheetOcrRoutes);
    console.log('✅ Marksheet OCR routes loaded successfully');
} catch (error) {
    console.error('❌ Failed to load marksheet OCR routes:', error.message);
}

// -------------------------------------------------
// Ollama AI Status API
// -------------------------------------------------
app.get('/api/ai/status', async (req, res) => {
    try {
        const { checkOllamaStatus } = require('./ollamaService');
        const status = await checkOllamaStatus();
        res.json({ success: true, ...status });
    } catch (error) {
        res.json({ success: false, running: false, error: error.message });
    }
});

// -------------------------------------------------
// Admin Feedback APIs
// -------------------------------------------------
app.post('/api/feedback/generate', authenticateToken, checkRole('admin'), async (req, res) => {
    try {
        const {
            feedbackType,
            roundNumber,
            roundName,
            companyName,
            jobRole,
            studentCount,
            baseText
        } = req.body || {};

        if (!feedbackType || !['passed', 'failed'].includes(String(feedbackType).toLowerCase())) {
            return res.status(400).json({ error: 'feedbackType must be passed or failed' });
        }

        const { callOllama, checkOllamaStatus } = require('./ollamaService');
        const status = await checkOllamaStatus();

        if (!status?.running) {
            return res.status(503).json({
                error: 'Ollama is not running. Please start Ollama on your machine.',
                details: 'Run: ollama serve'
            });
        }

        const normalizedType = String(feedbackType).toLowerCase();
        const audienceLabel = normalizedType === 'passed' ? 'passed students' : 'failed students';
        const prompt = `You are an HR/Admin assistant.
Rewrite and improve the following placement round feedback in clear, grammatical, professional English.

Rules:
- Keep the feedback concise (80-140 words).
- Keep the meaning aligned with the admin intent.
- Be respectful, specific, and easy to understand.
- Do not include markdown, bullets, headings, or quotes.

Context:
- Company: ${companyName || 'N/A'}
- Job Role: ${jobRole || 'N/A'}
- Round Number: ${roundNumber || 'N/A'}
- Round Name: ${roundName || 'N/A'}
- Audience: ${audienceLabel}
- Student Count: ${Number(studentCount) || 0}

Admin Draft:
${(baseText || '').toString().trim() || (normalizedType === 'passed'
    ? 'Students showed good performance in communication, technical knowledge, and overall attitude.'
    : 'Students need improvement in technical fundamentals, confidence, and communication clarity.')}

Return only the improved feedback paragraph.`;

        const generatedText = await callOllama(prompt, { temperature: 0.35, max_tokens: 220 });

        return res.json({
            success: true,
            feedback: (generatedText || '').toString().trim(),
            model: status?.requiredModel || process.env.OLLAMA_MODEL || 'ollama'
        });
    } catch (error) {
        console.error('Admin feedback generate error:', error);
        return res.status(500).json({
            error: 'Failed to generate feedback',
            details: error.message
        });
    }
});

app.post('/api/feedback/save', authenticateToken, checkRole('admin'), async (req, res) => {
    try {
        const {
            driveId,
            companyName,
            jobRole,
            startingDate,
            endingDate,
            roundNumber,
            roundName,
            feedbackType,
            studentCount,
            totalStudents,
            feedback,
            selectedDate,
            rating,
            aiEnabled,
            aiGenerated
        } = req.body || {};

        if (!driveId || !companyName || !jobRole || !roundNumber || !feedbackType) {
            return res.status(400).json({
                error: 'Missing required fields (driveId, companyName, jobRole, roundNumber, feedbackType)'
            });
        }

        const normalizedType = String(feedbackType).toLowerCase();
        if (!['passed', 'failed'].includes(normalizedType)) {
            return res.status(400).json({ error: 'feedbackType must be passed or failed' });
        }

        const payload = {
            driveId: String(driveId),
            companyName: String(companyName),
            jobRole: String(jobRole),
            startingDate: startingDate || null,
            endingDate: endingDate || null,
            roundNumber: Number(roundNumber),
            roundName: roundName || `Round ${roundNumber}`,
            feedbackType: normalizedType,
            studentCount: Number(studentCount) || 0,
            totalStudents: Number(totalStudents) || 0,
            feedback: (feedback || '').toString().trim(),
            selectedDate: selectedDate || null,
            rating: Number(rating) || 0,
            aiEnabled: Boolean(aiEnabled),
            aiGenerated: Boolean(aiGenerated),
            submittedBy: {
                userId: req.user?.id || req.user?.userId || null,
                name: req.user?.name || req.user?.username || 'Admin',
                role: req.user?.role || 'admin'
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const Feedback = mongoose.connection.collection('Feedback');
        const insertResult = await Feedback.insertOne(payload);

        return res.status(201).json({
            success: true,
            message: 'Feedback saved successfully',
            id: insertResult.insertedId
        });
    } catch (error) {
        console.error('Save admin feedback error:', error);
        return res.status(500).json({
            error: 'Failed to save feedback',
            details: error.message
        });
    }
});

app.get('/api/feedback', authenticateToken, checkRole('student', 'admin', 'coordinator'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { driveId, roundNumber, feedbackType, companyName, jobRole, startingDate } = req.query || {};

        const normalizedDriveId = String(driveId || '').trim();
        const normalizedCompanyName = String(companyName || '').trim();
        const normalizedJobRole = String(jobRole || '').trim();
        const normalizedStartingDate = String(startingDate || '').trim();

        if (!normalizedDriveId && !(normalizedCompanyName && normalizedJobRole)) {
            return res.status(400).json({ error: 'Missing query: provide driveId or companyName+jobRole' });
        }

        const query = {};
        if (normalizedDriveId) {
            query.driveId = normalizedDriveId;
        } else {
            query.companyName = normalizedCompanyName;
            query.jobRole = normalizedJobRole;
            if (normalizedStartingDate) query.startingDate = normalizedStartingDate;
        }

        if (roundNumber !== undefined && roundNumber !== null && String(roundNumber).trim() !== '') {
            query.roundNumber = Number(roundNumber);
        }

        if (feedbackType && String(feedbackType).trim()) {
            query.feedbackType = String(feedbackType).trim().toLowerCase();
        }

        const Feedback = mongoose.connection.collection('Feedback');
        let data = await Feedback.find(query).sort({ roundNumber: 1, createdAt: -1 }).toArray();

        // Fallback for older student-drive mappings where driveId can differ.
        if (data.length === 0 && normalizedDriveId && normalizedCompanyName && normalizedJobRole) {
            const fallbackQuery = {
                companyName: normalizedCompanyName,
                jobRole: normalizedJobRole
            };
            if (normalizedStartingDate) fallbackQuery.startingDate = normalizedStartingDate;
            if (query.roundNumber !== undefined) fallbackQuery.roundNumber = query.roundNumber;
            if (query.feedbackType) fallbackQuery.feedbackType = query.feedbackType;

            data = await Feedback.find(fallbackQuery).sort({ roundNumber: 1, createdAt: -1 }).toArray();
        }

        return res.json({
            success: true,
            data,
            count: data.length
        });
    } catch (error) {
        console.error('Get feedback error:', error);
        return res.status(500).json({
            error: 'Failed to fetch feedback',
            details: error.message
        });
    }
});

// -------------------------------------------------
// Student Feedback APIs
// -------------------------------------------------
app.post('/api/student-feedback/generate', authenticateToken, checkRole('student'), async (req, res) => {
    try {
        const {
            roundNumber,
            roundName,
            companyName,
            jobRole,
            difficulty,
            roundStatus,
            textType,
            baseText
        } = req.body || {};

        const normalizedTextType = String(textType || '').trim().toLowerCase();
        if (!['feedback', 'suggestion'].includes(normalizedTextType)) {
            return res.status(400).json({ error: 'textType must be feedback or suggestion' });
        }

        const { callOllama, checkOllamaStatus } = require('./ollamaService');
        const status = await checkOllamaStatus();

        if (!status?.running) {
            return res.status(503).json({
                error: 'Ollama is not running. Please start Ollama on your machine.',
                details: 'Run: ollama serve'
            });
        }

        const normalizedDifficulty = String(difficulty || '').trim() || 'N/A';
        const normalizedRoundStatus = String(roundStatus || '').trim() || 'N/A';
        const draftText = (baseText || '').toString().trim();

        const prompt = normalizedTextType === 'feedback'
            ? `You are a placement coaching assistant.
Rewrite and improve the student's round feedback in clear, professional English.

Rules:
- Keep it concise (70-120 words).
- Keep it in first person (student perspective).
- Mention performance highlights and communication quality.
- Do not include markdown, bullets, headings, or quotes.

Context:
- Company: ${companyName || 'N/A'}
- Job Role: ${jobRole || 'N/A'}
- Round Number: ${roundNumber || 'N/A'}
- Round Name: ${roundName || 'N/A'}
- Difficulty: ${normalizedDifficulty}
- Round Status: ${normalizedRoundStatus}

Student Draft:
${draftText || 'I attended this round and tried to answer with clarity and confidence while applying my technical knowledge.'}

Return only the improved feedback paragraph.`
            : `You are a placement coaching assistant.
Rewrite and improve the student's suggestion text into practical and actionable improvement points as one concise paragraph.

Rules:
- Keep it concise (70-120 words).
- Keep it in first person (student perspective).
- Focus on specific next steps for preparation.
- Do not include markdown, bullets, headings, or quotes.

Context:
- Company: ${companyName || 'N/A'}
- Job Role: ${jobRole || 'N/A'}
- Round Number: ${roundNumber || 'N/A'}
- Round Name: ${roundName || 'N/A'}
- Difficulty: ${normalizedDifficulty}
- Round Status: ${normalizedRoundStatus}

Student Draft:
${draftText || 'I should improve technical depth, revise core concepts regularly, and practice clear communication in mock interviews.'}

Return only the improved suggestion paragraph.`;

        const generatedText = await callOllama(prompt, { temperature: 0.35, max_tokens: 220 });

        return res.json({
            success: true,
            textType: normalizedTextType,
            text: (generatedText || '').toString().trim(),
            model: status?.requiredModel || process.env.OLLAMA_MODEL || 'ollama'
        });
    } catch (error) {
        console.error('Student feedback generate error:', error);
        return res.status(500).json({
            error: 'Failed to generate student feedback text',
            details: error.message
        });
    }
});

app.post('/api/student-feedback/save', authenticateToken, checkRole('student'), async (req, res) => {
    try {
        const {
            driveId,
            companyName,
            jobRole,
            startingDate,
            endingDate,
            roundNumber,
            roundName,
            roundStatus,
            difficulty,
            feedback,
            suggestion,
            selectedDate,
            rating,
            aiEnabled,
            aiGeneratedFeedback,
            aiGeneratedSuggestion,
            studentId,
            regNo
        } = req.body || {};

        if (!driveId || !companyName || !jobRole || !roundNumber) {
            return res.status(400).json({
                error: 'Missing required fields (driveId, companyName, jobRole, roundNumber)'
            });
        }

        const normalizedFeedback = (feedback || '').toString().trim();
        const normalizedSuggestion = (suggestion || '').toString().trim();
        if (!normalizedFeedback && !normalizedSuggestion) {
            return res.status(400).json({
                error: 'At least one field is required: feedback or suggestion'
            });
        }

        const normalizedStudentId = String(studentId || req.user?.id || req.user?.userId || '').trim();
        const normalizedRegNo = String(regNo || req.user?.regNo || '').trim();
        if (!normalizedStudentId && !normalizedRegNo) {
            return res.status(400).json({
                error: 'Student identity is missing for feedback save'
            });
        }

        const payload = {
            driveId: String(driveId).trim(),
            companyName: String(companyName).trim(),
            jobRole: String(jobRole).trim(),
            startingDate: startingDate || null,
            endingDate: endingDate || null,
            roundNumber: Number(roundNumber),
            roundName: roundName || `Round ${roundNumber}`,
            roundStatus: (roundStatus || '').toString().trim() || null,
            difficulty: (difficulty || '').toString().trim() || null,
            feedback: normalizedFeedback,
            suggestion: normalizedSuggestion,
            selectedDate: selectedDate || null,
            rating: Number(rating) || 0,
            aiEnabled: Boolean(aiEnabled),
            aiGeneratedFeedback: Boolean(aiGeneratedFeedback),
            aiGeneratedSuggestion: Boolean(aiGeneratedSuggestion),
            studentId: normalizedStudentId || null,
            regNo: normalizedRegNo || null,
            submittedBy: {
                userId: req.user?.id || req.user?.userId || null,
                regNo: req.user?.regNo || normalizedRegNo || null,
                role: req.user?.role || 'student'
            },
            updatedAt: new Date()
        };

        const identityQuery = [];
        if (normalizedStudentId) identityQuery.push({ studentId: normalizedStudentId });
        if (normalizedRegNo) identityQuery.push({ regNo: normalizedRegNo });

        const filter = {
            driveId: payload.driveId,
            roundNumber: payload.roundNumber,
            ...(identityQuery.length === 1 ? identityQuery[0] : { $or: identityQuery })
        };

        const StudentFeedback = mongoose.connection.collection('StudentFeedback');
        const updateResult = await StudentFeedback.updateOne(
            filter,
            {
                $set: payload,
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true }
        );

        return res.status(updateResult.upsertedCount ? 201 : 200).json({
            success: true,
            message: updateResult.upsertedCount ? 'Student feedback saved successfully' : 'Student feedback updated successfully'
        });
    } catch (error) {
        console.error('Save student feedback error:', error);
        return res.status(500).json({
            error: 'Failed to save student feedback',
            details: error.message
        });
    }
});

app.get('/api/student-feedback', authenticateToken, checkRole('student', 'admin', 'coordinator'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const {
            driveId,
            roundNumber,
            companyName,
            jobRole,
            startingDate,
            studentId,
            regNo
        } = req.query || {};

        const normalizedDriveId = String(driveId || '').trim();
        const normalizedCompanyName = String(companyName || '').trim();
        const normalizedJobRole = String(jobRole || '').trim();
        const normalizedStartingDate = String(startingDate || '').trim();

        if (!normalizedDriveId && !(normalizedCompanyName && normalizedJobRole)) {
            return res.status(400).json({ error: 'Missing query: provide driveId or companyName+jobRole' });
        }

        const query = {};
        if (normalizedDriveId) {
            query.driveId = normalizedDriveId;
        } else {
            query.companyName = normalizedCompanyName;
            query.jobRole = normalizedJobRole;
            if (normalizedStartingDate) query.startingDate = normalizedStartingDate;
        }

        if (roundNumber !== undefined && roundNumber !== null && String(roundNumber).trim() !== '') {
            query.roundNumber = Number(roundNumber);
        }

        const role = String(req.user?.role || '').toLowerCase();
        const tokenStudentId = String(req.user?.id || req.user?.userId || '').trim();
        const tokenRegNo = String(req.user?.regNo || '').trim();

        if (role === 'student') {
            if (!tokenStudentId && !tokenRegNo) {
                return res.status(403).json({ error: 'Student identity missing in token' });
            }

            if (tokenStudentId && tokenRegNo) {
                query.$or = [{ studentId: tokenStudentId }, { regNo: tokenRegNo }];
            } else if (tokenStudentId) {
                query.studentId = tokenStudentId;
            } else {
                query.regNo = tokenRegNo;
            }
        } else {
            const normalizedStudentId = String(studentId || '').trim();
            const normalizedRegNo = String(regNo || '').trim();
            if (normalizedStudentId && normalizedRegNo) {
                query.$or = [{ studentId: normalizedStudentId }, { regNo: normalizedRegNo }];
            } else if (normalizedStudentId) {
                query.studentId = normalizedStudentId;
            } else if (normalizedRegNo) {
                query.regNo = normalizedRegNo;
            }
        }

        const StudentFeedback = mongoose.connection.collection('StudentFeedback');
        let data = await StudentFeedback.find(query).sort({ roundNumber: 1, updatedAt: -1, createdAt: -1 }).toArray();

        if (data.length === 0 && normalizedDriveId && normalizedCompanyName && normalizedJobRole) {
            const fallbackQuery = {
                companyName: normalizedCompanyName,
                jobRole: normalizedJobRole
            };
            if (normalizedStartingDate) fallbackQuery.startingDate = normalizedStartingDate;
            if (query.roundNumber !== undefined) fallbackQuery.roundNumber = query.roundNumber;

            if (query.$or) {
                fallbackQuery.$or = query.$or;
            } else if (query.studentId) {
                fallbackQuery.studentId = query.studentId;
            } else if (query.regNo) {
                fallbackQuery.regNo = query.regNo;
            }

            data = await StudentFeedback.find(fallbackQuery).sort({ roundNumber: 1, updatedAt: -1, createdAt: -1 }).toArray();
        }

        return res.json({
            success: true,
            data,
            count: data.length
        });
    } catch (error) {
        console.error('Get student feedback error:', error);
        return res.status(500).json({
            error: 'Failed to fetch student feedback',
            details: error.message
        });
    }
});

// -------------------------------------------------
// Branches and Degrees APIs
// -------------------------------------------------

// GET all branches
app.get('/api/branches', async (req, res) => {
    try {
        const isMongoConnected = mongoose.connection.readyState === 1;
        
        if (!isMongoConnected) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected',
                branches: []
            });
        }

        const { degree, degreeAbbreviation } = req.query;
        
        let query = { isActive: { $ne: false } };
        
        // Filter by degree if provided
        if (degree || degreeAbbreviation) {
            const degreeFilter = degree || degreeAbbreviation;
            query.$or = [
                { degreeAbbreviation: new RegExp(`^${degreeFilter}$`, 'i') },
                { degreeFullName: new RegExp(degreeFilter, 'i') }
            ];
        }

        const branches = await Branch.find(query).sort({ branchFullName: 1 });
        
        res.json({
            success: true,
            branches: branches
        });
    } catch (error) {
        console.error('Get branches error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch branches', 
            details: error.message,
            branches: []
        });
    }
});

// POST create new branch
app.post('/api/branches', async (req, res) => {
    try {
        const isMongoConnected = mongoose.connection.readyState === 1;
        
        if (!isMongoConnected) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected'
            });
        }

        const { degreeFullName, degreeAbbreviation, branchFullName, branchAbbreviation } = req.body;
        
        if (!degreeFullName || !degreeAbbreviation || !branchFullName || !branchAbbreviation) {
            return res.status(400).json({
                success: false,
                error: 'All fields are required: degreeFullName, degreeAbbreviation, branchFullName, branchAbbreviation'
            });
        }

        const newBranch = new Branch({
            degreeFullName: degreeFullName.trim(),
            degreeAbbreviation: degreeAbbreviation.trim().toUpperCase(),
            branchFullName: branchFullName.trim(),
            branchAbbreviation: branchAbbreviation.trim().toUpperCase(),
            isActive: true
        });

        await newBranch.save();
        
        res.status(201).json({
            success: true,
            message: 'Branch created successfully',
            branch: newBranch
        });
    } catch (error) {
        console.error('Create branch error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to create branch', 
            details: error.message 
        });
    }
});

// DELETE branch
app.delete('/api/branches/:branchCode', async (req, res) => {
    try {
        const isMongoConnected = mongoose.connection.readyState === 1;
        
        if (!isMongoConnected) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected'
            });
        }

        const { branchCode } = req.params;
        
        // Try to find and delete by abbreviation or full name
        const result = await Branch.findOneAndDelete({
            $or: [
                { branchAbbreviation: branchCode },
                { branchFullName: branchCode }
            ]
        });

        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Branch not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Branch deleted successfully'
        });
    } catch (error) {
        console.error('Delete branch error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete branch', 
            details: error.message 
        });
    }
});

// GET branches summary (with coordinator counts) - DEPRECATED: See line 3250 for optimized version
// This endpoint is commented out to avoid duplicate route definitions
/*
app.get('/api/admin/branches-summary', async (req, res) => {
    try {
        const isMongoConnected = mongoose.connection.readyState === 1;
        
        if (!isMongoConnected) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected',
                branches: [],
                totalCoordinators: 0
            });
        }

        const branches = await Branch.find({ isActive: { $ne: false } }).sort({ branchFullName: 1 });
        const totalCoordinators = await Coordinator.countDocuments({ isBlocked: { $ne: true } });
        
        // Get coordinator count per branch using aggregation
        const coordinatorsByBranch = await Coordinator.aggregate([
            { $match: { isBlocked: { $ne: true } } },
            { $group: { _id: '$department', count: { $sum: 1 } } }
        ]);
        
        // Create a map for quick lookup
        const coordinatorCountMap = {};
        coordinatorsByBranch.forEach(item => {
            coordinatorCountMap[item._id] = item.count;
        });
        
        // Add coordinatorCount to each branch
        const branchesWithCounts = branches.map(branch => {
            const branchObj = branch.toObject();
            branchObj.coordinatorCount = coordinatorCountMap[branch.branchAbbreviation] || 0;
            return branchObj;
        });
        
        res.json({
            success: true,
            branches: branchesWithCounts,
            totalCoordinators: totalCoordinators
        });
    } catch (error) {
        console.error('Get branches summary error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch branches summary', 
            details: error.message,
            branches: [],
            totalCoordinators: 0
        });
    }
});
*/


// GET all degrees
app.get('/api/degrees', async (req, res) => {
    try {
        const isMongoConnected = mongoose.connection.readyState === 1;
        
        if (!isMongoConnected) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected',
                degrees: []
            });
        }

        const degrees = await Degree.find({ isActive: { $ne: false } }).sort({ degreeFullName: 1 });
        
        res.json({
            success: true,
            degrees: degrees
        });
    } catch (error) {
        console.error('Get degrees error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch degrees', 
            details: error.message,
            degrees: []
        });
    }
});

// POST create new degree
app.post('/api/degrees', async (req, res) => {
    try {
        const isMongoConnected = mongoose.connection.readyState === 1;
        
        if (!isMongoConnected) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected'
            });
        }

        const { degreeFullName, degreeAbbreviation } = req.body;
        
        if (!degreeFullName || !degreeAbbreviation) {
            return res.status(400).json({
                success: false,
                error: 'Both degreeFullName and degreeAbbreviation are required'
            });
        }

        const newDegree = new Degree({
            degreeFullName: degreeFullName.trim(),
            degreeAbbreviation: degreeAbbreviation.trim().toUpperCase(),
            isActive: true
        });

        await newDegree.save();
        
        res.status(201).json({
            success: true,
            message: 'Degree created successfully',
            degree: newDegree
        });
    } catch (error) {
        console.error('Create degree error:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to create degree', 
            details: error.message 
        });
    }
});

// -------------------------------------------------
// Admin Training APIs
// -------------------------------------------------

const sanitizeTrainingPayload = (payload = {}) => {
    const companyName = (payload.companyName || '').toString().trim();
    const companyHR = (payload.companyHR || '').toString().trim();
    const location = (payload.location || payload.companyLocation || '').toString().trim();

    const courses = Array.isArray(payload.courses)
        ? payload.courses
            .map((course) => ({
                name: (course?.name || '').toString().trim(),
                syllabus: Array.isArray(course?.syllabus)
                    ? course.syllabus
                        .map((topic) => (topic || '').toString().trim())
                        .filter(Boolean)
                    : [],
                durationStart: (course?.durationStart || '').toString().trim(),
                durationEnd: (course?.durationEnd || '').toString().trim()
            }))
            .filter((course) => course.name)
        : [];

    const trainers = Array.isArray(payload.trainers)
        ? payload.trainers
            .map((trainer) => ({
                name: (trainer?.name || '').toString().trim(),
                mobile: (trainer?.mobile || '').toString().trim(),
                email: (trainer?.email || '').toString().trim(),
                gender: (trainer?.gender || '').toString().trim()
            }))
            .filter((trainer) => trainer.name)
        : [];

    return {
        companyName,
        companyHR,
        location,
        courses,
        trainers
    };
};

const createTrainingRecord = async (req, res) => {
    try {
        const isMongoConnected = mongoose.connection.readyState === 1;

        if (!isMongoConnected) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected'
            });
        }

        const payload = sanitizeTrainingPayload(req.body || {});

        if (!payload.companyName) {
            return res.status(400).json({
                success: false,
                error: 'Company name is required'
            });
        }

        const newTraining = new Training(payload);
        await newTraining.save();

        // Clean legacy field names if they arrive in old clients or existing docs.
        await Training.updateOne(
            { _id: newTraining._id },
            { $unset: { companyInfo: 1, companyLocation: 1 } }
        );

        return res.status(201).json({
            success: true,
            message: 'Training details saved successfully',
            training: newTraining
        });
    } catch (error) {
        console.error('Create training error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to save training details',
            details: error.message
        });
    }
};

app.post('/api/trainings', createTrainingRecord);
app.post('/api/trainning', createTrainingRecord);

app.get('/api/trainings', async (req, res) => {
    try {
        const isMongoConnected = mongoose.connection.readyState === 1;

        if (!isMongoConnected) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected',
                trainings: []
            });
        }

        const trainings = await Training.find({}).sort({ createdAt: -1 }).lean();

        return res.json({
            success: true,
            trainings
        });
    } catch (error) {
        console.error('Get trainings error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch training details',
            details: error.message,
            trainings: []
        });
    }
});

app.put('/api/trainings/:id', async (req, res) => {
    try {
        const isMongoConnected = mongoose.connection.readyState === 1;

        if (!isMongoConnected) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected'
            });
        }

        const payload = sanitizeTrainingPayload(req.body || {});

        if (!payload.companyName) {
            return res.status(400).json({
                success: false,
                error: 'Company name is required'
            });
        }

        const updatedTraining = await Training.findByIdAndUpdate(
            req.params.id,
            {
                $set: payload,
                $unset: {
                    companyInfo: 1,
                    companyLocation: 1
                }
            },
            { new: true, runValidators: true }
        );

        if (!updatedTraining) {
            return res.status(404).json({
                success: false,
                error: 'Training not found'
            });
        }

        return res.json({
            success: true,
            message: 'Training details updated successfully',
            training: updatedTraining
        });
    } catch (error) {
        console.error('Update training error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to update training details',
            details: error.message
        });
    }
});

const sanitizeScheduledTrainingPayload = (payload = {}) => {
    const scheduleId = (payload.scheduleId || '').toString().trim();
    const companyName = (payload.companyName || '').toString().trim();
    const startDate = (payload.startDate || '').toString().trim();
    const endDate = (payload.endDate || '').toString().trim();

    // Robust phase processing with type validation - prevent "[Object Object]" strings
    const phases = Array.isArray(payload.phases)
        ? payload.phases
            .filter((phase) => {
                // Skip non-objects
                if (!phase || typeof phase !== 'object') return false;
                // Skip if phaseNumber is not a string
                if (!phase.phaseNumber || typeof phase.phaseNumber !== 'string') return false;
                // Skip if applicableCourses is not an array
                if (!Array.isArray(phase.applicableCourses)) return false;
                // Skip if any course is not a string (would stringify to [object Object])
                if (!phase.applicableCourses.every((course) => typeof course === 'string')) return false;
                return true;
            })
            .map((phase) => ({
                phaseNumber: phase.phaseNumber.toString().trim(),
                trainer: (phase.trainer || '').toString().trim(),
                applicableYear: (phase.applicableYear || '').toString().trim(),
                startDate: (phase.startDate || '').toString().trim(),
                endDate: (phase.endDate || '').toString().trim(),
                duration: (phase.duration || '').toString().trim(),
                applicableCourses: phase.applicableCourses
                    .map((course) => (course || '').toString().trim())
                    .filter(Boolean)
            }))
            .filter((phase) => phase.phaseNumber && phase.applicableCourses.length > 0)
        : [];

    const batches = Array.isArray(payload.batches)
        ? payload.batches
            .map((batch) => ({
                batchName: (batch?.batchName || '').toString().trim(),
                applicableYear: (batch?.applicableYear || batch?.courseName || '').toString().trim()
            }))
            .filter((batch) => batch.batchName && batch.applicableYear)
        : [];

    return {
        scheduleId,
        companyName,
        startDate,
        endDate,
        phases,
        batches
    };
};

app.post('/api/scheduled-trainings', async (req, res) => {
    try {
        const isMongoConnected = mongoose.connection.readyState === 1;

        if (!isMongoConnected) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected'
            });
        }

        console.log('\n=== SCHEDULED TRAINING REQUEST ===');
        console.log('Raw request body:', JSON.stringify(req.body, null, 2));
        console.log('Phases from request:', req.body?.phases);
        console.log('Phases type check:', req.body?.phases?.map(p => ({
            phase: p,
            type: typeof p,
            phaseNumber: p?.phaseNumber,
            phaseNumberType: typeof p?.phaseNumber,
            applicableCourses: p?.applicableCourses,
            isArray: Array.isArray(p?.applicableCourses)
        })));

        const payload = sanitizeScheduledTrainingPayload(req.body || {});

        console.log('Sanitized payload:', JSON.stringify(payload, null, 2));
        console.log('Sanitized phases:', payload.phases);

        if (!payload.companyName) {
            return res.status(400).json({
                success: false,
                error: 'Company name is required'
            });
        }

        if (!payload.startDate || !payload.endDate) {
            return res.status(400).json({
                success: false,
                error: 'Start date and end date are required'
            });
        }

        let record;

        if (payload.scheduleId) {
            if (!mongoose.Types.ObjectId.isValid(payload.scheduleId)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid schedule id'
                });
            }

            record = await ScheduledTraining.findByIdAndUpdate(
                payload.scheduleId,
                {
                    companyName: payload.companyName,
                    startDate: payload.startDate,
                    endDate: payload.endDate,
                    phases: payload.phases,
                    batches: payload.batches
                },
                { new: true }
            );

            if (!record) {
                return res.status(404).json({
                    success: false,
                    error: 'Scheduled training not found'
                });
            }
        } else {
            // Create a new record when scheduleId is not provided.
            // This allows multiple schedules for the same company.
            record = await ScheduledTraining.create({
                companyName: payload.companyName,
                startDate: payload.startDate,
                endDate: payload.endDate,
                phases: payload.phases,
                batches: payload.batches
            });
        }

        console.log('Saved record:', JSON.stringify(record, null, 2));
        console.log('=== END REQUEST ===\n');

        return res.status(201).json({
            success: true,
            message: 'Scheduled training saved successfully',
            schedule: record
        });
    } catch (error) {
        console.error('Create scheduled training error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to save scheduled training details',
            details: error.message
        });
    }
});

app.get('/api/scheduled-trainings', async (req, res) => {
    try {
        const isMongoConnected = mongoose.connection.readyState === 1;

        if (!isMongoConnected) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected',
                schedules: []
            });
        }

        const schedules = await ScheduledTraining.find({}).sort({ createdAt: -1 }).lean();

        return res.json({
            success: true,
            schedules
        });
    } catch (error) {
        console.error('Get scheduled trainings error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch scheduled training details',
            details: error.message,
            schedules: []
        });
    }
});

app.delete('/api/scheduled-trainings/:id', async (req, res) => {
    try {
        const isMongoConnected = mongoose.connection.readyState === 1;

        if (!isMongoConnected) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected'
            });
        }

        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid scheduled training id'
            });
        }

        const deletedSchedule = await ScheduledTraining.findByIdAndDelete(id);

        if (!deletedSchedule) {
            return res.status(404).json({
                success: false,
                error: 'Scheduled training not found'
            });
        }

        return res.json({
            success: true,
            message: 'Scheduled training deleted successfully'
        });
    } catch (error) {
        console.error('Delete scheduled training error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to delete scheduled training',
            details: error.message
        });
    }
});

app.get('/api/training-courses', async (req, res) => {
    try {
        const isMongoConnected = mongoose.connection.readyState === 1;

        if (!isMongoConnected) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected',
                courses: []
            });
        }

        const year = (req.query?.year || '').toString().trim();

        const normalizeYearToken = (value = '') => {
            const raw = value.toString().trim().toUpperCase();
            if (!raw) return '';

            const compact = raw.replace(/[^A-Z0-9]/g, '');
            if (!compact) return '';

            const yearAliases = {
                '1': 'I',
                '01': 'I',
                '1ST': 'I',
                '1STYEAR': 'I',
                'FIRST': 'I',
                'FIRSTYEAR': 'I',
                'I': 'I',
                '2': 'II',
                '02': 'II',
                '2ND': 'II',
                '2NDYEAR': 'II',
                'SECOND': 'II',
                'SECONDYEAR': 'II',
                'II': 'II',
                '3': 'III',
                '03': 'III',
                '3RD': 'III',
                '3RDYEAR': 'III',
                'THIRD': 'III',
                'THIRDYEAR': 'III',
                'III': 'III',
                '4': 'IV',
                '04': 'IV',
                '4TH': 'IV',
                '4THYEAR': 'IV',
                'FOURTH': 'IV',
                'FOURTHYEAR': 'IV',
                'IV': 'IV'
            };

            return yearAliases[compact] || compact;
        };

        const requestedYear = normalizeYearToken(year);
        const schedules = await ScheduledTraining.find({}).select({ phases: 1, batches: 1 }).lean();

        const courseNames = [...new Set(
            (schedules || []).flatMap((schedule) => {
                const scheduleBatches = Array.isArray(schedule?.batches) ? schedule.batches : [];
                const scheduleHasMatchingBatch = requestedYear
                    ? scheduleBatches.some((batch) => normalizeYearToken(batch?.applicableYear) === requestedYear)
                    : true;

                const phases = Array.isArray(schedule?.phases) ? schedule.phases : [];

                return phases.flatMap((phase) => {
                    const phaseCourses = Array.isArray(phase?.applicableCourses) ? phase.applicableCourses : [];
                    if (!phaseCourses.length) return [];

                    if (!requestedYear) {
                        return phaseCourses
                            .map((course) => (course || '').toString().trim())
                            .filter(Boolean);
                    }

                    const phaseYear = normalizeYearToken(phase?.applicableYear);
                    const matchesPhaseYear = phaseYear === requestedYear;
                    const includePhase = matchesPhaseYear || (!phaseYear && scheduleHasMatchingBatch);

                    if (!includePhase) return [];

                    return phaseCourses
                        .map((course) => (course || '').toString().trim())
                        .filter(Boolean);
                });
            })
        )];

        return res.json({
            success: true,
            courses: courseNames
        });
    } catch (error) {
        console.error('Get training courses error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch training courses',
            details: error.message,
            courses: []
        });
    }
});

app.post('/api/scheduled-training-batches/assign', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected'
            });
        }

        const normalizeYearToken = (value = '') => {
            const raw = value.toString().trim().toUpperCase();
            if (!raw) return '';

            const compact = raw.replace(/[^A-Z0-9]/g, '');
            if (!compact) return '';

            const yearAliases = {
                '1': 'I', '01': 'I', '1ST': 'I', '1STYEAR': 'I', 'FIRST': 'I', 'FIRSTYEAR': 'I', 'I': 'I',
                '2': 'II', '02': 'II', '2ND': 'II', '2NDYEAR': 'II', 'SECOND': 'II', 'SECONDYEAR': 'II', 'II': 'II',
                '3': 'III', '03': 'III', '3RD': 'III', '3RDYEAR': 'III', 'THIRD': 'III', 'THIRDYEAR': 'III', 'III': 'III',
                '4': 'IV', '04': 'IV', '4TH': 'IV', '4THYEAR': 'IV', 'FOURTH': 'IV', 'FOURTHYEAR': 'IV', 'IV': 'IV'
            };

            return yearAliases[compact] || compact;
        };

        const scheduleId = (req.body?.scheduleId || '').toString().trim();
        const companyName = (req.body?.companyName || '').toString().trim();
        const courseName = (req.body?.courseName || '').toString().trim();
        const trainer = (req.body?.trainer || '').toString().trim();
        const applicableYear = normalizeYearToken(req.body?.applicableYear || '');
        const startDate = (req.body?.startDate || '').toString().trim();
        const endDate = (req.body?.endDate || '').toString().trim();
        const requestedBatchNumber = Number.parseInt(req.body?.batchNumber, 10);
        const requestedBatchName = (req.body?.batchName || '').toString().trim();

        const students = Array.isArray(req.body?.students)
            ? req.body.students
                .map((student) => ({
                    studentId: (student?.studentId || '').toString().trim(),
                    regNo: (student?.regNo || '').toString().trim(),
                    name: (student?.name || '').toString().trim(),
                    dept: (student?.dept || '').toString().trim(),
                    year: normalizeYearToken(student?.year || ''),
                    section: (student?.section || '').toString().trim(),
                    mobile: (student?.mobile || '').toString().trim(),
                    cgpa: (student?.cgpa || '').toString().trim()
                }))
                .filter((student) => student.regNo)
            : [];

        if (!companyName || !courseName) {
            return res.status(400).json({ success: false, error: 'Company name and course name are required' });
        }

        if (!students.length) {
            return res.status(400).json({ success: false, error: 'At least one selected student is required' });
        }

        let batchNumber = Number.isFinite(requestedBatchNumber) && requestedBatchNumber > 0 ? requestedBatchNumber : null;
        let batchName = requestedBatchName;

        if (!batchNumber && batchName) {
            const hyphenMatch = batchName.match(/-(\d+)$/);
            const batchWordMatch = batchName.match(/batch\s*(\d+)/i);
            const extractedNumber = hyphenMatch?.[1] || batchWordMatch?.[1] || '';
            const parsedFromName = Number.parseInt(extractedNumber, 10);
            if (Number.isFinite(parsedFromName) && parsedFromName > 0) {
                batchNumber = parsedFromName;
            }
        }

        if (!batchName || !batchNumber) {
            const existingCount = await TrainingBatchAssignment.countDocuments({
                ...(scheduleId ? { scheduleId } : {}),
                companyName,
                courseName,
                applicableYear
            });

            if (!batchNumber) {
                batchNumber = existingCount + 1;
            }

            if (!batchName) {
                batchName = `Batch ${batchNumber}`;
            }
        }

        const assignmentFilter = {
            companyName,
            courseName,
            batchName,
            applicableYear
        };

        if (scheduleId) {
            assignmentFilter.scheduleId = scheduleId;
        }

        let phaseSnapshot = [];
        if (scheduleId && mongoose.Types.ObjectId.isValid(scheduleId)) {
            const schedule = await ScheduledTraining.findById(scheduleId).select({ phases: 1 }).lean();
            const phases = Array.isArray(schedule?.phases) ? schedule.phases : [];
            const normalizedCourse = courseName.toLowerCase();

            phaseSnapshot = phases
                .filter((phase) => {
                    const phaseCourses = Array.isArray(phase?.applicableCourses) ? phase.applicableCourses : [];
                    const matchesCourse = phaseCourses.some((course) => (course || '').toString().trim().toLowerCase() === normalizedCourse);
                    if (!matchesCourse) return false;

                    if (!applicableYear) return true;
                    const phaseYear = normalizeYearToken(phase?.applicableYear || '');
                    return !phaseYear || phaseYear === applicableYear;
                })
                .map((phase) => ({
                    phaseNumber: (phase?.phaseNumber || '').toString().trim(),
                    trainer: (phase?.trainer || '').toString().trim(),
                    applicableYear: normalizeYearToken(phase?.applicableYear || ''),
                    startDate: (phase?.startDate || '').toString().trim(),
                    endDate: (phase?.endDate || '').toString().trim(),
                    duration: (phase?.duration || '').toString().trim()
                }))
                .filter((phase) => phase.phaseNumber);
        }

        const existingAssignment = await TrainingBatchAssignment.findOne(assignmentFilter);

        if (!existingAssignment) {
            const createdAssignment = await TrainingBatchAssignment.create({
                scheduleId,
                companyName,
                courseName,
                trainer,
                applicableYear,
                startDate,
                endDate,
                batchNumber,
                batchName,
                phases: phaseSnapshot,
                students
            });

            return res.status(201).json({
                success: true,
                message: 'Students assigned to training batch successfully',
                addedCount: students.length,
                totalStudents: students.length,
                assignment: createdAssignment
            });
        }

        const mergedStudentsMap = new Map();
        (existingAssignment.students || []).forEach((student) => {
            const key = (student?.regNo || student?.studentId || '').toString().trim();
            if (key) mergedStudentsMap.set(key, student);
        });

        let addedCount = 0;
        students.forEach((student) => {
            const key = (student.regNo || student.studentId || '').toString().trim();
            if (!key) return;
            if (!mergedStudentsMap.has(key)) {
                addedCount += 1;
            }
            mergedStudentsMap.set(key, student);
        });

        existingAssignment.scheduleId = scheduleId || existingAssignment.scheduleId;
        existingAssignment.companyName = companyName;
        existingAssignment.courseName = courseName;
        existingAssignment.trainer = trainer;
        existingAssignment.applicableYear = applicableYear;
        existingAssignment.startDate = startDate;
        existingAssignment.endDate = endDate;
        existingAssignment.batchNumber = batchNumber;
        existingAssignment.batchName = batchName;
        if (phaseSnapshot.length) {
            existingAssignment.phases = phaseSnapshot;
        }
        existingAssignment.students = Array.from(mergedStudentsMap.values());
        await existingAssignment.save();

        return res.json({
            success: true,
            message: 'Training batch assignment updated successfully',
            addedCount,
            totalStudents: existingAssignment.students.length,
            assignment: existingAssignment
        });
    } catch (error) {
        console.error('Save scheduled training batch assignment error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to save training batch assignment',
            details: error.message
        });
    }
});

app.get('/api/scheduled-training-batches', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected',
                assignments: []
            });
        }

        const normalizeYearToken = (value = '') => {
            const raw = value.toString().trim().toUpperCase();
            if (!raw) return '';
            const compact = raw.replace(/[^A-Z0-9]/g, '');
            if (!compact) return '';
            const yearAliases = {
                '1': 'I', '01': 'I', '1ST': 'I', '1STYEAR': 'I', 'FIRST': 'I', 'FIRSTYEAR': 'I', 'I': 'I',
                '2': 'II', '02': 'II', '2ND': 'II', '2NDYEAR': 'II', 'SECOND': 'II', 'SECONDYEAR': 'II', 'II': 'II',
                '3': 'III', '03': 'III', '3RD': 'III', '3RDYEAR': 'III', 'THIRD': 'III', 'THIRDYEAR': 'III', 'III': 'III',
                '4': 'IV', '04': 'IV', '4TH': 'IV', '4THYEAR': 'IV', 'FOURTH': 'IV', 'FOURTHYEAR': 'IV', 'IV': 'IV'
            };
            return yearAliases[compact] || compact;
        };

        const scheduleId = (req.query?.scheduleId || '').toString().trim();
        const companyName = (req.query?.companyName || '').toString().trim();
        const courseName = (req.query?.courseName || '').toString().trim();
        const applicableYear = normalizeYearToken(req.query?.applicableYear || '');

        const query = {};
        if (scheduleId) query.scheduleId = scheduleId;
        if (companyName) query.companyName = companyName;
        if (courseName) query.courseName = courseName;
        if (applicableYear) query.applicableYear = applicableYear;

        const assignments = await TrainingBatchAssignment.find(query).sort({ createdAt: 1 }).lean();

        return res.json({
            success: true,
            assignments
        });
    } catch (error) {
        console.error('Get scheduled training batches error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch scheduled training batches',
            details: error.message,
            assignments: []
        });
    }
});

app.get('/api/students/:regNo/training-assignment', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                success: false,
                error: 'Database not connected'
            });
        }

        const regNo = (req.params?.regNo || '').toString().trim();
        if (!regNo) {
            return res.status(400).json({
                success: false,
                error: 'Registration number is required'
            });
        }

        const assignment = await TrainingBatchAssignment
            .findOne({ 'students.regNo': regNo })
            .sort({ updatedAt: -1, createdAt: -1 })
            .lean();

        if (!assignment) {
            return res.json({
                success: true,
                assignment: null
            });
        }

        const studentEntry = (assignment.students || []).find((student) => (student?.regNo || '').toString().trim() === regNo) || null;

        return res.json({
            success: true,
            assignment: {
                ...assignment,
                student: studentEntry,
                totalStudentsInBatch: Array.isArray(assignment.students) ? assignment.students.length : 0
            }
        });
    } catch (error) {
        console.error('Get student training assignment error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch student training assignment',
            details: error.message
        });
    }
});

// -------------------------------------------------
// Admin Company Profile APIs
// -------------------------------------------------

const handleCompanyError = (res, error) => {
    const status = error?.statusCode || 500;
    const message = error?.message || 'Unknown error';
    return res.status(status).json({ error: message });
};

const ensureCompaniesFallbackInitialized = () => {
    if (!Array.isArray(companyRecords)) {
        companyRecords = [];
    }
};

// Reserved for future use
// eslint-disable-next-line no-unused-vars
const _findCompanyInMemory = (id) => {
    ensureCompaniesFallbackInitialized();
    return companyRecords.find((company) => String(company._id) === String(id));
};

const storeCompanyInMemory = (payload, existingId) => {
    ensureCompaniesFallbackInitialized();

    if (existingId) {
        const index = companyRecords.findIndex((company) => String(company._id) === String(existingId));
        if (index !== -1) {
            companyRecords[index] = { ...companyRecords[index], ...payload, _id: existingId, id: existingId };
            return companyRecords[index];
        }
    }

    const generatedId = existingId || `company_${Date.now()}`;
    const record = {
        ...payload,
        _id: generatedId,
        id: generatedId,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    companyRecords.push(record);
    return record;
};

const deleteCompanyInMemory = (id) => {
    ensureCompaniesFallbackInitialized();
    const initialLength = companyRecords.length;
    companyRecords = companyRecords.filter((company) => String(company._id) !== String(id));
    return companyRecords.length < initialLength;
};

app.get('/api/admin/companies', authenticateToken, checkRole('admin', 'coordinator'), async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const companies = await Company.find({}).sort({ createdAt: -1 });
            const sanitized = companies.map(sanitizeCompany);
            return res.json({ companies: sanitized });
        }

        ensureCompaniesFallbackInitialized();
        const sanitized = companyRecords.map(sanitizeCompany);
        return res.json({
            companies: sanitized,
            fallback: true,
            message: 'MongoDB not connected. Serving data from in-memory storage.'
        });
    } catch (error) {
        console.error('Fetch companies error:', error);
        return handleCompanyError(res, error);
    }
});

app.post('/api/admin/companies', authenticateToken, checkRole('admin'), async (req, res) => {
    try {
        const payload = parseCompanyPayload(req.body || {});

        if (mongoose.connection.readyState === 1) {
            const created = await Company.create(payload);
            return res.status(201).json({
                message: 'Company created successfully',
                company: sanitizeCompany(created)
            });
        }

        const created = storeCompanyInMemory(payload);
        return res.status(201).json({
            message: 'Company created in temporary storage. Connect to MongoDB to persist.',
            company: sanitizeCompany(created),
            fallback: true
        });
    } catch (error) {
        console.error('Create company error:', error);
        return handleCompanyError(res, error);
    }
});

app.put('/api/admin/companies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'Company ID is required' });
        }

        const payload = parseCompanyPayload(req.body || {});

        if (mongoose.connection.readyState === 1) {
            const updated = await Company.findByIdAndUpdate(
                id,
                { ...payload, updatedAt: new Date() },
                { new: true, runValidators: true }
            );

            if (!updated) {
                return res.status(404).json({ error: 'Company not found' });
            }

            return res.json({
                message: 'Company updated successfully',
                company: sanitizeCompany(updated)
            });
        }

        const updated = storeCompanyInMemory(payload, id);
        return res.json({
            message: 'Company updated in temporary storage. Connect to MongoDB to persist.',
            company: sanitizeCompany(updated),
            fallback: true
        });
    } catch (error) {
        console.error('Update company error:', error);
        return handleCompanyError(res, error);
    }
});

app.delete('/api/company-drives/:id', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected. Cannot delete drive.' });
        }

        const { id } = req.params;
        const deletedDrive = await CompanyDrive.findByIdAndDelete(id);

        if (!deletedDrive) {
            return res.status(404).json({ error: 'Company drive not found' });
        }

        console.log(`🗑️  Deleting company drive: ${deletedDrive.companyName} - ${deletedDrive.jobRole} (${deletedDrive.startingDate})`);

        const driveId = deletedDrive._id.toString();

        // CASCADE DELETE 1: Remove ALL eligible students records for this specific drive
        const eligibleStudentsDeleted = await EligibleStudent.deleteMany({
            driveId: driveId
        });

        console.log(`✅ Deleted ${eligibleStudentsDeleted.deletedCount} eligible student records`);

        // CASCADE DELETE 2: Remove ALL attendance records for this specific drive
        const attendanceDeleted = await Attendance.deleteMany({
            driveId: driveId
        });

        console.log(`✅ Deleted ${attendanceDeleted.deletedCount} attendance records`);

        // CASCADE DELETE 3: Remove round results from Reports collection for this specific drive
        const Reports = mongoose.connection.collection('Reports');
        const reportsDeleted = await Reports.deleteOne({ driveId: driveId });
        
        console.log(`✅ Deleted ${reportsDeleted.deletedCount} round results document(s)`);

        // CASCADE DELETE 4: Remove any student applications for this specific drive
        const applicationsDeleted = await mongoose.connection.collection('student_applications').deleteMany({
            driveId: driveId
        }).catch(err => {
            console.log('⚠️  No student_applications collection or error:', err.message);
            return { deletedCount: 0 };
        });

        console.log(`✅ Deleted ${applicationsDeleted.deletedCount} student application records`);

        res.status(200).json({ 
            success: true,
            message: 'Company drive and ALL related data deleted successfully', 
            drive: {
                companyName: deletedDrive.companyName,
                jobRole: deletedDrive.jobRole,
                startingDate: deletedDrive.startingDate
            },
            deleted: {
                eligibleStudents: eligibleStudentsDeleted.deletedCount,
                attendanceRecords: attendanceDeleted.deletedCount,
                roundResults: reportsDeleted.deletedCount,
                studentApplications: applicationsDeleted.deletedCount
            }
        });
    } catch (error) {
        console.error('❌ Delete company drive error:', error);
        res.status(500).json({ error: 'Failed to delete company drive', details: error.message });
    }
});

app.put('/api/company-drives/:id', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected. Cannot update drive.' });
        }

        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'Company drive ID is required' });
        }

        const updatePayload = req.body || {};
        const updatedDrive = await CompanyDrive.findByIdAndUpdate(
            id,
            { ...updatePayload, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!updatedDrive) {
            return res.status(404).json({ error: 'Company drive not found' });
        }

        res.status(200).json({ message: 'Company drive updated successfully', drive: updatedDrive });
    } catch (error) {
        console.error('Update company drive error:', error);
        res.status(500).json({ error: 'Failed to update company drive', details: error.message });
    }
});

app.get('/api/company-drives', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected. Cannot fetch drives.' });
        }

        // Cache for 5 minutes for faster landing page loads
        res.set('Cache-Control', 'public, max-age=300, s-maxage=600');

        // ⚠️ CRITICAL: DO NOT use .select() to limit fields!
        // This endpoint serves multiple clients that need different fields:
        // - Landing Page: companyName, startingDate, package
        // - Admin Pages: jobRole, endingDate, rounds, mode, department, eligibleBranches
        // - Coordinator Pages: jobRole, endingDate, rounds, mode, department
        // Return ALL fields to ensure no client breaks
        const drives = await CompanyDrive.find({})
            .sort({ createdAt: -1 })
            .maxTimeMS(5000) // 5s timeout protection
            .lean()
            .catch(err => {
                console.log('⚠️ Company drives query timeout:', err.message);
                return [];
            });
        
        // Validate that critical fields exist to prevent future issues
        if (drives && drives.length > 0) {
            const requiredFields = ['companyName', 'jobRole', 'startingDate', 'endingDate', 'rounds', 'mode', 'department', 'eligibleBranches'];
            const sample = drives[0];
            const missingFields = requiredFields.filter(field => !(field in sample));
            if (missingFields.length > 0) {
                console.warn('⚠️ Missing critical fields in company drives:', missingFields);
                console.warn('⚠️ This may cause issues in admin/coordinator pages');
            }
        }
        
        res.status(200).json({ drives: drives || [] });
    } catch (error) {
        console.error('Fetch company drives error:', error);
        res.status(500).json({ error: 'Failed to fetch company drives', details: error.message });
    }
});

app.post('/api/company-drives', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected. Cannot create drive.' });
        }

        const driveData = req.body;
        const newDrive = new CompanyDrive(driveData);
        await newDrive.save();

        res.status(201).json({ message: 'Company drive created successfully', drive: newDrive });
    } catch (error) {
        console.error('Create company drive error:', error);
        res.status(500).json({ error: 'Failed to create company drive', details: error.message });
    }
});

// Student Applications API - Create applications for selected students
app.post('/api/student-applications', authenticateToken, checkRole('student', 'admin', 'coordinator'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected. Cannot create applications.' });
        }

        const { studentIds, companyName, jobRole, driveId, nasaDate, filterCriteria } = req.body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ error: 'Student IDs are required' });
        }

        if (!companyName || !jobRole) {
            return res.status(400).json({ error: 'Company name and job role are required' });
        }

        // Fetch student details to get register numbers
        const students = await Student.find({ _id: { $in: studentIds } }).select('_id regNo');
        
        const applications = students.map(student => ({
            studentId: String(student._id),
            regNo: student.regNo,
            companyName,
            jobRole,
            driveId: driveId || '',
            status: 'Pending',
            nasaDate: nasaDate || new Date().toISOString().split('T')[0],
            filterCriteria: filterCriteria || {}
        }));

        // Use bulkWrite for better performance
        const bulkOps = applications.map(app => ({
            updateOne: {
                filter: app.driveId
                    ? { studentId: app.studentId, driveId: app.driveId }
                    : { studentId: app.studentId, companyName: app.companyName, jobRole: app.jobRole },
                update: { $set: app },
                upsert: true
            }
        }));

        const result = await StudentApplication.bulkWrite(bulkOps);

        res.status(201).json({ 
            message: 'Student applications created successfully', 
            count: applications.length,
            result 
        });
    } catch (error) {
        console.error('Create student applications error:', error);
        res.status(500).json({ error: 'Failed to create student applications', details: error.message });
    }
});

// Get student applications by student ID
app.get('/api/student-applications/:studentId', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected. Cannot fetch applications.' });
        }

        const { studentId } = req.params;
        const applications = await StudentApplication.find({ studentId }).sort({ appliedDate: -1 });

        res.json({ applications });
    } catch (error) {
        console.error('Fetch student applications error:', error);
        res.status(500).json({ error: 'Failed to fetch student applications', details: error.message });
    }
});

// Update student application status
app.patch('/api/student-applications/:id', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected. Cannot update application.' });
        }

        const { id } = req.params;
        const { status } = req.body;

        if (!['Pending', 'Placed', 'Rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be Pending, Placed, or Rejected.' });
        }

        const updatedApplication = await StudentApplication.findByIdAndUpdate(
            id,
            { status, updatedAt: new Date() },
            { new: true }
        );

        if (!updatedApplication) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.json({ message: 'Application updated successfully', application: updatedApplication });
    } catch (error) {
        console.error('Update student application error:', error);
        res.status(500).json({ error: 'Failed to update application', details: error.message });
    }
});

// Store eligible students for a company drive
app.post('/api/eligible-students', authenticateToken, checkRole('admin', 'coordinator'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected. Cannot store eligible students.' });
        }

        const { companyName, driveStartDate, driveEndDate, jobRole, filterCriteria, students, driveId } = req.body;

        console.log('Eligible Students Request:', {
            driveId,
            companyName,
            driveStartDate,
            driveEndDate,
            jobRole,
            studentsCount: students?.length,
            hasFilterCriteria: !!filterCriteria
        });

        if (!driveId || !companyName || !driveStartDate || !students || students.length === 0) {
            const missingFields = [];
            if (!driveId) missingFields.push('driveId');
            if (!companyName) missingFields.push('companyName');
            if (!driveStartDate) missingFields.push('driveStartDate');
            if (!students) missingFields.push('students');
            if (students && students.length === 0) missingFields.push('students (empty array)');
            
            console.error('Missing required fields:', missingFields);
            return res.status(400).json({ 
                error: 'Missing required fields', 
                missingFields,
                received: { driveId, companyName, driveStartDate, studentsCount: students?.length }
            });
        }

        const eligibleStudentDoc = new EligibleStudent({
            driveId,
            companyName,
            driveStartDate,
            driveEndDate,
            jobRole,
            filterCriteria,
            students
        });

        await eligibleStudentDoc.save();

        // Automatically create student applications for all eligible students
        try {
            const applications = students.map(student => ({
                studentId: String(student.studentId),
                regNo: student.regNo,
                companyName,
                jobRole: jobRole || filterCriteria?.jobs || 'N/A',
                driveId: driveId, // Use the unique drive ID
                status: 'Pending',
                rounds: [],
                nasaDate: driveStartDate,
                filterCriteria: filterCriteria || {}
            }));

            // Use bulkWrite for better performance
            const bulkOps = applications.map(app => ({
                updateOne: {
                    filter: { studentId: app.studentId, driveId: app.driveId }, // Match by studentId AND driveId
                    update: { $set: app },
                    upsert: true
                }
            }));

            await StudentApplication.bulkWrite(bulkOps);
            console.log(`Created/updated ${applications.length} student applications`);
        } catch (appError) {
            console.error('Error creating student applications:', appError);
            // Don't fail the entire request if application creation fails
        }

        res.json({ 
            message: 'Eligible students stored successfully', 
            data: eligibleStudentDoc 
        });
    } catch (error) {
        console.error('Store eligible students error:', error);
        res.status(500).json({ error: 'Failed to store eligible students', details: error.message });
    }
});

// Sync student applications from existing eligible students (utility endpoint)
app.post('/api/sync-student-applications', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        // Fetch all eligible students
        const eligibleStudents = await EligibleStudent.find({});
        
        let totalCreated = 0;
        let totalUpdated = 0;

        for (const eligibleDoc of eligibleStudents) {
            const applications = eligibleDoc.students.map(student => ({
                studentId: String(student.studentId),
                regNo: student.regNo,
                companyName: eligibleDoc.companyName,
                jobRole: eligibleDoc.jobRole || eligibleDoc.filterCriteria?.jobs || 'N/A',
                driveId: eligibleDoc._id.toString(),
                status: 'Pending',
                rounds: [],
                nasaDate: eligibleDoc.driveStartDate,
                filterCriteria: eligibleDoc.filterCriteria || {}
            }));

            const bulkOps = applications.map(app => ({
                updateOne: {
                    filter: app.driveId
                        ? { studentId: app.studentId, driveId: app.driveId }
                        : { studentId: app.studentId, companyName: app.companyName, jobRole: app.jobRole },
                    update: { $set: app },
                    upsert: true
                }
            }));

            const result = await StudentApplication.bulkWrite(bulkOps);
            totalCreated += result.upsertedCount || 0;
            totalUpdated += result.modifiedCount || 0;
        }

        res.json({ 
            message: 'Student applications synced successfully',
            created: totalCreated,
            updated: totalUpdated
        });
    } catch (error) {
        console.error('Sync student applications error:', error);
        res.status(500).json({ error: 'Failed to sync student applications', details: error.message });
    }
});

// ============ ATTENDANCE ROUTES ============

const parseAttendanceDateKey = (value) => {
    const rawValue = (value || '').toString().trim();
    if (!rawValue) return '';

    const ddmmyyyyMatch = rawValue.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (ddmmyyyyMatch) {
        return rawValue;
    }

    const parsedDate = new Date(rawValue);
    if (Number.isNaN(parsedDate.getTime())) {
        return rawValue;
    }

    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = parsedDate.getFullYear();
    return `${day}-${month}-${year}`;
};

const parseAttendanceDate = (value) => {
    const attendanceDateKey = parseAttendanceDateKey(value);
    const match = attendanceDateKey.match(/^(\d{2})-(\d{2})-(\d{4})$/);

    if (!match) {
        const fallbackDate = new Date(value);
        return Number.isNaN(fallbackDate.getTime()) ? new Date() : fallbackDate;
    }

    const [, day, month, year] = match;
    return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
};

const buildTrainingAttendanceSummary = (students = []) => {
    return (Array.isArray(students) ? students : []).reduce((summary, student) => {
        const status = (student?.status || '').toString().trim().toLowerCase();
        if (status === 'present') {
            summary.totalPresent += 1;
        } else if (status === 'absent') {
            summary.totalAbsent += 1;
        }
        return summary;
    }, { totalPresent: 0, totalAbsent: 0 });
};

app.post('/api/training-attendance/submit', authenticateToken, checkRole('coordinator', 'admin'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ success: false, error: 'Database not connected. Cannot submit training attendance.' });
        }

        const attendanceData = req.body || {};
        const companyName = (attendanceData.companyName || '').toString().trim();
        const courseName = (attendanceData.courseName || '').toString().trim();
        const batchName = (attendanceData.batchName || '').toString().trim();
        const phaseNumber = (attendanceData.phaseNumber || '').toString().trim();
        const attendanceDateKey = parseAttendanceDateKey(attendanceData.attendanceDateKey || attendanceData.attendanceDate);
        const batchNumber = Number.parseInt(attendanceData.batchNumber, 10);
        const students = Array.isArray(attendanceData.students) ? attendanceData.students : [];

        if (!companyName || !courseName || !batchName || !attendanceDateKey) {
            return res.status(400).json({
                success: false,
                error: 'Company name, course name, batch name and attendance date are required'
            });
        }

        if (!Number.isFinite(batchNumber) || batchNumber < 1) {
            return res.status(400).json({
                success: false,
                error: 'Valid batch number is required'
            });
        }

        if (!students.length) {
            return res.status(400).json({
                success: false,
                error: 'At least one student is required to save training attendance'
            });
        }

        const summary = buildTrainingAttendanceSummary(students);
        const totalStudents = students.length;
        const percentage = totalStudents > 0 ? Number(((summary.totalPresent / totalStudents) * 100).toFixed(2)) : 0;
        const attendanceDate = parseAttendanceDate(attendanceData.attendanceDate || attendanceDateKey);

        const normalizedStudents = students.map((student, index) => ({
            studentId: (student?.studentId || student?.id || `student-${index}`).toString().trim(),
            name: (student?.name || '').toString().trim(),
            regNo: (student?.regNo || '').toString().trim(),
            dept: (student?.dept || '').toString().trim(),
            year: (student?.year || '').toString().trim(),
            section: (student?.section || '').toString().trim(),
            mobile: (student?.mobile || '').toString().trim(),
            status: ['Present', 'Absent'].includes((student?.status || '').toString().trim()) ? student.status : '-'
        }));

        const savedAttendance = await TrainingAttendance.findOneAndUpdate(
            {
                companyName,
                courseName,
                batchName,
                phaseNumber,
                attendanceDateKey
            },
            {
                $set: {
                    scheduleId: (attendanceData.scheduleId || '').toString().trim(),
                    companyName,
                    courseName,
                    batchNumber,
                    batchName,
                    phaseNumber,
                    attendanceDateKey,
                    attendanceDate,
                    totalStudents,
                    totalPresent: summary.totalPresent,
                    totalAbsent: summary.totalAbsent,
                    percentage,
                    students: normalizedStudents,
                    submittedBy: (attendanceData.submittedBy || req.user?.name || req.user?.username || 'Admin').toString().trim() || 'Admin'
                }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return res.status(201).json({
            success: true,
            message: 'Training attendance saved successfully',
            attendance: savedAttendance
        });
    } catch (error) {
        console.error('Save training attendance error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to save training attendance',
            details: error.message
        });
    }
});

app.get('/api/training-attendance', authenticateToken, checkRole('coordinator', 'admin'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ success: false, error: 'Database not connected', attendances: [] });
        }

        const query = {};
        const scheduleId = (req.query?.scheduleId || '').toString().trim();
        const companyName = (req.query?.companyName || '').toString().trim();
        const courseName = (req.query?.courseName || '').toString().trim();
        const batchName = (req.query?.batchName || '').toString().trim();
        const phaseNumber = (req.query?.phaseNumber || '').toString().trim();
        const attendanceDateKey = parseAttendanceDateKey(req.query?.attendanceDateKey || req.query?.attendanceDate);

        if (scheduleId) query.scheduleId = scheduleId;
        if (companyName) query.companyName = companyName;
        if (courseName) query.courseName = courseName;
        if (batchName) query.batchName = batchName;
        if (phaseNumber) query.phaseNumber = phaseNumber;
        if (attendanceDateKey) query.attendanceDateKey = attendanceDateKey;

        const attendances = await TrainingAttendance.find(query).sort({ attendanceDate: -1, createdAt: -1 }).lean();

        return res.json({
            success: true,
            attendances
        });
    } catch (error) {
        console.error('Get training attendance error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to fetch training attendance',
            details: error.message,
            attendances: []
        });
    }
});

// Submit attendance - Protected
app.post('/api/attendance/submit', authenticateToken, checkRole('coordinator', 'admin'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected. Cannot submit attendance.' });
        }

        const attendanceData = req.body;
        
        console.log('Attendance Submit Request:', {
            driveId: attendanceData.driveId,
            companyName: attendanceData.companyName,
            jobRole: attendanceData.jobRole,
            studentsCount: attendanceData.students?.length,
            totalPresent: attendanceData.totalPresent,
            totalAbsent: attendanceData.totalAbsent
        });

        // Validate required fields
        if (!attendanceData.driveId || !attendanceData.companyName || !attendanceData.jobRole || !attendanceData.startDate) {
            return res.status(400).json({ error: 'Missing required fields (driveId, companyName, jobRole, startDate)' });
        }
        
        // Convert date strings to Date objects without timezone conversion
        // Parse dates assuming they are in YYYY-MM-DD format
        const parseDate = (dateString) => {
            if (!dateString) return new Date();
            // If it's already a Date object, return it
            if (dateString instanceof Date) return dateString;
            // Parse as YYYY-MM-DD and create date at midnight local time
            const [year, month, day] = dateString.split('T')[0].split('-');
            return new Date(year, month - 1, day, 0, 0, 0, 0);
        };
        
        // Create attendance object with explicit field mapping to avoid any spread operator issues
        const attendanceDocData = {
            driveId: attendanceData.driveId, // Explicitly set driveId
            companyName: attendanceData.companyName,
            jobRole: attendanceData.jobRole,
            startDate: parseDate(attendanceData.startDate),
            endDate: parseDate(attendanceData.endDate),
            totalStudents: attendanceData.totalStudents,
            totalPresent: attendanceData.totalPresent,
            totalAbsent: attendanceData.totalAbsent,
            percentage: attendanceData.percentage,
            students: attendanceData.students,
            submittedBy: attendanceData.submittedBy || 'Admin'
        };
        
        console.log('📝 Attendance data prepared for save:', {
            driveId: attendanceDocData.driveId,
            companyName: attendanceDocData.companyName,
            jobRole: attendanceDocData.jobRole,
            hasAllFields: !!attendanceDocData.driveId && 
                          !!attendanceDocData.companyName && 
                          !!attendanceDocData.jobRole
        });
        
        console.log('🔍 Full attendanceDocData object:', JSON.stringify(attendanceDocData, null, 2));
        
        // Create new attendance record
        const attendance = new Attendance(attendanceDocData);
        
        console.log('🔍 Mongoose document created, driveId value:', attendance.driveId);
        console.log('🔍 Full mongoose document:', JSON.stringify(attendance.toObject(), null, 2));
        
        console.log('📝 Attendance document BEFORE save:', {
            driveId: attendance.driveId,
            companyName: attendance.companyName,
            jobRole: attendance.jobRole
        });
        
        await attendance.save();
        
        console.log('✅ Attendance document AFTER save:', {
            _id: attendance._id,
            driveId: attendance.driveId,
            companyName: attendance.companyName,
            jobRole: attendance.jobRole
        });
        
        res.status(201).json({
            success: true,
            message: 'Attendance submitted successfully',
            data: attendance
        });
    } catch (error) {
        console.error('Error submitting attendance:', error);
        res.status(500).json({
            error: 'Failed to submit attendance',
            details: error.message
        });
    }
});

// Get all attendance records
app.get('/api/attendance', authenticateToken, checkRole('admin', 'coordinator'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const attendances = await Attendance.find().sort({ submittedAt: -1 }).lean();
        res.json({
            success: true,
            data: attendances
        });
    } catch (error) {
        console.error('Error fetching attendances:', error);
        res.status(500).json({
            error: 'Failed to fetch attendances',
            details: error.message
        });
    }
});

// Get attendance by student ID
app.get('/api/attendance/student/:studentId', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { studentId } = req.params;
        
        const attendances = await Attendance.find({
            'students.studentId': studentId
        }).sort({ startDate: -1 }).lean();
        
        // Extract only the relevant student data from each attendance record
        const studentAttendances = attendances.map(attendance => {
            const studentData = attendance.students.find(s => s.studentId === studentId);
            return {
                _id: attendance._id,
                driveId: attendance.driveId || '',
                companyName: attendance.companyName,
                jobRole: attendance.jobRole,
                startDate: attendance.startDate,
                endDate: attendance.endDate,
                status: studentData?.status || '-',
                submittedAt: attendance.submittedAt || null,
                updatedAt: attendance.updatedAt || attendance.submittedAt || null
            };
        });
        
        res.json({
            success: true,
            data: studentAttendances
        });
    } catch (error) {
        console.error('Error fetching student attendance:', error);
        res.status(500).json({
            error: 'Failed to fetch student attendance',
            details: error.message
        });
    }
});

// Get attendance by registration number
app.get('/api/attendance/student/regNo/:regNo', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { regNo } = req.params;
        
        const attendances = await Attendance.find({
            'students.regNo': regNo
        }).sort({ startDate: -1 }).lean();
        
        // Extract only the relevant student data from each attendance record
        const studentAttendances = attendances.map(attendance => {
            const studentData = attendance.students.find(s => s.regNo === regNo);
            return {
                _id: attendance._id,
                driveId: attendance.driveId || '',
                companyName: attendance.companyName,
                jobRole: attendance.jobRole,
                startDate: attendance.startDate,
                endDate: attendance.endDate,
                status: studentData?.status || '-',
                submittedAt: attendance.submittedAt || null,
                updatedAt: attendance.updatedAt || attendance.submittedAt || null
            };
        });
        
        res.json({
            success: true,
            data: studentAttendances
        });
    } catch (error) {
        console.error('Error fetching student attendance:', error);
        res.status(500).json({
            error: 'Failed to fetch student attendance',
            details: error.message
        });
    }
});

    app.get('/api/training-attendance/student/regNo/:regNo', async (req, res) => {
        try {
            if (mongoose.connection.readyState !== 1) {
                return res.status(503).json({ error: 'Database not connected' });
            }

            const { regNo } = req.params;
            const normalizedRegNo = (regNo || '').toString().trim();

            if (!normalizedRegNo) {
                return res.status(400).json({ error: 'Registration number is required' });
            }

            const attendances = await TrainingAttendance.find({
                'students.regNo': normalizedRegNo
            }).sort({ attendanceDate: -1, createdAt: -1 }).lean();

            const studentAttendances = attendances.map((attendance) => {
                const studentData = Array.isArray(attendance.students)
                    ? attendance.students.find((student) => (student?.regNo || '').toString().trim() === normalizedRegNo)
                    : null;

                return {
                    _id: attendance._id,
                    companyName: attendance.companyName,
                    courseName: attendance.courseName,
                    batchName: attendance.batchName,
                    batchNumber: attendance.batchNumber,
                    phaseNumber: attendance.phaseNumber,
                    attendanceDate: attendance.attendanceDate,
                    attendanceDateKey: attendance.attendanceDateKey,
                    status: studentData?.status || '-'
                };
            });

            return res.json({
                success: true,
                data: studentAttendances
            });
        } catch (error) {
            console.error('Error fetching training attendance by regNo:', error);
            return res.status(500).json({
                error: 'Failed to fetch training attendance',
                details: error.message
            });
        }
    });

// Update attendance record
app.put('/api/attendance/:id', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { id } = req.params;
        const attendanceData = req.body;
        
        console.log('Attendance Update Request:', {
            id,
            companyName: attendanceData.companyName,
            studentsCount: attendanceData.students?.length
        });

        // Convert date strings to Date objects without timezone conversion
        const parseDate = (dateString) => {
            if (!dateString) return new Date();
            if (dateString instanceof Date) return dateString;
            const [year, month, day] = dateString.split('T')[0].split('-');
            return new Date(year, month - 1, day, 0, 0, 0, 0);
        };
        
        const attendanceDataWithParsedDates = {
            ...attendanceData,
            startDate: parseDate(attendanceData.startDate),
            endDate: parseDate(attendanceData.endDate)
        };

        // Update the attendance record
        const updatedAttendance = await Attendance.findByIdAndUpdate(
            id,
            attendanceDataWithParsedDates,
            { new: true, runValidators: true }
        );
        
        if (!updatedAttendance) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }
        
        res.json({
            success: true,
            message: 'Attendance updated successfully',
            data: updatedAttendance
        });
    } catch (error) {
        console.error('Error updating attendance:', error);
        res.status(500).json({
            error: 'Failed to update attendance',
            details: error.message
        });
    }
});

// ============ ROUND RESULTS ENDPOINTS ============

// Save round results (NEW NESTED STRUCTURE)
app.post('/api/round-results/save', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { companyName, jobRole, roundNumber, roundName, students, date, totalRounds, startingDate, endingDate, driveId } = req.body;
        
        console.log('Round Results Save Request:', {
            driveId,
            companyName,
            jobRole,
            startingDate,
            endingDate,
            roundNumber,
            roundName,
            totalRounds,
            studentsCount: students?.length
        });

        if (!driveId || !companyName || !jobRole || !roundNumber || !students) {
            return res.status(400).json({ error: 'Missing required fields (driveId, companyName, jobRole, roundNumber, students)' });
        }

        // Validate that roundNumber starts from 1 (not 0)
        if (roundNumber < 1) {
            return res.status(400).json({ 
                error: 'Invalid roundNumber', 
                message: 'Round number must start from 1 (not 0). Please use 1-indexed rounds.' 
            });
        }

        // Use the driveId directly - no need for complex identifier generation
        // This ensures each drive is completely isolated

        // Separate students by status - ONLY passed and failed (no mixing failed with absent)
        const passedStudents = students.filter(s => s.status === 'Passed');
        const failedStudents = students.filter(s => s.status === 'Failed' || s.status === 'Rejected');
        const absentStudents = students.filter(s => s.status === 'Absent' || s.status === 'Pending');

        const roundData = {
            roundNumber,
            roundName,
            date: date || new Date(),
            passedStudents,
            failedStudents,
            absentStudents,
            totalStudents: students.length,
            passedCount: passedStudents.length,
            failedCount: failedStudents.length,
            absentCount: absentStudents.length
        };

        console.log(`📊 Saving Round ${roundNumber} (${roundName}) - Passed: ${passedStudents.length}, Failed: ${failedStudents.length}, Absent: ${absentStudents.length}`);

        // Check if drive document exists
        const Reports = mongoose.connection.collection('Reports');
        const existingDrive = await Reports.findOne({ driveId });

        if (existingDrive) {
            // Update existing drive - update or add round
            const existingRoundIndex = existingDrive.rounds?.findIndex(r => r.roundNumber === roundNumber);
            
            if (existingRoundIndex !== undefined && existingRoundIndex >= 0) {
                // Update existing round
                const updateResult = await Reports.updateOne(
                    { driveId },
                    {
                        $set: {
                            [`rounds.${existingRoundIndex}`]: roundData,
                            updatedAt: new Date()
                        }
                    }
                );

                res.json({
                    success: true,
                    message: `Round ${roundNumber} results updated successfully`,
                    updated: updateResult.modifiedCount > 0
                });
            } else {
                // Add new round to existing drive
                const updateResult = await Reports.updateOne(
                    { driveId },
                    {
                        $push: { rounds: roundData },
                        $set: { 
                            totalRounds: totalRounds || existingDrive.totalRounds,
                            startingDate: startingDate || existingDrive.startingDate,
                            endingDate: endingDate || existingDrive.endingDate,
                            updatedAt: new Date() 
                        }
                    }
                );

                res.json({
                    success: true,
                    message: `Round ${roundNumber} added successfully`,
                    updated: updateResult.modifiedCount > 0
                });
            }
        } else {
            // Create new drive document with first round
            const newDrive = await Reports.insertOne({
                driveId,
                companyName,
                jobRole,
                startingDate,
                endingDate,
                totalRounds: totalRounds || 1,
                rounds: [roundData],
                createdAt: new Date(),
                updatedAt: new Date()
            });

            res.json({
                success: true,
                message: 'Drive created and round results saved successfully',
                data: { _id: newDrive.insertedId }
            });
        }
    } catch (error) {
        console.error('Error saving round results:', error);
        res.status(500).json({
            error: 'Failed to save round results',
            details: error.message
        });
    }
});

// Get round results for specific round (NEW NESTED STRUCTURE)
app.get('/api/round-results', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { roundNumber, driveId } = req.query;
        
        if (!driveId || !roundNumber) {
            return res.status(400).json({ error: 'Missing required query parameters (driveId, roundNumber)' });
        }

        // Use driveId directly - no complex identifier generation needed
        const Reports = mongoose.connection.collection('Reports');
        
        const drive = await Reports.findOne({ driveId });
        
        if (!drive) {
            return res.status(404).json({ error: 'Drive not found' });
        }

        const round = drive.rounds?.find(r => r.roundNumber === parseInt(roundNumber));
        
        if (!round) {
            return res.status(404).json({ error: 'Round results not found' });
        }

        res.json({
            success: true,
            data: {
                companyName: drive.companyName,
                jobRole: drive.jobRole,
                totalRounds: drive.totalRounds,
                ...round
            }
        });
    } catch (error) {
        console.error('Error fetching round results:', error);
        res.status(500).json({
            error: 'Failed to fetch round results',
            details: error.message
        });
    }
});

// Get all round results for a company drive (NEW NESTED STRUCTURE)
app.get('/api/round-results/all', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { driveId } = req.query;
        
        if (!driveId) {
            return res.status(400).json({ error: 'Missing required query parameter: driveId' });
        }

        // Use driveId directly
        const Reports = mongoose.connection.collection('Reports');
        
        const drive = await Reports.findOne({ driveId });

        if (!drive) {
            return res.json({
                success: true,
                data: {
                    companyName: '',
                    jobRole: '',
                    rounds: [],
                    totalRounds: 0
                }
            });
        }

        res.json({
            success: true,
            data: drive
        });
    } catch (error) {
        console.error('Error fetching all round results:', error);
        res.status(500).json({
            error: 'Failed to fetch round results',
            details: error.message
        });
    }
});

// Get all reports (for analysis pages) - returns flattened data
app.get('/api/reports/all', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const Reports = mongoose.connection.collection('Reports');
        const drives = await Reports.find({}).toArray();

        console.log(`📊 Fetching all reports - Found ${drives.length} drive(s)`);

        // Flatten the nested structure for easier consumption by analysis pages
        const flattenedReports = [];
        
        drives.forEach(drive => {
            if (drive.rounds && drive.rounds.length > 0) {
                console.log(`  Drive: ${drive.companyName} - ${drive.jobRole} has ${drive.rounds.length} round(s)`);
                drive.rounds.forEach(round => {
                    console.log(`    Round ${round.roundNumber} (${round.roundName}): ${round.passedCount} passed, ${round.failedCount} failed, ${round.absentCount} absent`);
                    
                    // Add each student from passed list
                    round.passedStudents?.forEach(student => {
                        flattenedReports.push({
                            ...student,
                            companyName: drive.companyName,
                            jobRole: drive.jobRole,
                            roundNumber: round.roundNumber,
                            roundName: round.roundName,
                            status: 'Passed',
                            date: round.date
                        });
                    });

                    // Add each student from failed list
                    round.failedStudents?.forEach(student => {
                        flattenedReports.push({
                            ...student,
                            companyName: drive.companyName,
                            jobRole: drive.jobRole,
                            roundNumber: round.roundNumber,
                            roundName: round.roundName,
                            status: 'Failed',
                            date: round.date
                        });
                    });

                    // Add each student from absent list
                    round.absentStudents?.forEach(student => {
                        flattenedReports.push({
                            ...student,
                            companyName: drive.companyName,
                            jobRole: drive.jobRole,
                            roundNumber: round.roundNumber,
                            roundName: round.roundName,
                            status: 'Absent',
                            date: round.date
                        });
                    });
                });
            }
        });

        console.log(`✅ Returning ${flattenedReports.length} flattened report records`);

        res.json({
            success: true,
            data: flattenedReports,
            drives: drives, // Include original drive documents for filtering
            totalDrives: drives.length,
            totalReports: flattenedReports.length
        });
    } catch (error) {
        console.error('Error fetching all reports:', error);
        res.status(500).json({
            error: 'Failed to fetch reports',
            details: error.message
        });
    }
});

// Get reports with filters (for analysis pages)
app.get('/api/reports/filtered', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { companyName, batch, department, status, roundNumber } = req.query;

        const Reports = mongoose.connection.collection('Reports');
        let query = {};
        
        if (companyName && companyName !== 'All Companies') {
            query.companyName = companyName;
        }

        const drives = await Reports.find(query).toArray();

        // Flatten and filter
        let flattenedReports = [];
        
        drives.forEach(drive => {
            if (drive.rounds && drive.rounds.length > 0) {
                drive.rounds.forEach(round => {
                    // Filter by round number if specified
                    if (roundNumber && round.roundNumber !== parseInt(roundNumber)) {
                        return;
                    }

                    const addStudents = (students, studentStatus) => {
                        students?.forEach(student => {
                            // Apply filters
                            if (batch && batch !== 'Batch/Year' && student.batch !== batch) return;
                            if (department && department !== 'Select Department' && student.department !== department) return;
                            if (status && status !== 'All' && studentStatus !== status) return;

                            flattenedReports.push({
                                ...student,
                                companyName: drive.companyName,
                                jobRole: drive.jobRole,
                                roundNumber: round.roundNumber,
                                roundName: round.roundName,
                                status: studentStatus,
                                date: round.date
                            });
                        });
                    };

                    addStudents(round.passedStudents, 'Passed');
                    addStudents(round.failedStudents, 'Failed');
                    addStudents(round.absentStudents, 'Absent');
                });
            }
        });

        res.json({
            success: true,
            data: flattenedReports,
            count: flattenedReports.length
        });
    } catch (error) {
        console.error('Error fetching filtered reports:', error);
        res.status(500).json({
            error: 'Failed to fetch reports',
            details: error.message
        });
    }
});

// Get company-wise analysis data with dates from company drives
app.get('/api/reports/company-wise-analysis', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { companyName, startDate, endDate } = req.query;

        console.log('📊 Company-wise analysis request:', { companyName, startDate, endDate });

        const Reports = mongoose.connection.collection('Reports');
        
        // If no company selected, return list of all companies with their drives and dates
        if (!companyName || companyName === 'All Companies') {
            const allDrives = await CompanyDrive.find({}).lean();
            // const allReports = await Reports.find({}).toArray(); // Unused - commented out
            
            // Group drives by company and job role
            const companyGroups = {};
            
            allDrives.forEach(drive => {
                const key = `${drive.companyName}|||${drive.jobRole}`;
                if (!companyGroups[key]) {
                    companyGroups[key] = {
                        companyName: drive.companyName,
                        jobRole: drive.jobRole,
                        drives: []
                    };
                }
                companyGroups[key].drives.push({
                    startingDate: drive.startingDate,
                    endingDate: drive.endingDate,
                    _id: drive._id
                });
            });
            
            return res.json({
                success: true,
                data: Object.values(companyGroups)
            });
        }

        // If company and dates are provided, fetch student data
        if (companyName && startDate) {
            // Find the company drive to get the job role and exact dates
            const companyDrive = await CompanyDrive.findOne({
                companyName: companyName,
                startingDate: startDate
            }).lean();

            if (!companyDrive) {
                return res.json({
                    success: false,
                    message: 'Company drive not found',
                    data: []
                });
            }

            console.log('✅ Found company drive:', companyDrive);

            // Fetch reports for this company and job role
            const reports = await Reports.find({
                companyName: companyName,
                jobRole: companyDrive.jobRole
            }).toArray();

            console.log(`📋 Found ${reports.length} report(s) for ${companyName} - ${companyDrive.jobRole}`);

            // Flatten student data
            const students = [];
            
            reports.forEach(report => {
                if (report.rounds && report.rounds.length > 0) {
                    report.rounds.forEach(round => {
                        // Add passed students
                        round.passedStudents?.forEach(student => {
                            students.push({
                                ...student,
                                companyName: report.companyName,
                                jobRole: report.jobRole,
                                package: companyDrive.package || 'N/A',
                                roundNumber: round.roundNumber,
                                roundName: round.roundName,
                                status: 'Passed',
                                startDate: companyDrive.startingDate,
                                endDate: companyDrive.endingDate || companyDrive.startingDate,
                                date: round.date
                            });
                        });

                        // Add failed students
                        round.failedStudents?.forEach(student => {
                            students.push({
                                ...student,
                                companyName: report.companyName,
                                jobRole: report.jobRole,
                                package: companyDrive.package || 'N/A',
                                roundNumber: round.roundNumber,
                                roundName: round.roundName,
                                status: 'Failed',
                                startDate: companyDrive.startingDate,
                                endDate: companyDrive.endingDate || companyDrive.startingDate,
                                date: round.date
                            });
                        });

                        // Add absent students
                        round.absentStudents?.forEach(student => {
                            students.push({
                                ...student,
                                companyName: report.companyName,
                                jobRole: report.jobRole,
                                package: companyDrive.package || 'N/A',
                                roundNumber: round.roundNumber,
                                roundName: round.roundName,
                                status: 'Absent',
                                startDate: companyDrive.startingDate,
                                endDate: companyDrive.endingDate || companyDrive.startingDate,
                                date: round.date
                            });
                        });
                    });
                }
            });

            console.log(`✅ Returning ${students.length} student records`);

            return res.json({
                success: true,
                data: students,
                companyDrive: {
                    companyName: companyDrive.companyName,
                    jobRole: companyDrive.jobRole,
                    startingDate: companyDrive.startingDate,
                    endingDate: companyDrive.endingDate,
                    package: companyDrive.package
                }
            });
        }

        res.json({
            success: false,
            message: 'Please provide companyName and startDate',
            data: []
        });

    } catch (error) {
        console.error('Error in company-wise analysis:', error);
        res.status(500).json({
            error: 'Failed to fetch company-wise analysis data',
            details: error.message
        });
    }
});

// ============ END ROUND RESULTS ENDPOINTS ============

// Update student applications with round results
app.post('/api/student-applications/update-rounds', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { companyName, jobRole, roundNumber, roundName, students, driveId, startingDate, endingDate, totalRounds } = req.body;
        
        console.log('Update Student Applications Request:', {
            driveId,
            companyName,
            jobRole,
            startingDate,
            endingDate,
            roundNumber,
            roundName,
            totalRounds,
            studentsCount: students?.length
        });

        if (!companyName || !jobRole || !roundNumber || !students) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Update each student's application
        const updates = await Promise.all(
            students.map(async (student) => {
                const studentId = String(student?.studentId || '').trim();
                if (!studentId) return null;

                let application = null;

                if (driveId) {
                    application = await StudentApplication.findOne({
                        studentId,
                        driveId: String(driveId)
                    });
                }

                if (!application) {
                    const fallbackQuery = {
                        studentId,
                        companyName,
                        jobRole
                    };

                    if (startingDate) {
                        fallbackQuery.$or = [
                            { nasaDate: startingDate },
                            { startingDate }
                        ];
                    }

                    application = await StudentApplication.findOne(fallbackQuery).sort({ appliedDate: -1, updatedAt: -1 });
                }

                if (!application) {
                    console.log(`No application found for student ${student.registerNo}`);
                    return null;
                }

                // Self-heal legacy records so future lookups stay drive-specific.
                if (driveId && !application.driveId) {
                    application.driveId = String(driveId);
                }
                if (startingDate && !application.startingDate) {
                    application.startingDate = startingDate;
                }
                if (endingDate && !application.endingDate) {
                    application.endingDate = endingDate;
                }
                if (Number.isFinite(Number(totalRounds)) && Number(totalRounds) > 0) {
                    application.totalRounds = Number(totalRounds);
                }

                // Initialize rounds array if it doesn't exist
                if (!application.rounds) {
                    application.rounds = [];
                }

                // Find if round already exists
                const existingRoundIndex = application.rounds.findIndex(
                    r => r.roundNumber === roundNumber
                );

                const roundData = {
                    roundNumber,
                    name: roundName,
                    roundName: roundName,
                    status: student.status,
                    date: new Date()
                };

                if (existingRoundIndex >= 0) {
                    // Update existing round
                    application.rounds[existingRoundIndex] = roundData;
                } else {
                    // Add new round
                    application.rounds.push(roundData);
                }

                // Update overall status based on rounds
                const hasAbsent = application.rounds.some(r => r.status === 'Absent');
                const hasFailed = application.rounds.some(r => r.status === 'Failed');
                const effectiveTotalRounds = Number(application.totalRounds || totalRounds || 0);
                const allPassed = application.rounds.length > 0 && application.rounds.every(r => r.status === 'Passed');
                const maxRoundNumber = application.rounds.reduce((max, currentRound) => {
                    const numericRound = Number(currentRound?.roundNumber || 0);
                    return numericRound > max ? numericRound : max;
                }, 0);
                
                if (hasAbsent) {
                    application.status = 'Absent';
                } else if (hasFailed) {
                    application.status = 'Rejected';
                } else {
                    // Mark as Placed only when final required round is passed.
                    if (
                        effectiveTotalRounds > 0 &&
                        allPassed &&
                        maxRoundNumber >= effectiveTotalRounds &&
                        application.rounds.length >= effectiveTotalRounds
                    ) {
                        application.status = 'Placed';
                    } else {
                        application.status = 'Pending';
                    }
                }

                await application.save();
                return application;
            })
        );

        const successCount = updates.filter(u => u !== null).length;

        res.json({
            success: true,
            message: `Updated ${successCount} student applications`,
            updatedCount: successCount
        });
    } catch (error) {
        console.error('Error updating student applications:', error);
        res.status(500).json({
            error: 'Failed to update student applications',
            details: error.message
        });
    }
});

// ============ PLACED STUDENTS ENDPOINTS ============

// Save placed students (students who passed the final round)
app.post('/api/placed-students/save', authenticateToken, checkRole('admin', 'coordinator'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { companyName, jobRole, students } = req.body;
        
        console.log('Placed Students Save Request:', {
            companyName,
            jobRole,
            studentsCount: students?.length
        });

        if (!companyName || !jobRole || !students || students.length === 0) {
            return res.status(400).json({ error: 'Missing required fields or no students provided' });
        }

        const PlacedStudents = mongoose.connection.collection('placed_students');
        const Students = mongoose.connection.collection('students');

        // Process each student and fetch their profile photo
        const placedStudentsData = await Promise.all(
            students.map(async (student) => {
                // Fetch the student's profile photo from Students collection
                const studentRecord = await Students.findOne(
                    { regNo: student.regNo },
                    { projection: { profilePicURL: 1, profilePhoto: 1, photo: 1 } }
                );

                return {
                    studentId: student.studentId,
                    name: student.name,
                    regNo: student.regNo,
                    dept: student.dept,
                    batch: student.batch,
                    yearSec: student.yearSec || 'N/A',
                    semester: student.semester || 'N/A',
                    phone: student.phone || 'N/A',
                    email: student.email || 'N/A',
                    company: companyName,
                    role: jobRole,
                    pkg: student.pkg || 'N/A',
                    date: student.date || new Date().toLocaleDateString('en-GB'),
                    status: 'Pending',
                    profilePhoto: studentRecord?.profilePicURL || studentRecord?.profilePhoto || studentRecord?.photo || null,
                    updatedAt: new Date()
                };
            })
        );

        // Check for existing records and update or insert
        const bulkOperations = placedStudentsData.map(student => ({
            updateOne: {
                filter: { 
                    regNo: student.regNo, 
                    company: companyName,
                    role: jobRole 
                },
                update: {
                    $set: student,
                    $setOnInsert: {
                        offerStatus: 'Pending',
                        createdAt: new Date()
                    }
                },
                upsert: true
            }
        }));

        const result = await PlacedStudents.bulkWrite(bulkOperations);

        console.log(`✅ Saved ${result.upsertedCount + result.modifiedCount} placed students for ${companyName} - ${jobRole}`);

        res.json({
            success: true,
            message: `Successfully saved ${placedStudentsData.length} placed students`,
            inserted: result.upsertedCount,
            updated: result.modifiedCount,
            total: placedStudentsData.length
        });
    } catch (error) {
        console.error('Error saving placed students:', error);
        res.status(500).json({
            error: 'Failed to save placed students',
            details: error.message
        });
    }
});

// Upload placed student offer letter and mark offer status as Sent
app.post('/api/placed-students/offer/upload', authenticateToken, checkRole('admin', 'coordinator'), upload.single('offerLetter'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const file = req.file;
        const { placedStudentId, regNo, company, role } = req.body;

        if (!file) {
            return res.status(400).json({ error: 'No offer letter uploaded' });
        }

        const PlacedStudents = mongoose.connection.collection('placed_students');

        let filter;
        if (placedStudentId) {
            if (!mongoose.Types.ObjectId.isValid(placedStudentId)) {
                return res.status(400).json({ error: 'Invalid placed student id' });
            }
            filter = { _id: new mongoose.Types.ObjectId(placedStudentId) };
        } else {
            filter = { regNo, company, role };
        }

        if (!placedStudentId && (!regNo || !company || !role)) {
            return res.status(400).json({ error: 'Missing placed student identifier' });
        }

        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'student_files' });

        const gridfsUpload = await new Promise((resolve, reject) => {
            const filename = `offer_${regNo || 'student'}_${Date.now()}_${file.originalname}`;
            const readable = new Readable();
            readable.push(file.buffer);
            readable.push(null);

            const uploadStream = bucket.openUploadStream(filename, {
                contentType: file.mimetype,
                metadata: {
                    category: 'offer-letter',
                    placedStudentId: placedStudentId || null,
                    regNo: regNo || null,
                    company: company || null,
                    role: role || null,
                    originalName: file.originalname
                }
            });

            readable
                .pipe(uploadStream)
                .on('error', reject)
                .on('finish', () => resolve({
                    id: uploadStream.id.toString(),
                    url: `/api/file/${uploadStream.id.toString()}`
                }));
        });

        const existingRecord = await PlacedStudents.findOne(filter, { projection: { offerGridfsFileId: 1 } });
        if (existingRecord?.offerGridfsFileId) {
            try {
                await bucket.delete(new mongoose.Types.ObjectId(existingRecord.offerGridfsFileId));
            } catch (deleteError) {
                console.log('⚠️ Previous offer GridFS file delete skipped:', deleteError.message);
            }
        }

        const offerUpdate = {
            status: 'Pending',
            offerStatus: 'Sent',
            offerNotificationRead: false,
            offerLetterName: file.originalname,
            offerLetterType: file.mimetype,
            offerLetterSize: file.size,
            offerLetterData: '', // Keep empty for GridFS-based uploads
            offerGridfsFileId: gridfsUpload.id,
            offerGridfsFileUrl: gridfsUpload.url,
            offerUploadedAt: new Date(),
            offerSentAt: new Date(),
            offerRespondedAt: null,
            updatedAt: new Date()
        };

        const result = await PlacedStudents.updateOne(filter, { $set: offerUpdate });

        if (!result.matchedCount) {
            return res.status(404).json({ error: 'Placed student record not found' });
        }

        return res.json({
            success: true,
            message: 'Offer letter uploaded and status updated',
            offerStatus: 'Sent',
            fileName: file.originalname,
            gridfsFileId: offerUpdate.offerGridfsFileId,
            gridfsFileUrl: offerUpdate.offerGridfsFileUrl,
            uploadedAt: offerUpdate.offerUploadedAt
        });
    } catch (error) {
        console.error('Error uploading offer letter:', error);
        return res.status(500).json({
            error: 'Failed to upload offer letter',
            details: error.message
        });
    }
});

// Student accepts/rejects an offer letter and persist status in placed_students collection
app.patch('/api/placed-students/offer-response', authenticateToken, checkRole('student'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { placedStudentId, regNo, company, role, studentId, decision } = req.body || {};
        const normalizedDecision = String(decision || '').trim().toLowerCase();

        if (normalizedDecision !== 'accepted' && normalizedDecision !== 'rejected') {
            return res.status(400).json({ error: 'Decision must be accepted or rejected' });
        }

        const normalizeString = (value) => String(value || '').trim();
        const tokenStudentId = normalizeString(req.user?.userId || req.user?.id || req.user?._id);
        const tokenRegNo = normalizeString(req.user?.regNo || req.user?.registerNumber || req.user?.registrationNumber);
        const bodyStudentId = normalizeString(studentId);
        const bodyRegNo = normalizeString(regNo);
        const normalizedCompany = normalizeString(company);
        const normalizedRole = normalizeString(role);

        const PlacedStudents = mongoose.connection.collection('placed_students');

        let explicitIdFilter = null;
        if (placedStudentId) {
            if (!mongoose.Types.ObjectId.isValid(placedStudentId)) {
                return res.status(400).json({ error: 'Invalid placed student id' });
            }
            explicitIdFilter = { _id: new mongoose.Types.ObjectId(placedStudentId) };
        }

        const identityClauses = [];
        const seenIdentityKeys = new Set();

        const pushIdentity = (field, value) => {
            const normalizedValue = normalizeString(value);
            if (!normalizedValue) return;
            const identityKey = `${field}:${normalizedValue}`;
            if (seenIdentityKeys.has(identityKey)) return;
            seenIdentityKeys.add(identityKey);
            identityClauses.push({ [field]: normalizedValue });
        };

        pushIdentity('studentId', tokenStudentId);
        pushIdentity('studentId', bodyStudentId);
        pushIdentity('regNo', tokenRegNo);
        pushIdentity('regNo', bodyRegNo);

        if (!explicitIdFilter && identityClauses.length === 0) {
            return res.status(403).json({ error: 'Student identity missing in token or request' });
        }

        const statusValue = normalizedDecision === 'accepted' ? 'Accepted' : 'Rejected';
        const update = {
            $set: {
                status: statusValue,
                offerNotificationRead: true,
                offerRespondedAt: new Date(),
                updatedAt: new Date()
            }
        };

        const candidateQueries = [];

        if (explicitIdFilter) {
            const byIdQuery = {
                ...explicitIdFilter,
                offerStatus: 'Sent'
            };
            if (normalizedCompany) byIdQuery.company = normalizedCompany;
            if (normalizedRole) byIdQuery.role = normalizedRole;
            candidateQueries.push(byIdQuery);
        }

        if (identityClauses.length > 0) {
            const identityScopedQuery = {
                offerStatus: 'Sent',
                $or: identityClauses
            };
            if (normalizedCompany) identityScopedQuery.company = normalizedCompany;
            if (normalizedRole) identityScopedQuery.role = normalizedRole;
            candidateQueries.push(identityScopedQuery);

            // Fallback: allow identity match without company/role if frontend has stale values.
            candidateQueries.push({
                offerStatus: 'Sent',
                $or: identityClauses
            });
        }

        let result = null;
        for (const query of candidateQueries) {
            // eslint-disable-next-line no-await-in-loop
            const found = await PlacedStudents.findOneAndUpdate(query, update, {
                returnDocument: 'after'
            });
            const foundDoc = found?.value || found;
            if (foundDoc && foundDoc._id) {
                result = foundDoc;
                break;
            }
        }

        if (!result || !result._id) {
            return res.status(404).json({ error: 'Placed student offer record not found for this student' });
        }

        return res.json({
            success: true,
            message: `Offer ${normalizedDecision} successfully`,
            status: result.status,
            offerStatus: result.offerStatus,
            updatedAt: result.updatedAt
        });
    } catch (error) {
        console.error('Error updating student offer response:', error);
        return res.status(500).json({
            error: 'Failed to update student offer response',
            details: error.message
        });
    }
});

// GET: Fetch unread offer-letter notifications for a student
app.get('/api/placed-students/offer-notifications/:identifier', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({
                notifications: [],
                count: 0,
                error: 'Database not connected'
            });
        }

        const identifier = String(req.params.identifier || '').trim();
        if (!identifier) {
            return res.status(400).json({ error: 'Student identifier is required' });
        }

        const PlacedStudents = mongoose.connection.collection('placed_students');
        const notifications = await PlacedStudents.find({
            $and: [
                { offerStatus: 'Sent' },
                { offerNotificationRead: false },
                {
                    $or: [
                        { studentId: identifier },
                        { regNo: identifier }
                    ]
                }
            ]
        })
            .project({
                _id: 1,
                studentId: 1,
                regNo: 1,
                company: 1,
                companyName: 1,
                role: 1,
                jobRole: 1,
                pkg: 1,
                package: 1,
                offerStatus: 1,
                offerLetterName: 1,
                offerSentAt: 1,
                offerUploadedAt: 1,
                offerNotificationRead: 1,
                updatedAt: 1
            })
            .sort({ offerSentAt: -1, offerUploadedAt: -1, updatedAt: -1 })
            .toArray();

        return res.json({
            notifications: notifications.map((item) => ({
                id: String(item._id || ''),
                studentId: String(item.studentId || ''),
                regNo: String(item.regNo || ''),
                companyName: item.company || item.companyName || '',
                jobRole: item.role || item.jobRole || '',
                packageName: item.pkg || item.package || '',
                offerLetterName: item.offerLetterName || '',
                offerStatus: item.offerStatus || 'Sent',
                offerSentAt: item.offerSentAt || item.offerUploadedAt || item.updatedAt || null
            })),
            count: notifications.length
        });
    } catch (error) {
        console.error('Offer notification fetch error:', error);
        return res.status(500).json({
            error: 'Failed to fetch offer notifications',
            notifications: [],
            count: 0
        });
    }
});

// PATCH: Mark offer-letter notifications as read for a student
app.patch('/api/placed-students/offer-notifications/mark-read', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { studentId, regNo, notificationIds = [] } = req.body || {};
        const normalizedStudentId = String(studentId || '').trim();
        const normalizedRegNo = String(regNo || '').trim();

        if (!normalizedStudentId && !normalizedRegNo) {
            return res.status(400).json({ error: 'studentId or regNo is required' });
        }

        const PlacedStudents = mongoose.connection.collection('placed_students');

        const identityFilters = [];
        if (normalizedStudentId) identityFilters.push({ studentId: normalizedStudentId });
        if (normalizedRegNo) identityFilters.push({ regNo: normalizedRegNo });

        const query = {
            offerStatus: 'Sent',
            offerNotificationRead: false,
            $or: identityFilters
        };

        if (Array.isArray(notificationIds) && notificationIds.length > 0) {
            const validIds = notificationIds
                .map((id) => String(id || '').trim())
                .filter((id) => mongoose.Types.ObjectId.isValid(id))
                .map((id) => new mongoose.Types.ObjectId(id));

            if (validIds.length > 0) {
                query._id = { $in: validIds };
            }
        }

        const result = await PlacedStudents.updateMany(query, {
            $set: { offerNotificationRead: true, updatedAt: new Date() }
        });

        return res.json({ success: true, updated: result.modifiedCount || 0 });
    } catch (error) {
        console.error('Offer notification mark-read error:', error);
        return res.status(500).json({ error: 'Failed to mark offer notifications as read' });
    }
});

// ============ PUBLIC ENDPOINT: College Images for Landing Page ============
// GET college images (PUBLIC - no authentication required)
// Returns only banner, NAAC, NBA images from admin profile for landing page
app.get('/api/public/college-images', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ success: false, error: 'Database not connected' });
        }

        // OPTIMIZATION: Aggressive cache - images rarely change (30 min)
        res.set('Cache-Control', 'public, max-age=1800, s-maxage=3600');

        const AdminModel = require('./models/Admin');
        
        // OPTIMIZATION: Add timeout protection and error handling
        const admin = await AdminModel.findOne({ adminLoginID: 'admin1000' })
            .select('collegeBanner naacCertificate nbaCertificate collegeLogo')
            .maxTimeMS(3000) // 3s timeout
            .lean()
            .catch(err => {
                console.log('⚠️ College images query timeout:', err.message);
                return null;
            });

        if (!admin) {
            return res.json({ success: true, data: null });
        }

        // Normalize URLs: strip localhost/any host prefix, return relative paths
        const normalizeUrl = (url) => {
            if (!url) return null;
            const match = url.match(/\/api\/file\/([a-f0-9]{24})/);
            if (match) return `/api/file/${match[1]}`;
            return url;
        };

        res.json({
            success: true,
            data: {
                collegeBanner: normalizeUrl(admin.collegeBanner),
                naacCertificate: normalizeUrl(admin.naacCertificate),
                nbaCertificate: normalizeUrl(admin.nbaCertificate),
                collegeLogo: normalizeUrl(admin.collegeLogo),
            }
        });
    } catch (error) {
        console.error('Error fetching college images:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch college images' });
    }
});

// Get all placed students with filters
// ============ PUBLIC ENDPOINT FOR LANDING PAGE ============
// GET placed students (PUBLIC - no authentication required for landing page)
app.get('/api/placed-students', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { dept, batch, company, status, regNo, studentId, offerStatus } = req.query;
        const isRealtimeLookup = Boolean(regNo || studentId || offerStatus);

        // Keep landing-page caching, but disable it for live student offer/status checks.
        if (isRealtimeLookup) {
            res.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');
        } else {
            res.set('Cache-Control', 'public, max-age=300, s-maxage=600'); // 5 min cache
        }

        const query = {};

        if (dept && dept !== 'All Departments') query.dept = dept;
        if (batch && batch !== 'All Batches') query.batch = batch;
        if (company && company !== 'All Companies') query.company = company;
        if (status && status !== 'All') query.status = status;
        if (regNo) query.regNo = String(regNo).trim();
        if (studentId) query.studentId = String(studentId).trim();
        if (offerStatus) query.offerStatus = String(offerStatus).trim();

        const PlacedStudents = mongoose.connection.collection('placed_students');
        
        // OPTIMIZATION: Field selection - only return essential fields (avoid large base64 images)
        // Landing page only needs: name, dept, company, pkg, role, profilePicURL
        const projection = {
            studentId: 1,
            name: 1,
            regNo: 1,
            dept: 1,
            company: 1,
            pkg: 1,
            role: 1,
            offerStatus: 1,
            offerLetterName: 1,
            offerGridfsFileId: 1,
            offerGridfsFileUrl: 1,
            offerUploadedAt: 1,
            offerSentAt: 1,
            offerRespondedAt: 1,
            profilePicURL: 1,
            profilePhoto: 1,
            batch: 1,
            status: 1
        };

        // OPTIMIZATION: Limit results to 100 for landing page performance
        // Sort by package descending to show top placements first
        const students = await PlacedStudents
            .find(query, { projection })
            .sort({ offerSentAt: -1, offerUploadedAt: -1, pkg: -1 })
            .limit(100)
            .maxTimeMS(5000) // 5s timeout protection
            .toArray()
            .catch(err => {
                console.log('⚠️ Placed students query timeout:', err.message);
                return [];
            });

        res.json({
            success: true,
            data: students,
            count: students.length
        });
    } catch (error) {
        console.error('Error fetching placed students:', error);
        res.status(500).json({
            error: 'Failed to fetch placed students',
            details: error.message
        });
    }
});

// ============ END PLACED STUDENTS ENDPOINTS ============

// ============ ARCHIVED BATCHES ENDPOINTS ============

// GET all archived batches
app.get('/api/archived-batches', authenticateToken, checkRole('admin', 'coordinator'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const archivedBatches = await ArchivedBatch.find({})
            .select('-archivedStudents') // Exclude student data for list view
            .sort({ archivedAt: -1 });

        res.json({
            success: true,
            batches: archivedBatches.map(batch => ({
                id: batch._id,
                archiveName: batch.archiveName,
                year: batch.batch,
                totalDept: batch.totalDept,
                totalStudents: batch.totalStudents,
                placedStudents: batch.placedStudents,
                archivedAt: batch.archivedAt,
                archivedBy: batch.archivedBy
            }))
        });
    } catch (error) {
        console.error('Get archived batches error:', error);
        res.status(500).json({ error: 'Failed to fetch archived batches', details: error.message });
    }
});

// GET single archived batch with departments
app.get('/api/archived-batches/:id', authenticateToken, checkRole('admin', 'coordinator'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { id } = req.params;
        const archivedBatch = await ArchivedBatch.findById(id).select('-archivedStudents');

        if (!archivedBatch) {
            return res.status(404).json({ error: 'Archived batch not found' });
        }

        res.json({
            success: true,
            batch: archivedBatch
        });
    } catch (error) {
        console.error('Get archived batch error:', error);
        res.status(500).json({ error: 'Failed to fetch archived batch', details: error.message });
    }
});

// GET archived batch students by department
app.get('/api/archived-batches/:id/department/:deptName/students', authenticateToken, checkRole('admin', 'coordinator'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { id, deptName } = req.params;
        const archivedBatch = await ArchivedBatch.findById(id);

        if (!archivedBatch) {
            return res.status(404).json({ error: 'Archived batch not found' });
        }

        // Filter students by department
        const decodedDept = decodeURIComponent(deptName);
        const students = (archivedBatch.archivedStudents || []).filter(
            s => (s.branch || s.department) === decodedDept
        );

        res.json({
            success: true,
            students: students,
            total: students.length
        });
    } catch (error) {
        console.error('Get archived batch students error:', error);
        res.status(500).json({ error: 'Failed to fetch archived batch students', details: error.message });
    }
});

// POST - Archive (zip) a batch
app.post('/api/archived-batches', authenticateToken, checkRole('admin'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { archiveName, batch, departments, adminName } = req.body;

        if (!archiveName || !batch) {
            return res.status(400).json({ error: 'Archive name and batch are required' });
        }

        // Check if archive name already exists
        const existing = await ArchivedBatch.findOne({ archiveName });
        if (existing) {
            return res.status(409).json({ error: 'Archive name already exists' });
        }

        // Fetch all students for the batch
        const students = await Student.find({ batch }).lean();

        // Group by department
        const deptMap = {};
        students.forEach(student => {
            const dept = student.branch || student.department || 'Unknown';
            if (!deptMap[dept]) {
                deptMap[dept] = {
                    name: dept,
                    sections: new Set(),
                    totalStudents: 0,
                    placedStudents: 0
                };
            }
            deptMap[dept].totalStudents++;
            if (student.section) {
                deptMap[dept].sections.add(student.section);
            }
            if (student.placementStatus === 'Placed' || student.isPlaced) {
                deptMap[dept].placedStudents++;
            }
        });

        const departmentsArray = Object.values(deptMap).map(dept => ({
            name: dept.name,
            sections: dept.sections.size || 1,
            totalStudents: dept.totalStudents,
            placedStudents: dept.placedStudents
        }));

        const totalStudents = students.length;
        const placedStudents = students.filter(s => s.placementStatus === 'Placed' || s.isPlaced).length;

        // Create archive
        const archivedBatch = new ArchivedBatch({
            archiveName,
            batch,
            departments: departmentsArray,
            totalDept: departmentsArray.length,
            totalStudents,
            placedStudents,
            archivedStudents: students,
            archivedBy: adminName || 'Admin'
        });

        await archivedBatch.save();

        // Mark students as archived (add isArchived flag)
        await Student.updateMany(
            { batch },
            { $set: { isArchived: true, archivedAt: new Date(), archiveName } }
        );

        // Log to zipping history
        await new ZippingHistory({
            action: 'Zipped Batch',
            batch: archiveName,
            batchYear: batch,
            implementedBy: adminName || 'Admin',
            details: `Zipped ${totalStudents} Students`,
            affectedStudents: totalStudents,
            affectedDepartments: departmentsArray.length
        }).save();

        res.status(201).json({
            success: true,
            message: 'Batch archived successfully',
            batch: {
                id: archivedBatch._id,
                archiveName: archivedBatch.archiveName,
                year: archivedBatch.batch,
                totalDept: archivedBatch.totalDept,
                totalStudents: archivedBatch.totalStudents,
                placedStudents: archivedBatch.placedStudents
            }
        });
    } catch (error) {
        console.error('Archive batch error:', error);
        res.status(500).json({ error: 'Failed to archive batch', details: error.message });
    }
});

// PUT - Unzip a batch (restore students)
app.put('/api/archived-batches/:id/unzip', authenticateToken, checkRole('admin'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { id } = req.params;
        const { adminName } = req.body;

        const archivedBatch = await ArchivedBatch.findById(id);
        if (!archivedBatch) {
            return res.status(404).json({ error: 'Archived batch not found' });
        }

        // Restore students (remove isArchived flag)
        await Student.updateMany(
            { batch: archivedBatch.batch, archiveName: archivedBatch.archiveName },
            { $unset: { isArchived: 1, archivedAt: 1, archiveName: 1 } }
        );

        // Log to zipping history
        await new ZippingHistory({
            action: 'Unzipped Batch',
            batch: archivedBatch.archiveName,
            batchYear: archivedBatch.batch,
            implementedBy: adminName || 'Admin',
            details: `Unzipped ${archivedBatch.totalStudents} Students`,
            affectedStudents: archivedBatch.totalStudents,
            affectedDepartments: archivedBatch.totalDept
        }).save();

        // Delete the archive
        await ArchivedBatch.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Batch unzipped successfully',
            restoredStudents: archivedBatch.totalStudents
        });
    } catch (error) {
        console.error('Unzip batch error:', error);
        res.status(500).json({ error: 'Failed to unzip batch', details: error.message });
    }
});

// DELETE - Delete an archived batch permanently
app.delete('/api/archived-batches/:id', authenticateToken, checkRole('admin'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { id } = req.params;
        const { adminName } = req.body;

        const archivedBatch = await ArchivedBatch.findById(id);
        if (!archivedBatch) {
            return res.status(404).json({ error: 'Archived batch not found' });
        }

        // Log to zipping history before deletion
        await new ZippingHistory({
            action: 'Deleted Batch',
            batch: archivedBatch.archiveName,
            batchYear: archivedBatch.batch,
            implementedBy: adminName || 'Admin',
            details: `Deleted ${archivedBatch.totalStudents} Students`,
            affectedStudents: archivedBatch.totalStudents,
            affectedDepartments: archivedBatch.totalDept
        }).save();

        // Delete the archived batch and its students permanently
        await ArchivedBatch.findByIdAndDelete(id);

        // Also delete the students from the students collection
        await Student.deleteMany({ batch: archivedBatch.batch, archiveName: archivedBatch.archiveName });

        res.json({
            success: true,
            message: 'Archive deleted successfully'
        });
    } catch (error) {
        console.error('Delete archived batch error:', error);
        res.status(500).json({ error: 'Failed to delete archive', details: error.message });
    }
});

// GET zipping history
app.get('/api/zipping-history', authenticateToken, checkRole('admin', 'coordinator'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const { batch, action } = req.query;
        const query = {};

        if (batch) query.batch = { $regex: batch, $options: 'i' };
        if (action) query.action = action;

        const history = await ZippingHistory.find(query).sort({ date: -1 });

        res.json({
            success: true,
            history: history.map(h => ({
                id: h._id,
                date: h.date,
                action: h.action,
                batch: h.batch,
                batchYear: h.batchYear,
                implementedBy: h.implementedBy,
                details: h.details
            }))
        });
    } catch (error) {
        console.error('Get zipping history error:', error);
        res.status(500).json({ error: 'Failed to fetch zipping history', details: error.message });
    }
});

// ============ END ARCHIVED BATCHES ENDPOINTS ============

// Delete student application by ID
app.delete('/api/student-applications/:id', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected. Cannot delete application.' });
        }

        const { id } = req.params;
        const deletedApplication = await StudentApplication.findByIdAndDelete(id);

        if (!deletedApplication) {
            return res.status(404).json({ error: 'Application not found' });
        }

        res.json({ message: 'Application deleted successfully', application: deletedApplication });
    } catch (error) {
        console.error('Delete student application error:', error);
        res.status(500).json({ error: 'Failed to delete application', details: error.message });
    }
});

// Delete all applications for a student
app.delete('/api/student-applications/student/:studentId', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected. Cannot delete applications.' });
        }

        const { studentId } = req.params;
        const result = await StudentApplication.deleteMany({ studentId });

        res.json({ 
            message: 'All applications deleted successfully', 
            deletedCount: result.deletedCount 
        });
    } catch (error) {
        console.error('Delete all student applications error:', error);
        res.status(500).json({ error: 'Failed to delete applications', details: error.message });
    }
});

// Get eligible students entries for a specific student
app.get('/api/eligible-students/student/:studentId', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected. Cannot fetch eligible students.' });
        }

        const { studentId } = req.params;
        
        // Find all eligible student documents where this student is in the students array
        const eligibleEntries = await EligibleStudent.find({
            'students.studentId': studentId
        }).sort({ createdAt: -1 });

        // Transform the data to return only relevant company drives for this student
        const studentDrives = await Promise.all(eligibleEntries.map(async (entry) => {
            const startDate = entry.driveStartDate || entry.companyDriveDate;
            const endDate = entry.driveEndDate || entry.driveStartDate || entry.companyDriveDate;
            let matchedDrive = null;
            
            // Fetch roundDetails from companies drives collection
            let roundDetails = [];
            let totalRounds = 0;
            try {
                // Prefer direct driveId match when available to avoid mismatches.
                if (entry.driveId && mongoose.Types.ObjectId.isValid(entry.driveId)) {
                    matchedDrive = await CompanyDrive.findById(entry.driveId);
                }

                // Try to find company drive by company name (case-insensitive) and date
                if (!matchedDrive) {
                    matchedDrive = await CompanyDrive.findOne({
                        $and: [
                            {
                                $or: [
                                    { companyName: { $regex: new RegExp(`^${entry.companyName}$`, 'i') } },
                                    { companyName: entry.companyName }
                                ]
                            },
                            {
                                $or: [
                                    { startingDate: startDate },
                                    { visitDate: startDate },
                                    { startingDate: startDate?.split('-').reverse().join('-') }
                                ]
                            }
                        ]
                    }).sort({ createdAt: -1 });
                }

                if (matchedDrive) {
                    if (matchedDrive.roundDetails && Array.isArray(matchedDrive.roundDetails)) {
                        roundDetails = matchedDrive.roundDetails;
                        totalRounds = matchedDrive.roundDetails.length;
                    }
                    console.log(`Found drive for ${entry.companyName}: ${totalRounds} rounds`);
                } else {
                    // If exact match fails, try just by company name and get the most recent
                    const fallbackDrive = await CompanyDrive.findOne({
                        $or: [
                            { companyName: { $regex: new RegExp(`^${entry.companyName}$`, 'i') } },
                            { companyName: entry.companyName }
                        ]
                    }).sort({ createdAt: -1 });
                    
                    if (fallbackDrive) {
                        matchedDrive = fallbackDrive;
                    }

                    if (matchedDrive && matchedDrive.roundDetails && Array.isArray(matchedDrive.roundDetails)) {
                        roundDetails = matchedDrive.roundDetails;
                        totalRounds = matchedDrive.roundDetails.length;
                        console.log(`Found fallback drive for ${entry.companyName}: ${totalRounds} rounds`);
                    } else {
                        console.log(`No drive found for ${entry.companyName} with startDate ${startDate}`);
                    }
                }
            } catch (err) {
                console.log('Could not fetch roundDetails:', err.message);
            }

            const driveMode = matchedDrive?.mode || matchedDrive?.driveMode || entry.filterCriteria?.mode || '';
            const drivePackage = matchedDrive?.package || matchedDrive?.packageOffer || matchedDrive?.ctc || matchedDrive?.salaryPackage || entry.filterCriteria?.package || '';
            const driveBondPeriod = matchedDrive?.bondPeriod || matchedDrive?.bondperiod || matchedDrive?.bond || '';
            
            return {
                _id: entry._id,
                driveId: entry.driveId || '',
                companyName: entry.companyName,
                driveStartDate: startDate,
                driveEndDate: endDate,
                companyDriveDate: entry.companyDriveDate, // Keep for backward compatibility
                jobRole: entry.jobRole,
                jobs: entry.filterCriteria?.jobs || entry.jobRole,
                mode: driveMode,
                package: drivePackage,
                bondPeriod: driveBondPeriod,
                roundDetails: roundDetails,
                totalRounds: totalRounds,
                createdAt: entry.createdAt
            };
        }));

        res.json({ drives: studentDrives });
    } catch (error) {
        console.error('Fetch eligible students for student error:', error);
        res.status(500).json({ error: 'Failed to fetch eligible students', details: error.message });
    }
});

// Get all eligible students (for attendance/admin)
app.get('/api/eligible-students/coordinator', authenticateToken, checkRole('coordinator', 'admin'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected. Cannot fetch eligible students.' });
        }

        const normalizeBranch = (value) => (value || '').toString().trim().toUpperCase();
        const branchKey = (value) => normalizeBranch(value).replace(/[^A-Z0-9]/g, '');
        const branchMatches = (candidate, allowedBranches) => {
            const candidateKey = branchKey(candidate);
            if (!candidateKey) return false;
            return allowedBranches.some((allowed) => {
                const allowedKey = branchKey(allowed);
                return allowedKey && (candidateKey === allowedKey || candidateKey.includes(allowedKey) || allowedKey.includes(candidateKey));
            });
        };

        let coordinatorDoc = null;
        const requestedCoordinatorId = (req.query?.coordinatorId || '').toString().trim();

        if (req.user.role === 'coordinator') {
            const coordinatorId = req.user.coordinatorId;
            if (!coordinatorId) {
                return res.status(400).json({ error: 'Coordinator ID not found in token.' });
            }
            coordinatorDoc = await Coordinator.findOne({ coordinatorId }).lean();
        } else if (requestedCoordinatorId) {
            coordinatorDoc = await Coordinator.findOne({ coordinatorId: requestedCoordinatorId }).lean();
        }

        const requestedBranch = (req.query?.branch || '').toString().trim();
        const branchCandidates = [];

        if (requestedBranch) {
            branchCandidates.push(requestedBranch);
        }

        if (coordinatorDoc) {
            if (coordinatorDoc.branch) branchCandidates.push(coordinatorDoc.branch);
            if (coordinatorDoc.department) branchCandidates.push(coordinatorDoc.department);
        }

        const uniqueBranches = Array.from(new Set(branchCandidates.map(normalizeBranch).filter(Boolean)));
        if (!uniqueBranches.length) {
            return res.json({
                success: true,
                coordinator: coordinatorDoc
                    ? {
                        coordinatorId: coordinatorDoc.coordinatorId,
                        branch: coordinatorDoc.branch || '',
                        department: coordinatorDoc.department || ''
                    }
                    : null,
                eligibleStudents: [],
                totalEntries: 0,
                totalStudents: 0,
                message: 'No coordinator branch/department found to filter eligible students.'
            });
        }

        const eligibleEntries = await EligibleStudent.find({}).sort({ createdAt: -1 }).lean();

        const studentIdSet = new Set();
        const regNoSet = new Set();
        for (const entry of eligibleEntries) {
            for (const student of (entry.students || [])) {
                if (student?.studentId) studentIdSet.add(String(student.studentId));
                if (student?.regNo) regNoSet.add(String(student.regNo));
            }
        }

        const idCandidates = Array.from(studentIdSet)
            .filter((id) => mongoose.Types.ObjectId.isValid(id))
            .map((id) => new mongoose.Types.ObjectId(id));

        const regNoCandidates = Array.from(regNoSet).filter(Boolean);

        const studentQuery = [];
        if (idCandidates.length) studentQuery.push({ _id: { $in: idCandidates } });
        if (regNoCandidates.length) studentQuery.push({ regNo: { $in: regNoCandidates } });

        const studentDocs = studentQuery.length
            ? await Student.find({ $or: studentQuery })
                .select('_id regNo firstName lastName branch department section batch overallCGPA skillSet skills currentSkills')
                .lean()
            : [];

        const studentsById = new Map();
        const studentsByRegNo = new Map();
        for (const student of studentDocs) {
            if (student?._id) studentsById.set(String(student._id), student);
            if (student?.regNo) studentsByRegNo.set(String(student.regNo), student);
        }

        const filteredEntries = eligibleEntries
            .map((entry) => {
                const filteredStudents = (entry.students || [])
                    .map((student) => {
                        const byId = student?.studentId ? studentsById.get(String(student.studentId)) : null;
                        const byRegNo = student?.regNo ? studentsByRegNo.get(String(student.regNo)) : null;
                        const studentDoc = byId || byRegNo;

                        const resolvedBranch =
                            student?.branch ||
                            studentDoc?.branch ||
                            studentDoc?.department ||
                            '';

                        if (!branchMatches(resolvedBranch, uniqueBranches)) {
                            return null;
                        }

                        const resolvedName = (student?.name && String(student.name).trim())
                            || `${studentDoc?.firstName || ''} ${studentDoc?.lastName || ''}`.trim()
                            || 'N/A';

                        const resolvedSkills =
                            studentDoc?.skillSet ||
                            studentDoc?.skills ||
                            (Array.isArray(studentDoc?.currentSkills) ? studentDoc.currentSkills.join(', ') : studentDoc?.currentSkills) ||
                            '';

                        return {
                            ...student,
                            name: resolvedName,
                            regNo: student?.regNo || studentDoc?.regNo || '',
                            studentId: student?.studentId || (studentDoc?._id ? String(studentDoc._id) : ''),
                            branch: resolvedBranch,
                            batch: student?.batch || studentDoc?.batch || '',
                            section: studentDoc?.section || '',
                            cgpa: studentDoc?.overallCGPA || '',
                            skills: resolvedSkills,
                            status: student?.status || 'Unplaced'
                        };
                    })
                    .filter(Boolean);

                if (!filteredStudents.length) return null;

                return {
                    _id: entry._id,
                    driveId: entry.driveId,
                    companyName: entry.companyName,
                    driveStartDate: entry.driveStartDate,
                    driveEndDate: entry.driveEndDate,
                    companyDriveDate: entry.companyDriveDate,
                    jobRole: entry.jobRole,
                    filterCriteria: entry.filterCriteria || {},
                    students: filteredStudents,
                    createdAt: entry.createdAt,
                    updatedAt: entry.updatedAt
                };
            })
            .filter(Boolean);

        const totalStudents = filteredEntries.reduce((sum, entry) => sum + (entry.students?.length || 0), 0);

        return res.json({
            success: true,
            coordinator: coordinatorDoc
                ? {
                    coordinatorId: coordinatorDoc.coordinatorId,
                    branch: coordinatorDoc.branch || '',
                    department: coordinatorDoc.department || ''
                }
                : null,
            branchesApplied: uniqueBranches,
            totalEntries: filteredEntries.length,
            totalStudents,
            eligibleStudents: filteredEntries
        });
    } catch (error) {
        console.error('Coordinator eligible students fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch coordinator eligible students', details: error.message });
    }
});

app.get('/api/eligible-students', authenticateToken, checkRole('admin', 'coordinator'), async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database not connected. Cannot fetch eligible students.' });
        }

        const eligibleStudents = await EligibleStudent.find().sort({ createdAt: -1 });
        
        console.log('Eligible students fetched:', eligibleStudents.length);
        if (eligibleStudents.length > 0) {
            console.log('First eligible student:', JSON.stringify(eligibleStudents[0], null, 2));
            console.log('First eligible student driveId:', eligibleStudents[0].driveId);
        }

        res.json({ eligibleStudents });
    } catch (error) {
        console.error('Fetch all eligible students error:', error);
        res.status(500).json({ error: 'Failed to fetch eligible students', details: error.message });
    }
});

app.delete('/api/admin/companies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'Company ID is required' });
        }

        if (mongoose.connection.readyState === 1) {
            const deleted = await Company.findByIdAndDelete(id);
            if (!deleted) {
                return res.status(404).json({ error: 'Company not found' });
            }

            return res.json({
                message: 'Company deleted successfully',
                company: sanitizeCompany(deleted)
            });
        }

        const deleted = deleteCompanyInMemory(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Company not found in temporary storage' });
        }

        return res.json({
            message: 'Company deleted from temporary storage. Connect to MongoDB to persist.',
            fallback: true
        });
    } catch (error) {
        console.error('Delete company error:', error);
        return handleCompanyError(res, error);
    }
});

app.get('/api/coordinators/:coordinatorId', authenticateToken, checkRole('admin', 'coordinator'), async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { coordinatorId } = req.params;

    if (!coordinatorId) {
        return res.status(400).json({ error: 'Coordinator ID is required' });
    }

    try {
        if (isMongoConnected) {
            const coordinator = await Coordinator.findOne({ coordinatorId });

            if (!coordinator) {
                return res.status(404).json({ error: 'Coordinator not found' });
            }

            return res.json({ coordinator: sanitizeCoordinator(coordinator) });
        }

        return res.status(503).json({
            error: 'Coordinator data unavailable',
            details: 'MongoDB is not connected, so coordinator data cannot be retrieved right now.'
        });
    } catch (error) {
        console.error('Get coordinator detail error:', error);
        res.status(500).json({ error: 'Failed to fetch coordinator', details: error.message });
    }
});

app.get('/api/coordinators', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;

    try {
        if (isMongoConnected) {
            // ⚡ OPTIMIZED: Use lean() and field selection for faster queries
            const coordinators = await Coordinator.find({})
                .select('-profilePhotoData -__v') // Exclude heavy profile photo data
                .sort({ createdAt: -1 })
                .lean()
                .exec();
            
            const sanitized = coordinators.map(sanitizeCoordinator);
            return res.json({ coordinators: sanitized });
        }

        return res.status(503).json({
            error: 'Coordinator data unavailable',
            details: 'MongoDB is not connected, so coordinator data cannot be retrieved right now.'
        });
    } catch (error) {
        console.error('Fetch coordinators error:', error);
        res.status(500).json({ error: 'Failed to fetch coordinators', details: error.message });
    }
});

app.post('/api/coordinators', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const {
        firstName,
        lastName,
        dob,
        gender,
        emailId,
        domainMailId,
        phoneNumber,
        degree,
        branch,
        department,
        staffId,
        cabin,
        username,
        password,
        coordinatorId,
        profilePhotoData,
        profilePhotoName
    } = req.body || {};

    console.log('📥 Incoming coordinator payload keys:', Object.keys(req.body || {}));
    if (req.body) {
        console.log('   Sample values:', {
            firstName,
            lastName,
            gender,
            emailId,
            domainMailId,
            phoneNumber,
            department,
            staffId: staffId || null,
            username,
            passwordPresent: typeof password === 'string' && password.length > 0,
            profilePhotoDataSize: profilePhotoData ? profilePhotoData.length : 0
        });
    }

    const errors = [];
    if (!firstName) errors.push('First name is required');
    if (!lastName) errors.push('Last name is required');
    if (!gender) errors.push('Gender is required');
    if (!emailId) errors.push('Personal email is required');
    if (!domainMailId) errors.push('Domain email is required');
    if (!phoneNumber) errors.push('Phone number is required');
    if (!department) errors.push('Department is required');
    if (!username) errors.push('Username is required');
    if (!password) errors.push('Password is required');

    if (errors.length) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const coordinatorIdentifier = coordinatorId || staffId || username;

        let parsedDob = null;
        if (dob) {
            const candidate = new Date(dob);
            if (!Number.isNaN(candidate.getTime())) {
                parsedDob = candidate;
            }
        }

        const coordinatorPayload = {
            coordinatorId: coordinatorIdentifier,
            firstName,
            lastName,
            fullName: `${firstName} ${lastName}`.trim(),
            gender,
            dob: parsedDob,
            email: emailId,
            domainEmail: domainMailId,
            phone: phoneNumber,
            degree: degree || null,
            branch: branch || null,
            department,
            staffId,
            cabin,
            username,
            passwordHash: hashedPassword,
            profilePhoto: profilePhotoData || null,
            profilePhotoName: profilePhotoName || null,
            isBlocked: false
        };

        if (isMongoConnected) {
            const duplicate = await Coordinator.findOne({
                $or: [
                    { coordinatorId: coordinatorIdentifier },
                    { email: emailId },
                    { domainEmail: domainMailId },
                    { username }
                ]
            });

            if (duplicate) {
                const conflicts = [];
                if (duplicate.coordinatorId === coordinatorIdentifier) conflicts.push(`coordinatorId (${duplicate.coordinatorId})`);
                if (duplicate.email === emailId) conflicts.push(`personal email (${duplicate.email})`);
                if (duplicate.domainEmail === domainMailId) conflicts.push(`domain email (${duplicate.domainEmail})`);
                if (duplicate.username === username) conflicts.push(`username (${duplicate.username})`);

                console.warn('Duplicate coordinator found in database:', {
                    coordinatorId: duplicate.coordinatorId,
                    email: duplicate.email,
                    domainEmail: duplicate.domainEmail,
                    username: duplicate.username
                });

                return res.status(409).json({
                    error: 'Coordinator already exists',
                    details: conflicts.length
                        ? `Coordinator already exists with matching ${conflicts.join(', ')}.`
                        : 'Coordinator with the provided ID, email, domain email, or username already exists.'
                });
            }
 
            try {
                const coordinatorDoc = await Coordinator.create(coordinatorPayload);

                return res.status(201).json({
                    message: 'Coordinator created successfully',
                    coordinator: sanitizeCoordinator(coordinatorDoc)
                });
            } catch (mongoError) {
                if (mongoError.code === 11000) {
                    const duplicateField = mongoError?.keyPattern ? Object.keys(mongoError.keyPattern)[0] : undefined;
                    const duplicateValue = mongoError?.keyValue ? Object.values(mongoError.keyValue)[0] : undefined;

                    return res.status(409).json({
                        error: 'Duplicate key',
                        details: duplicateField
                            ? `Duplicate value for ${duplicateField}${duplicateValue ? ` (${duplicateValue})` : ''}.`
                            : 'Coordinator with the provided identifier already exists.'
                    });
                }

                console.error('Coordinator creation error:', mongoError);
                return res.status(500).json({ error: 'Failed to create coordinator', details: mongoError.message });
            }
        }

        return res.status(503).json({
            error: 'Coordinator creation unavailable',
            details: 'MongoDB is not connected, so new coordinators cannot be created right now.'
        });
    } catch (error) {
        console.error('Coordinator creation error:', error);
        res.status(500).json({ error: 'Failed to create coordinator', details: error.message });
    }
});

app.patch('/api/coordinators/:coordinatorId/block', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { coordinatorId } = req.params;
    const {
        isBlocked,
        blockedBy,
        blockedByRole,
        blockedByCabin,
        blockedByIdentifier,
        blockedReason,
        blockedAt
    } = req.body || {};

    try {
        if (typeof isBlocked !== 'boolean') {
            return res.status(400).json({ error: 'Invalid block status' });
        }

        if (isMongoConnected) {
            const updatePayload = { isBlocked };

            if (isBlocked) {
                updatePayload.blockedBy = blockedBy || 'Admin';
                updatePayload.blockedByRole = blockedByRole || 'admin';
                updatePayload.blockedByCabin = blockedByCabin || 'N/A';
                updatePayload.blockedByIdentifier = blockedByIdentifier || blockedBy || 'admin1000';
                updatePayload.blockedReason = blockedReason || 'Your coordinator account is blocked. Please contact the placement office.';
                updatePayload.blockedAt = blockedAt ? new Date(blockedAt) : new Date();
            } else {
                updatePayload.blockedBy = undefined;
                updatePayload.blockedByRole = undefined;
                updatePayload.blockedByCabin = undefined;
                updatePayload.blockedByIdentifier = undefined;
                updatePayload.blockedReason = undefined;
                updatePayload.blockedAt = undefined;
            }

            const coordinator = await Coordinator.findOneAndUpdate(
                { coordinatorId },
                isBlocked
                    ? { $set: updatePayload }
                    : {
                        $set: { isBlocked: false },
                        $unset: {
                            blockedBy: 1,
                            blockedByRole: 1,
                            blockedByCabin: 1,
                            blockedByIdentifier: 1,
                            blockedReason: 1,
                            blockedAt: 1
                        }
                    },
                { new: true }
            );

            if (!coordinator) {
                return res.status(404).json({ error: 'Coordinator not found' });
            }

            // CRITICAL FIX: Clear login cache when block status changes
            // This ensures the next login request gets fresh data from DB instead of cached blocked status
            const coordCacheKey = `coord:${coordinatorId}`;
            _invalidateLoginCache(coordCacheKey);
            console.log(`✅ Login cache cleared for coordinator: ${coordinatorId} (block status changed to ${isBlocked})`);

            await User.findOneAndUpdate(
                { coordinatorId },
                { isBlocked }
            );

            return res.json({
                message: 'Coordinator block status updated',
                coordinator: sanitizeCoordinator(coordinator)
            });
        }

        return res.status(503).json({
            error: 'Coordinator update unavailable',
            details: 'MongoDB is not connected, so coordinator block status cannot be updated right now.'
        });
    } catch (error) {
        console.error('Coordinator block toggle error:', error);
        res.status(500).json({ error: 'Failed to update coordinator', details: error.message });
    }
});

// Update coordinator profile
app.put('/api/coordinators/:coordinatorId', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { coordinatorId } = req.params;
    const updateData = req.body || {};

    console.log('📝 Updating coordinator profile:', coordinatorId, Object.keys(updateData));

    try {
        if (!coordinatorId) {
            return res.status(400).json({ error: 'Coordinator ID is required' });
        }

        // Fields that can be updated (excluding sensitive ones)
        const allowedFields = [
            'firstName', 'lastName', 'dob', 'gender',
            'email', 'domainEmail', 'phone', 'phoneNumber',
            'degree', 'branch', 'department', 'cabin',
            'profilePhoto', 'profilePicURL', 'profilePhotoName'
        ];

        // Build update object with only allowed fields
        const updatePayload = {};
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                updatePayload[field] = updateData[field];
            }
        }

        // Map phone to phoneNumber for consistency
        if (updateData.phone && !updatePayload.phoneNumber) {
            updatePayload.phoneNumber = updateData.phone;
        }
        if (updateData.phoneNumber && !updatePayload.phone) {
            updatePayload.phone = updateData.phoneNumber;
        }

        // Map profilePhoto to profilePicURL for consistency
        if (updateData.profilePhoto && !updatePayload.profilePicURL) {
            updatePayload.profilePicURL = updateData.profilePhoto;
        }
        if (updateData.profilePicURL && !updatePayload.profilePhoto) {
            updatePayload.profilePhoto = updateData.profilePicURL;
        }

        if (Object.keys(updatePayload).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        if (isMongoConnected) {
            const updatedCoordinator = await Coordinator.findOneAndUpdate(
                { $or: [{ coordinatorId }, { username: coordinatorId }] },
                { $set: updatePayload },
                { new: true }
            );

            if (!updatedCoordinator) {
                return res.status(404).json({ error: 'Coordinator not found' });
            }

            // Clear login cache for this coordinator since profile was updated
            const coordCacheKey = `coord:${coordinatorId}`;
            _invalidateLoginCache(coordCacheKey);
            console.log(`✅ Login cache cleared for coordinator: ${coordinatorId} (profile updated)`);

            console.log('✅ Coordinator profile updated:', updatedCoordinator.coordinatorId);

            return res.json({
                message: 'Coordinator profile updated successfully',
                coordinator: sanitizeCoordinator(updatedCoordinator)
            });
        }

        // Fallback to in-memory storage
        const coordinatorIndex = coordinators.findIndex(
            (coord) => coord.coordinatorId === coordinatorId || coord.username === coordinatorId
        );

        if (coordinatorIndex === -1) {
            return res.status(404).json({ error: 'Coordinator not found in temporary storage' });
        }

        // Update in-memory coordinator
        Object.assign(coordinators[coordinatorIndex], updatePayload);

        return res.json({
            message: 'Coordinator profile updated in temporary storage',
            coordinator: sanitizeCoordinator(coordinators[coordinatorIndex])
        });
    } catch (error) {
        console.error('Coordinator profile update error:', error);
        res.status(500).json({ error: 'Failed to update coordinator profile', details: error.message });
    }
});

app.put('/api/coordinators/:coordinatorId/credentials', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { coordinatorId } = req.params;
    let { username, password } = req.body || {};

    username = typeof username === 'string' ? username.trim() : undefined;
    password = typeof password === 'string' ? password.trim() : undefined;

    const isUsernameUpdate = typeof username === 'string' && username.length > 0;
    const isPasswordUpdate = typeof password === 'string' && password.length > 0;

    if (!isUsernameUpdate && !isPasswordUpdate) {
        return res.status(400).json({ error: 'No credential changes provided' });
    }

    if (isPasswordUpdate && password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    try {
        let hashedPassword = null;

        if (isPasswordUpdate) {
            hashedPassword = await bcrypt.hash(password, 10);
        }

        if (isMongoConnected) {
            if (isUsernameUpdate) {
                const duplicate = await Coordinator.findOne({ username, coordinatorId: { $ne: coordinatorId } });
                if (duplicate) {
                    return res.status(409).json({ error: 'Username already in use by another coordinator' });
                }
            }

            const updatePayload = {};
            if (isUsernameUpdate) updatePayload.username = username;
            if (isPasswordUpdate) updatePayload.passwordHash = hashedPassword;

            const updatedCoordinator = await Coordinator.findOneAndUpdate(
                { coordinatorId },
                { $set: updatePayload },
                { new: true }
            );

            if (!updatedCoordinator) {
                return res.status(404).json({ error: 'Coordinator not found' });
            }

            // Clear login cache for this coordinator since credentials were updated
            const coordCacheKey = `coord:${coordinatorId}`;
            _invalidateLoginCache(coordCacheKey);
            console.log(`✅ Login cache cleared for coordinator: ${coordinatorId} (credentials updated)`);

            await User.findOneAndUpdate(
                { coordinatorId },
                {
                    ...(isPasswordUpdate ? { password: hashedPassword } : {}),
                    ...(isUsernameUpdate ? { username } : {})
                }
            );

            return res.json({
                message: 'Coordinator credentials updated successfully',
                coordinator: sanitizeCoordinator(updatedCoordinator)
            });
        }

        const coordinatorIndex = coordinators.findIndex((coord) => coord.coordinatorId === coordinatorId);

        if (coordinatorIndex === -1) {
            return res.status(404).json({ error: 'Coordinator not found in temporary storage' });
        }

        if (isUsernameUpdate) {
            const duplicate = coordinators.find(
                (coord) => coord.username === username && coord.coordinatorId !== coordinatorId
            );
            if (duplicate) {
                return res.status(409).json({ error: 'Username already in use by another coordinator' });
            }
            coordinators[coordinatorIndex].username = username;
        }

        if (isPasswordUpdate) {
            coordinators[coordinatorIndex].passwordHash = hashedPassword;
            delete coordinators[coordinatorIndex].password;
        }

        return res.json({
            message: 'Coordinator credentials updated in temporary storage',
            coordinator: sanitizeCoordinator(coordinators[coordinatorIndex])
        });
    } catch (error) {
        console.error('Coordinator credential update error:', error);
        res.status(500).json({ error: 'Failed to update coordinator credentials', details: error.message });
    }
});

app.delete('/api/coordinators/:coordinatorId', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { coordinatorId } = req.params;

    try {
        if (!coordinatorId) {
            return res.status(400).json({ error: 'Coordinator ID is required' });
        }

        if (isMongoConnected) {
            const deleted = await Coordinator.findOneAndDelete({ coordinatorId });

            if (!deleted) {
                return res.status(404).json({ error: 'Coordinator not found' });
            }

            return res.json({
                message: 'Coordinator deleted successfully',
                coordinator: sanitizeCoordinator(deleted)
            });
        }

        return res.status(503).json({
            error: 'Coordinator deletion unavailable',
            details: 'MongoDB is not connected, so coordinators cannot be deleted right now.'
        });
    } catch (error) {
        console.error('Coordinator deletion error:', error);
        res.status(500).json({ error: 'Failed to delete coordinator', details: error.message });
    }
});

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
    isBlocked: { type: Boolean, default: false },
    blockedBy: { type: String }, // Name of the admin/coordinator who blocked
    blockedByRole: { type: String }, // 'admin' or 'coordinator'
    blockedReason: { type: String },
    blockedAt: { type: Date },
    // Add all other fields from your original schema here...
}, { strict: false });

// PERFORMANCE INDEXES: Essential for 1000+ students
// These indexes make queries 10-100x faster as data scales
// Note: regNo already has an index via unique:true constraint
studentSchema.index({ department: 1 }); // Fast filtering by department
studentSchema.index({ batch: 1 }); // Fast filtering by batch
studentSchema.index({ regNo: 1, department: 1 }); // Compound index for combined queries
studentSchema.index({ firstName: 1, lastName: 1 }); // Fast name searches

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
    fileData: { type: String }, // Legacy Base64 (empty for GridFS uploads)
    gridfsFileId: { type: String }, // GridFS file ID
    gridfsFileUrl: { type: String }, // GridFS URL e.g. /api/file/<id>
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
    analysisResult: { type: Object } // Store analysis results
}, { strict: false });

const Resume = mongoose.model('Resume', resumeSchema, 'resume');

const coordinatorSchema = new mongoose.Schema({
    coordinatorId: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fullName: { type: String },
    gender: { type: String },
    dob: { type: Date },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    domainEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true },
    degree: { type: String },
    branch: { type: String },
    department: { type: String, required: true },
    staffId: { type: String },
    cabin: { type: String },
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    profilePhoto: { type: String },
    profilePhotoName: { type: String },
    isBlocked: { type: Boolean, default: false }
}, { timestamps: true, strict: false });

// ⚡ Add indexes for faster coordinator queries
coordinatorSchema.index({ department: 1 });
coordinatorSchema.index({ isBlocked: 1 });
coordinatorSchema.index({ createdAt: -1 });

const Coordinator = mongoose.model('Coordinator', coordinatorSchema, 'coordinators');

const companySchema = new mongoose.Schema({
    companyName: { type: String, required: true, trim: true },
    domain: { type: String, trim: true },
    jobRole: { type: String, trim: true },
    mode: { type: String, trim: true },
    hrName: { type: String, trim: true },
    hrContact: { type: String, trim: true },
    bondPeriod: { type: String, trim: true },
    round: { type: Number, min: 0 },
    status: { type: String, trim: true },
    visitDate: { type: String }, // Store as simple YYYY-MM-DD string
    package: { type: String, trim: true },
    location: { type: String, trim: true },
    notes: { type: String, trim: true }
}, { timestamps: true, strict: false });

const Company = mongoose.model('Company', companySchema, 'companies');

const companyDriveSchema = new mongoose.Schema({
    companyName: { type: String, required: true },
    jobRole: { type: String, required: true },
    rounds: { type: Number, required: true },
    mode: { type: String },
    department: { type: String },
    eligibleBranches: [{ type: String }],
    cgpa: { type: String },
    startingDate: { type: String }, // Store as simple YYYY-MM-DD string
    endingDate: { type: String }, // Store as simple YYYY-MM-DD string
    visitDate: { type: String }, // Store as simple YYYY-MM-DD string
    lastDateToApply: { type: String }, // Store as simple YYYY-MM-DD string
    branch: { type: String },
    domain: { type: String },
    hrName: { type: String },
    hrContact: { type: String },
    status: { type: String },
    package: { type: String },
    location: { type: String },
    bondPeriod: { type: String },
    roundDetails: [{ type: String }], // For dynamic round details
    companyId: { type: String }
}, { timestamps: true, strict: false });

const CompanyDrive = mongoose.model('CompanyDrive', companyDriveSchema, 'companies drives');

// Eligible Students Schema - stores eligible students for a company drive
const eligibleStudentSchema = new mongoose.Schema({
    driveId: { type: String, required: true, index: true }, // Unique drive identifier
    companyName: { type: String, required: true },
    driveStartDate: { type: String, required: true },
    driveEndDate: { type: String },
    companyDriveDate: { type: String }, // Keep for backward compatibility
    jobRole: { type: String },
    filterCriteria: { type: Object },
    students: [{
        studentId: { type: String, required: true },
        regNo: { type: String, required: true },
        name: { type: String, required: true },
        branch: { type: String, required: true },
        batch: { type: String, required: true }
    }],
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true, strict: false });

const EligibleStudent = mongoose.model('EligibleStudent', eligibleStudentSchema, 'eligible students');

// Student Application Schema - tracks which students are invited to which drives
const studentApplicationSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    regNo: { type: String, required: true },
    companyName: { type: String, required: true },
    jobRole: { type: String, required: true },
    driveId: { type: String },
    status: { type: String, enum: ['Pending', 'Placed', 'Rejected', 'Absent'], default: 'Pending' },
    rounds: [{ 
        roundNumber: { type: Number },
        name: { type: String },
        roundName: { type: String },
        status: { type: String, enum: ['Pending', 'Passed', 'Failed', 'Absent'], default: 'Pending' },
        date: { type: Date }
    }],
    appliedDate: { type: Date, default: Date.now },
    nasaDate: { type: String }, // The NASA date from eligible students page
    filterCriteria: { type: Object } // Store the filter criteria that selected this student
}, { timestamps: true, strict: false });

// Indexes for fast queries
studentApplicationSchema.index({ studentId: 1, companyName: 1 });
studentApplicationSchema.index({ status: 1 });
studentApplicationSchema.index({ appliedDate: -1 });

const StudentApplication = mongoose.model('StudentApplication', studentApplicationSchema, 'student_applications');

const branchSchema = new mongoose.Schema({
    degreeFullName: { type: String, required: true, trim: true },
    degreeAbbreviation: { type: String, required: true, trim: true, uppercase: true },
    branchFullName: { type: String, required: true, trim: true },
    branchAbbreviation: { type: String, required: true, trim: true, uppercase: true },
    establishedDate: { type: Date },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Branch = mongoose.model('Branch', branchSchema, 'branches');

const degreeSchema = new mongoose.Schema({
    degreeFullName: { type: String, required: true, trim: true },
    degreeAbbreviation: { type: String, required: true, trim: true, uppercase: true },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Degree = mongoose.model('Degree', degreeSchema, 'degrees');

const trainingSchema = new mongoose.Schema({
    companyName: { type: String, required: true, trim: true },
    companyHR: { type: String, trim: true },
    location: { type: String, trim: true },
    courses: [{
        name: { type: String, required: true, trim: true },
        syllabus: [{ type: String, trim: true }],
        durationStart: { type: String, trim: true },
        durationEnd: { type: String, trim: true }
    }],
    trainers: [{
        name: { type: String, required: true, trim: true },
        mobile: { type: String, trim: true },
        email: { type: String, trim: true },
        gender: { type: String, trim: true }
    }]
}, { timestamps: true });

const TRAINING_COLLECTION = 'training_companies';
const Training = mongoose.model('Training', trainingSchema, TRAINING_COLLECTION);

const scheduledTrainingSchema = new mongoose.Schema({
    companyName: { type: String, required: true, trim: true },
    startDate: { type: String, required: true, trim: true },
    endDate: { type: String, required: true, trim: true },
    phases: [{
        phaseNumber: { type: String, required: true, trim: true },
        trainer: { type: String, trim: true },
        applicableYear: { type: String, trim: true },
        startDate: { type: String, trim: true },
        endDate: { type: String, trim: true },
        duration: { type: String, trim: true },
        applicableCourses: [{ type: String, trim: true }]
    }],
    batches: [{
        batchName: { type: String, trim: true },
        applicableYear: { type: String, trim: true, uppercase: true }
    }]
}, { timestamps: true });

const ScheduledTraining = mongoose.model('ScheduledTraining', scheduledTrainingSchema, 'trainning_schedule');

const trainingBatchAssignmentSchema = new mongoose.Schema({
    scheduleId: { type: String, trim: true },
    companyName: { type: String, required: true, trim: true },
    courseName: { type: String, required: true, trim: true },
    trainer: { type: String, trim: true },
    applicableYear: { type: String, trim: true, uppercase: true },
    startDate: { type: String, trim: true },
    endDate: { type: String, trim: true },
    batchNumber: { type: Number, min: 1 },
    batchName: { type: String, required: true, trim: true },
    phases: [{
        phaseNumber: { type: String, trim: true },
        trainer: { type: String, trim: true },
        applicableYear: { type: String, trim: true },
        startDate: { type: String, trim: true },
        endDate: { type: String, trim: true },
        duration: { type: String, trim: true }
    }],
    students: [{
        studentId: { type: String, trim: true },
        regNo: { type: String, required: true, trim: true },
        name: { type: String, trim: true },
        dept: { type: String, trim: true },
        year: { type: String, trim: true },
        section: { type: String, trim: true },
        mobile: { type: String, trim: true },
        cgpa: { type: String, trim: true }
    }]
}, { timestamps: true });

trainingBatchAssignmentSchema.index({ scheduleId: 1, courseName: 1, batchName: 1 });
trainingBatchAssignmentSchema.index({ companyName: 1, courseName: 1, batchName: 1, applicableYear: 1 });
trainingBatchAssignmentSchema.index({ 'students.regNo': 1 });

const TrainingBatchAssignment = mongoose.model('TrainingBatchAssignment', trainingBatchAssignmentSchema, 'training_batch_assignments');

const trainingAttendanceSchema = new mongoose.Schema({
    scheduleId: { type: String, trim: true },
    companyName: { type: String, required: true, trim: true },
    courseName: { type: String, required: true, trim: true },
    batchNumber: { type: Number, required: true, min: 1 },
    batchName: { type: String, required: true, trim: true },
    phaseNumber: { type: String, trim: true },
    attendanceDateKey: { type: String, required: true, trim: true },
    attendanceDate: { type: Date, required: true },

    totalStudents: { type: Number, required: true, default: 0 },
    totalPresent: { type: Number, required: true, default: 0 },
    totalAbsent: { type: Number, required: true, default: 0 },
    percentage: { type: Number, required: true, default: 0 },

    students: [{
        studentId: { type: String, required: true, trim: true },
        name: { type: String, required: true, trim: true },
        regNo: { type: String, required: true, trim: true },
        dept: { type: String, trim: true },
        year: { type: String, trim: true },
        section: { type: String, trim: true },
        mobile: { type: String, trim: true },
        status: { type: String, required: true, enum: ['Present', 'Absent', '-'] }
    }],

    submittedBy: { type: String, trim: true, default: 'Admin' }
}, { timestamps: true });

trainingAttendanceSchema.index({ companyName: 1, courseName: 1, batchName: 1, phaseNumber: 1, attendanceDateKey: 1 }, { unique: true });
trainingAttendanceSchema.index({ scheduleId: 1, companyName: 1, courseName: 1, batchName: 1 });

const TrainingAttendance = mongoose.model('TrainingAttendance', trainingAttendanceSchema, 'training_attendance');

// Attendance Schema
const attendanceSchema = new mongoose.Schema({
    // Unique Drive Identifier
    driveId: { type: String, required: true, index: true },
    // Company Drive Info
    companyName: { type: String, required: true },
    jobRole: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    
    // Overall Statistics
    totalStudents: { type: Number, required: true },
    totalPresent: { type: Number, required: true },
    totalAbsent: { type: Number, required: true },
    percentage: { type: Number, required: true },
    
    // Student Details
    students: [{
        studentId: { type: String, required: true },
        name: { type: String, required: true },
        regNo: { type: String, required: true },
        branch: { type: String, required: true },
        batch: { type: String, required: true },
        yearSec: { type: String, required: true },
        semester: { type: String, required: true },
        phoneNo: { type: String, required: true },
        status: { type: String, required: true, enum: ['Present', 'Absent', '-'] }
    }],
    
    // Metadata
    submittedAt: { type: Date, default: Date.now },
    submittedBy: { type: String, default: 'Admin' }
}, { timestamps: true });

// Index for faster queries (driveId already has index:true in schema)
attendanceSchema.index({ companyName: 1, jobRole: 1, startDate: 1 });
attendanceSchema.index({ 'students.studentId': 1 });
attendanceSchema.index({ 'students.regNo': 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema, 'attendance');

// Archived Batch Schema - stores zipped/archived batches
const archivedBatchSchema = new mongoose.Schema({
    archiveName: { type: String, required: true, unique: true },
    batch: { type: String, required: true }, // e.g., "2021 - 2025"
    departments: [{
        name: { type: String, required: true },
        sections: { type: Number, default: 1 },
        totalStudents: { type: Number, default: 0 },
        placedStudents: { type: Number, default: 0 }
    }],
    totalDept: { type: Number, default: 0 },
    totalStudents: { type: Number, default: 0 },
    placedStudents: { type: Number, default: 0 },
    archivedStudents: [{ type: mongoose.Schema.Types.Mixed }], // Store the actual student data
    archivedBy: { type: String, required: true }, // Admin who archived
    archivedAt: { type: Date, default: Date.now }
}, { timestamps: true, strict: false });

archivedBatchSchema.index({ batch: 1 });
archivedBatchSchema.index({ archivedAt: -1 });

const ArchivedBatch = mongoose.model('ArchivedBatch', archivedBatchSchema, 'archived_batches');

// Zipping History Schema - logs all archive operations
const zippingHistorySchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    action: { type: String, required: true, enum: ['Zipped Batch', 'Unzipped Batch', 'Deleted Batch'] },
    batch: { type: String, required: true }, // Archive name
    batchYear: { type: String }, // e.g., "2021 - 2025"
    implementedBy: { type: String, required: true }, // Admin name
    details: { type: String, required: true }, // e.g., "Zipped 894 Students"
    affectedStudents: { type: Number, default: 0 },
    affectedDepartments: { type: Number, default: 0 }
}, { timestamps: true });

zippingHistorySchema.index({ date: -1 });
zippingHistorySchema.index({ action: 1 });
zippingHistorySchema.index({ batch: 1 });

const ZippingHistory = mongoose.model('ZippingHistory', zippingHistorySchema, 'zipping_history');

let branchIndexCleanupDone = false;
let trainingCollectionMigrationDone = false;

const migrateTrainingCollection = async () => {
    if (trainingCollectionMigrationDone) {
        return;
    }

    if (!mongoose.connection?.readyState || mongoose.connection.readyState !== 1) {
        return;
    }

    try {
        const db = mongoose.connection.db;
        const targetCollection = db.collection(TRAINING_COLLECTION);
        const sourceCollections = ['trainning', 'training', 'training_compnaies'];
        let totalMigrated = 0;

        for (const sourceName of sourceCollections) {
            if (sourceName === TRAINING_COLLECTION) {
                continue;
            }

            const sourceExists = await db.listCollections({ name: sourceName }, { nameOnly: true }).toArray();
            if (!sourceExists.length) {
                continue;
            }

            const docs = await db.collection(sourceName).find({}).toArray();
            if (!docs.length) {
                continue;
            }

            const operations = docs.map((doc) => ({
                updateOne: {
                    filter: { _id: doc._id },
                    update: { $set: doc },
                    upsert: true
                }
            }));

            const result = await targetCollection.bulkWrite(operations, { ordered: false });
            totalMigrated += (result.upsertedCount || 0) + (result.modifiedCount || 0);
        }

        trainingCollectionMigrationDone = true;
        console.log(`✅ Training collection ready: ${TRAINING_COLLECTION} (migrated ${totalMigrated} docs from legacy collections if present)`);
    } catch (error) {
        console.error('⚠️ Training collection migration skipped:', error.message);
    }
};

const ensureBranchIndexes = async () => {
    if (branchIndexCleanupDone) {
        return;
    }

    if (!mongoose.connection?.readyState || mongoose.connection.readyState !== 1) {
        return;
    }

    try {
        const indexes = await Branch.collection.indexes();
        const legacyIndex = indexes.find((index) => index?.key?.branchCode === 1);
        const credentialIndexes = indexes.filter((index) => index?.key?.adminLoginId === 1 || index?.key?.adminPassword === 1);

        if (legacyIndex) {
            await Branch.collection.dropIndex(legacyIndex.name || 'branchCode_1');
            console.log('🧹 Removed legacy branchCode index from branches collection');
        }

        for (const index of credentialIndexes) {
            try {
                await Branch.collection.dropIndex(index.name || 'adminLoginId_1');
                console.log(`🧹 Removed legacy admin credential index (${index.name || 'adminLoginId_1'}) from branches collection`);
            } catch (credentialError) {
                if (credentialError?.codeName !== 'IndexNotFound') {
                    console.warn('⚠️ Failed to drop admin credential index:', credentialError.message || credentialError);
                }
            }
        }

        branchIndexCleanupDone = true;
    } catch (error) {
        if (error?.codeName === 'IndexNotFound' || /not found/i.test(error?.message || '')) {
            branchIndexCleanupDone = true;
        } else {
            console.error('⚠️ Failed to clean up branch indexes:', error.message);
        }
    }
};

mongoose.connection.once('open', ensureBranchIndexes);

const sanitizeCoordinator = (coordinatorDoc) => {
    if (!coordinatorDoc) return null;
    const plain = coordinatorDoc.toObject ? coordinatorDoc.toObject() : { ...coordinatorDoc };
    delete plain.passwordHash;
    delete plain.password;
    return plain;
};

const sanitizeCompany = (companyDoc) => {
    if (!companyDoc) return null;

    const plain = companyDoc.toObject ? companyDoc.toObject() : { ...companyDoc };
    const visitDate = plain.visitDate ? new Date(plain.visitDate) : null;

    const roundValue = typeof plain.round === 'number'
        ? plain.round
        : plain.round !== undefined && plain.round !== null && plain.round !== ''
            ? Number(plain.round)
            : '';

    const sanitized = {
        id: plain._id ? plain._id.toString() : (plain.id ? String(plain.id) : undefined),
        _id: plain._id ? plain._id.toString() : (plain.id ? String(plain.id) : undefined),
        companyName: plain.companyName || plain.company || '',
        domain: plain.domain || '',
        jobRole: plain.jobRole || '',
        mode: plain.mode || '',
        hrName: plain.hrName || '',
        hrContact: plain.hrContact || '',
        bondPeriod: plain.bondPeriod || '',
        round: Number.isNaN(roundValue) ? '' : roundValue,
        status: plain.status || '',
        visitDate: visitDate && !Number.isNaN(visitDate.getTime())
            ? visitDate.toISOString().split('T')[0]
            : (plain.visitDate && typeof plain.visitDate === 'string' && plain.visitDate.includes('-')
                ? plain.visitDate
                : ''),
        package: plain.package || plain.packageOffer || '',
        location: plain.location || '',
        notes: plain.notes || '',
        createdAt: plain.createdAt || null,
        updatedAt: plain.updatedAt || null
    };

    return sanitized;
};

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : value);

const parseCompanyPayload = (body = {}) => {
    const {
        companyName,
        domain = '',
        jobRole = '',
        mode = '',
        hrName = '',
        hrContact = '',
        bondPeriod = '',
        round,
        status = '',
        visitDate,
        package: packageOffer = '',
        location = '',
        notes = ''
    } = body;

    if (!companyName || !companyName.trim()) {
        const error = new Error('Company name is required');
        error.statusCode = 400;
        throw error;
    }

    let roundValue = null;
    if (round !== undefined && round !== null && round !== '') {
        const numericRound = Number(round);
        if (Number.isNaN(numericRound)) {
            const error = new Error('Round must be a number');
            error.statusCode = 400;
            throw error;
        }
        roundValue = numericRound;
    }

    let visitDateValue = null;
    if (visitDate !== undefined && visitDate !== null && visitDate !== '') {
        const candidate = new Date(visitDate);
        if (Number.isNaN(candidate.getTime())) {
            const error = new Error('Invalid visit date');
            error.statusCode = 400;
            throw error;
        }
        visitDateValue = candidate;
    }

    return {
        companyName: normalizeString(companyName),
        domain: normalizeString(domain) || '',
        jobRole: normalizeString(jobRole) || '',
        mode: normalizeString(mode) || '',
        hrName: normalizeString(hrName) || '',
        hrContact: normalizeString(hrContact) || '',
        bondPeriod: normalizeString(bondPeriod) || '',
        round: roundValue,
        status: normalizeString(status) || '',
        visitDate: visitDateValue,
        package: normalizeString(packageOffer) || '',
        location: normalizeString(location) || '',
        notes: normalizeString(notes) || ''
    };
};

// In-memory storage fallback (only used when MongoDB Atlas is not available)
let students = [];
let users = [];
let resumeAnalyses = [];
let resumes = [];
let certificates = [];
let coordinators = [];
let companyRecords = [];

const IN_MEMORY_FALLBACK_ENABLED = process.env.ENABLE_IN_MEMORY_FALLBACK === 'true';

// Database initialization flag (for serverless lazy initialization)
let dbInitialized = false;

// Warm up database indexes for instant login
const warmupLoginIndexes = async () => {
    try {
        // Warm up admin index
        const Admin = require('./models/Admin');
        await Admin.findOne({ adminLoginID: 'admin1000' })
            .select('adminLoginID')
            .lean()
            .maxTimeMS(2000)
            .catch(() => null);
        console.log('✅ Admin login index warmed up');
        
        // Warm up coordinator indexes
        await Coordinator.findOne({})
            .select('coordinatorId username')
            .lean()
            .maxTimeMS(2000)
            .catch(() => null);
        console.log('✅ Coordinator login index warmed up');
        
        // Warm up student indexes
        await Student.findOne({})
            .select('regNo dob')
            .lean()
            .maxTimeMS(2000)
            .catch(() => null);
        console.log('✅ Student login index warmed up');
    } catch (error) {
        console.log('⚠️ Index warmup skipped:', error.message);
    }
};

// Start server function
const startServer = async () => {
    try {
        const isMongoConnected = await ensureConnection();
        console.log(`Database: ${isMongoConnected ? 'MongoDB Atlas' : 'In-Memory Storage'}`);
        
        // Warm up login indexes for faster first login (admin, coordinator, student)
        if (isMongoConnected) {
            await migrateTrainingCollection();
            setTimeout(() => warmupLoginIndexes(), 2000); // Run after 2s delay
        }
        
        return isMongoConnected;
    } catch (error) {
        console.error('Database initialization error:', error.message);
        return false;
    }
};

// Request logging middleware - Log all incoming requests
app.use((req, res, next) => {
    if (req.method !== 'OPTIONS') {
        // Avoid noisy per-file stream logs; these can flood console during image rendering.
        const isGridFsFileStream = req.method === 'GET' && req.path.startsWith('/api/file/');
        if (!isGridFsFileStream) {
            console.log(`\n🌐 ${req.method} ${req.path}`);
        }
        if (req.body && Object.keys(req.body).length > 0) {
            // Log body but hide sensitive fields
            const sanitized = { ...req.body };
            if (sanitized.password) sanitized.password = '***';
            if (sanitized.dob) sanitized.dob = '***';
            console.log('📦 Body:', sanitized);
        }
    }
    next();
});

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

// Branch Endpoints
// NEW: Optimized Branch Summary with Server-Side Aggregation
app.get('/api/admin/branches-summary', async (req, res) => {
    console.log('📊 Branch Summary Request received');
    
    try {
        const mongoReady = mongoose.connection.readyState === 1 || await ensureConnection();

        if (!mongoReady) {
            console.log('⚠️ MongoDB not connected for branch summary');
            return res.status(503).json({
                error: 'Branch summary unavailable',
                details: 'MongoDB is not connected'
            });
        }

        console.log('✅ MongoDB connected, running aggregation...');

        // Server-side aggregation to count coordinators per branch (excluding blocked coordinators)
        const summary = await Branch.aggregate([
            { $match: { isActive: { $ne: false } } },
            {
                $lookup: {
                    from: 'coordinators',
                    let: { branchCode: '$branchAbbreviation' },
                    pipeline: [
                        { 
                            $match: { 
                                $expr: { 
                                    $and: [
                                        { $eq: ['$department', '$$branchCode'] },
                                        { $ne: ['$isBlocked', true] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'branchCoordinators'
                }
            },
            {
                $project: {
                    degreeFullName: 1,
                    degreeAbbreviation: 1,
                    branchFullName: 1,
                    branchAbbreviation: 1,
                    isActive: 1,
                    coordinatorCount: { $size: '$branchCoordinators' }
                }
            },
            { $sort: { branchFullName: 1 } }
        ]);

        const totalCoordinators = await Coordinator.countDocuments({ isBlocked: { $ne: true } });
        
        console.log(`✅ Branch summary complete: ${summary.length} branches, ${totalCoordinators} total coordinators`);

        res.json({ 
            branches: summary.map(branch => ({
                id: branch._id?.toString?.() || branch._id,
                _id: branch._id?.toString?.() || branch._id,
                degreeFullName: branch.degreeFullName,
                degreeAbbreviation: branch.degreeAbbreviation,
                branchFullName: branch.branchFullName,
                branchAbbreviation: branch.branchAbbreviation,
                isActive: branch.isActive,
                coordinatorCount: branch.coordinatorCount
            })),
            totalCoordinators 
        });
    } catch (error) {
        console.error('❌ Fetch branches summary error:', error);
        res.status(500).json({ error: 'Failed to fetch branch summary', details: error.message });
    }
});

app.get('/api/branches', async (req, res) => {
    try {
        const mongoReady = mongoose.connection.readyState === 1 || await ensureConnection();

        if (!mongoReady) {
            return res.status(503).json({
                error: 'Branch data unavailable',
                details: 'MongoDB is not connected, so branch data cannot be retrieved right now.'
            });
        }

        // ⚡ OPTIMIZED: Use lean() for 50% faster queries
        const branches = await Branch.find({ isActive: { $ne: false } })
            .select('degreeFullName degreeAbbreviation branchFullName branchAbbreviation isActive')
            .sort({ branchFullName: 1 })
            .lean()
            .exec();
        
        return res.json({
            branches: branches.map(branch => ({
                id: branch._id?.toString?.() || branch._id,
                degreeFullName: branch.degreeFullName,
                degreeAbbreviation: branch.degreeAbbreviation,
                branchFullName: branch.branchFullName,
                branchAbbreviation: branch.branchAbbreviation,
                isActive: branch.isActive,
            }))
        });
    } catch (error) {
        console.error('Fetch branches error:', error);
        res.status(500).json({ error: 'Failed to fetch branches', details: error.message });
    }
});

app.get('/api/degrees', async (req, res) => {
    try {
        const mongoReady = mongoose.connection.readyState === 1 || await ensureConnection();

        if (!mongoReady) {
            return res.status(503).json({
                error: 'Degree data unavailable',
                details: 'MongoDB is not connected, so degree data cannot be retrieved right now.'
            });
        }

        const degrees = await Degree.find({}).sort({ degreeFullName: 1 });
        return res.json({
            degrees: degrees
                .filter(degree => degree?.isActive !== false)
                .map(degree => ({
                    id: degree._id?.toString?.() || degree._id,
                    degreeFullName: degree.degreeFullName,
                    degreeAbbreviation: degree.degreeAbbreviation,
                    isActive: degree.isActive
                }))
        });
    } catch (error) {
        console.error('Fetch degrees error:', error);
        res.status(500).json({ error: 'Failed to fetch degrees', details: error.message });
    }
});

app.post('/api/branches', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const {
        degreeFullName,
        degreeAbbreviation,
        branchFullName,
        branchAbbreviation,
        establishedDate
    } = req.body;

    try {
        if (!degreeFullName || !degreeAbbreviation || !branchFullName || !branchAbbreviation) {
            return res.status(400).json({ error: 'Missing required branch fields' });
        }

        if (isMongoConnected) {
            await ensureBranchIndexes();

            const existingBranch = await Branch.findOne({
                $or: [{ branchFullName }, { branchAbbreviation }]
            });

            if (existingBranch) {
                const conflicts = [];
                if (existingBranch.branchFullName === branchFullName) conflicts.push('branchFullName');
                if (existingBranch.branchAbbreviation === branchAbbreviation) conflicts.push('branchAbbreviation');

                return res.status(409).json({
                    error: 'Branch already exists',
                    details: `Branch already exists with matching ${conflicts.join(', ')}.`
                });
            }

            const branchPayload = {
                degreeFullName,
                degreeAbbreviation,
                branchFullName,
                branchAbbreviation,
                establishedDate: establishedDate ? new Date(establishedDate) : undefined,
            };

            let branchDoc;
            try {
                branchDoc = await Branch.create(branchPayload);
                if (branchDoc && (branchDoc.adminLoginId || branchDoc.adminPassword)) {
                    branchDoc.adminLoginId = undefined;
                    branchDoc.adminPassword = undefined;
                    await Branch.updateOne({ _id: branchDoc._id }, { $unset: { adminLoginId: 1, adminPassword: 1 } });
                }
            } catch (error) {
                const duplicateBranchCode =
                    error?.code === 11000 &&
                    (error?.keyPattern?.branchCode === 1 || /branchCode/i.test(error?.message || ''));

                if (duplicateBranchCode) {
                    console.warn('⚠️ Legacy branchCode index detected during branch creation. Dropping index and retrying...');
                    branchIndexCleanupDone = false;
                    await ensureBranchIndexes();

                    branchDoc = await Branch.create(branchPayload);
                    if (branchDoc && (branchDoc.adminLoginId || branchDoc.adminPassword)) {
                        branchDoc.adminLoginId = undefined;
                        branchDoc.adminPassword = undefined;
                        await Branch.updateOne({ _id: branchDoc._id }, { $unset: { adminLoginId: 1, adminPassword: 1 } });
                    }
                } else {
                    throw error;
                }
            }

            return res.status(201).json({
                message: 'Branch created successfully',
                branch: branchDoc
            });
        }

        return res.status(503).json({
            error: 'Branch creation unavailable',
            details: 'MongoDB is not connected, so new branches cannot be created right now.'
        });
    } catch (error) {
        console.error('Branch creation error:', error);
        res.status(500).json({ error: 'Failed to create branch', details: error.message });
    }
});

// Delete branch by branchFullName or branchAbbreviation
app.delete('/api/branches/:branchCode', async (req, res) => {
    try {
        const mongoReady = mongoose.connection.readyState === 1 || await ensureConnection();

        if (!mongoReady) {
            return res.status(503).json({
                error: 'Branch deletion unavailable',
                details: 'MongoDB is not connected.'
            });
        }

        const branchCode = decodeURIComponent(req.params.branchCode);

        if (!branchCode) {
            return res.status(400).json({ error: 'Branch code is required' });
        }

        // Find branch by either full name or abbreviation
        const branch = await Branch.findOne({
            $or: [
                { branchFullName: branchCode },
                { branchAbbreviation: branchCode }
            ]
        });

        if (!branch) {
            return res.status(404).json({ 
                error: 'Branch not found',
                details: `No branch found with code: ${branchCode}`
            });
        }

        // Delete the branch
        await Branch.deleteOne({ _id: branch._id });

        return res.json({
            message: 'Branch deleted successfully',
            deletedBranch: {
                branchFullName: branch.branchFullName,
                branchAbbreviation: branch.branchAbbreviation
            }
        });
    } catch (error) {
        console.error('Branch deletion error:', error);
        res.status(500).json({ 
            error: 'Failed to delete branch', 
            details: error.message 
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

// Coordinator login endpoint - OPTIMIZED FOR SPEED ⚡
app.post('/api/auth/coordinator-login', async (req, res) => {
    const { coordinatorId, password } = req.body || {};

    const trimmedId = typeof coordinatorId === 'string' ? coordinatorId.trim() : '';
    const trimmedPassword = typeof password === 'string' ? password.trim() : '';

    if (!trimmedId) {
        return res.status(400).json({ error: 'Coordinator ID is required.' });
    }

    if (!trimmedPassword) {
        return res.status(400).json({ error: 'Password is required.' });
    }

    const identifier = trimmedId;
    const connectionState = mongoose.connection.readyState;
    const isMongoConnected = connectionState === 1;

    console.log('👤 Coordinator login attempt:', {
        identifier,
        mongoState: connectionState,
        source: isMongoConnected ? 'mongo' : 'in-memory'
    });

    let coordinatorDoc = null;
    const startTime = Date.now();

    // Check login cache first
    const coordCacheKey = `coord:${identifier}`;
    coordinatorDoc = getLoginCache(coordCacheKey);
    
    if (coordinatorDoc) {
        console.log(`⚡ Coordinator doc served from cache (${Date.now() - startTime}ms)`);
    } else if (isMongoConnected) {
        try {
            const coordinatorQuery = {
                $or: [
                    { coordinatorId: identifier },
                    { username: identifier },
                    { email: identifier },
                    { domainEmail: identifier }
                ]
            };

            // OPTIMIZATION 1: Only select needed fields (reduces data transfer)
            const essentialFields = 'coordinatorId firstName lastName fullName gender email domainEmail phone department staffId cabin username passwordHash password profilePhoto isBlocked';
            
            // OPTIMIZATION 2: Multiple retry strategy — final attempt has NO maxTimeMS so Atlas cold-start can complete
            const queryWithTimeout = async (timeoutMs, useServerTimeout = true) => {
                let findPromise = Coordinator.findOne(coordinatorQuery)
                    .select(essentialFields)
                    .lean();
                if (useServerTimeout) findPromise = findPromise.maxTimeMS(timeoutMs);
                
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`Query timeout (${timeoutMs}ms)`)), timeoutMs + 1000)
                );

                return Promise.race([findPromise, timeoutPromise]);
            };

            // Fast (10s) → Medium (20s) → Final (45s, no MongoDB server timeout)
            try {
                coordinatorDoc = await queryWithTimeout(10000);
                console.log(`⚡ Coordinator found in ${Date.now() - startTime}ms (fast path)`);
            } catch (fastError) {
                console.log(`⏱️ Fast query failed (${fastError.message}), trying medium timeout...`);
                
                try {
                    coordinatorDoc = await queryWithTimeout(20000);
                    console.log(`✅ Coordinator found in ${Date.now() - startTime}ms (medium path)`);
                } catch (mediumError) {
                    console.log(`⏱️ Medium query failed (${mediumError.message}), trying final attempt (no server timeout)...`);
                    
                    // Final attempt: 45s JS timeout, NO maxTimeMS — lets Atlas wake up fully
                    coordinatorDoc = await queryWithTimeout(45000, false);
                    console.log(`✅ Coordinator found in ${Date.now() - startTime}ms (slow/cold-start path)`);
                }
            }
            
            if (coordinatorDoc) {
                // Cache for next time (30 min TTL)
                setLoginCache(coordCacheKey, coordinatorDoc);
            }
        } catch (mongoError) {
            console.error(`❌ Coordinator login MongoDB query failed after ${Date.now() - startTime}ms:`, mongoError.message);
            return res.status(500).json({ 
                error: 'Database query timeout. Please try again.',
                details: 'The database is responding slowly. Please wait a moment and retry.'
            });
        }
    }

    if (!coordinatorDoc && Array.isArray(coordinators) && coordinators.length) {
        coordinatorDoc = coordinators.find((coord) => (
            coord.coordinatorId === identifier ||
            coord.username === identifier ||
            coord.email === identifier ||
            coord.domainEmail === identifier
        ));
    }

    if (!coordinatorDoc) {
        console.warn('Coordinator not found:', identifier);
        return res.status(404).json({ error: 'Coordinator not found.' });
    }

    console.log('🔎 Coordinator doc found:', {
        coordinatorId: coordinatorDoc.coordinatorId,
        username: coordinatorDoc.username,
        hasPasswordHash: !!coordinatorDoc.passwordHash,
        hasPlainPassword: !!coordinatorDoc.password,
        passwordHashPreview: coordinatorDoc.passwordHash ? `${coordinatorDoc.passwordHash.substring(0,6)}...` : null
    });

    const passwordHash = coordinatorDoc.passwordHash || coordinatorDoc.passwordhash || coordinatorDoc.password;
    let passwordMatches = false;

    if (passwordHash) {
        try {
            passwordMatches = await bcrypt.compare(trimmedPassword, passwordHash);
            console.log('🔐 Bcrypt comparison result:', passwordMatches);
        } catch (compareError) {
            console.error('Coordinator password comparison failed:', compareError.message);
        }
    }

    if (!passwordMatches && coordinatorDoc.password && typeof coordinatorDoc.password === 'string') {
        passwordMatches = coordinatorDoc.password === trimmedPassword;
        console.log('🔁 Fallback plain-text comparison result:', passwordMatches);
    }

    if (!passwordMatches) {
        console.warn('Coordinator login failed due to invalid credentials:', identifier);
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    if (coordinatorDoc.isBlocked) {
        console.warn('Coordinator login blocked:', identifier);

        let blockerName = coordinatorDoc.blockedBy || 'Admin';
        let blockerCabin = coordinatorDoc.blockedByCabin || 'N/A';

        if (isMongoConnected && (!coordinatorDoc.blockedBy || !coordinatorDoc.blockedByCabin)) {
            try {
                const Admin = require('./models/Admin');
                const adminIdentifier = coordinatorDoc.blockedByIdentifier || coordinatorDoc.blockedBy || 'admin1000';
                const adminDoc = await Admin.findOne({
                    $or: [
                        { adminLoginID: adminIdentifier },
                        { adminLoginID: coordinatorDoc.blockedBy },
                        { fullName: coordinatorDoc.blockedBy },
                        { firstName: coordinatorDoc.blockedBy },
                        { lastName: coordinatorDoc.blockedBy }
                    ]
                })
                    .select('firstName lastName adminLoginID cabin')
                    .lean()
                    .maxTimeMS(2000);

                if (adminDoc) {
                    blockerName = `${adminDoc.firstName || ''} ${adminDoc.lastName || ''}`.trim()
                        || adminDoc.adminLoginID
                        || blockerName;
                    blockerCabin = adminDoc.cabin || blockerCabin;
                }
            } catch (error) {
                console.warn('Unable to resolve blocked coordinator authority details:', error.message);
            }
        }

        return res.status(403).json({
            error: coordinatorDoc.blockedReason || 'Your coordinator account is blocked. Please contact the placement office.',
            isBlocked: true,
            coordinator: {
                name: blockerName,
                blockedBy: blockerName,
                cabin: blockerCabin,
                blockedByCabin: blockerCabin,
                blockedByRole: coordinatorDoc.blockedByRole || 'admin',
                department: coordinatorDoc.department || 'N/A'
            }
        });
    }

    // Update last login timestamp (non-blocking - fire and forget)
    if (isMongoConnected && coordinatorDoc._id) {
        // Don't await - run in background to avoid slowing down response
        Promise.resolve().then(async () => {
            try {
                await Coordinator.findByIdAndUpdate(coordinatorDoc._id, {
                    lastLogin: new Date()
                }, { maxTimeMS: 3000 });
            } catch (updateError) {
                console.error('Failed to update coordinator lastLogin:', updateError.message);
            }
        });
    }

    const coordinatorPayload = sanitizeCoordinator(coordinatorDoc) || {};
    if (!coordinatorPayload.coordinatorId) {
        coordinatorPayload.coordinatorId = coordinatorDoc.coordinatorId;
    }

    const token = jwt.sign({
        userId: coordinatorDoc._id || coordinatorDoc.id || coordinatorPayload._id,
        coordinatorId: coordinatorPayload.coordinatorId,
        role: 'coordinator'
    }, JWT_SECRET, { expiresIn: '6h' });

    console.log('✅ Coordinator login successful:', {
        coordinatorId: coordinatorPayload.coordinatorId,
        name: coordinatorPayload.fullName || coordinatorPayload.username || 'N/A'
    });

    return res.json({
        message: 'Coordinator login successful',
        token,
        coordinator: coordinatorPayload
    });
});

// Initialize default admin account (for first-time setup) - PUBLIC ENDPOINT
app.post('/api/init/admin', async (req, res) => {
    try {
        const isMongoConnected = mongoose.connection.readyState === 1;
        
        if (!isMongoConnected) {
            return res.status(503).json({ 
                error: 'Database not connected',
                details: 'Cannot initialize admin without MongoDB connection'
            });
        }

        // Import Admin model
        const Admin = require('./models/Admin');
        
        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ adminLoginID: 'admin1000' });
        
        if (existingAdmin) {
            return res.json({
                message: 'Admin already exists',
                existing: true,
                admin: {
                    adminLoginID: existingAdmin.adminLoginID,
                    name: `${existingAdmin.firstName || ''} ${existingAdmin.lastName || ''}`.trim()
                }
            });
        }

        // Create new admin
        const newAdmin = new Admin({
            adminLoginID: 'admin1000',
            adminPassword: 'admin1000',
            firstName: 'Admin',
            lastName: 'User',
            emailId: 'admin@college.edu',
            domainMailId: 'admin@college.edu',
            phoneNumber: '1234567890',
            department: 'Placement Cell',
            gender: 'Male'
        });

        await newAdmin.save();

        console.log('✅ Default admin account created successfully');

        return res.json({
            message: 'Admin account created successfully',
            created: true,
            admin: {
                adminLoginID: 'admin1000',
                name: 'Admin User'
            },
            credentials: {
                username: 'admin1000',
                password: 'admin1000'
            }
        });
    } catch (error) {
        console.error('Admin initialization error:', error);
        return res.status(500).json({
            error: 'Failed to initialize admin',
            details: error.message
        });
    }
});

// Initialize default coordinator account (for first-time setup) - PUBLIC ENDPOINT
app.post('/api/init/coordinator', async (req, res) => {
    try {
        const isMongoConnected = mongoose.connection.readyState === 1;
        
        if (!isMongoConnected) {
            return res.status(503).json({ 
                error: 'Database not connected',
                details: 'Cannot initialize coordinator without MongoDB connection'
            });
        }

        // Check if default coordinator already exists
        const existingCoord = await Coordinator.findOne({ 
            $or: [
                { coordinatorId: 'coord_cse' },
                { username: 'coord_cse' }
            ]
        });
        
        if (existingCoord) {
            return res.json({
                message: 'Coordinator already exists',
                existing: true,
                coordinator: {
                    coordinatorId: existingCoord.coordinatorId,
                    username: existingCoord.username,
                    name: `${existingCoord.firstName || ''} ${existingCoord.lastName || ''}`.trim(),
                    department: existingCoord.department
                }
            });
        }

        // Create new coordinator with hashed password
        const hashedPassword = await bcrypt.hash('coord123', 10);
        
        const newCoordinator = new Coordinator({
            coordinatorId: 'coord_cse',
            firstName: 'CSE',
            lastName: 'Coordinator',
            fullName: 'CSE Coordinator',
            gender: 'Male',
            email: 'cse.coord@college.edu',
            domainEmail: 'cse.coordinator@college.edu',
            phone: '9876543210',
            department: 'CSE',
            cabin: 'A-101',
            username: 'coord_cse',
            passwordHash: hashedPassword,
            isBlocked: false
        });

        await newCoordinator.save();

        console.log('✅ Default coordinator account created successfully');

        return res.json({
            message: 'Coordinator account created successfully',
            created: true,
            coordinator: {
                coordinatorId: 'coord_cse',
                username: 'coord_cse',
                name: 'CSE Coordinator',
                department: 'CSE'
            },
            credentials: {
                username: 'coord_cse',
                coordinatorId: 'coord_cse',
                password: 'coord123'
            }
        });
    } catch (error) {
        console.error('Coordinator initialization error:', error);
        return res.status(500).json({
            error: 'Failed to initialize coordinator',
            details: error.message
        });
    }
});

// Admin login endpoint - OPTIMIZED FOR SPEED ⚡
app.post('/api/auth/admin-login', async (req, res) => {
    const { adminLoginID, adminPassword } = req.body || {};

    const trimmedLoginID = typeof adminLoginID === 'string' ? adminLoginID.trim() : '';
    const trimmedPassword = typeof adminPassword === 'string' ? adminPassword.trim() : '';

    if (!trimmedLoginID) {
        return res.status(400).json({ error: 'Admin Login ID is required.' });
    }

    if (!trimmedPassword) {
        return res.status(400).json({ error: 'Password is required.' });
    }

    const connectionState = mongoose.connection.readyState;
    const isMongoConnected = connectionState === 1;

    console.log('👤 Admin login attempt:', {
        loginID: trimmedLoginID,
        mongoState: connectionState,
        source: isMongoConnected ? 'mongo' : 'in-memory'
    });

    let adminDoc = null;
    const startTime = Date.now();

    // Check login cache first (avoids slow MongoDB Atlas queries)
    const adminCacheKey = `admin:${trimmedLoginID}`;
    adminDoc = getLoginCache(adminCacheKey);
    
    if (adminDoc) {
        console.log(`⚡ Admin doc served from cache (${Date.now() - startTime}ms)`);
    } else if (isMongoConnected) {
        try {
            const Admin = require('./models/Admin');
            
            // OPTIMIZATION 1: Only select needed fields (reduces data transfer by 80%+)
            const essentialFields = 'adminLoginID adminPassword firstName lastName emailId domainMailId phoneNumber department dob gender profilePhoto';
            
            // OPTIMIZATION 2: Multiple retry strategy — final attempt has NO maxTimeMS so Atlas cold-start can complete
            const queryWithTimeout = async (timeoutMs, useServerTimeout = true) => {
                let findPromise = Admin.findOne({ adminLoginID: trimmedLoginID })
                    .select(essentialFields)
                    .lean();
                if (useServerTimeout) findPromise = findPromise.maxTimeMS(timeoutMs);
                
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`Query timeout (${timeoutMs}ms)`)), timeoutMs + 1000)
                );

                return Promise.race([findPromise, timeoutPromise]);
            };

            // Fast (10s) → Medium (20s) → Final (45s, no MongoDB server timeout)
            try {
                adminDoc = await queryWithTimeout(10000);
                console.log(`⚡ Admin found in ${Date.now() - startTime}ms (fast path)`);
            } catch (fastError) {
                console.log(`⏱️ Fast query failed (${fastError.message}), trying medium timeout...`);
                
                try {
                    adminDoc = await queryWithTimeout(20000);
                    console.log(`✅ Admin found in ${Date.now() - startTime}ms (medium path)`);
                } catch (mediumError) {
                    console.log(`⏱️ Medium query failed (${mediumError.message}), trying final attempt (no server timeout)...`);
                    
                    // Final attempt: 45s JS timeout, NO maxTimeMS — lets Atlas wake up fully
                    adminDoc = await queryWithTimeout(45000, false);
                    console.log(`✅ Admin found in ${Date.now() - startTime}ms (slow/cold-start path)`);
                }
            }
            
            if (adminDoc) {
                // Cache for next time (5 min TTL)
                setLoginCache(adminCacheKey, adminDoc);
            }
        } catch (mongoError) {
            console.error(`❌ Admin login MongoDB query failed after ${Date.now() - startTime}ms:`, mongoError.message);
            return res.status(500).json({ 
                error: 'Database query timeout. Please try again.',
                details: 'The database is responding slowly. Please wait a moment and retry.'
            });
        }
    }

    if (!adminDoc) {
        console.warn('Admin not found:', trimmedLoginID);
        return res.status(404).json({ error: 'Admin not found.' });
    }

    console.log('🔎 Admin doc found:', {
        adminLoginID: adminDoc.adminLoginID,
        hasPassword: !!adminDoc.adminPassword
    });

    // Direct password comparison (plain text for now - consider bcrypt in production)
    const passwordMatches = adminDoc.adminPassword === trimmedPassword;

    if (!passwordMatches) {
        console.warn('Admin login failed due to invalid credentials:', trimmedLoginID);
        return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Update last login timestamp (non-blocking - fire and forget)
    if (isMongoConnected && adminDoc._id) {
        // Don't await - run in background to avoid slowing down response
        Promise.resolve().then(async () => {
            try {
                const Admin = require('./models/Admin');
                await Admin.findByIdAndUpdate(adminDoc._id, {
                    lastLogin: new Date()
                }, { maxTimeMS: 3000 });
            } catch (updateError) {
                console.error('Failed to update admin lastLogin:', updateError.message);
            }
        });
    }

    // Prepare admin payload (exclude sensitive data)
    const adminPayload = {
        _id: adminDoc._id,
        adminLoginID: adminDoc.adminLoginID,
        firstName: adminDoc.firstName || '',
        lastName: adminDoc.lastName || '',
        fullName: `${adminDoc.firstName || ''} ${adminDoc.lastName || ''}`.trim() || 'Admin',
        dob: adminDoc.dob || '',
        gender: adminDoc.gender || '',
        emailId: adminDoc.emailId || '',
        domainMailId: adminDoc.domainMailId || '',
        phoneNumber: adminDoc.phoneNumber || '',
        department: adminDoc.department || '',
        profilePhoto: adminDoc.profilePhoto || null
    };

    const token = jwt.sign({
        userId: adminDoc._id || adminDoc.id,
        adminLoginID: adminDoc.adminLoginID,
        role: 'admin'
    }, JWT_SECRET, { expiresIn: '6h' });

    console.log('✅ Admin login successful:', {
        adminLoginID: adminPayload.adminLoginID,
        name: adminPayload.fullName
    });

    return res.json({
        message: 'Admin login successful',
        success: true,
        token,
        admin: adminPayload
    });
});

// Student login with bulletproof connection handling - OPTIMIZED FOR SPEED ⚡
app.post('/api/students/login', async (req, res) => {
    const { regNo, dob } = req.body;
    let student;
    const resolveStudentId = (studentDoc) => studentDoc?._id || studentDoc?.id;
    const toLoginStudentPayload = (studentDoc) => ({
        _id: resolveStudentId(studentDoc),
        regNo: studentDoc.regNo,
        firstName: studentDoc.firstName,
        lastName: studentDoc.lastName,
        primaryEmail: studentDoc.primaryEmail || studentDoc.email,
        email: studentDoc.email,
        branch: studentDoc.branch,
        degree: studentDoc.degree,
        profilePicURL: studentDoc.profilePicURL || '',
        resumeData: studentDoc.resumeData || null,
        resumeURL: studentDoc.resumeURL || '',
        dob: studentDoc.dob,
        phone: studentDoc.phone || studentDoc.mobileNo || studentDoc.mobile || '',
        gender: studentDoc.gender || '',
        cgpa: studentDoc.cgpa || '',
        year: studentDoc.year || '',
        skills: studentDoc.skills || '',
        backlogs: studentDoc.backlogs || '0',
        tenthPercentage: studentDoc.tenthPercentage || '',
        twelfthPercentage: studentDoc.twelfthPercentage || '',
        companyPlaced: studentDoc.companyPlaced || '',
        packageOffered: studentDoc.packageOffered || '',
        placement: studentDoc.placement || '',
        driveCount: studentDoc.driveCount || 0
    });

    console.log('=== LOGIN ATTEMPT ===');
    console.log('RegNo:', regNo, 'DOB:', dob);

    try {
        // Check MongoDB connection status (non-blocking)
        const connectionState = mongoose.connection.readyState;
        let isMongoConnected = connectionState === 1;
        const startTime = Date.now();
        const essentialFields = '_id regNo dob firstName lastName primaryEmail email branch degree isBlocked blocked blockedBy blockedByRole blockedAt blockedReason profilePicURL resumeData resumeURL phone gender cgpa year skills backlogs tenthPercentage twelfthPercentage companyPlaced packageOffered placement driveCount';

        const fetchStudentFromMongoWithRetry = async () => {
            // OPTIMIZATION 2: Multiple retry strategy — final attempt has NO maxTimeMS so Atlas cold-start can complete
            const queryWithTimeout = async (timeoutMs, useServerTimeout = true) => {
                let findPromise = Student.findOne({ regNo, dob })
                    .select(essentialFields)
                    .lean();
                if (useServerTimeout) findPromise = findPromise.maxTimeMS(timeoutMs);
                
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error(`Query timeout (${timeoutMs}ms)`)), timeoutMs + 1000)
                );

                return Promise.race([findPromise, timeoutPromise]);
            };

            // Fast (10s) → Medium (20s) → Final (45s, no MongoDB server timeout)
            try {
                student = await queryWithTimeout(10000);
                console.log(`⚡ Student found in ${Date.now() - startTime}ms (fast path)`);
            } catch (fastError) {
                console.log(`⏱️ Fast query failed (${fastError.message}), trying medium timeout...`);
                
                try {
                    student = await queryWithTimeout(20000);
                    console.log(`✅ Student found in ${Date.now() - startTime}ms (medium path)`);
                } catch (mediumError) {
                    console.log(`⏱️ Medium query failed (${mediumError.message}), trying final attempt (no server timeout)...`);
                    
                    // Final attempt: 45s JS timeout, NO maxTimeMS — lets Atlas wake up fully
                    student = await queryWithTimeout(45000, false);
                    console.log(`✅ Student found in ${Date.now() - startTime}ms (slow/cold-start path)`);
                }
            }
        };
        
        console.log('👤 Student login attempt:', {
            regNo,
            mongoState: connectionState,
            source: isMongoConnected ? 'mongo' : 'in-memory'
        });

        // Check login cache first
        const studentCacheKey = `student:${regNo}:${dob}`;
        student = getLoginCache(studentCacheKey);
        
        if (student) {
            console.log(`⚡ Student doc served from cache (${Date.now() - startTime}ms)`);
        } else if (isMongoConnected) {
            // Try MongoDB with optimized query
            try {
                console.log('Searching for student in MongoDB...');
                await fetchStudentFromMongoWithRetry();
                
                if (student) {
                    // Cache for next time (30 min TTL)
                    setLoginCache(studentCacheKey, student);
                    console.log('Student found with block status:', {
                        isBlocked: student.isBlocked,
                        blocked: student.blocked,
                        blockedBy: student.blockedBy
                    });
                }
            } catch (mongoError) {
                console.log(`❌ MongoDB query failed after ${Date.now() - startTime}ms:`, mongoError.message);
                // Fall through to in-memory
            }
        }

        // If MongoDB was briefly disconnected (common after unblock/update activity),
        // force a reconnect attempt before considering in-memory fallback.
        if (!student && !isMongoConnected) {
            try {
                console.log('🔄 MongoDB not ready for login. Attempting reconnect before fallback...');
                const mongoReady = await ensureConnection();
                isMongoConnected = mongoReady;

                if (mongoReady) {
                    await fetchStudentFromMongoWithRetry();
                    if (student) {
                        setLoginCache(studentCacheKey, student);
                        console.log('✅ Student found after reconnect attempt');
                    }
                }
            } catch (reconnectError) {
                console.warn('Mongo reconnect attempt failed during login:', reconnectError.message);
            }
        }

        // Fallback to in-memory if MongoDB not available or query failed
        if (!student) {
            if (IN_MEMORY_FALLBACK_ENABLED) {
                console.log('Using in-memory storage...');
                student = students.find(s => s.regNo === regNo && s.dob === dob);
            } else {
                console.warn('Skipping in-memory fallback; student must exist in MongoDB.');
            }
        }

        if (!student) {
            console.log('Student not found, returning 404');
            return res.status(404).json({ error: 'Student not found.' });
        }

        // CRITICAL: Check block status with detailed logging
        console.log('=== BLOCK STATUS CHECK ===');
        console.log('student.isBlocked:', student.isBlocked);
        console.log('student.blocked:', student.blocked);
        console.log('student.blockedBy:', student.blockedBy);
        console.log('Block check result:', (student.isBlocked || student.blocked));
        
        // Check if student is blocked (check both isBlocked and blocked fields for compatibility)
        if (student.isBlocked || student.blocked) {
            console.log('❌ Login failed: Student is blocked.', regNo);
            const blockedByRole = (student.blockedByRole || '').toString().trim().toLowerCase();
            const defaultBlockedBy = student.blockedBy || 'Placement Office';
            const defaultCabin = student.blockedByCabin || 'N/A';

            let coordinatorDetails = {
                name: defaultBlockedBy,
                cabin: defaultCabin,
                blockedBy: defaultBlockedBy,
                blockedByCabin: defaultCabin,
                blockedByRole: blockedByRole || 'admin'
            };
            
            // Try to get more details from the blocker if available (non-blocking)
            if (isMongoConnected && student.blockedBy) {
                try {
                    const blockedByIdentifier = student.blockedByIdentifier || student.blockedBy;
                    const blockedByParts = String(student.blockedBy || '').trim().split(/\s+/).filter(Boolean);
                    const blockedByFirst = blockedByParts[0] || '';
                    const blockedByLast = blockedByParts.slice(1).join(' ');

                    const findCoordinator = async () => Coordinator.findOne({
                        $or: [
                            { coordinatorId: blockedByIdentifier },
                            { username: blockedByIdentifier },
                            { fullName: student.blockedBy },
                            { coordinatorId: student.blockedBy },
                            { username: student.blockedBy },
                            { firstName: student.blockedBy },
                            { lastName: student.blockedBy },
                            ...(blockedByFirst ? [{ firstName: blockedByFirst }] : []),
                            ...(blockedByLast ? [{ lastName: blockedByLast }] : [])
                        ]
                    })
                        .select('firstName lastName cabin coordinatorId username fullName')
                        .lean()
                        .maxTimeMS(2000);

                    if (blockedByRole === 'coordinator') {
                        const coordinator = await findCoordinator();

                        if (coordinator) {
                            const coordinatorName = `${coordinator.firstName || ''} ${coordinator.lastName || ''}`.trim()
                                || coordinator.fullName
                                || coordinator.username
                                || coordinator.coordinatorId
                                || defaultBlockedBy;

                            coordinatorDetails = {
                                name: coordinatorName,
                                cabin: coordinator.cabin || defaultCabin,
                                blockedBy: coordinatorName,
                                blockedByCabin: coordinator.cabin || defaultCabin,
                                blockedByRole: 'coordinator'
                            };
                        }
                    } else {
                        const Admin = require('./models/Admin');
                        const admin = await Admin.findOne({
                            $or: [
                                { adminLoginID: blockedByIdentifier },
                                { adminLoginID: student.blockedBy },
                                { fullName: student.blockedBy },
                                { firstName: student.blockedBy },
                                { lastName: student.blockedBy }
                            ]
                        })
                        .select('firstName lastName adminLoginID cabin')
                        .lean()
                        .maxTimeMS(2000);

                        if (admin) {
                            const adminName = `${admin.firstName || ''} ${admin.lastName || ''}`.trim()
                                || admin.adminLoginID
                                || defaultBlockedBy;

                            coordinatorDetails = {
                                name: adminName,
                                cabin: admin.cabin || defaultCabin,
                                blockedBy: adminName,
                                blockedByCabin: admin.cabin || defaultCabin,
                                blockedByRole: 'admin'
                            };
                        } else {
                            // Backward compatibility: if role metadata is missing/wrong, try coordinator too.
                            const coordinator = await findCoordinator();
                            if (coordinator) {
                                const coordinatorName = `${coordinator.firstName || ''} ${coordinator.lastName || ''}`.trim()
                                    || coordinator.fullName
                                    || coordinator.username
                                    || coordinator.coordinatorId
                                    || defaultBlockedBy;

                                coordinatorDetails = {
                                    name: coordinatorName,
                                    cabin: coordinator.cabin || defaultCabin,
                                    blockedBy: coordinatorName,
                                    blockedByCabin: coordinator.cabin || defaultCabin,
                                    blockedByRole: 'coordinator'
                                };
                            }
                        }
                    }
                } catch (err) {
                    console.log('Could not fetch blocker details:', err.message);
                }
            }
            
            return res.status(403).json({ 
                error: student.blockedReason || 'Your account has been blocked. Please contact the placement office.',
                isBlocked: true,
                coordinator: coordinatorDetails
            });
        }
        
        console.log(`✅ Student login successful in ${Date.now() - startTime}ms:`, regNo);
        console.log('🔍 DEBUG: Student object before response:', {
            _id: student._id,
            id: student.id,
            regNo: student.regNo,
            hasId: !!student._id,
            hasId2: !!student.id
        });

        const studentId = resolveStudentId(student);
        if (!studentId) {
            console.error('❌ Student login aborted: missing stable student identifier', {
                regNo,
                source: isMongoConnected ? 'mongo' : 'in-memory'
            });
            return res.status(503).json({
                error: 'Your account data is syncing. Please try logging in again in a few seconds.'
            });
        }
        
        // Generate token
        const token = jwt.sign({ 
            userId: studentId, 
            regNo: student.regNo, 
            role: 'student' 
        }, JWT_SECRET, { expiresIn: '6h' });
        
        const responseStudent = toLoginStudentPayload(student);
        
        console.log('📤 DEBUG: Response student object:', {
            _id: responseStudent._id,
            regNo: responseStudent.regNo,
            hasId: !!responseStudent._id
        });
        
        res.json({ 
            message: 'Login successful', 
            token, 
            student: responseStudent
        });

    } catch (error) {
        console.error('Login error:', error);
        
        // Final fallback - try in-memory
        if (IN_MEMORY_FALLBACK_ENABLED) {
            try {
                student = students.find(s => s.regNo === regNo && s.dob === dob);
                if (student) {
                    const studentId = resolveStudentId(student);
                    if (!studentId) {
                        console.error('❌ Fallback login aborted: missing stable student identifier', { regNo });
                        return res.status(503).json({
                            error: 'Your account data is syncing. Please try logging in again in a few seconds.'
                        });
                    }

                    const token = jwt.sign({ 
                        userId: studentId, 
                        regNo: student.regNo, 
                        role: 'student' 
                    }, JWT_SECRET, { expiresIn: '6h' });
                    
                    return res.json({ 
                        message: 'Login successful (fallback mode)', 
                        token, 
                        student: {
                            _id: student._id || student.id,
                            regNo: student.regNo,
                            firstName: student.firstName,
                            lastName: student.lastName,
                            primaryEmail: student.primaryEmail || student.email,
                            email: student.email,
                            branch: student.branch,
                            degree: student.degree,
                            profilePicURL: student.profilePicURL || '',
                            resumeData: student.resumeData || null,
                            resumeURL: student.resumeURL || '',
                            dob: student.dob,
                            phone: student.phone || student.mobileNo || student.mobile || '',
                            gender: student.gender || '',
                            cgpa: student.cgpa || '',
                            year: student.year || '',
                            skills: student.skills || '',
                            backlogs: student.backlogs || '0',
                            tenthPercentage: student.tenthPercentage || '',
                            twelfthPercentage: student.twelfthPercentage || '',
                            companyPlaced: student.companyPlaced || '',
                            packageOffered: student.packageOffered || '',
                            placement: student.placement || '',
                            driveCount: student.driveCount || 0
                        }
                    });
                }
            } catch (fallbackError) {
                console.error('Fallback login error:', fallbackError.message);
            }
        }
        
        // Return error response
        res.status(500).json({ 
            error: 'Login failed', 
            details: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message 
        });
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

app.get('/api/students', async (req, res) => {
    const { name, regNo, department, branch, batch, page = '1', limit = '100', includeImages = 'false' } = req.query;
    
    console.log('📋 Students Request:', { page, limit, includeImages, filters: { name, regNo, department, branch, batch } });
    console.log('🔌 MongoDB Status:', mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED');

    try {
        // Always try to ensure connection
        const isMongoConnected = mongoose.connection.readyState === 1 || await ensureConnection();
        
        if (isMongoConnected) {
            console.log('✅ Using MongoDB for students query');
            const query = {};

            // IMPORTANT: Exclude archived students by default
            query.isArchived = { $ne: true };

            // Build optimized query
            if (regNo) query.regNo = { $regex: regNo, $options: 'i' };
            if (department) query.department = department;
            if (branch) query.branch = branch;
            if (batch) {
                query.$or = [{ batch }, { year: batch }];
            }
            if (name) {
                // Use $or for name search across first and last names
                query.$or = [
                    { firstName: { $regex: name, $options: 'i' } },
                    { lastName: { $regex: name, $options: 'i' } }
                ];
            }

            // Pagination settings - default to 50 for better performance
            const pageNum = Math.max(1, parseInt(page) || 1);
            const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
            const skip = (pageNum - 1) * limitNum;

            // OPTIMIZED: Strict field projections - exclude all heavy binary data by default
            const selectFields = includeImages === 'true' 
                ? '-resumeData -uploadedResume -tenthMarksheet -twelfthMarksheet -diplomaMarksheet'
                : '-profilePicURL -resumeData -uploadedResume -tenthMarksheet -twelfthMarksheet -diplomaMarksheet';

            // Execute optimized query with lean() for 50% faster execution
            const [list, total] = await Promise.all([
                Student.find(query)
                    .select(selectFields)
                    .limit(limitNum)
                    .skip(skip)
                    .sort({ regNo: 1 })
                    .lean()  // Returns plain JS objects (faster than Mongoose documents)
                    .exec(),
                Student.countDocuments(query)
            ]);

            // Return paginated response with all metadata
            res.json({
                students: list,
                total,
                totalPages: Math.ceil(total / limitNum),
                currentPage: pageNum,
                page: pageNum,
                limit: limitNum,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum),
                    hasMore: skip + list.length < total
                }
            });
        } else {
            // Fallback for when MongoDB is not connected
            let list = students.slice();
            // Filter out archived students
            list = list.filter(s => !s.isArchived);
            if (regNo) list = list.filter(s => String(s.regNo).toLowerCase().includes(String(regNo).toLowerCase()));
            if (department) list = list.filter(s => (s.department || s.branch) === department);
            if (branch) list = list.filter(s => s.branch === branch);
            if (batch) list = list.filter(s => (s.batch || s.year) === batch);
            if (name) {
                const n = String(name).toLowerCase();
                list = list.filter(s => (`${s.firstName || ''} ${s.lastName || ''} ${s.name || ''}`).toLowerCase().includes(n));
            }
            
            res.json({ students: list, pagination: { page: 1, limit: list.length, total: list.length, totalPages: 1, hasMore: false } });
        }
    } catch (error) {
        console.error('List students error:', error);
        res.status(500).json({ error: 'Failed to list students', details: error.message });
    }
});

app.post('/api/admin/students/ai-filter', authenticateToken, checkRole('admin'), async (req, res) => {
    req.setTimeout(120000);
    res.setTimeout(120000);

    try {
        const { prompt } = req.body;

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({ error: 'Missing prompt' });
        }

        const { parseStudentFilterQuery, checkOllamaStatus } = require('./ollamaService');
        const PlacedStudent = require('./models/PlacedStudent');

        const ollamaStatus = await checkOllamaStatus();
        if (!ollamaStatus.running) {
            return res.status(503).json({
                error: 'Ollama is not running. Please start Ollama on your machine.',
                details: 'Run: ollama serve'
            });
        }

        // Use enhanced AI parsing
        const parsed = await parseStudentFilterQuery(prompt) || {};
        const promptText = prompt.toLowerCase();

        // Fallback regex patterns for common queries
        const fallbackDriveMatch = promptText.match(/(\d+)\s*(drive|drives|placement drive|company drive)/i);
        const fallbackCompanyMatch = prompt.match(/(?:attended|attend|attending|who are|students who are|students who attended|show me who are)?\s*([a-z0-9&.'-]+(?:\s+[a-z0-9&.'-]+){0,4})\s+(?:company\s+drive|placement\s+drive|drive)/i);
        const fallbackRoleMatch = prompt.match(/(?:for|role|job\s*role|position)\s+([a-z0-9&.'-]+(?:\s+[a-z0-9&.'-]+){0,4})/i);
        const fallbackCgpaMatch = promptText.match(/(?:cgpa|gpa)\s*(?:above|greater than|>=|>|more than|at least)\s*(\d+(?:\.\d+)?)/i);
        const fallbackPlacedMatch = /\b(placed|placement)\b/.test(promptText) && !/\b(not placed|unplaced|un-placed)\b/.test(promptText);
        const fallbackUnplacedMatch = /\b(not placed|unplaced|un-placed)\b/.test(promptText);
        const fallbackSkillMatch = prompt.match(/(?:know|knows|skilled in|skills?|experience in|proficient in)\s+([a-z0-9#+.]+(?:\s*,?\s*[a-z0-9#+.]+)*)/i);

        const fallbackFilters = {
            isBlocked: /\bblocked\b/.test(promptText) ? true : null,
            driveCountMin: fallbackDriveMatch ? Number(fallbackDriveMatch[1]) : null,
            companyName: fallbackCompanyMatch ? fallbackCompanyMatch[1].trim() : '',
            jobRole: fallbackRoleMatch ? fallbackRoleMatch[1].trim() : '',
            cgpaMin: fallbackCgpaMatch ? Number(fallbackCgpaMatch[1]) : null,
            isPlaced: fallbackPlacedMatch ? true : (fallbackUnplacedMatch ? false : null),
            skills: fallbackSkillMatch ? fallbackSkillMatch[1].trim() : '',
        };

        // Merge AI-parsed filters with fallback
        const filters = {
            name: '',
            regNo: '',
            department: '',
            branch: '',
            batch: '',
            section: '',
            currentYear: '',
            currentSemester: '',
            gender: '',
            city: '',
            cgpaMin: null,
            cgpaMax: null,
            tenthMin: null,
            twelfthMin: null,
            hasBacklogs: null,
            skills: '',
            companyName: '',
            jobRole: '',
            isBlocked: null,
            isPlaced: null,
            placedCompany: '',
            packageMin: null,
            driveCountMin: null,
            driveCountMax: null,
            eligibleDriveId: '',
            sortBy: 'regNo',
            sortOrder: 'asc',
            ...(parsed.filters || {}),
        };

        // Apply fallback values only if AI didn't provide them
        Object.keys(fallbackFilters).forEach(key => {
            if (fallbackFilters[key] !== null && fallbackFilters[key] !== '' && (filters[key] === null || filters[key] === '')) {
                filters[key] = fallbackFilters[key];
            }
        });

        // Build dynamic columns list
        const requestedColumns = Array.isArray(parsed.columns) ? parsed.columns : [];
        const columns = [...new Set(requestedColumns.filter(Boolean))];

        // Auto-add relevant columns based on filters
        if ((filters.driveCountMin !== null || /drive|attendance/i.test(promptText)) && !columns.includes('driveCount')) {
            columns.push('driveCount');
        }
        if ((filters.driveCountMin !== null || /drive|attendance/i.test(promptText)) && !columns.includes('lastDriveDate')) {
            columns.push('lastDriveDate');
        }
        if ((filters.isPlaced !== null || filters.placedCompany) && !columns.includes('placementStatus')) {
            columns.push('placementStatus');
        }
        if ((filters.isPlaced !== null || filters.placedCompany) && !columns.includes('placedCompany')) {
            columns.push('placedCompany');
        }
        if ((filters.isPlaced !== null || filters.packageMin !== null) && !columns.includes('package')) {
            columns.push('package');
        }
        if ((filters.cgpaMin !== null || filters.cgpaMax !== null || /cgpa|gpa/i.test(promptText)) && !columns.includes('cgpa')) {
            columns.push('cgpa');
        }
        if (filters.skills && !columns.includes('skills')) {
            columns.push('skills');
        }
        if ((filters.hasBacklogs !== null || /backlog/i.test(promptText)) && !columns.includes('backlogs')) {
            columns.push('backlogs');
        }

        // Build MongoDB query conditions
        const andConditions = [{ isArchived: { $ne: true } }];

        if (filters.regNo) {
            andConditions.push({ regNo: { $regex: filters.regNo, $options: 'i' } });
        }
        if (filters.name) {
            andConditions.push({
                $or: [
                    { firstName: { $regex: filters.name, $options: 'i' } },
                    { lastName: { $regex: filters.name, $options: 'i' } },
                    { name: { $regex: filters.name, $options: 'i' } },
                ]
            });
        }
        if (filters.department) {
            andConditions.push({
                $or: [
                    { department: { $regex: `^${filters.department}$`, $options: 'i' } },
                    { branch: { $regex: `^${filters.department}$`, $options: 'i' } }
                ]
            });
        }
        if (filters.branch) {
            andConditions.push({
                $or: [
                    { branch: { $regex: filters.branch, $options: 'i' } },
                    { department: { $regex: filters.branch, $options: 'i' } }
                ]
            });
        }
        if (filters.batch) {
            andConditions.push({ $or: [{ batch: filters.batch }, { year: filters.batch }] });
        }
        if (filters.section) {
            andConditions.push({ section: { $regex: filters.section, $options: 'i' } });
        }
        if (filters.currentYear) {
            andConditions.push({ currentYear: { $regex: filters.currentYear, $options: 'i' } });
        }
        if (filters.currentSemester) {
            andConditions.push({ currentSemester: { $regex: filters.currentSemester, $options: 'i' } });
        }
        if (filters.gender) {
            andConditions.push({ gender: { $regex: filters.gender, $options: 'i' } });
        }
        if (filters.city) {
            andConditions.push({ city: { $regex: filters.city, $options: 'i' } });
        }
        if (filters.isBlocked === true) {
            andConditions.push({ $or: [{ isBlocked: true }, { blocked: true }] });
        }
        if (filters.skills) {
            andConditions.push({ skillSet: { $regex: filters.skills, $options: 'i' } });
        }
        if (filters.hasBacklogs === true) {
            andConditions.push({
                $and: [
                    { currentBacklogs: { $exists: true } },
                    { currentBacklogs: { $ne: '' } },
                    { currentBacklogs: { $ne: '0' } },
                    { currentBacklogs: { $ne: 0 } }
                ]
            });
        }
        if (filters.hasBacklogs === false) {
            andConditions.push({
                $or: [
                    { currentBacklogs: { $exists: false } },
                    { currentBacklogs: '' },
                    { currentBacklogs: '0' },
                    { currentBacklogs: 0 }
                ]
            });
        }

        const query = andConditions.length > 0 ? { $and: andConditions } : {};

        // Build attendance aggregation match
        const attendanceMatch = { 'students.status': 'Present' };
        if (filters.companyName) {
            attendanceMatch.companyName = { $regex: filters.companyName, $options: 'i' };
        }
        if (filters.jobRole) {
            attendanceMatch.jobRole = { $regex: filters.jobRole, $options: 'i' };
        }

        // Build placement query
        const placementMatch = {};
        if (filters.placedCompany) {
            placementMatch.company = { $regex: filters.placedCompany, $options: 'i' };
        }

        // Parallel queries for all data sources
        const [rawStudents, attendanceStats, placementStats, eligibleStats] = await Promise.all([
            // Main student query with extended fields
            Student.find(query)
                .select('_id regNo firstName lastName name department branch batch year section currentYear currentSemester isBlocked blocked overallCGPA skillSet currentBacklogs tenthPercentage twelfthPercentage gender city')
                .sort({ regNo: 1 })
                .lean()
                .exec(),

            // Attendance aggregation
            Attendance.aggregate([
                { $unwind: '$students' },
                { $match: attendanceMatch },
                {
                    $group: {
                        _id: '$students.regNo',
                        driveCount: { $sum: 1 },
                        lastDriveDate: { $max: '$startDate' },
                        companies: { $addToSet: '$companyName' },
                        roles: { $addToSet: '$jobRole' },
                    }
                }
            ]),

            // Placement data aggregation
            PlacedStudent.aggregate([
                { $match: { status: 'Accepted', ...placementMatch } },
                {
                    $group: {
                        _id: '$regNo',
                        company: { $first: '$company' },
                        role: { $first: '$role' },
                        package: { $first: '$pkg' },
                        placedDate: { $first: '$date' },
                    }
                }
            ]),

            // Eligible students count
            EligibleStudent.aggregate([
                { $unwind: '$students' },
                {
                    $group: {
                        _id: '$students.regNo',
                        eligibleDriveCount: { $sum: 1 },
                        eligibleCompanies: { $addToSet: '$companyName' },
                    }
                }
            ])
        ]);

        // Build lookup maps
        const attendanceMap = new Map(
            attendanceStats.map((entry) => [String(entry._id || '').trim(), {
                driveCount: Number(entry.driveCount || 0),
                lastDriveDate: entry.lastDriveDate || null,
                companies: entry.companies || [],
                roles: entry.roles || [],
            }])
        );

        const placementMap = new Map(
            placementStats.map((entry) => [String(entry._id || '').trim(), {
                isPlaced: true,
                company: entry.company || '',
                role: entry.role || '',
                package: entry.package || '',
                placedDate: entry.placedDate || '',
            }])
        );

        const eligibleMap = new Map(
            eligibleStats.map((entry) => [String(entry._id || '').trim(), {
                eligibleDriveCount: Number(entry.eligibleDriveCount || 0),
                eligibleCompanies: entry.eligibleCompanies || [],
            }])
        );

        const normalizeBatch = (student) => student.batch || student.year || '';
        const normalizeSemester = (student) => student.currentSemester || student.semester || student.sem || '';

        // Transform and enrich students
        let students = rawStudents.map((student) => {
            const regNo = String(student.regNo || '').trim();
            const batch = normalizeBatch(student);
            const attendance = attendanceMap.get(regNo) || { driveCount: 0, lastDriveDate: null, companies: [], roles: [] };
            const placement = placementMap.get(regNo) || { isPlaced: false, company: '', role: '', package: '', placedDate: '' };
            const eligible = eligibleMap.get(regNo) || { eligibleDriveCount: 0, eligibleCompanies: [] };

            return {
                id: student._id ? String(student._id) : regNo,
                _id: student._id ? String(student._id) : regNo,
                regNo: regNo,
                firstName: student.firstName || '',
                lastName: student.lastName || '',
                name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim(),
                department: student.department || student.branch || '',
                branch: student.branch || student.department || '',
                batch,
                section: student.section || '',
                currentYear: student.currentYear || '',
                currentSemester: normalizeSemester(student),
                blocked: Boolean(student.isBlocked || student.blocked),
                // Extended fields
                cgpa: student.overallCGPA || '',
                skills: student.skillSet || '',
                backlogs: student.currentBacklogs || '0',
                tenthPercentage: student.tenthPercentage || '',
                twelfthPercentage: student.twelfthPercentage || '',
                gender: student.gender || '',
                city: student.city || '',
                // Attendance data
                driveCount: attendance.driveCount,
                lastDriveDate: attendance.lastDriveDate,
                attendedCompanies: attendance.companies,
                attendedRoles: attendance.roles,
                // Placement data
                isPlaced: placement.isPlaced,
                placedCompany: placement.company,
                placedRole: placement.role,
                package: placement.package,
                placedDate: placement.placedDate,
                // Eligibility data
                eligibleDriveCount: eligible.eligibleDriveCount,
                eligibleCompanies: eligible.eligibleCompanies,
            };
        });

        // Apply post-query filters
        if (filters.cgpaMin !== null && !isNaN(Number(filters.cgpaMin))) {
            const minCgpa = Number(filters.cgpaMin);
            students = students.filter((s) => {
                const cgpa = parseFloat(s.cgpa);
                return !isNaN(cgpa) && cgpa >= minCgpa;
            });
        }
        if (filters.cgpaMax !== null && !isNaN(Number(filters.cgpaMax))) {
            const maxCgpa = Number(filters.cgpaMax);
            students = students.filter((s) => {
                const cgpa = parseFloat(s.cgpa);
                return !isNaN(cgpa) && cgpa <= maxCgpa;
            });
        }
        if (filters.tenthMin !== null && !isNaN(Number(filters.tenthMin))) {
            const minTenth = Number(filters.tenthMin);
            students = students.filter((s) => {
                const tenth = parseFloat(s.tenthPercentage);
                return !isNaN(tenth) && tenth >= minTenth;
            });
        }
        if (filters.twelfthMin !== null && !isNaN(Number(filters.twelfthMin))) {
            const minTwelfth = Number(filters.twelfthMin);
            students = students.filter((s) => {
                const twelfth = parseFloat(s.twelfthPercentage);
                return !isNaN(twelfth) && twelfth >= minTwelfth;
            });
        }
        if (filters.driveCountMin !== null && !isNaN(Number(filters.driveCountMin))) {
            const minDrives = Number(filters.driveCountMin);
            students = students.filter((s) => s.driveCount >= minDrives);
        }
        if (filters.driveCountMax !== null && !isNaN(Number(filters.driveCountMax))) {
            const maxDrives = Number(filters.driveCountMax);
            students = students.filter((s) => s.driveCount <= maxDrives);
        }
        if (filters.isPlaced === true) {
            students = students.filter((s) => s.isPlaced === true);
        }
        if (filters.isPlaced === false) {
            students = students.filter((s) => s.isPlaced === false);
        }
        if (filters.placedCompany) {
            students = students.filter((s) => s.isPlaced && s.placedCompany.toLowerCase().includes(filters.placedCompany.toLowerCase()));
        }
        if (filters.packageMin !== null && !isNaN(Number(filters.packageMin))) {
            const minPkg = Number(filters.packageMin);
            students = students.filter((s) => {
                const pkg = parseFloat(String(s.package).replace(/[^\d.]/g, ''));
                return !isNaN(pkg) && pkg >= minPkg;
            });
        }
        if (filters.companyName || filters.jobRole) {
            students = students.filter((s) => s.driveCount > 0);
        }

        // Sorting
        const validSortFields = ['regNo', 'name', 'department', 'branch', 'batch', 'currentYear', 'currentSemester', 'driveCount', 'lastDriveDate', 'cgpa', 'package'];
        const sortBy = validSortFields.includes(filters.sortBy) ? filters.sortBy : 'regNo';
        const sortOrder = String(filters.sortOrder || 'asc').toLowerCase() === 'desc' ? -1 : 1;

        students.sort((left, right) => {
            let leftValue = left[sortBy] ?? '';
            let rightValue = right[sortBy] ?? '';

            if (['driveCount', 'eligibleDriveCount'].includes(sortBy)) {
                return (Number(leftValue || 0) - Number(rightValue || 0)) * sortOrder;
            }
            if (['cgpa', 'package'].includes(sortBy)) {
                const leftNum = parseFloat(String(leftValue).replace(/[^\d.]/g, '')) || 0;
                const rightNum = parseFloat(String(rightValue).replace(/[^\d.]/g, '')) || 0;
                return (leftNum - rightNum) * sortOrder;
            }
            if (sortBy === 'lastDriveDate') {
                const leftTime = leftValue ? new Date(leftValue).getTime() : 0;
                const rightTime = rightValue ? new Date(rightValue).getTime() : 0;
                return (leftTime - rightTime) * sortOrder;
            }
            return String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true, sensitivity: 'base' }) * sortOrder;
        });

        const total = students.length;

        res.json({
            success: true,
            students,
            total,
            columns,
            filters,
            reason: parsed.reason || '',
            model: 'ollama',
        });
    } catch (error) {
        console.error('AI student filter error:', error);
        res.status(500).json({
            error: 'Failed to apply AI student filter',
            details: error.message,
        });
    }
});

// Get student by ID
app.get('/api/students/:id', authenticateToken, checkRole('student', 'admin', 'coordinator'), async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { id } = req.params;

    try {
        console.log(`🔍 GET /api/students/${id} - MongoDB connected: ${isMongoConnected}`);
        if (isMongoConnected) {
            const student = await Student.findById(id);
            if (!student) {
                console.log(`❌ Student not found: ${id}`);
                return res.status(404).json({ error: 'Student not found' });            }
            console.log(`✅ Student found: ${student.regNo}`);
            res.json(student);
        } else {
            const student = students.find(s => s.id === id);
            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }
            res.json(student);
        }
    } catch (error) {
        console.error('❌ Get student error:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to get student', details: error.message });
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
app.put('/api/students/:id', authenticateToken, checkRole('student', 'admin', 'coordinator'), async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { id } = req.params;
    const updateData = req.body;

    console.log('=== BACKEND UPDATE STUDENT ===');
    console.log('Student ID:', id);
    console.log('Request headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Request body type:', typeof req.body);
    console.log('Request body:', req.body);
    console.log('Update data:', updateData);
    console.log('Has block fields:', updateData ? {
        blocked: 'blocked' in updateData,
        isBlocked: 'isBlocked' in updateData,
        blockedBy: updateData.blockedBy
    } : 'updateData is undefined');
    console.log('MongoDB connected:', isMongoConnected);

    try {
        if (isMongoConnected) {
            console.log('Updating student in MongoDB...');
            const previousStudent = await Student.findById(id).select('regNo dob').lean();
            const student = await Student.findByIdAndUpdate(id, updateData, { new: true });
            if (!student) {
                console.log('Student not found in MongoDB');
                return res.status(404).json({ error: 'Student not found' });
            }

            // Clear stale login cache entries so block/unblock takes effect on next login attempt.
            invalidateStudentLoginCache(previousStudent);
            invalidateStudentLoginCache(student);

            // Keep login cache payload aligned with the student-login response fields.
            // This prevents partial data immediately after unblock/update.
            const refreshedLoginCacheDoc = {
                _id: student._id,
                regNo: student.regNo,
                dob: student.dob,
                firstName: student.firstName,
                lastName: student.lastName,
                primaryEmail: student.primaryEmail,
                email: student.email,
                branch: student.branch,
                degree: student.degree,
                isBlocked: student.isBlocked,
                blocked: student.blocked,
                blockedBy: student.blockedBy,
                blockedByRole: student.blockedByRole,
                blockedByCabin: student.blockedByCabin,
                blockedAt: student.blockedAt,
                blockedReason: student.blockedReason,
                profilePicURL: student.profilePicURL || '',
                resumeData: student.resumeData || null,
                resumeURL: student.resumeURL || '',
                phone: student.phone || student.mobileNo || student.mobile || '',
                gender: student.gender || '',
                cgpa: student.cgpa || '',
                year: student.year || '',
                skills: student.skills || '',
                backlogs: student.backlogs || '0',
                tenthPercentage: student.tenthPercentage || '',
                twelfthPercentage: student.twelfthPercentage || '',
                companyPlaced: student.companyPlaced || '',
                packageOffered: student.packageOffered || '',
                placement: student.placement || '',
                driveCount: student.driveCount || 0
            };

            const refreshedCacheKey = getStudentLoginCacheKey(refreshedLoginCacheDoc);
            if (refreshedCacheKey) {
                setLoginCache(refreshedCacheKey, refreshedLoginCacheDoc);
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

// Delete student
app.delete('/api/students/:id', authenticateToken, checkRole('admin'), async (req, res) => {
    const { id } = req.params;

    try {
        const mongoReady = mongoose.connection.readyState === 1 || await ensureConnection();

        if (mongoReady) {
            const { ObjectId } = mongoose.Types;

            const mongoCandidateQueries = [];

            if (ObjectId.isValid(id)) {
                mongoCandidateQueries.push({ _id: new ObjectId(id) });
            }

            mongoCandidateQueries.push({ regNo: id });
            mongoCandidateQueries.push({ id });

            for (const query of mongoCandidateQueries) {
                const deleted = await Student.findOneAndDelete(query);
                if (deleted) {
                    return res.json({ message: 'Student deleted successfully' });
                }
            }
        }

        const initialLength = students.length;
        students = students.filter((student) => {
            const candidateIds = [student.id, student._id, student.regNo, String(student.regNo || '')];
            return !candidateIds.some(candidate => candidate && String(candidate) === String(id));
        });

        if (students.length !== initialLength) {
            return res.json({ message: 'Student deleted successfully (in-memory)' });
        }

        return res.status(404).json({ error: 'Student not found' });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ error: 'Failed to delete student', details: error.message });
    }
});

// ⚡ OPTIMIZED: Get student profile image only (lazy loading)
app.get('/api/students/:id/profile-image', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { id } = req.params;
    
    try {
        if (isMongoConnected) {
            const student = await Student.findById(id)
                .select('profilePicURL')
                .lean();
            
            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }
            
            res.json({ profilePicURL: student.profilePicURL || '' });
        } else {
            const student = students.find(s => s.id === id || String(s._id) === id);
            if (!student) {
                return res.status(404).json({ error: 'Student not found' });
            }
            res.json({ profilePicURL: student.profilePicURL || '' });
        }
    } catch (error) {
        console.error('Get profile image error:', error);
        res.status(500).json({ error: 'Failed to get profile image', details: error.message });
    }
});

// ⚡ SUPER FAST: Get complete student data (profile, resume, certificates) in ONE call
app.get('/api/students/:studentId/complete', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { studentId } = req.params;
    
    try {
        console.log(`🔍 GET /api/students/${studentId}/complete - MongoDB connected: ${isMongoConnected}`);
        let studentData = null;
        let resumeData = null;
        let certificatesData = [];
        
        if (isMongoConnected) {
            // Use Promise.all for parallel fetching - SUPER FAST!
            // Exclude large binary data (fileData) from certificates for faster transfer
            const [student, resume, certificates] = await Promise.all([
                Student.findById(studentId).lean(), // .lean() for faster queries
                Resume.findOne({ studentId }).select('-fileData').lean(), // Exclude resume file data
                Certificate.find({ studentId }).select('-fileData').lean() // Exclude certificate file data
            ]);
            
            studentData = student;
            resumeData = resume;
            certificatesData = certificates || [];
            console.log(`✅ Complete data fetched - Student: ${!!student}, Resume: ${!!resume}, Certs: ${certificates?.length || 0}`);
            
            // 🔍 DEBUG: Log first certificate GridFS data
            if (certificates && certificates.length > 0) {
                console.log('🔍 FIRST CERT IN DB:', {
                    id: certificates[0]._id,
                    fileName: certificates[0].fileName,
                    gridfsFileId: certificates[0].gridfsFileId,
                    gridfsFileUrl: certificates[0].gridfsFileUrl,
                    comp: certificates[0].comp || certificates[0].competition
                });
            }
        } else {
            // In-memory fallback
            studentData = students.find(s => (s._id || s.id) === studentId);
            resumeData = resumes.find(r => r.studentId === studentId);
            certificatesData = certificates.filter(c => c.studentId === studentId);
        }
        
        if (!studentData) {
            console.log(`❌ Student not found: ${studentId}`);
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
                ...studentData,
                certificates: toCertificatesResponse(certificatesData)
            },
            resume: resumeData ? {
                fileName: resumeData.fileName,
                fileSize: resumeData.fileSize,
                uploadedAt: resumeData.uploadedAt,
                analysisResult: resumeData.analysisResult
            } : null,
            certificates: toCertificatesResponse(certificatesData),
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

// Lightweight endpoint for checking student status (no heavy file data)
app.get('/api/students/:studentId/status', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { studentId } = req.params;
    
    try {
        console.log(`🔍 GET /api/students/${studentId}/status - MongoDB connected: ${isMongoConnected}`);
        let studentData = null;
        
        if (isMongoConnected) {
            // Only fetch student data without certificates/resume
            studentData = await Student.findById(studentId).select('-__v').lean();
            console.log(`✅ Student status fetched: ${!!studentData}`);
        } else {
            return res.status(503).json({
                error: 'Database not connected',
                details: 'Student status is temporarily unavailable while MongoDB is reconnecting.'
            });
        }
        
        if (!studentData) {
            console.log(`❌ Student not found for status check: ${studentId}`);
            return res.status(404).json({ error: 'Student not found' });
        }
        
        // Return minimal data for status checking
        res.json({
            success: true,
            student: {
                _id: studentData._id || studentData.id,
                regNo: studentData.regNo,
                firstName: studentData.firstName,
                lastName: studentData.lastName,
                isBlocked: Boolean(studentData.isBlocked),
                blocked: studentData.blocked || false,
                blockedBy: studentData.blockedBy || '',
                blockedByRole: studentData.blockedByRole || '',
                blockedByCabin: studentData.blockedByCabin || '',
                blockedReason: studentData.blockedReason || '',
                primaryEmail: studentData.primaryEmail || studentData.email
            }
        });
        
    } catch (error) {
        console.error('Student status fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch student status', details: error.message });
    }
});

// Update student profile (including profile photo)
app.put('/api/students/:studentId/profile', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { studentId } = req.params;
    const updateData = req.body;
    
    console.log('=== PROFILE UPDATE REQUEST ===');
    console.log('Student ID:', studentId);
    console.log('MongoDB Connected:', isMongoConnected);
    console.log('Update Data Keys:', Object.keys(updateData));
    console.log('Update Data:', JSON.stringify(updateData, null, 2));
    
    try {
        if (isMongoConnected) {
            // Use findByIdAndUpdate with proper options
            const updatedStudent = await Student.findByIdAndUpdate(
                studentId, 
                { $set: updateData }, // Use $set to ensure all fields are updated
                { 
                    new: true, // Return the updated document
                    runValidators: false, // Don't run validators to allow empty fields
                    strict: false // Allow fields not in schema
                }
            );
            
            if (!updatedStudent) {
                console.log('Student not found with ID:', studentId);
                return res.status(404).json({ error: 'Student not found' });
            }
            
            console.log('Profile updated successfully');
            console.log('Updated fields:', Object.keys(updateData));
            
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
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Failed to update profile', details: error.message });
    }
});

// Resume upload and analysis
app.post('/api/resume/upload', authenticateToken, checkRole('student'), upload.single('resume'), async (req, res) => {
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

// Get resume by student ID - Protected
app.get('/api/resume/:studentId', authenticateToken, checkRole('student', 'admin', 'coordinator'), async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { studentId } = req.params;

    try {
        if (isMongoConnected) {
            const resume = await Resume.findOne({ studentId });
            if (!resume) {
                return res.status(404).json({ error: 'Resume not found' });
            }
            // Add gridfs URL if file ID exists
            const resumeObj = resume.toObject();
            if (resumeObj.gridfsFileId && !resumeObj.gridfsFileUrl) {
                resumeObj.gridfsFileUrl = `/api/file/${resumeObj.gridfsFileId}`;
            }
            res.json({ resume: resumeObj });
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

// Resume analysis endpoint - uses local AI service for analysis
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
    fileData: { type: String }, // Legacy Base64 (empty for GridFS uploads)
    gridfsFileId: { type: String }, // GridFS file ID
    gridfsFileUrl: { type: String }, // GridFS URL e.g. /api/file/<id>
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadDate: { type: String, required: true },
    date: { type: String, default: '' },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    studentName: { type: String, default: '' },
    name: { type: String, default: '' },
    regNo: { type: String, default: '' },
    reg: { type: String, default: '' },
    section: { type: String, default: '' },
    department: { type: String, default: '' },
    degree: { type: String, default: '' },
    year: { type: String, default: '' },
    semester: { type: String, default: '' },
    competition: { type: String, default: '' },
    certificateName: { type: String, default: '' },
    comp: { type: String, default: '' },
    prize: { type: String, default: '' },
    verifiedAt: { type: Date, default: null },
    verifiedBy: { type: String, default: '' },
    notificationRead: { type: Boolean, default: true }, // false = student hasn't seen status change yet
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

certificateSchema.pre('save', function updateTimestamp(next) {
    this.updatedAt = new Date();
    next();
});

certificateSchema.pre('findOneAndUpdate', function setUpdatedAt(next) {
    this.set({ updatedAt: new Date() });
    next();
});

// Add indexes for faster queries
certificateSchema.index({ studentId: 1 });
certificateSchema.index({ studentId: 1, achievementId: 1 }, { unique: true });
certificateSchema.index({ status: 1 });
certificateSchema.index({ createdAt: -1 });

const Certificate = mongoose.model('Certificate', certificateSchema);

// Block notification schema
const blockNotificationSchema = new mongoose.Schema({
    recipientRole: {
        type: String,
        enum: ['admin', 'coordinator'],
        required: true
    },
    recipientIdentifier: {
        type: String,
        required: true,
        trim: true
    },
    recipientDepartment: {
        type: String,
        default: ''
    },
    actionType: {
        type: String,
        enum: ['blocked', 'unblocked'],
        required: true
    },
    studentId: {
        type: String,
        required: true,
        trim: true
    },
    regNo: {
        type: String,
        default: ''
    },
    studentName: {
        type: String,
        default: ''
    },
    branch: {
        type: String,
        default: ''
    },
    year: {
        type: String,
        default: ''
    },
    semester: {
        type: String,
        default: ''
    },
    actorRole: {
        type: String,
        default: ''
    },
    actorName: {
        type: String,
        default: ''
    },
    actorIdentifier: {
        type: String,
        default: ''
    },
    notificationRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

blockNotificationSchema.pre('save', function updateTimestamp(next) {
    this.updatedAt = new Date();
    next();
});

blockNotificationSchema.pre('findOneAndUpdate', function setUpdatedAt(next) {
    this.set({ updatedAt: new Date() });
    next();
});

blockNotificationSchema.index({ recipientRole: 1, recipientIdentifier: 1, notificationRead: 1, createdAt: -1 });
blockNotificationSchema.index({ recipientRole: 1, recipientDepartment: 1, notificationRead: 1, createdAt: -1 });

const BlockNotification = mongoose.models.BlockNotification || mongoose.model('BlockNotification', blockNotificationSchema);

const blockNotifications = [];

const formatStatus = (status) => {
    if (!status) return 'pending';
    const normalized = status.toString().trim().toLowerCase();
    if (['approved', 'rejected', 'pending'].includes(normalized)) {
        return normalized;
    }
    return 'pending';
};

const normalizeDepartment = (department) => {
    if (!department) return '';
    return department.toString().trim().toUpperCase();
};

const buildCertificatePayload = (certificateData = {}) => {
    const status = formatStatus(certificateData.status);
    const department = normalizeDepartment(
        certificateData.department ||
        certificateData.dept ||
        certificateData.branch ||
        certificateData.studentDepartment
    );

    const studentName = certificateData.studentName || certificateData.name || '';
    const competition =
        certificateData.certificateName ||
        certificateData.competition ||
        certificateData.comp ||
        certificateData.certName ||
        '';

    const registerNumber = certificateData.regNo || certificateData.reg || '';
    const degree =
        certificateData.degree ||
        certificateData.studentDegree ||
        certificateData.course ||
        certificateData.program ||
        '';

    const primaryDate =
        certificateData.date ||
        certificateData.eventDate ||
        certificateData.achievementDate ||
        certificateData.certificateDate ||
        certificateData.createdAt ||
        '';

    return {
        ...certificateData,
        status,
        department,
        degree,
        studentName,
        name: studentName,
        regNo: registerNumber,
        reg: registerNumber,
        section: certificateData.section || certificateData.sectionName || '',
        year: certificateData.year || certificateData.academicYear || '',
        semester: certificateData.semester || '',
        competition,
        certificateName: competition,
        comp: competition,
        prize: certificateData.prize || '',
        date: primaryDate,
        uploadDate: certificateData.uploadDate || new Date().toLocaleDateString('en-GB'),
        verifiedAt: certificateData.verifiedAt || null,
        verifiedBy: certificateData.verifiedBy || ''
    };
};

const toCertificateResponse = (certificateDoc) => {
    if (!certificateDoc) return null;

    const plain =
        typeof certificateDoc.toObject === 'function'
            ? certificateDoc.toObject({ getters: true })
            : { ...certificateDoc };

    const status = formatStatus(
        plain.status ||
        plain.Status ||
        plain.certStatus ||
        plain.state ||
        plain.statusText
    );

    return {
        id: (plain._id || plain.id || plain.achievementId || '').toString(),
        _id: plain._id || plain.id,
        certificateId: plain._id || plain.id,
        studentId: plain.studentId,
        achievementId: plain.achievementId,
        fileName: plain.fileName,
        fileData: plain.fileData, // Legacy base64 (empty for new uploads)
        gridfsFileId: plain.gridfsFileId || null,
        gridfsFileUrl: plain.gridfsFileUrl || (plain.gridfsFileId ? `/api/file/${plain.gridfsFileId}` : null),
        fileSize: plain.fileSize,
        fileType: plain.fileType,
        uploadDate: plain.uploadDate,
        date:
            plain.date ||
            plain.eventDate ||
            plain.achievementDate ||
            '',
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
        status,
        studentName: plain.studentName || plain.name || '',
        regNo: plain.regNo || plain.reg || '',
        section: plain.section || '',
        department: plain.department || '',
        degree: plain.degree || '',
        year: plain.year || '',
        semester: plain.semester || '',
        comp:
            plain.comp ||
            plain.certificateName ||
            plain.competition ||
            '',
        competition: plain.certificateName || plain.competition || plain.comp || '',
        prize: plain.prize || '',
        verifiedAt: plain.verifiedAt || null,
        verifiedBy: plain.verifiedBy || ''
    };
};

const toCertificatesResponse = (certificatesList = []) =>
    certificatesList
        .map(toCertificateResponse)
        .filter(Boolean);

// Certificate endpoints
app.post('/api/certificates', authenticateToken, checkRole('student', 'admin'), async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const certificateData = buildCertificatePayload(req.body);

    try {
        if (isMongoConnected) {
            const certificate = new Certificate(certificateData);
            await certificate.save();
            res.json({ message: 'Certificate created successfully', certificate: toCertificateResponse(certificate) });
        } else {
            // In-memory storage
            const inMemoryCertificate = {
                ...certificateData,
                id: Date.now().toString(),
                _id: Date.now().toString()
            };
            certificates.push(inMemoryCertificate);
            res.json({ message: 'Certificate created successfully (in-memory)', certificate: inMemoryCertificate });
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
            // OPTIMIZED: Use lean() for 50% faster queries
            const certificatesForStudent = await Certificate.find({ studentId }).lean();
            res.json(toCertificatesResponse(certificatesForStudent));
        } else {
            const studentCertificates = certificates
                .filter(c => c.studentId === studentId)
                .map(buildCertificatePayload);
            console.log(`Found ${studentCertificates.length} certificates for student ${studentId}`);
            res.json(toCertificatesResponse(studentCertificates));
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

            // Try string match first (most common case)
            let certificate = await Certificate.findOne({ studentId, achievementId });
            console.log('🔍 Backend: Certificate found (string achievementId):', certificate ? 'YES' : 'NO');

            // Fallback: some legacy documents store the ObjectId/_id only
            if (!certificate) {
                try {
                    certificate = await Certificate.findOne({ studentId, _id: achievementId });
                    console.log('🔍 Backend: Certificate found (ObjectId match):', certificate ? 'YES' : 'NO');
                } catch (idError) {
                    console.log('🔍 Backend: ObjectId lookup skipped (invalid id format)');
                }
            }

            // Fallback: numeric achievementId values stored as strings
            if (!certificate) {
                const achievementIdNum = parseInt(achievementId, 10);
                if (!Number.isNaN(achievementIdNum)) {
                    certificate = await Certificate.findOne({ studentId, achievementId: achievementIdNum.toString() });
                    console.log('🔍 Backend: Certificate found (numeric achievementId):', certificate ? 'YES' : 'NO');
                }
            }

            // Final fallback: certificateId field stored separately
            if (!certificate) {
                certificate = await Certificate.findOne({ studentId, certificateId: achievementId });
                console.log('🔍 Backend: Certificate found (certificateId field):', certificate ? 'YES' : 'NO');
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

// Get certificates with optional filters
app.get('/api/certificates', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const {
        department,
        status,
        studentId,
        regNo,
        search,
        includeFileData
    } = req.query;

    try {
        const buildFilters = () => {
            const filters = {};
            if (studentId) filters.studentId = studentId;
            if (department) filters.department = normalizeDepartment(department);
            if (status) filters.status = formatStatus(status);
            if (regNo) filters.regNo = regNo.toString().trim();
            return filters;
        };

        const filters = buildFilters();
        const statusList = status ? [formatStatus(status)] : null;

        if (isMongoConnected) {
            const mongoQuery = { ...filters };
            const certificatesQuery = Certificate.find(mongoQuery);

            if (search) {
                const regex = new RegExp(search.trim(), 'i');
                certificatesQuery.find({
                    $or: [
                        { studentName: regex },
                        { name: regex },
                        { certificateName: regex },
                        { competition: regex },
                        { regNo: regex }
                    ]
                });
            }

            const certificatesList = await certificatesQuery.sort({ createdAt: -1 });

            if (includeFileData === 'true') {
                res.json(certificatesList);
            } else {
                res.json(toCertificatesResponse(certificatesList));
            }
        } else {
            const normalizedDept = department ? normalizeDepartment(department) : null;
            let filteredCertificates = certificates;

            if (studentId) {
                filteredCertificates = filteredCertificates.filter(c => c.studentId === studentId);
            }

            if (normalizedDept) {
                filteredCertificates = filteredCertificates.filter(c => normalizeDepartment(c.department) === normalizedDept);
            }

            if (statusList) {
                filteredCertificates = filteredCertificates.filter(c => statusList.includes(formatStatus(c.status)));
            }

            if (regNo) {
                const regNorm = regNo.toString().trim();
                filteredCertificates = filteredCertificates.filter(c => (c.regNo || c.reg || '').toString().trim() === regNorm);
            }

            if (search) {
                const regex = new RegExp(search.trim(), 'i');
                filteredCertificates = filteredCertificates.filter(c => (
                    regex.test(c.studentName || c.name || '') ||
                    regex.test(c.certificateName || c.competition || c.comp || '') ||
                    regex.test(c.regNo || c.reg || '')
                ));
            }

            console.log(`Total certificates in memory: ${filteredCertificates.length}`);
            res.json(includeFileData === 'true' ? filteredCertificates : toCertificatesResponse(filteredCertificates));
        }
    } catch (error) {
        console.error('Get all certificates error:', error);
        res.status(500).json({ error: 'Failed to get certificates', details: error.message });
    }
});

// Department scoped certificates for coordinator dashboard
app.get('/api/certificates/department/:department', async (req, res) => {
    const { department } = req.params;
    const { status, search, includeFileData } = req.query;

    if (!department) {
        return res.status(400).json({ error: 'Department is required' });
    }

    const normalizedDept = normalizeDepartment(department);
    const normalizedStatus = status ? formatStatus(status) : null;

    const filters = {
        department: normalizedDept
    };

    if (normalizedStatus) {
        filters.status = normalizedStatus;
    }

    req.query.department = normalizedDept;
    req.query.status = normalizedStatus;
    req.query.search = search;
    req.query.includeFileData = includeFileData;

    // Delegate to the generic handler by reusing request values
    return app._router.handle(req, res, () => {}, 'get', '/api/certificates');
});

app.put('/api/certificates/:id', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { id } = req.params;
    const updateData = req.body;

    // When coordinator approves/rejects, mark as unread so student gets notified
    const newStatus = (updateData.status || '').toLowerCase();
    if (newStatus === 'approved' || newStatus === 'rejected') {
        updateData.notificationRead = false;
        console.log('🔔 Setting notificationRead=false for certificate', id, 'status:', newStatus);
    }

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
    const updateData = req.body || {};

    if (!isMongoConnected) {
        return res.status(503).json({
            error: 'Database not connected',
            details: 'Certificate data cannot be updated right now.'
        });
    }

    try {
        // Try to find by achievementId first, then by _id as a fallback
        const query = {
            studentId,
            $or: [
                { achievementId },
                { _id: mongoose.Types.ObjectId.isValid(achievementId) ? achievementId : null }
            ]
        };

        const updatedCertificate = await Certificate.findOneAndUpdate(
            query,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedCertificate) {
            return res.status(404).json({ error: 'Certificate not found' });
        }

        res.json({ message: 'Certificate updated successfully', certificate: updatedCertificate });
    } catch (error) {
        console.error('Update certificate error:', error);
        res.status(500).json({ error: 'Failed to update certificate', details: error.message });
    }
});

// ... (rest of the code remains the same)

// =====================================================
// CERTIFICATE NOTIFICATION ROUTES
// =====================================================

// One-time migration: set notificationRead=true on all legacy certificates that lack the field
// This prevents old approved/rejected certificates from flooding students with popups
(async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            const result = await Certificate.updateMany(
                { notificationRead: { $exists: false } },
                { $set: { notificationRead: true } }
            );
            if (result.modifiedCount > 0) {
                console.log(`📋 Migration: Set notificationRead=true on ${result.modifiedCount} legacy certificate(s)`);
            }
        } else {
            mongoose.connection.once('open', async () => {
                const result = await Certificate.updateMany(
                    { notificationRead: { $exists: false } },
                    { $set: { notificationRead: true } }
                );
                if (result.modifiedCount > 0) {
                    console.log(`📋 Migration: Set notificationRead=true on ${result.modifiedCount} legacy certificate(s)`);
                }
            });
        }
    } catch (err) {
        console.error('Migration error:', err);
    }
})();

// GET: Fetch unread certificate notifications for a student
// Accepts studentId (MongoDB _id) as primary, falls back to regNo
app.get('/api/certificates/notifications/:identifier', async (req, res) => {
    const { identifier } = req.params;
    if (!identifier) return res.status(400).json({ error: 'Student identifier required' });

    try {
        // Check if MongoDB is connected before querying
        if (mongoose.connection.readyState !== 1) {
            console.log('⚠️ MongoDB not connected yet, returning empty notifications');
            return res.json({
                success: true,
                notifications: [],
                message: 'Database connecting, please retry in a moment'
            });
        }

        // Query by studentId OR regNo so it works regardless of which is available
        const notifications = await Certificate.find({
            $or: [{ studentId: identifier }, { regNo: identifier }],
            status: { $in: ['approved', 'rejected'] },
            notificationRead: false
        }).select('_id achievementId comp competition certificateName status notificationRead updatedAt').lean();

        res.json({
            success: true,
            notifications: notifications.map(n => ({
                id: n._id,
                achievementId: n.achievementId,
                certificateName: n.comp || n.competition || n.certificateName || 'Certificate',
                status: n.status,
                updatedAt: n.updatedAt
            }))
        });
    } catch (error) {
        console.error('❌ Notifications fetch error:', error);

        // If connection error, return empty array instead of 500
        if (error.message?.includes('not connected') || error.message?.includes('connection')) {
            return res.json({
                success: true,
                notifications: [],
                message: 'Database temporarily unavailable'
            });
        }

        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// PATCH: Mark certificate notifications as read for a student
app.patch('/api/certificates/notifications/mark-read', async (req, res) => {
    const { regNo, studentId, certificateIds } = req.body;
    const identifier = studentId || regNo;
    if (!identifier) return res.status(400).json({ error: 'Student identifier required' });

    try {
        const query = {
            $or: [{ studentId: identifier }, { regNo: identifier }],
            notificationRead: false
        };
        if (certificateIds && certificateIds.length > 0) {
            // Convert string IDs to ObjectIds for proper _id matching
            query._id = {
                $in: certificateIds.map(id =>
                    mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
                )
            };
        }

        const result = await Certificate.updateMany(query, { $set: { notificationRead: true } });
        console.log(`✅ Marked ${result.modifiedCount} notification(s) as read for ${regNo} (ids: ${certificateIds})`);
        res.json({ success: true, updated: result.modifiedCount });
    } catch (error) {
        console.error('❌ Mark notifications read error:', error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});

const buildBlockNotificationStudentPayload = (student = {}) => ({
    studentId: (student.studentId || student._id || student.id || '').toString().trim(),
    regNo: (student.regNo || student.registerNo || student.reg || '').toString().trim(),
    studentName: (student.studentName || student.name || [student.firstName, student.lastName].filter(Boolean).join(' ') || '').toString().trim(),
    branch: (student.branch || student.department || student.degree || '').toString().trim().toUpperCase(),
    year: (student.year || student.currentYear || '').toString().trim(),
    semester: (student.semester || student.currentSemester || student.sem || '').toString().trim()
});

const buildBlockNotificationRecord = ({ recipientRole, recipientIdentifier, recipientDepartment, actionType, student, actor }) => ({
    recipientRole,
    recipientIdentifier,
    recipientDepartment: recipientDepartment || '',
    actionType,
    studentId: student.studentId || student.regNo || student.studentName || Date.now().toString(),
    regNo: student.regNo || '',
    studentName: student.studentName || '',
    branch: student.branch || '',
    year: student.year || '',
    semester: student.semester || '',
    actorRole: actor?.role || '',
    actorName: actor?.name || '',
    actorIdentifier: actor?.identifier || '',
    notificationRead: false,
    createdAt: new Date(),
    updatedAt: new Date()
});

app.post('/api/block-notifications', authenticateToken, checkRole('admin', 'coordinator'), async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const {
        targetRole,
        recipientRole,
        role,
        actionType,
        type,
        status,
        state,
        isBlocked,
        students = [],
        studentRecords = [],
        records = [],
        selectedStudents = [],
        student = null,
        actor = {}
    } = req.body || {};

    const effectiveStudents =
        (Array.isArray(students) && students.length ? students : null) ||
        (Array.isArray(studentRecords) && studentRecords.length ? studentRecords : null) ||
        (Array.isArray(records) && records.length ? records : null) ||
        (Array.isArray(selectedStudents) && selectedStudents.length ? selectedStudents : null) ||
        (student ? [student] : []);

    const normalizedActorRole = (actor?.role || '').toString().trim().toLowerCase();
    const inferredTargetRole = (targetRole || recipientRole || role || '').toString().trim().toLowerCase() || (
        normalizedActorRole === 'admin' ? 'coordinator' :
        normalizedActorRole === 'coordinator' ? 'admin' :
        ''
    );
    const rawActionType = (actionType || type || status || state || '').toString().trim().toLowerCase();
    const normalizedActionType =
        rawActionType === 'blocked' || rawActionType === 'block' || rawActionType === 'blocked-account'
            ? 'blocked'
            : rawActionType === 'unblocked' || rawActionType === 'unblock' || rawActionType === 'unblocked-account'
                ? 'unblocked'
                : typeof isBlocked === 'boolean'
                    ? (isBlocked ? 'blocked' : 'unblocked')
                    : '';

    if (!Array.isArray(effectiveStudents) || effectiveStudents.length === 0) {
        return res.status(400).json({ error: 'At least one student is required' });
    }

    try {
        const normalizedTargetRole = ['admin', 'coordinator'].includes(inferredTargetRole)
            ? inferredTargetRole
            : (normalizedActorRole === 'admin' ? 'coordinator' : 'admin');

        const notificationRecords = [];
        const actorPayload = {
            role: normalizedActorRole,
            name: (actor.name || '').toString().trim(),
            identifier: (actor.identifier || '').toString().trim()
        };

        console.log('🔔 [BlockNotifications] Create request:', {
            targetRole: normalizedTargetRole,
            actionType: normalizedActionType || 'blocked',
            actorRole: actorPayload.role,
            studentCount: Array.isArray(effectiveStudents) ? effectiveStudents.length : 0
        });

        const effectiveActionType = normalizedActionType || 'blocked';
        if (!normalizedActionType) {
            console.warn('⚠️ [BlockNotifications] Missing actionType in payload, defaulting to blocked', req.body);
        }

        if (normalizedTargetRole === 'admin') {
            effectiveStudents.forEach((studentItem) => {
                const student = buildBlockNotificationStudentPayload(studentItem);
                notificationRecords.push(buildBlockNotificationRecord({
                    recipientRole: 'admin',
                    recipientIdentifier: 'admin',
                    recipientDepartment: '',
                    actionType: effectiveActionType,
                    student,
                    actor: actorPayload
                }));
            });
        } else {
            for (const studentItem of effectiveStudents) {
                const student = buildBlockNotificationStudentPayload(studentItem);
                const branch = student.branch;

                if (!branch) {
                    continue;
                }

                notificationRecords.push(buildBlockNotificationRecord({
                    recipientRole: 'coordinator',
                    recipientIdentifier: branch,
                    recipientDepartment: branch,
                    actionType: effectiveActionType,
                    student,
                    actor: actorPayload
                }));
            }
        }

        if (!notificationRecords.length) {
            return res.json({ success: true, created: 0, notifications: [] });
        }

        if (isMongoConnected) {
            try {
                const createdNotifications = await BlockNotification.insertMany(notificationRecords);
                return res.json({
                    success: true,
                    created: createdNotifications.length,
                    notifications: createdNotifications.map((notification) => ({
                        id: notification._id,
                        recipientRole: notification.recipientRole,
                        recipientIdentifier: notification.recipientIdentifier,
                        recipientDepartment: notification.recipientDepartment,
                        actionType: notification.actionType,
                        studentId: notification.studentId,
                        regNo: notification.regNo,
                        studentName: notification.studentName,
                        branch: notification.branch,
                        year: notification.year,
                        semester: notification.semester,
                        actorRole: notification.actorRole,
                        actorName: notification.actorName,
                        actorIdentifier: notification.actorIdentifier,
                        notificationRead: notification.notificationRead,
                        createdAt: notification.createdAt
                    }))
                });
            } catch (dbError) {
                console.warn('⚠️ [BlockNotifications] Mongo insert failed, falling back to in-memory store:', dbError.message);
            }
        }

        const createdInMemory = notificationRecords.map((notification) => ({
            ...notification,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
        }));
        blockNotifications.push(...createdInMemory);

        return res.json({
            success: true,
            created: createdInMemory.length,
            notifications: createdInMemory
        });
    } catch (error) {
        console.error('❌ Block notification create error:', error);
        res.status(500).json({ error: 'Failed to create block notifications', details: error.message });
    }
});

app.get('/api/block-notifications', authenticateToken, checkRole('admin', 'coordinator'), async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');

    const isMongoConnected = mongoose.connection.readyState === 1;
    const { role, identifier, department } = req.query || {};
    const normalizedRole = (role || '').toString().trim().toLowerCase();
    const normalizedIdentifier = (identifier || '').toString().trim();
    const normalizedDepartment = normalizeDepartment(department);
    const coordinatorKeys = Array.from(
        new Set(
            [normalizedIdentifier, normalizedDepartment]
                .map((value) => (value || '').toString().trim().toUpperCase())
                .filter(Boolean)
        )
    );

    if (!['admin', 'coordinator'].includes(normalizedRole)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    if (!normalizedIdentifier) {
        return res.status(400).json({ error: 'Recipient identifier is required' });
    }

    try {
        const query = normalizedRole === 'coordinator'
            ? {
                recipientRole: normalizedRole,
                notificationRead: false,
                $or: [
                    { recipientIdentifier: { $in: coordinatorKeys } },
                    { recipientDepartment: { $in: coordinatorKeys } }
                ]
            }
            : {
                recipientRole: normalizedRole,
                recipientIdentifier: normalizedIdentifier,
                notificationRead: false
            };

        let notifications;
        if (isMongoConnected) {
            try {
                notifications = await BlockNotification.find(query).sort({ createdAt: 1 }).lean();
            } catch (dbError) {
                console.warn('⚠️ [BlockNotifications] Mongo fetch failed, falling back to in-memory store:', dbError.message);
                notifications = null;
            }
        }

        if (!Array.isArray(notifications)) {
            notifications = blockNotifications.filter((notification) => {
                const isRoleMatch = notification.recipientRole === normalizedRole;
                const notificationIdentifier = (notification.recipientIdentifier || '').toString().trim().toUpperCase();
                const notificationDepartment = (notification.recipientDepartment || '').toString().trim().toUpperCase();
                const isCoordinatorMatch = normalizedRole === 'coordinator'
                    ? coordinatorKeys.includes(notificationIdentifier) || coordinatorKeys.includes(notificationDepartment)
                    : notificationIdentifier === normalizedIdentifier;
                return isRoleMatch && isCoordinatorMatch && !notification.notificationRead;
            });
        }

        return res.json({
            success: true,
            notifications: notifications.map((notification) => ({
                id: notification._id || notification.id,
                recipientRole: notification.recipientRole,
                recipientIdentifier: notification.recipientIdentifier,
                recipientDepartment: notification.recipientDepartment,
                actionType: notification.actionType,
                studentId: notification.studentId,
                regNo: notification.regNo,
                studentName: notification.studentName,
                branch: notification.branch,
                year: notification.year,
                semester: notification.semester,
                actorRole: notification.actorRole,
                actorName: notification.actorName,
                actorIdentifier: notification.actorIdentifier,
                notificationRead: notification.notificationRead,
                createdAt: notification.createdAt
            }))
        });
    } catch (error) {
        console.error('❌ Block notification fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch block notifications', details: error.message });
    }
});

app.patch('/api/block-notifications/mark-read', authenticateToken, checkRole('admin', 'coordinator'), async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { role, identifier, department, notificationIds = [] } = req.body || {};
    const normalizedRole = (role || '').toString().trim().toLowerCase();
    const normalizedIdentifier = (identifier || '').toString().trim();
    const normalizedDepartment = normalizeDepartment(department);
    const coordinatorKeys = Array.from(
        new Set(
            [normalizedIdentifier, normalizedDepartment]
                .map((value) => (value || '').toString().trim().toUpperCase())
                .filter(Boolean)
        )
    );

    if (!['admin', 'coordinator'].includes(normalizedRole)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    if (!normalizedIdentifier) {
        return res.status(400).json({ error: 'Recipient identifier is required' });
    }

    try {
        const query = normalizedRole === 'coordinator'
            ? {
                recipientRole: normalizedRole,
                notificationRead: false,
                $or: [
                    { recipientIdentifier: { $in: coordinatorKeys } },
                    { recipientDepartment: { $in: coordinatorKeys } }
                ]
            }
            : {
                recipientRole: normalizedRole,
                recipientIdentifier: normalizedIdentifier,
                notificationRead: false
            };

        if (Array.isArray(notificationIds) && notificationIds.length > 0) {
            query._id = {
                $in: notificationIds.map((id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id))
            };
        }

        if (isMongoConnected) {
            try {
                const result = await BlockNotification.updateMany(query, { $set: { notificationRead: true } });
                return res.json({ success: true, updated: result.modifiedCount });
            } catch (dbError) {
                console.warn('⚠️ [BlockNotifications] Mongo mark-read failed, falling back to in-memory store:', dbError.message);
            }
        }

        let updated = 0;
        blockNotifications.forEach((notification) => {
            const isRoleMatch = notification.recipientRole === normalizedRole;
            const notificationIdentifier = (notification.recipientIdentifier || '').toString().trim().toUpperCase();
            const notificationDepartment = (notification.recipientDepartment || '').toString().trim().toUpperCase();
            const isCoordinatorMatch = normalizedRole === 'coordinator'
                ? coordinatorKeys.includes(notificationIdentifier) || coordinatorKeys.includes(notificationDepartment)
                : notificationIdentifier === normalizedIdentifier;
            const isIdMatch = !Array.isArray(notificationIds) || notificationIds.length === 0 || notificationIds.includes(notification.id);
            if (isRoleMatch && isCoordinatorMatch && isIdMatch && !notification.notificationRead) {
                notification.notificationRead = true;
                updated += 1;
            }
        });

        return res.json({ success: true, updated });
    } catch (error) {
        console.error('❌ Block notification mark-read error:', error);
        res.status(500).json({ error: 'Failed to mark block notifications as read', details: error.message });
    }
});

// =====================================================
// GRIDFS FILE ROUTES (Upload, Fetch, Stream)
// =====================================================
const gridfsRoutes = require('./routes/gridfsRoutes');
app.use('/api', gridfsRoutes);

// --- Server Startup Logic ---
// (startServer is already defined above in the middleware section)

// Server startup logic - works for both development and production (Render)
if (process.env.NODE_ENV !== 'production' || process.env.RENDER) {
    // Development or Render production - start HTTP server first.
    // DB initializes in background so clients get clean 503 responses instead of connection refused.
    app.listen(PORT, () => {
        console.log(`✅ Placement Portal Server running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🚀 Status: HTTP server ready (database initialization in progress)`);

        // JWT Status Information
        console.log('\n🔐 JWT AUTHENTICATION STATUS: ACTIVE');
        console.log('🕐 Token Duration: 6 hours');
        console.log('🛡️  Protected Endpoints:');
        console.log('   ✅ Student routes protected');
        console.log('   ✅ Admin routes protected');
        console.log('   ✅ Coordinator routes protected');
        console.log('   ✅ Role-based access control enabled\n');
    });

    Promise.resolve().then(async () => {
        try {
            console.log('🔄 Initializing database connection...');
            const isMongoConnected = await startServer();
            dbInitialized = true;
            if (isMongoConnected) {
                console.log('✅ Database initialized successfully (MongoDB Atlas connected)');
            } else {
                console.warn('⚠️ Database initialization completed with fallback mode (MongoDB unavailable)');
            }
        } catch (error) {
            console.error('❌ Database background initialization failed:', error.message);
            console.warn('⚠️ Server will stay up and continue retrying MongoDB on incoming requests.');
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
                await migrateTrainingCollection();
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
        res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Cache-Control,Pragma,Expires');
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
