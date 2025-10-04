import React from 'react';
import Adminicon from "../../assets/Adminicon.png";
import "./mrnavbar.css";

const Navbar = ({ onToggleSidebar }) => {
    return (
        <div className="mr-navbar">
            <div className="mr-left">
                <span className="mr-portal-logo">
                    <img src={Adminicon} alt="Portal Logo" />
                </span>
                <span className="mr-portal-name">Placement Portal</span>
            </div>
            {/* The hamburger button now has the onClick handler */}
            <button className="mr-hamburger-btn" onClick={onToggleSidebar}>
                <span className="mr-hamburger-line"></span>
                <span className="mr-hamburger-line"></span>
                <span className="mr-hamburger-line"></span>
            </button>
        </div>
    );
}

export default Navbar;