import React from 'react';
import './AlertStyles.css';

const SuccessAlert = ({ 
  isOpen, 
  onClose, 
  title = "Success!", 
  message = "Operation completed successfully",
  buttonText = "Close"
}) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="alert-container success">
        <div className="alert-header success-header">
          {title}
        </div>
        <div className="alert-body">
          <svg className="alert-icon success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="success-icon-circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="success-icon-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
          <h2 className="alert-title">{title} ✓</h2>
          <p className="alert-message">{message}</p>
        </div>
        <div className="alert-footer">
          <button onClick={onClose} className="alert-button success-button">
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessAlert;
