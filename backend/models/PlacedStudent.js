const mongoose = require('mongoose');

const placedStudentSchema = new mongoose.Schema({
  studentId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  regNo: {
    type: String,
    required: true,
    index: true
  },
  dept: {
    type: String,
    required: true
  },
  batch: {
    type: String,
    required: true
  },
  yearSec: {
    type: String
  },
  semester: {
    type: String
  },
  phone: {
    type: String
  },
  email: {
    type: String
  },
  company: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true
  },
  pkg: {
    type: String,
    default: 'N/A'
  },
  date: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Accepted', 'Pending', 'Rejected'],
    default: 'Accepted'
  },
  profilePhoto: {
    type: String  // Will store base64 image data
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'placed_students'
});

// Create compound index for company and batch queries
placedStudentSchema.index({ company: 1, batch: 1 });
placedStudentSchema.index({ dept: 1, batch: 1 });

module.exports = mongoose.model('PlacedStudent', placedStudentSchema);
