import React, { useEffect, useState } from 'react';
import styles from './CertificateStatusBanner.module.css';

/**
 * CertificateStatusBanner - A notification banner for certificate approval/rejection
 * Similar design to FieldUpdateBanner but with status-specific colors
 *
 * @param {string} status - 'approved' or 'rejected'
 * @param {string} certificateName - Name of the certificate
 * @param {function} onClose - Callback when banner is dismissed
 */
const CertificateStatusBanner = ({ status, certificateName, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 400); // Wait for exit animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!certificateName) return null;

  const isApproved = status === 'approved';

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 400); // Wait for exit animation
  };

  return (
    <div
      className={`${styles.bannerContainer} ${!isVisible ? styles.slideOut : ''}`}
    >
      <div className={`${styles.banner} ${isApproved ? styles.approved : styles.rejected}`}>
        <div className={styles.iconWrapper}>
          {isApproved ? (
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
          ) : (
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
                d="M15 9l-6 6M9 9l6 6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <div className={styles.content}>
          <p className={styles.header}>
            Certificate {isApproved ? 'Approved' : 'Rejected'}
          </p>
          <p className={styles.certificateName}>{certificateName}</p>
        </div>
        <button className={styles.closeButton} onClick={handleClose} aria-label="Close">
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

export default CertificateStatusBanner;
