import React, { useState } from 'react';
import './MainRegistrationPopUp.css';

const MainRegistrationPopup = ({ onContinue, onBack }) => {
    const [isChecked, setIsChecked] = useState(false);

    const handleCheckboxChange = (event) => {
        setIsChecked(event.target.checked);
    };

    const handleContinueClick = () => {
        if (isChecked) {
            onContinue(); // Call the prop function to handle the transition
        }
    };

    const handleBackClick = () => {
        onBack(); // Call the prop function to go back
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h2 className="note-heading">NOTE !</h2>
                </div>
                <div className="modal-body">
                    <ol className="note-list">
                        <li>Only Placement interested B.E/B.Tech Students should Register here</li>
                        <li>Mandatory fields are marked with an asterisk [<span className="required"> * Required</span>]</li>
                        <li>
                            Photo size: (100-500 KB)<br />
                            Photo Format: (JPEG)
                        </li>
                    </ol>
                    <div className="checkbox-container">
                        <input
                            type="checkbox"
                            id="agree-checkbox"
                            checked={isChecked}
                            onChange={handleCheckboxChange}
                        />
                        <label htmlFor="agree-checkbox">Mark the Check Box to Continue Registration Process</label>
                    </div>
                    <div className="button-container">
                        <button className="btn back-btn" onClick={handleBackClick}>
                            Back
                        </button>
                        <button
                            className="btn continue-btn"
                            onClick={handleContinueClick}
                            disabled={!isChecked}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainRegistrationPopup;