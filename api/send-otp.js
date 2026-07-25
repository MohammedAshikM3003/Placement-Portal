const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

let cachedDb = null;
async function connectToDatabase() {
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is missing in Vercel settings.');
    }
    cachedDb = await mongoose.connect(mongoUri, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 8000
    });
    return cachedDb;
}

const otpSchema = new mongoose.Schema({
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    hashedOtp: { type: String, required: true },
    purpose: { type: String, required: true },
    role: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    resendCount: { type: Number, default: 0 }
}, { timestamps: true });

const OtpModel = mongoose.models.VercelOtp || mongoose.model('VercelOtp', otpSchema, 'otps');

function maskEmail(email) {
    if (!email) return '';
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
        return `${localPart.charAt(0)}*@${domain}`;
    }
    return `${localPart.charAt(0)}${'*'.repeat(localPart.length - 2)}${localPart.charAt(localPart.length - 1)}@${domain}`;
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ success: false, error: 'Method not allowed' });
        }

        const { email, purpose, role, name } = req.body || {};
        if (!email || !purpose || !role) {
            return res.status(400).json({ success: false, error: 'Missing required fields: email, purpose, role' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        await connectToDatabase();

        // 1. Cooldown & Resend limit checks
        const existingOtp = await OtpModel.findOne({ email: normalizedEmail, purpose, role });
        if (existingOtp) {
            const timeSinceLastResend = Date.now() - new Date(existingOtp.updatedAt).getTime();
            const cooldownSecondsLeft = Math.ceil((60000 - timeSinceLastResend) / 1000);
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
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        // 3. Environment Variable Enforcement (Fail Fast if missing)
        const resendKey = process.env.RESEND_API_KEY;
        const brevoKey = process.env.BREVO_API_KEY;
        if (!resendKey && !brevoKey) {
            return res.status(500).json({
                success: false,
                error: 'Missing environment variable: BREVO_API_KEY or RESEND_API_KEY must be set in Vercel settings.'
            });
        }

        const fromName = process.env.MAIL_FROM_NAME || 'K S R College of Engineering - Placement Cell';
        const fromAddress = process.env.MAIL_FROM_ADDRESS || 'placementportalksrce@gmail.com';

        // 4. Role Theme Styling & HTML Template
        const themeColor = role === 'admin' ? '#4EA24E' : role === 'coordinator' ? '#D23B42' : '#2085F6';
        const resolvedName = name || normalizedEmail.split('@')[0];

        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding: 40px 10px;">
        <tr>
            <td align="center">
                <table width="100%" maxWidth="560" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.08); border-top: 6px solid ${themeColor};">
                    <tr>
                        <td style="padding: 32px 30px; text-align:center;">
                            <h2 style="color:#1e293b; font-size:24px; margin:0 0 10px 0; font-weight:700;">Verification Code</h2>
                            <p style="color:#64748b; font-size:15px; margin:0 0 24px 0;">Hello <strong>${resolvedName}</strong>, please use the 6-digit verification code below to verify your email address.</p>
                            <div style="background-color:#f8fafc; border:2px dashed ${themeColor}; border-radius:10px; padding:20px; text-align:center; margin:0 0 24px 0;">
                                <span style="font-size:36px; font-weight:800; letter-spacing:8px; color:${themeColor}; display:inline-block;">${otpVal}</span>
                            </div>
                            <p style="color:#94a3b8; font-size:13px; margin:0;">This code is valid for <strong>5 minutes</strong>. Do not share this code with anyone.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

        // 5. Dispatch Email via Resend or Brevo HTTPS REST API (Port 443)
        let response = null;
        if (resendKey) {
            response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendKey.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: fromAddress,
                    to: [normalizedEmail],
                    subject: `${otpVal} is your Placement Portal Verification Code`,
                    html: htmlContent
                })
            });
        } else {
            response = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': brevoKey.trim(),
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: fromName, email: fromAddress },
                    to: [{ email: normalizedEmail }],
                    subject: `${otpVal} is your Placement Portal Verification Code`,
                    htmlContent: htmlContent
                })
            });
        }

        const resData = await response.json();
        if (!response.ok) {
            return res.status(response.status || 500).json({
                success: false,
                error: resData.message || resData.error || 'Brevo/Resend HTTPS API Error',
                providerResponse: resData
            });
        }

        // 6. Save or Update OTP in DB ONLY after successful email delivery
        if (existingOtp) {
            existingOtp.hashedOtp = hashedOtp;
            existingOtp.expiresAt = expiresAt;
            existingOtp.attempts = 0;
            existingOtp.maxAttempts = 5;
            existingOtp.resendCount += 1;
            await existingOtp.save();
        } else {
            const newOtp = new OtpModel({
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

        return res.status(200).json({
            success: true,
            message: 'Verification code sent successfully via HTTPS REST API.',
            maskedEmail: maskEmail(normalizedEmail),
            messageId: resData.messageId || resData.id
        });

    } catch (err) {
        console.error('[Vercel Serverless OTP Send Error]:', err);
        return res.status(500).json({
            success: false,
            error: 'Failed to dispatch verification code.',
            details: err.message
        });
    }
};
