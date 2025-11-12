import React, { useState, useEffect } from 'react';
import './Sidebar.css';
import Adminicon from '../../assets/Adminicon.png';

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

// Function to clear the cache - to be called on logout
export const clearSidebarCache = () => {
  cachedStudentData = null;
  cacheTimestamp = null;
  console.log('🗑️ Sidebar cache cleared');
};

const Sidebar = ({ isOpen, onLogout, onViewChange, currentView, studentData }) => {
  // ⚡ Initialize with cached data if available, otherwise null
  const [currentStudentData, setCurrentStudentData] = useState(() => {
    // Check if cache is still valid
    if (cachedStudentData && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
      console.log('⚡ Sidebar INIT: Using cached data (no flickering!)');
      return cachedStudentData;
    }
    return null;
  });
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now()); // Force image re-render
  const [isLoading, setIsLoading] = useState(false);

  // ⚡ Fetch student data from MongoDB ONLY if not cached
  useEffect(() => {
    const fetchStudentData = async () => {
      // If we already have valid cached data, don't fetch again
      if (cachedStudentData && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
        console.log('✅ Sidebar: Using cached data, no fetch needed');
        return;
      }

      try {
        setIsLoading(true);
        // Get student ID from localStorage (minimal data)
        const storedData = JSON.parse(localStorage.getItem('studentData') || 'null');
        
        if (storedData?._id) {
          console.log('📥 Sidebar: Fetching fresh data from MongoDB for:', storedData._id);
          
          // Import fastDataService dynamically
          const { default: fastDataService } = await import('../../services/fastDataService.js');
          
          // Fetch complete data from MongoDB
          const completeData = await fastDataService.getCompleteStudentData(storedData._id);
          
          if (completeData?.student) {
            console.log('✅ Sidebar: Got fresh data from MongoDB:', {
              hasProfilePic: !!completeData.student.profilePicURL,
              profileURL: completeData.student.profilePicURL
            });
            
            // Update cache
            cachedStudentData = completeData.student;
            cacheTimestamp = Date.now();
            
            setCurrentStudentData(completeData.student);
            setImageError(false);
            setImageKey(Date.now());
            
            // Preload the image if URL exists
            if (completeData.student.profilePicURL) {
              const img = new Image();
              img.onload = () => {
                console.log('✅ Sidebar: Profile image loaded from MongoDB');
                setImageKey(Date.now());
              };
              img.onerror = () => {
                console.log('❌ Sidebar: Profile image failed to load');
                setImageError(true);
              };
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

    // Execute immediately
    fetchStudentData();
  }, []); // Run only once on mount

  // ⚡ Update when studentData prop changes
  useEffect(() => {
    if (studentData && studentData.profilePicURL) {
      console.log('🔄 Sidebar: Prop data updated', {
        hasProfilePic: !!studentData.profilePicURL,
        profileURL: studentData.profilePicURL
      });
      setCurrentStudentData(studentData);
      setImageError(false);
      setImageKey(Date.now());
    }
  }, [studentData]);

  // ⚡ INSTANT: Listen for profile updates and fetch fresh data
  useEffect(() => {
    const handleProfileUpdate = async (event) => {
      try {
        console.log('🔄 Sidebar: Profile update detected', event?.type);
        
        // First, update from localStorage immediately
        const updatedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (updatedStudentData) {
          console.log('⚡ Sidebar: Updated from localStorage', {
            hasProfilePic: !!updatedStudentData.profilePicURL,
            profileURL: updatedStudentData.profilePicURL
          });
          setCurrentStudentData(updatedStudentData);
          setImageError(false); // Reset image error when data updates
          setImageKey(Date.now()); // Force image re-render
          
          // Update cache with new data
          cachedStudentData = updatedStudentData;
          cacheTimestamp = Date.now();
        }
        
        // If we have event detail with fresh data, use that
        if (event?.detail) {
          console.log('⚡ Sidebar: Using fresh event data', {
            hasProfilePic: !!event.detail.profilePicURL,
            profileURL: event.detail.profilePicURL,
            forceUpdate: event.detail._forceUpdate
          });
          setCurrentStudentData(event.detail);
          setImageError(false); // Reset image error when new data comes in
          setImageKey(Date.now()); // Force image re-render
          
          // Update cache with new data
          cachedStudentData = event.detail;
          cacheTimestamp = Date.now();
          
          // Force image refresh if profile picture URL is present
          if (event.detail.profilePicURL) {
            console.log('🖼️ Sidebar: Forcing profile picture refresh');
            // Reset image error and force re-render
            setTimeout(() => {
              setImageError(false);
              setImageKey(Date.now()); // Additional force re-render
            }, 50);
          }
        }
      } catch (error) {
        console.error('❌ Error in handleProfileUpdate:', error);
      }
    };

    const handleForceRefresh = (event) => {
      try {
        console.log('🔄 Sidebar: Force refresh triggered');
        if (event?.detail) {
          console.log('⚡ Sidebar: Force refresh with data', {
            hasProfilePic: !!event.detail.profilePicURL,
            profileURL: event.detail.profilePicURL
          });
          setCurrentStudentData(event.detail);
          setImageError(false);
          
          // Update cache with new data
          cachedStudentData = event.detail;
          cacheTimestamp = Date.now();
          
          // Force complete re-render by updating a key or state
          setTimeout(() => {
            setImageError(false);
          }, 10);
        }
      } catch (error) {
        console.error('❌ Error in handleForceRefresh:', error);
      }
    };

    const handleStudentDataUpdate = (event) => {
      if (event?.detail?.student) {
        console.log('⚡ Sidebar: Student data update from fast service');
        setCurrentStudentData(event.detail.student);
        setImageError(false);
        
        // Update cache with new data
        cachedStudentData = event.detail.student;
        cacheTimestamp = Date.now();
      }
    };

    // Listen for multiple types of updates
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('studentDataUpdated', handleStudentDataUpdate);
    window.addEventListener('forceProfileRefresh', handleForceRefresh);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('studentDataUpdated', handleStudentDataUpdate);
      window.removeEventListener('forceProfileRefresh', handleForceRefresh);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, []);

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="user-info">
        <div className="user-details">
          {/* Always show image - either profile pic or placeholder */}
          {currentStudentData?.profilePicURL && !imageError ? (
            <img 
              key={`${currentStudentData.profilePicURL}_${currentStudentData._id}_${imageKey}`}
              src={currentStudentData.profilePicURL} 
              alt="Profile" 
              onError={() => {
                console.log('❌ Sidebar: Profile image failed to load:', currentStudentData.profilePicURL);
                setImageError(true);
              }}
              onLoad={() => {
                console.log('✅ Sidebar: Profile image loaded successfully:', currentStudentData.profilePicURL);
              }}
              style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid rgb(36 36 36)',
                display: 'block' // Prevent flickering
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
                display: 'block' // Prevent flickering
              }} 
            />
          )}
          <div className="user-text">
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
      <nav className="nav">
        <div className="nav-section">
          {sidebarItems.map((item) => (
            <span
              key={item.text}
              className={`nav-item${item.view === currentView ? ' selected' : ''}`}
              onClick={() => onViewChange(item.view)}
            >
              <img src={item.icon} alt={item.text} /> {item.text}
            </span>
          ))}
        </div>
        <div className="nav-divider"></div>
        <span 
          className={`nav-item${currentView === 'profile' ? ' selected' : ''}`}
          onClick={() => onViewChange('profile')}
        >
          <img src={require('../../assets/ProfileSideBarIcon.png')} alt="Profile" /> Profile
        </span>

        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;