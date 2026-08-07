import React, { useState } from 'react';
import FieldUpdateBanner from './FieldUpdateBanner';

/**
 * Demo page to test the FieldUpdateBanner component
 * This file can be used to preview the banner before integrating into StuProfile.jsx
 */
const FieldUpdateBannerDemo = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [selectedFields, setSelectedFields] = useState([]);

  // Predefined field options for testing
  const availableFields = [
    'marksheet',
    'profile photo',
    'mobile number',
    'address',
    'city',
    'primary email',
    'GitHub profile',
    'LinkedIn profile',
    'company preferences',
    'job locations',
    'CGPA',
    'father mobile',
    'mother occupation'
  ];

  const handleFieldSelect = (field) => {
    setSelectedFields(prev =>
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleShowBanner = () => {
    if (selectedFields.length > 0) {
      setShowBanner(true);
    }
  };

  const handleQuickTest = (fields) => {
    setSelectedFields(fields);
    setShowBanner(true);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8f8fb',
      padding: '40px 20px',
      fontFamily: "'Poppins', Arial, sans-serif"
    }}>
      <FieldUpdateBanner
        isVisible={showBanner}
        onClose={() => setShowBanner(false)}
        updatedFields={selectedFields}
        autoCloseDuration={10000} // 10 seconds for demo
      />

      <div style={{
        maxWidth: '800px',
        margin: '60px auto 0',
        background: 'white',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ marginBottom: '10px', color: '#333' }}>
          Field Update Banner - Demo
        </h1>
        <p style={{ color: '#777', marginBottom: '30px' }}>
          Test the field update banner by selecting fields and clicking "Show Banner"
        </p>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '15px', color: '#555' }}>Quick Test Scenarios:</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleQuickTest(['marksheet', 'profile photo', 'mobile number'])}
              style={{
                padding: '10px 16px',
                background: '#2085f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Test Scenario 1
            </button>
            <button
              onClick={() => handleQuickTest(['profile photo'])}
              style={{
                padding: '10px 16px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Test Single Field
            </button>
            <button
              onClick={() => handleQuickTest(['address', 'city', 'mobile number', 'primary email'])}
              style={{
                padding: '10px 16px',
                background: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Test Multiple Fields
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '15px', color: '#555' }}>
            Select Fields to Update:
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '10px'
          }}>
            {availableFields.map(field => (
              <label
                key={field}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px',
                  background: selectedFields.includes(field) ? '#e3f2fd' : '#f5f5f5',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: selectedFields.includes(field) ? '2px solid #2085f6' : '2px solid transparent'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedFields.includes(field)}
                  onChange={() => handleFieldSelect(field)}
                  style={{ marginRight: '10px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: '#333' }}>{field}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '10px', color: '#555' }}>
            Selected Fields ({selectedFields.length}):
          </h3>
          <div style={{
            padding: '15px',
            background: '#f9f9f9',
            borderRadius: '6px',
            minHeight: '50px',
            border: '1px dashed #ddd'
          }}>
            {selectedFields.length > 0 ? (
              <code style={{ color: '#2085f6', fontSize: '14px' }}>
                {selectedFields.join(', ')}
              </code>
            ) : (
              <span style={{ color: '#999', fontSize: '14px' }}>
                No fields selected
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleShowBanner}
          disabled={selectedFields.length === 0}
          style={{
            padding: '12px 24px',
            background: selectedFields.length > 0 ? '#2085f6' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: selectedFields.length > 0 ? 'pointer' : 'not-allowed',
            fontSize: '16px',
            fontWeight: '600',
            width: '100%',
            transition: 'background 0.2s ease'
          }}
        >
          Show Banner
        </button>

        <div style={{ marginTop: '30px', padding: '20px', background: '#fff9e6', borderRadius: '6px', border: '1px solid #ffe082' }}>
          <h4 style={{ marginBottom: '10px', color: '#f57c00' }}>ℹ️ Demo Features:</h4>
          <ul style={{ color: '#777', fontSize: '14px', lineHeight: '1.8', margin: 0 }}>
            <li>Banner auto-closes after 10 seconds (demo mode)</li>
            <li>Click the X button to close manually</li>
            <li>Banner appears at the top center of the page</li>
            <li>Uses color scheme: #636363, #777777, #CCCCCC</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FieldUpdateBannerDemo;
