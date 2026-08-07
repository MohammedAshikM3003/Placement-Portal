const mongoose = require('mongoose');

const correctionMemorySchema = new mongoose.Schema({
  originalValue: {
    type: String,
    required: true,
    trim: true
  },
  correctedValue: {
    type: String,
    required: true,
    trim: true
  },
  field: {
    type: String,
    required: true,
    trim: true
  },
  editor: {
    type: String,
    default: 'coordinator'
  },
  confidence: {
    type: Number,
    default: 1.0
  },
  approvalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  version: {
    type: Number,
    default: 1
  },
  rollbackLogs: [{
    version: Number,
    correctedValue: String,
    editor: String,
    timestamp: { type: Date, default: Date.now }
  }],
  layoutFingerprint: {
    type: String,
    default: ''
  },
  regulation: {
    type: String,
    default: ''
  },
  university: {
    type: String,
    default: ''
  },
  documentFingerprint: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for fast querying
correctionMemorySchema.index({ field: 1, originalValue: 1, approvalStatus: 1 });
correctionMemorySchema.index({ layoutFingerprint: 1 });

module.exports = mongoose.models.CorrectionMemory || mongoose.model('CorrectionMemory', correctionMemorySchema);
