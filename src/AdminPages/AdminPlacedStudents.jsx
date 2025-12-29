import { useState, useEffect } from "react";
import { FaEye } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import AdNavbar from "../components/Navbar/Adnavbar.js";
import AdSidebar from "../components/Sidebar/Adsidebar.js";
// FIXED: Import CSS as a Module
import styles from "./AdminPlacedStudents.module.css";

// Component for the Bar Chart
const BarChartComponent = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="dept" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="students" fill="#7B68EE" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const PlacementDashboard = () => {
  // Updated data with different departments
  const allStudentsData = [
    { sno: 1, name: 'Ridhan', regNo: '73152313001', dept: 'CSE', batch: '2023-2027', company: 'Infosys', role: 'Software Engineer', pkg: '12.0 LPA', date: '29/08/25', status: 'Accepted' },
    { sno: 2, name: 'Vibin', regNo: '73152313002', dept: 'ECE', batch: '2023-2027', company: 'Wipro', role: 'Data Analyst', pkg: '4.0 LPA', date: '19/09/25', status: 'Rejected' },
    { sno: 3, name: 'Nithin', regNo: '73152313003', dept: 'IT', batch: '2023-2027', company: 'TCS', role: 'Tester', pkg: '3.0 LPA', date: '26/07/25', status: 'Pending' },
    { sno: 4, name: 'Sandy', regNo: '73152313004', dept: 'CIVIL', batch: '2023-2027', company: 'L&T', role: 'Site Engineer', pkg: '5.0 LPA', date: '15/08/25', status: 'Accepted' },
    { sno: 5, name: 'Adhithya', regNo: '73152313005', dept: 'MECH', batch: '2023-2027', company: 'Ashok Leyland', role: 'Design Engineer', pkg: '6.0 LPA', date: '10/09/25', status: 'Accepted' },
    { sno: 6, name: 'Kishore', regNo: '73152313006', dept: 'EEE', batch: '2023-2027', company: 'ABB', role: 'Electrical Engineer', pkg: '7.0 LPA', date: '22/08/25', status: 'Accepted' },
    { sno: 7, name: 'Arun', regNo: '73152313007', dept: 'ECE', batch: '204-2028', company: 'Qualcomm', role: 'Embedded Engineer', pkg: '8.0 LPA', date: '19/09/25', status: 'Rejected' },
    { sno: 8, name: 'Lilly', regNo: '73152313008', dept: 'IT', batch: '204-2028', company: 'Cognizant', role: 'System Analyst', pkg: '5.5 LPA', date: '26/07/25', status: 'Pending' },
    { sno: 9, name: 'Chann', regNo: '73152313009', dept: 'CSE', batch: '2023-2027', company: 'Google', role: 'Software Developer', pkg: '15.0 LPA', date: '05/08/25', status: 'Accepted' },
    { sno: 10, name: 'Karan', regNo: '73152313010', dept: 'CIVIL', batch: '204-2028', company: 'Tata Projects', role: 'Project Engineer', pkg: '4.5 LPA', date: '12/09/25', status: 'Accepted' },
  ];

  // Updated filter state
  const [filters, setFilters] = useState({
    dept: 'All Departments',
    batch: 'All Batches',
    company: 'All Companies',
  });

  const [displayedStudents, setDisplayedStudents] = useState([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [chartData, setChartData] = useState([]);

  // Filter change handler
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  // Filtering function
  const getFilteredStudents = (data) => {
    return data.filter(student => {
      const deptMatch = filters.dept === 'All Departments' || student.dept === filters.dept;
      const batchMatch = filters.batch === 'All Batches' || student.batch === filters.batch;
      const companyMatch = filters.company === 'All Companies' || student.company === filters.company;
      return deptMatch && batchMatch && companyMatch;
    });
  };

  // Function to generate bar chart data
  const generateChartData = () => {
    const deptCounts = {
      CSE: 0,
      ECE: 0,
      IT: 0,
      CIVIL: 0,
      MECH: 0,
      EEE: 0,
    };

    allStudentsData.forEach(student => {
      if (deptCounts[student.dept] !== undefined) {
        deptCounts[student.dept]++;
      }
    });

    const data = Object.keys(deptCounts).map(dept => ({
      dept: dept,
      students: deptCounts[dept],
    }));

    setChartData(data);
  };

  const applyTableFilters = () => {
    const filteredData = getFilteredStudents(allStudentsData);
    setDisplayedStudents(filteredData);
  };

  useEffect(() => {
    applyTableFilters();
    generateChartData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get unique values for dropdown options
  const uniqueDepartments = ['All Departments', 'CSE', 'IT', 'CIVIL', 'MECH', 'ECE', 'EEE'];
  const uniqueBatches = ['All Batches', ...new Set(allStudentsData.map(s => s.batch))].sort();
  const uniqueCompanies = ['All Companies', ...new Set(allStudentsData.map(s => s.company))].sort();

  const exportToExcel = () => {
    const dataToExport = displayedStudents;
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Placed Students");
    XLSX.writeFile(workbook, "PlacedStudents.xlsx");
    setOpen(false);
  };

  const exportToPDF = () => {
    const dataToExport = displayedStudents;
    const doc = new jsPDF();
    doc.text("Placed Students Details", 14, 10);
    autoTable(doc, {
      head: [["S.No", "Name", "Reg No", "Department", "Batch", "Company", "Job Role", "Package", "Date", "Status"]],
      body: dataToExport.map((s) => [
        s.sno, s.name, s.regNo, s.dept, s.batch, s.company, s.role, s.pkg, s.date, s.status,
      ]),
    });
    doc.save("PlacedStudents.pdf");
    setOpen(false);
  };

  return (
    <>
      <AdNavbar />
      <AdSidebar />
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
              name="dept"
              value={filters.dept}
              onChange={handleFilterChange}
            >
              {uniqueDepartments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'All Departments' ? 'All Departments' : dept}
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
                  {batch === 'All Batches' ? 'All Batches' : `Batch: ${batch}`}
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
              {uniqueCompanies.map(company => (
                <option key={company} value={company}>
                  {company === 'All Companies' ? 'All Companies' : company}
                </option>
              ))}
            </select>
            {/* UPDATED CLASS: Admin-ps-filter-btn */}
            <button
              className={styles['Admin-ps-filter-btn']}
              onClick={applyTableFilters}
            >
              Filter
            </button>
          </div>

          {/* Dashboard Grid with Stats and Chart */}
          {/* UPDATED CLASS: Admin-ps-dashboard-grid */}
          <div className={styles['Admin-ps-dashboard-grid']}>
            {/* UPDATED CLASS: Admin-ps-stats-section */}
            <div className={styles['Admin-ps-stats-section']}>
              {/* UPDATED CLASSES: Admin-ps-stat-card, Admin-ps-card-purple, Admin-ps-card-placed-students */}
              <div className={`${styles['Admin-ps-stat-card']} ${styles['Admin-ps-card-purple']}`}>
                <h3 className={styles['Admin-ps-card-placed-students']}>Total Placed Students</h3>
                <p>350</p>
              </div>
              {/* UPDATED CLASSES: Admin-ps-stat-card, Admin-ps-card-teal */}
              <div className={`${styles['Admin-ps-stat-card']} ${styles['Admin-ps-card-teal']}`}>
                <h3>Total Offers Received</h3>
                <p>400</p>
              </div>
              {/* UPDATED CLASSES: Admin-ps-stat-card, Admin-ps-card-blue */}
              <div className={`${styles['Admin-ps-stat-card']} ${styles['Admin-ps-card-blue']}`}>
                <h3>Highest Package</h3>
                <p>15 LPA</p>
              </div>
              {/* UPDATED CLASSES: Admin-ps-stat-card, Admin-ps-card-orange */}
              <div className={`${styles['Admin-ps-stat-card']} ${styles['Admin-ps-card-orange']}`}>
                <h3>Average Package</h3>
                <p>6.5 LPA</p>
              </div>
            </div>

            {/* UPDATED CLASS: Admin-ps-chart-container */}
            <div className={styles['Admin-ps-chart-container']}>
              <h3>Placement by Departments</h3>
              <BarChartComponent data={chartData} />
            </div>
          </div>

          {/* Table Container */}
          {/* UPDATED CLASS: Admin-ps-table-container */}
          <div className={styles['Admin-ps-table-container']}>
            <h3>DETAILED PLACED STUDENT RECORDS</h3>

            {/* UPDATED CLASS: Admin-ps-dropdown-container, Admin-ps-filter-btn, Admin-ps-dropdown-menu */}
            <div className={styles['Admin-ps-dropdown-container']}>
              <button className={styles['Admin-ps-filter-btn']} onClick={() => setOpen(!open)}>
                Print
              </button>
              {open && (
                <div className={styles['Admin-ps-dropdown-menu']}>
                  <span onClick={exportToExcel}>Export to Excel</span>
                  <span onClick={exportToPDF}>Save as PDF</span>
                </div>
              )}
            </div>

            {/* UPDATED CLASS: Admin-ps-table-scroll, Admin-ps-students-table */}
            <div className={styles['Admin-ps-table-scroll']}>
              <table className={styles['Admin-ps-students-table']}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Name</th>
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
                        {/* UPDATED CLASSES: Admin-ps-status-badge, Admin-ps-status-accepted/rejected/pending */}
                        <span className={`${styles['Admin-ps-status-badge']} ${styles[`Admin-ps-status-${student.status.toLowerCase()}`]}`}>
                          {student.status}
                        </span>
                      </td>
                      <td onClick={() => navigate(`/coo-view-Admin-ps`)}>
                        {/* UPDATED CLASS: Admin-ps-action-icon */}
                        <FaEye className={styles['Admin-ps-action-icon']} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default PlacementDashboard;