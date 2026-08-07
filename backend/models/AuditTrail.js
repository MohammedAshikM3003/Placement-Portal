// backend/models/AuditTrail.js
const mongoose = require('mongoose');

const auditTrailSchema = new mongoose.Schema({
  marksheetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StudentMarksheet',
    required: true,
    index: true
  },
  editorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  editorName: {
    type: String,
    default: 'Coordinator'
  },
  fieldModified: {
    type: String,
    required: true
  },
  beforeValue: {
    type: String,
    default: ''
  },
  afterValue: {
    type: String,
    default: ''
  },
  changeReason: {
    type: String,
    default: 'Manual correction'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.models.AuditTrail || mongoose.model('AuditTrail', auditTrailSchema);
