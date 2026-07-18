// backend/routes/health.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Liveness check (checks that process is up and running)
router.get('/liveness', (req, res) => {
  return res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Readiness check (checks database connections and ready state)
router.get('/readiness', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const isReady = dbState === 1;
  
  if (isReady) {
    return res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } else {
    return res.status(503).json({
      status: 'not ready',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
