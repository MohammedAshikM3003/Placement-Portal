const mongoose = require('mongoose');

const marksheetAuditLogSchema = new mongoose.Schema({
  regNo: { type: String, default: '' },
  studentName: { type: String, default: '' },
  semester: { type: Number, default: null },
  page: { type: Number, default: null },
  ocrMeta: { type: Object, default: {} },
  rawText: { type: String, default: '' },
  extracted: { type: Object, default: {} },
  validation: { type: Object, default: {} },
  confidence: { type: Number, default: null },
  parserVersion: { type: String, default: 'v2' },
  ocrVersion: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

marksheetAuditLogSchema.index({ regNo: 1, semester: 1, createdAt: -1 });

module.exports = mongoose.models.MarksheetAuditLog || mongoose.model('MarksheetAuditLog', marksheetAuditLogSchema);
