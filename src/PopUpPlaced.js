import React from "react";
import Adminicon from './assets/Adminicon.png';
import CompanySideBarIcon from "./assets/CompanySideBarIcon.svg";
import { FaCheckCircle } from "react-icons/fa";

const sidebarItems = [
  { icon: require('./assets/DashboardSideBarIcon.png'), text: 'Dashboard', view: 'dashboard' },
  { icon: require('./assets/ResumeSideBarIcon.png'), text: 'Resume', view: 'resume' },
  { icon: require('./assets/AttendanceSideBarIcon.png'), text: 'Attendance', view: 'attendance' },
  { icon: require('./assets/AchievementsSideBarIcon.png'), text: 'Achievements', view: 'achievements' },
  { icon: CompanySideBarIcon, text: 'Company', view: 'company' },
];

const rounds = [
  { name: "Round 1 (Aptitude)", status: "Passed", icon: <FaCheckCircle color="#197AFF" size={28} />, statusColor: "#197AFF", statusText: "Passed" },
  { name: "Round 2 (Technical)", status: "Passed", icon: <FaCheckCircle color="#197AFF" size={28} />, statusColor: "#197AFF", statusText: "Passed" },
  { name: "Round 3 (Group Discussion)", status: "Passed", icon: <FaCheckCircle color="#197AFF" size={28} />, statusColor: "#197AFF", statusText: "Passed" },
  { name: "Round 4 (Managerial)", status: "Passed", icon: <FaCheckCircle color="#197AFF" size={28} />, statusColor: "#197AFF", statusText: "Passed" },
  { name: "Round 5 (HR)", status: "Passed", icon: <FaCheckCircle color="#61D357" size={28} />, statusColor: "#61D357", statusText: "Passed" }
];

