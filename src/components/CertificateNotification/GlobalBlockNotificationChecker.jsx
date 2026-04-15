import React, { useCallback, useEffect, useRef, useState } from 'react';
import { fetchUnreadBlockNotifications, markBlockNotificationsAsRead } from '../../services/blockNotificationService.jsx';
import BlockStatusBanner from './BlockStatusBanner';

const POLL_INTERVAL_MS = 5000;

const normalizeText = (value) => (value ?? '').toString().trim();
const normalizeRole = (value) => normalizeText(value).toLowerCase();

const getAdminContext = () => {
  try {
    const primary = JSON.parse(localStorage.getItem('adminData') || 'null');
    const cached = JSON.parse(localStorage.getItem('adminProfileCache') || 'null');
    const source = primary || cached || {};
    return {
      role: 'admin',
      identifier: 'admin',
      department: '',
      displayName: `${source?.firstName || ''} ${source?.lastName || ''}`.trim() || source?.fullName || localStorage.getItem('adminLoginID') || 'Admin'
    };
  } catch (error) {
    console.error('❌ [BlockChecker] Failed to resolve admin context:', error);
    return { role: 'admin', identifier: 'admin', department: '', displayName: 'Admin' };
  }
};

const getCoordinatorContext = () => {
  try {
    const source = JSON.parse(localStorage.getItem('coordinatorData') || 'null') || {};
    const department = source?.department || source?.branch || source?.dept || '';
    return {
      role: 'coordinator',
      identifier: normalizeText(department).toUpperCase(),
      department: normalizeText(department).toUpperCase(),
      displayName: `${source?.firstName || ''} ${source?.lastName || ''}`.trim() || source?.fullName || source?.username || localStorage.getItem('coordinatorUsername') || 'Coordinator'
    };
  } catch (error) {
    console.error('❌ [BlockChecker] Failed to resolve coordinator context:', error);
    return { role: 'coordinator', identifier: '', department: '', displayName: 'Coordinator' };
  }
};

const getRecipientContext = () => {
  const authRole = normalizeRole(localStorage.getItem('authRole'));
  const hasCoordinatorSession = Boolean(localStorage.getItem('coordinatorToken') || localStorage.getItem('isCoordinatorLoggedIn') === 'true');
  const hasAdminSession = Boolean(localStorage.getItem('adminToken') || localStorage.getItem('isLoggedIn') === 'true');

  if (authRole === 'admin') {
    const adminContext = getAdminContext();
    if (adminContext.identifier) return adminContext;
  }

  if (authRole === 'coordinator') {
    const coordinatorContext = getCoordinatorContext();
    if (coordinatorContext.identifier) return coordinatorContext;
  }

  if (hasCoordinatorSession) {
    const coordinatorContext = getCoordinatorContext();
    if (coordinatorContext.identifier) return coordinatorContext;
  }

  if (hasAdminSession) {
    const adminContext = getAdminContext();
    if (adminContext.identifier) return adminContext;
  }

  const adminContext = getAdminContext();
  const coordinatorContext = getCoordinatorContext();
  if (coordinatorContext.identifier) return coordinatorContext;

  if (adminContext.identifier) return adminContext;

  return null;
};

