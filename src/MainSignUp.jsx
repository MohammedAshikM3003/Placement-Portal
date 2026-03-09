import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainRegistration from "./MainRegistration.jsx";
import MainRegistrationPopUp from "./MainRegistrationPopUp.jsx";
import Navbar from "./components/Navbar/LandingNavbar.js";
import styles from "./MainSignUp.module.css";
import { changeFavicon, FAVICON_TYPES } from './utils/faviconUtils';
import loginDripsImg from './assets/logindrips.svg';
import SignupInteractiveBackground from './components/SignupInteractiveBackground/SignupInteractiveBackground.jsx';

const MainSignUp = ({ onNavigateToLogin, onNavigateToCoordinator }) => {
  const navigate = useNavigate();
  const [showUgRegistration, setShowUgRegistration] = useState(false);
  const [showRegistrationPopup, setShowRegistrationPopup] = useState(false);

  // Change favicon to default (purple) for signup page
  useEffect(() => {
    changeFavicon(FAVICON_TYPES.DEFAULT);
  }, []);

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
        <img src={loginDripsImg} alt="" className={styles.dripDecoration} />
        
        {/* Shadow frame */}
        <div className={styles.shadowFrame}>
          {/* Left side - Signup Form */}
          <div className={styles.leftSide}>
            <div className={styles.leftSection}>
              <div className={styles.signupFormArea}>
                <h1 className={styles.signupTitle}>SIGN UP</h1>
                
                {/* UG Button - aligned to Register Number field position */}
                <div className={styles.buttonField}>
                  <span className={styles.buttonFieldLabel}>&nbsp;</span>
                  <button
                    onClick={handleUgClick}
                    className={styles.ugButton}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="16" viewBox="0 0 640 512"><path fill="currentColor" d="M320 32c-8.1 0-16.1 1.4-23.7 4.1L15.8 137.4C6.3 140.9 0 149.9 0 160s6.3 19.1 15.8 22.6l57.9 20.9C57.3 229.3 48 259.8 48 291.9V320c0 28.4-10.8 57.7-22.3 80.8c-6.5 13-13.9 25.8-22.5 37.6c-3.2 4.3-4.1 9.9-2.3 15s6 8.9 11.2 10.2l64 16c4.2 1.1 8.7.3 12.4-2s6.3-6.1 7.1-10.4c8.6-42.8 4.3-81.2-2.1-108.7c-3.2-14.2-7.5-28.7-13.5-42v-24.6c0-30.2 10.2-58.7 27.9-81.5c12.9-15.5 29.6-28 49.2-35.7l157-61.7c8.2-3.2 17.5.8 20.7 9s-.8 17.5-9 20.7l-157 61.7c-12.4 4.9-23.3 12.4-32.2 21.6l159.6 57.6c7.6 2.7 15.6 4.1 23.7 4.1s16.1-1.4 23.7-4.1l280.6-101c9.5-3.4 15.8-12.5 15.8-22.6s-6.3-19.1-15.8-22.6L343.7 36.1c-7.6-2.7-15.6-4.1-23.7-4.1M128 408c0 35.3 86 72 192 72s192-36.7 192-72l-15.3-145.4L354.5 314c-11.1 4-22.8 6-34.5 6s-23.5-2-34.5-6l-142.2-51.4z"/></svg>
                    UNDER GRADUATE (UG)
                  </button>
                </div>
                
                {/* PG Button - aligned to Password field position */}
                <div className={styles.buttonField}>
                  <span className={styles.buttonFieldLabel}>&nbsp;</span>
                  <button
                    className={styles.pgButton}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="16" viewBox="0 0 640 512"><path fill="currentColor" d="M320 32c-8.1 0-16.1 1.4-23.7 4.1L15.8 137.4C6.3 140.9 0 149.9 0 160s6.3 19.1 15.8 22.6l57.9 20.9C57.3 229.3 48 259.8 48 291.9V320c0 28.4-10.8 57.7-22.3 80.8c-6.5 13-13.9 25.8-22.5 37.6c-3.2 4.3-4.1 9.9-2.3 15s6 8.9 11.2 10.2l64 16c4.2 1.1 8.7.3 12.4-2s6.3-6.1 7.1-10.4c8.6-42.8 4.3-81.2-2.1-108.7c-3.2-14.2-7.5-28.7-13.5-42v-24.6c0-30.2 10.2-58.7 27.9-81.5c12.9-15.5 29.6-28 49.2-35.7l157-61.7c8.2-3.2 17.5.8 20.7 9s-.8 17.5-9 20.7l-157 61.7c-12.4 4.9-23.3 12.4-32.2 21.6l159.6 57.6c7.6 2.7 15.6 4.1 23.7 4.1s16.1-1.4 23.7-4.1l280.6-101c9.5-3.4 15.8-12.5 15.8-22.6s-6.3-19.1-15.8-22.6L343.7 36.1c-7.6-2.7-15.6-4.1-23.7-4.1M128 408c0 35.3 86 72 192 72s192-36.7 192-72l-15.3-145.4L354.5 314c-11.1 4-22.8 6-34.5 6s-23.5-2-34.5-6l-142.2-51.4z"/></svg>
                    POST GRADUATE (PG)
                  </button>
                </div>
                
                <p className={styles.footerText}>
                  <span>Already have an account?</span>{" "}
                  <a
                    href="#!"
                    onClick={onNavigateToLogin}
                    className={styles.link}
                  >
                    Login
                  </a>
                </p>
              </div>
            </div>
          </div>
          
          {/* Right side - Interactive Background */}
          <div className={styles.rightSide}>
            <SignupInteractiveBackground />
          </div>
        </div>
      </div>
      
      {showRegistrationPopup && (
        <MainRegistrationPopUp onContinue={handlePopupContinue} onBack={handlePopupBack} />
      )}
    </div>
  );
};

export default MainSignUp;