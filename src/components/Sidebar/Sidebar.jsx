import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Sidebar.module.css';
import Adminicon from '../../assets/Adminicon.png';
import { getStudentData } from '../../services/fastDataService.jsx';
import { API_BASE_URL } from '../../utils/apiConfig';
import profileUtils from './profileUtils';
const { resolveProfileUrl: resolveProfileUrlShared, canonicalStorePath, fetchAndCacheBlob } = profileUtils;

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
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour - longer cache since profile updates are event-driven

export const clearSidebarCache = () => {
  cachedStudentData = null;
  cacheTimestamp = null;
  localStorage.removeItem('cachedProfilePicUrl');
  console.log('🗑️ Sidebar cache cleared');
};

export const updateCachedProfilePic = (url) => {
  if (cachedStudentData) {
    cachedStudentData.profilePicURL = url;
  }
  console.log('📸 Sidebar: Profile pic cache updated', url);
};

const Sidebar = ({ isOpen, onLogout, onViewChange, currentView, studentData }) => {
  const { logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const hasFetchedRef = useRef(false);
  const loadedImageUrlRef = useRef(null); // Track the currently loaded image URL to prevent re-fetching same image
  
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
    // Try to load from cache
    try {
      const cachedUrl = localStorage.getItem('cachedProfilePicUrl');
      if (cachedUrl) {
        const resolved = resolveProfileUrlShared(cachedUrl, API_BASE_URL);
        console.log('⚡ Sidebar: Profile pic from auth cache');
        return resolved;
      }
    } catch (e) {
      console.error('❌ Sidebar: Error loading cached profile pic', e);
    }
    return '';
  });

  // Preload and cache image - but only if URL actually changed
  const preloadAndCacheImage = async (imageUrl) => {
    if (!imageUrl) return;
    
    try {
      // First try to resolve the URL
      let resolvedUrl = resolveProfileUrlShared(imageUrl, API_BASE_URL);
      console.log('🔄 Sidebar: Resolving image URL:', imageUrl, '→', resolvedUrl);
      
      if (!resolvedUrl) return;
      
      // CRITICAL: If this exact URL is already loaded, DON'T re-fetch (prevents flickering!)
      if (loadedImageUrlRef.current === resolvedUrl) {
        console.log('⏭️ Sidebar: Image already loaded, skipping re-fetch', resolvedUrl);
        return;
      }
      
      // Try to fetch and cache as blob (with auth headers included)
      const blobUrl = await fetchAndCacheBlob(resolvedUrl);
      if (blobUrl && blobUrl !== resolvedUrl) {
        resolvedUrl = blobUrl;
        console.log('🖼️ Sidebar: Image cached as blob for faster rendering');
      }
      
      // Only update if URL actually changed
      if (loadedImageUrlRef.current !== resolvedUrl) {
        loadedImageUrlRef.current = resolvedUrl;
        setProfilePicUrl(resolvedUrl);
        setImageError(false);
        console.log('📸 Sidebar: Image URL updated and will render:', resolvedUrl);
      }
    } catch (error) {
      console.error('❌ Sidebar: Error preloading image:', error);
    }
  };

  useEffect(() => {
    const fetchStudentData = async () => {
      // Guard: Already fetched successfully with valid cache - DON'T preload again (prevents flickering)
      if (hasFetchedRef.current && cachedStudentData && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        console.log('✅ Sidebar: Already has valid cache, skipping ALL processing');
        return; // Don't call preloadAndCacheImage again!
      }

      // Use fresh studentData if available from parent (only on initial mount)
      if (studentData && !hasFetchedRef.current) {
        console.log('📥 Sidebar: Using studentData from parent');
        setCurrentStudentData(studentData);
        cachedStudentData = studentData;
        cacheTimestamp = Date.now();
        hasFetchedRef.current = true;
        setImageError(false);
        
        // Preload image only on first mount
        if (studentData.profilePicURL) {
          preloadAndCacheImage(studentData.profilePicURL);
        }
        return;
      }

      // Fetch fresh data from backend (only once per component lifecycle)
      if (!hasFetchedRef.current) {
        try {
          console.log('🔄 Sidebar: Fetching student data from MongoDB...');
          setIsLoading(true);
          const storedData = JSON.parse(localStorage.getItem('studentData') || 'null');
          
          if (storedData?._id) {
            const { default: fastDataService } = await import('../../services/fastDataService.jsx');
            const completeData = await fastDataService.getCompleteStudentData(storedData._id);
            
            if (completeData?.student) {
              console.log('✅ Sidebar: Student data fetched');
              cachedStudentData = completeData.student;
              cacheTimestamp = Date.now();
              setCurrentStudentData(completeData.student);
              setImageError(false);
              hasFetchedRef.current = true;
              
              // Preload image if available
              if (completeData.student.profilePicURL) {
                preloadAndCacheImage(completeData.student.profilePicURL);
              }
            }
          }
        } catch (error) {
          console.error('❌ Sidebar: Error fetching from MongoDB:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchStudentData();
  }, [studentData]); // Only trigger on parent studentData change

  useEffect(() => {
    const handleProfileUpdate = (event) => {
      try {
        if (event?.detail?.profilePicURL) {
          console.log('🔄 Sidebar: Profile update received');
          // Update cache
          cachedStudentData = event.detail;
          cacheTimestamp = Date.now();
          setCurrentStudentData(event.detail);
          
          // Only preload if image URL is different
          if (loadedImageUrlRef.current !== event.detail.profilePicURL) {
            preloadAndCacheImage(event.detail.profilePicURL);
          }
        }
      } catch (error) {
        console.error('❌ Error in handleProfileUpdate:', error);
      }
    };

    const handleForceRefresh = (event) => {
      try {
        if (event?.detail) {
          console.log('🔄 Sidebar: Force refresh received');
          cachedStudentData = event.detail;
          cacheTimestamp = Date.now();
          setCurrentStudentData(event.detail);
          setImageError(false);
          
          // Only preload if image URL is different
          if (event.detail.profilePicURL && loadedImageUrlRef.current !== event.detail.profilePicURL) {
            preloadAndCacheImage(event.detail.profilePicURL);
          }
        }
      } catch (error) {
        console.error('❌ Error in handleForceRefresh:', error);
      }
    };

    const handleStudentDataUpdate = (event) => {
      try {
        if (event?.detail?.student) {
          console.log('🔄 Sidebar: Student data update received');
          cachedStudentData = event.detail.student;
          cacheTimestamp = Date.now();
          setCurrentStudentData(event.detail.student);
          setImageError(false);
          
          // Only preload if image URL is different
          if (event.detail.student.profilePicURL && loadedImageUrlRef.current !== event.detail.student.profilePicURL) {
            preloadAndCacheImage(event.detail.student.profilePicURL);
          }
        }
      } catch (error) {
        console.error('❌ Error in handleStudentDataUpdate:', error);
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
          {profilePicUrl && !imageError ? (
            <img 
              src={profilePicUrl} 
              alt="Profile" 
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