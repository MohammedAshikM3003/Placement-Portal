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

/**
 * POST /api/auth/otp/send
 * Body: { email, purpose, role }
 */
router.post('/send', async (req, res) => {
    const { email, purpose, role } = req.body || {};

    if (!email || !purpose || !role) {
        return res.status(400).json({ success: false, error: 'Missing required fields: email, purpose, role' });
    }

    const normalizedEmail = email.toLowerCase().trim();

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
        const hashedOtp = await bcrypt.hash(otpVal, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

        // 3. Save or Update OTP
        if (existingOtp) {
            existingOtp.hashedOtp = hashedOtp;
            existingOtp.expiresAt = expiresAt;
            existingOtp.attempts = 0;
            existingOtp.resendCount += 1;
            await existingOtp.save();
        } else {
            const newOtp = new Otp({
                email: normalizedEmail,
                hashedOtp,
                purpose,
                role,
                expiresAt,
                resendCount: 0
            });
            await newOtp.save();
        }

        // 4. Send the Email (using Gmail app pass in dev, SMTP in prod)
        // Note: do not log plaintext OTP value in production logs
        console.log(`[OTP] Generating verification code for recipient role ${role}`);
        
        await sendMail({
            eventType: EMAIL_EVENTS.OTP_VERIFICATION,
            to: normalizedEmail,
            role,
            data: {
                otp: otpVal,
                recipientName: normalizedEmail.split('@')[0]
            }
        });

        return res.json({
            success: true,
            message: 'If a valid account is associated or eligible, a verification code has been sent.',
            maskedEmail: maskEmail(normalizedEmail)
        });

    } catch (error) {
        console.error('[OTP Send Error]:', error);
        return res.status(500).json({ success: false, error: 'Failed to dispatch verification code', details: error.message });
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
                return res.status(400).json({ success: false, error: 'Too many verification attempts. Please request a new code.' });
            }

            return res.status(400).json({
                success: false,
                error: `Incorrect verification code. You have ${remainingAttempts} attempts remaining.`,
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
