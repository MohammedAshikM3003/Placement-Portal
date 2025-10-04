import React, { useState } from "react";
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

  const handleLogin = (email, password) => {
    if (email && password) {
      setUserEmail(email);
      setIsLoggedIn(true);
      navigate("/dashboard");
    } else {
      alert("Please enter both email and password");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail("");
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
    </div>
  );
}

export default App;