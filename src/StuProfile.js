import React, { useState, useRef } from "react";
import Adminicon from "./assets/Adminicon.png"; // For Navbar/Sidebar consistency
import CompanySideBarIcon from "./assets/CompanySideBarIcon.svg"; // For Sidebar
import Adminicons from './assets/BlueAdminicon.png'; // For Profile Photo placeholder

// Inlined helper SVG components for the form content
const MdUpload = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path></svg>
);

const IoMdClose = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path></svg>
);

const GraduationCapIcon = () => (
    <img src={Adminicons} alt="Graduation Cap" style={{ width: '100px', height: '80px', marginTop:'-20px'}}/>
);

const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', marginRight: '8px', color: '#555', flexShrink: 0 }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
);

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', marginRight: '8px', color: '#555', flexShrink: 0 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

// Sidebar items from dashboard.js
const sidebarItems = [
  { icon: require('./assets/DashboardSideBarIcon.png'), text: 'Dashboard', view: 'dashboard' },
  { icon: require('./assets/ResumeSideBarIcon.png'), text: 'Resume', view: 'resume' },
  { icon: require('./assets/AttendanceSideBarIcon.png'), text: 'Attendance', view: 'attendance' },
  { icon: require('./assets/AchievementsSideBarIcon.png'), text: 'Achievements', view: 'achievements' },
  { icon: CompanySideBarIcon, text: 'Company', view: 'company' },
  { icon: require('./assets/ProfileSideBarIcon.png'), text: 'Profile', view: 'profile' },
];

const SuccessPopup = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="popup-overlay">
            <div className="popup-container">
                <div className="popup-header">
                    Saved !
                </div>
                <div className="popup-body">
                    <svg className="success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
                        <path className="success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <h2>Changes Saved ✓</h2>
                    <p>Your Details have been</p>
                    <p>Successfully saved in the Portal</p>
                </div>
                <div className="popup-footer">
                    <button onClick={onClose} className="popup-close-btn">
                        Close &times;
                    </button>
                </div>
            </div>
        </div>
    );
};

const ImagePreviewModal = ({ src, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="image-preview-overlay" onClick={onClose}>
            <div className="image-preview-container" onClick={(e) => e.stopPropagation()}>
                <img src={src} alt="Profile Preview" className="image-preview-content" />
                <button onClick={onClose} className="image-preview-close-btn">&times;</button>
            </div>
        </div>
    );
};


