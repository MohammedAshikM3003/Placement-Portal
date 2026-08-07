import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import styles from './MailStatusPage.module.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://placement-portal-zxo2.onrender.com/api';

const WORKFLOW_CATEGORIES = [
    {
        title: '🔑 Authentication & Security',
        key: 'auth',
        items: [
            { name: 'Student Registration OTP', recipient: 'Student Domain Email (@ksrce.ac.in)' },
            { name: 'Coordinator Creation OTP', recipient: 'Coordinator Domain Email (@ksrce.ac.in)' },
            { name: 'Admin Profile Transfer OTP', recipient: 'New Admin Domain Email (@ksrce.ac.in)' }
        ]
    },
    {
        title: '🎓 Student Notifications',
        key: 'student',
        items: [
            { name: 'Student Welcome Email', recipient: 'Student Domain Email (@ksrce.ac.in)' },
            { name: 'Certificate Approved', recipient: 'Student Domain Email (@ksrce.ac.in)' },
            { name: 'Certificate Rejected', recipient: 'Student Domain Email (@ksrce.ac.in)' },
            { name: 'Training Preference Selection Open', recipient: 'Eligible Students (@ksrce.ac.in)' },
            { name: 'Training Scheduled', recipient: 'Assigned Student Cohort' },
            { name: 'Training Attendance Report', recipient: 'Individual Student' },
            { name: 'Shortlisted for Drive', recipient: 'Shortlisted Students' },
            { name: 'Round Passed', recipient: 'Student Domain Email (@ksrce.ac.in)' },
            { name: 'Round Rejected', recipient: 'Student Domain Email (@ksrce.ac.in)' },
            { name: 'Final Selected Placement', recipient: 'Placed Student Domain Email' },
            { name: 'Offer Letter Issued', recipient: 'Student Domain Email (@ksrce.ac.in)' }
        ]
    },
    {
        title: '👔 Coordinator Notifications',
        key: 'coordinator',
        items: [
            { name: 'Coordinator Welcome Email', recipient: 'Coordinator Domain Email' },
            { name: 'Coordinator Blocked', recipient: 'Coordinator Domain Email' },
            { name: 'Coordinator Unblocked', recipient: 'Coordinator Domain Email' },
            { name: 'Company Drive Attendance Summary', recipient: 'Branch Coordinator (Strict Branch Match)' },
            { name: 'Company Drive Round Summary', recipient: 'Branch Coordinator (Strict Branch Match)' },
            { name: 'Student Offer Decision Response', recipient: 'Branch Coordinator (Strict Branch Match)' }
        ]
    },
    {
        title: '🛡️ Admin Notifications',
        key: 'admin',
        items: [
            { name: 'Admin Profile Transfer OTP', recipient: 'New Admin Domain Email' },
            { name: 'Student Blocked by Coordinator', recipient: 'Admin Domain Email' },
            { name: 'Student Unblocked by Coordinator', recipient: 'Admin Domain Email' },
            { name: 'Company Drive & Training Summaries', recipient: 'Admin Domain Email' },
            { name: 'Student Offer Decision Response', recipient: 'Admin Domain Email' }
        ]
    },
    {
        title: '🔄 Cross-Role Operations',
        key: 'crossRole',
        items: [
            { name: 'Student Blocked by Admin', recipient: 'Student & Branch Coordinator Only' },
            { name: 'Student Unblocked by Admin', recipient: 'Student & Branch Coordinator Only' }
        ]
    }
];

