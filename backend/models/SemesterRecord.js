const mongoose = require('mongoose');

const semesterStudentSchema = new mongoose.Schema({
  studentId: { type: String, trim: true },
  regNo: { type: String, required: true, trim: true },
  studentName: { type: String, required: true, trim: true },
  year: { type: String, trim: true },
  semester: { type: String, trim: true },
  section: { type: String, trim: true },
  cleared: { type: Number, default: 0 },
  arrear: { type: Number, default: 0 },
  sgpa: { type: String, default: '0.0', trim: true },
  cgpa: { type: String, default: '0.0', trim: true }
}, { _id: false });

const semesterRecordSchema = new mongoose.Schema({
  recordKey: { type: String, required: true, unique: true, index: true, trim: true },
  studentId: { type: String, trim: true },
  regNo: { type: String, required: true, trim: true },
  registerNumber: { type: String, trim: true },
  studentName: { type: String, required: true, trim: true },
  department: { type: String, trim: true },
  batch: { type: String, trim: true },
  year: { type: String, trim: true },
  academicYear: { type: String, trim: true },
  examMonth: { type: String, trim: true },
  examYear: { type: String, trim: true },
  examMonthYear: { type: String, trim: true },
  semester: { type: String, trim: true },
  section: { type: String, trim: true },
  fileName: { type: String, trim: true },
  fileType: { type: String, trim: true },
  pdfFileId: { type: String, trim: true },
  pdfUrl: { type: String, trim: true },
  gridfsFileId: { type: String, trim: true },
  gridfsFileUrl: { type: String, trim: true },
  totalStudents: { type: Number, default: 0 },
  allClearStudents: { type: Number, default: 0 },
  arrearStudents: { type: Number, default: 0 },
  subjects: [{
    courseCode: { type: String, trim: true },
    courseName: { type: String, trim: true },
    subjectCode: { type: String, trim: true },
    subjectName: { type: String, trim: true },
    credits: { type: Number, default: 0 },
    grade: { type: String, trim: true },
    status: { type: String, trim: true }
  }],
  extractedPdfName: { type: String, trim: true },
  extractedAt: { type: Date, default: Date.now },
  reviewed: { type: Boolean, default: false },
  submitted: { type: Boolean, default: false },
  submittedAt: { type: Date },
  extractionStatus: { type: String, trim: true },
  students: [semesterStudentSchema],
  uploadedBy: { type: String, trim: true },
  uploadedAt: { type: Date, default: Date.now }
}, { timestamps: true, strict: false });

semesterRecordSchema.index({ regNo: 1, semester: 1 });
semesterRecordSchema.index({ studentId: 1, semester: 1 });
semesterRecordSchema.index({ department: 1, batch: 1, semester: 1 });
semesterRecordSchema.index({ regNo: 1, semester: 1, year: 1 }, { unique: true });

module.exports = mongoose.models.SemesterRecord || mongoose.model('SemesterRecord', semesterRecordSchema, 'semester');