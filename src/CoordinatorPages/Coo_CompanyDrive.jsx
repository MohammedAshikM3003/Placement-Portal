import React, { useState } from "react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GiFireRay } from "react-icons/gi";
import { FaEye } from "react-icons/fa"; // Importing the eye icon
import searchcompany from '../assets/seachcompany.png';
import searchbydept from '../assets/SearchbyDepartment.png';
import searchdomain from '../assets/SearchDomain.png';
import searchmode from '../assets/searchMode.png';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import Companyprofile from "../assets/Companyprofile.svg";
import styles from './Coo_CompanyDrive.module.css';
import CoordReportanalysis from "../assets/CompanydriveReportAnalysisicon.svg";
import CompanyProfile from "../assets/CompanyProfileicon.svg";

const cx = (...classNames) => classNames.filter(Boolean).join(' ');

const ExportProgressPopup = ({ isOpen, operation, progress, onClose }) => {
  if (!isOpen) return null;
  
  const operationText = operation === 'excel' ? 'Exporting...' : 'Downloading...';
  const progressText = operation === 'excel' ? 'Exported' : 'Downloaded';
  
  // Calculate the stroke-dasharray for circular progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
      <div className={styles["co-cd-export-popup-overlay"]}>
          <div className={styles["co-cd-export-popup-container"]}>
              <div className={styles["co-cd-export-popup-header"]}>{operationText}</div>
              <div className={styles["co-cd-export-popup-body"]}>
                  <div className={styles["co-cd-export-progress-circle"]}>
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
                     {/* <div className={styles["co-cd-export-progress-text"]}>{progress}%</div> */}
                  </div>
                  <h2 className={styles["co-cd-export-popup-title"]}>{progressText} {progress}%</h2>
                  <p className={styles["co-cd-export-popup-message"]}>
                      The Details have been {operation === 'excel' ? 'Exporting...' : 'Downloading...'}
                  </p>
                  <p className={styles["co-cd-export-popup-message"]}>Please wait...</p>
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
      <div className={styles["co-cd-export-popup-overlay"]}>
          <div className={styles["co-cd-export-popup-container"]}>
              <div className={styles["co-cd-export-popup-header"]}>{headerText}</div>
              <div className={styles["co-cd-export-popup-body"]}>
                  <div className={styles["co-cd-export-success-icon"]}>
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox="0 0 52 52" fill="none">
                        <circle className={styles["co-cd-success-icon--circle"]} cx="26" cy="26" r="25"/>
                        <path className={styles["co-cd-success-icon--check"]} d="M14.1 27.2l7.1 7.2 16.7-16.8" fill="none"
                            />
                        </svg>
                  </div>
                  <h2 className={styles["co-cd-export-popup-title"]}>{title}</h2>
                  <p className={styles["co-cd-export-popup-message"]}>{message}</p>
              </div>
              <div className={styles["co-cd-export-popup-footer"]}>
                  <button onClick={onClose} className={styles["co-cd-export-popup-close-btn"]}>Close</button>
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
      <div className={styles["co-cd-export-popup-overlay"]}>
          <div className={styles["co-cd-export-popup-container"]}>
              <div className={styles["co-cd-export-popup-header"]}>{headerText}</div>
              <div className={styles["co-cd-export-popup-body"]}>
                  <div className={styles["co-cd-export-failed-icon"]}>
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
                  <h2 className={styles["co-cd-export-popup-title"]}>{title}</h2>
                  <p className={styles["co-cd-export-popup-message"]}>{message}</p>
              </div>
              <div className={styles["co-cd-export-popup-footer"]}>
                  <button onClick={onClose} className={styles["co-cd-export-popup-close-btn"]}>Close</button>
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
  // State for search filters
  const [filters, setFilters] = useState({
    company: '',
    domain: '',
    department: '',
    mode: ''
  });
  const [activeItem, setActiveItem] = useState("Company Drive");
  const [showExportMenu, setShowExportMenu] = useState(false);

  // This function will set the active item when a menu item is clicked
  const handleItemClick = (itemName) => {
    setActiveItem(itemName);
  };

  // State for filtered data
  const [filteredData, setFilteredData] = useState(sampleCompanyData);
  const [showFiltered, setShowFiltered] = useState(true);


  const [exportPopupState, setExportPopupState] = useState({
    isOpen: false,
    type: null, // 'progress', 'success', 'failed'
    operation: null, // 'excel', 'pdf'
    progress: 0
});
  // Handle input changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
const EyeIcon = () => (
    <svg className={styles["co-cd-profile-eye-icon"]} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);
  // Handle View Drive button click
  const handleViewDrive = () => {
    let filtered = [...sampleCompanyData];

    if (filters.company && filters.company.trim()) {
        filtered = filtered.filter(item =>
          item.company.toLowerCase().includes(filters.company.toLowerCase().trim())
        );
      }

    if (filters.domain && filters.domain.trim()) {
      filtered = filtered.filter(item =>
        item.domain.toLowerCase().includes(filters.domain.toLowerCase().trim())
      );
    }

    if (filters.department && filters.department.trim()) {
      filtered = filtered.filter(item =>
        item.branch.toLowerCase().includes(filters.department.toLowerCase().trim())
      );
    }

    if (filters.mode && filters.mode.trim()) {
      filtered = filtered.filter(item =>
        item.mode.toLowerCase().includes(filters.mode.toLowerCase().trim())
      );
    }

    // Sort by company name alphabetically
    filtered.sort((a, b) => a.company.localeCompare(b.company));

    setFilteredData(filtered);
    setShowFiltered(true);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      company: '',
      domain: '',
      department: '',
      mode: ''
    });
    setFilteredData(sampleCompanyData);
    setShowFiltered(true);
  };
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

  return (
    <div>
      
      {/* --- NAVBAR --- */}
      <Navbar onToggleSidebar={toggleSidebar} />

      {/* --- BODY LAYOUT --- */}
      <div className={styles["co-cd-layout"]}>
        {/* --- SIDEBAR --- */}
        <Sidebar
          isOpen={isSidebarOpen}
          onLogout={onLogout}
          currentView="company-drive"
          onViewChange={onViewChange}
        />


        {/* --- MAIN CONTENT --- */}
        <div className={styles["co-cd-main-content"]}>
          {/* Top Cards Row */}
          <div className={styles["co-cd-top-cards-row"]}>

            {/* 1: Report Analysis Card */}
            <div
              className={cx(styles["co-cd-card"], styles["co-cd-report-analysis-card"])}
              onClick={() => handleCardClick('report-analysis')}
            >
              <img
                src={CoordReportanalysis}
                alt="Report Analysis"
                className={styles["co-cd-report-analysis-card__image"]}
              />
              <span className={styles["co-cd-report-analysis-card__title"]}>Report Analysis</span>
              <span className={styles["co-cd-report-analysis-card__description"]}>
                Tracks eligibility,<br />applications, and selections
              </span>
            </div>

            {/* 2: Company Drive Search Card */}
            <div className={styles["co-cd-search-filter-card"]}>
              <div className={styles["co-cd-search-filter-card__tabs-container"]}>
                <button className={styles["co-cd-search-filter-card__tab-button"]}>Company Drive</button>
              </div>
              <div className={styles["co-cd-search-filter-card__fields-container"]}>
                <div className={styles["co-cd-search-filter-card__fields-row"]}>

                  {/* Company Search Input */}
                  <div className={styles["co-cd-search-filter-card__input-wrapper"]}>
                    <input
                      id="co-cd-search-company"
                      className={cx(
                        styles["co-cd-search-filter-card__input"],
                        styles["co-cd-search-company"]
                      )}
                      value={filters.company}
                      onChange={(e) => handleFilterChange('company', e.target.value)}
                      required
                    />
                    <label
                      htmlFor="co-cd-search-company"
                      className={styles["co-cd-search-filter-card__label"]}
                    >
                      Search Company
                    </label>
                  </div>

                  {/* Domain Search Input */}
                  <div className={styles["co-cd-search-filter-card__input-wrapper"]}>
                    <input
                      id="co-cd-search-domain"
                      className={cx(
                        styles["co-cd-search-filter-card__input"],
                        styles["co-cd-search-domain"]
                      )}
                      value={filters.domain}
                      onChange={(e) => handleFilterChange('domain', e.target.value)}
                      required
                    />
                    <label
                      htmlFor="co-cd-search-domain"
                      className={styles["co-cd-search-filter-card__label"]}
                    >
                      Search Domain
                    </label>
                  </div>
                </div>
                <div className={styles["co-cd-search-filter-card__fields-row"]}>

                  {/* Department Search Input */}
                  <div className={styles["co-cd-search-filter-card__input-wrapper"]}>
                    <input
                      id="co-cd-search-department"
                      className={cx(
                        styles["co-cd-search-filter-card__input"],
                        styles["co-cd-search-department"]
                      )}
                      value={filters.department}
                      onChange={(e) => handleFilterChange('department', e.target.value)}
                      required
                    />
                    <label
                      htmlFor="co-cd-search-department"
                      className={styles["co-cd-search-filter-card__label"]}
                    >
                      Search by Branch
                    </label>
                  </div>

                  {/* Mode Search Dropdown - FIX APPLIED HERE */}
                  <div className={styles["co-cd-search-filter-card__input-wrapper"]}>
                    <select
                      id="co-cd-search-mode"
                      className={cx(
                        styles["co-cd-search-filter-card__input"],
                        styles["co-cd-search-mode"]
                      )}
                      style={{ width: '280px' }}
                      value={filters.mode}
                      onChange={(e) => handleFilterChange('mode', e.target.value)}
                      required
                    >
                      {/* First option with value="" is the placeholder */}
                      <option  value=""></option>
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                    {/* **ADDED LABEL ADJACENT TO SELECT** */}
                    <label htmlFor="co-cd-search-mode" className={styles["co-cd-search-filter-card__label"]}>
                     Search by Mode
                    </label>
                  </div>
                </div>
              </div>
         <div className={styles["co-cd-search-filter-card__button-group"]}>
          <button
            className={styles["co-cd-search-filter-card__view-button"]}
            onClick={handleViewDrive}
          >
            View Drive
          </button>
          <button
            className={styles["co-cd-search-filter-card__clear-button"]}
            onClick={resetFilters}
          >
            Clear
          </button> 
          </div>
     </div>

            {/* 3: Company Profile Card */}
            <div
              className={cx(styles["co-cd-card"], styles["co-cd-company-profile-card"])}
              onClick={() => handleCardClick('company-profile')}
            >
              <img
                src={CompanyProfile}
                alt="Company Profile"
                className={styles["co-cd-company-profile-card__image"]}
              />
              <span className={cx(styles["co-cd-card-title"], styles["company-profile-card__title"]) }>
                Company Profile
              </span>
              <span className={cx(styles["co-cd-card-desc"], styles["company-profile-card__description"]) }>
                View & explore<br />Company Profile
              </span>
            </div>

          </div>
          
          {/* --- Company Drive Table Container --- */}
          <div className={styles["co-cd-drive-table-container"]}>
          <div className={styles["co-cd-print-menu-wrapper"]}>
    <button
      className={styles["co-cd-drive-table-container__print-button"]}
      onClick={toggleExportMenu}
    >
        Print
    </button>
    {showExportMenu && (
        <div className={styles["co-cd-export-menu"]}>
            <div onClick={handleExportToExcel}>Export to Excel</div>
            <div onClick={handleExportToPDF}>Save as PDF</div>
        </div>
    )}
</div>
              <div className={styles["co-cd-drive-table-container__title-bar"]}>
                  COMPANY DRIVE
              </div>

              <div
                className={styles["co-cd-drive-table-container__table-wrapper"]}
                id="co-cd-drive-table-container__table-wrapper"
              >
                  <table className={styles["co-cd-students-table"]}>
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>Company</th>
                        <th>Domain</th>
                        <th>Job Role</th>
                        <th>Branch</th>
                        <th>Mode</th>
                        <th>Status</th>
                        <th>Visit Date</th>
                        <th>Package</th>
                        <th>Location</th>
                        <th>View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((item, index) => (
                        <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td>{item.company}</td>
                          <td>{item.domain}</td>
                          <td>{item.jobRole}</td>
                          <td>{item.branch}</td>
                          <td>{item.mode}</td>
                          <td>{item.status}</td>
                          <td>{item.visitDate}</td>
                          <td>{item.package}</td>
                          <td>{item.location}</td>
                          <td>
                            <EyeIcon />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
          </div>
        </div>

      </div>
       {/* Export Popups */}
       {exportPopupState.isOpen && exportPopupState.type === 'progress' && (
                <ExportProgressPopup
                    isOpen
                    operation={exportPopupState.operation}
                    progress={exportPopupState.progress}
                    onClose={() => {}}
                />
            )}
            
            {exportPopupState.isOpen && exportPopupState.type === 'success' && (
                <ExportSuccessPopup
                    isOpen
                    operation={exportPopupState.operation}
                    onClose={() => setExportPopupState({ isOpen: false, type: null, operation: null, progress: 0 })}
                />
            )}
            
            {exportPopupState.isOpen && exportPopupState.type === 'failed' && (
                <ExportFailedPopup
                    isOpen
                    operation={exportPopupState.operation}
                    onClose={() => setExportPopupState({ isOpen: false, type: null, operation: null, progress: 0 })}
                />
            )}     

    </div>
  );
}