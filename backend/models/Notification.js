const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  registerNumber: {
    type: String,
    required: true,
    trim: true
  },
  uploadId: {
    type: String,
    required: true,
    trim: true
  },
  sourceType: {
    type: String,
    enum: ["SEMESTER_UPLOAD"],
    default: "SEMESTER_UPLOAD"
  },
  semester: {
    type: Number,
    required: true
  },
  year: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: true
  },
  notificationRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

notificationSchema.index({ studentId: 1 });
notificationSchema.index({ registerNumber: 1 });
notificationSchema.index({ uploadId: 1 });
notificationSchema.index({ sourceType: 1 });
notificationSchema.index({ studentId: 1, notificationRead: 1 });

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
