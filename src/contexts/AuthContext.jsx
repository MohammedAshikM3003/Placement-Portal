import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

// Import the clearSidebarCache function
import { clearSidebarCache } from '../components/Sidebar/Sidebar';

// Initial state with loading flag
const initialState = {
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  isLoading: true, // CRITICAL: Start with loading true
  error: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAIL: 'LOGIN_FAIL',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING'
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

        if (storedRole === 'coordinator') {
          const isCoordinatorLoggedIn = localStorage.getItem('isCoordinatorLoggedIn') === 'true';
          const coordinatorToken = localStorage.getItem('coordinatorToken');
          const coordinatorData = localStorage.getItem('coordinatorData');

          if (isCoordinatorLoggedIn && coordinatorToken && coordinatorData) {
            const parsedCoordinator = JSON.parse(coordinatorData);
            console.log('✅ AuthContext: Restoring coordinator session:', {
              coordinatorId: parsedCoordinator.coordinatorId,
              username: parsedCoordinator.username
            });

            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: {
                token: coordinatorToken,
                user: parsedCoordinator,
                role: 'coordinator'
              }
            });
            return;
          }
        } else {
          const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
          const storedToken = localStorage.getItem('authToken');
          const storedUserData = localStorage.getItem('studentData');

          if (isLoggedIn && storedToken && storedUserData) {
            const userData = JSON.parse(storedUserData);
            console.log('✅ AuthContext: Found existing auth data:', {
              hasProfilePic: !!userData.profilePicURL,
              name: `${userData.firstName} ${userData.lastName}`
            });

            // Restore authentication state
            dispatch({
              type: AUTH_ACTIONS.LOGIN_SUCCESS,
              payload: {
                token: storedToken,
                user: userData,
                role: 'student'
              }
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
    const warmupBackend = async () => {
      try {
        await authService.apiCall('/health');
      } catch (error) {
        console.error('AuthContext: Backend warm-up failed:', error);
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
        hasLetters: /[a-zA-Z]/.test(trimmedIdentifier)
      });
      
      // PHASE 1: Quick authentication (don't wait for heavy data)
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      const isCoordinatorAttempt = /[a-zA-Z]/.test(trimmedIdentifier);

      if (isCoordinatorAttempt) {
        const loginResult = await authService.loginCoordinator(trimmedIdentifier, trimmedSecret);

        if (loginResult.success) {
          console.log('✅ AuthContext: Coordinator authentication successful!');

          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              token: loginResult.token,
              user: {
                ...loginResult.coordinator,
                role: 'coordinator'
              },
              role: 'coordinator'
            }
          });

          console.log('🎉 AuthContext: Coordinator login complete - redirect to coordinator dashboard');

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

        // CRITICAL: Update global state IMMEDIATELY with basic user data
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            token: loginResult.token,
            user: {
              ...loginResult.student,
              role: 'student'
            },
            role: 'student'
          }
        });

        // CRITICAL: Store complete student data in localStorage with profile picture
        const completeStudentData = {
          ...loginResult.student,
          _id: loginResult.student._id || loginResult.student.id,
          profilePicURL: loginResult.student.profilePicURL || '',
          _loginTimestamp: Date.now()
        };

        // Clear any cached sidebar data from a previous user BEFORE writing new data
        clearSidebarCache();

        try {
          (async () => {
            const fastDataService = (await import('../services/fastDataService.jsx')).default;
            await fastDataService.preloadProfilePhoto(completeStudentData._id);
          })();
        } catch (preloadError) {
          console.log('⚠️ AuthContext: Immediate profile photo preload failed (non-critical):', preloadError);
        }

        console.log('🎉 AuthContext: Login complete - UI can now render!');
        
        // Immediately notify listeners (Sidebar, Dashboard, etc.) about the new profile
        window.dispatchEvent(new CustomEvent('profileUpdated', {
          detail: completeStudentData
        }));
        
        // PHASE 2: Background data prefetching (NON-BLOCKING but starts immediately)
        // Use setTimeout with 0 delay for immediate execution without blocking
        setTimeout(async () => {
          try {
            console.log('📥 AuthContext: Starting background data fetch...');
            const fastDataService = (await import('../services/fastDataService.jsx')).default;

            // Single optimized preload call (handles profile, resume, certificates, attendance)
            const results = await Promise.allSettled([
              fastDataService.preloadAllData(completeStudentData._id)
            ]);

            console.log('✅ AuthContext: Background data fetch complete!', {
              preloadAllData: results[0].status
            });
            
            // Dispatch events to update all components with fresh data
            window.dispatchEvent(new CustomEvent('allDataPreloaded', {
              detail: { student: completeStudentData }
            }));
          } catch (bgError) {
            console.error('⚠️ AuthContext: Background fetch error (non-critical):', bgError);
            // Dispatch completion event anyway
            window.dispatchEvent(new CustomEvent('allDataPreloaded', {
              detail: { student: completeStudentData }
            }));
          }
        }, 0); // 0 delay for immediate execution

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
      
      // Clear localStorage
      const keysToRemove = [
        'authToken', 'studentData', 'isLoggedIn', 'studentRegNo', 
        'studentDob', 'completeStudentData', 'resumeData', 
        'certificatesData', 'attendanceData'
      ];
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Clear sidebar cache to prevent profile data clashes between users
      clearSidebarCache();

      // Update global state
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      
      console.log('✅ AuthContext: Logout complete');
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