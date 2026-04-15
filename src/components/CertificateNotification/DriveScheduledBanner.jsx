import React, { useEffect, useState } from 'react';
import styles from './DriveScheduledBanner.module.css';

/**
 * DriveScheduledBanner - Admin notification banner for scheduled drive
 * Shows drive details: Company name • Job role • Package • Start date • End date
 *
 * @param {string} companyName - Company name
 * @param {string} jobRole - Job role
 * @param {string} packageName - Package/salary
 * @param {string} startDate - Drive start date
 * @param {string} endDate - Drive end date
 * @param {function} onClose - Callback when banner is dismissed
 */
const DriveScheduledBanner = ({
  companyName,
  jobRole,
  packageName,
  startDate,
  endDate,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-dismiss after 5 seconds
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

  // Format date to DD-MM-YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB').split('/').join('-');
    } catch {
      return dateString;
    }
  };

  // Build the subtitle with all details
  const subtitle = [
    companyName,
    jobRole,
    packageName,
    formatDate(startDate),
    formatDate(endDate)
  ]
    .filter(Boolean)
    .join(' . ');

  return (
    <div
      className={`${styles.bannerContainer} ${!isVisible ? styles.slideOut : ''}`}
    >
      <div className={`${styles.banner} ${styles.scheduled}`}>
        <div className={styles.iconWrapper}>
          <svg
            className={styles.statusIcon}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path fill="currentColor" d="M12 21a9 9 0 1 1 9-9a9 9 0 0 1-9 9m0-16.5a7.5 7.5 0 1 0 7.5 7.5A7.5 7.5 0 0 0 12 4.5"/>
            <path fill="currentColor" d="M15 12.75h-3a.76.76 0 0 1-.75-.75V7a.75.75 0 0 1 1.5 0v4.25H15a.75.75 0 0 1 0 1.5"/>
          </svg>
        </div>
        <div className={styles.content}>
          <p className={styles.header}>Drive Scheduled ✓</p>
          <p className={styles.detailText}>{subtitle}</p>
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

export default DriveScheduledBanner;
