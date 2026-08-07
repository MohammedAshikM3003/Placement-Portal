const EMAIL_EVENTS = require('./emailEvents');

/**
 * Base Brand Layout Renderer for Unified HTML emails.
 */
function renderBaseLayout({ role, title, recipientName, statusIcon, contentHtml, detailsCardHtml, ctaHtml }) {
    const portalUrl = process.env.PORTAL_URL || 'https://placement--portal.vercel.app/';

    const roleThemeColors = {
        student: { primary: '#2085F6', text: '#ffffff', headerBg: '#0F172A' },
        coordinator: { primary: '#D23B42', text: '#ffffff', headerBg: '#1E1B2E' },
        admin: { primary: '#4EA24E', text: '#ffffff', headerBg: '#064E3B' }
    };

    const theme = roleThemeColors[role] || roleThemeColors.student;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'Placement Portal Notice'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Poppins', 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 20px 0;">
        <tr>
            <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.08);">
                    
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color: ${theme.headerBg}; padding: 30px 20px; border-bottom: 4px solid ${theme.primary};">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.5px; font-family: 'Poppins', 'Segoe UI', sans-serif;">
                                        K S R COLLEGE OF ENGINEERING
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; padding-top: 4px;">
                                        Training & Placement Cell
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
                                    <td align="center" style="padding-bottom: 20px;">
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
                                        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-left: 4px solid ${theme.primary}; border-radius: 4px; padding: 20px;">
                                            ${detailsCardHtml}
                                        </table>
                                    </td>
                                </tr>
                                ` : ''}

                                <!-- CTA Button -->
                                ${ctaHtml ? `
                                <tr>
                                    <td align="center" style="padding-top: 10px; padding-bottom: 15px;">
                                        ${ctaHtml}
                                    </td>
                                </tr>
                                ` : ''}
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color: #f8fafc; padding: 25px 20px; border-top: 1px solid #edf2f7; color: #777777; font-size: 12px; line-height: 18px;">
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="font-weight: 700; color: #444444; font-size: 13px; padding-bottom: 8px;">
                                        Placement Portal System
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-bottom: 5px;">
                                        This is an automated administrative notification. Please do not reply.
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

function buildCta(label, url, role) {
    const roleColors = {
        student: '#2085F6',
        coordinator: '#D23B42',
        admin: '#4EA24E'
    };
    const primaryColor = roleColors[role] || '#2085F6';
    const targetUrl = url || process.env.PORTAL_URL || 'https://placement--portal.vercel.app/';
    return `
        <a href="${targetUrl}" target="_blank" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 700; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: 'Poppins', 'Segoe UI', sans-serif;">
            ${label}
        </a>
    `;
}

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
        fileText: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block; margin: 0 auto;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`
    };
    return svgs[type] || svgs.welcome;
}

