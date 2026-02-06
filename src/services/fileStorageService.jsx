// Free file storage service using base64 encoding
// This stores files as base64 strings in Firestore (free tier)

class FileStorageService {
  // Optimized: Faster base64 conversion
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      // Optimize for faster processing
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // Convert base64 to file (for download)
  base64ToFile(base64String, filename) {
    if (!base64String) {
      throw new Error('No file data available for download');
    }
    
    const arr = base64String.split(',');
    if (arr.length < 2) {
      throw new Error('Invalid file data format');
    }
    
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
      throw new Error('Invalid MIME type in file data');
    }
    
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  // Optimized: Faster file upload
  async uploadFile(file, path) {
    try {
      // Quick validation
      if (file.size > 1024 * 1024) {
        throw new Error('File size must be less than 1MB');
      }

      // Optimized: Direct base64 conversion
      const base64String = await this.fileToBase64(file);
      
      // Return immediately for faster processing
      return {
        url: base64String,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  // Download file from base64
  downloadFile(base64String, filename) {
    try {
      if (!base64String) {
        throw new Error('No file data available for download');
      }
      
      const file = this.base64ToFile(base64String, filename);
      const url = URL.createObjectURL(file);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  }

  // OPTIMIZED: Ultra-fast file preview
  previewFile(base64String) {
    try {
      // OPTIMIZED: Faster file type detection
      const fileType = this.detectFileType(base64String);
      
      // INSTANT PREVIEW: Open immediately based on file type
      switch (fileType) {
        case 'pdf':
          this.openPDFPreview(base64String);
          break;
        case 'doc':
          this.openDOCPreview(base64String);
          break;
        default:
          // OPTIMIZED: Direct window.open for other types
          window.open(base64String, '_blank');
          break;
      }
    } catch (error) {
      console.error('Error previewing file:', error);
      throw error; // Let the calling function handle the error
    }
  }

  // OPTIMIZED: Fast file type detection
  detectFileType(base64String) {
    // Quick checks for common file types
    if (base64String.includes('data:application/pdf')) return 'pdf';
    if (base64String.includes('data:application/msword') || 
        base64String.includes('data:application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      return 'doc';
    }
    return 'other';
  }

  // OPTIMIZED: Ultra-fast PDF preview
  openPDFPreview(base64String) {
    try {
      // OPTIMIZED: Minimal HTML for faster rendering
      const newWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!newWindow) {
        // Popup blocked - try direct window.open with data URL
        window.open(base64String, '_blank');
        return;
      }
      
      newWindow.document.write(`
        <html>
          <head><title>PDF Preview</title></head>
          <body style="margin:0;padding:0;">
            <iframe src="${base64String}" style="width:100%;height:100vh;border:none;"></iframe>
          </body>
        </html>
      `);
      newWindow.document.close();
    } catch (error) {
      // Fallback: try direct window.open
      console.log('Fallback: Opening PDF directly');
      window.open(base64String, '_blank');
    }
  }

  // OPTIMIZED: Ultra-fast DOC preview
  openDOCPreview(base64String) {
    // OPTIMIZED: Minimal HTML for faster rendering
    const newWindow = window.open('', '_blank', 'width=800,height=600');
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
              link.href = '${base64String}';
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
