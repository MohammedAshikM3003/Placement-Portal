import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import Navbar from './components/Navbar/Navbar';
import Sidebar from './components/Sidebar/Sidebar';
import './StuProfile.css';
import Adminicons from './assets/BlueAdminicon.png';

// All helper components (MdUpload, IoMdClose, GraduationCapIcon, etc.) remain unchanged.
// ... (Your helper components go here)
const MdUpload = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path></svg>
);

const IoMdClose = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path></svg>
);

const GraduationCapIcon = () => (
    <img src={Adminicons} alt="Graduation Cap" style={{ width: '100px', height: '90px', marginTop:'-20px'}}/>
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
        <div className="StuProfile-popup-overlay">
            <div className="StuProfile-popup-container">
                <div className="StuProfile-popup-header">Saved !</div>
                <div className="StuProfile-popup-body">
                    <svg className="StuProfile-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="StuProfile-success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
                        <path className="StuProfile-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <h2>Changes Saved ✓</h2>
                    <p>Your Details have been</p>
                    <p>Successfully saved in the Portal</p>
                </div>
                <div className="StuProfile-popup-footer">
                    <button onClick={onClose} className="StuProfile-popup-close-btn">Close</button>
                </div>
            </div>
        </div>
    );
};

const ImagePreviewModal = ({ src, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="StuProfile-image-preview-overlay" onClick={onClose}>
            <div className="StuProfile-image-preview-container" onClick={(e) => e.stopPropagation()}>
                <img src={src} alt="Profile Preview" className="StuProfile-image-preview-content" />
                <button onClick={onClose} className="StuProfile-image-preview-close-btn">&times;</button>
            </div>
        </div>
    );
};

function StuProfile({ onLogout, onViewChange }) { // Removed currentView
    const [studyCategory, setStudyCategory] = useState('12th');
    const [isPopupOpen, setPopupOpen] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [uploadInfo, setUploadInfo] = useState({ name: '', date: '' });
    const formRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isImagePreviewOpen, setImagePreviewOpen] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [dob, setDob] = useState(null);

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

    return (
        <div className="container">
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className="main">
                <Sidebar
                    isOpen={isSidebarOpen}
                    onLogout={onLogout}
                    currentView={'profile'} // Hardcode 'profile'
                    onViewChange={handleViewChange}
                />
                <div className="StuProfile-dashboard-area dashboard-area">
                    <form ref={formRef} onSubmit={handleSave}>
                        {/* --- PERSONAL INFO --- */}
                        <div className="StuProfile-profile-section-container">
                            <h3 className="StuProfile-section-header">Personal Information</h3>
                            <div className="StuProfile-form-grid">
                                <div className="StuProfile-personal-info-fields">
                                    <input type="text" placeholder="First Name" />
                                    <input type="text" placeholder="Last Name" />
                                    <input type="text" placeholder="Register Number" />
                                    <div className="StuProfile-datepicker-wrapper">
                                        <DatePicker selected={dob} onChange={(date) => setDob(date)} dateFormat="dd/MM/yyyy" placeholderText="DOB" className="StuProfile-datepicker-input" wrapperClassName="StuProfile-datepicker-wrapper-inner" showPopperArrow={false} />
                                    </div>
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
                                    <input type="text" placeholder="Father Mobile No." />
                                    <input type="text" placeholder="Mother Name" />
                                    <input type="text" placeholder="Mother Occupation" />
                                    <input type="text" placeholder="Mother Mobile No." />
                                </div>
                                <div className="StuProfile-profile-photo-wrapper">
                                    <div className="StuProfile-profile-photo-box" style={{ height: '675px' }}>
                                        <h3 className="StuProfile-section-header">Profile Photo</h3>
                                        <div className="StuProfile-profile-icon-container">
                                            {profileImage ? ( <img src={profileImage} alt="Profile Preview" className="StuProfile-profile-preview-img" onClick={() => setImagePreviewOpen(true)} /> ) : ( <GraduationCapIcon /> )}
                                        </div>
                                        {profileImage && uploadInfo.name && (
                                            <div className="StuProfile-upload-info-container">
                                                <div className="StuProfile-upload-info-item"><FileIcon /><span>{uploadInfo.name}</span></div>
                                                <div className="StuProfile-upload-info-item"><CalendarIcon /><span>Uploaded on: {uploadInfo.date}</span></div>
                                            </div>
                                        )}
                                        <div className="StuProfile-upload-action-area">
                                            <div className="StuProfile-upload-btn-wrapper">
                                                <label htmlFor="photo-upload-input" className="StuProfile-profile-upload-btn"><div className="StuProfile-upload-btn-content"><MdUpload /><span>Upload (Max 500 KB)</span></div></label>
                                                {profileImage && ( <button onClick={handleImageRemove} className="StuProfile-remove-image-btn" aria-label="Remove image"><IoMdClose /></button> )}
                                            </div>
                                            <input type="file" id="photo-upload-input" ref={fileInputRef} style={{ display: 'none' }} accept="image/jpeg" onChange={handleImageUpload} />
                                            {uploadSuccess && ( <p className="StuProfile-upload-success-message">Profile Photo uploaded Successfully!</p> )}
                                            <p className="StuProfile-upload-hint">*Only JPG format is allowed.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="StuProfile-form-grid" style={{ marginTop: '1.5rem' }}>
                                <select defaultValue=""><option value="" disabled>Community</option> <option value="OC">OC</option><option value="BC">BC</option><option value="BCM">BCM</option><option value="MBC">MBC</option><option value="SC">SC</option><option value="SCA">SCA</option><option value="ST">ST</option></select>
                                <input type="text" placeholder="Blood Group" />
                                <input type="text" placeholder="Aadhaar Number" />
                                <select defaultValue=""><option value="" disabled>Medium of study</option><option value="English">English</option><option value="Tamil">Tamil</option><option value="Other">Others</option></select>
                                <input type="text" placeholder="Garudian Name" className="mr-input"  />
                                <input type="text" placeholder="Garudian Mobile No" className="mr-input"  />
                            </div>
                        </div>

                        {/* --- ACADEMIC BACKGROUND --- */}
                        <div className="StuProfile-profile-section-container">
                           <h3 className="StuProfile-section-header">Academic Background</h3>
                            <div className="StuProfile-form-grid">
                                <div className="StuProfile-study-category" style={{ gridColumn: '1 / -1' }}>
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
                        <div className="StuProfile-profile-section-container">
                            <h3 className="StuProfile-section-header">Semester</h3>
                            <div className="StuProfile-form-grid">
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
                        <div className="StuProfile-profile-section-container">
                            <h3 className="StuProfile-section-header">Other Details</h3>
                            <div className="StuProfile-form-grid">
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
                        
                        <div className="StuProfile-action-buttons">
                            <button type="button" className="StuProfile-discard-btn" onClick={handleDiscard}>Discard</button>
                            <button type="submit" className="StuProfile-save-btn">Save</button>
                        </div>
                    </form>
                </div>
            </div>
            {isSidebarOpen && <div className="overlay" onClick={() => setIsSidebarOpen(false)}></div>}
            <SuccessPopup isOpen={isPopupOpen} onClose={closePopup} />
            <ImagePreviewModal src={profileImage} isOpen={isImagePreviewOpen} onClose={() => setImagePreviewOpen(false)} />
        </div>
    );
}

export default StuProfile;