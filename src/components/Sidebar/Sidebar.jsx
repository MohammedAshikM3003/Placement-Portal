import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Sidebar.module.css';
import Adminicon from '../../assets/Adminicon.png';
import { getStudentData } from '../../services/fastDataService.jsx';
import { API_BASE_URL } from '../../utils/apiConfig';

// Resolve GridFS profile URLs to full backend URLs
const resolveProfileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http') || url.startsWith('blob:')) return url;
  if (url.startsWith('/api/file/')) return `${API_BASE_URL}${url.replace('/api', '')}`;
  if (url.startsWith('/file/')) return `${API_BASE_URL}${url}`;
  if (/^[a-f0-9]{24}$/.test(url)) return `${API_BASE_URL}/file/${url}`;
  return url;
};

const sidebarItems = [
  { icon: require('../../assets/DashboardSideBarIcon.png'), text: 'Dashboard', view: 'dashboard' },
  { icon: require('../../assets/ResumeSideBarIcon.png'), text: 'Resume', view: 'resume' },
  { icon: require('../../assets/StuTrainingicon.svg').default, text: 'Training', view: 'training' },
  { icon: require('../../assets/AchievementsSideBarIcon.png'), text: 'Achievements', view: 'achievements' },
  { icon: require('../../assets/CompanySideBarIcon.svg').default, text: 'Company', view: 'company' },
];

// Cache for student data to prevent refetching
let cachedStudentData = null;
let cacheTimestamp = null;
let cachedProfilePicUrl = null; // Separate cache for profile pic URL
let cachedProfileBlobUrl = null; // Blob URL for instant rendering (stays in memory)
let cachedBlobSourceUrl = null; // The HTTP URL that was used to create the blob
let blobFetchInProgress = null; // Prevent concurrent blob fetches
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour - longer cache since profile updates are event-driven

// Fetch image and convert to blob URL for instant rendering on Sidebar remount
// Blob URLs are in-memory, so new <img> elements render them immediately
const fetchAndCacheAsBlob = async (url) => {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return url;
  // Return existing blob ONLY if it was created from the same source URL
  if (cachedProfileBlobUrl && cachedBlobSourceUrl === url) return cachedProfileBlobUrl;
  // If blob exists for a DIFFERENT URL (stale), revoke it first
  if (cachedProfileBlobUrl && cachedBlobSourceUrl !== url) {
    URL.revokeObjectURL(cachedProfileBlobUrl);
    cachedProfileBlobUrl = null;
    cachedBlobSourceUrl = null;
  }
  if (blobFetchInProgress) return blobFetchInProgress;

  blobFetchInProgress = (async () => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      if (blob.size > 0) {
        cachedProfileBlobUrl = URL.createObjectURL(blob);
        cachedBlobSourceUrl = url;
        console.log('🖼️ Sidebar: Profile image cached as blob for instant rendering');
        return cachedProfileBlobUrl;
      }
      return url;
    } catch (e) {
      console.warn('⚠️ Sidebar: Blob cache failed, using URL directly:', e.message);
      return url;
    } finally {
      blobFetchInProgress = null;
    }
  })();

  return blobFetchInProgress;
};

// Returns blob URL if it matches the given source URL, otherwise the source URL itself
const getPreferredUrl = (resolvedUrl) => {
  if (cachedProfileBlobUrl && cachedBlobSourceUrl === resolvedUrl) return cachedProfileBlobUrl;
  return resolvedUrl;
};

export const clearSidebarCache = () => {
  cachedStudentData = null;
  cacheTimestamp = null;
  cachedProfilePicUrl = null;
  if (cachedProfileBlobUrl) {
    URL.revokeObjectURL(cachedProfileBlobUrl);
    cachedProfileBlobUrl = null;
    cachedBlobSourceUrl = null;
  }
  blobFetchInProgress = null;
  localStorage.removeItem('cachedProfilePicUrl');
  console.log('🗑️ Sidebar cache cleared');
};

