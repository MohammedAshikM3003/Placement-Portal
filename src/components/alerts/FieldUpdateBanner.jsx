import React from 'react';
import styles from './FieldUpdateBanner.module.css';

/**
 * FieldUpdateBanner - A notification banner that displays when fields have unsaved changes
 *
 * @param {boolean} isVisible - Controls banner visibility
 * @param {array} updatedFields - Array of field names that were updated
 */
const FieldUpdateBanner = ({
  isVisible,
  updatedFields = []
}) => {
  if (!isVisible || updatedFields.length === 0) return null;

  // Format the field names for display with bullet separator
  const fieldText = updatedFields.join('  •  ');
  const shouldScroll = updatedFields.length > 1;

  return (
    <div className={styles.bannerContainer}>
      <div className={styles.banner}>
        <div className={styles.iconWrapper}>
          <svg
            className={styles.saveIcon}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16L21 8V19C21 20.1046 20.1046 21 19 21Z"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17 21V13H7V21"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7 3V8H15"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className={styles.content}>
          <p className={styles.header}>Unsaved Changes</p>
          <div className={`${styles.fieldNamesWrapper} ${shouldScroll ? styles.scrolling : ''}`}>
            <div className={`${styles.fieldNames} ${shouldScroll ? styles.marquee : ''}`}>
              <span>{fieldText}</span>
              {shouldScroll && <span>{fieldText}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldUpdateBanner;
