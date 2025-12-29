import React, { useState } from "react";
import {
  FaUserAlt,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import loginImage from "./assets/student1.png";
import mainloginicon from "./assets/mainloginicon.png";
import Navbar from "./components/Navbar/LandingNavbar.js";
import { useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner.js';
import styles from './mainlogin.module.css';
import BlockedPopup from './components/BlockedPopup/BlockedPopup.jsx';

// Internal Popup Component using Module Styles
const UserNotFoundPopup = ({ isOpen, onClose, onSignUp }) => {
  if (!isOpen) return null;
  
  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popupContainer}>
        {/* Purple Header */}
        <div className={styles.popupHeader}>
          Error !
        </div>
        
        {/* Body */}
        <div className={styles.popupBody}>
          <div className={styles.popup404}>404</div>
          <h2 className={styles.popupTitle}>User Not Found...!</h2>
          <p className={styles.popupDesc}>The User is not Found in the Portal,</p>
          <p className={styles.popupDesc}>Please SignUp to continue.</p>
          
          {/* Buttons */}
          <div className={styles.popupButtons}>
            <button onClick={onClose} className={styles.popupBtnClose}>
              Close
            </button>
            <button onClick={onSignUp} className={styles.popupBtnSignup}>
              Sign up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlacementPortalLogin = ({ onLogin, onNavigateToSignUp }) => {
  const [registerNumber, setRegisterNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forceRender, setForceRender] = useState(0);
  const [showUserNotFoundPopup, setShowUserNotFoundPopup] = useState(false);
  const [blockedInfo, setBlockedInfo] = useState(null);
  
  const handleInlineSignup = (e) => {
    e.preventDefault();
    if (onNavigateToSignUp) onNavigateToSignUp();
  };
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setError("");
    setShowUserNotFoundPopup(false);
    setIsLoading(true);

    try {
      const trimmedRegister = registerNumber.trim();
      const trimmedPassword = password.trim();
      const isCoordinatorAttempt = /[a-zA-Z]/.test(trimmedRegister);

      if (!trimmedRegister) {
        setError('❌ Please enter your login ID.');
        setIsLoading(false);
        return;
      }

      if (!trimmedPassword) {
        setError('❌ Password cannot be empty.');
        setIsLoading(false);
        return;
      }

      if (!isCoordinatorAttempt && !/^\d{11}$/.test(trimmedRegister)) {
        setError('❌ Enter Your Registration number must be exactly 11 digits');
        setIsLoading(false);
        return;
      }

      if (!isCoordinatorAttempt && !/^\d{8}$/.test(trimmedPassword)) {
        setError('❌ Password must be your date of birth in DDMMYYYY format (8 digits)');
        setIsLoading(false);
        return;
      }

      const loginResult = await login(trimmedRegister, trimmedPassword);
      
      if (loginResult.success) {
        if (onLogin) {
          onLogin(trimmedRegister, trimmedPassword);
        }
        setIsLoading(false);
        if (loginResult.role === 'coordinator') {
          navigate('/coo-dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else if (loginResult.isBlocked) {
        console.log('Login blocked:', loginResult.coordinator);

        const coordinatorDetails = {
          name: loginResult?.coordinator?.name || 'Placement Office',
          cabin: loginResult?.coordinator?.cabin || 'N/A',
          blockedBy: loginResult?.coordinator?.blockedBy || loginResult?.coordinator?.name || 'Placement Office',
          message: loginResult?.error || 'Your account is blocked.'
        };

        setBlockedInfo(coordinatorDetails);
        setError('');
        setShowUserNotFoundPopup(false);
        setIsLoading(false);
        setPassword('');
      } else {
        console.error('❌ Login failed:', loginResult.error);
        setIsLoading(false);
        setShowUserNotFoundPopup(true);
        setPassword('');
      }
    } catch (error) {
      console.error('❌ Login exception:', error);
      const errorMsg = error.message || 'Login failed. Please check your credentials.';
      setIsLoading(false);

      if (errorMsg.includes('Network error') || errorMsg.includes('Connection failed') || 
          errorMsg.includes('Failed to fetch') || errorMsg.includes('Request timeout')) {
        setError(errorMsg);
        setForceRender(prev => prev + 1);
      } else {
        setShowUserNotFoundPopup(true);
      }
      setPassword('');
    }
  };

  return (
    <>
      {isLoading && (
        <LoadingSpinner message="Authenticating..." showProgress={true} />
      )}
      
      <UserNotFoundPopup 
        isOpen={showUserNotFoundPopup}
        onClose={() => setShowUserNotFoundPopup(false)}
        onSignUp={() => {
          setShowUserNotFoundPopup(false);
          if (onNavigateToSignUp) onNavigateToSignUp();
        }}
      />

      {blockedInfo && (
        <BlockedPopup 
          coordinator={blockedInfo} 
          onClose={() => setBlockedInfo(null)} 
        />
      )}
      
      <div className={styles.pageContainer}>
        <Navbar />
        
        <div className={styles.mainLayout}>
          <div className={styles.leftImageContainer}>
            <img
              src={loginImage}
              alt="Login Visual"
              className={styles.loginVisual}
            />
          </div>

          <div className={`${styles.loginBox} ${styles.glowOnHover}`}>
            <div className={styles.formWrapper}>
              <div className={styles.logoContainer}>
                <img
                  src={mainloginicon}
                  alt="Form Logo"
                  className={styles.logoImage}
                />
              </div>
              
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>
                    Register Number
                  </label>
                  <div className={styles.inputWrapper}>
                    <FaUserAlt className={styles.inputIcon} />
                    <input
                      type="text"
                      placeholder="Enter your Register Number"
                      value={registerNumber}
                      onChange={(e) => setRegisterNumber(e.target.value)}
                      required
                      className={styles.inputField}
                    />
                  </div>
                </div>
                
                <div className={styles.field} style={{ marginBottom: "28px" }}>
                  <label className={styles.fieldLabel}>
                    Password
                  </label>
                  <div className={styles.inputWrapper}>
                    <FaLock className={styles.inputIcon} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={styles.inputField}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.eyeButton}
                    >
                      {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                </div>
                
                {error && (
                  <div key={`error-${forceRender}`} role="alert" className={styles.errorMessage}>
                    <span style={{ fontSize: "16px", marginTop: "1px", flexShrink: 0 }}>⚠️</span>
                    <span style={{ flex: 1, wordBreak: "break-word" }}>
                      {error}
                      {/Sign up/i.test(error) && (
                        <> {" "}
                          <a href="#signup" onClick={handleInlineSignup} className={styles.link} style={{ marginLeft: 6 }}>Sign up</a>
                        </>
                      )}
                    </span>
                  </div>
                )}
                
                <div className={styles.loginButtonContainer}>
                  <button 
                    type="submit" 
                    className={`${styles.loginButton} ${isLoading ? styles.loginButtonDisabled : ''}`}
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </button>
                </div>
              </form>
              
              <p className={styles.signupText}>
                Don't have an account?{" "}
                <a
                  href="#!"
                  onClick={onNavigateToSignUp}
                  className={styles.link}
                >
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PlacementPortalLogin;