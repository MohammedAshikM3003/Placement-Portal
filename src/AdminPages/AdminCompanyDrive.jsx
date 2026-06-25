import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { useNavigate } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';
import Conavbar from '../components/Navbar/Adnavbar';
import Cosidebar from '../components/Sidebar/Adsidebar';
import styles from './AdminCompanyDrive.module.css';
import Adminicon from '../assets/Adminicon.png';
import AdminAddcompany from '../assets/Adminschedulenewdrive.svg';
import EligibleStudentsIcon from '../assets/ad_cd_eligiblestu.svg';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import mongoDBService from '../services/mongoDBService.jsx';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';
import AdCalendar from '../components/Calendar/Ad_Calendar.jsx';

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

const toYmd = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const toDmy = (ymdStr) => {
    if (!ymdStr) return '';
    const [y, m, d] = ymdStr.split('-');
    if (!y || !m || !d) return ymdStr;
    return `${d}-${m}-${y}`;
};

function AdminCompanyDrive({ onLogout }) {
    const navigate = useNavigate();
    useAdminAuth(); // JWT authentication verification
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Temporary filter states
    const [tempFilterCompany, setTempFilterCompany] = useState('');
    const [tempFilterDepartment, setTempFilterDepartment] = useState('');
    const [tempFilterStartDate, setTempFilterStartDate] = useState('');
    const [tempFilterEndDate, setTempFilterEndDate] = useState('');
    const [tempFilterMode, setTempFilterMode] = useState('');

    // Focus states for floating labels
    const [companyFocused, setCompanyFocused] = useState(false);
    const [departmentFocused, setDepartmentFocused] = useState(false);
    const [startDateFocused, setStartDateFocused] = useState(false);
    const [endDateFocused, setEndDateFocused] = useState(false);
    const [modeFocused, setModeFocused] = useState(false);

    // Applied filter states
    const [filterCompany, setFilterCompany] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterMode, setFilterMode] = useState('');
    // Dropdown option lists derived from table content
    const [departmentOptions, setDepartmentOptions] = useState([]);

    const [showExportMenu, setShowExportMenu] = useState(false);
    const [activePopup, setActivePopup] = useState(null);
    const [deleteInProgress, setDeleteInProgress] = useState(false);
    const [exportPopupState, setExportPopupState] = useState('none');
    const [exportProgress, setExportProgress] = useState(0);
    const [exportType, setExportType] = useState('Excel');
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [navPopupState, setNavPopupState] = useState('none');
    const [navProgress, setNavProgress] = useState(0);

    // Company drives data
    const [companies, setCompanies] = useState([]);

    // Date selection first clicked tracker ('none', 'start-first', 'end-first')
    const [dateSelectionMode, setDateSelectionMode] = useState('none');

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    // List of drives matching current non-date filters (with normalized YYYY-MM-DD dates)
    const drivesList = useMemo(() => {
        const q = (tempFilterCompany || '').trim().toLowerCase();
        const deptFilter = (tempFilterDepartment || '').trim();
        const modeFilter = tempFilterMode;

        return companies.map(c => ({
            ...c,
            startYmd: toYmd(c.startingDate),
            endYmd: toYmd(c.endingDate)
        })).filter(c => {
            if (!c.startYmd || !c.endYmd) return false;
            
            // Match Company / Job Role
            if (q) {
                const companyName = c.companyName || '';
                const jobRole = c.jobRole || '';
                if (!companyName.toLowerCase().includes(q) && !jobRole.toLowerCase().includes(q)) return false;
            }

            // Match Department / Branch
            if (deptFilter) {
                const dept = (c.department || '').trim();
                const branches = Array.isArray(c.eligibleBranches) ? c.eligibleBranches.map(b => (b || '').trim()) : [];
                if (dept.toLowerCase() !== deptFilter.toLowerCase() && !branches.some(b => b.toLowerCase() === deptFilter.toLowerCase())) return false;
            }

            // Match Mode
            if (modeFilter && c.mode !== modeFilter) return false;

            return true;
        });
    }, [companies, tempFilterCompany, tempFilterDepartment, tempFilterMode]);

    // Unique start dates for calendar when no dates are selected
    const uniqueStartDates = useMemo(() => {
        const dates = drivesList.map(d => d.startYmd);
        return Array.from(new Set(dates)).sort();
    }, [drivesList]);

    // Unique end dates for calendar when no dates are selected
    const uniqueEndDates = useMemo(() => {
        const dates = drivesList.map(d => d.endYmd);
        return Array.from(new Set(dates)).sort();
    }, [drivesList]);

    // Matching start dates for the selected End Date
    const matchingStartDates = useMemo(() => {
        if (!tempFilterEndDate) return [];
        const dates = drivesList
            .filter(d => d.endYmd === tempFilterEndDate)
            .map(d => d.startYmd);
        return Array.from(new Set(dates)).sort();
    }, [drivesList, tempFilterEndDate]);

    // Matching end dates for the selected Start Date
    const matchingEndDates = useMemo(() => {
        if (!tempFilterStartDate) return [];
        const dates = drivesList
            .filter(d => d.startYmd === tempFilterStartDate)
            .map(d => d.endYmd);
        return Array.from(new Set(dates)).sort();
    }, [drivesList, tempFilterStartDate]);

    // Auto-fetch logic when Start Date is selected
    useEffect(() => {
        if (tempFilterStartDate && dateSelectionMode === 'start-first') {
            if (matchingEndDates.length === 1) {
                const autoEnd = matchingEndDates[0];
                if (tempFilterEndDate !== autoEnd) {
                    setTempFilterEndDate(autoEnd);
                }
            } else if (matchingEndDates.length > 1) {
                if (tempFilterEndDate && !matchingEndDates.includes(tempFilterEndDate)) {
                    setTempFilterEndDate('');
                }
            } else {
                setTempFilterEndDate('');
            }
        }
    }, [tempFilterStartDate, matchingEndDates, tempFilterEndDate, dateSelectionMode]);

    // Auto-fetch logic when End Date is selected
    useEffect(() => {
        if (tempFilterEndDate && dateSelectionMode === 'end-first') {
            if (matchingStartDates.length === 1) {
                const autoStart = matchingStartDates[0];
                if (tempFilterStartDate !== autoStart) {
                    setTempFilterStartDate(autoStart);
                }
            } else if (matchingStartDates.length > 1) {
                if (tempFilterStartDate && !matchingStartDates.includes(tempFilterStartDate)) {
                    setTempFilterStartDate('');
                }
            } else {
                setTempFilterStartDate('');
            }
        }
    }, [tempFilterEndDate, matchingStartDates, tempFilterStartDate, dateSelectionMode]);

    // Reset dateSelectionMode to 'none' if both fields are empty
    useEffect(() => {
        if (!tempFilterStartDate && !tempFilterEndDate) {
            setDateSelectionMode('none');
        }
    }, [tempFilterStartDate, tempFilterEndDate]);

    const handleStartDateChange = useCallback((val) => {
        setTempFilterStartDate(val || '');
        if (val) {
            if (!tempFilterEndDate) {
                setDateSelectionMode('start-first');
            }
        } else {
            if (dateSelectionMode === 'start-first') {
                setTempFilterEndDate('');
                setDateSelectionMode('none');
            }
        }
    }, [tempFilterEndDate, dateSelectionMode]);

    const handleEndDateChange = useCallback((val) => {
        setTempFilterEndDate(val || '');
        if (val) {
            if (!tempFilterStartDate) {
                setDateSelectionMode('end-first');
            }
        } else {
            if (dateSelectionMode === 'end-first') {
                setTempFilterStartDate('');
                setDateSelectionMode('none');
            }
        }
    }, [tempFilterStartDate, dateSelectionMode]);

    const hasActiveFilters = Boolean(
        tempFilterCompany.trim() ||
        tempFilterDepartment ||
        tempFilterStartDate ||
        tempFilterEndDate ||
        tempFilterMode
    );

    const handleClearFilters = useCallback(() => {
        setTempFilterCompany('');
        setTempFilterDepartment('');
        setTempFilterStartDate('');
        setTempFilterEndDate('');
        setTempFilterMode('');
        setDateSelectionMode('none');
    }, []);

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
                    eligibleCreated: hasEligible,
                    allRoundsCompleted: false  // Will be updated in the second pass
                };
            });

            // Second pass: Fetch round results to check if all rounds are completed
            const drivesWithRoundStatus = await Promise.all(
                drivesWithAttendance.map(async (drive) => {
                    try {
                        // Only fetch round results if attendance was taken
                        if (!drive.attendanceTaken) {
                            return drive;
                        }

                        // Fetch round results for this drive
                        const roundResults = await mongoDBService.getAllRoundResults(
                            drive.companyName,
                            drive.jobRole,
                            drive.startingDate,
                            drive._id
                        );

                        console.log(`📊 Round results for ${drive.companyName} - ${drive.jobRole}:`, roundResults);

                        // Check if all rounds are completed
                        let allRoundsCompleted = false;
                        const totalRounds = drive.rounds || drive.numberOfRounds || 1;

                        if (roundResults && roundResults.data && roundResults.data.rounds) {
                            const completedRounds = roundResults.data.rounds.filter(round =>
                                round.roundNumber &&
                                Array.isArray(round.passedStudents) &&
                                Array.isArray(round.failedStudents)
                            );

                            // All rounds are completed if we have results for all expected rounds
                            allRoundsCompleted = completedRounds.length === totalRounds && totalRounds > 0;

                            console.log(`✏️ Drive: ${drive.companyName} - Total rounds: ${totalRounds}, Completed rounds: ${completedRounds.length}, All completed: ${allRoundsCompleted}`);
                        }

                        return {
                            ...drive,
                            allRoundsCompleted
                        };
                    } catch (error) {
                        console.error(`Error checking round results for ${drive.companyName}:`, error);
                        return drive;
                    }
                })
            );

            // Compute unique departments / eligible branches
            const deptSet = new Set();

            drivesWithRoundStatus.forEach(d => {
                if (d.department && String(d.department).trim()) {
                    deptSet.add(String(d.department).trim());
                }
                if (Array.isArray(d.eligibleBranches)) {
                    d.eligibleBranches.forEach(b => {
                        if (b && String(b).trim()) deptSet.add(String(b).trim());
                    });
                }
            });

            setCompanies(drivesWithRoundStatus);
            setDepartmentOptions(['', ...Array.from(deptSet).sort()]);
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
    const [currentPage, setCurrentPage] = useState(1);
    const drivesPerPage = 6;

    useEffect(() => {
        setCurrentPage(1);
    }, [filterCompany, filterDepartment, filterStartDate, filterEndDate, filterMode]);

    useEffect(() => {
        setFilterCompany(tempFilterCompany);
        setFilterDepartment(tempFilterDepartment);
        setFilterStartDate(tempFilterStartDate);
        setFilterEndDate(tempFilterEndDate);
        setFilterMode(tempFilterMode);
    }, [tempFilterCompany, tempFilterDepartment, tempFilterStartDate, tempFilterEndDate, tempFilterMode]);

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

    const startNavigationLoading = async (navigateAction) => {
        setNavPopupState('progress');
        setNavProgress(0);

        setNavProgress(25);
        await new Promise(resolve => setTimeout(resolve, 200));

        setNavProgress(60);
        await new Promise(resolve => setTimeout(resolve, 250));

        setNavProgress(100);
        await new Promise(resolve => setTimeout(resolve, 200));

        navigateAction();
    };

    const filteredCompanies = companies.filter(company => {
        const q = (filterCompany || '').trim().toLowerCase();
        const companyName = company.companyName || '';
        const jobRole = company.jobRole || '';
        const companyMatch = q === '' || companyName.toLowerCase().includes(q) || jobRole.toLowerCase().includes(q);

        const dept = (company.department || '').trim();
        const branches = Array.isArray(company.eligibleBranches) ? company.eligibleBranches.map(b => (b || '').trim()) : [];
        const deptFilter = (filterDepartment || '').trim();
        const departmentMatch = deptFilter === '' || dept.toLowerCase() === deptFilter.toLowerCase() || branches.some(b => b.toLowerCase() === deptFilter.toLowerCase());

        const driveStartDateYmd = toYmd(company.startingDate);
        const driveEndDateYmd = toYmd(company.endingDate);

        const startDateMatch = !filterStartDate || driveStartDateYmd === filterStartDate;
        const endDateMatch = !filterEndDate || driveEndDateYmd === filterEndDate;

        const modeMatch = filterMode === '' || company.mode === filterMode;

        return companyMatch && departmentMatch && startDateMatch && endDateMatch && modeMatch;
    });

    const totalPages = Math.ceil(filteredCompanies.length / drivesPerPage) || 1;

    const paginatedDrives = useMemo(() => {
        const startIndex = (currentPage - 1) * drivesPerPage;
        return filteredCompanies.slice(startIndex, startIndex + drivesPerPage);
    }, [filteredCompanies, currentPage]);

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
            setSelectedCompanyIds(new Set());
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
            setSelectedCompanyIds(new Set());
        }
    };

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
             <Conavbar Adminicon={Adminicon} onLogout={onLogout} onToggleSidebar={toggleSidebar} />
            <div className={styles['Admin-cd-layout']}>
                <div className={`${styles['Admin-cd-sidebar-wrapper']} ${isSidebarOpen ? 'open' : ''}`}>
                    <Cosidebar isOpen={isSidebarOpen} onLogout={onLogout} onClose={() => setIsSidebarOpen(false)} />
                </div>
                <div className={styles['Admin-cd-main-content']}>
                    <div className={styles['Admin-cd-top-card']}>

                        {/* Add Drive Card */}
                        <div className={`${styles['Admin-cd-action-addcard']} ${styles['Admin-cd-add-card']}`} onClick={handleAddCompany} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && handleAddCompany()}>
                            <img className={styles['Admin-cd-add-icon']} src={AdminAddcompany} alt="Add Drive" />
                            <h4 className={styles['Admin-cd-add-header']}>Add <br /> Drive</h4>
                            <p className={styles['Admin-cd-add-description']}>
                                Schedule a new drive for the students.
                            </p>
                        </div>

                        {/* Filter Section */}
                        <div className={styles['Admin-cd-filter-section']}>
                            <div className={styles['Admin-cd-filter-header-container']}>
                                <div className={styles['Admin-cd-filter-header']}>Company Drive</div>
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        className={styles['Admin-cd-clear-btn-header']}
                                        onClick={handleClearFilters}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <div className={styles['Admin-cd-filter-content']}>
                                {/* Company Name Filter with Static Label */}
                                <div className={styles['Admin-cd-input-wrapper']}>
                                    <label className={styles['Admin-cd-static-label']} htmlFor="admin-search-company">
                                        Company / Job Role
                                    </label>
                                    <div className={`${styles['Admin-cd-text-container']} ${companyFocused ? styles['is-focused'] : ''}`}>
                                        <input
                                            id="admin-search-company"
                                            type="text"
                                            className={styles['Admin-cd-text']}
                                            placeholder="Search Company / Job Role"
                                            value={tempFilterCompany}
                                            onChange={(e) => setTempFilterCompany(e.target.value)}
                                            onFocus={() => setCompanyFocused(true)}
                                            onBlur={() => setCompanyFocused(false)}
                                        />
                                    </div>
                                </div>

                                {/* Department Filter with Static Label */}
                                <div className={styles['Admin-cd-input-wrapper']}>
                                    <label className={styles['Admin-cd-static-label']} htmlFor="admin-search-department">
                                        Department
                                    </label>
                                    <div className={`${styles['Admin-cd-text-container']} ${styles['Admin-cd-select-container']} ${departmentFocused ? styles['is-focused'] : ''}`}>
                                        <select
                                            id="admin-search-department"
                                            className={`${styles['Admin-cd-text']} ${styles['Admin-cd-select']}`}
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
                                </div>

                                {/* Dates Filter with Static Label and Start/End subfields */}
                                <div className={styles['Admin-cd-input-wrapper']}>
                                    <label className={styles['Admin-cd-static-label']} htmlFor="admin-search-dates">
                                        Dates
                                    </label>
                                    <div className={styles['Admin-cd-date-range-inputs']}>
                                        {Boolean(tempFilterEndDate && matchingStartDates.length > 1 && dateSelectionMode === 'end-first') ? (
                                            <div className={`${styles['Admin-cd-text-container']} ${styles['Admin-cd-select-container']} ${startDateFocused ? styles['is-focused'] : ''}`}>
                                                <select
                                                    id="admin-search-start-date"
                                                    className={`${styles['Admin-cd-text']} ${styles['Admin-cd-select']}`}
                                                    value={tempFilterStartDate}
                                                    onChange={(e) => handleStartDateChange(e.target.value)}
                                                    onFocus={() => setStartDateFocused(true)}
                                                    onBlur={() => setStartDateFocused(false)}
                                                    style={{ padding: '8px 6px 0', fontSize: '0.8rem' }}
                                                >
                                                    <option value="">Start</option>
                                                    {matchingStartDates.map((ymd) => (
                                                        <option key={ymd} value={ymd}>
                                                            {toDmy(ymd)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <AdCalendar
                                                id="admin-search-start-date"
                                                value={tempFilterStartDate}
                                                onChange={handleStartDateChange}
                                                variant="filter"
                                                enabledDates={tempFilterEndDate ? matchingStartDates : uniqueStartDates}
                                                style={{ padding: '0px 6px', fontSize: '0.8rem', gap: '4px' }}
                                            />
                                        )}

                                        <span className={styles['Admin-cd-date-range-sep']}>-</span>

                                        {Boolean(tempFilterStartDate && matchingEndDates.length > 1 && dateSelectionMode === 'start-first') ? (
                                            <div className={`${styles['Admin-cd-text-container']} ${styles['Admin-cd-select-container']} ${endDateFocused ? styles['is-focused'] : ''}`}>
                                                <select
                                                    id="admin-search-end-date"
                                                    className={`${styles['Admin-cd-text']} ${styles['Admin-cd-select']}`}
                                                    value={tempFilterEndDate}
                                                    onChange={(e) => handleEndDateChange(e.target.value)}
                                                    onFocus={() => setEndDateFocused(true)}
                                                    onBlur={() => setEndDateFocused(false)}
                                                    style={{ padding: '8px 6px 0', fontSize: '0.8rem' }}
                                                >
                                                    <option value="">End</option>
                                                    {matchingEndDates.map((ymd) => (
                                                        <option key={ymd} value={ymd}>
                                                            {toDmy(ymd)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <AdCalendar
                                                id="admin-search-end-date"
                                                value={tempFilterEndDate}
                                                onChange={handleEndDateChange}
                                                variant="filter"
                                                enabledDates={tempFilterStartDate ? matchingEndDates : uniqueEndDates}
                                                style={{ padding: '0px 6px', fontSize: '0.8rem', gap: '4px' }}
                                            />
                                        )}
                                    </div>
                                </div>

                                {/* Mode Filter with Static Label */}
                                <div className={styles['Admin-cd-input-wrapper']}>
                                    <label className={styles['Admin-cd-static-label']} htmlFor="admin-search-mode">
                                        Search Mode
                                    </label>
                                    <div className={`${styles['Admin-cd-text-container']} ${styles['Admin-cd-select-container']} ${modeFocused ? styles['is-focused'] : ''}`}>
                                        <select
                                            id="admin-search-mode"
                                            className={`${styles['Admin-cd-text']} ${styles['Admin-cd-select']}`}
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
                        </div>

                        {/* Action Cards Section */}
                        <div className={styles['Admin-cd-action-cards-section']}>
                            {/* Card 1: Editing */}
                            <div className={styles['Admin-cd-action-card']}>
                                <h4 className={selectedCompanyIds.size === 1 ? styles['Admin-cd-header-edit-active'] : styles['Admin-cd-header-disabled']}>Editing</h4>
                                <p className={styles['Admin-cd-action-description']}>
                                    {selectedCompanyIds.size === 1
                                        ? `Selected drive: ${companies.find(c => String(c._id) === String(Array.from(selectedCompanyIds)[0]))?.companyName || ''}`
                                        : 'Select the drive record before editing.'
                                    }
                                </p>
                                <button className={`${styles['Admin-cd-action-btn']} ${styles['Admin-cd-edit-btn']}`}
                                    onClick={handleEdit}
                                    disabled={selectedCompanyIds.size !== 1}>
                                    Edit
                                </button>
                            </div>

                            {/* Card 2: Deleting */}
                            <div className={styles['Admin-cd-action-card']}>
                                <h4 className={selectedCompanyIds.size >= 1 ? styles['Admin-cd-header-delete-active'] : styles['Admin-cd-header-disabled']}>Deleting</h4>
                                <p className={styles['Admin-cd-action-description']}>
                                    {selectedCompanyIds.size >= 1
                                        ? `Delete ${selectedCompanyIds.size} selected drive record${selectedCompanyIds.size > 1 ? 's' : ''}`
                                        : 'Select the drive records before deleting.'
                                    }
                                </p>
                                <button className={`${styles['Admin-cd-action-btn']} ${styles['Admin-cd-delete-btn']}`}
                                    onClick={handleDeleteClick}
                                    disabled={!selectedCompanyIds.size}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Company Drive Table Section */}
                    <div className={styles['Admin-cd-bottom-card']}>
                        <div className={styles['Admin-cd-table-header-row']}>
                            <div className={styles['Admin-cd-table-title-wrap']}>
                                <h3 className={styles['Admin-cd-table-title']}>COMPANY DRIVE</h3>
                                {!isInitialLoading && (
                                    <div className={styles['Admin-cd-table-subtitle']}>
                                        Page {currentPage} of {totalPages} | Showing {paginatedDrives.length} on this page
                                    </div>
                                )}
                            </div>
                            <div className={styles['Admin-cd-table-actions']}>
                                {totalPages > 1 && (
                                    <div className={styles['Admin-cd-pagination-controls']}>
                                        <button
                                            type="button"
                                            className={styles['Admin-cd-page-btn']}
                                            onClick={handlePrevPage}
                                            disabled={currentPage <= 1 || isInitialLoading}
                                        >
                                            Prev
                                        </button>
                                        <span className={styles['Admin-cd-page-indicator']}>
                                            {currentPage} / {totalPages}
                                        </span>
                                        <button
                                            type="button"
                                            className={styles['Admin-cd-page-btn']}
                                            onClick={handleNextPage}
                                            disabled={currentPage >= totalPages || isInitialLoading}
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
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
                                    ) : paginatedDrives.length === 0 ? (
                                        <tr className={styles['Admin-cd-table-row']}>
                                            <td colSpan="12" className={styles['Admin-cd-td']} style={{ textAlign: 'center' }}>
                                                No drives found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedDrives.map((company, index) => (
                                            <tr
                                                key={company._id}
                                                className={`${styles['Admin-cd-table-row']} ${selectedCompanyIds.has(company._id) ? styles['Admin-cd-selected-row'] : ''}`}
                                                onClick={() => handleCompanySelect(company._id)}
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
                                                <td className={`${styles['Admin-cd-td']} ${styles['Admin-cd-sno']}`}>{(currentPage - 1) * drivesPerPage + index + 1}</td>
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
                                                    {(() => {
                                                        const branches = Array.isArray(company.eligibleBranches)
                                                            ? company.eligibleBranches
                                                                .map((branch) => String(branch || '').trim())
                                                                .filter(Boolean)
                                                            : [];

                                                        if (branches.length === 0) {
                                                            return company.department || '—';
                                                        }

                                                        if (branches.length <= 4) {
                                                            return (
                                                                <span className={styles['Admin-cd-domain-single-line']}>
                                                                    {branches.join(', ')}
                                                                </span>
                                                            );
                                                        }

                                                        return (
                                                            <div className={styles['Admin-cd-domain-two-lines']}>
                                                                <span className={styles['Admin-cd-domain-line']}>
                                                                    {branches.slice(0, 4).join(', ')}
                                                                </span>
                                                                <span className={styles['Admin-cd-domain-line']}>
                                                                    {branches.slice(4).join(', ')}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className={`${styles['Admin-cd-td']} ${styles['Admin-cd-view']}`}>
                                                    <svg
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        style={{ cursor: 'pointer', margin: '0 auto', display: 'block' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewDrive(company);
                                                        }}
                                                    >
                                                        <path d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z" fill="#4EA24E" opacity="0.3" />
                                                        <circle cx="12" cy="12.5" r="3.5" fill="#4EA24E" />
                                                    </svg>
                                                </td>
                                                <td className={`${styles['Admin-cd-td']} ${styles['Admin-cd-action']}`}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                                                        {(() => {
                                                            const status = company.driveStatus || 'not-started';
                                                            const attendanceTaken = company.attendanceTaken || false;
                                                            const eligibleCreated = company.eligibleCreated || false;
                                                            const allRoundsCompleted = company.allRoundsCompleted || false;

                                                            // Show clickable tick icon if all rounds are completed
                                                            if (allRoundsCompleted) {
                                                                return (
                                                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ cursor: 'pointer' }} onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        startNavigationLoading(() => {
                                                                            navigate('/admin/company-drive/details', {
                                                                                state: {
                                                                                    company: company,
                                                                                    driveId: company._id,
                                                                                    startingDate: company.startingDate,
                                                                                    isReadOnly: true  // All rounds completed - view only mode
                                                                                }
                                                                            });
                                                                        });
                                                                    }} title="View Drive Results">
                                                                        <circle cx="12" cy="12" r="10" fill="#4EA24E" />
                                                                        <path d="M7 12L10 15L17 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                    </svg>
                                                                );
                                                            }

                                                            if (status === 'completed') {
                                                                return (
                                                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ cursor: 'default' }} title="Drive Completed">
                                                                        <circle cx="12" cy="12" r="10" fill="#4EA24E" />
                                                                        <path d="M7 12L10 15L17 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                    </svg>
                                                                );
                                                            }

                                                            if (attendanceTaken) {
                                                                // Show Play button if attendance is taken
                                                                return (
                                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ cursor: 'pointer' }} onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        startNavigationLoading(() => {
                                                                            // Pass the current company object directly - it's already the specific drive from the table row
                                                                            // No need to extract from drives array since table rows show individual drives
                                                                            navigate('/admin/company-drive/details', {
                                                                                state: {
                                                                                    company: company,
                                                                                    driveId: company._id,
                                                                                    startingDate: company.startingDate,
                                                                                    isReadOnly: false  // Attendance taken but rounds not complete - editable mode
                                                                                }
                                                                            });
                                                                        });
                                                                    }} title="Start Drive">
                                                                        <circle cx="12" cy="12" r="10" fill="#4EA24E" />
                                                                        <path d="M10 8L16 12L10 16V8Z" fill="white" />
                                                                    </svg>
                                                                );
                                                            }

                                                            // If eligible students not created yet, show eligible students icon and navigate to eligible students selection page
                                                            if (!eligibleCreated) {
                                                                return (
                                                                    <img
                                                                        src={EligibleStudentsIcon}
                                                                        alt="Select Eligible Students"
                                                                        width="24"
                                                                        height="22"
                                                                        style={{ cursor: 'pointer' }}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
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
                                                                    />
                                                                );
                                                            }

                                                            // Show Attendance icon if attendance not taken but eligible students exist
                                                            return (
                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ cursor: 'pointer' }} onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate('/admin-attendance', { state: { companyData: company } });
                                                                }} title="Take Attendance">
                                                                    <rect x="3" y="4" width="18" height="18" rx="2" fill="#4EA24E" />
                                                                    <path d="M8 2V6M16 2V6" stroke="#4EA24E" strokeWidth="2" strokeLinecap="round" />
                                                                    <line x1="3" y1="10" x2="21" y2="10" stroke="white" strokeWidth="2" />
                                                                    <circle cx="8" cy="15" r="1.5" fill="white" />
                                                                    <circle cx="12" cy="15" r="1.5" fill="white" />
                                                                    <circle cx="16" cy="15" r="1.5" fill="white" />
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
                onClose={() => { }}
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

            <ExportProgressAlert
                isOpen={navPopupState === 'progress'}
                onClose={() => { }}
                progress={navProgress}
                exportType="Loading"
            />
        </>
    );
}

export default AdminCompanyDrive;