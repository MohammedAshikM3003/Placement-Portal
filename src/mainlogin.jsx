import React, { useState, useEffect, useRef } from "react";

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
import BlockedPopup from './components/BlockedPopup/BlockedPopup.jsx';
import { BLOCKED_INFO_STORAGE_KEY } from './constants/storageKeys';
import { API_BASE_URL } from './utils/apiConfig';
import styles from './mainlogin.module.css';

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
  const [isBlockedPopupOpen, setIsBlockedPopupOpen] = useState(false);
  const [blockedInfo, setBlockedInfo] = useState(null);

  const handleInlineSignup = (e) => {
    e.preventDefault();
    if (onNavigateToSignUp) onNavigateToSignUp();
  };

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleBlockedPopupClose = () => {
    setIsBlockedPopupOpen(false);
    setBlockedInfo(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(BLOCKED_INFO_STORAGE_KEY);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = sessionStorage.getItem(BLOCKED_INFO_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setBlockedInfo(parsed || null);
        setIsBlockedPopupOpen(true);
      }
    } catch (error) {
      console.error('Failed to restore blocked info from storage:', error);
      sessionStorage.removeItem(BLOCKED_INFO_STORAGE_KEY);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setError("");
    setShowUserNotFoundPopup(false);
    setIsLoading(true);

    try {
      const trimmedRegister = registerNumber.trim();
      const trimmedPassword = password.trim();
      
      // Detect login type based on input format
      const isAdminAttempt = trimmedRegister.toLowerCase().startsWith('admin');
      const isCoordinatorAttempt = !isAdminAttempt && /[a-zA-Z]/.test(trimmedRegister);
      const isStudentAttempt = !isAdminAttempt && !isCoordinatorAttempt;

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

      // Student-specific validation
      if (isStudentAttempt && !/^\d{11}$/.test(trimmedRegister)) {
        setError('❌ Registration number must be exactly 11 digits');
        setIsLoading(false);
        return;
      }

      if (isStudentAttempt && !/^\d{8}$/.test(trimmedPassword)) {
        setError('❌ Password must be your date of birth in DDMMYYYY format (8 digits)');
        setIsLoading(false);
        return;
      }

      const loginResult = await login(trimmedRegister, trimmedPassword);
      
      if (loginResult.success) {
        console.log('✅ Login successful, role:', loginResult.role);
        
        if (onLogin) {
          onLogin(trimmedRegister, trimmedPassword);
        }
        
        // Route based on role
        const targetPath = loginResult.role === 'admin' ? '/admin-dashboard' : 
                          loginResult.role === 'coordinator' ? '/coo-dashboard' : '/dashboard';
        
        // For admin, preload profile data during authentication
        if (loginResult.role === 'admin') {
          console.log('⏳ Fetching admin profile from database...');
          
          // Dispatch progress events immediately (no delays)
          window.dispatchEvent(new CustomEvent('loginPreloadProgress', {
            detail: { message: 'Loading admin profile...', progress: 50, completed: false }
          }));
          
          try {
            const adminLoginID = localStorage.getItem('adminLoginID') || trimmedRegister;
            const authToken = localStorage.getItem('authToken');
            
            // Always fetch from MongoDB, don't check cache
            console.log('🔍 Fetching profile for:', adminLoginID);
            const response = await fetch(`${API_BASE_URL}/admin/profile/${adminLoginID}`, {
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('💾 MongoDB response:', result.success ? 'Success' : 'Failed');
              
              if (result.success && result.data) {
                const data = result.data;
                console.log('✅ Admin profile loaded from MongoDB:', {
                  firstName: data.firstName,
                  lastName: data.lastName,
                  hasProfilePhoto: !!data.profilePhoto,
                  hasCollegeBanner: !!data.collegeBanner,
                  hasNaacCert: !!data.naacCertificate,
                  hasNbaCert: !!data.nbaCertificate,
                  hasCollegeLogo: !!data.collegeLogo
                });
                
                // Cache complete profile data with all images
                const profileCacheData = {
                  ...data,
                  timestamp: Date.now(),
                  cachedAt: new Date().toISOString()
                };
                localStorage.setItem('adminProfileCache', JSON.stringify(profileCacheData));
                localStorage.setItem('adminProfileCacheTime', Date.now().toString());
                console.log('✅ Admin profile cached with', Object.keys(profileCacheData).length, 'fields');
                
                // Step 4: Admin profile ready (100%)
                window.dispatchEvent(new CustomEvent('loginPreloadProgress', {
                  detail: { message: 'Admin profile ready', progress: 100, completed: true }
                }));
              }
            } else if (response.status === 404) {
              console.log('⚠️ Admin profile not found in MongoDB - first time setup');
              localStorage.setItem('adminProfileCache', JSON.stringify({ 
                isFirstTimeSetup: true, 
                timestamp: Date.now() 
              }));
              
              // Mark as complete even if first time
              window.dispatchEvent(new CustomEvent('loginPreloadProgress', {
                detail: { message: 'Admin profile ready', progress: 100, completed: true }
              }));
            } else {
              console.error('❌ Failed to fetch admin profile, status:', response.status);
              
              // Mark as complete on error too
              window.dispatchEvent(new CustomEvent('loginPreloadProgress', {
                detail: { message: 'Admin profile ready', progress: 100, completed: true }
              }));
            }
          } catch (error) {
            console.error('❌ Error preloading admin profile:', error);
            
            // Mark as complete on error
            window.dispatchEvent(new CustomEvent('loginPreloadProgress', {
              detail: { message: 'Admin profile ready', progress: 100, completed: true }
            }));
          }
        }
        
        // For students, navigate immediately - data loads in background
        if (loginResult.role === 'student') {
          console.log('⏳ Waiting for essential student data...');
          
          // Wait for the 'studentDataReady' event (max 3 seconds then navigate anyway)
          const dataReadyPromise = new Promise((resolve) => {
            const timeout = setTimeout(() => {
              console.log('⚠️ Timeout waiting for data, navigating anyway');
              resolve();
            }, 3000); // 3 second timeout (reduced from 8s)
            
            const handler = () => {
              clearTimeout(timeout);
              console.log('✅ Student data ready, navigating to dashboard');
              window.removeEventListener('studentDataReady', handler);
              resolve();
            };
            
            window.addEventListener('studentDataReady', handler);
          });
          
          await dataReadyPromise;
        }
        
        // Navigate to target page
        navigate(targetPath, { replace: true });
        
        // NOTE: isLoading stays true until this component unmounts.
      } else if (loginResult.isBlocked) {
        console.log('🚫 Student is blocked');
        
        setIsLoading(false);
        setShowUserNotFoundPopup(false);
        setError('');
        setPassword('');
        
        const coordinatorDetails = {
          blockedBy: loginResult?.coordinator?.blockedBy || loginResult?.coordinator?.name || 'Placement Office',
          name: loginResult?.coordinator?.name || loginResult?.coordinator?.blockedBy || 'Placement Office',
          cabin: loginResult?.coordinator?.cabin || 'N/A',
          message: loginResult?.error || 'Your account has been blocked by the admin. Please contact the placement office for more information.'
        };

        if (typeof window !== 'undefined') {
          sessionStorage.setItem(BLOCKED_INFO_STORAGE_KEY, JSON.stringify(coordinatorDetails));
        }

        setBlockedInfo(coordinatorDetails);
        setIsBlockedPopupOpen(true);
        
        return;
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

      // Check if this is a blocked account error
      if (errorMsg.includes('blocked') || errorMsg.includes('Blocked')) {
        const coordinatorDetails = {
          blockedBy: 'Placement Office',
          name: 'Placement Office',
          cabin: 'N/A',
          message: errorMsg
        };

        if (typeof window !== 'undefined') {
          sessionStorage.setItem(BLOCKED_INFO_STORAGE_KEY, JSON.stringify(coordinatorDetails));
        }

        setBlockedInfo(coordinatorDetails);
        setIsBlockedPopupOpen(true);
        setError('');
        setShowUserNotFoundPopup(false);
      } else if (errorMsg.includes('Network error') || errorMsg.includes('Connection failed') || 
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
        <LoadingSpinner 
          message="Authenticating..." 
          subMessage="Please wait while we verify your credentials."
          showProgress={true}
          showAnimatedDots={true}
        />
      )}
      
      <UserNotFoundPopup 
        isOpen={showUserNotFoundPopup}
        onClose={() => setShowUserNotFoundPopup(false)}
        onSignUp={() => {
          setShowUserNotFoundPopup(false);
          if (onNavigateToSignUp) onNavigateToSignUp();
        }}
      />

      {isBlockedPopupOpen && (
        <BlockedPopup
          coordinator={blockedInfo}
          onClose={handleBlockedPopupClose}
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
              
              <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
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
                      autoComplete="off"
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
                      autoComplete="new-password"
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