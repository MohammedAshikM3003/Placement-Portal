import { useState, useEffect } from "react"; // Import useEffect
import {
 FaUserCircle,  FaEye,
  FaUsers, FaBuilding, FaBriefcase, FaCertificate, FaUserCheck,
  FaCalendarAlt, FaUserGraduate, FaChartBar
} from 'react-icons/fa';
import { LuLayoutDashboard } from "react-icons/lu";
import { useNavigate } from "react-router-dom";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import "./Coo_PlacedStudents.module.css";  
// Component for the Donut Chart
const DonutChart = () => {
  // This is a static representation using CSS conic-gradient
  // For a dynamic chart, a library like Chart.js or Recharts would be needed.
  return (
    <div className="co-ps-chart-container">
      <h3>Students Status</h3>
      <div className="co-ps-donut-chart-wrapper">
        <div className="co-ps-donut-chart">
          <div className="co-ps-donut-center">
            <span>25%</span>
          </div>
        </div>
      </div>
      <div className="co-ps-chart-legend">
        <div className="co-ps-legend-item">
          <span className="co-ps-legend-color-box placed"></span>
          <span>75% - Placed</span>
        </div>
        <div className="co-ps-legend-item">
          <span className="co-ps-legend-color-box not-placed"></span>
          <span>25% - Not Placed</span>
        </div>
      </div>
    </div>
  );
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
      <div className="co-ps-export-popup-overlay">
          <div className="co-ps-export-popup-container">
              <div className="co-ps-export-popup-header">{operationText}</div>
              <div className="co-ps-export-popup-body">
                  <div className="co-ps-export-progress-circle">
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
                      {/*<div className="co-ps-export-progress-text">{progress}%</div>*/}
                  </div>
                  <h2 className="co-ps-export-popup-title">{progressText} {progress}%</h2>
                  <p className="co-ps-export-popup-message">
                      The Details have been {operation === 'excel' ? 'Exporting...' : 'Downloading...'}
                  </p>
                  <p className="co-ps-export-popup-message">Please wait...</p>
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
      <div className="co-ps-export-popup-overlay">
          <div className="co-ps-export-popup-container">
              <div className="co-ps-export-popup-header">{headerText}</div>
              <div className="co-ps-export-popup-body">
                  <div className="co-ps-export-success-icon">
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox="0 0 52 52" fill="none">
                        <circle className="co-ps-success-icon--circle" cx="26" cy="26" r="25"/>
                        <path className="co-ps-success-icon--check" d="M14.1 27.2l7.1 7.2 16.7-16.8" fill="none"
                            />
                        </svg>
                  </div>
                  <h2 className="co-ps-export-popup-title">{title}</h2>
                  <p className="co-ps-export-popup-message">{message}</p>
              </div>
              <div className="co-ps-export-popup-footer">
                  <button onClick={onClose} className="co-ps-export-popup-close-btn">Close</button>
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
      <div className="co-ps-export-popup-overlay">
          <div className="co-ps-export-popup-container">
              <div className="co-ps-export-popup-header">{headerText}</div>
              <div className="co-ps-export-popup-body">
                  <div className="co-ps-export-failed-icon">
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
                  <h2 className="co-ps-export-popup-title">{title}</h2>
                  <p className="co-ps-export-popup-message">{message}</p>
              </div>
              <div className="co-ps-export-popup-footer">
                  <button onClick={onClose} className="co-ps-export-popup-close-btn">Close</button>
              </div>
          </div>
      </div>
  );
};


