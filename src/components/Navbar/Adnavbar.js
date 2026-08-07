import React from 'react';
import styles from './Adnavbar.module.css';
import Adminicon from '../../assets/Adminicon.png';

const Adnavbar = ({ onToggleSidebar }) => {
  return (
    <div className={styles['ad-navbar']}>
      <div className={styles['ad-navbar-left']}> {/* Group logo and name */}
        <span className={styles['ad-portal-logo']}>
          <img src={Adminicon} alt="Portal Logo" />
        </span>
        <span className={styles['ad-portal-name']}>Placement Portal</span>
      </div>
      <div className={styles['ad-menu']}> {/* This will be hidden on mobile */}
      </div>
      {/* Hamburger menu for small screens, aligned right */}
      <button className={styles['ad-hamburger-menu']} onClick={onToggleSidebar}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
      </button>
    </div>
  );
};

export default Adnavbar;