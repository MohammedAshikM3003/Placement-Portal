const mongoose = require('mongoose');

const marksheetReviewSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['pending', 'resolved', 'rejected'],
    default: 'pending'
  },
  regNo: {
    type: String,
    default: ''
  },
  studentName: {
    type: String,
    default: ''
  },
  semester: {
    type: Number,
    default: null
  },
  page: {
    type: Number,
    default: null
  },
  confidence: {
    type: Number,
    default: null
  },
  validation: {
    type: Object,
    default: {}
  },
  extracted: {
    type: Object,
    default: {}
  },
  ocrMeta: {
    type: Object,
    default: {}
  },
  source: {
    type: String,
    default: 'PDF_UPLOAD'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

marksheetReviewSchema.index({ status: 1, createdAt: -1 });
marksheetReviewSchema.index({ regNo: 1, semester: 1 });

module.exports = mongoose.models.MarksheetReview || mongoose.model('MarksheetReview', marksheetReviewSchema);
