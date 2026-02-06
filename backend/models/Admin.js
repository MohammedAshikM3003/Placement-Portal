const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  // Admin Login Credentials
  adminLoginID: {
    type: String,
    required: true,
    unique: true,
    trim: true
    // Removed index: true to avoid duplicate index warning
  },
  adminPassword: {
    type: String,
    required: true
  },
  
  // Personal Information
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  dob: {
    type: String // Store as dd-mm-yyyy format
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', '']
  },
  emailId: {
    type: String,
    trim: true,
    lowercase: true
  },
  domainMailId: {
    type: String,
    trim: true,
    lowercase: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  
  // Profile Photo
  profilePhoto: {
    type: String // Base64 encoded image
  },
  profilePhotoName: {
    type: String
  },
  profilePhotoUploadDate: {
    type: Date
  },
  
  // College Details - Images stored as base64
  collegeBanner: {
    type: String // Base64 encoded image
  },
  collegeBannerName: {
    type: String
  },
  collegeBannerUploadDate: {
    type: Date
  },
  
  naacCertificate: {
    type: String // Base64 encoded image
  },
  naacCertificateName: {
    type: String
  },
  naacCertificateUploadDate: {
    type: Date
  },
  
  nbaCertificate: {
    type: String // Base64 encoded image
  },
  nbaCertificateName: {
    type: String
  },
  nbaCertificateUploadDate: {
    type: Date
  },
  
  collegeLogo: {
    type: String // Base64 encoded image
  },
  collegeLogoName: {
    type: String
  },
  collegeLogoUploadDate: {
    type: Date
  },
  
  // Metadata
  isBlocked: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
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
  timestamps: true
});

// Indexes for faster queries (adminLoginID already has unique:true which creates an index)
adminSchema.index({ emailId: 1 });
adminSchema.index({ domainMailId: 1 });

module.exports = mongoose.model('Admin', adminSchema, 'admins');
