/**
 * Marksheet OCR endpoint (offline-only)
 * -------------------------------------
 * Deprecated in favor of /api/marksheets/upload.
 */

const express = require('express');
const router = express.Router();

router.post('/parse', async (_req, res) => {
  return res.status(410).json({
    success: false,
    error: 'Deprecated. Use /api/marksheets/upload for deterministic extraction.'
  });
});

module.exports = router;
