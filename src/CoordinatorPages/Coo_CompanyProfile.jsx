import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import{ useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import  autoTable from 'jspdf-autotable';
import searchcompany from '../assets/SearchCompanybaricon.png';
import searchbydept from '../assets/searchvisitingyrbaricon.png'
import searchdomain from '../assets/searchDomainbaricon.png';
import searchmode from '../assets/Searchmodebaricon.png';
import CompanyDrive from '../assets/CompanyDrive.svg';
import PlacedStudentsCap from '../assets/PlacedStudentsCap.svg';

import './Coo_CompanyProfile.module.css';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";

const ExportProgressPopup = ({ isOpen, operation, progress, onClose }) => {
  if (!isOpen) return null;
  
  const operationText = operation === 'excel' ? 'Exporting...' : 'Downloading...';
  const progressText = operation === 'excel' ? 'Exported' : 'Downloaded';
  
  // Calculate the stroke-dasharray for circular progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
      <div className="co-cd-export-popup-overlay">
          <div className="co-cd-export-popup-container">
              <div className="co-cd-export-popup-header">{operationText}</div>
              <div className="co-cd-export-popup-body">
                  <div className="co-cd-export-progress-circle">
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
                      {/*<div className="co-cd-export-progress-text">{progress}%</div>*/}
                  </div>
                  <h2 className="co-cd-export-popup-title">{progressText} {progress}%</h2>
                  <p className="co-cd-export-popup-message">
                      The Details have been {operation === 'excel' ? 'Exporting...' : 'Downloading...'}
                  </p>
                  <p className="co-cd-export-popup-message">Please wait...</p>
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
      <div className="co-cd-export-popup-overlay">
          <div className="co-cd-export-popup-container">
              <div className="co-cd-export-popup-header">{headerText}</div>
              <div className="co-cd-export-popup-body">
                  <div className="co-cd-export-success-icon">
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox="0 0 52 52" fill="none">
                        <circle className="co-cp-success-icon--circle" cx="26" cy="26" r="25"/>
                        <path className="co-cp-success-icon--check" d="M14.1 27.2l7.1 7.2 16.7-16.8" fill="none"
                            />
                        </svg>
                  </div>
                  <h2 className="co-cd-export-popup-title">{title}</h2>
                  <p className="co-cd-export-popup-message">{message}</p>
              </div>
              <div className="co-cd-export-popup-footer">
                  <button onClick={onClose} className="co-cd-export-popup-close-btn">Close</button>
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
      <div className="co-cd-export-popup-overlay">
          <div className="co-cd-export-popup-container">
              <div className="co-cd-export-popup-header">{headerText}</div>
              <div className="co-cd-export-popup-body">
                  <div className="co-cd-export-failed-icon">
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
                  <h2 className="co-cd-export-popup-title">{title}</h2>
                  <p className="co-cd-export-popup-message">{message}</p>
              </div>
              <div className="co-cd-export-popup-footer">
                  <button onClick={onClose} className="co-cd-export-popup-close-btn">Close</button>
              </div>
          </div>
      </div>
  );
};


