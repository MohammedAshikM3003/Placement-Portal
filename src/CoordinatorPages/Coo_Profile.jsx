import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
// Assuming these paths are correct for your existing files
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import mongoDBService from '../services/mongoDBService.jsx';
import { fileToBase64WithCompression, getBase64SizeKB } from '../utils/imageCompression';

// Import CSS Module
import styles from './Coo_Profile.module.css'; 

// Placeholder images
import Adminicon from "../assets/Adminicon.png"; 
import GraduateCapIcon from "../assets/Coordinatorcap.png"; 
import ProfileGraduationcap from "../assets/ProfileGraduationcap.svg"

// Helper to get coordinator ID from storage
const getCoordinatorId = () => {
    try {
        const coordinatorData = localStorage.getItem('coordinatorData');
        if (coordinatorData) {
            const parsed = JSON.parse(coordinatorData);
            // Try multiple fields where coordinatorId might be stored
            const id = parsed.coordinatorId || parsed._id || parsed.id || parsed.username;
            console.log('📋 Coordinator data from storage:', { 
                coordinatorId: parsed.coordinatorId, 
                _id: parsed._id, 
                id: parsed.id, 
                username: parsed.username,
                resolved: id 
            });
            return id;
        }
        // Fallback to separate localStorage key
        const separateId = localStorage.getItem('coordinatorId') || localStorage.getItem('coordinatorUsername');
        if (separateId) {
            console.log('📋 Coordinator ID from separate key:', separateId);
            return separateId;
        }
    } catch (e) {
        console.error('Error getting coordinator ID:', e);
    }
    return null;
};

// Helper to check if a string is likely base64 encoded
const isLikelyBase64 = (value) => {
    if (!value || typeof value !== 'string') return false;
    if (value.startsWith('data:') || value.startsWith('http') || value.startsWith('blob:')) {
        return false;
    }
    const cleaned = value.replace(/\s+/g, '');
    return /^[A-Za-z0-9+/=]+$/.test(cleaned) && cleaned.length > 64;
};

// Helper to get MIME type from filename
const getMimeFromName = (name) => {
    if (!name || typeof name !== 'string') return 'image/jpeg';
    const lower = name.toLowerCase();
    if (lower.endsWith('.png')) return 'image/png';
    if (lower.endsWith('.webp')) return 'image/webp';
    if (lower.endsWith('.gif')) return 'image/gif';
    return 'image/jpeg';
};

// Helper to normalize profile photo URL (handles raw base64 strings)
const normalizeProfilePhotoUrl = (data) => {
    const source = data?.profilePhoto || data?.profilePicURL || data?.profilePhotoUrl || data?.photoURL;
    if (!source) return null;
    
    // Already a valid URL format
    if (source.startsWith('data:') || source.startsWith('http') || source.startsWith('blob:')) {
        return source;
    }
    
    // Raw base64 string - add the data URL prefix
    if (isLikelyBase64(source)) {
        const mime = getMimeFromName(data?.profilePhotoName);
        return `data:${mime};base64,${source}`;
    }
    
    return source;
};

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

// FileSizeErrorPopup Component
const FileSizeErrorPopup = ({ isOpen, onClose, fileSizeKB }) => {
    if (!isOpen) return null;

    return (
        <div className={styles['CoProfile-popup-overlay']}>
            <div className={styles['CoProfile-popup-container']}>
                <div className={styles['CoProfile-popup-header']} style={{ backgroundColor: '#C1272D' }}>
                    Image Too Large!
                </div>
                <div className={styles['CoProfile-popup-body']}>
                    <div style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '50%', 
                        backgroundColor: '#C1272D', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        margin: '0 auto 20px'
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                    </div>
                    <h2 style={{ color: '#d32f2f' }}>Image Size Exceeded ✗</h2>
                    <p style={{ marginBottom: '16px', marginTop: '20px' }}>
                        Maximum allowed: <strong>500KB</strong>
                    </p>
                    <p style={{ marginBottom: '16px' }}>
                        Your image size: <strong>{fileSizeKB}KB</strong>
                    </p>
                    <p style={{ fontSize: '14px', color: '#666', marginTop: '20px', marginBottom: '10px' }}>
                        Please compress your image or choose a smaller file.
                    </p>
                </div>
                <div className={styles['CoProfile-popup-footer']}>
                    <button onClick={onClose} style={{ backgroundColor: '#C1272D' }} className={styles['CoProfile-popup-close-btn']}>OK</button>
                </div>
            </div>
        </div>
    );
};

