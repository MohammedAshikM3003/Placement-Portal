import React, { useState, useRef, useEffect } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate, useParams } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';

import styles from './AdminABviewcoo.module.css'; 
import AdNavbar from "../components/Navbar/Adnavbar.js";
import AdSidebar from "../components/Sidebar/Adsidebar.js";
import Adminicon from "../assets/Adminicon.png"; 
import ProfileGraduationcap from "../assets/VectorGC.svg";
import mongoDBService from '../services/mongoDBService';

// --- Icons ---
const FileIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', marginRight: '8px', color: '#555', flexShrink: 0 }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>
    </svg>
);
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', marginRight: '8px', color: '#555', flexShrink: 0 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);
const DropdownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 292.4 292.4" className={styles['Admin-cood-view-dropdown-icon']}>
        <path fill="#999" d="M287 69.4a17.6 17.6 0 0 0-13-5.4H18.4c-4.9 0-9.2 1.8-12.9 5.4-3.7 3.6-5.5 8-5.5 13s1.8 9.4 5.5 13l128.8 128.8c3.7 3.7 8 5.5 13 5.5s9.4-1.8 13-5.5l128.8-128.8c3.7-3.6 5.4-8 5.4-13s-1.7-9.4-5.4-13z"/>
    </svg>
);

