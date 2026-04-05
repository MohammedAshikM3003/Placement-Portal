import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AdNavbar from '../components/Navbar/Adnavbar.js';
import AdSidebar from '../components/Sidebar/Adsidebar.js';
import AddTrainingIcon from '../assets/ad_addtrainingicon.svg';
import ScheduleTrainingIcon from '../assets/ad_scheduletrainingicon.svg';
import AttendanceTrainingIcon from '../assets/ad_at_attendance.svg';
import styles from './Admin_Training.module.css';
import mongoDBService from '../services/mongoDBService';

function AdminTraining({ onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [batches, setBatches] = useState([]);
  const [trainingCards, setTrainingCards] = useState([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);

  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [isAttendancePopupOpen, setIsAttendancePopupOpen] = useState(false);
  const [attendancePopupLoading, setAttendancePopupLoading] = useState(false);
  const [attendanceSearchLoading, setAttendanceSearchLoading] = useState(false);
  const [attendancePopupSchedules, setAttendancePopupSchedules] = useState([]);
  const [attendanceSelectedCompany, setAttendanceSelectedCompany] = useState('');
  const [attendanceSelectedCourse, setAttendanceSelectedCourse] = useState('');
  const [attendanceSelectedStartDate, setAttendanceSelectedStartDate] = useState('');
  const [attendanceSelectedEndDate, setAttendanceSelectedEndDate] = useState('');

  const getPlaceholderText = () => {
    if (selectedCompany && !selectedBatch) return 'Select the Batch';
    if (!selectedCompany && selectedBatch) return 'Select the Company';
    return 'Select Company and Batch';
  };

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const getAbsentSlicePath = (absentPercent) => {
    if (!absentPercent || absentPercent <= 0) return '';
    if (absentPercent >= 1) {
      return 'M60 20 A40 40 0 1 1 59.999 20 L60 60 Z';
    }

    const startAngle = 0;
    const endAngle = absentPercent * 360;
    const start = polarToCartesian(60, 60, 40, endAngle);
    const end = polarToCartesian(60, 60, 40, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A 40 40 0 ${largeArcFlag} 0 ${end.x} ${end.y} L 60 60 Z`;
  };

  useEffect(() => {
    const handleCloseSidebar = () => setIsSidebarOpen(false);
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, []);

  useEffect(() => {
    const loadTrainingDashboardData = async () => {
      setIsLoadingCards(true);
      try {
        const [batchAssignments, schedules, trainings] = await Promise.all([
          mongoDBService.getScheduledTrainingBatchAssignments(),
          mongoDBService.getScheduledTrainings(),
          mongoDBService.getTrainings()
        ]);

        const normalizedBatchAssignments = Array.isArray(batchAssignments) ? batchAssignments : [];
        const normalizedSchedules = Array.isArray(schedules) ? schedules : [];
        const normalizedTrainings = Array.isArray(trainings) ? trainings : [];

        const companyList = [...new Set(
          normalizedBatchAssignments
            .map((item) => (item?.companyName || '').toString().trim())
            .filter(Boolean)
        )];
        setCompanies(companyList);

        const batchList = [...new Set(
          normalizedBatchAssignments
            .map((item) => (item?.batchName || '').toString().trim())
            .filter(Boolean)
        )];
        setBatches(batchList);

        const trainingByCompany = new Map(
          normalizedTrainings.map((item) => [
            (item?.companyName || '').toString().trim(),
            item
          ])
        );

        const cards = normalizedSchedules.map((schedule) => {
          const companyName = (schedule?.companyName || '').toString().trim() || 'Training';
          const trainingInfo = trainingByCompany.get(companyName);
          const trainerCount = Array.isArray(trainingInfo?.trainers) ? trainingInfo.trainers.length : 0;
          const firstCourse = Array.isArray(trainingInfo?.courses) && trainingInfo.courses[0]?.name
            ? trainingInfo.courses[0].name
            : '-';

          const batchNames = Array.isArray(schedule?.batches)
            ? schedule.batches
                .map((batch) => (batch?.batchName || '').toString().trim())
                .filter(Boolean)
            : [];

          const batchCount = batchNames.length;
          const phaseCount = Array.isArray(schedule?.phases) ? schedule.phases.length : 0;

          let durationText = 'Duration: -';
          const start = new Date(schedule?.startDate);
          const end = new Date(schedule?.endDate);
          if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
            const diffMs = end.getTime() - start.getTime();
            const days = Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1);
            durationText = `Duration: ${days} Day${days > 1 ? 's' : ''}`;
          }

          return {
            id: schedule?._id || `${companyName}-${schedule?.startDate || ''}`,
            scheduleId: schedule?._id || '',
            companyName,
            logoText: companyName.charAt(0).toUpperCase() || 'T',
            trainerCount,
            firstCourse,
            startDate: schedule?.startDate || '',
            endDate: schedule?.endDate || '',
            batchNames,
            batchCount,
            phaseCount,
            durationText
          };
        });

        setTrainingCards(cards);
      } catch (error) {
        console.error('Failed to load admin training dashboard data:', error);
        setCompanies([]);
        setBatches([]);
        setTrainingCards([]);
      } finally {
        setIsLoadingCards(false);
      }
    };

    loadTrainingDashboardData();
  }, []);

  const filteredTrainingCards = useMemo(() => {
    return trainingCards.filter((card) => {
      if (selectedCompany && card.companyName !== selectedCompany) {
        return false;
      }

      if (selectedBatch && !card.batchNames.includes(selectedBatch)) {
        return false;
      }

      return true;
    });
  }, [trainingCards, selectedCompany, selectedBatch]);

  const appliedSummary = useMemo(() => {
    if (!selectedCompany || !selectedBatch) return null;
    return filteredTrainingCards[0] || null;
  }, [filteredTrainingCards, selectedCompany, selectedBatch]);

  const toggleSidebar = () => {
    setIsSidebarOpen((v) => !v);
  };

  const formatDateForDisplay = (rawDate) => {
    if (!rawDate) return '-';
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return '-';
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const parseScheduleCourses = (scheduleRecord) => {
    // Handle batch assignments (courseName field)
    if (scheduleRecord?.courseName) {
      return [(scheduleRecord.courseName || '').toString().trim()].filter(Boolean);
    }

    // Handle schedules (phases with applicableCourses)
    const phases = Array.isArray(scheduleRecord?.phases) ? scheduleRecord.phases : [];
    const courses = phases.flatMap((phase) => {
      const applicableCourses = Array.isArray(phase?.applicableCourses) ? phase.applicableCourses : [];
      return applicableCourses.map((course) => (course || '').toString().trim()).filter(Boolean);
    });

    return [...new Set(courses)];
  };

  const normalizeDateKey = (rawDate) => {
    if (!rawDate) return '';
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) {
      return rawDate.toString().trim();
    }

    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
  };

  const getSelectedAttendanceSchedule = () => {
    const companyKey = attendanceSelectedCompany.toString().trim().toLowerCase();
    const courseKey = attendanceSelectedCourse.toString().trim().toLowerCase();
    const startKey = normalizeDateKey(attendanceSelectedStartDate);

    return attendancePopupSchedules.find((schedule) => {
      const scheduleCompany = (schedule?.companyName || '').toString().trim().toLowerCase();
      if (scheduleCompany !== companyKey) return false;

      if (courseKey) {
        const scheduleCourses = parseScheduleCourses(schedule).map((course) => course.toLowerCase());
        if (!scheduleCourses.includes(courseKey)) return false;
      }

      if (startKey) {
        return normalizeDateKey(schedule?.startDate) === startKey;
      }

      return true;
    }) || null;
  };

  const attendanceCompanyOptions = useMemo(() => {
    return [...new Set(
      attendancePopupSchedules
        .map((schedule) => (schedule?.companyName || '').toString().trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
  }, [attendancePopupSchedules]);

  const attendanceCourseOptions = useMemo(() => {
    if (!attendanceSelectedCompany) return [];

    return [...new Set(
      attendancePopupSchedules
        .filter((schedule) => (schedule?.companyName || '').toString().trim() === attendanceSelectedCompany)
        .flatMap((schedule) => parseScheduleCourses(schedule))
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
  }, [attendancePopupSchedules, attendanceSelectedCompany]);

  const attendanceStartDateOptions = useMemo(() => {
    if (!attendanceSelectedCompany || !attendanceSelectedCourse) return [];

    return [...new Set(
      attendancePopupSchedules
        .filter((schedule) => {
          const companyMatch = (schedule?.companyName || '').toString().trim() === attendanceSelectedCompany;
          const courseMatch = parseScheduleCourses(schedule).includes(attendanceSelectedCourse);
          return companyMatch && courseMatch;
        })
        .map((schedule) => schedule?.startDate || '')
        .filter(Boolean)
    )].sort((a, b) => new Date(a) - new Date(b));
  }, [attendancePopupSchedules, attendanceSelectedCompany, attendanceSelectedCourse]);

  const todayInfo = useMemo(() => {
    const now = new Date();
    const dateOnlyToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const selectedSchedule = getSelectedAttendanceSchedule();

    if (!selectedSchedule?.startDate) {
      return {
        todayDate: formatDateForDisplay(dateOnlyToday),
        trainingDayLabel: 'Training Day -'
      };
    }

    const start = new Date(selectedSchedule.startDate);
    const end = new Date(selectedSchedule.endDate || selectedSchedule.startDate);
    const dateOnlyStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const dateOnlyEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    const oneDayMs = 24 * 60 * 60 * 1000;
    const diffFromStart = Math.floor((dateOnlyToday.getTime() - dateOnlyStart.getTime()) / oneDayMs) + 1;
    const totalDays = Math.max(1, Math.floor((dateOnlyEnd.getTime() - dateOnlyStart.getTime()) / oneDayMs) + 1);

    const clampedDay = Math.min(Math.max(diffFromStart, 1), totalDays);

    return {
      todayDate: formatDateForDisplay(dateOnlyToday),
      trainingDayLabel: `Training Day ${clampedDay}`
    };
  }, [attendancePopupSchedules, attendanceSelectedCompany, attendanceSelectedCourse, attendanceSelectedStartDate]);

  const handleOpenAttendancePopup = async () => {
    if (attendancePopupLoading) {
      return;
    }

    setAttendancePopupLoading(true);
    try {
      const batchAssignments = await mongoDBService.getScheduledTrainingBatchAssignments();
      const normalizedAssignments = Array.isArray(batchAssignments) ? batchAssignments : [];
      setAttendancePopupSchedules(normalizedAssignments);
      setAttendanceSelectedCompany('');
      setAttendanceSelectedCourse('');
      setAttendanceSelectedStartDate('');
      setAttendanceSelectedEndDate('');
      setIsAttendancePopupOpen(true);
    } catch (error) {
      console.error('Failed to load attendance popup data:', error);
      alert(error.message || 'Failed to load attendance info');
      setIsAttendancePopupOpen(false);
    } finally {
      setAttendancePopupLoading(false);
    }
  };

  const handleSearchAttendance = async () => {
    if (attendanceSearchLoading) {
      return;
    }

    const selectedSchedule = getSelectedAttendanceSchedule();
    if (!selectedSchedule) {
      alert('Please select Company, Course, and Start Date.');
      return;
    }

    setAttendanceSearchLoading(true);
    try {
      // Fetch batch assignments for the selected company and course
      const filters = {
        companyName: attendanceSelectedCompany,
        courseName: attendanceSelectedCourse
      };

      const batchAssignments = await mongoDBService.getScheduledTrainingBatchAssignments(filters);
      const normalizedAssignments = Array.isArray(batchAssignments) ? batchAssignments : [];

      if (normalizedAssignments.length === 0) {
        alert('No batch assignments found for the selected company and course.');
        setAttendanceSearchLoading(false);
        return;
      }

      // Navigate to attendance page with the selected data
      navigate('/admin-attendance-stdinfo', {
        state: {
          companyName: attendanceSelectedCompany,
          courseName: attendanceSelectedCourse,
          batchName: selectedBatch || '-',
          scheduleId: selectedSchedule._id || '',
          startDate: selectedSchedule.startDate || '',
          endDate: attendanceSelectedEndDate || selectedSchedule.endDate || '',
          todayDate: todayInfo.todayDate,
          trainingDay: todayInfo.trainingDayLabel
        }
      });

      setIsAttendancePopupOpen(false);
    } catch (error) {
      console.error('Failed to fetch batch assignments:', error);
      alert(error.message || 'Failed to fetch attendance data. Please try again.');
    } finally {
      setAttendanceSearchLoading(false);
    }
  };

  const handleAttendanceCompanyChange = (value) => {
    setAttendanceSelectedCompany(value);
    setAttendanceSelectedCourse('');
    setAttendanceSelectedStartDate('');
    setAttendanceSelectedEndDate('');
  };

  const handleAttendanceCourseChange = (value) => {
    setAttendanceSelectedCourse(value);
    setAttendanceSelectedStartDate('');
    setAttendanceSelectedEndDate('');
  };

  const handleAttendanceStartDateChange = (value) => {
    setAttendanceSelectedStartDate(value);
    const selectedSchedule = attendancePopupSchedules.find((schedule) => {
      const companyMatch = (schedule?.companyName || '').toString().trim() === attendanceSelectedCompany;
      const courseMatch = parseScheduleCourses(schedule).includes(attendanceSelectedCourse);
      const startMatch = normalizeDateKey(schedule?.startDate) === normalizeDateKey(value);
      return companyMatch && courseMatch && startMatch;
    });

    setAttendanceSelectedEndDate(selectedSchedule?.endDate || '');
  };

  return (
    <div className={styles['ad-tr-page']}>
      <AdNavbar onToggleSidebar={toggleSidebar} />
      <AdSidebar isOpen={isSidebarOpen} onLogout={onLogout} />

      <div className={styles['ad-tr-content']}>
        <div className={styles['ad-tr-header-row']}>
          <div className={styles['ad-tr-breadcrumb']}>
            {/* <div className={styles['ad-tr-breadcrumb-title']}>Admin</div>
            <div className={styles['ad-tr-breadcrumb-sub']}>Training</div> */}
          </div>
        </div>

        <div className={styles['ad-tr-top-grid']}>
          <button type="button" className={styles['ad-tr-action-card']} onClick={() => navigate('/admin-training-company')}>
            <div className={styles['ad-tr-action-icon']}>
              <img src={AddTrainingIcon} alt="Add Training" />
            </div>
            <div className={styles['ad-tr-action-title']}>Add Training Programme</div>
            <div className={styles['ad-tr-action-sub']}>Click to Add Training programs to develop Students skills</div>
          </button>

          <button
            type="button"
            className={styles['ad-tr-action-card']}
            onClick={() => navigate('/admin-schedule-training?mode=new')}
          >
            <div className={styles['ad-tr-action-icon']}>
              <img src={ScheduleTrainingIcon} alt="Schedule Training" />
            </div>
            <div className={styles['ad-tr-action-title']}>Schedule Training</div>
            <div className={styles['ad-tr-action-sub']}>Click to Schedule Training programs to develop Students skill</div>
          </button>

          <button
            type="button"
            className={`${styles['ad-tr-action-card']} ${attendancePopupLoading ? styles['ad-tr-action-card-loading'] : ''}`}
            onClick={handleOpenAttendancePopup}
            disabled={attendancePopupLoading}
          >
            <div className={styles['ad-tr-action-icon']}>
              <img src={AttendanceTrainingIcon} alt="Attendance and Student Info" />
            </div>
            <div className={styles['ad-tr-action-title']}>Attendance & Student Info</div>
            <div className={styles['ad-tr-action-sub']}>
              {attendancePopupLoading ? 'Loading schedule data...' : 'Click to take Attendance and to view Student info'}
            </div>
          </button>

          <div className={styles['ad-tr-summary-card']}>
            <div className={styles['ad-tr-summary-filters']}>
              <select
                className={styles['ad-tr-select']}
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
              >
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                className={styles['ad-tr-select']}
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                <option value="">Select Batch</option>
                {batches.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className={styles['ad-tr-summary-body']}>
              <div className={styles['ad-tr-summary-text']}>
                {appliedSummary ? (
                  <>
                    <div className={styles['ad-tr-summary-line']}><span>Company :</span><strong>{appliedSummary.companyName}</strong></div>
                    <div className={styles['ad-tr-summary-line']}><span>Batches :</span><strong>{appliedSummary.batchCount}</strong></div>
                    <div className={styles['ad-tr-summary-line']}><span>Phases :</span><strong>{appliedSummary.phaseCount}</strong></div>
                    <div className={styles['ad-tr-summary-line']}><span>Course :</span><strong>{appliedSummary.firstCourse}</strong></div>
                    <div className={styles['ad-tr-summary-line']}><span>Trainers :</span><strong>{appliedSummary.trainerCount}</strong></div>
                  </>
                ) : (
                  <div className={styles['ad-tr-summary-placeholder']}>{getPlaceholderText()}</div>
                )}
              </div>

              <div className={styles['ad-tr-summary-chart']}>
                {(() => {
                  const present = appliedSummary?.present ?? 0;
                  const absent = appliedSummary?.absent ?? 0;
                  const total = present + absent;
                  const absentPercent = total > 0 ? absent / total : 0;
                  const absentPath = getAbsentSlicePath(absentPercent);

                  return (
                    <>
                      <svg viewBox="0 0 120 120" className={styles['ad-tr-pie']} aria-hidden="true">
                        {/* Background circle for Present (green) */}
                        <circle
                          cx="60"
                          cy="60"
                          r="40"
                          fill="#17c491"
                        />
                        {/* Absent slice (red) as a path */}
                        {absentPath ? (
                          <path
                            d={absentPath}
                            fill="#ff6b6b"
                          />
                        ) : null}
                        {/* Labels inside pie */}
                        <text x="70" y="55" className={styles['ad-tr-pie-label-present']}>Present</text>
                        <text x="72" y="70" className={styles['ad-tr-pie-value-present']}>{present}</text>
                        <text x="32" y="45" className={styles['ad-tr-pie-label-absent']}>Absent</text>
                        <text x="35" y="60" className={styles['ad-tr-pie-value-absent']}>{absent}</text>
                      </svg>

                      <div className={styles['ad-tr-summary-legend']}>
                        <div className={styles['ad-tr-legend-row']}>
                          <span>Present</span>
                          <strong className={styles['ad-tr-legend-present']}>{present}</strong>
                        </div>
                        <div className={styles['ad-tr-legend-row']}>
                          <span>Absent</span>
                          <strong className={styles['ad-tr-legend-absent']}>{absent}</strong>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className={styles['ad-tr-section-header']}>Trainings</div>

        <div className={styles['ad-tr-training-grid']}>
          {isLoadingCards ? (
            <div className={styles['ad-tr-training-empty']}>Loading scheduled trainings...</div>
          ) : filteredTrainingCards.length === 0 ? (
            <div className={styles['ad-tr-training-empty']}>No scheduled trainings found.</div>
          ) : (
            filteredTrainingCards.map((card, index) => {
              const cardClass = index % 2 === 0 ? styles['ad-tr-training-card'] : styles['ad-tr-training-card-alt'];
              const logoClass = index % 2 === 0 ? styles['ad-tr-training-logo'] : styles['ad-tr-training-logo-alt'];

              const handleCardClick = () => {
                const query = new URLSearchParams({
                  mode: 'edit',
                  company: card.companyName
                });

                if (card.scheduleId) {
                  query.set('scheduleId', card.scheduleId);
                }

                navigate(`/admin-schedule-training?${query.toString()}`);
              };

              return (
                <div key={card.id} className={cardClass} onClick={handleCardClick} style={{ cursor: 'pointer' }}>
                  <div className={logoClass}>{card.logoText}</div>
                  <div className={styles['ad-tr-training-name']}>{card.companyName}</div>
                  <div className={styles['ad-tr-training-meta']}>Batches: {card.batchCount}</div>
                  <div className={styles['ad-tr-training-meta']}>Phases: {card.phaseCount}</div>
                  <div className={styles['ad-tr-training-meta']}>Trainers: {card.trainerCount}</div>
                  <div className={styles['ad-tr-training-meta']}>{card.durationText}</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isAttendancePopupOpen && (
        <div className={styles['ad-tr-att-popup-overlay']}>
          <div className={styles['ad-tr-att-popup-container']}>
            <div className={styles['ad-tr-att-popup-header']}>Attendance & Student Info</div>

            <div className={styles['ad-tr-att-popup-body']}>
              <div className={styles['ad-tr-att-popup-grid']}>
                <div className={styles['ad-tr-att-input-wrapper']}>
                  <label className={styles['ad-tr-att-static-label']}>Company</label>
                  <div className={styles['ad-tr-att-dropdown-container']}>
                    <select
                      className={styles['ad-tr-att-dropdown']}
                      value={attendanceSelectedCompany}
                      onChange={(e) => handleAttendanceCompanyChange(e.target.value)}
                    >
                      <option value="">Select Company</option>
                      {attendanceCompanyOptions.map((companyName) => (
                        <option key={companyName} value={companyName}>{companyName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles['ad-tr-att-input-wrapper']}>
                  <label className={styles['ad-tr-att-static-label']}>Course</label>
                  <div className={styles['ad-tr-att-dropdown-container']}>
                    <select
                      className={styles['ad-tr-att-dropdown']}
                      value={attendanceSelectedCourse}
                      onChange={(e) => handleAttendanceCourseChange(e.target.value)}
                      disabled={!attendanceSelectedCompany}
                    >
                      <option value="">Select Course</option>
                      {attendanceCourseOptions.map((courseName) => (
                        <option key={courseName} value={courseName}>{courseName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles['ad-tr-att-input-wrapper']}>
                  <label className={styles['ad-tr-att-static-label']}>Start Date</label>
                  <div className={styles['ad-tr-att-dropdown-container']}>
                    <select
                      className={styles['ad-tr-att-dropdown']}
                      value={attendanceSelectedStartDate}
                      onChange={(e) => handleAttendanceStartDateChange(e.target.value)}
                      disabled={!attendanceSelectedCompany || !attendanceSelectedCourse}
                    >
                      <option value="">Select Start Date</option>
                      {attendanceStartDateOptions.map((startDate) => (
                        <option key={startDate} value={startDate}>{formatDateForDisplay(startDate)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles['ad-tr-att-input-wrapper']}>
                  <label className={styles['ad-tr-att-static-label']}>End Date</label>
                  <div className={styles['ad-tr-att-text-container']}>
                    <input
                      className={styles['ad-tr-att-text']}
                      value={formatDateForDisplay(attendanceSelectedEndDate)}
                      readOnly
                      placeholder="Auto fetched"
                    />
                  </div>
                </div>

                <div className={styles['ad-tr-att-input-wrapper']}>
                  <label className={styles['ad-tr-att-static-label']}>Today Date</label>
                  <div className={styles['ad-tr-att-text-container']}>
                    <input className={styles['ad-tr-att-text']} value={todayInfo.todayDate} readOnly />
                  </div>
                </div>

                <div className={styles['ad-tr-att-input-wrapper']}>
                  <label className={styles['ad-tr-att-static-label']}>Training Day</label>
                  <div className={styles['ad-tr-att-text-container']}>
                    <input className={styles['ad-tr-att-text']} value={todayInfo.trainingDayLabel} readOnly />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles['ad-tr-att-popup-footer']}>
              <button
                type="button"
                className={styles['ad-tr-att-popup-close-btn']}
                onClick={() => setIsAttendancePopupOpen(false)}
                disabled={attendanceSearchLoading}
              >
                Close
              </button>
              <button
                type="button"
                className={styles['ad-tr-att-popup-search-btn']}
                onClick={handleSearchAttendance}
                disabled={attendanceSearchLoading}
              >
                {attendanceSearchLoading ? 'Search...' : 'Search'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTraining;
