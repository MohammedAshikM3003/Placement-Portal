const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// GET /api/semester-notifications/:identifier
// Fetch unread notifications for a student
router.get('/:identifier', async (req, res) => {
  const { identifier } = req.params;
  if (!identifier) {
    return res.status(400).json({ error: 'Student identifier required' });
  }

  try {
    const query = {
      $or: [
        { registerNumber: identifier },
        { studentId: mongoose.Types.ObjectId.isValid(identifier) ? new mongoose.Types.ObjectId(identifier) : null }
      ].filter(Boolean),
      sourceType: "SEMESTER_UPLOAD",
      notificationRead: false
    };

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Map notifications to the expected format
    const formatted = notifications.map(n => ({
      id: n._id,
      studentId: n.studentId,
      registerNumber: n.registerNumber,
      uploadId: n.uploadId,
      semester: n.semester,
      year: n.year,
      message: n.message,
      subtitle: n.subtitle,
      notificationRead: n.notificationRead,
      createdAt: n.createdAt
    }));

    return res.status(200).json({
      success: true,
      notifications: formatted
    });
  } catch (error) {
    console.error('Failed to get student semester notifications:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      details: error.message
    });
  }
});

// PATCH /api/semester-notifications/mark-read
// Mark notifications as read
router.patch('/mark-read', async (req, res) => {
  const { studentId, regNo, notificationIds, certificateIds } = req.body;
  const identifier = studentId || regNo;
  const ids = notificationIds || certificateIds || [];

  if (!identifier) {
    return res.status(400).json({ error: 'Student identifier required' });
  }

  try {
    const query = {
      $or: [
        { registerNumber: identifier },
        { studentId: mongoose.Types.ObjectId.isValid(identifier) ? new mongoose.Types.ObjectId(identifier) : null }
      ].filter(Boolean),
      sourceType: "SEMESTER_UPLOAD",
      notificationRead: false
    };

    if (ids && ids.length > 0) {
      query._id = {
        $in: ids.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id)
      };
    }

    const result = await Notification.updateMany(query, { $set: { notificationRead: true } });
    console.log(`Marked ${result.modifiedCount} semester notification(s) as read for ${identifier}`);

    return res.status(200).json({
      success: true,
      updated: result.modifiedCount
    });
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update notifications',
      details: error.message
    });
  }
});

module.exports = router;
