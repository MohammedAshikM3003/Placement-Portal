const express = require('express');
const router = express.Router();
const MarksheetReview = require('../models/MarksheetReview');

router.get('/pending', async (_req, res) => {
  const items = await MarksheetReview.find({ status: 'pending' })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, items });
});

router.get('/:id', async (req, res) => {
  const item = await MarksheetReview.findById(req.params.id).lean();
  if (!item) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, item });
});

router.post('/:id/resolve', async (req, res) => {
  const { corrected } = req.body;
  await MarksheetReview.updateOne(
    { _id: req.params.id },
    { $set: { status: 'resolved', resolvedAt: new Date(), corrected: corrected || null } }
  );
  res.json({ success: true });
});

router.post('/:id/reject', async (req, res) => {
  await MarksheetReview.updateOne(
    { _id: req.params.id },
    { $set: { status: 'rejected', resolvedAt: new Date() } }
  );
  res.json({ success: true });
});

module.exports = router;
