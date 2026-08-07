// Utility script to clean up registration numbers
// Run this in browser console or import in your app

export const cleanupRegistrationNumber = async (regNo) => {
  try {
    console.log(`Starting cleanup for registration number: ${regNo}`);

    throw new Error('cleanupRegistrationNumber requires a valid backend data service. The legacy Firebase helper is not available in this build.');
  } catch (error) {
    console.error('Error during cleanup:', error);
    return { success: false, message: error.message };
  }
};

// Function to run in browser console
window.cleanupRegistration = async (regNo) => {
  const result = await cleanupRegistrationNumber(regNo);
  console.log('Cleanup result:', result);
  return result;
};

// Usage in browser console:
// cleanupRegistration('YOUR_REG_NO')
