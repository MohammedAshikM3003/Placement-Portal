import React from 'react';
import './AlertStyles.css';

const InfoAlert = ({ 
  isOpen, 
  onClose, 
  title = "Information", 
  message = "Here's some important information",
  buttonText = "Got it"
}) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="alert-container info">
        <div className="alert-header info-header">
          {title}
        </div>
        <div className="alert-body">
          <svg className="alert-icon info-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="info-icon-circle" cx="26" cy="26" r="25" fill="none"/>
            <line className="info-icon-line" x1="26" y1="20" x2="26" y2="32"/>
            <circle className="info-icon-dot" cx="26" cy="16" r="2"/>
          </svg>
          <h2 className="alert-title">{title}</h2>
          <p className="alert-message">{message}</p>
        </div>
        <div className="alert-footer">
          <button onClick={onClose} className="alert-button info-button">
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoAlert;