function generateTemplate(eventType, role, data) {
    let title = '';
    let statusIcon = '';
    let contentHtml = '';
    let detailsCardHtml = '';
    let ctaHtml = '';
    let subject = '';
    let attachments = undefined;
    
    const portalUrl = process.env.PORTAL_URL || 'https://placement--portal.vercel.app/';
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
            contentHtml = 'We received a request to verify your identity for the Placement Portal using your official domain email.';
            detailsCardHtml = `
                ${buildRow('Verification Code', `<span style="font-size: 28px; font-weight: 800; color: ${primaryColor}; letter-spacing: 4px;">${data.otp}</span>`)}
                ${buildRow('Expiry Time', '5 Minutes')}
                ${buildRow('Security Note', 'Do not share this verification code with anyone.')}
            `;
            break;

        case EMAIL_EVENTS.ADMIN_PROFILE_TRANSFER_OTP:
            subject = `${data.otp} - Admin Ownership Transfer Verification Code`;
            title = 'Admin Transfer OTP';
            statusIcon = getIconSvg('shieldAlert', '#4EA24E');
            contentHtml = `A request has been initiated to transfer Admin Portal ownership to this domain email account. Enter the verification code below to authorize the transfer.`;
            detailsCardHtml = `
                ${buildRow('Verification Code', `<span style="font-size: 28px; font-weight: 800; color: #4EA24E; letter-spacing: 4px;">${data.otp}</span>`)}
                ${buildRow('Transfer Account', data.newAdminEmail || data.email)}
                ${buildRow('Initiated By', data.currentAdmin || 'Current Admin')}
                ${buildRow('Security Note', 'This action will update master administrative privileges.')}
            `;
            break;

        case EMAIL_EVENTS.WELCOME:
            subject = 'Welcome to KSRCE Placement Portal!';
            title = 'Account Activated Successfully';
            statusIcon = getIconSvg('welcome', primaryColor);
            contentHtml = 'Welcome to the K S R College of Engineering Placement Portal. Your profile has been successfully registered and is active in our placement database.';
            detailsCardHtml = `
                ${buildRow('Username / ID', data.regNo || data.username || data.email)}
                ${buildRow('Department', data.department || data.branch)}
                ${buildRow('Registered Role', role.toUpperCase())}
            `;
            ctaHtml = buildCta('Login to Portal', portalUrl, role);
            break;

        case EMAIL_EVENTS.COORDINATOR_WELCOME:
            subject = 'Welcome to KSRCE Placement Portal - Coordinator Access';
            title = 'Coordinator Account Created';
            statusIcon = getIconSvg('welcome', '#D23B42');
            contentHtml = `Your Department Coordinator account has been successfully created by the Administrator. You have been granted management access for ${data.branch || 'your branch'}.`;
            detailsCardHtml = `
                ${buildRow('Coordinator Name', data.recipientName || data.name)}
                ${buildRow('Domain Email', data.email)}
                ${buildRow('Assigned Branch', data.branch || 'Placement Office')}
            `;
            ctaHtml = buildCta('Access Coordinator Portal', `${portalUrl}/login`, 'coordinator');
            break;

        case EMAIL_EVENTS.TRAINING_PREFERENCE_OPEN:
            subject = `Action Required: ${data.trainingName || 'Training Selection'} Open`;
            title = 'Training Preference Selection Open';
            statusIcon = getIconSvg('fileText', primaryColor);
            contentHtml = `The Placement Cell has opened training preference selection for <strong>${data.trainingName || 'Placement Training'}</strong>. Please review instructions and submit your preferences before the deadline.`;
            detailsCardHtml = `
                ${buildRow('Training Program', data.trainingName || 'Skill Development')}
                ${buildRow('Submission Deadline', data.deadline || 'As announced')}
                ${buildRow('Instructions', data.instructions || 'Select preferences in student dashboard')}
            `;
            ctaHtml = buildCta('Submit Preferences', `${portalUrl}/training`, role);
            break;

        case EMAIL_EVENTS.TRAINING_SCHEDULED:
            subject = `Training Schedule Assigned: ${data.trainingName}`;
            title = 'Training Session Scheduled';
            statusIcon = getIconSvg('attendance', primaryColor);
            contentHtml = `You have been assigned to <strong>${data.trainingName}</strong>. Please find your schedule details below:`;
            detailsCardHtml = `
                ${buildRow('Training Name', data.trainingName)}
                ${buildRow('Trainer / Faculty', data.trainer || 'External Expert')}
                ${buildRow('Date & Time', `${data.date || ''} ${data.time || ''}`.trim() || 'Schedule active')}
                ${buildRow('Venue / Platform', data.venue || 'College Campus')}
            `;
            ctaHtml = buildCta('View Schedule', `${portalUrl}/training`, role);
            break;

        case EMAIL_EVENTS.TRAINING_ATTENDANCE_REPORT:
            subject = `Training Attendance Marked: ${data.trainingName} (${data.status})`;
            title = 'Training Attendance Report';
            statusIcon = getIconSvg(data.status === 'Present' ? 'passed' : 'rejected', primaryColor);
            contentHtml = `Your attendance for <strong>${data.trainingName}</strong> on <strong>${data.date}</strong> has been marked as <strong>${data.status}</strong>.`;
            detailsCardHtml = `
                ${buildRow('Training Name', data.trainingName)}
                ${buildRow('Attendance Date', data.date)}
                ${buildRow('Attendance Status', data.status === 'Present' ? '<span style="color: #22c55e; font-weight: 700;">PRESENT</span>' : '<span style="color: #ef4444; font-weight: 700;">ABSENT</span>')}
                ${buildRow('Overall Attendance %', `${data.percentage || 0}%`)}
            `;
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
            contentHtml = `We are pleased to inform you that you have qualified / passed <strong>Round ${data.roundNumber || 1}: ${data.roundName}</strong> for the drive of <strong>${data.companyName}</strong>.`;
            detailsCardHtml = `
                ${buildRow('Company Name', data.companyName)}
                ${buildRow('Completed Round', `${data.roundName || 'Round'} (Round ${data.roundNumber || 1})`)}
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
            contentHtml = `Thank you for your active participation in the recruitment process for <strong>${data.companyName}</strong>. We regret to inform you that you have not progressed to the subsequent round at this stage.`;
            detailsCardHtml = `
                ${buildRow('Company Name', data.companyName)}
                ${buildRow('Last Evaluated Round', `${data.roundName || 'Round'} (Round ${data.roundNumber || 1})`)}
                ${buildRow('Status', 'Not Selected')}
            `;
            break;

        case EMAIL_EVENTS.FINAL_SELECTED:
            subject = `Placed! Congratulations on your selection at ${data.companyName}`;
            title = 'Placed in Campus Drive!';
            statusIcon = getIconSvg('placed', primaryColor);
            contentHtml = `Outstanding accomplishment! We are thrilled to share that you have been officially selected and placed at <strong>${data.companyName}</strong>. K S R College of Engineering congratulates you!`;
            detailsCardHtml = `
                ${buildRow('Placed Company', data.companyName)}
                ${buildRow('Designation Role', data.jobRole)}
                ${buildRow('Package / CTC', data.package || 'N/A')}
                ${buildRow('Selection Date', data.date || new Date().toLocaleDateString('en-GB'))}
            `;
            ctaHtml = buildCta('View Offer Status', `${portalUrl}/company`, role);
            break;

        case EMAIL_EVENTS.OFFER_LETTER:
            subject = `Offer Letter Issued: ${data.companyName}`;
            title = 'Offer Letter Received';
            statusIcon = getIconSvg('fileText', primaryColor);
            contentHtml = `An official offer letter for <strong>${data.companyName}</strong> has been uploaded to your portal profile. Please review the offer details and submit your response before the deadline.`;
            detailsCardHtml = `
                ${buildRow('Company Name', data.companyName)}
                ${buildRow('Designation Role', data.jobRole || 'Software Engineer')}
                ${buildRow('Offered CTC', data.package || 'As per offer')}
                ${buildRow('Joining Date / Details', data.joiningDetails || 'To be communicated')}
                ${buildRow('Response Deadline', data.deadline || '7 Days')}
            `;
            ctaHtml = buildCta('Review Offer Letter', `${portalUrl}/offers`, role);
            break;

        case EMAIL_EVENTS.OFFER_RESPONSE:
            subject = `Student Offer Response: ${data.studentName} (${data.decision.toUpperCase()}) - ${data.companyName}`;
            title = 'Student Offer Decision Update';
            statusIcon = getIconSvg(data.decision === 'accepted' ? 'passed' : 'rejected', primaryColor);
            contentHtml = `Student <strong>${data.studentName}</strong> (${data.regNo}) has <strong>${data.decision.toUpperCase()}</strong> the offer from <strong>${data.companyName}</strong>.`;
            detailsCardHtml = `
                ${buildRow('Student Name', data.studentName)}
                ${buildRow('Register Number', data.regNo)}
                ${buildRow('Branch / Dept', data.branch || 'Engineering')}
                ${buildRow('Company Name', data.companyName)}
                ${buildRow('Student Decision', data.decision === 'accepted' ? '<span style="color: #22c55e; font-weight: 700;">ACCEPTED</span>' : '<span style="color: #ef4444; font-weight: 700;">REJECTED</span>')}
                ${buildRow('Response Timestamp', data.timestamp || new Date().toLocaleString('en-GB'))}
            `;
            break;

        case EMAIL_EVENTS.CERTIFICATE_APPROVED:
            subject = `Certificate Approved: ${data.fileName}`;
            title = 'Academic Verification Approved';
            statusIcon = getIconSvg('approved', primaryColor);
            contentHtml = `Your uploaded achievement/academic document <strong>${data.fileName}</strong> has been verified and approved by the department coordinator.`;
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
            contentHtml = `Your uploaded achievement/academic document <strong>${data.fileName}</strong> was rejected during verification. Please re-upload the correct copy.`;
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
            contentHtml = `Coordinator ${data.submittedBy} has finalized branch attendance for <strong>${data.companyName}</strong>.`;
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

        case EMAIL_EVENTS.DRIVE_ROUND_SUMMARY:
            subject = `Drive Round Summary: ${data.companyName} - ${data.roundName}`;
            title = 'Company Drive Round Summary';
            statusIcon = getIconSvg('attendance', primaryColor);
            contentHtml = `Round evaluation summary for <strong>${data.companyName}</strong> (${data.roundName}) has been finalized.`;
            detailsCardHtml = `
                ${buildRow('Company Name', data.companyName)}
                ${buildRow('Round Name', data.roundName)}
                ${buildRow('Appeared Count', data.appearedCount || 0)}
                ${buildRow('Passed Count', data.passedCount || 0)}
                ${buildRow('Failed Count', data.failedCount || 0)}
                ${buildRow('Remaining Candidates', data.remainingCount || 0)}
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

        case EMAIL_EVENTS.STUDENT_BLOCKED_BY_ADMIN:
            subject = `Placement Portal - Student Account Blocked by Admin (${data.regNo})`;
            title = 'Student Account Blocked';
            statusIcon = getIconSvg('shieldAlert', primaryColor);
            contentHtml = `Student account <strong>${data.studentName}</strong> (${data.regNo}) has been blocked by the Administrator.`;
            detailsCardHtml = `
                ${buildRow('Student Name', data.studentName)}
                ${buildRow('Register Number', data.regNo)}
                ${buildRow('Branch / Dept', data.branch)}
                ${buildRow('Blocked By', 'Placement Administrator')}
                ${buildRow('Reason', data.reason || 'Administrative decision')}
            `;
            break;

        case EMAIL_EVENTS.STUDENT_UNBLOCKED_BY_ADMIN:
            subject = `Placement Portal - Student Account Unblocked by Admin (${data.regNo})`;
            title = 'Student Account Unblocked';
            statusIcon = getIconSvg('shieldCheck', primaryColor);
            contentHtml = `Student account <strong>${data.studentName}</strong> (${data.regNo}) has been unblocked and restored by the Administrator.`;
            detailsCardHtml = `
                ${buildRow('Student Name', data.studentName)}
                ${buildRow('Register Number', data.regNo)}
                ${buildRow('Branch / Dept', data.branch)}
                ${buildRow('Unblocked By', 'Placement Administrator')}
                ${buildRow('Status', 'Active')}
            `;
            break;

        case EMAIL_EVENTS.STUDENT_BLOCKED_BY_COORDINATOR:
            subject = `Placement Portal - Student Account Blocked by Coordinator (${data.regNo})`;
            title = 'Student Account Blocked by Coordinator';
            statusIcon = getIconSvg('shieldAlert', primaryColor);
            contentHtml = `Coordinator ${data.coordinatorName} has blocked student <strong>${data.studentName}</strong> (${data.regNo}).`;
            detailsCardHtml = `
                ${buildRow('Student Name', data.studentName)}
                ${buildRow('Register Number', data.regNo)}
                ${buildRow('Branch / Dept', data.branch)}
                ${buildRow('Blocked By Coordinator', data.coordinatorName)}
                ${buildRow('Reason', data.reason || 'Departmental action')}
            `;
            break;

        case EMAIL_EVENTS.STUDENT_UNBLOCKED_BY_COORDINATOR:
            subject = `Placement Portal - Student Account Unblocked by Coordinator (${data.regNo})`;
            title = 'Student Account Unblocked by Coordinator';
            statusIcon = getIconSvg('shieldCheck', primaryColor);
            contentHtml = `Coordinator ${data.coordinatorName} has unblocked and restored student <strong>${data.studentName}</strong> (${data.regNo}).`;
            detailsCardHtml = `
                ${buildRow('Student Name', data.studentName)}
                ${buildRow('Register Number', data.regNo)}
                ${buildRow('Branch / Dept', data.branch)}
                ${buildRow('Unblocked By Coordinator', data.coordinatorName)}
                ${buildRow('Status', 'Active')}
            `;
            break;

        case EMAIL_EVENTS.COORDINATOR_BLOCKED:
            subject = `Placement Portal - Coordinator Account Suspended`;
            title = 'Coordinator Account Suspended';
            statusIcon = getIconSvg('shieldAlert', '#D23B42');
            contentHtml = `Your Department Coordinator access has been suspended by the Administrator.`;
            detailsCardHtml = `
                ${buildRow('Coordinator Account', data.email)}
                ${buildRow('Assigned Branch', data.branch)}
                ${buildRow('Status', 'Blocked')}
            `;
            break;

        case EMAIL_EVENTS.COORDINATOR_UNBLOCKED:
            subject = `Placement Portal - Coordinator Account Restored`;
            title = 'Coordinator Account Restored';
            statusIcon = getIconSvg('shieldCheck', '#D23B42');
            contentHtml = `Your Department Coordinator access has been restored by the Administrator.`;
            detailsCardHtml = `
                ${buildRow('Coordinator Account', data.email)}
                ${buildRow('Assigned Branch', data.branch)}
                ${buildRow('Status', 'Active')}
            `;
            ctaHtml = buildCta('Login to Portal', `${portalUrl}/login`, 'coordinator');
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
    renderBaseLayout,
    generateTemplate,
    getIconSvg
};
