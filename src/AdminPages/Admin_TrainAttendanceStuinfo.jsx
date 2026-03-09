import React, { useMemo, useState } from "react";
import AdNavbar from "../components/Navbar/Adnavbar.js";
import AdSidebar from "../components/Sidebar/Adsidebar.js";
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts/index.js';
// ...existing code...
import styles from "./Admin_TrainAttendanceStuinfo.module.css";

const studentData = [
  { id: 1, name: "Maneesh Adhithya", regNo: "73152313038", dept: "CSE", year: "III", section: "A", phone: "9898986547", date: "25-02-2025", status: "-" },
  { id: 2, name: "Chandan", regNo: "73152313049", dept: "CSE", year: "III", section: "B", phone: "9788657300", date: "25-02-2025", status: "-" },
  { id: 3, name: "Rovinder Singh", regNo: "73152313052", dept: "CSE", year: "III", section: "B", phone: "7845014685", date: "25-02-2025", status: "-" },
  { id: 4, name: "Divam Balwal", regNo: "73152313061", dept: "CSE", year: "III", section: "B", phone: "6369123456", date: "25-02-2025", status: "-" },
  { id: 5, name: "Mohammed Ashik", regNo: "73152313075", dept: "CSE", year: "III", section: "A", phone: "9380171449", date: "25-02-2025", status: "-" },
  { id: 6, name: "Gowrinath", regNo: "73152313088", dept: "CSE", year: "III", section: "B", phone: "7812845645", date: "25-02-2025", status: "-" },
];

