import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import OfferLetterBanner from './OfferLetterBanner';
import useBannerQueueSlot from '../../hooks/useBannerQueueSlot';
import {
  fetchUnreadOfferNotifications,
  markOfferNotificationsAsRead
} from '../../services/offerLetterNotificationService';

const POLL_INTERVAL_MS = 5000;

const normalizeText = (value) =>
  (value ?? '')
    .toString()
    .trim();

const extractStudentIdentifier = () => {
  try {
    const full = JSON.parse(localStorage.getItem('completeStudentData') || 'null');
    const fromFull = full?.student?._id || full?.student?.id;
    if (fromFull) return fromFull;

    const basic = JSON.parse(localStorage.getItem('studentData') || 'null');
    return basic?._id || basic?.id || basic?.regNo || basic?.registerNo || null;
  } catch (error) {
    return null;
  }
};

const GlobalOfferLetterNotificationChecker = () => {
  const [studentIdentifier, setStudentIdentifier] = useState(null);
  const [current, setCurrent] = useState(null);
  const queueRef = useRef([]);
  const showingRef = useRef(false);
  const closingRef = useRef(false);
  const pollingRef = useRef(null);

  const queueSlotId = useMemo(() => {
    if (!current) return null;
    return `offer-letter-notification:${current.id || `${current.companyName || ''}:${current.jobRole || ''}:${current.offerSentAt || ''}`}`;
  }, [current]);

  const canDisplayBanner = useBannerQueueSlot(queueSlotId, Boolean(current));

  useEffect(() => {
    setStudentIdentifier(extractStudentIdentifier());
  }, []);

  const poll = useCallback(async () => {
    if (!studentIdentifier || showingRef.current || closingRef.current) return;

    try {
      const notifications = await fetchUnreadOfferNotifications(studentIdentifier);
      if (!Array.isArray(notifications) || notifications.length === 0) return;

      queueRef.current = notifications;
      showingRef.current = true;
      setCurrent(notifications[0]);
    } catch (error) {
      console.error('Offer notification poll error:', error);
    }
  }, [studentIdentifier]);

  useEffect(() => {
    if (!studentIdentifier) return;

    const timer = setTimeout(poll, 700);
    pollingRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      clearTimeout(timer);
      clearInterval(pollingRef.current);
    };
  }, [studentIdentifier, poll]);

  const handleClose = useCallback(async () => {
    if (!current || !studentIdentifier || closingRef.current) return;
    closingRef.current = true;

    try {
      await markOfferNotificationsAsRead(studentIdentifier, [current.id]);
    } catch (error) {
      console.error('Offer notification mark-read error:', error);
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
  }, [current, studentIdentifier]);

  if (!current || !canDisplayBanner) return null;

  return (
    <OfferLetterBanner
      companyName={normalizeText(current.companyName)}
      jobRole={normalizeText(current.jobRole)}
      packageName={normalizeText(current.packageName)}
      onClose={handleClose}
    />
  );
};

export default GlobalOfferLetterNotificationChecker;
