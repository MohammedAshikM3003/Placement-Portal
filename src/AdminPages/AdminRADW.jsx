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
import styles from './AdminRADW.module.css';

import Adminicon from "../assets/Adminicon.png";

// Eye Icon Component
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4EA24E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

function AdminRADW() {

  useAdminAuth(); // JWT authentication verification
  const navigate = useNavigate();
  
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drives, setDrives] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  
  // Filter states
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedJobRole, setSelectedJobRole] = useState(null);
  const [selectedCompanyJob, setSelectedCompanyJob] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('Select Branch');
  
  const [availableDates, setAvailableDates] = useState([]);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isJobRoleOpen, setIsJobRoleOpen] = useState(false);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);

  const [showExportMenu, setShowExportMenu] = useState(false);

  // Export popup states
  const [exportPopupState, setExportPopupState] = useState('none');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('Excel');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Listen for sidebar close event from navigation links (mobile auto-close)
  useEffect(() => {
    const handleCloseSidebar = () => {
      setIsSidebarOpen(false);
    };
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => {
      window.removeEventListener('closeSidebar', handleCloseSidebar);
    };
  }, []);

  // Load students for selected company and date
  const loadStudentsForDepartment = async (companyName, startDate, branch = null) => {
    if (!companyName || !startDate) {
      console.log('[AdminRADW] Missing company name or start date');
      return;
    }
    
    try {
      setIsLoading(true);
      setAllData([]);
      setFilteredData([]);
      
      console.log('[AdminRADW] Loading students for company:', companyName, 'Start Date:', startDate, 'Branch:', branch);
      
      // Find the drive from selectedCompanyJob
      const drive = selectedCompanyJob?.drives?.find(d => 
        d.startingDate === startDate || d.driveStartDate === startDate || d.companyDriveDate === startDate
      );
      
      if (!drive) {
        console.error('[AdminRADW] Could not find drive for selected date');
        alert('Could not find drive data');
        return;
      }
      
      // Fetch all reports from MongoDB
      const response = await mongoDBService.getAllReports();
      
      // Extract drive documents from response
      let driveDocs = [];
      if (response?.drives) {
        driveDocs = response.drives;
      } else if (Array.isArray(response)) {
        driveDocs = response;
      } else if (response?.data && !response?.drives) {
        driveDocs = response.data;
      }
      
      console.log('[AdminRADW] All drive documents:', driveDocs.length);
      console.log('[AdminRADW] Looking for driveId:', drive._id);
      
      // Find the report document for this specific drive
      const driveReport = driveDocs.find(report => report.driveId === drive._id);
      
      if (driveReport && driveReport.rounds && driveReport.rounds.length > 0) {
        console.log('[AdminRADW] Found drive report with', driveReport.rounds.length, 'rounds');
        
        // Collect all students across all rounds with their max round reached
        const studentMap = new Map();
        
        driveReport.rounds.forEach((round) => {
          // Add passed students
          if (round.passedStudents && round.passedStudents.length > 0) {
            round.passedStudents.forEach(student => {
              const regNo = student.registerNo || student.regNo || '';
              if (!regNo) return;
              
              const existing = studentMap.get(regNo);
              if (!existing || round.roundNumber > existing.roundNumber) {
                studentMap.set(regNo, {
                  name: student.name || student.studentName || '',
                  regNo: regNo,
                  branch: student.branch || student.department || 'N/A',
                  section: student.section || 'A',
                  batch: student.batch || '',
                  companyName: driveReport.companyName || companyName,
                  jobRole: driveReport.jobRole || '',
                  package: drive.package || 'N/A',
                  roundNumber: round.roundNumber,
                  email: student.email || student.studentEmail || '',
                  mobile: student.mobile || student.phone || '',
                  status: 'Passed',
                  startDate: driveReport.startingDate || startDate,
                  endDate: driveReport.endingDate || driveReport.startingDate || startDate,
                  studentId: student.studentId || student._id
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
              if (!existing || (round.roundNumber > existing.roundNumber && existing.status !== 'Passed')) {
                studentMap.set(regNo, {
                  name: student.name || student.studentName || '',
                  regNo: regNo,
                  branch: student.branch || student.department || 'N/A',
                  section: student.section || 'A',
                  batch: student.batch || '',
                  companyName: driveReport.companyName || companyName,
                  jobRole: driveReport.jobRole || '',
                  package: drive.package || 'N/A',
                  roundNumber: round.roundNumber,
                  email: student.email || student.studentEmail || '',
                  mobile: student.mobile || student.phone || '',
                  status: 'Failed',
                  startDate: driveReport.startingDate || startDate,
                  endDate: driveReport.endingDate || driveReport.startingDate || startDate,
                  studentId: student.studentId || student._id
                });
              }
            });
          }
        });
        
        // Extract unique branches from the data
        const allBranches = Array.from(studentMap.values()).map(s => s.branch).filter(Boolean);
        const branches = ['Select Branch', ...new Set(allBranches)];
        setAvailableBranches(branches);
        
        // Transform consolidated data for table display
        const tableData = Array.from(studentMap.values()).map((student, index) => ({
          "So No": index + 1,
          "Student Name": student.name,
          "Register No.": student.regNo,
          "Branch": student.branch,
          "Section": student.section,
          "Batch": student.batch,
          "Company": student.companyName,
          "Job Role": student.jobRole,
          "Package": student.package,
          "Rounds": `Round ${student.roundNumber}`,
          "Mobile No.": student.mobile,
          "Result": student.status,
          "Status": student.status,
          "Start Date": student.startDate,
          "End Date": student.endDate,
          "studentId": student.studentId
        }));
        
        console.log('[AdminRADW] Formatted table data:', tableData.length, 'records');
        setAllData(tableData);
        
        // Auto-set end date
        if (driveReport.endingDate) {
          setEndDate(driveReport.endingDate);
        }
      } else {
        console.error('[AdminRADW] No reports data found for this drive');
        alert('No report data found for this company drive');
        setAllData([]);
      }
    } catch (error) {
      console.error('[AdminRADW] Error loading students:', error);
      alert('Failed to load students: ' + error.message);
      setAllData([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
    }
  }; 

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

  // Helper function to calculate current year from batch as Roman numeral
  const calculateYearRoman = (batch) => {
    if (!batch) return 'I';
    const currentYear = new Date().getFullYear();
    const batchMatch = batch.match(/(\d{4})-(\d{4})/);
    if (!batchMatch) return 'I';
    
    const startYear = parseInt(batchMatch[1]);
    const yearDiff = currentYear - startYear;
    
    if (yearDiff < 1) return 'I';
    if (yearDiff === 1) return 'II';
    if (yearDiff === 2) return 'III';
    if (yearDiff >= 3) return 'IV';
    return 'I';
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

  // Group drives by company + job role
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
    setStartDate(null);
    setEndDate(null);
    setSelectedBranch('Select Branch');
    setAvailableBranches(['Select Branch']);
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
      .filter(drive => drive.startingDate)
      .map(drive => ({
        date: drive.startingDate,
        endDate: drive.endingDate || drive.startingDate,
        drive: drive
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    setAvailableDates(dates);
    setStartDate(null);
    setEndDate(null);
    setSelectedBranch('Select Branch');
    setAvailableBranches(['Select Branch']);
    
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
      await loadStudentsForDepartment(selectedCompanyJob.companyName, dateObj.date);
    }
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
          reports = reportsResponse.drives;
        } else if (reportsResponse?.data) {
          reports = reportsResponse.data;
        }
        
        console.log('[AdminRADW] Reports response:', reportsResponse);
        console.log('[AdminRADW] Extracted reports/drives:', reports.length);
        
        // Filter drives to only show those that have reports saved
        const driveIdsWithReports = new Set(reports.map(r => r.driveId).filter(Boolean));
        const drivesWithReports = (drivesData || []).filter(drive => 
          driveIdsWithReports.has(drive._id)
        );
        
        console.log('[AdminRADW] All drives:', drivesData?.length);
        console.log('[AdminRADW] Drives with reports:', drivesWithReports.length);
        
        setDrives(drivesWithReports);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load company data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Generate batch options dynamically
  const generateBatchOptions = useCallback(() => {
    const currentYear = new Date().getFullYear();
    const batches = [];
    for (let i = 0; i < 5; i++) {
      const startYear = currentYear - i;
      const endYear = startYear + 4;
      batches.push(`${startYear}-${endYear}`);
    }
    return batches;
  }, []);

  // Helper function to format dates as DD-MM-YYYY
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
        year = (year.length === 2) ? '20' + year : year; 
        return `${year}${month}${day}`;
    } 
    
    return null;
  };


  // Apply filters directly when data or filter values change
  useEffect(() => {
    let currentFilteredData = allData;

    // Branch Filter
    if (selectedBranch !== 'Select Branch') {
      currentFilteredData = currentFilteredData.filter(student => 
        student.Branch.trim() === selectedBranch.trim()
      );
    }

    // Sort by Register No. in ascending order
    currentFilteredData.sort((a, b) => {
      const regNoA = String(a["Register No."] || '').toLowerCase();
      const regNoB = String(b["Register No."] || '').toLowerCase();
      return regNoA.localeCompare(regNoB, undefined, { numeric: true });
    });

    setFilteredData(currentFilteredData);

  }, [selectedBranch, allData]); 
  
  const exportToExcel = async () => {
    try {
      setExportType('Excel');
      setExportPopupState('progress');
      setExportProgress(0);
      setShowExportMenu(false);

      await new Promise(resolve => setTimeout(resolve, 500));
      setExportProgress(30);

      const header = [
          "So No", "Student Name", "Register No.", "Branch", "Section",
          "Company", "Job Role", "Package", "Rounds Reached", "Email", "Mobile",
          "Status", "Start Date", "End Date"
      ];
      
      setExportProgress(60);
      const data = filteredData.map((item) => [
          item["So No"], item["Student Name"], item["Register No."], item.Branch,
          item.Section, item.Company, item["Job Role"], item.Package, item.Rounds,
          item.Email, item["Mobile No."], item.Status, formatDisplayDate(item["Start Date"]), 
          formatDisplayDate(item["End Date"])
      ]);
      
      const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Department Wise Analysis Report");
      
      setExportProgress(90);
      await new Promise(resolve => setTimeout(resolve, 300));
      XLSX.writeFile(wb, "DepartmentWiseAnalysis.xlsx");
      
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
          "S.No", "Name", "Reg No.", "Branch", "Sec", "Company", "Job Role", 
          "Package", "Rounds", "Email", "Mobile", "Status", "Start Date", "End Date"
      ];
      
      setExportProgress(60);
      const tableRows = filteredData.map((item) => [
          item["So No"], item["Student Name"], item["Register No."], item.Branch,
          item.Section, item.Company, item["Job Role"], item.Package, item.Rounds,
          item.Email, item["Mobile No."], item.Status, formatDisplayDate(item["Start Date"]),
          formatDisplayDate(item["End Date"])
      ]);
      
      doc.setFontSize(14);
      doc.text("Department Wise Analysis Report", 148, 15, null, null, "center");
      
      setExportProgress(80);
      autoTable(doc, {
          head: [tableColumn], body: tableRows, startY: 20,
          styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak' },
          headStyles: { fillColor: [78, 162, 78], textColor: 255, fontStyle: 'bold' },
          margin: { top: 20, left: 5, right: 5 },
      });
      
      setExportProgress(90);
      await new Promise(resolve => setTimeout(resolve, 300));
      doc.save("DepartmentWiseAnalysis.pdf");
      
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
      {/* UPDATED CLASS: Admin-radw-layout */}
      <div className={styles['Admin-radw-layout']}>
        <Adsidebar isOpen={isSidebarOpen} />
        {/* UPDATED CLASS: Admin-radw-main-content */}
        <div className={styles['Admin-radw-main-content']}>
          {/* UPDATED CLASS: Admin-radw-filter-box */}
          <div className={styles['Admin-radw-filter-box']}>
            {/* UPDATED CLASSES: Admin-radw-tab-container, Admin-radw-tab-inactive, Admin-radw-tab-active-green */}
            <div className={styles['Admin-radw-tab-container']}>
              <div className={styles['Admin-radw-tab-inactive']} onClick={() => navigate('/admin-report-analysis-rarw')} style={{ cursor: 'pointer' }}>Round wise <br/> Analysis</div>
              <div className={styles['Admin-radw-tab-inactive']} onClick={() => navigate('/admin-report-analysis-company')} style={{ cursor: 'pointer' }}>Company wise <br/> Analysis</div>
              <div className={styles['Admin-radw-tab-active-green']}>Department wise <br/>Analysis</div>
              <div className={styles['Admin-radw-tab-inactive']} onClick={() => navigate('/admin-report-analysis-student')} style={{ cursor: 'pointer' }}>Student wise<br/> Analysis</div>
            </div>

            {/* UPDATED CLASSES: Admin-radw-filter-inputs, Admin-radw-filter-select, Admin-radw-filter-date-input */}
            <div className={styles['Admin-radw-filter-inputs']}>
              {/* Company dropdown */}
              <div className={styles['Admin-radw-dropdown-wrapper']}>
                <div 
                  className={styles['Admin-radw-dropdown-header']} 
                  onClick={() => setIsCompanyOpen(!isCompanyOpen)}
                >
                  <span>{selectedCompany || 'Select Company'}</span>
                  <span className={styles['Admin-radw-dropdown-arrow']}>{isCompanyOpen ? '▲' : '▼'}</span>
                </div>
                {isCompanyOpen && (
                  <div className={styles['Admin-radw-dropdown-menu']}>
                    {uniqueCompanies.map((company, index) => (
                      <div
                        key={index}
                        className={styles['Admin-radw-dropdown-item']}
                        onClick={() => handleCompanySelect(company)}
                      >
                        {company}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Job Role dropdown */}
              <div className={styles['Admin-radw-dropdown-wrapper']}>
                <div 
                  className={`${styles['Admin-radw-dropdown-header']} ${!selectedCompany ? styles['Admin-radw-dropdown-disabled'] : ''}`}
                  onClick={() => selectedCompany && setIsJobRoleOpen(!isJobRoleOpen)}
                >
                  <span>{selectedJobRole || 'Job Role'}</span>
                  <span className={styles['Admin-radw-dropdown-arrow']}>{isJobRoleOpen ? '▲' : '▼'}</span>
                </div>
                {isJobRoleOpen && selectedCompany && (
                  <div className={styles['Admin-radw-dropdown-menu']}>
                    {availableJobRoles.map((jobRole, index) => (
                      <div
                        key={index}
                        className={styles['Admin-radw-dropdown-item']}
                        onClick={() => handleJobRoleSelect(jobRole)}
                      >
                        {jobRole}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Start Date dropdown */}
              <div className={styles['Admin-radw-dropdown-wrapper']}>
                <div 
                  className={`${styles['Admin-radw-dropdown-header']} ${!selectedCompanyJob ? styles['Admin-radw-dropdown-disabled'] : ''}`}
                  onClick={() => selectedCompanyJob && setIsStartDateOpen(!isStartDateOpen)}
                >
                  <span>{startDate ? formatDisplayDate(startDate) : 'Start Date'}</span>
                  <span className={styles['Admin-radw-dropdown-arrow']}>{isStartDateOpen ? '▲' : '▼'}</span>
                </div>
                {isStartDateOpen && selectedCompanyJob && (
                  <div className={styles['Admin-radw-dropdown-menu']}>
                    {availableDates.map((dateObj, index) => (
                      <div
                        key={index}
                        className={styles['Admin-radw-dropdown-item']}
                        onClick={() => handleStartDateSelect(dateObj)}
                      >
                        {formatDisplayDate(dateObj.date)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* End Date - Auto-populated from selected drive */}
              <div className={styles['Admin-radw-dropdown-wrapper']}>
                <div 
                  className={`${styles['Admin-radw-dropdown-header']} ${styles['Admin-radw-dropdown-disabled']}`}
                  title="End date is automatically set based on the selected drive"
                >
                  <span>{endDate ? formatDisplayDate(endDate) : 'End Date'}</span>
                  <span className={styles['Admin-radw-dropdown-arrow']}>✓</span>
                </div>
              </div>
            </div>
            
            {/* UPDATED CLASSES: Admin-radw-department-search-row, Admin-radw-select-label, Admin-radw-department-select */}
            <div className={`${styles['Admin-radw-filter-inputs']} ${styles['Admin-radw-department-search-row']}`}>
                <div className={styles['Admin-radw-select-label']}>Select Branch:</div>
                <select 
                    className={`${styles['Admin-radw-filter-select']} ${styles['Admin-radw-department-select']}`}
                    value={selectedBranch} 
                    onChange={(e) => setSelectedBranch(e.target.value)}
                >
                    {availableBranches.map(branch => (<option key={branch} value={branch}>{branch}</option>))}
                </select>
            </div>

          </div> 
        
          {/* UPDATED CLASS: Admin-radw-table-section */}
          <div className={styles['Admin-radw-table-section']}>
            {/* UPDATED CLASSES for header row, title, and actions */}
            <div className={styles['Admin-radw-table-header-row']}>
              <div className={styles['Admin-radw-table-title']}>DEPARTMENT WISE ANALYSIS</div>
              <div className={styles['Admin-radw-table-actions']}>
                <div className={styles['Admin-radw-print-button-container']}>
                  <button 
                    className={styles['Admin-radw-print-btn-green']} 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                  >
                    Print
                  </button>
                  {showExportMenu && (
                    <div className={styles['Admin-radw-export-menu']}>
                      <button onClick={exportToExcel}>Export to Excel</button>
                      <button onClick={exportToPDF}>Export to PDF</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* UPDATED CLASSES for table structure, headers, body, and status cells */}
            <div className={styles['Admin-radw-table-body-scroll']}>
              <table className={styles['Admin-radw-data-table']}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Name</th>
                    <th>Register Number</th>
                    <th>Branch</th>
                    <th>Year-Sec</th>
                    <th>Reached</th>
                    <th>Mobile</th>
                    <th>View</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr className={styles['Admin-radw-loading-row']}>
                      <td colSpan="8" className={styles['Admin-radw-loading-cell']}>
                        <div className={styles['Admin-radw-loading-wrapper']}>
                          <div className={styles['Admin-radw-spinner']}></div>
                          <span className={styles['Admin-radw-loading-text']}>Loading students…</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((student, index) => (
                      <tr key={index}>
                        <td>{student["So No"]}</td>
                        <td>{student["Student Name"]}</td>
                        <td>{student["Register No."]}</td>
                        <td>{student.Branch}</td>
                        <td>{calculateYearRoman(student.Batch)} - {student.Section}</td>
                        <td>{student.Rounds}</td>
                        <td>{student["Mobile No."]}</td>
                        <td style={{ textAlign: 'center', padding: '8px', cursor: 'pointer' }} onClick={() => {
                          if (student.studentId) {
                            navigate(`/admin-profile/${student.studentId}`);
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
                        No students found matching the current filters.
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
            className={styles['Admin-radw-overlay']}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </div>

      {/* Export Popup Alerts */}
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

export default AdminRADW;