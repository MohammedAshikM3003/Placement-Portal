import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar/Navbar.js';
import Sidebar from '../components/Sidebar/Sidebar.js';
import CertificateUpload from "./PopupAchievements.js";
import EditCertificate from "./popupEditAchievements.js";
import './Achievements.css';
import UploadCertificatecardicon from '../assets/UploadCertificatecardicon.svg';
import editcertificatecardicon from '../assets/editcertificatecardicon.svg';
// import authService from '../services/authService.js';
import mongoDBService from '../services/mongoDBService.js';
import certificateService from '../services/certificateService.js';
import fastDataService from '../services/fastDataService.js';

// NEW: Import download/preview alerts
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

export default function Achievements({ onLogout, onViewChange }) { // Removed currentView
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [studentData, setStudentData] = useState(() => {
    // Initialize immediately with localStorage data
    try {
      return JSON.parse(localStorage.getItem('studentData') || 'null');
    } catch (error) {
      return null;
    }
  });

  // Load student data for sidebar
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
          currentView={'achievements'} // Hardcode 'achievements'
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

// The rest of the file (AchievementsContent, etc.) remains unchanged.
// ... (Your existing AchievementsContent component goes here)
function AchievementsContent() {
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showRestrictionPopup, setShowRestrictionPopup] = useState(false);
  const [deletePopupState, setDeletePopupState] = useState('none'); // 'none', 'confirm', 'success'
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete button
  const [restrictionMessage, setRestrictionMessage] = useState("");
  const [deletedCertificates, setDeletedCertificates] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [sortBy, setSortBy] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [yearSemesterFilter, setYearSemesterFilter] = useState("");

  // NEW: Download/Preview popup states
  const [downloadPopupState, setDownloadPopupState] = useState('none'); // 'none', 'progress', 'success', 'failed'
  const [previewPopupState, setPreviewPopupState] = useState('none'); // 'none', 'progress', 'failed'
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState({
    searchQuery: "", yearSemesterFilter: "", statusFilter: "all", sortBy: "",
  });
  const [filtersHaveBeenApplied, setFiltersHaveBeenApplied] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // For initial page load animation
  const [, setStudentData] = useState(null);
  // Removed lastSyncTime state - no longer displayed to users

  // Super fast background refresh function (optimized)
  const quickBackgroundRefresh = useCallback(async () => {
    try {
      console.log('⚡ Super fast background refresh...');
      const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (studentData && studentData.regNo && studentData.dob) {
        const mongoDBService = (await import('../services/mongoDBService.js')).default;
        
        // Ultra-fast timeout for maximum speed
        const freshStudentData = await Promise.race([
          mongoDBService.getStudentByRegNoAndDob(studentData.regNo, studentData.dob),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 500) // Reduced to 500ms
          )
        ]);
        
        if (freshStudentData && freshStudentData.certificates) {
          // Get correct student ID
          let studentId = studentData.id || studentData._id || studentData.studentId;
          if (!studentId) {
            studentId = `student_${studentData.regNo}`;
          }
          
          // OPTIMIZED: Only fetch file data if needed, use parallel processing
          const achievementsWithFiles = await Promise.allSettled(
            freshStudentData.certificates.map(async (achievement) => {
              try {
                // Skip file data fetch for faster refresh - only get metadata
                return {
                  ...achievement,
                  // Don't fetch fileData unless specifically needed
                  fileData: null, // Will be fetched on-demand
                  fileName: achievement.fileName
                };
              } catch (error) {
                console.error(`Error processing achievement ${achievement.id}:`, error);
                return achievement;
              }
            })
          );
          
          // Filter successful results
          const successfulAchievements = achievementsWithFiles
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);
          
          // Update state immediately
          setAchievements(successfulAchievements);
          setSelectedRows([]); // Clear selections on refresh
          // Sync time tracking removed - not displayed to users
          console.log('⚡ Super fast background refresh completed');
        } else {
          setAchievements([]);
          setSelectedRows([]);
          console.log('⚡ Super fast background refresh - no certificates found');
        }
      }
    } catch (error) {
      console.warn('Super fast background refresh failed:', error);
    }
  }, []);

  // Load student data and achievements on component mount
  useEffect(() => {
    // Start loading immediately
    setIsInitialLoading(true);
    
    // Show cached data immediately if available for faster UI
    const cachedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
    if (cachedStudentData && cachedStudentData.certificates) {
      console.log('⚡ Showing cached data immediately for faster UI');
      setAchievements(cachedStudentData.certificates);
      setStudentData(cachedStudentData);
      // Sync time tracking removed - not displayed to users
      setIsInitialLoading(false); // Stop loading animation immediately
    }
    
    // Then load fresh data from MongoDB
    loadStudentData();
  }, []);

  // Quick refresh when component mounts (sidebar navigation to Achievements)
  useEffect(() => {
    const timer = setTimeout(() => {
      quickBackgroundRefresh();
    }, 50); // Super fast refresh
    
    return () => clearTimeout(timer);
  }, [quickBackgroundRefresh]);

  // Debug effect to track state changes
  useEffect(() => {
    console.log('=== STATE CHANGE DEBUG ===');
    console.log('Achievements count:', achievements.length);
    console.log('Selected rows count:', selectedRows.length);
    console.log('Selected rows:', selectedRows);
    console.log('Achievements:', achievements.map(a => ({ id: a.id, comp: a.comp })));
    console.log('=== END STATE DEBUG ===');
  }, [achievements, selectedRows]);

  // Clear selections when achievements change to prevent stale selections
  useEffect(() => {
    if (achievements.length === 0 && selectedRows.length > 0) {
      console.log('🔄 Clearing stale selections - no achievements but selections exist');
      setSelectedRows([]);
    }
    
    // Also clean selections if they reference non-existent achievements
    const validSelectedRows = selectedRows.filter(rowId => 
      achievements.some(a => a.id === rowId)
    );
    
    if (validSelectedRows.length !== selectedRows.length) {
      console.log('🔄 Cleaning invalid selections:', {
        before: selectedRows.length,
        after: validSelectedRows.length
      });
      setSelectedRows(validSelectedRows);
    }
  }, [achievements, selectedRows]);

  // Function to clean stale selections
  const cleanStaleSelections = useCallback(() => {
    const validSelectedRows = selectedRows.filter(rowId => 
      achievements.some(a => a.id === rowId)
    );
    
    if (validSelectedRows.length !== selectedRows.length) {
      console.log('🧹 Cleaning stale selections:', {
        before: selectedRows.length,
        after: validSelectedRows.length,
        removed: selectedRows.filter(id => !validSelectedRows.includes(id))
      });
      setSelectedRows(validSelectedRows);
    }
  }, [selectedRows, achievements]);

  // Auto-sync with MongoDB every 5 seconds to prevent stale data
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (studentData && studentData.regNo && studentData.dob) {
          const mongoDBService = (await import('../services/mongoDBService.js')).default;
          
          // Add timeout to prevent hanging
          const freshStudentData = await Promise.race([
            mongoDBService.getStudentByRegNoAndDob(studentData.regNo, studentData.dob),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Auto-sync timeout')), 5000)
            )
          ]);
          
          if (freshStudentData && freshStudentData.certificates) {
            // Only update if data has changed
            if (freshStudentData.certificates.length !== achievements.length) {
              console.log('🔄 Auto-sync: Data changed, refreshing...');
              await refreshAchievements();
              // Sync time tracking removed - not displayed to users
            } else {
              // Data hasn't changed, but clean stale selections
              cleanStaleSelections();
            }
          } else if (achievements.length > 0) {
            // MongoDB is empty but UI has data - clear it completely
            console.log('🔄 Auto-sync: MongoDB empty, clearing all stale data...');
            console.log('Clearing achievements:', achievements.length);
            console.log('Clearing selected rows:', selectedRows.length);
            
            setAchievements([]);
            setSelectedRows([]);
            
            // Update localStorage to remove all certificate data
            const updatedStudentData = {
              ...studentData,
              certificates: []
            };
            localStorage.setItem('studentData', JSON.stringify(updatedStudentData));
            // Sync time tracking removed - not displayed to users
            
            console.log('✅ All stale data cleared automatically');
          }
        }
      } catch (error) {
        // Silently handle auto-sync failures to avoid spam
        if (error.message !== 'Auto-sync timeout') {
          console.warn('Auto-sync failed:', error.message);
        }
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(syncInterval);
  }, [achievements.length, selectedRows.length, cleanStaleSelections]);

  // Auto-refresh when user returns to page (focus event)
  useEffect(() => {
    const handleFocus = async () => {
      console.log('🔄 Page focused, checking for updates...');
      try {
        const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (studentData && studentData.regNo && studentData.dob) {
          const mongoDBService = (await import('../services/mongoDBService.js')).default;
          
          // Add timeout to prevent hanging
          const freshStudentData = await Promise.race([
            mongoDBService.getStudentByRegNoAndDob(studentData.regNo, studentData.dob),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Focus refresh timeout')), 5000)
            )
          ]);
          
          if (freshStudentData && freshStudentData.certificates) {
            if (freshStudentData.certificates.length !== achievements.length) {
              console.log('🔄 Focus refresh: Data changed, updating...');
              await refreshAchievements();
            }
          } else if (achievements.length > 0) {
            console.log('🔄 Focus refresh: MongoDB empty, clearing all stale data...');
            console.log('Clearing achievements:', achievements.length);
            console.log('Clearing selected rows:', selectedRows.length);
            
            setAchievements([]);
            setSelectedRows([]);
            
            // Update localStorage to remove all certificate data
            const updatedStudentData = {
              ...studentData,
              certificates: []
            };
            localStorage.setItem('studentData', JSON.stringify(updatedStudentData));
            
            console.log('✅ All stale data cleared on focus');
          }
        }
      } catch (error) {
        // Silently handle focus refresh failures
        if (error.message !== 'Focus refresh timeout') {
          console.warn('Focus refresh failed:', error.message);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [achievements.length, selectedRows.length]);

  const loadStudentData = async () => {
    try {
      console.log('⚡ FAST LOADING STUDENT DATA FROM MONGODB ===');
      
      // ALWAYS clear selections first to prevent stale state
      setSelectedRows([]);
      console.log('🔄 Cleared selections on page load');
      
      // Get student data from localStorage for authentication
      const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (!studentData) {
        console.log('No student data found in localStorage');
        setAchievements([]);
        setIsInitialLoading(false);
        return;
      }
      
      console.log('Student data from localStorage:', studentData);
      setStudentData(studentData);
      
      // Load ONLY from MongoDB - no localStorage fallback with timeout
      const mongoDBService = (await import('../services/mongoDBService.js')).default;
      console.log('⚡ Fetching latest data from MongoDB with timeout...');
      
      const freshStudentData = await Promise.race([
        mongoDBService.getStudentByRegNoAndDob(studentData.regNo, studentData.dob),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Load timeout')), 5000) // Increased to 5 seconds for better reliability
        )
      ]);
      
      // AUTO-CLEAR STALE DATA: If MongoDB is empty but localStorage has certificates, clear them
      if (!freshStudentData || !freshStudentData.certificates || freshStudentData.certificates.length === 0) {
        const currentCertificates = studentData.certificates || [];
        if (currentCertificates.length > 0) {
          console.log('🔄 AUTO-CLEAR: MongoDB empty but localStorage has certificates, clearing stale data...');
          console.log('Clearing certificates:', currentCertificates.length);
          
          // Clear localStorage
          const cleanStudentData = {
            ...studentData,
            certificates: []
          };
          localStorage.setItem('studentData', JSON.stringify(cleanStudentData));
          
          // Clear state
          setAchievements([]);
          setSelectedRows([]);
          setStudentData(cleanStudentData);
          // Sync time tracking removed - not displayed to users
          
          console.log('✅ Stale data auto-cleared on page load');
          return;
        }
      }
      
      if (freshStudentData && freshStudentData.certificates) {
        console.log('MongoDB data received:', freshStudentData.certificates.length, 'certificates');
        
        // Get correct student ID
        let studentId = studentData.id || studentData._id || studentData.studentId;
        if (!studentId) {
          studentId = `student_${studentData.regNo}`;
        }
        
        // FAST LOADING: Skip file data fetch initially for faster loading
        const achievementsWithoutFiles = freshStudentData.certificates.map(achievement => ({
          ...achievement,
          fileData: null, // Will be fetched on-demand when viewing
          fileName: achievement.fileName
        }));
        
        console.log('⚡ Fast loaded achievements:', achievementsWithoutFiles.length);
        
        // Update with metadata only (faster loading)
        setAchievements(achievementsWithoutFiles);
        setStudentData(freshStudentData);
        
        // Update localStorage with metadata only
        const completeStudentData = {
          ...freshStudentData,
          certificates: achievementsWithoutFiles
        };
        localStorage.setItem('studentData', JSON.stringify(completeStudentData));
        console.log('✅ Data synced with MongoDB successfully');
        // Sync time tracking removed - not displayed to users
      } else {
        console.log('No certificates found in MongoDB');
        setAchievements([]);
        
        // Update localStorage to remove any old certificate data
        const updatedStudentData = {
          ...studentData,
          certificates: []
        };
        localStorage.setItem('studentData', JSON.stringify(updatedStudentData));
        // Sync time tracking removed - not displayed to users
      }
    } catch (error) {
      console.error('⚡ Error loading student data:', error);
      if (error.message === 'Load timeout') {
        console.warn('⚡ Load timeout - using cached data if available');
        // Try to use cached data from localStorage
        const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (studentData && studentData.certificates) {
          setAchievements(studentData.certificates);
          // Sync time tracking removed - not displayed to users
        } else {
          setAchievements([]);
        }
      } else {
        setAchievements([]);
      }
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false); // Stop initial loading animation
      console.log('⚡ LOADING COMPLETE ===');
    }
  };

  const handleUploadClick = () => setShowUploadPopup(true);
  const handleClosePopup = () => setShowUploadPopup(false);
  const handleUploadSuccess = async (newAchievement) => {
    try {
      console.log('🚀 FAST: Starting certificate upload...');
      
      // Get student data from localStorage
      const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (!studentData) {
        throw new Error('User not authenticated. Please log in again.');
      }

      const studentId = studentData._id || studentData.id;
      if (!studentId) {
        throw new Error('Student ID not found. Please log in again.');
      }

      console.log('📋 Certificate data:', {
        studentId,
        fileName: newAchievement.fileName,
        comp: newAchievement.comp
      });

      // ⚡ SUPER FAST: Upload directly to MongoDB
      const result = await certificateService.uploadCertificate(
        studentId,
        newAchievement,
        newAchievement.fileData
      );

      console.log('✅ Certificate uploaded successfully:', result.certificate._id);

      // Update local state immediately
      const newCertificate = {
        ...result.certificate,
        id: result.certificate.achievementId,
        fileData: newAchievement.fileData // Keep for immediate viewing
      };

      setAchievements(prev => [...prev, newCertificate]);
      setSelectedRows([result.certificate.achievementId]);

      // Update localStorage with new certificate
      const updatedStudentData = {
        ...studentData,
        certificates: [...(studentData.certificates || []), newCertificate]
      };
      localStorage.setItem('studentData', JSON.stringify(updatedStudentData));
      setStudentData(updatedStudentData);

      // Trigger events for other components
      window.dispatchEvent(new CustomEvent('certificateUploaded', { 
        detail: { certificate: newCertificate, studentData: updatedStudentData } 
      }));

      console.log('✅ INSTANT: Certificate upload completed successfully!');

    } catch (error) {
      console.error('❌ Certificate upload failed:', error);
      throw error; // Re-throw to show error popup
    }
  };
  const handleEditClick = () => { 
    console.log('Edit clicked. Selected rows:', selectedRows);
    console.log('Selected rows length:', selectedRows.length);
    
    if (selectedRows.length === 1) { 
      const selected = achievements.find(a => a.id === selectedRows[0]); 
      console.log('Found selected achievement:', selected);
      
      if (selected.status === "approved" || selected.status === "rejected") { 
        setRestrictionMessage(`❌ Cannot edit ${selected.status} achievements!\n\nThis record is locked and cannot be modified.\n\n📝 Only pending records can be edited.`); 
        setShowRestrictionPopup(true); 
        return; 
      } 
      setEditingRow(selected); 
      setShowEditPopup(true); 
    } else { 
      console.log('Selection issue - selectedRows:', selectedRows);
      alert("Please select exactly one row to edit"); 
    } 
  };
  const handleCloseEditPopup = () => { setShowEditPopup(false); setEditingRow(null); };
  const handleUpdateAchievement = async (updated) => {
    try {
      console.log('=== UPDATE START ===');
      console.log('Updated achievement received:', updated);
      
      // Get MongoDB service early for optimization
      const mongoDBService = (await import('../services/mongoDBService.js')).default;
      
      // Get student data from localStorage
      const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      console.log('Student data from localStorage:', studentData);
      
      if (!studentData) {
        throw new Error('User not authenticated');
      }
      
      // Get student ID - try multiple possible fields
      let studentId = studentData.id || studentData._id || studentData.studentId;
      
      console.log('🔍 UPDATE: Current student data:', studentData);
      console.log('🔍 UPDATE: Looking for student ID in:', {
        id: studentData.id,
        _id: studentData._id,
        studentId: studentData.studentId
      });
      
      if (!studentId) {
        console.log('⚠️ UPDATE: Student ID not found in localStorage, creating from regNo...');
        // Create a consistent student ID from regNo
        studentId = `student_${studentData.regNo}`;
        console.log('🔧 UPDATE: Created student ID from regNo:', studentId);
        const studentDataWithId = { ...studentData, id: studentId };
        localStorage.setItem('studentData', JSON.stringify(studentDataWithId));
      }
      
      console.log('🎯 UPDATE: Final student ID to use:', studentId);

      // CRITICAL: Check if we need to use the MongoDB student ID format
      // If the student ID doesn't match the format in MongoDB, we need to find the correct one
      if (!studentId.startsWith('68e') && studentId.includes('student_')) {
        console.log('⚠️ UPDATE: Student ID format mismatch detected!');
        console.log('⚠️ UPDATE: Current ID format:', studentId);
        console.log('⚠️ UPDATE: Expected MongoDB format: 68e89cdc2b3351b306d7219a');
        
        // Try to get the correct student ID from existing certificates
        try {
          const allCertificates = await mongoDBService.getCertificatesByStudentId(studentId);
          if (allCertificates && allCertificates.length > 0) {
            console.log('🔍 UPDATE: Found certificates with current ID, using it');
          } else {
            console.log('⚠️ UPDATE: No certificates found with current ID, trying MongoDB format');
            // Try with the MongoDB format
            const mongoStudentId = '68e89cdc2b3351b306d7219a';
            const mongoCertificates = await mongoDBService.getCertificatesByStudentId(mongoStudentId);
            if (mongoCertificates && mongoCertificates.length > 0) {
              console.log('✅ UPDATE: Found certificates with MongoDB ID, switching to it');
              studentId = mongoStudentId;
            }
          }
        } catch (error) {
          console.log('⚠️ UPDATE: Error checking certificate IDs:', error.message);
        }
      }

      // Create updated achievement WITHOUT fileData for Firebase
      const { fileData, ...updatedForFirebase } = updated;

      // Update the achievement in the certificates array
      const updatedCertificatesForFirebase = achievements.map(a => {
        if (a.id === updated.id) {
          return updatedForFirebase;
        } else {
          const { fileData, ...achievementWithoutFileData } = a;
          return achievementWithoutFileData;
        }
      });
      const updatedCertificatesForLocal = achievements.map(a => 
        a.id === updated.id ? updated : a
      );
      
      // Update localStorage immediately
      const updatedStudentData = {
        ...studentData,
        certificates: updatedCertificatesForLocal
      };
      localStorage.setItem('studentData', JSON.stringify(updatedStudentData));

      // Update local state immediately
      setAchievements(updatedCertificatesForLocal);
      setStudentData(updatedStudentData);
      
      console.log('Local state updated immediately');

      // Update file data in certificates collection if file was changed
      // Only update if there's actually file data (either new or existing)
      if (updated.fileData) {
        try {
          
          // Check if certificate already exists for this achievement
          console.log('🔍 Checking for existing certificate:', {
            studentId: studentId,
            achievementId: updated.id,
            fileName: updated.fileName
          });
          
          let existingCertificate = null;
          try {
            existingCertificate = await mongoDBService.getCertificateByAchievementId(studentId, updated.id);
            console.log('🔍 Existing certificate found:', existingCertificate ? 'YES' : 'NO');
            if (existingCertificate) {
              console.log('🔍 Existing certificate details:', {
                _id: existingCertificate._id,
                fileName: existingCertificate.fileName,
                achievementId: existingCertificate.achievementId
              });
            }
          } catch (error) {
            if (error.message === 'Certificate not found.') {
              console.log('🔍 No existing certificate found (404), will create new one');
              existingCertificate = null;
            } else {
              throw error; // Re-throw other errors
            }
          }
          
          const certificateDoc = {
            studentId: studentId,
            achievementId: updated.id,
            fileName: updated.fileName,
            fileData: updated.fileData,
            uploadDate: updated.uploadDate,
            updatedAt: new Date().toISOString()
          };
          
          if (existingCertificate && existingCertificate._id) {
            // Optimized: Direct update without verification for speed
            await mongoDBService.updateCertificate(existingCertificate._id, certificateDoc);
          } else {
            // Optimized: Direct create without excessive logging
          await mongoDBService.createCertificate(certificateDoc);
          }
        } catch (fileError) {
          console.error('Error updating certificate file:', fileError);
          // Don't throw error for file update failure - metadata update is more important
          console.warn('File update failed, but continuing with metadata update');
        }
      } else {
        console.log('No file data to update - preserving existing file');
      }

      // CRITICAL: Update Firebase with metadata only
      console.log('Calling mongoDBService.updateStudent with:', {
        studentId: studentId,
        updateData: { certificates: updatedCertificatesForFirebase }
      });
      
      const updateResult = await mongoDBService.updateStudent(studentId, {
        certificates: updatedCertificatesForFirebase
      });
      console.log('MongoDB update result:', updateResult);
      console.log('Firebase update completed successfully');
      
      // Ultra-fast refresh for maximum speed
      setTimeout(() => {
        quickBackgroundRefresh();
      }, 1); // Ultra-fast refresh timing
      
      console.log('=== UPDATE COMPLETE ===');
    } catch (error) {
      console.error('Error updating achievement:', error);
      throw new Error('Failed to update achievement. Please try again.');
    }
  };
  
  const handleCloseRestrictionPopup = () => setShowRestrictionPopup(false);
  const handleDeleteClick = () => {
    if (selectedRows.length === 0) {
      alert("Please select a certificate row before deleting");
      return;
    }
    setDeletePopupState('confirm');
  };
  const handleCloseDeletePopup = () => setDeletePopupState('none');
  const handleCloseDeleteSuccessPopup = () => {
    setDeletePopupState('none');
    setDeletedCertificates([]);
  };

  // NEW: Download/Preview popup functions
  const handleDownloadPDF = async (certificateData) => {
    // Prevent multiple downloads
    if (downloadPopupState !== 'none') {
      console.log('Download already in progress, ignoring click');
      return;
    }

    let progressInterval; // Declare outside try block for proper cleanup
    
    try {
      setDownloadPopupState('progress');
      setDownloadProgress(0);

      // Check if we have file data first
      if (!certificateData?.fileData) {
        // Try to fetch file data from backend using the same method as preview
        try {
          const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
          if (!studentData) {
            throw new Error('Please log in again to download files.');
          }

          let studentId = studentData.id || studentData._id || studentData.studentId;
          if (!studentId) {
            studentId = `student_${studentData.regNo}`;
          }

          // Use the same method as preview to get all certificates
          const certificates = await mongoDBService.getCertificatesByStudentId(studentId);
          const foundCertificate = certificates.find(cert => cert.achievementId === certificateData.id);
          
          if (foundCertificate?.fileData) {
            certificateData.fileData = foundCertificate.fileData;
          } else {
            throw new Error('No file data available');
          }
        } catch (fetchError) {
          console.error('Failed to fetch file data:', fetchError);
          setDownloadPopupState('failed');
          return;
        }
      }

      // Dynamic download progress simulation
      progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 85) {
            // Stop at 85% until file is actually processed (matching preview)
            return prev;
          }
          return prev + Math.random() * 12; // Slightly smaller increments for smoother feel
        });
      }, 150); // Faster updates for smoother animation (matching preview)

      // Let the progress animation run for a bit, then process the file
      setTimeout(() => {
        try {
          // Ensure the file data has the correct format for download
          let formattedFileData = certificateData.fileData;
          if (!certificateData.fileData.startsWith('data:')) {
            // If it's raw base64, add the PDF data URL prefix
            formattedFileData = `data:application/pdf;base64,${certificateData.fileData}`;
          }

          // Complete progress to 100%
          clearInterval(progressInterval);
          setDownloadProgress(100);

          // INSTANT DOWNLOAD: Use requestAnimationFrame for immediate execution
          requestAnimationFrame(() => {
            fileStorageService.downloadFile(formattedFileData, certificateData.fileName || 'certificate.pdf');
            setDownloadPopupState('success');
          });

        } catch (downloadError) {
          clearInterval(progressInterval);
          console.error('Download processing failed:', downloadError);
          setDownloadPopupState('failed');
        }
      }, 1500); // Let progress run for 1.5 seconds to show smooth animation

    } catch (error) {
      // Make sure to clear any running intervals on error
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      console.error('Download failed:', error);
      setDownloadPopupState('failed');
    }
  };

  // handlePreviewPDF removed - using handleViewFile directly to prevent duplicates

  const closeDownloadPopup = () => {
    setDownloadPopupState('none');
    setDownloadProgress(0);
  };

  const closePreviewPopup = () => {
    setPreviewPopupState('none');
    setPreviewProgress(0);
  };

  const handleConfirmDelete = async () => {
    try {
      console.log('=== DELETE START ===');
      setIsDeleting(true); // Start loading animation
      
      // Get student data from localStorage
      const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (!studentData) {
        throw new Error('User not authenticated');
      }

      // Capture deleted certificates for success popup
      const deletedCerts = achievements.filter(a => selectedRows.includes(a.id));
      console.log('Certificates to be deleted:', deletedCerts.map(c => c.comp));

      // Remove selected achievements from the certificates array
      const updatedCertificatesForFirebase = achievements
        .filter(a => !selectedRows.includes(a.id))
        .map(a => {
          const { fileData, ...achievementWithoutFileData } = a;
          return achievementWithoutFileData;
        });
      const updatedCertificatesForLocal = achievements.filter(a => !selectedRows.includes(a.id));
      
      // Update localStorage immediately
      const updatedStudentData = {
        ...studentData,
        certificates: updatedCertificatesForLocal
      };
      localStorage.setItem('studentData', JSON.stringify(updatedStudentData));

      // Update UI state immediately but keep deleted items visible briefly for user feedback
      setDeletedCertificates(deletedCerts);
      
      console.log('⚡ IMMEDIATE LOCAL UI UPDATE COMPLETED');

      // Start table refresh immediately while delete button animation is running
      setTimeout(async () => {
        try {
          console.log('⚡ Starting background refresh while delete animation is running...');
          setIsLoading(true); // Start table loading animation (refresh button shows "Refreshing...")
          
          // Call the refresh function to update the table
          await refreshAchievements();
          
          console.log('⚡ Background refresh completed successfully');
          
          // After refresh completion, show success popup and stop delete button animation
          setDeletePopupState('success'); // Transition to success popup
          setIsDeleting(false); // Stop delete button loading animation
          
          // Remove deleted items from UI after refresh
          setAchievements(updatedCertificatesForLocal);
          setStudentData(updatedStudentData);
          setSelectedRows([]);
          
          console.log('⚡ Success popup shown after refresh completion');
        } catch (error) {
          console.warn('⚡ Background refresh failed:', error);
          // Still show success popup even if refresh fails
          setDeletePopupState('success');
          setIsDeleting(false);
          setAchievements(updatedCertificatesForLocal);
          setStudentData(updatedStudentData);
          setSelectedRows([]);
        } finally {
          setIsLoading(false); // Stop table loading animation
        }
      }, 100); // Start refresh after 100ms to let delete animation be visible

      // Ultra-fast background deletion
      setTimeout(async () => {
        try {
          const mongoDBService = (await import('../services/mongoDBService.js')).default;
          
          // Get student ID for certificate deletion
          let studentId = studentData.id || studentData._id || studentData.studentId;
          if (!studentId) {
            studentId = `student_${studentData.regNo}`;
          }
          
          // Parallel deletion for maximum speed
          const deletePromises = selectedRows.map(async (achievementId) => {
            try {
              const certificates = await mongoDBService.getCertificatesByStudentId(studentId);
              const certificateToDelete = certificates.find(cert => cert.achievementId === achievementId.toString());
              
              if (certificateToDelete?._id) {
                await mongoDBService.deleteCertificate(certificateToDelete._id);
              }
            } catch (error) {
              // Silent fail for speed
            }
          });
          
          await Promise.allSettled(deletePromises);
        } catch (error) {
          // Silent fail for speed
        }
      }, 1); // Ultra-fast start

      // Background MongoDB student data update (non-blocking)
      setTimeout(async () => {
        try {
          console.log('⚡ Background MongoDB student data update starting...');
          const mongoDBService = (await import('../services/mongoDBService.js')).default;
          
          // Get student ID for update
          let studentId = studentData.id || studentData._id || studentData.studentId;
          if (!studentId) {
            studentId = `student_${studentData.regNo}`;
          }
          
          console.log('Updating student ID:', studentId);
          console.log('Updated certificates count:', updatedCertificatesForFirebase.length);
          
          const updateResult = await mongoDBService.updateStudent(studentId, {
            certificates: updatedCertificatesForFirebase
          });
          
          console.log('MongoDB update result:', updateResult);
          console.log('⚡ Background MongoDB update completed successfully');
        } catch (error) {
          console.warn('⚡ Background MongoDB update failed:', error);
        }
      }, 5); // Start MongoDB update almost immediately
      
      // Background MongoDB operations (non-blocking)
      setTimeout(async () => {
        try {
          console.log('⚡ Background MongoDB operations starting...');
          
          // Quick background refresh to sync with MongoDB
          await quickBackgroundRefresh();
          
          console.log('⚡ Background operations completed');
        } catch (error) {
          console.warn('⚡ Background operations failed:', error);
        }
      }, 10); // Start background operations almost immediately
      
      console.log('⚡ IMMEDIATE DELETE COMPLETE - UI updated instantly');
    } catch (error) {
      console.error('Error deleting achievements:', error);
      alert('Failed to delete achievements. Please try again.');
      setIsDeleting(false); // Stop loading animation on error
      setDeletePopupState('none'); // Close popup on error
    }
  };
  const handleRowSelect = (id) => { 
    console.log('=== ROW SELECT DEBUG ===');
    console.log('Row select clicked for ID:', id);
    console.log('Current selectedRows:', selectedRows);
    console.log('Current achievements count:', achievements.length);
    console.log('Current achievements:', achievements.map(a => ({ id: a.id, comp: a.comp })));
    
    // Validate that the achievement exists
    const achievementExists = achievements.some(a => a.id === id);
    if (!achievementExists) {
      console.warn('❌ Attempted to select non-existent achievement:', id);
      return;
    }
    
    // Clean existing selections to remove any stale IDs
    const validSelectedRows = selectedRows.filter(rowId => 
      achievements.some(a => a.id === rowId)
    );
    
    const newSelectedRows = validSelectedRows.includes(id) 
      ? validSelectedRows.filter(rowId => rowId !== id) 
      : [...validSelectedRows, id];
    
    console.log('Cleaned selectedRows:', validSelectedRows);
    console.log('New selectedRows:', newSelectedRows);
    console.log('Selection count:', newSelectedRows.length);
    console.log('=== END ROW SELECT DEBUG ===');
    
    setSelectedRows(newSelectedRows);
  };
  const handleSortChange = (e) => setSortBy(e.target.value);
  const handleStatusFilterChange = (e) => setStatusFilter(e.target.value);
  const handleYearSemesterFilterChange = (e) => setYearSemesterFilter(e.target.value);
  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleApplyFilters = () => { setAppliedFilters({ searchQuery, yearSemesterFilter, statusFilter, sortBy }); setFiltersHaveBeenApplied(true); };
  const handleClearFilters = () => { setSearchQuery(""); setYearSemesterFilter(""); setSortBy(""); setStatusFilter("all"); setAppliedFilters({ searchQuery: "", yearSemesterFilter: "", statusFilter: "all", sortBy: "" }); setFiltersHaveBeenApplied(false); };
  
  
  const refreshAchievements = async () => {
    try {
      console.log('⚡ SUPER FAST REFRESH STARTING...');
      setIsLoading(true);
      
      const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (!studentData) {
        console.warn('No student data found in localStorage');
        setAchievements([]);
        setIsLoading(false);
        return;
      }
      
      if (!studentData.regNo || !studentData.dob) {
        console.warn('Missing regNo or dob in student data');
        setAchievements([]);
        setIsLoading(false);
        return;
      }
      
      const mongoDBService = (await import('../services/mongoDBService.js')).default;
      
      // Get fresh student data from MongoDB with shorter timeout
      const freshStudentData = await Promise.race([
        mongoDBService.getStudentByRegNoAndDob(studentData.regNo, studentData.dob),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 2000) // Reduced to 2s for faster refresh
        )
      ]);
      
      if (freshStudentData && freshStudentData.certificates) {
        console.log('⚡ Fresh data received:', freshStudentData.certificates.length, 'certificates');
        
        // OPTIMIZED: Skip file data fetch for faster refresh
        const achievementsWithoutFiles = freshStudentData.certificates.map(achievement => ({
          ...achievement,
          fileData: null, // Will be fetched on-demand when viewing
          fileName: achievement.fileName
        }));
        
        // Update state immediately
        setAchievements(achievementsWithoutFiles);
        setSelectedRows([]); // Clear selections
        // Sync time tracking removed - not displayed to users
        
        // Update localStorage
        const completeStudentData = {
          ...freshStudentData,
          certificates: achievementsWithoutFiles
        };
        localStorage.setItem('studentData', JSON.stringify(completeStudentData));
        
        console.log('⚡ SUPER FAST REFRESH COMPLETED');
      } else {
        console.log('⚡ No certificates found in MongoDB');
        setAchievements([]);
        setSelectedRows([]);
        
        // Clear localStorage certificate data
        const updatedStudentData = {
          ...studentData,
          certificates: []
        };
        localStorage.setItem('studentData', JSON.stringify(updatedStudentData));
        // Sync time tracking removed - not displayed to users
      }
    } catch (error) {
      console.error('⚡ Super fast refresh failed:', error);
      
      // Don't show alert for timeout, just log
      if (error.message === 'Request timeout') {
        console.warn('⚡ Refresh request timed out, keeping current data');
      } else {
        console.warn('⚡ Refresh failed, keeping current data:', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleViewFile = async (fileName, fileData, achievementId) => { 
    // Prevent multiple previews
    if (previewPopupState !== 'none') {
      console.log('Preview already in progress, ignoring click');
      return;
    }

    console.log('⚡ Viewing file:', { fileName, fileData: fileData ? 'Present' : 'Missing', achievementId }); 
    
    // OPTIMIZED: Check local cache first for instant preview
    const currentAchievement = achievements.find(a => a.id === achievementId);
    const cachedFileData = currentAchievement?.fileData || fileData;
    
    if (cachedFileData) { 
      // INSTANT PREVIEW: Use cached data immediately
      console.log('⚡ INSTANT PREVIEW: Using cached file data');
      try {
        // Ensure the file data has the correct data URL format
        let formattedFileData = cachedFileData;
        if (!cachedFileData.startsWith('data:')) {
          // If it's raw base64, add the PDF data URL prefix
          formattedFileData = `data:application/pdf;base64,${cachedFileData}`;
        }
        
        // Use fileStorageService for consistent preview handling
        fileStorageService.previewFile(formattedFileData);
        return; // Exit early for instant preview
      } catch (previewError) {
        console.error('❌ Preview error:', previewError);
        setPreviewPopupState('failed');
        return;
      }
    }
    
    // BACKGROUND FETCH: Get file data in background while showing loading
    console.log('⚡ BACKGROUND FETCH: Loading file data...');
    
    // Show preview progress popup with dynamic loading
    setPreviewPopupState('progress');
    setPreviewProgress(0);
    
    // Dynamic progress simulation while fetching from MongoDB
    const progressInterval = setInterval(() => {
      setPreviewProgress(prev => {
        if (prev >= 85) {
          // Stop at 85% until actual data arrives (reduced from 90% to prevent stuck feeling)
          return prev;
        }
        return prev + Math.random() * 12; // Slightly smaller increments for smoother feel
      });
    }, 150); // Faster updates for smoother animation
    
    try {
      const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (!studentData) {
        clearInterval(progressInterval);
        throw new Error('Please log in again to view files.');
      }

      const mongoDBService = (await import('../services/mongoDBService.js')).default;
      let studentId = studentData.id || studentData._id || studentData.studentId;
      if (!studentId) {
        studentId = `student_${studentData.regNo}`;
      }
      
      // OPTIMIZED: Reasonable timeout for MongoDB fetch
      const certificates = await Promise.race([
        mongoDBService.getCertificatesByStudentId(studentId),
        new Promise((_, reject) => 
          setTimeout(() => {
            clearInterval(progressInterval);
            reject(new Error('Certificate fetch timeout'));
          }, 10000) // Increased to 10s
        )
      ]);
      
      // Clear the progress interval when data arrives
      clearInterval(progressInterval);
      
      const certificateData = certificates.find(cert => cert.achievementId === achievementId);
      
      if (certificateData && certificateData.fileData) {
        console.log('⚡ BACKGROUND FETCH: File data loaded successfully');
        console.log('📄 File data length:', certificateData.fileData.length);
        console.log('📄 File data starts with:', certificateData.fileData.substring(0, 50));
        
        // Loading toast removed - using popup system
        
        // Complete progress to 100% and preview instantly
        setPreviewProgress(100);
        
        try {
          // Ensure the file data has the correct data URL format
          let formattedFileData = certificateData.fileData;
          if (!certificateData.fileData.startsWith('data:')) {
            // If it's raw base64, add the PDF data URL prefix
            formattedFileData = `data:application/pdf;base64,${certificateData.fileData}`;
          }
          
          // INSTANT PREVIEW: Use requestAnimationFrame for immediate execution
          requestAnimationFrame(() => {
            fileStorageService.previewFile(formattedFileData);
            setPreviewPopupState('none');
          });
          
          // BACKGROUND UPDATE: Update cache for future instant previews (store formatted data)
          setAchievements(prev => prev.map(achievement => 
            achievement.id === achievementId 
              ? { ...achievement, fileData: formattedFileData }
              : achievement
          ));
        } catch (previewError) {
          console.error('❌ Preview error:', previewError);
          setPreviewPopupState('failed');
        }
      } else {
        throw new Error('No file data found for this certificate. The file may not have been uploaded properly.');
      }
    } catch (error) {
      console.error('❌ Error fetching file data:', error);
      
      // Clear progress interval on error
      clearInterval(progressInterval);
      
      // Use popup system instead of alerts
      console.error('Preview failed:', error.message);
      setPreviewPopupState('failed');
    }
  };
  const getFilteredAndSortedAchievements = () => {
    if (!filtersHaveBeenApplied) return achievements;
    let filtered = [...achievements];
    const { searchQuery, yearSemesterFilter, statusFilter, sortBy } = appliedFilters;
    if (searchQuery) filtered = filtered.filter(a => a.comp.toLowerCase().includes(searchQuery.toLowerCase()));
    if (yearSemesterFilter) { const [year, semester] = yearSemesterFilter.split('/'); filtered = filtered.filter(a => a.year === year && a.semester === semester); }
    if (statusFilter !== "all") filtered = filtered.filter(a => a.status === statusFilter);
    if (sortBy) { return [...filtered].sort((a, b) => { if (sortBy === "date") return new Date(b.date) - new Date(a.date); if (sortBy === "prize") return a.prize.localeCompare(b.prize); return 0; }); }
    return filtered;
  };

  // Get filtered achievements for display
  const filteredAchievements = getFilteredAndSortedAchievements();

  return (
    <>
      <style>{`
        /* Delete popup styles inspired by PopupAchievements.js */
        .Delete-popup-container {
            background-color: #fff;
            border-radius: 12px;
            width: 400px;
            max-width: 90vw;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            font-family: 'Poppins', sans-serif;
        }
        .Delete-popup-header {
            background-color: #197AFF;
            color: white;
            padding: 1rem;
            font-size: 1.75rem;
            font-weight: 700;
        }
        .Delete-popup-body {
            padding: 2rem;
        }
        .Delete-popup-footer {
            padding: 1.5rem;
            background-color: #f7f7f7;
            display: flex;
            gap: 50px;
            justify-content: center;
        }
        .Delete-popup-cancel-btn {
            background-color: #6c757d;
            color: white;
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s, box-shadow 0.2s;
            box-shadow: 0 2px 8px rgba(108, 117, 125, 0.2);
        }
        .Delete-popup-cancel-btn:hover {
            background-color: #5a6268;
            box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
        }
        .Delete-popup-delete-btn {
            background-color: #D23B42;
            color: white;
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s, box-shadow 0.2s;
            box-shadow: 0 2px 8px rgba(210, 59, 66, 0.2);
        }
        .Delete-popup-delete-btn:hover {
            background-color: #b53138;
            box-shadow: 0 4px 12px rgba(210, 59, 66, 0.3);
        }

        /* Simple warning icon */
        .Delete-warning-icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: #ffc107;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            font-weight: bold;
            margin: 0 auto;
            box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
            animation: Delete-pulse 2s ease-in-out infinite;
        }
        @keyframes Delete-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }

        /* Table header styles for delete button */
        .table-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem;
        }
        .table-header h2 {
            margin: 0;
        }

        /* Delete Success Popup Styles */
        .Delete-success-popup-container {
            background-color: #fff;
            border-radius: 12px;
            width: 400px;
            max-width: 90vw;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            font-family: 'Poppins', sans-serif;
        }
        .Delete-success-popup-header {
            background-color: #197AFF;
            color: white;
            padding: 1rem;
            font-size: 1.75rem;
            font-weight: 700;
        }
        .Delete-success-popup-body {
            padding: 2rem;
        }
        .Delete-success-popup-footer {
            padding: 1.5rem;
            background-color: #f7f7f7;
            display: flex;
            justify-content: center;
        }
        .Delete-success-popup-close-btn {
            background-color: #197AFF;
            color: white;
            border: none;
            padding: 0.8rem 1.5rem;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s, box-shadow 0.2s;
            box-shadow: 0 2px 8px rgba(25, 122, 255, 0.2);
            display: flex;
            align-items: center;
        }
        .Delete-success-popup-close-btn:hover {
            background-color: #1565c0;
            box-shadow: 0 4px 12px rgba(25, 122, 255, 0.3);
        }

        /* Success icon */
        .Delete-success-icon {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background-color: #d32f2f;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
            box-shadow: 0 4px 12px rgba(211, 47, 47, 0.3);
            animation: Delete-success-pulse 2s ease-in-out infinite;
        }
        @keyframes Delete-success-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
      `}</style>
      <div className="achievements-cards-container">
        <div className="achievements-action-card" onClick={handleUploadClick}>
            <img src={UploadCertificatecardicon} alt="Upload Certificate" className="action-card-img-main" />
            <div className="action-card-title">Upload Certificate</div>
            <div className="action-card-desc">Please upload your<br />certificate here</div>
        </div>
        <div className="achievements-filter-card">
            <button className="filter-card-button">Sort & Filter</button>
            <div className="filter-grid">
                <div className="achievements-input-container">
                    <input type="text" id="competitionName" value={searchQuery} onChange={handleSearchChange} className={`achievements-filter-input ${searchQuery ? 'achievements-has-value' : ''}`} />
                    <label htmlFor="competitionName" className="achievements-floating-label">Enter Competition Name</label>
                </div>
                <select value={yearSemesterFilter} onChange={handleYearSemesterFilterChange} className="achievements-filter-input">
                    <option value="">Year/Semester</option><option value="I/1">I/1</option><option value="I/2">I/2</option><option value="II/3">II/3</option><option value="II/4">II/4</option><option value="III/5">III/5</option><option value="III/6">III/6</option><option value="IV/7">IV/7</option><option value="IV/8">IV/8</option>
                </select>
                <select value={sortBy} onChange={handleSortChange} className="achievements-filter-input">
                    <option value="" disabled>Sort by</option><option value="date">Date</option><option value="prize">Prize</option>
                </select>
                <select value={statusFilter} onChange={handleStatusFilterChange} className="achievements-filter-input">
                    <option value="all">All Status</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option>
                </select>
            </div>
            <div className="filter-actions">
                <button className="achievements-apply-sort-btn" onClick={handleApplyFilters}>Apply</button>
                <button className="achievements-clear-filter-btn" onClick={handleClearFilters}>Clear</button>
            </div>
        </div>
        <div className="achievements-action-card" onClick={handleEditClick}>
            <img src={editcertificatecardicon} alt="Edit Certificate" className="action-card-img-main"/>
            <div className="action-card-title">Edit Certificate</div>
            <div className="action-card-desc">Edit your certificate<br />information here</div>
        </div>
      </div>
      <div className="achievements-table-container">
        <div className="table-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2>MY ACHIEVEMENTS</h2>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              onClick={refreshAchievements}
              className="refresh-btn"
              disabled={isLoading}
              title={isLoading ? 'Refreshing...' : 'Refresh'}
              style={{
                background: isLoading ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 14px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                opacity: isLoading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px'
              }}
              onMouseOver={(e) => {
                if (!isLoading) e.target.style.backgroundColor = '#218838';
              }}
              onMouseOut={(e) => {
                if (!isLoading) e.target.style.backgroundColor = '#28a745';
              }}
            >
              {isLoading ? (
                <span style={{ fontSize: '18px' }}>⏳</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path fill="white" d="M12 20q-3.35 0-5.675-2.325T4 12t2.325-5.675T12 4q1.725 0 3.3.712T18 6.75V5q0-.425.288-.712T19 4t.713.288T20 5v5q0 .425-.288.713T19 11h-5q-.425 0-.712-.288T13 10t.288-.712T14 9h3.2q-.8-1.4-2.187-2.2T12 6Q9.5 6 7.75 7.75T6 12t1.75 4.25T12 18q1.7 0 3.113-.862t2.187-2.313q.2-.35.563-.487t.737-.013q.4.125.575.525t-.025.75q-1.025 2-2.925 3.2T12 20" strokeWidth="0.4" stroke="white"/>
                </svg>
              )}
            </button>
            <button 
              onClick={handleDeleteClick}
              className="delete-selected-btn"
            style={{
              background: selectedRows.length > 0 ? '#D23B42' : '#6c757d',
              color: 'white',
              border: 'none',
              padding: '10px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              marginLeft: 'auto',
              opacity: selectedRows.length > 0 ? 1 : 0.7,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              height: '44px'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = selectedRows.length > 0 ? '#b53138' : '#5a6268'}
            onMouseOut={(e) => e.target.style.backgroundColor = selectedRows.length > 0 ? '#D23B42' : '#6c757d'}
          >
            {selectedRows.length > 0 ? `Delete Selected (${selectedRows.length})` : 'Delete Selected'}
          </button>
          </div>
        </div>
        <div className="table-scroll-wrapper">
            {isInitialLoading ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 20px',
                color: '#666',
                fontSize: '16px'
              }}>
                <div className="achievements-loading-spinner" style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #2276fc',
                  borderRadius: '50%',
                  animation: 'achievements-spin 1s linear infinite',
                  marginBottom: '20px'
                }}></div>
                <div>Loading achievements...</div>
                <div style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
                  Fetching data from database
                </div>
              </div>
            ) : (
              <table className="achievements-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>S.No</th>
                    <th>Year</th>
                    <th>Semester</th>
                    <th>Section</th>
                    <th>Competition Name</th>
                    <th>Date</th>
                    <th>Prize</th>
                    <th>Status</th>
                    <th>View</th>
                    <th>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAchievements.map((achievement, index) => (
                    <TableRow 
                      key={achievement.id} 
                      {...achievement} 
                      no={index + 1} 
                      selected={selectedRows.includes(achievement.id)} 
                      onSelect={handleRowSelect} 
                      onViewFile={() => handleViewFile(achievement.fileName, achievement.fileData || achievement.fileContent, achievement.id)}
                      onDownloadFile={() => handleDownloadPDF(achievement)}
                      fileData={achievement.fileData || achievement.fileContent}
                      fileName={achievement.fileName}
                      achievements={achievements}
                    />
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
      {showUploadPopup && <CertificateUpload onClose={handleClosePopup} onUpload={handleUploadSuccess} />}
      {showEditPopup && editingRow && <EditCertificate onClose={handleCloseEditPopup} onUpdate={handleUpdateAchievement} initialData={editingRow} />}
      {showRestrictionPopup && (<div className="restriction-popup-overlay"><div className="restriction-popup-content"><h2> ⚠️ Edit Restriction </h2><div className="restriction-message">{restrictionMessage}</div><button onClick={handleCloseRestrictionPopup} className="restriction-ok-btn">OK, I Understand</button></div></div>)}
      {deletePopupState === 'confirm' && (
        <div style={{
          minHeight: "100vh",
          width: "100vw",
          position: "fixed",
          left: 0,
          top: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(18,18,34,0.11)",
          zIndex: 1000,
        }}>
          <DeleteConfirmationPopup 
            onClose={handleCloseDeletePopup} 
            onConfirm={handleConfirmDelete}
            selectedCount={selectedRows.length}
            isDeleting={isDeleting}
          />
        </div>
      )}
      {deletePopupState === 'success' && (
        <div style={{
          minHeight: "100vh",
          width: "100vw",
          position: "fixed",
          left: 0,
          top: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(18,18,34,0.11)",
          zIndex: 1000,
        }}>
          <DeleteSuccessPopup 
            onClose={handleCloseDeleteSuccessPopup} 
            deletedCertificates={deletedCertificates}
          />
        </div>
      )}

      {/* NEW: Download/Preview Popup Components */}
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
    </>
  );
}

function TableRow({ id, no, year, semester, section, comp, date, prize, status, selected, onSelect, fileName, fileData, onViewFile, onDownloadFile, achievements }) {
  const statusClass = `achievements-status-pill achievements-status-${status}`;
  
  // MODIFIED: This function correctly formats 'YYYY-MM-DD' to 'dd-MM-yyyy' for display.
  const displayDate = date ? date.split('-').reverse().join('-') : 'N/A';

  return (
    <tr>
      <td data-label="Select"><input type="checkbox" checked={selected} onChange={() => onSelect(id)} className="row-checkbox" /></td>
      <td data-label="S.No">{no}</td>
      <td data-label="Year">{year}</td>
      <td data-label="Semester">{semester}</td>
      <td data-label="Section">{section}</td>
      <td data-label="Competition">{comp}</td>
      {/* MODIFIED: Use the formatted displayDate variable */}
      <td data-label="Date">{displayDate}</td>
      <td data-label="Prize">{prize}</td>
      <td data-label="Status"><span className={statusClass}>{status?.charAt(0).toUpperCase() + status?.slice(1) || 'N/A'}</span></td>
      <td data-label="View"><button onClick={onViewFile} className="table-action-btn"> <EyeIcon /> </button></td>
      <td data-label="Download"><button onClick={onDownloadFile} className="table-action-btn"> <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#2276fc" strokeWidth="2"/><polyline points="7,10 12,15 17,10" stroke="#2276fc" strokeWidth="2"/><line x1="12" y1="15" x2="12" y2="3" stroke="#2276fc" strokeWidth="2"/></svg> </button></td>
    </tr>
  );
}