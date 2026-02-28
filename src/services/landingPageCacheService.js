/**
 * Landing Page Cache Service
 * Handles parallel fetching and aggressive caching of all landing page data
 * (placed students, company drives, college images) for instant loading.
 */

import { API_BASE_URL } from '../utils/apiConfig';

const CACHE_KEYS = {
  PLACED_STUDENTS: 'lp_placedStudents',
  PLACED_STUDENTS_TIME: 'lp_placedStudents_time',
  COMPANY_DRIVES: 'lp_companyDrives',
  COMPANY_DRIVES_TIME: 'lp_companyDrives_time',
  COLLEGE_IMAGES: 'lp_collegeImages',
  COLLEGE_IMAGES_TIME: 'lp_collegeImages_time',
};

// Cache durations
const CACHE_DURATION = {
  PLACED_STUDENTS: 10 * 60 * 1000,  // 10 minutes
  COMPANY_DRIVES: 10 * 60 * 1000,   // 10 minutes
  COLLEGE_IMAGES: 5 * 60 * 1000,    // 5 minutes (reduced for faster updates)
};

// In-memory cache for instant access (even faster than sessionStorage)
const memoryCache = new Map();

/**
 * Check if cached data is fresh
 */
const isCacheFresh = (key, duration) => {
  // Check memory first
  if (memoryCache.has(key)) {
    const entry = memoryCache.get(key);
    // Invalidate if cached data contains localhost URLs (stale from dev)
    if (entry.data && typeof entry.data === 'object') {
      const vals = Object.values(entry.data);
      if (vals.some(v => typeof v === 'string' && v.includes('localhost'))) {
        memoryCache.delete(key);
        try { sessionStorage.removeItem(key); sessionStorage.removeItem(key + '_time'); } catch(e) {}
        return false;
      }
    }
    if (Date.now() - entry.timestamp < duration) {
      return true;
    }
  }

  // Check sessionStorage
  try {
    const timestamp = sessionStorage.getItem(key + '_time');
    if (timestamp && Date.now() - parseInt(timestamp, 10) < duration) {
      // Also check for stale localhost URLs in sessionStorage
      const data = sessionStorage.getItem(key);
      if (data && data.includes('localhost')) {
        sessionStorage.removeItem(key);
        sessionStorage.removeItem(key + '_time');
        return false;
      }
      return true;
    }
  } catch (e) { /* ignore */ }

  return false;
};

/**
 * Get cached data
 */
const getCached = (key) => {
  // Memory cache (instant)
  if (memoryCache.has(key)) {
    return memoryCache.get(key).data;
  }

  // SessionStorage fallback
  try {
    const data = sessionStorage.getItem(key);
    if (data) {
      const parsed = JSON.parse(data);
      // Populate memory cache
      memoryCache.set(key, { data: parsed, timestamp: Date.now() });
      return parsed;
    }
  } catch (e) { /* ignore */ }

  return null;
};

/**
 * Set cache data (both memory + sessionStorage)
 */
const setCache = (key, data) => {
  const now = Date.now();
  memoryCache.set(key, { data, timestamp: now });
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
    sessionStorage.setItem(key + '_time', now.toString());
  } catch (e) {
    // sessionStorage might be full, memory cache still works
    console.warn('sessionStorage write failed:', e.message);
  }
};

/**
 * Fast fetch with timeout and abort controller
 */
