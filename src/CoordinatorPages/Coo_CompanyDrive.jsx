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
        } else if (c.eligibleCreated || c.hasCoordinatorEligibility) {
          currentStatus = 'Attendance';
        } else {
          const todayStr = new Date().toISOString().split('T')[0];
          const startStr = toYmd(c.startingDate || c.driveStartDate || c.companyDriveDate || c.visitDate);
          if (startStr && startStr > todayStr && statusFilter === 'Scheduled') {
            currentStatus = 'Scheduled';
          }
        }
        if (currentStatus !== statusFilter) {
          return false;
        }
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

      // Fetch coordinator eligible students (already branch-filtered by backend)
      let coordinatorEligibleRecords = [];
      try {
        const cooEligResp = await mongoDBService.getCoordinatorEligibleStudents();
        if (Array.isArray(cooEligResp)) {
          coordinatorEligibleRecords = cooEligResp;
        } else if (cooEligResp && Array.isArray(cooEligResp.data)) {
          coordinatorEligibleRecords = cooEligResp.data;
        } else if (cooEligResp && Array.isArray(cooEligResp.eligibleStudents)) {
          coordinatorEligibleRecords = cooEligResp.eligibleStudents;
        }
      } catch (cooEligErr) {
        console.warn('Failed to fetch coordinator eligible students records:', cooEligErr);
      }

      // Fetch all eligible-students records as comprehensive fallback
      let allEligibleRecords = [];
      try {
        const eligibleResp = await mongoDBService.getAllEligibleStudents();
        if (Array.isArray(eligibleResp)) {
          allEligibleRecords = eligibleResp;
        } else if (eligibleResp && Array.isArray(eligibleResp.data)) {
          allEligibleRecords = eligibleResp.data;
        } else if (eligibleResp && Array.isArray(eligibleResp.eligibleStudents)) {
          allEligibleRecords = eligibleResp.eligibleStudents;
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
        const driveIdStr = driveId ? String(driveId) : null;
        const companyNameNorm = (drive.companyName || drive.company || '').trim().toLowerCase();
        const jobRoleNorm = (drive.jobRole || '').trim().toLowerCase();

        const hasAttendance = attendanceRecords.some(attendance => {
          const attendanceDriveIdStr = attendance.driveId ? String(attendance.driveId) : null;

          if (attendanceDriveIdStr && driveIdStr && attendanceDriveIdStr === driveIdStr) {
            return true;
          }

          const companyMatch = (attendance.companyName || '').trim().toLowerCase() === companyNameNorm;
          const jobRoleMatch = !jobRoleNorm || (attendance.jobRole || '').trim().toLowerCase() === jobRoleNorm;
          const attendanceDateNorm = normalizeDate(attendance.startDate);
          const driveDateMatch = attendanceDateNorm === driveStart ||
            attendanceDateNorm === driveEnd ||
            (attendanceDateNorm && driveStart && driveEnd &&
              attendanceDateNorm >= driveStart && attendanceDateNorm <= driveEnd);

          return companyMatch && jobRoleMatch && driveDateMatch;
        });

        // Check if eligibility records exist specifically for coordinator's branch (e.g. CSE)
        const hasCoordinatorEligible = coordinatorEligibleRecords.some(er => {
          const erDriveIdStr = er.driveId ? String(er.driveId) : null;
          if (erDriveIdStr && driveIdStr && erDriveIdStr === driveIdStr) {
            return true;
          }
          if (!erDriveIdStr && companyNameNorm) {
            const erCompany = (er.companyName || '').trim().toLowerCase();
            const erRole = (er.jobRole || '').trim().toLowerCase();
            const erStart = normalizeDate(er.driveStartDate || er.companyDriveDate);
            return erCompany === companyNameNorm && erRole === jobRoleNorm && erStart && driveStart && erStart === driveStart;
          }
          return false;
        }) || allEligibleRecords.some(er => {
          const erDriveIdStr = er.driveId ? String(er.driveId) : null;
          const idMatch = erDriveIdStr && driveIdStr && erDriveIdStr === driveIdStr;
          const erCompany = (er.companyName || '').trim().toLowerCase();
          const erRole = (er.jobRole || '').trim().toLowerCase();
          const erStart = normalizeDate(er.driveStartDate || er.companyDriveDate);
          const fallbackMatch = !erDriveIdStr && erCompany === companyNameNorm && erRole === jobRoleNorm && erStart && driveStart && erStart === driveStart;

          if (idMatch || fallbackMatch) {
            const students = Array.isArray(er.students) ? er.students : [];
            const coordBranch = branch ? branch.trim().toUpperCase() : 'CSE';
            return students.some(st => {
              const stBranch = (st.branch || st.department || '').trim().toUpperCase();
              return stBranch === coordBranch || stBranch.includes(coordBranch) || coordBranch.includes(stBranch);
            });
          }
          return false;
        });

        const hasAnyEligible = allEligibleRecords.some(er => {
          const erDriveIdStr = er.driveId ? String(er.driveId) : null;
          if (erDriveIdStr && driveIdStr && erDriveIdStr === driveIdStr) return true;
          if (!erDriveIdStr && companyNameNorm) {
            const erCompany = (er.companyName || '').trim().toLowerCase();
            const erRole = (er.jobRole || '').trim().toLowerCase();
            const erStart = normalizeDate(er.driveStartDate || er.companyDriveDate);
            return erCompany === companyNameNorm && erRole === jobRoleNorm && erStart && driveStart && erStart === driveStart;
          }
          return false;
        });

        return {
          ...drive,
          attendanceTaken: hasAttendance,
          eligibleCreated: hasAnyEligible,
          hasCoordinatorEligibility: hasCoordinatorEligible,
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

  // Listen for eligible-students creation events and attendance events to refresh drives
  useEffect(() => {
    const handleRefresh = () => {
      console.log('Refreshing company drives in coordinator page...');
      fetchCompaniesDrives();
    };

    window.addEventListener('eligibleStudentsAdded', handleRefresh);
    window.addEventListener('attendanceSubmitted', handleRefresh);
    window.addEventListener('roundResultNotification', handleRefresh);
    window.addEventListener('focus', handleRefresh);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleRefresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('eligibleStudentsAdded', handleRefresh);
      window.removeEventListener('attendanceSubmitted', handleRefresh);
      window.removeEventListener('roundResultNotification', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
        } else if (c.eligibleCreated || c.hasCoordinatorEligibility) {
          currentStatus = 'Attendance';
        } else {
          const todayStr = new Date().toISOString().split('T')[0];
          if (startIso && startIso > todayStr && statusFilter === 'Scheduled') {
            currentStatus = 'Scheduled';
          }
        }
        if (currentStatus !== statusFilter) {
          return false;
        }
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

  const getDriveStatus = (item) => {
    if (item.allRoundsCompleted || item.driveStatus === 'completed') return 'Ended';
    if (item.attendanceTaken) return 'Resume';
    if (item.eligibleCreated || item.hasCoordinatorEligibility) return 'Attendance';
    return 'Eligibility';
  };

  const handleStatusClick = (drive) => {
    const normalizeDate = (d) => {
      if (!d) return '';
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return '';
      return dt.toISOString().split('T')[0];
    };

    const startDate = normalizeDate(drive.startingDate || drive.driveStartDate || drive.companyDriveDate || drive.visitDate);
    const endDate = normalizeDate(drive.endDate || drive.endingDate || drive.driveEndDate || drive.startingDate || drive.driveStartDate || drive.companyDriveDate || drive.visitDate);
    const companyName = drive.companyName || drive.company || '';
    const jobRole = drive.jobRole || drive.role || '';

    navigate('/coo-eligible-students', {
      state: {
        filterData: {
          companyName,
          jobRole,
          startDate,
          endDate,
          driveId: drive._id || drive.id
        },
        selectedDrive: drive,
        company: drive
      }
    });
  };

  const renderStatusIcon = (item) => {
    const status = getDriveStatus(item);
    if (status === 'Ended') {
      return (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ cursor: 'default', margin: '0 auto', display: 'block' }}
          title="Drive Ended"
        >
          <circle cx="12" cy="12" r="10" fill="#d23b42" />
          <path d="M7 12L10 15L17 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    }
    if (status === 'Resume') {
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ cursor: 'default', margin: '0 auto', display: 'block' }}
          title="Drive in Progress"
        >
          <circle cx="12" cy="12" r="10" fill="#d23b42" />
          <path d="M10 8L16 12L10 16V8Z" fill="white" />
        </svg>
      );
    }
    if (status === 'Attendance') {
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ cursor: 'pointer', margin: '0 auto', display: 'block' }}
          onClick={(e) => {
            e.stopPropagation();
            navigate('/coo-attendance', {
              state: {
                companyData: item,
                company: item,
                selectedDrive: item,
                driveId: item._id || item.id,
                filterData: {
                  companyName: item.companyName || item.company || '',
                  jobRole: item.jobRole || item.role || '',
                  startDate: item.startingDate || item.driveStartDate || item.companyDriveDate,
                  endDate: item.endDate || item.endingDate || item.driveEndDate
                }
              }
            });
          }}
          title="Take Attendance"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" fill="#d23b42" />
          <path d="M8 2V6M16 2V6" stroke="#d23b42" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="10" x2="21" y2="10" stroke="white" strokeWidth="2" />
          <circle cx="8" cy="15" r="1.5" fill="white" />
          <circle cx="12" cy="15" r="1.5" fill="white" />
          <circle cx="16" cy="15" r="1.5" fill="white" />
        </svg>
      );
    }
    // Eligibility (3 students icon as in Admin page) - Clickable to navigate to eligible students
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          handleStatusClick(item);
        }}
        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        title="Select Eligible Students"
      >
        <svg width="24" height="24" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ cursor: 'pointer', margin: '0 auto', display: 'block' }}>
          <path d="M0.957031 10.9085C0.957031 11.7903 1.30734 12.6361 1.9309 13.2596C2.55446 13.8832 3.40019 14.2335 4.28203 14.2335C5.16388 14.2335 6.0096 13.8832 6.63316 13.2596C7.25672 12.6361 7.60703 11.7903 7.60703 10.9085C7.60703 10.0267 7.25672 9.18092 6.63316 8.55737C6.0096 7.93381 5.16388 7.5835 4.28203 7.5835C3.40019 7.5835 2.55446 7.93381 1.9309 8.55737C1.30734 9.18092 0.957031 10.0267 0.957031 10.9085Z" fill="#d23b42"/>
          <path d="M0.617953 17.2083H7.94462C8.05366 17.2072 8.1603 17.1761 8.25289 17.1185C8.34547 17.0609 8.42045 16.9789 8.46962 16.8816C8.51735 16.7817 8.53504 16.6701 8.52054 16.5603C8.50604 16.4506 8.45998 16.3474 8.38795 16.2633C7.89779 15.6447 7.27334 15.1457 6.56185 14.8041C5.85037 14.4625 5.07051 14.2873 4.28129 14.2916C3.49264 14.2907 2.71392 14.4675 2.00296 14.8088C1.29201 15.1502 0.667087 15.6473 0.174619 16.2633C0.10259 16.3474 0.056529 16.4506 0.0420315 16.5603C0.027534 16.6701 0.0452241 16.7817 0.0929528 16.8816C0.142125 16.9789 0.2171 17.0609 0.309686 17.1185C0.402273 17.1761 0.508912 17.2072 0.617953 17.2083ZM14.1396 8.1666C14.7947 8.1665 15.4352 7.97288 15.9807 7.61004C16.5261 7.24719 16.9523 6.73131 17.2055 6.12713C17.4588 5.52296 17.528 4.85743 17.4044 4.21408C17.2807 3.57074 16.9698 2.97825 16.5106 2.51101C16.0514 2.04376 15.4644 1.72257 14.8233 1.58776C14.1822 1.45295 13.5156 1.51053 12.9071 1.75327C12.2986 1.99601 11.7754 2.4131 11.4031 2.95216C11.0308 3.49123 10.8261 4.12825 10.8146 4.78327C10.8084 5.22438 10.8898 5.66233 11.054 6.07179C11.2182 6.48125 11.4619 6.85409 11.7712 7.16873C12.0804 7.48337 12.4489 7.73357 12.8555 7.90486C13.262 8.07614 13.6985 8.1651 14.1396 8.1666ZM9.88129 11.3749H18.3863C18.4956 11.3752 18.6028 11.3446 18.6956 11.2869C18.7885 11.2291 18.8632 11.1464 18.9113 11.0483C18.9606 10.9495 18.9802 10.8385 18.9678 10.7287C18.9554 10.619 18.9114 10.5152 18.8413 10.4299C18.2807 9.73021 17.5706 9.16482 16.7631 8.7752C15.9557 8.38558 15.0712 8.18162 14.1746 8.17827C13.278 8.18162 12.3936 8.38558 11.5861 8.7752C10.7786 9.16482 10.0685 9.73021 9.50795 10.4299C9.42265 10.5054 9.36082 10.6038 9.3298 10.7134C9.29878 10.8231 9.29987 10.9393 9.33295 11.0483C9.38273 11.1501 9.4611 11.2352 9.55848 11.2932C9.65586 11.3513 9.76803 11.3796 9.88129 11.3749ZM20.393 10.9083C20.393 11.7901 20.7433 12.6358 21.3668 13.2594C21.9904 13.883 22.8361 14.2333 23.718 14.2333C24.5998 14.2333 25.4455 13.883 26.0691 13.2594C26.6926 12.6358 27.043 11.7901 27.043 10.9083C27.043 10.0264 26.6926 9.1807 26.0691 8.55714C25.4455 7.93358 24.5998 7.58327 23.718 7.58327C22.8361 7.58327 21.9904 7.93358 21.3668 8.55714C20.7433 9.1807 20.393 10.0264 20.393 10.9083Z" fill="#d23b42"/>
          <path d="M20.0676 17.2082H27.3826C27.4919 17.2084 27.5991 17.1779 27.6919 17.1202C27.7847 17.0624 27.8595 16.9797 27.9076 16.8815C27.9541 16.782 27.9722 16.6716 27.9598 16.5625C27.9475 16.4534 27.9052 16.3498 27.8376 16.2632C27.3439 15.6457 26.7171 15.1476 26.004 14.8062C25.2908 14.4648 24.5098 14.2889 23.7192 14.2915C22.9307 14.2915 22.1523 14.4686 21.4415 14.8099C20.7306 15.1512 20.1056 15.6478 19.6126 16.2632C19.5424 16.3485 19.4985 16.4523 19.4861 16.562C19.4736 16.6717 19.4933 16.7827 19.5426 16.8815C19.5907 16.9797 19.6654 17.0624 19.7582 17.1202C19.851 17.1779 19.9582 17.2084 20.0676 17.2082Z" fill="#d23b42"/>
          <path d="M26.8333 18.9583H19.25C19.0953 18.9583 18.9469 18.8969 18.8375 18.7875C18.7281 18.6781 18.6667 18.5297 18.6667 18.375V14.2917C18.6667 13.9822 18.5437 13.6855 18.325 13.4667C18.1062 13.2479 17.8094 13.125 17.5 13.125H10.5C10.1906 13.125 9.89383 13.2479 9.67504 13.4667C9.45625 13.6855 9.33333 13.9822 9.33333 14.2917V18.375C9.33333 18.5297 9.27187 18.6781 9.16248 18.7875C9.05308 18.8969 8.90471 18.9583 8.75 18.9583H1.16667C0.857247 18.9583 0.560501 19.0812 0.341709 19.3C0.122916 19.5188 0 19.8156 0 20.125L0 25.375C0 25.6844 0.122916 25.9812 0.341709 26.2C0.560501 26.4188 0.857247 26.5417 1.16667 26.5417H26.8333C27.1428 26.5417 27.4395 26.4188 27.6583 26.2C27.8771 25.9812 28 25.6844 28 25.375V20.125C28 19.8156 27.8771 19.5188 27.6583 19.3C27.4395 19.0812 27.1428 18.9583 26.8333 18.9583Z" fill="#d23b42"/>
        </svg>
      </div>
    );
  };

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
    try {
      const header = ["S.No", "Company", "Job Role", "Start Date", "End Date", "Package", "Rounds", "Mode", "Status"];
      const data = filteredData.map((item, index) => [
        index + 1,
        item.companyName || item.company || '—',
        item.jobRole || item.role || '—',
        item.startingDate || item.driveStartDate || item.companyDriveDate || item.visitDate || '—',
        item.endDate || item.endingDate || item.driveEndDate || '—',
        item.package || item.pkg || item.ctc || item.salaryPackage || '—',
        item.rounds || '—',
        item.mode || '—',
        getDriveStatus(item)
      ]);
      const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Company Drives");

      XLSX.writeFile(wb, "CompanyDrives.xlsx");
      setShowExportMenu(false);
    } catch (error) {
      throw error;
    }
  };
  
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const tableColumn = ["S.No", "Company", "Job Role", "Start Date", "End Date", "Package", "Rounds", "Mode", "Status"];
      const tableRows = filteredData.map((item, index) => [
        index + 1,
        item.companyName || item.company || '—',
        item.jobRole || item.role || '—',
        item.startingDate || item.driveStartDate || item.companyDriveDate || item.visitDate || '—',
        item.endDate || item.endingDate || item.driveEndDate || '—',
        item.package || item.pkg || item.ctc || item.salaryPackage || '—',
        item.rounds || '—',
        item.mode || '—',
        getDriveStatus(item)
      ]);

      doc.setFontSize(16);
      doc.text("Company Drives Report", 14, 15);

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
          0: { halign: 'center', cellWidth: 10 },
          1: { halign: 'left', cellWidth: 22 },
          2: { halign: 'left', cellWidth: 22 },
          3: { halign: 'left', cellWidth: 22 },
          4: { halign: 'center', cellWidth: 22 },
          5: { halign: 'center', cellWidth: 18 },
          6: { halign: 'center', cellWidth: 14 },
          7: { halign: 'center', cellWidth: 14 },
          8: { halign: 'center', cellWidth: 20 }
        },
        margin: { top: 20 },
      });

      doc.save("CompanyDrives.pdf");
      setShowExportMenu(false);
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
        editingDrive: drive,
        company: drive
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

            {/* 2: Company Drive Search Card (3x2 Grid) */}
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
                {/* Row 1 - Field 1: Company / Job Role */}
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

                {/* Row 1 - Field 2: Search Mode */}
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

                {/* Row 1 - Field 3: Rounds */}
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

                {/* Row 2 - Field 4: Dates */}
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

                {/* Row 2 - Field 5: Status */}
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

                {/* Row 2 - Slot 6: Clear Button (Desktop only) */}
                <div className={`${styles['co-cd-input-wrapper']} ${styles['co-cd-desktop-clear-slot']}`} style={{ justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className={styles['co-cd-grid-clear-btn']}
                    onClick={handleClearFilters}
                    disabled={!hasActiveFilters}
                  >
                    Clear
                  </button>
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
                              <th className={`${styles['co-cd-th']} ${styles['co-cd-status']}`}>Status</th>
                              <th className={`${styles['co-cd-th']} ${styles['co-cd-profile']}`}>View</th>
                          </tr>
                      </thead>
                      <tbody>
                          {isInitialLoading ? (
                              <tr className={styles['co-cd-loading-row']}>
                                  <td colSpan="10" className={styles['co-cd-loading-cell']}>
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
                                          <td className={`${styles['co-cd-td']} ${styles['co-cd-status']}`}>
                                              {renderStatusIcon(item)}
                                          </td>
                                          <td className={`${styles['co-cd-td']} ${styles['co-cd-profile']}`} onClick={() => handleDriveView(item)} style={{ cursor: 'pointer' }}>
                                              <EyeIcon />
                                          </td>
                                      </tr>
                                  );
                              })
                          ) : (
                              <tr>
                                  <td colSpan="10" style={{ textAlign: 'center', padding: '2rem 0' }}>
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