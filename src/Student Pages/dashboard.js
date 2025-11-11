import React from "react";
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';
import ksrCollegeImage from "../assets/ksrCollegeImage.jpg";
import Profile from "../assets/totalpercentagestudenticon.png";
import totalpercentagestudenticon from "../assets/UpcomingDriveIcon.svg";
import Resume from "../assets/UploadResumeIcon.svg";
import certificateuploadicon from "../assets/UploadCertificatecardicon.svg";
import "./dashboard.css";

// Attendance Chart Component
const AttendanceChart = ({ present, absent }) => {
    const total = present + absent;
    const presentPerc = total > 0 ? Math.round((present / total) * 100) : 0;
    const chartStyle = {
        background: `conic-gradient(from 180deg, #00C495 0% ${presentPerc}%, #FF6B6B ${presentPerc}% 100%)`,
    };

    return (
        <div className="stu-db-attendance-card-content">
            <div className="stu-db-attendance-chart-wrapper">
                <div className="stu-db-attendance-donut-chart" style={chartStyle}>
                    <div className="stu-db-attendance-chart-center-text">
                        <div className="stu-db-attendance-chart-center-value">{presentPerc}%</div>
                        <div className="stu-db-attendance-chart-center-label">Present</div>
                    </div>
                </div>
            </div>
            <div className="stu-db-attendance-details-wrapper">
                <div className="stu-db-attendance-detail-item">
                    Present
                    <div className="stu-db-attendance-detail-value stu-db-attendance-present-value">{present}</div>
                </div>
                <div className="stu-db-attendance-detail-item">
                    Absent
                    <div className="stu-db-attendance-detail-value stu-db-attendance-absent-value">{absent}</div>
                </div>
            </div>
        </div>
    );
};

export default function StudentDashboard({ onLogout, onViewChange }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [studentData, setStudentData] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('studentData') || 'null');
    } catch (error) {
      return null;
    }
  });

  // Load student data for sidebar and dispatch immediate profile update
  React.useEffect(() => {
    const handleProfileUpdate = () => {
      try {
        const updatedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (updatedStudentData) {
          setStudentData(updatedStudentData);
        }
      } catch (error) {
        console.error('Error updating student data for sidebar:', error);
      }
    };
    
    // ⚡ INSTANT: Dispatch profile update immediately on dashboard load
    const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
    if (storedStudentData && storedStudentData.profilePicURL) {
      console.log('🚀 Dashboard: Dispatching immediate profile update for sidebar');
      window.dispatchEvent(new CustomEvent('profileUpdated', { 
        detail: { 
          profilePicURL: storedStudentData.profilePicURL,
          studentData: storedStudentData 
        } 
      }));
    }
    
    window.addEventListener('storage', handleProfileUpdate);
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    return () => {
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const handleViewChange = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
    setIsSidebarOpen(false);
  };

  return (
    <div className="stu-db-container">
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className="stu-db-main">
        <Sidebar 
          isOpen={isSidebarOpen} 
          onLogout={onLogout} 
          onViewChange={handleViewChange} 
          currentView={'dashboard'}
          studentData={studentData}
        />
        <div className="stu-db-dashboard-area">
          {/* College header */}
          <div className="stu-db-college-header">
            <img src={ksrCollegeImage} alt="KSR College Logo" className="stu-db-college-logo" />
            <div className="stu-db-college-name">
              K S R COLLEGE OF ENGINEERING (<span>Autonomous</span>) - 637215
            </div>
          </div>
          
          {/* Main Dashboard Grid */}
          <div className="stu-db-dashboard-grid">
            
            {/* Row 1 - 3 Cards */}
            {/* Card 1: My Profile */}
            <div className="stu-db-card" onClick={() => handleViewChange('profile')}>
              <div className="stu-db-card-icon">
                <img src={Profile} alt="My Profile" />
              </div>
              <h3 className="stu-db-card-title">My Profile</h3>
              <p className="stu-db-card-sub">View and update your<br />personal information</p>
            </div>

            {/* Card 2: Resume */}
            <div className="stu-db-card" onClick={() => handleViewChange('resume')}>
              <div className="stu-db-card-icon">
                <img src={Resume} alt="Resume" />
              </div>
              <h3 className="stu-db-card-title">Resume</h3>
              <p className="stu-db-card-sub">Upload and analyze<br />your resume</p>
            </div>

            {/* Card 3: Achievements */}
            <div className="stu-db-card" onClick={() => handleViewChange('achievements')}>
              <div className="stu-db-card-icon">
                <img src={certificateuploadicon} alt="Achievements" />
              </div>
              <h3 className="stu-db-card-title">Achievements</h3>
              <p className="stu-db-card-sub">Manage your certificates<br />and accomplishments</p>
            </div>

            {/* Row 2 - 2 Cards spanning different widths */}
            {/* Card 4: Attendance (spans 2 columns) */}
            <div className="stu-db-card stu-db-attendance-card" onClick={() => handleViewChange('attendance')}>
              <h2 className="stu-db-new-attendance-title">Attendance</h2>
              <AttendanceChart present={studentData?.attendancePresent || 0} absent={studentData?.attendanceAbsent || 0} />
            </div>

            {/* Card 5: Company Placement */}
            <div className="stu-db-card" onClick={() => handleViewChange('company')}>
              <div className="stu-db-card-icon">
                <img src={totalpercentagestudenticon} alt="Company Placement" />
              </div>
              <h3 className="stu-db-card-title">Company Placement</h3>
              <p className="stu-db-card-sub">Track your placement<br />applications and status</p>
            </div>

          </div>
        </div>
      </div>
      {isSidebarOpen && <div className="stu-db-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
  );
}


