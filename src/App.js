import React, { useState } from "react";
import PlacementPortalLogin from "./mainlogin.js";
import PlacementPortalDashboard from "./dashboard.js";
import PlacementPortal from "./resume.js";
import Attendance from "./Attendance.js";
import Achievements from "./Achievements.js";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [currentView, setCurrentView] = useState("dashboard");

  const handleLogin = (email, password) => {
    // Simple validation - in a real app, you'd validate against a backend
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
  };

  const handleViewChange = (view) => {
    console.log("View changing to:", view);
    setCurrentView(view);
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
      {isLoggedIn ? renderCurrentView() : <PlacementPortalLogin onLogin={handleLogin} />}
    </div>
  );
}

export default App;
