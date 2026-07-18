// backend/routes/marksheetReview.js
const express = require('express');
const router = express.Router();
const StudentMarksheet = require('../models/StudentMarksheet');
const AuditTrail = require('../models/AuditTrail');
const crypto = require('crypto');

// Helper to calculate subject differences at a field level (Phase 17 improvement)
function getFieldLevelDiffs(oldSubs, newSubs) {
  const diffs = [];
  const maxLen = Math.max(oldSubs.length, newSubs.length);

  for (let i = 0; i < maxLen; i++) {
    const oldSub = oldSubs[i];
    const newSub = newSubs[i];

    if (!oldSub && newSub) {
      diffs.push({
        field: `subjects.${i}`,
        before: '',
        after: `Added course ${newSub.courseCode || ''}`
      });
      continue;
    }
    if (oldSub && !newSub) {
      diffs.push({
        field: `subjects.${i}`,
        before: `Removed course ${oldSub.courseCode || ''}`,
        after: ''
      });
      continue;
    }

    if (oldSub.courseCode !== newSub.courseCode) {
      diffs.push({
        field: `subjects.${i}.courseCode`,
        before: oldSub.courseCode,
        after: newSub.courseCode
      });
    }
    if (oldSub.grade !== newSub.grade) {
      diffs.push({
        field: `subjects.${i}.grade`,
        before: oldSub.grade,
        after: newSub.grade
      });
    }
    if (oldSub.result !== newSub.result) {
      diffs.push({
        field: `subjects.${i}.result`,
        before: oldSub.result,
        after: newSub.result
      });
    }
  }
  return diffs;
}

