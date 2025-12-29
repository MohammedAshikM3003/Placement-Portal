// MongoDB Service for Frontend
class MongoDBService {
  constructor() {
    // Use environment variable or fallback to localhost
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  // Ultra-fast API calls with timeout
  async apiCall(endpoint, options = {}) {
    try {
      // FIX: Increased timeout from 30000ms to 60000ms (60 seconds) for complex operations (Update/Edit)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for MongoDB operations
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        signal: controller.signal,
        ...options
      });

      clearTimeout(timeoutId);

      const rawText = await response.text();
      let data = null;
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch (parseError) {
          // Non-JSON response – leave data as null
        }
      }

      if (!response.ok) {
        let errorMessage;

        if (response.status === 401) {
          errorMessage = 'Student not found. Please check your registration number and date of birth.';
        } else if (response.status === 404) {
          if (endpoint.includes('/certificates/')) {
            errorMessage = 'Certificate not found.';
          } else if (endpoint.includes('/resume/')) {
            errorMessage = 'Resume not found.';
          } else {
            errorMessage = 'Student not found. Please register first.';
          }
        } else {
          const backendMessage = data?.message || data?.error || data?.details;
          const details = Array.isArray(data?.details) ? data.details.join(', ') : data?.details;
          const combinedDetails = details && details !== backendMessage ? ` - ${details}` : '';
          errorMessage = backendMessage
            ? `API Error: ${response.status} ${backendMessage}${combinedDetails}`
            : `API Error: ${response.status} ${response.statusText}`;
        }

        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // ============ STUDENT OPERATIONS ============
  
  async getStudents(filters = {}) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    const qs = query.toString();
    const endpoint = qs ? `/students?${qs}` : '/students';
    return await this.apiCall(endpoint, { method: 'GET' });
  }

  async getCompanies() {
    const response = await this.apiCall('/admin/companies');
    return response.companies;
  }

  async getBranches() {
    const response = await this.apiCall('/branches');
    return response?.branches || [];
  }

  async getDegrees() {
    const response = await this.apiCall('/degrees');
    return response?.degrees || [];
  }

  async createCompanyDrive(companyData) {
    const payload = {
      ...companyData,
      eligibleBranches: Array.isArray(companyData?.eligibleBranches)
        ? companyData.eligibleBranches
        : companyData?.department
          ? [companyData.department]
          : [],
    };
    const response = await this.apiCall('/company-drives', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response;
  }

  async getCompanyDrives() {
    const response = await this.apiCall('/company-drives');
    return response.drives;
  }

  async deleteCompanyDrive(driveId) {
    return this.apiCall(`/company-drives/${driveId}`, { method: 'DELETE' });
  }

  async updateCompanyDrive(companyId, companyData) {
    const payload = {
      ...companyData,
      eligibleBranches: Array.isArray(companyData?.eligibleBranches)
        ? companyData.eligibleBranches
        : companyData?.department
          ? [companyData.department]
          : [],
    };
    const response = await this.apiCall(`/company-drives/${companyId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response;
  }

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

  async deleteStudent(studentId) {
    try {
      const response = await this.apiCall(`/students/${studentId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('Delete student error:', error);
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

  async getCertificatesByDepartment(department, options = {}) {
    if (!department) {
      throw new Error('Department is required to fetch certificates');
    }

    const params = new URLSearchParams();
    params.append('department', department.toString().trim().toUpperCase());

    if (options.status) {
      params.append('status', options.status);
    }

    if (options.search) {
      params.append('search', options.search.trim());
    }

    if (options.regNo) {
      params.append('regNo', options.regNo.toString().trim());
    }

    if (options.includeFileData) {
      params.append('includeFileData', 'true');
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/certificates?${queryString}` : '/certificates';
    return await this.apiCall(endpoint, { method: 'GET' });
  }

  // NOTE: This function fetches the full certificate document including fileData
  async getCertificateFileByAchievementId(studentId, achievementId) {
    try {
        const response = await this.apiCall(`/certificates/student/${studentId}/achievement/${achievementId}`, {
            method: 'GET'
        });
        return response; 
    } catch (error) {
        console.error('Get single certificate file error:', error);
        throw error;
    }
  }

  async getCertificatesByStudentId(studentId) {
    return await this.apiCall(`/certificates/student/${studentId}`);
  }

  // This function is called with the MongoDB _id of the certificate document
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

  // ============ COORDINATORS ============

  async createCoordinator(coordinatorData) {
    return await this.apiCall('/coordinators', {
      method: 'POST',
      body: JSON.stringify(coordinatorData)
    });
  }

  async getCoordinators(filters = {}) {
    const query = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });

    const queryString = query.toString();
    const endpoint = queryString ? `/coordinators?${queryString}` : '/coordinators';
    return await this.apiCall(endpoint);
  }

  async updateCoordinatorBlockStatus(coordinatorId, isBlocked) {
    return await this.apiCall(`/coordinators/${encodeURIComponent(coordinatorId)}/block`, {
      method: 'PATCH',
      body: JSON.stringify({ isBlocked })
    });
  }

  async getCoordinatorById(coordinatorId) {
    if (!coordinatorId) {
      throw new Error('Coordinator ID is required');
    }

    return await this.apiCall(`/coordinators/${encodeURIComponent(coordinatorId)}`);
  }

  async deleteCoordinator(coordinatorId) {
    if (!coordinatorId) {
      throw new Error('Coordinator ID is required');
    }

    return await this.apiCall(`/coordinators/${encodeURIComponent(coordinatorId)}`, {
      method: 'DELETE'
    });
  }

  async updateCoordinatorCredentials(coordinatorId, updates = {}) {
    if (!coordinatorId) {
      throw new Error('Coordinator ID is required');
    }

    const payload = {};
    if (typeof updates.username === 'string' && updates.username.trim()) {
      payload.username = updates.username.trim();
    }
    if (typeof updates.password === 'string' && updates.password.trim()) {
      payload.password = updates.password.trim();
    }

    if (!Object.keys(payload).length) {
      throw new Error('No credential changes provided');
    }

    return await this.apiCall(`/coordinators/${encodeURIComponent(coordinatorId)}/credentials`, {
      method: 'PUT',
      body: JSON.stringify(payload)
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