import React, { useState, useEffect } from 'react';
import './Sidebar.css';
import Adminicon from '../../assets/Adminicon.png';
import fastDataService from '../../services/fastDataService.js';

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

  // ⚡ INSTANT: Update local state when studentData prop changes
  useEffect(() => {
    if (studentData) {
      setCurrentStudentData(studentData);
      // Preload profile photo immediately
      if (studentData.profilePicURL) {
        const img = new Image();
        img.onload = () => console.log('⚡ Sidebar: Profile photo preloaded');
        img.src = studentData.profilePicURL;
      }
    } else {
      // If no studentData prop, try to load from localStorage
      try {
        const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (storedStudentData) {
          setCurrentStudentData(storedStudentData);
          // Preload profile photo immediately
          if (storedStudentData.profilePicURL) {
            const img = new Image();
            img.onload = () => console.log('⚡ Sidebar: Profile photo preloaded from localStorage');
            img.src = storedStudentData.profilePicURL;
          }
        }
      } catch (error) {
        console.error('Error loading student data for sidebar:', error);
      }
    }
  }, [studentData]);

  // ⚡ INSTANT: Listen for profile updates and fetch fresh data
  useEffect(() => {
    const handleProfileUpdate = async (event) => {
      try {
        console.log('🔄 Sidebar: Profile update detected');
        
        // First, update from localStorage immediately
        const updatedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (updatedStudentData) {
          console.log('⚡ Sidebar: Updated from localStorage');
          setCurrentStudentData(updatedStudentData);
          setImageError(false); // Reset image error when data updates
        }
        
        // If we have event detail with fresh data, use that
        if (event?.detail) {
          console.log('⚡ Sidebar: Using fresh event data');
          setCurrentStudentData(event.detail);
          setImageError(false); // Reset image error when new data comes in
          
          // Force image refresh if profile picture URL is present
          if (event.detail.profilePicURL) {
            console.log('🖼️ Sidebar: Forcing profile picture refresh');
            // Reset image error and force re-render
            setTimeout(() => {
              setImageError(false);
            }, 100);
          }
        }
        
        // Also try to get instant cached data for profile photo
        if (updatedStudentData?._id) {
          const instantData = fastDataService.getInstantData(updatedStudentData._id);
          if (instantData?.student?.profilePicURL) {
            console.log('⚡ Sidebar: Updated profile photo from cache');
            setCurrentStudentData(prev => ({
              ...prev,
              profilePicURL: instantData.student.profilePicURL
            }));
          }
        }
      } catch (error) {
        console.error('❌ Error updating sidebar student data:', error);
      }
    };

    const handleStudentDataUpdate = (event) => {
      if (event?.detail?.student) {
        console.log('⚡ Sidebar: Student data update from fast service');
        setCurrentStudentData(event.detail.student);
      }
    };

    // Listen for multiple types of updates
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('studentDataUpdated', handleStudentDataUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('studentDataUpdated', handleStudentDataUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, []);

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="user-info">
        <div className="user-details">
          {currentStudentData?.profilePicURL && !imageError ? (
            <img 
              key={currentStudentData.profilePicURL + '_' + currentStudentData._id} // Force re-render with key
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