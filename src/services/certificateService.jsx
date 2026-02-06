// ⚡ SUPER FAST Certificate Service - Direct MongoDB Upload
class CertificateService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  }

  normalizeStatusForApi(status) {
    const value = (status || '').toString().trim().toLowerCase();
    if (!value) return undefined;
    if (value === 'accepted') return 'approved';
    if (['approved', 'pending', 'rejected'].includes(value)) {
      return value;
    }
    return undefined;
  }

  // ⚡ INSTANT: Upload certificate directly to MongoDB
  async uploadCertificate(studentId, certificateData, fileData) {
    try {
      console.log('🚀 FAST: Uploading certificate to MongoDB...');
      const startTime = Date.now();

      // Guard against empty or missing file data to avoid broken certificates
      if (!fileData || (typeof fileData === 'string' && fileData.trim() === '')) {
        throw new Error('Certificate file data is empty. Please re-upload the file.');
      }

      // Prepare certificate data for MongoDB
      const certificatePayload = {
        studentId: studentId,
        achievementId: Date.now().toString(),
        fileName: certificateData.fileName,
        fileData: fileData, // Base64 encoded file
        fileType: certificateData.fileType || 'application/pdf',
        fileSize: certificateData.fileSize || 0,
        uploadDate: new Date().toLocaleDateString('en-GB'),
        
        // Certificate details
        name: certificateData.name || '',
        comp: certificateData.comp || '',
        prize: certificateData.prize || '',
        date: certificateData.date || '',
        year: certificateData.year || '',
        semester: certificateData.semester || '',
        section: certificateData.section || '',
        reg: certificateData.reg || '',
        department: certificateData.department || '',
        degree: certificateData.degree || '',
        
        status: 'pending',
        createdAt: new Date()
      };

      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`${this.baseURL}/certificates/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(certificatePayload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const uploadTime = Date.now() - startTime;
      console.log(`✅ CERTIFICATE UPLOADED in ${uploadTime}ms:`, {
        certificateId: result.certificate?._id,
        fileName: certificatePayload.fileName,
        size: certificatePayload.fileSize
      });

      return result;
    } catch (error) {
      console.error('❌ Certificate upload error:', error);
      throw error;
    }
  }

  // ⚡ INSTANT: Get all certificates for a student
  async getCertificates(studentId) {
    try {
      console.log('🚀 FAST: Fetching certificates from MongoDB...');
      const startTime = Date.now();

      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`${this.baseURL}/certificates/student/${studentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const certificates = await response.json();
      const fetchTime = Date.now() - startTime;
      console.log(`✅ CERTIFICATES FETCHED in ${fetchTime}ms:`, certificates.length);

      return certificates;
    } catch (error) {
      console.error('❌ Certificate fetch error:', error);
      throw error;
    }
  }

  // ⚡ INSTANT: Delete certificate from MongoDB
  async deleteCertificate(studentId, achievementId) {
    try {
      console.log('🚀 FAST: Deleting certificate from MongoDB...');
      const startTime = Date.now();

      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`${this.baseURL}/certificates/student/${studentId}/achievement/${achievementId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const deleteTime = Date.now() - startTime;
      console.log(`✅ CERTIFICATE DELETED in ${deleteTime}ms`);

      return result;
    } catch (error) {
      console.error('❌ Certificate delete error:', error);
      throw error;
    }
  }

  // ⚡ INSTANT: Update certificate in MongoDB
  async updateCertificate(studentId, achievementId, updateData) {
    try {
      console.log('🚀 FAST: Updating certificate in MongoDB...');
      const startTime = Date.now();

      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`${this.baseURL}/certificates/student/${studentId}/achievement/${achievementId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const updateTime = Date.now() - startTime;
      console.log(`✅ CERTIFICATE UPDATED in ${updateTime}ms`);

      return result;
    } catch (error) {
      console.error('❌ Certificate update error:', error);
      throw error;
    }
  }

  // Convenience wrapper to create certificate with auth header reuse
  async createCertificateWithAuth(certificateData) {
    const authToken = localStorage.getItem('authToken');
    const response = await fetch(`${this.baseURL}/certificates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify(certificateData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  // ⚡ Coordinator: Fetch certificates by department directly from backend
  async getCertificatesByDepartment(department, options = {}) {
    if (!department) {
      throw new Error('Department is required to fetch certificates');
    }

    const params = new URLSearchParams();
    params.append('department', department.toString().trim().toUpperCase());

    if (options.status) {
      const normalizedStatus = this.normalizeStatusForApi(options.status);
      if (normalizedStatus) {
        params.append('status', normalizedStatus);
      }
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

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const certificates = await response.json();
      if (!Array.isArray(certificates)) {
        return [];
      }
      return certificates;
    } catch (error) {
      console.error('❌ Coordinator certificate fetch error:', error);
      throw error;
    }
  }

  // ⚡ Coordinator: Update certificate status using certificateId
  async updateCertificateStatus(certificateId, updates = {}) {
    if (!certificateId) {
      throw new Error('Certificate ID is required to update status');
    }

    const payload = { ...updates };
    if (updates.status) {
      const normalizedStatus = this.normalizeStatusForApi(updates.status);
      if (!normalizedStatus) {
        throw new Error('Invalid certificate status provided');
      }
      payload.status = normalizedStatus;
    }

    try {
      const response = await fetch(`${this.baseURL}/certificates/${encodeURIComponent(certificateId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result?.certificate || result;
    } catch (error) {
      console.error('❌ Coordinator certificate status update error:', error);
      throw error;
    }
  }

  // Helper: Convert file to base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Helper: Validate certificate data
  validateCertificateData(certificateData) {
    const required = ['name', 'comp', 'fileName'];
    const missing = required.filter(field => !certificateData[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // Validate file size (max 5MB)
    if (certificateData.fileSize && certificateData.fileSize > 5 * 1024 * 1024) {
      throw new Error('File size must be less than 5MB');
    }

    return true;
  }
}

// Export singleton instance
const certificateService = new CertificateService();
export default certificateService;
