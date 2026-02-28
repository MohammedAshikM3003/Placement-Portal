/**
 * GridFS File Routes — Upload & Fetch
 * Replaces Base64 storage with streaming GridFS in MongoDB
 * Uses multer memory storage + manual GridFS upload (reuses mongoose connection)
 */
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const { GridFSBucket, ObjectId } = require('mongodb');
const { Readable } = require('stream');

let gridFSBucket;

// Initialize/get GridFS bucket
function getBucket() {
    if (!gridFSBucket && mongoose.connection.readyState === 1) {
        gridFSBucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'student_files' });
    }
    return gridFSBucket;
}

// Initialize bucket when connection opens
mongoose.connection.once('open', () => {
    gridFSBucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'student_files' });
    console.log('✅ GridFS bucket initialized (student_files)');
});

mongoose.connection.on('reconnected', () => {
    gridFSBucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'student_files' });
    console.log('✅ GridFS bucket re-initialized');
});

// Use multer memory storage (stores file buffer in memory, then we push to GridFS manually)
const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 } // 15MB
});

/**
 * Upload a buffer to GridFS using the existing mongoose connection
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} filename - Desired filename
 * @param {string} contentType - MIME type
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<{id: string, filename: string}>}
 */
function uploadToGridFS(buffer, filename, contentType, metadata = {}) {
    return new Promise((resolve, reject) => {
        const bucket = getBucket();
        if (!bucket) return reject(new Error('GridFS not initialized'));

        const readable = new Readable();
        readable.push(buffer);
        readable.push(null);

        const uploadStream = bucket.openUploadStream(filename, {
            contentType,
            metadata
        });

        readable.pipe(uploadStream)
            .on('error', reject)
            .on('finish', () => {
                resolve({ id: uploadStream.id.toString(), filename: uploadStream.filename });
            });
    });
}

// =====================================================
// FETCH: Stream file from GridFS by ID
// GET /api/file/:id
// =====================================================
router.get('/file/:id', async (req, res) => {
    try {
        const bucket = getBucket();
        if (!bucket) {
            return res.status(503).json({ error: 'GridFS not initialized' });
        }

        let fileId;
        try {
            fileId = new ObjectId(req.params.id);
        } catch (e) {
            return res.status(400).json({ error: 'Invalid file ID' });
        }

        const files = await bucket.find({ _id: fileId }).toArray();
        if (!files || files.length === 0) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = files[0];

        res.set('Content-Type', file.contentType || 'application/octet-stream');
        res.set('Content-Length', file.length);
        res.set('Cache-Control', 'public, max-age=86400'); // 24h cache

        const isImage = (file.contentType || '').startsWith('image/');
        const isPdf = (file.contentType || '') === 'application/pdf';
        if (isImage || isPdf) {
            res.set('Content-Disposition', `inline; filename="${file.filename}"`);
        } else {
            res.set('Content-Disposition', `attachment; filename="${file.filename}"`);
        }

        const downloadStream = bucket.openDownloadStream(fileId);
        downloadStream.on('error', (err) => {
            console.error('GridFS stream error:', err);
            if (!res.headersSent) res.status(500).json({ error: 'Stream error' });
        });
        downloadStream.pipe(res);
    } catch (error) {
        console.error('❌ GridFS fetch error:', error);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to fetch file' });
    }
});

// =====================================================
// UPLOAD: Single file to GridFS
// POST /api/upload
// =====================================================
router.post('/upload', memoryUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const filename = `${Date.now()}_${req.file.originalname}`;
        const metadata = { category: req.body.category || 'general', originalName: req.file.originalname };
        const uploaded = await uploadToGridFS(req.file.buffer, filename, req.file.mimetype, metadata);

        const fileInfo = {
            id: uploaded.id,
            filename: uploaded.filename,
            originalName: req.file.originalname,
            contentType: req.file.mimetype,
            size: req.file.size,
            url: `/api/file/${uploaded.id}`
        };

        console.log('✅ GridFS upload:', fileInfo.originalName, '->', fileInfo.id);
        res.json({ success: true, file: fileInfo });
    } catch (error) {
        console.error('❌ GridFS upload error:', error);
        res.status(500).json({ error: 'Upload failed', details: error.message });
    }
});

