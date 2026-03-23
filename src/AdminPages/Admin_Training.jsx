import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdNavbar from '../components/Navbar/Adnavbar.js';
import AdSidebar from '../components/Sidebar/Adsidebar.js';
import AddTrainingIcon from '../assets/ad_addtrainingicon.svg';
import ScheduleTrainingIcon from '../assets/ad_scheduletrainingicon.svg';
import AttendanceTrainingIcon from '../assets/ad_at_attendance.svg';
import styles from './Admin_Training.module.css';

function AdminTraining({ onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const companies = ['TCS', 'Infosys', 'Wipro', 'Zoho'];
  const batches = ['Batch - I', 'Batch - II', 'Batch - III'];

  const summaryDataByFilter = {
    'TCS|Batch - I': { totalStudents: 100, departments: 'CSE, ECE, IT', course: 'Java FSD', present: 59, absent: 41 },
    'TCS|Batch - II': { totalStudents: 80, departments: 'CSE, IT', course: 'React', present: 52, absent: 28 },
    'TCS|Batch - III': { totalStudents: 60, departments: 'ECE, IT', course: 'Python', present: 45, absent: 15 },
    'Infosys|Batch - I': { totalStudents: 90, departments: 'CSE, EEE', course: 'Node.js', present: 64, absent: 26 },
    'Infosys|Batch - II': { totalStudents: 120, departments: 'CSE, ECE, IT', course: 'Java FSD', present: 88, absent: 32 },
    'Infosys|Batch - III': { totalStudents: 70, departments: 'IT', course: 'HTML/CSS', present: 49, absent: 21 },
    'Wipro|Batch - I': { totalStudents: 110, departments: 'CSE, IT', course: 'JavaScript', present: 77, absent: 33 },
    'Wipro|Batch - II': { totalStudents: 95, departments: 'CSE, ECE', course: 'Java FSD', present: 60, absent: 35 },
    'Wipro|Batch - III': { totalStudents: 75, departments: 'ECE', course: 'Python', present: 50, absent: 25 },
    'Zoho|Batch - I': { totalStudents: 85, departments: 'CSE, IT', course: 'React', present: 55, absent: 30 },
    'Zoho|Batch - II': { totalStudents: 105, departments: 'CSE, ECE, IT', course: 'Java FSD', present: 70, absent: 35 },
    'Zoho|Batch - III': { totalStudents: 65, departments: 'IT, ECE', course: 'Node.js', present: 40, absent: 25 },
  };

  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  const appliedSummary =
    selectedCompany && selectedBatch
      ? (summaryDataByFilter[`${selectedCompany}|${selectedBatch}`] || null)
      : null;

  const getPlaceholderText = () => {
    if (appliedSummary) return null;
    if (selectedCompany && !selectedBatch) return 'Select the Batch';
    if (!selectedCompany && selectedBatch) return 'Select the Company';
    return 'Select Company and Batch';
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const getAbsentSlicePath = (absentPercent) => {
    if (!absentPercent || absentPercent <= 0) return '';
    if (absentPercent >= 1) {
      return 'M60 20 A40 40 0 1 1 59.999 20 L60 60 Z';
    }

    const startAngle = 0;
    const endAngle = absentPercent * 360;
    const start = polarToCartesian(60, 60, 40, endAngle);
    const end = polarToCartesian(60, 60, 40, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A 40 40 0 ${largeArcFlag} 0 ${end.x} ${end.y} L 60 60 Z`;
  };

  useEffect(() => {
    const handleCloseSidebar = () => setIsSidebarOpen(false);
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((v) => !v);
  };

  return (
    <div className={styles['ad-tr-page']}>
      <AdNavbar onToggleSidebar={toggleSidebar} />
      <AdSidebar isOpen={isSidebarOpen} onLogout={onLogout} />

      <div className={styles['ad-tr-content']}>
        <div className={styles['ad-tr-header-row']}>
          <div className={styles['ad-tr-breadcrumb']}>
            {/* <div className={styles['ad-tr-breadcrumb-title']}>Admin</div>
            <div className={styles['ad-tr-breadcrumb-sub']}>Training</div> */}
          </div>
        </div>

        <div className={styles['ad-tr-top-grid']}>
          <button type="button" className={styles['ad-tr-action-card']} onClick={() => navigate('/admin-add-training')}>
            <div className={styles['ad-tr-action-icon']}>
              <img src={AddTrainingIcon} alt="Add Training" />
            </div>
            <div className={styles['ad-tr-action-title']}>Add Training Programme</div>
            <div className={styles['ad-tr-action-sub']}>Click to Add Training programs to develop Students skills</div>
          </button>

          <button
            type="button"
            className={styles['ad-tr-action-card']}
            onClick={() => navigate('/admin-schedule-training')}
          >
            <div className={styles['ad-tr-action-icon']}>
              <img src={ScheduleTrainingIcon} alt="Schedule Training" />
            </div>
            <div className={styles['ad-tr-action-title']}>Schedule Training</div>
            <div className={styles['ad-tr-action-sub']}>Click to Schedule Training programs to develop Students skill</div>
          </button>

          <button type="button" className={styles['ad-tr-action-card']}
          onClick={() => navigate('/admin-attendance-stdinfo')}
          >
            <div className={styles['ad-tr-action-icon']}>
              <img src={AttendanceTrainingIcon} alt="Attendance and Student Info" />
            </div>
            <div className={styles['ad-tr-action-title']}>Attendance & Student Info</div>
            <div className={styles['ad-tr-action-sub']}>Click to take Attendance and to view Student info</div>
          </button>

          <div className={styles['ad-tr-summary-card']}>
            <div className={styles['ad-tr-summary-filters']}>
              <select
                className={styles['ad-tr-select']}
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
              >
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                className={styles['ad-tr-select']}
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                <option value="">Select Batch</option>
                {batches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className={styles['ad-tr-summary-body']}>
              <div className={styles['ad-tr-summary-text']}>
                {appliedSummary ? (
                  <>
                    <div className={styles['ad-tr-summary-line']}><span>Total Students :</span><strong>{appliedSummary.totalStudents}</strong></div>
                    <div className={styles['ad-tr-summary-line']}><span>Departments :</span><strong>{appliedSummary.departments}</strong></div>
                    <div className={styles['ad-tr-summary-line']}><span>Course :</span><strong>{appliedSummary.course}</strong></div>
                    <div className={styles['ad-tr-summary-line']}><span>Present :</span><strong>{appliedSummary.present}</strong></div>
                    <div className={styles['ad-tr-summary-line']}><span>Absent :</span><strong>{appliedSummary.absent}</strong></div>
                  </>
                ) : (
                  <div className={styles['ad-tr-summary-placeholder']}>{getPlaceholderText()}</div>
                )}
              </div>

              <div className={styles['ad-tr-summary-chart']}>
                {(() => {
                  const present = appliedSummary?.present ?? 0;
                  const absent = appliedSummary?.absent ?? 0;
                  const total = present + absent;
                  const absentPercent = total > 0 ? absent / total : 0;
                  const absentPath = getAbsentSlicePath(absentPercent);

                  return (
                    <>
                      <svg viewBox="0 0 120 120" className={styles['ad-tr-pie']} aria-hidden="true">
                        {/* Background circle for Present (green) */}
                        <circle
                          cx="60"
                          cy="60"
                          r="40"
                          fill="#17c491"
                        />
                        {/* Absent slice (red) as a path */}
                        {absentPath ? (
                          <path
                            d={absentPath}
                            fill="#ff6b6b"
                          />
                        ) : null}
                        {/* Labels inside pie */}
                        <text x="70" y="55" className={styles['ad-tr-pie-label-present']}>Present</text>
                        <text x="72" y="70" className={styles['ad-tr-pie-value-present']}>{present}</text>
                        <text x="32" y="45" className={styles['ad-tr-pie-label-absent']}>Absent</text>
                        <text x="35" y="60" className={styles['ad-tr-pie-value-absent']}>{absent}</text>
                      </svg>

                      <div className={styles['ad-tr-summary-legend']}>
                        <div className={styles['ad-tr-legend-row']}>
                          <span>Present</span>
                          <strong className={styles['ad-tr-legend-present']}>{present}</strong>
                        </div>
                        <div className={styles['ad-tr-legend-row']}>
                          <span>Absent</span>
                          <strong className={styles['ad-tr-legend-absent']}>{absent}</strong>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className={styles['ad-tr-section-header']}>Trainings</div>

        <div className={styles['ad-tr-training-grid']}>
          <div className={styles['ad-tr-training-card']}>
            <div className={styles['ad-tr-training-logo']}>R</div>
            <div className={styles['ad-tr-training-name']}>R - Sequence</div>
            <div className={styles['ad-tr-training-meta']}>Trainers: 8</div>
            <div className={styles['ad-tr-training-meta']}>Duration: 21 Days</div>
          </div>

          <div className={styles['ad-tr-training-card-alt']}>
            <div className={styles['ad-tr-training-logo-alt']}>X</div>
            <div className={styles['ad-tr-training-name']}>X - Plore</div>
            <div className={styles['ad-tr-training-meta']}>Trainers: 3</div>
            <div className={styles['ad-tr-training-meta']}>Duration: 2 Days</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminTraining;
