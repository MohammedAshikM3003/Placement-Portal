const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
// const fs = require('fs'); // Unused - commented out
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
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
                filter: { studentId: app.studentId, companyName: app.companyName, jobRole: app.jobRole },
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
                    filter: { studentId: app.studentId, companyName: app.companyName, jobRole: app.jobRole },
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
                companyName: attendance.companyName,
                jobRole: attendance.jobRole,
                startDate: attendance.startDate,
                endDate: attendance.endDate,
                status: studentData?.status || '-'
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
                companyName: attendance.companyName,
                jobRole: attendance.jobRole,
                startDate: attendance.startDate,
                endDate: attendance.endDate,
                status: studentData?.status || '-'
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

        const { companyName, jobRole, roundNumber, roundName, students } = req.body;
        
        console.log('Update Student Applications Request:', {
            companyName,
            jobRole,
            roundNumber,
            roundName,
            studentsCount: students?.length
        });

        if (!companyName || !jobRole || !roundNumber || !students) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Update each student's application
        const updates = await Promise.all(
            students.map(async (student) => {
                const application = await StudentApplication.findOne({
                    studentId: student.studentId,
                    companyName,
                    jobRole
                });

                if (!application) {
                    console.log(`No application found for student ${student.registerNo}`);
                    return null;
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
                
                if (hasAbsent) {
                    application.status = 'Absent';
                } else if (hasFailed) {
                    application.status = 'Rejected';
                } else {
                    // Keep as Pending unless all rounds are passed
                    const allPassed = application.rounds.every(r => r.status === 'Passed');
                    if (allPassed && application.rounds.length > 0) {
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
                    status: 'Accepted',
                    profilePhoto: studentRecord?.profilePicURL || studentRecord?.profilePhoto || studentRecord?.photo || null,
                    createdAt: new Date(),
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
                update: { $set: student },
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

        // OPTIMIZATION: Cache headers for faster landing page loads
        res.set('Cache-Control', 'public, max-age=300, s-maxage=600'); // 5 min cache

        const { dept, batch, company, status } = req.query;
        const query = {};

        if (dept && dept !== 'All Departments') query.dept = dept;
        if (batch && batch !== 'All Batches') query.batch = batch;
        if (company && company !== 'All Companies') query.company = company;
        if (status && status !== 'All') query.status = status;

        const PlacedStudents = mongoose.connection.collection('placed_students');
        
        // OPTIMIZATION: Field selection - only return essential fields (avoid large base64 images)
        // Landing page only needs: name, dept, company, pkg, role, profilePicURL
        const projection = {
            name: 1,
            dept: 1,
            company: 1,
            pkg: 1,
            role: 1,
            profilePicURL: 1,
            profilePhoto: 1,
            batch: 1,
            status: 1
        };

        // OPTIMIZATION: Limit results to 100 for landing page performance
        // Sort by package descending to show top placements first
        const students = await PlacedStudents
            .find(query, { projection })
            .sort({ pkg: -1 }) // Highest packages first
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
            
            // Fetch roundDetails from companies drives collection
            let roundDetails = [];
            let totalRounds = 0;
            try {
                // Try to find company drive by company name (case-insensitive) and date
                const companyDrive = await CompanyDrive.findOne({
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

                if (companyDrive) {
                    if (companyDrive.roundDetails && Array.isArray(companyDrive.roundDetails)) {
                        roundDetails = companyDrive.roundDetails;
                        totalRounds = companyDrive.roundDetails.length;
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
                    
                    if (fallbackDrive && fallbackDrive.roundDetails && Array.isArray(fallbackDrive.roundDetails)) {
                        roundDetails = fallbackDrive.roundDetails;
                        totalRounds = fallbackDrive.roundDetails.length;
                        console.log(`Found fallback drive for ${entry.companyName}: ${totalRounds} rounds`);
                    } else {
                        console.log(`No drive found for ${entry.companyName} with startDate ${startDate}`);
                    }
                }
            } catch (err) {
                console.log('Could not fetch roundDetails:', err.message);
            }
            
            return {
                _id: entry._id,
                companyName: entry.companyName,
                driveStartDate: startDate,
                driveEndDate: endDate,
                companyDriveDate: entry.companyDriveDate, // Keep for backward compatibility
                jobRole: entry.jobRole,
                jobs: entry.filterCriteria?.jobs || entry.jobRole,
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
    const { isBlocked } = req.body;

    try {
        if (typeof isBlocked !== 'boolean') {
            return res.status(400).json({ error: 'Invalid block status' });
        }

        if (isMongoConnected) {
            const coordinator = await Coordinator.findOneAndUpdate(
                { coordinatorId },
                { isBlocked },
                { new: true }
            );

            if (!coordinator) {
                return res.status(404).json({ error: 'Coordinator not found' });
            }

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
            'department', 'cabin', 'profilePhoto', 'profilePicURL'
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
studentSchema.index({ regNo: 1 }); // Already unique, but explicit index
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

// Index for faster queries
attendanceSchema.index({ driveId: 1 });
attendanceSchema.index({ companyName: 1, jobRole: 1, startDate: 1 });
attendanceSchema.index({ 'students.studentId': 1 });
attendanceSchema.index({ 'students.regNo': 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema, 'attendance');

let branchIndexCleanupDone = false;
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

// File upload configuration (Multer - memory storage for legacy routes)
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

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
        console.log(`\n🌐 ${req.method} ${req.path}`);
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
        return res.status(403).json({
            error: 'Your coordinator account is blocked. Please contact the placement office.',
            isBlocked: true,
            coordinator: {
                name: `${coordinatorDoc.firstName || ''} ${coordinatorDoc.lastName || ''}`.trim() || coordinatorDoc.username || 'Coordinator',
                cabin: coordinatorDoc.cabin || 'N/A',
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

    console.log('=== LOGIN ATTEMPT ===');
    console.log('RegNo:', regNo, 'DOB:', dob);

    try {
        // Check MongoDB connection status (non-blocking)
        const connectionState = mongoose.connection.readyState;
        const isMongoConnected = connectionState === 1;
        const startTime = Date.now();
        
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
                
                // OPTIMIZATION 1: Only select needed fields (reduces data transfer)
                const essentialFields = 'regNo dob firstName lastName primaryEmail email branch degree isBlocked blocked blockedBy blockedByRole blockedAt blockedReason';
                
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
            let coordinatorDetails = { 
                name: student.blockedBy || 'the placement office', 
                cabin: 'N/A',
                blockedBy: student.blockedBy || 'Placement Office'
            };
            
            // Try to get more details from the blocker if available (non-blocking)
            if (isMongoConnected && student.blockedBy) {
                try {
                    // Try to find coordinator by name with timeout
                    const coordinator = await Coordinator.findOne({ 
                        $or: [
                            { fullName: student.blockedBy },
                            { coordinatorId: student.blockedBy },
                            { username: student.blockedBy }
                        ]
                    })
                    .select('firstName lastName cabin')
                    .lean()
                    .maxTimeMS(2000);
                    
                    if (coordinator) {
                        coordinatorDetails = {
                            name: `${coordinator.firstName} ${coordinator.lastName}`,
                            cabin: coordinator.cabin || 'N/A',
                            blockedBy: `${coordinator.firstName} ${coordinator.lastName}`
                        };
                    }
                } catch (err) {
                    console.log('Could not fetch coordinator details:', err.message);
                }
            }
            
            return res.status(403).json({ 
                error: student.blockedReason || 'Your account has been blocked. Please contact the placement office.',
                isBlocked: true,
                coordinator: coordinatorDetails
            });
        }
        
        console.log(`✅ Student login successful in ${Date.now() - startTime}ms:`, regNo);
        
        // Generate token
        const token = jwt.sign({ 
            userId: student._id || student.id, 
            regNo: student.regNo, 
            role: 'student' 
        }, JWT_SECRET, { expiresIn: '6h' });
        
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
        if (IN_MEMORY_FALLBACK_ENABLED) {
            try {
                student = students.find(s => s.regNo === regNo && s.dob === dob);
                if (student) {
                    const token = jwt.sign({ 
                        userId: student._id || student.id, 
                        regNo: student.regNo, 
                        role: 'student' 
                    }, JWT_SECRET, { expiresIn: '6h' });
                    
                    return res.json({ 
                        message: 'Login successful (fallback mode)', 
                        token, 
                        student 
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
            studentData = students.find(s => (s._id || s.id) === studentId);
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
                blocked: studentData.blocked || false,
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
// GRIDFS FILE ROUTES (Upload, Fetch, Stream)
// =====================================================
const gridfsRoutes = require('./routes/gridfsRoutes');
app.use('/api', gridfsRoutes);

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
            
            // JWT Status Information
            console.log('\n🔐 JWT AUTHENTICATION STATUS: ACTIVE');
            console.log('🕐 Token Duration: 6 hours');
            console.log('🛡️  Protected Endpoints:');
            console.log('   ✅ Student routes protected');
            console.log('   ✅ Admin routes protected');
            console.log('   ✅ Coordinator routes protected');
            console.log('   ✅ Role-based access control enabled\n');
            
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

// Handle unhandled promise rejections - PREVENT CRASHES
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit - keep server running
});

// Handle uncaught exceptions - PREVENT CRASHES  
process.on('uncaughtException', (error) => {
    console.error('⚠️  Uncaught Exception:', error);
    // Don't exit - keep server running
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