import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdNavbar from '../components/Navbar/Adnavbar';
import AdSidebar from '../components/Sidebar/Adsidebar';
import styles from './Admin_Preferred_Training_button.module.css';
import AdCalendar from '../components/Calendar/Ad_Calendar';
import mongoDBService from '../services/mongoDBService';
import PageLayout from '../components/layout/PageLayout/PageLayout';

const parseMultiValue = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (item || '').toString().trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeYearToken = (value = '') => {
  const raw = value.toString().trim().toUpperCase();
  if (!raw) return '';

  const compact = raw.replace(/[^A-Z0-9]/g, '');
  if (!compact) return '';

  const yearAliases = {
    '1': 'I',
    '01': 'I',
    '1ST': 'I',
    '1STYEAR': 'I',
    'FIRST': 'I',
    'FIRSTYEAR': 'I',
    'I': 'I',
    '2': 'II',
    '02': 'II',
    '2ND': 'II',
    '2NDYEAR': 'II',
    'SECOND': 'II',
    'SECONDYEAR': 'II',
    'II': 'II',
    '3': 'III',
    '03': 'III',
    '3RD': 'III',
    '3RDYEAR': 'III',
    'THIRD': 'III',
    'THIRDYEAR': 'III',
    'III': 'III',
    '4': 'IV',
    '04': 'IV',
    '4TH': 'IV',
    '4THYEAR': 'IV',
    'FOURTH': 'IV',
    'FOURTHYEAR': 'IV',
    'IV': 'IV'
  };

  return yearAliases[compact] || compact;
};

const normalizePhase = (value = '') => {
  const text = value.toString().trim();
  const match = text.match(/\d+/);
  return match ? match[0] : text.toLowerCase();
};

const parsePreferredTrainingByPhase = (rawValue) => {
  if (!rawValue) return {};

  const source = (() => {
    if (typeof rawValue === 'string') {
      const trimmed = rawValue.trim();
      if (!trimmed) return null;
      try {
        return JSON.parse(trimmed);
      } catch (error) {
        return null;
      }
    }

    if (typeof rawValue === 'object') return rawValue;
    return null;
  })();

  if (!source || typeof source !== 'object' || Array.isArray(source)) return {};

  return Object.entries(source).reduce((acc, [phase, course]) => {
    const phaseKey = normalizePhase(phase);
    const courseName = (course || '').toString().trim();
    if (phaseKey && courseName) {
      acc[phaseKey] = courseName;
    }
    return acc;
  }, {});
};

const SuccessPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className={styles.popupOverlay} onClick={onClose}>
      <div className={styles['ad-stu-edit-Achievement-popup-container']} onClick={(e) => e.stopPropagation()}>
        <div className={styles['ad-stu-edit-Achievement-popup-header']}>Saved!</div>
        <div className={styles['ad-stu-edit-Achievement-popup-body']}>
          <svg className={styles['ad-stu-edit-Achievement-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className={styles['ad-stu-edit-Achievement-success-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
            <path className={styles['ad-stu-edit-Achievement-success-icon--check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
            Schedule Saved ✓
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            Your Schedule has been
          </p>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            Successfully saved in the Portal
          </p>
        </div>
        <div className={styles['ad-stu-edit-Achievement-popup-footer']}>
          <button onClick={onClose} className={styles['ad-stu-edit-Achievement-popup-close-btn']}>Close</button>
        </div>
      </div>
    </div>
  );
};

const AdminPreferredTrainingButton = ({ onLogout }) => {
  const navigate = useNavigate();
  console.log('DEBUG COMPONENT IMPORTS:', {
    PageLayout,
    AdNavbar,
    AdSidebar,
    AdCalendar
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [searchParams] = useSearchParams();
  const scheduleMode = (searchParams.get('mode') || 'new').toLowerCase();
  const isEditMode = scheduleMode === 'edit';
  const isViewMode = scheduleMode === 'view';
  const scheduleIdParam = (searchParams.get('scheduleId') || '').toString().trim();

  // Training Details state
  const [company, setCompany] = useState('');
  const [companies, setCompanies] = useState([]);
  const [trainingRecords, setTrainingRecords] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [companyHR, setCompanyHR] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentScheduleId, setCurrentScheduleId] = useState('');

  // Phase Details state
  const [phaseNumber, setPhaseNumber] = useState('');
  const [trainingName, setTrainingName] = useState('');
  const [applicableYear, setApplicableYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('');
  const [trainers, setTrainers] = useState([]);

  // Preferred Training state
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [scheduledBatches, setScheduledBatches] = useState([]);
  const [coursesWithStudents, setCoursesWithStudents] = useState({});

  const [errorTooltip, setErrorTooltip] = useState({ visible: false, x: 0, y: 0 });
  const [highlightedField, setHighlightedField] = useState(null);
  const highlightClearTimerRef = useRef(null);
  const fieldRefs = useRef({});

  const registerFieldRef = useCallback((field) => (node) => {
    fieldRefs.current[field] = node;
  }, []);

  const clearFieldHighlight = useCallback(() => {
    if (highlightClearTimerRef.current) {
      clearTimeout(highlightClearTimerRef.current);
      highlightClearTimerRef.current = null;
    }
    setHighlightedField(null);
  }, []);

  const focusField = useCallback((field) => {
    const target = fieldRefs.current[field];
    if (!target) return;

    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      try { target.focus({ preventScroll: true }); } catch { target.focus(); }
    }, 100);

    clearFieldHighlight();
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => { setHighlightedField(field); });
    });

    highlightClearTimerRef.current = window.setTimeout(() => {
      setHighlightedField((cur) => (cur === field ? null : cur));
    }, 3000);
  }, [clearFieldHighlight]);

  const [supportsPointerTooltip, setSupportsPointerTooltip] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return (
      window.matchMedia('(any-hover: hover) and (any-pointer: fine)').matches ||
      window.matchMedia('(hover: hover) and (pointer: fine)').matches
    );
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const hybridQuery = window.matchMedia('(any-hover: hover) and (any-pointer: fine)');
    const primaryQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const updatePointerSupport = () => {
      const isSupported = hybridQuery.matches || primaryQuery.matches;
      setSupportsPointerTooltip(isSupported);
      if (!isSupported) {
        setErrorTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }
    };
    updatePointerSupport();
    if (typeof hybridQuery.addEventListener === 'function') {
      hybridQuery.addEventListener('change', updatePointerSupport);
      primaryQuery.addEventListener('change', updatePointerSupport);
      return () => {
        hybridQuery.removeEventListener('change', updatePointerSupport);
        primaryQuery.removeEventListener('change', updatePointerSupport);
      };
    }
    return undefined;
  }, []);

  const handleTooltipMove = useCallback((event) => {
    if (!supportsPointerTooltip) return;
    setErrorTooltip({ visible: true, x: event.clientX + 14, y: event.clientY + 18 });
  }, [supportsPointerTooltip]);

  const handleTooltipLeave = useCallback(() => {
    if (!supportsPointerTooltip) return;
    setErrorTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
  }, [supportsPointerTooltip]);

  useEffect(() => () => {
    if (highlightClearTimerRef.current) clearTimeout(highlightClearTimerRef.current);
  }, []);

  const missingFields = useMemo(() => {
    const missing = [];
    if (!company) {
      missing.push({ field: 'company', label: 'Select Company' });
    }
    if (!phaseNumber.trim()) {
      missing.push({ field: 'phaseNumber', label: 'Phase Number' });
    }
    if (!trainingName.trim()) {
      missing.push({ field: 'trainingName', label: 'Training Name' });
    }
    if (!applicableYear) {
      missing.push({ field: 'applicableYear', label: 'Applicable Year' });
    }
    if (!startDate) {
      missing.push({ field: 'startDate', label: 'Start Date' });
    }
    if (!endDate) {
      missing.push({ field: 'endDate', label: 'End Date' });
    }
    if (selectedCourses.length === 0) {
      missing.push({ field: 'selectedCourses', label: 'Preferred Training Course' });
    }
    return missing;
  }, [company, phaseNumber, trainingName, applicableYear, startDate, endDate, selectedCourses]);

  useEffect(() => {
    const handleCloseSidebar = () => setIsSidebarOpen(false);
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, []);

  useEffect(() => {
    const loadCompaniesFromTraining = async () => {
      setIsLoadingCompanies(true);
      try {
        const trainingRows = await mongoDBService.getTrainings();
        setTrainingRecords(Array.isArray(trainingRows) ? trainingRows : []);
        const uniqueCompanyNames = [...new Set(
          (Array.isArray(trainingRows) ? trainingRows : [])
            .map((row) => (row?.companyName || '').toString().trim())
            .filter(Boolean)
        )];
        setCompanies(uniqueCompanyNames);

        // Pre-select company from URL parameter if provided
        const companyParam = searchParams.get('company');
        if (companyParam && uniqueCompanyNames.includes(companyParam)) {
          setCompany(companyParam);
        }
      } catch (error) {
        console.error('Failed to load training companies:', error);
        setCompanies([]);
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    loadCompaniesFromTraining();
  }, [searchParams]);

  // Fetch company details (HR, Location, Trainers, Courses) when company is selected
  useEffect(() => {
    if (!company) {
      setCompanyHR('');
      setCompanyLocation('');
      setTrainers([]);
      setAvailableCourses([]);
      setSelectedCourses([]);
      setScheduledBatches([]);
      setTrainingName('');
      return;
    }

    const selectedTraining = trainingRecords.find(
      (record) => (record?.companyName || '').toString().trim().toLowerCase() === company.trim().toLowerCase()
    );

    if (selectedTraining) {
      const hrValue = selectedTraining.companyHR || selectedTraining.hrName || '';
      const locationValue = selectedTraining.location || '';

      setCompanyHR(hrValue);
      setCompanyLocation(locationValue);

      // Get trainers from training record
      const trainersList = Array.isArray(selectedTraining.trainers)
        ? selectedTraining.trainers.map(t => ({
            name: t?.name || t?.trainerName || '',
            mobile: t?.mobile || t?.mobileNumber || t?.phone || ''
          })).filter(t => t.name)
        : [];
      setTrainers(trainersList);

      // Get courses from training record
      const coursesList = Array.isArray(selectedTraining.courses)
        ? selectedTraining.courses
            .map(c => (c?.name || c?.courseName || (typeof c === 'string' ? c : '')).toString().trim())
            .filter(Boolean)
        : [];
      setAvailableCourses(coursesList);
    }
  }, [company, trainingRecords]);

  // Calculate duration when start and end dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) {
        setDuration(`${diffDays} day${diffDays !== 1 ? 's' : ''}`);
      } else {
        setDuration('');
      }
    } else {
      setDuration('');
    }
  }, [startDate, endDate]);

  // Load schedule data when company is selected in edit mode
  useEffect(() => {
    const loadScheduleForCompany = async () => {
      if (!company) {
        setCurrentScheduleId('');
        setPhaseNumber('');
        setTrainingName('');
        setApplicableYear('');
        setStartDate('');
        setEndDate('');
        setDuration('');
        setSelectedCourses([]);
        setScheduledBatches([]);
        return;
      }

      if (!isEditMode) {
        setCurrentScheduleId('');
        setPhaseNumber('');
        setTrainingName('');
        setApplicableYear('');
        setStartDate('');
        setEndDate('');
        setDuration('');
        setSelectedCourses([]);
        setScheduledBatches([]);
        return;
      }

      setIsLoadingSchedule(true);
      try {
        const schedules = await mongoDBService.getScheduledTrainings();
        const normalizedSchedules = Array.isArray(schedules) ? schedules : [];

        const existingSchedule = scheduleIdParam
          ? normalizedSchedules.find((s) => (s?._id || '').toString() === scheduleIdParam)
          : normalizedSchedules.find(
              (s) => (s?.companyName || '').toString().trim() === company.trim()
            );

        if (existingSchedule && existingSchedule.phases && existingSchedule.phases.length > 0) {
          setCurrentScheduleId((existingSchedule?._id || '').toString());

          // Get the first phase to populate the form
          const firstPhase = existingSchedule.phases[0];

          setPhaseNumber(firstPhase.phaseNumber || '');
          setTrainingName(firstPhase.trainingName || firstPhase.trainer || '');
          setApplicableYear(firstPhase.applicableYear || '');
          setStartDate(firstPhase.startDate || '');
          setEndDate(firstPhase.endDate || '');
          setDuration(firstPhase.duration || '');
          setSelectedCourses(Array.isArray(firstPhase.applicableCourses) ? firstPhase.applicableCourses : []);
          setScheduledBatches(Array.isArray(existingSchedule.batches) ? existingSchedule.batches : []);
        } else {
          setCurrentScheduleId('');
          setPhaseNumber('');
          setTrainingName('');
          setApplicableYear('');
          setStartDate('');
          setEndDate('');
          setDuration('');
          setSelectedCourses([]);
          setScheduledBatches([]);
        }
      } catch (error) {
        console.error('Failed to load schedule for company:', error);
        setCurrentScheduleId('');
        setPhaseNumber('');
        setTrainingName('');
        setApplicableYear('');
        setStartDate('');
        setEndDate('');
        setDuration('');
        setSelectedCourses([]);
        setScheduledBatches([]);
      } finally {
        setIsLoadingSchedule(false);
      }
    };

    loadScheduleForCompany();
  }, [company, isEditMode, scheduleIdParam]);

  const toggleSidebar = () => {
    setIsSidebarOpen((v) => !v);
  };

  const handleCourseToggle = (courseName) => {
    setSelectedCourses(prev => {
      if (prev.includes(courseName)) {
        return prev.filter(c => c !== courseName);
      } else {
        return [...prev, courseName];
      }
    });
  };

  useEffect(() => {
    const loadCourseAvailability = async () => {
      const normalizedCourses = [...new Set(
        (Array.isArray(selectedCourses) ? selectedCourses : [])
          .map((course) => (course || '').toString().trim())
          .filter(Boolean)
      )];

      if (!isEditMode || !company || normalizedCourses.length === 0) {
        setCoursesWithStudents({});
        return;
      }

      const targetYear = normalizeYearToken(applicableYear);
      const selectedPhaseKey = normalizePhase(phaseNumber);

      try {
        const allStudents = [];
        const pageSize = 200;
        let page = 1;

        while (page <= 30) {
          const response = await mongoDBService.getStudentsPaginated({
            page,
            limit: pageSize,
            includeImages: 'false'
          });

          const rows = Array.isArray(response?.students) ? response.students : [];
          allStudents.push(...rows);

          if (!response?.pagination?.hasMore || rows.length < pageSize) {
            break;
          }

          page += 1;
        }

        const counts = {};
        normalizedCourses.forEach((course) => {
          counts[course] = 0;
        });

        allStudents.forEach((student) => {
          const studentYear = normalizeYearToken(student?.currentYear || student?.year || '');
          if (targetYear && studentYear !== targetYear) {
            return;
          }

          const byPhaseMap = parsePreferredTrainingByPhase(student?.preferredTrainingByPhase);
          const preferredForSelectedPhase = (byPhaseMap[selectedPhaseKey] || '').toString().trim();

          // Backward compatibility: legacy preferredTraining is treated as Phase 1 selection.
          const fallbackLegacy = selectedPhaseKey === '1'
            ? ((parseMultiValue(student?.preferredTraining)[0] || '').toString().trim())
            : '';

          const effectiveSelection = (preferredForSelectedPhase || fallbackLegacy).toLowerCase();
          if (!effectiveSelection) {
            return;
          }

          normalizedCourses.forEach((course) => {
            if (effectiveSelection === course.toLowerCase()) {
              counts[course] += 1;
            }
          });
        });

        setCoursesWithStudents(counts);
      } catch (error) {
        console.error('Failed to load course-wise student availability:', error);
        setCoursesWithStudents({});
      }
    };

    loadCourseAvailability();
  }, [selectedCourses, applicableYear, phaseNumber, isEditMode, company]);

  const effectiveBatchCourses = useMemo(() => {
    const normalized = [...new Set(
      (Array.isArray(selectedCourses) ? selectedCourses : [])
        .map((course) => (course || '').toString().trim())
        .filter(Boolean)
    )];

    return normalized;
  }, [selectedCourses, coursesWithStudents]);

  const openBatchStudentsPage = (courseName) => {
    if (!courseName) return;

    navigate('/admin-schedule-training-batch', {
      state: {
        scheduleId: currentScheduleId || scheduleIdParam || '',
        companyName: company,
        selectedCourse: courseName,
        phaseNumber,
        trainingName,
        applicableYear,
        scheduleStartDate: startDate,
        scheduleEndDate: endDate,
        availableCourses: effectiveBatchCourses
      }
    });
  };

  const handleDiscard = () => {
    setCurrentScheduleId('');
    setCompany('');
    setCompanyHR('');
    setCompanyLocation('');
    setPhaseNumber('');
    setTrainingName('');
    setApplicableYear('');
    setStartDate('');
    setEndDate('');
    setDuration('');
    setSelectedCourses([]);
    setScheduledBatches([]);
  };

  const handleSave = async () => {
    if (!company) {
      alert('Please select company');
      return;
    }

    if (!phaseNumber.trim()) {
      alert('Please enter phase number');
      return;
    }

    if (!trainingName.trim()) {
      alert('Please enter training name');
      return;
    }

    if (!applicableYear) {
      alert('Please select applicable year');
      return;
    }

    if (!startDate) {
      alert('Please select start date');
      return;
    }

    if (!endDate) {
      alert('Please select end date');
      return;
    }

    if (selectedCourses.length === 0) {
      alert('Please select at least one preferred training course');
      return;
    }

    // In edit mode, save the current form data as a single phase
    const phasesToSave = [{
      phaseNumber: phaseNumber.trim(),
      trainingName: trainingName.trim(),
      trainer: trainingName.trim(),
      applicableYear: applicableYear,
      startDate: startDate,
      endDate: endDate,
      duration: duration,
      applicableCourses: selectedCourses
    }];

    const payload = {
      ...(isEditMode && currentScheduleId ? { scheduleId: currentScheduleId } : {}),
      companyName: company,
      companyHR: companyHR,
      location: companyLocation,
      startDate: startDate,
      endDate: endDate,
      phases: phasesToSave,
      batches: scheduledBatches
    };

    console.log('Final payload being sent:', JSON.stringify(payload, null, 2));

    setIsSaving(true);
    try {
      await mongoDBService.createScheduledTraining(payload);
      setShowSuccessPopup(true);
      handleDiscard();
    } catch (error) {
      console.error('Failed to save schedule training:', error);
      alert(error.message || 'Failed to save schedule training');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageLayout navbar={<AdNavbar onToggleSidebar={toggleSidebar} />} sidebar={<AdSidebar isOpen={isSidebarOpen} onLogout={onLogout} />}>
      {/* Training Details Card */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Training Details</h2>
        <div className={styles.cardContent}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>
                Select Company <span className={styles.requiredStar}>*</span>
              </label>
              <select
                ref={registerFieldRef('company')}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className={`${styles.control} ${highlightedField === 'company' ? styles.fieldHighlight : ''}`}
                disabled={isLoadingCompanies || isViewMode}
              >
                <option value="">{isLoadingCompanies ? 'Loading companies...' : 'Select Company'}</option>
                {companies.map((companyName) => (
                  <option key={companyName} value={companyName}>
                    {companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Company HR</label>
              <input
                type="text"
                value={companyHR}
                readOnly
                placeholder="Auto-fetched"
                className={styles.control}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Location</label>
              <input
                type="text"
                value={companyLocation}
                readOnly
                placeholder="Auto-fetched"
                className={styles.control}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Phase Details Card */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Phase Details</h2>
        <div className={styles.cardContent}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>
                Phase Number <span className={styles.requiredStar}>*</span>
              </label>
              <div className={styles.phasePrefixInput}>
                <span className={styles.phasePrefixChip}>Phase</span>
                <input
                  ref={registerFieldRef('phaseNumber')}
                  type="text"
                  value={phaseNumber}
                  onChange={(e) => setPhaseNumber(e.target.value)}
                  placeholder="e.g. 1"
                  className={`${styles.control} ${styles.phaseNumberControl} ${highlightedField === 'phaseNumber' ? styles.fieldHighlight : ''}`}
                  disabled={isViewMode}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>
                Training Name <span className={styles.requiredStar}>*</span>
              </label>
              <input
                ref={registerFieldRef('trainingName')}
                type="text"
                value={trainingName}
                onChange={(e) => setTrainingName(e.target.value)}
                placeholder="e.g. Technical"
                className={`${styles.control} ${highlightedField === 'trainingName' ? styles.fieldHighlight : ''}`}
                disabled={isViewMode}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>
                Applicable Year <span className={styles.requiredStar}>*</span>
              </label>
              <select
                ref={registerFieldRef('applicableYear')}
                value={applicableYear}
                onChange={(e) => setApplicableYear(e.target.value)}
                className={`${styles.control} ${highlightedField === 'applicableYear' ? styles.fieldHighlight : ''}`}
                disabled={isViewMode}
              >
                <option value="">Select Year</option>
                <option value="I">I</option>
                <option value="II">II</option>
                <option value="III">III</option>
                <option value="IV">IV</option>
              </select>
            </div>
          </div>

          <div className={`${styles.formRow} ${styles.dynamicRow}`}>
            <div className={`${styles.formGroup} ${styles.calendarField}`}>
              <label className={styles.fieldLabel}>
                Start Date <span className={styles.requiredStar}>*</span>
              </label>
              <AdCalendar
                ref={registerFieldRef('startDate')}
                value={startDate}
                onChange={setStartDate}
                disabled={isViewMode}
                triggerClassName={highlightedField === 'startDate' ? styles.fieldHighlight : ''}
              />
            </div>

            <div className={`${styles.formGroup} ${styles.calendarField}`}>
              <label className={styles.fieldLabel}>
                End Date <span className={styles.requiredStar}>*</span>
              </label>
              <AdCalendar
                ref={registerFieldRef('endDate')}
                value={endDate}
                onChange={setEndDate}
                disabled={isViewMode}
                triggerClassName={highlightedField === 'endDate' ? styles.fieldHighlight : ''}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Duration</label>
              <input
                type="text"
                value={duration}
                readOnly
                placeholder="Auto-calculated"
                className={styles.control}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preferred Training Card */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Preferred Training</h2>
        <div
          ref={registerFieldRef('selectedCourses')}
          className={`${styles.cardContent} ${highlightedField === 'selectedCourses' ? styles.fieldHighlight : ''}`}
        >
          {!company ? (
            <p className={styles.noDataText}>Please select a company first to view available courses</p>
          ) : availableCourses.length === 0 ? (
            <p className={styles.noDataText}>No courses available for selected company</p>
          ) : isViewMode ? (
            effectiveBatchCourses.length === 0 ? (
              <p className={styles.noDataText}>No preferred courses selected for this schedule</p>
            ) : (
              <div className={styles.buttonRow}>
                <div className={styles.coursesGrid}>
                  {effectiveBatchCourses.map((course) => {
                    const studentCount = Number(coursesWithStudents?.[course] || 0);
                    const buttonLabel = `${course} (${studentCount})`;
                    const isDisabled = studentCount <= 0;

                    return (
                      <button
                        key={`add-students-${course}`}
                        type="button"
                        className={styles.batchBtn}
                        disabled={isDisabled}
                        onClick={() => openBatchStudentsPage(course)}
                      >
                        {buttonLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            <>
              <div className={styles.coursesGrid}>
                {availableCourses.map((course) => {
                  const isSelected = selectedCourses.includes(course);
                  return (
                    <label key={course} className={styles.courseItem}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleCourseToggle(course)}
                        className={styles.courseCheckbox}
                      />
                      <span className={styles.courseName}>{course}</span>
                    </label>
                  );
                })}
              </div>

              {selectedCourses.length > 0 && (currentScheduleId || scheduleIdParam) && (
                <div className={styles.buttonRow} style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#333' }}>
                    Manage Batches & Selected Students:
                  </h4>
                  <div className={styles.coursesGrid}>
                    {selectedCourses.map((course) => {
                      const studentCount = Number(coursesWithStudents?.[course] || 0);
                      const buttonLabel = `${course} (${studentCount})`;

                      return (
                        <button
                          key={`add-students-${course}`}
                          type="button"
                          className={styles.batchBtn}
                          onClick={() => openBatchStudentsPage(course)}
                        >
                          {buttonLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Validation warning box */}
      {!isViewMode && missingFields.length > 0 && (
        <div className={styles.validationBox}>
          <h4 className={styles.validationHeading}>
            <span className={styles.validationIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" role="img" focusable="false">
                <path fill="currentColor" d="M1 21h22L12 2L1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
            </span>
            Required Fields Missing:
          </h4>
          <ul className={styles.validationList}>
            {missingFields.map((error, index) => (
              <li
                key={`${error.field}-${index}`}
                className={styles.validationItem}
                role="button"
                tabIndex={0}
                onClick={() => focusField(error.field)}
                onMouseEnter={handleTooltipMove}
                onMouseMove={handleTooltipMove}
                onMouseLeave={handleTooltipLeave}
                style={{ cursor: 'pointer' }}
              >
                {error.label} is required
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      {!isViewMode && (
        <div className={styles.actions}>
          <button type="button" className={styles.discardBtn} onClick={handleDiscard} disabled={isSaving}>
            Discard
          </button>
          <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={isSaving || missingFields.length > 0}>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}

      {/* Pointer Hover Tooltip */}
      {errorTooltip.visible && (
        <div
          className={styles.pointerTooltip}
          style={{ left: `${errorTooltip.x}px`, top: `${errorTooltip.y}px` }}
        >
          Click to navigate
        </div>
      )}

      {showSuccessPopup && (
        <SuccessPopup isOpen={showSuccessPopup} onClose={() => setShowSuccessPopup(false)} />
      )}
    </PageLayout>
  );
};

export default AdminPreferredTrainingButton;
