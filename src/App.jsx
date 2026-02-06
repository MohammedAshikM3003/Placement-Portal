import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import RegistrationDebug from "./components/RegistrationDebug.jsx";
import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner.js";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute, { RoleGuard } from "./components/ProtectedRoute.jsx";

// --- LIGHTWEIGHT DIRECT IMPORTS ---
import LandingPage from "./LandingPage.jsx";
import PlacementPortalLogin from "./mainlogin.jsx";
import MainSignUp from "./MainSingUp.jsx";
import MainRegistration from "./MainRegistration.jsx";

// --- ADMIN PAGE IMPORTS ---
import AdminDashboard from "./AdminPages/Admin_Dashboard.jsx";
import AdminstudDB from "./AdminPages/AdminstudDB.jsx"; 
import AdminDBprofile from "./AdminPages/AdminDBprofile.jsx";
import AdminCompanyprofile from "./AdminPages/AdminCompanyprofile.jsx";
import AdminCompanyDrive from "./AdminPages/AdminCompanyDrive.jsx"; 
import AdminCompanyDriveAD from "./AdminPages/AdminCompanyDriveAD.jsx";
import AdminCompanyDrivedet from "./AdminPages/AdminCompanyDrivedet.jsx";
import AdminEligiblestudents from "./AdminPages/AdminEligiblestudents.jsx";
import AdminAtt from "./AdminPages/AdminAttendance.jsx";
import AdminPlacedStudents from "./AdminPages/AdminPlacedStudents.jsx";
import AdminRARW from "./AdminPages/AdminRARW.jsx";
import AdminRACW from "./AdminPages/AdminRACW.jsx";
import AdminRADW from "./AdminPages/AdminRADW.jsx";
import AdminRASW from "./AdminPages/AdminRASW.jsx";
import AdminABM from "./AdminPages/AdAddBranchMainPage.jsx";
import AdminABN from "./AdminPages/AdAddBranchPage.jsx";
import Admainprofile from "./AdminPages/AdminmainProfile.jsx";
import AdminStuProfile from "./AdminPages/AdminEsprofile.jsx"; 
import AdminEsstudapp from "./AdminPages/AdminEsstudapp.jsx";
import AdminCoDet from "./AdminPages/AdAddCoordinatorform.jsx";
import AdExistingCoordinator from "./AdminPages/AdExistingCoordinator.jsx";
import AdminABcoodet from "./AdminPages/AdminABviewcoo.jsx";
import AdStuDBCertificateView from "./AdminPages/AdStuDBCertificateView.jsx";

// --- COORDINATOR PAGES ---
import CoordinatorDashboard from "./CoordinatorPages/Coo_Dashboard.jsx";
import CoordinatorManageStudents from "./CoordinatorPages/Coo_ManageStudents.jsx";
import CoordinatorCompanyProfile from "./CoordinatorPages/Coo_CompanyProfile.jsx";
import CoordinatorCompanyDrive from "./CoordinatorPages/Coo_CompanyDrive.jsx";
import CoordinatorCertificateVerification from "./CoordinatorPages/Coo_CertificateVerification.jsx";
import CoordinatorEligibleStudents from "./CoordinatorPages/Coo_Eligiblestudents.jsx";
import CoordinatorAttendance from "./CoordinatorPages/Coo_Attendance.jsx";
import CoordinatorPlacedStudents from "./CoordinatorPages/Coo_PlacedStudents.jsx";
import CoordinatorReportAnalysisCW from "./CoordinatorPages/Coo_ReportAnalysisCW.jsx";
import CoordinatorReportAnalysisRW from "./CoordinatorPages/Coo_ReportAnalysisRW.jsx";
import CoordinatorReportAnalysisSW from "./CoordinatorPages/Coo_ReportAnalysisSW.jsx";
import CoordinatorManageStudentsSemester from "./CoordinatorPages/Coo_ManageStudentsSemester.jsx";
import CoordinatorProfile from "./CoordinatorPages/Coo_Profile.jsx";
import CoordinatorManageStudentView from "./CoordinatorPages/Coo_ManageStuViewPage.jsx";
import CoordinatorManageStudentEdit from "./CoordinatorPages/Coo_ManageStuEditPage.jsx";
import CoordinatorEligibleStudentView from "./CoordinatorPages/Coo_EligibleStuViewpage.jsx";
import CoordinatorPlacedStudentView from "./CoordinatorPages/Coo_PlacedStuViewPage.jsx";
import CoordinatorStuDBCertificateView from "./CoordinatorPages/Coo_StuDBCertificateView.jsx";

