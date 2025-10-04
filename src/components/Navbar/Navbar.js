import React from 'react';
import './Navbar.css';
import Adminicon from '../../assets/Adminicon.png';

const Navbar = ({ onToggleSidebar }) => {
  return (
    <div className="navbar">
      <div className="navbar-left"> {/* Group logo and name */}
        <span className="portal-logo">
          <img src={Adminicon} alt="Portal Logo" />
        </span>
        <span className="portal-name">Placement Portal</span>
      </div>
      <div className="menu"> {/* This will be hidden on mobile */}
      </div>
      {/* Hamburger menu for small screens, aligned right */}
      <button className="hamburger-menu" onClick={onToggleSidebar}>
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
          </svg>
      </button>
    </div>
  );
};

export default Navbar;