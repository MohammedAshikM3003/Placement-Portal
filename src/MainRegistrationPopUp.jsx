import React, { useState } from 'react';
import styles from './MainRegistrationPopUp.module.css';

const MainRegistrationPopup = ({ onContinue, onBack }) => {
    const [isChecked, setIsChecked] = useState(false);

    const handleCheckboxChange = (event) => {
        setIsChecked(event.target.checked);
    };

    const handleContinueClick = () => {
        if (isChecked) {
            onContinue(); 
        }
    };

    const handleBackClick = () => {
        onBack(); 
    };

    return (
        <div className={styles['modal-overlay']}>
            <div className={styles['modal-content']}>
                <div className={styles['modal-header']}>
                    <h2 className={styles['note-heading']}>NOTE !</h2>
                </div>
                <div className={styles['modal-body']}>
                    <ol className={styles['note-list']}>
                        <li>Only Placement interested B.E/B.Tech Students should Register here</li>
                        <li>Mandatory fields are marked with an asterisk [<span className={styles['required']}>Required</span>]</li>
                        <li>
                            Photo size: (100-500 KB)<br />
                            Photo Format: (JPEG, WebP)
                        </li>
                    </ol>
                    <div className={styles['checkbox-container']}>
                        <input
                            type="checkbox"
                            id="agree-checkbox"
                            checked={isChecked}
                            onChange={handleCheckboxChange}
                        />
                        <label htmlFor="agree-checkbox">Mark the Check Box to Continue Registration Process</label>
                    </div>
                    <div className={styles['button-container']}>
                        <button className={`${styles.btn} ${styles['back-btn']}`} onClick={handleBackClick}>
                            Back
                        </button>
                        <button
                            className={`${styles.btn} ${styles['continue-btn']}`}
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