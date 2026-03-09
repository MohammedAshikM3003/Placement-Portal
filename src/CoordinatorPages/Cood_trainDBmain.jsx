import React, { useState } from "react";
import useCoordinatorAuth from "../utils/useCoordinatorAuth";
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import { useNavigate } from "react-router-dom";
import styles from "./Cood_trainDBmain.module.css";

import CalendarIcon from "../assets/cood_trainingDBCalendaricon.svg";

const cx = (...classNames) => classNames.filter(Boolean).join(" ");

export default function CoodTrainDBMain({ onLogout, onViewChange }) {
  useCoordinatorAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("");
  const [appliedCompany, setAppliedCompany] = useState("");

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

  const handleAttendanceCardClick = () => {
    navigate('/coo-train-attendance-stuinfo');
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
                  Click to Take Attendance and to view student info.
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
                    ) : appliedCompany && getAppliedCompany() ? (
                      <div className={styles.filtersPlaceholder}>
                        <div className={styles.filtersPlaceholderLine}>Select Batch</div>
                      </div>
                    ) : (
                      <div className={styles.filtersPlaceholder}>
                        <div className={styles.filtersPlaceholderLine}>Select Company</div>
                        <div className={styles.filtersPlaceholderLine}>Select Batch...</div>
                      </div>
                    )}
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
    </div>
  );
}
