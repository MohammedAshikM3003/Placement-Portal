import React, { useState, useMemo, useEffect } from "react";
import Navbar from '../components/Navbar/Navbar.js';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import TickIcon from '../assets/TickIcon.png';
import DownloadIcon from '../assets/DownloadIcon.png';
import PopUpPlaced from "./PopUpPlaced.jsx";
import PopUpPending from "./PopUpPending.jsx";
import PopUpRejected from "./PopUpRejected.jsx";
import styles from './Company.module.css';

// Application history will be fetched from backend - no hardcoded mock data
const getApplicationHistory = async (studentId) => {
  // Return empty array until API is implemented
  return [];
};

const statusStyles = {
  Rejected: { background: "#FFC3C3", color: "#AD2C2C", border: "1.5px solid #FFC3C3" },
  Pending: { background: "#EFEFEF", color: "#949494", border: "1.5px solid #EFEFEF" },
  Placed: { background: "#D0F2EA", color: "#16C098", border: "1.5px solid #D0F2EA" }
};

export default function Company({ onLogout, onViewChange }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [studentData, setStudentData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('studentData') || 'null');
    } catch (error) {
      return null;
    }
  });
  const [activeSubView, setActiveSubView] = useState('list');
  const [selectedApp, setSelectedApp] = useState(null);
  const [applicationHistory, setApplicationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const updatedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (updatedStudentData) {
          setStudentData(updatedStudentData);
          getApplicationHistory(updatedStudentData._id).then(setApplicationHistory);
        }
      } catch (error) {
        console.error('Error updating student data for sidebar:', error);
      }
    };
    
    const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
    if (storedStudentData) {
      setStudentData(storedStudentData);
      getApplicationHistory(storedStudentData._id).then(setApplicationHistory);
      
      if (storedStudentData._id) {
        import('../services/fastDataService.jsx').then(({ default: fastDataService }) => {
          const instantData = fastDataService.getInstantData(storedStudentData._id);
          if (instantData && instantData.student) {
            setStudentData(instantData.student);
          }
        });
      }
      
      if (storedStudentData.profilePicURL) {
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: storedStudentData }));
      }
    }
    
    window.addEventListener('storage', handleProfileUpdate);
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('allDataPreloaded', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('allDataPreloaded', handleProfileUpdate);
    };
  }, []);

  const sortedHistory = useMemo(() => {
    const statusOrder = { 'Placed': 1, 'Pending': 2, 'Rejected': 3 };
    return [...applicationHistory].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  }, [applicationHistory]);

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
              <div className={styles.hubTitle}>Company's Placement</div>
              <div className={styles.placementHub}>
                  <div className={styles.congratsBanner}>
                      <img src={TickIcon} alt="Success" className={styles.congratsIcon} />
                      <div className={styles.congratsText}>
                          <div className={styles.congratsTitle}>Congratulations! you’re Placed!</div>
                          <div className={styles.congratsDesc}>you’re chapter is now closed. We wish you a fantastic career journey at <span>Infosys!</span></div>
                      </div>
                      <button className={styles.downloadOfferBtn}>
                          <img src={DownloadIcon} alt="Download" />
                          <span>Download Offer Letter</span>
                      </button>
                  </div>
              </div>
              <div className={styles.historyContainer}>
                  <div className={styles.historyTitle}>Company Placement History</div>
                  <div className={styles.appList}>
                      {sortedHistory.map((app, idx) => (
                          <div 
                            key={idx} 
                            className={`${styles.appItem} ${styles[`status${app.status}`]}`} 
                            onClick={() => handleCardClick(app)} 
                            role="button" 
                            tabIndex="0"
                          >
                              <div className={styles.appLogo}>{app.company[0]}</div>
                              <div className={styles.appDetails}>
                                  <div className={styles.appCompany}>{app.company}</div>
                                  <div className={styles.appPosition}>{app.position}</div>
                              </div>
                              <div style={statusStyles[app.status]} className={styles.appStatus}>{app.status}</div>
                              <span className={styles.appArrow}>&#8250;</span>
                          </div>
                      ))}
                  </div>
              </div>
            </>
        );
    }
  };

  return (
    <div className={styles.container}>
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={styles.main}>
        <Sidebar 
          isOpen={isSidebarOpen} 
          onLogout={onLogout} 
          onViewChange={handleViewChange} 
          currentView={'company'}
          studentData={studentData}
        />
        <div className={styles.dashboardArea}>
          {renderContent()}
        </div>
      </div>
      {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
  );
}