function StuProfile({ onLogout, onViewChange, currentView }) {
    const [studyCategory, setStudyCategory] = useState('12th');
    const [isPopupOpen, setPopupOpen] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [uploadInfo, setUploadInfo] = useState({ name: '', date: '' });
    const formRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isImagePreviewOpen, setImagePreviewOpen] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "image/jpeg") {
            if (profileImage) {
                URL.revokeObjectURL(profileImage);
            }
            setProfileImage(URL.createObjectURL(file));
            setUploadInfo({
                name: file.name,
                date: new Date().toLocaleDateString('en-GB')
            });
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 5000);
        } else {
            alert("Invalid file type. Please upload a JPG file.");
        }
    };

    const handleImageRemove = (e) => {
        e.preventDefault();
        if (profileImage) {
            URL.revokeObjectURL(profileImage);
        }
        setProfileImage(null);
        setUploadInfo({ name: '', date: '' });
        setUploadSuccess(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        console.log("Form data saved!");
        setPopupOpen(true);
    };

    const handleDiscard = () => {
        if (formRef.current) {
            formRef.current.reset();
            setStudyCategory('12th');
            handleImageRemove(new Event('discard'));
        }
    };

    const closePopup = () => {
        setPopupOpen(false);
    };

  return (
    <>
      <style>{`
        /* --- Base Styles and Layout --- */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');
        body {
          background: #f8f8fb;
          margin: 0;
          padding: 0;
          font-family: 'Poppins', Arial, sans-serif;
          overflow: hidden; /* Prevents main browser scrollbar */
        }
        .container {
          background: #f8f8fb;
          min-height: 100vh;
        }

        /* --- Navbar Styles (from dashboard.js) --- */
        .navbar {
          display: flex;
          align-items: center;
          background: #2085f6;
          color: #fff;
          padding: 15px 32px 15px 26px;
          justify-content: space-between;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          height: 65.2px; /* Define an explicit height */
          box-sizing: border-box; /* Include padding in height */
        }
        .navbar .left { display: flex; align-items: center; }
        .portal-logo {
          height: 35px; width: 35px; margin-right: 18px;
          display: flex; align-items: center; justify-content: center;
        }
        .portal-logo img { height: 30px; width: 40px; filter: brightness(0) invert(1); }
        .portal-name { font-size: 1.48rem; font-weight: bold; letter-spacing: 0.5px; }
        .navbar .menu { display: flex; gap: 35px; font-size: 1.06rem; }
        .navbar .menu span {
          color: #fff; text-decoration: none; margin: 0 5px; font-weight: 500;
          position: relative; padding: 8px 12px; border-radius: 6px;
          transition: background 0.2s; display: flex; align-items: center; gap: 5px;
        }
        .navbar .menu span:hover { background: rgba(255,255,255,0.1); }
        
        .main {
          display: flex;
          margin-top: 65px; /* Must match navbar height */
        }
        
        /* --- Sidebar Styles (from dashboard.js) --- */
        .sidebar {
          background: #fff;
          width: 230px;
          height: calc(100vh - 65px); /* Must match navbar height */
          box-shadow: 2px 0 12px #e1e6ef3a;
          display: flex;
          flex-direction: column;
          position: fixed;
          left: 0;
          top: 65px; /* Must match navbar height */
          overflow-y: auto;
          z-index: 999;
        }
        .sidebar .user-info {
          text-align: center; padding: 25px 20px 20px 20px; font-size: 1rem; color: #555;
          display: flex; flex-direction: column; align-items: center;
          position: relative; flex-shrink: 0; margin-top: 15px;
        }
        .sidebar .user-details img { width: 50px; height: 40px; margin-right: 15px; flex-shrink: 0; }
        .sidebar .user-details {
          margin-top: 8px; font-weight: 600; font-size: 1.1em; color: #191c24;
          display: flex; align-items: center; justify-content: flex-start; gap: 0;
        }
        .sidebar .user-text { display: flex; flex-direction: column; align-items: flex-start; flex: 1; }
        .sidebar .user-year { color: #777; font-size: 0.9em; font-weight: 400; margin-top: 2px; display: block; }
        .sidebar .menu-toggle {
          position: absolute; top: 20px; right: 20px; background: none; border: none;
          color: #999; font-size: 1.2em; cursor: pointer; width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center; border-radius: 4px;
          transition: background 0.2s; margin-top: 40px; 
        }
        .sidebar .menu-toggle:hover { background: #f0f0f0; }
        .sidebar .nav {
          flex: 1; display: flex; flex-direction: column; padding: 0px 0;
          justify-content: flex-start; gap: 0; min-height: 0;
        }
        .sidebar .nav-section { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
        .sidebar .nav-item {
          display: flex; align-items: center; font-size: 1.27rem; padding: 18px 25px;
          color: #000000; text-decoration: none; cursor: pointer; transition: all 0.18s;
          gap: 15px; border-left: 4px solid transparent; margin: 3px 0; margin-top: 0px;
        }
        .sidebar .nav-item.selected {
          background: #F8F8F8; border-left: 4px solid #197AFF;
          color: #197AFF; font-weight: 600;
        }
        .sidebar .nav-item.selected img { filter: brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%); }
        .sidebar .nav-item:hover:not(.selected) { background: #f0f6ff; border-left: 4px solid #197AFF; color: #197AFF; }
        .sidebar .nav-item img {
          width: 20px; height: 20px; transition: transform 0.2s;
          filter: brightness(0) saturate(100%) invert(0%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(0%) contrast(100%);
        }
        .sidebar .nav-item:hover img { transform: scale(1.1); }
        .sidebar .nav-item:hover:not(.selected) img { filter: brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%); }
        .sidebar .nav-divider {
          height: 1px; width: 228px; background: #e0e0e0; margin: 8px 2px;
          border-top: 1px dotted #ccc; flex-shrink: 0; margin-top: 12px;
        }
        .sidebar .logout-btn {
          background: #D23B42; color: #fff; margin: 25px 25px 25px 25px; padding: 10px 0;
          border: none; border-radius: 60px; font-size: 1.3rem; font-weight: 500;
          letter-spacing: 0.2px; cursor: pointer; transition: background 0.2s;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          width: 50%; margin-left: 50px; margin-bottom: 10px;
        }
        .sidebar .logout-btn:hover { background: #d55a6a; }
        
        /* --- Profile Form Specific Styles --- */
        .dashboard-area {
          flex: 1;
          height: calc(100vh - 65px);
          padding: 25px;
          background: #f8f8fb;
          margin-left: 230px;
          overflow-y: auto;
          overflow-x: hidden;
          position: relative;
        }
        .profile-section-container {
            background-color: #fff; padding: 2.5rem; border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); margin-bottom: 2rem;
        }
        .profile-section-container:last-child { margin-bottom: 0; }
        .section-header {
            font-size: 1.25rem; font-weight: 600; color: #333; margin-top: 0;
            margin-bottom: 1.5rem; position: relative; padding-bottom: 0.5rem;
        }
        .section-header::after {
            content: ''; position: absolute; bottom: 0; left: 0; width: 40px;
            height: 3px; background-color: #2085f6; border-radius: 2px;
        }
        .form-grid { 
            display: grid; 
            gap: 1.5rem; 
            grid-template-columns: repeat(3, 1fr); 
            align-items: start; 
        }
        
        .personal-info-fields {
            grid-column: 1 / span 2; 
            display: grid;
            grid-template-columns: 1fr 1fr; 
            gap: 1.5rem;
            align-content: start; 
        }

        .profile-photo-wrapper {
            grid-column: 3 / 4;
        }

        .form-grid input, .form-grid select {
          width: 100%; padding: 0.9rem; border: 1px solid #DDE6F4; border-radius: 8px;
          background-color: #F9FBFF; font-size: 0.95rem; box-sizing: border-box; font-family: 'Poppins', sans-serif;
        }
        .form-grid input:focus, .form-grid select:focus {
          outline: none; border-color: #2085f6;
          box-shadow: 0 0 0 3px rgba(32, 133, 246, 0.2);
        }
        .profile-photo-box {
            background-color: #fff; border: 1px solid #DDE6F4; border-radius: 12px;
            padding: 1.5rem; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); height: 100%;
            display: flex; flex-direction: column; justify-content: space-between;
        }
        .profile-photo-box .section-header { margin-bottom: 1rem; text-align: left; border-bottom: none; }
        .profile-icon-container {
            padding: 1rem 0; flex-grow: 1; display: flex;
            align-items: center; justify-content: center; min-height: 150px;
        }
        .profile-preview-img { 
            width: 150px; height: 150px; object-fit: cover; 
            border-radius: 12px; border: 4px solid #e9f1fc; cursor: pointer; 
        }
        .upload-action-area { margin-top: auto; }
        .upload-hint { font-size: 0.8rem; color: #888; margin-top: 8px; text-align: center; }
        .upload-success-message {
            font-size: 0.9rem;
            color: #28a745; /* Green color */
            font-weight: 500;
            text-align: center;
            margin: 10px 0 0 0;
        }
        .upload-btn-wrapper { display: flex; align-items: center; gap: 10px; }
        .profile-upload-btn {
            flex-grow: 1; display: flex; align-items: center; justify-content: center; padding: 0.8rem 1rem;
            background-color: #F9FBFF; border: 1px solid #DDE6F4; border-radius: 8px; cursor: pointer;
            font-size: 0.95rem; color: #555; transition: all 0.2s ease-in-out;
        }
        .profile-upload-btn:hover { background-color: #f0f6ff; border-color: #a9c7f5; }
        .upload-btn-content { display: flex; align-items: center; gap: 8px; }
        .upload-btn-content svg { transform: translateY(-1px); font-size: 1.3rem; }
        .remove-image-btn {
            background: #fde8e8; border: 1px solid #f9c6c6; color: #d9534f; border-radius: 8px;
            cursor: pointer; width: 45px; height: 45px; padding: 0; display: flex; align-items: center;
            justify-content: center; font-size: 1.5rem; transition: all 0.2s ease; flex-shrink: 0;
        }
        .remove-image-btn:hover { background: #d9534f; color: white; border-color: #d9534f; }
        .upload-info-container {
            margin-top: 1rem; margin-bottom: 1rem; padding: 1rem; background-color: #f9fbff;
            border: 1px solid #dde6f4; border-radius: 8px; text-align: left; font-size: 0.85rem; word-break: break-all;
        }
        .upload-info-item { display: flex; align-items: center; color: #555; }
        .upload-info-item:not(:last-child) { margin-bottom: 0.75rem; }
        .study-category {
            display: flex; gap: 1rem; align-items: center; padding: 0.5rem;
            background-color: #F9FBFF; border-radius: 8px; border: 1px solid #DDE6F4;
        }
        .study-category label {
            flex: 1; text-align: center; padding: 0.5rem; border-radius: 6px;
            cursor: pointer; transition: all 0.2s ease-in-out;
        }
        .study-category input[type="radio"] { display: none; }
        .study-category input[type="radio"]:checked + label {
            background-color: #2085f6; color: white; font-weight: 500;
            box-shadow: 0 2px 8px rgba(32, 133, 246, 0.3);
        }
        .action-buttons { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem; }
        .action-buttons button {
            padding: 0.8rem 2rem; border-radius: 8px; border: none; font-size: 1rem;
            font-weight: 500; cursor: pointer; transition: all 0.2s ease-in-out;
        }
        .discard-btn { background-color: #E9F1FC; color: #2085f6; }
        .save-btn { background-color: #2085f6; color: white; }
        .save-btn:hover { background-color: #1a6ac4; }
        .discard-btn:hover { background-color: #d8e6f8; }

        /* --- Image Preview Modal --- */
        .image-preview-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.7);
            display: flex; align-items: center; justify-content: center; z-index: 3000; cursor: pointer;
        }
        .image-preview-container {
            position: relative; background-color: #fff; padding: 10px; border-radius: 12px;
            max-width: 90vw; max-height: 90vh; cursor: default;
        }
        .image-preview-content {
            max-width: 100%; max-height: calc(90vh - 20px); display: block; border-radius: 8px;
        }
        .image-preview-close-btn {
            position: absolute; top: -15px; right: -15px; background: white; color: #333;
            border: 2px solid #333; border-radius: 50%; width: 40px; height: 40px;
            font-size: 2rem; font-weight: bold; cursor: pointer; display: flex;
            align-items: center; justify-content: center; line-height: 1; padding: 0 0 5px 0;
        }

        /* --- Popup Styles (Unchanged) --- */
        .popup-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5);
            display: flex; align-items: center; justify-content: center; z-index: 2000;
        }
        .popup-container {
            background-color: #fff; border-radius: 12px; width: 400px; text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3); overflow: hidden;
        }
        .popup-header { background-color: #2085f6; color: white; padding: 1rem; font-size: 1.5rem; font-weight: 600; }
        .popup-body { padding: 2rem; }
        .popup-body h2 { margin-top: 1rem; margin-bottom: 0.5rem; color: #333; }
        .popup-body p { margin: 0.25rem 0; color: #666; }
        .popup-footer { padding: 1.5rem; background-color: #f7f7f7; }
        .popup-close-btn {
            background-color: #d9534f; color: white; border: none; padding: 0.8rem 1.5rem;
            border-radius: 8px; font-size: 1rem; font-weight: 500; cursor: pointer; transition: background-color 0.2s;
        }
        .popup-close-btn:hover { background-color: #c9302c; }
        .success-icon {
            width: 80px; height: 80px; border-radius: 50%; display: block; stroke-width: 2;
            stroke: #fff; stroke-miterlimit: 10; margin: 0 auto;
            box-shadow: inset 0px 0px 0px #4bb71b; animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
        }
        .success-icon--circle {
            stroke-dasharray: 166; stroke-dashoffset: 166; stroke-width: 2; stroke-miterlimit: 10;
            stroke: #4bb71b; fill: none; animation: stroke .6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .success-icon--check {
            transform-origin: 50% 50%; stroke-dasharray: 48; stroke-dashoffset: 48;
            animation: stroke .3s cubic-bezier(0.65, 0, 0.45, 1) .8s forwards;
        }
        @keyframes stroke { 100% { stroke-dashoffset: 0; } }
        @keyframes scale { 0%, 100% { transform: none; } 50% { transform: scale3d(1.1, 1.1, 1); } }
        @keyframes fill { 100% { box-shadow: inset 0px 0px 0px 40px #4bb71b; } }
      `}</style>

      <div className="container">
        {/* Navbar from dashboard.js */}
        <div className="navbar">
            <div className="left">
                <span className="portal-logo">
                    <img src={Adminicon} alt="Portal Logo" />
                </span>
                <span className="portal-name">Placement Portal</span>
            </div>
            <div className="menu">
                <span style={{ cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>Home</span>
                <span style={{ cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>About</span>
                <span style={{ cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>Features</span>
                <span style={{ cursor: 'pointer' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '5px' }}><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>Contact</span>
            </div>
        </div>

        <div className="main">
          {/* Sidebar from dashboard.js */}
          <div className="sidebar">
              <div className="user-info">
                  <div className="user-details">
                      <img src={Adminicon} alt="Admin" style={{ filter: "brightness(0) saturate(100%) invert(30%) sepia(90%) saturate(2000%) hue-rotate(220deg) brightness(100%) contrast(100%)" }} />
                      <div className="user-text">
                          <span>Student</span>
                          <span className="user-year">Final Year</span>
                      </div>
                      <img src={Adminicon} alt="Admin" style={{ width: "16px", height: "16px", marginLeft: "auto" }} />
                  </div>
              </div>
              <button className="menu-toggle">•••</button>
              <nav className="nav">
                  <div className="nav-section">
                      {sidebarItems.slice(0, 5).map((item) => (
                          <span key={item.text} className={`nav-item${item.view === currentView ? ' selected' : ''}`} onClick={() => onViewChange(item.view)}>
                              <img src={item.icon} alt={item.text} /> {item.text}
                          </span>
                      ))}
                  </div>
                  <div className="nav-divider"></div>
                  <span className={`nav-item${currentView === 'profile' ? ' selected' : ''}`} onClick={() => onViewChange('profile')}>
                      <img src={require('./assets/ProfileSideBarIcon.png')} alt="Profile" /> Profile
                  </span>
              </nav>
              <button className="logout-btn" onClick={onLogout}>
                  Logout
              </button>
          </div>

          {/* Profile Form Content */}
          <div className="dashboard-area">
            <form ref={formRef} onSubmit={handleSave}>
                <div className="profile-section-container">
                    <h3 className="section-header">Personal Information</h3>
                    <div className="form-grid">
                        <div className="personal-info-fields">
                            <input type="text" placeholder="First Name" />
                            <input type="text" placeholder="Last Name" />
                            <input type="text" placeholder="Register Number" />
                            <input type="date" placeholder="DOB" />
                            <select defaultValue=""><option value="" disabled>Degree</option><option value="B.E">B.E</option><option value="B.Tech">B.Tech</option></select>
                            <input type="text" placeholder="Branch" />
                            <select defaultValue=""><option value="" disabled>Gender</option><option value="male">Male</option><option value="female">Female</option></select>
                            <input type="text" placeholder="Address" />
                            <input type="text" placeholder="City" />
                            <input type="email" placeholder="Primary Email id" />
                            <input type="email" placeholder="Secondary Email id" />
                            <input type="tel" placeholder="Mobile No." />
                            <input type="text" placeholder="Father Name" />
                            <input type="text" placeholder="Father Occupation" />
                            <input type="text" placeholder="Mother Name" />
                            <input type="text" placeholder="Mother Occupation" />
                        </div>
                        
                        <div className="profile-photo-wrapper"> 
                             <div className="profile-photo-box" style={{ height: '560px' }}>
                                <h3 className="section-header">Profile Photo</h3>
                                <div className="profile-icon-container">
                                    {profileImage ? (
                                        <img src={profileImage} alt="Profile Preview" className="profile-preview-img" onClick={() => setImagePreviewOpen(true)} />
                                    ) : (
                                        <GraduationCapIcon />
                                    )}
                                </div>
                                
                                {profileImage && uploadInfo.name && (
                                    <div className="upload-info-container">
                                        <div className="upload-info-item">
                                            <FileIcon />
                                            <span>{uploadInfo.name}</span>
                                        </div>
                                        <div className="upload-info-item">
                                            <CalendarIcon />
                                            <span>Uploaded on: {uploadInfo.date}</span>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="upload-action-area">
                                    <div className="upload-btn-wrapper">
                                        <label htmlFor="photo-upload-input" className="profile-upload-btn">
                                            <div className="upload-btn-content">
                                                <MdUpload />
                                                <span>Upload (Max 500 KB)</span>
                                            </div>
                                        </label>
                                        {profileImage && (
                                            <button onClick={handleImageRemove} className="remove-image-btn" aria-label="Remove image">
                                                <IoMdClose />
                                            </button>
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        id="photo-upload-input" 
                                        ref={fileInputRef}
                                        style={{ display: 'none' }} 
                                        accept="image/jpeg" 
                                        onChange={handleImageUpload}
                                    />
                                     {uploadSuccess && (
                                        <p className="upload-success-message">
                                            Profile Photo uploaded Successfully!
                                        </p>
                                    )}
                                    <p className="upload-hint">*Only JPG format is allowed.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="form-grid" style={{ marginTop: '1.5rem' }}>
                        <select defaultValue=""><option value="" disabled>Community</option> <option value="OC">OC</option><option value="BC">BC</option><option value="BCM">BCM</option><option value="MBC">MBC</option><option value="SC">SC</option><option value="SCA">SCA</option><option value="ST">ST</option></select>
                        <input type="text" placeholder="Blood Group" />
                        <input type="text" placeholder="Parent Mobile No." />
                        <input type="text" placeholder="Aadhaar Number" />
                        <select defaultValue=""><option value="" disabled>Medium of study</option><option value="English">English</option><option value="Tamil">Tamil</option><option value="Other">Others</option></select>
                    </div>
                </div>

                <div className="profile-section-container">
                    <h3 className="section-header">Academic Background</h3>
                    <div className="form-grid">
                        <div className="study-category" style={{ gridColumn: '1 / -1' }}>
                            <input type="radio" id="12th" name="study_category" value="12th" checked={studyCategory === '12th'} onChange={(e) => setStudyCategory(e.target.value)} />
                            <label htmlFor="12th">12th</label>
                            <input type="radio" id="diploma" name="study_category" value="diploma" checked={studyCategory === 'diploma'} onChange={(e) => setStudyCategory(e.target.value)} />
                            <label htmlFor="diploma">Diploma</label>
                            <input type="radio" id="both" name="study_category" value="both" checked={studyCategory === 'both'} onChange={(e) => setStudyCategory(e.target.value)} />
                            <label htmlFor="both">Both</label>
                        </div>

                        <input type="text" placeholder="10th Institution Name" />
                        <select defaultValue=""><option value="" disabled>10th Board/University</option><option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="Other State Board">Other State Board</option></select>
                        <input type="text" placeholder="10th Percentage" />
                        <input type="text" placeholder="10th Year of Passing" />

                        {(studyCategory === '12th' || studyCategory === 'both') && (
                            <>
                                <input type="text" placeholder="12th Institution Name" />
                                <select defaultValue=""><option value="" disabled>12th Board/University</option><option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="Other State Board">Other State Board</option></select>
                                <input type="text" placeholder="12th Percentage" />
                                <input type="text" placeholder="12th Year of Passing" />
                                <input type="text" placeholder="12th Cut-off Marks" />
                            </>
                        )}
                        
                        {(studyCategory === 'diploma' || studyCategory === 'both') && (
                            <>
                                <input type="text" placeholder="Diploma Institution" />
                                <input type="text" placeholder="Diploma Branch" />
                                <input type="text" placeholder="Diploma Percentage" />
                                <input type="text" placeholder="Diploma Year of Passing" />
                            </>
                        )}
                    </div>
                </div>

                <div className="profile-section-container">
                    <h3 className="section-header">Semester</h3>
                    <div className="form-grid">
                        <input type="text" placeholder="Semester 1 GPA" />
                        <input type="text" placeholder="Semester 2 GPA" />
                        <input type="text" placeholder="Semester 3 GPA" />
                        <input type="text" placeholder="Semester 4 GPA" />
                        <input type="text" placeholder="Semester 5 GPA" />
                        <input type="text" placeholder="Semester 6 GPA" />
                        <input type="text" placeholder="Semester 7 GPA" />
                        <input type="text" placeholder="Semester 8 GPA" />
                        <input type="text" placeholder="Overall CGPA" />
                        <input type="number" placeholder="No. of Backlogs (Cleared)" />
                        <input type="number" placeholder="No. of Current Backlogs" />
                        <input type="number" placeholder="Year of Gap" />
                        <input type="text" placeholder="Reason for year of Gap" style={{ gridColumn: '1 / -1' }} />
                    </div>
                </div>
                
                <div className="profile-section-container">
                    <h3 className="section-header">Other Details</h3>
                    <div className="form-grid">
                        <select defaultValue=""><option value="" disabled>Residential status</option><option value="Hosteller">Hosteller</option><option value="Dayscholar">Dayscholar</option></select>
                        <select defaultValue=""><option value="" disabled>Quota</option><option value="Management">Management</option><option value="Counselling">Counselling</option></select>
                        <input type="text" placeholder="Languages Known" />
                        <select defaultValue=""><option value="" disabled>First Graduate</option><option value="Yes">Yes</option><option value="No">No</option></select>
                        <input type="text" placeholder="Passport No." />
                        <input type="text" placeholder="Skill set" />
                        <input type="text" placeholder="Value Added Courses" />
                        <input type="text" placeholder="About sibling" />
                        <input type="text" placeholder="Ration card No." />
                        <input type="text" placeholder="Family Annual Income" />
                        <input type="text" placeholder="PAN No." />
                        <select defaultValue=""><option value="" disabled>Willing to Sign Bond</option><option value="Yes">Yes</option><option value="No">No</option></select>
                        <select defaultValue=""><option value="" disabled>Preferred Mode of Drive</option><option value="Online">Online</option><option value="Offline">Offline</option><option value="Hybrid">Hybrid</option></select>
                        <input type="text" placeholder="GitHub Link" />
                        <input type="text" placeholder="LinkedIn Profile Link" />
                        <select defaultValue=""><option value="" disabled>Types of companies</option><option value="IT">IT</option><option value="Non-IT">Non-IT</option><option value="MNC">MNC</option><option value="Startup">Startup</option><option value="Government/Public Sector">Government/Public Sector</option><option value="Non-Profit">Non-Profit</option><option value="Other">Other</option></select>
                        <select defaultValue=""><option value="" disabled>Preferred job location</option><option value="Tamil Nadu">Tamil Nadu</option><option value="Bengaluru">Bengaluru</option><option value="Hyderabad">Hyderabad</option><option value="North India">North India</option></select>
                    </div>
                </div>

                <div className="action-buttons">
                    <button type="button" className="discard-btn" onClick={handleDiscard}>Discard</button>
                    <button type="submit" className="save-btn">Save</button>
                </div>
            </form>
          </div>
        </div>
      </div>
      <SuccessPopup isOpen={isPopupOpen} onClose={closePopup} />
      <ImagePreviewModal
        src={profileImage}
        isOpen={isImagePreviewOpen}
        onClose={() => setImagePreviewOpen(false)}
      />
    </>
  );
}

export default StuProfile;

