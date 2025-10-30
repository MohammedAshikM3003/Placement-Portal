import React from "react";
import Coordmyacc from "../assets/Coordmyacc.svg";
import UpcomingDriveIcon from "../assets/UpcomingDriveIcon.svg";
import Reportdashbord from "../assets/Reportdashboard.svg";
import uploadcertificateicon from "../assets/uploadcertificateicon.svg";
import AdminBrowseStudenticon from "../assets/AdminBrowseStudenticon.svg";
import ksrCollegeImage from "../assets/ksrCollegeImage.jpg";
import "./Coo_Dashboard.css";

// ====================================================================
// 1. THE ATTENDANCE CHART COMPONENT
// This component creates the visual donut chart and the details.
// ====================================================================
const ModernAttendanceChart = ({ present, absent }) => {
    const total = present + absent;
    const presentPerc = total > 0 ? Math.round((present / total) * 100) : 0;
    const chartStyle = {
        background: `conic-gradient(from 180deg, #00C495 0% ${presentPerc}%, #FF6B6B ${presentPerc}% 100%)`,
    };

    return (
        <div className="co-db-attendance-card-content">
            <div className="co-db-attendance-chart-wrapper">
                <div className="co-db-attendance-donut-chart" style={chartStyle}>
                    <div className="co-db-attendance-chart-center-text">
                        <div className="co-db-attendance-chart-center-value">{presentPerc}%</div>
                        <div className="co-db-attendance-chart-center-label">Present</div>
                    </div>
                </div>
            </div>
            <div className="co-db-attendance-details-wrapper">
                <div className="co-db-attendance-detail-item">
                    Present
                    <div className="co-db-attendance-detail-value co-db-attendance-present-value">{present}</div>
                </div>
                <div className="co-db-attendance-detail-item">
                    Absent
                    <div className="co-db-attendance-detail-value co-db-attendance-absent-value">{absent}</div>
                </div>
            </div>
        </div>
    );
};

function CoordinatorDashboard({ onLogout, onViewChange }) {
  const handleCardClick = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  return (
    <div className="co-db-dashboard-content">
      {/* College header */}
      <div className="co-db-college-header">
        <img src={ksrCollegeImage} alt="KSR College Logo" className="co-db-college-logo" />
        <div className="co-db-college-name">
          K S R COLLEGE OF ENGINEERING (<span>Autonomous</span>) - 637215
        </div>
      </div>
      
      {/* Main Dashboard Grid - REORDERED */}
      <div className="co-db-dashboard-grid">
        
        {/* --- ROW 1 --- */}
        {/* Card 1: Takes 1 column */}
        <div className="co-db-card co-db-card-browse" onClick={() => handleCardClick('manage-students')} style={{ cursor: 'pointer' }}>
          <div className="co-db-card-icon">
            <img src={AdminBrowseStudenticon} alt="Browse Students" />
          </div>
          <h3 className="co-db-card-title">Browse Students</h3>
          <p className="co-db-card-sub">Filter, sort and manage<br />Student records</p>
        </div>

        {/* Card 2: Takes 1 column */}
        <div className="co-db-card co-db-card-drive" onClick={() => handleCardClick('company-drive')} style={{ cursor: 'pointer' }}>
          <div className="co-db-card-icon">
            <img src={UpcomingDriveIcon} alt="Upcoming Drive" />
          </div>
          <h3 className="co-db-card-title">Upcoming Drive</h3>
          <div className="co-db-drive-details">
            <p><strong>Company Name:</strong> Infosys</p>
            <p><strong>Date:</strong> 20/08/2025</p>
            <p><strong>Role:</strong> Testing</p>
            <p><strong>Eligibility:</strong></p>
          </div>
        </div>

        {/* Card 3: Takes 2 columns */}
        <div className="co-db-card co-db-attendance-card">
          <h2 className="co-db-new-attendance-title">Attendance</h2>
          <ModernAttendanceChart present={49} absent={51} />
        </div>

        {/* --- ROW 2 --- */}
        {/* Card 4: Takes 2 columns */}
        <div className="co-db-card co-db-card-certificates" onClick={() => handleCardClick('certificate-verification')} style={{ cursor: 'pointer' }}>
          <div className="co-db-card-icon">
            <img src={uploadcertificateicon} alt="Upload Certificate"/>
          </div>
          <div className="co-db-card-content">
            <h3 className="co-db-card-title">Certificates Approval</h3>
            <p className="co-db-card-sub">Monitor Certificate submissions and<br />approvals for timely validation</p>
          </div>
        </div>
        
        {/* Card 5: Takes 1 column */}
        <div className="co-db-card" onClick={() => handleCardClick('manage-students-semester')} style={{ cursor: 'pointer' }}>
          <div className="co-db-card-icon">
            <img src={Reportdashbord} alt="Semester Icon" />
          </div>
          <h3 className="co-db-card-title">Semester</h3>
          <p className="co-db-card-sub">Click to update semester CGPA here</p>
        </div>

        {/* Card 6: Takes 1 column */}
        <div className="co-db-card co-db-account-card" onClick={() => handleCardClick('profile')} style={{ cursor: 'pointer' }}>
          <div className="co-db-card-icon"><img src={Coordmyacc} alt="My Account" /></div>
          <h3 className="co-db-card-title">My Account</h3>
          <p className="co-db-card-sub">Settings</p>
        </div>

      </div>
    </div>
  );
}

export default CoordinatorDashboard;