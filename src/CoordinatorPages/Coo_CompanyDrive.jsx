import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, Link } from 'react-router-dom';
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import * as XLSX from 'xlsx';
import  jsPDF  from 'jspdf';
import autoTable from'jspdf-autotable';
import mongoDBService from '../services/mongoDBService';
import { GiFireRay } from "react-icons/gi";
import { FaEye } from "react-icons/fa";
import searchcompany from '../assets/seachcompany.png';
import searchbydept from '../assets/SearchbyDepartment.png';
import searchdomain from '../assets/SearchDomain.png';
import searchmode from '../assets/searchMode.png';
import styled from 'styled-components';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import CoordReportanalysis from "../assets/CoordReportanalysis.svg";
import CoodCompanyDriveMonths from "../assets/coodCompanyDriveMonths.svg";
import CoodcompanyDriveNOD from "../assets/CoodcompanyDriveNOD.svg";
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';
import styles from './Coo_CompanyDrive.module.css';
import Dropdown from '../components/common/Dropdown/Dropdown.jsx';
import AdCalendar from '../components/Calendar/Ad_Calendar.jsx';

const toYmd = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const toDmy = (ymdStr) => {
  if (!ymdStr) return '';
  const [y, m, d] = ymdStr.split('-');
  if (!y || !m || !d) return ymdStr;
  return `${d}-${m}-${y}`;
};

// Helper function to read stored coordinator data
const readStoredCoordinatorData = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('coordinatorData');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to parse coordinatorData:', error);
    return null;
  }
};

// Helper function to resolve coordinator's department/branch
const resolveCoordinatorDepartment = (data) => {
  if (!data) return null;
  const deptValue =
    data.department ||
    data.branch ||
    data.dept ||
    data.departmentName ||
    data.coordinatorDepartment ||
    data.assignedDepartment;
  return deptValue ? deptValue.toString().toUpperCase() : null;
};

const sampleCompanyData = [
  {
    id: 1,
    company: "TechNova Solutions",
    domain: "IT Sector",
    jobRole: "Junior Developer",
    branch: "CSE, IT, ECE",
    mode: "Offline",
    status: "Confirmed",
    visitDate: "20-10-2025",
    package: "6 LPA",
    location: "Chennai"
  },
  {
    id: 2,
    company: "DataFlow Systems",
    domain: "Data Analytics",
    jobRole: "Data Analyst",
    branch: "CSE, IT",
    mode: "Online",
    status: "Confirmed",
    visitDate: "25-10-2025",
    package: "7 LPA",
    location: "Bangalore"
  },
  {
    id: 3,
    company: "CloudTech Innovations",
    domain: "Cloud Computing",
    jobRole: "Cloud Engineer",
    branch: "CSE, IT, ECE",
    mode: "Hybrid",
    status: "Pending",
    visitDate: "30-10-2025",
    package: "8 LPA",
    location: "Hyderabad"
  },
  {
    id: 4,
    company: "WebCraft Studios",
    domain: "Web Development",
    jobRole: "Frontend Developer",
    branch: "CSE, IT",
    mode: "Offline",
    status: "Confirmed",
    visitDate: "15-11-2025",
    package: "5.5 LPA",
    location: "Chennai"
  },
  {
    id: 5,
    company: "MobileFirst Tech",
    domain: "Mobile Development",
    jobRole: "Mobile App Developer",
    branch: "CSE, IT, ECE",
    mode: "Online",
    status: "Confirmed",
    visitDate: "18-11-2025",
    package: "6.5 LPA",
    location: "Mumbai"
  },
  {
    id: 6,
    company: "CyberGuard Inc.",
    domain: "Cybersecurity",
    jobRole: "Security Analyst",
    branch: "CSE, IT",
    mode: "Online",
    status: "Confirmed",
    visitDate: "22-11-2025",
    package: "9 LPA",
    location: "Pune"
  },
  {
    id: 7,
    company: "Innovate AI",
    domain: "Artificial Intelligence",
    jobRole: "Machine Learning Engineer",
    branch: "CSE, ECE",
    mode: "Hybrid",
    status: "Pending",
    visitDate: "28-11-2025",
    package: "10 LPA",
    location: "Bangalore"
  },
  {
    id: 8,
    company: "QuantumLeap",
    domain: "FinTech",
    jobRole: "Backend Developer",
    branch: "CSE, IT, ECE",
    mode: "Offline",
    status: "Confirmed",
    visitDate: "05-12-2025",
    package: "8.5 LPA",
    location: "Mumbai"
  },
  {
    id: 9,
    company: "NetSphere",
    domain: "Networking",
    jobRole: "Network Engineer",
    branch: "ECE, IT",
    mode: "Online",
    status: "Confirmed",
    visitDate: "10-12-2025",
    package: "7.5 LPA",
    location: "Delhi"
  },
  {
    id: 10,
    company: "GameCraft Studios",
    domain: "Gaming",
    jobRole: "Game Developer",
    branch: "CSE, IT",
    mode: "Hybrid",
    status: "Pending",
    visitDate: "15-12-2025",
    package: "8 LPA",
    location: "Hyderabad"
  }
];

