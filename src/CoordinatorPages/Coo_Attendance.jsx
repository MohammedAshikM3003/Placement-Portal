import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import Dropdown from '../components/common/Dropdown/Dropdown';
import styles from './Coo_Attendance.module.css';
import mongoDBService from '../services/mongoDBService.jsx';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

// Helper function to read coordinator data from storage
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

export default function Attendance({ onLogout, currentView, onViewChange }) {
  useCoordinatorAuth(); // JWT authentication verification
  const navigate = useNavigate();
  const location = useLocation();

  // Print/Export Dropdown & Popup States
  const [showDropdown, setShowDropdown] = useState(false);
  const [exportPopupState, setExportPopupState] = useState('none'); // 'none' | 'progress' | 'success' | 'failed'
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('Excel');

  const [selectedCompanyJob, setSelectedCompanyJob] = useState(null);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [selectedRound, setSelectedRound] = useState("Round 1");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [drives, setDrives] = useState([]);
  const [students, setStudents] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [existingAttendances, setExistingAttendances] = useState([]);
  const [eligibleStudentsData, setEligibleStudentsData] = useState([]);
  const [coordinatorBranch, setCoordinatorBranch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to refresh data
  const refreshData = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Helper function to check if a drive has existing attendance
  const hasExistingAttendance = (companyName, jobRole, date, roundNumber) => {
    return existingAttendances.some(
      att => (att.companyName || '').toLowerCase().trim() === (companyName || '').toLowerCase().trim() &&
        (!jobRole || !att.jobRole || (att.jobRole || '').toLowerCase().trim() === (jobRole || '').toLowerCase().trim()) &&
        (!roundNumber || att.roundNumber === roundNumber || att.round === `Round ${roundNumber}` || att.round === String(roundNumber)) &&
        (!date || new Date(att.startDate).toDateString() === new Date(date).toDateString())
    );
  };

  // Fetch coordinator's branch and attendance data on mount
  useEffect(() => {
    const coordinatorData = readStoredCoordinatorData();
    const branch = resolveCoordinatorDepartment(coordinatorData);

    if (branch) {
      setCoordinatorBranch(branch);
      console.log('Coordinator branch:', branch);
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);

        console.log('=== FETCHING FRESH ATTENDANCE DATA ===');

        // Fetch fresh data from companies.drives collection AND attendances AND eligible students
        const [drivesResponse, attendancesResponse, eligibleStudentsResponse] = await Promise.all([
          mongoDBService.getCompanyDrives(),
          mongoDBService.getAllAttendances ? mongoDBService.getAllAttendances() : mongoDBService.getAllAttendance(),
          mongoDBService.getAllEligibleStudents()
        ]);

        const allDrives = Array.isArray(drivesResponse) ? drivesResponse : [];
        let allEligible = [];
        if (Array.isArray(eligibleStudentsResponse)) {
          allEligible = eligibleStudentsResponse;
        } else if (eligibleStudentsResponse?.eligibleStudents) {
          allEligible = eligibleStudentsResponse.eligibleStudents;
        } else if (eligibleStudentsResponse?.data) {
          allEligible = eligibleStudentsResponse.data;
        }
        setEligibleStudentsData(allEligible);

        let attList = [];
        if (Array.isArray(attendancesResponse)) {
          attList = attendancesResponse;
        } else if (attendancesResponse?.data) {
          attList = attendancesResponse.data;
        } else if (attendancesResponse?.attendances) {
          attList = attendancesResponse.attendances;
        }
        setExistingAttendances(attList);

        // Normalize date for comparison
        const normalizeDate = (dateStr) => {
          if (!dateStr) return null;
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return null;
          return date.toISOString().split('T')[0];
        };

        const targetBranch = branch || 'CSE';
        const branchDrives = allDrives.filter(drive => {
          const driveBranches = (drive.eligibleBranches || drive.branch || drive.department || '').toString().split(',').map(b => b.trim().toUpperCase());
          const matchesBranch = !targetBranch || driveBranches.some(b => b === targetBranch || b.includes(targetBranch) || targetBranch.includes(b));

          // Check if drive has eligible students in database
          const driveDateNormalized = normalizeDate(drive.startingDate || drive.driveStartDate || drive.companyDriveDate);
          const hasEligibleStudents = allEligible.some(es => {
            const esDateNormalized = normalizeDate(es.driveStartDate || es.companyDriveDate);
            const esCompanyLower = (es.companyName || '').toLowerCase().trim();
            const driveCompanyLower = (drive.companyName || '').toLowerCase().trim();
            return esCompanyLower === driveCompanyLower && (!driveDateNormalized || !esDateNormalized || esDateNormalized === driveDateNormalized);
          }) || allEligible.some(es => (es.companyName || '').toLowerCase().trim() === (drive.companyName || '').toLowerCase().trim());

          return matchesBranch && hasEligibleStudents;
        });

        setDrives(branchDrives);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
        setIsLoading(false);
      }
    };
    fetchData();
  }, [refreshKey]);

  // Refresh data when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Format date display (DD-MM-YYYY)
  const formatDateDisplay = (dateString) => {
    if (!dateString) return 'dd-mm-yyyy';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Group drives by company and job role
  const groupedDrivesArray = useMemo(() => {
    const grouped = drives.reduce((acc, drive) => {
      const key = `${drive.companyName}-${drive.jobRole || 'Default'}`;
      if (!acc[key]) {
        acc[key] = {
          companyName: drive.companyName,
          jobRole: drive.jobRole || '',
          drives: []
        };
      }
      acc[key].drives.push(drive);
      return acc;
    }, {});
    return Object.values(grouped);
  }, [drives]);

  const driveDropdownOptions = useMemo(() => {
    return groupedDrivesArray.map(group => {
      const key = `${group.companyName}:${group.jobRole}`;
      const hasAttendance = existingAttendances.some(
        att => (att.companyName || '').toLowerCase().trim() === (group.companyName || '').toLowerCase().trim() &&
          (!group.jobRole || (att.jobRole || '').toLowerCase().trim() === (group.jobRole || '').toLowerCase().trim())
      );
      return {
        label: group.jobRole ? `${group.companyName} : ${group.jobRole}` : group.companyName,
        value: key,
        style: {
          color: hasAttendance ? '#D23B42' : '#555',
          fontWeight: hasAttendance ? '600' : 'bold'
        }
      };
    });
  }, [groupedDrivesArray, existingAttendances]);

  // Round dropdown options based on selected drive
  const roundDropdownOptions = useMemo(() => {
    if (!selectedCompanyJob || !selectedCompanyJob.drives || selectedCompanyJob.drives.length === 0) return [];

    let targetDrive = selectedDrive;
    if (!targetDrive && startDate && selectedCompanyJob.drives.length > 0) {
      targetDrive = selectedCompanyJob.drives.find(d => {
        const dStart = d.startingDate || d.driveStartDate || d.companyDriveDate;
        return dStart && new Date(dStart).toISOString().split('T')[0] === new Date(startDate).toISOString().split('T')[0];
      });
    }

    let maxRounds = 1;
    if (targetDrive) {
      maxRounds = parseInt(targetDrive.rounds) || parseInt(targetDrive.numberOfRounds) || parseInt(targetDrive.round) || (targetDrive.roundDetails ? targetDrive.roundDetails.length : 1);
    } else {
      selectedCompanyJob.drives.forEach(drive => {
        const r = parseInt(drive.rounds) || parseInt(drive.numberOfRounds) || parseInt(drive.round) || (drive.roundDetails ? drive.roundDetails.length : 0);
        if (r > maxRounds) maxRounds = r;
      });
    }

    const options = [];
    const firstDrive = targetDrive || selectedCompanyJob.drives[0];
    const roundDetails = firstDrive.roundDetails || [];

    for (let i = 1; i <= maxRounds; i++) {
      const detailName = roundDetails[i - 1];
      const label = detailName ? `Round ${i} - ${detailName}` : `Round ${i}`;
      const value = `Round ${i}`;

      const hasAttendance = selectedCompanyJob.drives.some(drive => {
        const date = drive.roundDates && drive.roundDates[i - 1] ? drive.roundDates[i - 1] : (drive.startingDate || drive.driveStartDate || drive.companyDriveDate);
        return date && hasExistingAttendance(selectedCompanyJob.companyName, selectedCompanyJob.jobRole, date, i);
      });

      options.push({
        label: label,
        value: value,
        roundNumber: i,
        style: {
          color: hasAttendance ? '#D23B42' : '#555',
          fontWeight: hasAttendance ? '600' : 'bold'
        }
      });
    }

    return options;
  }, [selectedCompanyJob, selectedDrive, startDate, existingAttendances]);

  const startDateDropdownOptions = useMemo(() => {
    const roundNum = parseInt((selectedRound || 'Round 1').replace(/\D/g, '')) || 1;
    return availableDates.map(dateObj => {
      const hasAttendance = selectedCompanyJob && hasExistingAttendance(
        selectedCompanyJob.companyName,
        selectedCompanyJob.jobRole,
        dateObj.date,
        roundNum
      );
      return {
        label: formatDateDisplay(dateObj.date),
        value: dateObj.date,
        style: {
          color: hasAttendance ? '#D23B42' : '#555',
          fontWeight: hasAttendance ? '600' : 'bold'
        }
      };
    });
  }, [availableDates, selectedCompanyJob, existingAttendances, selectedRound]);

  // Load students for a specific drive and round
  const loadStudentsForDrive = async (drive, roundNum = null, providedAttendances = null) => {
    if (!drive) return;
    setIsLoading(true);
    try {
      const targetRound = roundNum !== null ? roundNum : (selectedRound ? parseInt(selectedRound.replace(/\D/g, '')) : 1);

      // Fetch fresh eligible students, student database, AND fresh attendances
      const [eligibleStudentsResponse, allStudentsResponse, attendancesResponse] = await Promise.all([
        mongoDBService.getAllEligibleStudents(),
        mongoDBService.getStudents({ includeArchived: 'true' }),
        providedAttendances ? Promise.resolve(providedAttendances) : (mongoDBService.getAllAttendances ? mongoDBService.getAllAttendances() : mongoDBService.getAllAttendance())
      ]);

      let allEligibleStudents = [];
      if (Array.isArray(eligibleStudentsResponse)) {
        allEligibleStudents = eligibleStudentsResponse;
      } else if (eligibleStudentsResponse?.eligibleStudents) {
        allEligibleStudents = eligibleStudentsResponse.eligibleStudents;
      } else if (eligibleStudentsResponse?.data) {
        allEligibleStudents = eligibleStudentsResponse.data;
      }

      let attList = [];
      if (Array.isArray(attendancesResponse)) {
        attList = attendancesResponse;
      } else if (attendancesResponse?.data) {
        attList = attendancesResponse.data;
      } else if (attendancesResponse?.attendances) {
        attList = attendancesResponse.attendances;
      }
      setExistingAttendances(attList);

      const normalizeDate = (dateStr) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return null;
        return date.toISOString().split('T')[0];
      };

      const driveDateNormalized = normalizeDate(drive.startingDate || drive.driveStartDate || drive.companyDriveDate);
      const driveCompanyLower = (drive.companyName || drive.company || '').toLowerCase().trim();
      const driveIdStr = (drive._id || drive.id) ? String(drive._id || drive.id) : null;

      // Find eligible students record matching this drive
      const matchingEligibleStudents = allEligibleStudents.find(es => {
        const esDriveIdStr = es.driveId ? String(es.driveId) : null;
        if (esDriveIdStr && driveIdStr && esDriveIdStr === driveIdStr) return true;
        const esCompanyLower = (es.companyName || '').toLowerCase().trim();
        const esDateNormalized = normalizeDate(es.driveStartDate || es.companyDriveDate);
        return esCompanyLower === driveCompanyLower && (!driveDateNormalized || !esDateNormalized || esDateNormalized === driveDateNormalized);
      }) || allEligibleStudents.find(es => (es.companyName || '').toLowerCase().trim() === driveCompanyLower);

      if (!matchingEligibleStudents || !matchingEligibleStudents.students || matchingEligibleStudents.students.length === 0) {
        setStudents([]);
        setIsLoading(false);
        return;
      }

      // Check existing attendance for this drive and specific round!
      const targetRoundNum = targetRound;
      const existingAttendance = attList.find(att => {
        const attDriveId = att.driveId ? String(att.driveId) : null;
        const idMatches = attDriveId && driveIdStr && attDriveId === driveIdStr;
        const compMatches = (att.companyName || '').toLowerCase().trim() === driveCompanyLower;
        const roleMatches = !drive.jobRole || !att.jobRole || (att.jobRole || '').toLowerCase().trim() === (drive.jobRole || '').toLowerCase().trim();
        const dateMatches = !driveDateNormalized || normalizeDate(att.startDate) === driveDateNormalized;

        const roundMatches = (att.roundNumber === targetRoundNum ||
          att.round === `Round ${targetRoundNum}` ||
          att.round === String(targetRoundNum) ||
          String(att.roundNumber) === String(targetRoundNum));

        return (idMatches || (compMatches && roleMatches && dateMatches)) && roundMatches;
      }) || attList.find(att => {
        const attDriveId = att.driveId ? String(att.driveId) : null;
        const idMatches = attDriveId && driveIdStr && attDriveId === driveIdStr;
        const compMatches = (att.companyName || '').toLowerCase().trim() === driveCompanyLower;
        const roundMatches = (att.roundNumber === targetRoundNum ||
          att.round === `Round ${targetRoundNum}` ||
          att.round === String(targetRoundNum) ||
          String(att.roundNumber) === String(targetRoundNum));

        return (idMatches || compMatches) && roundMatches;
      });

      const allStudentsList = Array.isArray(allStudentsResponse) ? allStudentsResponse : [];
      const studentMapById = new Map();
      const studentMapByRegNo = new Map();
      allStudentsList.forEach(s => {
        if (s._id) studentMapById.set(String(s._id), s);
        if (s.regNo) studentMapByRegNo.set(String(s.regNo), s);
      });

      const targetBranch = (coordinatorBranch || 'CSE').trim().toUpperCase();

      const resolvedStudents = [];
      matchingEligibleStudents.students.forEach((student) => {
        const resolved = (student.studentId && studentMapById.get(String(student.studentId))) ||
          (student.regNo && studentMapByRegNo.get(String(student.regNo))) ||
          null;

        const studentBranch = (student.branch || resolved?.department || resolved?.branch || '').trim().toUpperCase();
        if (targetBranch && studentBranch && studentBranch !== targetBranch && !studentBranch.includes(targetBranch) && !targetBranch.includes(studentBranch)) {
          return; // Skip students not in coordinator's branch
        }

        let yearSec = '-';
        if (resolved?.currentYear && resolved?.section) {
          yearSec = `${resolved.currentYear}-${resolved.section}`;
        } else if (resolved?.year && resolved?.section) {
          yearSec = `${resolved.year}-${resolved.section}`;
        } else if (student.section) {
          yearSec = `${student.batch || ''}-${student.section}`;
        }

        let semester = '-';
        if (resolved?.semester || resolved?.currentSemester) {
          semester = resolved?.semester || resolved?.currentSemester;
        } else if (resolved?.currentYear || resolved?.year) {
          const year = resolved?.currentYear || resolved?.year;
          const semesterMap = { 'I': '1', 'II': '3', 'III': '5', 'IV': '7', '1': '1', '2': '3', '3': '5', '4': '7' };
          semester = semesterMap[year] || '-';
        }

        // Find attendance status for this student in this specific round
        let status = '-';
        if (existingAttendance && Array.isArray(existingAttendance.students)) {
          const sId = student.studentId ? String(student.studentId).trim() : (resolved?._id ? String(resolved._id).trim() : '');
          const sReg = String(student.regNo || resolved?.regNo || '').trim().toLowerCase();
          const sName = String(student.name || (resolved?.firstName && resolved?.lastName ? `${resolved.firstName} ${resolved.lastName}` : (resolved?.firstName || ''))).trim().toLowerCase();

          const attendanceRecord = existingAttendance.students.find(s => {
            const attSId = s.studentId ? String(s.studentId).trim() : (s._id ? String(s._id).trim() : '');
            const attReg = String(s.regNo || s.registerNo || '').trim().toLowerCase();
            const attName = String(s.name || '').trim().toLowerCase();

            const idMatch = sId && attSId && (sId === attSId);
            const regMatch = sReg && attReg && (sReg === attReg);
            const nameMatch = sName && attName && (sName === attName);

            return idMatch || regMatch || (nameMatch && sReg === attReg);
          });

          if (attendanceRecord && attendanceRecord.status) {
            const st = String(attendanceRecord.status).trim();
            if (st.toLowerCase() === 'present') {
              status = 'Present';
            } else if (st.toLowerCase() === 'absent') {
              status = 'Absent';
            } else {
              status = st.charAt(0).toUpperCase() + st.slice(1);
            }
          }
        }

        resolvedStudents.push({
          sNo: resolvedStudents.length + 1,
          studentId: student.studentId || (resolved?._id ? String(resolved._id) : ''),
          name: student.name || (resolved?.firstName && resolved?.lastName ? `${resolved.firstName} ${resolved.lastName}` : (resolved?.firstName || '-')),
          regNo: student.regNo || resolved?.regNo || '-',
          batch: student.batch || resolved?.batch || '-',
          yearSec: yearSec,
          semester: semester,
          phoneNo: resolved?.mobileNo || resolved?.phoneNo || resolved?.phone || '-',
          branch: studentBranch || targetBranch,
          status: status
        });
      });

      setStudents(resolvedStudents);
    } catch (error) {
      console.error('❌ Error fetching student details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle company/job selection
  const handleCompanyJobSelect = (group) => {
    setSelectedCompanyJob(group);

    // Get available dates for this company/job
    const dates = group.drives
      .filter(drive => drive.startingDate || drive.driveStartDate || drive.companyDriveDate)
      .map(drive => ({
        date: drive.startingDate || drive.driveStartDate || drive.companyDriveDate,
        endDate: drive.endingDate || drive.driveEndDate || drive.startingDate || drive.driveStartDate || drive.companyDriveDate,
        drive: drive
      }));

    setAvailableDates(dates);
    setSelectedRound("Round 1");

    if (dates.length > 0) {
      const firstDateObj = dates[0];
      setSelectedDrive(firstDateObj.drive);
      setStartDate(firstDateObj.date);
      setEndDate(firstDateObj.endDate);
      loadStudentsForDrive(firstDateObj.drive, 1);
    } else {
      setStartDate("");
      setEndDate("");
      setSelectedDrive(null);
      setStudents([]);
    }
  };

  // Handle round selection
  const handleRoundSelect = (roundValue) => {
    setSelectedRound(roundValue);
    const roundNum = parseInt(roundValue.replace(/\D/g, '')) || 1;
    const targetDrive = selectedDrive || (availableDates[0] ? availableDates[0].drive : null);
    if (targetDrive) {
      loadStudentsForDrive(targetDrive, roundNum);
    }
  };

  // Handle start date selection
  const handleStartDateSelect = async (dateObj) => {
    setStartDate(dateObj.date);
    setSelectedDrive(dateObj.drive);
    setEndDate(dateObj.endDate || dateObj.date);

    const roundNum = parseInt((selectedRound || 'Round 1').replace(/\D/g, '')) || 1;
    await loadStudentsForDrive(dateObj.drive, roundNum);
  };

  // Handle prefilled state from navigation (e.g. from Coo_CompanyDrive when attendance icon is clicked)
  useEffect(() => {
    const incoming = location.state?.companyData || location.state?.company || location.state?.selectedDrive || location.state?.filterData;
    if (!incoming || drives.length === 0) return;

    const compName = (incoming.companyName || incoming.company || '').trim();
    const jRole = (incoming.jobRole || incoming.role || '').trim();
    const incomingDriveId = incoming._id || incoming.id || incoming.driveId;

    const matchedGroup = groupedDrivesArray.find(g =>
      (g.companyName || '').toLowerCase().trim() === compName.toLowerCase() &&
      (!jRole || (g.jobRole || '').toLowerCase().trim() === jRole.toLowerCase())
    ) || groupedDrivesArray.find(g => (g.companyName || '').toLowerCase().trim() === compName.toLowerCase()) || groupedDrivesArray[0];

    if (matchedGroup) {
      setSelectedCompanyJob(matchedGroup);
      const dates = matchedGroup.drives
        .filter(drive => drive.startingDate || drive.driveStartDate || drive.companyDriveDate)
        .map(drive => ({
          date: drive.startingDate || drive.driveStartDate || drive.companyDriveDate,
          endDate: drive.endingDate || drive.driveEndDate || drive.startingDate || drive.driveStartDate || drive.companyDriveDate,
          drive: drive
        }));
      setAvailableDates(dates);

      const targetDrive = (incomingDriveId ? matchedGroup.drives.find(d => String(d._id || d.id) === String(incomingDriveId)) : null) || matchedGroup.drives.find(d => {
        const dStart = d.startingDate || d.driveStartDate || d.companyDriveDate;
        const incStart = incoming.startDate || incoming.startingDate || incoming.driveStartDate;
        return incStart && dStart && new Date(dStart).toISOString().split('T')[0] === new Date(incStart).toISOString().split('T')[0];
      }) || matchedGroup.drives[0];

      setSelectedDrive(targetDrive);
      const startD = targetDrive?.startingDate || targetDrive?.driveStartDate || targetDrive?.companyDriveDate || (dates[0] ? dates[0].date : "");
      const endD = targetDrive?.endingDate || targetDrive?.driveEndDate || startD;

      setStartDate(startD);
      setEndDate(endD);
      setSelectedRound("Round 1");

      if (targetDrive) {
        loadStudentsForDrive(targetDrive, 1);
      }
    }
  }, [location.state, groupedDrivesArray, drives]);

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) {
      return students;
    }
    const searchLower = searchTerm.toLowerCase().trim();
    return students.filter(student =>
      (student.name || '').toLowerCase().includes(searchLower) ||
      (student.regNo || '').toLowerCase().includes(searchLower)
    );
  }, [students, searchTerm]);

  // Calculate stats from students
  const stats = useMemo(() => {
    const total = students.length;
    const present = students.filter(s => s.status === 'Present').length;
    const absent = students.filter(s => s.status === 'Absent').length;
    const marked = present + absent;
    const percentage = marked > 0 ? Math.round((present / marked) * 100) : 0;
    return { total, present, absent, percentage };
  }, [students]);

  // Pie chart data
  const pieData = useMemo(() => {
    return students.length === 0
      ? [{ name: 'No Data', value: 1, color: '#e0e0e0' }]
      : [
        { name: 'Present', value: stats.present, color: '#2DBE7F' },
        { name: 'Absent', value: stats.absent, color: '#F04F4F' }
      ];
  }, [students, stats]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // =========================================================================
  // PRINT / EXPORT LOGIC (Excel & PDF)
  // =========================================================================

  const simulateExport = async (operation, exportFunction) => {
    setShowDropdown(false);

    setExportType(operation === 'excel' ? 'Excel' : 'PDF');
    setExportPopupState('progress');
    setExportProgress(0);

    let progressInterval;
    let progressTimeout;

    try {
      progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 100));
      }, 200);

      await new Promise(resolve => {
        progressTimeout = setTimeout(() => {
          clearInterval(progressInterval);
          resolve();
        }, 2000);
      });

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
      const driveTitle = selectedCompanyJob ? `${selectedCompanyJob.companyName} - ${selectedCompanyJob.jobRole}` : 'Drive Attendance';
      const roundTitle = selectedRound || 'Round 1';
      const dateStr = startDate ? formatDateDisplay(startDate) : '';

      const header = ["S.No", "Name", "Register Number", "Batch", "Year-Sec", "Sem", "Phone No", "Status"];
      const data = filteredStudents.map((item, index) => [
        item.sNo || (index + 1),
        item.name || '-',
        item.regNo || '-',
        item.batch || '-',
        item.yearSec || '-',
        item.semester || '-',
        item.phoneNo || '-',
        item.status || '-'
      ]);

      const ws = XLSX.utils.aoa_to_sheet([
        [`Attendance Report - ${driveTitle}`],
        [`Round: ${roundTitle} | Date: ${dateStr} | Branch: ${coordinatorBranch || ''}`],
        [],
        header,
        ...data
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance");
      const filename = `attendance_report_${(selectedCompanyJob?.companyName || 'drive').toLowerCase().replace(/\s+/g, '_')}_${(selectedRound || 'r1').toLowerCase().replace(/\s+/g, '_')}.xlsx`;
      XLSX.writeFile(wb, filename);
      setShowDropdown(false);
    } catch (error) {
      console.error('Export to Excel failed:', error);
      throw error;
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const driveTitle = selectedCompanyJob ? `${selectedCompanyJob.companyName} - ${selectedCompanyJob.jobRole}` : 'Attendance Report';
      const roundTitle = selectedRound || 'Round 1';
      const dateStr = startDate ? formatDateDisplay(startDate) : '';
      const branchStr = coordinatorBranch || '';

      const tableColumn = ["S.No", "Name", "Register Number", "Batch", "Year-Sec", "Sem", "Phone No", "Status"];
      const tableRows = filteredStudents.map((item, index) => [
        item.sNo || (index + 1),
        item.name || '-',
        item.regNo || '-',
        item.batch || '-',
        item.yearSec || '-',
        item.semester || '-',
        item.phoneNo || '-',
        item.status || '-'
      ]);

      doc.setFontSize(16);
      doc.text("Attendance Report", 14, 15);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Drive: ${driveTitle}  |  ${roundTitle}  |  Date: ${dateStr}  |  Branch: ${branchStr}`, 14, 22);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 27,
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
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
          1: { halign: 'left', cellWidth: 38 },
          2: { halign: 'center', cellWidth: 32 },
          3: { halign: 'center', cellWidth: 20 },
          4: { halign: 'center', cellWidth: 20 },
          5: { halign: 'center', cellWidth: 15 },
          6: { halign: 'center', cellWidth: 28 },
          7: { halign: 'center', cellWidth: 20 }
        },
        margin: { top: 25, left: 14, right: 14 },
        didParseCell: function (data) {
          if (data.section === 'body' && data.column.index === 7) {
            const val = data.cell.raw;
            if (val === 'Present') {
              data.cell.styles.textColor = [0, 183, 40];
              data.cell.styles.fontStyle = 'bold';
            } else if (val === 'Absent') {
              data.cell.styles.textColor = [230, 39, 39];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      });

      const filename = `attendance_report_${(selectedCompanyJob?.companyName || 'drive').toLowerCase().replace(/\s+/g, '_')}_${(selectedRound || 'r1').toLowerCase().replace(/\s+/g, '_')}.pdf`;
      doc.save(filename);
      setShowDropdown(false);
    } catch (error) {
      console.error('Export to PDF failed:', error);
      throw error;
    }
  };

  const handleExportToPDF = () => {
    simulateExport('pdf', exportToPDF);
  };

  const handleExportToExcel = () => {
    simulateExport('excel', exportToExcel);
  };

  return (
    <div>
      {/* Navbar JSX */}
      <Navbar onToggleSidebar={toggleSidebar} />

      <div className={styles["co-at-layout-main"]}>
        <Sidebar
          isOpen={isSidebarOpen}
          onLogout={onLogout}
          currentView="attendance"
          onViewChange={onViewChange}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Layout */}
        <div className={styles["co-at-main-content-layout"]}>
          {/* Filter Section (4 Dropdowns matching Admin format) */}
          <div className={styles["co-at-filter-section"]}>
            {/* 1. Select Drive Dropdown (Company : Job Role) */}
            <Dropdown
              options={driveDropdownOptions}
              selectedOption={selectedCompanyJob ? `${selectedCompanyJob.companyName}:${selectedCompanyJob.jobRole}` : ''}
              onSelect={(key) => {
                const group = groupedDrivesArray.find(g => `${g.companyName}:${g.jobRole}` === key);
                if (group) handleCompanyJobSelect(group);
              }}
              placeholder="Select Drive"
              role="coordinator"
              className={styles['attendance-dropdown-wrapper']}
              headerClassName={styles['attendance-dropdown-header']}
            />

            {/* 2. Select Round Dropdown */}
            <Dropdown
              options={roundDropdownOptions}
              selectedOption={selectedRound}
              onSelect={handleRoundSelect}
              placeholder="Select Round"
              disabled={!selectedCompanyJob}
              role="coordinator"
              className={styles['attendance-dropdown-wrapper']}
              headerClassName={styles['attendance-dropdown-header']}
            />

            {/* 3. Start Date Dropdown */}
            <Dropdown
              options={startDateDropdownOptions}
              selectedOption={startDate}
              onSelect={(selectedDate) => {
                const dateObj = availableDates.find(d => d.date === selectedDate);
                if (dateObj) handleStartDateSelect(dateObj);
              }}
              placeholder="Select Start Date"
              disabled={!selectedCompanyJob}
              role="coordinator"
              className={styles['attendance-dropdown-wrapper']}
              headerClassName={styles['attendance-dropdown-header']}
            />

            {/* 4. End Date Dropdown */}
            <Dropdown
              options={endDate ? [formatDateDisplay(endDate)] : []}
              selectedOption={endDate ? formatDateDisplay(endDate) : ''}
              onSelect={() => { }}
              placeholder="Select End Date"
              disabled={!endDate}
              role="coordinator"
              className={styles['attendance-dropdown-wrapper']}
              headerClassName={styles['attendance-dropdown-header']}
            />
          </div>

          {/* Grid and Pie Chart Section */}
          <div className={styles["co-at-summary-pie-layout"]}>
            <div className={styles["co-at-summary-grid"]}>
              <div className={`${styles["co-at-summary-card"]} ${styles["co-at-summary-card-blue"]}`}>
                <div className={styles["co-at-card-label"]}>Total Students</div>
                <div className={styles["co-at-card-value"]}>{stats.total}</div>
              </div>
              <div className={`${styles["co-at-summary-card"]} ${styles["co-at-summary-card-green"]}`}>
                <div className={styles["co-at-card-label"]}>Total Present</div>
                <div className={styles["co-at-card-value"]}>{stats.present}</div>
              </div>
              <div className={`${styles["co-at-summary-card"]} ${styles["co-at-summary-card-darkblue"]}`}>
                <div className={styles["co-at-card-label"]}>Percentage</div>
                <div className={styles["co-at-card-value"]}>{stats.percentage} <span style={{ fontSize: '17px' }}>%</span></div>
              </div>
              <div className={`${styles["co-at-summary-card"]} ${styles["co-at-summary-card-red"]}`}>
                <div className={styles["co-at-card-label"]}>Total Absent</div>
                <div className={styles["co-at-card-value"]}>{stats.absent}</div>
              </div>
            </div>
            <div className={styles["co-at-pie-chart-section"]}>
              <div className={styles["co-at-pie-chart-header"]}>
                <div className={styles["co-at-pie-chart-title"]}>
                  Attendance {selectedRound ? `(${selectedRound})` : ''}
                </div>
                <div className={styles["co-at-pie-chart-date"]}>{startDate ? formatDateDisplay(startDate) : 'dd/mm/yyyy'}</div>
              </div>
              <div className={styles["co-at-pie-chart-content"]}>
                <div className={styles["co-at-pie-chart-wrapper"]}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius="80%"
                        innerRadius={0}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className={styles["co-at-pie-chart-stats"]}>
                  <div
                    className={`${styles["co-at-pie-chart-stat-row"]} ${styles["co-at-pie-chart-stat-present"]}`}
                  >
                    <span className={styles["co-at-pie-chart-stat-label"]}>Present</span>
                    <span className={styles["co-at-pie-chart-stat-value"]}>{stats.present}</span>
                  </div>
                  <div
                    className={`${styles["co-at-pie-chart-stat-row"]} ${styles["co-at-pie-chart-stat-absent"]}`}
                  >
                    <span className={styles["co-at-pie-chart-stat-label"]}>Absent</span>
                    <span className={styles["co-at-pie-chart-stat-value"]}>{stats.absent}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className={styles["co-at-table-section"]}>
            <div className={styles["co-at-table-header-row"]}>
              <div className={styles["co-at-table-header"]}>
                ATTENDANCE DETAILS - {coordinatorBranch || 'Loading...'} {selectedRound ? `(${selectedRound})` : ''}
              </div>
              <div className={styles["co-at-header-actions"]}>
                <div className={styles['co-at-search-wrapper']}>
                  <input
                    type="text"
                    placeholder="Enter Name / Reg No"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles['co-at-search-input']}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className={styles['co-at-search-clear-btn']}
                      onClick={() => setSearchTerm('')}
                      aria-label="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className={styles['co-at-print-btn-container']}>
                  <button
                    type="button"
                    className={styles['co-at-print-btn']}
                    onClick={() => setShowDropdown(!showDropdown)}
                  >
                    Print
                  </button>
                  {showDropdown && (
                    <div className={styles['co-at-dropdown-menu']}>
                      <div className={styles['co-at-dropdown-item']} onClick={handleExportToExcel}>Export to Excel</div>
                      <div className={styles['co-at-dropdown-item']} onClick={handleExportToPDF}>Save as PDF</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className={styles['co-at-table-body-scroll']}>
              <table className={styles['co-at-attendance-table-body']}>
                <thead>
                  <tr>
                    <th style={{ width: '4%', textAlign: 'center', verticalAlign: 'middle' }}>S.No</th>
                    <th style={{ width: '16%', textAlign: 'center', verticalAlign: 'middle' }}>Name</th>
                    <th style={{ width: '15%', textAlign: 'center', verticalAlign: 'middle' }}>Register Number</th>
                    <th style={{ width: '11%', textAlign: 'center', verticalAlign: 'middle' }}>Batch</th>
                    <th style={{ width: '12%', textAlign: 'center', verticalAlign: 'middle' }}>Year-Sec</th>
                    <th style={{ width: '10%', textAlign: 'center', verticalAlign: 'middle' }}>Sem</th>
                    <th style={{ width: '14%', textAlign: 'center', verticalAlign: 'middle' }}>Phone No</th>
                    <th style={{ width: '10%', textAlign: 'center', verticalAlign: 'middle' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr className={styles['co-at-loading-row']}>
                      <td colSpan="8" className={styles['co-at-loading-cell']}>
                        <div className={styles['co-at-loading-wrapper']}>
                          <div className={styles['co-at-spinner']}></div>
                          <span className={styles['co-at-loading-text']}>Loading students...</span>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#F04F4F' }}>
                        {error}
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                        {students.length === 0 ? (!selectedCompanyJob ? 'Select a drive to view attendance' : `No students found for ${coordinatorBranch} branch`) : 'No matching students found'}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, index) => (
                      <tr key={index}>
                        <td style={{ width: '4%', textAlign: 'center', verticalAlign: 'middle' }}>{student.sNo || (index + 1)}</td>
                        <td style={{ width: '16%', fontWeight: '600', textAlign: 'center', verticalAlign: 'middle' }}>{student.name || '-'}</td>
                        <td style={{ width: '15%', textAlign: 'center', verticalAlign: 'middle' }}>{student.regNo || '-'}</td>
                        <td style={{ width: '11%', textAlign: 'center', verticalAlign: 'middle' }}>{student.batch || '-'}</td>
                        <td style={{ width: '12%', textAlign: 'center', verticalAlign: 'middle' }}>{student.yearSec || '-'}</td>
                        <td style={{ width: '10%', textAlign: 'center', verticalAlign: 'middle' }}>{student.semester || '-'}</td>
                        <td style={{ width: '14%', textAlign: 'center', verticalAlign: 'middle' }}>{student.phoneNo || '-'}</td>
                        <td
                          style={{
                            width: '10%',
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            color: student.status === "Present" ? '#00B728' : student.status === "Absent" ? '#E62727' : '#888',
                            fontWeight: 'bold'
                          }}
                        >
                          {student.status || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Export Popup Alerts */}
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
    </div>
  );
}