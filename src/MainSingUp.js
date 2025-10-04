import React, { useState } from "react";
import MainRegistration from "./MainRegistration.js";
import MainRegistrationPopUp from "./MainRegistrationPopUp.js";
import {
  FaGraduationCap,
} from "react-icons/fa";
import loginImage from "./assets/student1.png";
import Adminicon from "./assets/Adminicon.png";
import mainloginicon from "./assets/mainloginicon.png";
import Navbar from "./components/Navbar/LandingNavbar.js"; // Adjust the path as needed

const MainSignUp = ({ onNavigateToLogin }) => {
  const [showUgRegistration, setShowUgRegistration] = useState(false);
  const [showRegistrationPopup, setShowRegistrationPopup] = useState(false);

  const handleUgClick = () => {
    setShowRegistrationPopup(true);
  };

  const handlePopupContinue = () => {
    setShowRegistrationPopup(false);
    setShowUgRegistration(true);
  };

  const handlePopupBack = () => {
    setShowRegistrationPopup(false);
  };

  if (showUgRegistration) {
    return <MainRegistration />;
  }

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f5f7fc",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar /> {/* Use the shared Navbar component here */}
      <div
        className="main-layout"
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "40px 80px",
          overflow: "hidden",
        }}
      >
        <div className="signup-box">
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <img
              src={mainloginicon}
              alt="Form Logo"
              style={{ height: 90, width: 90, objectFit: "contain" }}
            />
          </div>
          <button
            onClick={handleUgClick}
            className="signup-button"
            style={{ color: "#197AFF", marginBottom: "20px" }}
          >
            <FaGraduationCap /> UNDER GRADUATE (UG)
          </button>
          <button
            className="signup-button"
            style={{ color: "#2568C5", marginBottom: "30px" }}
          >
            <FaGraduationCap /> POST GRADUATE (PG)
          </button>
          <div style={{ fontSize: "16px", textAlign: "center" }}>
            Already have an account?{" "}
            <a
              href="#!"
              onClick={onNavigateToLogin}
              style={{
                color: "#5932EA",
                fontWeight: "bold",
                textDecoration: "none",
              }}
            >
              Login
            </a>
          </div>
        </div>

        <div
          className="right-image-container"
          style={{
            flex: "1",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <img
            src={loginImage}
            alt="Visual"
            style={{
              width: "100%",
              maxWidth: 700,
              height: "auto",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        .signup-box {
          width: 420px;
          min-height: 450px;
          background: #ffffff;
          border-radius: 24px;
          padding: 40px 32px;
          box-shadow: 0 8px 32px rgba(89, 50, 234, 0.15);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          transition: 0.3s ease;
          flex-shrink: 0;
        }
        .signup-box:hover {
          box-shadow: 0 0 35px rgba(89, 50, 234, 0.9), 0 0 15px rgba(89, 50, 234, 0.4);
          transform: translateY(-5px);
        }
        .signup-button {
          width: 100%;
          padding: 18px 0;
          border-radius: 16px;
          border: 2px solid #ded5fa;
          background: #fff;
          font-weight: 700;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: center;
          transition: all 0.2s ease-in-out;
        }
        .signup-button:hover {
          color: #fff !important;
          background: #5932EA;
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(89, 50, 234, 0.4);
          border-color: #5932EA;
        }
        @media (max-width: 1024px) {
          .main-layout {
            flex-direction: column;
            justify-content: center;
            padding: 30px;
          }
          .right-image-container {
            display: none;
          }
        }
        @media (max-width: 768px) {
          nav { padding: 15px 20px !important; }
          .logo-text { font-size: 1.2rem !important; }
          .nav-items { display: none !important; }
          .main-layout { padding: 20px; }
          .signup-box {
            width: 100%;
            padding: 30px 24px;
            box-shadow: none;
            border: 1px solid #e1e5e9;
            min-height: auto;
          }
        }
      `}</style>
      
      {showRegistrationPopup && (
        <MainRegistrationPopUp onContinue={handlePopupContinue} onBack={handlePopupBack} />
      )}
    </div>
  );
};

export default MainSignUp;