export default function App({ onLogout, currentView, onViewChange }) {
  useCoordinatorAuth(); // JWT authentication verification
  const [companiesDrives, setCompaniesDrives] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [coordinatorBranch, setCoordinatorBranch] = useState('');

  // State for search filters
  const [filters, setFilters] = useState({
    company: '',
    department: '',
    mode: '',
    startDate: '',
    endDate: '',
    status: '',
    rounds: ''
  });

  // Focus states for input highlight borders
  const [companyFocused, setCompanyFocused] = useState(false);
  const [departmentFocused, setDepartmentFocused] = useState(false);
  const [startDateFocused, setStartDateFocused] = useState(false);
  const [endDateFocused, setEndDateFocused] = useState(false);
  const [modeFocused, setModeFocused] = useState(false);
  const [statusFocused, setStatusFocused] = useState(false);
  const [roundsFocused, setRoundsFocused] = useState(false);

  // Date selection mode ('none', 'start-first', 'end-first')
  const [dateSelectionMode, setDateSelectionMode] = useState('none');

  const [activeItem, setActiveItem] = useState("Company Drive");
  const navigate = useNavigate();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const drivesPerPage = 6;

  // List of drives matching current non-date filters (with normalized YYYY-MM-DD dates)
  const drivesList = useMemo(() => {
    const q = (filters.company || '').trim().toLowerCase();
    const deptFilter = (filters.department || '').trim();
    const modeFilter = filters.mode;
    const statusFilter = filters.status;
    const roundsFilter = filters.rounds;

    return companiesDrives.map(c => ({
      ...c,
      startYmd: toYmd(c.startingDate || c.driveStartDate || c.companyDriveDate || c.visitDate),
      endYmd: toYmd(c.endDate || c.endingDate || c.driveEndDate)
    })).filter(c => {
      if (!c.startYmd || !c.endYmd) return false;
      
      // Match Company / Job Role
      if (q) {
        const companyName = c.companyName || c.company || '';
        const jobRole = c.jobRole || '';
        if (!companyName.toLowerCase().includes(q) && !jobRole.toLowerCase().includes(q)) return false;
      }

      // Match Department / Branch
      if (deptFilter) {
        const dept = (c.department || '').trim();
        const branches = Array.isArray(c.eligibleBranches) ? c.eligibleBranches.map(b => (b || '').trim()) : [];
        if (dept.toLowerCase() !== deptFilter.toLowerCase() && !branches.some(b => b.toLowerCase() === deptFilter.toLowerCase())) return false;
      }

      // Match Mode
      if (modeFilter && c.mode !== modeFilter) return false;

      // Match Status
      if (statusFilter) {
        let currentStatus = 'Eligibility';
        if (c.allRoundsCompleted || c.driveStatus === 'completed') {
          currentStatus = 'Ended';
        } else if (c.attendanceTaken) {
          currentStatus = 'Resume';
        } else if (c.eligibleCreated) {
          currentStatus = 'Attendance';
        } else {
          const todayStr = new Date().toISOString().split('T')[0];
          const startStr = toYmd(c.startingDate || c.driveStartDate || c.companyDriveDate || c.visitDate);
          if (startStr && startStr > todayStr) {
            currentStatus = 'Scheduled';
          }
        }
        if (currentStatus !== statusFilter) return false;
      }

      // Match Rounds
      if (roundsFilter) {
        const driveRounds = String(c.rounds || c.numberOfRounds || '');
        if (!driveRounds.includes(roundsFilter)) return false;
      }

      return true;
    });
  }, [companiesDrives, filters.company, filters.department, filters.mode, filters.status, filters.rounds]);

  // Unique start dates for calendar when no dates are selected
  const uniqueStartDates = useMemo(() => {
    const dates = drivesList.map(d => d.startYmd);
    return Array.from(new Set(dates)).sort();
  }, [drivesList]);

  // Unique end dates for calendar when no dates are selected
  const uniqueEndDates = useMemo(() => {
    const dates = drivesList.map(d => d.endYmd);
    return Array.from(new Set(dates)).sort();
  }, [drivesList]);

  // Matching start dates for the selected End Date
  const matchingStartDates = useMemo(() => {
    if (!filters.endDate) return [];
    const dates = drivesList
      .filter(d => d.endYmd === filters.endDate)
      .map(d => d.startYmd);
    return Array.from(new Set(dates)).sort();
  }, [drivesList, filters.endDate]);

  // Matching end dates for the selected Start Date
  const matchingEndDates = useMemo(() => {
    if (!filters.startDate) return [];
    const dates = drivesList
      .filter(d => d.startYmd === filters.startDate)
      .map(d => d.endYmd);
    return Array.from(new Set(dates)).sort();
  }, [drivesList, filters.startDate]);

  // Compute unique departments / eligible branches for branches dropdown
  const departmentOptions = useMemo(() => {
    const deptSet = new Set();
    companiesDrives.forEach(d => {
      if (d.department && String(d.department).trim()) {
        deptSet.add(String(d.department).trim());
      }
      const branches = Array.isArray(d.eligibleBranches)
        ? d.eligibleBranches.map(b => String(b || '').trim())
        : (d.eligibleBranches || d.branch || '').toString().split(',').map(b => String(b || '').trim());
      
      branches.forEach(b => {
        if (b) deptSet.add(b);
      });
    });
    return Array.from(deptSet).sort();
  }, [companiesDrives]);

  // This function will set the active item when a menu item is clicked
  const handleItemClick = (itemName) => {
    setActiveItem(itemName);
  };

  // Fetch companies drives from MongoDB and filter by coordinator branch
  const fetchCompaniesDrives = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get coordinator's branch
      const coordinatorData = readStoredCoordinatorData();
      const branch = resolveCoordinatorDepartment(coordinatorData);
      
      if (branch) {
        setCoordinatorBranch(branch);
        console.log('Coordinator branch:', branch);
      }

      const data = await mongoDBService.getCompanyDrives();
      const allDrives = Array.isArray(data) ? data : [];
      
      // Filter drives by coordinator's branch
      const branchDrives = allDrives.filter(drive => {
        // Get all branches associated with this drive
        const driveBranches = (drive.eligibleBranches || drive.branch || drive.department || '')
          .toString()
          .split(',')
          .map(b => b.trim().toUpperCase());
        
        // Check if coordinator's branch matches any of the drive's branches
        const matchesBranch = branch && driveBranches.some(b => 
          b === branch || b.includes(branch) || branch.includes(b)
        );
        
        return matchesBranch;
      });
      
      // Fetch all attendance records
      let attendanceRecords = [];
      try {
        const response = await mongoDBService.getAllAttendances();
        if (Array.isArray(response)) {
          attendanceRecords = response;
        } else if (response && Array.isArray(response.data)) {
          attendanceRecords = response.data;
        } else if (response && Array.isArray(response.attendances)) {
          attendanceRecords = response.attendances;
        }
      } catch (attErr) {
        console.warn('Failed to fetch attendance records:', attErr);
      }

      // Fetch eligible-students records
      let eligibleRecords = [];
      try {
        const eligibleResp = await mongoDBService.getAllEligibleStudents();
        if (Array.isArray(eligibleResp)) {
          eligibleRecords = eligibleResp;
        } else if (eligibleResp && Array.isArray(eligibleResp.data)) {
          eligibleRecords = eligibleResp.data;
        } else if (eligibleResp && Array.isArray(eligibleResp.eligibleStudents)) {
          eligibleRecords = eligibleResp.eligibleStudents;
        }
      } catch (eligErr) {
        console.warn('Failed to fetch eligible students records:', eligErr);
      }

      // Map drives with attendance and eligibility status
      const drivesWithAttendance = branchDrives.map(drive => {
        const normalizeDate = (d) => {
          if (!d) return null;
          const dt = new Date(d);
          if (isNaN(dt.getTime())) return null;
          return dt.toISOString().split('T')[0];
        };

        const driveStart = normalizeDate(drive.startingDate || drive.driveStartDate || drive.companyDriveDate || drive.visitDate);
        const driveEnd = normalizeDate(drive.endDate || drive.endingDate || drive.driveEndDate);
        const driveId = drive._id || drive.id;

        const hasAttendance = attendanceRecords.some(attendance => {
          const attendanceDriveIdStr = attendance.driveId ? String(attendance.driveId) : null;
          const driveIdStr = driveId ? String(driveId) : null;

          if (attendanceDriveIdStr && driveIdStr && attendanceDriveIdStr === driveIdStr) {
            return true;
          }

          const companyMatch = attendance.companyName === drive.companyName;
          const jobRoleMatch = attendance.jobRole === drive.jobRole;
          const attendanceDateNorm = normalizeDate(attendance.startDate);
          const driveDateMatch = attendanceDateNorm === driveStart ||
            attendanceDateNorm === driveEnd ||
            (attendanceDateNorm && driveStart && driveEnd &&
              attendanceDateNorm >= driveStart && attendanceDateNorm <= driveEnd);

          return companyMatch && jobRoleMatch && driveDateMatch;
        });

        const hasEligible = eligibleRecords.some(er => String(er.driveId) === String(driveId));

        return {
          ...drive,
          attendanceTaken: hasAttendance,
          eligibleCreated: hasEligible,
          allRoundsCompleted: false
        };
      });

      // Second pass: Fetch round results to check if all rounds are completed
      const drivesWithRoundStatus = await Promise.all(
        drivesWithAttendance.map(async (drive) => {
          try {
            if (!drive.attendanceTaken) {
              return drive;
            }

            const roundResults = await mongoDBService.getAllRoundResults(
              drive.companyName,
              drive.jobRole,
              drive.startingDate || drive.driveStartDate || drive.companyDriveDate,
              drive._id || drive.id
            );

            let allRoundsCompleted = false;
            const totalRounds = drive.rounds || drive.numberOfRounds || 1;

            if (roundResults && roundResults.data && roundResults.data.rounds) {
              const completedRounds = roundResults.data.rounds.filter(round =>
                round.roundNumber &&
                Array.isArray(round.passedStudents) &&
                Array.isArray(round.failedStudents)
              );
              allRoundsCompleted = completedRounds.length === totalRounds && totalRounds > 0;
            }

            return {
              ...drive,
              allRoundsCompleted
            };
          } catch (error) {
            console.error(`Error checking round results for ${drive.companyName}:`, error);
            return drive;
          }
        })
      );

      console.log(`Filtered ${drivesWithRoundStatus.length} drives out of ${allDrives.length} for branch ${branch}`);
      setCompaniesDrives(drivesWithRoundStatus);
    } catch (error) {
      console.error('Failed to fetch companies drives:', error);
      setCompaniesDrives([]);
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompaniesDrives();
  }, [fetchCompaniesDrives]);

  // Filtered data using useMemo for performance
  const filteredData = useMemo(() => {
    if (!companiesDrives.length) return [];

    const q = (filters.company || '').trim().toLowerCase();
    const deptFilter = (filters.department || '').trim().toLowerCase();
    const modeFilter = filters.mode;
    const statusFilter = filters.status;
    const roundsFilter = (filters.rounds || '').trim();

    return companiesDrives.filter(c => {
      const startIso = toYmd(c.startingDate || c.driveStartDate || c.companyDriveDate || c.visitDate);
      const endIso = toYmd(c.endDate || c.endingDate || c.driveEndDate);

      // Match Company / Job Role (text search)
      if (q) {
        const companyName = (c.companyName || c.company || '').toLowerCase();
        const jobRole = (c.jobRole || '').toLowerCase();
        if (!companyName.includes(q) && !jobRole.includes(q)) return false;
      }

      // Match Department / Branch
      if (deptFilter) {
        const dept = (c.department || '').trim().toLowerCase();
        const branches = Array.isArray(c.eligibleBranches) 
          ? c.eligibleBranches.map(b => (b || '').trim().toLowerCase()) 
          : (c.eligibleBranches || c.branch || '').toString().split(',').map(b => b.trim().toLowerCase());
        
        if (dept !== deptFilter && !branches.some(b => b === deptFilter)) return false;
      }

      // Match Mode
      if (modeFilter && c.mode !== modeFilter) return false;

      // Match Dates
      if (filters.startDate && startIso !== filters.startDate) return false;
      if (filters.endDate && endIso !== filters.endDate) return false;

      // Match Status
      if (statusFilter) {
        let currentStatus = 'Eligibility';
        if (c.allRoundsCompleted || c.driveStatus === 'completed') {
          currentStatus = 'Ended';
        } else if (c.attendanceTaken) {
          currentStatus = 'Resume';
        } else if (c.eligibleCreated) {
          currentStatus = 'Attendance';
        } else {
          const todayStr = new Date().toISOString().split('T')[0];
          if (startIso && startIso > todayStr) {
            currentStatus = 'Scheduled';
          }
        }
        if (currentStatus !== statusFilter) return false;
      }

      // Match Rounds
      if (roundsFilter) {
        const driveRounds = String(c.rounds || c.numberOfRounds || '');
        if (!driveRounds.includes(roundsFilter)) return false;
      }

      return true;
    });
  }, [companiesDrives, filters]);

  const totalPages = Math.ceil(filteredData.length / drivesPerPage) || 1;

  const paginatedDrives = useMemo(() => {
    const startIndex = (currentPage - 1) * drivesPerPage;
    return filteredData.slice(startIndex, startIndex + drivesPerPage);
  }, [filteredData, currentPage]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      (filters.company || '').trim() ||
      filters.department ||
      filters.mode ||
      filters.startDate ||
      filters.endDate ||
      filters.status ||
      (filters.rounds || '').trim()
    );
  }, [filters]);

  const handleClearFilters = useCallback(() => {
    setFilters({
      company: '',
      department: '',
      mode: '',
      startDate: '',
      endDate: '',
      status: '',
      rounds: ''
    });
    setDateSelectionMode('none');
  }, []);

  // Handle input changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStartDateChange = useCallback((val) => {
    setFilters(prev => ({ ...prev, startDate: val || '' }));
    if (val) {
      if (!filters.endDate) {
        setDateSelectionMode('start-first');
      }
    } else {
      if (dateSelectionMode === 'start-first') {
        setFilters(prev => ({ ...prev, endDate: '' }));
        setDateSelectionMode('none');
      }
    }
  }, [filters.endDate, dateSelectionMode]);

  const handleEndDateChange = useCallback((val) => {
    setFilters(prev => ({ ...prev, endDate: val || '' }));
    if (val) {
      if (!filters.startDate) {
        setDateSelectionMode('end-first');
      }
    } else {
      if (dateSelectionMode === 'end-first') {
        setFilters(prev => ({ ...prev, startDate: '' }));
        setDateSelectionMode('none');
      }
    }
  }, [filters.startDate, dateSelectionMode]);

  // Auto-fetch logic when Start Date is selected
  useEffect(() => {
    if (filters.startDate && dateSelectionMode === 'start-first') {
      if (matchingEndDates.length === 1) {
        const autoEnd = matchingEndDates[0];
        if (filters.endDate !== autoEnd) {
          setFilters(prev => ({ ...prev, endDate: autoEnd }));
        }
      } else if (matchingEndDates.length > 1) {
        if (filters.endDate && !matchingEndDates.includes(filters.endDate)) {
          setFilters(prev => ({ ...prev, endDate: '' }));
        }
      } else {
        setFilters(prev => ({ ...prev, endDate: '' }));
      }
    }
  }, [filters.startDate, matchingEndDates, filters.endDate, dateSelectionMode]);

  // Auto-fetch logic when End Date is selected
  useEffect(() => {
    if (filters.endDate && dateSelectionMode === 'end-first') {
      if (matchingStartDates.length === 1) {
        const autoStart = matchingStartDates[0];
        if (filters.startDate !== autoStart) {
          setFilters(prev => ({ ...prev, startDate: autoStart }));
        }
      } else if (matchingStartDates.length > 1) {
        if (filters.startDate && !matchingStartDates.includes(filters.startDate)) {
          setFilters(prev => ({ ...prev, startDate: '' }));
        }
      } else {
        setFilters(prev => ({ ...prev, startDate: '' }));
      }
    }
  }, [filters.endDate, matchingStartDates, filters.startDate, dateSelectionMode]);

  // Reset dateSelectionMode to 'none' if both fields are empty
  useEffect(() => {
    if (!filters.startDate && !filters.endDate) {
      setDateSelectionMode('none');
    }
  }, [filters.startDate, filters.endDate]);

  const EyeIcon = () => (
    <svg className={styles['co-cd-profile-eye-icon']} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );

  const toggleExportMenu = () => {
    setShowExportMenu(prev => !prev);
  };

  // Function to simulate progress and handle export
  const simulateExport = async (operation, exportFunction) => {
    setShowExportMenu(false);

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
    try{
    const header = ["S.No", "Company", "Job Role", "Start Date", "End Date", "Package", "Rounds", "Mode"];
    const data = filteredData.map((item, index) => [
        index + 1,
        item.companyName || item.company || '—',
        item.jobRole || item.role || '—',
        item.startingDate || item.driveStartDate || item.companyDriveDate || item.visitDate || '—',
        item.endDate || item.endingDate || item.driveEndDate || '—',
        item.package || item.pkg || item.ctc || item.salaryPackage || '—',
        item.rounds || '—',
        item.mode || '—'
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Company Drives");

    XLSX.writeFile(wb, "CompanyDrives.xlsx");
    setShowExportMenu(false);
  }catch (error){
    throw error;
  }
  };
  
  const exportToPDF = () => {
    try{
    const doc = new jsPDF();
  
    // Define the table headers
    const tableColumn = ["S.No", "Company", "Job Role", "Start Date", "End Date", "Package", "Rounds", "Mode"];
  
    // Prepare the data rows from your filtered data
    const tableRows = filteredData.map((item, index) => [
        index + 1,
        item.companyName || item.company || '—',
        item.jobRole || item.role || '—',
        item.startingDate || item.driveStartDate || item.companyDriveDate || item.visitDate || '—',
        item.endDate || item.endingDate || item.driveEndDate || '—',
        item.package || item.pkg || item.ctc || item.salaryPackage || '—',
        item.rounds || '—',
        item.mode || '—'
    ]);
  
    // Add a title to the PDF
    doc.setFontSize(16);
    doc.text("Company Drives Report", 14, 15);
  
    // Generate the table using autoTable
    autoTable(doc,{
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
            1: { halign: 'left', cellWidth: 25 },
            2: { halign: 'left', cellWidth: 25 },
            3: { halign: 'left', cellWidth: 25 },
            4: { halign: 'center', cellWidth: 25 },
            5: { halign: 'center', cellWidth: 20 },
            6: { halign: 'center', cellWidth: 15 },
            7: { halign: 'center', cellWidth: 15 }
        },
        margin: { top: 20 },
    });
  
    // Save the PDF
    doc.save("CompanyDrives.pdf");
    setShowExportMenu(false);
  }catch (error){
    throw error;
  }
  };
  
  const handleExportToPDF = () => {
    simulateExport('pdf', exportToPDF);
  };
  
  const handleExportToExcel = () => {
    simulateExport('excel', exportToExcel);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };
  const handleCardClick = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  const handleDriveView = (drive) => {
    navigate('/coo-company-drive/view', {
      state: {
        viewMode: true,
        editingDriveId: drive.id || drive._id,
        editingDrive: drive
      }
    });
  };

  const [exportPopupState, setExportPopupState] = useState('none'); // 'none' | 'progress' | 'success' | 'failed'
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('Excel');

  return (
    <div>
      
      {/* --- NAVBAR --- */}
      <Navbar onToggleSidebar={toggleSidebar}  />
        
      {/* --- BODY LAYOUT --- */}
      <div className={styles['co-cd-layout']}>
        {/* --- SIDEBAR --- */}
        <Sidebar  isOpen={isSidebarOpen} onLogout={onLogout} currentView="company-drive" onViewChange={onViewChange}
          onClose={() => setIsSidebarOpen(false)}
        />
          
        
        {/* --- MAIN CONTENT --- */}
        <div className={styles['co-cd-main-content']}>
          {/* Top Cards Row */}
          <div className={styles['co-cd-top-cards-row']}>

            {/* 1: Report Analysis Card */}
            <div className={`${styles['co-cd-card']} ${styles['co-cd-report-analysis-card']}`} onClick={() => handleCardClick('report-analysis')} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && handleCardClick('report-analysis')} >
              <img src={CoordReportanalysis} alt="Report Analysis" className={styles['co-cd-report-analysis-card__image']} />
              <h4 className={styles['co-cd-card-title']}>Report Analysis</h4>
              <p className={styles['co-cd-card-desc']}>
                Tracks eligibility, applications, and selections
              </p>
            </div>

            {/* 2: Company Drive Search Card */}
            <div className={styles['co-cd-filter-section']}>
              <div className={styles['co-cd-filter-header-container']}>
                <div className={styles['co-cd-filter-header']}>Company Drive</div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className={styles['co-cd-clear-btn-header']}
                    onClick={handleClearFilters}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className={styles['co-cd-filter-content']}>
                {/* Company Name / Job Role Filter with Static Label */}
                <div className={styles['co-cd-input-wrapper']}>
                  <label className={styles['co-cd-static-label']} htmlFor="co-cd-search-company">
                    Company / Job Role
                  </label>
                  <div className={`${styles['co-cd-text-container']} ${companyFocused ? styles['is-focused'] : ''}`}>
                    <input
                      id="co-cd-search-company"
                      type="text"
                      className={styles['co-cd-text']}
                      placeholder="Search Company / Job Role"
                      value={filters.company}
                      onChange={(e) => handleFilterChange('company', e.target.value)}
                      onFocus={() => setCompanyFocused(true)}
                      onBlur={() => setCompanyFocused(false)}
                    />
                  </div>
                </div>

                {/* Branches Filter with Static Label */}
                <div className={styles['co-cd-input-wrapper']}>
                  <label className={styles['co-cd-static-label']} htmlFor="co-cd-search-branches">
                    Branches
                  </label>
                  <Dropdown
                    options={['', ...departmentOptions].map(opt => ({ label: opt === '' ? 'All Branches' : opt, value: opt }))}
                    selectedOption={filters.department}
                    onSelect={(val) => handleFilterChange('department', val)}
                    placeholder="All Branches"
                    role="coordinator"
                    className={styles['co-cd-dropdown-wrapper']}
                    headerClassName={styles['co-cd-dropdown-header']}
                  />
                </div>

                {/* Search Mode Filter with Static Label */}
                <div className={styles['co-cd-input-wrapper']}>
                  <label className={styles['co-cd-static-label']} htmlFor="co-cd-search-mode">
                    Search Mode
                  </label>
                  <Dropdown
                    options={['Online', 'Offline', 'Hybrid']}
                    selectedOption={filters.mode}
                    onSelect={(val) => handleFilterChange('mode', val)}
                    placeholder="Search Mode"
                    role="coordinator"
                    className={styles['co-cd-dropdown-wrapper']}
                    headerClassName={styles['co-cd-dropdown-header']}
                  />
                </div>

                {/* Dates Filter with Static Label and Start/End subfields */}
                <div className={styles['co-cd-input-wrapper']}>
                  <label className={styles['co-cd-static-label']} htmlFor="co-cd-search-dates">
                    Dates
                  </label>
                  <div className={styles['co-cd-date-range-inputs']}>
                    {Boolean(filters.endDate && matchingStartDates.length > 1 && dateSelectionMode === 'end-first') ? (
                      <div className={`${styles['co-cd-text-container']} ${styles['co-cd-select-container']} ${startDateFocused ? styles['is-focused'] : ''}`}>
                        <select
                          id="co-cd-search-start-date"
                          className={`${styles['co-cd-text']} ${styles['co-cd-select']}`}
                          value={filters.startDate}
                          onChange={(e) => handleStartDateChange(e.target.value)}
                          onFocus={() => setStartDateFocused(true)}
                          onBlur={() => setStartDateFocused(false)}
                          style={{ padding: '8px 6px 0', fontSize: '0.8rem' }}
                        >
                          <option value="">Start</option>
                          {matchingStartDates.map((ymd) => (
                            <option key={ymd} value={ymd}>
                              {toDmy(ymd)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <AdCalendar
                        id="co-cd-search-start-date"
                        value={filters.startDate}
                        onChange={handleStartDateChange}
                        variant="filter"
                        enabledDates={filters.endDate ? matchingStartDates : uniqueStartDates}
                        style={{ padding: '0px 6px', fontSize: '0.8rem', gap: '4px' }}
                        themeColor="#d23b42"
                        hoverColor="#fbebeb"
                      />
                    )}

                    <span className={styles['co-cd-date-range-sep']}>-</span>

                    {Boolean(filters.startDate && matchingEndDates.length > 1 && dateSelectionMode === 'start-first') ? (
                      <div className={`${styles['co-cd-text-container']} ${styles['co-cd-select-container']} ${endDateFocused ? styles['is-focused'] : ''}`}>
                        <select
                          id="co-cd-search-end-date"
                          className={`${styles['co-cd-text']} ${styles['co-cd-select']}`}
                          value={filters.endDate}
                          onChange={(e) => handleEndDateChange(e.target.value)}
                          onFocus={() => setEndDateFocused(true)}
                          onBlur={() => setEndDateFocused(false)}
                          style={{ padding: '8px 6px 0', fontSize: '0.8rem' }}
                        >
                          <option value="">End</option>
                          {matchingEndDates.map((ymd) => (
                            <option key={ymd} value={ymd}>
                              {toDmy(ymd)}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <AdCalendar
                        id="co-cd-search-end-date"
                        value={filters.endDate}
                        onChange={handleEndDateChange}
                        variant="filter"
                        enabledDates={filters.startDate ? matchingEndDates : uniqueEndDates}
                        style={{ padding: '0px 6px', fontSize: '0.8rem', gap: '4px' }}
                        themeColor="#d23b42"
                        hoverColor="#fbebeb"
                      />
                    )}
                  </div>
                </div>

                {/* Status Filter with Static Label */}
                <div className={styles['co-cd-input-wrapper']}>
                  <label className={styles['co-cd-static-label']} htmlFor="co-cd-search-status">
                    Status
                  </label>
                  <Dropdown
                    options={['Eligibility', 'Attendance', 'Resume', 'Ended']}
                    selectedOption={filters.status}
                    onSelect={(val) => handleFilterChange('status', val)}
                    placeholder="Search Status"
                    role="coordinator"
                    className={styles['co-cd-dropdown-wrapper']}
                    headerClassName={styles['co-cd-dropdown-header']}
                  />
                </div>

                {/* Rounds Filter with Static Label */}
                <div className={styles['co-cd-input-wrapper']}>
                  <label className={styles['co-cd-static-label']} htmlFor="co-cd-search-rounds">
                    Rounds
                  </label>
                  <div className={`${styles['co-cd-text-container']} ${roundsFocused ? styles['is-focused'] : ''}`}>
                    <input
                      id="co-cd-search-rounds"
                      type="text"
                      className={styles['co-cd-text']}
                      placeholder="Search Rounds"
                      value={filters.rounds}
                      onChange={(e) => handleFilterChange('rounds', e.target.value)}
                      onFocus={() => setRoundsFocused(true)}
                      onBlur={() => setRoundsFocused(false)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3: Stat Cards */}
            <div className={styles['co-cd-stat-cards-group']}>
              <div className={`${styles['co-cd-card']} ${styles['co-cd-stat-card']}`}>
                <img src={CoodcompanyDriveNOD} alt="Number of Drives" className={styles['co-cd-stat-card__image']} />
                <span className={styles['co-cd-stat-card__label']}>Number of<br />Drives</span>
                <span className={styles['co-cd-stat-card__value']}>{companiesDrives.length}</span>
              </div>
              <div className={`${styles['co-cd-card']} ${styles['co-cd-stat-card']}`}>
                <img src={CoodCompanyDriveMonths} alt="This Month's Drives" className={styles['co-cd-stat-card__image']} />
                <span className={styles['co-cd-stat-card__label']}>This Month's<br />Drives</span>
                <span className={styles['co-cd-stat-card__value']}>{companiesDrives.filter(d => {
                  const driveDate = new Date(d.startingDate || d.driveStartDate || d.companyDriveDate || d.visitDate);
                  const now = new Date();
                  return driveDate.getMonth() === now.getMonth() && driveDate.getFullYear() === now.getFullYear();
                }).length}</span>
              </div>
            </div>

          </div>
          
          {/* --- Company Drive Table Container --- */}
          <div className={styles['co-cd-drive-table-container']}>
              <div className={styles['co-cd-table-header-row']}>
                  <div className={styles['co-cd-table-title-wrap']}>
                      <div className={styles['co-cd-table-title-top-row']}>
                          <h3 className={styles['co-cd-table-title']}>COMPANY DRIVE</h3>
                          <div className={`${styles['co-cd-print-button-container']} ${styles['mobile-only-print']}`}>
                              <button
                                  type="button"
                                  className={styles['co-cd-print-btn']}
                                  onClick={toggleExportMenu}
                              >
                                  Print
                              </button>
                              {showExportMenu && (
                                  <div className={styles['co-cd-export-menu']}>
                                      <button type="button" onClick={handleExportToExcel}>Export to Excel</button>
                                      <button type="button" onClick={handleExportToPDF}>Save as PDF</button>
                                  </div>
                              )}
                          </div>
                      </div>
                      {!isInitialLoading && (
                          <div className={styles['co-cd-table-subtitle']}>
                              Page {currentPage} of {totalPages} | Showing {paginatedDrives.length} on this page
                          </div>
                      )}
                  </div>
                  <div className={styles['co-cd-table-actions']}>
                      {totalPages > 1 && (
                          <div className={styles['co-cd-pagination-controls']}>
                              <button
                                  type="button"
                                  className={styles['co-cd-page-btn']}
                                  onClick={handlePrevPage}
                                  disabled={currentPage <= 1 || isLoading}
                              >
                                  Prev
                              </button>
                              <span className={styles['co-cd-page-indicator']}>
                                  {currentPage} / {totalPages}
                              </span>
                              <button
                                  type="button"
                                  className={styles['co-cd-page-btn']}
                                  onClick={handleNextPage}
                                  disabled={currentPage >= totalPages || isLoading}
                              >
                                  Next
                              </button>
                          </div>
                      )}
                      <div className={`${styles['co-cd-print-button-container']} ${styles['desktop-only-print']}`}>
                          <button
                              type="button"
                              className={styles['co-cd-print-btn']}
                              onClick={toggleExportMenu}
                          >
                              Print
                          </button>
                          {showExportMenu && (
                              <div className={styles['co-cd-export-menu']}>
                                  <button type="button" onClick={handleExportToExcel}>Export to Excel</button>
                                  <button type="button" onClick={handleExportToPDF}>Save as PDF</button>
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              <div className={styles['co-cd-drive-table-container__table-wrapper']} id="co-cd-drive-table-container__table-wrapper">
                  <table>
                      <thead>
                          <tr className={styles['co-cd-table-head-row']}>
                              <th className={`${styles['co-cd-th']} ${styles['co-cd-sno']}`}>S.No</th>
                              <th className={`${styles['co-cd-th']} ${styles['co-cd-company']}`}>Company</th>
                              <th className={`${styles['co-cd-th']} ${styles['co-cd-job-role']}`}>Job Role</th>
                              <th className={`${styles['co-cd-th']} ${styles['co-cd-visit-date']}`}>Start Date</th>
                              <th className={`${styles['co-cd-th']} ${styles['co-cd-visit-date']}`}>End Date</th>
                              <th className={`${styles['co-cd-th']} ${styles['co-cd-package']}`}>Package</th>
                              <th className={`${styles['co-cd-th']} ${styles['co-cd-rounds']}`}>Rounds</th>
                              <th className={`${styles['co-cd-th']} ${styles['co-cd-mode']}`}>Mode</th>
                              <th className={`${styles['co-cd-th']} ${styles['co-cd-profile']}`}>View</th>
                          </tr>
                      </thead>
                      <tbody>
                          {isInitialLoading ? (
                              <tr className={styles['co-cd-loading-row']}>
                                  <td colSpan="9" className={styles['co-cd-loading-cell']}>
                                      <div className={styles['co-cd-loading-wrapper']}>
                                          <div className={styles['co-cd-spinner']}></div>
                                          <span className={styles['co-cd-loading-text']}>Loading companies drives…</span>
                                      </div>
                                  </td>
                              </tr>
                          ) : paginatedDrives.length ? (
                              paginatedDrives.map((item, index) => {
                                  const driveId = item.id || item._id;
                                  const formatDate = (dateStr) => {
                                      if (!dateStr) return '—';
                                      const date = new Date(dateStr);
                                      if (isNaN(date.getTime())) return '—';
                                      const day = String(date.getDate()).padStart(2, '0');
                                      const month = String(date.getMonth() + 1).padStart(2, '0');
                                      const year = date.getFullYear();
                                      return `${day}-${month}-${year}`;
                                  };
                                  
                                  return (
                                      <tr key={driveId} className={styles['co-cd-table-row']}>
                                          <td className={`${styles['co-cd-td']} ${styles['co-cd-sno']}`}>{(currentPage - 1) * drivesPerPage + index + 1}</td>
                                          <td className={`${styles['co-cd-td']} ${styles['co-cd-company']}`}>{item.companyName || item.company || '—'}</td>
                                          <td className={`${styles['co-cd-td']} ${styles['co-cd-job-role']}`}>{item.jobRole || '—'}</td>
                                          <td className={`${styles['co-cd-td']} ${styles['co-cd-visit-date']}`}>{formatDate(item.startingDate || item.driveStartDate || item.companyDriveDate)}</td>
                                          <td className={`${styles['co-cd-td']} ${styles['co-cd-visit-date']}`}>{formatDate(item.endDate || item.endingDate || item.driveEndDate)}</td>
                                          <td className={`${styles['co-cd-td']} ${styles['co-cd-package']}`}>{item.package || item.pkg || item.ctc || item.salaryPackage || '—'}</td>
                                          <td className={`${styles['co-cd-td']} ${styles['co-cd-rounds']}`}>{item.rounds || '—'}</td>
                                          <td className={`${styles['co-cd-td']} ${styles['co-cd-mode']}`}>{item.mode || '—'}</td>
                                          <td className={`${styles['co-cd-td']} ${styles['co-cd-profile']}`} onClick={() => handleDriveView(item)} style={{ cursor: 'pointer' }}>
                                              <EyeIcon />
                                          </td>
                                      </tr>
                                  );
                              })
                          ) : (
                              <tr>
                                  <td colSpan="9" style={{ textAlign: 'center', padding: '2rem 0' }}>
                                      No company drives found matching the applied filters.
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
        </div>

      </div>

      <ExportProgressAlert
        isOpen={exportPopupState === 'progress'}
        onClose={() => {}}
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
         
    </div>
  );
}