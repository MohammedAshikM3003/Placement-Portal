import React, { useState, useMemo } from "react";
<<<<<<< HEAD
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import TickIcon from './assets/TickIcon.png';
import DownloadIcon from './assets/DownloadIcon.png';
import PopUpPlaced from "./PopUpPlaced";
import PopUpPending from "./PopUpPending";
import PopUpRejected from "./PopUpRejected";
import './Company.css';
=======
import Adminicon from './assets/Adminicon.png';
import TickIcon from './assets/TickIcon.png';
import DownloadIcon from './assets/DownloadIcon.png';
import CompanySideBarIcon from "./assets/CompanySideBarIcon.svg";

import PopUpPlaced from "./PopUpPlaced";
import PopUpPending from "./PopUpPending";
import PopUpRejected from "./PopUpRejected";

const sidebarItems = [
  { icon: require('./assets/DashboardSideBarIcon.png'), text: 'Dashboard', view: 'dashboard' },
  { icon: require('./assets/ResumeSideBarIcon.png'), text: 'Resume', view: 'resume' },
  { icon: require('./assets/AttendanceSideBarIcon.png'), text: 'Attendance', view: 'attendance' },
  { icon: require('./assets/AchievementsSideBarIcon.png'), text: 'Achievements', view: 'achievements' },
  { icon: CompanySideBarIcon, text: 'Company', view: 'company' },
];
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c

const applicationHistory = [
  { company: "TCS", position: "Assistant Software Engineer", status: "Rejected" },
  { company: "Wipro", position: "Project Engineer", status: "Rejected" },
<<<<<<< HEAD
  { company: "HCL", position: "Developer", status: "Pending" },
=======
  { company: "HCL", position: "Developper", status: "Pending" },
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
  { company: "Capgemini", position: "Associate Consultant", status: "Rejected" },
  { company: "Cognizant", position: "Programmer Analyst", status: "Pending" },
  { company: "Accenture", position: "Software Engineer", status: "Pending" },
  { company: "Deloitte", position: "Consultant", status: "Rejected" },
  { company: "EY", position: "Developer", status: "Pending" },
  { company: "Infosys", position: "System Engineer", status: "Placed" },
];

const statusStyles = {
  Rejected: { background: "#FFC3C3", color: "#AD2C2C", border: "1.5px solid #FFC3C3" },
  Pending: { background: "#EFEFEF", color: "#949494", border: "1.5px solid #EFEFEF" },
  Placed: { background: "#D0F2EA", color: "#16C098", border: "1.5px solid #D0F2EA" }
};

