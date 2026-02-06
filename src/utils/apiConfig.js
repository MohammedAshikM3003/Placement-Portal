/**
 * API Configuration Helper
 * Returns the correct backend API URL based on environment
 */

const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
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
export default API_BASE_URL;
