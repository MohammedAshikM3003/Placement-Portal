const { createTransporter, fromEmail } = require('./mailConfig');
const { generateTemplate } = require('./mailTemplates');
const EMAIL_EVENTS = require('./emailEvents');
const EmailLog = require('../../models/EmailLog');

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
        const brevoKey = process.env.BREVO_API_KEY;
        let messageId = null;

        if (brevoKey) {
            console.log(`[MailService] Dispatching email via Brevo HTTPS API. Event: ${eventType}, To: ${to}`);
            const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'api-key': brevoKey.trim(),
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    sender: { name: process.env.MAIL_FROM_NAME || 'K S R College of Engineering - Placement Cell', email: process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USER || 'no-reply@ksrce.ac.in' },
                    to: [{ email: to.trim() }],
                    subject: emailDetails.subject,
                    htmlContent: emailDetails.htmlBody
                })
            });

            const brevoData = await brevoRes.json();
            if (!brevoRes.ok) {
                throw new Error(brevoData.message || brevoData.error || 'Brevo HTTPS API Error');
            }
            messageId = brevoData.messageId || `brevo_${Date.now()}`;
            console.log(`[MailService] Brevo HTTPS dispatch success. MessageId: ${messageId}`);
        } else {
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

            console.log(`[MailService] Dispatching email via SMTP. Event: ${eventType}, To: ${to}, Role: ${role}`);
            const info = await transporter.sendMail(mailOptions);
            messageId = info.messageId;
            console.log(`[MailService] SMTP dispatch success. MessageId: ${messageId}`);
        }

        // Update log as successful
        logDoc.status = 'sent';
        logDoc.providerMessageId = messageId;
        await logDoc.save().catch(logErr => console.error('[MailService] Failed updating send log:', logErr));

        return { success: true, messageId };
    } catch (sendErr) {
        console.error(`[MailService] Dispatch failed for event ${eventType} to ${to}:`, sendErr.message);

        // Update log as failed
        logDoc.status = 'failed';
        logDoc.failureReason = sendErr.message;
        await logDoc.save().catch(logErr => console.error('[MailService] Failed updating fail log:', logErr));

        if (isCritical) {
            // Throw error for critical path (like OTP) so route rollback or user error notification occurs
            throw new Error(`Email dispatch failed: ${sendErr.message}`);
        }

        // Return gracefully for non-critical paths
        return { success: false, reason: sendErr.message };
    }
}

module.exports = {
    sendMail,
    EMAIL_EVENTS
};
