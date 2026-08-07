import React from 'react';
import './AlertStyles.css';

const ErrorAlert = ({ 
  isOpen, 
  onClose, 
  title = "Error!", 
  message = "Something went wrong",
  buttonText = "OK"
}) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="alert-container error">
        <div className="alert-header error-header">
          {title}
        </div>
        <div className="alert-body">
          <svg className="alert-icon error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="error-icon-circle" cx="26" cy="26" r="25" fill="none"/>
            <line className="error-icon-line" x1="18" y1="18" x2="34" y2="34"/>
            <line className="error-icon-line" x1="34" y1="18" x2="18" y2="34"/>
          </svg>
          <h2 className="alert-title error-title">{title} ✗</h2>
          <p className="alert-message">{message}</p>
        </div>
        <div className="alert-footer">
          <button onClick={onClose} className="alert-button error-button">
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;
