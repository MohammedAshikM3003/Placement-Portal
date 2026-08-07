const { createTransporter, fromEmail } = require('./mailConfig');
const { generateTemplate } = require('./mailTemplates');
const EMAIL_EVENTS = require('./emailEvents');
const EmailLog = require('../../models/EmailLog');
const SystemSetting = require('../../models/SystemSetting');

const mongoose = require('mongoose');
let cachedMailEnabled = true;

async function getMailServiceEnabled() {
    if (mongoose.connection.readyState !== 1) {
        return cachedMailEnabled;
    }
    try {
        const setting = await SystemSetting.findOne({ key: 'mailServiceEnabled' }).maxTimeMS(2000);
        if (setting !== null && typeof setting.value === 'boolean') {
            cachedMailEnabled = setting.value;
            return setting.value;
        }
    } catch (err) {
        console.error('[MailService] Failed reading mailServiceEnabled setting from DB:', err.message);
    }
    return cachedMailEnabled;
}

async function setMailServiceEnabled(enabled, updatedBy = 'admin') {
    const boolVal = Boolean(enabled);
    cachedMailEnabled = boolVal;
    if (mongoose.connection.readyState !== 1) {
        return boolVal;
    }
    try {
        await SystemSetting.findOneAndUpdate(
            { key: 'mailServiceEnabled' },
            { key: 'mailServiceEnabled', value: boolVal, description: 'Master toggle for project-wide mail service', updatedBy },
            { upsert: true, new: true }
        ).maxTimeMS(2000);
        console.log(`[MailService] Saved mailServiceEnabled=${boolVal} to MongoDB.`);
    } catch (err) {
        console.error('[MailService] Failed writing mailServiceEnabled setting to DB:', err.message);
    }
    return boolVal;
}

/**
 * Sends a portal notification email using centralized configurations.
 * Handles template rendering, provider details, idempotency deduplication, and audit logs.
 * 
 * @param {Object} options
 * @param {string} options.eventType One of EMAIL_EVENTS
 * @param {string} options.to Recipient email address
 * @param {string} options.role 'student' | 'coordinator' | 'admin'
 * @param {Object} options.data Template injection values
 * @param {string} [options.idempotencyKey] Unique key to prevent duplicates
 * @returns {Promise<Object>} Delivery details
 */
