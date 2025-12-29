import React, { useState, useEffect } from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ message = "Loading...", showProgress = false, mode = "full" }) => {
  const [progressMessages, setProgressMessages] = useState([]);
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    if (!showProgress) return;

    // Listen for background data loading events
    const handleDataProgress = (event) => {
      const { type, message: progressMsg } = event.detail || {};
      
      setProgressMessages(prev => {
        const newMessages = [...prev, progressMsg || type];
        // Keep only last 3 messages
        return newMessages.slice(-3);
      });

      // Update progress bar
      setCurrentProgress(prev => Math.min(prev + 20, 90));
    };

    const handleDataComplete = () => {
      setCurrentProgress(100);
      setProgressMessages(prev => [...prev, 'All data loaded!']);
    };

    window.addEventListener('dataLoadProgress', handleDataProgress);
    window.addEventListener('allDataPreloaded', handleDataComplete);

    return () => {
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
        <div className={styles['spinner']}></div>
        <p className={styles['loading-message']}>{message}</p>
        
        {showProgress && (
          <div className={styles['loading-progress']}>
            <div className={styles['progress-bar']}>
              <div 
                className={styles['progress-fill']}
                style={{ width: `${currentProgress}%` }}
              ></div>
            </div>
            <div className={styles['progress-messages']}>
              {progressMessages.map((msg, idx) => (
                <div key={idx} className={styles['progress-msg']}>
                  {msg}
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