import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './BlockedPopup.module.css';

const normalizeVariant = (value) => {
    if (value === 'coordinator') return 'coordinator';
    return 'student';
};

const getRoleBasedMessage = (blockedByRole, fallbackMessage) => {
    const role = (blockedByRole || '').toString().trim().toLowerCase();
    if (role === 'coordinator') {
        return 'Your account has been blocked by the placement coordinator.';
    }
    if (role === 'admin') {
        return 'Your account has been blocked by the placement Admin.';
    }
    return fallbackMessage || 'Your account has been blocked by the placement Admin.';
};

const BlockedPopup = ({ coordinator, blockedInfo, onClose, variant = 'student' }) => {
    const popupVariant = normalizeVariant(variant);
    const source = blockedInfo || coordinator || {};

    useEffect(() => {
        if (typeof document === 'undefined' || !document.body) return undefined;

        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalStyle;
        };
    }, []);

    const details = {
        authority: source?.blockedBy || source?.name || 'Placement Office',
        cabin: source?.cabin || source?.blockedByCabin || 'N/A',
        message: getRoleBasedMessage(source?.blockedByRole, source?.message)
    };

    if (typeof document === 'undefined' || !document.body) return null;

    return createPortal(
        <div className={styles['popup-overlay']} onClick={onClose} id="blocked-popup-overlay">
            <div className={styles['popup-container']} onClick={(event) => event.stopPropagation()}>
                <div
                    className={`${styles['popup-header']} ${
                        popupVariant === 'coordinator' ? styles['coordinator-header'] : styles['student-header']
                    }`}
                >
                    Restricted
                </div>

                <div className={styles['popup-body']}>
                    <div className={styles['block-icon']}>
                        <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <circle cx="36" cy="36" r="24" stroke="#D23B42" strokeWidth="6" fill="none" strokeLinecap="round" />
                            <line x1="22" y1="22" x2="50" y2="50" stroke="#D23B42" strokeWidth="6" strokeLinecap="round" />
                        </svg>
                    </div>

                    <h3 className={styles['blocked-title']}>Account Blocked</h3>
                    <p className={styles['blocked-message']}>{details.message}</p>

                    <div className={styles['visit-card']}>
                        <div className={styles['info-item']}>
                            <span className={styles['info-label']}>Authority</span>
                            <span className={styles['info-value']}>{details.authority}</span>
                        </div>
                        <div className={styles['info-item']}>
                            <span className={styles['info-label']}>Cabin</span>
                            <span className={styles['info-value']}>{details.cabin}</span>
                        </div>
                    </div>
                </div>

                <div className={styles['popup-footer']}>
                    <button
                        type="button"
                        className={`${styles['close-btn']} ${
                            popupVariant === 'coordinator' ? styles['coordinator-btn'] : styles['student-btn']
                        }`}
                        onClick={onClose}
                    >
                        I Understand
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default BlockedPopup;