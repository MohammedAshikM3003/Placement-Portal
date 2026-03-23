// ============================================
// INTEGRATION SNIPPET FOR StuProfile.jsx
// Add this code to enable Field Update Banner
// ============================================

// -------- STEP 1: ADD IMPORT (around line 16-18) --------
import FieldUpdateBanner from '../components/alerts/FieldUpdateBanner';


// -------- STEP 2: ADD STATE VARIABLES (around line 358) --------
// Field Update Banner State
const [showFieldUpdateBanner, setShowFieldUpdateBanner] = useState(false);
const [updatedFieldNames, setUpdatedFieldNames] = useState([]);
const [originalFormData, setOriginalFormData] = useState(null);


// -------- STEP 3: ADD FIELD CHANGE DETECTION HELPER --------
// Add this helper function after the component constants (around line 360-400)

/**
 * Detects which fields have changed between original and new data
 * @param {Object} original - Original student data
 * @param {Object} updated - Updated student data
 * @returns {Array} - Array of field labels that were changed
 */
const detectChangedFields = (original, updated) => {
  if (!original) return [];

  const changedFields = [];

  // Field mapping with user-friendly labels
  const fieldLabels = {
    // Personal Information
    address: 'address',
    city: 'city',
    primaryEmail: 'primary email',
    mobileNo: 'mobile number',

    // Family Information
    fatherOccupation: 'father occupation',
    fatherMobile: 'father mobile',
    motherOccupation: 'mother occupation',
    motherMobile: 'mother mobile',

    // Profile Links
    githubLink: 'GitHub profile',
    linkedinLink: 'LinkedIn profile',

    // Preferences
    companyPreferences: 'company preferences',
    jobLocations: 'job locations',
    arrearStatus: 'arrear status',
    preferredTraining: 'preferred training',

    // Documents
    tenthMarksheet: 'tenth marksheet',
    twelfthMarksheet: 'twelfth marksheet',
    diplomaMarksheet: 'diploma marksheet',
    profilePicURL: 'profile photo',

    // CGPA/GPA
    cgpa: 'CGPA',
    gpa: 'GPA'
  };

  // Check each field for changes
  Object.keys(fieldLabels).forEach(field => {
    const oldValue = original[field];
    const newValue = updated[field];

    // Handle arrays (like companyPreferences, jobLocations, preferredTraining)
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      // Sort and compare as JSON strings to detect differences
      const oldSorted = JSON.stringify([...oldValue].sort());
      const newSorted = JSON.stringify([...newValue].sort());
      if (oldSorted !== newSorted) {
        changedFields.push(fieldLabels[field]);
      }
    }
    // Handle regular values (strings, numbers, etc.)
    else if (oldValue !== newValue) {
      // Only add to changed fields if new value exists (not just cleared)
      if (newValue !== null && newValue !== undefined && newValue !== '') {
        changedFields.push(fieldLabels[field]);
      }
    }
  });

  return changedFields;
};


// -------- STEP 4: TRACK ORIGINAL DATA ON LOAD --------
// Add this useEffect after your existing useEffects

useEffect(() => {
  if (studentData && !originalFormData) {
    // Store original form data when first loaded
    setOriginalFormData({ ...studentData });
  }
}, [studentData, originalFormData]);


// -------- STEP 5: UPDATE handleSave FUNCTION --------
// Find the handleSave function (around line 767) and add this code
// RIGHT BEFORE the line: setPopupOpen(true); (around line 987)

// Detect and show which fields were updated
const changedFields = detectChangedFields(originalFormData, updatedStudentData);

if (changedFields.length > 0) {
  setUpdatedFieldNames(changedFields);
  setShowFieldUpdateBanner(true);
}

// Update the reference for next comparison
setOriginalFormData({ ...updatedStudentData });


// -------- STEP 6: ADD BANNER COMPONENT TO JSX --------
// Find the return statement JSX (search for: return ( <div className={styles.container}>)
// Add the FieldUpdateBanner component right after Navbar:

return (
  <div className={styles.container}>
    <Navbar onToggleSidebar={handleToggleSidebar} />

    {/* Field Update Banner - Shows which fields were successfully updated */}
    <FieldUpdateBanner
      isVisible={showFieldUpdateBanner}
      onClose={() => setShowFieldUpdateBanner(false)}
      updatedFields={updatedFieldNames}
      autoCloseDuration={5000}
    />

    {/* Rest of your existing JSX... */}
    <div className={styles.main}>
      {/* ... */}
    </div>
  </div>
);


// ============================================
// EXAMPLE USAGE SCENARIOS
// ============================================

// Scenario 1: User updates mobile number and address
// Result: Banner shows "mobile number, address fields updated successfully"

// Scenario 2: User uploads profile photo
// Result: Banner shows "profile photo field updated successfully"

// Scenario 3: User updates marksheet, profile, and mobile
// Result: Banner shows "marksheet, profile, mobile number fields updated successfully"

// Scenario 4: User updates only company preferences
// Result: Banner shows "company preferences field updated successfully"


// ============================================
// CUSTOMIZATION OPTIONS
// ============================================

// Custom auto-close duration (7 seconds instead of 5)
<FieldUpdateBanner
  isVisible={showFieldUpdateBanner}
  onClose={() => setShowFieldUpdateBanner(false)}
  updatedFields={updatedFieldNames}
  autoCloseDuration={7000}
/>

// Disable auto-close (requires manual close)
<FieldUpdateBanner
  isVisible={showFieldUpdateBanner}
  onClose={() => setShowFieldUpdateBanner(false)}
  updatedFields={updatedFieldNames}
  autoCloseDuration={0}
/>


// ============================================
// TESTING
// ============================================

// To test the banner:
// 1. Open StuProfile page
// 2. Modify any field (e.g., mobile number)
// 3. Click "Save Changes"
// 4. Banner should appear at the top showing which fields were updated
// 5. Banner should auto-dismiss after 5 seconds (or click X to close immediately)
