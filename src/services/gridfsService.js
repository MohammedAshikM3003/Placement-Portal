/**
 * GridFS File Service — Frontend
 * 
 * Replaces Base64 FileReader logic with direct file uploads to GridFS.
 * Files are uploaded as multipart/form-data and returned as streamable URLs.
 * 
 * Usage:
 *   import gridfsService from '../services/gridfsService';
 * 
 *   // Upload a profile image
 *   const result = await gridfsService.uploadProfileImage(file, userId, 'student');
 *   // result.file.url => '/api/file/abc123'
 * 
 *   // Display: <img src={gridfsService.getFileUrl(fileId)} />
 *   // Or:     <img src={result.file.url} />
 */

import { API_BASE_URL } from '../utils/apiConfig';

class GridFSService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Get the full URL for a GridFS file by its ID
   * Works for <img src>, <iframe src>, fetch(), etc.
   */
  getFileUrl(fileId) {
    console.log('🔍 getFileUrl called with:', fileId);
    console.log('🔍 baseURL:', this.baseURL);
    
    if (!fileId) return '';
    
    // If it's already a full URL or a /api/file/ path, return as-is
    if (fileId.startsWith('http') || fileId.startsWith('/api/file/') || fileId.startsWith('data:')) {
      const result = fileId.startsWith('/api/file/') ? `${this.baseURL}${fileId.replace('/api', '')}` : fileId;
      console.log('🔍 getFileUrl result (path case):', result);
      return result;
    }
    
    const result = `${this.baseURL}/file/${fileId}`;
    console.log('🔍 getFileUrl result (ID case):', result);
    return result;
  }

  /**
   * Check if a value is a GridFS file URL or ID (vs old Base64)
   */
  isGridFSUrl(value) {
    if (!value || typeof value !== 'string') return false;
    return value.includes('/api/file/') || /^[a-f0-9]{24}$/.test(value);
  }

  /**
   * Get auth headers
   */
  _getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  /**
   * Upload a single file to GridFS
   * @param {File} file - The file object from input
   * @param {string} category - Optional category tag
   * @returns {Promise<{id, url, originalName, contentType, size}>}
   */
  async uploadFile(file, category = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const response = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Upload failed (${response.status})`);
    }

    const data = await response.json();
    return data.file;
  }

  /**
   * Upload multiple files to GridFS
   * @param {FileList|File[]} files - Files from input
   * @returns {Promise<Array<{id, url, originalName, contentType, size}>>}
   */
  async uploadMultipleFiles(files) {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const response = await fetch(`${this.baseURL}/upload/multiple`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Upload failed (${response.status})`);
    }

    const data = await response.json();
    return data.files;
  }

  /**
   * Upload a profile image (auto-saves to user record)
   * @param {File} file - Image file
   * @param {string} userId - Student ID, coordinator ID, or admin login ID
   * @param {string} userType - 'student' | 'coordinator' | 'admin'
   * @returns {Promise<{id, url, originalName}>}
   */
  async uploadProfileImage(file, userId, userType) {
    const formData = new FormData();
    formData.append('profileImage', file);
    formData.append('userId', userId);
    formData.append('userType', userType);

    const response = await fetch(`${this.baseURL}/upload/profile-image`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Profile image upload failed (${response.status})`);
    }

    const data = await response.json();
    return data.file; // { id, url, originalName }
  }

  /**
   * Upload college images (banner, logo, NAAC, NBA)
   * @param {Object} files - { collegeBanner?: File, collegeLogo?: File, naacCertificate?: File, nbaCertificate?: File }
   * @param {string} adminLoginID
   * @returns {Promise<Object>} - Uploaded file details per field
   */
  async uploadCollegeImages(files, adminLoginID) {
    const formData = new FormData();
    formData.append('adminLoginID', adminLoginID);

    for (const [field, file] of Object.entries(files)) {
      if (file instanceof File) {
        formData.append(field, file);
      }
    }

    const response = await fetch(`${this.baseURL}/upload/college-images`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `College images upload failed (${response.status})`);
    }

    const data = await response.json();
    return data.files;
  }

  /**
   * Upload a resume via GridFS
   * @param {File} file - Resume PDF/DOC file
   * @param {string} studentId
   * @returns {Promise<Object>} - Resume info with gridfsFileId and gridfsFileUrl
   */
  async uploadResume(file, studentId) {
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('studentId', studentId);

    const response = await fetch(`${this.baseURL}/resume/upload/gridfs`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Resume upload failed (${response.status})`);
    }

    const data = await response.json();
    return data.resume;
  }

  /**
   * Upload a certificate/achievement file via GridFS
   * @param {File} file - Certificate PDF/image file
   * @param {Object} metadata - { studentId, achievementId, studentName, regNo, ... }
   * @returns {Promise<Object>} - Certificate info with gridfsFileId
   */
  async uploadCertificate(file, metadata) {
    const formData = new FormData();
    formData.append('file', file);

    // Add all metadata fields to form data
    for (const [key, value] of Object.entries(metadata)) {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    }

    const response = await fetch(`${this.baseURL}/certificates/upload/gridfs`, {
      method: 'POST',
      headers: this._getAuthHeaders(),
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Certificate upload failed (${response.status})`);
    }

    const data = await response.json();
    return data.certificate;
  }

  /**
   * Delete a file from GridFS
   * @param {string} fileId - GridFS file ID
   */
  async deleteFile(fileId) {
    if (!fileId) return;

    const response = await fetch(`${this.baseURL}/file/${fileId}`, {
      method: 'DELETE',
      headers: this._getAuthHeaders()
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Delete failed (${response.status})`);
    }

    return true;
  }

  /**
   * Resolve a profile picture URL — handles both old Base64 data URLs and new GridFS IDs/URLs
   * Use this everywhere you display a profile image.
   * @param {string} value - profilePicURL field value (could be Base64, GridFS URL, or file ID)
   * @returns {string} - Displayable URL for <img src>
   */
  resolveImageUrl(value) {
    if (!value) return '';
    // Old Base64 data URL — render directly (backward compatible)
    if (value.startsWith('data:')) return value;
    // Already a full http(s) URL
    if (value.startsWith('http')) return value;
    // GridFS path like /api/file/abc123
    if (value.startsWith('/api/file/')) return `${this.baseURL}${value.replace('/api', '')}`;
    // Raw ObjectId string — build URL
    if (/^[a-f0-9]{24}$/.test(value)) return `${this.baseURL}/file/${value}`;
    // Anything else (could be a relative path or empty)
    return value;
  }
}

const gridfsService = new GridFSService();
export default gridfsService;
