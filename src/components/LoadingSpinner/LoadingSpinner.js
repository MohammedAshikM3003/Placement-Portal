import React, { useState, useEffect } from 'react';
import './LoadingSpinner.css';

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

  const containerClass = mode === "table" ? "table-loading-spinner" : "loading-spinner-container";
  
  return (
    <div className={containerClass}>
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p className="loading-message">{message}</p>
        
        {showProgress && (
          <div className="loading-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${currentProgress}%` }}
              ></div>
            </div>
            <div className="progress-messages">
              {progressMessages.map((msg, idx) => (
                <div key={idx} className="progress-msg fade-in">
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
