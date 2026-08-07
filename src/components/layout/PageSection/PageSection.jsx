import React from 'react';
import styles from './PageSection.module.css';

const PageSection = ({ title, children }) => {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionHeader}>{title}</h2>
      {children}
    </section>
  );
};

export default PageSection;
