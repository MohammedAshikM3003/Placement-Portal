import React from 'react';
import styles from './Admin_TrainAddPopup.module.css';

function AdminTrainAddPopup({ isOpen, onClose, selectedCount, mode = 'progress', batchLabel = '' }) {
  if (!isOpen) return null;

  const isProgressMode = mode === 'progress';
  const isSuccessMode = mode === 'success';

  const resolvedBatchLabel = (batchLabel || 'Batch').toString().trim();
  const headerText = isProgressMode ? 'Saved !' : 'Saved !';
  const titleText = isProgressMode ? `${resolvedBatchLabel} Saved \u2713` : `${resolvedBatchLabel} Saved \u2713`;
  const messageText = isProgressMode
    ? `Adding students to ${resolvedBatchLabel}...`
    : `${resolvedBatchLabel} has been successfully saved`;

  return (
    <div className={styles['admin-train-add-popup-overlay']}>
      <div className={styles['admin-train-add-popup-container']}>
        <div className={styles['admin-train-add-popup-header']}>
          {headerText}
        </div>
        
        <div className={styles['admin-train-add-popup-body']}>
          <div className={styles['admin-train-add-popup-icon-wrapper']}>
            <svg className={styles['admin-train-add-popup-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className={styles['admin-train-add-popup-icon-circle']} cx="26" cy="26" r="25" fill="none"/>
              <path className={styles['admin-train-add-popup-icon-check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
          
          <h2 className={styles['admin-train-add-popup-title']}>
            {titleText}
          </h2>
          
          <p className={styles['admin-train-add-popup-message']}>
            {isSuccessMode ? `${messageText} (${selectedCount || 0} student${selectedCount === 1 ? '' : 's'})` : messageText}
          </p>
        </div>

        <div className={styles['admin-train-add-popup-footer']}>
          {isProgressMode ? (
            <button
              className={styles['admin-train-add-popup-progress-btn']}
              disabled
            >
              Adding...
            </button>
          ) : null}

          {isSuccessMode ? (
            <button
              className={styles['admin-train-add-popup-close-btn']}
              onClick={onClose}
            >
              Close
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default AdminTrainAddPopup;
