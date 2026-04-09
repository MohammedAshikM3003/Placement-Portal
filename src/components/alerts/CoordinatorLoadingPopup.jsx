import React from 'react';
import styles from './CoordinatorLoadingPopup.module.css';

const CoordinatorLoadingPopup = ({
  isOpen,
  title = 'Loading...',
  message = 'Loading student profile...'
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <div className={styles.header}>{title}</div>
        <div className={styles.body}>
          <div className={styles.spinner} aria-hidden="true" />
          <h2 className={styles.title}>Please wait</h2>
          <p className={styles.message}>{message}</p>
          <p className={styles.subMessage}>Preparing the page...</p>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorLoadingPopup;