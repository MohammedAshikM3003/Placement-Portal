import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import styles from './Coo_ManageStudents.module.css';
import achStyles from '../StudentPages/Achievements.module.css';
import Adminicon from "../assets/Adminicon.png";
import mongoDBService from "../services/mongoDBService.jsx";

// IMPORTS for Export Functionality
import * as XLSX from 'xlsx';
// ✅ FIX APPLIED HERE: Using default import for jspdf
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const cx = (...classNames) => classNames.filter(Boolean).join(' ');


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

// Export Popup Components
const ExportProgressPopup = ({ isOpen, operation, progress, onClose }) => {
    if (!isOpen) return null;
    
    const operationText = operation === 'excel' ? 'Exporting...' : 'Downloading...';
    const progressText = operation === 'excel' ? 'Exported' : 'Downloaded';
    
    // Calculate the stroke-dasharray for circular progress
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    
    return (
        <div className={styles["co-ms-export-popup-overlay"]}>
            <div className={styles["co-ms-export-popup-container"]}>
                <div className={styles["co-ms-export-popup-header"]}>{operationText}</div>
                <div className={styles["co-ms-export-popup-body"]}>
                    <div className={styles["co-ms-export-progress-circle"]}>
                        <svg width="100" height="100" viewBox="0 0 100 100">
                            {/* Background circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="none"
                                stroke="#e0e0e0"
                                strokeWidth="8"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="none"
                                stroke="#d23b42"
                                strokeWidth="8"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                transform="rotate(-90 50 50)"
                                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                            />
                        </svg>
                      
                    </div>
                    <h2 className={styles["co-ms-export-popup-title"]}>{progressText} {progress}%</h2>
                    <p className={styles["co-ms-export-popup-message"]}>
                        The Details have been {operation === 'excel' ? 'Exporting...' : 'Downloading...'}
                    </p>
                    <p className={styles["co-ms-export-popup-message"]}>Please wait...</p>
                </div>
            </div>
        </div>
    );
};

const ExportSuccessPopup = ({ isOpen, operation, onClose }) => {
    if (!isOpen) return null;
    
    const title = operation === 'excel' ? 'Exported To Excel ✓' : 'PDF Downloaded ✓';
    const message = operation === 'excel' 
        ? 'The Details have been Successfully Exported to Excel in your device.'
        : 'The Details have been Successfully Downloaded as PDF to your device.';
    const headerText = operation === 'excel' ? 'Exported!' : 'Downloaded!';
    
    return (
        <div className={styles["co-ms-export-popup-overlay"]}>
            <div className={styles["co-ms-export-popup-container"]}>
                <div className={styles["co-ms-export-popup-header"]}>{headerText}</div>
                <div className={styles["co-ms-export-popup-body"]}>
                    <div className={styles["co-ms-export-success-icon"]}>
                    <svg xmlns='http://www.w3.org/2000/svg' viewBox="0 0 52 52" fill="none">
                        <circle className={styles["co-ms-success-icon--circle"]} cx="26" cy="26" r="25"/>
                        <path className={styles["co-ms-success-icon--check"]} d="M14.1 27.2l7.1 7.2 16.7-16.8" fill="none"
                            />
                        </svg>
                    </div>
                    <h2 className={styles["co-ms-export-popup-title"]}>{title}</h2>
                    <p className={styles["co-ms-export-popup-message"]}>{message}</p>
                </div>
                <div className={styles["co-ms-export-popup-footer"]}>
                    <button onClick={onClose} className={styles["co-ms-export-popup-close-btn"]}>Close</button>
                </div>
            </div>
        </div>
    );
};

const ExportFailedPopup = ({ isOpen, operation, onClose }) => {
    if (!isOpen) return null;
    
    const title = operation === 'excel' ? 'Exported Failed!' : 'Downloaded Failed!';
    const message = operation === 'excel'
        ? 'The Details have been Successfully Exported to Excel in your device.'
        : 'The Details have been Successfully Downloaded as PDF to your device.';
    const headerText = operation === 'excel' ? 'Exported!' : 'Downloaded!';
    
    return (
        <div className={styles["co-ms-export-popup-overlay"]}>
            <div className={styles["co-ms-export-popup-container"]}>
                <div className={styles["co-ms-export-popup-header"]}>{headerText}</div>
                <div className={styles["co-ms-export-popup-body"]}>
                    <div className={styles["co-ms-export-failed-icon"]}>
                        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                            <circle cx="40" cy="40" r="38" fill="#dc3545" />
                            <path
                                d="M30 30 L50 50 M50 30 L30 50"
                                stroke="white"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                    <h2 className={styles["co-ms-export-popup-title"]}>{title}</h2>
                    <p className={styles["co-ms-export-popup-message"]}>{message}</p>
                </div>
                <div className={styles["co-ms-export-popup-footer"]}>
                    <button onClick={onClose} className={styles["co-ms-export-popup-close-btn"]}>Close</button>
                </div>
            </div>
        </div>
    );
};
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
    
    // DROPDOWN SELECTION STATES (change instantly as user selects)
    // MODIFICATION 2: Removed selectedDept state
    const [selectedBatch, setSelectedBatch] = useState('');
    const [batchOptions, setBatchOptions] = useState([]);

    useEffect(() => {
        const currentYearValue = new Date().getFullYear();
        const startYear = currentYearValue - 5;
        const endYear = currentYearValue + 5;
        const options = [];

        for (let year = startYear; year <= endYear; year += 1) {
            const batchEnd = year + 4;
            options.push(`${year}-${batchEnd}`);
        }

        setBatchOptions(options);
    }, []);

    useEffect(() => {
        setFilterDept(coordinatorDepartment);
    }, [coordinatorDepartment]);

    // NEW: Add filters and selections for Name and RegNo
    const [filterName, setFilterName] = useState('');
    const [filterRegNo, setFilterRegNo] = useState('');
    const [selectedName, setSelectedName] = useState('');
    const [selectedRegNo, setSelectedRegNo] = useState('');

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
    
    // Popup states for export operations
    const [exportPopupState, setExportPopupState] = useState({
        isOpen: false,
        type: null, // 'progress', 'success', 'failed'
        operation: null, // 'excel', 'pdf'
        progress: 0
    });
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [viewBlocklist, setViewBlocklist] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());

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
            };
        },
        [coordinatorDepartment]
    );

    // Function to apply filters from dropdowns and switch to main view
    const applyFilters = () => {
        // filterDept is already defaulted to 'CSE' and does not need to be updated from a selection state
        setFilterBatch(selectedBatch);
        
        // NEW: SET ACTIVE FILTERS FOR NAME AND REG NO
        setFilterName(selectedName.trim().toLowerCase()); // Trim and lower-case Name
        setFilterRegNo(selectedRegNo.trim());              // Trim Reg No
        

        setViewBlocklist(false);
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
    
    const selectedStudents = useMemo(() => {
        if (!selectedStudentIds.size) return [];
        const selectedIds = new Set(selectedStudentIds);
        return students.filter(student => selectedIds.has(student.id));
    }, [students, selectedStudentIds]);

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
            
            await Promise.all(ids.map(id => mongoDBService.updateStudent(id, { 
                blocked: true, 
                isBlocked: true,
                blockedBy: blockedByName,
                blockedByRole: 'coordinator',
                blockedAt: new Date().toISOString(),
                blockedReason: 'Your account has been blocked by the placement coordinator. Please contact the placement office for more information.'
            })));
            setStudents(prev => prev.map(student => ids.includes(student.id) ? { ...student, blocked: true } : student));
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
            setStudents(prev => prev.map(student => ids.includes(student.id) ? { ...student, blocked: false } : student));
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
                    department: normalizedDept
                });

                if (!isMounted) return;

                let list = resolveList(response);

                if ((!list || list.length === 0) && normalizedDept) {
                    response = await mongoDBService.getStudents({ branch: normalizedDept });
                    if (!isMounted) return;
                    list = resolveList(response);
                }

                if ((!list || list.length === 0)) {
                    response = await mongoDBService.getStudents();
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
    const normalizedStudents = students;

    const filteredStudents = useMemo(() => {
        const normalizedDeptFilter = (filterDept || '').toString().toUpperCase();
        return normalizedStudents.filter(student => {
            const studentDept = (student.department || '').toString().toUpperCase();
            const deptMatches = normalizedDeptFilter === '' || studentDept === normalizedDeptFilter;
            const batchMatches = filterBatch === '' || student.batch === filterBatch;
            const nameMatches = filterName === '' || student.name.toLowerCase().includes(filterName);
            const regNoMatches = filterRegNo === '' || (student.regNo || '').includes(filterRegNo);
            return deptMatches && batchMatches && nameMatches && regNoMatches;
        });
    }, [normalizedStudents, filterDept, filterBatch, filterName, filterRegNo]);
      
    
    const blockedStudents = useMemo(() => filteredStudents.filter(s => s.blocked), [filteredStudents]);
    const visibleStudents = viewBlocklist ? blockedStudents : filteredStudents;
    
    // Function to simulate progress and handle export
    const simulateExport = async (operation, exportFunction) => {
        setShowExportMenu(false);
        
        // Show progress popup
        setExportPopupState({
            isOpen: true,
            type: 'progress',
            operation: operation,
            progress: 0
        });

        let progressInterval;
        let progressTimeout;

        try {
            // Simulate progress from 0 to 100
            progressInterval = setInterval(() => {
                setExportPopupState(prev => {
                    if (prev.progress < 100 && prev.type === 'progress') {
                        return { ...prev, progress: Math.min(prev.progress + 10, 100) };
                    }
                    return prev;
                });
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
            
            // Show success popup
            setExportPopupState({
                isOpen: true,
                type: 'success',
                operation: operation,
                progress: 100
            });
        } catch (error) {
            if (progressInterval) clearInterval(progressInterval);
            if (progressTimeout) clearTimeout(progressTimeout);
            
            // Show failed popup
            setExportPopupState({
                isOpen: true,
                type: 'failed',
                operation: operation,
                progress: 0
            });
        }
    };

    // 4. Implement exportToExcel
    const exportToExcel = () => {
        try {
            const data = visibleStudents.map(student => [
                student.regNo,
                student.name,
                student.batch,
                student.section,
                student.phone,
                student.blocked ? "Blocked" : "Active"
            ]);
            const header = ["Reg No", "Name", "Batch", "Section", "Phone", "Status"];
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
            const columns = [
              "Reg No", "Name", "Batch", "Section",
              "Phone", "Status"
            ];
          
            const rows = visibleStudents.map(student => [
              student.regNo,
              student.name,
              student.batch,
              student.section,
              student.phone,
              student.blocked ? "Blocked" : "Active",
            ]);
          
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
                <Sidebar  isOpen={isSidebarOpen} onLogout={onLogout} currentView="manage-students" onViewChange={onViewChange} />
                <div className={styles["co-ms-main-content"]}>
                    
                    {/* TOP CARD: Filter and Actions */}
                    <div className={styles["co-ms-top-card"]}>
                        
                        {/* Filter Section */}
                        <div className={styles["co-ms-filter-section"]}>
                            <div className={styles["co-ms-filter-header-container"]}>
                                <div className={styles["co-ms-filter-header"]}>Filter & Sort</div>
                                
                            </div>
                            <div className={styles["co-ms-filter-content"]}>
                            <div className={styles["co-ms-floating-input-container"]}>
                                <input
                                    className={styles["co-ms-floating-input"]}
                                    placeholder=" "
                                    value={selectedName}
                                    onChange={(e) => setSelectedName(e.target.value)}
                                />
                                <label className={styles["co-ms-floating-label"]}>Name</label>
                            </div>

                            <div className={styles["co-ms-floating-input-container"]}>
                                <input
                                    className={styles["co-ms-floating-input"]}
                                    placeholder=" "
                                    value={selectedRegNo}
                                    onChange={(e) => setSelectedRegNo(e.target.value)}
                                />
                                <label className={styles["co-ms-floating-label"]}>Reg No</label>
                            </div>

                            {/* MODIFICATION: Swapped position with Batch Dropdown */}
                            <div
                                className={cx(
                                    styles["co-ms-floating-select-container"],
                                    selectedBatch ? styles["co-ms-floating-select-has-value"] : ''
                                )}
                            >
                                <select
                                    className={styles["co-ms-floating-select"]}
                                    value={selectedBatch}
                                    onChange={(e) => setSelectedBatch(e.target.value)}
                                >
                                    <option value="">Batch</option>
                                    {batchOptions.map((batch) => (
                                        <option key={batch} value={batch}>
                                            {batch}
                                        </option>
                                    ))}
                                </select>
                                <label className={styles["co-ms-floating-label"]}>Batch</label>
                            </div>
                            
                            {/* MODIFICATION: Swapped position with Batch Dropdown - This is the fixed Department Label */}
                            <div className={styles["co-ms-dropdown-container-dept"]}>
                                <p style={{
                                    padding: '10px 15px',
                                    fontWeight: '500',
                                    color: '#999',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #ccc',
                                    borderRadius: '8px',
                                    height: '45px',
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    margin: 0
                                }}>
                                    Department: {(filterDept || coordinatorDepartment || '').toUpperCase()}
                                </p>
                            </div>


                                <div className={styles["co-ms-button-group"]}>
                                    <button 
                                        className={cx(styles["co-ms-button"], styles["co-ms-view-students-btn"])} 
                                        // NEW: Call applyFilters to set the state and filter the table
                                        onClick={applyFilters}
                                    >
                                        View Students
                                    </button>
                                    <button className={cx(styles["co-ms-button"], styles["co-ms-blocklist-btn"])} 
                                        onClick={() => {
                                            // The department filter is already aligned with the coordinator's department
                                            setFilterBatch(selectedBatch);
                                            setViewBlocklist(true);
                                        }}
                                    > Blocklist</button>
                                </div>
                            </div>
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
                            
                            <div className={styles["co-ms-action-card"]}>
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
                            <h3 className={styles["co-ms-table-title"]}>{(filterDept || coordinatorDepartment || '').toUpperCase()} STUDENT DATABASE</h3>
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
                                        <th className={cx(styles["co-ms-th"], styles["co-ms-phone"])}>Phone</th>
                                        <th className={cx(styles["co-ms-th"], styles["co-ms-profile"])}>Profile</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr className={styles["co-ms-loading-row"]}>
                                            <td colSpan="9" className={styles["co-ms-loading-cell"]}>
                                                <div className={styles["co-ms-loading-wrapper"]}>
                                                    <div className={achStyles['table-spinner']} style={{ width: 34, height: 34, borderWidth: 4 }}></div>
                                                    <span style={{ color: '#1f2937', fontWeight: 600, fontSize: '0.95rem' }}>Loading students…</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : loadError ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: "center", color: "#d23b42", fontSize: "1.1rem", fontFamily: "Arial, sans-serif" }}>
                                                {loadError}
                                            </td>
                                        </tr>
                                    ) : visibleStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: "center", color: "#2d2d2d", fontSize: "1.2rem", fontFamily: "Arial, sans-serif" }}>
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
                                                <td className={cx(styles["co-ms-td"], styles["co-ms-phone"])}>{student.phone}</td>
                                                <td
                                                    className={cx(styles["co-ms-td"], styles["co-ms-profile"])}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/coo-manage-students/edit/${student.id}`, { state: { mode: 'view' } });
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
          {/* Export Popups */}
            {exportPopupState.isOpen && exportPopupState.type === 'progress' && (
                <ExportProgressPopup
                    isOpen={true}
                    operation={exportPopupState.operation}
                    progress={exportPopupState.progress}
                    onClose={() => {}}
                />
            )}
            
            {exportPopupState.isOpen && exportPopupState.type === 'success' && (
                <ExportSuccessPopup
                    isOpen={true}
                    operation={exportPopupState.operation}
                    onClose={() => setExportPopupState({ isOpen: false, type: null, operation: null, progress: 0 })}
                />
            )}
            
            {exportPopupState.isOpen && exportPopupState.type === 'failed' && (
                <ExportFailedPopup
                    isOpen={true}
                    operation={exportPopupState.operation}
                    onClose={() => setExportPopupState({ isOpen: false, type: null, operation: null, progress: 0 })}
                    
                />
            )}  
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