import React, { useState, useEffect, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';
import Conavbar from '../components/Navbar/Adnavbar';
import Cosidebar from '../components/Sidebar/Adsidebar';
import styles from './AdminCompanyDrive.module.css';
import Adminicon from '../assets/Adminicon.png';
import AdminAddcompany from '../assets/AdminAddCompanyicon.svg';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import mongoDBService from '../services/mongoDBService.jsx';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

const DeleteConfirmationPopup = ({ onClose, onConfirm, selectedCount, isDeleting }) => (
    <div className={styles['Admin-cd-popup-overlay']}>
        <div className={styles['Admin-cd-popup-container']}>
            <div className={styles['Admin-cd-popup-header']}>Delete Drive</div>
            <div className={styles['Admin-cd-popup-body']}>
                <div className={styles['Admin-cd-warning-icon']}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className={styles['Admin-cd-warning-icon--circle']} cx="26" cy="26" r="25" fill="none" />
                        <path className={styles['Admin-cd-warning-icon--exclamation']} d="M26 16v12M26 34v2" stroke="#ffffff" strokeWidth="3" fill="none" />
                    </svg>
                </div>
                <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#333', fontWeight: 600 }}>Are you sure?</h2>
                <p style={{ margin: 0, color: '#888', fontSize: 16 }}>
                    Delete {selectedCount} selected drive{selectedCount > 1 ? 's' : ''}?
                </p>
            </div>
            <div className={styles['Admin-cd-popup-footer']}>
                <button
                    onClick={onClose}
                    className={styles['Admin-cd-popup-cancel-btn']}
                    disabled={isDeleting}
                >
                    Discard
                </button>
                <button
                    onClick={onConfirm}
                    className={styles['Admin-cd-popup-delete-btn']}
                    disabled={isDeleting}
                >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    </div>
);

const DeleteSuccessPopup = ({ onClose }) => (
    <div className={styles['Admin-cd-popup-overlay']}>
        <div className={styles['Admin-cd-popup-container']}>
            <div className={styles['Admin-cd-popup-header']}>Deleted !</div>
            <div className={styles['Admin-cd-popup-body']}>
                <div className={styles['Admin-cd-icon-wrapper']}>
                    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </div>
                <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#000', fontWeight: 700 }}>Drive Deleted ✓</h2>
                <p style={{ margin: 0, color: '#888', fontSize: 16 }}>The selected drive has been deleted successfully!</p>
            </div>
            <div className={styles['Admin-cd-popup-footer']}>
                <button onClick={onClose} className={styles['Admin-cd-popup-close-btn']}>Close</button>
            </div>
        </div>
    </div>
);

const BuildingIcon = () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#3e8ef7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
        <path d="M9 22v-4h6v4"></path>
        <path d="M8 6h.01"></path>
        <path d="M16 6h.01"></path>
        <path d="M12 6h.01"></path>
        <path d="M12 10h.01"></path>
        <path d="M12 14h.01"></path>
        <path d="M16 10h.01"></path>
        <path d="M16 14h.01"></path>
        <path d="M8 10h.01"></path>
        <path d="M8 14h.01"></path>
    </svg>
);

// Loading Popup Component for fetching students
const LoadingStudentsPopup = ({ isOpen }) => {
    if (!isOpen) return null;
    
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '40px',
                minWidth: '400px',
                textAlign: 'center',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    border: '5px solid #f3f3f3',
                    borderTop: '5px solid #4EA24E',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px'
                }}></div>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
                <h3 style={{ 
                    margin: '0 0 10px 0', 
                    fontSize: '24px', 
                    color: '#333',
                    fontWeight: '600'
                }}>Loading...</h3>
                <p style={{ 
                    margin: 0, 
                    color: '#888', 
                    fontSize: '16px' 
                }}>Setting up students for the drive</p>
            </div>
        </div>
    );
};

