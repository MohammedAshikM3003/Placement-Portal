const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SemesterUploadHistory = require('../models/SemesterUploadHistory');
const SemesterRecord = require('../models/SemesterRecord');
const Subject = require('../models/Subject');
const Notification = require('../models/Notification');
const { GridFSBucket, ObjectId } = require('mongodb');

// GET /api/semester-history
// List all upload history records
router.get('/', async (req, res) => {
  try {
    const history = await SemesterUploadHistory.find({})
      .sort({ uploadedAt: -1 })
      .lean();

    const historyWithFiles = await Promise.all(history.map(async (item) => {
      const record = await SemesterRecord.findOne({ uploadId: item.uploadId })
        .select('gridfsFileId pdfFileId')
        .lean();
      return {
        ...item,
        gridfsFileId: record?.gridfsFileId || record?.pdfFileId || null
      };
    }));

    res.status(200).json({
      success: true,
      history: historyWithFiles
    });
  } catch (error) {
    console.error('Failed to get upload history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upload history',
      details: error.message
    });
  }
});

// DELETE /api/semester-history/:uploadId
// Cascade delete all associated records
router.delete('/:uploadId', async (req, res) => {
  const { uploadId } = req.params;
  if (!uploadId) {
    return res.status(400).json({ success: false, error: 'uploadId is required' });
  }

  try {
    // 1. Find gridfsFileId/pdfFileId to delete stored PDF if available
    const records = await SemesterRecord.find({ uploadId }).select('gridfsFileId pdfFileId').lean();
    const fileIds = [...new Set(records.map(r => r.gridfsFileId || r.pdfFileId).filter(Boolean))];

    if (fileIds.length > 0) {
      try {
        const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'student_files' });
        for (const fileId of fileIds) {
          try {
            if (ObjectId.isValid(fileId)) {
              await bucket.delete(new ObjectId(fileId));
              console.log(`Deleted GridFS file: ${fileId}`);
            }
          } catch (fileErr) {
            console.warn(`Could not delete GridFS file ${fileId}:`, fileErr.message);
          }
        }
      } catch (bucketErr) {
        console.warn('GridFS bucket connection error:', bucketErr.message);
      }
    }

    // 2. Cascade delete records
    const deletedSemesterRecords = await SemesterRecord.deleteMany({ uploadId });
    const deletedSubjects = await Subject.deleteMany({ uploadId });
    const deletedNotifications = await Notification.deleteMany({ uploadId, sourceType: 'SEMESTER_UPLOAD' });
    const deletedHistory = await SemesterUploadHistory.deleteMany({ uploadId });

    console.log(`Cascade delete completed for uploadId: ${uploadId}`);
    console.log(`Deleted Semesters: ${deletedSemesterRecords.deletedCount}, Subjects: ${deletedSubjects.deletedCount}, Notifications: ${deletedNotifications.deletedCount}`);

    return res.status(200).json({
      success: true,
      message: 'Upload history and associated data cascade deleted successfully',
      details: {
        semesters: deletedSemesterRecords.deletedCount,
        subjects: deletedSubjects.deletedCount,
        notifications: deletedNotifications.deletedCount,
        history: deletedHistory.deletedCount
      }
    });
  } catch (error) {
    console.error(`Failed to cascade delete uploadId ${uploadId}:`, error);
    return res.status(500).json({
      success: false,
      error: 'Cascade delete failed',
      details: error.message
    });
  }
});

module.exports = router;
