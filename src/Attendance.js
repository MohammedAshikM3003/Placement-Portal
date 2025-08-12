import React from "react";

// Import image assets
import Adminicon from './assets/Adminicon.png';
import CompanySideBarIcon from './assets/CompanySideBarIcon.svg';
import StudentIcon from './assets/StudentIcon.png';
import totalpercentagestudenticon from './assets/totalpercentagestudenticon.png'
import totalpercentageicon from './assets/totalpercentageicon.png'

function Attendance({ onLogout, onViewChange, currentView }) {
  const sidebarItems = [
    { icon: require('./assets/DashboardSideBarIcon.png'), text: 'Dashboard', view: 'dashboard' },
    { icon: require('./assets/ResumeSideBarIcon.png'), text: 'Resume', view: 'resume' },
    { icon: require('./assets/AttendanceSideBarIcon.png'), text: 'Attendance', view: 'attendance' },
    { icon: require('./assets/AchievementsSideBarIcon.png'), text: 'Achievements', view: 'achievements' },
    { icon: CompanySideBarIcon, text: 'Company', view: 'company' },
    { icon: require('./assets/ProfileSideBarIcon.png'), text: 'Profile', view: 'profile' },
  ];

  return (
    <>
      <style>{`
        body {
          background: #f8f8fb;
          margin: 0;
          padding: 0;
          font-family: 'Poppins', Arial, sans-serif;
          overflow-x: hidden;
          overflow-y: hidden;
          width: 100%;
          height: 100%;
          position: relative;
        }
        
        .container {
          font-family: 'Poppins', Arial, sans-serif;
          background: #f8f8fb;
          min-height: 100vh;
          width: 100%;
          position: relative;
          overflow-x: hidden;
          overflow-y: hidden;
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
          width: 100vw;
          box-sizing: border-box;
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
          width: 100%;
          position: relative;
          overflow: hidden;
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
          box-sizing: border-box;
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
          padding: 15px 15px 15px 15px;
          background: #fff;
          margin-left: 230px;
          overflow: hidden;
          position: relative;
          width: calc(100vw - 230px);
          box-sizing: border-box;
          height: calc(100vh - 65px);
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
          margin: 0px;
          box-sizing: border-box;
          top margin :-10px;
        }
        
        .attendance-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 25px;
          border: 1px solid #f0f0f0;
          box-sizing: border-box;
          min-height: 200px;
          display: flex;
          flex-direction: column;
          top margin :-10px;
          height: 280px;
          margin-right:-140px;
          margin-left:-110px;
        }
        
        .percentage-card {
          width: 235px;
          height: 260px;
        }
        
        .overall-status-card {
          width: 235px;
          height: 280px;
          margin-left:150px;
          margin-right:-px;
        }
        
        .attendance-card h3 {
          margin: 0 0 15px 0;
          color: #191c24;
          font-size: 1.1em;
          font-weight: 600;
          text-align: left;
        }
        
        .percentage-card h3 {
          text-align: center;
        }
        
        .percentage-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          text-align: center;
          margin-left:30px;
          width: 260px;
          height: 280px;
        }
        
        .percentage-value {
          font-size: 3em;
          font-weight: bold;
          color: #2085f6;
          margin: 0;
          text-align: center;
        }
        
        .attendance-chart {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-top: 0px;
          flex: 1;
        }
        
        .pie-chart {
          width: 120px;
          height: 120px;
          position: relative;
          margin: 0;
        }
        
        .pie-chart svg {
          width: 100%;
          height: 100%;
        }
        
        .attendance-stats {
          display: flex;
          flex-direction: column;
          gap: 15px;
          text-align: left;
          margin-left: 20px;
          justify-content: center;
          flex: 1;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 500;
          font-size: 14px;
        }
        
        .stat-present {
          color: #20B2AA;
        }
        
        .stat-absent {
          color: #FF7F50;
        }
        
        .status-list {
          text-align: left;
          list-style: none;
          padding: 0;
          margin: 0;
          color: #2085f6;
          flex: 1;
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
          align-self: center;
        }
        
        /* Attendance Table */
        .attendance-table {
          margin-top: 20px;
          margin-bottom: 20px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
          border: 1px solid #f0f0f0;
          box-sizing: border-box;
          height: 350px;
        }

        /* Scroll only the table rows; keep the rest of the page fixed */
        .attendance-table .table-scroll {
          max-height: calc(100vh - 500px);
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        .table-header {
          background: #f8f9fa;
          padding: 20px;
          border-bottom: none;
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
          font-weight: 400 !important; /* force regular */
          color: #191c24;
          border-bottom: 1px solid #e9ecef;
          font-size: 14px;
        }
        
        /* Force table headers to be regular weight */
        .attendance-table .table th {
          font-weight: 400 !important;
        }
        
        /* More specific selector for table headers */
        .attendance-table table thead th {
          font-weight: 400 !important;
          font-size: 14px;
          color: #191c24;
        }
        
        .table td {
          padding: 15px 20px;
          border-bottom: 1px solid #e9ecef;
          color: #555;
          font-size: 14px;
          font-weight: 500 !important; /* force medium */
        }
        
        /* Force table data to be medium weight */
        .attendance-table .table td {
          font-weight: 500 !important;
        }
        
        /* More specific selector for table data */
        .attendance-table table tbody td {
          font-weight: 500 !important;
          font-size: 14px;
          color: #555;
        }
        
        .table tr:hover {
          background: #f8f9fa;
        }
        
        .status-present {
          color: #328332 !important; /* green */
          font-weight: 500 !important;
        }
        
        .status-absent {
          color: #AD2C2C !important; /* red */
          font-weight: 500 !important;
        }
        
        /* Sticky table header styles */
        .sticky-table-header {
          position: sticky;
          top: 0;
          z-index: 10;
          background: #f8f9fa;
        }
        
        .scrollable-table-body {
          max-height: calc(91vh - 450px);
          overflow-y: auto;
          overflow-x: hidden;
          margin-right: 15px;
          padding-right: 5px;
          margin-bottom: 10px;
        }
        
        .scrollable-table-body::-webkit-scrollbar {
          width: 16px;
        }
        
        .scrollable-table-body::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 8px;
          margin: 2px;
        }
        
        .scrollable-table-body::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 8px;
          border: 2px solid #f1f1f1;
          min-height: 40px;
        }
        
        .scrollable-table-body::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        
        /* Ensure proper table alignment */
        .attendance-table table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        
        .attendance-table table th,
        .attendance-table table td {
          padding: 15px 20px;
          text-align: left;
          vertical-align: middle;
        }
        
        /* Equal column width distribution */
        .attendance-table table th:nth-child(1),
        .attendance-table table td:nth-child(1) {
          width: 25%;
        }
        
        .attendance-table table th:nth-child(2),
        .attendance-table table td:nth-child(2) {
          width: 25%;
        }
        
        .attendance-table table th:nth-child(3),
        .attendance-table table td:nth-child(3) {
          width: 25%;
        }
        
        .attendance-table table th:nth-child(4),
        .attendance-table table td:nth-child(4) {
          width: 25%;
        }
        
        /* Responsive */
        @media (max-width: 1200px) {
          .attendance-cards {
            grid-template-columns: 1fr;
            gap: 15px;
          }
        }

        /* Prevent layout shifts when dev tools open/close */
        * {
          box-sizing: border-box;
        }

        /* Ensure consistent viewport calculations */
        html {
          overflow-x: hidden;
          overflow-y: hidden; /* ensure no page scrollbar */
          width: 100%;
          height: 100%;
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
          
                      {/* ATTENDANCE CONTENT */}
            <div className="dashboard-area">
            
            {/* Attendance Cards */}
            <div className="attendance-cards">
              {/* Total Percentage Card */}
              <div className="attendance-card percentage-card">
                <h3>Total Percentage</h3>
                <img 
                  src={totalpercentagestudenticon} 
                  alt="Student Icon" 
                  style={{ 
                    width: '100px', 
                    height: '100px',
                    
                  }} 
                />
                <img 
                  src={totalpercentageicon} 
                  alt="Student Icon" 
                  style={{ 
                    width: '30px', 
                    height: '30px',
                    marginTop:'-60px',
                    marginLeft: '90px'
                    
                  }} 
                />
                <div className="percentage-value">55%</div>
              </div>
              

              {/* Attendance Card */}
              <div className="attendance-card">
                <h3>Attendance</h3>
                <div className="attendance-chart">
                  <div className="pie-chart">
                    <svg width="120" height="120" viewBox="0 0 120 120">
                      {/* Present Teal Green Pie (59%) */}
                      <circle
                        r="45"
                        cx="60"
                        cy="60"
                        fill="transparent"
                        stroke="#20B2AA"
                        strokeWidth="12"
                        strokeDasharray={`${(2 * Math.PI * 45 * 0.59)}, ${(2 * Math.PI * 45 * 0.41)}`}
                        strokeDashoffset="0"
                        transform="rotate(-90 60 60)"
                      />
                      {/* Absent Coral Red Pie on top (41%) */}
                      <circle
                        r="45"
                        cx="60"
                        cy="60"
                        fill="transparent"
                        stroke="#FF7F50"
                        strokeWidth="12"
                        strokeDasharray={`${(2 * Math.PI * 45 * 0.41)}, ${(2 * Math.PI * 45 * 0.59)}`}
                        strokeDashoffset={`-${2 * Math.PI * 45 * 0.59}`}
                        transform="rotate(-90 60 60)"
                      />
                    </svg>
                  </div>
                  <div className="attendance-stats">
                    <div className="stat-item stat-present">
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#20B2AA', borderRadius: '50%' }}></div>
                      <div>
                        <div style={{ color: '#20B2AA', fontWeight: 'bold', fontSize: '18px' }}>59</div>
                        <div style={{ fontSize: '14px', color: '#333' }}>Present</div>
                      </div>
                    </div>
                    <div className="stat-item stat-absent">
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#FF7F50', borderRadius: '50%' }}></div>
                      <div>
                        <div style={{ color: '#FF7F50', fontWeight: 'bold', fontSize: '18px' }}>41</div>
                        <div style={{ fontSize: '14px', color: '#333' }}>Absent</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Overall Status Card */}
              <div className="attendance-card overall-status-card">
                <svg className="star-icon" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#ffd700', width: '40px', height: '40px', marginBottom: '15px' }}>
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                </svg>
                <h3 style={{ textAlign: 'center' }}>Overall Status</h3>
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
                <thead className="sticky-table-header">
                  <tr>
                    <th style={{ fontWeight: 400, fontSize: '14px', color: '#949494' }}>S.No</th>
                    <th style={{ fontWeight: 400, fontSize: '14px', color: '#949494' }}>Date</th>
                    <th style={{ fontWeight: 400, fontSize: '14px', color: '#949494' }}>Type</th>
                    <th style={{ fontWeight: 400, fontSize: '14px', color: '#949494' }}>Status</th>
                  </tr>
                </thead>
              </table>
              <div className="scrollable-table-body">
                <table className="table">
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>1</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>31/07/2025</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>Training</td>
                      <td className="status-present" style={{ fontWeight: 500, fontSize: '14px' }}>Present</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>2</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>1/08/2025</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>Company Drive</td>
                      <td className="status-present" style={{ fontWeight: 500, fontSize: '14px' }}>Present</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>3</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>2/08/2025</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>Workshop</td>
                      <td className="status-absent" style={{ fontWeight: 500, fontSize: '14px' }}>Absent</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>4</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>3/08/2025</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>Interview Prep</td>
                      <td className="status-present" style={{ fontWeight: 500, fontSize: '14px' }}>Present</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>5</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>4/08/2025</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>Mock Interview</td>
                      <td className="status-present" style={{ fontWeight: 500, fontSize: '14px' }}>Present</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>6</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>5/08/2025</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>Career Counseling</td>
                      <td className="status-absent" style={{ fontWeight: 500, fontSize: '14px' }}>Absent</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>7</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>6/08/2025</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>Placement Drive</td>
                      <td className="status-present" style={{ fontWeight: 500, fontSize: '14px' }}>Present</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>8</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>7/08/2025</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>Resume Review</td>
                      <td className="status-present" style={{ fontWeight: 500, fontSize: '14px' }}>Present</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>9</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>8/08/2025</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>Group Discussion</td>
                      <td className="status-absent" style={{ fontWeight: 500, fontSize: '14px' }}>Absent</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>10</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>9/08/2025</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>Final Interview</td>
                      <td className="status-present" style={{ fontWeight: 500, fontSize: '14px' }}>Present</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>11</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>10/08/2025</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>Technical Round</td>
                      <td className="status-present" style={{ fontWeight: 500, fontSize: '14px' }}>Present</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>12</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>11/08/2025</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>HR Interview</td>
                      <td className="status-absent" style={{ fontWeight: 500, fontSize: '14px' }}>Absent</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>13</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>12/08/2025</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>Aptitude Test</td>
                      <td className="status-present" style={{ fontWeight: 500, fontSize: '14px' }}>Present</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>14</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>13/08/2025</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>Coding Test</td>
                      <td className="status-present" style={{ fontWeight: 500, fontSize: '14px' }}>Present</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>15</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>14/08/2025</td>
                      <td style={{ fontWeight: 500, fontSize: '14px', color: '#000000' }}>Final Selection</td>
                      <td className="status-present" style={{ fontWeight: 500, fontSize: '14px' }}>Present</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Attendance;



