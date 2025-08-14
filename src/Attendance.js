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

  return (
    <>
      <style>{`
        /* Paste the entire CSS from dashboard.js here */
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&display=swap');
        body{background:#f8f8fb;margin:0;padding:0;font-family:'Poppins',Arial,sans-serif}.container{font-family:'Poppins',Arial,sans-serif;background:#f8f8fb;min-height:100vh}.navbar{display:flex;align-items:center;background:#2085f6;color:#fff;padding:15px 32px 15px 26px;justify-content:space-between;box-shadow:0 2px 4px rgba(0,0,0,0.1);position:fixed;top:0;left:0;right:0;z-index:1000}.navbar .left{display:flex;align-items:center}.portal-logo{height:35px;width:35px;margin-right:18px;display:flex;align-items:center;justify-content:center}.portal-logo img{height:30px;width:40px;filter:brightness(0) invert(1)}.portal-name{font-size:1.48rem;font-weight:bold;letter-spacing:0.5px}.navbar .menu{display:flex;gap:35px;font-size:1.06rem}.navbar .menu span{color:#fff;text-decoration:none;margin:0 5px;font-weight:500;position:relative;padding:8px 12px;border-radius:6px;transition:background 0.2s;display:flex;align-items:center;gap:5px; cursor: pointer;}.navbar .menu span:hover{background:rgba(255,255,255,0.1)}.main{display:flex;min-height:calc(100vh - 65px);margin-top:65px}.sidebar{background:#fff;width:230px;height:calc(100vh - 65px);box-shadow:2px 0 12px #e1e6ef3a;display:flex;flex-direction:column;position:fixed;left:0;top:65px;overflow-y:auto;z-index:999}.sidebar .user-info{text-align:center;padding:25px 20px 20px 20px;font-size:1rem;color:#555;display:flex;flex-direction:column;align-items:center;position:relative;flex-shrink:0;margin-top:15px}.sidebar .user-details img{width:50px;height:40px;margin-right:15px;flex-shrink:0}.sidebar .user-details{margin-top:8px;font-weight:600;font-size:1.1em;color:#191c24;display:flex;align-items:center;justify-content:flex-start;gap:0}.sidebar .user-text{display:flex;flex-direction:column;align-items:flex-start;flex:1}.sidebar .user-year{color:#777;font-size:0.9em;font-weight:400;margin-top:2px;display:block}.sidebar .menu-toggle{position:absolute;top:20px;right:20px;background:none;border:none;color:#999;font-size:1.2em;cursor:pointer;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:4px;transition:background 0.2s;margin-top:40px}.sidebar .menu-toggle:hover{background:#f0f0f0}.sidebar .nav{flex:1;display:flex;flex-direction:column;padding:0px 0;justify-content:flex-start;gap:0;min-height:0}.sidebar .nav-section{display:flex;flex-direction:column;gap:8px;flex-shrink:0}.sidebar .nav-item{display:flex;align-items:center;font-size:1.27rem;padding:18px 25px;color:#000000;text-decoration:none;cursor:pointer;transition:all 0.18s;gap:15px;border-left:4px solid transparent;margin:3px 0;margin-top:10px}.sidebar .nav-item.selected{background:#F8F8F8;border-left:4px solid #197AFF;color:#197AFF;font-weight:600}.sidebar .nav-item.selected img{filter:brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%)}.sidebar .nav-item:hover:not(.selected){background:#f0f6ff;border-left:4px solid #197AFF;color:#197AFF}.sidebar .nav-item img{width:20px;height:20px;transition:transform 0.2s;filter:brightness(0) saturate(100%) invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0%) contrast(100%)}.sidebar .nav-item:hover img{transform:scale(1.1)}.sidebar .nav-item:hover:not(.selected) img{filter:brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%)}.sidebar .nav-divider{height:1px;width:228px;background:#e0e0e0;margin:8px 2px;border-top:1px dotted #ccc;flex-shrink:0;margin-top:12px}.sidebar .logout-btn{background:#D23B42;color:#fff;margin:25px 25px 25px 25px;padding:10px 0;border:none;border-radius:60px;font-size:1.3rem;font-weight:500;letter-spacing:0.2px;cursor:pointer;transition:background 0.2s;display:flex;align-items:center;justify-content:center;flex-shrink:0;width:50%;margin-left:50px;margin-bottom:10px}.sidebar .logout-btn:hover{background:#d55a6a}.dashboard-area{flex:1;height:calc(100vh - 65px);padding:25px;background:#fff;margin-left:230px;overflow-y:auto;overflow-x:hidden;position:relative}

        /* Attendance specific styles */
        .attendance-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:25px;margin-bottom:25px}.attendance-card{background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.07);padding:25px;border:1px solid #f0f0f0;display:flex;flex-direction:column}.percentage-card{align-items:center;text-align:center}.attendance-card h3{margin:0 0 15px;color:#191c24;font-size:1.2em;font-weight:600}.percentage-value{font-size:3em;font-weight:bold;color:#2085f6;margin-top:10px}.attendance-chart{display:flex;align-items:center;justify-content:space-around;flex:1}.pie-chart{width:120px;height:120px}.attendance-stats{display:flex;flex-direction:column;gap:20px}.stat-item{display:flex;align-items:center;gap:12px;font-size:14px}.stat-present .value{color:#20B2AA;font-weight:bold;font-size:18px}.stat-absent .value{color:#FF7F50;font-weight:bold;font-size:18px}.overall-status-card{text-align:center}.status-list{list-style:none;padding:0;margin:15px 0 0;text-align:left}.status-list li{margin-bottom:10px;font-size:0.95em;color:#555}.attendance-table{background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.07);overflow:hidden;border:1px solid #f0f0f0;height:calc(100vh - 450px);display:flex;flex-direction:column}.table-header{padding:20px;border-bottom:1px solid #e9ecef}.table-header h2{margin:0;font-size:1.3em}.table-container{overflow-y:auto;flex:1}.table{width:100%;border-collapse:collapse}.table th,.table td{padding:15px 20px;text-align:left;font-size:14px;border-bottom:1px solid #e9ecef}.table th{background:#f8f9fa;font-weight:600;color:#333}.status-present{color:#28a745;font-weight:bold}.status-absent{color:#dc3545;font-weight:bold}
        .scrollable-table-body::-webkit-scrollbar{width:8px}.scrollable-table-body::-webkit-scrollbar-track{background:#f1f1f1}.scrollable-table-body::-webkit-scrollbar-thumb{background:#888;border-radius:4px}.scrollable-table-body::-webkit-scrollbar-thumb:hover{background:#555}
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
                <div className="percentage-value">55%</div>
              </div>

              <div className="attendance-card">
                <h3>Attendance</h3>
                <div className="attendance-chart">
                  <div className="pie-chart">
                    <svg viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="transparent" stroke="#FF7F50" strokeWidth="10" />
                      <circle cx="50" cy="50" r="45" fill="transparent" stroke="#20B2AA" strokeWidth="10" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.59)} transform="rotate(-90 50 50)" />
                    </svg>
                  </div>
                  <div className="attendance-stats">
                    <div className="stat-item stat-present"><div style={{ width:12, height:12, backgroundColor:'#20B2AA', borderRadius:'50%' }}></div><div><div className="value">59</div><div>Present</div></div></div>
                    <div className="stat-item stat-absent"><div style={{ width:12, height:12, backgroundColor:'#FF7F50', borderRadius:'50%' }}></div><div><div className="value">41</div><div>Absent</div></div></div>
                  </div>
                </div>
              </div>

              <div className="attendance-card overall-status-card">
                <svg viewBox="0 0 24 24" fill="currentColor" style={{ color: '#ffd700', width: '40px', height: '40px', marginBottom: '15px' }}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                <h3>Overall Status</h3>
                <ul className="status-list">
                  <li>1. Good (Above 90%)</li>
                  <li>2. Average (80-90%)</li>
                  <li>3. Too Low (Below 80%)</li>
                </ul>
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
                        <td className={i % 3 === 2 ? 'status-absent' : 'status-present'}>{i % 3 === 2 ? 'Absent' : 'Present'}</td>
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
}

export default Attendance;