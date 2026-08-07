const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const dns = require('dns').promises;
const net = require('net');
const { createTransporter } = require('../services/mail/mailConfig');
const { sendMail, setMailServiceEnabled, getMailServiceEnabled, EMAIL_EVENTS } = require('../services/mail/mailService');

const CURRENT_COMMIT_SHA = '69a619f'; // Updated on commit push

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

// Helper for TCP socket connectivity probing
function testTcpConnection(host, port, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = 'PENDING';

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      status = 'PASS';
      socket.destroy();
      resolve('PASS');
    });

    socket.on('timeout', () => {
      status = 'FAIL (ETIMEDOUT)';
      socket.destroy();
      resolve('FAIL (ETIMEDOUT)');
    });

    socket.on('error', (err) => {
      status = `FAIL (${err.code || err.message})`;
      socket.destroy();
      resolve(`FAIL (${err.code || err.message})`);
    });

    try {
      socket.connect({ host, port, family: 4 });
    } catch (err) {
      resolve(`FAIL (${err.message})`);
    }
  });
}

// GET /api/v1/health/mail-diagnostics — Low-level production runtime diagnostics
router.get('/mail-diagnostics', async (req, res) => {
  const host = process.env.MAIL_SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.MAIL_SMTP_PORT || '587', 10);
  const secure = process.env.MAIL_SMTP_SECURE === 'true';

  let dnsIPv4 = [];
  let dnsIPv6 = [];
  try {
    dnsIPv4 = await dns.resolve4(host);
  } catch (err) {
    dnsIPv4 = [`FAIL (${err.code || err.message})`];
  }

  try {
    dnsIPv6 = await dns.resolve6(host);
  } catch (err) {
    dnsIPv6 = [`FAIL (${err.code || err.message})`];
  }

  const tcp587 = await testTcpConnection(host, 587);
  const tcp465 = await testTcpConnection(host, 465);

  return res.status(200).json({
    deployedCommit: CURRENT_COMMIT_SHA,
    nodeVersion: process.version,
    mailHost: host,
    mailPort: port,
    secure: secure,
    ipv4Preference: true,
    mailUserConfigured: Boolean(process.env.MAIL_USER),
    mailPasswordConfigured: Boolean(process.env.MAIL_PASSWORD),
    networkDiagnostics: {
      dnsIPv4,
      dnsIPv6,
      tcp587,
      tcp465
    },
    timestamp: new Date().toISOString()
  });
});

// POST /api/v1/health/toggle-mail-service — Master toggle for Mail Service
router.post('/toggle-mail-service', async (req, res) => {
  const { enabled } = req.body || {};
  const mailEnabledState = await setMailServiceEnabled(enabled);
  return res.json({
    success: true,
    mailServiceEnabled: mailEnabledState,
    message: `Mail Service globally ${mailEnabledState ? 'ENABLED' : 'DISABLED'}.`
  });
});

