import React, { useState, useEffect } from 'react'; 
import { useNavigate, useParams } from "react-router-dom"; 
import Adnavbar from '../components/Navbar/Adnavbar.js';
import Adsidebar from '../components/Sidebar/Adsidebar.js';
// FIXED: Import CSS as a Module
import styles from './AdExistingCoordinator.module.css';
import Adminicon from "../assets/Adminicon.png";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import mongoDBService from '../services/mongoDBService';

// --- ICONS FOR POPUPS (Updated to use styles object when needed) ---
const TrashIcon = () => (
    <svg className={styles['Admin-MC-popup-icon-svg']} viewBox="0 0 24 24"><path d="M3 6h18v2H3V6zm2 3h14v13H5V9zm5 2v9h2v-9h-2zm4 0v9h2v-9h-2zM9 3h6v2H9V3z"/></svg>
);
const BlockIcon = () => (
    <svg className={styles['Admin-MC-popup-icon-svg']} viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.42 0 8 3.58 8 8 0 1.85-.63 3.55-1.69 4.9z"/></svg>
);
const WarningIcon = () => (
    <svg className={styles['Admin-MC-popup-icon-svg']} viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
);
// CheckIcon component is present but unused in the JSX rendering flow, so it's safely kept as-is.
const EyeIcon = () => (
    <svg className={styles['Admin-MC-profile-eye-icon']} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

function AdminMcood() {
    const navigate = useNavigate();
    const { branchCode } = useParams(); 

    const [tempFilterName, setTempFilterName] = useState('');
    const [tempFilterRegno, setTempFilterRegno] = useState('');
    const [nameFocused, setNameFocused] = useState(false);
    const [regnoFocused, setRegnoFocused] = useState(false);
    const [filterName, setFilterName] = useState('');
    const [filterRegno, setFilterRegno] = useState('');
    const [showExportMenu, setShowExportMenu] = useState(false);

    const [coordinators, setCoordinators] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isUpdatingSelection, setIsUpdatingSelection] = useState(false);
    const [viewBlocklist, setViewBlocklist] = useState(false);
    const [selectedCoordinatorIds, setSelectedCoordinatorIds] = useState(new Set());
    
    const [popupType, setPopupType] = useState('none');

    useEffect(() => {
        let isMounted = true;

        const fetchCoordinators = async () => {
            setIsLoading(true);
            setLoadError(null);

            try {
                const filters = branchCode ? { department: branchCode } : {};
                const response = await mongoDBService.getCoordinators(filters);
                const apiCoordinators = Array.isArray(response?.coordinators) ? response.coordinators : [];

                const mapped = apiCoordinators.map((coordinator, index) => {
                    const nameParts = [coordinator.firstName, coordinator.lastName].filter(Boolean);
                    const fullName = coordinator.fullName || nameParts.join(' ').trim();

                    return {
                        id: coordinator._id || coordinator.coordinatorId || `coordinator-${index}`,
                        coordinatorId: coordinator.coordinatorId || '',
                        name: fullName || coordinator.username || 'N/A',
                        branch: coordinator.department || '',
                        gender: coordinator.gender || 'N/A',
                        emailId: coordinator.email || '',
                        domainEmail: coordinator.domainEmail || '',
                        phone: coordinator.phone || '',
                        blocked: Boolean(coordinator.isBlocked),
                    };
                });

                if (isMounted) {
                    setCoordinators(mapped);
                    setSelectedCoordinatorIds(new Set());
                }
            } catch (error) {
                console.error('Failed to load coordinators:', error);
                if (isMounted) {
                    setLoadError(error?.message || 'Failed to load coordinators. Please try again.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchCoordinators();

        return () => {
            isMounted = false;
        };
    }, [branchCode]);

    const handleViewCoordinators = () => {
        setFilterName(tempFilterName);
        setFilterRegno(tempFilterRegno);
        setViewBlocklist(false);
    };
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') handleViewCoordinators();
    };
    
    const handleCoordinatorSelect = (id) => {
        setSelectedCoordinatorIds(prevIds => {
            const newIds = new Set(prevIds);
            if (newIds.has(id)) newIds.delete(id);
            else newIds.add(id);
            return newIds;
        });
    };
    
    const handleAddCoordinator = () => {
        const trimmedBranch = branchCode?.trim();

        if (trimmedBranch) {
            navigate(`/admin-coordinator-detail?branch=${encodeURIComponent(trimmedBranch)}`, {
                state: { branchCode: trimmedBranch }
            });
        } else {
            navigate('/admin-coordinator-detail');
        }
    };

    const handleEdit = () => {
        if (selectedCoordinatorIds.size === 1) {
            const selectedId = Array.from(selectedCoordinatorIds)[0];
            const coordinatorToEdit = coordinators.find(c => c.id === selectedId);
            if (coordinatorToEdit) navigate(`/admin-view-coordinator/${coordinatorToEdit.coordinatorId}`);
        } else {
            alert("Please select exactly one coordinator to edit.");
        }
    };

    // --- ACTION HANDLERS (Open Popups) ---

    const updateSelectedBlockStatus = async (shouldBlock) => {
        const idsArray = Array.from(selectedCoordinatorIds);
        if (idsArray.length === 0) return false;

        setIsUpdatingSelection(true);
        try {
            await Promise.all(idsArray.map((selectedId) => {
                const coordinator = coordinators.find(c => c.id === selectedId);
                if (!coordinator || !coordinator.coordinatorId) return Promise.resolve();
                return mongoDBService.updateCoordinatorBlockStatus(coordinator.coordinatorId, shouldBlock);
            }));

            setCoordinators(prev => prev.map(coordinator =>
                selectedCoordinatorIds.has(coordinator.id)
                    ? { ...coordinator, blocked: shouldBlock }
                    : coordinator
            ));
            return true;
        } catch (error) {
            console.error('Failed to update coordinator block status:', error);
            alert(error?.message || 'Failed to update coordinator status. Please try again.');
            return false;
        } finally {
            setIsUpdatingSelection(false);
        }
    };

    const handleBlockClick = async () => {
        if (selectedCoordinatorIds.size > 0) {
            const success = await updateSelectedBlockStatus(true);
            if (success) {
                setPopupType('block');
            }
        }
    };
    
    const handleUnblockClick = async () => {
        if (selectedCoordinatorIds.size > 0) {
            const success = await updateSelectedBlockStatus(false);
            if (success) {
                setPopupType('unblock');
            }
        }
    };

    const handleDeleteClick = () => {
        if (selectedCoordinatorIds.size > 0) {
            setPopupType('deleteWarning');
        }
    };

    // --- POPUP CONFIRMATION HANDLERS ---

    const confirmDelete = async () => {
        const idsArray = Array.from(selectedCoordinatorIds);
        if (idsArray.length === 0) return;

        try {
            await Promise.all(idsArray.map((selectedId) => {
                const coordinator = coordinators.find(c => c.id === selectedId);
                if (!coordinator || !coordinator.coordinatorId) return Promise.resolve();
                return mongoDBService.deleteCoordinator(coordinator.coordinatorId);
            }));

            setCoordinators(prev => prev.filter(coordinator => !selectedCoordinatorIds.has(coordinator.id)));
            setPopupType('deleteSuccess');
        } catch (error) {
            console.error('Failed to delete coordinators:', error);
            alert(error?.message || 'Failed to delete coordinators. Please try again.');
        }
    };

    const closePopup = () => {
        if (popupType === 'deleteSuccess') {
            setSelectedCoordinatorIds(new Set());
        }
        setPopupType('none');
    };

    // --- Filtering and Export logic ---
    const normalizedBranchCode = (branchCode || '').toUpperCase();

    const filteredCoordinators = coordinators.filter(coordinator => {
        // Ensure branchCode is case-insensitive
        const branchMatch = normalizedBranchCode ? (coordinator.branch || '').toUpperCase() === normalizedBranchCode : true;
        if (!branchMatch) return false;
        
        const nameMatch = filterName === '' || coordinator.name.toLowerCase().includes(filterName.toLowerCase());
        const regnoMatch = filterRegno === '' || coordinator.coordinatorId.includes(filterRegno);
        return nameMatch && regnoMatch;
    });
    
    const blockedCoordinators = filteredCoordinators.filter(c => c.blocked);
    const visibleCoordinators = viewBlocklist ? blockedCoordinators : filteredCoordinators;
    
    const exportToExcel = () => {
        const data = visibleCoordinators.map(c => [c.name, c.coordinatorId, c.branch, c.gender, c.emailId, c.domainEmail, c.phone]);
        const header = ["Name", "Coordinator ID", "Branch", "Gender", "Email-id", "Domain Email", "Phone"];
        const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Coordinators");
        XLSX.writeFile(wb, `Coordinators_Report_${branchCode}.xlsx`);
        setShowExportMenu(false);
    };

    const exportToPDF = () => {
        const doc = new jsPDF('landscape');
        const columns = ["Name", "Coordinator ID", "Branch", "Gender", "Email-id", "Domain Email", "Phone"];
        const rows = visibleCoordinators.map(c => [c.name, c.coordinatorId, c.branch, c.gender, c.emailId, c.domainEmail, c.phone]);
        doc.text(`Coordinators Report - ${branchCode}`, 14, 15);
        autoTable(doc,{ head: [columns], body: rows, startY: 20, styles: { fontSize: 8 } });
        doc.save(`Coordinators_Report_${branchCode}.pdf`);
        setShowExportMenu(false);
    };

    const fullBranchName = branchCode; // Keeping branchCode as the displayed name for simplicity

    return (
        <>
            <Adnavbar Adminicon={Adminicon} />
            {/* UPDATED CLASS: Admin-MC-layout */}
            <div className={styles['Admin-MC-layout']}>
                <Adsidebar />
                {/* UPDATED CLASS: Admin-MC-main-content */}
                <div className={styles['Admin-MC-main-content']}>
                    
                    {/* UPDATED CLASS: Admin-MC-top-card */}
                    <div className={styles['Admin-MC-top-card']}>
                        {/* UPDATED CLASS: Admin-MC-filter-section */}
                        <div className={styles['Admin-MC-filter-section']}>
                            {/* UPDATED CLASS: Admin-MC-filter-header-container */}
                            <div className={styles['Admin-MC-filter-header-container']}>
                                {/* UPDATED CLASS: Admin-MC-filter-header */}
                                <div className={styles['Admin-MC-filter-header']}>View {branchCode} Coordinators</div>
                                {/* UPDATED CLASS: Admin-MC-filter-icon-container */}
                                <span className={styles['Admin-MC-filter-icon-container']}>☰</span>
                            </div>
                            {/* UPDATED CLASS: Admin-MC-filter-content */}
                            <div className={styles['Admin-MC-filter-content']}>
                                {/* UPDATED CLASS: Admin-MC-text-container, has-value, is-focused, Admin-MC-floating-label, Admin-MC-text */}
                                <div className={`${styles['Admin-MC-text-container']} ${tempFilterName ? styles['has-value'] : ''} ${nameFocused ? styles['is-focused'] : ''}`}>
                                    <label className={styles['Admin-MC-floating-label']}>Name</label>
                                    <input type="text" className={styles['Admin-MC-text']} value={tempFilterName} onChange={(e) => setTempFilterName(e.target.value)} onFocus={() => setNameFocused(true)} onBlur={() => setNameFocused(false)} onKeyPress={handleKeyPress} />
                                </div>
                                {/* UPDATED CLASS: Admin-MC-text-container, has-value, is-focused, Admin-MC-floating-label, Admin-MC-text */}
                                <div className={`${styles['Admin-MC-text-container']} ${tempFilterRegno ? styles['has-value'] : ''} ${regnoFocused ? styles['is-focused'] : ''}`}>
                                    <label className={styles['Admin-MC-floating-label']}>Coordinator ID</label>
                                    <input type="text" className={styles['Admin-MC-text']} value={tempFilterRegno} onChange={(e) => setTempFilterRegno(e.target.value)} onFocus={() => setRegnoFocused(true)} onBlur={() => setRegnoFocused(false)} onKeyPress={handleKeyPress} />
                                </div>
                                {/* UPDATED CLASS: Admin-MC-button-group, Admin-MC-button, Admin-MC-view-students-btn, Admin-MC-blocklist-btn */}
                                <div className={styles['Admin-MC-button-group']}>
                                    <button className={`${styles['Admin-MC-button']} ${styles['Admin-MC-view-students-btn']}`} onClick={handleViewCoordinators}>Filter</button>
                                    <button className={`${styles['Admin-MC-button']} ${styles['Admin-MC-blocklist-btn']}`} onClick={() => setViewBlocklist(true)}>Blocklist</button>
                                </div>
                            </div>
                        </div>

                        {/* UPDATED CLASS: Admin-MC-action-cards-section */}
                        <div className={styles['Admin-MC-action-cards-section']}>
                            {/* UPDATED CLASS: Admin-MC-branch-info-top, Admin-MC-branch-info-card, Admin-MC-branch-info-text, Admin-MC-back-btn, Admin-MC-back-arrow */}
                            <div className={styles['Admin-MC-branch-info-top']}>
                                <div className={styles['Admin-MC-branch-info-card']}>
                                    <p className={styles['Admin-MC-branch-info-text']}>Branch: {fullBranchName}</p>
                                </div>
                                <button className={styles['Admin-MC-back-btn']} onClick={() => navigate('/admin-add-branch-main')}>Back <span className={styles['Admin-MC-back-arrow']}>➜</span></button>
                            </div>

                            {/* UPDATED CLASS: Admin-MC-action-cards-row */}
                            <div className={styles['Admin-MC-action-cards-row']}>
                                {/* UPDATED CLASSES for all action cards and buttons */}
                                <div className={styles['Admin-MC-action-card']}>
                                    <h4 className={styles['Admin-MC-action-firstheader']}>Add Coordinator</h4>
                                    <p className={styles['Admin-MC-action-description']}>Add <br/>Coordinator<br/>To<br/> Manage<br/> The Branch</p>
                                    <button className={`${styles['Admin-MC-action-btn']} ${styles['Admin-MC-add-btn']}`} onClick={handleAddCoordinator}>Add</button>
                                </div>
                                <div className={styles['Admin-MC-action-card']}>
                                    <h4 className={styles['Admin-MC-action-header']}>Editing</h4>
                                    <p className={styles['Admin-MC-action-description']}>Select <br/>Coordinator <br/>Record<br/> Before <br/> Editing</p>
                                    <button className={`${styles['Admin-MC-action-btn']} ${styles['Admin-MC-edit-btn']}`} onClick={handleEdit} disabled={selectedCoordinatorIds.size !== 1}>Edit</button>
                                </div>
                                <div className={styles['Admin-MC-action-card']}>
                                    <h4 className={styles['Admin-MC-action-header']}>Blocking</h4>
                                    <p className={styles['Admin-MC-action-description']}>Select <br/>coordinator<br/> Record <br/>Before<br/> Blocking</p>
                                    <button className={`${styles['Admin-MC-action-btn']} ${styles['Admin-MC-block-btn']}`} onClick={handleBlockClick} disabled={selectedCoordinatorIds.size < 1 || isUpdatingSelection}>Block</button>
                                </div>
                                <div className={styles['Admin-MC-action-card']}>
                                    <h4 className={styles['Admin-MC-action-header']}>Unblocking</h4>
                                    <p className={styles['Admin-MC-action-description']}>Select <br/>coordinator<br/>Record<br/> Before<br/> Unblocking</p>
                                    <button className={`${styles['Admin-MC-action-btn']} ${styles['Admin-MC-unblock-btn']}`} onClick={handleUnblockClick} disabled={selectedCoordinatorIds.size < 1 || isUpdatingSelection}>Unblock</button>
                                </div>
                                <div className={styles['Admin-MC-action-card']}>
                                    <h4 className={styles['Admin-MC-action-header']}>Deleting</h4>
                                    <p className={styles['Admin-MC-action-description']}>Select <br/> Coordinator<br/> Record <br/> Before <br/>Deleting</p>
                                    <button className={`${styles['Admin-MC-action-btn']} ${styles['Admin-MC-delete-btn']}`} onClick={handleDeleteClick} disabled={selectedCoordinatorIds.size < 1}>Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* UPDATED CLASS: Admin-MC-bottom-card */}
                    <div className={styles['Admin-MC-bottom-card']}>
                        {/* UPDATED CLASS: Admin-MC-table-header-row, Admin-MC-table-title, Admin-MC-table-actions, Admin-MC-print-button-container, Admin-MC-print-btn, Admin-MC-export-menu */}
                        <div className={styles['Admin-MC-table-header-row']}>
                            <h3 className={styles['Admin-MC-table-title']}>EXISTING COORDINATORS ({branchCode})</h3>
                            <div className={styles['Admin-MC-table-actions']}>
                                <div className={styles['Admin-MC-print-button-container']}>
                                    <button className={styles['Admin-MC-print-btn']} onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); }}>Print</button>
                                    {showExportMenu && (
                                        <div className={styles['Admin-MC-export-menu']}>
                                            <button onClick={exportToExcel}>Export to Excel</button>
                                            <button onClick={exportToPDF}>Download as PDF</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* UPDATED CLASS: Admin-MC-table-container */}
                        <div className={styles['Admin-MC-table-container']}>
                            {/* UPDATED CLASS: Admin-MC-students-table */}
                            <table className={styles['Admin-MC-students-table']}>
                                <thead>
                                    {/* UPDATED CLASS: Admin-MC-table-head-row */}
                                    <tr className={styles['Admin-MC-table-head-row']}>
                                        {/* UPDATED CLASSES for all table headers */}
                                        <th className={`${styles['Admin-MC-th']} ${styles['Admin-MC-select']}`}>Select</th> 
                                        <th className={`${styles['Admin-MC-th']} ${styles['Admin-MC-sno']}`}>S.No</th>
                                        <th className={`${styles['Admin-MC-th']} ${styles['Admin-MC-name']}`}>Name</th>
                                        <th className={`${styles['Admin-MC-th']} ${styles['Admin-MC-coordinator-id']}`}>Coordinator ID</th>
                                        <th className={`${styles['Admin-MC-th']} ${styles['Admin-MC-branch']}`}>Branch</th>
                                        <th className={`${styles['Admin-MC-th']} ${styles['Admin-MC-gender']}`}>Gender</th>
                                        <th className={`${styles['Admin-MC-th']} ${styles['Admin-MC-email-id']}`}>Email-id</th>
                                        <th className={`${styles['Admin-MC-th']} ${styles['Admin-MC-domain-email']}`}>Domain Email</th>
                                        <th className={`${styles['Admin-MC-th']} ${styles['Admin-MC-phone']}`}>Phone</th>
                                        <th className={`${styles['Admin-MC-th']} ${styles['Admin-MC-view']}`}>View</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr><td colSpan="10" style={{ textAlign: "center", color: "#2d2d2d", fontSize: "1.1rem", fontFamily: "Arial, sans-serif", width: "100%", display: "block", padding: "20px" }}>Loading coordinators...</td></tr>
                                    ) : loadError ? (
                                        <tr><td colSpan="10" style={{ textAlign: "center", color: "#d23b42", fontSize: "1.1rem", fontFamily: "Arial, sans-serif", width: "100%", display: "block", padding: "20px" }}>{loadError}</td></tr>
                                    ) : visibleCoordinators.length === 0 ? (
                                        <tr><td colSpan="10" style={{ textAlign: "center", color: "#2d2d2d", fontSize: "1.2rem", fontFamily: "Arial, sans-serif", width: "100%", display: "block", padding: "20px" }}>{viewBlocklist ? `No blocked coordinators in ${branchCode}` : `No coordinators found for ${branchCode}`}</td></tr>
                                    ) : (
                                        visibleCoordinators.map((coordinator, index) => (
                                            // UPDATED CLASS: Admin-MC-table-row, Admin-MC-selected-row
                                            <tr key={coordinator.id} className={`${styles['Admin-MC-table-row']} ${selectedCoordinatorIds.has(coordinator.id) ? styles['Admin-MC-selected-row'] : ''}`} onClick={() => handleCoordinatorSelect(coordinator.id)}>
                                                {/* UPDATED CLASSES for all table data cells and checkbox */}
                                                <td className={`${styles['Admin-MC-td']} ${styles['Admin-MC-select']}`} onClick={(e) => e.stopPropagation()}>
                                                    <input type="checkbox" checked={selectedCoordinatorIds.has(coordinator.id)} onChange={() => handleCoordinatorSelect(coordinator.id)}/>
                                                </td>
                                                <td className={`${styles['Admin-MC-td']} ${styles['Admin-MC-sno']}`}>{index + 1}</td>
                                                <td className={`${styles['Admin-MC-td']} ${styles['Admin-MC-name']}`}>{coordinator.name}</td>
                                                <td className={`${styles['Admin-MC-td']} ${styles['Admin-MC-coordinator-id']}`}>{coordinator.coordinatorId}</td>
                                                <td className={`${styles['Admin-MC-td']} ${styles['Admin-MC-branch']}`}>{coordinator.branch}</td>
                                                <td className={`${styles['Admin-MC-td']} ${styles['Admin-MC-gender']}`}>{coordinator.gender}</td>
                                                <td className={`${styles['Admin-MC-td']} ${styles['Admin-MC-email-id']}`}>{coordinator.emailId}</td>
                                                <td className={`${styles['Admin-MC-td']} ${styles['Admin-MC-domain-email']}`}>{coordinator.domainEmail}</td>
                                                <td className={`${styles['Admin-MC-td']} ${styles['Admin-MC-phone']}`}>{coordinator.phone}</td>
                                                <td className={`${styles['Admin-MC-td']} ${styles['Admin-MC-view']}`} onClick={() => navigate(`/admin-view-coordinator/${coordinator.coordinatorId}`)}><EyeIcon /></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- CUSTOM POPUPS RENDER (All classes updated) --- */}
            {popupType !== 'none' && (
                <div className={styles['Admin-MC-popup-overlay']}>
                    <div className={styles['Admin-MC-popup-content']}>
                        <div className={styles['Admin-MC-popup-header']}>
                            {popupType === 'block' && <h2 className={styles['Admin-MC-popup-title']}>Blocked !</h2>}
                            {popupType === 'unblock' && <h2 className={styles['Admin-MC-popup-title']}>Unblocked !</h2>}
                            {popupType === 'deleteWarning' && <h2 className={styles['Admin-MC-popup-title']}>Warning !</h2>}
                            {popupType === 'deleteSuccess' && <h2 className={styles['Admin-MC-popup-title']}>Deleted !</h2>}
                        </div>

                        <div className={`${styles['Admin-MC-popup-icon-container']} ${
                            popupType === 'block' ? styles['Admin-MC-icon-bg-block'] :
                            popupType === 'unblock' ? styles['Admin-MC-icon-bg-unblock'] :
                            popupType === 'deleteWarning' ? styles['Admin-MC-icon-bg-warning'] :
                            styles['Admin-MC-icon-bg-deleted']
                        }`}>
                            {popupType === 'block' && <BlockIcon />}
                            {popupType === 'unblock' && <BlockIcon />}
                            {popupType === 'deleteWarning' && <WarningIcon />}
                            {popupType === 'deleteSuccess' && <TrashIcon />}
                        </div>

                        {popupType === 'block' && (
                            <>
                                <p className={styles['Admin-MC-popup-message-large']}>Coordinator Blocked ✓</p>
                                <p className={styles['Admin-MC-popup-message-small']}>The selected Coordinator<br/>has been Blocked Successfully!</p>
                                <button className={`${styles['Admin-MC-popup-btn']} ${styles['Admin-MC-btn-close']}`} onClick={closePopup}>Close</button>
                            </>
                        )}

                        {popupType === 'unblock' && (
                            <>
                                <p className={styles['Admin-MC-popup-message-large']}>Coordinator Unblocked ✓</p>
                                <p className={styles['Admin-MC-popup-message-small']}>The selected Coordinator<br/>has been Unblocked Successfully!</p>
                                <button className={`${styles['Admin-MC-popup-btn']} ${styles['Admin-MC-btn-close']}`} onClick={closePopup}>Close</button>
                            </>
                        )}

                        {popupType === 'deleteWarning' && (
                            <>
                                <p className={styles['Admin-MC-popup-message-large']}>Coordinator<br/>will be Deleted</p>
                                <p className={styles['Admin-MC-popup-message-small']}>The selected coordinator<br/>will be Deleted from the Database permanently!</p>
                                <div className={styles['Admin-MC-popup-actions']}>
                                    <button className={`${styles['Admin-MC-popup-btn']} ${styles['Admin-MC-btn-confirm']}`} onClick={confirmDelete}>Confirm</button>
                                    <button className={`${styles['Admin-MC-popup-btn']} ${styles['Admin-MC-btn-back']}`} onClick={closePopup}>Back ⓧ</button>
                                </div>
                            </>
                        )}

                        {popupType === 'deleteSuccess' && (
                            <>
                                <p className={styles['Admin-MC-popup-message-large']}>Coordinator Deleted ✓</p>
                                <p className={styles['Admin-MC-popup-message-small']}>The selected Coordinator<br/>has been Deleted Successfully!</p>
                                <button className={`${styles['Admin-MC-popup-btn']} ${styles['Admin-MC-btn-close']}`} onClick={closePopup}>Close</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default AdminMcood;