import React, { useState } from 'react';
// Assuming these paths are correct for your existing files
import AdNavbar from "../components/Navbar/Adnavbar.js";
import AdSidebar from "../components/Sidebar/Adsidebar.js";

// FIXED: Import CSS as a Module
import styles from './AdminmainProfile.module.css';

// Placeholder image
import Adminicon from "../assets/Adminicon.png"; 
import ProfileGraduationcap from "../assets/AdminProfileGraduationcap.svg"

// Icons (Classes updated to modular format where needed)
const MdUpload = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path></svg>
);

const IoMdClose = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path></svg>
);

// Key Icon for Change Login Details button
const KeyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', marginRight: '10px' }}>
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
    </svg>
);

function Admainprofile() {
    // State to manage form data
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        gender: '',
        emailId: '',
        domainMailId: '',
        phoneNumber: '',
        department: '',
    });

    // State for login details (no toggle - always visible)
    const [loginData, setLoginData] = useState({
        currentLoginId: '',
        newLoginId: '',
        confirmLoginId: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // State for profile photo
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); 
    const [saveStatus, setSaveStatus] = useState(null); 
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLoginInputChange = (e) => {
        const { name, value } = e.target;
        setLoginData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (file.type !== 'image/jpeg') {
            alert('Invalid file type. Please upload a JPG file.');
            return;
        }
        setProfilePhoto(URL.createObjectURL(file));
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 5000);
    };

    const handleImageClick = () => {
        if (profilePhoto) {
            setIsModalOpen(true);
        }
    };
    
    const handleModalClose = () => {
        setIsModalOpen(false);
    };
    
    const handleRemovePhoto = (e) => {
        e.preventDefault();
        setProfilePhoto(null);
        setIsModalOpen(false);
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
        setUploadSuccess(false);
    };

    const handleDiscard = () => {
        setFormData({
            firstName: '', lastName: '', dob: '', gender: '', emailId: '',
            domainMailId: '', phoneNumber: '', department: '',
        });
        setLoginData({
            currentLoginId: '', newLoginId: '', confirmLoginId: '',
            currentPassword: '', newPassword: '', confirmPassword: '',
        });
        setProfilePhoto(null);
        setIsModalOpen(false); 
        setSaveStatus('discarded');
    };

    const handleSave = () => {
        console.log('Saving data:', formData);
        console.log('Login data:', loginData);
        console.log('Profile Photo:', profilePhoto);
        setSaveStatus('saved');
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    // UPDATED CLASS: Admin-main-profile-photo-preview, Admin-main-profile-photo-clickable, Admin-main-profile-photo-active
    const photoClassNames = `${styles['Admin-main-profile-photo-preview']} ${profilePhoto ? styles['Admin-main-profile-photo-clickable'] : ''} ${profilePhoto ? styles['Admin-main-profile-photo-active'] : ''}`;

    return (
        <>
            <AdNavbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
            {/* UPDATED CLASS: Admin-main-profile-layout */}
            <div className={styles['Admin-main-profile-layout']}>
                <AdSidebar isOpen={isSidebarOpen} onLogout={() => console.log('Logout Clicked')} />
                {/* UPDATED CLASS: Admin-main-profile-main-content */}
                <div className={styles['Admin-main-profile-main-content']}>
                    {/* UPDATED CLASS: Admin-main-profile-master-card */}
                    <div className={styles['Admin-main-profile-master-card']}>
                        
                        {/* UPDATED CLASS: Admin-main-profile-content-grid */}
                        <div className={styles['Admin-main-profile-content-grid']}>
                            
                            {/* Left Side: Forms */}
                            {/* UPDATED CLASS: Admin-main-profile-form-area */}
                            <div className={styles['Admin-main-profile-form-area']}>
                                
                                {/* Personal Information Section */}
                                {/* UPDATED CLASS: Admin-main-profile-section, Admin-main-profile-section-header, Admin-main-profile-input-grid */}
                                <section className={styles['Admin-main-profile-section']}>
                                    <h3 className={styles['Admin-main-profile-section-header']}>Personal Information</h3>
                                    <div className={styles['Admin-main-profile-input-grid']}>
                                        {/* UPDATED CLASSES for form inputs */}
                                        <input type="text" name="firstName" placeholder="First Name" className={styles['Admin-main-profile-form-input']} value={formData.firstName} onChange={handleInputChange} />
                                        <input type="text" name="lastName" placeholder="Last Name" className={styles['Admin-main-profile-form-input']} value={formData.lastName} onChange={handleInputChange} />
                                        
                                        <input type="date" name="dob" placeholder="dd-mm-yyyy" className={`${styles['Admin-main-profile-form-input']} ${styles['Admin-main-profile-form-input-date']}`} value={formData.dob} onChange={handleInputChange} />
                                        <select name="gender" className={`${styles['Admin-main-profile-form-input']} ${styles['Admin-main-profile-form-select']}`} value={formData.gender} onChange={handleInputChange}>
                                            <option value="" disabled hidden>Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        
                                        <input type="email" name="emailId" placeholder="Email id" className={styles['Admin-main-profile-form-input']} value={formData.emailId} onChange={handleInputChange} />
                                        <input type="email" name="domainMailId" placeholder="Domain Mail id" className={styles['Admin-main-profile-form-input']} value={formData.domainMailId} onChange={handleInputChange} />
                                        
                                        <input type="tel" name="phoneNumber" placeholder="Phone number" className={styles['Admin-main-profile-form-input']} value={formData.phoneNumber} onChange={handleInputChange} />
                                        <input type="text" name="department" placeholder="Department" className={styles['Admin-main-profile-form-input']} value={formData.department} onChange={handleInputChange} />
                                    </div>
                                </section>

                                {/* Change Login Details Button - No action */}
                                {/* UPDATED CLASS: Admin-main-profile-change-login-btn */}
                                <div className={styles['Admin-main-profile-change-login-btn']}>
                                    <KeyIcon />
                                    <span>Change Login Details</span>
                                </div>
                            </div>
                            
                            {/* Right Side: Profile Photo Card - Simplified */}
                            {/* UPDATED CLASS: Admin-main-profile-photo-card, Admin-main-profile-photo-header */}
                            <aside className={styles['Admin-main-profile-photo-card']}>
                                <h3 className={`${styles['Admin-main-profile-section-header']} ${styles['Admin-main-profile-photo-header']}`}>Profile Photo</h3>
                                
                                {/* UPDATED CLASSES for photo elements */}
                                <div className={styles['Admin-main-profile-photo-icon-container']}>
                                    {profilePhoto ? (
                                        <img
                                            src={profilePhoto}
                                            alt="Profile Preview"
                                            className={photoClassNames}
                                            onClick={handleImageClick}
                                        />
                                    ) : (
                                        <img src={ProfileGraduationcap} alt="Graduation Cap" style={{ width: '80px', height: '80px' }}/>
                                    )}
                                </div>
                                
                                <div className={styles['Admin-main-profile-upload-action-area']}>
                                    <div className={styles['Admin-main-profile-upload-btn-wrapper']}>
                                        <label htmlFor="file-upload" className={styles['Admin-main-profile-profile-upload-btn']}>
                                            <div className={styles['Admin-main-profile-upload-btn-content']}>
                                                <MdUpload />
                                                <span>Upload (Max 500 KB)</span>
                                            </div>
                                        </label>
                                        {profilePhoto && (
                                            <button onClick={handleRemovePhoto} className={styles['Admin-main-profile-remove-image-btn']} aria-label="Remove image">
                                                <IoMdClose />
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept="image/jpeg"
                                        className={styles['Admin-main-profile-hidden-input']}
                                        onChange={handlePhotoUpload}
                                    />
                                    {uploadSuccess && (
                                        <p className={styles['Admin-main-profile-upload-success-message']}>Profile Photo uploaded Successfully!</p>
                                    )}
                                    <p className={styles['Admin-main-profile-upload-hint']}>*Only JPG format is allowed.</p>
                                </div>

                                {saveStatus && (
                                    // UPDATED CLASSES
                                    <p className={`${styles['Admin-main-profile-status-message']} ${saveStatus === 'saved' ? styles['Admin-main-profile-status-success'] : styles['Admin-main-profile-status-error']}`}>
                                        {saveStatus === 'saved' ? 'Successfully Saved' : 'Not Saved'}
                                    </p>
                                )}
                            </aside>

                        </div>

                        {/* Change Login Details Section - Full width below the grid */}
                        {/* UPDATED CLASSES: Admin-main-profile-section, Admin-main-profile-login-details, Admin-main-profile-section-header, Admin-main-profile-input-grid-three-col, Admin-main-profile-form-input-login */}
                        <section className={`${styles['Admin-main-profile-section']} ${styles['Admin-main-profile-login-details']}`}>
                            <h3 className={styles['Admin-main-profile-section-header']}>Change Login Details</h3>
                            <div className={styles['Admin-main-profile-input-grid-three-col']}>
                                <input type="text" name="currentLoginId" placeholder="Current Login ID" className={styles['Admin-main-profile-form-input-login']} value={loginData.currentLoginId} onChange={handleLoginInputChange} />
                                <input type="text" name="newLoginId" placeholder="New Login ID" className={styles['Admin-main-profile-form-input-login']} value={loginData.newLoginId} onChange={handleLoginInputChange} />
                                <input type="text" name="confirmLoginId" placeholder="Confirm Login ID" className={styles['Admin-main-profile-form-input-login']} value={loginData.confirmLoginId} onChange={handleLoginInputChange} />
                            </div>
                            <div className={styles['Admin-main-profile-input-grid-three-col']}>
                                <input type="password" name="currentPassword" placeholder="Current Password" className={styles['Admin-main-profile-form-input-login']} value={loginData.currentPassword} onChange={handleLoginInputChange} />
                                <input type="password" name="newPassword" placeholder="New Password" className={styles['Admin-main-profile-form-input-login']} value={loginData.newPassword} onChange={handleLoginInputChange} />
                                <input type="password" name="confirmPassword" placeholder="Confirm Password" className={styles['Admin-main-profile-form-input-login']} value={loginData.confirmPassword} onChange={handleLoginInputChange} />
                            </div>
                        </section>

                        {/* Action Buttons */}
                        {/* UPDATED CLASSES: Admin-main-profile-action-buttons, Admin-main-profile-discard-btn, Admin-main-profile-save-btn */}
                        <div className={styles['Admin-main-profile-action-buttons']}>
                            <button type="button" className={styles['Admin-main-profile-discard-btn']} onClick={handleDiscard}>
                                Discard
                            </button>
                            <button type="button" className={styles['Admin-main-profile-save-btn']} onClick={handleSave}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Preview Modal */}
            {isModalOpen && profilePhoto && (
                // UPDATED CLASSES: co-modal-overlay, co-modal-content, co-modal-close, co-modal-image
                <div className={styles['co-modal-overlay']} onClick={handleModalClose}>
                    <div className={styles['co-modal-content']} onClick={e => e.stopPropagation()}>
                        <span className={styles['co-modal-close']} onClick={handleModalClose}>&times;</span>
                        <img src={profilePhoto} alt="Full Profile Preview" className={styles['co-modal-image']} />
                    </div>
                </div>
            )}
        </>
    );
}

export default Admainprofile;