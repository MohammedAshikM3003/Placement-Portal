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
            <path
              d="M9 17v4l3-2l3 2v-4M13.957 4.275l-.323-.444a2.022 2.022 0 0 0-3.268 0l-.323.444L9.5 4.19A2.02 2.02 0 0 0 7.19 6.5l.085.543l-.444.323a2.02 2.02 0 0 0 0 3.268l.444.323l-.085.542A2.02 2.02 0 0 0 9.5 13.81l.543-.085l.323.444a2.022 2.022 0 0 0 3.268 0l.323-.444l.542.085a2.02 2.02 0 0 0 2.311-2.31l-.085-.543l.444-.323a2.022 2.022 0 0 0 0-3.268l-.444-.323l.085-.542A2.02 2.02 0 0 0 14.5 4.19z"
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
