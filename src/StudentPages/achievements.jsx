import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar/Navbar.js';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import CertificateUpload from "./PopupAchievements.jsx";
import EditCertificate from "./popupEditAchievements.jsx";
// FIX: Import the CSS Module into a 'styles' object
import styles from './Achievements.module.css';
import alertStyles from '../components/alerts/AlertStyles.module.css';
import UploadCertificatecardicon from '../assets/UploadCertificatecardicon.svg';
import editcertificatecardicon from '../assets/editcertificatecardicon.svg';
// REMOVED: Redundant static imports for mongoDBService, certificateService, and fastDataService
// The code now relies solely on dynamic imports inside functions for stability and performance.


// NEW: Import download/preview alerts
import {
  DownloadFailedAlert,
  PreviewFailedAlert,
  PreviewProgressAlert,
  ErrorAlert,
  SelectionAlert,
  CertificateDownloadProgressAlert,
  CertificateDownloadSuccessAlert
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
  const [achievements, setAchievements] = useState([]);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [showRestrictionPopup, setShowRestrictionPopup] = useState(false);
  const [deletePopupState, setDeletePopupState] = useState('none'); // 'none', 'confirm', 'success'
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete button
  const [restrictionMessage, setRestrictionMessage] = useState("");
  const [deletedCertificates, setDeletedCertificates] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [showSelectionAlert, setShowSelectionAlert] = useState(false);
  const [selectionAlertConfig, setSelectionAlertConfig] = useState({
    title: 'Select a Certificate',
    message: 'Please choose a certificate row to continue.'
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");

  // NEW: Download/Preview popup states
  const [downloadPopupState, setDownloadPopupState] = useState('none'); // 'none', 'progress', 'success', 'failed'
  const [previewPopupState, setPreviewPopupState] = useState('none'); // 'none', 'progress', 'failed'
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [isFetchingCertificate, setIsFetchingCertificate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [, setStudentData] = useState(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [errorAlertMsg, setErrorAlertMsg] = useState('');


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

  // 🔥 GridFS: Cache functions removed - files are now fetched from GridFS on demand

  const getAuthenticatedStudent = useCallback(async (mongoDBServiceInstance) => {
    let parsedStudent = null;
    try {
      parsedStudent = JSON.parse(localStorage.getItem('studentData') || 'null');
    } catch (error) {
      console.warn('Failed to parse studentData from localStorage:', error);
    }

    if (parsedStudent && (parsedStudent._id || parsedStudent.id || parsedStudent.studentId)) {
      return parsedStudent;
    }

    try {
      const completeRaw = localStorage.getItem('completeStudentData');
      if (completeRaw) {
        const completeParsed = JSON.parse(completeRaw);
        if (completeParsed?.student) {
          localStorage.setItem('studentData', JSON.stringify(completeParsed.student));
          return completeParsed.student;
        }
      }
    } catch (error) {
      console.warn('Failed to parse completeStudentData for authentication:', error);
    }

    const storedRegNo = localStorage.getItem('studentRegNo');
    const storedDob = localStorage.getItem('studentDob');

    if (storedRegNo && storedDob && mongoDBServiceInstance?.getStudentByRegNoAndDob) {
      try {
        const fallbackStudent = await mongoDBServiceInstance.getStudentByRegNoAndDob(storedRegNo, storedDob);
        if (fallbackStudent) {
          localStorage.setItem('studentData', JSON.stringify(fallbackStudent));
          return fallbackStudent;
        }
      } catch (error) {
        console.error('Failed to fetch student data via regNo/dob fallback:', error);
      }
    }

    return null;
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

      // 🔥 GridFS: Preserve GridFS references instead of base64 fileData
      if (previousItem.gridfsFileId && !merged.gridfsFileId) {
        merged.gridfsFileId = previousItem.gridfsFileId;
      }
      
      if (previousItem.gridfsFileUrl && !merged.gridfsFileUrl) {
        merged.gridfsFileUrl = previousItem.gridfsFileUrl;
      }

      // Remove any base64 fileData to ensure we only use GridFS
      delete merged.fileData;

      // 🔥 DEBUG: Log merged certificate
      console.log('🔍 Merged certificate:', {
        id: merged.id,
        certificateId: merged.certificateId,
        gridfsFileId: merged.gridfsFileId,
        gridfsFileUrl: merged.gridfsFileUrl,
        fileName: merged.fileName
      });

      if (previousItem.localStatusOverride && !merged.localStatusOverride) {
        merged.localStatusOverride = previousItem.localStatusOverride;
      }

      return merged;
    });
  }, [getCertificateKey]);

  const refreshAchievements = useCallback(async (isBackground = false) => {
    const startedAt = Date.now();
    try {
      console.log('⚡ SUPER FAST REFRESH STARTING...');
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
      // Increased timeout to 60 seconds for large datasets and slow connections
      const completeData = await Promise.race([
        fastDataService.getCompleteStudentData(studentData._id || studentData.id, false),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout - server may be slow or unresponsive')), 60000))
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
        const completeStudentData = { ...freshStudentData, certificates: certificatesFromBackend };
        localStorage.setItem('studentData', JSON.stringify(completeStudentData));
        console.log('⚡ SUPER FAST REFRESH COMPLETED');
      } else {
        console.log('⚡ No certificates found in MongoDB');
        setAchievements([]);
        setSelectedRows([]);
        const updatedStudentData = { ...studentData, certificates: [] };
        localStorage.setItem('studentData', JSON.stringify(updatedStudentData));
      }
    } catch (error) {
      console.error('Error refreshing achievements:', error);
      setErrorAlertMsg('Failed to refresh achievements. Please check your network or try again.');
      setShowErrorAlert(true);
    } finally {
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_LOADER_MS) {
        await new Promise(resolve => setTimeout(resolve, MIN_LOADER_MS - elapsed));
      }
      setIsLoading(false);
      if (isInitialLoading) {
        setIsInitialLoading(false);
      }
    }
  }, [achievements, haveCertificatesChanged, isInitialLoading, mergeCertificateMetadata, MIN_LOADER_MS]);

  const handleUpdateAchievement = useCallback(async (updatedAchievement) => {
    try {
      const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (!studentData || !studentData._id) {
        throw new Error('Student not authenticated');
      }

      // Upload new file to GridFS if provided
      let achievementToSave = { ...updatedAchievement };
      if (updatedAchievement.rawFile) {
        const gridfsService = (await import('../services/gridfsService')).default;
        const uploadResult = await gridfsService.uploadCertificate(updatedAchievement.rawFile, {
          studentId: studentData._id,
          achievementId: updatedAchievement.achievementId,
          fileName: updatedAchievement.fileName,
        });
        achievementToSave.gridfsFileId = uploadResult.gridfsFileId;
        achievementToSave.gridfsFileUrl = uploadResult.gridfsFileUrl;
        achievementToSave.fileData = ''; // No base64
        delete achievementToSave.rawFile;
        console.log('✅ Updated certificate file uploaded to GridFS:', uploadResult.gridfsFileUrl);
      }

      const certificateService = (await import('../services/certificateService.jsx')).default;
      await certificateService.updateCertificate(studentData._id, achievementToSave.achievementId, achievementToSave);
      const fastDataService = (await import('../services/fastDataService.jsx')).default;
      fastDataService.clearCache(studentData._id);
      await refreshAchievements(true);
      return { success: true };
    } catch (error) {
      console.error('Failed to update achievement:', error);
      setErrorAlertMsg('Failed to update certificate. Please try again.');
      setShowErrorAlert(true);
      throw error;
    }
  }, [refreshAchievements]);

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
        
        // 🔍 DEBUG: Log first certificate data to verify GridFS info
        if (freshStudentData.certificates.length > 0) {
          console.log('🔍 FIRST CERTIFICATE DATA:', {
            id: freshStudentData.certificates[0]._id || freshStudentData.certificates[0].id,
            fileName: freshStudentData.certificates[0].fileName,
            gridfsFileId: freshStudentData.certificates[0].gridfsFileId,
            gridfsFileUrl: freshStudentData.certificates[0].gridfsFileUrl,
            comp: freshStudentData.certificates[0].comp || freshStudentData.certificates[0].competition,
            hasFileData: !!freshStudentData.certificates[0].fileData
          });
        }

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

      // ⚡ Upload certificate file to GridFS (this also saves metadata to MongoDB)
      let gridfsFileId = null;
      let gridfsFileUrl = null;
      let result = null;
      
      if (newAchievement.rawFile) {
        const gridfsService = (await import('../services/gridfsService')).default;
        const uploadResult = await gridfsService.uploadCertificate(newAchievement.rawFile, {
          studentId,
          achievementId: newAchievement.achievementId,
          fileName: newAchievement.fileName,
          studentName: newAchievement.name,
          regNo: newAchievement.reg,
          section: newAchievement.section,
          department: newAchievement.department,
          degree: newAchievement.degree,
          year: newAchievement.year,
          semester: newAchievement.semester,
          comp: newAchievement.comp,
          prize: newAchievement.prize,
          date: newAchievement.date,
        });
        
        gridfsFileId = uploadResult.gridfsFileId;
        gridfsFileUrl = uploadResult.gridfsFileUrl;
        result = { certificate: uploadResult };
        
        console.log('✅ Certificate file uploaded to GridFS:', gridfsFileUrl);
      } else {
        throw new Error('No file selected for upload');
      }

      console.log('✅ Certificate uploaded successfully:', result.certificate._id);

      // Update student's certificates metadata so the table can render it
      const mongoDB = (await import('../services/mongoDBService.jsx')).default;
      const fastDataService = (await import('../services/fastDataService.jsx')).default;
      const metaId = result.certificate.achievementId || String(Date.now());
      const { fileData, _id, createdAt, ...meta } = newAchievement;
      const sanitizedMeta = {
        ...meta,
        id: metaId,
        achievementId: meta.achievementId || metaId,
        certificateId: meta.certificateId || result.certificate?._id || metaId,
        gridfsFileId: gridfsFileId,
        gridfsFileUrl: gridfsFileUrl,
      };
      
      // 🔥 DEBUG: Log sanitized metadata
      console.log('🔍 Optimistic certificate metadata:', {
        id: sanitizedMeta.id,
        certificateId: sanitizedMeta.certificateId,
        gridfsFileId: sanitizedMeta.gridfsFileId,
        gridfsFileUrl: sanitizedMeta.gridfsFileUrl
      });
      
      // 🔥 Optimistic UI update - show certificate immediately
      const optimisticCertificates = [...achievements, sanitizedMeta];
      setAchievements(optimisticCertificates);
      setSelectedRows([metaId]);

      const optimisticStudentData = {
        ...studentData,
        certificates: optimisticCertificates.map(({ fileData, ...rest }) => rest)
      };
      localStorage.setItem('studentData', JSON.stringify(optimisticStudentData));
      setStudentData(optimisticStudentData);

      // 🔥 Update backend in background - don't wait for it
      try {
        const updatedCertificatesForFirebase = optimisticCertificates.map(a => {
          const { fileData, ...rest } = a;
          return rest;
        });
        await mongoDB.updateStudent(studentId, { certificates: updatedCertificatesForFirebase });
        console.log('✅ Backend updated with new certificate');
        
        // Clear caches
        fastDataService.clearCache(studentId);
        
        // Background refresh to sync with backend (non-blocking)
        setTimeout(async () => {
          try {
            await refreshAchievements(true);
            console.log('✅ Background sync completed');
          } catch (syncError) {
            console.warn('Background sync failed (non-critical):', syncError);
          }
        }, 1000);
      } catch (updateError) {
        console.warn('Backend update failed (non-critical):', updateError);
        // Don't throw - upload was successful, just sync failed
      }

    } catch (error) {
      console.error('❌ Certificate upload failed:', error);
      
      // More specific error messages
      let errorMessage = 'Certificate upload failed. ';
      
      if (error.message.includes('GridFS')) {
        errorMessage += 'File upload to storage failed. Please try again.';
      } else if (error.message.includes('authentication') || error.message.includes('authenticated')) {
        errorMessage += 'Please log in again.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage += 'Network error. Please check your connection.';
      } else {
        errorMessage += error.message || 'Please try again.';
      }
      
      setErrorAlertMsg(errorMessage);
      setShowErrorAlert(true);
      
      throw new Error(errorMessage); // Re-throw with better message
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = async () => { 
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
      
      // 🔥 GridFS: No need to fetch file content for editing - just pass the metadata with gridfsFileId/gridfsFileUrl
      // The edit popup can fetch from GridFS if it needs to display/preview the file
      setEditingRow(selected); 
      setShowEditPopup(true); 
    } else { 
      console.log('Selection issue - selectedRows:', selectedRows);
      setSelectionAlertConfig({
        title: 'Select One Certificate',
        message: 'Please select exactly one certificate row to edit.'
      });
      setShowSelectionAlert(true);
    } 
  };
  
  const handleCloseEditPopup = () => { setShowEditPopup(false); setEditingRow(null); };

  
  const handleCloseRestrictionPopup = () => setShowRestrictionPopup(false);
  const handleDeleteClick = () => {
    if (selectedRows.length === 0) {
      setSelectionAlertConfig({
        title: 'Select Certificates',
        message: 'Please select at least one certificate row before deleting.'
      });
      setShowSelectionAlert(true);
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
      console.log('⚠️ Download already in progress, ignoring click');
      return;
    }

    console.log('📥 Starting certificate download...');
    
    // Show progress popup immediately
    setDownloadPopupState('progress');
    setDownloadProgress(0);
    const progressInterval = setInterval(() => {
      setDownloadProgress(prev => (prev >= 85 ? prev : prev + 10));
    }, 150);

    try {
      console.log('🔍 Certificate data for download:', {
        certificateId: certificateData.certificateId,
        gridfsFileId: certificateData.gridfsFileId,
        gridfsFileUrl: certificateData.gridfsFileUrl,
        fileName: certificateData.fileName,
        hasFileData: !!certificateData.fileData,
        hasFileContent: !!certificateData.fileContent
      });
      
      // Priority: GridFS URL > fileData > fileContent
      let certificateUrl = certificateData.gridfsFileUrl || certificateData.fileData || certificateData.fileContent;
      const certificateName = certificateData.fileName || `certificate_${certificateData.comp || 'download'}.pdf`;
      
      // ✨ For GridFS URLs, fetch as blob and download
      if (certificateUrl && (certificateUrl.startsWith('/api/file/') || certificateUrl.includes('/api/file/') ||
          certificateUrl.startsWith('/api/gridfs/') || certificateUrl.includes('/api/gridfs/'))) {
        console.log('✅ GridFS URL detected, preparing download...');
        
        // Smart backend URL detection for production/mobile
        let API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '');
        
        // If no env variable or localhost, try to detect from current location
        if (!API_BASE || API_BASE.includes('localhost')) {
          // Check if we're on Vercel (production)
          if (window.location.hostname.includes('vercel.app')) {
            // Use Render backend URL for production
            API_BASE = 'https://placement-portal-zxo2.onrender.com';
            console.log('🌐 Production mode detected, using Render backend');
          } else {
            API_BASE = 'http://localhost:5000';
          }
        }
        
        const fullUrl = certificateUrl.startsWith('http') ? certificateUrl : `${API_BASE}${certificateUrl}`;
        console.log('🔗 Download URL:', fullUrl);
        console.log('📍 Current origin:', window.location.origin);
        
        // Detect mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        console.log('📱 Device type:', isMobile ? 'Mobile' : 'Desktop');
        
        if (isMobile) {
          // 📱 Mobile: Fetch blob first then trigger download to avoid CORS issues
          console.log('📱 Mobile device: Fetching blob for download...');
          
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const response = await fetch(fullUrl, {
              method: 'GET',
              signal: controller.signal,
              headers: {
                'Accept': 'application/pdf'
              }
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              throw new Error(`Download failed: ${response.status} ${response.statusText}`);
            }
            
            const blob = await response.blob();
            console.log('✅ Blob received:', blob.size, 'bytes');
            
            clearInterval(progressInterval);
            setDownloadProgress(100);
            
            // For mobile, use blob URL with download attribute
            setTimeout(() => {
              const blobUrl = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = blobUrl;
              link.download = certificateName;
              link.style.display = 'none';
              document.body.appendChild(link);
              
              // Force download on mobile
              link.click();
              
              // Cleanup
              setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
              }, 100);
              
              setDownloadPopupState('success');
              console.log('✅ Mobile download completed');
            }, 300);
            return;
          } catch (fetchError) {
            console.error('❌ Mobile download fetch error:', fetchError);
            clearInterval(progressInterval);
            setDownloadPopupState('failed');
            setTimeout(() => setDownloadPopupState('none'), 2000);
            return;
          }
        }
        
        // 💻 Desktop: Fetch as blob with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
          const response = await fetch(fullUrl, {
            credentials: 'include',
            signal: controller.signal,
            headers: {
              'Accept': 'application/pdf'
            }
          });
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
          }
          
          const blob = await response.blob();
          
          // Complete progress
          clearInterval(progressInterval);
          setDownloadProgress(100);
          
          // Create download link with blob URL
          setTimeout(() => {
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = certificateName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            
            // Show success popup
            setDownloadPopupState('success');
            console.log('✅ Download completed');
          }, 300);
          return;
        } catch (fetchError) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            throw new Error('Download timeout - please check your connection');
          }
          throw fetchError;
        }
      }
      
      console.log('📥 Certificate URL source:', certificateData.gridfsFileUrl ? 'GridFS URL' : 
                  (certificateData.fileData ? 'fileData' : 'fileContent'));
      console.log('📥 File name:', certificateName);
      
      // If no certificate data, try fetching from MongoDB
      if (!certificateUrl && certificateData.certificateId) {
        console.log('⚠️ No cached certificate, fetching from MongoDB...');
        try {
          const API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
          const authToken = localStorage.getItem('authToken');
          
          const response = await fetch(`${API_BASE}/api/file/${certificateData.certificateId}`, {
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
            }
          });
          
          if (response.ok) {
            const blob = await response.blob();
            certificateUrl = URL.createObjectURL(blob);
            console.log('✅ Certificate fetched from MongoDB');
          }
        } catch (fetchErr) {
          console.error('❌ Failed to fetch certificate:', fetchErr);
        }
      }

      if (!certificateUrl) {
        clearInterval(progressInterval);
        setDownloadPopupState('failed');
        throw new Error('Certificate file not found');
      }
      
      // Wait for progress animation
      setTimeout(() => {
        clearInterval(progressInterval);
        setDownloadProgress(100);
        
        try {
          // Check if it's already a blob URL
          if (certificateUrl.startsWith('blob:')) {
            console.log('✅ Blob URL detected, downloading directly');
            const link = document.createElement('a');
            link.href = certificateUrl;
            link.download = certificateName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setDownloadPopupState('success');
            return;
          }

          // Ensure proper format
          let formattedData = certificateUrl;
          
          console.log('📥 Certificate URL type:', typeof certificateUrl);
          console.log('📥 Certificate URL length:', certificateUrl.length);
          
          if (!certificateUrl.startsWith('data:')) {
            formattedData = `data:application/pdf;base64,${certificateUrl}`;
            console.log('✅ Added data URL prefix');
          } else {
            console.log('✅ URL already has data prefix');
          }
          
          // Check if data is comma-separated bytes and convert to proper data URL
          if (formattedData.startsWith('data:application/pdf;base64,')) {
            const commaIndex = formattedData.indexOf(',');
            const dataAfterPrefix = formattedData.substring(commaIndex + 1);
            
            // Check if it's comma-separated bytes
            if (dataAfterPrefix.includes(',') && /^[\d,]+$/.test(dataAfterPrefix.substring(0, 100))) {
              console.log('🔧 Converting comma-separated bytes for download...');
              const byteStrings = dataAfterPrefix.split(',');
              const byteArray = new Uint8Array(byteStrings.map(str => parseInt(str, 10)));
              const blob = new Blob([byteArray], { type: 'application/pdf' });
              formattedData = URL.createObjectURL(blob);
              console.log('✅ Converted to blob URL for download');
            }
          }
          
          // Direct download
          const link = document.createElement('a');
          link.href = formattedData;
          link.download = certificateName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log('✅ Download triggered');
          setDownloadPopupState('success');
        } catch (err) {
          console.error('❌ Download error:', err);
          setDownloadPopupState('failed');
          setTimeout(() => setDownloadPopupState('none'), 2000);
        }
      }, 1500);
      
    } catch (error) {
      console.error('❌ Download failed:', error);
      setDownloadPopupState('failed');
      setTimeout(() => setDownloadPopupState('none'), 2000);
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
        setSelectionAlertConfig({
          title: 'Login Required',
          message: 'Deletion failed because your session expired. Please log in again.'
        });
        setShowSelectionAlert(true);
        return;
    }
    
    const mongoDBService = (await import('../services/mongoDBService.jsx')).default;
    const fastDataService = (await import('../services/fastDataService.jsx')).default;
    const studentId = studentData._id || studentData.id;

    try {
        console.log('⚡ Starting BLOCKING DB deletion and metadata update...');

        // A. Delete GridFS files first
        const gridfsService = (await import('../services/gridfsService')).default;
        const gridfsDeletePromises = deletedCerts.map(async (achievement) => {
            const gridfsFileId = achievement.gridfsFileId || achievement.certificateId;
            if (gridfsFileId) {
                try {
                    await gridfsService.deleteFile(gridfsFileId);
                    console.log('✅ GridFS file deleted:', gridfsFileId);
                } catch (error) {
                    console.warn('⚠️ Could not delete GridFS file:', gridfsFileId, error);
                    // Don't fail the entire operation if GridFS delete fails
                }
            }
        });
        await Promise.all(gridfsDeletePromises);
        console.log('✅ GridFS: All certificate files deleted.');

        // B. Delete certificate metadata from certificates collection
        const certificateService = (await import('../services/certificateService.jsx')).default;
        const deleteFilePromises = deletedCerts.map(async (achievement) => {
             try {
                 await certificateService.deleteCertificate(studentId, achievement.achievementId || achievement.id);
                 console.log('✅ Certificate metadata deleted:', achievement.achievementId || achievement.id);
             } catch (error) {
                 console.error('❌ Failed to delete certificate:', achievement.achievementId || achievement.id, error);
                 throw error; // Fail if metadata deletion fails
             }
        });
        
        // Await all file deletions. If any fail, the catch block runs.
        await Promise.all(deleteFilePromises); 
        console.log('✅ DB: All individual file documents deleted successfully.');

        // C. Update student metadata (Crucial for next login/load)
        // Update the main student document to remove the reference to the achievement.
        await mongoDBService.updateStudent(studentId, {
            certificates: updatedCertificatesForFirebase
        });
        console.log('✅ DB: Student metadata updated successfully.');
        
        // D. Cleanup cache
        fastDataService.clearCache(studentId);

        // E. Final verification refresh (Non-blocking but vital)
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
        setSelectionAlertConfig({
          title: 'Deletion Failed',
          message: `The certificates could not be deleted. ${error.message || ''}`.trim()
        });
        setShowSelectionAlert(true);
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
  const handleStatusFilterChange = (e) => setStatusFilter(e.target.value);
  const handleYearChange = (e) => {
    const nextYear = e.target.value;
    setYearFilter(nextYear);
    setSemesterFilter("");
  };
  const handleSemesterChange = (e) => setSemesterFilter(e.target.value);
  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  
  

  const handleViewFile = async (fileName, fileData, achievementId) => { 
    // Prevent multiple previews
    if (previewPopupState !== 'none') {
      console.log('⚠️ Preview already in progress, ignoring click');
      return;
    }

    console.log('🔍 Starting certificate preview...');
    
    // Show progress popup immediately
    setPreviewPopupState('progress');
    setPreviewProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setPreviewProgress(prev => (prev >= 85 ? prev : prev + 12));
    }, 150);

    try {
      // Get certificate data
      const currentAchievement = achievements.find(a => a.id === achievementId);
      if (!currentAchievement) {
        clearInterval(progressInterval);
        throw new Error('Certificate not found');
      }

      console.log('🔍 Certificate data for preview:', {
        certificateId: currentAchievement.certificateId,
        gridfsFileId: currentAchievement.gridfsFileId,
        gridfsFileUrl: currentAchievement.gridfsFileUrl,
        fileName: currentAchievement.fileName,
        hasFileData: !!currentAchievement.fileData,
        hasFileContent: !!currentAchievement.fileContent
      });

      // Priority: GridFS URL > fileData > fileContent
      let certificateUrl = currentAchievement.gridfsFileUrl || currentAchievement.fileData || currentAchievement.fileContent;
      
      // Wait for progress animation to show
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ✨ If it's a GridFS URL, fetch as blob and open with filename
      if (certificateUrl && (certificateUrl.startsWith('/api/file/') || certificateUrl.includes('/api/file/') ||
          certificateUrl.startsWith('/api/gridfs/') || certificateUrl.includes('/api/gridfs/'))) {
        
        console.log('✅ GridFS URL detected, preparing preview...');
        
        // Smart backend URL detection for production/mobile
        let API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '');
        
        // If no env variable or localhost, try to detect from current location
        if (!API_BASE || API_BASE.includes('localhost')) {
          // Check if we're on Vercel (production)
          if (window.location.hostname.includes('vercel.app')) {
            // Use Render backend URL for production
            API_BASE = 'https://placement-portal-zxo2.onrender.com';
            console.log('🌐 Production mode detected, using Render backend');
          } else {
            API_BASE = 'http://localhost:5000';
          }
        }
        
        const fullUrl = certificateUrl.startsWith('http') ? certificateUrl : `${API_BASE}${certificateUrl}`;
        console.log('🔗 Preview URL:', fullUrl);
        console.log('📍 Current origin:', window.location.origin);
        
        // Detect mobile device
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        console.log('📱 Device type:', isMobile ? 'Mobile' : 'Desktop');
        
        if (isMobile) {
          // 📱 Mobile: Fetch blob first then preview (avoids CORS issues)
          console.log('📱 Mobile device: Fetching blob for preview...');
          
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const response = await fetch(fullUrl, {
              method: 'GET',
              signal: controller.signal,
              headers: {
                'Accept': 'application/pdf'
              }
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              throw new Error(`Preview failed: ${response.status} ${response.statusText}`);
            }
            
            const blob = await response.blob();
            console.log('✅ Blob received:', blob.size, 'bytes');
            
            clearInterval(progressInterval);
            setPreviewProgress(100);
            
            // Create blob URL and open in new tab
            setTimeout(() => {
              const blobUrl = window.URL.createObjectURL(blob);
              const previewWindow = window.open(blobUrl, '_blank');
              
              if (!previewWindow) {
                console.warn('⚠️ Popup blocked');
                window.URL.revokeObjectURL(blobUrl);
                setPreviewPopupState('failed');
              } else {
                setPreviewPopupState('none');
                console.log('✅ Mobile preview opened');
                // Cleanup after some time
                setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);
              }
              
              setPreviewProgress(0);
            }, 300);
            return;
          } catch (fetchErr) {
            console.error('❌ Mobile preview fetch error:', fetchErr);
            clearInterval(progressInterval);
            setPreviewPopupState('failed');
            setTimeout(() => setPreviewPopupState('none'), 2000);
            return;
          }
        }
        
        // 💻 Desktop: Fetch as blob and create HTML wrapper
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          const response = await fetch(fullUrl, {
            credentials: 'include',
            signal: controller.signal,
            headers: {
              'Accept': 'application/pdf'
            }
          });
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
          }
          
          const blob = await response.blob();
          
          // Complete progress
          clearInterval(progressInterval);
          setPreviewProgress(100);
          
          // Create blob URL and wrap in HTML to show PDF icon
          setTimeout(() => {
            const pdfBlobUrl = URL.createObjectURL(blob);
            const fileName = currentAchievement.fileName || 'Certificate.pdf';
            
            // Create HTML wrapper to ensure PDF icon appears in tab
            const htmlContent = `
              <!DOCTYPE html>
              <html>
              <head>
                <title>${fileName}</title>
                <style>
                  body, html {
                    margin: 0;
                    padding: 0;
                    height: 100%;
                    overflow: hidden;
                  }
                  embed {
                    width: 100%;
                    height: 100%;
                  }
                </style>
              </head>
              <body>
                <embed src="${pdfBlobUrl}" type="application/pdf" />
              </body>
              </html>
            `;
            
            const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
            const htmlBlobUrl = URL.createObjectURL(htmlBlob);
            
            window.open(htmlBlobUrl, '_blank');
            
            setPreviewPopupState('none');
            setPreviewProgress(0);
            
            console.log('✅ Desktop preview opened with filename and PDF icon:', fileName);
          }, 300);
        } catch (fetchErr) {
          clearInterval(progressInterval);
          if (fetchErr.name === 'AbortError') {
            console.error('❌ Preview timeout:', fetchErr);
            setPreviewPopupState('failed');
            setTimeout(() => setPreviewPopupState('none'), 2000);
          } else {
            console.error('❌ Failed to fetch for preview:', fetchErr);
            setPreviewPopupState('failed');
            setTimeout(() => setPreviewPopupState('none'), 2000);
          }
        }
        return;
      }

      // If no certificate data, try fetching from MongoDB
      if (!certificateUrl && currentAchievement.certificateId) {
        console.log('⚠️ No cached certificate, trying to fetch from MongoDB...');
        try {
          const API_BASE = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';
          const authToken = localStorage.getItem('authToken');
          
          const response = await fetch(`${API_BASE}/api/file/${currentAchievement.certificateId}`, {
            headers: {
              'Content-Type': 'application/json',
              ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
            }
          });
          
          if (response.ok) {
            const blob = await response.blob();
            certificateUrl = URL.createObjectURL(blob);
            console.log('✅ Certificate fetched from MongoDB');
          }
        } catch (fetchErr) {
          console.error('❌ Failed to fetch certificate:', fetchErr);
        }
      }

      if (!certificateUrl) {
        clearInterval(progressInterval);
        setPreviewPopupState('failed');
        throw new Error('Certificate file not found');
      }

      // Wait for progress animation
      setTimeout(() => {
        clearInterval(progressInterval);
        setPreviewProgress(100);

        try {
          // Check if it's already a blob URL
          if (certificateUrl.startsWith('blob:')) {
            console.log('✅ Blob URL detected, opening directly');
            window.open(certificateUrl, '_blank');
            setPreviewPopupState('none');
            return;
          }

          // Ensure proper format for base64 data
          let formattedData = certificateUrl;
          
          console.log('🔍 Certificate URL starts with:', certificateUrl.substring(0, 100));
          console.log('🔍 Certificate URL type:', typeof certificateUrl);
          
          if (!certificateUrl.startsWith('data:')) {
            formattedData = `data:application/pdf;base64,${certificateUrl}`;
            console.log('✅ Added data URL prefix');
          } else {
            console.log('✅ URL already has data prefix');
          }

          // Convert base64 to blob for proper browser PDF viewing
          if (formattedData.startsWith('data:application/pdf;base64,')) {
            console.log('✅ Converting to blob for preview...');
            
            const commaIndex = formattedData.indexOf(',');
            const dataAfterPrefix = formattedData.substring(commaIndex + 1);
            
            if (!dataAfterPrefix || dataAfterPrefix.length === 0) {
              throw new Error('Empty certificate data');
            }
            
            console.log('🔍 Data length:', dataAfterPrefix.length);
            
            let byteArray;
            
            // Check if data is comma-separated bytes (e.g., "37,80,68,70...")
            if (dataAfterPrefix.includes(',') && /^[\d,]+$/.test(dataAfterPrefix.substring(0, 100))) {
              console.log('🔧 Detected comma-separated byte format, converting...');
              const byteStrings = dataAfterPrefix.split(',');
              byteArray = new Uint8Array(byteStrings.map(str => parseInt(str, 10)));
              console.log('✅ Converted from comma-separated bytes, size:', byteArray.length);
            } else {
              console.log('🔧 Detected base64 format, decoding...');
              const byteCharacters = atob(dataAfterPrefix);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              byteArray = new Uint8Array(byteNumbers);
              console.log('✅ Decoded from base64, size:', byteArray.length);
            }
            
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            console.log('✅ Blob created, size:', blob.size, 'bytes');
            
            const blobUrl = URL.createObjectURL(blob);
            console.log('✅ Blob URL created:', blobUrl);
            
            // Open blob URL directly — browser's native PDF viewer handles it
            const win = window.open(blobUrl, '_blank');
            if (!win) {
              console.log('⚠️ Popup blocked, using fallback');
              const link = document.createElement('a');
              link.href = blobUrl;
              link.target = '_blank';
              link.click();
            }
            // Set title after a short delay
            setTimeout(() => {
              try { if (win) win.document.title = `Certificate - ${currentAchievement.comp || 'Preview'}`; } catch(e) {}
            }, 1000);
          } else {
            console.log('🔗 Opening regular URL');
            window.open(formattedData, '_blank');
          }
          
          setPreviewPopupState('none');
        } catch (err) {
          console.error('❌ Preview error:', err);
          setPreviewPopupState('failed');
          setTimeout(() => setPreviewPopupState('none'), 2000);
        }
      }, 500);
      
    } catch (error) {
      console.error('❌ Preview failed:', error);
      setPreviewPopupState('failed');
      setTimeout(() => setPreviewPopupState('none'), 2000);
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

    const normalized = {
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
    
    // 🔍 DEBUG: Log GridFS info after normalization
    if (achievement.gridfsFileUrl || achievement.gridfsFileId) {
      console.log('🔍 NORMALIZED CERTIFICATE WITH GRIDFS:', {
        id: normalized.id,
        comp: normalized.comp,
        gridfsFileId: normalized.gridfsFileId,
        gridfsFileUrl: normalized.gridfsFileUrl,
        fileName: normalized.fileName
      });
    }
    
    return normalized;
  }, []);

  const getFilteredAndSortedAchievements = () => {
    const normalized = achievements
      .map(normalizeAchievement)
      .filter(Boolean);

    let filtered = [...normalized];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a => {
        const competition = (a.comp || '').toLowerCase();
        const prize = (a.prize || '').toLowerCase();
        return competition.includes(query) || prize.includes(query);
      });
    }
    if (yearFilter) {
      filtered = filtered.filter(a => a.year === yearFilter);
    }
    if (semesterFilter) {
      filtered = filtered.filter(a => a.semester === semesterFilter);
    }
    if (statusFilter !== 'all') {
      const normalizedStatus = statusFilter.toLowerCase();
      filtered = filtered.filter(a => a.status === normalizedStatus);
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
                    <label htmlFor="competitionName" className={styles['achievements-floating-label']}>Competition Name / Prize</label>
                </div>
                <select value={yearFilter} onChange={handleYearChange} className={styles['achievements-filter-input']}>
                    <option value="">Year</option><option value="I">I</option><option value="II">II</option><option value="III">III</option><option value="IV">IV</option>
                </select>
                <select value={semesterFilter} onChange={handleSemesterChange} className={styles['achievements-filter-input']} disabled={!yearFilter}>
                    <option value="">Sem (Choose Year first)</option>
                    {yearFilter === 'I' && (
                      <>
                        <option value="1">I</option>
                        <option value="2">II</option>
                      </>
                    )}
                    {yearFilter === 'II' && (
                      <>
                        <option value="3">III</option>
                        <option value="4">IV</option>
                      </>
                    )}
                    {yearFilter === 'III' && (
                      <>
                        <option value="5">V</option>
                        <option value="6">VI</option>
                      </>
                    )}
                    {yearFilter === 'IV' && (
                      <>
                        <option value="7">VII</option>
                        <option value="8">VIII</option>
                      </>
                    )}
                </select>
                <select value={statusFilter} onChange={handleStatusFilterChange} className={styles['achievements-filter-input']}>
                    <option value="all">All Status</option><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option>
                </select>
            </div>
            <div className={styles['filter-actions-spacer']}></div>
        </div>
        {/* FIX: Converted className to styles.className */}
        <div className={styles['achievements-action-card']} onClick={handleEditClick}>
            <img src={editcertificatecardicon} alt="Edit Certificate" className={styles['action-card-img-main']}/>
            <div className={styles['action-card-title']}>
              {isFetchingCertificate ? 'Loading...' : 'Edit Certificate'}
            </div>
            <div className={styles['action-card-desc']}>
              {isFetchingCertificate ? 'Fetching certificate...' : 'Edit your certificate information here'}
            </div>
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
      {showEditPopup && editingRow && <EditCertificate onClose={() => setShowEditPopup(false)} onUpdate={handleUpdateAchievement} initialData={editingRow} />}
      {showRestrictionPopup && (
        <div className={`${alertStyles['alert-overlay']} ${styles['restriction-overlay']}`}>
          <div className={`${alertStyles['achievement-popup-container']} ${styles['restriction-container']}`}>
            <div className={`${alertStyles['achievement-popup-header']} ${styles['restriction-header']}`}>
              Edit Restriction
            </div>
            <div className={`${alertStyles['achievement-popup-body']} ${styles['restriction-body']}`}>
              <div className={styles['restriction-icon-wrapper']}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                  <circle cx="26" cy="26" r="23" fill="#EFF6FF" stroke="#2563EB" strokeWidth="2"></circle>
                  <path
                    d="M26 16c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2s2-.9 2-2V18c0-1.1-.9-2-2-2zm0 18c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                    fill="#2563EB"
                  />
                </svg>
              </div>
              <h2 className={styles['restriction-heading']}>Action Not Allowed</h2>
              <div className={styles['restriction-message']}>
                {restrictionMessage}
              </div>
            </div>
            <div className={`${alertStyles['achievement-popup-footer']} ${styles['restriction-footer']}`}>
              <button onClick={handleCloseRestrictionPopup} className={`${alertStyles['achievement-popup-close-btn']} ${styles['restriction-close-btn']}`}>
                OK, I Understand
              </button>
            </div>
          </div>
        </div>
      )}
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
          background: "rgba(0,0,0,0.2)",
          zIndex: 1003,
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
          background: "rgba(0,0,0,0.2)",
          zIndex: 1003,
        }}>
          <DeleteSuccessPopup 
            onClose={handleCloseDeleteSuccessPopup} 
            deletedCertificates={deletedCertificates}
          />
        </div>
      )}

      {/* NEW: Download/Preview Popup Components */}
      <CertificateDownloadProgressAlert 
        isOpen={downloadPopupState === 'progress'} 
        progress={downloadProgress} 
      />
      
      <CertificateDownloadSuccessAlert 
        isOpen={downloadPopupState === 'success'} 
        onClose={closeDownloadPopup} 
      />
      
      <DownloadFailedAlert 
        isOpen={downloadPopupState === 'failed'} 
        onClose={closeDownloadPopup}
        color="#2563EB"
      />
      
      <PreviewProgressAlert 
        isOpen={previewPopupState === 'progress'} 
        progress={previewProgress} 
        fileLabel="certificate"
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
      <SelectionAlert
        isOpen={showSelectionAlert}
        title={selectionAlertConfig.title}
        message={selectionAlertConfig.message}
        onClose={() => setShowSelectionAlert(false)}
      />
    </>
  );
}

const formatDateForDisplay = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();

    const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [, y, m, d] = isoMatch;
      return `${d}-${m}-${y}`;
    }

    const ddmmyyyyMatch = trimmed.match(/^(\d{2})[\-/](\d{2})[\-/](\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, d, m, y] = ddmmyyyyMatch;
      return `${d}-${m}-${y}`;
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      const day = String(parsed.getDate()).padStart(2, '0');
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const year = parsed.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } else if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return '';
};

function TableRow({ id, no, year, semester, section, comp, date, prize, status, selected, onSelect, fileName, fileData, onViewFile, onDownloadFile, achievements }) {
  // FIX: Status class is now dynamically constructed using the styles object
  const statusClass = `${styles['achievements-status-pill']} ${styles[`achievements-status-${status}`]}`;
  
  // MODIFIED: This function correctly formats dates to 'dd-MM-yyyy' for display.
  const displayDate = formatDateForDisplay(date);
  
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <div className={styles['table-spinner']} />
      <div style={{ marginTop: '12px', color: '#1e3a8a', fontWeight: 600, fontSize: '14px' }}>
        {message || 'Please wait Certificates are Fetching.'}
      </div>
    </div>
  </div>
);