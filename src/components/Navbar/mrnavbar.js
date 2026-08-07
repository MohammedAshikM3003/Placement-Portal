import React from 'react';
import Adminicon from "../../assets/Adminicon.png";
// 1. Import the CSS Module
import styles from "./mrnavbar.module.css";

const Navbar = ({ onToggleSidebar }) => {
    return (
        // 2. Update all className strings to use styles object
        <div className={styles['mr-navbar']}>
            <div className={styles['mr-left']}>
                <span className={styles['mr-portal-logo']}>
                    <img src={Adminicon} alt="Portal Logo" />
                </span>
                <span className={styles['mr-portal-name']}>Placement Portal</span>
            </div>
            
            {/* Hamburger Button */}
            <button className={styles['mr-hamburger-btn']} onClick={onToggleSidebar}>
                <span className={styles['mr-hamburger-line']}></span>
                <span className={styles['mr-hamburger-line']}></span>
                <span className={styles['mr-hamburger-line']}></span>
            </button>
        </div>
    );
}

export default Navbar;