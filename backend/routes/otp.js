const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Otp = require('../models/Otp');
const { sendMail, EMAIL_EVENTS } = require('../services/mail/mailService');

/**
 * Helper to mask email address for security.
 * e.g. mohammedashik@gmail.com -> m***********k@gmail.com
 */
function maskEmail(email) {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
        return `${localPart.charAt(0)}*@${domain}`;
    }
    return `${localPart.charAt(0)}${'*'.repeat(localPart.length - 2)}${localPart.charAt(localPart.length - 1)}@${domain}`;
}

let latestOtpForTesting = null;

/**
 * GET /api/auth/otp/latest-for-testing
 * Returns the latest generated OTP code. Restricted to development/testing environment.
 */
router.get('/latest-for-testing', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ success: false, error: 'Forbidden in production' });
    }
    return res.json({ success: true, otp: latestOtpForTesting });
});

/**
 * POST /api/auth/otp/send
 * Body: { email, purpose, role }
 */
router.post('/send', async (req, res) => {
    const { email, purpose, role, name } = req.body || {};

    if (!email || !purpose || !role) {
        return res.status(400).json({ success: false, error: 'Missing required fields: email, purpose, role' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Safe diagnostic log (never prints secrets)
    console.log('[OTP Send Diagnostic]:', {
        provider: process.env.MAIL_PROVIDER || 'gmail',
        userConfigured: Boolean(process.env.MAIL_USER),
        passwordConfigured: Boolean(process.env.MAIL_PASSWORD),
        fromConfigured: Boolean(process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USER),
        environment: process.env.NODE_ENV || 'development'
    });

    try {
        // 1. Check for active OTP and Cooldown
        const existingOtp = await Otp.findOne({ email: normalizedEmail, purpose, role });
        
        if (existingOtp) {
            const timeSinceLastResend = Date.now() - new Date(existingOtp.updatedAt).getTime();
            const cooldownSecondsLeft = Math.ceil((60000 - timeSinceLastResend) / 1000); // 1 minute cooldown
            
            if (cooldownSecondsLeft > 0) {
                return res.status(429).json({
                    success: false,
                    error: 'Resend cooldown active. Please wait.',
                    cooldownSecondsLeft
                });
            }

            if (existingOtp.resendCount >= 5) {
                return res.status(429).json({
                    success: false,
                    error: 'Maximum OTP resend limit reached. Please try again later.'
                });
            }
        }

        // 2. Generate secure 6-digit numeric OTP
        const otpVal = crypto.randomInt(100000, 1000000).toString();
        latestOtpForTesting = otpVal;
        const hashedOtp = await bcrypt.hash(otpVal, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

        // 3. Resolve Recipient Name
        let resolvedName = name || '';
        if (!resolvedName) {
            try {
                if (role === 'admin') {
                    const Admin = require('../models/Admin');
                    const adminUser = await Admin.findOne({ emailId: normalizedEmail });
                    if (adminUser) resolvedName = `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim();
                } else if (role === 'coordinator') {
                    const User = require('../models/User');
                    const user = await User.findOne({ email: normalizedEmail, role: 'coordinator' });
                    if (user && user.profile) resolvedName = `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim();
                } else {
                    const Student = require('../models/Student');
                    const studentUser = await Student.findOne({ email: normalizedEmail });
                    if (studentUser) resolvedName = `${studentUser.firstName || ''} ${studentUser.lastName || ''}`.trim();
                }
            } catch (dbErr) {
                console.error('[OTP Name Resolution DB Error]:', dbErr);
            }
        }

        if (!resolvedName) {
            resolvedName = normalizedEmail.split('@')[0];
        }

        // 4. Dispatch Email FIRST (ensures no orphaned OTP state on dispatch failure)
        console.log(`[OTP] Generating verification code for recipient role ${role}`);
        await sendMail({
            eventType: EMAIL_EVENTS.OTP_VERIFICATION,
            to: normalizedEmail,
            role,
            data: {
                otp: otpVal,
                recipientName: resolvedName
            }
        });

        // 5. Save or Update OTP in DB ONLY after successful mail dispatch
        if (existingOtp) {
            existingOtp.hashedOtp = hashedOtp;
            existingOtp.expiresAt = expiresAt;
            existingOtp.attempts = 0;
            existingOtp.maxAttempts = 5;
            existingOtp.resendCount += 1;
            await existingOtp.save();
        } else {
            const newOtp = new Otp({
                email: normalizedEmail,
                hashedOtp,
                purpose,
                role,
                expiresAt,
                resendCount: 0,
                maxAttempts: 5
            });
            await newOtp.save();
        }

        return res.json({
            success: true,
            message: 'If a valid account is associated or eligible, a verification code has been sent.',
            maskedEmail: maskEmail(normalizedEmail)
        });

    } catch (error) {
        console.error('[OTP Send Failure]:', {
            code: error.code || 'UNKNOWN',
            responseCode: error.responseCode || 'N/A',
            command: error.command || 'N/A',
            message: error.message
        });
        return res.status(500).json({
            success: false,
            error: 'Unable to send verification code. Please try again.',
            details: error.message
        });
    }
});

/**
 * POST /api/auth/otp/verify
 * Body: { email, otp, purpose, role }
 */
router.post('/verify', async (req, res) => {
    const { email, otp, purpose, role } = req.body || {};

    if (!email || !otp || !purpose || !role) {
        return res.status(400).json({ success: false, error: 'Missing fields: email, otp, purpose, role' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
        const otpRecord = await Otp.findOne({ email: normalizedEmail, purpose, role });

        if (!otpRecord) {
            return res.status(400).json({ success: false, error: 'No verification request found or code has expired.' });
        }

        // Check expiry
        if (new Date() > otpRecord.expiresAt) {
            await Otp.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ success: false, error: 'Verification code has expired. Please request a new one.' });
        }

        // Check attempts throttle
        if (otpRecord.attempts >= otpRecord.maxAttempts) {
            await Otp.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ success: false, error: 'Too many verification attempts. Please request a new code.' });
        }

        // Compare OTP
        const isMatch = await bcrypt.compare(otp.trim(), otpRecord.hashedOtp);

        if (!isMatch) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            const remainingAttempts = otpRecord.maxAttempts - otpRecord.attempts;

            if (remainingAttempts <= 0) {
                await Otp.deleteOne({ _id: otpRecord._id });
                return res.status(400).json({ success: false, error: 'Attempts exceeded. Request a new OTP.' });
            }

            return res.status(400).json({
                success: false,
                error: `Incorrect code. ${remainingAttempts} ${remainingAttempts === 1 ? 'attempt' : 'attempts'} left.`,
                remainingAttempts
            });
        }

        // Success! Single use: delete record immediately
        await Otp.deleteOne({ _id: otpRecord._id });
        console.log(`[OTP] Successful verification for ${normalizedEmail} [${purpose}]`);

        return res.json({
            success: true,
            message: 'Email address verified successfully!'
        });

    } catch (error) {
        console.error('[OTP Verify Error]:', error);
        return res.status(500).json({ success: false, error: 'Failed to verify verification code', details: error.message });
    }
});

module.exports = router;
