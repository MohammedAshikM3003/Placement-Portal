import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MainRegistration from "./MainRegistration.jsx";
import MainRegistrationPopUp from "./MainRegistrationPopUp.jsx";
import { FaGraduationCap } from "react-icons/fa";
import loginImage from "./assets/student1.png";
import mainloginicon from "./assets/mainloginicon.png";
import Navbar from "./components/Navbar/LandingNavbar.js";
import styles from "./MainSingUp.module.css"; // Import the CSS Module

const MainSignUp = ({ onNavigateToLogin, onNavigateToCoordinator }) => {
  const navigate = useNavigate();
  const [showUgRegistration, setShowUgRegistration] = useState(false);
  const [showRegistrationPopup, setShowRegistrationPopup] = useState(false);

  const handleUgClick = () => { setShowRegistrationPopup(true); };
  const handlePopupContinue = () => { setShowRegistrationPopup(false); setShowUgRegistration(true); };
  const handlePopupBack = () => { setShowRegistrationPopup(false); };
  const handleCoordinatorClick = () => { navigate('/coo-dashboard'); };
  const handleAdminClick = () => { navigate('/admin-dashboard'); }; // Added missing handler

  if (showUgRegistration) {
    return <MainRegistration />;
  }

  return (
    <div className={styles.pageContainer}>
      <Navbar />
      <div className={styles.mainLayout}>
        
        {/* Signup Box */}
        <div className={styles.signupBox}>
          <div className={styles.logoContainer}>
            <img
              src={mainloginicon}
              alt="Form Logo"
              className={styles.logoImage}
            />
          </div>
          
          {/* UG Button */}
          <button
            onClick={handleUgClick}
            className={styles.signupButton}
            style={{ color: "#197AFF", marginBottom: "20px" }}
          >
            <FaGraduationCap /> UNDER GRADUATE (UG)
          </button>
          
          {/* PG Button */}
          <button
            className={styles.signupButton}
            style={{ color: "#2568C5", marginBottom: "20px" }}
          >
            <FaGraduationCap /> POST GRADUATE (PG)
          </button>
          
          <div className={styles.footerText}>
            Already have an account?{" "}
            <a
              href="#!"
              onClick={onNavigateToLogin}
              className={styles.link}
            >
              Login
            </a>
          </div>
        </div>

        {/* Right Image */}
        <div className={styles.rightImageContainer}>
          <img
            src={loginImage}
            alt="Visual"
            className={styles.visualImage}
          />
        </div>
      </div>
      
      {showRegistrationPopup && (
        <MainRegistrationPopUp onContinue={handlePopupContinue} onBack={handlePopupBack} />
      )}
    </div>
  );
};

export default MainSignUp;