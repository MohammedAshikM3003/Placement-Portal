// ⚡ SUPER FAST Data Service - Instant MongoDB fetching
class FastDataService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.cache = new Map(); // In-memory cache for instant loading
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  // ⚡ INSTANT: Get complete student data (profile, resume, certificates) in ONE call
  async getCompleteStudentData(studentId, useCache = true) {
    const cacheKey = `complete_${studentId}`;
    
    // Check cache first for instant loading
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('⚡ INSTANT: Using cached data');
        return cached.data;
      }
    }

    try {
      console.log('🚀 FAST: Fetching complete student data from MongoDB...');
      const startTime = Date.now();
      
      const response = await fetch(`${this.baseURL}/students/${studentId}/complete`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const fetchTime = Date.now() - startTime;
      console.log(`✅ COMPLETE DATA FETCHED in ${fetchTime}ms:`, {
        student: !!data.student,
        resume: !!data.resume,
        certificates: data.certificates?.length || 0,
        hasProfilePic: data.stats?.hasProfilePic
      });

      // Cache the result for instant future access
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      // Update localStorage for instant page loads
      if (data.student) {
        localStorage.setItem('studentData', JSON.stringify(data.student));
        localStorage.setItem('completeStudentData', JSON.stringify(data));
        
        // Trigger update events for other components
        window.dispatchEvent(new CustomEvent('studentDataUpdated', { detail: data }));
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: data.student }));
      }

      return data;
    } catch (error) {
      console.error('❌ Fast data fetch error:', error);
      
      // Fallback to localStorage if available
      const cachedData = localStorage.getItem('completeStudentData');
      if (cachedData) {
        console.log('⚠️ Using localStorage fallback');
        return JSON.parse(cachedData);
      }
      
      throw error;
    }
  }

  // ⚡ INSTANT: Update profile with immediate cache update
  async updateProfile(studentId, profileData) {
    try {
      console.log('🚀 FAST: Updating profile...');
      const startTime = Date.now();

      const response = await fetch(`${this.baseURL}/students/${studentId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const updateTime = Date.now() - startTime;
      console.log(`✅ PROFILE UPDATED in ${updateTime}ms`);

      // Instantly update cache and localStorage
      const cacheKey = `complete_${studentId}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        cached.data.student = { ...cached.data.student, ...result.student };
        cached.timestamp = Date.now();
      }

      // Update localStorage immediately
      localStorage.setItem('studentData', JSON.stringify(result.student));
      
      // Trigger instant UI updates
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: result.student }));
      window.dispatchEvent(new CustomEvent('studentDataUpdated', { detail: result }));

      return result;
    } catch (error) {
      console.error('❌ Profile update error:', error);
      throw error;
    }
  }

  // ⚡ INSTANT: Get data from cache or localStorage
  getInstantData(studentId) {
    const cacheKey = `complete_${studentId}`;
    
    // Try cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    // Try localStorage
    const cachedData = localStorage.getItem('completeStudentData');
    if (cachedData) {
      try {
        return JSON.parse(cachedData);
      } catch (error) {
        console.error('Error parsing cached data:', error);
      }
    }

    return null;
  }

  // Clear cache when needed
  clearCache(studentId = null) {
    if (studentId) {
      this.cache.delete(`complete_${studentId}`);
    } else {
      this.cache.clear();
    }
  }

  // Preload data for instant access
  async preloadData(studentId) {
    try {
      await this.getCompleteStudentData(studentId, false); // Force fresh fetch
      console.log('✅ Data preloaded for instant access');
    } catch (error) {
      console.error('❌ Preload failed:', error);
    }
  }
}

// Export singleton instance
const fastDataService = new FastDataService();
export default fastDataService;
