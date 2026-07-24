require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const assert = require('assert');

// Load models
const Otp = require('../models/Otp');
const EmailLog = require('../models/EmailLog');
const { generateTemplate } = require('../services/mail/mailTemplates');
const EMAIL_EVENTS = require('../services/mail/emailEvents');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/placement-portal-test';

async function runTests() {
    console.log('🚀 Starting Placement Portal Mail & OTP Automated Test Suite...');
    
    // 1. Connect to Database
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully.');
    } catch (dbErr) {
        console.error('❌ Database connection failed. Tests cannot proceed without MongoDB.', dbErr);
        process.exit(1);
    }

    try {
        // Clear previous test collections
        await Otp.deleteMany({ email: /test-otp/ });
        await EmailLog.deleteMany({ recipient: /test-otp/ });

        // ==========================================
        // TEST 1: Template Generation & Colors
        // ==========================================
        console.log('\n--- Test 1: Role Coloring & Templates ---');
        
        // Student BLUE template check
        const studentWelcome = generateTemplate(EMAIL_EVENTS.WELCOME, 'student', {
            regNo: '12345678901',
            department: 'CSE',
            recipientName: 'Test Student'
        });
        assert.ok(studentWelcome.htmlBody.includes('#2085F6'), 'Student template must use Blue #2085F6');
        assert.ok(studentWelcome.htmlBody.includes('Test Student'), 'Student name must be present');
        console.log('✅ Student BLUE template validated.');

        // Coordinator RED template check
        const coordinatorAttendance = generateTemplate(EMAIL_EVENTS.DRIVE_ATTENDANCE_SUMMARY, 'coordinator', {
            companyName: 'Google',
            dept: 'CSE',
            totalStudents: 100,
            totalPresent: 90,
            totalAbsent: 10,
            percentage: 90,
            submittedBy: 'Coord Name'
        });
        assert.ok(coordinatorAttendance.htmlBody.includes('#D23B42'), 'Coordinator template must use Red #D23B42');
        assert.ok(coordinatorAttendance.htmlBody.includes('Google'), 'Company name must be present');
        console.log('✅ Coordinator RED template validated.');

        // Admin GREEN template check
        const adminWelcome = generateTemplate(EMAIL_EVENTS.WELCOME, 'admin', {
            username: 'admin',
            recipientName: 'System Admin'
        });
        assert.ok(adminWelcome.htmlBody.includes('#4EA24E'), 'Admin template must use Green #4EA24E');
        console.log('✅ Admin GREEN template validated.');

        // ==========================================
        // TEST 2: OTP Schema Generation & Hashing
        // ==========================================
        console.log('\n--- Test 2: OTP Creation, Hashing & Verification ---');
        
        const testEmail = 'test-otp-user@example.com';
        const purpose = 'EMAIL_VERIFICATION';
        const role = 'student';
        
        // Generate OTP values
        const plainOtp = crypto.randomInt(100000, 1000000).toString();
        const hashedOtp = await bcrypt.hash(plainOtp, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        // Save
        const otpRecord = new Otp({
            email: testEmail,
            hashedOtp,
            purpose,
            role,
            expiresAt
        });
        await otpRecord.save();
        console.log('💾 Test OTP saved to database.');

        // Verify hashing accuracy
        const isMatch = await bcrypt.compare(plainOtp, otpRecord.hashedOtp);
        assert.strictEqual(isMatch, true, 'Plaintext and Hashed OTP should match');
        console.log('✅ OTP hashing check passed.');

        // ==========================================
        // TEST 3: Attempts Limiting & Throttling
        // ==========================================
        console.log('\n--- Test 3: OTP Attempts Limiting ---');
        
        // Mock wrong entries
        let attemptsLeft = 3;
        for (let i = 1; i <= 3; i++) {
            const currentRecord = await Otp.findOne({ email: testEmail, purpose });
            assert.ok(currentRecord, 'OTP record must still exist');

            const match = await bcrypt.compare('000000', currentRecord.hashedOtp);
            if (!match) {
                currentRecord.attempts += 1;
                await currentRecord.save();
            }

            attemptsLeft = currentRecord.maxAttempts - currentRecord.attempts;
            console.log(`Attempt ${i} (Incorrect Code): Remaining attempts = ${attemptsLeft}`);

            if (attemptsLeft <= 0) {
                await Otp.deleteOne({ _id: currentRecord._id });
                console.log('🗑️ OTP record deleted due to excessive failures.');
            }
        }

        const finalRecord = await Otp.findOne({ email: testEmail, purpose });
        assert.strictEqual(finalRecord, null, 'OTP record must be deleted after max attempts exceeded');
        console.log('✅ OTP throttling & limit protection validated.');

        // ==========================================
        // TEST 4: Email Log Idempotency Checks
        // ==========================================
        console.log('\n--- Test 4: Idempotency Logging ---');
        
        const idempotencyKey = `WELCOME:test-student-id-${Date.now()}`;
        
        // Log 1: Send pending
        const firstLog = new EmailLog({
            eventType: EMAIL_EVENTS.WELCOME,
            recipient: 'test-otp-welcome@example.com',
            role: 'student',
            status: 'sent',
            idempotencyKey
        });
        await firstLog.save();
        console.log('💾 Initial EmailLog created successfully.');

        // Attempting to insert duplicate key
        try {
            const secondLog = new EmailLog({
                eventType: EMAIL_EVENTS.WELCOME,
                recipient: 'test-otp-welcome@example.com',
                role: 'student',
                status: 'sent',
                idempotencyKey
            });
            await secondLog.save();
            assert.fail('Database should reject duplicate idempotency keys');
        } catch (dbErr) {
            assert.ok(dbErr.code === 11000, 'Error code must be duplicate key error (11000)');
            console.log('✅ Idempotency uniqueness verified (DB rejected duplicate successfully).');
        }

        console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY.');

    } catch (testError) {
        console.error('\n❌ TEST SUITE FAILED WITH ERROR:', testError);
        process.exit(1);
    } finally {
        // Clean up test documents
        await Otp.deleteMany({ email: /test-otp/ });
        await EmailLog.deleteMany({ recipient: /test-otp/ });
        await mongoose.connection.close();
        console.log('🔌 Database connection closed.');
    }
}

runTests();
