require('dotenv').config();
const { sendMail, EMAIL_EVENTS } = require('../services/mail/mailService');

async function sendRoleOtps() {
    const testRecipient = process.env.TEST_RECIPIENT_EMAIL;
    if (!testRecipient) {
        console.error('TEST_RECIPIENT_EMAIL is not set in backend/.env');
        process.exit(1);
    }

    console.log(`Sending role-based OTP emails to ${testRecipient}...`);

    // 1. Student OTP (Blue #2085F6)
    try {
        console.log('Sending Student OTP (Blue)...');
        await sendMail({
            eventType: EMAIL_EVENTS.OTP_VERIFICATION,
            to: testRecipient,
            role: 'student',
            data: {
                otp: '120856',
                recipientName: 'Test Student'
            }
        });
        console.log('✅ Student OTP sent.');
    } catch (e) {
        console.error('❌ Failed to send Student OTP:', e.message);
    }

    // 2. Coordinator OTP (Red #D23B42)
    try {
        console.log('Sending Coordinator OTP (Red)...');
        await sendMail({
            eventType: EMAIL_EVENTS.OTP_VERIFICATION,
            to: testRecipient,
            role: 'coordinator',
            data: {
                otp: '323421',
                recipientName: 'Test Coordinator'
            }
        });
        console.log('✅ Coordinator OTP sent.');
    } catch (e) {
        console.error('❌ Failed to send Coordinator OTP:', e.message);
    }

    // 3. Admin OTP (Green #4EA24E)
    try {
        console.log('Sending Admin OTP (Green)...');
        await sendMail({
            eventType: EMAIL_EVENTS.OTP_VERIFICATION,
            to: testRecipient,
            role: 'admin',
            data: {
                otp: '442499',
                recipientName: 'Test Admin'
            }
        });
        console.log('✅ Admin OTP sent.');
    } catch (e) {
        console.error('❌ Failed to send Admin OTP:', e.message);
    }

    console.log('\nAll 3 OTP test emails sent. Please verify the visual coloring in your inbox.');
}

sendRoleOtps();
