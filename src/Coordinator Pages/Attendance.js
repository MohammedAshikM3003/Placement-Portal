import React, { useState } from 'react';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import './Attendance.css';
import Adminicon from "../assets/Adminicon.png";

// Sample attendance data
const initialAttendanceData = [
  { sNo: 1, name: "Arun Kumar S.", regNo: "731521104001", batch: "2023-2027", department: "CSE", date: "01/11/2025", status: "Present", inTime: "09:15 AM", outTime: "05:30 PM" },
  { sNo: 2, name: "Priya V.", regNo: "731521104002", batch: "2023-2027", department: "CSE", date: "01/11/2025", status: "Absent", inTime: "-", outTime: "-" },
  { sNo: 3, name: "Gowtham M.", regNo: "731521104003", batch: "2023-2027", department: "CSE", date: "01/11/2025", status: "Present", inTime: "09:10 AM", outTime: "05:25 PM" },
  { sNo: 4, name: "Nithya R.", regNo: "731521104004", batch: "2023-2027", department: "CSE", date: "01/11/2025", status: "Present", inTime: "09:05 AM", outTime: "05:35 PM" },
  { sNo: 5, name: "Vikram K.", regNo: "731521104005", batch: "2023-2027", department: "CSE", date: "01/11/2025", status: "Present", inTime: "09:20 AM", outTime: "05:20 PM" },
  { sNo: 6, name: "Deepika P.", regNo: "731521104006", batch: "2023-2027", department: "CSE", date: "01/11/2025", status: "Absent", inTime: "-", outTime: "-" },
  { sNo: 7, name: "Sanjay R.", regNo: "731521104007", batch: "2024-2028", department: "CSE", date: "01/11/2025", status: "Present", inTime: "09:12 AM", outTime: "05:28 PM" },
  { sNo: 8, name: "Meena L.", regNo: "731521104008", batch: "2024-2028", department: "CSE", date: "01/11/2025", status: "Present", inTime: "09:08 AM", outTime: "05:32 PM" },
  { sNo: 9, name: "Kavin S.", regNo: "731521104009", batch: "2024-2028", department: "CSE", date: "01/11/2025", status: "Present", inTime: "09:18 AM", outTime: "05:22 PM" },
  { sNo: 10, name: "Harini B.", regNo: "731521104010", batch: "2024-2028", department: "CSE", date: "01/11/2025", status: "Absent", inTime: "-", outTime: "-" }
];

function CoAttendance({ onLogout, onViewChange }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [attendanceData] = useState(initialAttendanceData);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Filter students based on selected criteria
  const filteredStudents = attendanceData.filter(student => {
    return (
      (selectedBatch === '' || student.batch === selectedBatch) &&
      (selectedDate === '' || student.date === selectedDate) &&
      (selectedStatus === '' || student.status === selectedStatus)
    );
  });

  // Calculate attendance statistics
  const totalStudents = filteredStudents.length;
  const presentStudents = filteredStudents.filter(s => s.status === 'Present').length;
  const absentStudents = filteredStudents.filter(s => s.status === 'Absent').length;
  const attendancePercentage = totalStudents > 0 ? ((presentStudents / totalStudents) * 100).toFixed(1) : 0;

  return (
    <>
      <Navbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
      <div className="co-at-layout">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onLogout={onLogout} 
          currentView="attendance" 
          onViewChange={onViewChange} 
        />
        <div className="co-at-main-content">
          <div className="co-at-header">
            <h1 className="co-at-title">Student Attendance Management</h1>
            <p className="co-at-subtitle">Track and manage student attendance records</p>
          </div>

          {/* Statistics Cards */}
          <div className="co-at-stats-container">
            <div className="co-at-stat-card">
              <div className="co-at-stat-icon co-at-stat-total">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className="co-at-stat-info">
                <h3>{totalStudents}</h3>
                <p>Total Students</p>
              </div>
            </div>

            <div className="co-at-stat-card">
              <div className="co-at-stat-icon co-at-stat-present">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>
              </div>
              <div className="co-at-stat-info">
                <h3>{presentStudents}</h3>
                <p>Present</p>
              </div>
            </div>

            <div className="co-at-stat-card">
              <div className="co-at-stat-icon co-at-stat-absent">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>
              <div className="co-at-stat-info">
                <h3>{absentStudents}</h3>
                <p>Absent</p>
              </div>
            </div>

            <div className="co-at-stat-card">
              <div className="co-at-stat-icon co-at-stat-percentage">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 12l2 2 4-4"></path>
                </svg>
              </div>
              <div className="co-at-stat-info">
                <h3>{attendancePercentage}%</h3>
                <p>Attendance Rate</p>
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="co-at-filter-card">
            <h3>Filter Attendance Records</h3>
            <div className="co-at-filter-grid">
              <div className="co-at-filter-item">
                <label>Batch</label>
                <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
                  <option value="">All Batches</option>
                  <option value="2023-2027">2023-2027</option>
                  <option value="2024-2028">2024-2028</option>
                </select>
              </div>

              <div className="co-at-filter-item">
                <label>Date</label>
                <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
                  <option value="">All Dates</option>
                  <option value="01/11/2025">01/11/2025</option>
                </select>
              </div>

              <div className="co-at-filter-item">
                <label>Status</label>
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>

              <div className="co-at-filter-item">
                <button 
                  className="co-at-clear-btn"
                  onClick={() => {
                    setSelectedBatch('');
                    setSelectedDate('');
                    setSelectedStatus('');
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Attendance Table */}
          <div className="co-at-table-card">
            <div className="co-at-table-header">
              <h3>Attendance Records ({filteredStudents.length} students)</h3>
            </div>

            <div className="co-at-table-container">
              <table className="co-at-attendance-table">
                <thead>
                  <tr>
                    <th className="co-at-th-s-no">S.No</th>
                    <th className="co-at-th-student-name">Student Name</th>
                    <th className="co-at-th-register-no">Register Number</th>
                    <th className="co-at-th-batch">Batch</th>
                    <th className="co-at-th-department">Department</th>
                    <th className="co-at-th-date">Date</th>
                    <th className="co-at-th-status">Status</th>
                    <th className="co-at-th-in-time">In-Time</th>
                    <th className="co-at-th-out-time">Out-Time</th>
                  </tr>
                </thead>
                <tbody className="co-at-table-body-content">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: "center", padding: "20px" }}>
                        No attendance records found for the selected filters
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, index) => (
                      <tr key={index}>
                        <td className="co-at-td-s-no">{student.sNo}</td>
                        <td className="co-at-td-student-name">{student.name}</td>
                        <td className="co-at-td-register-no">{student.regNo}</td>
                        <td className="co-at-td-batch">{student.batch}</td>
                        <td className="co-at-td-department">{student.department}</td>
                        <td className="co-at-td-date">{student.date}</td>
                        <td className={`co-at-td-status ${student.status === "Present" ? "status-present" : "status-absent"}`}>
                          {student.status}
                        </td>
                        <td className="co-at-td-in-time">{student.inTime}</td>
                        <td className="co-at-td-out-time">{student.outTime}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default CoAttendance;