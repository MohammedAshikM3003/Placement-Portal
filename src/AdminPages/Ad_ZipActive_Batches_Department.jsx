import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';
import Adnavbar from '../components/Navbar/Adnavbar';
import Adsidebar from '../components/Sidebar/Adsidebar';
import styles from './Ad_ZipActive_Batches_Department.module.css';
import Adminicon from '../assets/Adminicon.png';
import Ad_zipfile_icon from '../assets/Ad_zipfile_icon.svg';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import mongoDBService from '../services/mongoDBService.jsx';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

const getDepartmentFullForm = (dept) => {
    if (!dept) return '';
    const upperDept = dept.trim().toUpperCase();
    const mapping = {
        'CSE': 'Computer Science and Engineering',
        'ECE': 'Electronics and Communication Engineering',
        'EEE': 'Electrical and Electronics Engineering',
        'IT': 'Information Technology',
        'MECH': 'Mechanical Engineering',
        'CIVIL': 'Civil Engineering',
        'AIDS': 'Artificial Intelligence and Data Science',
        'AIML': 'Artificial Intelligence and Machine Learning',
        'BME': 'Biomedical Engineering'
    };
    return mapping[upperDept] || dept;
};

const Ad_ZipActive_Batches_Department = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, isLoading: authLoading } = useAdminAuth();

    // Get department data from navigation state
    const deptData = location.state?.departmentData || {};
    const batchData = location.state?.batchData || '';
    const driveId = location.state?.driveId;

    // State for sidebar
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Filter states
    const [searchFilter, setSearchFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [phoneFilter, setPhoneFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // State for students data
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Department stats
    const [deptStats, setDeptStats] = useState({
        name: deptData.name || 'Department',
        batch: batchData || '2023 - 2027',
        totalSections: 0,
        totalStudents: 0,
        placedStudents: 0
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

            const response = await mongoDBService.getStudents({
                limit: 1000,
                branch: deptData.name || undefined,
                batch: batchData || undefined
            });

            const studentArray = Array.isArray(response) ? response : (response?.students || []);

            // Filter by department if specified
            const deptStudents = deptData.name
                ? studentArray.filter(s => (s.branch || s.department) === deptData.name)
                : studentArray;

            // Map students to populate name and phone fields
            const mappedStudents = deptStudents.map(s => {
                const fullName = `${s.firstName || s.firstname || ''} ${s.lastName || s.lastname || ''}`.trim() || s.name || s.fullName || '';
                const phoneNum = s.phone || s.mobile || s.phoneNo || s.mobileNo || s.mobileNumber || '';
                return {
                    ...s,
                    name: fullName,
                    phone: phoneNum
                };
            });

            setStudents(mappedStudents);
            setFilteredStudents(mappedStudents);

            // Extract unique sections
            const uniqueSections = [...new Set(mappedStudents.map(s => s.section).filter(Boolean))].sort();
            setSections(uniqueSections);

            // Calculate stats
            const placedCount = mappedStudents.filter(s => s.placementStatus === 'Placed' || s.isPlaced).length;
            setDeptStats({
                name: deptData.name || 'Department',
                batch: batchData || '2023 - 2027',
                totalSections: uniqueSections.length,
                totalStudents: mappedStudents.length,
                placedStudents: placedCount
            });

        } catch (err) {
            console.error('Error fetching students:', err);
            setError('Failed to load students');
        } finally {
            setIsLoading(false);
        }
    }, [deptData.name, batchData]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchStudents();
        }
    }, [isAuthenticated, fetchStudents]);

    // Apply filters
    const applyFilters = () => {
        let filtered = [...students];

        if (searchFilter.trim()) {
            const query = searchFilter.toLowerCase();
            filtered = filtered.filter(s =>
                (s.name || '').toLowerCase().includes(query) ||
                (s.registerNumber || s.regNo || '').toLowerCase().includes(query)
            );
        }

        if (sectionFilter) {
            filtered = filtered.filter(s => s.section === sectionFilter);
        }

        if (phoneFilter.trim()) {
            const query = phoneFilter.toLowerCase();
            filtered = filtered.filter(s =>
                (s.phone || s.mobileNumber || '').toLowerCase().includes(query)
            );
        }

        if (statusFilter) {
            filtered = filtered.filter(s => {
                const isPlaced = s.placementStatus === 'Placed' || s.isPlaced;
                if (statusFilter === 'Placed') return isPlaced;
                if (statusFilter === 'Unplaced') return !isPlaced;
                return true;
            });
        }

        setFilteredStudents(filtered);
    };

    // Auto-apply filters when inputs change
    useEffect(() => {
        applyFilters();
    }, [searchFilter, sectionFilter, phoneFilter, statusFilter, students]);

    // Discard filters
    const discardFilters = () => {
        setSearchFilter('');
        setSectionFilter('');
        setPhoneFilter('');
        setStatusFilter('');
        setFilteredStudents(students);
    };

    // Handle back navigation
    const handleBack = () => {
        navigate(-1);
    };

    // Handle view profile
    const handleViewProfile = (student) => {
        navigate(`/admin-student-view/${student._id}`, { state: { studentData: student } });
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
                'Register Number': student.registerNumber || student.regNo || '-',
                'Name': student.name || '-',
                'Section': student.section || '-',
                'Phone': student.phone || student.mobileNumber || '-',
                'Email': student.email || student.primaryEmail || '-',
                'Status': (student.placementStatus === 'Placed' || student.isPlaced) ? 'Placed' : 'Unplaced'
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
            doc.text(deptStats.name, 14, 20);

            const tableData = filteredStudents.map((student, index) => [
                index + 1,
                student.registerNumber || student.regNo || '-',
                student.name || '-',
                student.section || '-',
                student.phone || student.mobileNumber || '-',
                student.email || student.primaryEmail || '-',
                (student.placementStatus === 'Placed' || student.isPlaced) ? 'Placed' : 'Unplaced'
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
            if (showExportMenu && !e.target.closest(`.${styles['Ad-zd-print-button-container']}`)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showExportMenu]);

    if (authLoading) {
        return <div className={styles['Ad-zd-layout']}>Loading...</div>;
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className={styles['Ad-zd-layout']}>
            {/* Navbar */}
            <Adnavbar
                onToggleSidebar={toggleSidebar}
                adminName="Admin"
                adminImage={Adminicon}
            />

            {/* Sidebar */}
            <Adsidebar isOpen={isSidebarOpen} />

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className={styles['Ad-zd-overlay']}
                    onClick={handleOverlayClick}
                />
            )}

            {/* Main Content */}
            <main className={styles['Ad-zd-main-content']}>
                {/* Top Section - Filter and Stats */}
                <div className={styles['Ad-zd-top-section']}>
                    {/* Active Zip Card */}
                    <div
                        className={styles['Ad-zd-active-zip-card']}
                        onClick={() => navigate(`/admin/active-zip/${driveId}`)}
                    >
                        <div className={styles['Ad-zd-summary-card-icon']}>
                            <img src={Ad_zipfile_icon} alt="Active Zip" />
                        </div>
                        <div className={styles['Ad-zd-summary-card-title-1']}>Active Zip</div>
                        <div className={`${styles['Ad-zd-summary-card-desc-1']} ${styles['Ad-zd-summary-card-desc-1-margin']}`}>Go back to active zip<br />management page</div>
                    </div>

                    {/* Filter Card */}
                    <div className={styles['Ad-zd-filter-card']}>
                        <div className={styles['Ad-zd-filter-header']}>
                            <span>Filter & Sort</span>
                        </div>
                        <div className={styles['Ad-zd-filter-content']}>
                            {/* Row 1 Column 1: Name / Reg No */}
                            <div className={styles['Ad-zd-input-wrapper']}>
                                <label className={styles['Ad-zd-static-label']}>Name / Reg No</label>
                                <div className={styles['Ad-zd-text-container']}>
                                    <input
                                        type="text"
                                        className={styles['Ad-zd-text']}
                                        placeholder="Enter Name / Reg No"
                                        value={searchFilter}
                                        onChange={(e) => setSearchFilter(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Row 1 Column 2: Section Dropdown */}
                            <div className={styles['Ad-zd-input-wrapper']}>
                                <label className={styles['Ad-zd-static-label']}>Section</label>
                                <div className={styles['Ad-zd-dropdown-container']}>
                                    <select
                                        className={styles['Ad-zd-dropdown']}
                                        value={sectionFilter}
                                        onChange={(e) => setSectionFilter(e.target.value)}
                                    >
                                        <option value="">Select Section</option>
                                        {sections.map((sec, idx) => (
                                            <option key={idx} value={sec}>{sec}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Row 2 Column 1: Phone No */}
                            <div className={styles['Ad-zd-input-wrapper']}>
                                <label className={styles['Ad-zd-static-label']}>Phone No</label>
                                <div className={styles['Ad-zd-text-container']}>
                                    <input
                                        type="text"
                                        className={styles['Ad-zd-text']}
                                        placeholder="Enter Phone No"
                                        value={phoneFilter}
                                        onChange={(e) => setPhoneFilter(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Row 2 Column 2: Status Dropdown */}
                            <div className={styles['Ad-zd-input-wrapper']}>
                                <label className={styles['Ad-zd-static-label']}>Status</label>
                                <div className={styles['Ad-zd-dropdown-container']}>
                                    <select
                                        className={styles['Ad-zd-dropdown']}
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="">Select Status</option>
                                        <option value="Placed">Placed</option>
                                        <option value="Unplaced">Unplaced</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Department Stats Card */}
                    <div className={styles['Ad-zd-stats-card']}>
                        <h2 className={styles['Ad-zd-stats-title']}>{getDepartmentFullForm(deptStats.name)}</h2>
                        <div className={styles['Ad-zd-stats-content']}>
                            <div className={styles['Ad-zd-stat-row']}>
                                <span className={styles['Ad-zd-stat-label']}>Batch</span>
                                <span className={styles['Ad-zd-stat-colon']}>:</span>
                                <span className={styles['Ad-zd-stat-value']}>{deptStats.batch}</span>
                            </div>
                            <div className={styles['Ad-zd-stat-row']}>
                                <span className={styles['Ad-zd-stat-label']}>Total Sections</span>
                                <span className={styles['Ad-zd-stat-colon']}>:</span>
                                <span className={styles['Ad-zd-stat-value']}>{deptStats.totalSections}</span>
                            </div>
                            <div className={styles['Ad-zd-stat-row']}>
                                <span className={styles['Ad-zd-stat-label']}>Placed Students</span>
                                <span className={styles['Ad-zd-stat-colon']}>:</span>
                                <span className={styles['Ad-zd-stat-value']}>{deptStats.placedStudents}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className={styles['Ad-zd-table-card']}>
                    <div className={styles['Ad-zd-table-header']}>
                        <h3 className={styles['Ad-zd-table-title']}>
                            <span className={styles['Ad-zd-dept-name']}>{getDepartmentFullForm(deptStats.name).toUpperCase()}</span>
                            <span className={styles['Ad-zd-dept-count']}>({filteredStudents.length})</span>
                        </h3>
                        <div className={styles['Ad-zd-print-button-container']}>
                            <button
                                className={styles['Ad-zd-print-btn']}
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                disabled={isExporting}
                            >
                                Print
                            </button>
                            {showExportMenu && (
                                <div className={styles['Ad-zd-export-menu']}>
                                    <button onClick={handleExportExcel}>Export to Excel</button>
                                    <button onClick={handleExportPDF}>Export as PDF</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles['Ad-zd-table-container']}>
                        <table className={styles['Ad-zd-table']}>
                            <thead>
                                <tr className={styles['Ad-zd-table-head-row']}>
                                    <th className={styles['Ad-zd-th']}>S.No</th>
                                    <th className={styles['Ad-zd-th']}>Register Number</th>
                                    <th className={styles['Ad-zd-th']}>Name</th>
                                    <th className={styles['Ad-zd-th']}>Section</th>
                                    <th className={styles['Ad-zd-th']}>Phone</th>
                                    <th className={styles['Ad-zd-th']}>Email</th>
                                    <th className={styles['Ad-zd-th']}>Status</th>
                                    <th className={styles['Ad-zd-th']}>Profile</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan="8" className={styles['Ad-zd-loading-cell']}>
                                            <div className={styles['Ad-zd-spinner']}></div>
                                            <span>Loading...</span>
                                        </td>
                                    </tr>
                                ) : filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className={styles['Ad-zd-no-data']}>
                                            No students found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student, index) => (
                                        <tr key={student._id || index} className={styles['Ad-zd-table-row']}>
                                            <td className={styles['Ad-zd-td']}>{index + 1}</td>
                                            <td className={styles['Ad-zd-td']}>{student.registerNumber || student.regNo || '-'}</td>
                                            <td className={`${styles['Ad-zd-td']} ${styles['Ad-zd-td-name']}`}>{student.name || '-'}</td>
                                            <td className={styles['Ad-zd-td']}>{student.section || '-'}</td>
                                            <td className={styles['Ad-zd-td']}>{student.phone || student.mobileNumber || '-'}</td>
                                            <td className={styles['Ad-zd-td']}>{student.email || student.primaryEmail || '-'}</td>
                                            <td className={styles['Ad-zd-td']}>
                                                <span className={`${styles['Ad-zd-status-tag']} ${
                                                    (student.placementStatus === 'Placed' || student.isPlaced)
                                                        ? styles['Ad-zd-status-placed']
                                                        : styles['Ad-zd-status-unplaced']
                                                }`}>
                                                    {(student.placementStatus === 'Placed' || student.isPlaced) ? 'Placed' : 'Unplaced'}
                                                </span>
                                            </td>
                                            <td className={styles['Ad-zd-td']}>
                                                <button
                                                    className={styles['Ad-zd-view-btn']}
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

export default Ad_ZipActive_Batches_Department;
