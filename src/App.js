import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import RegistrationDebug from "./components/RegistrationDebug.js";
import AnimatedLoader from "./components/AnimatedLoader.js";

// Import lightweight components directly
import LandingPage from "./LandingPage.js";
import PlacementPortalLogin from "./mainlogin.js";
import MainSignUp from "./MainSingUp.js";
import MainRegistration from "./MainRegistration.js";
import CoordinatorAccess from "./CoordinatorAccess.js";
import CoordinatorMain from "./CoordinatorMain.js";

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

// This component now contains the main application logic
function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userDepartment, setUserDepartment] = useState("");
  const [isCoordinatorLoggedIn, setIsCoordinatorLoggedIn] = useState(false);
  const [coordinatorData, setCoordinatorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

      // Check MongoDB authentication
      useEffect(() => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        const isCoordinatorLoggedIn = localStorage.getItem('isCoordinatorLoggedIn') === 'true';
        const coordinatorData = JSON.parse(localStorage.getItem('coordinatorData') || 'null');
        
        console.log('App.js - Checking auth state:', { isLoggedIn, studentData, isCoordinatorLoggedIn, coordinatorData }); // Debug log
        
        // Check student authentication
        if (isLoggedIn && studentData) {
          setIsLoggedIn(true);
          setUserEmail(studentData.primaryEmail || studentData.email || '');
          setUserRole('student');
          setUserDepartment(studentData.branch || '');
          console.log('App.js - Student authenticated:', studentData.firstName, studentData.lastName); // Debug log
        } else {
          setIsLoggedIn(false);
          setUserEmail('');
          setUserRole('');
          setUserDepartment('');
          console.log('App.js - Student not authenticated'); // Debug log
        }

        // Check coordinator authentication
        if (isCoordinatorLoggedIn && coordinatorData) {
          setIsCoordinatorLoggedIn(true);
          setCoordinatorData(coordinatorData);
          console.log('App.js - Coordinator authenticated:', coordinatorData); // Debug log
        } else {
          setIsCoordinatorLoggedIn(false);
          setCoordinatorData(null);
          console.log('App.js - Coordinator not authenticated'); // Debug log
        }
        
        setIsLoading(false);
      }, []);

  const handleLogin = async (regNo, dob) => {
    // This function is called after successful authentication
    console.log('Login successful for:', regNo);
    
    try {
      // Initialize all student data for all pages
      const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (studentData && studentData._id) {
        console.log('🚀 INITIALIZING: All student data after login...');
        const fastDataService = (await import('./services/fastDataService.js')).default;
        await fastDataService.initializeAllStudentData(studentData._id);
        console.log('✅ ALL STUDENT DATA INITIALIZED FOR ALL PAGES');
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
          
          setIsLoggedIn(false);
          setUserEmail("");
          setUserRole("");
          setUserDepartment("");
          navigate("/"); // Redirect to landing page on logout
        } catch (error) {
          console.error('Logout error:', error);
        }
      };

      const handleCoordinatorLogout = async () => {
        try {
          // Clear coordinator localStorage
          localStorage.removeItem('coordinatorData');
          localStorage.removeItem('isCoordinatorLoggedIn');
          
          setIsCoordinatorLoggedIn(false);
          setCoordinatorData(null);
          navigate("/"); // Redirect to landing page on logout
        } catch (error) {
          console.error('Coordinator logout error:', error);
        }
      };
  
  // Handlers for navigation
  const handleViewChange = (view) => {
    // You can use a switch or if/else here to navigate to the correct route
    navigate(`/${view}`);
  };

  const handleCoordinatorViewChange = (view) => {
    // Navigate to coordinator routes with proper prefix
    navigate(`/coordinator/${view}`);
  };

  const handleRedirectToLogin = () => {
    setIsLoggedIn(false);
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

      {/* Authenticated Routes */}
      {isLoggedIn ? (
        <>
          <Route path="/dashboard" element={
            <Suspense fallback={<AnimatedLoader />}>
              <PlacementPortalDashboard onLogout={handleLogout} userEmail={userEmail} onViewChange={handleViewChange} />
            </Suspense>
          } />
          <Route path="/resume" element={
            <Suspense fallback={<AnimatedLoader />}>
              <Resume onLogout={handleLogout} onViewChange={handleViewChange} />
            </Suspense>
          } />
          <Route path="/attendance" element={
            <Suspense fallback={<AnimatedLoader />}>
              <Attendance onLogout={handleLogout} onViewChange={handleViewChange} />
            </Suspense>
          } />
          <Route path="/achievements" element={
            <Suspense fallback={<AnimatedLoader />}>
              <Achievements onLogout={handleLogout} onViewChange={handleViewChange} />
            </Suspense>
          } />
          <Route path="/company" element={
            <Suspense fallback={<AnimatedLoader />}>
              <Company onLogout={handleLogout} onViewChange={handleViewChange} />
            </Suspense>
          } />
          <Route path="/profile" element={
            <Suspense fallback={<AnimatedLoader />}>
              <StuProfile onLogout={handleLogout} onViewChange={handleViewChange} />
            </Suspense>
          } />
        </>
      ) : (
        // Redirect to the login page if the user is not logged in and tries to access a protected route
        <Route path="*" element={<PlacementPortalLogin onLogin={handleLogin} onNavigateToSignUp={() => navigate("/signup")} />} />
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

// The main App component that sets up the router
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </div>
  );
}

export default App;