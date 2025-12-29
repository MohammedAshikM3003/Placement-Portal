import React, { useState, useEffect, useMemo, useRef } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import AdNavbar from "../components/Navbar/Adnavbar.js";
import AdSidebar from "../components/Sidebar/Adsidebar.js";
// FIXED: Import CSS as a Module
import styles from './AdAddCoordinatorform.module.css';
import Adminicon from "../assets/Adminicon.png"; 
import ProfileGraduationcap from "../assets/VectorGC.svg";
import mongoDBService from "../services/mongoDBService.jsx";

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

const normalizeString = (value) => {
    if (value === null || value === undefined) return '';
    return value.toString().trim();
};

const degreeOptionValue = (degree) => normalizeString(degree?.degreeAbbreviation) || normalizeString(degree?.degreeFullName) || normalizeString(degree?.id) || normalizeString(degree?._id);

const normalizeForMatch = (value) => normalizeString(value).toUpperCase();

const branchSelectValue = (branch) => normalizeString(branch?.branchAbbreviation) || normalizeString(branch?.branchFullName) || normalizeString(branch?.branchCode) || normalizeString(branch?.id) || normalizeString(branch?._id);

function AdminCoDet() {
    const navigate = useNavigate();
    const location = useLocation();
    const urlSearchParams = useMemo(() => new URLSearchParams(location.search || ''), [location.search]);
    const branchParam = normalizeString(urlSearchParams.get('branch'));
    const branchState = normalizeString(location.state?.branchCode);
    const preselectedBranchRaw = branchState || branchParam;
    const preselectedBranchCode = normalizeForMatch(preselectedBranchRaw);

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


    const handleBack = () => {
        navigate(-1); 
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
    };

    const validateForm = () => {
        const newErrors = {};
        const requiredFields = [
            'firstName', 'lastName', 'dob', 'gender', 'emailId', 
            'domainMailId', 'phoneNumber', 'coordinatorId',
            'degree', 'branch', 'password', 'confirmPassword'
        ];

        requiredFields.forEach(field => {
            if (!formData[field]) {
                newErrors[field] = 'This field is required';
            }
        });

        if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
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
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            profilePhotoData,
            profilePhotoName: photoDetails.fileName,
            degree: formData.degree,
            branch: formData.branch,
        };

        try {
            const response = await mongoDBService.createCoordinator(payload);
            console.log('Coordinator saved:', response);
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
        // Navigate to the existing coordinators page for the branch just added
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
                <AdSidebar isOpen={isSidebarOpen} onLogout={() => console.log('Logout Clicked')} />

                <div className={`${styles['Admin-cood-detail-main-content']} ${isSidebarOpen ? styles['sidebar-open'] : ''}`}>
                    <div className={styles['Admin-cood-detail-main-card']}>
                        <div className={styles['Admin-cood-detail-title-bar']}>
                            <h2 className={styles['Admin-cood-detail-main-title']}>Coordinator Details</h2>
                            <button className={styles['Admin-cood-detail-back-btn']} onClick={handleBack}>
                                Back
                                <span className={styles['Admin-cood-detail-back-arrow']}>➜</span>
                            </button>
                        </div>

                        <div className={styles['Admin-cood-detail-top-row']}>
                            <div>
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
                                            />

                                            <input
                                                type="text"
                                                name="lastName"
                                                placeholder="Last Name"
                                                className={`${styles['Admin-cood-detail-form-input']} ${errors.lastName ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                value={formData.lastName}
                                                onChange={handleInputChange}
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
                                                />
                                            </div>

                                            <div className={styles['Admin-cood-detail-select-wrapper']}>
                                                <select
                                                    ref={genderSelectRef}
                                                    name="gender"
                                                    className={`${styles['Admin-cood-detail-form-input']} ${styles['Admin-cood-detail-form-select']} ${errors.gender ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                    value={formData.gender}
                                                    onChange={handleInputChange}
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
                                            />

                                            <input
                                                type="email"
                                                name="domainMailId"
                                                placeholder="Domain Mail id"
                                                className={`${styles['Admin-cood-detail-form-input']} ${errors.domainMailId ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                value={formData.domainMailId}
                                                onChange={handleInputChange}
                                            />

                                            <input
                                                type="tel"
                                                name="phoneNumber"
                                                placeholder="Phone number"
                                                className={`${styles['Admin-cood-detail-form-input']} ${errors.phoneNumber ? styles['Admin-cood-detail-input-error'] : ''}`}
                                                value={formData.phoneNumber}
                                                onChange={handleInputChange}
                                            />

                                            <input
                                                type="text"
                                                name="cabin"
                                                placeholder="Cabin"
                                                className={styles['Admin-cood-detail-form-input']}
                                                value={formData.cabin}
                                                onChange={handleInputChange}
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
                                                    disabled={Boolean(lockedBranchMeta)}
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
                                                    disabled={Boolean(lockedBranchMeta) || (!lockedBranchMeta && !selectedDegree) || !filteredBranches.length}
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
                                    </section>
                                </div>
                            </div>

                            <div className={`${styles['Admin-cood-detail-photo-wrapper']} ${errors.profilePhoto ? styles['Admin-cood-detail-input-error'] : ''}`}>
                                <h3 className={styles['Admin-cood-detail-card-title']}>Profile Photo</h3>
                                <div className={styles['Admin-cood-detail-photo-content']}>
                                    <div className={styles['Admin-cood-detail-photo-icon-container']}>
                                        {profilePhoto ? (
                                            <img
                                                src={profilePhoto}
                                                alt="Profile Preview"
                                                className={photoClassNames}
                                                onClick={handleImageClick}
                                            />
                                        ) : (
                                            <img
                                                src={ProfileGraduationcap}
                                                alt="Graduation Cap"
                                                style={{ width: '80px', height: '70px' }}
                                            />
                                        )}
                                    </div>
                                    {photoDetails.fileName && (
                                        <div className={styles['Admin-cood-detail-upload-info-container']}>
                                            <div className={styles['Admin-cood-detail-upload-info-item']}>
                                                <FileIcon />
                                                <span>{photoDetails.fileName}</span>
                                            </div>
                                            <div className={styles['Admin-cood-detail-upload-info-item']}>
                                                <CalendarIcon />
                                                <span>Uploaded on: {photoDetails.uploadDate}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className={styles['Admin-cood-detail-upload-action-area']}>
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
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles['Admin-cood-detail-credentials-card']}>
                            <h3 className={styles['Admin-cood-detail-card-title']}>Coordinator Login Credentials</h3>
                            <div className={styles['Admin-cood-detail-card-content']}>
                                <div className={styles['Admin-cood-detail-input-grid-three-col']}>
                                    <input
                                        type="text"
                                        name="coordinatorId"
                                        placeholder="Coordinator ID"
                                        className={`${styles['Admin-cood-detail-form-input']} ${errors.coordinatorId ? styles['Admin-cood-detail-input-error'] : ''}`}
                                        value={formData.coordinatorId}
                                        onChange={handleInputChange}
                                    />
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
                                </div>
                            </div>
                        </div>

                        <div className={styles['Admin-cood-detail-final-actions']}>
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
                                {isSaving ? 'Saving...' : 'Confirm & Save'}
                            </button>
                        </div>
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
                            Added!
                        </div>
                        <div className={styles['success-modal-body']}>
                            <div className={styles['success-modal-icon-wrapper']}>
                                <img src={ProfileGraduationcap} alt="Success" className={styles['success-modal-icon']} />
                            </div>
                            <h2>Co-ordinator Added ✓</h2>
                            <p>New Co-ordinator have been<br />Successfully Added in the Portal</p>
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
        </>
    );
}

export default AdminCoDet;