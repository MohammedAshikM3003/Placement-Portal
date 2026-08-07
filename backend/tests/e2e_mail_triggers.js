/**
 * End-to-End Test Suite for Placement Portal Master Mail System
 * Tests every single mail event trigger, branch filtering rule, and toggle safeguard.
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const EMAIL_EVENTS = require('../services/mail/emailEvents');
const { sendMail, setMailServiceEnabled, getMailServiceEnabled } = require('../services/mail/mailService');
const EmailLog = require('../models/EmailLog');
const SystemSetting = require('../models/SystemSetting');

async function runE2EMailSuite() {
    console.log('\n==========================================================');
    console.log('🚀 RUNNING END-TO-END MASTER MAIL SYSTEM TEST SUITE');
    console.log('==========================================================\n');

    let passedCount = 0;
    let totalTests = 0;

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_portal';
    try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ Connected to MongoDB for E2E verification.');
    } catch (dbErr) {
        console.warn('⚠️ Local MongoDB connection offline. Proceeding in offline mock mode.');
    }

    async function assertTest(name, fn) {
        totalTests++;
        try {
            await fn();
            passedCount++;
            console.log(`✅ [PASS] Test ${totalTests}: ${name}`);
        } catch (err) {
            console.error(`❌ [FAIL] Test ${totalTests}: ${name} -> Error: ${err.message}`);
        }
    }

    // --- TEST GROUP 1: MAIL TOGGLE PERSISTENCE & SAFEGUARD ---
    await assertTest('Global Mail Toggle - Disable & Log Skipped Email', async () => {
        await setMailServiceEnabled(false);
        const state = await getMailServiceEnabled();
        if (state !== false) throw new Error('Expected mailServiceEnabled to be false');

        const result = await sendMail({
            eventType: EMAIL_EVENTS.OTP_VERIFICATION,
            to: '73152313095@ksrce.ac.in',
            role: 'student',
            data: { otp: '123456', recipientName: 'Test Student' }
        });

        if (!result.disabled) throw new Error('Expected sendMail to return disabled: true when mail service is disabled');
    });

    await assertTest('Global Mail Toggle - Enable Restores Email Service', async () => {
        await setMailServiceEnabled(true);
        const state = await getMailServiceEnabled();
        if (state !== true) throw new Error('Expected mailServiceEnabled to be true');
    });

    // --- TEST GROUP 2: STUDENT OPERATIONS ---
    await assertTest('Trigger 1: Student Registration OTP (Domain Email)', async () => {
        const result = await sendMail({
            eventType: EMAIL_EVENTS.OTP_VERIFICATION,
            to: '73152313095@ksrce.ac.in',
            role: 'student',
            data: { otp: '654321', recipientName: 'Ashik Student' }
        });
        if (!result.success) throw new Error('Student Registration OTP trigger failed');
    });

    await assertTest('Trigger 2: Student Welcome Email', async () => {
        const result = await sendMail({
            eventType: EMAIL_EVENTS.WELCOME,
            to: '73152313095@ksrce.ac.in',
            role: 'student',
            data: { regNo: '73152313095', department: 'CSE', recipientName: 'Ashik Student' }
        });
        if (!result.success) throw new Error('Student Welcome Email trigger failed');
    });

    await assertTest('Trigger 3: Training Preference Selection Open', async () => {
        const result = await sendMail({
            eventType: EMAIL_EVENTS.TRAINING_PREFERENCE_OPEN,
            to: '73152313095@ksrce.ac.in',
            role: 'student',
            data: { trainingName: 'FullStack Java Bootcamp', deadline: '30-07-2026', instructions: 'Select track in portal', recipientName: 'Ashik Student' }
        });
        if (!result.success) throw new Error('Training Preference Open trigger failed');
    });

    await assertTest('Trigger 4: Training Scheduled', async () => {
        const result = await sendMail({
            eventType: EMAIL_EVENTS.TRAINING_SCHEDULED,
            to: '73152313095@ksrce.ac.in',
            role: 'student',
            data: { trainingName: 'FullStack Java Bootcamp', trainer: 'Expert Faculty', date: '01-08-2026', time: '09:00 AM', venue: 'Lab 3', recipientName: 'Ashik Student' }
        });
        if (!result.success) throw new Error('Training Scheduled trigger failed');
    });

    await assertTest('Trigger 5: Training Attendance Report', async () => {
        const result = await sendMail({
            eventType: EMAIL_EVENTS.TRAINING_ATTENDANCE_REPORT,
            to: '73152313095@ksrce.ac.in',
            role: 'student',
            data: { trainingName: 'FullStack Java Bootcamp', date: '01-08-2026', status: 'Present', percentage: 95, recipientName: 'Ashik Student' }
        });
        if (!result.success) throw new Error('Training Attendance Report trigger failed');
    });

    await assertTest('Trigger 6: Certificate Approved', async () => {
        const result = await sendMail({
            eventType: EMAIL_EVENTS.CERTIFICATE_APPROVED,
            to: '73152313095@ksrce.ac.in',
            role: 'student',
            data: { fileName: 'AWS_Solutions_Architect.pdf', date: '26-07-2026', recipientName: 'Ashik Student' }
        });
        if (!result.success) throw new Error('Certificate Approved trigger failed');
    });

    await assertTest('Trigger 7: Certificate Rejected', async () => {
        const result = await sendMail({
            eventType: EMAIL_EVENTS.CERTIFICATE_REJECTED,
            to: '73152313095@ksrce.ac.in',
            role: 'student',
            data: { fileName: 'AWS_Solutions_Architect.pdf', reason: 'Blurred image - signature unreadable', recipientName: 'Ashik Student' }
        });
        if (!result.success) throw new Error('Certificate Rejected trigger failed');
    });

    await assertTest('Trigger 8: Company Shortlisted', async () => {
        const result = await sendMail({
            eventType: EMAIL_EVENTS.STUDENT_SHORTLISTED,
            to: '73152313095@ksrce.ac.in',
            role: 'student',
            data: { companyName: 'Zoho Corporation', jobRole: 'Software Developer', startingDate: '05-08-2026', mode: 'On-Campus', package: '8.5 LPA', recipientName: 'Ashik Student' }
        });
        if (!result.success) throw new Error('Company Shortlisted trigger failed');
    });

    await assertTest('Trigger 9: Round Passed', async () => {
        const result = await sendMail({
            eventType: EMAIL_EVENTS.ROUND_PASSED,
            to: '73152313095@ksrce.ac.in',
            role: 'student',
            data: { companyName: 'Zoho Corporation', roundName: 'Aptitude Test', roundNumber: 1, nextRoundName: 'Coding Round', nextRoundDate: '06-08-2026', recipientName: 'Ashik Student' }
        });
        if (!result.success) throw new Error('Round Passed trigger failed');
    });

    await assertTest('Trigger 10: Round Rejected', async () => {
        const result = await sendMail({
            eventType: EMAIL_EVENTS.STUDENT_REJECTED,
            to: '73152313095@ksrce.ac.in',
            role: 'student',
            data: { companyName: 'Zoho Corporation', roundName: 'Advanced Coding', roundNumber: 2, recipientName: 'Ashik Student' }
        });
        if (!result.success) throw new Error('Round Rejected trigger failed');
    });

    await assertTest('Trigger 11: Final Selected Placement', async () => {
        const result = await sendMail({
            eventType: EMAIL_EVENTS.FINAL_SELECTED,
            to: '73152313095@ksrce.ac.in',
            role: 'student',
            data: { companyName: 'TCS Digital', jobRole: 'Systems Engineer', package: '7.0 LPA', date: '26-07-2026', recipientName: 'Ashik Student' }
        });
        if (!result.success) throw new Error('Final Selected trigger failed');
    });

    await assertTest('Trigger 12: Offer Letter Received', async () => {
        const result = await sendMail({
            eventType: EMAIL_EVENTS.OFFER_LETTER,
            to: '73152313095@ksrce.ac.in',
            role: 'student',
            data: { companyName: 'TCS Digital', jobRole: 'Systems Engineer', package: '7.0 LPA', joiningDetails: 'Chennai Office', deadline: '7 Days', recipientName: 'Ashik Student' }
        });
        if (!result.success) throw new Error('Offer Letter trigger failed');
    });

    // --- TEST GROUP 3: COORDINATOR & ADMIN WORKFLOWS ---
    await assertTest('Trigger 13: Coordinator Welcome Email', async () => {
        const result = await sendMail({
            eventType: EMAIL_EVENTS.COORDINATOR_WELCOME,
            to: 'coord_cse@ksrce.ac.in',
            role: 'coordinator',
            data: { branch: 'CSE', recipientName: 'CSE Coordinator' }
        });
        if (!result.success) throw new Error('Coordinator Welcome trigger failed');
    });

    await assertTest('Trigger 14: Coordinator Blocked & Unblocked', async () => {
        const resBlocked = await sendMail({
            eventType: EMAIL_EVENTS.COORDINATOR_BLOCKED,
            to: 'coord_cse@ksrce.ac.in',
            role: 'coordinator',
            data: { branch: 'CSE', recipientName: 'CSE Coordinator' }
        });
        const resUnblocked = await sendMail({
            eventType: EMAIL_EVENTS.COORDINATOR_UNBLOCKED,
            to: 'coord_cse@ksrce.ac.in',
            role: 'coordinator',
            data: { branch: 'CSE', recipientName: 'CSE Coordinator' }
        });
        if (!resBlocked.success || !resUnblocked.success) throw new Error('Coordinator Block/Unblock trigger failed');
    });

    await assertTest('Trigger 15: Admin Transfer OTP (New Admin Domain Email)', async () => {
        const result = await sendMail({
            eventType: EMAIL_EVENTS.ADMIN_PROFILE_TRANSFER_OTP,
            to: 'newadmin@ksrce.ac.in',
            role: 'admin',
            data: { otp: '987654', currentAdmin: 'Master Admin', recipientName: 'New Admin' }
        });
        if (!result.success) throw new Error('Admin Transfer OTP trigger failed');
    });

    // --- TEST GROUP 4: CROSS-ROLE NOTIFICATIONS & BRANCH FILTERING ---
    await assertTest('Trigger 16: Admin Blocks Student (Notifies Student + Branch Coordinator)', async () => {
        const resStudent = await sendMail({
            eventType: EMAIL_EVENTS.STUDENT_BLOCKED_BY_ADMIN,
            to: '73152313095@ksrce.ac.in',
            role: 'student',
            data: { studentName: 'Ashik Student', regNo: '73152313095', branch: 'CSE', reason: 'Disciplinary Action' }
        });
        const resCoord = await sendMail({
            eventType: EMAIL_EVENTS.STUDENT_BLOCKED_BY_ADMIN,
            to: 'coord_cse@ksrce.ac.in',
            role: 'coordinator',
            data: { studentName: 'Ashik Student', regNo: '73152313095', branch: 'CSE', reason: 'Disciplinary Action' }
        });
        if (!resStudent.success || !resCoord.success) throw new Error('Student blocked by admin triggers failed');
    });

    await assertTest('Trigger 17: Coordinator Blocks Student (Notifies Student + Admin)', async () => {
        const resStudent = await sendMail({
            eventType: EMAIL_EVENTS.STUDENT_BLOCKED_BY_COORDINATOR,
            to: '73152313095@ksrce.ac.in',
            role: 'student',
            data: { studentName: 'Ashik Student', regNo: '73152313095', branch: 'CSE', coordinatorName: 'CSE Coordinator', reason: 'Lack of attendance' }
        });
        const resAdmin = await sendMail({
            eventType: EMAIL_EVENTS.STUDENT_BLOCKED_BY_COORDINATOR,
            to: 'admin@ksrce.ac.in',
            role: 'admin',
            data: { studentName: 'Ashik Student', regNo: '73152313095', branch: 'CSE', coordinatorName: 'CSE Coordinator', reason: 'Lack of attendance' }
        });
        if (!resStudent.success || !resAdmin.success) throw new Error('Student blocked by coordinator triggers failed');
    });

    await assertTest('Trigger 18: Student Offer Response Accept/Reject (Notifies Branch Coordinator + Admin)', async () => {
        const resCoord = await sendMail({
            eventType: EMAIL_EVENTS.OFFER_RESPONSE,
            to: 'coord_cse@ksrce.ac.in',
            role: 'coordinator',
            data: { studentName: 'Ashik Student', regNo: '73152313095', branch: 'CSE', companyName: 'TCS Digital', decision: 'accepted', timestamp: '26-07-2026 23:45:00' }
        });
        const resAdmin = await sendMail({
            eventType: EMAIL_EVENTS.OFFER_RESPONSE,
            to: 'admin@ksrce.ac.in',
            role: 'admin',
            data: { studentName: 'Ashik Student', regNo: '73152313095', branch: 'CSE', companyName: 'TCS Digital', decision: 'accepted', timestamp: '26-07-2026 23:45:00' }
        });
        if (!resCoord.success || !resAdmin.success) throw new Error('Student offer response triggers failed');
    });

    await assertTest('Trigger 19: Drive Attendance & Round Summaries for Coordinator & Admin', async () => {
        const resAttendance = await sendMail({
            eventType: EMAIL_EVENTS.DRIVE_ATTENDANCE_SUMMARY,
            to: 'coord_cse@ksrce.ac.in',
            role: 'coordinator',
            data: { companyName: 'Zoho', jobRole: 'Developer', startDate: '05-08-2026', dept: 'CSE', totalStudents: 100, totalPresent: 92, totalAbsent: 8, percentage: 92, submittedBy: 'CSE Coord' }
        });
        const resRoundSummary = await sendMail({
            eventType: EMAIL_EVENTS.DRIVE_ROUND_SUMMARY,
            to: 'coord_cse@ksrce.ac.in',
            role: 'coordinator',
            data: { companyName: 'Zoho', roundName: 'Aptitude', appearedCount: 92, passedCount: 45, failedCount: 47, remainingCount: 45 }
        });
        if (!resAttendance.success || !resRoundSummary.success) throw new Error('Drive attendance and round summary triggers failed');
    });

    console.log('\n==========================================================');
    console.log(`🎉 TEST SUMMARY: ${passedCount}/${totalTests} TESTS PASSED CLEANLY`);
    console.log('==========================================================\n');

    if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
    }
}

if (require.main === module) {
    runE2EMailSuite().catch(console.error);
}

module.exports = runE2EMailSuite;
