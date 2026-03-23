import React from 'react';
import './AlertStyles.css';
import styles from './UnsavedChangesAlert.module.css';

/**
 * UnsavedChangesAlert - Popup that appears when user tries to navigate away with unsaved changes
 * Shows which specific fields were changed and offers Save or Discard options
 *
 * @param {boolean} isOpen - Controls popup visibility
 * @param {function} onClose - Callback when popup is closed
 * @param {function} onSave - Callback when user clicks Save
 * @param {function} onDiscard - Callback when user clicks Discard
 * @param {array} changedFields - Array of field names that were changed
 */
const UnsavedChangesAlert = ({
  isOpen,
  onClose,
  onSave,
  onDiscard,
  changedFields = []
}) => {
  if (!isOpen) return null;

  const handleSave = () => {
    onSave();
    onClose();
  };

  const handleDiscard = () => {
    onDiscard();
    onClose();
  };

  return (
    <div className="alert-overlay" onClick={onClose}>
      <div className="alert-container" onClick={(e) => e.stopPropagation()}>
        <div className={`alert-header ${styles.detailsChangedHeader}`}>
          Details Changed !
        </div>
        <div className="alert-body">
          {/* Warning Icon */}
          <svg
            className={`alert-icon ${styles.warningIcon}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 52 52"
          >
            <circle
              className={styles.warningIconCircle}
              cx="26"
              cy="26"
              r="25"
              fill="none"
            />
            <path
              className={styles.warningIconExclamation}
              fill="none"
              d="M26 14 L26 30"
            />
            <circle
              className={styles.warningIconDot}
              cx="26"
              cy="38"
              r="2.5"
            />
          </svg>

          <h2 className="alert-title">Modified Fields !</h2>

          {/* Changed Fields List */}
          {changedFields.length > 0 && (
            <div className={styles.changedFieldsContainer}>
              <div className={styles.fieldsList}>
                {changedFields.map((field, index) => (
                  <span key={index} className={styles.fieldChip}>
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className={styles.warningMessage}>
            Do you want to save these changes before leaving?
          </p>
        </div>

        <div className={`alert-footer ${styles.detailsChangedFooter}`}>
          <button
            onClick={handleDiscard}
            className={`alert-button ${styles.discardButton}`}
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            className={`alert-button ${styles.saveButton}`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnsavedChangesAlert;
