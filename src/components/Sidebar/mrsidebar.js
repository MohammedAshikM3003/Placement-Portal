import React from 'react';
import { Link } from "react-router-dom";
import Adminicons from '../../assets/BlueAdminicon.png';
import personalinfo from "../../assets/personal information icon.svg";
import academicIcon from "../../assets/academic.svg";
import semesterIcon from "../../assets/semester.svg";
import otherDetailsIcon from "../../assets/otherdetails.svg";
import loginDetailsIcon from "../../assets/logindetails.svg";
import "./mrsidebar.css";

const sectionList = [
    { key: 'personal', label: 'Personal Information', icon: personalinfo },
    { key: 'academic', label: 'Academic Background', icon: academicIcon },
    { key: 'semester', label: 'Semester', icon: semesterIcon },
    { key: 'other', label: 'Other Details', icon: otherDetailsIcon },
    { key: 'login', label: 'Login Details', icon: loginDetailsIcon },
];

const Sidebar = ({ isOpen, currentView, completedSections, onViewChange, onLoginClick }) => {
    const handleClick = (key) => {
        onViewChange(key);
        // The parent component should handle closing the sidebar for mobile view after a click.
    };

    return (
        <div className={`mr-sidebar ${isOpen ? 'active' : ''}`}>
            {/* Welcome Section */}
            <div className="mr-sidebar-welcome">
                <img src={Adminicons} alt="Welcome Icon" className="mr-sidebar-welcome-icon" />
                <span>WE WELCOME YOU</span>
            </div>

            {/* Navigation */}
            <nav className="mr-sidebar-nav">
                <div className="mr-sidebar-menu-table">
                    {sectionList.map(({ key, label, icon }) => {
                        const isActive = currentView === key;
                        const isCompleted = completedSections[key];
                        const completedClass = isCompleted ? 'completed' : '';
                        const selectedClass = isActive ? 'active' : '';
                        return (
                            <div
                                key={key}
                                className={`mr-sidebar-menu-row ${selectedClass} ${completedClass}`}
                                onClick={() => handleClick(key)}
                            >
                                <img src={icon} alt={label} className="mr-sidebar-menu-icon" />
                                <span className="mr-sidebar-menu-label-cell">
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </nav>

            {/* Divider */}
            <hr style={{width : '100%'}} />

            {/* Login Section */}
            <div className="mr-sidebar-login-section">
                <p className="mr-sidebar-login-text" style={{marginLeft : '10px'}}>Already have an account?</p>
                <Link to="/mainlogin"  style={{position : "relative",marginLeft : '65px'}}>
                    <button className="mr-popup-login-btn">Login</button>
                </Link>
            </div>
        </div>
    );
};

export default Sidebar;