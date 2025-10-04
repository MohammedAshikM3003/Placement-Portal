<<<<<<< HEAD
import React, { useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import "./Attendance.css";
import totalpercentagestudenticon from './assets/totalpercentagestudenticon.png';
import totalpercentageicon from './assets/totalpercentageicon.png';

function Attendance({ onLogout, onViewChange }) { // Removed currentView from props
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const attendancePercentage = 100;
    const absentPercentage = 100 - attendancePercentage;

    const getStatusDetails = (percentage) => {
        if (percentage > 90) return { stars: 5, color: 'gold', label: 'Excellent' };
        if (percentage >= 80) return { stars: 4, color: '#B0C4DE', label: 'Good' };
        if (percentage >= 70) return { stars: 3, color: '#CD7F32', label: 'Average' };
        if (percentage >= 60) return { stars: 2, color: '#dc3545', label: 'Needs Improvement' };
        return { stars: 1, color: 'black', label: 'Very Low' };
=======
import React from "react";
import Adminicon from './assets/Adminicon.png';
import CompanySideBarIcon from './assets/CompanySideBarIcon.svg';
import totalpercentagestudenticon from './assets/totalpercentagestudenticon.png'
import totalpercentageicon from './assets/totalpercentageicon.png'

const sidebarItems = [
    { icon: require('./assets/DashboardSideBarIcon.png'), text: 'Dashboard', view: 'dashboard' },
    { icon: require('./assets/ResumeSideBarIcon.png'), text: 'Resume', view: 'resume' },
    { icon: require('./assets/AttendanceSideBarIcon.png'), text: 'Attendance', view: 'attendance' },
    { icon: require('./assets/AchievementsSideBarIcon.png'), text: 'Achievements', view: 'achievements' },
    { icon: CompanySideBarIcon, text: 'Company', view: 'company' },
];

function Attendance({ onLogout, onViewChange, currentView }) {

    // SINGLE SOURCE OF TRUTH: Change this value to update all cards
    const attendancePercentage = 100; 

    // --- All other values are now derived automatically ---

    const absentPercentage = 100 - attendancePercentage;

    const getStatusDetails = (percentage) => {
        if (percentage > 90) {
            return { stars: 5, color: 'gold', label: 'Excellent' };
        } else if (percentage >= 80) {
            return { stars: 4, color: '#B0C4DE', label: 'Good' };
        } else if (percentage >= 70) {
            return { stars: 3, color: '#CD7F32', label: 'Average' };
        } else if (percentage >= 60) {
            return { stars: 2, color: '#dc3545', label: 'Needs Improvement' };
        } else {
            return { stars: 1, color: 'black', label: 'Very Low' };
        }
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
    };

    const statusDetails = getStatusDetails(attendancePercentage);

<<<<<<< HEAD
    const pieChartStyle = {
        background: `conic-gradient(#f86c6b 0% ${absentPercentage}%, #2dbda8 ${absentPercentage}% 100%)`
    };

    const labelRadius = 35;
=======
    // Dynamic style for the pie chart gradient
    const pieChartStyle = {
        background: `conic-gradient(#f86c6b 0% ${absentPercentage}%, #2dbda8 ${absentPercentage}% 100%)`
    };
    
    // Dynamic positioning for pie chart labels
    const labelRadius = 35; // Distance of labels from the center
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
    const presentAngle = (absentPercentage / 100 + (attendancePercentage / 100) / 2) * 2 * Math.PI - (Math.PI / 2);
    const absentAngle = ((absentPercentage / 100) / 2) * 2 * Math.PI - (Math.PI / 2);

    const presentLabelStyle = {
        top: `calc(50% + ${Math.sin(presentAngle) * labelRadius}px)`,
        left: `calc(50% + ${Math.cos(presentAngle) * labelRadius}px)`,
    };
<<<<<<< HEAD
    const absentLabelStyle = {
        top: `calc(50% + ${Math.sin(absentAngle) * labelRadius}px)`,
        left: `calc(50% + ${Math.cos(absentAngle) * labelRadius}px)`,
    };
    
    // This handler calls the main navigation function and closes the sidebar
    const handleViewChange = (view) => {
        onViewChange(view);
        setIsSidebarOpen(false);
    };

    return (
        <div className="container">
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className="main">
                <Sidebar 
                    isOpen={isSidebarOpen} 
                    onLogout={onLogout} 
                    onViewChange={handleViewChange} 
                    currentView={'attendance'} // Hardcode 'attendance' for highlighting
                />
                <div className={`attendance-area dashboard-area`}>
                    <div className="attendance-cards">
                        <div className="attendance-card percentage-card">
                            <h3>Total Percentage</h3>
                            <img src={totalpercentagestudenticon} alt="Student Icon" style={{ width: '100px', height: '100px' }} />
                            <img src={totalpercentageicon} alt="Percentage Icon" style={{ width: '30px', height: '30px', marginTop: '-60px', marginLeft: '90px' }} />
                            <div className="percentage-value" style={{ color: statusDetails.color }}>
                                {attendancePercentage}%
                            </div>
                        </div>

                        <div className="attendance-card">
                            <h3>Attendance</h3>
                            <div className="attendance-chart-container">
                                <div className="pie-chart-graphic" style={pieChartStyle}>
                                    {absentPercentage > 0 && <div className="pie-label-absent" style={absentLabelStyle}>Absent<br />{absentPercentage}</div>}
                                    {attendancePercentage > 0 && <div className="pie-label-present" style={presentLabelStyle}>Present<br />{attendancePercentage}</div>}
                                </div>
                                <div className="attendance-legend">
                                    <div className="legend-item">
                                        <span className="legend-text">Present</span>
                                        <span className="legend-value-present">{attendancePercentage}</span>
                                    </div>
                                    <div className="legend-item">
                                        <span className="legend-text">Absent</span>
                                        <span className="legend-value-absent">{absentPercentage}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="attendance-card overall-status-card">
                            <h3>Overall Status</h3>
                            <div className="stars-display" style={{ '--star-color': statusDetails.color }}>
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <svg 
                                        key={index}
                                        className={index < statusDetails.stars ? 'active-star' : 'inactive-star'}
                                        viewBox="0 0 24 24" 
                                        style={{ width: '40px', height: '40px' }}
                                    >
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                ))}
                            </div>
                            <p style={{ color: statusDetails.color, fontSize: '1.2em', fontWeight: 'bold', marginTop: '15px' }}>
                                {statusDetails.label}
                            </p>
                        </div>
                    </div>
                    <div className="attendance-table">
                        <div className="table-header"><h2>ATTENDANCE DETAILS</h2></div>
                        <div className="table-container scrollable-table-body">
                            <table className="table">
                                <thead>
                                    <tr><th>S.No</th><th>Date</th><th>Type</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    {[...Array(15).keys()].map(i => (
                                        <tr key={i}>
                                            <td>{i + 1}</td>
                                            <td>{`${i + 1 < 10 ? '0' : ''}${i + 1}/08/2025`}</td>
                                            <td>Training Event</td>
                                            <td>
                                                <span className={`status-pill ${i % 3 === 2 ? 'status-absent' : 'status-present'}`}>
                                                    {i % 3 === 2 ? 'Absent' : 'Present'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
             {isSidebarOpen && <div className="overlay" onClick={() => setIsSidebarOpen(false)}></div>}
        </div>
    );
=======
     const absentLabelStyle = {
        top: `calc(50% + ${Math.sin(absentAngle) * labelRadius}px)`,
        left: `calc(50% + ${Math.cos(absentAngle) * labelRadius}px)`,
    };


  return (
    <>
      <style>{`
        /* Paste the entire CSS from dashboard.js here */
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&display=swap');
        html{overflow:hidden;}body{background:#f8f8fb;margin:0;padding:0;font-family:'Poppins',Arial,sans-serif;overflow:hidden;}.container{font-family:'Poppins',Arial,sans-serif;background:#f8f8fb;height:100vh;}.navbar{display:flex;align-items:center;background:#2085f6;color:#fff;padding:15px 32px 15px 26px;justify-content:space-between;box-shadow:0 2px 4px rgba(0,0,0,0.1);position:fixed;top:0;left:0;right:0;z-index:1000}.navbar .left{display:flex;align-items:center}.portal-logo{height:35px;width:35px;margin-right:18px;display:flex;align-items:center;justify-content:center}.portal-logo img{height:30px;width:40px;filter:brightness(0) invert(1)}.portal-name{font-size:1.48rem;font-weight:bold;letter-spacing:0.5px}.navbar .menu{display:flex;gap:35px;font-size:1.06rem}.navbar .menu span{color:#fff;text-decoration:none;margin:0 5px;font-weight:500;position:relative;padding:8px 12px;border-radius:6px;transition:background 0.2s;display:flex;align-items:center;gap:5px; cursor: pointer;}.navbar .menu span:hover{background:rgba(255,255,255,0.1)}.main{display:flex;min-height:calc(100vh - 65px);margin-top:65px}.sidebar{background:#fff;width:230px;height:calc(100vh - 65px);box-shadow:2px 0 12px #e1e6ef3a;display:flex;flex-direction:column;position:fixed;left:0;top:65px;overflow-y:auto;z-index:999}.sidebar .user-info{text-align:center;padding:25px 20px 20px 20px;font-size:1rem;color:#555;display:flex;flex-direction:column;align-items:center;position:relative;flex-shrink:0;margin-top:15px}.sidebar .user-details img{width:50px;height:40px;margin-right:15px;flex-shrink:0}.sidebar .user-details{margin-top:8px;font-weight:600;font-size:1.1em;color:#191c24;display:flex;align-items:center;justify-content:flex-start;gap:0}.sidebar .user-text{display:flex;flex-direction:column;align-items:flex-start;flex:1}.sidebar .user-year{color:#777;font-size:0.9em;font-weight:400;margin-top:2px;display:block}.sidebar .menu-toggle{position:absolute;top:20px;right:20px;background:none;border:none;color:#999;font-size:1.2em;cursor:pointer;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:4px;transition:background 0.2s;margin-top:40px}.sidebar .menu-toggle:hover{background:#f0f0f0}.sidebar .nav{flex:1;display:flex;flex-direction:column;padding:0px 0;justify-content:flex-start;gap:0;min-height:0}.sidebar .nav-section{display:flex;flex-direction:column;gap:8px;flex-shrink:0}.sidebar .nav-item{display:flex;align-items:center;font-size:1.27rem;padding:18px 25px;color:#000000;text-decoration:none;cursor:pointer;transition:all 0.18s;gap:15px;border-left:4px solid transparent;margin:3px 0;margin-top:10px}.sidebar .nav-item.selected{background:#F8F8F8;border-left:4px solid #197AFF;color:#197AFF;font-weight:600}.sidebar .nav-item.selected img{filter:brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%)}.sidebar .nav-item:hover:not(.selected){background:#f0f6ff;border-left:4px solid #197AFF;color:#197AFF}.sidebar .nav-item img{width:20px;height:20px;transition:transform 0.2s;filter:brightness(0) saturate(100%) invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0%) contrast(100%)}.sidebar .nav-item:hover img{transform:scale(1.1)}.sidebar .nav-item:hover:not(.selected) img{filter:brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%)}.sidebar .nav-divider{height:1px;width:228px;background:#e0e0e0;margin:8px 2px;border-top:1px dotted #ccc;flex-shrink:0;margin-top:12px}.sidebar .logout-btn{background:#D23B42;color:#fff;margin:25px 25px 25px 25px;padding:10px 0;border:none;border-radius:60px;font-size:1.3rem;font-weight:500;letter-spacing:0.2px;cursor:pointer;transition:background 0.2s;display:flex;align-items:center;justify-content:center;flex-shrink:0;width:50%;margin-left:50px;margin-bottom:10px}.sidebar .logout-btn:hover{background:#d55a6a}.dashboard-area{flex:1;height:calc(100vh - 65px);padding:25px;background:#fff;margin-left:230px;overflow-y:auto;overflow-x:hidden;position:relative;box-sizing: border-box;}

        /* Attendance specific styles */
        .attendance-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:25px;margin-bottom:25px}.attendance-card{background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.07);padding: 35px;border: 2px solid #cccccc;display:flex;flex-direction:column; transition: all 0.3s ease;}.attendance-card:hover{border-color: #2085f6; box-shadow: 0 4px 12px rgba(32, 133, 246, 0.2);}.percentage-card{align-items:center;text-align:center}.attendance-card h3{margin:0 0 15px;color:#191c24;font-size:1.2em;font-weight:600}.percentage-value{font-size:3em;font-weight:bold;margin-top:24.3px;margin-left: 0%}.attendance-chart{display:flex;align-items:center;justify-content:space-around;flex:1}.pie-chart{width:120px;height:120px}.attendance-stats{display:flex;flex-direction:column;gap:20px}.stat-item{display:flex;align-items:center;gap:12px;font-size:14px}.overall-status-card{text-align:center;}.status-list{list-style:none;padding:0;margin:15px 0 0;text-align:left}.status-list li{margin-bottom:10px;font-size:0.95em;color:#555}.attendance-table{background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.07);overflow:hidden;border:1px solid #f0f0f0;height:calc(100vh - 400px);display:flex;flex-direction:column}.table-header{padding:20px;border-bottom:1px solid #e9ecef}.table-header h2{margin:0;font-size:1.3em}.table-container{overflow-y:auto;flex:1}.table{width:100%;border-collapse:collapse}.table th,.table td{padding:15px 20px;border-bottom:1px solid #e9ecef}.table th{background:#f8f9fa;font-weight:600;color:#333;position:sticky;top:0;z-index:1;font-size:16px;text-align:center;}.table td{font-size:18px;text-align:center;}.table tbody tr{transition:background-color 0.2s ease;}.table tbody tr:hover{background-color:#f0f6ff;cursor:pointer;}
        .scrollable-table-body::-webkit-scrollbar{width:8px}.scrollable-table-body::-webkit-scrollbar-track{background:#f1f1f1}.scrollable-table-body::-webkit-scrollbar-thumb{background:#2085f6;border-radius:4px}.scrollable-table-body::-webkit-scrollbar-thumb:hover{background:#a0c8f0}
        
        /* Styles for table status pills */
        .status-pill { padding: 5px 15px; border-radius: 16px; font-size: 14px; display: inline-block; font-weight: 600; }
        .status-present { color: #28a745; background-color: #e9f7ef; }
        .status-absent { color: #dc3545; background-color: #fceeee; }

        /* Styles for the new attendance chart */
        .attendance-chart-container{display:flex;align-items:center;justify-content:space-around;flex:1}
        .pie-chart-graphic{position:relative;width:140px;height:140px;border-radius:50%;}
        .pie-label-absent,.pie-label-present{position:absolute;color:#fff;text-align:center;font-size:14px;font-weight:700;line-height:1.2;transform:translate(-50%,-50%);}
        .attendance-legend{display:flex;flex-direction:column;gap:20px;font-size:1.1em}
        .legend-item{display:flex;flex-direction:column}
        .legend-text{color:#333}
        .legend-value-present{color:#2dbda8;font-weight:700;font-size:1.5em}
        .legend-value-absent{color:#f86c6b;font-weight:700;font-size:1.5em}
        
        /* Star Rating Styles */
        .stars-display { display: flex; justify-content: center; align-items: center; gap: 5px; margin: auto 0; flex-direction: row-reverse; }
        .stars-display svg { fill: #e0e0e0; transition: fill 0.3s ease-in-out; }
        .overall-status-card:hover .stars-display .active-star { fill: var(--star-color); }
      `}</style>
      
      <div className="container">
        <div className="navbar">
            <div className="left">
                <span className="portal-logo"><img src={Adminicon} alt="Portal Logo" /></span>
                <span className="portal-name">Placement Portal</span>
            </div>
            <div className="menu">
                <span><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>Home</span>
                <span><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>About</span>
                <span><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>Features</span>
                <span><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>Contact</span>
            </div>
        </div>

        <div className="main">
          <div className="sidebar">
              <div className="user-info">
                  <div className="user-details">
                      <img src={Adminicon} alt="Admin" style={{ filter: "brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%)" }} />
                      <div className="user-text"><span>Student</span><span className="user-year">Final Year</span></div>
                      <img src={Adminicon} alt="Admin" style={{ width: "16px", height: "16px", marginLeft: "auto" }} />
                  </div>
              </div>
              <button className="menu-toggle">•••</button>
              <nav className="nav">
                  <div className="nav-section">
                      {sidebarItems.map((item) => (
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
              <button className="logout-btn" onClick={onLogout}>Logout</button>
          </div>
          
          <div className="dashboard-area">
            <div className="attendance-cards">
              <div className="attendance-card percentage-card">
                <h3>Total Percentage</h3>
                <img src={totalpercentagestudenticon} alt="Student Icon" style={{ width: '100px', height: '100px' }} />
                <img src={totalpercentageicon} alt="Percentage Icon" style={{ width: '30px', height: '30px', marginTop:'-60px', marginLeft: '90px' }} />
                <div 
                  className="percentage-value" 
                  style={{ color: statusDetails.color }}
                >
                  {attendancePercentage}%
                </div>
              </div>

              <div className="attendance-card">
                <h3>Attendance</h3>
                <div className="attendance-chart-container">
                    <div className="pie-chart-graphic" style={pieChartStyle}>
                        {absentPercentage > 0 && <div className="pie-label-absent" style={absentLabelStyle}>Absent<br />{absentPercentage}</div>}
                        {attendancePercentage > 0 && <div className="pie-label-present" style={presentLabelStyle}>Present<br />{attendancePercentage}</div>}
                    </div>
                    <div className="attendance-legend">
                        <div className="legend-item">
                            <span className="legend-text">Present</span>
                            <span className="legend-value-present">{attendancePercentage}</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-text">Absent</span>
                            <span className="legend-value-absent">{absentPercentage}</span>
                        </div>
                    </div>
                </div>
              </div>

              <div className="attendance-card overall-status-card">
                <h3>Overall Status</h3>
                <div className="stars-display" style={{ '--star-color': statusDetails.color }}>
                    {Array.from({ length: 5 }).map((_, index) => (
                        <svg 
                            key={index}
                            className={index < statusDetails.stars ? 'active-star' : 'inactive-star'}
                            viewBox="0 0 24 24" 
                            style={{ 
                                width: '40px', 
                                height: '40px'
                            }}
                        >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                    ))}
                </div>
                <p style={{ color: statusDetails.color, fontSize: '1.2em', fontWeight: 'bold', marginTop: '15px' }}>
                    {statusDetails.label}
                </p>
              </div>
            </div>

            <div className="attendance-table">
              <div className="table-header"><h2>ATTENDANCE DETAILS</h2></div>
              <div className="table-container scrollable-table-body">
                <table className="table">
                  <thead>
                    <tr><th>S.No</th><th>Date</th><th>Type</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {[...Array(15).keys()].map(i => (
                      <tr key={i}>
                        <td>{i+1}</td>
                        <td>{`${i+1 < 10 ? '0' : ''}${i+1}/08/2025`}</td>
                        <td>Training Event</td>
                        <td>
                          <span className={`status-pill ${i % 3 === 2 ? 'status-absent' : 'status-present'}`}>
                            {i % 3 === 2 ? 'Absent' : 'Present'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
}

export default Attendance;