import React, { useState } from "react";
import Adminmyacc from "../assets/Adminmyacc.svg";
import Adminaddnewcompany from "../assets/Adminaddnewcompany.svg";
import AdminAddBranch from "../assets/AdminAddBranchIcon.svg";
import Adminschedulenewdrive from "../assets/Adminschedulenewdrive.svg";
import Adminbrowsestudents from "../assets/Adminbrowsestudents.svg";
import Adminksrlogo from "../assets/Adminksrlogo.svg";
import AdNavbar from "../components/Navbar/Adnavbar.js";
import AdSidebar from "../components/Sidebar/Adsidebar.js";
// IMPORT THE MODULE CSS
import styles from "./Admin_Dashboard.module.css";

// ====================================================================
// ATTENDANCE CHART COMPONENT
// ====================================================================
const ModernAttendanceChart = ({ present, absent }) => {
    const total = present + absent;
    const presentPerc = total > 0 ? Math.round((present / total) * 100) : 0;
    
    const chartStyle = {
        background: `conic-gradient(from 180deg, #00C495 0% ${presentPerc}%, #FF6B6B ${presentPerc}% 100%)`,
    };

    return (
        <div className={styles['ad-db-attendance-card-content']}>
            <div className={styles['ad-db-attendance-chart-wrapper']}>
                <div className={styles['ad-db-attendance-donut-chart']} style={chartStyle}>
                    <div className={styles['ad-db-attendance-chart-center-text']}>
                        <div className={styles['ad-db-attendance-chart-center-value']}>{presentPerc}%</div>
                        <div className={styles['ad-db-attendance-chart-center-label']}>Present</div>
                    </div>
                </div>
            </div>
            <div className={styles['ad-db-attendance-details-wrapper']}>
                <div className={styles['ad-db-attendance-detail-item']}>
                    Present
                    {/* Use template literals for multiple classes */}
                    <div className={`${styles['ad-db-attendance-detail-value']} ${styles['ad-db-attendance-present-value']}`}>
                        {present}
                    </div>
                </div>
                <div className={styles['ad-db-attendance-detail-item']}>
                    Absent
                    <div className={`${styles['ad-db-attendance-detail-value']} ${styles['ad-db-attendance-absent-value']}`}>
                        {absent}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ====================================================================
// MAIN DASHBOARD COMPONENT
// ====================================================================
function AdminDashboard({ onLogout, currentView, onViewChange }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    // Use bracket notation for classes with hyphens: styles['class-name']
    <div className={styles['admin-dashboard-page']}>
       <AdNavbar onToggleSidebar={toggleSidebar} />
       <AdSidebar isOpen={isSidebarOpen} onLogout={onLogout} />

      <div className={styles['ad-db-dashboard-area']} >
      
      {/* HEADER */}
      <div className={styles['ad-db-college-header']}>
        <img src={Adminksrlogo} alt="KSR College Logo" className={styles['ad-db-college-logo']} />
        <div className={styles['ad-db-college-name']}>
          K S R COLLEGE OF ENGINEERING (<span>Autonomous</span>) - 637215
        </div>
      </div>
      
      {/* DASHBOARD GRID */}
      <div className={styles['ad-db-dashboard-grid']}>
        
        {/* ROW 1 */}
        {/* Card 1: Browse Students */}
        <div className={`${styles['ad-db-card']} ${styles['ad-db-card-browse']}`}>
          <div className={styles['ad-db-card-icon']}>
            <img src={Adminbrowsestudents} alt="Browse Students" />
          </div>
          <h3 className={styles['ad-db-card-title']}>Browse Students</h3>
          <p className={styles['ad-db-card-sub']}>Filter, sort and manage<br />Student records</p>
        </div>

        {/* Card 2: Add New Company */}
        <div className={`${styles['ad-db-card']} ${styles['ad-db-card-drive']}`}>
          <div className={styles['ad-db-card-icon']}>
            <img src={Adminaddnewcompany} alt="Upcoming Drive" />
          </div>
          <h3 className={styles['ad-db-card-title']}>Add New Company</h3>
          <div className={styles['ad-db-drive-details']}>
            <p className={styles['ad-db-new-drive-details']}>Register new companies for <br />placement drives</p>
          </div>
        </div>

        {/* Card 3: Attendance Chart */}
        <div className={`${styles['ad-db-card']} ${styles['ad-db-attendance-card']}`}>
          <h2 className={styles['ad-db-new-attendance-title']}>Attendance</h2>
          <ModernAttendanceChart present={49} absent={51} />
        </div>

        {/* ROW 2 */}
        {/* Card 4: Schedule Drive */}
        <div className={`${styles['ad-db-card']} ${styles['ad-db-card-certificates']}`}>
          <div className={styles['ad-db-card-icon']}>
            <img src={Adminschedulenewdrive} alt="Upload Certificate"/>
          </div>
          <div className={styles['ad-db-card-content']}>
            <h3 className={styles['ad-db-card-title']}>Schedule New Drive</h3>
            <p className={styles['ad-db-card-sub']}>organies and manage upcoming companies</p>
          </div>
        </div>
        
        {/* Card 5: Add Branch */}
        <div className={styles['ad-db-card']}>
          <div className={styles['ad-db-card-icon']}>
            <img src={AdminAddBranch} alt="Semester Icon" />
          </div>
          <h3 className={styles['ad-db-card-title']}> Add Branch</h3>
          <p className={styles['ad-db-card-sub']}>Create New Branch</p>
        </div>

        {/* Card 6: My Account */}
        <div className={`${styles['ad-db-card']} ${styles['ad-db-account-card']}`}>
          <div className={styles['ad-db-card-icon']}><img src={Adminmyacc} alt="My Account" /></div>
          <h3 className={styles['ad-db-card-title']}>My Account</h3>
          <p className={styles['ad-db-card-sub']}>Settings</p>
        </div>

      </div>
    </div>
    </div>
  );
}

export default AdminDashboard;