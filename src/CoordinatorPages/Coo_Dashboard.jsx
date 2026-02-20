import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import styles from "./Coo_Dashboard.module.css";
import mongoDBService from '../services/mongoDBService';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { changeFavicon, FAVICON_TYPES } from '../utils/faviconUtils';

import Coordmyacc from "../assets/Coordmyacc.svg";
import UpcomingDriveIcon from "../assets/UpcomingDriveIcon.svg";
import Reportdashbord from "../assets/Reportdashboard.svg";
import uploadcertificateicon from "../assets/uploadcertificateicon.svg";
import AdminBrowseStudenticon from "../assets/AdminBrowseStudenticon.svg";
import ksrCollegeImage from "../assets/ksrCollegeImage.jpg";
import { fetchCollegeImages } from '../services/collegeImagesService';


const cx = (...classNames) => classNames.filter(Boolean).join(" ");


// ====================================================================
// 1. THE ATTENDANCE CHART COMPONENT
// This component creates the visual donut chart and the details.
// ====================================================================
// Coordinator-specific attendance chart (uses recharts, names differ from admin)
const CooModernAttendanceChart = ({ present, absent, isLoading }) => {
  const total = present + absent;
  const presentPerc = total > 0 ? Math.round((present / total) * 100) : 0;

  const pieData = (present === 0 && absent === 0)
    ? [{ name: 'No Data', value: 1, color: '#D3D3D3' }]
    : [
      { name: 'Present', value: present, color: '#00C495' },
      { name: 'Absent', value: absent, color: '#FF6B6B' }
      ];

  return (
    <div className={styles['co-db-attendance-card-content']}>
      <div className={styles['co-db-attendance-chart-wrapper']}>
        {isLoading ? (
          <div className={styles['co-db-attendance-chart-center-text']}>
            <div className={styles['co-db-attendance-chart-center-value']}>...</div>
            <div className={styles['co-db-attendance-chart-center-label']}>Loading</div>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  startAngle={90}
                  endAngle={-270}
                  paddingAngle={0}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className={styles['co-db-attendance-chart-center-text']}>
              <div className={styles['co-db-attendance-chart-center-value']}>{presentPerc}%</div>
              <div className={styles['co-db-attendance-chart-center-label']}>Present</div>
            </div>
          </>
        )}
      </div>
      <div className={styles['co-db-attendance-details-wrapper']}>
        <div className={styles['co-db-attendance-detail-item']}>
          Present
          <div className={`${styles['co-db-attendance-detail-value']} ${styles['co-db-attendance-present-value']}`}>
            {isLoading ? '...' : present}
          </div>
        </div>
        <div className={styles['co-db-attendance-detail-item']}>
          Absent
          <div className={`${styles['co-db-attendance-detail-value']} ${styles['co-db-attendance-absent-value']}`}>
            {isLoading ? '...' : absent}
          </div>
        </div>
      </div>
    </div>
  );
};


