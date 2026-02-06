import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import CoordReportanalysis from "../assets/CoordReportanalysis.svg";
import CoodCompanyDriveMonths from "../assets/coodCompanyDriveMonths.svg";
import CoodcompanyDriveNOD from "../assets/CoodcompanyDriveNOD.svg";
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

const ExportProgressPopup = ({ isOpen, operation, progress, onClose }) => {
  if (!isOpen) return null;
  
  const operationText = operation === 'excel' ? 'Exporting...' : 'Downloading...';
  const progressText = operation === 'excel' ? 'Exported' : 'Downloaded';
  
  // Calculate the stroke-dasharray for circular progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
      <div className={styles['co-cd-export-popup-overlay']}>
          <div className={styles['co-cd-export-popup-container']}>
              <div className={styles['co-cd-export-popup-header']}>{operationText}</div>
              <div className={styles['co-cd-export-popup-body']}>
                  <div className={styles['co-cd-export-progress-circle']}>
                      <svg width="100" height="100" viewBox="0 0 100 100">
                          {/* Background circle */}
                          <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke="#e0e0e0"
                              strokeWidth="8"
                          />
                          {/* Progress circle */}
                          <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke="#d23b42"
                              strokeWidth="8"
                              strokeDasharray={circumference}
                              strokeDashoffset={offset}
                              strokeLinecap="round"
                              transform="rotate(-90 50 50)"
                              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                          />
                      </svg>
                     {/* <div className={styles['co-cd-export-progress-text']}>{progress}%</div> */}
                  </div>
                  <h2 className={styles['co-cd-export-popup-title']}>{progressText} {progress}%</h2>
                  <p className={styles['co-cd-export-popup-message']}>
                      The Details have been {operation === 'excel' ? 'Exporting...' : 'Downloading...'}
                  </p>
                  <p className={styles['co-cd-export-popup-message']}>Please wait...</p>
              </div>
          </div>
      </div>
  );
};

const ExportSuccessPopup = ({ isOpen, operation, onClose }) => {
  if (!isOpen) return null;
  
  const title = operation === 'excel' ? 'Exported To Excel ✓' : 'PDF Downloaded ✓';
  const message = operation === 'excel' 
      ? 'The Details have been Successfully Exported to Excel in your device.'
      : 'The Details have been Successfully Downloaded as PDF to your device.';
  const headerText = operation === 'excel' ? 'Exported!' : 'Downloaded!';
  
  return (
      <div className={styles['co-cd-export-popup-overlay']}>
          <div className={styles['co-cd-export-popup-container']}>
              <div className={styles['co-cd-export-popup-header']}>{headerText}</div>
              <div className={styles['co-cd-export-popup-body']}>
                  <div className={styles['co-cd-export-success-icon']}>
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox="0 0 52 52" fill="none">
                        <circle className={styles['co-cd-success-icon--circle']} cx="26" cy="26" r="25"/>
                        <path className={styles['co-cd-success-icon--check']} d="M14.1 27.2l7.1 7.2 16.7-16.8" fill="none"
                            />
                        </svg>
                  </div>
                  <h2 className={styles['co-cd-export-popup-title']}>{title}</h2>
                  <p className={styles['co-cd-export-popup-message']}>{message}</p>
              </div>
              <div className={styles['co-cd-export-popup-footer']}>
                  <button onClick={onClose} className={styles['co-cd-export-popup-close-btn']}>Close</button>
              </div>
          </div>
      </div>
  );
};

const ExportFailedPopup = ({ isOpen, operation, onClose }) => {
  if (!isOpen) return null;
  
  const title = operation === 'excel' ? 'Exported Failed!' : 'Downloaded Failed!';
  const message = operation === 'excel'
      ? 'The Details have been Successfully Exported to Excel in your device.'
      : 'The Details have been Successfully Downloaded as PDF to your device.';
  const headerText = operation === 'excel' ? 'Exported!' : 'Downloaded!';
  
  return (
      <div className={styles['co-cd-export-popup-overlay']}>
          <div className={styles['co-cd-export-popup-container']}>
              <div className={styles['co-cd-export-popup-header']}>{headerText}</div>
              <div className={styles['co-cd-export-popup-body']}>
                  <div className={styles['co-cd-export-failed-icon']}>
                      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                          <circle cx="40" cy="40" r="38" fill="#dc3545" />
                          <path
                              d="M30 30 L50 50 M50 30 L30 50"
                              stroke="white"
                              strokeWidth="4"
                              strokeLinecap="round"
                          />
                      </svg>
                  </div>
                  <h2 className={styles['co-cd-export-popup-title']}>{title}</h2>
                  <p className={styles['co-cd-export-popup-message']}>{message}</p>
              </div>
              <div className={styles['co-cd-export-popup-footer']}>
                  <button onClick={onClose} className={styles['co-cd-export-popup-close-btn']}>Close</button>
              </div>
          </div>
      </div>
  );
};


