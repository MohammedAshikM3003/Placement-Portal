import React from "react";
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';
import ksrCollegeImage from "../assets/ksrCollegeImage.jpg";
import Profile from "../assets/totalpercentagestudenticon.png";
import totalpercentagestudenticon from "../assets/UpcomingDriveIcon.svg";
import Resume from "../assets/UploadResumeIcon.svg";
import certificateuploadicon from "../assets/UploadCertificatecardicon.svg";
// Import CSS Module
import styles from "./dashboard.module.css";

// Attendance Chart Component
const AttendanceChart = ({ present, absent }) => {
    const total = present + absent;
    const presentPerc = total > 0 ? Math.round((present / total) * 100) : 0;
    const chartStyle = {
        background: `conic-gradient(from 180deg, #00C495 0% ${presentPerc}%, #FF6B6B ${presentPerc}% 100%)`,
    };

    return (
        <div className={styles['stu-db-attendance-card-content']}>
            <div className={styles['stu-db-attendance-chart-wrapper']}>
                <div className={styles['stu-db-attendance-donut-chart']} style={chartStyle}>
                    <div className={styles['stu-db-attendance-chart-center-text']}>
                        <div className={styles['stu-db-attendance-chart-center-value']}>{presentPerc}%</div>
                        <div className={styles['stu-db-attendance-chart-center-label']}>Present</div>
                    </div>
                </div>
            </div>
            <div className={styles['stu-db-attendance-details-wrapper']}>
                <div className={styles['stu-db-attendance-detail-item']}>
                    Present
                    <div className={`${styles['stu-db-attendance-detail-value']} ${styles['stu-db-attendance-present-value']}`}>{present}</div>
                </div>
                <div className={styles['stu-db-attendance-detail-item']}>
                    Absent
                    <div className={`${styles['stu-db-attendance-detail-value']} ${styles['stu-db-attendance-absent-value']}`}>{absent}</div>
                </div>
            </div>
        </div>
    );
};

