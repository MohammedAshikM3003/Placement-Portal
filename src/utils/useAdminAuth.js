import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Cached auth state — shared across all hook instances, refreshed once per mount cycle
let _adminAuthCache = { valid: false, token: null, role: null, adminId: null, ts: 0 };
const CACHE_TTL = 3000; // 3 seconds

/**
 * Custom hook for Admin JWT authentication verification
 * Uses in-memory cache to avoid redundant localStorage reads across renders
 * @returns {Object} Authentication state and admin info
 */
const useAdminAuth = () => {
  const navigate = useNavigate();

  const authState = useMemo(() => {
    const now = Date.now();
    if (_adminAuthCache.valid && (now - _adminAuthCache.ts < CACHE_TTL)) {
      return _adminAuthCache;
    }
    const authToken = localStorage.getItem('authToken');
    const authRole = localStorage.getItem('authRole');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const adminId = localStorage.getItem('adminId');
    const valid = !!(authToken && isLoggedIn && authRole === 'admin');
    _adminAuthCache = { valid, token: authToken, role: authRole, adminId, ts: now };
    return _adminAuthCache;
  }, []);

  useEffect(() => {
    if (!authState.valid) {
      // Clear invalid session data
      localStorage.removeItem('authToken');
      localStorage.removeItem('adminId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('authRole');
      localStorage.removeItem('isLoggedIn');
      _adminAuthCache = { valid: false, token: null, role: null, adminId: null, ts: 0 };
      navigate('/admin-login', { replace: true });
    }
  }, [navigate, authState.valid]);

  return {
    isAuthenticated: authState.valid,
    role: authState.role,
    adminId: authState.adminId
  };
};

// Export cache invalidator for logout
export const invalidateAdminAuthCache = () => {
  _adminAuthCache = { valid: false, token: null, role: null, adminId: null, ts: 0 };
};

export default useAdminAuth;
