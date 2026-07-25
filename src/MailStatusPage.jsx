import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './MailStatusPage.module.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://placement-portal-zxo2.onrender.com/api';

export default function MailStatusPage() {
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [testEmail, setTestEmail] = useState('');
    const [sendingTest, setSendingTest] = useState(false);
    const [testLog, setTestLog] = useState('');

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        try {
            const baseUrlClean = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
            const res = await fetch(`${baseUrlClean}/health/mail-status`);
            const data = await res.json();
            setStatusData(data);
        } catch (err) {
            console.error('[MailStatusPage Error]:', err);
            setStatusData({
                success: false,
                mailConnected: false,
                status: 'NETWORK_ERROR',
                message: `Failed to connect to backend server: ${err.message}`,
                config: {
                    portalUrl: window.location.origin,
                    environment: 'unknown'
                }
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const handleSendTestEmail = async (e) => {
        e.preventDefault();
        if (!testEmail || !testEmail.includes('@')) {
            setTestLog('Please enter a valid email address.');
            return;
        }

        setSendingTest(true);
        setTestLog('Initiating test email dispatch via Vercel Serverless Function...');
        try {
            let res = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: testEmail, purpose: 'testing', role: 'student', name: 'Diagnostic Test User' })
            }).catch(() => null);

            if (!res || !res.ok) {
                const baseUrlClean = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
                res = await fetch(`${baseUrlClean}/health/test-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ targetEmail: testEmail })
                });
            }

            const data = await res.json();
            if (res.ok && data.success) {
                setTestLog(`✅ SUCCESS: ${data.message}\nRecipient: ${data.maskedEmail || testEmail}`);
            } else {
                setTestLog(`❌ DISPATCH FAILED: ${data.error || data.message}\nDetails: ${data.details || 'Check server logs.'}`);
            }
        } catch (err) {
            setTestLog(`❌ CONNECTION ERROR: ${err.message}`);
        } finally {
            setSendingTest(false);
        }
    };

    const isConnected = statusData?.mailConnected && statusData?.success;

    return (
        <div className={styles.container}>
            <div className={styles.contentWrapper}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <h1>Mail System Status</h1>
                        {loading ? (
                            <span className={`${styles.badge} ${styles.badgeWarning}`}>Testing...</span>
                        ) : isConnected ? (
                            <span className={`${styles.badge} ${styles.badgeSuccess}`}>System Online</span>
                        ) : (
                            <span className={`${styles.badge} ${styles.badgeError}`}>Issue Detected</span>
                        )}
                    </div>
                    <Link to="/" className={styles.backBtn}>
                        ← Back to Portal Home
                    </Link>
                </div>

                {/* Main Hero Card */}
                <div className={styles.statusHeroCard}>
                    <div className={styles.statusHeroHeader}>
                        <div className={`${styles.statusIconIcon} ${isConnected ? styles.iconSuccess : styles.iconError}`}>
                            {loading ? '⌛' : isConnected ? '✅' : '❌'}
                        </div>
                        <div className={styles.statusHeroText}>
                            <h2>
                                {loading
                                    ? 'Verifying SMTP Transporter...'
                                    : isConnected
                                    ? 'Gmail / SMTP Transport Fully Connected'
                                    : 'Mail Service Connection Issue'}
                            </h2>
                            <p>
                                {loading
                                    ? 'Connecting to Render backend and running transporter.verify()...'
                                    : statusData?.message}
                            </p>
                        </div>
                    </div>

                    <div className={styles.actionRow}>
                        <button
                            className={styles.primaryBtn}
                            onClick={fetchStatus}
                            disabled={loading}
                        >
                            {loading ? 'Testing...' : '🔄 Re-Test Connection'}
                        </button>
                    </div>
                </div>

                {/* Detail Grid */}
                <div className={styles.grid}>
                    <div className={styles.card}>
                        <div className={styles.cardLabel}>Render Backend Server</div>
                        <div className={styles.cardValue}>
                            {API_BASE_URL.replace('/api', '')}
                        </div>
                        <div className={styles.cardSubtext}>Node.js API Host</div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardLabel}>Mail Provider & Port</div>
                        <div className={styles.cardValue}>
                            {statusData?.config?.provider || 'gmail'} (Port {statusData?.config?.mailPort || 587} {statusData?.config?.secure ? 'SSL' : 'STARTTLS'})
                        </div>
                        <div className={styles.cardSubtext}>{statusData?.config?.mailHost || 'smtp.gmail.com'}</div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardLabel}>Sender User Account</div>
                        <div className={styles.cardValue}>
                            {statusData?.config?.userConfigured ? (
                                <span style={{ color: '#4ade80' }}>Configured</span>
                            ) : (
                                <span style={{ color: '#f87171' }}>Missing</span>
                            )}
                        </div>
                        <div className={styles.cardSubtext}>
                            {statusData?.senderEmail ? `Account: ${statusData.senderEmail}` : 'process.env.MAIL_USER'}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardLabel}>Google App Password</div>
                        <div className={styles.cardValue}>
                            {statusData?.config?.passwordConfigured ? (
                                <span style={{ color: '#4ade80' }}>Configured (16-char)</span>
                            ) : (
                                <span style={{ color: '#f87171' }}>Missing</span>
                            )}
                        </div>
                        <div className={styles.cardSubtext}>process.env.MAIL_PASSWORD</div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardLabel}>Upstash Redis Queue</div>
                        <div className={styles.cardValue}>
                            {statusData?.config?.redisConfigured ? (
                                <span style={{ color: '#4ade80' }}>Active (BullMQ)</span>
                            ) : (
                                <span style={{ color: '#facc15' }}>Standard Pool</span>
                            )}
                        </div>
                        <div className={styles.cardSubtext}>process.env.REDIS_URL</div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardLabel}>Vercel Portal Link</div>
                        <div className={styles.cardValue}>
                            {statusData?.config?.portalUrl || window.location.origin}
                        </div>
                        <div className={styles.cardSubtext}>process.env.PORTAL_URL</div>
                    </div>
                </div>

                {/* Test Email Dispatch Section */}
                <div className={styles.testMailSection}>
                    <h3>✉️ Send Live Test Email</h3>
                    <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
                        Enter your email address below to dispatch a live verification sample mail from the Render backend.
                    </p>
                    <form onSubmit={handleSendTestEmail} className={styles.inputGroup}>
                        <input
                            type="email"
                            className={styles.emailInput}
                            placeholder="Enter your email (e.g. name@domain.com)"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            className={styles.primaryBtn}
                            disabled={sendingTest}
                        >
                            {sendingTest ? 'Sending Email...' : 'Send Test Mail'}
                        </button>
                    </form>

                    {testLog && (
                        <div className={styles.logBox}>
                            {testLog}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
