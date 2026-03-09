import React, { useMemo, useState } from "react";
import useCoordinatorAuth from "../utils/useCoordinatorAuth";
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';
import "./Coo_TrainAttendanceStuinfo.css";

const pad2 = (n) => String(n).padStart(2, '0');
const getTodayDMY = () => {
  const d = new Date();
  return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
};

const getMostRecentDate = () => {
  const dates = studentData.map((s) => s.date).filter(Boolean);
  if (dates.length === 0) return getTodayDMY();
  return dates.sort((a, b) => {
    const [da, ma, ya] = a.split('-').map(Number);
    const [db, mb, yb] = b.split('-').map(Number);
    return new Date(yb, mb - 1, db) - new Date(ya, ma - 1, da);
  })[0];
};

const studentData = [
  { id: 1, name: "Maneesh Adhithya", regNo: "73152313038", dept: "CSE", year: "III", section: "A", phone: "9898986547", date: "25-02-2025", status: "-" },
  { id: 2, name: "Chandan", regNo: "73152313049", dept: "CSE", year: "III", section: "B", phone: "9788657300", date: "25-02-2025", status: "-" },
  { id: 3, name: "Rovinder Singh", regNo: "73152313052", dept: "CSE", year: "III", section: "B", phone: "7845014685", date: "25-02-2025", status: "-" },
  { id: 4, name: "Divam Balwal", regNo: "73152313061", dept: "CSE", year: "III", section: "B", phone: "6369123456", date: "25-02-2025", status: "-" },
  { id: 5, name: "Mohammed Ashik", regNo: "73152313075", dept: "CSE", year: "III", section: "A", phone: "9380171449", date: "25-02-2025", status: "-" },
  { id: 6, name: "Gowrinath", regNo: "73152313088", dept: "CSE", year: "III", section: "B", phone: "7812845645", date: "25-02-2025", status: "-" },
  { id: 7, name: "Karthik Raj", regNo: "73152313095", dept: "CSE", year: "III", section: "A", phone: "9876543210", date: "25-02-2025", status: "-" },
  { id: 8, name: "Priya Sharma", regNo: "73152313102", dept: "CSE", year: "III", section: "B", phone: "8765432109", date: "25-02-2025", status: "-" },
  { id: 9, name: "Arun Kumar", regNo: "73152313115", dept: "CSE", year: "III", section: "A", phone: "7654321098", date: "25-02-2025", status: "-" },
  { id: 10, name: "Deepika R", regNo: "73152313128", dept: "CSE", year: "III", section: "B", phone: "6543210987", date: "25-02-2025", status: "-" },
  { id: 11, name: "Vignesh S", regNo: "73152313135", dept: "CSE", year: "III", section: "A", phone: "5432109876", date: "25-02-2025", status: "-" },
  { id: 12, name: "Anjali K", regNo: "73152313142", dept: "CSE", year: "III", section: "B", phone: "4321098765", date: "25-02-2025", status: "-" },
];