const fastFetch = async (url, options = {}, timeoutMs = 45000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Fetch placed students (public endpoint - no auth needed)
 */
const fetchPlacedStudents = async () => {
  const key = CACHE_KEYS.PLACED_STUDENTS;

  if (isCacheFresh(key, CACHE_DURATION.PLACED_STUDENTS)) {
    return getCached(key);
  }

  try {
    const data = await fastFetch(`${API_BASE_URL}/placed-students`);
    if (data.success && data.data) {
      setCache(key, data);
      return data;
    }
    return data;
  } catch (error) {
    console.error('Failed to fetch placed students:', error.message);
    // Return cached data even if expired
    const stale = getCached(key);
    if (stale) return stale;
    return { success: false, data: [] };
  }
};

/**
 * Fetch company drives (public data)
 */
const fetchCompanyDrives = async () => {
  const key = CACHE_KEYS.COMPANY_DRIVES;

  if (isCacheFresh(key, CACHE_DURATION.COMPANY_DRIVES)) {
    return getCached(key);
  }

  try {
    const data = await fastFetch(`${API_BASE_URL}/company-drives`);
    
    // Validate that essential fields exist for landing page
    if (data?.drives?.length > 0) {
      const landingPageFields = ['companyName', 'startingDate', 'package'];
      const sample = data.drives[0];
      const missingFields = landingPageFields.filter(field => !(field in sample));
      if (missingFields.length > 0) {
        console.warn('⚠️ Landing page: Company drives missing fields:', missingFields);
      }
    }
    
    setCache(key, data);
    return data;
  } catch (error) {
    console.error('Failed to fetch company drives:', error.message);
    const stale = getCached(key);
    if (stale) return stale;
    return { drives: [] };
  }
};

/**
 * Clear college images cache (used when admin updates images)
 */
export const clearCollegeImagesCache = () => {
  try {
    const hadCache = memoryCache.has(CACHE_KEYS.COLLEGE_IMAGES) || sessionStorage.getItem(CACHE_KEYS.COLLEGE_IMAGES);
    sessionStorage.removeItem(CACHE_KEYS.COLLEGE_IMAGES);
    sessionStorage.removeItem(CACHE_KEYS.COLLEGE_IMAGES_TIME);
    memoryCache.delete(CACHE_KEYS.COLLEGE_IMAGES);
    console.log(hadCache 
      ? '✅ Landing page college images cache cleared (had stale data)' 
      : '✅ Landing page college images cache cleared (was already empty)');
  } catch (e) {
    console.warn('⚠️ Failed to clear college images cache:', e);
  }
};

/**
 * Fetch college images from public endpoint
 */
export const fetchCollegeImagesPublic = async () => {
  const key = CACHE_KEYS.COLLEGE_IMAGES;

  if (isCacheFresh(key, CACHE_DURATION.COLLEGE_IMAGES)) {
    return getCached(key);
  }

  // Helper: resolve GridFS paths (/api/file/xxx) to full backend URLs
  // Empty string is explicitly treated as null so Landing Page never renders a broken <img>
  const resolveUrl = (val) => {
    if (!val || val === '' || typeof val !== 'string') return null;
    if (val.startsWith('data:')) return val;
    // Strip localhost or any host prefix — normalize to relative path first
    const gridfsMatch = val.match(/\/api\/file\/([a-f0-9]{24})/);
    if (gridfsMatch) return `${API_BASE_URL}/file/${gridfsMatch[1]}`;
    // Raw ObjectId
    if (/^[a-f0-9]{24}$/.test(val)) return `${API_BASE_URL}/file/${val}`;
    // Relative path like /file/xxx
    if (val.startsWith('/file/')) return `${API_BASE_URL}${val}`;
    // Already a full URL (non-localhost)
    if (val.startsWith('http')) return val;
    return val;
  };

  const resolveImages = (data) => ({
    collegeBanner: resolveUrl(data.collegeBanner) || null,
    naacCertificate: resolveUrl(data.naacCertificate) || null,
    nbaCertificate: resolveUrl(data.nbaCertificate) || null,
    collegeLogo: resolveUrl(data.collegeLogo) || null,
  });

  try {
    // Public endpoint requires adminLoginID param
    const adminLoginID = localStorage.getItem('adminLoginID') || 'admin1000';
    const data = await fastFetch(`${API_BASE_URL}/public/college-images/${adminLoginID}`, {}, 10000);
    if (data.success && data.data) {
      const resolved = resolveImages(data.data);
      setCache(key, resolved);
      console.log('📥 College images fetched from MongoDB:', {
        hasBanner: !!resolved.collegeBanner,
        hasNAAC: !!resolved.naacCertificate,
        hasNBA: !!resolved.nbaCertificate,
        hasLogo: !!resolved.collegeLogo
      });
      return resolved;
    }
    console.log('⚠️ No college images data returned from backend');
    return null;
  } catch (error) {
    // Fallback: try admin profile endpoint if user has token
    try {
      const authToken = localStorage.getItem('authToken');
      const authRole = localStorage.getItem('authRole');
      const adminLoginID = localStorage.getItem('adminLoginID') || 'admin1000';
      if (authToken && authRole === 'admin') {
        const adminData = await fastFetch(
          `${API_BASE_URL}/admin/profile/${adminLoginID}`,
          { headers: { Authorization: `Bearer ${authToken}` } },
          10000
        );
        if (adminData.success && adminData.data) {
          const resolved = resolveImages(adminData.data);
          setCache(key, resolved);
          return resolved;
        }
      }
    } catch (fallbackErr) {
      // Silently fail
    }

    const stale = getCached(key);
    return stale || null;
  }
};

/**
 * MAIN: Fetch ALL landing page data in parallel
 * This is the primary function to call from the landing page component.
 * Returns all data at once, using cache where available.
 */
export const fetchAllLandingData = async () => {
  const startTime = Date.now();

  // Fire all requests in parallel
  const [placedStudentsResult, drivesResult, imagesResult] = await Promise.allSettled([
    fetchPlacedStudents(),
    fetchCompanyDrives(),
    fetchCollegeImagesPublic(),
  ]);

  const elapsed = Date.now() - startTime;
  console.log(`⚡ Landing page data fetched in ${elapsed}ms`);

  return {
    placedStudents: placedStudentsResult.status === 'fulfilled' ? placedStudentsResult.value : { success: false, data: [] },
    companyDrives: drivesResult.status === 'fulfilled' ? drivesResult.value : { drives: [] },
    collegeImages: imagesResult.status === 'fulfilled' ? imagesResult.value : null,
  };
};

/**
 * Pre-warm the backend (wake up Render free tier)
 * Call this as early as possible (e.g., App mount)
 */
export const warmUpBackend = async () => {
  try {
    // Use a simple HEAD request - fastest possible
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    console.log('✅ Backend warm-up complete');
  } catch (e) {
    // Non-critical - backend may just be slow to wake up
    console.log('⏳ Backend warming up...');
  }
};

/**
 * Clear all landing page cache
 */
export const clearLandingCache = () => {
  memoryCache.clear();
  Object.values(CACHE_KEYS).forEach((key) => {
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(key + '_time');
  });
};

const landingPageCacheService = {
  fetchAllLandingData,
  fetchPlacedStudents,
  fetchCompanyDrives,
  fetchCollegeImagesPublic,
  warmUpBackend,
  clearLandingCache,
  clearCollegeImagesCache,
};

export default landingPageCacheService;
