import { resolveProfileUrl } from '../components/Sidebar/profileUtils';
import { API_BASE_URL } from '../utils/apiConfig';

const LOCAL_HOSTS = ['localhost', '127.0.0.1'];

const looksLikeFullUrl = (v) => {
  try { new URL(v); return true; } catch (e) { return false; }
};

const sanitizeForStorage = (val) => {
  if (!val || typeof val !== 'string') return val;
  // If it's a full URL and points to localhost, return pathname+search+hash
  try {
    const u = new URL(val, window.location.origin);
    if (LOCAL_HOSTS.includes(u.hostname)) return u.pathname + u.search + u.hash;
    // If it points to the configured API host, store relative path
    const apiBase = (API_BASE_URL || '').replace(/\/$/, '');
    try {
      const apiUrl = new URL(apiBase);
      if (u.hostname === apiUrl.hostname && u.port === apiUrl.port) return u.pathname + u.search + u.hash;
    } catch (_) {}
  } catch (_) {
    // not a full URL
  }
  return val;
};

export const saveImageCache = (key, url) => {
  try {
    const sanitized = sanitizeForStorage(url);
    localStorage.setItem(key, sanitized || '');
    return true;
  } catch (e) {
    return false;
  }
};

export const saveProfileObjectCache = (key, obj) => {
  try {
    if (!obj || typeof obj !== 'object') {
      localStorage.setItem(key, JSON.stringify(obj));
      return true;
    }
    const copy = { ...obj };
    ['profilePhoto','profilePicURL','collegeBanner','collegeLogo','naacCertificate','nbaCertificate'].forEach(f => {
      if (copy[f]) copy[f] = sanitizeForStorage(copy[f]);
    });
    localStorage.setItem(key, JSON.stringify(copy));
    return true;
  } catch (e) {
    return false;
  }
};

export const getResolvedImageFromCache = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    // If stored value looks like an absolute url, return it
    if (looksLikeFullUrl(raw)) return raw;
    // Otherwise resolve it relative to API_BASE_URL
    return resolveProfileUrl(raw, API_BASE_URL);
  } catch (e) {
    return null;
  }
};

export default { saveImageCache, saveProfileObjectCache, getResolvedImageFromCache };
