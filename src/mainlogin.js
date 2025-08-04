import React, { useState } from "react";
import {
  FaGraduationCap,
  FaHome,
  FaInfo,
  FaStar,
  FaEnvelope,
  FaUserAlt,
  FaLock,
} from "react-icons/fa";
import logoImage from "./assets/logo.png";
import loginImage from "./assets/student1.png";

const PlacementPortalLogin = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
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
          padding: "16px 32px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
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
            src={logoImage}
            alt="Logo"
            style={{
              height: 42,
              width: 42,
              objectFit: "contain",
              marginRight: 8,
              filter: "brightness(0) invert(1)",
            }}
          />
          <span
            style={{
              fontWeight: "bold",
              fontSize: 22,
              color: "#fff",
              lineHeight: 1,
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
      <div
        className="main-layout"
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "100px 80px 60px 80px",
          flexWrap: "wrap",
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
            transform: "translateY(-80px)",
            position: "relative",
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

        {/* Right Form */}
        <div
          className="login-box glow-on-hover"
          style={{
            transform: "translateX(-20px) translateY(-40px)",
          }}
        >
          <div className="form-wrapper">
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <img
                src={logoImage}
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
                  <input 
                    type="password" 
                    placeholder="Enter your password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ fontSize: "15px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
                <button type="submit" className="login-button">Login</button>
              </div>
            </form>
          </div>
        </div>
      </div>

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

        .login-box {
          width: 420px;
          height: auto;
          min-height: 480px;
          background: #ffffff;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 8px 32px rgba(89, 50, 234, 0.15);
          display: flex;
          flex-direction: column;
          justify-content: space-evenly;
          align-items: center;
          transition: 0.3s ease;
        }

        .glow-on-hover:hover {
          box-shadow: 0 0 35px rgba(89, 50, 234, 0.9), 0 0 15px rgba(89, 50, 234, 0.4);
          transform: scale(1.02);
        }

        .form-wrapper {
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-evenly;
          align-items: center;
          gap: 20px;
          padding: 10px 0;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 90%;
          align-items: flex-start;
          margin-bottom: 16px;
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
        }

        .login-button:hover {
          background: #4c2bd9;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(89, 50, 234, 0.4);
        }

        .login-button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default PlacementPortalLogin;
