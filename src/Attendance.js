import React from "react";

// Import image assets (you can add these to your assets folder)
import Adminicon from './assets/Adminicon.png';
import ksrCollegeImage from './assets/ksrCollegeImage.jpg';
import MyAccountIcon from './assets/MyAccountIcon.png';
import NotificationIcon from './assets/NotificationIcon.png';
import PlacemtStatusIcon from './assets/PlacemtStatusIcon.png';
import SuggestionIcon from './assets/SuggestionIcon.png';
import teenyicons_certificate_outline from './assets/teenyicons_certificate-outline.png';
import UpcomingDriveIcon from './assets/UpcomingDriveIcon.png';
import UploadResumeIcon from './assets/UploadResumeIcon.png';
import ProfileSideBarIcon from './assets/ProfileSideBarIcon.png';
import CompanySideBarIcon from './assets/CompanySideBarIcon.svg';
import AchievementsSideBarIcon from './assets/AchievementsSideBarIcon.png';
import AttendanceSideBarIcon from './assets/AttendanceSideBarIcon.png';
import ResumeSideBarIcon from './assets/ResumeSideBarIcon.png';
import DashboardSideBarIcon from './assets/DashboardSideBarIcon.png';

function Attendance() {
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
        
        .navbar .menu a {
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
        
        .navbar .menu a:hover {
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
        
        .graduation-cap {
          width: 24px;
          height: 24px;
          fill: #2085f6;
          margin-right: 15px;
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
          color: #282c36;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.18s;
          gap: 15px;
          border-left: 4px solid transparent;
          margin: 3px 0;
        }
        
        .sidebar .nav-item.selected {
          background: #F8F8F8;
          border-left: 4px solid #2085f6;
          color: #197AFF;
          font-weight: 600;
        }
        
        .sidebar .nav-item.selected img {
          filter: brightness(0) saturate(100%) invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0%) contrast(100%);
        }
        
        .sidebar .nav-item:hover:not(.selected) {
          background: #f0f6ff;
          border-left: 4px solid #2085f6;
          color: #2085f6;
        }
        
        .sidebar .nav-item img {
          width: 20px;
          height: 20px;
          transition: transform 0.2s;
        }
        
        .sidebar .nav-item:hover img {
          transform: scale(1.1);
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
        
        /* Attendance Cards */
        .attendance-cards {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
          margin: 20px 0;
        }
        
        .attendance-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 25px;
          border: 1px solid #f0f0f0;
          text-align: center;
        }
        
        .attendance-card h3 {
          margin: 0 0 15px 0;
          color: #191c24;
          font-size: 1.1em;
          font-weight: 600;
        }
        
        .percentage-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }
        
        .percentage-value {
          font-size: 3em;
          font-weight: bold;
          color: #2085f6;
          margin: 0;
        }
        
        .attendance-chart {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }
        
        .pie-chart {
          width: 120px;
          height: 120px;
          position: relative;
        }
        
        .pie-chart svg {
          width: 100%;
          height: 100%;
        }
        
        .attendance-stats {
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-align: left;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }
        
        .stat-present {
          color: #29bd6e;
        }
        
        .stat-absent {
          color: #ee6c6c;
        }
        
        .status-list {
          text-align: left;
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .status-list li {
          margin-bottom: 8px;
          font-size: 0.95em;
          color: #555;
        }
        
        .star-icon {
          width: 40px;
          height: 40px;
          margin-bottom: 15px;
          color: #ffd700;
        }
        
        /* Attendance Table */
        .attendance-table {
          margin-top: 30px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
          border: 1px solid #f0f0f0;
        }
        
        .table-header {
          background: #f8f9fa;
          padding: 20px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .table-header h2 {
          margin: 0;
          color: #191c24;
          font-size: 1.3em;
          font-weight: 600;
        }
        
        .table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .table th {
          background: #f8f9fa;
          padding: 15px 20px;
          text-align: left;
          font-weight: 600;
          color: #191c24;
          border-bottom: 1px solid #e9ecef;
        }
        
        .table td {
          padding: 15px 20px;
          border-bottom: 1px solid #e9ecef;
          color: #555;
        }
        
        .table tr:hover {
          background: #f8f9fa;
        }
        
        .status-present {
          color: #29bd6e;
          font-weight: 500;
        }
        
        .status-absent {
          color: #ee6c6c;
          font-weight: 500;
        }
        
        /* Responsive */
        @media (max-width: 1200px) {
          .attendance-cards {
            grid-template-columns: 1fr;
            gap: 15px;
          }
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
            <a href="#">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}>
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
              Home
            </a>
            <a href="#">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
              About
            </a>
            <a href="#">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}>
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
              Features
            </a>
            <a href="#">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}>
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              Contact
            </a>
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
                <span className="nav-item">
                  <img src={DashboardSideBarIcon} alt="Dashboard" /> Dashboard
                </span>
                <span className="nav-item">
                  <img src={ResumeSideBarIcon} alt="Resume" /> Resume
                </span>
                <span className="nav-item selected">
                  <img src={AttendanceSideBarIcon} alt="Attendance" /> Attendance
                </span>
                <span className="nav-item">
                  <img src={AchievementsSideBarIcon} alt="Achievements" /> Achievements
                </span>
                <span className="nav-item">
                  <img src={CompanySideBarIcon} alt="Company" /> Company
                </span>
              </div>
              <div className="nav-divider"></div>
              <span className="nav-item">
                <img src={ProfileSideBarIcon} alt="Profile" /> Profile
              </span>
            </nav>
            <button className="logout-btn">
              Logout
            </button>
          </div>
          
          {/* ATTENDANCE CONTENT */}
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
            
            {/* Attendance Cards */}
            <div className="attendance-cards">
              {/* Total Percentage Card */}
              <div className="attendance-card percentage-card">
                <h3>Total Percentage</h3>
                <svg className="graduation-cap" viewBox="0 0 24 24" fill="currentColor" style={{ width: '40px', height: '40px', color: '#2085f6' }}>
                  <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                </svg>
                <div className="percentage-value">55%</div>
              </div>

              {/* Attendance Card */}
              <div className="attendance-card">
                <h3>Attendance</h3>
                <div className="attendance-chart">
                  <div className="pie-chart">
                    <svg width="120" height="120">
                      {/* Present Green Pie (59%) */}
                      <circle
                        r="45"
                        cx="60"
                        cy="60"
                        fill="transparent"
                        stroke="#29bd6e"
                        strokeWidth="12"
                        strokeDasharray={`${(2 * Math.PI * 45 * 0.59)}, ${(2 * Math.PI * 45 * 0.41)}`}
                        strokeDashoffset="0"
                      />
                      {/* Absent Red Pie on top (41%) */}
                      <circle
                        r="45"
                        cx="60"
                        cy="60"
                        fill="transparent"
                        stroke="#ee6c6c"
                        strokeWidth="12"
                        strokeDasharray={`${(2 * Math.PI * 45 * 0.41)}, ${(2 * Math.PI * 45 * 0.59)}`}
                        strokeDashoffset={`-${2 * Math.PI * 45 * 0.59}`}
                      />
                    </svg>
                  </div>
                  <div className="attendance-stats">
                    <div className="stat-item stat-present">
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#29bd6e', borderRadius: '50%' }}></div>
                      Present 59
                    </div>
                    <div className="stat-item stat-absent">
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#ee6c6c', borderRadius: '50%' }}></div>
                      Absent 41
                    </div>
                  </div>
                </div>
              </div>

              {/* Overall Status Card */}
              <div className="attendance-card">
                <h3>Overall Status</h3>
                <svg className="star-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
                <ul className="status-list">
                  <li>1. Good (Above 90%)</li>
                  <li>2. Average (80-90%)</li>
                  <li>3. Too Low (Below 80%)</li>
                </ul>
              </div>
            </div>

            {/* Attendance Details Table */}
            <div className="attendance-table">
              <div className="table-header">
                <h2>ATTENDANCE DETAILS</h2>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>31/07/2025</td>
                    <td>Training</td>
                    <td className="status-present">Present</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>1/08/2025</td>
                    <td>Company Drive</td>
                    <td className="status-present">Present</td>
                  </tr>
                  <tr>
                    <td>3</td>
                    <td>1/08/2025</td>
                    <td>-</td>
                    <td className="status-absent">Absent</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Attendance;


