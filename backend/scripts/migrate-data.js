const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const ResumeAnalysis = require('../models/ResumeAnalysis');
require('dotenv').config();

// Sample data for testing
const sampleStudents = [
  {
    regNo: '21CS001',
    dob: '01012003',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@college.edu',
    department: 'CSE',
    profilePicURL: '',
    resumeURL: '',
    certificates: [],
    semesterMarks: {},
    achievements: [],
    attendance: {},
    isBlocked: false
  },
  {
    regNo: '21CS002',
    dob: '02012003',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@college.edu',
    department: 'CSE',
    profilePicURL: '',
    resumeURL: '',
    certificates: [],
    semesterMarks: {},
    achievements: [],
    attendance: {},
    isBlocked: false
  },
  {
    regNo: '21ECE001',
    dob: '03012003',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike.johnson@college.edu',
    department: 'ECE',
    profilePicURL: '',
    resumeURL: '',
    certificates: [],
    semesterMarks: {},
    achievements: [],
    attendance: {},
    isBlocked: false
  }
];

const sampleUsers = [
  {
    email: 'coord_cse@college.edu',
    password: 'coord123',
    role: 'coordinator',
    department: 'CSE',
    coordinatorId: 'coord_cse',
    isBlocked: false
  },
  {
    email: 'coord_ece@college.edu',
    password: 'coord123',
    role: 'coordinator',
    department: 'ECE',
    coordinatorId: 'coord_ece',
    isBlocked: false
  },
  {
    email: 'admin@college.edu',
    password: 'admin123',
    role: 'admin',
    adminId: 'admin',
    isBlocked: false
  }
];

async function migrateData() {
  try {
    console.log('🚀 Starting MongoDB migration...');
    
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-portal';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data (optional - remove in production)
    console.log('🧹 Clearing existing data...');
    await Student.deleteMany({});
    await User.deleteMany({});
    await ResumeAnalysis.deleteMany({});
    console.log('✅ Existing data cleared');

    // Insert sample students
    console.log('👥 Inserting sample students...');
    const students = await Student.insertMany(sampleStudents);
    console.log(`✅ Inserted ${students.length} students`);

    // Insert sample users
    console.log('👤 Inserting sample users...');
    const users = await User.insertMany(sampleUsers);
    console.log(`✅ Inserted ${users.length} users`);

    // Create indexes
    console.log('📊 Creating indexes...');
    await Student.collection.createIndex({ regNo: 1 });
    await Student.collection.createIndex({ email: 1 });
    await Student.collection.createIndex({ department: 1 });
    await User.collection.createIndex({ email: 1 });
    await User.collection.createIndex({ role: 1 });
    await ResumeAnalysis.collection.createIndex({ studentId: 1 });
    await ResumeAnalysis.collection.createIndex({ createdAt: -1 });
    console.log('✅ Indexes created');

    // Verify data
    console.log('🔍 Verifying data...');
    const studentCount = await Student.countDocuments();
    const userCount = await User.countDocuments();
    console.log(`📊 Students: ${studentCount}, Users: ${userCount}`);

    console.log('🎉 Migration completed successfully!');
    console.log('\n📋 Sample Login Credentials:');
    console.log('Student: regNo=21CS001, dob=01012003');
    console.log('Coordinator: coordinatorId=coord_cse, password=coord123');
    console.log('Admin: adminId=admin, password=admin123');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateData();
}

module.exports = migrateData;
