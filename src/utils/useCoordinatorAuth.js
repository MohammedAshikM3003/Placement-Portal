import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Custom hook for Coordinator JWT authentication verification
 * Checks if coordinator is authenticated and redirects to login if not
 * @returns {Object} Authentication state and coordinator info
 */
const useCoordinatorAuth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check for JWT token
    const authToken = localStorage.getItem('authToken');
    const authRole = localStorage.getItem('authRole');
    const isCoordinatorLoggedIn = localStorage.getItem('isCoordinatorLoggedIn');

    // Log authentication check
    console.log('🔐 Coordinator Auth Check:', {
      hasToken: !!authToken,
      role: authRole,
      isCoordinatorLoggedIn: isCoordinatorLoggedIn
    });

    // Redirect to login if not authenticated or not coordinator
    if (!authToken || !isCoordinatorLoggedIn || authRole !== 'coordinator') {
      console.warn('❌ Coordinator authentication failed - redirecting to login');
      
      // Clear invalid session data
      localStorage.removeItem('authToken');
      localStorage.removeItem('coordinatorId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('authRole');
      localStorage.removeItem('isCoordinatorLoggedIn');
      
      // Redirect to main login page
      navigate('/login', { replace: true });
    } else {
      console.log('✅ Coordinator authenticated successfully');
    }
  }, [navigate]);

  return {
    isAuthenticated: !!localStorage.getItem('authToken'),
    role: localStorage.getItem('authRole'),
    coordinatorId: localStorage.getItem('coordinatorId')
  };
};

export default useCoordinatorAuth;