async function sendMail({ eventType, to, role, data = {}, idempotencyKey = null }) {
    const isEnabled = await getMailServiceEnabled();
    if (!isEnabled) {
        console.log(`[MailService] Mail service is currently DISABLED globally via SystemSetting. Skipping email dispatch to "${to}".`);
        try {
            await new EmailLog({
                recipient: to || 'unknown',
                eventType: eventType || 'UNKNOWN_EVENT',
                role: role || 'student',
                status: 'skipped',
                provider: process.env.MAIL_PROVIDER || 'brevo',
                failureReason: 'Mail service disabled globally by administrator',
                idempotencyKey
            }).save();
        } catch (logErr) {
            console.error('[MailService] Failed logging skipped mail:', logErr.message);
        }
        return { success: true, disabled: true, message: 'Mail service is currently disabled globally.' };
    }

    if (!to || !to.includes('@')) {
        console.warn(`[MailService] Skipping send: invalid or missing recipient email "${to}"`);
        return { success: false, reason: 'Invalid recipient email' };
    }

    const provider = process.env.MAIL_PROVIDER || 'gmail';
    const isCritical = eventType === EMAIL_EVENTS.OTP_VERIFICATION;

    // 1. Check for duplicates / Idempotency
    if (idempotencyKey) {
        try {
            const existingLog = await EmailLog.findOne({ idempotencyKey, status: 'sent' });
            if (existingLog) {
                console.log(`[MailService] Idempotent duplicate check: Email already sent successfully for key "${idempotencyKey}". Skipping.`);
                return { success: true, duplicated: true, messageId: existingLog.providerMessageId };
            }
        } catch (dbErr) {
            console.error('[MailService] Failed checking idempotency log:', dbErr);
            // Non-blocking log check failure, proceed with caution
        }
    }

    // 2. Generate email templates
    let emailDetails;
    try {
        emailDetails = generateTemplate(eventType, role, {
            ...data,
            recipientName: data.recipientName || (role === 'student' ? 'Student' : role === 'coordinator' ? 'Coordinator' : 'Admin')
        });
    } catch (templateErr) {
        console.error('[MailService] Template rendering error:', templateErr);
        if (isCritical) throw templateErr;
        return { success: false, reason: `Template error: ${templateErr.message}` };
    }

    // 3. Create or prepare log entry
    const logPayload = {
        eventType,
        recipient: to,
        role,
        relatedEntityId: data.studentId || data.driveId || data.certificateId || data.trainingId || null,
        status: 'pending',
        provider
    };
    if (idempotencyKey) {
        logPayload.idempotencyKey = idempotencyKey;
    }
    let logDoc = new EmailLog(logPayload);

    // 4. Send email using Brevo HTTPS API (Port 443) or Nodemailer SMTP
    try {
        const resendKey = process.env.RESEND_API_KEY;
        const brevoKey = process.env.BREVO_API_KEY;
        let messageId = null;

        if (resendKey) {
            console.log(`[MailService] Dispatching email via Resend HTTPS API. Event: ${eventType}, To: ${to}`);
            const fromAddr = process.env.MAIL_FROM_ADDRESS || 'onboarding@resend.dev';
            const resendRes = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendKey.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: fromAddr,
                    to: [to.trim()],
                    subject: emailDetails.subject,
                    html: emailDetails.htmlBody
                })
            });

            const resendData = await resendRes.json();
            if (!resendRes.ok) {
                throw new Error(resendData.message || resendData.name || 'Resend HTTPS API Error');
            }
            messageId = resendData.id || `resend_${Date.now()}`;
            console.log(`[MailService] Resend HTTPS API dispatch success. MessageId: ${messageId}`);
        } else if (brevoKey) {
            console.log(`[MailService] Dispatching email via Brevo HTTPS REST API. Event: ${eventType}, To: ${to}`);
            const fromName = process.env.MAIL_FROM_NAME || 'K S R College of Engineering - Placement Cell';
            const fromAddr = process.env.MAIL_FROM_ADDRESS || 'placementportalksrce@gmail.com';

            const brevoPayload = {
                sender: { name: fromName, email: fromAddr },
                to: [{ email: to.trim() }],
                subject: emailDetails.subject,
                htmlContent: emailDetails.htmlBody
            };

            const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': brevoKey.trim(),
                    'content-type': 'application/json'
                },
                body: JSON.stringify(brevoPayload)
            });

            const brevoData = await brevoRes.json().catch(() => ({}));
            if (!brevoRes.ok) {
                const detailedMsg = brevoData.code === 'unauthorized' || brevoData.message === 'Key not found'
                    ? 'Brevo API Key Unauthorized (Key not found). Please update BREVO_API_KEY in backend/.env or click "Disable Mail Service" to bypass email popups.'
                    : (brevoData.message || brevoData.error || `Brevo HTTPS REST API Error (${brevoRes.status})`);
                throw new Error(detailedMsg);
            }
            messageId = brevoData.messageId || `brevo_${Date.now()}`;
            console.log(`[MailService] Brevo HTTPS REST API dispatch success. MessageId: ${messageId}`);
        } else {
            console.log(`[MailService] BREVO_API_KEY not set. Falling back to Nodemailer SMTP. Event: ${eventType}, To: ${to}`);
            const transporter = createTransporter();
            const mailOptions = {
                from: fromEmail,
                to: to.trim(),
                subject: emailDetails.subject,
                html: emailDetails.htmlBody
            };
            if (emailDetails.attachments) {
                mailOptions.attachments = emailDetails.attachments;
            }

            const info = await transporter.sendMail(mailOptions);
            messageId = info.messageId;
            console.log(`[MailService] Nodemailer SMTP dispatch success. MessageId: ${messageId}`);
        }

        if (mongoose.connection.readyState === 1) {
            logDoc.status = 'sent';
            logDoc.providerMessageId = messageId;
            await logDoc.save().catch(logErr => console.error('[MailService] Failed updating send log:', logErr.message));
        }

        return { success: true, messageId };
    } catch (sendErr) {
        console.error(`[MailService] Dispatch failed for event ${eventType} to ${to}:`, sendErr.message);

        if (mongoose.connection.readyState === 1) {
            logDoc.status = 'failed';
            logDoc.failureReason = sendErr.message;
            await logDoc.save().catch(logErr => console.error('[MailService] Failed updating fail log:', logErr.message));
        }

        return { success: false, reason: sendErr.message };
    }
}

module.exports = {
    sendMail,
    setMailServiceEnabled,
    getMailServiceEnabled,
    EMAIL_EVENTS
};
