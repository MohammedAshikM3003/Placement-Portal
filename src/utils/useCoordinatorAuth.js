import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Cached auth state — shared across all hook instances, refreshed once per mount cycle
let _coordAuthCache = { valid: false, token: null, role: null, coordinatorId: null, ts: 0 };
const CACHE_TTL = 3000; // 3 seconds

/**
 * Custom hook for Coordinator JWT authentication verification
 * Uses in-memory cache to avoid redundant localStorage reads across renders
 * @returns {Object} Authentication state and coordinator info
 */
const useCoordinatorAuth = () => {
  const navigate = useNavigate();

  const authState = useMemo(() => {
    const now = Date.now();
    if (_coordAuthCache.valid && (now - _coordAuthCache.ts < CACHE_TTL)) {
      return _coordAuthCache;
    }
    const authToken = localStorage.getItem('authToken');
    const authRole = localStorage.getItem('authRole');
    const isCoordinatorLoggedIn = localStorage.getItem('isCoordinatorLoggedIn');
    const coordinatorId = localStorage.getItem('coordinatorId');
    const valid = !!(authToken && isCoordinatorLoggedIn && authRole === 'coordinator');
    _coordAuthCache = { valid, token: authToken, role: authRole, coordinatorId, ts: now };
    return _coordAuthCache;
  }, []);

  useEffect(() => {
    if (!authState.valid) {
      // Clear invalid session data
      localStorage.removeItem('authToken');
      localStorage.removeItem('coordinatorId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('authRole');
      localStorage.removeItem('isCoordinatorLoggedIn');
      _coordAuthCache = { valid: false, token: null, role: null, coordinatorId: null, ts: 0 };
      navigate('/login', { replace: true });
    }
  }, [navigate, authState.valid]);

  return {
    isAuthenticated: authState.valid,
    role: authState.role,
    coordinatorId: authState.coordinatorId
  };
};

// Export cache invalidator for logout
export const invalidateCoordinatorAuthCache = () => {
  _coordAuthCache = { valid: false, token: null, role: null, coordinatorId: null, ts: 0 };
};

export default useCoordinatorAuth;
