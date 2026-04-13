// MongoDB Service for Frontend
import { API_BASE_URL } from '../utils/apiConfig';

class MongoDBService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Ultra-fast API calls with timeout
  async apiCall(endpoint, options = {}) {
    try {
      // FIX: Increased timeout from 30000ms to 60000ms (60 seconds) for complex operations (Update/Edit)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for MongoDB operations
      
      // Define public endpoints that don't require authentication
      const publicEndpoints = [
        '/health'
      ];
      
      // Check if this is a public endpoint (exact match for GET placed-students)
      const isPublicEndpoint = publicEndpoints.some(publicPath => endpoint.includes(publicPath)) ||
        (endpoint === '/placed-students' || endpoint.startsWith('/placed-students?'));
      
      // Get auth token from localStorage (only for non-public endpoints)
      const authToken = !isPublicEndpoint ? localStorage.getItem('authToken') : null;
      
      // Merge headers properly - options.headers should override defaults
      const headers = {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...(options.headers || {})
      };
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
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
          // For public endpoints, provide a more generic error
          if (isPublicEndpoint) {
            errorMessage = 'Unable to fetch data. Please try again later.';
          } else {
            errorMessage = 'Student not found. Please check your registration number and date of birth.';
          }
        } else if (response.status === 404) {
          if (endpoint.includes('/students/') || endpoint.includes('/students?')) {
            errorMessage = 'Student not found. Please register first.';
          } else if (endpoint.includes('/certificates/')) {
            errorMessage = 'Certificate not found.';
          } else if (endpoint.includes('/resume/')) {
            errorMessage = 'Resume not found.';
          } else {
            errorMessage = data?.error || data?.message || `Resource not found: ${endpoint}`;
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
    
    // OPTIMIZED: Default to smaller page size and exclude images
    const finalFilters = {
      page: 1,
      limit: 20,
      includeImages: 'false', // Exclude images by default for faster loading
      ...filters
    };
    
    Object.entries(finalFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    
    const qs = query.toString();
    const endpoint = qs ? `/students?${qs}` : '/students';
    const authToken = localStorage.getItem('authToken');
    
    const response = await this.apiCall(endpoint, { 
      method: 'GET', 
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined 
    });
    
    // Handle both old array format and new paginated format
    if (Array.isArray(response)) {
      // Old format - return as is for backward compatibility
      return response;
    } else if (response.students) {
      // New paginated format - attach metadata for components that need it
      const result = response.students;
      result._pagination = {
        total: response.total,
        totalPages: response.totalPages,
        page: response.page,
        limit: response.limit
      };
      return result;
    }
    
    return [];
  }
  
  // New method for paginated requests with full metadata
  async getStudentsPaginated(filters = {}) {
    const query = new URLSearchParams();
    
    const finalFilters = {
      page: 1,
      limit: 50,
      includeImages: 'false',
      ...filters
    };
    
    Object.entries(finalFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    
    const qs = query.toString();
    const endpoint = `/students?${qs}`;
    const authToken = localStorage.getItem('authToken');
    
    // Timeout for paginated queries - 2 minutes for slow 4.26 Mbps India->US connection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: authToken ? { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}` 
        } : { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - try reducing the number of students per page');
      }
      throw error;
    }
  }

  async aiFilterStudents(prompt) {
    if (!prompt || !prompt.trim()) {
      throw new Error('Prompt is required');
    }

    return await this.apiCall('/admin/students/ai-filter', {
      method: 'POST',
      body: JSON.stringify({ prompt: prompt.trim() })
    });
  }

  // Get single student by ID
  async getStudentById(studentId) {
    const authToken = localStorage.getItem('authToken');
    return await this.apiCall(`/students/${studentId}`, {
      method: 'GET',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined
    });
  }

  // Lazy load profile image for a single student
  async getStudentProfileImage(studentId) {
    const authToken = localStorage.getItem('authToken');
    return await this.apiCall(`/students/${studentId}/profile-image`, {
      method: 'GET',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined
    });
  }

  async getCompanies() {
    const response = await this.apiCall('/admin/companies');
    return response.companies;
  }

  async getBranches() {
    const response = await this.apiCall('/branches');
    // Return the branches array directly for backward compatibility
    return response?.branches || [];
  }

  async getBranchesByDegree(degree) {
    const response = await this.apiCall(`/branches?degree=${encodeURIComponent(degree)}`);
    return response?.branches || [];
  }

  async deleteBranch(branchCode) {
    if (!branchCode) {
      throw new Error('Branch code is required');
    }

    return await this.apiCall(`/branches/${encodeURIComponent(branchCode)}`, {
      method: 'DELETE'
    });
  }

  // NEW: Optimized branch summary with server-side aggregation
  async getBranchesSummary() {
    const response = await this.apiCall('/admin/branches-summary');
    return {
      branches: response?.branches || [],
      totalCoordinators: response?.totalCoordinators || 0
    };
  }

  async getDegrees() {
    const response = await this.apiCall('/degrees');
    return response?.degrees || [];
  }

  async createDegree(degreeData) {
    return await this.apiCall('/degrees', {
      method: 'POST',
      body: JSON.stringify(degreeData)
    });
  }

  async createBranch(branchData) {
    return await this.apiCall('/branches', {
      method: 'POST',
      body: JSON.stringify(branchData)
    });
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

  async createTraining(trainingData) {
    return await this.apiCall('/trainings', {
      method: 'POST',
      body: JSON.stringify(trainingData)
    });
  }

  async updateTraining(trainingId, trainingData) {
    if (!trainingId) {
      throw new Error('Training ID is required for update');
    }

    return await this.apiCall(`/trainings/${trainingId}`, {
      method: 'PUT',
      body: JSON.stringify(trainingData)
    });
  }

  async getTrainings() {
    const response = await this.apiCall('/trainings', {
      method: 'GET'
    });
    return response?.trainings || [];
  }

  async createScheduledTraining(scheduleData) {
    return await this.apiCall('/scheduled-trainings', {
      method: 'POST',
      body: JSON.stringify(scheduleData)
    });
  }

  async getScheduledTrainings() {
    const response = await this.apiCall('/scheduled-trainings', {
      method: 'GET'
    });
    return response?.schedules || [];
  }

  async deleteScheduledTraining(scheduleId) {
    if (!scheduleId) {
      throw new Error('Scheduled training ID is required for deletion');
    }

    return await this.apiCall(`/scheduled-trainings/${scheduleId}`, {
      method: 'DELETE'
    });
  }

  async getTrainingCoursesByYear(year) {
    const query = year ? `?year=${encodeURIComponent(year)}` : '';
    const response = await this.apiCall(`/training-courses${query}`, {
      method: 'GET'
    });
    return response?.courses || [];
  }

  async saveScheduledTrainingBatchAssignment(assignmentData) {
    return await this.apiCall('/scheduled-training-batches/assign', {
      method: 'POST',
      body: JSON.stringify(assignmentData)
    });
  }

  async getScheduledTrainingBatchAssignments(filters = {}) {
    const query = new URLSearchParams();

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });

    const response = await this.apiCall(`/scheduled-training-batches${query.toString() ? `?${query.toString()}` : ''}`, {
      method: 'GET'
    });

    return response?.assignments || [];
  }

  async getStudentTrainingAssignment(regNo) {
    if (!regNo) return null;
    const response = await this.apiCall(`/students/${encodeURIComponent(regNo)}/training-assignment`, {
      method: 'GET'
    });
    return response?.assignment || null;
  }

  async getCompanyDrives() {
    const response = await this.apiCall('/company-drives');
    const drives = response.drives || [];
    
    // Validate that critical fields exist to prevent future display issues
    if (drives.length > 0) {
      const requiredFields = ['companyName', 'jobRole', 'startingDate', 'endingDate', 'rounds', 'mode', 'department'];
      const sample = drives[0];
      const missingFields = requiredFields.filter(field => !(field in sample));
      if (missingFields.length > 0) {
        console.error('🚨 CRITICAL: Company drives API missing required fields:', missingFields);
        console.error('🚨 This will cause display issues in Admin/Coordinator pages');
        console.error('🚨 Check backend /api/company-drives endpoint for .select() limitations');
      }
    }
    
    return drives;
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
      console.log('📝 mongoDBService: Updating student', {
        studentId,
        updateData,
        hasBlockedField: 'isBlocked' in updateData || 'blocked' in updateData
      });
      
      const authToken = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await this.apiCall(`/students/${studentId}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(updateData)
      });
      
      console.log('✅ mongoDBService: Student updated successfully', response);
      return response;
    } catch (error) {
      console.error('❌ mongoDBService: Update student error:', error);
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

    // Get JWT token from localStorage
    const authToken = localStorage.getItem('authToken');
    const headers = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${this.baseURL}/resume/upload`, {
      method: 'POST',
      headers: headers, // Include JWT token in headers
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
    const authToken = localStorage.getItem('authToken');
    return await this.apiCall('/certificates', {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      body: JSON.stringify(certificateData)
    });
  }

  async updateCertificate(certificateId, certificateData) {
    const authToken = localStorage.getItem('authToken');
    return await this.apiCall(`/certificates/${certificateId}`, {
      method: 'PUT',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      body: JSON.stringify(certificateData)
    });
  }

  async upsertCertificateByStudentAndAchievement(studentId, achievementId, certificateData) {
    const authToken = localStorage.getItem('authToken');
    return await this.apiCall(`/certificates/student/${studentId}/achievement/${achievementId}`, {
      method: 'PUT',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
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
        const authToken = localStorage.getItem('authToken');
        const response = await this.apiCall(`/certificates/student/${studentId}/achievement/${achievementId}`, {
            method: 'GET',
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined
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

  async updateCoordinatorBlockStatus(coordinatorId, isBlocked, metadata = {}) {
    return await this.apiCall(`/coordinators/${encodeURIComponent(coordinatorId)}/block`, {
      method: 'PATCH',
      body: JSON.stringify({ isBlocked, ...metadata })
    });
  }

  async getCoordinatorById(coordinatorId) {
    if (!coordinatorId) {
      throw new Error('Coordinator ID is required');
    }

    return await this.apiCall(`/coordinators/${encodeURIComponent(coordinatorId)}`);
  }

  async updateCoordinator(coordinatorId, updateData) {
    if (!coordinatorId) {
      throw new Error('Coordinator ID is required');
    }

    return await this.apiCall(`/coordinators/${encodeURIComponent(coordinatorId)}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
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

  // ============ STUDENT APPLICATIONS ============
  
  async createStudentApplications(studentIds, companyName, jobRole, driveId = '', nasaDate = '', filterCriteria = {}) {
    return await this.apiCall('/student-applications', {
      method: 'POST',
      body: JSON.stringify({
        studentIds,
        companyName,
        jobRole,
        driveId,
        nasaDate,
        filterCriteria
      })
    });
  }

  async getStudentApplications(studentId) {
    return await this.apiCall(`/student-applications/${studentId}`, {
      method: 'GET'
    });
  }

  async updateStudentApplicationStatus(applicationId, status) {
    return await this.apiCall(`/student-applications/${applicationId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async storeEligibleStudents(companyName, driveStartDate, driveEndDate, jobRole, filterCriteria, students, driveId) {
    return await this.apiCall('/eligible-students', {
      method: 'POST',
      body: JSON.stringify({
        driveId,
        companyName,
        driveStartDate,
        driveEndDate,
        jobRole,
        filterCriteria,
        students
      })
    });
  }

  async deleteStudentApplication(applicationId) {
    return await this.apiCall(`/student-applications/${applicationId}`, {
      method: 'DELETE'
    });
  }

  async deleteAllStudentApplications(studentId) {
    return await this.apiCall(`/student-applications/student/${studentId}`, {
      method: 'DELETE'
    });
  }

  async getEligibleStudentsForStudent(studentId) {
    return await this.apiCall(`/eligible-students/student/${studentId}`, {
      method: 'GET'
    });
  }

  async getAllEligibleStudents() {
    // Add cache-busting timestamp to prevent browser caching
    const timestamp = new Date().getTime();
    return await this.apiCall(`/eligible-students?_t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }

  async getCoordinatorEligibleStudents(filters = {}) {
    const query = new URLSearchParams();

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });

    const queryString = query.toString();
    const endpoint = queryString
      ? `/eligible-students/coordinator?${queryString}`
      : '/eligible-students/coordinator';

    return await this.apiCall(endpoint, {
      method: 'GET'
    });
  }

  // ============ ATTENDANCE OPERATIONS ============
  
  async submitTrainingAttendance(attendanceData) {
    return await this.apiCall('/training-attendance/submit', {
      method: 'POST',
      body: JSON.stringify(attendanceData)
    });
  }

  async getTrainingAttendance(filters = {}) {
    const query = new URLSearchParams();

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });

    const response = await this.apiCall(`/training-attendance${query.toString() ? `?${query.toString()}` : ''}`, {
      method: 'GET'
    });

    return response?.attendances || [];
  }

  async submitAttendance(attendanceData) {
    // Ensure driveId is included
    if (!attendanceData.driveId) {
      console.warn('Warning: submitAttendance called without driveId');
    }
    return await this.apiCall('/attendance/submit', {
      method: 'POST',
      body: JSON.stringify(attendanceData)
    });
  }

  async updateAttendance(attendanceId, attendanceData) {
    return await this.apiCall(`/attendance/${attendanceId}`, {
      method: 'PUT',
      body: JSON.stringify(attendanceData)
    });
  }

  async getAllAttendances() {
    return await this.apiCall('/attendance', {
      method: 'GET'
    });
  }

  async getStudentAttendance(studentId) {
    return await this.apiCall(`/attendance/student/${studentId}`, {
      method: 'GET'
    });
  }

  async getStudentAttendanceByRegNo(regNo) {
    return await this.apiCall(`/attendance/student/regNo/${regNo}`, {
      method: 'GET'
    });
  }

  async getStudentTrainingAttendanceByRegNo(regNo) {
    return await this.apiCall(`/training-attendance/student/regNo/${encodeURIComponent(regNo)}`, {
      method: 'GET'
    });
  }

  // ============ ROUND RESULTS ============
  
  async saveRoundResults(roundData) {
    // Ensure driveId is included in the payload
    if (!roundData.driveId) {
      console.warn('Warning: saveRoundResults called without driveId');
    }
    return await this.apiCall('/round-results/save', {
      method: 'POST',
      body: JSON.stringify(roundData)
    });
  }

  async getRoundResults(companyName, jobRole, roundNumber, startingDate, driveId) {
    const params = { roundNumber };
    if (driveId) {
      params.driveId = driveId;
    } else {
      // Fallback to old method if driveId not provided
      params.companyName = companyName;
      params.jobRole = jobRole;
      if (startingDate) params.startingDate = startingDate;
    }
    const query = new URLSearchParams(params).toString();
    return await this.apiCall(`/round-results?${query}`, {
      method: 'GET'
    });
  }

  async getAllRoundResults(companyName, jobRole, startingDate, driveId) {
    const params = {};
    if (driveId) {
      params.driveId = driveId;
    } else {
      // Fallback to old method if driveId not provided
      params.companyName = companyName;
      params.jobRole = jobRole;
      if (startingDate) params.startingDate = startingDate;
    }
    const query = new URLSearchParams(params).toString();
    return await this.apiCall(`/round-results/all?${query}`, {
      method: 'GET'
    });
  }

  async updateStudentApplicationRounds(roundData) {
    return await this.apiCall('/student-applications/update-rounds', {
      method: 'POST',
      body: JSON.stringify(roundData)
    });
  }

  async generateAdminFeedback(payload) {
    return await this.apiCall('/feedback/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async saveAdminFeedback(payload) {
    return await this.apiCall('/feedback/save', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async generateStudentFeedback(payload) {
    return await this.apiCall('/student-feedback/generate', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async saveStudentFeedback(payload) {
    return await this.apiCall('/student-feedback/save', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async getStudentFeedback(filters = {}) {
    const params = new URLSearchParams();
    if (filters.driveId !== undefined && filters.driveId !== null && String(filters.driveId).trim() !== '') {
      params.append('driveId', String(filters.driveId).trim());
    }
    if (filters.companyName) params.append('companyName', String(filters.companyName).trim());
    if (filters.jobRole) params.append('jobRole', String(filters.jobRole).trim());
    if (filters.startingDate) params.append('startingDate', String(filters.startingDate).trim());
    if (filters.roundNumber !== undefined && filters.roundNumber !== null && String(filters.roundNumber).trim() !== '') {
      params.append('roundNumber', String(filters.roundNumber).trim());
    }
    if (filters.studentId) params.append('studentId', String(filters.studentId).trim());
    if (filters.regNo) params.append('regNo', String(filters.regNo).trim());

    return await this.apiCall(`/student-feedback?${params.toString()}`, {
      method: 'GET'
    });
  }

  async getFeedbackByDrive(driveId, filters = {}) {
    const params = new URLSearchParams();
    if (driveId !== undefined && driveId !== null && String(driveId).trim() !== '') {
      params.append('driveId', String(driveId).trim());
    }
    if (filters.companyName) params.append('companyName', String(filters.companyName).trim());
    if (filters.jobRole) params.append('jobRole', String(filters.jobRole).trim());
    if (filters.startingDate) params.append('startingDate', String(filters.startingDate).trim());
    if (filters.roundNumber !== undefined && filters.roundNumber !== null && String(filters.roundNumber).trim() !== '') {
      params.append('roundNumber', String(filters.roundNumber).trim());
    }
    if (filters.feedbackType) params.append('feedbackType', String(filters.feedbackType).trim());

    return await this.apiCall(`/feedback?${params.toString()}`, {
      method: 'GET'
    });
  }

  // ============ PLACED STUDENTS ============

  async savePlacedStudents(placedStudentsData) {
    return await this.apiCall('/placed-students/save', {
      method: 'POST',
      body: JSON.stringify(placedStudentsData)
    });
  }

  async getPlacedStudents(filters = {}) {
    const query = new URLSearchParams(
      Object.entries(filters).filter(([_, v]) => v !== null && v !== undefined && v !== '')
    ).toString();
    const endpoint = query ? `/placed-students?${query}` : '/placed-students';
    return await this.apiCall(endpoint, {
      method: 'GET'
    });
  }

  async uploadPlacedStudentOffer(file, payload = {}) {
    const formData = new FormData();
    formData.append('offerLetter', file);
    if (payload.placedStudentId) formData.append('placedStudentId', payload.placedStudentId);
    if (payload.regNo) formData.append('regNo', payload.regNo);
    if (payload.company) formData.append('company', payload.company);
    if (payload.role) formData.append('role', payload.role);

    const authToken = localStorage.getItem('authToken');
    const headers = {};
    if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

    const response = await fetch(`${this.baseURL}/placed-students/offer/upload`, {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || data?.message || `Upload failed: ${response.status}`);
    }

    return data;
  }

  // ============ REPORTS (FOR ANALYSIS PAGES) ============

  async getAllReports() {
    return await this.apiCall('/reports/all', {
      method: 'GET'
    });
  }

  async getFilteredReports(filters = {}) {
    const query = new URLSearchParams(
      Object.entries(filters).filter(([_, v]) => v !== null && v !== undefined && v !== '')
    ).toString();
    return await this.apiCall(`/reports/filtered?${query}`, {
      method: 'GET'
    });
  }

  async getCompanyWiseAnalysis(companyName = null, startDate = null, endDate = null) {
    const params = {};
    if (companyName) params.companyName = companyName;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const query = new URLSearchParams(params).toString();
    return await this.apiCall(`/reports/company-wise-analysis${query ? '?' + query : ''}`, {
      method: 'GET'
    });
  }

  // ============ ATTENDANCE ============

  async getAttendanceByBranch(branch, filters = {}) {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.batch) params.append('batch', filters.batch);
    
    const query = params.toString();
    return await this.apiCall(`/attendance/branch/${branch}${query ? '?' + query : ''}`, {
      method: 'GET'
    });
  }

  async getAllAttendance() {
    // Add cache-busting timestamp to prevent browser caching
    const timestamp = new Date().getTime();
    return await this.apiCall(`/attendance?_t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }

  async getAttendanceByStudent(studentId) {
    return await this.apiCall(`/attendance/student/${studentId}`, {
      method: 'GET'
    });
  }

  async submitAttendance(attendanceData) {
    return await this.apiCall('/attendance/submit', {
      method: 'POST',
      body: JSON.stringify(attendanceData)
    });
  }

  // ============ USER AUTHENTICATION ============
  
  // ============ ADMIN OPERATIONS ============
  
  async getAdminProfile(adminLoginID) {
    try {
      const response = await this.apiCall(`/admin/profile/${adminLoginID}`);
      if (response.success && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch admin profile:', error);
      return null;
    }
  }

  async updateAdminProfile(adminLoginID, updateData) {
    return await this.apiCall(`/admin/profile/${adminLoginID}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
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

  // ============ ARCHIVED BATCHES ============

  async getArchivedBatches() {
    const response = await this.apiCall('/archived-batches', {
      method: 'GET'
    });
    return response?.batches || [];
  }

  async getArchivedBatchById(batchId) {
    const response = await this.apiCall(`/archived-batches/${batchId}`, {
      method: 'GET'
    });
    return response?.batch || null;
  }

  async getArchivedBatchStudents(batchId, departmentName) {
    const response = await this.apiCall(`/archived-batches/${batchId}/department/${encodeURIComponent(departmentName)}/students`, {
      method: 'GET'
    });
    return response?.students || [];
  }

  async archiveBatch(archiveData) {
    return await this.apiCall('/archived-batches', {
      method: 'POST',
      body: JSON.stringify(archiveData)
    });
  }

  async unzipBatch(batchId, adminName) {
    return await this.apiCall(`/archived-batches/${batchId}/unzip`, {
      method: 'PUT',
      body: JSON.stringify({ adminName })
    });
  }

  async deleteArchivedBatch(batchId, adminName) {
    return await this.apiCall(`/archived-batches/${batchId}`, {
      method: 'DELETE',
      body: JSON.stringify({ adminName })
    });
  }

  // ============ ZIPPING HISTORY ============

  async getZippingHistory(filters = {}) {
    const query = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });

    const qs = query.toString();
    const endpoint = qs ? `/zipping-history?${qs}` : '/zipping-history';

    const response = await this.apiCall(endpoint, {
      method: 'GET'
    });
    return response?.history || [];
  }

  // ============ HEALTH CHECK ============

  async healthCheck() {
    return await this.apiCall('/health');
  }
}

// Create singleton instance
const mongoDBService = new MongoDBService();

export default mongoDBService;