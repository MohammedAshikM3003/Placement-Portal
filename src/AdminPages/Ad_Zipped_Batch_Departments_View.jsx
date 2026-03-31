import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';
import Adnavbar from '../components/Navbar/Adnavbar';
import Adsidebar from '../components/Sidebar/Adsidebar';
import styles from './Ad_Zipped_Batch_Departments_View.module.css';
import Adminicon from '../assets/Adminicon.png';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import mongoDBService from '../services/mongoDBService.jsx';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

const Ad_Zipped_Batch_Departments_View = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { archiveId } = useParams();
    const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

    // Get batch data from navigation state
    const batchData = location.state?.batchData || {};
    const archiveName = batchData.archiveName || decodeURIComponent(archiveId || '');
    const batchYear = batchData.year || '';

    // State for sidebar
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Filter states
    const [deptFilter, setDeptFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');

    // State for departments data
    const [departments, setDepartments] = useState([]);
    const [filteredDepartments, setFilteredDepartments] = useState([]);
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

    // Available sections for dropdown
    const [sections, setSections] = useState([]);

    // Export states
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(null);
    const [exportSuccess, setExportSuccess] = useState(null);
    const [exportFailed, setExportFailed] = useState(null);

    // Toggle sidebar
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const handleOverlayClick = () => setIsSidebarOpen(false);

    // Fetch departments data
    const fetchDepartments = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Sample data for zipped batch departments
            // In production, this would fetch from API based on archiveId
            const sampleDepartments = [
                { id: 1, name: 'Computer Science', sections: 3, totalStudents: 67, placedStudents: 12 },
                { id: 2, name: 'Information Technology', sections: 2, totalStudents: 54, placedStudents: 8 },
                { id: 3, name: 'Electronics & Communication', sections: 2, totalStudents: 48, placedStudents: 5 },
                { id: 4, name: 'Mechanical Engineering', sections: 3, totalStudents: 55, placedStudents: 7 },
            ];

            setDepartments(sampleDepartments);
            setFilteredDepartments(sampleDepartments);

            // Extract unique sections for dropdown
            const allSections = [];
            sampleDepartments.forEach(dept => {
                for (let i = 1; i <= dept.sections; i++) {
                    const sectionName = `Section ${String.fromCharCode(64 + i)}`;
                    if (!allSections.includes(sectionName)) {
                        allSections.push(sectionName);
                    }
                }
            });
            setSections(allSections.sort());

            // Calculate stats
            const totalStudents = sampleDepartments.reduce((sum, d) => sum + d.totalStudents, 0);
            const placedStudents = sampleDepartments.reduce((sum, d) => sum + d.placedStudents, 0);

            setBatchStats({
                archiveName: archiveName,
                year: batchYear,
                totalDepts: sampleDepartments.length,
                totalStudents: totalStudents,
                placedStudents: placedStudents
            });

        } catch (err) {
            console.error('Error fetching departments:', err);
            setError('Failed to load departments');
        } finally {
            setIsLoading(false);
        }
    }, [archiveName, batchYear]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchDepartments();
        }
    }, [isAuthenticated, fetchDepartments]);

    // Apply filters
    const applyFilters = () => {
        let filtered = [...departments];

        if (deptFilter.trim()) {
            filtered = filtered.filter(d =>
                d.name.toLowerCase().includes(deptFilter.toLowerCase())
            );
        }

        setFilteredDepartments(filtered);
    };

    // Discard filters
    const discardFilters = () => {
        setDeptFilter('');
        setSectionFilter('');
        setFilteredDepartments(departments);
    };

    // Handle back navigation
    const handleBack = () => {
        navigate('/admin/zipped-batches');
    };

    // Handle view department
    const handleViewDepartment = (dept) => {
        navigate(`/admin/zipped-batch/department/${encodeURIComponent(dept.name)}`, {
            state: {
                departmentData: dept,
                batchData: {
                    archiveName: archiveName,
                    year: batchYear
                },
                isZipped: true
            }
        });
    };

    // Export functions
    const handleExportExcel = async () => {
        try {
            setIsExporting(true);
            setShowExportMenu(false);
            setExportProgress({ message: 'Preparing Excel export...' });

            const exportData = filteredDepartments.map((dept, index) => ({
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
            doc.text(archiveName, 14, 20);

            const tableData = filteredDepartments.map((dept, index) => [
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
                {/* Top Section - Filter and Stats */}
                <div className={styles['Ad-zbdv-top-section']}>
                    {/* Filter Card */}
                    <div className={styles['Ad-zbdv-filter-card']}>
                        <div className={styles['Ad-zbdv-filter-header']}>
                            <span>Filter & Sort</span>
                        </div>
                        <div className={styles['Ad-zbdv-filter-content']}>
                            <div className={styles['Ad-zbdv-filter-row']}>
                                <input
                                    type="text"
                                    className={styles['Ad-zbdv-input']}
                                    placeholder="Department Name"
                                    value={deptFilter}
                                    onChange={(e) => setDeptFilter(e.target.value)}
                                />
                                <div className={styles['Ad-zbdv-select-wrapper']}>
                                    <select
                                        className={styles['Ad-zbdv-select']}
                                        value={sectionFilter}
                                        onChange={(e) => setSectionFilter(e.target.value)}
                                    >
                                        <option value="">Section</option>
                                        {sections.map((sec, idx) => (
                                            <option key={idx} value={sec}>{sec}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className={styles['Ad-zbdv-filter-row']}>
                                <div className={styles['Ad-zbdv-filter-buttons']}>
                                    <button
                                        className={styles['Ad-zbdv-filter-btn']}
                                        onClick={applyFilters}
                                    >
                                        Filter
                                    </button>
                                    <button
                                        className={styles['Ad-zbdv-discard-btn']}
                                        onClick={discardFilters}
                                    >
                                        Discard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Batch Stats Card */}
                    <div className={styles['Ad-zbdv-stats-card']}>
                        <h2 className={styles['Ad-zbdv-stats-title']}>{batchStats.archiveName}</h2>
                        <div className={styles['Ad-zbdv-stats-content']}>
                            <div className={styles['Ad-zbdv-stat-row']}>
                                <span className={styles['Ad-zbdv-stat-label']}>Year</span>
                                <span className={styles['Ad-zbdv-stat-colon']}>:</span>
                                <span className={styles['Ad-zbdv-stat-value']}>{batchStats.year}</span>
                            </div>
                            <div className={styles['Ad-zbdv-stat-row']}>
                                <span className={styles['Ad-zbdv-stat-label']}>Total Departments</span>
                                <span className={styles['Ad-zbdv-stat-colon']}>:</span>
                                <span className={styles['Ad-zbdv-stat-value']}>{batchStats.totalDepts}</span>
                            </div>
                            <div className={styles['Ad-zbdv-stat-row']}>
                                <span className={styles['Ad-zbdv-stat-label']}>Total Students</span>
                                <span className={styles['Ad-zbdv-stat-colon']}>:</span>
                                <span className={styles['Ad-zbdv-stat-value']}>{batchStats.totalStudents}</span>
                            </div>
                            <div className={styles['Ad-zbdv-stat-row']}>
                                <span className={styles['Ad-zbdv-stat-label']}>Placed Students</span>
                                <span className={styles['Ad-zbdv-stat-colon']}>:</span>
                                <span className={styles['Ad-zbdv-stat-value']}>{batchStats.placedStudents}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className={styles['Ad-zbdv-table-card']}>
                    <div className={styles['Ad-zbdv-table-header']}>
                        <h3 className={styles['Ad-zbdv-table-title']}>DEPARTMENTS</h3>
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
                                ) : filteredDepartments.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className={styles['Ad-zbdv-no-data']}>
                                            No departments found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredDepartments.map((dept, index) => (
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
                </div>

                {/* Back Button */}
                <div className={styles['Ad-zbdv-back-container']}>
                    <button className={styles['Ad-zbdv-back-btn']} onClick={handleBack}>
                        Back
                    </button>
                </div>
            </main>

            {/* Export Alerts */}
            {exportProgress && <ExportProgressAlert message={exportProgress.message} />}
            {exportSuccess && <ExportSuccessAlert message={exportSuccess.message} onClose={() => setExportSuccess(null)} />}
            {exportFailed && <ExportFailedAlert message={exportFailed.message} onClose={() => setExportFailed(null)} />}
        </div>
    );
};

export default Ad_Zipped_Batch_Departments_View;
