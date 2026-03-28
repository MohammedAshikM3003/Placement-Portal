import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import useAdminAuth from '../utils/useAdminAuth';
import LoadingSpinner from '../components/LoadingSpinner/LoadingSpinner';
import { API_BASE_URL } from '../utils/apiConfig';
import gridfsService from '../services/gridfsService';
// Assuming these paths are correct for your existing files
import AdNavbar from "../components/Navbar/Adnavbar.js";
import AdSidebar from "../components/Sidebar/Adsidebar.js";

// FIXED: Import CSS as a Module
import styles from './AdminmainProfile.module.css';

// Placeholder image
import Adminicon from "../assets/Adminicon.png"; 
import ProfileGraduationcap from "../assets/AdminProfileGraduationcap.svg"
// GridFS replaces base64 compression
// import { fileToBase64WithCompression, getBase64SizeKB } from '../utils/imageCompression';

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

// College Image Loading Spinner Component (Matches AdminCompanyDrive table loader)
const CollegeImageLoader = () => (
    <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10
    }}>
        <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #4EA24E',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
        <p style={{ 
            marginTop: '15px',
            fontSize: '13px', 
            color: '#666',
            fontWeight: '600'
        }}>Loading...</p>
    </div>
);

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
    // Initialize college images from cache to prevent "No Banner" flash
    const [collegeBanner, setCollegeBanner] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                return data.collegeBanner || null;
            }
        } catch (e) {}
        return null;
    });
    const [collegeBannerBase64, setCollegeBannerBase64] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                return data.collegeBanner || '';
            }
        } catch (e) {}
        return '';
    });
    const [naacCertificate, setNaacCertificate] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                return data.naacCertificate || null;
            }
        } catch (e) {}
        return null;
    });
    const [naacCertificateBase64, setNaacCertificateBase64] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                return data.naacCertificate || '';
            }
        } catch (e) {}
        return '';
    });
    const [nbaCertificate, setNbaCertificate] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                return data.nbaCertificate || null;
            }
        } catch (e) {}
        return null;
    });
    const [nbaCertificateBase64, setNbaCertificateBase64] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                return data.nbaCertificate || '';
            }
        } catch (e) {}
        return '';
    });
    const [collegeLogo, setCollegeLogo] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                return data.collegeLogo || null;
            }
        } catch (e) {}
        return null;
    });
    const [collegeLogoBase64, setCollegeLogoBase64] = useState(() => {
        try {
            const cachedProfile = localStorage.getItem('adminProfileCache');
            if (cachedProfile) {
                const data = JSON.parse(cachedProfile);
                return data.collegeLogo || '';
            }
        } catch (e) {}
        return '';
    });
    const [bannerUploadSuccess, setBannerUploadSuccess] = useState(false);
    const [naacUploadSuccess, setNaacUploadSuccess] = useState(false);
    const [nbaUploadSuccess, setNbaUploadSuccess] = useState(false);
    const [logoUploadSuccess, setLogoUploadSuccess] = useState(false);
    // Raw File objects for GridFS upload (set when user picks a new file)
    const [profilePhotoFile, setProfilePhotoFile] = useState(null);
    const [collegeBannerFile, setCollegeBannerFile] = useState(null);
    const [naacCertificateFile, setNaacCertificateFile] = useState(null);
    const [nbaCertificateFile, setNbaCertificateFile] = useState(null);
    const [collegeLogoFile, setCollegeLogoFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);
    
    // HYPER-FAST: Initialize loading states based on cache availability
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
    
    // Always show loading spinners initially (will be hidden after server fetch)
    const [isBannerLoading, setIsBannerLoading] = useState(true);
    const [isNaacLoading, setIsNaacLoading] = useState(true);
    const [isNbaLoading, setIsNbaLoading] = useState(true);
    const [isLogoLoading, setIsLogoLoading] = useState(true);
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
                            
                            // Load profile photo from cache (resolve GridFS URLs for display)
                            if (profileData.profilePhoto) {
                                const resolvedPhoto = gridfsService.resolveImageUrl(profileData.profilePhoto);
                                setProfilePhoto(resolvedPhoto);
                                setProfilePhotoBase64(resolvedPhoto);
                            }
                            
                            // Load college images from cache if available (resolve GridFS URLs)
                            if (profileData.collegeBanner) {
                                const resolved = gridfsService.resolveImageUrl(profileData.collegeBanner);
                                setCollegeBanner(resolved);
                                setCollegeBannerBase64(resolved);
                                console.log('✅ College banner loaded from cache');
                            }
                            if (profileData.naacCertificate) {
                                const resolved = gridfsService.resolveImageUrl(profileData.naacCertificate);
                                setNaacCertificate(resolved);
                                setNaacCertificateBase64(resolved);
                                console.log('✅ NAAC certificate loaded from cache');
                            }
                            if (profileData.nbaCertificate) {
                                const resolved = gridfsService.resolveImageUrl(profileData.nbaCertificate);
                                setNbaCertificate(resolved);
                                setNbaCertificateBase64(resolved);
                                console.log('✅ NBA certificate loaded from cache');
                            }
                            if (profileData.collegeLogo) {
                                const resolved = gridfsService.resolveImageUrl(profileData.collegeLogo);
                                setCollegeLogo(resolved);
                                setCollegeLogoBase64(resolved);
                                console.log('✅ College logo loaded from cache');
                            }
                            
                            // Keep loading spinners visible - will hide after server fetch completes
                            console.log('✅ Profile and images loaded instantly from cache');
                            console.log('🔄 Keeping spinners visible while fetching fresh data from server...');
                            setDataLoaded(true);
                            setIsLoading(false);
                            // Continue to fetch from server for any updates (don't return early)
                        }
                    } catch (err) {
                        console.warn('Cache parse error:', err);
                    }
                }
                
                // Fetch from server to get college images (even if profile was cached)
                const authToken = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE_URL}/admin/profile/${adminLoginID}`, {
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
                    
                    // Load images and hide spinners after server data is received
                    if (profilePhotoUrl) {
                        const resolvedPhoto = gridfsService.resolveImageUrl(profilePhotoUrl);
                        setProfilePhoto(resolvedPhoto);
                        setProfilePhotoBase64(resolvedPhoto);
                    }
                    
                    // College Banner (resolve GridFS URL for display)
                    if (data.collegeBanner) {
                        const resolved = gridfsService.resolveImageUrl(data.collegeBanner);
                        setCollegeBanner(resolved);
                        setCollegeBannerBase64(resolved);
                        console.log('✅ College banner fetched from server');
                    }
                    setIsBannerLoading(false);
                    
                    // NAAC Certificate
                    if (data.naacCertificate) {
                        const resolved = gridfsService.resolveImageUrl(data.naacCertificate);
                        setNaacCertificate(resolved);
                        setNaacCertificateBase64(resolved);
                        console.log('✅ NAAC certificate fetched from server');
                    }
                    setIsNaacLoading(false);
                    
                    // NBA Certificate
                    if (data.nbaCertificate) {
                        const resolved = gridfsService.resolveImageUrl(data.nbaCertificate);
                        setNbaCertificate(resolved);
                        setNbaCertificateBase64(resolved);
                        console.log('✅ NBA certificate fetched from server');
                    }
                    setIsNbaLoading(false);
                    
                    // College Logo
                    if (data.collegeLogo) {
                        const resolved = gridfsService.resolveImageUrl(data.collegeLogo);
                        setCollegeLogo(resolved);
                        setCollegeLogoBase64(resolved);
                        console.log('✅ College logo fetched from server');
                    }
                    setIsLogoLoading(false);
                    
                    console.log('✅ All college images loaded - spinners hidden');
                    
                    // 💾 Cache profile data with resolved URLs (including college images on first load)
                    const profileCacheData = {
                        adminLoginID: data.adminLoginID,
                        firstName: data.firstName,
                        lastName: data.lastName,
                        dob: data.dob,
                        gender: data.gender,
                        emailId: data.emailId,
                        domainMailId: data.domainMailId,
                        phoneNumber: data.phoneNumber,
                        department: data.department,
                        profilePhoto: gridfsService.resolveImageUrl(profilePhotoUrl),
                        collegeBanner: gridfsService.resolveImageUrl(data.collegeBanner) || null,
                        naacCertificate: gridfsService.resolveImageUrl(data.naacCertificate) || null,
                        nbaCertificate: gridfsService.resolveImageUrl(data.nbaCertificate) || null,
                        collegeLogo: gridfsService.resolveImageUrl(data.collegeLogo) || null,
                        timestamp: Date.now()
                    };
                    try {
                        localStorage.setItem('adminProfileCache', JSON.stringify(profileCacheData));
                        localStorage.setItem('adminProfileCacheTime', Date.now().toString());
                        console.log('✅ Admin profile cached successfully (including college images)');
                    } catch (quotaError) {
                        console.warn('⚠️ Could not cache profile due to storage quota - trying without images:', quotaError);
                        // Fallback: Cache without college images if quota exceeded
                        try {
                            const minimalCache = {
                                adminLoginID: data.adminLoginID,
                                firstName: data.firstName,
                                lastName: data.lastName,
                                dob: data.dob,
                                gender: data.gender,
                                emailId: data.emailId,
                                domainMailId: data.domainMailId,
                                phoneNumber: data.phoneNumber,
                                department: data.department,
                                profilePhoto: profilePhotoUrl,
                                timestamp: Date.now()
                            };
                            localStorage.setItem('adminProfileCache', JSON.stringify(minimalCache));
                            console.log('✅ Admin profile cached without college images (quota limit)');
                        } catch (fallbackError) {
                            console.warn('⚠️ Could not cache even minimal profile:', fallbackError);
                        }
                    }
                    
                    setDataLoaded(true);
                    setIsLoading(false);
                    }
                }
            } catch (error) {
                console.error('Error loading admin data:', error);
                setIsLoading(false);
                // Set all image loading states to false on error
                setIsBannerLoading(false);
                setIsNaacLoading(false);
                setIsNbaLoading(false);
                setIsLogoLoading(false);
            }
        };
        
        loadAdminData();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle mobile number input changes
    const handleMobileChange = (e) => {
        let value = e.target.value;
        // Remove leading zeros
        value = value.replace(/^0+/, '');
        // Only allow digits
        value = value.replace(/\D/g, '');
        // Limit to 10 digits
        value = value.substring(0, 10);
        setFormData(prev => ({ ...prev, phoneNumber: value }));
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
        if (file.type !== 'image/jpeg' && file.type !== 'image/webp') {
            alert('Invalid file type. Please upload a JPG or WebP file.');
            return;
        }
        const fileSizeKB = (file.size / 1024).toFixed(2);
        if (file.size > 500 * 1024) {
            setFileSizeErrorKB(fileSizeKB);
            setIsFileSizeErrorOpen(true);
            e.target.value = '';
            return;
        }
        // Store raw File for GridFS upload on save
        setProfilePhotoFile(file);
        setProfilePhoto(URL.createObjectURL(file));
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 5000);
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
        setProfilePhotoFile(null);
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
            const response = await fetch(`${API_BASE_URL}/admin/profile/${adminLoginID}`, {
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
                
                // Reload images (resolve GridFS URLs for display)
                const resolvedProfile = gridfsService.resolveImageUrl(data.profilePhoto);
                const resolvedBanner = gridfsService.resolveImageUrl(data.collegeBanner);
                const resolvedNaac = gridfsService.resolveImageUrl(data.naacCertificate);
                const resolvedNba = gridfsService.resolveImageUrl(data.nbaCertificate);
                const resolvedLogo = gridfsService.resolveImageUrl(data.collegeLogo);
                setProfilePhoto(resolvedProfile || null);
                setProfilePhotoBase64(resolvedProfile || '');
                setCollegeBanner(resolvedBanner || null);
                setCollegeBannerBase64(resolvedBanner || '');
                setNaacCertificate(resolvedNaac || null);
                setNaacCertificateBase64(resolvedNaac || '');
                setNbaCertificate(resolvedNba || null);
                setNbaCertificateBase64(resolvedNba || '');
                setCollegeLogo(resolvedLogo || null);
                setCollegeLogoBase64(resolvedLogo || '');
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
            
            // Upload any new files to GridFS first
            const adminLoginID = loginData.currentLoginId || getAdminLoginID();
            
            // Upload profile photo if a new file was selected
            let profilePhotoUrl = profilePhotoBase64; // keep existing URL/value
            if (profilePhotoFile) {
                try {
                    const result = await gridfsService.uploadProfileImage(profilePhotoFile, adminLoginID, 'admin');
                    profilePhotoUrl = result.url;
                    setProfilePhotoBase64(profilePhotoUrl);
                    setProfilePhotoFile(null);
                    console.log('✅ Profile photo uploaded to GridFS:', profilePhotoUrl);
                } catch (uploadErr) {
                    console.error('Failed to upload profile photo:', uploadErr);
                    alert('Failed to upload profile photo. Please try again.');
                    setIsSaving(false);
                    return;
                }
            }
            
            // Upload college images if new files were selected
            const collegeFiles = {};
            if (collegeBannerFile) collegeFiles.collegeBanner = collegeBannerFile;
            if (naacCertificateFile) collegeFiles.naacCertificate = naacCertificateFile;
            if (nbaCertificateFile) collegeFiles.nbaCertificate = nbaCertificateFile;
            if (collegeLogoFile) collegeFiles.collegeLogo = collegeLogoFile;
            
            let collegeBannerUrl = collegeBannerBase64;
            let naacCertificateUrl = naacCertificateBase64;
            let nbaCertificateUrl = nbaCertificateBase64;
            let collegeLogoUrl = collegeLogoBase64;
            
            if (Object.keys(collegeFiles).length > 0) {
                try {
                    const result = await gridfsService.uploadCollegeImages(collegeFiles, adminLoginID);
                    if (result.collegeBanner) { collegeBannerUrl = result.collegeBanner.url; setCollegeBannerBase64(collegeBannerUrl); setCollegeBannerFile(null); }
                    if (result.naacCertificate) { naacCertificateUrl = result.naacCertificate.url; setNaacCertificateBase64(naacCertificateUrl); setNaacCertificateFile(null); }
                    if (result.nbaCertificate) { nbaCertificateUrl = result.nbaCertificate.url; setNbaCertificateBase64(nbaCertificateUrl); setNbaCertificateFile(null); }
                    if (result.collegeLogo) { collegeLogoUrl = result.collegeLogo.url; setCollegeLogoBase64(collegeLogoUrl); setCollegeLogoFile(null); }
                    console.log('✅ College images uploaded to GridFS');
                } catch (uploadErr) {
                    console.error('Failed to upload college images:', uploadErr);
                    alert('Failed to upload college images. Please try again.');
                    setIsSaving(false);
                    return;
                }
            }
            
            // Resolve all GridFS URLs to full backend URLs for display, caching, and sidebar
            // IMPORTANT: If user removed an image (empty string), send null to MongoDB to clear it
            profilePhotoUrl = profilePhotoUrl ? gridfsService.resolveImageUrl(profilePhotoUrl) : null;
            collegeBannerUrl = collegeBannerUrl ? gridfsService.resolveImageUrl(collegeBannerUrl) : null;
            naacCertificateUrl = naacCertificateUrl ? gridfsService.resolveImageUrl(naacCertificateUrl) : null;
            nbaCertificateUrl = nbaCertificateUrl ? gridfsService.resolveImageUrl(nbaCertificateUrl) : null;
            collegeLogoUrl = collegeLogoUrl ? gridfsService.resolveImageUrl(collegeLogoUrl) : null;
            
            // Prepare data to send (GridFS URLs instead of base64)
            // Send null for removed images so MongoDB clears them
            const dataToSave = {
                adminLoginID: adminLoginID,
                ...formData,
                // Images (GridFS URLs or null if removed)
                profilePhoto: profilePhotoUrl || null,
                profilePhotoName: profilePhotoUrl ? 'profile.jpg' : null,
                collegeBanner: collegeBannerUrl || null,
                collegeBannerName: collegeBannerUrl ? 'banner.jpg' : null,
                naacCertificate: naacCertificateUrl || null,
                naacCertificateName: naacCertificateUrl ? 'naac.jpg' : null,
                nbaCertificate: nbaCertificateUrl || null,
                nbaCertificateName: nbaCertificateUrl ? 'nba.jpg' : null,
                collegeLogo: collegeLogoUrl || null,
                collegeLogoName: collegeLogoUrl ? 'logo.jpg' : null,
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
            
            // Log cleared images for debugging
            const clearedImages = [];
            if (dataToSave.collegeBanner === null) clearedImages.push('collegeBanner');
            if (dataToSave.naacCertificate === null) clearedImages.push('naacCertificate');
            if (dataToSave.nbaCertificate === null) clearedImages.push('nbaCertificate');
            if (dataToSave.collegeLogo === null) clearedImages.push('collegeLogo');
            if (clearedImages.length > 0) {
                console.log(`🗑️ Sending null to clear images: ${clearedImages.join(', ')}`);
            }
            
            const authToken = localStorage.getItem('authToken');
            const response = await fetch(`${API_BASE_URL}/admin/profile`, {
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
                
                // � INSTANT SYNC: Dispatch sidebar event FIRST (before any async cache ops)
                // This ensures the sidebar updates immediately with zero delay
                const updatedAdminData = {
                    _id: result.data?._id,
                    adminLoginID: adminLoginID,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    profilePhoto: profilePhotoUrl,
                    emailId: formData.emailId,
                    personalEmail: formData.personalEmail,
                    phoneNumber: formData.phoneNumber,
                    department: formData.department,
                    dateOfBirth: formData.dateOfBirth,
                    gender: formData.gender,
                    collegeBanner: collegeBannerUrl,
                    naacCertificate: naacCertificateUrl,
                    nbaCertificate: nbaCertificateUrl,
                    collegeLogo: collegeLogoUrl,
                    updatedAt: new Date().toISOString()
                };
                window.dispatchEvent(new CustomEvent('adminProfileUpdated', { 
                    detail: updatedAdminData 
                }));
                console.log('🔔 Complete admin profile data sent to sidebar - ZERO DELAY (Student Pattern)');
                
                // Update display states — ALWAYS set, even to null, so removed images disappear immediately
                setProfilePhoto(profilePhotoUrl);
                setProfilePhotoBase64(profilePhotoUrl || '');
                setCollegeBanner(collegeBannerUrl);
                setCollegeBannerBase64(collegeBannerUrl || '');
                setNaacCertificate(naacCertificateUrl);
                setNaacCertificateBase64(naacCertificateUrl || '');
                setNbaCertificate(nbaCertificateUrl);
                setNbaCertificateBase64(nbaCertificateUrl || '');
                setCollegeLogo(collegeLogoUrl);
                setCollegeLogoBase64(collegeLogoUrl || '');
                
                // Show success popup
                setIsSuccessPopupOpen(true);
                
                // 1. Clear the specific Admin Profile Cache (stops ghosting in Admin panel)
                localStorage.removeItem('adminProfileCache');
                localStorage.removeItem('adminProfileCacheTime');
                console.log('🗑️ Admin profile state cache cleared');
                
                // 🖼️ Update cached profile photo URL if changed
                if (profilePhotoUrl) {
                    try {
                        const { default: adminImageCacheService } = await import('../services/adminImageCacheService.jsx');
                        await adminImageCacheService.cacheAdminProfilePhoto(adminLoginID, profilePhotoUrl);
                        console.log('✅ Admin profile photo cache updated after save');
                    } catch (cacheError) {
                        console.warn('⚠️ Failed to update admin profile photo cache after save:', cacheError);
                    }
                }
                
                // 2. Clear dashboard caches (collegeImagesService)
                try {
                    const { clearCache } = await import('../services/collegeImagesService');
                    clearCache();
                    console.log('✅ College images cache cleared (dashboards)');
                } catch (cacheError) {
                    console.warn('⚠️ Failed to clear college images cache:', cacheError);
                }
                
                // 3. Clear landing page caches
                try {
                    const { clearCollegeImagesCache } = await import('../services/landingPageCacheService');
                    clearCollegeImagesCache();
                    console.log('✅ Landing page college images cache cleared');
                } catch (cacheError) {
                    console.warn('⚠️ Failed to clear landing page cache:', cacheError);
                }
                
                // 4. Trigger the UI Refresh event (same tab)
                window.dispatchEvent(new CustomEvent('collegeImagesUpdated', { 
                    detail: { timestamp: Date.now() } 
                }));
                
                // 5. Cross-tab signal: write a localStorage key so OTHER tabs (e.g. landing page) auto-refresh
                // The 'storage' event only fires in OTHER tabs, the CustomEvent above handles this tab
                localStorage.setItem('collegeImagesUpdatedSignal', Date.now().toString());
                console.log('🔔 College images update dispatched (same-tab + cross-tab)');
                
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
                
                // (sidebar event + display states already dispatched above)
            } else {
                setSaveStatus('error');
                alert(result.message || 'Failed to save profile. Please try again.');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            setSaveStatus('error');
            
            // Provide specific error messages
            if (error.name === 'QuotaExceededError') {
                alert('Storage quota exceeded. Your profile has been saved to the server successfully, but some data could not be cached locally. This will not affect functionality.');
            } else if (error.message && error.message.includes('network')) {
                alert('Network error. Please check your internet connection and try again.');
            } else {
                alert('Error saving profile. Please try again.');
            }
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
        if (file.size > 5 * 1024 * 1024) {
            setFileSizeErrorKB(fileSizeKB);
            setIsFileSizeErrorOpen(true);
            e.target.value = '';
            return;
        }
        // Store raw File for GridFS upload on save
        setCollegeBannerFile(file);
        setCollegeBanner(URL.createObjectURL(file));
        setBannerUploadSuccess(true);
        setTimeout(() => setBannerUploadSuccess(false), 3000);
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
        // Store raw File for GridFS upload on save
        setNaacCertificateFile(file);
        setNaacCertificate(URL.createObjectURL(file));
        setNaacUploadSuccess(true);
        setTimeout(() => setNaacUploadSuccess(false), 3000);
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
        // Store raw File for GridFS upload on save
        setNbaCertificateFile(file);
        setNbaCertificate(URL.createObjectURL(file));
        setNbaUploadSuccess(true);
        setTimeout(() => setNbaUploadSuccess(false), 3000);
    };

    const handleRemoveCollegeBanner = () => {
        setCollegeBanner(null);
        setCollegeBannerBase64('');
        setCollegeBannerFile(null);
        const fileInput = document.getElementById('banner-upload');
        if (fileInput) fileInput.value = '';
    };

    const handleRemoveNaac = () => {
        setNaacCertificate(null);
        setNaacCertificateBase64('');
        setNaacCertificateFile(null);
        const fileInput = document.getElementById('naac-upload');
        if (fileInput) fileInput.value = '';
    };

    const handleRemoveNba = () => {
        setNbaCertificate(null);
        setNbaCertificateBase64('');
        setNbaCertificateFile(null);
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
        // Store raw File for GridFS upload on save
        setCollegeLogoFile(file);
        setCollegeLogo(URL.createObjectURL(file));
        setLogoUploadSuccess(true);
        setTimeout(() => setLogoUploadSuccess(false), 3000);
    };

    const handleRemoveCollegeLogo = () => {
        setCollegeLogo(null);
        setCollegeLogoBase64('');
        setCollegeLogoFile(null);
        const fileInput = document.getElementById('logo-upload');
        if (fileInput) fileInput.value = '';
    };

    return (
        <>
            <AdNavbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
            {/* UPDATED CLASS: Admin-main-profile-layout */}
            {isSaving && <div className={styles['admin-profile-saving-overlay']} />}
            <div className={`${styles['Admin-main-profile-layout']} ${isSaving ? styles['admin-profile-saving'] : ''}`}>
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
                                        <input type="text" name="firstName" placeholder="First Name" className={styles['Admin-main-profile-form-input']} value={formData.firstName} onChange={handleInputChange} disabled={isSaving} />
                                        <input type="text" name="lastName" placeholder="Last Name" className={styles['Admin-main-profile-form-input']} value={formData.lastName} onChange={handleInputChange} disabled={isSaving} />
                                        
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
                                                disabled={isSaving}
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
                                        <select name="gender" className={`${styles['Admin-main-profile-form-input']} ${styles['Admin-main-profile-form-select']}`} value={formData.gender} onChange={handleInputChange} disabled={isSaving}>
                                            <option value="" disabled hidden>Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        
                                        <input type="email" name="emailId" placeholder="Email id" className={styles['Admin-main-profile-form-input']} value={formData.emailId} onChange={handleInputChange} disabled={isSaving} />
                                        <input type="email" name="domainMailId" placeholder="Domain Mail id" className={styles['Admin-main-profile-form-input']} value={formData.domainMailId} onChange={handleInputChange} disabled={isSaving} />
                                        
                                        <div className={styles['mobileInputWrapper']}>
                                            <div className={styles['countryCode']}>+91</div>
                                            <input type="tel" name="phoneNumber" placeholder="Phone number" className={styles['mobileNumberInput']} value={formData.phoneNumber} onChange={handleMobileChange} disabled={isSaving} />
                                        </div>
                                        <input type="text" name="department" placeholder="Department" className={styles['Admin-main-profile-form-input']} value={formData.department} onChange={handleInputChange} disabled={isSaving} />
                                    </div>
                                </section>

                                {/* College Details Section */}
                                

                                {/* Change Login Details Button - Toggle visibility */}
                                <button 
                                    type="button"
                                    className={styles['Admin-main-profile-change-login-btn']}
                                    onClick={toggleLoginDetails}
                                    disabled={isSaving}
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
                                            <button onClick={handleRemovePhoto} className={styles['Admin-main-profile-remove-image-btn']} aria-label="Remove image" disabled={isSaving}>
                                                <IoMdClose />
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        className={styles['Admin-main-profile-hidden-input']}
                                        onChange={handlePhotoUpload}
                                        disabled={isSaving}
                                    />
                                    {uploadSuccess && (
                                        <p className={styles['Admin-main-profile-upload-success-message']}>Profile Photo uploaded Successfully!</p>
                                    )}
                                    <p className={styles['Admin-main-profile-upload-hint']}>*JPG and WebP formats allowed.</p>
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
                                <input type="text" name="currentLoginId" placeholder="Current Login ID" className={styles['Admin-main-profile-form-input-login']} value={loginData.currentLoginId} onChange={handleLoginInputChange} disabled={isSaving} />
                                <input type="text" name="newLoginId" placeholder="New Login ID" className={styles['Admin-main-profile-form-input-login']} value={loginData.newLoginId} onChange={handleLoginInputChange} disabled={isSaving} />
                                <input type="text" name="confirmLoginId" placeholder="Confirm Login ID" className={styles['Admin-main-profile-form-input-login']} value={loginData.confirmLoginId} onChange={handleLoginInputChange} disabled={isSaving} />
                            </div>
                            <div className={styles['Admin-main-profile-input-grid-three-col']}>
                                <input type="password" name="currentPassword" placeholder="Current Password" className={styles['Admin-main-profile-form-input-login']} value={loginData.currentPassword} onChange={handleLoginInputChange} disabled={isSaving} />
                                <input type="password" name="newPassword" placeholder="New Password" className={styles['Admin-main-profile-form-input-login']} value={loginData.newPassword} onChange={handleLoginInputChange} disabled={isSaving} />
                                <input type="password" name="confirmPassword" placeholder="Confirm Password" className={styles['Admin-main-profile-form-input-login']} value={loginData.confirmPassword} onChange={handleLoginInputChange} disabled={isSaving} />
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
                                    <div className={styles['Admin-main-profile-college-preview']} style={{ position: 'relative' }}>
                                        {isBannerLoading ? (
                                            <CollegeImageLoader />
                                        ) : collegeBanner ? (
                                            <img src={collegeBanner} alt="College Banner" className={styles['Admin-main-profile-college-image']} />
                                        ) : (
                                            <div className={styles['Admin-main-profile-college-placeholder']}>No Banner</div>
                                        )}
                                    </div>
                                    <div className={styles['Admin-main-profile-upload-btn-wrapper']}>
                                        <label htmlFor="banner-upload" className={styles['Admin-main-profile-profile-upload-btn']}>
                                            <div className={styles['Admin-main-profile-upload-btn-content']}>
                                                <MdUpload />
                                                <span>Upload (Max 5 MB)</span>
                                            </div>
                                        </label>
                                        {collegeBanner && (
                                            <button onClick={handleRemoveCollegeBanner} className={styles['Admin-main-profile-remove-image-btn']} aria-label="Remove banner" disabled={isSaving}>
                                                <IoMdClose />
                                            </button>
                                        )}
                                    </div>
                                    <input id="banner-upload" type="file" accept=".jpg,.jpeg,.png,.svg,image/*" className={styles['Admin-main-profile-hidden-input']} onChange={handleCollegeBannerUpload} disabled={isSaving} />
                                    {bannerUploadSuccess && <p className={styles['Admin-main-profile-upload-success-message']}>Banner uploaded!</p>}
                                    <p className={styles['Admin-main-profile-upload-hint']}>*JPG, JPEG, PNG, SVG formats allowed.</p>
                                </div>

                                {/* NAAC Card */}
                                <div className={styles['Admin-main-profile-college-card']}>
                                    <h4 className={styles['Admin-main-profile-college-card-title']}>NAAC Certificate</h4>
                                    <div className={styles['Admin-main-profile-college-preview']} style={{ position: 'relative' }}>
                                        {isNaacLoading ? (
                                            <CollegeImageLoader />
                                        ) : naacCertificate ? (
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
                                            <button onClick={handleRemoveNaac} className={styles['Admin-main-profile-remove-image-btn']} aria-label="Remove NAAC" disabled={isSaving}>
                                                <IoMdClose />
                                            </button>
                                        )}
                                    </div>
                                    <input id="naac-upload" type="file" accept=".jpg,.jpeg,.png,.svg,image/*" className={styles['Admin-main-profile-hidden-input']} onChange={handleNaacUpload} disabled={isSaving} />
                                    {naacUploadSuccess && <p className={styles['Admin-main-profile-upload-success-message']}>NAAC uploaded!</p>}
                                    <p className={styles['Admin-main-profile-upload-hint']}>*JPG, JPEG, PNG, SVG formats allowed.</p>
                                </div>

                                {/* NBA Card */}
                                <div className={styles['Admin-main-profile-college-card']}>
                                    <h4 className={styles['Admin-main-profile-college-card-title']}>NBA Certificate</h4>
                                    <div className={styles['Admin-main-profile-college-preview']} style={{ position: 'relative' }}>
                                        {isNbaLoading ? (
                                            <CollegeImageLoader />
                                        ) : nbaCertificate ? (
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
                                            <button onClick={handleRemoveNba} className={styles['Admin-main-profile-remove-image-btn']} aria-label="Remove NBA" disabled={isSaving}>
                                                <IoMdClose />
                                            </button>
                                        )}
                                    </div>
                                    <input id="nba-upload" type="file" accept=".jpg,.jpeg,.png,.svg,image/*" className={styles['Admin-main-profile-hidden-input']} onChange={handleNbaUpload} disabled={isSaving} />
                                    {nbaUploadSuccess && <p className={styles['Admin-main-profile-upload-success-message']}>NBA uploaded!</p>}
                                    <p className={styles['Admin-main-profile-upload-hint']}>*JPG, JPEG, PNG, SVG formats allowed.</p>
                                </div>

                                {/* College Logo Card */}
                                <div className={styles['Admin-main-profile-college-card']}>
                                    <h4 className={styles['Admin-main-profile-college-card-title']}>College Logo</h4>
                                    <div className={styles['Admin-main-profile-college-preview']} style={{ position: 'relative' }}>
                                        {isLogoLoading ? (
                                            <CollegeImageLoader />
                                        ) : collegeLogo ? (
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
                                            <button onClick={handleRemoveCollegeLogo} className={styles['Admin-main-profile-remove-image-btn']} aria-label="Remove Logo" disabled={isSaving}>
                                                <IoMdClose />
                                            </button>
                                        )}
                                    </div>
                                    <input id="logo-upload" type="file" accept=".jpg,.jpeg,.png,.svg,image/*" className={styles['Admin-main-profile-hidden-input']} onChange={handleCollegeLogoUpload} disabled={isSaving} />
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