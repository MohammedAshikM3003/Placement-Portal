import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import mongoDBService from '../services/mongoDBService.jsx';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

import styles from './Coo_ReportAnalysisRW.module.css';
import Adminicon from "../assets/Adminicon.png";

const cx = (...classNames) => classNames.filter(Boolean).join(' ');

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

// Eye Icon Component
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d23b42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

function CoReportAnalysismain({ onLogout, onViewChange }) {
  useCoordinatorAuth(); // JWT authentication verification
  const navigate = useNavigate();
  
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drives, setDrives] = useState([]);
  const [students, setStudents] = useState([]);
  // Filter states
  const [companyFilter, setCompanyFilter] = useState('All Companies');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedJobRole, setSelectedJobRole] = useState(null);
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableEndDates, setAvailableEndDates] = useState([]);
  const [selectedCompanyJob, setSelectedCompanyJob] = useState(null);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isJobRoleOpen, setIsJobRoleOpen] = useState(false);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedRound, setSelectedRound] = useState(null);
  const [availableRounds, setAvailableRounds] = useState([]);
  const [exportPopupState, setExportPopupState] = useState('none');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('Excel');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [coordinatorBranch, setCoordinatorBranch] = useState('');

  const exportMenuRef = useRef(null);

  // Fetch coordinator's branch on mount
  useEffect(() => {
    const coordinatorData = readStoredCoordinatorData();
    const branch = resolveCoordinatorDepartment(coordinatorData);
    
    if (branch) {
      setCoordinatorBranch(branch);
      console.log('Coordinator branch:', branch);
    }
  }, []);

  // Fetch data from MongoDB on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch drives and reports
        const drivesData = await mongoDBService.getCompanyDrives();
        const reportsResponse = await mongoDBService.getAllReports();
        
        // Extract reports data - handle both array and object response
        let reports = [];
        if (Array.isArray(reportsResponse)) {
          reports = reportsResponse;
        } else if (reportsResponse?.drives) {
          reports = reportsResponse.drives;
        } else if (reportsResponse?.data) {
          reports = reportsResponse.data;
        }
        
        console.log('Reports response:', reportsResponse);
        console.log('Extracted reports/drives:', reports.length);
        
        // Filter drives to only show those that have reports saved
        const driveIdsWithReports = new Set(reports.map(r => r.driveId).filter(Boolean));
        const drivesWithReports = (drivesData || []).filter(drive => 
          driveIdsWithReports.has(drive._id)
        );
        
        console.log('All drives:', drivesData?.length);
        console.log('Drives with reports:', drivesWithReports.length);
        console.log('DriveIds with reports:', Array.from(driveIdsWithReports));
        
        setDrives(drivesWithReports);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function to format dates as DD-MM-YYYY
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      let date;
      
      // Handle Date objects
      if (dateString instanceof Date) {
        date = dateString;
      }
      // Handle ISO date strings (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
      else if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
        // Parse ISO date without time zone conversion
        const [year, month, day] = dateString.split('T')[0].split('-');
        return `${day}-${month}-${year}`;
      }
      // Handle DD/MM/YYYY format
      else if (typeof dateString === 'string' && dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length !== 3) return dateString;
        
        let [day, month, year] = parts;
        day = day.padStart(2, '0');
        month = month.padStart(2, '0');
        
        if (year.length === 2) {
          year = '20' + year;
        }
        
        return `${day}-${month}-${year}`;
      }
      else {
        return String(dateString);
      }
      
      // Format Date object
      if (date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      }
      
      return String(dateString);
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return String(dateString);
    }
  };

  // Get unique companies from drives
  const uniqueCompanies = useMemo(() => {
    const companies = new Set();
    drives.forEach(drive => {
      if (drive.companyName) {
        companies.add(drive.companyName);
      }
    });
    return Array.from(companies).sort();
  }, [drives]);

  // Get available job roles for selected company
  const availableJobRoles = useMemo(() => {
    if (!selectedCompany) return [];
    
    const jobRoles = new Set();
    drives.forEach(drive => {
      if (drive.companyName === selectedCompany && drive.jobRole) {
        jobRoles.add(drive.jobRole);
      }
    });
    return Array.from(jobRoles).sort();
  }, [drives, selectedCompany]);

  // Group drives by company + job role (for internal use)
  const groupedDrives = useMemo(() => {
    const groups = {};
    drives.forEach(drive => {
      const key = `${drive.companyName}-${drive.jobRole}`;
      if (!groups[key]) {
        groups[key] = {
          companyName: drive.companyName,
          jobRole: drive.jobRole,
          drives: []
        };
      }
      groups[key].drives.push(drive);
    });
    return Object.values(groups);
  }, [drives]);

  // Handle company selection
  const handleCompanySelect = (companyName) => {
    console.log('Selected company:', companyName);
    setSelectedCompany(companyName);
    setIsCompanyOpen(false);
    
    // Reset dependent fields
    setSelectedJobRole(null);
    setSelectedCompanyJob(null);
    setAvailableDates([]);
    setStartDateFilter(null);
    setEndDateFilter(null);
    setAvailableEndDates([]);
    setAvailableRounds([]);
    setSelectedRound(null);
    setAllData([]);
    setFilteredData([]);
  };

  // Handle job role selection
  const handleJobRoleSelect = (jobRole) => {
    console.log('Selected job role:', jobRole);
    setSelectedJobRole(jobRole);
    setIsJobRoleOpen(false);
    
    // Find the group with this company and job role
    const group = groupedDrives.find(g => 
      g.companyName === selectedCompany && g.jobRole === jobRole
    );
    
    if (!group) {
      console.error('Could not find group for company and job role');
      return;
    }
    
    setSelectedCompanyJob(group);
    
    // Extract unique dates from drives in this group
    const dates = group.drives
      .filter(drive => {
        const hasDate = drive.startingDate || drive.driveStartDate || drive.companyDriveDate;
        console.log('Drive:', drive.companyName, 'has date:', hasDate, drive);
        return hasDate;
      })
      .map(drive => {
        const dateObj = {
          date: drive.startingDate || drive.driveStartDate || drive.companyDriveDate,
          endDate: drive.endingDate || drive.driveEndDate || drive.startingDate || drive.driveStartDate || drive.companyDriveDate,
          drive: drive,
          rounds: drive.rounds || 0
        };
        console.log('Mapped date object:', dateObj);
        return dateObj;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    console.log('Available dates:', dates);
    setAvailableDates(dates);
    setStartDateFilter(null);
    setEndDateFilter(null);
    setCompanyFilter(`${group.companyName} - ${group.jobRole}`);
    setAvailableEndDates([]);
    
    // Don't show rounds yet - wait for start date selection
    setAvailableRounds([]);
    setSelectedRound(null);
    
    // Clear table until dates are selected
    setAllData([]);
    setFilteredData([]);
  };

  // Handle start date selection
  const handleStartDateSelect = (dateObj) => {
    setStartDateFilter(dateObj.date);
    setIsStartDateOpen(false);
    
    // Set end dates based on selected start date (use same or later dates)
    const endDates = availableDates
      .filter(d => new Date(d.date) >= new Date(dateObj.date))
      .map(d => ({
        date: d.endDate || d.date,
        endDate: d.endDate || d.date,
        drive: d.drive,
        rounds: d.rounds
      }));
    
    setAvailableEndDates(endDates);
    
    // Create round buttons based on the selected drive
    if (dateObj.rounds) {
      const numRounds = typeof dateObj.rounds === 'number' ? dateObj.rounds : dateObj.rounds.length;
      if (numRounds > 0) {
        const rounds = Array.from({ length: numRounds }, (_, i) => `Round ${i + 1}`);
        setAvailableRounds(rounds);
        setSelectedRound(rounds[0]);
        console.log('Set rounds after date selection:', rounds);
        console.log('Set initial selectedRound to:', rounds[0]);
      }
    }
    
    // Auto-select end date if only one option
    if (endDates.length === 1) {
      setEndDateFilter(endDates[0].date);
      loadStudentsForDrive(endDates[0].drive);
    } else if (endDates.length > 0) {
      // Auto-select the first end date
      setEndDateFilter(endDates[0].date);
      loadStudentsForDrive(endDates[0].drive);
    } else {
      setEndDateFilter(null);
    }
  };

  // Handle end date selection
  const handleEndDateSelect = (dateObj) => {
    setEndDateFilter(dateObj.date || dateObj.endDate);
    setIsEndDateOpen(false);
    
    // Load students for this drive
    if (dateObj.drive) {
      loadStudentsForDrive(dateObj.drive);
    }
  };

  // Load students for a specific drive
  const loadStudentsForDrive = async (drive) => {
    if (!drive) return;
    
    try {
      setIsLoading(true);
      // Clear existing data to prevent showing stale data
      setAllData([]);
      setFilteredData([]);
      console.log('Loading students for drive:', drive);
      
      // Fetch all reports from MongoDB
      const response = await mongoDBService.getAllReports();
      
      // Extract drive documents from response (not flattened data)
      let driveDocs = [];
      if (response?.drives) {
        // Use the drives array from response (original drive documents with nested rounds)
        driveDocs = response.drives;
      } else if (Array.isArray(response)) {
        driveDocs = response;
      } else if (response?.data && !response?.drives) {
        // Fallback: if no drives array, maybe it's old format
        driveDocs = response.data;
      }
      
      console.log('All drive documents:', driveDocs.length);
      console.log('Looking for driveId:', drive._id);
      
      // Find the report document for this specific drive
      const driveReport = driveDocs.find(report => report.driveId === drive._id);
      
      if (driveReport && driveReport.rounds && driveReport.rounds.length > 0) {
        console.log('Found drive report:', driveReport);
        console.log('Drive has', driveReport.rounds.length, 'rounds');
        
        // Extract all students (both passed and failed) from all rounds
        const allStudents = [];
        driveReport.rounds.forEach((round, index) => {
          console.log(`Round ${round.roundNumber} structure:`, round);
          console.log(`Round ${round.roundNumber}: ${round.passedStudents?.length || 0} passed, ${round.failedStudents?.length || 0} failed students`);
          
          // Add passed students
          if (round.passedStudents && round.passedStudents.length > 0) {
            round.passedStudents.forEach(student => {
              allStudents.push({
                ...student,
                currentRound: round.roundNumber,
                roundName: round.roundName,
                status: 'Passed'
              });
            });
          }
          
          // Add failed students - check multiple possible field names
          const failedStudents = round.failedStudents || round.rejectedStudents || round.notSelectedStudents || [];
          if (failedStudents && failedStudents.length > 0) {
            failedStudents.forEach(student => {
              allStudents.push({
                ...student,
                currentRound: round.roundNumber,
                roundName: round.roundName,
                status: 'Failed'
              });
            });
          }
          
          // Also check if there's an eligibleStudents array and filter out passed ones
          if (round.eligibleStudents && round.eligibleStudents.length > 0) {
            const passedRegNos = new Set(round.passedStudents?.map(s => s.registerNo || s.regNo) || []);
            round.eligibleStudents.forEach(student => {
              const studentRegNo = student.registerNo || student.regNo;
              if (!passedRegNos.has(studentRegNo)) {
                // This student was eligible but didn't pass, so they failed this round
                allStudents.push({
                  ...student,
                  currentRound: round.roundNumber,
                  roundName: round.roundName,
                  status: 'Failed'
                });
              }
            });
          }
        });
        
        console.log('Total students across all rounds:', allStudents.length);
        
        // Transform to table format
        const transformedData = allStudents.map((item, index) => ({
          "S.No": index + 1,
          "Name": item.name || item.studentName || 'N/A',
          "RegNo": item.registerNo || item.regNo || 'N/A',
          "Branch": item.branch || item.department || 'N/A',
          "Year-Sec": item.yearSec || item.section || 'N/A',
          "Sem": item.currentSemester || item.semester || 'N/A',
          "Mobile": item.phone || item.mobile || 'N/A',
          "Result": item.status || 'Passed',
          "currentRound": item.currentRound || 0,
          "status": item.status || 'Passed',
          "studentId": item.studentId || item._id
        }));
        
        console.log('Transformed students:', transformedData.length, 'total records');
        console.log('Current selectedRound:', selectedRound);
        setAllData(transformedData);
        setFilteredData(transformedData);
      } else {
        console.error('No reports data found');
        setAllData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      alert('Failed to load students for this drive');
      setAllData([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // The filtering logic now depends only on the selected round
  useEffect(() => {
    console.log('Filter useEffect triggered - selectedRound:', selectedRound, 'allData.length:', allData.length);
    let currentFilteredData = allData;

    // Filter by coordinator's branch - show only students from this branch
    if (coordinatorBranch) {
      console.log('Filtering for branch:', coordinatorBranch);
      currentFilteredData = currentFilteredData.filter(student => {
        const studentBranch = (student.Branch || '').toString().toUpperCase();
        const matches = studentBranch === coordinatorBranch;
        return matches;
      });
      console.log('After branch filter, data count:', currentFilteredData.length);
    }

    // Filter by selected round - show only students who participated in this specific round
    if (selectedRound && availableRounds.length > 0) {
      const selectedRoundNum = parseInt(selectedRound.split(' ')[1]);
      console.log('Filtering for round number:', selectedRoundNum);
      console.log('Before round filter, data count:', currentFilteredData.length);
      
      // Log actual currentRound values to see what we're working with
      currentFilteredData.forEach((s, idx) => {
        if (idx < 6) {
          console.log(`  Record ${idx}: ${s.Name} (${s.RegNo}) - currentRound: ${s.currentRound}, status: ${s.status}`);
        }
      });
      
      currentFilteredData = currentFilteredData.filter(student => {
        // Show only students whose currentRound matches the selected round
        const studentRound = student.currentRound || 0;
        // For Round 1, show all students in that round
        // For Round 2+, show only those who appear in that specific round (passed from previous)
        const matches = studentRound === selectedRoundNum;
        return matches;
      });
      
      console.log(`Filtered for Round ${selectedRoundNum}:`, currentFilteredData);
      console.log('After round filter, data count:', currentFilteredData.length);
    }

    // Remove duplicates based on RegNo - keep only the first occurrence
    const uniqueStudents = [];
    const seenRegNos = new Set();
    currentFilteredData.forEach(student => {
      if (!seenRegNos.has(student.RegNo)) {
        seenRegNos.add(student.RegNo);
        uniqueStudents.push(student);
      }
    });

    // Sort by RegNo in ascending order
    uniqueStudents.sort((a, b) => {
      const regNoA = String(a.RegNo || '').toLowerCase();
      const regNoB = String(b.RegNo || '').toLowerCase();
      return regNoA.localeCompare(regNoB, undefined, { numeric: true });
    });

    // Recalculate S.No after filtering, deduplication, and sorting
    const reindexedData = uniqueStudents.map((student, index) => ({
      ...student,
      "S.No": index + 1
    }));

    setFilteredData(reindexedData);

  }, [selectedRound, allData, availableRounds, coordinatorBranch]);

  // Handler for round selection
  const handleRoundSelect = (round) => {
    console.log('Round button clicked:', round);
    console.log('Changing from', selectedRound, 'to', round);
    setSelectedRound(round);
  };

  const exportToExcel = async () => {
    try {
      setExportType('Excel');
      setExportPopupState('progress');
      setExportProgress(0);
      setShowExportMenu(false);

      await new Promise(resolve => setTimeout(resolve, 500));
      setExportProgress(30);

      const header = [
          "S.No", "Name", "RegNo", "Year-Sec", "Sem",
          "Mobile", "Result"
      ];
      
      const data = filteredData.map((item) => [
          item["S.No"], item.Name, item.RegNo,
          item["Year-Sec"], item.Sem,
          item.Mobile, item.Result
      ]);
      
      setExportProgress(60);
      const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Round Wise Analysis Report");
      
      setExportProgress(90);
      await new Promise(resolve => setTimeout(resolve, 300));
      XLSX.writeFile(wb, "RoundWiseAnalysis.xlsx");
      
      setExportProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      setExportPopupState('success');
    } catch (error) {
      console.error('Export failed:', error);
      setExportPopupState('failed');
    }
  };
  
  const exportToPDF = async () => {
    try {
      setExportType('PDF');
      setExportPopupState('progress');
      setExportProgress(0);
      setShowExportMenu(false);

      await new Promise(resolve => setTimeout(resolve, 500));
      setExportProgress(30);

      const doc = new jsPDF('landscape'); 
      
      const tableColumn = [
          "S.No", "Name", "RegNo", "Year-Sec", "Sem",
          "Mobile", "Result"
      ];
      
      setExportProgress(60);
      const tableRows = filteredData.map((item) => [
          item["S.No"], item.Name, item.RegNo,
          item["Year-Sec"], item.Sem,
          item.Mobile, item.Result
      ]);
      
      doc.setFontSize(14);
      doc.text("Round Wise Analysis Report", 148, 15, null, null, "center");
      
      setExportProgress(80);
      autoTable(doc, {
          head: [tableColumn], body: tableRows, startY: 20,
          styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak' },
          headStyles: { fillColor: [210, 59, 66], textColor: 255, fontStyle: 'bold' },
          margin: { top: 20, left: 5, right: 5 },
      });
      
      setExportProgress(90);
      await new Promise(resolve => setTimeout(resolve, 300));
      doc.save("RoundWiseAnalysis.pdf");
      
      setExportProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      setExportPopupState('success');
    } catch (error) {
      console.error('Export failed:', error);
      setExportPopupState('failed');
    }
  };

  const getSortableDateString = (dateInput) => {
    if (!dateInput) return null;

    if (dateInput instanceof Date && !isNaN(dateInput)) {
      const y = dateInput.getFullYear();
      const m = String(dateInput.getMonth() + 1).padStart(2, '0');
      const d = String(dateInput.getDate()).padStart(2, '0');
      return `${y}${m}${d}`;
    }

    if (typeof dateInput === 'string' && dateInput.includes('/')) {
      const dateString = dateInput.trim();
      const parts = dateString.split('/');
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      year = year.length === 2 ? `20${year}` : year;
      return `${year}${month}${day}`;
    }

    return null;
  };

  const simulateExport = async (operation, exportFunction) => {
    setShowExportMenu(false);

    setExportPopupState({
      isOpen: true,
      type: 'progress',
      operation,
      progress: 0
    });

    let progressInterval;
    let progressTimeout;

    try {
      progressInterval = setInterval(() => {
        setExportPopupState(prev => {
          if (prev.progress < 100 && prev.type === 'progress') {
            return { ...prev, progress: Math.min(prev.progress + 10, 100) };
          }
          return prev;
        });
      }, 200);

      await new Promise((resolve) => {
        progressTimeout = setTimeout(() => {
          clearInterval(progressInterval);
          resolve();
        }, 2000);
      });

      exportFunction();

      setExportPopupState({
        isOpen: true,
        type: 'success',
        operation,
        progress: 100
      });
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      if (progressTimeout) clearTimeout(progressTimeout);

      setExportPopupState({
        isOpen: true,
        type: 'failed',
        operation,
        progress: 0
      });
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleCardClick = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  return (
    <>
      <Navbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
      <div className={styles["co-layout"]}>
        <Sidebar
          isOpen={isSidebarOpen}
          onLogout={onLogout}
          currentView="report-analysis"
          onViewChange={onViewChange}
        />
        <div className={styles["co-main-content"]}>
          <div className={styles["co-ram-filter-box"]}>
            <div className={styles["co-ram-tab-container"]}>
              <div className={styles["co-ram-tab-active"]}>Round&nbsp;wise<br />Analysis</div>
              <div
                className={styles["co-ram-tab-inactive"]}
                onClick={() => handleCardClick('report-analysis-cw')}
              >
                Company&nbsp;wise<br />Analysis
              </div>
              <div
                className={styles["co-ram-tab-inactive"]}
                onClick={() => handleCardClick('report-analysis-sw')}
              >
                Student&nbsp;wise<br />Analysis
              </div>
            </div>

            <div className={styles["co-ram-filter-inputs"]}>
              <div className={styles["co-ram-dropdown-wrapper"]}>
                <div 
                  className={styles["co-ram-dropdown-header"]} 
                  onClick={() => setIsCompanyOpen(!isCompanyOpen)}
                >
                  <span>{selectedCompany || 'All Companies'}</span>
                  <span className={styles["co-ram-dropdown-arrow"]}>{isCompanyOpen ? '▲' : '▼'}</span>
                </div>
                {isCompanyOpen && (
                  <div className={styles["co-ram-dropdown-menu"]}>
                    {uniqueCompanies.map((company, index) => (
                      <div
                        key={index}
                        className={styles["co-ram-dropdown-item"]}
                        onClick={() => handleCompanySelect(company)}
                      >
                        {company}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles["co-ram-dropdown-wrapper"]}>
                <div 
                  className={`${styles["co-ram-dropdown-header"]} ${!selectedCompany ? styles["co-ram-dropdown-disabled"] : ''}`}
                  onClick={() => selectedCompany && setIsJobRoleOpen(!isJobRoleOpen)}
                >
                  <span>{selectedJobRole || 'Job Role'}</span>
                  <span className={styles["co-ram-dropdown-arrow"]}>{isJobRoleOpen ? '▲' : '▼'}</span>
                </div>
                {isJobRoleOpen && selectedCompany && (
                  <div className={styles["co-ram-dropdown-menu"]}>
                    {availableJobRoles.map((jobRole, index) => (
                      <div
                        key={index}
                        className={styles["co-ram-dropdown-item"]}
                        onClick={() => handleJobRoleSelect(jobRole)}
                      >
                        {jobRole}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles["co-ram-dropdown-wrapper"]}>
                <div 
                  className={`${styles["co-ram-dropdown-header"]} ${!selectedCompanyJob ? styles["co-ram-dropdown-disabled"] : ''}`}
                  onClick={() => selectedCompanyJob && setIsStartDateOpen(!isStartDateOpen)}
                >
                  <span>{startDateFilter ? formatDisplayDate(startDateFilter) : 'Start Date'}</span>
                  <span className={styles["co-ram-dropdown-arrow"]}>{isStartDateOpen ? '▲' : '▼'}</span>
                </div>
                {isStartDateOpen && selectedCompanyJob && (
                  <div className={styles["co-ram-dropdown-menu"]}>
                    {availableDates.map((dateObj, index) => (
                      <div
                        key={index}
                        className={styles["co-ram-dropdown-item"]}
                        onClick={() => handleStartDateSelect(dateObj)}
                      >
                        {formatDisplayDate(dateObj.date)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles["co-ram-dropdown-wrapper"]}>
                <div 
                  className={`${styles["co-ram-dropdown-header"]} ${styles["co-ram-dropdown-disabled"]}`}
                  style={{ cursor: 'default', opacity: 0.9 }}
                >
                  <span>{endDateFilter ? formatDisplayDate(endDateFilter) : 'End Date'}</span>
                </div>
              </div>
            </div>
          </div>

          {availableRounds.length > 0 && (
            <div className={styles["co-ram-rounds-container"]}>
              <div className={styles["co-ram-rounds-scroll"]}>
                {availableRounds.map(round => (
                  <button 
                    key={round}
                    className={`${styles["co-ram-round-button"]} ${selectedRound === round ? styles["co-ram-round-button-active"] : styles["co-ram-round-button-inactive"]}`}
                    onClick={() => handleRoundSelect(round)}
                  >
                    {round}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={`${styles["co-ram-table-section"]} ${availableRounds.length > 0 ? styles["co-ram-table-section-with-rounds"] : ''}`}>
            <div className={styles["co-ram-table-header-row"]}>
              <div className={styles["co-ram-table-title"]}>ROUND WISE ANALYSIS</div>
              <div className={styles["co-ram-table-actions"]}>
                <div className={styles["co-ram-print-button-container"]}>
                  <button 
                    className={styles["co-ram-print-btn"]} 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                  >
                    Print
                  </button>
                  {showExportMenu && (
                    <div className={styles["co-ram-export-menu"]}>
                      <button onClick={exportToExcel}>Export to Excel</button>
                      <button onClick={exportToPDF}>Export to PDF</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles["co-ram-table-body-scroll"]}>
              <table className={styles["co-ram-data-table"]}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Name</th>
                    <th>Register Number</th>
                    <th>Year-Sec</th>
                    <th>Sem</th>
                    <th>Mobile</th>
                    <th>Result</th>
                    <th>View</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr className={styles["co-ram-loading-row"]}>
                      <td colSpan="8" className={styles["co-ram-loading-cell"]}>
                        <div className={styles["co-ram-loading-wrapper"]}>
                          <div className={styles["co-ram-spinner"]}></div>
                          <span className={styles["co-ram-loading-text"]}>Loading students…</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((student, index) => (
                      <tr key={index}>
                        <td>{student["S.No"]}</td>
                        <td>{student.Name}</td>
                        <td>{student.RegNo}</td>
                        <td>{student["Year-Sec"]}</td>
                        <td>{student.Sem}</td>
                        <td>{student.Mobile}</td>
                        <td>
                          <span style={{
                            color: student.Result === 'Passed' ? '#16C098' : '#AD2C2C',
                            fontWeight: '600',
                            display: 'inline-block'
                          }}>
                            {student.Result}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', padding: '8px', cursor: 'pointer' }} onClick={() => {
                          if (student.studentId) {
                            navigate(`/coo-profile/${student.studentId}`);
                          }
                        }}>
                          <EyeIcon />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '20px', width: '100%', display: 'block' }}>
                        {selectedCompanyJob ? `No ${coordinatorBranch || ''} students found for this round.` : 'Please select a company and drive to view students.'}
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
        color='#d23b42'
        progressColor='#d23b42'
      />
      
      <ExportSuccessAlert 
        isOpen={exportPopupState === 'success'} 
        onClose={() => setExportPopupState('none')}
        exportType={exportType}
        color='#d23b42'
      />
      
      <ExportFailedAlert 
        isOpen={exportPopupState === 'failed'} 
        onClose={() => setExportPopupState('none')}
        exportType={exportType}
        color='#d23b42'
      />
    </>
  );
}

export default CoReportAnalysismain;