function AdminCompanyDrive({ onLogout }) {
    const navigate = useNavigate();
    useAdminAuth(); // JWT authentication verification
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Temporary filter states
    const [tempFilterCompany, setTempFilterCompany] = useState('');
    const [tempFilterDepartment, setTempFilterDepartment] = useState('');
    const [tempFilterDomain, setTempFilterDomain] = useState('');
    const [tempFilterMode, setTempFilterMode] = useState('');
    
    // Focus states for floating labels
    const [companyFocused, setCompanyFocused] = useState(false);
    const [departmentFocused, setDepartmentFocused] = useState(false);
    const [domainFocused, setDomainFocused] = useState(false);
    const [modeFocused, setModeFocused] = useState(false);
    
    // Applied filter states
    const [filterCompany, setFilterCompany] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterDomain, setFilterDomain] = useState('');
    const [filterMode, setFilterMode] = useState('');
    // Dropdown option lists derived from table content
    const [departmentOptions, setDepartmentOptions] = useState([]);
    const [dateRangeOptions, setDateRangeOptions] = useState([]);
    
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [activePopup, setActivePopup] = useState(null);
    const [deleteInProgress, setDeleteInProgress] = useState(false);
    const [exportPopupState, setExportPopupState] = useState('none');
    const [exportProgress, setExportProgress] = useState(0);
    const [exportType, setExportType] = useState('Excel');
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    
    // Company drives data
    const [companies, setCompanies] = useState([]);

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    // Listen for sidebar close event from navigation links (mobile auto-close)
    useEffect(() => {
        const handleCloseSidebar = () => {
            setIsSidebarOpen(false);
        };
        window.addEventListener('closeSidebar', handleCloseSidebar);
        return () => {
            window.removeEventListener('closeSidebar', handleCloseSidebar);
        };
    }, []);

    const fetchDrives = useCallback(async () => {
        try {
            const drives = await mongoDBService.getCompanyDrives();
            
            // Fetch all attendance records and ensure it's an array
            let attendanceRecords = [];
            try {
                const response = await mongoDBService.getAllAttendances();
                console.log('📊 Fetched attendance response:', response);
                console.log('📊 response.success:', response?.success);
                console.log('📊 response.data type:', Array.isArray(response?.data) ? 'Array' : typeof response?.data);
                console.log('📊 response.data length:', response?.data?.length);
                
                // Handle different response formats
                if (Array.isArray(response)) {
                    attendanceRecords = response;
                } else if (response && Array.isArray(response.data)) {
                    attendanceRecords = response.data;
                } else if (response && Array.isArray(response.attendances)) {
                    attendanceRecords = response.attendances;
                }
                
                console.log('📊 Extracted Attendance Records Count:', attendanceRecords.length);
                if (attendanceRecords.length > 0) {
                    console.log('📊 Sample Attendance Record:', attendanceRecords[0]);
                    console.log('📊 Sample Attendance Record has driveId?:', attendanceRecords[0].driveId);
                    console.log('📊 All DriveIds in Attendance:', attendanceRecords.map(a => ({
                        driveId: a.driveId,
                        company: a.companyName,
                        jobRole: a.jobRole,
                        startDate: a.startDate
                    })));
                } else {
                    console.warn('⚠️ No attendance records found!');
                }
            } catch (attendanceError) {
                console.error('❌ Failed to fetch attendance records:', attendanceError);
                // Continue with empty array
            }
            
            // Fetch eligible-students records to know whether students were selected for a drive
            let eligibleRecords = [];
            try {
                const eligibleResp = await mongoDBService.getAllEligibleStudents();
                console.log('Raw eligible students response:', eligibleResp);
                if (Array.isArray(eligibleResp)) {
                    eligibleRecords = eligibleResp;
                } else if (eligibleResp && Array.isArray(eligibleResp.data)) {
                    eligibleRecords = eligibleResp.data;
                } else if (eligibleResp && Array.isArray(eligibleResp.eligibleStudents)) {
                    eligibleRecords = eligibleResp.eligibleStudents;
                }
                console.log('Parsed eligible records:', eligibleRecords);
                console.log('Eligible records count:', eligibleRecords.length);
                if (eligibleRecords.length > 0) {
                    console.log('Sample eligible record:', eligibleRecords[0]);
                    console.log('Sample eligible record keys:', Object.keys(eligibleRecords[0]));
                    console.log('Sample eligible record driveId:', eligibleRecords[0].driveId);
                    console.log('All driveIds in eligible records:', eligibleRecords.map(er => er.driveId));
                }
            } catch (eligibleError) {
                console.warn('Failed to fetch eligible students records:', eligibleError);
            }

            // Map drives with attendance and eligibility status
            const drivesWithAttendance = (drives || []).map(drive => {
                // Helper to normalize dates for comparison
                const normalizeDate = (d) => {
                    if (!d) return null;
                    const dt = new Date(d);
                    if (isNaN(dt.getTime())) return null;
                    return dt.toISOString().split('T')[0];
                };

                const driveStart = normalizeDate(drive.startingDate);
                const driveEnd = normalizeDate(drive.endingDate);
                const driveId = drive._id;

                console.log(`\n🔍 Processing Drive: ${drive.companyName} - ${drive.jobRole} [${driveId}]`);
                console.log(`  Drive Details:`, { _id: driveId, startDate: driveStart, endDate: driveEnd });

                // Check if attendance exists for this SPECIFIC drive (match by driveId)
                const hasAttendance = attendanceRecords.some(attendance => {
                    // Convert both IDs to strings for comparison (in case one is ObjectId)
                    const attendanceDriveIdStr = attendance.driveId ? String(attendance.driveId) : null;
                    const driveIdStr = driveId ? String(driveId) : null;
                    
                    console.log(`  📋 Comparing: "${attendanceDriveIdStr}" === "${driveIdStr}"`);
                    
                    // First try to match by driveId
                    if (attendanceDriveIdStr && driveIdStr && attendanceDriveIdStr === driveIdStr) {
                        console.log(`  ✅ MATCH FOUND by driveId!`);
                        return true;
                    }
                    
                    // Fallback: match by company, jobRole, and date if driveId is not available
                    const companyMatch = attendance.companyName === drive.companyName;
                    const jobRoleMatch = attendance.jobRole === drive.jobRole;
                    
                    // More flexible date matching - check if attendance date is within the drive date range
                    const attendanceDateNorm = normalizeDate(attendance.startDate);
                    const driveDateMatch = attendanceDateNorm === driveStart || 
                                          attendanceDateNorm === driveEnd ||
                                          (attendanceDateNorm && driveStart && driveEnd && 
                                           attendanceDateNorm >= driveStart && attendanceDateNorm <= driveEnd);
                    
                    const match = companyMatch && jobRoleMatch && driveDateMatch;
                    
                    if (attendance.companyName === drive.companyName && attendance.jobRole === drive.jobRole) {
                        console.log(`🔍 Checking attendance for ${drive.companyName}-${drive.jobRole}:`, {
                            attendanceDriveId: attendance.driveId,
                            targetDriveId: driveId,
                            companyMatch,
                            jobRoleMatch,
                            dateMatch: driveDateMatch,
                            finalMatch: match,
                            attendanceDate: attendance.startDate,
                            attendanceDateNorm,
                            driveDate: drive.startingDate,
                            driveStart,
                            driveEnd
                        });
                    }
                    return match;
                });

                // Check if eligible students were created for this SPECIFIC drive (match by driveId)
                const hasEligible = eligibleRecords.some(er => {
                    const match = er.driveId === driveId;
                    if (er.driveId) {
                        console.log(`  Comparing eligible record driveId "${er.driveId}" (type: ${typeof er.driveId}) with drive._id "${driveId}" (type: ${typeof driveId}) = ${match}`);
                    }
                    return match;
                });

                console.log(`\n  ✨ FINAL RESULT for ${drive.companyName} - ${drive.jobRole}:`);
                console.log(`     Attendance Taken: ${hasAttendance}`);
                console.log(`     Eligible Created: ${hasEligible}`);

                return {
                    ...drive,
                    attendanceTaken: hasAttendance,
                    eligibleCreated: hasEligible
                };
            });

            // Compute unique departments / eligible branches
            const deptSet = new Set();
            const dateRangeSet = new Set();

            drivesWithAttendance.forEach(d => {
                if (d.department && String(d.department).trim()) {
                    deptSet.add(String(d.department).trim());
                }
                if (Array.isArray(d.eligibleBranches)) {
                    d.eligibleBranches.forEach(b => {
                        if (b && String(b).trim()) deptSet.add(String(b).trim());
                    });
                }

                const formatDate = (date) => {
                    if (!date) return null;
                    const dt = new Date(date);
                    if (isNaN(dt.getTime())) return null;
                    const day = String(dt.getDate()).padStart(2, '0');
                    const month = String(dt.getMonth() + 1).padStart(2, '0');
                    const year = dt.getFullYear();
                    return `${day}-${month}-${year}`;
                };

                const start = formatDate(d.startingDate);
                const end = formatDate(d.endingDate);
                if (start && end) {
                    dateRangeSet.add(`${start} - ${end}`);
                } else if (start && !end) {
                    dateRangeSet.add(`${start} - N/A`);
                } else if (!start && end) {
                    dateRangeSet.add(`N/A - ${end}`);
                }
            });

            setCompanies(drivesWithAttendance);
            setDepartmentOptions(['', ...Array.from(deptSet).sort()]);
            setDateRangeOptions(['', ...Array.from(dateRangeSet).sort()]);
        } catch (error) {
            console.error("Failed to fetch company drives:", error);
            setCompanies([]); // Set empty array on error to prevent crash
        } finally {
            setIsInitialLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDrives();
    }, [fetchDrives]);

    // Listen for eligible-students creation events and refresh drives so the action icon updates
    useEffect(() => {
        const handler = (e) => {
            console.log('eligibleStudentsAdded event received:', e && e.detail);
            fetchDrives();
        };
        window.addEventListener('eligibleStudentsAdded', handler);
        return () => window.removeEventListener('eligibleStudentsAdded', handler);
    }, [fetchDrives]);

    // Refresh drives when page becomes visible (e.g., after navigating back)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log('Page became visible, refreshing drives...');
                fetchDrives();
            }
        };
        
        const handleFocus = () => {
            console.log('Window focused, refreshing drives...');
            fetchDrives();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchDrives]);
    
    // Selected company IDs
    const [selectedCompanyIds, setSelectedCompanyIds] = useState(new Set());
    
    useEffect(() => {
        setFilterCompany(tempFilterCompany);
        setFilterDepartment(tempFilterDepartment);
        setFilterDomain(tempFilterDomain);
        setFilterMode(tempFilterMode);
    }, [tempFilterCompany, tempFilterDepartment, tempFilterDomain, tempFilterMode]);
    
    const handleCompanySelect = (id) => {
        setSelectedCompanyIds(prevIds => {
            const newIds = new Set(prevIds);
            if (newIds.has(id)) {
                newIds.delete(id);
            } else {
                newIds.add(id);
            }
            return newIds;
        });
    };
    
    const isCompanySelected = selectedCompanyIds.size > 0;
    const isSingleCompanySelected = selectedCompanyIds.size === 1;

    const handleEdit = () => {
        if (selectedCompanyIds.size === 1) {
            const companyId = Array.from(selectedCompanyIds)[0];
            const company = companies.find(c => c._id === companyId);

            if (!company) {
                alert("Selected drive could not be found. Please refresh and try again.");
                return;
            }

            navigate('/admin/company-drive/add', {
                state: {
                    editingDriveId: companyId,
                    editingDrive: company
                }
            });
        } else if (selectedCompanyIds.size === 0) {
            alert("Please select a drive to Edit.");
        } else {
            alert("Please select only one drive to Edit.");
        }
    };

    const handleDeleteClick = () => {
        if (selectedCompanyIds.size > 0) {
            setActivePopup('deleteWarning');
        } else {
            alert("Please select drive(s) to Delete.");
        }
    };

    const confirmDelete = async () => {
        setDeleteInProgress(true);
        try {
            const promises = Array.from(selectedCompanyIds).map(id => mongoDBService.deleteCompanyDrive(id));
            await Promise.all(promises);

            await fetchDrives();
            setSelectedCompanyIds(new Set());
            setActivePopup('deleteSuccess');
        } catch (error) {
            console.error("Failed to delete company drives:", error);
            alert("An error occurred while deleting the drives. Please try again.");
            setActivePopup(null);
        } finally {
            setDeleteInProgress(false);
        }
    };

    const closePopup = () => {
        setActivePopup(null);
    };

    const handleAddCompany = () => {
        navigate('/admin/company-drive/add');
    };

    const handleViewDrive = (company) => {
        navigate('/admin/company-drive/add', { 
            state: { 
                viewMode: true,
                editingDrive: company 
            } 
        });
    };

    const filteredCompanies = companies.filter(company => {
        const q = (filterCompany || '').trim().toLowerCase();
        const companyName = company.companyName || '';
        const jobRole = company.jobRole || '';
        const companyMatch = q === '' || companyName.toLowerCase().includes(q) || jobRole.toLowerCase().includes(q);

        const dept = (company.department || '').trim();
        const branches = Array.isArray(company.eligibleBranches) ? company.eligibleBranches.map(b => (b||'').trim()) : [];
        const deptFilter = (filterDepartment || '').trim();
        const departmentMatch = deptFilter === '' || dept.toLowerCase() === deptFilter.toLowerCase() || branches.some(b => b.toLowerCase() === deptFilter.toLowerCase());

        const formatDate = (date) => {
            if (!date) return null;
            const d = new Date(date);
            if (isNaN(d.getTime())) return null;
            return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
        };
        const start = formatDate(company.startingDate);
        const end = formatDate(company.endingDate);
        const companyDateRange = start && end ? `${start} - ${end}` : start && !end ? `${start} - N/A` : !start && end ? `N/A - ${end}` : '';
        const domainFilter = (filterDomain || '').trim();
        const domainMatch = domainFilter === '' || (companyDateRange && companyDateRange === domainFilter);

        const modeMatch = filterMode === '' || company.mode === filterMode;

        return companyMatch && departmentMatch && domainMatch && modeMatch;
    });

    const exportToExcel = async () => {
        setShowExportMenu(false);
        if (!filteredCompanies.length) {
            alert('No records available for export.');
            return;
        }

        setExportType('Excel');
        setExportPopupState('progress');
        setExportProgress(0);

        // Simulate progress from 0 to 90%
        const progressInterval = setInterval(() => {
            setExportProgress((prevProgress) => {
                if (prevProgress >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prevProgress + 15;
            });
        }, 100);

        try {
            // Small delay to ensure progress animation is visible
            await new Promise((resolve) => setTimeout(resolve, 300));

            const formatDate = (date) => {
                if (!date) return 'N/A';
                const d = new Date(date);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                return `${day}-${month}-${year}`;
            };
            const data = filteredCompanies.map(company => [
                company.companyName,
                company.jobRole,
                formatDate(company.startingDate),
                formatDate(company.endingDate),
                company.mode,
                company.department
            ]);
            const header = ["Company", "Job Role", "Start Date", "End Date", "Mode", "Department"];
            const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Company Drives");
            XLSX.writeFile(wb, "Company_Drive_Report.xlsx");

            clearInterval(progressInterval);
            setExportProgress(100);
            await new Promise((resolve) => setTimeout(resolve, 300));
            setExportPopupState('success');
        } catch (error) {
            clearInterval(progressInterval);
            console.error('Export to Excel failed:', error);
            setExportPopupState('failed');
        }
    };

    const exportToPDF = async () => {
        setShowExportMenu(false);
        if (!filteredCompanies.length) {
            alert('No records available for export.');
            return;
        }

        setExportType('PDF');
        setExportPopupState('progress');
        setExportProgress(0);

        // Simulate progress from 0 to 90%
        const progressInterval = setInterval(() => {
            setExportProgress((prevProgress) => {
                if (prevProgress >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prevProgress + 15;
            });
        }, 100);

        try {
            // Small delay to ensure progress animation is visible
            await new Promise((resolve) => setTimeout(resolve, 300));

            const doc = new jsPDF('landscape');
            const formatDate = (date) => {
                if (!date) return 'N/A';
                const d = new Date(date);
                const day = String(d.getDate()).padStart(2, '0');
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const year = d.getFullYear();
                return `${day}-${month}-${year}`;
            };
            const columns = ["Company", "Job Role", "Start Date", "End Date", "Mode", "Department"];
            const rows = filteredCompanies.map(company => [
                company.companyName,
                company.jobRole,
                formatDate(company.startingDate),
                formatDate(company.endingDate),
                company.mode,
                company.department
            ]);
            doc.text("Company Drive Report", 14, 15);
            autoTable(doc, { head: [columns], body: rows, startY: 20, styles: { fontSize: 8 } });
            doc.save("Company_Drive_Report.pdf");

            clearInterval(progressInterval);
            setExportProgress(100);
            await new Promise((resolve) => setTimeout(resolve, 300));
            setExportPopupState('success');
        } catch (error) {
            clearInterval(progressInterval);
            console.error('Export to PDF failed:', error);
            setExportPopupState('failed');
        }
    };

    return (
        <>
            {activePopup === 'deleteWarning' && (
                <DeleteConfirmationPopup
                    onClose={closePopup}
                    onConfirm={confirmDelete}
                    selectedCount={selectedCompanyIds.size}
                    isDeleting={deleteInProgress}
                />
            )}
            {activePopup === 'deleteSuccess' && (
                <DeleteSuccessPopup onClose={closePopup} />
            )}
            {isSidebarOpen && (
                <div
                    className={styles['Admin-cd-overlay']}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            <Conavbar Adminicon={Adminicon} onLogout={onLogout} onToggleSidebar={toggleSidebar} />
            <div className={styles['Admin-cd-layout']}>
                <Cosidebar isOpen={isSidebarOpen} onLogout={onLogout} />
                <div className={styles['Admin-cd-main-content']}>
                    <div className={styles['Admin-cd-top-card']}>
                        
                           {/* Add Drive Card */}
                           <div className={`${styles['Admin-cd-action-addcard']} ${styles['Admin-cd-add-card']}`} onClick={handleAddCompany}>
                                <div className={styles['Admin-cd-add-icon']}>
                                    <img src={AdminAddcompany} alt="Add Drive" />
                                </div>
                                <h4 className={styles['Admin-cd-add-header']}>Add <br/> Drive</h4>
                                <p className={styles['Admin-cd-add-description']}>
                                    Schedule new Drive <br/>for Students
                                </p>
                            </div>
                        
                        {/* Filter Section */}
                        <div className={styles['Admin-cd-filter-section']}>
                            <div className={styles['Admin-cd-filter-header-container']}>
                                <div className={styles['Admin-cd-filter-header']}>Company Drive</div>
                                {/* <span className={styles['Admin-cd-filter-icon-container']}>☰</span> */}
                            </div>
                            <div className={styles['Admin-cd-filter-content']}>
                                {/* Company Name Filter */}
                                <div className={`${styles['Admin-cd-text-container']} ${tempFilterCompany ? styles['has-value'] : ''} ${companyFocused ? styles['is-focused'] : ''}`}>
                                    <label className={styles['Admin-cd-floating-label']}>Search Company/Job Role</label>
                                    <input
                                        type="text"
                                        className={styles['Admin-cd-text']}
                                        value={tempFilterCompany}
                                        onChange={(e) => setTempFilterCompany(e.target.value)}
                                        onFocus={() => setCompanyFocused(true)}
                                        onBlur={() => setCompanyFocused(false)}
                                    />
                                </div>

                                {/* Department Filter */}
                                <div className={`${styles['Admin-cd-text-container']} ${tempFilterDepartment ? styles['has-value'] : ''} ${departmentFocused ? styles['is-focused'] : ''}`}>
                                    <label className={styles['Admin-cd-floating-label']}>Search by Department</label>
                                    <select
                                        className={styles['Admin-cd-text']}
                                        value={tempFilterDepartment}
                                        onChange={(e) => setTempFilterDepartment(e.target.value)}
                                        onFocus={() => setDepartmentFocused(true)}
                                        onBlur={() => setDepartmentFocused(false)}
                                    >
                                        {departmentOptions && departmentOptions.length > 0 ? (
                                            departmentOptions.map((opt, idx) => (
                                                <option key={idx} value={opt}>{opt === '' ? 'All Departments' : opt}</option>
                                            ))
                                        ) : (
                                            <option value="">All Departments</option>
                                        )}
                                    </select>
                                </div>

                                {/* Domain Filter */}
                                <div className={`${styles['Admin-cd-text-container']} ${tempFilterDomain ? styles['has-value'] : ''} ${domainFocused ? styles['is-focused'] : ''}`}>
                                    <label className={styles['Admin-cd-floating-label']}>Start Date-End Date</label>
                                    <select
                                        className={styles['Admin-cd-text']}
                                        value={tempFilterDomain}
                                        onChange={(e) => setTempFilterDomain(e.target.value)}
                                        onFocus={() => setDomainFocused(true)}
                                        onBlur={() => setDomainFocused(false)}
                                    >
                                        {dateRangeOptions && dateRangeOptions.length > 0 ? (
                                            dateRangeOptions.map((opt, idx) => (
                                                <option key={idx} value={opt}>{opt === '' ? 'All Dates' : opt}</option>
                                            ))
                                        ) : (
                                            <option value="">All Dates</option>
                                        )}
                                    </select>
                                </div>

                                {/* Mode Filter - Dropdown */}
                                <div className={`${styles['Admin-cd-text-container']} ${tempFilterMode ? styles['has-value'] : ''} ${modeFocused ? styles['is-focused'] : ''}`}>
                                    <label className={styles['Admin-cd-floating-label']}>Search Mode</label>
                                    <select
                                        className={styles['Admin-cd-text']}
                                        value={tempFilterMode}
                                        onChange={(e) => setTempFilterMode(e.target.value)}
                                        onFocus={() => setModeFocused(true)}
                                        onBlur={() => setModeFocused(false)}
                                    >
                                        <option value="">Search Mode</option>
                                        <option value="Online">Online</option>
                                        <option value="Offline">Offline</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Action Cards Section */}
                        <div className={styles['Admin-cd-action-cards-section']}>
                            {/* Edit Card */}
                            <div className={styles['Admin-cd-action-card']}>
                                <h4 className={styles['Admin-cd-action-header']}>Editing</h4>
                                <p className={styles['Admin-cd-action-description']}>
                                    Select The<br/>Drive<br/>Before<br/>Editing
                                </p>
                                <button
                                    className={`${styles['Admin-cd-action-btn']} ${styles['Admin-cd-edit-btn']}`}
                                    onClick={handleEdit}
                                    disabled={!isSingleCompanySelected}
                                >
                                    Edit
                                </button>
                            </div>

                            {/* Delete Card */}
                            <div className={styles['Admin-cd-action-card']}>
                                <h4 className={styles['Admin-cd-action-header']}>Deleting</h4>
                                <p className={styles['Admin-cd-action-description']}>
                                    Select The<br/>Drive<br/>Before<br/>Deleting
                                </p>
                                <button
                                    className={`${styles['Admin-cd-action-btn']} ${styles['Admin-cd-delete-btn']}`}
                                    onClick={handleDeleteClick}
                                    disabled={!isCompanySelected}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Company Drive Table Section */}
                    <div className={styles['Admin-cd-bottom-card']}>
                        <div className={styles['Admin-cd-table-header-row']}>
                            <h3 className={styles['Admin-cd-table-title']}>COMPANY DRIVE</h3>
                            <div className={styles['Admin-cd-table-actions']}>
                                <div className={styles['Admin-cd-print-button-container']}>
                                    <button 
                                        className={styles['Admin-cd-print-btn']}
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                    >
                                        Print
                                    </button>
                                    {showExportMenu && (
                                        <div className={styles['Admin-cd-export-menu']}>
                                            <button onClick={exportToExcel}>Export to Excel</button>
                                            <button onClick={exportToPDF}>Export to PDF</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className={styles['Admin-cd-table-container']}>
                            <table className={styles['Admin-cd-students-table']}>
                                <thead>
                                    <tr className={styles['Admin-cd-table-head-row']}>
                                        <th className={`${styles['Admin-cd-th']} ${styles['Admin-cd-checkbox']}`}>Select</th>
                                        <th className={`${styles['Admin-cd-th']} ${styles['Admin-cd-sno']}`}>S.No</th>
                                        <th className={`${styles['Admin-cd-th']} ${styles['Admin-cd-company']}`}>Company</th>
                                        <th className={`${styles['Admin-cd-th']} ${styles['Admin-cd-job-role']}`}>Job Role</th>
                                        <th className={`${styles['Admin-cd-th']} ${styles['Admin-cd-date']}`}>Start Date</th>
                                        <th className={`${styles['Admin-cd-th']} ${styles['Admin-cd-date']}`}>End Date</th>
                                        <th className={`${styles['Admin-cd-th']} ${styles['Admin-cd-rounds']}`}>Rounds</th>
                                        <th className={`${styles['Admin-cd-th']} ${styles['Admin-cd-mode']}`}>Mode</th>
                                        <th className={`${styles['Admin-cd-th']} ${styles['Admin-cd-domain']}`}>Department</th>
                                        <th className={`${styles['Admin-cd-th']} ${styles['Admin-cd-view']}`}>View</th>
                                        <th className={`${styles['Admin-cd-th']} ${styles['Admin-cd-action']}`}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isInitialLoading ? (
                                        <tr className={styles['Admin-cd-loading-row']}>
                                            <td colSpan="12" className={styles['Admin-cd-loading-cell']}>
                                                <div className={styles['Admin-cd-loading-wrapper']}>
                                                    <div className={styles['Admin-cd-spinner']}></div>
                                                    <span className={styles['Admin-cd-loading-text']}>Loading company drives…</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredCompanies.length === 0 ? (
                                        <tr className={styles['Admin-cd-table-row']}>
                                            <td colSpan="12" className={styles['Admin-cd-td']} style={{ textAlign: 'center' }}>
                                                No drives found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCompanies.map((company, index) => (
                                            <tr
                                                key={company._id}
                                                className={`${styles['Admin-cd-table-row']} ${selectedCompanyIds.has(company._id) ? styles['Admin-cd-selected-row'] : ''}`}
                                            >
                                                <td className={`${styles['Admin-cd-td']} ${styles['Admin-cd-checkbox']}`}>
                                                    <input
                                                        type="checkbox"
                                                        className={styles['Admin-cd-checkbox-input']}
                                                        checked={selectedCompanyIds.has(company._id)}
                                                        onChange={() => handleCompanySelect(company._id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </td>
                                                <td className={`${styles['Admin-cd-td']} ${styles['Admin-cd-sno']}`}>{index + 1}</td>
                                                <td className={`${styles['Admin-cd-td']} ${styles['Admin-cd-company']}`}>{company.companyName}</td>
                                                <td className={`${styles['Admin-cd-td']} ${styles['Admin-cd-job-role']}`}>{company.jobRole}</td>
                                                <td className={`${styles['Admin-cd-td']} ${styles['Admin-cd-date']}`}>
                                                    {company.startingDate ? (() => {
                                                        const d = new Date(company.startingDate);
                                                        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                                                    })() : 'N/A'}
                                                </td>
                                                <td className={`${styles['Admin-cd-td']} ${styles['Admin-cd-date']}`}>
                                                    {company.endingDate ? (() => {
                                                        const d = new Date(company.endingDate);
                                                        return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
                                                    })() : 'N/A'}
                                                </td>
                                                <td className={`${styles['Admin-cd-td']} ${styles['Admin-cd-rounds']}`}>
                                                    {company.rounds || company.numberOfRounds || 'N/A'}
                                                </td>
                                                <td className={`${styles['Admin-cd-td']} ${styles['Admin-cd-mode']}`}>{company.mode}</td>
                                                <td className={`${styles['Admin-cd-td']} ${styles['Admin-cd-domain']}`}>
                                                    {Array.isArray(company.eligibleBranches) && company.eligibleBranches.length > 0
                                                        ? company.eligibleBranches.join(', ')
                                                        : company.department || '—'}
                                                </td>
                                                <td className={`${styles['Admin-cd-td']} ${styles['Admin-cd-view']}`}>
                                                    <svg 
                                                        width="24" 
                                                        height="24" 
                                                        viewBox="0 0 24 24" 
                                                        fill="none" 
                                                        xmlns="http://www.w3.org/2000/svg" 
                                                        style={{ cursor: 'pointer', margin: '0 auto', display: 'block' }}
                                                        onClick={() => handleViewDrive(company)}
                                                    >
                                                        <path d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z" fill="#4EA24E" opacity="0.3"/>
                                                        <circle cx="12" cy="12.5" r="3.5" fill="#4EA24E"/>
                                                    </svg>
                                                </td>
                                                <td className={`${styles['Admin-cd-td']} ${styles['Admin-cd-action']}`}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                                        {(() => {
                                                            const status = company.driveStatus || 'not-started';
                                                            const attendanceTaken = company.attendanceTaken || false;
                                                            const eligibleCreated = company.eligibleCreated || false;
                                                            
                                                            if (status === 'completed') {
                                                                return (
                                                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ cursor: 'default' }} title="Drive Completed">
                                                                        <circle cx="12" cy="12" r="10" fill="#4EA24E"/>
                                                                        <path d="M7 12L10 15L17 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                                    </svg>
                                                                );
                                                            }
                                                            
                                                            if (attendanceTaken) {
                                                                // Show Play button if attendance is taken
                                                                return (
                                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ cursor: 'pointer' }} onClick={async () => {
                                                                        setIsLoadingStudents(true);
                                                                        // Small delay to show loading popup
                                                                        await new Promise(resolve => setTimeout(resolve, 500));
                                                                        
                                                                        // Pass the current company object directly - it's already the specific drive from the table row
                                                                        // No need to extract from drives array since table rows show individual drives
                                                                        navigate('/admin/company-drive/details', { 
                                                                            state: { 
                                                                                company: company, 
                                                                                driveId: company._id,
                                                                                startingDate: company.startingDate
                                                                            } 
                                                                        });
                                                                    }} title="Start Drive">
                                                                        <circle cx="12" cy="12" r="10" fill="#4EA24E"/>
                                                                        <path d="M10 8L16 12L10 16V8Z" fill="white"/>
                                                                    </svg>
                                                                );
                                                            }

                                                            // If eligible students not created yet, show an icon and navigate to eligible students selection page
                                                            if (!eligibleCreated) {
                                                                return (
                                                                    <svg
                                                                        width="20"
                                                                        height="20"
                                                                        viewBox="0 0 24 24"
                                                                        fill="none"
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        style={{ cursor: 'pointer' }}
                                                                        onClick={() => {
                                                                            // Format dates to YYYY-MM-DD format
                                                                            const formatDate = (dateString) => {
                                                                                if (!dateString) return '';
                                                                                const date = new Date(dateString);
                                                                                return date.toISOString().split('T')[0];
                                                                            };

                                                                            navigate('/admin-student-application', {
                                                                                state: {
                                                                                    filterData: {
                                                                                        companyName: company.companyName,
                                                                                        driveStartDate: formatDate(company.startingDate),
                                                                                        driveEndDate: formatDate(company.endingDate),
                                                                                        totalRound: company.rounds || company.numberOfRounds || '',
                                                                                        jobs: company.jobRole,
                                                                                        department:
                                                                                            Array.isArray(company.eligibleBranches) && company.eligibleBranches.length > 0
                                                                                                ? company.eligibleBranches.join(', ')
                                                                                                : company.department,
                                                                                    },
                                                                                },
                                                                            });
                                                                        }}
                                                                        title="Select Eligible Students"
                                                                    >
                                                                        <circle cx="12" cy="12" r="10" fill="#4EA24E" />
                                                                        <path
                                                                            d="M9 12l2 2 4-4"
                                                                            stroke="white"
                                                                            strokeWidth="2"
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                        />
                                                                    </svg>
                                                                );
                                                            }

                                                            // Show Attendance icon if attendance not taken but eligible students exist
                                                            return (
                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin-attendance', { state: { companyData: company } })} title="Take Attendance">
                                                                    <rect x="3" y="4" width="18" height="18" rx="2" fill="#4EA24E"/>
                                                                    <path d="M8 2V6M16 2V6" stroke="#4EA24E" strokeWidth="2" strokeLinecap="round"/>
                                                                    <line x1="3" y1="10" x2="21" y2="10" stroke="white" strokeWidth="2"/>
                                                                    <circle cx="8" cy="15" r="1.5" fill="white"/>
                                                                    <circle cx="12" cy="15" r="1.5" fill="white"/>
                                                                    <circle cx="16" cy="15" r="1.5" fill="white"/>
                                                                </svg>
                                                            );
                                                        })()}
                                                    </div>
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
            
            <LoadingStudentsPopup isOpen={isLoadingStudents} />
        </>
    );
}

export default AdminCompanyDrive;