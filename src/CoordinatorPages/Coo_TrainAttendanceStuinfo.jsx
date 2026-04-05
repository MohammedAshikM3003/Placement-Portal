import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import useCoordinatorAuth from "../utils/useCoordinatorAuth";
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from "../components/alerts";
import mongoDBService from "../services/mongoDBService.jsx";
import styles from "./Coo_TrainAttendanceStuinfo.module.css";

const readStoredCoordinatorData = () => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem("coordinatorData");
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Failed to parse coordinatorData:", error);
    return null;
  }
};

const resolveCoordinatorDepartment = (data) => {
  if (!data) return "";
  const deptValue =
    data.department ||
    data.branch ||
    data.dept ||
    data.departmentName ||
    data.coordinatorDepartment ||
    data.assignedDepartment;
  return deptValue ? deptValue.toString().trim().toUpperCase() : "";
};

const normalizeRegNo = (value) => (value || "").toString().trim().toUpperCase();

const formatDateToDisplay = (date) => {
  if (!date || Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const parseDateValue = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildAttendanceStudents = (assignment, statusMap = {}) => {
  if (!assignment || !Array.isArray(assignment.students)) return [];

  return assignment.students.map((student, index) => {
    const regNo = (student?.regNo || student?.registerNo || "").toString().trim();
    const statusValue = statusMap[regNo] || "-";

    return {
      id: (student?.studentId || regNo || `student-${index}`).toString(),
      name: (student?.name || "").toString().trim(),
      regNo,
      dept: (student?.dept || student?.branch || student?.department || "").toString().trim(),
      year: (student?.year || "").toString().trim(),
      section: (student?.section || "").toString().trim(),
      mobile: (student?.mobile || student?.phone || "-").toString().trim(),
      status: statusValue,
    };
  });
};

export default function CooTrainAttendanceStuinfo({ onLogout, onViewChange }) {
  useCoordinatorAuth();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [activeBatch, setActiveBatch] = useState("");
  const [activeBatchDate, setActiveBatchDate] = useState("");
  const [availableBatches, setAvailableBatches] = useState([]);
  const [batchAssignments, setBatchAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [pendingChanges, setPendingChanges] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const [filters, setFilters] = useState({
    search: "",
    dept: "",
    section: "",
    mobile: "",
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  const [exportPopupState, setExportPopupState] = useState("none");
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState("");
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  const getBatchLabel = (batchItem) => {
    const batchNumber = Number.parseInt(batchItem?.batchNumber, 10);
    if (Number.isFinite(batchNumber) && batchNumber > 0) {
      return `Batch - ${batchNumber}`;
    }
    return (batchItem?.batchName || "Batch").toString();
  };

  const activeAssignment = useMemo(() => {
    return (
      batchAssignments.find(
        (assignment) => (assignment?.batchName || "").toString().trim() === activeBatch
      ) || null
    );
  }, [batchAssignments, activeBatch]);

  const activePhaseNumber = useMemo(() => {
    const phases = Array.isArray(activeAssignment?.phases) ? activeAssignment.phases : [];
    const phaseEntry = phases.find((phase) => (phase?.phaseNumber || "").toString().trim());
    const phaseNumber = (phaseEntry?.phaseNumber || "").toString().trim();
    return phaseNumber || "I";
  }, [activeAssignment]);

  const activeBatchDates = useMemo(() => {
    const startRaw = activeAssignment?.startDate || "";
    const endRaw = activeAssignment?.endDate || startRaw;
    if (!startRaw) return [];

    const startDate = parseDateValue(startRaw);
    const endDate = parseDateValue(endRaw) || startDate;
    if (!startDate) return [];

    const dates = [];
    const current = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const finalDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    while (current <= finalDate) {
      dates.push(formatDateToDisplay(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }, [activeAssignment]);

  useEffect(() => {
    if (!activeBatchDates.length) {
      setActiveBatchDate("");
      return;
    }

    const today = formatDateToDisplay(new Date());
    const preferredDate = activeBatchDates.includes(today) ? today : activeBatchDates[0];
    setActiveBatchDate(preferredDate);
  }, [activeBatchDates]);

  useEffect(() => {
    const fetchAssignments = async () => {
      setIsLoading(true);
      try {
        const state = location.state || {};
        const companyName = (state.companyName || state.company || "").toString().trim();
        const courseName = (state.courseName || state.course || "").toString().trim();
        const startDate = (state.startDate || "").toString().trim();

        if (!companyName || !courseName) {
          setBatchAssignments([]);
          setAvailableBatches([]);
          setActiveBatch("");
          setStudents([]);
          return;
        }

        const filters = { companyName, courseName };
        const assignments = await mongoDBService.getScheduledTrainingBatchAssignments(filters);
        let normalized = Array.isArray(assignments) ? assignments : [];

        const coordinatorData = readStoredCoordinatorData();
        const coordinatorDepartment = resolveCoordinatorDepartment(coordinatorData);

        let allowedRegNos = new Set();
        if (coordinatorDepartment) {
          const [branchStudents, deptStudents] = await Promise.all([
            mongoDBService.getStudents({ branch: coordinatorDepartment, limit: 3000, includeImages: "false" }),
            mongoDBService.getStudents({ department: coordinatorDepartment, limit: 3000, includeImages: "false" }),
          ]);

          const studentsA = Array.isArray(branchStudents) ? branchStudents : [];
          const studentsB = Array.isArray(deptStudents) ? deptStudents : [];
          allowedRegNos = new Set([...studentsA, ...studentsB].map((student) => normalizeRegNo(student?.regNo)).filter(Boolean));
        }

        if (startDate) {
          normalized = normalized.filter(
            (assignment) => (assignment?.startDate || "").toString().slice(0, 10) === startDate.slice(0, 10)
          );
        }

        if (coordinatorDepartment) {
          normalized = normalized
            .map((assignment) => {
              const assignmentStudents = Array.isArray(assignment?.students) ? assignment.students : [];
              const filteredStudents = assignmentStudents.filter((student) => {
                const studentDept = (student?.dept || student?.branch || student?.department || "").toString().trim().toUpperCase();
                const studentRegNo = normalizeRegNo(student?.regNo || student?.registerNo || student?.registerNumber);
                return studentDept === coordinatorDepartment || (studentRegNo && allowedRegNos.has(studentRegNo));
              });

              return {
                ...assignment,
                students: filteredStudents,
              };
            })
            .filter((assignment) => Array.isArray(assignment.students) && assignment.students.length > 0);
        }

        setBatchAssignments(normalized);

        const uniqueBatches = Array.from(
          new Map(
            normalized
              .filter((assignment) => (assignment?.batchName || "").toString().trim())
              .map((assignment) => [
                (assignment?.batchName || "").toString().trim(),
                {
                  batchName: (assignment?.batchName || "").toString().trim(),
                  batchNumber: assignment?.batchNumber,
                },
              ])
          ).values()
        );

        setAvailableBatches(uniqueBatches);
        setActiveBatch(uniqueBatches[0]?.batchName || "");
      } catch (error) {
        console.error("Failed to fetch coordinator attendance assignments:", error);
        setBatchAssignments([]);
        setAvailableBatches([]);
        setActiveBatch("");
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [location.state]);

  useEffect(() => {
    if (!activeAssignment) {
      setStudents([]);
      setPendingChanges({});
      return;
    }

    setStudents(buildAttendanceStudents(activeAssignment));
    setPendingChanges({});
    setSelectedStudents([]);
  }, [activeAssignment]);

  useEffect(() => {
    const loadSavedAttendance = async () => {
      if (!activeAssignment || !activeBatchDate) return;

      try {
        const attendances = await mongoDBService.getTrainingAttendance({
          scheduleId: activeAssignment.scheduleId || "",
          companyName: activeAssignment.companyName || "",
          courseName: activeAssignment.courseName || "",
          batchName: activeAssignment.batchName || "",
          phaseNumber: activePhaseNumber,
          attendanceDateKey: activeBatchDate,
        });

        const saved = Array.isArray(attendances) ? attendances[0] : null;
        if (!saved || !Array.isArray(saved.students)) {
          setStudents(buildAttendanceStudents(activeAssignment));
          setPendingChanges({});
          return;
        }

        const statusMap = saved.students.reduce((accumulator, student) => {
          const regNo = (student?.regNo || "").toString().trim();
          if (regNo) accumulator[regNo] = (student?.status || "-").toString();
          return accumulator;
        }, {});

        setStudents(buildAttendanceStudents(activeAssignment, statusMap));
        setPendingChanges({});
      } catch (error) {
        console.error("Failed to load saved training attendance:", error);
      }
    };

    loadSavedAttendance();
  }, [activeAssignment, activeBatchDate, activePhaseNumber]);

  const departmentOptions = useMemo(() => {
    return [...new Set(students.map((student) => (student?.dept || "").toString().trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [students]);

  const sectionOptions = useMemo(() => {
    return [...new Set(students.map((student) => (student?.section || "").toString().trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [students]);

  const filteredStudents = useMemo(() => {
    const searchQ = (filters.search || "").trim().toLowerCase();
    const deptQ = (filters.dept || "").trim().toLowerCase();
    const sectionQ = (filters.section || "").trim().toLowerCase();
    const mobileQ = (filters.mobile || "").trim().toLowerCase();

    return students.filter((student) => {
      const nameValue = (student.name || "").toLowerCase();
      const regNoValue = (student.regNo || "").toLowerCase();
      const mobileValue = (student.mobile || "").toLowerCase();
      const resolvedStatus = (pendingChanges[student.id] || student.status || "").toString().trim().toLowerCase();

      const searchMatch = !searchQ || nameValue.includes(searchQ) || regNoValue.includes(searchQ);
      const deptMatch = !deptQ || (student.dept || "").toLowerCase() === deptQ;
      const sectionMatch = !sectionQ || (student.section || "").toLowerCase() === sectionQ;
      const mobileMatch = !mobileQ || mobileValue.includes(mobileQ);
      const statusMatch = statusFilter === "all" || resolvedStatus === statusFilter;

      return searchMatch && deptMatch && sectionMatch && mobileMatch && statusMatch;
    });
  }, [students, filters, statusFilter, pendingChanges]);

  const attendanceStatusCounts = useMemo(() => {
    return students.reduce(
      (accumulator, student) => {
        const resolvedStatus = (pendingChanges[student.id] || student.status || "").toString().trim().toLowerCase();
        if (resolvedStatus === "present") accumulator.present += 1;
        if (resolvedStatus === "absent") accumulator.absent += 1;
        return accumulator;
      },
      { present: 0, absent: 0 }
    );
  }, [students, pendingChanges]);

  const handleCheckboxChange = (id) => {
    setSelectedStudents((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedStudents(filteredStudents.map((student) => student.id));
      return;
    }
    setSelectedStudents([]);
  };

  const handleStatusUpdate = (id, status) => {
    setPendingChanges((prev) => ({ ...prev, [id]: status }));
  };

  const handleBatchStatusUpdate = (status) => {
    if (!selectedStudents.length) return;
    const updates = {};
    selectedStudents.forEach((id) => {
      updates[id] = status;
    });
    setPendingChanges((prev) => ({ ...prev, ...updates }));
  };

  const handleRemoveStudents = () => {
    if (!selectedStudents.length) return;
    setStudents((prev) => prev.filter((student) => !selectedStudents.includes(student.id)));
    setSelectedStudents([]);
  };

  const handleDiscard = () => {
    setPendingChanges({});
  };

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  const handleUpdateClick = async () => {
    if (!hasPendingChanges || !activeAssignment || !activeBatchDate || isSavingAttendance) return;

    const updatedStudents = students.map((student) => (
      pendingChanges[student.id] ? { ...student, status: pendingChanges[student.id] } : student
    ));

    const totalPresent = updatedStudents.reduce((count, student) => (
      (student.status || "").toString().trim().toLowerCase() === "present" ? count + 1 : count
    ), 0);
    const totalAbsent = updatedStudents.reduce((count, student) => (
      (student.status || "").toString().trim().toLowerCase() === "absent" ? count + 1 : count
    ), 0);
    const percentage = updatedStudents.length ? Number(((totalPresent / updatedStudents.length) * 100).toFixed(2)) : 0;

    const payload = {
      scheduleId: activeAssignment.scheduleId || "",
      companyName: activeAssignment.companyName || "",
      courseName: activeAssignment.courseName || "",
      batchNumber: Number.parseInt(activeAssignment.batchNumber, 10) || 1,
      batchName: activeAssignment.batchName || activeBatch,
      phaseNumber: activePhaseNumber,
      attendanceDateKey: activeBatchDate,
      attendanceDate: activeBatchDate,
      totalStudents: updatedStudents.length,
      totalPresent,
      totalAbsent,
      percentage,
      students: updatedStudents.map((student) => ({
        studentId: student.id,
        name: student.name,
        regNo: student.regNo,
        dept: student.dept,
        year: student.year,
        section: student.section,
        mobile: student.mobile,
        status: student.status,
      })),
    };

    try {
      setIsSavingAttendance(true);
      await mongoDBService.submitTrainingAttendance(payload);
      setStudents(updatedStudents);
      setPendingChanges({});
      setShowSuccessPopup(true);
    } catch (error) {
      console.error("Failed to save training attendance:", error);
      alert(error?.message || "Failed to save training attendance");
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const simulateExport = async (type, exportFn) => {
    setShowExportDropdown(false);
    setExportType(type);
    setExportProgress(0);
    setExportPopupState("progress");

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
        setExportPopupState("success");
      } else {
        setExportPopupState("failed");
      }
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      if (progressTimeout) clearTimeout(progressTimeout);
      setExportPopupState("failed");
    }
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const rows = filteredStudents.map((student, index) => ({
        "S.No": index + 1,
        Name: student.name,
        "Register Number": student.regNo,
        Department: student.dept,
        Year: student.year,
        Section: student.section,
        Mobile: student.mobile,
        Status: pendingChanges[student.id] || student.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
      XLSX.writeFile(workbook, "coordinator_training_attendance.xlsx");
      return true;
    } catch (error) {
      console.error("Excel export error:", error);
      return false;
    }
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    const tableHTML = document.querySelector(`.${styles["attendance-table"]}`)?.outerHTML || "";

    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Report</title>
          <style>
            table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; }
            th, td { padding: 10px; border: 1px solid #ddd; text-align: center; }
            th { background-color: #f5f5f5; font-weight: 600; }
            h2 { text-align: center; color: #333; font-family: Arial, sans-serif; margin-bottom: 20px; }
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
    return true;
  };

  const handleExportExcel = () => simulateExport("Excel", exportToExcel);
  const handleExportPDF = () => simulateExport("PDF", exportToPDF);

  const tableTitle = activeBatch || "ATTENDANCE DETAILS";

  return (
    <div className={`${styles["coordinator-main-wrapper"]} ${styles["train-attendance-page"]}`}>
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={styles["coordinator-main-layout"]}>
        <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView="training" onViewChange={onViewChange} />

        <div className={styles["coordinator-content-area"]}>
          <div className={styles["train-attendance-container"]}>
            <div className={styles["top-row"]}>
              <div className={styles["filter-card"]}>
                <div className={styles["ta-filter-tabs-container"]}>
                  <button className={styles["ta-filter-tab-button"]} type="button">Phase - {activePhaseNumber}</button>
                </div>

                <div className={styles["ta-filter-fields-container"]}>
                  <div className={styles["ta-filter-fields-row"]}>
                    <div className={styles["ta-filter-input-wrapper"]}>
                      <input
                        id="ta-filter-search"
                        className={styles["ta-filter-input"]}
                        type="text"
                        placeholder="Enter Name / Registration No."
                        value={filters.search}
                        onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                      />
                      <label className={styles["ta-filter-label"]} htmlFor="ta-filter-search">Enter Name / Registration No.</label>
                    </div>

                    <div className={styles["ta-filter-input-wrapper"]}>
                      <select
                        id="ta-filter-dept"
                        className={styles["ta-filter-input"]}
                        value={filters.dept}
                        onChange={(e) => setFilters((prev) => ({ ...prev, dept: e.target.value }))}
                      >
                        <option value="">Select Department</option>
                        {departmentOptions.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                      <label className={styles["ta-filter-label"]} htmlFor="ta-filter-dept">Department</label>
                    </div>
                  </div>

                  <div className={styles["ta-filter-fields-row"]}>
                    <div className={styles["ta-filter-input-wrapper"]}>
                      <select
                        id="ta-filter-section"
                        className={styles["ta-filter-input"]}
                        value={filters.section}
                        onChange={(e) => setFilters((prev) => ({ ...prev, section: e.target.value }))}
                      >
                        <option value="">Select Section</option>
                        {sectionOptions.map((section) => (
                          <option key={section} value={section}>{section}</option>
                        ))}
                      </select>
                      <label className={styles["ta-filter-label"]} htmlFor="ta-filter-section">Section</label>
                    </div>

                    <div className={styles["ta-filter-input-wrapper"]}>
                      <input
                        id="ta-filter-mobile"
                        className={styles["ta-filter-input"]}
                        type="text"
                        placeholder="Enter Mobile Number"
                        value={filters.mobile}
                        onChange={(e) => setFilters((prev) => ({ ...prev, mobile: e.target.value }))}
                      />
                      <label className={styles["ta-filter-label"]} htmlFor="ta-filter-mobile">Enter Mobile Number</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles["buttons-section"]}>
                <div className={styles["ta-buttons-white-card"]}>
                  <div className={styles["batch-buttons-row"]}>
                    {availableBatches.length > 0 ? (
                      availableBatches.map((batchItem) => (
                        <button
                          key={batchItem.batchName}
                          className={`${styles["batch-btn"]} ${activeBatch === batchItem.batchName ? styles["active"] : ""}`}
                          onClick={() => setActiveBatch(batchItem.batchName)}
                        >
                          {getBatchLabel(batchItem)}
                        </button>
                      ))
                    ) : (
                      <button className={styles["batch-btn"]} disabled>No Batches</button>
                    )}
                  </div>

                  <div className={styles["ta-buttons-divider"]} />

                  <div className={styles["date-buttons-row"]}>
                    {activeBatchDates.length > 0 ? (
                      activeBatchDates.map((dateValue) => (
                        <button
                          key={dateValue}
                          className={`${styles["date-box"]} ${activeBatchDate === dateValue ? styles["date-box-active"] : ""}`}
                          onClick={() => setActiveBatchDate(dateValue)}
                        >
                          {dateValue}
                        </button>
                      ))
                    ) : (
                      <span className={styles["date-placeholder"]}>No Dates</span>
                    )}
                  </div>
                </div>

                <div className={styles["action-buttons-row"]}>
                  <button
                    className={`${styles["action-btn"]} ${styles["present-btn"]}`}
                    onClick={() => {
                      setStatusFilter("present");
                      handleBatchStatusUpdate("Present");
                    }}
                  >
                    Present : {attendanceStatusCounts.present || "-"}
                  </button>
                  <button
                    className={`${styles["action-btn"]} ${styles["absent-btn"]}`}
                    onClick={() => {
                      setStatusFilter("absent");
                      handleBatchStatusUpdate("Absent");
                    }}
                  >
                    Absent : {attendanceStatusCounts.absent || "-"}
                  </button>
                  <button
                    className={`${styles["action-btn"]} ${styles["remove-btn"]}`}
                    onClick={handleRemoveStudents}
                    disabled={selectedStudents.length === 0}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>

            <div className={styles["attendance-table-section"]}>
              <div className={styles["table-header"]}>
                <h2 className={styles["table-title"]}>{tableTitle}</h2>
                <div className={styles["print-btn-container"]}>
                  <button className={styles["print-btn"]} onClick={() => setShowExportDropdown((prev) => !prev)}>Print</button>
                  {showExportDropdown && (
                    <div className={styles["export-dropdown-menu"]}>
                      <div className={styles["export-dropdown-item"]} onClick={handleExportExcel}>Export to Excel</div>
                      <div className={styles["export-dropdown-item"]} onClick={handleExportPDF}>Save as PDF</div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles["table-wrapper"]}>
                <table className={styles["attendance-table"]}>
                  <thead>
                    <tr>
                      <th className={styles["col-select"]}>
                        <input
                          type="checkbox"
                          checked={filteredStudents.length > 0 && filteredStudents.every((student) => selectedStudents.includes(student.id))}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th className={styles["col-sno"]}>S.No</th>
                      <th className={styles["col-name"]}>Name</th>
                      <th className={styles["col-reg"]}>Register Number</th>
                      <th className={styles["col-dept"]}>Department</th>
                      <th className={styles["col-year"]}>Year</th>
                      <th className={styles["col-section"]}>Section</th>
                      <th className={styles["col-phone"]}>Mobile</th>
                      <th className={styles["col-view"]}>View</th>
                      <th className={styles["col-status"]}>Status</th>
                      <th className={styles["col-action"]}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={11} style={{ textAlign: "center", padding: "18px" }}>Loading...</td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={11} style={{ textAlign: "center", padding: "18px" }}>No students found.</td>
                      </tr>
                    ) : (
                      filteredStudents.map((student, index) => {
                        const resolvedStatus = pendingChanges[student.id] || student.status || "-";
                        const normalizedStatus = resolvedStatus.toString().trim().toLowerCase();
                        const statusClass = normalizedStatus === "present" ? "present" : normalizedStatus === "absent" ? "absent" : "default";

                        return (
                          <tr key={student.id} className={selectedStudents.includes(student.id) ? styles["selected-row"] : ""}>
                            <td className={styles["col-select"]}>
                              <input
                                type="checkbox"
                                checked={selectedStudents.includes(student.id)}
                                onChange={() => handleCheckboxChange(student.id)}
                              />
                            </td>
                            <td className={styles["col-sno"]}>{index + 1}</td>
                            <td className={styles["col-name"]}>{student.name}</td>
                            <td className={styles["col-reg"]}>{student.regNo}</td>
                            <td className={styles["col-dept"]}>{student.dept}</td>
                            <td className={styles["col-year"]}>{student.year}</td>
                            <td className={styles["col-section"]}>{student.section}</td>
                            <td className={styles["col-phone"]}>{student.mobile || "-"}</td>
                            <td className={styles["col-view"]}>
                              <span
                                className={styles["view-icon"]}
                                onClick={() => onViewChange && onViewChange("coo-placed-stu-view-page")}
                                style={{ cursor: "pointer" }}
                              />
                            </td>
                            <td className={styles["col-status"]}>
                              <span className={`${styles["status-text"]} ${styles[statusClass]}`}>{resolvedStatus}</span>
                            </td>
                            <td className={styles["col-action"]}>
                              <div className={styles["action-btns"]}>
                                <button className={styles["present-small-btn"]} onClick={() => handleStatusUpdate(student.id, "Present")}>Present</button>
                                <button className={styles["absent-small-btn"]} onClick={() => handleStatusUpdate(student.id, "Absent")}>Absent</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className={styles["bottom-actions"]}>
                <button className={styles["discard-btn"]} onClick={handleDiscard}>Discard</button>
                <button
                  className={styles["update-btn"]}
                  onClick={handleUpdateClick}
                  disabled={!hasPendingChanges || isSavingAttendance || !activeBatchDate}
                >
                  {isSavingAttendance ? "Saving..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSuccessPopup && (
        <div className={styles["Edit-popup-overlay"]}>
          <div className={styles["Edit-popup-container"]}>
            <div className={styles["Edit-popup-header"]}>Update!</div>
            <div className={styles["Edit-popup-body"]}>
              <svg className={styles["Edit-success-icon"]} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className={styles["Edit-success-icon--circle"]} cx="26" cy="26" r="25" fill="none" />
                <path className={styles["Edit-success-icon--check"]} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
              </svg>
              <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>Attendance Updated ✓</h2>
              <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>Changes are Updated</p>
            </div>
            <div className={styles["Edit-popup-footer"]}>
              <button onClick={() => setShowSuccessPopup(false)} className={styles["Edit-popup-close-btn"]}>Close</button>
            </div>
          </div>
        </div>
      )}

      <ExportProgressAlert
        isOpen={exportPopupState === "progress"}
        onClose={() => {}}
        progress={exportProgress}
        exportType={exportType}
        color="#d23b42"
        progressColor="#d23b42"
      />
      <ExportSuccessAlert
        isOpen={exportPopupState === "success"}
        onClose={() => setExportPopupState("none")}
        exportType={exportType}
        color="#d23b42"
      />
      <ExportFailedAlert
        isOpen={exportPopupState === "failed"}
        onClose={() => setExportPopupState("none")}
        exportType={exportType}
        color="#d23b42"
      />
    </div>
  );
}
