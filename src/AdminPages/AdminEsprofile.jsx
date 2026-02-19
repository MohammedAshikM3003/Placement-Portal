import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import useAdminAuth from '../utils/useAdminAuth';

import AdNavbar from '../components/Navbar/Adnavbar';
import AdSidebar from '../components/Sidebar/Adsidebar';
// FIXED: Import CSS as a Module
import styles from './AdminEsprofile.module.css';
import Adminicons from '../assets/AdmingreenCapicon.svg';

// Helper Components
const MdUpload = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path>
    </svg>
);

const IoMdClose = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path>
    </svg>
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
        // UPDATED CLASSES
        <div className={styles['Admin-ES-StuProfile-popup-overlay']} onClick={onClose}>
            <div className={styles['Admin-ES-StuProfile-popup-container']}>
                <div className={styles['Admin-ES-StuProfile-popup-header']}>Saved !</div>
                <div className={styles['Admin-ES-StuProfile-popup-body']}>
                    <svg className={styles['Admin-ES-StuProfile-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className={styles['Admin-ES-StuProfile-success-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
                        <path className={styles['Admin-ES-StuProfile-success-icon--check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <h2>Changes Saved ✓</h2>
                    <p>Your Details have been</p>
                    <p>Successfully saved in the Portal</p>
                </div>
                <div className={styles['Admin-ES-StuProfile-popup-footer']}>
                    <button onClick={onClose} className={styles['Admin-ES-StuProfile-popup-close-btn']}>Close</button>
                </div>
            </div>
        </div>
    );
};

const ImagePreviewModal = ({ src, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        // UPDATED CLASSES
        <div className={styles['Admin-ES-StuProfile-image-preview-overlay']} onClick={onClose}>
            <div className={styles['Admin-ES-StuProfile-image-preview-container']} onClick={(e) => e.stopPropagation()}>
                <img src={src} alt="Profile Preview" className={styles['Admin-ES-StuProfile-image-preview-content']} />
                <button onClick={onClose} className={styles['Admin-ES-StuProfile-image-preview-close-btn']}>&times;</button>
            </div>
        </div>
    );
};

function AdminEsprofile() {
    useAdminAuth(); // JWT authentication verification
    const { studentId } = useParams();
    const navigate = useNavigate();
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

    useEffect(() => {
        // Load student data based on studentId if needed
        console.log('Loading profile for student:', studentId);
    }, [studentId]);

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    // Listen for sidebar close event from navigation links
    useEffect(() => {
        const handleCloseSidebar = () => {
            setIsSidebarOpen(false);
        };
        window.addEventListener('closeSidebar', handleCloseSidebar);
        return () => {
            window.removeEventListener('closeSidebar', handleCloseSidebar);
        };
    }, []);

    return (
        // UPDATED CLASS: Admin-ES-StuProfile-container
        <div className={styles['Admin-ES-StuProfile-container']}>
            <AdNavbar onToggleSidebar={toggleSidebar} />
            {/* UPDATED CLASS: Admin-ES-StuProfile-main */}
            <div className={styles['Admin-ES-StuProfile-main']}>
                <AdSidebar
                    // sidebar.active class needs to be toggled on the sidebar component itself for mobile view
                    isOpen={isSidebarOpen}
                    onLogout={() => console.log('Logout')}
                />
                {/* UPDATED CLASS: Admin-ES-StuProfile-dashboard-area */}
                <div className={styles['Admin-ES-StuProfile-dashboard-area']}>
                    <form ref={formRef} onSubmit={handleSave}>
                        {/* PERSONAL INFO */}
                        {/* UPDATED CLASS: Admin-ES-StuProfile-profile-section-container */}
                        <div className={styles['Admin-ES-StuProfile-profile-section-container']}>
                            {/* UPDATED CLASS: Admin-ES-StuProfile-header-with-back, Admin-ES-StuProfile-section-header, Admin-ES-StuProfile-back-btn */}
                            <div className={styles['Admin-ES-StuProfile-header-with-back']}>
                                <h3 className={styles['Admin-ES-StuProfile-section-header']}>Personal Information</h3>
                                <button 
                                    type="button" 
                                    className={styles['Admin-ES-StuProfile-back-btn']}
                                    onClick={() => navigate('/')}
                                >
                                    ← Back
                                </button>
                            </div>
                            {/* UPDATED CLASS: Admin-ES-StuProfile-form-grid */}
                            <div className={styles['Admin-ES-StuProfile-form-grid']}>
                                {/* UPDATED CLASS: Admin-ES-StuProfile-personal-info-fields */}
                                <div className={styles['Admin-ES-StuProfile-personal-info-fields']}>
                                    {/* UPDATED CLASSES for all inputs/selects */}
                                    <input type="text" placeholder="First Name" className={styles['Admin-ES-StuProfile-form-grid']} />
                                    <input type="text" placeholder="Last Name" className={styles['Admin-ES-StuProfile-form-grid']} />
                                    <input type="text" placeholder="Register Number" className={styles['Admin-ES-StuProfile-form-grid']} />
                                    {/* UPDATED CLASSES: Admin-ES-StuProfile-datepicker-wrapper, Admin-ES-StuProfile-datepicker-input */}
                                    <div className={styles['Admin-ES-StuProfile-datepicker-wrapper']}>
                                        <DatePicker 
                                            selected={dob} 
                                            onChange={(date) => setDob(date)} 
                                            dateFormat="dd/MM/yyyy" 
                                            placeholderText="DOB" 
                                            className={styles['Admin-ES-StuProfile-datepicker-input']} 
                                            showPopperArrow={false} 
                                        />
                                    </div>
                                    <select defaultValue="" className={styles['Admin-ES-StuProfile-form-grid']}>
                                        <option value="" disabled>Degree</option>
                                        <option value="B.E">B.E</option>
                                        <option value="B.Tech">B.Tech</option>
                                    </select>
                                    <input type="text" placeholder="Branch" className={styles['Admin-ES-StuProfile-form-grid']} />
                                    <select defaultValue="" className={styles['Admin-ES-StuProfile-form-grid']}>
                                        <option value="" disabled>Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                    <input type="text" placeholder="Address" className={styles['Admin-ES-StuProfile-form-grid']} />
                                    <input type="text" placeholder="City" className={styles['Admin-ES-StuProfile-form-grid']} />
                                    <input type="email" placeholder="Primary Mail id" className={styles['Admin-ES-StuProfile-form-grid']} />
                                    <input type="email" placeholder="Domain Mail id" className={styles['Admin-ES-StuProfile-form-grid']} />
                                    <input type="tel" placeholder="Mobile No." className={styles['Admin-ES-StuProfile-form-grid']} />
                                    <input type="text" placeholder="Father Name" className={styles['Admin-ES-StuProfile-form-grid']} />
                                    <input type="text" placeholder="Father Occupation" className={styles['Admin-ES-StuProfile-form-grid']} />
                                    <input type="text" placeholder="Father Mobile No." className={styles['Admin-ES-StuProfile-form-grid']} />
                                    <input type="text" placeholder="Mother Name" className={styles['Admin-ES-StuProfile-form-grid']} />
                                    <input type="text" placeholder="Mother Occupation" className={styles['Admin-ES-StuProfile-form-grid']} />
                                    <input type="text" placeholder="Mother Mobile No." className={styles['Admin-ES-StuProfile-form-grid']} />
                                </div>
                                {/* UPDATED CLASS: Admin-ES-StuProfile-profile-photo-wrapper */}
                                <div className={styles['Admin-ES-StuProfile-profile-photo-wrapper']}>
                                    {/* UPDATED CLASSES: Admin-ES-StuProfile-profile-photo-box, Admin-ES-StuProfile-section-header, Admin-ES-StuProfile-profile-icon-container, Admin-ES-StuProfile-profile-preview-img, Admin-ES-StuProfile-upload-info-container, Admin-ES-StuProfile-upload-info-item, Admin-ES-StuProfile-upload-action-area, Admin-ES-StuProfile-upload-btn-wrapper, Admin-ES-StuProfile-profile-upload-btn, Admin-ES-StuProfile-upload-btn-content, Admin-ES-StuProfile-remove-image-btn, Admin-ES-StuProfile-upload-success-message, Admin-ES-StuProfile-upload-hint */}
                                    <div className={styles['Admin-ES-StuProfile-profile-photo-box']} style={{ height: '675px' }}>
                                        <h3 className={styles['Admin-ES-StuProfile-section-header']}>Profile Photo</h3>
                                        <div className={styles['Admin-ES-StuProfile-profile-icon-container']}>
                                            {profileImage ? (
                                                <img 
                                                    src={profileImage} 
                                                    alt="Profile Preview" 
                                                    className={styles['Admin-ES-StuProfile-profile-preview-img']} 
                                                    onClick={() => setImagePreviewOpen(true)} 
                                                />
                                            ) : (
                                                <GraduationCapIcon />
                                            )}
                                        </div>
                                        {profileImage && uploadInfo.name && (
                                            <div className={styles['Admin-ES-StuProfile-upload-info-container']}>
                                                <div className={styles['Admin-ES-StuProfile-upload-info-item']}>
                                                    <FileIcon />
                                                    <span>{uploadInfo.name}</span>
                                                </div>
                                                <div className={styles['Admin-ES-StuProfile-upload-info-item']}>
                                                    <CalendarIcon />
                                                    <span>Uploaded on: {uploadInfo.date}</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className={styles['Admin-ES-StuProfile-upload-action-area']}>
                                            <div className={styles['Admin-ES-StuProfile-upload-btn-wrapper']}>
                                                <label htmlFor="photo-upload-input" className={styles['Admin-ES-StuProfile-profile-upload-btn']}>
                                                    <div className={styles['Admin-ES-StuProfile-upload-btn-content']}>
                                                        <MdUpload />
                                                        <span>Upload (Max 500 KB)</span>
                                                    </div>
                                                </label>
                                                {profileImage && (
                                                    <button 
                                                        onClick={handleImageRemove} 
                                                        className={styles['Admin-ES-StuProfile-remove-image-btn']} 
                                                        aria-label="Remove image"
                                                    >
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
                                                <p className={styles['Admin-ES-StuProfile-upload-success-message']}>
                                                    Profile Photo uploaded Successfully!
                                                </p>
                                            )}
                                            <p className={styles['Admin-ES-StuProfile-upload-hint']}>*Only JPG format is allowed.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* UPDATED CLASS: Admin-ES-StuProfile-form-grid */}
                            <div className={styles['Admin-ES-StuProfile-form-grid']} style={{ marginTop: '1.5rem' }}>
                                <select defaultValue="" className={styles['Admin-ES-StuProfile-form-grid']}>
                                    <option value="" disabled>Community</option>
                                    <option value="OC">OC</option>
                                    <option value="BC">BC</option>
                                    <option value="BCM">BCM</option>
                                    <option value="MBC">MBC</option>
                                    <option value="SC">SC</option>
                                    <option value="SCA">SCA</option>
                                    <option value="ST">ST</option>
                                </select>
                                <input type="text" placeholder="Blood Group" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="text" placeholder="Aadhaar Number" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <select defaultValue="" className={styles['Admin-ES-StuProfile-form-grid']}>
                                    <option value="" disabled>Medium of study</option>
                                    <option value="English">English</option>
                                    <option value="Tamil">Tamil</option>
                                    <option value="Other">Others</option>
                                </select>
                                <input type="text" placeholder="Guardian Name" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="text" placeholder="Guardian Mobile No" className={styles['Admin-ES-StuProfile-form-grid']} />
                            </div>
                        </div>

                        {/* ACADEMIC BACKGROUND */}
                        {/* UPDATED CLASS: Admin-ES-StuProfile-profile-section-container */}
                        <div className={styles['Admin-ES-StuProfile-profile-section-container']}>
                            <h3 className={styles['Admin-ES-StuProfile-section-header']}>Academic Background</h3>
                            {/* UPDATED CLASS: Admin-ES-StuProfile-form-grid */}
                            <div className={styles['Admin-ES-StuProfile-form-grid']}>
                                {/* UPDATED CLASS: Admin-ES-StuProfile-study-category */}
                                <div className={styles['Admin-ES-StuProfile-study-category']} style={{ gridColumn: '1 / -1' }}>
                                    <input 
                                        type="radio" 
                                        id="12th" 
                                        name="study_category" 
                                        value="12th" 
                                        checked={studyCategory === '12th'} 
                                        onChange={(e) => setStudyCategory(e.target.value)} 
                                    />
                                    <label htmlFor="12th">12th</label>
                                    <input 
                                        type="radio" 
                                        id="diploma" 
                                        name="study_category" 
                                        value="diploma" 
                                        checked={studyCategory === 'diploma'} 
                                        onChange={(e) => setStudyCategory(e.target.value)} 
                                    />
                                    <label htmlFor="diploma">Diploma</label>
                                    <input 
                                        type="radio" 
                                        id="both" 
                                        name="study_category" 
                                        value="both" 
                                        checked={studyCategory === 'both'} 
                                        onChange={(e) => setStudyCategory(e.target.value)} 
                                    />
                                    <label htmlFor="both">Both</label>
                                </div>
                                <input type="text" placeholder="10th Institution Name" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <select defaultValue="" className={styles['Admin-ES-StuProfile-form-grid']}>
                                    <option value="" disabled>10th Board/University</option>
                                    <option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option>
                                    <option value="CBSE">CBSE</option>
                                    <option value="ICSE">ICSE</option>
                                    <option value="Other State Board">Other State Board</option>
                                </select>
                                <input type="text" placeholder="10th Percentage" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="text" placeholder="10th Year of Passing" className={styles['Admin-ES-StuProfile-form-grid']} />
                                {(studyCategory === '12th' || studyCategory === 'both') && (
                                    <>
                                        <input type="text" placeholder="12th Institution Name" className={styles['Admin-ES-StuProfile-form-grid']} />
                                        <select defaultValue="" className={styles['Admin-ES-StuProfile-form-grid']}>
                                            <option value="" disabled>12th Board/University</option>
                                            <option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option>
                                            <option value="CBSE">CBSE</option>
                                            <option value="ICSE">ICSE</option>
                                            <option value="Other State Board">Other State Board</option>
                                        </select>
                                        <input type="text" placeholder="12th Percentage" className={styles['Admin-ES-StuProfile-form-grid']} />
                                        <input type="text" placeholder="12th Year of Passing" className={styles['Admin-ES-StuProfile-form-grid']} />
                                        <input type="text" placeholder="12th Cut-off Marks" className={styles['Admin-ES-StuProfile-form-grid']} />
                                    </>
                                )}
                                {(studyCategory === 'diploma' || studyCategory === 'both') && (
                                    <>
                                        <input type="text" placeholder="Diploma Institution" className={styles['Admin-ES-StuProfile-form-grid']} />
                                        <input type="text" placeholder="Diploma Branch" className={styles['Admin-ES-StuProfile-form-grid']} />
                                        <input type="text" placeholder="Diploma Percentage" className={styles['Admin-ES-StuProfile-form-grid']} />
                                        <input type="text" placeholder="Diploma Year of Passing" className={styles['Admin-ES-StuProfile-form-grid']} />
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {/* SEMESTER */}
                        {/* UPDATED CLASS: Admin-ES-StuProfile-profile-section-container */}
                        <div className={styles['Admin-ES-StuProfile-profile-section-container']}>
                            <h3 className={styles['Admin-ES-StuProfile-section-header']}>Semester</h3>
                            {/* UPDATED CLASS: Admin-ES-StuProfile-form-grid */}
                            <div className={styles['Admin-ES-StuProfile-form-grid']}>
                                <input type="text" placeholder="Semester 1 GPA" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="text" placeholder="Semester 2 GPA" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="text" placeholder="Semester 3 GPA" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="text" placeholder="Semester 4 GPA" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="text" placeholder="Semester 5 GPA" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="text" placeholder="Semester 6 GPA" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="text" placeholder="Semester 7 GPA" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="text" placeholder="Semester 8 GPA" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="text" placeholder="Overall CGPA" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="number" placeholder="No. of Backlogs (Cleared)" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="number" placeholder="No. of Current Backlogs" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="number" placeholder="Year of Gap" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="text" placeholder="Reason for year of Gap" className={styles['Admin-ES-StuProfile-form-grid']} style={{ gridColumn: '1 / -1' }} />
                            </div>
                        </div>

                        {/* OTHER DETAILS */}
                        {/* UPDATED CLASS: Admin-ES-StuProfile-profile-section-container */}
                        <div className={styles['Admin-ES-StuProfile-profile-section-container']}>
                            <h3 className={styles['Admin-ES-StuProfile-section-header']}>Other Details</h3>
                            {/* UPDATED CLASS: Admin-ES-StuProfile-form-grid */}
                            <div className={styles['Admin-ES-StuProfile-form-grid']}>
                                <select defaultValue="" className={styles['Admin-ES-StuProfile-form-grid']}>
                                    <option value="" disabled>Residential status</option>
                                    <option value="Hosteller">Hosteller</option>
                                    <option value="Dayscholar">Dayscholar</option>
                                </select>
                                <select defaultValue="" className={styles['Admin-ES-StuProfile-form-grid']}>
                                    <option value="" disabled>Quota</option>
                                    <option value="Management">Management</option>
                                    <option value="Counselling">Counselling</option>
                                </select>
                                <input type="text" placeholder="Languages Known" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <select defaultValue="" className={styles['Admin-ES-StuProfile-form-grid']}>
                                    <option value="" disabled>First Graduate</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                                <input type="text" placeholder="Passport No." className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="text" placeholder="Skill set" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="text" placeholder="Value Added Courses" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="text" placeholder="About sibling" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="text" placeholder="Ration card No." className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="text" placeholder="Family Annual Income" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="text" placeholder="PAN No." className={styles['Admin-ES-StuProfile-form-grid']} />
                                <select defaultValue="" className={styles['Admin-ES-StuProfile-form-grid']}>
                                    <option value="" disabled>Willing to Sign Bond</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                                <select defaultValue="" className={styles['Admin-ES-StuProfile-form-grid']}>
                                    <option value="" disabled>Preferred Mode of Drive</option>
                                    <option value="Online">Online</option>
                                    <option value="Offline">Offline</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                                <input type="text" placeholder="GitHub Link" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <input type="text" placeholder="LinkedIn Profile Link" className={styles['Admin-ES-StuProfile-form-grid']} />
                                <select defaultValue="" className={styles['Admin-ES-StuProfile-form-grid']}>
                                    <option value="" disabled>Types of companies</option>
                                    <option value="IT">IT</option>
                                    <option value="Non-IT">Non-IT</option>
                                    <option value="MNC">MNC</option>
                                    <option value="Startup">Startup</option>
                                    <option value="Government/Public Sector">Government/Public Sector</option>
                                    <option value="Non-Profit">Non-Profit</option>
                                    <option value="Other">Other</option>
                                </select>
                                <select defaultValue="" className={styles['Admin-ES-StuProfile-form-grid']}>
                                    <option value="" disabled>Preferred job location</option>
                                    <option value="Tamil Nadu">Tamil Nadu</option>
                                    <option value="Bengaluru">Bengaluru</option>
                                    <option value="Hyderabad">Hyderabad</option>
                                    <option value="North India">North India</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* UPDATED CLASS: Admin-ES-StuProfile-action-buttons, Admin-ES-StuProfile-block-btn, Admin-ES-StuProfile-edit-btn, Admin-ES-StuProfile-discard-btn, Admin-ES-StuProfile-save-btn */}
                        <div className={styles['Admin-ES-StuProfile-action-buttons']}>
                            <button type="button" className={styles['Admin-ES-StuProfile-block-btn']}>Block</button>
                            <button type="button" className={styles['Admin-ES-StuProfile-edit-btn']}>Edit</button>
                            <button type="button" className={styles['Admin-ES-StuProfile-discard-btn']} onClick={handleDiscard}>Discard</button>
                            <button type="submit" className={styles['Admin-ES-StuProfile-save-btn']}>Save</button>
                        </div>
                    </form>
                </div>
            </div>
            {/* UPDATED CLASS: Admin-ES-StuProfile-overlay */}
            {isSidebarOpen && <div className={styles['Admin-ES-StuProfile-overlay']} onClick={() => setIsSidebarOpen(false)}></div>}
            <SuccessPopup isOpen={isPopupOpen} onClose={closePopup} />
            <ImagePreviewModal src={profileImage} isOpen={isImagePreviewOpen} onClose={() => setImagePreviewOpen(false)} />
        </div>
    );
}

export default AdminEsprofile;