const sampleCompanyData = [
  {
    id: 1,
    company: "TechNova Solutions",
    domain: "IT Sector",
    jobRole: "Junior Developer",
    hrName: "Mr. David Chen",
    hrContact: "9876543210",
    bondPeriod: "24 Months",
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
    hrName: "Ms. Sarah Jones",
    hrContact: "9876543211",
    bondPeriod: "18 Months",
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
    hrName: "Mr. Alex Rodriguez",
    hrContact: "9876543212",
    bondPeriod: "No Bond",
    mode: "Online",
    status: "Confirmed",
    visitDate: "05-11-2025",
    package: "8.5 LPA",
    location: "Hyderabad"
  },
  {
    id: 4,
    company: "Innovate AI Labs",
    domain: "Artificial Intelligence",
    jobRole: "Machine Learning Engineer",
    hrName: "Ms. Jessica Lee",
    hrContact: "9876543213",
    bondPeriod: "36 Months",
    mode: "Offline",
    status: "Pending",
    visitDate: "12-11-2025",
    package: "9 LPA",
    location: "Pune"
  },
  {
    id: 5,
    company: "FutureWeb Solutions",
    domain: "Web Development",
    jobRole: "Full Stack Developer",
    hrName: "Mr. Chris Evans",
    hrContact: "9876543214",
    bondPeriod: "24 Months",
    mode: "Online",
    status: "Confirmed",
    visitDate: "18-11-2025",
    package: "5.5 LPA",
    location: "Mumbai"
  },
  {
    id: 6,
    company: "NexGen Electronics",
    domain: "Core Electronics",
    jobRole: "Electronics Engineer",
    hrName: "Ms. Emily Watson",
    hrContact: "9876543215",
    bondPeriod: "No Bond",
    mode: "Offline",
    status: "Confirmed",
    visitDate: "25-11-2025",
    package: "6.2 LPA",
    location: "Coimbatore"
  },
  {
    id: 7,
    company: "Global Motors",
    domain: "Automotive",
    jobRole: "Mechanical Designer",
    hrName: "Mr. Ryan Miller",
    hrContact: "9876543216",
    bondPeriod: "12 Months",
    mode: "Offline",
    status: "Confirmed",
    visitDate: "01-12-2025",
    package: "6.8 LPA",
    location: "Pune"
  },
  {
    id: 8,
    company: "EcoBuild Constructors",
    domain: "Civil Engineering",
    jobRole: "Site Engineer",
    hrName: "Ms. Olivia Green",
    hrContact: "9876543217",
    bondPeriod: "No Bond",
    mode: "Offline",
    status: "Pending",
    visitDate: "15-12-2025",
    package: "5.3 LPA",
    location: "Delhi"
  },
  {
    id: 9,
    company: "AeroDynamics",
    domain: "Aerospace",
    jobRole: "Aerospace Engineer",
    hrName: "Mr. Michael Brown",
    hrContact: "9876543218",
    bondPeriod: "48 Months",
    mode: "Online",
    status: "Cancelled",
    visitDate: "20-12-2025",
    package: "10 LPA",
    location: "Bangalore"
  },
  {
    id: 10,
    company: "BioMed Systems",
    domain: "Medical Devices",
    jobRole: "Software Developer",
    hrName: "Dr. Isabella Scott",
    hrContact: "9876543219",
    bondPeriod: "12 Months",
    mode: "Offline",
    status: "Confirmed",
    visitDate: "05-01-2026",
    package: "7.5 LPA",
    location: "Chennai"
  }
];

