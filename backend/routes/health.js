const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { createTransporter } = require('../services/mail/mailConfig');
const { sendMail, EMAIL_EVENTS } = require('../services/mail/mailService');

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

// Mail & SMTP Health Status Diagnostic
router.get('/mail-status', async (req, res) => {
  const provider = process.env.MAIL_PROVIDER || 'gmail';
  const userConfigured = Boolean(process.env.MAIL_USER);
  const passwordConfigured = Boolean(process.env.MAIL_PASSWORD);
  const fromAddressConfigured = Boolean(process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USER);
  const redisConfigured = Boolean(process.env.REDIS_URL);
  const portalUrl = process.env.PORTAL_URL || 'Not Set';
  const nodeEnv = process.env.NODE_ENV || 'development';

  const configCheck = {
    provider,
    userConfigured,
    passwordConfigured,
    fromConfigured: fromAddressConfigured,
    redisConfigured,
    portalUrl,
    environment: nodeEnv
  };

  if (!userConfigured || !passwordConfigured) {
    return res.status(200).json({
      success: false,
      mailConnected: false,
      status: 'CONFIGURATION_ERROR',
      message: 'MAIL_USER or MAIL_PASSWORD environment variables are missing on Render.',
      config: configCheck,
      timestamp: new Date().toISOString()
    });
  }

  try {
    const transporter = createTransporter();
    await transporter.verify();

    return res.status(200).json({
      success: true,
      mailConnected: true,
      status: 'CONNECTED',
      message: 'SMTP Transporter verified successfully! Mail server is ready and authenticated.',
      senderEmail: process.env.MAIL_USER ? `${process.env.MAIL_USER.substring(0, 3)}***@${process.env.MAIL_USER.split('@')[1]}` : 'N/A',
      config: configCheck,
      timestamp: new Date().toISOString()
    });
  } catch (smtpErr) {
    console.error('[Health Check SMTP Error]:', smtpErr);
    return res.status(200).json({
      success: false,
      mailConnected: false,
      status: 'SMTP_VERIFY_FAILED',
      message: smtpErr.message || 'SMTP Authentication or Connection Failed',
      errorDetails: {
        code: smtpErr.code || 'UNKNOWN',
        responseCode: smtpErr.responseCode || 'N/A',
        command: smtpErr.command || 'N/A'
      },
      config: configCheck,
      timestamp: new Date().toISOString()
    });
  }
});

// Test Email Dispatch Endpoint
router.post('/test-email', async (req, res) => {
  const { targetEmail } = req.body || {};
  if (!targetEmail || !targetEmail.includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid targetEmail is required.' });
  }

  try {
    const testResult = await sendMail({
      eventType: EMAIL_EVENTS.OTP_VERIFICATION,
      to: targetEmail.trim(),
      role: 'student',
      data: {
        otp: '999888',
        recipientName: 'Diagnostic Test User'
      }
    });

    return res.json({
      success: true,
      message: `Test verification email dispatched successfully to ${targetEmail}`,
      details: testResult
    });
  } catch (err) {
    console.error('[Health Check Test Email Dispatch Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      message: err.message,
      code: err.code || 'UNKNOWN'
    });
  }
});

module.exports = router;
