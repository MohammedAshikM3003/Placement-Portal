import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import * as XLSX from 'xlsx'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import "react-datepicker/dist/react-datepicker.css"; 

// Import New Components
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import mongoDBService from '../services/mongoDBService.jsx';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

// Import CSS Files
import styles from './Coo_ReportAnalysisSW.module.css';

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

function ReportAnalysisSW({ onLogout, onViewChange }) {
  useCoordinatorAuth(); // JWT authentication verification
  
  const navigate = useNavigate();
  
  const [allData, setAllData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [coordinatorBranch, setCoordinatorBranch] = useState('');
  
  const [searchType, setSearchType] = useState('Mobile number');
  const [searchInput, setSearchInput] = useState('');
  const [nameRegisterInput, setNameRegisterInput] = useState('');
  const [branchFilter, setBranchFilter] = useState('All Branches');
  const [availableBranches, setAvailableBranches] = useState(['All Branches']);
  const [searchError, setSearchError] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Additional filter states
  const [companyFilter, setCompanyFilter] = useState('Select Company');
  const [jobRoleFilter, setJobRoleFilter] = useState('Job Role');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [availableCompanies, setAvailableCompanies] = useState(['Select Company']);
  const [availableJobRoles, setAvailableJobRoles] = useState(['Job Role']);
  const [availableDates, setAvailableDates] = useState([]);
  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isJobRoleOpen, setIsJobRoleOpen] = useState(false);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  
  // Export popup states
  const [exportPopupState, setExportPopupState] = useState('none');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('Excel');

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

  // Fetch coordinator's branch and company data on mount
  useEffect(() => {
    const coordinatorData = readStoredCoordinatorData();
    const branch = resolveCoordinatorDepartment(coordinatorData);
    
    if (branch) {
      setCoordinatorBranch(branch);
      console.log('[Coo_ReportAnalysisSW] Coordinator branch:', branch);
    }
    
    // Fetch companies and job roles for dropdowns
    const fetchCompanyData = async () => {
      try {
        const drivesData = await mongoDBService.getCompanyDrives();
        if (drivesData && drivesData.length > 0) {
          const companies = [...new Set(drivesData.map(d => d.companyName).filter(Boolean))];
          const jobRoles = [...new Set(drivesData.map(d => d.jobRole).filter(Boolean))];
          const dates = [...new Set(drivesData.map(d => d.startingDate || d.driveStartDate || d.companyDriveDate).filter(Boolean))]
            .sort((a, b) => new Date(a) - new Date(b));
          setAvailableCompanies(companies);
          setAvailableJobRoles(jobRoles);
          setAvailableDates(dates);
        }
      } catch (error) {
        console.error('[Coo_ReportAnalysisSW] Error fetching company data:', error);
      }
    };
    
    fetchCompanyData();
  }, []);

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
      
        console.log('[Coo_ReportAnalysisSW] Filter - Raw reports data:', response);
        
        if (response.success && response.data) {
          // Show ALL students (passed and failed)
          const allStudents = response.data;
          
          console.log(`[Coo_ReportAnalysisSW] Total reports: ${response.data.length}`);
          
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
          
          // Filter by coordinator's branch FIRST - critical for security
          if (coordinatorBranch) {
            console.log(`[Coo_ReportAnalysisSW] Filtering by coordinator branch: ${coordinatorBranch}`);
            matchingStudents = matchingStudents.filter(item => {
              const studentBranch = (item.department || item.branch || '').toUpperCase();
              return studentBranch === coordinatorBranch;
            });
            console.log(`[Coo_ReportAnalysisSW] After coordinator branch filter: ${matchingStudents.length} students`);
          }
          
          // Filter by branch dropdown if selected (and not "All Branches")
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
          
          // Filter by company if selected
          if (companyFilter !== 'Select Company' && companyFilter) {
            matchingStudents = matchingStudents.filter(item => {
              const company = (item.companyName || '').toLowerCase();
              return company === companyFilter.toLowerCase();
            });
          }
          
          // Filter by job role if selected
          if (jobRoleFilter !== 'Job Role' && jobRoleFilter) {
            matchingStudents = matchingStudents.filter(item => {
              const jobRole = (item.jobRole || '').toLowerCase();
              return jobRole === jobRoleFilter.toLowerCase();
            });
          }
          
          // Filter by start date if provided
          if (startDateFilter) {
            matchingStudents = matchingStudents.filter(item => {
              if (!item.date) return false;
              const itemDate = new Date(item.date).setHours(0, 0, 0, 0);
              const filterDate = new Date(startDateFilter).setHours(0, 0, 0, 0);
              return itemDate >= filterDate;
            });
          }
          
          // Filter by end date if provided
          if (endDateFilter) {
            matchingStudents = matchingStudents.filter(item => {
              if (!item.date) return false;
              const itemDate = new Date(item.date).setHours(0, 0, 0, 0);
              const filterDate = new Date(endDateFilter).setHours(0, 0, 0, 0);
              return itemDate <= filterDate;
            });
          }
        
          console.log(`[Coo_ReportAnalysisSW] Matching students: ${matchingStudents.length}`);
          
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
          
          console.log('[Coo_ReportAnalysisSW] Transformed data:', transformedData.length, 'records');
          
          setAllData(transformedData);
          setFilteredData(transformedData);
        } else {
          console.error('[Coo_ReportAnalysisSW] No reports data found in response');
          setAllData([]);
          setFilteredData([]);
          setAvailableBranches(['All Branches']);
        }
      } catch (error) {
        console.error('[Coo_ReportAnalysisSW] Error filtering students:', error);
        setAllData([]);
        setFilteredData([]);
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
  }, [searchInput, nameRegisterInput, branchFilter, searchType, coordinatorBranch, companyFilter, jobRoleFilter, startDateFilter, endDateFilter]);

  // Extract branches whenever allData changes (but only show coordinator's branch)
  useEffect(() => {
    if (allData.length > 0 && coordinatorBranch) {
      // For coordinator, only show their branch (no multi-branch selection)
      setAvailableBranches([coordinatorBranch]);
      setBranchFilter(coordinatorBranch);
    } else {
      setAvailableBranches(['All Branches']);
    }
  }, [allData, coordinatorBranch]);

  // Export to Excel function
  const exportToExcel = async () => {
    try {
      setExportType('Excel');
      setExportPopupState('progress');
      setExportProgress(0);
      setShowExportMenu(false);

      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 100);

      // Prepare data for export
      const dataToExport = filteredData.map((student, index) => ({
        'S.No': index + 1,
        'Name': student["Student Name"],
        'Register': student["Register No."],
        'Branch': student.Department,
        'Year': `${calculateYearRoman(student.Batch)} - ${student.Section}`,
        'Reached': student.Rounds,
        'Mobile': student["Mobile No."],
        'Email': student.Email
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Student wise Analysis');

      clearInterval(progressInterval);
      setExportProgress(100);

      setTimeout(() => {
        XLSX.writeFile(workbook, 'Coordinator_Student_wise_Analysis.xlsx');
        setExportPopupState('success');
      }, 500);
    } catch (error) {
      console.error('Export to Excel failed:', error);
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

      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 100);

      const doc = new jsPDF('l', 'mm', 'a4');
      
      doc.setFontSize(18);
      doc.setTextColor(210, 59, 66);
      doc.text('Student wise Analysis', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

      const tableData = filteredData.map((student, index) => [
        index + 1,
        student["Student Name"],
        student["Register No."],
        student.Department,
        `${calculateYearRoman(student.Batch)} - ${student.Section}`,
        student.Rounds,
        student["Mobile No."],
        student.Email
      ]);

      autoTable(doc, {
        head: [['S.No', 'Name', 'Register', 'Branch', 'Year', 'Reached', 'Mobile', 'Email']],
        body: tableData,
        startY: 25,
        theme: 'grid',
        headStyles: {
          fillColor: [210, 59, 66],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3
        }
      });

      clearInterval(progressInterval);
      setExportProgress(100);

      setTimeout(() => {
        doc.save('Coordinator_Student_wise_Analysis.pdf');
        setExportPopupState('success');
      }, 500);
    } catch (error) {
      console.error('Export to PDF failed:', error);
      setExportPopupState('failed');
    }
  };

  const navigateToRoundAnalysis = () => {
    navigate('/coo-report-analysis');
  };

  const navigateToCompanyAnalysis = () => {
    navigate('/coo-report-analysis-cw'); 
  };
  
  // Format date for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear());
      return `${day}-${month}-${year}`;
    } catch (error) {
      return String(dateString);
    }
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Effect to close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      if (!target.closest('[data-dropdown]') && !target.closest('[data-export-menu]')) {
        setIsCompanyOpen(false);
        setIsJobRoleOpen(false);
        setIsStartDateOpen(false);
        setIsEndDateOpen(false);
        setShowExportMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return ( 
    <>
      <Navbar onToggleSidebar={toggleSidebar} /> 
      <div className={styles["co-layout"]}>
        <Sidebar
          isOpen={isSidebarOpen}
          onLogout={onLogout}
          currentView="report-analysis"
          onViewChange={onViewChange}
        />
        <div className={styles["co-main-content"]}>
          <div className={styles["co-rat-filter-box"]}>
            <div className={styles["co-rat-tab-container"]}>
              <div className={styles["co-rat-tab-inactive"]} onClick={navigateToRoundAnalysis}>Round&nbsp;wise<br /> Analysis</div>
              <div className={styles["co-rat-tab-inactive"]} onClick={navigateToCompanyAnalysis}>Company&nbsp;wise<br /> Analysis</div>
              <div className={styles["co-rat-tab-active"]}>Student&nbsp;wise<br /> Analysis</div>
            </div>

            {/* First Search Row - Company, Job Role, Dates */}
            <div className={styles["co-rat-filter-inputs"]}>
              <div className={styles["co-rat-dropdown-wrapper"]} data-dropdown="company">
                <div 
                  className={styles["co-rat-dropdown-header"]} 
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('[Dropdown] Company clicked, current state:', isCompanyOpen);
                    console.log('[Dropdown] Available companies:', availableCompanies);
                    setIsCompanyOpen(!isCompanyOpen);
                    setIsJobRoleOpen(false);
                    setIsStartDateOpen(false);
                    setIsEndDateOpen(false);
                  }}
                >
                  <span>{companyFilter || 'Select Company'}</span>
                  <span className={styles["co-rat-dropdown-arrow"]}>{isCompanyOpen ? '▲' : '▼'}</span>
                </div>
                {isCompanyOpen && (
                  <div className={styles["co-rat-dropdown-menu"]}>
                    <div
                      className={styles["co-rat-dropdown-item"]}
                      onClick={(e) => { e.stopPropagation(); setCompanyFilter('Select Company'); setIsCompanyOpen(false); }}
                    >
                      Select Company
                    </div>
                    {availableCompanies.map((company, index) => (
                      <div
                        key={index}
                        className={styles["co-rat-dropdown-item"]}
                        onClick={(e) => { e.stopPropagation(); setCompanyFilter(company); setIsCompanyOpen(false); }}
                      >
                        {company}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles["co-rat-dropdown-wrapper"]} data-dropdown="jobrole">
                <div 
                  className={styles["co-rat-dropdown-header"]}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('[Dropdown] Job Role clicked, current state:', isJobRoleOpen);
                    console.log('[Dropdown] Available job roles:', availableJobRoles);
                    setIsJobRoleOpen(!isJobRoleOpen);
                    setIsCompanyOpen(false);
                    setIsStartDateOpen(false);
                    setIsEndDateOpen(false);
                  }}
                >
                  <span>{jobRoleFilter || 'Job Role'}</span>
                  <span className={styles["co-rat-dropdown-arrow"]}>{isJobRoleOpen ? '▲' : '▼'}</span>
                </div>
                {isJobRoleOpen && (
                  <div className={styles["co-rat-dropdown-menu"]}>
                    <div
                      className={styles["co-rat-dropdown-item"]}
                      onClick={(e) => { e.stopPropagation(); setJobRoleFilter('Job Role'); setIsJobRoleOpen(false); }}
                    >
                      Job Role
                    </div>
                    {availableJobRoles.map((role, index) => (
                      <div
                        key={index}
                        className={styles["co-rat-dropdown-item"]}
                        onClick={(e) => { e.stopPropagation(); setJobRoleFilter(role); setIsJobRoleOpen(false); }}
                      >
                        {role}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles["co-rat-dropdown-wrapper"]} data-dropdown="startdate">
                <div 
                  className={styles["co-rat-dropdown-header"]}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsStartDateOpen(!isStartDateOpen);
                    setIsCompanyOpen(false);
                    setIsJobRoleOpen(false);
                    setIsEndDateOpen(false);
                  }}
                >
                  <span>{startDateFilter ? formatDisplayDate(startDateFilter) : 'Start Date'}</span>
                  <span className={styles["co-rat-dropdown-arrow"]}>{isStartDateOpen ? '▲' : '▼'}</span>
                </div>
                {isStartDateOpen && (
                  <div className={styles["co-rat-dropdown-menu"]}>
                    <div
                      className={styles["co-rat-dropdown-item"]}
                      onClick={(e) => { e.stopPropagation(); setStartDateFilter(''); setIsStartDateOpen(false); }}
                    >
                      Start Date
                    </div>
                    {availableDates.map((date, index) => (
                      <div
                        key={index}
                        className={styles["co-rat-dropdown-item"]}
                        onClick={(e) => { e.stopPropagation(); setStartDateFilter(date); setIsStartDateOpen(false); }}
                      >
                        {formatDisplayDate(date)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles["co-rat-dropdown-wrapper"]} data-dropdown="enddate">
                <div 
                  className={styles["co-rat-dropdown-header"]}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEndDateOpen(!isEndDateOpen);
                    setIsCompanyOpen(false);
                    setIsJobRoleOpen(false);
                    setIsStartDateOpen(false);
                  }}
                >
                  <span>{endDateFilter ? formatDisplayDate(endDateFilter) : 'End Date'}</span>
                  <span className={styles["co-rat-dropdown-arrow"]}>{isEndDateOpen ? '▲' : '▼'}</span>
                </div>
                {isEndDateOpen && (
                  <div className={styles["co-rat-dropdown-menu"]}>
                    <div
                      className={styles["co-rat-dropdown-item"]}
                      onClick={(e) => { e.stopPropagation(); setEndDateFilter(''); setIsEndDateOpen(false); }}
                    >
                      End Date
                    </div>
                    {availableDates.map((date, index) => (
                      <div
                        key={index}
                        className={styles["co-rat-dropdown-item"]}
                        onClick={(e) => { e.stopPropagation(); setEndDateFilter(date); setIsEndDateOpen(false); }}
                      >
                        {formatDisplayDate(date)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Second Search Row - Name, Branch, Mobile/Email */}
            <div className={styles["co-rat-search-row"]}>
              <input 
                type="text" 
                placeholder="Enter Name / Register Number" 
                className={styles["co-rat-name-register-input"]} 
                value={nameRegisterInput} 
                onChange={(e) => { setNameRegisterInput(e.target.value); setSearchError(''); }}
              />
              <select 
                className={styles["co-rat-branch-dropdown"]} 
                value={branchFilter} 
                onChange={(e) => { setBranchFilter(e.target.value); setSearchError(''); }}
                disabled={availableBranches.length === 1}
              >
                {availableBranches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
              <div className={styles["co-rat-select-label"]}>Select by:</div>
              <select 
                className={styles["co-rat-select-type-dropdown"]} 
                value={searchType} 
                onChange={(e) => { setSearchType(e.target.value); setSearchError(''); }}
              >
                <option value="Mobile number">Mobile number</option>
                <option value="Email">Email</option>
              </select>
              <input 
                type="text" 
                placeholder={searchType === 'Mobile number' ? 'Enter Mobile Number' : 'Enter Email'} 
                className={styles["co-rat-search-input-field"]} 
                value={searchInput} 
                onChange={(e) => { setSearchInput(e.target.value); setSearchError(''); }}
              />
            </div>
            {searchError && <div style={{ color: 'red', fontSize: '0.9rem', marginTop: '4px', paddingLeft: '95px' }}>{searchError}</div>}
          </div>

          <div className={styles["co-rat-table-section"]}>
            <div className={styles["co-rat-table-header-row"]}>
              <div className={styles["co-rat-table-title"]}>STUDENT WISE ANALYSIS</div>
              <div className={styles["co-rat-table-actions"]}>
                <div className={styles["co-rat-print-button-container"]} data-export-menu="true">
                  <button 
                    className={styles["co-rat-print-btn-green"]} 
                    onClick={(e) => { e.stopPropagation(); setShowExportMenu(!showExportMenu); }}
                  >
                    Print
                  </button>
                  {showExportMenu && (
                    <div className={styles["co-rat-export-menu"]} data-export-menu="true">
                      <button onClick={(e) => { e.stopPropagation(); exportToExcel(); }}>Export to Excel</button>
                      <button onClick={(e) => { e.stopPropagation(); exportToPDF(); }}>Export to PDF</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles["co-rat-table-body-scroll"]}>
              <table className={styles["co-rat-data-table"]}>
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
                <tbody className={styles["co-rat-table-body"]}>
                  {isLoading ? (
                    <tr className={styles["co-rat-loading-row"]}>
                      <td colSpan="9" className={styles["co-rat-loading-cell"]}>
                        <div className={styles["co-rat-loading-wrapper"]}>
                          <div className={styles["co-rat-spinner"]}></div>
                          <span className={styles["co-rat-loading-text"]}>Loading students…</span>
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
                            navigate(`/coordinator-profile/${student.studentId}`);
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

export default ReportAnalysisSW;