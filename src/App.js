import React, { useState } from "react";
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

  const handleLogin = (email, password) => {
    if (email && password) {
      setUserEmail(email);
      setIsLoggedIn(true);
    } else {
      alert("Please enter both email and password");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail("");
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
    </div>
  );
}

export default App;
