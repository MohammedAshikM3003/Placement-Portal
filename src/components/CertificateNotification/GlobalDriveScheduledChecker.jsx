import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import mongoDBService from '../../services/mongoDBService.jsx';
import DriveScheduledBanner from './DriveScheduledBanner';
import useBannerQueueSlot from '../../hooks/useBannerQueueSlot';

const POLL_INTERVAL_MS = 5000;
const DRIVE_SCHEDULED_STORAGE_PREFIX = 'driveScheduledSeen';
const DRIVE_SCHEDULED_BASELINE_PREFIX = 'driveScheduledBaseline';

const normalizeText = (value) =>
  (value ?? '')
    .toString()
    .trim()
    .toLowerCase();

const normalizeStudentId = (value) =>
  (value ?? '')
    .toString()
    .trim();

/**
 * GlobalDriveScheduledChecker
 * Mounts once in App.jsx for logged-in students on authenticated routes.
 * Polls the server for newly eligible drives and shows one banner at a time.
 */
const GlobalDriveScheduledChecker = () => {
  const [bannerData, setBannerData] = useState(null);
  const [studentIdentifier, setStudentIdentifier] = useState(null);
  const [resolvedStudentId, setResolvedStudentId] = useState(null);
  const [resolvedRegNo, setResolvedRegNo] = useState(null);
  const showingRef = useRef(false);
  const closingRef = useRef(false);
  const pollingRef = useRef(null);
  const queueRef = useRef([]);
  const queueSlotId = useMemo(() => {
    if (!bannerData) return null;
    return `drive-scheduled-notification:${bannerData.companyName || ''}:${bannerData.jobRole || ''}:${bannerData.startDate || ''}`;
  }, [bannerData]);
  const canDisplayBanner = useBannerQueueSlot(queueSlotId, Boolean(bannerData));

  // Extract student ID from localStorage
  const extractStudentIdentifier = useCallback(() => {
    try {
      const full = JSON.parse(localStorage.getItem('completeStudentData') || 'null');
      const fromFull = full?.student?._id || full?.student?.id;
      if (fromFull) return fromFull;

      const basic = JSON.parse(localStorage.getItem('studentData') || 'null');
      return basic?._id || basic?.id || null;
    } catch (error) {
      console.error('❌ [DriveScheduledChecker] Failed to resolve student identifier:', error);
      return null;
    }
  }, []);

  // Initial setup - get student ID and resolve both ID and RegNo
  useEffect(() => {
    const id = extractStudentIdentifier();
    setStudentIdentifier(id);
    console.log('🎓 [DriveScheduledChecker] Initialized with student ID:', id);

    try {
      const full = JSON.parse(localStorage.getItem('completeStudentData') || 'null');
      const regNo = full?.student?.regNo || full?.student?.registerNo;
      if (regNo) setResolvedRegNo(regNo);
      if (full?.student?._id) setResolvedStudentId(full.student._id);
      if (full?.student?.id) setResolvedStudentId(full.student.id);

      if (!full) {
        const basic = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (basic?.regNo) setResolvedRegNo(basic.regNo);
        if (basic?.registerNo) setResolvedRegNo(basic.registerNo);
        if (basic?._id) setResolvedStudentId(basic._id);
        if (basic?.id) setResolvedStudentId(basic.id);
      }
    } catch (error) {
      console.error('❌ [DriveScheduledChecker] Error resolving student ID/regNo:', error);
    }
  }, [extractStudentIdentifier]);

  // Fetch eligible drives for the student
  const fetchEligibleDrives = useCallback(
    async (studentId) => {
      if (!studentId) return [];
      try {
        const response = await mongoDBService.getEligibleStudentsForStudent(studentId);
        return response?.drives || [];
      } catch (error) {
        console.error('❌ [DriveScheduledChecker] Error fetching eligible drives:', error);
        return [];
      }
    },
    []
  );

  const getSeenStorageKeys = useCallback((extraStudentId = null) => {
    const keys = [];
    const candidates = [resolvedStudentId, resolvedRegNo, studentIdentifier, extraStudentId]
      .map((value) => normalizeStudentId(value))
      .filter(Boolean);

    candidates.forEach((value) => {
      const key = `${DRIVE_SCHEDULED_STORAGE_PREFIX}_${value}`;
      if (!keys.includes(key)) {
        keys.push(key);
      }
    });

    return keys;
  }, [resolvedStudentId, resolvedRegNo, studentIdentifier]);

  const readSeenSignatures = useCallback((storageKey) => {
    const rawValue = localStorage.getItem(storageKey);
    if (!rawValue) return [];

    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) {
        return parsed.map((value) => normalizeText(value)).filter(Boolean);
      }
    } catch (error) {
      // Backward compatibility for legacy pipe-delimited format.
    }

    return rawValue
      .split('|')
      .map((value) => normalizeText(value))
      .filter(Boolean);
  }, []);

  const writeSeenSignatures = useCallback((storageKey, signatures) => {
    localStorage.setItem(storageKey, JSON.stringify(signatures));
  }, []);

  const getBaselineStorageKeys = useCallback((extraStudentId = null) => {
    const keys = [];
    const candidates = [resolvedStudentId, resolvedRegNo, studentIdentifier, extraStudentId]
      .map((value) => normalizeStudentId(value))
      .filter(Boolean);

    candidates.forEach((value) => {
      const key = `${DRIVE_SCHEDULED_BASELINE_PREFIX}_${value}`;
      if (!keys.includes(key)) {
        keys.push(key);
      }
    });

    return keys;
  }, [resolvedStudentId, resolvedRegNo, studentIdentifier]);

  const readBaselineTimestamp = useCallback(() => {
    const keys = getBaselineStorageKeys();
    if (!keys.length) return null;

    const parsedValues = keys
      .map((key) => Number(localStorage.getItem(key) || 0))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (!parsedValues.length) return null;
    return Math.min(...parsedValues);
  }, [getBaselineStorageKeys]);

  const initializeBaselineIfMissing = useCallback(() => {
    const keys = getBaselineStorageKeys();
    if (!keys.length) return;

    const nowTs = Date.now();
    keys.forEach((key) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, String(nowTs));
      }
    });
  }, [getBaselineStorageKeys]);

  const isDriveNewlyAssigned = useCallback((drive) => {
    const baselineTs = readBaselineTimestamp();
    if (!baselineTs) return false;

    const createdTs = new Date(drive?.createdAt || 0).getTime();
    if (!Number.isFinite(createdTs) || createdTs <= 0) return false;

    return createdTs > baselineTs;
  }, [readBaselineTimestamp]);

  // Get unique signature for a drive to track if shown
  const getDriveSignature = useCallback((drive) => {
    return normalizeText([
      drive.driveId || drive.id || '',
      drive.companyName || '',
      drive.jobRole || '',
      drive.driveStartDate || drive.startDate || '',
      drive.driveEndDate || drive.endDate || ''
    ].join('::'));
  }, []);

  // Check if drive banner has already been shown
  const isDriveShown = useCallback((signature, extraStudentId = null) => {
    const normalizedSignature = normalizeText(signature);
    if (!normalizedSignature) return false;

    const keys = getSeenStorageKeys(extraStudentId);
    if (!keys.length) return false;

    return keys.some((storageKey) => readSeenSignatures(storageKey).includes(normalizedSignature));
  }, [getSeenStorageKeys, readSeenSignatures]);

  // Mark drive as shown
  const markDriveAsShown = useCallback((signature, extraStudentId = null) => {
    const normalizedSignature = normalizeText(signature);
    if (!normalizedSignature) return;

    const keys = getSeenStorageKeys(extraStudentId);
    if (!keys.length) return;

    keys.forEach((storageKey) => {
      const currentSeen = readSeenSignatures(storageKey);
      if (currentSeen.includes(normalizedSignature)) return;
      writeSeenSignatures(storageKey, [...currentSeen, normalizedSignature]);
    });
  }, [getSeenStorageKeys, readSeenSignatures, writeSeenSignatures]);

  // Show next drive in queue - MUST be before pollDrives
  const showNextDrive = useCallback(() => {
    if (queueRef.current.length === 0 || showingRef.current) {
      console.log('ℹ️ [DriveScheduledChecker] Queue empty or already showing');
      return;
    }

    const drive = queueRef.current[0];
    showingRef.current = true;

    console.log('📢 [DriveScheduledChecker] Showing drive banner:', drive.companyName);

    setBannerData({
      companyName: drive.companyName || '',
      jobRole: drive.jobRole || drive.jobs || '',
      packageName: drive.package || drive.packageName || '',
      startDate: drive.driveStartDate || drive.startDate || '',
      endDate: drive.driveEndDate || drive.endDate || ''
    });
  }, [setBannerData]);

  // Handle banner close - MUST be before pollDrives to avoid undefined showNextDrive
  const handleBannerClose = useCallback(() => {
    console.log('🔴 [DriveScheduledChecker] Banner closed, queue length:', queueRef.current.length);
    if (queueRef.current.length > 0) {
      const removed = queueRef.current.shift();
      console.log('🗑️ [DriveScheduledChecker] Removed from queue:', removed?.companyName);
    }
    setBannerData(null);
    showingRef.current = false;
    closingRef.current = false;

    // Show next drive if any in queue
    setTimeout(() => {
      if (queueRef.current.length > 0) {
        console.log('▶️ [DriveScheduledChecker] Showing next in queue, length:', queueRef.current.length);
        showNextDrive();
      }
    }, 100);
  }, [showNextDrive]);

  // Poll for new eligible drives
  const pollDrives = useCallback(
    async (studentId) => {
      if (!studentId || showingRef.current || closingRef.current) return;

      try {
        const drives = await fetchEligibleDrives(studentId);

        if (!Array.isArray(drives) || drives.length === 0) {
          console.log('ℹ️ [DriveScheduledChecker] No eligible drives found');
          return;
        }

        // Only show banner for newly assigned eligible drives created after baseline.
        const unseenDrive = drives.find((drive) => {
          if (!isDriveNewlyAssigned(drive)) return false;
          const sig = getDriveSignature(drive);
          return !isDriveShown(sig);
        });

        if (unseenDrive && !showingRef.current) {
          console.log(
            '🎉 [DriveScheduledChecker] New eligible drive found:',
            unseenDrive.companyName
          );

          // Mark as shown IMMEDIATELY to prevent re-polling the same drive
          const signature = getDriveSignature(unseenDrive);
          markDriveAsShown(signature);

          // Queue the drive
          queueRef.current.push(unseenDrive);

          // If not currently showing, show the next one
          if (!showingRef.current) {
            showNextDrive();
          }
        }
      } catch (error) {
        console.error('❌ [DriveScheduledChecker] Polling error:', error);
      }
    },
    [fetchEligibleDrives, isDriveNewlyAssigned, isDriveShown, getDriveSignature, markDriveAsShown, showNextDrive]
  );

  useEffect(() => {
    if (!studentIdentifier) return;
    initializeBaselineIfMissing();
  }, [studentIdentifier, initializeBaselineIfMissing]);

  // Set up polling interval
  useEffect(() => {
    if (!studentIdentifier) {
      return;
    }

    // Fetch immediately
    pollDrives(studentIdentifier);

    // Set interval for continuous polling
    pollingRef.current = setInterval(() => {
      pollDrives(studentIdentifier);
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [studentIdentifier, pollDrives]);

  // Return null if no banner to show
  if (!bannerData || !canDisplayBanner) return null;
  return (
    <DriveScheduledBanner
      companyName={bannerData.companyName}
      jobRole={bannerData.jobRole}
      packageName={bannerData.packageName}
      startDate={bannerData.startDate}
      endDate={bannerData.endDate}
      onClose={handleBannerClose}
    />
  );
};

export default GlobalDriveScheduledChecker;
