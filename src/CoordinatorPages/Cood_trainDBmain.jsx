import React, { useMemo, useState } from "react";
import useCoordinatorAuth from "../utils/useCoordinatorAuth";
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import { useNavigate } from "react-router-dom";
import mongoDBService from "../services/mongoDBService.jsx";
import styles from "./Cood_trainDBmain.module.css";

import CalendarIcon from "../assets/cood_trainingDBCalendaricon.svg";

const cx = (...classNames) => classNames.filter(Boolean).join(" ");

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

export default function CoodTrainDBMain({ onLogout, onViewChange }) {
  useCoordinatorAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [appliedCompany, setAppliedCompany] = useState("");
  const [isAttendancePopupOpen, setIsAttendancePopupOpen] = useState(false);
  const [attendanceCompany, setAttendanceCompany] = useState("");
  const [attendanceCourse, setAttendanceCourse] = useState("");
  const [attendanceStartDate, setAttendanceStartDate] = useState("");
  const [popupAssignments, setPopupAssignments] = useState([]);
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupError, setPopupError] = useState("");

  const companies = [
    { id: "r-sequence", name: "R - Sequence", letter: "R", color: "#58c47c" },
    { id: "x-plore", name: "X - Plore", letter: "X", color: "#5cb6c2" },
    { id: "z-sequence", name: "Z - Sequence", letter: "Z", color: "#6d86c8" },
    { id: "a-sequence", name: "A - Sequence", letter: "A", color: "#ff9800" },
    { id: "b-sequence", name: "B - Sequence", letter: "B", color: "#9c27b0" },
  ];

  const batches = [
    { id: "batch-1", name: "Batch 1" },
    { id: "batch-2", name: "Batch 2" },
    { id: "batch-3", name: "Batch 3" },
    { id: "batch-4", name: "Batch 4" },
    { id: "batch-5", name: "Batch 5" },
  ];

  const loadPopupAssignments = async () => {
    setPopupLoading(true);
    setPopupError("");

    try {
      const coordinatorData = readStoredCoordinatorData();
      const coordinatorBranch = resolveCoordinatorDepartment(coordinatorData);

      if (!coordinatorBranch) {
        setPopupAssignments([]);
        setPopupError("Coordinator branch not found.");
        return;
      }

      const [assignments, branchStudentsByBranch, branchStudentsByDept] = await Promise.all([
        mongoDBService.getScheduledTrainingBatchAssignments(),
        mongoDBService.getStudents({ branch: coordinatorBranch, limit: 2000, includeImages: "false" }),
        mongoDBService.getStudents({ department: coordinatorBranch, limit: 2000, includeImages: "false" }),
      ]);

      const normalizedAssignments = Array.isArray(assignments) ? assignments : [];
      const studentsA = Array.isArray(branchStudentsByBranch) ? branchStudentsByBranch : [];
      const studentsB = Array.isArray(branchStudentsByDept) ? branchStudentsByDept : [];
      const branchRegNos = new Set([...studentsA, ...studentsB].map((s) => normalizeRegNo(s?.regNo)).filter(Boolean));

      const filtered = normalizedAssignments.filter((assignment) => {
        const students = Array.isArray(assignment?.students) ? assignment.students : [];
        return students.some((student) => {
          const studentReg = normalizeRegNo(student?.regNo || student?.registerNo || student?.registerNumber);
          if (studentReg && branchRegNos.has(studentReg)) return true;

          const studentBranch = (student?.branch || student?.department || "").toString().trim().toUpperCase();
          return studentBranch === coordinatorBranch;
        });
      });

      const deduped = [];
      const seen = new Set();
      filtered.forEach((assignment) => {
        const key = [
          (assignment?.companyName || "").toString().trim().toLowerCase(),
          (assignment?.courseName || "").toString().trim().toLowerCase(),
          (assignment?.startDate || "").toString().trim(),
          (assignment?.endDate || "").toString().trim(),
        ].join("|");

        if (!key || seen.has(key)) return;
        seen.add(key);
        deduped.push(assignment);
      });

      setPopupAssignments(deduped);
      if (deduped.length === 0) {
        setPopupError(`No training assignments found for ${coordinatorBranch} students.`);
      }
    } catch (error) {
      console.error("Failed to load training assignments for popup:", error);
      setPopupAssignments([]);
      setPopupError("Failed to load training options.");
    } finally {
      setPopupLoading(false);
    }
  };

  const handleAttendanceCardClick = async () => {
    if (popupLoading) return;

    setAttendanceCompany("");
    setAttendanceCourse("");
    setAttendanceStartDate("");
    setIsAttendancePopupOpen(false);
    await loadPopupAssignments();
    setIsAttendancePopupOpen(true);
  };

  const formatDateForDisplay = (rawDate) => {
    if (!rawDate) return "-";
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return "-";
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const year = parsed.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const todayDate = useMemo(() => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    return `${day}-${month}-${year}`;
  }, []);

  const attendanceCompanyOptions = useMemo(() => {
    return [...new Set(
      popupAssignments
        .map((assignment) => (assignment?.companyName || "").toString().trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
  }, [popupAssignments]);

  const attendanceCourseOptions = useMemo(() => {
    if (!attendanceCompany) return [];
    return [...new Set(
      popupAssignments
        .filter((assignment) => (assignment?.companyName || "").toString().trim() === attendanceCompany)
        .map((assignment) => (assignment?.courseName || "").toString().trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
  }, [popupAssignments, attendanceCompany]);

  const attendanceStartDateOptions = useMemo(() => {
    if (!attendanceCompany || !attendanceCourse) return [];
    return [...new Set(
      popupAssignments
        .filter((assignment) =>
          (assignment?.companyName || "").toString().trim() === attendanceCompany &&
          (assignment?.courseName || "").toString().trim() === attendanceCourse
        )
        .map((assignment) => (assignment?.startDate || "").toString().trim())
        .filter(Boolean)
    )].sort((a, b) => new Date(a) - new Date(b));
  }, [popupAssignments, attendanceCompany, attendanceCourse]);

  const selectedAttendanceSession = useMemo(() => {
    if (!attendanceCompany || !attendanceCourse || !attendanceStartDate) return null;
    return (
      popupAssignments.find(
        (assignment) =>
          (assignment?.companyName || "").toString().trim() === attendanceCompany &&
          (assignment?.courseName || "").toString().trim() === attendanceCourse &&
          (assignment?.startDate || "").toString().trim() === attendanceStartDate
      ) || null
    );
  }, [popupAssignments, attendanceCompany, attendanceCourse, attendanceStartDate]);

  const trainingDayLabel = useMemo(() => {
    if (!attendanceStartDate) return "Training Day -";
    const start = new Date(attendanceStartDate);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const dayDiff = Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const clampedDay = Math.max(1, dayDiff);
    return `Training Day ${clampedDay}`;
  }, [attendanceStartDate]);

  const handleAttendanceCompanyChange = (value) => {
    setAttendanceCompany(value);
    setAttendanceCourse("");
    setAttendanceStartDate("");
  };

  const handleAttendanceCourseChange = (value) => {
    setAttendanceCourse(value);
    setAttendanceStartDate("");
  };

  const handleAttendanceSearch = () => {
    if (!attendanceCompany || !attendanceCourse || !attendanceStartDate) return;

    navigate("/coo-train-attendance-stuinfo", {
      state: {
        company: attendanceCompany,
        course: attendanceCourse,
        companyName: attendanceCompany,
        courseName: attendanceCourse,
        startDate: attendanceStartDate,
        endDate: selectedAttendanceSession?.endDate || "",
        todayDate,
        trainingDayLabel,
      },
    });
    setIsAttendancePopupOpen(false);
  };

  const getSelectedCompany = () => companies.find(c => c.id === selectedCompany);
  const getSelectedBatch = () => batches.find(b => b.id === selectedBatch);
  const getAppliedCompany = () => companies.find(c => c.id === appliedCompany);

  const handleApplyFilters = () => {
    setAppliedCompany(selectedCompany);
  };

  return (
    <div className={styles['coordinator-main-wrapper']}>
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={styles['coordinator-main-layout']}>
        <Sidebar
          isOpen={isSidebarOpen}
          onLogout={onLogout}
          currentView="training"
          onViewChange={onViewChange}
        />
        <div className={styles['coordinator-content-area']}>
          <div className={styles['coo-training-container']}>
            <div className={styles['coo-training-dashboard-area']}>
              <div className={styles.rows}>
            <div className={styles.row1}>
              <div
                className={cx(styles.card, styles.attendanceInfoCard, styles.clickableCard)}
                onClick={handleAttendanceCardClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleAttendanceCardClick();
                  }
                }}
              >
                <img
                  className={styles.calendarIcon}
                  src={CalendarIcon}
                  alt="Calendar"
                />
                <div className={styles.attendanceInfoTitle}>Attendance</div>
                <div className={styles.attendanceInfoTitle}>&amp;</div>
                <div className={styles.attendanceInfoTitle}>Student Info</div>
                <div className={styles.attendanceInfoHint}>
                  {popupLoading ? "Loading..." : "Click to Take Attendance and to view student info."}
                </div>
              </div>

              <div className={cx(styles.card, styles.trainingsCard)}>
                <div className={styles.trainingsHeader}>Trainings</div>
                <div className={styles.trainingsInner}>
                  <div className={cx(styles.trainingTile, styles.trainingTileGreen)}>
                    <div className={styles.trainingIconCircle}>R</div>
                    <div className={styles.trainingTileText}>
                      <div className={styles.trainingTitle}>R - Sequence</div>
                      <div className={styles.trainingMeta}>Trainers : 8</div>
                      <div className={styles.trainingMeta}>Duration : 21 Days</div>
                    </div>
                  </div>

                  <div className={cx(styles.trainingTile, styles.trainingTileTeal)}>
                    <div className={styles.trainingIconCircle}>X</div>
                    <div className={styles.trainingTileText}>
                      <div className={styles.trainingTitle}>X - Plore</div>
                      <div className={styles.trainingMeta}>Trainers : 3</div>
                      <div className={styles.trainingMeta}>Duration : 21 Days</div>
                    </div>
                  </div>

                  <div className={cx(styles.trainingTile, styles.trainingTileBlue)}>
                    <div className={styles.trainingIconCircle}>Z</div>
                    <div className={styles.trainingTileText}>
                      <div className={styles.trainingTitle}>Z - Sequence</div>
                      <div className={styles.trainingMeta}>Trainers : 1</div>
                      <div className={styles.trainingMeta}>Duration : 21 Days</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.row2}>
              <div className={cx(styles.statCard, styles.statTotal)}>
                <div className={styles.statLabel}>Total Students</div>
                <div className={styles.statValue}>40</div>
              </div>

              <div className={cx(styles.statCard, styles.statPresent)}>
                <div className={styles.statLabel}>Present</div>
                <div className={styles.statValue}>500</div>
              </div>

              <div className={cx(styles.statCard, styles.statAbsent)}>
                <div className={styles.statLabel}>Absent</div>
                <div className={styles.statValue}>40</div>
              </div>
            </div>

            <div className={styles.row3}>
              <div className={cx(styles.card, styles.filtersCard)}>
                <div className={styles.filtersTop}>
                  <select 
                    className={styles.select} 
                    value={selectedCompany}
                    onChange={(e) => {
                      setSelectedCompany(e.target.value);
                      setAppliedCompany(e.target.value);
                    }}
                  >
                    <option value="">
                      Select Company
                    </option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>

                  <select 
                    className={styles.select} 
                    value={selectedBatch}
                    disabled={!selectedCompany}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                  >
                    <option value="">
                      {selectedCompany ? "Select Batch" : "Select Company First"}
                    </option>
                    {batches.map((batch) => (
                      <option key={batch.id} value={batch.id}>
                        {batch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.filtersInfoBox}>
                  <div className={styles.filtersInfoLeft}>
                    {selectedCompany && selectedBatch ? (
                      <>
                        <div className={styles.infoRow}>
                          <div className={styles.infoKey}>Total Students :</div>
                          <div className={styles.infoVal}>100</div>
                        </div>
                        <div className={styles.infoRow}>
                          <div className={styles.infoKey}>Department :</div>
                          <div className={styles.infoVal}>CSE</div>
                        </div>
                        <div className={styles.infoRow}>
                          <div className={styles.infoKey}>Course :</div>
                          <div className={styles.infoVal}>Java FSD</div>
                        </div>
                        <div className={styles.infoRow}>
                          <div className={styles.infoKey}>Present :</div>
                          <div className={styles.infoVal}>59</div>
                        </div>
                        <div className={styles.infoRow}>
                          <div className={styles.infoKey}>Absent :</div>
                          <div className={styles.infoVal}>41</div>
                        </div>
                      </>
                    ) : selectedCompany ? (
                      <div className={styles.filtersPlaceholder}>
                        <div className={styles.filtersPlaceholderLine}>SELECT BATCH</div>
                      </div>
                    ) : (
                      <div className={styles.filtersPlaceholder}>
                        <div className={styles.filtersPlaceholderLine}>SELECT COMPANY</div>
                        <div className={styles.filtersPlaceholderLine}>SELECT BATCH</div>
                      </div>
                    )}
                  </div>

                  <div className={styles.filtersInfoRight}>
                    {appliedCompany && getAppliedCompany() && selectedBatch && getSelectedBatch() ? (
                      <div 
                        className={styles.companyCard}
                        style={{ backgroundColor: getAppliedCompany()?.color || '#6d86c8' }}
                      >
                        <div className={styles.companyIconCircle}>
                          <span style={{ color: '#000', fontWeight: 700 }}>
                            {getAppliedCompany()?.letter}
                          </span>
                        </div>
                        <div className={styles.companyCardName}>
                          {getAppliedCompany()?.name}
                        </div>
                        <div className={styles.companyCardBatch}>
                          {getSelectedBatch()?.name}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className={cx(styles.card, styles.attendanceCard)}>
                <div className={styles.attendanceHeader}>Attendance</div>

                <div className={styles.attendanceBody}>
                  <div className={styles.attendanceChartWrapper}>
                    <div 
                      className={styles.attendanceDonutChart}
                      style={{
                        background: `conic-gradient(from 180deg, #00C495 0% 49%, #FF6B6B 49% 100%)`
                      }}
                    >
                      <div className={styles.attendanceChartCenterText}>
                        <div className={styles.attendanceChartCenterValue}>49%</div>
                        <div className={styles.attendanceChartCenterLabel}>Present</div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.attendanceSideStats}>
                    <div className={styles.sideStatBlock}>
                      <div className={styles.sideStatLabel}>Present</div>
                      <div className={cx(styles.sideStatValue, styles.presentValue)}>
                        49
                      </div>
                    </div>
                    <div className={styles.sideStatBlock}>
                      <div className={styles.sideStatLabel}>Absent</div>
                      <div className={cx(styles.sideStatValue, styles.absentValue)}>
                        51
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAttendancePopupOpen && (
        <div className={styles['coo-tr-att-popup-overlay']}>
          <div className={styles['coo-tr-att-popup-container']}>
            <div className={styles['coo-tr-att-popup-header']}>Attendance &amp; Student Info</div>

            <div className={styles['coo-tr-att-popup-body']}>
              <div className={styles['coo-tr-att-popup-grid']}>
                <div className={styles['coo-tr-att-input-wrapper']}>
                  <label className={styles['coo-tr-att-static-label']}>Company</label>
                  <select
                    className={styles['coo-tr-att-dropdown']}
                    value={attendanceCompany}
                    onChange={(e) => handleAttendanceCompanyChange(e.target.value)}
                    disabled={popupLoading}
                  >
                    <option value="">Select Company</option>
                    {attendanceCompanyOptions.map((companyName) => (
                      <option key={companyName} value={companyName}>{companyName}</option>
                    ))}
                  </select>
                </div>

                <div className={styles['coo-tr-att-input-wrapper']}>
                  <label className={styles['coo-tr-att-static-label']}>Course</label>
                  <select
                    className={styles['coo-tr-att-dropdown']}
                    value={attendanceCourse}
                    onChange={(e) => handleAttendanceCourseChange(e.target.value)}
                    disabled={!attendanceCompany || popupLoading}
                  >
                    <option value="">Select Course</option>
                    {attendanceCourseOptions.map((courseName) => (
                      <option key={courseName} value={courseName}>{courseName}</option>
                    ))}
                  </select>
                </div>

                <div className={styles['coo-tr-att-input-wrapper']}>
                  <label className={styles['coo-tr-att-static-label']}>Start Date</label>
                  <select
                    className={styles['coo-tr-att-dropdown']}
                    value={attendanceStartDate}
                    onChange={(e) => setAttendanceStartDate(e.target.value)}
                    disabled={!attendanceCompany || !attendanceCourse || popupLoading}
                  >
                    <option value="">Select Start Date</option>
                    {attendanceStartDateOptions.map((startDate) => (
                      <option key={startDate} value={startDate}>{formatDateForDisplay(startDate)}</option>
                    ))}
                  </select>
                </div>

                <div className={styles['coo-tr-att-input-wrapper']}>
                  <label className={styles['coo-tr-att-static-label']}>End Date</label>
                  <input
                    className={styles['coo-tr-att-text']}
                    value={formatDateForDisplay(selectedAttendanceSession?.endDate || "")}
                    readOnly
                  />
                </div>

                <div className={styles['coo-tr-att-input-wrapper']}>
                  <label className={styles['coo-tr-att-static-label']}>Today Date</label>
                  <input className={styles['coo-tr-att-text']} value={todayDate} readOnly />
                </div>

                <div className={styles['coo-tr-att-input-wrapper']}>
                  <label className={styles['coo-tr-att-static-label']}>Training Day</label>
                  <input className={styles['coo-tr-att-text']} value={trainingDayLabel} readOnly />
                </div>
              </div>
              {popupError && (
                <p className={styles['coo-tr-att-popup-error']}>{popupError}</p>
              )}
            </div>

            <div className={styles['coo-tr-att-popup-footer']}>
              <button
                type="button"
                className={styles['coo-tr-att-popup-close-btn']}
                onClick={() => setIsAttendancePopupOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className={styles['coo-tr-att-popup-search-btn']}
                onClick={handleAttendanceSearch}
                disabled={!attendanceCompany || !attendanceCourse || !attendanceStartDate || popupLoading}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
