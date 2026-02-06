import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * GLOBAL DEBUGGER:
 * If you see '🚀 FILE LOADED' but no '🎭 MOUNTED' log, 
 * the problem is in the PARENT component (it's not rendering this component).
 */
console.log('🚀 BlockedPopup.jsx file has been LOADED by the browser');

const BlockedPopup = ({ coordinator, onClose }) => {
    useEffect(() => {
        // This confirms the component has actually entered the DOM
        console.log('✅ 🎭 BlockedPopup MOUNTED into Portal successfully');
        console.log('📦 Props received:', coordinator);
        
        // Safety check for document.body
        if (!document.body) {
            console.error('❌ ERROR: document.body is not available!');
            return;
        }

        const originalStyle = window.getComputedStyle(document.body).overflow;
        document.body.style.overflow = 'hidden';
        
        return () => {
            console.log('🧹 🎭 BlockedPopup UNMOUNTED');
            document.body.style.overflow = originalStyle;
        };
    }, [coordinator]);
    
    const details = {
        name: coordinator?.blockedBy || coordinator?.name || 'Placement Office',
        cabin: coordinator?.cabin || 'N/A',
        message: coordinator?.message || 'Your account has been temporarily blocked. Please contact the placement office to restore access.',
    };

    const styles = {
        overlay: {
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999999,
            padding: '20px',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
        },
        container: {
            background: 'white',
            borderRadius: '24px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden',
            fontFamily: "system-ui, -apple-system, sans-serif",
            animation: 'popupBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        },
        header: {
            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
            color: 'white',
            padding: '24px',
            textAlign: 'center',
            fontSize: '22px',
            fontWeight: '700',
            letterSpacing: '-0.02em'
        },
        body: {
            padding: '32px 28px',
            textAlign: 'center'
        },
        iconWrapper: {
            width: '80px',
            height: '80px',
            backgroundColor: '#fee2e2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '40px'
        },
        title: {
            fontSize: '24px',
            fontWeight: '800',
            color: '#111827',
            margin: '0 0 12px 0'
        },
        message: {
            fontSize: '15px',
            color: '#4b5563',
            lineHeight: '1.6',
            margin: '0 0 24px 0'
        },
        infoCard: {
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            textAlign: 'left'
        },
        row: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '10px'
        },
        label: {
            color: '#6b7280',
            fontSize: '12px',
            fontWeight: '700',
            textTransform: 'uppercase'
        },
        value: {
            color: '#111827',
            fontSize: '14px',
            fontWeight: '600'
        },
        button: {
            background: '#111827',
            color: 'white',
            border: 'none',
            padding: '16px',
            borderRadius: '12px',
            width: '100%',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'transform 0.2s, background 0.2s'
        }
    };

    // If for some reason we have no body yet, don't try to portal
    if (typeof document === 'undefined' || !document.body) return null;

    return createPortal(
        <div style={styles.overlay} onClick={onClose} id="blocked-popup-overlay">
            <style>
                {`
                    @keyframes popupBounce {
                        from { opacity: 0; transform: scale(0.95) translateY(10px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                `}
            </style>
            
            <div style={styles.container} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>Access Restricted</div>

                <div style={styles.body}>
                    <div style={styles.iconWrapper}>🚫</div>
                    <h3 style={styles.title}>Account Blocked</h3>
                    <p style={styles.message}>{details.message}</p>

                    <div style={styles.infoCard}>
                        <div style={styles.row}>
                            <span style={styles.label}>Authority</span>
                            <span style={styles.value}>{details.name}</span>
                        </div>
                        <div style={{...styles.row, marginBottom: 0}}>
                            <span style={styles.label}>Location</span>
                            <span style={styles.value}>{details.cabin}</span>
                        </div>
                    </div>

                    <button 
                        style={styles.button} 
                        onClick={onClose}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#000'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#111827'}
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