const nodemailer = require('nodemailer');

/**
 * Creates and configures Nodemailer SMTP transporter.
 * Switching providers relies solely on environment variables.
 */
function createTransporter() {
    const provider = process.env.MAIL_PROVIDER || 'gmail';
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASSWORD;

    if (!user || !pass) {
        console.warn('⚠️ Mail configuration warning: MAIL_USER or MAIL_PASSWORD not set.');
    }

    if (provider.toLowerCase() === 'gmail') {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: user,
                pass: pass
            }
        });
    } else {
        // Generic SMTP provider (e.g. institutional email, Google Workspace, Office 365)
        const host = process.env.MAIL_SMTP_HOST || 'smtp.gmail.com';
        const port = parseInt(process.env.MAIL_SMTP_PORT || '587', 10);
        const secure = process.env.MAIL_SMTP_SECURE === 'true'; // true for port 465, false for 587/25

        return nodemailer.createTransport({
            host: host,
            port: port,
            secure: secure,
            auth: {
                user: user,
                pass: pass
            },
            tls: {
                rejectUnauthorized: false
            }
        });
    }
}

const fromName = process.env.MAIL_FROM_NAME || 'K S R College of Engineering - Placement Portal';
const fromAddress = process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USER || 'no-reply@ksrce.ac.in';

module.exports = {
    createTransporter,
    fromEmail: `"${fromName}" <${fromAddress}>`
};
