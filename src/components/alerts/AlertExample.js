import React from 'react';
import { SuccessAlert, ErrorAlert, ConfirmAlert, InfoAlert, useAlert } from './index';

// Example component showing how to use the centralized alert system
const AlertExample = () => {
  const { alerts, showSuccess, showError, showConfirm, showInfo, closeAlert } = useAlert();

  const handleSaveProfile = () => {
    // Simulate API call
    setTimeout(() => {
      showSuccess("Profile Saved!", "Your profile has been successfully updated.");
    }, 1000);
  };

  const handleDeleteItem = () => {
    showConfirm(
      "Delete Item", 
      "Are you sure you want to delete this item? This action cannot be undone.",
      () => {
        // Perform delete operation
        showSuccess("Deleted!", "Item has been successfully deleted.");
      }
    );
  };

  const handleError = () => {
    showError("Upload Failed", "The file size is too large. Please choose a smaller file.");
  };

  const handleInfo = () => {
    showInfo("File Size Limit", "Maximum file size allowed is 500KB for profile pictures.");
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Alert System Example</h2>
      
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={handleSaveProfile}>Show Success Alert</button>
        <button onClick={handleError}>Show Error Alert</button>
        <button onClick={handleDeleteItem}>Show Confirm Alert</button>
        <button onClick={handleInfo}>Show Info Alert</button>
      </div>

      {/* Render all alerts */}
      <SuccessAlert
        isOpen={alerts.success.isOpen}
        onClose={() => closeAlert('success')}
        title={alerts.success.title}
        message={alerts.success.message}
      />

      <ErrorAlert
        isOpen={alerts.error.isOpen}
        onClose={() => closeAlert('error')}
        title={alerts.error.title}
        message={alerts.error.message}
      />

      <ConfirmAlert
        isOpen={alerts.confirm.isOpen}
        onClose={() => closeAlert('confirm')}
        onConfirm={alerts.confirm.onConfirm}
        title={alerts.confirm.title}
        message={alerts.confirm.message}
      />

      <InfoAlert
        isOpen={alerts.info.isOpen}
        onClose={() => closeAlert('info')}
        title={alerts.info.title}
        message={alerts.info.message}
      />
    </div>
  );
};

export default AlertExample;
