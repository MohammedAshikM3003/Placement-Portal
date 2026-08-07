import React from 'react';
import styles from './PageHeader.module.css';

const PageHeader = ({ title, description, onBack, backLabel = 'Back', actions }) => {
  return (
    <div className={styles.header}>
      <div className={styles.titleArea}>
        {onBack && (
          <button type="button" className={styles.backBtn} onClick={onBack}>
            &#8592; {backLabel}
          </button>
        )}
        <div>
          <h1 className={styles.title}>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
        </div>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
};

export default PageHeader;
