/**
 * Utility for dynamically changing the favicon based on the current page
 * Each role/page has a unique color and orientation
 */

const FAVICON_TYPES = {
  DEFAULT: 'default', // Purple - Landing, Login, Signup pages
  STUDENT: 'student', // Blue - Student dashboard
  COORDINATOR: 'coordinator', // Red (flipped) - Coordinator dashboard
  ADMIN: 'admin' // Green (flipped) - Admin dashboard
};

// SVG templates for each favicon type
const FAVICON_SVGS = {
  // Purple favicon for landing/login/signup pages
  default: `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1024" viewBox="0 0 640 512"><path fill="#4F46E5" d="M320 32c-8.1 0-16.1 1.4-23.7 4.1L15.8 137.4C6.3 140.9 0 149.9 0 160s6.3 19.1 15.8 22.6l57.9 20.9C57.3 229.3 48 259.8 48 291.9V320c0 28.4-10.8 57.7-22.3 80.8c-6.5 13-13.9 25.8-22.5 37.6c-3.2 4.3-4.1 9.9-2.3 15s6 8.9 11.2 10.2l64 16c4.2 1.1 8.7.3 12.4-2s6.3-6.1 7.1-10.4c8.6-42.8 4.3-81.2-2.1-108.7c-3.2-14.2-7.5-28.7-13.5-42v-24.6c0-30.2 10.2-58.7 27.9-81.5c12.9-15.5 29.6-28 49.2-35.7l157-61.7c8.2-3.2 17.5.8 20.7 9s-.8 17.5-9 20.7l-157 61.7c-12.4 4.9-23.3 12.4-32.2 21.6l159.6 57.6c7.6 2.7 15.6 4.1 23.7 4.1s16.1-1.4 23.7-4.1l280.6-101c9.5-3.4 15.8-12.5 15.8-22.6s-6.3-19.1-15.8-22.6L343.7 36.1c-7.6-2.7-15.6-4.1-23.7-4.1M128 408c0 35.3 86 72 192 72s192-36.7 192-72l-15.3-145.4L354.5 314c-11.1 4-22.8 6-34.5 6s-23.5-2-34.5-6l-142.2-51.4z" stroke-width="26" stroke="#4F46E5"/></svg>`,
  
  // Blue favicon for student dashboard
  student: `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1024" viewBox="0 0 640 512"><path fill="#2085f6" d="M320 32c-8.1 0-16.1 1.4-23.7 4.1L15.8 137.4C6.3 140.9 0 149.9 0 160s6.3 19.1 15.8 22.6l57.9 20.9C57.3 229.3 48 259.8 48 291.9V320c0 28.4-10.8 57.7-22.3 80.8c-6.5 13-13.9 25.8-22.5 37.6c-3.2 4.3-4.1 9.9-2.3 15s6 8.9 11.2 10.2l64 16c4.2 1.1 8.7.3 12.4-2s6.3-6.1 7.1-10.4c8.6-42.8 4.3-81.2-2.1-108.7c-3.2-14.2-7.5-28.7-13.5-42v-24.6c0-30.2 10.2-58.7 27.9-81.5c12.9-15.5 29.6-28 49.2-35.7l157-61.7c8.2-3.2 17.5.8 20.7 9s-.8 17.5-9 20.7l-157 61.7c-12.4 4.9-23.3 12.4-32.2 21.6l159.6 57.6c7.6 2.7 15.6 4.1 23.7 4.1s16.1-1.4 23.7-4.1l280.6-101c9.5-3.4 15.8-12.5 15.8-22.6s-6.3-19.1-15.8-22.6L343.7 36.1c-7.6-2.7-15.6-4.1-23.7-4.1M128 408c0 35.3 86 72 192 72s192-36.7 192-72l-15.3-145.4L354.5 314c-11.1 4-22.8 6-34.5 6s-23.5-2-34.5-6l-142.2-51.4z" stroke-width="26" stroke="#2085f6"/></svg>`,
  
  // Red favicon for coordinator dashboard (flipped horizontally)
  coordinator: `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1024" viewBox="0 0 640 512"><g transform="translate(640, 0) scale(-1, 1)"><path fill="#D23B42" d="M320 32c-8.1 0-16.1 1.4-23.7 4.1L15.8 137.4C6.3 140.9 0 149.9 0 160s6.3 19.1 15.8 22.6l57.9 20.9C57.3 229.3 48 259.8 48 291.9V320c0 28.4-10.8 57.7-22.3 80.8c-6.5 13-13.9 25.8-22.5 37.6c-3.2 4.3-4.1 9.9-2.3 15s6 8.9 11.2 10.2l64 16c4.2 1.1 8.7.3 12.4-2s6.3-6.1 7.1-10.4c8.6-42.8 4.3-81.2-2.1-108.7c-3.2-14.2-7.5-28.7-13.5-42v-24.6c0-30.2 10.2-58.7 27.9-81.5c12.9-15.5 29.6-28 49.2-35.7l157-61.7c8.2-3.2 17.5.8 20.7 9s-.8 17.5-9 20.7l-157 61.7c-12.4 4.9-23.3 12.4-32.2 21.6l159.6 57.6c7.6 2.7 15.6 4.1 23.7 4.1s16.1-1.4 23.7-4.1l280.6-101c9.5-3.4 15.8-12.5 15.8-22.6s-6.3-19.1-15.8-22.6L343.7 36.1c-7.6-2.7-15.6-4.1-23.7-4.1M128 408c0 35.3 86 72 192 72s192-36.7 192-72l-15.3-145.4L354.5 314c-11.1 4-22.8 6-34.5 6s-23.5-2-34.5-6l-142.2-51.4z" stroke-width="26" stroke="#D23B42"/></g></svg>`,
  
  // Green favicon for admin dashboard (flipped horizontally)
  admin: `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1024" viewBox="0 0 640 512"><g transform="translate(640, 0) scale(-1, 1)"><path fill="#4ea24e" d="M320 32c-8.1 0-16.1 1.4-23.7 4.1L15.8 137.4C6.3 140.9 0 149.9 0 160s6.3 19.1 15.8 22.6l57.9 20.9C57.3 229.3 48 259.8 48 291.9V320c0 28.4-10.8 57.7-22.3 80.8c-6.5 13-13.9 25.8-22.5 37.6c-3.2 4.3-4.1 9.9-2.3 15s6 8.9 11.2 10.2l64 16c4.2 1.1 8.7.3 12.4-2s6.3-6.1 7.1-10.4c8.6-42.8 4.3-81.2-2.1-108.7c-3.2-14.2-7.5-28.7-13.5-42v-24.6c0-30.2 10.2-58.7 27.9-81.5c12.9-15.5 29.6-28 49.2-35.7l157-61.7c8.2-3.2 17.5.8 20.7 9s-.8 17.5-9 20.7l-157 61.7c-12.4 4.9-23.3 12.4-32.2 21.6l159.6 57.6c7.6 2.7 15.6 4.1 23.7 4.1s16.1-1.4 23.7-4.1l280.6-101c9.5-3.4 15.8-12.5 15.8-22.6s-6.3-19.1-15.8-22.6L343.7 36.1c-7.6-2.7-15.6-4.1-23.7-4.1M128 408c0 35.3 86 72 192 72s192-36.7 192-72l-15.3-145.4L354.5 314c-11.1 4-22.8 6-34.5 6s-23.5-2-34.5-6l-142.2-51.4z" stroke-width="26" stroke="#4ea24e"/></g></svg>`
};

