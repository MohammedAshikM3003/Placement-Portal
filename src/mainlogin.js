import React, { useState } from "react";
import {
<<<<<<< HEAD
=======
  FaGraduationCap,
  FaHome,
  FaInfo,
  FaStar,
  FaEnvelope,
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
  FaUserAlt,
  FaLock,
} from "react-icons/fa";
import loginImage from "./assets/student1.png";
<<<<<<< HEAD
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
=======
import Adminicon from "./assets/Adminicon.png";
import mainloginicon from "./assets/mainloginicon.png"

const PlacementPortalLogin = ({ onLogin, onNavigateToSignUp }) => { // Accept the navigation prop
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
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
        {/* Logo */}
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

        {/* Navbar Items */}
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
=======
          padding: "60px 80px 60px 80px",
          flexWrap: "wrap",
          marginTop: "0px",
        }}
      >
        {/* Left Image */}
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
            alt="Login Visual"
            style={{
              width: "100%",
              maxWidth: 700,
<<<<<<< HEAD
              height: "auto",
              maxHeight: "100%",
              objectFit: "contain",
=======
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
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
            }}
          />
        </div>

<<<<<<< HEAD
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
=======
        {/* Right Form */}
        <div
          className="login-box glow-on-hover"
          style={{
            transform: "translateX(-20px)",
          }}
        >
          <div className="form-wrapper">
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <img
                src={mainloginicon}
                alt="Form Logo"
                style={{
                  height: 90,
                  width: 90,
                  objectFit: "contain",
                  display: "block",
                  margin: "0 auto",
                }}
              />
            </div>

            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
              <div className="field" style={{ marginBottom: "20px" }}>
                <label style={{ marginBottom: "8px", display: "block" }}>Email</label>
                <div className="input-wrapper">
                  <FaUserAlt style={{ marginRight: 12, color: "#90a4ae", fontSize: "16px" }} />
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{ fontSize: "15px" }}
                  />
                </div>
              </div>

              <div className="field" style={{ marginBottom: "28px" }}>
                <label style={{ marginBottom: "8px", display: "block" }}>Password</label>
                <div className="input-wrapper">
                  <FaLock style={{ marginRight: 12, color: "#90a4ae", fontSize: "16px" }} />
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
<<<<<<< HEAD
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
=======
                    style={{ fontSize: "15px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginTop: "50px", width:"362px" }}>
                <button type="submit" className="login-button">Login</button>
              </div>
            </form>
             {/* === SIGN UP LINK MODIFIED HERE === */}
             <p
              style={{
                marginTop: "30px",
                fontSize: "15px",
                color: "#606060",
                textAlign: "center",
              }}
            >
              Don't have an account?{" "}
              <a
                href="#!" // Prevent page reload
                onClick={onNavigateToSignUp} // Call the navigation function
                style={{
                  color: "#5932EA",
                  fontWeight: "bold",
                  textDecoration: "none",
                  cursor: "pointer", // Add pointer cursor
                }}
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
              >
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>

<<<<<<< HEAD
      <style>{`
        .login-box {
          width: 420px;
=======
      {/* CSS Styles */}
      <style>{`
        @media (max-width: 900px) {
          .main-layout {
            flex-direction: column;
            gap: 24px;
            padding: 20px;
          }

          .login-box {
            transform: none !important;
            flex: 0 0 100% !important;
          }
        }

        /* Fix for alignment issues when dev tools are opened/closed */
        html, body {
          overflow-x: hidden;
          width: 100%;
          height: 100%;
          position: relative;
        }

        /* Ensure consistent viewport calculations */
        .main-layout {
          min-height: calc(100vh - 70px);
          box-sizing: border-box;
        }

        .login-box {
          width: 420px;
          height: auto;
          min-height: 480px;
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
          background: #ffffff;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 8px 32px rgba(89, 50, 234, 0.15);
          display: flex;
          flex-direction: column;
<<<<<<< HEAD
          justify-content: center;
          transition: 0.3s ease;
          box-sizing: border-box;
          flex-shrink: 0;
        }
=======
          justify-content: space-evenly;
          align-items: center;
          transition: 0.3s ease;
          box-sizing: border-box;
          position: relative;
          z-index: 1;
        }

>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
        .glow-on-hover:hover {
          box-shadow: 0 0 35px rgba(89, 50, 234, 0.9), 0 0 15px rgba(89, 50, 234, 0.4);
          transform: scale(1.02) translateY(-5px);
        }
<<<<<<< HEAD
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
=======

        .form-wrapper {
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-evenly;
          align-items: center;
          gap: 20px;
          padding: 10px 0;
          box-sizing: border-box;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          align-items: flex-start;
          margin-bottom: 16px;
          box-sizing: border-box;
        }

        .field label {
          font-weight: bold;
          font-size: 14px;
          text-align: left;
          margin-left: 4px;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          border: 2px solid #e1e5e9;
          border-radius: 14px;
          padding: 14px 16px;
          background: #fafbff;
          transition: all 0.3s ease;
          width: 100%;
          box-sizing: border-box;
        }

        .input-wrapper:focus-within {
          border-color: #5932EA;
          box-shadow: 0 0 0 3px rgba(89, 50, 234, 0.1);
        }

        .input-wrapper input {
          border: none;
          outline: none;
          background: transparent;
          font-size: 15px;
          width: 100%;
          color: #333;
          box-sizing: border-box;
        }

        .input-wrapper input::placeholder {
          color: #90a4ae;
        }

        .login-button {
          width: 85%;
          padding: 16px 24px;
          font-size: 16px;
          border-radius: 14px;
          border: none;
          background: #5932EA;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 6px 20px rgba(89, 50, 234, 0.4);
          box-sizing: border-box;
        }

        .login-button:hover {
          background: #4c2bd9;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(89, 50, 234, 0.4);
        }

        .login-button:active {
          transform: translateY(0);
        }

        /* Prevent layout shifts when dev tools open/close */
        * {
          box-sizing: border-box;
        }

        /* Ensure navbar stays fixed properly */
        nav {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          z-index: 1000 !important;
          width: 100vw !important;
          box-sizing: border-box !important;
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
        }
      `}</style>
    </div>
  );
};

<<<<<<< HEAD
export default PlacementPortalLogin;
=======
export default PlacementPortalLogin;
>>>>>>> 12b3e09954f0f2186fd5ba5bd0e87542e66c0a9c
