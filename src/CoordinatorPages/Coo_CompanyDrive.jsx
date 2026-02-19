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
    jobRole: '',
    startDate: '',
    endDate: ''
  });
  const [activeItem, setActiveItem] = useState("Company Drive");
  const navigate = useNavigate();
  const [showExportMenu, setShowExportMenu] = useState(false);

  const toISODate = useCallback((dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  }, []);

  // Helper to format ISO date (yyyy-mm-dd) to display format (dd-mm-yyyy)
  const formatISODateToDisplay = (isoDate) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
  };

  const uniqueStartDates = useMemo(() => {
    const set = new Set();
    companiesDrives.forEach(d => {
      const iso = toISODate(d.startingDate || d.driveStartDate || d.companyDriveDate || d.visitDate);
      if (iso) set.add(iso);
    });
    return Array.from(set).sort();
  }, [companiesDrives, toISODate]);

  const uniqueCompanies = useMemo(() => {
    const set = new Set();
    companiesDrives.forEach(d => {
      const name = (d.companyName || d.company || '').toString().trim();
      if (name) set.add(name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [companiesDrives]);

  const jobRolesForSelectedCompany = useMemo(() => {
    const set = new Set();
    companiesDrives
      .filter(d => {
        const name = (d.companyName || d.company || '').toString().trim();
        if (!filters.company) return true;
        return name === filters.company;
      })
      .forEach(d => {
        const role = (d.jobRole || d.role || d.domain || '').toString().trim();
        if (role) set.add(role);
      });

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [companiesDrives, filters.company]);

  const uniqueEndDatesForSelectedStart = useMemo(() => {
    if (!filters.startDate) return [];
    const set = new Set();
    companiesDrives.forEach(d => {
      const startIso = toISODate(d.startingDate || d.driveStartDate || d.companyDriveDate || d.visitDate);
      if (startIso !== filters.startDate) return;
      const endIso = toISODate(d.endDate || d.endingDate || d.driveEndDate);
      if (endIso) set.add(endIso);
    });
    return Array.from(set).sort();
  }, [companiesDrives, filters.startDate, toISODate]);

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
        
        console.log(`Drive ${drive.companyName} - ${drive.jobRole}:`, {
          eligibleBranches: drive.eligibleBranches,
          parsed: driveBranches,
          coordinatorBranch: branch,
          matchesBranch
        });
        
        return matchesBranch;
      });
      
      console.log(`Filtered ${branchDrives.length} drives out of ${allDrives.length} for branch ${branch}`);
      setCompaniesDrives(branchDrives);
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

    return companiesDrives.filter(drive => {
      const companyName = (drive.companyName || drive.company || '').toLowerCase();
      const jobRole = (drive.jobRole || drive.role || drive.domain || '').toLowerCase();
      const startIso = toISODate(drive.startingDate || drive.driveStartDate || drive.companyDriveDate || drive.visitDate);
      const endIso = toISODate(drive.endDate || drive.endingDate || drive.driveEndDate);

      return (
        companyName.includes((filters.company || '').toLowerCase()) &&
        jobRole.includes((filters.jobRole || '').toLowerCase()) &&
        (!filters.startDate || startIso === filters.startDate) &&
        (!filters.endDate || endIso === filters.endDate)
      );
    });
  }, [companiesDrives, filters, toISODate]);

  // Old filtering logic removed - now using useMemo above
  const __unused_old_filtering = () => {
    let filtered = [...sampleCompanyData];

    if (filters.company && filters.company.trim()) {
      filtered = filtered.filter(item =>
        item.company.toLowerCase().includes(filters.company.toLowerCase().trim())
      );
    }

    // Old filtering logic - replaced by useMemo above
    return null;
  };

  // Handle input changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStartDateChange = (value) => {
    setFilters(prev => {
      const next = { ...prev, startDate: value };
      if (!value) {
        next.endDate = '';
        return next;
      }

      const matchingEndDates = companiesDrives
        .filter(d => {
          const startIso = toISODate(d.startingDate || d.driveStartDate || d.companyDriveDate || d.visitDate);
          return startIso === value;
        })
        .map(d => toISODate(d.endDate || d.endingDate || d.driveEndDate))
        .filter(Boolean)
        .sort();

      next.endDate = matchingEndDates[0] || '';
      return next;
    });
  };

  const handleCompanyChange = (value) => {
    setFilters(prev => {
      const next = { ...prev, company: value };

      const rolesForCompany = companiesDrives
        .filter(d => {
          const name = (d.companyName || d.company || '').toString().trim();
          if (!value) return true;
          return name === value;
        })
        .map(d => (d.jobRole || d.role || d.domain || '').toString().trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));

      next.jobRole = rolesForCompany[0] || '';
      return next;
    });
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
        <Sidebar  isOpen={isSidebarOpen} onLogout={onLogout} currentView="company-drive" onViewChange={onViewChange} />
          
        
        {/* --- MAIN CONTENT --- */}
        <div className={styles['co-cd-main-content']}>
          {/* Top Cards Row */}
          <div className={styles['co-cd-top-cards-row']}>

            {/* 1: Report Analysis Card */}
            <div className={`${styles['co-cd-card']} ${styles['co-cd-report-analysis-card']}`}  onClick={() => handleCardClick('report-analysis')} >
              <img src={CoordReportanalysis} alt="Report Analysis" className={styles['co-cd-report-analysis-card__image']} />
              <span className={styles['co-cd-report-analysis-card__title']}>Report Analysis</span>
              <span className={styles['co-cd-report-analysis-card__description']}>Tracks eligibility,<br/>applications, and selections</span>
            </div>

            {/* 2: Company Drive Search Card */}
            <div className={styles['co-cd-search-filter-card']}>
              <div className={styles['co-cd-search-filter-card__tabs-container']}>
                <button className={styles['co-cd-search-filter-card__tab-button']}>Company Drive</button>
              </div>
              <div className={styles['co-cd-search-filter-card__fields-container']}>
                <div className={styles['co-cd-search-filter-card__fields-row']}>

                  {/* Company Search Input */}
                  <div className={styles['co-cd-search-filter-card__input-wrapper']}>
                    <select
                      id="co-cd-search-company"
                      className={styles['co-cd-search-filter-card__input']}
                      value={filters.company}
                      onChange={(e) => handleCompanyChange(e.target.value)}
                      required
                    >
                      <option value=""></option>
                      {uniqueCompanies.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <label htmlFor="co-cd-search-company" className={styles['co-cd-search-filter-card__label']}>
                      Search Company
                    </label>
                  </div>

                  {/* Job Role Search Input */}
                  <div className={styles['co-cd-search-filter-card__input-wrapper']}>
                    <select
                      id="co-cd-search-job-role"
                      className={styles['co-cd-search-filter-card__input']}
                      value={filters.jobRole}
                      onChange={(e) => handleFilterChange('jobRole', e.target.value)}
                      required
                    >
                      <option value=""></option>
                      {jobRolesForSelectedCompany.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <label htmlFor="co-cd-search-job-role" id="jobRole" className={styles['co-cd-search-filter-card__label']}>
                      Search Job Role
                    </label>
                  </div>
                </div>
                <div className={styles['co-cd-search-filter-card__fields-row']}>

                  {/* Start Date Dropdown */}
                  <div className={styles['co-cd-search-filter-card__input-wrapper']}>
                    <select
                      id="co-cd-search-start-date"
                      className={styles['co-cd-search-filter-card__input']}
                      value={filters.startDate}
                      onChange={(e) => handleStartDateChange(e.target.value)}
                      required
                    >
                      <option value=""></option>
                      {uniqueStartDates.map(d => (
                        <option key={d} value={d}>{formatISODateToDisplay(d)}</option>
                      ))}
                    </select>
                    <label htmlFor="co-cd-search-start-date" className={styles['co-cd-search-filter-card__label']}>
                      Start Date
                    </label>
                  </div>

                  {/* End Date Dropdown */}
                  <div className={styles['co-cd-search-filter-card__input-wrapper']}>
                    <select
                      id="co-cd-search-end-date"
                      className={styles['co-cd-search-filter-card__input']} 
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      disabled={!filters.startDate}
                      required
                    >
                      <option value=""></option>
                      {uniqueEndDatesForSelectedStart.map(d => (
                        <option key={d} value={d}>{formatISODateToDisplay(d)}</option>
                      ))}
                    </select>
                    <label htmlFor="co-cd-search-end-date" className={styles['co-cd-search-filter-card__label']}>
                     End Date
                    </label>
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
          <div className={styles['co-cd-print-menu-wrapper']}>
    <button className={styles['co-cd-drive-table-container__print-button']} onClick={toggleExportMenu}>
        Print
    </button>
    {showExportMenu && (
        <div className={styles['co-cd-export-menu']}>
            <div onClick={handleExportToExcel}>Export to Excel</div>
            <div onClick={handleExportToPDF}>Save as PDF</div>
        </div>
    )}
</div>
              <div className={styles['co-cd-drive-table-container__title-bar']}>
                  COMPANY DRIVE
              </div>

              <div className={styles['co-cd-drive-table-container__table-wrapper']} id="co-cd-drive-table-container__table-wrapper">
                  <table>
                  <thead>
    <tr>
    <th>S.No</th>
    <th>Company</th>
    <th>Job Role</th>
    <th>Start Date</th>
    <th>End Date</th>
    <th>Package</th>
    <th>Rounds</th>
    <th>Mode</th>
    <th>View</th>
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
    ) : filteredData.length ? (
      filteredData.map((item, index) => {
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
          <tr key={driveId}>
            <td>{index + 1}</td>
            <td>{item.companyName || item.company || '—'}</td>
            <td>{item.jobRole || '—'}</td>
            <td>{formatDate(item.startingDate || item.driveStartDate || item.companyDriveDate)}</td>
            <td>{formatDate(item.endDate || item.endingDate || item.driveEndDate)}</td>
            <td>{item.package || item.pkg || item.ctc || item.salaryPackage || '—'}</td>
            <td>{item.rounds || '—'}</td>
            <td>{item.mode || '—'}</td>
            <td>
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