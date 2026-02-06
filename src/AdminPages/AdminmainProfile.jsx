import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import useAdminAuth from '../utils/useAdminAuth';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
// Assuming these paths are correct for your existing files
import AdNavbar from "../components/Navbar/Adnavbar.js";
import AdSidebar from "../components/Sidebar/Adsidebar.js";

// FIXED: Import CSS as a Module
import styles from './AdminmainProfile.module.css';

// Placeholder image
import Adminicon from "../assets/Adminicon.png"; 
import ProfileGraduationcap from "../assets/AdminProfileGraduationcap.svg"
import { fileToBase64WithCompression, getBase64SizeKB } from '../utils/imageCompression';

// Helper functions for date handling
const parseDateValue = (value) => {
    if (!value) return null;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateToISO = (date) => {
    if (!date || Number.isNaN(date.getTime())) {
        return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

// Icons (Classes updated to modular format where needed)
const MdUpload = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path></svg>
);

const IoMdClose = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path></svg>
);

// FileSizeErrorPopup Component
const FileSizeErrorPopup = ({ isOpen, onClose, fileSizeKB }) => {
    if (!isOpen) return null;

    return (
        <div className={styles['mr-popup-overlay']}>
            <div className={styles['mr-popup-container']}>
                <div className={styles['mr-popup-header']} style={{ backgroundColor: '#4EA24E' }}>
                    Image Too Large!
                </div>
                <div className={styles['mr-popup-body']}>
                    <div className={styles['mr-image-error-icon-container']}>
                        <svg
                            className={styles['mr-image-error-icon']}
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                        >
                            <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                <path d="M15 8h.01M12.5 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6.5" />
                                <path d="m3 16 5-5c.928-.893 2.072-.893 3 0l3 3m0 0 1-1c.616-.593 1.328-.792 2.008-.598M16 19a3 3 0 1 0 6 0a3 3 0 1 0-6 0m1 2 4-4" />
                            </g>
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
                <div className={styles['mr-popup-footer']}>
                    <button onClick={onClose} className={styles['mr-popup-close-btn-red']}>OK</button>
                </div>
            </div>
        </div>
    );
};

// SuccessPopup Component
const SuccessPopup = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(18,18,34,0.11)',
            zIndex: 1000,
        }}>
            <div className={styles['Admin-DB-AdProfile-popup-container']}>
                <div className={styles['Admin-DB-AdProfile-popup-header']}>Saved !</div>
                <div className={styles['Admin-DB-AdProfile-popup-body']}>
                    <svg className={styles['Admin-DB-AdProfile-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className={styles['Admin-DB-AdProfile-success-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
                        <path className={styles['Admin-DB-AdProfile-success-icon--check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <h2>Changes Saved ✓</h2>
                    <p>Your Details have been</p>
                    <p>Successfully saved in the Portal</p>
                </div>
                <div className={styles['Admin-DB-AdProfile-popup-footer']}>
                    <button onClick={onClose} className={styles['Admin-DB-AdProfile-popup-close-btn']}>Close</button>
                </div>
            </div>
        </div>
    );
};

// Key Icon for Change Login Details button
const KeyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '24px', height: '24px', marginRight: '10px' }}>
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
    </svg>
);

