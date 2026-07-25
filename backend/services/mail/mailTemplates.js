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
 * Returns a clean, responsive inline SVG icon for the email body content.
 */
function getIconSvg(type, color) {
    const svgs = {
        lock: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
        welcome: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>`,
        shortlist: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M9 14h6"></path><path d="M9 18h6"></path><path d="M9 10h6"></path></svg>`,
        passed: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
        rejected: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`,
        placed: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"></path><path d="M12 2a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z"></path></svg>`,
        approved: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
        attendance: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
        shieldAlert: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
        shieldCheck: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 11 11 13 15 9"></polyline></svg>`,
    };
    return svgs[type] || svgs.welcome;
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
    let attachments = undefined;
    
    const portalUrl = process.env.PORTAL_URL || 'http://localhost:3000';
    const recipientName = data.recipientName || 'Member';

    const roleColors = {
        student: '#2085F6',
        coordinator: '#D23B42',
        admin: '#4EA24E'
    };
    const primaryColor = roleColors[role] || '#2085F6';

    switch (eventType) {
        case EMAIL_EVENTS.OTP_VERIFICATION:
            subject = `${data.otp} is your Placement Portal Verification Code`;
            title = 'OTP Verification';
            
            statusIcon = getIconSvg('lock', primaryColor);
            attachments = undefined;

            contentHtml = 'We received a request to verify your identity for the Placement Portal.';
            detailsCardHtml = `
                ${buildRow('Verification Code', `<span style="font-size: 28px; font-weight: 800; color: ${primaryColor}; letter-spacing: 4px;">${data.otp}</span>`)}
                ${buildRow('Expiry Time', '5 Minutes')}
                ${buildRow('Security Note', 'Do not share this code with anyone.')}
            `;
            break;

        case EMAIL_EVENTS.WELCOME:
            subject = 'Welcome to KSRCE Placement Portal!';
            title = 'Account Activated Successfully';
            
            // Reference the registration success image using cid
            statusIcon = `<img src="cid:welcome-success-icon" width="64" height="64" style="display: block; margin: 0 auto; object-fit: contain;" alt="Account activated success icon" />`;
            
            attachments = [{
                filename: 'regsucess.png',
                path: 'd:/Placement-Portal/src/assets/regsucess.png',
                cid: 'welcome-success-icon'
            }];

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
            statusIcon = getIconSvg('shortlist', primaryColor);
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
            statusIcon = getIconSvg('passed', primaryColor);
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
            statusIcon = getIconSvg('rejected', primaryColor);
            contentHtml = `Thank you for your active participation in the recruitment process for <strong>${data.companyName}</strong>. We regret to inform you that you have not progressed to the subsequent round at this stage. We appreciate your efforts and wish you the best in other upcoming drives.`;
            detailsCardHtml = `
                ${buildRow('Company Name', data.companyName)}
                ${buildRow('Last Evaluated Round', `${data.roundName} (Round ${data.roundNumber})`)}
                ${buildRow('Status', 'Not Selected')}
            `;
            break;

        case EMAIL_EVENTS.FINAL_SELECTED:
            subject = `Placed! Congratulations on your selection at ${data.companyName}`;
            title = 'Placed in Campus Drive!';
            statusIcon = getIconSvg('placed', primaryColor);
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
            statusIcon = getIconSvg('approved', primaryColor);
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
            statusIcon = getIconSvg('rejected', primaryColor);
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
            statusIcon = getIconSvg('attendance', primaryColor);
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
            statusIcon = getIconSvg('attendance', primaryColor);
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

        case EMAIL_EVENTS.ACCOUNT_BLOCKED:
            subject = `Placement Portal - Account Access Suspended`;
            title = 'Account Suspended';
            statusIcon = getIconSvg('shieldAlert', primaryColor);
            contentHtml = `This is to inform you that access to the Placement Portal has been suspended / blocked by the administration.`;
            detailsCardHtml = `
                ${buildRow('Account ID', data.regNo || data.username || data.email)}
                ${buildRow('Action Performed', 'Account Blocked')}
                ${buildRow('Suspension Reason', data.reason || 'Please contact the Placement Office for details.')}
                ${buildRow('Effective Date', data.date || new Date().toLocaleDateString('en-GB'))}
            `;
            break;

        case EMAIL_EVENTS.ACCOUNT_UNBLOCKED:
            subject = `Placement Portal - Account Access Restored`;
            title = 'Account Restored';
            statusIcon = getIconSvg('shieldCheck', primaryColor);
            contentHtml = `We are pleased to inform you that access to the Placement Portal has been restored. You can now login using your registered credentials.`;
            detailsCardHtml = `
                ${buildRow('Account ID', data.regNo || data.username || data.email)}
                ${buildRow('Action Performed', 'Account Restored')}
                ${buildRow('Status', 'Active')}
                ${buildRow('Effective Date', data.date || new Date().toLocaleDateString('en-GB'))}
            `;
            ctaHtml = buildCta('Login to Portal', portalUrl, role);
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
        htmlBody,
        attachments
    };
}

module.exports = {
    generateTemplate
};
