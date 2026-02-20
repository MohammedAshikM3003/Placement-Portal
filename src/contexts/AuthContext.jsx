import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';
import { startBlockStatusMonitor, stopBlockStatusMonitor } from '../utils/blockStatusChecker';
import { BLOCKED_INFO_STORAGE_KEY } from '../constants/storageKeys';

// Import the clearSidebarCache function
import { clearSidebarCache } from '../components/Sidebar/Sidebar';

// Initial state with loading flag
const initialState = {
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  isLoading: true, // CRITICAL: Start with loading true
  isPreloading: false, // New: Shows unified loading screen while fetching profile data
  error: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAIL: 'LOGIN_FAIL',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING',
  SET_PRELOADING: 'SET_PRELOADING'
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        role: action.payload.role || null,
        isAuthenticated: true,
        isLoading: false, // CRITICAL: Set loading to false only after we have all data
        isPreloading: false, // Always reset - SET_PRELOADING enables it after this action
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_FAIL:
      return {
        ...state,
        user: null,
        token: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
        isPreloading: false, // Always reset on failure
        error: action.payload.error
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };
    
    case AUTH_ACTIONS.SET_PRELOADING:
      return {
        ...state,
        isPreloading: action.payload
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on app start
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        console.log('🔍 AuthContext: Checking existing authentication...');
        
        const storedRole = localStorage.getItem('authRole');

        // Check for admin session
        if (storedRole === 'admin') {
          const isAdminLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
          const adminToken = localStorage.getItem('authToken');
          const adminLoginID = localStorage.getItem('adminLoginID');

          if (isAdminLoggedIn && adminToken && adminLoginID) {
            console.log('✅ AuthContext: Restoring admin session:', { adminLoginID });
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: { token: adminToken, user: { adminLoginID }, role: 'admin' }
            });
            return;
          }
        // Check for coordinator session
        } else if (storedRole === 'coordinator') {
          const isCoordinatorLoggedIn = localStorage.getItem('isCoordinatorLoggedIn') === 'true';
          const coordinatorToken = localStorage.getItem('authToken');
          const coordinatorData = localStorage.getItem('coordinatorData');

          if (isCoordinatorLoggedIn && coordinatorToken && coordinatorData) {
            const parsedCoordinator = JSON.parse(coordinatorData);
            console.log('✅ AuthContext: Restoring coordinator session:', {
              coordinatorId: parsedCoordinator.coordinatorId,
              username: parsedCoordinator.username
            });
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: { token: coordinatorToken, user: parsedCoordinator, role: 'coordinator' }
            });
            return;
          }
        } else {
          // Student session
          const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
          const storedToken = localStorage.getItem('authToken');
          const storedUserData = localStorage.getItem('studentData');

          if (isLoggedIn && storedToken && storedUserData) {
            const userData = JSON.parse(storedUserData);
            
            // CRITICAL: Check if student is blocked before restoring session
            if (userData.isBlocked || userData.blocked) {
              console.log('🚫 AuthContext: Student is blocked, clearing session');
              localStorage.clear();
              dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
              return;
            }
            
            console.log('✅ AuthContext: Found existing auth data:', {
              hasProfilePic: !!userData.profilePicURL,
              name: `${userData.firstName} ${userData.lastName}`
            });
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: { token: storedToken, user: userData, role: 'student' }
            });
            return;
          }
        }

        console.log('❌ AuthContext: No existing authentication found');
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      } catch (error) {
        console.error('❌ AuthContext: Error checking auth state:', error);
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    checkAuthState();
  }, []);

  useEffect(() => {
    if (state.isAuthenticated && state.role === 'student') {
      const handleStudentBlocked = (coordinatorDetails) => {
        console.log('🚨 AuthContext: Block monitor detected student block');

        if (typeof window !== 'undefined') {
          sessionStorage.setItem(
            BLOCKED_INFO_STORAGE_KEY,
            JSON.stringify({
              blockedBy: coordinatorDetails?.blockedBy || coordinatorDetails?.name || 'Placement Office',
              name: coordinatorDetails?.name || coordinatorDetails?.blockedBy || 'Placement Office',
              cabin: coordinatorDetails?.cabin || 'N/A',
              message:
                coordinatorDetails?.message ||
                'Your account has been blocked by the admin. Please contact the placement office for more information.'
            })
          );

          window.dispatchEvent(
            new CustomEvent('studentBlocked', {
              detail: {
                coordinator: coordinatorDetails || null
              }
            })
          );
        }

        authService.logout();
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAIL,
          payload: {
            error:
              coordinatorDetails?.message ||
              'Your account has been blocked by the admin. Please contact the placement office for more information.'
          }
        });
      };

      startBlockStatusMonitor(handleStudentBlocked, 30000);

      return () => {
        stopBlockStatusMonitor();
      };
    }

    stopBlockStatusMonitor();
    return undefined;
  }, [state.isAuthenticated, state.role]);

  useEffect(() => {
    const warmupBackend = async () => {
      try {
        // Use landing page cache service for warm-up (shares the same backend ping)
        const { warmUpBackend } = await import('../services/landingPageCacheService');
        await warmUpBackend();
      } catch (error) {
        // Non-critical - silently fail
      }
    };

    warmupBackend();
  }, []);

  // Login function - OPTIMIZED for instant login with background fetch
  const login = async (identifier, secret) => {
    try {
      const trimmedIdentifier = (identifier || '').trim();
      const trimmedSecret = (secret || '').trim();
      console.log('🚀 AuthContext: Starting FAST login process...', {
        identifier: trimmedIdentifier,
        hasLetters: /[a-zA-Z]/.test(trimmedIdentifier),
        isAdmin: trimmedIdentifier.toLowerCase().startsWith('admin')
      });
      
      // CRITICAL: Keep loading state active to prevent flickering
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      // Determine login type
      const isAdminAttempt = trimmedIdentifier.toLowerCase().startsWith('admin');
      const isCoordinatorAttempt = !isAdminAttempt && /[a-zA-Z]/.test(trimmedIdentifier);

      // Handle admin login
      if (isAdminAttempt) {
        const loginResult = await authService.loginAdmin(trimmedIdentifier, trimmedSecret);

        if (loginResult.success) {
          console.log('✅ AuthContext: Admin authentication successful!');

          // 1. Show loading screen while preloading data
          dispatch({ type: AUTH_ACTIONS.SET_PRELOADING, payload: true });

          // 2. Store admin profile data for instant sidebar access
          const adminData = {
            ...loginResult.admin,
            adminLoginID: loginResult.admin.adminLoginID || trimmedIdentifier,
            profilePhoto: loginResult.admin.profilePhoto || null,
            _loginTimestamp: Date.now()
          };
          
          localStorage.setItem('adminData', JSON.stringify(adminData));
          localStorage.setItem('adminLoginID', adminData.adminLoginID);
          
          // Store profile photo in cache for instant sidebar load
          if (adminData.profilePhoto) {
            localStorage.setItem('adminProfileCache', JSON.stringify({
              ...adminData,
              hasProfilePhoto: true
            }));
            localStorage.setItem('adminProfileCacheTime', Date.now().toString());
          }

          // 3. Dispatch success to unlock route guards
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              token: loginResult.token,
              user: {
                ...adminData,
                role: 'admin'
              },
              role: 'admin'
            }
          });

          // 4. Hide loading screen after brief delay (simulate data ready)
          setTimeout(() => {
            dispatch({ type: AUTH_ACTIONS.SET_PRELOADING, payload: false });
            console.log('🎉 AuthContext: Admin data ready - navigating to dashboard');
          }, 800); // Short delay for smooth transition

          return { success: true, role: 'admin', admin: loginResult.admin };
        }

        console.log('❌ AuthContext: Admin login failed:', loginResult.error);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAIL,
          payload: { error: loginResult.error || 'Admin login failed' }
        });

        return loginResult;
      }

      // Handle coordinator login
      if (isCoordinatorAttempt) {
        const loginResult = await authService.loginCoordinator(trimmedIdentifier, trimmedSecret);

        if (loginResult.success) {
          console.log('✅ AuthContext: Coordinator authentication successful!');
          
          // 1. Show loading screen while preloading data
          dispatch({ type: AUTH_ACTIONS.SET_PRELOADING, payload: true });

          // 2. Store coordinator data with profile photo for instant sidebar access
          const coordinatorData = {
            ...loginResult.coordinator,
            coordinatorId: loginResult.coordinator.coordinatorId || trimmedIdentifier,
            username: loginResult.coordinator.username || trimmedIdentifier,
            profilePhoto: loginResult.coordinator.profilePhoto || null,
            profilePicURL: loginResult.coordinator.profilePicURL || loginResult.coordinator.profilePhoto || null,
            _loginTimestamp: Date.now()
          };
          
          localStorage.setItem('coordinatorData', JSON.stringify(coordinatorData));
          localStorage.setItem('coordinatorUsername', coordinatorData.username);
          
          // Store profile photo in cache
          if (coordinatorData.profilePhoto || coordinatorData.profilePicURL) {
            localStorage.setItem('coordinatorProfileCache', JSON.stringify({
              ...coordinatorData,
              hasProfilePhoto: true
            }));
            localStorage.setItem('coordinatorProfileCacheTime', Date.now().toString());
          }
          
          console.log('📦 AuthContext: Coordinator data cached:', {
            firstName: coordinatorData.firstName,
            lastName: coordinatorData.lastName,
            coordinatorId: coordinatorData.coordinatorId,
            hasProfilePhoto: !!(coordinatorData.profilePhoto || coordinatorData.profilePicURL)
          });

          // 3. Dispatch success to unlock route guards
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              token: loginResult.token,
              user: {
                ...coordinatorData,
                role: 'coordinator'
              },
              role: 'coordinator'
            }
          });

          // 4. Hide loading screen after brief delay
          setTimeout(() => {
            dispatch({ type: AUTH_ACTIONS.SET_PRELOADING, payload: false });
            console.log('🎉 AuthContext: Coordinator data ready - navigating to dashboard');
          }, 800);

          return { success: true, role: 'coordinator', coordinator: loginResult.coordinator };
        }

        console.log('❌ AuthContext: Coordinator login failed:', loginResult.error);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAIL,
          payload: { error: loginResult.error || 'Coordinator login failed' }
        });

        return loginResult;
      }

      // Call the auth service for basic authentication (student flow)
      const loginResult = await authService.loginStudent(trimmedIdentifier, trimmedSecret);

      if (loginResult.success) {
        console.log('✅ AuthContext: Authentication successful!');
        console.log('🖼️ AuthContext: Profile picture URL:', loginResult.student.profilePicURL);
        console.log('📦 AuthContext: Full student data:', loginResult.student);

        // 1. Store auth data and update context IMMEDIATELY
        const tempAuthData = {
          token: loginResult.token,
          user: {
            ...loginResult.student,
            role: 'student'
          },
          role: 'student'
        };

        // Clear any cached sidebar data from a previous user
        clearSidebarCache();

        // 2. Dispatch success IMMEDIATELY to unlock route guards
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: tempAuthData
        });
        
        console.log('🎉 AuthContext: Login complete - instant transition!');
        
        // 3. Prepare complete student data for background fetching
        const completeStudentData = {
          ...loginResult.student,
          _id: loginResult.student._id || loginResult.student.id,
          profilePicURL: loginResult.student.profilePicURL || '',
          _loginTimestamp: Date.now()
        };
        
        // 4. ⚡ OPTIMIZED: Only fetch ESSENTIAL data (profile + attendance) during login
        // All other data (resume, certificates, achievements) will be fetched when user navigates to those pages
        setTimeout(async () => {
          try {
            console.log('📥 AuthContext: Fetching ESSENTIAL data ONLY (profile + attendance)...');
            const fastDataService = (await import('../services/fastDataService.jsx')).default;
            
            // ⚡ Fetch ONLY profile data (lightweight, no resume/certificates)
            await fastDataService.getProfileDataOnly(completeStudentData._id, false);
            
            // ⚡ Fetch and cache attendance data
            const mongoDBService = (await import('../services/mongoDBService.jsx')).default;
            try {
              const attendanceResponse = await mongoDBService.getStudentAttendanceByRegNo(loginResult.student.regNo);
              if (attendanceResponse.success && attendanceResponse.data) {
                const records = attendanceResponse.data;
                const present = records.filter(r => r.status === 'Present').length;
                const absent = records.filter(r => r.status === 'Absent').length;
                const attendanceData = { present, absent };
                
                // Cache attendance for instant dashboard load
                localStorage.setItem('studentAttendanceCache', JSON.stringify(attendanceData));
                localStorage.setItem('studentAttendanceCacheTime', Date.now().toString());
                console.log('✅ Attendance data cached:', attendanceData);
              }
            } catch (attErr) {
              console.warn('⚠️ Attendance fetch failed (non-critical):', attErr);
            }
            
            // Signal that essential data is ready
            window.dispatchEvent(new CustomEvent('studentDataReady'));
            console.log('✅ Essential data ready (profile + attendance only), navigation enabled');
            
          } catch (err) {
            console.warn('⚠️ Essential data fetch failed, allowing navigation anyway:', err);
            // Still signal ready so navigation isn't blocked
            window.dispatchEvent(new CustomEvent('studentDataReady'));
          }
        }, 0);
        
        // ⚡ NO background fetching of resume/certificates during login
        // These will be fetched lazily when user navigates to Resume/Achievements pages

        return { success: true, role: 'student' };
      } else {
        console.log('❌ AuthContext: Login failed:', loginResult.error);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAIL,
          payload: { error: loginResult.error }
        });
        // Pass the full result back to the caller, including block info
        return loginResult;
      }
    } catch (error) {
      console.error('❌ AuthContext: Login error:', error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAIL,
        payload: { error: error.message }
      });
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('🚪 AuthContext: Logging out...');
      stopBlockStatusMonitor();
      
      // 🖼️ Clear Admin Image Caches (matching Student logout pattern)
      try {
        const { default: adminImageCacheService } = await import('../services/adminImageCacheService.jsx');
        adminImageCacheService.clearAllCaches();
        console.log('✅ AuthContext: Admin image caches cleared');
      } catch (cacheError) {
        console.warn('⚠️ AuthContext: Could not clear admin image cache:', cacheError);
      }
      
      // Clear Admin-specific storage keys
      const adminKeysToRemove = [
        'adminLoginID', 'adminProfileCache', 'adminProfileCacheTime',
        'adminData', 'adminToken', 'adminId'
      ];
      adminKeysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear Coordinator-specific storage keys
      const coordinatorKeysToRemove = [
        'coordinatorData', 'coordinatorProfileCache', 'coordinatorProfileCacheTime',
        'coordinatorUsername', 'coordinatorToken', 'coordinatorId',
        'isCoordinatorLoggedIn'
      ];
      coordinatorKeysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear Student localStorage keys
      const studentKeysToRemove = [
        'authToken', 'studentData', 'isLoggedIn', 'studentRegNo', 
        'studentDob', 'completeStudentData', 'resumeData', 
        'certificatesData', 'attendanceData', 'resumeBuilderData'
      ];
      studentKeysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Clear user-specific resumeBuilderData keys (resumeBuilderData_<id>)
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('resumeBuilderData_')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear common auth keys
      localStorage.removeItem('authRole');
      localStorage.removeItem('userRole');

      // Clear sidebar cache to prevent profile data clashes between users
      clearSidebarCache();

      // Update global state
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      
      console.log('✅ AuthContext: Logout complete (Admin + Student caches cleared)');
    } catch (error) {
      console.error('❌ AuthContext: Logout error:', error);
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Context value
  const value = {
    ...state,
    login,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;