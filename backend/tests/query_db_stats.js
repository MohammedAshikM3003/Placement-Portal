const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI;

async function checkDb() {
  if (!mongoUri) {
    console.error('No MONGODB_URI found.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to DB.');

  const Subject = require('../models/Subject');
  const Student = require('../models/Student');

  // Count by department
  const subjectDeps = await Subject.aggregate([
    { $group: { _id: "$department", count: { $sum: 1 } } }
  ]);
  console.log('\nSubjects by Department in DB:');
  console.log(JSON.stringify(subjectDeps, null, 2));

  // Count by semester
  const subjectSems = await Subject.aggregate([
    { $group: { _id: "$semester", count: { $sum: 1 } } }
  ]);
  console.log('\nSubjects by Semester in DB:');
  console.log(JSON.stringify(subjectSems, null, 2));

  // Sample course code formats
  const sampleSubjects = await Subject.find({}, 'courseCode courseName department semester').limit(10).lean();
  console.log('\nSample Subjects in DB:');
  console.log(JSON.stringify(sampleSubjects, null, 2));

  await mongoose.connection.close();
}

checkDb();
