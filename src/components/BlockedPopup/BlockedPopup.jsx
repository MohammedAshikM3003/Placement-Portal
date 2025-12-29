import React from 'react';
import styles from './BlockedPopup.module.css';

const BlockedPopup = ({ coordinator, onClose }) => {
    const details = {
        name: coordinator?.name || coordinator?.blockedBy || 'Placement Office',
        cabin: coordinator?.cabin || 'N/A',
        message: coordinator?.message || 'Your account has been temporarily blocked. Please contact the placement office to restore access.',
        blockedBy: coordinator?.blockedBy || coordinator?.name || 'Placement Office'
    };

    return (
        <div className={styles['popup-overlay']} role="dialog" aria-modal="true">
            <div className={styles['popup-container']}>
                <header className={styles['popup-header']}>
                    <h2>Blocked !</h2>
                </header>

                <div className={styles['popup-body']}>
                    <div className={styles['block-icon']} aria-hidden="true">
                        <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" />
                            <line x1="18" y1="18" x2="46" y2="46" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        </svg>
                    </div>

                    <h3 className={styles['blocked-title']}>You've been Blocked!</h3>
                    <p className={styles['blocked-message']}>{details.message}</p>

                    <div className={styles['visit-card']}>
                        <span className={styles['visit-label']}>Visit</span>
                        <div className={styles['info-item']}>
                            <span className={styles['info-label']}>Coordinator Name</span>
                            <span className={styles['info-value']}>{details.name}</span>
                        </div>
                        <div className={styles['info-item']}>
                            <span className={styles['info-label']}>Coordinator Cabin</span>
                            <span className={styles['info-value']}>{details.cabin}</span>
                        </div>
                    </div>
                </div>

                <footer className={styles['popup-footer']}>
                    <button onClick={onClose} className={styles['close-btn']}>Close</button>
                </footer>
            </div>
        </div>
    );
};

export default BlockedPopup;
