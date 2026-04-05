import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import Viewicon from "../assets/Viewicon.png";
import Dashcompanydrive from '../assets/Dashcompanydrive.png';
import CoodEligibleStudentPlacestudicon from '../assets/Cood_EligibleStudentPlacestudicon.svg';
import CoodEligibleStudestudicon from '../assets/Cood_EligibleStudestudicon.svg';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AdminBrowseStudenticon from "../assets/AdminBrowseStudenticon.png";
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';
import * as XLSX from 'xlsx';
import mongoDBService from '../services/mongoDBService.jsx';
import styles from './Coo_EligibleStudents.module.css';

function CoEligiblestudents({ onLogout, currentView, onViewChange }) {
    useCoordinatorAuth(); // JWT authentication verification
    const navigate = useNavigate();
    
    // START: MODIFIED/NEW STATE FOR EXPORT POPUPS
    const [showDropdown, setShowDropdown] = useState(false);
    const [exportPopupState, setExportPopupState] = useState('none'); // 'none' | 'progress' | 'success' | 'failed'
    const [exportProgress, setExportProgress] = useState(0);
    const [exportType, setExportType] = useState('Excel');
    // END: MODIFIED/NEW STATE FOR EXPORT POPUPS

    const [filterData, setFilterData] = useState({
        companyName: '',
        jobRole: '',
        startDate: '',
        endDate: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [coordinatorBranchLabel, setCoordinatorBranchLabel] = useState('Students');
    const [companyDrives, setCompanyDrives] = useState([]);
    const [studentsData, setStudentsData] = useState([]);
    const tableRef = useRef(null);

    const formatDateDisplay = (value) => {
        const raw = (value || '').toString().trim();
        if (!raw) return '';

        const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (isoMatch) {
            const [, y, m, d] = isoMatch;
            return `${d}-${m}-${y}`;
        }

        const ddmmyyyyMatch = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
        if (ddmmyyyyMatch) {
            return raw;
        }

        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) return raw;
        const day = String(parsed.getDate()).padStart(2, '0');
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const year = parsed.getFullYear();
        return `${day}-${month}-${year}`;
    };

    useEffect(() => {
        const parseCoordinatorData = () => {
            try {
                const raw = localStorage.getItem('coordinatorData');
                return raw ? JSON.parse(raw) : null;
            } catch (error) {
                console.error('Failed to parse coordinatorData:', error);
                return null;
            }
        };

        const toNormalized = (value) => (value || '').toString().trim().toUpperCase();

        const statusFromStudent = (student) => {
            const raw = (student?.status || '').toString().trim().toLowerCase();
            if (!raw) return 'Unplaced';
            if (raw === 'placed' || raw === 'selected') return 'Placed';
            if (raw === 'unplaced' || raw === 'pending' || raw === 'rejected' || raw === 'failed') return 'Unplaced';
            return 'Unplaced';
        };

        const normalizeDate = (value) => {
            const trimmed = (value || '').toString().trim();
            if (!trimmed) return '';
            if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
            const parsed = new Date(trimmed);
            if (Number.isNaN(parsed.getTime())) return trimmed;
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const d = String(parsed.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };

        const fetchCoordinatorEligibleStudents = async () => {
            try {
                setIsLoading(true);

                const coordinatorData = parseCoordinatorData();
                const fallbackBranch = toNormalized(
                    coordinatorData?.branch ||
                    coordinatorData?.department ||
                    coordinatorData?.dept
                );

                const [eligibleResponse, allStudents] = await Promise.all([
                    mongoDBService.getCoordinatorEligibleStudents(),
                    mongoDBService.getStudents()
                ]);

                const branchFromApi = toNormalized(
                    eligibleResponse?.coordinator?.branch ||
                    eligibleResponse?.coordinator?.department
                );
                const branchLabel = branchFromApi || fallbackBranch;
                if (branchLabel) {
                    setCoordinatorBranchLabel(`${branchLabel} Students`);
                }

                const studentList = Array.isArray(allStudents) ? allStudents : [];
                const studentById = new Map();
                const studentByRegNo = new Map();
                studentList.forEach((student) => {
                    if (student?._id) studentById.set(String(student._id), student);
                    if (student?.regNo) studentByRegNo.set(String(student.regNo), student);
                });

                const eligibleEntries = Array.isArray(eligibleResponse?.eligibleStudents)
                    ? eligibleResponse.eligibleStudents
                    : [];

                const companyMap = new Map();
                const flatRows = [];

                eligibleEntries.forEach((entry) => {
                    const startDate = normalizeDate(entry.driveStartDate || entry.companyDriveDate || '');
                    const endDate = normalizeDate(entry.driveEndDate || entry.driveStartDate || entry.companyDriveDate || '');
                    const companyName = entry.companyName || 'N/A';
                    const roleKey = `${entry.driveId || entry._id || ''}::${entry.jobRole || 'N/A'}::${startDate}::${endDate}`;

                    if (!companyMap.has(companyName)) {
                        companyMap.set(companyName, {
                            companyName,
                            jobRoles: []
                        });
                    }

                    const companyRecord = companyMap.get(companyName);
                    if (!companyRecord.jobRoles.some((r) => r.roleKey === roleKey)) {
                        companyRecord.jobRoles.push({
                            roleKey,
                            driveId: entry.driveId || entry._id || '',
                            jobRole: entry.jobRole || 'N/A',
                            startDate,
                            endDate
                        });
                    }

                    (entry.students || []).forEach((student) => {
                        const resolved = (student?.studentId && studentById.get(String(student.studentId)))
                            || (student?.regNo && studentByRegNo.get(String(student.regNo)))
                            || null;

                        const fullName = `${resolved?.firstName || ''} ${resolved?.lastName || ''}`.trim();
                        const skillsValue =
                            resolved?.skillSet ||
                            resolved?.skills ||
                            (Array.isArray(resolved?.currentSkills) ? resolved.currentSkills.join(', ') : resolved?.currentSkills) ||
                            student?.skills ||
                            'N/A';

                        flatRows.push({
                            id: `${entry.driveId || entry._id || 'drive'}-${student.studentId || student.regNo || Math.random()}`,
                            studentId: student?.studentId || (resolved?._id ? String(resolved._id) : ''),
                            driveId: entry.driveId || entry._id || '',
                            companyName: entry.companyName || 'N/A',
                            jobRole: entry.jobRole || 'N/A',
                            startDate,
                            endDate,
                            name: student?.name || fullName || 'N/A',
                            registerNo: student?.regNo || resolved?.regNo || 'N/A',
                            batch: student?.batch || resolved?.batch || 'N/A',
                            section: student?.section || resolved?.section || 'N/A',
                            cgpa: student?.cgpa || resolved?.overallCGPA || 'N/A',
                            skills: skillsValue,
                            status: statusFromStudent(student),
                            branch: student?.branch || resolved?.branch || resolved?.department || ''
                        });
                    });
                });

                setCompanyDrives(
                    Array.from(companyMap.values()).map((company) => ({
                        companyName: company.companyName,
                        jobRoles: company.jobRoles
                            .map(({ roleKey, ...role }) => role)
                            .sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''))
                    }))
                );
                setStudentsData(flatRows);
            } catch (error) {
                console.error('Failed to fetch coordinator eligible students:', error);
                setCompanyDrives([]);
                setStudentsData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCoordinatorEligibleStudents();
    }, []);

    const companyOptions = useMemo(() => {
        return Array.from(new Set(companyDrives.map((d) => d.companyName))).sort((a, b) => a.localeCompare(b));
    }, [companyDrives]);

    const jobRoleOptions = useMemo(() => {
        const selectedCompany = companyDrives.find(d => d.companyName === filterData.companyName);
        if (!selectedCompany) return [];
        return Array.from(new Set(selectedCompany.jobRoles.map((j) => j.jobRole))).sort((a, b) => a.localeCompare(b));
    }, [companyDrives, filterData.companyName]);

    const startDateOptions = useMemo(() => {
        const selectedCompany = companyDrives.find(d => d.companyName === filterData.companyName);
        if (!selectedCompany) return [];
        const selectedJobRole = filterData.jobRole;
        const relevant = selectedJobRole
            ? selectedCompany.jobRoles.filter(j => j.jobRole === selectedJobRole)
            : selectedCompany.jobRoles;
        return Array.from(new Set(relevant.map((j) => j.startDate).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    }, [companyDrives, filterData.companyName, filterData.jobRole]);

    const endDateOptions = useMemo(() => {
        const selectedCompany = companyDrives.find(d => d.companyName === filterData.companyName);
        if (!selectedCompany) return [];
        const selectedJobRole = filterData.jobRole;
        const selectedStartDate = filterData.startDate;
        const relevant = selectedCompany.jobRoles.filter(j => {
            if (selectedJobRole && j.jobRole !== selectedJobRole) return false;
            if (selectedStartDate && j.startDate !== selectedStartDate) return false;
            return true;
        });
        return Array.from(new Set(relevant.map((j) => j.endDate).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    }, [companyDrives, filterData.companyName, filterData.jobRole, filterData.startDate]);

    const handleCompanyChange = (value) => {
        setFilterData(prev => ({
            ...prev,
            companyName: value,
            jobRole: '',
            startDate: '',
            endDate: ''
        }));
    };

    const handleJobRoleChange = (value) => {
        setFilterData(prev => ({
            ...prev,
            jobRole: value,
            startDate: '',
            endDate: ''
        }));
    };

    const handleStartDateChange = (value) => {
        setFilterData(prev => {
            const selectedCompany = companyDrives.find(d => d.companyName === prev.companyName);
            const drive = selectedCompany?.jobRoles.find(j => {
                if (prev.jobRole && j.jobRole !== prev.jobRole) return false;
                return j.startDate === value;
            });
            return {
                ...prev,
                startDate: value,
                endDate: drive?.endDate || ''
            };
        });
    };

    const handleEndDateChange = (value) => {
        setFilterData(prev => ({
            ...prev,
            endDate: value
        }));
    };

    const hasCompleteFilterSelection = useMemo(() => (
        Boolean(filterData.companyName && filterData.jobRole && filterData.startDate && filterData.endDate)
    ), [filterData.companyName, filterData.jobRole, filterData.startDate, filterData.endDate]);

    const displayStudents = useMemo(() => {
        if (!hasCompleteFilterSelection) return [];

        const filtered = studentsData.filter(student => {
            const companyMatch =
                !filterData.companyName ||
                (student.companyName ?? '').toLowerCase() === filterData.companyName.toLowerCase().trim();
            const jobRoleMatch =
                !filterData.jobRole ||
                (student.jobRole ?? '').toLowerCase() === filterData.jobRole.toLowerCase().trim();
            const startDateMatch =
                !filterData.startDate ||
                (student.startDate ?? '').toLowerCase() === filterData.startDate.toLowerCase().trim();
            const endDateMatch =
                !filterData.endDate ||
                (student.endDate ?? '').toLowerCase() === filterData.endDate.toLowerCase().trim();
            return companyMatch && jobRoleMatch && startDateMatch && endDateMatch;
        });

        const seen = new Set();
        return filtered.filter((student) => {
            const dedupeKey = `${student.driveId || ''}|${student.companyName || ''}|${student.jobRole || ''}|${student.startDate || ''}|${student.registerNo || ''}`;
            if (seen.has(dedupeKey)) return false;
            seen.add(dedupeKey);
            return true;
        });
    }, [studentsData, filterData, hasCompleteFilterSelection]);

    const [activeItem, setActiveItem] = useState("Eligible Students");

    const handleItemClick = (itemName) => {
        setActiveItem(itemName);
    };

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };
    const EyeIcon = () => (
        <svg className={styles['co-es-profile-eye-icon']} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    );

    // =========================================================================
    // !!! START: NEW/MODIFIED EXPORT LOGIC (Copied/Adapted from Coo_CompanyDrive.js) !!!
    // =========================================================================

    // Function to simulate progress and handle export
    const simulateExport = async (operation, exportFunction) => {
        setShowDropdown(false);

        setExportType(operation === 'excel' ? 'Excel' : 'PDF');
        setExportPopupState('progress');
        setExportProgress(0);

        let progressInterval;
        let progressTimeout;

        try {
            // Simulate progress from 0 to 100
            progressInterval = setInterval(() => {
                setExportProgress(prev => Math.min(prev + 10, 100));
            }, 200);

            // Wait for progress animation to complete
            await new Promise(resolve => {
                progressTimeout = setTimeout(() => {
                    clearInterval(progressInterval);
                    resolve();
                }, 2000);
            });

            // Perform the actual export
            exportFunction();

            setExportProgress(100);
            setExportPopupState('success');
        } catch (error) {
            if (progressInterval) clearInterval(progressInterval);
            if (progressTimeout) clearTimeout(progressTimeout);

            setExportPopupState('failed');
        }
    };

    const exportToExcel = () => {
        try {
            const header = ["S.No", "Student Name", "Register Number", "Batch", "Section", "CGPA", "Skills", "Placement status"];
            const data = displayStudents.map((item, index) => [
                index + 1,
                item.name,
                item.registerNo,
                item.batch,
                item.section,
                item.cgpa,
                item.skills,
                item.status
            ]);
            const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Eligible Students");
            XLSX.writeFile(wb, "eligible_students.xlsx");
            setShowDropdown(false);
        } catch (error) {
            throw error;
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();

            // Define the table headers
            const tableColumn = ["S.No", "Student Name", "Register Number", "Batch", "Section", "CGPA", "Skills", "Placement status"];

            // Prepare the data rows from your filtered data
            const tableRows = displayStudents.map((item, index) => [
                index + 1,
                item.name,
                item.registerNo,
                item.batch,
                item.section,
                item.cgpa,
                item.skills,
                item.status
            ]);

            // Add a title to the PDF
            doc.setFontSize(16);
            doc.text("Eligible Students Report", 14, 15);

            // Generate the table using autoTable
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 20, // Start the table 20mm from the top
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    overflow: 'linebreak',
                    valign: 'middle',
                    halign: 'center',
                    minCellHeight: 8
                },
                headStyles: {
                    fillColor: [215, 61, 61], // Red color for header
                    textColor: 255, // White text
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 10 },
                    1: { halign: 'left', cellWidth: 30 },
                    2: { halign: 'center', cellWidth: 30 },
                    3: { halign: 'center', cellWidth: 20 },
                    4: { halign: 'center', cellWidth: 15 },
                    5: { halign: 'center', cellWidth: 15 },
                    6: { halign: 'left', cellWidth: 30 },
                    7: { halign: 'center', cellWidth: 'auto' }
                },
                margin: { top: 20 },
            });

            // Save the PDF
            doc.save("eligible_students.pdf");
            setShowDropdown(false);
        } catch (error) {
            throw error;
        }
    };

    const handleExportToPDF = () => {
        simulateExport('pdf', exportToPDF);
    };

    const handleExportToExcel = () => {
        simulateExport('excel', exportToExcel);
    };
    // =======================================================================
    // !!! END: NEW/MODIFIED EXPORT LOGIC !!!
    // =======================================================================

    const handleCardClick = (view) => {
        if (onViewChange) {
            onViewChange(view);
        }
    };

    const handleViewStudent = (student) => {
        const targetStudentId = student?.studentId || '';
        if (!targetStudentId) {
            console.warn('Unable to open student view: studentId missing', student);
            return;
        }

        navigate(`/coo-manage-students/view/${targetStudentId}`, {
            state: {
                mode: 'view',
                studentId: targetStudentId,
                studentData: {
                    _id: targetStudentId,
                    regNo: student.registerNo,
                    firstName: (student.name || '').split(' ').slice(0, -1).join(' ') || student.name,
                    lastName: (student.name || '').split(' ').slice(-1).join(' ') || '',
                    batch: student.batch,
                    branch: student.branch,
                    section: student.section,
                    overallCGPA: student.cgpa,
                    skillSet: student.skills
                }
            }
        });
    };
    const totalRoundsCount = useMemo(() => {
        const keySet = new Set(
            displayStudents.map((student) => `${student.companyName}|${student.jobRole}|${student.startDate}`)
        );
        return keySet.size;
    }, [displayStudents]);
    const eligibleCount = displayStudents.length;
    return (
        <div className={styles['coordinator-main-wrapper']}>
            <Navbar onToggleSidebar={toggleSidebar} />
            <div className={styles['coordinator-main-layout']}>
                <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView="eligible-students" onViewChange={onViewChange} />
                <div className={styles['coordinator-content-area']}>
                    <div className={styles['co-es-container']}>
                        <div className={styles['co-es-dashboard-area']}>
                            <div className={styles['co-es-summary-cards']}>
                                <div className={`${styles['co-es-summary-card']} ${styles['co-es-company-drive-card']}`}>
                                    <div className={styles['co-es-summary-card-icon']} style={{ background: '#ffffff' }}>
                                        <img src={AdminBrowseStudenticon} alt="Company Drive" />
                                    </div>
                                    <div className={styles['co-es-summary-card-title-1']}>Student Database</div>
                                    <div className={styles['co-es-summary-card-desc-1']}>Filter, sort and manage Student records</div>
                                </div>

                                <div className={`${styles['co-es-search-filters']} ${styles['co-es-company-profile-search']}`}>
                                    <div className={styles['co-es-search-tab']}>{coordinatorBranchLabel}</div>
                                    <div className={styles['co-es-search-inputs']}>
                                        <div className={styles['co-es-search-input']}>
                                            <select
                                                id="co-es-company-name"
                                                className={styles['co-es-select']}
                                                value={filterData.companyName}
                                                onChange={(e) => handleCompanyChange(e.target.value)}
                                                required
                                            >
                                                <option value="">Search Company</option>
                                                {companyOptions.map((name) => (
                                                    <option key={name} value={name}>{name}</option>
                                                ))}
                                            </select>
                                            <label htmlFor="co-es-company-name" className={styles['co-es-static-label']}>Search Company</label>
                                        </div>

                                        <div className={styles['co-es-search-input']}>
                                            <select
                                                id="co-es-job-role"
                                                className={styles['co-es-select']}
                                                value={filterData.jobRole}
                                                onChange={(e) => handleJobRoleChange(e.target.value)}
                                                disabled={!filterData.companyName}
                                                required
                                            >
                                                <option value="">Search Job Role</option>
                                                {jobRoleOptions.map((role) => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                            <label htmlFor="co-es-job-role" className={styles['co-es-static-label']}>Search Job Role</label>
                                        </div>

                                        <div className={styles['co-es-search-input']}>
                                            <select
                                                id="co-es-start-date"
                                                className={styles['co-es-select']}
                                                value={filterData.startDate}
                                                onChange={(e) => handleStartDateChange(e.target.value)}
                                                disabled={!filterData.companyName}
                                                required
                                            >
                                                <option value="">Search by Start Date</option>
                                                {startDateOptions.map((date) => (
                                                    <option key={date} value={date}>{formatDateDisplay(date)}</option>
                                                ))}
                                            </select>
                                            <label htmlFor="co-es-start-date" className={styles['co-es-static-label']}>Search by Start Date</label>
                                        </div>

                                        <div className={styles['co-es-search-input']}>
                                            <select
                                                id="co-es-end-date"
                                                className={styles['co-es-select']}
                                                value={filterData.endDate}
                                                onChange={(e) => handleEndDateChange(e.target.value)}
                                                disabled={!filterData.startDate}
                                                required
                                            >
                                                <option value="">Search by End Date</option>
                                                {endDateOptions.map((date) => (
                                                    <option key={date} value={date}>{formatDateDisplay(date)}</option>
                                                ))}
                                            </select>
                                            <label htmlFor="co-es-end-date" className={styles['co-es-static-label']}>Search by End Date</label>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles['co-es-stat-cards-group']}>
                                    <div className={`${styles['co-es-summary-card']} ${styles['co-es-stat-card']}`} onClick={() => handleCardClick('placed-students')}>
                                        <img src={CoodEligibleStudentPlacestudicon} alt="Placed Students" className={styles['co-es-stat-card__image']} />
                                        <span className={styles['co-es-stat-card__label']}>Number of 
                                            Rounds</span>
                                        <span className={styles['co-es-stat-card__value']}>{hasCompleteFilterSelection ? totalRoundsCount : 0}</span>
                                    </div>
                                    <div className={`${styles['co-es-summary-card']} ${styles['co-es-stat-card']}`}>
                                        <img src={CoodEligibleStudestudicon} alt="Eligible Students" className={styles['co-es-stat-card__image']} />
                                        <span className={styles['co-es-stat-card__label']}>Eligible
                                            Students</span>
                                        <span className={styles['co-es-stat-card__value']}>{hasCompleteFilterSelection ? eligibleCount : 0}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={`${styles['co-es-company-profile']} ${styles['company-profile-table']}`}>
                                <div className={styles['co-es-profile-header']}>
                                    <div className={styles['co-es-profile-title']}>ELIGIBLE STUDENTS</div>
                                    <div className={styles['co-es-print-btn-container']}>
                                        <button className={styles['co-es-print-btn']} onClick={() => setShowDropdown(!showDropdown)}>Print</button>
                                        {showDropdown && (
                                            <div className={styles['co-es-dropdown-menu']}>
                                                <div className={styles['co-es-dropdown-item']} onClick={handleExportToExcel}>Export to Excel</div>
                                                <div className={styles['co-es-dropdown-item']} onClick={handleExportToPDF}>Save as PDF</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className={styles['co-es-table-container']}>
                                    <table className={styles['co-es-profile-table']} ref={tableRef}>
                                        <thead>
                                            <tr>
                                                <th>S.No</th>
                                                <th>Student Name</th>
                                                <th>Register Number</th>
                                                <th>Batch</th>
                                                <th>Section</th>
                                                <th>CGPA</th>
                                                <th>Skills</th>
                                                <th>Placement status</th>
                                                <th>View</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isLoading ? (
                                                <tr>
                                                    <td colSpan="9" style={{ textAlign: 'center', padding: '18px' }}>Loading eligible students...</td>
                                                </tr>
                                            ) : !hasCompleteFilterSelection ? (
                                                <tr>
                                                    <td colSpan="9" style={{ textAlign: 'center', padding: '18px' }}>Select Company, Job Role, Start Date and End Date to view students.</td>
                                                </tr>
                                            ) : displayStudents.length === 0 ? (
                                                <tr>
                                                    <td colSpan="9" style={{ textAlign: 'center', padding: '18px' }}>No eligible students found for this coordinator branch.</td>
                                                </tr>
                                            ) : displayStudents.map((student, index) => (
                                                <tr key={student.id}>
                                                    <td>{index + 1}</td>
                                                    <td>{student.name}</td>
                                                    <td>{student.registerNo}</td>
                                                    <td>{student.batch}</td>
                                                    <td>{student.section}</td>
                                                    <td>{student.cgpa}</td>
                                                    <td>{student.skills}</td>
                                                    <td>
                                                        <span className={student.status === 'Placed' ? styles['co-es-status-badge-one'] : styles['co-es-status-badge-two']}>
                                                            {student.status}
                                                        </span>
                                                    </td>
                                                    <td onClick={() => handleViewStudent(student)}>
                                                        <EyeIcon />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* START: NEW EXPORT POPUP RENDERING */}
            <ExportProgressAlert
                isOpen={exportPopupState === 'progress'}
                onClose={() => { }}
                progress={exportProgress}
                exportType={exportType}
                color="#d23b42"
                progressColor="#d23b42"
            />
            <ExportSuccessAlert
                isOpen={exportPopupState === 'success'}
                onClose={() => setExportPopupState('none')}
                exportType={exportType}
                color="#d23b42"
            />
            <ExportFailedAlert
                isOpen={exportPopupState === 'failed'}
                onClose={() => setExportPopupState('none')}
                exportType={exportType}
                color="#d23b42"
            />
            {/* END: NEW EXPORT POPUP RENDERING */}
        </div>
    );
}

export default CoEligiblestudents;