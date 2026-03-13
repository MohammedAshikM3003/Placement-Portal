import React, { useState, useEffect, useRef, useCallback } from "react";

import {
  FaEyeSlash,
} from "react-icons/fa";
import { useNavigate } from 'react-router-dom';

import Navbar from "./components/Navbar/LandingNavbar.js";
import { useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner.js';
import BlockedPopup from './components/BlockedPopup/BlockedPopup.jsx';
import { BLOCKED_INFO_STORAGE_KEY } from './constants/storageKeys';
import { API_BASE_URL } from './utils/apiConfig';
import { fetchCollegeImages } from './services/collegeImagesService';
import styles from './mainlogin.module.css';
import { changeFavicon, FAVICON_TYPES } from './utils/faviconUtils';
import InteractiveBackground from './components/InteractiveBackground/InteractiveBackground.jsx';
import loginDripsImg from './assets/logindrips.svg';

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
  const mainLayoutRef = useRef(null);

  const handleInputBlur = useCallback(() => {
    // Wait for keyboard to close, then scroll mainLayout back to top to re-center card
    setTimeout(() => {
      // Only reset if no input inside the form is currently focused
      if (!mainLayoutRef.current) return;
      const active = document.activeElement;
      const isStillInForm = mainLayoutRef.current.querySelector('form')?.contains(active) && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
      if (!isStillInForm) {
        mainLayoutRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 350);
  }, []);

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

  // Change favicon to default (purple) for login page
  useEffect(() => {
    changeFavicon(FAVICON_TYPES.DEFAULT);
  }, []);

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
                
                // 🖼️ Pre-cache college images for instant dashboard loading
                // Resolve GridFS URLs and store via collegeImagesService
                try {
                  const resolveUrl = (val) => {
                    if (!val || typeof val !== 'string') return null;
                    if (val.startsWith('data:') || val.startsWith('http')) return val;
                    if (val.startsWith('/api/file/')) return `${API_BASE_URL}${val.replace('/api', '')}`;
                    if (/^[a-f0-9]{24}$/.test(val)) return `${API_BASE_URL}/file/${val}`;
                    return val;
                  };
                  const resolvedImages = {
                    collegeLogo: resolveUrl(data.collegeLogo),
                    collegeBanner: resolveUrl(data.collegeBanner),
                    naacCertificate: resolveUrl(data.naacCertificate),
                    nbaCertificate: resolveUrl(data.nbaCertificate),
                  };
                  localStorage.setItem('collegeImagesCache', JSON.stringify(resolvedImages));
                  localStorage.setItem('collegeImagesCacheTimestamp', Date.now().toString());
                  console.log('✅ College images pre-cached at login with resolved URLs');
                } catch (imgCacheErr) {
                  console.warn('⚠️ Failed to pre-cache college images:', imgCacheErr);
                }
                
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
          // Pre-fetch college images in background for student dashboard
          fetchCollegeImages().catch(() => {});
          console.log('⭐ Waiting for essential student data...');
          
          // Wait for the 'studentDataReady' event (max 8 seconds then navigate anyway)
          const dataReadyPromise = new Promise((resolve) => {
            const timeout = setTimeout(() => {
              console.log('⚠️ Timeout waiting for data, navigating anyway');
              resolve();
            }, 8000); // 8 second timeout to allow profile pic + resume status to load
            
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
        
        // For coordinator, pre-fetch college images in background
        if (loginResult.role === 'coordinator') {
          fetchCollegeImages().catch(() => {});
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
        
        <div className={styles.mainLayout} ref={mainLayoutRef}>
          <img src={loginDripsImg} alt="" className={styles.dripDecoration} />
          {/* Large shadow frame rectangle */}
          <div className={styles.shadowFrame}>
            {/* Left side - Interactive Animation */}
            <div className={styles.leftSide}>
              <InteractiveBackground />
            </div>
            
            {/* Right side - Login Form */}
            <div className={styles.rightSide}>
              <h1 className={styles.loginTitle}>LOGIN</h1>
              
              <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Register Number</label>
                  <div className={styles.inputWrapper}>
                    {/* User icon */}
                    <div className={styles.inputIconWrap}>
                      <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M256 288c79.5 0 144-64.5 144-144S335.5 0 256 0 112 64.5 112 144s64.5 144 144 144zm128 32h-55.1c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16H128C57.3 320 0 377.3 0 448v16c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48v-16c0-70.7-57.3-128-128-128z"></path></svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your Register Number"
                      value={registerNumber}
                      onChange={(e) => setRegisterNumber(e.target.value)}
                      required
                      className={styles.inputField}
                      autoComplete="off"
                      onFocus={(e) => {
                        // Only animate scroll on mobile devices (screen width < 768px)
                        if (window.innerWidth < 768) {
                          setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
                        }
                      }}
                      onBlur={handleInputBlur}
                    />
                  </div>
                </div>
                
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Password</label>
                  <div className={styles.inputWrapper}>
                    {/* Lock icon */}
                    <div className={styles.inputIconWrap}>
                      <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z"></path></svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className={styles.inputField}
                      autoComplete="new-password"
                      onFocus={(e) => {
                        // Only animate scroll on mobile devices (screen width < 768px)
                        if (window.innerWidth < 768) {
                          setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
                        }
                      }}
                      onBlur={handleInputBlur}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.eyeButton}
                    >
                      {showPassword ? (
                        <FaEyeSlash size={16} color="currentColor" />
                      ) : (
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 576 512" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z"></path></svg>
                      )}
                    </button>
                  </div>
                </div>
                
                {error && (
                  <div key={`error-${forceRender}`} role="alert" className={styles.errorMessage}>
                    <span style={{ wordBreak: "break-word" }}>
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
                <span>Don't have an Account ?</span>{" "}
                <span> </span>
                <a
                  href="#!"
                  onClick={onNavigateToSignUp}
                  className={styles.link}
                >
                  Sign Up
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