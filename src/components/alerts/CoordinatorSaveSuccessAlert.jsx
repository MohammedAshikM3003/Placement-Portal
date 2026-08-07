import React from 'react';
import styles from './CoordinatorSaveSuccessAlert.module.css';

const CoordinatorSaveSuccessAlert = ({
  isOpen,
  onClose,
  title = 'Saved!',
  heading = 'Changes Saved ✓',
  message = 'Your Details have been Successfully saved in the Portal'
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>{title}</div>
        <div className={styles.body}>
          <svg className={styles.icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className={styles.iconCircle} cx="26" cy="26" r="25" fill="none" />
            <path className={styles.iconCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
          <h2 className={styles.heading}>{heading}</h2>
          <p className={styles.message}>{message}</p>
        </div>
        <div className={styles.footer}>
          <button type="button" onClick={onClose} className={styles.closeButton}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorSaveSuccessAlert;