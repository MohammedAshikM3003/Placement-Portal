import React from "react";
import {
  FaGraduationCap,
  FaHome,
  FaInfo,
  FaStar,
  FaEnvelope,
} from "react-icons/fa";
import loginImage from "./assets/student1.png";
import Adminicon from "./assets/Adminicon.png";
import mainloginicon from "./assets/mainloginicon.png";

// Renamed component and accept navigation prop
const MainSignUp = ({ onNavigateToLogin }) => {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        backgroundColor: "#f5f7fc",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
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
      <div
        className="main-layout"
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
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
                marginTop:"-100px"
              }}
            />
          </div>
          <button
            className="login-button"
            style={{
              color: "#197AFF",
              marginBottom: "40px",
            }}
          >
            <FaGraduationCap /> UNDER GRADUATE (UG)
          </button>
          <button
            className="login-button"
            style={{
              color: "#2568C5",
              marginBottom: "12px",
            }}
          >
            <FaGraduationCap /> POST GRADUATE (PG)
          </button>
          {/* === LOGIN LINK MODIFIED HERE === */}
          <div style={{ marginTop: "24px", fontSize: "16px", color: "#333", textAlign: "center" }}>
            Already have an account?{" "}
            <a
              href="#!" // Prevent page reload
              onClick={onNavigateToLogin} // Call the navigation function
              style={{
                color: "#5932EA",
                fontWeight: "bold",
                textDecoration: "none",
                cursor: "pointer", // Add pointer cursor
              }}
            >
              Login
            </a>
          </div>
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
          }}
        >
          <img
            src={loginImage}
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
              background: "linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.3))",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
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
          box-shadow: 0 8px 32px rgba(89, 50, 234, 0.15);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
          z-index: 1;
          transition: box-shadow 0.35s ease-in-out;
        }

        .login-box:hover {
          box-shadow: 0 0 70px 8px rgba(89, 50, 234, 0.7);
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
    </div>
  );
};

// Update the export to match the new component name
export default MainSignUp;