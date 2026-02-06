import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CooGraduateCap from "../assets/VectorGC.svg"
import CooBackbtn from "../assets/CooBackbtn.svg"
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import './Coo_ManageStuEditPage.module.css';
import {
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

// All helper components (MdUpload, IoMdClose, GraduationCapIcon, etc.) remain unchanged.
// ... (Your helper components go here)
const MdUpload = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path></svg>
);

const IoMdClose = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path></svg>
);

const GraduationCapIcon = () => (
    <img src={CooGraduateCap} alt="Graduation Cap" style={{ width: '100px', height: '90px', marginTop:'-20px'}}/>
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

const SuccessPopup = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="co-ms-StuProfile-popup-overlay StuProfile-popup-overlay">
            <div className="co-ms-StuProfile-popup-container StuProfile-popup-container">
                <div className="co-ms-StuProfile-popup-header StuProfile-popup-header">Saved !</div>
                <div className="co-ms-StuProfile-popup-body StuProfile-popup-body">
                    <svg className="co-ms-StuProfile-success-icon StuProfile-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="co-ms-StuProfile-success-icon--circle StuProfile-success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
                        <path className="co-ms-StuProfile-success-icon--check StuProfile-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <h2>Details Saved ✓</h2>
                    <p>Your Details have been</p>
                    <p>Successfully saved in the Portal</p>
                </div>
                <div className="co-ms-StuProfile-popup-footer StuProfile-popup-footer">
                    <button onClick={onClose} className="co-ms-StuProfile-popup-close-btn StuProfile-popup-close-btn">Close</button>
                </div>
            </div>
        </div>
    );
};
const DeleteWarningPopup = ({ isOpen, onBack, onConfirm }) => {
    if (!isOpen) return null;
    return (
        <div className="co-ms-StuProfile-popup-overlay StuProfile-popup-overlay">
            <div className="co-ms-StuProfile-popup-container StuProfile-popup-container">
                <div className="co-ms-StuProfile-popup-header StuProfile-popup-header delete-warning-header">Warning !</div>
                <div className="co-ms-StuProfile-popup-body StuProfile-popup-body">
                    <div className="co-ms-StuProfile-warning-icon" >
                       {/* RESTORED: Exclamation Mark Icon for Warning */}
                    <svg className="co-ms-StuProfile-warning-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="co-ms-StuProfile-warning-icon--circle" cx="26" cy="26" r="25" fill="none"/>
                        {/* This path creates the vertical line and the dot (exclamatory mark) */}
                        <path className="co-ms-StuProfile-warning-icon--exclamation" fill="none" d="M26 16v12M26 34v2"/>
                        </svg>
                    </div>
                    <h2>Student will be Deleted</h2>
                    <p>The selected Student</p>
                    <p>will be Deleted from the Database permanently!</p>
                </div>
                <div className="co-ms-StuProfile-popup-footer StuProfile-popup-footer">
                    <button onClick={onBack} className="co-ms-StuProfile-popup-back-btn StuProfile-popup-back-btn">Back</button>
                    <button onClick={onConfirm} className="co-ms-StuProfile-popup-confirm-btn StuProfile-popup-confirm-btn">Confirm</button>
                </div>
            </div>
        </div>
    );
};
// --- NEW: Student Deleted Popup Component ---
// --- UPDATED: Student Deleted Popup Component (New Icon) ---
const StudentDeletedPopup = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="co-ms-StuProfile-popup-overlay StuProfile-popup-overlay">
            <div className="co-ms-StuProfile-popup-container StuProfile-popup-container">
                <div className="co-ms-StuProfile-popup-header StuProfile-popup-header delete-success-header">Deleted !</div>
                <div className="co-ms-StuProfile-popup-body StuProfile-popup-body">
                    {/* NEW: Achievement-style Delete Success Icon */}
                    <svg className="co-ms-StuProfile-delete-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="co-ms-StuProfile-delete-icon--circle" cx="26" cy="26" r="25" fill="none"/>
                        <g className="co-ms-StuProfile-delete-icon--bin" fill="none" strokeWidth="2">
                            <path d="M16 20l20 0M18 20l0 16c0 1 1 2 2 2l12 0c1 0 2-1 2-2l0-16M21 20l0-3c0-1 1-2 2-2l6 0c1 0 2 1 2 2l0 3M23 25l0 8M26 25l0 8M29 25l0 8"/>
                        </g>
                    </svg>
                    <h2>Student Deleted ✓</h2>
                    <p>The selected Student</p>
                    <p>has been Deleted Successfully!</p>
                </div>
                <div className="co-ms-StuProfile-popup-footer StuProfile-popup-footer">
                    <button onClick={onClose} className="co-ms-StuProfile-popup-close-btn StuProfile-popup-close-btn">Close</button>
                </div>
            </div>
        </div>
    );
};

