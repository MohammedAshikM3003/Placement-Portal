const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

async function cleanup() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('placement-portal');

    // Clear pdfData from resume collection
    const r = await db.collection('resume').updateMany({}, {
      $unset: { pdfData: '' }
    });
    console.log('resume: cleared pdfData from ' + r.modifiedCount + ' docs');

    console.log('\nCleanup complete!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.close();
  }
}

cleanup();
