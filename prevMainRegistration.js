import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import BlueAdminicon from './assets/BlueAdminicon.png'
import Navbar from "./components/Navbar/mrnavbar";
import Sidebar from "./components/Sidebar/mrsidebar";
import personalinfo from "./assets/personal information icon.svg";
import academicIcon from "./assets/academic.svg";
import semesterIcon from "./assets/semester.svg";
import otherDetailsIcon from "./assets/otherdetails.svg";
import logindetailsIcon from "./assets/logindetails.svg";
import "./MainRegistration.css";

// Inlined SVG components remain here as they are used by the form
const MdUpload = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path></svg>
);

const IoMdClose = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path></svg>
);

const GraduationCapIcon = () => (
    <img src={BlueAdminicon} alt="Graduation Cap" style={{ width: '100px', height: '90px', marginTop: '-20px' }} />
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
        <div className="mr-popup-overlay">
            <div className="mr-popup-container">
                <div className="mr-popup-header">
                    Registered !
                </div>
                <div className="mr-popup-body">
                    <svg className="mr-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="mr-success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
                        <path className="mr-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <h2>Login Created Γ£ô</h2>
                    <p>Student ID Created!</p>
                    <p>Click Login button to Redirect </p>
                </div>
                <div className="mr-popup-footer">
                    {/* Use Link component for redirection */}
                    <Link to="/mainlogin" style={{position : "relative",marginLeft : '65px'}}>
                        <button className="mr-popup-login-btn">Login</button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

const ExistingRegNoPopup = ({ isOpen, onClose, regNo }) => {
    if (!isOpen) return null;

    return (
        <div className="mr-popup-overlay">
            <div className="mr-popup-container">
                <div className="mr-popup-header" style={{ backgroundColor: '#1976d2' }}>
                    Registration Number Already Exists!
                </div>
                <div className="mr-popup-body">
                    <svg className="mr-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="mr-error-icon--circle" cx="26" cy="26" r="25" fill="none"/>
                        <path className="mr-error-icon--cross" fill="none" d="M16 16l20 20M36 16l-20 20"/>
                    </svg>
                    <h2 style={{ color: '#000000' }}>Registration Number Already Exists</h2>
                    <p style={{ marginBottom: '8px' }}>Registration Number: <strong>{regNo}</strong></p>
                    <p style={{ marginBottom: '8px' }}>This registration number is already registered in our system.</p>
                    <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                        Please use a different registration number or contact support if you believe this is an error.
                    </p>
                </div>
                <div className="mr-popup-footer">
                    <button onClick={onClose} className="mr-popup-close-btn-blue">OK</button>
                </div>
            </div>
        </div>
    );
};

const MismatchedRegNoPopup = ({ isOpen, onClose, personalRegNo, loginRegNo }) => {
    if (!isOpen) return null;

    return (
        <div className="mr-popup-overlay">
            <div className="mr-popup-container">
                <div className="mr-popup-header" style={{ backgroundColor: '#1976d2' }}>
                    Registration Numbers Don't Match!
                </div>
                <div className="mr-popup-body">
                    <svg className="mr-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="mr-error-icon--circle" cx="26" cy="26" r="25" fill="none"/>
                        <path className="mr-error-icon--cross" fill="none" d="M16 16l20 20M36 16l-20 20"/>
                    </svg>
                    <h2 style={{ color: '#000000' }}>Registration Numbers Don't Match Γ£ù</h2>
                    <p style={{ marginBottom: '8px' }}>Personal Info Registration: <strong>{personalRegNo}</strong></p>
                    <p style={{ marginBottom: '8px' }}>Login Registration: <strong>{loginRegNo}</strong></p>
                    <p style={{ marginBottom: '8px' }}>The login registration number must match the personal information registration number.</p>
                    <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
                        Please enter the same registration number in both fields.
                    </p>
                </div>
                <div className="mr-popup-footer">
                    <button onClick={onClose} className="mr-popup-close-btn-blue">OK</button>
                </div>
            </div>
        </div>
    );
};

const FileSizeErrorPopup = ({ isOpen, onClose, fileSizeKB }) => {
    if (!isOpen) return null;
    return (
        <div className="mr-popup-overlay">
            <div className="mr-popup-container">
                <div className="mr-popup-header" style={{ backgroundColor: '#1976d2' }}>
                    Image Too Large!
                </div>
                <div className="mr-popup-body">
                    <div className="mr-image-error-icon-container">
                        <svg className="mr-image-error-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                <path d="M15 8h.01M12.5 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6.5"/>
                                <path d="m3 16l5-5c.928-.893 2.072-.893 3 0l3 3m0 0l1-1c.616-.593 1.328-.792 2.008-.598M16 19a3 3 0 1 0 6 0a3 3 0 1 0-6 0m1 2l4-4"/>
                            </g>
                        </svg>
                    </div>
                    <h2 style={{ color: '#d32f2f' }}>Image Size Exceeded Γ£ù</h2>
                    <p style={{ marginBottom: '16px', marginTop: '20px' }}>Maximum allowed: <strong>500KB</strong></p>
                    <p style={{ marginBottom: '16px' }}>Your image size: <strong>{fileSizeKB}KB</strong></p>
                    <p style={{ fontSize: '14px', color: '#666', marginTop: '20px', marginBottom: '10px' }}>
                        Please compress your image or choose a smaller file.
                    </p>
                </div>
                <div className="mr-popup-footer">
                    <button onClick={onClose} className="mr-popup-close-btn-blue">OK</button>
                </div>
            </div>
        </div>
    );
};

const ImagePreviewModal = ({ src, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="mr-image-preview-overlay" onClick={onClose}>
            <div className="mr-image-preview-container" onClick={(e) => e.stopPropagation()}>
                <img src={src} alt="Profile Preview" className="mr-image-preview-content" />
                <button onClick={onClose} className="mr-image-preview-close-btn">&times;</button>
            </div>
        </div>
    );
};


function MainRegistration() {
    const sectionList = useMemo(() => [
        { key: 'personal', label: 'Personal Information', icon: personalinfo },
        { key: 'academic', label: 'Academic Background', icon: academicIcon },
        { key: 'semester', label: 'Semester', icon: semesterIcon },
        { key: 'other', label: 'Other Details', icon: otherDetailsIcon },
        { key: 'login', label: 'Login Details', icon: logindetailsIcon },
    ], []);
    
    const [activeSection, setActiveSection] = useState('personal');
    const [completedSections, setCompletedSections] = useState({});
    const personalRef = useRef(null);
    const academicRef = useRef(null);
    const semesterRef = useRef(null);
    const otherRef = useRef(null);
    const loginRef = useRef(null);
    
    const sectionRefs = useMemo(() => ({
        personal: personalRef,
        academic: academicRef,
        semester: semesterRef,
        other: otherRef,
        login: loginRef,
    }), [personalRef, academicRef, semesterRef, otherRef, loginRef]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const isScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef(null);

    const [dob, setDob] = useState(null);
    const [studyCategory, setStudyCategory] = useState('12th');
    const [currentYear, setCurrentYear] = useState('');
    const [currentSemester, setCurrentSemester] = useState('');
    const [isPopupOpen, setPopupOpen] = useState(false);
    const formRef = useRef(null);
    const [profileImage, setProfileImage] = useState(null);
    const [uploadInfo, setUploadInfo] = useState({ name: '', date: '' });
    const fileInputRef = useRef(null);
    const [isImagePreviewOpen, setImagePreviewOpen] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isRegisterEnabled, setIsRegisterEnabled] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isExistingRegNoPopupOpen, setExistingRegNoPopupOpen] = useState(false);
    const [existingRegNo, setExistingRegNo] = useState('');
    const [isCheckingRegNo, setIsCheckingRegNo] = useState(false);
    const [isMismatchedRegNoPopupOpen, setMismatchedRegNoPopupOpen] = useState(false);
    const [personalRegNo, setPersonalRegNo] = useState('');
    const [loginRegNo, setLoginRegNo] = useState('');
    const [isFileSizeErrorOpen, setIsFileSizeErrorOpen] = useState(false);
    const [fileSizeErrorKB, setFileSizeErrorKB] = useState('');

    // Dynamic batch generation based on current year
    const generateBatchOptions = () => {
        const currentYear = new Date().getFullYear();
        const batches = [];
        
        // Generate batches from 2020 to current year + 1
        for (let year = 2020; year <= currentYear + 1; year++) {
            const batchStart = year;
            const batchEnd = year + 4;
            batches.push({
                value: `${batchStart}-${batchEnd}`,
                label: `${batchStart}-${batchEnd}`
            });
        }
        
        // Return last 5 batches (current + previous 4)
        return batches.slice(-5);
    };

    useEffect(() => {
        const dashboard = document.getElementById('mr-dashboard-area');
        if (!dashboard) return;

        const handleScroll = () => {
            if (isScrollingRef.current) {
                return;
            }

            const dashRect = dashboard.getBoundingClientRect();
            let bestFit = null;
            let smallestDistance = Infinity;
            
            sectionList.forEach(({ key }) => {
                const ref = sectionRefs[key];
                if (ref && ref.current) {
                    const rect = ref.current.getBoundingClientRect();
                    if (rect.bottom >= dashRect.top && rect.top <= dashRect.bottom) {
                        const distance = Math.abs(rect.top - dashRect.top);
                        if (distance < smallestDistance) {
                            smallestDistance = distance;
                            bestFit = key;
                        }
                    }
                }
            });

            if (bestFit) {
                setActiveSection(bestFit);
            }
        };

        dashboard.addEventListener('scroll', handleScroll, { passive: true });
        return () => dashboard.removeEventListener('scroll', handleScroll);
    }, [sectionRefs, sectionList]);

    // Define getRequiredGPAFields first (used by other functions)
    const getRequiredGPAFields = useCallback(() => {
        console.log('getRequiredGPAFields - currentYear:', currentYear, 'currentSemester:', currentSemester);
        
        if (!currentYear || !currentSemester) {
            console.log('getRequiredGPAFields - returning empty array because year/semester not set');
            return [];
        }
        
        const semesterNum = parseInt(currentSemester);
        const requiredFields = [];
        
        // Special case: IV year 8th sem - show all semesters 1-7 (8th optional)
        if (currentYear === 'IV' && currentSemester === '8') {
            for (let i = 1; i <= 7; i++) {
                requiredFields.push(`semester${i}GPA`);
            }
            console.log('getRequiredGPAFields - IV year 8th sem, returning:', requiredFields);
            return requiredFields;
        }
        
        // Regular case: collect all previous semesters
        for (let i = 1; i < semesterNum; i++) {
            requiredFields.push(`semester${i}GPA`);
        }
        
        console.log('getRequiredGPAFields - regular case, returning:', requiredFields);
        return requiredFields;
    }, [currentYear, currentSemester]);

    // Define checkSectionComplete before handleInputChange uses it
    const checkSectionComplete = useCallback((key) => {
        if (!sectionRefs[key] || !sectionRefs[key].current) {
            console.log(`Section ref not found for: ${key}`);
            return false;
        }
        
        // Special handling for semester section
        if (key === 'semester') {
            console.log('Checking semester section completion...');
            console.log('Current year:', currentYear, 'Current semester:', currentSemester);
            
            // Check if current year and semester are selected
            if (!currentYear || !currentSemester) {
                console.log('Semester section incomplete: year/semester not selected');
                return false;
            }
            
            // Get required GPA fields
            const requiredFields = getRequiredGPAFields();
            console.log('Required GPA fields for semester:', requiredFields);
            
            // Check each required field
            for (const fieldName of requiredFields) {
                const input = sectionRefs[key].current.querySelector(`input[name="${fieldName}"]`);
                if (!input || !input.value || input.value.trim() === '') {
                    console.log(`Semester section incomplete: ${fieldName} is empty`);
                    return false;
                }
            }
            
            console.log('Semester section is complete!');
            return true;
        }
        
        // Special handling for academic section (has conditional required fields)
        if (key === 'academic') {
            console.log('Checking academic section completion...');
            console.log('Study category:', studyCategory);
            
            // Check if study category is selected
            if (!studyCategory) {
                console.log('Academic section incomplete: study category not selected');
                return false;
            }
            
            // Always required fields
            const alwaysRequired = ['tenthInstitution', 'tenthBoard', 'tenthPercentage', 'tenthYear'];
            for (const fieldName of alwaysRequired) {
                const input = sectionRefs[key].current.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"]`);
                if (!input || !input.value || input.value.trim() === '') {
                    console.log(`Academic section incomplete: ${fieldName} is empty`);
                    return false;
                }
            }
            
            // Conditional required fields based on study category
            if (studyCategory === '12th' || studyCategory === 'both') {
                const twelfthRequired = ['twelfthInstitution', 'twelfthBoard', 'twelfthPercentage', 'twelfthYear', 'twelfthCutoff'];
                for (const fieldName of twelfthRequired) {
                    const input = sectionRefs[key].current.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"]`);
                    if (!input || !input.value || input.value.trim() === '') {
                        console.log(`Academic section incomplete: ${fieldName} is empty`);
                        return false;
                    }
                }
            }
            
            if (studyCategory === 'diploma' || studyCategory === 'both') {
                const diplomaRequired = ['diplomaInstitution', 'diplomaBranch', 'diplomaPercentage', 'diplomaYear'];
                for (const fieldName of diplomaRequired) {
                    const input = sectionRefs[key].current.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"]`);
                    if (!input || !input.value || input.value.trim() === '') {
                        console.log(`Academic section incomplete: ${fieldName} is empty`);
                        return false;
                    }
                }
            }
            
            console.log('Academic section is complete!');
            return true;
        }
        
        // For all other sections, only check REQUIRED fields
        const requiredInputs = sectionRefs[key].current.querySelectorAll('input[required], select[required]');
        console.log(`Checking ${requiredInputs.length} required fields for section: ${key}`);
        
        if (requiredInputs.length === 0) {
            console.log(`No required fields found for section: ${key}`);
            return false;
        }
        
        let completed = true;
        for (let i = 0; i < requiredInputs.length; i++) {
            const input = requiredInputs[i];
            
            // Handle radio buttons
            if (input.type === 'radio') {
                const name = input.name;
                const radios = sectionRefs[key].current.querySelectorAll(`input[type="radio"][name="${name}"]`);
                let checked = false;
                radios.forEach(r => { if (r.checked) checked = true; });
                if (!checked) {
                    console.log(`Required radio group ${name} not checked`);
                    completed = false;
                    break;
                }
                // Skip other radios in the same group
                i += radios.length - 1;
                continue;
            }
            
            // Handle regular inputs and selects
            if (!input.value || input.value.trim() === '') {
                console.log(`Required field ${input.name} is empty`);
                completed = false;
                break;
            }
        }
        
        console.log(`Section ${key} completion check:`, completed);
        return completed;
    }, [sectionRefs, currentYear, currentSemester, studyCategory, getRequiredGPAFields]);

    // Define validateAllFields before handleInputChange uses it
    const validateAllFields = useCallback(() => {
        const errors = [];
        
        // Check if form exists
        if (!formRef.current) return { isValid: false, errors: ['Form not ready'] };
        
        const formData = new FormData(formRef.current);
        
        // Required fields validation
        const requiredFields = {
            firstName: 'First Name',
            lastName: 'Last Name', 
            regNo: 'Registration Number',
            batch: 'Batch',
            degree: 'Degree',
            branch: 'Branch',
            gender: 'Gender',
            primaryEmail: 'Primary Email',
            domainEmail: 'Domain Email',
            mobileNo: 'Mobile Number',
            fatherName: 'Father Name',
            motherName: 'Mother Name',
            community: 'Community',
            aadhaarNo: 'Aadhaar Number',
            mediumOfStudy: 'Medium of Study',
            residentialStatus: 'Residential Status',
            quota: 'Quota',
            firstGraduate: 'First Graduate',
            skillSet: 'Skill Set',
            rationCardNo: 'Ration Card Number',
            familyAnnualIncome: 'Family Annual Income',
            panNo: 'PAN Number',
            loginRegNo: 'Login Registration Number',
            loginPassword: 'Login Password',
            confirmPassword: 'Confirm Password'
        };
        
        // Check required fields
        Object.entries(requiredFields).forEach(([field, label]) => {
            const value = formData.get(field);
            if (!value || value.trim() === '') {
                errors.push(`${label} is required`);
            }
        });
        
        // Check DOB
        if (!dob) {
            errors.push('Date of Birth is required');
        }
        
        // Check registration number format
        const regNo = formData.get('regNo');
        if (regNo && !/^\d{11}$/.test(regNo)) {
            errors.push('Registration number must be exactly 11 digits');
        }
        
        // Check DOB format
        const dobFormatted = dob ? dob.toLocaleDateString('en-GB').replace(/\//g, '') : '';
        if (dobFormatted && !/^\d{8}$/.test(dobFormatted)) {
            errors.push('Please select a valid date of birth');
        }
        
        // Check email formats
        const primaryEmail = formData.get('primaryEmail');
        const domainEmail = formData.get('domainEmail');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (primaryEmail && !emailRegex.test(primaryEmail)) {
            errors.push('Primary email format is invalid');
        }
        if (domainEmail && !emailRegex.test(domainEmail)) {
            errors.push('Domain email format is invalid');
        }
        
        // Check mobile number format
        const mobileNo = formData.get('mobileNo');
        if (mobileNo && !/^\d{10}$/.test(mobileNo)) {
            errors.push('Mobile number must be exactly 10 digits');
        }
        
        // Check login details match
        const loginRegNo = formData.get('loginRegNo');
        const loginPassword = formData.get('loginPassword');
        const confirmPassword = formData.get('confirmPassword');
        
        if (loginRegNo !== regNo) {
            errors.push('Login registration number must match the main registration number');
        }
        
        if (loginPassword !== dobFormatted) {
            errors.push('Login password must be your date of birth in DDMMYYYY format');
        }
        
        if (confirmPassword !== loginPassword) {
            errors.push('Password confirmation does not match');
        }
        
        // Check academic fields based on study category
        if (studyCategory === '12th' || studyCategory === 'both') {
            const twelfthFields = {
                twelfthInstitution: '12th Institution Name',
                twelfthBoard: '12th Board/University',
                twelfthPercentage: '12th Percentage',
                twelfthYear: '12th Year of Passing',
                twelfthCutoff: '12th Cut-off Marks'
            };
            
            Object.entries(twelfthFields).forEach(([field, label]) => {
                const value = formData.get(field);
                if (!value || value.trim() === '') {
                    errors.push(`${label} is required`);
                }
            });
        }
        
        if (studyCategory === 'diploma' || studyCategory === 'both') {
            const diplomaFields = {
                diplomaInstitution: 'Diploma Institution',
                diplomaBranch: 'Diploma Branch',
                diplomaPercentage: 'Diploma Percentage',
                diplomaYear: 'Diploma Year of Passing'
            };
            
            Object.entries(diplomaFields).forEach(([field, label]) => {
                const value = formData.get(field);
                if (!value || value.trim() === '') {
                    errors.push(`${label} is required`);
                }
            });
        }
        
        // Always check 10th fields
        const tenthFields = {
            tenthInstitution: '10th Institution Name',
            tenthBoard: '10th Board/University',
            tenthPercentage: '10th Percentage',
            tenthYear: '10th Year of Passing'
        };
        
        Object.entries(tenthFields).forEach(([field, label]) => {
            const value = formData.get(field);
            if (!value || value.trim() === '') {
                errors.push(`${label} is required`);
            }
        });
        
        // Check current year and semester (use state values as fallback)
        const currentYearValue = currentYear || formData.get('currentYear');
        const currentSemesterValue = currentSemester || formData.get('currentSemester');
        
        if (!currentYearValue) {
            errors.push('Current Year is required');
        }
        if (!currentSemesterValue) {
            errors.push('Current Semester is required');
        }
        
        // Check required GPA fields based on current year and semester
        const requiredGPAFields = getRequiredGPAFields();
        requiredGPAFields.forEach(field => {
            const value = formData.get(field);
            if (!value || value.trim() === '') {
                const semesterNumber = field.replace('semester', '').replace('GPA', '');
                errors.push(`Semester ${semesterNumber} GPA is required`);
            }
        });
        
        return { isValid: errors.length === 0, errors };
    }, [dob, studyCategory, currentYear, currentSemester, formRef, getRequiredGPAFields]);

    const handleInputChange = useCallback(() => {
        const updated = {};
        sectionList.forEach(({ key }) => {
            updated[key] = checkSectionComplete(key);
        });
        
        // Debug: Log completed sections
        console.log('Completed sections:', updated);
        
        setCompletedSections(updated);
        
        // Validate all fields and update register button state
        const validation = validateAllFields();
        setIsRegisterEnabled(validation.isValid);
        setValidationErrors(validation.errors);
    }, [sectionList, checkSectionComplete, validateAllFields]);

    useEffect(() => {
        handleInputChange();
    }, [profileImage, handleInputChange]);

    // Trigger completion check when current year or semester changes
    useEffect(() => {
        handleInputChange();
    }, [currentYear, currentSemester, handleInputChange]);

    // Trigger completion check when study category changes
    useEffect(() => {
        handleInputChange();
    }, [studyCategory, handleInputChange]);

    // Function to get available semesters based on selected year
    const getAvailableSemesters = (year) => {
        const semesterMap = {
            'I': ['1', '2'],
            'II': ['3', '4'],
            'III': ['5', '6'],
            'IV': ['7', '8'] // 7th and 8th semesters for 4th year
        };
        return semesterMap[year] || [];
    };


    // Function to get all GPA fields to display (including optional ones)
    const getAllGPAFields = () => {
        if (!currentYear || !currentSemester) return [];
        
        const semesterNum = parseInt(currentSemester);
        const allFields = [];
        
        // Special case: IV year 8th sem - show all semesters 1-8 (8th optional)
        if (currentYear === 'IV' && currentSemester === '8') {
            for (let i = 1; i <= 8; i++) {
                allFields.push(`semester${i}GPA`);
            }
            return allFields;
        }
        
        // Regular case: collect all previous semesters + current semester (optional)
        for (let i = 1; i <= semesterNum; i++) {
            allFields.push(`semester${i}GPA`);
        }
        
        return allFields;
    };

    const handleSidebarClick = (key) => {
        console.log('Sidebar clicked:', key); // Debug log
        isScrollingRef.current = true;
        setActiveSection(key);
        const ref = sectionRefs[key];

        if (ref && ref.current) {
            console.log('Section ref found:', ref.current); // Debug log
            
            // Simple and reliable scrolling method
            const scrollToSection = () => {
                const sectionElement = ref.current;
                console.log('Scrolling to section:', sectionElement); // Debug log
                
                // Method 1: Try scrollIntoView first
                try {
                    sectionElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                        inline: 'nearest'
                    });
                    console.log('scrollIntoView executed'); // Debug log
                } catch (error) {
                    console.log('scrollIntoView failed:', error); // Debug log
                }
                
                // Method 2: Calculate position and use window.scrollTo
                setTimeout(() => {
                    const rect = sectionElement.getBoundingClientRect();
                    const headerHeight = 65;
                    const targetPosition = window.pageYOffset + rect.top - headerHeight - 20;
                    
                    console.log('Target position:', targetPosition); // Debug log
                    console.log('Current scroll position:', window.pageYOffset); // Debug log
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }, 200);
                
                // Method 3: Force scroll as last resort
                setTimeout(() => {
                    const rect = sectionElement.getBoundingClientRect();
                    const headerHeight = 65;
                    const targetPosition = window.pageYOffset + rect.top - headerHeight - 20;
                    
                    window.scrollTo(0, targetPosition);
                    console.log('Force scroll executed to:', targetPosition); // Debug log
                }, 500);
            };

            // Execute scrolling
            setTimeout(scrollToSection, 100);

            // Close sidebar immediately on mobile for better UX
            if (window.innerWidth <= 992) {
                setTimeout(() => {
                    setIsSidebarOpen(false);
                }, 300); // Close sidebar after 300ms
            }

            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            scrollTimeoutRef.current = setTimeout(() => {
                isScrollingRef.current = false;
            }, 600);
        } else {
            console.log('Section ref not found for:', key); // Debug log
            isScrollingRef.current = false;
            if (window.innerWidth <= 992) {
                setIsSidebarOpen(false);
            }
        }
    };


    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file && file.type === "image/jpeg") {
            // Check file size (500KB = 500 * 1024 bytes)
            const maxSize = 500 * 1024; // 500KB in bytes
            const fileSizeKB = (file.size / 1024).toFixed(1);
            
            if (file.size > maxSize) {
                setFileSizeErrorKB(fileSizeKB);
                setIsFileSizeErrorOpen(true);
                // Clear the file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                return;
            }
            
            try {
                // Convert file to base64
                const reader = new FileReader();
                reader.onload = (event) => {
                    const base64String = event.target.result;
                    setProfileImage(base64String);
            setUploadInfo({
                name: file.name,
                date: new Date().toLocaleDateString('en-GB')
            });
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 5000);
            setTimeout(() => handleInputChange(), 0);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error converting image to base64:', error);
                alert("Error processing image. Please try again.");
            }
        } else {
            alert("Invalid file type. Please upload a JPG file.");
        }
    };

    const handleImageRemove = (e) => {
        e.preventDefault();
        setProfileImage(null);
        setUploadInfo({ name: '', date: '' });
        setUploadSuccess(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        setTimeout(() => handleInputChange(), 0);
    };

    const checkRegistrationNumberExists = async (regNo) => {
        if (!regNo || regNo.length !== 11) {
            return false; // Don't check if not 11 digits
        }

        try {
            setIsCheckingRegNo(true);
            const mongoDBService = (await import('./services/mongoDBService.js')).default;
            const exists = await mongoDBService.checkStudentExists(regNo);
            return exists;
        } catch (error) {
            console.error('Error checking registration number:', error);
            return false; // Don't block registration if check fails
        } finally {
            setIsCheckingRegNo(false);
        }
    };

    const handleRegNoBlur = async (e) => {
        const regNo = e.target.value.trim();
        
        // Only check if it's exactly 11 digits
        if (regNo.length === 11 && /^\d{11}$/.test(regNo)) {
            const exists = await checkRegistrationNumberExists(regNo);
            if (exists) {
                setExistingRegNo(regNo);
                setExistingRegNoPopupOpen(true);
                // Clear the field to force user to enter a different number
                e.target.value = '';
                e.target.focus();
            }
        }
    };

    const handleLoginRegNoBlur = (e) => {
        const loginRegNoValue = e.target.value.trim();
        const personalRegNoValue = formRef.current?.querySelector('input[name="regNo"]')?.value?.trim() || '';
        
        // Only check if both fields have 11 digits
        if (loginRegNoValue.length === 11 && personalRegNoValue.length === 11 && /^\d{11}$/.test(loginRegNoValue) && /^\d{11}$/.test(personalRegNoValue)) {
            if (loginRegNoValue !== personalRegNoValue) {
                setPersonalRegNo(personalRegNoValue);
                setLoginRegNo(loginRegNoValue);
                setMismatchedRegNoPopupOpen(true);
                // Clear the field to force user to enter the correct number
                e.target.value = '';
                e.target.focus();
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsRegistering(true);
        
        // Debug: Log current state values
        console.log("Form submission - currentYear:", currentYear, "currentSemester:", currentSemester);
        
        try {
            // Get form data
            const formData = new FormData(e.target);
            const regNo = formData.get('regNo') || '';
            const dobFormatted = dob ? dob.toLocaleDateString('en-GB').replace(/\//g, '') : '';
            const loginRegNo = formData.get('loginRegNo') || '';
            const loginPassword = formData.get('loginPassword') || '';
            const confirmPassword = formData.get('confirmPassword') || '';

            // Validate registration number format (should be 11 digits)
            if (!/^\d{11}$/.test(regNo)) {
                alert('Registration number must be exactly 11 digits');
                return;
            }

            // Validate DOB format (should be 8 digits DDMMYYYY)
            if (!/^\d{8}$/.test(dobFormatted)) {
                alert('Please select a valid date of birth');
                return;
            }

            // Validate login details
            if (loginRegNo !== regNo) {
                alert('Login registration number must match the main registration number');
                return;
            }

            if (loginPassword !== dobFormatted) {
                alert('Login password must be your date of birth in DDMMYYYY format');
                return;
            }

            if (confirmPassword !== loginPassword) {
                alert('Password confirmation does not match');
                return;
            }

            // Check if registration number already exists
            console.log('Checking for existing student with regNo:', regNo);
            const mongoDBService = (await import('./services/mongoDBService.js')).default;
            
            try {
                const existingStudent = await mongoDBService.getStudentByRegNoAndDob(regNo, dobFormatted);
                
                if (existingStudent) {
                    console.log('Student found with regNo:', regNo, 'Student ID:', existingStudent.id);
                    alert(`Registration number already exists. Please use a different registration number.\n\nFound student ID: ${existingStudent.id}`);
                    return;
                }
            } catch (error) {
                // If student not found (404), that's expected for new registration
                if (error.message.includes('Student not found')) {
                    console.log('No existing student found, proceeding with registration...');
                } else {
                    // If it's a different error, throw it
                    throw error;
                }
            }

            const studentData = {
                regNo: regNo,
                dob: dobFormatted,
                firstName: formData.get('firstName') || '',
                lastName: formData.get('lastName') || '',
                batch: formData.get('batch') || '',
                degree: formData.get('degree') || '',
                branch: formData.get('branch') || '',
                currentYear: currentYear || formData.get('currentYear') || '',
                currentSemester: currentSemester || formData.get('currentSemester') || '',
                gender: formData.get('gender') || '',
                address: formData.get('address') || '',
                city: formData.get('city') || '',
                primaryEmail: formData.get('primaryEmail') || '',
                domainEmail: formData.get('domainEmail') || '',
                mobileNo: formData.get('mobileNo') || '',
                fatherName: formData.get('fatherName') || '',
                fatherOccupation: formData.get('fatherOccupation') || '',
                fatherMobile: formData.get('fatherMobile') || '',
                motherName: formData.get('motherName') || '',
                motherOccupation: formData.get('motherOccupation') || '',
                motherMobile: formData.get('motherMobile') || '',
                guardianName: formData.get('guardianName') || '',
                guardianMobile: formData.get('guardianMobile') || '',
                community: formData.get('community') || '',
                bloodGroup: formData.get('bloodGroup') || '',
                aadhaarNo: formData.get('aadhaarNo') || '',
                mediumOfStudy: formData.get('mediumOfStudy') || '',
                // Academic data
                studyCategory: studyCategory,
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
                // Semester data
                semester1GPA: formData.get('semester1GPA') || '',
                semester2GPA: formData.get('semester2GPA') || '',
                semester3GPA: formData.get('semester3GPA') || '',
                semester4GPA: formData.get('semester4GPA') || '',
                semester5GPA: formData.get('semester5GPA') || '',
                semester6GPA: formData.get('semester6GPA') || '',
                semester7GPA: formData.get('semester7GPA') || '',
                semester8GPA: formData.get('semester8GPA') || '',
                overallCGPA: formData.get('overallCGPA') || '',
                clearedBacklogs: formData.get('clearedBacklogs') || '',
                currentBacklogs: formData.get('currentBacklogs') || '',
                yearOfGap: formData.get('yearOfGap') || '',
                gapReason: formData.get('gapReason') || '',
                // Other details
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
                companyTypes: formData.get('companyTypes') || '',
                preferredJobLocation: formData.get('preferredJobLocation') || '',
                profilePicURL: profileImage || '',
                profileUploadDate: uploadInfo.date || new Date().toLocaleDateString('en-GB'),
                // Login credentials
                loginRegNo: loginRegNo,
                loginPassword: loginPassword
            };

            // Debug: Log the data being saved
            console.log("Saving student data with currentYear:", currentYear, "currentSemester:", currentSemester);
            console.log("Full student data being saved:", studentData);
            
            // Save to MongoDB via backend API
            await mongoDBService.createStudent(studentData);
            
            console.log("Student data saved to MongoDB!");
            
            // Show success popup after a short delay
            setTimeout(() => {
                setPopupOpen(true);
                setIsRegistering(false);
            }, 1000);
        } catch (error) {
            console.error("Error saving student data:", error);
            console.error("Error details:", {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            alert(`Error saving data: ${error.message}. Check console for details.`);
        } finally {
            setIsRegistering(false);
        }
    };

    const handleDiscard = () => {
        if (formRef.current) {
            formRef.current.reset();
            setStudyCategory('12th');
            setDob(null);
            setCurrentYear('');
            setCurrentSemester('');
            handleImageRemove(new Event('discard'));
        }
    };

    const closePopup = () => setPopupOpen(false);
    const closeExistingRegNoPopup = () => setExistingRegNoPopupOpen(false);
    const closeMismatchedRegNoPopup = () => setMismatchedRegNoPopupOpen(false);
    const closeFileSizeErrorPopup = () => setIsFileSizeErrorOpen(false);
    
    return (
        <>
            <div className="mr-container">
                <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <div className="mr-main">
                    <Sidebar
                        isOpen={isSidebarOpen}
                        currentView={activeSection}
                        completedSections={completedSections}
                        onViewChange={handleSidebarClick}
                    />
                    <div className="mr-dashboard-area" id="mr-dashboard-area">
                        <form ref={formRef} onSubmit={handleSave} onChange={handleInputChange}>
                            {/* Personal Information */}
                            <div className="mr-profile-section-container" ref={sectionRefs.personal}>
                                <h3 className="mr-section-header">Personal Information</h3>
                                <div className="mr-form-grid">
                                    <div className="mr-personal-info-fields">
                                        <input type="text" name="firstName" placeholder="First Name *"required/>
                                        <input type="text" name="lastName" placeholder="Last Name *"required/>
                                        <div style={{ position: 'relative' }}>
                                            <input 
                                                type="text" 
                                                name="regNo" 
                                                placeholder="Register Number (11 digits) *" 
                                                maxLength="11"
                                                onBlur={handleRegNoBlur}
                                                required 
                                            />
                                            {isCheckingRegNo && (
                                                <div className="mr-regno-checking-spinner"></div>
                                            )}
                                        </div>
                                        <select name="batch" defaultValue="" required>
                                            <option value="" disabled>Batch *</option>
                                            {generateBatchOptions().map(batch => (
                                                <option key={batch.value} value={batch.value}>
                                                    {batch.label}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="StuProfile-datepicker-wrapper" >
                                            <DatePicker
                                                selected={dob}
                                                onChange={(date) => setDob(date)}
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="DOB*"
                                                className="StuProfile-datepicker-input"
                                                wrapperClassName="StuProfile-datepicker-wrapper-inner"
                                                showPopperArrow={false}
                                                required
                                            />
                                        </div>
                                        <select name="degree" defaultValue="" required><option value="" disabled >Degree *</option><option value="B.E">B.E</option><option value="B.Tech">B.Tech</option></select>
                                        <select name="branch" defaultValue="" required>
                                            <option value="" disabled>Branch *</option>
                                            <option value="CSE">CSE</option>
                                            <option value="IT">IT</option>
                                            <option value="IOT">IOT</option>
                                            <option value="MECH">MECH</option>
                                        </select>
                                        <select name="currentYear" value={currentYear} onChange={(e) => {
                                            setCurrentYear(e.target.value);
                                            setCurrentSemester(''); // Reset semester when year changes
                                            setTimeout(() => handleInputChange(), 100); // Trigger completion check
                                        }} required>
                                            <option value="" disabled>Current Year *</option>
                                            <option value="I">I</option>
                                            <option value="II">II</option>
                                            <option value="III">III</option>
                                            <option value="IV">IV</option>
                                        </select>
                                        <select name="currentSemester" value={currentSemester} onChange={(e) => {
                                            setCurrentSemester(e.target.value);
                                            setTimeout(() => handleInputChange(), 100); // Trigger completion check
                                        }} required>
                                            <option value="" disabled>Current Semester *</option>
                                            {getAvailableSemesters(currentYear).map(sem => (
                                                <option key={sem} value={sem}>{sem}</option>
                                            ))}
                                        </select>
                                        <select name="gender" defaultValue="" required><option value="" disabled>Gender *</option><option value="male">Male</option><option value="female">Female</option></select>
                                        <input type="text" name="address" placeholder="Address" />
                                        <input type="text" name="city" placeholder="City" />
                                        <input type="email" name="primaryEmail" placeholder="Primary Email *" required />
                                        <input type="email" name="domainEmail" placeholder="Domain Email *" required />
                                        <input type="tel" name="mobileNo" placeholder="Mobile No. *" required />
                                        <input type="text" name="fatherName" placeholder="Father Name *"required />
                                        <input type="text" name="fatherOccupation" placeholder="Father Occupation" />
                                        <input type="text" name="fatherMobile" placeholder="Father Mobile No." />
                                        <input type="text" name="motherName" placeholder="Mother Name *"required />
                                        <input type="text" name="motherOccupation" placeholder="Mother Occupation" />
                                        <input type="text" name="guardianName" placeholder="Guardian Name" />
                                        <input type="text" name="guardianMobile" placeholder="Guardian Number" /><input type="text" name="bloodGroup" placeholder="Blood Group " />
                                        <input type="text" name="aadhaarNo" placeholder="Aadhaar Number *" required />
                                    </div>
                                    <div className="mr-profile-photo-wrapper">
                                        <div className="mr-profile-photo-box" style={{ height: '675px' }}>
                                            <h3 className="mr-section-header">Profile Photo</h3>
                                            <div className="mr-profile-icon-container">
                                                {profileImage ? (
                                                    <img src={profileImage} alt="Profile Preview" className="mr-profile-preview-img" onClick={() => setImagePreviewOpen(true)} />
                                                ) : (
                                                    <GraduationCapIcon />
                                                )}
                                            </div>
                                            {profileImage && uploadInfo.name && (
                                                <div className="mr-upload-info-container">
                                                    <div className="mr-upload-info-item">
                                                        <FileIcon />
                                                        <span>{uploadInfo.name}</span>
                                                    </div>
                                                    <div className="mr-upload-info-item">
                                                        <CalendarIcon />
                                                        <span>Uploaded on: {uploadInfo.date}</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="mr-upload-action-area">
                                                <div className="mr-upload-btn-wrapper">
                                                    <label htmlFor="photo-upload-input" className="mr-profile-upload-btn">
                                                        <div className="mr-upload-btn-content">
                                                            <MdUpload />
                                                            <span>Upload (Max 500 KB)</span>
                                                        </div>
                                                    </label>
                                                    {profileImage && (
                                                        <button onClick={handleImageRemove} className="mr-remove-image-btn" aria-label="Remove image">
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
                                                    <p className="mr-upload-success-message">
                                                        Profile Photo uploaded Successfully!
                                                    </p>
                                                )}
                                                <p className="mr-upload-hint">*Only JPG format is allowed.</p>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: '24px' }}>
                                            <input type="text" name="motherMobile" placeholder="Mother Mobile No." />
                                        </div>
                            
                                        
                                        <div style={{ marginTop: '24px' }}>
                                            <select name="community" defaultValue="" required><option value="" disabled >Community *</option> <option value="OC">OC</option><option value="BC">BC</option><option value="BCM">BCM</option><option value="MBC">MBC</option><option value="SC">SC</option><option value="SCA">SCA</option><option value="ST">ST</option></select>
                                        </div>
                                        <div style={{ marginTop: '24px' }}>
                                            <select name="mediumOfStudy" defaultValue="" required>
                                                <option value="" disabled>Medium of study *</option>
                                                <option value="English">English</option>
                                                <option value="Tamil">Tamil</option>
                                                <option value="Other">Others</option>
                                            </select>
                                        </div>

                                    </div>
                                </div>
                            </div>

                            {/* Academic Background */}
                            <div className="mr-profile-section-container" ref={sectionRefs.academic}>
                                <h3 className="mr-section-header">Academic Background</h3>
                                <div className="mr-form-grid">
                                    <div className="mr-study-category" style={{ gridColumn: '1 / -1' }}>
                                        <input type="radio" id="12th" name="study_category" value="12th" checked={studyCategory === '12th'} onChange={(e) => {
                                            setStudyCategory(e.target.value);
                                            setTimeout(() => handleInputChange(), 100);
                                        }} />
                                        <label htmlFor="12th">12th</label>
                                        <input type="radio" id="diploma" name="study_category" value="diploma" checked={studyCategory === 'diploma'} onChange={(e) => {
                                            setStudyCategory(e.target.value);
                                            setTimeout(() => handleInputChange(), 100);
                                        }} />
                                        <label htmlFor="diploma">Diploma</label>
                                        <input type="radio" id="both" name="study_category" value="both" checked={studyCategory === 'both'} onChange={(e) => {
                                            setStudyCategory(e.target.value);
                                            setTimeout(() => handleInputChange(), 100);
                                        }} />
                                        <label htmlFor="both">Both</label>
                                    </div>
                                    <input type="text" name="tenthInstitution" placeholder="10th Institution Name *" required/>
                                    <select name="tenthBoard" defaultValue="" required><option value="" disabled>10th Board/University *</option><option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="Other State Board">Other State Board</option></select>
                                    <input type="text" name="tenthPercentage" placeholder="10th Percentage *" required />
                                    <input type="text" name="tenthYear" placeholder="10th Year of Passing *" required />
                                    {(studyCategory === '12th' || studyCategory === 'both') && (
                                        <>
                                            <input type="text" name="twelfthInstitution" placeholder="12th Institution Name *" required />
                                            <select name="twelfthBoard" defaultValue="" required><option value="" disabled>12th Board/University *</option><option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="Other State Board">Other State Board</option></select>
                                            <input type="text" name="twelfthPercentage" placeholder="12th Percentage *" required/>
                                            <input type="text" name="twelfthYear" placeholder="12th Year of Passing *" required/>
                                            <input type="text" name="twelfthCutoff" placeholder="12th Cut-off Marks *" required/>
                                        </>
                                    )}
                                    {(studyCategory === 'diploma' || studyCategory === 'both') && (
                                        <>
                                            <input type="text" name="diplomaInstitution" placeholder="Diploma Institution *" required/>
                                            <input type="text" name="diplomaBranch" placeholder="Diploma Branch *" required />
                                            <input type="text" name="diplomaPercentage" placeholder="Diploma Percentage *" required/>
                                            <input type="text" name="diplomaYear" placeholder="Diploma Year of Passing *" required/>
                                        </>
                                    )}
                                </div>
                            </div>
                            
                            <div className="mr-profile-section-container" ref={sectionRefs.semester}>
                                <h3 className="mr-section-header">Semester</h3>
                                <div className="mr-form-grid">
                                    {/* Dynamic GPA fields based on current year and semester */}
                                    {getAllGPAFields().map(field => {
                                        const semesterNumber = field.replace('semester', '').replace('GPA', '');
                                        const isRequired = getRequiredGPAFields().includes(field);
                                        return (
                                            <input 
                                                key={field}
                                                type="text" 
                                                name={field} 
                                                placeholder={`Semester ${semesterNumber} GPA ${isRequired ? '*' : ''}`} 
                                                required={isRequired}
                                            />
                                        );
                                    })}
                                    
                                    {/* Always show overall CGPA */}
                                    <input type="text" name="overallCGPA" placeholder="Overall CGPA" />
                                    <input type="text" name="clearedBacklogs" placeholder="No. of Backlogs (Cleared)" />
                                    <input type="text" name="currentBacklogs" placeholder="No of Current Backlog (Arrear)" />
                                    <input type="text" name="yearOfGap" placeholder="Year of Gap" />
                                    <input type="text" name="gapReason" placeholder="Reason for year of Gap" style={{ gridColumn: '1 / -1' }} />
                                </div>
                            </div>
                            
                            <div className="mr-profile-section-container" ref={sectionRefs.other}>
                                <h3 className="mr-section-header">Other Details</h3>
                                <div className="mr-form-grid">
                                    <select name="residentialStatus" defaultValue="" required><option value="" disabled >Residential status *</option><option value="Hosteller">Hosteller</option><option value="Dayscholar">Dayscholar</option></select>
                                    <select name="quota" defaultValue="" required><option value="" disabled >Quota *</option><option value="Management">Management</option><option value="Counselling">Counselling</option></select>
                                    <input type="text" name="languagesKnown" placeholder="Languages Known" />
                                    <select name="firstGraduate" defaultValue="" required><option value="" disabled >First Graduate *</option><option value="Yes">Yes</option><option value="No">No</option></select>
                                    <input type="text" name="passportNo" placeholder="Passport No." />
                                    <input type="text" name="skillSet" placeholder="Skill set *" required/>
                                    <input type="text" name="valueAddedCourses" placeholder="Value Added Courses" />
                                    <input type="text" name="aboutSibling" placeholder="About sibling" />
                                    <input type="text" name="rationCardNo" placeholder="Ration card No. *"required />
                                    <input type="text" name="familyAnnualIncome" placeholder="Family Annual Income *"required/>
                                    <input type="text" name="panNo" placeholder="PAN No. *" required/>
                                    <select name="willingToSignBond" defaultValue=""><option value="" disabled>Willing to Sign Bond</option><option value="Yes">Yes</option><option value="No">No</option></select>
                                    <select name="preferredModeOfDrive" defaultValue=""><option value="" disabled>Preferred Mode of Drive</option><option value="Online">Online</option><option value="Offline">Offline</option><option value="Hybrid">Hybrid</option></select>
                                    <input type="text" name="githubLink" placeholder="GitHub Link" />
                                    <input type="text" name="linkedinLink" placeholder="LinkedIn Profile Link" />
                                    <select name="companyTypes" defaultValue=""><option value="" disabled>Types of companies</option><option value="IT">IT</option><option value="Non-IT">Non-IT</option><option value="MNC">MNC</option><option value="Startup">Startup</option><option value="Government/Public Sector">Government/Public Sector</option><option value="Non-Profit">Non-Profit</option><option value="Other">Other</option></select>
                                    <select name="preferredJobLocation" defaultValue=""><option value="" disabled>Preferred job location</option><option value="Tamil Nadu">Tamil Nadu</option><option value="Bengaluru">Bengaluru</option><option value="Hyderabad">Hyderabad</option><option value="North India">North India</option></select>
                                </div>
                            </div>

                            <div className="mr-profile-section-container" ref={sectionRefs.login}>
                                <h3 className="mr-section-header">Login Details</h3>
                                <div className="mr-form-grid">
                                    <input 
                                        type="text" 
                                        name="loginRegNo" 
                                        placeholder="Register No (11 digits) *" 
                                        maxLength="11"
                                        onBlur={handleLoginRegNoBlur}
                                        required
                                    />
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type={showLoginPassword ? "text" : "password"} 
                                            name="loginPassword" 
                                            placeholder="Password DOB (ddmmyyyy) *" 
                                            required
                                            style={{ paddingRight: '40px' }}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                                        >
                                            {showLoginPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                        </button>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <input 
                                            type={showConfirmPassword ? "text" : "password"} 
                                            name="confirmPassword" 
                                            placeholder="Confirm Password (ddmmyyyy) *" 
                                            required 
                                            style={{ paddingRight: '40px' }}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle-btn"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mr-action-buttons">
                                <button type="button" className="mr-discard-btn" onClick={handleDiscard}>Cancel</button>
                                <button 
                                    type="submit" 
                                    className={`mr-save-btn ${!isRegisterEnabled ? 'mr-save-btn-disabled' : ''}`}
                                    disabled={!isRegisterEnabled || isRegistering}
                                    onClick={(e) => {
                                        if (!isRegisterEnabled) {
                                            e.preventDefault();
                                            const validation = validateAllFields();
                                            alert(`Please complete all required fields:\n\n${validation.errors.slice(0, 5).join('\n')}${validation.errors.length > 5 ? '\n...and more' : ''}`);
                                        }
                                    }}
                                >
                                    {isRegistering ? (
                                        <>
                                            <div className="mr-loading-spinner"></div>
                                            Registering...
                                        </>
                                    ) : (
                                        'Register'
                                    )}
                                </button>
                            </div>
                            
                            {/* Validation Errors Display */}
                            {validationErrors.length > 0 && (
                                <div style={{
                                    marginTop: '20px',
                                    padding: '15px',
                                    backgroundColor: '#fff3cd',
                                    border: '1px solid #ffeaa7',
                                    borderRadius: '8px',
                                    color: '#856404'
                                }}>
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>ΓÜá∩╕Å Required Fields Missing:</h4>
                                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                        {validationErrors.slice(0, 8).map((error, index) => (
                                            <li key={index} style={{ marginBottom: '5px', fontSize: '14px' }}>{error}</li>
                                        ))}
                                        {validationErrors.length > 8 && (
                                            <li style={{ fontSize: '14px', fontStyle: 'italic' }}>...and {validationErrors.length - 8} more</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
            {isSidebarOpen && <div className="mr-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
            <SuccessPopup isOpen={isPopupOpen} onClose={closePopup} />
            <ExistingRegNoPopup 
                isOpen={isExistingRegNoPopupOpen} 
                onClose={closeExistingRegNoPopup} 
                regNo={existingRegNo} 
            />
            <MismatchedRegNoPopup 
                isOpen={isMismatchedRegNoPopupOpen} 
                onClose={closeMismatchedRegNoPopup} 
                personalRegNo={personalRegNo}
                loginRegNo={loginRegNo}
            />
            <FileSizeErrorPopup 
                isOpen={isFileSizeErrorOpen} 
                onClose={closeFileSizeErrorPopup} 
                fileSizeKB={fileSizeErrorKB} 
            />
            <ImagePreviewModal
                src={profileImage}
                isOpen={isImagePreviewOpen}
                onClose={() => setImagePreviewOpen(false)}
            />
        </>
    );
}


export default MainRegistration;
