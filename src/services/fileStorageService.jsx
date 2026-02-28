// File storage service - GridFS-backed (replaces Base64 encoding)
// Files are now stored via GridFS; this service handles upload/download/preview via URLs

class FileStorageService {
  // Helper: detect if a value is a GridFS URL
  isGridFSUrl(value) {
    return value && typeof value === 'string' && (value.startsWith('/api/file/') || value.includes('/api/file/'));
  }

  // Upload file to GridFS and return URL
  async uploadFile(file, path) {
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      const gridfsService = (await import('./gridfsService')).default;
      const result = await gridfsService.uploadFile(file, path || 'general');
      
      return {
        url: result.url,
        fileId: result.fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  // Download file - handles both GridFS URLs and legacy base64
  downloadFile(fileUrlOrBase64, filename) {
    try {
      if (!fileUrlOrBase64) {
        throw new Error('No file data available for download');
      }

      let downloadUrl;
      if (this.isGridFSUrl(fileUrlOrBase64)) {
        // GridFS URL - use directly
        const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
        downloadUrl = fileUrlOrBase64.startsWith('http') ? fileUrlOrBase64 : `${API_BASE}${fileUrlOrBase64}`;
      } else if (fileUrlOrBase64.startsWith('data:')) {
        // Legacy base64 data URL
        downloadUrl = fileUrlOrBase64;
      } else {
        // Try as plain URL
        downloadUrl = fileUrlOrBase64;
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  // Preview file - handles both GridFS URLs and legacy base64
  previewFile(fileUrlOrBase64) {
    try {
      if (this.isGridFSUrl(fileUrlOrBase64)) {
        // GridFS URL - open directly
        const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
        const fullUrl = fileUrlOrBase64.startsWith('http') ? fileUrlOrBase64 : `${API_BASE}${fileUrlOrBase64}`;
        window.open(fullUrl, '_blank');
        return;
      }

      // Legacy: detect type and handle
      const fileType = this.detectFileType(fileUrlOrBase64);
      
      switch (fileType) {
        case 'pdf':
          this.openPDFPreview(fileUrlOrBase64);
          break;
        case 'doc':
          this.openDOCPreview(fileUrlOrBase64);
          break;
        default:
          window.open(fileUrlOrBase64, '_blank');
          break;
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      throw error;
    }
  }

  // File type detection - handles both URLs and base64
  detectFileType(fileUrlOrBase64) {
    if (fileUrlOrBase64.includes('data:application/pdf') || fileUrlOrBase64.endsWith('.pdf')) return 'pdf';
    if (fileUrlOrBase64.includes('data:application/msword') || 
        fileUrlOrBase64.includes('data:application/vnd.openxmlformats-officedocument.wordprocessingml.document') ||
        fileUrlOrBase64.endsWith('.doc') || fileUrlOrBase64.endsWith('.docx')) {
      return 'doc';
    }
    return 'other';
  }

  // PDF preview - handles both URLs and base64
  openPDFPreview(fileUrlOrBase64) {
    try {
      const newWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!newWindow) {
        window.open(fileUrlOrBase64, '_blank');
        return;
      }
      
      let src = fileUrlOrBase64;
      if (this.isGridFSUrl(fileUrlOrBase64)) {
        const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
        src = fileUrlOrBase64.startsWith('http') ? fileUrlOrBase64 : `${API_BASE}${fileUrlOrBase64}`;
      }
      
      newWindow.document.write(`
        <html>
          <head><title>PDF Preview</title></head>
          <body style="margin:0;padding:0;">
            <iframe src="${src}" style="width:100%;height:100vh;border:none;"></iframe>
          </body>
        </html>
      `);
      newWindow.document.close();
    } catch (error) {
      console.log('Fallback: Opening PDF directly');
      window.open(fileUrlOrBase64, '_blank');
    }
  }

  // DOC preview
  openDOCPreview(fileUrl) {
    const newWindow = window.open('', '_blank', 'width=800,height=600');
    let href = fileUrl;
    if (this.isGridFSUrl(fileUrl)) {
      const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      href = fileUrl.startsWith('http') ? fileUrl : `${API_BASE}${fileUrl}`;
    }
    newWindow.document.write(`
      <html>
        <head><title>Document Preview</title></head>
        <body style="margin:0;padding:20px;background:#f0f0f0;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
          <div style="background:white;padding:30px;border-radius:12px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.1);">
            <div style="font-size:48px;margin-bottom:20px;">📄</div>
            <h2 style="margin:0 0 10px 0;color:#333;">Word Document</h2>
            <p style="margin:0 0 20px 0;color:#666;">This document cannot be previewed directly in the browser.</p>
            <button onclick="downloadDocument()" style="background:#197AFF;color:white;border:none;padding:12px 24px;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;">Download Document</button>
          </div>
          <script>
            function downloadDocument() {
              const link = document.createElement('a');
              link.href = '${href}';
              link.download = 'document.docx';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          </script>
        </body>
      </html>
    `);
    newWindow.document.close();
  }

  // Legacy: Convert base64 to file (kept for backward compatibility)
  base64ToFile(base64String, filename) {
    if (!base64String) throw new Error('No file data available');
    const arr = base64String.split(',');
    if (arr.length < 2) throw new Error('Invalid file data format');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error('Invalid MIME type');
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) { u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, { type: mime });
  }

  // Legacy: Convert file to base64 (kept for backward compatibility)
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // Get file size in human readable format
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

const fileStorageService = new FileStorageService();
export default fileStorageService;
