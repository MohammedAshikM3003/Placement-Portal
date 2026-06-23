import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import mongoDBService from '../../services/mongoDBService.jsx';
import CoordinatorDriveScheduledBanner from './CoordinatorDriveScheduledBanner';
import useBannerQueueSlot from '../../hooks/useBannerQueueSlot';

const POLL_INTERVAL_MS = 5000;

// Helper to read coordinator session info
const readStoredCoordinatorData = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('coordinatorData');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
};

const resolveCoordinatorDepartment = (data) => {
  if (!data) return null;
  const deptValue =
    data.department ||
    data.branch ||
    data.dept ||
    data.departmentName ||
    data.coordinatorDepartment ||
    data.assignedDepartment;
  return deptValue ? deptValue.toString().toUpperCase() : null;
};

const GlobalCoordinatorDriveScheduledChecker = () => {
  const [bannerData, setBannerData] = useState(null);
  const [coordinatorId, setCoordinatorId] = useState(null);
  const [coordinatorBranch, setCoordinatorBranch] = useState(null);
  
  const showingRef = useRef(false);
  const closingRef = useRef(false);
  const pollingRef = useRef(null);
  const queueRef = useRef([]);

  const queueSlotId = useMemo(() => {
    if (!bannerData) return null;
    return `coordinator-drive-scheduled-notification:${bannerData.companyName || ''}:${bannerData.jobRole || ''}:${bannerData.startDate || ''}`;
  }, [bannerData]);
  
  const canDisplayBanner = useBannerQueueSlot(queueSlotId, Boolean(bannerData));

  // Initialize coordinator context
  useEffect(() => {
    const coordData = readStoredCoordinatorData();
    const id = coordData?.coordinatorId || coordData?.username || localStorage.getItem('coordinatorUsername') || 'default_co';
    const branch = resolveCoordinatorDepartment(coordData);
    
    console.log('🔍 [GlobalCoordinatorDriveScheduledChecker] Initialized context:', { id, branch, coordData });
    setCoordinatorId(id);
    setCoordinatorBranch(branch);
  }, []);

  const matchesCoordinatorBranch = useCallback((drive, coordinatorBranch) => {
    if (!coordinatorBranch) return false;
    
    const normalizedCoord = coordinatorBranch.toString().trim().toUpperCase();
    
    const getAbbreviation = (name) => {
      const cleaned = name.replace(/\bAND\b|\bOF\b|\bIN\b|\bFOR\b/gi, '');
      const initials = cleaned.split(/\s+/).filter(Boolean).map(w => w[0]).join('');
      return initials.toUpperCase();
    };

    const coordAbbrev = getAbbreviation(normalizedCoord);

    let driveBranches = [];
    if (Array.isArray(drive.eligibleBranches)) {
      driveBranches = drive.eligibleBranches;
    } else {
      const rawBranch = drive.eligibleBranches || drive.branch || drive.department || '';
      driveBranches = rawBranch.toString().split(',');
    }
    
    return driveBranches.some(b => {
      const dbBranch = b.toString().trim().toUpperCase();
      const dbAbbrev = getAbbreviation(dbBranch);
      
      if (dbBranch === normalizedCoord) return true;
      if (dbAbbrev && coordAbbrev && dbAbbrev === coordAbbrev) return true;
      if (coordAbbrev && dbBranch === coordAbbrev) return true;
      if (dbAbbrev && dbAbbrev === normalizedCoord) return true;
      if (dbBranch.includes(normalizedCoord) || normalizedCoord.includes(dbBranch)) return true;
      
      return false;
    });
  }, []);

  const getDriveSignature = useCallback((drive) => {
    return [
      drive.driveId || drive.id || drive._id || '',
      drive.companyName || drive.company || '',
      drive.jobRole || '',
      drive.startingDate || drive.driveStartDate || drive.companyDriveDate || '',
      drive.endingDate || drive.driveEndDate || ''
    ].join('::').toLowerCase().trim();
  }, []);

  const showNextDrive = useCallback(() => {
    if (queueRef.current.length === 0 || showingRef.current) {
      return;
    }

    const drive = queueRef.current[0];
    showingRef.current = true;

    setBannerData({
      companyName: drive.companyName || drive.company || '',
      jobRole: drive.jobRole || drive.role || '',
      startDate: drive.startingDate || drive.driveStartDate || drive.companyDriveDate || '',
      endDate: drive.endDate || drive.endingDate || drive.driveEndDate || ''
    });
  }, []);

  const handleBannerClose = useCallback(() => {
    if (queueRef.current.length > 0) {
      queueRef.current.shift();
    }
    setBannerData(null);
    showingRef.current = false;
    closingRef.current = false;

    setTimeout(() => {
      if (queueRef.current.length > 0) {
        showNextDrive();
      }
    }, 100);
  }, [showNextDrive]);

  // Poll for newly scheduled drives
  const pollDrives = useCallback(async () => {
    if (!coordinatorId || !coordinatorBranch || showingRef.current || closingRef.current) return;

    try {
      const data = await mongoDBService.getCompanyDrives();
      const drives = Array.isArray(data) ? data : [];
      
      const eligibleDrives = drives.filter(drive => matchesCoordinatorBranch(drive, coordinatorBranch));

      const seenKey = `seenCoordinatorDrives_${coordinatorId}`;
      const initializedKey = `hasEstablishedBaselineCoordinator_${coordinatorId}`;
      const hasBaseline = localStorage.getItem(initializedKey) === 'true';

      let seenSignatures = [];
      try {
        seenSignatures = JSON.parse(localStorage.getItem(seenKey) || '[]');
      } catch (e) {
        seenSignatures = [];
      }

      // If baseline has not been established, populate seen list and set flag to true
      if (!hasBaseline) {
        const signatures = eligibleDrives.map(drive => getDriveSignature(drive));
        localStorage.setItem(seenKey, JSON.stringify(signatures));
        localStorage.setItem(initializedKey, 'true');
        console.log('🔍 [GlobalCoordinatorDriveScheduledChecker] Baseline established. Init seen signatures:', signatures);
        return;
      }

      // Find any new unseen drive
      const unseenDrive = eligibleDrives.find(drive => {
        const sig = getDriveSignature(drive);
        return !seenSignatures.includes(sig);
      });

      if (unseenDrive && !showingRef.current) {
        const signature = getDriveSignature(unseenDrive);
        console.log('🎉 [GlobalCoordinatorDriveScheduledChecker] New unseen drive scheduled:', unseenDrive.companyName);
        
        // Mark as seen immediately
        seenSignatures.push(signature);
        localStorage.setItem(seenKey, JSON.stringify(seenSignatures));

        // Queue and show the banner
        queueRef.current.push(unseenDrive);
        if (!showingRef.current) {
          showNextDrive();
        }
      }
    } catch (error) {
      console.error('❌ [GlobalCoordinatorDriveScheduledChecker] Polling error:', error);
    }
  }, [coordinatorId, coordinatorBranch, matchesCoordinatorBranch, getDriveSignature, showNextDrive]);

  // Start polling
  useEffect(() => {
    if (!coordinatorId || !coordinatorBranch) return;

    pollDrives();
    pollingRef.current = setInterval(pollDrives, POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [coordinatorId, coordinatorBranch, pollDrives]);

  if (!bannerData || !canDisplayBanner) return null;

  return (
    <CoordinatorDriveScheduledBanner
      companyName={bannerData.companyName}
      jobRole={bannerData.jobRole}
      startDate={bannerData.startDate}
      endDate={bannerData.endDate}
      onClose={handleBannerClose}
    />
  );
};

export default GlobalCoordinatorDriveScheduledChecker;
