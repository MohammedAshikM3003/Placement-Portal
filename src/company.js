import React, { useState, useMemo } from "react";
import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import TickIcon from './assets/TickIcon.png';
import DownloadIcon from './assets/DownloadIcon.png';
import PopUpPlaced from "./PopUpPlaced";
import PopUpPending from "./PopUpPending";
import PopUpRejected from "./PopUpRejected";
import './Company.css';

const applicationHistory = [
  { company: "TCS", position: "Assistant Software Engineer", status: "Rejected" },
  { company: "Wipro", position: "Project Engineer", status: "Rejected" },
  { company: "HCL", position: "Developer", status: "Pending" },
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

export default function Company({ onLogout, onViewChange }) { // Removed currentView
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSubView, setActiveSubView] = useState('list');
  const [selectedApp, setSelectedApp] = useState(null);
  const statusOrder = { Rejected: 1, Pending: 2, Placed: 3 };

  const sortedHistory = useMemo(() =>
    [...applicationHistory].sort((a, b) =>
      statusOrder[a.status] - statusOrder[b.status]
    ), [statusOrder]
  );

  const handleViewChange = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
    setIsSidebarOpen(false);
  };

  function handleCardClick(app) {
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
            </>
        );
    }
  };

  return (
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
  );
}