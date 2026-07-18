// download_sem_6.js
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB URI from environment
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('Error: MONGODB_URI not found in .env');
  process.exit(1);
}

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const { GridFSBucket } = require('mongodb');
    const bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'student_files' });

    // Find the latest file named "sem 6.pdf" or containing "sem 6"
    const files = await mongoose.connection.db.collection('student_files.files')
      .find({ filename: /sem 6/i })
      .sort({ uploadDate: -1 })
      .toArray();

    if (files.length === 0) {
      console.error('No files matching "sem 6" found in GridFS.');
      process.exit(1);
    }

    const targetFile = files[0];
    console.log(`Found file: ${targetFile.filename} (ID: ${targetFile._id}, Size: ${targetFile.length} bytes)`);

    const destPath = path.join(__dirname, 'sem 6.pdf');
    const writeStream = fs.createWriteStream(destPath);

    console.log(`Downloading to ${destPath}...`);
    await new Promise((resolve, reject) => {
      bucket.openDownloadStream(targetFile._id)
        .pipe(writeStream)
        .on('error', reject)
        .on('finish', resolve);
    });

    console.log('Download complete!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
