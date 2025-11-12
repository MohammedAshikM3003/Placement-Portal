import React, { useState, useMemo, useEffect } from "react";
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';
import TickIcon from '../assets/TickIcon.png';
import DownloadIcon from '../assets/DownloadIcon.png';
import PopUpPlaced from "./PopUpPlaced";
import PopUpPending from "./PopUpPending";
import PopUpRejected from "./PopUpRejected";
import './Company.css';

// Application history will be fetched from backend - no hardcoded mock data
const getApplicationHistory = async (studentId) => {
  try {
    // TODO: Implement API call to fetch student's application history
    // const response = await fetch(`/api/students/${studentId}/applications`);
    // return await response.json();
    
    // Return empty array until API is implemented
    return [];
  } catch (error) {
    console.error('Error fetching application history:', error);
    return [];
  }
};

const statusStyles = {
  Rejected: { background: "#FFC3C3", color: "#AD2C2C", border: "1.5px solid #FFC3C3" },
  Pending: { background: "#EFEFEF", color: "#949494", border: "1.5px solid #EFEFEF" },
  Placed: { background: "#D0F2EA", color: "#16C098", border: "1.5px solid #D0F2EA" }
};

// --- CHANGE 1: Removed `currentView` from the list of props ---
export default function Company({ onLogout, onViewChange }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [studentData, setStudentData] = useState(() => {
    // Initialize immediately with localStorage data
    try {
      return JSON.parse(localStorage.getItem('studentData') || 'null');
    } catch (error) {
      return null;
    }
  });
  const [activeSubView, setActiveSubView] = useState('list');
  const [selectedApp, setSelectedApp] = useState(null);
  const [applicationHistory, setApplicationHistory] = useState([]);
  const statusOrder = { Rejected: 1, Pending: 2, Placed: 3 };

  // Load student data for sidebar and application history
  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const updatedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (updatedStudentData) {
          setStudentData(updatedStudentData);
          // Load application history when student data is available
          getApplicationHistory(updatedStudentData._id).then(setApplicationHistory);
        }
      } catch (error) {
        console.error('Error updating student data for sidebar:', error);
      }
    };
    
    // Initial load
    handleProfileUpdate();
    
    // ⚡ INSTANT: Dispatch profile update immediately on company page load
    const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
    if (storedStudentData && storedStudentData.profilePicURL) {
      console.log('🚀 Company: Dispatching immediate profile update for sidebar');
      window.dispatchEvent(new CustomEvent('profileUpdated', { 
        detail: { 
          profilePicURL: storedStudentData.profilePicURL,
          studentData: storedStudentData 
        } 
      }));
    }
    
    window.addEventListener('storage', handleProfileUpdate);
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

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
          // --- CHANGE 2: Hardcoded 'company' to ensure the sidebar link is highlighted ---
          currentView={'company'}
          studentData={studentData}
        />
        <div className="company-page-dashboard-area dashboard-area">
          {renderContent()}
        </div>
      </div>
      {isSidebarOpen && <div className="company-page-overlay overlay" onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
  );
}