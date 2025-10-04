import React, { useState } from "react";
import {
  FaUserAlt,
  FaLock,
} from "react-icons/fa";
import loginImage from "./assets/student1.png";
import mainloginicon from "./assets/mainloginicon.png";
import Navbar from "./components/Navbar/LandingNavbar.js"; // Adjust the path as needed

const PlacementPortalLogin = ({ onLogin, onNavigateToSignUp }) => {
  // --- UPDATED: State changed from 'email' to 'registerNumber' ---
  const [registerNumber, setRegisterNumber] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // --- UPDATED: Passing 'registerNumber' to the onLogin function ---
    onLogin(registerNumber, password);
  };

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
          overflow: "auto",
        }}
      >
        <div
          className="left-image-container"
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
            alt="Login Visual"
            style={{
              width: "100%",
              maxWidth: 700,
              height: "auto",
              maxHeight: "100%",
              objectFit: "contain",
            }}
          />
        </div>

        <div className="login-box glow-on-hover">
          <div className="form-wrapper">
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <img
                src={mainloginicon}
                alt="Form Logo"
                style={{ height: 80, width: 80, objectFit: "contain" }}
              />
            </div>
            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
              <div className="field" style={{ marginBottom: "20px" }}>
                {/* --- UPDATED: Label changed to "Register Number" --- */}
                <label style={{ marginBottom: "8px", display: "block" }}>
                  Register Number
                </label>
                <div className="input-wrapper">
                  <FaUserAlt style={{ marginRight: 12, color: "#90a4ae" }} />
                  {/* --- UPDATED: Input field for Register Number --- */}
                  <input
                    type="text"
                    placeholder="Enter your Register Number"
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="field" style={{ marginBottom: "28px" }}>
                <label style={{ marginBottom: "8px", display: "block" }}>
                  Password
                </label>
                <div className="input-wrapper">
                  <FaLock style={{ marginRight: 12, color: "#90a4ae" }} />
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "30px",
                  width: "100%",
                }}
              >
                <button type="submit" className="login-button">
                  Login
                </button>
              </div>
            </form>
            <p style={{ marginTop: "24px", fontSize: "15px", textAlign: "center" }}>
              Don't have an account?{" "}
              <a
                href="#!"
                onClick={onNavigateToSignUp}
                style={{ color: "#5932EA", fontWeight: "bold", textDecoration: "none" }}
              >
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .login-box {
          width: 420px;
          background: #ffffff;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 8px 32px rgba(89, 50, 234, 0.15);
          display: flex;
          flex-direction: column;
          justify-content: center;
          transition: 0.3s ease;
          box-sizing: border-box;
          flex-shrink: 0;
        }
        .glow-on-hover:hover {
          box-shadow: 0 0 35px rgba(89, 50, 234, 0.9), 0 0 15px rgba(89, 50, 234, 0.4);
          transform: scale(1.02) translateY(-5px);
        }
        .form-wrapper { width: 100%; display: flex; flex-direction: column; align-items: center; }
        .field { width: 100%; }
        .field label { font-weight: bold; font-size: 14px; margin-left: 4px; }
        .input-wrapper { display: flex; align-items: center; border: 2px solid #e1e5e9; border-radius: 14px; padding: 14px 16px; background: #fafbff; transition: all 0.3s ease; width: 100%; box-sizing: border-box; }
        .input-wrapper:focus-within { border-color: #5932EA; box-shadow: 0 0 0 3px rgba(89, 50, 234, 0.1); }
        .input-wrapper input { border: none; outline: none; background: transparent; font-size: 15px; width: 100%; color: #333; }
        .login-button { width: 100%; padding: 16px; font-size: 16px; border-radius: 14px; border: none; background: #5932EA; color: #fff; font-weight: 600; cursor: pointer; transition: all 0.3s ease; }
        * { box-sizing: border-box; }
        @media (max-width: 1024px) {
          .main-layout {
            flex-direction: column;
            justify-content: center;
            padding: 30px;
            gap: 30px;
          }
          .left-image-container {
            display: none;
          }
        }
        @media (max-width: 768px) {
          nav { padding: 15px 20px !important; }
          .logo-text { font-size: 1.2rem !important; }
          .nav-items { display: none !important; }
          .main-layout { padding: 20px; }
          .login-box {
            width: 100%;
            padding: 24px;
            box-shadow: none;
            border: 1px solid #e1e5e9;
            min-height: auto; 
          }
        }
        @media (max-height: 500px) and (max-width: 1024px) {
          .main-layout {
            justify-content: flex-start;
            padding-top: 20px;
          }
          .login-box {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default PlacementPortalLogin;
