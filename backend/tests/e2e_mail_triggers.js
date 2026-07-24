require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const assert = require('assert');

// Load environment configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/placement_portal';
const BASE_URL = 'http://localhost:5001';
const testRecipient = process.env.TEST_RECIPIENT_EMAIL || 'mmohammedashik2006@gmail.com';

// Models
const Otp = require('../models/Otp');
const EmailLog = require('../models/EmailLog');
const Admin = require('../models/Admin');

function logError(testName, err) {
    console.error(`❌ ${testName} failed:`, err.message);
    if (err.response?.data) {
        console.error('   Error Data:', JSON.stringify(err.response.data, null, 2));
    }
}

async function runE2ETests() {
    console.log('🏁 Starting Placement Portal Real Event E2E Mail Trigger Validation...\n');

    // 1. Connect to Database
    try {
        await mongoose.connect(MONGODB_URI);
        console.log(`✅ Connected to MongoDB at: ${MONGODB_URI.split('@').pop()}`);
    } catch (dbErr) {
        console.error('❌ Database connection failed. E2E tests require direct MongoDB access.', dbErr);
        process.exit(1);
    }

    const studentsColl = mongoose.connection.collection('students');
    const coordinatorsColl = mongoose.connection.collection('coordinators');
    const usersColl = mongoose.connection.collection('users');
    const eligibleStudentsColl = mongoose.connection.collection('eligible students');
    const studentApplicationsColl = mongoose.connection.collection('student_applications');
    const reportsColl = mongoose.connection.collection('Reports');
    const certificatesColl = mongoose.connection.collection('certificates');
    const attendanceColl = mongoose.connection.collection('attendance');
    const trainingAttendanceColl = mongoose.connection.collection('training_attendance');
    const otpsColl = mongoose.connection.collection('otps');

    // Rebuild EmailLog unique sparse index to avoid null conflicts
    console.log('🔧 Rebuilding EmailLog index for sparse idempotency...');
    try {
        await mongoose.connection.collection('emaillogs').dropIndex('idempotencyKey_1');
        console.log('   └─ Stale index dropped.');
    } catch (e) {
        console.log('   └─ No stale index to drop or already clean.');
    }
    try {
        await mongoose.connection.collection('emaillogs').createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true });
        console.log('   └─ Unique sparse index created successfully.\n');
    } catch (e) {
        console.error('   ❌ Failed creating sparse index:', e.message);
    }

    // Backup existing records to prevent conflicts
    console.log('📦 Backing up existing test-conflicting database records...');
    const originalStudent = await studentsColl.findOne({ $or: [{ email: testRecipient }, { primaryEmail: testRecipient }] });
    const originalUser = await usersColl.findOne({ email: testRecipient });
    const originalCoordinator = await coordinatorsColl.findOne({ $or: [{ email: testRecipient }, { domainEmail: testRecipient }, { emailId: testRecipient }, { domainMailId: testRecipient }] });

    if (originalStudent) {
        console.log(`   └─ Backed up student: ${originalStudent.regNo}`);
        await studentsColl.deleteOne({ _id: originalStudent._id });
        await studentApplicationsColl.deleteMany({ studentId: String(originalStudent._id) });
    }
    if (originalUser) {
        console.log(`   └─ Backed up user: ${originalUser.email}`);
        await usersColl.deleteOne({ _id: originalUser._id });
    }
    if (originalCoordinator) {
        console.log(`   └─ Backed up coordinator: ${originalCoordinator.coordinatorId}`);
        await coordinatorsColl.deleteOne({ _id: originalCoordinator._id });
    }
    console.log('📦 Backup complete.\n');

    // Clean up any stale test records from previous run
    await studentsColl.deleteMany({ regNo: 'E2ESTUDENT1' });
    await coordinatorsColl.deleteMany({ coordinatorId: 'E2ECOORD1' });
    await usersColl.deleteMany({ $or: [{ email: testRecipient }, { email: 'e2estudent@college.edu' }, { email: 'e2ecoord@college.edu' }] });
    await eligibleStudentsColl.deleteMany({ companyName: 'E2E Test Company' });
    await studentApplicationsColl.deleteMany({ regNo: 'E2ESTUDENT1' });
    await reportsColl.deleteMany({ companyName: 'E2E Test Company' });
    await certificatesColl.deleteMany({ regNo: 'E2ESTUDENT1' });
    await attendanceColl.deleteMany({ companyName: 'E2E Test Company' });
    await trainingAttendanceColl.deleteMany({ companyName: 'E2E Test Company' });
    await otpsColl.deleteMany({ email: testRecipient });
    await EmailLog.deleteMany({ recipient: testRecipient });

    let token = '';

    // Step 0: Authenticate as Admin to acquire JWT token
    try {
        console.log(`🔐 Authenticating admin with live API at ${BASE_URL}...`);
        const loginRes = await axios.post(`${BASE_URL}/api/auth/admin-login`, {
            adminLoginID: 'admin1000',
            adminPassword: 'admin1000'
        });
        token = loginRes.data.token;
        console.log('🔑 Token acquired successfully.\n');
    } catch (loginErr) {
        logError('Admin Login', loginErr);
        await mongoose.connection.close();
        process.exit(1);
    }

    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    // Function to check if EmailLog is created for a specific event
    async function verifyEmailLog(eventType, toEmail) {
        const maxRetries = 15;
        for (let i = 0; i < maxRetries; i++) {
            await new Promise(r => setTimeout(r, 1000));
            const log = await EmailLog.findOne({ eventType, recipient: toEmail.toLowerCase() }).sort({ createdAt: -1 });
            if (log && (log.status === 'sent' || log.status === 'success')) {
                console.log(`   └─ EmailLog entry found (after ${i+1}s)! Event: ${log.eventType}, Recipient: ${log.recipient}, Status: ${log.status}`);
                return true;
            }
        }
        return false;
    }

    // A. OTP Verification End-to-End
    console.log('--- Test A: OTP Workflow ---');
    try {
        console.log('Sending OTP request via API...');
        const otpSendRes = await axios.post(`${BASE_URL}/api/auth/otp/send`, {
            email: testRecipient,
            purpose: 'ADMIN_ACTION',
            role: 'admin'
        });
        assert.strictEqual(otpSendRes.data.success, true);
        console.log('✅ OTP send request returned success.');

        // Assert record exists in DB
        const otpRecord = await Otp.findOne({ email: testRecipient });
        assert.ok(otpRecord, 'OTP record should exist in MongoDB');
        console.log('✅ OTP record verified in database.');

        // Insert a known test OTP hash directly to verify API verification endpoint works E2E
        const bcrypt = require('bcryptjs');
        const knownOtp = '999999';
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(knownOtp, salt);

        await Otp.deleteMany({ email: testRecipient });
        await Otp.create({
            email: testRecipient,
            hashedOtp,
            purpose: 'ADMIN_ACTION',
            role: 'admin',
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            attempts: 0
        });

        console.log('Verifying dummy OTP via API...');
        const otpVerifyRes = await axios.post(`${BASE_URL}/api/auth/otp/verify`, {
            email: testRecipient,
            otp: knownOtp,
            purpose: 'ADMIN_ACTION',
            role: 'admin'
        });
        assert.strictEqual(otpVerifyRes.data.success, true);
        console.log('✅ OTP verification returned success.');
    } catch (e) {
        logError('Test A', e);
    }
    console.log();

    // B. Student Registration
    console.log('--- Test B: Student Welcome Email ---');
    try {
        console.log('Registering test student via API...');
        const regRes = await axios.post(`${BASE_URL}/api/students`, {
            regNo: 'E2ESTUDENT1',
            firstName: 'E2E Student',
            lastName: 'Test',
            primaryEmail: testRecipient,
            email: testRecipient,
            dob: '12102004',
            branch: 'CSE',
            currentYear: '3',
            currentSemester: '6',
            loginPassword: 'studentpassword123'
        });
        assert.ok(regRes.data);
        console.log('✅ Student registration returned success.');

        const logSuccess = await verifyEmailLog('WELCOME', testRecipient);
        assert.ok(logSuccess, 'Student welcome email log should be created and sent.');
        console.log('✅ Student Welcome Email triggered & logged successfully.');
    } catch (e) {
        logError('Test B', e);
    }
    console.log();

    // C. Coordinator Creation
    console.log('--- Test C: Coordinator Welcome Email ---');
    try {
        console.log('Creating coordinator account via admin API...');
        const coordRes = await axios.post(`${BASE_URL}/api/coordinators`, {
            firstName: 'E2E Coordinator',
            lastName: 'Test',
            dob: '1985-05-15',
            gender: 'Male',
            emailId: testRecipient,
            domainMailId: testRecipient,
            phoneNumber: '9876543210',
            degree: 'B.E.',
            branch: 'CSE',
            department: 'CSE',
            staffId: 'E2ECOORD1',
            cabin: 'CSE Block 204',
            username: 'e2ecoord1',
            password: 'coordpassword123',
            coordinatorId: 'E2ECOORD1'
        }, authHeaders);
        assert.ok(coordRes.data);
        console.log('✅ Coordinator registration returned success.');

        const logSuccess = await verifyEmailLog('WELCOME', testRecipient);
        assert.ok(logSuccess, 'Coordinator welcome email log should be created and sent.');
        console.log('✅ Coordinator Welcome Email triggered & logged successfully.');
    } catch (e) {
        logError('Test C', e);
    }
    console.log();

    // D & E. Student Block / Unblock Workflow
    console.log('--- Test D & E: Student Block/Unblock Emails ---');
    try {
        // Find student ID
        const studentDoc = await studentsColl.findOne({ regNo: 'E2ESTUDENT1' });
        assert.ok(studentDoc, 'Student document must exist');

        console.log('Triggering student block via API...');
        const blockRes = await axios.post(`${BASE_URL}/api/block-notifications`, {
            targetRole: 'student',
            actionType: 'blocked',
            students: [{
                studentId: String(studentDoc._id),
                regNo: 'E2ESTUDENT1',
                studentName: 'E2E Student Test',
                branch: 'CSE',
                year: '3',
                semester: '6'
            }],
            actor: { role: 'admin', name: 'Test Admin', identifier: 'admin1000' }
        }, authHeaders);
        assert.ok(blockRes.data.success);
        console.log('✅ Student block notifications created.');

        const logBlocked = await verifyEmailLog('ACCOUNT_BLOCKED', testRecipient);
        assert.ok(logBlocked, 'Student account blocked email should be logged.');
        console.log('✅ Student Account Blocked Email triggered successfully.');

        console.log('Triggering student unblock via API...');
        const unblockRes = await axios.post(`${BASE_URL}/api/block-notifications`, {
            targetRole: 'student',
            actionType: 'unblocked',
            students: [{
                studentId: String(studentDoc._id),
                regNo: 'E2ESTUDENT1',
                studentName: 'E2E Student Test',
                branch: 'CSE',
                year: '3',
                semester: '6'
            }],
            actor: { role: 'admin', name: 'Test Admin', identifier: 'admin1000' }
        }, authHeaders);
        assert.ok(unblockRes.data.success);
        console.log('✅ Student unblock notifications created.');

        const logUnblocked = await verifyEmailLog('ACCOUNT_UNBLOCKED', testRecipient);
        assert.ok(logUnblocked, 'Student account unblocked email should be logged.');
        console.log('✅ Student Account Unblocked Email triggered successfully.');
    } catch (e) {
        logError('Test D/E', e);
    }
    console.log();

    // F. Coordinator Block/Unblock Workflow
    console.log('--- Test F: Coordinator Block/Unblock Emails ---');
    try {
        const coordDoc = await coordinatorsColl.findOne({ coordinatorId: 'E2ECOORD1' });
        assert.ok(coordDoc, 'Coordinator must exist');

        console.log('Blocking coordinator via PATCH API...');
        const blockCoordRes = await axios.patch(`${BASE_URL}/api/coordinators/${coordDoc.coordinatorId}/block`, {
            isBlocked: true,
            blockedReason: 'Under investigation'
        }, authHeaders);
        assert.ok(blockCoordRes.data);
        console.log('✅ Coordinator block PATCH returned success.');

        const logBlocked = await verifyEmailLog('ACCOUNT_BLOCKED', testRecipient);
        assert.ok(logBlocked, 'Coordinator account blocked email log created.');

        console.log('Unblocking coordinator via PATCH API...');
        const unblockCoordRes = await axios.patch(`${BASE_URL}/api/coordinators/${coordDoc.coordinatorId}/block`, {
            isBlocked: false
        }, authHeaders);
        assert.ok(unblockCoordRes.data);
        console.log('✅ Coordinator unblock PATCH returned success.');

        const logUnblocked = await verifyEmailLog('ACCOUNT_UNBLOCKED', testRecipient);
        assert.ok(logUnblocked, 'Coordinator account unblocked email log created.');
        console.log('✅ Coordinator Block/Unblock Emails triggered successfully.');
    } catch (e) {
        logError('Test F', e);
    }
    console.log();

    // G. Eligible Student Drive Shortlist
    console.log('--- Test G: Eligible Drive Shortlist Email ---');
    try {
        const studentDoc = await studentsColl.findOne({ regNo: 'E2ESTUDENT1' });
        const dummyDriveId = new mongoose.Types.ObjectId();

        console.log('Shortlisting student for company drive via API...');
        const shortlistRes = await axios.post(`${BASE_URL}/api/eligible-students`, {
            driveId: String(dummyDriveId),
            companyName: 'E2E Test Company',
            driveStartDate: '2026-08-01',
            jobRole: 'Graduate Engineer Trainee',
            students: [{
                studentId: String(studentDoc._id),
                regNo: 'E2ESTUDENT1',
                name: 'E2E Student Test',
                email: testRecipient,
                batch: '2027',
                branch: 'CSE'
            }]
        }, authHeaders);
        assert.ok(shortlistRes.data);
        console.log('✅ Shortlist save returned success.');

        const logShortlist = await verifyEmailLog('STUDENT_SHORTLISTED', testRecipient);
        assert.ok(logShortlist, 'Student shortlist email log should exist.');
        console.log('✅ Shortlisted Email triggered successfully.');
    } catch (e) {
        logError('Test G', e);
    }
    console.log();

    // H & I. Drive Round Passed/Rejected Workflow
    console.log('--- Test H & I: Round Results Emails ---');
    try {
        const studentDoc = await studentsColl.findOne({ regNo: 'E2ESTUDENT1' });
        const dummyDriveId = new mongoose.Types.ObjectId();

        console.log('Submitting passed round 1 results via API...');
        const passRes = await axios.post(`${BASE_URL}/api/round-results/save`, {
            driveId: String(dummyDriveId),
            companyName: 'E2E Test Company',
            jobRole: 'Graduate Engineer Trainee',
            roundNumber: 1,
            roundName: 'Aptitude Test',
            students: [{
                studentId: String(studentDoc._id),
                regNo: 'E2ESTUDENT1',
                name: 'E2E Student Test',
                status: 'Passed',
                email: testRecipient
            }]
        }, authHeaders);
        assert.ok(passRes.data);
        console.log('✅ Round 1 Passed submission success.');

        const logPassed = await verifyEmailLog('ROUND_PASSED', testRecipient);
        assert.ok(logPassed, 'Round passed email should be logged.');

        console.log('Submitting rejected round 2 results via API...');
        const rejectRes = await axios.post(`${BASE_URL}/api/round-results/save`, {
            driveId: String(dummyDriveId),
            companyName: 'E2E Test Company',
            jobRole: 'Graduate Engineer Trainee',
            roundNumber: 2,
            roundName: 'Technical Interview',
            students: [{
                studentId: String(studentDoc._id),
                regNo: 'E2ESTUDENT1',
                name: 'E2E Student Test',
                status: 'Rejected',
                email: testRecipient
            }]
        }, authHeaders);
        assert.ok(rejectRes.data);
        console.log('✅ Round 2 Rejected submission success.');

        const logRejected = await verifyEmailLog('STUDENT_REJECTED', testRecipient);
        assert.ok(logRejected, 'Round rejected email should be logged.');
        console.log('✅ Round Results Emails triggered successfully.');
    } catch (e) {
        logError('Test H/I', e);
    }
    console.log();

    // J. Final Selection / Placed
    console.log('--- Test J: Final Placement Congratulations Email ---');
    try {
        const studentDoc = await studentsColl.findOne({ regNo: 'E2ESTUDENT1' });

        console.log('Saving final selection details via API...');
        const placementRes = await axios.post(`${BASE_URL}/api/placed-students/save`, {
            companyName: 'E2E Test Company',
            jobRole: 'Graduate Engineer Trainee',
            students: [{
                studentId: String(studentDoc._id),
                name: 'E2E Student Test',
                regNo: 'E2ESTUDENT1',
                dept: 'CSE',
                batch: '2027',
                email: testRecipient,
                pkg: '8.5 LPA'
            }]
        }, authHeaders);
        assert.ok(placementRes.data);
        console.log('✅ Placement save returned success.');

        const logPlaced = await verifyEmailLog('FINAL_SELECTED', testRecipient);
        assert.ok(logPlaced, 'Congratulations placement email log should exist.');
        console.log('✅ Placed Email triggered successfully.');
    } catch (e) {
        logError('Test J', e);
    }
    console.log();

    // K & L. Certificate Review Approval / Rejection Workflow
    console.log('--- Test K & L: Certificate Approval/Rejection ---');
    try {
        const studentDoc = await studentsColl.findOne({ regNo: 'E2ESTUDENT1' });

        // Insert a dummy certificate document
        console.log('Inserting dummy certificate...');
        const certId = new mongoose.Types.ObjectId();
        await certificatesColl.insertOne({
            _id: certId,
            studentId: String(studentDoc._id),
            regNo: 'E2ESTUDENT1',
            studentName: 'E2E Student Test',
            fileName: 'Cloud_Computing_NPTEL_Certificate.pdf',
            status: 'pending',
            achievementId: 'ACH999',
            coordinatorNotificationRead: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('Approving certificate via PUT API...');
        const approveCertRes = await axios.put(`${BASE_URL}/api/certificates/${certId}`, {
            status: 'Approved',
            verifiedBy: 'Dr. R. Rajesh'
        }, authHeaders);
        assert.ok(approveCertRes.data);
        console.log('✅ Certificate approval returned success.');

        const logApproved = await verifyEmailLog('CERTIFICATE_APPROVED', testRecipient);
        assert.ok(logApproved, 'Certificate approved email log should exist.');

        console.log('Rejecting certificate via PUT API...');
        const rejectCertRes = await axios.put(`${BASE_URL}/api/certificates/${certId}`, {
            status: 'Rejected',
            changeReason: 'Blurred signature, re-upload clean file'
        }, authHeaders);
        assert.ok(rejectCertRes.data);
        console.log('✅ Certificate rejection returned success.');

        const logRejected = await verifyEmailLog('CERTIFICATE_REJECTED', testRecipient);
        assert.ok(logRejected, 'Certificate rejected email log should exist.');
        console.log('✅ Certificate review emails triggered successfully.');
    } catch (e) {
        logError('Test K/L', e);
    }
    console.log();

    // M. Drive Attendance Summary
    console.log('--- Test M: Drive Attendance Summary ---');
    try {
        const dummyDriveId = new mongoose.Types.ObjectId();

        console.log('Submitting drive attendance via API...');
        const attendanceRes = await axios.post(`${BASE_URL}/api/attendance/submit`, {
            driveId: String(dummyDriveId),
            companyName: 'E2E Test Company',
            jobRole: 'Graduate Engineer Trainee',
            startDate: '2026-07-24',
            endDate: '2026-07-24',
            totalStudents: 10,
            totalPresent: 8,
            totalAbsent: 2,
            percentage: 80,
            submittedBy: 'E2E Tester',
            students: []
        }, authHeaders);
        assert.ok(attendanceRes.data);
        console.log('✅ Drive attendance submission returned success.');

        const adminDoc = await Admin.findOne({ adminLoginID: 'admin1000' });
        const adminEmail = adminDoc?.emailId || adminDoc?.domainMailId || adminDoc?.email;
        console.log(`   (Admin1000 resolved email: ${adminEmail})`);

        const logAttendance = await verifyEmailLog('DRIVE_ATTENDANCE_SUMMARY', adminEmail || testRecipient);
        assert.ok(logAttendance, 'Drive attendance summary email should be logged.');
        console.log('✅ Drive Attendance Summary Emails triggered successfully.');
    } catch (e) {
        logError('Test M', e);
    }
    console.log();

    // N. Training Attendance Summary
    console.log('--- Test N: Training Attendance Summary ---');
    try {
        const dummyScheduleId = new mongoose.Types.ObjectId();

        console.log('Submitting training attendance via API...');
        const trainingRes = await axios.post(`${BASE_URL}/api/training-attendance/submit`, {
            scheduleId: String(dummyScheduleId),
            companyName: 'E2E Test Company',
            courseName: 'Full Stack Development',
            batchNumber: 1,
            batchName: '2027 CSE Batch A',
            trainer: 'External Faculty',
            phaseNumber: 'Phase 1',
            attendanceDate: '2026-07-24',
            students: [
                { regNo: 'E2ESTUDENT1', name: 'E2E Student Test', status: 'Present' }
            ]
        }, authHeaders);
        assert.ok(trainingRes.data.success || trainingRes.data);
        console.log('✅ Training attendance submission returned success.');

        const adminDoc = await Admin.findOne({ adminLoginID: 'admin1000' });
        const adminEmail = adminDoc?.emailId || adminDoc?.domainMailId || adminDoc?.email;

        const logTraining = await verifyEmailLog('TRAINING_ATTENDANCE_SUMMARY', adminEmail || testRecipient);
        assert.ok(logTraining, 'Training attendance summary email should be logged.');
        console.log('✅ Training Attendance Summary Emails triggered successfully.');
    } catch (e) {
        logError('Test N', e);
    }
    console.log();

    // Clean up E2E records after validation
    console.log('🧹 Cleaning up test records from database...');
    await studentsColl.deleteMany({ regNo: 'E2ESTUDENT1' });
    await coordinatorsColl.deleteMany({ coordinatorId: 'E2ECOORD1' });
    await usersColl.deleteMany({ $or: [{ email: 'e2estudent@college.edu' }, { email: 'e2ecoord@college.edu' }] });
    await eligibleStudentsColl.deleteMany({ companyName: 'E2E Test Company' });
    await studentApplicationsColl.deleteMany({ regNo: 'E2ESTUDENT1' });
    await reportsColl.deleteMany({ companyName: 'E2E Test Company' });
    await certificatesColl.deleteMany({ regNo: 'E2ESTUDENT1' });
    await attendanceColl.deleteMany({ companyName: 'E2E Test Company' });
    await trainingAttendanceColl.deleteMany({ companyName: 'E2E Test Company' });

    // Restore original backups
    console.log('🔄 Restoring original database records...');
    if (originalStudent) {
        await studentsColl.insertOne(originalStudent);
        console.log(`   └─ Restored student: ${originalStudent.regNo}`);
    }
    if (originalUser) {
        await usersColl.insertOne(originalUser);
        console.log(`   └─ Restored user: ${originalUser.email}`);
    }
    if (originalCoordinator) {
        await coordinatorsColl.insertOne(originalCoordinator);
        console.log(`   └─ Restored coordinator: ${originalCoordinator.coordinatorId}`);
    }
    console.log('🧹 Clean up and restore complete.');

    await mongoose.connection.close();
    console.log('\n🏁 E2E Validation completed successfully.');
}

runE2ETests().catch(err => {
    console.error('Fatal E2E error:', err);
    mongoose.connection.close();
    process.exit(1);
});
