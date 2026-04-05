import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';
import Adnavbar from '../components/Navbar/Adnavbar';
import Adsidebar from '../components/Sidebar/Adsidebar';
import styles from './Ad_Zipped_Batch_Department_Details.module.css';
import Adminicon from '../assets/Adminicon.png';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

const Ad_Zipped_Batch_Department_Details = () => {
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
        batch: batchData.year || '2023 - 2027',
        totalSections: deptData.sections || 3,
        totalStudents: deptData.totalStudents || 67,
        placedStudents: deptData.placedStudents || 12
    });

    // Available sections for dropdown
    const [sections, setSections] = useState([]);

    // Export states
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportPopupState, setExportPopupState] = useState('none');
    const [exportProgress, setExportProgress] = useState(0);
    const [exportType, setExportType] = useState('Excel');

    // Toggle sidebar
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const handleOverlayClick = () => setIsSidebarOpen(false);

    // Fetch students data
    const fetchStudents = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Sample data for zipped batch department students
            const sampleStudents = [
                { id: 1, registerNumber: '727823TUCS001', name: 'Aakash Kumar', section: 'A', phone: '9876543210', email: 'aakash@example.com', placementStatus: 'Placed' },
                { id: 2, registerNumber: '727823TUCS002', name: 'Bharath Raj', section: 'A', phone: '9876543211', email: 'bharath@example.com', placementStatus: 'Unplaced' },
                { id: 3, registerNumber: '727823TUCS003', name: 'Chitra Devi', section: 'B', phone: '9876543212', email: 'chitra@example.com', placementStatus: 'Placed' },
                { id: 4, registerNumber: '727823TUCS004', name: 'Deepak Singh', section: 'B', phone: '9876543213', email: 'deepak@example.com', placementStatus: 'Unplaced' },
                { id: 5, registerNumber: '727823TUCS005', name: 'Ezhil Arasi', section: 'C', phone: '9876543214', email: 'ezhil@example.com', placementStatus: 'Placed' },
                { id: 6, registerNumber: '727823TUCS006', name: 'Fathima Banu', section: 'C', phone: '9876543215', email: 'fathima@example.com', placementStatus: 'Unplaced' },
                { id: 7, registerNumber: '727823TUCS007', name: 'Ganesh Murthy', section: 'A', phone: '9876543216', email: 'ganesh@example.com', placementStatus: 'Placed' },
                { id: 8, registerNumber: '727823TUCS008', name: 'Harini Priya', section: 'B', phone: '9876543217', email: 'harini@example.com', placementStatus: 'Unplaced' },
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

            const fileName = `${deptStats.name}_Students.xlsx`;
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
            doc.text(`${deptStats.name}`, 14, 20);

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

            const fileName = `${deptStats.name}_Students.pdf`;
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
            if (showExportMenu && !e.target.closest(`.${styles['Ad-zbdd-print-button-container']}`)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showExportMenu]);

    if (authLoading) {
        return <div className={styles['Ad-zbdd-layout']}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className={styles['Ad-zbdd-layout']}>
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
                    className={styles['Ad-zbdd-overlay']}
                    onClick={handleOverlayClick}
                />
            )}

            {/* Main Content */}
            <main className={styles['Ad-zbdd-main-content']}>
                {/* Top Section - Filter and Stats */}
                <div className={styles['Ad-zbdd-top-section']}>
                    {/* Filter Card */}
                    <div className={styles['Ad-zbdd-filter-card']}>
                        <div className={styles['Ad-zbdd-filter-header']}>
                            <span>Filter & Sort</span>
                        </div>
                        <div className={styles['Ad-zbdd-filter-content']}>
                            <div className={styles['Ad-zbdd-filter-row']}>
                                <input
                                    type="text"
                                    className={styles['Ad-zbdd-input']}
                                    placeholder="Name"
                                    value={nameFilter}
                                    onChange={(e) => setNameFilter(e.target.value)}
                                />
                                <div className={styles['Ad-zbdd-select-wrapper']}>
                                    <select
                                        className={styles['Ad-zbdd-select']}
                                        value={sectionFilter}
                                        onChange={(e) => setSectionFilter(e.target.value)}
                                    >
                                        <option value="">Section</option>
                                        {sections.map((sec, idx) => (
                                            <option key={idx} value={sec}>{sec}</option>
                                        ))}
                                    </select>
                                </div>
                                <input
                                    type="text"
                                    className={styles['Ad-zbdd-input']}
                                    placeholder="Regno"
                                    value={regnoFilter}
                                    onChange={(e) => setRegnoFilter(e.target.value)}
                                />
                            </div>
                            <div className={styles['Ad-zbdd-filter-row']}>
                                <div className={styles['Ad-zbdd-filter-buttons']}>
                                    <button
                                        className={styles['Ad-zbdd-filter-btn']}
                                        onClick={applyFilters}
                                    >
                                        Filter
                                    </button>
                                    <button
                                        className={styles['Ad-zbdd-discard-btn']}
                                        onClick={discardFilters}
                                    >
                                        Discard
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Department Stats Card */}
                    <div className={styles['Ad-zbdd-stats-card']}>
                        <h2 className={styles['Ad-zbdd-stats-title']}>{deptStats.name || 'Computer Science and Engineering'}</h2>
                        <div className={styles['Ad-zbdd-stats-content']}>
                            <div className={styles['Ad-zbdd-stat-row']}>
                                <span className={styles['Ad-zbdd-stat-label']}>Batch</span>
                                <span className={styles['Ad-zbdd-stat-colon']}>:</span>
                                <span className={styles['Ad-zbdd-stat-value']}>{deptStats.batch}</span>
                            </div>
                            <div className={styles['Ad-zbdd-stat-row']}>
                                <span className={styles['Ad-zbdd-stat-label']}>Total Sections</span>
                                <span className={styles['Ad-zbdd-stat-colon']}>:</span>
                                <span className={styles['Ad-zbdd-stat-value']}>{deptStats.totalSections}</span>
                            </div>
                            <div className={styles['Ad-zbdd-stat-row']}>
                                <span className={styles['Ad-zbdd-stat-label']}>Total Students</span>
                                <span className={styles['Ad-zbdd-stat-colon']}>:</span>
                                <span className={styles['Ad-zbdd-stat-value']}>{deptStats.totalStudents}</span>
                            </div>
                            <div className={styles['Ad-zbdd-stat-row']}>
                                <span className={styles['Ad-zbdd-stat-label']}>Placed Students</span>
                                <span className={styles['Ad-zbdd-stat-colon']}>:</span>
                                <span className={styles['Ad-zbdd-stat-value']}>{deptStats.placedStudents}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className={styles['Ad-zbdd-table-card']}>
                    <div className={styles['Ad-zbdd-table-header']}>
                        <h3 className={styles['Ad-zbdd-table-title']}>{(deptStats.name || 'COMPUTER SCIENCE & ENGINEERING').toUpperCase()}</h3>
                        <div className={styles['Ad-zbdd-print-button-container']}>
                            <button
                                className={styles['Ad-zbdd-print-btn']}
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                disabled={isExporting}
                            >
                                Print
                            </button>
                            {showExportMenu && (
                                <div className={styles['Ad-zbdd-export-menu']}>
                                    <button onClick={handleExportExcel}>Export to Excel</button>
                                    <button onClick={handleExportPDF}>Export as PDF</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles['Ad-zbdd-table-container']}>
                        <table className={styles['Ad-zbdd-table']}>
                            <thead>
                                <tr className={styles['Ad-zbdd-table-head-row']}>
                                    <th className={styles['Ad-zbdd-th']}>S.No</th>
                                    <th className={styles['Ad-zbdd-th']}>Register Number</th>
                                    <th className={styles['Ad-zbdd-th']}>Name</th>
                                    <th className={styles['Ad-zbdd-th']}>Section</th>
                                    <th className={styles['Ad-zbdd-th']}>Phone</th>
                                    <th className={styles['Ad-zbdd-th']}>Email</th>
                                    <th className={styles['Ad-zbdd-th']}>Status</th>
                                    <th className={styles['Ad-zbdd-th']}>Profile</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="8" className={styles['Ad-zbdd-loading-cell']}>
                                            <div className={styles['Ad-zbdd-spinner']}></div>
                                            <span>Loading...</span>
                                        </td>
                                    </tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className={styles['Ad-zbdd-no-data']}>
                                            No students found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student, index) => (
                                        <tr key={student.id || index} className={styles['Ad-zbdd-table-row']}>
                                            <td className={styles['Ad-zbdd-td']}>{index + 1}</td>
                                            <td className={styles['Ad-zbdd-td']}>{student.registerNumber}</td>
                                            <td className={`${styles['Ad-zbdd-td']} ${styles['Ad-zbdd-td-name']}`}>{student.name}</td>
                                            <td className={styles['Ad-zbdd-td']}>{student.section}</td>
                                            <td className={styles['Ad-zbdd-td']}>{student.phone}</td>
                                            <td className={styles['Ad-zbdd-td']}>{student.email}</td>
                                            <td className={styles['Ad-zbdd-td']}>
                                                <span className={`${styles['Ad-zbdd-status-tag']} ${
                                                    student.placementStatus === 'Placed'
                                                        ? styles['Ad-zbdd-status-placed']
                                                        : styles['Ad-zbdd-status-unplaced']
                                                }`}>
                                                    {student.placementStatus}
                                                </span>
                                            </td>
                                            <td className={styles['Ad-zbdd-td']}>
                                                <button
                                                    className={styles['Ad-zbdd-view-btn']}
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
                <div className={styles['Ad-zbdd-back-container']}>
                    <button className={styles['Ad-zbdd-back-btn']} onClick={handleBack}>
                        Back
                    </button>
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

export default Ad_Zipped_Batch_Department_Details;
