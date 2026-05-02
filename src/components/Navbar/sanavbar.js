import React from 'react';
import styles from './sanavbar.module.css';
import Adminicon from '../../assets/Adminicon.png';

const Sanavbar = ({ onToggleSidebar }) => {
  return (
    <div className={styles['sa-navbar']}>
      <div className={styles['sa-navbar-left']}> {/* Group logo and name */}
        <span className={styles['sa-portal-logo']}>
          <img src={Adminicon} alt="Portal Logo" />
        </span>
        <span className={styles['sa-portal-name']}>Placement Portal</span>
      </div>
      <div className={styles['sa-menu']}> {/* reserved for menu items */}
      </div>
      <button className={styles['sa-hamburger-menu']} onClick={onToggleSidebar} aria-label="Toggle sidebar">
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>
    </div>
  );
};

export default Sanavbar;
