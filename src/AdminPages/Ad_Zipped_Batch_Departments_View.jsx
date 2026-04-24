import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';
import Adnavbar from '../components/Navbar/Adnavbar';
import Adsidebar from '../components/Sidebar/Adsidebar';
import styles from './Ad_Zipped_Batch_Departments_View.module.css';
import Adminicon from '../assets/Adminicon.png';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import mongoDBService from '../services/mongoDBService.jsx';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert, UnzippingProgressAlert, UnzippedSuccessAlert } from '../components/alerts';

// Unzip Confirmation Popup
const UnzipConfirmationPopup = ({ onClose, onConfirm, archiveName, isUnzipping }) => (
    <div className={styles['Ad-zbdv-popup-overlay']}>
        <div className={styles['Ad-zbdv-popup-container']}>
            <div className={styles['Ad-zbdv-popup-header']}>Unzip Archive</div>
            <div className={styles['Ad-zbdv-popup-body']}>
                <div className={styles['Ad-zbdv-info-icon']}>
                    <svg className={styles['Ad-zbdv-warning-icon-animated']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className={styles['Ad-zbdv-warning-icon-animated-circle']} cx="26" cy="26" r="25" fill="none" />
                        <path className={styles['Ad-zbdv-warning-icon-animated-exclamation']} d="M26 16v12M26 34v2" strokeWidth="3" fill="none" strokeLinecap="round" />
                    </svg>
                </div>
                <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#333', fontWeight: 600 }}>Restore Archive?</h2>
                <p style={{ margin: 0, color: '#888', fontSize: 16, lineHeight: 1.45 }}>
                    Unzipping <strong>"{archiveName}"</strong> will restore all students from ALL departments in this batch to active status.
                </p>
            </div>
            <div className={styles['Ad-zbdv-popup-footer']}>
                <button className={styles['Ad-zbdv-popup-cancel-btn']} onClick={onClose} disabled={isUnzipping}>
                    Cancel
                </button>
                <button className={styles['Ad-zbdv-popup-confirm-btn']} onClick={onConfirm} disabled={isUnzipping}>
                    {isUnzipping ? 'Unzipping...' : 'Unzip'}
                </button>
            </div>
        </div>
    </div>
);

const Ad_Zipped_Batch_Departments_View = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { archiveId } = useParams();
    const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

    // Get batch data from navigation state
    const batchData = location.state?.batchData || {};
    const batchId = batchData.id || null;
    const archiveName = batchData.archiveName || decodeURIComponent(archiveId || '');
    const batchYear = batchData.year || '';

    // State for sidebar
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // State for departments data
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Batch stats
    const [batchStats, setBatchStats] = useState({
        archiveName: archiveName,
        year: batchYear,
        totalDepts: 0,
        totalStudents: 0,
        placedStudents: 0
    });

    // Unzip popup state
    const [showUnzipPopup, setShowUnzipPopup] = useState(false);
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
    const [exportSuccessHeaderText, setExportSuccessHeaderText] = useState('');
    const [exportSuccessTitleText, setExportSuccessTitleText] = useState('');
    const [exportSuccessDescriptionText, setExportSuccessDescriptionText] = useState('');

    // Toggle sidebar
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const handleOverlayClick = () => setIsSidebarOpen(false);

    // Fetch departments data from MongoDB
    const fetchDepartments = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // If we have batch ID, fetch from MongoDB
            if (batchId) {
                const archivedBatch = await mongoDBService.getArchivedBatchById(batchId);

                if (archivedBatch) {
                    // Use departments from the archived batch
                    const depts = archivedBatch.departments || [];
                    setDepartments(depts.map((d, idx) => ({
                        id: idx + 1,
                        name: d.name,
                        sections: d.sections || 1,
                        totalStudents: d.totalStudents || 0,
                        placedStudents: d.placedStudents || 0
                    })));

                    setBatchStats({
                        archiveName: archivedBatch.archiveName || archiveName,
                        year: archivedBatch.batch || batchYear,
                        totalDepts: archivedBatch.totalDept || depts.length,
                        totalStudents: archivedBatch.totalStudents || 0,
                        placedStudents: archivedBatch.placedStudents || 0
                    });
                } else {
                    setError('Archived batch not found');
                }
            } else if (batchData.totalDept) {
                // Use data from navigation state if available
                setDepartments(batchData.departments || []);
                setBatchStats({
                    archiveName: archiveName,
                    year: batchYear,
                    totalDepts: batchData.totalDept || 0,
                    totalStudents: batchData.totalStudents || 0,
                    placedStudents: batchData.placedStudents || 0
                });
            } else {
                setError('No batch data available');
            }

        } catch (err) {
            console.error('Error fetching departments:', err);
            setError('Failed to load departments');
        } finally {
            setIsLoading(false);
        }
    }, [batchId, archiveName, batchYear, batchData]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchDepartments();
        }
    }, [isAuthenticated, fetchDepartments]);

    // Handle back navigation / discard
    const handleDiscard = () => {
        navigate('/admin/zipped-batches');
    };

    // Handle view department
    const handleViewDepartment = (dept) => {
        navigate(`/admin/zipped-batch/department/${encodeURIComponent(dept.name)}`, {
            state: {
                departmentData: dept,
                batchData: {
                    id: batchId,
                    archiveName: archiveName,
                    year: batchYear
                },
                studentsData: Array.isArray(dept?.students) ? dept.students : [],
                selectedDepartmentName: dept.name,
                isZipped: true
            }
        });
    };

    // Handle unzip
    const handleUnzipClick = () => {
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
            if (batchId) {
                await mongoDBService.unzipBatch(batchId, 'Admin');
            }

            clearInterval(progressInterval);
            setUnzippingProgress(100);

            // Brief pause at 100% before showing success
            await new Promise(resolve => setTimeout(resolve, 300));

            setShowUnzippingProgress(false);
            setShowUnzippedSuccess(true);
        } catch (err) {
            console.error('Unzip error:', err);
            clearInterval(progressInterval);
            setShowUnzippingProgress(false);
            setExportFailed({ message: 'Failed to unzip batch' });
            setTimeout(() => setExportFailed(null), 3000);
        }
    };

    // Handle download
    const handleDownload = async () => {
        let progressInterval;
        try {
            setIsExporting(true);
            setExportType('Zip File');
            setExportSuccessHeaderText('Zip File Exported!');
            setExportSuccessTitleText(`${batchStats.year || 'Batch'} Exported!`);
            setExportSuccessDescriptionText('Your ZIP file has been downloaded successfully');
            setExportPopupState('progress');
            setExportProgress(0);

            progressInterval = setInterval(() => {
                setExportProgress((prev) => {
                    if (prev >= 60) {
                        clearInterval(progressInterval);
                        return 60;
                    }
                    return prev + 10;
                });
            }, 120);

            const normalize = (value = '') => String(value).toLowerCase().replace(/\s+/g, '');
            const safeFileName = (value = 'file') => String(value).replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
            const zip = new JSZip();

            for (let i = 0; i < departments.length; i += 1) {
                const dept = departments[i];

                // Fetch archived students for this department from MongoDB
                let deptStudents = [];
                if (batchId) {
                    deptStudents = await mongoDBService.getArchivedBatchStudents(batchId, dept.name);
                }

                const rows = deptStudents.length > 0
                    ? deptStudents.map((student, index) => ({
                        'S.No': index + 1,
                        'Register Number': student.registerNumber || student.regNo || '-',
                        'Name': student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || '-',
                        'Section': student.section || '-',
                        'Phone': student.phone || student.mobileNumber || '-',
                        'Email': student.email || student.primaryEmail || '-',
                        'Status': (student.placementStatus === 'Placed' || student.isPlaced) ? 'Placed' : 'Unplaced',
                    }))
                    : [{
                        'S.No': '-',
                        'Register Number': '-',
                        'Name': 'No students found for this department',
                        'Section': '-',
                        'Phone': '-',
                        'Email': '-',
                        'Status': '-',
                    }];

                const worksheet = XLSX.utils.json_to_sheet(rows);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
                const workbookArray = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
                const deptFileName = `${safeFileName(dept.name)}_${safeFileName(batchYear)}.xlsx`;
                zip.file(deptFileName, workbookArray);

                const loopProgress = 60 + Math.round(((i + 1) / Math.max(departments.length, 1)) * 25);
                setExportProgress(loopProgress);
            }

            const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
                const zipProgress = 85 + Math.round((metadata.percent / 100) * 10);
                setExportProgress(Math.min(zipProgress, 95));
            });

            const link = document.createElement('a');
            const url = URL.createObjectURL(zipBlob);
            link.href = url;
            link.download = `${safeFileName(archiveName || 'Batch')}_Departments_Students.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setExportProgress(100);
            await new Promise((resolve) => setTimeout(resolve, 300));
            setExportPopupState('success');
        } catch (err) {
            clearInterval(progressInterval);
            console.error('Download error:', err);
            setExportPopupState('failed');
            setExportFailed({ message: 'Failed to download ZIP file' });
        } finally {
            setIsExporting(false);
        }
    };

    // Export functions
    const handleExportExcel = async () => {
        let progressInterval;
        try {
            setIsExporting(true);
            setShowExportMenu(false);
            setExportType('Excel');
            setExportSuccessHeaderText('');
            setExportSuccessTitleText('');
            setExportSuccessDescriptionText('');
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

            const exportData = departments.map((dept, index) => ({
                'S.No': index + 1,
                'Department': dept.name,
                'Sections': dept.sections,
                'Total Students': dept.totalStudents,
                'Placed Students': dept.placedStudents
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Departments');

            const fileName = `${archiveName}_Departments.xlsx`;
            XLSX.writeFile(workbook, fileName);

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
            setExportSuccessHeaderText('');
            setExportSuccessTitleText('');
            setExportSuccessDescriptionText('');
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

            const doc = new jsPDF();

            doc.setFontSize(16);
            doc.text(archiveName, 14, 20);

            const tableData = departments.map((dept, index) => [
                index + 1,
                dept.name,
                dept.sections,
                dept.totalStudents,
                dept.placedStudents
            ]);

            autoTable(doc, {
                head: [['S.No', 'Department', 'Sections', 'Total Students', 'Placed Students']],
                body: tableData,
                startY: 30,
                theme: 'grid',
                headStyles: { fillColor: [78, 162, 78] }
            });

            const fileName = `${archiveName}_Departments.pdf`;
            doc.save(fileName);

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
            if (showExportMenu && !e.target.closest(`.${styles['Ad-zbdv-print-button-container']}`)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showExportMenu]);

    if (authLoading) {
        return <div className={styles['Ad-zbdv-layout']}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className={styles['Ad-zbdv-layout']}>
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
                    className={styles['Ad-zbdv-overlay']}
                    onClick={handleOverlayClick}
                />
            )}

            {/* Main Content */}
            <main className={styles['Ad-zbdv-main-content']}>
                {/* Stats Cards Row - 3 Cards */}
                <div className={styles['Ad-zbdv-stats-container']}>
                    {/* Info Card - White with blue border */}
                    <div className={`${styles['Ad-zbdv-card']} ${styles['Ad-zbdv-card-info']}`}>
                        <h2 className={styles['Ad-zbdv-card-title']}>{batchStats.archiveName}</h2>
                        <div className={styles['Ad-zbdv-card-details']}>
                            <p>Batch : {batchStats.year}</p>
                            <p>Total Department : {batchStats.totalDepts}</p>
                        </div>
                        <button className={styles['Ad-zbdv-download-btn']} onClick={handleDownload}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Download Zip
                        </button>
                    </div>

                    {/* Total Students Card - Green */}
                    <div className={`${styles['Ad-zbdv-card']} ${styles['Ad-zbdv-card-green']}`}>
                        <h2 className={styles['Ad-zbdv-card-label']}>Total Students</h2>
                        <div className={styles['Ad-zbdv-card-number']}>{batchStats.totalStudents}</div>
                    </div>

                    {/* Placed Students Card - Blue */}
                    <div className={`${styles['Ad-zbdv-card']} ${styles['Ad-zbdv-card-blue']}`}>
                        <h2 className={styles['Ad-zbdv-card-label']}>Placed Students</h2>
                        <div className={styles['Ad-zbdv-card-number']}>{batchStats.placedStudents}</div>
                    </div>
                </div>

                {/* Table Card */}
                <div className={styles['Ad-zbdv-table-card']}>
                    <div className={styles['Ad-zbdv-table-header']}>
                        <h3 className={styles['Ad-zbdv-table-title']}>Batch Details</h3>
                        <div className={styles['Ad-zbdv-print-button-container']}>
                            <button
                                className={styles['Ad-zbdv-print-btn']}
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                disabled={isExporting}
                            >
                                Print
                            </button>
                            {showExportMenu && (
                                <div className={styles['Ad-zbdv-export-menu']}>
                                    <button onClick={handleExportExcel}>Export to Excel</button>
                                    <button onClick={handleExportPDF}>Export as PDF</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles['Ad-zbdv-table-container']}>
                        <table className={styles['Ad-zbdv-table']}>
                            <thead>
                                <tr className={styles['Ad-zbdv-table-head-row']}>
                                    <th className={styles['Ad-zbdv-th']}>S.No</th>
                                    <th className={styles['Ad-zbdv-th']}>Department</th>
                                    <th className={styles['Ad-zbdv-th']}>Sections</th>
                                    <th className={styles['Ad-zbdv-th']}>Total Students</th>
                                    <th className={styles['Ad-zbdv-th']}>Placed Students</th>
                                    <th className={styles['Ad-zbdv-th']}>View</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="6" className={styles['Ad-zbdv-loading-cell']}>
                                            <div className={styles['Ad-zbdv-spinner']}></div>
                                            <span>Loading...</span>
                                        </td>
                                    </tr>
                                ) : departments.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className={styles['Ad-zbdv-no-data']}>
                                            No departments found
                                        </td>
                                    </tr>
                                ) : (
                                    departments.map((dept, index) => (
                                        <tr key={dept.id || index} className={styles['Ad-zbdv-table-row']}>
                                            <td className={styles['Ad-zbdv-td']}>{index + 1}</td>
                                            <td className={`${styles['Ad-zbdv-td']} ${styles['Ad-zbdv-td-name']}`}>{dept.name}</td>
                                            <td className={styles['Ad-zbdv-td']}>{dept.sections}</td>
                                            <td className={styles['Ad-zbdv-td']}>{dept.totalStudents}</td>
                                            <td className={styles['Ad-zbdv-td']}>{dept.placedStudents}</td>
                                            <td className={styles['Ad-zbdv-td']}>
                                                <button
                                                    className={styles['Ad-zbdv-view-btn']}
                                                    onClick={() => handleViewDepartment(dept)}
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#4EA24E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                        <circle cx="12" cy="12" r="3" stroke="#4EA24E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Action Buttons */}
                    <div className={styles['Ad-zbdv-action-buttons']}>
                        <button className={styles['Ad-zbdv-discard-btn']} onClick={handleDiscard}>
                            Discard
                        </button>
                        <button className={styles['Ad-zbdv-unzip-btn']} onClick={handleUnzipClick}>
                            Unzip
                        </button>
                    </div>
                </div>
            </main>

            {/* Unzip Popup */}
            {showUnzipPopup && (
                <UnzipConfirmationPopup
                    onClose={() => setShowUnzipPopup(false)}
                    onConfirm={handleUnzipConfirm}
                    archiveName={archiveName}
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
                onClose={() => {
                    setExportPopupState('none');
                    setExportSuccessHeaderText('');
                    setExportSuccessTitleText('');
                    setExportSuccessDescriptionText('');
                }}
                exportType={exportType}
                headerText={exportSuccessHeaderText || undefined}
                titleText={exportSuccessTitleText || undefined}
                descriptionText={exportSuccessDescriptionText || undefined}
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
                batchName={batchStats.year || 'Batch'}
            />

            {/* Unzipped Success Alert */}
            <UnzippedSuccessAlert
                isOpen={showUnzippedSuccess}
                onClose={() => {
                    setShowUnzippedSuccess(false);
                    navigate('/admin/zipped-batches');
                }}
            />
        </div>
    );
};

export default Ad_Zipped_Batch_Departments_View;
