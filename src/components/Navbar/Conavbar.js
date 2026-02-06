import React from 'react';
import styles from './Conavbar.module.css';
import Adminicon from '../../assets/Adminicon.png';

const Navbar = ({ onToggleSidebar }) => {
  return (
    <header className={styles.navbar}>
      <div className={styles.navbarLeft}>
        <span className={styles.portalLogo}>
          <img src={Adminicon} alt="Placement Portal Logo" />
        </span>
        <span className={styles.portalName}>Placement Portal</span>
      </div>
      <div className={styles.menu} aria-hidden="true" />
      <button
        type="button"
        className={styles.hamburgerMenu}
        onClick={onToggleSidebar}
        aria-label="Toggle coordinator navigation"
      >
        <svg className={styles.hamburgerIcon} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
        </svg>
      </button>
    </header>
  );
};

export default Navbar;