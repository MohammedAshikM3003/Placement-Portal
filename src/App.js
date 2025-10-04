import React, { useState } from "react";
<<<<<<< HEAD
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";

// Import all components
import LandingPage from "./LandingPage.js";
import PlacementPortalLogin from "./mainlogin.js";
import MainSignUp from "./MainSingUp.js";
import PlacementPortalDashboard from "./dashboard.js";
import Resume from "./resume.js";
import Attendance from "./Attendance.js";
import Achievements from "./Achievements.js";
import Company from "./company.js";
import StuProfile from "./StuProfile.js";
import MainRegistration from "./MainRegistration.js";

// This component now contains the main application logic
function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const navigate = useNavigate();
=======
import PlacementPortalLogin from "./mainlogin.js";
import MainSignUp from "./MainSingUp.js";
import PlacementPortalDashboard from "./dashboard.js";
import PlacementPortal from "./resume.js";
import Attendance from "./Attendance.js";
import Achievements from "./Achievements.js";
import Company from "./company.js";
import StuProfile from "./StuProfile.js";  // Import your profile component
import MainRegistration from "./MainRegistration.js"; // Import your registration component

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [currentView, setCurrentView] = useState("dashboard");
  const [authView, setAuthView] = useState("login");
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c

  const handleLogin = (email, password) => {
    if (email && password) {
      setUserEmail(email);
      setIsLoggedIn(true);
<<<<<<< HEAD
      navigate("/dashboard");
=======
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
    } else {
      alert("Please enter both email and password");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail("");
<<<<<<< HEAD
    navigate("/"); // Redirect to landing page on logout
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

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
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

      {/* Authenticated Routes */}
      {isLoggedIn ? (
        <>
          <Route path="/dashboard" element={<PlacementPortalDashboard onLogout={handleLogout} userEmail={userEmail} onViewChange={handleViewChange} />} />
          <Route path="/resume" element={<Resume onLogout={handleLogout} onViewChange={handleViewChange} />} />
          <Route path="/attendance" element={<Attendance onLogout={handleLogout} onViewChange={handleViewChange} />} />
          <Route path="/achievements" element={<Achievements onLogout={handleLogout} onViewChange={handleViewChange} />} />
          <Route path="/company" element={<Company onLogout={handleLogout} onViewChange={handleViewChange} />} />
          <Route path="/profile" element={<StuProfile onLogout={handleLogout} onViewChange={handleViewChange} />} />
        </>
      ) : (
        // Redirect to the login page if the user is not logged in and tries to access a protected route
        <Route path="*" element={<PlacementPortalLogin onLogin={handleLogin} onNavigateToSignUp={() => navigate("/signup")} />} />
      )}
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
=======
    setCurrentView("dashboard");
    setAuthView("login");
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  const showSignUp = () => setAuthView("signup");
  const showLogin = () => setAuthView("login");

  const renderAuth = () => {
    return authView === "login" ? (
      <PlacementPortalLogin onLogin={handleLogin} onNavigateToSignUp={showSignUp} />
    ) : (
      <MainSignUp onNavigateToLogin={showLogin} />
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "resume":
        return <PlacementPortal onLogout={handleLogout} onViewChange={handleViewChange} currentView={currentView} />;
      case "attendance":
        return <Attendance onLogout={handleLogout} onViewChange={handleViewChange} currentView={currentView} />;
      case "achievements":
        return <Achievements onLogout={handleLogout} onViewChange={handleViewChange} currentView={currentView} />;
      case "company":
        return <Company onLogout={handleLogout} onViewChange={handleViewChange} currentView={currentView} />;
      case "profile":
        return <StuProfile onLogout={handleLogout} onViewChange={handleViewChange} currentView={currentView} />;
      case "MainRegistration":
        return <MainRegistration onLogout={handleLogout} onViewChange={handleViewChange} currentView={currentView} />;
      case "dashboard":
      default:
        return <PlacementPortalDashboard
          onLogout={handleLogout}
          userEmail={userEmail}
          onViewChange={handleViewChange}
          currentView={currentView}
        />;
    }
  };

  return (
    <div className="App">
      {isLoggedIn ? renderCurrentView() : renderAuth()}
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
    </div>
  );
}

<<<<<<< HEAD
export default App;
=======
export default App;
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
