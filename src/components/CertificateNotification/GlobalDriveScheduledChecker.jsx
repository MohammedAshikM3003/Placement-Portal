import React, { useEffect, useState, useCallback, useRef } from 'react';
import mongoDBService from '../../services/mongoDBService.jsx';
import DriveScheduledBanner from './DriveScheduledBanner';

const POLL_INTERVAL_MS = 5000;
const DRIVE_SCHEDULED_STORAGE_PREFIX = 'driveScheduledSeen';

/**
 * GlobalDriveScheduledChecker
 * Mounts once in App.jsx for logged-in students on authenticated routes.
 * Polls the server for newly eligible drives and shows one banner at a time.
 */
const GlobalDriveScheduledChecker = () => {
  const [bannerData, setBannerData] = useState(null);
  const [studentIdentifier, setStudentIdentifier] = useState(null);
  const showingRef = useRef(false);
  const closingRef = useRef(false);
  const pollingRef = useRef(null);
  const queueRef = useRef([]);

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

  // Initial setup - get student ID
  useEffect(() => {
    const id = extractStudentIdentifier();
    setStudentIdentifier(id);
    console.log('🎓 [DriveScheduledChecker] Initialized with student ID:', id);
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

  // Get unique signature for a drive to track if shown
  const getDriveSignature = (drive) => {
    return [
      drive.companyName || '',
      drive.jobRole || '',
      drive.driveStartDate || '',
      drive.driveEndDate || ''
    ]
      .join('::')
      .toLowerCase();
  };

  // Check if drive banner has already been shown
  const isDriveShown = (signature) => {
    const seenKey = `${DRIVE_SCHEDULED_STORAGE_PREFIX}_${studentIdentifier}`;
    const seenDrives = localStorage.getItem(seenKey) || '';
    return seenDrives.includes(signature);
  };

  // Mark drive as shown
  const markDriveAsShown = (signature) => {
    const seenKey = `${DRIVE_SCHEDULED_STORAGE_PREFIX}_${studentIdentifier}`;
    const currentSeen = localStorage.getItem(seenKey) || '';
    const newSeen = currentSeen ? `${currentSeen}|${signature}` : signature;
    localStorage.setItem(seenKey, newSeen);
    console.log(
      '🔔 [DriveScheduledChecker] Drive marked as shown, signature:',
      signature
    );
  };

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

        // Find first unseen drive
        const unseenDrive = drives.find(
          (drive) => !isDriveShown(getDriveSignature(drive))
        );

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
    [fetchEligibleDrives]
  );

  // Show next drive in queue
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
      startDate: drive.driveStartDate || '',
      endDate: drive.driveEndDate || ''
    });
  }, []);

  // Handle banner close
  const handleBannerClose = useCallback(() => {
    if (queueRef.current.length > 0) {
      queueRef.current.shift();
    }
    setBannerData(null);
    showingRef.current = false;
    closingRef.current = false;

    // Show next drive if any in queue
    setTimeout(() => {
      if (queueRef.current.length > 0) {
        showNextDrive();
      }
    }, 100);
  }, [showNextDrive]);

  // Set up polling interval
  useEffect(() => {
    if (!studentIdentifier) return;

    console.log('⏰ [DriveScheduledChecker] Setting up polling interval');

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
  if (!bannerData) return null;

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
