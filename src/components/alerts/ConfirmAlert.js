import React from 'react';
import './AlertStyles.css';

const ConfirmAlert = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel"
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="alert-overlay">
      <div className="alert-container confirm">
        <div className="alert-header confirm-header">
          {title}
        </div>
        <div className="alert-body">
          <svg className="alert-icon confirm-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="confirm-icon-circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="confirm-icon-question" fill="none" d="M20 20c0-3.3 2.7-6 6-6s6 2.7 6 6c0 2-1 3.8-2.5 4.8L26 30"/>
            <circle className="confirm-icon-dot" cx="26" cy="36" r="2"/>
          </svg>
          <h2 className="alert-title">{title}</h2>
          <p className="alert-message">{message}</p>
        </div>
        <div className="alert-footer confirm-footer">
          <button onClick={onClose} className="alert-button cancel-button">
            {cancelText}
          </button>
          <button onClick={handleConfirm} className="alert-button confirm-button">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAlert;
