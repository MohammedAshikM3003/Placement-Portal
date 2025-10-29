const { MongoClient } = require('mongodb');
require('dotenv').config();

async function addSampleData() {
  const client = new MongoClient(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  try {
    console.log('🔍 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected successfully!');

    const db = client.db('placement-portal');
    
    // Add sample students
    const students = [
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
        isBlocked: false,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
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
        isBlocked: false,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
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
        isBlocked: false,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert students
    const result = await db.collection('students').insertMany(students);
    console.log(`✅ Inserted ${result.insertedCount} students`);

    // Add sample users
    const users = [
      {
        email: 'coord_cse@college.edu',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Kz8KzK', // coord123
        role: 'coordinator',
        department: 'CSE',
        coordinatorId: 'coord_cse',
        isBlocked: false,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'admin@college.edu',
        password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8Kz8KzK', // admin123
        role: 'admin',
        adminId: 'admin',
        isBlocked: false,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const userResult = await db.collection('users').insertMany(users);
    console.log(`✅ Inserted ${userResult.insertedCount} users`);

    console.log('🎉 Sample data added successfully!');
    console.log('\n📋 Sample Login Credentials:');
    console.log('Student: regNo=21CS001, dob=01012003');
    console.log('Coordinator: coordinatorId=coord_cse, password=coord123');
    console.log('Admin: adminId=admin, password=admin123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
    console.log('🔌 Connection closed');
  }
}

addSampleData();
