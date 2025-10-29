import React, { useState } from 'react';
// Assuming these paths are correct for your existing files
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";

// Import CSS for this specific page
import './Profile.css'; // Uses the user's original CSS file name

// Placeholder image (check your path is correct: "./assets/Adminicon.png" and "./assets/Coordinatorcap.png")
import Adminicon from "../assets/Adminicon.png"; 
import GraduateCapIcon from "../assets/Coordinatorcap.png"; 
import ProfileGraduationcap from "../assets/ProfileGraduationcap.svg"

// Icons to match ManageStudentsProfile styles
const MdUpload = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path></svg>
);

const IoMdClose = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path></svg>
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
// CORRECT SVG component for the specific Upload icon (arrow pointing up from a base)
const UploadIconSVG = () => (
    <svg className="co-profile-upload-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* UPDATED PATH: This path represents a standard upload icon: an arrow pointing up and a wide, stable base line */}
        <path d="M11 16h2V9h4l-5-5-5 5h4v7zm-5 4h12v-2H6v2z" fill="currentColor"/>
    </svg>
);


function CoProfile({ onLogout, currentView, onViewChange }) {
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
        staffId: '',
        cabin: '',
    });

    // State for profile photo/certificate
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [photoDetails, setPhotoDetails] = useState({ fileName: null, uploadDate: null });
    const [uploadSuccess, setUploadSuccess] = useState(false);
    // State for the large image preview modal
    const [isModalOpen, setIsModalOpen] = useState(false); 
    // NEW: State for displaying save/discard status ('saved', 'discarded', or null)
    const [saveStatus, setSaveStatus] = useState(null); 

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        // Match ManageStudentsProfile behavior: allow only JPG
        if (file.type !== 'image/jpeg') {
            alert('Invalid file type. Please upload a JPG file.');
            return;
        }
        // Update photo preview
        setProfilePhoto(URL.createObjectURL(file));
        // Set details similar to ManageStudentsProfile
        setPhotoDetails({
            fileName: file.name,
            uploadDate: new Date().toLocaleDateString('en-GB'),
        });
        // Show success message briefly
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 5000);
    };

    // Function to open the modal when the photo is clicked
    const handleImageClick = () => {
        if (profilePhoto) {
            setIsModalOpen(true);
        }
    };
    
    // Function to close the modal
    const handleModalClose = () => {
        setIsModalOpen(false);
    };
    
    const handleRemovePhoto = (e) => {
        e.preventDefault();
        setProfilePhoto(null);
        setPhotoDetails({ fileName: null, uploadDate: null });
        setIsModalOpen(false);
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
        setUploadSuccess(false);
    };

    const handleDiscard = () => {
        // Reset form data 
        setFormData({
            firstName: '', lastName: '', dob: '', gender: '', emailId: '',
            domainMailId: '', phoneNumber: '', department: '', staffId: '', cabin: '',
        });
        setProfilePhoto(null);
        // NEW: Clear photo details
        setPhotoDetails({ fileName: null, uploadDate: null });
        setIsModalOpen(false); 
        // Set the status message instead of an alert
        setSaveStatus('discarded');
    };

    const handleSave = () => {
        // Handle saving the form data and profile photo/certificate
        console.log('Saving data:', formData);
        console.log('Profile Photo/Certificate:', profilePhoto);
        // Set the status message instead of an alert
        setSaveStatus('saved');
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

    // Use clickable/active styles when photo present
    const photoClassNames = `co-profile-photo-preview ${profilePhoto ? 'co-profile-photo-clickable co-profile-photo-active' : ''}`;

    return (
        <>
            <Navbar  onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
            <div className="co-profile-layout">
                <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView="profile" onViewChange={onViewChange} />
                <div className="co-profile-main-content">
                    {/* The single, large container card */}
                    <div className="co-profile-master-card">
                        
                        <div className="co-profile-content-grid">
                            
                            {/* Left Side: Forms */}
                            <div className="co-profile-form-area">
                                
                                {/* Personal Information Section */}
                                <section className="co-profile-section co-profile-personal-info">
                                    <h3 className="co-profile-section-header">Personal Information</h3>
                                    <div className="co-profile-input-grid">
                                        <input type="text" name="firstName" placeholder="First Name" className="co-profile-form-input" value={formData.firstName} onChange={handleInputChange} />
                                        <input type="text" name="lastName" placeholder="Last Name" className="co-profile-form-input" value={formData.lastName} onChange={handleInputChange} />
                                        
                                        <input type="date" name="dob" placeholder="dd-mm-yyyy" className="co-profile-form-input co-profile-form-input-date" value={formData.dob} onChange={handleInputChange} />
                                        <select name="gender" className="co-profile-form-input co-profile-form-select" value={formData.gender} onChange={handleInputChange}>
                                            <option value="" disabled hidden>Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        
                                        <input type="email" name="emailId" placeholder="Email id" className="co-profile-form-input" value={formData.emailId} onChange={handleInputChange} />
                                        <input type="email" name="domainMailId" placeholder="Domain Mail id" className="co-profile-form-input" value={formData.domainMailId} onChange={handleInputChange} />
                                        
                                        <input type="tel" name="phoneNumber" placeholder="Phone number" className="co-profile-form-input" value={formData.phoneNumber} onChange={handleInputChange} />
                                        <input type="text" name="department" placeholder="Department" className="co-profile-form-input" value={formData.department} onChange={handleInputChange} />
                                    </div>
                                </section>

                                {/* Office Details Section */}
                                <section className="co-profile-section co-profile-office-details">
                                    <div className='co-profile-section-header2'>
                                    <h3 className="co-profile-section-header">Office Details</h3>
                                    <div className="co-profile-input-grid co-profile-input-grid-two-col">
                                        <input type="text" name="staffId" placeholder="Staff ID" className="co-profile-form-input" value={formData.staffId} onChange={handleInputChange} />
                                        <input type="text" name="cabin" placeholder="Cabin" className="co-profile-form-input" value={formData.cabin} onChange={handleInputChange} />
                                    </div>
                                    </div>
                                </section>
                            </div>
                            
                            {/* Right Side: Profile Photo/Certificate Card */}
                            <aside className="co-profile-photo-card">
                            
                                <h3 className="co-profile-section-header co-profile-photo-header">Profile Photo</h3>
                                <div className='co-profile-photo-header-line'>
                                <div className="co-profile-photo-icon-container">
                                    {profilePhoto ? (
                                        <img
                                            src={profilePhoto}
                                            alt="Profile Preview"
                                            className={photoClassNames}
                                            onClick={handleImageClick}
                                        />
                                    ) : (
                                        <img src={ProfileGraduationcap} alt="Graduation Cap" style={{ width: '100px', height: '90px', marginTop:'100px'}}/>
                                    )}
                                </div>
                                </div>
                                {photoDetails.fileName && (
                                    <div className="co-profile-upload-info-container">
                                        <div className="co-profile-upload-info-item"><FileIcon /><span>{photoDetails.fileName}</span></div>
                                        <div className="co-profile-upload-info-item"><CalendarIcon /><span>Uploaded on: {photoDetails.uploadDate}</span></div>
                                    </div>
                                )}
                                <div className="co-profile-upload-action-area">
                                    <div className="co-profile-upload-btn-wrapper">
                                        <label htmlFor="file-upload" className="co-profile-profile-upload-btn">
                                            <div className="co-profile-upload-btn-content"><MdUpload /><span>Upload (Max 500 KB)</span></div>
                                        </label>
                                        {profilePhoto && (
                                            <button onClick={handleRemovePhoto} className="co-profile-remove-image-btn" aria-label="Remove image"><IoMdClose /></button>
                                        )}
                                    </div>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept="image/jpeg"
                                        className="co-profile-hidden-input"
                                        onChange={handlePhotoUpload}
                                    />
                                    {uploadSuccess && (
                                        <p className="co-profile-upload-success-message">Profile Photo uploaded Successfully!</p>
                                    )}
                                    <p className="co-profile-upload-hint">*Only JPG format is allowed.</p>
                                </div>
                                

                                {saveStatus && (
                                    <p className={`co-profile-status-message ${saveStatus === 'saved' ? 'co-profile-status-success' : 'co-profile-status-error'}`}>
                                        {saveStatus === 'saved' ? 'Successfully Saved' : 'Not Saved'}
                                    </p>
                                )}
                            </aside>

                        </div>

                        {/* Action Buttons (at the bottom right of the master card) */}
                        <div className="co-profile-action-buttons">
                            <button type="button" className="co-profile-discard-btn" onClick={handleDiscard}>
                                Discard
                            </button>
                            <button type="button" className="co-profile-save-btn" onClick={handleSave}>
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Preview Modal */}
            {isModalOpen && profilePhoto && (
                <div className="co-modal-overlay" onClick={handleModalClose}>
                    <div className="co-modal-content" onClick={e => e.stopPropagation()}>
                        <span className="co-modal-close" onClick={handleModalClose}>&times;</span>
                        <img src={profilePhoto} alt="Full Profile Preview" className="co-modal-image"  />
                    </div>
                </div>
            )}
        </>
    );
}

export default CoProfile;