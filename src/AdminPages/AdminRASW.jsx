import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import useAdminAuth from '../utils/useAdminAuth';
import * as XLSX from 'xlsx'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Adminicon from "../assets/Adminicon.png";

import "react-datepicker/dist/react-datepicker.css"; 

import Adnavbar from '../components/Navbar/Adnavbar.js';
import Adsidebar from '../components/Sidebar/Adsidebar.js';
import mongoDBService from '../services/mongoDBService.jsx';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

// FIXED: Import CSS as a Module
import styles from './AdminRASW.module.css';

// Eye Icon Component
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4EA24E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

function AdminRASW() {
  useAdminAuth(); // JWT authentication verification
  const navigate = useNavigate();
  
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drives, setDrives] = useState([]);
  
  const [companyFilter, setCompanyFilter] = useState('All Companies');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedJobRole, setSelectedJobRole] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedCompanyJob, setSelectedCompanyJob] = useState(null);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isJobRoleOpen, setIsJobRoleOpen] = useState(false);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  
  const [showExportMenu, setShowExportMenu] = useState(false); 

  // Export popup states
  const [exportPopupState, setExportPopupState] = useState('none');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('Excel');
  
  const [searchType, setSearchType] = useState('Mobile number');
  const [searchInput, setSearchInput] = useState('');  const [nameRegisterInput, setNameRegisterInput] = useState('');
  const [branchFilter, setBranchFilter] = useState('All Branches');
  const [availableBranches, setAvailableBranches] = useState(['All Branches']);
  const [filteredBySearch, setFilteredBySearch] = useState([]);
  const [searchError, setSearchError] = useState('');

  // Fetch data from MongoDB on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch drives and reports
        const drivesData = await mongoDBService.getCompanyDrives();
        const reportsResponse = await mongoDBService.getAllReports();
        
        // Extract reports data
        let reports = [];
        if (Array.isArray(reportsResponse)) {
          reports = reportsResponse;
        } else if (reportsResponse?.drives) {
          reports = reportsResponse.drives;
        } else if (reportsResponse?.data) {
          reports = reportsResponse.data;
        }
        
        console.log('[AdminRASW] Reports response:', reportsResponse);
        console.log('[AdminRASW] Extracted reports/drives:', reports.length);
        
        // Filter drives to only show those that have reports saved
        const driveIdsWithReports = new Set(reports.map(r => r.driveId).filter(Boolean));
        const drivesWithReports = (drivesData || []).filter(drive => 
          driveIdsWithReports.has(drive._id)
        );
        
        console.log('[AdminRASW] All drives:', drivesData?.length);
        console.log('[AdminRASW] Drives with reports:', drivesWithReports.length);
        
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
    setAllData([]);
    setFilteredData([]);
    setFilteredBySearch([]);
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
    setCompanyFilter(`${group.companyName} - ${group.jobRole}`);
    
    // Clear table until dates are selected
    setAllData([]);
    setFilteredData([]);
    setFilteredBySearch([]);
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
      console.log('[AdminRASW] Missing company name or start date');
      return;
    }
    
    try {
      setIsLoading(true);
      setAllData([]);
      setFilteredData([]);
      setFilteredBySearch([]);
      
      console.log('[AdminRASW] Loading students for company:', companyName, 'Start Date:', startDate);
      
      // Find the drive from selectedCompanyJob
      const drive = selectedCompanyJob?.drives?.find(d => 
        d.startingDate === startDate || d.driveStartDate === startDate || d.companyDriveDate === startDate
      );
      
      if (!drive) {
        console.error('[AdminRASW] Could not find drive for selected date');
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
      
      console.log('[AdminRASW] All drive documents:', driveDocs.length);
      console.log('[AdminRASW] Looking for driveId:', drive._id);
      
      // Find the report document for this specific drive
      const driveReport = driveDocs.find(report => report.driveId === drive._id);
      
      if (driveReport && driveReport.rounds && driveReport.rounds.length > 0) {
        console.log('[AdminRASW] Found drive report with', driveReport.rounds.length, 'rounds');
        
        // Collect ALL students (passed and failed) across all rounds
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
                  department: student.branch || student.department || 'N/A',
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
          
          // Add failed students
          const failedArrays = [
            round.failedStudents,
            round.rejectedStudents,
            round.notSelectedStudents
          ];
          
          failedArrays.forEach(failedArray => {
            if (failedArray && failedArray.length > 0) {
              failedArray.forEach(student => {
                const regNo = student.registerNo || student.regNo || '';
                if (!regNo) return;
                
                const existing = studentMap.get(regNo);
                // Only add failed student if they don't exist or this is a higher round (but still failed)
                if (!existing || (existing.status === 'Failed' && round.roundNumber > existing.roundNumber)) {
                  studentMap.set(regNo, {
                    name: student.name || student.studentName || '',
                    regNo: regNo,
                    department: student.branch || student.department || 'N/A',
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
        });
        
        console.log('[AdminRASW] Total unique students (passed + failed):', studentMap.size);
        
        // Transform consolidated data for table display
        const tableData = Array.from(studentMap.values()).map((student, index) => ({
          "So No": index + 1,
          "Student Name": student.name,
          "Register No.": student.regNo,
          "Department": student.department,
          "Section": student.section,
          "Batch": student.batch,
          "Company": student.companyName,
          "Job Role": student.jobRole,
          "Package": student.package,
          "Rounds": `Round ${student.roundNumber}`,
          "Mobile No.": student.mobile,
          "Email": student.email,
          "Result": student.status,
          "Status": student.status,
          "Start Date": student.startDate,
          "End Date": student.endDate,
          "Placement Date": student.startDate,
          "RoundNumber": student.roundNumber,
          "studentId": student.studentId
        }));
        
        console.log('[AdminRASW] Formatted table data (all students):', tableData);
        
        if (tableData.length === 0) {
          alert('No students found for this company drive.');
        } else if (response.companyDrive) {
          // Auto-fill end date from the drive data
          setEndDate(response.companyDrive.endingDate || response.companyDrive.startingDate);
        }
        
        setAllData(tableData);
        setFilteredData(tableData);
        setFilteredBySearch(tableData);
      } else {
        console.error('[AdminRASW] Invalid response:', response);
        alert(response.message || 'Failed to fetch company data');
      }
    } catch (error) {
      console.error('[AdminRASW] Error loading students:', error);
      alert('Failed to load students: ' + error.message);
      setAllData([]);
      setFilteredData([]);
      setFilteredBySearch([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle start date selection
  const handleStartDateSelect = async (dateObj) => {
    setStartDate(dateObj.date);
    setIsStartDateOpen(false);
    
    // Auto-set end date from the selected dateObj
    setEndDate(dateObj.endDate);
    
    // Load students immediately when start date is selected
    if (selectedCompanyJob && dateObj.date) {
      await loadStudentsForCompany(selectedCompanyJob.companyName, dateObj.date);
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
        year = (year.length === 2) ? '20' + year : year; 
        return `${year}${month}${day}`;
    } 
    
    return null;
  };

  // Real-time filtering effect that runs whenever search inputs change
  useEffect(() => {
    const filterStudents = async () => {
      setSearchError('');
      
      const trimmedMobileEmail = searchInput.trim();
      const trimmedNameRegister = nameRegisterInput.trim();
      
      // If both fields are empty, clear data
      if (trimmedMobileEmail === '' && trimmedNameRegister === '') {
        setAllData([]);
        setFilteredData([]);
        setFilteredBySearch([]);
        return;
      }
      
      // Validate mobile/email input if provided
      if (trimmedMobileEmail !== '') {
        const isOnlyNumbers = /^\d+$/.test(trimmedMobileEmail);
        
        if (searchType === 'Email' && isOnlyNumbers) {
          setSearchError('You should select mobile number');
          return;
        }
        
        if (searchType === 'Mobile number' && !isOnlyNumbers) {
          setSearchError('You should select email');
          return;
        }
      }
      
      try {
        setIsLoading(true);
        setAllData([]);
        setFilteredData([]);
        
        // Fetch all reports from MongoDB
        const response = await mongoDBService.getAllReports();
      
        console.log('[AdminRASW] Filter - Raw reports data:', response);
        
        if (response.success && response.data) {
          // Show ALL students (passed and failed)
          const allStudents = response.data;
          
          console.log(`[AdminRASW] Total reports: ${response.data.length}`);
          
          // Filter based on inputs
          let matchingStudents = allStudents;
          
          // Filter by name or register number if provided
          if (trimmedNameRegister !== '') {
            const nameRegisterTerm = trimmedNameRegister.toLowerCase();
            matchingStudents = matchingStudents.filter(item => {
              const name = (item.name || item.studentName || '').toLowerCase();
              const registerNo = (item.registerNo || item.regNo || '').toLowerCase();
              return name.includes(nameRegisterTerm) || registerNo.includes(nameRegisterTerm);
            });
          }
          
          // Filter by branch if selected
          if (branchFilter !== 'All Branches') {
            matchingStudents = matchingStudents.filter(item => {
              const branch = (item.department || item.branch || '').toUpperCase();
              return branch === branchFilter;
            });
          }
          
          // Filter by mobile or email if provided
          if (trimmedMobileEmail !== '') {
            const searchTerm = trimmedMobileEmail.toLowerCase();
            matchingStudents = matchingStudents.filter(item => {
              const fieldValue = searchType === 'Mobile number' 
                ? (item.phone || item.mobile || '')
                : (item.email || item.studentEmail || '');
              return String(fieldValue).toLowerCase().includes(searchTerm);
            });
          }
        
          console.log(`[AdminRASW] Matching students: ${matchingStudents.length}`);
          
          // Group students by register number and keep only their highest round
          const studentMap = new Map();
        
          matchingStudents.forEach(student => {
            const regNo = student.registerNo || student.regNo || '';
            if (!regNo) return;
            
            const roundNumber = student.roundNumber || 0;
            
            // If student doesn't exist or this is a higher round, update the entry
            if (!studentMap.has(regNo) || studentMap.get(regNo).roundNumber < roundNumber) {
              studentMap.set(regNo, {
                name: student.name || student.studentName || 'N/A',
                regNo: regNo,
                department: student.department || student.branch || 'N/A',
                batch: student.batch || 'N/A',
                section: student.yearSec?.split('-')[1] || 'N/A',
                companyName: student.companyName || 'N/A',
                jobRole: student.jobRole || 'N/A',
                roundNumber: roundNumber,
                email: student.email || student.studentEmail || 'N/A',
                mobile: student.phone || student.mobile || 'N/A',
                date: student.date,
                status: student.status || 'N/A',
                studentId: student.studentId || student._id
              });
            }
          });
          
          const transformedData = Array.from(studentMap.values()).map((item, index) => ({
            "So No": index + 1,
            "Student Name": item.name,
            "Register No.": item.regNo,
            "Department": item.department,
            "Batch": item.batch,
            "Section": item.section,
            "Company": item.companyName,
            "Job Role": item.jobRole,
            "Package": 'N/A',
            "Rounds": `Round ${item.roundNumber}`,
            "Status": item.status,
            "Start Date": item.date ? new Date(item.date).toLocaleDateString('en-GB').replace(/\//g, '/') : '',
            "End Date": '',
            "Placement Date": item.date ? new Date(item.date).toLocaleDateString('en-GB').replace(/\//g, '/') : '',
            "Email": item.email,
            "Mobile No.": item.mobile,
            "RoundNumber": item.roundNumber,
            "studentId": item.studentId
          }));
          
          console.log('[AdminRASW] Transformed data:', transformedData.length, 'records');
          
          setAllData(transformedData);
          setFilteredData(transformedData);
          setFilteredBySearch(transformedData);
        } else {
          console.error('[AdminRASW] No reports data found in response');
          setAllData([]);
          setFilteredData([]);
          setFilteredBySearch([]);
          setAvailableBranches(['All Branches']);
        }
      } catch (error) {
        console.error('[AdminRASW] Error filtering students:', error);
        setAllData([]);
        setFilteredData([]);
        setFilteredBySearch([]);
        setAvailableBranches(['All Branches']);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce the filtering to avoid too many API calls
    const timeoutId = setTimeout(() => {
      filterStudents();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [searchInput, nameRegisterInput, branchFilter, searchType]);

  // Extract branches whenever allData changes
  useEffect(() => {
    if (allData.length > 0) {
      const allBranches = allData.map(s => s.Department).filter(Boolean);
      const branches = ['All Branches', ...new Set(allBranches)];
      setAvailableBranches(branches);
      console.log('[AdminRASW] Extracted branches:', branches);
    } else {
      setAvailableBranches(['All Branches']);
    }
  }, [allData]);

  useEffect(() => {
    let currentFilteredData = filteredBySearch; 

    // Show all students (both passed and failed)

    if (companyFilter !== 'All Companies' && selectedCompanyJob) {
      // Filter by the selected company and job role combination
      const filterKey = `${selectedCompanyJob.companyName} - ${selectedCompanyJob.jobRole}`;
      currentFilteredData = currentFilteredData.filter(student => 
        `${student.Company} - ${student["Job Role"]}` === filterKey
      );
    }

    if (startDate) {
      const filterStart = getSortableDateString(startDate); 
      if (filterStart) {
        currentFilteredData = currentFilteredData.filter(student => {
          const studentStart = getSortableDateString(student["Start Date"]); 
          return studentStart && studentStart >= filterStart; 
        });
      }
    }

    if (endDate) {
      const filterEnd = getSortableDateString(endDate); 
      if (filterEnd) {
        currentFilteredData = currentFilteredData.filter(student => {
          const studentEnd = getSortableDateString(student["End Date"]); 
          return studentEnd && studentEnd <= filterEnd;
        });
      }
    }

    // Sort by Register No. in ascending order, then by Round Number
    currentFilteredData.sort((a, b) => {
      const regNoA = String(a["Register No."] || '').toLowerCase();
      const regNoB = String(b["Register No."] || '').toLowerCase();
      const regComparison = regNoA.localeCompare(regNoB, undefined, { numeric: true });
      
      if (regComparison !== 0) return regComparison;
      
      // If same register no, sort by round number
      return (a.RoundNumber || 0) - (b.RoundNumber || 0);
    });

    console.log('Filtered data count:', currentFilteredData.length);
    console.log('Filter settings:', { 
      companyFilter, 
      selectedCompany: selectedCompanyJob?.companyName,
      selectedJobRole: selectedCompanyJob?.jobRole,
      startDate, 
      endDate 
    });

    setFilteredData(currentFilteredData);

  }, [companyFilter, startDate, endDate, filteredBySearch, selectedCompanyJob]);
  
  const exportToExcel = async () => {
    try {
      setExportType('Excel');
      setExportPopupState('progress');
      setExportProgress(0);
      setShowExportMenu(false);

      await new Promise(resolve => setTimeout(resolve, 500));
      setExportProgress(30);

      // Export only passed students with their round information
      const header = [
          "So No", "Student Name", "Register No.", "Department", "Section",
          "Company", "Job Role", "Package", "Round Passed", "Email", "Mobile",
          "Placement Date"
      ];
      
      setExportProgress(60);
      const data = filteredData.map((item) => [
          item["So No"], item["Student Name"], item["Register No."], item.Department,
          item.Section, item.Company, item["Job Role"], item.Package, item.Rounds,
          item.Email, item["Mobile No."], formatDisplayDate(item["Placement Date"])
      ]);
      
      const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Passed Students Analysis");
      
      setExportProgress(90);
      await new Promise(resolve => setTimeout(resolve, 300));
      XLSX.writeFile(wb, "PassedStudents_RoundWise.xlsx");
      
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
      
      // Export only passed students with their round information
      const tableColumn = [
          "S.No", "Name", "Reg No.", "Dept", "Sec", "Company", "Job Role", 
          "Package", "Round Passed", "Email", "Mobile", "Placement Date"
      ];
      
      setExportProgress(60);
      const tableRows = filteredData.map((item) => [
          item["So No"], item["Student Name"], item["Register No."], item.Department,
          item.Section, item.Company, item["Job Role"], item.Package, item.Rounds,
          item.Email, item["Mobile No."], formatDisplayDate(item["Placement Date"])
      ]);
      
      doc.setFontSize(14);
      doc.text("Passed Students - Round Wise Analysis", 148, 15, null, null, "center");
      
      setExportProgress(80);
      autoTable(doc, {
          head: [tableColumn], body: tableRows, startY: 20,
          styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak' },
          headStyles: { fillColor: [78, 162, 78], textColor: 255, fontStyle: 'bold' },
          margin: { top: 20, left: 5, right: 5 },
      });
      
      setExportProgress(90);
      await new Promise(resolve => setTimeout(resolve, 300));
      doc.save("PassedStudents_RoundWise.pdf");
      
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
      <Adnavbar Adminicon={Adminicon} /> 
      {/* UPDATED CLASS: Admin-rasw-layout */}
      <div className={styles['Admin-rasw-layout']}>
        <Adsidebar />
        {/* UPDATED CLASS: Admin-rasw-main-content */}
        <div className={styles['Admin-rasw-main-content']}>
          {/* UPDATED CLASS: Admin-rasw-filter-box */}
          <div className={styles['Admin-rasw-filter-box']}>
            {/* UPDATED CLASSES: Admin-rasw-tab-container, Admin-rasw-tab-inactive, Admin-rasw-tab-active-green */}
            <div className={styles['Admin-rasw-tab-container']}>
              <div className={styles['Admin-rasw-tab-inactive']} onClick={() => navigate('/admin-report-analysis-rarw')} style={{ cursor: 'pointer' }}>Round wise <br/> Analysis</div>
              <div className={styles['Admin-rasw-tab-inactive']} onClick={() => navigate('/admin-report-analysis-company')} style={{ cursor: 'pointer' }}>Company wise <br/> Analysis</div>
              <div className={styles['Admin-rasw-tab-inactive']} onClick={() => navigate('/admin-report-analysis-department')} style={{ cursor: 'pointer' }}>Department wise <br/>Analysis</div>
              <div className={styles['Admin-rasw-tab-active-green']}>Student wise<br/> Analysis</div>
            </div>

            {/* UPDATED CLASSES: Admin-rasw-filter-inputs, Admin-rasw-filter-select, Admin-rasw-filter-date-input */}
            <div className={styles['Admin-rasw-filter-inputs']}>
              {/* Company dropdown */}
              <div className={styles['Admin-rasw-dropdown-wrapper']}>
                <div 
                  className={styles['Admin-rasw-dropdown-header']} 
                  onClick={() => setIsCompanyOpen(!isCompanyOpen)}
                >
                  <span>{selectedCompany || 'Select Company'}</span>
                  <span className={styles['Admin-rasw-dropdown-arrow']}>{isCompanyOpen ? '▲' : '▼'}</span>
                </div>
                {isCompanyOpen && (
                  <div className={styles['Admin-rasw-dropdown-menu']}>
                    {uniqueCompanies.map((company, index) => (
                      <div
                        key={index}
                        className={styles['Admin-rasw-dropdown-item']}
                        onClick={() => handleCompanySelect(company)}
                      >
                        {company}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Job Role dropdown */}
              <div className={styles['Admin-rasw-dropdown-wrapper']}>
                <div 
                  className={`${styles['Admin-rasw-dropdown-header']} ${!selectedCompany ? styles['Admin-rasw-dropdown-disabled'] : ''}`}
                  onClick={() => selectedCompany && setIsJobRoleOpen(!isJobRoleOpen)}
                >
                  <span>{selectedJobRole || 'Job Role'}</span>
                  <span className={styles['Admin-rasw-dropdown-arrow']}>{isJobRoleOpen ? '▲' : '▼'}</span>
                </div>
                {isJobRoleOpen && selectedCompany && (
                  <div className={styles['Admin-rasw-dropdown-menu']}>
                    {availableJobRoles.map((jobRole, index) => (
                      <div
                        key={index}
                        className={styles['Admin-rasw-dropdown-item']}
                        onClick={() => handleJobRoleSelect(jobRole)}
                      >
                        {jobRole}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Start Date dropdown */}
              <div className={styles['Admin-rasw-dropdown-wrapper']}>
                <div 
                  className={`${styles['Admin-rasw-dropdown-header']} ${!selectedCompanyJob ? styles['Admin-rasw-dropdown-disabled'] : ''}`}
                  onClick={() => selectedCompanyJob && setIsStartDateOpen(!isStartDateOpen)}
                >
                  <span>{startDate ? formatDisplayDate(startDate) : 'Start Date'}</span>
                  <span className={styles['Admin-rasw-dropdown-arrow']}>{isStartDateOpen ? '▲' : '▼'}</span>
                </div>
                {isStartDateOpen && selectedCompanyJob && (
                  <div className={styles['Admin-rasw-dropdown-menu']}>
                    {availableDates.map((dateObj, index) => (
                      <div
                        key={index}
                        className={styles['Admin-rasw-dropdown-item']}
                        onClick={() => handleStartDateSelect(dateObj)}
                      >
                        {formatDisplayDate(dateObj.date)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* End Date - Auto-populated from selected drive */}
              <div className={styles['Admin-rasw-dropdown-wrapper']}>
                <div 
                  className={`${styles['Admin-rasw-dropdown-header']} ${styles['Admin-rasw-dropdown-disabled']}`}
                  style={{ cursor: 'default', opacity: 0.9 }}
                  title="End date is automatically set based on the selected drive"
                >
                  <span>{endDate ? formatDisplayDate(endDate) : 'End Date'}</span>
                </div>
              </div>
            </div>

            {/* UPDATED CLASSES: Admin-rasw-search-row, Admin-rasw-select-label, Admin-rasw-select-type-dropdown, Admin-rasw-search-input-field */}
            <div className={styles['Admin-rasw-search-row']}> 
              <input 
                type="text" 
                placeholder="Enter Name / Register Number" 
                className={styles['Admin-rasw-name-register-input']} 
                value={nameRegisterInput} 
                onChange={(e) => { setNameRegisterInput(e.target.value); setSearchError(''); }}
              />
              <select 
                className={styles['Admin-rasw-branch-dropdown']} 
                value={branchFilter} 
                onChange={(e) => { setBranchFilter(e.target.value); setSearchError(''); }}
              >
                {availableBranches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
              <div className={styles['Admin-rasw-select-label']}>Select by:</div>
              <select className={styles['Admin-rasw-select-type-dropdown']} value={searchType} onChange={(e) => { setSearchType(e.target.value); setSearchError(''); }}>
                <option value="Mobile number">Mobile number</option> 
                <option value="Email">Email</option>
              </select>
              <input 
                type="text" 
                placeholder={searchType === 'Mobile number' ? 'Enter Mobile Number' : 'Enter Email'} 
                className={styles['Admin-rasw-search-input-field']} 
                value={searchInput} 
                onChange={(e) => { setSearchInput(e.target.value); setSearchError(''); }}
              />
            </div>
            {searchError && <div style={{ color: 'red', fontSize: '0.9rem', marginTop: '4px', paddingLeft: '95px' }}>{searchError}</div>}
          </div>
        
          {/* UPDATED CLASS: Admin-rasw-table-section */}
          <div className={styles['Admin-rasw-table-section']}>
            {/* UPDATED CLASSES for table header row, actions, print button */}
            <div className={styles['Admin-rasw-table-header-row']}>
              <div className={styles['Admin-rasw-table-title']}>STUDENT WISE ANALYSIS</div>
              <div className={styles['Admin-rasw-table-actions']}>
                <div className={styles['Admin-rasw-print-button-container']}>
                  <button 
                    className={styles['Admin-rasw-print-btn-green']} 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                  >
                    Print
                  </button>
                  {showExportMenu && (
                    <div className={styles['Admin-rasw-export-menu']}>
                      <button onClick={exportToExcel}>Export to Excel</button>
                      <button onClick={exportToPDF}>Export to PDF</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* UPDATED CLASSES for table structure, headers, body, and status cells */}
            <div className={styles['Admin-rasw-table-body-scroll']}>
              <table className={styles['Admin-rasw-data-table']}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Name</th>
                    <th>Register</th>
                    <th>Branch</th>
                    <th>Year</th>
                    <th>Reached</th>
                    <th>Mobile</th>
                    <th>Email</th>
                    <th>View</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr className={styles['Admin-rasw-loading-row']}>
                      <td colSpan="9" className={styles['Admin-rasw-loading-cell']}>
                        <div className={styles['Admin-rasw-loading-wrapper']}>
                          <div className={styles['Admin-rasw-spinner']}></div>
                          <span className={styles['Admin-rasw-loading-text']}>Loading students…</span>
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
                        <td>{student.Email}</td>
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
                        No students found matching the current filters.
                      </td>
                    </tr>
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

export default AdminRASW;