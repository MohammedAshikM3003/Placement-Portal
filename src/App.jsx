import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import RegistrationDebug from "./components/RegistrationDebug.jsx";
import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner.js";
import UnifiedLoadingScreen from "./components/UnifiedLoadingScreen/UnifiedLoadingScreen.jsx";
import RouteErrorBoundary from "./components/RouteErrorBoundary/RouteErrorBoundary.jsx";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute, { RoleGuard } from "./components/ProtectedRoute.jsx";
import { changeFavicon, FAVICON_TYPES } from './utils/faviconUtils';

// --- LIGHTWEIGHT DIRECT IMPORTS (public routes - always needed) ---
import LandingPage from "./LandingPage.jsx";
import PlacementPortalLogin from "./mainlogin.jsx";
import MainSignUp from "./MainSingUp.jsx";
import MainRegistration from "./MainRegistration.jsx";

// --- LAZY LOAD ADMIN PAGES (only loaded when admin navigates to them) ---
const AdminDashboard = lazy(() => import("./AdminPages/Admin_Dashboard.jsx"));
const AdminstudDB = lazy(() => import("./AdminPages/AdminstudDB.jsx"));
const AdminDBprofile = lazy(() => import("./AdminPages/AdminDBprofile.jsx"));
const AdminCompanyprofile = lazy(() => import("./AdminPages/AdminCompanyprofile.jsx"));
const AdminCompanyDrive = lazy(() => import("./AdminPages/AdminCompanyDrive.jsx"));
const AdminCompanyDriveAD = lazy(() => import("./AdminPages/AdminCompanyDriveAD.jsx"));
const AdminCompanyDrivedet = lazy(() => import("./AdminPages/AdminCompanyDrivedet.jsx"));
const AdminEligiblestudents = lazy(() => import("./AdminPages/AdminEligiblestudents.jsx"));
const AdminAtt = lazy(() => import("./AdminPages/AdminAttendance.jsx"));
const AdminPlacedStudents = lazy(() => import("./AdminPages/AdminPlacedStudents.jsx"));
const AdminRARW = lazy(() => import("./AdminPages/AdminRARW.jsx"));
const AdminRACW = lazy(() => import("./AdminPages/AdminRACW.jsx"));
const AdminRADW = lazy(() => import("./AdminPages/AdminRADW.jsx"));
const AdminRASW = lazy(() => import("./AdminPages/AdminRASW.jsx"));
const AdminABM = lazy(() => import("./AdminPages/AdAddBranchMainPage.jsx"));
const AdminABN = lazy(() => import("./AdminPages/AdAddBranchPage.jsx"));
const Admainprofile = lazy(() => import("./AdminPages/AdminmainProfile.jsx"));
const AdminStuProfile = lazy(() => import("./AdminPages/AdminEsprofile.jsx"));
const AdminEsstudapp = lazy(() => import("./AdminPages/AdminEsstudapp.jsx"));
const AdminCoDet = lazy(() => import("./AdminPages/AdAddCoordinatorform.jsx"));
const AdExistingCoordinator = lazy(() => import("./AdminPages/AdExistingCoordinator.jsx"));
const AdminABcoodet = lazy(() => import("./AdminPages/AdminABviewcoo.jsx"));
const AdStuDBCertificateView = lazy(() => import("./AdminPages/AdStuDBCertificateView.jsx"));

