import React, { useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import './dashboard.css';

// Import assets needed for THIS page
import ksrCollegeImage from "./assets/ksrCollegeImage.jpg";
import ApplicationStatusIcon from "./assets/applicationstatusicon.png";

// ATTENDANCE CHART COMPONENT (can stay in this file as it's only used here)
const ModernAttendanceChart = ({ present, absent }) => {
    const total = present + absent;
    const presentPerc = total > 0 ? Math.round((present / total) * 100) : 0;
    const chartStyle = {
        background: `conic-gradient(from 180deg, #00C495 0% ${presentPerc}%, #FF6B6B ${presentPerc}% 100%)`,
    };
    return (
        <div className="card-content">
            <div className="chart-wrapper"><div className="donut-chart" style={chartStyle}><div className="chart-center-text"><div className="chart-center-value">{presentPerc}%</div><div className="chart-center-label">Present</div></div></div></div>
            <div className="details-wrapper"><div className="detail-item">Present<div className="detail-value present-value">{present}</div></div><div className="detail-item">Absent<div className="detail-value absent-value">{absent}</div></div></div>
        </div>
    );
};

// MAIN DASHBOARD COMPONENT
// It now receives `onViewChange` from App.js which triggers the router
function PlacementPortalDashboard({ onLogout, userEmail, onViewChange }) {
    const attendance = { present: 49, absent: 51 };
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // This handler will be passed to the cards to trigger navigation
    const handleCardClick = (view) => {
        onViewChange(view);
    };

    return (
        <div className="container">
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className="main">
                {/* The Sidebar now gets the onViewChange from App.js */}
                {/* We hardcode 'dashboard' as currentView so it's always highlighted on this page */}
                <Sidebar
                    isOpen={isSidebarOpen}
                    onLogout={onLogout}
                    onViewChange={onViewChange}
                    currentView={'dashboard'} 
                />

                {/* The content area now ONLY shows the dashboard content */}
                <div className="dashboard-area">
                    <div className="college-head">
                        <img src={ksrCollegeImage} alt="College Logo" className="college-logo" />
                        <div className="college-text-wrapper">
                            <span className="college-name">
                                K S R COLLEGE OF ENGINEERING <span className="autonomous">(Autonomous)</span> - <span className="college-code">637215</span>
                            </span>
                        </div>
                    </div>

                    <div className="grid-area">
                        {/* Row 1 */}
                        <div className="card card-vertical">
                            <img src={require('./assets/NotificationIcon.png')} alt="Notification" className="card-icon notification-icon" />
                            <div className="card-content-wrapper"><div className="Notification-card-title">Notification / Announcement</div><p className="card-text">New Company Reminder: profile not completed</p></div>
                        </div>
                        <div className="card card-vertical" onClick={() => handleCardClick('resume')}>
                            <img src={require('./assets/UploadResumeIcon.png')} alt="Resume" className="card-icon" />
                            <div className="card-content-wrapper"><div className="Upload-card-title">Upload Resume</div><p className="card-text">Showcase your skills with your resume</p></div>
                        </div>
                        <div className="card card-horizontal card-upcoming-drive" onClick={() => handleCardClick('company')}>
                            <img src={require('./assets/UpcomingDriveIcon.png')} alt="Upcoming Drive" className="card-icon" />
                            <div className="card-content-wrapper"><div className="Upcoming-card-title">Upcoming Drive</div><p className="card-text"><strong>Company Name:</strong> Infosys<br /><strong>Date:</strong> 20/08/2025<br /><strong>Role:</strong> Testing<br /><strong>Eligibility:</strong></p></div>
                        </div>

                        {/* Row 2 */}
                        <div className="card card-horizontal card-upload-certificates" onClick={() => handleCardClick('achievements')}>
                            <div className="icon-container-certificates"><img src={require('./assets/uploadcertificateicon.png')} alt="Certificates" className="main-icon" /><img src={require('./assets/certificateuploadicon.png')} alt="Upload" className="overlay-icon" /></div>
                            <div className="card-content-wrapper"><div className="Certificates-card-title">Upload Certificates</div><p className="card-text">Let your accomplishments shine with pride.</p></div>
                        </div>
                        <div className="card card-vertical card-application-status">
                            <img src={ApplicationStatusIcon} alt="Application Status" className="card-icon" />
                            <div className="card-content-wrapper"><div className="Application-card-title">Application Status</div><p className="card-text">List of Jobs Applied<br />Status: Applied</p></div>
                        </div>
                        <div className="card card-vertical card-placement-status">
                            <img src={require('./assets/PlacemtStatusIcon.png')} alt="Placement Status" className="card-icon" />
                            <div className="card-content-wrapper"><div className="Placement-card-title">Placement Status</div><p className="card-text">Working Good</p></div>
                        </div>

                        {/* Row 3 */}
                        <div className="card card-vertical card-my-account" onClick={() => handleCardClick('profile')}>
                            <img src={require('./assets/MyAccountIcon.png')} alt="My Account" className="card-icon" />
                            <div className="card-content-wrapper"><div className="Account-card-title">My Account</div><p className="card-text">Settings</p></div>
                        </div>
                        <div className="card card-vertical card-suggestions">
                            <img src={require('./assets/SuggestionIcon.png')} alt="Suggestion" className="card-icon" />
                            <div className="card-content-wrapper"><div className="Suggestion-card-title">Suggestions</div><p className="card-text">Based on your CGPA eligible for TCS</p></div>
                        </div>
                        <div className="card card-attendance" onClick={() => handleCardClick('attendance')}>
                            <h2 className="new-attendance-title">Attendance</h2>
                            <ModernAttendanceChart present={attendance.present} absent={attendance.absent} />
                        </div>
                    </div>
                </div>
            </div>
            {isSidebarOpen && <div className="overlay" onClick={() => setIsSidebarOpen(false)}></div>}
        </div>
    );
}

export default PlacementPortalDashboard;