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

  // Update local state when studentData prop changes
  useEffect(() => {
    if (studentData) {
      setCurrentStudentData(studentData);
    } else {
      // If no studentData prop, try to load from localStorage
      try {
        const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (storedStudentData) {
          setCurrentStudentData(storedStudentData);
        }
      } catch (error) {
        console.error('Error loading student data for sidebar:', error);
      }
    }
  }, [studentData]);

  // Listen for profile updates
  useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const updatedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (updatedStudentData) {
          setCurrentStudentData(updatedStudentData);
        }
      } catch (error) {
        console.error('Error updating sidebar student data:', error);
      }
    };

    // Listen for custom events and storage changes
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, []);

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="user-info">
        <div className="user-details">
          {currentStudentData?.profilePicURL ? (
            <img 
              src={currentStudentData.profilePicURL} 
              alt="Profile" 
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
            <span>{currentStudentData ? `${currentStudentData.firstName} ${currentStudentData.lastName}` : 'Student'}</span>
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