export default function PopUpPlaced({ onBack, onLogout, onViewChange, currentView }) {
  return (
    <>
      <style>{`
        /* Paste the entire CSS from dashboard.js here */
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&display=swap');
        body{background:#f8f8fb;margin:0;padding:0;font-family:'Poppins',Arial,sans-serif}.container{font-family:'Poppins',Arial,sans-serif;background:#f8f8fb;min-height:100vh}.navbar{display:flex;align-items:center;background:#2085f6;color:#fff;padding:15px 32px 15px 26px;justify-content:space-between;box-shadow:0 2px 4px rgba(0,0,0,0.1);position:fixed;top:0;left:0;right:0;z-index:1000}.navbar .left{display:flex;align-items:center}.portal-logo{height:35px;width:35px;margin-right:18px;display:flex;align-items:center;justify-content:center}.portal-logo img{height:30px;width:40px;filter:brightness(0) invert(1)}.portal-name{font-size:1.48rem;font-weight:bold;letter-spacing:0.5px}.navbar .menu{display:flex;gap:35px;font-size:1.06rem}.navbar .menu span{color:#fff;text-decoration:none;margin:0 5px;font-weight:500;position:relative;padding:8px 12px;border-radius:6px;transition:background 0.2s;display:flex;align-items:center;gap:5px}.navbar .menu span:hover{background:rgba(255,255,255,0.1)}.main{display:flex;min-height:calc(100vh - 65px);margin-top:65px}.sidebar{background:#fff;width:230px;height:calc(100vh - 65px);box-shadow:2px 0 12px #e1e6ef3a;display:flex;flex-direction:column;position:fixed;left:0;top:65px;overflow-y:auto;z-index:999}.sidebar .user-info{text-align:center;padding:25px 20px 20px 20px;font-size:1rem;color:#555;display:flex;flex-direction:column;align-items:center;position:relative;flex-shrink:0;margin-top:15px}.sidebar .user-details img{width:50px;height:40px;margin-right:15px;flex-shrink:0}.sidebar .user-details{margin-top:8px;font-weight:600;font-size:1.1em;color:#191c24;display:flex;align-items:center;justify-content:flex-start;gap:0}.sidebar .user-text{display:flex;flex-direction:column;align-items:flex-start;flex:1}.sidebar .user-year{color:#777;font-size:0.9em;font-weight:400;margin-top:2px;display:block}.sidebar .menu-toggle{position:absolute;top:20px;right:20px;background:none;border:none;color:#999;font-size:1.2em;cursor:pointer;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:4px;transition:background 0.2s;margin-top:40px}.sidebar .menu-toggle:hover{background:#f0f0f0}.sidebar .nav{flex:1;display:flex;flex-direction:column;padding:0px 0;justify-content:flex-start;gap:0;min-height:0}.sidebar .nav-section{display:flex;flex-direction:column;gap:8px;flex-shrink:0}.sidebar .nav-item{display:flex;align-items:center;font-size:1.27rem;padding:18px 25px;color:#000000;text-decoration:none;cursor:pointer;transition:all 0.18s;gap:15px;border-left:4px solid transparent;margin:3px 0;margin-top:10px}.sidebar .nav-item.selected{background:#F8F8F8;border-left:4px solid #197AFF;color:#197AFF;font-weight:600}.sidebar .nav-item.selected img{filter:brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%)}.sidebar .nav-item:hover:not(.selected){background:#f0f6ff;border-left:4px solid #197AFF;color:#197AFF}.sidebar .nav-item img{width:20px;height:20px;transition:transform 0.2s;filter:brightness(0) saturate(100%) invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0%) contrast(100%)}.sidebar .nav-item:hover img{transform:scale(1.1)}.sidebar .nav-item:hover:not(.selected) img{filter:brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%)}.sidebar .nav-divider{height:1px;width:228px;background:#e0e0e0;margin:8px 2px;border-top:1px dotted #ccc;flex-shrink:0;margin-top:12px}.sidebar .logout-btn{background:#D23B42;color:#fff;margin:25px 25px 25px 25px;padding:10px 0;border:none;border-radius:60px;font-size:1.3rem;font-weight:500;letter-spacing:0.2px;cursor:pointer;transition:background 0.2s;display:flex;align-items:center;justify-content:center;flex-shrink:0;width:50%;margin-left:50px;margin-bottom:10px}.sidebar .logout-btn:hover{background:#d55a6a}.dashboard-area{flex:1;height:calc(100vh - 65px);padding:25px;background:#fff;margin-left:230px;overflow-y:auto;overflow-x:hidden;position:relative}
        .scroll-rounds::-webkit-scrollbar { width: 8px; } .scroll-rounds::-webkit-scrollbar-thumb { background: #e0e7ef; border-radius: 6px; } .scroll-rounds::-webkit-scrollbar-track { background: transparent; }
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
            <h2 style={{ fontWeight: 800, fontSize: "2rem", marginBottom: 20, marginLeft: 5 }}>Company's Placement</h2>
            <div style={{ background: "#fff", padding: "36px", borderRadius: 16, boxShadow: "0 4px 24px #e9e6ef" }}>
                <div>
                  <span style={{ fontSize: 25, color: "#888" }}>Overall Status : </span>
                  <span style={{ fontSize: 27, color: "#61D357", fontWeight: 700 }}>Placed</span>
                </div>
                <div style={{ marginTop: 20 }}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h3 style={{ fontWeight: 700, fontSize: "1.7rem", marginBottom: 12 }}>Recruitment Journey</h3>
                    <button onClick={onBack} style={{ background: "#D23B42", color: "#fff", border: "none", borderRadius: 12, padding: "8px 32px", fontWeight: 600, fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <span style={{ fontSize: 18, marginRight: 6 }}>Back</span><span style={{ fontSize: 22 }}>↩</span>
                    </button>
                  </div>
                  <div style={{ marginTop: 28, maxHeight: 365, overflowY: "auto", paddingRight: 4 }} className="scroll-rounds">
                    {rounds.map((round) => (
                      <div key={round.name} style={{ display: "flex", alignItems: "center", background: "#f6f7fa", borderRadius: 16, marginBottom: 18, padding: "18px 30px" }}>
                        <div style={{ marginRight: 28 }}>{round.icon}</div>
                        <div style={{ flex: 1, fontSize: "1.07rem", fontWeight: 600 }}>{round.name}</div>
                        <div style={{ fontSize: 14, color: "#888" }}>Status: <span style={{ color: round.statusColor, fontWeight: 600 }}>{round.statusText}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}