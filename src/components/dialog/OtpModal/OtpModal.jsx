import React, { useState, useEffect, useRef } from 'react';
import styles from './OtpModal.module.css';

/**
 * Reusable, role-aware OTP Verification Modal.
 * Adapts visual colors dynamically.
 * 
 * Props:
 *   isOpen           {boolean}   Visibility flag
 *   onClose          {function}  Cancel action callback
 *   role             {string}    'student' | 'coordinator' | 'admin'
 *   email            {string}    Destination email address
 *   purpose          {string}    OTP purpose (e.g. 'EMAIL_VERIFICATION')
 *   onVerifySuccess  {function}  Called when OTP verifies successfully
 */
function OtpModal({
    isOpen,
    onClose,
    role = 'student',
    email = '',
    purpose = 'EMAIL_VERIFICATION',
    onVerifySuccess
}) {
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    const [errorMsg, setErrorMsg] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [expiryTime, setExpiryTime] = useState(300); // 5 minutes in seconds
    const [maskedEmail, setMaskedEmail] = useState('');

    const inputRefs = [
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null)
    ];

    const roleColors = {
        student: '#2085F6',
        coordinator: '#D23B42',
        admin: '#4EA24E'
    };

    // 1. Initial send on open
    useEffect(() => {
        if (isOpen && email) {
            setOtpValues(['', '', '', '', '', '']);
            setErrorMsg('');
            setExpiryTime(300);
            sendOtp();
        }
    }, [isOpen, email]);

    // 2. Expiry and Cooldown intervals
    useEffect(() => {
        let timer = null;
        if (isOpen && expiryTime > 0) {
            timer = setInterval(() => {
                setExpiryTime(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isOpen, expiryTime]);

    useEffect(() => {
        let timer = null;
        if (isOpen && cooldown > 0) {
            timer = setInterval(() => {
                setCooldown(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isOpen, cooldown]);

    if (!isOpen) return null;

    // Send OTP API call
    const sendOtp = async () => {
        setIsSending(true);
        setErrorMsg('');
        try {
            const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiBaseUrl}/api/auth/otp/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, purpose, role })
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to dispatch verification code');
            }

            setMaskedEmail(result.maskedEmail || email);
            setCooldown(60); // 60s resend cooldown
            setExpiryTime(300); // Reset expiry to 5 mins
        } catch (err) {
            setErrorMsg(err.message || 'Error sending verification code.');
        } finally {
            setIsSending(false);
        }
    };

    // Verify OTP API call
    const handleVerify = async (e) => {
        if (e) e.preventDefault();
        const otpString = otpValues.join('');
        if (otpString.length !== 6) {
            setErrorMsg('Please enter a valid 6-digit code.');
            return;
        }

        setIsVerifying(true);
        setErrorMsg('');
        try {
            const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const response = await fetch(`${apiBaseUrl}/api/auth/otp/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otpString, purpose, role })
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Invalid verification code.');
            }

            if (onVerifySuccess) {
                onVerifySuccess();
            }
        } catch (err) {
            setErrorMsg(err.message || 'OTP verification failed.');
        } finally {
            setIsVerifying(false);
        }
    };

    // Focus first input automatically on modal display
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (otpValues[index] === '') {
                // Focus previous input if current is empty
                if (index > 0) {
                    inputRefs[index - 1].current.focus();
                }
            } else {
                // Clear current input
                const newOtp = [...otpValues];
                newOtp[index] = '';
                setOtpValues(newOtp);
            }
            e.preventDefault();
        }
    };

    const handleInputChange = (index, value) => {
        // Only allow numbers
        const cleanVal = value.replace(/\D/g, '').substring(0, 1);
        const newOtp = [...otpValues];
        newOtp[index] = cleanVal;
        setOtpValues(newOtp);

        // Move to next box if digit typed
        if (cleanVal !== '' && index < 5) {
            inputRefs[index + 1].current.focus();
        }
    };

    // Paste handler
    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();
        if (/^\d{6}$/.test(pastedData)) {
            const digits = pastedData.split('');
            setOtpValues(digits);
            inputRefs[5].current.focus();
        }
    };

    // Formats MM:SS
    const formatTime = (secs) => {
        const mins = Math.floor(secs / 60);
        const remaining = secs % 60;
        return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
    };

    const isVerifyDisabled = otpValues.some(v => v === '') || isVerifying || expiryTime === 0;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div 
                className={styles.container} 
                onClick={e => e.stopPropagation()}
                style={{ '--role-primary': roleColors[role] }}
            >
                {/* Colored Header */}
                <div className={styles.header}>OTP Verification</div>

                <div className={styles.body}>
                    {/* Security Icon */}
                    <div className={styles.iconContainer}>
                        <svg 
                            className={styles.icon} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                    </div>

                    <h2 className={styles.title}>Verify Your Email</h2>
                    <p className={styles.message}>
                        We sent a 6-digit verification code to <br />
                        <span className={styles.email}>{maskedEmail || email}</span>
                    </p>

                    {errorMsg && <div className={styles.errorBox}>⚠️ {errorMsg}</div>}

                    {/* Inputs */}
                    <form onSubmit={handleVerify}>
                        <div className={styles.inputGrid}>
                            {otpValues.map((value, idx) => (
                                <input
                                    key={idx}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    ref={inputRefs[idx]}
                                    value={value}
                                    onChange={e => handleInputChange(idx, e.target.value)}
                                    onKeyDown={e => handleKeyDown(idx, e)}
                                    onPaste={idx === 0 ? handlePaste : undefined}
                                    disabled={isVerifying || expiryTime === 0}
                                    className={`${styles.otpInput} ${expiryTime === 0 ? styles.otpInputDisabled : ''}`}
                                    autoFocus={idx === 0}
                                />
                            ))}
                        </div>

                        {/* Timer/Resend */}
                        <div className={styles.statusText}>
                            {expiryTime > 0 ? (
                                <span>OTP expires in: <strong>{formatTime(expiryTime)}</strong></span>
                            ) : (
                                <span style={{ color: '#b91c1c', fontWeight: 600 }}>Verification code has expired!</span>
                            )}
                            
                            <span>&bull;</span>
                            
                            {cooldown > 0 ? (
                                <span style={{ color: '#94a3b8' }}>Resend in {cooldown}s</span>
                            ) : (
                                <button 
                                    type="button" 
                                    onClick={sendOtp} 
                                    disabled={isSending}
                                    className={styles.resendBtn}
                                >
                                    {isSending ? 'Sending...' : 'Resend OTP'}
                                </button>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className={styles.footer}>
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className={`${styles.btn} ${styles.cancelBtn}`}
                                disabled={isVerifying}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className={`${styles.btn} ${styles.verifyBtn}`}
                                disabled={isVerifyDisabled}
                            >
                                {isVerifying ? (
                                    <>
                                        <div className={styles.spinner} />
                                        Verifying...
                                    </>
                                ) : (
                                    'Verify Code'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default OtpModal;
