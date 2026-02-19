import { useState, useEffect, useCallback } from "react"; // Import useEffect and useCallback
import { useNavigate } from "react-router-dom";
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import {
 FaUserCircle,  FaEye,
  FaUsers, FaBuilding, FaBriefcase, FaCertificate, FaUserCheck,
  FaCalendarAlt, FaUserGraduate, FaChartBar
} from 'react-icons/fa';
import { LuLayoutDashboard } from "react-icons/lu";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import mongoDBService from '../services/mongoDBService.jsx';
import styles from "./Coo_PlacedStudents.module.css";  
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

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
// Component for the Bar Chart
const BarChartComponent = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="jobRole" 
          angle={0}
          textAnchor="middle"
          height={60}
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          allowDecimals={false}
          domain={[0, 'dataMax + 1']}
          ticks={[0, 1, 2, 3, 4, 5]}
        />
        <Tooltip />
        <Bar dataKey="students" fill="#7B68EE" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const PlacementDashboard = ({ onLogout, currentView, onViewChange }) => {
  useCoordinatorAuth(); // JWT authentication verification

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

  // State management
  const [allStudentsData, setAllStudentsData] = useState([]);
  const [displayedStudents, setDisplayedStudents] = useState([]);
  const [coordinatorBranch, setCoordinatorBranch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    batch: 'All Batches',
    company: 'All Companies',
    jobRole: 'All Job Roles',
  });
  
  // Stats state
  const [stats, setStats] = useState({
    totalPlaced: 0,
    totalOffers: 0,
    highestPackage: 0,
    averagePackage: 0,
    placedPercentage: 25
  });

  const [exportPopupState, setExportPopupState] = useState('none'); // 'none' | 'progress' | 'success' | 'failed'
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('Excel');
  
  const [companyChartData, setCompanyChartData] = useState([]);
  
  const [open, setOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("Placed Students");
  const navigate = useNavigate();
  const [showExportMenu, setShowExportMenu] = useState(false);

  const EyeIcon = () => (
    <svg className={styles['co-ps-profile-eye-icon']} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );

  // Function to generate company job role chart data
  const generateCompanyChartData = useCallback((data) => {
    const companyJobRoleCounts = {};

    // Group by company and count job roles within each company
    data.forEach(student => {
      const company = student.company;
      const jobRole = student.role;
      
      if (company && jobRole) {
        if (!companyJobRoleCounts[company]) {
          companyJobRoleCounts[company] = {};
        }
        companyJobRoleCounts[company][jobRole] = (companyJobRoleCounts[company][jobRole] || 0) + 1;
      }
    });

    // Get selected company and job role from filters
    const selectedCompany = filters.company;
    const selectedJobRole = filters.jobRole;

    // If a specific company is selected
    if (selectedCompany !== 'All Companies' && companyJobRoleCounts[selectedCompany]) {
      let jobRolesData;
      
      // If a specific job role is also selected, show only that job role
      if (selectedJobRole !== 'All Job Roles' && companyJobRoleCounts[selectedCompany][selectedJobRole]) {
        jobRolesData = [{
          jobRole: selectedJobRole,
          students: companyJobRoleCounts[selectedCompany][selectedJobRole]
        }];
      } else {
        // Show all job roles for the selected company
        jobRolesData = Object.keys(companyJobRoleCounts[selectedCompany]).map(jobRole => ({
          jobRole: jobRole,
          students: companyJobRoleCounts[selectedCompany][jobRole],
        })).sort((a, b) => a.jobRole.localeCompare(b.jobRole));
      }
      
      setCompanyChartData(jobRolesData);
    } else {
      // If no specific company is selected, show first company's data
      const companies = Object.keys(companyJobRoleCounts);
      if (companies.length > 0) {
        const firstCompany = companies[0];
        const jobRolesData = Object.keys(companyJobRoleCounts[firstCompany]).map(jobRole => ({
          jobRole: jobRole,
          students: companyJobRoleCounts[firstCompany][jobRole],
        })).sort((a, b) => a.jobRole.localeCompare(b.jobRole));
        
        setCompanyChartData(jobRolesData);
      } else {
        setCompanyChartData([]);
      }
    }
  }, [filters]);

  useEffect(() => {
    const coordinatorData = readStoredCoordinatorData();
    const branch = resolveCoordinatorDepartment(coordinatorData);
    
    if (branch) {
      setCoordinatorBranch(branch);
      console.log('Coordinator branch:', branch);
      fetchPlacedStudents(branch);
    } else {
      setIsLoading(false);
      console.error('No coordinator branch found');
    }
  }, []);

  // Function to fetch placed students from backend
  const fetchPlacedStudents = async (branch) => {
    try {
      setIsLoading(true);
      const response = await mongoDBService.getPlacedStudents({ dept: branch });
      
      if (response.success && response.data) {
        // Map and add serial numbers
        const mappedData = response.data.map((student, index) => ({
          sno: index + 1,
          name: student.name,
          regNo: student.regNo,
          dept: student.dept,
          batch: student.batch,
          company: student.company,
          role: student.role,
          pkg: student.pkg,
          date: student.date,
          status: student.status || 'Accepted'
        }));
        
        setAllStudentsData(mappedData);
        setDisplayedStudents(mappedData);
        calculateStats(mappedData);
        generateCompanyChartData(mappedData);
      } else {
        setAllStudentsData([]);
        setDisplayedStudents([]);
      }
    } catch (error) {
      console.error('Error fetching placed students:', error);
      setAllStudentsData([]);
      setDisplayedStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics from placed students data
  const calculateStats = (data) => {
    if (!data || data.length === 0) {
      setStats({
        totalPlaced: 0,
        totalOffers: 0,
        highestPackage: 0,
        averagePackage: 0,
        placedPercentage: 0
      });
      return;
    }

    const acceptedStudents = data.filter(s => s.status === 'Accepted');
    const packages = data.map(s => parseFloat(s.pkg) || 0);
    const total = data.length;
    const placed = acceptedStudents.length;
    
    setStats({
      totalPlaced: placed,
      totalOffers: total,
      highestPackage: packages.length > 0 ? Math.max(...packages) : 0,
      averagePackage: packages.length > 0 ? (packages.reduce((a, b) => a + b, 0) / packages.length) : 0,
      placedPercentage: total > 0 ? Math.round((placed / total) * 100) : 0
    });
  };

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
  
  // Auto-apply filters when filter values change
  useEffect(() => {
    const filteredData = allStudentsData.filter(student => {
      const batchMatch = filters.batch === 'All Batches' || student.batch === filters.batch;
      const companyMatch = filters.company === 'All Companies' || student.company === filters.company;
      const jobRoleMatch = filters.jobRole === 'All Job Roles' || student.role === filters.jobRole;
      
      return batchMatch && companyMatch && jobRoleMatch;
    });
    setDisplayedStudents(filteredData);
    calculateStats(filteredData);
    generateCompanyChartData(filteredData);
  }, [filters, allStudentsData]);

  // Get unique batches, companies, and job roles for dropdown options
  const uniqueBatches = ['All Batches', ...new Set(allStudentsData.map(s => s.batch))].sort();
  const uniqueCompanies = ['All Companies', ...new Set(allStudentsData.map(s => s.company))].sort();
  const uniqueJobRoles = [...new Set(allStudentsData.map(s => s.role))].filter(Boolean).sort();

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

  // Export to Excel (now uses displayedStudents)
  const exportToExcel = () => {
    try {
      const data = displayedStudents.map(student => [
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
    }
  };

  // Export to PDF (now uses displayedStudents)
  const exportToPDF = () => {
    try {
      const doc = new jsPDF("landscape");
      const columns = [
       " S .No", "Name", "Reg No", "Department", "Batch", "Company", "Job Role", "Package", "Date", "Status"
      ];
    
      const rows = displayedStudents.map(student => [
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

  return (
    <>

      <Navbar onToggleSidebar={toggleSidebar} />                  
      <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView="placed-students" onViewChange={onViewChange} />
      <div className={styles['co-ps-portal-container']}>
    
       
        {/* Main Content */}
        <main className={styles['co-ps-main-content']}>
          
          
          <div className={styles['co-ps-filters-container']}>
            {/* Batch Filter */}
            <select 
              className={styles['co-ps-filter-select']}
              name="batch"
              value={filters.batch}
              onChange={handleFilterChange}
            >
              {uniqueBatches.map(batch => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </select>
            
            {/* Company Filter */}
            <select 
              className={styles['co-ps-filter-select']}
              name="company"
              value={filters.company}
              onChange={handleFilterChange}
            >
              {uniqueCompanies.map(company => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
            
            {/* Job Role Filter */}
            <select 
              className={styles['co-ps-filter-select']}
              name="jobRole"
              value={filters.jobRole}
              onChange={handleFilterChange}
            >
              <option value="All Job Roles">All Job Roles</option>
              {uniqueJobRoles.map(role => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div className={styles['co-ps-dashboard-grid']}>
            <div className={styles['co-ps-stats-section']}>
              <div className={`${styles['co-ps-stat-card']} ${styles['co-ps-card-purple']}`}>
                <h3 className={styles['co-ps-card-placed-students']}>Total Placed Students</h3>
                <p>{stats.totalPlaced}</p>
              </div>
              <div className={`${styles['co-ps-stat-card']} ${styles['co-ps-card-teal']}`}>
                <h3>Total Offers Recieved</h3>
                <p>{stats.totalOffers}</p>
              </div>
              <div className={`${styles['co-ps-stat-card']} ${styles['co-ps-card-blue']}`}>
                <h3>Highest Package</h3>
                <p>{stats.highestPackage.toFixed(1)} LPA</p>
              </div>
              <div className={`${styles['co-ps-stat-card']} ${styles['co-ps-card-orange']}`}>
                <h3>Average Package</h3>
                <p>{stats.averagePackage.toFixed(1)} LPA</p>
              </div>
            </div>
            
            {/* Company Job Roles Bar Chart */}
            <div className={styles['co-ps-chart-container']}>
              <h3>{filters.company === 'All Companies' ? 'Company Name' : filters.company}</h3>
              <BarChartComponent data={companyChartData} />
            </div>
          </div>
          
          <div className={styles['co-ps-table-container']}>
            <h3>PLACED STUDENTS DETAILS</h3>

            <div className={styles['co-ps-dropdown-container']}>
              <button className={styles['co-ps-print-btn']} onClick={() => setOpen(!open)} >
                Print
              </button>
              {open && (
                <div className={styles['co-ps-dropdown-menu']}>
                  <span onClick={handleExportToExcel}>Export to Excel</span>
                  <span onClick={handleExportToPDF}>Save as PDF</span>
                </div>
              )}
            </div>

            <div className={styles['co-ps-table-scroll']}>
              <table className={styles['co-ps-students-table']}>
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
                  {isLoading ? (
                    <tr>
                      <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                          <div className={styles['co-ps-loading-spinner']}></div>
                          <span>Loading placed students...</span>
                        </div>
                      </td>
                    </tr>
                  ) : displayedStudents.length === 0 ? (
                    <tr>
                      <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        No placed students found
                      </td>
                    </tr>
                  ) : (
                    displayedStudents.map((student) => (
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
                          <span className={`${styles['co-ps-status-badge']} ${styles['ps-status-' + student.status.toLowerCase()]}`}>
                            {student.status}
                          </span>
                        </td>
                        <td onClick={() => handleCardClick('placed-students-view')} ><EyeIcon /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
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
    </>
  );
};

export default PlacementDashboard;