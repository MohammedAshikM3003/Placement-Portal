import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner';

/**
 * ProtectedRoute Component
 * Validates user authentication and role-based access
 * 
 * @param {React.ReactNode} children - Component to render if authorized
 * @param {Array<string>} allowedRoles - Array of roles that can access this route
 * @param {string} redirectTo - Path to redirect unauthorized users
 */
const ProtectedRoute = ({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/' 
}) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    // Perform role validation
    const validateAccess = () => {
      // Check localStorage for session data
      const storedRole = localStorage.getItem('authRole');
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      
      console.log('🔒 ProtectedRoute validation:', {
        path: location.pathname,
        isAuthenticated,
        currentRole: role || storedRole,
        allowedRoles,
        isLoading,
        isLoggedIn
      });

      setValidating(false);
    };

    // Add small delay to prevent flash of loading screen
    const timer = setTimeout(validateAccess, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, role, location.pathname, allowedRoles, isLoading]);

  // Show loading spinner while validating
  if (isLoading || validating) {
    return <LoadingSpinner message="Validating access..." />;
  }

  // Check if user is authenticated
  const storedRole = localStorage.getItem('authRole');
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const currentRole = role || storedRole;

  // Not authenticated - redirect to login
  if (!isAuthenticated && !isLoggedIn) {
    console.warn('❌ Access denied: User not authenticated');
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
    console.warn('❌ Access denied: Insufficient permissions', {
      currentRole,
      allowedRoles,
      path: location.pathname
    });

    // Redirect based on user's actual role
    const roleRedirects = {
      'student': '/dashboard',
      'coordinator': '/coo-dashboard',
      'admin': '/admin-dashboard'
    };

    const redirectPath = roleRedirects[currentRole] || redirectTo;
    return <Navigate to={redirectPath} replace />;
  }

  console.log('✅ Access granted:', {
    path: location.pathname,
    role: currentRole
  });

  // User is authenticated and has correct role
  return children;
};

/**
 * RoleGuard Component
 * Simpler role-based guard that only checks roles without redirecting
 * Useful for wrapping individual routes with specific role requirements
 * 
 * @param {React.ReactNode} children - Component to render if authorized
 * @param {Array<string>} allowedRoles - Array of roles that can access
 */
export const RoleGuard = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  // Get current storage state
  const storedRole = localStorage.getItem('authRole');
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const authToken = localStorage.getItem('authToken');
  const currentRole = role || storedRole;

  // If AuthContext is loading OR we have storage data but context isn't authenticated yet,
  // stay in the loading state. This prevents the "Redirect to Login" flicker.
  if (isLoading || (!isAuthenticated && isLoggedIn && authToken)) {
    return <LoadingSpinner message="Loading..." />;
  }

  // Only redirect to login if we definitely have no session in Context AND Storage
  if (!isAuthenticated && !isLoggedIn && !authToken) {
    console.warn('❌ RoleGuard: User not authenticated, redirecting to login');
    return <Navigate to="/mainlogin" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
    console.warn('❌ RoleGuard: Access denied for role:', currentRole);
    // Redirect based on user's actual role
    const roleRedirects = {
      'student': '/dashboard',
      'coordinator': '/coo-dashboard',
      'admin': '/admin-dashboard'
    };

    const redirectPath = roleRedirects[currentRole] || '/';
    return <Navigate to={redirectPath} replace />;
  }

  console.log('✅ RoleGuard: Access granted for role:', currentRole);
  // User has correct role
  return children;
};

export default ProtectedRoute;
