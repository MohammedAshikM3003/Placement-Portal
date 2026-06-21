import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import RegistrationDebug from "./components/RegistrationDebug.jsx";
import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner.js";
import UnifiedLoadingScreen from "./components/UnifiedLoadingScreen/UnifiedLoadingScreen.jsx";
import RouteErrorBoundary from "./components/RouteErrorBoundary/RouteErrorBoundary.jsx";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import ProtectedRoute, { RoleGuard } from "./components/ProtectedRoute.jsx";
import { changeFavicon, FAVICON_TYPES } from './utils/faviconUtils';
import GlobalNotificationChecker from "./components/CertificateNotification/GlobalNotificationChecker.jsx";
import GlobalPlacementBannerChecker from "./components/CertificateNotification/GlobalPlacementBannerChecker.jsx";
import GlobalDriveScheduledChecker from "./components/CertificateNotification/GlobalDriveScheduledChecker.jsx";
import GlobalBlockNotificationChecker from "./components/CertificateNotification/GlobalBlockNotificationChecker.jsx";
import GlobalOfferLetterNotificationChecker from "./components/CertificateNotification/GlobalOfferLetterNotificationChecker.jsx";
import GlobalCoordinatorCertificateUploadChecker from "./components/CertificateNotification/GlobalCoordinatorCertificateUploadChecker.jsx";
import GlobalSemesterNotificationChecker from "./components/CertificateNotification/GlobalSemesterNotificationChecker.jsx";
import { runCacheMigration } from './utils/cacheMigration';

// --- LIGHTWEIGHT DIRECT IMPORTS (public routes - always needed) ---
import LandingPage from "./LandingPage.jsx";
import PlacementPortalLogin from "./mainlogin.jsx";
import MainSignUp from "./MainSignUp.jsx";
import MainRegistration from "./MainRegistration.jsx";

// --- LAZY LOAD ADMIN PAGES (only loaded when admin navigates to them) ---
const AdminDashboard = lazy(() => import("./AdminPages/Admin_Dashboard.jsx"));
const SastuPage = lazy(() => import("./AdminPages/sastupage.jsx"));
const SaCooPage = lazy(() => import("./AdminPages/sacoopage.jsx"));
const SaAdPage = lazy(() => import("./AdminPages/saadpage.jsx"));
const AdminstudDB = lazy(() => import("./AdminPages/AdminstudDB.jsx"));
const AdminCompanyprofile = lazy(() => import("./AdminPages/AdminCompanyprofile.jsx"));
const AdminCompanyprofilePopup = lazy(() => import("./AdminPages/AdminCompanyprofilepopup.jsx"));
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
const AdminTraining = lazy(() => import("./AdminPages/Admin_Training.jsx"));
const AdminTrainingCompany = lazy(() => import("./AdminPages/Admin_Training_Company.jsx"));
const AdminHistoryTraining = lazy(() => import("./AdminPages/Admin_History_Training.jsx"));
const AdminAddTraining = lazy(() => import("./AdminPages/Admin_Add_Training.jsx"));
const AdminScheduleTraining = lazy(() => import("./AdminPages/Admin_Schedule_Training.jsx"));
const AdminScheduleTrainingBatch = lazy(() => import("./AdminPages/Admin_schedule_training_batch.jsx"));
const AdminTrainingsArchive = lazy(() => import("./AdminPages/Admin_Trainings_Archive.jsx"));
const AdminPreferredTrainingButton = lazy(() => import("./AdminPages/Admin_Preferred_Training_button.jsx"));
const AdminAttendanceStdinfo = lazy(() => import("./AdminPages/Admin_Attendance_Stdinfo.jsx"));
const AdminTrainAttendanceStuinfo = lazy(() => import("./AdminPages/Admin_TrainAttendanceStuinfo.jsx"));
const Admainprofile = lazy(() => import("./AdminPages/AdminmainProfile.jsx"));
const AdminStuProfile = lazy(() => import("./AdminPages/AdminEsprofile.jsx"));
const AdminStuProfileView = lazy(() =>
  import("./AdminPages/AdminStuProfileView.jsx").then((module) => ({
    default: module.default || module.AdminStuProfileView
  }))
);
const AdminStuProfileEdit = lazy(() =>
  import("./AdminPages/AdminStuProfileEdit.jsx").then((module) => ({
    default: module.default || module.AdminStuProfileEdit
  }))
);
const AdminSemesterMarksheetView = lazy(() => import("./AdminPages/AdminSemesterMarksheetView.jsx"));
const AdminSemesterMarksheetEdit = lazy(() => import("./AdminPages/AdminSemesterMarksheetEdit.jsx"));
const AdminEsstudapp = lazy(() => import("./AdminPages/AdminEsstudapp.jsx"));
const AdminCoDet = lazy(() => import("./AdminPages/AdAddCoordinatorform.jsx"));
const AdExistingCoordinator = lazy(() => import("./AdminPages/AdExistingCoordinator.jsx"));
const AdminABcoodet = lazy(() => import("./AdminPages/AdminABviewcoo.jsx"));
const AdStuDBCertificateView = lazy(() => import("./AdminPages/AdStuDBCertificateView.jsx"));
const AdActiveZip = lazy(() => import("./AdminPages/Ad_ActiveZip.jsx"));
const AdZipActiveBatchesDepartment = lazy(() => import("./AdminPages/Ad_ZipActive_Batches_Department.jsx"));
const AdZippedBatches = lazy(() => import("./AdminPages/Ad_Zipped_Batches.jsx"));
const AdZippedBatchDepartmentsView = lazy(() => import("./AdminPages/Ad_Zipped_Batch_Departments_View.jsx"));
const AdZippedBatchDepartmentStudents = lazy(() => import("./AdminPages/Ad_Zipped_Batch_Department_Students.jsx"));
const AdZippedBatchDepartmentDetails = lazy(() => import("./AdminPages/Ad_Zipped_Batch_Department_Details.jsx"));
const AdZippingHistory = lazy(() => import("./AdminPages/Ad_Zipping_History.jsx"));

