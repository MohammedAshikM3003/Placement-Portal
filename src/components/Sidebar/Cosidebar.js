import React, { useState, useEffect, useCallback, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import API_BASE_URL from '../../utils/apiConfig';
import { resolveProfileUrl, fetchAndCacheBlob, clearBlobCache } from './profileUtils';
import mongoDBService from '../../services/mongoDBService.jsx';
import { getCoordinatorScopedKey } from '../../utils/coordinatorCacheKeys';
import styles from './Cosidebar.module.css';

// Assets
import Adminicon from '../../assets/Adminicon.png';
import CoDashboard from '../../assets/CoDashboard.svg';
import ManageStudents from "../../assets/ManageStudents.svg";
import CooTrainingicon from "../../assets/Coo_Trainingicon.svg";
import AdminCompsnyProfileicon from "../../assets/CompanyProfileicon.svg";
import AdminCompanydriveicon from "../../assets/CompanyDriveicon.svg";
import Coordcertificate from "../../assets/CertificateVerrificationicon.svg";
import CoordEligiblestudent from "../../assets/CoordEligiblestudent.svg";
import AdminAttendanceicon from "../../assets/AdminAttendanceicon.svg";
import AdminPlacedStudentsicon from "../../assets/PlacedStudentIcon.svg";
import AdminResourceAnalysisicon from "../../assets/Reportanalysisicon.svg";
import AdminProfileicon from "../../assets/AdminProfileicon.svg";

// Module-level cache (persists across component unmount/remount - PREVENTS FLICKERING!)
let cachedCoordinatorProfile = null;
let cachedCoordinatorTimestamp = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

const sidebarItems = [
  { icon: CoDashboard, text: 'Dashboard', view: 'dashboard' },
  { icon: ManageStudents, text: 'Manage Students', view: 'manage-students' },
  { icon: CooTrainingicon, text: 'Placement Training', view: 'training' },
  { icon: AdminCompsnyProfileicon, text: 'Company Profile', view: 'company-profile' },
  { icon: AdminCompanydriveicon, text: 'Company Drive', view: 'company-drive' },
  { icon: Coordcertificate, text: 'Certificate Verification', view: 'certificate-verification' },
  { icon: CoordEligiblestudent, text: 'Eligible Students', view: 'eligible-students' },
  { icon: AdminAttendanceicon, text: 'Attendance', view: 'attendance' },
  { icon: AdminPlacedStudentsicon, text: 'Placed Students', view: 'placed-students' },
  { icon: AdminResourceAnalysisicon, text: 'Report Analysis', view: 'report-analysis' },
];

const viewToPath = (view) => `/coo-` + view;

// Normalize profile photo URL (resolve GridFS paths)
const normalizeCoordinatorProfilePhoto = (value) => {
  if (!value) return null;
  const resolved = resolveProfileUrl(value, API_BASE_URL);
  return resolved || null;
};

const getCoordinatorProfileCacheKeys = (source = null) => ({
  profileCacheKey: getCoordinatorScopedKey('coordinatorProfileCache', source),
  profileCacheTimeKey: getCoordinatorScopedKey('coordinatorProfileCacheTime', source),
  photoCacheKey: getCoordinatorScopedKey('cachedCoordinatorPicUrl', source)
});

const Cosidebar = ({ isOpen, onLogout, onViewChange, onClose }) => {
  const { logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const hasFetchedRef = useRef(false); // Prevent duplicate fetches


  // State for coordinator profile data - initialize from MODULE-LEVEL cache first (INSTANT!)
  const [coordinatorProfile, setCoordinatorProfile] = useState(() => {
    // PRIORITY 1: Check module-level cache (fastest - already in memory)
    if (cachedCoordinatorProfile && cachedCoordinatorTimestamp && (Date.now() - cachedCoordinatorTimestamp < CACHE_DURATION)) {
      console.log('⚡ Coordinator Sidebar: Loaded from memory cache (instant - NO FLICKERING)');
      return cachedCoordinatorProfile;
    }

    // PRIORITY 2: Check localStorage cache
    const cachedProfile = localStorage.getItem(getCoordinatorProfileCacheKeys().profileCacheKey);
    if (cachedProfile) {
      try {
        const data = JSON.parse(cachedProfile);
        if (data.name) {
          // Normalize profile photo
          if (data.profilePhoto) {
            data.profilePhoto = normalizeCoordinatorProfilePhoto(data.profilePhoto);
          }
          cachedCoordinatorProfile = data;
          cachedCoordinatorTimestamp = Date.now();
          console.log('⚡ Coordinator Sidebar: Loaded from localStorage');
          return data;
        }
      } catch (error) {
        console.error('Error parsing cached profile:', error);
      }
    }

    return {
      name: 'Coordinator',
      profilePhoto: null
    };
  });

  // Image handling states
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);

  // Function to fetch coordinator profile data
  const fetchCoordinatorProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const coordinatorId = localStorage.getItem('coordinatorId') || localStorage.getItem('coordinatorUsername');
      if (!coordinatorId) {
        console.warn('⚠️ No coordinator ID found');
        return;
      }

      const response = await mongoDBService.getCoordinatorById(coordinatorId);
      const data = response?.coordinator || response;

      if (data) {
        const fullName = (data.firstName || data.lastName)
          ? `${data.firstName || ''} ${data.lastName || ''}`.trim()
          : 'Coordinator';

        let profilePhotoUrl = normalizeCoordinatorProfilePhoto(data.profilePhoto || data.profilePicURL);
        
        // Resolve profile photo blob URL for smoother rendering
        try {
          if (profilePhotoUrl) {
            const resolved = resolveProfileUrl(profilePhotoUrl, API_BASE_URL);
            if (resolved && resolved !== profilePhotoUrl) {
              profilePhotoUrl = resolved;
            }
            try {
              const blobUrl = await fetchAndCacheBlob(profilePhotoUrl);
              if (blobUrl) {
                profilePhotoUrl = blobUrl;
              }
            } catch (_) { /* best-effort */ }
          }
        } catch (_) { /* best-effort */ }

        const profileData = {
          name: fullName,
          profilePhoto: profilePhotoUrl || null
        };
        const { profileCacheKey, profileCacheTimeKey, photoCacheKey } = getCoordinatorProfileCacheKeys(data);

        // Update module-level cache AND state
        cachedCoordinatorProfile = profileData;
        cachedCoordinatorTimestamp = Date.now();
        setCoordinatorProfile({ ...profileData });
        setImageError(false);
        setImageKey(Date.now());

        // Cache to localStorage for persistence across sessions
        localStorage.setItem(profileCacheKey, JSON.stringify(profileData));
        localStorage.setItem(profileCacheTimeKey, Date.now().toString());
        if (profilePhotoUrl) {
          localStorage.setItem(photoCacheKey, profilePhotoUrl);
        }
        console.log('✓ Coordinator sidebar profile updated:', fullName);

        // Preload image if exists
        if (profilePhotoUrl) {
          const img = new Image();
          img.onload = () => {
            console.log('✓ Coordinator profile image preloaded successfully');
            setImageKey(Date.now());
            setImageError(false);
          };
          img.onerror = () => {
            console.warn('⚠️ Failed to load coordinator profile image');
            setImageError(true);
          };
          img.src = profilePhotoUrl;
        }
      }
    } catch (error) {
      console.error('❌ Error fetching coordinator profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch coordinator profile on mount - ONLY if cache is expired or not fetched yet
  useEffect(() => {
    console.log('🔵 Coordinator Sidebar: useEffect triggered', {
      hasCachedProfile: !!cachedCoordinatorProfile,
      cacheValid: cachedCoordinatorProfile && cachedCoordinatorTimestamp && (Date.now() - cachedCoordinatorTimestamp < CACHE_DURATION),
      hasFetched: hasFetchedRef.current
    });

    if (
      hasFetchedRef.current &&
      cachedCoordinatorProfile &&
      cachedCoordinatorTimestamp &&
      (Date.now() - cachedCoordinatorTimestamp < CACHE_DURATION)
    ) {
      console.log('✅ Coordinator Sidebar: Already initialized with valid cache, skipping fetch');
      return;
    }

    if (
      cachedCoordinatorProfile &&
      cachedCoordinatorTimestamp &&
      (Date.now() - cachedCoordinatorTimestamp < CACHE_DURATION)
    ) {
      console.log('✅ Coordinator Sidebar: Using valid cache, skipping fetch');
      hasFetchedRef.current = true;
      if (coordinatorProfile.name !== cachedCoordinatorProfile.name || coordinatorProfile.profilePhoto !== cachedCoordinatorProfile.profilePhoto) {
        setCoordinatorProfile(cachedCoordinatorProfile);
      }
      return;
    }

    if (hasFetchedRef.current) {
      console.log('⏭️ Coordinator Sidebar: Already fetched in this lifecycle, skipping');
      return;
    }

    console.log('🔄 Coordinator Sidebar: Cache expired or missing, fetching...');
    hasFetchedRef.current = true;
    fetchCoordinatorProfile();
  }, [fetchCoordinatorProfile, coordinatorProfile.name, coordinatorProfile.profilePhoto]);

  // Listen for profile update events (when coordinator saves their profile)
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      console.log('🔄 Coordinator profile update detected in sidebar');

      if (event.detail) {
        const data = event.detail;
        const fullName = (data.firstName || data.lastName)
          ? `${data.firstName || ''} ${data.lastName || ''}`.trim()
          : 'Coordinator';

        let updatedPhoto = data.profilePhoto || data.profilePicURL || null;
        try { updatedPhoto = resolveProfileUrl(updatedPhoto, API_BASE_URL); } catch (_) {}

        const profileData = {
          name: fullName,
          profilePhoto: normalizeCoordinatorProfilePhoto(updatedPhoto)
        };
        const { profileCacheKey, profileCacheTimeKey, photoCacheKey } = getCoordinatorProfileCacheKeys(data);

        // Update module-level cache AND state
        cachedCoordinatorProfile = profileData;
        cachedCoordinatorTimestamp = Date.now();
        setCoordinatorProfile(profileData);
        setImageError(false);
        setImageKey(Date.now());
        setIsLoading(false);

        // Cache to localStorage
        localStorage.setItem(profileCacheKey, JSON.stringify(profileData));
        localStorage.setItem(profileCacheTimeKey, Date.now().toString());
        if (updatedPhoto) {
          localStorage.setItem(photoCacheKey, updatedPhoto);
        }
        console.log('✓ Coordinator sidebar updated instantly from event payload');

        if (updatedPhoto) {
          const img = new Image();
          img.onload = () => {
            console.log('✓ Updated coordinator image preloaded');
            setImageKey(Date.now());
            setImageError(false);
          };
          img.onerror = () => {
            console.warn('⚠️ Failed to load updated coordinator image');
            setImageError(true);
          };
          img.src = updatedPhoto;
        }
        return;
      }

      setImageError(false);
      setImageKey(Date.now());
      setIsLoading(true);

      setTimeout(() => {
        fetchCoordinatorProfile();
      }, 50);
    };

    const handleForceRefresh = (event) => {
      console.log('🔄 Force refresh coordinator profile in sidebar');

      if (event.detail) {
        const data = event.detail;
        const fullName = (data.firstName || data.lastName)
          ? `${data.firstName || ''} ${data.lastName || ''}`.trim()
          : 'Coordinator';

        let updatedPhoto = data.profilePhoto || data.profilePicURL || null;
        try { updatedPhoto = resolveProfileUrl(updatedPhoto, API_BASE_URL); } catch (_) {}

        const profileData = {
          name: fullName,
          profilePhoto: normalizeCoordinatorProfilePhoto(updatedPhoto)
        };

        const { profileCacheKey, profileCacheTimeKey, photoCacheKey } = getCoordinatorProfileCacheKeys(data);

        // Update module-level cache AND state
        cachedCoordinatorProfile = profileData;
        cachedCoordinatorTimestamp = Date.now();
        setCoordinatorProfile(profileData);
        setImageError(false);
        setImageKey(Date.now());
        setIsLoading(false);
        console.log('✓ Coordinator sidebar force-refreshed from event payload');
        return;
      }

      setImageError(false);
      setImageKey(Date.now());
      setIsLoading(true);

      setTimeout(() => {
        fetchCoordinatorProfile();
      }, 100);
    };

    window.addEventListener('coordinatorProfileUpdated', handleProfileUpdate);
    window.addEventListener('forceCoordinatorProfileRefresh', handleForceRefresh);

    const handleStorageChange = (e) => {
      if (e.key === 'coordinatorProfileCacheTime' && e.newValue) {
        console.log('🔄 Coordinator profile cache updated, refreshing sidebar');
        setImageError(false);
        setImageKey(Date.now());
        cachedCoordinatorTimestamp = null;
        fetchCoordinatorProfile();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('coordinatorProfileUpdated', handleProfileUpdate);
      window.removeEventListener('forceCoordinatorProfileRefresh', handleForceRefresh);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchCoordinatorProfile]);

  const isStudentCertificatePage = currentPath.startsWith('/coo-student-certificates/');
  const isManageStudentsViewPage = currentPath.startsWith('/coo-manage-students/view/');
  const isManageStudentsEditPage = currentPath.startsWith('/coo-manage-students/edit/');
  const isTrainingPage = currentPath === '/coo-training' || currentPath === '/coo-train-attendance-stuinfo';
  const isCompanyDrivePage = currentPath === '/coo-company-drive' || currentPath.startsWith('/coo-company-drive/');
  const isEligibleStudentsPage = currentPath === '/coo-eligible-students' || currentPath === '/coo-eligible-students/view';
  const isReportAnalysisPage = currentPath.startsWith('/coo-report-analysis');
  const isManageStudentsSemesterPage = 
    currentPath.startsWith('/coo-manage-students-semester') || 
    currentPath === '/coo-ms-semester-detail';

  const handleLogoutClick = async () => {
    cachedCoordinatorProfile = null;
    cachedCoordinatorTimestamp = null;

    try { clearBlobCache(); } catch (_) {}

    // Clear all coordinator data
    localStorage.removeItem('authToken');
    localStorage.removeItem('authRole');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('coordinatorId');
    localStorage.removeItem('coordinatorUsername');
    localStorage.removeItem('isCoordinatorLoggedIn');
    localStorage.removeItem('coordinatorData');
    localStorage.removeItem('coordinatorToken');

    // Clear caches
    Object.keys(localStorage).forEach((key) => {
      if (
        key === 'coordinatorProfileCache' || 
        key.startsWith('coordinatorProfileCache_') || 
        key === 'cachedCoordinatorPicUrl' || 
        key.startsWith('cachedCoordinatorPicUrl_') || 
        key === 'coordinatorProfileCacheTime' || 
        key.startsWith('coordinatorProfileCacheTime_')
      ) {
        localStorage.removeItem(key);
      }
    });

    if (authLogout) {
      await authLogout();
    }
    navigate('/');
  };

  const handleOverlayClick = () => {
    if (onClose) {
      onClose();
      return;
    }
    window.dispatchEvent(new CustomEvent('closeSidebar'));
    const hamburger = 
      document.querySelector('button[class*="hamburger-menu"]') || 
      document.querySelector('button[class*="hamburgerMenu"]') || 
      document.querySelector('button[class*="ad-hamburger-menu"]') ||
      document.querySelector('button[class*="hamburger"]') ||
      document.querySelector('[aria-label*="navigation"]') ||
      document.querySelector('[class*="hamburgerIcon"]')?.closest('button');
    if (hamburger) {
      hamburger.click();
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className={`${styles.overlay} overlay`} 
          onClick={handleOverlayClick} 
        />
      )}
      <div className={`${styles.sidebar} coo-sidebar-container ${isOpen ? `${styles.open} open` : ''}`}>
        <div className={styles['user-info']}>
          <div className={styles['user-details']}>
            {coordinatorProfile.profilePhoto && !imageError ? (
              <img 
                key={imageKey}
                src={coordinatorProfile.profilePhoto} 
                alt="Profile" 
                onError={() => setImageError(true)}
              />
            ) : (
              <div className={styles['placeholder-circle']}>
                <img src={Adminicon} alt="Coordinator" />
              </div>
            )}

            <div className={styles['user-text']}>
              <span>{(isLoading ? 'Loading...' : (coordinatorProfile.name || 'Coordinator')).toUpperCase()}</span>
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          <div className={styles['nav-section']}>
            {sidebarItems.map((item) => (
              <NavLink
                key={item.text}
                to={viewToPath(item.view)}
                data-view={item.view}
                className={({ isActive }) => {
                  if (item.view === 'manage-students') {
                    const shouldHighlight = isActive || isStudentCertificatePage || isManageStudentsViewPage || isManageStudentsEditPage || isManageStudentsSemesterPage;
                    return `${styles['nav-item']} ${shouldHighlight ? styles.selected : ''}`;
                  }

                  if (item.view === 'training') {
                    const shouldHighlight = isActive || isTrainingPage;
                    return `${styles['nav-item']} ${shouldHighlight ? styles.selected : ''}`;
                  }

                  if (item.view === 'company-drive') {
                    const shouldHighlight = isActive || isCompanyDrivePage;
                    return `${styles['nav-item']} ${shouldHighlight ? styles.selected : ''}`;
                  }

                  if (item.view === 'eligible-students') {
                    const shouldHighlight = isActive || isEligibleStudentsPage;
                    return `${styles['nav-item']} ${shouldHighlight ? styles.selected : ''}`;
                  }

                  if (item.view === 'report-analysis') {
                    const shouldHighlight = isActive || isReportAnalysisPage;
                    return `${styles['nav-item']} ${shouldHighlight ? styles.selected : ''}`;
                  }

                  return `${styles['nav-item']} ${isActive ? styles.selected : ''}`;
                }}
                onClick={(e) => {
                  if (onViewChange) {
                    e.preventDefault();
                    onViewChange(item.view);
                  }

                  // Auto-close sidebar on mobile after navigation
                  if (window.innerWidth <= 1200) {
                    handleOverlayClick();
                  }
                }}
              >
                <img src={item.icon} alt={item.text} />
                <span className={styles['nav-text']}>{item.text}</span>
              </NavLink>
            ))}
          </div>

          <div className={styles['nav-divider']}></div>

          <NavLink
            to="/coo-profile"
            className={({ isActive }) => `${styles['nav-item']} ${isActive ? styles.selected : ''}`}
            onClick={(e) => {
              if (onViewChange) {
                e.preventDefault();
                onViewChange('profile');
              }

              if (window.innerWidth <= 1200) {
                handleOverlayClick();
              }
            }}
          >
            <img src={AdminProfileicon} alt="Profile" />
            <span className={styles['nav-text']}>Profile</span>
          </NavLink>

          <button className={styles['logout-btn']} onClick={handleLogoutClick}>
            Logout
          </button>
        </nav>
      </div>
    </>
  );
};

export default Cosidebar;