/**
 * Script to check certificate data in MongoDB
 * Run with: node check-certificates.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/placementDB';

// Certificate Schema
const certificateSchema = new mongoose.Schema({
    studentId: String,
    achievementId: String,
    fileName: String,
    fileData: String,
    gridfsFileId: String,
    gridfsFileUrl: String,
    fileSize: Number,
    fileType: String,
    comp: String,
    competition: String,
    status: String
}, { collection: 'certificates' });

async function checkCertificates() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        const Certificate = mongoose.model('Certificate', certificateSchema);
        
        const certificates = await Certificate.find({}).limit(5);
        
        console.log(`\n📊 Found ${certificates.length} certificates\n`);
        
        certificates.forEach((cert, index) => {
            console.log(`\n=== Certificate ${index + 1} ===`);
            console.log('ID:', cert._id);
            console.log('Student ID:', cert.studentId);
            console.log('Achievement ID:', cert.achievementId);
            console.log('Competition:', cert.comp || cert.competition);
            console.log('File Name:', cert.fileName);
            console.log('GridFS File ID:', cert.gridfsFileId);
            console.log('GridFS File URL:', cert.gridfsFileUrl);
            console.log('Has fileData:', cert.fileData ? `Yes (${cert.fileData.length} chars)` : 'No');
            console.log('Status:', cert.status);
        });
        
        // Check GridFS files
        console.log('\n\n📁 Checking GridFS files...');
        const db = mongoose.connection.db;
        const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'student_files' });
        
        const filesCollection = db.collection('student_files.files');
        const files = await filesCollection.find({}).limit(10).toArray();
        
        console.log(`\n📊 Found ${files.length} files in GridFS\n`);
        
        files.forEach((file, index) => {
            console.log(`\n=== GridFS File ${index + 1} ===`);
            console.log('ID:', file._id);
            console.log('Filename:', file.filename);
            console.log('Content Type:', file.contentType);
            console.log('Size:', file.length, 'bytes');
            console.log('Category:', file.metadata?.category);
            console.log('StudentId:', file.metadata?.studentId);
            console.log('UploadDate:', file.uploadDate);
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    }
}

checkCertificates();