// =====================================================
// UPLOAD: Multiple files to GridFS
// POST /api/upload/multiple
// =====================================================
router.post('/upload/multiple', memoryUpload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const filesInfo = [];
        for (const f of req.files) {
            const filename = `${Date.now()}_${f.originalname}`;
            const metadata = { originalName: f.originalname };
            const uploaded = await uploadToGridFS(f.buffer, filename, f.mimetype, metadata);
            filesInfo.push({
                id: uploaded.id,
                filename: uploaded.filename,
                originalName: f.originalname,
                contentType: f.mimetype,
                size: f.size,
                url: `/api/file/${uploaded.id}`
            });
        }

        console.log(`✅ GridFS bulk upload: ${filesInfo.length} files`);
        res.json({ success: true, files: filesInfo });
    } catch (error) {
        console.error('❌ GridFS bulk upload error:', error);
        res.status(500).json({ error: 'Bulk upload failed', details: error.message });
    }
});

// =====================================================
// DELETE: Remove file from GridFS
// DELETE /api/file/:id
// =====================================================
router.delete('/file/:id', async (req, res) => {
    try {
        const bucket = getBucket();
        if (!bucket) return res.status(503).json({ error: 'GridFS not initialized' });

        let fileId;
        try { fileId = new ObjectId(req.params.id); }
        catch (e) { return res.status(400).json({ error: 'Invalid file ID' }); }

        await bucket.delete(fileId);
        console.log('✅ GridFS file deleted:', req.params.id);
        res.json({ success: true, message: 'File deleted' });
    } catch (error) {
        console.error('❌ GridFS delete error:', error);
        res.status(500).json({ error: 'Delete failed', details: error.message });
    }
});

// =====================================================
// PROFILE IMAGE: Upload & auto-save to user record
// POST /api/upload/profile-image
// =====================================================
router.post('/upload/profile-image', memoryUpload.single('profileImage'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const { userId, userType } = req.body;
        const filename = `profile_${Date.now()}_${req.file.originalname}`;
        const metadata = { category: 'profile-image', uploadedBy: userId || 'unknown', userType: userType || 'unknown' };
        const uploaded = await uploadToGridFS(req.file.buffer, filename, req.file.mimetype, metadata);

        const fileId = uploaded.id;
        const fileUrl = `/api/file/${fileId}`;

        console.log(`✅ Profile image -> GridFS: ${userType} ${userId} -> ${fileId}`);

        if (mongoose.connection.readyState === 1 && userId && userType) {
            try {
                const Student = mongoose.model('Student');
                const Coordinator = mongoose.model('Coordinator');

                if (userType === 'student') {
                    // Try by _id first, then by regNo
                    const query = mongoose.Types.ObjectId.isValid(userId)
                        ? { $or: [{ _id: userId }, { regNo: userId }] }
                        : { regNo: userId };
                    await Student.findOneAndUpdate(query, {
                        profilePicURL: fileUrl,
                        profilePicFileId: fileId
                    }, { strict: false });
                } else if (userType === 'coordinator') {
                    await Coordinator.findOneAndUpdate(
                        { $or: [{ coordinatorId: userId }, { username: userId }, { _id: mongoose.Types.ObjectId.isValid(userId) ? userId : null }] },
                        { profilePhoto: fileUrl, profilePicURL: fileUrl, profilePicFileId: fileId },
                        { strict: false }
                    );
                } else if (userType === 'admin') {
                    const Admin = require('../models/Admin');
                    await Admin.findOneAndUpdate(
                        { adminLoginID: userId },
                        { profilePhoto: fileUrl, profilePicFileId: fileId },
                        { strict: false }
                    );
                }
            } catch (dbError) {
                // DB update failed but file is uploaded — log and continue
                console.warn('⚠️ Profile image uploaded to GridFS but DB record update failed:', dbError.message);
            }
        }

        res.json({
            success: true,
            file: { id: fileId, url: fileUrl, originalName: req.file.originalname }
        });
    } catch (error) {
        console.error('❌ Profile image upload error:', error);
        res.status(500).json({ error: 'Profile image upload failed', details: error.message });
    }
});

