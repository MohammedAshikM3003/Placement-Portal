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
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
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
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
        exposedHeaders: ['Content-Type', 'Authorization'],
        optionsSuccessStatus: 200
    }));
} catch (corsError) {
    console.error('CORS middleware error:', corsError);
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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

const findCompanyInMemory = (id) => {
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

app.get('/api/admin/companies', async (req, res) => {
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

app.post('/api/admin/companies', async (req, res) => {
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

        res.status(200).json({ message: 'Company drive deleted successfully', drive: deletedDrive });
    } catch (error) {
        console.error('Delete company drive error:', error);
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

        const drives = await CompanyDrive.find({}).sort({ createdAt: -1 });
        res.status(200).json({ drives });
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

app.get('/api/coordinators/:coordinatorId', async (req, res) => {
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
            const coordinators = await Coordinator.find({}).sort({ createdAt: -1 });
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
    visitDate: { type: Date },
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
    visitDate: { type: Date },
    lastDateToApply: { type: Date },
    roundDetails: [{ type: String }] // For dynamic round details
}, { timestamps: true, strict: false });

const CompanyDrive = mongoose.model('CompanyDrive', companyDriveSchema, 'companies drives');

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
let coordinators = [];
let companyRecords = [];

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

// Branch Endpoints
app.get('/api/branches', async (req, res) => {
    try {
        const mongoReady = mongoose.connection.readyState === 1 || await ensureConnection();

        if (!mongoReady) {
            return res.status(503).json({
                error: 'Branch data unavailable',
                details: 'MongoDB is not connected, so branch data cannot be retrieved right now.'
            });
        }

        const branches = await Branch.find({}).sort({ branchFullName: 1 });
        return res.json({
            branches: branches
                .filter(branch => branch?.isActive !== false)
                .map(branch => ({
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

// Coordinator login endpoint
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

    if (isMongoConnected) {
        try {
            const coordinatorQuery = {
                $or: [
                    { coordinatorId: identifier },
                    { username: identifier },
                    { email: identifier },
                    { domainEmail: identifier }
                ]
            };

            const findPromise = Coordinator.findOne(coordinatorQuery).lean();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Coordinator lookup timeout')), 10000)
            );

            coordinatorDoc = await Promise.race([findPromise, timeoutPromise]);
        } catch (mongoError) {
            console.error('Coordinator login MongoDB query failed:', mongoError.message);
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

    if (isMongoConnected && coordinatorDoc._id) {
        try {
            await Coordinator.findByIdAndUpdate(coordinatorDoc._id, {
                lastLogin: new Date()
            });
        } catch (updateError) {
            console.error('Failed to update coordinator lastLogin:', updateError.message);
        }
    }

    const coordinatorPayload = sanitizeCoordinator(coordinatorDoc) || {};
    if (!coordinatorPayload.coordinatorId) {
        coordinatorPayload.coordinatorId = coordinatorDoc.coordinatorId;
    }

    const token = jwt.sign({
        userId: coordinatorDoc._id || coordinatorDoc.id || coordinatorPayload._id,
        coordinatorId: coordinatorPayload.coordinatorId,
        role: 'coordinator'
    }, JWT_SECRET, { expiresIn: '24h' });

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

        if (student.isBlocked) {
            console.log('Login failed: Student is blocked.', regNo);
            let coordinatorDetails = { name: 'the placement office', cabin: 'N/A' };
            
            if (isMongoConnected) {
                const coordinator = await Coordinator.findOne({ department: student.department });
                if (coordinator) {
                    coordinatorDetails = {
                        name: `${coordinator.firstName} ${coordinator.lastName}`,
                        cabin: coordinator.cabin || 'N/A'
                    };
                }
            }
            return res.status(403).json({ 
                error: 'Your account is blocked.',
                isBlocked: true,
                coordinator: coordinatorDetails
            });
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

app.get('/api/students', async (req, res) => {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { name, regNo, department, batch } = req.query;

    try {
        if (isMongoConnected) {
            const query = {};
            if (regNo) query.regNo = { $regex: regNo, $options: 'i' };
            if (department) query.department = department;
            if (batch) {
                query.$or = [{ batch }, { year: batch }];
            }
            if (name) {
                query.$or = [
                    { firstName: { $regex: name, $options: 'i' } },
                    { lastName: { $regex: name, $options: 'i' } }
                ];
            }

            const list = await Student.find(query).limit(1000);
            res.json(list);
        } else {
            let list = students.slice();
            if (regNo) list = list.filter(s => String(s.regNo).toLowerCase().includes(String(regNo).toLowerCase()));
            if (department) list = list.filter(s => (s.department || s.branch) === department);
            if (batch) list = list.filter(s => (s.batch || s.year) === batch);
            if (name) {
                const n = String(name).toLowerCase();
                list = list.filter(s => (`${s.firstName || ''} ${s.lastName || ''} ${s.name || ''}`).toLowerCase().includes(n));
            }
            res.json(list);
        }
    } catch (error) {
        console.error('List students error:', error);
        res.status(500).json({ error: 'Failed to list students' });
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

// Delete student
app.delete('/api/students/:id', async (req, res) => {
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
        fileSize: plain.fileSize,
        fileType: plain.fileType,
        uploadDate: plain.uploadDate,
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
app.post('/api/certificates', async (req, res) => {
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
            const certificatesForStudent = await Certificate.find({ studentId });
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