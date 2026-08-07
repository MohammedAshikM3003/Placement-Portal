const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend/.env') });

async function directBrevoTest() {
    const brevoKey = process.env.BREVO_API_KEY;
    const fromAddr = process.env.MAIL_FROM_ADDRESS || 'placementportalksrce@gmail.com';
    console.log('Sending direct request to Brevo API...');
    try {
        const res = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': brevoKey.trim(),
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: 'K S R Placement Cell', email: fromAddr },
                to: [{ email: 'mohammedashikmcse2427@ksrce.ac.in' }],
                subject: 'Diagnostic Test Email',
                htmlContent: '<p>Testing Brevo API dispatch</p>'
            })
        });
        const data = await res.json();
        console.log('Status Code:', res.status);
        console.log('Response Body:', data);
    } catch (err) {
        console.error('Fetch Exception:', err);
    }
}

directBrevoTest();
