<<<<<<< HEAD
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
=======
import React from "react";
import Adminicon from "./assets/Adminicon.png";
import ksrCollegeImage from "./assets/ksrCollegeImage.jpg";
import CompanySideBarIcon from "./assets/CompanySideBarIcon.svg";

const sidebarItems = [
  { icon: require('./assets/DashboardSideBarIcon.png'), text: 'Dashboard', view: 'dashboard' },
  { icon: require('./assets/ResumeSideBarIcon.png'), text: 'Resume', view: 'resume' },
  { icon: require('./assets/AttendanceSideBarIcon.png'), text: 'Attendance', view: 'attendance' },
  { icon: require('./assets/AchievementsSideBarIcon.png'), text: 'Achievements', view: 'achievements' },
  { icon: CompanySideBarIcon, text: 'Company', view: 'company' },
  { icon: require('./assets/ProfileSideBarIcon.png'), text: 'Profile', view: 'profile' },
];

// The new, modern attendance chart component logic
const ModernAttendanceChart = ({ present, absent }) => {
  const total = present + absent;
  const presentPerc = total > 0 ? Math.round((present / total) * 100) : 0;
  const absentPerc = total > 0 ? 100 - presentPerc : 0;

  const presentColor = '#00C495';
  const absentColor = '#FF6B6B';
  const gapPercentage = 2;

  const absentEnd = absentPerc - gapPercentage / 2;
  const presentStart = absentPerc + gapPercentage / 2;

  const chartStyle = {
    background: `conic-gradient(
      from 180deg,
      ${presentColor} 0% ${absentEnd}%,
      transparent ${absentEnd}% ${presentStart}%,
      ${absentColor} ${presentStart}% 100%
    )`,
  };

  return (
    <div className="card-content">
      <div className="chart-wrapper">
        <div className="donut-chart" style={chartStyle}></div>
        <div className="chart-label absent-label">A {absentPerc}%</div>
        <div className="chart-label present-label">P {presentPerc}%</div>
      </div>
      <div className="details-wrapper">
        <div className="detail-item">
          Present
          <div className="detail-value present-value">{present}</div>
        </div>
        <div className="detail-item">
          Absent
          <div className="detail-value absent-value">{absent}</div>
        </div>
      </div>
    </div>
  );
};


