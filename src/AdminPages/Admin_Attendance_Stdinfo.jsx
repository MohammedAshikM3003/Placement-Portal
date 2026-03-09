import React, { useMemo, useState } from "react";
import AdNavbar from "../components/Navbar/Adnavbar.js";
import AdSidebar from "../components/Sidebar/Adsidebar.js";
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';
import "./Admin_Attendance_Stdinfo.css";

const studentData = [
  { id: 1, name: "Maneesh Adhithya", regNo: "73152313038", dept: "CSE", year: "III", section: "A", phone: "9898986547", date: "25-02-2025", status: "-" },
  { id: 2, name: "Chandan", regNo: "73152313049", dept: "CSE", year: "III", section: "B", phone: "9788657300", date: "25-02-2025", status: "-" },
  { id: 3, name: "Rovinder Singh", regNo: "73152313052", dept: "CSE", year: "III", section: "B", phone: "7845014685", date: "25-02-2025", status: "-" },
  { id: 4, name: "Divam Balwal", regNo: "73152313061", dept: "CSE", year: "III", section: "B", phone: "6369123456", date: "25-02-2025", status: "-" },
  { id: 5, name: "Mohammed Ashik", regNo: "73152313075", dept: "CSE", year: "III", section: "A", phone: "9380171449", date: "25-02-2025", status: "-" },
  { id: 6, name: "Gowrinath", regNo: "73152313088", dept: "CSE", year: "III", section: "B", phone: "7812845645", date: "25-02-2025", status: "-" },
];

