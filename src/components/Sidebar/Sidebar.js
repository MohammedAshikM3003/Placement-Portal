import React from 'react';
import './Sidebar.css';
import Adminicon from '../../assets/Adminicon.png';

const sidebarItems = [
  { icon: require('../../assets/DashboardSideBarIcon.png'), text: 'Dashboard', view: 'dashboard' },
  { icon: require('../../assets/ResumeSideBarIcon.png'), text: 'Resume', view: 'resume' },
  { icon: require('../../assets/AttendanceSideBarIcon.png'), text: 'Attendance', view: 'attendance' },
  { icon: require('../../assets/AchievementsSideBarIcon.png'), text: 'Achievements', view: 'achievements' },
  { icon: require('../../assets/CompanySideBarIcon.svg').default, text: 'Company', view: 'company' },
];

const Sidebar = ({ isOpen, onLogout, onViewChange, currentView }) => {
  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="user-info">
        <div className="user-details">
          <img src={Adminicon} alt="Admin" style={{ 
            filter: "brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%)"
          }} />
          <div className="user-text">
            <span>Student</span>
            <span className="user-year">Final Year</span>
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