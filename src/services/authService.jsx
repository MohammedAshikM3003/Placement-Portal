// MongoDB-based Authentication Service
class AuthService {
  constructor() {
    // Use environment variable or fallback based on environment
    let defaultBackendUrl;
    
    if (process.env.NODE_ENV === 'production') {
      // Production: Use Render backend URL
      defaultBackendUrl = 'https://placement-portal-zxo2.onrender.com/api';
    } else if (window.location.hostname.includes('devtunnels.ms')) {
      // Development: VS Code tunnel
      defaultBackendUrl = 'https://3nt1rq0-5000.inc1.devtunnels.ms/api';
    } else {
      // Development: Local
      defaultBackendUrl = 'http://localhost:5000/api';
    }
    
    this.baseURL = process.env.REACT_APP_API_URL || defaultBackendUrl;
    console.log('🔧 Backend URL:', this.baseURL);
  }

  // Helper method for API calls
  async apiCall(endpoint, options = {}) {
    try {
      const fullUrl = `${this.baseURL}${endpoint}`;
      console.log('🔍 API Call:', fullUrl, options);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for slow MongoDB queries
      
      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal,
        ...options
      });
      
      clearTimeout(timeoutId);

      // Handle network errors and non-JSON responses
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        if (!response.ok) {
          throw new Error(`Network error: Unable to connect to server. Please check your internet connection.`);
        }
        throw new Error('Server returned invalid response format.');
      }

      if (!response.ok) {
        const message = data?.message || data?.error || `Server error: ${response.status} ${response.statusText}`;
        const error = new Error(message);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      
      // Handle different types of errors with user-friendly messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        // Network connection error
        throw new Error('❌ Network error: Unable to connect to server. Please check your internet connection and try again.');
      } else if (error.name === 'AbortError') {
        // Request timeout
        throw new Error('❌ Request timeout: Server is taking too long to respond. Please try again.');
      } else if (error.message.includes('Failed to fetch')) {
        // General fetch failure (CORS, network issues, etc.)
        throw new Error('❌ Connection failed: Unable to reach the server. Please check your internet connection.');
      } else {
        // Re-throw the original error if it's already formatted
        throw error;
      }
    }
  }

  // Student login with registration number and date of birth
  async loginStudent(regNo, dob) {
    try {
      // CRITICAL: Clear all previous student data before new login
      console.log('🧹 CLEARING: Previous student data before new login');
      localStorage.removeItem('studentData');
      localStorage.removeItem('completeStudentData');
      localStorage.removeItem('resumeData');
      localStorage.removeItem('certificatesData');
      localStorage.removeItem('authToken');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('studentRegNo');
      localStorage.removeItem('studentDob');
      localStorage.removeItem('authRole');

      // Ensure coordinator session is cleared when switching roles
      localStorage.removeItem('coordinatorToken');
      localStorage.removeItem('coordinatorData');
      localStorage.removeItem('isCoordinatorLoggedIn');
      localStorage.removeItem('coordinatorUsername');

      // Add timeout to prevent hanging
      const loginPromise = this.apiCall('/students/login', {
        method: 'POST',
        body: JSON.stringify({ regNo, dob })
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout - please try again')), 10000)
      );
      
      let response;
      try {
        response = await Promise.race([loginPromise, timeoutPromise]);
      } catch (e) {
        throw e;
      }

      if (response.token && response.student) {
        console.log('✅ LOGIN SUCCESS: New student data received:', {
          regNo: response.student.regNo,
          name: `${response.student.firstName} ${response.student.lastName}`,
          id: response.student._id
        });
        
        // CRITICAL: Check if student is blocked (double-check for security)
        if (response.student.isBlocked || response.student.blocked) {
          console.log('❌ LOGIN BLOCKED: Student is blocked');
          return {
            success: false,
            isBlocked: true,
            coordinator: {
              name: response.student.blockedBy || 'Placement Office',
              cabin: 'N/A',
              blockedBy: response.student.blockedBy || 'Placement Office'
            },
            error: response.student.blockedReason || 'Your account is blocked.'
          };
        }
        
        // Store only token and minimal data (no sensitive login credentials)
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('authRole', 'student');
        
        // Store minimal student info (fetch full data when needed)
        const minimalStudent = {
          _id: response.student._id,
          regNo: response.student.regNo,
          firstName: response.student.firstName,
          lastName: response.student.lastName,
          branch: response.student.branch
        };
        localStorage.setItem('studentData', JSON.stringify(minimalStudent));
        
        // Clear any cached data from fastDataService
        import('./fastDataService.jsx')
          .then(module => {
            const fastDataService = module.default;
            if (fastDataService && typeof fastDataService.clearCache === 'function') {
              fastDataService.clearCache();
            }
          })
          .catch(err => {
            console.error('fastDataService clearCache failed:', err);
          });
        
        return {
          success: true,
          student: response.student,
          token: response.token,
          role: 'student'
        };
      }

      return { success: false, error: response.message || 'Login failed - no student data received' };
    } catch (error) {
      console.error('Student login error:', error);

      // CRITICAL: Check if this is a blocked account (403) - error.data contains response body
      if (error.status === 403 || (error.data && error.data.isBlocked)) {
        console.log('🚫 Blocked account detected:', error.data);
        return {
          success: false,
          isBlocked: true,
          coordinator: error.data?.coordinator || {
            name: 'Placement Office',
            cabin: 'N/A',
            blockedBy: 'Placement Office'
          },
          error: error.data?.error || error.message || 'Your account is blocked.'
        };
      }
      
      // Generic error handling
      let errorMessage = 'Login failed. Please try again.';
      if (error.message) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = '❌ User not found. Please check your registration number.';
        } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
          errorMessage = '❌ Network error. Please check your connection.';
        } else {
          errorMessage = `❌ ${error.message}`;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  }

  async loginAdmin(adminLoginID, adminPassword) {
    try {
      console.log('🧹 CLEARING: Previous admin data before new login');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      localStorage.removeItem('adminLoginID');
      localStorage.removeItem('adminProfileCache');
      localStorage.removeItem('adminProfileCacheTime');
      localStorage.removeItem('authToken');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('authRole');

      // Clear admin image cache from previous session
      const { default: adminImageCacheService } = await import('./adminImageCacheService.jsx');
      adminImageCacheService.clearAllCaches();

      // Ensure student/coordinator session is cleared
      localStorage.removeItem('studentData');
      localStorage.removeItem('coordinatorToken');

      const response = await this.apiCall('/auth/admin-login', {
        method: 'POST',
        body: JSON.stringify({
          adminLoginID: adminLoginID.trim(),
          adminPassword: adminPassword.trim()
        })
      });

      if (response.success && response.admin && response.token) {
        console.log('✅ ADMIN LOGIN SUCCESS: Admin data received:', {
          adminLoginID: response.admin.adminLoginID,
          name: response.admin.fullName
        });

        // Store only token and minimal data (no sensitive credentials)
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('authRole', 'admin');
        localStorage.setItem('isLoggedIn', 'true');
        
        // Store minimal admin identifier
        localStorage.setItem('adminLoginID', response.admin.adminLoginID);

        // � Preload all admin data (profile photo, profile data, attendance)
        try {
          const { default: loginDataPreloader } = await import('./loginDataPreloader.jsx');
          await loginDataPreloader.preloadAdminData(response.admin.adminLoginID, response.admin);
          console.log('✅ All admin data preloaded and cached');
        } catch (preloadError) {
          console.warn('⚠️ Failed to preload admin data (non-critical):', preloadError);
          
          // Fallback: Still cache profile photo
          if (response.admin.profilePhoto) {
            await adminImageCacheService.cacheAdminProfilePhoto(
              response.admin.adminLoginID, 
              response.admin.profilePhoto
            );
          }
          
          const profileCache = {
            name: response.admin.fullName,
            profilePhoto: response.admin.profilePhoto || null
          };
          localStorage.setItem('adminProfileCache', JSON.stringify(profileCache));
          localStorage.setItem('adminProfileCacheTime', Date.now().toString());
        }

        return {
          success: true,
          admin: response.admin,
          token: response.token,
          role: 'admin'
        };
      }

      return { success: false, error: response.message || 'Admin login failed' };
    } catch (error) {
      console.error('Admin login error:', error);

      // Handle network errors
      if (error.message && (
        error.message.includes('Network error') ||
        error.message.includes('Connection failed') ||
        error.message.includes('timeout')
      )) {
        return { success: false, error: error.message };
      }

      return {
        success: false,
        error: error.message || 'Admin login failed. Please try again.'
      };
    }
  }

  async loginCoordinator(coordinatorId, password) {
    try {
      console.log('🧹 CLEARING: Previous coordinator data before new login');
      const coordinatorKeys = [
        'coordinatorToken',
        'coordinatorData',
        'isCoordinatorLoggedIn',
        'coordinatorUsername'
      ];
      coordinatorKeys.forEach(key => localStorage.removeItem(key));

      // Remove student session markers when switching roles
      localStorage.removeItem('authToken');
      localStorage.removeItem('studentData');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('studentRegNo');
      localStorage.removeItem('studentDob');
      localStorage.removeItem('authRole');

      const response = await this.apiCall('/auth/coordinator-login', {
        method: 'POST',
        body: JSON.stringify({ coordinatorId, password })
      });

      if (response.token && response.coordinator) {
        // Store only token and minimal data (no sensitive credentials)
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('authRole', 'coordinator');
        localStorage.setItem('isCoordinatorLoggedIn', 'true');
        
        // Store minimal coordinator identifier
        const coordinatorIdValue = response.coordinator.coordinatorId || coordinatorId;
        const usernameValue = response.coordinator.username || coordinatorIdValue;
        localStorage.setItem('coordinatorId', coordinatorIdValue);
        localStorage.setItem('coordinatorUsername', usernameValue);
        
        // 🆕 Store full coordinator data for instant profile loading (like admin/student)
        const coordinatorData = {
          ...response.coordinator,
          coordinatorId: coordinatorIdValue,
          username: usernameValue,
          timestamp: Date.now()
        };
        localStorage.setItem('coordinatorData', JSON.stringify(coordinatorData));
        console.log('✅ Coordinator profile data cached for instant loading');

        return {
          success: true,
          coordinator: response.coordinator,
          token: response.token,
          role: 'coordinator'
        };
      }

      return { success: false, error: response.message || 'Login failed - no coordinator data received' };
    } catch (error) {
      console.error('Coordinator login error:', error);

      if (error.status === 403 && error.data && error.data.isBlocked) {
        return {
          success: false,
          isBlocked: true,
          coordinator: error.data.coordinator,
          error: error.data.error || 'Your coordinator account is blocked.'
        };
      }

      let errorMessage = 'Login failed. Please try again.';
      if (error.message) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = '❌ Coordinator not found. Please check your ID.';
        } else if (error.message.includes('401') || error.message.includes('Invalid credentials')) {
          errorMessage = '❌ Invalid coordinator ID or password.';
        } else if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
          errorMessage = '❌ Network error. Please check your connection.';
        } else {
          errorMessage = `❌ ${error.message}`;
        }
      }

      return { success: false, error: errorMessage };
    }
  }

  // Student registration
  async registerStudent(studentData) {
    try {
      const response = await this.apiCall('/students', {
        method: 'POST',
        body: JSON.stringify(studentData)
      });

      return {
        success: true,
        student: response.student
      };
    } catch (error) {
      console.error('Student registration error:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if user is logged in
  isLoggedIn() {
    const token = localStorage.getItem('authToken');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    return !!(token && isLoggedIn);
  }

  // Get current student data
  getCurrentStudent() {
    const studentData = localStorage.getItem('studentData');
    return studentData ? JSON.parse(studentData) : null;
  }

  // Logout
  logout() {
    // Clear admin image cache
    import('./adminImageCacheService.jsx')
      .then(({ default: adminImageCacheService }) => {
        adminImageCacheService.clearAllCaches();
        console.log('✅ Admin image cache cleared on logout');
      })
      .catch(err => {
        console.warn('⚠️ Failed to clear admin image cache on logout:', err);
      });

    // Clear all authentication tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('authRole');
    localStorage.removeItem('isLoggedIn');
    
    // Clear student data
    localStorage.removeItem('studentData');
    localStorage.removeItem('completeStudentData');
    localStorage.removeItem('resumeData');
    localStorage.removeItem('certificatesData');
    
    // Clear coordinator data
    localStorage.removeItem('coordinatorId');
    localStorage.removeItem('coordinatorUsername');
    localStorage.removeItem('isCoordinatorLoggedIn');
    localStorage.removeItem('coordinatorData'); // Legacy
    localStorage.removeItem('coordinatorToken'); // Legacy
    
    // Clear admin data
    localStorage.removeItem('adminLoginID');
    localStorage.removeItem('adminProfileCache');
    localStorage.removeItem('adminProfileCacheTime');
    localStorage.removeItem('adminData'); // Legacy
    localStorage.removeItem('adminToken'); // Legacy
    localStorage.removeItem('adminId'); // Legacy
    localStorage.removeItem('userRole'); // Legacy
    
    console.log('🧹 All session data cleared');
  }

  // Update student profile
  async updateStudentProfile(studentId, updateData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await this.apiCall(`/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      // Update localStorage with new data
      const currentStudent = this.getCurrentStudent();
      if (currentStudent) {
        const updatedStudent = { ...currentStudent, ...updateData };
        localStorage.setItem('studentData', JSON.stringify(updatedStudent));
      }

      return {
        success: true,
        student: response.student
      };
    } catch (error) {
      console.error('Update student profile error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get authentication token
  getAuthToken() {
    return localStorage.getItem('authToken');
  }

  // Verify token validity
  async verifyToken() {
    try {
      const token = this.getAuthToken();
      if (!token) {
        return { valid: false, error: 'No token found' };
      }

      // Make a simple API call to verify token
      await this.apiCall('/health', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return { valid: true };
    } catch (error) {
      console.error('Token verification error:', error);
      return { valid: false, error: error.message };
    }
  }

  // Legacy methods for compatibility (simplified)
  async signInWithCustomToken(token) {
    // This is a legacy Firebase method - not needed for MongoDB
    console.warn('signInWithCustomToken is not supported in MongoDB auth service');
    return { success: false, error: 'Method not supported' };
  }

  async signOut() {
    this.logout();
    return { success: true };
  }

  async createUserWithEmailAndPassword(email, password) {
    // This is a legacy Firebase method - not needed for MongoDB
    console.warn('createUserWithEmailAndPassword is not supported in MongoDB auth service');
    return { success: false, error: 'Method not supported' };
  }

  async updateProfile(displayName, photoURL) {
    // This is a legacy Firebase method - not needed for MongoDB
    console.warn('updateProfile is not supported in MongoDB auth service');
    return { success: false, error: 'Method not supported' };
  }

  // Auth state change listener (simplified)
  onAuthStateChanged(callback) {
    // For MongoDB, we'll use localStorage changes
    const checkAuthState = () => {
      const isLoggedIn = this.isLoggedIn();
      const student = this.getCurrentStudent();
      callback(isLoggedIn ? student : null);
    };

    // Check immediately
    checkAuthState();

    // Listen for storage changes
    window.addEventListener('storage', checkAuthState);
    
    // Return unsubscribe function
    return () => {
      window.removeEventListener('storage', checkAuthState);
    };
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;
