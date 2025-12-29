import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Viewicon from "../assets/Viewicon.svg";
import PlacedStudentsCap from '../assets/AdminEligiblestudapp.svg';
import AdminBrowseStudenticon from "../assets/AdminBrowseStudenticon.png";
import AdNavbar from "../components/Navbar/Adnavbar.js";
import AdSidebar from "../components/Sidebar/Adsidebar.js";
import styles from './AdminEligibleStudents.module.css';

function AdminEsstudapp() {
  const navigate = useNavigate();
  const tableRef = useRef(null);
  
  // Navigate to student application page
  const handleStudentApplicationClick = () => {
    navigate('/admin-student-application');
  };

  return (
    <div className={styles['Admin-es-main-wrapper']}>
      <AdNavbar />
      
      <div className={styles['Admin-es-layout-container']}>
        <AdSidebar />
        
        <main className={styles['Admin-es-dashboard-area']}>
          
          <div className={styles['Admin-es-summary-cards']}>
            {/* Student Database Card */}
            <div className={styles['Admin-es-summary-card']}>
              <div className={styles['Admin-es-summary-card-icon']}>
                <img src={AdminBrowseStudenticon} alt="Database" style={{ width: '75px' }} />
              </div>
              <div className={styles['Admin-es-summary-card-title-1']}>Student Database</div>
              <div className={styles['Admin-es-summary-card-desc-1']}>Filter and manage records</div>
            </div>

            {/* Filter Section Card */}
            <div className={styles['Admin-es-summary-card']}>
              <h3 style={{color: '#4EA24E'}}>CSE Students</h3>
              {/* Add your filter inputs here as per previous logic */}
            </div>

            {/* Application Card */}
            <div className={styles['Admin-es-summary-card']} onClick={handleStudentApplicationClick} style={{ cursor: 'pointer' }}>
              <div className={styles['Admin-es-summary-card-icon']}>
                <img src={PlacedStudentsCap} alt="Application" style={{ width: '75px' }} />
              </div>
              <div className={styles['Admin-es-summary-card-title-2']}>Student Application</div>
              <div className={styles['Admin-es-summary-card-desc-2']}>Attend the Drive</div>
            </div>
          </div>

          {/* Eligible Students Table */}
          <div className={styles['Admin-es-company-profile']}>
            <div className={styles['Admin-es-profile-header']}>
              <div className={styles['Admin-es-profile-title']}>ELIGIBLE STUDENTS</div>
            </div>
            
            <div className={styles['Admin-es-table-container']}>
              <table className={styles['Admin-es-profile-table']} ref={tableRef}>
                <thead>
                  <tr>
                    <th className={styles['Admin-es-th']}>S.No</th>
                    <th className={styles['Admin-es-th']}>Student Name</th>
                    <th className={styles['Admin-es-th']}>Register Number</th>
                    <th className={styles['Admin-es-th']}>Batch</th>
                    <th className={styles['Admin-es-th']}>CGPA</th>
                    <th className={styles['Admin-es-th']}>View</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Map through your studentData here */}
                  <tr>
                    <td className={styles['Admin-es-td']}>1</td>
                    <td className={styles['Admin-es-td']}>Sample Student</td>
                    <td className={styles['Admin-es-td']}>7315000000</td>
                    <td className={styles['Admin-es-td']}>2023-2027</td>
                    <td className={styles['Admin-es-td']}>9.1</td>
                    <td className={styles['Admin-es-td']}>
                       <img src={Viewicon} className={styles['Admin-es-view-icon']} alt="View" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminEsstudapp;