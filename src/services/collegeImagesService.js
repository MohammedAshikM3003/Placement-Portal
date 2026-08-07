/**
 * College Images Service
 * Handles fetching and caching of college images from the backend
 */

import { API_BASE_URL } from '../utils/apiConfig';
import { resolveProfileUrl } from '../components/Sidebar/profileUtils';

// Resolve GridFS paths (/api/file/xxx) to full backend URLs
// Returns null for empty/non-string values so the UI never renders broken <img> tags
const resolveUrl = (val) => {
  if (!val || val === '' || typeof val !== 'string') return null;
  // Prefer the shared resolver which handles ids, /api/file/* and runtime base fallback
  try {
    const resolved = resolveProfileUrl(val, API_BASE_URL) || null;
    return resolved;
  } catch (e) {
    // Fallback to simple handling
    if (val.startsWith('data:') || val.startsWith('http')) return val;
    if (val.startsWith('/api/file/')) return `${API_BASE_URL}${val.replace('/api', '')}`;
    if (/^[a-f0-9]{24}$/.test(val)) return `${API_BASE_URL}/file/${val}`;
    return val;
  }
};

const CACHE_KEY = 'collegeImagesCache';
const CACHE_TIMESTAMP_KEY = 'collegeImagesCacheTimestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (reduced for faster updates)

/**
 * Get cached college logo URL synchronously (instant, no async)
 * Used by dashboards to initialize state without any loading delay.
 * @returns {string|null}
 */
export const getCachedCollegeLogo = () => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      const raw = parsed.collegeLogo || null;
      if (!raw) return null;
      // Sanitize any localhost entries and re-resolve at runtime
      try {
        const sanitized = (function sanitize(v){
          try { const u = new URL(v, window.location.origin); if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') return u.pathname + u.search + u.hash; } catch(e){}
          return v;
        })(raw);
        return resolveProfileUrl(sanitized, API_BASE_URL);
      } catch (e) {
        return raw;
      }
    }
  } catch (e) { /* ignore */ }
  return null;
};

/**
 * Get all cached college images synchronously (instant, no async)
 * @returns {object|null}
 */
export const getCachedCollegeImages = () => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    if (cachedData && timestamp) {
      const age = Date.now() - parseInt(timestamp, 10);
      if (age < CACHE_DURATION) {
        const parsed = JSON.parse(cachedData);
        // Re-resolve any cached URLs to avoid pointing at localhost
        const safe = {
          collegeLogo: parsed.collegeLogo ? resolveProfileUrl((function(v){ try { const u=new URL(v, window.location.origin); if (u.hostname==='localhost'||u.hostname==='127.0.0.1') return u.pathname+u.search+u.hash; } catch(e){} return v; })(parsed.collegeLogo), API_BASE_URL) : null,
          collegeBanner: parsed.collegeBanner ? resolveProfileUrl((function(v){ try { const u=new URL(v, window.location.origin); if (u.hostname==='localhost'||u.hostname==='127.0.0.1') return u.pathname+u.search+u.hash; } catch(e){} return v; })(parsed.collegeBanner), API_BASE_URL) : null,
          naacCertificate: parsed.naacCertificate ? resolveProfileUrl((function(v){ try { const u=new URL(v, window.location.origin); if (u.hostname==='localhost'||u.hostname==='127.0.0.1') return u.pathname+u.search+u.hash; } catch(e){} return v; })(parsed.naacCertificate), API_BASE_URL) : null,
          nbaCertificate: parsed.nbaCertificate ? resolveProfileUrl((function(v){ try { const u=new URL(v, window.location.origin); if (u.hostname==='localhost'||u.hostname==='127.0.0.1') return u.pathname+u.search+u.hash; } catch(e){} return v; })(parsed.nbaCertificate), API_BASE_URL) : null,
        };
        return safe;
      }
    }
  } catch (e) { /* ignore */ }
  return null;
};

/**
 * Fetch college images from the admin profile
 * @param {string} adminLoginID - Admin login ID (default: 'admin1000')
 * @param {{ forceRefresh?: boolean }} options - Force bypass cache when true
 * @returns {Promise<object>} - Object containing college images
 */
export const fetchCollegeImages = async (adminLoginID = 'admin1000', options = {}) => {
  try {
    const forceRefresh = Boolean(options?.forceRefresh);

    // Check cache first unless force refresh is requested (e.g. immediately after login)
    const cachedImages = forceRefresh ? null : getCachedImages();
    if (!forceRefresh && cachedImages?.collegeLogo) {
      console.log('✅ Using cached college images');
      return cachedImages;
    }

    if (forceRefresh) {
      console.log('🔄 Force-refreshing college images (bypassing cache)');
      clearCache();
    }

    if (!forceRefresh && cachedImages && !cachedImages.collegeLogo) {
      console.log('⚠️ Cached college images present but collegeLogo is missing, fetching fresh data');
    }

    const authToken = localStorage.getItem('authToken');
    const authRole = localStorage.getItem('authRole');
    
    // Use public endpoint for college images (available to all users)
    // This allows landing page and other public pages to display college images
    let apiUrl = `${API_BASE_URL}/public/college-images/${adminLoginID}`;
    let headers = { 'Content-Type': 'application/json' };
    
    // If admin is logged in, optionally use authenticated endpoint (both work)
    if (authToken && authRole === 'admin') {
      console.log('📡 Fetching college images as authenticated admin...');
      apiUrl = `${API_BASE_URL}/admin/profile/${adminLoginID}`;
      headers['Authorization'] = `Bearer ${authToken}`;
    } else {
      console.log('📡 Fetching college images from public endpoint...');
    }

    const response = await fetch(apiUrl, { headers });

    if (!response.ok) {
      console.warn('⚠️ Failed to fetch college images:', response.status);
      return null;
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      // Handle both admin profile response and college images response
      const data = result.data;
      const images = {
        collegeBanner: resolveUrl(data.collegeBanner) || null,
        naacCertificate: resolveUrl(data.naacCertificate) || null,
        nbaCertificate: resolveUrl(data.nbaCertificate) || null,
        collegeLogo: resolveUrl(data.collegeLogo) || null,
      };

      // Cache the images
      cacheImages(images);
      console.log('✅ College images fetched and cached successfully');
      
      return images;
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching college images:', error);
    return null;
  }
};

/**
 * Get cached college images if available and not expired
 * @returns {object|null} - Cached images or null
 */
const getCachedImages = () => {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (!cachedData || !timestamp) {
      return null;
    }

    const now = Date.now();
    const age = now - parseInt(timestamp, 10);

    if (age > CACHE_DURATION) {
      console.log('⏰ Cache expired, will fetch fresh data');
      clearCache();
      return null;
    }

    const parsed = JSON.parse(cachedData);
    return {
      collegeLogo: parsed.collegeLogo ? resolveUrl(parsed.collegeLogo) : null,
      collegeBanner: parsed.collegeBanner ? resolveUrl(parsed.collegeBanner) : null,
      naacCertificate: parsed.naacCertificate ? resolveUrl(parsed.naacCertificate) : null,
      nbaCertificate: parsed.nbaCertificate ? resolveUrl(parsed.nbaCertificate) : null,
    };
  } catch (error) {
    console.error('⚠️ Error reading cache:', error);
    return null;
  }
};

/**
 * Cache college images (Optimized to prevent Storage Quota errors)
 * Now stores all 4 resolved URLs (small strings) instead of just the logo
 * @param {object} images - Images object to cache
 */
const cacheImages = (images) => {
  try {
    const cacheData = {
      collegeLogo: images.collegeLogo || null,
      collegeBanner: images.collegeBanner || null,
      naacCertificate: images.naacCertificate || null,
      nbaCertificate: images.nbaCertificate || null,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log('✅ College images cached successfully');
    // Notify UI that college images have been updated so dashboards can refresh immediately
    try {
      window.dispatchEvent(new CustomEvent('collegeImagesUpdated', { detail: { timestamp: Date.now() } }));
      localStorage.setItem('collegeImagesUpdatedSignal', Date.now().toString());
    } catch (e) { /* ignore */ }
  } catch (error) {
    // If full cache is too big, try just the logo
    try {
      const minimalCache = { collegeLogo: images.collegeLogo || null };
      localStorage.setItem(CACHE_KEY, JSON.stringify(minimalCache));
      localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
      console.log('✅ College logo cached (minimal)');
    } catch (e2) {
      console.warn('⚠️ Storage full: Skipping image cache to prevent crash.');
    }
  }
};

/**
 * Clear cached images
 */
export const clearCache = () => {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(CACHE_TIMESTAMP_KEY);
};

/**
 * Preload college images for faster access
 * Call this during app initialization
 */
export const preloadCollegeImages = async () => {
  await fetchCollegeImages();
};

const collegeImagesService = {
  fetchCollegeImages,
  clearCache,
  preloadCollegeImages
};

export default collegeImagesService;
