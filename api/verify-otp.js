const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;

let cachedDb = null;
async function connectToDatabase() {
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }
    if (!MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is missing on Vercel.');
    }
    cachedDb = await mongoose.connect(MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000
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

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    const { email, otp, purpose, role } = req.body || {};
    if (!email || !otp || !purpose || !role) {
        return res.status(400).json({ success: false, error: 'Missing required fields: email, otp, purpose, role' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
        await connectToDatabase();

        const otpRecord = await OtpModel.findOne({ email: normalizedEmail, purpose, role });
        if (!otpRecord) {
            return res.status(400).json({ success: false, error: 'Invalid or expired verification code.' });
        }

        if (new Date() > new Date(otpRecord.expiresAt)) {
            await OtpModel.deleteOne({ _id: otpRecord._id });
            return res.status(400).json({ success: false, error: 'Verification code has expired. Please request a new code.' });
        }

        if (otpRecord.attempts >= otpRecord.maxAttempts) {
            await OtpModel.deleteOne({ _id: otpRecord._id });
            return res.status(429).json({ success: false, error: 'Too many incorrect attempts. Code invalidated.' });
        }

        const isMatch = await bcrypt.compare(otp.toString().trim(), otpRecord.hashedOtp);
        if (!isMatch) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            const attemptsLeft = otpRecord.maxAttempts - otpRecord.attempts;
            if (attemptsLeft <= 0) {
                await OtpModel.deleteOne({ _id: otpRecord._id });
                return res.status(400).json({ success: false, error: 'Maximum incorrect attempts reached. Code invalidated.' });
            }
            return res.status(400).json({ success: false, error: `Invalid verification code. ${attemptsLeft} attempts remaining.` });
        }

        // Successfully verified! Delete record so code cannot be reused
        await OtpModel.deleteOne({ _id: otpRecord._id });

        return res.status(200).json({
            success: true,
            message: 'Email address verified successfully.'
        });

    } catch (err) {
        console.error('[Vercel Serverless OTP Verify Error]:', err);
        return res.status(500).json({
            success: false,
            error: 'Verification failed. Please try again.',
            details: err.message
        });
    }
};