export const updateCachedProfilePic = (url) => {
  cachedProfilePicUrl = url;
  localStorage.setItem('cachedProfilePicUrl', url);
  // Invalidate blob cache since URL changed - will be re-cached on next render
  if (cachedProfileBlobUrl) {
    URL.revokeObjectURL(cachedProfileBlobUrl);
    cachedProfileBlobUrl = null;
    cachedBlobSourceUrl = null;
  }
  if (cachedStudentData) {
    cachedStudentData.profilePicURL = url;
  }
  // Pre-fetch new image as blob in background
  const resolvedUrl = resolveProfileUrl(url);
  if (resolvedUrl) fetchAndCacheAsBlob(resolvedUrl);
  console.log('📸 Sidebar: Profile pic cache updated', url);
};

const Sidebar = ({ isOpen, onLogout, onViewChange, currentView, studentData }) => {
  const { logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const hasFetchedRef = useRef(false);
  
  const [currentStudentData, setCurrentStudentData] = useState(() => {
    // Initialize from cache immediately on mount
    if (cachedStudentData && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      console.log('⚡ Sidebar: Loaded from cache on mount');
      return cachedStudentData;
    }
    // Fallback to localStorage if cache is expired
    try {
      const stored = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (stored) {
        console.log('⚡ Sidebar: Loaded from localStorage on mount');
        return stored;
      }
    } catch (e) {
      console.error('❌ Sidebar: Error loading from localStorage', e);
    }
    return null;
  });
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(() => {
    // PRIORITY 0: Check blob URL cache (instant rendering - already in memory)
    if (cachedProfileBlobUrl) {
      console.log('⚡ Sidebar: Profile pic from blob cache (instant)');
      return cachedProfileBlobUrl;
    }
    
    // PRIORITY 1: Check module-level URL cache
    if (cachedProfilePicUrl) {
      console.log('⚡ Sidebar: Profile pic URL from memory cache');
      return cachedProfilePicUrl;
    }

    // PRIORITY 2: Check localStorage for pre-resolved profile pic URL (set during auth)
    try {
      const cachedUrl = localStorage.getItem('cachedProfilePicUrl');
      if (cachedUrl) {
        cachedProfilePicUrl = cachedUrl;
        console.log('⚡ Sidebar: Profile pic URL from auth cache');
        return cachedUrl;
      }
    } catch (e) {
      console.error('❌ Sidebar: Error loading cached profile pic URL', e);
    }
    
    // PRIORITY 3: Try to get from cached student data
    if (cachedStudentData?.profilePicURL) {
      const resolvedUrl = resolveProfileUrl(cachedStudentData.profilePicURL);
      cachedProfilePicUrl = resolvedUrl;
      console.log('⚡ Sidebar: Profile pic URL from cached student data');
      return resolvedUrl;
    }
    
    // PRIORITY 4: Try to get from localStorage studentData
    try {
      const stored = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (stored?.profilePicURL) {
        const resolvedUrl = resolveProfileUrl(stored.profilePicURL);
        cachedProfilePicUrl = resolvedUrl;
        localStorage.setItem('cachedProfilePicUrl', resolvedUrl); // Cache for next time
        console.log('⚡ Sidebar: Profile pic URL from localStorage');
        return resolvedUrl;
      }
    } catch (e) {
      console.error('❌ Sidebar: Error loading profile pic from localStorage', e);
    }
    return '';
  });

  // Memoize the profile picture URL to prevent flickering
  // Only use profilePicUrl state to ensure stability
  const stableProfilePicUrl = useMemo(() => {
    return profilePicUrl;
  }, [profilePicUrl]);

  // Background: cache profile image as blob URL for instant rendering
  // When profilePicUrl is an HTTP URL, fetch it as blob and switch to blob URL
  // The blob→state transition is visually identical (same image) so no visible flicker
  useEffect(() => {
    if (!profilePicUrl || profilePicUrl.startsWith('blob:') || profilePicUrl.startsWith('data:')) return;
    // If blob already exists for this exact URL, switch to it immediately
    if (cachedProfileBlobUrl && cachedBlobSourceUrl === profilePicUrl) {
      setProfilePicUrl(cachedProfileBlobUrl);
      return;
    }
    // Fetch and create blob URL, then update state for instant rendering on future mounts
    fetchAndCacheAsBlob(profilePicUrl).then(blobUrl => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        setProfilePicUrl(blobUrl);
      }
    });
  }, [profilePicUrl]);

  useEffect(() => {
    const fetchStudentData = async () => {
      console.log('🔵 Sidebar: useEffect triggered', {
        hasStudentDataProp: !!studentData,
        hasCachedData: !!cachedStudentData,
        cacheValid: cachedStudentData && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION),
        hasFetched: hasFetchedRef.current,
        currentStateId: currentStudentData?._id,
        cachedId: cachedStudentData?._id
      });
      
      // PRIORITY 1: Check if we already have valid cached data and have fetched
      // If so, skip all processing to prevent unnecessary re-renders
      if (
        hasFetchedRef.current &&
        cachedStudentData &&
        cacheTimestamp &&
        (Date.now() - cacheTimestamp < CACHE_DURATION)
      ) {
        console.log('✅ Sidebar: Already initialized with valid cache, ignoring trigger');
        return;
      }
      
      // PRIORITY 2: If fresh studentData is passed from parent on initial mount, use it
      if (studentData && !hasFetchedRef.current) {
        setCurrentStudentData(studentData);
        setImageError(false);
        cachedStudentData = studentData;
        cacheTimestamp = Date.now();
        hasFetchedRef.current = true;
        // Update profile pic URL if available
        if (studentData.profilePicURL) {
          const resolvedUrl = resolveProfileUrl(studentData.profilePicURL);
          // Prefer blob URL if it matches this source URL (prevents blob→HTTP flicker)
          const preferred = getPreferredUrl(resolvedUrl);
          setProfilePicUrl(preferred);
          cachedProfilePicUrl = resolvedUrl;
          localStorage.setItem('cachedProfilePicUrl', resolvedUrl);
          console.log('📸 Sidebar: Profile pic URL updated from prop');
        }
        return;
      }

      // PRIORITY 3: Check if cache is valid - if so, use it without fetching
      if (
        cachedStudentData &&
        cacheTimestamp &&
        (Date.now() - cacheTimestamp < CACHE_DURATION)
      ) {
        console.log('✅ Sidebar: Using valid cache, skipping fetch');
        hasFetchedRef.current = true;
        // Only update state if it's actually different to prevent unnecessary renders
        if (currentStudentData?._id !== cachedStudentData._id) {
          setCurrentStudentData(cachedStudentData);
        }
        // Ensure profilePicUrl is in sync with cached data (prefer blob if available)
        if (cachedProfilePicUrl && profilePicUrl !== cachedProfilePicUrl && profilePicUrl !== cachedProfileBlobUrl) {
          const preferred = getPreferredUrl(cachedProfilePicUrl);
          setProfilePicUrl(preferred);
          localStorage.setItem('cachedProfilePicUrl', cachedProfilePicUrl);
        }
        return;
      }

      // Only fetch if we haven't fetched yet in this component lifecycle
      if (hasFetchedRef.current) {
        console.log('⏭️ Sidebar: Already fetched in this lifecycle, skipping');
        return;
      }

      try {
        console.log('🔄 Sidebar: Fetching from MongoDB...');
        setIsLoading(true);
        const storedData = JSON.parse(localStorage.getItem('studentData') || 'null');
        
        if (storedData?._id) {
          const { default: fastDataService } = await import('../../services/fastDataService.jsx');
          const completeData = await fastDataService.getCompleteStudentData(storedData._id);
          
          if (completeData?.student) {
            cachedStudentData = completeData.student;
            cacheTimestamp = Date.now();
            setCurrentStudentData(completeData.student);
            setImageError(false);
            hasFetchedRef.current = true;
            
            if (completeData.student.profilePicURL) {
              const resolvedUrl = resolveProfileUrl(completeData.student.profilePicURL);
              // Prefer blob URL if it matches (prevents flicker on remount)
              const preferred = getPreferredUrl(resolvedUrl);
              setProfilePicUrl(preferred);
              cachedProfilePicUrl = resolvedUrl;
              localStorage.setItem('cachedProfilePicUrl', resolvedUrl);
              console.log('📸 Sidebar: Profile pic URL updated from fetched data');
            }
          }
        }
      } catch (error) {
        console.error('❌ Sidebar: Error fetching from MongoDB:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudentData();
  }, [studentData]);

  useEffect(() => {
    const handleProfileUpdate = (event) => {
      try {
        if (event?.detail) {
          const updatedData = event.detail;
          
          // Check if profile pic URL has actually changed
          const newProfileUrl = updatedData.profilePicURL ? resolveProfileUrl(updatedData.profilePicURL) : '';
          const profileChanged = newProfileUrl && newProfileUrl !== cachedProfilePicUrl;
          const studentIdChanged = updatedData._id !== cachedStudentData?._id;
          
          // Only update if something actually changed
          if (!profileChanged && !studentIdChanged) {
            console.log('⏭️ Sidebar: Profile update ignored - no changes detected');
            return;
          }
          
          console.log('🔄 Sidebar: Profile update received', {
            hasProfilePic: !!updatedData.profilePicURL,
            url: updatedData.profilePicURL,
            changed: profileChanged
          });
          
          // INSTANT SYNC: Update profile pic URL only if it changed
          if (profileChanged) {
            // Revoke old blob since profile pic changed (prevents old→new flicker)
            if (cachedProfileBlobUrl) {
              URL.revokeObjectURL(cachedProfileBlobUrl);
              cachedProfileBlobUrl = null;
              cachedBlobSourceUrl = null;
            }
            setProfilePicUrl(newProfileUrl);
            setImageError(false);
            cachedProfilePicUrl = newProfileUrl;
            localStorage.setItem('cachedProfilePicUrl', newProfileUrl);
            console.log('📸 Sidebar: Profile pic URL updated instantly to', newProfileUrl);
          }
          
          // Update state only if student data changed
          if (studentIdChanged) {
            setCurrentStudentData(updatedData);
            setImageError(false);
            cachedStudentData = updatedData;
            cacheTimestamp = Date.now();
          }
        }
      } catch (error) {
        console.error('❌ Error in handleProfileUpdate:', error);
      }
    };

    const handleForceRefresh = (event) => {
      try {
        if (event?.detail) {
          const updatedData = event.detail;
          
          // Check if profile pic URL has actually changed
          const newProfileUrl = updatedData.profilePicURL ? resolveProfileUrl(updatedData.profilePicURL) : '';
          const profileChanged = newProfileUrl && newProfileUrl !== cachedProfilePicUrl;
          
          // Only update if something changed
          if (!profileChanged && updatedData._id === cachedStudentData?._id) {
            console.log('⏭️ Sidebar: Force refresh ignored - no changes detected');
            return;
          }
          
          // INSTANT SYNC: Update profile pic URL if present and changed
          if (profileChanged) {
            // Revoke old blob since profile pic changed
            if (cachedProfileBlobUrl) {
              URL.revokeObjectURL(cachedProfileBlobUrl);
              cachedProfileBlobUrl = null;
              cachedBlobSourceUrl = null;
            }
            setProfilePicUrl(newProfileUrl);
            cachedProfilePicUrl = newProfileUrl;
            localStorage.setItem('cachedProfilePicUrl', newProfileUrl);
          }
          
          setCurrentStudentData(updatedData);
          setImageError(false);
          cachedStudentData = updatedData;
          cacheTimestamp = Date.now();
        }
      } catch (error) {
        console.error('❌ Error in handleForceRefresh:', error);
      }
    };

    const handleStudentDataUpdate = (event) => {
      if (event?.detail?.student) {
        const updatedData = event.detail.student;
        
        // Check if profile pic URL has actually changed
        const newProfileUrl = updatedData.profilePicURL ? resolveProfileUrl(updatedData.profilePicURL) : '';
        const profileChanged = newProfileUrl && newProfileUrl !== cachedProfilePicUrl;
        
        // Only update if something changed
        if (!profileChanged && updatedData._id === cachedStudentData?._id) {
          console.log('⏭️ Sidebar: Student data update ignored - no changes detected');
          return;
        }
        
        // INSTANT SYNC: Update profile pic URL if present and changed
        if (profileChanged) {
          // Revoke old blob since profile pic changed
          if (cachedProfileBlobUrl) {
            URL.revokeObjectURL(cachedProfileBlobUrl);
            cachedProfileBlobUrl = null;
            cachedBlobSourceUrl = null;
          }
          setProfilePicUrl(newProfileUrl);
          cachedProfilePicUrl = newProfileUrl;
          localStorage.setItem('cachedProfilePicUrl', newProfileUrl);
        }
        
        setCurrentStudentData(updatedData);
        setImageError(false);
        cachedStudentData = updatedData;
        cacheTimestamp = Date.now();
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('studentDataUpdated', handleStudentDataUpdate);
    window.addEventListener('forceProfileRefresh', handleForceRefresh);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('studentDataUpdated', handleStudentDataUpdate);
      window.removeEventListener('forceProfileRefresh', handleForceRefresh);
    };
  }, []);

  return (
    // FIX: Use template literal for combined classes and styles object
    <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles['user-info']}>
        <div className={styles['user-details']}>
          {stableProfilePicUrl && !imageError ? (
            <img 
              src={stableProfilePicUrl} 
              alt="Profile" 
              onLoad={() => {
                // Image loaded successfully — cache as blob for instant rendering on next mount
                if (!cachedProfileBlobUrl && stableProfilePicUrl &&
                    !stableProfilePicUrl.startsWith('blob:') && !stableProfilePicUrl.startsWith('data:')) {
                  fetchAndCacheAsBlob(stableProfilePicUrl);
                }
              }}
              onError={() => {
                console.warn('❌ Sidebar: Image load error');
                setImageError(true);
              }}
              style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid rgb(36 36 36)',
                display: 'block'
              }} 
            />
          ) : (
            // While loading data for a logged-in student, avoid flashing the blue
            // Admin placeholder. Show a neutral circular skeleton/empty avatar
            // instead, and only use the Admin icon when there is no student.
            (isLoading || currentStudentData?._id) ? (
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  border: '1px solid rgb(200 200 200)',
                  background: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)',
                  display: 'block'
                }}
              />
            ) : (
              <img 
                src={Adminicon} 
                alt="Admin" 
                style={{ 
                  width: '60px',
                  height: '60px',
                  filter: "brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%)",
                  display: 'block'
                }} 
              />
            )
          )}
          <div className={styles['user-text']}>
            <span style={{ display: 'block' }}>
              {currentStudentData?.firstName && currentStudentData?.lastName 
                ? `${currentStudentData.firstName} ${currentStudentData.lastName}`.toUpperCase()
                : currentStudentData?.regNo 
                  ? currentStudentData.regNo
                  : isLoading ? 'Loading...' : 'Student'}
            </span>
          </div>
        </div>
      </div>
      <nav className={styles.nav}>
        <div className={styles['nav-section']}>
          {sidebarItems.map((item) => (
            <span
              key={item.text}
              // FIX: styles['nav-item'] + conditional styles.selected
              className={`${styles['nav-item']} ${item.view === currentView ? styles.selected : ''}`}
              onClick={() => onViewChange(item.view)}
            >
              <img src={item.icon} alt={item.text} /> {item.text}
            </span>
          ))}
        </div>
        <div className={styles['nav-divider']}></div>
        <span 
          className={`${styles['nav-item']} ${currentView === 'profile' ? styles.selected : ''}`}
          onClick={() => onViewChange('profile')}
        >
          <img src={require('../../assets/ProfileSideBarIcon.png')} alt="Profile" /> Profile
        </span>

        <button className={styles['logout-btn']} onClick={async () => {
          // Clear all student data
          localStorage.removeItem('authToken');
          localStorage.removeItem('authRole');
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('studentData');
          localStorage.removeItem('completeStudentData');
          localStorage.removeItem('resumeData');
          localStorage.removeItem('certificatesData');
          
          // Clear all sidebar caches (including blob URL)
          clearSidebarCache();
          
          // Call AuthContext logout
          if (authLogout) {
            await authLogout();
          }
          
          // Navigate to landing page
          navigate('/');
        }}>
          Logout
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;