// Get all marksheets requiring coordinator review (Phase 17)
router.get('/queue', async (req, res) => {
  try {
    const queue = await StudentMarksheet.find({
      reviewStatus: { $in: ['NEEDS_REVIEW', 'MANUAL_REVIEW_REQUIRED'] }
    }).sort({ updatedAt: -1 }).lean();
    
    return res.status(200).json({ success: true, count: queue.length, queue });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Batch approval (Phase 17 improvement)
router.post('/approve-batch', async (req, res) => {
  try {
    const { marksheetIds, reason } = req.body;
    if (!Array.isArray(marksheetIds) || marksheetIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Provide marksheetIds array' });
    }

    const editorName = req.user?.name || 'Coordinator';
    const editorId = req.user?._id || null;

    // Gather connection logs
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const browser = req.headers['user-agent'] || 'Unknown';
    const sessionHash = crypto.createHash('sha256').update(ip + browser + Date.now()).digest('hex').slice(0, 16);

    for (const marksheetId of marksheetIds) {
      const marksheet = await StudentMarksheet.findById(marksheetId);
      if (marksheet) {
        const oldStatus = marksheet.reviewStatus;
        marksheet.reviewStatus = 'AUTO_ACCEPTED';
        await marksheet.save();

        // Create audit record with digital signature info
        await AuditTrail.create({
          marksheetId,
          editorId,
          editorName,
          fieldModified: 'reviewStatus',
          beforeValue: oldStatus,
          afterValue: 'AUTO_ACCEPTED',
          changeReason: `${reason || 'Batch approved'} | IP: ${ip} | UserAgent: ${browser} | Sig: ${sessionHash}`
        });
      }
    }

    return res.status(200).json({ success: true, message: `Successfully approved ${marksheetIds.length} marksheets` });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Approve a marksheet (Phase 17)
router.post('/:id/approve', async (req, res) => {
  try {
    const marksheetId = req.params.id;
    const oldMarksheet = await StudentMarksheet.findById(marksheetId);
    if (!oldMarksheet) {
      return res.status(404).json({ success: false, error: 'Marksheet not found' });
    }

    const editorName = req.user?.name || 'Coordinator';
    const editorId = req.user?._id || null;

    const oldStatus = oldMarksheet.reviewStatus;
    oldMarksheet.reviewStatus = 'AUTO_ACCEPTED';
    await oldMarksheet.save();

    // Create Audit entry with security metadata
    const ip = req.ip || '127.0.0.1';
    const browser = req.headers['user-agent'] || 'Unknown';
    const sessionHash = crypto.createHash('sha256').update(ip + browser + Date.now()).digest('hex').slice(0, 16);

    await AuditTrail.create({
      marksheetId,
      editorId,
      editorName,
      fieldModified: 'reviewStatus',
      beforeValue: oldStatus,
      afterValue: 'AUTO_ACCEPTED',
      changeReason: `${req.body.reason || 'Approved during review check'} | IP: ${ip} | Sig: ${sessionHash}`
    });

    return res.status(200).json({ success: true, message: 'Marksheet approved successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Reject a marksheet (Phase 17)
router.post('/:id/reject', async (req, res) => {
  try {
    const marksheetId = req.params.id;
    const oldMarksheet = await StudentMarksheet.findById(marksheetId);
    if (!oldMarksheet) {
      return res.status(404).json({ success: false, error: 'Marksheet not found' });
    }

    const editorName = req.user?.name || 'Coordinator';
    const editorId = req.user?._id || null;

    const oldStatus = oldMarksheet.reviewStatus;
    oldMarksheet.reviewStatus = 'MANUAL_REVIEW_REQUIRED';
    await oldMarksheet.save();

    // Create Audit entry
    const ip = req.ip || '127.0.0.1';
    await AuditTrail.create({
      marksheetId,
      editorId,
      editorName,
      fieldModified: 'reviewStatus',
      beforeValue: oldStatus,
      afterValue: 'MANUAL_REVIEW_REQUIRED',
      changeReason: `${req.body.reason || 'Rejected during review check'} | IP: ${ip}`
    });

    return res.status(200).json({ success: true, message: 'Marksheet rejected successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Edit/Correct subjects on a marksheet manually with field-level diffs (Phase 17 improvement)
router.post('/:id/edit', async (req, res) => {
  try {
    const marksheetId = req.params.id;
    const { subjects, reason } = req.body;
    
    const oldMarksheet = await StudentMarksheet.findById(marksheetId);
    if (!oldMarksheet) {
      return res.status(404).json({ success: false, error: 'Marksheet not found' });
    }

    const editorName = req.user?.name || 'Coordinator';
    const editorId = req.user?._id || null;

    const ip = req.ip || '127.0.0.1';
    const browser = req.headers['user-agent'] || 'Unknown';
    const sessionHash = crypto.createHash('sha256').update(ip + browser + Date.now()).digest('hex').slice(0, 16);

    // Calculate field-level diffs
    const diffs = getFieldLevelDiffs(oldMarksheet.subjects || [], subjects || []);

    // Create immutable audit records for each modified field
    for (const diff of diffs) {
      await AuditTrail.create({
        marksheetId,
        editorId,
        editorName,
        fieldModified: diff.field,
        beforeValue: diff.before,
        afterValue: diff.after,
        changeReason: `${reason || 'Manual modification'} | IP: ${ip} | UserAgent: ${browser} | Sig: ${sessionHash}`
      });
    }

    oldMarksheet.subjects = subjects;
    oldMarksheet.reviewStatus = 'AUTO_ACCEPTED'; 
    await oldMarksheet.save();

    return res.status(200).json({ success: true, message: 'Marksheet updated and audited successfully', marksheet: oldMarksheet });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Rollback changes (Phase 17 improvement)
router.post('/:id/rollback', async (req, res) => {
  try {
    const marksheetId = req.params.id;
    const marksheet = await StudentMarksheet.findById(marksheetId);
    if (!marksheet) {
      return res.status(404).json({ success: false, error: 'Marksheet not found' });
    }

    // Get the latest field modifications
    const latestAudits = await AuditTrail.find({
      marksheetId,
      fieldModified: { $regex: /^subjects\./ }
    }).sort({ timestamp: -1 }).limit(10).lean();

    if (latestAudits.length === 0) {
      return res.status(400).json({ success: false, error: 'No edits found to rollback' });
    }

    const editorName = req.user?.name || 'Coordinator';
    const editorId = req.user?._id || null;
    const ip = req.ip || '127.0.0.1';

    // Group the latest batch of audits by timestamp
    const targetTime = latestAudits[0].timestamp.getTime();
    const batchAudits = latestAudits.filter(a => Math.abs(a.timestamp.getTime() - targetTime) < 5000);

    const updatedSubjects = [...(marksheet.subjects || [])];

    for (const audit of batchAudits) {
      const parts = audit.fieldModified.split('.');
      if (parts[0] === 'subjects') {
        const index = parseInt(parts[1], 10);
        const attr = parts[2];
        
        if (updatedSubjects[index]) {
          const beforeVal = updatedSubjects[index][attr];
          updatedSubjects[index][attr] = audit.beforeValue;

          // Record rollback as an audit entry (Immutable history preservation)
          await AuditTrail.create({
            marksheetId,
            editorId,
            editorName,
            fieldModified: audit.fieldModified,
            beforeValue: beforeVal,
            afterValue: audit.beforeValue,
            changeReason: `Rollback of edit from ${audit.timestamp.toISOString()} | IP: ${ip}`
          });
        }
      }
    }

    marksheet.subjects = updatedSubjects;
    await marksheet.save();

    return res.status(200).json({ success: true, message: 'Rollback executed successfully', marksheet });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Get Audit Trail history (Phase 17)
router.get('/:id/audit', async (req, res) => {
  try {
    const audits = await AuditTrail.find({ marksheetId: req.params.id }).sort({ timestamp: -1 }).lean();
    return res.status(200).json({ success: true, count: audits.length, audits });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