<<<<<<< HEAD
export default function Company({ onLogout, onViewChange }) { // Removed currentView
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
=======
export default function Company({ onLogout, onViewChange, currentView }) {
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
  const [activeSubView, setActiveSubView] = useState('list');
  const [selectedApp, setSelectedApp] = useState(null);
  const statusOrder = { Rejected: 1, Pending: 2, Placed: 3 };

  const sortedHistory = useMemo(() =>
    [...applicationHistory].sort((a, b) =>
      statusOrder[a.status] - statusOrder[b.status]
    ), [statusOrder]
  );

<<<<<<< HEAD
  const handleViewChange = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
    setIsSidebarOpen(false);
  };

  function handleCardClick(app) {
=======
  function handleArrowClick(app) {
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
    setSelectedApp(app);
    if (app.status === "Placed") setActiveSubView('placed');
    else if (app.status === "Pending") setActiveSubView('pending');
    else if (app.status === "Rejected") setActiveSubView('rejected');
  }

  function handleBack() {
    setActiveSubView('list');
    setSelectedApp(null);
  }

  const renderContent = () => {
    switch (activeSubView) {
      case 'placed':
        return <PopUpPlaced app={selectedApp} onBack={handleBack} />;
      case 'pending':
        return <PopUpPending app={selectedApp} onBack={handleBack} />;
      case 'rejected':
        return <PopUpRejected app={selectedApp} onBack={handleBack} />;
      case 'list':
      default:
        return (
            <>
<<<<<<< HEAD
              <div className="company-page-hubTitle">Company's Placement</div>
              <div className="company-page-placementHub">
                  <div className="company-page-congrats-banner">
                      <img src={TickIcon} alt="Success" className="company-page-congrats-icon" />
                      <div className="company-page-congrats-text">
                          <div className="company-page-congrats-title">Congratulations! you’re Placed!</div>
                          <div className="company-page-congrats-desc">you’re chapter is now closed. We wish you a fantastic career journey at <span>Infosys!</span></div>
                      </div>
                      <button className="company-page-download-offer-btn">
                          <img src={DownloadIcon} alt="Download" />
                          <span>Download Offer Letter</span>
                      </button>
                  </div>
              </div>
              <div className="company-page-history-container">
                  <div className="company-page-history-title">Company Placement History</div>
                  <div className="company-page-appList">
                      {sortedHistory.map((app, idx) => (
                          <div key={idx} className="company-page-app-item" onClick={() => handleCardClick(app)} role="button" tabIndex="0">
                              <div className="company-page-app-logo">{app.company[0]}</div>
                              <div className="company-page-app-details">
                                  <div className="company-page-app-company">{app.company}</div>
                                  <div className="company-page-app-position">{app.position}</div>
                              </div>
                              <div style={statusStyles[app.status]} className="company-page-app-status">{app.status}</div>
                              <span className="company-page-app-arrow">&#8250;</span>
                          </div>
                      ))}
                  </div>
              </div>
=======
                <div className="hubTitle" style={{ fontWeight: 800, fontSize: "25px", color: "#000000", flexShrink: 0, marginBottom: "24px" }}>Company's Placement</div>
                <div className="placementHub" style={{ flexShrink: 0 }}>
                    <div style={{ background: "#C9FAC9", border: "1.5px solid #47BA47", borderRadius: "14px", display: "flex", alignItems: "center", padding: "30px 45px", gap: "22px", boxShadow: "0 2px 10px rgba(56,168,92,0.07)", minHeight: "115px" }}>
                        <img src={TickIcon} alt="Success" style={{ width: "40px", height: "40px", objectFit: "contain", marginRight: "18px" }} />
                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                            <div style={{ fontWeight: 800, fontSize: "22.5px", color: "#178A2E", marginBottom: "3px" }}>Congratulations! you’re Placed!</div>
                            <div style={{ fontWeight: 400, fontSize: "15.8px", color: "#285F2B" }}>you’re chapter is now closed. We wish you a fantastic career journey at <span style={{ color: "#159051", fontWeight: 700 }}>Infosys!</span></div>
                        </div>
                        <button style={{ marginLeft: "auto", background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: "6px" }}>
                            <img src={DownloadIcon} alt="Download" style={{ width: "31px", height: "31px" }} />
                            <span style={{ color: "#178A2E", fontWeight: 800, fontSize: "17.5px" }}>Download Offer Letter</span>
                        </button>
                    </div>
                </div>
                <div style={{ background: "#3B6FB6", borderRadius: "18px", padding: "32px 22px", marginTop: "25px", flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                    <div style={{ color: "#fff", fontWeight: 800, fontSize: "24px", marginBottom: "14px" }}>Company Placement History</div>
                    <div className="appList" style={{ overflowY: "auto", flexGrow: 1, paddingRight: "10px" }}>
                        {sortedHistory.map((app, idx) => (
                            <div key={idx} style={{ background: "#fff", borderRadius: "14px", padding: "25px 32px", marginBottom: "23px", display: "flex", alignItems: "center", border: "1.5px solid #E6EEF7" }}>
                                <div style={{ width: "45px", height: "45px", borderRadius: "50%", background: "#E3E9F9", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "23px", color: "#4286F7", marginRight: "21px" }}>{app.company[0]}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 800, fontSize: "18.6px", color: "#273455" }}>{app.company}</div>
                                    <div style={{ fontWeight: 400, fontSize: "13.2px", color: "#7D8BA6" }}>{app.position}</div>
                                </div>
                                <div style={{ ...statusStyles[app.status], borderRadius: "20px", fontWeight: 700, fontSize: "15px", padding: "8.5px 34px", marginLeft: "18px" }}>{app.status}</div>
                                <span style={{ fontSize: "27px", color: "#8EA3B3", marginLeft: "9px", cursor: "pointer" }} onClick={() => handleArrowClick(app)} role="button" aria-label={`View details for ${app.company}`}>&#8250;</span>
                            </div>
                        ))}
                    </div>
                </div>
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
            </>
        );
    }
  };

  return (
<<<<<<< HEAD
    <div className="company-page-container container">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="company-page-main main">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onLogout={onLogout} 
          onViewChange={handleViewChange} 
          currentView={'company'} // Hardcode 'company'
        />
        <div className="company-page-dashboard-area dashboard-area">
          {renderContent()}
        </div>
      </div>
      {isSidebarOpen && <div className="overlay" onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
=======
    <>
      <style>{`
        html, body { margin: 0; padding: 0; overflow: hidden; }
        .appList::-webkit-scrollbar { width: 8px; }
        .appList::-webkit-scrollbar-track { background: transparent; }
        .appList::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
        .appList::-webkit-scrollbar-thumb:hover { background: #555; }
        .appList > div:last-child { margin-bottom: 0 !important; }
        .scroll-rounds::-webkit-scrollbar { width: 8px; } .scroll-rounds::-webkit-scrollbar-thumb { background: #e0e7ef; border-radius: 6px; } .scroll-rounds::-webkit-scrollbar-track { background: transparent; }
        
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;700;800&display=swap');
        body{background:#f8f8fb;font-family:'Poppins',Arial,sans-serif}.container{font-family:'Poppins',Arial,sans-serif;background:#f8f8fb;min-height:100vh}.navbar{display:flex;align-items:center;background:#2085f6;color:#fff;padding:15px 32px 15px 26px;justify-content:space-between;box-shadow:0 2px 4px rgba(0,0,0,0.1);position:fixed;top:0;left:0;right:0;z-index:1000}.navbar .left{display:flex;align-items:center}.portal-logo{height:35px;width:35px;margin-right:18px;display:flex;align-items:center;justify-content:center}.portal-logo img{height:30px;width:40px;filter:brightness(0) invert(1)}.portal-name{font-size:1.48rem;font-weight:bold;letter-spacing:0.5px}.navbar .menu{display:flex;gap:35px;font-size:1.06rem}.navbar .menu span{color:#fff;text-decoration:none;margin:0 5px;font-weight:500;position:relative;padding:8px 12px;border-radius:6px;transition:background 0.2s;display:flex;align-items:center;gap:5px}.navbar .menu span:hover{background:rgba(255,255,255,0.1)}.main{display:flex;min-height:calc(100vh - 65px);margin-top:65px}.sidebar{background:#fff;width:230px;height:calc(100vh - 65px);box-shadow:2px 0 12px #e1e6ef3a;display:flex;flex-direction:column;position:fixed;left:0;top:65px;overflow-y:auto;z-index:999}.sidebar .user-info{text-align:center;padding:25px 20px 20px 20px;font-size:1rem;color:#555;display:flex;flex-direction:column;align-items:center;position:relative;flex-shrink:0;margin-top:15px}.sidebar .user-details img{width:50px;height:40px;margin-right:15px;flex-shrink:0}.sidebar .user-details{margin-top:8px;font-weight:600;font-size:1.1em;color:#191c24;display:flex;align-items:center;justify-content:flex-start;gap:0}.sidebar .user-text{display:flex;flex-direction:column;align-items:flex-start;flex:1}.sidebar .user-year{color:#777;font-size:0.9em;font-weight:400;margin-top:2px;display:block}.sidebar .menu-toggle{position:absolute;top:20px;right:20px;background:none;border:none;color:#999;font-size:1.2em;cursor:pointer;width:30px;height:30px;display:flex;align-items:center;justify-content:center;border-radius:4px;transition:background 0.2s;margin-top:40px}.sidebar .menu-toggle:hover{background:#f0f0f0}.sidebar .nav{flex:1;display:flex;flex-direction:column;padding:0px 0;justify-content:flex-start;gap:0;min-height:0}.sidebar .nav-section{display:flex;flex-direction:column;gap:8px;flex-shrink:0}.sidebar .nav-item{display:flex;align-items:center;font-size:1.27rem;padding:18px 25px;color:#000000;text-decoration:none;cursor:pointer;transition:all 0.18s;gap:15px;border-left:4px solid transparent;margin:3px 0;margin-top:10px}.sidebar .nav-item.selected{background:#F8F8F8;border-left:4px solid #197AFF;color:#197AFF;font-weight:600}.sidebar .nav-item.selected img{filter:brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%)}.sidebar .nav-item:hover:not(.selected){background:#f0f6ff;border-left:4px solid #197AFF;color:#197AFF}.sidebar .nav-item img{width:20px;height:20px;transition:transform 0.2s;filter:brightness(0) saturate(100%) invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0%) contrast(100%)}.sidebar .nav-item:hover img{transform:scale(1.1)}.sidebar .nav-item:hover:not(.selected) img{filter:brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%)}.sidebar .nav-divider{height:1px;width:228px;background:#e0e0e0;margin:8px 2px;border-top:1px dotted #ccc;flex-shrink:0;margin-top:12px}.sidebar .logout-btn{background:#D23B42;color:#fff;margin:25px 25px 25px 25px;padding:10px 0;border:none;border-radius:60px;font-size:1.3rem;font-weight:500;letter-spacing:0.2px;cursor:pointer;transition:background 0.2s;display:flex;align-items:center;justify-content:center;flex-shrink:0;width:50%;margin-left:50px;margin-bottom:10px}.sidebar .logout-btn:hover{background:#d55a6a}.dashboard-area{flex:1;height:calc(100vh - 65px);padding:15px 30px;background:#fff;margin-left:230px;overflow-y:hidden;overflow-x:hidden;position:relative}
      `}</style>
      
      <div className="container">
        <div className="navbar">
            <div className="left">
                <span className="portal-logo"><img src={Adminicon} alt="Portal Logo" /></span>
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
          
          <div className="dashboard-area" style={{ display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            {renderContent()}
          </div>

        </div>
      </div>
    </>
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
  );
}