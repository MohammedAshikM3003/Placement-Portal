const nodemailer = require('nodemailer');

/**
 * Creates and configures Nodemailer SMTP transporter.
 * Supports Gmail and institutional SMTP providers with IPv4 enforcement.
 */
function createTransporter() {
    const provider = (process.env.MAIL_PROVIDER || 'gmail').toLowerCase();
    const user = process.env.MAIL_USER ? process.env.MAIL_USER.trim() : undefined;
    const pass = process.env.MAIL_PASSWORD ? process.env.MAIL_PASSWORD.trim() : undefined;

    if (!user || !pass) {
        console.warn('[MailConfig Warning] MAIL_USER or MAIL_PASSWORD environment variables are not set.');
    }

    // Determine host, port, and security settings
    let host = process.env.MAIL_SMTP_HOST || 'smtp.gmail.com';
    let port = parseInt(process.env.MAIL_SMTP_PORT || '587', 10);
    let secure = process.env.MAIL_SMTP_SECURE === 'true';

    // Default configuration for Gmail provider if not explicitly overridden by MAIL_SMTP_* vars
    if (provider === 'gmail' && !process.env.MAIL_SMTP_PORT) {
        // Port 587 STARTTLS (standard) or Port 465 SSL depending on MAIL_SMTP_SECURE
        port = secure ? 465 : 587;
    }

    const transportOptions = {
        host: host,
        port: port,
        secure: secure, // false for 587 STARTTLS, true for 465 Direct SSL
        family: 4,      // Force IPv4 to bypass Render IPv6 ENETUNREACH network routing issue
        auth: {
            user: user,
            pass: pass
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 20000
    };

    return nodemailer.createTransport(transportOptions);
}

const fromName = process.env.MAIL_FROM_NAME || 'K S R College of Engineering - Placement Portal';
const fromAddress = process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USER || 'no-reply@ksrce.ac.in';

module.exports = {
    createTransporter,
    fromEmail: `"${fromName}" <${fromAddress}>`
};
