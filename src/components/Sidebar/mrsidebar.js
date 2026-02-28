import React from 'react';
import { Link } from "react-router-dom";
// 1. Import module
import styles from "./mrsidebar.module.css";

import Adminicons from '../../assets/BlueAdminicon.png';
import personalinfo from "../../assets/personal information icon.svg";
import academicIcon from "../../assets/academic.svg";
import otherDetailsIcon from "../../assets/otherdetails.svg";
import loginDetailsIcon from "../../assets/logindetails.svg";

const sectionList = [
    { key: 'personal', label: 'Personal Information', icon: personalinfo },
    { key: 'academic', label: 'Academic Background', icon: academicIcon },
    { key: 'other', label: 'Other Details', icon: otherDetailsIcon },
    { key: 'login', label: 'Login Details', icon: loginDetailsIcon },
];

const Sidebar = ({ isOpen, currentView, completedSections, onViewChange }) => {
    const handleClick = (key) => {
        onViewChange(key);
    };

    return (
        // 2. Use styles['mr-sidebar']
        <div className={`${styles['mr-sidebar']} ${isOpen ? styles.active : ''}`}>
            
            {/* Welcome Section */}
            <div className={styles['mr-sidebar-welcome']}>
                <img src={Adminicons} alt="Welcome Icon" className={styles['mr-sidebar-welcome-icon']} />
                <span>WE WELCOME YOU</span>
            </div>

            {/* Navigation */}
            <nav className={styles['mr-sidebar-nav']}>
                <div className={styles['mr-sidebar-menu-table']}>
                    {sectionList.map(({ key, label, icon }) => {
                        const isActive = currentView === key;
                        const isCompleted = completedSections[key];
                        // Conditional classes
                        const activeClass = isActive ? styles.active : '';
                        const completedClass = isCompleted ? styles.completed : '';
                        
                        return (
                            <div
                                key={key}
                                className={`${styles['mr-sidebar-menu-row']} ${activeClass} ${completedClass}`}
                                onClick={() => handleClick(key)}
                            >
                                <img src={icon} alt={label} className={styles['mr-sidebar-menu-icon']} />
                                <span className={styles['mr-sidebar-menu-label-cell']}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </nav>

            {/* Divider */}
            <div className={styles['mr-sidebar-divider-container']}></div>

            {/* Login Section */}
            <div className={styles['mr-sidebar-welcome']}> {/* Reusing welcome container style for alignment */}
                <p style={{ marginBottom: '10px' }}>Already have an account?</p>
                <Link to="/mainlogin">
                    <button className={styles['mr-sidebar-login-button']}>Login</button>
                </Link>
            </div>
        </div>
    );
};

export default Sidebar;