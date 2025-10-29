// MongoDB Service for Frontend
class MongoDBService {
  constructor() {
    // Use environment variable or fallback to localhost
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  // Ultra-fast API calls with timeout
  async apiCall(endpoint, options = {}) {
    try {
      // Reasonable timeout for MongoDB operations
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for MongoDB operations
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal,
        ...options
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Student not found. Please check your registration number and date of birth.');
        } else if (response.status === 404) {
          if (endpoint.includes('/certificates/')) {
            throw new Error('Certificate not found.');
          } else if (endpoint.includes('/resume/')) {
            throw new Error('Resume not found.');
          } else {
            throw new Error('Student not found. Please register first.');
          }
        } else {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // ============ STUDENT OPERATIONS ============
  
  async loginStudent(regNo, dob) {
    try {
      const response = await this.apiCall('/students/login', {
        method: 'POST',
        body: JSON.stringify({ regNo, dob })
      });

      if (response.token) {
        // Store only authentication token
        localStorage.setItem('authToken', response.token);
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
  
  async getStudentByRegNoAndDob(regNo, dob) {
    try {
      const response = await this.apiCall(`/students/reg/${regNo}/dob/${dob}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get student by regNo and dob error:', error);
      throw error;
    }
  }

  async createStudent(studentData) {
    try {
      const response = await this.apiCall('/students', {
        method: 'POST',
        body: JSON.stringify(studentData)
      });
      return response;
    } catch (error) {
      console.error('Create student error:', error);
      throw error;
    }
  }

  async updateStudent(studentId, updateData) {
    try {
      const response = await this.apiCall(`/students/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      return response;
    } catch (error) {
      console.error('Update student error:', error);
      throw error;
    }
  }

  async getStudentByRegNoAndDob(regNo, dob) {
    try {
      const response = await this.apiCall(`/students/reg/${regNo}/dob/${dob}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error('Get student by regNo and dob error:', error);
      throw error;
    }
  }

  async checkStudentExists(regNo) {
    try {
      const response = await this.apiCall(`/students/check/${regNo}`, {
        method: 'GET'
      });
      return response.exists;
    } catch (error) {
      console.error('Check student exists error:', error);
      throw error;
    }
  }

  async updateStudent(studentId, updateData) {
    try {
      const response = await this.apiCall(`/students/${studentId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
      return response;
    } catch (error) {
      console.error('Update student error:', error);
      throw error;
    }
  }

  // ============ RESUME ANALYSIS ============
  
  async analyzeResumeText(text) {
    return await this.apiCall('/resume/analyze', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  async uploadResumeFile(file, studentId) {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('studentId', studentId);

    const response = await fetch(`${this.baseURL}/resume/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Upload failed: ${response.status} ${response.statusText}${errorData.details ? ` - ${errorData.details}` : ''}`);
    }

    return await response.json();
  }

  async getResume(studentId) {
    return await this.apiCall(`/resume/${studentId}`);
  }

  async saveResumeAnalysis(studentId, analysisResult) {
    return await this.apiCall('/resume/analyze', {
      method: 'POST',
      body: JSON.stringify({ studentId, analysisResult })
    });
  }

  async analyzeResumeWithFile(studentId, fileData, fileName) {
    return await this.apiCall('/resume/analyze', {
      method: 'POST',
      body: JSON.stringify({ studentId, fileData, fileName })
    });
  }

  async getResumeAnalysis(studentId) {
    return await this.apiCall(`/resume/analysis/${studentId}`);
  }

  // ============ CERTIFICATES ============
  
  async createCertificate(certificateData) {
    return await this.apiCall('/certificates', {
      method: 'POST',
      body: JSON.stringify(certificateData)
    });
  }

  async updateCertificate(certificateId, certificateData) {
    return await this.apiCall(`/certificates/${certificateId}`, {
      method: 'PUT',
      body: JSON.stringify(certificateData)
    });
  }

  async getCertificateByAchievementId(studentId, achievementId) {
    return await this.apiCall(`/certificates/student/${studentId}/achievement/${achievementId}`);
  }

  async getCertificatesByStudentId(studentId) {
    return await this.apiCall(`/certificates/student/${studentId}`);
  }

  async updateCertificate(certificateId, updateData) {
    return await this.apiCall(`/certificates/${certificateId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  async deleteCertificate(certificateId) {
    return await this.apiCall(`/certificates/${certificateId}`, {
      method: 'DELETE'
    });
  }

  // ============ ACHIEVEMENTS ============
  
  async createAchievement(achievementData) {
    return await this.apiCall('/achievements', {
      method: 'POST',
      body: JSON.stringify(achievementData)
    });
  }

  async getAchievementsByStudentId(studentId) {
    return await this.apiCall(`/achievements/student/${studentId}`);
  }

  async updateAchievement(achievementId, updateData) {
    return await this.apiCall(`/achievements/${achievementId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  async deleteAchievement(achievementId) {
    return await this.apiCall(`/achievements/${achievementId}`, {
      method: 'DELETE'
    });
  }

  // ============ USER AUTHENTICATION ============
  
  async loginUser(email, password) {
    return await this.apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async createUser(userData) {
    return await this.apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  // ============ HEALTH CHECK ============
  
  async healthCheck() {
    return await this.apiCall('/health');
  }
}

// Create singleton instance
const mongoDBService = new MongoDBService();

export default mongoDBService;
