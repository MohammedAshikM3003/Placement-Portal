import React from 'react';
import { HashLink } from 'react-router-hash-link';
import Adminicon from "../../assets/Adminicon.png";
// 1. Import the Module
import styles from './LandingNavbar.module.css';

const Navbar = () => {
  return (
    // 2. Use styles['main-header']
    <header className={styles['main-header']}>
      <div className={styles['header-logo']}>
        <img src={Adminicon} alt="Placement Portal Icon" className={styles['header-logo-img']} />
        <span>Placement Portal</span>
      </div>
      
      <nav className={styles['header-nav']}>
        {/* HashLinks for smooth scrolling */}
        <HashLink smooth to="/#home">Home</HashLink>
        <HashLink smooth to="/#about">About</HashLink>
        <HashLink smooth to="/#drive">Drives</HashLink>
        <HashLink smooth to="/#contact">Contact</HashLink>
      </nav>
      
      {/* Mobile Home Link */}
      <HashLink smooth to="/#home" className={styles['mobile-home-link']}>Home</HashLink>
    </header>
  );
};

export default Navbar;