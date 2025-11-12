import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import RegistrationDebug from "./components/RegistrationDebug.js";
import AnimatedLoader from "./components/AnimatedLoader.js";

// Import lightweight components directly
import LandingPage from "./LandingPage.js";
import PlacementPortalLogin from "./mainlogin.js";
import MainSignUp from "./MainSingUp.js";
import MainRegistration from "./MainRegistration.js";
import CoordinatorAccess from "./CoordinatorAccess.js";
// import CoordinatorMain from "./CoordinatorMain.js"; // Unused import

// Lazy load Student components
const PlacementPortalDashboard = lazy(() => import("./Student Pages/dashboard.js"));
const Resume = lazy(() => import("./Student Pages/resume.js"));
const Attendance = lazy(() => import("./Student Pages/Attendance.js"));
const Achievements = lazy(() => import("./Student Pages/achievements.js"));
const Company = lazy(() => import("./Student Pages/company.js"));
const StuProfile = lazy(() => import("./Student Pages/StuProfile.js"));

// Lazy load Coordinator components
const CooDashboard = lazy(() => import("./Coordinator Pages/Coo_Dashboard.js"));
const ManageStudents = lazy(() => import("./Coordinator Pages/ManageStudents.js"));
const CompanyProfile = lazy(() => import("./Coordinator Pages/Companyprofile.js"));
const CompanyDrive = lazy(() => import("./Coordinator Pages/CompanyDrive.js"));
const CertificateVerification = lazy(() => import("./Coordinator Pages/CertificateVerification.js"));
const EligibleStudents = lazy(() => import("./Coordinator Pages/CoEligiblestudents.js"));
const CooAttendance = lazy(() => import("./Coordinator Pages/Attendance.js"));
const PlacedStudents = lazy(() => import("./Coordinator Pages/PlacedStudents.js"));
const ReportAnalysis = lazy(() => import("./Coordinator Pages/ReportAnalysismain.js"));
const ReportAnalysisCW = lazy(() => import("./Coordinator Pages/ReportAnalysisCW.js"));
const ReportAnalysisSW = lazy(() => import("./Coordinator Pages/ReportAnalysisSW.js"));
const CooProfile = lazy(() => import("./Coordinator Pages/Profile.js"));
const ManageStudentsSemester = lazy(() => import("./Coordinator Pages/ManageStudentsSemester.js"));
const ManageStudentsProfile = lazy(() => import("./Coordinator Pages/ManageStudentsProfile.js"));
const CooViewpage = lazy(() => import("./Coordinator Pages/CooViewpage.js"));
const CooViewMS = lazy(() => import("./Coordinator Pages/CooViewMS.js"));
const CooViewPS = lazy(() => import("./Coordinator Pages/CooViewPS.js"));

