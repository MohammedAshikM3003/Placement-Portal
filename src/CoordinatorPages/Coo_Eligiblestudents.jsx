import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
import Dropdown from '../components/common/Dropdown/Dropdown.jsx';
import CooCalendar from '../components/Calendar/Coo_Calendar.jsx';

function CoEligiblestudents({ onLogout, currentView, onViewChange }) {
    useCoordinatorAuth(); // JWT authentication verification
    const navigate = useNavigate();
    const location = useLocation();
    
    // START: MODIFIED/NEW STATE FOR EXPORT POPUPS
    const [showDropdown, setShowDropdown] = useState(false);
    const [exportPopupState, setExportPopupState] = useState('none'); // 'none' | 'progress' | 'success' | 'failed'
    const [exportProgress, setExportProgress] = useState(0);
    const [exportType, setExportType] = useState('Excel');
    // END: MODIFIED/NEW STATE FOR EXPORT POPUPS

    const [filterData, setFilterData] = useState(() => {
        const incoming = location.state?.filterData || location.state?.selectedDrive || location.state?.company || null;
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

        if (incoming) {
            return {
                companyName: incoming.companyName || incoming.company || '',
                jobRole: incoming.jobRole || incoming.role || incoming.jobs || '',
                startDate: normalizeDate(incoming.startDate || incoming.driveStartDate || incoming.startingDate || incoming.companyDriveDate || incoming.visitDate || ''),
                endDate: normalizeDate(incoming.endDate || incoming.driveEndDate || incoming.endingDate || incoming.startDate || incoming.driveStartDate || incoming.startingDate || '')
            };
        }
        return {
            companyName: '',
            jobRole: '',
            startDate: '',
            endDate: ''
        };
    });
    const [isLoading, setIsLoading] = useState(true);
    const [coordinatorBranchLabel, setCoordinatorBranchLabel] = useState('Students');
    const [companyDrives, setCompanyDrives] = useState([]);
    const [rawScheduledDrives, setRawScheduledDrives] = useState([]);
    const [studentsData, setStudentsData] = useState([]);
    const [selectedStudentForSkills, setSelectedStudentForSkills] = useState(null);
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

                const [eligibleResponse, allStudents, scheduledDrivesResponse] = await Promise.all([
                    mongoDBService.getCoordinatorEligibleStudents(),
                    mongoDBService.getStudents({ includeArchived: 'true' }),
                    mongoDBService.getCompanyDrives ? mongoDBService.getCompanyDrives().catch(() => []) : Promise.resolve([])
                ]);

                const allScheduled = Array.isArray(scheduledDrivesResponse)
                    ? scheduledDrivesResponse
                    : (scheduledDrivesResponse?.drives || scheduledDrivesResponse?.data || []);
                setRawScheduledDrives(allScheduled);

                const branchFromApi = toNormalized(
                    eligibleResponse?.coordinator?.branch ||
                    eligibleResponse?.coordinator?.department
                );
                const branchLabel = branchFromApi || fallbackBranch;
                if (branchLabel) {
                    setCoordinatorBranchLabel('Students');
                }

                const studentList = Array.isArray(allStudents) ? allStudents : [];
                const studentById = new Map();
                const studentByRegNo = new Map();
                studentList.forEach((student) => {
                    if (student?._id) studentById.set(String(student._id), student);
                    if (student?.regNo) studentByRegNo.set(String(student.regNo).toUpperCase().trim(), student);
                });

                let eligibleEntries = [];
                if (Array.isArray(eligibleResponse)) {
                    eligibleEntries = eligibleResponse;
                } else if (Array.isArray(eligibleResponse?.eligibleStudents)) {
                    eligibleEntries = eligibleResponse.eligibleStudents;
                } else if (Array.isArray(eligibleResponse?.data)) {
                    eligibleEntries = eligibleResponse.data;
                }

                // If coordinator eligible students is empty, fetch all eligible students and filter by coordinator branch
                if (eligibleEntries.length === 0) {
                    try {
                        const allEligibleResp = await mongoDBService.getAllEligibleStudents();
                        const allList = Array.isArray(allEligibleResp) 
                            ? allEligibleResp 
                            : (allEligibleResp?.eligibleStudents || allEligibleResp?.data || []);
                        const branchName = (branchLabel || fallbackBranch || 'CSE').trim().toUpperCase();
                        
                        eligibleEntries = allList.map(entry => {
                            const filteredStudents = (entry.students || []).filter(st => {
                                const stBranch = (st.branch || st.department || '').trim().toUpperCase();
                                return !branchName || stBranch === branchName || stBranch.includes(branchName) || branchName.includes(stBranch);
                            });
                            return { ...entry, students: filteredStudents };
                        }).filter(entry => (entry.students || []).length > 0);
                    } catch (allErr) {
                        console.warn('Fallback eligible students fetch failed:', allErr);
                    }
                }

                const companyMap = new Map();
                const flatRows = [];

                eligibleEntries.forEach((entry) => {
                    const startDate = normalizeDate(entry.driveStartDate || entry.companyDriveDate || '');
                    const endDate = normalizeDate(entry.driveEndDate || entry.driveStartDate || entry.companyDriveDate || '');
                    const companyName = entry.companyName || 'N/A';
                    const roleKey = `${entry.driveId || entry._id || ''}::${entry.jobRole || 'N/A'}::${startDate}::${endDate}`;
                    const entryRounds = entry.rounds || entry.numberOfRounds || entry.round || (Array.isArray(entry.roundDetails) ? entry.roundDetails.length : null);

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
                            endDate,
                            rounds: entryRounds
                        });
                    }

                    (entry.students || []).forEach((student) => {
                        const resolved = (student?.studentId && studentById.get(String(student.studentId)))
                            || (student?.regNo && studentByRegNo.get(String(student.regNo).toUpperCase().trim()))
                            || null;

                        const fullName = `${resolved?.firstName || ''} ${resolved?.lastName || ''}`.trim();
                        const skillsValue =
                            resolved?.skillSet ||
                            resolved?.skills ||
                            (Array.isArray(resolved?.currentSkills) ? resolved.currentSkills.join(', ') : resolved?.currentSkills) ||
                            student?.skills ||
                            'N/A';

                        const tenth = resolved?.tenthPercentage || student?.tenthPercentage || resolved?.tenthPercent || student?.tenthPercent || resolved?.tenthMark || student?.tenthMark || 'N/A';
                        const twelfth = resolved?.twelfthPercentage || student?.twelfthPercentage || resolved?.twelfthPercent || student?.twelfthPercent || resolved?.twelfthMark || student?.twelfthMark || resolved?.hscPercentage || resolved?.diplomaPercentage || 'N/A';

                        flatRows.push({
                            id: `${entry.driveId || entry._id || 'drive'}-${student.studentId || student.regNo || Math.random()}`,
                            studentId: student?.studentId || (resolved?._id ? String(resolved._id) : ''),
                            driveId: entry.driveId || entry._id || '',
                            companyName: entry.companyName || 'N/A',
                            jobRole: entry.jobRole || 'N/A',
                            startDate,
                            endDate,
                            rounds: entryRounds,
                            name: student?.name || fullName || 'N/A',
                            registerNo: student?.regNo || resolved?.regNo || 'N/A',
                            batch: student?.batch || resolved?.batch || 'N/A',
                            section: student?.section || resolved?.section || 'N/A',
                            tenthPercentage: tenth,
                            twelfthPercentage: twelfth,
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

    // Sync filterData with navigation state once companyDrives is fetched
    useEffect(() => {
        const incoming = location.state?.filterData || location.state?.selectedDrive || location.state?.company;
        if (!incoming) return;

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

        const compName = incoming.companyName || incoming.company || '';
        const jRole = incoming.jobRole || incoming.role || incoming.jobs || '';
        let sDate = normalizeDate(incoming.startDate || incoming.driveStartDate || incoming.startingDate || incoming.companyDriveDate || incoming.visitDate || '');
        let eDate = normalizeDate(incoming.endDate || incoming.driveEndDate || incoming.endingDate || sDate);

        if (companyDrives.length > 0 && compName) {
            const matchedCompany = companyDrives.find(d => (d.companyName || '').toLowerCase().trim() === compName.toLowerCase().trim());
            if (matchedCompany && matchedCompany.jobRoles.length > 0) {
                const matchedRole = matchedCompany.jobRoles.find(r => 
                    (!jRole || (r.jobRole || '').toLowerCase().trim() === jRole.toLowerCase().trim()) &&
                    (!sDate || r.startDate === sDate)
                ) || matchedCompany.jobRoles.find(r => (!jRole || (r.jobRole || '').toLowerCase().trim() === jRole.toLowerCase().trim())) || matchedCompany.jobRoles[0];

                if (matchedRole) {
                    setFilterData({
                        companyName: matchedCompany.companyName,
                        jobRole: matchedRole.jobRole || jRole,
                        startDate: matchedRole.startDate || sDate,
                        endDate: matchedRole.endDate || eDate || matchedRole.startDate || sDate
                    });
                    return;
                }
            }
        }

        setFilterData(prev => ({
            companyName: compName || prev.companyName,
            jobRole: jRole || prev.jobRole,
            startDate: sDate || prev.startDate,
            endDate: eDate || prev.endDate
        }));
    }, [location.state, companyDrives]);

    const companyOptions = useMemo(() => {
        return Array.from(new Set(companyDrives.map((d) => d.companyName))).sort((a, b) => a.localeCompare(b));
    }, [companyDrives]);

    const jobRoleOptions = useMemo(() => {
        const selectedCompany = companyDrives.find(d => (d.companyName || '').toLowerCase().trim() === (filterData.companyName || '').toLowerCase().trim());
        if (!selectedCompany) return [];
        return Array.from(new Set(selectedCompany.jobRoles.map((j) => j.jobRole))).sort((a, b) => a.localeCompare(b));
    }, [companyDrives, filterData.companyName]);

    const startDateOptions = useMemo(() => {
        const selectedCompany = companyDrives.find(d => (d.companyName || '').toLowerCase().trim() === (filterData.companyName || '').toLowerCase().trim());
        if (!selectedCompany) return [];
        const selectedJobRole = filterData.jobRole;
        const relevant = selectedJobRole
            ? selectedCompany.jobRoles.filter(j => (j.jobRole || '').toLowerCase().trim() === selectedJobRole.toLowerCase().trim())
            : selectedCompany.jobRoles;
        return Array.from(new Set(relevant.map((j) => j.startDate).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    }, [companyDrives, filterData.companyName, filterData.jobRole]);

    const endDateOptions = useMemo(() => {
        const selectedCompany = companyDrives.find(d => (d.companyName || '').toLowerCase().trim() === (filterData.companyName || '').toLowerCase().trim());
        if (!selectedCompany) return [];
        const selectedJobRole = filterData.jobRole;
        const selectedStartDate = filterData.startDate;
        const relevant = selectedCompany.jobRoles.filter(j => {
            if (selectedJobRole && (j.jobRole || '').toLowerCase().trim() !== selectedJobRole.toLowerCase().trim()) return false;
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
            const selectedCompany = companyDrives.find(d => (d.companyName || '').toLowerCase().trim() === (prev.companyName || '').toLowerCase().trim());
            const drive = selectedCompany?.jobRoles.find(j => {
                if (prev.jobRole && (j.jobRole || '').toLowerCase().trim() !== prev.jobRole.toLowerCase().trim()) return false;
                return j.startDate === value;
            });
            return {
                ...prev,
                startDate: value,
                endDate: drive?.endDate || prev.endDate || ''
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
        Boolean(filterData.companyName)
    ), [filterData.companyName]);

    const displayStudents = useMemo(() => {
        if (!filterData.companyName) return [];

        const filtered = studentsData.filter(student => {
            const companyMatch =
                !filterData.companyName ||
                (student.companyName ?? '').toLowerCase().trim() === filterData.companyName.toLowerCase().trim();
            const jobRoleMatch =
                !filterData.jobRole ||
                (student.jobRole ?? '').toLowerCase().trim() === filterData.jobRole.toLowerCase().trim();
            const startDateMatch =
                !filterData.startDate ||
                !student.startDate ||
                (student.startDate ?? '').toLowerCase().trim() === filterData.startDate.toLowerCase().trim();
            const endDateMatch =
                !filterData.endDate ||
                !student.endDate ||
                (student.endDate ?? '').toLowerCase().trim() === filterData.endDate.toLowerCase().trim();
            return companyMatch && jobRoleMatch && startDateMatch && endDateMatch;
        });

        const seen = new Set();
        return filtered.filter((student) => {
            const dedupeKey = `${student.driveId || ''}|${student.companyName || ''}|${student.jobRole || ''}|${student.startDate || ''}|${student.registerNo || ''}`;
            if (seen.has(dedupeKey)) return false;
            seen.add(dedupeKey);
            return true;
        });
    }, [studentsData, filterData]);

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

    // Helper to get array of skills
    const getSkillsArray = (skillsValue) => {
        if (!skillsValue || skillsValue === 'N/A') return [];
        if (Array.isArray(skillsValue)) return skillsValue.filter(Boolean);
        return String(skillsValue)
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
    };

    // Render skills:
    // If <= 3 skills: plain static text (no popup, no hover color)
    // If > 3 skills: first 3 skills followed by clickable "..." to open popup
    const renderSkills = (student) => {
        const skillsArray = getSkillsArray(student.skills);
        if (skillsArray.length === 0) return 'N/A';
        if (skillsArray.length <= 3) {
            return <span>{skillsArray.join(', ')}</span>;
        }

        return (
            <span>
                {skillsArray.slice(0, 3).join(', ')}
                <span
                    className={styles['co-es-skills-dots']}
                    onClick={() => setSelectedStudentForSkills(student)}
                    title="Click to view all skills"
                >
                    ...
                </span>
            </span>
        );
    };

    // =========================================================================
    // !!! START: EXPORT LOGIC WITH COMPLETE UNTRUNCATED DATA AND NEW COLUMNS !!!
    // =========================================================================

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
            const header = ["S.No", "Student Name", "Register Number", "Batch", "Section", "10th %", "12th %", "CGPA", "Skills", "Placement status"];
            const data = displayStudents.map((item, index) => [
                index + 1,
                item.name,
                item.registerNo,
                item.batch,
                item.section,
                item.tenthPercentage,
                item.twelfthPercentage,
                item.cgpa,
                item.skills, // Complete untruncated skills
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
            const doc = new jsPDF({ orientation: 'landscape' });

            const tableColumn = ["S.No", "Student Name", "Register Number", "Batch", "Section", "10th %", "12th %", "CGPA", "Skills", "Placement status"];

            const tableRows = displayStudents.map((item, index) => [
                index + 1,
                item.name,
                item.registerNo,
                item.batch,
                item.section,
                item.tenthPercentage,
                item.twelfthPercentage,
                item.cgpa,
                item.skills, // Complete untruncated skills
                item.status
            ]);

            doc.setFontSize(16);
            doc.text("Eligible Students Report", 14, 15);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 20,
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    overflow: 'linebreak',
                    valign: 'middle',
                    halign: 'center',
                    minCellHeight: 8
                },
                headStyles: {
                    fillColor: [210, 59, 66],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 12 },
                    1: { halign: 'left', cellWidth: 32 },
                    2: { halign: 'center', cellWidth: 28 },
                    3: { halign: 'center', cellWidth: 18 },
                    4: { halign: 'center', cellWidth: 16 },
                    5: { halign: 'center', cellWidth: 18 },
                    6: { halign: 'center', cellWidth: 18 },
                    7: { halign: 'center', cellWidth: 18 },
                    8: { halign: 'left', cellWidth: 50 },
                    9: { halign: 'center', cellWidth: 25 }
                },
                margin: { top: 20, left: 14, right: 14 },
            });

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
    // !!! END: EXPORT LOGIC !!!
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
                    tenthPercentage: student.tenthPercentage,
                    twelfthPercentage: student.twelfthPercentage,
                    overallCGPA: student.cgpa,
                    skillSet: student.skills
                }
            }
        });
    };

    const hasActiveFilters = useMemo(() => {
        return Boolean(
            filterData.companyName ||
            filterData.jobRole ||
            filterData.startDate ||
            filterData.endDate
        );
    }, [filterData]);

    const handleClearFilters = () => {
        setFilterData({
            companyName: '',
            jobRole: '',
            startDate: '',
            endDate: ''
        });
    };

    // Calculate real scheduled rounds for selected company drive & job role
    const totalRoundsCount = useMemo(() => {
        if (!filterData.companyName) return 0;
        
        const selectedCompany = (filterData.companyName || '').toLowerCase().trim();
        const selectedRole = (filterData.jobRole || '').toLowerCase().trim();
        const selectedStart = filterData.startDate || '';

        // 1. Try exact match from scheduled company drives (company + role + start date)
        let matched = rawScheduledDrives.find(d => {
            const compMatch = (d.companyName || '').toLowerCase().trim() === selectedCompany;
            const roleMatch = !selectedRole || (d.jobRole || d.role || d.jobs || '').toLowerCase().trim() === selectedRole;
            const dStart = d.startingDate || d.driveStartDate || d.companyDriveDate || '';
            const startMatch = !selectedStart || !dStart || (new Date(dStart).toISOString().split('T')[0] === new Date(selectedStart).toISOString().split('T')[0]);
            return compMatch && roleMatch && startMatch;
        });

        // 2. Match with company + role
        if (!matched) {
            matched = rawScheduledDrives.find(d => {
                const compMatch = (d.companyName || '').toLowerCase().trim() === selectedCompany;
                const roleMatch = !selectedRole || (d.jobRole || d.role || d.jobs || '').toLowerCase().trim() === selectedRole;
                return compMatch && roleMatch;
            });
        }

        // 3. Match with company
        if (!matched) {
            matched = rawScheduledDrives.find(d => (d.companyName || '').toLowerCase().trim() === selectedCompany);
        }

        if (matched) {
            const r = parseInt(matched.rounds) || parseInt(matched.numberOfRounds) || parseInt(matched.round) || (Array.isArray(matched.roundDetails) ? matched.roundDetails.length : 0);
            if (r > 0) return r;
        }

        // 4. Try from companyDrives state
        const companyObj = companyDrives.find(c => (c.companyName || '').toLowerCase().trim() === selectedCompany);
        if (companyObj) {
            const roleObj = companyObj.jobRoles.find(r => {
                const rMatch = !selectedRole || (r.jobRole || '').toLowerCase().trim() === selectedRole;
                const sMatch = !selectedStart || !r.startDate || r.startDate === selectedStart;
                return rMatch && sMatch;
            }) || companyObj.jobRoles[0];

            if (roleObj && roleObj.rounds) {
                const r = parseInt(roleObj.rounds);
                if (r > 0) return r;
            }
        }

        // 5. Fallback from student rows
        const studentRowMatch = displayStudents.find(s => s.rounds);
        if (studentRowMatch && parseInt(studentRowMatch.rounds) > 0) {
            return parseInt(studentRowMatch.rounds);
        }

        return 1;
    }, [filterData, rawScheduledDrives, companyDrives, displayStudents]);

    const eligibleCount = displayStudents.length;

    return (
        <div className={styles['co-es-page-wrapper']}>
            <Navbar onToggleSidebar={toggleSidebar} />
            <div className={styles['co-es-layout']}>
                <Sidebar
                    isOpen={isSidebarOpen}
                    onLogout={onLogout}
                    currentView="eligible-students"
                    onViewChange={onViewChange}
                    onClose={() => setIsSidebarOpen(false)}
                />
                <main className={styles['co-es-main-content']}>
                    <div className={styles['co-es-top-row']}>
                        {/* Left Card: Student Database Card */}
                        <div
                            className={`${styles['co-es-card']} ${styles['co-es-manage-card']}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => onViewChange?.("manage-students")}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    onViewChange?.("manage-students");
                                }
                            }}
                        >
                            <div className={styles['co-es-icon-wrapper']}>
                                <img src={AdminBrowseStudenticon} alt="Student Database" />
                            </div>
                            <h2>Student Database</h2>
                            <p>Filter, sort and manage Student records</p>
                        </div>

                        {/* Middle Card: Filters */}
                        <div className={styles['co-es-filter-section']}>
                            <div className={styles['co-es-filter-header-container']}>
                                <div className={styles['co-es-filter-header']}>{coordinatorBranchLabel}</div>
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        className={styles['co-es-clear-btn-header']}
                                        onClick={handleClearFilters}
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <div className={styles['co-es-filter-content']}>
                                {/* Company dropdown using custom Dropdown component */}
                                <div className={styles['co-es-input-wrapper']}>
                                    <label className={styles['co-es-static-label']} htmlFor="co-es-company-name">
                                        Search Company
                                    </label>
                                    <Dropdown
                                        options={companyOptions}
                                        selectedOption={filterData.companyName}
                                        onSelect={handleCompanyChange}
                                        placeholder="Search Company"
                                        role="coordinator"
                                        className={styles['co-es-dropdown-wrapper']}
                                        headerClassName={styles['co-es-dropdown-header']}
                                    />
                                </div>

                                {/* Job Role dropdown using custom Dropdown component */}
                                <div className={styles['co-es-input-wrapper']}>
                                    <label className={styles['co-es-static-label']} htmlFor="co-es-job-role">
                                        Search Job Role
                                    </label>
                                    <Dropdown
                                        options={jobRoleOptions}
                                        selectedOption={filterData.jobRole}
                                        onSelect={handleJobRoleChange}
                                        placeholder="Search Job Role"
                                        disabled={!filterData.companyName}
                                        role="coordinator"
                                        className={styles['co-es-dropdown-wrapper']}
                                        headerClassName={styles['co-es-dropdown-header']}
                                    />
                                </div>

                                {/* Start Date calendar using CooCalendar */}
                                <div className={styles['co-es-input-wrapper']}>
                                    <label className={styles['co-es-static-label']} htmlFor="co-es-start-date">
                                        Search by Start Date
                                    </label>
                                    <CooCalendar
                                        id="co-es-start-date"
                                        value={filterData.startDate}
                                        onChange={handleStartDateChange}
                                        placeholder="Search by Start Date"
                                        disabled={!filterData.companyName || !filterData.jobRole}
                                        variant="filter"
                                        enabledDates={startDateOptions}
                                    />
                                </div>

                                {/* End Date calendar using CooCalendar */}
                                <div className={styles['co-es-input-wrapper']}>
                                    <label className={styles['co-es-static-label']} htmlFor="co-es-end-date">
                                        Search by End Date
                                    </label>
                                    <CooCalendar
                                        id="co-es-end-date"
                                        value={filterData.endDate}
                                        onChange={handleEndDateChange}
                                        placeholder="Search by End Date"
                                        disabled={!filterData.startDate}
                                        variant="filter"
                                        enabledDates={endDateOptions}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Card Group: Stats */}
                        <div className={styles['co-es-status-cards']}>
                            <div className={styles['co-es-status-card']}>
                                <div className={styles['co-es-status-icon']}>
                                    <img src={CoodEligibleStudentPlacestudicon} alt="Number of Rounds" />
                                </div>
                                <div className={styles['co-es-status-title']}>Number of
                                    <span>Rounds</span>
                                </div>
                                <div className={styles['co-es-status-count']}>
                                    {hasCompleteFilterSelection ? totalRoundsCount : 0}
                                </div>
                            </div>
                            <div className={styles['co-es-status-card']}>
                                <div className={styles['co-es-status-icon']}>
                                    <img src={CoodEligibleStudestudicon} alt="Eligible Students" />
                                </div>
                                <div className={styles['co-es-status-title']}>Eligible
                                    <span>Students</span>
                                </div>
                                <div className={styles['co-es-status-count']}>
                                    {hasCompleteFilterSelection ? eligibleCount : 0}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Table Card */}
                    <div className={styles['co-es-table-container']}>
                        <div className={styles['co-es-profile-header']}>
                            <h3 className={styles['co-es-table-title']}>ELIGIBLE STUDENTS</h3>
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
                        <div className={styles['co-es-table-wrapper']}>
                            <table className={styles['co-es-table']} ref={tableRef}>
                                <colgroup>
                                    <col style={{ width: '50px' }} />
                                    <col style={{ width: '160px' }} />
                                    <col style={{ width: '130px' }} />
                                    <col style={{ width: '80px' }} />
                                    <col style={{ width: '70px' }} />
                                    <col style={{ width: '75px' }} />
                                    <col style={{ width: '75px' }} />
                                    <col style={{ width: '75px' }} />
                                    <col style={{ width: '170px' }} />
                                    <col style={{ width: '130px' }} />
                                    <col style={{ width: '55px' }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Student Name</th>
                                        <th>Register Number</th>
                                        <th>Batch</th>
                                        <th>Section</th>
                                        <th>10th %</th>
                                        <th>12th %</th>
                                        <th>CGPA</th>
                                        <th>Skills</th>
                                        <th>Placement status</th>
                                        <th>View</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr className={styles['co-es-loading-row']}>
                                            <td colSpan="11" className={styles['co-es-loading-cell']}>
                                                <div className={styles['co-es-loading-wrapper']}>
                                                    <div className={styles['co-es-spinner']}></div>
                                                    <span className={styles['co-es-loading-text']}>Loading eligible students...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : !hasCompleteFilterSelection ? (
                                        <tr>
                                            <td colSpan="11" className={styles['co-es-empty']}>
                                                Select Company, Job Role, Start Date and End Date to view students.
                                            </td>
                                        </tr>
                                    ) : displayStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan="11" className={styles['co-es-empty']}>
                                                No eligible students found for this coordinator branch.
                                            </td>
                                        </tr>
                                    ) : displayStudents.map((student, index) => (
                                        <tr key={student.id}>
                                            <td data-label="S.No">{index + 1}</td>
                                            <td data-label="Student Name">{student.name}</td>
                                            <td data-label="Register Number">{student.registerNo}</td>
                                            <td data-label="Batch">{student.batch}</td>
                                            <td data-label="Section">{student.section}</td>
                                            <td data-label="10th %">{student.tenthPercentage}</td>
                                            <td data-label="12th %">{student.twelfthPercentage}</td>
                                            <td data-label="CGPA">{student.cgpa}</td>
                                            <td data-label="Skills" className={styles['co-es-skills-cell']}>
                                                {renderSkills(student)}
                                            </td>
                                            <td data-label="Placement status">
                                                <span className={student.status === 'Placed' ? styles['co-es-status-badge-one'] : styles['co-es-status-badge-two']}>
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td data-label="View" className={styles['co-es-btn-cell']}>
                                                <button
                                                    className={styles['co-es-view-btn']}
                                                    type="button"
                                                    onClick={() => handleViewStudent(student)}
                                                >
                                                    <EyeIcon />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* Skills Details Popup Modal in Coordinator Red Theme */}
            {selectedStudentForSkills && (
                <div
                    className={styles['co-es-modal-overlay']}
                    onClick={() => setSelectedStudentForSkills(null)}
                >
                    <div
                        className={styles['co-es-modal-card']}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles['co-es-modal-header']}>
                            <h3 className={styles['co-es-modal-title']}>Student Skills</h3>
                            <button
                                type="button"
                                className={styles['co-es-modal-close-btn']}
                                onClick={() => setSelectedStudentForSkills(null)}
                                title="Close"
                            >
                                &times;
                            </button>
                        </div>
                        <div className={styles['co-es-modal-body']}>
                            <div className={styles['co-es-modal-student-info']}>
                                <div className={styles['co-es-modal-student-name']}>{selectedStudentForSkills.name}</div>
                                <div className={styles['co-es-modal-student-reg']}>
                                    Reg. No: {selectedStudentForSkills.registerNo} | Section: {selectedStudentForSkills.section} | Batch: {selectedStudentForSkills.batch}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: '#555', marginBottom: '8px', display: 'block' }}>
                                    All Skills ({getSkillsArray(selectedStudentForSkills.skills).length}):
                                </label>
                                <div className={styles['co-es-skills-tag-container']}>
                                    {getSkillsArray(selectedStudentForSkills.skills).map((skill, i) => (
                                        <span key={i} className={styles['co-es-skill-pill']}>
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className={styles['co-es-modal-footer']}>
                            <button
                                type="button"
                                className={styles['co-es-modal-action-btn']}
                                onClick={() => setSelectedStudentForSkills(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* START: EXPORT POPUP RENDERING */}
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
            {/* END: EXPORT POPUP RENDERING */}
        </div>
    );
}

export default CoEligiblestudents;