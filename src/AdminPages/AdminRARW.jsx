import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import useAdminAuth from '../utils/useAdminAuth';
import * as XLSX from 'xlsx'; 
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; 

import Adnavbar from '../components/Navbar/Adnavbar.js';
import Adsidebar from '../components/Sidebar/Adsidebar.js';
import mongoDBService from '../services/mongoDBService.jsx';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

// FIXED: Import CSS as a Module
import styles from './AdminRARW.module.css';

import Adminicon from "../assets/Adminicon.png";

// Eye Icon Component
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4EA24E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

function AdminRARW() {
  useAdminAuth(); // JWT authentication verification
  const navigate = useNavigate();
  
  // Sidebar toggle state for mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drives, setDrives] = useState([]);
  const [students, setStudents] = useState([]);
  
  // Filter states - these will apply immediately when changed
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
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  const [showExportMenu, setShowExportMenu] = useState(false); 
  const [selectedRound, setSelectedRound] = useState(null);
  const [availableRounds, setAvailableRounds] = useState([]);
  const [exportPopupState, setExportPopupState] = useState('none');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('Excel');

  // Toggle Sidebar Function
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Listen for sidebar close event from navigation links
  useEffect(() => {
    const handleCloseSidebar = () => {
      setIsSidebarOpen(false);
    };
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => {
      window.removeEventListener('closeSidebar', handleCloseSidebar);
    };
  }, []);

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('adminId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('authRole');
    localStorage.removeItem('isLoggedIn');
    sessionStorage.clear();
    navigate('/admin-login');
  };

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
          // Use the drives array from the response (original drive documents)
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
          "Job Role": driveReport.jobRole || drive.jobRole || 'N/A',
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

  }, [selectedRound, allData, availableRounds]);

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
          "S.No", "Name", "RegNo", "Branch", "Year-Sec",
          "Email", "Mobile"
      ];
      
      const data = filteredData.map((item) => [
          item["S.No"], item.Name, item.RegNo, item.Branch,
          item["Year-Sec"],
          item.Email, item.Mobile
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
          "S.No", "Name", "RegNo", "Branch", "Year-Sec",
          "Email", "Mobile"
      ];
      
      setExportProgress(60);
      const tableRows = filteredData.map((item) => [
          item["S.No"], item.Name, item.RegNo, item.Branch,
          item["Year-Sec"],
          item.Email, item.Mobile
      ]);
      
      doc.setFontSize(14);
      doc.text("Round Wise Analysis Report", 148, 15, null, null, "center");
      
      setExportProgress(80);
      autoTable(doc, {
          head: [tableColumn], body: tableRows, startY: 20,
          styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak' },
          headStyles: { fillColor: [78, 162, 78], textColor: 255, fontStyle: 'bold' },
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

  return ( 
    <>
      <Adnavbar Adminicon={Adminicon} onToggleSidebar={toggleSidebar} /> 
      {/* UPDATED CLASS: Admin-rarw-layout */}
      <div className={styles['Admin-rarw-layout']}>
        <Adsidebar isOpen={isSidebarOpen} onLogout={handleLogout} />
        {/* UPDATED CLASS: Admin-rarw-main-content */}
        <div className={styles['Admin-rarw-main-content']}>
          {/* UPDATED CLASS: Admin-rarw-filter-box */}
          <div className={styles['Admin-rarw-filter-box']}>
            {/* UPDATED CLASSES: Admin-rarw-tab-container, Admin-rarw-tab-inactive, Admin-rarw-tab-active-green */}
            <div className={styles['Admin-rarw-tab-container']}>
              <div className={styles['Admin-rarw-tab-active-green']}>Round wise <br/> Analysis</div>
              <div className={styles['Admin-rarw-tab-inactive']} onClick={() => navigate('/admin-report-analysis-company')} style={{ cursor: 'pointer' }}>Company wise <br/> Analysis</div>
              <div className={styles['Admin-rarw-tab-inactive']} onClick={() => navigate('/admin-report-analysis-department')} style={{ cursor: 'pointer' }}>Department wise <br/>Analysis</div>
              <div className={styles['Admin-rarw-tab-inactive']} onClick={() => navigate('/admin-report-analysis-student')} style={{ cursor: 'pointer' }}>Student wise<br/> Analysis</div>
            </div>

            {/* UPDATED CLASSES: Admin-rarw-filter-inputs, Admin-rarw-filter-select, Admin-rarw-filter-date-input */}
            <div className={styles['Admin-rarw-filter-inputs']}>
              <div className={styles['Admin-rarw-dropdown-wrapper']}>
                <div 
                  className={styles['Admin-rarw-dropdown-header']} 
                  onClick={() => setIsCompanyOpen(!isCompanyOpen)}
                >
                  <span>{selectedCompany || 'Select Company'}</span>
                  <span className={styles['Admin-rarw-dropdown-arrow']}>{isCompanyOpen ? '▲' : '▼'}</span>
                </div>
                {isCompanyOpen && (
                  <div className={styles['Admin-rarw-dropdown-menu']}>
                    {uniqueCompanies.map((company, index) => (
                      <div
                        key={index}
                        className={styles['Admin-rarw-dropdown-item']}
                        onClick={() => handleCompanySelect(company)}
                      >
                        {company}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles['Admin-rarw-dropdown-wrapper']}>
                <div 
                  className={`${styles['Admin-rarw-dropdown-header']} ${!selectedCompany ? styles['Admin-rarw-dropdown-disabled'] : ''}`}
                  onClick={() => selectedCompany && setIsJobRoleOpen(!isJobRoleOpen)}
                >
                  <span>{selectedJobRole || 'Job Role'}</span>
                  <span className={styles['Admin-rarw-dropdown-arrow']}>{isJobRoleOpen ? '▲' : '▼'}</span>
                </div>
                {isJobRoleOpen && selectedCompany && (
                  <div className={styles['Admin-rarw-dropdown-menu']}>
                    {availableJobRoles.map((jobRole, index) => (
                      <div
                        key={index}
                        className={styles['Admin-rarw-dropdown-item']}
                        onClick={() => handleJobRoleSelect(jobRole)}
                      >
                        {jobRole}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles['Admin-rarw-dropdown-wrapper']}>
                <div 
                  className={`${styles['Admin-rarw-dropdown-header']} ${!selectedCompanyJob ? styles['Admin-rarw-dropdown-disabled'] : ''}`}
                  onClick={() => selectedCompanyJob && setIsStartDateOpen(!isStartDateOpen)}
                >
                  <span>{startDateFilter ? formatDisplayDate(startDateFilter) : 'Start Date'}</span>
                  <span className={styles['Admin-rarw-dropdown-arrow']}>{isStartDateOpen ? '▲' : '▼'}</span>
                </div>
                {isStartDateOpen && selectedCompanyJob && (
                  <div className={styles['Admin-rarw-dropdown-menu']}>
                    {availableDates.map((dateObj, index) => (
                      <div
                        key={index}
                        className={styles['Admin-rarw-dropdown-item']}
                        onClick={() => handleStartDateSelect(dateObj)}
                      >
                        {formatDisplayDate(dateObj.date)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles['Admin-rarw-dropdown-wrapper']}>
                <div 
                  className={`${styles['Admin-rarw-dropdown-header']} ${styles['Admin-rarw-dropdown-disabled']}`}
                  style={{ cursor: 'default', opacity: 0.9 }}
                >
                  <span>{endDateFilter ? formatDisplayDate(endDateFilter) : 'End Date'}</span>
                </div>
              </div>
            </div>
          </div> 

          {/* UPDATED CLASS: Admin-rarw-rounds-container, Admin-rarw-rounds-scroll, Admin-rarw-round-btn, Admin-rarw-round-btn-active, Admin-rarw-round-btn-inactive */}
          {availableRounds.length > 0 && (
            <div className={styles['Admin-rarw-rounds-container']}>
              <div className={styles['Admin-rarw-rounds-scroll']}>
                {availableRounds.map(round => (
                  <button 
                    key={round}
                    className={`${styles['Admin-rarw-round-btn']} ${selectedRound === round ? styles['Admin-rarw-round-btn-active'] : styles['Admin-rarw-round-btn-inactive']}`}
                    onClick={() => handleRoundSelect(round)}
                  >
                    {round}
                  </button>
                ))}
              </div>
            </div>
          )}
        
          {/* UPDATED CLASS: Admin-rarw-table-section */}
          <div className={`${styles['Admin-rarw-table-section']} ${availableRounds.length > 0 ? styles['Admin-rarw-table-section-with-rounds'] : ''}`}>
            {/* UPDATED CLASSES for header row, title, and actions */}
            <div className={styles['Admin-rarw-table-header-row']}>
              <div className={styles['Admin-rarw-table-title']}>ROUND WISE ANALYSIS</div>
              <div className={styles['Admin-rarw-table-actions']}>
                <div className={styles['Admin-rarw-print-button-container']}>
                  <button 
                    className={styles['Admin-rarw-print-btn-green']} 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                  >
                    Print
                  </button>
                  {showExportMenu && (
                    <div className={styles['Admin-rarw-export-menu']}>
                      <button onClick={exportToExcel}>Export to Excel</button>
                      <button onClick={exportToPDF}>Export to PDF</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* UPDATED CLASSES for table structure, headers, body */}
            <div className={styles['Admin-rarw-table-body-scroll']}>
              <table className={styles['Admin-rarw-data-table']}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Name</th>
                    <th>Register Number</th>
                    <th>Branch</th>
                    <th>Year-Sec</th>
                    <th>Mobile</th>
                    <th>Result</th>
                    <th>View</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr className={styles['Admin-rarw-loading-row']}>
                      <td colSpan="8" className={styles['Admin-rarw-loading-cell']}>
                        <div className={styles['Admin-rarw-loading-wrapper']}>
                          <div className={styles['Admin-rarw-spinner']}></div>
                          <span className={styles['Admin-rarw-loading-text']}>Loading students…</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((student, index) => (
                      <tr key={index}>
                        <td>{student["S.No"]}</td>
                        <td>{student.Name}</td>
                        <td>{student.RegNo}</td>
                        <td>{student.Branch}</td>
                        <td>{student["Year-Sec"]}</td>
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
                            navigate(`/admin-profile/${student.studentId}`);
                          }
                        }}>
                          <EyeIcon />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '20px', width: '100%', display: 'block' }}>
                        {selectedCompanyJob ? 'No students found for this round.' : 'Please select a company and drive to view students.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {isSidebarOpen && (
          <div
            className={styles['Admin-rarw-overlay']}
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}
      </div>
      
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
    </>
  );
}

export default AdminRARW;