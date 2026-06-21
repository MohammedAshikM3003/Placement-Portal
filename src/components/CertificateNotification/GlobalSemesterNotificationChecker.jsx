import React, { useEffect, useState, useCallback, useRef } from 'react';
import { fetchUnreadSemesterNotifications, markSemesterNotificationsAsRead } from '../../services/semesterNotificationService';
import styles from './CertificateStatusBanner.module.css';
import useBannerQueueSlot from '../../hooks/useBannerQueueSlot';

const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds for faster notifications

const GlobalSemesterNotificationChecker = () => {
    const [current, setCurrent] = useState(null);
    const [studentIdentifier, setStudentIdentifier] = useState(null);
    const showingRef            = useRef(false);   // true while any banner is visible
    const closingRef            = useRef(false);   // true while mark-as-read is in flight
    const pollingRef            = useRef(null);
    const queueRef              = useRef([]);       // mutable queue to avoid stale closures
    const queueSlotId = current?.id ? `semester-notification:${current.id}` : null;
    const canDisplayBanner = useBannerQueueSlot(queueSlotId, Boolean(current));

    // ── 1. Resolve student identifier once on mount ─────────────────────
    useEffect(() => {
        try {
            const full = localStorage.getItem('completeStudentData');
            if (full) {
                const p = JSON.parse(full);
                if (p?.student?._id) { setStudentIdentifier(p.student._id); return; }
                if (p?.student?.regNo) { setStudentIdentifier(p.student.regNo); return; }
            }
            const basic = localStorage.getItem('studentData');
            if (basic) {
                const p = JSON.parse(basic);
                if (p?._id) { setStudentIdentifier(p._id); return; }
                if (p?.regNo) { setStudentIdentifier(p.regNo); return; }
            }
        } catch (e) { console.error('🔔 [SemesterNotifChecker] Error resolving identifier:', e); }
    }, []);

    // ── 2. Poll server for unread notifications ───────────────────────────────
    const poll = useCallback(async () => {
        if (!studentIdentifier || showingRef.current || closingRef.current) return;

        try {
            const notifications = await fetchUnreadSemesterNotifications(studentIdentifier);
            if (notifications.length > 0) {
                queueRef.current = notifications;
                showingRef.current = true;
                setCurrent(notifications[0]);
            }
        } catch (err) {
            console.error('❌ Semester Poll error:', err);
        }
    }, [studentIdentifier]);

    useEffect(() => {
        if (!studentIdentifier) return;

        const timeout = setTimeout(poll, 500);
        pollingRef.current = setInterval(poll, POLL_INTERVAL_MS);

        return () => {
            clearTimeout(timeout);
            clearInterval(pollingRef.current);
        };
    }, [studentIdentifier, poll]);

    // ── 3. Handle banner close ────────────────────────────────────────────────
    const handleClose = useCallback(async () => {
        if (!current || closingRef.current) return;
        closingRef.current = true;

        try {
            await markSemesterNotificationsAsRead(studentIdentifier, [current.id]);
        } catch (err) {
            console.error('❌ Failed to mark semester notif as read:', err);
        }

        const remaining = queueRef.current.filter(n => n.id !== current.id);
        queueRef.current = remaining;

        if (remaining.length > 0) {
            setTimeout(() => {
                setCurrent(remaining[0]);
                closingRef.current = false;
            }, 200);
        } else {
            setCurrent(null);
            showingRef.current = false;
            closingRef.current = false;
        }
    }, [current, studentIdentifier]);

    const [isBannerVisible, setIsBannerVisible] = useState(true);

    useEffect(() => {
        if (current) {
            setIsBannerVisible(true);
            const timer = setTimeout(() => {
                setIsBannerVisible(false);
                setTimeout(handleClose, 400); // exit animation
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [current, handleClose]);

    const triggerManualClose = () => {
        setIsBannerVisible(false);
        setTimeout(handleClose, 400);
    };

    if (!current || !canDisplayBanner) return null;

    return (
        <div className={`${styles.bannerContainer} ${!isBannerVisible ? styles.slideOut : ''}`}>
          <div className={`${styles.banner} ${styles.semesterResult}`}>
            <div className={styles.iconWrapper}>
              <svg
                className={styles.statusIcon}
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path d="M0 0h24v24H0z" fill="none" />
                <path fill="currentColor" d="M6.25 2A2.25 2.25 0 0 0 4 4.25v15.5A2.25 2.25 0 0 0 6.25 22h11.5A2.25 2.25 0 0 0 20 19.75V4.25A2.25 2.25 0 0 0 17.75 2zM5.5 4.25a.75.75 0 0 1 .75-.75h11.5a.75.75 0 0 1 .75.75v15.5a.75.75 0 0 1-.75.75H6.25a.75.75 0 0 1-.75-.75zM7.75 6.5a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5zM7 16.25a.75.75 0 0 1 .75-.75h8.5a.75.75 0 0 1 0 1.5h-8.5a.75.75 0 0 1-.75-.75M7.75 11a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5z" />
              </svg>
            </div>
            <div className={styles.content}>
              <p className={styles.header}>
                {current.message || 'Result Published'}
              </p>
              <p className={styles.certificateName}>
                {current.subtitle || `${current.year || 'I'} - ${current.semester || 1}`}
              </p>
            </div>
            <button className={styles.closeButton} onClick={triggerManualClose} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6l12 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
    );
};

export default GlobalSemesterNotificationChecker;