// --- LAZY LOAD COORDINATOR PAGES (only loaded when coordinator navigates to them) ---
const CoordinatorDashboard = lazy(() => import("./CoordinatorPages/Coo_Dashboard.jsx"));
const CoordinatorManageStudents = lazy(() => import("./CoordinatorPages/Coo_ManageStudents.jsx"));
const CoordinatorCompanyProfile = lazy(() => import("./CoordinatorPages/Coo_CompanyProfile.jsx"));
const CoordinatorCompanyDrive = lazy(() => import("./CoordinatorPages/Coo_CompanyDrive.jsx"));
const CoordinatorCertificateVerification = lazy(() => import("./CoordinatorPages/Coo_CertificateVerification.jsx"));
const CoordinatorEligibleStudents = lazy(() => import("./CoordinatorPages/Coo_Eligiblestudents.jsx"));
const CoordinatorAttendance = lazy(() => import("./CoordinatorPages/Coo_Attendance.jsx"));
const CoordinatorPlacedStudents = lazy(() => import("./CoordinatorPages/Coo_PlacedStudents.jsx"));
const CoordinatorReportAnalysisCW = lazy(() => import("./CoordinatorPages/Coo_ReportAnalysisCW.jsx"));
const CoordinatorReportAnalysisRW = lazy(() => import("./CoordinatorPages/Coo_ReportAnalysisRW.jsx"));
const CoordinatorReportAnalysisSW = lazy(() => import("./CoordinatorPages/Coo_ReportAnalysisSW.jsx"));
const CoordinatorManageStudentsSemester = lazy(() => import("./CoordinatorPages/Coo_ManageStudentsSemester.jsx"));
const CoordinatorProfile = lazy(() => import("./CoordinatorPages/Coo_Profile.jsx"));
const CoordinatorManageStudentView = lazy(() => import("./CoordinatorPages/Coo_ManageStuViewPage.jsx" /* webpackPrefetch: true */));
const CoordinatorManageStudentEdit = lazy(() => import("./CoordinatorPages/Coo_ManageStuEditPage.jsx"));
const CoordinatorEligibleStudentView = lazy(() => import("./CoordinatorPages/Coo_EligibleStuViewpage.jsx"));
const CoordinatorPlacedStudentView = lazy(() => import("./CoordinatorPages/Coo_PlacedStuViewPage.jsx"));
const CoordinatorStuDBCertificateView = lazy(() => import("./CoordinatorPages/Coo_StuDBCertificateView.jsx"));

// --- LAZY LOAD STUDENT COMPONENTS ---
const PlacementPortalDashboard = lazy(() => import("./StudentPages/dashboard.jsx"));
const Resume = lazy(() => import("./StudentPages/resume.jsx"));
const ResumeBuilder = lazy(() => import("./StudentPages/ResumeBuilder.jsx"));
const ATSChecker = lazy(() => import("./StudentPages/ATSChecker.jsx"));
const Attendance = lazy(() => import("./StudentPages/Attendance.jsx"));
const Achievements = lazy(() => import("./StudentPages/achievements.jsx"));
const Company = lazy(() => import("./StudentPages/company.jsx"));
const StuProfile = lazy(() => import("./StudentPages/StuProfile.jsx"));

