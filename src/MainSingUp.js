<<<<<<< HEAD
import React, { useState } from "react";
import MainRegistration from "./MainRegistration.js";
import MainRegistrationPopUp from "./MainRegistrationPopUp.js";
import {
  FaGraduationCap,
=======
import React, { useState } from "react"; // 1. IMPORT useState
import MainRegistration from "./MainRegistration.js";
import {
  FaGraduationCap,
  FaHome,
  FaInfo,
  FaStar,
  FaEnvelope,
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
} from "react-icons/fa";
import loginImage from "./assets/student1.png";
import Adminicon from "./assets/Adminicon.png";
import mainloginicon from "./assets/mainloginicon.png";
<<<<<<< HEAD
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

=======

// Renamed component and accept navigation prop
const MainSignUp = ({ onNavigateToLogin }) => {
  // 2. ADD STATE TO MANAGE VIEW
  const [showUgRegistration, setShowUgRegistration] = useState(false);

  // Function to handle the UG button click
  const handleUgClick = () => {
    setShowUgRegistration(true); // This will trigger the re-render
  };

  // 3. ADD CONDITIONAL RENDERING
  // If showUgRegistration is true, render the MainRegistration component
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
  if (showUgRegistration) {
    return <MainRegistration />;
  }

<<<<<<< HEAD
=======
  // Otherwise, render the default sign-up page
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f5f7fc",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
<<<<<<< HEAD
      }}
    >
      <Navbar /> {/* Use the shared Navbar component here */}
=======
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Navbar */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          background: "#5932EA",
          color: "#fff",
          padding: "15px 32px 15px 26px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <img
            src={Adminicon}
            alt="Logo"
            style={{
              height: 35,
              width: 35,
              objectFit: "contain",
              marginRight: 18,
              filter: "brightness(0) invert(1)",
            }}
          />
          <span
            style={{
              fontWeight: "bold",
              fontSize: "1.48rem",
              color: "#fff",
              lineHeight: 1,
              letterSpacing: "0.5px",
            }}
          >
            Placement Portal
          </span>
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 28,
            fontSize: 17,
            cursor: "pointer",
            userSelect: "none",
            color: "#fff",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <FaHome /> Home
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <FaInfo /> About
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <FaStar /> Features
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <FaEnvelope /> Contact
          </span>
        </div>
      </nav>
      {/* Main Section */}
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
      <div
        className="main-layout"
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
<<<<<<< HEAD
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
=======
          padding: "60px 80px 60px 80px",
          flexWrap: "wrap",
          marginTop: "0px",
        }}
      >
        {/* Login Box (Left) */}
        <div className="login-box">
          <div style={{ textAlign: "center", marginBottom: "62px" }}>
            <img
              src={mainloginicon}
              alt="Form Logo"
              style={{
                height: 90,
                width: 90,
                objectFit: "contain",
                display: "block",
                marginTop: "-100px",
              }}
            />
          </div>
          {/* 4. ATTACH THE onClick HANDLER TO THE UG BUTTON */}
          <button
            onClick={handleUgClick}
            className="login-button"
            style={{
              color: "#197AFF",
              marginBottom: "40px",
            }}
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
          >
            <FaGraduationCap /> UNDER GRADUATE (UG)
          </button>
          <button
<<<<<<< HEAD
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
=======
            className="login-button"
            style={{
              color: "#2568C5",
              marginBottom: "40px",
            }}
          >
            <FaGraduationCap /> POST GRADUATE (PG)
          </button>
          {/* === LOGIN LINK MODIFIED HERE === */}
          <div
            style={{
              marginTop: "0px",
              fontSize: "16px",
              color: "#333",
              textAlign: "center",
            }}
          >
            Already have an account?{" "}
            <a
              href="#!" // Prevent page reload
              onClick={onNavigateToLogin} // Call the navigation function
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
              style={{
                color: "#5932EA",
                fontWeight: "bold",
                textDecoration: "none",
<<<<<<< HEAD
=======
                cursor: "pointer", // Add pointer cursor
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
              }}
            >
              Login
            </a>
          </div>
<<<<<<< HEAD
        </div>

        <div
          className="right-image-container"
          style={{
            flex: "1",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
=======

          {/* === NEW BUTTONS ADDED HERE === */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
              marginTop: "20px",
              width: "100%",
            }}
          >
            <button
              style={{
                backgroundColor: "#28a745",
                color: "#fff",
                border: "none",
                borderRadius: "16px",
                padding: "14px 0",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Admin
            </button>
            <button
              style={{
                backgroundColor: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: "16px",
                padding: "14px 0",
                fontSize: "16px",
                fontWeight: "bold",
                cursor: "pointer",
                width: "100%",
              }}
            >
              Co-Ordinator
            </button>
          </div>
          {/* === END OF NEW BUTTONS === */}
        </div>

        {/* Image Illustration (Right) */}
        <div
          style={{
            flex: "0 0 50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "calc(100vh - 70px)",
            transform: "translateY(0px)",
            position: "relative",
            marginTop: "20px",
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
          }}
        >
          <img
            src={loginImage}
<<<<<<< HEAD
            alt="Visual"
            style={{
              width: "100%",
              maxWidth: 700,
              height: "auto",
              maxHeight: "100%",
              objectFit: "contain",
=======
            alt="Login Visual"
            style={{
              width: "100%",
              maxWidth: 700,
              minWidth: 650,
              height: "auto",
              objectFit: "contain",
              filter: "brightness(1.1) contrast(0.9)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "40%",
              background:
                "linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.3))",
              pointerEvents: "none",
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
            }}
          />
        </div>
      </div>
<<<<<<< HEAD

      <style>{`
        * { box-sizing: border-box; }
        .signup-box {
          width: 420px;
          min-height: 450px;
          background: #ffffff;
          border-radius: 24px;
          padding: 40px 32px;
=======
      {/* Custom Styles for Card Hover & Responsiveness */}
      <style>{`
        * {
          box-sizing: border-box;
        }

        .login-box {
          width: 420px;
          min-height: 596px;
          background: #ffffff;
          border-radius: 24px;
          padding: 56px 32px;
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
          box-shadow: 0 8px 32px rgba(89, 50, 234, 0.15);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          transition: 0.3s ease;
<<<<<<< HEAD
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
=======
          position: relative;
          z-index: 1;
          
        }

        .login-box:hover {
          box-shadow: 0 0 35px rgba(89, 50, 234, 0.9), 0 0 15px rgba(89, 50, 234, 0.4);
        }
        
        .login-button {
            width: 100%;
            padding: 18px 0;
            border-radius: 16px;
            border: 2px solid #ded5fa;
            background: #fff;
            font-weight: 700;
            font-size: 19px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            justify-content: center;
            transition: all 0.2s ease-in-out;
        }

        .login-button:hover {
            color: #fff !important;
            background: #5932EA;
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(89, 50, 234, 0.4);
            border-color: #5932EA;
        }

        @media (max-width: 900px) {
          .main-layout {
            flex-direction: column;
            gap: 24px;
            padding: 20px;
          }
          .login-box {
            transform: none !important;
            flex: 0 0 100% !important;
            width: 100% !important;
            min-width: unset !important;
            padding: 24px 8px !important;
          }
        }
      `}</style>
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
    </div>
  );
};

<<<<<<< HEAD
=======
// Update the export to match the new component name
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
export default MainSignUp;