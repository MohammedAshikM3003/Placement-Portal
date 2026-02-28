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
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour - longer cache since profile updates are event-driven

export const clearSidebarCache = () => {
  cachedStudentData = null;
  cacheTimestamp = null;
  cachedProfilePicUrl = null;
  localStorage.removeItem('cachedProfilePicUrl');
  console.log('🗑️ Sidebar cache cleared');
};

export const updateCachedProfilePic = (url) => {
  cachedProfilePicUrl = url;
  localStorage.setItem('cachedProfilePicUrl', url);
  if (cachedStudentData) {
    cachedStudentData.profilePicURL = url;
  }
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
  const [imageKey, setImageKey] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(() => {
    // PRIORITY 1: Check module-level cache (fastest)
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
          setProfilePicUrl(resolvedUrl);
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
        // Ensure profilePicUrl is in sync with cached data
        if (cachedProfilePicUrl && profilePicUrl !== cachedProfilePicUrl) {
          setProfilePicUrl(cachedProfilePicUrl);
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
              setProfilePicUrl(resolvedUrl);
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
            setProfilePicUrl(newProfileUrl);
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
          
          // Clear cache
          cachedStudentData = null;
          cacheTimestamp = null;
          
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