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
        collegeBanner: data.collegeBanner || null,
        naacCertificate: data.naacCertificate || null,
        nbaCertificate: data.nbaCertificate || null,
        collegeLogo: data.collegeLogo || null,
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
 * Cache college images (Optimized to prevent Storage Quota errors)
 * @param {object} images - Images object to cache
 */
const cacheImages = (images) => {
  try {
    // Only cache the small Logo; ignore large Banners and Certificates to prevent localStorage overflow
    const minimalCache = {
      collegeLogo: images.collegeLogo || null,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(minimalCache));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log('✅ College logo cached successfully');
  } catch (error) {
    // If even the logo is too big, just skip caching entirely to prevent crash
    console.warn('⚠️ Storage full: Skipping image cache to prevent crash.');
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
