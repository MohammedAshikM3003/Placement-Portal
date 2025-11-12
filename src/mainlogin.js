import React, { useState } from "react";
import {
  FaUserAlt,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import loginImage from "./assets/student1.png";
import mainloginicon from "./assets/mainloginicon.png";
import Navbar from "./components/Navbar/LandingNavbar.js"; // Adjust the path as needed
import { useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';

const PlacementPortalLogin = ({ onLogin, onNavigateToSignUp }) => {
  // --- UPDATED: State changed from 'email' to 'registerNumber' ---
  const [registerNumber, setRegisterNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Use AuthContext for login
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validate input format
      if (!/^\d{11}$/.test(registerNumber)) {
        setError(' Enter Your Registration number must be exactly 11 digits');
        setIsLoading(false);
        return;
      }

      if (!/^\d{8}$/.test(password)) {
        setError('Password must be your date of birth in DDMMYYYY format (8 digits)');
        setIsLoading(false);
        return;
      }

      console.log('🚀 Login: Using AuthContext login method...');
      
      // Call login which will handle background data fetching
      const loginResult = await login(registerNumber, password);
      
      console.log('Login result:', loginResult);
      
      if (loginResult.success) {
        console.log('✅ Login successful! AuthContext has updated global state');
        
        // Call the onLogin callback if provided
        if (onLogin) {
          onLogin(registerNumber, password);
        }
        
        // ⚡ INSTANT NAVIGATION - No waiting!
        // Keep isLoading true to prevent form from showing again
        console.log('🚀 Navigating to dashboard immediately...');
        window.location.href = '/dashboard';
        
        // Don't set isLoading to false - page will navigate away
        // Background data will fetch automatically after navigation
      } else {
        setError(loginResult.error || 'Login failed. Please check your credentials.');
        setIsLoading(false); // Only set false on error
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed. Please check your credentials.');
      setIsLoading(false); // Only set false on error
    }
  };

  return (
    <>
      {isLoading && <LoadingSpinner message="Authenticating..." showProgress={true} />}
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
          justifyContent: "center",
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
                  <FaLock style={{ marginRight: 12, color: "#90a4ae", fontSize: "16px" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ 
                      background: 'none', 
                      border: 'none', 
                      cursor: 'pointer', 
                      color: '#90a4ae',
                      padding: '0',
                      marginLeft: '8px',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '20px',
                      height: '20px',
                      flexShrink: 0
                    }}
                  >
                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>
              {error && (
                <div style={{
                  color: "#d32f2f",
                  fontSize: "14px",
                  textAlign: "center",
                  marginBottom: "16px",
                  padding: "12px 16px",
                  backgroundColor: "#ffebee",
                  borderRadius: "12px",
                  border: "1px solid #ef5350",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  animation: "slideDown 0.3s ease-out"
                }}>
                  <span style={{ fontSize: "16px" }}>⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "30px",
                  width: "100%",
                }}
              >
                <button 
                  type="submit" 
                  className="login-button"
                  disabled={isLoading}
                  style={{
                    opacity: isLoading ? 0.7 : 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoading ? "Logging in..." : "Login"}
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
          box-shadow: 0 0 20px rgba(89, 50, 234, 0.9), 0 0 20px rgba(89, 50, 234, 0.4);
          transform: scale(1.02) translateY(-5px);
        }
        .form-wrapper { width: 100%; display: flex; flex-direction: column; align-items: center; }
        .field { width: 100%; }
        .field label { font-weight: bold; font-size: 14px; margin-left: 4px; }
        .input-wrapper { display: flex; align-items: center; border: 2px solid #e1e5e9; border-radius: 14px; padding: 14px 16px; background: #fafbff; transition: all 0.3s ease; width: 100%; box-sizing: border-box; }
        .input-wrapper:focus-within { border-color: #5932EA; box-shadow: 0 0 0 3px rgba(89, 50, 234, 0.1); }
        .input-wrapper input { border: none; outline: none; background: transparent; font-size: 15px; width: 100%; color: #333; }
        .input-wrapper input[type="password"]::-ms-reveal,
        .input-wrapper input[type="password"]::-webkit-credentials-auto-fill-button,
        .input-wrapper input[type="password"]::-webkit-textfield-decoration-container,
        .input-wrapper input[type="password"]::-webkit-strong-password-auto-fill-button { 
          display: none !important; 
          visibility: hidden !important;
          opacity: 0 !important;
        }
        .login-button { width: 100%; padding: 16px; font-size: 16px; border-radius: 14px; border: none; background: #5932EA; color: #fff; font-weight: 600; cursor: pointer; transition: all 0.3s ease; }
        
        /* Error message animation */
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        * { box-sizing: border-box; }
        @media (max-width: 1024px) {
          .main-layout {
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 30px;
            gap: 30px;
          }
          .left-image-container {
            display: none !important;
          }
        }
        @media (max-width: 768px) {
          nav { padding: 15px 20px !important; }
          .logo-text { font-size: 1.2rem !important; }
          .nav-items { display: none !important; }
          .left-image-container {
            display: none !important;
          }
          .main-layout { 
            padding: 20px;
            justify-content: center;
            align-items: center;
            height: 100vh;
            overflow: hidden;
          }
          .login-box {
            width: 100%;
            max-width: 400px;
            padding: 30px 24px;
            box-shadow: none;
            border: 1px solid #e1e5e9;
            min-height: auto;
            margin: 0 auto;
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

        /* --- MODERN SCROLLBAR FOR LOGIN PAGE (PURPLE THEME) --- */

        /* For Firefox */
        .main-layout {
            scrollbar-width: thin;
            scrollbar-color: #4F46E5 #f1f3f4;
        }

        /* For Chrome, Safari, Edge */
        .main-layout::-webkit-scrollbar {
            width: 12px;
        }

        .main-layout::-webkit-scrollbar-track {
            background-color: #f1f3f4;
            border-radius: 10px;
        }

        .main-layout::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #4F46E5 0%, #4338CA 100%);
            border-radius: 10px;
            border: 3px solid #f1f3f4;
        }

        .main-layout::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #4338CA 0%, #3730A3 100%);
        }

        /* This is the key part that removes the arrow buttons in WebKit browsers */
        .main-layout::-webkit-scrollbar-button {
            display: none;
        }
      `}</style>
    </div>
    </>
  );
};

export default PlacementPortalLogin;
