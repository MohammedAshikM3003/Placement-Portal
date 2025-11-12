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
      
      const response = await fetch(fullUrl, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      // Parse response body first
      const data = await response.json();

      if (!response.ok) {
        // Use backend error message if available
        const errorMessage = data.message || data.error || `API Error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
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
      
      // Add timeout to prevent hanging
      const loginPromise = this.apiCall('/students/login', {
        method: 'POST',
        body: JSON.stringify({ regNo, dob })
      });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Login timeout - please try again')), 3000)
      );
      
      const response = await Promise.race([loginPromise, timeoutPromise]);

      if (response.token && response.student) {
        console.log('✅ LOGIN SUCCESS: New student data received:', {
          regNo: response.student.regNo,
          name: `${response.student.firstName} ${response.student.lastName}`,
          id: response.student._id
        });
        
        // Store token and student data
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('studentData', JSON.stringify(response.student));
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('studentRegNo', regNo);
        localStorage.setItem('studentDob', dob);
        
        // Clear any cached data from fastDataService
        const fastDataService = (await import('./fastDataService.js')).default;
        fastDataService.clearCache();
        
        return {
          success: true,
          student: response.student,
          token: response.token
        };
      }

      return { success: false, error: response.message || 'Login failed - no student data received' };
    } catch (error) {
      console.error('Student login error:', error);
      
      // Parse error message from backend
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message) {
        // Check for specific error messages
        if (error.message.includes('404') || error.message.includes('not found')) {
          errorMessage = '❌ User not found. Please check your registration number.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized') || error.message.includes('password')) {
          errorMessage = '❌ Incorrect password. Please try again.';
        } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
          errorMessage = '❌ Invalid credentials. Please check your details.';
        } else if (error.message.includes('500') || error.message.includes('Server Error')) {
          errorMessage = '❌ Server error. Please try again later.';
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
    localStorage.removeItem('authToken');
    localStorage.removeItem('studentData');
    localStorage.removeItem('isLoggedIn');
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
