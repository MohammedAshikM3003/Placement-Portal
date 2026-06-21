import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import styles from './Coo_ManageStudents.module.css';
import achStyles from '../StudentPages/Achievements.module.css';
import Adminicon from "../assets/Adminicon.png";
import mongoDBService from "../services/mongoDBService.jsx";
import { createBlockNotifications } from '../services/blockNotificationService.jsx';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

// IMPORTS for Export Functionality
import * as XLSX from 'xlsx';
// ✅ FIX APPLIED HERE: Using default import for jspdf
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const cx = (...classNames) => classNames.filter(Boolean).join(' ');

const YEAR_OPTIONS = ['I', 'II', 'III', 'IV'];
const SEM_OPTIONS_BY_YEAR = {
    I: ['I', 'II'],
    II: ['III', 'IV'],
    III: ['V', 'VI'],
    IV: ['VII', 'VIII'],
};

const normalizeYearRoman = (value) => {
    const raw = (value ?? '').toString().trim().toUpperCase();
    if (!raw) return '';
    if (YEAR_OPTIONS.includes(raw)) return raw;
    const asNum = Number.parseInt(raw, 10);
    if (asNum === 1) return 'I';
    if (asNum === 2) return 'II';
    if (asNum === 3) return 'III';
    if (asNum === 4) return 'IV';
    return raw;
};

const normalizeSemRoman = (value) => {
    const raw = (value ?? '').toString().trim().toUpperCase();
    if (!raw) return '';
    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    if (roman.includes(raw)) return raw;
    const asNum = Number.parseInt(raw, 10);
    if (Number.isFinite(asNum) && asNum >= 1 && asNum <= 8) return roman[asNum - 1];
    return raw;
};

const AI_EXTRA_COLUMNS = {
    driveCount: {
        label: 'Drives Attended',
        value: (student) => Number(student.driveCount || 0),
    },
    lastDriveDate: {
        label: 'Last Drive',
        value: (student) => (student.lastDriveDate ? new Date(student.lastDriveDate).toLocaleDateString() : '-'),
    },
    blocked: {
        label: 'Blocked',
        value: (student) => (student.blocked ? 'Yes' : 'No'),
    },
    cgpa: {
        label: 'CGPA',
        value: (student) => student.cgpa || '-',
    },
    skills: {
        label: 'Skills',
        value: (student) => {
            const skills = student.skills || '';
            return skills.length > 30 ? skills.substring(0, 30) + '...' : (skills || '-');
        },
    },
    backlogs: {
        label: 'Backlogs',
        value: (student) => student.backlogs || '0',
    },
    tenthPercentage: {
        label: '10th %',
        value: (student) => student.tenthPercentage || '-',
    },
    twelfthPercentage: {
        label: '12th %',
        value: (student) => student.twelfthPercentage || '-',
    },
    placementStatus: {
        label: 'Placement',
        value: (student) => student.isPlaced ? 'Placed' : 'Not Placed',
        render: (student) => (
            <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: student.isPlaced ? '#d4edda' : '#fff3cd',
                color: student.isPlaced ? '#155724' : '#856404',
            }}>
                {student.isPlaced ? 'Placed' : 'Not Placed'}
            </span>
        ),
    },
    placedCompany: {
        label: 'Company',
        value: (student) => student.placedCompany || '-',
    },
    package: {
        label: 'Package',
        value: (student) => student.package || '-',
    },
    eligibleDrives: {
        label: 'Eligible Drives',
        value: (student) => Number(student.eligibleDriveCount || 0),
    },
    firstGraduate: {
        label: 'First Graduate',
        value: (student) => student.firstGraduate || '-',
    },
    willingToSignBond: {
        label: 'Willing to Bond',
        value: (student) => student.willingToSignBond || '-',
    },
    residentialStatus: {
        label: 'Residential Status',
        value: (student) => student.residentialStatus || '-',
    },
    quota: {
        label: 'Quota',
        value: (student) => student.quota || '-',
    },
    preferredModeOfDrive: {
        label: 'Pref. Mode',
        value: (student) => student.preferredModeOfDrive || '-',
    },
    hasProfilePic: {
        label: 'Photo Uploaded',
        value: (student) => student.profilePicURL ? 'Yes' : 'No',
        render: (student) => (
            <span style={{
                padding: '4px 8px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                backgroundColor: student.profilePicURL ? '#d4edda' : '#f8d7da',
                color: student.profilePicURL ? '#155724' : '#721c24',
            }}>
                {student.profilePicURL ? 'Yes' : 'No'}
            </span>
        ),
    },
};

const readStoredCoordinatorData = () => {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem('coordinatorData');
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error('Failed to parse coordinatorData from storage:', error);
        return null;
    }
};

const normalizeId = (val) => {
    if (!val) return '';
    if (typeof val === 'object') {
        if (val.$oid) return val.$oid;
        if (val.oid) return val.oid;
    }
    const str = val.toString ? val.toString() : '';
    return str && str !== '[object Object]' ? str : '';
};

const resolveCoordinatorDepartment = (data) => {
    if (!data) return null;
    const deptValue =
        data.department ||
        data.branch ||
        data.dept ||
        data.departmentName ||
        data.coordinatorDepartment ||
        data.assignedDepartment;
    return deptValue ? deptValue.toString().toUpperCase() : null;
};

// Simple icon components using inline SVG
const GradCapIcon = () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3e8ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
    </svg>
);

// --- START: UPDATED ICON COMPONENTS ---
const CheckIcon = () => (
    <span className={styles["co-ms-resume-uploaded"]}>
        <svg width="20" height="20" viewBox="0 0 24 24" 
            fill="currentColor" // Use currentColor (Green) from CSS class
            stroke="none"> 
            {/* Solid Checkmark Path (filled) */}
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
    </span>
);

const CrossIcon = () => (
    <span className={styles["co-ms-resume-not-uploaded"]}>
        <svg width="20" height="20" viewBox="0 0 24 24" 
            fill="currentColor" // Use currentColor (Red) from CSS class
            stroke="none">
            {/* Solid Close/Cross Path (filled) */}
            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41z"/>
        </svg>
    </span>
);
// --- END: UPDATED ICON COMPONENTS ---


