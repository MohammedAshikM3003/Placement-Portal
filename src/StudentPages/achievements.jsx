import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar/Navbar.js';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import CertificateUpload from "./PopupAchievements.jsx";
import EditCertificate from "./popupEditAchievements.jsx";
// FIX: Import the CSS Module into a 'styles' object
import styles from './Achievements.module.css';
import UploadCertificatecardicon from '../assets/UploadCertificatecardicon.svg';
import editcertificatecardicon from '../assets/editcertificatecardicon.svg';
// REMOVED: Redundant static imports for mongoDBService, certificateService, and fastDataService
// The code now relies solely on dynamic imports inside functions for stability and performance.


// NEW: Import download/preview alerts
import { 
  DownloadFailedAlert, 
  DownloadSuccessAlert, 
  DownloadProgressAlert, 
  PreviewFailedAlert, 
  PreviewProgressAlert,
  ErrorAlert
} from '../components/alerts';



// Delete Confirmation Popup Component - Matches PopupAchievements style
const DeleteConfirmationPopup = ({ onClose, onConfirm, selectedCount, isDeleting }) => (
  // FIX: Converted className to styles.className
  <div className={styles['Achievement-popup-container']}> 
    <div className={styles['Achievement-popup-header']}>Delete Certificate</div>
    <div className={styles['Achievement-popup-body']}>
      <svg className={styles['Achievement-warning-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
        <circle className={styles['Achievement-warning-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
        {/* FIX: Set stroke color to #ffffff as requested */}
        <path d="M26 16v12M26 34v2" stroke="#ffffff" strokeWidth="3" fill="none"/>
      </svg>
      <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#333", fontWeight: "600" }}>
        Are you sure?
      </h2>
      <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
        Do you want to delete {selectedCount} selected certificate{selectedCount > 1 ? 's' : ''}?
      </p>
    </div>
    <div className={styles['Achievement-popup-footer']}>
      <button onClick={onClose} className={styles['Achievement-popup-cancel-btn']} disabled={isDeleting}>
        Discard
      </button>
      <button onClick={onConfirm} className={styles['Achievement-popup-delete-btn']} disabled={isDeleting}>
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
    // FIX: Converted className to styles.className
    <div className={styles['Achievement-popup-container']}>
      <div className={styles['Achievement-popup-header']}>Deleted !</div>
      <div className={styles['Achievement-popup-body']}>
        <svg className={styles['Achievement-delete-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
          <circle className={styles['Achievement-delete-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
          <g className={styles['Achievement-delete-icon--bin']} fill="none" strokeWidth="2">
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
      <div className={styles['Achievement-popup-footer']}>
          <button onClick={onClose} className={styles['Achievement-popup-close-btn']}>
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

  // FIX: Overwrite onLogout to include aggressive localStorage clearing
  const handleLogoutWithClear = () => {
      import('../services/fastDataService.jsx').then(({ default: fastDataService }) => {
          fastDataService.clearAllLocalStorageData(); // Full cache wipe
          onLogout(); // Proceed with standard logout navigation
      });
  };

  // ⚡ INSTANT: Load student data immediately from cache/localStorage
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
    
    // ⚡ INSTANT: Load from localStorage immediately
    try {
      const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (storedStudentData) {
        console.log('⚡ Achievements: INSTANT load from localStorage');
        setStudentData(storedStudentData);
        
        // Try to get cached certificates data
        const certificatesData = localStorage.getItem('certificatesData');
        if (certificatesData) {
          console.log('⚡ Achievements: INSTANT certificates data from cache');
          // Certificates data is already cached and ready
        }
        
        // Try to get even faster cached data
        if (storedStudentData._id) {
          // FIX: Pass the storedStudentData object directly to avoid scope issues
          import('../services/fastDataService.jsx').then(({ default: fastDataService }) => {
            const instantData = fastDataService.getInstantData(storedStudentData._id);
            if (instantData && instantData.student) {
              console.log('⚡ Achievements: INSTANT load from cache');
              setStudentData(instantData.student);
            }
          });
        }
        
        // Dispatch immediate profile update for sidebar
        if (storedStudentData.profilePicURL) {
          console.log('🚀 Achievements: Dispatching immediate profile update for sidebar');
          window.dispatchEvent(new CustomEvent('profileUpdated', { 
            detail: storedStudentData 
          }));
        }
      }
    } catch (error) {
      console.warn("Could not parse studentData from localStorage on init:", error);
      localStorage.removeItem('studentData'); // Clear bad data
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

  const handleViewChange = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
    setIsSidebarOpen(false);
  };

  return (
    // FIX: Converted className to styles.className
    <div className={styles.container}>
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      {/* FIX: Converted className to styles.className */}
      <div className={styles.main}>
        <Sidebar
          isOpen={isSidebarOpen}
          onLogout={handleLogoutWithClear}
          onViewChange={handleViewChange}
          currentView={'achievements'} // Hardcode 'achievements'
          studentData={studentData}
        />
        {/* FIX: Converted className to styles.className */}
        <div className={`${styles['achievements-area']} ${styles['dashboard-area']}`}>
          <AchievementsContent />
        </div>
      </div>
      {/* FIX: Converted className to styles.className */}
      {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
  );
}

// The rest of the file (AchievementsContent, etc.) remains unchanged.
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
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // For initial page load animation
  const [, setStudentData] = useState(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorAlertMsg, setErrorAlertMsg] = useState('');
  // Removed lastSyncTime state - no longer displayed to users

  // 🔥 FIX 1: Set MIN_LOADER_MS to 500ms for optimal perceived loading time
  const MIN_LOADER_MS = 500;

  const getCertificateKey = useCallback((item = {}) => {
    return (
      item.achievementId ||
      item.id ||
      item.certificateId ||
      item._id ||
      ''
    ).toString();
  }, []);

  const haveCertificatesChanged = useCallback((previous = [], incoming = []) => {
    if (!Array.isArray(previous) || !Array.isArray(incoming)) {
      return true;
    }

    if (previous.length !== incoming.length) {
      return true;
    }

    const normalizeValue = (value) => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return value.trim();
      if (value instanceof Date) return value.toISOString();
      return String(value);
    };

    const keysToCompare = [
      'status',
      'rawStatus',
      'verifiedAt',
      'verifiedBy',
      'prize',
      'date',
      'year',
      'semester',
      'section',
      'department',
      'degree',
      'comp',
      'competition',
      'reg',
      'regNo',
      'uploadDate',
      'updatedAt'
    ];

    const previousMap = new Map(previous.map((item) => [getCertificateKey(item), item]));

    for (const nextItem of incoming) {
      const id = getCertificateKey(nextItem);
      const prevItem = previousMap.get(id);

      if (!prevItem) {
        return true;
      }

      for (const key of keysToCompare) {
        if (normalizeValue(prevItem[key]) !== normalizeValue(nextItem?.[key])) {
          return true;
        }
      }
    }

    return false;
  }, [getCertificateKey]);

  const mergeCertificateMetadata = useCallback((previous = [], incoming = []) => {
    const previousMap = new Map(previous.map((item) => [getCertificateKey(item), item]));

    return incoming.map((item) => {
      const key = getCertificateKey(item);
      const previousItem = previousMap.get(key) || {};

      const merged = {
        ...item,
        id: item.achievementId || item.id || key,
        achievementId: item.achievementId || previousItem.achievementId || key,
        certificateId:
          item.certificateId ||
          item._id ||
          previousItem.certificateId ||
          key,
      };

      // Preserve client-only fields if backend does not send them
      if (previousItem.fileData && !merged.fileData) {
        merged.fileData = previousItem.fileData;
      }

      if (previousItem.localStatusOverride && !merged.localStatusOverride) {
        merged.localStatusOverride = previousItem.localStatusOverride;
      }

      return merged;
    });
  }, [getCertificateKey]);

  // Move refreshAchievements function here and wrap it with useCallback
  const refreshAchievements = useCallback(async (isBackground = false) => {
    const startedAt = Date.now();
    try {
      console.log('⚡ SUPER FAST REFRESH STARTING...');
      // Only show loader if it's the initial load or a user-triggered refresh
      if (!isBackground) {
          setIsLoading(true);
      }
      
      let studentData = null;
      try {
        studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      } catch (e) {
        console.warn('No student data found in localStorage for refresh');
      }
      
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
      
      const fastDataService = (await import('../services/fastDataService.jsx')).default;
      const completeData = await Promise.race([
        fastDataService.getCompleteStudentData(studentData._id || studentData.id, false),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      ]);
      const freshStudentData = completeData?.student;
      
      if (freshStudentData && freshStudentData.certificates) {
        console.log('⚡ Fresh data received:', freshStudentData.certificates.length, 'certificates');

        const certificatesFromBackend = freshStudentData.certificates;
        const shouldUpdateAchievements = haveCertificatesChanged(achievements, certificatesFromBackend);

        if (shouldUpdateAchievements) {
          console.log('🔄 Certificate metadata changed. Updating achievements state.');
          const mergedCertificates = mergeCertificateMetadata(achievements, certificatesFromBackend);
          setAchievements(mergedCertificates);
          setSelectedRows([]);
        } else {
          console.log('✅ Certificate metadata unchanged. Skipping state update.');
        }

        const completeStudentData = {
          ...freshStudentData,
          certificates: certificatesFromBackend
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
        setErrorAlertMsg(error.message || 'Failed to refresh achievements');
        setShowErrorAlert(true);
      }
    } finally {
      const elapsed = Date.now() - startedAt;
      // Apply minimum load time
      const waitMs = Math.max(0, MIN_LOADER_MS - elapsed);
      if (waitMs > 0) {
        await new Promise(resolve => setTimeout(resolve, waitMs));
      }
      setIsLoading(false);
    }
  }, [MIN_LOADER_MS, achievements]); // Added MIN_LOADER_MS and achievements to dependencies

  // Super fast background refresh function (optimized)
  const quickBackgroundRefresh = useCallback(async () => {
    try {
      // This is now purely a background job without a visible loading state
      console.log('⚡ Super fast background refresh...');
      const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (studentData && studentData._id) {
        // Ultra-fast timeout for maximum speed
        const fastDataService = (await import('../services/fastDataService.jsx')).default;
        const completeData = await Promise.race([
          fastDataService.getCompleteStudentData(studentData._id || studentData.id, false),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 10000)
          )
        ]);
        const freshStudentData = completeData?.student;
        
        if (freshStudentData && freshStudentData.certificates) {
          // Get correct student ID
          let studentId = studentData.id || studentData._id || studentData.studentId;
          if (!studentId) {
            studentId = `student_${studentData.regNo}`;
          }

          if (haveCertificatesChanged(achievements, freshStudentData.certificates)) {
            const mergedCertificates = mergeCertificateMetadata(achievements, freshStudentData.certificates);
            setAchievements(mergedCertificates);
            setSelectedRows([]); // Clear selections on refresh
            console.log('⚡ Super fast background refresh detected updates.');
          }

          // Sync time tracking removed - not displayed to users
          console.log('⚡ Super fast background refresh completed');
        } else {
          setAchievements([]);
          setSelectedRows([]);
          console.log('⚡ Super fast background refresh - no certificates found');
        }
      }
    } catch (error) {
      // Keep this console.warn to capture failures but do not trigger UI alerts
      console.warn('Super fast background refresh failed:', error);
    }
  }, []);

  // ⚡ INSTANT: Load student data and achievements on component mount
  useEffect(() => {
    // Start loading immediately
    setIsInitialLoading(true);
    
    try {
      // ⚡ INSTANT: Try to get preloaded certificates data first (now only metadata, not fileData)
      const certificatesData = localStorage.getItem('certificatesData');
      if (certificatesData) {
        try {
          const parsedCertificates = JSON.parse(certificatesData);
          console.log('⚡ Achievements: INSTANT certificates from preloaded cache');
          setAchievements(parsedCertificates);
          // Keep initial loader visible until fresh fetch completes
          setIsLoading(true);
        } catch (error) {
          console.error('Error parsing preloaded certificates:', error);
          // If parsing fails, clear the bad data
          localStorage.removeItem('certificatesData');
        }
      }
      
      // ⚡ INSTANT: Show cached student data immediately if available
      const cachedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (cachedStudentData) {
        console.log('⚡ Achievements: INSTANT student data from localStorage');
        setStudentData(cachedStudentData);
        
        // If we have certificates in student data and no preloaded certificates
        if (cachedStudentData.certificates) {
          console.log('⚡ Achievements: Using certificates from student data');
          setAchievements(cachedStudentData.certificates);
          // Keep initial loader visible until fresh fetch completes
          setIsLoading(true);
        }
        
        // Try to get even faster cached data from fastDataService
        if (cachedStudentData._id) {
          import('../services/fastDataService.jsx').then(({ default: fastDataService }) => {
            const instantData = fastDataService.getInstantData(cachedStudentData._id);
            if (instantData && instantData.certificates) {
              console.log('⚡ Achievements: INSTANT certificates from fastDataService cache');
              setAchievements(instantData.certificates);
              // Keep initial loader visible until fresh fetch completes
              setIsLoading(true);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading data from localStorage cache:', error);
      // If any cache logic fails, clear it to prevent future errors
      localStorage.removeItem('studentData');
      localStorage.removeItem('certificatesData');
    }
    
    // Then load fresh data from MongoDB in background
    // This will now run even if the cache parsing above fails
    loadStudentData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        let studentData = null;
        try {
          studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        } catch (e) {
          console.warn('Invalid studentData in localStorage during auto-sync');
        }

        if (studentData && studentData._id) {
          // Add timeout to prevent hanging
          const fastDataService = (await import('../services/fastDataService.jsx')).default;
          const completeData = await Promise.race([
            fastDataService.getCompleteStudentData(studentData._id || studentData.id, false),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Auto-sync timeout')), 10000)
            )
          ]);
          const freshStudentData = completeData?.student;
          
          if (freshStudentData && freshStudentData.certificates) {
            if (haveCertificatesChanged(achievements, freshStudentData.certificates)) {
              console.log('🔄 Auto-sync detected certificate updates. Refreshing...');
              await refreshAchievements(true);
            } else {
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
  }, [achievements.length, selectedRows.length, cleanStaleSelections, refreshAchievements]);

  // Auto-refresh when user returns to page (focus event)
  useEffect(() => {
    const handleFocus = async () => {
      console.log('🔄 Page focused, checking for updates...');
      try {
        let studentData = null;
        try {
          studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        } catch (e) {
          console.warn('Invalid studentData in localStorage during focus refresh');
        }

        if (studentData && studentData._id) {
          // Add timeout to prevent hanging
          const fastDataService = (await import('../services/fastDataService.jsx')).default;
          const completeData = await Promise.race([
            fastDataService.getCompleteStudentData(studentData._id || studentData.id, false),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Focus refresh timeout')), 10000)
            )
          ]);
          const freshStudentData = completeData?.student;
          
          if (freshStudentData && freshStudentData.certificates) {
            if (haveCertificatesChanged(achievements, freshStudentData.certificates)) {
              console.log('🔄 Focus refresh detected certificate updates.');
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
  }, [achievements.length, selectedRows.length, refreshAchievements]);

  const loadStudentData = async () => {
    try {
      console.log('⚡ FAST LOADING STUDENT DATA FROM MONGODB ===');
      
      // ALWAYS clear selections first to prevent stale state
      setSelectedRows([]);
      console.log('🔄 Cleared selections on page load');
      
      // Get student data from localStorage for authentication
      // NEW: Safely parse this
      let studentData = null;
      try {
        studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      } catch (e) {
        console.warn('Invalid studentData in localStorage, will fetch fresh.');
      }

      if (!studentData) {
        console.log('No student data found in localStorage');
        setAchievements([]);
        setIsInitialLoading(false); // Make sure to stop loading
        return;
      }
      
      console.log('Student data from localStorage:', studentData);
      setStudentData(studentData);
      
      // Load ONLY from MongoDB using fastDataService - no localStorage fallback with timeout
      const fastDataService = (await import('../services/fastDataService.jsx')).default;
      console.log('⚡ Fetching latest data from MongoDB with timeout...');
      
      const completeData = await Promise.race([
        fastDataService.getCompleteStudentData(studentData._id || studentData.id, false),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Load timeout')), 10000)
        )
      ]);
      
      const freshStudentData = completeData?.student;
      
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
          return; // Already cleared, no need to continue
        }
      }
      
      if (freshStudentData && freshStudentData.certificates) {
        console.log('MongoDB data received:', freshStudentData.certificates.length, 'certificates');

        if (haveCertificatesChanged(achievements, freshStudentData.certificates)) {
          const mergedCertificates = mergeCertificateMetadata(achievements, freshStudentData.certificates);
          setAchievements(mergedCertificates);
          setSelectedRows([]);
        }

        setStudentData(freshStudentData);
        const completeStudentData = {
          ...freshStudentData,
          certificates: freshStudentData.certificates
        };
        localStorage.setItem('studentData', JSON.stringify(completeStudentData));
        console.log('✅ Data synced with MongoDB successfully');
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
      // ===== THIS IS THE CORRECTED BLOCK =====
      console.error('⚡ Error loading student data:', error);
      
      if (error.message === 'Load timeout') {
        console.warn('⚡ Load timeout - using cached data if available');
        
        // NEW: Safely try to use cached data from localStorage
        try {
          const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
          if (studentData && studentData.certificates) {
            setAchievements(studentData.certificates);
          } else {
            setAchievements([]);
          }
        } catch (cacheError) {
          console.error('⚡ Fallback to cache FAILED, localStorage is invalid:', cacheError);
          setAchievements([]); // Show empty table
        }

      } else {
        // A different error happened (not a timeout)
        setAchievements([]);
        setErrorAlertMsg(error.message || 'Failed to load achievements');
        setShowErrorAlert(true);
      }
      // ==========================================
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false); // Stop initial loading animation
      console.log('⚡ LOADING COMPLETE ===');
    }
  };

  const handleUploadClick = () => setShowUploadPopup(true);
  const handleClosePopup = () => setShowUploadPopup(false);
  
  /**
   * Handles successful upload from the popup.
   * This function now triggers a full refresh of the table.
   */
  const handleUploadSuccess = async (newAchievement) => {
    try {
      console.log('🚀 FAST: Starting certificate upload...');
      
      // Get student data from localStorage
      let studentData = null;
      try {
        studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      } catch (e) {
        throw new Error('User not authenticated. Please log in again.');
      }

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
      const certificateService = (await import('../services/certificateService.jsx')).default;

      const result = await certificateService.uploadCertificate(
        studentId,
        newAchievement,
        newAchievement.fileData
      );

      console.log('✅ Certificate uploaded successfully:', result.certificate._id);

      // Update student's certificates metadata so the table can render it
      const mongoDB = (await import('../services/mongoDBService.jsx')).default;
      const fastDataService = (await import('../services/fastDataService.jsx')).default;
      const metaId = result.certificate.achievementId || String(Date.now());
      const { fileData, fileSize, fileType, createdAt, _id, ...meta } = newAchievement;
      const newMeta = { ...meta, id: metaId };
      const updatedCertificatesForFirebase = [...achievements].map(a => {
        const { fileData, ...rest } = a;
        return rest;
      }).concat([newMeta]);

      await mongoDB.updateStudent(studentId, { certificates: updatedCertificatesForFirebase });
      // Clear caches to force fresh data fetch
      fastDataService.clearCache(studentId);

      const uploadedCertificateKey = getCertificateKey(result.certificate) || metaId;

      const waitForBackendSync = async () => {
        const MAX_ATTEMPTS = 6;
        const DELAY_MS = 700;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
          console.log(`🔄 Waiting for backend sync (attempt ${attempt}/${MAX_ATTEMPTS})...`);
          const completeData = await fastDataService.getCompleteStudentData(studentId, false);
          const freshStudentData = completeData?.student;
          const certificatesFromBackend = freshStudentData?.certificates || [];

          const hasUploadedCertificate = certificatesFromBackend.some((certificate) => {
            const backendKey = getCertificateKey(certificate);
            return backendKey === uploadedCertificateKey || backendKey === metaId;
          });

          if (hasUploadedCertificate && freshStudentData) {
            console.log('✅ Backend sync detected. Updating achievements state.');

            setAchievements((prev) => mergeCertificateMetadata(prev, certificatesFromBackend));
            setStudentData(freshStudentData);
            setSelectedRows([uploadedCertificateKey]);

            const normalizedStudentData = {
              ...freshStudentData,
              certificates: certificatesFromBackend,
            };
            localStorage.setItem('studentData', JSON.stringify(normalizedStudentData));

            return;
          }

          await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
        }

        throw new Error('Certificate uploaded but latest data is not yet available. Please refresh and try again.');
      };

      setIsLoading(true);
      await waitForBackendSync();
      console.log('✅ Certificate upload completed, table shows latest data');

    } catch (error) {
      console.error('❌ Certificate upload failed:', error);
      throw error; // Re-throw to show error popup
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = () => { 
    console.log('Edit clicked. Selected rows:', selectedRows);
    console.log('Selected rows length:', selectedRows.length);
    
    if (selectedRows.length === 1) { 
      const selected = achievements.find(a => a.id === selectedRows[0]); 
      console.log('Found selected achievement:', selected);
      
      if (selected.status === "approved" || selected.status === "rejected") { 
        setRestrictionMessage(`❌ Cannot edit ${selected.status} achievements!

This record is locked and cannot be modified.

📝 Only pending records can be edited.`); 
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
  
  /**
   * Handles successful update from the edit popup.
   * This function triggers a quick background refresh.
   */
  const handleUpdateAchievement = async (updated) => {
    try {
      console.log('=== UPDATE START ===');
      console.log('Updated achievement received:', updated);
      
      // Get MongoDB service early for optimization
      const mongoDBService = (await import('../services/mongoDBService.jsx')).default;
      
      // Get student data from localStorage
      let studentData = null;
      try {
        studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      } catch (e) {
        throw new Error('User not authenticated');
      }
      
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
            existingCertificate = await mongoDBService.getCertificateFileByAchievementId(studentId, updated.id);
            console.log('🔍 Existing certificate found:', existingCertificate ? 'YES' : 'NO');
            if (existingCertificate) {
              console.log('🔍 Existing certificate details:', {
                _id: existingCertificate._id,
                fileName: existingCertificate.fileName,
                achievementId: existingCertificate.achievementId
              });
            }
          } catch (error) {
            if (error.message.includes('Certificate not found.')) {
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
      
      // This call relies on the increased timeout in mongoDBService.jsx (Fix 1)
      const updateResult = await mongoDBService.updateStudent(studentId, {
        certificates: updatedCertificatesForFirebase
      });
      console.log('MongoDB update result:', updateResult);
      console.log('Firebase update completed successfully');
      
      // FIX: Clear the fastDataService cache to ensure the subsequent fetch 
      // hits the database and not the stale cache layer. This fixes the manual refresh issue.
      const fastDataService = (await import('../services/fastDataService.jsx')).default;
      fastDataService.clearCache(studentId);
      
      setIsLoading(true);
      await refreshAchievements();
      const updatedId = updated.id;
      if (updatedId) {
        setSelectedRows([updatedId]);
      }
      
      console.log('=== UPDATE COMPLETE ===');
    } catch (error) {
      console.error('Error updating achievement:', error);
      // Re-throw with generic message if error is a timeout, as the popup is showing the stack trace.
      if (error.message.includes('timeout')) {
         throw new Error('Failed to update achievement. The request timed out. Please check your network or try again.');
      }
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
    const achievementId = certificateData.id;
    
    // Set progress interval early to show loading animation
    setDownloadPopupState('progress');
    setDownloadProgress(0);
    progressInterval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 85) { return prev; }
        return prev + Math.random() * 12;
      });
    }, 150);

    try {
      
      // Check if we have file data first
      if (!certificateData?.fileData) {
        // Try to fetch file data from backend using the same method as preview
        try {
          let studentData = null;
          try {
            studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
          } catch(e) {
            throw new Error('Please log in again to download files.');
          }

          if (!studentData) {
            throw new Error('Please log in again to download files.');
          }

          let studentId = studentData.id || studentData._id || studentData.studentId;
          if (!studentId) {
            studentId = `student_${studentData.regNo}`;
          }

          // Use the dedicated single-file fetch instead of the slow method
          const mongoDBService = (await import('../services/mongoDBService.jsx')).default;
          
          const certificateDataResponse = await Promise.race([
            mongoDBService.getCertificateFileByAchievementId(studentId, achievementId), // <-- NEW EFFICIENT METHOD
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Certificate file fetch timeout')), 30000) 
            )
          ]);

          const foundFileData = certificateDataResponse?.fileData;
          
          if (foundFileData) {
            certificateData.fileData = foundFileData;
            // Also cache locally for immediate reuse in UI state
            setAchievements(prev => prev.map(achievement => 
              achievement.id === achievementId 
                ? { ...achievement, fileData: foundFileData }
                : achievement
            ));
          } else {
            throw new Error('No file data available');
          }
        } catch (fetchError) {
          // Explicitly handle failure here
          clearInterval(progressInterval);
          setDownloadPopupState('failed');
          console.error('Failed to fetch file data for download:', fetchError);
          return;
        }
      }

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
            // Direct download implementation
            const link = document.createElement('a');
            link.href = formattedFileData;
            link.download = certificateData.fileName || 'certificate.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setDownloadPopupState('success');
          });

        } catch (downloadError) {
          clearInterval(progressInterval);
          console.error('Download processing failed:', downloadError);
          setDownloadPopupState('failed');
        }
      }, 1500); // Let progress run for 1.5 seconds to show smooth animation

    } catch (error) {
      // General error handling
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      console.error('Download failed:', error);
      setDownloadPopupState('failed');
    }
  };


  const closeDownloadPopup = () => {
    setDownloadPopupState('none');
    setDownloadProgress(0);
  };

  const closePreviewPopup = () => {
    setPreviewPopupState('none');
    setPreviewProgress(0);
  };

  /**
   * Handles the delete confirmation.
   * MODIFIED: Executes DB operations synchronously to ensure integrity before clearing UI.
   */
  const handleConfirmDelete = async () => {
    
    // 1. Prepare data and start loading animation
    setIsDeleting(true); // Start loading animation
    
    const deletedCerts = achievements.filter(a => selectedRows.includes(a.id));
    const updatedCertificatesForLocal = achievements.filter(a => !selectedRows.includes(a.id));
    const updatedCertificatesForFirebase = updatedCertificatesForLocal.map(a => {
        const { fileData, ...rest } = a;
        return rest;
    });

    let studentData = null;
    try {
        studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
    } catch (e) {
        // If local storage is invalid, abort
    }

    if (!studentData || !studentData._id) {
        console.error('❌ Deletion failed: Student data missing.');
        setIsDeleting(false);
        setDeletePopupState('none');
        alert('Deletion failed: Please log in again.');
        return;
    }
    
    const mongoDBService = (await import('../services/mongoDBService.jsx')).default;
    const fastDataService = (await import('../services/fastDataService.jsx')).default;
    const studentId = studentData._id || studentData.id;

    try {
        console.log('⚡ Starting BLOCKING DB deletion and metadata update...');

        // A. Parallel Deletion of file documents (This must succeed)
        // Ensure that the file document is deleted from the `certificates` collection.
        const deleteFilePromises = deletedCerts.map(async (achievement) => {
             try {
                 // 1. Fetch the certificate document by achievement ID
                 const certificateToDelete = await mongoDBService.getCertificateFileByAchievementId(studentId, achievement.id);
                 
                 if (certificateToDelete?._id) {
                     // 2. Delete the actual certificate file data from the certificates collection
                     await mongoDBService.deleteCertificate(certificateToDelete._id);
                     console.log(`✅ DB: Certificate file ${certificateToDelete._id} deleted.`);
                 } else {
                     console.warn(`⚠️ DB: Certificate file not found for achievement ${achievement.id}, skipping file deletion.`);
                 }
             } catch (error) {
                 console.error(`❌ DB: Critical failure during file deletion for achievement ${achievement.id}:`, error);
                 // CRITICAL: If file deletion fails, still throw an error to prevent inconsistent state
                 throw new Error(`Failed to delete file data for achievement ID ${achievement.id}`);
             }
        });
        
        // Await all file deletions. If any fail, the catch block runs.
        await Promise.all(deleteFilePromises); 
        console.log('✅ DB: All individual file documents deleted successfully.');

        // B. Update student metadata (Crucial for next login/load)
        // Update the main student document to remove the reference to the achievement.
        await mongoDBService.updateStudent(studentId, {
            certificates: updatedCertificatesForFirebase
        });
        console.log('✅ DB: Student metadata updated successfully.');
        
        // C. Cleanup cache
        fastDataService.clearCache(studentId);

        // D. Final verification refresh (Non-blocking but vital)
        await refreshAchievements(); 
        console.log('✅ Background: Final refresh completed.');

        // 4. FINAL SUCCESS ACTIONS (Only runs if all DB operations complete)
        
        // Update UI state based on SUCCESSFUL DB commit
        setAchievements(updatedCertificatesForLocal);
        setDeletedCertificates(deletedCerts);
        setSelectedRows([]);

        setIsDeleting(false); 
        setDeletePopupState('success'); // Show success popup
        console.log('✅ DELETE COMPLETE: UI and DB synced.');

    } catch (error) {
        console.error('❌ DELETE FAILURE:', error);
        
        // 5. FAILURE ACTIONS (Revert UI state, show error)
        
        // Force full refresh to pull back whatever data is still in the DB
        await refreshAchievements();
        
        setIsDeleting(false); 
        setDeletePopupState('none'); // Close confirmation popup
        alert(`Deletion failed. The changes were not saved to the database. Error: ${error.message}`);
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
  // FIX: Renamed function from handleYearSemesterFilterChange to handleYearSemesterChange for consistency, 
  // then removed handleYearSemesterFilterChange to resolve the "assigned but never used" warning.
  const handleYearSemesterChange = (e) => setYearSemesterFilter(e.target.value); 
  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleApplyFilters = () => { setAppliedFilters({ searchQuery, yearSemesterFilter, statusFilter, sortBy }); };
  const handleClearFilters = () => { setSearchQuery(""); setYearSemesterFilter(""); setSortBy(""); setStatusFilter("all"); setAppliedFilters({ searchQuery: "", yearSemesterFilter: "", statusFilter: "all", sortBy: "" }); };
  
  

  const handleViewFile = async (fileName, fileData, achievementId) => { 
    // Prevent multiple previews
    if (previewPopupState !== 'none') {
      console.log('Preview already in progress, ignoring click');
      return;
    }

    console.log('⚡ Viewing file:', { fileName, fileData: fileData ? 'Present' : 'Missing', achievementId }); 
    
    // 🔥 FIX 1: Move popup initialization to the top for guaranteed visibility
    setPreviewPopupState('progress');
    setPreviewProgress(0);

    // Dynamic progress simulation while fetching from MongoDB
    let progressInterval = setInterval(() => {
      setPreviewProgress(prev => {
        if (prev >= 85) {
          return prev;
        }
        return prev + Math.random() * 12; 
      });
    }, 150);
    
    // OPTIMIZED: Check local cache first for instant preview
    const currentAchievement = achievements.find(a => a.id === achievementId);
    const cachedFileData = currentAchievement?.fileData || fileData;
    
    if (cachedFileData) { 
      // If cached, simulate loading for 500ms before showing content
      console.log('⚡ INSTANT PREVIEW: Using cached file data (simulating load for 500ms)');
      
      setTimeout(() => {
          clearInterval(progressInterval);
          setPreviewProgress(100);
          
          try {
            // Ensure the file data has the correct data URL format
            let formattedFileData = cachedFileData;
            if (!cachedFileData.startsWith('data:')) {
              // If it's raw base64, add the PDF data URL prefix
              formattedFileData = `data:application/pdf;base64,${cachedFileData}`;
            }
            
            // Direct preview implementation
            requestAnimationFrame(() => {
              const newWindow = window.open();
              if (newWindow) {
                newWindow.document.write(`
                  <html>
                    <head><title>Certificate Preview</title></head>
                    <body style="margin:0;">
                      <embed src="${formattedFileData}" width="100%" height="100%" type="application/pdf">
                    </body>
                  </html>
                `);
              }
              setPreviewPopupState('none'); // Close popup after preview opens
            });
            
          } catch (previewError) {
            console.error('❌ Preview error:', previewError);
            setPreviewPopupState('failed');
          }
      }, 500); // Wait for 500ms minimum load time
      
      return; // Exit here as the work is scheduled
    }
    
    // BACKGROUND FETCH: Get file data in background while showing loading
    console.log('⚡ BACKGROUND FETCH: Loading file data...');
    
    try {
      let studentData = null;
      try {
        studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      } catch (e) {
        clearInterval(progressInterval);
        throw new Error('Please log in again to view files.');
      }

      if (!studentData) {
        clearInterval(progressInterval);
        throw new Error('Please log in again to view files.');
      }

      const mongoDBService = (await import('../services/mongoDBService.jsx')).default;
      let studentId = studentData.id || studentData._id || studentData.studentId;
      if (!studentId) {
        studentId = `student_${studentData.regNo}`;
      }
      
      // Use the dedicated single-file fetch 
      const certificateDataResponse = await Promise.race([
        mongoDBService.getCertificateFileByAchievementId(studentId, achievementId), // <-- NEW EFFICIENT METHOD
        new Promise((_, reject) => 
          setTimeout(() => {
            clearInterval(progressInterval);
            reject(new Error('Certificate file fetch timeout')); 
          }, 30000) // 30s timeout for single large file retrieval
        )
      ]);
      
      // Clear the progress interval when data arrives
      clearInterval(progressInterval);
      
      // The new endpoint should return the object containing the fileData field
      const fileDataLoaded = certificateDataResponse?.fileData;
      
      if (fileDataLoaded) {
        console.log('⚡ BACKGROUND FETCH: File data loaded successfully');
        console.log('📄 File data length:', fileDataLoaded.length);
        
        // Loading toast removed - using popup system
        
        // Complete progress to 100% and preview instantly
        setPreviewProgress(100);
        
        try {
          // Ensure the file data has the correct data URL format
          let formattedFileData = fileDataLoaded;
          if (!formattedFileData.startsWith('data:')) {
            // If it's raw base64, add the PDF data URL prefix
            formattedFileData = `data:application/pdf;base64,${formattedFileData}`;
          }
          
          // INSTANT PREVIEW: Use requestAnimationFrame for immediate execution
          requestAnimationFrame(() => {
            const newWindow = window.open();
            if (newWindow) {
              newWindow.document.write(`
                <html>
                  <head><title>Certificate Preview</title></head>
                  <body style="margin:0;">
                    <embed src="${formattedFileData}" width="100%" height="100%" type="application/pdf">
                  </body>
                </html>
              `);
            }
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
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      
      // Use popup system instead of alerts
      console.error('Preview failed:', error.message);
      // Ensure popup state is set to 'failed' on error
      setPreviewPopupState('failed');
    }
  };
  const normalizeAchievement = useCallback((achievement) => {
    if (!achievement) return null;

    const deriveStatus = () => {
      const value = achievement.status || achievement.rawStatus || 'pending';
      return value.toString().trim().toLowerCase();
    };

    const deriveComp = () => {
      const value =
        achievement.comp ||
        achievement.competition ||
        achievement.certificateName ||
        achievement.certName ||
        achievement.eventName ||
        achievement.awardName ||
        achievement.fileName;

      return (value || 'Certificate').toString().trim();
    };

    const deriveYear = () => {
      return (
        achievement.year ||
        achievement.academicYear ||
        achievement.currentYear ||
        achievement.studentYear ||
        ''
      ).toString().trim();
    };

    const deriveSemester = () => {
      return (
        achievement.semester ||
        achievement.sem ||
        achievement.term ||
        achievement.currentSemester ||
        ''
      ).toString().trim();
    };

    const deriveSection = () => {
      return (
        achievement.section ||
        achievement.sectionName ||
        achievement.classSection ||
        ''
      ).toString().trim();
    };

    const deriveDepartment = () => {
      const value =
        achievement.department ||
        achievement.branch ||
        achievement.studentDepartment ||
        achievement.dept;
      return value ? value.toString().trim().toUpperCase() : '';
    };

    const deriveDegree = () => {
      const value =
        achievement.degree ||
        achievement.studentDegree ||
        achievement.course ||
        achievement.program;
      return value ? value.toString().trim() : '';
    };

    const deriveDate = () => {
      return (
        achievement.date ||
        achievement.eventDate ||
        achievement.uploadDate ||
        achievement.createdAt ||
        ''
      ).toString().trim();
    };

    const derivePrize = () => {
      return (
        achievement.prize ||
        achievement.award ||
        achievement.position ||
        ''
      ).toString().trim();
    };

    return {
      ...achievement,
      comp: deriveComp(),
      status: deriveStatus(),
      rawStatus: deriveStatus(),
      year: deriveYear() || '--',
      semester: deriveSemester() || '--',
      section: deriveSection() || '--',
      department: deriveDepartment() || '--',
      degree: deriveDegree() || '--',
      date: deriveDate(),
      prize: derivePrize()
    };
  }, []);

  const getFilteredAndSortedAchievements = () => {
    const normalized = achievements
      .map(normalizeAchievement)
      .filter(Boolean);

    let filtered = [...normalized];
    const { searchQuery, yearSemesterFilter, statusFilter, sortBy } = appliedFilters;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => (a.comp || '').toLowerCase().includes(query));
    }
    if (yearSemesterFilter) {
      const [year, semester] = yearSemesterFilter.split('/');
      filtered = filtered.filter(a => a.year === year && a.semester === semester);
    }
    if (statusFilter !== 'all') {
      const normalizedStatus = statusFilter.toLowerCase();
      filtered = filtered.filter(a => a.status === normalizedStatus);
    }
    if (sortBy) {
      return [...filtered].sort((a, b) => {
        if (sortBy === 'date') return new Date(b.date || 0) - new Date(a.date || 0);
        if (sortBy === 'prize') return (a.prize || '').localeCompare(b.prize || '');
        return 0;
      });
    }
    return filtered;
  };

  // Get filtered achievements for display
  const filteredAchievements = getFilteredAndSortedAchievements();

  return (
    <>
      {/* Remove inline styles block, rely on imported CSS Modules */}
      
      {/* FIX: Converted className to styles.className */}
      <div className={styles['achievements-cards-container']}>
        {/* FIX: Converted className to styles.className */}
        <div className={styles['achievements-action-card']} onClick={handleUploadClick}>
            <img src={UploadCertificatecardicon} alt="Upload Certificate" className={styles['action-card-img-main']} />
            <div className={styles['action-card-title']}>Upload Certificate</div>
            <div className={styles['action-card-desc']}>Please upload your<br />certificate here</div>
        </div>
        {/* FIX: Converted className to styles.className */}
        <div className={styles['achievements-filter-card']}>
            <button className={styles['filter-card-button']}>Sort & Filter</button>
            <div className={styles['filter-grid']}>
                <div className={styles['achievements-input-container']}>
                    {/* FIX: Combined local styles object with CSS module class names */}
                    <input type="text" id="competitionName" value={searchQuery} onChange={handleSearchChange} className={`${styles['achievements-filter-input']} ${searchQuery ? styles['achievements-has-value'] : ''}`} />
                    <label htmlFor="competitionName" className={styles['achievements-floating-label']}>Enter Competition Name</label>
                </div>
                {/* FIX: Changed onChange handler from handleYearSemesterChange to the defined function name */}
                <select value={yearSemesterFilter} onChange={handleYearSemesterChange} className={styles['achievements-filter-input']}>
                    <option value="">Year/Semester</option><option value="I/1">I/1</option><option value="I/2">I/2</option><option value="II/3">II/3</option><option value="II/4">II/4</option><option value="III/5">III/5</option><option value="III/6">III/6</option><option value="IV/7">IV/7</option><option value="IV/8">IV/8</option>
                </select>
                <select value={sortBy} onChange={handleSortChange} className={styles['achievements-filter-input']}>
                    <option value="" disabled>Sort by</option><option value="date">Date</option><option value="prize">Prize</option>
                </select>
                <select value={statusFilter} onChange={handleStatusFilterChange} className={styles['achievements-filter-input']}>
                    <option value="all">All Status</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option>
                </select>
            </div>
            {/* FIX: Converted className to styles.className */}
            <div className={styles['filter-actions']}>
                <button className={styles['achievements-apply-sort-btn']} onClick={handleApplyFilters}>Apply</button>
                <button className={styles['achievements-clear-filter-btn']} onClick={handleClearFilters}>Clear</button>
            </div>
        </div>
        {/* FIX: Converted className to styles.className */}
        <div className={styles['achievements-action-card']} onClick={handleEditClick}>
            <img src={editcertificatecardicon} alt="Edit Certificate" className={styles['action-card-img-main']}/>
            <div className={styles['action-card-title']}>Edit Certificate</div>
            <div className={styles['action-card-desc']}>Edit your certificate<br />information here</div>
        </div>
      </div>
      {/* FIX: Converted className to styles.className */}
      <div className={styles['achievements-table-container']}>
        <div className={styles['table-header']}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2>MY ACHIEVEMENTS</h2>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* FIX: Removed the manual refresh button */}
            {/* <button className={styles['refresh-btn']} onClick={refreshAchievements} style={{ display: 'none' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Refresh
            </button> */}
            <button 
              onClick={handleDeleteClick}
              // FIX: Converted className to styles.className
              className={styles['delete-selected-btn']}
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
        {/* FIX: Converted className to styles.className */}
        <div className={styles['table-scroll-wrapper']}>
            {isInitialLoading || isLoading ? (
              <div style={{
                minHeight: '300px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TableLoader message={isInitialLoading ? "Loading achievements..." : "Refreshing..."} />
              </div>
            ) : (
              // FIX: Converted className to styles.className
              <table className={styles['achievements-table']}>
                {/* <colgroup> was removed to allow auto-sizing */ }
                <thead>
                  {/* FIX: Compacted the JSX inside <tr> to eliminate whitespace text nodes */}
                  <tr><th>Select</th><th>S.No</th><th>Year</th><th>Semester</th><th>Competition</th><th>Date</th><th>Prize</th><th>Status</th><th>View</th><th>Download</th></tr>
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
      {showRestrictionPopup && (<div className={styles['restriction-popup-overlay']}><div className={styles['restriction-popup-content']}><h2> ⚠️ Edit Restriction </h2><div className={styles['restriction-message']}>{restrictionMessage}</div><button onClick={handleCloseRestrictionPopup} className={styles['restriction-ok-btn']}>OK, I Understand</button></div></div>)}
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
      <ErrorAlert 
        isOpen={showErrorAlert} 
        onClose={() => setShowErrorAlert(false)} 
        title="Fetch Error" 
        message={errorAlertMsg || 'Failed to fetch achievements. Please try again.'} 
      />
    </>
  );
}

function TableRow({ id, no, year, semester, section, comp, date, prize, status, selected, onSelect, fileName, fileData, onViewFile, onDownloadFile, achievements }) {
  // FIX: Status class is now dynamically constructed using the styles object
  const statusClass = `${styles['achievements-status-pill']} ${styles[`achievements-status-${status}`]}`;
  
  // MODIFIED: This function correctly formats 'YYYY-MM-DD' to 'dd-MM-yyyy' for display.
  const displayDate = date ? date.split('-').reverse().join('-') : '';
  
  // Function to render cell content without loading spinner
  const renderCellContent = (content) => {
    if (content === undefined || content === null || content === '') {
      return ''; // Return empty string instead of spinner
    }
    return content;
  };

  return (
    <tr>
      <td data-label="Select">
        <input 
          type="checkbox" 
          checked={selected} 
          onChange={() => onSelect(id)} 
          className={styles['row-checkbox']} 
        />
      </td>
      <td data-label="S.No">{renderCellContent(no)}</td>
      <td data-label="Year">{renderCellContent(year)}</td>
      <td data-label="Semester">{renderCellContent(semester)}</td>
      <td data-label="Competition">{renderCellContent(comp)}</td>
      <td data-label="Date">{renderCellContent(displayDate)}</td>
      <td data-label="Prize">{renderCellContent(prize)}</td>
      <td data-label="Status">
        <span className={statusClass}>
          {renderCellContent(status ? status.charAt(0).toUpperCase() + status.slice(1) : status)}
        </span>
      </td>
      <td data-label="View">
        <button onClick={onViewFile} className={styles['table-action-btn']}>
          <EyeIcon />
        </button>
      </td>
      <td data-label="Download">
        <button onClick={onDownloadFile} className={styles['table-action-btn']}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#2276fc" strokeWidth="2"/>
            <polyline points="7,10 12,15 17,10" stroke="#2276fc" strokeWidth="2"/>
            <line x1="12" y1="15" x2="12" y2="3" stroke="#2276fc" strokeWidth="2"/>
          </svg>
        </button>
      </td>
    </tr>
  );
}
const TableLoader = ({ message }) => (
  <div style={{ display: 'flex', justifyContent: 'center' }}>
    <style>{`@keyframes tableSpin{to{transform:rotate(360deg)}}`}</style>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '5px solid #bfdbfe', borderTopColor: '#2563eb', animation: 'tableSpin 0.8s linear infinite' }} />
      <div style={{ marginTop: '12px', color: '#1e3a8a', fontWeight: 600, fontSize: '14px' }}>
        {message || 'Please wait Certificates are Fetching.'}
      </div>
    </div>
  </div>
)