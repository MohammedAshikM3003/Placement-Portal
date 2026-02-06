// Utility script to clean up registration numbers
// Run this in browser console or import in your app

import firebaseService from '../services/firebaseService.js';

export const cleanupRegistrationNumber = async (regNo) => {
  try {
    console.log(`Starting cleanup for registration number: ${regNo}`);
    
    // Step 1: Check what exists
    const allStudents = await firebaseService.getAllStudentsByRegNo(regNo);
    console.log(`Found ${allStudents.length} students with regNo: ${regNo}`);
    
    if (allStudents.length === 0) {
      console.log('No students found with this registration number');
      return { success: true, message: 'No students found to delete' };
    }
    
    // Step 2: Show details of what will be deleted
    allStudents.forEach((student, index) => {
      console.log(`Student ${index + 1}:`, {
        id: student.id,
        regNo: student.regNo,
        firstName: student.firstName,
        lastName: student.lastName,
        createdAt: student.createdAt
      });
    });
    
    // Step 3: Delete all students with this regNo
    const deleteResult = await firebaseService.deleteStudentByRegNo(regNo);
    console.log('Delete result:', deleteResult);
    
    // Step 4: Verify deletion
    const verifyStudents = await firebaseService.getAllStudentsByRegNo(regNo);
    console.log(`After deletion, found ${verifyStudents.length} students with regNo: ${regNo}`);
    
    if (verifyStudents.length === 0) {
      console.log('✅ Successfully cleaned up registration number:', regNo);
      return { success: true, message: `Successfully deleted ${deleteResult.deleted} student(s)` };
    } else {
      console.log('❌ Some students still exist after deletion');
      return { success: false, message: 'Deletion incomplete' };
    }
    
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
