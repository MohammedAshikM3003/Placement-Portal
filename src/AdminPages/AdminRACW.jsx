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
import styles from './AdminRACW.module.css';
import Adminicon from "../assets/Adminicon.png";

// Eye Icon Component
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4EA24E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

// Master data array
const initialData = [
  { "So No": 1, "Student Name": "Arun Kumar S.", "Register No.": "7315X00001", "Department": "CSE", "Batch": "2023-2027", "Section": "A", "Company": "Infosys", "Job Role": "Software Engineer", "Package": "12.0 LPA", "Rounds": "Round 5", "Status": "Passed", "Start Date": "01/08/25", "End Date": "05/08/25", "Placement Date": "29/08/25", "Email": "arun.kumar.s@example.com", "Mobile No.": "9788657400" },
  { "So No": 2, "Student Name": "Priya V.", "Register No.": "7315X00002", "Department": "IT", "Batch": "2023-2027", "Section": "B", "Company": "Wipro", "Job Role": "Data Analyst", "Package": "7.0 LPA", "Rounds": "Round 2", "Status": "Rejected", "Start Date": "06/08/25", "End Date": "10/08/25", "Placement Date": "", "Email": "priya.v@example.com", "Mobile No.": "9788657401" },
  { "So No": 3, "Student Name": "Gowtham M.", "Register No.": "7315X00003", "Department": "MECH", "Batch": "2023-2027", "Section": "A", "Company": "TCS", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 1", "Status": "Rejected", "Start Date": "11/08/25", "End Date": "15/08/25", "Placement Date": "", "Email": "gowtham.m@example.com", "Mobile No.": "9788657402" },
  { "So No": 4, "Student Name": "Nithya R.", "Register No.": "7315X00004", "Department": "EEE", "Batch": "2023-2027", "Section": "A", "Company": "TCS", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Passed", "Start Date": "16/08/25", "End Date": "20/08/25", "Placement Date": "30/08/25", "Email": "nithya.r@example.com", "Mobile No.": "9788657403" },
  { "So No": 5, "Student Name": "Vikram K.", "Register No.": "7315X00005", "Department": "ECE", "Batch": "2023-2027", "Section": "B", "Company": "Wipro", "Job Role": "Software Engineer", "Package": "8.0 LPA", "Rounds": "Round 2", "Status": "Rejected", "Start Date": "21/08/25", "End Date": "25/08/25", "Placement Date": "", "Email": "vikram.k@example.com", "Mobile No.": "9788657404" },
  { "So No": 6, "Student Name": "Deepika P.", "Register No.": "7315X00006", "Department": "CIVIL", "Batch": "2023-2027", "Section": "C", "Company": "Infosys", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 3", "Status": "Passed", "Start Date": "26/08/25", "End Date": "30/08/25", "Placement Date": "01/09/25", "Email": "deepika.p@example.com", "Mobile No.": "9788657405" },
  { "So No": 7, "Student Name": "Sanjay R.", "Register No.": "7315X00007", "Department": "CSE", "Batch": "2024-2028", "Section": "A", "Company": "IBM", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Rejected", "Start Date": "01/09/25", "End Date": "05/09/25", "Placement Date": "", "Email": "sanjay.r@example.com", "Mobile No.": "9788657406" },
  { "So No": 8, "Student Name": "Meena L.", "Register No.": "7315X00008", "Department": "IT", "Batch": "2024-2028", "Section": "B", "Company": "TCS", "Job Role": "Software Engineer", "Package": "8.0 LPA", "Rounds": "Round 2", "Status": "Passed", "Start Date": "06/09/25", "End Date": "10/09/25", "Placement Date": "12/09/25", "Email": "meena.l@example.com", "Mobile No.": "9788657407" },
  { "So No": 9, "Student Name": "Kavin S.", "Register No.": "7315X00009", "Department": "MECH", "Batch": "2024-2028", "Section": "C", "Company": "Wipro", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 3", "Status": "Rejected", "Start Date": "11/09/25", "End Date": "15/09/25", "Placement Date": "", "Email": "kavin.s@example.com", "Mobile No.": "9788657408" },
  { "So No": 10, "Student Name": "Harini B.", "Register No. " : "7315X00010", "Department": "CSE", "Batch": "2024-2028", "Section": "A", "Company": "Infosys", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Passed", "Start Date": "16/09/25", "End Date": "20/09/25", "Placement Date": "22/09/25", "Email": "harini.b@example.com", "Mobile No.": "9788657409" },
];

function AdminRACW() {
  useAdminAuth(); // JWT authentication verification
  const navigate = useNavigate();
  
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drives, setDrives] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // Load students for selected company and date
  const loadStudentsForCompany = async (companyName, startDate) => {
    if (!companyName || !startDate) {
      console.log('[AdminRACW] Missing company name or start date');
      return;
    }
    
    try {
      setIsLoading(true);
      setAllData([]);
      setFilteredData([]);
      
      console.log('[AdminRACW] Loading students for company:', companyName, 'Start Date:', startDate);
      
      // Find the drive from selectedCompanyJob
      const drive = selectedCompanyJob?.drives?.find(d => 
        d.startingDate === startDate || d.driveStartDate === startDate || d.companyDriveDate === startDate
      );
      
      if (!drive) {
        console.error('[AdminRACW] Could not find drive for selected date');
        alert('Could not find drive data');
        return;
      }
      
      console.log('[AdminRACW] Selected drive:', drive);
      
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
      
      console.log('[AdminRACW] All drive documents:', driveDocs.length);
      console.log('[AdminRACW] Looking for driveId:', drive._id);
      
      // Find the report document for this specific drive
      const driveReport = driveDocs.find(report => report.driveId === drive._id);
      
      if (driveReport && driveReport.rounds && driveReport.rounds.length > 0) {
        console.log('[AdminRACW] Found drive report:', driveReport);
        console.log('[AdminRACW] Drive has', driveReport.rounds.length, 'rounds');
        
        // Collect all students across all rounds with their max round reached
        const studentMap = new Map();
        
        driveReport.rounds.forEach((round) => {
          console.log(`[AdminRACW] Round ${round.roundNumber}: ${round.passedStudents?.length || 0} passed, ${round.failedStudents?.length || 0} failed`);
          
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
        
        console.log('[AdminRACW] Total unique students:', studentMap.size);
        
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
        
        console.log('[AdminRACW] Formatted table data:', tableData.length, 'records');
        setAllData(tableData);
        
        // Auto-set end date
        if (driveReport.endingDate) {
          setEndDate(driveReport.endingDate);
        }
      } else {
        console.error('[AdminRACW] No reports data found for this drive');
        alert('No report data found for this company drive');
        setAllData([]);
      }
    } catch (error) {
      console.error('[AdminRACW] Error loading students:', error);
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

  // End date is now automatically populated from the drive data

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
        
        console.log('[AdminRACW] Reports response:', reportsResponse);
        console.log('[AdminRACW] Extracted reports/drives:', reports.length);
        
        // Filter drives to only show those that have reports saved
        const driveIdsWithReports = new Set(reports.map(r => r.driveId).filter(Boolean));
        const drivesWithReports = (drivesData || []).filter(drive => 
          driveIdsWithReports.has(drive._id)
        );
        
        console.log('[AdminRACW] All drives:', drivesData?.length);
        console.log('[AdminRACW] Drives with reports:', drivesWithReports.length);
        console.log('[AdminRACW] DriveIds with reports:', Array.from(driveIdsWithReports));
        
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


  // The filtering logic - deduplication and sorting
  useEffect(() => {
    let currentFilteredData = allData;

    // Remove duplicates based on Register No. - keep only the first occurrence
    const uniqueStudents = [];
    const seenRegNos = new Set();
    currentFilteredData.forEach(student => {
      if (!seenRegNos.has(student["Register No."])) {
        seenRegNos.add(student["Register No."]);
        uniqueStudents.push(student);
      }
    });

    // Sort by Register No. in ascending order
    uniqueStudents.sort((a, b) => {
      const regNoA = String(a["Register No."] || '').toLowerCase();
      const regNoB = String(b["Register No."] || '').toLowerCase();
      return regNoA.localeCompare(regNoB, undefined, { numeric: true });
    });

    // Recalculate S.No after filtering, deduplication, and sorting
    const reindexedData = uniqueStudents.map((student, index) => ({
      ...student,
      "So No": index + 1
    }));

    setFilteredData(reindexedData);

  }, [allData]);
  
  const exportToExcel = async () => {
    try {
      setExportType('Excel');
      setExportPopupState('progress');
      setExportProgress(0);
      setShowExportMenu(false);

      await new Promise(resolve => setTimeout(resolve, 500));
      setExportProgress(30);

      const header = [
          "So No", "Student Name", "Register No.", "Department", "Section",
          "Company", "Job Role", "Package", "Rounds Reached", "Email", "Mobile",
          "Status (Selected Round)", "Start Date", "End Date"
      ];
      
      const data = filteredData.map((item) => [
          item["So No"], item["Student Name"], item["Register No."], item.Department,
          item.Section, item.Company, item["Job Role"], item.Package, item.Rounds,
          item.Email, item["Mobile No."], item.Status, formatDisplayDate(item["Start Date"]), 
          formatDisplayDate(item["End Date"])
      ]);
      
      setExportProgress(60);
      const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Student Wise Analysis Report");
      
      setExportProgress(90);
      await new Promise(resolve => setTimeout(resolve, 300));
      XLSX.writeFile(wb, "StudentWiseAnalysis.xlsx");
      
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
          "S.No", "Name", "Reg No.", "Dept", "Sec", "Company", "Job Role", 
          "Package", "Rounds", "Email", "Mobile", "Status", "Start Date", "End Date"
      ];
      
      setExportProgress(60);
      const tableRows = filteredData.map((item) => [
          item["So No"], item["Student Name"], item["Register No."], item.Department,
          item.Section, item.Company, item["Job Role"], item.Package, item.Rounds,
          item.Email, item["Mobile No."], item.Status, formatDisplayDate(item["Start Date"]),
          formatDisplayDate(item["End Date"])
      ]);
      
      doc.setFontSize(14);
      doc.text("Student Wise Analysis Report", 148, 15, null, null, "center");
      
      setExportProgress(80);
      autoTable(doc, {
          head: [tableColumn], body: tableRows, startY: 20,
          styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak' },
          headStyles: { fillColor: [78, 162, 78], textColor: 255, fontStyle: 'bold' },
          margin: { top: 20, left: 5, right: 5 },
      });
      
      setExportProgress(90);
      await new Promise(resolve => setTimeout(resolve, 300));
      doc.save("StudentWiseAnalysis.pdf");
      
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
      {/* UPDATED CLASS: Admin-racw-layout */}
      <div className={styles['Admin-racw-layout']}>
        <Adsidebar isOpen={isSidebarOpen} />
        {/* UPDATED CLASS: Admin-racw-main-content */}
        <div className={styles['Admin-racw-main-content']}>
          {/* UPDATED CLASS: Admin-racw-filter-box */}
          <div className={styles['Admin-racw-filter-box']}>
            {/* UPDATED CLASS: Admin-racw-tab-container, Admin-racw-tab-inactive, Admin-racw-tab-active-green */}
            <div className={styles['Admin-racw-tab-container']}>
              <div className={styles['Admin-racw-tab-inactive']} onClick={() => navigate('/admin-report-analysis-rarw')} style={{ cursor: 'pointer' }}>Round wise <br/> Analysis</div>
              <div className={styles['Admin-racw-tab-active-green']}>Company wise <br/> Analysis</div>
              <div className={styles['Admin-racw-tab-inactive']} onClick={() => navigate('/admin-report-analysis-department')} style={{ cursor: 'pointer' }}>Department wise <br/>Analysis</div>
              <div className={styles['Admin-racw-tab-inactive']} onClick={() => navigate('/admin-report-analysis-student')} style={{ cursor: 'pointer' }}>Student wise<br/> Analysis</div>
            </div>

            {/* UPDATED CLASSES: Admin-racw-filter-inputs, Admin-racw-filter-select, Admin-racw-filter-date-input */}
            <div className={styles['Admin-racw-filter-inputs']}>
              <div className={styles['Admin-racw-dropdown-wrapper']}>
                <div 
                  className={styles['Admin-racw-dropdown-header']} 
                  onClick={() => setIsCompanyOpen(!isCompanyOpen)}
                >
                  <span>{selectedCompany || 'Select Company'}</span>
                  <span className={styles['Admin-racw-dropdown-arrow']}>{isCompanyOpen ? '▲' : '▼'}</span>
                </div>
                {isCompanyOpen && (
                  <div className={styles['Admin-racw-dropdown-menu']}>
                    {uniqueCompanies.map((company, index) => (
                      <div
                        key={index}
                        className={styles['Admin-racw-dropdown-item']}
                        onClick={() => handleCompanySelect(company)}
                      >
                        {company}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles['Admin-racw-dropdown-wrapper']}>
                <div 
                  className={`${styles['Admin-racw-dropdown-header']} ${!selectedCompany ? styles['Admin-racw-dropdown-disabled'] : ''}`}
                  onClick={() => selectedCompany && setIsJobRoleOpen(!isJobRoleOpen)}
                >
                  <span>{selectedJobRole || 'Job Role'}</span>
                  <span className={styles['Admin-racw-dropdown-arrow']}>{isJobRoleOpen ? '▲' : '▼'}</span>
                </div>
                {isJobRoleOpen && selectedCompany && (
                  <div className={styles['Admin-racw-dropdown-menu']}>
                    {availableJobRoles.map((jobRole, index) => (
                      <div
                        key={index}
                        className={styles['Admin-racw-dropdown-item']}
                        onClick={() => handleJobRoleSelect(jobRole)}
                      >
                        {jobRole}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles['Admin-racw-dropdown-wrapper']}>
                <div 
                  className={`${styles['Admin-racw-dropdown-header']} ${!selectedCompanyJob ? styles['Admin-racw-dropdown-disabled'] : ''}`}
                  onClick={() => selectedCompanyJob && setIsStartDateOpen(!isStartDateOpen)}
                >
                  <span>{startDate ? formatDisplayDate(startDate) : 'Start Date'}</span>
                  <span className={styles['Admin-racw-dropdown-arrow']}>{isStartDateOpen ? '▲' : '▼'}</span>
                </div>
                {isStartDateOpen && selectedCompanyJob && (
                  <div className={styles['Admin-racw-dropdown-menu']}>
                    {availableDates.map((dateObj, index) => (
                      <div
                        key={index}
                        className={styles['Admin-racw-dropdown-item']}
                        onClick={() => handleStartDateSelect(dateObj)}
                      >
                        {formatDisplayDate(dateObj.date)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* End Date - Auto-populated from selected drive */}
              <div className={styles['Admin-racw-dropdown-wrapper']}>
                <div 
                  className={`${styles['Admin-racw-dropdown-header']} ${styles['Admin-racw-dropdown-disabled']}`}
                  title="End date is automatically set based on the selected drive"
                >
                  <span>{endDate ? formatDisplayDate(endDate) : 'End Date'}</span>
                  <span className={styles['Admin-racw-dropdown-arrow']}>✓</span>
                </div>
              </div>
            </div>
          </div> 

          {/* Table Section */}
          {/* UPDATED CLASSES: Admin-racw-table-section, Admin-racw-table-header-row, Admin-racw-table-title, Admin-racw-table-actions, Admin-racw-view-status-btn-filtered, Admin-racw-view-status-btn-all, Admin-racw-print-button-container, Admin-racw-print-btn-green, Admin-racw-export-menu */}
          <div className={styles['Admin-racw-table-section']}>
            <div className={styles['Admin-racw-table-header-row']}>
              <div className={styles['Admin-racw-table-title']}>COMPANY WISE ANALYSIS</div>
              <div className={styles['Admin-racw-table-actions']}>
                <div className={styles['Admin-racw-print-button-container']}>
                  <button 
                    className={styles['Admin-racw-print-btn-green']} 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                  >
                    Print
                  </button>
                  {showExportMenu && (
                    <div className={styles['Admin-racw-export-menu']}>
                      <button onClick={exportToExcel}>Export to Excel</button>
                      <button onClick={exportToPDF}>Export to PDF</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* UPDATED CLASSES: Admin-racw-data-table, Admin-racw-table-body-scroll, Admin-racw-status-cell-placed-green, Admin-racw-status-cell-rejected */}
            <div className={styles['Admin-racw-table-body-scroll']}>
              <table className={styles['Admin-racw-data-table']}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Name</th>
                    <th>Reg.No</th>
                    <th>Branch</th>
                    <th>Year-Sec</th>
                    <th>Reached</th>
                    <th>Mobile</th>
                    <th>View</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr className={styles['Admin-racw-loading-row']}>
                      <td colSpan="8" className={styles['Admin-racw-loading-cell']}>
                        <div className={styles['Admin-racw-loading-wrapper']}>
                          <div className={styles['Admin-racw-spinner']}></div>
                          <span className={styles['Admin-racw-loading-text']}>Loading students…</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((student, index) => (
                      <tr key={index}>
                        <td>{student["So No"]}</td>
                        <td>{student["Student Name"]}</td>
                        <td>{student["Register No."]}</td>
                        <td>{student.Department}</td>
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
                      <td colSpan="9" style={{ textAlign: 'center', padding: '20px', width: '100%', display: 'block' }}>
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
        {isSidebarOpen && (
          <div
            className={styles['Admin-racw-overlay']}
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

// Helper function to generate batch options
function generateBatchOptions() {
  const currentYear = new Date().getFullYear();
  const batches = [];
  for (let i = 0; i < 5; i++) {
    const startYear = currentYear - i;
    const endYear = startYear + 4;
    batches.push(`${startYear}-${endYear}`);
  }
  return batches;
}

export default AdminRACW;