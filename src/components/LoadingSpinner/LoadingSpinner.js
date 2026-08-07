import React, { useState, useEffect } from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ 
  message = "Loading...", 
  subMessage = "Please wait while we fetch your data...",
  showProgress = false, 
  mode = "full",
  showAnimatedDots = true 
}) => {
  const [progressMessages, setProgressMessages] = useState([]);
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    if (!showProgress) return;

    // Listen for login data preloading events
    const handleLoginPreloadProgress = (event) => {
      const { message: progressMsg, progress, completed } = event.detail || {};
      
      setProgressMessages(prev => {
        // Check if this message already exists
        const existingIndex = prev.findIndex(item => item.message === progressMsg);
        
        if (existingIndex !== -1) {
          // Update existing message
          const updated = [...prev];
          updated[existingIndex] = { message: progressMsg, completed: completed !== false };
          return updated;
        } else {
          // Add new message
          const newMessages = [...prev, { message: progressMsg, completed: completed !== false }];
          // Keep only last 3 messages
          return newMessages.slice(-3);
        }
      });

      // Update progress bar with actual progress
      if (progress !== undefined) {
        setCurrentProgress(progress);
      }
    };

    // Listen for background data loading events
    const handleDataProgress = (event) => {
      const { type, message: progressMsg } = event.detail || {};
      
      setProgressMessages(prev => {
        const newMessages = [...prev, { message: progressMsg || type, completed: false }];
        // Keep only last 3 messages
        return newMessages.slice(-3);
      });

      // Update progress bar
      setCurrentProgress(prev => Math.min(prev + 20, 90));
    };

    const handleDataComplete = () => {
      setCurrentProgress(100);
      setProgressMessages(prev => [...prev, { message: 'All data loaded!', completed: true }]);
    };

    window.addEventListener('loginPreloadProgress', handleLoginPreloadProgress);
    window.addEventListener('dataLoadProgress', handleDataProgress);
    window.addEventListener('allDataPreloaded', handleDataComplete);

    return () => {
      window.removeEventListener('loginPreloadProgress', handleLoginPreloadProgress);
      window.removeEventListener('dataLoadProgress', handleDataProgress);
      window.removeEventListener('allDataPreloaded', handleDataComplete);
    };
  }, [showProgress]);

  // 1. Logic to choose the correct class from module
  const containerClass = mode === "table" 
    ? styles['table-loading-spinner'] 
    : styles['loading-spinner-container'];
  
  return (
    // 2. Use the scoped classes
    <div className={containerClass}>
      <div className={styles['loading-spinner']}>
        {/* Animated Dots (like AnimatedLoader) */}
        {showAnimatedDots && (
          <div className={styles['dots-container']}>
            <div className={`${styles['loading-dot']} ${styles['dot-green']}`} />
            <div className={`${styles['loading-dot']} ${styles['dot-red']}`} />
            <div className={`${styles['loading-dot']} ${styles['dot-blue']}`} />
          </div>
        )}
        
        {/* Traditional Spinner (if animated dots are not used) */}
        {!showAnimatedDots && <div className={styles['spinner']}></div>}
        
        <p className={styles['loading-message']}>{message}</p>
        {subMessage && <p className={styles['loading-sub-message']}>{subMessage}</p>}
        
        {showProgress && (
          <div className={styles['loading-progress']}>
            <div className={styles['progress-bar']}>
              <div 
                className={styles['progress-fill']}
                style={{ width: `${currentProgress}%` }}
              ></div>
            </div>
            <div className={styles['progress-messages']}>
              {progressMessages.map((item, idx) => (
                <div key={idx} className={styles['progress-msg']}>
                  {item.completed && <span className={styles['checkmark']}>✅</span>}
                  <span>{item.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;