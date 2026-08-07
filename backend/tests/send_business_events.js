require('dotenv').config();
const { sendMail, EMAIL_EVENTS } = require('../services/mail/mailService');

async function sendBusinessEvents() {
    const testRecipient = process.env.TEST_RECIPIENT_EMAIL;
    if (!testRecipient) {
        console.error('TEST_RECIPIENT_EMAIL is not set in backend/.env');
        process.exit(1);
    }

    console.log(`Sending business notification event templates to ${testRecipient}...`);

    // 1. Welcome Email (Student - Blue)
    try {
        console.log('Sending Student Welcome email...');
        await sendMail({
            eventType: EMAIL_EVENTS.WELCOME,
            to: testRecipient,
            role: 'student',
            data: {
                regNo: '22CSE105',
                department: 'Computer Science and Engineering',
                recipientName: 'Ashik Mohammed'
            }
        });
        console.log('✅ Welcome Student email sent.');
    } catch (e) {
        console.error('❌ Failed Welcome Student:', e.message);
    }

    // 2. Company Drive Shortlisted (Blue)
    try {
        console.log('Sending Company Drive Shortlisted email...');
        await sendMail({
            eventType: EMAIL_EVENTS.STUDENT_SHORTLISTED,
            to: testRecipient,
            role: 'student',
            data: {
                recipientName: 'Ashik Mohammed',
                companyName: 'Wipro Technologies',
                jobRole: 'Project Engineer',
                startingDate: '30/07/2026',
                mode: 'On-Campus',
                location: 'Main Auditorium, KSRCE',
                package: '6.5 LPA'
            }
        });
        console.log('✅ Shortlisted email sent.');
    } catch (e) {
        console.error('❌ Failed Shortlisted:', e.message);
    }

    // 3. Company Drive Round Passed (Blue)
    try {
        console.log('Sending Company Drive Round Passed email...');
        await sendMail({
            eventType: EMAIL_EVENTS.ROUND_PASSED,
            to: testRecipient,
            role: 'student',
            data: {
                recipientName: 'Ashik Mohammed',
                companyName: 'Wipro Technologies',
                roundNumber: 1,
                roundName: 'Online Cognitive Ability Test',
                nextRoundName: 'Technical Interview',
                nextRoundDate: '03/08/2026 at 10:00 AM'
            }
        });
        console.log('✅ Round Passed email sent.');
    } catch (e) {
        console.error('❌ Failed Round Passed:', e.message);
    }

    // 4. Student Rejected/Not Selected (Blue/Neutral)
    try {
        console.log('Sending Student Rejected email...');
        await sendMail({
            eventType: EMAIL_EVENTS.STUDENT_REJECTED,
            to: testRecipient,
            role: 'student',
            data: {
                recipientName: 'Ashik Mohammed',
                companyName: 'Wipro Technologies',
                roundNumber: 2,
                roundName: 'Technical Interview'
            }
        });
        console.log('✅ Rejected email sent.');
    } catch (e) {
        console.error('❌ Failed Rejected:', e.message);
    }

    // 5. Final Selected/Placed (Blue Celebration)
    try {
        console.log('Sending Placed Congratulatory email...');
        await sendMail({
            eventType: EMAIL_EVENTS.FINAL_SELECTED,
            to: testRecipient,
            role: 'student',
            data: {
                recipientName: 'Ashik Mohammed',
                companyName: 'Wipro Technologies',
                jobRole: 'Project Engineer',
                package: '6.5 LPA',
                date: '05/08/2026'
            }
        });
        console.log('✅ Placed email sent.');
    } catch (e) {
        console.error('❌ Failed Placed:', e.message);
    }

    // 6. Certificate Approved (Blue)
    try {
        console.log('Sending Certificate Approved email...');
        await sendMail({
            eventType: EMAIL_EVENTS.CERTIFICATE_APPROVED,
            to: testRecipient,
            role: 'student',
            data: {
                recipientName: 'Ashik Mohammed',
                fileName: 'Java_Programming_NPTEL_Certificate.pdf',
                date: '24/07/2026'
            }
        });
        console.log('✅ Certificate Approved email sent.');
    } catch (e) {
        console.error('❌ Failed Certificate Approved:', e.message);
    }

    // 7. Certificate Rejected (Blue Action Required)
    try {
        console.log('Sending Certificate Rejected email...');
        await sendMail({
            eventType: EMAIL_EVENTS.CERTIFICATE_REJECTED,
            to: testRecipient,
            role: 'student',
            data: {
                recipientName: 'Ashik Mohammed',
                fileName: 'Java_Programming_NPTEL_Certificate.pdf',
                reason: 'The uploaded file is blurred and signature is not clearly legible. Please upload a high resolution copy.'
            }
        });
        console.log('✅ Certificate Rejected email sent.');
    } catch (e) {
        console.error('❌ Failed Certificate Rejected:', e.message);
    }

    // 8. Company Drive Attendance Summary (Red Coordinator Summary)
    try {
        console.log('Sending Drive Attendance Summary (Red)...');
        await sendMail({
            eventType: EMAIL_EVENTS.DRIVE_ATTENDANCE_SUMMARY,
            to: testRecipient,
            role: 'coordinator',
            data: {
                companyName: 'Cognizant Technology Solutions',
                jobRole: 'Programmer Analyst Trainee',
                startDate: '24/07/2026',
                dept: 'CSE',
                totalStudents: 120,
                totalPresent: 110,
                totalAbsent: 10,
                percentage: 91.6,
                submittedBy: 'Dr. R. Rajesh, CSE Coordinator',
                time: '24/07/2026 04:30 PM'
            }
        });
        console.log('✅ Drive Attendance Summary (Red) sent.');
    } catch (e) {
        console.error('❌ Failed Drive Attendance (Red):', e.message);
    }

    // 9. Training Attendance Summary (Green Admin Summary)
    try {
        console.log('Sending Training Attendance Summary (Green)...');
        await sendMail({
            eventType: EMAIL_EVENTS.TRAINING_ATTENDANCE_SUMMARY,
            to: testRecipient,
            role: 'admin',
            data: {
                courseName: 'Full Stack Web Development with React & Node',
                batchName: '2027 CSE Batch - A & B',
                trainer: 'Mr. Vigneshwaran, Tech Lead, Hexaware',
                phaseNumber: 'Phase II, Day 4',
                attendanceDate: '24/07/2026',
                totalStudents: 95,
                totalPresent: 92,
                totalAbsent: 3,
                percentage: 96.8,
                submittedBy: 'Mrs. S. Preethi, Coordinator'
            }
        });
        console.log('✅ Training Attendance Summary (Green) sent.');
    } catch (e) {
        console.error('❌ Failed Training Attendance (Green):', e.message);
    }

    // 10. Coordinator Welcome (Red)
    try {
        console.log('Sending Coordinator Welcome email...');
        await sendMail({
            eventType: EMAIL_EVENTS.WELCOME,
            to: testRecipient,
            role: 'coordinator',
            data: {
                username: 'coordinator_cse',
                department: 'Computer Science and Engineering',
                recipientName: 'Dr. R. Rajesh'
            }
        });
        console.log('✅ Coordinator Welcome email sent.');
    } catch (e) {
        console.error('❌ Failed Coordinator Welcome:', e.message);
    }

    // 11. Student Account Blocked (Blue)
    try {
        console.log('Sending Student Account Blocked email...');
        await sendMail({
            eventType: EMAIL_EVENTS.ACCOUNT_BLOCKED,
            to: testRecipient,
            role: 'student',
            data: {
                regNo: '22CSE105',
                recipientName: 'Ashik Mohammed',
                reason: 'Academic integrity violation during mock assessment. Access suspended.',
                date: '24/07/2026'
            }
        });
        console.log('✅ Student Blocked email sent.');
    } catch (e) {
        console.error('❌ Failed Student Blocked:', e.message);
    }

    // 12. Student Account Unblocked (Blue)
    try {
        console.log('Sending Student Account Unblocked email...');
        await sendMail({
            eventType: EMAIL_EVENTS.ACCOUNT_UNBLOCKED,
            to: testRecipient,
            role: 'student',
            data: {
                regNo: '22CSE105',
                recipientName: 'Ashik Mohammed',
                date: '24/07/2026'
            }
        });
        console.log('✅ Student Unblocked email sent.');
    } catch (e) {
        console.error('❌ Failed Student Unblocked:', e.message);
    }

    // 13. Coordinator Account Blocked (Red)
    try {
        console.log('Sending Coordinator Account Blocked email...');
        await sendMail({
            eventType: EMAIL_EVENTS.ACCOUNT_BLOCKED,
            to: testRecipient,
            role: 'coordinator',
            data: {
                username: 'coordinator_cse',
                recipientName: 'Dr. R. Rajesh',
                reason: 'Administrative updates in progress. Temporarily disabled.',
                date: '24/07/2026'
            }
        });
        console.log('✅ Coordinator Blocked email sent.');
    } catch (e) {
        console.error('❌ Failed Coordinator Blocked:', e.message);
    }

    // 14. Coordinator Account Unblocked (Red)
    try {
        console.log('Sending Coordinator Account Unblocked email...');
        await sendMail({
            eventType: EMAIL_EVENTS.ACCOUNT_UNBLOCKED,
            to: testRecipient,
            role: 'coordinator',
            data: {
                username: 'coordinator_cse',
                recipientName: 'Dr. R. Rajesh',
                date: '24/07/2026'
            }
        });
        console.log('✅ Coordinator Unblocked email sent.');
    } catch (e) {
        console.error('❌ Failed Coordinator Unblocked:', e.message);
    }

    console.log('\nAll business event emails dispatched. Please verify in your inbox.');
}

sendBusinessEvents();
