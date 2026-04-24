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
    const preloadedStudents = location.state?.studentsData || [];
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
    const [exportPopupState, setExportPopupState] = useState('none');
    const [exportProgress, setExportProgress] = useState(0);
    const [exportType, setExportType] = useState('Excel');

    // Toggle sidebar
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const handleOverlayClick = () => setIsSidebarOpen(false);

    const normalizeStudents = useCallback((rows = []) => {
        return (Array.isArray(rows) ? rows : []).map((student, index) => {
            const fullName =
                (student?.name || '').toString().trim() ||
                `${(student?.firstName || '').toString().trim()} ${(student?.lastName || '').toString().trim()}`.trim() ||
                (student?.studentName || '').toString().trim() ||
                '-';

            const registerNumber =
                (student?.registerNumber || student?.regNo || student?.registerNo || student?.rollNo || '').toString().trim() ||
                '-';

            const profileId =
                (student?._id || student?.studentId || student?.id || registerNumber || `row-${index}`).toString();

            return {
                id: profileId,
                profileId,
                registerNumber,
                name: fullName,
                section: (student?.section || '').toString().trim() || '-',
                phone: (student?.phone || student?.mobile || student?.mobileNumber || '').toString().trim() || '-',
                email: (student?.email || student?.primaryEmail || student?.collegeEmail || '').toString().trim() || '-',
                placementStatus: (student?.placementStatus === 'Placed' || student?.isPlaced) ? 'Placed' : 'Unplaced',
                rawData: student
            };
        });
    }, []);

    // Fetch students data
    const fetchStudents = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            let rows = [];

            if (Array.isArray(preloadedStudents) && preloadedStudents.length > 0) {
                rows = preloadedStudents;
            } else if (batchData?.id && deptName) {
                rows = await mongoDBService.getArchivedBatchStudents(batchData.id, deptName);
            }

            const normalizedStudents = normalizeStudents(rows);

            setStudents(normalizedStudents);
            setFilteredStudents(normalizedStudents);

            // Extract unique sections
            const uniqueSections = [...new Set(
                normalizedStudents
                    .map((s) => (s.section || '').toString().trim())
                    .filter((section) => section && section !== '-')
            )].sort();
            setSections(uniqueSections);

            // Update stats
            const placedCount = normalizedStudents.filter((s) => s.placementStatus === 'Placed').length;
            setDeptStats(prev => ({
                ...prev,
                totalSections: uniqueSections.length,
                totalStudents: normalizedStudents.length,
                placedStudents: placedCount
            }));

        } catch (err) {
            console.error('Error fetching students:', err);
            setError('Failed to load students');
            setStudents([]);
            setFilteredStudents([]);
        } finally {
            setIsLoading(false);
        }
    }, [batchData?.id, deptName, normalizeStudents, preloadedStudents]);

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
        const targetStudentId = (student?.profileId || student?.registerNumber || '').toString().trim();
        if (!targetStudentId) {
            alert('Unable to open profile. Student identifier is missing.');
            return;
        }

        navigate(`/admin-student-view/${encodeURIComponent(targetStudentId)}`, {
            state: {
                studentData: student?.rawData || student,
                student: student?.rawData || student,
                viewMode: true,
                viewOnly: true,
                showLoadingPopup: true,
                source: 'zipped-batch-department-students'
            }
        });
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

            const fileName = `${deptStats.name}_${batchData.archiveName || 'Archive'}_Students.xlsx`;
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

export default Ad_Zipped_Batch_Department_Students;
