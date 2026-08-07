/**
 * Block Status Checker Utility
 * Monitors if logged-in users have been blocked by admin/coordinator
 * and automatically logs them out with a blocked popup
 */

import authService from '../services/authService.jsx';

let studentCheckInterval = null;
let coordinatorCheckInterval = null;
let isStudentChecking = false;
let isCoordinatorChecking = false;

/**
 * Start monitoring the student's block status
 * @param {Function} onBlocked - Callback when student is blocked
 * @param {number} intervalMs - Check interval in milliseconds (default: 30000ms = 30 seconds)
 */
export const startBlockStatusMonitor = (onBlocked, intervalMs = 30000) => {
  // Don't start multiple monitors
  if (studentCheckInterval) {
    console.log('🔍 Block status monitor already running');
    return;
  }

  console.log('🚀 Starting block status monitor...');

  const checkBlockStatus = async () => {
    // Prevent concurrent checks
    if (isStudentChecking) return;
    
    try {
      isStudentChecking = true;
      
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
          cabin: student.blockedByCabin || 'N/A',
          blockedBy: student.blockedBy || 'Placement Office',
          blockedByCabin: student.blockedByCabin || 'N/A',
          blockedByRole: student.blockedByRole || 'admin',
          blockedUserRole: 'student',
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
      isStudentChecking = false;
    }
  };

  // Initial check
  checkBlockStatus();

  // Set up periodic checking
  studentCheckInterval = setInterval(checkBlockStatus, intervalMs);
};

/**
 * Stop monitoring the block status
 */
export const stopBlockStatusMonitor = () => {
  if (studentCheckInterval) {
    console.log('🛑 Stopping block status monitor...');
    clearInterval(studentCheckInterval);
    studentCheckInterval = null;
    isStudentChecking = false;
  }
};

/**
 * Start monitoring the coordinator's block status
 * @param {Function} onBlocked - Callback when coordinator is blocked
 * @param {number} intervalMs - Check interval in milliseconds (default: 30000ms = 30 seconds)
 */
export const startCoordinatorBlockStatusMonitor = (onBlocked, intervalMs = 30000) => {
  // Don't start multiple monitors
  if (coordinatorCheckInterval) {
    console.log('🔍 Coordinator block status monitor already running');
    return;
  }

  console.log('🚀 Starting coordinator block status monitor...');

  const checkCoordinatorBlockStatus = async () => {
    if (isCoordinatorChecking) return;

    try {
      isCoordinatorChecking = true;

      const coordinatorData = JSON.parse(localStorage.getItem('coordinatorData') || 'null');
      const coordinatorId =
        coordinatorData?.coordinatorId ||
        localStorage.getItem('coordinatorId') ||
        localStorage.getItem('coordinatorUsername');

      if (!coordinatorId) {
        console.log('⚠️ No coordinator data found, stopping coordinator monitor');
        stopCoordinatorBlockStatusMonitor();
        return;
      }

      const data = await authService.apiCall(`/coordinators/${encodeURIComponent(coordinatorId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });

      const coordinator = data.coordinator || data;

      if (coordinator && coordinator.isBlocked) {
        console.log('🚫 Coordinator has been blocked! Triggering logout...');

        const blockerDetails = {
          name: coordinator.blockedBy || 'Placement Office',
          cabin: coordinator.blockedByCabin || 'N/A',
          blockedBy: coordinator.blockedBy || 'Placement Office',
          blockedByCabin: coordinator.blockedByCabin || 'N/A',
          blockedByRole: coordinator.blockedByRole || 'admin',
          blockedUserRole: 'coordinator',
          message:
            coordinator.blockedReason ||
            'Your coordinator account has been blocked. Please contact the placement office.'
        };

        if (onBlocked && typeof onBlocked === 'function') {
          onBlocked(blockerDetails);
        }

        stopCoordinatorBlockStatusMonitor();
      }
    } catch (error) {
      console.error('❌ Error checking coordinator block status:', error);
      if (error?.status === 401 || error?.status === 403 || error?.status === 404) {
        stopCoordinatorBlockStatusMonitor();
      }
    } finally {
      isCoordinatorChecking = false;
    }
  };

  checkCoordinatorBlockStatus();
  coordinatorCheckInterval = setInterval(checkCoordinatorBlockStatus, intervalMs);
};

/**
 * Stop monitoring the coordinator block status
 */
export const stopCoordinatorBlockStatusMonitor = () => {
  if (coordinatorCheckInterval) {
    console.log('🛑 Stopping coordinator block status monitor...');
    clearInterval(coordinatorCheckInterval);
    coordinatorCheckInterval = null;
    isCoordinatorChecking = false;
  }
};

/**
 * Check if monitor is currently running
 */
export const isMonitorRunning = () => {
  return studentCheckInterval !== null || coordinatorCheckInterval !== null;
};
