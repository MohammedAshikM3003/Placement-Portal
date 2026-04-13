import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import "react-datepicker/dist/react-datepicker.css";
import { API_BASE_URL } from '../utils/apiConfig';
import '../components/alerts/AlertStyles.css';

import Navbar from '../components/Navbar/Conavbar.js';
import Sidebar from '../components/Sidebar/Cosidebar.js';
import styles from './Coo_ManageStudentView.module.css'; // Module Import
import Adminicons from '../assets/Adminicon.png';
import BestAchievement from '../assets/BestAchievementicon.svg';
import StuEyeIcon from '../assets/Coordviewicon.svg';
import mongoDBService from '../services/mongoDBService.jsx';
import fastDataService from '../services/fastDataService.jsx';
import gridfsService from '../services/gridfsService';
import {
    PreviewProgressAlert,
    PreviewFailedAlert,
    CertificateDownloadProgressAlert,
    CertificateDownloadSuccessAlert,
    DownloadFailedAlert as ActionDownloadFailedAlert
} from '../components/alerts';

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

const PREFERRED_TRAINING_OPTIONS = [
    "Java",
    "Python",
    "Fullstack Development",
    "Gen AI",
    "Cloud Computing"
];

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

const toPdfBlobUrl = (fileData, mimeType = 'application/pdf') => {
    const rawData = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
    const byteCharacters = atob(rawData);
    const byteNumbers = new Array(byteCharacters.length);

    for (let index = 0; index < byteCharacters.length; index += 1) {
        byteNumbers[index] = byteCharacters.charCodeAt(index);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });
    return window.URL.createObjectURL(blob);
};

