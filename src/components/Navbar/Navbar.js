import React from 'react';
// 1. Import styles object
import styles from './Navbar.module.css';
import Adminicon from '../../assets/Adminicon.png';

const Navbar = ({ onToggleSidebar }) => {
  return (
    // 2. Use styles.navbar instead of "navbar"
    <div className={styles.navbar}>
      
      {/* Use styles['navbar-left'] for hyphenated names */}
      <div className={styles['navbar-left']}> 
        <span className={styles['portal-logo']}>
          <img src={Adminicon} alt="Portal Logo" />
        </span>
        <span className={styles['portal-name']}>Placement Portal</span>
      </div>

      <div className={styles.menu}> 
        {/* Menu items would go here */}
      </div>

      {/* Hamburger menu */}
      <button className={styles['hamburger-menu']} onClick={onToggleSidebar}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
      </button>
    </div>
  );
};

export default Navbar;