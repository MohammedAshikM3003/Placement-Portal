require('dotenv').config();
const { createTransporter, fromEmail } = require('../services/mail/mailConfig');
const { generateTemplate } = require('../services/mail/mailTemplates');
const EMAIL_EVENTS = require('../services/mail/emailEvents');

async function testGmailIntegration() {
    console.log('=== STEP 1: CONFIGURATION AUDIT ===');
    
    const provider = process.env.MAIL_PROVIDER;
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASSWORD;
    const fromName = process.env.MAIL_FROM_NAME;
    const fromAddress = process.env.MAIL_FROM_ADDRESS;
    const testRecipient = process.env.TEST_RECIPIENT_EMAIL;

    console.log(`MAIL_PROVIDER: ${provider ? provider : '[MISSING]'}`);
    console.log(`MAIL_USER: ${user ? user : '[MISSING]'}`);
    console.log(`MAIL_PASSWORD: ${pass ? '[CONFIGURED]' : '[MISSING]'}`);
    console.log(`MAIL_FROM_NAME: ${fromName ? fromName : '[MISSING]'}`);
    console.log(`MAIL_FROM_ADDRESS: ${fromAddress ? fromAddress : '[MISSING]'}`);
    console.log(`TEST_RECIPIENT_EMAIL: ${testRecipient ? testRecipient : '[MISSING]'}`);

    if (!provider || !user || !pass) {
        console.error('\n❌ ERROR: Mail configuration is incomplete. Please ensure MAIL_PROVIDER, MAIL_USER, and MAIL_PASSWORD are saved in your backend/.env file.');
        process.exit(1);
    }

    if (!testRecipient) {
        console.error('\n❌ ERROR: TEST_RECIPIENT_EMAIL is not configured. Please add it to your backend/.env to specify where the test email should go.');
        process.exit(1);
    }

    console.log('\n=== STEP 2: SMTP CONNECTION TEST ===');
    let transporter;
    try {
        transporter = createTransporter();
        console.log('Connecting to SMTP server...');
        await transporter.verify();
        console.log('SMTP Authentication: PASS');
    } catch (authErr) {
        console.log('SMTP Authentication: FAIL');
        console.error('Sanitized Connection Error:', authErr.message || authErr);
        process.exit(1);
    }

    console.log('\n=== STEP 3: SEND ONE CONTROLLED TEST EMAIL ===');
    try {
        const mailOptions = {
            from: fromEmail,
            to: testRecipient.trim(),
            subject: 'Placement Portal - Mail Service Test',
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Poppins', sans-serif; background-color: #f4f6f9; padding: 20px; }
        .card { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); border-top: 4px solid #2085F6; }
        h2 { color: #111; }
        p { color: #444; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="card">
        <h2>Placement Portal</h2>
        <p>This is a development test email from the Placement Portal mail service. No action is required.</p>
        <p>Sender: <strong>${fromEmail}</strong></p>
        <p>Recipient: <strong>${testRecipient}</strong></p>
    </div>
</body>
</html>
            `
        };

        console.log(`Sending controlled test email to: ${testRecipient}...`);
        const info = await transporter.sendMail(mailOptions);
        console.log('Gmail Accepted Message: PASS');
        console.log(`Provider Message ID: ${info.messageId}`);
        console.log('\n=== STEP 4: RESULT SUMMARY ===');
        console.log('SMTP Authentication: PASS');
        console.log('Gmail Accepted Message: PASS');
        console.log(`Provider Message ID: ${info.messageId}`);
        console.log('Inbox Delivery: REQUIRES MANUAL CONFIRMATION');
    } catch (sendErr) {
        console.log('Gmail Accepted Message: FAIL');
        console.error('Sanitized Send Error:', sendErr.message || sendErr);
        process.exit(1);
    }
}

testGmailIntegration();
