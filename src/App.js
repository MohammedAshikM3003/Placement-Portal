import React, { useState } from "react";
import PlacementPortalLogin from "./mainlogin.js";
import MainSignUp from "./MainSingUp.js"; // Correctly import the new sign-up component
import PlacementPortalDashboard from "./dashboard.js";
import PlacementPortal from "./resume.js";
import Attendance from "./Attendance.js";
import Achievements from "./Achievements.js";
import Company from "./company.js";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [currentView, setCurrentView] = useState("dashboard");
  const [authView, setAuthView] = useState("login"); // 'login' or 'signup'

  const handleLogin = (email, password) => {
    if (email && password) {
      setUserEmail(email);
      setIsLoggedIn(true);
      console.log("Login successful, switching to dashboard");
    } else {
      alert("Please enter both email and password");
    }
  };

  const handleLogout = () => {
    console.log("Logout clicked, returning to login");
    setIsLoggedIn(false);
    setUserEmail("");
    setCurrentView("dashboard");
    setAuthView("login"); // Reset to login view on logout
  };

  const handleViewChange = (view) => {
    console.log("View changing to:", view);
    setCurrentView(view);
  };

  // Functions to switch between login and sign-up screens
  const showSignUp = () => setAuthView("signup");
  const showLogin = () => setAuthView("login");

  const renderAuth = () => {
    if (authView === "login") {
      return <PlacementPortalLogin onLogin={handleLogin} onNavigateToSignUp={showSignUp} />;
    }
    return <MainSignUp onNavigateToLogin={showLogin} />;
  };

  const renderCurrentView = () => {
    console.log("Rendering view:", currentView);
    switch (currentView) {
      case "resume":
        return <PlacementPortal onLogout={handleLogout} onViewChange={handleViewChange} currentView={currentView} />;
      case "attendance":
        return <Attendance onLogout={handleLogout} onViewChange={handleViewChange} currentView={currentView} />;
      case "achievements":
        return <Achievements onLogout={handleLogout} onViewChange={handleViewChange} currentView={currentView} />;
      case "company":
        return <Company onLogout={handleLogout} onViewChange={handleViewChange} currentView={currentView} />;
      case "dashboard":
      default:
        return (
          <PlacementPortalDashboard
            onLogout={handleLogout}
            userEmail={userEmail}
            onViewChange={handleViewChange}
            currentView={currentView}
          />
        );
    }
  };

  return (
    <div className="App">
      {isLoggedIn ? renderCurrentView() : renderAuth()}
    </div>
  );
}

export default App;