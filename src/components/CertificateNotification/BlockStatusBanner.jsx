import React, { useEffect, useState } from 'react';
import styles from './DriveScheduledBanner.module.css';

const BlockStatusBanner = ({ studentName, regNo, year, semester, actionType, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);
  const normalizedAction = (actionType || '').toString().toLowerCase() === 'unblocked' ? 'unblocked' : 'blocked';

  const yearSem = [year, semester].filter(Boolean).join('-');
  const detailText = [
    studentName || 'Student',
    regNo || 'Reg No',
    yearSem || 'Year-Sem'
  ].filter(Boolean).join(' · ');

  const titleText = normalizedAction === 'blocked' ? 'Student Blocked' : 'Student Unblocked';

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 400);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 400);
  };

  return (
    <div className={`${styles.bannerContainer} ${!isVisible ? styles.slideOut : ''}`}>
      <div className={`${styles.banner} ${normalizedAction === 'blocked' ? styles.blockedBanner : styles.unblockedBanner}`}>
        <div className={styles.iconWrapper}>
          {normalizedAction === 'blocked' ? (
            <svg
              className={styles.statusIcon}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <g fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M5 19L19 5" />
              </g>
            </svg>
          ) : (
            <svg
              className={styles.statusIcon}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M5.636 18.364A9 9 0 1 0 18.364 5.636A9 9 0 0 0 5.636 18.364m2.171-.757a7.001 7.001 0 0 0 9.8-9.8l-2.779 2.779a1 1 0 0 1-1.414-1.414l2.778-2.779a7.002 7.002 0 0 0-9.799 9.8l2.779-2.779a1 1 0 0 1 1.414 1.414z"
                clipRule="evenodd"
                strokeWidth="0.5"
                stroke="currentColor"
              />
            </svg>
          )}
        </div>
        <div className={styles.content}>
          <p className={styles.header}>{titleText}</p>
          <p className={styles.detailText}>{detailText}</p>
        </div>
        <button
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Close"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
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

export default BlockStatusBanner;
