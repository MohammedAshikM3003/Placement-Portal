import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Cosidebar.module.css';
import API_BASE_URL from '../../utils/apiConfig';

// Assets
import Adminicon from '../../assets/Adminicon.png';
import mongoDBService from '../../services/mongoDBService.jsx';

// Assets
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

const COORDINATOR_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

let cachedCoordinator = null;
let coordinatorCacheTimestamp = null;
let cachedCoordinatorPicUrl = null;
let cachedCoordinatorBlobUrl = null;
let cachedCoordinatorBlobSourceUrl = null;
let coordinatorBlobFetchInProgress = null;

const coordinateMimeFromName = (name) => {
  if (!name || typeof name !== 'string') {
    return 'image/jpeg';
  }

  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.bmp')) return 'image/bmp';
  return 'image/jpeg';
};

const isLikelyBase64 = (value) => {
  if (!value || typeof value !== 'string') return false;
  if (value.startsWith('data:') || value.startsWith('http') || value.startsWith('blob:')) {
    return false;
  }
  const cleaned = value.replace(/\s+/g, '');
  // Basic heuristic: only base64 characters and reasonable length
  return /^[A-Za-z0-9+/=]+$/.test(cleaned) && cleaned.length > 64;
};

const normalizeProfileUrl = (record = {}, fallback = {}) => {
  const {
    profilePicURL,
    profilePhoto,
    profilePhotoUrl,
    photoURL,
    profilePhotoName
  } = record || {};

  const source = profilePicURL || profilePhoto || profilePhotoUrl || photoURL;
  if (!source) {
    if (!fallback) return null;
    const fallbackSource = fallback.profilePicURL || fallback.profilePhoto || fallback.profilePhotoUrl || fallback.photoURL;
    if (!fallbackSource) return null;
    if (fallbackSource.startsWith('data:') || fallbackSource.startsWith('http') || fallbackSource.startsWith('blob:')) {
      return fallbackSource;
    }
    if (fallbackSource.startsWith('/api/file/')) {
      const backendBase = API_BASE_URL.replace('/api', '');
      return `${backendBase}${fallbackSource}`;
    }
    const mime = coordinateMimeFromName(fallback.profilePhotoName);
    return `data:${mime};base64,${fallbackSource}`;
  }

  if (source.startsWith('data:') || source.startsWith('http') || source.startsWith('blob:')) {
    return source;
  }

  // GridFS relative path /api/file/... - prepend backend base URL
  if (source.startsWith('/api/file/')) {
    const backendBase = API_BASE_URL.replace('/api', '');
    return `${backendBase}${source}`;
  }

  if (isLikelyBase64(source)) {
    const mime = coordinateMimeFromName(profilePhotoName || fallback.profilePhotoName);
    return `data:${mime};base64,${source}`;
  }

  return source;
};

const mergeCoordinatorData = (baseData, incomingData) => {
  const merged = { ...(baseData || {}), ...(incomingData || {}) };
  const resolvedPhoto = normalizeProfileUrl(incomingData, baseData);
  if (resolvedPhoto) {
    merged.profilePicURL = resolvedPhoto;
  }
  return merged;
};

const readCoordinatorDataFromStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const stored = window.localStorage.getItem('coordinatorData');
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored);
    const merged = mergeCoordinatorData(null, parsed);

    // Persist computed profilePicURL back to localStorage so it's available
    // on future reads without re-computing (avoids needing a network fetch just for the URL)
    if (merged.profilePicURL && merged.profilePicURL !== parsed.profilePicURL) {
      try {
        window.localStorage.setItem('coordinatorData', JSON.stringify({ ...parsed, profilePicURL: merged.profilePicURL }));
      } catch (_) { /* non-critical */ }
    }

    return merged;
  } catch (error) {
    console.error('Failed to parse coordinatorData from storage:', error);
    return null;
  }
};

const fetchAndCacheCoordinatorBlob = async (url) => {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (cachedCoordinatorBlobUrl && cachedCoordinatorBlobSourceUrl === url) return cachedCoordinatorBlobUrl;
  if (cachedCoordinatorBlobUrl && cachedCoordinatorBlobSourceUrl !== url) {
    URL.revokeObjectURL(cachedCoordinatorBlobUrl);
    cachedCoordinatorBlobUrl = null;
    cachedCoordinatorBlobSourceUrl = null;
  }
  if (coordinatorBlobFetchInProgress) return coordinatorBlobFetchInProgress;
  coordinatorBlobFetchInProgress = (async () => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      if (blob.size > 0) {
        cachedCoordinatorBlobUrl = URL.createObjectURL(blob);
        cachedCoordinatorBlobSourceUrl = url;
        return cachedCoordinatorBlobUrl;
      }
      return url;
    } catch (e) {
      return url;
    } finally {
      coordinatorBlobFetchInProgress = null;
    }
  })();
  return coordinatorBlobFetchInProgress;
};

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

