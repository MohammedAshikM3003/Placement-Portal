import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useBannerQueueSlot from '../../hooks/useBannerQueueSlot';
import CoordinatorCertificateUploadBanner from './CoordinatorCertificateUploadBanner';
import {
  fetchUnreadCoordinatorCertificateNotifications,
  markCoordinatorCertificateNotificationsAsRead
} from '../../services/coordinatorCertificateNotificationService';

const POLL_INTERVAL_MS = 5000;

const GlobalCoordinatorCertificateUploadChecker = () => {
  const [current, setCurrent] = useState(null);
  const queueRef = useRef([]);
  const showingRef = useRef(false);
  const closingRef = useRef(false);
  const pollingRef = useRef(null);

  const queueSlotId = useMemo(() => {
    if (!current) return null;
    return `coordinator-certificate-upload:${current.id || `${current.regNo || ''}:${current.createdAt || ''}`}`;
  }, [current]);

  const canDisplayBanner = useBannerQueueSlot(queueSlotId, Boolean(current));

  const poll = useCallback(async () => {
    if (showingRef.current || closingRef.current) return;

    try {
      const notifications = await fetchUnreadCoordinatorCertificateNotifications();
      if (!Array.isArray(notifications) || notifications.length === 0) return;

      queueRef.current = notifications;
      showingRef.current = true;
      setCurrent(notifications[0]);
    } catch (error) {
      console.error('Coordinator certificate upload poll error:', error);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(poll, 700);
    pollingRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      clearTimeout(timer);
      clearInterval(pollingRef.current);
    };
  }, [poll]);

  const handleClose = useCallback(async () => {
    if (!current || closingRef.current) return;
    closingRef.current = true;

    try {
      await markCoordinatorCertificateNotificationsAsRead([current.id]);
    } catch (error) {
      console.error('Coordinator certificate upload mark-read error:', error);
    }

    const remaining = queueRef.current.filter((item) => item.id !== current.id);
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
  }, [current]);

  if (!current || !canDisplayBanner) return null;

  return (
    <CoordinatorCertificateUploadBanner
      regNo={current.regNo}
      studentName={current.studentName}
      competition={current.competition}
      prize={current.prize}
      onClose={handleClose}
    />
  );
};

export default GlobalCoordinatorCertificateUploadChecker;
