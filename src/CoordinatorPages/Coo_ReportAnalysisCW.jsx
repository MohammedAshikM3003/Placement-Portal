import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from "react-router-dom";
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import * as XLSX from 'xlsx'; 
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; 

// Import New Components
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import mongoDBService from '../services/mongoDBService.jsx';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

// Import CSS Files
import styles from './Coo_ReportAnalysisCW.module.css'; 

// Import necessary assets for the Navbar (Adminicon)
import Adminicon from "../assets/Adminicon.png";

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

function  ReportAnalysisCW({ onLogout, onViewChange }) {
  useCoordinatorAuth(); // JWT authentication verification
  
  const navigate = useNavigate();
  
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drives, setDrives] = useState([]);
  const [coordinatorBranch, setCoordinatorBranch] = useState('');
  
  // Filter states - these will apply immediately when changed
  const [companyFilter, setCompanyFilter] = useState('All Companies');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedJobRole, setSelectedJobRole] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [availableEndDates, setAvailableEndDates] = useState([]);
  const [selectedCompanyJob, setSelectedCompanyJob] = useState(null);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isJobRoleOpen, setIsJobRoleOpen] = useState(false);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportPopupState, setExportPopupState] = useState('none');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('Excel');

  // Format date for display
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
      } else {
        return String(dateString);
      }
      // Format Date object
      if (date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear());
        return `${day}-${month}-${year}`;
      }
      return String(dateString);
    } catch (error) {
      console.error('Date formatting error:', error);
      return String(dateString);
    }
  };

  // Helper function to calculate year as Roman numeral from batch
  const calculateYearRoman = (batch) => {
    if (!batch) return '';
    
    // Extract start year from batch format "2023-2027"
    const startYear = parseInt(batch.split('-')[0]);
    const currentYear = new Date().getFullYear();
    const yearDifference = currentYear - startYear;
    
    // Calculate which year they're in (1st, 2nd, 3rd, or 4th)
    const yearNumber = Math.min(Math.max(yearDifference + 1, 1), 4);
    
    // Convert to Roman numerals
    const romanNumerals = ['I', 'II', 'III', 'IV'];
    return romanNumerals[yearNumber - 1] || 'I';
  };

  // Helper function to calculate semester from batch
  const calculateSemester = (batch) => {
    if (!batch) return '';
    
    const startYear = parseInt(batch.split('-')[0]);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12
    
    let yearDiff = currentYear - startYear;
    
    // If we're in Jan-June, it's an even semester (2, 4, 6, 8)
    // If we're in July-Dec, it's an odd semester (1, 3, 5, 7)
    let semester;
    if (currentMonth >= 7) {
      // July-Dec: odd semester
      semester = yearDiff * 2 + 1;
    } else {
      // Jan-June: even semester
      semester = yearDiff * 2;
    }
    
    // Clamp between 1 and 8
    semester = Math.min(Math.max(semester, 1), 8);
    
    return semester.toString();
  };

  // Handle card click
  const handleCardClick = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  // Load students for a specific company and date
  const loadStudentsForCompany = async (companyName, startDate) => {
    try {
      setIsLoading(true);
      setAllData([]);
      setFilteredData([]);
      
      console.log('[CoordinatorRACW] Loading students for company:', companyName, 'Start Date:', startDate);
      
      // Find the drive from selectedCompanyJob
      const drive = selectedCompanyJob?.drives?.find(d => 
        d.startingDate === startDate || d.driveStartDate === startDate || d.companyDriveDate === startDate
      );
      
      if (!drive) {
        console.error('[CoordinatorRACW] Could not find drive for selected date');
        alert('Could not find drive data');
        return;
      }
      
      console.log('[CoordinatorRACW] Selected drive:', drive);
      
      // Fetch all reports from MongoDB
      const response = await mongoDBService.getAllReports();
      
      // Extract drive documents from response (not flattened data)
      let driveDocs = [];
      if (response?.drives) {
        driveDocs = response.drives;
      } else if (Array.isArray(response)) {
        driveDocs = response;
      } else if (response?.data && !response?.drives) {
        driveDocs = response.data;
      }
      
      console.log('[CoordinatorRACW] All drive documents:', driveDocs.length);
      console.log('[CoordinatorRACW] Looking for driveId:', drive._id);
      
      // Find the report document for this specific drive
      const driveReport = driveDocs.find(report => report.driveId === drive._id);
      
      if (driveReport && driveReport.rounds && driveReport.rounds.length > 0) {
        console.log('[CoordinatorRACW] Found drive report:', driveReport);
        console.log('[CoordinatorRACW] Drive has', driveReport.rounds.length, 'rounds');
        
        // Collect all students across all rounds with their max round reached
        const studentMap = new Map();
        
        driveReport.rounds.forEach((round) => {
          console.log(`[CoordinatorRACW] Round ${round.roundNumber}: ${round.passedStudents?.length || 0} passed, ${round.failedStudents?.length || 0} failed`);
          
          // Add passed students
          if (round.passedStudents && round.passedStudents.length > 0) {
            round.passedStudents.forEach(student => {
              const regNo = student.registerNo || student.regNo || '';
              if (!regNo) return;
              
              const existing = studentMap.get(regNo);
              if (!existing || round.roundNumber > existing.maxRoundReached) {
                studentMap.set(regNo, {
                  ...student,
                  maxRoundReached: round.roundNumber,
                  status: 'Passed',
                  lastRoundName: round.roundName
                });
              }
            });
          }
          
          // Add failed students (only if not already passed in a later round)
          if (round.failedStudents && round.failedStudents.length > 0) {
            round.failedStudents.forEach(student => {
              const regNo = student.registerNo || student.regNo || '';
              if (!regNo) return;
              
              const existing = studentMap.get(regNo);
              if (!existing || (round.roundNumber > existing.maxRoundReached && existing.status !== 'Passed')) {
                studentMap.set(regNo, {
                  ...student,
                  maxRoundReached: round.roundNumber,
                  status: 'Failed',
                  lastRoundName: round.roundName
                });
              }
            });
          }
        });
        
        console.log('[CoordinatorRACW] Total unique students:', studentMap.size);
        
        // Transform to table format
        const tableData = Array.from(studentMap.values()).map((student, index) => ({
          "So No": index + 1,
          "Student Name": student.name || student.studentName || '',
          "Register No.": student.registerNo || student.regNo || '',
          "Department": student.branch || student.department || 'N/A',
          "Section": student.section || 'A',
          "Batch": student.batch || '',
          "Company": driveReport.companyName || companyName,
          "Job Role": driveReport.jobRole || '',
          "Package": drive.package || 'N/A',
          "Rounds": `Round ${student.maxRoundReached}`,
          "Mobile No.": student.mobile || student.phone || '',
          "Result": student.status || 'Failed',
          "Status": student.status || 'Failed',
          "Start Date": driveReport.startingDate || startDate,
          "End Date": driveReport.endingDate || driveReport.startingDate || startDate,
          "studentId": student.studentId || student._id
        }));
        
        console.log('[CoordinatorRACW] Formatted table data:', tableData.length, 'records');
        setAllData(tableData);
        
        // Auto-set end date
        if (driveReport.endingDate) {
          setEndDate(driveReport.endingDate);
        }
      } else {
        console.error('[CoordinatorRACW] No reports data found for this drive');
        alert('No report data found for this company drive');
        setAllData([]);
      }
    } catch (error) {
      console.error('[CoordinatorRACW] Error loading students:', error);
      alert('Failed to load students: ' + error.message);
      setAllData([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
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

  // Group drives by company name and job role
  const groupedDrives = useMemo(() => {
    const groups = {};
    drives.forEach(drive => {
      const key = `${drive.companyName}_${drive.jobRole}`;
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
    setStartDate(null);
    setEndDate(null);
    setAvailableEndDates([]);
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
      .filter(drive => drive.startingDate || drive.driveStartDate || drive.companyDriveDate)
      .map(drive => ({
        date: drive.startingDate || drive.driveStartDate || drive.companyDriveDate,
        endDate: drive.endingDate || drive.driveEndDate || drive.startingDate || drive.driveStartDate || drive.companyDriveDate,
        drive: drive
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    setAvailableDates(dates);
    setStartDate(null);
    setEndDate(null);
    setCompanyFilter(`${group.companyName} - ${group.jobRole}`);
    setAvailableEndDates([]);
    
    // Clear table until dates are selected
    setAllData([]);
    setFilteredData([]);
  };

  // Handle start date selection
  const handleStartDateSelect = async (dateObj) => {
    setStartDate(dateObj.date);
    setIsStartDateOpen(false);
    
    // Automatically set the end date from the selected drive
    if (dateObj.endDate) {
      setEndDate(dateObj.endDate);
    }
    
    // Load students immediately when start date is selected
    if (selectedCompanyJob && dateObj.date) {
      await loadStudentsForCompany(selectedCompanyJob.companyName, dateObj.date);
    }
  };

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
          // Use the drives array from the response (original drive documents)
          reports = reportsResponse.drives;
        } else if (reportsResponse?.data) {
          reports = reportsResponse.data;
        }
        
        console.log('[CoordinatorRACW] Fetched drives:', drivesData.length, 'reports:', reports.length);
        setDrives(drivesData);
        
      } catch (error) {
        console.error('[CoordinatorRACW] Error fetching data:', error);
        alert('Failed to fetch company drives: ' + error.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Apply filters to all data when filters change
  useEffect(() => {
    if (allData.length === 0) {
      setFilteredData([]);
      return;
    }
    
    let filtered = [...allData];
    
    // Filter by coordinator's branch - show only students from this branch
    if (coordinatorBranch) {
      console.log('Filtering for branch:', coordinatorBranch);
      filtered = filtered.filter(student => {
        const studentBranch = (student.Department || '').toString().toUpperCase();
        const matches = studentBranch === coordinatorBranch;
        return matches;
      });
      console.log('After branch filter, data count:', filtered.length);
    }
    
    setFilteredData(filtered);
  }, [allData, coordinatorBranch]);

  // Export to Excel function
  const exportToExcel = async () => {
    try {
      setExportType('Excel');
      setExportPopupState('progress');
      setExportProgress(0);
      setShowExportMenu(false);

      await new Promise(resolve => setTimeout(resolve, 500));
      setExportProgress(30);
      
      const header = [
          "S.No", "Name", "Register Number", "Year-Sec", "Sem", "Mobile", "Reached"
      ];
      
      const data = filteredData.map((item) => [
          item["So No"], 
          item["Student Name"], 
          item["Register No."], 
          `${calculateYearRoman(item.Batch)} - ${item.Section}`,
          calculateSemester(item.Batch),
          item["Mobile No."], 
          item.Rounds || 'N/A'
      ]);
      
      setExportProgress(60);
      const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Company Wise Analysis");
      
      setExportProgress(90);
      await new Promise(resolve => setTimeout(resolve, 300));
      XLSX.writeFile(wb, "CompanyWiseAnalysis.xlsx");
      
      setExportProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      setExportPopupState('success');
    } catch (error) {
      console.error('Export failed:', error);
      setExportPopupState('failed');
    }
  };
  
  // Export to PDF function
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
          "S.No", "Name", "Register Number", "Year-Sec", "Sem", "Mobile", "Reached"
      ];
      
      setExportProgress(60);
      const tableRows = filteredData.map((item) => [
          item["So No"], 
          item["Student Name"], 
          item["Register No."], 
          `${calculateYearRoman(item.Batch)} - ${item.Section}`,
          calculateSemester(item.Batch),
          item["Mobile No."], 
          item.Rounds || 'N/A'
      ]);
      
      doc.setFontSize(14);
      doc.text("Company Wise Analysis", 148, 15, null, null, "center");
      
      setExportProgress(80);
      autoTable(doc, {
          head: [tableColumn], 
          body: tableRows, 
          startY: 20,
          styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak' },
          headStyles: { fillColor: [210, 59, 66], textColor: 255, fontStyle: 'bold' },
          margin: { top: 20, left: 5, right: 5 },
      });
      
      setExportProgress(90);
      await new Promise(resolve => setTimeout(resolve, 300));
      doc.save("CompanyWiseAnalysis.pdf");
      
      setExportProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      setExportPopupState('success');
    } catch (error) {
      console.error('Export failed:', error);
      setExportPopupState('failed');
    }
  };

  // Effect to handle clicks outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showExportMenu &&
        !event.target.closest(`.${styles["co-ras-print-button-container"]}`)
      ) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showExportMenu]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
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
          <div className={styles["co-ras-filter-box"]}>
            <div className={styles["co-ras-tab-container"]}>
              {/* Note: The 'Round wise' tab label is kept but its functionality is now removed */}
              <div className={styles["co-ras-tab-inactive"]} onClick={() => handleCardClick('report-analysis-rw')}>Round&nbsp;wise<br /> Analysis</div>
              <div className={styles["co-ras-tab-active"]}>Company&nbsp;wise<br />Analysis</div>
              <div className={styles["co-ras-tab-inactive"]} onClick={() => handleCardClick('report-analysis-sw')}>Student&nbsp;wise<br /> Analysis</div>
            </div>

            <div className={styles["co-ras-filter-inputs"]}>
              <div className={styles["co-ras-dropdown-wrapper"]}>
                <div 
                  className={styles["co-ras-dropdown-header"]} 
                  onClick={() => setIsCompanyOpen(!isCompanyOpen)}
                >
                  <span>{selectedCompany || 'Select Company'}</span>
                  <span className={styles["co-ras-dropdown-arrow"]}>{isCompanyOpen ? '▲' : '▼'}</span>
                </div>
                {isCompanyOpen && (
                  <div className={styles["co-ras-dropdown-menu"]}>
                    {uniqueCompanies.map((company, index) => (
                      <div
                        key={index}
                        className={styles["co-ras-dropdown-item"]}
                        onClick={() => handleCompanySelect(company)}
                      >
                        {company}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles["co-ras-dropdown-wrapper"]}>
                <div 
                  className={`${styles["co-ras-dropdown-header"]} ${!selectedCompany ? styles["co-ras-dropdown-disabled"] : ''}`}
                  onClick={() => selectedCompany && setIsJobRoleOpen(!isJobRoleOpen)}
                >
                  <span>{selectedJobRole || 'Job Role'}</span>
                  <span className={styles["co-ras-dropdown-arrow"]}>{isJobRoleOpen ? '▲' : '▼'}</span>
                </div>
                {isJobRoleOpen && selectedCompany && (
                  <div className={styles["co-ras-dropdown-menu"]}>
                    {availableJobRoles.map((jobRole, index) => (
                      <div
                        key={index}
                        className={styles["co-ras-dropdown-item"]}
                        onClick={() => handleJobRoleSelect(jobRole)}
                      >
                        {jobRole}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles["co-ras-dropdown-wrapper"]}>
                <div 
                  className={`${styles["co-ras-dropdown-header"]} ${!selectedCompanyJob ? styles["co-ras-dropdown-disabled"] : ''}`}
                  onClick={() => selectedCompanyJob && setIsStartDateOpen(!isStartDateOpen)}
                >
                  <span>{startDate ? formatDisplayDate(startDate) : 'Start Date'}</span>
                  <span className={styles["co-ras-dropdown-arrow"]}>{isStartDateOpen ? '▲' : '▼'}</span>
                </div>
                {isStartDateOpen && selectedCompanyJob && (
                  <div className={styles["co-ras-dropdown-menu"]}>
                    {availableDates.map((dateObj, index) => (
                      <div
                        key={index}
                        className={styles["co-ras-dropdown-item"]}
                        onClick={() => handleStartDateSelect(dateObj)}
                      >
                        {formatDisplayDate(dateObj.date)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* End Date - Auto-populated from selected drive */}
              <div className={styles["co-ras-dropdown-wrapper"]}>
                <div 
                  className={`${styles["co-ras-dropdown-header"]} ${styles["co-ras-dropdown-disabled"]}`}
                  title="End date is automatically set based on the selected drive"
                >
                  <span>{endDate ? formatDisplayDate(endDate) : 'End Date'}</span>
                  <span className={styles["co-ras-dropdown-arrow"]}>✓</span>
                </div>
              </div>
            </div>
          </div>

        {/* 🗑️ REMOVED: co-ras-round-buttons-container block is removed */}

        <div className={styles["co-ras-table-section"]}>
            <div className={styles["co-ras-table-header-row"]}>
              <div className={styles["co-ras-table-title"]}>COMPANY WISE ANALYSIS</div>
              <div className={styles["co-ras-table-actions"]}>
                <div className={styles["co-ras-print-button-container"]}>
                  <button 
                    className={styles["co-ras-print-btn"]} 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                  >
                    Print
                  </button>
                  {showExportMenu && (
                    <div className={styles["co-ras-export-menu"]}>
                      <button onClick={exportToExcel}>Export to Excel</button>
                      <button onClick={exportToPDF}>Export to PDF</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles["co-ras-table-body-scroll"]}>
              <table className={styles["co-ras-data-table"]}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Name</th>
                    <th>Register Number</th>
                    <th>Year-Sec</th>
                    <th>Sem</th>
                    <th>Mobile</th>
                    <th>Reached</th>
                    <th>View</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr className={styles["co-ras-loading-row"]}>
                      <td colSpan="8" className={styles["co-ras-loading-cell"]}>
                        <div className={styles["co-ras-loading-wrapper"]}>
                          <div className={styles["co-ras-spinner"]}></div>
                          <span className={styles["co-ras-loading-text"]}>Loading students…</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((student, index) => (
                      <tr key={index}>
                        <td>{student["So No"]}</td>
                        <td>{student["Student Name"]}</td>
                        <td>{student["Register No."]}</td>
                        <td>{calculateYearRoman(student.Batch)} - {student.Section}</td>
                        <td>{calculateSemester(student.Batch)}</td>
                        <td>{student["Mobile No."]}</td>
                        <td>
                          <span style={{
                            color: '#30334e',
                            fontWeight: '600',
                            display: 'inline-block'
                          }}>
                            {student.Rounds || 'N/A'}
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
                  )}

                  {!isLoading && filteredData.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '20px', width: '100%', display: 'block' }}>
                        {!selectedCompanyJob ? (
                          'Please select company & job role'
                        ) : !startDate ? (
                          'Please select start date of the company drive'
                        ) : (
                          'No students found for this company drive'
                        )}
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

export default ReportAnalysisCW;