const GlobalBlockNotificationChecker = () => {
  const [currentNotification, setCurrentNotification] = useState(null);
  const [recipientContext, setRecipientContext] = useState(null);
  const showingRef = useRef(false);
  const closingRef = useRef(false);
  const pollingRef = useRef(null);
  const queueRef = useRef([]);

  const showNotification = useCallback((notification) => {
    if (!notification) return;
    queueRef.current = [notification];
    closingRef.current = false;
    showingRef.current = true;
    setCurrentNotification(notification);
  }, []);

  const resolveRecipient = useCallback(() => {
    setRecipientContext(getRecipientContext());
  }, []);

  useEffect(() => {
    resolveRecipient();

    const handleContextRefresh = () => resolveRecipient();
    window.addEventListener('storage', handleContextRefresh);
    window.addEventListener('profileUpdated', handleContextRefresh);
    window.addEventListener('studentDataUpdated', handleContextRefresh);
    window.addEventListener('blockNotificationsUpdated', handleContextRefresh);

    return () => {
      window.removeEventListener('storage', handleContextRefresh);
      window.removeEventListener('profileUpdated', handleContextRefresh);
      window.removeEventListener('studentDataUpdated', handleContextRefresh);
      window.removeEventListener('blockNotificationsUpdated', handleContextRefresh);
    };
  }, [resolveRecipient]);

  const pollNotifications = useCallback(async () => {
    if (!recipientContext?.role || !recipientContext?.identifier || showingRef.current || closingRef.current) return;

    try {
      const notifications = await fetchUnreadBlockNotifications({
        role: recipientContext.role,
        identifier: recipientContext.identifier,
        department: recipientContext.department
      });

      if (!Array.isArray(notifications) || notifications.length === 0) return;

      queueRef.current = notifications;
      showingRef.current = true;
      setCurrentNotification(notifications[0]);
    } catch (error) {
      console.error('❌ [BlockChecker] Poll failed:', error);
    }
  }, [recipientContext]);

  useEffect(() => {
    if (!recipientContext?.identifier) return;

    const timeout = setTimeout(pollNotifications, 700);
    pollingRef.current = setInterval(pollNotifications, POLL_INTERVAL_MS);

    window.__blockNotificationCheckerDebug = {
      recipientContext,
      forcePoll: pollNotifications,
      showBlockedTest: () => showNotification({
        id: `test-blocked-${Date.now()}`,
        actionType: 'blocked',
        studentName: 'Test Student',
        regNo: 'TEST-001',
        branch: recipientContext.department || 'CSE',
        year: 'III',
        semester: 'V',
        isTest: true
      }),
      showUnblockedTest: () => showNotification({
        id: `test-unblocked-${Date.now()}`,
        actionType: 'unblocked',
        studentName: 'Test Student',
        regNo: 'TEST-001',
        branch: recipientContext.department || 'CSE',
        year: 'III',
        semester: 'V',
        isTest: true
      }),
      clearQueue: () => {
        queueRef.current = [];
      }
    };

    return () => {
      clearTimeout(timeout);
      clearInterval(pollingRef.current);
      if (window.__blockNotificationCheckerDebug?.recipientContext?.identifier === recipientContext.identifier) {
        delete window.__blockNotificationCheckerDebug;
      }
    };
  }, [recipientContext, pollNotifications, showNotification]);

  const handleClose = useCallback(async () => {
    if (!currentNotification || closingRef.current || !recipientContext) return;
    closingRef.current = true;

    try {
      if (!currentNotification.isTest) {
        await markBlockNotificationsAsRead({
          role: recipientContext.role,
          identifier: recipientContext.identifier,
          department: recipientContext.department,
          notificationIds: [currentNotification.id]
        });
      }
    } catch (error) {
      console.error('❌ [BlockChecker] Failed to mark notification as read:', error);
    }

    const remaining = queueRef.current.filter((notification) => notification.id !== currentNotification.id);
    queueRef.current = remaining;

    if (remaining.length > 0) {
      setTimeout(() => {
        setCurrentNotification(remaining[0]);
        closingRef.current = false;
      }, 200);
    } else {
      setCurrentNotification(null);
      showingRef.current = false;
      closingRef.current = false;
    }
  }, [currentNotification, recipientContext]);

  if (!currentNotification) return null;

  return (
    <BlockStatusBanner
      actionType={currentNotification.actionType}
      regNo={currentNotification.regNo || currentNotification.studentRegNo}
      studentName={currentNotification.studentName || currentNotification.name}
      branch={currentNotification.branch || currentNotification.department}
      year={currentNotification.year || currentNotification.currentYear}
      semester={currentNotification.semester || currentNotification.currentSemester}
      onClose={handleClose}
    />
  );
};

export default GlobalBlockNotificationChecker;
