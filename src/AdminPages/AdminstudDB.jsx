import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';
import Adnavbar from '../components/Navbar/Adnavbar.js';
import Adsidebar from '../components/Sidebar/Adsidebar.js';
import mongoDBService from '../services/mongoDBService.jsx';
// UPDATED: Import the CSS file as a module named 'styles'
import styles from './AdminstudDB.module.css';
import Adminicon from "../assets/Adminicon.png";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

// --- Existing Icons (Updated to use 'styles') ---
const GradCapIcon = () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3e8ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
    </svg>
);

const EyeIcon = () => (
    // UPDATED: Use styles['Admin-DB-profile-eye-icon']
    <svg className={styles['Admin-DB-profile-eye-icon']} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

// --- New Icons for Popups (No Change in definitions, as classes are used in JSX) ---
const PopupTrashIcon = () => (
    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
);

const PopupWarningIcon = () => (
    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="15"></line>
        <line x1="12" y1="19" x2="12.01" y2="19"></line>
    </svg>
);

const PopupBlockIcon = () => (
    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#D23B42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
    </svg>
);

const PopupUnblockIcon = () => (
    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#D2AF3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
    </svg>
);
// --- End of Icons ---

const DeleteConfirmationPopup = ({ onClose, onConfirm, selectedCount, isDeleting, title = 'Delete Student', confirmText = 'Delete' }) => (
    <div className={styles['Admin-popup-container']}>
        <div className={styles['Admin-popup-header']}>{title}</div>
        <div className={styles['Admin-popup-body']}>
            <svg className={styles['Admin-warning-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className={styles['Admin-warning-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
                <path d="M26 16v12M26 34v2" stroke="#ffffff" strokeWidth="3" fill="none"/>
            </svg>
            <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#333', fontWeight: 600 }}>Are you sure?</h2>
            <p style={{ margin: 0, color: '#888', fontSize: 16 }}>{confirmText} {selectedCount} selected student{selectedCount > 1 ? 's' : ''}?</p>
        </div>
        <div className={styles['Admin-popup-footer']}>
            <button onClick={onClose} className={styles['Admin-popup-cancel-btn']} disabled={isDeleting}>Discard</button>
            <button onClick={onConfirm} className={styles['Admin-popup-delete-btn']} disabled={isDeleting}>{isDeleting ? `${confirmText}...` : confirmText}</button>
        </div>
    </div>
);

const DeleteSuccessPopup = ({ onClose }) => (
    <div className={styles['Admin-popup-container']}>
        <div className={styles['Admin-popup-header']}>Deleted !</div>
        <div className={styles['Admin-popup-body']}>
            <svg className={styles['Admin-delete-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className={styles['Admin-delete-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
                <g className={styles['Admin-delete-icon--bin']} fill="none" strokeWidth="2">
                    <path d="M16 20l20 0M18 20l0 16c0 1 1 2 2 2l12 0c1 0 2-1 2-2l0-16M21 20l0-3c0-1 1-2 2-2l6 0c1 0 2 1 2 2l0 3M23 25l0 8M26 25l0 8M29 25l0 8"/>
                </g>
            </svg>
            <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#000', fontWeight: 700 }}>Student Deleted ✓</h2>
            <p style={{ margin: 0, color: '#888', fontSize: 16 }}>The selected Student has been Deleted Successfully!</p>
        </div>
        <div className={styles['Admin-popup-footer']}>
            <button onClick={onClose} className={styles['Admin-popup-close-btn']}>Close</button>
        </div>
    </div>
);

const BlockSuccessPopup = ({ onClose }) => (
    <div className={styles['Admin-popup-container']}>
        <div className={styles['Admin-popup-header']}>Blocked !</div>
        <div className={styles['Admin-popup-body']}>
            <div className={styles['Admin-status-icon']}>
                <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="36" cy="36" r="24" stroke="#D23B42" strokeWidth="6" fill="none" strokeLinecap="round" />
                    <line x1="22" y1="22" x2="50" y2="50" stroke="#D23B42" strokeWidth="6" strokeLinecap="round" />
                </svg>
            </div>
            <h2 className={styles['Admin-status-title']}>Student Blocked ✓</h2>
            <p className={styles['Admin-status-text']}>The selected Student has been Blocked Successfully!</p>
        </div>
        <div className={styles['Admin-popup-footer']}>
            <button onClick={onClose} className={styles['Admin-popup-close-btn']}>Close</button>
        </div>
    </div>
);

const UnblockSuccessPopup = ({ onClose }) => (
    <div className={styles['Admin-popup-container']}>
        <div className={styles['Admin-popup-header']}>Unblocked !</div>
        <div className={styles['Admin-popup-body']}>
            <div className={styles['Admin-status-icon']}>
                <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <circle cx="36" cy="36" r="24" stroke="#D2AF3B" strokeWidth="6" fill="none" strokeLinecap="round" />
                    <line x1="22" y1="50" x2="31" y2="41" stroke="#D2AF3B" strokeWidth="6" strokeLinecap="round" />
                    <line x1="41" y1="31" x2="50" y2="22" stroke="#D2AF3B" strokeWidth="6" strokeLinecap="round" />
                </svg>
            </div>
            <h2 className={styles['Admin-status-title']}>Student Unblocked ✓</h2>
            <p className={styles['Admin-status-text']}>The selected Student has been Unblocked Successfully!</p>
        </div>
        <div className={styles['Admin-popup-footer']}>
            <button onClick={onClose} className={styles['Admin-popup-close-btn']}>Close</button>
        </div>
    </div>
);

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
};

// Clear mock data
const initialStudents = [];

function AdminstudDB() {
    const navigate = useNavigate();
    useAdminAuth(); // JWT authentication verification
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activePopup, setActivePopup] = useState(null);

    const [tempFilterName, setTempFilterName] = useState('');
    const [tempFilterDept, setTempFilterDept] = useState('');
    const [tempFilterRegno, setTempFilterRegno] = useState('');
    const [tempFilterBatch, setTempFilterBatch] = useState('');
    const [isAIFilterMode, setIsAIFilterMode] = useState(false);
    const [aiFilterText, setAiFilterText] = useState('');
    const [aiFilteredStudents, setAiFilteredStudents] = useState([]);
    const [aiFilterColumns, setAiFilterColumns] = useState([]);
    const [aiFilterActive, setAiFilterActive] = useState(false);
    const [aiFilterLoading, setAiFilterLoading] = useState(false);
    const [aiFilterReason, setAiFilterReason] = useState('');
    const [aiTooltip, setAiTooltip] = useState({ visible: false, x: 0, y: 0 });
    const [nameFocused, setNameFocused] = useState(false);
    const [regnoFocused, setRegnoFocused] = useState(false);
    const [filterName, setFilterName] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterRegno, setFilterRegno] = useState('');
    const [filterBatch, setFilterBatch] = useState('');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [branches, setBranches] = useState([]);
    const [batches, setBatches] = useState([]);
    
    const [students, setStudents] = useState([]);
    const [viewBlocklist, setViewBlocklist] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [blockInProgress, setBlockInProgress] = useState(false);
    const [unblockInProgress, setUnblockInProgress] = useState(false);
    const [deleteInProgress, setDeleteInProgress] = useState(false);
    const [exportPopupState, setExportPopupState] = useState('none'); // 'none', 'progress', 'success', 'failed'
    const [exportProgress, setExportProgress] = useState(0);
    const [exportType, setExportType] = useState('Excel'); // 'Excel' or 'PDF'
    const fetchInitiatedRef = useRef(false);
    
    // NEW: Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalStudents, setTotalStudents] = useState(0);
    const studentsPerPage = 100; // Increased to show more records per page

    const normalizeId = (val) => {
        if (!val) return '';
        if (typeof val === 'string') return val;
        if (val.$oid) return val.$oid;
        if (val.oid) return val.oid;
        const s = val.toString ? val.toString() : '';
        return s && s !== '[object Object]' ? s : '';
    };

    // Helper function to calculate current year from batch
    const calculateCurrentYear = (batch) => {
        if (!batch) return '';
        const currentYear = new Date().getFullYear();
        const batchMatch = batch.match(/(\d{4})-(\d{4})/);
        if (!batchMatch) return '';
        
        const startYear = parseInt(batchMatch[1]);
        const yearDiff = currentYear - startYear;
        
        if (yearDiff < 1) return 'I';
        if (yearDiff === 1) return 'II';
        if (yearDiff === 2) return 'III';
        if (yearDiff >= 3) return 'IV';
        return 'I';
    };

    const normalizeStudentRecord = (student, index = 0) => {
        const batch = student.batch || student.year || '';

        return {
            id: normalizeId(student._id || student.id) || student.regNo || `${index}`,
            regNo: student.regNo || student.regno || '',
            name: `${student.firstName || student.firstname || ''} ${student.lastName || student.lastname || ''}`.trim() || student.name || '',
            section: student.section || student.Section || student.sec || student.sectionName || student.classSection || '',
            department: student.department || student.branch || student.degree || '',
            batch,
            currentYear: student.currentYear || student.currentyear || calculateCurrentYear(batch),
            currentSemester: student.currentSemester || student.currentsemester || student.semester || student.sem || '',
            phone: student.phone || student.mobile || student.phoneNo || student.mobileNo || '',
            email: student.primaryEmail || student.primaryemail || student.email || '',
            profilePicURL: student.profilePicURL || student.profilepicurl || student.photoURL || student.photo || student.image || '',
            resume: Boolean(student.resumeURL || student.resumeData),
            placement: student.placement || '',
            blocked: Boolean(student.isBlocked || student.blocked),
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
    };

    // --- Fetch branches from MongoDB and generate batch options ---
    useEffect(() => {
        const fetchBranchesAndBatches = async () => {
            try {
                // Fetch branches from MongoDB
                const branchData = await mongoDBService.getBranches();
                setBranches(branchData || []);
                
                // Generate batch options (5-year range logic from MainRegistration)
                const currentYearValue = new Date().getFullYear();
                const startYear = currentYearValue - 5;
                const endYear = currentYearValue + 5;
                const batchOptions = [];
                
                for (let year = startYear; year <= endYear; year += 1) {
                    const batchEnd = year + 4;
                    batchOptions.push(`${year}-${batchEnd}`);
                }
                
                setBatches(batchOptions);
            } catch (error) {
                console.error('Error fetching branches or generating batches:', error);
            }
        };
        
        fetchBranchesAndBatches();
    }, []);

    // --- Listen for single update from profile page (No Change) ---
    useEffect(() => {
        const updateData = sessionStorage.getItem('studentUpdate');
        
        if (updateData) {
            try {
                const { id: updatedStudentId, blocked: newBlockedStatus } = JSON.parse(updateData);
                
                setStudents(prevStudents =>
                    prevStudents.map(student =>
                        student.id.toString() === updatedStudentId 
                            ? { ...student, blocked: newBlockedStatus } 
                            : student
                    )
                );
                
                sessionStorage.removeItem('studentUpdate');
                
            } catch (error) {
                console.error("Error parsing student update from sessionStorage:", error);
                sessionStorage.removeItem('studentUpdate');
            }
        }
    }, []); 


    // Toggle Sidebar Function (No Change)
    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    // Listen for sidebar close event from navigation links
    useEffect(() => {
        const handleCloseSidebar = () => {
            setIsSidebarOpen(false);
        };
        window.addEventListener('closeSidebar', handleCloseSidebar);
        return () => {
            window.removeEventListener('closeSidebar', handleCloseSidebar);
        };
    }, []);

    // Logout Handler
    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        navigate('/');
    };

    // ... (Filter, View Profile, Select, Action handlers - No logic change) ...
    const handleViewStudents = () => {
        setViewBlocklist(false); // Reset blocklist view when viewing all students
        setAiFilteredStudents([]);
        setAiFilterColumns([]);
        setAiFilterActive(false);
        setFilterName(tempFilterName);
        setFilterDept(tempFilterDept);
        setFilterRegno(tempFilterRegno);
        setFilterBatch(tempFilterBatch);
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
                const mappedStudents = (Array.isArray(response?.students) ? response.students : []).map((student, index) => normalizeStudentRecord(student, index));
                setAiFilteredStudents(mappedStudents);
                setAiFilterColumns(Array.isArray(response?.columns) ? response.columns.filter((column) => AI_EXTRA_COLUMNS[column]) : []);
                setAiFilterActive(true);
                setAiFilterReason(response?.reason || '');
            })
            .catch((error) => {
                console.error('AI filter failed:', error);
                alert(error.message || 'AI filter failed. Please make sure Ollama is running and try again.');
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

    const showLoadingThenNavigate = async (onNavigate) => {
        setExportType('Loading');
        setExportPopupState('progress');
        setExportProgress(0);

        const progressInterval = setInterval(() => {
            setExportProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 15;
            });
        }, 200);

        await new Promise(resolve => setTimeout(resolve, 900));
        clearInterval(progressInterval);
        setExportProgress(100);

        await new Promise(resolve => setTimeout(resolve, 250));
        setExportPopupState('none');
        setExportProgress(0);

        onNavigate();
    };

    const handleViewProfile = (studentId) => {
        const studentToView = students.find(s => s.id === studentId);
        if (studentToView) {
            showLoadingThenNavigate(() => {
                navigate(`/admin-student-view/${studentId}`, {
                    state: {
                        isBlocked: studentToView.blocked
                    }
                });
            });
        }
    };

    const handleStudentSelect = (id) => {
        setSelectedStudentIds(prevIds => {
            const newIds = new Set(prevIds);
            if (newIds.has(id)) newIds.delete(id);
            else newIds.add(id);
            return newIds;
        });
    };
    
    const handleEdit = () => { 
        if (selectedStudentIds.size === 1) {
            const studentId = Array.from(selectedStudentIds)[0];
            const studentToEdit = students.find(s => s.id === studentId);
            
            if (studentToEdit) {
                showLoadingThenNavigate(() => {
                    navigate(`/admin-student-edit/${studentId}`, {
                        state: {
                            isBlocked: studentToEdit.blocked
                        }
                    });
                });
            }
        } else if (selectedStudentIds.size > 1) {
            alert("Please select only one student to edit.");
        } else {
            alert("Please select a student to edit.");
        }
    };

    const handleBlock = () => { 
        if (!selectedStudentIds.size || blockInProgress) return;
        confirmBlock();
    };

    const handleUnblock = () => { 
        if (!selectedStudentIds.size || unblockInProgress) return;
        confirmUnblock();
    };

    const confirmBlock = async () => {
        setBlockInProgress(true);
        try {
            const ids = Array.from(selectedStudentIds);
            
            const cachedAdminProfile = JSON.parse(localStorage.getItem('adminProfileCache') || 'null');
            const adminData = JSON.parse(localStorage.getItem('adminData') || 'null');

            const adminName =
                `${cachedAdminProfile?.firstName || ''} ${cachedAdminProfile?.lastName || ''}`.trim() ||
                cachedAdminProfile?.fullName ||
                adminData?.fullName ||
                localStorage.getItem('adminLoginID') ||
                'Admin';
            const adminCabin = cachedAdminProfile?.cabin || adminData?.cabin || 'N/A';
            const adminIdentifier = cachedAdminProfile?.adminLoginID || adminData?.adminLoginID || localStorage.getItem('adminLoginID') || adminName;
            
            console.log('🚫 BLOCKING STUDENTS:', {
                studentIds: ids,
                adminName,
                count: ids.length
            });
            
            const blockData = { 
                blocked: true, 
                isBlocked: true,
                blockedBy: adminName,
                blockedByRole: 'admin',
                blockedByCabin: adminCabin,
                blockedByIdentifier: adminIdentifier,
                blockedAt: new Date().toISOString(),
                blockedReason: 'Your account has been blocked by the admin. Please contact the placement office for more information.'
            };
            
            console.log('Block data:', blockData);
            
            const updatePromises = ids.map(id => {
                console.log('Blocking student ID:', id);
                return mongoDBService.updateStudent(id, blockData);
            });
            
            await Promise.all(updatePromises);
            
            console.log('✅ All students blocked successfully');
            
            setStudents(students.map(s => selectedStudentIds.has(s.id) ? { ...s, blocked: true, isBlocked: true } : s));
            setActivePopup('blockSuccess');
        } catch (e) {
            console.error('❌ Block failed:', e);
            alert('Failed to block student(s): ' + (e.message || 'Unknown error'));
            setActivePopup(null);
        } finally {
            setBlockInProgress(false);
        }
    };

    const confirmUnblock = async () => {
        setUnblockInProgress(true);
        try {
            const ids = Array.from(selectedStudentIds);
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
            
            setStudents(students.map(s => selectedStudentIds.has(s.id) ? { ...s, blocked: false } : s));
            setActivePopup('unblockSuccess');
        } catch (e) {
            alert('Failed to unblock student(s): ' + (e.message || 'Unknown error'));
            setActivePopup(null);
        } finally {
            setUnblockInProgress(false);
        }
    };

    const handleDeleteClick = () => {
        if (deleteInProgress || !selectedStudentIds.size) return;
        setActivePopup('deleteWarning');
    };

    const confirmDelete = async () => {
        setDeleteInProgress(true);
        try {
            const idsToDelete = Array.from(selectedStudentIds);
            console.log('Attempting to delete IDs:', idsToDelete);

            const studentsToDelete = idsToDelete.map(id => {
                const student = students.find(s => s.id === id);
                console.log(`Searching for ID: ${id}, Found student:`, student);
                return student;
            }).filter(Boolean);

            console.log('Students found for deletion:', studentsToDelete);

            if (studentsToDelete.length > 0) {
                const deletePromises = studentsToDelete.map(student => {
                    const studentIdToDelete = student.id || student.regNo;
                    console.log(`Deleting student with identifier:`, studentIdToDelete);
                    return mongoDBService.deleteStudent(studentIdToDelete);
                });
                await Promise.all(deletePromises);

                setStudents(currentStudents => 
                    currentStudents.filter(s => !idsToDelete.includes(s.id))
                );
                setSelectedStudentIds(new Set());
                setActivePopup('deleteSuccess');
            } else {
                console.warn("Delete action triggered, but no matching students found in state.");
                setActivePopup(null);
            }
        } catch (e) {
            alert('Failed to delete student(s): ' + (e.message || 'Unknown error'));
            setActivePopup(null);
        } finally {
            setDeleteInProgress(false);
        }
    };

    useEffect(() => {
        // Prevent multiple simultaneous fetches
        if (fetchInitiatedRef.current) {
            return;
        }
        
        fetchInitiatedRef.current = true;
        let isMounted = true;
        
        const fetchPaginatedStudents = async () => {
            try {
                console.log('🔄 Fetching students page:', currentPage);
                
                // EMERGENCY: No images due to slow 4.26 Mbps connection from India to AWS US
                const response = await mongoDBService.getStudentsPaginated({ 
                    page: currentPage, 
                    limit: studentsPerPage, 
                    includeImages: false // Disabled for slow connection
                });
                
                console.log('✅ Students response:', response);
                
                if (!isMounted) return;
                
                const data = response.students || [];
                console.log('📊 Student data count:', data.length);
                const mapped = (Array.isArray(data) ? data : []).map(s => {
                    const batch = s.batch || s.year || '';
                    return {
                        id: normalizeId(s._id || s.id) || s.regNo,
                        regNo: s.regNo || s.regno || '',
                        name: `${s.firstName || s.firstname || ''} ${s.lastName || s.lastname || ''}`.trim() || s.name || '',
                        section: s.section || s.Section || s.sec || s.sectionName || s.classSection || '',
                        department: s.department || s.branch || s.degree || '',
                        batch: batch,
                        currentYear: s.currentYear || s.currentyear || calculateCurrentYear(batch),
                        currentSemester: s.currentSemester || s.currentsemester || s.semester || s.sem || '',
                        phone: s.phone || s.mobile || s.phoneNo || s.mobileNo || '',
                        email: s.primaryEmail || s.primaryemail || s.email || '',
                        profilePicURL: s.profilePicURL || s.profilepicurl || s.photoURL || s.photo || s.image || '',
                        resume: !!(s.resumeURL || s.resumeData),
                        placement: s.placement || '',
                        blocked: !!(s.isBlocked || s.blocked)
                    };
                });
                
                setStudents(mapped);
                setTotalPages(response.totalPages || 1);
                setTotalStudents(response.total || 0);
                setIsInitialLoading(false);
                
            } catch (e) {
                console.error('❌ Error fetching students:', e);
                console.error('Error details:', { message: e.message, stack: e.stack });
                
                if (!isMounted) return;
                setIsInitialLoading(false);
            }
        };
        
        fetchPaginatedStudents();
        
        return () => {
            isMounted = false;
        };
    }, [currentPage]);

    const closePopup = () => {
        setActivePopup(null);
    };

    const activeStudentSource = aiFilterActive ? aiFilteredStudents : students;
    const isTableLoading = isInitialLoading || aiFilterLoading;

    const filteredStudents = aiFilterActive
        ? activeStudentSource
        : activeStudentSource.filter(student => {
            const nameMatch = filterName === '' || student.name.toLowerCase().includes(filterName.toLowerCase());
            const branchMatch = filterDept === '' || (student.department && student.department.toUpperCase() === filterDept.toUpperCase());
            const regnoMatch = filterRegno === '' || student.regNo.toLowerCase().includes(filterRegno.toLowerCase());
            const batchMatch = filterBatch === '' || student.batch === filterBatch;

            return nameMatch && branchMatch && regnoMatch && batchMatch;
        }).sort((a, b) => {
        // Sort by register number in ascending order
        const regNoA = a.regNo || '';
        const regNoB = b.regNo || '';
        return regNoA.localeCompare(regNoB, undefined, { numeric: true });
    });
    
    const blockedStudents = filteredStudents.filter(s => s.blocked);
    const visibleStudents = viewBlocklist ? blockedStudents : filteredStudents;
    const aiColumns = aiFilterActive ? aiFilterColumns.filter((column) => AI_EXTRA_COLUMNS[column]) : [];
    const tableColumnCount = 9 + aiColumns.length;

    const getExportColumns = () => {
        const baseColumns = [
            { key: 'regNo', label: 'Reg No' },
            { key: 'name', label: 'Name' },
            { key: 'department', label: 'Branch' },
            { key: 'batch', label: 'Batch' },
            { key: 'section', label: 'Section' },
            { key: 'phone', label: 'Phone' },
            { key: 'email', label: 'Email' },
        ];

        const extraColumns = aiColumns.map((columnKey) => ({
            key: columnKey,
            label: AI_EXTRA_COLUMNS[columnKey].label,
        }));

        return [...baseColumns, ...extraColumns];
    };

    const getExportValue = (student, columnKey) => {
        if (AI_EXTRA_COLUMNS[columnKey]) {
            return AI_EXTRA_COLUMNS[columnKey].value(student);
        }

        return student[columnKey] ?? '';
    };
    
    // Check if all selected students are already blocked or unblocked
    const selectedStudents = students.filter(s => selectedStudentIds.has(s.id));
    const allSelectedAreBlocked = selectedStudents.length > 0 && selectedStudents.every(s => s.blocked);
    const allSelectedAreUnblocked = selectedStudents.length > 0 && selectedStudents.every(s => !s.blocked);
    
    // ... (Export functions - No logic change) ...
    const exportToExcel = async () => {
        try {
            setExportType('Excel');
            setExportPopupState('progress');
            setExportProgress(0);
            setShowExportMenu(false);
            
            // Simulate progress
            const progressInterval = setInterval(() => {
                setExportProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 15;
                });
            }, 100);
            
            // Generate Excel
            await new Promise(resolve => setTimeout(resolve, 300));
            const exportColumns = getExportColumns();
            const header = exportColumns.map((column) => column.label);
            const data = visibleStudents.map((student) => exportColumns.map((column) => getExportValue(student, column.key)));
            const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Students");
            
            setExportProgress(100);
            clearInterval(progressInterval);
            
            // Download file
            XLSX.writeFile(wb, "Students_Report.xlsx");
            
            // Show success
            setTimeout(() => {
                setExportPopupState('success');
                setExportProgress(0);
            }, 500);
        } catch (error) {
            console.error('Export to Excel failed:', error);
            setExportPopupState('failed');
            setExportProgress(0);
        }
    };

    const exportToPDF = async () => {
        try {
            setExportType('PDF');
            setExportPopupState('progress');
            setExportProgress(0);
            setShowExportMenu(false);
            
            // Simulate progress
            const progressInterval = setInterval(() => {
                setExportProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 15;
                });
            }, 100);
            
            // Generate PDF
            await new Promise(resolve => setTimeout(resolve, 300));
            const doc = new jsPDF('landscape');
            const exportColumns = getExportColumns();
            const columns = exportColumns.map((column) => column.label);
            const rows = visibleStudents.map((student) => exportColumns.map((column) => getExportValue(student, column.key)));

            doc.text("Students Report", 14, 15);
            
            autoTable(doc, { 
                head: [columns], 
                body: rows, 
                startY: 20, 
                styles: { fontSize: 8 } 
            });
            
            setExportProgress(100);
            clearInterval(progressInterval);
            
            // Download file
            doc.save("Students_Report.pdf");
            
            // Show success
            setTimeout(() => {
                setExportPopupState('success');
                setExportProgress(0);
            }, 500);
        } catch (error) {
            console.error('Export to PDF failed:', error);
            setExportPopupState('failed');
            setExportProgress(0);
        }
    };

    // --- JSX (ALL classNames updated to use the 'styles' object for CSS Modules) ---
    return (
        <>
            <Adnavbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
            <div className={styles['Admin-DB-layout']}>
                <Adsidebar isOpen={isSidebarOpen} onLogout={handleLogout} />
                <div className={styles['Admin-DB-main-content']}>
                    <div className={styles['Admin-DB-top-card']}>
                        {/* Filter Section */}
                        <div className={`${styles['Admin-DB-filter-section']} ${isAIFilterMode ? styles['Admin-DB-filter-section-ai-mode'] : ''}`}>
                            <div className={styles['Admin-DB-filter-header-container']}>
                                <div className={styles['Admin-DB-filter-header']}>
                                    {isAIFilterMode ? 'AI-Filter' : 'Filter & Sort'}
                                </div>
                                <button
                                    type="button"
                                    className={styles['Admin-DB-ai-toggle-btn']}
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
                                        className={styles['Admin-DB-ai-pointer-tooltip']}
                                        style={{ left: `${aiTooltip.x}px`, top: `${aiTooltip.y}px`, transform: 'translateX(-50%)' }}
                                    >
                                        {isAIFilterMode ? 'Filter & Sort' : 'AI Filter'}
                                    </div>
                                )}
                            </div>
                            {!isAIFilterMode ? (
                            <div className={styles['Admin-DB-filter-content']}>
                                <div className={styles['Admin-DB-input-wrapper']}>
                                    <label className={styles['Admin-DB-static-label']}>Name</label>
                                    <div className={`${styles['Admin-DB-text-container']} ${nameFocused ? styles['is-focused'] : ''}`}>
                                        <input type="text" className={styles['Admin-DB-text']} placeholder="Enter the Name" value={tempFilterName} onChange={(e) => setTempFilterName(e.target.value)} onFocus={() => setNameFocused(true)} onBlur={() => setNameFocused(false)} />
                                    </div>
                                </div>
                                {/* Regno Input with Static Label */}
                                <div className={styles['Admin-DB-input-wrapper']}>
                                    <label className={styles['Admin-DB-static-label']}>Regno</label>
                                    <div className={`${styles['Admin-DB-text-container']} ${regnoFocused ? styles['is-focused'] : ''}`}>
                                        <input type="text" className={styles['Admin-DB-text']} placeholder="Enter the Regno" value={tempFilterRegno} onChange={(e) => setTempFilterRegno(e.target.value)} onFocus={() => setRegnoFocused(true)} onBlur={() => setRegnoFocused(false)} />
                                    </div>
                                </div>
                                {/* Branch Dropdown with Static Label */}
                                <div className={styles['Admin-DB-input-wrapper']}>
                                   
                                    <div className={styles['Admin-DB-dropdown-container']}>
                                        <select className={styles['Admin-DB-dropdown']} value={tempFilterDept} onChange={(e) => setTempFilterDept(e.target.value)}>
                                            <option value="">Select Branch</option>
                                            {branches.map((branch, index) => (
                                                <option key={branch._id || branch.id || index} value={branch.branchAbbreviation}>
                                                    {branch.branchAbbreviation}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                {/* Batch Dropdown with Static Label */}
                                <div className={styles['Admin-DB-input-wrapper']}>
                                    <div className={styles['Admin-DB-dropdown-container']}>
                                        <select className={styles['Admin-DB-dropdown']} value={tempFilterBatch} onChange={(e) => setTempFilterBatch(e.target.value)}>
                                            <option value="">Select Batch</option>
                                            {batches.map((batch) => (
                                                <option key={batch} value={batch}>
                                                    {batch}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className={styles['Admin-DB-button-group']}>
                                    <button className={`${styles['Admin-DB-button']} ${styles['Admin-DB-view-students-btn']}`} onClick={handleViewStudents}>View Students</button>
                                    <button className={`${styles['Admin-DB-button']} ${styles['Admin-DB-blocklist-btn']}`} onClick={() => setViewBlocklist(true)}>Blocklist</button>
                                </div>
                            </div>
                            ) : (
                            <div className={styles['Admin-DB-ai-filter-content']}>
                                <textarea
                                    className={styles['Admin-DB-ai-filter-input']}
                                    placeholder="Try: 'show me placed students from TCS', 'CSE students with CGPA above 8', 'unplaced final year students', 'students who attended Infosys drive', 'students who know Python'"
                                    value={aiFilterText}
                                    onChange={(e) => setAiFilterText(e.target.value)}
                                />
                                <div className={styles['Admin-DB-ai-button-group']}>
                                    <button
                                        type="button"
                                        className={`${styles['Admin-DB-button']} ${styles['Admin-DB-ai-apply-btn']}`}
                                        onClick={handleApplyAIFilter}
                                        disabled={aiFilterLoading}
                                    >
                                        {aiFilterLoading ? 'Searching...' : 'Search'}
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles['Admin-DB-button']} ${styles['Admin-DB-ai-discard-btn']}`}
                                        onClick={handleDiscardAIFilter}
                                    >
                                        Discard
                                    </button>
                                </div>
                                {aiFilterActive && aiFilterReason && (
                                    <div className={styles['Admin-DB-ai-reason']}>
                                        <span className={styles['Admin-DB-ai-reason-icon']}>✨</span>
                                        <span className={styles['Admin-DB-ai-reason-text']}>{aiFilterReason}</span>
                                    </div>
                                )}
                            </div>
                            )}
                        </div>

                        {/* Action Cards */}
                        <div className={styles['Admin-DB-action-cards-section']}>
                            <div className={styles['Admin-DB-action-card']}>
                                <h4 className={styles['Admin-DB-action-header']}>Editing</h4>
                                <p className={styles['Admin-DB-action-description']}>Select <br/>Student <br/>Record <br/> Before <br/> Editing</p>
                                <button className={`${styles['Admin-DB-action-btn']} ${styles['Admin-DB-edit-btn']}`} onClick={handleEdit} disabled={selectedStudentIds.size !== 1 || blockInProgress || unblockInProgress || deleteInProgress}>Edit</button>

                            </div>
                            <div className={styles['Admin-DB-action-card']}>
                                <h4 className={styles['Admin-DB-action-header']}>Blocking</h4>
                                <p className={styles['Admin-DB-action-description']}>Select <br/>Student<br/> Record <br/>Before<br/> Blocking</p>
                                <button className={`${styles['Admin-DB-action-btn']} ${styles['Admin-DB-block-btn']}`} onClick={handleBlock} disabled={selectedStudentIds.size < 1 || blockInProgress || unblockInProgress || deleteInProgress || allSelectedAreBlocked}>
                                    {blockInProgress ? 'Blocking...' : 'Block'}
                                </button>

                            </div>
                            <div className={styles['Admin-DB-action-card']}>
                                <h4 className={styles['Admin-DB-action-header']}>Unblocking</h4>
                                <p className={styles['Admin-DB-action-description']}>Select <br/>Student<br/>Record<br/> Before<br/> Unblocking</p>
                                <button className={`${styles['Admin-DB-action-btn']} ${styles['Admin-DB-unblock-btn']}`} onClick={handleUnblock} disabled={selectedStudentIds.size < 1 || blockInProgress || unblockInProgress || deleteInProgress || allSelectedAreUnblocked}>
                                    {unblockInProgress ? 'Unblock..' : 'Unblock'}
                                </button>

                            </div>
                            <div className={styles['Admin-DB-action-card']}>
                                <h4 className={styles['Admin-DB-action-header']}>Deleting</h4>
                                <p className={styles['Admin-DB-action-description']}>Select <br/> Student <br/> Record <br/> Before <br/>Deleting</p>
                                <button className={`${styles['Admin-DB-action-btn']} ${styles['Admin-DB-delete-btn']}`} onClick={handleDeleteClick} disabled={selectedStudentIds.size < 1 || blockInProgress || unblockInProgress || deleteInProgress}>
                                    {deleteInProgress ? 'Deleting...' : 'Delete'}
                                </button>

                            </div>
                        </div>
                    </div>

                    {/* --- Bottom Card (Student Table) --- */}
                    <div className={styles['Admin-DB-bottom-card']}>
                        <div className={styles['Admin-DB-table-header-row']}>
                            <h3 className={styles['Admin-DB-table-title']}>
                                {isInitialLoading ? 'STUDENTS' : `STUDENTS: ${visibleStudents.length}`}
                            </h3>
                            <div className={styles['Admin-DB-table-actions']}>
                                <button
                                    className={styles['Admin-DB-zip-btn']}
                                    onClick={() => navigate('/admin/active-zip/student-database', { state: { driveData: null, source: 'student-database' } })}
                                >
                                    Zip
                                </button>
                                <div className={styles['Admin-DB-print-button-container']}>
                                    <button className={styles['Admin-DB-print-btn']} onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); }}>Print</button>
                                    {showExportMenu && (
                                        <div className={styles['Admin-DB-export-menu']}>
                                            <button onClick={exportToExcel}>Export to Excel</button>
                                            <button onClick={exportToPDF}>Export as PDF</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles['Admin-DB-table-container']}>
                            <table className={styles['Admin-DB-students-table']}>
                                <thead>
                                    <tr className={styles['Admin-DB-table-head-row']}>
                                        <th className={`${styles['Admin-DB-th']} ${styles['Admin-DB-select']}`}>Select</th> 
                                        <th className={`${styles['Admin-DB-th']} ${styles['Admin-DB-sno']}`}>S.No</th>
                                        <th className={`${styles['Admin-DB-th']} ${styles['Admin-DB-register-number']}`}>Register Number</th>
                                        <th className={`${styles['Admin-DB-th']} ${styles['Admin-DB-name']}`}>Name</th>
                                        <th className={`${styles['Admin-DB-th']} ${styles['Admin-DB-department']}`}>Branch</th>
                                        <th className={`${styles['Admin-DB-th']} ${styles['Admin-DB-year-sec']}`}>Year-Sec</th>
                                        <th className={`${styles['Admin-DB-th']} ${styles['Admin-DB-sem']}`}>Sem</th>
                                        <th className={`${styles['Admin-DB-th']} ${styles['Admin-DB-batch']}`}>Batch</th>
                                        {aiColumns.map((columnKey) => (
                                            <th key={columnKey} className={`${styles['Admin-DB-th']} ${styles['Admin-DB-ai-column']}`}>
                                                {AI_EXTRA_COLUMNS[columnKey].label}
                                            </th>
                                        ))}
                                        <th className={`${styles['Admin-DB-th']} ${styles['Admin-DB-profile']}`}>Profile</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isTableLoading ? (
                                        <tr className={styles['Admin-DB-loading-row']}>
                                            <td colSpan={tableColumnCount} className={styles['Admin-DB-loading-cell']}>
                                                <div className={styles['Admin-DB-loading-wrapper']}>
                                                    <div className={styles['Admin-DB-spinner']}></div>
                                                    <span className={styles['Admin-DB-loading-text']}>
                                                        {aiFilterLoading ? 'Searching students…' : 'Loading students…'}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : visibleStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan={tableColumnCount} style={{ textAlign: "center", color: "#2d2d2d", fontSize: "1.2rem", padding: "20px" }}>
                                                {viewBlocklist ? "No blocked students available" : "No data available"}
                                            </td>
                                        </tr>
                                    ) : (
                                        visibleStudents.map((student, index) => (
                                            <tr
                                                key={student.id}
                                                className={[
                                                    styles['Admin-DB-table-row'],
                                                    selectedStudentIds.has(student.id) && styles['Admin-DB-selected-row'],
                                                    student.blocked && styles['Admin-DB-blocked-row']
                                                ].filter(Boolean).join(' ')}
                                                onClick={() => handleStudentSelect(student.id)}
                                            >
                                                <td className={`${styles['Admin-DB-td']} ${styles['Admin-DB-select']}`} onClick={(e) => e.stopPropagation()}>
                                                    <input type="checkbox" className={styles['Admin-DB-select-checkbox']} checked={selectedStudentIds.has(student.id)} onChange={() => handleStudentSelect(student.id)} />
                                                </td>
                                                <td className={`${styles['Admin-DB-td']} ${styles['Admin-DB-sno']}`}>{index + 1}</td>
                                                <td className={`${styles['Admin-DB-td']} ${styles['Admin-DB-register-number']}`}>{student.regNo}</td>
                                                <td className={`${styles['Admin-DB-td']} ${styles['Admin-DB-name']}`}>{student.name}</td>
                                                <td className={`${styles['Admin-DB-td']} ${styles['Admin-DB-department']}`}>{student.department}</td>
                                                <td className={`${styles['Admin-DB-td']} ${styles['Admin-DB-year-sec']}`}>
                                                    {student.currentYear && student.section
                                                        ? `${student.currentYear}-${student.section}`
                                                        : student.currentYear || student.section || '--'}
                                                </td>
                                                <td className={`${styles['Admin-DB-td']} ${styles['Admin-DB-sem']}`}>{student.currentSemester || '--'}</td>
                                                <td className={`${styles['Admin-DB-td']} ${styles['Admin-DB-batch']}`}>{student.batch}</td>
                                                {aiColumns.map((columnKey) => (
                                                    <td key={`${student.id}-${columnKey}`} className={`${styles['Admin-DB-td']} ${styles['Admin-DB-ai-column']}`}>
                                                        {AI_EXTRA_COLUMNS[columnKey].render
                                                            ? AI_EXTRA_COLUMNS[columnKey].render(student)
                                                            : AI_EXTRA_COLUMNS[columnKey].value(student)}
                                                    </td>
                                                ))}
                                                <td className={`${styles['Admin-DB-td']} ${styles['Admin-DB-profile']}`} onClick={(e) => { e.stopPropagation(); handleViewProfile(student.id); }}><EyeIcon /></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* --- POPUPS --- */}
                    {activePopup === 'deleteWarning' && (
                        <div style={{
                            minHeight: '100vh',
                            width: '100vw',
                            position: 'fixed',
                            left: 0,
                            top: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0, 0, 0, 0.2)',
                            zIndex: 10000,
                        }}>
                            <DeleteConfirmationPopup 
                                onClose={closePopup} 
                                onConfirm={confirmDelete} 
                                selectedCount={selectedStudentIds.size} 
                                isDeleting={deleteInProgress}
                            />

                        </div>
                    )}
                    {activePopup === 'deleteSuccess' && (
                        <div style={{
                            minHeight: '100vh',
                            width: '100vw',
                            position: 'fixed',
                            left: 0,
                            top: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0, 0, 0, 0.2)',
                            zIndex: 10000,
                        }}>
                            <DeleteSuccessPopup onClose={closePopup} />
                        </div>
                    )}
                    {activePopup === 'blockSuccess' && (
                        <div style={{
                            minHeight: '100vh', width: '100vw', position: 'fixed', left: 0, top: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0, 0, 0, 0.2)', zIndex: 10000,
                        }}>
                            <BlockSuccessPopup onClose={closePopup} />
                        </div>
                    )}
                    {activePopup === 'unblockSuccess' && (
                        <div style={{
                            minHeight: '100vh', width: '100vw', position: 'fixed', left: 0, top: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(0, 0, 0, 0.2)', zIndex: 10000,
                        }}>
                            <UnblockSuccessPopup onClose={closePopup} />
                        </div>
                    )}

                </div>
                {isSidebarOpen && <div className={styles['Admin-DB-overlay']} onClick={() => setIsSidebarOpen(false)}></div>}
            </div>
            
            {/* Export Alerts */}
            <ExportProgressAlert 
                isOpen={exportPopupState === 'progress'} 
                progress={exportProgress}
                exportType={exportType}
            />
            
            <ExportSuccessAlert 
                isOpen={exportPopupState === 'success'} 
                onClose={() => setExportPopupState('none')}
                exportType={exportType}
            />
            
            <ExportFailedAlert 
                isOpen={exportPopupState === 'failed'} 
                onClose={() => setExportPopupState('none')}
                exportType={exportType}
            />
        </>
    );
}

export default AdminstudDB;