function CoordinatorDashboard({ onLogout, onViewChange }) {
  useCoordinatorAuth(); // JWT authentication verification
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collegeLogoUrl, setCollegeLogoUrl] = useState(ksrCollegeImage); // Default fallback
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0 });
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(true);
  const [upcomingDrive, setUpcomingDrive] = useState(null);
  const [isLoadingUpcomingDrive, setIsLoadingUpcomingDrive] = useState(true);

  // Change favicon to coordinator (red flipped) for coordinator dashboard
  React.useEffect(() => {
    changeFavicon(FAVICON_TYPES.COORDINATOR);
  }, []);

  // Fetch college logo from DB
  React.useEffect(() => {
    const loadCollegeLogo = async () => {
      const images = await fetchCollegeImages();
      if (images && images.collegeLogo) {
        setCollegeLogoUrl(images.collegeLogo);
        console.log('✅ College logo loaded for coordinator dashboard');
      }
    };
    loadCollegeLogo();
  }, []);

  // Read coordinator branch from localStorage (unique names to avoid collisions)
  const _readCoorStored = () => {
    try {
      const s = localStorage.getItem('coordinatorData');
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  };

  const _resolveCoorBranch = (data) => {
    if (!data) return null;
    const val = data.department || data.branch || data.dept || data.departmentName || data.coordinatorDepartment || data.assignedDepartment;
    return val ? val.toString().toUpperCase() : null;
  };

  const parseDriveDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) {
      return Number.isFinite(value.getTime()) ? value : null;
    }
    const raw = value.toString().trim();
    if (!raw) return null;

    const ddmmyyyy = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (ddmmyyyy) {
      const day = parseInt(ddmmyyyy[1], 10);
      const month = parseInt(ddmmyyyy[2], 10);
      const year = parseInt(ddmmyyyy[3], 10);
      const dt = new Date(year, month - 1, day);
      return Number.isFinite(dt.getTime()) ? dt : null;
    }

    const dt = new Date(raw);
    return Number.isFinite(dt.getTime()) ? dt : null;
  };

  const formatDDMMYYYY = (date) => {
    if (!(date instanceof Date) || !Number.isFinite(date.getTime())) return '—';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const normalizeBranches = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(v => v?.toString?.().trim()).filter(Boolean);
    return value
      .toString()
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
  };

  useEffect(() => {
    let mounted = true;

    const pickUpcomingDrive = async () => {
      try {
        setIsLoadingUpcomingDrive(true);

        const coordData = _readCoorStored();
        const coordBranch = _resolveCoorBranch(coordData);

        const data = await mongoDBService.getCompanyDrives();
        const allDrives = Array.isArray(data)
          ? data
          : (data?.drives || data?.data || data?.companyDrives || []);

        console.log('📌 Dashboard company drives fetched:', {
          count: Array.isArray(allDrives) ? allDrives.length : 0,
          coordinatorBranch: coordBranch,
        });

        const drivesForBranch = (Array.isArray(allDrives) ? allDrives : []).filter(drive => {
          if (!coordBranch) return true;
          const driveBranches = normalizeBranches(drive.eligibleBranches || drive.branch || drive.department);
          const normalized = driveBranches.map(b => b.toString().toUpperCase());
          return normalized.some(b => b === coordBranch || b.includes(coordBranch) || coordBranch.includes(b));
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const datedDrives = drivesForBranch
          .map(drive => {
            const dateValue =
              drive.startingDate ||
              drive.startingdate ||
              drive.driveStartDate ||
              drive.driveStartdate ||
              drive.companyDriveDate ||
              drive.driveDate ||
              drive.visitDate ||
              drive.visitdate ||
              drive.startDate;
            const parsedDate = parseDriveDate(dateValue);
            return { drive, parsedDate };
          })
          .filter(item => item.parsedDate)
          .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

        const upcoming = datedDrives.filter(item => item.parsedDate.getTime() >= today.getTime());
        const fallbackRecentPast = [...datedDrives]
          .filter(item => item.parsedDate.getTime() < today.getTime())
          .sort((a, b) => b.parsedDate.getTime() - a.parsedDate.getTime());

        const selected = upcoming[0] || fallbackRecentPast[0] || null;

        if (!mounted) return;

        if (selected) {
          setUpcomingDrive({ ...selected.drive, __parsedStartDate: selected.parsedDate });
          console.log('✅ Dashboard upcoming drive selected:', {
            companyName: selected.drive?.companyName || selected.drive?.company,
            jobRole: selected.drive?.jobRole || selected.drive?.role,
            date: formatDDMMYYYY(selected.parsedDate),
          });
        } else {
          setUpcomingDrive(null);
          console.log('ℹ️ Dashboard upcoming drive selected: none');
        }
      } catch (error) {
        console.error('Error fetching upcoming drive:', error);
        if (mounted) setUpcomingDrive(null);
      } finally {
        if (mounted) setIsLoadingUpcomingDrive(false);
      }
    };

    pickUpcomingDrive();
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch recent attendance relevant to this coordinator's branch
  useEffect(() => {
    let mounted = true;
    const cacheKey = 'coordinatorAttendanceCache';
    const cacheTimeKey = 'coordinatorAttendanceCacheTime';

    const getTime = (att) => {
      const t = att?.updatedAt || att?.submittedAt || att?.createdAt || att?.startDate || 0;
      const ms = new Date(t).getTime();
      return Number.isFinite(ms) ? ms : 0;
    };

    const fetchStats = async () => {
      try {
        setIsLoadingAttendance(true);

        const coordData = _readCoorStored();
        const coordBranch = _resolveCoorBranch(coordData);

        // Try cache first (separate cache key for coordinator dashboard)
        const cached = localStorage.getItem(cacheKey);
        const cachedTime = localStorage.getItem(cacheTimeKey);
        const cacheExpiry = 5 * 60 * 1000; // 5 minutes
        if (cached && cachedTime) {
          const age = Date.now() - parseInt(cachedTime, 10);
          if (age < cacheExpiry) {
            const parsed = JSON.parse(cached);
            const attendances = Array.isArray(parsed) ? parsed : (parsed?.data || parsed?.attendances || []);

            // Filter attendances that contain students of this branch
            const matches = attendances.filter(att => {
              if (!coordBranch) return false;
              if (!Array.isArray(att.students)) return false;
              return att.students.some(s => {
                const sb = (s.branch || s.department || s.dept || '').toString().toUpperCase();
                return sb && (sb === coordBranch || sb.includes(coordBranch));
              });
            });

            const latest = matches.length > 0 ? [...matches].sort((a,b) => getTime(b) - getTime(a))[0] : [...attendances].sort((a,b)=>getTime(b)-getTime(a))[0];
            if (latest && mounted) {
              setAttendanceStats({ present: latest.totalPresent || latest.totalPresentCount || latest.present || 0, absent: latest.totalAbsent || latest.totalAbsentCount || latest.absent || 0 });
              setIsLoadingAttendance(false);
              return;
            }
          }
        }

        // Fetch fresh
        const response = await mongoDBService.getAllAttendance();
        localStorage.setItem(cacheKey, JSON.stringify(response));
        localStorage.setItem(cacheTimeKey, Date.now().toString());

        const attendances = Array.isArray(response) ? response : (response?.data || response?.attendances || []);
        const matches = attendances.filter(att => {
          if (!coordBranch) return false;
          if (!Array.isArray(att.students)) return false;
          return att.students.some(s => {
            const sb = (s.branch || s.department || s.dept || '').toString().toUpperCase();
            return sb && (sb === coordBranch || sb.includes(coordBranch));
          });
        });

        const latest = matches.length > 0 ? [...matches].sort((a,b) => getTime(b) - getTime(a))[0] : [...attendances].sort((a,b)=>getTime(b)-getTime(a))[0];
        if (latest && mounted) {
          setAttendanceStats({ present: latest.totalPresent || latest.totalPresentCount || latest.present || 0, absent: latest.totalAbsent || latest.totalAbsentCount || latest.absent || 0 });
        } else if (mounted) {
          setAttendanceStats({ present: 0, absent: 0 });
        }
      } catch (err) {
        console.error('Error fetching coordinator attendance stats:', err);
      } finally {
        if (mounted) setIsLoadingAttendance(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    const onVisibility = () => { if (!document.hidden) fetchStats(); };
    document.addEventListener('visibilitychange', onVisibility);

    return () => { mounted = false; clearInterval(interval); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);

  const handleCardClick = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  return (
    <div className={styles["coordinator-dashboard-page"]}>
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={styles["co-db-main"]}>
        <Sidebar
          isOpen={isSidebarOpen}
          onLogout={onLogout}
          currentView="dashboard"
          onViewChange={onViewChange}
        />
        <div className={styles["co-db-dashboard-area"]}>
      {/* College header */}
      <div className={styles["co-db-college-header"]}>
        <img src={collegeLogoUrl} alt="KSR College Logo" className={styles["co-db-college-logo"]} />
        <div className={styles["co-db-college-name"]}>
          K S R COLLEGE OF ENGINEERING (<span>Autonomous</span>) - 637215
        </div>
      </div>
      
      {/* Main Dashboard Grid - REORDERED */}
      <div className={styles["co-db-dashboard-grid"]}>
        
        {/* --- ROW 1 --- */}
        {/* Card 1: Takes 1 column */}
        <div
          className={cx(styles["co-db-card"], styles["co-db-card-browse"])}
          onClick={() => handleCardClick('manage-students')}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles["co-db-card-icon"]}>
            <img src={AdminBrowseStudenticon} alt="Browse Students" />
          </div>
          <h3 className={styles["co-db-card-title"]}>Browse Students</h3>
          <p className={styles["co-db-card-sub"]}>Filter, sort and manage<br />Student records</p>
        </div>

        {/* Card 2: Takes 1 column */}
        <div
          className={cx(styles["co-db-card"], styles["co-db-card-drive"])}
          onClick={() => handleCardClick('company-drive')}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles["co-db-card-icon"]}>
            <img src={UpcomingDriveIcon} alt="Upcoming Drive" />
          </div>
          <h3 className={styles["co-db-card-title"]}>Upcoming Drive</h3>
          <div className={styles["co-db-drive-details"]}>
            <p>
              <strong>Company Name:</strong>{' '}
              {isLoadingUpcomingDrive ? 'Loading…' : (upcomingDrive?.companyName || upcomingDrive?.company || '—')}
            </p>
            <p>
              <strong>Date:</strong>{' '}
              {isLoadingUpcomingDrive
                ? 'Loading…'
                : (upcomingDrive?.__parsedStartDate ? formatDDMMYYYY(upcomingDrive.__parsedStartDate) : '—')}
            </p>
            <p>
              <strong>Role:</strong>{' '}
              {isLoadingUpcomingDrive ? 'Loading…' : (upcomingDrive?.jobRole || upcomingDrive?.role || '—')}
            </p>
            <p>
              <strong>Eligibility:</strong>{' '}
              {isLoadingUpcomingDrive
                ? 'Loading…'
                : (Array.isArray(upcomingDrive?.eligibleBranches)
                  ? upcomingDrive.eligibleBranches.join(', ')
                  : (upcomingDrive?.branch || upcomingDrive?.department || '—'))}
            </p>
          </div>
        </div>

        {/* Card 3: Takes 2 columns */}
        <div className={cx(styles["co-db-card"], styles["co-db-attendance-card"])}>
          <h2 className={styles["co-db-new-attendance-title"]}>Attendance</h2>
          <CooModernAttendanceChart present={attendanceStats.present} absent={attendanceStats.absent} isLoading={isLoadingAttendance} />
        </div>

        {/* --- ROW 2 --- */}
        {/* Card 4: Takes 2 columns */}
        <div
          className={cx(styles["co-db-card"], styles["co-db-card-certificates"])}
          onClick={() => handleCardClick('certificate-verification')}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles["co-db-card-icon"]}>
            <img src={uploadcertificateicon} alt="Upload Certificate"/>
          </div>
          <div className={styles["co-db-card-content"]}>
            <h3 className={styles["co-db-card-title"]}>Certificates Approval</h3>
            <p className={styles["co-db-card-sub"]}>Monitor Certificate submissions and<br />approvals for timely validation</p>
          </div>
        </div>
        
        {/* Card 5: Takes 1 column */}
        <div
          className={styles["co-db-card"]}
          onClick={() => handleCardClick('manage-students-semester')}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles["co-db-card-icon"]}>
            <img src={Reportdashbord} alt="Semester Icon" />
          </div>
          <h3 className={styles["co-db-card-title"]}>Semester</h3>
          <p className={styles["co-db-card-sub"]}>Click to update semester CGPA here</p>
        </div>

        {/* Card 6: Takes 1 column */}
        <div
          className={cx(styles["co-db-card"], styles["co-db-account-card"])}
          onClick={() => handleCardClick('profile')}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles["co-db-card-icon"]}><img src={Coordmyacc} alt="My Account" /></div>
          <h3 className={styles["co-db-card-title"]}>My Account</h3>
          <p className={styles["co-db-card-sub"]}>Settings</p>
        </div>

      </div>
      </div>
    </div>
    </div>
  );
}

export default CoordinatorDashboard;