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

          <button type="button" className={styles['ad-tr-action-card']} onClick={() => navigate('/admin-attendance-stdinfo')}>
            <div className={styles['ad-tr-action-icon']}>
              <img src={AttendanceTrainingIcon} alt="Attendance and Student Info" />
            </div>
            <div className={styles['ad-tr-action-title']}>Attendance & Student Info</div>
            <div className={styles['ad-tr-action-sub']}>Click to take Attendance and to view Student info</div>
          </button>

          <div className={styles['ad-tr-summary-card']}>
            <div className={styles['ad-tr-summary-filters']}>
              <select className={styles['ad-tr-select']} defaultValue="company">
                <option value="company">Select Company</option>
              </select>
              <select className={styles['ad-tr-select']} defaultValue="batch">
                <option value="batch">Select Batch</option>
              </select>
              <button type="button" className={styles['ad-tr-apply-btn']}>Apply</button>
            </div>

            <div className={styles['ad-tr-summary-body']}>
              <div className={styles['ad-tr-summary-text']}>
                <div className={styles['ad-tr-summary-line']}><span>Total Students :</span><strong>100</strong></div>
                <div className={styles['ad-tr-summary-line']}><span>Departments :</span><strong>CSE, ECE, IT</strong></div>
                <div className={styles['ad-tr-summary-line']}><span>Course :</span><strong>Java FSD</strong></div>
                <div className={styles['ad-tr-summary-line']}><span>Present :</span><strong>59</strong></div>
                <div className={styles['ad-tr-summary-line']}><span>Absent :</span><strong>41</strong></div>
              </div>

              <div className={styles['ad-tr-summary-chart']}>
                <svg viewBox="0 0 120 120" className={styles['ad-tr-pie']} aria-hidden="true">
                  {/* Background circle for Present (green) */}
                  <circle
                    cx="60"
                    cy="60"
                    r="40"
                    fill="#17c491"
                  />
                  {/* Absent slice (red) as a path */}
                  <path
                    d="M60 20 A40 40 0 0 1 92.36 34.64 L60 60 Z"
                    fill="#ff6b6b"
                  />
                  {/* Labels inside pie */}
                  <text x="70" y="55" className={styles['ad-tr-pie-label-present']}>Present</text>
                  <text x="72" y="70" className={styles['ad-tr-pie-value-present']}>59</text>
                  <text x="32" y="45" className={styles['ad-tr-pie-label-absent']}>Absent</text>
                  <text x="35" y="60" className={styles['ad-tr-pie-value-absent']}>41</text>
                </svg>

                <div className={styles['ad-tr-summary-legend']}>
                  <div className={styles['ad-tr-legend-row']}>
                    <span>Present</span>
                    <strong className={styles['ad-tr-legend-present']}>59</strong>
                  </div>
                  <div className={styles['ad-tr-legend-row']}>
                    <span>Absent</span>
                    <strong className={styles['ad-tr-legend-absent']}>41</strong>
                  </div>
                </div>
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