const EyeIcon = () => (
    <svg className={styles["co-ms-profile-eye-icon"]} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const DeleteWarningPopup = ({ isOpen, onBack, onConfirm, isProcessing, selectedCount = 0 }) => {
    if (!isOpen) return null;
    return (
        <div className={styles["co-ms-StuProfile-popup-overlay"]}>
            <div className={styles["co-ms-StuProfile-popup-container"]}>
                <div className={cx(styles["co-ms-StuProfile-popup-header"], styles["delete-warning-header"])}>Warning !</div>
                <div className={styles["co-ms-StuProfile-popup-body"]}>
                    <div className={styles["co-ms-StuProfile-warning-icon"]} >
                       {/* RESTORED: Exclamation Mark Icon for Warning */}
                    <svg className={styles["co-ms-StuProfile-warning-icon"]} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className={styles["co-ms-StuProfile-warning-icon--circle"]} cx="26" cy="26" r="25" fill="none"/>
                        {/* This path creates the vertical line and the dot (exclamatory mark) */}
                        <path className={styles["co-ms-StuProfile-warning-icon--exclamation"]} fill="none" d="M26 16v12M26 34v2"/>
                        </svg>
                    </div>
                    <h2>Are you sure?</h2>
                    <p>Delete {selectedCount} selected student{selectedCount > 1 ? 's' : ''}?</p>
                </div>
                <div className={styles["co-ms-StuProfile-popup-footer"]}>
                    <button onClick={onBack} className={styles["co-ms-StuProfile-popup-back-btn"]}>Discard</button>
                    <button
                        onClick={onConfirm}
                        className={styles["co-ms-StuProfile-popup-confirm-btn"]}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Deleting…' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};
// --- NEW: Student Deleted Popup Component ---
// --- UPDATED: Student Deleted Popup Component (New Icon) ---
const StudentDeletedPopup = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className={styles["co-ms-StuProfile-popup-overlay"]}>
            <div className={styles["co-ms-StuProfile-popup-container"]}>
                <div className={cx(styles["co-ms-StuProfile-popup-header"], styles["delete-success-header"])}>Deleted !</div>
                <div className={styles["co-ms-StuProfile-popup-body"]}>
                    {/* NEW: Achievement-style Delete Success Icon */}
                    <svg className={styles["co-ms-StuProfile-delete-icon"]} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className={styles["co-ms-StuProfile-delete-icon--circle"]} cx="26" cy="26" r="25" fill="none"/>
                        <g className={styles["co-ms-StuProfile-delete-icon--bin"]} fill="none" strokeWidth="2">
                            <path d="M16 20l20 0M18 20l0 16c0 1 1 2 2 2l12 0c1 0 2-1 2-2l0-16M21 20l0-3c0-1 1-2 2-2l6 0c1 0 2 1 2 2l0 3M23 25l0 8M26 25l0 8M29 25l0 8"/>
                        </g>
                    </svg>
                    <h2>Student Deleted ✓</h2>
                    <p>The selected Student</p>
                    <p>has been Deleted Successfully!</p>
                </div>
                <div className={styles["co-ms-StuProfile-popup-footer"]}>
                    <button onClick={onClose} className={styles["co-ms-StuProfile-popup-close-btn"]}>Close</button>
                </div>
            </div>
        </div>
    );
};

// --- NEW: Blocked Popup Component ---
const BlockedPopup = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className={styles["co-ms-StuProfile-popup-overlay"]}>
            <div className={styles["co-ms-StuProfile-popup-container"]}>
                <div className={cx(styles["co-ms-StuProfile-popup-header"], styles["block-popup-header"])}>Blocked !</div>
                <div className={styles["co-ms-StuProfile-popup-body"]}>
                    <div className={achStyles['Achievement-status-icon']}>
                        <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <circle cx="36" cy="36" r="24" stroke="#D23B42" strokeWidth="6" fill="none" strokeLinecap="round" />
                            <line x1="22" y1="22" x2="50" y2="50" stroke="#D23B42" strokeWidth="6" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h2 className={achStyles['Achievement-status-title']}>Student Blocked ✓</h2>
                    <p className={achStyles['Achievement-status-text']}>The selected Student has been Blocked Successfully!</p>
                </div>
                <div className={styles["co-ms-StuProfile-popup-footer"]}>
                    <button onClick={onClose} className={styles["co-ms-StuProfile-popup-close-btn"]}>Close</button>
                </div>
            </div>
        </div>
    );
};

// --- NEW: Unblocked Popup Component ---
const UnblockedPopup = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className={styles["co-ms-StuProfile-popup-overlay"]}>
            <div className={styles["co-ms-StuProfile-popup-container"]}>
                <div className={cx(styles["co-ms-StuProfile-popup-header"], styles["unblock-popup-header"])}>Unblocked !</div>
                <div className={styles["co-ms-StuProfile-popup-body"]}>
                    <div className={achStyles['Achievement-status-icon']}>
                        <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <circle cx="36" cy="36" r="24" stroke="#D2AF3B" strokeWidth="6" fill="none" strokeLinecap="round" />
                            <line x1="22" y1="50" x2="31" y2="41" stroke="#D2AF3B" strokeWidth="6" strokeLinecap="round" />
                            <line x1="41" y1="31" x2="50" y2="22" stroke="#D2AF3B" strokeWidth="6" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h2 className={achStyles['Achievement-status-title']}>Student Unblocked ✓</h2>
                    <p className={achStyles['Achievement-status-text']}>The selected Student has been Unblocked Successfully!</p>
                </div>
                <div className={styles["co-ms-StuProfile-popup-footer"]}>
                    <button onClick={onClose} className={styles["co-ms-StuProfile-popup-close-btn"]}>Close</button>
                </div>
            </div>
        </div>
    );
};