/**
 * Converts SVG string to a data URI that can be used as favicon
 */
function svgToDataUri(svgString) {
  const encoded = encodeURIComponent(svgString)
    .replace(/'/g, '%27')
    .replace(/"/g, '%22');
  return `data:image/svg+xml,${encoded}`;
}

/**
 * Changes the favicon to the specified type
 * @param {string} type - One of FAVICON_TYPES (default, student, coordinator, admin)
 */
export function changeFavicon(type = FAVICON_TYPES.DEFAULT) {
  try {
    // Get the SVG for the specified type
    const svgString = FAVICON_SVGS[type] || FAVICON_SVGS.default;
    const dataUri = svgToDataUri(svgString);

    // Find existing favicon link element or create new one
    let link = document.querySelector("link[rel*='icon']");
    
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    // Update the href to the new favicon
    link.href = dataUri;

    // Also update apple-touch-icon if it exists
    const appleTouchIcon = document.querySelector("link[rel='apple-touch-icon']");
    if (appleTouchIcon) {
      appleTouchIcon.href = dataUri;
    }
  } catch (error) {
    console.error('Error changing favicon:', error);
  }
}

/**
 * Hook to automatically change favicon based on page type
 * Usage: useFavicon('student') in a component
 */
export function useFavicon(type) {
  if (typeof window !== 'undefined') {
    changeFavicon(type);
  }
}

export { FAVICON_TYPES };
export default changeFavicon;
