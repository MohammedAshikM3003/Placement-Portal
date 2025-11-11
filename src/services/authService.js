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

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Student login with registration number and date of birth
  async loginStudent(regNo, dob) {
    try {
      const response = await this.apiCall('/students/login', {
        method: 'POST',
        body: JSON.stringify({ regNo, dob })
      });

      if (response.token) {
        // Store token and student data
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('studentData', JSON.stringify(response.student));
        localStorage.setItem('isLoggedIn', 'true');
        
        return {
          success: true,
          student: response.student,
          token: response.token
        };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Student login error:', error);
      return { success: false, error: error.message };
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
