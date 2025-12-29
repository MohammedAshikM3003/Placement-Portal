import React, { useState, useEffect, useCallback, useMemo } from 'react';

import Adnavbar from '../components/Navbar/Adnavbar.js';
import Adsidebar from '../components/Sidebar/Adsidebar.js';
import styles from './AdminCompanyprofile.module.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AdminAddcompany from '../assets/AdminAddCompanyicon.svg';
import AdminCompanyprofilePopup from './AdminCompanyprofilepopup';
import popupStyles from '../StudentPages/Achievements.module.css';
import mongoDBService from '../services/mongoDBService';

const WARNING_MESSAGE = 'Please select company record(s) before deleting.';
const EDIT_WARNING_MESSAGE = 'Select exactly one company record before editing.';

const EXPORT_HEADERS = [
    'Company Name',
    'Domain',
    'Job Role',
    'Mode',
    'HR Name',
    'HR Contact',
    'Round',
    'Status',
    'Visit Date',
    'Package',
    'Location',
    'Bond Period'
];

function Admincompanyprofile({ onLogout }) {
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyIds, setSelectedCompanyIds] = useState(new Set());
    const [showAddCompanyPopup, setShowAddCompanyPopup] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [showDeleteWarning, setShowDeleteWarning] = useState(false);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
    const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [filters, setFilters] = useState({
        company: '',
        domain: '',
        mode: '',
        visitDate: ''
    });

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
        }
    }, []);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    const filteredCompanies = useMemo(() => {
        if (!companies.length) return [];

        const companyQuery = filters.company.trim().toLowerCase();
        const domainQuery = filters.domain.trim().toLowerCase();
        const modeQuery = filters.mode;
        const visitDateQuery = filters.visitDate;

        return companies.filter((company) => {
            const companyName = (company.company || company.companyName || '').toLowerCase();
            const domain = (company.domain || '').toLowerCase();
            const mode = company.mode || '';
            const visitDate = (company.visitDate || '').slice(0, 10);

            const matchesCompany = !companyQuery || companyName.includes(companyQuery);
            const matchesDomain = !domainQuery || domain.includes(domainQuery);
            const matchesMode = !modeQuery || mode === modeQuery;
            const matchesVisitDate = !visitDateQuery || visitDate === visitDateQuery;

            return matchesCompany && matchesDomain && matchesMode && matchesVisitDate;
        });
    }, [companies, filters]);

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

    const handlePopupClose = useCallback(() => {
        setShowAddCompanyPopup(false);
        setEditingCompany(null);
    }, []);

    const handlePopupSubmit = useCallback(async (formValues) => {
        try {
            if (editingCompany) {
                const companyId = editingCompany.id || editingCompany._id;
                await mongoDBService.apiCall(`/admin/companies/${companyId}`, {
                    method: 'PUT',
                    body: JSON.stringify(formValues)
                });
                setShowUpdateSuccess(true);
            } else {
                await mongoDBService.apiCall('/admin/companies', {
                    method: 'POST',
                    body: JSON.stringify(formValues)
                });
            }

            await fetchCompanies();
            handlePopupClose();
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

    const exportToExcel = useCallback(() => {
        if (!filteredCompanies.length) {
            alert('No records available for export.');
            return;
        }

        const data = filteredCompanies.map((company) => [
            company.company || company.companyName || '—',
            company.domain || '—',
            company.jobRole || '—',
            company.mode || '—',
            company.hrName || '—',
            company.hrContact || '—',
            company.round ?? '—',
            company.status || '—',
            company.visitDate ? new Date(company.visitDate).toLocaleDateString() : '—',
            company.package || '—',
            company.location || '—',
            company.bondPeriod || '—'
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet([EXPORT_HEADERS, ...data]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Company Profiles');
        XLSX.writeFile(workbook, 'Company_Profile_Report.xlsx');
    }, [filteredCompanies]);

    const exportToPDF = useCallback(() => {
        if (!filteredCompanies.length) {
            alert('No records available for export.');
            return;
        }

        const doc = new jsPDF({ orientation: 'landscape' });
        const rows = filteredCompanies.map((company) => [
            company.company || company.companyName || '—',
            company.domain || '—',
            company.jobRole || '—',
            company.mode || '—',
            company.hrName || '—',
            company.hrContact || '—',
            company.round ?? '—',
            company.status || '—',
            company.visitDate ? new Date(company.visitDate).toLocaleDateString() : '—',
            company.package || '—',
            company.location || '—',
            company.bondPeriod || '—'
        ]);

        doc.text('Company Profile Report', 14, 15);
        autoTable(doc, {
            head: [EXPORT_HEADERS],
            body: rows,
            startY: 20,
            styles: { fontSize: 8 }
        });
        doc.save('Company_Profile_Report.pdf');
    }, [filteredCompanies]);

    const closeDeleteSuccess = useCallback(() => setShowDeleteSuccess(false), []);
    const closeUpdateSuccess = useCallback(() => setShowUpdateSuccess(false), []);

    return (
        <div className={styles['Admin-cp-layout']}>
            <Adsidebar onLogout={onLogout} />
            <div className={styles['Admin-cp-main-content']}>
                <Adnavbar onLogout={onLogout} />

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
                            <span className={styles['Admin-cp-filter-icon-container']}>☰</span>
                        </div>
                        <div className={styles['Admin-cp-filter-content']}>
                            <div className={styles['Admin-cp-text-container']}>
                                <label className={styles['Admin-cp-floating-label']}>Search Company</label>
                                <input
                                    type="text"
                                    className={styles['Admin-cp-text']}
                                    value={filters.company}
                                    onChange={(event) => setFilters((prev) => ({ ...prev, company: event.target.value }))}
                                />
                            </div>

                            <div className={styles['Admin-cp-text-container']}>
                                <label className={styles['Admin-cp-floating-label']}>Search Domain</label>
                                <input
                                    type="text"
                                    className={styles['Admin-cp-text']}
                                    value={filters.domain}
                                    onChange={(event) => setFilters((prev) => ({ ...prev, domain: event.target.value }))}
                                />
                            </div>

                            <div className={styles['Admin-cp-dropdown-container']}>
                                <select
                                    className={styles['Admin-cp-dropdown']}
                                    value={filters.mode}
                                    onChange={(event) => setFilters((prev) => ({ ...prev, mode: event.target.value }))}
                                >
                                    <option value="">Select Mode</option>
                                    <option value="Online">Online</option>
                                    <option value="Offline">Offline</option>
                                    <option value="Hybrid">Hybrid</option>
                                </select>
                            </div>

                            <div className={`${styles['Admin-cp-text-container']} ${styles['date-container']}`}>
                                <label className={styles['Admin-cp-floating-label']}>Visit Date</label>
                                <input
                                    type="date"
                                    className={`${styles['Admin-cp-text']} ${styles['date-input']}`}
                                    value={filters.visitDate}
                                    onChange={(event) => setFilters((prev) => ({ ...prev, visitDate: event.target.value }))}
                                />
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
                                <button className={styles['Admin-cp-print-btn']} onClick={exportToExcel}>
                                    Export Excel
                                </button>
                            </div>
                            <div className={styles['Admin-cp-print-button-container']}>
                                <button className={styles['Admin-cp-print-btn']} onClick={exportToPDF}>
                                    Export PDF
                                </button>
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
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-domain']}`}>Domain</th>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-job-role']}`}>Job Role</th>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-mode']}`}>Mode</th>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-hr-name']}`}>HR Name</th>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-hr-contact']}`}>HR Contact</th>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-round']}`}>Rounds</th>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-status']}`}>Status</th>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-visit-date']}`}>Visit Date</th>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-package']}`}>Package</th>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-location']}`}>Location</th>
                                    <th className={`${styles['Admin-cp-th']} ${styles['Admin-cp-bond-period']}`}>Bond Period</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={14} style={{ textAlign: 'center', padding: '2rem 0' }}>
                                            Loading…
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
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-domain']}`}>{company.domain || '—'}</td>
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-job-role']}`}>{company.jobRole || '—'}</td>
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-mode']}`}>{company.mode || '—'}</td>
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-hr-name']}`}>{company.hrName || '—'}</td>
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-hr-contact']}`}>{company.hrContact || '—'}</td>
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-round']}`}>{company.round ?? '—'}</td>
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-status']}`}>
                                                    <span
                                                        className={`${styles['Admin-cp-status-tag']} ${company.status === 'Confirmed' ? styles['Admin-cp-status-confirmed'] : styles['Admin-cp-status-pending']}`}
                                                    >
                                                        {company.status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-visit-date']}`}>
                                                    {company.visitDate ? new Date(company.visitDate).toLocaleDateString() : '—'}
                                                </td>
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-package']}`}>{company.package || '—'}</td>
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-location']}`}>{company.location || '—'}</td>
                                                <td className={`${styles['Admin-cp-td']} ${styles['Admin-cp-bond-period']}`}>{company.bondPeriod || '—'}</td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={14} style={{ textAlign: 'center', padding: '2rem 0' }}>
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
                />
            </div>
        </div>
    );
}

export default Admincompanyprofile;