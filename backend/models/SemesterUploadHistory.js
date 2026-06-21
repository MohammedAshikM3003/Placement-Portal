const mongoose = require('mongoose');

const semesterUploadHistorySchema = new mongoose.Schema({
  uploadId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  coordinatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  filePath: {
    type: String,
    trim: true
  },
  year: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: Number,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  uploadedStudentCount: {
    type: Number,
    default: 0
  },
  uploadedSubjectCount: {
    type: Number,
    default: 0
  },
  extractedStudents: [
    {
      regNo: { type: String, required: true },
      studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true }
    }
  ],
  status: {
    type: String,
    enum: ["ACTIVE", "DELETED"],
    default: "ACTIVE"
  }
}, {
  timestamps: true
});

// Indexes for faster queries
semesterUploadHistorySchema.index({ uploadId: 1 });
semesterUploadHistorySchema.index({ coordinatorId: 1 });

module.exports = mongoose.models.SemesterUploadHistory || mongoose.model('SemesterUploadHistory', semesterUploadHistorySchema);