// Protected Routes Component using AuthContext
function AppRoutes() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();

  // CRITICAL: If the app is checking authentication (loading state),
  // show a full-page loading spinner. Do NOT render Dashboard or Sidebar yet.
  if (isLoading) {
    return <LoadingSpinner message="Authenticating..." />;
  }

  // Student logout handler
  const handleStudentLogout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('studentData');
      localStorage.removeItem('isLoggedIn');
      navigate("/");
    } catch (error) {
      console.error('Logout error:', error);
      navigate("/");
    }
  };

  // Coordinator logout handler (for coordinator pages)
  const handleCoordinatorLogout = () => {
    console.log('Coordinator logout clicked');
    navigate("/");
  };

  // Coordinator view change handler
  const handleCoordinatorViewChange = (view) => {
    console.log('Coordinator view change:', view);
    navigate(`/coordinator/${view}`);
  };

  const handleLogin = async (regNo, dob) => {
    // This function is called after successful authentication
    console.log('Login successful for:', regNo);
    
    try {
      // Initialize all student data for all pages
      const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (studentData && studentData._id) {
        console.log('🚀 INITIALIZING: All student data after login...');
        const fastDataService = (await import('./services/fastDataService.js')).default;
        
        // ⚡ HYPER-FAST: Preload ALL data immediately
        await Promise.all([
          fastDataService.initializeAllStudentData(studentData._id),
          fastDataService.preloadAllData(studentData._id)
        ]);
        
        console.log('✅ ALL STUDENT DATA INITIALIZED & PRELOADED FOR INSTANT ACCESS');
      }
    } catch (error) {
      console.error('❌ Failed to initialize student data after login:', error);
      // Don't block login process, just log the error
    }
  };

  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('studentData');
      localStorage.removeItem('isLoggedIn');
      navigate("/"); // Redirect to landing page on logout
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handlers for navigation
  const handleViewChange = (view) => {
    // You can use a switch or if/else here to navigate to the correct route
    navigate(`/${view}`);
  };

  const handleRedirectToLogin = () => {
    localStorage.removeItem('isLoggedIn');
    navigate("/mainlogin");
  };

  const handleStartRegistration = () => {
    navigate("/registration");
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return <AnimatedLoader />;
  }

  return (
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/registration-debug" element={<RegistrationDebug />} />
          <Route path="/debug-auth" element={
            <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
              <h2 style={{ color: '#333', marginBottom: '20px' }}>Debug Authentication</h2>
              
              <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <p><strong>isLoggedIn:</strong> {localStorage.getItem('isLoggedIn')}</p>
                <p><strong>studentData:</strong></p>
                <pre style={{ backgroundColor: '#f8f8f8', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
                  {JSON.stringify(JSON.parse(localStorage.getItem('studentData') || 'null'), null, 2)}
                </pre>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = '/';
                  }}
                  style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#dc3545', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Clear localStorage & Go Home
                </button>
                
                <button 
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#007bff', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Clear Data & Reload
                </button>
                
                <button 
                  onClick={() => {
                    console.log('Current localStorage:', localStorage);
                    alert('Check console for localStorage data');
                  }}
                  style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Check localStorage
                </button>
              </div>
            </div>
          } />
      <Route 
        path="/mainlogin" 
        element={<PlacementPortalLogin onLogin={handleLogin} onNavigateToSignUp={() => navigate("/signup")} />} 
      />
      <Route 
        path="/signup" 
        element={<MainSignUp onNavigateToLogin={() => navigate("/mainlogin")} onStartRegistration={handleStartRegistration} />} 
      />
      <Route 
        path="/registration" 
        element={<MainRegistration onNavigateToLogin={handleRedirectToLogin} />} 
      />
      <Route 
        path="/coordinator" 
        element={<CoordinatorAccess />} 
      />

      {/* Protected Student Routes - Only render if authenticated */}
      {isAuthenticated ? (
        <>
          <Route path="/dashboard" element={
            <Suspense fallback={<AnimatedLoader />}>
              <PlacementPortalDashboard onLogout={handleStudentLogout} userEmail={user?.email} onViewChange={handleViewChange} />
            </Suspense>
          } />
          <Route path="/resume" element={
            <Suspense fallback={<AnimatedLoader />}>
              <Resume onLogout={handleStudentLogout} onViewChange={handleViewChange} />
            </Suspense>
          } />
          <Route path="/attendance" element={
            <Suspense fallback={<AnimatedLoader />}>
              <Attendance onLogout={handleStudentLogout} onViewChange={handleViewChange} />
            </Suspense>
          } />
          <Route path="/achievements" element={
            <Suspense fallback={<AnimatedLoader />}>
              <Achievements onLogout={handleStudentLogout} onViewChange={handleViewChange} />
            </Suspense>
          } />
          <Route path="/company" element={
            <Suspense fallback={<AnimatedLoader />}>
              <Company onLogout={handleStudentLogout} onViewChange={handleViewChange} />
            </Suspense>
          } />
          <Route path="/profile" element={
            <Suspense fallback={<AnimatedLoader />}>
              <StuProfile onLogout={handleStudentLogout} onViewChange={handleViewChange} />
            </Suspense>
          } />
        </>
      ) : (
        <Route path="*" element={<PlacementPortalLogin onLogin={() => {}} onNavigateToSignUp={() => navigate("/signup")} />} />
      )}

      {/* Coordinator Routes - No Authentication Required */}
      <Route path="/coordinator" element={<Navigate to="/coordinator/dashboard" replace />} />
      <Route path="/coordinator/dashboard" element={
        <Suspense fallback={<AnimatedLoader />}>
          <CooDashboard onLogout={handleCoordinatorLogout} onViewChange={handleCoordinatorViewChange} />
        </Suspense>
      } />
      <Route path="/coordinator/manage-students" element={
        <Suspense fallback={<AnimatedLoader />}>
          <ManageStudents onLogout={handleCoordinatorLogout} onViewChange={handleCoordinatorViewChange} />
        </Suspense>
      } />
      <Route path="/coordinator/company-profile" element={
        <Suspense fallback={<AnimatedLoader />}>
          <CompanyProfile onLogout={handleCoordinatorLogout} onViewChange={handleCoordinatorViewChange} />
        </Suspense>
      } />
      <Route path="/coordinator/company-drive" element={
        <Suspense fallback={<AnimatedLoader />}>
          <CompanyDrive onLogout={handleCoordinatorLogout} onViewChange={handleCoordinatorViewChange} />
        </Suspense>
      } />
      <Route path="/coordinator/certificate-verification" element={
        <Suspense fallback={<AnimatedLoader />}>
          <CertificateVerification onLogout={handleCoordinatorLogout} onViewChange={handleCoordinatorViewChange} />
        </Suspense>
      } />
      <Route path="/coordinator/eligible-students" element={
        <Suspense fallback={<AnimatedLoader />}>
          <EligibleStudents onLogout={handleCoordinatorLogout} onViewChange={handleCoordinatorViewChange} />
        </Suspense>
      } />
      <Route path="/coordinator/attendance" element={
        <Suspense fallback={<AnimatedLoader />}>
          <CooAttendance onLogout={handleCoordinatorLogout} onViewChange={handleCoordinatorViewChange} />
        </Suspense>
      } />
      <Route path="/coordinator/placed-students" element={
        <Suspense fallback={<AnimatedLoader />}>
          <PlacedStudents onLogout={handleCoordinatorLogout} onViewChange={handleCoordinatorViewChange} />
        </Suspense>
      } />
      <Route path="/coordinator/report-analysis" element={
        <Suspense fallback={<AnimatedLoader />}>
          <ReportAnalysis onLogout={handleCoordinatorLogout} onViewChange={handleCoordinatorViewChange} />
        </Suspense>
      } />
      <Route path="/coordinator/report-analysis-cw" element={
        <Suspense fallback={<AnimatedLoader />}>
          <ReportAnalysisCW onLogout={handleCoordinatorLogout} onViewChange={handleCoordinatorViewChange} />
        </Suspense>
      } />
      <Route path="/coordinator/report-analysis-sw" element={
        <Suspense fallback={<AnimatedLoader />}>
          <ReportAnalysisSW onLogout={handleCoordinatorLogout} onViewChange={handleCoordinatorViewChange} />
        </Suspense>
      } />
      <Route path="/coordinator/profile" element={
        <Suspense fallback={<AnimatedLoader />}>
          <CooProfile onLogout={handleCoordinatorLogout} onViewChange={handleCoordinatorViewChange} />
        </Suspense>
      } />
      <Route path="/coordinator/manage-students-semester" element={
        <Suspense fallback={<AnimatedLoader />}>
          <ManageStudentsSemester onLogout={handleCoordinatorLogout} onViewChange={handleCoordinatorViewChange} />
        </Suspense>
      } />
      <Route path="/coordinator/manage-students-profile" element={
        <Suspense fallback={<AnimatedLoader />}>
          <ManageStudentsProfile onLogout={handleCoordinatorLogout} onViewChange={handleCoordinatorViewChange} />
        </Suspense>
      } />
      <Route path="/coordinator/coo-view-page" element={
        <Suspense fallback={<AnimatedLoader />}>
          <CooViewpage onLogout={handleCoordinatorLogout} onViewChange={handleCoordinatorViewChange} />
        </Suspense>
      } />
      <Route path="/coordinator/coo-view-ms" element={
        <Suspense fallback={<AnimatedLoader />}>
          <CooViewMS onLogout={handleCoordinatorLogout} onViewChange={handleCoordinatorViewChange} />
        </Suspense>
      } />
      <Route path="/coordinator/coo-view-ps" element={
        <Suspense fallback={<AnimatedLoader />}>
          <CooViewPS onLogout={handleCoordinatorLogout} onViewChange={handleCoordinatorViewChange} />
        </Suspense>
      } />
      {/* Redirect /coo-dashboard to /coordinator/dashboard for backward compatibility */}
      <Route path="/coo-dashboard" element={<Navigate to="/coordinator/dashboard" replace />} />
    </Routes>
  );
}

// The main App component that sets up the router and AuthProvider
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;