/**
 * Block Status Checker Utility
 * Monitors if a logged-in student has been blocked by admin/coordinator
 * and automatically logs them out with a blocked popup
 */

import authService from '../services/authService.jsx';

let checkInterval = null;
let isChecking = false;

/**
 * Start monitoring the student's block status
 * @param {Function} onBlocked - Callback when student is blocked
 * @param {number} intervalMs - Check interval in milliseconds (default: 30000ms = 30 seconds)
 */
export const startBlockStatusMonitor = (onBlocked, intervalMs = 30000) => {
  // Don't start multiple monitors
  if (checkInterval) {
    console.log('🔍 Block status monitor already running');
    return;
  }

  console.log('🚀 Starting block status monitor...');

  const checkBlockStatus = async () => {
    // Prevent concurrent checks
    if (isChecking) return;
    
    try {
      isChecking = true;
      
      // Get student data from localStorage
      const studentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      if (!studentData || !studentData._id) {
        console.log('⚠️ No student data found, stopping monitor');
        stopBlockStatusMonitor();
        return;
      }

      // Fetch latest student data from backend (lightweight status endpoint)
      const data = await authService.apiCall(`/students/${studentData._id}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });

      const student = data.student || data;

      // Check if student has been blocked
      if (student && (student.isBlocked || student.blocked)) {
        console.log('🚫 Student has been blocked! Triggering logout...');
        
        // Prepare coordinator/blocker details
        const coordinatorDetails = {
          name: student.blockedBy || 'Placement Office',
          cabin: 'N/A',
          blockedBy: student.blockedBy || 'Placement Office',
          message: student.blockedReason || 'Your account has been blocked. Please contact the placement office.'
        };
        
        // Call the onBlocked callback
        if (onBlocked && typeof onBlocked === 'function') {
          onBlocked(coordinatorDetails);
        }

        // Stop the monitor after callback completes
        stopBlockStatusMonitor();
      }
    } catch (error) {
      console.error('❌ Error checking block status:', error);
      if (error?.status === 401 || error?.status === 403) {
        // Token invalid or access denied – stop monitoring to prevent loops
        stopBlockStatusMonitor();
      }
    } finally {
      isChecking = false;
    }
  };

  // Initial check
  checkBlockStatus();

  // Set up periodic checking
  checkInterval = setInterval(checkBlockStatus, intervalMs);
};

/**
 * Stop monitoring the block status
 */
export const stopBlockStatusMonitor = () => {
  if (checkInterval) {
    console.log('🛑 Stopping block status monitor...');
    clearInterval(checkInterval);
    checkInterval = null;
    isChecking = false;
  }
};

/**
 * Check if monitor is currently running
 */
export const isMonitorRunning = () => {
  return checkInterval !== null;
};