const Cosidebar = ({ isOpen, onLogout, currentView, onViewChange }) => {
  const { logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const hasFetchedRef = useRef(false);

  const [coordinatorData, setCoordinatorData] = useState(() => {
    if (
      cachedCoordinator &&
      coordinatorCacheTimestamp &&
      Date.now() - coordinatorCacheTimestamp < COORDINATOR_CACHE_DURATION
    ) {
      // Refresh timestamp on each mount so 5-min TTL resets on navigation
      coordinatorCacheTimestamp = Date.now();
      return cachedCoordinator;
    }

    const storedData = readCoordinatorDataFromStorage();
    if (storedData) {
      cachedCoordinator = storedData;
      coordinatorCacheTimestamp = Date.now();
      return storedData;
    }

    return null;
  });
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());

  const [profilePhotoUrl, setProfilePhotoUrl] = useState(() => {
    // P0: blob URL (instant, in-memory)
    if (cachedCoordinatorBlobUrl) return cachedCoordinatorBlobUrl;
    // P1: module-level URL cache
    if (cachedCoordinatorPicUrl) return cachedCoordinatorPicUrl;
    // P2: separate localStorage key
    try {
      const cached = localStorage.getItem('cachedCoordinatorPicUrl');
      if (cached) { cachedCoordinatorPicUrl = cached; return cached; }
    } catch (_) {}
    // P3: from cached coordinator data (module-level)
    if (cachedCoordinator) {
      const url = normalizeProfileUrl(cachedCoordinator);
      if (url) { cachedCoordinatorPicUrl = url; return url; }
    }
    // P4: from localStorage coordinatorData
    try {
      const stored = JSON.parse(localStorage.getItem('coordinatorData') || 'null');
      if (stored) {
        const url = normalizeProfileUrl(stored);
        if (url) {
          cachedCoordinatorPicUrl = url;
          localStorage.setItem('cachedCoordinatorPicUrl', url);
          return url;
        }
      }
    } catch (_) {}
    return null;
  });

  const coordinatorUsername = useMemo(() => {
    if (coordinatorData?.firstName || coordinatorData?.lastName) {
      return `${coordinatorData.firstName || ''} ${coordinatorData.lastName || ''}`.trim() || (coordinatorData.username || 'Coordinator');
    }
    return coordinatorData?.username || localStorage.getItem('coordinatorUsername') || coordinatorData?.coordinatorId || 'Coordinator';
  }, [coordinatorData]);

  // Background: cache profile image as blob for instant rendering on next mount
  useEffect(() => {
    if (!profilePhotoUrl || profilePhotoUrl.startsWith('blob:') || profilePhotoUrl.startsWith('data:')) return;
    if (cachedCoordinatorBlobUrl && cachedCoordinatorBlobSourceUrl === profilePhotoUrl) {
      setProfilePhotoUrl(cachedCoordinatorBlobUrl);
      return;
    }
    fetchAndCacheCoordinatorBlob(profilePhotoUrl).then(blobUrl => {
      if (blobUrl && blobUrl.startsWith('blob:')) setProfilePhotoUrl(blobUrl);
    });
  }, [profilePhotoUrl]);

  useEffect(() => {
    const fetchCoordinatorProfile = async () => {
      // Skip if already fetched in this lifecycle and cache is still valid
      if (
        hasFetchedRef.current &&
        cachedCoordinator &&
        coordinatorCacheTimestamp &&
        (Date.now() - coordinatorCacheTimestamp < COORDINATOR_CACHE_DURATION)
      ) {
        return;
      }

      const stored = localStorage.getItem('coordinatorData');
      if (!stored) {
        return;
      }

      let parsed = null;
      try {
        parsed = JSON.parse(stored);

        const coordinatorId = parsed?.coordinatorId || parsed?._id || parsed?.id;

        if (!coordinatorId) {
          const normalized = mergeCoordinatorData(null, parsed);
          setCoordinatorData(normalized);
          cachedCoordinator = normalized;
          coordinatorCacheTimestamp = Date.now();
          hasFetchedRef.current = true;
          return;
        }

        // Skip network fetch if module-level cache is fresh and has coordinator identity.
        if (
          cachedCoordinator &&
          coordinatorCacheTimestamp &&
          (Date.now() - coordinatorCacheTimestamp < COORDINATOR_CACHE_DURATION) &&
          (cachedCoordinator?.coordinatorId || cachedCoordinator?.username)
        ) {
          setCoordinatorData(cachedCoordinator);
          hasFetchedRef.current = true;
          return;
        }

        const response = await mongoDBService.getCoordinatorById(coordinatorId);
        const normalizedResponse = response?.coordinator || response;

        if (normalizedResponse) {
          const enriched = mergeCoordinatorData(parsed, {
            ...normalizedResponse,
            coordinatorId: normalizedResponse.coordinatorId || parsed?.coordinatorId || coordinatorId,
            username: normalizedResponse.username || parsed?.username || parsed?.coordinatorId || coordinatorId
          });

          cachedCoordinator = enriched;
          coordinatorCacheTimestamp = Date.now();
          hasFetchedRef.current = true;
          setCoordinatorData(enriched);

          if (enriched.profilePicURL) {
            setProfilePhotoUrl(enriched.profilePicURL);
            cachedCoordinatorPicUrl = enriched.profilePicURL;
            localStorage.setItem('cachedCoordinatorPicUrl', enriched.profilePicURL);
          }

          try {
            localStorage.setItem('coordinatorData', JSON.stringify(enriched));
          } catch (storageError) {
            console.error('Failed to persist coordinator data:', storageError);
          }

          if (enriched.profilePicURL) {
            const img = new Image();
            img.onload = () => setImageKey(Date.now());
            img.onerror = () => setImageError(true);
            img.src = enriched.profilePicURL;
          } else {
            setImageError(false);
          }
        } else {
          const fallbackData = mergeCoordinatorData(null, parsed);
          setCoordinatorData(fallbackData);
          cachedCoordinator = fallbackData;
          coordinatorCacheTimestamp = Date.now();
          setImageError(false);
        }
      } catch (error) {
        console.error('Failed to fetch coordinator profile:', error);
        if (parsed) {
          setCoordinatorData(prev => prev || mergeCoordinatorData(null, parsed));
        }
      } finally {
        // no spinner state to avoid flicker
      }
    };

    fetchCoordinatorProfile();
  }, []);

  useEffect(() => {
    const resetCache = () => {
      cachedCoordinator = null;
      coordinatorCacheTimestamp = null;
    };

    const handleCoordinatorStorageChange = (event) => {
      if (typeof window === 'undefined') {
        return;
      }

      if (!event) {
        return;
      }

      if (event.storageArea !== window.localStorage) {
        return;
      }

      const relevantKeys = new Set([
        'coordinatorData',
        'coordinatorUsername',
        'coordinatorToken',
        'isCoordinatorLoggedIn'
      ]);

      if (event.key && !relevantKeys.has(event.key)) {
        return;
      }

      if (event.key === 'coordinatorData') {
        if (!event.newValue) {
          resetCache();
          setCoordinatorData(null);
          setImageError(false);
          return;
        }

        try {
          const parsed = JSON.parse(event.newValue);
          const normalized = mergeCoordinatorData(null, parsed);
          cachedCoordinator = normalized;
          coordinatorCacheTimestamp = Date.now();
          setCoordinatorData(normalized);
          setImageError(false);
          setImageKey(Date.now());
          if (normalized.profilePicURL) {
            setProfilePhotoUrl(normalized.profilePicURL);
            cachedCoordinatorPicUrl = normalized.profilePicURL;
            localStorage.setItem('cachedCoordinatorPicUrl', normalized.profilePicURL);
          }
        } catch (error) {
          console.error('Failed to parse coordinatorData from storage event:', error);
        }
        return;
      }

      if (event.key === null) {
        resetCache();
        setCoordinatorData(null);
        setImageError(false);
        return;
      }

      const storedData = readCoordinatorDataFromStorage();
      if (!storedData) {
        resetCache();
        setCoordinatorData(null);
        setImageError(false);
        return;
      }

      cachedCoordinator = storedData;
      coordinatorCacheTimestamp = Date.now();
      setCoordinatorData(storedData);
      setImageError(false);
      setImageKey(Date.now());
    };

    window.addEventListener('storage', handleCoordinatorStorageChange);
    return () => {
      window.removeEventListener('storage', handleCoordinatorStorageChange);
    };
  }, []);

  useEffect(() => {
    const handleCoordinatorUpdate = (event) => {
      if (!event?.detail) return;
      setCoordinatorData((prev) => {
        const nextMerged = mergeCoordinatorData(prev, event.detail);
        cachedCoordinator = nextMerged;
        coordinatorCacheTimestamp = Date.now();
        setImageError(false);
        setImageKey(Date.now());
        if (nextMerged.profilePicURL) {
          setProfilePhotoUrl(nextMerged.profilePicURL);
          cachedCoordinatorPicUrl = nextMerged.profilePicURL;
          localStorage.setItem('cachedCoordinatorPicUrl', nextMerged.profilePicURL);
        }
        try {
          localStorage.setItem('coordinatorData', JSON.stringify(nextMerged));
        } catch (storageError) {
          console.error('Failed to persist coordinator data update:', storageError);
        }
        return nextMerged;
      });
    };

    window.addEventListener('coordinatorProfileUpdated', handleCoordinatorUpdate);
    return () => {
      window.removeEventListener('coordinatorProfileUpdated', handleCoordinatorUpdate);
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
          {profilePhotoUrl && !imageError ? (
            <img
              key={`${profilePhotoUrl}_${coordinatorData?.coordinatorId || ''}_${imageKey}`}
              src={profilePhotoUrl}
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
            <span>{coordinatorUsername}</span>
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
          
          // Clear legacy keys
          localStorage.removeItem('coordinatorData');
          localStorage.removeItem('coordinatorToken');
          
          // Clear cache
          cachedCoordinator = null;
          coordinatorCacheTimestamp = null;
          cachedCoordinatorPicUrl = null;
          if (cachedCoordinatorBlobUrl) {
            URL.revokeObjectURL(cachedCoordinatorBlobUrl);
            cachedCoordinatorBlobUrl = null;
            cachedCoordinatorBlobSourceUrl = null;
          }
          localStorage.removeItem('cachedCoordinatorPicUrl');
          
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