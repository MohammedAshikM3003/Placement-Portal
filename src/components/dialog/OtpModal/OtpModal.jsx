import React, { useState, useEffect, useRef } from 'react';
import styles from './OtpModal.module.css';
import { API_BASE_URL } from '../../../utils/apiConfig';

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
    onVerifySuccess,
    name = '',
    onAttemptsExceeded
}) {
    const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
    const [errorMsg, setErrorMsg] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isRegisteringStage, setIsRegisteringStage] = useState(false);
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
    }, [isOpen, email, name]);

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
            let response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, purpose, role, name })
            }).catch(() => null);

            if (!response || !response.ok) {
                response = await fetch(`${API_BASE_URL}/auth/otp/send`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, purpose, role, name })
                });
            }

            const result = await response.json();
            if (!response.ok || !result.success) {
                const detailedError = result.details ? `${result.error} (${result.details})` : (result.error || 'Failed to dispatch verification code');
                throw new Error(detailedError);
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
            let response = await fetch('/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otpString, purpose, role })
            }).catch(() => null);

            if (!response || !response.ok) {
                response = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, otp: otpString, purpose, role })
                });
            }

            const result = await response.json();
            if (!response.ok || !result.success) {
                const errMsg = result.error || 'Invalid verification code.';
                if (errMsg.includes('Attempts exceeded') || errMsg.includes('Too many verification attempts')) {
                    if (onAttemptsExceeded) {
                        onAttemptsExceeded();
                    }
                }
                throw new Error(errMsg);
            }

            if (onVerifySuccess) {
                setIsRegisteringStage(true);
                await onVerifySuccess();
            }
        } catch (err) {
            setErrorMsg(err.message || 'OTP verification failed.');
        } finally {
            setIsVerifying(false);
            setIsRegisteringStage(false);
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
        <div className={styles.overlay}>
            <div
                className={styles.container}
                style={{ '--role-primary': roleColors[role] }}
            >
                {/* Colored Header */}
                <div className={styles.header}>OTP Verification</div>

                <form onSubmit={handleVerify}>
                    <div className={styles.body}>
                        {/* Security Icon - Animated Green Circle & Lock Icon */}
                        <div className={styles.successIconWrapper}>
                            <svg className={styles.successIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                <circle className={styles.successIconCircle} cx="26" cy="26" r="25" fill="none" />
                            </svg>
                            <div className={styles.lockIconOverlay}>
                                <svg className={styles.lockIconAnimated} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                    <path d="M0 0h24v24H0z" fill="none" />
                                    <path fill="currentColor" d="M12 17a2 2 0 0 1-2-2c0-1.11.89-2 2-2a2 2 0 0 1 2 2a2 2 0 0 1-2 2m6 3V10H6v10zm0-12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10c0-1.11.89-2 2-2h1V6a5 5 0 0 1 5-5a5 5 0 0 1 5 5v2zm-6-5a3 3 0 0 0-3 3v2h6V6a3 3 0 0 0-3-3" />
                                </svg>
                            </div>
                        </div>

                        <h2 className={styles.title}>Verify Your Email</h2>
                        <p className={styles.message}>
                            We sent a 6-digit verification code to <br />
                            <span className={styles.email}>{maskedEmail || email}</span>
                        </p>

                        {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}

                        {/* Inputs */}
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
                                    {isRegisteringStage ? 'Registering...' : 'Verifying...'}
                                </>
                            ) : (
                                'Verify'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default OtpModal;
