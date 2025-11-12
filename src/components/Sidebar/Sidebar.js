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

const Sidebar = ({ isOpen, onLogout, onViewChange, currentView, studentData }) => {
  const [currentStudentData, setCurrentStudentData] = useState(() => {
    // Initialize immediately with localStorage data if no prop provided
    if (studentData) return studentData;
    try {
      return JSON.parse(localStorage.getItem('studentData') || 'null');
    } catch (error) {
      return null;
    }
  });
  const [imageError, setImageError] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now()); // Force image re-render

  // ⚡ INSTANT: Aggressively load student data on mount
  useEffect(() => {
    const loadStudentDataImmediately = () => {
      try {
        // Priority 1: Use prop if available
        if (studentData?.profilePicURL) {
          console.log('⚡ Sidebar: Using prop data with profile pic');
          setCurrentStudentData(studentData);
          setImageError(false);
          setImageKey(Date.now());
          return;
        }

        // Priority 2: Load from localStorage
        const storedData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (storedData?.profilePicURL) {
          console.log('⚡ Sidebar: Loaded profile pic from localStorage immediately');
          setCurrentStudentData(storedData);
          setImageError(false);
          setImageKey(Date.now());
          
          // Preload the image
          const img = new Image();
          img.onload = () => {
            console.log('✅ Sidebar: Profile image preloaded successfully');
            // Force another render to ensure display
            setImageKey(Date.now());
          };
          img.onerror = () => {
            console.log('❌ Sidebar: Profile image preload failed');
            setImageError(true);
          };
          img.src = storedData.profilePicURL;
        } else if (storedData) {
          console.log('⚠️ Sidebar: Student data found but no profile pic URL');
          setCurrentStudentData(storedData);
        }
      } catch (error) {
        console.error('❌ Sidebar: Error loading student data:', error);
      }
    };

    // Load immediately on mount
    loadStudentDataImmediately();
  }, [studentData]); // Added studentData dependency

  // ⚡ Update when studentData prop changes
  useEffect(() => {
    if (studentData) {
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
          {currentStudentData?.profilePicURL && !imageError ? (
            <img 
              key={`${currentStudentData.profilePicURL}_${currentStudentData._id}_${imageKey}`} // Force re-render with key
              src={currentStudentData.profilePicURL} 
              alt="Profile" 
              onError={() => {
                console.log('❌ Sidebar: Profile image failed to load:', currentStudentData.profilePicURL);
                setImageError(true);
              }}
              onLoad={() => {
                console.log('✅ Sidebar: Profile image loaded successfully:', currentStudentData.profilePicURL);
                setImageError(false);
              }}
              style={{ 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid rgb(36 36 36)'
              }} 
            />
          ) : (
            <img src={Adminicon} alt="Admin" style={{ 
              width: '60px',
              height: '60px',
              filter: "brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%)"
            }} />
          )}
          <div className="user-text">
            <span>
              {currentStudentData && currentStudentData.firstName && currentStudentData.lastName 
                ? `${currentStudentData.firstName} ${currentStudentData.lastName}` 
                : currentStudentData?.regNo 
                  ? `Student ${currentStudentData.regNo}` 
                  : 'Loading...'}
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