// --- LAZY LOAD COORDINATOR PAGES (only loaded when coordinator navigates to them) ---
const CoordinatorDashboard = lazy(() => import("./CoordinatorPages/Coo_Dashboard.jsx"));
const CoordinatorManageStudents = lazy(() => import("./CoordinatorPages/Coo_ManageStudents.jsx"));
const CoodTrainDBMain = lazy(() => import("./CoordinatorPages/Cood_trainDBmain.jsx"));
const CooTrainAttendanceStuinfo = lazy(() => import("./CoordinatorPages/Coo_TrainAttendanceStuinfo.jsx"));
const CoordinatorCompanyProfile = lazy(() => import("./CoordinatorPages/Coo_CompanyProfile.jsx"));
const CoordinatorCompanyDrive = lazy(() => import("./CoordinatorPages/Coo_CompanyDrive.jsx"));
const CoordinatorCertificateVerification = lazy(() => import("./CoordinatorPages/Coo_CertificateVerification.jsx"));
const CoordinatorEligibleStudents = lazy(() => import("./CoordinatorPages/Coo_Eligiblestudents.jsx"));
const CoordinatorAttendance = lazy(() => import("./CoordinatorPages/Coo_Attendance.jsx"));
const CoordinatorPlacedStudents = lazy(() => import("./CoordinatorPages/Coo_PlacedStudents.jsx"));
const CoordinatorSemesterEditor = lazy(() => import("./CoordinatorPages/Coo_MS_Sem.jsx"));
const CoordinatorSemesterEditorProfile = lazy(() => import("./CoordinatorPages/Coo_MS_Sem_profile.jsx"));
const CoordinatorSemesterHistory = lazy(() => import("./CoordinatorPages/CooSemesterHistory.jsx"));
const CoordinatorCompanyDriveView = lazy(() => import("./CoordinatorPages/Coo_CompanyDriveView.jsx"));
const CoordinatorReportAnalysisCW = lazy(() => import("./CoordinatorPages/Coo_ReportAnalysisCW.jsx"));
const CoordinatorReportAnalysisRW = lazy(() => import("./CoordinatorPages/Coo_ReportAnalysisRW.jsx"));
const CoordinatorReportAnalysisSW = lazy(() => import("./CoordinatorPages/Coo_ReportAnalysisSW.jsx"));
const CoordinatorManageStudentsSemester = lazy(() => import("./CoordinatorPages/Coo_ManageStudentsSemester_new.jsx"));
const CoordinatorProfile = lazy(() => import("./CoordinatorPages/Coo_Profile.jsx"));
const CoordinatorManageStudentViewSemester = lazy(() => import("./CoordinatorPages/Coo_ManageStudentSemesterMarksheetView.jsx"));
const CoordinatorSemesterDetail = lazy(() => import("./CoordinatorPages/Coo_MS_SemesterDetail.jsx"));
const CoordinatorManageStudentEdit = lazy(() => import("./CoordinatorPages/Coo_ManageStudentSemesterEdit.jsx"));
const CoordinatorManageStudentViewMain = lazy(() => import("./CoordinatorPages/Coo_ManageStudentView.jsx"));
const CoordinatorMsEditPage = lazy(() => import("./CoordinatorPages/Coo_MS_Editpage.jsx"));
const CoordinatorEligibleStudentView = lazy(() => import("./CoordinatorPages/Coo_EligibleStuViewpage.jsx"));
const CoordinatorStuDBCertificateView = lazy(() => import("./CoordinatorPages/Coo_StuDBCertificateView.jsx"));
const CoordinatorSemesterMarksheetView = lazy(() => import("./CoordinatorPages/Coo_ManageStudentSemesterMarksheetView.jsx"));

