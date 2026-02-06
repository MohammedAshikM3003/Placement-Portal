const mongoose = require('mongoose');
const Student = require('../models/Student');
const User = require('../models/User');
const ResumeAnalysis = require('../models/ResumeAnalysis');
require('dotenv').config();

async function migrateData() {
  try {
    console.log('🚀 Starting MongoDB migration...');
    
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-portal';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

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
