import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

// Initial state with loading flag
const initialState = {
  user: null,
  token: null,
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
        isAuthenticated: true,
        isLoading: false, // CRITICAL: Set loading to false only after we have all data
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_FAIL:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
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
              user: userData
            }
          });
        } else {
          console.log('❌ AuthContext: No existing authentication found');
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('❌ AuthContext: Error checking auth state:', error);
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    checkAuthState();
  }, []);

  // Login function
  const login = async (regNo, dob) => {
    try {
      console.log('🚀 AuthContext: Starting login process...');
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });

      // Call the auth service
      const loginResult = await authService.loginStudent(regNo, dob);

      if (loginResult.success) {
        console.log('✅ AuthContext: Login successful, updating global state');
        console.log('🖼️ AuthContext: Profile picture URL:', loginResult.student.profilePicURL);

        // CRITICAL: Update global state with ALL user data at once
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            token: loginResult.token,
            user: loginResult.student // This MUST include profilePicURL
          }
        });

        // Store in localStorage for persistence
        localStorage.setItem('authToken', loginResult.token);
        localStorage.setItem('studentData', JSON.stringify(loginResult.student));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('studentRegNo', regNo);
        localStorage.setItem('studentDob', dob);

        console.log('🎉 AuthContext: Login complete, state updated');
        return { success: true };
      } else {
        console.log('❌ AuthContext: Login failed:', loginResult.error);
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAIL,
          payload: { error: loginResult.error }
        });
        return { success: false, error: loginResult.error };
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
