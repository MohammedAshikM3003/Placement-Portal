import React from 'react';
// Import HashLink from react-router-hash-link
import { HashLink } from 'react-router-hash-link';

// Make sure to adjust the path to your asset file
import Adminicon from "../../assets/Adminicon.png";

const Navbar = () => {
  return (
    <>
      {/* --- CSS Styles for the Navbar --- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

        body {
            margin: 0;
            font-family: 'Poppins', sans-serif;
            background-color: #f0f2f5;
        }

        .main-header {
            background-color: #4F46E5;
            color: white;
            padding: 15px 5%;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            height: 65px;
            position: sticky;
            top: 0;
            z-index: 1000;
        }

        .header-logo {
            display: flex;
            align-items: center;
            gap: 20px;
            font-size: 1.5rem;
            font-weight: 700;
            position: relative;
            left: -20px;
        }

        .header-logo-img {
            height: 40px;
        }

        .header-nav a {
            color: white;
            text-decoration: none;
            margin-left: 80px;
            font-weight: 500;
            font-size: 1rem;
            transition: opacity 0.3s;
        }

        .header-nav a:hover {
            opacity: 0.8;
        }

        /* Hide mobile home link by default (desktop) */
        .mobile-home-link {
            display: none;
        }

        @media (max-width: 768px) {
            .header-nav {
                display: none;
            }
            .header-logo {
                left: 0;
                width: auto;
                justify-content: flex-start;
            }
            .main-header {
                justify-content: space-between;
            }
            .mobile-home-link {
                display: block;
                color: white;
                text-decoration: none;
                font-weight: 500;
                font-size: 1rem;
                padding: 8px 16px;
                border-radius: 8px;
                background-color: rgba(255, 255, 255, 0.1);
                transition: background-color 0.3s;
            }
            .mobile-home-link:hover {
                background-color: rgba(255, 255, 255, 0.2);
            }
        }
      `}</style>

      {/* --- JSX for the Navbar --- */}
      <header className="main-header">
        <div className="header-logo">
          <img src={Adminicon} alt="Placement Portal Icon" className="header-logo-img" />
          <span>Placement Portal</span>
        </div>
        <nav className="header-nav">
          {/* Use HashLink with the 'smooth' prop */}
          <HashLink smooth to="/#home">Home</HashLink>
          <HashLink smooth to="/#about">About</HashLink>
          <HashLink smooth to="/#drive">Drives</HashLink>
          <HashLink smooth to="/#contact">Contact</HashLink>
        </nav>
        {/* Mobile Home Link - Only visible on mobile */}
        <HashLink smooth to="/#home" className="mobile-home-link">Home</HashLink>
      </header>
    </>
  );
};

export default Navbar;