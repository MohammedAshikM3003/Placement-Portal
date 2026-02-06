import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for Admin JWT authentication verification
 * Checks if admin is authenticated and redirects to login if not
 * @returns {Object} Authentication state and admin info
 */
const useAdminAuth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check for JWT token
    const authToken = localStorage.getItem('authToken');
    const authRole = localStorage.getItem('authRole');
    const isLoggedIn = localStorage.getItem('isLoggedIn');

    // Log authentication check
    console.log('🔐 Admin Auth Check:', {
      hasToken: !!authToken,
      role: authRole,
      isLoggedIn: isLoggedIn
    });

    // Redirect to login if not authenticated or not admin
    if (!authToken || !isLoggedIn || authRole !== 'admin') {
      console.warn('❌ Admin authentication failed - redirecting to login');
      
      // Clear invalid session data
      localStorage.removeItem('authToken');
      localStorage.removeItem('adminId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('authRole');
      localStorage.removeItem('isLoggedIn');
      
      // Redirect to admin login
      navigate('/admin-login', { replace: true });
    } else {
      console.log('✅ Admin authenticated successfully');
    }
  }, [navigate]);

  return {
    isAuthenticated: !!localStorage.getItem('authToken'),
    role: localStorage.getItem('authRole'),
    adminId: localStorage.getItem('adminId')
  };
};

export default useAdminAuth;
