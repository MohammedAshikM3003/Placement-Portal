import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Sidebar.module.css';
import Adminicon from '../../assets/Adminicon.png';
import { getStudentData } from '../../services/fastDataService.jsx';

const sidebarItems = [
  { icon: require('../../assets/DashboardSideBarIcon.png'), text: 'Dashboard', view: 'dashboard' },
  { icon: require('../../assets/ResumeSideBarIcon.png'), text: 'Resume', view: 'resume' },
  { icon: require('../../assets/AttendanceSideBarIcon.png'), text: 'Attendance', view: 'attendance' },
  { icon: require('../../assets/AchievementsSideBarIcon.png'), text: 'Achievements', view: 'achievements' },
  { icon: require('../../assets/CompanySideBarIcon.svg').default, text: 'Company', view: 'company' },
];

// Cache for student data to prevent refetching
let cachedStudentData = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const clearSidebarCache = () => {
  cachedStudentData = null;
  cacheTimestamp = null;
  console.log('🗑️ Sidebar cache cleared');
};

const Sidebar = ({ isOpen, onLogout, onViewChange, currentView, studentData }) => {
  const { logout: authLogout } = useAuth();
  const navigate = useNavigate();
  
  const [currentStudentData, setCurrentStudentData] = useState(() => {
    if (cachedStudentData && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      return cachedStudentData;
    }
    return null;
  });
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchStudentData = async () => {
      // If fresh studentData is passed from parent (Auth/Pages), use it immediately
      if (studentData) {
        setCurrentStudentData(studentData);
        setImageError(false);
        setImageKey(Date.now());
        cachedStudentData = studentData;
        cacheTimestamp = Date.now();
        // If this studentData already has a profile picture, we don't need a DB fetch
        if (studentData.profilePicURL) {
          return;
        }
        // Otherwise, fall through and try to hydrate from MongoDB so dashboard can
        // load the latest profilePicURL just like other pages.
      }

      // Otherwise, fall back to cached/local data and a single fast fetch.
      // IMPORTANT: Only short-circuit if the cache already has a profilePicURL.
      // If the cache is missing the picture, allow the MongoDB fetch to run so
      // pages like the dashboard can hydrate the sidebar image from DB.
      if (
        cachedStudentData &&
        cacheTimestamp &&
        (Date.now() - cacheTimestamp < CACHE_DURATION) &&
        cachedStudentData.profilePicURL
      ) {
        setCurrentStudentData(cachedStudentData);
        return;
      }

      try {
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
            setImageKey(Date.now());
            
            if (completeData.student.profilePicURL) {
              const img = new Image();
              img.onload = () => setImageKey(Date.now());
              img.onerror = () => setImageError(true);
              img.src = completeData.student.profilePicURL;
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
    if (studentData) {
      setCurrentStudentData(studentData);
      setImageError(false);
      setImageKey(Date.now());
      cachedStudentData = studentData;
      cacheTimestamp = Date.now();
    }
  }, [studentData]);

  useEffect(() => {
    const handleProfileUpdate = (event) => {
      try {
        if (event?.detail) {
          setCurrentStudentData(event.detail);
          setImageError(false);
          setImageKey(Date.now());
          cachedStudentData = event.detail;
          cacheTimestamp = Date.now();
        }
      } catch (error) {
        console.error('❌ Error in handleProfileUpdate:', error);
      }
    };

    const handleForceRefresh = (event) => {
      try {
        if (event?.detail) {
          setCurrentStudentData(event.detail);
          setImageError(false);
          cachedStudentData = event.detail;
          cacheTimestamp = Date.now();
          setTimeout(() => setImageError(false), 10);
        }
      } catch (error) {
        console.error('❌ Error in handleForceRefresh:', error);
      }
    };

    const handleStudentDataUpdate = (event) => {
      if (event?.detail?.student) {
        setCurrentStudentData(event.detail.student);
        setImageError(false);
        cachedStudentData = event.detail.student;
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
          {currentStudentData?.profilePicURL && !imageError ? (
            <img 
              key={`${currentStudentData.profilePicURL}_${currentStudentData._id}_${imageKey}`}
              src={currentStudentData.profilePicURL} 
              alt="Profile" 
              onError={() => setImageError(true)}
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