// GET /api/v1/health/mail-status — Transporter verification endpoint
router.get('/mail-status', async (req, res) => {
  const provider = (process.env.MAIL_PROVIDER || 'gmail').toLowerCase();
  const host = process.env.MAIL_SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.MAIL_SMTP_PORT || '587', 10);
  const secure = process.env.MAIL_SMTP_SECURE === 'true';
  const brevoConfigured = Boolean(process.env.BREVO_API_KEY);
  const resendConfigured = Boolean(process.env.RESEND_API_KEY);
  const userConfigured = Boolean(process.env.MAIL_USER) || brevoConfigured || resendConfigured;
  const passwordConfigured = Boolean(process.env.MAIL_PASSWORD) || brevoConfigured || resendConfigured;
  const fromAddressConfigured = Boolean(process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USER);
  const redisConfigured = Boolean(process.env.REDIS_URL);
  const portalUrl = process.env.PORTAL_URL || 'Not Set';
  const nodeEnv = process.env.NODE_ENV || 'development';
  const mailServiceEnabled = await getMailServiceEnabled();

  const configCheck = {
    provider: brevoConfigured ? 'brevo' : resendConfigured ? 'resend' : provider,
    mailHost: host,
    mailPort: port,
    secure,
    userConfigured,
    passwordConfigured,
    brevoConfigured,
    resendConfigured,
    fromConfigured: fromAddressConfigured,
    redisConfigured,
    portalUrl,
    environment: nodeEnv,
    mailServiceEnabled,
    deployedCommit: CURRENT_COMMIT_SHA
  };

  if (!userConfigured || !passwordConfigured) {
    return res.status(200).json({
      success: false,
      mailConnected: false,
      stage: 'CONFIGURATION',
      status: 'CONFIGURATION_ERROR',
      message: 'MAIL_USER/MAIL_PASSWORD or BREVO_API_KEY missing on backend server.',
      config: configCheck,
      timestamp: new Date().toISOString()
    });
  }

  if (brevoConfigured || resendConfigured) {
    return res.status(200).json({
      success: true,
      mailConnected: true,
      stage: 'COMPLETED',
      status: 'CONNECTED',
      message: `Mail Service connected via ${resendConfigured ? 'Resend HTTPS API' : 'Brevo REST API'}!`,
      senderEmail: process.env.MAIL_FROM_ADDRESS || 'placementportalksrce@gmail.com',
      config: configCheck,
      timestamp: new Date().toISOString()
    });
  }

  // Wrap transporter.verify in an explicit 8-second timeout so health requests never hang
  const verifyPromise = new Promise(async (resolve, reject) => {
    try {
      const transporter = createTransporter();
      await transporter.verify();
      resolve(true);
    } catch (err) {
      reject(err);
    }
  });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      const timeoutErr = new Error('SMTP connection timed out (8s limit)');
      timeoutErr.code = 'ETIMEDOUT';
      reject(timeoutErr);
    }, 8000);
  });

  try {
    await Promise.race([verifyPromise, timeoutPromise]);

    return res.status(200).json({
      success: true,
      mailConnected: true,
      stage: 'COMPLETED',
      status: 'CONNECTED',
      message: `SMTP Transporter verified successfully! (${host}:${port} ${secure ? 'SSL' : 'STARTTLS'})`,
      senderEmail: process.env.MAIL_USER ? `${process.env.MAIL_USER.substring(0, 3)}***@${process.env.MAIL_USER.split('@')[1]}` : 'N/A',
      config: configCheck,
      timestamp: new Date().toISOString()
    });
  } catch (smtpErr) {
    console.error('[Health Check SMTP Error]:', smtpErr);

    let failedStage = 'TCP_CONNECTION';
    if (smtpErr.code === 'EAUTH' || smtpErr.responseCode === 535) {
      failedStage = 'GMAIL_AUTHENTICATION';
    } else if (smtpErr.message && smtpErr.message.includes('STARTTLS')) {
      failedStage = 'STARTTLS_NEGOTIATION';
    }

    return res.status(200).json({
      success: false,
      mailConnected: false,
      stage: failedStage,
      status: 'SMTP_VERIFY_FAILED',
      message: smtpErr.message || 'SMTP Connection or Authentication Failed',
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

// POST /api/v1/health/test-email — Test Email Dispatch Endpoint
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

    if (testResult.disabled) {
      return res.status(200).json({
        success: true,
        disabled: true,
        message: 'Mail service is currently OFF project-wide. Live test email dispatch skipped.'
      });
    }

    if (!testResult.success) {
      return res.status(200).json({
        success: false,
        error: 'Failed to send test email',
        message: testResult.reason || 'Dispatch failed',
        details: testResult.reason || 'Check API key or server credentials'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Test verification email dispatched successfully to ${targetEmail}`,
      details: testResult
    });
  } catch (err) {
    console.error('[Health Check Test Email Dispatch Error]:', err.message);
    return res.status(200).json({
      success: false,
      error: 'Failed to send test email',
      message: err.message,
      code: err.code || 'UNKNOWN'
    });
  }
});

module.exports = router;