function Admainprofile() {
    useAdminAuth(); // JWT authentication verification
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
    const [profilePhotoBase64, setProfilePhotoBase64] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false); 
    const [saveStatus, setSaveStatus] = useState(null); 
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isFileSizeErrorOpen, setIsFileSizeErrorOpen] = useState(false);
    const [fileSizeErrorKB, setFileSizeErrorKB] = useState('');
    const [showLoginDetails, setShowLoginDetails] = useState(false);
    const [collegeBanner, setCollegeBanner] = useState(null);
    const [collegeBannerBase64, setCollegeBannerBase64] = useState('');
    const [naacCertificate, setNaacCertificate] = useState(null);
    const [naacCertificateBase64, setNaacCertificateBase64] = useState('');
    const [nbaCertificate, setNbaCertificate] = useState(null);
    const [nbaCertificateBase64, setNbaCertificateBase64] = useState('');
    const [collegeLogo, setCollegeLogo] = useState(null);
    const [collegeLogoBase64, setCollegeLogoBase64] = useState('');
    const [bannerUploadSuccess, setBannerUploadSuccess] = useState(false);
    const [naacUploadSuccess, setNaacUploadSuccess] = useState(false);
    const [nbaUploadSuccess, setNbaUploadSuccess] = useState(false);
    const [logoUploadSuccess, setLogoUploadSuccess] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
    
    // HYPER-FAST: Initialize loading state based on cache availability
    // If cache exists with valid data, start with isLoading=false to prevent flash
    const [isLoading, setIsLoading] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                // If we have meaningful cached data, don't show loading
                if (data.firstName || data.lastName || data.emailId) {
                    return false;
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
        return true; // Show loading only if no valid cache
    });
    const [dataLoaded, setDataLoaded] = useState(false);

    // Get admin login ID from localStorage or session
    const getAdminLoginID = () => {
        return localStorage.getItem('adminLoginID') || 'admin1000';
    };

    // Load admin data on component mount 
    useEffect(() => {
        const loadAdminData = async () => {
            try {
                const adminLoginID = getAdminLoginID();
                
                // INSTANT LOAD: Check cache BEFORE setting loading state
                // This prevents the "Loading profile data..." flash
                const cachedProfile = localStorage.getItem('adminProfileCache');
                if (cachedProfile) {
                    try {
                        const profileData = JSON.parse(cachedProfile);
                        
                        // Check if cache has meaningful data (full profile format)
                        if (profileData.firstName || profileData.lastName || profileData.emailId) {
                            console.log('✅ Loading profile from cache - INSTANT');
                            
                            // Set all data from cache immediately
                            setFormData({
                                firstName: profileData.firstName || '',
                                lastName: profileData.lastName || '',
                                dob: profileData.dob || '',
                                gender: profileData.gender || '',
                                emailId: profileData.emailId || '',
                                domainMailId: profileData.domainMailId || '',
                                phoneNumber: profileData.phoneNumber || '',
                                department: profileData.department || '',
                            });
                            
                            setLoginData(prev => ({
                                ...prev,
                                currentLoginId: profileData.adminLoginID || adminLoginID
                            }));
                            
                            // Load all images from cache
                            if (profileData.profilePhoto) {
                                setProfilePhoto(profileData.profilePhoto);
                                setProfilePhotoBase64(profileData.profilePhoto);
                            }
                            if (profileData.collegeBanner) {
                                setCollegeBanner(profileData.collegeBanner);
                                setCollegeBannerBase64(profileData.collegeBanner);
                            }
                            if (profileData.naacCertificate) {
                                setNaacCertificate(profileData.naacCertificate);
                                setNaacCertificateBase64(profileData.naacCertificate);
                            }
                            if (profileData.nbaCertificate) {
                                setNbaCertificate(profileData.nbaCertificate);
                                setNbaCertificateBase64(profileData.nbaCertificate);
                            }
                            if (profileData.collegeLogo) {
                                setCollegeLogo(profileData.collegeLogo);
                                setCollegeLogoBase64(profileData.collegeLogo);
                            }
                            
                            console.log('✅ Profile loaded instantly from cache');
                            setDataLoaded(true);
                            setIsLoading(false);
                            return; // Don't fetch from server - cache is fresh
                        }
                    } catch (err) {
                        console.warn('Cache parse error:', err);
                    }
                }
                
                // Only show loading state if we need to fetch from server
                setIsLoading(true);
                
                // If no cache, fetch from server as fallback
                console.log('⚠️ No cache found, fetching from server...');
                const authToken = localStorage.getItem('authToken');
                const response = await fetch(`http://localhost:5000/api/admin/profile/${adminLoginID}`, {
                    headers:{ 'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                    const data = result.data;
                    console.log('📦 Admin Data Received:', {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        dob: data.dob,
                        gender: data.gender,
                        emailId: data.emailId,
                        domainMailId: data.domainMailId,
                        phoneNumber: data.phoneNumber,
                        department: data.department,
                        hasProfilePhoto: !!data.profilePhoto,
                        hasCollegeBanner: !!data.collegeBanner,
                        hasNaacCertificate: !!data.naacCertificate,
                        hasNbaCertificate: !!data.nbaCertificate,
                        hasCollegeLogo: !!data.collegeLogo
                    });
                    
                    // Load personal information
                    setFormData({
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        dob: data.dob || '',
                        gender: data.gender || '',
                        emailId: data.emailId || '',
                        domainMailId: data.domainMailId || '',
                        phoneNumber: data.phoneNumber || '',
                        department: data.department || '',
                    });
                    
                    console.log('✅ Form data set successfully');
                    
                    // Load login ID
                    setLoginData(prev => ({
                        ...prev,
                        currentLoginId: data.adminLoginID || ''
                    }));
                    
                    // 🖼️ Load profile photo from cache first, then from server
                    let profilePhotoUrl = null;
                    
                    // Try to get from cache first for instant loading
                    try {
                        const { default: adminImageCacheService } = await import('../services/adminImageCacheService.jsx');
                        const cachedPhoto = adminImageCacheService.getCachedAdminProfilePhoto(data.adminLoginID);
                        
                        if (cachedPhoto) {
                            console.log('✅ Using cached admin profile photo');
                            profilePhotoUrl = cachedPhoto;
                        } else if (data.profilePhoto) {
                            console.log('📥 Caching admin profile photo from server data');
                            await adminImageCacheService.cacheAdminProfilePhoto(data.adminLoginID, data.profilePhoto);
                            profilePhotoUrl = data.profilePhoto;
                        }
                    } catch (cacheError) {
                        console.warn('⚠️ Cache service unavailable, using server data:', cacheError);
                        profilePhotoUrl = data.profilePhoto;
                    }
                    
                    // Load images
                    if (profilePhotoUrl) {
                        setProfilePhoto(profilePhotoUrl);
                        setProfilePhotoBase64(profilePhotoUrl);
                    }
                    if (data.collegeBanner) {
                        setCollegeBanner(data.collegeBanner);
                        setCollegeBannerBase64(data.collegeBanner);
                    }
                    if (data.naacCertificate) {
                        setNaacCertificate(data.naacCertificate);
                        setNaacCertificateBase64(data.naacCertificate);
                    }
                    if (data.nbaCertificate) {
                        setNbaCertificate(data.nbaCertificate);
                        setNbaCertificateBase64(data.nbaCertificate);
                    }
                    if (data.collegeLogo) {
                        setCollegeLogo(data.collegeLogo);
                        setCollegeLogoBase64(data.collegeLogo);
                    }
                    
                    // 💾 Cache complete admin profile data to prevent repeated fetches
                    const profileCacheData = {
                        ...data,
                        profilePhoto: profilePhotoUrl,
                        timestamp: Date.now()
                    };
                    localStorage.setItem('adminProfileCache', JSON.stringify(profileCacheData));
                    localStorage.setItem('adminProfileCacheTime', Date.now().toString());
                    console.log('✅ Admin profile cached successfully');
                    
                    setDataLoaded(true);
                    setIsLoading(false);
                    }
                }
            } catch (error) {
                console.error('Error loading admin data:', error);
                setIsLoading(false);
            }
        };
        
        loadAdminData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDobChange = (date) => {
        setFormData(prevState => ({
            ...prevState,
            dob: formatDateToISO(date)
        }));
    };

    const handleLoginInputChange = (e) => {
        const { name, value } = e.target;
        setLoginData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        if (file.type !== 'image/jpeg') {
            alert('Invalid file type. Please upload a JPG file.');
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
            // Auto-compress if image is larger than 400KB
            const base64 = await fileToBase64WithCompression(file, 400);
            const compressedSizeKB = getBase64SizeKB(base64);
            console.log(`Profile photo compressed to ${compressedSizeKB.toFixed(2)}KB`);
            setProfilePhoto(URL.createObjectURL(file));
            setProfilePhotoBase64(base64);
            
            // 🖼️ Update the image cache with new photo
            try {
                const adminLoginID = getAdminLoginID();
                const { default: adminImageCacheService } = await import('../services/adminImageCacheService.jsx');
                await adminImageCacheService.cacheAdminProfilePhoto(adminLoginID, base64);
                console.log('✅ New admin profile photo cached');
            } catch (cacheError) {
                console.warn('⚠️ Failed to cache new admin profile photo:', cacheError);
            }
            
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 5000);
        } catch (error) {
            console.error('Error converting image:', error);
            alert('Failed to upload image. Please try again.');
        }
    };

    const closeFileSizeErrorPopup = () => {
        setIsFileSizeErrorOpen(false);
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
        setIsModalOpen(false);
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
        setUploadSuccess(false);
    };

    const handleDiscard = async () => {
        // Reload the admin data from the server
        try {
            const adminLoginID = getAdminLoginID();
            
            const authToken = localStorage.getItem('authToken');
            const response = await fetch(`http://localhost:5000/api/admin/profile/${adminLoginID}`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            
            if (result.success && result.data) {
                const data = result.data;
                
                // Reload personal information
                setFormData({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    dob: data.dob || '',
                    gender: data.gender || '',
                    emailId: data.emailId || '',
                    domainMailId: data.domainMailId || '',
                    phoneNumber: data.phoneNumber || '',
                    department: data.department || '',
                });
                
                // Reload login ID
                setLoginData({
                    currentLoginId: data.adminLoginID || '',
                    newLoginId: '',
                    confirmLoginId: '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
                
                // Reload images
                setProfilePhoto(data.profilePhoto || null);
                setProfilePhotoBase64(data.profilePhoto || '');
                setCollegeBanner(data.collegeBanner || null);
                setCollegeBannerBase64(data.collegeBanner || '');
                setNaacCertificate(data.naacCertificate || null);
                setNaacCertificateBase64(data.naacCertificate || '');
                setNbaCertificate(data.nbaCertificate || null);
                setNbaCertificateBase64(data.nbaCertificate || '');
                setCollegeLogo(data.collegeLogo || null);
                setCollegeLogoBase64(data.collegeLogo || '');
            } else {
                // If no data exists, clear everything
                setFormData({
                    firstName: '', lastName: '', dob: '', gender: '', emailId: '',
                    domainMailId: '', phoneNumber: '', department: '',
                });
                setLoginData({
                    currentLoginId: '', newLoginId: '', confirmLoginId: '',
                    currentPassword: '', newPassword: '', confirmPassword: '',
                });
                setProfilePhoto(null);
                setProfilePhotoBase64('');
                setCollegeBanner(null);
                setCollegeBannerBase64('');
                setNaacCertificate(null);
                setNaacCertificateBase64('');
                setNbaCertificate(null);
                setNbaCertificateBase64('');
                setCollegeLogo(null);
                setCollegeLogoBase64('');
            }
            
            setIsModalOpen(false); 
            setSaveStatus('discarded');
        } catch (error) {
            console.error('Error reloading admin data:', error);
            alert('Failed to discard changes. Please try again.');
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setSaveStatus(null);
            
            // Prepare data to send
            const dataToSave = {
                adminLoginID: loginData.currentLoginId || getAdminLoginID(),
                ...formData,
                // Images (base64)
                profilePhoto: profilePhotoBase64,
                profilePhotoName: 'profile.jpg',
                collegeBanner: collegeBannerBase64,
                collegeBannerName: 'banner.jpg',
                naacCertificate: naacCertificateBase64,
                naacCertificateName: 'naac.jpg',
                nbaCertificate: nbaCertificateBase64,
                nbaCertificateName: 'nba.jpg',
                collegeLogo: collegeLogoBase64,
                collegeLogoName: 'logo.jpg',
            };
            
            // Add login credentials if provided
            if (loginData.newLoginId && loginData.confirmLoginId) {
                dataToSave.newLoginId = loginData.newLoginId;
                dataToSave.confirmLoginId = loginData.confirmLoginId;
            }
            if (loginData.currentPassword) {
                dataToSave.currentPassword = loginData.currentPassword;
            }
            if (loginData.newPassword && loginData.confirmPassword) {
                dataToSave.newPassword = loginData.newPassword;
                dataToSave.confirmPassword = loginData.confirmPassword;
            }
            
            const authToken = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:5000/api/admin/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify(dataToSave),
            });
            
            const result = await response.json();
            
            if (result.success) {
                setSaveStatus('saved');
                
                // � Update complete cache after successful save
                const adminLoginID = loginData.currentLoginId || getAdminLoginID();
                const fullCacheData = {
                    adminLoginID: adminLoginID,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    dob: formData.dob,
                    gender: formData.gender,
                    emailId: formData.emailId,
                    domainMailId: formData.domainMailId,
                    phoneNumber: formData.phoneNumber,
                    department: formData.department,
                    profilePhoto: profilePhotoBase64,
                    collegeBanner: collegeBannerBase64,
                    naacCertificate: naacCertificateBase64,
                    nbaCertificate: nbaCertificateBase64,
                    collegeLogo: collegeLogoBase64,
                    timestamp: Date.now()
                };
                localStorage.setItem('adminProfileCache', JSON.stringify(fullCacheData));
                localStorage.setItem('adminProfileCacheTime', Date.now().toString());
                console.log('✅ Admin profile cache updated after save');
                
                // 🖼️ Update cached profile photo if changed
                if (profilePhotoBase64) {
                    try {
                        const { default: adminImageCacheService } = await import('../services/adminImageCacheService.jsx');
                        await adminImageCacheService.cacheAdminProfilePhoto(adminLoginID, profilePhotoBase64);
                        console.log('✅ Admin profile photo cache updated after save');
                    } catch (cacheError) {
                        console.warn('⚠️ Failed to update admin profile photo cache after save:', cacheError);
                    }
                }
                
                // 🔄 Clear college images cache to force refresh on landing page and dashboards
                try {
                    const { clearCache } = await import('../services/collegeImagesService');
                    clearCache();
                    console.log('✅ College images cache cleared - pages will fetch fresh images');
                } catch (cacheError) {
                    console.warn('⚠️ Failed to clear college images cache:', cacheError);
                }
                
                // Update login ID in localStorage if changed
                if (loginData.newLoginId) {
                    localStorage.setItem('adminLoginID', loginData.newLoginId);
                }
                // Clear login fields
                setLoginData({
                    currentLoginId: loginData.newLoginId || loginData.currentLoginId,
                    newLoginId: '',
                    confirmLoginId: '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
                
                // Show success popup
                setIsSuccessPopupOpen(true);
                
                // 🔔 INSTANT SYNC: Dispatch with data payload (like Student logic)
                // This allows sidebar to update immediately without network fetch
                const updatedAdminData = {
                    adminLoginID: adminLoginID,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    profilePhoto: profilePhotoBase64, // Pass Base64 directly for instant UI update
                    emailId: formData.emailId
                };
                
                window.dispatchEvent(new CustomEvent('adminProfileUpdated', { 
                    detail: updatedAdminData 
                }));
                console.log('🔔 Profile update event dispatched to sidebar with data payload');
            } else {
                setSaveStatus('error');
                alert(result.message || 'Failed to save profile. Please try again.');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            setSaveStatus('error');
            alert('Error saving profile. Please check your connection and try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    const toggleLoginDetails = () => {
        setShowLoginDetails(prev => !prev);
    };

    const handleCollegeBannerUpload = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload JPG, JPEG, PNG, or SVG file.');
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
            // Auto-compress if image is larger than 400KB
            const base64 = await fileToBase64WithCompression(file, 400);
            const compressedSizeKB = getBase64SizeKB(base64);
            console.log(`College banner compressed to ${compressedSizeKB.toFixed(2)}KB`);
            setCollegeBanner(URL.createObjectURL(file));
            setCollegeBannerBase64(base64);
            setBannerUploadSuccess(true);
            setTimeout(() => setBannerUploadSuccess(false), 3000);
        } catch (error) {
            console.error('Error converting image:', error);
            alert('Failed to upload image. Please try again.');
        }
    };

    const handleNaacUpload = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload JPG, JPEG, PNG, or SVG file.');
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
            // Auto-compress if image is larger than 400KB
            const base64 = await fileToBase64WithCompression(file, 400);
            const compressedSizeKB = getBase64SizeKB(base64);
            console.log(`NAAC certificate compressed to ${compressedSizeKB.toFixed(2)}KB`);
            setNaacCertificate(URL.createObjectURL(file));
            setNaacCertificateBase64(base64);
            setNaacUploadSuccess(true);
            setTimeout(() => setNaacUploadSuccess(false), 3000);
        } catch (error) {
            console.error('Error converting image:', error);
            alert('Failed to upload image. Please try again.');
        }
    };

    const handleNbaUpload = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload JPG, JPEG, PNG, or SVG file.');
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
            // Auto-compress if image is larger than 400KB
            const base64 = await fileToBase64WithCompression(file, 400);
            const compressedSizeKB = getBase64SizeKB(base64);
            console.log(`NBA certificate compressed to ${compressedSizeKB.toFixed(2)}KB`);
            setNbaCertificate(URL.createObjectURL(file));
            setNbaCertificateBase64(base64);
            setNbaUploadSuccess(true);
            setTimeout(() => setNbaUploadSuccess(false), 3000);
        } catch (error) {
            console.error('Error converting image:', error);
            alert('Failed to upload image. Please try again.');
        }
    };

    const handleRemoveCollegeBanner = () => {
        setCollegeBanner(null);
        setCollegeBannerBase64('');
        const fileInput = document.getElementById('banner-upload');
        if (fileInput) fileInput.value = '';
    };

    const handleRemoveNaac = () => {
        setNaacCertificate(null);
        setNaacCertificateBase64('');
        const fileInput = document.getElementById('naac-upload');
        if (fileInput) fileInput.value = '';
    };

    const handleRemoveNba = () => {
        setNbaCertificate(null);
        setNbaCertificateBase64('');
        const fileInput = document.getElementById('nba-upload');
        if (fileInput) fileInput.value = '';
    };

    const handleCollegeLogoUpload = async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload JPG, JPEG, PNG, or SVG file.');
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
            // Auto-compress if image is larger than 400KB
            const base64 = await fileToBase64WithCompression(file, 400);
            const compressedSizeKB = getBase64SizeKB(base64);
            console.log(`College logo compressed to ${compressedSizeKB.toFixed(2)}KB`);
            setCollegeLogo(URL.createObjectURL(file));
            setCollegeLogoBase64(base64);
            setLogoUploadSuccess(true);
            setTimeout(() => setLogoUploadSuccess(false), 3000);
        } catch (error) {
            console.error('Error converting image:', error);
            alert('Failed to upload image. Please try again.');
        }
    };

    const handleRemoveCollegeLogo = () => {
        setCollegeLogo(null);
        setCollegeLogoBase64('');
        const fileInput = document.getElementById('logo-upload');
        if (fileInput) fileInput.value = '';
    };

    return (
        <>
            <AdNavbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
            {/* UPDATED CLASS: Admin-main-profile-layout */}
            <div className={styles['Admin-main-profile-layout']}>
                <AdSidebar isOpen={isSidebarOpen} onLogout={() => console.log('Logout Clicked')} />
                {/* UPDATED CLASS: Admin-main-profile-main-content */}
                <div className={styles['Admin-main-profile-main-content']}>
                    
                    {isLoading ? (
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
                    ) : (
                    <>
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
                                        
                                        <div className={styles['Admin-main-profile-date-wrapper']}>
                                            <DatePicker
                                                selected={parseDateValue(formData.dob)}
                                                onChange={handleDobChange}
                                                dateFormat="dd-MM-yyyy"
                                                placeholderText="DOB (dd-mm-yyyy)"
                                                className={`${styles['Admin-main-profile-form-input']} ${styles['Admin-main-profile-form-input-date']}`}
                                                showPopperArrow={false}
                                                showMonthDropdown
                                                showYearDropdown
                                                dropdownMode="select"
                                                yearDropdownItemNumber={100}
                                                scrollableYearDropdown
                                                minDate={new Date(new Date().getFullYear() - 80, 0, 1)}
                                                maxDate={new Date()}
                                                isClearable
                                                autoComplete="off"
                                                renderCustomHeader={({
                                                    date,
                                                    changeYear,
                                                    changeMonth,
                                                    decreaseMonth,
                                                    increaseMonth,
                                                    prevMonthButtonDisabled,
                                                    nextMonthButtonDisabled,
                                                }) => (
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '50px', padding: '10px' }}>
                                                        <select
                                                            value={date.getMonth()}
                                                            onChange={({ target: { value } }) => changeMonth(Number(value))}
                                                            style={{
                                                                padding: '5px',
                                                                borderRadius: '5px',
                                                                border: '1px solid #ddd',
                                                                fontSize: '14px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                                                                <option key={idx} value={idx}>{month}</option>
                                                            ))}
                                                        </select>
                                                        <select
                                                            value={date.getFullYear()}
                                                            onChange={({ target: { value } }) => changeYear(Number(value))}
                                                            style={{
                                                                padding: '5px',
                                                                borderRadius: '5px',
                                                                border: '1px solid #ddd',
                                                                fontSize: '14px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                                                                <option key={year} value={year}>{year}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            />
                                        </div>
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

                                {/* College Details Section */}
                                

                                {/* Change Login Details Button - Toggle visibility */}
                                <button 
                                    type="button"
                                    className={styles['Admin-main-profile-change-login-btn']}
                                    onClick={toggleLoginDetails}
                                >
                                    <KeyIcon />
                                    <span>Change Login Details</span>
                                    <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        width="20" 
                                        height="20" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="2" 
                                        strokeLinecap="round" 
                                        strokeLinejoin="round"
                                        style={{ 
                                            marginLeft: 'auto',
                                            transform: showLoginDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.3s ease'
                                        }}
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                            </div>
                            
                            {/* Right Side: Profile Photo Card */}
                            <aside className={styles['Admin-main-profile-photo-card']}>
                                <h3 className={styles['Admin-main-profile-section-header']}>Profile Photo</h3>
                                
                                <div className={styles['Admin-main-profile-photo-icon-container']}>
                                    {profilePhoto ? (
                                        <img
                                            src={profilePhoto}
                                            alt="Profile Preview"
                                            className={styles['Admin-main-profile-photo-preview']}
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
                        {showLoginDetails && (
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
                        )}

                        {/* College Details Section - Independent */}
                        <div className={styles['Admin-main-profile-college-section']}>
                            <h3 className={styles['Admin-main-profile-section-header']}>College Details</h3>
                            <div className={styles['Admin-main-profile-college-cards-grid']}>
                                {/* College Banner Card */}
                                <div className={styles['Admin-main-profile-college-card']}>
                                    <h4 className={styles['Admin-main-profile-college-card-title']}>College Banner</h4>
                                    <div className={styles['Admin-main-profile-college-preview']}>
                                        {collegeBanner ? (
                                            <img src={collegeBanner} alt="College Banner" className={styles['Admin-main-profile-college-image']} />
                                        ) : (
                                            <div className={styles['Admin-main-profile-college-placeholder']}>No Banner</div>
                                        )}
                                    </div>
                                    <div className={styles['Admin-main-profile-upload-btn-wrapper']}>
                                        <label htmlFor="banner-upload" className={styles['Admin-main-profile-profile-upload-btn']}>
                                            <div className={styles['Admin-main-profile-upload-btn-content']}>
                                                <MdUpload />
                                                <span>Upload (Max 500 KB)</span>
                                            </div>
                                        </label>
                                        {collegeBanner && (
                                            <button onClick={handleRemoveCollegeBanner} className={styles['Admin-main-profile-remove-image-btn']} aria-label="Remove banner">
                                                <IoMdClose />
                                            </button>
                                        )}
                                    </div>
                                    <input id="banner-upload" type="file" accept="image/jpeg,image/jpg,image/png,image/svg+xml" className={styles['Admin-main-profile-hidden-input']} onChange={handleCollegeBannerUpload} />
                                    {bannerUploadSuccess && <p className={styles['Admin-main-profile-upload-success-message']}>Banner uploaded!</p>}
                                    <p className={styles['Admin-main-profile-upload-hint']}>*JPG, JPEG, PNG, SVG formats allowed.</p>
                                </div>

                                {/* NAAC Card */}
                                <div className={styles['Admin-main-profile-college-card']}>
                                    <h4 className={styles['Admin-main-profile-college-card-title']}>NAAC Certificate</h4>
                                    <div className={styles['Admin-main-profile-college-preview']}>
                                        {naacCertificate ? (
                                            <img src={naacCertificate} alt="NAAC Certificate" className={styles['Admin-main-profile-college-image']} />
                                        ) : (
                                            <div className={styles['Admin-main-profile-college-placeholder']}>No Certificate</div>
                                        )}
                                    </div>
                                    <div className={styles['Admin-main-profile-upload-btn-wrapper']}>
                                        <label htmlFor="naac-upload" className={styles['Admin-main-profile-profile-upload-btn']}>
                                            <div className={styles['Admin-main-profile-upload-btn-content']}>
                                                <MdUpload />
                                                <span>Upload (Max 500 KB)</span>
                                            </div>
                                        </label>
                                        {naacCertificate && (
                                            <button onClick={handleRemoveNaac} className={styles['Admin-main-profile-remove-image-btn']} aria-label="Remove NAAC">
                                                <IoMdClose />
                                            </button>
                                        )}
                                    </div>
                                    <input id="naac-upload" type="file" accept="image/jpeg,image/jpg,image/png,image/svg+xml" className={styles['Admin-main-profile-hidden-input']} onChange={handleNaacUpload} />
                                    {naacUploadSuccess && <p className={styles['Admin-main-profile-upload-success-message']}>NAAC uploaded!</p>}
                                    <p className={styles['Admin-main-profile-upload-hint']}>*JPG, JPEG, PNG, SVG formats allowed.</p>
                                </div>

                                {/* NBA Card */}
                                <div className={styles['Admin-main-profile-college-card']}>
                                    <h4 className={styles['Admin-main-profile-college-card-title']}>NBA Certificate</h4>
                                    <div className={styles['Admin-main-profile-college-preview']}>
                                        {nbaCertificate ? (
                                            <img src={nbaCertificate} alt="NBA Certificate" className={styles['Admin-main-profile-college-image']} />
                                        ) : (
                                            <div className={styles['Admin-main-profile-college-placeholder']}>No Certificate</div>
                                        )}
                                    </div>
                                    <div className={styles['Admin-main-profile-upload-btn-wrapper']}>
                                        <label htmlFor="nba-upload" className={styles['Admin-main-profile-profile-upload-btn']}>
                                            <div className={styles['Admin-main-profile-upload-btn-content']}>
                                                <MdUpload />
                                                <span>Upload (Max 500 KB)</span>
                                            </div>
                                        </label>
                                        {nbaCertificate && (
                                            <button onClick={handleRemoveNba} className={styles['Admin-main-profile-remove-image-btn']} aria-label="Remove NBA">
                                                <IoMdClose />
                                            </button>
                                        )}
                                    </div>
                                    <input id="nba-upload" type="file" accept="image/jpeg,image/jpg,image/png,image/svg+xml" className={styles['Admin-main-profile-hidden-input']} onChange={handleNbaUpload} />
                                    {nbaUploadSuccess && <p className={styles['Admin-main-profile-upload-success-message']}>NBA uploaded!</p>}
                                    <p className={styles['Admin-main-profile-upload-hint']}>*JPG, JPEG, PNG, SVG formats allowed.</p>
                                </div>

                                {/* College Logo Card */}
                                <div className={styles['Admin-main-profile-college-card']}>
                                    <h4 className={styles['Admin-main-profile-college-card-title']}>College Logo</h4>
                                    <div className={styles['Admin-main-profile-college-preview']}>
                                        {collegeLogo ? (
                                            <img src={collegeLogo} alt="College Logo" className={styles['Admin-main-profile-college-image']} />
                                        ) : (
                                            <div className={styles['Admin-main-profile-college-placeholder']}>No Logo</div>
                                        )}
                                    </div>
                                    <div className={styles['Admin-main-profile-upload-btn-wrapper']}>
                                        <label htmlFor="logo-upload" className={styles['Admin-main-profile-profile-upload-btn']}>
                                            <div className={styles['Admin-main-profile-upload-btn-content']}>
                                                <MdUpload />
                                                <span>Upload (Max 500 KB)</span>
                                            </div>
                                        </label>
                                        {collegeLogo && (
                                            <button onClick={handleRemoveCollegeLogo} className={styles['Admin-main-profile-remove-image-btn']} aria-label="Remove Logo">
                                                <IoMdClose />
                                            </button>
                                        )}
                                    </div>
                                    <input id="logo-upload" type="file" accept="image/jpeg,image/jpg,image/png,image/svg+xml" className={styles['Admin-main-profile-hidden-input']} onChange={handleCollegeLogoUpload} />
                                    {logoUploadSuccess && <p className={styles['Admin-main-profile-upload-success-message']}>Logo uploaded!</p>}
                                    <p className={styles['Admin-main-profile-upload-hint']}>*JPG, JPEG, PNG, SVG formats allowed.</p>
                                </div>
                            </div>
                        </div>

                        

                        {/* Action Buttons */}
                        {/* UPDATED CLASSES: Admin-main-profile-action-buttons, Admin-main-profile-discard-btn, Admin-main-profile-save-btn */}
                        <div className={styles['Admin-main-profile-action-buttons']}>
                            <button 
                                type="button" 
                                className={styles['Admin-main-profile-discard-btn']} 
                                onClick={handleDiscard}
                                disabled={isSaving}
                            >
                                Discard
                            </button>
                            <button 
                                type="button" 
                                className={styles['Admin-main-profile-save-btn']} 
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </div>
                    </>
                    )}
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

            {/* File Size Error Popup */}
            <FileSizeErrorPopup
                isOpen={isFileSizeErrorOpen}
                onClose={closeFileSizeErrorPopup}
                fileSizeKB={fileSizeErrorKB}
            />

            {/* Success Popup */}
            <SuccessPopup
                isOpen={isSuccessPopupOpen}
                onClose={() => setIsSuccessPopupOpen(false)}
            />
        </>
    );
}

export default Admainprofile;