/**
 * Image Compression Utility
 * Compresses images larger than specified size (default 400KB) to ensure fast loading
 * and efficient storage in MongoDB
 */

/**
 * Compress an image file to reduce its size while maintaining acceptable quality
 * @param {File} file - The image file to compress
 * @param {number} maxSizeKB - Maximum size in KB (default 400KB)
 * @param {number} quality - JPEG/PNG quality (0-1, default 0.85)
 * @returns {Promise<string>} - Base64 encoded compressed image
 */
export const compressImage = async (file, maxSizeKB = 400, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    // SVG files don't need canvas compression, just return as base64
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        console.log(`🖼️ SVG image: Original size ${(file.size / 1024).toFixed(2)}KB (no compression applied)`);
        resolve(reader.result);
      };
      reader.onerror = (error) => reject(new Error('Failed to read SVG file'));
      return;
    }

    const reader = new FileReader();
    
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate dimensions maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        const maxDimension = 1920; // Max width or height
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Determine output format based on input
        const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        
        // Compress the image
        let compressedBase64 = canvas.toDataURL(outputFormat, quality);
        
        // Check if compression is enough
        const sizeKB = (compressedBase64.length * 3) / 4 / 1024;
        
        if (sizeKB > maxSizeKB && quality > 0.5) {
          // Try again with lower quality
          compressedBase64 = canvas.toDataURL(outputFormat, quality - 0.1);
        }
        
        console.log(`🖼️ Image compressed: Original size ~${(file.size / 1024).toFixed(2)}KB -> Compressed size ~${sizeKB.toFixed(2)}KB`);
        
        resolve(compressedBase64);
      };
      
      img.onerror = (error) => {
        reject(new Error('Failed to load image for compression'));
      };
    };
    
    reader.onerror = (error) => {
      reject(new Error('Failed to read file'));
    };
  });
};

/**
 * Convert file to base64 with automatic compression if needed
 * @param {File} file - The image file
 * @param {number} maxSizeKB - Maximum allowed size in KB (default 400KB)
 * @returns {Promise<string>} - Base64 encoded image (compressed if needed)
 */
export const fileToBase64WithCompression = async (file, maxSizeKB = 400) => {
  const fileSizeKB = file.size / 1024;
  
  if (fileSizeKB > maxSizeKB) {
    console.log(`📦 File size (${fileSizeKB.toFixed(2)}KB) exceeds ${maxSizeKB}KB. Compressing...`);
    return await compressImage(file, maxSizeKB);
  } else {
    console.log(`✅ File size (${fileSizeKB.toFixed(2)}KB) is within limit. No compression needed.`);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }
};

/**
 * Get estimated size of base64 string in KB
 * @param {string} base64String - Base64 encoded string
 * @returns {number} - Size in KB
 */
export const getBase64SizeKB = (base64String) => {
  return (base64String.length * 3) / 4 / 1024;
};
