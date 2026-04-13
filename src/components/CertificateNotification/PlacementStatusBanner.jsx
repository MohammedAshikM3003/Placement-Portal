import React, { useEffect, useState } from 'react';
import styles from './PlacementStatusBanner.module.css';

/**
 * PlacementStatusBanner - Multi-status notification banner
 * Shows different banners for: Placed, Passed Round, Failed/Rejected, Absent
 *
 * @param {string} status - Status type: 'placed' | 'passed' | 'failed' | 'absent'
 * @param {string} companyName - Company name
 * @param {string} jobRole - Job role
 * @param {string} roundName - Round name (for passed rounds)
 * @param {number} roundNumber - Round number (for passed rounds)
 * @param {function} onClose - Callback when banner is dismissed
 */
const PlacementStatusBanner = ({
  status = 'placed',
  companyName,
  jobRole,
  packageName,
  roundName,
  roundNumber,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const trimmedCompany = (companyName || '').toString().trim();
  const trimmedJobRole = (jobRole || '').toString().trim();
  const trimmedPackage = (packageName || '').toString().trim();

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

  const getStatusConfig = () => {
    const configs = {
      placed: {
        className: styles.placed,
        title: 'Congratulations !!! You are Placed',
        icon: (
          <svg
            className={styles.statusIcon}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Star icon */}
            <path
              d="M12 2L15.09 8.26H22L16.95 12.91L19.09 19.16L12 14.5L4.91 19.16L7.05 12.91L2 8.26H8.91L12 2Z"
              fill="white"
            />
          </svg>
        ),
        subtitle: [trimmedCompany, trimmedJobRole, trimmedPackage].filter(Boolean).join(' . ')
      },
      passed: {
        className: styles.passed,
        title: `Round ${roundNumber || '1'} Passed! 🎉`,
        icon: (
          <svg
            className={styles.statusIcon}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Check icon */}
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
            <path
              d="M8 12l2.5 2.5L16 9"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
        subtitle: (
          <div className={styles.mainText}>
            {[trimmedCompany, trimmedJobRole, (roundName || '').toString().trim()].filter(Boolean).join(' . ')}
          </div>
        )
      },
      failed: {
        className: styles.failed,
        title: 'Round Rejected ✗',
        icon: (
          <svg
            className={styles.statusIcon}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* X icon */}
            <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" />
            <path
              d="M8 8L16 16M16 8L8 16"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
        subtitle: (
          <div className={styles.mainText}>
            {[trimmedCompany, trimmedJobRole, (roundName || '').toString().trim()].filter(Boolean).join(' . ')}
          </div>
        )
      },
      absent: {
        className: styles.absent,
        title: 'Absence Marked',
        icon: (
          <div className={styles.absentAIcon} aria-hidden="true">A</div>
        ),
        subtitle: (
          <div className={styles.mainText}>
            {[trimmedCompany, trimmedJobRole].filter(Boolean).join(' . ')}
          </div>
        )
      }
    };

    return configs[status.toLowerCase()] || configs.placed;
  };

  const config = getStatusConfig();

  if (!companyName) return null;

  return (
    <div
      className={`${styles.bannerContainer} ${!isVisible ? styles.slideOut : ''}`}
    >
      <div className={`${styles.banner} ${config.className}`}>
        <div className={styles.iconWrapper}>{config.icon}</div>
        <div className={styles.content}>
          <p className={styles.header}>{config.title}</p>
          <p className={styles.companyName}>{config.subtitle}</p>
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

export default PlacementStatusBanner;