function PlacementPortalDashboard({ onLogout, userEmail, onViewChange, currentView }) {
  const attendance = { present: 49, absent: 51 };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&display=swap');
        
        body {
          background: #f8f8fb;
          margin: 0;
          padding: 0;
          font-family: 'Poppins', Arial, sans-serif;
          overflow: hidden; /* UPDATED: Prevents main browser scrollbar */
        }
        
        .container {
          font-family: 'Poppins', Arial, sans-serif;
          background: #f8f8fb;
          min-height: 100vh;
        }
        
        /* Navbar styles from Achievements.js */
        .navbar {
          display: flex;
          align-items: center;
          background: #2085f6;
          color: #fff;
          padding: 15px 32px 15px 26px;
          justify-content: space-between;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          height: 65px; /* Define an explicit height */
          box-sizing: border-box; /* Include padding in height */
        }
        
        .navbar .left {
          display: flex;
          align-items: center;
        }
        
        .portal-logo {
          height: 35px;
          width: 35px;
          margin-right: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .portal-logo img {
          height: 30px;
          width: 40px;
          filter: brightness(0) invert(1);
        }
        
        .portal-name {
          font-size: 1.48rem;
          font-weight: bold;
          letter-spacing: 0.5px;
        }
        
        .navbar .menu {
          display: flex;
          gap: 35px;
          font-size: 1.06rem;
        }
        
        .navbar .menu span {
          color: #fff;
          text-decoration: none;
          margin: 0 5px;
          font-weight: 500;
          position: relative;
          padding: 8px 12px;
          border-radius: 6px;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .navbar .menu span:hover {
          background: rgba(255,255,255,0.1);
        }
        
        .main {
          display: flex;
          margin-top: 65px; /* Must match navbar height */
        }
        
        /* Sidebar styles from Achievements.js */
        .sidebar {
          background: #fff;
          width: 230px;
          height: calc(100vh - 65px); /* Must match navbar height */
          box-shadow: 2px 0 12px #e1e6ef3a;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 65px; /* Must match navbar height */
          overflow-y: auto;
          z-index: 999;
        }
        
        .sidebar .user-info {
          text-align: center;
          padding: 25px 20px 20px 20px;
          font-size: 1rem;
          color: #555;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          flex-shrink: 0;
          margin-top: 15px;
        }
        
        .sidebar .user-details img {
          width: 50px;
          height: 40px;
          margin-right: 15px;
          flex-shrink: 0;
        }
        
        .sidebar .user-details {
          margin-top: 8px;
          font-weight: 600;
          font-size: 1.1em;
          color: #191c24;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 0;
        }
        
        .sidebar .user-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          flex: 1;
        }
        
        .sidebar .user-year {
          color: #777;
          font-size: 0.9em;
          font-weight: 400;
          margin-top: 2px;
          display: block;
        }
        
        .sidebar .menu-toggle {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          color: #999;
          font-size: 1.2em;
          cursor: pointer;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s;
          margin-top: 40px; 
        }
        
        .sidebar .menu-toggle:hover {
          background: #f0f0f0;
        }
        
        .sidebar .nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 0px 0;
          justify-content: flex-start;
          gap: 0;
          min-height: 0;
        }
        
        .sidebar .nav-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
        }
        
        .sidebar .nav-item {
          display: flex;
          align-items: center;
          font-size: 1.27rem;
          padding: 18px 25px;
          color: #000000;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.18s;
          gap: 15px;
          border-left: 4px solid transparent;
          margin: 3px 0;
          margin-top : 10px;
        }
        
        .sidebar .nav-item.selected {
          background: #F8F8F8;
          border-left: 4px solid #197AFF;
          color: #197AFF;
          font-weight: 600;
        }
        
        .sidebar .nav-item.selected img {
          filter: brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%);
        }
        
        .sidebar .nav-item:hover:not(.selected) {
          background: #f0f6ff;
          border-left: 4px solid #197AFF;
          color: #197AFF;
        }
        
        .sidebar .nav-item img {
          width: 20px;
          height: 20px;
          transition: transform 0.2s;
          filter: brightness(0) saturate(100%) invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0%) contrast(100%);
        }
        
        .sidebar .nav-item:hover img {
          transform: scale(1.1);
        }
        
        .sidebar .nav-item:hover:not(.selected) img {
          filter: brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%);
        }
        
        .sidebar .nav-divider {
          height: 1px;
          width: 228px;
          background: #e0e0e0;
          margin: 8px 2px;
          border-top: 1px dotted #ccc;
          flex-shrink: 0;
          margin-top: 12px;
        }
        
        .sidebar .logout-btn {
          background: #D23B42;
          color: #fff;
          margin: 25px 25px 25px 25px;
          padding: 10px 0;
          border: none;
          border-radius: 60px;
          font-size: 1.3rem;
          font-weight: 500;
          letter-spacing: 0.2px;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: 50%;
          margin-left: 50px;
          margin-bottom: 10px;
        }
        
        .sidebar .logout-btn:hover {
          background: #d55a6a;
        }

        /* Original dashboard styles below */
        .dashboard-area {
          flex: 1;
          height: calc(100vh - 65px); /* UPDATED: Subtracts navbar height */
          padding: 15px 15px 0 15px;
          background: #fff;
          margin-left: 230px; /* Space for the fixed sidebar */
          overflow-y: auto; /* A scrollbar will appear HERE if content is too tall */
          overflow-x: hidden;
          position: relative;
          box-sizing: border-box; 
        }
        
        .college-head {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 20px;
          margin-bottom: 5px;
          width: 100%;
        }
        
        .college-logo {
          width: 150px;
          height: 150px;
          object-fit: cover;
          margin-left: 20px;
        }
        
        .college-name {
          font-size: 2.3em;
          font-weight: bold;
          color: #191c24;
          letter-spacing: 0.7px;
          display: flex;
          flex: 1;
          justify-content: flex-start;
          align-items: center;
          width: 200%;
          white-space: nowrap;
          font-family:'times new roman';
        }
        
        .college-name .autonomous {
          font-size: 1em;
          color: #f06d68;
          margin-left:20px;
        }
        
        .college-code {
          font-weight: bold;
          letter-spacing: 1px;
          color: #191c24;
          margin-left:20px;
        }
        
        .dash-greet {
          font-size: 1.22rem;
          font-weight: 600;
          margin: 30px 0 10px 0;
          color:rgb(0, 0, 0);
          margin-left: 25px;
        }
        .student{
          font-size:1.5rem;
          color:rgb(0,62,255);
        }
        
        .grid-area {
          display: grid;
          grid-template-columns: 270px 270px 270px 270px;
          grid-template-rows: auto auto auto;
          gap: 5px;
          padding: 36px 30px 2px 35px;
          background:rgb(255, 255, 255);
          min-height: calc(100vh - 200px);
          border: 2px solid #ffffff; 
          border-radius: 14px;
          box-sizing: border-box;
          margin-bottom: 20px;
        }

        .card-notif, .card-resume, .card-drive, .card-certificates, .card-app-status, 
        .card-placmt-status, .card-suggest, .card-my-account {
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 2px 9px rgba(80, 139, 255, 0.09);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 16px 17px 10px 22px;
        }
        .card-notif {
          grid-column: 1 / span 1; grid-row: 1 / span 1;
          width: 280px; height: 300px; border: 2px solid gray;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          margin-top: -10px; margin-left: -10px;
        }
        .card-notif:hover {
          border-color:rgb(106, 175, 244);
          box-shadow: 0 4px 12px rgb(209, 213, 216);
        }
        .card-resume {
          grid-column: 2 / span 1; grid-row: 1 / span 1;
          width: 270px; height: 300px; border: 2px solid gray;
          border-radius: 14px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          margin-top: -10px; margin-left: 10px;
        }
        .card-resume:hover {
          border-color:rgb(106, 175, 244);
          box-shadow: 0 4px 12px rgb(209, 213, 216);
        }
        .card-drive {
          grid-column: 3 / span 1; grid-row: 1 / span 1;
          width: 630px; height: 200px; max-width: 600; border: 2px solid gray;
          border-radius: 14px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          margin-top: -10px; margin-left: 20px;
        }
        .card-drive:hover {
          border-color:rgb(106, 175, 244);
          box-shadow: 0 4px 12px rgb(209, 213, 216);
        }
        .card-certificates {
          grid-column: 1 / span 2; grid-row: 2 / span 1;
          width: 570px; height: 200px; border: 2px solid gray;
          border-radius: 14px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          margin-top: 10px; margin-left: -10px;
        }
        .card-certificates:hover {
          border-color:rgb(106, 175, 244);
          box-shadow: 0 4px 12px rgb(209, 213, 216);
        }
        .card-app-status {
          grid-column: 3 / span 1; grid-row: 2 / span 1;
          width: 310px; height: 220px; justify-content: center; border: 2px solid gray;
          border-radius: 14px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          margin-top: -95px; margin-left: 20px;
        }
        .card-app-status:hover {
          border-color:rgb(106, 175, 244);
          box-shadow: 0 4px 12px rgb(209, 213, 216);
        }
        .card-placmt-status {
          grid-column: 4 / span 1; grid-row: 2 / span 1;
          width: 310px; height: 220px; align-items: center; justify-content: center;
          border: 2px solid gray; border-radius: 14px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          margin-top: -95px; margin-left: 68px;
        }
        .card-placmt-status:hover {
          border-color:rgb(106, 175, 244);
          box-shadow: 0 4px 12px rgb(209, 213, 216);
        }
        .card-suggest {
          grid-column: 2 / span 1; grid-row: 3 / span 1;
          width: 270px; height: 200px; border: 2px solid gray;
          border-radius: 14px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          margin-top: 5px; margin-left: 15px;
        }
        .card-suggest:hover {
          border-color:rgb(106, 175, 244);
          box-shadow: 0 4px 12px rgb(209, 213, 216);
        }
        .card-my-account {
          grid-column: 1 / span 1; grid-row: 3 / span 1;
          width: 290px; height: 200px; border: 2px solid gray;
          border-radius: 14px;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          margin-top: 5px; margin-left: -10px;
        }
        .card-my-account:hover {
          border-color:rgb(106, 175, 244);
          box-shadow: 0 4px 12px rgb(209, 213, 216);
        }

        .card-attendance {
            grid-column: 3 / span 2;
            grid-row: 3 / span 1;
            width: 630px;
            margin-top: -75px;
            margin-left: 20px;
            padding: 24px;
            background-color: #ffffff;
            border-radius: 20px;
            border: 2px solid gray;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.07);
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-start;
        }
        .card-attendance:hover {
            border-color: rgb(106, 175, 244);
            box-shadow: 0 4px 12px rgb(209, 213, 216);
            transform: translateY(0px);
        }
        .new-attendance-title {
          font-family: 'Manrope', sans-serif;
          font-size: 22px;
          font-weight: 800;
          color: #1a202c;
          margin: 0 0 24px 0;
        }
        .card-content {
          display: flex;
          align-items: center;
          justify-content: space-around;
          gap: 20px;
        }
        .chart-wrapper {
          position: relative;
          width: 150px;
          height: 150px;
          flex-shrink: 0;
          margin-left: 200px;
        }
        .donut-chart {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          position: relative;
        }
        .donut-chart::before {
          content: '';
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 75%; height: 75%;
          background-color: #ffffff;
          border-radius: 50%;
          z-index: 1;
        }
        .chart-label {
          position: absolute;
          background-color: #ffffff;
          padding: 6px 12px;
          border-radius: 8px;
          font-family: 'Manrope', sans-serif;
          font-weight: 800;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          z-index: 2;
        }
        .absent-label {
            top: 0; left: 70%;
            transform: translate(-50%, -50%);
            color: #FF6B6B;
            margin-left: 20px;
        }
        .present-label {
            bottom: 0; left: 50%;
            transform: translate(-50%, 50%);
            color: #00C495;
            margin-left: -40px
        }
        .chart-label::after {
            content: '';
            position: absolute;
            left: 50%;
            border-width: 6px;
            border-style: solid;
            transform: translateX(-50%);
        }
        .absent-label::after {
            top: 100%;
            border-color: #ffffff transparent transparent transparent;
        }
        .present-label::after {
            bottom: 100%;
            border-color: transparent transparent #ffffff transparent;
        }
        .details-wrapper {
          display: flex;
          flex-direction: column;
          gap: 20px;
          text-align: left;
          flex-grow: 1;
        }
        .detail-item {
          font-family: 'Manrope', sans-serif;
          font-size: 16px;
          color: #718096;
        }
        .detail-value {
          font-size: 36px;
          font-weight: 800;
          line-height: 1;
        }
        .present-value { color: #00C495; }
        .absent-value { color: #FF6B6B; }

        .card-title { }
        .card-text {
          fontSize: 13.3;
          color: "#555";
          marginTop: 4;
          maxWidth: "93%";
          lineHeight: 1.5;
        }
      `}</style>
      
      <div className="container">
        <div className="navbar">
            <div className="left">
                <span className="portal-logo">
                    <img src={Adminicon} alt="Portal Logo" />
                </span>
                <span className="portal-name">Placement Portal</span>
            </div>
            <div className="menu">
                <span style={{ cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>Home</span>
                <span style={{ cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>About</span>
                <span style={{ cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>Features</span>
                <span style={{ cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>Contact</span>
            </div>
        </div>

        <div className="main">
          <div className="sidebar">
              <div className="user-info">
                  <div className="user-details">
                      <img src={Adminicon} alt="Admin" style={{ filter: "brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%)" }} />
                      <div className="user-text">
                          <span>Student</span>
                          <span className="user-year">Final Year</span>
                      </div>
                      <img src={Adminicon} alt="Admin" style={{ width: "16px", height: "16px", marginLeft: "auto" }} />
                  </div>
              </div>
              <button className="menu-toggle">•••</button>
              <nav className="nav">
                  <div className="nav-section">
                      {sidebarItems.slice(0, 5).map((item) => (
                          <span key={item.text} className={`nav-item${item.view === currentView ? ' selected' : ''}`} onClick={() => onViewChange(item.view)}>
                              <img src={item.icon} alt={item.text} /> {item.text}
                          </span>
                      ))}
                  </div>
                  <div className="nav-divider"></div>
                  <span className={`nav-item${currentView === 'profile' ? ' selected' : ''}`} onClick={() => onViewChange('profile')}>
                      <img src={require('./assets/ProfileSideBarIcon.png')} alt="Profile" /> Profile
                  </span>
              </nav>
              <button className="logout-btn" onClick={onLogout}>
                  Logout
              </button>
          </div>

          <div className="dashboard-area">
            <div className="college-head">
              <img src={ksrCollegeImage} alt="College Logo" className="college-logo" />
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%' }}>
                <span className="college-name">K S R COLLEGE OF ENGINEERING   <span className="autonomous">  (Autonomous)</span> <span className="college-code">- 637215</span></span>
              </div>
            </div>
            <div className="dash-greet">Welcome Back, <span className="student">Student</span></div>

            <div className="grid-area">
              <div className="card-notif">
                <img src={require('./assets/NotificationIcon.png')} alt="Notification" style={{ width: 100, height: 100, top: -5, left: 70, marginBottom: 11, filter: 'invert(56%) sepia(39%) saturate(533%) hue-rotate(91deg) brightness(92%) contrast(85%)', position: 'relative' }} />
                <div className="card-title" style={{fontSize:'25px', fontWeight:600, textAlign:"center", top: -10, left: 40, }}>
                  Notification / Announcement
                </div>
                <div className="card-text" style={{ fontSize: '15px', marginTop:'10px', marginLeft: '30px', color: "#555" }}>
                  New Company Reminder: profile not completed
                </div>
              </div>

              <div className="card-resume">
                <img src={require('./assets/UploadResumeIcon.png')} alt="Resume" style={{ width: 100, height: 100, top: -5, left: 60, marginBottom: 11, position: 'relative' }} />
                <div className="card-title" style={{fontSize:'25px', fontWeight:600, marginTop: 5, marginLeft: 20}}>Upload Resume</div>
                <div className="card-text" style={{ fontSize: '15px', marginTop:'10px', marginLeft: '20px', color: "#555" }}>Showcase your skills with your resume</div>
              </div>

              <div className="card-drive">
                <img src={require('./assets/UpcomingDriveIcon.png')} alt="Upcoming Drive" style={{  width: 150,height: 120,marginBottom: 12,marginTop: 30,marginLeft: 30 }} />
                <div className="card-title" style={{fontWeight: 700, fontSize: 30, marginTop: -150, marginBottom: 10,marginLeft: 250}}>Upcoming Drive</div>
                <div style={{ fontSize: 15, lineHeight: 1.6, marginTop: 0, marginLeft : 250, width: "72%", color: "#555" }}>
                  <strong>Company Name:</strong> Infosys<br />
                  <strong>Date:</strong> 20/08/2025<br />
                  <strong>Role:</strong> Testing<br />
                  <strong>Eligibility:</strong>
                </div>
              </div>

              <div className="card-certificates">
                <img src={require('./assets/uploadcertificateicon.png')} alt="Certificates" style={{ width: 100,height: 100,marginBottom: 12,marginTop: 20,marginLeft: 30}} />
                <img src={require('./assets/certificateuploadicon.png')} alt="Certificates" style={{ width: 30,height: 30,marginBottom: 12,marginTop: -55,marginLeft: 45}} />
                <div style={{ fontWeight: 700, fontSize: 30, marginTop: -80, marginBottom: 10,marginLeft: 200}}>
                  Upload Certificates
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.6, marginTop: 20, marginLeft : 180, width: "72%", color: "#555" }}>
                  Let your accomplishments shine with pride. 
                </div>
              </div>
              
              <span className="card-app-status">
                <span style={{ fontSize: '25px', fontWeight: 600, marginTop: -60, marginLeft: 20, display: "inline-block" }}>
                  Application Status
                </span>
                <span style={{ fontSize: 13.5, marginTop: 30, marginLeft: 70, color: "#555", lineHeight: 1.5, display: "inline-block" }}>
                  List of Jobs Applied<br />Status: Applied
                </span>
              </span>

              <div className="card-placmt-status">
                <img src={require('./assets/PlacemtStatusIcon.png')} alt="Placement" style={{ width: 25, marginBottom: 4 }} />
                <div style={{ fontWeight: 700, fontSize: 25, marginTop: 8 }}>Placement Status</div>
                <div style={{ marginTop: 13, fontSize: 14 }}>Working Good</div>
              </div>

              <div className="card-suggest">
                <img src={require('./assets/SuggestionIcon.png')} alt="Suggestion" style={{ width: 50, marginBottom: 9 }} />
                <div style={{ fontWeight: 700, fontSize: 25, marginTop: -50, marginBottom: 10,marginLeft: 60}}>Suggestions</div>
                <div style={{ fontSize: 13, color: "#888", marginTop: 30 }}>
                  Based on your CGPA eligible for TCS <br />
                </div>
              </div>

              <div className="card-my-account">
                <img src={require('./assets/MyAccountIcon.png')} alt="My Account" style={{ width: 100, height: 100, top: 2, left: 73, marginBottom: 11, position: 'relative' }} />
                <div style={{ fontWeight: 700, fontSize: 24, marginTop: 0, marginBottom: 10,marginLeft: 55}}>My Account</div>
                <div style={{ fontSize: '15px', marginTop:'-5px', marginLeft: '90px', color: "#555" }}>Settings</div>
              </div>

              <div className="card-attendance">
                  <h2 className="new-attendance-title">Attendance</h2>
                  <ModernAttendanceChart present={attendance.present} absent={attendance.absent} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
}

export default PlacementPortalDashboard;