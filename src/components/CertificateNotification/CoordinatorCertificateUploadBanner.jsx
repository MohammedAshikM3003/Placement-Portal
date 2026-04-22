import React, { useEffect, useMemo, useState } from 'react';
import styles from './CoordinatorCertificateUploadBanner.module.css';

const CoordinatorCertificateUploadBanner = ({ regNo, studentName, competition, prize, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  const detailText = useMemo(() => {
    return [
      (regNo || '').toString().trim(),
      (studentName || '').toString().trim(),
      (competition || '').toString().trim(),
      (prize || '').toString().trim()
    ].filter(Boolean).join(' · ');
  }, [regNo, studentName, competition, prize]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 400);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 400);
  };

  if (!detailText) return null;

  return (
    <div className={`${styles.bannerContainer} ${!isVisible ? styles.slideOut : ''}`}>
      <div className={styles.banner}>
        <div className={styles.iconWrapper}>
          <svg
            className={styles.statusIcon}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
            <path
              d="M8 12l2.5 2.5L16 9"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className={styles.content}>
          <p className={styles.header}>New Certificate Uploaded</p>
          <p className={styles.detailText}>{detailText}</p>
        </div>
        <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CoordinatorCertificateUploadBanner;
