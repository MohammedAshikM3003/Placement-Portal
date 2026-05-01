/**
 * API Configuration Helper
 * Returns the correct backend API URL based on environment
 */

const stripTrailingSlash = (value) => (value || '').replace(/\/+$/, '');

const normalizeApiBase = (value) => {
  const base = stripTrailingSlash(value);
  if (!base) return '';
  return base.endsWith('/api') ? base : `${base}/api`;
};

const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return normalizeApiBase(process.env.REACT_APP_API_URL);
  }
  
  if (process.env.NODE_ENV === 'production') {
    return 'https://placement-portal-zxo2.onrender.com/api';
  }
  
  if (typeof window !== 'undefined' && window.location.hostname.includes('devtunnels.ms')) {
    return 'https://3nt1rq0-5000.inc1.devtunnels.ms/api';
  }
  
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();
export const API_ORIGIN_URL = stripTrailingSlash(API_BASE_URL).replace(/\/api$/, '');

export const joinApiUrl = (path = '') => {
  const normalizedPath = String(path || '').replace(/^\/+/, '');
  if (!normalizedPath) return API_BASE_URL;
  if (normalizedPath.startsWith('http://') || normalizedPath.startsWith('https://')) return normalizedPath;
  if (normalizedPath.startsWith('api/')) return `${API_ORIGIN_URL}/${normalizedPath}`;
  if (normalizedPath.startsWith('/api/')) return `${API_ORIGIN_URL}/${normalizedPath.replace(/^\/+/, '')}`;
  return `${API_BASE_URL}/${normalizedPath}`;
};

export default API_BASE_URL;
