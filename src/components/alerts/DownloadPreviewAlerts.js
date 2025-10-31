import React from 'react';
import './AlertStyles.css';

// Download Failed Popup
export const DownloadFailedAlert = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: '#D23B42' }}>
          Download Failed !
        </div>
        <div className="achievement-popup-body">
          <div className="download-error-icon-container">
            <svg className="download-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="download-error-icon--circle" cx="26" cy="26" r="25" fill="#B84349"/>
              <path className="download-error-icon--cross" fill="white" d="M16 16l20 20M36 16L16 36" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
            Download Failed !
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            Unable to download the certificate.<br />
            Please try again or contact support.
          </p>
        </div>
        <div className="achievement-popup-footer">
          <button onClick={onClose} className="download-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Download Success Popup
export const DownloadSuccessAlert = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: '#197AFF' }}>
          Downloaded !
        </div>
        <div className="achievement-popup-body">
          <svg className="download-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="download-success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="download-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
            PDF Downloaded ✓
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            The certificate has been successfully<br />
            downloaded as PDF to your device.
          </p>
        </div>
        <div className="achievement-popup-footer">
          <button onClick={onClose} className="download-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Download Progress Popup
export const DownloadProgressAlert = ({ isOpen, progress = 25 }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: '#197AFF' }}>
          Downloading...
        </div>
        <div className="achievement-popup-body">
          <div className="download-progress-icon-container">
            <svg className="download-progress-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="download-progress-icon--bg" cx="26" cy="26" r="20" fill="none" stroke="#BEBFC6" strokeWidth="4"/>
              <circle 
                className="download-progress-icon--progress" 
                cx="26" 
                cy="26" 
                r="20" 
                fill="none" 
                stroke="#197AFF" 
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${progress * 1.256} 125.6`}
                transform="rotate(-90 26 26)"
              />
            </svg>
          </div>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
            Downloading {Math.round(progress)}%
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            {progress < 85 ? 'Preparing certificate for download...' : 
             progress < 100 ? 'Finalizing download...' : 
             'Starting download...'}
          </p>
          <p style={{ margin: "10px 0 0 0", color: "#888", fontSize: "14px" }}>
            {progress >= 100 ? 'Almost ready!' : 'Please wait...'}
          </p>
        </div>
      </div>
    </div>
  );
};

// Preview Failed Popup
export const PreviewFailedAlert = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: '#197AFF' }}>
          Preview Failed !
        </div>
        <div className="achievement-popup-body">
          <div className="preview-error-icon-container">
            <svg className="preview-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="preview-error-icon--circle" cx="26" cy="26" r="25" fill="#B84349"/>
              <path className="preview-error-icon--cross" fill="white" d="M16 16l20 20M36 16L16 36" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
            Preview Failed !
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            Unable to preview the certificate.<br />
            Please try downloading it instead.
          </p>
        </div>
        <div className="achievement-popup-footer">
          <button onClick={onClose} className="preview-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Preview Progress Popup
export const PreviewProgressAlert = ({ isOpen, progress = 25 }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: '#197AFF' }}>
          Previewing...
        </div>
        <div className="achievement-popup-body">
          <div className="preview-progress-icon-container">
            <svg className="preview-progress-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="preview-progress-icon--bg" cx="26" cy="26" r="20" fill="none" stroke="#BEBFC6" strokeWidth="4"/>
              <circle 
                className="preview-progress-icon--progress" 
                cx="26" 
                cy="26" 
                r="20" 
                fill="none" 
                stroke="#197AFF" 
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${progress * 1.256} 125.6`}
                transform="rotate(-90 26 26)"
              />
            </svg>
          </div>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
            Loading {Math.round(progress)}%
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            {progress < 85 ? 'Fetching certificate from database...' : 
             progress < 100 ? 'Preparing preview...' : 
             'Opening preview...'}
          </p>
          <p style={{ margin: "10px 0 0 0", color: "#888", fontSize: "14px" }}>
            {progress >= 100 ? 'Almost ready!' : 'Please wait...'}
          </p>
        </div>
      </div>
    </div>
  );
};
