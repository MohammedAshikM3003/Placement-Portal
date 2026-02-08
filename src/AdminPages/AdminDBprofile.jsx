import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useParams, useLocation, useNavigate } from 'react-router-dom'; // Added useNavigate
import useAdminAuth from '../utils/useAdminAuth';

import Navbar from '../components/Navbar/Adnavbar.js';
import Sidebar from '../components/Sidebar/Adsidebar.js';
import styles from './AdminDBprofile.module.css'; 
import { PreviewProgressAlert } from '../components/alerts/DownloadPreviewAlerts.js';

import Adminicons from '../assets/AdmingreenCapicon.svg';

// Validation Alert Component - Green themed
const ValidationAlert = ({ isOpen, onClose, message }) => {
    if (!isOpen) return null;
    return (
        <div className="alert-overlay">
            <div className="achievement-popup-container">
                <div className="achievement-popup-header" style={{ backgroundColor: '#4EA24E' }}>
                    Validation Required
                </div>
                <div className="achievement-popup-body">
                    <div className="preview-error-icon-container">
                        <svg className="preview-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                            <circle className="preview-error-icon--circle" cx="26" cy="26" r="25" fill="#4EA24E"/>
                            <path fill="white" d="M26 16v12M26 34v2" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                    </div>
                    <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
                        Validation Error
                    </h2>
                    <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
                        {message}
                    </p>
                </div>
                <div className="achievement-popup-footer">
                    <button onClick={onClose} className="preview-close-btn">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// GPA validation constants
const GPA_REGEX = /^\d{1,2}(?:\.\d{0,2})?$/;
const GPA_MIN = 0;
const GPA_MAX = 10;

// Company Types and Job Location Options
const COMPANY_TYPE_OPTIONS = [
    "CORE",
    "IT",
    "ITES(BPO/KPO)",
    "Marketing & Sales",
    "HR / Business analyst",
    "Others"
];

const JOB_LOCATION_OPTIONS = [
    "Tamil Nadu",
    "Bengaluru",
    "Hyderabad",
    "North India",
    "Others"
];

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

const EyeIcon = ({ isOpen }) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        {isOpen ? (
            <>
                <ellipse cx="12" cy="12" rx="9" ry="6" stroke="#4EA24E" strokeWidth="2"/>
                <circle cx="12" cy="12" r="2" stroke="#4EA24E" strokeWidth="2"/>
            </>
        ) : (
            <>
                <path d="M3 3L21 21" stroke="#4EA24E" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10.5 10.5C10.0353 10.9647 9.75 11.5995 9.75 12.3C9.75 13.7912 10.9588 15 12.45 15C13.1505 15 13.7853 14.7147 14.25 14.25M19.5 19.5C17.6043 20.9474 15.3478 21.75 12.9 21.75C7.5 21.75 3 17.25 3 12C3 9.55217 3.80263 7.29565 5.25 5.4M12 5.25C17.4 5.25 21.9 9.75 21.9 15C21.9 15.9818 21.7509 16.9284 21.4725 17.8237" stroke="#4EA24E" strokeWidth="2" strokeLinecap="round"/>
            </>
        )}
    </svg>
);



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

const FileSizeErrorPopup = ({ isOpen, onClose, fileSizeKB }) => {
    if (!isOpen) return null;

    const formattedFileSize = (() => {
        const numeric = Number(fileSizeKB);
        if (Number.isFinite(numeric)) {
            return numeric.toFixed(1);
        }
        return fileSizeKB;
    })();

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 10000
        }}>
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                width: '400px',
                maxWidth: '90vw',
                textAlign: 'center',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
                overflow: 'hidden',
                fontFamily: 'Poppins, sans-serif'
            }}>
                <div style={{
                    backgroundColor: '#4ea24e',
                    color: 'white',
                    padding: '1rem',
                    fontSize: '1.75rem',
                    fontWeight: '700'
                }}>Image Too Large!</div>
                <div style={{ padding: '2rem' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        backgroundColor: '#D23B42',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem'
                    }}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M15 8h.01M12.5 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6.5" />
                            <path d="m3 16 5-5c.928-.893 2.072-.893 3 0l3 3m0 0 1-1c.616-.593 1.328-.792 2.008-.598M16 19a3 3 0 1 0 6 0a3 3 0 1 0-6 0m1 2 4-4" />
                        </svg>
                    </div>
                    <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: '24px', color: '#000', fontWeight: '700' }}>
                        Image Size Exceeded ✗
                    </h2>
                    <p style={{ margin: '0.5rem 0', color: '#333', fontSize: '16px' }}>
                        Maximum allowed: <strong>500KB</strong>
                    </p>
                    <p style={{ margin: '0.5rem 0', color: '#333', fontSize: '16px' }}>
                        Your image size: <strong>{formattedFileSize}KB</strong>
                    </p>
                    <p style={{ margin: '1rem 0 0', color: '#888', fontSize: '14px' }}>
                        Please compress your image or choose a smaller file.
                    </p>
                </div>
                <div style={{ padding: '1.5rem', backgroundColor: '#f7f7f7' }}>
                    <button onClick={onClose} style={{
                        backgroundColor: '#D23B42',
                        color: 'white',
                        border: 'none',
                        padding: '0.8rem 1.5rem',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s, box-shadow 0.2s',
                        boxShadow: '0 2px 8px rgba(210, 59, 66, 0.2)'
                    }}>OK</button>
                </div>
            </div>
        </div>
    );
};

const ImagePreviewModal = ({ src, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className={styles['Admin-DB-AdProfile-image-preview-overlay']} onClick={onClose}>
            <div className={styles['Admin-DB-AdProfile-image-preview-container']} onClick={(e) => e.stopPropagation()}>
                <img src={src} alt="Profile Preview" className={styles['Admin-DB-AdProfile-image-preview-content']} />
                <button onClick={onClose} className={styles['Admin-DB-AdProfile-image-preview-close-btn']}>&times;</button>
            </div>
        </div>
    );
};

