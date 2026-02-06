import { API_BASE_URL } from '../utils/apiConfig';

// ⚡ HYPER-FAST Data Service - INSTANT MongoDB fetching with aggressive caching
class FastDataService {
  constructor() {
    this.baseURL = API_BASE_URL;
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
      
      // Create an abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const response = await fetch(`${this.baseURL}/students/${studentId}/complete`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

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

      // Update localStorage for instant page loads (exclude large file data to prevent quota errors)
      if (data.student) {
        try {
          localStorage.setItem('studentData', JSON.stringify(data.student));
          
          // Create a lightweight version without file data for localStorage
          const lightweightData = {
            ...data,
            certificates: data.certificates?.map(cert => ({
              ...cert,
              fileData: undefined // Exclude large base64 data
            })) || [],
            resume: data.resume ? {
              ...data.resume,
              fileData: undefined // Exclude large base64 data
            } : null
          };
          
          localStorage.setItem('completeStudentData', JSON.stringify(lightweightData));
          
          // Trigger update events for other components
          window.dispatchEvent(new CustomEvent('studentDataUpdated', { detail: data }));
          window.dispatchEvent(new CustomEvent('profileUpdated', { detail: data.student }));
        } catch (storageError) {
          console.warn('⚠️ localStorage quota exceeded, clearing old cache:', storageError.message);
          // Clear old cache and try again with minimal data
          try {
            localStorage.removeItem('completeStudentData');
            localStorage.removeItem('certificatesData');
            localStorage.setItem('studentData', JSON.stringify(data.student));
          } catch (e) {
            console.error('❌ Failed to store even after clearing:', e);
          }
        }
      }

      return data;
    } catch (error) {
      // Handle abort/timeout errors specifically
      if (error.name === 'AbortError') {
        console.error('❌ Request timeout after 60 seconds');
        error.message = 'Request timeout - the server took too long to respond. Please check your connection and try again.';
      } else {
        console.error('❌ Fast data fetch error:', error);
      }
      
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
      console.log('FAST updateProfile payload:', { studentId, profileData });

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
      console.log(`✅ PROFILE UPDATED in ${updateTime}ms`, result);

      // Instantly update cache and localStorage
      const cacheKey = `complete_${studentId}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        cached.data.student = { ...cached.data.student, ...result.student };
        cached.timestamp = Date.now();
      }

      // Update localStorage immediately
      localStorage.setItem('studentData', JSON.stringify(result.student));

      // Also keep completeStudentData in sync so instant loaders use fresh fields
      try {
        const completeRaw = localStorage.getItem('completeStudentData');
        if (completeRaw) {
          const completeParsed = JSON.parse(completeRaw);
          completeParsed.student = { ...(completeParsed.student || {}), ...result.student };
          localStorage.setItem('completeStudentData', JSON.stringify(completeParsed));
        }
      } catch (e) {
        console.log('⚠️ Failed to sync completeStudentData after profile update:', e);
      }
      
      // Trigger instant UI updates
      window.dispatchEvent(new CustomEvent('profileUpdated', { detail: result.student }));
      window.dispatchEvent(new CustomEvent('studentDataUpdated', { detail: result }));

      return result;
    } catch (error) { // <--- ADDED CATCH BLOCK HERE TO FIX SYNTAX ERROR
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

  // 🔥 FIX: New method to aggressively clear all student-specific data from local storage
  clearAllLocalStorageData() {
    console.log('🧹 CLEARING: Aggressively wiping all student localStorage data.');
    
    // List of keys to remove, including auth and student data
    const keysToRemove = [
      'studentData',
      'completeStudentData',
      'resumeData',
      'certificatesData',
      'authToken',
      'isLoggedIn'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Also clear in-memory cache
    this.cache.clear();
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

      // If not in localStorage, fetch full student data and use profilePicURL from there
      const response = await fetch(`${this.baseURL}/students/${studentId}`);
      if (response.ok) {
        const student = await response.json();
        if (student.profilePicURL) {
          const img = new Image();
          img.onload = () => {
            console.log('✅ Profile photo preloaded from API');
            window.dispatchEvent(new CustomEvent('dataLoadProgress', {
              detail: { type: 'profilePhoto', message: '✓ Profile photo loaded' }
            }));
          };
          img.onerror = () => console.log('⚠️ Profile photo failed to load from API');
          img.src = student.profilePicURL;

          // ✅ Sync profilePicURL into localStorage.studentData so dashboards/sidebars
          // can show the image immediately without waiting for /complete.
          try {
            const raw = localStorage.getItem('studentData');
            const base = raw ? JSON.parse(raw) : {};
            const merged = { ...base, ...student };
            localStorage.setItem('studentData', JSON.stringify(merged));

            // Also keep completeStudentData.student in sync if it exists
            const completeRaw = localStorage.getItem('completeStudentData');
            if (completeRaw) {
              const completeParsed = JSON.parse(completeRaw);
              completeParsed.student = { ...(completeParsed.student || {}), ...student };
              localStorage.setItem('completeStudentData', JSON.stringify(completeParsed));
            }

            // Notify UI components that fresh profile data (with photo) is available
            window.dispatchEvent(new CustomEvent('profileUpdated', { detail: merged }));
            window.dispatchEvent(new CustomEvent('studentDataUpdated', { detail: { student: merged } }));
          } catch (syncError) {
            console.log('⚠️ Failed to sync profile photo into localStorage/studentData:', syncError);
          }

          if ('caches' in window) {
            try {
              const cache = await caches.open('profile-photos');
              await cache.add(student.profilePicURL);
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
      
      const response = await fetch(`${this.baseURL}/resume/${studentId}`);
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
      
      const response = await fetch(`${this.baseURL}/certificates/student/${studentId}`);
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

      // Use existing student data from localStorage instead of hitting a non-existent API
      const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (storedStudentData) {
        const attendanceData = {
          present: storedStudentData.attendancePresent || 0,
          absent: storedStudentData.attendanceAbsent || 0,
          records: storedStudentData.attendanceRecords || []
        };

        localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
        console.log('✅ Attendance data preloaded from local student data');
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