// =====================================================
// COLLEGE IMAGES: Upload banner, logo, NAAC, NBA
// POST /api/upload/college-images
// =====================================================
router.post('/upload/college-images', memoryUpload.fields([
    { name: 'collegeBanner', maxCount: 1 },
    { name: 'collegeLogo', maxCount: 1 },
    { name: 'naacCertificate', maxCount: 1 },
    { name: 'nbaCertificate', maxCount: 1 }
]), async (req, res) => {
    try {
        const { adminLoginID } = req.body;
        if (!adminLoginID) {
            return res.status(400).json({ error: 'adminLoginID is required' });
        }

        const Admin = require('../models/Admin');
        const updateData = {};
        const uploadedFiles = {};

        const fileFields = ['collegeBanner', 'collegeLogo', 'naacCertificate', 'nbaCertificate'];
        for (const field of fileFields) {
            if (req.files && req.files[field] && req.files[field][0]) {
                const file = req.files[field][0];
                const filename = `college_${field}_${Date.now()}_${file.originalname}`;
                const metadata = { category: 'college-image', field, adminLoginID };
                const uploaded = await uploadToGridFS(file.buffer, filename, file.mimetype, metadata);
                const fileId = uploaded.id;
                const fileUrl = `/api/file/${fileId}`;
                updateData[field] = fileUrl;
                updateData[`${field}FileId`] = fileId;
                updateData[`${field}Name`] = file.originalname;
                updateData[`${field}UploadDate`] = new Date();
                uploadedFiles[field] = { id: fileId, url: fileUrl, originalName: file.originalname };
            }
        }

        if (Object.keys(uploadedFiles).length === 0) {
            return res.status(400).json({ error: 'No image files provided' });
        }

        await Admin.findOneAndUpdate(
            { adminLoginID },
            { $set: updateData },
            { strict: false, upsert: false }
        );

        console.log(`✅ College images uploaded for ${adminLoginID}:`, Object.keys(uploadedFiles));
        res.json({ success: true, files: uploadedFiles });
    } catch (error) {
        console.error('❌ College images upload error:', error);
        res.status(500).json({ error: 'College images upload failed', details: error.message });
    }
});

// =====================================================
// RESUME: Upload via GridFS (replaces Base64)
// POST /api/resume/upload/gridfs
// =====================================================
router.post('/resume/upload/gridfs', memoryUpload.single('resume'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const { studentId } = req.body;
        if (!studentId) return res.status(400).json({ error: 'studentId is required' });

        const filename = `resume_${studentId}_${Date.now()}_${req.file.originalname}`;
        const metadata = { category: 'resume', studentId, originalName: req.file.originalname };
        const uploaded = await uploadToGridFS(req.file.buffer, filename, req.file.mimetype, metadata);

        const fileId = uploaded.id;
        const fileUrl = `/api/file/${fileId}`;

        if (mongoose.connection.readyState === 1) {
            const Resume = mongoose.model('Resume');

            const existingResume = await Resume.findOne({ studentId });

            if (existingResume) {
                // Delete old GridFS file if exists
                if (existingResume.gridfsFileId) {
                    try {
                        const bucket = getBucket();
                        if (bucket) await bucket.delete(new ObjectId(existingResume.gridfsFileId));
                    } catch (e) { /* old file may not exist */ }
                }

                existingResume.gridfsFileId = fileId;
                existingResume.gridfsFileUrl = fileUrl;
                existingResume.fileName = req.file.originalname;
                existingResume.fileType = req.file.mimetype;
                existingResume.fileSize = req.file.size;
                existingResume.fileData = undefined; // Remove old Base64
                existingResume.uploadedAt = new Date();
                await existingResume.save();

                res.json({
                    message: 'Resume updated (GridFS)',
                    resume: {
                        studentId, gridfsFileId: fileId, gridfsFileUrl: fileUrl,
                        fileName: req.file.originalname,
                        fileType: req.file.mimetype,
                        fileSize: req.file.size
                    }
                });
            } else {
                const newResume = new Resume({
                    studentId,
                    gridfsFileId: fileId,
                    gridfsFileUrl: fileUrl,
                    fileName: req.file.originalname,
                    fileData: '', // Schema requires it, but staying empty
                    fileType: req.file.mimetype,
                    fileSize: req.file.size,
                    uploadedAt: new Date()
                });
                await newResume.save();

                res.json({
                    message: 'Resume uploaded (GridFS)',
                    resume: {
                        studentId, gridfsFileId: fileId, gridfsFileUrl: fileUrl,
                        fileName: req.file.originalname,
                        fileType: req.file.mimetype,
                        fileSize: req.file.size
                    }
                });
            }
        } else {
            res.json({ message: 'Uploaded to GridFS', gridfsFileId: fileId, gridfsFileUrl: fileUrl });
        }
    } catch (error) {
        console.error('❌ GridFS resume upload error:', error);
        res.status(500).json({ error: 'Resume upload failed', details: error.message });
    }
});

