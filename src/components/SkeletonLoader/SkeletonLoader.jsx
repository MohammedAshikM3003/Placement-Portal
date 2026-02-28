import React from 'react';
import styles from './SkeletonLoader.module.css';

/**
 * Skeleton shimmer card for placed students
 */
export const StudentCardSkeleton = () => (
  <div className={styles.studentCardSkeleton}>
    <div className={styles.skeletonPhotoContainer}>
      <div className={`${styles.skeletonBlock} ${styles.shimmer}`} style={{ width: '64px', height: '64px', borderRadius: '12px' }} />
    </div>
    <div className={styles.skeletonDetails}>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '80%' }} />
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '60%' }} />
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '70%' }} />
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '55%' }} />
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '65%' }} />
    </div>
  </div>
);

/**
 * Skeleton shimmer card for upcoming drives
 */
export const DriveCardSkeleton = () => (
  <div className={styles.driveCardSkeleton}>
    <div className={`${styles.skeletonCircle} ${styles.shimmer}`} />
    <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '70%', height: '18px', margin: '10px auto' }} />
    <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '55%', margin: '6px auto' }} />
    <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '50%', margin: '6px auto' }} />
  </div>
);

/**
 * Skeleton for highlight stats cards
 */
export const HighlightCardSkeleton = () => (
  <div className={styles.highlightCardSkeleton}>
    <div className={`${styles.skeletonBlock} ${styles.shimmer}`} style={{ width: '120px', height: '48px', borderRadius: '8px', margin: '30px auto 15px' }} />
    <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '80%', margin: '0 auto' }} />
  </div>
);

/**
 * Skeleton for college banner/header images
 * Matches exact dimensions and positioning of actual banner
 */
export const BannerSkeleton = () => (
  <div className={styles.bannerSkeleton}>
    <div 
      className={`${styles.skeletonBlock} ${styles.shimmer}`} 
      style={{ 
        flex: '1',
        maxWidth: '1100px', 
        minWidth: '500px',
        height: '160px', 
        borderRadius: '12px' 
      }} 
    />
    <div className={styles.certificatesGroup}>
      <div 
        className={`${styles.skeletonBlock} ${styles.shimmer}`} 
        style={{ 
          width: '150px', 
          height: '150px', 
          borderRadius: '50%'
        }} 
      />
      <div 
        className={`${styles.skeletonBlock} ${styles.shimmer}`} 
        style={{ 
          width: '150px', 
          height: '150px', 
          borderRadius: '50%'
        }} 
      />
    </div>
  </div>
);

/**
 * Render a row of skeleton student cards
 */
export const PlacedStudentsSkeleton = ({ count = 5 }) => (
  <div className={styles.skeletonRow}>
    {Array.from({ length: count }).map((_, i) => (
      <StudentCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Render a row of skeleton drive cards
 */
export const DrivesSkeleton = ({ count = 4 }) => (
  <div className={styles.skeletonRow}>
    {Array.from({ length: count }).map((_, i) => (
      <DriveCardSkeleton key={i} />
    ))}
  </div>
);

/**
 * Skeleton for footer banner/logo area
 * Shows a shimmer placeholder while college images reload in the footer
 */
export const FooterBannerSkeleton = () => (
  <div className={styles.footerBannerSkeleton}>
    <div 
      className={`${styles.skeletonBlock} ${styles.shimmer}`} 
      style={{ 
        width: '200px', 
        height: '60px', 
        borderRadius: '8px'
      }} 
    />
  </div>
);

const SkeletonComponents = {
  StudentCardSkeleton,
  DriveCardSkeleton,
  HighlightCardSkeleton,
  BannerSkeleton,
  FooterBannerSkeleton,
  PlacedStudentsSkeleton,
  DrivesSkeleton,
};

export default SkeletonComponents;