// === Example company data! Add/remove as needed ===
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
  const [companiesDrives, setCompaniesDrives] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [coordinatorBranch, setCoordinatorBranch] = useState('');

  // State for search filters
  const [filters, setFilters] = useState({
    company: '',
    domain: '',
    department: '',
    mode: ''
  });
  const [activeItem, setActiveItem] = useState("Company Drive");
  const navigate = useNavigate();
  const [showExportMenu, setShowExportMenu] = useState(false);

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
      const domain = (drive.domain || '').toLowerCase();
      const branch = (drive.branch || drive.department || '').toLowerCase();
      const mode = (drive.mode || '').toLowerCase();

      return (
        companyName.includes((filters.company || '').toLowerCase()) &&
        domain.includes((filters.domain || '').toLowerCase()) &&
        branch.includes((filters.department || '').toLowerCase()) &&
        mode.includes((filters.mode || '').toLowerCase())
      );
    });
  }, [companiesDrives, filters]);

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
  
    // Show progress popup
    setExportPopupState({
        isOpen: true,
        type: 'progress',
        operation: operation,
        progress: 0
    });

    let progressInterval;
    let progressTimeout;

    try {
        // Simulate progress from 0 to 100
        progressInterval = setInterval(() => {
            setExportPopupState(prev => {
                if (prev.progress < 100 && prev.type === 'progress') {
                    return { ...prev, progress: Math.min(prev.progress + 10, 100) };
                }
                return prev;
            });
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
        
        // Show success popup
        setExportPopupState({
            isOpen: true,
            type: 'success',
            operation: operation,
            progress: 100
        });
    } catch (error) {
        if (progressInterval) clearInterval(progressInterval);
        if (progressTimeout) clearTimeout(progressTimeout);
        
        // Show failed popup
        setExportPopupState({
            isOpen: true,
            type: 'failed',
            operation: operation,
            progress: 0
        });
    }
  };

  const exportToExcel = () => {
    try{
    const header = ["S.No", "Company", "Domain", "Job Role", "Branch", "Mode", "Status", "Visit Date", "Package", "Location"];
    const data = filteredData.map((item, index) => [
        index + 1,
        item.company,
        item.domain,
        item.jobRole,
        item.branch,
        item.mode,
        item.status,
        item.visitDate,
        item.package,
        item.location
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
    const tableColumn = ["S.No", "Company", "Domain", "Job Role", "Branch", "Mode", "Status", "Visit Date", "Package", "Location"];
  
    // Prepare the data rows from your filtered data
    const tableRows = filteredData.map((item, index) => [
        index + 1,
        item.company,
        item.domain,
        item.jobRole,
        item.branch,
        item.mode,
        item.status,
        item.visitDate,
        item.package,
        item.location
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
            4: { halign: 'center', cellWidth: 20 },
            5: { halign: 'center', cellWidth: 15 },
            6: { halign: 'center', cellWidth: 15 },
            7: { halign: 'center', cellWidth: 20 },
            8: { halign: 'center', cellWidth: 15 },
            9: { halign: 'left', cellWidth: 'auto' }
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

  const [exportPopupState, setExportPopupState] = useState({
    isOpen: false,
    type: null, // 'progress', 'success', 'failed'
    operation: null, // 'excel', 'pdf'
    progress: 0
  });

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
                    <input
                      id="co-cd-search-company"
                      className={styles['co-cd-search-filter-card__input']}
                      value={filters.company}
                      onChange={(e) => handleFilterChange('company', e.target.value)}
                      required
                    />
                    <label htmlFor="co-cd-search-company" className={styles['co-cd-search-filter-card__label']}>
                      Search Company
                    </label>
                  </div>

                  {/* Domain Search Input */}
                  <div className={styles['co-cd-search-filter-card__input-wrapper']}>
                    <input
                      id="co-cd-search-domain"
                      className={styles['co-cd-search-filter-card__input']}
                      value={filters.domain}
                      onChange={(e) => handleFilterChange('domain', e.target.value)}
                      required
                    />
                    <label htmlFor="co-cd-search-domain" id="domain" className={styles['co-cd-search-filter-card__label']}>
                      Search Domain
                    </label>
                  </div>
                </div>
                <div className={styles['co-cd-search-filter-card__fields-row']}>

                  {/* Department Search Input */}
                  <div className={styles['co-cd-search-filter-card__input-wrapper']}>
                    <input
                      id="co-cd-search-department"
                      className={styles['co-cd-search-filter-card__input']}
                      value={filters.department}
                      onChange={(e) => handleFilterChange('department', e.target.value)}
                      required
                    />
                    <label htmlFor="co-cd-search-department" className={styles['co-cd-search-filter-card__label']}>
                      Search by Branch
                    </label>
                  </div>

                  {/* Mode Search Dropdown */}
                  <div className={styles['co-cd-search-filter-card__input-wrapper']}>
                    <select
                      id="co-cd-search-mode"
                      className={styles['co-cd-search-filter-card__input']} 
                      style={{ width: '280px' }}
                      value={filters.mode}
                      onChange={(e) => handleFilterChange('mode', e.target.value)}
                      required
                    >
                      <option  value=""></option>
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                    <label htmlFor="co-cd-search-mode" className={styles['co-cd-search-filter-card__label']}>
                     Search by Mode
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
                  const driveDate = new Date(d.startingDate || d.visitDate);
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
    <th>Other Branches</th>
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
            <td>{Array.isArray(item.eligibleBranches) ? item.eligibleBranches.join(', ') : (item.branch || item.department || '—')}</td>
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
       {/* Export Popups */}
       {exportPopupState.isOpen && exportPopupState.type === 'progress' && (
                <ExportProgressPopup
                    isOpen={true}
                    operation={exportPopupState.operation}
                    progress={exportPopupState.progress}
                    onClose={() => {}}
                />
            )}
            
            {exportPopupState.isOpen && exportPopupState.type === 'success' && (
                <ExportSuccessPopup
                    isOpen={true}
                    operation={exportPopupState.operation}
                    onClose={() => setExportPopupState({ isOpen: false, type: null, operation: null, progress: 0 })}
                />
            )}
            
            {exportPopupState.isOpen && exportPopupState.type === 'failed' && (
                <ExportFailedPopup
                    isOpen={true}
                    operation={exportPopupState.operation}
                    onClose={() => setExportPopupState({ isOpen: false, type: null, operation: null, progress: 0 })}
                />
            )}     
         
    </div>
  );
}