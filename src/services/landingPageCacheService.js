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
  COLLEGE_IMAGES: 30 * 60 * 1000,   // 30 minutes (images change rarely)
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
    if (Date.now() - entry.timestamp < duration) {
      return true;
    }
  }

  // Check sessionStorage
  try {
    const timestamp = sessionStorage.getItem(key + '_time');
    if (timestamp && Date.now() - parseInt(timestamp, 10) < duration) {
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
 * Fetch college images from public endpoint
 */
const fetchCollegeImagesPublic = async () => {
  const key = CACHE_KEYS.COLLEGE_IMAGES;

  if (isCacheFresh(key, CACHE_DURATION.COLLEGE_IMAGES)) {
    return getCached(key);
  }

  try {
    const data = await fastFetch(`${API_BASE_URL}/public/college-images`, {}, 10000);
    if (data.success && data.data) {
      setCache(key, data.data);
      return data.data;
    }
    return null;
  } catch (error) {
    // Fallback: try admin profile endpoint if user has token
    try {
      const authToken = localStorage.getItem('authToken');
      const authRole = localStorage.getItem('authRole');
      if (authToken && authRole === 'admin') {
        const adminData = await fastFetch(
          `${API_BASE_URL}/admin/profile/admin1000`,
          { headers: { Authorization: `Bearer ${authToken}` } },
          10000
        );
        if (adminData.success && adminData.data) {
          const images = {
            collegeBanner: adminData.data.collegeBanner || null,
            naacCertificate: adminData.data.naacCertificate || null,
            nbaCertificate: adminData.data.nbaCertificate || null,
            collegeLogo: adminData.data.collegeLogo || null,
          };
          setCache(key, images);
          return images;
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
};

export default landingPageCacheService;
