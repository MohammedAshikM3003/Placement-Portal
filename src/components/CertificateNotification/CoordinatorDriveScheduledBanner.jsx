import React, { useEffect, useState } from 'react';
import styles from './DriveScheduledBanner.module.css';

/**
 * CoordinatorDriveScheduledBanner - Coordinator notification banner for scheduled drive
 * Shows drive details: Company name · Job role · Start date · End date
 */
const CoordinatorDriveScheduledBanner = ({
  companyName,
  jobRole,
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

  // Build the subtitle: company name · job role · start date · end date
  const subtitle = [
    companyName,
    jobRole,
    formatDate(startDate),
    formatDate(endDate)
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className={`${styles.bannerContainer} ${!isVisible ? styles.slideOut : ''}`}
    >
      <div className={`${styles.banner} ${styles.coordinatorscheduled}`}>
        <div className={styles.iconWrapper}>
          <svg
            className={styles.statusIcon}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path d="M0 0h24v24H0z" fill="none" />
            <path
              fill="white"
              d="M5 9.615h14v-3q0-.23-.192-.423T18.384 6H5.616q-.231 0-.424.192T5 6.616zm0 0V6zM5.616 21q-.691 0-1.153-.462T4 19.385V6.615q0-.69.463-1.152T5.616 5h1.769V3.308q0-.233.153-.386t.385-.153t.386.153t.153.386V5h7.154V3.27q0-.214.143-.358t.357-.143t.356.143t.144.357V5h1.769q.69 0 1.153.463T20 6.616v4.751q0 .214-.143.357t-.357.143t-.357-.143t-.143-.357v-.752H5v8.77q0 .23.192.423t.423.192h6.435q.214 0 .357.143t.143.357t-.143.357t-.357.143zm9.933-.164Q14.385 19.67 14.385 18t1.164-2.835T18.384 14q1.672 0 2.836 1.165q1.165 1.164 1.165 2.835t-1.165 2.836T18.385 22t-2.836-1.164m3.22-2.997V15.5q0-.161-.111-.273t-.274-.111t-.273.111T18 15.5v2.333q0 .161.056.3q.055.14.186.27l1.525 1.526q.112.111.264.121t.282-.121t.131-.273t-.13-.273z"
            />
          </svg>
        </div>
        <div className={styles.content}>
          <p className={styles.header}>New Drive is Scheduled</p>
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

export default CoordinatorDriveScheduledBanner;
