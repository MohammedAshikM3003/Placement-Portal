import React, { useState } from "react";
import PlacementPortalLogin from "./mainlogin.js";
import PlacementPortalDashboard from "./dashboard.js";
import PlacementPortal from "./resume.js";
import Attendance from "./Attendance.js";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [currentView, setCurrentView] = useState("dashboard");

  const handleLogin = (email, password) => {
    // Simple validation - in a real app, you'd validate against a backend
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
  };

  const handleViewChange = (view) => {
    console.log("View changing to:", view);
    setCurrentView(view);
  };

  return (
    <div className="App">
      {isLoggedIn ? (
        currentView === "resume" ? (
          <PlacementPortal onLogout={handleLogout} onViewChange={handleViewChange} currentView={currentView} />
        ) : currentView === "attendance" ? (
          <Attendance onLogout={handleLogout} onViewChange={handleViewChange} currentView={currentView} />
        ) : (
          <PlacementPortalDashboard
            onLogout={handleLogout}
            userEmail={userEmail}
            onViewChange={handleViewChange}
            currentView={currentView}
          />
        )
      ) : (
        <PlacementPortalLogin onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