function Comanagestud({ onLogout, currentView, onViewChange  }) {
    useCoordinatorAuth(); // JWT authentication verification
    const navigate = useNavigate();
    const [coordinatorData, setCoordinatorData] = useState(() => readStoredCoordinatorData());
    const coordinatorDepartment = useMemo(
        () => resolveCoordinatorDepartment(coordinatorData) || 'CSE',
        [coordinatorData]
    );

    useEffect(() => {
        if (typeof document === 'undefined') return;
        document.body.classList.add('co-ms-hide-scroll');
        return () => {
            document.body.classList.remove('co-ms-hide-scroll');
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const fetchCoordinatorDetails = async () => {
            if (typeof window === 'undefined') return;

            let storedData = readStoredCoordinatorData();

            if (isMounted && storedData) {
                setCoordinatorData(prev => prev || storedData);
            }

            const coordinatorId =
                storedData?.coordinatorId ||
                storedData?._id ||
                storedData?.id ||
                (typeof window !== 'undefined' ? localStorage.getItem('coordinatorId') : null);

            if (!coordinatorId) {
                return;
            }

            try {
                const response = await mongoDBService.getCoordinatorById(coordinatorId);
                if (!isMounted || !response) return;

                const normalized = response?.coordinator || response;
                if (!normalized) return;

                storedData = {
                    ...(storedData || {}),
                    ...normalized,
                    coordinatorId
                };

                const normalizedDepartment = resolveCoordinatorDepartment(storedData);
                const mergedCoordinatorData = {
                    ...storedData,
                    department: normalizedDepartment,
                    branch: normalizedDepartment || storedData.branch
                };

                setCoordinatorData(mergedCoordinatorData);

                try {
                    localStorage.setItem('coordinatorData', JSON.stringify(mergedCoordinatorData));
                } catch (storageError) {
                    console.error('Failed to persist coordinator data:', storageError);
                }
            } catch (error) {
                console.error('Failed to fetch coordinator details:', error);
            }
        };

        fetchCoordinatorDetails();

        return () => {
            isMounted = false;
        };
    }, []);
    
    // ACTIVE FILTER STATES (only change on button click)
    const handleCardClick = (newView) => {
        if (onViewChange) {
            onViewChange(newView);
        }
    };
    
    const [filterDept, setFilterDept] = useState(coordinatorDepartment);
    const [filterBatch, setFilterBatch] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterSem, setFilterSem] = useState('');
    const [filterSection, setFilterSection] = useState('');
    
    // DROPDOWN SELECTION STATES (change instantly as user selects)
    // MODIFICATION 2: Removed selectedDept state
    const [selectedBatch, setSelectedBatch] = useState(''); // active value used by filtering: "YYYY-YYYY"
    const [selectedBatchStart, setSelectedBatchStart] = useState('');
    const [selectedBatchEnd, setSelectedBatchEnd] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedSem, setSelectedSem] = useState('');
    const [selectedSection, setSelectedSection] = useState('');

    useEffect(() => {
        setFilterDept(coordinatorDepartment);
    }, [coordinatorDepartment]);

    // Search can be either Name or Reg No
    const [filterSearch, setFilterSearch] = useState('');
    const [selectedSearch, setSelectedSearch] = useState('');

    // 1. ADD NEW POPUP STATES
    const [isDeleteWarningOpen, setDeleteWarningOpen] = useState(false); // New state for delete warning
    const [isStudentDeletedPopupOpen, setStudentDeletedPopupOpen] = useState(false);
    // Removed isStudentBlocked as it's not a general popup state.
    const [isBlockedPopupOpen, setIsBlockedPopupOpen] = useState(false);
    const [isUnblockedPopupOpen, setIsUnblockedPopupOpen] = useState(false); // State for Unblock success popup
    const [blockInProgress, setBlockInProgress] = useState(false);
    const [unblockInProgress, setUnblockInProgress] = useState(false);
    const [deleteInProgress, setDeleteInProgress] = useState(false);
    const [actionError, setActionError] = useState(null);

    
    // 2. Add state to track export menu visibility
    const [showExportMenu, setShowExportMenu] = useState(false);

    const [exportPopupState, setExportPopupState] = useState('none'); // 'none' | 'progress' | 'success' | 'failed'
    const [exportProgress, setExportProgress] = useState(0);
    const [exportType, setExportType] = useState('Excel');
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [viewBlocklist, setViewBlocklist] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());

    // AI Filter state variables
    const [isAIFilterMode, setIsAIFilterMode] = useState(false);
    const [aiFilterText, setAiFilterText] = useState('');
    const [aiFilteredStudents, setAiFilteredStudents] = useState([]);
    const [aiFilterColumns, setAiFilterColumns] = useState([]);
    const [aiFilterActive, setAiFilterActive] = useState(false);
    const [aiFilterLoading, setAiFilterLoading] = useState(false);
    const [aiFilterReason, setAiFilterReason] = useState('');
    const [aiTooltip, setAiTooltip] = useState({ visible: false, x: 0, y: 0 });

    const mapStudentRecord = useCallback(
        (student) => {
            if (!student) return null;

            const firstName = student.firstName || student.firstname || '';
            const lastName = student.lastName || student.lastname || '';
            const fallbackName = student.name || student.fullName || student.studentName || '';
            const composedName = `${firstName} ${lastName}`.trim();
            const name = composedName || fallbackName;

            const departmentRaw = student.department || student.branch || student.degree || coordinatorDepartment || '';
            const batch = student.batch || student.year || student.academicYear || '';
            const section = student.section || student.Section || student.classSection || student.sectionName || '';
            const currentYear = student.currentYear || student.currentyear || student.yearOfStudy || student.year || '';
            const currentSemester = student.currentSemester || student.currentsemester || student.semester || student.sem || '';
            const phone = student.phone || student.mobile || student.phoneNo || student.mobileNo || student.primaryPhone || student.contactNumber || '';
            const profilePicURL =
                student.profilePicURL ||
                student.profilepicurl ||
                student.profilePhoto ||
                student.profilePhotoUrl ||
                student.photoURL ||
                student.photo ||
                student.image || '';

            const resume = student.resume ?? !!(student.resumeURL || student.resumeData);
            const placement = student.placement || '';
            const blockedValue = student.isBlocked ?? student.blocked ?? false;

            const normalizedId = normalizeId(student._id || student.id) || (student.regNo || student.registrationNumber || '').toString();

            return {
                id: normalizedId,
                regNo: (student.regNo || student.registrationNumber || '').toString(),
                name: name.toString(),
                department: departmentRaw.toString(),
                batch: batch.toString(),
                section: section.toString(),
                currentYear: currentYear?.toString?.() || '',
                currentSemester: currentSemester?.toString?.() || '',
                phone: phone.toString(),
                profilePicURL,
                resume: Boolean(resume),
                placement,
                blocked: Boolean(blockedValue),
                // Attendance data
                driveCount: Number(student.driveCount || 0),
                lastDriveDate: student.lastDriveDate || '',
                attendedCompanies: student.attendedCompanies || [],
                attendedRoles: student.attendedRoles || [],
                // Academic data
                cgpa: student.cgpa || student.overallCGPA || '',
                skills: student.skills || student.skillSet || '',
                backlogs: student.backlogs || student.currentBacklogs || '0',
                tenthPercentage: student.tenthPercentage || '',
                twelfthPercentage: student.twelfthPercentage || '',
                gender: student.gender || '',
                city: student.city || '',
                firstGraduate: student.firstGraduate || '',
                willingToSignBond: student.willingToSignBond || '',
                residentialStatus: student.residentialStatus || '',
                quota: student.quota || '',
                preferredModeOfDrive: student.preferredModeOfDrive || '',
                // Placement data
                isPlaced: Boolean(student.isPlaced),
                placedCompany: student.placedCompany || '',
                placedRole: student.placedRole || '',
                package: student.package || '',
                placedDate: student.placedDate || '',
                // Eligibility data
                eligibleDriveCount: Number(student.eligibleDriveCount || 0),
                eligibleCompanies: student.eligibleCompanies || [],
            };
        },
        [coordinatorDepartment]
    );

    const publishBlockNotifications = useCallback(async (actionType, selectedRecords) => {
        if (!Array.isArray(selectedRecords) || !selectedRecords.length) return;

        const coordinatorData = readStoredCoordinatorData();
        const coordinatorName =
            `${coordinatorData?.firstName || ''} ${coordinatorData?.lastName || ''}`.trim() ||
            coordinatorData?.fullName ||
            coordinatorData?.username ||
            'Coordinator';
        const coordinatorIdentifier =
            coordinatorData?.coordinatorId ||
            coordinatorData?.username ||
            localStorage.getItem('coordinatorId') ||
            coordinatorName;

        try {
            await createBlockNotifications({
                targetRole: 'admin',
                actionType,
                actor: {
                    role: 'coordinator',
                    name: coordinatorName,
                    identifier: coordinatorIdentifier
                },
                students: selectedRecords.map((student) => ({
                    studentId: student.studentId || student.id || student._id || '',
                    regNo: student.regNo || '',
                    studentName: student.name || '',
                    branch: student.department || student.branch || coordinatorDepartment || '',
                    year: student.currentYear || student.year || '',
                    semester: student.currentSemester || student.sem || ''
                }))
            });

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('blockNotificationsUpdated', {
                    detail: { targetRole: 'admin', actionType }
                }));
            }
        } catch (error) {
            console.warn('⚠️ Failed to publish coordinator block notification:', error);
        }
    }, [coordinatorDepartment]);

    // Function to apply filters from dropdowns and switch to main view
    const applyFilters = () => {
        // filterDept is already defaulted to 'CSE' and does not need to be updated from a selection state
        setFilterBatch(selectedBatch);
        setFilterYear(selectedYear);
        setFilterSem(selectedSem);
        setFilterSection(selectedSection);
        
        setFilterSearch(selectedSearch.trim());
        setAiFilterActive(false);

        setViewBlocklist(false);
    };

    const handleToggleFilterMode = () => {
        setViewBlocklist(false);
        setIsAIFilterMode(prev => !prev);
    };

    const handleApplyAIFilter = () => {
        const prompt = aiFilterText.trim();
        if (!prompt) {
            return;
        }

        setViewBlocklist(false);
        setAiFilterLoading(true);
        setAiFilterReason('');

        mongoDBService.aiFilterStudents(prompt)
            .then((response) => {
                const mappedStudents = (Array.isArray(response?.students) ? response.students : [])
                    .map((student) => mapStudentRecord(student))
                    .filter(Boolean);
                setAiFilteredStudents(mappedStudents);
                setAiFilterColumns(Array.isArray(response?.columns) ? response.columns.filter((column) => AI_EXTRA_COLUMNS[column]) : []);
                setAiFilterActive(true);
                setAiFilterReason(response?.reason || '');
            })
            .catch((error) => {
                console.error('AI filter failed:', error);
                alert(error.message || 'AI filter failed. Please make sure the local AI service is running and try again.');
                setAiFilteredStudents([]);
                setAiFilterColumns([]);
                setAiFilterActive(false);
                setAiFilterReason('');
            })
            .finally(() => {
                setAiFilterLoading(false);
            });
    };

    const handleDiscardAIFilter = () => {
        setAiFilterText('');
        setAiFilteredStudents([]);
        setAiFilterColumns([]);
        setAiFilterActive(false);
        setAiFilterReason('');
    };

    const handleAiTooltipMove = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setAiTooltip({
            visible: true,
            x: rect.left + (rect.width / 2),
            y: rect.bottom + 10,
        });
    };

    const handleAiTooltipLeave = () => {
        setAiTooltip(prev => (prev.visible ? { ...prev, visible: false } : prev));
    };

    const handleStudentSelect = (id) => {
        setSelectedStudentIds(prevIds => {
            const newIds = new Set(prevIds);
            if (newIds.has(id)) {
                newIds.delete(id);
            } else {
                newIds.add(id);
            }
            return newIds;
        });
    };

    const activeStudentSource = aiFilterActive ? aiFilteredStudents : students;
    
    const selectedStudents = useMemo(() => {
        if (!selectedStudentIds.size) return [];
        const selectedIds = new Set(selectedStudentIds);
        return activeStudentSource.filter(student => selectedIds.has(student.id));
    }, [activeStudentSource, selectedStudentIds]);

    const hasBlockedSelection = selectedStudents.some(student => student.blocked);
    const hasUnblockedSelection = selectedStudents.some(student => !student.blocked);
    const isStudentSelected = selectedStudentIds.size > 0;

    // 2. UPDATED handleBlock to show BlockedPopup with coordinator information
    const handleBlock = async () => {
        if (!selectedStudentIds.size || blockInProgress) return;
        const ids = Array.from(selectedStudentIds);
        setBlockInProgress(true);
        setActionError(null);

        try {
            // Get coordinator data to store who blocked the student
            const coordinatorData = readStoredCoordinatorData();
            const blockedByName = coordinatorData 
                ? `${coordinatorData.firstName || ''} ${coordinatorData.lastName || ''}`.trim()
                : 'Placement Office';
            const blockerCabin = coordinatorData?.cabin || 'N/A';
            const blockerIdentifier = coordinatorData?.coordinatorId || coordinatorData?.username || blockedByName;
            
            await Promise.all(ids.map(id => mongoDBService.updateStudent(id, { 
                blocked: true, 
                isBlocked: true,
                blockedBy: blockedByName,
                blockedByRole: 'coordinator',
                blockedByCabin: blockerCabin,
                blockedByIdentifier: blockerIdentifier,
                blockedAt: new Date().toISOString(),
                blockedReason: 'Your account has been blocked by the placement coordinator. Please contact the placement office for more information.'
            })));

            await publishBlockNotifications('blocked', ids.map(id => activeStudentSource.find(student => student.id === id)).filter(Boolean));
            setStudents(prev => prev.map(student => ids.includes(student.id) ? { ...student, blocked: true } : student));
            if (aiFilterActive) {
                setAiFilteredStudents(prev => prev.map(student => ids.includes(student.id) ? { ...student, blocked: true } : student));
            }
            setSelectedStudentIds(new Set());
            setIsBlockedPopupOpen(true);
        } catch (error) {
            console.error('Failed to block students:', error);
            setActionError(error.message || 'Failed to block student(s). Please try again.');
        } finally {
            setBlockInProgress(false);
        }
    };

    
    // 3. UPDATED handleUnblock to show UnblockedPopup
    const handleUnblock = async () => {
        if (!selectedStudentIds.size || unblockInProgress) return;
        const ids = Array.from(selectedStudentIds);
        setUnblockInProgress(true);
        setActionError(null);

        try {
            await Promise.all(ids.map(id => mongoDBService.updateStudent(id, { blocked: false, isBlocked: false })));
            
            // 🔄 FIXED: Clear fastDataService cache for unblocked students
            // This ensures they get fresh data when they login
            try {
                const fastDataService = (await import('../services/fastDataService.jsx')).default;
                ids.forEach(id => {
                    console.log(`🧹 Clearing cache for unblocked student: ${id}`);
                    fastDataService.clearCache(id);
                });
            } catch (cacheErr) {
                console.warn('⚠️ Could not clear fastDataService cache:', cacheErr);
                // Non-critical error, continue
            }

            await publishBlockNotifications('unblocked', ids.map(id => activeStudentSource.find(student => student.id === id)).filter(Boolean));
            
            setStudents(prev => prev.map(student => ids.includes(student.id) ? { ...student, blocked: false } : student));
            if (aiFilterActive) {
                setAiFilteredStudents(prev => prev.map(student => ids.includes(student.id) ? { ...student, blocked: false } : student));
            }
            setSelectedStudentIds(new Set());
            setIsUnblockedPopupOpen(true);
        } catch (error) {
            console.error('Failed to unblock students:', error);
            setActionError(error.message || 'Failed to unblock student(s). Please try again.');
        } finally {
            setUnblockInProgress(false);
        }
    };

    // 4. FUNCTION to open delete warning popup
    const handleOpenDeleteWarning = () => {
        if (selectedStudentIds.size > 0) {
            setActionError(null);
            setDeleteWarningOpen(true);
        }
    };
    
    // 5. FUNCTION to confirm deletion and show success popup
    const handleConfirmDelete = async () => {
        if (!selectedStudentIds.size || deleteInProgress) return;

        const ids = Array.from(selectedStudentIds);
        setDeleteInProgress(true);
        setActionError(null);

        try {
            await Promise.all(ids.map(id => mongoDBService.deleteStudent(id)));
            setStudents(prev => prev.filter(student => !ids.includes(student.id)));
            if (aiFilterActive) {
                setAiFilteredStudents(prev => prev.filter(student => !ids.includes(student.id)));
            }
            setSelectedStudentIds(new Set());
            setDeleteWarningOpen(false);
            setStudentDeletedPopupOpen(true);
        } catch (error) {
            console.error('Failed to delete students:', error);
            setActionError(error.message || 'Failed to delete student(s). Please try again.');
        } finally {
            setDeleteInProgress(false);
        }
    };

    // 6. FUNCTION to close all action popups
    const handleCloseActionPopup = () => {
        setDeleteWarningOpen(false);
        setStudentDeletedPopupOpen(false);
        setIsBlockedPopupOpen(false);
        setIsUnblockedPopupOpen(false);
        setActionError(null);
    };
    useEffect(() => {
        let isMounted = true;

        const loadStudents = async () => {
            if (!filterDept) {
                setStudents([]);
                return;
            }

            setIsLoading(true);
            setLoadError(null);

            try {
                const normalizedDept = filterDept.trim();

                const resolveList = (payload) => (
                    Array.isArray(payload)
                        ? payload
                        : payload?.students || payload?.data || []
                );

                let response = await mongoDBService.getStudents({
                    department: normalizedDept,
                    includeArchived: 'true'  // Include archived students to show all
                });

                if (!isMounted) return;

                let list = resolveList(response);

                if ((!list || list.length === 0) && normalizedDept) {
                    response = await mongoDBService.getStudents({ 
                        branch: normalizedDept,
                        includeArchived: 'true'  // Include archived students to show all
                    });
                    if (!isMounted) return;
                    list = resolveList(response);
                }

                if ((!list || list.length === 0)) {
                    response = await mongoDBService.getStudents({
                        includeArchived: 'true'  // Include archived students to show all
                    });
                    if (!isMounted) return;
                    list = resolveList(response);
                }

                const normalizedList = (list || []).map(mapStudentRecord).filter(Boolean);
                setStudents(normalizedList);
            } catch (error) {
                if (!isMounted) return;
                console.error('Failed to fetch students:', error);
                setStudents([]);
                setLoadError(error.message || 'Failed to load students. Please try again.');
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadStudents();

        return () => {
            isMounted = false;
        };
    }, [filterDept, mapStudentRecord]);


    // Derived State (This is the active filtering logic)
    const sectionOptions = useMemo(() => {
        const set = new Set();
        for (const s of students) {
            const sec = (s?.section ?? '').toString().trim();
            if (sec) set.add(sec);
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b));
    }, [students]);

    const filteredStudents = useMemo(() => {
        if (aiFilterActive) {
            return aiFilteredStudents;
        }
        const normalizedDeptFilter = (filterDept || '').toString().toUpperCase();
        return students.filter(student => {
            const studentDept = (student.department || '').toString().toUpperCase();
            const deptMatches = normalizedDeptFilter === '' || studentDept === normalizedDeptFilter;
            const batchMatches = filterBatch === '' || student.batch === filterBatch;
            const yearMatches =
                filterYear === '' || normalizeYearRoman(student.currentYear) === normalizeYearRoman(filterYear);
            const semMatches =
                filterSem === '' || normalizeSemRoman(student.currentSemester) === normalizeSemRoman(filterSem);
            const sectionMatches =
                filterSection === '' ||
                (student.section || '').toString().trim().toLowerCase() === filterSection.toString().trim().toLowerCase();
            const q = (filterSearch || '').toString().trim();
            const qLower = q.toLowerCase();
            const nameMatches = q === '' || (student.name || '').toLowerCase().includes(qLower);
            const regNoMatches = q === '' || (student.regNo || '').toString().includes(q);
            const searchMatches = q === '' || nameMatches || regNoMatches;
            return deptMatches && batchMatches && yearMatches && semMatches && sectionMatches && searchMatches;
        });
    }, [aiFilterActive, aiFilteredStudents, students, filterDept, filterBatch, filterYear, filterSem, filterSection, filterSearch]);
      
    const blockedStudents = useMemo(() => filteredStudents.filter(s => s.blocked), [filteredStudents]);
    const visibleStudents = viewBlocklist ? blockedStudents : filteredStudents;

    const aiColumns = aiFilterActive ? aiFilterColumns.filter((column) => AI_EXTRA_COLUMNS[column]) : [];
    const tableColumnCount = 9 + aiColumns.length;
    const isTableLoading = isLoading || aiFilterLoading;
    
    // Function to simulate progress and handle export
    const simulateExport = async (operation, exportFunction) => {
        setShowExportMenu(false);

        setExportType(operation === 'excel' ? 'Excel' : 'PDF');
        setExportPopupState('progress');
        setExportProgress(0);

        let progressInterval;
        let progressTimeout;

        try {
            // Simulate progress from 0 to 100
            progressInterval = setInterval(() => {
                setExportProgress(prev => Math.min(prev + 10, 100));
            }, 200);

            // Wait for progress animation to complete
            await new Promise(resolve => {
                progressTimeout = setTimeout(() => {
                    clearInterval(progressInterval);
                    resolve();
                }, 2000);
            });
            
            // Perform the actual export
            exportFunction();

            setExportProgress(100);
            setExportPopupState('success');
        } catch (error) {
            if (progressInterval) clearInterval(progressInterval);
            if (progressTimeout) clearTimeout(progressTimeout);

            setExportPopupState('failed');
        }
    };

    const getExportColumns = () => {
        const baseColumns = [
            { key: 'regNo', label: 'Reg No' },
            { key: 'name', label: 'Name' },
            { key: 'batch', label: 'Batch' },
            { key: 'section', label: 'Section' },
            { key: 'phone', label: 'Phone' },
            { key: 'status', label: 'Status' }
        ];

        const extraColumns = aiColumns.map((columnKey) => ({
            key: columnKey,
            label: AI_EXTRA_COLUMNS[columnKey].label,
        }));

        return [...baseColumns, ...extraColumns];
    };

    const getExportValue = (student, columnKey) => {
        if (columnKey === 'status') {
            return student.blocked ? "Blocked" : "Active";
        }
        if (AI_EXTRA_COLUMNS[columnKey]) {
            return AI_EXTRA_COLUMNS[columnKey].value(student);
        }
        return student[columnKey] ?? '';
    };

    // 4. Implement exportToExcel
    const exportToExcel = () => {
        try {
            const exportColumns = getExportColumns();
            const header = exportColumns.map(col => col.label);
            const data = visibleStudents.map(student => exportColumns.map(col => getExportValue(student, col.key)));
            const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Students");
            XLSX.writeFile(wb, "Students_Report.xlsx");
            setShowExportMenu(false);
        } catch (error) {
            throw error;
        }
    };

    // Wrapper for Excel export with popup
    const handleExportToExcel = () => {
        simulateExport('excel', exportToExcel);
    };

    // 5. Implement exportToPDF - NO LOGIC CHANGE, ONLY IMPORT FIX APPLIED
    const exportToPDF = () => {
        try {
            const doc = new jsPDF("landscape");
            const exportColumns = getExportColumns();
            const columns = exportColumns.map(col => col.label);
            const rows = visibleStudents.map(student => exportColumns.map(col => getExportValue(student, col.key)));
          
            doc.text("Students Report", 14, 15);
          
            // ✅ use the imported function directly
            autoTable(doc, {
              head: [columns],
              body: rows,
              startY: 20,
              styles: { fontSize: 8 },
            });
          
            doc.save("Students_Report.pdf");
            setShowExportMenu(false);
        } catch (error) {
            throw error;
        }
    };

    // Wrapper for PDF export with popup
    const handleExportToPDF = () => {
        simulateExport('pdf', exportToPDF);
    };
      

      const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

    return (
        <>
            <Navbar   onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
            <div className={styles["co-ms-layout"]}>
                <Sidebar  isOpen={isSidebarOpen} onLogout={onLogout} currentView="manage-students" onViewChange={onViewChange}
          onClose={() => setIsSidebarOpen(false)}
        />
                <div className={styles["co-ms-main-content"]}>
                    
                    {/* TOP CARD: Filter and Actions */}
                    <div className={styles["co-ms-top-card"]}>
                        
                        {/* Filter Section */}
                        <div className={cx(styles["co-ms-filter-section"], isAIFilterMode && styles["co-ms-filter-section-ai-mode"])}>
                            <div className={styles["co-ms-filter-header-container"]}>
                                <div className={styles["co-ms-filter-header"]}>
                                    {isAIFilterMode ? 'AI-Filter' : 'Filter & Sort'}
                                </div>
                                <button
                                    type="button"
                                    className={styles["co-ms-ai-toggle-btn"]}
                                    onClick={handleToggleFilterMode}
                                    aria-label="AI Filter"
                                    onMouseEnter={handleAiTooltipMove}
                                    onMouseMove={handleAiTooltipMove}
                                    onMouseLeave={handleAiTooltipLeave}
                                >
                                    {isAIFilterMode ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                            <path fill="none" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="1.5" d="M21.25 12H8.895m-4.361 0H2.75m18.5 6.607h-5.748m-4.361 0H2.75m18.5-13.214h-3.105m-4.361 0H2.75m13.214 2.18a2.18 2.18 0 1 0 0-4.36a2.18 2.18 0 0 0 0 4.36Zm-9.25 6.607a2.18 2.18 0 1 0 0-4.36a2.18 2.18 0 0 0 0 4.36Zm6.607 6.608a2.18 2.18 0 1 0 0-4.361a2.18 2.18 0 0 0 0 4.36Z"/>
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                            <g fill="none">
                                                <path d="m12.594 23.258l-.012.002l-.071.035l-.02.004l-.014-.004l-.071-.036q-.016-.004-.024.006l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.016-.018m.264-.113l-.014.002l-.184.093l-.01.01l-.003.011l.018.43l.005.012l.008.008l.201.092q.019.005.029-.008l.004-.014l-.034-.614q-.005-.019-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.003-.011l.018-.43l-.003-.012l-.01-.01z"/>
                                                <path fill="currentColor" d="M9.107 5.448c.598-1.75 3.016-1.803 3.725-.159l.06.16l.807 2.36a4 4 0 0 0 2.276 2.411l.217.081l2.36.806c1.75.598 1.803 3.016.16 3.725l-.16.06l-2.36.807a4 4 0 0 0-2.412 2.276l-.081.216l-.806 2.361c-.598 1.75-3.016 1.803-3.724.16l-.062-.16l-.806-2.36a4 4 0 0 0-2.276-2.412l-.216-.081l-2.36-.806c-1.751-.598-1.804-3.016-.16-3.724l.16-.062l2.36-.806A4 4 0 0 0 8.22 8.025l.081-.216zM11 6.094l-.806 2.36a6 6 0 0 1-3.49 3.649l-.25.091l-2.36.806l2.36.806a6 6 0 0 1 3.649 3.49l.091.25l.806 2.36l.806-2.36a6 6 0 0 1 3.49-3.649l.25-.09l2.36-.807l-2.36-.806a6 6 0 0 1-3.649-3.49l-.09-.25zM19 2a1 1 0 0 1 .898.56l.048.117l.35 1.026l1.027.35a1 1 0 0 1 .118 1.845l-.118.048l-1.026.35l-.35 1.027a1 1 0 0 1-1.845.117l-.048-.117l-.35-1.026l-1.027-.35a1 1 0 0 1-.118-1.845l.118-.048l1.026-.35l.35-1.027A1 1 0 0 1 19 2"/>
                                            </g>
                                        </svg>
                                    )}
                                </button>
                                {aiTooltip.visible && (
                                    <div
                                        className={styles["co-ms-ai-pointer-tooltip"]}
                                        style={{ left: `${aiTooltip.x}px`, top: `${aiTooltip.y}px`, transform: 'translateX(-50%)' }}
                                    >
                                        {isAIFilterMode ? 'Filter & Sort' : 'AI Filter'}
                                    </div>
                                )}
                            </div>
                            {!isAIFilterMode ? (
                                <div className={styles["co-ms-filter-content"]}>
                                    <div className={styles["co-ms-floating-input-container"]}>
                                        <input
                                            className={styles["co-ms-floating-input"]}
                                            placeholder="Name/RegNo"
                                            value={selectedSearch}
                                            onChange={(e) => setSelectedSearch(e.target.value)}
                                        />
                                        <label className={styles["co-ms-floating-label"]}>Name/Reg No</label>
                                    </div>

                                    {/* MODIFICATION: Swapped position with Batch Dropdown */}
                                    <div className={styles["co-ms-batch-range"]}>
                                        <div className={styles["co-ms-batch-range-label"]}>
                                            Batch <span className={styles["co-ms-batch-range-required"]}>*</span>
                                        </div>
                                        <div className={styles["co-ms-batch-range-inputs"]}>
                                            <div className={styles["co-ms-batch-range-field"]}>
                                                <input
                                                    className={styles["co-ms-batch-range-input"]}
                                                    placeholder="Start"
                                                    inputMode="numeric"
                                                    value={selectedBatchStart}
                                                    onChange={(e) => {
                                                        const start = (e.target.value || '').replace(/[^\d]/g, '').slice(0, 4);
                                                        setSelectedBatchStart(start);

                                                        if (!start) {
                                                            setSelectedBatchEnd('');
                                                            setSelectedBatch('');
                                                            return;
                                                        }

                                                        const startNum = Number.parseInt(start, 10);
                                                        const endNum = Number.isFinite(startNum) ? startNum + 4 : '';
                                                        const endStr = endNum ? `${endNum}` : '';
                                                        setSelectedBatchEnd(endStr);
                                                        setSelectedBatch(endStr ? `${start}-${endStr}` : start);
                                                    }}
                                                />
                                            </div>

                                            <div className={styles["co-ms-batch-range-sep"]}>-</div>

                                            <div className={styles["co-ms-batch-range-field"]}>
                                                <input
                                                    className={styles["co-ms-batch-range-input"]}
                                                    placeholder="End"
                                                    value={selectedBatchEnd}
                                                    readOnly
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles["co-ms-section-filter"]}>
                                        <div className={styles["co-ms-section-filter-label"]}>Section</div>
                                        <select
                                            className={styles["co-ms-section-filter-select"]}
                                            value={selectedSection}
                                            onChange={(e) => setSelectedSection(e.target.value)}
                                        >
                                            <option value="">Section</option>
                                            {sectionOptions.map((sec) => (
                                                <option key={sec} value={sec}>
                                                    {sec}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    <div className={styles["co-ms-yearsem-range"]}>
                                        <div className={styles["co-ms-yearsem-range-label"]}>Year-Sem</div>
                                        <div className={styles["co-ms-yearsem-range-inputs"]}>
                                            <div className={styles["co-ms-yearsem-range-field"]}>
                                                <select
                                                    className={styles["co-ms-yearsem-range-select"]}
                                                    value={selectedYear}
                                                    onChange={(e) => {
                                                        const year = (e.target.value || '').toString();
                                                        setSelectedYear(year);
                                                        setSelectedSem('');
                                                    }}
                                                >
                                                    <option value="">Year</option>
                                                    {YEAR_OPTIONS.map((y) => (
                                                        <option key={y} value={y}>
                                                            {y}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className={styles["co-ms-yearsem-range-sep"]}>-</div>

                                            <div className={styles["co-ms-yearsem-range-field"]}>
                                                <select
                                                    className={styles["co-ms-yearsem-range-select"]}
                                                    value={selectedSem}
                                                    disabled={!selectedYear}
                                                    onChange={(e) => setSelectedSem(e.target.value)}
                                                >
                                                    <option value="">Sem</option>
                                                    {(SEM_OPTIONS_BY_YEAR[selectedYear] || []).map((s) => (
                                                        <option key={s} value={s}>
                                                            {s}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles["co-ms-button-group"]}>
                                        <button 
                                            className={cx(styles["co-ms-button"], styles["co-ms-view-students-btn"])} 
                                            onClick={applyFilters}
                                        >
                                            View Students
                                        </button>
                                        <button className={cx(styles["co-ms-button"], styles["co-ms-blocklist-btn"])} 
                                            onClick={() => {
                                                setFilterBatch(selectedBatch);
                                                setFilterYear(selectedYear);
                                                setFilterSem(selectedSem);
                                                setFilterSection(selectedSection);
                                                setViewBlocklist(true);
                                            }}
                                        > Blocklist</button>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles["co-ms-ai-filter-content"]}>
                                    <textarea
                                        className={styles["co-ms-ai-filter-input"]}
                                        placeholder="Try: 'show me placed students from TCS', 'CSE students with CGPA above 8', 'unplaced final year students', 'students who attended Infosys drive', 'students who know Python'"
                                        value={aiFilterText}
                                        onChange={(e) => setAiFilterText(e.target.value)}
                                    />
                                    <div className={styles["co-ms-ai-button-group"]}>
                                        <button
                                            type="button"
                                            className={cx(styles["co-ms-button"], styles["co-ms-ai-apply-btn"])}
                                            onClick={handleApplyAIFilter}
                                            disabled={aiFilterLoading}
                                        >
                                            {aiFilterLoading ? 'Searching...' : 'Search'}
                                        </button>
                                        <button
                                            type="button"
                                            className={cx(styles["co-ms-button"], styles["co-ms-ai-discard-btn"])}
                                            onClick={handleDiscardAIFilter}
                                        >
                                            Discard
                                        </button>
                                    </div>
                                    {aiFilterActive && aiFilterReason && (
                                        <div className={styles["co-ms-ai-reason"]}>
                                            <span className={styles["co-ms-ai-reason-icon"]}>✨</span>
                                            <span className={styles["co-ms-ai-reason-text"]}>{aiFilterReason}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Action Cards Section - No change */}
                        <div className={styles["co-ms-action-cards-section"]}>
                            <div className={styles["co-ms-action-card"]}>
                                <h4 className={styles["co-ms-action-header"]}>Semester</h4>
                                <p className={styles["co-ms-action-description"]}>
                                    Update <br/>Semester <br/>Wise<br/> Student <br/> CGPA
                                </p>
                                <button 
                                    className={cx(styles["co-ms-action-btn"], styles["co-ms-semester-btn"])} 
                                    onClick={() => {
                                        if (onViewChange) {
                                            onViewChange('manage-students-semester');
                                        }
                                    }}
                                >
                                    Semester
                                </button>
                            </div>

                            <div className={styles["co-ms-action-card"]}>
                                <h4 className={styles["co-ms-action-header"]} >Editing</h4>
                                <p className={styles["co-ms-action-description"]}>
                                    Select <br/>Student <br/>Record<br/> Before <br/> Editing
                                </p>
                                <button 
                                    className={cx(styles["co-ms-action-btn"], styles["co-ms-edit-btn"])} 
                                    onClick={() => {
                                        if (selectedStudentIds.size === 1) {
                                            const studentId = Array.from(selectedStudentIds)[0];
                                            navigate(`/coo-manage-students/edit/${studentId}`, { state: { mode: 'edit' } });
                                        }
                                    }} 
                                    disabled={selectedStudentIds.size !== 1}>Edit</button>
                            </div>
                            
                            <div className={styles["co-ms-action-card"]}>
                                <h4 className={styles["co-ms-action-header"]}>Blocking</h4>
                                <p className={styles["co-ms-action-description"]}>
                                    Select <br/>Student<br/> Record <br/>Before<br/> Blocking
                                </p>
                                <button 
                                    className={cx(styles["co-ms-action-btn"], styles["co-ms-block-btn"])} 
                                    onClick={handleBlock}
                                    disabled={selectedStudentIds.size < 1 || blockInProgress || hasBlockedSelection}
                                >
                                    {blockInProgress ? 'Block..' : 'Block'}
                                </button>
                            </div>
                            
                            <div className={styles["co-ms-action-card"]}>
                                <h4 className={styles["co-ms-action-header"]}>Unblocking</h4>
                                <p className={styles["co-ms-action-description"]}>
                                    Select <br/>Student<br/>Record<br/> Before<br/> Unblocking
                                </p>
                                <button 
                                    className={cx(styles["co-ms-action-btn"], styles["co-ms-unblock-btn"])} 
                                    onClick={handleUnblock}
                                    disabled={selectedStudentIds.size < 1 || unblockInProgress || hasUnblockedSelection}
                                >
                                    {unblockInProgress ? 'Unblock...' : 'Unblock'}
                                </button>
                            </div>
                            
                            <div className={cx(styles["co-ms-action-card"], styles["co-ms-delete-card"]) }>
                                <h4 className={styles["co-ms-action-header"]}>Deleting</h4>
                                <p className={styles["co-ms-action-description"]}>
                                    Select <br/> Student <br/> Record <br/> Before <br/>Deleting
                                </p>
                                {/* 7. Use the function to open the delete warning popup */}
                                <button 
                                    className={cx(styles["co-ms-action-btn"], styles["co-ms-delete-btn"])} 
                                    onClick={handleOpenDeleteWarning} disabled={selectedStudentIds.size < 1 || deleteInProgress}                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                        {actionError && (
                            <div className={styles["co-ms-action-error"]}>{actionError}</div>
                        )}
                    </div>

                    {/* BOTTOM CARD: Student Table */}
                    <div className={styles["co-ms-bottom-card"]}>
                        <div className={styles["co-ms-table-header-row"]}>
                            {/* Update table title to use filterDept */}
                            <h3 className={styles["co-ms-table-title"]}>
                                {isTableLoading ? 'STUDENTS' : `${(filterDept || coordinatorDepartment || '').toUpperCase()} STUDENT DATABASE (${visibleStudents.length})`}
                            </h3>
                            <div className={styles["co-ms-table-actions"]}>
                                {/* 3. Add the Print button with click handler to toggle the export menu */}
                                <div className={styles["co-ms-print-button-container"]}>
                                    <button 
                                        className={styles["co-ms-print-btn"]} 
                                        onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); }}
                                    >
                                        Print
                                    </button>
                                    
                                    {showExportMenu && (
                                        <div className={styles["co-ms-export-menu"]}>
                                            <button onClick={handleExportToExcel}>Export to Excel</button>
                                            <button onClick={handleExportToPDF}>Save as PDF</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles["co-ms-table-container"]}>
                            <table className={styles["co-ms-students-table"]}>
                                <thead>
                                    <tr className={styles["co-ms-table-head-row"]}>
                                        <th className={cx(styles["co-ms-th"], styles["co-ms-select"])}>Select</th>
                                        <th className={cx(styles["co-ms-th"], styles["co-ms-sno"])}>S.No</th>
                                        <th className={cx(styles["co-ms-th"], styles["co-ms-register-number"])}>Register Number</th>
                                        <th className={cx(styles["co-ms-th"], styles["co-ms-name"])}>Name</th>
                                        <th className={cx(styles["co-ms-th"], styles["co-ms-year-sec"])}>Year-Sec</th>
                                        <th className={cx(styles["co-ms-th"], styles["co-ms-sem"])}>Sem</th>
                                        <th className={cx(styles["co-ms-th"], styles["co-ms-batch"])}>Batch</th>
                                        {aiColumns.map((columnKey) => (
                                            <th key={columnKey} className={cx(styles["co-ms-th"], styles["co-ms-ai-column"])}>
                                                {AI_EXTRA_COLUMNS[columnKey].label}
                                            </th>
                                        ))}
                                        <th className={cx(styles["co-ms-th"], styles["co-ms-phone"])}>Phone</th>
                                        <th className={cx(styles["co-ms-th"], styles["co-ms-profile"])}>Profile</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isTableLoading ? (
                                        <tr className={styles["co-ms-loading-row"]}>
                                            <td colSpan={tableColumnCount} className={styles["co-ms-loading-cell"]}>
                                                <div className={styles["co-ms-loading-wrapper"]}>
                                                    <div className={styles['co-ms-spinner']}></div>
                                                    <span style={{ color: '#1f2937', fontWeight: 600, fontSize: '0.95rem' }}>
                                                        {aiFilterLoading ? 'Searching students…' : 'Loading students…'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : loadError ? (
                                        <tr>
                                            <td colSpan={tableColumnCount} style={{ textAlign: "center", color: "#d23b42", fontSize: "1.1rem", fontFamily: "Arial, sans-serif" }}>
                                                {loadError}
                                            </td>
                                        </tr>
                                    ) : visibleStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan={tableColumnCount} style={{ textAlign: "center", color: "#2d2d2d", fontSize: "1.2rem", fontFamily: "Arial, sans-serif" }}>
                                                {viewBlocklist ? "No blocked students available" : "No data available"}
                                            </td>
                                        </tr>
                                    ) : (
                                        visibleStudents.map((student, index) => (
                                            <tr
                                                key={student.id}
                                                className={cx(
                                                    styles["co-ms-table-row"],
                                                    selectedStudentIds.has(student.id) && styles["co-ms-selected-row"],
                                                    student.blocked && styles["co-ms-blocked-row"]
                                                )}
                                                onClick={() => handleStudentSelect(student.id)}
                                            >
                                                <td className={cx(styles["co-ms-td"], styles["co-ms-select"])} onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStudentIds.has(student.id)}
                                                        onChange={() => handleStudentSelect(student.id)}
                                                    />
                                                </td>
                                                <td className={cx(styles["co-ms-td"], styles["co-ms-sno"])}>{index + 1}</td>
                                                <td className={cx(styles["co-ms-td"], styles["co-ms-register-number"])}>{student.regNo}</td>
                                                <td className={cx(styles["co-ms-td"], styles["co-ms-name"])}>{student.name}</td>
                                                <td className={cx(styles["co-ms-td"], styles["co-ms-year-sec"])}>
                                                    {student.currentYear && student.section
                                                        ? `${student.currentYear}-${student.section}`
                                                        : student.currentYear || student.section || '--'}
                                                </td>
                                                <td className={cx(styles["co-ms-td"], styles["co-ms-sem"])}>{student.currentSemester || '--'}</td>
                                                <td className={cx(styles["co-ms-td"], styles["co-ms-batch"])}>{student.batch}</td>
                                                {aiColumns.map((columnKey) => (
                                                    <td key={`${student.id}-${columnKey}`} className={cx(styles["co-ms-td"], styles["co-ms-ai-column"])}>
                                                        {AI_EXTRA_COLUMNS[columnKey].render
                                                            ? AI_EXTRA_COLUMNS[columnKey].render(student)
                                                            : AI_EXTRA_COLUMNS[columnKey].value(student)}
                                                    </td>
                                                ))}
                                                <td className={cx(styles["co-ms-td"], styles["co-ms-phone"])}>{student.phone}</td>
                                                <td
                                                    className={cx(styles["co-ms-td"], styles["co-ms-profile"])}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/coo-manage-students/view/${student.id}`, { state: { mode: 'view' } });
                                                    }}
                                                >
                                                    <EyeIcon />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
          <ExportProgressAlert
            isOpen={exportPopupState === 'progress'}
            onClose={() => {}}
            progress={exportProgress}
            exportType={exportType}
            color="#d23b42"
            progressColor="#d23b42"
          />

          <ExportSuccessAlert
            isOpen={exportPopupState === 'success'}
            onClose={() => setExportPopupState('none')}
            exportType={exportType}
            color="#d23b42"
          />

          <ExportFailedAlert
            isOpen={exportPopupState === 'failed'}
            onClose={() => setExportPopupState('none')}
            exportType={exportType}
            color="#d23b42"
          />  
             {/* 8. Render Block/Unblock/Delete Popups */}
            <BlockedPopup
                isOpen={isBlockedPopupOpen}
                onClose={handleCloseActionPopup}
            />
            <UnblockedPopup
                isOpen={isUnblockedPopupOpen}
                onClose={handleCloseActionPopup}
            />
            <DeleteWarningPopup
                isOpen={isDeleteWarningOpen}
                onBack={handleCloseActionPopup}
                onConfirm={handleConfirmDelete}
                selectedCount={selectedStudentIds.size}
            />
            <StudentDeletedPopup
                isOpen={isStudentDeletedPopupOpen}
                onClose={handleCloseActionPopup}
            />
         
        </>
    );
}

export default Comanagestud;