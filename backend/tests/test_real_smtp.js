require('dotenv').config();
const nodemailer = require('nodemailer');
const { generateTemplate } = require('../services/mail/mailTemplates');
const EMAIL_EVENTS = require('../services/mail/emailEvents');

async function runDiagnostics() {
    console.log('=== SMTP CONNECTION STRATEGY DIAGNOSTICS ===');
    
    const user = process.env.MAIL_USER;
    const pass = process.env.MAIL_PASSWORD;
    const testRecipient = process.env.TEST_RECIPIENT_EMAIL;

    if (!user || !pass || !testRecipient) {
        console.error('Missing configuration variables in backend/.env.');
        process.exit(1);
    }

    const strategies = [
        {
            name: 'Strategy 1: Nodemailer Built-in Gmail Service',
            config: {
                service: 'gmail',
                auth: { user, pass }
            }
        },
        {
            name: 'Strategy 2: Direct SMTP SSL (Host: smtp.gmail.com, Port: 465)',
            config: {
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: { user, pass }
            }
        },
        {
            name: 'Strategy 3: Direct SMTP STARTTLS (Host: smtp.gmail.com, Port: 587)',
            config: {
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: { user, pass }
            }
        }
    ];

    let authenticatedStrategy = null;
    let transporterToUse = null;

    for (const strategy of strategies) {
        console.log(`\nTesting ${strategy.name}...`);
        try {
            const transporter = nodemailer.createTransport(strategy.config);
            await transporter.verify();
            console.log(`✅ SUCCESS: ${strategy.name} authenticated successfully!`);
            authenticatedStrategy = strategy.name;
            transporterToUse = transporter;
            break; // Stop on first success
        } catch (err) {
            console.log(`❌ FAILED: ${strategy.name}`);
            console.log(`   Error: ${err.message}`);
        }
    }

    if (!transporterToUse) {
        console.error('\n❌ ALL STRATEGIES FAILED. Gmail continues to reject the credentials (535 BadCredentials).');
        console.log('Please double check that you generated the App Password on the CORRECT account and copied it exactly.');
        process.exit(1);
    }

    console.log(`\n=== SENDING TEST EMAIL USING ${authenticatedStrategy} ===`);
    try {
        const mailOptions = {
            from: `"K S R College of Engineering - Placement Portal" <${user}>`,
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
        <p>Strategy Used: <strong>${authenticatedStrategy}</strong></p>
        <p>Recipient: <strong>${testRecipient}</strong></p>
    </div>
</body>
</html>
            `
        };

        const info = await transporterToUse.sendMail(mailOptions);
        console.log('Gmail Accepted Message: PASS');
        console.log(`Provider Message ID: ${info.messageId}`);
        console.log('Inbox Delivery: REQUIRES MANUAL CONFIRMATION');
    } catch (sendErr) {
        console.log('Gmail Accepted Message: FAIL');
        console.error('Send Error:', sendErr.message);
    }
}

runDiagnostics();
