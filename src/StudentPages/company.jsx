import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Navbar from '../components/Navbar/Navbar.js';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import PopUpPending from './PopUpPending.jsx';
import { getOverallStatus as getPopupOverallStatus } from './PopUpPending.jsx';
import styles from './Company.module.css';

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
  const [isLoading, setIsLoading] = useState(true);
  const isFetchingRef = useRef(false);
  const lastFetchedStudentIdRef = useRef(null);
  const eligibleDrivesRef = useRef([]);
  const studentApplicationsRef = useRef([]);

  // Custom scrollbar states
  const appListRef = useRef(null);
  const [scrollThumb, setScrollThumb] = useState({ height: 34, top: 0 });
  const [showScrollBar, setShowScrollBar] = useState(false);

  const normalizeText = (value) => (value || '').toString().trim().toLowerCase();
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
    const regNoRaw = String(student?.regNo || student?.registerNumber || student?.registerNo || '').trim();
    const studentId = String(student?._id || '').trim();

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

      if (!parsedStudentData?._id) {
        if (!isUnmounted) {
          setIsLoading(false);
        }
        return;
      }

      const studentId = String(parsedStudentData._id);
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

        const [drives, appsResponse, attendanceResponse] = await Promise.all([
          getEligibleStudents(studentId),
          import('../services/mongoDBService').then(m => m.default.getStudentApplications(studentId)),
          fetchStudentAttendanceRecords(parsedStudentData)
        ]);

        if (!isUnmounted) {
          setEligibleDrives(drives || []);
          setStudentApplications(appsResponse?.applications || []);
          setStudentAttendanceRecords(attendanceResponse?.data || []);
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
    </div>
  );
}
