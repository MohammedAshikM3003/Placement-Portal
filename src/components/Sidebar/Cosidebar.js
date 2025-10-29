import React from 'react';
import './Cosidebar.css';

// Assets
import Coordinatorcap from '../../assets/Coordinatorcap.svg';
import CoDashboard from '../../assets/CoDashboard.svg';
import ManageStudents from "../../assets/ManageStudents.svg";
import AdminCompsnyProfileicon from "../../assets/CompanyProfileicon.svg";
import AdminCompanydriveicon from "../../assets/CompanyDriveicon.svg";
import Coordcertificate from "../../assets/CertificateVerrificationicon.svg";
import CoordEligiblestudent from "../../assets/CoordEligiblestudent.svg";
import AdminAttendanceicon from "../../assets/AdminAttendanceicon.svg";
import AdminPlacedStudentsicon from "../../assets/PlacedStudentIcon.svg";
import AdminResourceAnalysisicon from "../../assets/Reportanalysisicon.svg";
import AdminProfileicon from "../../assets/AdminProfileicon.svg";

// Navigation items are now in an array for easier management
const sidebarItems = [
  { icon: CoDashboard, text: 'Dashboard', view: 'dashboard' },
  { icon: ManageStudents, text: 'Manage Students', view: 'manage-students' },
  { icon: AdminCompsnyProfileicon, text: 'Company Profile', view: 'company-profile' },
  { icon: AdminCompanydriveicon, text: 'Company Drive', view: 'company-drive' },
  { icon: Coordcertificate, text: 'Certificate Verification', view: 'certificate-verification' },
  { icon: CoordEligiblestudent, text: 'Eligible Students', view: 'eligible-students' },
  { icon: AdminAttendanceicon, text: 'Attendance', view: 'attendance' },
  { icon: AdminPlacedStudentsicon, text: 'Placed Students', view: 'placed-students' },
  { icon: AdminResourceAnalysisicon, text: 'Report Analysis', view: 'report-analysis' },
];


const Cosidebar = ({ isOpen, onLogout, currentView, onViewChange }) => {
  const coordinatorUsername = localStorage.getItem('coordinatorUsername') || 'Coordinator';
  
  const handleViewChange = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  return (
    // The main container now responds to the 'isOpen' prop for mobile view
    <div className={`cosidebar ${isOpen ? 'open' : ''}`}>
      <div className="user-info">
        <div className="user-details">
          <img src={Coordinatorcap} alt="Coordinator" className="coordinator-cap" />
          <div className="user-text">
            <span>{coordinatorUsername}</span>
          </div>
        </div>
      </div>

      <nav className="nav">
        <div className="nav-section">
          {/* Mapping over the array to create navigation items */}
          {sidebarItems.map((item) => (
            <button
              key={item.text}
              onClick={() => handleViewChange(item.view)}
              className={`nav-item${currentView === item.view ? ' selected' : ''}`}
              title=""
            >
              <img src={item.icon} alt="" />
              <span className="nav-text">{item.text}</span>
            </button>
          ))}
        </div>

        <div className="nav-divider"></div>
        
        {/* Profile link */}
        <button
          onClick={() => handleViewChange('profile')}
          className={`nav-item${currentView === 'profile' ? ' selected' : ''}`}
          title=""
        >
          <img src={AdminProfileicon} alt="" />
          <span className="nav-text">Profile</span>
        </button>
        
        {/* Logout button */}
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </nav>
    </div>
  );
};

export default Cosidebar;