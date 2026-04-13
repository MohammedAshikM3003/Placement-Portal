import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Navbar from '../components/Navbar/Navbar.js';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import PopUpPending from './PopUpPending.jsx';
import { getOverallStatus as getPopupOverallStatus } from './PopUpPending.jsx';
import styles from './Company.module.css';
import alertStyles from '../components/alerts/AlertStyles.module.css';

// Fetch eligible students for a student from backend
const getEligibleStudents = async (studentId) => {
  try {
    const response = await import('../services/mongoDBService').then(m => m.default.getEligibleStudentsForStudent(studentId));
    return response?.drives || [];
  } catch (error) {
    console.error('Error fetching eligible students:', error);
    return [];
  }
};

export default function Company({ onLogout, onViewChange }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  const [studentData, setStudentData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('studentData') || 'null');
    } catch (error) {
      return null;
    }
  });
  const [eligibleDrives, setEligibleDrives] = useState([]);
  const [studentApplications, setStudentApplications] = useState([]);
  const [studentAttendanceRecords, setStudentAttendanceRecords] = useState([]);
  const [studentOfferLetter, setStudentOfferLetter] = useState(null);
  const [offerDecision, setOfferDecision] = useState('pending');
  const [isOfferDecisionUpdating, setIsOfferDecisionUpdating] = useState(false);
  const [offerActionInFlight, setOfferActionInFlight] = useState('');
  const [isDownloadingOffer, setIsDownloadingOffer] = useState(false);
  const [offerResponsePopup, setOfferResponsePopup] = useState({
    isOpen: false,
    phase: 'saving',
    decision: 'accepted',
    studentName: '',
    companyName: '',
    jobRole: '',
    packageText: '',
    regNo: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const isFetchingRef = useRef(false);
  const offerDecisionLockRef = useRef(false);
  const lastFetchedStudentIdRef = useRef(null);
  const eligibleDrivesRef = useRef([]);
  const studentApplicationsRef = useRef([]);

  // Custom scrollbar states
  const appListRef = useRef(null);
  const [scrollThumb, setScrollThumb] = useState({ height: 34, top: 0 });
  const [showScrollBar, setShowScrollBar] = useState(false);

  const normalizeText = (value) => (value || '').toString().trim().toLowerCase();
  const getStudentLookupIds = (student) => ({
    studentId: String(student?._id || student?.id || student?.studentId || '').trim(),
    regNo: String(student?.regNo || student?.registerNumber || student?.registerNo || '').trim()
  });
  const normalizeDate = (value) => {
    if (!value) return '';

    // Keep date-only strings untouched to avoid UTC day-shift issues.
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        return trimmed.slice(0, 10);
      }

      // Support dd-MM-YYYY by flipping to YYYY-MM-DD
      const ddmmyyyy = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})/);
      if (ddmmyyyy) {
        const [, dd, mm, yyyy] = ddmmyyyy;
        return `${yyyy}-${mm}-${dd}`;
      }
    }

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) {
      return value.toString().split('T')[0];
    }

    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const findApplicationForDrive = (drive) => {
    const driveId = (drive.driveId || drive._id || '').toString();
    const driveCompany = normalizeText(drive.companyName);
    const driveRole = normalizeText(drive.jobs || drive.jobRole);
    const driveStart = normalizeDate(drive.driveStartDate || drive.companyDriveDate);
    const driveEnd = normalizeDate(drive.driveEndDate || drive.driveStartDate || drive.companyDriveDate);

    const candidates = studentApplications.filter((app) => {
      const appCompany = normalizeText(app?.companyName);
      const appRole = normalizeText(app?.jobRole);
      return appCompany === driveCompany && appRole === driveRole;
    });

    if (candidates.length === 0) return null;

    // 1) Strongest key: explicit driveId match.
    if (driveId) {
      const byDriveId = candidates.find((app) => (app?.driveId || '').toString() === driveId);
      if (byDriveId) return byDriveId;
    }

    // 2) Next key: start date equality between drive and application.
    const byStartDate = candidates.find((app) => {
      const appStart = normalizeDate(app?.startingDate || app?.startDate || app?.nasaDate);
      return Boolean(driveStart && appStart && driveStart === appStart);
    });
    if (byStartDate) return byStartDate;

    // 3) Last fallback: overlap with application start/end window.
    const byWindowOverlap = candidates.find((app) => {
      const appStart = normalizeDate(app?.startingDate || app?.startDate || app?.nasaDate);
      const appEnd = normalizeDate(app?.endingDate || app?.endDate || app?.startingDate || app?.nasaDate);
      if (!appStart || !driveStart) return false;
      return appStart === driveStart ||
             (driveEnd && appStart === driveEnd) ||
             (appEnd && driveStart === appEnd) ||
             (appEnd && driveEnd && appEnd === driveEnd);
    });
    if (byWindowOverlap) return byWindowOverlap;

    // 4) Deterministic final fallback: latest application among same company+role.
    return candidates
      .slice()
      .sort((left, right) => new Date(right?.updatedAt || right?.appliedDate || 0) - new Date(left?.updatedAt || left?.appliedDate || 0))[0] || null;
  };

  const fetchStudentAttendanceRecords = async (student) => {
    const mongoDBService = await import('../services/mongoDBService').then(m => m.default);
    const { studentId, regNo: regNoRaw } = getStudentLookupIds(student);

    const attendanceCalls = [];
    if (regNoRaw) {
      attendanceCalls.push(mongoDBService.getStudentAttendanceByRegNo(regNoRaw).catch(() => null));
      const regNoUpper = regNoRaw.toUpperCase();
      if (regNoUpper !== regNoRaw) {
        attendanceCalls.push(mongoDBService.getStudentAttendanceByRegNo(regNoUpper).catch(() => null));
      }
    }
    if (studentId) {
      attendanceCalls.push(mongoDBService.getStudentAttendance(studentId).catch(() => null));
    }

    const responses = attendanceCalls.length > 0 ? await Promise.all(attendanceCalls) : [];
    const merged = [];
    const seenKeys = new Set();

    responses.forEach((response) => {
      if (!response?.success || !Array.isArray(response?.data)) return;
      response.data.forEach((record) => {
        const dedupeKey = [
          String(record?.driveId || '').trim(),
          normalizeText(record?.companyName),
          normalizeText(record?.jobRole),
          normalizeDate(record?.startDate),
          normalizeDate(record?.endDate),
          normalizeText(record?.status)
        ].join('::');

        if (seenKeys.has(dedupeKey)) return;
        seenKeys.add(dedupeKey);
        merged.push(record);
      });
    });

    return { success: true, data: merged };
  };

  const fetchStudentOfferLetter = async (student) => {
    const mongoDBService = await import('../services/mongoDBService').then(m => m.default);
    const { studentId, regNo: regNoRaw } = getStudentLookupIds(student);
    const driveCompany = String(student?.company || student?.companyName || '').trim();
    const driveRole = String(student?.role || student?.jobRole || '').trim();

    const candidates = [];

    if (regNoRaw) {
      const byRegNo = await mongoDBService.getPlacedStudents({ regNo: regNoRaw }).catch(() => null);
      if (byRegNo?.success && Array.isArray(byRegNo.data)) {
        candidates.push(...byRegNo.data);
      }
    }

    if (studentId) {
      const byStudentId = await mongoDBService.getPlacedStudents({ studentId }).catch(() => null);
      if (byStudentId?.success && Array.isArray(byStudentId.data)) {
        candidates.push(...byStudentId.data);
      }
    }

    if (driveCompany && driveRole) {
      const byDrive = await mongoDBService.getPlacedStudents({ company: driveCompany, role: driveRole }).catch(() => null);
      if (byDrive?.success && Array.isArray(byDrive.data)) {
        candidates.push(...byDrive.data);
      }
    }

    if (!candidates.length) {
      return null;
    }

    const unique = [];
    const seen = new Set();
    candidates.forEach((entry) => {
      const key = [
        String(entry?._id || '').trim(),
        String(entry?.offerGridfsFileId || '').trim(),
        String(entry?.offerGridfsFileUrl || '').trim(),
        String(entry?.regNo || '').trim()
      ].join('::');
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(entry);
      }
    });

    return unique
      .slice()
      .sort((left, right) => {
        const rightTs = new Date(right?.offerSentAt || right?.offerUploadedAt || 0).getTime();
        const leftTs = new Date(left?.offerSentAt || left?.offerUploadedAt || 0).getTime();
        return rightTs - leftTs;
      })[0] || null;
  };

  const resolveOfferLetterUrl = (offerEntry) => {
    if (!offerEntry) return '';

    const directUrl = String(offerEntry?.offerGridfsFileUrl || '').trim();
    const fileId = String(offerEntry?.offerGridfsFileId || '').trim();
    const raw = directUrl || (fileId ? `/api/file/${fileId}` : '');
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;

    const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const origin = apiBase.replace(/\/api\/?$/, '');
    return `${origin}${raw.startsWith('/') ? '' : '/'}${raw}`;
  };

  const isAttendanceAbsentForDrive = (drive) => {
    const driveId = String(drive.driveId || drive._id || '').trim();
    const driveCompany = normalizeText(drive.companyName);
    const driveRole = normalizeText(drive.jobs || drive.jobRole);
    const driveStart = normalizeDate(drive.driveStartDate || drive.companyDriveDate);
    const driveEnd = normalizeDate(drive.driveEndDate || drive.driveStartDate || drive.companyDriveDate);

    const matched = studentAttendanceRecords.some((record) => {
      if (normalizeText(record?.status) !== 'absent') return false;

      const recordDriveId = String(record?.driveId || '').trim();
      if (driveId && recordDriveId) {
        return recordDriveId === driveId;
      }

      if (normalizeText(record?.companyName) !== driveCompany) return false;

      const recordRole = normalizeText(record?.jobRole);
      if (recordRole && driveRole && recordRole !== driveRole) return false;

      const recStart = normalizeDate(record?.startDate);
      const recEnd = normalizeDate(record?.endDate);
      const hasDriveDates = Boolean(driveStart || driveEnd);
      const hasRecordDates = Boolean(recStart || recEnd);

      // If either side lacks dates, accept match.
      if (!hasDriveDates || !hasRecordDates) {
        return true;
      }

      // If both have dates, check basic overlap/equality.
      const datesMatch =
        driveStart === recStart ||
        driveEnd === recEnd ||
        driveStart === recEnd ||
        driveEnd === recStart ||
        (!driveEnd && driveStart && driveStart === recStart) ||
        (!recEnd && recStart && recStart === driveStart);

      return datesMatch;
    });

    return matched;
  };

  // Custom scrollbar logic
  const updateScrollThumb = useCallback(() => {
    const el = appListRef.current;
    if (!el) {
      setShowScrollBar(false);
      return;
    }
    const canScroll = el.scrollHeight > el.clientHeight;
    setShowScrollBar(canScroll);
    if (!canScroll) return;

    const ratio = el.clientHeight / el.scrollHeight;
    const thumbHeight = Math.max(30, el.clientHeight * ratio);
    const maxScrollTop = el.scrollHeight - el.clientHeight;
    const maxThumbTop = el.clientHeight - thumbHeight;
    const thumbTop = maxScrollTop > 0 ? (el.scrollTop / maxScrollTop) * maxThumbTop : 0;

    setScrollThumb({ height: thumbHeight, top: thumbTop });
  }, []);

  const onScrollThumbMouseDown = (e) => {
    e.preventDefault();
    const startY = e.clientY || (e.touches && e.touches[0].clientY);
    const startTop = scrollThumb.top;
    const el = appListRef.current;
    if (!el) return;

    const thumbHeight = scrollThumb.height;
    const maxThumbTop = el.clientHeight - thumbHeight;
    const maxScrollTop = el.scrollHeight - el.clientHeight;

    const onMove = (mv) => {
      const clientY = mv.clientY || (mv.touches && mv.touches[0].clientY);
      const nextTop = Math.max(0, Math.min(maxThumbTop, startTop + clientY - startY));
      el.scrollTop = maxThumbTop > 0 ? (nextTop / maxThumbTop) * maxScrollTop : 0;
      updateScrollThumb();
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
  };

  useEffect(() => {
    updateScrollThumb();
  }, [eligibleDrives.length, isLoading, updateScrollThumb]);

  useEffect(() => {
    eligibleDrivesRef.current = eligibleDrives;
  }, [eligibleDrives]);

  useEffect(() => {
    studentApplicationsRef.current = studentApplications;
  }, [studentApplications]);

  useEffect(() => {
    const handleScrollResize = () => updateScrollThumb();
    window.addEventListener('resize', handleScrollResize);
    return () => window.removeEventListener('resize', handleScrollResize);
  }, [updateScrollThumb]);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 992);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let isUnmounted = false;

    const fetchCompanyPageData = async ({ force = false } = {}) => {
      if (isFetchingRef.current) {
        return;
      }

      let parsedStudentData = null;
      try {
        parsedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
      } catch (error) {
        console.error('Error parsing student data from localStorage:', error);
      }

      const studentIdentity = getStudentLookupIds(parsedStudentData);
      if (!studentIdentity.studentId && !studentIdentity.regNo) {
        if (!isUnmounted) {
          setIsLoading(false);
        }
        return;
      }

      const studentId = studentIdentity.studentId;
      const hasExistingData = eligibleDrivesRef.current.length > 0 || studentApplicationsRef.current.length > 0;
      const sameStudentAsLastFetch = lastFetchedStudentIdRef.current === studentId;

      if (!force && hasExistingData && sameStudentAsLastFetch) {
        return;
      }

      isFetchingRef.current = true;
      const shouldShowLoading = !hasExistingData || !sameStudentAsLastFetch;

      if (shouldShowLoading && !isUnmounted) {
        setIsLoading(true);
      }

      try {
        if (!isUnmounted) {
          setStudentData(parsedStudentData);
        }

        const [drives, appsResponse, attendanceResponse, offerResponse] = await Promise.all([
          getEligibleStudents(studentId),
          import('../services/mongoDBService').then(m => m.default.getStudentApplications(studentId)),
          fetchStudentAttendanceRecords(parsedStudentData),
          fetchStudentOfferLetter(parsedStudentData)
        ]);

        if (!isUnmounted) {
          setEligibleDrives(drives || []);
          setStudentApplications(appsResponse?.applications || []);
          setStudentAttendanceRecords(attendanceResponse?.data || []);
          setStudentOfferLetter(offerResponse || null);
        }

        lastFetchedStudentIdRef.current = studentId;
      } catch (error) {
        console.error('Error fetching company page data:', error);
      } finally {
        isFetchingRef.current = false;
        if (!isUnmounted) {
          setIsLoading(false);
        }
      }
    };

    const handleProfileUpdate = () => {
      fetchCompanyPageData({ force: true });
    };

    fetchCompanyPageData({ force: false });

    const storedStudentData = (() => {
      try {
        return JSON.parse(localStorage.getItem('studentData') || 'null');
      } catch (error) {
        return null;
      }
    })();

    if (storedStudentData?._id) {
      import('../services/fastDataService.jsx').then(({ default: fastDataService }) => {
        if (isUnmounted) return;
        const instantData = fastDataService.getInstantData(storedStudentData._id);
        if (instantData?.student) {
          setStudentData(instantData.student);
        }
      });
    }

    window.addEventListener('storage', handleProfileUpdate);
    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('allDataPreloaded', handleProfileUpdate);

    const refreshInterval = setInterval(() => fetchCompanyPageData({ force: true }), 30000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchCompanyPageData({ force: true });
      }
    };

    window.addEventListener('focus', handleProfileUpdate);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isUnmounted = true;
      window.removeEventListener('storage', handleProfileUpdate);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('allDataPreloaded', handleProfileUpdate);
      window.removeEventListener('focus', handleProfileUpdate);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(refreshInterval);
    };
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  // Function to determine overall status based on rounds
  const getOverallStatus = (application, drive = null, attendanceAbsent = false) => {
    const popupCompatibleApplication = {
      ...(application || {}),
      totalRounds: Number(drive?.totalRounds || application?.totalRounds || drive?.roundDetails?.length || application?.roundDetails?.length || 0),
      roundDetails: Array.isArray(drive?.roundDetails) && drive.roundDetails.length > 0
        ? drive.roundDetails
        : (application?.roundDetails || []),
      status: attendanceAbsent ? 'Absent' : (application?.status || 'Pending')
    };

    const normalizedStatus = (getPopupOverallStatus(popupCompatibleApplication)?.status || 'Pending').toString();

    if (normalizedStatus === 'Absent') {
      return { status: 'Absent', colorClass: styles.appStatusAbsent, textClass: styles.appStatusTextAbsent };
    }
    if (normalizedStatus === 'Rejected') {
      return { status: 'Rejected', colorClass: styles.appStatusRejected, textClass: styles.appStatusTextRejected };
    }
    if (normalizedStatus === 'Placed') {
      return { status: 'Placed', colorClass: styles.appStatusPlaced, textClass: styles.appStatusTextPlaced };
    }
    if (normalizedStatus.startsWith('Passed-')) {
      return { status: normalizedStatus, colorClass: styles.appStatusBlue, textClass: styles.appStatusTextBlue };
    }

    return { status: 'Pending', colorClass: styles.appStatusPending, textClass: styles.appStatusTextPending };
  };

  const handleViewChange = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
    setIsSidebarOpen(false);
  };

  const totalApplications = eligibleDrives.length;
  const effectiveStatuses = eligibleDrives.map((drive) => {
    const application = findApplicationForDrive(drive);
    const attendanceAbsent = isAttendanceAbsentForDrive(drive);
    return getOverallStatus(application, drive, attendanceAbsent).status;
  });
  const pendingCount = effectiveStatuses.filter((status) => status === 'Pending').length;
  const rejectedCount = effectiveStatuses.filter((status) => status === 'Rejected' || status === 'Absent').length;
  const offerLetterUrl = resolveOfferLetterUrl(studentOfferLetter);
  const offerCompanyName = String(studentOfferLetter?.company || studentOfferLetter?.companyName || 'N/A').trim() || 'N/A';
  const offerJobRole = String(studentOfferLetter?.role || studentOfferLetter?.jobRole || 'N/A').trim() || 'N/A';
  const offerPackage = String(studentOfferLetter?.pkg || studentOfferLetter?.package || 'N/A').trim() || 'N/A';
  const offerPackageDisplay = offerPackage && offerPackage !== 'N/A' && !/\bLPA\b/i.test(offerPackage)
    ? `${offerPackage} LPA`
    : offerPackage;
  const hasSentOfferLetter = Boolean(
    studentOfferLetter &&
    offerLetterUrl
  );

  useEffect(() => {
    if (!studentOfferLetter) {
      setOfferDecision('pending');
      return;
    }
    const normalizedStatus = String(studentOfferLetter?.status || 'Pending').trim().toLowerCase();
    if (normalizedStatus === 'accepted') {
      setOfferDecision('accepted');
      return;
    }
    if (normalizedStatus === 'rejected') {
      setOfferDecision('rejected');
      return;
    }
    setOfferDecision('pending');
  }, [studentOfferLetter]);

  const handleOfferDecisionUpdate = useCallback(async (decision) => {
    if (!studentOfferLetter || isOfferDecisionUpdating || offerDecisionLockRef.current) return false;

    if (offerDecision === 'accepted' && decision === 'rejected') return false;
    if (offerDecision === 'rejected' && decision === 'accepted') return false;

    if (offerDecision === decision) {
      return true;
    }

    const mongoDBService = await import('../services/mongoDBService').then(m => m.default);
    try {
      offerDecisionLockRef.current = true;
      setIsOfferDecisionUpdating(true);
      setOfferActionInFlight(decision);

      setOfferResponsePopup({
        isOpen: true,
        phase: 'saving',
        decision,
        studentName: String(studentData?.name || studentData?.fullName || studentOfferLetter?.name || 'Student').trim(),
        companyName: String(studentOfferLetter?.company || studentOfferLetter?.companyName || 'N/A').trim() || 'N/A',
        jobRole: String(studentOfferLetter?.role || studentOfferLetter?.jobRole || 'N/A').trim() || 'N/A',
        packageText: offerPackageDisplay,
        regNo: String(studentOfferLetter?.regNo || studentData?.regNo || 'N/A').trim() || 'N/A',
        message: 'Submitting your response to admin...'
      });

      await mongoDBService.updatePlacedStudentOfferResponse({
        placedStudentId: studentOfferLetter?._id,
        regNo: studentOfferLetter?.regNo || studentData?.regNo,
        company: studentOfferLetter?.company,
        role: studentOfferLetter?.role,
        studentId: studentOfferLetter?.studentId || studentData?._id || studentData?.id,
        decision
      });

      const statusValue = decision === 'accepted' ? 'Accepted' : 'Rejected';

      setStudentOfferLetter((prev) => (prev ? { ...prev, status: statusValue } : prev));
      setOfferDecision(decision);

      setOfferResponsePopup((prev) => ({
        ...prev,
        phase: 'success',
        message: `Your ${statusValue.toLowerCase()} response has been submitted to admin.`
      }));

      return true;
    } catch (error) {
      console.error(`Failed to ${decision} offer:`, error);

      setOfferResponsePopup((prev) => ({
        ...prev,
        isOpen: true,
        phase: 'failed',
        message: 'Failed to submit your response. Please try again.'
      }));

      return false;
    } finally {
      offerDecisionLockRef.current = false;
      setIsOfferDecisionUpdating(false);
      setOfferActionInFlight('');
    }
  }, [studentOfferLetter, isOfferDecisionUpdating, offerDecision, studentData, offerPackageDisplay]);

  const handleOfferAccept = useCallback(async () => {
    await handleOfferDecisionUpdate('accepted');
  }, [handleOfferDecisionUpdate]);

  const handleOfferReject = useCallback(async () => {
    await handleOfferDecisionUpdate('rejected');
  }, [handleOfferDecisionUpdate]);

  const handleOfferDownload = useCallback(async () => {
    if (!offerLetterUrl || isDownloadingOffer) return;

    try {
      setIsDownloadingOffer(true);
      const response = await fetch(offerLetterUrl);
      if (!response.ok) {
        throw new Error('Failed to download offer letter');
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const suggestedName = String(studentOfferLetter?.offerLetterName || '').trim() || 'Offer-Letter.pdf';
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = suggestedName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Offer letter download failed:', error);
      window.open(offerLetterUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsDownloadingOffer(false);
    }
  }, [offerLetterUrl, isDownloadingOffer, studentOfferLetter]);

  const closeOfferResponsePopup = useCallback(() => {
    setOfferResponsePopup((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const isPopupOpen = offerResponsePopup.isOpen;
  const isAccepted = String(offerResponsePopup.decision || '').toLowerCase() === 'accepted';
  const isSaving = offerResponsePopup.phase === 'saving';
  const isSuccess = offerResponsePopup.phase === 'success';
  const isFailed = offerResponsePopup.phase === 'failed';
  const popupTitle = isSaving ? 'Submitting Response' : (isFailed ? 'Submission Failed' : 'Response Submitted');
  const popupBadge = isAccepted ? 'Accepted' : 'Rejected';
  const popupCompany = String(offerResponsePopup.companyName || 'N/A').trim() || 'N/A';
  const popupRole = String(offerResponsePopup.jobRole || 'N/A').trim() || 'N/A';
  const popupPackage = String(offerResponsePopup.packageText || 'N/A').trim() || 'N/A';
  const offerResponsePopupElement = isPopupOpen ? (
    <div className={alertStyles['alert-overlay']}>
      <div className={alertStyles['achievement-popup-container']} onClick={(event) => event.stopPropagation()}>
        <div className={alertStyles['achievement-popup-header']} style={{ backgroundColor: '#2085f6' }}>
          {popupTitle}
        </div>

        <div className={alertStyles['achievement-popup-body']}>
          {isSaving ? (
            <div className={styles.offerResponseLoadingDot} aria-label="Processing response" />
          ) : isFailed ? (
            <svg className={`${styles.offerResponseStateIcon} ${styles.offerResponseStateIconFailed}`} viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="26" cy="26" r="24" />
              <path d="M18 18L34 34M34 18L18 34" />
            </svg>
          ) : (
            <div className={styles.offerResponseSuccessIconCircle}>
              <svg className={styles.offerResponseSuccessIcon} viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Response submitted">
                <path className={`${styles.offerResponseDocStroke} ${styles.offerResponseDocStrokePrimary}`} d="M13.9 11.6h16.2l6.8 6.8v18.5a2.9 2.9 0 0 1-2.9 2.9h-20a2.9 2.9 0 0 1-2.9-2.9V14.5a2.9 2.9 0 0 1 2.9-2.9z" />
                <path className={`${styles.offerResponseDocStroke} ${styles.offerResponseDocStrokeSecondary}`} d="M30.1 11.6v6.8h6.8" />
                <path className={`${styles.offerResponseDocStroke} ${styles.offerResponseDocStrokeTertiary}`} d="M17.2 24.2h13.2" />
                <path className={`${styles.offerResponseDocStroke} ${styles.offerResponseDocStrokeQuaternary}`} d="M17.2 29.6H26" />
                {isAccepted ? (
                  <path className={styles.offerResponseDecisionMark} d="M19.2 33.6l4.8 4.8 9.8-9.8" />
                ) : (
                  <>
                    <path className={styles.offerResponseDecisionMark} d="M20.2 32.2l10.4 10.4" />
                    <path className={`${styles.offerResponseDecisionMark} ${styles.offerResponseDecisionMarkSecondary}`} d="M30.6 32.2L20.2 42.6" />
                  </>
                )}
              </svg>
            </div>
          )}

          <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: '24px', color: '#000', fontWeight: '700' }}>
            {offerResponsePopup.studentName || 'Student'} - {popupBadge}
          </h2>

          <div className={styles.offerResponseInlineMeta}>
            <span>{popupCompany}</span>
            <span aria-hidden="true">&middot;</span>
            <span>{popupRole}</span>
            <span aria-hidden="true">&middot;</span>
            <span>{popupPackage}</span>
          </div>

          <p style={{ margin: '0 0 10px 0', color: '#888', fontSize: '16px' }}>
            {offerResponsePopup.message || (isSuccess ? 'This response has been submitted to admin.' : 'Submitting your response to admin...')}
          </p>
        </div>

        <div className={alertStyles['achievement-popup-footer']}>
          <button onClick={closeOfferResponsePopup} className={alertStyles['achievement-popup-close-btn']} disabled={isSaving}>
            Close
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // If an application is selected, show PopUpPending
  if (selectedApplication) {
    return (
      <div className={styles.container}>
        <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className={styles.main}>
          <Sidebar 
            isOpen={isSidebarOpen} 
            onLogout={onLogout} 
            onViewChange={handleViewChange} 
            currentView={'company'}
            studentData={studentData}
          />
          <div className={styles.dashboardArea}>
            <PopUpPending
              app={selectedApplication}
              onBack={() => setSelectedApplication(null)}
            />
          </div>
        </div>
        {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={styles.main}>
        <Sidebar 
          isOpen={isSidebarOpen} 
          onLogout={onLogout} 
          onViewChange={handleViewChange} 
          currentView={'company'}
          studentData={studentData}
        />
        <div className={styles.dashboardArea}>
          {/* Summary Cards */}
          <div className={styles.summaryCardsContainer}>
            <div className={`${styles.summaryCard} ${styles.summaryCardGreen}`}>
              <h2 className={styles.summaryCardTitle}>Total<br/>Applications</h2>
              <div className={styles.summaryCardNumber}>{totalApplications}</div>
            </div>

            <div className={`${styles.summaryCard} ${styles.summaryCardBlue}`}>
              <h2 className={styles.summaryCardTitle}>Pending<br/>Applications</h2>
              <div className={styles.summaryCardNumber}>{pendingCount}</div>
            </div>

            <div className={`${styles.summaryCard} ${styles.summaryCardRed}`}>
              <h2 className={styles.summaryCardTitle}>Rejected<br/>Applications</h2>
              <div className={styles.summaryCardNumber}>{rejectedCount}</div>
            </div>
          </div>

          {hasSentOfferLetter && (
            <div className={styles.congratsBanner}>
              <div className={styles.offerLeftSection}>
                <div className={styles.offerTickIcon}>✓</div>
                <div className={styles.congratsText}>
                  <div className={styles.congratsTitle}>Congratulations! you&apos;re Placed!</div>
                  <div className={styles.congratsDesc}>
                    We wish you a fantastic career journey!
                  </div>
                  <div className={styles.offerInfoRow}>
                    <span className={styles.offerInfoText}>
                      <span>{offerCompanyName}</span>
                      <span className={styles.offerInfoDot}>&middot;</span>
                      <span>{offerJobRole}</span>
                      <span className={styles.offerInfoDot}>&middot;</span>
                      <span>{offerPackageDisplay}</span>
                    </span>
                    <div className={styles.offerActionRow}>
                      {offerDecision === 'accepted' ? (
                        <span className={`${styles.offerDecisionBadge} ${styles.offerDecisionBadgeAccepted}`}>
                          Accepted
                        </span>
                      ) : offerDecision === 'rejected' ? (
                        <span className={`${styles.offerDecisionBadge} ${styles.offerDecisionBadgeRejected}`}>
                          Rejected
                        </span>
                      ) : (
                        <>
                          <button
                            className={`${styles.offerActionBtn} ${styles.offerAcceptBtn}`}
                            onClick={handleOfferAccept}
                            disabled={isOfferDecisionUpdating}
                          >
                            {offerActionInFlight === 'accepted' ? 'Saving...' : 'Accept'}
                          </button>
                          <button
                            className={`${styles.offerActionBtn} ${styles.offerRejectBtn}`}
                            onClick={handleOfferReject}
                            disabled={isOfferDecisionUpdating}
                          >
                            {offerActionInFlight === 'rejected' ? 'Saving...' : 'Reject'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <button
                className={styles.downloadOfferBtn}
                onClick={handleOfferDownload}
                disabled={!offerLetterUrl || isDownloadingOffer}
                title={offerLetterUrl ? 'Download Offer Letter' : 'Offer letter unavailable'}
              >
                <div className={styles.downloadOfferIconCircle}>⬇</div>
                <span>{isDownloadingOffer ? 'Downloading...' : 'Download Offer Letter'}</span>
              </button>
            </div>
          )}

          {/* My Application History Section */}
          <div className={styles.applicationHistoryContainer} style={{ position: 'relative' }}>
            <div className={styles.applicationHistoryTitle}>My Application History</div>

            {isLoading ? (
              <div className={styles.loadingWrapper}>
                <div className={styles.loadingContainer}>
                  <div className={styles.loadingBarBackground}>
                    <div className={styles.loadingBarFill}></div>
                  </div>
                  <p className={styles.loadingText}>Loading your applications...</p>
                </div>
              </div>
            ) : eligibleDrives.length === 0 ? (
              <div className={styles.applicationHistoryPlaceholder}>
                <div className={styles.clockIconWrapper}>
                  <svg className={styles.clockIcon} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="6"/>
                    <line x1="50" y1="50" x2="50" y2="25" stroke="white" strokeWidth="6" strokeLinecap="round"/>
                    <line x1="50" y1="50" x2="70" y2="50" stroke="white" strokeWidth="6" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className={styles.placeholderTitle}>There is no Application History</div>
                <div className={styles.placeholderText}>
                  Please Apply for the Drive to Include in the<br />Application History
                </div>
              </div>
            ) : (
              <>
                <div
                  ref={appListRef}
                  onScroll={updateScrollThumb}
                  className={styles.appList}
                >
                {eligibleDrives.map((drive, idx) => {
                  // Find matching application to get round data
                  const application = findApplicationForDrive(drive);
                  const attendanceAbsent = isAttendanceAbsentForDrive(drive);

                  // Get overall status based on rounds
                  const overallStatus = getOverallStatus(application, drive, attendanceAbsent);

                  return (
                    <div 
                      key={drive._id || idx} 
                      className={styles.appItem}
                      role="button" 
                      tabIndex="0"
                      onClick={() => {
                        const selectedApp = {
                          company: drive.companyName,
                          jobRole: drive.jobs || drive.jobRole || 'Job Role',
                          mode: drive.mode || drive.driveMode || '',
                          package: drive.package || drive.ctc || drive.salaryPackage || '',
                          bondPeriod: drive.bondPeriod || drive.bond || '',
                          startDate: drive.driveStartDate || drive.companyDriveDate,
                          endDate: drive.driveEndDate || drive.driveStartDate || drive.companyDriveDate,
                          driveId: drive.driveId || drive._id,
                          roundDetails: drive.roundDetails || [],
                          totalRounds: drive.totalRounds || drive.roundDetails?.length || 0,
                          rounds: application?.rounds || [],
                          status: attendanceAbsent ? 'Absent' : (application?.status || 'Pending')
                        };
                        setSelectedApplication(selectedApp);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.appLogo}>{drive.companyName?.charAt(0).toUpperCase() || 'C'}</div>
                      <div className={styles.appDetails}>
                        <div className={styles.appCompany}>
                          {drive.companyName} : {drive.jobs || drive.jobRole || 'Job Role'}
                        </div>
                        <div className={styles.appPosition}>
                          {formatDate(drive.driveStartDate || drive.companyDriveDate)} to {formatDate(drive.driveEndDate || drive.driveStartDate || drive.companyDriveDate)}
                        </div>
                      </div>
                      <div className={styles.appStatusContainer}>
                        <div className={`${styles.appStatus} ${overallStatus.colorClass}`}>
                          <div className={`${styles.appStatusText} ${overallStatus.textClass}`}>
                            {overallStatus.status}
                          </div>
                        </div>
                        <div className={styles.appArrow}>›</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {showScrollBar && (
                <div style={{
                  position: 'absolute',
                  right: isMobile ? '8px' : '10px',
                  top: isMobile ? '50px' : '85px',
                  bottom: isMobile ? '12px' : '24px',
                  width: isMobile ? '6px' : '8px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  zIndex: 5
                }}>
                  <div
                    onMouseDown={onScrollThumbMouseDown}
                    onTouchStart={onScrollThumbMouseDown}
                    style={{
                      position: 'absolute',
                      left: 0,
                      width: '100%',
                      height: `${scrollThumb.height}px`,
                      top: `${scrollThumb.top}px`,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      borderRadius: '20px',
                      cursor: 'grab',
                      touchAction: 'none'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#ffffff'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
                  />
                </div>
              )}
              </>
            )}
          </div>
        </div>
      </div>
      {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>}
      {offerResponsePopupElement}
    </div>
  );
}
