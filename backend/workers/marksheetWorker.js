const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Worker } = require('bullmq');
const { connection } = require('../queues/marksheetQueue');
const { extractAllMarksheetsFromPDF } = require('../services/marksheetExtractionService');
const MarksheetReview = require('../models/MarksheetReview');

const MONGODB_URI = process.env.MONGODB_URI;

async function start() {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI not set');
  }

  await mongoose.connect(MONGODB_URI);

  const worker = new Worker('marksheet-extraction', async (job) => {
    const { pdfBase64, semester, uploaderId } = job.data || {};
    if (!pdfBase64) throw new Error('pdfBase64 missing');

    const buffer = Buffer.from(pdfBase64, 'base64');
    const marksheets = await extractAllMarksheetsFromPDF(buffer, {
      semester: semester ? Number(semester) : null
    });

    for (const marksheet of marksheets) {
      await MarksheetReview.create({
        status: 'pending',
        regNo: marksheet.regNo || '',
        studentName: marksheet.studentName || '',
        semester: marksheet.semester || null,
        page: marksheet.ocrMeta?.page || null,
        confidence: marksheet.extractionConfidence || null,
        validation: marksheet.validation || {},
        extracted: marksheet,
        ocrMeta: marksheet.ocrMeta || {},
        source: 'QUEUE_UPLOAD',
        uploadedBy: uploaderId || null
      });
    }

    return { total: marksheets.length };
  }, { connection });

  worker.on('failed', (job, err) => {
    console.error(`[marksheetWorker] Job ${job?.id} failed:`, err.message);
  });

  console.log('✅ Marksheet worker started');
}

start().catch((err) => {
  console.error('❌ Marksheet worker failed to start:', err.message);
  process.exit(1);
});
