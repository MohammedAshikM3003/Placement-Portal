const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true,
    enum: ['pdf', 'doc', 'docx']
  },
  extractedText: {
    type: String,
    required: true
  },
  analysisResult: {
    checklistResults: [{
      id: String,
      text: String,
      score: Number,
      maxScore: Number,
      isCompleted: Boolean,
      details: String
    }],
    totalScore: Number,
    maxScore: Number,
    percentage: Number,
    suggestions: [String],
    analysisMethod: String,
    timestamp: Date
  },
  apiProvider: {
    type: String,
    enum: ['huggingface', 'openai', 'gemini', 'fallback'],
    required: true
  },
  processingTime: {
    type: Number, // in milliseconds
    required: true
  },
  isResumeFile: {
    type: Boolean,
    required: true
  }
}, {
  timestamps: true
});

// Indexes
resumeAnalysisSchema.index({ studentId: 1 });
resumeAnalysisSchema.index({ fileName: 1 });
resumeAnalysisSchema.index({ 'analysisResult.timestamp': -1 });

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