export default function AdminAttendanceStdinfo({ onLogout }) {
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
    date: "",
  });
  const [statusFilter] = useState("all");
  const [exportPopupState, setExportPopupState] = useState('none');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('');
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const filteredStudents = useMemo(() => {
    const searchQ = (filters.nameOrRegNo || "").trim().toLowerCase();
    const yearQ = (filters.year || "").trim().toLowerCase();
    const sectionQ = (filters.section || "").trim().toLowerCase();
    const dateQ = (filters.date || "").trim().toLowerCase();

    return students.filter((s) => {
      const nameMatch = !searchQ || (s.name || "").toLowerCase().includes(searchQ);
      const regMatch = !searchQ || (s.regNo || "").toLowerCase().includes(searchQ);
      const nameOrRegMatch = !searchQ || nameMatch || regMatch;
      const yearMatch = !yearQ || (s.year || "").toLowerCase() === yearQ;
      const sectionMatch = !sectionQ || (s.section || "").toLowerCase() === sectionQ;
      const dateMatch = !dateQ || (s.date && s.date.includes(dateQ));
      const statusMatch = statusFilter === "all" || s.status.toLowerCase() === statusFilter;
      return nameOrRegMatch && yearMatch && sectionMatch && dateMatch && statusMatch;
    });
  }, [students, filters.nameOrRegNo, filters.year, filters.section, filters.date, statusFilter]);

  const handleCheckboxChange = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
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

  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  const handleUpdateClick = () => {
    if (Object.keys(pendingChanges).length === 0) return;
    setShowConfirmPopup(true);
  };

  const handleConfirmUpdate = () => {
    setStudents((prev) =>
      prev.map((s) =>
        pendingChanges[s.id] ? { ...s, status: pendingChanges[s.id] } : s
      )
    );
    setPendingChanges({});
    setShowConfirmPopup(false);
  };

  const handleCancelUpdate = () => {
    setShowConfirmPopup(false);
  };

  const handleDiscard = () => {
    setPendingChanges({});
  };

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
      progressInterval = setInterval(() => {
        setExportProgress((prev) => Math.min(prev + 10, 100));
      }, 200);

      await new Promise((resolve) => {
        progressTimeout = setTimeout(() => {
          clearInterval(progressInterval);
          resolve();
        }, 2000);
      });

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
      const XLSX = await import('xlsx');
      const rows = filteredStudents.map((student, index) => ({
        "S.No": index + 1,
        "Name": student.name,
        "Register Number": student.regNo,
        "Department": student.dept,
        "Year": student.year,
        "Section": student.section,
        "Phone No": student.phone,
        "Date": student.date,
        "Status": student.status
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

      worksheet['!cols'] = [
        { wch: 5 }, { wch: 20 }, { wch: 18 }, { wch: 12 }, { wch: 5 },
        { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 10 }
      ];

      XLSX.writeFile(workbook, "attendance_data.xlsx");
      return true;
    } catch (error) {
      console.error('Excel export error:', error);
      return false;
    }
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    const tableHTML = document.querySelector(".attendance-table")?.outerHTML || "";

    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Report</title>
          <style>
            @media print { body { margin: 20px; } }
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
    setTimeout(() => printWindow.print(), 250);
  };

  const handleExportExcel = () => simulateExport("Excel", exportToExcel);
  const handleExportPDF = () => simulateExport("PDF", exportToPDF);

  return (
    <div className="admin-attendance-wrapper train-attendance-page">
      <AdNavbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="admin-attendance-layout">
        <AdSidebar isOpen={isSidebarOpen} onLogout={onLogout} />
        <div className="admin-attendance-content">
          <div className="train-attendance-container">
            <div className="top-row">
              <div className="filter-card">
                <div className="ta-filter-tabs-container">
                  <button className="ta-filter-tab-button" type="button">Phase - I</button>
                </div>

                <div className="ta-filter-fields-container">
                  <div className="ta-filter-fields-row">
                    <div className="ta-filter-input-wrapper">
                      <input
                        id="ta-filter-name-regno"
                        className="ta-filter-input"
                        type="text"
                        value={filters.nameOrRegNo}
                        onChange={(e) => setFilters((prev) => ({ ...prev, nameOrRegNo: e.target.value }))}
                      />
                      <label className="ta-filter-label" htmlFor="ta-filter-name-regno">Name/Reg No</label>
                    </div>
                    <div className="ta-filter-input-wrapper">
                      <select
                        id="ta-filter-year"
                        className="ta-filter-input"
                        value={filters.year}
                        onChange={(e) => setFilters((prev) => ({ ...prev, year: e.target.value }))}
                      >
                        <option value="">Year</option>
                        <option value="I">I</option>
                        <option value="II">II</option>
                        <option value="III">III</option>
                        <option value="IV">IV</option>
                      </select>
                      <label className="ta-filter-label" htmlFor="ta-filter-year">Year</label>
                    </div>
                  </div>
                  <div className="ta-filter-fields-row">
                    <div className="ta-filter-input-wrapper">
                      <select
                        id="ta-filter-section"
                        className="ta-filter-input"
                        value={filters.section}
                        onChange={(e) => setFilters((prev) => ({ ...prev, section: e.target.value }))}
                      >
                        <option value="">Section</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                      </select>
                      <label className="ta-filter-label" htmlFor="ta-filter-section">Section</label>
                    </div>
                    <div className="ta-filter-input-wrapper">
                      <input
                        id="ta-filter-date"
                        className="ta-filter-input"
                        type="text"
                        value={filters.date}
                        onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
                      />
                      <label className="ta-filter-label" htmlFor="ta-filter-date">Date</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="buttons-section">
                <div className="ta-buttons-white-card">
                  <div className="training-buttons-row">
                    {["R-Sequence", "X-Plore", "Z-Sequence", "A-Sequence", "B-Sequence"].map((t) => (
                      <button
                        key={t}
                        className={`training-seq-btn ${activeTraining === t ? "active" : ""}`}
                        onClick={() => setActiveTraining(t)}
                      >{t.replace("-", " - ")}</button>
                    ))}
                  </div>
                  <div className="ta-buttons-divider" />
                  <div className="batch-buttons-row">
                    {["Batch-1", "Batch-2", "Batch-3", "Batch-4", "Batch-5"].map((b) => (
                      <button
                        key={b}
                        className={`batch-btn ${activeBatch === b ? "active" : ""}`}
                        onClick={() => setActiveBatch(b)}
                      >{b.replace("-", " - ")}</button>
                    ))}
                  </div>
                </div>
                <div className="action-buttons-row">
                  <button className="action-btn present-btn" onClick={() => handleBatchStatusUpdate('Present')}>Present</button>
                  <button className="action-btn absent-btn" onClick={() => handleBatchStatusUpdate('Absent')}>Absent</button>
                  <button className="action-btn remove-btn" onClick={handleRemoveStudents} disabled={selectedStudents.length === 0}>Remove</button>
                </div>
              </div>
            </div>

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
                      <th className="col-date">Date</th>
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
                            <input type="checkbox" checked={selectedStudents.includes(student.id)} onChange={() => handleCheckboxChange(student.id)} />
                          </td>
                          <td className="col-sno">{index + 1}</td>
                          <td className="col-name">{student.name}</td>
                          <td className="col-reg">{student.regNo}</td>
                          <td className="col-dept">{student.dept}</td>
                          <td className="col-year">{student.year}</td>
                          <td className="col-section">{student.section}</td>
                          <td className="col-phone">{student.phone}</td>
                          <td className="col-date">{student.date || '-'}</td>
                          <td className="col-view"><span className="view-icon"></span></td>
                          <td className="col-status">
                            <span className={`status-text ${displayStatus.toLowerCase()}`}>{displayStatus}</span>
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

              <div className="bottom-actions">
                <button className="discard-btn" onClick={handleDiscard}>Discard</button>
                <button className="update-btn" onClick={handleUpdateClick}>Update</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirmPopup && (
        <div className="confirm-popup-overlay">
          <div className="confirm-popup-container">
            <div className="confirm-popup-header">Confirm Update</div>
            <div className="confirm-popup-body"><p>Are you sure you want to update the attendance?</p></div>
            <div className="confirm-popup-footer">
              <button className="confirm-cancel-btn" onClick={handleCancelUpdate}>Cancel</button>
              <button className="confirm-update-btn" onClick={handleConfirmUpdate}>Update</button>
            </div>
          </div>
        </div>
      )}

      <ExportProgressAlert isOpen={exportPopupState === 'progress'} onClose={() => {}} progress={exportProgress} exportType={exportType} color="#d23b42" progressColor="#d23b42" />
      <ExportSuccessAlert isOpen={exportPopupState === 'success'} onClose={() => setExportPopupState('none')} exportType={exportType} color="#d23b42" />
      <ExportFailedAlert isOpen={exportPopupState === 'failed'} onClose={() => setExportPopupState('none')} exportType={exportType} color="#d23b42" />
    </div>
  );
}
