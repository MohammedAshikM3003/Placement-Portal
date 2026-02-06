import React, { useState } from "react";
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import styles from "./Coo_Dashboard.module.css";

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
const ModernAttendanceChart = ({ present, absent }) => {
    const total = present + absent;
    const presentPerc = total > 0 ? Math.round((present / total) * 100) : 0;
    const chartStyle = {
        background: `conic-gradient(from 180deg, #00C495 0% ${presentPerc}%, #FF6B6B ${presentPerc}% 100%)`,
    };

    return (
        <div className={styles["co-db-attendance-card-content"]}>
            <div className={styles["co-db-attendance-chart-wrapper"]}>
                <div className={styles["co-db-attendance-donut-chart"]} style={chartStyle}>
                    <div className={styles["co-db-attendance-chart-center-text"]}>
                        <div className={styles["co-db-attendance-chart-center-value"]}>{presentPerc}%</div>
                        <div className={styles["co-db-attendance-chart-center-label"]}>Present</div>
                    </div>
                </div>
            </div>
            <div className={styles["co-db-attendance-details-wrapper"]}>
                <div className={styles["co-db-attendance-detail-item"]}>
                    Present
                    <div
                        className={cx(
                            styles["co-db-attendance-detail-value"],
                            styles["co-db-attendance-present-value"]
                        )}
                    >
                        {present}
                    </div>
                </div>
                <div className={styles["co-db-attendance-detail-item"]}>
                    Absent
                    <div
                        className={cx(
                            styles["co-db-attendance-detail-value"],
                            styles["co-db-attendance-absent-value"]
                        )}
                    >
                        {absent}
                    </div>
                </div>
            </div>
        </div>
    );
};


function CoordinatorDashboard({ onLogout, onViewChange }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collegeLogoUrl, setCollegeLogoUrl] = useState(ksrCollegeImage); // Default fallback

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
            <p><strong>Company Name:</strong> Infosys</p>
            <p><strong>Date:</strong> 20/08/2025</p>
            <p><strong>Role:</strong> Testing</p>
            <p><strong>Eligibility:</strong></p>
          </div>
        </div>

        {/* Card 3: Takes 2 columns */}
        <div className={cx(styles["co-db-card"], styles["co-db-attendance-card"])}>
          <h2 className={styles["co-db-new-attendance-title"]}>Attendance</h2>
          <ModernAttendanceChart present={49} absent={51} />
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