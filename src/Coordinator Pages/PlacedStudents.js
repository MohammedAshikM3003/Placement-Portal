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
import "./PlacedStudents.css";  
// Component for the Donut Chart
const DonutChart = () => {
  // This is a static representation using CSS conic-gradient
  // For a dynamic chart, a library like Chart.js or Recharts would be needed.
  return (
    <div className="ps-chart-container">
      <h3>Students Status</h3>
      <div className="ps-donut-chart-wrapper">
        <div className="ps-donut-chart">
          <div className="ps-donut-center">
            <span>25%</span>
          </div>
        </div>
      </div>
      <div className="ps-chart-legend">
        <div className="ps-legend-item">
          <span className="ps-legend-color-box placed"></span>
          <span>75% - Placed</span>
        </div>
        <div className="ps-legend-item">
          <span className="ps-legend-color-box not-placed"></span>
          <span>25% - Not Placed</span>
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


  // Export to Excel (now uses displayedStudents)
  const exportToExcel = () => {
    const dataToExport = displayedStudents; // Export the currently displayed data
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Placed Students");
    XLSX.writeFile(workbook, "PlacedStudents.xlsx");
    setOpen(false);
  };

  // Export to PDF (now uses displayedStudents)
  const exportToPDF = () => {
    const dataToExport = displayedStudents; // Export the currently displayed data
    const doc = new jsPDF();
    doc.text("Placed Students Details", 14, 10);
    autoTable(doc,{
      head: [["S.No", "Name", "Reg No", "Department", "Batch", "Company", "Job Role", "Package", "Date", "Status"]],
      body: dataToExport.map((s) => [
        s.sno, s.name, s.regNo, s.dept, s.batch, s.company, s.role, s.pkg, s.date, s.status,
      ]),
    });
    doc.save("PlacedStudents.pdf");
    setOpen(false);
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
      <div className="ps-portal-container">
    
       
        {/* Main Content */}
        <main className="ps-main-content">
          
          
          <div className="ps-filters-container">
            {/* Department Filter - FIXED TO CSE (Removed dropdown) */}
            {/* Using a read-only input or just a text label */}
            <div className="ps-filter-fixed-dept">
                <label>Dept :</label>
                <input 
                    type="text" 
                    value="CSE" 
                    readOnly 
                   className="ps-filter-select"
                />
            </div>
            
            {/* Batch Filter - Removed onChange, now depends on Filter button */}
            <select 
              className="ps-filter-select"
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
              className="ps-filter-select"
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
                className="ps-filter-btn" 
                onClick={applyTableFilters}> 
                Filter
            </button>
            
          </div>

          <div className="ps-dashboard-grid">
            <div className="ps-stats-section">
              <div className="ps-stat-card ps-card-purple">
                <h3 className="ps-card-placed-students">Total Placed Students</h3>
                <p>350</p>
              </div>
              <div className="ps-stat-card ps-card-teal">
                <h3>Total Offers Recieved</h3>
                <p>400</p>
              </div>
              <div className="ps-stat-card ps-card-blue">
                <h3>Highest Package</h3>
                <p>15 LPA</p>
              </div>
              <div className="ps-stat-card ps-card-orange">
                <h3>Average Package</h3>
                <p>6.5 LPA</p>
              </div>
            </div>
            
            <DonutChart />
          </div>
          
          <div className="ps-table-container">
            <h3>PLACED STUDENTS DETAILS</h3>

           
    
    <div className="ps-dropdown-container">
<button className="ps-print-btn" onClick={() => setOpen(!open)} >
Print
</button>
{open && (
<div className="ps-dropdown-menu">
  <span onClick={exportToExcel}>Export to Excel</span>
  <span onClick={exportToPDF}>Save as PDF</span>
</div>
)}
</div>

    {/* The ps-table-scroll now wraps the single table element */}
    
    <div className="ps-table-scroll">
        <table className="ps-students-table">
            {/* The THEAD is now inside the scroll container, with the table */}
            <thead>
                <tr>
                    <th>S.No</th>
                    <th> Name</th>
                    <th>Reg No.</th>
                    <th>Department</th>
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
                            <span className={`ps-status-badge ps-status-${student.status.toLowerCase()}`}>
                                {student.status}
                            </span>
                        </td>
                        <td onClick={() => navigate(`/coo-view-ps`)}><FaEye className="ps-action-icon" /></td>
                    </tr>
                ))}
            </tbody>
        </table>
        
    </div>
  </div>
</main>
</div>
</>
// ... rest of the file
  );
};

export default PlacementDashboard;