export default function MailStatusPage() {
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [testEmail, setTestEmail] = useState('');
    const [sendingTest, setSendingTest] = useState(false);
    const [testLog, setTestLog] = useState('');
    const [mailEnabled, setMailEnabled] = useState(() => {
        return localStorage.getItem('placement_portal_mail_service_enabled') !== 'false';
    });
    const [expandedCategories, setExpandedCategories] = useState({
        auth: true,
        student: true,
        coordinator: true,
        admin: true,
        crossRole: true
    });

    const toggleCategory = (key) => {
        setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        try {
            const baseUrlClean = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
            const res = await fetch(`${baseUrlClean}/health/mail-status`);
            const data = await res.json();
            setStatusData(data);
            if (typeof data?.config?.mailServiceEnabled === 'boolean') {
                setMailEnabled(data.config.mailServiceEnabled);
                localStorage.setItem('placement_portal_mail_service_enabled', data.config.mailServiceEnabled ? 'true' : 'false');
            }
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

    const handleToggleMailService = async (newState) => {
        setMailEnabled(newState);
        localStorage.setItem('placement_portal_mail_service_enabled', newState ? 'true' : 'false');
        setTestLog(newState ? '⚡ Mail Service ENABLED project-wide.' : '🚫 Mail Service DISABLED project-wide. All 27 email workflows are bypassed.');

        try {
            const baseUrlClean = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
            await fetch(`${baseUrlClean}/toggle-mail-service`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled: newState })
            });
        } catch (err) {
            console.error('[Toggle Mail Service Error]:', err);
        }
    };

    const handleSendTestEmail = async (e) => {
        e.preventDefault();
        if (!mailEnabled) {
            setTestLog('ℹ️ Mail Service is currently OFF. Please click "Enable Email Delivery" above to send live test emails.');
            return;
        }

        if (!testEmail || !testEmail.includes('@')) {
            setTestLog('Please enter a valid email address.');
            return;
        }

        setSendingTest(true);
        setTestLog('Initiating test email dispatch via backend server...');
        try {
            const baseUrlClean = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
            const res = await fetch(`${baseUrlClean}/health/test-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetEmail: testEmail })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                if (data.disabled) {
                    setTestLog(`ℹ️ ${data.message}`);
                } else {
                    setTestLog(`✅ SUCCESS: ${data.message}\nRecipient: ${data.maskedEmail || testEmail}`);
                }
            } else {
                setTestLog(`❌ DISPATCH FAILED: ${data.error || data.message}\nDetails: ${data.details || data.code || 'Check server logs.'}`);
            }
        } catch (err) {
            setTestLog(`❌ CONNECTION ERROR: ${err.message}`);
        } finally {
            setSendingTest(false);
        }
    };

    const isConnected = statusData?.mailConnected && statusData?.success;
    const totalWorkflows = WORKFLOW_CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0);

    return (
        <div className={styles.container}>
            <div className={styles.contentWrapper}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerTitle}>
                        <h1>Email Delivery Status</h1>
                        {!mailEnabled ? (
                            <span className={`${styles.badge} ${styles.badgeError}`}>🔴 ALL 27 WORKFLOWS DISABLED</span>
                        ) : loading ? (
                            <span className={`${styles.badge} ${styles.badgeWarning}`}>Testing...</span>
                        ) : isConnected ? (
                            <span className={`${styles.badge} ${styles.badgeSuccess}`}>🟢 27 WORKFLOWS ACTIVE</span>
                        ) : (
                            <span className={`${styles.badge} ${styles.badgeError}`}>Issue Detected</span>
                        )}
                    </div>
                    <Link to="/" className={styles.backBtn}>
                        ← Back to Portal Home
                    </Link>
                </div>

                {/* Main Master Switch Hero Card */}
                <div className={`${styles.statusHeroCard} ${!mailEnabled ? styles.disabledHeroCard : ''}`}>
                    <div className={styles.statusHeroHeader}>
                        <div className={`${styles.statusIconIcon} ${mailEnabled && isConnected ? styles.iconSuccess : styles.iconError}`}>
                            {!mailEnabled ? '🔴' : loading ? '⌛' : isConnected ? '🟢' : '❌'}
                        </div>
                        <div className={styles.statusHeroText}>
                            <h2>
                                Centralized Email Service: {mailEnabled ? '🟢 ENABLED' : '🔴 DISABLED'}
                            </h2>
                            <p>
                                {!mailEnabled
                                    ? 'Master Toggle OFF — All 27 project-wide email dispatches and verification OTP modals are bypassed.'
                                    : loading
                                    ? 'Checking Brevo REST API / SMTP Transporter health...'
                                    : statusData?.message || 'Mail service is active. All 27 production email workflows are governed by this switch.'}
                            </p>
                        </div>
                    </div>

                    <div className={styles.actionRow}>
                        <button
                            className={`${styles.toggleMailBtn} ${mailEnabled ? styles.btnDisable : styles.btnEnable}`}
                            onClick={() => handleToggleMailService(!mailEnabled)}
                        >
                            {mailEnabled ? '🚫 Disable Email Delivery' : '⚡ Enable Email Delivery'}
                        </button>
                        <button
                            className={styles.primaryBtn}
                            onClick={fetchStatus}
                            disabled={loading || !mailEnabled}
                        >
                            {loading ? 'Testing...' : '🔄 Re-Test Connection'}
                        </button>
                    </div>
                </div>

                {/* 27 Active Workflows Categorized Dashboard */}
                <div className={styles.workflowsSection}>
                    <div className={styles.workflowsHeader}>
                        <h3>All {totalWorkflows} Production Mail Workflows</h3>
                        <span style={{ fontSize: '0.85rem', color: mailEnabled ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                            {mailEnabled ? '🟢 Governed by Global Toggle (ACTIVE)' : '🔴 Governed by Global Toggle (BYPASSED)'}
                        </span>
                    </div>

                    {WORKFLOW_CATEGORIES.map((category) => (
                        <div key={category.key} className={styles.categoryGroup}>
                            <div className={styles.categoryHeader} onClick={() => toggleCategory(category.key)}>
                                <div className={styles.categoryTitle}>
                                    <span>{category.title}</span>
                                    <span className={styles.countBadge}>{category.items.length} Workflows</span>
                                </div>
                                <span style={{ color: '#94a3b8' }}>{expandedCategories[category.key] ? '▲' : '▼'}</span>
                            </div>

                            {expandedCategories[category.key] && (
                                <div className={styles.workflowList}>
                                    {category.items.map((item, idx) => (
                                        <div key={idx} className={styles.workflowCard}>
                                            <div className={styles.workflowInfo}>
                                                <span className={styles.workflowName}>{item.name}</span>
                                                <span className={styles.workflowRecipient}>{item.recipient}</span>
                                            </div>
                                            <span className={`${styles.workflowStatus} ${mailEnabled ? styles.statusActive : styles.statusDisabled}`}>
                                                {mailEnabled ? '✓ Active' : '✕ Disabled'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Technical Configuration Detail Grid */}
                <div className={styles.grid}>
                    <div className={styles.card}>
                        <div className={styles.cardLabel}>Backend Host</div>
                        <div className={styles.cardValue}>
                            {API_BASE_URL.replace('/api', '')}
                        </div>
                        <div className={styles.cardSubtext}>Node.js Express Server</div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardLabel}>Mail Provider</div>
                        <div className={styles.cardValue}>
                            {statusData?.config?.provider?.toUpperCase() || 'BREVO'} (REST API Port 443)
                        </div>
                        <div className={styles.cardSubtext}>api.brevo.com/v3/smtp/email</div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardLabel}>Sender Email Account</div>
                        <div className={styles.cardValue}>
                            <span style={{ color: '#4ade80' }}>Configured</span>
                        </div>
                        <div className={styles.cardSubtext}>
                            {statusData?.senderEmail || 'placementportalksrce@gmail.com'}
                        </div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardLabel}>Brevo API Key</div>
                        <div className={styles.cardValue}>
                            {statusData?.config?.brevoConfigured || statusData?.config?.passwordConfigured || statusData?.config?.userConfigured ? (
                                <span style={{ color: '#4ade80' }}>Configured (REST Key)</span>
                            ) : (
                                <span style={{ color: '#f87171' }}>Missing</span>
                            )}
                        </div>
                        <div className={styles.cardSubtext}>process.env.BREVO_API_KEY</div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardLabel}>System Settings Store</div>
                        <div className={styles.cardValue}>
                            <span style={{ color: '#4ade80' }}>MongoDB Persistent</span>
                        </div>
                        <div className={styles.cardSubtext}>SystemSetting Collection</div>
                    </div>

                    <div className={styles.card}>
                        <div className={styles.cardLabel}>Portal Link</div>
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
                        Enter your email address below to dispatch a live verification sample mail from the backend.
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
                            disabled={sendingTest || !mailEnabled}
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
