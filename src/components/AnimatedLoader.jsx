import React from 'react';
import styles from './AnimatedLoader.module.css';

const AnimatedLoader = ({ message = "Loading data... Please wait...", subMessage = "Fetching Latest Placement Statistics." }) => {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.loadingCard}>
        {/* Animated Dots */}
        <div className={styles.dotsContainer}>
          <div className={`${styles.loadingDot} ${styles.dotGreen}`} />
          <div className={`${styles.loadingDot} ${styles.dotRed}`} />
          <div className={`${styles.loadingDot} ${styles.dotBlue}`} />
        </div>

        {/* Loading Messages */}
        <div className={styles.message}>
          {message}
        </div>
        
        <div className={styles.subMessage}>
          {subMessage}
        </div>
      </div>
    </div>
  );
};

export default AnimatedLoader;