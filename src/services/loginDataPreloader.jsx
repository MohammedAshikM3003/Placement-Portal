// Login Data Preloader - Fetches and caches all necessary data during login
import adminImageCacheService from './adminImageCacheService.jsx';
import { API_BASE_URL } from '../utils/apiConfig';
import { saveProfileObjectCache } from '../hooks/useProfileCache';
import profileUtils from '../components/Sidebar/profileUtils';
const { canonicalStorePath } = profileUtils;

class LoginDataPreloader {
  constructor() {
    this.preloadProgress = {
      profilePhoto: false,
      profileData: false,
      attendanceData: false,
      totalProgress: 0
    };
  }

  // Update progress and notify listeners
  updateProgress(key, status) {
    this.preloadProgress[key] = status;
    const completed = Object.keys(this.preloadProgress).filter(k => k !== 'totalProgress' && this.preloadProgress[k]).length;
    const total = Object.keys(this.preloadProgress).length - 1; // Exclude totalProgress
    this.preloadProgress.totalProgress = Math.round((completed / total) * 100);

    // Dispatch progress event
    window.dispatchEvent(new CustomEvent('loginPreloadProgress', {
      detail: {
        key,
        status,
        progress: this.preloadProgress.totalProgress,
        message: this.getProgressMessage(key, status)
      }
    }));
  }

  getProgressMessage(key, status) {
    if (status) {
      switch (key) {
        case 'profilePhoto': return '✅ Profile photo cached';
        case 'profileData': return '✅ Profile data loaded';
        case 'attendanceData': return '✅ Attendance data ready';
        default: return '✅ Data loaded';
      }
    } else {
      switch (key) {
        case 'profilePhoto': return '⏳ Loading profile photo...';
        case 'profileData': return '⏳ Loading profile data...';
        case 'attendanceData': return '⏳ Loading attendance data...';
        default: return '⏳ Loading...';
      }
    }
  }

  // Reset progress
  resetProgress() {
    this.preloadProgress = {
      profilePhoto: false,
      profileData: false,
      attendanceData: false,
      totalProgress: 0
    };
  }

  // Fetch full admin profile from API (includes DOB and College Details)
  async fetchAdminProfileFromAPI(adminLoginID) {
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        throw new Error('No auth token found');
      }

