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
        setIsSidebarOpen(!isSidebarOpen);
    };

    // Logout Handler
    const handleLogout = () => {
        localStorage.clear();
        sessionStorage.clear();
        navigate('/');
    };

    // ... (Filter, View Profile, Select, Action handlers - No logic change) ...
    const handleViewStudents = () => {
        setViewBlocklist(false); // Reset blocklist view when viewing all students
        setFilterName(tempFilterName);
        setFilterDept(tempFilterDept);
        setFilterRegno(tempFilterRegno);
        setFilterBatch(tempFilterBatch);
    };

    const handleViewProfile = (studentId) => {
        const studentToView = students.find(s => s.id === studentId);
        if (studentToView) {
            navigate(`/admin-profile/${studentId}`, { 
                state: { 
                    mode: 'view', 
                    isBlocked: studentToView.blocked 
                } 
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
                navigate(`/admin-profile/${studentId}`, { 
                    state: { 
                        mode: 'edit', 
                        isBlocked: studentToEdit.blocked
                    } 
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
            
            // Get admin name (for now use "Admin" as placeholder, can be enhanced later)
            const adminName = localStorage.getItem('adminName') || 'Admin';
            
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

    const filteredStudents = students.filter(student => {
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
            const data = visibleStudents.map(student => [student.regNo, student.name, student.department, student.batch, student.section, student.phone, student.email]);
            const header = ["Reg No", "Name", "Branch", "Batch", "Section", "Phone", "Email"];
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
            const columns = ["Reg No", "Name", "Branch", "Batch", "Section", "Phone", "Email"];
            const rows = visibleStudents.map(student => [student.regNo, student.name, student.department, student.batch, student.section, student.phone, student.email]);

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
                        <div className={styles['Admin-DB-filter-section']}>
                            <div className={styles['Admin-DB-filter-header-container']}>
                                <div className={styles['Admin-DB-filter-header']}>Filter & Sort</div>
                                <span className={styles['Admin-DB-filter-icon-container']}>☰</span>
                            </div>
                            <div className={styles['Admin-DB-filter-content']}>
                                {/* Dynamic Class Name Update */}
                                <div className={`${styles['Admin-DB-text-container']} ${tempFilterName ? styles['has-value'] : ''} ${nameFocused ? styles['is-focused'] : ''}`}>
                                    <label className={styles['Admin-DB-floating-label']}>Name</label>
                                    <input type="text" className={styles['Admin-DB-text']} value={tempFilterName} onChange={(e) => setTempFilterName(e.target.value)} onFocus={() => setNameFocused(true)} onBlur={() => setNameFocused(false)} />
                                </div>
                                {/* Dynamic Class Name Update */}
                                <div className={`${styles['Admin-DB-text-container']} ${tempFilterRegno ? styles['has-value'] : ''} ${regnoFocused ? styles['is-focused'] : ''}`}>
                                    <label className={styles['Admin-DB-floating-label']}>Regno</label>
                                    <input type="text" className={styles['Admin-DB-text']} value={tempFilterRegno} onChange={(e) => setTempFilterRegno(e.target.value)} onFocus={() => setRegnoFocused(true)} onBlur={() => setRegnoFocused(false)} />
                                </div>
                                <div className={styles['Admin-DB-dropdown-container']}>
                                    <select className={styles['Admin-DB-dropdown']} value={tempFilterDept} onChange={(e) => setTempFilterDept(e.target.value)}>
                                        <option value="">Branch</option>
                                        {branches.map((branch, index) => (
                                            <option key={branch._id || branch.id || index} value={branch.branchAbbreviation}>
                                                {branch.branchAbbreviation}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles['Admin-DB-dropdown-container']}>
                                    <select className={styles['Admin-DB-dropdown']} value={tempFilterBatch} onChange={(e) => setTempFilterBatch(e.target.value)}>
                                        <option value="">Batch</option>
                                        {batches.map((batch) => (
                                            <option key={batch} value={batch}>
                                                {batch}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles['Admin-DB-button-group']}>
                                    <button className={`${styles['Admin-DB-button']} ${styles['Admin-DB-view-students-btn']}`} onClick={handleViewStudents}>View Students</button>
                                    <button className={`${styles['Admin-DB-button']} ${styles['Admin-DB-blocklist-btn']}`} onClick={() => setViewBlocklist(true)}>Blocklist</button>
                                </div>
                            </div>
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
                                        <th className={`${styles['Admin-DB-th']} ${styles['Admin-DB-profile']}`}>Profile</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isInitialLoading ? (
                                        <tr className={styles['Admin-DB-loading-row']}>
                                            <td colSpan="9" className={styles['Admin-DB-loading-cell']}>
                                                <div className={styles['Admin-DB-loading-wrapper']}>
                                                    <div className={styles['Admin-DB-spinner']}></div>
                                                    <span className={styles['Admin-DB-loading-text']}>Loading students…</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : visibleStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" style={{ textAlign: "center", color: "#2d2d2d", fontSize: "1.2rem", padding: "20px" }}>
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