// =====================================================
// CERTIFICATE: Upload via GridFS (replaces Base64)
// POST /api/certificates/upload/gridfs
// =====================================================
router.post('/certificates/upload/gridfs', memoryUpload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const { studentId, achievementId, studentName, regNo, section, department,
                degree, year, semester, competition, certificateName, comp, prize, date } = req.body;

        if (!studentId || !achievementId) {
            return res.status(400).json({ error: 'studentId and achievementId are required' });
        }

        const filename = `cert_${studentId}_${Date.now()}_${req.file.originalname}`;
        const metadata = { category: 'certificate', studentId, achievementId, originalName: req.file.originalname };
        const uploaded = await uploadToGridFS(req.file.buffer, filename, req.file.mimetype, metadata);

        const fileId = uploaded.id;
        const fileUrl = `/api/file/${fileId}`;

        if (mongoose.connection.readyState === 1) {
            const Certificate = mongoose.model('Certificate');
            const existing = await Certificate.findOne({ studentId, achievementId });

            if (existing) {
                // Delete old GridFS file
                if (existing.gridfsFileId) {
                    try {
                        const bucket = getBucket();
                        if (bucket) await bucket.delete(new ObjectId(existing.gridfsFileId));
                    } catch (e) { /* ignore */ }
                }

                existing.gridfsFileId = fileId;
                existing.gridfsFileUrl = fileUrl;
                existing.fileName = req.file.originalname;
                existing.fileType = req.file.mimetype;
                existing.fileSize = req.file.size;
                existing.fileData = undefined; // Remove Base64
                existing.studentName = studentName || existing.studentName;
                existing.regNo = regNo || existing.regNo;
                existing.section = section || existing.section;
                existing.department = department || existing.department;
                existing.degree = degree || existing.degree;
                existing.year = year || existing.year;
                existing.semester = semester || existing.semester;
                existing.competition = competition || existing.competition;
                existing.certificateName = certificateName || existing.certificateName;
                existing.comp = comp || existing.comp;
                existing.prize = prize || existing.prize;
                existing.date = date || existing.date;
                existing.uploadDate = new Date().toISOString();
                await existing.save();

                res.json({
                    success: true,
                    message: 'Certificate updated (GridFS)',
                    certificate: {
                        _id: existing._id, studentId, achievementId,
                        gridfsFileId: fileId, gridfsFileUrl: fileUrl,
                        fileName: req.file.originalname, status: existing.status
                    }
                });
            } else {
                const newCert = new Certificate({
                    studentId, achievementId, gridfsFileId: fileId, gridfsFileUrl: fileUrl,
                    fileName: req.file.originalname,
                    fileData: '', // Schema requires it, empty
                    fileType: req.file.mimetype,
                    fileSize: req.file.size,
                    uploadDate: new Date().toISOString(),
                    date: date || '', studentName: studentName || '', name: certificateName || '',
                    regNo: regNo || '', section: section || '', department: department || '',
                    degree: degree || '', year: year || '', semester: semester || '',
                    competition: competition || '', certificateName: certificateName || '',
                    comp: comp || '', prize: prize || '', status: 'pending'
                });
                await newCert.save();

                res.json({
                    success: true,
                    message: 'Certificate uploaded (GridFS)',
                    certificate: {
                        _id: newCert._id, studentId, achievementId,
                        gridfsFileId: fileId, gridfsFileUrl: fileUrl,
                        fileName: req.file.originalname, status: 'pending'
                    }
                });
            }
        } else {
            res.status(503).json({ error: 'Database not connected' });
        }
    } catch (error) {
        console.error('❌ GridFS certificate upload error:', error);
        res.status(500).json({ error: 'Certificate upload failed', details: error.message });
    }
});

// Export
module.exports = router;
module.exports.getBucket = getBucket;
