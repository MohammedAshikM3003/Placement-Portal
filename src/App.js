<<<<<<< HEAD
import React from 'react';
import PlacementPortalDashboard from './studentdashboard';
=======
import React, { useState } from "react";
import PlacementPortalLogin from "./mainlogin.js";
import PlacementPortalDashboard from "./dashboard.js";
import PlacementPortal from "./resume.js";
>>>>>>> dfa1406c718f75a82cbdc73bfb07e0cc1ad95c20

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
<<<<<<< HEAD
      <PlacementPortalDashboard />
=======
      {isLoggedIn ? (
        currentView === "resume" ? (
          <PlacementPortal onLogout={handleLogout} onViewChange={handleViewChange} />
        ) : (
          <PlacementPortalDashboard
            onLogout={handleLogout}
            userEmail={userEmail}
            onViewChange={handleViewChange}
          />
        )
      ) : (
        <PlacementPortalLogin onLogin={handleLogin} />
      )}
>>>>>>> dfa1406c718f75a82cbdc73bfb07e0cc1ad95c20
    </div>
  );
}

export default App;