// --- LAZY LOAD STUDENT COMPONENTS ---
const PlacementPortalDashboard = lazy(() => import("./StudentPages/dashboard.jsx"));
const Resume = lazy(() => import("./StudentPages/resume.jsx"));
const ResumeBuilder = lazy(() => import("./StudentPages/ResumeBuilder.jsx"));
const ResumePreviewPage = lazy(() => import("./StudentPages/ResumePreviewPage.jsx"));
const ATSChecker = lazy(() => import("./StudentPages/ATSChecker.jsx"));
const Training = lazy(() => import("./StudentPages/Training.jsx"));
const Achievements = lazy(() => import("./StudentPages/achievements.jsx"));
const Company = lazy(() => import("./StudentPages/company.jsx"));
const StuProfile = lazy(() => import("./StudentPages/StuProfile.jsx"));
const StudentSemesterMarksheetView = lazy(() => import("./StudentPages/StudentSemesterMarksheetView.jsx"));

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

  // Centralized role-based HTML theme class management (e.g. for custom scrollbars)
  useEffect(() => {
    const path = location.pathname;
    
    // Explicitly isolate public pages from role themes to prevent cross-tab contamination
    const isPublicRoute = path === '/' || 
                          path === '/mainlogin' || 
                          path === '/signup' || 
                          path === '/registration' || 
                          path === '/registration-debug';
                          
    if (isPublicRoute) {
      document.documentElement.classList.remove('admin-theme', 'coo-theme', 'stu-theme');
      return;
    }

    const isAdminRoute = path.includes('admin') || 
                         path.includes('saad') || 
                         path.includes('sacoo') || 
                         path.includes('sastu') || 
                         authRole === 'admin';
    const isCooRoute = path.includes('coo') || 
                       authRole === 'coordinator';
    const isStuRoute = path === '/dashboard' || 
                       path === '/resume' || 
                       path === '/resume-builder' || 
                       path === '/resume-preview' || 
                       path === '/ats-checker' || 
                       path === '/training' || 
                       path === '/achievements' || 
                       path === '/company' || 
                       path === '/profile' || 
                       path === '/semester-marksheet-upload' || 
                       authRole === 'student';
                         
    if (isAdminRoute) {
      document.documentElement.classList.add('admin-theme');
      document.documentElement.classList.remove('coo-theme', 'stu-theme');
    } else if (isCooRoute) {
      document.documentElement.classList.add('coo-theme');
      document.documentElement.classList.remove('admin-theme', 'stu-theme');
    } else if (isStuRoute) {
      document.documentElement.classList.add('stu-theme');
      document.documentElement.classList.remove('admin-theme', 'coo-theme');
    } else {
      document.documentElement.classList.remove('admin-theme', 'coo-theme', 'stu-theme');
    }
  }, [authRole, location.pathname]);

  const handleStudentLogin = () => {
    if (authUser) {
      setUserEmail(authUser.primaryEmail || authUser.email || '');
      setUserDepartment(authUser.branch || '');
    }
  };

  useEffect(() => {
    // Run one-time cache migration to sanitize cached image URLs (avoid localhost entries)
    try { runCacheMigration(); } catch (e) { /* ignore */ }

    const handleBlockedEvent = () => {
      navigate('/mainlogin', { replace: true });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('studentBlocked', handleBlockedEvent);
      window.addEventListener('coordinatorBlocked', handleBlockedEvent);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('studentBlocked', handleBlockedEvent);
        window.removeEventListener('coordinatorBlocked', handleBlockedEvent);
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

      {/* Global Certificate Notification Checker & Placement Banner - Only on student-authenticated routes */}
      {isStudentLoggedIn && !['/', '/mainlogin', '/signup', '/registration', '/registration-debug'].includes(location.pathname) && (
        <>
          <GlobalNotificationChecker />
          <GlobalPlacementBannerChecker />
          <GlobalDriveScheduledChecker />
          <GlobalOfferLetterNotificationChecker />
          <GlobalSemesterNotificationChecker />
        </>
      )}

      {isAuthenticated && ['admin', 'coordinator'].includes(authRole) && !['/', '/mainlogin', '/signup', '/registration', '/registration-debug'].includes(location.pathname) && (
        <GlobalBlockNotificationChecker />
      )}

      {isCoordinatorLoggedIn && !['/', '/mainlogin', '/signup', '/registration', '/registration-debug'].includes(location.pathname) && (
        <GlobalCoordinatorCertificateUploadChecker />
      )}

    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/mainlogin" element={<PlacementPortalLogin onLogin={handleStudentLogin} onNavigateToSignUp={() => navigate("/signup")} />} />
      <Route path="/signup" element={<MainSignUp onNavigateToLogin={() => navigate("/mainlogin")} onStartRegistration={() => navigate("/registration")} />} />
      <Route path="/registration" element={<MainRegistration onNavigateToLogin={() => navigate("/mainlogin")} />} />
      <Route path="/registration-debug" element={<RegistrationDebug />} />
      <Route path="/sastu-page" element={<RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Page..." showAnimatedDots={true} />}><SastuPage /></Suspense></RouteErrorBoundary>} />
      <Route path="/sacoo-page" element={<RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Page..." showAnimatedDots={true} />}><SaCooPage /></Suspense></RouteErrorBoundary>} />
      <Route path="/saad-page" element={<RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Page..." showAnimatedDots={true} />}><SaAdPage /></Suspense></RouteErrorBoundary>} />

      {/* STUDENT AUTHENTICATED ROUTES - Wrapped in Error Boundary */}
      <Route path="/dashboard" element={<RoleGuard allowedRoles={['student']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Dashboard..." showAnimatedDots={true} />}><PlacementPortalDashboard onLogout={handleStudentLogout} userEmail={userEmail} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/resume" element={<RoleGuard allowedRoles={['student']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Resume..." showAnimatedDots={true} />}><Resume onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/resume-builder" element={<RoleGuard allowedRoles={['student']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Resume Builder..." showAnimatedDots={true} />}><ResumeBuilder onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/resume-preview" element={<RoleGuard allowedRoles={['student']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Resume Preview..." showAnimatedDots={true} />}><ResumePreviewPage /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/ats-checker" element={<RoleGuard allowedRoles={['student']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading ATS Checker..." showAnimatedDots={true} />}><ATSChecker onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/training" element={<RoleGuard allowedRoles={['student']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Training..." showAnimatedDots={true} />}><Training onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/achievements" element={<RoleGuard allowedRoles={['student']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Achievements..." showAnimatedDots={true} />}><Achievements onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/company" element={<RoleGuard allowedRoles={['student']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Company..." showAnimatedDots={true} />}><Company onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/profile" element={<RoleGuard allowedRoles={['student']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Profile..." showAnimatedDots={true} />}><StuProfile onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/student-semester-view" element={<RoleGuard allowedRoles={['student']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><StudentSemesterMarksheetView onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />

      {/* COORDINATOR AUTHENTICATED ROUTES - Wrapped in Error Boundary */}
      <Route path="/coo-dashboard" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Dashboard..." showAnimatedDots={true} />}><CoordinatorDashboard onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-manage-students" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorManageStudents onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-training" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoodTrainDBMain onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-train-attendance-stuinfo" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CooTrainAttendanceStuinfo onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-company-profile" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorCompanyProfile onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-company-drive" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorCompanyDrive onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-company-drive/view" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorCompanyDriveView onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-certificate-verification" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorCertificateVerification onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-eligible-students" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorEligibleStudents onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-attendance" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorAttendance onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-placed-students" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorPlacedStudents onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-report-analysis" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorReportAnalysisRW onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-report-analysis-cw" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorReportAnalysisCW onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-report-analysis-rw" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorReportAnalysisRW onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-report-analysis-sw" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorReportAnalysisSW onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-manage-students-semester" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorManageStudentsSemester onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-manage-students-semester/sem" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorSemesterEditorProfile onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-semester-history" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorSemesterHistory onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-ms-semester-detail" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorSemesterDetail onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-manage-students-semester/view" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorManageStudentViewMain onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-manage-students-semester/edit" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorMsEditPage onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-profile" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorProfile onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-manage-students/edit/:studentId" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorManageStudentEdit onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-manage-students/view/:studentId" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorManageStudentEdit onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-student-certificates/:studentId" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorStuDBCertificateView onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-eligible-students/view" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorEligibleStudentView onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/coo-manage-students-semester/marksheet" element={<RoleGuard allowedRoles={['coordinator']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><CoordinatorSemesterEditor onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} /></Suspense></RouteErrorBoundary></RoleGuard>} />

      {/* ADMIN ROUTES - Wrapped in Error Boundary */}
      <Route path="/admin-dashboard" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Dashboard..." showAnimatedDots={true} />}><AdminDashboard onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/saad-admin-dashboard" element={<RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading Dashboard..." showAnimatedDots={true} />}><AdminDashboard onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary>} />
      <Route path="/admin-student-database" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminstudDB onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-placement-training" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminTraining onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-training" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminTraining onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-training-company" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminTrainingCompany onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-training-history" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminHistoryTraining onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-add-training" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminAddTraining onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-schedule-training" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminScheduleTraining onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-schedule-training-batch" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminScheduleTrainingBatch onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-trainings-archive" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminTrainingsArchive onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-preferred-training-students" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminPreferredTrainingButton onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-attendance-stdinfo" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminAttendanceStdinfo onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-train-attendance-stuinfo" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminTrainAttendanceStuinfo onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-student-certificates/:studentId" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdStuDBCertificateView onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-company-profile" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminCompanyprofile onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-company-profile/manage/add" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminCompanyprofilePopup onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-company-profile/manage/edit/:companyId" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminCompanyprofilePopup onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-company-profile/manage/view/:companyId" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminCompanyprofilePopup onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-company-drive" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminCompanyDrive onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin/company-drive/add" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminCompanyDriveAD onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin/company-drive/details" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminCompanyDrivedet onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin/active-zip/:driveId" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdActiveZip onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin/active-zip/department/:deptId" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdZipActiveBatchesDepartment onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin/zipped-batches" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdZippedBatches onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin/zipped-batch/departments/:archiveId" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdZippedBatchDepartmentsView onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin/zipped-batch/department/:deptId" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdZippedBatchDepartmentStudents onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin/zipped-batch/department-details/:deptId" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdZippedBatchDepartmentDetails onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin/zipping-history" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdZippingHistory onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
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
      <Route path="/admin-student-view/:studentId" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminStuProfileView onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-student-edit/:studentId" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminStuProfileEdit onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-semester-marksheet-view/:studentId" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminSemesterMarksheetView onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />
      <Route path="/admin-semester-edit/:studentId" element={<RoleGuard allowedRoles={['admin']}><RouteErrorBoundary><Suspense fallback={<LoadingSpinner message="Loading..." showAnimatedDots={true} />}><AdminSemesterMarksheetEdit onLogout={() => navigate('/')} /></Suspense></RouteErrorBoundary></RoleGuard>} />

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
