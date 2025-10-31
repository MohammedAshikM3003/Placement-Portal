import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar/Navbar.js';
import Sidebar from '../components/Sidebar/Sidebar.js';
import CertificateUpload from "./PopupAchievements.js";
import EditCertificate from "./popupEditAchievements.js";
import './Achievements.css';
import UploadCertificatecardicon from '../assets/UploadCertificatecardicon.svg';
import editcertificatecardicon from '../assets/editcertificatecardicon.svg';
import fileStorageService from '../services/fileStorageService.js';

// NEW: Import the new download/preview alerts
import { 
  DownloadFailedAlert, 
  DownloadSuccessAlert, 
  DownloadProgressAlert, 
  PreviewFailedAlert, 
  PreviewProgressAlert 
} from '../components/alerts';

// Delete Confirmation Popup Component - Matches PopupAchievements style
const DeleteConfirmationPopup = ({ onClose, onConfirm, selectedCount, isDeleting }) => (
  <div className="Achievement-popup-container">
    <div className="Achievement-popup-header">Delete Certificate</div>
    <div className="Achievement-popup-body">
      <svg className="Achievement-warning-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle className="Achievement-warning-icon--circle" cx="26" cy="26" r="25" fill="none"/>
        <path className="Achievement-warning-icon--exclamation" fill="none" d="M26 16v12M26 34v2"/>
      </svg>
      <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#333", fontWeight: "600" }}>
        Are you sure?
      </h2>
      <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
        Do you want to delete {selectedCount} selected certificate{selectedCount > 1 ? 's' : ''}?
      </p>
    </div>
    <div className="Achievement-popup-footer">
      <button onClick={onClose} className="Achievement-popup-cancel-btn" disabled={isDeleting}>
        Discard
      </button>
      <button onClick={onConfirm} className="Achievement-popup-delete-btn" disabled={isDeleting}>
        {isDeleting ? 'Deleting...' : 'Delete'}
      </button>
    </div>
  </div>
);

// Delete Success Popup Component - Red Bin Icon with Certificate Names
const DeleteSuccessPopup = ({ onClose, deletedCertificates }) => {
  // Get the first certificate name
  const firstName = deletedCertificates.length > 0 ? deletedCertificates[0].comp : 'Certificate';
  const remainingCount = deletedCertificates.length - 1;
  
  return (
    <div className="Achievement-popup-container">
      <div className="Achievement-popup-header">Deleted !</div>
      <div className="Achievement-popup-body">
        <svg className="Achievement-delete-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
          <circle className="Achievement-delete-icon--circle" cx="26" cy="26" r="25" fill="none"/>
          <g className="Achievement-delete-icon--bin" fill="none" strokeWidth="2">
            <path d="M16 20l20 0M18 20l0 16c0 1 1 2 2 2l12 0c1 0 2-1 2-2l0-16M21 20l0-3c0-1 1-2 2-2l6 0c1 0 2 1 2 2l0 3M23 25l0 8M26 25l0 8M29 25l0 8"/>
          </g>
        </svg>
        <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
          {firstName}{remainingCount > 0 && ` (+${remainingCount} more)`}
        </h2>
        <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
          The selected Certificate{deletedCertificates.length > 1 ? '(s)' : ''}<br />
          has been Deleted Successfully!
        </p>
      </div>
      <div className="Achievement-popup-footer">
          <button onClick={onClose} className="Achievement-popup-close-btn">
            Close
          </button>
      </div>
    </div>
  );
};

const EyeIcon = ({ color = "#4563fd" }) => ( <svg width="22" height="22" viewBox="0 0 24 24" fill="none"> <ellipse cx="12" cy="12" rx="9" ry="6" stroke={color} strokeWidth="2"/> <circle cx="12" cy="12" r="2" stroke={color} strokeWidth="2"/> </svg> );

