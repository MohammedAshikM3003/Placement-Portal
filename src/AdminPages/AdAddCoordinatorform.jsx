import React, { useState, useEffect, useMemo, useRef } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import AdNavbar from "../components/Navbar/Adnavbar.js";
import AdSidebar from "../components/Sidebar/Adsidebar.js";
// FIXED: Import CSS as a Module
import styles from './AdAddCoordinatorform.module.css';
import Adminicon from "../assets/Adminicon.png"; 
import ProfileGraduationcap from "../assets/VectorGC.svg";
import mongoDBService from "../services/mongoDBService.jsx";
import { PreviewProgressAlert } from '../components/alerts/DownloadPreviewAlerts.js';

// --- Icon components (Updated to use 'styles') ---
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

const DropdownIcon = () => (
    // UPDATED: Use styles['Admin-cood-detail-dropdown-icon']
    <svg xmlns="http://www.w3.org/2000/svg" width="292.4" height="292.4" viewBox="0 0 292.4 292.4" className={styles['Admin-cood-detail-dropdown-icon']}>
        <path fill="#999" d="M287 69.4a17.6 17.6 0 0 0-13-5.4H18.4c-4.9 0-9.2 1.8-12.9 5.4-3.7 3.6-5.5 8-5.5 13s1.8 9.4 5.5 13l128.8 128.8c3.7 3.7 8 5.5 13 5.5s9.4-1.8 13-5.5l128.8-128.8c3.7-3.6 5.4-8 5.4-13s-1.7-9.4-5.4-13z"/>
    </svg>
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

const normalizeString = (value) => {
    if (value === null || value === undefined) return '';
    return value.toString().trim();
};

const degreeOptionValue = (degree) => normalizeString(degree?.degreeAbbreviation) || normalizeString(degree?.degreeFullName) || normalizeString(degree?.id) || normalizeString(degree?._id);

const normalizeForMatch = (value) => normalizeString(value).toUpperCase();

const branchSelectValue = (branch) => normalizeString(branch?.branchAbbreviation) || normalizeString(branch?.branchFullName) || normalizeString(branch?.branchCode) || normalizeString(branch?.id) || normalizeString(branch?._id);

function AdminCoDet() {
    useAdminAuth(); // JWT authentication verification
    const navigate = useNavigate();
    const location = useLocation();
    const urlSearchParams = useMemo(() => new URLSearchParams(location.search || ''), [location.search]);
    const branchParam = normalizeString(urlSearchParams.get('branch'));
    const editIdParam = normalizeString(urlSearchParams.get('editId'));
    const viewIdParam = normalizeString(urlSearchParams.get('viewId'));
    const branchState = normalizeString(location.state?.branchCode);
    const preselectedBranchRaw = branchState || branchParam;
    const preselectedBranchCode = normalizeForMatch(preselectedBranchRaw);
    const isEditMode = Boolean(editIdParam);
    const isViewMode = Boolean(viewIdParam);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dob: null,
        gender: '',
        emailId: '',
        domainMailId: '',
        phoneNumber: '',
        coordinatorId: '',
        cabin: '',
        password: '',
        confirmPassword: '',
        degree: '',
        branch: ''
    });
    
    const [errors, setErrors] = useState({});
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [profilePhotoData, setProfilePhotoData] = useState(null);
    const [photoDetails, setPhotoDetails] = useState({ fileName: null, uploadDate: null });
    const [isModalOpen, setIsModalOpen] = useState(false); 
    const [saveStatus, setSaveStatus] = useState(null);
    const [popupMessage, setPopupMessage] = useState(null);
    const [degrees, setDegrees] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedDegree, setSelectedDegree] = useState('');
    const [lockedBranchMeta, setLockedBranchMeta] = useState(null);
    const [lockedDegreeValue, setLockedDegreeValue] = useState('');

    const [isSaving, setIsSaving] = useState(false);

    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
    const [showSuccessModal, setShowSuccessModal] = useState(false); // Success modal state
    const [isFileSizeErrorOpen, setIsFileSizeErrorOpen] = useState(false);
    const [fileSizeErrorKB, setFileSizeErrorKB] = useState('');
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);

    const genderSelectRef = useRef(null);
    const degreeSelectRef = useRef(null);
    const branchSelectRef = useRef(null);
    const previewObjectUrlRef = useRef(null);

    // ... (useEffect for layout remains the same) ...
    useEffect(() => {
        const handleResize = () => {
            const isDesktop = window.innerWidth > 768;
            setIsSidebarOpen(isDesktop);
            if (isDesktop) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = isSidebarOpen ? 'hidden' : 'auto';
            }
        };
        handleResize(); 
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            document.body.style.overflow = 'auto';
        };
    }, [isSidebarOpen]);

    useEffect(() => {
        if (window.innerWidth <= 768) {
            document.body.style.overflow = isSidebarOpen ? 'hidden' : 'auto';
        }
    }, [isSidebarOpen]);

    // NEW: Fetch coordinator data when in edit or view mode
    useEffect(() => {
        const coordinatorId = editIdParam || viewIdParam;
        if ((isEditMode || isViewMode) && coordinatorId) {
            const fetchCoordinatorData = async () => {
                try {
                    // Start loading
                    setLoadingProgress(0);
                    setIsInitialLoading(true);

                    // Progress animation
                    const progressInterval = setInterval(() => {
                        setLoadingProgress(p => {
                            const next = p + Math.random() * 15;
                            return next >= 70 ? 70 : next;
                        });
                    }, 150);

                    const response = await mongoDBService.getCoordinatorById(coordinatorId);
                    const coordinator = response?.coordinator;
                    
                    clearInterval(progressInterval);
                    setLoadingProgress(90);
                    
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
                            coordinatorId: coordinator.coordinatorId || '',
                            cabin: coordinator.cabin || '',
                            password: '',
                            confirmPassword: '',
                            degree: coordinator.degree || '',
                            branch: coordinator.department || ''
                        });
                        if (coordinator.profilePhoto) {
                            const photoData = coordinator.profilePhoto.startsWith('data:') 
                                ? coordinator.profilePhoto 
                                : `data:image/jpeg;base64,${coordinator.profilePhoto}`;
                            setProfilePhoto(photoData);
                            setProfilePhotoData(coordinator.profilePhoto.startsWith('data:') 
                                ? coordinator.profilePhoto.split(',')[1] 
                                : coordinator.profilePhoto);
                            setPhotoDetails({
                                fileName: coordinator.profilePhotoName || 'Profile Photo',
                                uploadDate: coordinator.updatedAt 
                                    ? new Date(coordinator.updatedAt).toLocaleDateString('en-GB') 
                                    : 'N/A'
                            });
                        }
                    }
                    
                    // Complete loading
                    setLoadingProgress(100);
                    setTimeout(() => {
                        setIsInitialLoading(false);
                    }, 300);
                } catch (error) {
                    console.error('Failed to fetch coordinator data:', error);
                    setIsInitialLoading(false);
                    alert('Failed to load coordinator data. Please try again.');
                }
            };
            fetchCoordinatorData();
        }
    }, [isEditMode, isViewMode, editIdParam, viewIdParam]);

    const handleBack = () => {
        navigate(-1); 
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminId');
        localStorage.removeItem('userRole');
        navigate('/admin-login');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };
    
    const handleDobChange = (date) => {
        setFormData(prev => ({ ...prev, dob: date }));
        if (errors.dob) {
            setErrors(prev => ({ ...prev, dob: null }));
        }
    };
    
    const handlePhotoUpload = (e) => {
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
        if (previewObjectUrlRef.current) {
            URL.revokeObjectURL(previewObjectUrlRef.current);
            previewObjectUrlRef.current = null;
        }

        const objectUrl = URL.createObjectURL(file);
        previewObjectUrlRef.current = objectUrl;
        setProfilePhoto(objectUrl);

        const reader = new FileReader();
        reader.onloadend = () => {
            if (typeof reader.result === 'string') {
                const base64Data = reader.result.split(',')[1] || null;
                setProfilePhotoData(base64Data);
                setPhotoDetails({
                    fileName: file.name,
                    uploadDate: new Date().toLocaleDateString('en-GB'),
                });

                setPopupMessage({ type: 'success', text: 'Photo ready for upload' });
                if (errors.profilePhoto) {
                    setErrors(prev => ({ ...prev, profilePhoto: null }));
                }
            }
        };
        reader.onerror = () => {
            setProfilePhoto(null);
            setProfilePhotoData(null);
            setPhotoDetails({ fileName: null, uploadDate: null });
            setPopupMessage({ type: 'error', text: 'Failed to read image file' });
        };
        reader.readAsDataURL(file);
    };

    const closeFileSizeErrorPopup = () => {
        setIsFileSizeErrorOpen(false);
    };

    const handleImageClick = () => { if (profilePhoto) setIsModalOpen(true); };
    const handleModalClose = () => setIsModalOpen(false);

    const handleRemovePhoto = (e) => {
        e.preventDefault();
        if (previewObjectUrlRef.current) {
            URL.revokeObjectURL(previewObjectUrlRef.current);
            previewObjectUrlRef.current = null;
        }
        setProfilePhoto(null);
        setProfilePhotoData(null);
        setPhotoDetails({ fileName: null, uploadDate: null });
        setIsModalOpen(false);
        const fileInput = document.getElementById('file-upload');

        if (fileInput) fileInput.value = '';
        setPopupMessage(null);
    };

    const handleDiscard = () => {
        setFormData({
            firstName: '', lastName: '', dob: null, gender: '', emailId: '',
            domainMailId: '', phoneNumber: '', coordinatorId: '', cabin: '',
            password: '', confirmPassword: '', degree: lockedDegreeValue || '', branch: lockedBranchMeta ? branchSelectValue(lockedBranchMeta) : ''
        });

        setProfilePhoto(null);
        setProfilePhotoData(null);
        setPhotoDetails({ fileName: null, uploadDate: null });
        setIsModalOpen(false); 
        setSaveStatus('discarded');

        setPopupMessage(null);
        setErrors({});
        setSelectedDegree(lockedDegreeValue || '');
        
        // Navigate back after clearing
        navigate(-1);
    };

    const validateForm = () => {
        const newErrors = {};
        const requiredFields = isEditMode 
            ? ['firstName', 'lastName', 'dob', 'gender', 'emailId', 
               'domainMailId', 'phoneNumber', 'coordinatorId',
               'degree', 'branch']
            : ['firstName', 'lastName', 'dob', 'gender', 'emailId', 
               'domainMailId', 'phoneNumber', 'coordinatorId',
               'degree', 'branch', 'password', 'confirmPassword'];

        requiredFields.forEach(field => {
            if (!formData[field]) {
                newErrors[field] = 'This field is required';
            }
        });

        if (!isEditMode && formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        
        setPopupMessage(null);

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // UPDATED: Save function with backend API
    const handleConfirmSave = async () => {
        if (!validateForm()) {
            console.log("Validation failed", errors);
            setSaveStatus('error');
            return;
        }
        
        setIsSaving(true);
        setSaveStatus('saving');

        const payload = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            dob: formData.dob ? formData.dob.toISOString() : null,
            gender: formData.gender,
            emailId: formData.emailId,
            domainMailId: formData.domainMailId,
            phoneNumber: formData.phoneNumber,
            department: formData.branch,
            coordinatorId: formData.coordinatorId,
            cabin: formData.cabin,
            username: formData.coordinatorId,
            degree: formData.degree,
            branch: formData.branch,
            profilePhotoData,
            profilePhotoName: photoDetails.fileName,
        };

        // Only include password fields when creating new coordinator
        if (!isEditMode) {
            payload.password = formData.password;
            payload.confirmPassword = formData.confirmPassword;
        }

        try {
            let response;
            if (isEditMode) {
                response = await mongoDBService.updateCoordinator(editIdParam, payload);
                console.log('Coordinator updated:', response);
            } else {
                response = await mongoDBService.createCoordinator(payload);
                console.log('Coordinator created:', response);
            }
            setSaveStatus('saved');
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Error saving coordinator:', error);
            const message = error?.message || 'An error occurred while saving. Please try again.';
            alert(message);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    // NEW: Function to close modal and navigate
    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        // Navigate to the existing coordinators page for the branch just added/edited
        navigate(`/admin-manage-coordinators/${formData.branch || 'all'}`);
    };


    const handleDropdownIconClick = (ref) => {
        if (ref.current) {
            ref.current.focus();
            const event = new MouseEvent('mousedown', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            ref.current.dispatchEvent(event);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    const filteredBranches = useMemo(() => {
        if (lockedBranchMeta) {
            return [lockedBranchMeta];
        }

        if (!selectedDegree) return branches;

        const normalizedSelectedDegree = selectedDegree?.toString?.().toUpperCase?.() || '';

        const matchingBranches = branches.filter((branch) => {
            if (!branch) return false;

            const degreeCandidates = [
                normalizeForMatch(branch?.degreeAbbreviation),
                normalizeForMatch(branch?.degreeFullName)
            ].filter(Boolean);

            return degreeCandidates.includes(normalizedSelectedDegree);
        });

        return matchingBranches.length ? matchingBranches : branches;
    }, [branches, selectedDegree, lockedBranchMeta]);

    const photoClassNames = useMemo(() => {
        const baseClass = styles['Admin-cood-detail-photo-preview'];
        if (!profilePhoto) return baseClass;
        return `${baseClass} ${styles['Admin-cood-detail-photo-clickable']} ${styles['Admin-cood-detail-photo-active']}`;
    }, [profilePhoto]);

    useEffect(() => () => {
        if (previewObjectUrlRef.current) {
            URL.revokeObjectURL(previewObjectUrlRef.current);
            previewObjectUrlRef.current = null;
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchBranchesAndDegrees = async () => {
            try {
                const [degreeResponse, branchResponse] = await Promise.all([
                    mongoDBService.getDegrees(),
                    mongoDBService.getBranches()
                ]);

                if (!isMounted) return;

                const degreeList = Array.isArray(degreeResponse)
                    ? degreeResponse.filter((degree) => degree?.isActive !== false)
                    : [];
                const branchList = Array.isArray(branchResponse)
                    ? branchResponse.filter((branch) => branch?.isActive !== false)
                    : [];

                setDegrees(degreeList);
                setBranches(branchList);

                if (preselectedBranchCode) {
                    const matchingBranch = branchList.find((branch) => {
                        const matchCandidates = [
                            branch?.branchAbbreviation,
                            branch?.branchFullName,
                            branch?.branchCode,
                            branch?.id,
                            branch?._id
                        ].map(normalizeForMatch).filter(Boolean);
                        return matchCandidates.includes(preselectedBranchCode);
                    });

                    if (matchingBranch) {
                        const sanitizedBranch = {
                            ...matchingBranch,
                            branchAbbreviation: normalizeString(matchingBranch.branchAbbreviation),
                            branchFullName: normalizeString(matchingBranch.branchFullName),
                            branchCode: normalizeString(matchingBranch.branchCode)
                        };

                        setLockedBranchMeta(sanitizedBranch);

                        const matchableBranchDegrees = [
                            normalizeForMatch(matchingBranch.degreeAbbreviation),
                            normalizeForMatch(matchingBranch.degreeFullName)
                        ].filter(Boolean);

                        const matchingDegree = degreeList.find((degree) => {
                            const candidateValues = [
                                normalizeForMatch(degree?.degreeAbbreviation),
                                normalizeForMatch(degree?.degreeFullName),
                                normalizeForMatch(degree?.id),
                                normalizeForMatch(degree?._id)
                            ].filter(Boolean);
                            return candidateValues.some((candidate) => matchableBranchDegrees.includes(candidate));
                        });

                        const preferredDegreeValue = matchingDegree
                            ? degreeOptionValue(matchingDegree)
                            : (normalizeString(matchingBranch.degreeAbbreviation) || normalizeString(matchingBranch.degreeFullName));

                        const branchValue = branchSelectValue(matchingBranch);

                        setLockedDegreeValue(preferredDegreeValue);
                        setSelectedDegree(preferredDegreeValue);
                        setFormData((prev) => ({
                            ...prev,
                            degree: preferredDegreeValue,
                            branch: branchValue
                        }));
                        return;
                    }
                }

                setLockedBranchMeta(null);
                setLockedDegreeValue('');
                setSelectedDegree('');
                setFormData((prev) => ({ ...prev, degree: '', branch: '' }));
            } catch (error) {
                console.error('Failed to load degree/branch data:', error);
            }
        };

        fetchBranchesAndDegrees();

        return () => {
            isMounted = false;
        };
    }, [preselectedBranchCode]);

    return (
        <>
            <AdNavbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
            <div className={styles['Admin-cood-detail-layout']}>
                <AdSidebar isOpen={isSidebarOpen} onLogout={handleLogout} />

                <div className={`${styles['Admin-cood-detail-main-content']} ${isSidebarOpen ? styles['sidebar-open'] : ''}`}>
                    {isInitialLoading && (
                        <PreviewProgressAlert 
                            isOpen={true} 
                            progress={loadingProgress} 
                            title="Loading..." 
                            messages={{ 
                                initial: 'Fetching coordinator details...', 
                                mid: 'Preparing form...', 
                                final: 'Opening editor...' 
                            }}
                            color="#4EA24E"
                            progressColor="#4EA24E"
                        />
                    )}
                    <div className={styles['Admin-cood-detail-main-card']}>
                        <div className={styles['Admin-cood-detail-title-bar']}>
                            <h2 className={styles['Admin-cood-detail-main-title']}>
                                {isViewMode ? 'View Coordinator Details' : isEditMode ? 'Edit Coordinator Details' : 'Coordinator Details'}
                            </h2>
                        </div>

                        <div className={styles['Admin-cood-detail-top-row']}>
                            <div className={styles['Admin-cood-detail-card-content']}>
                                <section className={styles['Admin-cood-detail-section']}>
                                        <div className={styles['Admin-cood-detail-input-grid']}>
                                            <input
                                                type="text"
                                                name="firstName"
                                                placeholder="First Name"
                                                className={`${styles['Admin-cood-detail-form-input']} ${errors.firstName ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                disabled={isViewMode}
                                            />

                                            <input
                                                type="text"
                                                name="lastName"
                                                placeholder="Last Name"
                                                className={`${styles['Admin-cood-detail-form-input']} ${errors.lastName ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                disabled={isViewMode}
                                            />

                                            <div className={styles['Admin-cood-detail-datepicker-wrapper']}>
                                                <DatePicker
                                                    selected={formData.dob}
                                                    onChange={handleDobChange}
                                                    dateFormat="dd/MM/yyyy"
                                                    placeholderText="DOB"
                                                    className={`${styles['Admin-cood-detail-datepicker-input']} ${errors.dob ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                    showPopperArrow={false}
                                                    maxDate={new Date()}
                                                    disabled={isViewMode}
                                                />
                                            </div>

                                            <div className={styles['Admin-cood-detail-select-wrapper']}>
                                                <select
                                                    ref={genderSelectRef}
                                                    name="gender"
                                                    className={`${styles['Admin-cood-detail-form-input']} ${styles['Admin-cood-detail-form-select']} ${errors.gender ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                    value={formData.gender}
                                                    onChange={handleInputChange}
                                                    disabled={isViewMode}
                                                >
                                                    <option value="" disabled>Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                                <div onClick={() => handleDropdownIconClick(genderSelectRef)} style={{ cursor: 'pointer' }}>
                                                    <DropdownIcon />
                                                </div>
                                            </div>

                                            <input
                                                type="email"
                                                name="emailId"
                                                placeholder="Email id"
                                                className={`${styles['Admin-cood-detail-form-input']} ${errors.emailId ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                value={formData.emailId}
                                                onChange={handleInputChange}
                                                disabled={isViewMode}
                                            />

                                            <input
                                                type="email"
                                                name="domainMailId"
                                                placeholder="Domain Mail id"
                                                className={`${styles['Admin-cood-detail-form-input']} ${errors.domainMailId ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                value={formData.domainMailId}
                                                onChange={handleInputChange}
                                                disabled={isViewMode}
                                            />

                                            <input
                                                type="tel"
                                                name="phoneNumber"
                                                placeholder="Phone number"
                                                className={`${styles['Admin-cood-detail-form-input']} ${errors.phoneNumber ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                value={formData.phoneNumber}
                                                onChange={handleInputChange}
                                                disabled={isViewMode}
                                            />

                                            <input
                                                type="text"
                                                name="cabin"
                                                placeholder="Cabin"
                                                className={styles['Admin-cood-detail-form-input']}
                                                value={formData.cabin}
                                                onChange={handleInputChange}
                                                disabled={isViewMode}
                                            />

                                            <div className={styles['Admin-cood-detail-select-wrapper']}>
                                                <select
                                                    ref={degreeSelectRef}
                                                    name="degree"
                                                    className={`${styles['Admin-cood-detail-form-input']} ${styles['Admin-cood-detail-form-select']} ${errors.degree ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                    value={selectedDegree}
                                                    onChange={(event) => {
                                                        const degreeValue = event.target.value;
                                                        setSelectedDegree(degreeValue);
                                                        handleInputChange({ target: { name: 'degree', value: degreeValue } });
                                                        if (!lockedBranchMeta) {
                                                            handleInputChange({ target: { name: 'branch', value: '' } });
                                                        }
                                                    }}
                                                    disabled={Boolean(lockedBranchMeta) || isViewMode}
                                                >
                                                    <option value="" disabled>Select Degree</option>
                                                    {degrees.map((degree) => {
                                                        const value = degreeOptionValue(degree);
                                                        const label = degree?.degreeFullName && degree?.degreeAbbreviation
                                                            ? `${degree.degreeFullName} (${degree.degreeAbbreviation})`
                                                            : degree?.degreeFullName || degree?.degreeAbbreviation || value;
                                                        return (
                                                            <option key={degree.id || degree._id || value} value={value}>
                                                                {label}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                                <div onClick={() => handleDropdownIconClick(degreeSelectRef)} style={{ cursor: 'pointer' }}>
                                                    <DropdownIcon />
                                                </div>
                                            </div>

                                            <div className={styles['Admin-cood-detail-select-wrapper']}>
                                                <select
                                                    ref={branchSelectRef}
                                                    name="branch"
                                                    className={`${styles['Admin-cood-detail-form-input']} ${styles['Admin-cood-detail-form-select']} ${errors.branch ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                    value={formData.branch}
                                                    onChange={handleInputChange}
                                                    disabled={Boolean(lockedBranchMeta) || (!lockedBranchMeta && !selectedDegree) || !filteredBranches.length || isViewMode}
                                                >
                                                    <option value="" disabled>
                                                        {filteredBranches.length ? 'Select Branch' : 'No branches available'}
                                                    </option>
                                                    {filteredBranches.map((branch) => {
                                                        const label = branch?.branchFullName && branch?.branchAbbreviation
                                                            ? `${branch.branchFullName} (${branch.branchAbbreviation})`
                                                            : branch?.branchFullName || branch?.branchAbbreviation;
                                                        const value = branchSelectValue(branch);
                                                        return (
                                                            <option key={branch.id || branch._id || value} value={value}>
                                                                {label}
                                                            </option>
                                                        );
                                                    })}
                                                </select>
                                                <div onClick={() => handleDropdownIconClick(branchSelectRef)} style={{ cursor: 'pointer' }}>
                                                    <DropdownIcon />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <h3 className={styles['Admin-cood-detail-section-subtitle']}>Coordinator Login Credentials</h3>
                                        <div className={styles['Admin-cood-detail-login-fields']}>
                                            <input
                                                type="text"
                                                name="coordinatorId"
                                                placeholder="Coordinator ID"
                                                className={`${styles['Admin-cood-detail-form-input']} ${errors.coordinatorId ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                value={formData.coordinatorId}
                                                onChange={handleInputChange}
                                                disabled={isViewMode}
                                            />
                                            {!isEditMode && !isViewMode && (
                                                <>
                                                    <input
                                                        type="password"
                                                        name="password"
                                                        placeholder="Enter Password"
                                                        className={`${styles['Admin-cood-detail-form-input']} ${errors.password ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                        value={formData.password}
                                                        onChange={handleInputChange}
                                                    />
                                                    <input
                                                        type="password"
                                                        name="confirmPassword"
                                                        placeholder="Confirm Password"
                                                        className={`${styles['Admin-cood-detail-form-input']} ${errors.confirmPassword ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                        value={formData.confirmPassword}
                                                        onChange={handleInputChange}
                                                    />
                                                </>
                                            )}
                                            {!isViewMode && (
                                                <div className={styles['Admin-cood-detail-login-buttons-desktop']}>
                                                    <button
                                                        type="button"
                                                        className={styles['Admin-cood-detail-discard-btn']}
                                                        onClick={handleDiscard}
                                                    >
                                                        Discard
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className={styles['Admin-cood-detail-confirm-save-btn']}
                                                        onClick={handleConfirmSave}
                                                        disabled={isSaving}
                                                    >
                                                        {isSaving ? 'Saving...' : (isEditMode ? 'Update Coordinator' : 'Confirm & Save')}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                </div>

                                <div className={`${styles['Admin-cood-detail-photo-wrapper']} ${errors.profilePhoto ? styles['Admin-cood-detail-input-error'] : ''}`}>
                                    <div className={styles['Admin-cood-detail-photo-box']}>
                                        <h3 className={styles['Admin-cood-detail-photo-title']}>Profile Photo</h3>
                                        <div className={styles['Admin-cood-detail-profile-icon-container']}>
                                            {profilePhoto ? (
                                                <img
                                                    src={profilePhoto}
                                                    alt="Profile Preview"
                                                    className={styles['Admin-cood-detail-profile-preview-img']}
                                                    onClick={handleImageClick}
                                                />
                                            ) : (
                                                <img
                                                    src={ProfileGraduationcap}
                                                    alt="Graduation Cap"
                                                    className={styles['Admin-cood-detail-graduation-cap-icon']}
                                                />
                                            )}
                                        </div>
                                        <div className={styles['Admin-cood-detail-upload-action-area']}>
                                            {!isViewMode && (
                                                <div className={styles['Admin-cood-detail-upload-btn-wrapper']}>
                                                    <label htmlFor="file-upload" className={styles['Admin-cood-detail-profile-upload-btn']}>
                                                        <div className={styles['Admin-cood-detail-upload-btn-content']}>
                                                            <MdUpload />
                                                            <span>Upload</span>
                                                        </div>
                                                    </label>
                                                    {profilePhoto && (
                                                        <button
                                                            onClick={handleRemovePhoto}
                                                            className={styles['Admin-cood-detail-remove-image-btn']}
                                                            aria-label="Remove image"
                                                        >
                                                            <IoMdClose />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {!isViewMode && (
                                                <>
                                                    <input
                                                        id="file-upload"
                                                        type="file"
                                                        accept="image/jpeg"
                                                        className={styles['Admin-cood-detail-hidden-input']}
                                                        onChange={handlePhotoUpload}
                                                    />
                                                    {popupMessage && typeof popupMessage === 'object' && (
                                                        <p
                                                            className={popupMessage.type === 'success' ? styles['Admin-cood-detail-upload-success-message'] : styles['Admin-cood-detail-status-error']}
                                                            style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: '500', margin: '8px 0 0 0' }}
                                                        >
                                                            {popupMessage.text}
                                                        </p>
                                                    )}
                                                    <p className={styles['Admin-cood-detail-upload-hint']}>*Only JPG format is allowed.</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {!isViewMode && (
                                <div className={styles['Admin-cood-detail-mobile-actions']}>
                                    <button
                                        type="button"
                                        className={styles['Admin-cood-detail-discard-btn']}
                                        onClick={handleDiscard}
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="button"
                                        className={styles['Admin-cood-detail-confirm-save-btn']}
                                        onClick={handleConfirmSave}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? 'Saving...' : (isEditMode ? 'Update Coordinator' : 'Confirm & Save')}
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>

            {isModalOpen && profilePhoto && (
                <div className={styles['co-modal-overlay']} onClick={handleModalClose}>
                    <div className={styles['co-modal-content']} onClick={(e) => e.stopPropagation()}>
                        <span className={styles['co-modal-close']} onClick={handleModalClose}>&times;</span>
                        <img src={profilePhoto} alt="Full Profile Preview" className={styles['co-modal-image']} />
                    </div>
                </div>
            )}

            {showSuccessModal && (
                <div className={styles['success-modal-overlay']}>
                    <div className={styles['success-modal-content']}>
                        <div className={styles['success-modal-header']}>
                            {isEditMode ? 'Updated!' : 'Added!'}
                        </div>
                        <div className={styles['success-modal-body']}>
                            <div className={styles['success-modal-icon-wrapper']}>
                                <img src={ProfileGraduationcap} alt="Success" className={styles['success-modal-icon']} />
                            </div>
                            <h2>{isEditMode ? 'Co-ordinator Updated ' : 'Co-ordinator Added '}</h2>
                            <p>{isEditMode ? 'Co-ordinator details have been' : 'New Co-ordinator have been'}<br />Successfully {isEditMode ? 'Updated' : 'Added in the Portal'}</p>
                            <button
                                className={styles['success-modal-close-btn']}
                                onClick={handleCloseSuccessModal}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* File Size Error Popup */}
            <FileSizeErrorPopup
                isOpen={isFileSizeErrorOpen}
                onClose={closeFileSizeErrorPopup}
                fileSizeKB={fileSizeErrorKB}
            />
        </>
    );
}

export default AdminCoDet;