export default function StudentDashboard({ onLogout, onViewChange }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  
  // ⚡ INSTANT: Initialize with best available cached data immediately (synchronous)
  const [studentData, setStudentData] = React.useState(() => {
    try {
      // Prefer completeStudentData.student if it exists, since it usually has profilePicURL
      const completeRaw = localStorage.getItem('completeStudentData');
      if (completeRaw) {
        const completeParsed = JSON.parse(completeRaw);
        if (completeParsed?.student) {
          console.log('⚡ Dashboard INIT: Loaded completeStudentData.student synchronously', {
            hasProfilePic: !!completeParsed.student.profilePicURL
          });
          return completeParsed.student;
        }
      }

      // Fallback: plain studentData
      const stored = localStorage.getItem('studentData');
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('⚡ Dashboard INIT: Loaded studentData synchronously', {
          hasProfilePic: !!parsed.profilePicURL
        });
        return parsed;
      }
    } catch (error) {
      console.error('❌ Dashboard INIT: Error loading student data:', error);
    }
    return null;
  });

  // ⚡ Listen for updates from background data fetch
  React.useEffect(() => {
    const handleProfileUpdate = (event) => {
      try {
        // Prefer explicit student objects from events; fall back carefully
        let updatedData = null;

        if (event?.detail?.student) {
          // Events like allDataPreloaded / studentDataUpdated may send { student, ... }
          updatedData = event.detail.student;
        } else if (event?.detail && typeof event.detail === 'object') {
          // Only treat bare detail as student data if it looks like a student
          const maybeStudent = event.detail;
          if (maybeStudent.regNo || maybeStudent._id || maybeStudent.profilePicURL) {
            updatedData = maybeStudent;
          }
        }

        // As a final fallback, consider localStorage, but only if it has some structure
        if (!updatedData) {
          const fromStorage = JSON.parse(localStorage.getItem('studentData') || 'null');
          if (fromStorage && (fromStorage.regNo || fromStorage._id || fromStorage.profilePicURL)) {
            updatedData = fromStorage;
          }
        }

        // If we still don't have usable data, do nothing to avoid nuking a good profile pic
        if (!updatedData) {
          console.log('⚠️ Dashboard: Ignoring profile event with no usable student data', {
            hasDetail: !!event?.detail
          });
          return;
        }

        console.log('🔄 Dashboard: Student data updated', {
          hasProfilePic: !!updatedData.profilePicURL
        });
        setStudentData(updatedData);
      } catch (error) {
        console.error('❌ Dashboard: Error updating student data:', error);
      }
    };
    
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('allDataPreloaded', handleProfileUpdate);
    window.addEventListener('studentDataUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('allDataPreloaded', handleProfileUpdate);
      window.removeEventListener('studentDataUpdated', handleProfileUpdate);
    };
  }, []);

  const handleViewChange = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
    setIsSidebarOpen(false);
  };

  return (
    <div className={styles['stu-db-container']}>
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={styles['stu-db-main']}>
        <Sidebar 
          isOpen={isSidebarOpen} 
          onLogout={onLogout} 
          onViewChange={handleViewChange} 
          currentView={'dashboard'}
          studentData={studentData}
        />
        <div className={styles['stu-db-dashboard-area']}>
          {/* College header */}
          <div className={styles['stu-db-college-header']}>
            <img src={ksrCollegeImage} alt="KSR College Logo" className={styles['stu-db-college-logo']} />
            <div className={styles['stu-db-college-name']}>
              K S R COLLEGE OF ENGINEERING (<span>Autonomous</span>) - 637215
            </div>
          </div>
          
          {/* Main Dashboard Grid */}
          <div className={styles['stu-db-dashboard-grid']}>
            
            {/* Row 1 - 3 Cards */}
            {/* Card 1: My Profile */}
            <div className={styles['stu-db-card']} onClick={() => handleViewChange('profile')}>
              <div className={styles['stu-db-card-icon']}>
                <img src={Profile} alt="My Profile" />
              </div>
              <h3 className={styles['stu-db-card-title']}>My Profile</h3>
              <p className={styles['stu-db-card-sub']}>View and update your<br />personal information</p>
            </div>

            {/* Card 2: Resume */}
            <div className={styles['stu-db-card']} onClick={() => handleViewChange('resume')}>
              <div className={styles['stu-db-card-icon']}>
                <img src={Resume} alt="Resume" />
              </div>
              <h3 className={styles['stu-db-card-title']}>Resume</h3>
              <p className={styles['stu-db-card-sub']}>Upload and analyze<br />your resume</p>
            </div>

            {/* Card 3: Achievements */}
            <div className={styles['stu-db-card']} onClick={() => handleViewChange('achievements')}>
              <div className={styles['stu-db-card-icon']}>
                <img src={certificateuploadicon} alt="Achievements" />
              </div>
              <h3 className={styles['stu-db-card-title']}>Achievements</h3>
              <p className={styles['stu-db-card-sub']}>Manage your certificates<br />and accomplishments</p>
            </div>

            {/* Row 2 - 2 Cards spanning different widths */}
            {/* Card 4: Attendance (spans 2 columns) */}
            <div className={`${styles['stu-db-card']} ${styles['stu-db-attendance-card']}`} onClick={() => handleViewChange('attendance')}>
              <h2 className={styles['stu-db-new-attendance-title']}>Attendance</h2>
              <AttendanceChart present={studentData?.attendancePresent || 0} absent={studentData?.attendanceAbsent || 0} />
            </div>

            {/* Card 5: Company Placement */}
            <div className={styles['stu-db-card']} onClick={() => handleViewChange('company')}>
              <div className={styles['stu-db-card-icon']}>
                <img src={totalpercentagestudenticon} alt="Company Placement" />
              </div>
              <h3 className={styles['stu-db-card-title']}>Company Placement</h3>
              <p className={styles['stu-db-card-sub']}>Track your placement<br />applications and status</p>
            </div>

          </div>
        </div>
      </div>
      {isSidebarOpen && <div className={styles['stu-db-overlay']} onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
  );
}