import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Adsidebar.module.css';
import AdDashboard from "../../assets/addashboardicon.svg";
import ManageStudents from "../../assets/adstuddbicon.svg";
import AdminCompanyProfileicon from "../../assets/adcompanyprofileicon.svg";
import AdminCompanydriveicon from "../../assets/adcompanydriveicon.svg";
import Adcertificate from "../../assets/adeligiblestudicon.svg";
import AdAttendance from "../../assets/adattendanceicon.svg";
import AdminPlacedStudentsicon from "../../assets/adplacedstudicon.svg";
import AdReportAnalysis from "../../assets/adreportanalysisicon.svg";
import AdAddBranch from "../../assets/adaddbranchicon.svg";
import AdProfileicon from "../../assets/adprofileicon.svg";
import AdminProfileGraduationcap from "../../assets/Admincapsidebar.svg";

// Navigation items are now in an array for easier management
const sidebarItems = [
  { icon: AdDashboard, text: 'Dashboard', view: 'admin-dashboard' },
  { icon: ManageStudents, text: 'Student Database', view: 'admin-student-database' },
  { icon: AdminCompanyProfileicon, text: 'Company Profile', view: 'admin-company-profile' },
  { icon: AdminCompanydriveicon, text: 'Company Drive', view: 'admin-company-drive' },
  { icon: Adcertificate, text: 'Eligible Students', view: 'admin-eligible-students' },
  { icon: AdAttendance, text: 'Attendance', view: 'admin-attendance' },
  { icon: AdminPlacedStudentsicon, text: 'Placed Students', view: 'admin-placed-students' },
  { icon: AdReportAnalysis, text: 'Report Analysis', view: 'admin-report-analysis-rarw' },
  { icon: AdAddBranch, text: 'Add Branch', view: 'admin-add-branch-main' },
];

const viewToPath = (view) => {
  switch (view) {
    case 'admin-dashboard':
      return '/admin-dashboard';
    case 'admin-student-database':
      return '/admin-student-database';
    case 'admin-company-profile':
      return '/admin-company-profile';
    case 'admin-company-drive':
      return '/admin-company-drive';
    case 'admin-eligible-students':
      return '/admin-eligible-students';
    case 'admin-attendance':
      return '/admin-attendance';
    case 'admin-placed-students':
      return '/admin-placed-students';
    case 'admin-report-analysis-rarw':
      return '/admin-report-analysis-rarw';
    case 'admin-add-branch-main':
      return '/admin-add-branch-main';
    case 'admin-profile-main':
      return '/admin-profile-main';
    default:
      return '/';
  }
};

const Adsidebar = ({ isOpen, onLogout }) => {
  return (
    <div className={`${styles.adsidebar} ${isOpen ? styles.open : ''}`}>
      <div className={styles['ad-user-info']}>
        <div className={styles['ad-user-details']}>
          <img src={AdminProfileGraduationcap} alt="Coordinator" className={styles['admin-cap']} />
          <div className={styles['ad-user-text']}>
            <span>Admin</span>
          </div>
        </div>
      </div>

      <nav className={styles['ad-nav']}>
        <div className={styles['ad-nav-section']}>
          {sidebarItems.map((item) => (
            <NavLink
              key={item.text}
              to={viewToPath(item.view)}
              className={({ isActive }) => `${styles['ad-nav-item']} ${isActive ? styles.selected : ''}`}
            >
              <img src={item.icon} alt={item.text} />
              <span className={styles['ad-nav-text']}>{item.text}</span>
            </NavLink>
          ))}
        </div>

        <div className={styles['ad-nav-divider']}></div>

        <NavLink
          to={viewToPath('admin-profile-main')}
          className={({ isActive }) => `${styles['ad-nav-item']} ${isActive ? styles.selected : ''}`}
        >
          <img src={AdProfileicon} alt="Profile" />
          <span className={styles['ad-nav-text']}>Profile</span>
        </NavLink>

        <button className={styles['ad-logout-btn']} onClick={onLogout}>
          Logout
        </button>
      </nav>
    </div>
  );
};

export default Adsidebar;