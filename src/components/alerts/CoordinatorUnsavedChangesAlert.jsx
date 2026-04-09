import React from 'react';
import styles from './CoordinatorUnsavedChangesAlert.module.css';

const CoordinatorUnsavedChangesAlert = ({
  isOpen,
  onClose,
  onSave,
  onDiscard,
  changedFields = [],
  isSaving = false
}) => {
  if (!isOpen) return null;

  const handleSave = () => {
    if (isSaving) return;
    onSave?.();
  };

  const handleDiscard = () => {
    if (isSaving) return;
    onDiscard?.();
  };

  return (
    <div className={styles.overlay} onClick={isSaving ? undefined : onClose}>
      <div className={styles.container} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>Details Changed !</div>

        <div className={styles.body}>
          <svg className={styles.icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className={styles.iconCircle} cx="26" cy="26" r="25" fill="none" />
            <path className={styles.iconExclamation} fill="none" d="M26 14 L26 30" />
            <circle className={styles.iconDot} cx="26" cy="38" r="2.5" />
          </svg>

          <h2 className={styles.title}>Modified Fields !</h2>

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

          <p className={styles.message}>Do you want to save these changes before leaving?</p>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            onClick={handleDiscard}
            className={`${styles.button} ${styles.discardButton}`}
            disabled={isSaving}
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`${styles.button} ${styles.saveButton}`}
            disabled={isSaving}
          >
            {isSaving ? (
              <span className={styles.saveButtonContent}>
                <span className={styles.saveSpinner} aria-hidden="true" />
                Saving...
              </span>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorUnsavedChangesAlert;