import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Conavbar from '../components/Navbar/Adnavbar';
import Cosidebar from '../components/Sidebar/Adsidebar';
import styles from './AdminCompanyDrive.module.css'; 
import Adminicon from "../assets/Adminicon.png";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import AdminAddcompany from '../assets/companydriveADicon.svg';
import mongoDBService from '../services/mongoDBService';
import popupStyles from '../StudentPages/Achievements.module.css';

const DeleteConfirmationPopup = ({ onClose, onConfirm, selectedCount, isDeleting }) => (
    <div className={popupStyles.overlay}>
        <div className={popupStyles['Achievement-popup-container']}>
            <div className={popupStyles['Achievement-popup-header']}>Delete Drive</div>
            <div className={popupStyles['Achievement-popup-body']}>
                <svg className={popupStyles['Achievement-warning-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle className={popupStyles['Achievement-warning-icon--circle']} cx="26" cy="26" r="25" fill="none" />
                    <path d="M26 16v12M26 34v2" stroke="#ffffff" strokeWidth="3" fill="none" />
                </svg>
                <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#333', fontWeight: 600 }}>Are you sure?</h2>
                <p style={{ margin: 0, color: '#888', fontSize: 16 }}>
                    Delete {selectedCount} selected drive{selectedCount > 1 ? 's' : ''}?
                </p>
            </div>
            <div className={popupStyles['Achievement-popup-footer']}>
                <button
                    onClick={onClose}
                    className={popupStyles['Achievement-popup-cancel-btn']}
                    disabled={isDeleting}
                >
                    Discard
                </button>
                <button
                    onClick={onConfirm}
                    className={popupStyles['Achievement-popup-delete-btn']}
                    disabled={isDeleting}
                >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    </div>
);

const DeleteSuccessPopup = ({ onClose }) => (
    <div className={popupStyles.overlay}>
        <div className={popupStyles['Achievement-popup-container']}>
            <div className={popupStyles['Achievement-popup-header']}>Deleted !</div>
            <div className={popupStyles['Achievement-popup-body']}>
                <svg className={popupStyles['Achievement-delete-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle className={popupStyles['Achievement-delete-icon--circle']} cx="26" cy="26" r="25" fill="none" />
                    <g className={popupStyles['Achievement-delete-icon--bin']} fill="none" strokeWidth="2">
                        <path d="M16 20l20 0M18 20l0 16c0 1 1 2 2 2l12 0c1 0 2-1 2-2l0-16M21 20l0-3c0-1 1-2 2-2l6 0c1 0 2 1 2 2l0 3M23 25l0 8M26 25l0 8M29 25l0 8" />
                    </g>
                </svg>
                <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#000', fontWeight: 700 }}>Drive Deleted ✓</h2>
                <p style={{ margin: 0, color: '#888', fontSize: 16 }}>The selected drive has been deleted successfully!</p>
            </div>
            <div className={popupStyles['Achievement-popup-footer']}>
                <button onClick={onClose} className={popupStyles['Achievement-popup-close-btn']}>Close</button>
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

function AdminCompanyDrive({ onLogout }) {
    const navigate = useNavigate();
    
    // Temporary filter states
    const [tempFilterCompany, setTempFilterCompany] = useState('');
    const [tempFilterDepartment, setTempFilterDepartment] = useState('');
    const [tempFilterDomain, setTempFilterDomain] = useState('');
    const [tempFilterMode, setTempFilterMode] = useState('');
    
    // Focus states for floating labels
    const [companyFocused, setCompanyFocused] = useState(false);
    const [departmentFocused, setDepartmentFocused] = useState(false);
    const [domainFocused, setDomainFocused] = useState(false);
    
    // Applied filter states
    const [filterCompany, setFilterCompany] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('');
    const [filterDomain, setFilterDomain] = useState('');
    const [filterMode, setFilterMode] = useState('');
    
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [activePopup, setActivePopup] = useState(null);
    const [deleteInProgress, setDeleteInProgress] = useState(false);
    
    // Company drives data
    const [companies, setCompanies] = useState([]);

    const fetchDrives = useCallback(async () => {
        try {
            const drives = await mongoDBService.getCompanyDrives();
            setCompanies(drives || []);
        } catch (error) {
            console.error("Failed to fetch company drives:", error);
        }
    }, []);

    useEffect(() => {
        fetchDrives();
    }, [fetchDrives]);
    
    // Selected company IDs
    const [selectedCompanyIds, setSelectedCompanyIds] = useState(new Set());
    
    const handleSearch = () => {
        setFilterCompany(tempFilterCompany);
        setFilterDepartment(tempFilterDepartment);
        setFilterDomain(tempFilterDomain);
        setFilterMode(tempFilterMode);
    };
    
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
        navigate('/admin/company-drive/details', { 
            state: { companyData: company } 
        });
    };

    const filteredCompanies = companies.filter(company => {
        const companyMatch = filterCompany === '' || (company.companyName && company.companyName.toLowerCase().includes(filterCompany.toLowerCase()));
        const departmentMatch = filterDepartment === '' || (company.department && company.department.toLowerCase().includes(filterDepartment.toLowerCase()));
        const domainMatch = filterDomain === '' || (company.domain && company.domain.toLowerCase().includes(filterDomain.toLowerCase()));
        const modeMatch = filterMode === '' || company.mode === filterMode;
        return companyMatch && departmentMatch && domainMatch && modeMatch;
    });
    
    const exportToExcel = () => {
        const data = filteredCompanies.map(company => [company.companyName, company.jobRole, company.visitDate ? new Date(company.visitDate).toLocaleDateString() : 'N/A', company.mode, company.department, company.cgpa]);
        const header = ["Company", "Job Role", "Drive Date", "Mode", "Department", "CGPA"];
        const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Company Drives");
        XLSX.writeFile(wb, "Company_Drive_Report.xlsx");
        setShowExportMenu(false);
    };

    const exportToPDF = () => {
        const doc = new jsPDF('landscape');
        const columns = ["Company", "Job Role", "Drive Date", "Mode", "Department", "CGPA"];
        const rows = filteredCompanies.map(company => [company.companyName, company.jobRole, company.visitDate ? new Date(company.visitDate).toLocaleDateString() : 'N/A', company.mode, company.department, company.cgpa]);
        doc.text("Company Drive Report", 14, 15);
        doc.autoTable({ head: [columns], body: rows, startY: 20, styles: { fontSize: 8 } });
        doc.save("Company_Drive_Report.pdf");
        setShowExportMenu(false);
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
            <Conavbar Adminicon={Adminicon} onLogout={onLogout} />
            <div className={styles['Admin-cd-layout']}>
                <Cosidebar onLogout={onLogout} />
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
                                <span className={styles['Admin-cd-filter-icon-container']}>☰</span>
                            </div>
                            <div className={styles['Admin-cd-filter-content']}>
                                {/* Company Name Filter */}
                                <div className={`${styles['Admin-cd-text-container']} ${tempFilterCompany ? styles['has-value'] : ''} ${companyFocused ? styles['is-focused'] : ''}`}>
                                    <label className={styles['Admin-cd-floating-label']}>Search Company</label>
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
                                    <input
                                        type="text"
                                        className={styles['Admin-cd-text']}
                                        value={tempFilterDepartment}
                                        onChange={(e) => setTempFilterDepartment(e.target.value)}
                                        onFocus={() => setDepartmentFocused(true)}
                                        onBlur={() => setDepartmentFocused(false)}
                                    />
                                </div>

                                {/* Domain Filter */}
                                <div className={`${styles['Admin-cd-text-container']} ${tempFilterDomain ? styles['has-value'] : ''} ${domainFocused ? styles['is-focused'] : ''}`}>
                                    <label className={styles['Admin-cd-floating-label']}>Search Domain</label>
                                    <input
                                        type="text"
                                        className={styles['Admin-cd-text']}
                                        value={tempFilterDomain}
                                        onChange={(e) => setTempFilterDomain(e.target.value)}
                                        onFocus={() => setDomainFocused(true)}
                                        onBlur={() => setDomainFocused(false)}
                                    />
                                </div>

                                {/* Mode Filter - Dropdown */}
                                <div className={styles['Admin-cd-dropdown-container']}>
                                    <select
                                        className={styles['Admin-cd-dropdown']}
                                        value={tempFilterMode}
                                        onChange={(e) => setTempFilterMode(e.target.value)}
                                    >
                                        <option value="">Search Mode</option>
                                        <option value="Online">Online</option>
                                        <option value="Offline">Offline</option>
                                        <option value="Hybrid">Hybrid</option>
                                    </select>
                                </div>

                                <div className={styles['Admin-cd-button-group']}>
                                    <button 
                                        className={`${styles['Admin-cd-button']} ${styles['Admin-cd-search-btn']}`} 
                                        onClick={handleSearch}
                                    >
                                        View Drive
                                    </button>
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
                                        <th className={`${styles['Admin-cd-th']} ${styles['Admin-cd-visit-date']}`}>Drive Date</th>
                                        <th className={`${styles['Admin-cd-th']} ${styles['Admin-cd-mode']}`}>Mode</th>
                                        <th className={`${styles['Admin-cd-th']} ${styles['Admin-cd-domain']}`}>Department</th>
                                        <th className={`${styles['Admin-cd-th']} ${styles['Admin-cd-package']}`}>CGPA</th>
                                        <th className={`${styles['Admin-cd-th']} ${styles['Admin-cd-view']}`}>View</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCompanies.length === 0 ? (
                                        <tr className={styles['Admin-cd-table-row']}>
                                            <td colSpan="9" className={styles['Admin-cd-td']} style={{ textAlign: 'center' }}>
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
                                                <td className={`${styles['Admin-cd-td']} ${styles['Admin-cd-visit-date']}`}>{company.visitDate ? new Date(company.visitDate).toLocaleDateString() : 'N/A'}</td>
                                                <td className={`${styles['Admin-cd-td']} ${styles['Admin-cd-mode']}`}>{company.mode}</td>
                                                <td className={`${styles['Admin-cd-td']} ${styles['Admin-cd-domain']}`}>{company.department}</td>
                                                <td className={`${styles['Admin-cd-td']} ${styles['Admin-cd-package']}`}>{company.cgpa}</td>
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
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default AdminCompanyDrive;