import React, { useEffect, useMemo, useState } from "react";
import useCoordinatorAuth from "../utils/useCoordinatorAuth";
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import { useNavigate } from "react-router-dom";
import mongoDBService from "../services/mongoDBService.jsx";
import styles from "./Cood_trainDBmain.module.css";

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
  const [selectedPhase, setSelectedPhase] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedStartDate, setSelectedStartDate] = useState("");
  const [selectedEndDate, setSelectedEndDate] = useState("");
  const [popupAssignments, setPopupAssignments] = useState([]);
  const [popupLoading, setPopupLoading] = useState(false);

  const trainingTileClassByIndex = [styles.trainingTileGreen, styles.trainingTileTeal, styles.trainingTileBlue];

  const normalizeDateKey = (rawDate) => {
    if (!rawDate) return "";
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) {
      return rawDate.toString().trim();
    }

    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
  };

  const normalizeYearToken = (value = "") => {
    const raw = value.toString().trim().toUpperCase();
    if (!raw) return "";
    const compact = raw.replace(/[^A-Z0-9]/g, "");
    if (!compact) return "";

    const yearAliases = {
      "1": "I", "01": "I", "1ST": "I", "1STYEAR": "I", FIRST: "I", FIRSTYEAR: "I", I: "I",
      "2": "II", "02": "II", "2ND": "II", "2NDYEAR": "II", SECOND: "II", SECONDYEAR: "II", II: "II",
      "3": "III", "03": "III", "3RD": "III", "3RDYEAR": "III", THIRD: "III", THIRDYEAR: "III", III: "III",
      "4": "IV", "04": "IV", "4TH": "IV", "4THYEAR": "IV", FOURTH: "IV", FOURTHYEAR: "IV", IV: "IV",
    };

    return yearAliases[compact] || compact;
  };

  const parseSchedulePhases = (scheduleRecord) => {
    const phases = Array.isArray(scheduleRecord?.phases) ? scheduleRecord.phases : [];
    return phases
      .map((phase) => ({
        phaseNumber: (phase?.phaseNumber || "").toString().trim(),
        applicableYear: normalizeYearToken(phase?.applicableYear || ""),
      }))
      .filter((phase) => phase.phaseNumber || phase.applicableYear);
  };

  const loadPopupAssignments = async () => {
    setPopupLoading(true);

    try {
      const coordinatorData = readStoredCoordinatorData();
      const coordinatorBranch = resolveCoordinatorDepartment(coordinatorData);

      if (!coordinatorBranch) {
        setPopupAssignments([]);
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
    } catch (error) {
      console.error("Failed to load training assignments for popup:", error);
      setPopupAssignments([]);
    } finally {
      setPopupLoading(false);
    }
  };

  useEffect(() => {
    loadPopupAssignments();
  }, []);

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


  const trainingCards = useMemo(() => {
    return popupAssignments.map((assignment, index) => {
      const companyName = (assignment?.companyName || "").toString().trim() || "Training";
      const phaseEntries = parseSchedulePhases(assignment);
      const phaseTokens = [...new Set(phaseEntries.map((phase) => phase.phaseNumber).filter(Boolean))];
      const phaseText = phaseTokens.length > 0 ? phaseTokens.join(", ") : "-";

      const topYear = normalizeYearToken(assignment?.applicableYear || "");
      const phaseYears = phaseEntries.map((phase) => normalizeYearToken(phase.applicableYear)).filter(Boolean);
      const yearTokens = [...new Set([topYear, ...phaseYears].filter(Boolean))];
      const yearText = yearTokens.length > 0 ? yearTokens.join(", ") : "-";

      const startDate = assignment?.startDate || "";
      const endDate = assignment?.endDate || "";
      let durationText = "-";
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        const diffMs = end.getTime() - start.getTime();
        const days = Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1);
        durationText = `${days} Day${days > 1 ? "s" : ""}`;
      }

      return {
        id: assignment?._id || `${companyName}-${startDate}-${endDate}-${index}`,
        companyName,
        courseName: (assignment?.courseName || "").toString().trim(),
        logoText: companyName.charAt(0).toUpperCase() || "T",
        yearText,
        yearTokens,
        phaseText,
        phaseTokens,
        startDate,
        endDate,
        durationText,
      };
    });
  }, [popupAssignments]);

  const companyOptions = useMemo(() => {
    return [...new Set(trainingCards.map((card) => card.companyName).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [trainingCards]);

  const yearOptions = useMemo(() => {
    const order = ["I", "II", "III", "IV"];
    const years = [...new Set(
      trainingCards
        .flatMap((card) => (Array.isArray(card.yearTokens) ? card.yearTokens : []))
        .map((year) => (year || "").toString().trim())
        .filter(Boolean)
    )];

    return years.sort((a, b) => {
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [trainingCards]);

  const phaseOptions = useMemo(() => {
    return [...new Set(
      trainingCards
        .filter((card) => {
          if (selectedCompany && card.companyName !== selectedCompany) return false;
          if (selectedYear && !(Array.isArray(card.yearTokens) ? card.yearTokens : []).includes(selectedYear)) return false;
          return true;
        })
        .flatMap((card) => (Array.isArray(card.phaseTokens) ? card.phaseTokens : []))
        .filter(Boolean)
    )].sort((a, b) => {
      const aNum = Number.parseInt(a, 10);
      const bNum = Number.parseInt(b, 10);
      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) return aNum - bNum;
      return a.localeCompare(b);
    });
  }, [trainingCards, selectedCompany, selectedYear]);

  const baseCardsForDateOptions = useMemo(() => {
    return trainingCards.filter((card) => {
      if (selectedCompany && card.companyName !== selectedCompany) return false;
      if (selectedYear && !(Array.isArray(card.yearTokens) ? card.yearTokens : []).includes(selectedYear)) return false;
      if (selectedPhase && !(Array.isArray(card.phaseTokens) ? card.phaseTokens : []).includes(selectedPhase)) return false;
      return true;
    });
  }, [trainingCards, selectedCompany, selectedYear, selectedPhase]);

  const startDateOptions = useMemo(() => {
    return [...new Set(
      baseCardsForDateOptions
        .map((card) => normalizeDateKey(card.startDate))
        .filter(Boolean)
    )].sort((a, b) => new Date(a) - new Date(b));
  }, [baseCardsForDateOptions]);

  const endDateOptions = useMemo(() => {
    if (!selectedStartDate) {
      return [];
    }

    return [...new Set(
      baseCardsForDateOptions
        .filter((card) => normalizeDateKey(card.startDate) === selectedStartDate)
        .map((card) => normalizeDateKey(card.endDate))
        .filter(Boolean)
    )].sort((a, b) => new Date(a) - new Date(b));
  }, [baseCardsForDateOptions, selectedStartDate]);

  useEffect(() => {
    if (selectedStartDate && !startDateOptions.includes(selectedStartDate)) {
      setSelectedStartDate("");
    }

    if (selectedEndDate && !endDateOptions.includes(selectedEndDate)) {
      setSelectedEndDate("");
    }
  }, [selectedStartDate, selectedEndDate, startDateOptions, endDateOptions]);

  const filteredTrainingCards = useMemo(() => {
    return trainingCards.filter((card) => {
      if (selectedCompany && card.companyName !== selectedCompany) return false;
      if (selectedYear) {
        const cardYears = Array.isArray(card.yearTokens) ? card.yearTokens : [];
        if (!cardYears.includes(selectedYear)) return false;
      }
      if (selectedPhase) {
        const cardPhases = Array.isArray(card.phaseTokens) ? card.phaseTokens : [];
        if (!cardPhases.includes(selectedPhase)) return false;
      }
      if (selectedStartDate && normalizeDateKey(card.startDate) !== selectedStartDate) return false;
      if (selectedEndDate && normalizeDateKey(card.endDate) !== selectedEndDate) return false;
      return true;
    });
  }, [trainingCards, selectedCompany, selectedYear, selectedPhase, selectedStartDate, selectedEndDate]);

  const trainingSummaryCounts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ongoing = filteredTrainingCards.reduce((count, card) => {
      const start = new Date(card.startDate);
      const end = new Date(card.endDate);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        return count;
      }

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      return start <= today && end >= today ? count + 1 : count;
    }, 0);

    return {
      ongoing,
      total: filteredTrainingCards.length,
    };
  }, [filteredTrainingCards]);

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
                  <div className={cx(styles.card, styles.trainingSummaryCard, styles.trainingSummaryOngoingCard)}>
                    <div className={styles.trainingSummaryLabel}>This Month Trainings</div>
                    <div className={styles.trainingSummaryValue}>{trainingSummaryCounts.ongoing}</div>
                    <div className={styles.trainingSummaryHint}>Currently active trainings</div>
                  </div>

                  <div className={cx(styles.card, styles.trainingFiltersCard)}>
                    <div className={styles.trainingFiltersTitle}>Training Filters</div>
                    <div className={styles.trainingFiltersGrid}>
                      <div className={styles.trainingFilterField}>
                        <label className={styles.trainingFilterLabel}>Company Name</label>
                        <select
                          className={styles.trainingFilterControl}
                          value={selectedCompany}
                          onChange={(e) => {
                            setSelectedCompany(e.target.value);
                            setSelectedYear("");
                            setSelectedPhase("");
                            setSelectedStartDate("");
                            setSelectedEndDate("");
                          }}
                        >
                          <option value="">Select Company</option>
                          {companyOptions.map((companyName) => (
                            <option key={companyName} value={companyName}>{companyName}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.trainingFilterField}>
                        <label className={styles.trainingFilterLabel}>Phase</label>
                        <select
                          className={styles.trainingFilterControl}
                          value={selectedPhase}
                          onChange={(e) => {
                            setSelectedPhase(e.target.value);
                            setSelectedStartDate("");
                            setSelectedEndDate("");
                          }}
                        >
                          <option value="">Select Phase</option>
                          {phaseOptions.map((phaseValue) => (
                            <option key={phaseValue} value={phaseValue}>{`Phase ${phaseValue}`}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.trainingFilterField}>
                        <label className={styles.trainingFilterLabel}>Year</label>
                        <select
                          className={styles.trainingFilterControl}
                          value={selectedYear}
                          onChange={(e) => {
                            setSelectedYear(e.target.value);
                            setSelectedPhase("");
                            setSelectedStartDate("");
                            setSelectedEndDate("");
                          }}
                        >
                          <option value="">Select Year</option>
                          {yearOptions.map((yearValue) => (
                            <option key={yearValue} value={yearValue}>{yearValue}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.trainingFilterField}>
                        <label className={styles.trainingFilterLabel}>Start Date</label>
                        <select
                          className={styles.trainingFilterControl}
                          value={selectedStartDate}
                          onChange={(e) => {
                            setSelectedStartDate(e.target.value);
                            setSelectedEndDate("");
                          }}
                          disabled={startDateOptions.length === 0}
                        >
                          <option value="">Select Start Date</option>
                          {startDateOptions.map((dateValue) => (
                            <option key={dateValue} value={dateValue}>{formatDateForDisplay(dateValue)}</option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.trainingFilterField}>
                        <label className={styles.trainingFilterLabel}>End Date</label>
                        <select
                          className={styles.trainingFilterControl}
                          value={selectedEndDate}
                          onChange={(e) => setSelectedEndDate(e.target.value)}
                          disabled={endDateOptions.length === 0}
                        >
                          <option value="">Select End Date</option>
                          {endDateOptions.map((dateValue) => (
                            <option key={dateValue} value={dateValue}>{formatDateForDisplay(dateValue)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className={cx(styles.card, styles.trainingSummaryCard, styles.trainingSummaryTotalCard)}>
                    <div className={styles.trainingSummaryLabel}>Total Trainings</div>
                    <div className={styles.trainingSummaryValue}>{trainingSummaryCounts.total}</div>
                    <div className={styles.trainingSummaryHint}>Visible for the selected filters</div>
                  </div>
                </div>

                <div className={styles.row2}>
              <div className={cx(styles.card, styles.trainingsCard)}>
                <div className={styles.trainingsHeader}>Trainings</div>
                <div className={styles.trainingsInner}>
                  {filteredTrainingCards.length === 0 ? (
                    <div className={styles.trainingsEmpty}>No trainings found for selected filters.</div>
                  ) : (
                    filteredTrainingCards.map((card, index) => {
                      const handleTrainingCardClick = () => {
                        let cardTrainingDayLabel = "Training Day -";
                        if (card.startDate) {
                          const start = new Date(card.startDate);
                          const today = new Date();
                          start.setHours(0, 0, 0, 0);
                          today.setHours(0, 0, 0, 0);
                          if (!Number.isNaN(start.getTime())) {
                            const dayDiff = Math.floor((today.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
                            const clampedDay = Math.max(1, dayDiff);
                            cardTrainingDayLabel = `Training Day ${clampedDay}`;
                          }
                        }

                        navigate("/coo-train-attendance-stuinfo", {
                          state: {
                            company: card.companyName,
                            course: card.courseName,
                            companyName: card.companyName,
                            courseName: card.courseName,
                            startDate: card.startDate,
                            endDate: card.endDate,
                            todayDate,
                            trainingDayLabel: cardTrainingDayLabel,
                          },
                        });
                      };

                      return (
                      <div
                        key={card.id}
                        className={cx(styles.trainingTile, styles.trainingTileClickable, trainingTileClassByIndex[index % trainingTileClassByIndex.length])}
                        role="button"
                        tabIndex={0}
                        onClick={handleTrainingCardClick}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleTrainingCardClick();
                          }
                        }}
                      >
                        <div className={cx(styles.trainingIconCircle, index % 2 === 1 && styles.trainingIconCircleAlt)}>{card.logoText}</div>
                        <div className={styles.trainingTileText}>
                          <div className={styles.trainingTitle}>{card.companyName}</div>
                          <div className={styles.trainingMeta}>Year: {card.yearText}</div>
                          <div className={styles.trainingMeta}>Phase: {card.phaseText}</div>
                          <div className={styles.trainingMeta}>Start Date: {formatDateForDisplay(card.startDate)}</div>
                          <div className={styles.trainingMeta}>End Date: {formatDateForDisplay(card.endDate)}</div>
                          <div className={styles.trainingMeta}>Duration: {card.durationText}</div>
                        </div>
                      </div>
                      );
                    })
                  )}
                </div>
              </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
