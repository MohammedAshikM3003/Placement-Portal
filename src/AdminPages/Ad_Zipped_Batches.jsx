import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';
import Adnavbar from '../components/Navbar/Adnavbar';
import Adsidebar from '../components/Sidebar/Adsidebar';
import styles from './Ad_Zipped_Batches.module.css';
import Adminicon from '../assets/Adminicon.png';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import mongoDBService from '../services/mongoDBService.jsx';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert, UnzippingProgressAlert, UnzippedSuccessAlert } from '../components/alerts';

// Delete Confirmation Popup
const DeleteConfirmationPopup = ({ onClose, onConfirm, archiveName, isDeleting }) => (
    <div className={styles['Ad-zb-popup-overlay']}>
        <div className={styles['Ad-zb-popup-container']}>
            <div className={styles['Ad-zb-popup-header']}>Delete Archive</div>
            <div className={styles['Ad-zb-popup-body']}>
                <div className={styles['Ad-zb-warning-icon']}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="50" height="50">
                        <circle cx="26" cy="26" r="25" fill="#FF9800" />
                        <path d="M26 16v12M26 34v2" stroke="#ffffff" strokeWidth="3" fill="none" strokeLinecap="round" />
                    </svg>
                </div>
                <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#333', fontWeight: 600 }}>Are you sure?</h2>
                <p style={{ margin: 0, color: '#888', fontSize: 16, lineHeight: 1.45 }}>
                    You are about to delete <strong>"{archiveName}"</strong>. This action cannot be undone.
                </p>
            </div>
            <div className={styles['Ad-zb-popup-footer']}>
                <button className={styles['Ad-zb-popup-cancel-btn']} onClick={onClose} disabled={isDeleting}>
                    Cancel
                </button>
                <button className={styles['Ad-zb-popup-delete-btn']} onClick={onConfirm} disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    </div>
);

