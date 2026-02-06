import React, { useState, useEffect } from 'react'; 
import { useNavigate, useParams } from "react-router-dom"; 
import useAdminAuth from '../utils/useAdminAuth';
import Adnavbar from '../components/Navbar/Adnavbar.js';
import Adsidebar from '../components/Sidebar/Adsidebar.js';
// FIXED: Import CSS as a Module
import styles from './AdExistingCoordinator.module.css';
import achStyles from '../StudentPages/Achievements.module.css';
import Adminicon from "../assets/Adminicon.png";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import mongoDBService from '../services/mongoDBService';

// --- ICONS ---
const EyeIcon = () => (
    <svg className={styles['Admin-MC-profile-eye-icon']} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

// LoadingPopup removed - using button state instead

// Block Success Popup
const BlockSuccessPopup = ({ onClose }) => (
    <div className={achStyles['Achievement-popup-overlay']}>
        <div className={achStyles['Achievement-popup-container']}>
            <div className={`${achStyles['Achievement-popup-header']} ${achStyles['Achievement-popup-header--success']}`}>Blocked !</div>
            <div className={achStyles['Achievement-popup-body']}>
                <div className={achStyles['Achievement-status-icon']}>
                    <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <circle cx="36" cy="36" r="24" stroke="#D23B42" strokeWidth="6" fill="none" strokeLinecap="round" />
                        <line x1="22" y1="22" x2="50" y2="50" stroke="#D23B42" strokeWidth="6" strokeLinecap="round" />
                    </svg>
                </div>
                <h2 className={achStyles['Achievement-status-title']}>Coordinator Blocked ✓</h2>
                <p className={achStyles['Achievement-status-text']}>The selected Coordinator has been Blocked Successfully!</p>
            </div>
            <div className={achStyles['Achievement-popup-footer']}>
                <button onClick={onClose} className={achStyles['Achievement-popup-close-btn']}>Close</button>
            </div>
        </div>
    </div>
);

// Unblock Success Popup
const UnblockSuccessPopup = ({ onClose }) => (
    <div className={achStyles['Achievement-popup-overlay']}>
        <div className={achStyles['Achievement-popup-container']}>
            <div className={`${achStyles['Achievement-popup-header']} ${achStyles['Achievement-popup-header--success']}`}>Unblocked !</div>
            <div className={achStyles['Achievement-popup-body']}>
                <div className={styles['Admin-MC-status-icon']}>
                    <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <circle cx="36" cy="36" r="24" stroke="#D2AF3B" strokeWidth="6" fill="none" strokeLinecap="round" />
                        <line x1="22" y1="50" x2="31" y2="41" stroke="#D2AF3B" strokeWidth="6" strokeLinecap="round" />
                        <line x1="41" y1="31" x2="50" y2="22" stroke="#D2AF3B" strokeWidth="6" strokeLinecap="round" />
                    </svg>
                </div>
                <h2 className={achStyles['Achievement-status-title']}>Coordinator Unblocked ✓</h2>
                <p className={achStyles['Achievement-status-text']}>The selected Coordinator has been Unblocked Successfully!</p>
            </div>
            <div className={achStyles['Achievement-popup-footer']}>
                <button onClick={onClose} className={achStyles['Achievement-popup-close-btn']}>Close</button>
            </div>
        </div>
    </div>
);

// Delete Branch Confirmation Popup
const DeleteBranchConfirmationPopup = ({ onClose, onConfirm, branchName, isDeleting }) => (
    <div className={styles['Admin-MC-delete-branch-popup-container']}>
        <div className={styles['Admin-MC-delete-branch-popup-header']}>Delete Branch</div>
        <div className={styles['Admin-MC-delete-branch-popup-body']}>
            <svg className={styles['Admin-MC-delete-branch-warning-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className={styles['Admin-MC-delete-branch-warning-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
                <path d="M26 16v12M26 34v2" stroke="#ffffff" strokeWidth="3" fill="none"/>
            </svg>
            <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#333', fontWeight: 600 }}>Are you sure?</h2>
            <p style={{ margin: 0, color: '#888', fontSize: 16 }}>Delete branch <strong>{branchName}</strong>?</p>
            <p style={{ margin: '10px 0 0 0', color: '#d32f2f', fontSize: 14, fontWeight: 500 }}>This will permanently remove all coordinators!</p>
        </div>
        <div className={styles['Admin-MC-delete-branch-popup-footer']}>
            <button onClick={onClose} className={styles['Admin-MC-delete-branch-popup-cancel-btn']} disabled={isDeleting}>Discard</button>
            <button onClick={onConfirm} className={styles['Admin-MC-delete-branch-popup-delete-btn']} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete'}</button>
        </div>
    </div>
);

// Delete Branch Success Popup
const DeleteBranchSuccessPopup = ({ onClose, branchName }) => (
    <div className={styles['Admin-MC-delete-branch-popup-container']}>
        <div className={styles['Admin-MC-delete-branch-popup-header']}>Deleted !</div>
        <div className={styles['Admin-MC-delete-branch-popup-body']}>
            <svg className={styles['Admin-MC-delete-branch-delete-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className={styles['Admin-MC-delete-branch-delete-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
                <g className={styles['Admin-MC-delete-branch-delete-icon--bin']} fill="none" strokeWidth="2">
                    <path d="M16 20l20 0M18 20l0 16c0 1 1 2 2 2l12 0c1 0 2-1 2-2l0-16M21 20l0-3c0-1 1-2 2-2l6 0c1 0 2 1 2 2l0 3M23 25l0 8M26 25l0 8M29 25l0 8"/>
                </g>
            </svg>
            <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#000', fontWeight: 700 }}>Branch Deleted ✓</h2>
            <p style={{ margin: 0, color: '#888', fontSize: 16 }}>Branch <strong>{branchName}</strong> has been Deleted Successfully!</p>
        </div>
        <div className={styles['Admin-MC-delete-branch-popup-footer']}>
            <button onClick={onClose} className={styles['Admin-MC-delete-branch-popup-close-btn']}>Close</button>
        </div>
    </div>
);

// Delete Coordinator Confirmation Popup
const DeleteCoordinatorConfirmationPopup = ({ onClose, onConfirm, selectedCount, isDeleting }) => (
    <div className={styles['Admin-MC-delete-branch-popup-container']}>
        <div className={styles['Admin-MC-delete-branch-popup-header']}>Delete Coordinator</div>
        <div className={styles['Admin-MC-delete-branch-popup-body']}>
            <svg className={styles['Admin-MC-delete-branch-warning-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className={styles['Admin-MC-delete-branch-warning-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
                <path d="M26 16v12M26 34v2" stroke="#ffffff" strokeWidth="3" fill="none"/>
            </svg>
            <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#333', fontWeight: 600 }}>Are you sure?</h2>
            <p style={{ margin: 0, color: '#888', fontSize: 16 }}>Delete {selectedCount} selected coordinator{selectedCount > 1 ? 's' : ''}?</p>
            <p style={{ margin: '10px 0 0 0', color: '#d32f2f', fontSize: 14, fontWeight: 500 }}>The selected coordinator will be Deleted from the Database permanently!</p>
        </div>
        <div className={styles['Admin-MC-delete-branch-popup-footer']}>
            <button onClick={onClose} className={styles['Admin-MC-delete-branch-popup-cancel-btn']} disabled={isDeleting}>Discard</button>
            <button onClick={onConfirm} className={styles['Admin-MC-delete-branch-popup-delete-btn']} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Confirm'}</button>
        </div>
    </div>
);

// Delete Coordinator Success Popup
const DeleteCoordinatorSuccessPopup = ({ onClose, selectedCount }) => (
    <div className={styles['Admin-MC-delete-branch-popup-container']}>
        <div className={styles['Admin-MC-delete-branch-popup-header']}>Deleted !</div>
        <div className={styles['Admin-MC-delete-branch-popup-body']}>
            <svg className={styles['Admin-MC-delete-branch-delete-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className={styles['Admin-MC-delete-branch-delete-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
                <g className={styles['Admin-MC-delete-branch-delete-icon--bin']} fill="none" strokeWidth="2">
                    <path d="M16 20l20 0M18 20l0 16c0 1 1 2 2 2l12 0c1 0 2-1 2-2l0-16M21 20l0-3c0-1 1-2 2-2l6 0c1 0 2 1 2 2l0 3M23 25l0 8M26 25l0 8M29 25l0 8"/>
                </g>
            </svg>
            <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#000', fontWeight: 700 }}>Coordinator Deleted ✓</h2>
            <p style={{ margin: 0, color: '#888', fontSize: 16 }}>The selected Coordinator has been Deleted Successfully!</p>
        </div>
        <div className={styles['Admin-MC-delete-branch-popup-footer']}>
            <button onClick={onClose} className={styles['Admin-MC-delete-branch-popup-close-btn']}>Close</button>
        </div>
    </div>
);

function AdminMcood() {
    useAdminAuth(); // JWT authentication verification
    const navigate = useNavigate();
    const { branchCode } = useParams(); 

    const [tempFilterName, setTempFilterName] = useState('');
    const [tempFilterRegno, setTempFilterRegno] = useState('');
    const [nameFocused, setNameFocused] = useState(false);
    const [regnoFocused, setRegnoFocused] = useState(false);
    const [filterName, setFilterName] = useState('');
    const [filterRegno, setFilterRegno] = useState('');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [fullBranchName, setFullBranchName] = useState('');

    const [coordinators, setCoordinators] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [viewBlocklist, setViewBlocklist] = useState(false);
    const [selectedCoordinatorIds, setSelectedCoordinatorIds] = useState(new Set());
    
    const [isBranchDeleting, setIsBranchDeleting] = useState(false);
    const [showDeleteBranchConfirm, setShowDeleteBranchConfirm] = useState(false);
    const [showDeleteBranchSuccess, setShowDeleteBranchSuccess] = useState(false);
    const [showDeleteCoordinatorConfirm, setShowDeleteCoordinatorConfirm] = useState(false);
    const [showDeleteCoordinatorSuccess, setShowDeleteCoordinatorSuccess] = useState(false);
    const [isDeletingCoordinator, setIsDeletingCoordinator] = useState(false);
    const [showBlockSuccess, setShowBlockSuccess] = useState(false);
    const [showUnblockSuccess, setShowUnblockSuccess] = useState(false);
    const [blockInProgress, setBlockInProgress] = useState(false);
    const [unblockInProgress, setUnblockInProgress] = useState(false);

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
                        dob: coordinator.dob || coordinator.dateOfBirth || null,
                        branch: coordinator.department || '',
                        gender: coordinator.gender || 'N/A',
                        emailId: coordinator.email || '',
                        domainEmail: coordinator.domainEmail || '',
                        phone: coordinator.phone || '',
                        cabin: coordinator.cabin || coordinator.cabinNo || 'N/A',
                        password: coordinator.password || 'N/A',
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

    useEffect(() => {
        let isMounted = true;

        const fetchBranchName = async () => {
            const trimmedBranch = branchCode?.trim();

            if (!trimmedBranch) {
                if (isMounted) setFullBranchName('');
                return;
            }

            try {
                const branches = await mongoDBService.getBranches();
                const normalizedCode = trimmedBranch.toUpperCase();
                const match = branches.find(branch => {
                    const branchCodeValue = (branch.branchAbbreviation || branch.branchCode || branch.id || '').toUpperCase();
                    return branchCodeValue === normalizedCode;
                });

                if (isMounted) {
                    setFullBranchName(match?.branchFullName || match?.branchName || trimmedBranch);
                }
            } catch (error) {
                console.error('Failed to load branch name:', error);
                if (isMounted) {
                    setFullBranchName(trimmedBranch);
                }
            }
        };

        fetchBranchName();

        return () => {
            isMounted = false;
        };
    }, [branchCode]);

    const handleViewCoordinators = () => {
        setFilterName(tempFilterName);
        setFilterRegno(tempFilterRegno);
        setViewBlocklist(false);
    };
    
    const handleDeleteBranchClick = () => {
        setShowDeleteBranchConfirm(true);
    };

    const confirmDeleteBranch = async () => {
        setIsBranchDeleting(true);
        try {
            // Delete all coordinators in this branch first
            await Promise.all(coordinators.map(coordinator => {
                if (coordinator.coordinatorId) {
                    return mongoDBService.deleteCoordinator(coordinator.coordinatorId);
                }
                return Promise.resolve();
            }));
            
            // Delete the branch itself from the database
            await mongoDBService.deleteBranch(branchCode);
            
            setIsBranchDeleting(false);
            setShowDeleteBranchConfirm(false);
            setShowDeleteBranchSuccess(true);
        } catch (error) {
            console.error('Failed to delete branch:', error);
            setIsBranchDeleting(false);
            alert(error?.message || 'Failed to delete branch. Please try again.');
        }
    };

    const closeDeleteBranchSuccess = () => {
        setShowDeleteBranchSuccess(false);
        navigate('/admin-add-branch-main');
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
            if (coordinatorToEdit) {
                // Navigate to edit form with coordinator ID in query parameter
                navigate(`/admin-coordinator-detail?editId=${coordinatorToEdit.coordinatorId}`);
            }
        } else {
            alert("Please select exactly one coordinator to edit.");
        }
    };

    // --- ACTION HANDLERS (Open Popups) ---

    const handleBlockClick = async () => {
        if (selectedCoordinatorIds.size === 0) return;
        
        setBlockInProgress(true);
        const idsArray = Array.from(selectedCoordinatorIds);
        
        try {
            await Promise.all(idsArray.map((selectedId) => {
                const coordinator = coordinators.find(c => c.id === selectedId);
                if (!coordinator || !coordinator.coordinatorId) return Promise.resolve();
                return mongoDBService.updateCoordinatorBlockStatus(coordinator.coordinatorId, true);
            }));

            setCoordinators(prev => prev.map(coordinator =>
                selectedCoordinatorIds.has(coordinator.id)
                    ? { ...coordinator, blocked: true }
                    : coordinator
            ));
            setShowBlockSuccess(true);
        } catch (error) {
            console.error('Failed to block coordinators:', error);
            alert(error?.message || 'Failed to block coordinators. Please try again.');
        } finally {
            setBlockInProgress(false);
        }
    };
    
    const handleUnblockClick = async () => {
        if (selectedCoordinatorIds.size === 0) return;
        
        setUnblockInProgress(true);
        const idsArray = Array.from(selectedCoordinatorIds);
        
        try {
            await Promise.all(idsArray.map((selectedId) => {
                const coordinator = coordinators.find(c => c.id === selectedId);
                if (!coordinator || !coordinator.coordinatorId) return Promise.resolve();
                return mongoDBService.updateCoordinatorBlockStatus(coordinator.coordinatorId, false);
            }));

            setCoordinators(prev => prev.map(coordinator =>
                selectedCoordinatorIds.has(coordinator.id)
                    ? { ...coordinator, blocked: false }
                    : coordinator
            ));
            setShowUnblockSuccess(true);
        } catch (error) {
            console.error('Failed to unblock coordinators:', error);
            alert(error?.message || 'Failed to unblock coordinators. Please try again.');
        } finally {
            setUnblockInProgress(false);
        }
    };

    const handleDeleteClick = () => {
        if (selectedCoordinatorIds.size > 0) {
            setShowDeleteCoordinatorConfirm(true);
        }
    };

    // --- POPUP CONFIRMATION HANDLERS ---

    const confirmDelete = async () => {
        const idsArray = Array.from(selectedCoordinatorIds);
        if (idsArray.length === 0) return;

        setIsDeletingCoordinator(true);

        try {
            await Promise.all(idsArray.map((selectedId) => {
                const coordinator = coordinators.find(c => c.id === selectedId);
                if (!coordinator || !coordinator.coordinatorId) return Promise.resolve();
                return mongoDBService.deleteCoordinator(coordinator.coordinatorId);
            }));

            setCoordinators(prev => prev.filter(coordinator => !selectedCoordinatorIds.has(coordinator.id)));
            setIsDeletingCoordinator(false);
            setShowDeleteCoordinatorConfirm(false);
            setShowDeleteCoordinatorSuccess(true);
        } catch (error) {
            console.error('Failed to delete coordinators:', error);
            setIsDeletingCoordinator(false);
            alert(error?.message || 'Failed to delete coordinators. Please try again.');
        }
    };

    const closePopup = () => {
        if (showDeleteCoordinatorSuccess) {
            setSelectedCoordinatorIds(new Set());
        }
        setShowDeleteCoordinatorSuccess(false);
        setShowBlockSuccess(false);
        setShowUnblockSuccess(false);
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
    
    // Check if all selected coordinators are already blocked or unblocked
    const selectedCoordinators = coordinators.filter(c => selectedCoordinatorIds.has(c.id));
    const allSelectedAreBlocked = selectedCoordinators.length > 0 && selectedCoordinators.every(c => c.blocked);
    const allSelectedAreUnblocked = selectedCoordinators.length > 0 && selectedCoordinators.every(c => !c.blocked);
    
    const exportToExcel = () => {
        const data = visibleCoordinators.map((c, i) => [i + 1, c.name, c.cabin, c.phone || 'N/A', c.coordinatorId, c.password, c.emailId || 'N/A']);
        const header = ["S.No", "Name", "Cabin", "Phone", "Coordinator ID", "Password", "Mail ID"];
        const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Coordinators");
        XLSX.writeFile(wb, `Coordinators_Report_${branchCode}.xlsx`);
        setShowExportMenu(false);
    };

    const exportToPDF = () => {
        const doc = new jsPDF('landscape');
        const columns = ["S.No", "Name", "Cabin", "Phone", "Coordinator ID", "Password", "Mail ID"];
        const rows = visibleCoordinators.map((c, i) => [i + 1, c.name, c.cabin, c.phone || 'N/A', c.coordinatorId, c.password, c.emailId || 'N/A']);
        doc.text(`Coordinators Report - ${branchCode}`, 14, 15);
        autoTable(doc,{ head: [columns], body: rows, startY: 20, styles: { fontSize: 8 } });
        doc.save(`Coordinators_Report_${branchCode}.pdf`);
        setShowExportMenu(false);
    };

    const displayBranchName = fullBranchName || branchCode;

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
                                    <p className={styles['Admin-MC-branch-info-text']}>{displayBranchName}</p>

                                </div>
                                <button className={styles['Admin-MC-back-btn']} onClick={() => navigate('/admin-add-branch-main')}>Back <span className={styles['Admin-MC-back-arrow']}>➜</span></button>
                            </div>

                            {/* UPDATED CLASS: Admin-MC-action-cards-row */}
                            <div className={styles['Admin-MC-action-cards-row']}>
                                {/* UPDATED CLASSES for all action cards and buttons */}
                                <div className={styles['Admin-MC-action-card']}>
                                    <h4 className={styles['Admin-MC-action-firstheader']}>Additional</h4>
                                    <p className={styles['Admin-MC-action-description']}>Add <br/>Coordinator<br/>To<br/> Manage<br/> The Branch</p>
                                    <button className={`${styles['Admin-MC-action-btn']} ${styles['Admin-MC-add-btn']}`} onClick={handleAddCoordinator}>Add</button>
                                </div>
                                <div className={styles['Admin-MC-action-card']}>
                                    <h4 className={styles['Admin-MC-action-header']}>Editing</h4>
                                    <p className={styles['Admin-MC-action-description']}>Select <br/>Coordinator <br/>Record<br/> Before <br/> Editing</p>
                                    <button className={`${styles['Admin-MC-action-btn']} ${styles['Admin-MC-edit-btn']}`} onClick={handleEdit} disabled={selectedCoordinatorIds.size !== 1 || blockInProgress || unblockInProgress || isDeletingCoordinator}>Edit</button>
                                </div>
                                <div className={styles['Admin-MC-action-card']}>
                                    <h4 className={styles['Admin-MC-action-header']}>Blocking</h4>
                                    <p className={styles['Admin-MC-action-description']}>Select <br/>coordinator<br/> Record <br/>Before<br/> Blocking</p>
                                    <button className={`${styles['Admin-MC-action-btn']} ${styles['Admin-MC-block-btn']}`} onClick={handleBlockClick} disabled={selectedCoordinatorIds.size < 1 || blockInProgress || unblockInProgress || isDeletingCoordinator || allSelectedAreBlocked}>{blockInProgress ? 'Blocking...' : 'Block'}</button>
                                </div>
                                <div className={styles['Admin-MC-action-card']}>
                                    <h4 className={styles['Admin-MC-action-header']}>Unblocking</h4>
                                    <p className={styles['Admin-MC-action-description']}>Select <br/>coordinator<br/>Record<br/> Before<br/> Unblocking</p>
                                    <button className={`${styles['Admin-MC-action-btn']} ${styles['Admin-MC-unblock-btn']}`} onClick={handleUnblockClick} disabled={selectedCoordinatorIds.size < 1 || unblockInProgress || blockInProgress || isDeletingCoordinator || allSelectedAreUnblocked}>{unblockInProgress ? 'Unblocking...' : 'Unblock'}</button>
                                </div>
                                <div className={styles['Admin-MC-action-card']}>
                                    <h4 className={styles['Admin-MC-action-header']}>Deleting</h4>
                                    <p className={styles['Admin-MC-action-description']}>Select <br/> Coordinator<br/> Record <br/> Before <br/>Deleting</p>
                                    <button className={`${styles['Admin-MC-action-btn']} ${styles['Admin-MC-delete-btn']}`} onClick={handleDeleteClick} disabled={selectedCoordinatorIds.size < 1 || blockInProgress || unblockInProgress || isDeletingCoordinator}>Delete</button>
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
                                <button 
                                    className={styles['Admin-MC-delete-branch-header-btn']} 
                                    onClick={handleDeleteBranchClick}
                                >
                                    Delete Branch ({branchCode})
                                </button>
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
                                        <th className={`${styles['Admin-MC-th']} ${styles['Admin-MC-dob']}`}>DOB</th>
                                        <th className={`${styles['Admin-MC-th']} ${styles['Admin-MC-cabin-no']}`}>Cabin</th>
                                        <th className={`${styles['Admin-MC-th']} ${styles['Admin-MC-phone']}`}>Phone</th>
                                        <th className={`${styles['Admin-MC-th']} ${styles['Admin-MC-cid']}`}>Coordinator ID</th>
                                        <th className={`${styles['Admin-MC-th']} ${styles['Admin-MC-email']}`}>Mail ID</th>
                                        <th className={`${styles['Admin-MC-th']} ${styles['Admin-MC-view']}`}>View</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr className={styles['Admin-MC-loading-row']}>
                                            <td colSpan="9" className={styles['Admin-MC-loading-cell']}>
                                                <div className={styles['Admin-MC-loading-wrapper']}>
                                                    <div className={styles['Admin-MC-spinner']}></div>
                                                    <span className={styles['Admin-MC-loading-text']}>Loading coordinators…</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : loadError ? (
                                        <tr><td colSpan="9" style={{ textAlign: "center", color: "#d23b42", fontSize: "1.1rem", fontFamily: "Arial, sans-serif", padding: "20px" }}>{loadError}</td></tr>
                                    ) : visibleCoordinators.length === 0 ? (
                                        <tr><td colSpan="9" style={{ textAlign: "center", color: "#2d2d2d", fontSize: "1.2rem", fontFamily: "Arial, sans-serif", padding: "20px" }}>{viewBlocklist ? `No blocked coordinators in ${branchCode}` : `No coordinators found for ${branchCode}`}</td></tr>
                                    ) : (
                                        visibleCoordinators.map((coordinator, index) => (
                                            // UPDATED CLASS: Admin-MC-table-row, Admin-MC-selected-row, Admin-MC-blocked-row
                                            <tr key={coordinator.id} className={`${styles['Admin-MC-table-row']} ${selectedCoordinatorIds.has(coordinator.id) ? styles['Admin-MC-selected-row'] : ''} ${coordinator.blocked ? styles['Admin-MC-blocked-row'] : ''}`} onClick={() => handleCoordinatorSelect(coordinator.id)}>
                                                {/* UPDATED CLASSES for all table data cells and checkbox */}
                                                <td className={`${styles['Admin-MC-td']} ${styles['Admin-MC-select']}`} onClick={(e) => e.stopPropagation()}>
                                                    <input type="checkbox" checked={selectedCoordinatorIds.has(coordinator.id)} onChange={() => handleCoordinatorSelect(coordinator.id)} className={styles['Admin-MC-green-checkbox']}/>
                                                </td>
                                                <td className={`${styles['Admin-MC-td']} ${styles['Admin-MC-sno']}`}>{index + 1}</td>
                                                <td className={`${styles['Admin-MC-td']} ${styles['Admin-MC-name']}`}>{coordinator.name}</td>
                                                <td className={`${styles['Admin-MC-td']} ${styles['Admin-MC-dob']}`}>{coordinator.dob ? new Date(coordinator.dob).toLocaleDateString('en-GB') : 'N/A'}</td>
                                                <td className={`${styles['Admin-MC-td']} ${styles['Admin-MC-cabin-no']}`}>{coordinator.cabin}</td>
                                                <td className={`${styles['Admin-MC-td']} ${styles['Admin-MC-phone']}`}>{coordinator.phone || 'N/A'}</td>
                                                <td className={`${styles['Admin-MC-td']} ${styles['Admin-MC-cid']}`}>{coordinator.coordinatorId}</td>
                                                <td className={`${styles['Admin-MC-td']} ${styles['Admin-MC-email']}`}>{coordinator.emailId || 'N/A'}</td>
                                                <td className={`${styles['Admin-MC-td']} ${styles['Admin-MC-view']}`} onClick={() => navigate(`/admin-coordinator-detail?viewId=${coordinator.coordinatorId}`)}><EyeIcon /></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- POPUPS --- */}
            {showBlockSuccess && <BlockSuccessPopup onClose={closePopup} />}
            {showUnblockSuccess && <UnblockSuccessPopup onClose={closePopup} />}

            {/* Delete Coordinator Confirmation Popup */}
            {showDeleteCoordinatorConfirm && (
                <div className={styles['Admin-MC-delete-branch-popup-overlay']}>
                    <DeleteCoordinatorConfirmationPopup
                        onClose={() => setShowDeleteCoordinatorConfirm(false)}
                        onConfirm={confirmDelete}
                        selectedCount={selectedCoordinatorIds.size}
                        isDeleting={isDeletingCoordinator}
                    />
                </div>
            )}

            {/* Delete Coordinator Success Popup */}
            {showDeleteCoordinatorSuccess && (
                <div className={styles['Admin-MC-delete-branch-popup-overlay']}>
                    <DeleteCoordinatorSuccessPopup
                        onClose={closePopup}
                        selectedCount={selectedCoordinatorIds.size}
                    />
                </div>
            )}

            {/* Delete Branch Confirmation Popup */}
            {showDeleteBranchConfirm && (
                <div className={styles['Admin-MC-delete-branch-popup-overlay']}>
                    <DeleteBranchConfirmationPopup
                        onClose={() => setShowDeleteBranchConfirm(false)}
                        onConfirm={confirmDeleteBranch}
                        branchName={branchCode}
                        isDeleting={isBranchDeleting}
                    />
                </div>
            )}

            {/* Delete Branch Success Popup */}
            {showDeleteBranchSuccess && (
                <div className={styles['Admin-MC-delete-branch-popup-overlay']}>
                    <DeleteBranchSuccessPopup
                        onClose={closeDeleteBranchSuccess}
                        branchName={branchCode}
                    />
                </div>
            )}
        </>
    );
}

export default AdminMcood;