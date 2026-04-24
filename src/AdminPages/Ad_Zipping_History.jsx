import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';
import Adnavbar from '../components/Navbar/Adnavbar';
import Adsidebar from '../components/Sidebar/Adsidebar';
import styles from './Ad_Zipping_History.module.css';
import Adminicon from '../assets/Adminicon.png';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import mongoDBService from '../services/mongoDBService.jsx';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

const Ad_Zipping_History = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

    // State for sidebar
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // State for tabs
    const [activeTab, setActiveTab] = useState('history');

    // Filter state
    const [actionFilter, setActionFilter] = useState('all');

    // State for history data
    const [historyData, setHistoryData] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Export states
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportPopupState, setExportPopupState] = useState('none');
    const [exportProgress, setExportProgress] = useState(0);
    const [exportType, setExportType] = useState('Excel');

    // Toggle sidebar
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const handleOverlayClick = () => setIsSidebarOpen(false);

    // Fetch zipping history from MongoDB
    const fetchHistory = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const history = await mongoDBService.getZippingHistory();
            // Format date for display
            const formattedHistory = history.map(h => ({
                ...h,
                date: new Date(h.date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }).replace(/\//g, ' - ')
            }));
            setHistoryData(formattedHistory);
        } catch (err) {
            console.error('Error fetching zipping history:', err);
            setError('Failed to load zipping history');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Load data on mount
    useEffect(() => {
        if (isAuthenticated) {
            fetchHistory();
        }
    }, [isAuthenticated, fetchHistory]);

    // Apply action filter whenever data or selection changes
    useEffect(() => {
        if (actionFilter === 'all') {
            setFilteredHistory(historyData);
            return;
        }

        const targetAction = actionFilter === 'zipped' ? 'Zipped Batch' : 'Unzipped Batch';
        setFilteredHistory(historyData.filter((item) => item.action === targetAction));
    }, [historyData, actionFilter]);

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'active') {
            navigate('/admin/active-zip/student-database', { state: { source: 'student-database' } });
        } else if (tab === 'zipped') {
            navigate('/admin/zipped-batches');
        }
    };

    // Get action badge class
    const getActionClass = (action) => {
        switch (action) {
            case 'Zipped Batch':
                return styles['Ad-zh-action-zipped'];
            case 'Unzipped Batch':
                return styles['Ad-zh-action-unzipped'];
            case 'Deleted Batch':
                return styles['Ad-zh-action-deleted'];
            default:
                return '';
        }
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

            const exportData = filteredHistory.map((item, index) => ({
                'S.No': index + 1,
                'Date': item.date,
                'Action': item.action,
                'Batch': item.batch,
                'Implemented By': item.implementedBy,
                'Details': item.details
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Zipping History');

            XLSX.writeFile(workbook, 'Zipping_History.xlsx');

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
            doc.text('Zipping History', 14, 20);

            const tableData = filteredHistory.map((item, index) => [
                index + 1,
                item.date,
                item.action,
                item.batch,
                item.implementedBy,
                item.details
            ]);

            autoTable(doc, {
                head: [['S.No', 'Date', 'Action', 'Batch', 'Implemented By', 'Details']],
                body: tableData,
                startY: 30,
                theme: 'grid',
                headStyles: { fillColor: [78, 162, 78] }
            });

            doc.save('Zipping_History.pdf');

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
            if (showExportMenu && !e.target.closest(`.${styles['Ad-zh-print-button-container']}`)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showExportMenu]);

    if (authLoading) {
        return <div className={styles['Ad-zh-layout']}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className={styles['Ad-zh-layout']}>
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
                    className={styles['Ad-zh-overlay']}
                    onClick={handleOverlayClick}
                />
            )}

            {/* Main Content */}
            <main className={styles['Ad-zh-main-content']}>
                {/* Tab Navigation */}
                <div className={styles['Ad-zh-tab-container']}>
                    <button
                        className={`${styles['Ad-zh-tab-btn']} ${activeTab === 'active' ? styles['Ad-zh-tab-active'] : ''}`}
                        onClick={() => handleTabChange('active')}
                    >
                        Active Batches
                    </button>
                    <button
                        className={`${styles['Ad-zh-tab-btn']} ${activeTab === 'zipped' ? styles['Ad-zh-tab-active'] : ''}`}
                        onClick={() => handleTabChange('zipped')}
                    >
                        Zipped Batches
                    </button>
                    <button
                        className={`${styles['Ad-zh-tab-btn']} ${activeTab === 'history' ? styles['Ad-zh-tab-active'] : ''}`}
                        onClick={() => handleTabChange('history')}
                    >
                        Zipping History
                    </button>
                </div>

                <div className={styles['Ad-zh-action-filter-wrapper']}>
                    <select
                        id="ad-zh-action-filter"
                        className={styles['Ad-zh-action-filter-select']}
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                    >
                        <option value="all">All Batches</option>
                        <option value="zipped">Zipped Batches</option>
                        <option value="unzipped">Unzipped Batches</option>
                    </select>
                </div>

                {/* Table Card */}
                <div className={styles['Ad-zh-table-card']}>
                    <div className={styles['Ad-zh-table-header']}>
                        <h3 className={styles['Ad-zh-table-title']}>Zipping History</h3>
                        <div className={styles['Ad-zh-print-button-container']}>
                            <button
                                className={styles['Ad-zh-print-btn']}
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                disabled={isExporting}
                            >
                                Print
                            </button>
                            {showExportMenu && (
                                <div className={styles['Ad-zh-export-menu']}>
                                    <button onClick={handleExportExcel}>Export to Excel</button>
                                    <button onClick={handleExportPDF}>Export as PDF</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles['Ad-zh-table-container']}>
                        <table className={styles['Ad-zh-table']}>
                            <thead>
                                <tr className={styles['Ad-zh-table-head-row']}>
                                    <th className={styles['Ad-zh-th']}>S.No</th>
                                    <th className={styles['Ad-zh-th']}>Date</th>
                                    <th className={styles['Ad-zh-th']}>Action</th>
                                    <th className={styles['Ad-zh-th']}>Batch</th>
                                    <th className={styles['Ad-zh-th']}>Implemented</th>
                                    <th className={styles['Ad-zh-th']}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="6" className={styles['Ad-zh-loading-cell']}>
                                            <div className={styles['Ad-zh-spinner']}></div>
                                            <span>Loading...</span>
                                        </td>
                                    </tr>
                                ) : filteredHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className={styles['Ad-zh-no-data']}>
                                            No history found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredHistory.map((item, index) => (
                                        <tr key={item.id} className={styles['Ad-zh-table-row']}>
                                            <td className={styles['Ad-zh-td']}>{index + 1}</td>
                                            <td className={styles['Ad-zh-td']}>{item.date}</td>
                                            <td className={styles['Ad-zh-td']}>
                                                <span className={`${styles['Ad-zh-action-tag']} ${getActionClass(item.action)}`}>
                                                    {item.action}
                                                </span>
                                            </td>
                                            <td className={`${styles['Ad-zh-td']} ${styles['Ad-zh-td-batch']}`}>{item.batch}</td>
                                            <td className={styles['Ad-zh-td']}>{item.implementedBy}</td>
                                            <td className={styles['Ad-zh-td']}>{item.details}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

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
                isOpen={exportPopupState === 'failed'}
                onClose={() => setExportPopupState('none')}
                exportType={exportType}
            />
        </div>
    );
};

export default Ad_Zipping_History;