const ResumeChooserModal = ({ isOpen, onClose, onView, onDownload, isProcessing, activeAction }) => {
    if (!isOpen) return null;

    return (
        <div className="alert-overlay" onClick={onClose}>
            <div className="achievement-popup-container" onClick={(e) => e.stopPropagation()}>
                <div className="achievement-popup-header" style={{ backgroundColor: '#D23B42' }}>
                    Resume
                </div>
                <div className="achievement-popup-body">
                    <svg className="download-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="download-success-icon--circle" cx="26" cy="26" r="25" fill="none" />
                        <path className="download-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                    </svg>
                    <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: '24px', color: '#000', fontWeight: '700' }}>
                        Student Resume
                    </h2>
                    <p style={{ margin: 0, color: '#888', fontSize: '16px' }}>
                        Choose an action to open or download the resume.
                    </p>
                </div>
                <div className="achievement-popup-footer">
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <button
                            type="button"
                            onClick={() => {
                                if (isProcessing) {
                                    return;
                                }
                                if (typeof onView === 'function') {
                                    onView();
                                }
                            }}
                            disabled={isProcessing}
                            style={{
                                backgroundColor: '#197AFF',
                                color: '#fff',
                                border: 'none',
                                padding: '0.8rem 1.5rem',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                opacity: isProcessing && activeAction !== 'preview' ? 0.75 : 1,
                                boxShadow: '0 2px 8px rgba(25, 122, 255, 0.2)',
                                minWidth: '108px'
                            }}
                        >
                            {isProcessing && activeAction === 'preview' ? 'Preview..' : 'Preview'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (isProcessing) {
                                    return;
                                }
                                if (typeof onDownload === 'function') {
                                    onDownload();
                                }
                            }}
                            disabled={isProcessing}
                            style={{
                                backgroundColor: '#D23B42',
                                color: '#fff',
                                border: 'none',
                                padding: '0.8rem 1.5rem',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                opacity: isProcessing && activeAction !== 'download' ? 0.75 : 1,
                                boxShadow: '0 2px 8px rgba(210, 59, 66, 0.28)',
                                minWidth: '108px'
                            }}
                        >
                            {isProcessing && activeAction === 'download' ? 'Download..' : 'Download'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

function Coo_ManageStudentView({ onLogout, onViewChange }) {
    const { studentId } = useParams(); // Get studentId from URL params
    const navigate = useNavigate();
    const [studyCategory, setStudyCategory] = useState('12th');
    const [profileImage, setProfileImage] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [dob, setDob] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [currentYear, setCurrentYear] = useState('');
    const [currentSemester, setCurrentSemester] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [skills, setSkills] = useState([]);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [hoveredRound, setHoveredRound] = useState(null);
    const [selectedRound, setSelectedRound] = useState(null);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 600);
    const [isResumeChooserOpen, setIsResumeChooserOpen] = useState(false);
    const [isResumeProcessing, setIsResumeProcessing] = useState(false);
    const [resumeActionType, setResumeActionType] = useState('');
    const [resumePreviewPopupState, setResumePreviewPopupState] = useState('none');
    const [resumePreviewProgress, setResumePreviewProgress] = useState(0);
    const [resumeDownloadPopupState, setResumeDownloadPopupState] = useState('none');
    const [resumeDownloadProgress, setResumeDownloadProgress] = useState(0);
    const [loadingProgress, setLoadingProgress] = useState(15);
    const [studentTrainingAssignment, setStudentTrainingAssignment] = useState(null);
    const [studentTrainingAttendanceRecords, setStudentTrainingAttendanceRecords] = useState([]);

    // Helper functions for multi-select values
    const selectedCompanyTypes = useMemo(
        () => parseMultiValue(studentData?.companyTypes),
        [studentData?.companyTypes]
    );

    const selectedJobLocations = useMemo(
        () => parseMultiValue(studentData?.preferredJobLocation),
        [studentData?.preferredJobLocation]
    );

    const selectedTrainings = useMemo(
        () => parseMultiValue(studentData?.preferredTraining),
        [studentData?.preferredTraining]
    );

    const companyTypesHiddenValue = useMemo(
        () => selectedCompanyTypes.join(', '),
        [selectedCompanyTypes]
    );

    const jobLocationsHiddenValue = useMemo(
        () => selectedJobLocations.join(', '),
        [selectedJobLocations]
    );

    // Company Details — merge real studentData with mock fallbacks
    const companyStats = useMemo(() => ({
        totalCompaniesAttended: studentData?.totalCompaniesAttended ?? 10,
        totalDrivesAttended:    studentData?.totalDrivesAttended    ?? 14,
        shortlistedCount:       studentData?.shortlistedCount       ?? 11,
        preferredModeOfDrive:   studentData?.preferredModeOfDrive   || 'Hybrid',
        lastDriveAttended:      studentData?.lastDriveAttended      || '',
        lastDriveResult:        studentData?.lastDriveResult        || '',
        highestPackageDrive:    studentData?.highestPackageDrive    ?? 24,
        totalRoundsCleared:     studentData?.totalRoundsCleared     ?? 19,
    }), [studentData]);

    const PIE_DATA = [
        { name: 'Shortlisted', value: companyStats.shortlistedCount, fill: '#4CAF50' },
        { name: 'Remaining', value: companyStats.totalDrivesAttended - companyStats.shortlistedCount, fill: '#E0E0E0' }
    ];

    const successRate = useMemo(() => {
        const attended   = companyStats.totalDrivesAttended;
        const shortlisted = companyStats.shortlistedCount;
        if (attended === 0) return 0;
        return Math.min(100, Math.round((shortlisted / attended) * 100));
    }, [companyStats.totalDrivesAttended, companyStats.shortlistedCount]);

    const getAvailableSemesters = (year) => {
        const semesterMap = { 'I': ['1', '2'], 'II': ['3', '4'], 'III': ['5', '6'], 'IV': ['7', '8'] };
        return semesterMap[year] || [];
    };

    const resolveResumeUrl = (resumeDoc) => {
        if (!resumeDoc) return '';

        const rawUrl = resumeDoc.gridfsFileUrl
            || (resumeDoc.gridfsFileId ? `/api/file/${resumeDoc.gridfsFileId}` : '')
            || resumeDoc.url
            || resumeDoc.resumeURL
            || resumeDoc.resumeUrl
            || resumeDoc.fileURL
            || resumeDoc.resumeData?.url
            || resumeDoc.resumeData?.resumeURL
            || resumeDoc.resumeData?.resumeUrl
            || '';

        if (!rawUrl) return '';
        if (rawUrl.startsWith('http') || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) return rawUrl;
        if (rawUrl.startsWith('/api/file/')) return `${API_BASE_URL}${rawUrl.replace('/api', '')}`;
        if (rawUrl.startsWith('/file/')) return `${API_BASE_URL}${rawUrl}`;
        if (rawUrl.startsWith('/api/')) return `${API_BASE_URL.replace('/api', '')}${rawUrl}`;
        if (rawUrl.startsWith('/')) return `${API_BASE_URL.replace('/api', '')}${rawUrl}`;
        return rawUrl;
    };

    const closeResumePopup = () => {
        if (isResumeProcessing) {
            return;
        }

        setIsResumeChooserOpen(false);
    };

    const handleResumeOpen = () => {
        setResumeActionType('');
        setResumePreviewPopupState('none');
        setResumeDownloadPopupState('none');
        setIsResumeChooserOpen(true);
    };

    const resolveResumeFile = async () => {
        if (!studentId) {
            throw new Error('Student ID not found');
        }

        try {
            const resumeResponse = await mongoDBService.getResume(studentId);
            const resumeDoc = resumeResponse?.resume || resumeResponse || null;
            let resumeUrl = resolveResumeUrl(resumeDoc);
            const resumeFileName = resumeDoc?.fileName || resumeDoc?.name || resumeDoc?.resumeData?.fileName || 'resume.pdf';

            if (!resumeUrl && resumeDoc?.fileData) {
                resumeUrl = resumeDoc.fileData.startsWith('data:')
                    ? resumeDoc.fileData
                    : `data:${resumeDoc.fileType || 'application/pdf'};base64,${resumeDoc.fileData}`;
            }

            if (!resumeUrl) {
                const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
                const fallbackResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/api/resume-builder/pdf/${studentId}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
                    }
                });

                if (fallbackResponse.ok) {
                    const result = await fallbackResponse.json();
                    resumeUrl = resolveResumeUrl(result?.resume || null);
                }
            }

            if (!resumeUrl) {
                throw new Error('Resume not found for this student.');
            }

            if (resumeUrl.startsWith('data:')) {
                return {
                    blobUrl: toPdfBlobUrl(resumeUrl, resumeDoc?.fileType || 'application/pdf'),
                    fileName: resumeFileName,
                    shouldRevoke: true
                };
            }

            if (resumeUrl.startsWith('blob:')) {
                return {
                    blobUrl: resumeUrl,
                    fileName: resumeFileName,
                    shouldRevoke: false
                };
            }

            const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
            const response = await fetch(resumeUrl, {
                headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Resume fetch failed with status ${response.status}`);
            }

            const blob = await response.blob();
            if (!blob.size || blob.type.includes('html')) {
                throw new Error('Invalid resume response received');
            }

            return {
                blobUrl: window.URL.createObjectURL(blob),
                fileName: resumeFileName,
                shouldRevoke: true
            };
        } catch (error) {
            console.error('Failed to resolve resume:', error);
            throw error;
        }
    };

    const handleResumeView = async () => {
        if (isResumeProcessing) {
            return;
        }

        let progressInterval;
        let blobUrl = null;
        let shouldRevoke = false;

        try {
            setResumeActionType('preview');
            setIsResumeProcessing(true);
            setIsResumeChooserOpen(false);
            setResumePreviewPopupState('none');
            setResumePreviewPopupState('progress');
            setResumePreviewProgress(0);

            progressInterval = setInterval(() => {
                setResumePreviewProgress((prev) => {
                    if (prev >= 90) {
                        return 90;
                    }
                    return prev + 15;
                });
            }, 150);

            const result = await resolveResumeFile();
            blobUrl = result.blobUrl;
            shouldRevoke = result.shouldRevoke;

            const previewWindow = window.open(blobUrl, '_blank');
            if (!previewWindow) {
                throw new Error('Popup blocked');
            }

            if (progressInterval) {
                clearInterval(progressInterval);
            }
            setResumePreviewProgress(100);
            setTimeout(() => setResumePreviewPopupState('none'), 500);

            if (shouldRevoke && blobUrl) {
                setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
            }
        } catch (error) {
            console.error('Resume preview failed:', error);
            if (progressInterval) {
                clearInterval(progressInterval);
            }
            if (shouldRevoke && blobUrl) {
                window.URL.revokeObjectURL(blobUrl);
            }
            setIsResumeChooserOpen(false);
            setResumePreviewPopupState('failed');
            setTimeout(() => setResumePreviewPopupState('none'), 3000);
        } finally {
            setIsResumeProcessing(false);
            setResumeActionType('');
        }
    };

    const handleResumeDownload = async () => {
        if (isResumeProcessing) {
            return;
        }

        let progressInterval;
        let blobUrl = null;
        let fileName = 'resume.pdf';
        let shouldRevoke = false;

        try {
            setResumeActionType('download');
            setIsResumeProcessing(true);
            setIsResumeChooserOpen(false);
            setResumeDownloadPopupState('none');
            setResumeDownloadPopupState('progress');
            setResumeDownloadProgress(0);

            progressInterval = setInterval(() => {
                setResumeDownloadProgress((prev) => {
                    if (prev >= 85) {
                        return prev;
                    }
                    return prev + Math.random() * 12;
                });
            }, 150);

            const result = await resolveResumeFile();
            blobUrl = result.blobUrl;
            fileName = result.fileName || fileName;
            shouldRevoke = result.shouldRevoke;

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            if (progressInterval) {
                clearInterval(progressInterval);
            }
            setResumeDownloadProgress(100);
            setResumeDownloadPopupState('success');
            setTimeout(() => setResumeDownloadPopupState('none'), 2500);

            if (shouldRevoke && blobUrl) {
                setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
            }
        } catch (error) {
            console.error('Resume download failed:', error);
            if (progressInterval) {
                clearInterval(progressInterval);
            }
            if (shouldRevoke && blobUrl) {
                window.URL.revokeObjectURL(blobUrl);
            }
            setIsResumeChooserOpen(false);
            setResumeDownloadPopupState('failed');
            setTimeout(() => setResumeDownloadPopupState('none'), 3000);
        } finally {
            setIsResumeProcessing(false);
            setResumeActionType('');
        }
    };

    const handleCertificateOpen = () => {
        navigate(`/coo-student-certificates/${studentId}`, { state: { studentData } });
    };

    const populateFormFields = useCallback((data) => {
        if (!data) return;

        const normalized = {
            currentYear: data.currentYear,
            currentSemester: data.currentSemester,
            section: data.section,
            registerNumber: data.registerNumber,
            firstName: data.firstName,
            lastName: data.lastName,
            dob: data.dob,
            address: data.address,
            city: data.city,
            primaryEmail: data.primaryEmail,
            secondaryEmail: data.secondaryEmail,
            mobileNo: data.mobileNo,
            fatherMobile: data.fatherMobile,
            fatherOccupation: data.fatherOccupation,
            motherMobile: data.motherMobile,
            motherOccupation: data.motherOccupation,
            guardianName: data.guardianName,
            guardianMobile: data.guardianMobile,
            profilePicURL: data.profilePicURL || data.profilePhotoUrl,
            bloodGroup: data.bloodGroup,
            linkedinLink: data.linkedinLink,
            githubLink: data.githubLink,
            portfolioLink: data.portfolioLink,
        };

        const merged = { ...data, ...normalized };
        setStudentData(merged);
        const processedSkills = Array.isArray(merged.skills) ? merged.skills : parseMultiValue(merged.skillSet || '');
        setStudyCategory(merged.studyCategory || '12th');
        setCurrentYear(merged.currentYear ? String(merged.currentYear) : '');
        setCurrentSemester(merged.currentSemester ? String(merged.currentSemester) : '');
        setSelectedSection(merged.section ? String(merged.section) : '');
        setSkills(processedSkills);

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
        }

        setIsInitialLoading(false);
    }, []);

    const loadStudentData = useCallback(async () => {
        if (!studentId) return;

        try {
            setIsInitialLoading(true);
            // Clear stale student data immediately when switching records.
            setStudentData(null);
            setProfileImage(null);
            setDob(null);
            setSkills([]);
            setCurrentYear('');
            setCurrentSemester('');
            setSelectedSection('');
            setStudyCategory('12th');
            setShowAnalysis(false);
            console.log('Loading student data for ID:', studentId);

            // Try fastDataService first
            const data = await fastDataService.getStudentData(studentId);
            console.log('Loaded student data:', data);

            if (data) {
                populateFormFields(data);
            } else {
                // Fallback to mongoDBService if fastDataService fails
                const fallbackData = await mongoDBService.getStudentById(studentId);
                if (fallbackData) {
                    populateFormFields(fallbackData);
                } else {
                    setIsInitialLoading(false);
                }
            }
        } catch (error) {
            console.error('Error loading student data:', error);
            alert('Error loading student data. Please try again.');
            setIsInitialLoading(false);
        }
    }, [studentId, populateFormFields]);

    useEffect(() => {
        if (studentId) {
            loadStudentData();
        }
    }, [studentId, loadStudentData]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 600);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isInitialLoading) {
            return;
        }

        setLoadingProgress(15);
        const progressTimer = setInterval(() => {
            setLoadingProgress((prev) => (prev >= 90 ? 90 : prev + 8));
        }, 180);

        return () => clearInterval(progressTimer);
    }, [isInitialLoading]);

    const handleViewChange = (view) => {
        onViewChange(view);
        setIsSidebarOpen(false);
    };

    return (
        <div className={styles.container}>
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

            <div className={styles.main}>
                <Sidebar
                    isOpen={isSidebarOpen}
                    onLogout={onLogout}
                    currentView={'manage-students'}
                    onViewChange={handleViewChange}
                    studentData={studentData}
                />
                <div className={styles.dashboardArea}>
                    <div className={styles.viewOnlyContainer}>
                        {/* --- PERSONAL INFO --- */}
                        <div className={styles.profileSectionContainer}>
                            <h3 className={styles.sectionHeader}>Personal Information</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.field}>
                                    <label>Current Year</label>
                                    <select value={currentYear} disabled>
                                        <option value="" disabled>Current Year</option>
                                        <option value="I">I</option>
                                        <option value="II">II</option>
                                        <option value="III">III</option>
                                        <option value="IV">IV</option>
                                    </select>
                                </div>
                                <div className={styles.field}>
                                    <label>Current Semester</label>
                                    <select value={currentSemester} disabled>
                                        <option value="" disabled>{currentYear ? 'Current Semester' : 'Select Year First'}</option>
                                        {getAvailableSemesters(currentYear).map(sem => (
                                            <option key={sem} value={sem}>{sem}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.field}>
                                    <label>Section</label>
                                    <input type="text" value={selectedSection || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Register Number</label>
                                    <input type="text" value={studentData?.registerNumber || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>First Name</label>
                                    <input type="text" value={studentData?.firstName || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Last Name</label>
                                    <input type="text" value={studentData?.lastName || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Date of Birth</label>
                                    <input type="text" value={dob ? dob.toLocaleDateString() : ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Address</label>
                                    <input type="text" value={studentData?.address || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>City</label>
                                    <input type="text" value={studentData?.city || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Primary Email</label>
                                    <input type="email" value={studentData?.primaryEmail || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Secondary Email</label>
                                    <input type="email" value={studentData?.secondaryEmail || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Mobile No.</label>
                                    <div className={styles.mobileInputWrapper}>
                                        <div className={styles.countryCode}>+91</div>
                                        <input type="tel" value={studentData?.mobileNo || ''} readOnly className={styles.mobileNumberInput} />
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label>Father Occupation</label>
                                    <input type="text" value={studentData?.fatherOccupation || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Father Mobile No.</label>
                                    <div className={styles.mobileInputWrapper}>
                                        <div className={styles.countryCode}>+91</div>
                                        <input type="tel" value={studentData?.fatherMobile || ''} readOnly className={styles.mobileNumberInput} />
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label>Mother Occupation</label>
                                    <input type="text" value={studentData?.motherOccupation || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Mother Mobile No.</label>
                                    <div className={styles.mobileInputWrapper}>
                                        <div className={styles.countryCode}>+91</div>
                                        <input type="tel" value={studentData?.motherMobile || ''} readOnly className={styles.mobileNumberInput} />
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label>Guardian Name</label>
                                    <input type="text" value={studentData?.guardianName || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Guardian Mobile No.</label>
                                    <div className={styles.mobileInputWrapper}>
                                        <div className={styles.countryCode}>+91</div>
                                        <input type="tel" value={studentData?.guardianMobile || ''} readOnly className={styles.mobileNumberInput} />
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label>&nbsp;</label>
                                    <button type="button" className={styles.fieldButton} onClick={handleResumeOpen}>
                                        Resume
                                    </button>
                                </div>
                                <div className={styles.field}>
                                    <label>&nbsp;</label>
                                    <button type="button" className={styles.fieldButton} onClick={handleCertificateOpen}>
                                        Certificate
                                    </button>
                                </div>

                                {/* Profile Image Section - View Only */}
                                <div className={styles.field} style={{ gridColumn: 'span 2' }}>
                                    <label>Profile Photo</label>
                                    <div className={styles.imageUploadContainer}>
                                        {profileImage ? (
                                            <div className={styles.imagePreviewContainer}>
                                                <img src={profileImage} alt="Profile" className={styles.profileImagePreview} />
                                            </div>
                                        ) : (
                                            <div className={styles.noImagePlaceholder}>
                                                <img src={Adminicons} alt="No Profile" className={styles.placeholderIcon} />
                                                <span>No profile photo</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.field}>
                                    <label>Blood Group</label>
                                    <input type="text" value={studentData?.bloodGroup || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>LinkedIn Link</label>
                                    <input type="url" value={studentData?.linkedinLink || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>GitHub Link</label>
                                    <input type="url" value={studentData?.githubLink || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Portfolio Link</label>
                                    <input type="url" value={studentData?.portfolioLink || ''} readOnly />
                                </div>
                            </div>
                        </div>

                        {(studentTrainingAssignment || studentTrainingAttendanceRecords.length > 0) && (
                            <div className={styles.profileSectionContainer}>
                                <h3 className={styles.sectionHeader}>Training</h3>
                                <div className={styles.companyStatsGrid}>
                                    <div className={styles.companyStatCardEmpty}>
                                        <span className={styles.companyStatLabel}>Training 1</span>
                                        <span className={styles.companyStatValueEmpty}>{trainingCardStats.courseName}</span>
                                    </div>
                                    <div className={styles.companyStatCard}>
                                        <span className={styles.companyStatLabel}>Attendance Percentage</span>
                                        <span className={styles.companyStatValue}>{trainingCardStats.attendancePercentage}%</span>
                                    </div>
                                    <div className={styles.companyStatCard}>
                                        <span className={styles.companyStatLabel}>Total Training Days</span>
                                        <span className={styles.companyStatValue}>{trainingCardStats.totalTrainingDays}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- COMPANY DETAILS --- */}
                        <div className={styles.profileSectionContainer}>
                            <h3 className={styles.sectionHeader}>Company Details</h3>
                            <div className={styles.companyStatsGrid}>
                                <div className={styles.companyStatCard}>
                                    <span className={styles.companyStatLabel}>#Total Companies Attended</span>
                                    <span className={styles.companyStatValue}>{companyStats.totalCompaniesAttended}</span>
                                </div>
                                <div className={styles.companyStatCard}>
                                    <span className={styles.companyStatLabel}>#Total Drive Attended</span>
                                    <span className={styles.companyStatValue}>{companyStats.totalDrivesAttended}</span>
                                </div>
                                <div className={styles.companyStatCard}>
                                    <span className={styles.companyStatLabel}>#Shortlisted Count</span>
                                    <span className={styles.companyStatValue}>{companyStats.shortlistedCount}</span>
                                </div>
                                <div className={styles.companyStatCard}>
                                    <span className={styles.companyStatLabel}>#Preferred Mode of Drive</span>
                                    <span className={styles.companyStatValue}>{companyStats.preferredModeOfDrive}</span>
                                </div>
                                <div className={styles.companyStatCardEmpty}>
                                    <span className={styles.companyStatLabel}>#Last Drive Attended</span>
                                    <span className={styles.companyStatValueEmpty}>{companyStats.lastDriveAttended}</span>
                                </div>
                                <div className={styles.companyStatCardEmpty}>
                                    <span className={styles.companyStatLabel}>#Last Drive Result</span>
                                    <span className={styles.companyStatValueEmpty}>{companyStats.lastDriveResult}</span>
                                </div>
                            </div>
                            <div className={styles.companyBottomRow}>
                                <div className={styles.successRateWrapper}>
                                    <div className={styles.successRateCircleContainer}>
                                        <svg className={styles.successRateSvg} viewBox="0 0 120 120">
                                            <circle cx="60" cy="60" r="50" fill="none" stroke="#e8e8e8" strokeWidth="10" />
                                            <circle
                                                cx="60" cy="60" r="50" fill="none"
                                                stroke="#B84349"
                                                strokeWidth="10"
                                                strokeLinecap="round"
                                                strokeDasharray="314.16"
                                                strokeDashoffset={314.16 * (1 - successRate / 100)}
                                                transform="rotate(-90 60 60)"
                                                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                                            />
                                        </svg>
                                        <div className={styles.successRateInner}>
                                            <span className={styles.successRateLabel}>Success Rate %</span>
                                            <span className={styles.successRateNum}>{successRate}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.performanceInsightsCard}>
                                    <h4 className={styles.insightsTitle}>Top performance Insights</h4>
                                    <div className={styles.insightRow}>
                                        <span className={styles.insightLabel}>Highest Package Drive :</span>
                                        <span className={styles.insightValue}>{companyStats.highestPackageDrive} LPA</span>
                                    </div>
                                    <div className={styles.insightRow}>
                                        <span className={styles.insightLabel}>Total Rounds Cleared :</span>
                                        <span className={styles.insightValue}>{companyStats.totalRoundsCleared}</span>
                                    </div>
                                </div>
                                <div className={styles.viewAnalysisButtonWrapper}>
                                    <button
                                        className={styles.viewAnalysisBtn}
                                        onClick={() => setShowAnalysis(!showAnalysis)}
                                    >
                                        {showAnalysis ? 'Hide Analysis' : 'View Analysis'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* --- SKILLS --- */}
                        <div className={styles.profileSectionContainer}>
                            <h3 className={styles.sectionHeader}>Skills</h3>
                            <div className={styles.skillsContainer}>
                                <div className={styles.skillsList}>
                                    {skills.length > 0 ? skills.map((skill, index) => (
                                        <div key={index} className={styles.skillItem}>
                                            <input
                                                type="text"
                                                value={skill}
                                                readOnly
                                                placeholder={`Skill ${index + 1}`}
                                            />
                                        </div>
                                    )) : (
                                        <div className={styles.noSkillsMessage}>No skills added</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* --- OTHER DETAILS --- */}
                        <div className={styles.profileSectionContainer}>
                            <h3 className={styles.sectionHeader}>Other Details</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.field}>
                                    <label>Residential Status</label>
                                    <select value={studentData?.residentialStatus || ''} disabled>
                                        <option value="" disabled>Residential status</option>
                                        <option value="rural">Rural</option>
                                        <option value="urban">Urban</option>
                                    </select>
                                </div>
                                <div className={styles.field}>
                                    <label>Languages Known</label>
                                    <input type="text" value={studentData?.languagesKnown || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Passport No.</label>
                                    <input type="text" value={studentData?.passportNo || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Skill Set</label>
                                    <input type="text" value={studentData?.skillSet || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Value Added Courses</label>
                                    <input type="text" value={studentData?.valueAddedCourses || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>About Sibling</label>
                                    <input type="text" value={studentData?.aboutSibling || ''} readOnly />
                                </div>
                                <div className={styles.field}>
                                    <label>Student ID</label>
                                    <input type="text" value={studentData?.studentId || ''} readOnly className={styles.readOnlyInput} />
                                </div>
                                <div className={styles.field}>
                                    <label>Family Annual Income</label>
                                    <input type="text" value={studentData?.familyAnnualIncome || ''} readOnly />
                                </div>
                            </div>
                        </div>

                        {/* --- PREFERENCE DETAILS --- */}
                        <div className={styles.profileSectionContainer}>
                            <h3 className={styles.sectionHeader}>Preference Details</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.field}>
                                    <label>Company Types</label>
                                    <div className={styles.checkboxGroup}>
                                        {COMPANY_TYPE_OPTIONS.map((option) => (
                                            <label key={option}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCompanyTypes.includes(option)}
                                                    disabled
                                                />
                                                <span>{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label>Preferred Job Location</label>
                                    <div className={styles.checkboxGroup}>
                                        {JOB_LOCATION_OPTIONS.map((option) => (
                                            <label key={option}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedJobLocations.includes(option)}
                                                    disabled
                                                />
                                                <span>{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className={styles.field}>
                                    <label>Preferred Training</label>
                                    <div className={styles.checkboxGroup}>
                                        {PREFERRED_TRAINING_OPTIONS.map((option) => (
                                            <label key={option}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTrainings.includes(option)}
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
                    </div>
                </div>
            </div>
            {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>}
            <ResumeChooserModal
                isOpen={isResumeChooserOpen}
                onClose={closeResumePopup}
                onView={handleResumeView}
                onDownload={handleResumeDownload}
                isProcessing={isResumeProcessing}
                activeAction={resumeActionType}
            />
            <PreviewProgressAlert
                isOpen={resumePreviewPopupState === 'progress'}
                progress={resumePreviewProgress}
                fileLabel="resume"
                color="#D23B42"
                progressColor="#D23B42"
            />
            <PreviewFailedAlert
                isOpen={resumePreviewPopupState === 'failed'}
                onClose={() => setResumePreviewPopupState('none')}
                color="#D23B42"
            />
            <CertificateDownloadProgressAlert
                isOpen={resumeDownloadPopupState === 'progress'}
                progress={resumeDownloadProgress}
                fileLabel="resume"
                color="#D23B42"
                progressColor="#D23B42"
            />
            <CertificateDownloadSuccessAlert
                isOpen={resumeDownloadPopupState === 'success'}
                onClose={() => setResumeDownloadPopupState('none')}
                fileLabel="resume"
                color="#D23B42"
            />
            <ActionDownloadFailedAlert
                isOpen={resumeDownloadPopupState === 'failed'}
                onClose={() => setResumeDownloadPopupState('none')}
                color="#D23B42"
            />
            <CertificateDownloadProgressAlert
                isOpen={isInitialLoading}
                progress={loadingProgress}
                fileLabel="student profile"
                title="Loading..."
                color="#D23B42"
                progressColor="#D23B42"
                messages={{
                    initial: 'Fetching student profile...',
                    mid: 'Loading latest record...',
                    final: 'Preparing page...'
                }}
            />
        </div>
    );
}

export default Coo_ManageStudentView;