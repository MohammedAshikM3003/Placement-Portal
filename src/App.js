import React, { useState, useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import RegistrationDebug from "./components/RegistrationDebug.js";
import authService from "./services/authService.js";
import AnimatedLoader from "./components/AnimatedLoader.js";

// Import lightweight components directly
import LandingPage from "./LandingPage.js";
import PlacementPortalLogin from "./mainlogin.js";
import MainSignUp from "./MainSingUp.js";
import MainRegistration from "./MainRegistration.js";
import CoordinatorAccess from "./CoordinatorAccess.js";

// Lazy load Student components
const PlacementPortalDashboard = lazy(() => import("./Student Pages/dashboard.js"));
const Resume = lazy(() => import("./Student Pages/resume.js"));
const Attendance = lazy(() => import("./Student Pages/Attendance.js"));
const Achievements = lazy(() => import("./Student Pages/achievements.js"));
const Company = lazy(() => import("./Student Pages/company.js"));
const StuProfile = lazy(() => import("./Student Pages/StuProfile.js"));

// Coordinator components are now loaded through CoordinatorMain.js

// This component now contains the main application logic
function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [userDepartment, setUserDepartment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

      // Check MongoDB authentication
      useEffect(() => {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        
        console.log('App.js - Checking auth state:', { isLoggedIn, studentData }); // Debug log
        
        if (isLoggedIn && studentData) {
          setIsLoggedIn(true);
          setUserEmail(studentData.primaryEmail || studentData.email || '');
          setUserRole('student');
          setUserDepartment(studentData.branch || '');
          console.log('App.js - User authenticated:', studentData.firstName, studentData.lastName); // Debug log
        } else {
          setIsLoggedIn(false);
          setUserEmail('');
          setUserRole('');
          setUserDepartment('');
          console.log('App.js - User not authenticated'); // Debug log
        }
        setIsLoading(false);
      }, []);

  const handleLogin = (regNo, password) => {
    // This function is called after successful authentication
    console.log('Login successful for:', regNo);
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
  
  // Handlers for navigation
  const handleViewChange = (view) => {
    // You can use a switch or if/else here to navigate to the correct route
    navigate(`/${view}`);
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

      {/* Coordinator Routes - Available without authentication for now */}
      <Route path="/coo-dashboard" element={<CoordinatorAccess />} />
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