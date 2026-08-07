import React from 'react';
import '../alerts/AlertStyles.css';

const CertificateRejectedPopup = ({ certificateName, onClose }) => {
    if (!certificateName) return null;

    return (
        <div className="alert-overlay">
            <div className="achievement-popup-container">
                <div className="achievement-popup-header">
                    Rejected !
                </div>
                <div className="achievement-popup-body">
                    <svg className="achievement-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className="achievement-error-icon--circle" cx="26" cy="26" r="25" fill="none" />
                        <path className="achievement-error-icon--cross" fill="none" d="M16 16l20 20M36 16L16 36" />
                    </svg>
                    <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: '24px', color: '#333', fontWeight: '600' }}>
                        Certificate Rejected ✗
                    </h2>
                    <p style={{ margin: '0 0 0.75rem 0', color: '#888', fontSize: '16px', lineHeight: 1.5 }}>
                        Your certificate has been reviewed and<br />rejected by the coordinator.
                    </p>
                    <div style={{
                        background: '#fef2f2',
                        border: '1.5px solid #D23B42',
                        borderRadius: '10px',
                        padding: '12px 20px',
                        width: '100%',
                        maxWidth: '300px'
                    }}>
                        <div style={{ color: '#D23B42', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                            Certificate Name
                        </div>
                        <div style={{ color: '#111827', fontSize: '16px', fontWeight: '700', wordBreak: 'break-word' }}>
                            {certificateName}
                        </div>
                    </div>
                </div>
                <div className="achievement-popup-footer">
                    <button onClick={onClose} className="achievement-popup-close-btn">
                        I Understand
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CertificateRejectedPopup;