export default function Achievements({ onLogout, onViewChange }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [studentData, setStudentData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('studentData') || 'null');
    } catch (error) {
      return null;
    }
  });

  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const updatedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (updatedStudentData) {
          setStudentData(updatedStudentData);
        }
      } catch (error) {
        console.error('Error updating student data for sidebar:', error);
      }
    };
    
    window.addEventListener('storage', handleProfileUpdate);
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const handleViewChange = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
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
          currentView={'achievements'}
          studentData={studentData}
        />
        <div className="achievements-area dashboard-area">
          <AchievementsContent />
        </div>
      </div>
      {isSidebarOpen && <div className="overlay" onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
  );
}

function AchievementsContent() {
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showRestrictionPopup, setShowRestrictionPopup] = useState(false);
  const [deletePopupState, setDeletePopupState] = useState('none'); // 'none', 'confirm', 'success'
  const [isDeleting, setIsDeleting] = useState(false);
  const [restrictionMessage, setRestrictionMessage] = useState("");
  const [deletedCertificates, setDeletedCertificates] = useState([]);

  // NEW: Download/Preview popup states
  const [downloadPopupState, setDownloadPopupState] = useState('none'); // 'none', 'progress', 'success', 'failed'
  const [previewPopupState, setPreviewPopupState] = useState('none'); // 'none', 'progress', 'failed'
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [previewProgress, setPreviewProgress] = useState(0);

  // ... (rest of your existing state and functions)

  // NEW: Download functionality
  const handleDownloadPDF = async (certificateData) => {
    try {
      setDownloadPopupState('progress');
      setDownloadProgress(0);

      // Simulate download progress
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            setDownloadPopupState('success');
            return 100;
          }
          return prev + 25;
        });
      }, 500);

      // Simulate actual download logic here
      // await downloadCertificateAsPDF(certificateData);

    } catch (error) {
      console.error('Download failed:', error);
      setDownloadPopupState('failed');
    }
  };

  // NEW: Preview functionality
  const handlePreviewPDF = async (certificateData) => {
    try {
      setPreviewPopupState('progress');
      setPreviewProgress(0);

      // Simulate preview loading progress
      const progressInterval = setInterval(() => {
        setPreviewProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            // Open preview window or navigate to preview page
            // window.open(previewUrl, '_blank');
            setPreviewPopupState('none');
            return 100;
          }
          return prev + 25;
        });
      }, 400);

      // Simulate actual preview logic here
      // const previewUrl = await generatePreviewURL(certificateData);

    } catch (error) {
      console.error('Preview failed:', error);
      setPreviewPopupState('failed');
    }
  };

  // NEW: Close popup functions
  const closeDownloadPopup = () => {
    setDownloadPopupState('none');
    setDownloadProgress(0);
  };

  const closePreviewPopup = () => {
    setPreviewPopupState('none');
    setPreviewProgress(0);
  };

  // ... (rest of your existing functions and JSX)

  return (
    <div className="achievements-content">
      {/* Your existing achievements content */}
      
      {/* Example buttons to trigger download/preview */}
      <div className="action-buttons">
        <button onClick={() => handleDownloadPDF({})} className="download-btn">
          Download PDF
        </button>
        <button onClick={() => handlePreviewPDF({})} className="preview-btn">
          Preview PDF
        </button>
      </div>

      {/* Existing popups */}
      {showUploadPopup && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(18,18,34,0.11)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CertificateUpload onClose={() => setShowUploadPopup(false)} onUpload={handleUploadSuccess} />
        </div>
      )}

      {/* NEW: Download/Preview Popups */}
      <DownloadProgressAlert 
        isOpen={downloadPopupState === 'progress'} 
        progress={downloadProgress} 
      />
      
      <DownloadSuccessAlert 
        isOpen={downloadPopupState === 'success'} 
        onClose={closeDownloadPopup} 
      />
      
      <DownloadFailedAlert 
        isOpen={downloadPopupState === 'failed'} 
        onClose={closeDownloadPopup} 
      />
      
      <PreviewProgressAlert 
        isOpen={previewPopupState === 'progress'} 
        progress={previewProgress} 
      />
      
      <PreviewFailedAlert 
        isOpen={previewPopupState === 'failed'} 
        onClose={closePreviewPopup} 
      />

      {/* Your existing delete popups and other content */}
    </div>
  );
}

// ... (rest of your existing code)