function AdminABcoodet() {
    useAdminAuth(); // JWT authentication verification
    const navigate = useNavigate();
    const { coordinatorId } = useParams();

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', dob: null, gender: '', emailId: '',
        domainMailId: '', phoneNumber: '', department: '', staffId: '', cabin: '',
        username: '', password: '', confirmPassword: '',
    });

    const [profilePhoto, setProfilePhoto] = useState(null);
    const [photoDetails, setPhotoDetails] = useState({ fileName: null, uploadDate: null });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

    const genderSelectRef = useRef(null);

    useEffect(() => {
        const fetchCoordinatorDetail = async () => {
            if (!coordinatorId) return;
            try {
                const response = await mongoDBService.getCoordinatorById(coordinatorId);
                const coordinator = response?.coordinator;
                if (coordinator) {
                    const dobValue = coordinator.dob ? new Date(coordinator.dob) : null;
                    setFormData({
                        firstName: coordinator.firstName || '',
                        lastName: coordinator.lastName || '',
                        dob: dobValue,
                        gender: coordinator.gender || '',
                        emailId: coordinator.email || '',
                        domainMailId: coordinator.domainEmail || '',
                        phoneNumber: coordinator.phone || '',
                        department: coordinator.department || '',
                        staffId: coordinator.staffId || '',
                        cabin: coordinator.cabin || '',
                        username: coordinator.username || '',
                        password: '********',
                        confirmPassword: '********'
                    });
                    if (coordinator.profilePhoto) {
                        setProfilePhoto(coordinator.profilePhoto.startsWith('data:') ? coordinator.profilePhoto : `data:image/jpeg;base64,${coordinator.profilePhoto}`);
                        setPhotoDetails({
                            fileName: coordinator.profilePhotoName || 'Profile Photo',
                            uploadDate: coordinator.updatedAt ? new Date(coordinator.updatedAt).toLocaleDateString('en-GB') : 'N/A'
                        });
                    }
                }
            } catch (err) {
                setLoadError("Failed to fetch data");
            } finally {
                setIsLoading(false);
            }
        };
        fetchCoordinatorDetail();
    }, [coordinatorId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleEdit = () => {
        if (isEditMode) {
            setFormData(originalData);
        } else {
            setOriginalData({ ...formData });
        }
        setIsEditMode(!isEditMode);
    };

    const handleSave = async () => {
        try {
            // Add your update logic here via mongoDBService
            setIsEditMode(false);
            alert("Updated successfully!");
        } catch (err) {
            alert("Update failed");
        }
    };

    return (
        <>
            <AdNavbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} Adminicon={Adminicon} />
            <div className={styles['Admin-cood-view-layout']}>
                <AdSidebar isOpen={isSidebarOpen} />

                <div className={`${styles['Admin-cood-view-main-content']} ${isSidebarOpen ? styles['sidebar-open'] : ''}`}>
                    <div className={styles['Admin-cood-view-main-card']}>
                        
                        <div className={styles['Admin-cood-view-title-bar']}>
                            <h2 className={styles['Admin-cood-view-main-title']}>Coordinator Details</h2>
                            <button className={styles['Admin-cood-view-back-btn']} onClick={() => navigate(-1)}>
                                Back <span className={styles['Admin-cood-view-back-arrow']}>➜</span>
                            </button>
                        </div>

                        {isLoading ? <p>Loading...</p> : (
                            <>
                                <div className={styles['Admin-cood-view-card-content']}>
                                    {/* PERSONAL DETAILS GRID */}
                                    <div className={styles['Admin-cood-view-input-grid']}>
                                        <input type="text" name="firstName" placeholder="First Name" className={styles['Admin-cood-view-form-input']} value={formData.firstName} onChange={handleInputChange} readOnly={!isEditMode} />
                                        <input type="text" name="lastName" placeholder="Last Name" className={styles['Admin-cood-view-form-input']} value={formData.lastName} onChange={handleInputChange} readOnly={!isEditMode} />
                                        
                                        <div className={styles['Admin-cood-view-date-wrapper']}>
                                            <DatePicker 
                                                selected={formData.dob} 
                                                onChange={(date) => setFormData(prev => ({...prev, dob: date}))} 
                                                placeholderText="Date of Birth"
                                                className={styles['Admin-cood-view-form-input']}
                                                disabled={!isEditMode}
                                            />
                                        </div>

                                        <div className={styles['Admin-cood-view-select-wrapper']}>
                                            <select 
                                                ref={genderSelectRef} name="gender" 
                                                className={styles['Admin-cood-view-form-input']}
                                                value={formData.gender} onChange={handleInputChange} disabled={!isEditMode}
                                            >
                                                <option value="" disabled>Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                            <DropdownIcon />
                                        </div>

                                        <input type="email" name="emailId" placeholder="Personal Email" className={styles['Admin-cood-view-form-input']} value={formData.emailId} onChange={handleInputChange} readOnly={!isEditMode} />
                                        <input type="email" name="domainMailId" placeholder="Domain Email" className={styles['Admin-cood-view-form-input']} value={formData.domainMailId} onChange={handleInputChange} readOnly={!isEditMode} />
                                        <input type="text" name="phoneNumber" placeholder="Phone Number" className={styles['Admin-cood-view-form-input']} value={formData.phoneNumber} onChange={handleInputChange} readOnly={!isEditMode} />
                                        <input type="text" name="department" placeholder="Department" className={styles['Admin-cood-view-form-input']} value={formData.department} onChange={handleInputChange} readOnly={!isEditMode} />
                                    </div>

                                    {/* PHOTO SECTION */}
                                    <div className={styles['Admin-cood-view-photo-wrapper']}>
                                        <h3 className={styles['Admin-cood-view-card-title']}>Profile Photo</h3>
                                        <div className={styles['Admin-cood-view-photo-content']}>
                                            <div className={styles['Admin-cood-view-photo-icon-container']}>
                                                <img 
                                                    src={profilePhoto || ProfileGraduationcap} 
                                                    alt="Profile" 
                                                    className={profilePhoto ? styles['Admin-cood-view-photo-active'] : ''} 
                                                    onClick={() => profilePhoto && setIsModalOpen(true)}
                                                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '50%' }}
                                                />
                                            </div>
                                            {photoDetails.fileName && (
                                                <div className={styles['Admin-cood-view-upload-info-container']}>
                                                    <div className={styles['Admin-cood-view-upload-info-item']}><FileIcon /><span>{photoDetails.fileName}</span></div>
                                                    <div className={styles['Admin-cood-view-upload-info-item']}><CalendarIcon /><span>Uploaded: {photoDetails.uploadDate}</span></div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* CREDENTIALS SECTION */}
                                <div className={styles['Admin-cood-view-credentials-card']}>
                                    <h3 className={styles['Admin-cood-view-card-title']}>Login Credentials</h3>
                                    <div className={styles['Admin-cood-view-input-grid-three-col']}>
                                        <input type="text" value={formData.username} readOnly className={styles['Admin-cood-view-form-input']} />
                                        <input type="password" value={formData.password} readOnly className={styles['Admin-cood-view-form-input']} />
                                        <input type="password" value={formData.confirmPassword} readOnly className={styles['Admin-cood-view-form-input']} />
                                    </div>
                                </div>

                                {/* FOOTER ACTIONS */}
                                <div className={styles['Admin-cood-view-footer-actions']}>
                                    <button className={`${styles['Admin-cood-view-btn']} ${styles['Admin-cood-view-block-btn']}`} onClick={toggleEdit}>
                                        {isEditMode ? 'Discard Changes' : 'Edit Details'}
                                    </button>
                                    {isEditMode && (
                                        <button className={`${styles['Admin-cood-view-btn']} ${styles['Admin-cood-view-save-btn']}`} onClick={handleSave}>
                                            Save Changes
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className={styles['co-modal-overlay']} onClick={() => setIsModalOpen(false)}>
                    <div className={styles['co-modal-content']}>
                        <img src={profilePhoto} alt="Full view" className={styles['co-modal-image']} />
                    </div>
                </div>
            )}
        </>
    );
}

export default AdminABcoodet;