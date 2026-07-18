const express = require('express');
const router = express.Router();

// In-memory progress map: jobId -> progress object
const progressStore = new Map();

// POST /api/marksheets/progress/update - Public endpoint for Python OCR service to update progress
router.post('/update', (req, res) => {
  const { 
    jobId, 
    totalMarksheets, 
    processedMarksheets, 
    currentRegisterNo, 
    currentStage, 
    status,
    currentPage,
    totalPages,
    studentsFound,
    studentsProcessed,
    subjectsExtracted,
    currentSemester
  } = req.body;

  if (!jobId) {
    return res.status(400).json({ error: 'jobId is required' });
  }

  progressStore.set(jobId, {
    totalMarksheets: totalMarksheets || 0,
    processedMarksheets: processedMarksheets || 0,
    currentRegisterNo: currentRegisterNo || '',
    currentStage: currentStage || '',
    status: status || 'processing',
    currentPage: currentPage || 0,
    totalPages: totalPages || 0,
    studentsFound: studentsFound || 0,
    studentsProcessed: studentsProcessed || 0,
    subjectsExtracted: subjectsExtracted || 0,
    currentSemester: currentSemester || null,
    updatedAt: Date.now()
  });

  res.json({ success: true });
});

// GET /api/marksheets/progress/:jobId - Endpoint for Frontend to poll progress
router.get('/:jobId', (req, res) => {
  const { jobId } = req.params;
  const progress = progressStore.get(jobId);
  if (!progress) {
    // If not found yet, return an initial template
    return res.json({
      totalMarksheets: 0,
      processedMarksheets: 0,
      currentRegisterNo: '',
      currentStage: 'Initializing...',
      status: 'initializing'
    });
  }
  res.json(progress);
});

// Helper for backend route to update progress directly
function updateProgress(jobId, update) {
  if (!jobId) return;
  const current = progressStore.get(jobId) || {
    totalMarksheets: 0,
    processedMarksheets: 0,
    currentRegisterNo: '',
    currentStage: 'Starting...',
    status: 'processing'
  };
  progressStore.set(jobId, {
    ...current,
    ...update,
    updatedAt: Date.now()
  });
}

// Clean up jobs older than 1 hour every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [jobId, data] of progressStore.entries()) {
    if (now - data.updatedAt > 3600000) {
      progressStore.delete(jobId);
    }
  }
}, 600000);

module.exports = {
  router,
  updateProgress,
  progressStore
};
