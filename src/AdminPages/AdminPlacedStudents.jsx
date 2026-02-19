import { useState, useEffect, useCallback } from "react";
import { FaEye } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import useAdminAuth from '../utils/useAdminAuth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import AdNavbar from "../components/Navbar/Adnavbar.js";
import AdSidebar from "../components/Sidebar/Adsidebar.js";
import mongoDBService from '../services/mongoDBService';
// FIXED: Import CSS as a Module
import styles from "./AdminPlacedStudents.module.css";
import Adminicon from "../assets/Adminicon.png";
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

// Component for the Bar Chart
const BarChartComponent = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 30 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="branch" 
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

const PlacementDashboard = () => {
  useAdminAuth(); // JWT authentication verification
  // Sidebar toggle state for mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // State for data from database
  const [allStudentsData, setAllStudentsData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [branches, setBranches] = useState(['All Branches']);
  const [companies, setCompanies] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);

  // Updated filter state
  const [filters, setFilters] = useState({
    branch: 'All Branches',
    batch: 'All Batches',
    company: 'All Companies',
    jobRole: 'All Job Roles',
  });

  const [displayedStudents, setDisplayedStudents] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [chartData, setChartData] = useState([]);
  const [exportPopupState, setExportPopupState] = useState('none'); // 'none', 'progress', 'success', 'failed'
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('Excel'); // 'Excel' or 'PDF'

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Listen for sidebar close event from navigation links
  useEffect(() => {
    const handleCloseSidebar = () => {
      setIsSidebarOpen(false);
    };
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => {
      window.removeEventListener('closeSidebar', handleCloseSidebar);
    };
  }, []);

  // Function to generate bar chart data with filtered data
  const generateChartData = useCallback((data) => {
    const branchCounts = {};

    // Count students per branch
    data.forEach(student => {
      const branch = student.branch;
      if (branch) {
        branchCounts[branch] = (branchCounts[branch] || 0) + 1;
      }
    });

    // Convert to array format for chart - use "branch" as key for XAxis
    const chartDataArray = Object.keys(branchCounts).map(branch => ({
      branch: branch, // Changed from dept to branch for XAxis
      students: branchCounts[branch],
    })).sort((a, b) => a.branch.localeCompare(b.branch));

    setChartData(chartDataArray);
  }, []);

  // Fetch branches from database
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchesData = await mongoDBService.getBranches();
        console.log('Fetched branches:', branchesData);
        
        if (branchesData && branchesData.length > 0) {
          // Use branchAbbreviation for dropdown options
          const branchList = branchesData.map(b => b.branchAbbreviation).filter(Boolean);
          console.log('Branch list:', branchList);
          setBranches(['All Branches', ...branchList]);
        } else {
          // Fallback to default branches if no data
          console.log('No branches found, using defaults');
          setBranches(['All Branches', 'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL']);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
        setBranches(['All Branches', 'CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL']);
      }
    };
    fetchBranches();
  }, []);

  // Fetch placed students from database
  useEffect(() => {
    const fetchPlacedStudents = async () => {
      try {
        setIsLoading(true);
        const response = await mongoDBService.getPlacedStudents();
        
        if (response.success && response.data) {
          // Map data to match the component's expected format
          const mappedData = response.data.map((student, index) => ({
            sno: index + 1,
            name: student.name,
            regNo: student.regNo,
            branch: student.dept,
            batch: student.batch,
            company: student.company,
            role: student.role,
            pkg: student.pkg,
            date: student.date,
            status: student.status,
            yearSec: student.yearSec,
            semester: student.semester,
            phone: student.phone,
            email: student.email,
            profilePhoto: student.profilePhoto
          }));
          
          setAllStudentsData(mappedData);
          setDisplayedStudents(mappedData);
          generateChartData(mappedData);
          
          // Extract unique companies and job roles
          const uniqueCompanies = ['All Companies', ...new Set(mappedData.map(s => s.company))].sort();
          const uniqueRoles = [...new Set(mappedData.map(s => s.role))].sort();
          setCompanies(uniqueCompanies);
          setJobRoles(uniqueRoles);
        }
      } catch (error) {
        console.error('Error fetching placed students:', error);
        setAllStudentsData([]);
        setDisplayedStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlacedStudents();
  }, [generateChartData]);

  // Filter change handler with auto-apply
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    const updatedFilters = {
      ...filters,
      [name]: value,
    };
    setFilters(updatedFilters);
    
    // Auto-apply filters using allStudentsData
    const filteredData = allStudentsData.filter(student => {
      const branchMatch = updatedFilters.branch === 'All Branches' || student.branch === updatedFilters.branch;
      const batchMatch = updatedFilters.batch === 'All Batches' || student.batch === updatedFilters.batch;
      const companyMatch = updatedFilters.company === 'All Companies' || student.company === updatedFilters.company;
      const jobRoleMatch = updatedFilters.jobRole === 'All Job Roles' || student.role === updatedFilters.jobRole;
      return branchMatch && batchMatch && companyMatch && jobRoleMatch;
    });
    setDisplayedStudents(filteredData);
    generateChartData(filteredData);
  };

  // Get unique values for dropdown options
  const uniqueBatches = ['All Batches', ...new Set(allStudentsData.map(s => s.batch))].sort();

  const exportToExcel = async () => {
    try {
      setOpen(false);
      setExportType('Excel');
      setExportPopupState('progress');
      setExportProgress(0);

      // Helper function to truncate text if it exceeds Excel's cell limit
      const truncateText = (text, maxLength = 32000) => {
        if (!text) return '';
        const str = String(text);
        return str.length > maxLength ? str.substring(0, maxLength) : str;
      };

      // Format data for export with clean structure and text truncation
      const dataToExport = displayedStudents.map((student, index) => ({
        'S.No': index + 1,
        'Name': truncateText(student.name),
        'Registration No': truncateText(student.regNo),
        'Branch': truncateText(student.branch),
        'Batch': truncateText(student.batch),
        'Company': truncateText(student.company),
        'Job Role': truncateText(student.role),
        'Package (LPA)': truncateText(student.pkg),
        'Date': truncateText(student.date),
        'Status': truncateText(student.status)
      }));
      
      // Simulate progress
      setExportProgress(30);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      setExportProgress(60);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Placed Students");
      setExportProgress(90);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      XLSX.writeFile(workbook, "PlacedStudents.xlsx");
      setExportProgress(100);
      
      setTimeout(() => {
        setExportPopupState('success');
      }, 300);
    } catch (error) {
      console.error('Export to Excel failed:', error);
      setExportProgress(0);
      setExportPopupState('failed');
    }
  };

  const exportToPDF = async () => {
    try {
      setOpen(false);
      setExportType('PDF');
      setExportPopupState('progress');
      setExportProgress(0);

      // Simulate progress
      setExportProgress(20);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const doc = new jsPDF();
      doc.text("Placed Students Details", 14, 10);
      setExportProgress(50);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      autoTable(doc, {
        head: [["S.No", "Name", "Reg No", "Branch", "Batch", "Company", "Job Role", "Package", "Date", "Status"]],
        body: displayedStudents.map((s, index) => [
          index + 1,
          s.name || '',
          s.regNo || '',
          s.branch || '',
          s.batch || '',
          s.company || '',
          s.role || '',
          s.pkg || '',
          s.date || '',
          s.status || ''
        ]),
      });
      setExportProgress(90);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      doc.save("PlacedStudents.pdf");
      setExportProgress(100);
      
      setTimeout(() => {
        setExportPopupState('success');
      }, 300);
    } catch (error) {
      console.error('Export to PDF failed:', error);
      setExportProgress(0);
      setExportPopupState('failed');
    }
  };

  const onLogout = () => {
    // Implement logout logic here
  };

  return (
    <>
      <AdNavbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
      <AdSidebar isOpen={isSidebarOpen} onLogout={onLogout} />
      {/* UPDATED CLASS: Admin-ps-portal-container */}
      <div className={styles['Admin-ps-portal-container']}>
        {/* UPDATED CLASS: Admin-ps-main-content */}
        <main className={styles['Admin-ps-main-content']}>
          {/* Filters Container */}
          {/* UPDATED CLASS: Admin-ps-filters-container */}
          <div className={styles['Admin-ps-filters-container']}>
            {/* UPDATED CLASS: Admin-ps-filter-select */}
            <select
              className={styles['Admin-ps-filter-select']}
              name="branch"
              value={filters.branch}
              onChange={handleFilterChange}
            >
              {branches.map(branch => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            {/* UPDATED CLASS: Admin-ps-filter-select */}
            <select
              className={styles['Admin-ps-filter-select']}
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
            {/* UPDATED CLASS: Admin-ps-filter-select */}
            <select
              className={styles['Admin-ps-filter-select']}
              name="company"
              value={filters.company}
              onChange={handleFilterChange}
            >
              {companies.map(company => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>
            {/* Job Role dropdown */}
            <select
              className={styles['Admin-ps-filter-select']}
              name="jobRole"
              value={filters.jobRole}
              onChange={handleFilterChange}
            >
              <option value="All Job Roles">All Job Roles</option>
              {jobRoles.map(role => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Dashboard Grid with Stats and Chart */}
          {/* UPDATED CLASS: Admin-ps-dashboard-grid */}
          <div className={styles['Admin-ps-dashboard-grid']}>
            {/* UPDATED CLASS: Admin-ps-stats-section */}
            <div className={styles['Admin-ps-stats-section']}>
              {/* UPDATED CLASSES: Admin-ps-stat-card, Admin-ps-card-purple, Admin-ps-card-placed-students */}
              <div className={`${styles['Admin-ps-stat-card']} ${styles['Admin-ps-card-purple']}`}>
                <h3 className={styles['Admin-ps-card-placed-students']}>Total Placed Students</h3>
                <p>{displayedStudents.length}</p>
              </div>
              {/* UPDATED CLASSES: Admin-ps-stat-card, Admin-ps-card-teal */}
              <div className={`${styles['Admin-ps-stat-card']} ${styles['Admin-ps-card-teal']}`}>
                <h3>Total Offers Received</h3>
                <p>{displayedStudents.length}</p>
              </div>
              {/* UPDATED CLASSES: Admin-ps-stat-card, Admin-ps-card-blue */}
              <div className={`${styles['Admin-ps-stat-card']} ${styles['Admin-ps-card-blue']}`}>
                <h3>Highest Package</h3>
                <p>{displayedStudents.length > 0 ? Math.max(...displayedStudents.map(s => parseFloat(s.pkg) || 0)).toFixed(1) + ' LPA' : '0 LPA'}</p>
              </div>
              {/* UPDATED CLASSES: Admin-ps-stat-card, Admin-ps-card-orange */}
              <div className={`${styles['Admin-ps-stat-card']} ${styles['Admin-ps-card-orange']}`}>
                <h3>Average Package</h3>
                <p>{displayedStudents.length > 0 ? (displayedStudents.reduce((sum, s) => sum + (parseFloat(s.pkg) || 0), 0) / displayedStudents.length).toFixed(1) + ' LPA' : '0 LPA'}</p>
              </div>
            </div>

            {/* UPDATED CLASS: Admin-ps-chart-container */}
            <div className={styles['Admin-ps-chart-container']}>
              <h3>Placement by Branches</h3>
              <BarChartComponent data={chartData} />
            </div>
          </div>

          {/* Table Container */}
          {/* UPDATED CLASS: Admin-ps-table-container */}
          <div className={styles['Admin-ps-table-container']}>
            <div className={styles['Admin-ps-table-header-row']}>
              <h3 className={styles['Admin-ps-table-title']}>DETAILED PLACED STUDENT RECORDS</h3>
              <div className={styles['Admin-ps-table-actions']}>
                <div className={styles['Admin-ps-print-button-container']}>
                  <button
                    className={styles['Admin-ps-print-btn']}
                    onClick={() => setOpen(!open)}
                  >
                    Print
                  </button>
                  {open && (
                    <div className={styles['Admin-ps-export-menu']}>
                      <button onClick={exportToExcel}>Export to Excel</button>
                      <button onClick={exportToPDF}>Export to PDF</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles['Admin-ps-table-scroll']}>
              <table className={styles['Admin-ps-students-table']}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Name</th>
                    <th>Reg No.</th>
                    <th>Branch</th>
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
                    <tr className={styles['Admin-ps-loading-row']}>
                      <td colSpan="11" className={styles['Admin-ps-loading-cell']}>
                        <div className={styles['Admin-ps-loading-wrapper']}>
                          <div className={styles['Admin-ps-spinner']}></div>
                          <span className={styles['Admin-ps-loading-text']}>Loading placed students...</span>
                        </div>
                      </td>
                    </tr>
                  ) : displayedStudents.length === 0 ? (
                    <tr>
                      <td colSpan="11" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                        No placed students found
                      </td>
                    </tr>
                  ) : (
                    displayedStudents.map((student) => (
                      <tr key={student.sno}>
                        <td>{student.sno}</td>
                        <td style={{ fontWeight: '600' }}>{student.name}</td>
                        <td>{student.regNo}</td>
                        <td>{student.branch}</td>
                        <td>{student.batch}</td>
                        <td>{student.company}</td>
                        <td>{student.role}</td>
                        <td>{student.pkg}</td>
                        <td>{student.date}</td>
                        <td>
                          <span className={`${styles['Admin-ps-status-badge']} ${styles[`Admin-ps-status-${student.status.toLowerCase()}`]}`}>
                            {student.status}
                          </span>
                        </td>
                        <td onClick={() => navigate(`/coo-view-Admin-ps`)}>
                          <FaEye className={styles['Admin-ps-action-icon']} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

      </main>
    </div>

    {isSidebarOpen && (
      <div
        className={styles['Admin-ps-overlay']}
        onClick={() => setIsSidebarOpen(false)}
      />
    )}
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
};

export default PlacementDashboard;