const PlacementDashboard = ({ onLogout, currentView, onViewChange }) => {
  // Data for navigation links
  const navLinks = [
    { icon: <LuLayoutDashboard />, text: 'Dashboard' },
    { icon: <FaUsers />, text: 'Manage Students' },
    { icon: <FaBuilding />, text: 'Company Profile' },
    { icon: <FaBriefcase />, text: 'Company Drive' },
    { icon: <FaCertificate />, text: 'Certificate Verification' },
    { icon: <FaUserCheck />, text: 'Eligible Students' },
    { icon: <FaCalendarAlt />, text: 'Attendance' },
    { icon: <FaUserGraduate />, text: 'Placed Students', active: true },
    { icon: <FaChartBar />, text: 'Report Analysis' },
    { icon: <FaUserCircle />, text: 'Profile' },
  ];

  // Data for the students table
  const allStudentsData = [
    { sno: 1, name: 'Ridhan', regNo: '73152313001', dept: 'CSE', batch: '2023-2027', company: 'Infosys', role: 'Software Engineer', pkg: '12.0 LPA', date: '29/08/25', status: 'Accepted' },
    { sno: 2, name: 'Vibin', regNo: '73152313002', dept: 'CSE', batch: '2023-2027', company: 'Wipro', role: 'Data Analyst', pkg: '4.0 LPA', date: '19/09/25', status: 'Rejected' },
    { sno: 3, name: 'Nithin', regNo: '73152313003', dept: 'CSE', batch: '2023-2027', company: 'TCS', role: 'Tester', pkg: '3.0 LPA', date: '26/07/25', status: 'Pending' },
   { sno: 4, name: 'Sandy', regNo: '73152313004', dept: 'CSE', batch: '2023-2027', company: 'Infosys', role: 'Software Engineer', pkg: '12.0 LPA', date: '29/08/25', status: 'Accepted' },
    { sno: 5, name: 'Adhithya', regNo: '73152313005', dept: 'CSE', batch: '2023-2027', company: 'Infosys', role: 'Software Engineer', pkg: '12.0 LPA', date: '29/08/25', status: 'Accepted' },
    { sno: 6, name: 'Kishore', regNo: '73152313006', dept: 'CSE', batch: '2023-2027', company: 'TCS', role: 'Software Engineer', pkg: '3.0 LPA', date: '29/08/25', status: 'Accepted' },
    { sno: 7, name: 'Arun', regNo: '73152313007', dept: 'CSE', batch: '2024-2028', company: 'Wipro', role: 'Data Analyst', pkg: '4.0 LPA', date: '19/09/25', status: 'Rejected' },
    { sno: 8, name: 'Lilly', regNo: '73152313008', dept: 'CSE', batch: '2024-2028', company: 'Infosys', role: 'Tester', pkg: '12.0 LPA', date: '26/07/25', status: 'Pending' },
   { sno: 9, name: 'Chann', regNo: '73152313009', dept: 'CSE', batch: '2023-2027', company: 'Infosys', role: 'Software Engineer', pkg: '12.0 LPA', date: '29/08/25', status: 'Accepted' },
    { sno: 10, name: 'Karan', regNo: '73152313010', dept: 'CSE', batch: '2024-2028', company: 'Wipro', role: 'Software Engineer', pkg: '4.0 LPA', date: '29/08/25', status: 'Accepted' },
  ];

  // State for filter values. Dept is fixed to 'CSE' and not changeable via dropdown.
  const [filters, setFilters] = useState({
    batch: 'All Batches',
    company: 'All Companies',
  });
  
  // State to hold the data currently displayed in the table
  const [displayedStudents, setDisplayedStudents] = useState([]);

  const [exportPopupState, setExportPopupState] = useState({
    isOpen: false,
    type: null, // 'progress', 'success', 'failed'
    operation: null, // 'excel', 'pdf'
    progress: 0
});

const EyeIcon = () => (
    <svg className="co-ps-profile-eye-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);
const [filteredData, setFilteredData] = useState(allStudentsData);
  // State for Print dropdown visibility
  const [open, setOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("Placed Students");
  const navigate = useNavigate();
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Function to handle filter changes (only for batch and company)
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  const handleCardClick = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };
  // Function to filter students based on current filters state
  const getFilteredStudents = (data) => {
    // NOTE: Department filter is HARDCODED to 'CSE' as requested.
    const FIXED_DEPT = 'CSE';
    
    return data.filter(student => {
      // 1. Department Match (Fixed to CSE)
      const deptMatch = student.dept === FIXED_DEPT;
      
      // 2. Batch Match
      const batchMatch = filters.batch === 'All Batches' || student.batch === filters.batch;
      
      // 3. Company Match
      const companyMatch = filters.company === 'All Companies' || student.company === filters.company;
      
      return deptMatch && batchMatch && companyMatch;
    });
  };

  // New function to be called ONLY on the Filter button click
  const applyTableFilters = () => {
      const filteredData = getFilteredStudents(allStudentsData);
      setDisplayedStudents(filteredData);
  }

  // useEffect to run the initial filtering when the component mounts
  // This ensures the table shows "CSE" students by default
  useEffect(() => {
    applyTableFilters();
  }, []); // Empty dependency array means this runs only once on mount


  // Get unique batches and companies for dropdown options
  const uniqueBatches = ['All Batches', ...new Set(allStudentsData.map(s => s.batch))].sort();
  const uniqueCompanies = ['All Companies', ...new Set(allStudentsData.map(s => s.company))].sort();

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

  // Export to Excel (now uses displayedStudents)
  const exportToExcel = () => {
    try {
      const data = filteredData.map(student => [
          student.sno, 
          student.name, 
          student.regNo, 
          student.dept, 
          student.batch,
          student.company, 
          student.role, 
          student.pkg, 
          student.date,
          student.status,
      ]);
      const header = ["S .No", "Name", "Reg No", "Department", "Batch", "Company", "Job Role", "Package", "Date", "Status"];
      const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Placed Students");
      XLSX.writeFile(wb, "Placed_Students_Report.xlsx");
  } catch (error) {
      throw error;
  
};

  };

  // Export to PDF (now uses displayedStudents)
  const exportToPDF = () => {
    try {
      const doc = new jsPDF("landscape");
      const columns = [
       " S .No", "Name", "Reg No", "Department", "Batch", "Company", "Job Role", "Package", "Date", "Status"
      ];
    
      const rows = filteredData.map(student => [
        student.sno, 
        student.name, 
        student.regNo, 
        student.dept, 
        student.batch,
        student.company, 
        student.role, 
        student.pkg, 
        student.date,
        student.status,
      ]);
    
      doc.text("Placed Students Report", 14, 15);
    
      // ✅ use the imported function directly
      autoTable(doc, {
        head: [columns],
        body: rows,
        startY: 20,
        styles: { fontSize: 8 },
      });
    
      doc.save("Placed_Students_Report.pdf");
  } catch (error) {
      throw error;
  }
};

// Wrapper for PDF export with popup
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


  // This function will set the active item when a menu item is clicked
  const handleItemClick = (itemName) => {
    setActiveItem(itemName);
  };

// --- inside PlacementDashboard ---

  return (
    <>

      

<Navbar onToggleSidebar={toggleSidebar} />                  
<Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView="placed-students" onViewChange={onViewChange} />
      <div className="co-ps-portal-container">
    
       
        {/* Main Content */}
        <main className="co-ps-main-content">
          
          
          <div className="co-ps-filters-container">
            {/* Department Filter - FIXED TO CSE (Removed dropdown) */}
            {/* Using a read-only input or just a text label */}
            <div className="co-ps-filter-fixed-dept">
                <label>Dept :</label>
                <input 
                    type="text" 
                    value="CSE" 
                    readOnly 
                   className="co-ps-filter-select"
                />
            </div>
            
            {/* Batch Filter - Removed onChange, now depends on Filter button */}
            <select 
              className="co-ps-filter-select"
              name="batch"
              value={filters.batch}
              onChange={handleFilterChange} // Only updates the state, not the table
            >
              {uniqueBatches.map(batch => (
                <option key={batch} value={batch}>
                  {batch === 'All Batches' ? 'All Batches' : `Batch: ${batch}`}
                </option>
              ))}
            </select>
            
            {/* Company Filter - Removed onChange, now depends on Filter button */}
            <select 
              className="co-ps-filter-select"
              name="company"
              value={filters.company}
              onChange={handleFilterChange} // Only updates the state, not the table
            >
              {uniqueCompanies.map(company => (
                <option key={company} value={company}>
                  {company === 'All Companies' ? 'All Companies' : company}
                </option>
              ))}
            </select>
            
            {/* This button now explicitly triggers the filtering logic */}
            <button 
                className="co-ps-filter-btn" 
                onClick={applyTableFilters}> 
                Filter
            </button>
            
          </div>

          <div className="co-ps-dashboard-grid">
            <div className="co-ps-stats-section">
              <div className="co-ps-stat-card co-ps-card-purple">
                <h3 className="co-ps-card-placed-students">Total Placed Students</h3>
                <p>350</p>
              </div>
              <div className="co-ps-stat-card co-ps-card-teal">
                <h3>Total Offers Recieved</h3>
                <p>400</p>
              </div>
              <div className="co-ps-stat-card co-ps-card-blue">
                <h3>Highest Package</h3>
                <p>15 LPA</p>
              </div>
              <div className="co-ps-stat-card co-ps-card-orange">
                <h3>Average Package</h3>
                <p>6.5 LPA</p>
              </div>
            </div>
            
            <DonutChart />
          </div>
          
          <div className="co-ps-table-container">
            <h3>PLACED STUDENTS DETAILS</h3>

           
    
    <div className="co-ps-dropdown-container">
<button className="co-ps-print-btn" onClick={() => setOpen(!open)} >
Print
</button>
{open && (
<div className="co-ps-dropdown-menu">
  <span onClick={handleExportToExcel}>Export to Excel</span>
  <span onClick={handleExportToPDF}>Save as PDF</span>
</div>
)}
</div>

    {/* The ps-table-scroll now wraps the single table element */}
    
    <div className="co-ps-table-scroll">
        <table className="co-ps-students-table">
            {/* The THEAD is now inside the scroll container, with the table */}
            <thead>
                <tr>
                    <th>S.No</th>
                    <th> Name</th>
                    <th>Reg No.</th>
                    <th style={{ width:"108px"}}>Department</th>
                    <th>Batch</th>
                    <th>Company</th>
                    <th>Job Role</th>
                    <th>Package</th>
                    <th>Date</th>
                    <th>Offer</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                {/* Render filtered students from the new state */}
                {displayedStudents.map((student) => (
                    <tr key={student.sno}>
                        <td>{student.sno}</td>
                        <td>{student.name}</td>
                        <td>{student.regNo}</td>
                        <td>{student.dept}</td>
                        <td>{student.batch}</td>
                        <td>{student.company}</td>
                        <td>{student.role}</td>
                        <td>{student.pkg}</td>
                        <td>{student.date}</td>
                        <td>
                            <span className={`co-ps-status-badge ps-status-${student.status.toLowerCase()}`}>
                                {student.status}
                            </span>
                        </td>
                        <td onClick={() => handleCardClick('placed-students-view')} ><   EyeIcon />
</td>
                    </tr>
                ))}
            </tbody>
        </table>
        
    </div>
  </div>
</main>
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
// ... rest of the file
  );
};

export default PlacementDashboard;