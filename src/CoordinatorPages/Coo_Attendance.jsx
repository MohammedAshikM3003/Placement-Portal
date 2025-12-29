import React, { useState, useEffect } from 'react';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import styles from './Coo_Attendance.module.css';

const cx = (...classNames) => classNames.filter(Boolean).join(' ');

export default function Attendance({ onLogout, currentView, onViewChange }) {

  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState("All Batches");
  const [selectedDate, setSelectedDate] = useState("");

  const [filteredStudents, setFilteredStudents] = useState([]);

  const studentsData = [
    { sNo: 1, name: "Prabhu", regNo: "73151234567", batch: "2024-2028", department: "CSE", date: "01-08-2025", status: "Present", inTime: "9:00 AM", outTime: "4:00 PM" },
    { sNo: 2, name: "Sathish", regNo: "73151234568", batch: "2024-2028", department: "CSE", date: "01-08-2025", status: "Present", inTime: "9:15 AM", outTime: "4:05 PM" },
    { sNo: 3, name: "Murali", regNo: "73151234569", batch: "2023-2027", department: "CSE", date: "02-08-2025", status: "Absent", inTime: "-", outTime: "-" },
    { sNo: 4, name: "Divya", regNo: "73151234570", batch: "2024-2028", department: "CSE", date: "02-08-2025", status: "Present", inTime: "9:30 AM", outTime: "4:00 PM" },
    { sNo: 5, name: "Karthik", regNo: "73151234571", batch: "2025-2029", department: "CSE", date: "03-08-2025", status: "Present", inTime: "9:00 AM", outTime: "4:15 PM" },
    { sNo: 6, name: "Priya", regNo: "73151234572", batch: "2023-2027", department: "CSE", date: "03-08-2025", status: "Absent", inTime: "-", outTime: "-" },
    { sNo: 7, name: "Arun", regNo: "73151234573", batch: "2024-2028", department: "CSE", date: "04-08-2025", status: "Present", inTime: "9:05 AM", outTime: "4:10 PM" },
    { sNo: 8, name: "Deepa", regNo: "73151234574", batch: "2025-2029", department: "CSE", date: "04-08-2025", status: "Present", inTime: "9:20 AM", outTime: "4:00 PM" },
    { sNo: 9, name: "Vikram", regNo: "73151234575", batch: "2024-2028", department: "CSE", date: "05-08-2025", status: "Present", inTime: "9:10 AM", outTime: "4:20 PM" },
    { sNo: 10, name: "Poornima", regNo: "73151234576", batch: "2023-2027", department: "CSE", date: "05-08-2025", status: "Absent", inTime: "-", outTime: "-" },
  ];

  const handleFilterClick = () => {
    let newFilteredData = studentsData;
    if (selectedDate) {
      const [year, month, day] = selectedDate.split('-');
      const formattedDate = `${day}-${month}-${year}`;
      newFilteredData = newFilteredData.filter(student => student.date === formattedDate);
    }
    if (selectedBatch !== "All Batches") {
      const selectedYear = selectedBatch.substring(0, 4);
      newFilteredData = newFilteredData.filter(student => student.batch.includes(selectedYear));
    }
    setFilteredStudents(newFilteredData);
  };

  useEffect(() => {
    setFilteredStudents(studentsData);
  }, []);

  // ADDED: NEW STATE FOR RESPONSIVE SIDEBAR
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 

  // ADDED: NEW FUNCTION TO TOGGLE SIDEBAR
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const batches = ["All Batches", "2021-2025", "2022-2026", "2023-2027", "2024-2028", "2025-2029", "2026-2030", "2027-2031"];

  return (
    <div>

      {/* Navbar JSX */}
      <Navbar onToggleSidebar={toggleSidebar} />



      {/* MODIFIED: Pass state for conditional class to Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onLogout={onLogout}
        currentView="attendance"
        onViewChange={onViewChange}
      />

      <div className={styles["co-at-layout-main"]}>
        {/* Sidebar JSX */}
          

        {/* Main Content Layout */}
        <div className={styles["co-at-main-content-layout"]}>
          {/* Filter Section */}
          <div className={styles["co-at-filter-section"]}>
            <div className={styles["co-at-filter-input"]}>
              <input type="date" placeholder="Search by Date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
             {/* Filter by Department (now an input field) */}
            <div className={styles["co-at-filter-input"]}>
              <input type="text" placeholder="CSE" />
            </div>
            <div className={styles["co-at-filter-select"]}>
              <div className={styles["co-at-filter-select-display"]}>{selectedBatch}</div>
              <span className={styles["co-at-filter-select-arrow"]} onClick={() => setIsBatchOpen(!isBatchOpen)}>
                <svg width="14" height="14" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" stroke="#888" strokeWidth="2"/></svg>
              </span>
              <div
                className={cx(
                  styles["co-at-filter-select-options"],
                  isBatchOpen && styles["co-at-filter-select-options-open"]
                )}
              >
                {batches.map(batch => (
                  <div
                    key={batch}
                    className={styles["co-at-filter-select-option"]}
                    onClick={() => { setSelectedBatch(batch); setIsBatchOpen(false); }}
                  >
                    {batch}
                  </div>
                ))}
              </div>
            </div>
            <button className={styles["co-at-filter-btn"]} onClick={handleFilterClick}>Filter</button>
          </div>
          {/* Grid and Pie Chart Section */}
          <div className={styles["co-at-summary-pie-layout"]}>
            <div className={styles["co-at-summary-grid"]}>
              <div className={cx(styles["co-at-summary-card"], styles["co-at-summary-card-blue"])}>
                <div className={styles["co-at-card-label"]}>Total Students</div>
                <div className={styles["co-at-card-value"]}>500</div>
              </div>
              <div className={cx(styles["co-at-summary-card"], styles["co-at-summary-card-green"])}>
                <div className={styles["co-at-card-label"]}>Total Present</div>
                <div className={styles["co-at-card-value"]}>450</div>
              </div>
              <div className={cx(styles["co-at-summary-card"], styles["co-at-summary-card-darkblue"])}>
                <div className={styles["co-at-card-label"]}>Percentage</div>
                <div className={styles["co-at-card-value"]}>90 <span style={{ fontSize: '17px' }}>%</span></div>
              </div>
              <div className={cx(styles["co-at-summary-card"], styles["co-at-summary-card-red"])}>
                <div className={styles["co-at-card-label"]}>Total Absent</div>
                <div className={styles["co-at-card-value"]}>50</div>
              </div>
            </div>
            <div className={styles["co-at-pie-chart-section"]}>
              <div className={styles["co-at-pie-chart-header"]}>
                <div className={styles["co-at-pie-chart-title"]}>Attendance</div>
                <div className={styles["co-at-pie-chart-date"]}>dd/mm/yyyy</div>
              </div>
              <div className={styles["co-at-pie-chart-content"]}>
                <svg className={styles["co-at-pie-chart-svg"]} width="150" height="150" viewBox="0 0 32 32">
                  <circle r="16" cx="16" cy="16" fill="#2DBE7F" />
                  <path d="M16 16 L16 0 A16 16 0 0 1 31 16 Z" fill="#F04F4F" />
                  <text x="23" y="9" fontSize="3" fill="#fff" textAnchor="middle">Absent</text>
                  <text x="23" y="13" fontSize="3" fill="#fff" textAnchor="middle">41</text>
                  <text x="10" y="20" fontSize="3" fill="#fff" textAnchor="middle">Present</text>
                  <text x="10" y="24" fontSize="3" fill="#fff" textAnchor="middle">59</text>
                </svg>
                <div className={styles["co-at-pie-chart-stats"]}>
                  <div
                    className={cx(
                      styles["co-at-pie-chart-stat-row"],
                      styles["co-at-pie-chart-stat-present"]
                    )}
                  >
                    <span className={styles["co-at-pie-chart-stat-label"]}>Present</span>
                    <span className={styles["co-at-pie-chart-stat-value"]}>59</span>
                  </div>
                  <div
                    className={cx(
                      styles["co-at-pie-chart-stat-row"],
                      styles["co-at-pie-chart-stat-absent"]
                    )}
                  >
                    <span className={styles["co-at-pie-chart-stat-label"]}>Absent</span>
                    <span className={styles["co-at-pie-chart-stat-value"]}>41</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Table Section */}
          
          <div className={styles["co-at-table-section"]}>
            <div className={styles["co-at-table-header"]}>ATTENDANCE DETAILS</div>
           <div className={styles["co-at-fixed-header-wrapper"]}>
           <div className={styles["co-at-table-body-scroll"]}>
            <table className={styles["co-at-attendance-table"]} style={{ width: '100%' }}>
              <thead>
                <tr>
                    <th className={styles["co-at-th-s-no"]}>S.No</th>
                    <th className={styles["co-at-th-student-name"]}>Student Name</th>
                    <th className={styles["co-at-th-register-no"]}>Register Number</th>
                    <th className={styles["co-at-th-batch"]}>Batch</th>
                    <th className={styles["co-at-th-department"]}>Department</th>
                    <th className={styles["co-at-th-date"]}>Date</th>
                    <th className={styles["co-at-th-status"]}>Status</th>
                    <th className={styles["co-at-th-in-time"]}>In-Time</th>
                    <th className={styles["co-at-th-out-time"]}>Out-Time</th>
                </tr>
              </thead>
            
           
              <div className={styles["co-at-table-body-content"]}>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr key={index}>
                      <td className={styles["co-at-td-s-no"]}>{student.sNo}</td>
                      <td className={styles["co-at-td-student-name"]}>{student.name}</td>
                      <td className={styles["co-at-td-register-no"]}>{student.regNo}</td>
                      <td className={styles["co-at-td-batch"]}>{student.batch}</td>
                      <td className={styles["co-at-td-department"]}>{student.department}</td>
                      <td className={styles["co-at-td-date"]}>{student.date}</td>
                      <td
                        style={{ width: '10%' }}
                        className={student.status === "Present"
                          ? styles["co-at-status-present"]
                          : styles["co-at-status-absent"]}
                      >
                        {student.status}
                      </td>
                      <td className={styles["co-at-td-in-time"]}>{student.inTime}</td>
                      <td className={styles["co-at-td-out-time"]}>{student.outTime}</td>
                    </tr>
                  ))}
                </tbody>
                </div>
              </table>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}