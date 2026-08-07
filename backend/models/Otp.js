const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    hashedOtp: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        required: true,
        enum: ['LOGIN_VERIFICATION', 'PASSWORD_RESET', 'EMAIL_VERIFICATION', 'ADMIN_ACTION']
    },
    role: {
        type: String,
        required: true,
        enum: ['student', 'coordinator', 'admin']
    },
    expiresAt: {
        type: Date,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    maxAttempts: {
        type: Number,
        default: 3
    },
    resendCooldown: {
        type: Date
    },
    resendCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// TTL Index to automatically clean expired OTPs from the database
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1, purpose: 1, role: 1 });

module.exports = mongoose.models.Otp || mongoose.model('Otp', otpSchema);
