const EMAIL_EVENTS = require('./emailEvents');

/**
 * Renders the base visual layout for all Placement Portal emails.
 * Uses role-based coloring (Student=Blue, Coordinator=Red, Admin=Green)
 * and responsive tables safe for Outlook/Gmail.
 */
function renderBaseLayout({ role, title, recipientName, statusIcon, contentHtml, detailsCardHtml, ctaHtml }) {
    const roleColors = {
        student: '#2085F6',
        coordinator: '#D23B42',
        admin: '#4EA24E'
    };
    const primaryColor = roleColors[role] || '#2085F6';
    const roleLabel = role.toUpperCase();

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'Placement Portal Notification'}</title>
</head>
<body style="font-family: 'Poppins', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
            <td align="center" style="background-color: #f4f6f9; padding: 20px 0;">
                <!-- Main Container -->
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-collapse: separate;">
                    
                    <!-- Role-Colored Header -->
                    <tr>
                        <td align="center" style="background-color: ${primaryColor}; padding: 35px 20px; color: #ffffff;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="font-size: 26px; font-weight: 800; letter-spacing: 0.5px; line-height: 32px; font-family: 'Poppins', 'Segoe UI', sans-serif;">
                                        K S R College of Engineering
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="font-size: 13px; font-weight: 600; opacity: 0.9; letter-spacing: 1px; padding-top: 5px; text-transform: uppercase;">
                                        Placement Portal &bull; ${roleLabel} NOTIFICATION
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 40px 30px; background-color: #ffffff;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                ${statusIcon ? `
                                <tr>
                                    <td align="center" style="font-size: 54px; line-height: 54px; padding-bottom: 20px;">
                                        ${statusIcon}
                                    </td>
                                </tr>
                                ` : ''}
                                
                                ${title ? `
                                <tr>
                                    <td align="center" style="font-size: 20px; font-weight: 700; color: #111111; padding-bottom: 25px; line-height: 26px; font-family: 'Poppins', 'Segoe UI', sans-serif;">
                                        ${title}
                                    </td>
                                </tr>
                                ` : ''}

                                <tr>
                                    <td style="font-size: 16px; font-weight: 600; color: #111111; padding-bottom: 15px; font-family: 'Poppins', 'Segoe UI', sans-serif;">
                                        Hello ${recipientName || 'User'},
                                    </td>
                                </tr>

                                <tr>
                                    <td style="font-size: 15px; color: #444444; line-height: 1.6; padding-bottom: 25px;">
                                        ${contentHtml}
                                    </td>
                                </tr>

                                <!-- Details Card -->
                                ${detailsCardHtml ? `
                                <tr>
                                    <td style="padding-bottom: 25px;">
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-left: 4px solid ${primaryColor}; border-radius: 4px; padding: 20px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.01);">
                                            ${detailsCardHtml}
                                        </table>
                                    </td>
                                </tr>
                                ` : ''}

                                <!-- CTA -->
                                ${ctaHtml ? `
                                <tr>
                                    <td align="center" style="padding: 15px 0 30px 0;">
                                        ${ctaHtml}
                                    </td>
                                </tr>
                                ` : ''}

                                <tr>
                                    <td style="font-size: 15px; color: #333333; line-height: 1.5; padding-top: 15px; border-top: 1px solid #f0f0f0;">
                                        Thank you,<br>
                                        <strong>Placement Cell</strong><br>
                                        <span style="font-size: 13px; color: #666666;">K S R College of Engineering</span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color: #f8fafc; padding: 25px 20px; border-top: 1px solid #edf2f7; color: #777777; font-size: 12px; line-height: 18px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="font-weight: 700; color: #444444; font-size: 13px; padding-bottom: 8px;">
                                        Placement Portal
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-bottom: 5px;">
                                        This is an automated administrative email. Please do not reply.
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center">
                                        &copy; ${new Date().getFullYear()} K S R College of Engineering. All rights reserved.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

/**
 * Builds details table row
 */
function buildRow(label, value) {
    return `
        <tr>
            <td valign="top" style="width: 160px; font-size: 13px; font-weight: 700; color: #555555; padding: 6px 0; font-family: 'Poppins', 'Segoe UI', sans-serif;">
                ${label}
            </td>
            <td valign="top" style="font-size: 14px; color: #222222; padding: 6px 0 6px 10px; font-family: 'Poppins', 'Segoe UI', sans-serif;">
                ${value || '-'}
            </td>
        </tr>
    `;
}

/**
 * Builds CTA Button
 */
function buildCta(label, url, role) {
    const roleColors = {
        student: '#2085F6',
        coordinator: '#D23B42',
        admin: '#4EA24E'
    };
    const primaryColor = roleColors[role] || '#2085F6';
    return `
        <a href="${url || 'http://localhost:3000'}" target="_blank" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: 'Poppins', 'Segoe UI', sans-serif;">
            ${label}
        </a>
    `;
}

/**
 * Generate Event-specific Email Subjects and HTML Contents
 */
function generateTemplate(eventType, role, data) {
    let title = '';
    let statusIcon = '';
    let contentHtml = '';
    let detailsCardHtml = '';
    let ctaHtml = '';
    let subject = '';
    
    const portalUrl = process.env.PORTAL_URL || 'http://localhost:3000';
    const recipientName = data.recipientName || 'Member';

    switch (eventType) {
        case EMAIL_EVENTS.OTP_VERIFICATION:
            subject = 'Your Placement Portal Verification Code';
            title = 'OTP Verification';
            statusIcon = '🔒';
            contentHtml = 'We received a request to verify your identity for the Placement Portal.';
            detailsCardHtml = `
                ${buildRow('Verification Code', `<span style="font-size: 24px; font-weight: 800; color: #111111; letter-spacing: 2px;">${data.otp}</span>`)}
                ${buildRow('Expiry Time', '5 Minutes')}
                ${buildRow('Security Note', 'Do not share this code with anyone.')}
            `;
            break;

        case EMAIL_EVENTS.WELCOME:
            subject = 'Welcome to KSRCE Placement Portal!';
            title = 'Account Activated Successfully';
            statusIcon = '🎉';
            contentHtml = 'Welcome to the K S R College of Engineering Placement Portal. Your profile has been successfully registered and active in our placement database.';
            detailsCardHtml = `
                ${buildRow('Username / ID', data.regNo || data.username || data.email)}
                ${buildRow('Department', data.department || data.branch)}
                ${buildRow('Registered Role', role.toUpperCase())}
            `;
            ctaHtml = buildCta('Login to Portal', portalUrl, role);
            break;

        case EMAIL_EVENTS.STUDENT_SHORTLISTED:
            subject = `Shortlisted for ${data.companyName} recruitment drive`;
            title = 'Eligible Drive Shortlist';
            statusIcon = '📋';
            contentHtml = `Congratulations! You have been selected / shortlisted as eligible to participate in the upcoming recruitment drive for <strong>${data.companyName}</strong>.`;
            detailsCardHtml = `
                ${buildRow('Company Name', data.companyName)}
                ${buildRow('Target Job Role', data.jobRole)}
                ${buildRow('Drive Start Date', data.startingDate)}
                ${buildRow('Drive Mode', data.mode || 'On-Campus')}
                ${buildRow('Venue/Location', data.location || 'College Campus')}
                ${buildRow('Package / CTC', data.package || 'As per norms')}
            `;
            ctaHtml = buildCta('View Drive Details', `${portalUrl}/company`, role);
            break;

        case EMAIL_EVENTS.ROUND_PASSED:
            subject = `Recruitment Update: Passed Round for ${data.companyName}`;
            title = 'Congratulations! Passed Round';
            statusIcon = '✔';
            contentHtml = `We are pleased to inform you that you have qualified / passed <strong>Round ${data.roundNumber}: ${data.roundName}</strong> for the drive of <strong>${data.companyName}</strong>.`;
            detailsCardHtml = `
                ${buildRow('Company Name', data.companyName)}
                ${buildRow('Completed Round', `${data.roundName} (Round ${data.roundNumber})`)}
                ${buildRow('Next Round Name', data.nextRoundName || 'TBA')}
                ${buildRow('Next Round Date', data.nextRoundDate || 'Will be informed soon')}
            `;
            if (data.nextRoundName) {
                ctaHtml = buildCta('View Next Round Details', `${portalUrl}/company`, role);
            }
            break;

        case EMAIL_EVENTS.STUDENT_REJECTED:
            subject = `Recruitment Drive Update: ${data.companyName}`;
            title = 'Recruitment Process Update';
            statusIcon = '✉';
            contentHtml = `Thank you for your active participation in the recruitment process for <strong>${data.companyName}</strong>. We regret to inform you that you have not progressed to the subsequent round at this stage. We appreciate your efforts and wish you the best in other upcoming drives.`;
            detailsCardHtml = `
                ${buildRow('Company Name', data.companyName)}
                ${buildRow('Last Evaluated Round', `${data.roundName} (Round ${data.roundNumber})`)}
                ${buildRow('Status', 'Not Selected')}
            `;
            break;

        case EMAIL_EVENTS.FINAL_SELECTED:
            subject = `Placed! Congratulations on your selection at ${data.companyName}`;
            title = 'Placed in Campus Drive! 🎓';
            statusIcon = '🥳';
            contentHtml = `Outstanding accomplishment! We are thrilled to share that you have been officially selected and placed at <strong>${data.companyName}</strong>. K S R College of Engineering congratulates you on this massive achievement!`;
            detailsCardHtml = `
                ${buildRow('Placed Company', data.companyName)}
                ${buildRow('Designation Role', data.jobRole)}
                ${buildRow('Package / CTC', data.package || 'N/A')}
                ${buildRow('Selection Date', data.date || new Date().toLocaleDateString('en-GB'))}
            `;
            ctaHtml = buildCta('View Offer Status', `${portalUrl}/company`, role);
            break;

        case EMAIL_EVENTS.CERTIFICATE_APPROVED:
            subject = `Certificate Approved: ${data.fileName}`;
            title = 'Academic Verification Approved';
            statusIcon = '✅';
            contentHtml = `Your uploaded achievement/academic document <strong>${data.fileName}</strong> has been successfully verified and approved by the department coordinator.`;
            detailsCardHtml = `
                ${buildRow('Certificate Name', data.fileName)}
                ${buildRow('Approved Date', data.date || new Date().toLocaleDateString('en-GB'))}
                ${buildRow('Reviewed Status', 'Approved')}
            `;
            break;

        case EMAIL_EVENTS.CERTIFICATE_REJECTED:
            subject = `Action Required: Certificate Rejected (${data.fileName})`;
            title = 'Academic Verification Rejected';
            statusIcon = '❌';
            contentHtml = `Your uploaded achievement/academic document <strong>${data.fileName}</strong> was rejected during verification. Action is required to re-upload the correct copy.`;
            detailsCardHtml = `
                ${buildRow('Certificate Name', data.fileName)}
                ${buildRow('Rejection Reason', data.reason || 'Invalid file format or blurred image')}
                ${buildRow('Status', 'Action Required')}
            `;
            ctaHtml = buildCta('Update Certificate', `${portalUrl}/achievements`, role);
            break;

        case EMAIL_EVENTS.DRIVE_ATTENDANCE_SUMMARY:
            subject = `Drive Attendance Summary: ${data.companyName} (${data.dept})`;
            title = 'Drive Attendance Submitted';
            statusIcon = '📊';
            contentHtml = `Coordinator ${data.submittedBy} has submitted / finalized the student branch attendance for the drive of <strong>${data.companyName}</strong>.`;
            detailsCardHtml = `
                ${buildRow('Company Name', data.companyName)}
                ${buildRow('Job Role', data.jobRole)}
                ${buildRow('Drive Date', data.startDate)}
                ${buildRow('Branch / Dept', data.dept)}
                ${buildRow('Total Eligible', data.totalStudents)}
                ${buildRow('Students Present', data.totalPresent)}
                ${buildRow('Students Absent', data.totalAbsent)}
                ${buildRow('Attendance Rate', `${data.percentage}%`)}
                ${buildRow('Submitted By', data.submittedBy)}
            `;
            break;

        case EMAIL_EVENTS.TRAINING_ATTENDANCE_SUMMARY:
            subject = `Training Attendance Summary: ${data.courseName} - ${data.batchName}`;
            title = 'Training Attendance Finalized';
            statusIcon = '📝';
            contentHtml = `Coordinator ${data.submittedBy} has finalized the training attendance summary.`;
            detailsCardHtml = `
                ${buildRow('Training Course', data.courseName)}
                ${buildRow('Batch Name', data.batchName)}
                ${buildRow('Trainer Name', data.trainer || 'Internal Faculty')}
                ${buildRow('Phase / Session', data.phaseNumber || 'Phase 1')}
                ${buildRow('Attendance Date', data.attendanceDate)}
                ${buildRow('Total Cohort', data.totalStudents)}
                ${buildRow('Present Count', data.totalPresent)}
                ${buildRow('Absent Count', data.totalAbsent)}
                ${buildRow('Attendance Rate', `${data.percentage}%`)}
            `;
            break;

        default:
            subject = 'Placement Portal Notification';
            title = 'Notification Update';
            contentHtml = data.message || 'You have a new update in your Placement Portal.';
    }

    const htmlBody = renderBaseLayout({
        role,
        title,
        recipientName,
        statusIcon,
        contentHtml,
        detailsCardHtml,
        ctaHtml
    });

    return {
        subject,
        htmlBody
    };
}

module.exports = {
    generateTemplate
};
