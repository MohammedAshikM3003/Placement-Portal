import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar/Adnavbar.js";
import Sidebar from "../components/Sidebar/Adsidebar.js";
// FIXED: Import CSS as a Module
import styles from './AdminAttendance.module.css';

export default function AdminAtt({ onLogout }) {

  const [activeFilter, setActiveFilter] = useState(null);
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [isDepartmentOpen, setIsDepartmentOpen] = useState(false); 
  const [selectedBatch, setSelectedBatch] = useState("All Batches");
  const [selectedDate, setSelectedDate] = useState("");
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  
  // Data with different departments
  const studentsData = [
    { sNo: 1, name: "Prabhu", regNo: "73151234567", batch: "2024-2028", department: "CSE", date: "01-08-2025", status: "Present", inTime: "9:00 AM", outTime: "4:00 PM" },
    { sNo: 2, name: "Sathish", regNo: "73151234568", batch: "2024-2028", department: "ECE", date: "01-08-2025", status: "Present", inTime: "9:15 AM", outTime: "4:05 PM" },
    { sNo: 3, name: "Murali", regNo: "73151234569", batch: "2023-2027", department: "EEE", date: "02-08-2025", status: "Absent", inTime: "-", outTime: "-" },
    { sNo: 4, name: "Divya", regNo: "73151234570", batch: "2024-2028", department: "IT", date: "02-08-2025", status: "Present", inTime: "9:30 AM", outTime: "4:00 PM" },
    { sNo: 5, name: "Karthik", regNo: "73151234571", batch: "2025-2029", department: "MECH", date: "03-08-2025", status: "Present", inTime: "9:00 AM", outTime: "4:15 PM" },
    { sNo: 6, name: "Priya", regNo: "73151234572", batch: "2023-2027", department: "CIVIL", date: "03-08-2025", status: "Absent", inTime: "-", outTime: "-" },
    { sNo: 7, name: "Arun", regNo: "73151234573", batch: "2024-2028", department: "CSE", date: "04-08-2025", status: "Present", inTime: "9:05 AM", outTime: "4:10 PM" },
    { sNo: 8, name: "Deepa", regNo: "73151234574", batch: "2025-2029", department: "ECE", date: "04-08-2025", status: "Present", inTime: "9:20 AM", outTime: "4:00 PM" },
    { sNo: 9, name: "Vikram", regNo: "73151234575", batch: "2024-2028", department: "EEE", date: "05-08-2025", status: "Present", inTime: "9:10 AM", outTime: "4:20 PM" },
    { sNo: 10, name: "Poornima", regNo: "73151234576", batch: "2023-2027", department: "IT", date: "05-08-2025", status: "Absent", inTime: "-", outTime: "-" },
  ];

  // List of all departments for the dropdown
  const departments = ["CSE", "ECE", "EEE", "IT", "MECH", "CIVIL"];


  const handleFilterClick = () => {
    let newFilteredData = studentsData;
    
    // 1. Filter by Date
    if (selectedDate) {
      const [year, month, day] = selectedDate.split('-');
      const formattedDate = `${day}-${month}-${year}`;
      newFilteredData = newFilteredData.filter(student => student.date === formattedDate);
    }
    
    // 2. Filter by Batch
    if (selectedBatch !== "All Batches") {
      const selectedYear = selectedBatch.substring(0, 4);
      newFilteredData = newFilteredData.filter(student => student.batch.includes(selectedYear));
    }

    // 3. Filter by Department
    if (selectedDepartment) {
      newFilteredData = newFilteredData.filter(student => student.department === selectedDepartment);
    }
    
    setFilteredStudents(newFilteredData);
  };
  
  React.useEffect(() => {
      setFilteredStudents(studentsData);
  }, []);

  
  const [activeItem, setActiveItem] = useState("Attendance");
  const navigate = useNavigate();
  const [showExportMenu, setShowExportMenu] = useState(false);

  // This function will set the active item when a menu item is clicked
  const handleItemClick = (itemName) => {
    setActiveItem(itemName);
  };
  

  const batches = ["All Batches", "2021-2025", "2022-2026", "2023-2027", "2024-2028", "2025-2029", "2026-2030", "2027-2031"];

  return (
    <div>
      
      
      {/* Navbar JSX */}
      <Navbar />
        
              <Sidebar onLogout={onLogout} />

      {/* UPDATED CLASS: Admin-at-layout-main */}
      <div className={styles['Admin-at-layout-main']}>
        {/* Sidebar JSX */}
          

        {/* Main Content Layout */}
        {/* UPDATED CLASS: Admin-at-main-content-layout */}
        <div className={styles['Admin-at-main-content-layout']}>
          {/* Filter Section */}
          {/* UPDATED CLASS: Admin-at-filter-section */}
          <div className={styles['Admin-at-filter-section']}>
            {/* UPDATED CLASS: Admin-at-filter-input */}
            <div className={styles['Admin-at-filter-input']}>
              <input type="date" placeholder="Search by Date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
             {/* CORRECTED: Department Dropdown - now uses the custom list pattern */}
            {/* UPDATED CLASSES: Admin-at-filter-select, Admin-at-filter-select-display, Admin-at-filter-select-arrow, Admin-at-filter-select-options */}
            <div className={styles['Admin-at-filter-select']}>
              <div 
                className={styles['Admin-at-filter-select-display']}
                onClick={() => setIsDepartmentOpen(!isDepartmentOpen)}
              >
                {selectedDepartment || "Department"}
              </div>
              <span className={styles['Admin-at-filter-select-arrow']} onClick={() => setIsDepartmentOpen(!isDepartmentOpen)}>
                <svg width="14" height="14" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="#888" strokeWidth="2"/></svg>
              </span>
              <div className={`${styles['Admin-at-filter-select-options']} ${isDepartmentOpen ? styles['open'] : ''}`}>
                {departments.map((dept) => (
                  <div 
                    key={dept} 
                    className={styles['Admin-at-filter-select-option']} 
                    onClick={() => { setSelectedDepartment(dept); setIsDepartmentOpen(false); }}
                  >
                    {dept}
                  </div>
                ))}
              </div>
            </div>
            
            {/* UPDATED CLASSES: Admin-at-filter-select, Admin-at-filter-select-display, Admin-at-filter-select-arrow, Admin-at-filter-select-options */}
            <div className={styles['Admin-at-filter-select']}>
              <div className={styles['Admin-at-filter-select-display']}>{selectedBatch}</div>
              <span className={styles['Admin-at-filter-select-arrow']} onClick={() => setIsBatchOpen(!isBatchOpen)}>
                <svg width="14" height="14" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="#888" strokeWidth="2"/></svg>
              </span>
              <div className={`${styles['Admin-at-filter-select-options']} ${isBatchOpen ? styles['open'] : ''}`}>
                {batches.map(batch => (
                  <div key={batch} className={styles['Admin-at-filter-select-option']} onClick={() => { setSelectedBatch(batch); setIsBatchOpen(false); }}>
                    {batch}
                  </div>
                ))}
              </div>
            </div>
            {/* UPDATED CLASS: Admin-at-filter-btn */}
            <button className={styles['Admin-at-filter-btn']} onClick={handleFilterClick}>Filter</button>
          </div>
          {/* Grid and Pie Chart Section */}
          {/* UPDATED CLASS: Admin-at-summary-pie-layout */}
          <div className={styles['Admin-at-summary-pie-layout']}>
            {/* UPDATED CLASS: Admin-at-summary-grid */}
            <div className={styles['Admin-at-summary-grid']}>
              {/* UPDATED CLASSES: Admin-at-summary-card, Admin-at-summary-card-blue, Admin-at-card-label, Admin-at-card-value */}
              <div className={`${styles['Admin-at-summary-card']} ${styles['Admin-at-summary-card-blue']}`}>
                <div className={styles['Admin-at-card-label']}>Total Students</div>
                <div className={styles['Admin-at-card-value']}>500</div>
              </div>
              {/* UPDATED CLASSES: Admin-at-summary-card, Admin-at-summary-card-green */}
              <div className={`${styles['Admin-at-summary-card']} ${styles['Admin-at-summary-card-green']}`}>
                <div className={styles['Admin-at-card-label']}>Total Present</div>
                <div className={styles['Admin-at-card-value']}>450</div>
              </div>
              {/* UPDATED CLASSES: Admin-at-summary-card, Admin-at-summary-card-darkblue */}
              <div className={`${styles['Admin-at-summary-card']} ${styles['Admin-at-summary-card-darkblue']}`}>
                <div className={styles['Admin-at-card-label']}>Percentage</div>
                <div className={styles['Admin-at-card-value']}>90 <span style={{ fontSize: '17px' }}>%</span></div>
              </div>
              {/* UPDATED CLASSES: Admin-at-summary-card, Admin-at-summary-card-red */}
              <div className={`${styles['Admin-at-summary-card']} ${styles['Admin-at-summary-card-red']}`}>
                <div className={styles['Admin-at-card-label']}>Total Absent</div>
                <div className={styles['Admin-at-card-value']}>50</div>
              </div>
            </div>
            {/* UPDATED CLASS: Admin-at-pie-chart-section */}
            <div className={styles['Admin-at-pie-chart-section']}>
              {/* UPDATED CLASS: Admin-at-pie-chart-header, Admin-at-pie-chart-title, Admin-at-pie-chart-date */}
              <div className={styles['Admin-at-pie-chart-header']}>
                <div className={styles['Admin-at-pie-chart-title']}>Attendance</div>
                <div className={styles['Admin-at-pie-chart-date']}>dd/mm/yyyy</div>
              </div>
              {/* UPDATED CLASS: Admin-at-pie-chart-content, Admin-at-pie-chart-svg, Admin-at-pie-chart-stats */}
              <div className={styles['Admin-at-pie-chart-content']}>
                <svg className={styles['Admin-at-pie-chart-svg']} width="150" height="150" viewBox="0 0 32 32">
                  <circle r="16" cx="16" cy="16" fill="#2DBE7F" />
                  <path d="M16 16 L16 0 A16 16 0 0 1 31 16 Z" fill="#F04F4F" />
                  <text x="23" y="9" fontSize="3" fill="#fff" textAnchor="middle">Absent</text>
                  <text x="23" y="13" fontSize="3" fill="#fff" textAnchor="middle">41</text>
                  <text x="10" y="20" fontSize="3" fill="#fff" textAnchor="middle">Present</text>
                  <text x="10" y="24" fontSize="3" fill="#fff" textAnchor="middle">59</text>
                </svg>
                <div className={styles['Admin-at-pie-chart-stats']}>
                  {/* UPDATED CLASSES: Admin-at-pie-chart-stat-row, Admin-at-pie-chart-stat-label, Admin-at-pie-chart-stat-value */}
                  <div className={`${styles['Admin-at-pie-chart-stat-row']} ${styles['cco-at-pie-chart-stat-present']}`}>
                    <span className={styles['Admin-at-pie-chart-stat-label']}>Present</span>
                    <span className={styles['Admin-at-pie-chart-stat-value']}>59</span>
                  </div>
                  <div className={`${styles['Admin-at-pie-chart-stat-row']} ${styles['co-at-pie-chart-stat-absent']}`}>
                    <span className={styles['Admin-at-pie-chart-stat-label']}>Absent</span>
                    <span className={styles['Admin-at-pie-chart-stat-value']}>41</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Table Section */}
          
          {/* UPDATED CLASS: Admin-at-table-section, Admin-at-table-header */}
          <div className={styles['Admin-at-table-section']}>
            <div className={styles['Admin-at-table-header']}>ATTENDANCE DETAILS</div>
            {/* UPDATED CLASS: Admin-at-attendance-table-header */}
            <table className={styles['Admin-at-attendance-table-header']} style={{ width: '100%' }}>
              <thead>
                <tr>
                    <th style={{ width: '5%' }}>S.No</th>
                    <th style={{ width: '15%' }}>Student Name</th>
                    <th style={{ width: '18%' }}>Register Number</th>
                    <th style={{ width: '7%' }}>Batch</th>
                    <th style={{ width: '13%' }}>Department</th>
                    <th style={{ width: '9%' }}>Date</th>
                    <th style={{ width: '10%' }}>Status</th>
                    <th style={{ width: '11%' }}>In-Time</th>
                    <th style={{ width: '11%' }}>Out-Time</th>
                </tr>
              </thead>
            </table>
            {/* UPDATED CLASS: Admin-at-table-body-scroll */}
            <div className={styles['Admin-at-table-body-scroll']}>
              {/* UPDATED CLASS: Admin-at-attendance-table-body */}
              <table className={styles['Admin-at-attendance-table-body']} style={{ width: '102%' }}>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr key={index}>
                      <td style={{ width: '6%' }}>{student.sNo}</td>
                      <td style={{ width: '14%' }}>{student.name}</td>
                      <td style={{ width: '14%' }}>{student.regNo}</td>
                      <td style={{ width: '12%' }}>{student.batch}</td>
                      <td style={{ width: '8%' }}>{student.department}</td>
                      <td style={{ width: '10%' }}>{student.date}</td>
                      <td style={{ width: '10%' }} className={student.status === "Present" ? styles['status-present'] : styles['status-absent']}>
                        {student.status}
                      </td>
                      <td style={{ width: '11%' }}>{student.inTime}</td>
                      <td style={{ width: '11%' }}>{student.outTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}