      const response = await fetch(`${API_BASE_URL}/admin/profile/${adminLoginID}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch admin profile: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        console.log('🔍 Full admin profile fetched during login:', {
          hasFirstName: !!result.data.firstName,
          hasLastName: !!result.data.lastName,
          hasDOB: !!result.data.dob,
          hasGender: !!result.data.gender,
          hasDomainMail: !!result.data.domainMailId,
          hasCollegeBanner: !!result.data.collegeBanner,
          hasNAAC: !!result.data.naacCertificate,
          hasNBA: !!result.data.nbaCertificate,
          hasLogo: !!result.data.collegeLogo
        });
        return result.data;
      } else {
        console.warn('⚠️ Admin profile not found or empty');
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching admin profile during login:', error);
      return null;
    }
  }

  // Preload admin data during login
  async preloadAdminData(adminLoginID, adminData) {
    try {
      console.log('🚀 Preloading admin data...');
      this.resetProgress();

      const tasks = [];

      // Task 1: Cache profile photo
      if (adminData.profilePhoto) {
        this.updateProgress('profilePhoto', false);
        tasks.push(
          adminImageCacheService.cacheAdminProfilePhoto(adminLoginID, adminData.profilePhoto)
            .then(() => {
              this.updateProgress('profilePhoto', true);
              console.log('✅ Admin profile photo cached');
            })
            .catch(err => {
              console.warn('⚠️ Failed to cache admin profile photo:', err);
              this.updateProgress('profilePhoto', true); // Mark as done anyway
            })
        );
      } else {
        this.updateProgress('profilePhoto', true);
      }

      // Task 2: Fetch FULL admin profile from API (includes DOB and College Details)
      this.updateProgress('profileData', false);
      tasks.push(
        this.fetchAdminProfileFromAPI(adminLoginID)
          .then(fullProfile => {
            // Build complete profile cache
            const profileCache = {
              adminLoginID: adminLoginID,
              name: adminData.fullName || 'Admin',
              profilePhoto: canonicalStorePath(adminData.profilePhoto) || null,
              firstName: fullProfile?.firstName || adminData.firstName || '',
              lastName: fullProfile?.lastName || adminData.lastName || '',
              emailId: fullProfile?.emailId || adminData.emailId || '',
              phoneNumber: fullProfile?.phoneNumber || adminData.phoneNumber || '',
              department: fullProfile?.department || adminData.department || '',
              // Include DOB and gender
              dob: fullProfile?.dob || '',
              gender: fullProfile?.gender || '',
              domainMailId: fullProfile?.domainMailId || '',
              // Include college images
              collegeBanner: canonicalStorePath(fullProfile?.collegeBanner) || null,
              naacCertificate: canonicalStorePath(fullProfile?.naacCertificate) || null,
              nbaCertificate: canonicalStorePath(fullProfile?.nbaCertificate) || null,
              collegeLogo: canonicalStorePath(fullProfile?.collegeLogo) || null,
              timestamp: Date.now()
            };
            
            // Try to cache with college images first
            try {
              try { saveProfileObjectCache('adminProfileCache', profileCache); } catch (_) { localStorage.setItem('adminProfileCache', JSON.stringify(profileCache)); }
              localStorage.setItem('adminProfileCacheTime', Date.now().toString());
              console.log('✅ Admin FULL profile cached (including DOB and College images)');
            } catch (quotaError) {
              console.warn('⚠️ Storage quota exceeded, caching without college images:', quotaError);
              // Fallback: Cache without college images if quota exceeded
              const minimalCache = {
                adminLoginID: adminLoginID,
                name: adminData.fullName || 'Admin',
                profilePhoto: adminData.profilePhoto || null,
                firstName: fullProfile?.firstName || adminData.firstName || '',
                lastName: fullProfile?.lastName || adminData.lastName || '',
                emailId: fullProfile?.emailId || adminData.emailId || '',
                phoneNumber: fullProfile?.phoneNumber || adminData.phoneNumber || '',
                department: fullProfile?.department || adminData.department || '',
                dob: fullProfile?.dob || '',
                gender: fullProfile?.gender || '',
                domainMailId: fullProfile?.domainMailId || '',
                timestamp: Date.now()
              };
              try {
                try { saveProfileObjectCache('adminProfileCache', minimalCache); } catch (_) { localStorage.setItem('adminProfileCache', JSON.stringify(minimalCache)); }
                localStorage.setItem('adminProfileCacheTime', Date.now().toString());
                console.log('✅ Admin profile cached without college images (quota limit)');
              } catch (fallbackError) {
                console.error('❌ Failed to cache even minimal profile:', fallbackError);
              }
            }
            
            this.updateProgress('profileData', true);
          })
          .catch(err => {
            console.warn('⚠️ Failed to fetch full admin profile, using basic data:', err);
            // Fallback to basic profile data
            const profileCache = {
              adminLoginID: adminLoginID,
              name: adminData.fullName || 'Admin',
              profilePhoto: adminData.profilePhoto || null,
              firstName: adminData.firstName || '',
              lastName: adminData.lastName || '',
              emailId: adminData.emailId || '',
              phoneNumber: adminData.phoneNumber || '',
              department: adminData.department || '',
              timestamp: Date.now()
            };
            try {
              try { saveProfileObjectCache('adminProfileCache', profileCache); } catch (_) { localStorage.setItem('adminProfileCache', JSON.stringify(profileCache)); }
              localStorage.setItem('adminProfileCacheTime', Date.now().toString());
            } catch (e) {
              console.error('❌ Failed to cache basic profile:', e);
            }
            this.updateProgress('profileData', true);
          })
      );

      // Task 3: Preload attendance data (optional for admin)
      this.updateProgress('attendanceData', false);
      tasks.push(
        this.preloadAttendanceData('admin')
          .then(() => {
            this.updateProgress('attendanceData', true);
          })
          .catch(err => {
            console.warn('⚠️ Failed to preload attendance data:', err);
            this.updateProgress('attendanceData', true); // Mark as done anyway
          })
      );

      // Wait for all tasks
      await Promise.all(tasks);

      console.log('✅ All admin data preloaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to preload admin data:', error);
      return false;
    }
  }

  // Preload student data during login
  async preloadStudentData(studentId, studentData) {
    try {
      console.log('🚀 Preloading student data...');
      this.resetProgress();

      const tasks = [];

      // Task 1: Cache profile photo
      if (studentData.profilePicURL) {
        this.updateProgress('profilePhoto', false);
        tasks.push(
          this.cacheStudentProfilePhoto(studentData.profilePicURL)
            .then(() => {
              this.updateProgress('profilePhoto', true);
              console.log('✅ Student profile photo cached');
            })
            .catch(err => {
              console.warn('⚠️ Failed to cache student profile photo:', err);
              this.updateProgress('profilePhoto', true);
            })
        );
      } else {
        this.updateProgress('profilePhoto', true);
      }

      // Task 2: Store profile data in localStorage
      this.updateProgress('profileData', false);
      tasks.push(
        Promise.resolve().then(() => {
          localStorage.setItem('studentData', JSON.stringify(studentData));
          localStorage.setItem('completeStudentData', JSON.stringify({ student: studentData }));
          this.updateProgress('profileData', true);
          console.log('✅ Student profile data cached');
        })
      );

      // Task 3: Preload attendance data
      this.updateProgress('attendanceData', false);
      tasks.push(
        this.preloadAttendanceData('student')
          .then(() => {
            this.updateProgress('attendanceData', true);
          })
          .catch(err => {
            console.warn('⚠️ Failed to preload attendance data:', err);
            this.updateProgress('attendanceData', true);
          })
      );

      // Wait for all tasks
      await Promise.all(tasks);

      console.log('✅ All student data preloaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to preload student data:', error);
      return false;
    }
  }

  // Preload coordinator data during login
  async preloadCoordinatorData(coordinatorId, coordinatorData) {
    try {
      console.log('🚀 Preloading coordinator data...');
      this.resetProgress();

      const tasks = [];

      // Task 1: Cache profile photo
      if (coordinatorData.profilePicURL) {
        this.updateProgress('profilePhoto', false);
        tasks.push(
          this.cacheStudentProfilePhoto(coordinatorData.profilePicURL)
            .then(() => {
              this.updateProgress('profilePhoto', true);
              console.log('✅ Coordinator profile photo cached');
            })
            .catch(err => {
              console.warn('⚠️ Failed to cache coordinator profile photo:', err);
              this.updateProgress('profilePhoto', true);
            })
        );
      } else {
        this.updateProgress('profilePhoto', true);
      }

      // Task 2: Store profile data in localStorage
      this.updateProgress('profileData', false);
      tasks.push(
        Promise.resolve().then(() => {
          localStorage.setItem('coordinatorData', JSON.stringify(coordinatorData));
          this.updateProgress('profileData', true);
          console.log('✅ Coordinator profile data cached');
        })
      );

      // Task 3: Preload attendance data
      this.updateProgress('attendanceData', false);
      tasks.push(
        this.preloadAttendanceData('coordinator')
          .then(() => {
            this.updateProgress('attendanceData', true);
          })
          .catch(err => {
            console.warn('⚠️ Failed to preload attendance data:', err);
            this.updateProgress('attendanceData', true);
          })
      );

      // Wait for all tasks
      await Promise.all(tasks);

      console.log('✅ All coordinator data preloaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to preload coordinator data:', error);
      return false;
    }
  }

  // Cache student/coordinator profile photo
  async cacheStudentProfilePhoto(photoURL) {
    try {
      if (!photoURL) return;

      // Preload image to browser cache
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = photoURL;
      });

      console.log('✅ Profile photo preloaded to browser cache');
    } catch (error) {
      console.warn('⚠️ Failed to preload profile photo:', error);
    }
  }

  // Preload attendance data
  async preloadAttendanceData(role) {
    try {
      // Check if attendance data is already cached
      const cachedAttendance = localStorage.getItem('attendanceDataCache');
      const cacheTime = localStorage.getItem('attendanceDataCacheTime');
      const cacheExpiry = 10 * 60 * 1000; // 10 minutes

      if (cachedAttendance && cacheTime) {
        const cacheAge = Date.now() - parseInt(cacheTime, 10);
        if (cacheAge < cacheExpiry) {
          console.log('✅ Using cached attendance data');
          return JSON.parse(cachedAttendance);
        }
      }

      // Fetch fresh attendance data
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('⚠️ No auth token for attendance data');
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/attendance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Cache the attendance data
        localStorage.setItem('attendanceDataCache', JSON.stringify(data));
        localStorage.setItem('attendanceDataCacheTime', Date.now().toString());
        
        console.log('✅ Attendance data preloaded and cached');
        return data;
      }

      console.warn('⚠️ Failed to fetch attendance data:', response.status);
      return null;
    } catch (error) {
      console.warn('⚠️ Error preloading attendance data:', error);
      return null;
    }
  }

  // Clear all cached preload data
  clearPreloadCache() {
    localStorage.removeItem('attendanceDataCache');
    localStorage.removeItem('attendanceDataCacheTime');
    console.log('✅ Preload cache cleared');
  }
}

// Export singleton instance
const loginDataPreloader = new LoginDataPreloader();
export default loginDataPreloader;