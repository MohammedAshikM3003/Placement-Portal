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

function AttendancePieChart({ present, absent }) {
  const total = present + absent;
  const presentPerc = (present / total) * 100;
  const absentPerc = (absent / total) * 100;

  return (
    <svg width="90" height="90" viewBox="0 0 122 122">
      <circle
        cx="61"
        cy="61"
        r="50"
        fill="none"
        stroke="#f95e5c"
        strokeWidth="21"
        strokeDasharray={`${(absentPerc / 100) * 314} 314`}
        strokeDashoffset="0"
      />
      <circle
        cx="61"
        cy="61"
        r="50"
        fill="none"
        stroke="#37c08a"
        strokeWidth="21"
        strokeDasharray={`${(presentPerc / 100) * 314} 314`}
        strokeDashoffset={`-${(absentPerc / 100) * 314}`}
      />
    </svg>
  );
}

function PlacementPortalDashboard({ onLogout, userEmail, onViewChange, currentView }) {
  const attendance = { present: 49, absent: 51 };
  const presentPerc = Math.round(
    (attendance.present / (attendance.present + attendance.absent)) * 100
  );
  const absentPerc = 100 - presentPerc;

  return (
    <>
      <style>{`
        body {
          background: #f8f8fb;
          margin: 0;
          padding: 0;
          font-family: 'Poppins', Arial, sans-serif;
        }
        
        .container {
          font-family: 'Poppins', Arial, sans-serif;
          background: #f8f8fb;
          min-height: 100vh;
        }
        
        /* Navbar styles */
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
          height: 35px;
          width: 35px;
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
          min-height: calc(100vh - 65px);
          margin-top: 65px;
        }
        
        /* Sidebar */
        .sidebar {
          background: #fff;
          width: 230px;
          height: calc(100vh - 65px);
          box-shadow: 2px 0 12px #e1e6ef3a;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 65px;
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
        }
        
        .sidebar .user-details img {
          width: 24px;
          height: 24px;
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
        }
        
        .sidebar .menu-toggle:hover {
          background: #f0f0f0;
        }
        
        .sidebar .nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 25px 0;
          justify-content: space-between;
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
          font-size: 1.04rem;
          padding: 18px 25px;
          color: #000000;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.18s;
          gap: 15px;
          border-left: 4px solid transparent;
          margin: 3px 0;
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
          background: #e0e0e0;
          margin: 8px 25px;
          border-top: 1px dotted #ccc;
          flex-shrink: 0;
        }
        
        .sidebar .logout-btn {
          background: #E96D7B;
          color: #fff;
          margin: 25px 25px 25px 25px;
          padding: 15px 0;
          border: none;
          border-radius: 25px;
          font-size: 1.07rem;
          font-weight: 500;
          letter-spacing: 0.2px;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .sidebar .logout-btn:hover {
          background: #d55a6a;
        }
        
        /* Dashboard area */
        .dashboard-area {
          flex: 1;
          padding: 15px 15px 0 15px;
          background: #fff;
          margin-left: 230px;
          overflow: hidden;
          position: relative;
        }
        
        .college-head {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 18px;
          margin-bottom: 5px;
          width: 100%;
        }
        
        .college-logo {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: #fff;
          border: 1.5px solid #eee;
          object-fit: cover;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .college-name {
          font-size: 1.41em;
          font-weight: bold;
          color: #191c24;
          letter-spacing: 0.7px;
          display: flex;
          flex: 1;
          justify-content: flex-start;
          align-items: center;
          width: 100%;
          white-space: nowrap;
        }
        
        .college-name .autonomous {
          color: #f06d68;
        }
        
        .college-code {
          font-weight: bold;
          letter-spacing: 1px;
          color: #191c24;
        }
        
        .dash-greet {
          font-size: 1.22rem;
          font-weight: 600;
          margin: 8px 0 4px 0;
          color: #191c24;
        }
        
        /* Grid with fixed column widths and row heights adjusted for taller cards */
        .grid-area {
          display: grid;
          grid-template-columns: 270px 270px 270px 270px;
          grid-template-rows: auto auto auto;
          gap: 20px;
          padding: 36px 30px 32px 30px;
          background: #fafbfc;
          min-height: calc(100vh - 240px);
        }

        /* Card Styles */
        .card-notif, .card-resume, .card-drive, .card-certificates, .card-app-status, 
        .card-placmt-status, .card-suggest, .card-my-account, .card-attendance {
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 2px 9px rgba(80, 139, 255, 0.09);
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 16px 17px 10px 22px;
        }

        .card-notif {
          grid-column: 1 / span 1;
          grid-row: 1 / span 1;
          width: 270px;
          height: 280px;
        }

        .card-resume {
          grid-column: 2 / span 1;
          grid-row: 1 / span 1;
          width: 270px;
          height: 280px;
        }

        .card-drive {
          grid-column: 3 / span 1;
          grid-row: 1 / span 1;
          width: 560px;
          height: 200px;
          max-width: 600;
        }

        .card-certificates {
          grid-column: 1 / span 2;
          grid-row: 2 / span 1;
          width: 560px;
          height: 200px;
        }

        .card-app-status {
          grid-column: 3 / span 1;
          grid-row: 2 / span 1;
          width: 270px;
          height: 180px;
          margin-top: -70px;
          align-items: center;
          justify-content: center;
        }

        .card-placmt-status {
          grid-column: 4 / span 1;
          grid-row: 2 / span 1;
          width: 270px;
          height: 180px;
          margin-top: -70px;
          align-items: center;
          justify-content: center;
        }

        .card-suggest {
          grid-column: 2 / span 1;
          grid-row: 3 / span 1;
          width: 270px;
          height: 200px;
        }

        .card-my-account {
          grid-column: 1 / span 1;
          grid-row: 3 / span 1;
          width: 270px;
          height: 200px;
        }

        .card-attendance {
          grid-column: 3 / span 2;
          grid-row: 3 / span 1;
          width: 560px;
          height: 280px;
          margin-top: -80px;
          flex-direction: row;
          align-items: center;
          justify-content: flex-start;
        }

        .card-title {
          fontWeight: 700;
          fontSize: 17;
          margin: "7px 0 10px 0";
          letterSpacing: "0.03em";
        }

        .card-text {
          fontSize: 13.3;
          color: "#555";
          marginTop: 4;
          maxWidth: "93%";
          lineHeight: 1.5;
        }

        .attendance-percent {
          fontWeight: 700;
          fontSize: 16;
          marginBottom: 5;
          marginTop: 0;
        }

        .attendance-detail {
          fontSize: 14.5;
          color: "#555";
          marginBottom: 8;
        }

        .attendance-status-text {
          maxWidth: 200;
          marginLeft: 18;
          display: "flex";
          flexDirection: "column";
          justifyContent: "center";
          alignItems: "flex-start";
        }

        .attendance-row {
          display: "flex";
          alignItems: "center";
          gap: 20;
          width: "100%";
        }
      `}</style>
      
      <div className="container">
        {/* NAVBAR */}
        <div className="navbar">
          <div className="left">
            <span className="portal-logo">
              <img src={Adminicon} alt="Portal Logo" />
            </span>
            <span className="portal-name">Placement Portal</span>
          </div>
          <div className="menu">
            <span style={{ cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}>
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              Home
            </span>
            <span style={{ cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              About
            </span>
            <span style={{ cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}>
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
              Features
            </span>
            <span style={{ cursor: 'pointer' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}>
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              Contact
            </span>
          </div>
        </div>

        <div className="main">
          {/* SIDEBAR */}
          <div className="sidebar">
            <div className="user-info">
              <div className="user-details">
                <img src={Adminicon} alt="Admin" style={{ 
                  filter: "brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%)"
                }} />
                <div className="user-text">
                  <span>Student</span>
                  <span className="user-year">Final Year</span>
          </div>
                <img src={Adminicon} alt="Admin" style={{ 
                  width: "16px", 
                  height: "16px",
                  marginLeft: "auto"
                }} />
          </div>
        </div>
            <button className="menu-toggle">•••</button>
            <nav className="nav">
              <div className="nav-section">
                {sidebarItems.slice(0, 5).map((item) => (
                  <span
                    key={item.text}
                    className={`nav-item${item.view === currentView ? ' selected' : ''}`}
              onClick={() => {
                      console.log("Sidebar item clicked:", item.text, "view:", item.view);
                      onViewChange(item.view);
                    }}
                  >
                    <img src={item.icon} alt={item.text} /> {item.text}
                  </span>
          ))}
        </div>
              <div className="nav-divider"></div>
              <span className={`nav-item${currentView === 'profile' ? ' selected' : ''}`}
                onClick={() => onViewChange('profile')}
              >
                <img src={require('./assets/ProfileSideBarIcon.png')} alt="Profile" /> Profile
              </span>
            </nav>
            <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
        </div>

          {/* DASHBOARD CONTENT */}
          <div className="dashboard-area">
            <div className="college-head">
          <img
            src={ksrCollegeImage}
                alt="College Logo"
                className="college-logo"
              />
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%' }}>
                <span className="college-name">K S R COLLEGE OF ENGINEERING <span className="autonomous">(Autonomous)</span> <span className="college-code">- 637215</span></span>
            </div>
          </div>
            <div className="dash-greet">Welcome Back, Student</div>

        {/* Dashboard Grid Area */}
            <div className="grid-area">
          {/* Notification / Announcement */}
              <div className="card-notif">
            <img
                  src={require('./assets/NotificationIcon.png')}
              alt="Notification"
              style={{ width: 31, marginBottom: 11 }}
            />
                <div className="card-title">Notification / Announcement</div>
                <div className="card-text">New Company Reminder: profile not completed</div>
          </div>

          {/* Upload Resume */}
              <div className="card-resume">
                <img src={require('./assets/UploadResumeIcon.png')} alt="Resume" style={{ width: 33, marginBottom: 10 }} />
                <div className="card-title">Upload Resume</div>
                <div className="card-text">Showcase your skills with your resume</div>
          </div>

          {/* Upcoming Drive */}
              <div className="card-drive">
                <img src={require('./assets/UpcomingDriveIcon.png')} alt="Upcoming Drive" style={{ width: 32, marginBottom: 7 }} />
                <div className="card-title">Upcoming Drive</div>
                <div style={{ fontSize: 12.6, marginTop: 8, color: "#555", lineHeight: 1.5 }}>
              <strong>Company Name:</strong> Infosys<br />
              <strong>Date:</strong> 20/08/2025<br />
              <strong>Role:</strong> Testing<br />
              <strong>Eligibility:</strong>
            </div>
          </div>

          {/* Upload Certificates */}
              <div className="card-certificates">
            <img
                  src={require('./assets/teenyicons_certificate-outline.png')}
              alt="Certificates"
              style={{ width: 36, marginBottom: 12 }}
            />
                <div style={{ fontWeight: 700, fontSize: 19, marginTop: 6, marginBottom: 10 }}>
              Upload Certificates
            </div>
            <div
              style={{
                fontSize: 15,
                marginTop: 4,
                lineHeight: 1.6,
                width: "72%",
                    color: "#555",
              }}
            >
              Let your accomplishments shine with pride. Add more space for multi-line certificate
              details or future enhancements.
            </div>
          </div>

          {/* Application Status */}
              <div className="card-app-status">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 13,
                marginTop: 4,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 17 }}>Application Status</div>
              <button
                style={{
                  background: "#208bee",
                  color: "#fff",
                  fontWeight: 600,
                  padding: "4px 13px",
                  borderRadius: 7,
                  marginLeft: 5,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13.1,
                }}
              >
                Apply
              </button>
            </div>
                <div style={{ fontSize: 13.5, marginTop: 4, color: "#555", lineHeight: 1.5 }}>
              List of Jobs Applied
              <br />
              Status: Applied
            </div>
          </div>

          {/* Placement Status */}
              <div className="card-placmt-status">
            <img
                  src={require('./assets/PlacemtStatusIcon.png')}
              alt="Placement"
              style={{ width: 25, marginBottom: 4 }}
            />
            <div style={{ fontWeight: 700, fontSize: 16, marginTop: 8 }}>Placement Status</div>
            <div style={{ marginTop: 13, fontSize: 14 }}>Working Good</div>
          </div>

          {/* Suggestions */}
              <div className="card-suggest">
                <img src={require('./assets/SuggestionIcon.png')} alt="Suggestion" style={{ width: 27, marginBottom: 9 }} />
            <div style={{ fontWeight: 700, fontSize: 15.5 }}>Suggestions</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 6 }}>
              Based on your CGPA eligible for TCS <br />
              Add PAN number to complete profile
            </div>
          </div>

          {/* My Account */}
              <div className="card-my-account">
                <img src={require('./assets/MyAccountIcon.png')} alt="My Account" style={{ width: 28, marginBottom: 8 }} />
            <div style={{ fontWeight: 700, fontSize: 15.5 }}>My Account</div>
            <div style={{ fontSize: 13, color: "#888", marginTop: 6 }}>Settings</div>
          </div>

          {/* Attendance */}
              <div className="card-attendance">
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 10 }}>Attendance</div>
                <div className="attendance-row">
              <AttendancePieChart present={attendance.present} absent={attendance.absent} />
                  <div className="attendance-status-text">
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 5, marginTop: 0, color: "#f95e5c" }}>
                  A {absentPerc}%
                </div>
                    <div className="attendance-detail">Absent {attendance.absent}</div>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 5, marginTop: 6, color: "#37c08a" }}>
                  P {presentPerc}%
                </div>
                    <div className="attendance-detail">Present {attendance.present}</div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default PlacementPortalDashboard;
