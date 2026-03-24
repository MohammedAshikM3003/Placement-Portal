import React, { useEffect, useState, useCallback, useRef } from 'react';
import { fetchUnreadNotifications, markNotificationsAsRead } from '../../services/certificateNotificationService';
import CertificateStatusBanner from './CertificateStatusBanner';

const POLL_INTERVAL_MS = 2000; // Poll every 2 seconds for faster notifications

/**
 * GlobalNotificationChecker
 * Mounts once in App.jsx for logged-in students on authenticated routes.
 * Polls the server for certificate approval/rejection notifications
 * and shows one banner at a time, marking each as read before moving on.
 */
const GlobalNotificationChecker = () => {
    const [current, setCurrent] = useState(null);
    const [studentIdentifier, setStudentIdentifier] = useState(null);
    const showingRef            = useRef(false);   // true while any banner is visible
    const closingRef            = useRef(false);   // true while mark-as-read is in flight
    const pollingRef            = useRef(null);
    const queueRef              = useRef([]);       // mutable queue to avoid stale closures

    // ── 1. Resolve student identifier once on mount ─────────────────────
    // Prefer studentId (MongoDB _id) since it's always present in certificates.
    // Fall back to regNo if _id is not available.
    useEffect(() => {
        try {
            const full = localStorage.getItem('completeStudentData');
            if (full) {
                const p = JSON.parse(full);
                console.log('🔔 [NotifChecker] completeStudentData found, _id:', p?.student?._id, 'regNo:', p?.student?.regNo);
                if (p?.student?._id) { setStudentIdentifier(p.student._id); return; }
                if (p?.student?.regNo) { setStudentIdentifier(p.student.regNo); return; }
            }
            const basic = localStorage.getItem('studentData');
            if (basic) {
                const p = JSON.parse(basic);
                console.log('🔔 [NotifChecker] studentData found, _id:', p?._id, 'regNo:', p?.regNo);
                if (p?._id) { setStudentIdentifier(p._id); return; }
                if (p?.regNo) { setStudentIdentifier(p.regNo); return; }
            }
            console.warn('🔔 [NotifChecker] No student identifier found in localStorage!');
        } catch (e) { console.error('🔔 [NotifChecker] Error resolving identifier:', e); }
    }, []);

    // ── 2. Poll server for unread notifications ───────────────────────────────
    const poll = useCallback(async () => {
        // Skip if banner is open or mark-as-read is in flight
        if (!studentIdentifier || showingRef.current || closingRef.current) return;

        console.log('🔔 [NotifChecker] Polling for:', studentIdentifier);
        try {
            const notifications = await fetchUnreadNotifications(studentIdentifier);
            console.log('🔔 [NotifChecker] Poll result:', notifications.length, 'notifications');

            if (notifications.length > 0) {
                console.log('🔔 Unread notifications:', notifications.length);
                queueRef.current = notifications;
                showingRef.current = true;
                setCurrent(notifications[0]);
            }
        } catch (err) {
            console.error('❌ Poll error:', err);
        }
    }, [studentIdentifier]);

    useEffect(() => {
        if (!studentIdentifier) return;

        // Immediate first check (with minimal delay for page to settle)
        const timeout = setTimeout(poll, 500);

        // Periodic polling
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
            // Mark this certificate as read on the server
            await markNotificationsAsRead(studentIdentifier, [current.id]);
        } catch (err) {
            console.error('❌ Failed to mark as read:', err);
        }

        // Remove from local queue
        const remaining = queueRef.current.filter(n => n.id !== current.id);
        queueRef.current = remaining;

        if (remaining.length > 0) {
            // Show next banner after short delay
            setTimeout(() => {
                setCurrent(remaining[0]);
                closingRef.current = false;
            }, 200);
        } else {
            // All done — resume polling
            setCurrent(null);
            showingRef.current = false;
            closingRef.current = false;
        }
    }, [current, studentIdentifier]);

    // ── 4. Render ─────────────────────────────────────────────────────────────
    if (!current) return null;

    return (
        <CertificateStatusBanner
            status={current.status}
            certificateName={current.certificateName}
            onClose={handleClose}
        />
    );
};

export default GlobalNotificationChecker;
