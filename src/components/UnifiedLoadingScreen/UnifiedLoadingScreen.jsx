import React from 'react';
import styles from './UnifiedLoadingScreen.module.css';

/**
 * Unified Loading Screen Component
 * Shows after successful authentication while preloading profile data, 
 * sidebar info, and essential dashboard data for admin, coordinator, and student.
 */
const UnifiedLoadingScreen = ({ role = 'user', message, subMessage }) => {
  const getRoleBasedMessage = () => {
    if (message) return message;
    
    switch (role) {
      case 'admin':
        return 'Loading Admin Dashboard...';
      case 'coordinator':
        return 'Loading Coordinator Dashboard...';
      case 'student':
        return 'Loading Student Dashboard...';
      default:
        return 'Loading Dashboard...';
    }
  };

  const getRoleBasedSubMessage = () => {
    if (subMessage) return subMessage;
    
    return 'Preparing your profile, sidebar, and dashboard data...';
  };

  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingCard}>
        {/* Graduation Cap Icon */}
        <div className={styles.iconWrapper}>
          <svg 
            className={styles.icon} 
            viewBox="0 0 64 64" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M32 10L6 22L32 34L58 22L32 10Z"
              fill="currentColor"
              className={styles.capTop}
            />
            <path
              d="M16 26V38L32 46L48 38V26"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.capBase}
            />
            <circle
              cx="32"
              cy="22"
              r="2"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Loading Content */}
        <div className={styles.content}>
          <h2 className={styles.title}>{getRoleBasedMessage()}</h2>
          <p className={styles.subtitle}>{getRoleBasedSubMessage()}</p>
          
          {/* Progress Bar */}
          <div className={styles.progressBar}>
            <div className={styles.progressFill}></div>
          </div>
          
          {/* Loading Dots */}
          <div className={styles.loadingDots}>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
            <span className={styles.dot}></span>
          </div>
        </div>

        {/* Role Badge */}
        <div className={styles.roleBadge}>
          {role === 'admin' && '👨‍💼 Admin'}
          {role === 'coordinator' && '👨‍🏫 Coordinator'}
          {role === 'student' && '👨‍🎓 Student'}
        </div>
      </div>
    </div>
  );
};

export default UnifiedLoadingScreen;