// --- NEW: Blocked Popup Component ---
const BlockedPopup = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="co-ms-StuProfile-popup-overlay StuProfile-popup-overlay">
            <div className="co-ms-StuProfile-popup-container StuProfile-popup-container">
                <div className="co-ms-StuProfile-popup-header StuProfile-popup-header block-popup-header">Blocked !</div>
                <div className="co-ms-StuProfile-popup-body StuProfile-popup-body">
                    <div className="co-ms-StuProfile-block-icon">
                        {/* Example Lock Icon (You might need to adjust or replace this SVG for your preferred style) */}
                        <svg className="co-ms-StuProfile-block-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
    <circle className="co-ms-StuProfile-block-icon--circle" cx="26" cy="26" r="25" />
    {/* Locked Padlock Path */}
    <path className="Aco-ms-StuProfile-block-icon--lock" 
          d="M16 26h20v16H16z M20 26v-4a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v4" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
    />
</svg>
                    </div>
                    <h2>Student Blocked ✓</h2>
                    <p>The Student's account is now</p>
                    <p>Blocked from accessing the Portal.</p>
                </div>
                <div className="co-ms-StuProfile-popup-footer StuProfile-popup-footer">
                    <button onClick={onClose} className="co-ms-StuProfile-popup-close-btn StuProfile-popup-close-btn">Close</button>
                </div>
            </div>
        </div>
    );
};

// --- NEW: Unblocked Popup Component ---
const UnblockedPopup = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="co-ms-StuProfile-popup-overlay StuProfile-popup-overlay">
            <div className="co-ms-StuProfile-popup-container StuProfile-popup-container">
                <div className="co-ms-StuProfile-popup-header StuProfile-popup-header unblock-popup-header">Unblocked !</div>
                <div className="co-ms-StuProfile-popup-body StuProfile-popup-body">
                    <div className="co-ms-StuProfile-unblock-icon">
                        {/* Example Unlock Icon (You might need to adjust or replace this SVG for your preferred style) */}
                        <svg className="co-ms-StuProfile-unblock-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
    <circle className="co-ms-StuProfile-unblock-icon--circle" cx="26" cy="26" r="25" />
    {/* Unlocked Padlock Path */}
    <path className="co-ms-StuProfile-unblock-icon--lock" 
          d="M16 26h20v16H16z M20 26v-4a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6 M19 16h4 M33 16h-4" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
    />
</svg>
                    </div>
                    <h2>Student Unblocked ✓</h2>
                    <p>The Student's account is now</p>
                    <p>Unblocked and can access the Portal.</p>
                </div>
                <div className="co-ms-StuProfile-popup-footer StuProfile-popup-footer">
                    <button onClick={onClose} className="co-ms-StuProfile-popup-close-btn StuProfile-popup-close-btn">Close</button>
                </div>
            </div>
        </div>
    );
};

