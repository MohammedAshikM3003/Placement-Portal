import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { API_BASE_URL } from '../utils/apiConfig';

import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';
import styles from './StuProfile.module.css'; // Module Import
import achievementStyles from './Achievements.module.css'; // Achievement popup styles
import Adminicons from '../assets/BlueAdminicon.png';
import StuEyeIcon from '../assets/StuEyeicon.svg';
import StuUploadMarksheetIcon from '../assets/StuUploadMarksheeticon.svg';
import mongoDBService from '../services/mongoDBService.jsx';
import fastDataService from '../services/fastDataService.jsx';
import gridfsService from '../services/gridfsService';

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

const ARREAR_STATUS_OPTIONS = ["NHA", "NSA", "SA"];

// URL validation patterns for profile links
const GITHUB_URL_REGEX = /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}\/?$/;
const LINKEDIN_URL_REGEX = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]{3,100}\/?$/;

const parseMultiValue = (value) => {
    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value === "string" && value.trim()) {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }

    return [];
};

// Helper components
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

const SuccessPopup = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className={styles.popupOverlay}>
            {/* Reuse Achievements-style animated success card */}
            <div className={achievementStyles['Achievement-popup-container']}>
                <div className={achievementStyles['Achievement-popup-header']}>Saved!</div>
                <div className={achievementStyles['Achievement-popup-body']}>
                    <svg className={achievementStyles['Achievement-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className={achievementStyles['Achievement-success-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
                        <path className={achievementStyles['Achievement-success-icon--check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                    <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
                        Changes Saved ✓
                    </h2>
                    <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
                        Your Details have been
                    </p>
                    <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
                        Successfully saved in the Portal
                    </p>
                </div>
                <div className={achievementStyles['Achievement-popup-footer']}>
                    <button onClick={onClose} className={achievementStyles['Achievement-popup-close-btn']}>Close</button>
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
        <div className={styles.popupOverlay}>
            <div className={styles.imageSizePopup}>
                <div className={styles.imageSizePopupHeader}>Image Too Large!</div>
                <div className={styles.imageSizePopupBody}>
                    <div className={styles.imageSizePopupIconWrapper}>
                        <svg
                            className={styles.imageSizePopupIcon}
                            xmlns="http://www.w3.org/2000/svg"
                            width="48"
                            height="48"
                            viewBox="0 0 24 24"
                        >
                            <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                <path d="M15 8h.01M12.5 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6.5" />
                                <path d="m3 16 5-5c.928-.893 2.072-.893 3 0l3 3m0 0 1-1c.616-.593 1.328-.792 2.008-.598M16 19a3 3 0 1 0 6 0a3 3 0 1 0-6 0m1 2 4-4" />
                            </g>
                        </svg>
                    </div>
                    <h2>Image Size Exceeded ✗</h2>
                    <p className={styles.imageSizePopupLine}>
                        Maximum allowed: <strong>500KB</strong>
                    </p>
                    <p className={styles.imageSizePopupLine}>
                        Your image size: <strong>{formattedFileSize}KB</strong>
                    </p>
                    <p className={styles.imageSizePopupHint}>
                        Please compress your image or choose a smaller file.
                    </p>
                </div>
                <div className={styles.imageSizePopupFooter}>
                    <button onClick={onClose} className={styles.imageSizePopupButton}>OK</button>
                </div>
            </div>
        </div>
    );
};

const ImagePreviewModal = ({ src, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className={styles.imagePreviewOverlay} onClick={onClose}>
            <div className={styles.imagePreviewContainer} onClick={(e) => e.stopPropagation()}>
                <img src={src} alt="Profile Preview" className={styles.profilePreviewImg} />
                <button onClick={onClose} className={styles.imagePreviewCloseBtn}>&times;</button>
            </div>
        </div>
    );
};

const URLValidationErrorPopup = ({ isOpen, onClose, urlType, invalidUrl }) => {
    if (!isOpen) return null;

    const examples = {
        GitHub: 'https://github.com/username',
        LinkedIn: 'https://linkedin.com/in/username'
    };

    const renderIcon = () => {
        if (urlType === 'GitHub') {
            return (
                <div className={styles.imageSizePopupIconWrapper}>
                    <svg
                        className={styles.imageSizePopupIcon}
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                    >
                        <path
                            fill="#fff"
                            d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"
                        />
                    </svg>
                </div>
            );
        } else {
            return (
                <div className={styles.imageSizePopupIconWrapper}>
                    <svg
                        className={styles.imageSizePopupIcon}
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                    >
                        <path
                            fill="#fff"
                            d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77Z"
                        />
                    </svg>
                </div>
            );
        }
    };

    return (
        <div className={styles.popupOverlay}>
            <div className={styles.imageSizePopup}>
                <div className={styles.imageSizePopupHeader}>Invalid {urlType} URL!</div>
                <div className={styles.imageSizePopupBody}>
                    {renderIcon()}
                    <h2>Invalid {urlType} Link ✗</h2>
                    {invalidUrl && (
                        <p className={styles.imageSizePopupLine} style={{ wordBreak: 'break-all' }}>
                            You entered: <strong>{invalidUrl}</strong>
                        </p>
                    )}
                    <p className={styles.imageSizePopupLine}>
                        Correct format: <strong>{examples[urlType]}</strong>
                    </p>
                    <p className={styles.imageSizePopupHint}>
                        Please enter a valid {urlType} profile URL or leave it empty.
                    </p>
                </div>
                <div className={styles.imageSizePopupFooter}>
                    <button onClick={onClose} className={styles.imageSizePopupButton}>OK</button>
                </div>
            </div>
        </div>
    );
};

function StuProfile({ onLogout, onViewChange }) {
    const [studyCategory, setStudyCategory] = useState('12th');
    const [isPopupOpen, setPopupOpen] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [profilePhotoFile, setProfilePhotoFile] = useState(null); // Raw File for GridFS upload on Save
    const [uploadInfo, setUploadInfo] = useState({ name: '', date: '' });
    const formRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isImagePreviewOpen, setImagePreviewOpen] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [dob, setDob] = useState(null);
    const [studentData, setStudentData] = useState(() => {
        // Initialize from cache to prevent layout shifts
        try {
            const cached = JSON.parse(localStorage.getItem('studentData') || 'null');
            return cached || null;
        } catch {
            return null;
        }
    });
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [showUpdateNotification, setShowUpdateNotification] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState('');
    const [currentSemester, setCurrentSemester] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isFileSizeErrorOpen, setIsFileSizeErrorOpen] = useState(false);
    const [fileSizeErrorKB, setFileSizeErrorKB] = useState('');
    const [isURLErrorPopupOpen, setURLErrorPopupOpen] = useState(false);
    const [urlErrorType, setUrlErrorType] = useState('');
    const [invalidUrl, setInvalidUrl] = useState('');

    const selectedCompanyTypes = useMemo(
        () => parseMultiValue(studentData?.companyTypes),
        [studentData?.companyTypes]
    );

    const selectedJobLocations = useMemo(
        () => parseMultiValue(studentData?.preferredJobLocation),
        [studentData?.preferredJobLocation]
    );

    const companyTypesHiddenValue = useMemo(
        () => selectedCompanyTypes.join(', '),
        [selectedCompanyTypes]
    );

    const jobLocationsHiddenValue = useMemo(
        () => selectedJobLocations.join(', '),
        [selectedJobLocations]
    );

    const getAvailableSemesters = (year) => {
        const semesterMap = { 'I': ['1', '2'], 'II': ['3', '4'], 'III': ['5', '6'], 'IV': ['7', '8'] };
        return semesterMap[year] || [];
    };

    const getRequiredGPAFields = () => {
        if (!currentYear || !currentSemester) return [];
        const semesterNum = parseInt(currentSemester);
        const requiredFields = [];
        if (currentYear === 'IV' && currentSemester === '8') {
            for (let i = 1; i <= 7; i++) requiredFields.push(`semester${i}GPA`);
            return requiredFields;
        }
        for (let i = 1; i < semesterNum; i++) requiredFields.push(`semester${i}GPA`);
        return requiredFields;
    };

    const getAllGPAFields = () => {
        if (!currentYear || !currentSemester) return [];
        const semesterNum = parseInt(currentSemester);
        const allFields = [];
        if (currentYear === 'IV' && currentSemester === '8') {
            for (let i = 1; i <= 8; i++) allFields.push(`semester${i}GPA`);
            return allFields;
        }
        for (let i = 1; i <= semesterNum; i++) allFields.push(`semester${i}GPA`);
        return allFields;
    };

    const populateFormFields = (data) => {
        const normalized = {
            section: data.section || data.Section || data.sec || data.sectionName || '',
            residentialStatus: data.residentialStatus || data.ResidentialStatus || data.residentialstatus || '',
            quota: data.quota || data.Quota || '',
            firstGraduate: data.firstGraduate || data.firstgraduate || '',
            willingToSignBond: data.willingToSignBond || data.willingtosignbond || data.signBond || '',
            preferredModeOfDrive: data.preferredModeOfDrive || data.preferredMode || data.driveMode || '',
            companyTypes: data.companyTypes || data.companyType || '',
            preferredJobLocation: data.preferredJobLocation || data.jobLocation || '',
            community: data.community || data.Community || data.caste || '',
            mediumOfStudy: data.mediumOfStudy || data.medium || '',
            degree: data.degree || data.course || '',
            branch: data.branch || data.department || '',
            currentYear: data.currentYear || data.year || '',
            currentSemester: data.currentSemester || data.semester || ''
        };

        const merged = { ...data, ...normalized };
        setStudentData(merged);
        setStudyCategory(merged.studyCategory || '12th');
        setCurrentYear(merged.currentYear ? String(merged.currentYear) : '');
        setCurrentSemester(merged.currentSemester ? String(merged.currentSemester) : '');
        setSelectedSection(merged.section ? String(merged.section) : '');
        
        if (merged.dob) {
            const dobStr = merged.dob.toString();
            if (dobStr.length === 8) {
                const day = dobStr.substring(0, 2);
                const month = dobStr.substring(2, 4);
                const year = dobStr.substring(4, 8);
                setDob(new Date(year, month - 1, day));
            }
        }
        
        if (merged.profilePicURL) {
            // Resolve GridFS URLs to full backend URL for display
            const resolvedUrl = gridfsService.getFileUrl(merged.profilePicURL);
            setProfileImage(resolvedUrl);
            setUploadInfo({
                name: 'profile.jpg',
                date: merged.profileUploadDate || new Date().toLocaleDateString('en-GB')
            });
        }

        setIsInitialLoading(false);
    };

    const loadStudentData = useCallback(async () => {
        try {
            const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
            if (!storedStudentData || !storedStudentData._id) return;
            
            const studentId = storedStudentData._id || storedStudentData.id;
            const completeData = await fastDataService.getCompleteStudentData(studentId);
            
            if (completeData && completeData.student) {
                populateFormFields(completeData.student);
                if (completeData.resume) localStorage.setItem('resumeData', JSON.stringify(completeData.resume));
                if (completeData.certificates) localStorage.setItem('certificatesData', JSON.stringify(completeData.certificates));
            } else {
                const storedRegNo = localStorage.getItem('regNo');
                const storedDob = localStorage.getItem('dob');
                if (storedRegNo && storedDob) {
                    const fallbackData = await mongoDBService.getStudentByRegNoAndDob(storedRegNo, storedDob);
                    if (fallbackData) populateFormFields(fallbackData);
                }
            }
        } catch (error) {
            const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
            if (storedStudentData) populateFormFields(storedStudentData);
        }
    }, []);

    useEffect(() => {
        const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (storedStudentData && storedStudentData._id) {
            populateFormFields(storedStudentData);
            const instantData = fastDataService.getInstantData(storedStudentData._id);
            if (instantData && instantData.student) populateFormFields(instantData.student);
            
            if (storedStudentData.profilePicURL) {
                window.dispatchEvent(new CustomEvent('profileUpdated', { 
                    detail: { profilePicURL: storedStudentData.profilePicURL, studentData: storedStudentData } 
                }));
            }
            
            // Set initial sync time
            setLastSyncTime(storedStudentData.updatedAt || new Date().toISOString());
        }
        loadStudentData();
        
        return () => {
            // Cleanup handled globally in AuthContext
        };
    }, [loadStudentData]);

    // Auto-sync mechanism: Check for profile updates every 30 seconds
    useEffect(() => {
        const checkForUpdates = async () => {
            try {
                const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
                if (!storedStudentData || !storedStudentData._id) return;
                
                const studentId = storedStudentData._id || storedStudentData.id;
                
                // Use the lightweight status endpoint instead of full student fetch
                const authToken = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE_URL}/students/${studentId}/status`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) return;
                
                const statusData = await response.json();
                if (!statusData.success) return;
                
                // If blocked status changed, handle it
                if (statusData.student?.blocked) {
                    console.warn('Account blocked by admin');
                }
            } catch (error) {
                // Silently ignore sync errors to avoid console spam
            }
        };
        
        // Check for updates every 30 seconds (reduced from 10s)
        const syncInterval = setInterval(checkForUpdates, 30000);
        
        // Cleanup interval on unmount
        return () => clearInterval(syncInterval);
    }, []); // Fixed: Removed lastSyncTime dependency to prevent interval recreation

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileName = file.name.toLowerCase();
        
        // Robust file type detection using both MIME type and extension
        const getFileType = (file, fileName) => {
            // Check MIME type first (most reliable)
            if (file.type) {
                if (file.type === "image/jpeg" || file.type === "image/jpg") return "jpg";
                if (file.type === "image/webp") return "webp";
            }
            
            // Fallback to extension check
            if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) return "jpg";
            if (fileName.endsWith('.webp')) return "webp";
            
            return null;
        };

        const fileType = getFileType(file, fileName);
        
        if (!fileType) {
            setInvalidUrl(file.name);
            setUrlErrorType('File Format');
            setURLErrorPopupOpen(true);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }
        
        const maxSize = 500 * 1024;
        const fileSizeKB = (file.size / 1024).toFixed(1);
        
        if (file.size > maxSize) {
            setFileSizeErrorKB(fileSizeKB);
            setIsFileSizeErrorOpen(true);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }
        
        // Store raw File for GridFS upload on Save
        setProfilePhotoFile(file);
        setProfileImage(URL.createObjectURL(file));
        setUploadInfo({ 
            name: file.name, 
            date: new Date().toLocaleDateString('en-GB'),
            size: fileSizeKB,
            type: fileType
        });
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 5000);
        
        console.log('✅ File selected:', {
            name: file.name,
            mimeType: file.type || 'unknown',
            size: `${fileSizeKB}KB`,
            detectedType: fileType
        });
    };

    const handleImageRemove = (e) => {
        e.preventDefault();
        setProfileImage(null);
        setProfilePhotoFile(null);
        setUploadInfo({ name: '', date: '' });
        setUploadSuccess(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        // Validate GitHub and LinkedIn URLs before saving
        const githubVal = studentData?.githubLink?.trim() || '';
        const linkedinVal = studentData?.linkedinLink?.trim() || '';
        if (githubVal && !GITHUB_URL_REGEX.test(githubVal)) {
            setUrlErrorType('GitHub');
            setInvalidUrl(githubVal);
            setURLErrorPopupOpen(true);
            return;
        }
        if (linkedinVal && !LINKEDIN_URL_REGEX.test(linkedinVal)) {
            setUrlErrorType('LinkedIn');
            setInvalidUrl(linkedinVal);
            setURLErrorPopupOpen(true);
            return;
        }

        setIsSaving(true);
        
        try {
            const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
            if (!storedStudentData || (!storedStudentData._id && !storedStudentData.id)) {
                alert('User not authenticated');
                return;
            }

            // Always prefer MongoDB _id so updates and complete-data fetch use the same document
            const studentId = storedStudentData._id || storedStudentData.id;

            // Upload profile photo to GridFS FIRST if a new file was selected
            let profilePhotoUrl = studentData?.profilePicURL || '';
            // Initialize finalResolvedUrl with existing profile URL (in case no new photo uploaded)
            let finalResolvedUrl = studentData?.profilePicURL ? gridfsService.getFileUrl(studentData.profilePicURL) : '';
            
            if (profilePhotoFile) {
                try {
                    console.log('🔄 Uploading profile photo to GridFS...');
                    const result = await gridfsService.uploadProfileImage(profilePhotoFile, studentId, 'student');
                    if (result && result.url) {
                        profilePhotoUrl = result.url; // relative GridFS path e.g. /api/file/xxx
                        finalResolvedUrl = gridfsService.getFileUrl(result.url); // full URL
                        
                        // Don't update UI yet - keep old image visible until save completes
                        // This prevents sidebar flicker (old → placeholder → new)
                        setProfilePhotoFile(null);
                        
                        console.log('✅ Profile photo uploaded to GridFS:', profilePhotoUrl);
                    }
                } catch (uploadErr) {
                    console.error('Failed to upload profile photo:', uploadErr);
                    alert('Failed to upload profile photo. Please try again.');
                    setIsSaving(false);
                    return;
                }
            }

            const formData = new FormData(e.target);
            
            const updateData = {
                // Include all readonly fields to preserve complete profile data
                firstName: formData.get('firstName') || studentData?.firstName || '',
                lastName: formData.get('lastName') || studentData?.lastName || '',
                regNo: formData.get('regNo') || studentData?.regNo || '',
                dob: formData.get('dob') || studentData?.dob || '',
                gender: formData.get('gender') || studentData?.gender || '',
                department: formData.get('department') || studentData?.department || '',
                degree: formData.get('degree') || studentData?.degree || '',
                branch: formData.get('branch') || studentData?.branch || '',
                batch: formData.get('batch') || studentData?.batch || '',
                fatherName: formData.get('fatherName') || studentData?.fatherName || '',
                motherName: formData.get('motherName') || studentData?.motherName || '',
                domainEmail: formData.get('domainEmail') || studentData?.domainEmail || '',
                aadhaarNo: formData.get('aadhaarNo') || studentData?.aadhaarNo || '',
                community: formData.get('community') || studentData?.community || '',
                mediumOfStudy: formData.get('mediumOfStudy') || studentData?.mediumOfStudy || '',
                
                // Academic background (readonly)
                tenthBoard: formData.get('tenthBoard') || studentData?.tenthBoard || '',
                tenthInstitution: formData.get('tenthInstitution') || studentData?.tenthInstitution || '',
                tenthPercentage: formData.get('tenthPercentage') || studentData?.tenthPercentage || '',
                tenthYear: formData.get('tenthYear') || studentData?.tenthYear || '',
                twelfthBoard: formData.get('twelfthBoard') || studentData?.twelfthBoard || '',
                twelfthInstitution: formData.get('twelfthInstitution') || studentData?.twelfthInstitution || '',
                twelfthPercentage: formData.get('twelfthPercentage') || studentData?.twelfthPercentage || '',
                twelfthYear: formData.get('twelfthYear') || studentData?.twelfthYear || '',
                twelfthCutoff: formData.get('twelfthCutoff') || studentData?.twelfthCutoff || '',
                diplomaBoard: formData.get('diplomaBoard') || studentData?.diplomaBoard || '',
                diplomaInstitution: formData.get('diplomaInstitution') || studentData?.diplomaInstitution || '',
                diplomaPercentage: formData.get('diplomaPercentage') || studentData?.diplomaPercentage || '',
                diplomaYear: formData.get('diplomaYear') || studentData?.diplomaYear || '',
                
                // Editable fields - preserve existing data if field not on current form view
                address: formData.get('address') || studentData?.address || '', 
                city: formData.get('city') || studentData?.city || '',
                primaryEmail: formData.get('primaryEmail') || studentData?.primaryEmail || '', 
                mobileNo: formData.get('mobileNo') || studentData?.mobileNo || '',
                fatherOccupation: formData.get('fatherOccupation') || studentData?.fatherOccupation || '', 
                fatherMobile: formData.get('fatherMobile') || studentData?.fatherMobile || '',
                motherOccupation: formData.get('motherOccupation') || studentData?.motherOccupation || '', 
                motherMobile: formData.get('motherMobile') || studentData?.motherMobile || '',
                section: formData.get('section') || studentData?.section || '',
                guardianName: formData.get('guardianName') || studentData?.guardianName || '', 
                guardianMobile: formData.get('guardianMobile') || studentData?.guardianMobile || '',
                bloodGroup: formData.get('bloodGroup') || studentData?.bloodGroup || '', 
                studyCategory: studyCategory || studentData?.studyCategory || '',
                currentYear: formData.get('currentYear') || studentData?.currentYear || '', 
                currentSemester: formData.get('currentSemester') || studentData?.currentSemester || '',
                semester1GPA: formData.get('semester1GPA') || studentData?.semester1GPA || '', 
                semester2GPA: formData.get('semester2GPA') || studentData?.semester2GPA || '',
                semester3GPA: formData.get('semester3GPA') || studentData?.semester3GPA || '', 
                semester4GPA: formData.get('semester4GPA') || studentData?.semester4GPA || '',
                semester5GPA: formData.get('semester5GPA') || studentData?.semester5GPA || '', 
                semester6GPA: formData.get('semester6GPA') || studentData?.semester6GPA || '',
                semester7GPA: formData.get('semester7GPA') || studentData?.semester7GPA || '', 
                semester8GPA: formData.get('semester8GPA') || studentData?.semester8GPA || '',
                overallCGPA: formData.get('overallCGPA') || studentData?.overallCGPA || '', 
                clearedBacklogs: formData.get('clearedBacklogs') || studentData?.clearedBacklogs || '',
                currentBacklogs: formData.get('currentBacklogs') || studentData?.currentBacklogs || '', 
                yearOfGap: formData.get('yearOfGap') || studentData?.yearOfGap || '', 
                gapReason: formData.get('gapReason') || studentData?.gapReason || '',
                residentialStatus: formData.get('residentialStatus') || studentData?.residentialStatus || '', 
                quota: formData.get('quota') || studentData?.quota || '', 
                languagesKnown: formData.get('languagesKnown') || studentData?.languagesKnown || '',
                firstGraduate: formData.get('firstGraduate') || studentData?.firstGraduate || '', 
                passportNo: formData.get('passportNo') || studentData?.passportNo || '', 
                skillSet: formData.get('skillSet') || studentData?.skillSet || '',
                valueAddedCourses: formData.get('valueAddedCourses') || studentData?.valueAddedCourses || '', 
                aboutSibling: formData.get('aboutSibling') || studentData?.aboutSibling || '', 
                rationCardNo: formData.get('rationCardNo') || studentData?.rationCardNo || '',
                familyAnnualIncome: formData.get('familyAnnualIncome') || studentData?.familyAnnualIncome || '', 
                willingToSignBond: formData.get('willingToSignBond') || studentData?.willingToSignBond || '',
                preferredModeOfDrive: formData.get('preferredModeOfDrive') || studentData?.preferredModeOfDrive || '', 
                githubLink: formData.get('githubLink') || studentData?.githubLink || '',
                linkedinLink: formData.get('linkedinLink') || studentData?.linkedinLink || '', 
                portfolioLink: formData.get('portfolioLink') || studentData?.portfolioLink || '', 
                companyTypes: formData.get('companyTypes') || studentData?.companyTypes || '', 
                preferredJobLocation: formData.get('preferredJobLocation') || studentData?.preferredJobLocation || '',
                profilePicURL: (() => {
                    // Store relative GridFS path in DB, not full URL or Base64
                    const pic = profilePhotoUrl || studentData?.profilePicURL || '';
                    if (pic.startsWith('blob:')) return studentData?.profilePicURL || ''; // Don't save blob URLs
                    if (pic.includes('/file/')) {
                        // Extract relative /api/file/xxx path from full URL
                        const match = pic.match(/\/api\/file\/[a-f0-9]+/) || pic.match(/\/file\/([a-f0-9]+)/);
                        if (match) return match[0].startsWith('/api') ? match[0] : `/api${match[0]}`;
                    }
                    if (pic.startsWith('data:')) return studentData?.profilePicURL || ''; // Don't store Base64 anymore
                    if (pic.startsWith('http://') || pic.startsWith('https://')) {
                        // Extract path from full URL
                        const match = pic.match(/\/api\/file\/[a-f0-9]+/);
                        if (match) return match[0];
                    }
                    return pic;
                })(),
                profileUploadDate: uploadInfo.date || new Date().toLocaleDateString('en-GB')
            };

            const result = await fastDataService.updateProfile(studentId, updateData);
            console.log('StuProfile handleSave result.student:', result?.student);

            const updatedStudentData = { 
                ...(studentData || {}), 
                ...(result?.student || {}), 
                ...updateData,
                // Ensure we use the resolved GridFS URL for display
                profilePicURL: finalResolvedUrl || updateData.profilePicURL || studentData?.profilePicURL
            };
            
            // If we have a new profile image, preload it before updating UI (prevents placeholder flash)
            if (finalResolvedUrl && finalResolvedUrl !== studentData?.profilePicURL) {
                try {
                    await new Promise((resolve, reject) => {
                        const img = new Image();
                        const timeout = setTimeout(() => {
                            console.log('⚠️ Image preload timeout, continuing anyway');
                            resolve();
                        }, 3000); // 3 second max wait
                        
                        img.onload = () => {
                            clearTimeout(timeout);
                            console.log('✅ New profile image preloaded successfully');
                            resolve();
                        };
                        img.onerror = () => {
                            clearTimeout(timeout);
                            console.log('⚠️ Image preload failed, continuing anyway');
                            resolve(); // Don't reject, just continue
                        };
                        img.src = finalResolvedUrl;
                    });
                } catch (preloadErr) {
                    console.warn('Image preload error:', preloadErr);
                }
            }
            
            // Clean up blob URLs to prevent memory leaks (after preload completes)
            if (profileImage && profileImage.startsWith('blob:')) {
                URL.revokeObjectURL(profileImage);
            }
            
            // Update local state with new data including new profile pic
            setStudentData(updatedStudentData);
            setCurrentYear(String(updatedStudentData.currentYear || ''));
            setCurrentSemester(String(updatedStudentData.currentSemester || ''));
            setSelectedSection(String(updatedStudentData.section || ''));
            
            // Update profile image preview to new image (seamless transition - image already preloaded)
            if (finalResolvedUrl) {
                setProfileImage(finalResolvedUrl);
            }
            
            // Update localStorage and sidebar ONCE with complete data (image already loaded)
            localStorage.setItem('studentData', JSON.stringify(updatedStudentData));
            window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedStudentData }));
            
            // Show success popup immediately after everything is ready
            setIsSaving(false);
            setPopupOpen(true);
        } catch (error) {
            if (error.message.includes('permission')) { alert('Permission denied.'); }
            else if (error.message.includes('not-found')) { alert('Student record not found.'); }
            else if (error.message.includes('network')) { alert('Network error.'); }
            else { alert(`Error updating data: ${error.message}`); }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscard = () => {
        if (formRef.current) {
            formRef.current.reset();
            setStudyCategory('12th'); setDob(null);
            loadStudentData();
        }
    };

    const handleMobileChange = (e, fieldName) => {
        let value = e.target.value;
        // Remove leading zeros
        value = value.replace(/^0+/, '');
        // Only allow digits
        value = value.replace(/\D/g, '');
        // Limit to 10 digits
        value = value.substring(0, 10);
        setStudentData(prev => ({ ...prev, [fieldName]: value }));
    };

    const closePopup = () => setPopupOpen(false);
    
    const handleViewChange = (view) => {
        onViewChange(view);
        setIsSidebarOpen(false);
    };

    if (isInitialLoading) {
        return (
            <div className={styles.container}>
                <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <div className={styles.main}>
                    <Sidebar
                        isOpen={isSidebarOpen}
                        onLogout={onLogout}
                        currentView={'profile'}
                        onViewChange={handleViewChange}
                        studentData={studentData}
                    />
                    <div className={styles.dashboardArea}>
                        <div className={styles.initialLoaderOverlay}>
                            <div className={styles.initialLoaderCard}>
                                <div className={styles.loadingSpinner}></div>
                                <p>Loading your profile...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.container} ${isSaving ? styles['stu-profile-saving'] : ''}`}>
            {isSaving && <div className={styles['stu-profile-saving-overlay']} />}
            {/* Profile Update Notification */}
            {showUpdateNotification && (
                <div style={{
                    position: 'fixed',
                    top: '80px',
                    right: '20px',
                    backgroundColor: '#4ea24e',
                    color: 'white',
                    padding: '15px 25px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 10000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    animation: 'slideInRight 0.3s ease-out',
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: '500',
                    fontSize: '14px'
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <span>Your profile has been updated by admin</span>
                </div>
            )}
            
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className={styles.main}>
                <Sidebar
                    isOpen={isSidebarOpen}
                    onLogout={onLogout}
                    currentView={'profile'}
                    onViewChange={handleViewChange}
                    studentData={studentData}
                />
                <div className={styles.dashboardArea}>
                    <form ref={formRef} onSubmit={handleSave}>
                        {/* --- PERSONAL INFO --- */}
                        <div className={styles.profileSectionContainer}>
                            <h3 className={styles.sectionHeader}>Personal Information</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.personalInfoFields}>
                                    <input type="text" name="firstName" placeholder="First Name" value={studentData?.firstName || ''} readOnly className={styles.readOnlyInput} />
                                    <input type="text" name="lastName" placeholder="Last Name" value={studentData?.lastName || ''} readOnly className={styles.readOnlyInput} />
                                    <input type="text" name="regNo" placeholder="Register Number" value={studentData?.regNo || ''} readOnly className={styles.readOnlyInput} />
                                    <input type="text" name="batch" placeholder="Batch" value={studentData?.batch || ''} readOnly className={styles.readOnlyInput} />
                                    <div className={styles.datepickerWrapper}>
                                        <DatePicker
                                            selected={dob}
                                            onChange={() => {}}
                                            dateFormat="dd/MM/yyyy"
                                            placeholderText="DOB"
                                            className={`${styles.datepickerInput} ${styles.readOnlyInput}`}
                                            wrapperClassName="StuProfile-datepicker-wrapper-inner"
                                            showPopperArrow={false}
                                            readOnly
                                            disabled
                                        />
                                    </div>
                                    <select name="degree" value={studentData?.degree || ''} disabled className={styles.readOnlyInput}>
                                        <option value="" disabled>Degree</option>
                                        <option value={studentData?.degree || ''}>{studentData?.degree || 'N/A'}</option>
                                    </select>
                                    <select
                                        name="branch"
                                        value={studentData?.branch || ''}
                                        disabled
                                        className={styles.readOnlyInput}
                                    >
                                        <option value="" disabled>Branch</option>
                                        <option value={studentData?.branch || ''}>{studentData?.branch || 'N/A'}</option>
                                    </select>
                                    <select
                                        name="currentYear"
                                        value={currentYear || ''}
                                        required
                                        onChange={(e) => {
                                            const newYear = e.target.value;
                                            setCurrentYear(newYear);
                                            const semesters = getAvailableSemesters(newYear);
                                            const firstSemester = semesters[0] || '';
                                            setCurrentSemester(firstSemester);
                                            setStudentData((prev) => ({ ...(prev || {}), currentYear: newYear, currentSemester: firstSemester }));
                                        }}
                                        disabled={isSaving}
                                    >
                                        <option value="" disabled>Current Year</option>
                                        <option value="I">I</option>
                                        <option value="II">II</option>
                                        <option value="III">III</option>
                                        <option value="IV">IV</option>
                                    </select>
                                    <select
                                        name="currentSemester"
                                        value={currentSemester || ''}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            setCurrentSemester(value);
                                            setStudentData((prev) => ({ ...(prev || {}), currentSemester: value }));
                                        }}
                                        required
                                        disabled={!currentYear || isSaving}
                                    >
                                        <option value="" disabled>{currentYear ? 'Current Semester' : 'Select Year First'}</option>
                                        {getAvailableSemesters(currentYear).map((sem) => (
                                            <option key={sem} value={sem}>
                                                {sem}
                                            </option>
                                        ))}
                                    </select>
                                    <>
                                        <select
                                            name="section"
                                            value={selectedSection}
                                            disabled
                                            className={styles.readOnlyInput}
                                        >
                                            <option value="" disabled>
                                                Section *
                                            </option>
                                            <option value="A">A</option>
                                            <option value="B">B</option>
                                            <option value="C">C</option>
                                            <option value="D">D</option>
                                        </select>
                                        <input type="hidden" name="section" value={selectedSection || ''} />
                                    </>
                                    <select name="gender" value={studentData?.gender || ''} disabled className={styles.readOnlyInput}>
                                        <option value="" disabled>Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                    </select>
                                    <input type="text" name="address" placeholder="Address" defaultValue={studentData?.address || ''} disabled={isSaving} />
                                    <input type="text" name="city" placeholder="City" defaultValue={studentData?.city || ''} disabled={isSaving} />
                                    <input type="email" name="primaryEmail" placeholder="Primary Email" defaultValue={studentData?.primaryEmail || ''} disabled={isSaving} />
                                    <input type="email" name="domainEmail" placeholder="Domain Email" value={studentData?.domainEmail || ''} readOnly className={styles.readOnlyInput} />
                                    <div className={styles.mobileInputWrapper}>
                                        <div className={styles.countryCode}>+91</div>
                                        <input type="tel" name="mobileNo" placeholder="Mobile No." value={studentData?.mobileNo || ''} onChange={(e) => handleMobileChange(e, 'mobileNo')} disabled={isSaving} className={styles.mobileNumberInput} />
                                    </div>
                                    <input type="text" name="fatherName" placeholder="Father Name" value={studentData?.fatherName || ''} readOnly className={styles.readOnlyInput} />
                                    <input type="text" name="fatherOccupation" placeholder="Father Occupation" defaultValue={studentData?.fatherOccupation || ''} disabled={isSaving} />
                                    <div className={styles.mobileInputWrapper}>
                                        <div className={styles.countryCode}>+91</div>
                                        <input type="tel" name="fatherMobile" placeholder="Father Mobile No." value={studentData?.fatherMobile || ''} onChange={(e) => handleMobileChange(e, 'fatherMobile')} disabled={isSaving} className={styles.mobileNumberInput} />
                                    </div>
                                    <input type="text" name="motherName" placeholder="Mother Name" value={studentData?.motherName || ''} readOnly className={styles.readOnlyInput} />
                                    <input type="text" name="motherOccupation" placeholder="Mother Occupation" defaultValue={studentData?.motherOccupation || ''} disabled={isSaving} />
                                    <div className={styles.mobileInputWrapper}>
                                        <div className={styles.countryCode}>+91</div>
                                        <input type="tel" name="motherMobile" placeholder="Mother Mobile No." value={studentData?.motherMobile || ''} onChange={(e) => handleMobileChange(e, 'motherMobile')} disabled={isSaving} className={styles.mobileNumberInput} />
                                    </div>
                                    <input type="text" name="guardianName" placeholder="Guardian Name" defaultValue={studentData?.guardianName || ''} disabled={isSaving} />
                                    <div className={styles.mobileInputWrapper}>
                                        <div className={styles.countryCode}>+91</div>
                                        <input type="tel" name="guardianMobile" placeholder="Guardian Number" value={studentData?.guardianMobile || ''} onChange={(e) => handleMobileChange(e, 'guardianMobile')} disabled={isSaving} className={styles.mobileNumberInput} />
                                    </div>
                                    <input type="text" name="aadhaarNo" placeholder="Aadhaar Number" value={studentData?.aadhaarNo || ''} readOnly className={styles.readOnlyInput} />
                                    <input type="url" name="portfolioLink" placeholder="Portfolio Link" defaultValue={studentData?.portfolioLink || ''} disabled={isSaving} />
                                </div>
                                <div className={styles.profilePhotoWrapper}>
                                    <div className={styles.profilePhotoBox} style={{ height: '675px' }}>
                                        <h3 className={styles.sectionHeader}>Profile Photo</h3>
                                        <div className={styles.profileIconContainer}>
                                            {profileImage ? (
                                                <img
                                                    src={profileImage}
                                                    alt="Profile Preview"
                                                    className={styles.profilePreviewImg}
                                                    onClick={() => setImagePreviewOpen(true)}
                                                />
                                            ) : (
                                                <GraduationCapIcon />
                                            )}
                                        </div>
                                        {profileImage && uploadInfo.name && (
                                            <div className={styles.uploadInfoContainer}>
                                                <div className={styles.uploadInfoItem}>
                                                    <FileIcon />
                                                    <span>{uploadInfo.name}</span>
                                                </div>
                                                <div className={styles.uploadInfoItem}>
                                                    <CalendarIcon />
                                                    <span>Uploaded on: {uploadInfo.date}</span>
                                                </div>
                                            </div>
                                        )}
                                        <div className={styles.uploadActionArea}>
                                            <div className={styles.uploadBtnWrapper}>
                                                <label htmlFor="photo-upload-input" className={styles.profileUploadBtn}>
                                                    <div className={styles.uploadBtnContent}>
                                                        <MdUpload /> <span>Upload (Max 500 KB)</span>
                                                    </div>
                                                </label>
                                                {profileImage && (
                                                    <button onClick={handleImageRemove} className={styles.removeImageBtn} aria-label="Remove image" disabled={isSaving}>
                                                        <IoMdClose />
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                id="photo-upload-input"
                                                ref={fileInputRef}
                                                style={{ display: 'none' }}
                                                accept=".jpg,.jpeg,.webp,image/jpeg,image/webp"
                                                onChange={handleImageUpload}
                                                disabled={isSaving}
                                            />
                                            {uploadSuccess && <p className={styles.uploadSuccessMessage}>Profile Photo uploaded Successfully!</p>}
                                            <p className={styles.uploadHint}>*JPG, JPEG, and WebP formats allowed (WebP recommended).</p>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '24px' }}>
                                        <select name="community" value={studentData?.community || ''} disabled className={styles.readOnlyInput}>
                                            <option value="" disabled>
                                                Community
                                            </option>
                                            <option value="OC">OC</option>
                                            <option value="BC">BC</option>
                                            <option value="BCM">BCM</option>
                                            <option value="MBC">MBC</option>
                                            <option value="SC">SC</option>
                                            <option value="SCA">SCA</option>
                                            <option value="ST">ST</option>
                                        </select>
                                    </div>
                                    <div style={{ marginTop: '24px' }}>
                                        <select name="mediumOfStudy" value={studentData?.mediumOfStudy || ''} disabled className={styles.readOnlyInput}>
                                            <option value="" disabled>
                                                Medium
                                            </option>
                                            <option value="English">English</option>
                                            <option value="Tamil">Tamil</option>
                                            <option value="Other">Others</option>
                                        </select>
                                    </div>
                                    <div style={{ marginTop: '24px' }}>
                                        <input type="text" name="bloodGroup" placeholder="Blood Group" defaultValue={studentData?.bloodGroup || ''} disabled={isSaving} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- ACADEMIC BACKGROUND --- */}
                        <div className={styles.profileSectionContainer}>
                          <h3 className={styles.sectionHeader}>Academic Background</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.studyCategory} style={{ gridColumn: '1 / -1' }}>
                                    <input type="radio" id="12th" name="study_category" value="12th" checked={studyCategory === '12th'} disabled />
                                    <label htmlFor="12th">12th</label>
                                    <input type="radio" id="diploma" name="study_category" value="diploma" checked={studyCategory === 'diploma'} disabled />
                                    <label htmlFor="diploma">Diploma</label>
                                    <input type="radio" id="both" name="study_category" value="both" checked={studyCategory === 'both'} disabled />
                                    <label htmlFor="both">Both</label>
                                </div>
                                    <input type="text" name="tenthInstitution" placeholder="10th Institution Name" value={studentData?.tenthInstitution || ''} readOnly className={styles.readOnlyInput} />
                                    <select name="tenthBoard" value={studentData?.tenthBoard || ''} disabled className={styles.readOnlyInput}><option value="" disabled>10th Board/University</option><option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="Other State Board">Other State Board</option></select>
                                    <input type="text" name="tenthPercentage" placeholder="10th Percentage" value={studentData?.tenthPercentage || ''} readOnly className={styles.readOnlyInput} />
                                    <input type="text" name="tenthYear" placeholder="10th Year of Passing" value={studentData?.tenthYear || ''} readOnly className={styles.readOnlyInput} />
                                    {(studyCategory === '12th' || studyCategory === 'both') && ( <> <input type="text" name="twelfthInstitution" placeholder="12th Institution Name" value={studentData?.twelfthInstitution || ''} readOnly className={styles.readOnlyInput}/> <select name="twelfthBoard" value={studentData?.twelfthBoard || ''} disabled className={styles.readOnlyInput}><option value="" disabled>12th Board/University</option><option value="State Board (Tamil Nadu)">State Board (Tamil Nadu)</option><option value="CBSE">CBSE</option><option value="ICSE">ICSE</option><option value="Other State Board">Other State Board</option></select> <input type="text" name="twelfthPercentage" placeholder="12th Percentage" value={studentData?.twelfthPercentage || ''} readOnly className={styles.readOnlyInput}/> <input type="text" name="twelfthYear" placeholder="12th Year of Passing" value={studentData?.twelfthYear || ''} readOnly className={styles.readOnlyInput}/> <input type="text" name="twelfthCutoff" placeholder="12th Cut-off Marks" value={studentData?.twelfthCutoff || ''} readOnly className={styles.readOnlyInput}/> </> )}
                                    {(studyCategory === 'diploma' || studyCategory === 'both') && ( <> <input type="text" name="diplomaInstitution" placeholder="Diploma Institution" value={studentData?.diplomaInstitution || ''} readOnly className={styles.readOnlyInput}/> <input type="text" name="diplomaBranch" placeholder="Diploma Branch" value={studentData?.diplomaBranch || ''} readOnly className={styles.readOnlyInput}/> <input type="text" name="diplomaPercentage" placeholder="Diploma Percentage" value={studentData?.diplomaPercentage || ''} readOnly className={styles.readOnlyInput}/> <input type="text" name="diplomaYear" placeholder="Diploma Year of Passing" value={studentData?.diplomaYear || ''} readOnly className={styles.readOnlyInput}/> </> )}
                            </div>
                        </div>
                        
                            {/* --- SEMESTER --- */}
                        <div className={styles.profileSectionContainer}>
                            <h3 className={styles.sectionHeader}>Semester</h3>
                            <div className={styles.marksheetGrid}>
                                {/* Show semesters 1 to current semester only */}
                                {(() => {
                                    const currentSem = parseInt(currentSemester) || 1;
                                    const semestersToShow = Array.from({ length: currentSem }, (_, i) => i + 1);
                                    return semestersToShow.map((semesterNumber) => (
                                        <div key={semesterNumber} className={styles.semesterBox}>
                                            <span className={styles.semesterLabel}>Semester {semesterNumber}</span>
                                            <button type="button" className={styles.viewMarksheetBtn}>
                                                <img src={StuEyeIcon} alt="View" className={styles.eyeIcon} />
                                            </button>
                                        </div>
                                    ));
                                })()}
                                
                                {/* Upload button for current semester */}
                                {(() => {
                                    const currentSem = parseInt(currentSemester) || 1;
                                    return (
                                        <button 
                                            type="button" 
                                            className={styles.uploadMarksheetBtnFull}
                                            onClick={() => onViewChange('semester-marksheet-upload')}
                                        >
                                            <img src={StuUploadMarksheetIcon} alt="Upload" className={styles.uploadIcon} />
                                            <span>Upload Sem {currentSem} Marksheet</span>
                                        </button>
                                    );
                                })()}
                            </div>
                            
                            {/* Separator line */}
                            <div className={styles.semesterSeparator}></div>
                            
                            <div className={`${styles.formGrid} ${styles.academicGrid}`} style={{ marginTop: '2rem' }}>
                                <input
                                    type="text"
                                    name="overallCGPA"
                                    placeholder="CGPA"
                                    value={studentData?.overallCGPA ?? ''}
                                    readOnly
                                    className={styles.readOnlyInput}
                                />
                                <input
                                    type="text"
                                    name="clearedBacklogs"
                                    placeholder="No. of Backlog (Arrear Cleared)"
                                    value={studentData?.clearedBacklogs ?? ''}
                                    readOnly
                                    className={styles.readOnlyInput}
                                />
                                <input
                                    type="text"
                                    name="currentBacklogs"
                                    placeholder="No. of Current Backlog"
                                    value={studentData?.currentBacklogs ?? ''}
                                    readOnly
                                    className={styles.readOnlyInput}
                                />
                                <input
                                    type="text"
                                    name="yearOfGap"
                                    placeholder="Year of Gap"
                                    value={studentData?.yearOfGap ?? ''}
                                    readOnly
                                    className={styles.readOnlyInput}
                                />
                                <input
                                    type="text"
                                    name="gapReason"
                                    placeholder="Reason for year of Gap"
                                    value={studentData?.gapReason ?? ''}
                                    readOnly
                                    className={`${styles.readOnlyInput} ${styles.fullWidth}`}
                                />
                            </div>
                        </div>
                        
                        {/* --- OTHER DETAILS --- */}
                        <div className={styles.profileSectionContainer}>
                            <h3 className={styles.sectionHeader}>Other Details</h3>
                            <div className={styles.formGrid}>
                                    <select
                                        name="residentialStatus"
                                        value={studentData?.residentialStatus || ''}
                                        onChange={(e) => setStudentData(prev => ({ ...prev, residentialStatus: e.target.value }))}
                                        disabled={isSaving}
                                    >
                                        <option value="" disabled>Residential status</option>
                                        <option value="Hosteller">Hosteller</option>
                                        <option value="Dayscholar">Dayscholar</option>
                                    </select>
                                    <>
                                        <select
                                            name="quota"
                                            value={studentData?.quota || ''}
                                            disabled
                                            className={styles.readOnlyInput}
                                        >
                                            <option value="" disabled>Quota</option>
                                            <option value="Management">Management</option>
                                            <option value="Counselling">Counselling</option>
                                        </select>
                                        <input type="hidden" name="quota" value={studentData?.quota || ''} />
                                    </>
                                    <input
                                        type="text"
                                        name="languagesKnown"
                                        placeholder="Languages Known"
                                        value={studentData?.languagesKnown || ''}
                                        onChange={(e) => setStudentData(prev => ({ ...prev, languagesKnown: e.target.value }))}
                                        disabled={isSaving}
                                    />
                                    <>
                                        <select
                                            name="firstGraduate"
                                            value={studentData?.firstGraduate || ''}
                                            disabled
                                            className={styles.readOnlyInput}
                                        >
                                            <option value="" disabled>First Graduate</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                        </select>
                                        <input type="hidden" name="firstGraduate" value={studentData?.firstGraduate || ''} />
                                    </>
                                    <input
                                        type="text"
                                        name="passportNo"
                                        placeholder="Passport No."
                                        value={studentData?.passportNo || ''}
                                        onChange={(e) => setStudentData(prev => ({ ...prev, passportNo: e.target.value }))}
                                        disabled={isSaving}
                                    />
                                    <input
                                        type="text"
                                        name="skillSet"
                                        placeholder="Skill set"
                                        value={studentData?.skillSet || ''}
                                        onChange={(e) => setStudentData(prev => ({ ...prev, skillSet: e.target.value }))}
                                        disabled={isSaving}
                                    />
                                    <input
                                        type="text"
                                        name="valueAddedCourses"
                                        placeholder="Value Added Courses"
                                        value={studentData?.valueAddedCourses || ''}
                                        onChange={(e) => setStudentData(prev => ({ ...prev, valueAddedCourses: e.target.value }))}
                                        disabled={isSaving}
                                    />
                                    <input
                                        type="text"
                                        name="aboutSibling"
                                        placeholder="About sibling"
                                        value={studentData?.aboutSibling || ''}
                                        onChange={(e) => setStudentData(prev => ({ ...prev, aboutSibling: e.target.value }))}
                                        disabled={isSaving}
                                    />
                                    <input
                                        type="text"
                                        name="rationCardNo"
                                        placeholder="Ration card No."
                                        value={studentData?.rationCardNo || ''}
                                        readOnly
                                        className={styles.readOnlyInput}
                                        disabled={isSaving}
                                    />
                                    <input
                                        type="text"
                                        name="familyAnnualIncome"
                                        placeholder="Family Annual Income"
                                        value={studentData?.familyAnnualIncome || ''}
                                        onChange={(e) => setStudentData(prev => ({ ...prev, familyAnnualIncome: e.target.value }))}
                                        disabled={isSaving}
                                    />
                                    <input
                                        type="text"
                                        name="panNo"
                                        placeholder="PAN No."
                                        value={studentData?.panNo || ''}
                                        readOnly
                                        className={styles.readOnlyInput}
                                    />
                                    <>
                                        <select
                                            name="willingToSignBond"
                                            value={studentData?.willingToSignBond || ''}
                                            disabled
                                            className={styles.readOnlyInput}
                                        >
                                            <option value="" disabled>Willing to Sign Bond</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                        </select>
                                        <input type="hidden" name="willingToSignBond" value={studentData?.willingToSignBond || ''} />
                                    </>
                                    <>
                                        <select
                                            name="preferredModeOfDrive"
                                            value={studentData?.preferredModeOfDrive || ''}
                                            disabled
                                            className={styles.readOnlyInput}
                                        >
                                            <option value="" disabled>Preferred Mode of Drive</option>
                                            <option value="On-Campus">On-Campus</option>
                                            <option value="Off-Campus">Off-Campus</option>
                                            <option value="Hybrid">Hybrid</option>
                                        </select>
                                        <input type="hidden" name="preferredModeOfDrive" value={studentData?.preferredModeOfDrive || ''} />
                                    </>
                                    <input
                                        type="url"
                                        name="githubLink"
                                        placeholder="GitHub Link (e.g. https://github.com/username)"
                                        value={studentData?.githubLink || ''}
                                        onChange={(e) => setStudentData(prev => ({ ...prev, githubLink: e.target.value }))}
                                        onBlur={(e) => {
                                            const val = e.target.value.trim();
                                            if (val && !GITHUB_URL_REGEX.test(val)) {
                                                e.target.style.borderColor = '#dc3545';
                                                e.target.title = 'Must be: https://github.com/your-username';
                                                setUrlErrorType('GitHub');
                                                setInvalidUrl(val);
                                                setURLErrorPopupOpen(true);
                                            } else {
                                                e.target.style.borderColor = val ? '#28a745' : '';
                                                e.target.title = '';
                                            }
                                        }}
                                        disabled={isSaving}
                                    />
                                    <input
                                        type="url"
                                        name="linkedinLink"
                                        placeholder="LinkedIn Link (e.g. https://linkedin.com/in/username)"
                                        value={studentData?.linkedinLink || ''}
                                        onChange={(e) => setStudentData(prev => ({ ...prev, linkedinLink: e.target.value }))}
                                        onBlur={(e) => {
                                            const val = e.target.value.trim();
                                            if (val && !LINKEDIN_URL_REGEX.test(val)) {
                                                e.target.style.borderColor = '#dc3545';
                                                e.target.title = 'Must be: https://linkedin.com/in/your-username';
                                                setUrlErrorType('LinkedIn');
                                                setInvalidUrl(val);
                                                setURLErrorPopupOpen(true);
                                            } else {
                                                e.target.style.borderColor = val ? '#28a745' : '';
                                                e.target.title = '';
                                            }
                                        }}
                                        disabled={isSaving}
                                    />
                                    <div className={styles.checkboxGroup}>
                                        <span className={styles.checkboxGroupLabel}>Company Types</span>
                                        <div className={styles.checkboxOptions}>
                                            {COMPANY_TYPE_OPTIONS.map((option) => (
                                                <label key={option} className={styles.checkboxOption}>
                                                    <input
                                                        type="checkbox"
                                                        name="companyTypesReadonly"
                                                        checked={selectedCompanyTypes.includes(option)}
                                                        disabled
                                                    />
                                                    <span>{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={styles.checkboxGroup}>
                                        <span className={styles.checkboxGroupLabel}>Preferred Job Locations</span>
                                        <div className={styles.checkboxOptions}>
                                            {JOB_LOCATION_OPTIONS.map((option) => (
                                                <label key={option} className={styles.checkboxOption}>
                                                    <input
                                                        type="checkbox"
                                                        name="jobLocationsReadonly"
                                                        checked={selectedJobLocations.includes(option)}
                                                        disabled
                                                    />
                                                    <span>{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <input type="hidden" name="companyTypes" value={companyTypesHiddenValue} />
                                    <input type="hidden" name="preferredJobLocation" value={jobLocationsHiddenValue} />
                            </div>
                        </div>
                        
                        <div className={styles.actionButtons}>
                            <button type="button" className={styles.discardBtn} onClick={handleDiscard} disabled={isSaving}>Discard</button>
                            <button type="submit" className={styles.saveBtn} disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <div className={styles.loadingSpinner}></div>
                                        Saving...
                                    </>
                                ) : (
                                    'Save'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>}
            <SuccessPopup isOpen={isPopupOpen} onClose={closePopup} />
            <FileSizeErrorPopup 
                isOpen={isFileSizeErrorOpen} 
                onClose={() => setIsFileSizeErrorOpen(false)} 
                fileSizeKB={fileSizeErrorKB} 
            />
            <URLValidationErrorPopup
                isOpen={isURLErrorPopupOpen}
                onClose={() => setURLErrorPopupOpen(false)}
                urlType={urlErrorType}
                invalidUrl={invalidUrl}
            />
            <ImagePreviewModal src={profileImage} isOpen={isImagePreviewOpen} onClose={() => setImagePreviewOpen(false)} />
        </div>
    );
}

export default StuProfile;