function AdminAdProfile({ onLogout, onViewChange }) { 
    useAdminAuth(); // JWT authentication verification
    const { studentId } = useParams(); 
    const location = useLocation(); 
    const navigate = useNavigate(); // Initialize useNavigate

    // Determine if we are in EDIT mode
    const isEditable = location.state?.mode === 'edit';

    const [studyCategory, setStudyCategory] = useState('12th');
    const [studentData, setStudentData] = useState(null);
    const [currentYear, setCurrentYear] = useState('');
    const [currentSemester, setCurrentSemester] = useState('');
    const [isPopupOpen, setPopupOpen] = useState(false);
    const [errorAlert, setErrorAlert] = useState({ isOpen: false, message: '' });
    const [profileImage, setProfileImage] = useState(null);
    const [uploadInfo, setUploadInfo] = useState({ name: '', date: '' });
    
    const formRef = useRef(null);
    const [isFileSizeErrorOpen, setIsFileSizeErrorOpen] = useState(false);
    const [fileSizeErrorKB, setFileSizeErrorKB] = useState('');
    const fileInputRef = useRef(null);
    const [isImagePreviewOpen, setImagePreviewOpen] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [dob, setDob] = useState(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loginPwdValue, setLoginPwdValue] = useState('');
    const [confirmPwdValue, setConfirmPwdValue] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);
    const [selectedCompanyTypes, setSelectedCompanyTypes] = useState([]);
    const [selectedJobLocations, setSelectedJobLocations] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [branches, setBranches] = useState([]);
    const [degrees, setDegrees] = useState([]);
    const [selectedDegree, setSelectedDegree] = useState('');
    const [selectedBranch, setSelectedBranch] = useState('');
    const [hasResume, setHasResume] = useState(false);
    const [resumeData, setResumeData] = useState(null);
    const [previewPopupState, setPreviewPopupState] = useState('none');
    const [previewProgress, setPreviewProgress] = useState(0);

    // Helper function to parse multi-value fields
    const parseMultiValue = (value) => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string' && value.trim()) {
            return value.split(',').map(v => v.trim()).filter(Boolean);
        }
        return [];
    };

    // Filter branches based on selected degree
    const filteredBranches = useMemo(() => {
        if (!selectedDegree) return [];
        const normalized = selectedDegree.toLowerCase();

        return branches.filter((branch) => {
            const degree = branch?.degree?.toLowerCase?.() || '';
            const abbreviation = branch?.degreeAbbreviation?.toLowerCase?.() || '';
            return degree === normalized || abbreviation === normalized || degree.includes(normalized);
        });
    }, [branches, selectedDegree]);

    const getBranchOptionValue = useCallback((branch) => {
        if (!branch) return '';
        return branch.branchAbbreviation || branch.branchFullName || branch.branchName || branch.branch;
    }, []);

    // Get available semesters based on year
    const getAvailableSemesters = useCallback((year) => {
        const semesterMap = {
            I: ['1', '2'],
            II: ['3', '4'],
            III: ['5', '6'],
            IV: ['7', '8'],
        };
        return semesterMap[year] || [];
    }, []);

    // Generate batch options dynamically
    const generateBatchOptions = useCallback(() => {
        const currentYearValue = new Date().getFullYear();
        const startYear = currentYearValue - 5;
        const endYear = currentYearValue + 5;
        const batches = [];

        for (let year = startYear; year <= endYear; year += 1) {
            const batchEnd = year + 4;
            batches.push({ value: `${year}-${batchEnd}`, label: `${year}-${batchEnd}` });
        }

        return batches;
    }, []);

    // Helper function to get all GPA fields that should be displayed
    const getAllGPAFields = useCallback(() => {
        if (!currentYear || !currentSemester) return [];
        if (currentYear === 'IV' && currentSemester === '8') {
            return Array.from({ length: 8 }, (_, index) => `semester${index + 1}GPA`);
        }
        const semesterNum = parseInt(currentSemester, 10);
        return Array.from({ length: semesterNum }, (_, index) => `semester${index + 1}GPA`);
    }, [currentYear, currentSemester]);

    // Helper function to get required GPA fields
    const getRequiredGPAFields = useCallback(() => {
        if (!currentYear || !currentSemester) return [];
        if (currentYear === 'IV' && currentSemester === '8') {
            return Array.from({ length: 7 }, (_, index) => `semester${index + 1}GPA`);
        }
        const semesterNum = parseInt(currentSemester, 10);
        return Array.from({ length: semesterNum - 1 }, (_, index) => `semester${index + 1}GPA`);
    }, [currentYear, currentSemester]);

    // GPA validation function
    const validateGpaInput = useCallback((inputElement) => {
        if (!inputElement) return;
        const rawValue = inputElement.value.trim();

        if (!rawValue) {
            inputElement.setCustomValidity('');
            return;
        }

        if (!GPA_REGEX.test(rawValue)) {
            inputElement.setCustomValidity('Enter GPA with up to two decimal places (e.g., 9.08)');
            return;
        }

        const numericValue = Number(rawValue);
        if (Number.isNaN(numericValue) || numericValue < GPA_MIN || numericValue > GPA_MAX) {
            inputElement.setCustomValidity(`Enter a GPA between ${GPA_MIN} and ${GPA_MAX} (e.g., 9.08)`);
            return;
        }

        inputElement.setCustomValidity('');
    }, []);

    // Handle GPA input event
    const handleGpaInput = useCallback((event) => {
        validateGpaInput(event.target);
    }, [validateGpaInput]);

    // Handle GPA blur event
    const handleGpaBlur = useCallback((event) => {
        const inputElement = event.target;
        validateGpaInput(inputElement);

        const rawValue = inputElement.value.trim();
        if (!rawValue) return;

        if (!GPA_REGEX.test(rawValue)) return;

        const numericValue = Number(rawValue);
        if (Number.isNaN(numericValue)) return;

        inputElement.value = numericValue.toFixed(2);
        validateGpaInput(inputElement);
    }, [validateGpaInput]);

    // Handle Company Type checkbox changes
    const handleCompanyTypeChange = (e) => {
        const value = e.target.value;
        setSelectedCompanyTypes(prev => 
            e.target.checked 
                ? [...prev, value]
                : prev.filter(item => item !== value)
        );
    };

    // Handle Job Location checkbox changes
    const handleJobLocationChange = (e) => {
        const value = e.target.value;
        setSelectedJobLocations(prev => 
            e.target.checked 
                ? [...prev, value]
                : prev.filter(item => item !== value)
        );
    };

    // Handle select field changes
    const handleSelectChange = (field, value) => {
        setStudentData(prev => ({ ...prev, [field]: value }));
        if (field === 'currentYear') {
            setCurrentYear(value);
            const semesters = getAvailableSemesters(value);
            setCurrentSemester(semesters[0] || '');
            setStudentData(prev => ({ ...prev, currentSemester: semesters[0] || '' }));
        }
        if (field === 'currentSemester') setCurrentSemester(value);
        if (field === 'degree') {
            setSelectedDegree(value);
            setSelectedBranch(''); // Reset branch when degree changes
        }
        if (field === 'branch') {
            setSelectedBranch(value);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "image/jpeg") {
            const maxSize = 500 * 1024; // 500KB in bytes
            const fileSizeKB = (file.size / 1024).toFixed(1);
            
            if (file.size > maxSize) {
                setFileSizeErrorKB(fileSizeKB);
                setIsFileSizeErrorOpen(true);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                return;
            }
            
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

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const pwd = formData.get('loginPassword') || '';
        const confirmPwd = formData.get('confirmLoginPassword') || '';
        
        // Validate password fields
        if (pwd && !confirmPwd) {
            setErrorAlert({ isOpen: true, message: 'Please enter confirm password.' });
            return;
        }
        if (pwd && confirmPwd && pwd !== confirmPwd) {
            setErrorAlert({ isOpen: true, message: 'Login password and confirm password do not match.' });
            return;
        }
        
        setIsSaving(true);
        console.log('=== ADMIN PROFILE UPDATE ===');
        console.log('Student ID:', studentId);
        
        try {
            const fastDataService = (await import('../services/fastDataService.jsx')).default;
            
            // Build comprehensive payload with ALL fields
            const payload = {
                // Personal Information
                firstName: formData.get('firstName') || studentData?.firstName || '',
                lastName: formData.get('lastName') || studentData?.lastName || '',
                regNo: formData.get('regNo') || studentData?.regNo || '',
                batch: formData.get('batch') || studentData?.batch || '',
                dob: dob ? dob.toLocaleDateString('en-GB').split('/').join('') : (studentData?.dob || ''), // Format: DDMMYYYY
                degree: formData.get('degree') || selectedDegree || studentData?.degree || '',
                branch: formData.get('branch') || selectedBranch || studentData?.branch || '',
                currentYear: formData.get('currentYear') || currentYear || studentData?.currentYear || '',
                currentSemester: formData.get('currentSemester') || currentSemester || studentData?.currentSemester || '',
                section: formData.get('section') || studentData?.section || '',
                gender: formData.get('gender') || studentData?.gender || '',
                address: formData.get('address') || studentData?.address || '',
                city: formData.get('city') || studentData?.city || '',
                primaryEmail: formData.get('primaryEmail') || studentData?.primaryEmail || '',
                domainEmail: formData.get('domainEmail') || studentData?.domainEmail || '',
                mobileNo: formData.get('mobileNo') || studentData?.mobileNo || '',
                
                // Family Details
                fatherName: formData.get('fatherName') || '',
                fatherOccupation: formData.get('fatherOccupation') || '',
                fatherMobile: formData.get('fatherMobile') || '',
                motherName: formData.get('motherName') || '',
                motherOccupation: formData.get('motherOccupation') || '',
                motherMobile: formData.get('motherMobile') || '',
                guardianName: formData.get('guardianName') || '',
                guardianNumber: formData.get('guardianNumber') || '',
                aadhaarNo: formData.get('aadhaarNo') || '',
                
                // Additional Personal Details
                bloodGroup: formData.get('bloodGroup') || '',
                community: formData.get('community') || '',
                mediumOfStudy: formData.get('mediumOfStudy') || '',
                
                // Academic Background
                studyCategory: studyCategory || '',
                tenthInstitution: formData.get('tenthInstitution') || '',
                tenthBoard: formData.get('tenthBoard') || '',
                tenthPercentage: formData.get('tenthPercentage') || '',
                tenthYear: formData.get('tenthYear') || '',
                twelfthInstitution: formData.get('twelfthInstitution') || '',
                twelfthBoard: formData.get('twelfthBoard') || '',
                twelfthPercentage: formData.get('twelfthPercentage') || '',
                twelfthYear: formData.get('twelfthYear') || '',
                twelfthCutoff: formData.get('twelfthCutoff') || '',
                diplomaInstitution: formData.get('diplomaInstitution') || '',
                diplomaBranch: formData.get('diplomaBranch') || '',
                diplomaPercentage: formData.get('diplomaPercentage') || '',
                diplomaYear: formData.get('diplomaYear') || '',
                
                // Semester GPA
                semester1GPA: formData.get('semester1GPA') || '',
                semester2GPA: formData.get('semester2GPA') || '',
                semester3GPA: formData.get('semester3GPA') || '',
                semester4GPA: formData.get('semester4GPA') || '',
                semester5GPA: formData.get('semester5GPA') || '',
                semester6GPA: formData.get('semester6GPA') || '',
                semester7GPA: formData.get('semester7GPA') || '',
                semester8GPA: formData.get('semester8GPA') || '',
                overallCGPA: formData.get('overallCGPA') || '',
                
                // Academic Status
                clearedBacklogs: formData.get('clearedBacklogs') || '',
                currentBacklogs: formData.get('currentBacklogs') || '',
                arrearStatus: formData.get('arrearStatus') || '',
                yearOfGap: formData.get('yearOfGap') || '',
                gapReason: formData.get('gapReason') || '',
                
                // Other Details
                residentialStatus: formData.get('residentialStatus') || '',
                quota: formData.get('quota') || '',
                languagesKnown: formData.get('languagesKnown') || '',
                firstGraduate: formData.get('firstGraduate') || '',
                passportNo: formData.get('passportNo') || '',
                skillSet: formData.get('skillSet') || '',
                valueAddedCourses: formData.get('valueAddedCourses') || '',
                aboutSibling: formData.get('aboutSibling') || '',
                rationCardNo: formData.get('rationCardNo') || '',
                familyAnnualIncome: formData.get('familyAnnualIncome') || '',
                panNo: formData.get('panNo') || '',
                willingToSignBond: formData.get('willingToSignBond') || '',
                preferredModeOfDrive: formData.get('preferredModeOfDrive') || '',
                githubLink: formData.get('githubLink') || '',
                linkedinLink: formData.get('linkedinLink') || '',
                companyTypes: selectedCompanyTypes.join(', '),
                preferredJobLocation: selectedJobLocations.join(', '),
                
                // Login Details
                loginRegNo: formData.get('loginRegNo') || studentData?.regNo || '',
                loginPassword: pwd || ''
            };

            // Handle profile picture upload if changed
            if (fileInputRef.current && fileInputRef.current.files[0]) {
                const file = fileInputRef.current.files[0];
                const reader = new FileReader();
                
                const profilePicData = await new Promise((resolve, reject) => {
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                
                payload.profilePicURL = profilePicData;
                console.log('Profile picture updated');
            }

            console.log('Payload being sent:', {
                ...payload,
                profilePicURL: payload.profilePicURL ? '[BASE64_DATA]' : 'Not changed'
            });

            const result = await fastDataService.updateProfile(studentId, payload);
            
            console.log('Update result:', result);
            
            if (result && result.student) {
                const updated = { ...studentData, ...result.student };
                setStudentData(updated);
                
                // Update local state variables
                if (result.student.currentYear) setCurrentYear(result.student.currentYear);
                if (result.student.currentSemester) setCurrentSemester(result.student.currentSemester);
                if (result.student.degree) setSelectedDegree(result.student.degree);
                if (result.student.branch) setSelectedBranch(result.student.branch);
                if (result.student.dob) {
                    const dobStr = result.student.dob;
                    const day = dobStr.substring(0, 2);
                    const month = dobStr.substring(2, 4);
                    const year = dobStr.substring(4, 8);
                    setDob(new Date(year, month - 1, day));
                }
                
                console.log('Student data updated successfully');
                setPopupOpen(true);
            } else {
                throw new Error('No student data returned from server');
            }
        } catch (err) {
            console.error('Save error:', err);
            alert('Failed to save: ' + (err.message || 'Unknown error'));
        } finally {
            setIsSaving(false);
        }
    };

    const closePopup = () => {
        setPopupOpen(false);
        // Redirect back to AdminstudDB.js (previous page) after closing popup
        navigate(-1);
    };

    // Fetch degrees and branches from database
    useEffect(() => {
        let isSubscribed = true;

        const fetchDegreeAndBranchData = async () => {
            try {
                const mongoDBService = (await import('../services/mongoDBService.jsx')).default;
                const [degreeList, branchList] = await Promise.all([
                    mongoDBService.getDegrees(),
                    mongoDBService.getBranches(),
                ]);

                if (!isSubscribed) return;

                const sanitizedDegrees = Array.isArray(degreeList)
                    ? degreeList.map((degree) => ({
                        ...degree,
                        degreeAbbreviation:
                            degree.degreeAbbreviation || degree.abbreviation || degree.shortName || '',
                        degreeFullName: degree.degreeFullName || degree.fullName || degree.name || '',
                    }))
                    : [];

                const sanitizedBranches = Array.isArray(branchList) ? branchList : [];

                setDegrees(sanitizedDegrees);
                setBranches(sanitizedBranches);
            } catch (error) {
                console.error('Failed to fetch degree/branch data:', error);
            }
        };

        fetchDegreeAndBranchData();

        return () => {
            isSubscribed = false;
        };
    }, []);

    const handleDiscard = () => {
        if (formRef.current) {
            // 1. Reset Form Fields
            formRef.current.reset();
            // 2. Reset Local States
            setStudyCategory('12th');
            setDob(null);
            // 3. Reset Image
            handleImageRemove(new Event('discard'));
        }
        // Navigate back to admin student database
        navigate('/admin-student-database');
    };

    const handleViewChange = (view) => {
        onViewChange(view);
        setIsSidebarOpen(false);
    };

    useEffect(() => {
        const MIN_LOADER_MS = 500; // Minimum loading time for smooth UX
        let progressInterval;
        
        const load = async () => {
            const loadStartTime = Date.now();
            
            try {
                // Initialize loading state
                setLoadingProgress(0);
                setIsInitialLoading(true);
                
                // Start smooth progress animation synced with backend
                progressInterval = setInterval(() => {
                    setLoadingProgress(p => {
                        if (p >= 90) return p; // Stop at 90% until data loads
                        return p + 3; // Smooth increments
                    });
                }, 150); // Same timing as achievements page
                
                console.log('⚡ ADMIN PROFILE: Loading student data from backend...');
                
                // Fetch student data from backend
                const fastDataService = (await import('../services/fastDataService.jsx')).default;
                
                const complete = await Promise.race([
                    fastDataService.getCompleteStudentData(studentId, false),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Load timeout')), 30000)
                    )
                ]);
                
                const data = complete?.student || null;
                
                // Clear progress interval once data is loaded
                if (progressInterval) {
                    clearInterval(progressInterval);
                    progressInterval = null;
                }
                
                // Jump to 95% when data arrives
                setLoadingProgress(95);
                
                if (data) {
                    const normalized = {
                        section: data.section || data.Section || data.sec || data.sectionName || '',
                        community: data.community || data.Community || '',
                        mediumOfStudy: data.mediumOfStudy || data.medium || '',
                        degree: data.degree || data.course || '',
                        branch: data.branch || data.department || '',
                        currentYear: data.currentYear || data.year || '',
                        currentSemester: data.currentSemester || data.semester || '',
                        willingToSignBond: data.willingToSignBond || data.willingtosignbond || '',
                        preferredModeOfDrive: data.preferredModeOfDrive || data.preferredMode || '',
                        companyTypes: data.companyTypes || data.companyType || '',
                        preferredJobLocation: data.preferredJobLocation || data.jobLocation || '',
                        guardianNumber: data.guardianNumber || data.guardianNo || data.guardianMobile || ''
                    };
                    const merged = { ...data, ...normalized };
                    setStudentData(merged);
                    console.log('📋 Admin - Community:', merged.community, '| Medium:', merged.mediumOfStudy);
                    setStudyCategory(merged.studyCategory || '12th');
                    setCurrentYear(merged.currentYear || '');
                    setCurrentSemester(merged.currentSemester || '');
                    setSelectedDegree(merged.degree || '');
                    setSelectedBranch(merged.branch || '');
                    if (merged.dob) {
                        const dobStr = merged.dob.toString();
                        if (dobStr.length === 8) {
                            // DDMMYYYY format
                            const day = dobStr.substring(0, 2);
                            const month = dobStr.substring(2, 4);
                            const year = dobStr.substring(4, 8);
                            setDob(new Date(year, month - 1, day));
                        } else if (dobStr.includes('-')) {
                            // ISO format (YYYY-MM-DD or full date)
                            const dateObj = new Date(dobStr);
                            if (!isNaN(dateObj.getTime())) {
                                setDob(dateObj);
                            }
                        }
                    }
                    if (merged.profilePicURL) {
                        setProfileImage(merged.profilePicURL);
                        setUploadInfo({ name: 'profile.jpg', date: merged.profileUploadDate || new Date().toLocaleDateString('en-GB') });
                    }
                    setLoginPwdValue(merged.loginPassword || '');
                    setConfirmPwdValue(merged.loginPassword || '');
                    // Initialize checkbox states
                    setSelectedCompanyTypes(parseMultiValue(merged.companyTypes));
                    setSelectedJobLocations(parseMultiValue(merged.preferredJobLocation));
                    
                    // Load resume data
                    try {
                        const mongoDBService = (await import('../services/mongoDBService.jsx')).default;
                        const resumeResponse = await mongoDBService.getResume(studentId);
                        if (resumeResponse?.resume?.fileData) {
                            setHasResume(true);
                            setResumeData(resumeResponse.resume);
                        } else {
                            setHasResume(false);
                            setResumeData(null);
                        }
                    } catch (resumeError) {
                        console.warn('Resume not found or error loading resume:', resumeError);
                        setHasResume(false);
                        setResumeData(null);
                    }
                    
                    console.log('✅ ADMIN PROFILE: Data loaded successfully');
                }
            } catch (e) {
                console.error('❌ AdminDBprofile load error:', e);
                if (progressInterval) {
                    clearInterval(progressInterval);
                    progressInterval = null;
                }
            } finally {
                // Ensure minimum loading time for smooth perceived loading
                const elapsed = Date.now() - loadStartTime;
                const remainingTime = Math.max(0, MIN_LOADER_MS - elapsed);
                
                // Complete progress to 100%
                setLoadingProgress(100);
                
                // Wait for remaining time before hiding loader
                setTimeout(() => {
                    setIsInitialLoading(false);
                    console.log('✅ ADMIN PROFILE: Loading complete');
                }, remainingTime);
            }
        };
        
        load();
        
        return () => {
            if (progressInterval) clearInterval(progressInterval);
        };
    }, [studentId, location.state]);

    // Handle resume preview
    const handleResumePreview = async () => {
        if (!hasResume || !resumeData) return;
        
        try {
            setPreviewPopupState('progress');
            setPreviewProgress(0);
            
            // Simulate progress
            const progressInterval = setInterval(() => {
                setPreviewProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 100);
            
            // Create data URL from resume data
            const dataUrl = `data:${resumeData.fileType};base64,${resumeData.fileData}`;
            
            setPreviewProgress(100);
            clearInterval(progressInterval);
            
            // Open in new tab
            setTimeout(() => {
                const newWindow = window.open('', '_blank');
                if (newWindow) {
                    newWindow.document.write(`
                        <html>
                            <head>
                                <title>${studentData?.firstName} ${studentData?.lastName} - Resume</title>
                                <style>
                                    body { margin: 0; padding: 0; }
                                    iframe { width: 100vw; height: 100vh; border: none; }
                                </style>
                            </head>
                            <body>
                                <iframe src="${dataUrl}"></iframe>
                            </body>
                        </html>
                    `);
                    newWindow.document.close();
                }
                setPreviewPopupState('none');
                setPreviewProgress(0);
            }, 500);
        } catch (error) {
            console.error('Resume preview error:', error);
            setPreviewPopupState('none');
            setPreviewProgress(0);
        }
    };

    return (
        <div className={styles['Admin-DB-AdProfile-container']}> 

            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className={styles['Admin-DB-AdProfile-main']}> 

                <Sidebar
                    isOpen={isSidebarOpen}
                    onLogout={onLogout}
                    currentView={'student-database'}
                    onViewChange={handleViewChange}
                />
                <div className={styles['Admin-DB-AdProfile-dashboard-area'] + ' dashboard-area'}>
                    {isInitialLoading && (
                        <PreviewProgressAlert 
                            isOpen={true} 
                            progress={loadingProgress} 
                            title="Loading..." 
                            messages={{ initial: 'Fetching student from database...', mid: 'Preparing profile...', final: 'Opening profile...' }}
                            color="#2E7D32"
                            progressColor="#2E7D32"
                        />
                    )}

                    <form ref={formRef} onSubmit={handleSave}>
                        {/* --- PERSONAL INFO --- */}
                        <div className={styles['Admin-DB-AdProfile-profile-section-container']}>
                            <h3 className={styles['Admin-DB-AdProfile-section-header']}>Personal Information</h3>
                            <div className={styles['Admin-DB-AdProfile-form-grid']}>
                                <div className={styles['Admin-DB-AdProfile-personal-info-fields']}>
                                    <input type="text" name="firstName" placeholder="First Name" defaultValue={studentData?.firstName || ''} disabled={!isEditable} />
                                    <input type="text" name="lastName" placeholder="Last Name" defaultValue={studentData?.lastName || ''} disabled={!isEditable} />
                                    <input type="text" name="regNo" placeholder="Register Number (11 digits)" defaultValue={studentData?.regNo || ''} disabled={!isEditable} />
                                    <select name="batch" value={studentData?.batch || ''} onChange={(e) => handleSelectChange('batch', e.target.value)} disabled={!isEditable}>
                                        <option value="" disabled>Batch</option>
                                        {generateBatchOptions().map((batch) => (
                                            <option key={batch.value} value={batch.value}>
                                                {batch.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className={styles['Admin-DB-AdProfile-date-wrapper']}>
                                        <DatePicker
                                            selected={dob}
                                            onChange={(date) => setDob(date)}
                                            dateFormat="dd-MM-yyyy"
                                            placeholderText="Select DOB"
                                            className={styles['Admin-DB-AdProfile-date-input']}
                                            showPopperArrow={false}
                                            showMonthDropdown
                                            showYearDropdown
                                            dropdownMode="select"
                                            yearDropdownItemNumber={15}
                                            scrollableYearDropdown
                                            maxDate={new Date()}
                                            isClearable
                                            autoComplete="off"
                                            disabled={!isEditable}
                                        />
                                    </div>
                                    <select 
                                        name="degree" 
                                        value={selectedDegree} 
                                        onChange={(e) => handleSelectChange('degree', e.target.value)} 
                                        disabled={!isEditable}
                                        required
                                    >
                                        <option value="" disabled>Degree *</option>
                                        {degrees.map((degree) => {
                                            const value = degree.degreeAbbreviation || degree.degreeFullName;
                                            const label = degree.degreeFullName
                                                ? degree.degreeAbbreviation
                                                    ? `${degree.degreeFullName} (${degree.degreeAbbreviation})`
                                                    : degree.degreeFullName
                                                : value;
                                            return (
                                                <option key={degree.id || degree._id || value} value={value}>
                                                    {label}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <select 
                                        name="branch" 
                                        value={selectedBranch} 
                                        onChange={(e) => handleSelectChange('branch', e.target.value)} 
                                        disabled={!isEditable || !selectedDegree}
                                        required
                                    >
                                        <option value="" disabled>
                                            {selectedDegree ? 'Branch *' : 'Select Degree First'}
                                        </option>
                                        {filteredBranches.map((branch) => {
                                            const value = getBranchOptionValue(branch);
                                            const label = branch.branchFullName
                                                ? branch.branchAbbreviation
                                                    ? `${branch.branchFullName} (${branch.branchAbbreviation})`
                                                    : branch.branchFullName
                                                : value;
                                            return (
                                                <option key={branch.id || branch._id || value} value={value}>
                                                    {label}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <select name="currentYear" value={currentYear || studentData?.currentYear || ''} onChange={(e) => handleSelectChange('currentYear', e.target.value)} disabled={!isEditable}><option value="" disabled>Current Year</option><option value="I">I</option><option value="II">II</option><option value="III">III</option><option value="IV">IV</option></select>
                                    <select 
                                        name="currentSemester" 
                                        value={currentSemester || studentData?.currentSemester || ''} 
                                        onChange={(e) => handleSelectChange('currentSemester', e.target.value)} 
                                        disabled={!isEditable || !currentYear}
                                    >
                                        <option value="" disabled>
                                            {currentYear ? 'Current Semester' : 'Select Year First'}
                                        </option>
                                        {getAvailableSemesters(currentYear).map((semesterOption) => (
                                            <option key={semesterOption} value={semesterOption}>
                                                {semesterOption}
                                            </option>
                                        ))}
                                    </select>
                                    <select name="section" value={studentData?.section || ''} onChange={(e) => handleSelectChange('section', e.target.value)} disabled={!isEditable}><option value="" disabled>Section</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select>
                                    <select name="gender" value={studentData?.gender || ''} onChange={(e) => handleSelectChange('gender', e.target.value)} disabled={!isEditable}><option value="" disabled>Gender</option><option value="male">Male</option><option value="female">Female</option></select>
                                    
                                    <input type="text" name="address" placeholder="Address" defaultValue={studentData?.address || ''} disabled={!isEditable} />
                                    
                                    
                                    
                                    <input type="text" name="city" placeholder="City" defaultValue={studentData?.city || ''} disabled={!isEditable} />
                                    <input type="email" name="primaryEmail" placeholder="Primary Mail id" defaultValue={studentData?.primaryEmail || ''} disabled={!isEditable} />
                                    <input type="email" name="domainEmail" placeholder="Domain Mail id" defaultValue={studentData?.domainEmail || ''} disabled={!isEditable} />
                                    <input type="tel" name="mobileNo" placeholder="Mobile No." defaultValue={studentData?.mobileNo || ''} disabled={!isEditable} />
                                   
                                    <input type="text" name="fatherName" placeholder="Father Name" defaultValue={studentData?.fatherName || ''} disabled={!isEditable} />
                                    <input type="text" name="fatherOccupation" placeholder="Father Occupation" defaultValue={studentData?.fatherOccupation || ''} disabled={!isEditable} />
                                    <input type="text" name="fatherMobile" placeholder="Father Mobile No." defaultValue={studentData?.fatherMobile || ''} disabled={!isEditable} />
                                    
                                    <input type="text" name="motherName" placeholder="Mother Name" defaultValue={studentData?.motherName || ''} disabled={!isEditable} />
                                    <input type="text" name="motherOccupation" placeholder="Mother Occupation" defaultValue={studentData?.motherOccupation || ''} disabled={!isEditable} />
                                    <input type="text" name="motherMobile" placeholder="Mother Mobile No." defaultValue={studentData?.motherMobile || ''} disabled={!isEditable} />
                                    
                                    <input type="text" name="guardianName" placeholder="Guardian Name" defaultValue={studentData?.guardianName || ''} disabled={!isEditable} />
                                    <input type="tel" name="guardianNumber" placeholder="Guardian Number" defaultValue={studentData?.guardianNumber || ''} disabled={!isEditable} />
                                    <input type="text" name="aadhaarNo" placeholder="Aadhaar Number" defaultValue={studentData?.aadhaarNo || ''} disabled={!isEditable} />
                                     <button 
                                            type="button"
                                            className={styles['Admin-DB-AdProfile-certificate-btn']}
                                            onClick={() => navigate(`/admin-student-certificates/${studentId}`, {
                                                state: { studentData }
                                            })}
                                        >
                                            Certificates
                                        </button>
                                    {/* Certificates and Resume Buttons */}
                                    
                                    
                                </div>
                                <div className={styles['Admin-DB-AdProfile-profile-photo-wrapper']}>
                                    <div className={styles['Admin-DB-AdProfile-profile-photo-box']} style={{ height: '675px' }}>
                                        <h3 className={styles['Admin-DB-AdProfile-section-header']}>Profile Photo</h3>
                                        <div className={styles['Admin-DB-AdProfile-profile-icon-container']}>
                                            {profileImage ? ( <img src={profileImage} alt="Profile Preview" className={styles['Admin-DB-AdProfile-profile-preview-img']} onClick={() => setImagePreviewOpen(true)} /> ) : ( <GraduationCapIcon /> )}
                                        </div>
                                        {profileImage && uploadInfo.name && (
                                            <div className={styles['Admin-DB-AdProfile-upload-info-container']}>
                                                <div className={styles['Admin-DB-AdProfile-upload-info-item']}><FileIcon /><span>{uploadInfo.name}</span></div>
                                                <div className={styles['Admin-DB-AdProfile-upload-info-item']}><CalendarIcon /><span>Uploaded on: {uploadInfo.date}</span></div>
                                            </div>
                                        )}
                                        {isEditable && (
                                            <div className={styles['Admin-DB-AdProfile-upload-action-area']}>
                                                <div className={styles['Admin-DB-AdProfile-upload-btn-wrapper']}>
                                                    <label htmlFor="photo-upload-input" className={styles['Admin-DB-AdProfile-profile-upload-btn']}><div className={styles['Admin-DB-AdProfile-upload-btn-content']}><MdUpload /><span>Upload (Max 500 KB)</span></div></label>
                                                    {profileImage && ( <button onClick={handleImageRemove} className={styles['Admin-DB-AdProfile-remove-image-btn']} aria-label="Remove image"><IoMdClose /></button> )}
                                                </div>
                                                <input type="file" id="photo-upload-input" ref={fileInputRef} style={{ display: 'none' }} accept="image/jpeg" onChange={handleImageUpload} />
                                                {uploadSuccess && ( <p className={styles['Admin-DB-AdProfile-upload-success-message']}>Profile Photo uploaded Successfully!</p> )}
                                                <p className={styles['Admin-DB-AdProfile-upload-hint']}>*Only JPG format is allowed.</p>
                                            </div>
                                        )}
                                        
                                            
                                    </div>
                                    <div className={styles['Admin-DB-AdProfile-additional-info-fields']} style={{gap: '2.5rem'}}  >
                                
                                    <select name="community" value={studentData?.community || ''} onChange={(e) => handleSelectChange('community', e.target.value)} disabled={!isEditable} style={{marginTop:'23px'}}><option value="" disabled>Community</option> <option value="OC">OC</option><option value="BC">BC</option><option value="BCM">BCM</option><option value="MBC">MBC</option><option value="SC">SC</option><option value="SCA">SCA</option><option value="ST">ST</option></select>

                                    <select name="mediumOfStudy" value={studentData?.mediumOfStudy || ''} onChange={(e) => handleSelectChange('mediumOfStudy', e.target.value)} disabled={!isEditable} style={{marginTop:'23px'}}><option value="" disabled>Medium of study</option><option value="English">English</option><option value="Tamil">Tamil</option><option value="Other">Others</option></select>
                                    <input type="text" name="bloodGroup"  style={{marginTop:'23px'}} placeholder="Blood Group" defaultValue={studentData?.bloodGroup || ''} disabled={!isEditable}  />
                                    <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                                       
                                        <button 
                                            type="button"
                                            className={styles['Admin-DB-AdProfile-resume-btn']}
                                            onClick={hasResume ? handleResumePreview : undefined}
                                            style={{ cursor: hasResume ? 'pointer' : 'default' }}
                                        >
                                            <span>Resume</span>
                                            {hasResume ? (
                                                <svg 
                                                    width="24" 
                                                    height="24" 
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    style={{ marginLeft: '8px' }}
                                                >
                                                    <circle cx="12" cy="12" r="10" fill="white" />
                                                    <path 
                                                        d="M9 12L11 14L15 10" 
                                                        stroke="#4EA24E" 
                                                        strokeWidth="2" 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            ) : (
                                                <svg 
                                                    width="24" 
                                                    height="24" 
                                                    viewBox="0 0 24 24" 
                                                    fill="none" 
                                                    style={{ marginLeft: '8px' }}
                                                >
                                                    <circle cx="12" cy="12" r="10" fill="white" />
                                                    <path 
                                                        d="M8 8L16 16M16 8L8 16" 
                                                        stroke="#DC2626" 
                                                        strokeWidth="2" 
                                                        strokeLinecap="round" 
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                                </div>
                            
                        </div>
                        {isInitialLoading && (
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <style>{`@keyframes tableSpin{to{transform:rotate(360deg)}}`}</style>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '5px solid #bfe0c5', borderTopColor: '#2E7D32', animation: 'tableSpin 0.8s linear infinite' }} />
                                    <div style={{ marginTop: '8px', color: '#1b5e20', fontWeight: 600, fontSize: '13px' }}>
                                        Fetching from database...
                                    </div>
                                </div>
                            </div>
                        )}
                        </div>

                        {/* --- ACADEMIC BACKGROUND --- */}
                        <div className={styles['Admin-DB-AdProfile-profile-section-container']}>
                            <h3 className={styles['Admin-DB-AdProfile-section-header']}>Academic Background</h3>
                            <div className={styles['Admin-DB-AdProfile-form-grid']}>
                                <div className={styles['Admin-DB-AdProfile-study-category']} style={{ gridColumn: '1 / -1' }}>
                                    <input type="radio" id="12th" name="study_category" value="12th" checked={studyCategory === '12th'} onChange={(e) => setStudyCategory(e.target.value)} disabled={!isEditable} />
                                    <label htmlFor="12th" style={{ cursor: !isEditable ? 'default' : 'pointer' }}>12th</label>
                                    <input type="radio" id="diploma" name="study_category" value="diploma" checked={studyCategory === 'diploma'} onChange={(e) => setStudyCategory(e.target.value)} disabled={!isEditable} />
                                    <label htmlFor="diploma" style={{ cursor: !isEditable ? 'default' : 'pointer' }}>Diploma</label>
                                    <input type="radio" id="both" name="study_category" value="both" checked={studyCategory === 'both'} onChange={(e) => setStudyCategory(e.target.value)} disabled={!isEditable} />
                                    <label htmlFor="both" style={{ cursor: !isEditable ? 'default' : 'pointer' }}>Both</label>
                                </div>
                                <input type="text" name="tenthInstitution" placeholder="10th Institution Name" defaultValue={studentData?.tenthInstitution || ''} disabled={!isEditable} />
                                <select name="tenthBoard" value={studentData?.tenthBoard || ''} onChange={(e) => handleSelectChange('tenthBoard', e.target.value)} disabled={!isEditable}><option value="" disabled>10th Board/University</option><option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="Other State Board">Other State Board</option></select>
                                <input type="text" name="tenthPercentage" placeholder="10th Percentage" defaultValue={studentData?.tenthPercentage || ''} disabled={!isEditable} />
                                <input type="text" name="tenthYear" placeholder="10th Year of Passing" defaultValue={studentData?.tenthYear || ''} disabled={!isEditable} />
                                {(studyCategory === '12th' || studyCategory === 'both') && (
                                    <>
                                        <input type="text" name="twelfthInstitution" placeholder="12th Institution Name" defaultValue={studentData?.twelfthInstitution || ''} disabled={!isEditable} />
                                        <select name="twelfthBoard" value={studentData?.twelfthBoard || ''} onChange={(e) => handleSelectChange('twelfthBoard', e.target.value)} disabled={!isEditable}><option value="" disabled>12th Board/University</option><option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="Other State Board">Other State Board</option></select>
                                        <input type="text" name="twelfthPercentage" placeholder="12th Percentage" defaultValue={studentData?.twelfthPercentage || ''} disabled={!isEditable} />
                                        <input type="text" name="twelfthYear" placeholder="12th Year of Passing" defaultValue={studentData?.twelfthYear || ''} disabled={!isEditable} />
                                        <input type="text" name="twelfthCutoff" placeholder="12th Cut-off Marks" defaultValue={studentData?.twelfthCutoff || ''} disabled={!isEditable} />
                                    </>
                                )}
                                {(studyCategory === 'diploma' || studyCategory === 'both') && (
                                    <>
                                        <input type="text" name="diplomaInstitution" placeholder="Diploma Institution" defaultValue={studentData?.diplomaInstitution || ''} disabled={!isEditable} />
                                        <input type="text" name="diplomaBranch" placeholder="Diploma Branch" defaultValue={studentData?.diplomaBranch || ''} disabled={!isEditable} />
                                        <input type="text" name="diplomaPercentage" placeholder="Diploma Percentage" defaultValue={studentData?.diplomaPercentage || ''} disabled={!isEditable} />
                                        <input type="text" name="diplomaYear" placeholder="Diploma Year of Passing" defaultValue={studentData?.diplomaYear || ''} disabled={!isEditable} />
                                    </>
                                )}
                            </div>
                        </div>

                        
                        
                        {/* --- SEMESTER & OTHER DETAILS --- */}
                        <div className={styles['Admin-DB-AdProfile-profile-section-container']}>
                            <h3 className={styles['Admin-DB-AdProfile-section-header']}>Semester</h3>
                            <div className={styles['Admin-DB-AdProfile-form-grid']}>
                                {getAllGPAFields().map((field) => {
                                    const isRequired = getRequiredGPAFields().includes(field);
                                    const semesterLabel = field.replace(/\D/g, '');
                                    return (
                                        <input
                                            key={field}
                                            type="text"
                                            name={field}
                                            placeholder={`Semester ${semesterLabel} GPA${isRequired ? ' *' : ''} (e.g., 9.08)`}
                                            defaultValue={studentData?.[field] || ''}
                                            inputMode="decimal"
                                            onInput={isEditable ? handleGpaInput : undefined}
                                            onBlur={isEditable ? handleGpaBlur : undefined}
                                            disabled={!isEditable}
                                        />
                                    );
                                })}
                                <input 
                                    type="text" 
                                    name="overallCGPA" 
                                    placeholder="Overall CGPA (e.g., 9.08)" 
                                    defaultValue={studentData?.overallCGPA || ''} 
                                    inputMode="decimal"
                                    onInput={isEditable ? handleGpaInput : undefined}
                                    onBlur={isEditable ? handleGpaBlur : undefined}
                                    disabled={!isEditable} 
                                />
                                <input type="text" name="clearedBacklogs" placeholder="No. of Backlogs (Cleared)" defaultValue={studentData?.clearedBacklogs || ''} disabled={!isEditable} />
                                <input type="text" name="currentBacklogs" placeholder="No. of Current Backlogs" defaultValue={studentData?.currentBacklogs || ''} disabled={!isEditable} />
                                <select name="arrearStatus" value={studentData?.arrearStatus || ''} onChange={(e) => handleSelectChange('arrearStatus', e.target.value)} disabled={!isEditable}>
                                    <option value="" disabled>Arrear Status</option>
                                    <option value="NHA">NHA</option>
                                    <option value="NSA">NSA</option>
                                    <option value="SA">SA</option>
                                </select>
                                <input type="text" name="yearOfGap" placeholder="Year of Gap" defaultValue={studentData?.yearOfGap || ''} disabled={!isEditable} />
                                <input type="text" name="gapReason" placeholder="Reason for year of Gap" style={{ gridColumn: '1 / -1' }} defaultValue={studentData?.gapReason || ''} disabled={!isEditable} />
                            </div>
                        </div>
                        <div className={styles['Admin-DB-AdProfile-profile-section-container']}>
                            <h3 className={styles['Admin-DB-AdProfile-section-header']}>Other Details</h3>
                            <div className={styles['Admin-DB-AdProfile-form-grid']}>
                                <select name="residentialStatus" value={studentData?.residentialStatus || ''} onChange={(e) => handleSelectChange('residentialStatus', e.target.value)} disabled={!isEditable}><option value="" disabled>Residential status</option><option value="Hosteller">Hosteller</option><option value="Dayscholar">Dayscholar</option></select>
                                <select name="quota" value={studentData?.quota || ''} onChange={(e) => handleSelectChange('quota', e.target.value)} disabled={!isEditable}><option value="" disabled>Quota</option><option value="Management">Management</option><option value="Counselling">Counselling</option></select>
                                <input type="text" name="languagesKnown" placeholder="Languages Known" defaultValue={studentData?.languagesKnown || ''} disabled={!isEditable} />
                                <select name="firstGraduate" value={studentData?.firstGraduate || ''} onChange={(e) => handleSelectChange('firstGraduate', e.target.value)} disabled={!isEditable}><option value="" disabled>First Graduate</option><option value="Yes">Yes</option><option value="No">No</option></select>
                                <input type="text" name="passportNo" placeholder="Passport No." defaultValue={studentData?.passportNo || ''} disabled={!isEditable} />
                                <input type="text" name="skillSet" placeholder="Skill set" defaultValue={studentData?.skillSet || ''} disabled={!isEditable} />
                                <input type="text" name="valueAddedCourses" placeholder="Value Added Courses" defaultValue={studentData?.valueAddedCourses || ''} disabled={!isEditable} />
                                <input type="text" name="aboutSibling" placeholder="About sibling" defaultValue={studentData?.aboutSibling || ''} disabled={!isEditable} />
                                <input type="text" name="rationCardNo" placeholder="Ration card No." defaultValue={studentData?.rationCardNo || ''} disabled={!isEditable} />
                                <input type="text" name="familyAnnualIncome" placeholder="Family Annual Income" defaultValue={studentData?.familyAnnualIncome || ''} disabled={!isEditable} />
                                <input type="text" name="panNo" placeholder="PAN No." defaultValue={studentData?.panNo || ''} disabled={!isEditable} />
                                <select name="willingToSignBond" value={studentData?.willingToSignBond || ''} onChange={(e) => handleSelectChange('willingToSignBond', e.target.value)} disabled={!isEditable}><option value="" disabled>Willing to Sign Bond</option><option value="Yes">Yes</option><option value="No">No</option></select>
                                <select name="preferredModeOfDrive" value={studentData?.preferredModeOfDrive || ''} onChange={(e) => handleSelectChange('preferredModeOfDrive', e.target.value)} disabled={!isEditable}><option value="" disabled>Preferred Mode of Drive</option><option value="Online">Online</option><option value="Offline">Offline</option><option value="Hybrid">Hybrid</option></select>
                                <input type="text" name="githubLink" placeholder="GitHub Link" defaultValue={studentData?.githubLink || ''} disabled={!isEditable} />
                                <input type="text" name="linkedinLink" placeholder="LinkedIn Profile Link" defaultValue={studentData?.linkedinLink || ''} disabled={!isEditable} />
                                
                                {/* Company Types Checkbox Group */}
                                <div className={styles['Admin-DB-AdProfile-checkbox-group']}>
                                    <span className={styles['Admin-DB-AdProfile-checkbox-group-label']}>Company Types</span>
                                    <div className={styles['Admin-DB-AdProfile-checkbox-options']}>
                                        {COMPANY_TYPE_OPTIONS.map((type) => (
                                            <label key={type} className={styles['Admin-DB-AdProfile-checkbox-option']}>
                                                <input
                                                    type="checkbox"
                                                    value={type}
                                                    checked={selectedCompanyTypes.includes(type)}
                                                    onChange={handleCompanyTypeChange}
                                                    disabled={!isEditable}
                                                />
                                                <span>{type}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Preferred Job Locations Checkbox Group */}
                                <div className={styles['Admin-DB-AdProfile-checkbox-group']}>
                                    <span className={styles['Admin-DB-AdProfile-checkbox-group-label']}>Preferred Job Locations</span>
                                    <div className={styles['Admin-DB-AdProfile-checkbox-options']}>
                                        {JOB_LOCATION_OPTIONS.map((location) => (
                                            <label key={location} className={styles['Admin-DB-AdProfile-checkbox-option']}>
                                                <input
                                                    type="checkbox"
                                                    value={location}
                                                    checked={selectedJobLocations.includes(location)}
                                                    onChange={handleJobLocationChange}
                                                    disabled={!isEditable}
                                                />
                                                <span>{location}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- LOGIN DETAILS (moved to end) --- */}
                        <div className={styles['Admin-DB-AdProfile-profile-section-container']}>
                            <h3 className={styles['Admin-DB-AdProfile-section-header']}>Login Details</h3>
                            <div className={styles['Admin-DB-AdProfile-form-grid']}>
                                <input type="text" name="loginRegNo" placeholder="Login Registration Number" defaultValue={studentData?.loginRegNo || studentData?.regNo || ''} disabled={!isEditable} />
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type={showPwd ? 'text' : 'password'} 
                                        name="loginPassword" 
                                        placeholder="Login Password" 
                                        value={loginPwdValue} 
                                        onChange={(e) => setLoginPwdValue(e.target.value)} 
                                        disabled={!isEditable} 
                                        style={{ paddingRight: isEditable ? 40 : 12 }}
                                    />
                                    {isEditable && (
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPwd(!showPwd)} 
                                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                                        >
                                            <EyeIcon isOpen={showPwd} />
                                        </button>
                                    )}
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        type={showConfirmPwd ? 'text' : 'password'} 
                                        name="confirmLoginPassword" 
                                        placeholder="Confirm Login Password" 
                                        value={confirmPwdValue} 
                                        onChange={(e) => setConfirmPwdValue(e.target.value)}
                                        disabled={!isEditable} 
                                        style={{ paddingRight: isEditable ? 40 : 12 }}
                                        required={loginPwdValue ? true : false}
                                    />
                                    {isEditable && (
                                        <button 
                                            type="button" 
                                            onClick={() => setShowConfirmPwd(!showConfirmPwd)} 
                                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                                        >
                                            <EyeIcon isOpen={showConfirmPwd} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* ACTION BUTTONS */}
                        {isEditable && (
                            <div className={styles['Admin-DB-AdProfile-action-buttons']}>
                                <button 
                                    type="button" 
                                    className={`${styles['Admin-DB-AdProfile-discard-btn']} ${isSaving ? styles['Admin-DB-AdProfile-discard-btn-disabled'] : ''}`}
                                    onClick={handleDiscard}
                                    disabled={isSaving}
                                >
                                    Discard
                                </button>
                                <button 
                                    type="submit" 
                                    className={styles['Admin-DB-AdProfile-save-btn']}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <div className={styles['Admin-DB-AdProfile-loading-spinner']} />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save'
                                    )}
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
            {isSidebarOpen && <div className={styles['Admin-DB-AdProfile-overlay']} onClick={() => setIsSidebarOpen(false)}></div>} 
            
            {/* --- All Popups --- */}
            <SuccessPopup isOpen={isPopupOpen} onClose={closePopup} />
            <ValidationAlert 
                isOpen={errorAlert.isOpen} 
                onClose={() => setErrorAlert({ isOpen: false, message: '' })} 
                message={errorAlert.message}
            />
            <FileSizeErrorPopup 
                isOpen={isFileSizeErrorOpen} 
                onClose={() => setIsFileSizeErrorOpen(false)} 
                fileSizeKB={fileSizeErrorKB}
            />
            <ImagePreviewModal src={profileImage} isOpen={isImagePreviewOpen} onClose={() => setImagePreviewOpen(false)} />
            
            {/* Resume Preview Alert */}
            <PreviewProgressAlert 
                isOpen={previewPopupState === 'progress'} 
                progress={previewProgress} 
                fileLabel="resume"
                color="#4EA24E"
                progressColor="#4EA24E"
            />
        </div>
    );
}

export default AdminAdProfile;