function CompanyProfile({ onLogout, currentView, onViewChange }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State for search filters
  const [filters, setFilters] = useState({
    company: '',
    domain: '',
    jobRole: '',
    mode: ''
  });

 const [activeItem, setActiveItem] = useState("Company Profile");
  const navigate = useNavigate();
  const [showExportMenu, setShowExportMenu] = useState(false);

  // This function will set the active item when a menu item is clicked
  const handleItemClick = (itemName) => {
    setActiveItem(itemName);
  };

  // This function will set the active item when a menu item is clicked
 
  const [exportPopupState, setExportPopupState] = useState({
    isOpen: false,
    type: null, // 'progress', 'success', 'failed'
    operation: null, // 'excel', 'pdf'
    progress: 0
});

  // State for filtered data
  const [filteredData, setFilteredData] = useState(sampleCompanyData);
  const [showFiltered, setShowFiltered] = useState(true);

  // Handle input changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle View Profile button click
const handleViewProfile = () => {
  let filtered = [...sampleCompanyData];

  // Apply filters only if the input has a value
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

  if (filters.jobRole && filters.jobRole.trim()) {
    filtered = filtered.filter(item =>
      item.jobRole.toLowerCase().includes(filters.jobRole.toLowerCase().trim())
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
      jobRole: '',
      mode: ''
    });
    setFilteredData(sampleCompanyData);
    setShowFiltered(true);
  };
const location = useLocation();
useEffect(() => {
  switch (location.pathname) {
    case "/dashboard":
      setActiveItem("Dashboard");
      break;
    case "/manage-students":
      setActiveItem("Manage Students");
      break;
    case "/company-profile":
      setActiveItem("Company Profile");
      break;
    case "/company-drive":
      setActiveItem("Company Drive");
      break;
    case "/certificate-verification":
      setActiveItem("Certificate Verification");
      break;
    case "/eligible-students":
      setActiveItem("Eligible Students");
      break;
    case "/attendance":
      setActiveItem("Attendance");
      break;
    case "/placed-students":
      setActiveItem("Placed Students");
      break;
    default:
      setActiveItem("Dashboard");
  }
}, [location.pathname]);

  const handleCardClick = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
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
    const header = ["S.No", "Company", "Domain", "Job Role", "HR Name", "HR Contact", "Bond Period", "Mode", "Status", "Visit Date", "Package", "Location"];
    const data = filteredData.map((item, index) => [
        index + 1,
        item.company,
        item.domain,
        item.jobRole,
        item.hrName,
        item.hrContact,
        item.bondPeriod,
        item.mode,
        item.status,
        item.visitDate,
        item.package,
        item.location
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Company Profile");
    XLSX.writeFile(wb, "CompanyProfile.xlsx");
    setShowExportMenu(false);
  }catch (error){
    throw error;
  }
  };
  const exportToPDF = () => {
    try{
    const doc = new jsPDF();
  
    const tableColumn = [
      "S.No",
      "Company",
      "Domain",
      "Job Role",
      "HR Name",
      "HR Contact",
      "Bond Period",
      "Mode",
      "Status",
      "Visit Date",
      "Package",
      "Location",
    ];
  
    const tableRows = filteredData.map((item, index) => [
      index + 1,
      item.company,
      item.domain,
      item.jobRole,
      item.hrName,
      item.hrContact,
      item.bondPeriod,
      item.mode,
      item.status,
      item.visitDate,
      item.package,
      item.location,
    ]);
  
    doc.setFontSize(16);
    doc.text("Company Profile Report", 5, 15);
  
    // 👇 Explicitly call the imported function and pass the doc instance
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
        valign: "middle",
        halign: "center",
        minCellHeight: 8,
      },
      headStyles: {
        fillColor: [215, 61, 61],
        textColor: 255,
        fontStyle: "bold",
      },
    });
  
    doc.save("CompanyProfile.pdf");
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

  return (
    <>
      <Navbar onToggleSidebar={toggleSidebar} />
      <div className="co-cp-layout">
        <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView="company-profile" onViewChange={onViewChange} />
        <div className="co-cp-main-content">
          {/* Top Cards Row */}
          <div className="co-cp-top-cards-row" style={{marginTop:"-20px"}}>

            {/* 1: Student Analysis Card */}
            <div className="co-cp-card co-cp-report-analysis-card" onClick={() => handleCardClick('company-drive')}  >
              <img src={CompanyDrive} alt="Student Analysis" className="co-cp-report-analysis-card__image" />
              <span className="co-cp-card-title report-analysis-card__title" >Company Drive</span>
              <span className="co-cp-card-desc report-analysis-card__description"><br/> View upcoming,<br/>Ongoing,and<br/>Completed drives</span>
            </div>

            {/* 2: Student Profile Search Card */}
            <div className="co-cp-search-filter-card" >
              <div className="co-cp-search-filter-card__tabs-container">
                <button className="co-cp-search-filter-card__tab-button">Company Profile</button>
              </div>
              <div className="co-cp-search-filter-card__fields-container">
                <div className="co-cp-search-filter-card__fields-row">

                  {/* Name Search Input */}
                  <div className="co-cp-search-filter-card__input-wrapper">
                    <input
                      id="search-company"
                      className="co-cp-search-filter-card__input"
                      value={filters.company}
                      onChange={(e) => handleFilterChange('company', e.target.value)}
                      required
                    />
                    <label htmlFor="search-company" className="co-cp-search-filter-card__label">
                      Search Company
                    </label>
                  </div>

                  {/* Department Search Input */}
                  <div className="co-cp-search-filter-card__input-wrapper">
                    <input
                      id="search-domain"
                      className="co-cp-search-filter-card__input"
                      value={filters.domain}
                      onChange={(e) => handleFilterChange('domain', e.target.value)}
                      required
                    />
                    <label htmlFor="search-domain" className="co-cp-search-filter-card__label">
                      Search by Domain
                    </label>
                  </div>
                </div>
                <div className="co-cp-search-filter-card__fields-row">

                  {/* Branch Search Input */}
                  <div className="co-cp-search-filter-card__input-wrapper">
                    <input
                      id="search-jobrole"
                      className="co-cp-search-filter-card__input"
                      value={filters.jobRole}
                      onChange={(e) => handleFilterChange('jobRole', e.target.value)}
                      required
                    />
                    <label htmlFor="search-jobrole" className="co-cp-search-filter-card__label">
                      Search Job Role
                    </label>
                  </div>

                  {/* Status Search Dropdown */}
                  <div className="co-cp-search-filter-card__input-wrapper1">
    <select
      id="search-mode"
      className="co-cp-search-filter-card__input "
      
      value={filters.mode}
      onChange={(e) => handleFilterChange('mode', e.target.value)}
      required
    >
      <option value=""></option>
      <option value="Online">Online</option>
      <option value="Offline">Offline</option>
      <option value="Hybrid">Hybrid</option>
    </select>
    <label htmlFor="search-mode" className="co-cp-search-filter-card__label">
                      Search by Mode
                    </label>
</div>
                </div>
              </div>
              <div className="co-cp-search-filter-card__button-group">
                <button className="co-cp-search-filter-card__view-button" onClick={handleViewProfile}> Search </button>
                <button className="co-cp-search-filter-card__clear-button" onClick={resetFilters}>Clear </button> 
              </div>
            </div>

            {/* 3: Placed student */}
            <div className="co-cp-card co-cp-company-profile-card"  onClick={() => handleCardClick('placed-students')} >
              <img src={PlacedStudentsCap} alt="Placed Student" className="co-cp-company-profile-card__image" style={{marginTop:"-19px"}}/>
              <span className="co-cp-card-title company-profile-card__title">Placed Student</span>
              <span className="co-cp-card-desc company-profile-card__description" style={{marginTop:10}}>Register new<br/>Companies for<br/>placement drives</span>
            </div>

          </div>
          
          {/* --- Company Profile Table Container --- */}
          <div className="co-cp-drive-table-container" style={{marginTop: "-10px"}}>
          <div className="co-cp-print-menu-wrapper">
    <button className="co-cp-drive-table-container__print-button" onClick={toggleExportMenu}>
        Print
    </button>
    {showExportMenu && (
        <div className="co-cp-export-menu">
            <div onClick={handleExportToExcel}>Export to Excel</div>
            <div onClick={handleExportToPDF}>Save as PDF</div>
        </div>
    )}
</div>
              <div className="co-cp-drive-table-container__title-bar">
                  COMPANY PROFILE
              </div>

              <div className="co-cp-drive-table-container__table-wrapper" id="co-cp-drive-table-container__table-wrapper">
                  {/* The table content remains the same */}
                  <table>
                  <thead>
   <tr>
                      <th>S.No</th>
                      <th>Company</th>
                      <th>Domain</th>
                      <th>Job Role</th>
                      <th>HR Name</th>
                      <th>HR Contact</th>
                      <th>Bond Period</th>
                      <th>Mode</th>
                      <th>Status</th>
                      <th>Visit Date</th>
                      <th>Package</th>
                      <th>Location</th>
                    </tr>
</thead>
<tbody>
    {filteredData.map((item, index) => {
        // Function to determine the style based on the status
        const getStatusStyle = (status) => {
            switch (status) {
                case "Confirmed":
                    return { backgroundColor: "#E1F6EC", color: "#07AE4E", padding: "5px 10px", borderRadius: "16px", fontSize: "12px", textAlign: "center" };
                case "Pending":
                    return { backgroundColor: "#dcdada", color: "#555", padding: "5px 15px", borderRadius: "16px", fontSize: "12px", textAlign: "center" };
                case "On-Hold":
                    return { backgroundColor: "#F44336", color: "white", padding: "5px 10px", borderRadius: "16px", fontSize: "12px", textAlign: "center" };
                default:
                    return { backgroundColor: "#FFE6E1", color: "#C12424", padding: "5px 10px", borderRadius: "16px", fontSize: "12px", textAlign: "center" };
            }
        };

        return (
            <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.company}</td>
                <td>{item.domain}</td>
                <td>{item.jobRole}</td>
                <td>{item.hrName}</td>
                <td>{item.hrContact}</td>
                <td>{item.bondPeriod}</td>
                <td>{item.mode}</td>
                <td>
                    <span style={getStatusStyle(item.status)}>
                        {item.status}
                    </span>
                </td>
                <td>{item.visitDate}</td>
                <td>{item.package}</td>
                <td>{item.location}</td>
            </tr>
        );
    })}
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
         
    </>
  );
}

export default CompanyProfile;