// Unzip Confirmation Popup
const UnzipConfirmationPopup = ({ onClose, onConfirm, archiveName, isUnzipping }) => (
    <div className={styles['Ad-zb-popup-overlay']}>
        <div className={styles['Ad-zb-popup-container']}>
            <div className={styles['Ad-zb-popup-header']}>Unzip Archive</div>
            <div className={styles['Ad-zb-popup-body']}>
                <div className={styles['Ad-zb-info-icon']}>
                    <svg className={styles['Ad-zb-warning-icon-animated']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className={styles['Ad-zb-warning-icon-animated-circle']} cx="26" cy="26" r="25" fill="none" />
                        <path className={styles['Ad-zb-warning-icon-animated-exclamation']} d="M26 16v12M26 34v2" strokeWidth="3" fill="none" strokeLinecap="round" />
                    </svg>
                </div>
                <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#333', fontWeight: 600 }}>Restore Archive?</h2>
                <p style={{ margin: 0, color: '#888', fontSize: 16, lineHeight: 1.45 }}>
                    Unzipping <strong>"{archiveName}"</strong> will restore all students from ALL departments in this batch to active status.
                </p>
            </div>
            <div className={styles['Ad-zb-popup-footer']}>
                <button className={styles['Ad-zb-popup-cancel-btn']} onClick={onClose} disabled={isUnzipping}>
                    Cancel
                </button>
                <button className={styles['Ad-zb-popup-confirm-btn']} onClick={onConfirm} disabled={isUnzipping}>
                    {isUnzipping ? 'Unzipping...' : 'Unzip'}
                </button>
            </div>
        </div>
    </div>
);

const Ad_Zipped_Batches = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

    // State for sidebar
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // State for tabs
    const [activeTab, setActiveTab] = useState('zipped');

    // State for zipped batches data
    const [zippedBatches, setZippedBatches] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Popup states
    const [showDeletePopup, setShowDeletePopup] = useState(false);
    const [showUnzipPopup, setShowUnzipPopup] = useState(false);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUnzipping, setIsUnzipping] = useState(false);

    // Unzipping progress states
    const [showUnzippingProgress, setShowUnzippingProgress] = useState(false);
    const [unzippingProgress, setUnzippingProgress] = useState(0);
    const [showUnzippedSuccess, setShowUnzippedSuccess] = useState(false);

    // Export states
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportPopupState, setExportPopupState] = useState('none');
    const [exportProgress, setExportProgress] = useState(0);
    const [exportType, setExportType] = useState('Excel');
    const [exportFailed, setExportFailed] = useState(null);

    // Toggle sidebar
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const handleOverlayClick = () => setIsSidebarOpen(false);

    // Fetch archived batches from MongoDB
    const fetchArchivedBatches = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const batches = await mongoDBService.getArchivedBatches();
            setZippedBatches(batches);
        } catch (err) {
            console.error('Error fetching archived batches:', err);
            setError('Failed to load archived batches');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load data on mount
    useEffect(() => {
        if (isAuthenticated) {
            fetchArchivedBatches();
        }
    }, [isAuthenticated, fetchArchivedBatches]);

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'active') {
            navigate('/admin/active-zip/student-database', { state: { source: 'student-database' } });
        } else if (tab === 'history') {
            navigate('/admin/zipping-history');
        }
    };

    // Handle view batch
    const handleViewBatch = (batch) => {
        navigate(`/admin/zipped-batch/departments/${encodeURIComponent(batch.archiveName)}`, {
            state: {
                batchData: batch
            }
        });
    };

    // Handle unzip
    const handleUnzipClick = (batch) => {
        setSelectedBatch(batch);
        setShowUnzipPopup(true);
    };

    const handleUnzipConfirm = async () => {
        setShowUnzipPopup(false);
        setShowUnzippingProgress(true);
        setUnzippingProgress(0);

        // Progress animation
        const progressInterval = setInterval(() => {
            setUnzippingProgress(prev => {
                if (prev >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 10;
            });
        }, 150);

        try {
            // Call API to unzip batch
            await mongoDBService.unzipBatch(selectedBatch.id, 'Admin');

            clearInterval(progressInterval);
            setUnzippingProgress(100);

            // Brief pause at 100% before showing success
            await new Promise(resolve => setTimeout(resolve, 300));

            // Remove from zipped batches
            setZippedBatches(prev => prev.filter(b => b.id !== selectedBatch.id));

            setShowUnzippingProgress(false);
            setShowUnzippedSuccess(true);
        } catch (err) {
            console.error('Unzip error:', err);
            clearInterval(progressInterval);
            setShowUnzippingProgress(false);
            setExportFailed({ message: 'Failed to unzip batch' });
            setTimeout(() => setExportFailed(null), 3000);
        } finally {
            setSelectedBatch(null);
        }
    };

    // Handle delete
    const handleDeleteClick = (batch) => {
        setSelectedBatch(batch);
        setShowDeletePopup(true);
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        try {
            // Call API to delete archived batch
            await mongoDBService.deleteArchivedBatch(selectedBatch.id, 'Admin');

            // Remove from zipped batches
            setZippedBatches(prev => prev.filter(b => b.id !== selectedBatch.id));

            setShowDeletePopup(false);
            setSelectedBatch(null);
            setExportPopupState('success');
            setTimeout(() => setExportPopupState('none'), 3000);
        } catch (err) {
            console.error('Delete error:', err);
            setExportFailed({ message: 'Failed to delete archive' });
            setTimeout(() => setExportFailed(null), 3000);
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle discard
    const handleDiscard = () => {
        navigate('/admin-student-database');
    };

    // Export functions
    const handleExportExcel = async () => {
        let progressInterval;
        try {
            setIsExporting(true);
            setShowExportMenu(false);
            setExportType('Excel');
            setExportPopupState('progress');
            setExportProgress(0);

            progressInterval = setInterval(() => {
                setExportProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 15;
                });
            }, 100);

            await new Promise((resolve) => setTimeout(resolve, 300));

            const exportData = zippedBatches.map((batch, index) => ({
                'S.No': index + 1,
                'Archive Name': batch.archiveName,
                'Year': batch.year,
                'Total Dept': batch.totalDept,
                'Total Students': batch.totalStudents,
                'Placed Students': batch.placedStudents
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Zipped Batches');

            XLSX.writeFile(workbook, 'Zipped_Batches.xlsx');

            clearInterval(progressInterval);
            setExportProgress(100);
            await new Promise((resolve) => setTimeout(resolve, 300));
            setExportPopupState('success');
        } catch (err) {
            clearInterval(progressInterval);
            console.error('Export error:', err);
            setExportPopupState('failed');
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPDF = async () => {
        let progressInterval;
        try {
            setIsExporting(true);
            setShowExportMenu(false);
            setExportType('PDF');
            setExportPopupState('progress');
            setExportProgress(0);

            progressInterval = setInterval(() => {
                setExportProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 15;
                });
            }, 100);

            await new Promise((resolve) => setTimeout(resolve, 300));

            const doc = new jsPDF('landscape');

            doc.setFontSize(16);
            doc.text('Zipped Batches', 14, 20);

            const tableData = zippedBatches.map((batch, index) => [
                index + 1,
                batch.archiveName,
                batch.year,
                batch.totalDept,
                batch.totalStudents,
                batch.placedStudents
            ]);

            autoTable(doc, {
                head: [['S.No', 'Archive Name', 'Year', 'Total Dept', 'Total Students', 'Placed Students']],
                body: tableData,
                startY: 30,
                theme: 'grid',
                headStyles: { fillColor: [78, 162, 78] }
            });

            doc.save('Zipped_Batches.pdf');

            clearInterval(progressInterval);
            setExportProgress(100);
            await new Promise((resolve) => setTimeout(resolve, 300));
            setExportPopupState('success');
        } catch (err) {
            clearInterval(progressInterval);
            console.error('Export error:', err);
            setExportPopupState('failed');
        } finally {
            setIsExporting(false);
        }
    };

    // Close export menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showExportMenu && !e.target.closest(`.${styles['Ad-zb-print-button-container']}`)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showExportMenu]);

    if (authLoading) {
        return <div className={styles['Ad-zb-layout']}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className={styles['Ad-zb-layout']}>
            {/* Navbar */}
            <Adnavbar
                onMenuClick={toggleSidebar}
                adminName="Admin"
                adminImage={Adminicon}
            />

            {/* Sidebar */}
            <Adsidebar isOpen={isSidebarOpen} />

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className={styles['Ad-zb-overlay']}
                    onClick={handleOverlayClick}
                />
            )}

            {/* Main Content */}
            <main className={styles['Ad-zb-main-content']}>
                {/* Tab Navigation */}
                <div className={styles['Ad-zb-tab-container']}>
                    <button
                        className={`${styles['Ad-zb-tab-btn']} ${activeTab === 'active' ? styles['Ad-zb-tab-active'] : ''}`}
                        onClick={() => handleTabChange('active')}
                    >
                        Active Batches
                    </button>
                    <button
                        className={`${styles['Ad-zb-tab-btn']} ${activeTab === 'zipped' ? styles['Ad-zb-tab-active'] : ''}`}
                        onClick={() => handleTabChange('zipped')}
                    >
                        Zipped Batches
                    </button>
                    <button
                        className={`${styles['Ad-zb-tab-btn']} ${activeTab === 'history' ? styles['Ad-zb-tab-active'] : ''}`}
                        onClick={() => handleTabChange('history')}
                    >
                        Zipping History
                    </button>
                </div>

                {/* Table Card */}
                <div className={styles['Ad-zb-table-card']}>
                    <div className={styles['Ad-zb-table-header']}>
                        <h3 className={styles['Ad-zb-table-title']}>Zipped Batches</h3>
                        <div className={styles['Ad-zb-print-button-container']}>
                            <button
                                className={styles['Ad-zb-print-btn']}
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                disabled={isExporting}
                            >
                                Print
                            </button>
                            {showExportMenu && (
                                <div className={styles['Ad-zb-export-menu']}>
                                    <button onClick={handleExportExcel}>Export to Excel</button>
                                    <button onClick={handleExportPDF}>Export as PDF</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles['Ad-zb-table-container']}>
                        <table className={styles['Ad-zb-table']}>
                            <thead>
                                <tr className={styles['Ad-zb-table-head-row']}>
                                    <th className={styles['Ad-zb-th']}>S.No</th>
                                    <th className={styles['Ad-zb-th']}>Archive Name</th>
                                    <th className={styles['Ad-zb-th']}>Year</th>
                                    <th className={styles['Ad-zb-th']}>Total Dept</th>
                                    <th className={styles['Ad-zb-th']}>Total Students</th>
                                    <th className={styles['Ad-zb-th']}>Placed Students</th>
                                    <th className={styles['Ad-zb-th']}>View</th>
                                    <th className={styles['Ad-zb-th']}>Unzip</th>
                                    <th className={styles['Ad-zb-th']}>Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="9" className={styles['Ad-zb-loading-cell']}>
                                            <div className={styles['Ad-zb-spinner']}></div>
                                            <span>Loading...</span>
                                        </td>
                                    </tr>
                                ) : zippedBatches.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className={styles['Ad-zb-no-data']}>
                                            No zipped batches found
                                        </td>
                                    </tr>
                                ) : (
                                    zippedBatches.map((batch, index) => (
                                        <tr key={batch.id} className={styles['Ad-zb-table-row']}>
                                            <td className={styles['Ad-zb-td']}>{index + 1}</td>
                                            <td className={`${styles['Ad-zb-td']} ${styles['Ad-zb-td-name']}`}>{batch.archiveName}</td>
                                            <td className={styles['Ad-zb-td']}>{batch.year}</td>
                                            <td className={styles['Ad-zb-td']}>{batch.totalDept}</td>
                                            <td className={styles['Ad-zb-td']}>{batch.totalStudents}</td>
                                            <td className={styles['Ad-zb-td']}>{batch.placedStudents}</td>
                                            <td className={styles['Ad-zb-td']}>
                                                <button
                                                    className={styles['Ad-zb-action-btn']}
                                                    onClick={() => handleViewBatch(batch)}
                                                    title="View"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#4EA24E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                        <circle cx="12" cy="12" r="3" stroke="#4EA24E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                </button>
                                            </td>
                                            <td className={styles['Ad-zb-td']}>
                                                <button
                                                    className={styles['Ad-zb-action-btn']}
                                                    onClick={() => handleUnzipClick(batch)}
                                                    title="Unzip"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                        <polyline points="17,8 12,3 7,8" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                        <line x1="12" y1="3" x2="12" y2="15" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                </button>
                                            </td>
                                            <td className={styles['Ad-zb-td']}>
                                                <button
                                                    className={styles['Ad-zb-action-btn']}
                                                    onClick={() => handleDeleteClick(batch)}
                                                    title="Delete"
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <polyline points="3,6 5,6 21,6" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                        <line x1="10" y1="11" x2="10" y2="17" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                        <line x1="14" y1="11" x2="14" y2="17" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Note */}
                    <div className={styles['Ad-zb-note']}>
                        <span className={styles['Ad-zb-note-label']}>Note :</span>
                        <span className={styles['Ad-zb-note-text']}>Unzipping restores students from ALL departments in this batch</span>
                    </div>

                    {/* Action Buttons */}
                    <div className={styles['Ad-zb-action-buttons']}>
                        <button
                            className={styles['Ad-zb-discard-btn']}
                            onClick={handleDiscard}
                        >
                            Discard
                        </button>
                        <button
                            className={styles['Ad-zb-archive-btn']}
                            onClick={() => navigate('/admin/active-zip/student-database', { state: { source: 'student-database' } })}
                        >
                            Archive Zip
                        </button>
                    </div>
                </div>
            </main>

            {/* Popups */}
            {showDeletePopup && selectedBatch && (
                <DeleteConfirmationPopup
                    onClose={() => { setShowDeletePopup(false); setSelectedBatch(null); }}
                    onConfirm={handleDeleteConfirm}
                    archiveName={selectedBatch.archiveName}
                    isDeleting={isDeleting}
                />
            )}

            {showUnzipPopup && selectedBatch && (
                <UnzipConfirmationPopup
                    onClose={() => { setShowUnzipPopup(false); setSelectedBatch(null); }}
                    onConfirm={handleUnzipConfirm}
                    archiveName={selectedBatch.archiveName}
                    isUnzipping={isUnzipping}
                />
            )}

            {/* Export Alerts */}
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
                isOpen={exportPopupState === 'failed' || !!exportFailed}
                onClose={() => {
                    setExportPopupState('none');
                    setExportFailed(null);
                }}
                exportType={exportType}
            />

            {/* Unzipping Progress Alert */}
            <UnzippingProgressAlert
                isOpen={showUnzippingProgress}
                progress={unzippingProgress}
                batchName={selectedBatch?.year || 'Batch'}
            />

            {/* Unzipped Success Alert */}
            <UnzippedSuccessAlert
                isOpen={showUnzippedSuccess}
                onClose={() => setShowUnzippedSuccess(false)}
            />
        </div>
    );
};

export default Ad_Zipped_Batches;
