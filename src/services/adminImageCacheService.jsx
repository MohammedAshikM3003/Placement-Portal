import { API_BASE_URL } from '../utils/apiConfig';

// Admin Image Cache Service - Caches profile photos for instant loading
class AdminImageCacheService {
  constructor() {
    this.imageCache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Store image in cache with timestamp
  cacheImage(imageKey, imageData) {
    try {
      const cacheEntry = {
        data: imageData,
        timestamp: Date.now(),
        blob: null
      };

      // Convert base64 to blob for better memory management
      if (imageData && imageData.startsWith('data:image/')) {
        const response = fetch(imageData);
        response.then(res => res.blob()).then(blob => {
          const newBlobUrl = URL.createObjectURL(blob);
          cacheEntry.blob = newBlobUrl;
          
          // REVOKE OLD BLOB after new one is created and cached
          if (this.imageCache.has(imageKey)) {
            const oldEntry = this.imageCache.get(imageKey);
            if (oldEntry.blob && oldEntry.blob !== newBlobUrl) {
              // Delay revocation to ensure React has time to update
              setTimeout(() => {
                URL.revokeObjectURL(oldEntry.blob);
                console.log('🗑️ Revoked old admin image blob:', imageKey);
              }, 1000);
            }
          }
          
          console.log('✅ Admin image cached as blob:', imageKey);
        }).catch(err => {
          console.warn('⚠️ Failed to create blob for admin image:', err);
        });
      }

      this.imageCache.set(imageKey, cacheEntry);

      // Also store in localStorage for persistence across sessions
      const cacheData = {
        data: imageData,
        timestamp: Date.now()
      };
      localStorage.setItem(`adminImageCache_${imageKey}`, JSON.stringify(cacheData));

      console.log('✅ Admin image cached:', imageKey);
      return true;
    } catch (error) {
      console.error('❌ Failed to cache admin image:', error);
      return false;
    }
  }

  // Get image from cache
  getCachedImage(imageKey) {
    try {
      // Check memory cache first
      if (this.imageCache.has(imageKey)) {
        const cacheEntry = this.imageCache.get(imageKey);
        
        // Check if cache is still valid
        if (Date.now() - cacheEntry.timestamp < this.cacheExpiry) {
          console.log('✅ Admin image served from memory cache:', imageKey);
          // Always return base64 data instead of blob URL to avoid revocation issues
          return cacheEntry.data;
        } else {
          // Remove expired cache
          this.imageCache.delete(imageKey);
        }
      }

      // Check localStorage cache
      const storedCache = localStorage.getItem(`adminImageCache_${imageKey}`);
      if (storedCache) {
        const cacheData = JSON.parse(storedCache);
        
        // Check if cache is still valid
        if (Date.now() - cacheData.timestamp < this.cacheExpiry) {
          console.log('✅ Admin image served from localStorage cache:', imageKey);
          
          // Restore to memory cache
          this.cacheImage(imageKey, cacheData.data);
          return cacheData.data;
        } else {
          // Remove expired cache
          localStorage.removeItem(`adminImageCache_${imageKey}`);
        }
      }

      console.log('❌ Admin image not found in cache:', imageKey);
      return null;
    } catch (error) {
      console.error('❌ Failed to get cached admin image:', error);
      return null;
    }
  }

  // Cache admin profile photo during login
  async cacheAdminProfilePhoto(adminLoginID, profilePhoto) {
    if (!adminLoginID || !profilePhoto) {
      return false;
    }

    const cacheKey = `profile_${adminLoginID}`;
    return this.cacheImage(cacheKey, profilePhoto);
  }

  // Get cached admin profile photo
  getCachedAdminProfilePhoto(adminLoginID) {
    if (!adminLoginID) {
      return null;
    }

    const cacheKey = `profile_${adminLoginID}`;
    return this.getCachedImage(cacheKey);
  }

  // Preload admin profile photo (call this during login)
  async preloadAdminProfilePhoto(adminLoginID) {
    try {
      console.log('🖼️ Preloading admin profile photo:', adminLoginID);

      // Check if already cached
      const cached = this.getCachedAdminProfilePhoto(adminLoginID);
      if (cached) {
        console.log('✅ Admin profile photo already cached');
        return cached;
      }

      // Fetch from server
      const response = await fetch(`${API_BASE_URL}/admin/profile/${adminLoginID}`);
      if (response.ok) {
        const result = await response.json();
        
        if (result.success && result.data && result.data.profilePhoto) {
          // Cache the image
          await this.cacheAdminProfilePhoto(adminLoginID, result.data.profilePhoto);
          
          // Preload the actual image to browser cache
          if (result.data.profilePhoto.startsWith('data:image/')) {
            const img = new Image();
            img.onload = () => {
              console.log('✅ Admin profile photo preloaded to browser cache');
            };
            img.onerror = () => {
              console.warn('⚠️ Admin profile photo failed to preload to browser');
            };
            img.src = result.data.profilePhoto;
          }

          console.log('✅ Admin profile photo cached and preloaded');
          return result.data.profilePhoto;
        }
      }

      console.log('❌ Failed to preload admin profile photo');
      return null;
    } catch (error) {
      console.error('❌ Error preloading admin profile photo:', error);
      return null;
    }
  }

  // Clear all cached images for an admin
  clearAdminImageCache(adminLoginID) {
    try {
      const cacheKey = `profile_${adminLoginID}`;
      
      // Clear from memory
      if (this.imageCache.has(cacheKey)) {
        const cacheEntry = this.imageCache.get(cacheKey);
        if (cacheEntry.blob && cacheEntry.blob.startsWith('blob:')) {
          URL.revokeObjectURL(cacheEntry.blob);
        }
        this.imageCache.delete(cacheKey);
      }

      // Clear from localStorage
      localStorage.removeItem(`adminImageCache_${cacheKey}`);
      
      console.log('✅ Admin image cache cleared:', adminLoginID);
      return true;
    } catch (error) {
      console.error('❌ Failed to clear admin image cache:', error);
      return false;
    }
  }

  // Clear all expired caches
  clearExpiredCaches() {
    try {
      let cleared = 0;

      // Clear expired memory cache
      for (const [key, cacheEntry] of this.imageCache) {
        if (Date.now() - cacheEntry.timestamp >= this.cacheExpiry) {
          if (cacheEntry.blob && cacheEntry.blob.startsWith('blob:')) {
            URL.revokeObjectURL(cacheEntry.blob);
          }
          this.imageCache.delete(key);
          cleared++;
        }
      }

      // Clear expired localStorage cache
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('adminImageCache_')) {
          try {
            const cacheData = JSON.parse(localStorage.getItem(key));
            if (Date.now() - cacheData.timestamp >= this.cacheExpiry) {
              localStorage.removeItem(key);
              cleared++;
            }
          } catch (error) {
            // Remove corrupted cache entries
            localStorage.removeItem(key);
            cleared++;
          }
        }
      }

      if (cleared > 0) {
        console.log(`✅ Cleared ${cleared} expired admin image cache entries`);
      }

      return cleared;
    } catch (error) {
      console.error('❌ Failed to clear expired admin image caches:', error);
      return 0;
    }
  }

  // Clear all caches (for logout)
  clearAllCaches() {
    try {
      // Clear memory cache
      for (const [key, cacheEntry] of this.imageCache) {
        if (cacheEntry.blob && cacheEntry.blob.startsWith('blob:')) {
          URL.revokeObjectURL(cacheEntry.blob);
        }
      }
      this.imageCache.clear();

      // Clear localStorage cache
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith('adminImageCache_')) {
          localStorage.removeItem(key);
        }
      }

      console.log('✅ All admin image caches cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear all admin image caches:', error);
      return false;
    }
  }
}

// Export singleton instance
const adminImageCacheService = new AdminImageCacheService();

// Clear expired caches on service load
adminImageCacheService.clearExpiredCaches();

export default adminImageCacheService;