// --- LAZY LOAD STUDENT COMPONENTS ---
const PlacementPortalDashboard = lazy(() => import("./StudentPages/dashboard.jsx"));
const Resume = lazy(() => import("./StudentPages/resume.jsx"));
const Attendance = lazy(() => import("./StudentPages/Attendance.jsx"));
const Achievements = lazy(() => import("./StudentPages/achievements.jsx"));
const Company = lazy(() => import("./StudentPages/company.jsx"));
const StuProfile = lazy(() => import("./StudentPages/StuProfile.jsx"));

function AppContent() {
  const [userEmail, setUserEmail] = useState("");
  const [userDepartment, setUserDepartment] = useState("");
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const navigate = useNavigate();
  const {
    user: authUser,
    role: authRole,
    isAuthenticated,
    isLoading: authLoading,
    logout: authLogout
  } = useAuth();

  const isStudentLoggedIn = isAuthenticated && authRole === 'student';
  const isCoordinatorLoggedIn = isAuthenticated && authRole === 'coordinator';

  useEffect(() => {
    if (isStudentLoggedIn && authUser) {
      setUserEmail(authUser.primaryEmail || authUser.email || '');
      setUserDepartment(authUser.branch || '');
    } else {
      setUserEmail('');
      setUserDepartment('');
    }
  }, [isStudentLoggedIn, authUser]);

  // Mark initial auth check as done when authLoading becomes false
  useEffect(() => {
    if (!authLoading) {
      setInitialCheckDone(true);
    }
  }, [authLoading]);

  const handleStudentLogin = () => {
    if (authUser) {
      setUserEmail(authUser.primaryEmail || authUser.email || '');
      setUserDepartment(authUser.branch || '');
    }
  };

  useEffect(() => {
    const handleBlockedEvent = () => {
      navigate('/mainlogin', { replace: true });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('studentBlocked', handleBlockedEvent);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('studentBlocked', handleBlockedEvent);
      }
    };
  }, [navigate]);

  const handleStudentLogout = async () => {
    await authLogout?.();
    setUserEmail("");
    setUserDepartment("");
    navigate("/");
  };

  // Only show loader during the very first authentication check
  // During login transitions, the local spinners in mainlogin.jsx handle the UI
  if (!initialCheckDone && authLoading) {
    return <LoadingSpinner 
      message="Checking Authentication..." 
      subMessage="Please wait while we verify your session."
      showAnimatedDots={true}
    />;
  }

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/mainlogin" element={<PlacementPortalLogin onLogin={handleStudentLogin} onNavigateToSignUp={() => navigate("/signup")} />} />
      <Route path="/signup" element={<MainSignUp onNavigateToLogin={() => navigate("/mainlogin")} onStartRegistration={() => navigate("/registration")} />} />
      <Route path="/registration" element={<MainRegistration onNavigateToLogin={() => navigate("/mainlogin")} />} />
      <Route path="/registration-debug" element={<RegistrationDebug />} />

      {/* STUDENT AUTHENTICATED ROUTES */}
      <Route path="/dashboard" element={<RoleGuard allowedRoles={['student']}><Suspense fallback={<LoadingSpinner message="Loading Dashboard..." showAnimatedDots={true} />}><PlacementPortalDashboard onLogout={handleStudentLogout} userEmail={userEmail} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RoleGuard>} />
      <Route path="/resume" element={<RoleGuard allowedRoles={['student']}><Suspense fallback={<LoadingSpinner message="Loading Resume..." showAnimatedDots={true} />}><Resume onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RoleGuard>} />
      <Route path="/attendance" element={<RoleGuard allowedRoles={['student']}><Suspense fallback={<LoadingSpinner message="Loading Attendance..." showAnimatedDots={true} />}><Attendance onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RoleGuard>} />
      <Route path="/achievements" element={<RoleGuard allowedRoles={['student']}><Suspense fallback={<LoadingSpinner message="Loading Achievements..." showAnimatedDots={true} />}><Achievements onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RoleGuard>} />
      <Route path="/company" element={<RoleGuard allowedRoles={['student']}><Suspense fallback={<LoadingSpinner message="Loading Company..." showAnimatedDots={true} />}><Company onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RoleGuard>} />
      <Route path="/profile" element={<RoleGuard allowedRoles={['student']}><Suspense fallback={<LoadingSpinner message="Loading Profile..." showAnimatedDots={true} />}><StuProfile onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RoleGuard>} />

      {/* COORDINATOR AUTHENTICATED ROUTES */}
      <Route path="/coo-dashboard" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorDashboard onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />
      <Route path="/coo-manage-students" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorManageStudents onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />
      <Route path="/coo-company-profile" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorCompanyProfile onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />
      <Route path="/coo-company-drive" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorCompanyDrive onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />
      <Route path="/coo-certificate-verification" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorCertificateVerification onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />
      <Route path="/coo-eligible-students" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorEligibleStudents onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />
      <Route path="/coo-attendance" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorAttendance onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />
      <Route path="/coo-placed-students" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorPlacedStudents onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />
      <Route path="/coo-report-analysis" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorReportAnalysisCW onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />
      <Route path="/coo-report-analysis-cw" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorReportAnalysisCW onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />
      <Route path="/coo-report-analysis-rw" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorReportAnalysisRW onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />
      <Route path="/coo-report-analysis-sw" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorReportAnalysisSW onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />
      <Route path="/coo-manage-students-semester" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorManageStudentsSemester onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />
      <Route path="/coo-profile" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorProfile onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />
      <Route path="/coo-profile/:studentId" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorManageStudentView onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />
      <Route path="/coo-manage-students/view" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorManageStudentView onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />
      <Route path="/coo-manage-students/edit/:studentId" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorManageStudentEdit onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />
      <Route path="/coo-student-certificates/:studentId" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorStuDBCertificateView onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />
      <Route path="/coo-eligible-students/view" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorEligibleStudentView onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />
      <Route path="/coo-placed-students/view" element={<RoleGuard allowedRoles={['coordinator']}><CoordinatorPlacedStudentView onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></RoleGuard>} />

      {/* ADMIN ROUTES */}
      <Route path="/admin-dashboard" element={<RoleGuard allowedRoles={['admin']}><AdminDashboard onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin-student-database" element={<RoleGuard allowedRoles={['admin']}><AdminstudDB onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin-profile/:studentId" element={<RoleGuard allowedRoles={['admin']}><AdminDBprofile onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin-student-certificates/:studentId" element={<RoleGuard allowedRoles={['admin']}><AdStuDBCertificateView onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin-company-profile" element={<RoleGuard allowedRoles={['admin']}><AdminCompanyprofile onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin-company-drive" element={<RoleGuard allowedRoles={['admin']}><AdminCompanyDrive onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin/company-drive/add" element={<RoleGuard allowedRoles={['admin']}><AdminCompanyDriveAD onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin/company-drive/details" element={<RoleGuard allowedRoles={['admin']}><AdminCompanyDrivedet onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin-eligible-students" element={<RoleGuard allowedRoles={['admin']}><AdminEligiblestudents onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin-attendance" element={<RoleGuard allowedRoles={['admin']}><AdminAtt onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin-placed-students" element={<RoleGuard allowedRoles={['admin']}><AdminPlacedStudents onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin-report-analysis-rarw" element={<RoleGuard allowedRoles={['admin']}><AdminRARW onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin-report-analysis-company" element={<RoleGuard allowedRoles={['admin']}><AdminRACW onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin-report-analysis-department" element={<RoleGuard allowedRoles={['admin']}><AdminRADW onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin-report-analysis-student" element={<RoleGuard allowedRoles={['admin']}><AdminRASW onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin-add-branch-main" element={<RoleGuard allowedRoles={['admin']}><AdminABM onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin-add-branch" element={<RoleGuard allowedRoles={['admin']}><AdminABN onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin-profile-main" element={<RoleGuard allowedRoles={['admin']}><Admainprofile onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/AdminEsprofile/:studentId" element={<RoleGuard allowedRoles={['admin']}><AdminStuProfile onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin-student-application" element={<RoleGuard allowedRoles={['admin']}><AdminEsstudapp onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin-coordinator-detail" element={<RoleGuard allowedRoles={['admin']}><AdminCoDet onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin-manage-coordinators/:branchCode" element={<RoleGuard allowedRoles={['admin']}><AdExistingCoordinator onLogout={() => navigate('/')} /></RoleGuard>} />
      <Route path="/admin-view-coordinator/:coordinatorId" element={<RoleGuard allowedRoles={['admin']}><AdminABcoodet onLogout={() => navigate('/')} /></RoleGuard>} />

      {/* FALLBACK */}
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;