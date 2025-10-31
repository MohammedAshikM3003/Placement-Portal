import React from 'react';
import { Link } from 'react-router-dom';
import './AlertStyles.css';

// Registration Success Alert
export const RegistrationSuccessAlert = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="registration-popup-container">
        <div className="registration-popup-header">
          Registered !
        </div>
        <div className="registration-popup-body">
          <svg className="registration-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="registration-success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="registration-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
          <h2>Login Created ✓</h2>
          <p>Student ID Created!</p>
          <p>Click Login button to Redirect </p>
        </div>
        <div className="registration-popup-footer">
          <Link to="/mainlogin" style={{position : "relative",marginLeft : '65px'}}>
            <button className="registration-popup-login-btn">Login</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

// Existing Registration Number Alert
export const ExistingRegNoAlert = ({ isOpen, onClose, regNo }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="registration-popup-container">
        <div className="registration-popup-header" style={{ backgroundColor: '#1976d2' }}>
          Registration Number Already Exists!
        </div>
        <div className="registration-popup-body">
          <svg className="registration-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="registration-error-icon--circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="registration-error-icon--cross" fill="none" d="M16 16l20 20M36 16l-20 20"/>
          </svg>
          <h2 style={{ color: '#000000' }}>Registration Number Already Exists</h2>
          <p style={{ marginBottom: '8px' }}>Registration Number: <strong>{regNo}</strong></p>
          <p style={{ marginBottom: '8px' }}>This registration number is already registered in our system.</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            Please use a different registration number or contact support if you believe this is an error.
          </p>
        </div>
        <div className="registration-popup-footer">
          <button onClick={onClose} className="registration-popup-close-btn-blue">OK</button>
        </div>
      </div>
    </div>
  );
};

// Mismatched Registration Number Alert
export const MismatchedRegNoAlert = ({ isOpen, onClose, personalRegNo, loginRegNo }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="registration-popup-container">
        <div className="registration-popup-header" style={{ backgroundColor: '#1976d2' }}>
          Registration Numbers Don't Match!
        </div>
        <div className="registration-popup-body">
          <svg className="registration-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="registration-error-icon--circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="registration-error-icon--cross" fill="none" d="M16 16l20 20M36 16l-20 20"/>
          </svg>
          <h2 style={{ color: '#000000' }}>Registration Numbers Don't Match ✗</h2>
          <p style={{ marginBottom: '8px' }}>Personal Info Registration: <strong>{personalRegNo}</strong></p>
          <p style={{ marginBottom: '8px' }}>Login Registration: <strong>{loginRegNo}</strong></p>
          <p style={{ marginBottom: '8px' }}>The login registration number must match the personal information registration number.</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            Please enter the same registration number in both fields.
          </p>
        </div>
        <div className="registration-popup-footer">
          <button onClick={onClose} className="registration-popup-close-btn-blue">OK</button>
        </div>
      </div>
    </div>
  );
};

// File Size Error Alert for Registration
export const RegistrationFileSizeAlert = ({ isOpen, onClose, fileSizeKB }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="registration-popup-container">
        <div className="registration-popup-header" style={{ backgroundColor: '#1976d2' }}>
          Image Too Large!
        </div>
        <div className="registration-popup-body">
          <div className="registration-image-error-icon-container">
            <svg className="registration-image-error-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                <line x1="18" y1="6" x2="18.01" y2="6"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </g>
            </svg>
          </div>
          <h2 style={{ color: '#d32f2f' }}>Image Size Exceeded ✗</h2>
          <p style={{ marginBottom: '8px' }}>Maximum allowed: <strong>500KB</strong></p>
          <p style={{ marginBottom: '8px' }}>Your image size: <strong>{fileSizeKB}KB</strong></p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            Please compress your image or choose a smaller file.
          </p>
        </div>
        <div className="registration-popup-footer">
          <button onClick={onClose} className="registration-popup-close-btn-blue">OK</button>
        </div>
      </div>
    </div>
  );
};
