import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { API_BASE_URL } from '../utils/apiConfig';

import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';
import styles from './StuProfile.module.css'; // Module Import
import achievementStyles from './Achievements.module.css'; // Achievement popup styles
import Adminicons from '../assets/BlueAdminicon.png';
import mongoDBService from '../services/mongoDBService.jsx';
import fastDataService from '../services/fastDataService.jsx';

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

function StuProfile({ onLogout, onViewChange }) {
    const [studyCategory, setStudyCategory] = useState('12th');
    const [isPopupOpen, setPopupOpen] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [uploadInfo, setUploadInfo] = useState({ name: '', date: '' });
    const formRef = useRef(null);
    const fileInputRef = useRef(null);
    const [isImagePreviewOpen, setImagePreviewOpen] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [dob, setDob] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [lastSyncTime, setLastSyncTime] = useState(null);
    const [showUpdateNotification, setShowUpdateNotification] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState('');
    const [currentSemester, setCurrentSemester] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isFileSizeErrorOpen, setIsFileSizeErrorOpen] = useState(false);
    const [fileSizeErrorKB, setFileSizeErrorKB] = useState('');

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
            setProfileImage(merged.profilePicURL);
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

    // Auto-sync mechanism: Check for profile updates every 10 seconds
    useEffect(() => {
        const checkForUpdates = async () => {
            try {
                const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
                if (!storedStudentData || !storedStudentData._id) return;
                
                const studentId = storedStudentData._id || storedStudentData.id;
                
                // Fetch latest data from server with JWT token
                const authToken = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) return;
                
                const latestData = await response.json();
                const serverUpdatedAt = latestData.updatedAt;
                
                // Compare timestamps - if server data is newer, refresh profile
                if (serverUpdatedAt && lastSyncTime) {
                    const serverTime = new Date(serverUpdatedAt).getTime();
                    const localTime = new Date(lastSyncTime).getTime();
                    
                    if (serverTime > localTime) {
                        console.log('Profile updated by admin - Auto-syncing...');
                        
                        // Update localStorage with fresh data
                        localStorage.setItem('studentData', JSON.stringify(latestData));
                        
                        // Refresh the form fields with latest data
                        populateFormFields(latestData);
                        
                        // Update sync time
                        setLastSyncTime(serverUpdatedAt);
                        
                        // Show notification
                        setShowUpdateNotification(true);
                        setTimeout(() => setShowUpdateNotification(false), 5000);
                        
                        // Dispatch event for other components
                        window.dispatchEvent(new CustomEvent('profileUpdated', { 
                            detail: { profilePicURL: latestData.profilePicURL, studentData: latestData } 
                        }));
                    }
                }
            } catch (error) {
                console.error('Auto-sync check failed:', error);
            }
        };
        
        // Check for updates every 10 seconds
        const syncInterval = setInterval(checkForUpdates, 10000);
        
        // Cleanup interval on unmount
        return () => clearInterval(syncInterval);
    }, [lastSyncTime]);

    // Auto-sync mechanism: Check for profile updates every 10 seconds
    useEffect(() => {
        const checkForUpdates = async () => {
            try {
                const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
                if (!storedStudentData || !storedStudentData._id) return;
                
                const studentId = storedStudentData._id || storedStudentData.id;
                
                // Fetch latest data from server with JWT token
                const authToken = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE_URL}/students/${studentId}`, {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (!response.ok) return;
                
                const latestData = await response.json();
                const serverUpdatedAt = latestData.updatedAt;
                
                // Compare timestamps - if server data is newer, refresh profile
                if (serverUpdatedAt && lastSyncTime) {
                    const serverTime = new Date(serverUpdatedAt).getTime();
                    const localTime = new Date(lastSyncTime).getTime();
                    
                    if (serverTime > localTime) {
                        console.log('Profile updated by admin - Auto-syncing...');
                        
                        // Update localStorage with fresh data
                        localStorage.setItem('studentData', JSON.stringify(latestData));
                        
                        // Refresh the form fields with latest data
                        populateFormFields(latestData);
                        
                        // Update sync time
                        setLastSyncTime(serverUpdatedAt);
                        
                        // Show notification
                        setShowUpdateNotification(true);
                        setTimeout(() => setShowUpdateNotification(false), 5000);
                        
                        // Dispatch event for other components
                        window.dispatchEvent(new CustomEvent('profileUpdated', { 
                            detail: { profilePicURL: latestData.profilePicURL, studentData: latestData } 
                        }));
                    }
                }
            } catch (error) {
                console.error('Auto-sync check failed:', error);
            }
        };
        
        // Check for updates every 10 seconds
        const syncInterval = setInterval(checkForUpdates, 10000);
        
        // Cleanup interval on unmount
        return () => clearInterval(syncInterval);
    }, [lastSyncTime]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file && file.type === "image/jpeg") {
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
            
            try {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setProfileImage(event.target.result);
                    setUploadInfo({ name: file.name, date: new Date().toLocaleDateString('en-GB') });
                    setUploadSuccess(true);
                    setTimeout(() => setUploadSuccess(false), 5000);
                };
                reader.readAsDataURL(file);
            } catch (error) {
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
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
            if (!storedStudentData || (!storedStudentData._id && !storedStudentData.id)) {
                alert('User not authenticated');
                return;
            }

            // Always prefer MongoDB _id so updates and complete-data fetch use the same document
            const studentId = storedStudentData._id || storedStudentData.id;
            const formData = new FormData(e.target);
            
            const updateData = {
                address: formData.get('address') || '', city: formData.get('city') || '',
                primaryEmail: formData.get('primaryEmail') || '', mobileNo: formData.get('mobileNo') || '',
                fatherOccupation: formData.get('fatherOccupation') || '', fatherMobile: formData.get('fatherMobile') || '',
                motherOccupation: formData.get('motherOccupation') || '', motherMobile: formData.get('motherMobile') || '',
                section: formData.get('section') || '',
                guardianName: formData.get('guardianName') || '', guardianMobile: formData.get('guardianMobile') || '',
                bloodGroup: formData.get('bloodGroup') || '', studyCategory: studyCategory,
                currentYear: formData.get('currentYear') || '', currentSemester: formData.get('currentSemester') || '',
                semester1GPA: formData.get('semester1GPA') || '', semester2GPA: formData.get('semester2GPA') || '',
                semester3GPA: formData.get('semester3GPA') || '', semester4GPA: formData.get('semester4GPA') || '',
                semester5GPA: formData.get('semester5GPA') || '', semester6GPA: formData.get('semester6GPA') || '',
                semester7GPA: formData.get('semester7GPA') || '', semester8GPA: formData.get('semester8GPA') || '',
                overallCGPA: formData.get('overallCGPA') || '', clearedBacklogs: formData.get('clearedBacklogs') || '',
                currentBacklogs: formData.get('currentBacklogs') || '', yearOfGap: formData.get('yearOfGap') || '', gapReason: formData.get('gapReason') || '',
                residentialStatus: formData.get('residentialStatus') || '', quota: formData.get('quota') || '', languagesKnown: formData.get('languagesKnown') || '',
                firstGraduate: formData.get('firstGraduate') || '', passportNo: formData.get('passportNo') || '', skillSet: formData.get('skillSet') || '',
                valueAddedCourses: formData.get('valueAddedCourses') || '', aboutSibling: formData.get('aboutSibling') || '', rationCardNo: formData.get('rationCardNo') || '',
                familyAnnualIncome: formData.get('familyAnnualIncome') || '', willingToSignBond: formData.get('willingToSignBond') || '',
                preferredModeOfDrive: formData.get('preferredModeOfDrive') || '', githubLink: formData.get('githubLink') || '',
                linkedinLink: formData.get('linkedinLink') || '', companyTypes: formData.get('companyTypes') || '', preferredJobLocation: formData.get('preferredJobLocation') || '',
                profilePicURL: profileImage || '', profileUploadDate: uploadInfo.date || new Date().toLocaleDateString('en-GB')
            };

            const result = await fastDataService.updateProfile(studentId, updateData);
            console.log('StuProfile handleSave result.student:', result?.student);

            const updatedStudentData = { ...(studentData || {}), ...(result?.student || {}), ...updateData };
            setStudentData(updatedStudentData);
            setCurrentYear(String(updatedStudentData.currentYear || ''));
            setCurrentSemester(String(updatedStudentData.currentSemester || ''));
            setSelectedSection(String(updatedStudentData.section || ''));
            localStorage.setItem('studentData', JSON.stringify(updatedStudentData));
            window.dispatchEvent(new CustomEvent('profileUpdated', { detail: updatedStudentData }));
            
            setTimeout(() => { setPopupOpen(true); setIsSaving(false); }, 1000);
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
        <div className={styles.container}>
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
                                        disabled={!currentYear}
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
                                    <input type="text" name="address" placeholder="Address" defaultValue={studentData?.address || ''} />
                                    <input type="text" name="city" placeholder="City" defaultValue={studentData?.city || ''} />
                                    <input type="email" name="primaryEmail" placeholder="Primary Email" defaultValue={studentData?.primaryEmail || ''} />
                                    <input type="email" name="domainEmail" placeholder="Domain Email" value={studentData?.domainEmail || ''} readOnly className={styles.readOnlyInput} />
                                    <input type="tel" name="mobileNo" placeholder="Mobile No." defaultValue={studentData?.mobileNo || ''} />
                                    <input type="text" name="fatherName" placeholder="Father Name" value={studentData?.fatherName || ''} readOnly className={styles.readOnlyInput} />
                                    <input type="text" name="fatherOccupation" placeholder="Father Occupation" defaultValue={studentData?.fatherOccupation || ''} />
                                    <input type="text" name="fatherMobile" placeholder="Father Mobile No." defaultValue={studentData?.fatherMobile || ''} />
                                    <input type="text" name="motherName" placeholder="Mother Name" value={studentData?.motherName || ''} readOnly className={styles.readOnlyInput} />
                                    <input type="text" name="motherOccupation" placeholder="Mother Occupation" defaultValue={studentData?.motherOccupation || ''} />
                                    <input type="text" name="motherMobile" placeholder="Mother Mobile No." defaultValue={studentData?.motherMobile || ''} />
                                    <input type="text" name="guardianName" placeholder="Guardian Name" defaultValue={studentData?.guardianName || ''} />
                                    <input type="text" name="guardianMobile" placeholder="Guardian Number" defaultValue={studentData?.guardianMobile || ''} />
                                    <input type="text" name="aadhaarNo" placeholder="Aadhaar Number" value={studentData?.aadhaarNo || ''} readOnly className={styles.readOnlyInput} />
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
                                                    <button onClick={handleImageRemove} className={styles.removeImageBtn} aria-label="Remove image">
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
                                            {uploadSuccess && <p className={styles.uploadSuccessMessage}>Profile Photo uploaded Successfully!</p>}
                                            <p className={styles.uploadHint}>*Only JPG format is allowed.</p>
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
                                        <input type="text" name="bloodGroup" placeholder="Blood Group" defaultValue={studentData?.bloodGroup || ''} />
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
                            <div className={`${styles.formGrid} ${styles.semesterGrid}`}>
                                {getAllGPAFields().map((field) => {
                                    const semesterNumber = field.replace('semester', '').replace('GPA', '');
                                    const isRequired = getRequiredGPAFields().includes(field);
                                    return (
                                        <input
                                            key={field}
                                            type="text"
                                            name={field}
                                            placeholder={`Semester ${semesterNumber} GPA ${isRequired ? '(e.g., 9.08)' : ''}`.trim()}
                                            value={studentData?.[field] ?? ''}
                                            readOnly
                                            className={styles.readOnlyInput}
                                        />
                                    );
                                })}

                                <input
                                    type="text"
                                    name="overallCGPA"
                                    placeholder="Overall CGPA (e.g., 9.08)"
                                    value={studentData?.overallCGPA ?? ''}
                                    readOnly
                                    className={styles.readOnlyInput}
                                />
                                <input
                                    type="text"
                                    name="clearedBacklogs"
                                    placeholder="No. of Backlogs (Cleared)"
                                    value={studentData?.clearedBacklogs ?? ''}
                                    readOnly
                                    className={styles.readOnlyInput}
                                />
                                <input
                                    type="text"
                                    name="currentBacklogs"
                                    placeholder="No. of Current Backlogs"
                                    value={studentData?.currentBacklogs ?? ''}
                                    readOnly
                                    className={styles.readOnlyInput}
                                />
                                <select
                                    name="arrearStatusDisplay"
                                    value={studentData?.arrearStatus || ''}
                                    disabled
                                    className={styles.readOnlyInput}
                                >
                                    <option value="" disabled>Arrear Status</option>
                                    {ARREAR_STATUS_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                                <input type="hidden" name="arrearStatus" value={studentData?.arrearStatus || ''} />
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
                                    placeholder="Reason for Gap"
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
                                    />
                                    <input
                                        type="text"
                                        name="skillSet"
                                        placeholder="Skill set"
                                        value={studentData?.skillSet || ''}
                                        onChange={(e) => setStudentData(prev => ({ ...prev, skillSet: e.target.value }))}
                                    />
                                    <input
                                        type="text"
                                        name="valueAddedCourses"
                                        placeholder="Value Added Courses"
                                        value={studentData?.valueAddedCourses || ''}
                                        onChange={(e) => setStudentData(prev => ({ ...prev, valueAddedCourses: e.target.value }))}
                                    />
                                    <input
                                        type="text"
                                        name="aboutSibling"
                                        placeholder="About sibling"
                                        value={studentData?.aboutSibling || ''}
                                        onChange={(e) => setStudentData(prev => ({ ...prev, aboutSibling: e.target.value }))}
                                    />
                                    <input
                                        type="text"
                                        name="rationCardNo"
                                        placeholder="Ration card No."
                                        value={studentData?.rationCardNo || ''}
                                        readOnly
                                        className={styles.readOnlyInput}
                                    />
                                    <input
                                        type="text"
                                        name="familyAnnualIncome"
                                        placeholder="Family Annual Income"
                                        value={studentData?.familyAnnualIncome || ''}
                                        onChange={(e) => setStudentData(prev => ({ ...prev, familyAnnualIncome: e.target.value }))}
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
                                        type="text"
                                        name="githubLink"
                                        placeholder="GitHub Link"
                                        value={studentData?.githubLink || ''}
                                        onChange={(e) => setStudentData(prev => ({ ...prev, githubLink: e.target.value }))}
                                    />
                                    <input
                                        type="text"
                                        name="linkedinLink"
                                        placeholder="LinkedIn Profile Link"
                                        value={studentData?.linkedinLink || ''}
                                        onChange={(e) => setStudentData(prev => ({ ...prev, linkedinLink: e.target.value }))}
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
            <ImagePreviewModal src={profileImage} isOpen={isImagePreviewOpen} onClose={() => setImagePreviewOpen(false)} />
        </div>
    );
}

export default StuProfile;