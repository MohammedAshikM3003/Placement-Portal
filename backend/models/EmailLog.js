const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
    eventType: {
        type: String,
        required: true,
        trim: true
    },
    recipient: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    role: {
        type: String,
        required: true,
        enum: ['student', 'coordinator', 'admin']
    },
    relatedEntityId: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['sent', 'failed', 'pending'],
        default: 'pending'
    },
    provider: {
        type: String,
        trim: true
    },
    providerMessageId: {
        type: String,
        trim: true
    },
    attemptCount: {
        type: Number,
        default: 1
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    failureReason: {
        type: String,
        trim: true
    },
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true,
        trim: true
    }
}, {
    timestamps: true
});

emailLogSchema.index({ recipient: 1 });
emailLogSchema.index({ eventType: 1 });

module.exports = mongoose.models.EmailLog || mongoose.model('EmailLog', emailLogSchema);
