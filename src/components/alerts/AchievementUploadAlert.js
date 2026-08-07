import React from 'react';
import './AlertStyles.css';

// Achievement Upload Success Alert
export const AchievementSuccessAlert = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header">Uploaded!</div>
        <div className="achievement-popup-body">
          <svg className="achievement-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="achievement-success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="achievement-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#333", fontWeight: "600" }}>
            Submitted ✓
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            Certificate is submitted
          </p>
        </div>
        <div className="achievement-popup-footer">
          <button onClick={onClose} className="achievement-popup-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Achievement Upload Error Alert
export const AchievementErrorAlert = ({ isOpen, onClose, errorMessage }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header">Upload Failed!</div>
        <div className="achievement-popup-body">
          <svg className="achievement-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="achievement-error-icon--circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="achievement-error-icon--cross" fill="none" d="M16 16l20 20M36 16L16 36"/>
          </svg>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", fontWeight: "600" }}>
            Upload Failed ✗
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            {errorMessage || "Certificate upload failed"}
          </p>
        </div>
        <div className="achievement-popup-footer">
          <button onClick={onClose} className="achievement-popup-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
