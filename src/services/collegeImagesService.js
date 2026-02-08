/**
 * College Images Service
 * Handles fetching and caching of college images from the backend
 */

import { API_BASE_URL } from '../utils/apiConfig';

const CACHE_KEY = 'collegeImagesCache';
const CACHE_TIMESTAMP_KEY = 'collegeImagesCacheTimestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (reduced for faster updates)

/**
 * Fetch college images from the admin profile
 * @param {string} adminLoginID - Admin login ID (default: 'admin1000')
 * @returns {Promise<object>} - Object containing college images
 */
export const fetchCollegeImages = async (adminLoginID = 'admin1000') => {
  try {
    // Check cache first
    const cachedImages = getCachedImages();
    if (cachedImages) {
      console.log('✅ Using cached college images');
      return cachedImages;
    }

    const authToken = localStorage.getItem('authToken');
    const authRole = localStorage.getItem('authRole');
    
    // Only fetch if user is admin with valid token
    // For non-admin users or no token, return null (will use fallback images)
    if (!authToken) {
      console.log('ℹ️ No auth token, skipping college images fetch (will use fallbacks)');
      return null;
    }
    
    if (authRole !== 'admin') {
      console.log('ℹ️ Non-admin user, skipping college images fetch (will use fallbacks)');
      return null;
    }

    console.log('📡 Fetching college images from server...');
    const response = await fetch(`${API_BASE_URL}/admin/profile/${adminLoginID}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.warn('⚠️ Failed to fetch college images:', response.status);
      return null;
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      const images = {
        collegeBanner: result.data.collegeBanner || null,
        naacCertificate: result.data.naacCertificate || null,
        nbaCertificate: result.data.nbaCertificate || null,
        collegeLogo: result.data.collegeLogo || null,
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

    return JSON.parse(cachedData);
  } catch (error) {
    console.error('⚠️ Error reading cache:', error);
    return null;
  }
};

/**
 * Cache college images
 * @param {object} images - Images object to cache
 */
const cacheImages = (images) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(images));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('⚠️ Error caching images:', error);
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