function AppContent() {
  const [userEmail, setUserEmail] = useState("");
  const [userDepartment, setUserDepartment] = useState("");
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user: authUser,
    role: authRole,
    isAuthenticated,
    isLoading: authLoading,
    isPreloading: authPreloading,
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

  // Centralized favicon management — set favicon based on current route + role
  // Public routes always get purple; role routes get their role color
  useEffect(() => {
    if (!authLoading) {
      const path = location.pathname;
      const isPublicRoute = path === '/' || path === '/mainlogin' || path === '/signup' || path === '/registration' || path === '/registration-debug';

      if (isPublicRoute) {
        changeFavicon(FAVICON_TYPES.DEFAULT);
      } else if (isAuthenticated && authRole) {
        switch (authRole) {
          case 'admin':
            changeFavicon(FAVICON_TYPES.ADMIN);
            break;
          case 'coordinator':
            changeFavicon(FAVICON_TYPES.COORDINATOR);
            break;
          case 'student':
            changeFavicon(FAVICON_TYPES.STUDENT);
            break;
          default:
            changeFavicon(FAVICON_TYPES.DEFAULT);
        }
      } else {
        changeFavicon(FAVICON_TYPES.DEFAULT);
      }
    }
  }, [authLoading, isAuthenticated, authRole, location.pathname]);

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
    <>
      {/* Unified loading screen OVERLAYS the app (position:fixed) — never blocks Routes */}
      {authPreloading && isAuthenticated && (
        <UnifiedLoadingScreen 
          role={authRole}
          message={`Loading ${authRole === 'admin' ? 'Admin' : authRole === 'coordinator' ? 'Coordinator' : 'Student'} Dashboard...`}
          subMessage="Preparing your profile, sidebar, and dashboard data..."
        />
      )}
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/mainlogin" element={<PlacementPortalLogin onLogin={handleStudentLogin} onNavigateToSignUp={() => navigate("/signup")} />} />
      <Route path="/signup" element={<MainSignUp onNavigateToLogin={() => navigate("/mainlogin")} onStartRegistration={() => navigate("/registration")} />} />
      <Route path="/registration" element={<MainRegistration onNavigateToLogin={() => navigate("/mainlogin")} />} />
      <Route path="/registration-debug" element={<RegistrationDebug />} />

      {/* STUDENT AUTHENTICATED ROUTES - Wrapped in Error Boundary */}
      <Route path="/dashboard" element={<RoleGuard allowedRoles={['student']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Dashboard..." showAnimatedDots={true} />}><PlacementPortalDashboard onLogout={handleStudentLogout} userEmail={userEmail} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/resume" element={<RoleGuard allowedRoles={['student']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Resume..." showAnimatedDots={true} />}><Resume onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/resume-builder" element={<RoleGuard allowedRoles={['student']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Resume Builder..." showAnimatedDots={true} />}><ResumeBuilder onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/ats-checker" element={<RoleGuard allowedRoles={['student']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading ATS Checker..." showAnimatedDots={true} />}><ATSChecker onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/attendance" element={<RoleGuard allowedRoles={['student']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Attendance..." showAnimatedDots={true} />}><Attendance onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/achievements" element={<RoleGuard allowedRoles={['student']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Achievements..." showAnimatedDots={true} />}><Achievements onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/company" element={<RoleGuard allowedRoles={['student']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Company..." showAnimatedDots={true} />}><Company onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/profile" element={<RoleGuard allowedRoles={['student']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Profile..." showAnimatedDots={true} />}><StuProfile onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />

      {/* COORDINATOR AUTHENTICATED ROUTES - Wrapped in Error Boundary */}
      <Route path="/coo-dashboard" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Dashboard..." showAnimatedDots={true} />}><CoordinatorDashboard onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-manage-students" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorManageStudents onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-company-profile" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorCompanyProfile onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-company-drive" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorCompanyDrive onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-certificate-verification" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorCertificateVerification onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-eligible-students" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorEligibleStudents onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-attendance" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorAttendance onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-placed-students" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorPlacedStudents onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-report-analysis" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorReportAnalysisRW onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-report-analysis-cw" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorReportAnalysisCW onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-report-analysis-rw" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorReportAnalysisRW onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-report-analysis-sw" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorReportAnalysisSW onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-manage-students-semester" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorManageStudentsSemester onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-profile" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorProfile onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-profile/:studentId" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorManageStudentView onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-manage-students/view" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorManageStudentView onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-manage-students/edit/:studentId" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorManageStudentEdit onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-student-certificates/:studentId" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorStuDBCertificateView onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-eligible-students/view" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorEligibleStudentView onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-placed-students/view" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorPlacedStudentView onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />

      {/* ADMIN ROUTES - Wrapped in Error Boundary */}
      <Route path="/admin-dashboard" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Dashboard..." showAnimatedDots={true} />}><AdminDashboard onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-student-database" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminstudDB onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-profile/:studentId" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminDBprofile onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-student-certificates/:studentId" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdStuDBCertificateView onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-company-profile" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminCompanyprofile onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-company-drive" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminCompanyDrive onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin/company-drive/add" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminCompanyDriveAD onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin/company-drive/details" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminCompanyDrivedet onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-eligible-students" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminEligiblestudents onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-attendance" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminAtt onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-placed-students" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminPlacedStudents onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-report-analysis-rarw" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminRARW onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-report-analysis-company" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminRACW onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-report-analysis-department" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminRADW onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-report-analysis-student" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminRASW onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-add-branch-main" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminABM onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-add-branch" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminABN onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-profile-main" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><Admainprofile onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/AdminEsprofile/:studentId" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminStuProfile onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-student-application" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminEsstudapp onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-coordinator-detail" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminCoDet onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-manage-coordinators/:branchCode" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdExistingCoordinator onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-view-coordinator/:coordinatorId" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminABcoodet onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />

      {/* FALLBACK */}
      <Route path="*" element={<LandingPage />} />
    </Routes>
    </>
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