import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';
import Adnavbar from '../components/Navbar/Adnavbar';
import Adsidebar from '../components/Sidebar/Adsidebar';
import styles from './Ad_ActiveZip.module.css';
import Adminicon from '../assets/Adminicon.png';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import mongoDBService from '../services/mongoDBService.jsx';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

const Ad_ActiveZip = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { driveId } = useParams();
    const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

    // State for sidebar
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // State for tabs
    const [activeTab, setActiveTab] = useState('active'); // 'active', 'zipped', 'history'

    // State for batch selection
    const [selectedBatch, setSelectedBatch] = useState('');
    const [batches, setBatches] = useState([]);
    const [zipArchiveName, setZipArchiveName] = useState('');

    // State for department data
    const [departments, setDepartments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Export states
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(null);
    const [exportSuccess, setExportSuccess] = useState(null);
    const [exportFailed, setExportFailed] = useState(null);

    // Toggle sidebar
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    // Close sidebar on overlay click
    const handleOverlayClick = () => setIsSidebarOpen(false);

    // Generate zip archive name based on batch
    const generateZipArchiveName = (batch) => {
        if (!batch) return '';
        const currentDate = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = monthNames[currentDate.getMonth()];
        const year = currentDate.getFullYear();
        return `Batch_${batch.replace(' - ', '_')}_Zip_${month}${year}`;
    };

    // Handle batch selection
    const handleBatchChange = (e) => {
        const batch = e.target.value;
        setSelectedBatch(batch);
        setZipArchiveName(generateZipArchiveName(batch));
    };

    // Fetch data
    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch batches (unique batch values from students)
            const students = await mongoDBService.getStudents({ limit: 1000 });
            const studentArray = Array.isArray(students) ? students : (students?.students || []);

            // Extract unique batches
            const uniqueBatches = [...new Set(studentArray.map(s => s.batch).filter(Boolean))].sort();
            setBatches(uniqueBatches);

            // Set default batch if available
            if (uniqueBatches.length > 0 && !selectedBatch) {
                const defaultBatch = uniqueBatches[0];
                setSelectedBatch(defaultBatch);
                setZipArchiveName(generateZipArchiveName(defaultBatch));
            }

            // Group students by department for the selected batch
            if (selectedBatch || uniqueBatches.length > 0) {
                const batchToUse = selectedBatch || uniqueBatches[0];
                const batchStudents = studentArray.filter(s => s.batch === batchToUse);

                // Group by department
                const deptMap = {};
                batchStudents.forEach(student => {
                    const dept = student.branch || student.department || 'Unknown';
                    if (!deptMap[dept]) {
                        deptMap[dept] = {
                            name: dept,
                            sections: new Set(),
                            totalStudents: 0,
                            placedStudents: 0
                        };
                    }
                    deptMap[dept].totalStudents++;
                    if (student.section) {
                        deptMap[dept].sections.add(student.section);
                    }
                    if (student.placementStatus === 'Placed' || student.isPlaced) {
                        deptMap[dept].placedStudents++;
                    }
                });

                // Convert to array
                const deptArray = Object.values(deptMap).map(dept => ({
                    ...dept,
                    sections: dept.sections.size || 1
                }));

                setDepartments(deptArray);
            }

        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    }, [selectedBatch]);

    // Load data on mount
    useEffect(() => {
        if (isAuthenticated) {
            fetchData();
        }
    }, [isAuthenticated, fetchData]);

    // Handle back navigation
    const handleBack = () => {
        if (location.state?.source === 'student-database') {
            navigate('/admin-student-database');
        } else {
            navigate('/admin-company-drive');
        }
    };

    // Handle view department
    const handleViewDepartment = (dept) => {
        navigate(`/admin/active-zip/department/${encodeURIComponent(dept.name)}`, {
            state: {
                departmentData: dept,
                batchData: selectedBatch
            }
        });
    };

    // Handle archive zip
    const handleArchiveZip = () => {
        // Archive the batch
        console.log('Archive zip:', zipArchiveName);
        setExportSuccess({ message: 'Batch archived successfully!' });
        setTimeout(() => setExportSuccess(null), 3000);
    };

    // Handle discard
    const handleDiscard = () => {
        setSelectedBatch('');
        setZipArchiveName('');
    };

    // Export functions
    const handleExportExcel = async () => {
        try {
            setIsExporting(true);
            setShowExportMenu(false);
            setExportProgress({ message: 'Preparing Excel export...' });

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

            const fileName = `${zipArchiveName || 'Batch'}_Departments.xlsx`;
            XLSX.writeFile(workbook, fileName);

            setExportProgress(null);
            setExportSuccess({ message: 'Excel file exported successfully!' });
            setTimeout(() => setExportSuccess(null), 3000);
        } catch (err) {
            console.error('Export error:', err);
            setExportProgress(null);
            setExportFailed({ message: 'Failed to export Excel file' });
            setTimeout(() => setExportFailed(null), 3000);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPDF = async () => {
        try {
            setIsExporting(true);
            setShowExportMenu(false);
            setExportProgress({ message: 'Preparing PDF export...' });

            const doc = new jsPDF();

            doc.setFontSize(16);
            doc.text(`Batch: ${selectedBatch}`, 14, 20);

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

            const fileName = `${zipArchiveName || 'Batch'}_Departments.pdf`;
            doc.save(fileName);

            setExportProgress(null);
            setExportSuccess({ message: 'PDF file exported successfully!' });
            setTimeout(() => setExportSuccess(null), 3000);
        } catch (err) {
            console.error('Export error:', err);
            setExportProgress(null);
            setExportFailed({ message: 'Failed to export PDF file' });
            setTimeout(() => setExportFailed(null), 3000);
        } finally {
            setIsExporting(false);
        }
    };

    // Close export menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (showExportMenu && !e.target.closest(`.${styles['Ad-az-print-button-container']}`)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showExportMenu]);

    if (authLoading) {
        return <div className={styles['Ad-az-layout']}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className={styles['Ad-az-layout']}>
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
                    className={styles['Ad-az-overlay']}
                    onClick={handleOverlayClick}
                />
            )}

            {/* Main Content */}
            <main className={styles['Ad-az-main-content']}>
                {/* Tab Navigation */}
                <div className={styles['Ad-az-tab-container']}>
                    <button
                        className={`${styles['Ad-az-tab-btn']} ${activeTab === 'active' ? styles['Ad-az-tab-active'] : ''}`}
                        onClick={() => setActiveTab('active')}
                    >
                        Active Batches
                    </button>
                    <button
                        className={`${styles['Ad-az-tab-btn']} ${activeTab === 'zipped' ? styles['Ad-az-tab-active'] : ''}`}
                        onClick={() => navigate('/admin/zipped-batches')}
                    >
                        Zipped Batches
                    </button>
                    <button
                        className={`${styles['Ad-az-tab-btn']} ${activeTab === 'history' ? styles['Ad-az-tab-active'] : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Zipping History
                    </button>
                </div>

                {/* Filter Row */}
                <div className={styles['Ad-az-filter-row']}>
                    <div className={styles['Ad-az-select-wrapper']}>
                        <select
                            className={styles['Ad-az-select']}
                            value={selectedBatch}
                            onChange={handleBatchChange}
                        >
                            <option value="">Select Batch</option>
                            {batches.map((batch, index) => (
                                <option key={index} value={batch}>{batch}</option>
                            ))}
                        </select>
                    </div>

                    <div className={styles['Ad-az-archive-name-wrapper']}>
                        <span className={styles['Ad-az-archive-label']}>Zip Archive Name :</span>
                        <input
                            type="text"
                            className={styles['Ad-az-archive-input']}
                            value={zipArchiveName}
                            onChange={(e) => setZipArchiveName(e.target.value)}
                            placeholder="Enter archive name"
                        />
                    </div>
                </div>

                {/* Batch Card */}
                <div className={styles['Ad-az-batch-card']}>
                    {/* Batch Header */}
                    <div className={styles['Ad-az-batch-header']}>
                        <h2 className={styles['Ad-az-batch-title']}>
                            Batch : {selectedBatch || 'Select a batch'}
                        </h2>
                        <div className={styles['Ad-az-print-button-container']}>
                            <button
                                className={styles['Ad-az-print-btn']}
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                disabled={isExporting}
                            >
                                Print
                            </button>
                            {showExportMenu && (
                                <div className={styles['Ad-az-export-menu']}>
                                    <button onClick={handleExportExcel}>Export to Excel</button>
                                    <button onClick={handleExportPDF}>Export as PDF</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className={styles['Ad-az-table-container']}>
                        <table className={styles['Ad-az-table']}>
                            <thead>
                                <tr className={styles['Ad-az-table-head-row']}>
                                    <th className={styles['Ad-az-th']}>S.No</th>
                                    <th className={styles['Ad-az-th']}>Department</th>
                                    <th className={styles['Ad-az-th']}>Sections</th>
                                    <th className={styles['Ad-az-th']}>Total Students</th>
                                    <th className={styles['Ad-az-th']}>Placed Students</th>
                                    <th className={styles['Ad-az-th']}>View</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="6" className={styles['Ad-az-loading-cell']}>
                                            <div className={styles['Ad-az-spinner']}></div>
                                            <span>Loading...</span>
                                        </td>
                                    </tr>
                                ) : departments.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className={styles['Ad-az-no-data']}>
                                            No departments found for this batch
                                        </td>
                                    </tr>
                                ) : (
                                    departments.map((dept, index) => (
                                        <tr key={index} className={styles['Ad-az-table-row']}>
                                            <td className={styles['Ad-az-td']}>{index + 1}</td>
                                            <td className={`${styles['Ad-az-td']} ${styles['Ad-az-td-dept']}`}>{dept.name}</td>
                                            <td className={styles['Ad-az-td']}>{dept.sections}</td>
                                            <td className={styles['Ad-az-td']}>{dept.totalStudents}</td>
                                            <td className={styles['Ad-az-td']}>{dept.placedStudents}</td>
                                            <td className={styles['Ad-az-td']}>
                                                <button
                                                    className={styles['Ad-az-view-btn']}
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
                    <div className={styles['Ad-az-action-buttons']}>
                        <button
                            className={styles['Ad-az-discard-btn']}
                            onClick={handleDiscard}
                        >
                            Discard
                        </button>
                        <button
                            className={styles['Ad-az-archive-btn']}
                            onClick={handleArchiveZip}
                            disabled={!selectedBatch}
                        >
                            Archive Zip
                        </button>
                    </div>
                </div>
            </main>

            {/* Export Alerts */}
            {exportProgress && <ExportProgressAlert message={exportProgress.message} />}
            {exportSuccess && <ExportSuccessAlert message={exportSuccess.message} onClose={() => setExportSuccess(null)} />}
            {exportFailed && <ExportFailedAlert message={exportFailed.message} onClose={() => setExportFailed(null)} />}
        </div>
    );
};

export default Ad_ActiveZip;
