// ⚡ HYPER-FAST Data Service - INSTANT MongoDB fetching with aggressive caching
class FastDataService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    this.cache = new Map(); // In-memory cache for instant loading
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes cache (extended)
    this.preloadQueue = new Set(); // Track preloaded data
    this.isPreloading = false;
  }

  // ⚡ INSTANT: Initialize all student data for all pages
  async initializeAllStudentData(studentId) {
    try {
      console.log('🚀 INITIALIZING: All student data for all pages...');
      const completeData = await this.getCompleteStudentData(studentId, false); // Force fresh data
      
      if (completeData && completeData.student) {
        // Update localStorage with all data
        localStorage.setItem('studentData', JSON.stringify(completeData.student));
        localStorage.setItem('completeStudentData', JSON.stringify(completeData));
        
        // Dispatch events for all components to update
        window.dispatchEvent(new CustomEvent('studentDataUpdated', { detail: completeData }));
        window.dispatchEvent(new CustomEvent('profileUpdated', { detail: completeData.student }));
        window.dispatchEvent(new CustomEvent('resumeUpdated', { detail: completeData.resume }));
        window.dispatchEvent(new CustomEvent('certificatesUpdated', { detail: completeData.certificates }));
        
        console.log('✅ ALL STUDENT DATA INITIALIZED:', {
          profile: !!completeData.student,
          resume: !!completeData.resume,
          certificates: completeData.certificates?.length || 0,
          profilePhoto: !!completeData.student?.profilePicURL
        });
        
        return completeData;
      }
      
      throw new Error('No student data received');
    } catch (error) {
      console.error('❌ Failed to initialize student data:', error);
      throw error;
    }
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
      console.log('🧹 CLEARING: Cache for student:', studentId);
      this.cache.delete(`complete_${studentId}`);
    } else {
      console.log('🧹 CLEARING: All cache data');
      this.cache.clear();
    }
    
    // Also clear localStorage cache
    localStorage.removeItem('completeStudentData');
    localStorage.removeItem('resumeData');
    localStorage.removeItem('certificatesData');
  }

  // ⚡ INSTANT: Preload ALL data immediately after login
  async preloadAllData(studentId) {
    if (this.isPreloading || this.preloadQueue.has(studentId)) {
      console.log('⚡ PRELOAD: Already in progress for student:', studentId);
      return;
    }

    this.isPreloading = true;
    this.preloadQueue.add(studentId);

    try {
      console.log('🚀 PRELOADING: All student data for instant access...');
      
      // Preload complete data in parallel
      const promises = [
        this.getCompleteStudentData(studentId, false),
        this.preloadProfilePhoto(studentId),
        this.preloadResumeData(studentId),
        this.preloadCertificatesData(studentId),
        this.preloadAttendanceData(studentId)
      ];

      const results = await Promise.allSettled(promises);
      
      console.log('✅ PRELOAD COMPLETE:', {
        completeData: results[0].status === 'fulfilled',
        profilePhoto: results[1].status === 'fulfilled',
        resumeData: results[2].status === 'fulfilled',
        certificates: results[3].status === 'fulfilled',
        attendance: results[4].status === 'fulfilled'
      });

      // Dispatch immediate updates
      const completeData = results[0].status === 'fulfilled' ? results[0].value : null;
      if (completeData) {
        window.dispatchEvent(new CustomEvent('allDataPreloaded', { detail: completeData }));
      }

    } catch (error) {
      console.error('❌ Preload failed:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  // ⚡ INSTANT: Preload profile photo with aggressive caching
  async preloadProfilePhoto(studentId) {
    try {
      window.dispatchEvent(new CustomEvent('dataLoadProgress', {
        detail: { type: 'profilePhoto', message: 'Loading profile photo...' }
      }));
      
      // First check if we already have the photo URL in localStorage
      const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (storedStudentData && storedStudentData.profilePicURL) {
        // Preload the actual image immediately
        const img = new Image();
        img.onload = () => {
          console.log('✅ Profile photo preloaded from localStorage');
          window.dispatchEvent(new CustomEvent('dataLoadProgress', {
            detail: { type: 'profilePhoto', message: '✓ Profile photo loaded' }
          }));
        };
        img.onerror = () => console.log('⚠️ Profile photo failed to load from localStorage');
        img.src = storedStudentData.profilePicURL;
        
        // Also cache in browser
        if ('caches' in window) {
          try {
            const cache = await caches.open('profile-photos');
            await cache.add(storedStudentData.profilePicURL);
            console.log('✅ Profile photo cached in browser');
          } catch (cacheError) {
            console.log('⚠️ Browser cache failed:', cacheError);
          }
        }
        return;
      }

      // If not in localStorage, fetch from API
      const response = await fetch(`${this.baseURL}/students/${studentId}/profile-photo`);
      if (response.ok) {
        const photoData = await response.json();
        if (photoData.profilePicURL) {
          // Preload the actual image
          const img = new Image();
          img.onload = () => {
            console.log('✅ Profile photo preloaded from API');
            window.dispatchEvent(new CustomEvent('dataLoadProgress', {
              detail: { type: 'profilePhoto', message: '✓ Profile photo loaded' }
            }));
          };
          img.onerror = () => console.log('⚠️ Profile photo failed to load from API');
          img.src = photoData.profilePicURL;
          
          // Cache in browser
          if ('caches' in window) {
            try {
              const cache = await caches.open('profile-photos');
              await cache.add(photoData.profilePicURL);
              console.log('✅ Profile photo cached in browser');
            } catch (cacheError) {
              console.log('⚠️ Browser cache failed:', cacheError);
            }
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Profile photo preload failed:', error);
    }
  }

  // ⚡ INSTANT: Preload resume data
  async preloadResumeData(studentId) {
    try {
      window.dispatchEvent(new CustomEvent('dataLoadProgress', {
        detail: { type: 'resume', message: 'Loading resume data...' }
      }));
      
      const response = await fetch(`${this.baseURL}/students/${studentId}/resume`);
      if (response.ok) {
        const resumeData = await response.json();
        localStorage.setItem('resumeData', JSON.stringify(resumeData));
        console.log('✅ Resume data preloaded');
        window.dispatchEvent(new CustomEvent('dataLoadProgress', {
          detail: { type: 'resume', message: '✓ Resume loaded' }
        }));
        return resumeData;
      }
    } catch (error) {
      console.log('⚠️ Resume data preload failed:', error);
    }
  }

  // ⚡ INSTANT: Preload certificates data
  async preloadCertificatesData(studentId) {
    try {
      window.dispatchEvent(new CustomEvent('dataLoadProgress', {
        detail: { type: 'certificates', message: 'Loading certificates...' }
      }));
      
      const response = await fetch(`${this.baseURL}/students/${studentId}/certificates`);
      if (response.ok) {
        const certificatesData = await response.json();
        localStorage.setItem('certificatesData', JSON.stringify(certificatesData));
        console.log('✅ Certificates data preloaded');
        window.dispatchEvent(new CustomEvent('dataLoadProgress', {
          detail: { type: 'certificates', message: '✓ Certificates loaded' }
        }));
        return certificatesData;
      }
    } catch (error) {
      console.log('⚠️ Certificates data preload failed:', error);
    }
  }

  // ⚡ INSTANT: Preload attendance data
  async preloadAttendanceData(studentId) {
    try {
      window.dispatchEvent(new CustomEvent('dataLoadProgress', {
        detail: { type: 'attendance', message: 'Loading attendance...' }
      }));
      
      const response = await fetch(`${this.baseURL}/students/${studentId}/attendance`);
      if (response.ok) {
        const attendanceData = await response.json();
        localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
        console.log('✅ Attendance data preloaded');
        window.dispatchEvent(new CustomEvent('dataLoadProgress', {
          detail: { type: 'attendance', message: '✓ Attendance loaded' }
        }));
        return attendanceData;
      }
    } catch (error) {
      console.log('⚠️ Attendance data preload failed:', error);
    }
  }
}

// Export singleton instance
const fastDataService = new FastDataService();
export default fastDataService;
