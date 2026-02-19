import React, { useState, useEffect } from 'react';
import { HashLink } from 'react-router-hash-link';
import { Link } from 'react-router-dom';
import Adminicon from "../../assets/Adminicon.png";
import Home from "../../assets/landingHomeicon.svg";
import About from "../../assets/landingabouticon.svg";
import Drives from "../../assets/landingDrivesicon.svg";
import Contact from "../../assets/landingContacticon.svg";
// 1. Import the Module
import styles from './LandingNavbar.module.css';

const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const openSidebar = () => {
    setSidebarOpen(true);
    updateActiveSection(); // Update active section when opening sidebar
  };

  const updateActiveSection = () => {
    const hash = window.location.hash.replace('#', '').split('?')[0];
    if (hash === 'about') {
      setActiveSection('about');
    } else if (hash === 'drive') {
      setActiveSection('drive');
    } else if (hash === 'contact') {
      setActiveSection('contact');
    } else {
      setActiveSection('home'); // Default to home
    }
  };

  useEffect(() => {
    // Track current hash location
    const handleHashChange = () => {
      updateActiveSection();
    };

    window.addEventListener('hashchange', handleHashChange);
    updateActiveSection(); // Call on mount
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
      
      {/* Mobile Hamburger Menu */}
      <button 
        className={styles['hamburger-menu']}
        onClick={() => {
          if (!sidebarOpen) {
            openSidebar();
          } else {
            closeSidebar();
          }
        }}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Sidebar */}
      <div className={`${styles['mobile-sidebar']} ${sidebarOpen ? styles['sidebar-open'] : ''}`}>
        <nav className={styles['sidebar-nav']}>
          <HashLink 
            smooth 
            to="/#home" 
            onClick={closeSidebar} 
            className={`${styles['sidebar-link']} ${activeSection === 'home' ? styles['sidebar-link-active'] : ''}`}
          >
            <img src={Home} alt="Home" className={styles['sidebar-icon']} />
            <span>Home</span>
          </HashLink>
          <HashLink 
            smooth 
            to="/#about" 
            onClick={closeSidebar} 
            className={`${styles['sidebar-link']} ${activeSection === 'about' ? styles['sidebar-link-active'] : ''}`}
          >
            <img src={About} alt="About" className={styles['sidebar-icon']} />
            <span>About</span>
          </HashLink>
          <HashLink 
            smooth 
            to="/#drive" 
            onClick={closeSidebar} 
            className={`${styles['sidebar-link']} ${activeSection === 'drive' ? styles['sidebar-link-active'] : ''}`}
          >
            <img src={Drives} alt="Drives" className={styles['sidebar-icon']} />
            <span>Drives</span>
          </HashLink>
          <HashLink 
            smooth 
            to="/#contact" 
            onClick={closeSidebar} 
            className={`${styles['sidebar-link']} ${activeSection === 'contact' ? styles['sidebar-link-active'] : ''}`}
          >
            <img src={Contact} alt="Contact" className={styles['sidebar-icon']} />
            <span>Contact</span>
          </HashLink>
        </nav>
        <Link to="/mainlogin" onClick={closeSidebar} className={styles['sidebar-login-btn']}>Login</Link>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className={styles['sidebar-overlay']}
          onClick={closeSidebar}
        ></div>
      )}
    </header>
  );
};

export default Navbar;