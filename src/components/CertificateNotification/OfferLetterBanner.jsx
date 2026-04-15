import React, { useEffect, useMemo, useState } from 'react';
import styles from './OfferLetterBanner.module.css';

const OfferLetterBanner = ({ companyName, jobRole, packageName, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

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

  const subtitle = useMemo(() => {
    return [companyName, jobRole, packageName]
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .join(' • ');
  }, [companyName, jobRole, packageName]);

  return (
    <div className={`${styles.bannerContainer} ${!isVisible ? styles.slideOut : ''}`}>
      <div className={styles.banner}>
        <div className={styles.iconWrapper}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
            <g fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 12c0-3.771 0-5.657 1.172-6.828S6.229 4 10 4h4c3.771 0 5.657 0 6.828 1.172S22 8.229 22 12s0 5.657-1.172 6.828S17.771 20 14 20h-4c-3.771 0-5.657 0-6.828-1.172S2 15.771 2 12Z"/>
              <path strokeLinecap="round" d="m6 8l2.159 1.8c1.837 1.53 2.755 2.295 3.841 2.295s2.005-.765 3.841-2.296L18 8"/>
            </g>
          </svg>
        </div>
        <div className={styles.content}>
          <p className={styles.header}>Offer Letter</p>
          <p className={styles.subtitle}>{subtitle}</p>
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

export default OfferLetterBanner;
