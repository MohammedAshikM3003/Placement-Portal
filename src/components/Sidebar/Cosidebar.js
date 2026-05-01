import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Cosidebar.module.css';
import API_BASE_URL from '../../utils/apiConfig';
import { resolveProfileUrl } from './profileUtils';
import mongoDBService from '../../services/mongoDBService.jsx';
import { getCoordinatorScopedKey } from '../../utils/coordinatorCacheKeys';

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

const Cosidebar = ({ isOpen, onLogout, currentView, onViewChange }) => {
  const { logout: authLogout } = useAuth();
  const navigate = useNavigate();
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

  // Function to fetch coordinator profile data
  const fetchCoordinatorProfile = async () => {
    try {
      const coordinatorId = localStorage.getItem('coordinatorId') || localStorage.getItem('coordinatorUsername');
      if (!coordinatorId) {
        console.warn('⚠️ No coordinator ID found');
        return;
      }

      const authToken = localStorage.getItem('authToken');
      const response = await mongoDBService.getCoordinatorById(coordinatorId);
      const data = response?.coordinator || response;

      if (data) {
        const fullName = (data.firstName || data.lastName)
          ? `${data.firstName || ''} ${data.lastName || ''}`.trim()
          : 'Coordinator';

        let profilePhotoUrl = normalizeCoordinatorProfilePhoto(data.profilePhoto || data.profilePicURL);

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

        // Preload image if exists to ensure it's ready (using Image object - simple & proven)
        if (profilePhotoUrl) {
          const img = new Image();
          img.onload = () => {
            console.log('✓ Coordinator profile image preloaded successfully');
            setImageKey(Date.now()); // Force image to re-render once loaded
            setImageError(false);
          };
          img.onerror = () => {
            console.warn('⚠️ Failed to load coordinator profile image');
            setImageError(true);
          };
          img.src = profilePhotoUrl;
        }

        // Cache to localStorage for persistence across sessions
        localStorage.setItem(profileCacheKey, JSON.stringify(profileData));
        localStorage.setItem(profileCacheTimeKey, Date.now().toString());
        if (profilePhotoUrl) {
          localStorage.setItem(photoCacheKey, profilePhotoUrl);
        }
        console.log('✓ Coordinator sidebar profile updated:', fullName);
      }
    } catch (error) {
      console.error('❌ Error fetching coordinator profile:', error);
    }
  };

  // Fetch coordinator profile on mount - ONLY if cache is expired or not fetched yet
  useEffect(() => {
    // PRIORITY 1: If we already have valid cached data and have fetched, skip
    if (
      hasFetchedRef.current &&
      cachedCoordinatorProfile &&
      cachedCoordinatorTimestamp &&
      (Date.now() - cachedCoordinatorTimestamp < CACHE_DURATION)
    ) {
      console.log('✅ Coordinator Sidebar: Already initialized with valid cache, skipping fetch');
      return;
    }

    // PRIORITY 2: Check if cache is valid - if so, use it without fetching
    if (
      cachedCoordinatorProfile &&
      cachedCoordinatorTimestamp &&
      (Date.now() - cachedCoordinatorTimestamp < CACHE_DURATION)
    ) {
      console.log('✅ Coordinator Sidebar: Using valid cache, skipping fetch');
      hasFetchedRef.current = true;
      // Only update state if different to prevent re-render
      if (coordinatorProfile.name !== cachedCoordinatorProfile.name || coordinatorProfile.profilePhoto !== cachedCoordinatorProfile.profilePhoto) {
        setCoordinatorProfile(cachedCoordinatorProfile);
      }
      return;
    }

    // Only fetch if we haven't fetched yet in this component lifecycle
    if (hasFetchedRef.current) {
      console.log('⏭️ Coordinator Sidebar: Already fetched in this lifecycle, skipping');
      return;
    }

    console.log('🔄 Coordinator Sidebar: Cache expired or missing, fetching...');
    hasFetchedRef.current = true;
    fetchCoordinatorProfile();
  }, []);

  // Listen for profile update events (when coordinator saves their profile)
  useEffect(() => {
    const handleProfileUpdate = (event) => {
      if (event.detail) {
        const data = event.detail;
        const fullName = (data.firstName || data.lastName)
          ? `${data.firstName || ''} ${data.lastName || ''}`.trim()
          : 'Coordinator';

        let updatedPhoto = normalizeCoordinatorProfilePhoto(data.profilePhoto || data.profilePicURL);

        const profileData = {
          name: fullName,
          profilePhoto: updatedPhoto
        };
        const { profileCacheKey, profileCacheTimeKey, photoCacheKey } = getCoordinatorProfileCacheKeys(data);

        // Update module-level cache AND state
        cachedCoordinatorProfile = profileData;
        cachedCoordinatorTimestamp = Date.now();
        setCoordinatorProfile(profileData);
        setImageError(false);
        setImageKey(Date.now()); // Force re-render

        // Cache to localStorage
        localStorage.setItem(profileCacheKey, JSON.stringify(profileData));
        localStorage.setItem(profileCacheTimeKey, Date.now().toString());
        if (updatedPhoto) {
          localStorage.setItem(photoCacheKey, updatedPhoto);
        }
        console.log('✓ Coordinator profile updated from event:', fullName);

        // Preload image
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
      }
    };

    window.addEventListener('coordinatorProfileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('coordinatorProfileUpdated', handleProfileUpdate);
    };
  }, []);

  const sidebarClasses = [styles.sidebar, isOpen ? styles.sidebarOpen : '']
    .filter(Boolean)
    .join(' ');

  const getNavItemClass = (view) =>
    [styles.navItem, currentView === view ? styles.navItemSelected : '']
      .filter(Boolean)
      .join(' ');

  const getProfileItemClass = () =>
    [styles.profileItem, currentView === 'profile' ? styles.profileItemSelected : '']
      .filter(Boolean)
      .join(' ');

  const handleViewChange = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  return (
    <div className={sidebarClasses}>
      <div className={styles.userInfo}>
        <div className={styles.userDetails}>
          {coordinatorProfile?.profilePhoto && !imageError ? (
            <img
              key={imageKey}
              src={coordinatorProfile.profilePhoto}
              alt="Coordinator"
              className={styles.coordinatorPhoto}
              onError={() => setImageError(true)}
            />
          ) : (
            <img
              src={Adminicon}
              alt="Coordinator"
              className={styles.coordinatorCap}
            />
          )}

          <div className={styles.userText}>
            <span>{coordinatorProfile?.name || 'Coordinator'}</span>
          </div>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navSection}>
          {sidebarItems.map((item) => (
            <button
              key={item.text}
              type="button"
              onClick={() => handleViewChange(item.view)}
              className={getNavItemClass(item.view)}
            >
              <img src={item.icon} alt="" className={styles.navIcon} />
              <span className={styles.navText}>{item.text}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className={styles.bottomSection}>
        <button
          type="button"
          onClick={() => handleViewChange('profile')}
          className={getProfileItemClass()}
        >
          <img src={AdminProfileicon} alt="" className={styles.navIcon} />
          <span className={styles.navText}>Profile</span>
        </button>

        <button type="button" className={styles.logoutBtn} onClick={async () => {
          // Clear all coordinator data
          localStorage.removeItem('authToken');
          localStorage.removeItem('authRole');
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('coordinatorId');
          localStorage.removeItem('coordinatorUsername');
          localStorage.removeItem('isCoordinatorLoggedIn');
          localStorage.removeItem('coordinatorData');
          localStorage.removeItem('coordinatorToken');
          Object.keys(localStorage).forEach((key) => {
            if (key === 'coordinatorProfileCache' || key.startsWith('coordinatorProfileCache_') || key === 'cachedCoordinatorPicUrl' || key.startsWith('cachedCoordinatorPicUrl_') || key === 'coordinatorProfileCacheTime' || key.startsWith('coordinatorProfileCacheTime_')) {
              localStorage.removeItem(key);
            }
          });

          // Clear module-level cache
          cachedCoordinatorProfile = null;
          cachedCoordinatorTimestamp = null;

          // Call AuthContext logout
          if (authLogout) {
            await authLogout();
          }

          // Navigate to landing page
          navigate('/');
        }}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Cosidebar;