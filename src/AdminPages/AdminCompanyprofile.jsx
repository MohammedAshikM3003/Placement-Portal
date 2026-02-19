import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';

import Adnavbar from '../components/Navbar/Adnavbar.js';
import Adsidebar from '../components/Sidebar/Adsidebar.js';
import styles from './AdminCompanyprofile.module.css';

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';
import AdminAddcompany from '../assets/AdminAddCompanyicon.svg';
import Adminicon from '../assets/Adminicon.png';

import AdminCompanyprofilePopup from './AdminCompanyprofilepopup';
import popupStyles from '../StudentPages/Achievements.module.css';
import mongoDBService from '../services/mongoDBService';

const EyeIcon = () => (
    <svg className={styles['Admin-cp-profile-eye-icon']} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const formatDisplayDate = (value) => {
    if (!value) return '—';
    const [year, month, day] = String(value).split('T')[0].split('-');
    if (!year || !month || !day) return String(value);
    return `${day}-${month}-${year}`;
};

const WARNING_MESSAGE = 'Please select company record(s) before deleting.';
const EDIT_WARNING_MESSAGE = 'Select exactly one company record before editing.';

const EXPORT_HEADERS = [
    'Company Name',
    'Company Type',
    'Job Role',
    'Mode',
    'HR Name',
    'Visit Date',
    'Location'
];

function Admincompanyprofile({ onLogout }) {
    useAdminAuth(); // JWT authentication verification
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const [companies, setCompanies] = useState([]);
    const [selectedCompanyIds, setSelectedCompanyIds] = useState(new Set());
    const [showAddCompanyPopup, setShowAddCompanyPopup] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [viewingCompany, setViewingCompany] = useState(null);
    const [showDeleteWarning, setShowDeleteWarning] = useState(false);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
    const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [exportPopupState, setExportPopupState] = useState('none');
    const [exportProgress, setExportProgress] = useState(0);
    const [exportType, setExportType] = useState('Excel');
    const [filters, setFilters] = useState({
        company: '',
        hrName: '',
        mode: '',
        visitDate: ''
    });

    const [companyFocused, setCompanyFocused] = useState(false);
    const [hrNameFocused, setHrNameFocused] = useState(false);
    const [modeFocused, setModeFocused] = useState(false);
    const [visitDateFocused, setVisitDateFocused] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => !prev);
    };

    useEffect(() => {
        const handleCloseSidebar = () => {
            setIsSidebarOpen(false);
        };
        window.addEventListener('closeSidebar', handleCloseSidebar);
        return () => {
            window.removeEventListener('closeSidebar', handleCloseSidebar);
        };
    }, []);

    const fetchCompanies = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');
        try {
            const data = await mongoDBService.getCompanies();
            setCompanies(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch companies:', error);
            setErrorMessage(error?.message || 'Failed to load companies. Please try again.');
        } finally {
            setIsLoading(false);
            setIsInitialLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    // Check if we should open the add company popup from navigation state
    useEffect(() => {
        if (location.state?.openAddPopup) {
            setShowAddCompanyPopup(true);
        }
    }, [location.state]);

    const filteredCompanies = useMemo(() => {
        if (!companies.length) return [];

        const companyQuery = filters.company.trim().toLowerCase();
        const hrNameQuery = filters.hrName.trim().toLowerCase();
        const modeQuery = filters.mode;
        const visitDateQuery = filters.visitDate;

        return companies.filter((company) => {
            const companyName = (company.company || company.companyName || '').toLowerCase();
            const jobRole = (company.jobRole || '').toLowerCase();
            const hrName = (company.hrName || '').toLowerCase();
            const mode = company.mode || '';
            const visitDate = (company.visitDate || '').slice(0, 10);

            const matchesCompanyOrRole =
                !companyQuery || companyName.includes(companyQuery) || jobRole.includes(companyQuery);
            const matchesHrName = !hrNameQuery || hrName.includes(hrNameQuery);
            const matchesMode = !modeQuery || mode === modeQuery;
            const matchesVisitDate = !visitDateQuery || visitDate === visitDateQuery;

            return matchesCompanyOrRole && matchesHrName && matchesMode && matchesVisitDate;
        });
    }, [companies, filters]);

    const matchedCompanyVisitDate = useMemo(() => {
        const companyQuery = filters.company.trim().toLowerCase();
        if (!companyQuery) return '';
        const matchedCompany = companies.find((company) =>
            (company.company || company.companyName || '').trim().toLowerCase() === companyQuery
        );
        return matchedCompany ? (matchedCompany.visitDate || '').slice(0, 10) : '';
    }, [companies, filters.company]);

    const visitDateOptions = useMemo(() => {
        if (matchedCompanyVisitDate) return [matchedCompanyVisitDate];
        if (!companies.length) return [];
        const uniqueDates = new Set(
            companies
                .map((company) => (company.visitDate || '').slice(0, 10))
                .filter(Boolean)
        );
        return Array.from(uniqueDates).sort();
    }, [companies, matchedCompanyVisitDate]);

    const toggleCompanySelection = useCallback((id) => {
        setSelectedCompanyIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const openAddPopup = useCallback(() => {
        setEditingCompany(null);
        setShowAddCompanyPopup(true);
    }, []);

    const openEditPopup = useCallback(() => {
        if (selectedCompanyIds.size !== 1) {
            alert(EDIT_WARNING_MESSAGE);
            return;
        }

        const companyId = Array.from(selectedCompanyIds)[0];
        const company = companies.find((item) => String(item.id || item._id) === String(companyId));

        if (!company) {
            alert('Selected company could not be found. Please refresh and try again.');
            return;
        }

        setEditingCompany(company);
        setShowAddCompanyPopup(true);
    }, [companies, selectedCompanyIds]);

    const openViewPopup = useCallback((companyId) => {
        const company = companies.find((item) => String(item.id || item._id) === String(companyId));

        if (!company) {
            alert('Company could not be found. Please refresh and try again.');
            return;
        }

        setViewingCompany(company);
        setShowAddCompanyPopup(true);
    }, [companies]);

    const handlePopupClose = useCallback(() => {
        setShowAddCompanyPopup(false);
        setEditingCompany(null);
        setViewingCompany(null);
    }, []);

    const handlePopupSubmit = useCallback(async (formValues) => {
        try {
            // Ensure both companyType and domain are sent for backward compatibility
            const submitData = {
                ...formValues,
                domain: formValues.companyType || formValues.domain, // Map companyType to domain for backend
                companyType: formValues.companyType || formValues.domain
            };

            if (editingCompany) {
                const companyId = editingCompany.id || editingCompany._id;
                await mongoDBService.apiCall(`/admin/companies/${companyId}`, {
                    method: 'PUT',
                    body: JSON.stringify(submitData)
                });
                setShowUpdateSuccess(true);
                await fetchCompanies();
                handlePopupClose();
            } else {
                await mongoDBService.apiCall('/admin/companies', {
                    method: 'POST',
                    body: JSON.stringify(submitData)
                });
                await fetchCompanies();
                // Do NOT close the popup here! Let the popup show the success message and close itself.
            }
        } catch (error) {
            console.error('Failed to save company:', error);
            alert(error?.message || 'Failed to save company. Please try again.');
        }
    }, [editingCompany, fetchCompanies, handlePopupClose]);

    const handleDeleteClick = useCallback(() => {
        if (!selectedCompanyIds.size) {
            alert(WARNING_MESSAGE);
            return;
        }
        setShowDeleteWarning(true);
    }, [selectedCompanyIds.size]);

    const resetDeleteState = useCallback(() => {
        setIsDeleting(false);
        setShowDeleteWarning(false);
        setSelectedCompanyIds(new Set());
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!selectedCompanyIds.size || isDeleting) return;

        setIsDeleting(true);
        setErrorMessage('');

        try {
            const deletePromises = Array.from(selectedCompanyIds).map((id) =>
                mongoDBService.apiCall(`/admin/companies/${id}`, { method: 'DELETE' })
            );

            await Promise.all(deletePromises);
            await fetchCompanies();

            setShowDeleteSuccess(true);
            resetDeleteState();
        } catch (error) {
            console.error('Failed to delete companies:', error);
            setErrorMessage(error?.message || 'Failed to delete selected companies. Please try again.');
            setShowDeleteWarning(false);
        } finally {
            setIsDeleting(false);
        }
    }, [selectedCompanyIds, isDeleting, fetchCompanies, resetDeleteState]);

    const exportToExcel = useCallback(async () => {
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

            const data = filteredCompanies.map((company) => [
                company.company || company.companyName || '—',
                company.companyType || company.domain || '—',
                company.jobRole || '—',
                company.mode || '—',
                company.hrName || '—',
                (company.visitDate || '').slice(0, 10) || '—',
                company.location || '—'
            ]);

            const worksheet = XLSX.utils.aoa_to_sheet([EXPORT_HEADERS, ...data]);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Company Profiles');
            XLSX.writeFile(workbook, 'Company_Profile_Report.xlsx');

            clearInterval(progressInterval);
            setExportProgress(100);
            await new Promise((resolve) => setTimeout(resolve, 300));
            setExportPopupState('success');
        } catch (error) {
            clearInterval(progressInterval);
            console.error('Export to Excel failed:', error);
            setExportPopupState('failed');
        }
    }, [filteredCompanies]);

    const exportToPDF = useCallback(async () => {
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

            const doc = new jsPDF({ orientation: 'landscape' });
            const rows = filteredCompanies.map((company) => [
                company.company || company.companyName || '—',
                company.companyType || company.domain || '—',
                company.jobRole || '—',
                company.mode || '—',
                company.hrName || '—',
                (company.visitDate || '').slice(0, 10) || '—',
                company.location || '—'
            ]);

            doc.text('Company Profile Report', 14, 15);
            autoTable(doc, {
                head: [EXPORT_HEADERS],
                body: rows,
                startY: 20,
                styles: { fontSize: 8 }
            });
            doc.save('Company_Profile_Report.pdf');

            clearInterval(progressInterval);
            setExportProgress(100);
            await new Promise((resolve) => setTimeout(resolve, 300));
            setExportPopupState('success');
        } catch (error) {
            clearInterval(progressInterval);
            console.error('Export to PDF failed:', error);
            setExportPopupState('failed');
        }
    }, [filteredCompanies]);

    const closeDeleteSuccess = useCallback(() => setShowDeleteSuccess(false), []);
    const closeUpdateSuccess = useCallback(() => setShowUpdateSuccess(false), []);

    const handleFilterVisitDateChange = useCallback((event) => {
        setFilters((prev) => ({
            ...prev,
            visitDate: event.target.value
        }));
    }, []);

    useEffect(() => {
        setFilters((prev) => {
            if (matchedCompanyVisitDate && prev.visitDate !== matchedCompanyVisitDate) {
                return {
                    ...prev,
                    visitDate: matchedCompanyVisitDate
                };
            }
            if (!matchedCompanyVisitDate && !visitDateOptions.includes(prev.visitDate)) {
                return {
                    ...prev,
                    visitDate: ''
                };
            }
            return prev;
        });
    }, [matchedCompanyVisitDate, visitDateOptions]);

    return (
        <div className={styles['Admin-cp-layout']}>
            <div className={`${styles['Admin-cp-sidebar-wrapper']} ${isSidebarOpen ? 'open' : ''}`}>
                <Adsidebar isOpen={isSidebarOpen} onLogout={onLogout} />
            </div>
            {isSidebarOpen && (
                <div
                    className={styles['Admin-cp-mobile-overlay']}
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}
            <div className={styles['Admin-cp-main-content']}>
                <Adnavbar onToggleSidebar={toggleSidebar} onLogout={onLogout} Adminicon={Adminicon} />

                {showDeleteWarning && (
                    <div className={popupStyles.overlay} onClick={() => setShowDeleteWarning(false)}>
                        <div className={popupStyles['Achievement-popup-container']} onClick={(event) => event.stopPropagation()}>
                            <div className={popupStyles['Achievement-popup-header']}>Delete Company</div>
                            <div className={popupStyles['Achievement-popup-body']}>
                                <svg className={popupStyles['Achievement-warning-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                    <circle className={popupStyles['Achievement-warning-icon--circle']} cx="26" cy="26" r="25" fill="none" />
                                    <path d="M26 16v12M26 34v2" stroke="#ffffff" strokeWidth="3" fill="none" />
                                </svg>
                                <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#333', fontWeight: 600 }}>Are you sure?</h2>
                                <p style={{ margin: 0, color: '#888', fontSize: 16 }}>
                                    Delete {selectedCompanyIds.size} selected compan{selectedCompanyIds.size > 1 ? 'ies' : 'y'}?
                                </p>
                            </div>
                            <div className={popupStyles['Achievement-popup-footer']}>
                                <button
                                    onClick={() => setShowDeleteWarning(false)}
                                    className={popupStyles['Achievement-popup-cancel-btn']}
                                    disabled={isDeleting}
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className={popupStyles['Achievement-popup-delete-btn']}
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? 'Deleting…' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showDeleteSuccess && (
                    <div className={popupStyles.overlay} onClick={closeDeleteSuccess}>
                        <div className={popupStyles['Achievement-popup-container']} onClick={(event) => event.stopPropagation()}>
                            <div className={popupStyles['Achievement-popup-header']}>Deleted !</div>
                            <div className={popupStyles['Achievement-popup-body']}>
                                <svg className={popupStyles['Achievement-delete-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                    <circle className={popupStyles['Achievement-delete-icon--circle']} cx="26" cy="26" r="25" fill="none" />
                                    <g className={popupStyles['Achievement-delete-icon--bin']} fill="none" strokeWidth="2">
                                        <path d="M16 20l20 0M18 20l0 16c0 1 1 2 2 2l12 0c1 0 2-1 2-2l0-16M21 20l0-3c0-1 1-2 2-2l6 0c1 0 2 1 2 2l0 3M23 25l0 8M26 25l0 8M29 25l0 8" />
                                    </g>
                                </svg>
                                <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#000', fontWeight: 700 }}>Company Deleted ✓</h2>
                                <p style={{ margin: 0, color: '#888', fontSize: 16 }}>The selected companies have been deleted successfully.</p>
                            </div>
                            <div className={popupStyles['Achievement-popup-footer']}>
                                <button className={popupStyles['Achievement-popup-close-btn']} onClick={closeDeleteSuccess}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showUpdateSuccess && (
                    <div className={popupStyles.overlay} onClick={closeUpdateSuccess}>
                        <div className={popupStyles['Achievement-popup-container']} onClick={(event) => event.stopPropagation()}>
                            <div className={`${popupStyles['Achievement-popup-header']} ${popupStyles['Achievement-popup-header--success']}`}>Updated !</div>
                            <div className={popupStyles['Achievement-popup-body']}>
                                <div className={popupStyles['Achievement-status-icon']}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4EA24E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <h2 className={popupStyles['Achievement-status-title']}>Company Updated</h2>
                                <p className={popupStyles['Achievement-status-text']}>
                                    The company details have been saved successfully.
                                </p>
                                <div className={popupStyles['Achievement-popup-footer']}>
                                    <button className={popupStyles['Achievement-popup-close-btn']} onClick={closeUpdateSuccess}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {errorMessage && (
                    <div className={styles['Admin-cp-error-banner']}>
                        {errorMessage}
                    </div>
                )}

                <div className={styles['Admin-cp-top-card']}>
                    <div className={`${styles['Admin-cp-action-addcard']} ${styles['Admin-cp-add-card']}`} onClick={openAddPopup} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && openAddPopup()}>
                        <img className={styles['Admin-cp-add-icon']} src={AdminAddcompany} alt="Add company" />
                        <h4 className={styles['Admin-cp-add-header']}>Add Company</h4>
                        <p className={styles['Admin-cp-add-description']}>
                            Add a new company profile to the portal.
                        </p>
                    </div>

                    <div className={styles['Admin-cp-filter-section']}>
                        <div className={styles['Admin-cp-filter-header-container']}>
                            <div className={styles['Admin-cp-filter-header']}>Company Profile</div>
                            {/* <span className={styles['Admin-cp-filter-icon-container']}>☰</span> */}
                        </div>
                        <div className={styles['Admin-cp-filter-content']}>
                            <div
                                className={`${styles['Admin-cp-text-container']} ${filters.company ? styles['has-value'] : ''} ${companyFocused ? styles['is-focused'] : ''}`}
                            >
                                <label className={styles['Admin-cp-floating-label']} htmlFor="admin-search-company">
                                    Search Company / Job Role
                                </label>
                                <input
                                    id="admin-search-company"
                                    type="text"
                                    className={styles['Admin-cp-text']}
                                    value={filters.company}
                                    onChange={(event) => setFilters((prev) => ({ ...prev, company: event.target.value }))}
                                    onFocus={() => setCompanyFocused(true)}
                                    onBlur={() => setCompanyFocused(false)}
                                    aria-label="Search Company or Job Role"
                                />
                            </div>

                            <div
                                className={`${styles['Admin-cp-text-container']} ${filters.hrName ? styles['has-value'] : ''} ${hrNameFocused ? styles['is-focused'] : ''}`}
                            >
                                <label className={styles['Admin-cp-floating-label']} htmlFor="admin-search-hr-name">
                                    Search HR Name
                                </label>
                                <input
                                    id="admin-search-hr-name"
                                    type="text"
                                    className={styles['Admin-cp-text']}
                                    value={filters.hrName}
                                    onChange={(event) => setFilters((prev) => ({ ...prev, hrName: event.target.value }))}
                                    onFocus={() => setHrNameFocused(true)}
                                    onBlur={() => setHrNameFocused(false)}
                                    aria-label="Search HR Name"
                                />
                            </div>

                            <div
                                className={`${styles['Admin-cp-text-container']} ${styles['Admin-cp-select-container']} ${filters.mode ? styles['has-value'] : ''} ${modeFocused ? styles['is-focused'] : ''}`}
                            >
                                <label className={styles['Admin-cp-floating-label']} htmlFor="admin-search-mode">
                                    Search Mode
                                </label>
                                <select
                                    id="admin-search-mode"
                                    className={`${styles['Admin-cp-text']} ${styles['Admin-cp-select']}`}
                                    value={filters.mode}
                                    onChange={(event) => setFilters((prev) => ({ ...prev, mode: event.target.value }))}
                                    onFocus={() => setModeFocused(true)}
                                    onBlur={() => setModeFocused(false)}
                                    aria-label="Search Mode"
                                >
                                    <option value="">Search Mode</option>
                                    <option value="Online">Online</option>
                                    <option value="Offline">Offline</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                            </div>

                            <div
                                className={`${styles['Admin-cp-text-container']} ${styles['Admin-cp-select-container']} ${filters.visitDate ? styles['has-value'] : ''} ${visitDateFocused ? styles['is-focused'] : ''}`}
                            >
                                <label className={styles['Admin-cp-floating-label']} htmlFor="admin-search-visit-date">
                                    Visit Date
                                </label>
                                <select
                                    id="admin-search-visit-date"
                                    className={`${styles['Admin-cp-text']} ${styles['Admin-cp-select']}`}
                                    value={filters.visitDate}
                                    onChange={handleFilterVisitDateChange}
                                    onFocus={() => setVisitDateFocused(true)}
                                    onBlur={() => setVisitDateFocused(false)}
                                    aria-label="Visit Date"
                                >
                                    <option value="">Visit Date</option>
                                    {visitDateOptions.map((visitDate) => (
                                        <option key={visitDate} value={visitDate}>
                                            {formatDisplayDate(visitDate)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className={styles['Admin-cp-action-cards-section']}>
                        <div className={styles['Admin-cp-action-card']}>
                            <h4 className={styles['Admin-cp-action-header']}>Editing</h4>
                            <p className={styles['Admin-cp-action-description']}>
                                Select the company record before editing.
                            </p>
                            <button
                                className={`${styles['Admin-cp-action-btn']} ${styles['Admin-cp-edit-btn']}`}
                                onClick={openEditPopup}
                                disabled={selectedCompanyIds.size !== 1}
                            >
                                Edit
                            </button>
                        </div>

                        <div className={styles['Admin-cp-action-card']}>
                            <h4 className={styles['Admin-cp-action-header']}>Deleting</h4>
                            <p className={styles['Admin-cp-action-description']}>
                                Select the company records before deleting.
                            </p>
                            <button
                                className={`${styles['Admin-cp-action-btn']} ${styles['Admin-cp-delete-btn']}`}
                                onClick={handleDeleteClick}
                                disabled={!selectedCompanyIds.size}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles['Admin-cp-bottom-card']}>
                    <div className={styles['Admin-cp-table-header-row']}>
                        <h3 className={styles['Admin-cp-table-title']}>COMPANY PROFILE</h3>
                        <div className={styles['Admin-cp-table-actions']}>
                            <div className={styles['Admin-cp-print-button-container']}>
                                <button
                                    type="button"
                                    className={styles['Admin-cp-print-btn']}
                                    onClick={() => setShowExportMenu((prev) => !prev)}
                                >
                                    Print
                                </button>
                                {showExportMenu && (
                                    <div className={styles['Admin-cp-export-menu']}>
                                        <button type="button" onClick={exportToExcel}>Export to Excel</button>
                                        <button type="button" onClick={exportToPDF}>Export to PDF</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={styles['Admin-cp-table-container']}>
                        <table className={styles['Admin-cp-students-table']}>
                            <thead>
                                <tr className={styles['Admin-cp-table-head-row']}>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-checkbox']}`}>Select</th>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-sno']}`}>S.No</th>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-company']}`}>Company</th>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-domain']}`}>Company Type</th>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-job-role']}`}>Job Role</th>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-mode']}`}>Mode</th>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-hr-name']}`}>HR Name</th>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-visit-date']}`}>Visit Date</th>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-location']}`}>Location</th>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-profile']}`}>View</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isInitialLoading ? (
                                    <tr className={styles['Admin-cp-loading-row']}>
                                        <td colSpan="10" className={styles['Admin-cp-loading-cell']}>
                                            <div className={styles['Admin-cp-loading-wrapper']}>
                                                <div className={styles['Admin-cp-spinner']}></div>
                                                <span className={styles['Admin-cp-loading-text']}>Loading companies…</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredCompanies.length ? (
                                    filteredCompanies.map((company, index) => {
                                        const companyId = company.id || company._id;
                                        const isSelected = selectedCompanyIds.has(companyId);

                                        return (
                                            <tr
                                                key={companyId}
                                                className={`${styles['Admin-cp-table-row']} ${isSelected ? styles['Admin-cp-selected-row'] : ''}`}
                                                onClick={() => toggleCompanySelection(companyId)}
                                            >
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-checkbox']}`} onClick={(event) => event.stopPropagation()}>
                                                    <input
                                                        type="checkbox"
                                                        className={styles['Admin-cp-checkbox-input']}
                                                        checked={isSelected}
                                                        onChange={() => toggleCompanySelection(companyId)}
                                                    />
                                                </td>
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-sno']}`}>{index + 1}</td>
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-company']}`}>{company.company || company.companyName || '—'}</td>
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-domain']}`}>{company.companyType || company.domain || '—'}</td>
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-job-role']}`}>{company.jobRole || '—'}</td>
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-mode']}`}>{company.mode || '—'}</td>
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-hr-name']}`}>{company.hrName || '—'}</td>
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-visit-date']}`}>
                                                    {formatDisplayDate((company.visitDate || '').slice(0, 10))}
                                                </td>
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-location']}`}>{company.location || '—'}</td>
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-profile']}`} onClick={(e) => {
                                                    e.stopPropagation();
                                                    openViewPopup(companyId);
                                                }}><EyeIcon /></td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="10" style={{ textAlign: 'center', padding: '2rem 0' }}>
                                            No companies found matching the applied filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <AdminCompanyprofilePopup
                    isOpen={showAddCompanyPopup}
                    onClose={handlePopupClose}
                    onSubmit={handlePopupSubmit}
                    editingCompany={editingCompany}
                    viewingCompany={viewingCompany}
                />
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
        </div>
    );
}

export default Admincompanyprofile;