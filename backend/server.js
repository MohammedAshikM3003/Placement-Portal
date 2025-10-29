const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Listen on all network interfaces

// Middleware - Allow all origins for dev tunnels
app.use(cors({
  origin: '*', // Allow all origins for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Initialize Firebase Admin SDK
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();

// Validation schemas
const studentLoginSchema = Joi.object({
  regNo: Joi.string().required(),
  dob: Joi.string().pattern(/^\d{8}$/).required() // DDMMYYYY format
});

const coordinatorLoginSchema = Joi.object({
  coordinatorId: Joi.string().required(),
  password: Joi.string().required()
});

const adminLoginSchema = Joi.object({
  adminId: Joi.string().required(),
  password: Joi.string().required()
});

const createStudentSchema = Joi.object({
  regNo: Joi.string().required(),
  dob: Joi.string().pattern(/^\d{8}$/).required(),
  email: Joi.string().email().required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  department: Joi.string().required()
});

// Helper function to create custom token
async function createCustomToken(uid, additionalClaims = {}) {
  try {
    const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
    return customToken;
  } catch (error) {
    console.error('Error creating custom token:', error);
    throw new Error('Failed to create authentication token');
  }
}

// Helper function to create user in Firebase Auth
async function createFirebaseUser(email, password) {
  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: false
    });
    return userRecord;
  } catch (error) {
    console.error('Error creating Firebase user:', error);
    throw new Error('Failed to create user account');
  }
}

// Helper function to create user document in Firestore
async function createUserDocument(uid, userData) {
  try {
    await db.collection('users').doc(uid).set({
      ...userData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating user document:', error);
    throw new Error('Failed to create user profile');
  }
}

// Routes

// Student login
app.post('/api/auth/student-login', async (req, res) => {
  try {
    const { error, value } = studentLoginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { regNo, dob } = value;

    // Check if student exists in Firestore
    const studentsSnapshot = await db.collection('students')
      .where('regNo', '==', regNo)
      .where('dob', '==', dob)
      .limit(1)
      .get();

    if (studentsSnapshot.empty) {
      return res.status(401).json({ message: 'Invalid registration number or date of birth' });
    }

    const studentDoc = studentsSnapshot.docs[0];
    const studentData = studentDoc.data();
    const studentId = studentDoc.id;

    // Check if user is blocked
    const userDoc = await db.collection('users').doc(studentId).get();
    if (userDoc.exists() && userDoc.data().isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact administrator.' });
    }

    // Create custom token
    const customToken = await createCustomToken(studentId, {
      role: 'student',
      regNo: regNo
    });

    res.json({ customToken, uid: studentId });
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Coordinator login
app.post('/api/auth/coordinator-login', async (req, res) => {
  try {
    const { error, value } = coordinatorLoginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { coordinatorId, password } = value;

    // Check coordinator credentials (in a real app, this would be in a database)
    const coordinators = {
      'coord_cse': { password: 'coord123', department: 'CSE' },
      'coord_ece': { password: 'coord123', department: 'ECE' },
      'coord_mech': { password: 'coord123', department: 'MECH' },
      'coord_civil': { password: 'coord123', department: 'CIVIL' }
    };

    const coordinator = coordinators[coordinatorId];
    if (!coordinator || coordinator.password !== password) {
      return res.status(401).json({ message: 'Invalid coordinator credentials' });
    }

    // Create or get coordinator user
    const coordinatorEmail = `${coordinatorId}@college.edu`;
    let coordinatorUid;

    try {
      const userRecord = await admin.auth().getUserByEmail(coordinatorEmail);
      coordinatorUid = userRecord.uid;
    } catch (error) {
      // User doesn't exist, create new one
      const userRecord = await createFirebaseUser(coordinatorEmail, password);
      coordinatorUid = userRecord.uid;

      // Create user document
      await createUserDocument(coordinatorUid, {
        email: coordinatorEmail,
        role: 'coordinator',
        department: coordinator.department,
        isBlocked: false
      });
    }

    // Create custom token
    const customToken = await createCustomToken(coordinatorUid, {
      role: 'coordinator',
      department: coordinator.department
    });

    res.json({ customToken, uid: coordinatorUid });
  } catch (error) {
    console.error('Coordinator login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin login
app.post('/api/auth/admin-login', async (req, res) => {
  try {
    const { error, value } = adminLoginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { adminId, password } = value;

    // Check admin credentials
    const adminCredentials = {
      'admin': 'admin123'
    };

    if (adminCredentials[adminId] !== password) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Create or get admin user
    const adminEmail = 'admin@college.edu';
    let adminUid;

    try {
      const userRecord = await admin.auth().getUserByEmail(adminEmail);
      adminUid = userRecord.uid;
    } catch (error) {
      // User doesn't exist, create new one
      const userRecord = await createFirebaseUser(adminEmail, password);
      adminUid = userRecord.uid;

      // Create user document
      await createUserDocument(adminUid, {
        email: adminEmail,
        role: 'admin',
        department: null,
        isBlocked: false
      });
    }

    // Create custom token
    const customToken = await createCustomToken(adminUid, {
      role: 'admin'
    });

    res.json({ customToken, uid: adminUid });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create student account
app.post('/api/auth/create-student', async (req, res) => {
  try {
    const { error, value } = createStudentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { regNo, dob, email, firstName, lastName, department } = value;

    // Check if student already exists
    const existingStudent = await db.collection('students')
      .where('regNo', '==', regNo)
      .limit(1)
      .get();

    if (!existingStudent.empty) {
      return res.status(409).json({ message: 'Student with this registration number already exists' });
    }

    // Create Firebase user
    const userRecord = await createFirebaseUser(email, dob);
    const uid = userRecord.uid;

    // Create user document
    await createUserDocument(uid, {
      email: email,
      role: 'student',
      department: department,
      isBlocked: false
    });

    // Create student document
    await db.collection('students').doc(uid).set({
      uid: uid,
      regNo: regNo,
      dob: dob,
      firstName: firstName,
      lastName: lastName,
      department: department,
      email: email,
      profilePicURL: '',
      resumeURL: '',
      certificates: [],
      semesterMarks: {},
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Create custom token
    const customToken = await createCustomToken(uid, {
      role: 'student',
      regNo: regNo
    });

    res.json({ customToken, uid: uid });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Access from other devices: http://<your-ip>:${PORT}`);
});