const SuccessPopup = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className={styles['co-profile-success-overlay']}>
            <div className={styles['CoProfile-popup-container']}>
                <div className={styles['CoProfile-popup-header']}>Saved !</div>
                <div className={styles['CoProfile-popup-body']}>
                    <svg className={styles['CoProfile-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className={styles['CoProfile-success-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
                        <path className={styles['CoProfile-success-icon--check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <h2>Details Saved ✓</h2>
                    <p>Your Details have been</p>
                    <p>Successfully saved in the Portal</p>
                </div>
                <div className={styles['CoProfile-popup-footer']}>
                    <button onClick={onClose} className={styles['CoProfile-popup-close-btn']}>Close</button>
                </div>
            </div>
        </div>
    );
};

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', marginRight: '8px', color: '#555', flexShrink: 0 }}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const UploadIconSVG = () => (
    <svg className={styles['co-profile-upload-svg']} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 16h2V9h4l-5-5-5 5h4v7zm-5 4h12v-2H6v2z" fill="currentColor"/>
    </svg>
);


function CoProfile({ onLogout, currentView, onViewChange }) {
    useCoordinatorAuth(); // JWT authentication verification
    const navigate = useNavigate();
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

    const [profilePhoto, setProfilePhoto] = useState(null);
    const [profilePhotoBase64, setProfilePhotoBase64] = useState('');
    const [photoDetails, setPhotoDetails] = useState({ fileName: null, uploadDate: null });
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); 
    const [saveStatus, setSaveStatus] = useState(null);
    const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isFileSizeErrorOpen, setIsFileSizeErrorOpen] = useState(false);
    const [fileSizeErrorKB, setFileSizeErrorKB] = useState(0);
    
    // HYPER-FAST: Initialize loading state based on cache availability
    const [isLoading, setIsLoading] = useState(() => {
        try {
            const cachedData = localStorage.getItem('coordinatorData');
            if (cachedData) {
                const data = JSON.parse(cachedData);
                // Check any meaningful field
                if (data.firstName || data.lastName || data.email || data.coordinatorId || data.username) {
                    return false; // Don't show loading if cache exists
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
        return true;
    });

    // Load coordinator data on component mount
    useEffect(() => {
        const loadCoordinatorData = async () => {
            try {
                // INSTANT LOAD: Check cache BEFORE setting loading state
                const cachedData = localStorage.getItem('coordinatorData');
                console.log('🔍 Raw cached coordinator data:', cachedData ? 'exists' : 'null');
                
                if (cachedData) {
                    try {
                        const data = JSON.parse(cachedData);
                        console.log('📦 Parsed coordinator data:', {
                            firstName: data.firstName,
                            lastName: data.lastName,
                            email: data.email,
                            coordinatorId: data.coordinatorId,
                            username: data.username,
                            hasProfilePhoto: !!(data.profilePhoto || data.profilePicURL)
                        });
                        
                        // Check if cache has FULL profile data (not just minimal login data)
                        // Must have firstName OR lastName OR email - not just coordinatorId/username
                        const hasFullProfileData = data.firstName || data.lastName || data.email;
                        
                        if (hasFullProfileData) {
                            console.log('✅ Loading coordinator profile from cache - INSTANT');
                            
                            // Set all data from cache immediately
                            setFormData({
                                firstName: data.firstName || '',
                                lastName: data.lastName || '',
                                dob: data.dob || '',
                                gender: data.gender || '',
                                emailId: data.email || data.emailId || '',
                                domainMailId: data.domainEmail || data.domainMailId || '',
                                phoneNumber: data.phone || data.phoneNumber || '',
                                department: data.department || '',
                                staffId: data.coordinatorId || data.username || data.staffId || '',
                                cabin: data.cabin || '',
                            });
                            
                            // Load profile photo from cache (normalize for base64)
                            const photoUrl = normalizeProfilePhotoUrl(data);
                            if (photoUrl) {
                                console.log('🖼️ Profile photo URL normalized:', photoUrl.substring(0, 50) + '...');
                                setProfilePhoto(photoUrl);
                                setProfilePhotoBase64(photoUrl);
                            }
                            
                            console.log('✅ Coordinator profile loaded instantly from cache');
                            setIsLoading(false);
                            return; // Don't fetch from server - cache is fresh
                        } else {
                            // Only have minimal data (coordinatorId/username) - set staffId at least
                            console.log('⚠️ Cache only has minimal data, will fetch full profile from server');
                            // Set at least the ID so user sees something while loading
                            const staffIdValue = data.coordinatorId || data.username || data.staffId || '';
                            if (staffIdValue) {
                                setFormData(prev => ({ ...prev, staffId: staffIdValue }));
                            }
                        }
                    } catch (err) {
                        console.warn('Cache parse error:', err);
                    }
                }
                
                // Only show loading state if we need to fetch from server
                setIsLoading(true);
                
                // Get coordinator ID for server fetch
                const coordinatorId = getCoordinatorId();
                
                if (!coordinatorId) {
                    console.warn('⚠️ No coordinator ID found - cannot fetch from server');
                    setIsLoading(false);
                    return;
                }
                
                // Fetch from server as fallback
                console.log('⚠️ No cache found, fetching from server...');
                const response = await mongoDBService.getCoordinatorById(coordinatorId);
                const data = response?.coordinator || response;
                
                if (data) {
                    console.log('📦 Coordinator Data Received:', {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        hasProfilePhoto: !!data.profilePhoto
                    });
                    
                    // Set form data from server response
                    setFormData({
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        dob: data.dob || '',
                        gender: data.gender || '',
                        emailId: data.email || '',
                        domainMailId: data.domainEmail || '',
                        phoneNumber: data.phone || '',
                        department: data.department || '',
                        staffId: data.coordinatorId || '',
                        cabin: data.cabin || '',
                    });
                    
                    // Load profile photo (normalize for base64)
                    const photoUrl = normalizeProfilePhotoUrl(data);
                    if (photoUrl) {
                        setProfilePhoto(photoUrl);
                        setProfilePhotoBase64(photoUrl);
                    }
                    
                    // Update localStorage cache
                    const cacheData = {
                        ...data,
                        timestamp: Date.now()
                    };
                    localStorage.setItem('coordinatorData', JSON.stringify(cacheData));
                    console.log('✅ Coordinator profile cached successfully');
                }
            } catch (error) {
                console.error('Error loading coordinator data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadCoordinatorData();
    }, []); 

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload a JPG, PNG, or WebP file.');
            return;
        }
        
        const fileSizeKB = (file.size / 1024).toFixed(2);
        if (file.size > 500 * 1024) {
            setFileSizeErrorKB(fileSizeKB);
            setIsFileSizeErrorOpen(true);
            e.target.value = '';
            return;
        }
        
        try {
            // Store file for GridFS upload on save
            setProfilePhoto(URL.createObjectURL(file));
            setProfilePhotoBase64(file); // Store raw File object instead of Base64
            setPhotoDetails({
                fileName: file.name,
                uploadDate: new Date().toLocaleDateString('en-GB'),
            });
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 5000);
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Failed to upload image. Please try again.');
        }
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
        setProfilePhotoBase64('');
        setPhotoDetails({ fileName: null, uploadDate: null });
        setIsModalOpen(false);
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
        setUploadSuccess(false);
    };

    const handleDiscard = async () => {
        try {
            const coordinatorId = getCoordinatorId();
            if (!coordinatorId) {
                // Just reset form if no ID
                setFormData({
                    firstName: '', lastName: '', dob: '', gender: '', emailId: '',
                    domainMailId: '', phoneNumber: '', department: '', staffId: '', cabin: '',
                });
                setProfilePhoto(null);
                setProfilePhotoBase64('');
                setPhotoDetails({ fileName: null, uploadDate: null });
                setIsModalOpen(false);
                setSaveStatus('discarded');
                return;
            }
            
            // Reload from server
            const response = await mongoDBService.getCoordinatorById(coordinatorId);
            const data = response?.coordinator || response;
            
            if (data) {
                setFormData({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    dob: data.dob || '',
                    gender: data.gender || '',
                    emailId: data.email || '',
                    domainMailId: data.domainEmail || '',
                    phoneNumber: data.phone || '',
                    department: data.department || '',
                    staffId: data.coordinatorId || '',
                    cabin: data.cabin || '',
                });
                
                if (data.profilePhoto) {
                    setProfilePhoto(data.profilePhoto);
                    setProfilePhotoBase64(data.profilePhoto);
                } else {
                    setProfilePhoto(null);
                    setProfilePhotoBase64('');
                }
            }
            
            setIsModalOpen(false);
            setSaveStatus('discarded');
        } catch (error) {
            console.error('Error reloading coordinator data:', error);
            alert('Failed to discard changes. Please try again.');
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setSaveStatus(null);
            
            const coordinatorId = getCoordinatorId();
            if (!coordinatorId) {
                alert('No coordinator ID found. Please log in again.');
                setIsSaving(false);
                return;
            }
            
            // Prepare data to save
            const dataToSave = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                fullName: `${formData.firstName} ${formData.lastName}`.trim(),
                dob: formData.dob,
                gender: formData.gender,
                email: formData.emailId,
                domainEmail: formData.domainMailId,
                phone: formData.phoneNumber,
                department: formData.department,
                cabin: formData.cabin,
            };

            // Upload profile photo to GridFS if a new file was selected
            if (profilePhotoBase64 instanceof File) {
                const gridfsService = (await import('../services/gridfsService')).default;
                const result = await gridfsService.uploadProfileImage(profilePhotoBase64, coordinatorId, 'coordinator');
                dataToSave.profilePhoto = result.url;
                dataToSave.profilePicURL = result.url;
            }
            
            console.log('📤 Saving coordinator profile:', coordinatorId);
            
            // Save to database
            const result = await mongoDBService.updateCoordinator(coordinatorId, dataToSave);
            
            if (result.success || result.coordinator) {
                setSaveStatus('saved');
                
                // Update localStorage cache with complete data
                const existingData = JSON.parse(localStorage.getItem('coordinatorData') || '{}');
                const updatedCacheData = {
                    ...existingData,
                    ...dataToSave,
                    coordinatorId: coordinatorId,
                    profilePicURL: dataToSave.profilePhoto || existingData.profilePicURL || null,
                    timestamp: Date.now()
                };
                localStorage.setItem('coordinatorData', JSON.stringify(updatedCacheData));
                console.log('✅ Coordinator profile cache updated after save');
                
                // 🔔 INSTANT SYNC: Dispatch event with data payload to update sidebar immediately
                const updatedProfileData = {
                    coordinatorId: coordinatorId,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    profilePhoto: dataToSave.profilePhoto || dataToSave.profilePicURL,
                    profilePicURL: dataToSave.profilePicURL || dataToSave.profilePhoto,
                    email: formData.emailId
                };
                
                window.dispatchEvent(new CustomEvent('coordinatorProfileUpdated', { 
                    detail: updatedProfileData 
                }));
                console.log('🔔 Coordinator profile update event dispatched to sidebar with data payload');
                
                // Show success popup
                setIsSuccessPopupOpen(true);
            } else {
                setSaveStatus('error');
                alert(result.message || 'Failed to save profile. Please try again.');
            }
        } catch (error) {
            console.error('Error saving coordinator profile:', error);
            setSaveStatus('error');
            alert('Error saving profile. Please check your connection and try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleClosePopup = () => {
        setIsSuccessPopupOpen(false);
    };

    const closeFileSizeErrorPopup = () => {
        setIsFileSizeErrorOpen(false);
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    // Constructing classNames using the styles object
    const photoClassNames = `${styles['co-profile-photo-preview']} ${profilePhoto ? `${styles['co-profile-photo-clickable']} ${styles['co-profile-photo-active']}` : ''}`;

    // Show loading state only if no cache
    if (isLoading) {
        return (
            <>
                <Navbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
                <div className={styles['co-profile-layout']}>
                    <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView="profile" onViewChange={onViewChange} />
                    <div className={styles['co-profile-main-content']}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            height: '60vh',
                            fontSize: '18px',
                            color: '#666'
                        }}>
                            Loading profile data...
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
            {isSaving && <div className={styles['co-profile-saving-overlay']} />}
            <div className={`${styles['co-profile-layout']} ${isSaving ? styles['co-profile-saving'] : ''}`}>
                <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView="profile" onViewChange={onViewChange} />
                <div className={styles['co-profile-main-content']}>
                    <div className={styles['co-profile-master-card']}>
                        
                        <div className={styles['co-profile-content-grid']}>
                            
                            <div className={styles['co-profile-form-area']}>
                                
                                <section className={`${styles['co-profile-section']} ${styles['co-profile-personal-info']}`}>
                                    <h3 className={styles['co-profile-section-header']}>Personal Information</h3>
                                    <div className={styles['co-profile-input-grid']}>
                                        <input type="text" name="firstName" placeholder="First Name" className={styles['co-profile-form-input']} value={formData.firstName} onChange={handleInputChange} disabled={isSaving} />
                                        <input type="text" name="lastName" placeholder="Last Name" className={styles['co-profile-form-input']} value={formData.lastName} onChange={handleInputChange} disabled={isSaving} />
                                        
                                        <div className={styles['co-profile-date-wrapper']}>
                                            <DatePicker
                                                selected={formData.dob ? new Date(formData.dob) : null}
                                                onChange={(date) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        dob: date ? date.toISOString().split('T')[0] : '',
                                                    }))
                                                }
                                                dateFormat="dd-MM-yyyy"
                                                placeholderText="DOB"
                                                className={styles['co-profile-date-input']}
                                                showPopperArrow={false}
                                                showMonthDropdown
                                                showYearDropdown
                                                dropdownMode="select"
                                                yearDropdownItemNumber={7}
                                                scrollableYearDropdown
                                                popperClassName={styles['co-profile-date-popper']}
                                                disabled={isSaving}
                                            />
                                        </div>
                                        <select name="gender" className={`${styles['co-profile-form-input']} ${styles['co-profile-form-select']}`} value={formData.gender} onChange={handleInputChange} disabled={isSaving}>
                                            <option value="" disabled hidden>Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        
                                        <input type="email" name="emailId" placeholder="Email id" className={styles['co-profile-form-input']} value={formData.emailId} onChange={handleInputChange} disabled={isSaving} />
                                        <input type="email" name="domainMailId" placeholder="Domain Mail id" className={styles['co-profile-form-input']} value={formData.domainMailId} onChange={handleInputChange} disabled={isSaving} />
                                        
                                        <input type="tel" name="phoneNumber" placeholder="Phone number" className={styles['co-profile-form-input']} value={formData.phoneNumber} onChange={handleInputChange} disabled={isSaving} />
                                        <input type="text" name="department" placeholder="Department" className={styles['co-profile-form-input']} value={formData.department} onChange={handleInputChange} disabled={isSaving} />
                                    </div>
                                </section>

                                <section className={`${styles['co-profile-section']} ${styles['co-profile-office-details']}`}>
                                    <div className={styles['co-profile-section-header2']}>
                                        <h3 className={styles['co-profile-section-header']}>Office Details</h3>
                                        <div className={`${styles['co-profile-input-grid']} ${styles['co-profile-input-grid-two-col']}`}>
                                            <input type="text" name="staffId" placeholder="Staff ID" className={styles['co-profile-form-input']} value={formData.staffId} onChange={handleInputChange} disabled />
                                            <input type="text" name="cabin" placeholder="Cabin" className={styles['co-profile-form-input']} value={formData.cabin} onChange={handleInputChange} disabled={isSaving} />
                                        </div>
                                    </div>
                                </section>
                            </div>
                            
                            <aside className={styles['co-profile-photo-card']}>
                                <h3 className={`${styles['co-profile-section-header']} ${styles['co-profile-photo-header']}`}>Profile Photo</h3>
                                <div className={styles['co-profile-photo-header-line']}>
                                    <div className={styles['co-profile-photo-icon-container']}>
                                        {profilePhoto ? (
                                            <img
                                                src={profilePhoto}
                                                alt="Profile Preview"
                                                className={photoClassNames}
                                                onClick={handleImageClick}
                                            />
                                        ) : (
                                            <img src={ProfileGraduationcap} alt="Graduation Cap" style={{ width: '100px', height: '90px', marginTop:'50px'}}/>
                                        )}
                                    </div>
                                </div>
                                <div className={styles['co-profile-upload-action-area']}>
                                    <div className={styles['co-profile-upload-btn-wrapper']}>
                                        <label htmlFor="file-upload" className={`${styles['co-profile-profile-upload-btn']} ${isSaving ? styles['co-profile-disabled'] : ''}`}>
                                            <div className={styles['co-profile-upload-btn-content']}><MdUpload /><span>Upload (Max 500 KB)</span></div>
                                        </label>
                                        {profilePhoto && (
                                            <button onClick={handleRemovePhoto} className={styles['co-profile-remove-image-btn']} aria-label="Remove image" disabled={isSaving}><IoMdClose /></button>
                                        )}
                                    </div>
                                    <input
                                        id="file-upload"
                                        type="file"

                                        className={styles['co-profile-hidden-input']}
                                        onChange={handlePhotoUpload}
                                        disabled={isSaving}
                                    />
                                    {uploadSuccess && (
                                        <p className={styles['co-profile-upload-success-message']}>Profile Photo uploaded Successfully!</p>
                                    )}
                                    <p className={styles['co-profile-upload-hint']}>*JPG, PNG, and WebP formats allowed.</p>
                                </div>
                            </aside>

                        </div>

                        <div className={styles['co-profile-action-buttons']}>
                            <button type="button" className={styles['co-profile-discard-btn']} onClick={handleDiscard} disabled={isSaving}>
                                Discard
                            </button>
                            <button type="button" className={styles['co-profile-save-btn']} onClick={handleSave} disabled={isSaving}>
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isModalOpen && profilePhoto && (
                <div className={styles['co-modal-overlay']} onClick={handleModalClose}>
                    <div className={styles['co-modal-content']} onClick={e => e.stopPropagation()}>
                        <span className={styles['co-modal-close']} onClick={handleModalClose}>&times;</span>
                        <img src={profilePhoto} alt="Full Profile Preview" className={styles['co-modal-image']}  />
                    </div>
                </div>
            )}

            <SuccessPopup isOpen={isSuccessPopupOpen} onClose={handleClosePopup} />
            <FileSizeErrorPopup isOpen={isFileSizeErrorOpen} onClose={closeFileSizeErrorPopup} fileSizeKB={fileSizeErrorKB} />
        </>
    );
}

export default CoProfile;