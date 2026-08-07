import React from 'react';
import styles from './ResponsiveGrid.module.css';

const ResponsiveGrid = ({ children, columns = 3 }) => {
  return (
    <div className={styles.grid} style={{ '--grid-cols': columns }}>
      {children}
    </div>
  );
};

export default ResponsiveGrid;
