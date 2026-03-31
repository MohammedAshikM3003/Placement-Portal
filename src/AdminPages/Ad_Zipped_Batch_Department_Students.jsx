import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';
import Adnavbar from '../components/Navbar/Adnavbar';
import Adsidebar from '../components/Sidebar/Adsidebar';
import styles from './Ad_Zipped_Batch_Department_Students.module.css';
import Adminicon from '../assets/Adminicon.png';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import mongoDBService from '../services/mongoDBService.jsx';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

const Ad_Zipped_Batch_Department_Students = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { deptId } = useParams();
    const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

    // Get data from navigation state
    const deptData = location.state?.departmentData || {};
    const batchData = location.state?.batchData || {};
    const deptName = deptData.name || decodeURIComponent(deptId || '');

    // State for sidebar
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Filter states
    const [nameFilter, setNameFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [regnoFilter, setRegnoFilter] = useState('');

    // State for students data
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Department stats
    const [deptStats, setDeptStats] = useState({
        name: deptName,
        batch: batchData.archiveName || '',
        year: batchData.year || '',
        totalSections: deptData.sections || 0,
        totalStudents: deptData.totalStudents || 0,
        placedStudents: deptData.placedStudents || 0
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

    // Fetch students data
    const fetchStudents = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Sample data for zipped batch department students
            // In production, this would fetch from API based on deptId and archiveId
            const sampleStudents = [
                { id: 1, registerNumber: '21CS001', name: 'John Doe', section: 'A', phone: '9876543210', email: 'john@example.com', placementStatus: 'Placed' },
                { id: 2, registerNumber: '21CS002', name: 'Jane Smith', section: 'A', phone: '9876543211', email: 'jane@example.com', placementStatus: 'Unplaced' },
                { id: 3, registerNumber: '21CS003', name: 'Mike Johnson', section: 'B', phone: '9876543212', email: 'mike@example.com', placementStatus: 'Placed' },
                { id: 4, registerNumber: '21CS004', name: 'Sarah Williams', section: 'B', phone: '9876543213', email: 'sarah@example.com', placementStatus: 'Unplaced' },
                { id: 5, registerNumber: '21CS005', name: 'David Brown', section: 'C', phone: '9876543214', email: 'david@example.com', placementStatus: 'Placed' },
                { id: 6, registerNumber: '21CS006', name: 'Emily Davis', section: 'C', phone: '9876543215', email: 'emily@example.com', placementStatus: 'Unplaced' },
            ];

            setStudents(sampleStudents);
            setFilteredStudents(sampleStudents);

            // Extract unique sections
            const uniqueSections = [...new Set(sampleStudents.map(s => s.section))].sort();
            setSections(uniqueSections);

            // Update stats
            const placedCount = sampleStudents.filter(s => s.placementStatus === 'Placed').length;
            setDeptStats(prev => ({
                ...prev,
                totalSections: uniqueSections.length,
                totalStudents: sampleStudents.length,
                placedStudents: placedCount
            }));

        } catch (err) {
            console.error('Error fetching students:', err);
            setError('Failed to load students');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchStudents();
        }
    }, [isAuthenticated, fetchStudents]);

    // Apply filters
    const applyFilters = () => {
        let filtered = [...students];

        if (nameFilter.trim()) {
            filtered = filtered.filter(s =>
                s.name.toLowerCase().includes(nameFilter.toLowerCase())
            );
        }

        if (sectionFilter) {
            filtered = filtered.filter(s => s.section === sectionFilter);
        }

        if (regnoFilter.trim()) {
            filtered = filtered.filter(s =>
                s.registerNumber.toLowerCase().includes(regnoFilter.toLowerCase())
            );
        }

        setFilteredStudents(filtered);
    };

    // Discard filters
    const discardFilters = () => {
        setNameFilter('');
        setSectionFilter('');
        setRegnoFilter('');
        setFilteredStudents(students);
    };

    // Handle back navigation
    const handleBack = () => {
        navigate(-1);
    };

    // Handle view profile
    const handleViewProfile = (student) => {
        navigate(`/admin-student-view/${student.id}`, { state: { studentData: student } });
    };

    // Export functions
    const handleExportExcel = async () => {
        try {
            setIsExporting(true);
            setShowExportMenu(false);
            setExportProgress({ message: 'Preparing Excel export...' });

            const exportData = filteredStudents.map((student, index) => ({
                'S.No': index + 1,
                'Register Number': student.registerNumber,
                'Name': student.name,
                'Section': student.section,
                'Phone': student.phone,
                'Email': student.email,
                'Status': student.placementStatus
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

            const fileName = `${deptStats.name}_${batchData.archiveName || 'Archive'}_Students.xlsx`;
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

            const doc = new jsPDF('landscape');

            doc.setFontSize(16);
            doc.text(`${deptStats.name} - ${batchData.archiveName || 'Archive'}`, 14, 20);

            const tableData = filteredStudents.map((student, index) => [
                index + 1,
                student.registerNumber,
                student.name,
                student.section,
                student.phone,
                student.email,
                student.placementStatus
            ]);

            autoTable(doc, {
                head: [['S.No', 'Register Number', 'Name', 'Section', 'Phone', 'Email', 'Status']],
                body: tableData,
                startY: 30,
                theme: 'grid',
                headStyles: { fillColor: [78, 162, 78] }
            });

            const fileName = `${deptStats.name}_${batchData.archiveName || 'Archive'}_Students.pdf`;
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
            if (showExportMenu && !e.target.closest(`.${styles['Ad-zbds-print-button-container']}`)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showExportMenu]);

    if (authLoading) {
        return <div className={styles['Ad-zbds-layout']}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className={styles['Ad-zbds-layout']}>
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
                    className={styles['Ad-zbds-overlay']}
                    onClick={handleOverlayClick}
                />
            )}

            {/* Main Content */}
            <main className={styles['Ad-zbds-main-content']}>
                {/* Top Section - Filter and Stats */}
                <div className={styles['Ad-zbds-top-section']}>
                    {/* Filter Card */}
                    <div className={styles['Ad-zbds-filter-card']}>
                        <div className={styles['Ad-zbds-filter-header']}>
                            <span>Filter & Sort</span>
                        </div>
                        <div className={styles['Ad-zbds-filter-content']}>
                            <div className={styles['Ad-zbds-filter-row']}>
                                <input
                                    type="text"
                                    className={styles['Ad-zbds-input']}
                                    placeholder="Name"
                                    value={nameFilter}
                                    onChange={(e) => setNameFilter(e.target.value)}
                                />
                                <div className={styles['Ad-zbds-select-wrapper']}>
                                    <select
                                        className={styles['Ad-zbds-select']}
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
                            <div className={styles['Ad-zbds-filter-row']}>
                                <input
                                    type="text"
                                    className={styles['Ad-zbds-input']}
                                    placeholder="Regno"
                                    value={regnoFilter}
                                    onChange={(e) => setRegnoFilter(e.target.value)}
                                />
                                <div className={styles['Ad-zbds-filter-buttons']}>
                                    <button
                                        className={styles['Ad-zbds-filter-btn']}
                                        onClick={applyFilters}
                                    >
                                        Filter
                                    </button>
                                    <button
                                        className={styles['Ad-zbds-discard-btn']}
                                        onClick={discardFilters}
                                    >
                                        Discard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Department Stats Card */}
                    <div className={styles['Ad-zbds-stats-card']}>
                        <h2 className={styles['Ad-zbds-stats-title']}>{deptStats.name}</h2>
                        <div className={styles['Ad-zbds-stats-content']}>
                            <div className={styles['Ad-zbds-stat-row']}>
                                <span className={styles['Ad-zbds-stat-label']}>Archive</span>
                                <span className={styles['Ad-zbds-stat-colon']}>:</span>
                                <span className={styles['Ad-zbds-stat-value']}>{deptStats.batch}</span>
                            </div>
                            <div className={styles['Ad-zbds-stat-row']}>
                                <span className={styles['Ad-zbds-stat-label']}>Year</span>
                                <span className={styles['Ad-zbds-stat-colon']}>:</span>
                                <span className={styles['Ad-zbds-stat-value']}>{deptStats.year}</span>
                            </div>
                            <div className={styles['Ad-zbds-stat-row']}>
                                <span className={styles['Ad-zbds-stat-label']}>Total Students</span>
                                <span className={styles['Ad-zbds-stat-colon']}>:</span>
                                <span className={styles['Ad-zbds-stat-value']}>{deptStats.totalStudents}</span>
                            </div>
                            <div className={styles['Ad-zbds-stat-row']}>
                                <span className={styles['Ad-zbds-stat-label']}>Placed Students</span>
                                <span className={styles['Ad-zbds-stat-colon']}>:</span>
                                <span className={styles['Ad-zbds-stat-value']}>{deptStats.placedStudents}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className={styles['Ad-zbds-table-card']}>
                    <div className={styles['Ad-zbds-table-header']}>
                        <h3 className={styles['Ad-zbds-table-title']}>{deptStats.name.toUpperCase()}</h3>
                        <div className={styles['Ad-zbds-print-button-container']}>
                            <button
                                className={styles['Ad-zbds-print-btn']}
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                disabled={isExporting}
                            >
                                Print
                            </button>
                            {showExportMenu && (
                                <div className={styles['Ad-zbds-export-menu']}>
                                    <button onClick={handleExportExcel}>Export to Excel</button>
                                    <button onClick={handleExportPDF}>Export as PDF</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles['Ad-zbds-table-container']}>
                        <table className={styles['Ad-zbds-table']}>
                            <thead>
                                <tr className={styles['Ad-zbds-table-head-row']}>
                                    <th className={styles['Ad-zbds-th']}>S.No</th>
                                    <th className={styles['Ad-zbds-th']}>Register Number</th>
                                    <th className={styles['Ad-zbds-th']}>Name</th>
                                    <th className={styles['Ad-zbds-th']}>Section</th>
                                    <th className={styles['Ad-zbds-th']}>Phone</th>
                                    <th className={styles['Ad-zbds-th']}>Email</th>
                                    <th className={styles['Ad-zbds-th']}>Status</th>
                                    <th className={styles['Ad-zbds-th']}>Profile</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="8" className={styles['Ad-zbds-loading-cell']}>
                                            <div className={styles['Ad-zbds-spinner']}></div>
                                            <span>Loading...</span>
                                        </td>
                                    </tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className={styles['Ad-zbds-no-data']}>
                                            No students found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student, index) => (
                                        <tr key={student.id || index} className={styles['Ad-zbds-table-row']}>
                                            <td className={styles['Ad-zbds-td']}>{index + 1}</td>
                                            <td className={styles['Ad-zbds-td']}>{student.registerNumber}</td>
                                            <td className={`${styles['Ad-zbds-td']} ${styles['Ad-zbds-td-name']}`}>{student.name}</td>
                                            <td className={styles['Ad-zbds-td']}>{student.section}</td>
                                            <td className={styles['Ad-zbds-td']}>{student.phone}</td>
                                            <td className={styles['Ad-zbds-td']}>{student.email}</td>
                                            <td className={styles['Ad-zbds-td']}>
                                                <span className={`${styles['Ad-zbds-status-tag']} ${
                                                    student.placementStatus === 'Placed'
                                                        ? styles['Ad-zbds-status-placed']
                                                        : styles['Ad-zbds-status-unplaced']
                                                }`}>
                                                    {student.placementStatus}
                                                </span>
                                            </td>
                                            <td className={styles['Ad-zbds-td']}>
                                                <button
                                                    className={styles['Ad-zbds-view-btn']}
                                                    onClick={() => handleViewProfile(student)}
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
                <div className={styles['Ad-zbds-back-container']}>
                    <button className={styles['Ad-zbds-back-btn']} onClick={handleBack}>
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

export default Ad_Zipped_Batch_Department_Students;