const ImagePreviewModal = ({ src, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="co-ms-StuProfile-image-preview-overlay StuProfile-image-preview-overlay" onClick={onClose}>
            <div className="co-ms-StuProfile-image-preview-container StuProfile-image-preview-container" onClick={(e) => e.stopPropagation()}>
                <img src={src} alt="Profile Preview" className="co-ms-StuProfile-image-preview-content StuProfile-image-preview-content" />
                <button onClick={onClose} className="co-ms-StuProfile-image-preview-close-btn StuProfile-image-preview-close-btn">&times;</button>
            </div>
        </div>
    );
};

function StuProfile({ onLogout, onViewChange }) {
     // Removed currentView
    const [studyCategory, setStudyCategory] = useState('12th');
    const [isPopupOpen, setPopupOpen] = useState(false);
    const [isDeleteWarningOpen, setDeleteWarningOpen] = useState(false); // New state for delete warning
    const [isStudentDeletedPopupOpen, setStudentDeletedPopupOpen] = useState(false);
    const [isStudentBlocked, setIsStudentBlocked] = useState(false); // Default to unblocked
    const [isBlockedPopupOpen, setIsBlockedPopupOpen] = useState(false);
    const [isUnblockedPopupOpen, setIsUnblockedPopupOpen] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [uploadInfo, setUploadInfo] = useState({ name: '', date: '' });
    const formRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isImagePreviewOpen, setImagePreviewOpen] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [dob, setDob] = useState(null);
   
    const closeBlockedPopup = () => setIsBlockedPopupOpen(false);
    const closeUnblockedPopup = () => setIsUnblockedPopupOpen(false);

    const toggleBlockStatus = () => {
        const newBlockStatus = !isStudentBlocked;
        
        // --- ADD YOUR ACTUAL API CALL TO BLOCK/UNBLOCK HERE ---
        console.log(newBlockStatus ? "Blocking student..." : "Unblocking student...");

        // Update state and show corresponding popup
        setIsStudentBlocked(newBlockStatus);

        if (newBlockStatus) {
            setIsBlockedPopupOpen(true);
        } else {
            setIsUnblockedPopupOpen(true);
        }
    };

    const blockButtonText = isStudentBlocked ? 'Unblock' : 'Block';
    const blockButtonClass = isStudentBlocked 
        ? "co-ms-StuProfile-edit-btn StuProfile-edit-btn unblock-btn" 
        : "co-ms-StuProfile-edit-btn StuProfile-edit-btn block-btn";

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "image/jpeg") {
            if (profileImage) URL.revokeObjectURL(profileImage);
            setProfileImage(URL.createObjectURL(file));
            setUploadInfo({ name: file.name, date: new Date().toLocaleDateString('en-GB') });
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 5000);
        } else {
            alert("Invalid file type. Please upload a JPG file.");
        }
    };

    const handleImageRemove = (e) => {
        e.preventDefault();
        if (profileImage) URL.revokeObjectURL(profileImage);
        setProfileImage(null);
        setUploadInfo({ name: '', date: '' });
        setUploadSuccess(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = (e) => {
        e.preventDefault();
        setPopupOpen(true);
    };

    // --- NEW: Function to open the delete warning popup ---
    const handleDelete = () => {
        setDeleteWarningOpen(true);
    };

    // --- NEW: Function to close the delete warning popup (Back button) ---
    const closeDeleteWarning = () => {
        setDeleteWarningOpen(false);
    };

    // --- NEW: Function to confirm deletion and show "Student Deleted" popup ---
    const confirmDelete = () => {
        // --- ADD YOUR ACTUAL DELETE API LOGIC HERE ---
        console.log("Student deletion confirmed!");
        
        // After successful deletion, close warning and open success
        setDeleteWarningOpen(false);
        setStudentDeletedPopupOpen(true);
    };

    // --- NEW: Function to close the "Student Deleted" popup ---
    const closeStudentDeletedPopup = () => {
        setStudentDeletedPopupOpen(false);
        // Optionally, redirect or refresh the student list after deletion
        // onViewChange('viewStudents'); // Example: navigate back to student list
    };
    const handleDiscard = () => {
        if (formRef.current) {
            formRef.current.reset();
            setStudyCategory('12th');
            setDob(null);
            handleImageRemove(new Event('discard'));
        }
    };

    const closePopup = () => setPopupOpen(false);
    
    const handleViewChange = (view) => {
        onViewChange(view);
        setIsSidebarOpen(false);
    };

    useEffect(() => {}, []);

    const handleCardClick = (newView) => {
        if (onViewChange) {
            onViewChange(newView);
        }
    };
    

    return (
        <div className="co-ms-container container">
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className="co-ms-main main">
                <Sidebar
                    isOpen={isSidebarOpen}
                    onLogout={onLogout}
                    currentView={'manage-students'} // Show manage students since we came from that view
                    onViewChange={handleViewChange}
                />
                <div className="co-ms-StuProfile-dashboard-area co-ms-dashboard-area StuProfile-dashboard-area dashboard-area">
                    <form ref={formRef} onSubmit={handleSave}>
                        {/* --- PERSONAL INFO --- */}
                        <div className="co-ms-StuProfile-profile-section-container StuProfile-profile-section-container">
                            <h3 className="co-ms-StuProfile-section-header StuProfile-section-header">Personal Information</h3>
                            <button 
                                type="button"
                                className="co-ms-profile-backbtn" 
                                style={{ position:"absolute",left:"1100px", top:"40px", width:"100px", height:"40px", backgroundColor:"#d23b42", borderRadius:"25px", fontSize:"1.03rem",color:"#fff", border:"none"}} 
                                onClick={() => handleCardClick('manage-students')}
                            >
                                Back<img className="co-ms-profile-backbtn-img" src={CooBackbtn}alt="back" style={{position:"relative", left:"10px"}}/>
                            </button>
                            <div className="co-ms-StuProfile-form-grid StuProfile-form-grid">
                                <div className="co-ms-StuProfile-personal-info-fields StuProfile-personal-info-fields">
                                    <input type="text" placeholder="First Name" />
                                    <input type="text" placeholder="Last Name" />
                                    <input type="text" placeholder="Register Number" />
                                    <div className="co-ms-StuProfile-datepicker-wrapper StuProfile-datepicker-wrapper">
                                        <DatePicker selected={dob} onChange={(date) => setDob(date)} dateFormat="dd/MM/yyyy" placeholderText="DOB" className="co-ms-StuProfile-datepicker-input StuProfile-datepicker-input" wrapperClassName="co-ms-StuProfile-datepicker-wrapper-inner StuProfile-datepicker-wrapper-inner" showPopperArrow={false} />
                                    </div>
                                    <select defaultValue=""><option value="" disabled>Degree</option><option value="B.E">B.E</option><option value="B.Tech">B.Tech</option></select>
                                    <input type="text" placeholder="Branch" />
                                    <select defaultValue=""><option value="" disabled>Gender</option><option value="male">Male</option><option value="female">Female</option></select>
                                    <input type="text" placeholder="Address" />
                                    <input type="text" placeholder="City" />
                                    <input type="email" placeholder="Primary Mail id" />
                                    <input type="email" placeholder="Domain Mail id" />
                                    <input type="tel" placeholder="Mobile No." />
                                    <input type="text" placeholder="Father Name" />
                                    <input type="text" placeholder="Father Occupation" />
                                    <input type="text" placeholder="Father Mobile No." />
                                    <input type="text" placeholder="Mother Name" />
                                    <input type="text" placeholder="Mother Occupation" />
                                    <input type="text" placeholder="Mother Mobile No." />
                                </div>
                                <div className="co-ms-StuProfile-profile-photo-wrapper StuProfile-profile-photo-wrapper">
                                    <div className="co-ms-StuProfile-profile-photo-box StuProfile-profile-photo-box" style={{ height: '675px' }}>
                                        <h3 className="co-ms-StuProfile-section-header StuProfile-section-header">Profile Photo</h3>
                                        <div className="co-ms-StuProfile-profile-icon-container StuProfile-profile-icon-container">
                                            {profileImage ? ( <img src={profileImage} alt="Profile Preview" className="co-ms-StuProfile-profile-preview-img StuProfile-profile-preview-img" onClick={() => setImagePreviewOpen(true)} /> ) : ( <GraduationCapIcon /> )}
                                        </div>
                                        {profileImage && uploadInfo.name && (
                                            <div className="co-ms-StuProfile-upload-info-container StuProfile-upload-info-container">
                                                <div className="co-ms-StuProfile-upload-info-item StuProfile-upload-info-item"><FileIcon /><span>{uploadInfo.name}</span></div>
                                                <div className="co-ms-StuProfile-upload-info-item StuProfile-upload-info-item"><CalendarIcon /><span>Uploaded on: {uploadInfo.date}</span></div>
                                            </div>
                                        )}
                                        <div className="co-ms-StuProfile-upload-action-area StuProfile-upload-action-area">
                                            <div className="co-ms-StuProfile-upload-btn-wrapper StuProfile-upload-btn-wrapper">
                                                <label htmlFor="photo-upload-input" className="co-ms-StuProfile-profile-upload-btn StuProfile-profile-upload-btn"><div className="co-ms-StuProfile-upload-btn-content StuProfile-upload-btn-content"><MdUpload /><span>Upload (Max 500 KB)</span></div></label>
                                                {profileImage && ( <button onClick={handleImageRemove} className="co-ms-StuProfile-remove-image-btn StuProfile-remove-image-btn" aria-label="Remove image"><IoMdClose /></button> )}
                                            </div>
                                            <input type="file" id="photo-upload-input" ref={fileInputRef} style={{ display: 'none' }} accept="image/jpeg" onChange={handleImageUpload} />
                                            {uploadSuccess && ( <p className="co-ms-StuProfile-upload-success-message StuProfile-upload-success-message">Profile Photo uploaded Successfully!</p> )}
                                            <p className="co-ms-StuProfile-upload-hint StuProfile-upload-hint">*Only JPG format is allowed.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="co-ms-StuProfile-form-grid StuProfile-form-grid" style={{ marginTop: '1.5rem' }}>
                                <select defaultValue=""><option value="" disabled>Community</option> <option value="OC">OC</option><option value="BC">BC</option><option value="BCM">BCM</option><option value="MBC">MBC</option><option value="SC">SC</option><option value="SCA">SCA</option><option value="ST">ST</option></select>
                                <input type="text" placeholder="Blood Group" />
                                <input type="text" placeholder="Aadhaar Number" />
                                <select defaultValue=""><option value="" disabled>Medium of study</option><option value="English">English</option><option value="Tamil">Tamil</option><option value="Other">Others</option></select>
                                <input type="text" placeholder="Garudian Name" className="co-ms-mr-input mr-input"  />
                                <input type="text" placeholder="Garudian Mobile No" className="co-ms-mr-input mr-input"  />
                            </div>
                        </div>

                        {/* --- ACADEMIC BACKGROUND --- */}
                        <div className="co-ms-StuProfile-profile-section-container StuProfile-profile-section-container">
                           <h3 className="co-ms-StuProfile-section-header StuProfile-section-header">Academic Background</h3>
                            <div className="co-ms-StuProfile-form-grid StuProfile-form-grid">
                                <div className="co-ms-StuProfile-study-category StuProfile-study-category" style={{ gridColumn: '1 / -1' }}>
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
                                {(studyCategory === '12th' || studyCategory === 'both') && ( <> <input type="text" placeholder="12th Institution Name" /> <select defaultValue=""><option value="" disabled>12th Board/University</option><option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="Other State Board">Other State Board</option></select> <input type="text" placeholder="12th Percentage" /> <input type="text" placeholder="12th Year of Passing" /> <input type="text" placeholder="12th Cut-off Marks" /> </> )}
                                {(studyCategory === 'diploma' || studyCategory === 'both') && ( <> <input type="text" placeholder="Diploma Institution" /> <input type="text" placeholder="Diploma Branch" /> <input type="text" placeholder="Diploma Percentage" /> <input type="text" placeholder="Diploma Year of Passing" /> </> )}
                            </div>
                        </div>
                        
                        {/* --- SEMESTER & OTHER DETAILS (Your existing JSX for these sections) --- */}
                        <div className="co-ms-StuProfile-profile-section-container StuProfile-profile-section-container">
                            <h3 className="co-ms-StuProfile-section-header StuProfile-section-header">Semester</h3>
                            <div className="co-ms-StuProfile-form-grid StuProfile-form-grid">
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
                        <div className="co-ms-StuProfile-profile-section-container StuProfile-profile-section-container">
                            <h3 className="co-ms-StuProfile-section-header StuProfile-section-header">Other Details</h3>
                            <div className="co-ms-StuProfile-form-grid StuProfile-form-grid">
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
                        <div className="co-profile-section-container">
                                <h3 className="co-section-header">Login Details</h3>
                                <div className="co-form-grid">
                                    <input 
                                        type="text" 
                                        name="loginRegNo" 
                                        placeholder="Register No (11 digits) *" 
                                        maxLength="11"
                                        required
                                    />
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                             
                                            name="loginPassword" 
                                            placeholder="Password DOB (ddmmyyyy) *" 
                                            required
                                            style={{ paddingRight: '40px' }}
                                        />
                                        <button
                                            type="button"
                                            className="co-password-toggle-btn"
                                        >
                                         <FaEyeSlash size={16} /> : <FaEye size={16} />
                                        </button>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            
                                            name="confirmPassword" 
                                            placeholder="Confirm Password (ddmmyyyy) *" 
                                            required 
                                            style={{ paddingRight: '40px' }}
                                        />
                                        <button
                                            type="button"
                                            className="co-password-toggle-btn"
                                            
                                        >
                                             <FaEyeSlash size={16} /> : <FaEye size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                        <div className="co-ms-StuProfile-action-buttons StuProfile-action-buttons">
                            <button type="button" 
                        className={blockButtonClass} 
                        onClick={toggleBlockStatus}
                    >
                        {blockButtonText}
                    </button>
                            <button type="button" className="co-ms-StuProfile-block-btn StuProfile-block-btn" onClick={handleDelete}>Delete</button>
                            <button type="button" className="co-ms-StuProfile-discard-btn StuProfile-discard-btn" onClick={handleDiscard}>Discard</button>
                            <button type="submit" className="co-ms-StuProfile-save-btn StuProfile-save-btn">Save</button>
                        </div>
                    </form>
                </div>
            </div>
            {isSidebarOpen && <div className="co-ms-overlay overlay" onClick={() => setIsSidebarOpen(false)}></div>}
            <SuccessPopup isOpen={isPopupOpen} onClose={closePopup} />
            <DeleteWarningPopup isOpen={isDeleteWarningOpen} onBack={closeDeleteWarning} onConfirm={confirmDelete} />
            <StudentDeletedPopup isOpen={isStudentDeletedPopupOpen} onClose={closeStudentDeletedPopup} />
            <BlockedPopup isOpen={isBlockedPopupOpen} onClose={closeBlockedPopup} />
            <UnblockedPopup isOpen={isUnblockedPopupOpen} onClose={closeUnblockedPopup} />
            <ImagePreviewModal src={profileImage} isOpen={isImagePreviewOpen} onClose={() => setImagePreviewOpen(false)} />
        </div>
    );
}

export default StuProfile;