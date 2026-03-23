import React from 'react';
import styles from './Admin_TrainAddPopup.module.css';

function AdminTrainAddPopup({ isOpen, onClose, onConfirm, selectedCount }) {
  if (!isOpen) return null;

  return (
    <div className={styles['admin-train-add-popup-overlay']}>
      <div className={styles['admin-train-add-popup-container']}>
        <div className={styles['admin-train-add-popup-header']}>
          Confirm ?
        </div>
        
        <div className={styles['admin-train-add-popup-body']}>
          <div className={styles['admin-train-add-popup-icon']}>
            ?
          </div>
          
          <h2 className={styles['admin-train-add-popup-title']}>
            Are You Sure ?
          </h2>
          
          <p className={styles['admin-train-add-popup-message']}>
            Confirm whether the students are selected to the batch before Adding.
          </p>
        </div>

        <div className={styles['admin-train-add-popup-footer']}>
          <button
            className={styles['admin-train-add-popup-confirm-btn']}
            onClick={onConfirm}
          >
            Confirm
          </button>
          <button
            className={styles['admin-train-add-popup-close-btn']}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminTrainAddPopup;