export default function CooTrainAttendanceStuinfo({ onLogout, onViewChange }) {
  useCoordinatorAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [activeTraining, setActiveTraining] = useState("R-Sequence");
  const [activeBatch, setActiveBatch] = useState("Batch-1");
  const [students, setStudents] = useState(studentData);
  const [pendingChanges, setPendingChanges] = useState({});

  const [filters, setFilters] = useState({
    nameOrRegNo: "",
    year: "",
    section: "",
    date: getMostRecentDate(),
  });
  const [statusFilter, setStatusFilter] = useState("all"); // all, present, absent
  const [exportPopupState, setExportPopupState] = useState('none'); // 'none', 'progress', 'success', 'failed'
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('');
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const filteredStudents = useMemo(() => {
    const searchQ = (filters.nameOrRegNo || "").trim().toLowerCase();
    const yearQ = (filters.year || "").trim().toLowerCase();
    const sectionQ = (filters.section || "").trim().toLowerCase();
    const dateQ = (filters.date || "").trim();

    return students.filter((s) => {
      // First input: search both name and regNo
      const nameMatch = !searchQ || (s.name || "").toLowerCase().includes(searchQ);
      const regMatch = !searchQ || (s.regNo || "").toLowerCase().includes(searchQ);
      const nameOrRegMatch = !searchQ || nameMatch || regMatch;
      
      // Second input: year filter
      const yearMatch = !yearQ || (s.year || "").toLowerCase() === yearQ;
      
      // Third input: section filter
      const sectionMatch = !sectionQ || (s.section || "").toLowerCase() === sectionQ;

      const dateMatch = !dateQ || (s.date || '') === dateQ;
      
      const statusMatch = statusFilter === "all" || s.status.toLowerCase() === statusFilter;
      return nameOrRegMatch && yearMatch && sectionMatch && dateMatch && statusMatch;
    });
  }, [students, filters.nameOrRegNo, filters.year, filters.section, filters.date, statusFilter]);

  const handleCheckboxChange = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStudents(students.map((s) => s.id));
    } else {
      setSelectedStudents([]);
    }
  };

  const handleStatusUpdate = (id, status) => {
    setPendingChanges((prev) => ({ ...prev, [id]: status }));
  };

  const handleBatchStatusUpdate = (status) => {
    if (selectedStudents.length === 0) return;
    const updates = {};
    selectedStudents.forEach((id) => {
      updates[id] = status;
    });
    setPendingChanges((prev) => ({ ...prev, ...updates }));
  };

  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleUpdateClick = () => {
    if (Object.keys(pendingChanges).length === 0) return;
    // Directly apply updates and show success popup
    setStudents((prev) =>
      prev.map((s) =>
        pendingChanges[s.id] ? { ...s, status: pendingChanges[s.id] } : s
      )
    );
    setPendingChanges({});
    setShowSuccessPopup(true);
  };

  const handleDiscard = () => {
    setPendingChanges({});
  };

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  const handleRemoveStudents = () => {
    if (selectedStudents.length === 0) return;
    setStudents((prev) => prev.filter((s) => !selectedStudents.includes(s.id)));
    setSelectedStudents([]);
  };

  const simulateExport = async (type, exportFn) => {
    setShowExportDropdown(false);
    setExportType(type);
    setExportProgress(0);
    setExportPopupState('progress');

    let progressInterval;
    let progressTimeout;

    try {
      // Simulate progress from 0 to 100
      progressInterval = setInterval(() => {
        setExportProgress((prev) => Math.min(prev + 10, 100));
      }, 200);

      // Wait for progress animation to complete
      await new Promise((resolve) => {
        progressTimeout = setTimeout(() => {
          clearInterval(progressInterval);
          resolve();
        }, 2000);
      });

      // Perform the actual export
      const result = await exportFn();

      if (result !== false) {
        setExportProgress(100);
        setExportPopupState('success');
      } else {
        setExportPopupState('failed');
      }
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      if (progressTimeout) clearTimeout(progressTimeout);
      setExportPopupState('failed');
    }
  };

  const exportToExcel = async () => {
    try {
      // Dynamically import xlsx library
      const XLSX = await import('xlsx');
      const rows = filteredStudents.map((student, index) => ({
        "S.No": index + 1,
        "Name": student.name,
        "Register Number": student.regNo,
        "Department": student.dept,
        "Year": student.year,
        "Section": student.section,
        "Phone No": student.phone,
        "Status": student.status
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 5 },   // S.No
        { wch: 20 },  // Name
        { wch: 18 },  // Register Number
        { wch: 12 },  // Department
        { wch: 5 },   // Year
        { wch: 8 },   // Section
        { wch: 12 },  // Phone No
        { wch: 10 }   // Status
      ];

      XLSX.writeFile(workbook, "attendance_data.xlsx");
      return true;
    } catch (error) {
      console.error('Excel export error:', error);
      return false;
    }
  };

  const exportToPDF = () => {
    // Only print the table - no file download
    const printWindow = window.open("", "_blank");
    const tableHTML = document.querySelector(".attendance-table").outerHTML;

    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Report</title>
          <style>
            @media print {
              body { margin: 20px; }
            }
            table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; }
            th, td { padding: 10px; border: 1px solid #ddd; text-align: center; }
            th { background-color: #f5f5f5; font-weight: 600; }
            h2 { text-align: center; color: #333; font-family: Arial, sans-serif; margin-bottom: 20px; }
            .status-present { color: #4CAF50; font-weight: 600; }
            .status-absent { color: #f44336; font-weight: 600; }
          </style>
        </head>
        <body>
          <h2>Attendance Details</h2>
          ${tableHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleExportExcel = () => {
    simulateExport("Excel", exportToExcel);
  };

  const handleExportPDF = () => {
    simulateExport("PDF", exportToPDF);
  };

  return (
    <div className="coordinator-main-wrapper train-attendance-page">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="coordinator-main-layout">
        <Sidebar
          isOpen={isSidebarOpen}
          onLogout={onLogout}
          currentView="training"
          onViewChange={onViewChange}
        />
        <div className="coordinator-content-area">
          <div className="train-attendance-container">
            {/* Top Row - Two Columns */}
            <div className="top-row">
              {/* Left: Filter Section */}
              <div className="filter-card">
                <div className="ta-filter-tabs-container">
                  <button className="ta-filter-tab-button" type="button">
                    Phase - I
                  </button>
                </div>

                <div className="ta-filter-fields-container">
                  <div className="ta-filter-fields-row">
                    <div className="ta-filter-input-wrapper">
                      <input
                        id="ta-filter-name-regno"
                        className="ta-filter-input"
                        type="text"
                        required
                        value={filters.nameOrRegNo}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, nameOrRegNo: e.target.value }))
                        }
                      />
                      <label className="ta-filter-label" htmlFor="ta-filter-name-regno">
                        Name/Reg No
                      </label>
                    </div>

                    <div className="ta-filter-input-wrapper">
                      <select
                        id="ta-filter-year"
                        className="ta-filter-input"
                        required
                        value={filters.year}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, year: e.target.value }))
                        }
                      >
                        <option value="" disabled></option>
                        <option value="I">I</option>
                        <option value="II">II</option>
                        <option value="III">III</option>
                        <option value="IV">IV</option>
                      </select>
                      <label className="ta-filter-label" htmlFor="ta-filter-year">
                        Year
                      </label>
                    </div>
                  </div>

                  <div className="ta-filter-fields-row">
                    <div className="ta-filter-input-wrapper">
                      <select
                        id="ta-filter-section"
                        className="ta-filter-input"
                        required
                        value={filters.section}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, section: e.target.value }))
                        }
                      >
                        <option value="" disabled></option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                      </select>
                      <label className="ta-filter-label" htmlFor="ta-filter-section">
                        Section
                      </label>
                    </div>

                    <div className="ta-filter-input-wrapper">
                      <select
                        id="ta-filter-date"
                        className="ta-filter-input"
                        value={filters.date}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, date: e.target.value }))
                        }
                      >
                        {[getTodayDMY(), ...Array.from(new Set(students.map((s) => s.date).filter(Boolean))).filter(d => d !== getTodayDMY()).sort()].map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <label className="ta-filter-label" htmlFor="ta-filter-date">
                        Date
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Buttons Section (no card) */}
              <div className="buttons-section">
                <div className="ta-buttons-white-card">
                  {/* Training Sequence Buttons */}
                  <div className="training-buttons-row">
                    <button
                      className={`training-seq-btn ${activeTraining === "R-Sequence" ? "active" : ""}`}
                      onClick={() => setActiveTraining("R-Sequence")}
                    >
                      R - Sequence
                    </button>
                    <button
                      className={`training-seq-btn ${activeTraining === "X-Plore" ? "active" : ""}`}
                      onClick={() => setActiveTraining("X-Plore")}
                    >
                      X - Plore
                    </button>
                    <button
                      className={`training-seq-btn ${activeTraining === "Z-Sequence" ? "active" : ""}`}
                      onClick={() => setActiveTraining("Z-Sequence")}
                    >
                      Z - Sequence
                    </button>
                    <button
                      className={`training-seq-btn ${activeTraining === "A-Sequence" ? "active" : ""}`}
                      onClick={() => setActiveTraining("A-Sequence")}
                    >
                      A - Sequence
                    </button>
                    <button
                      className={`training-seq-btn ${activeTraining === "B-Sequence" ? "active" : ""}`}
                      onClick={() => setActiveTraining("B-Sequence")}
                    >
                      B - Sequence
                    </button>
                  </div>

                  <div className="ta-buttons-divider" />

                  {/* Batch Buttons */}
                  <div className="batch-buttons-row">
                    <button
                      className={`batch-btn ${activeBatch === "Batch-1" ? "active" : ""}`}
                      onClick={() => setActiveBatch("Batch-1")}
                    >
                      Batch - 1
                    </button>
                    <button
                      className={`batch-btn ${activeBatch === "Batch-2" ? "active" : ""}`}
                      onClick={() => setActiveBatch("Batch-2")}
                    >
                      Batch - 2
                    </button>
                    <button
                      className={`batch-btn ${activeBatch === "Batch-3" ? "active" : ""}`}
                      onClick={() => setActiveBatch("Batch-3")}
                    >
                      Batch - 3
                    </button>
                    <button
                      className={`batch-btn ${activeBatch === "Batch-4" ? "active" : ""}`}
                      onClick={() => setActiveBatch("Batch-4")}
                    >
                      Batch - 4
                    </button>
                    <button
                      className={`batch-btn ${activeBatch === "Batch-5" ? "active" : ""}`}
                      onClick={() => setActiveBatch("Batch-5")}
                    >
                      Batch - 5
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons-row">
                  <button 
                    className={`action-btn present-btn ${statusFilter === 'present' ? 'active' : ''}`} 
                    onClick={() => handleBatchStatusUpdate('Present')}
                  >
                    Present
                  </button>
                  <button 
                    className={`action-btn absent-btn ${statusFilter === 'absent' ? 'active' : ''}`} 
                    onClick={() => handleBatchStatusUpdate('Absent')}
                  >
                    Absent
                  </button>
                  <button 
                    className="action-btn remove-btn" 
                    onClick={handleRemoveStudents}
                    disabled={selectedStudents.length === 0}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row: Attendance Table Section */}
            <div className="attendance-table-section">
              <div className="table-header">
                <h2 className="table-title">ATTENDANCE DETAILS</h2>
                <div className="print-btn-container">
                  <button className="print-btn" onClick={() => setShowExportDropdown(!showExportDropdown)}>Print</button>
                  {showExportDropdown && (
                    <div className="export-dropdown-menu">
                      <div className="export-dropdown-item" onClick={handleExportExcel}>Export to Excel</div>
                      <div className="export-dropdown-item" onClick={handleExportPDF}>Save as PDF</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="table-wrapper">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th className="col-select">Select</th>
                      <th className="col-sno">S.No</th>
                      <th className="col-name">Name</th>
                      <th className="col-reg">Register Number</th>
                      <th className="col-dept">Department</th>
                      <th className="col-year">Year</th>
                      <th className="col-section">Section</th>
                      <th className="col-phone">Phone No</th>
                      <th className="col-view">View</th>
                      <th className="col-status">Status</th>
                      <th className="col-action">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => {
                      const displayStatus = pendingChanges[student.id] || student.status;
                      return (
                        <tr key={student.id} className={selectedStudents.includes(student.id) ? 'selected-row' : ''}>
                          <td className="col-select">
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => handleCheckboxChange(student.id)}
                            />
                          </td>
                          <td className="col-sno">{index + 1}</td>
                          <td className="col-name">{student.name}</td>
                          <td className="col-reg">{student.regNo}</td>
                          <td className="col-dept">{student.dept}</td>
                          <td className="col-year">{student.year}</td>
                          <td className="col-section">{student.section}</td>
                          <td className="col-phone">{student.phone}</td>
                          <td className="col-view">
                            <span className="view-icon"></span>
                          </td>
                          <td className="col-status">
                            <span className={`status-text ${displayStatus.toLowerCase()}`}>
                              {displayStatus}
                            </span>
                          </td>
                          <td className="col-action">
                            <div className="action-btns">
                              <button className="present-small-btn" onClick={() => handleStatusUpdate(student.id, "Present")}>Present</button>
                              <button className="absent-small-btn" onClick={() => handleStatusUpdate(student.id, "Absent")}>Absent</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer Actions inside Table */}
              <div className="bottom-actions">
                <button 
                  className="discard-btn" 
                  onClick={handleDiscard}
                >
                  Discard
                </button>
                <button 
                  className="update-btn" 
                  onClick={handleUpdateClick}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Popup - Exact copy from Achievements page */}
      {showSuccessPopup && (
        <div className="Edit-popup-overlay">
          <div className="Edit-popup-container">
            <div className="Edit-popup-header">Update!</div>
            <div className="Edit-popup-body">
              <svg className="Edit-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className="Edit-success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
                <path className="Edit-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
              </svg>
              <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
                Attendance Updated ✓
              </h2>
              <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
                Changes are Updated
              </p>
            </div>
            <div className="Edit-popup-footer">
              <button onClick={() => setShowSuccessPopup(false)} className="Edit-popup-close-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
    </div>
  );
}