export default function AdminTrainAttendanceStuinfo({ onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [activeTraining, setActiveTraining] = useState("R-Sequence");
  const [activeBatch, setActiveBatch] = useState("Batch-1");
  const [students, setStudents] = useState(studentData);
  const [pendingChanges, setPendingChanges] = useState({});

  const [filters, setFilters] = useState({
    dept: "",
    name: "",
    regNo: "",
    section: "",
    date: "",
  });
  const [statusFilter, setStatusFilter] = useState("all"); // all, present, absent
  const [exportPopupState, setExportPopupState] = useState('none'); // 'none', 'progress', 'success', 'failed'
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('');
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const filteredStudents = useMemo(() => {
    const deptQ = (filters.dept || "").trim().toLowerCase();
    const nameQ = (filters.name || "").trim().toLowerCase();
    const regNoQ = (filters.regNo || "").trim().toLowerCase();
    const sectionQ = (filters.section || "").trim().toLowerCase();
    const dateQ = (filters.date || "").trim().toLowerCase();

    return students.filter((s) => {
      // Department filter
      const deptMatch = !deptQ || (s.dept || "").toLowerCase() === deptQ;
      // Name filter
      const nameMatch = !nameQ || (s.name || "").toLowerCase().includes(nameQ);
      // Register No filter
      const regNoMatch = !regNoQ || (s.regNo || "").toLowerCase().includes(regNoQ);
      // Section filter
      const sectionMatch = !sectionQ || (s.section || "").toLowerCase() === sectionQ;
      // Date filter
      const dateMatch = !dateQ || (s.date && s.date.includes(dateQ));
      // Status filter
      const statusMatch = statusFilter === "all" || s.status.toLowerCase() === statusFilter;
      return deptMatch && nameMatch && regNoMatch && sectionMatch && dateMatch && statusMatch;
    });
  }, [students, filters.dept, filters.name, filters.regNo, filters.section, filters.date, statusFilter]);

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

  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  // Filter button logic
  const handleFilterClick = () => {
    // No-op: filteredStudents is already reactive to filters
    // Optionally, you can add feedback or animation here
  };

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
        "Date": student.date,
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
        { wch: 12 },  // Date
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
    <div className={styles["ad-train-att-main-wrapper"] + " " + styles["ad-train-att-page"]}>
      <AdNavbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={styles["ad-train-att-main-layout"]}>
        <AdSidebar
          isOpen={isSidebarOpen}
          onLogout={onLogout}
        />
        <div className={styles["ad-train-att-content-area"]}>
          <div className={styles["ad-train-att-container"]}>
            {/* Top Row - Two Columns */}
            <div className={styles["ad-train-att-top-row"]}>
              {/* Left: Filter Section */}
              <div className={styles["ad-train-att-filter-card"]}>
                <div className={styles["ad-train-att-filter-tabs-container"]}>
                  <button className={styles["ad-train-att-filter-tab-button"]} type="button">
                    Phase - I
                  </button>
                </div>

                <div className={styles["ad-train-att-filter-fields-container"]}>
                  {/* First Row: Department and Name */}
                  <div className={styles["ad-train-att-filter-fields-row"]}>
                    {/* Department Dropdown */}
                    <div className={styles["ad-train-att-filter-input-wrapper"]}>
                      <select
                        id="ad-train-att-filter-dept"
                        className={styles["ad-train-att-filter-input"]}
                        required
                        value={filters.dept || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, dept: e.target.value }))
                        }
                      >
                        <option value="" disabled>Select Department</option>
                        <option value="CSE">CSE</option>
                        <option value="ECE">ECE</option>
                        <option value="EEE">EEE</option>
                        <option value="MECH">MECH</option>
                        <option value="CIVIL">CIVIL</option>
                        {/* Add more departments as needed */}
                      </select>
                      
                    </div>

                    {/* Name Input with green floating label and border */}
                    <div className={styles["ad-train-att-filter-input-wrapper"]}>
                      <input
                        id="ad-train-att-filter-name"
                        className={styles["ad-train-att-filter-input"] + " " + styles["ad-train-att-filter-input-green"]}
                        type="text"
                        required
                        value={filters.name || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, name: e.target.value }))
                        }
                      />
                      <label className={styles["ad-train-att-filter-label"] + " " + styles["ad-train-att-filter-label-green"]} htmlFor="ad-train-att-filter-name">
                        Name
                      </label>
                    </div>
                  </div>

                  {/* Second Row: Register No and Section Dropdown */}
                  <div className={styles["ad-train-att-filter-fields-row"]}>
                    {/* Register No Input */}
                    <div className={styles["ad-train-att-filter-input-wrapper"]}>
                      <input
                        id="ad-train-att-filter-regno"
                        className={styles["ad-train-att-filter-input"]}
                        type="text"
                        required
                        value={filters.regNo || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, regNo: e.target.value }))
                        }
                      />
                      <label className={styles["ad-train-att-filter-label"]} htmlFor="ad-train-att-filter-regno">
                        Register No
                      </label>
                    </div>

                    {/* Section Dropdown */}
                    <div className={styles["ad-train-att-filter-input-wrapper"]}>
                      <select
                        id="ad-train-att-filter-section"
                        className={styles["ad-train-att-filter-input"]}
                        required
                        value={filters.section || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, section: e.target.value }))
                        }
                      >
                        <option value="" disabled>Select Section</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                     
                    </div>
                  </div>

                  {/* Third Row: Date Picker and Filter Button */}
                  <div className={styles["ad-train-att-filter-fields-row"]}>
                    {/* Date Picker */}
                    <div className={styles["ad-train-att-filter-input-wrapper"]}>
                      <input
                        id="ad-train-att-filter-date"
                        className={styles["ad-train-att-filter-input"]}
                        type="date"
                        value={filters.date || ""}
                        onChange={(e) =>
                          setFilters((prev) => ({ ...prev, date: e.target.value }))
                        }
                      />
                      
                    </div>
                    {/* Filter Button */}
                    <div className={styles["ad-train-att-filter-input-wrapper"]}>
                      <button
                        type="button"
                        className={styles["ad-train-att-filter-btn-green"]}
                        onClick={handleFilterClick}
                      >
                        Filter
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Buttons Section (no card) */}
              <div className={styles["ad-train-att-buttons-section"]}>
                <div className={styles["ad-train-att-buttons-white-card"]}>
                  {/* Training Sequence Buttons */}
                  <div className={styles["ad-train-att-training-buttons-row"]}>
                    <button
                      className={`${styles["ad-train-att-training-seq-btn"]} ${activeTraining === "R-Sequence" ? styles.active : ""}`}
                      onClick={() => setActiveTraining("R-Sequence")}
                    >
                      R - Sequence
                    </button>
                    <button
                      className={`${styles["ad-train-att-training-seq-btn"]} ${activeTraining === "X-Plore" ? styles.active : ""}`}
                      onClick={() => setActiveTraining("X-Plore")}
                    >
                      X - Plore
                    </button>
                    <button
                      className={`${styles["ad-train-att-training-seq-btn"]} ${activeTraining === "Z-Sequence" ? styles.active : ""}`}
                      onClick={() => setActiveTraining("Z-Sequence")}
                    >
                      Z - Sequence
                    </button>
                    <button
                      className={`${styles["ad-train-att-training-seq-btn"]} ${activeTraining === "A-Sequence" ? styles.active : ""}`}
                      onClick={() => setActiveTraining("A-Sequence")}
                    >
                      A - Sequence
                    </button>
                    <button
                      className={`${styles["ad-train-att-training-seq-btn"]} ${activeTraining === "B-Sequence" ? styles.active : ""}`}
                      onClick={() => setActiveTraining("B-Sequence")}
                    >
                      B - Sequence
                    </button>
                  </div>

                  <div className={styles["ad-train-att-buttons-divider"]} />

                  {/* Batch Buttons */}
                  <div className={styles["ad-train-att-batch-buttons-row"]}>
                    <button
                      className={`${styles["ad-train-att-batch-btn"]} ${activeBatch === "Batch-1" ? styles.active : ""}`}
                      onClick={() => setActiveBatch("Batch-1")}
                    >
                      Batch - 1
                    </button>
                    <button
                      className={`${styles["ad-train-att-batch-btn"]} ${activeBatch === "Batch-2" ? styles.active : ""}`}
                      onClick={() => setActiveBatch("Batch-2")}
                    >
                      Batch - 2
                    </button>
                    <button
                      className={`${styles["ad-train-att-batch-btn"]} ${activeBatch === "Batch-3" ? styles.active : ""}`}
                      onClick={() => setActiveBatch("Batch-3")}
                    >
                      Batch - 3
                    </button>
                    <button
                      className={`${styles["ad-train-att-batch-btn"]} ${activeBatch === "Batch-4" ? styles.active : ""}`}
                      onClick={() => setActiveBatch("Batch-4")}
                    >
                      Batch - 4
                    </button>
                    <button
                      className={`${styles["ad-train-att-batch-btn"]} ${activeBatch === "Batch-5" ? styles.active : ""}`}
                      onClick={() => setActiveBatch("Batch-5")}
                    >
                      Batch - 5
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className={styles["ad-train-att-action-buttons-row"]}>
                  <button 
                    className={`${styles["ad-train-att-action-btn"]} ${styles["ad-train-att-present-btn"]} ${statusFilter === 'present' ? styles.active : ''}`} 
                    onClick={() => handleBatchStatusUpdate('Present')}
                  >
                    Present
                  </button>
                  <button 
                    className={`${styles["ad-train-att-action-btn"]} ${styles["ad-train-att-absent-btn"]} ${statusFilter === 'absent' ? styles.active : ''}`} 
                    onClick={() => handleBatchStatusUpdate('Absent')}
                  >
                    Absent
                  </button>
                  <button 
                    className={`${styles["ad-train-att-action-btn"]} ${styles["ad-train-att-add-btn"]} ${statusFilter === 'add' ? styles.active : ''}`} 
                    onClick={() => handleBatchStatusUpdate('Add')}
                  >
                    Add
                  </button>
                  <button 
                    className={`${styles["ad-train-att-action-btn"]} ${styles["ad-train-att-remove-btn"]}`} 
                    onClick={handleRemoveStudents}
                    disabled={selectedStudents.length === 0}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Row: Attendance Table Section */}
            <div className={styles["ad-train-att-table-section"]}>
              <div className={styles["ad-train-att-table-header"]}>
                <h2 className={styles["ad-train-att-table-title"]}>ATTENDANCE DETAILS</h2>
                <div className={styles["ad-train-att-print-btn-container"]}>
                  <button className={styles["ad-train-att-print-btn"]} onClick={() => setShowExportDropdown(!showExportDropdown)}>Print</button>
                  {showExportDropdown && (
                    <div className={styles["ad-train-att-export-dropdown-menu"]}>
                      <div className={styles["ad-train-att-export-dropdown-item"]} onClick={handleExportExcel}>Export to Excel</div>
                      <div className={styles["ad-train-att-export-dropdown-item"]} onClick={handleExportPDF}>Save as PDF</div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles["ad-train-att-table-wrapper"]}>
                <table className={`${styles["ad-train-att-table"]} attendance-table`}>
                  <thead>
                    <tr>
                      <th className={styles["ad-train-att-col-select"]}>Select</th>
                      <th className={styles["ad-train-att-col-sno"]}>S.No</th>
                      <th className={styles["ad-train-att-col-name"]}>Name</th>
                      <th className={styles["ad-train-att-col-reg"]}>Register Number</th>
                      <th className={styles["ad-train-att-col-dept"]}>Department</th>
                      <th className={styles["ad-train-att-col-year"]}>Year</th>
                      <th className={styles["ad-train-att-col-section"]}>Section</th>
                      <th className={styles["ad-train-att-col-phone"]}>Phone No</th>
                      <th className={styles["ad-train-att-col-date"]}>Date</th>
                      <th className={styles["ad-train-att-col-view"]}>View</th>
                      <th className={styles["ad-train-att-col-status"]}>Status</th>
                      <th className={styles["ad-train-att-col-action"]}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, index) => {
                      const displayStatus = pendingChanges[student.id] || student.status;
                      return (
                        <tr key={student.id} className={selectedStudents.includes(student.id) ? styles['selected-row'] : ''}>
                          <td className={styles["ad-train-att-col-select"]}>
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => handleCheckboxChange(student.id)}
                            />
                          </td>
                          <td className={styles["ad-train-att-col-sno"]}>{index + 1}</td>
                          <td className={styles["ad-train-att-col-name"]}>{student.name}</td>
                          <td className={styles["ad-train-att-col-reg"]}>{student.regNo}</td>
                          <td className={styles["ad-train-att-col-dept"]}>{student.dept}</td>
                          <td className={styles["ad-train-att-col-year"]}>{student.year}</td>
                          <td className={styles["ad-train-att-col-section"]}>{student.section}</td>
                          <td className={styles["ad-train-att-col-phone"]}>{student.phone}</td>
                          <td className={styles["ad-train-att-col-date"]}>{student.date || '-'}</td>
                          <td className={styles["ad-train-att-col-view"]}>
                            <span className={styles["ad-train-att-view-icon"]}></span>
                          </td>
                          <td className={styles["ad-train-att-col-status"]}>
                            <span className={`${styles["ad-train-att-status-text"]} ${styles[`ad-train-att-${displayStatus.toLowerCase()}`]}`}>
                              {displayStatus}
                            </span>
                          </td>
                          <td className={styles["ad-train-att-col-action"]}>
                            <div className={styles["ad-train-att-action-btns"]}>
                              <button className={styles["ad-train-att-present-small-btn"]} onClick={() => handleStatusUpdate(student.id, "Present")}>Present</button>
                              <button className={styles["ad-train-att-absent-small-btn"]} onClick={() => handleStatusUpdate(student.id, "Absent")}>Absent</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer Actions inside Table */}
              <div className={styles["ad-train-att-bottom-actions"]}>
                <button 
                  className={styles["ad-train-att-discard-btn"]} 
                  onClick={handleDiscard}
                >
                  Discard
                </button>
                <button 
                  className={styles["ad-train-att-update-btn"]} 
                  onClick={handleUpdateClick}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Popup */}
      {showConfirmPopup && (
        <div className={styles["ad-train-att-confirm-popup-overlay"]}>
          <div className={styles["ad-train-att-confirm-popup-container"]}>
            <div className={styles["ad-train-att-confirm-popup-header"]}>Confirm Update</div>
            <div className={styles["ad-train-att-confirm-popup-body"]}>
              <p>Are you sure you want to update the attendance?</p>
            </div>
            <div className={styles["ad-train-att-confirm-popup-footer"]}>
              <button className={styles["ad-train-att-confirm-cancel-btn"]} onClick={handleCancelUpdate}>Cancel</button>
              <button className={styles["ad-train-att-confirm-update-btn"]} onClick={handleConfirmUpdate}>Update</button>
            </div>
          </div>
        </div>
      )}

      {/* Export Popup using Eligible Students components */}
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
