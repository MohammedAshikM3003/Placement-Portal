import React, { useState, useEffect } from 'react';
import { HashLink } from 'react-router-hash-link';
import { Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();

  const isLoginPage = location.pathname === '/mainlogin' || location.pathname === '/login';
  const isSignupPage = location.pathname === '/signup';

  const loginClass = `${styles['sidebar-login-btn']} ${isLoginPage ? styles['btn-filled'] : styles['btn-outline']}`;
  const signupClass = `${styles['sidebar-signup-btn']} ${isSignupPage ? styles['btn-filled'] : styles['btn-outline']}`;

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const openSidebar = () => {
    setSidebarOpen(true);
    updateActiveSection(); // Update active section when opening sidebar
  };

  const updateActiveSection = () => {
    if (location.pathname !== '/' && location.pathname !== '') {
      setActiveSection('');
      return;
    }
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
  }, [location.pathname, location.hash]);

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
        {/* User Info Section (Profile pic & Name) */}
        <div className={styles['sidebar-user-info']}>
          <div className={styles['sidebar-user-details']}>
            <div className={styles['sidebar-placeholder-circle']}>
              <svg xmlns="http://www.w3.org/2000/svg" width="1.25em" height="1em" viewBox="0 0 640 512" className={styles['sidebar-cap-svg']}>
                <path d="M0 0h640v512H0z" fill="none" />
                <path fill="#4f46e5" d="M320 32c-8.1 0-16.1 1.4-23.7 4.1L15.8 137.4C6.3 140.9 0 149.9 0 160s6.3 19.1 15.8 22.6l57.9 20.9C57.3 229.3 48 259.8 48 291.9V320c0 28.4-10.8 57.7-22.3 80.8c-6.5 13-13.9 25.8-22.5 37.6c-3.2 4.3-4.1 9.9-2.3 15s6 8.9 11.2 10.2l64 16c4.2 1.1 8.7.3 12.4-2s6.3-6.1 7.1-10.4c8.6-42.8 4.3-81.2-2.1-108.7c-3.2-14.2-7.5-28.7-13.5-42v-24.6c0-30.2 10.2-58.7 27.9-81.5c12.9-15.5 29.6-28 49.2-35.7l157-61.7c8.2-3.2 17.5.8 20.7 9s-.8 17.5-9 20.7l-157 61.7c-12.4 4.9-23.3 12.4-32.2 21.6l159.6 57.6c7.6 2.7 15.6 4.1 23.7 4.1s16.1-1.4 23.7-4.1l280.6-101c9.5-3.4 15.8-12.5 15.8-22.6s-6.3-19.1-15.8-22.6L343.7 36.1c-7.6-2.7-15.6-4.1-23.7-4.1M128 408c0 35.3 86 72 192 72s192-36.7 192-72l-15.3-145.4L354.5 314c-11.1 4-22.8 6-34.5 6s-23.5-2-34.5-6l-142.2-51.4z" />
              </svg>
            </div>
            <div className={styles['sidebar-user-text']}>
              <span>Placement Portal</span>
            </div>
          </div>
        </div>

        <nav className={styles['sidebar-nav']}>
          <HashLink 
            smooth 
            to="/#home" 
            onClick={closeSidebar} 
            className={`${styles['sidebar-link']} ${activeSection === 'home' ? styles['sidebar-link-active'] : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={styles['sidebar-icon']}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Home</span>
          </HashLink>
          <HashLink 
            smooth 
            to="/#about" 
            onClick={closeSidebar} 
            className={`${styles['sidebar-link']} ${activeSection === 'about' ? styles['sidebar-link-active'] : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={styles['sidebar-icon']}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>About</span>
          </HashLink>
          <HashLink 
            smooth 
            to="/#drive" 
            onClick={closeSidebar} 
            className={`${styles['sidebar-link']} ${activeSection === 'drive' ? styles['sidebar-link-active'] : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={styles['sidebar-icon']}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Drives</span>
          </HashLink>
          <HashLink 
            smooth 
            to="/#contact" 
            onClick={closeSidebar} 
            className={`${styles['sidebar-link']} ${activeSection === 'contact' ? styles['sidebar-link-active'] : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={styles['sidebar-icon']}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Contact</span>
          </HashLink>
        </nav>
        <Link to="/mainlogin" onClick={closeSidebar} className={loginClass}>Login</Link>
        <Link to="/signup" onClick={closeSidebar} className={signupClass}>Sign Up</Link>
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