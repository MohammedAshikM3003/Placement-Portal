const mongoose = require('mongoose');
require('dotenv').config();

// Student Schema (same as in server)
const studentSchema = new mongoose.Schema({
  regNo: { type: String, required: true, unique: true, index: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  phone: { type: String },
  dob: { type: String, required: true },
  department: { type: String, required: true },
  branch: { type: String, required: true },
  year: { type: String },
  cgpa: { type: Number },
  profilePicURL: { type: String },
  resumeData: { type: Object },
  resumeUploadDate: { type: String },
  resumeAnalysis: { type: Object },
  isBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);

async function addTestStudent() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-portal', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('✅ Connected to MongoDB');

    // Add the student that matches the frontend login form
    const testStudent = {
      regNo: '73152313074',
      dob: '30032006',
      firstName: 'Test',
      lastName: 'Student',
      email: 'test.student@ksrce.ac.in',
      phone: '9876543210',
      department: 'CSE',
      branch: 'Computer Science Engineering',
      year: '2024',
      cgpa: 8.5,
      isBlocked: false
    };

    // Check if student already exists
    const existingStudent = await Student.findOne({ regNo: testStudent.regNo });
    if (existingStudent) {
      console.log('✅ Student already exists:', testStudent.regNo);
      return;
    }

    // Insert the test student
    const result = await Student.create(testStudent);
    console.log('✅ Test student added successfully!');
    console.log('📋 Login Credentials:');
    console.log(`   Register Number: ${testStudent.regNo}`);
    console.log(`   Password (DOB): ${testStudent.dob}`);
    console.log(`   Student ID: ${result._id}`);

  } catch (error) {
    console.error('❌ Error adding test student:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

addTestStudent();
