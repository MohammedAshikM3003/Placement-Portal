import React, { useState } from 'react';
import FieldUpdateBanner from '../components/alerts/FieldUpdateBanner';
import UnsavedChangesAlert from '../components/alerts/UnsavedChangesAlert';

/**
 * Complete Demo showing both components working together
 * Simulates the StuProfile.jsx workflow
 */
const CompleteFieldChangeDemo = () => {
  const [formData, setFormData] = useState({
    mobileNo: '9876543210',
    address: '123 Main Street',
    city: 'Chennai',
    primaryEmail: 'student@example.com'
  });

  const [originalFormData, setOriginalFormData] = useState({
    mobileNo: '9876543210',
    address: '123 Main Street',
    city: 'Chennai',
    primaryEmail: 'student@example.com'
  });

  const [showBanner, setShowBanner] = useState(false);
  const [updatedFields, setUpdatedFields] = useState([]);

  const [showUnsavedPopup, setShowUnsavedPopup] = useState(false);
  const [changedFields, setChangedFields] = useState([]);

  // Detect changed fields
  const detectChanges = () => {
    const changed = [];
    const fieldLabels = {
      mobileNo: 'mobile number',
      address: 'address',
      city: 'city',
      primaryEmail: 'primary email'
    };

    Object.keys(fieldLabels).forEach(key => {
      if (formData[key] !== originalFormData[key]) {
        changed.push(fieldLabels[key]);
      }
    });

    return changed;
  };

  // Handle field input
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle Save
  const handleSave = () => {
    const changed = detectChanges();

    // Update original data
    setOriginalFormData({ ...formData });

    // Show banner with updated fields
    if (changed.length > 0) {
      setUpdatedFields(changed);
      setShowBanner(true);
    }

    alert('Changes saved to database!');
  };

  // Handle navigation attempt
  const handleNavigate = () => {
    const changed = detectChanges();

    if (changed.length > 0) {
      setChangedFields(changed);
      setShowUnsavedPopup(true);
    } else {
      alert('Navigating to another page...');
    }
  };

  // Handle discard from popup
  const handleDiscard = () => {
    setFormData({ ...originalFormData });
    setShowUnsavedPopup(false);
    alert('Changes discarded. Navigating to another page...');
  };

  // Handle save from popup
  const handleSaveFromPopup = () => {
    handleSave();
    setShowUnsavedPopup(false);
  };

  const hasChanges = detectChanges().length > 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f8fb',
      padding: '40px 20px',
      fontFamily: "'Poppins', Arial, sans-serif"
    }}>
      {/* Field Update Banner */}
      <FieldUpdateBanner
        isVisible={showBanner}
        onClose={() => setShowBanner(false)}
        updatedFields={updatedFields}
        autoCloseDuration={5000}
      />

      {/* Unsaved Changes Alert */}
      <UnsavedChangesAlert
        isOpen={showUnsavedPopup}
        onClose={() => setShowUnsavedPopup(false)}
        onSave={handleSaveFromPopup}
        onDiscard={handleDiscard}
        changedFields={changedFields}
      />

      <div style={{
        maxWidth: '900px',
        margin: '60px auto 0',
        background: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ marginBottom: '10px', color: '#333' }}>
          Student Profile - Complete Demo
        </h1>
        <p style={{ color: '#777', marginBottom: '30px' }}>
          Test both the field update banner and unsaved changes popup
        </p>

        {/* Changed Status Indicator */}
        {hasChanges && (
          <div style={{
            padding: '10px 15px',
            background: '#fff3e0',
            border: '1px solid #ffe0b2',
            borderRadius: '6px',
            marginBottom: '20px',
            color: '#e65100',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            ⚠️ You have {detectChanges().length} unsaved change{detectChanges().length > 1 ? 's' : ''}
          </div>
        )}

        {/* Form Fields */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '15px', color: '#555' }}>Profile Fields:</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Mobile Number
              </label>
              <input
                type="text"
                value={formData.mobileNo}
                onChange={(e) => handleChange('mobileNo', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                Primary Email
              </label>
              <input
                type="email"
                value={formData.primaryEmail}
                onChange={(e) => handleChange('primaryEmail', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            style={{
              flex: 1,
              padding: '12px',
              background: hasChanges ? '#2196F3' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: hasChanges ? 'pointer' : 'not-allowed'
            }}
          >
            Save Changes
          </button>

          <button
            onClick={handleNavigate}
            style={{
              flex: 1,
              padding: '12px',
              background: '#9E9E9E',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Navigate Away
          </button>
        </div>

        {/* Instructions */}
        <div style={{
          padding: '20px',
          background: '#e3f2fd',
          borderRadius: '8px',
          border: '1px solid #90caf9'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#1976D2' }}>📋 Test Instructions:</h4>
          <ol style={{ margin: 0, paddingLeft: '20px', color: '#555', fontSize: '14px', lineHeight: '1.8' }}>
            <li>
              <strong>Test Banner:</strong> Modify any field above, then click "Save Changes"
              <br />→ Banner appears showing which fields were updated
            </li>
            <li>
              <strong>Test Unsaved Popup:</strong> Modify fields, then click "Navigate Away"
              <br />→ Popup appears asking if you want to save or discard changes
              <br />→ Lists all fields that were modified
            </li>
            <li>
              <strong>Banner auto-closes</strong> after 5 seconds (or click X)
            </li>
            <li>
              <strong>Popup requires action:</strong> Must click "Save" or "Discard"
            </li>
          </ol>
        </div>

        {/* Current State Display */}
        <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '6px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>Current State:</h4>
          <pre style={{ margin: 0, fontSize: '12px', color: '#333', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify({
              hasChanges,
              changedFields: detectChanges(),
              formData
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default CompleteFieldChangeDemo;
