const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createTransporter } = require('../services/mail/mailConfig');

async function testProductionMailConfig() {
    console.log('=== PRODUCTION MAIL CONFIGURATION DIAGNOSTICS ===');
    
    const provider = process.env.MAIL_PROVIDER || 'gmail';
    const userConfigured = Boolean(process.env.MAIL_USER);
    const passwordConfigured = Boolean(process.env.MAIL_PASSWORD);
    const fromAddressConfigured = Boolean(process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USER);
    const nodeEnv = process.env.NODE_ENV || 'development';

    console.log(`[PASS] MAIL_PROVIDER configured: (${provider})`);
    console.log(`[${userConfigured ? 'PASS' : 'FAIL'}] MAIL_USER configured: ${userConfigured}`);
    console.log(`[${passwordConfigured ? 'PASS' : 'FAIL'}] MAIL_PASSWORD configured: ${passwordConfigured}`);
    console.log(`[${fromAddressConfigured ? 'PASS' : 'FAIL'}] MAIL_FROM_ADDRESS configured: ${fromAddressConfigured}`);
    console.log(`Environment: ${nodeEnv}`);

    if (!userConfigured || !passwordConfigured) {
        console.error('\n❌ CONFIGURATION FAILED: MAIL_USER or MAIL_PASSWORD missing in environment.');
        process.exit(1);
    }

    try {
        console.log('\nCreating Nodemailer Transporter...');
        const transporter = createTransporter();
        console.log('[PASS] Nodemailer transporter created');

        console.log('Executing transporter.verify()...');
        await transporter.verify();
        console.log('[PASS] SMTP transporter.verify() - Connection and authentication succeeded!');
    } catch (err) {
        console.error('[FAIL] SMTP transporter.verify() - Connection/Auth Error');
        console.error(`- Error Code: ${err.code || 'N/A'}`);
        console.error(`- Response Code: ${err.responseCode || 'N/A'}`);
        console.error(`- Command: ${err.command || 'N/A'}`);
        console.error(`- Message: ${err.message || 'Unknown error'}`);
        process.exit(1);
    }
}

testProductionMailConfig();
