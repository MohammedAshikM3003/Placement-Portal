import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import RegistrationDebug from "./components/RegistrationDebug.jsx";
import AnimatedLoader from "./components/AnimatedLoader.jsx";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

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
import AdminABM from "./AdminPages/AdAddBranchMainPage.jsx";
import AdminABN from "./AdminPages/AdAddBranchPage.jsx";
import Admainprofile from "./AdminPages/AdminmainProfile.jsx";
import AdminStuProfile from "./AdminPages/AdminEsprofile.jsx"; 
import AdminEsstudapp from "./AdminPages/AdminEsstudapp.jsx";
import AdminCoDet from "./AdminPages/AdAddCoordinatorform.jsx";
import AdExistingCoordinator from "./AdminPages/AdExistingCoordinator.jsx";
import AdminABcoodet from "./AdminPages/AdminABviewcoo.jsx";

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
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    setIsLoading(authLoading);
  }, [authLoading]);

  const handleStudentLogin = () => {
    if (authUser) {
      setUserEmail(authUser.primaryEmail || authUser.email || '');
      setUserDepartment(authUser.branch || '');
    }
  };

  const handleStudentLogout = async () => {
    await authLogout?.();
    setUserEmail("");
    setUserDepartment("");
    navigate("/");
  };

  const coordinatorProtectedElement = (element) => {
    if (isCoordinatorLoggedIn) {
      return element;
    }
    return <PlacementPortalLogin onLogin={handleStudentLogin} onNavigateToSignUp={() => navigate("/signup")} />;
  };

  if (isLoading) return <AnimatedLoader />;

  return (
    <Routes>
      {/* PUBLIC ROUTES */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/mainlogin" element={<PlacementPortalLogin onLogin={handleStudentLogin} onNavigateToSignUp={() => navigate("/signup")} />} />
      <Route path="/signup" element={<MainSignUp onNavigateToLogin={() => navigate("/mainlogin")} onStartRegistration={() => navigate("/registration")} />} />
      <Route path="/registration" element={<MainRegistration onNavigateToLogin={() => navigate("/mainlogin")} />} />
      <Route path="/registration-debug" element={<RegistrationDebug />} />

      {/* STUDENT AUTHENTICATED ROUTES */}
      {isStudentLoggedIn ? (
        <>
          <Route path="/dashboard" element={<Suspense fallback={<AnimatedLoader />}><PlacementPortalDashboard onLogout={handleStudentLogout} userEmail={userEmail} onViewChange={(v) => navigate(`/${v}`)} /></Suspense>} />
          <Route path="/resume" element={<Suspense fallback={<AnimatedLoader />}><Resume onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense>} />
          <Route path="/attendance" element={<Suspense fallback={<AnimatedLoader />}><Attendance onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense>} />
          <Route path="/achievements" element={<Suspense fallback={<AnimatedLoader />}><Achievements onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense>} />
          <Route path="/company" element={<Suspense fallback={<AnimatedLoader />}><Company onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense>} />
          <Route path="/profile" element={<Suspense fallback={<AnimatedLoader />}><StuProfile onLogout={handleStudentLogout} onViewChange={(v) => navigate(`/${v}`)} /></Suspense>} />
        </>
      ) : (
        <Route path="/dashboard" element={<PlacementPortalLogin onLogin={handleStudentLogin} onNavigateToSignUp={() => navigate("/signup")} />} />
      )}

      {/* COORDINATOR AUTHENTICATED ROUTES */}
      <Route path="/coo-dashboard" element={coordinatorProtectedElement(<CoordinatorDashboard onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} />)} />
      <Route path="/coo-manage-students" element={coordinatorProtectedElement(<CoordinatorManageStudents onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} />)} />
      <Route path="/coo-company-profile" element={coordinatorProtectedElement(<CoordinatorCompanyProfile onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} />)} />
      <Route path="/coo-company-drive" element={coordinatorProtectedElement(<CoordinatorCompanyDrive onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} />)} />
      <Route path="/coo-certificate-verification" element={coordinatorProtectedElement(<CoordinatorCertificateVerification onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} />)} />
      <Route path="/coo-eligible-students" element={coordinatorProtectedElement(<CoordinatorEligibleStudents onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} />)} />
      <Route path="/coo-attendance" element={coordinatorProtectedElement(<CoordinatorAttendance onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} />)} />
      <Route path="/coo-placed-students" element={coordinatorProtectedElement(<CoordinatorPlacedStudents onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} />)} />
      <Route path="/coo-report-analysis" element={coordinatorProtectedElement(<CoordinatorReportAnalysisCW onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} />)} />
      <Route path="/coo-report-analysis-cw" element={coordinatorProtectedElement(<CoordinatorReportAnalysisCW onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} />)} />
      <Route path="/coo-report-analysis-rw" element={coordinatorProtectedElement(<CoordinatorReportAnalysisRW onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} />)} />
      <Route path="/coo-report-analysis-sw" element={coordinatorProtectedElement(<CoordinatorReportAnalysisSW onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} />)} />
      <Route path="/coo-manage-students-semester" element={coordinatorProtectedElement(<CoordinatorManageStudentsSemester onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} />)} />
      <Route path="/coo-profile" element={coordinatorProtectedElement(<CoordinatorProfile onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} />)} />
      <Route path="/coo-manage-students/view" element={coordinatorProtectedElement(<CoordinatorManageStudentView onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} />)} />
      <Route path="/coo-manage-students/edit" element={coordinatorProtectedElement(<CoordinatorManageStudentEdit onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} />)} />
      <Route path="/coo-eligible-students/view" element={coordinatorProtectedElement(<CoordinatorEligibleStudentView onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} />)} />
      <Route path="/coo-placed-students/view" element={coordinatorProtectedElement(<CoordinatorPlacedStudentView onLogout={handleStudentLogout} onViewChange={(view) => navigate(`/coo-${view}`)} />)} />

      {/* ADMIN ROUTES */}
      <Route path="/admin-dashboard" element={<AdminDashboard onLogout={() => navigate('/')} />} />
      <Route path="/admin-student-database" element={<AdminstudDB onLogout={() => navigate('/')} />} />
      <Route path="/admin-profile/:studentId" element={<AdminDBprofile onLogout={() => navigate('/')} />} />
      <Route path="/admin-company-profile" element={<AdminCompanyprofile onLogout={() => navigate('/')} />} />
      <Route path="/admin-company-drive" element={<AdminCompanyDrive onLogout={() => navigate('/')} />} />
      <Route path="/admin/company-drive/add" element={<AdminCompanyDriveAD onLogout={() => navigate('/')} />} />
      <Route path="/admin/company-drive/details" element={<AdminCompanyDrivedet onLogout={() => navigate('/')} />} />
      <Route path="/admin-eligible-students" element={<AdminEligiblestudents onLogout={() => navigate('/')} />} />
      <Route path="/admin-attendance" element={<AdminAtt onLogout={() => navigate('/')} />} />
      <Route path="/admin-placed-students" element={<AdminPlacedStudents onLogout={() => navigate('/')} />} />
      <Route path="/admin-report-analysis-rarw" element={<AdminRARW onLogout={() => navigate('/')} />} />
      <Route path="/admin-add-branch-main" element={<AdminABM onLogout={() => navigate('/')} />} />
      <Route path="/admin-add-branch" element={<AdminABN onLogout={() => navigate('/')} />} />
      <Route path="/admin-profile-main" element={<Admainprofile onLogout={() => navigate('/')} />} />
      <Route path="/AdminEsprofile/:studentId" element={<AdminStuProfile onLogout={() => navigate('/')} />} />
      <Route path="/admin-student-application" element={<AdminEsstudapp onLogout={() => navigate('/')} />} />
      <Route path="/admin-coordinator-detail" element={<AdminCoDet onLogout={() => navigate('/')} />} />
      <Route path="/admin-manage-coordinators/:branchCode" element={<AdExistingCoordinator onLogout={() => navigate('/')} />} />
      <Route path="/admin-view-coordinator/:coordinatorId" element={<AdminABcoodet onLogout={() => navigate('/')} />} />

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