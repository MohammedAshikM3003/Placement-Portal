import React, { useState } from 'react';
import Navbar from './components/Navbar/Conavbar.js';
import Sidebar from './components/Sidebar/Cosidebar.js';
import './CoordinatorMain.css';

// Import all coordinator pages
import Dashboard from './Coordinator Pages/Coo_Dashboard.js';
import ManageStudents from './Coordinator Pages/ManageStudents.js';
import CompanyProfile from './Coordinator Pages/Companyprofile.js';
import CompanyDrive from './Coordinator Pages/CompanyDrive.js';
import CertificateVerification from './Coordinator Pages/CertificateVerification.js';
import EligibleStudents from './Coordinator Pages/CoEligiblestudents.js';
import Attendance from './Coordinator Pages/Attendance.js';
import PlacedStudents from './Coordinator Pages/PlacedStudents.js';
import ReportAnalysis from './Coordinator Pages/ReportAnalysismain.js';
import Profile from './Coordinator Pages/Profile.js';
import ManageStudentsSemester from './Coordinator Pages/ManageStudentsSemester.js';
import ManageStudentsProfile from './Coordinator Pages/ManageStudentsProfile.js';
import CooViewpage from './Coordinator Pages/CooViewpage.js';

const CoordinatorMain = ({ onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  const handleViewChange = (view) => {
    setCurrentView(view);
    setSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onLogout={onLogout} currentView={currentView} onViewChange={handleViewChange} />;
      case 'manage-students':
        return <ManageStudents onLogout={onLogout} currentView={currentView} onViewChange={handleViewChange} />;
      case 'company-profile':
        return <CompanyProfile onLogout={onLogout} currentView={currentView} onViewChange={handleViewChange} />;
      case 'company-drive':
        return <CompanyDrive onLogout={onLogout} currentView={currentView} onViewChange={handleViewChange} />;
      case 'certificate-verification':
        return <CertificateVerification onLogout={onLogout} currentView={currentView} onViewChange={handleViewChange} />;
      case 'eligible-students':
        return <EligibleStudents onLogout={onLogout} currentView={currentView} onViewChange={handleViewChange} />;
      case 'attendance':
        return <Attendance onLogout={onLogout} currentView={currentView} onViewChange={handleViewChange} />;
      case 'placed-students':
        return <PlacedStudents onLogout={onLogout} currentView={currentView} onViewChange={handleViewChange} />;
      case 'report-analysis':
        return <ReportAnalysis onLogout={onLogout} currentView={currentView} onViewChange={handleViewChange} />;
      case 'profile':
        return <Profile onLogout={onLogout} currentView={currentView} onViewChange={handleViewChange} />;
      case 'manage-students-semester':
        return <ManageStudentsSemester onLogout={onLogout} currentView={currentView} onViewChange={handleViewChange} />;
      case 'manage-students-profile':
        return <ManageStudentsProfile onLogout={onLogout} currentView={currentView} onViewChange={handleViewChange} />;
      case 'coo-view-page':
        return <CooViewpage onLogout={onLogout} currentView={currentView} onViewChange={handleViewChange} />;
      default:
        return <Dashboard onLogout={onLogout} currentView={currentView} onViewChange={handleViewChange} />;
    }
  };

  return (
    <div className="coordinator-main-wrapper">
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="coordinator-main-layout">
        <Sidebar
          isOpen={sidebarOpen}
          onLogout={onLogout}
          currentView={currentView}
          onViewChange={handleViewChange}
        />
        {/* Mobile overlay */}
        {sidebarOpen && <div className="coordinator-overlay" onClick={() => setSidebarOpen(false)}></div>}
        <div className="coordinator-content-area">
          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorMain;
