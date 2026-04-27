import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdNavbar from '../components/Navbar/Adnavbar';
import AdSidebar from '../components/Sidebar/Adsidebar';
import styles from './Admin_Schedule_Training.module.css';
import Ad_Calendar from '../components/Calendar/Ad_Calendar';
import mongoDBService from '../services/mongoDBService';

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

const normalizePhaseNumber = (value = '') => {
  return value.toString().replace(/\D/g, '');
};

const normalizeTextToken = (value = '') => {
  return value.toString().trim().toLowerCase();
};

const AdminScheduleTraining = ({ onLogout }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  
  // Multiple companies state
  const [selectedCompanies, setSelectedCompanies] = useState([]);

  // Phase Details state
  const [phaseNumber, setPhaseNumber] = useState('');
  const [trainingName, setTrainingName] = useState('');
  const [applicableYear, setApplicableYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('');

  // Preferred Training state
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [scheduledBatches, setScheduledBatches] = useState([]);
  const [companyTrainers, setCompanyTrainers] = useState([]);
  const [showTrainerPopup, setShowTrainerPopup] = useState(false);
  const [activeCourseForTrainers, setActiveCourseForTrainers] = useState('');
  const [pendingTrainerSelection, setPendingTrainerSelection] = useState([]);
  const [selectedCourseTrainers, setSelectedCourseTrainers] = useState({});
  const [alertPopup, setAlertPopup] = useState({ isOpen: false, title: '', message: '', type: 'info' });

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
      setAvailableCourses([]);
      setSelectedCourses([]);
      setScheduledBatches([]);
      setCompanyTrainers([]);
      setSelectedCourseTrainers({});
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

      // Get courses from training record
      const coursesList = Array.isArray(selectedTraining.courses)
        ? selectedTraining.courses
            .map(c => (c?.name || c?.courseName || (typeof c === 'string' ? c : '')).toString().trim())
            .filter(Boolean)
        : [];
      setAvailableCourses(coursesList);

      const trainersList = Array.isArray(selectedTraining.trainers)
        ? selectedTraining.trainers
            .map((trainer) => ({
              name: (trainer?.name || '').toString().trim(),
              courses: parseMultiValue(trainer?.courses)
            }))
            .filter((trainer) => trainer.name)
        : [];
      setCompanyTrainers(trainersList);
    } else {
      setCompanyHR('');
      setCompanyLocation('');
      setAvailableCourses([]);
      setSelectedCourses([]);
      setScheduledBatches([]);
      setCompanyTrainers([]);
      setSelectedCourseTrainers({});
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
        setSelectedCourseTrainers({});
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
        setSelectedCourseTrainers({});
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

          setPhaseNumber(normalizePhaseNumber(firstPhase.phaseNumber || ''));
          setTrainingName(firstPhase.trainingName || '');
          setApplicableYear(firstPhase.applicableYear || '');
          setStartDate(firstPhase.startDate || '');
          setEndDate(firstPhase.endDate || '');
          setDuration(firstPhase.duration || '');
          setSelectedCourses(Array.isArray(firstPhase.applicableCourses) ? firstPhase.applicableCourses : []);

          const mappedCourseTrainers = Array.isArray(firstPhase.courseTrainers)
            ? firstPhase.courseTrainers.reduce((acc, row) => {
                const courseName = (row?.courseName || '').toString().trim();
                if (!courseName) return acc;
                const trainerNames = Array.isArray(row?.trainers)
                  ? row.trainers.map((name) => (name || '').toString().trim()).filter(Boolean)
                  : [];
                acc[courseName] = trainerNames;
                return acc;
              }, {})
            : {};
          setSelectedCourseTrainers(mappedCourseTrainers);

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
          setSelectedCourseTrainers({});
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
        setSelectedCourseTrainers({});
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

  const handleCourseToggleWithCompany = (companyItem, courseName) => {
    // Check if course is already selected (we need to track selected courses with company context)
    const courseKey = `${companyItem.company}__${courseName}`;
    const coursesList = selectedCourses;

    if (coursesList.includes(courseName)) {
      // Remove course
      setSelectedCourses(coursesList.filter((course) => course !== courseName));
      setSelectedCourseTrainers((prev) => {
        const next = { ...prev };
        delete next[courseName];
        return next;
      });
      if (activeCourseForTrainers === courseName) {
        setShowTrainerPopup(false);
        setActiveCourseForTrainers('');
        setPendingTrainerSelection([]);
      }
      return;
    }

    // Add course and fetch trainers for this company
    const trainingInfo = trainingRecords.find(
      (record) => (record?.companyName || '').toString().trim().toLowerCase() === (companyItem.company || '').trim().toLowerCase()
    );

    const trainersList = Array.isArray(trainingInfo?.trainers)
      ? trainingInfo.trainers
          .map((trainer) => ({
            name: (trainer?.name || '').toString().trim(),
            courses: parseMultiValue(trainer?.courses)
          }))
          .filter((trainer) => trainer.name)
      : [];

    setCompanyTrainers(trainersList);
    setSelectedCourses([...coursesList, courseName]);
    setActiveCourseForTrainers(courseName);
    setPendingTrainerSelection(
      Array.isArray(selectedCourseTrainers[courseName]) ? selectedCourseTrainers[courseName] : []
    );
    setShowTrainerPopup(true);
  };

  const handleCourseToggle = (courseName) => {
    const coursesList = selectedCourses;

    if (coursesList.includes(courseName)) {
      setSelectedCourses(coursesList.filter((course) => course !== courseName));
      setSelectedCourseTrainers((prev) => {
        const next = { ...prev };
        delete next[courseName];
        return next;
      });
      if (activeCourseForTrainers === courseName) {
        setShowTrainerPopup(false);
        setActiveCourseForTrainers('');
        setPendingTrainerSelection([]);
      }
      return;
    }

    setSelectedCourses([...selectedCourses, courseName]);
    setActiveCourseForTrainers(courseName);
    setPendingTrainerSelection(
      Array.isArray(selectedCourseTrainers[courseName]) ? selectedCourseTrainers[courseName] : []
    );
    setShowTrainerPopup(true);
  };

  const trainersForActiveCourse = useMemo(() => {
    if (!activeCourseForTrainers) return [];

    const activeCourseToken = normalizeTextToken(activeCourseForTrainers);

    return companyTrainers
      .filter((trainer) => {
        const trainerCourses = Array.isArray(trainer.courses) ? trainer.courses : [];
        if (trainerCourses.length === 0) return false;
        return trainerCourses.some((course) => normalizeTextToken(course) === activeCourseToken);
      })
      .map((trainer) => trainer.name);
  }, [activeCourseForTrainers, companyTrainers]);

  const handleTrainerSelectionToggle = (trainerName) => {
    setPendingTrainerSelection((prev) => {
      if (prev.includes(trainerName)) {
        return prev.filter((name) => name !== trainerName);
      }
      return [...prev, trainerName];
    });
  };

  const closeTrainerPopup = () => {
    setShowTrainerPopup(false);
    setActiveCourseForTrainers('');
    setPendingTrainerSelection([]);
  };

  const showAlertPopup = (message, type = 'info') => {
    const titleMap = {
      success: 'Success',
      error: 'Error',
      info: 'Alert'
    };

    setAlertPopup({
      isOpen: true,
      title: titleMap[type] || 'Alert',
      message,
      type
    });
  };

  const closeAlertPopup = () => {
    setAlertPopup({ isOpen: false, title: '', message: '', type: 'info' });
  };

  const applyTrainerSelection = () => {
    if (activeCourseForTrainers) {
      setSelectedCourseTrainers((prev) => ({
        ...prev,
        [activeCourseForTrainers]: pendingTrainerSelection
      }));
    }
    closeTrainerPopup();
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
    setSelectedCourseTrainers({});
    setScheduledBatches([]);
    setSelectedCompanies([]);
    closeTrainerPopup();
  };

  const handleAddCompany = () => {
    setSelectedCompanies([
      ...selectedCompanies,
      { id: Date.now(), company: '', companyHR: '', companyLocation: '' }
    ]);
  };

  const handleRemoveCompany = (id) => {
    setSelectedCompanies(selectedCompanies.filter((item) => item.id !== id));
  };

  const handleCompanyChange = (id, field, value) => {
    setSelectedCompanies(selectedCompanies.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleCompanySelect = (id, companyName) => {
    const trainingInfo = trainingRecords.find(
      (record) => (record?.companyName || '').toString().trim().toLowerCase() === companyName.trim().toLowerCase()
    );

    const hr = trainingInfo?.companyHR || trainingInfo?.hrName || '';
    const location = trainingInfo?.location || trainingInfo?.companyLocation || trainingInfo?.companyInfo || '';

    setSelectedCompanies(selectedCompanies.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          company: companyName,
          companyHR: hr,
          companyLocation: location
        };
      }
      return item;
    }));
  };

  const handleSave = async () => {
    if (selectedCompanies.length === 0) {
      showAlertPopup('Please add and select at least one company');
      return;
    }

    // Validate that all companies have been selected
    const unselectedCompanies = selectedCompanies.filter((item) => !item.company);
    if (unselectedCompanies.length > 0) {
      showAlertPopup('Please select a company for all company entries');
      return;
    }

    const normalizedPhaseNumber = normalizePhaseNumber(phaseNumber);

    if (!normalizedPhaseNumber) {
      showAlertPopup('Please enter phase number');
      return;
    }

    if (!applicableYear) {
      showAlertPopup('Please select applicable year');
      return;
    }

    if (!startDate) {
      showAlertPopup('Please select start date');
      return;
    }

    if (!endDate) {
      showAlertPopup('Please select end date');
      return;
    }

    if (selectedCourses.length === 0) {
      showAlertPopup('Please select at least one preferred training course');
      return;
    }

    // In edit mode, save the current form data as a single phase
    const phasesToSave = [{
      phaseNumber: normalizedPhaseNumber,
      trainingName: trainingName.trim(),
      applicableYear: applicableYear,
      startDate: startDate,
      endDate: endDate,
      duration: duration,
      applicableCourses: selectedCourses,
      courseTrainers: selectedCourses
        .map((courseName) => ({
          courseName,
          trainers: Array.isArray(selectedCourseTrainers[courseName])
            ? selectedCourseTrainers[courseName]
            : []
        }))
        .filter((row) => row.trainers.length > 0)
    }];

    // Save each company as a separate schedule entry
    const payloads = selectedCompanies.map((companyItem) => ({
      ...(isEditMode && currentScheduleId ? { scheduleId: currentScheduleId } : {}),
      companyName: companyItem.company,
      companyHR: companyItem.companyHR,
      location: companyItem.companyLocation,
      startDate: startDate,
      endDate: endDate,
      phases: phasesToSave,
      batches: scheduledBatches
    }));

    console.log('Final payloads being sent:', JSON.stringify(payloads, null, 2));

    setIsSaving(true);
    try {
      // Save each company's schedule
      for (const payload of payloads) {
        await mongoDBService.createScheduledTraining(payload);
      }
      showAlertPopup(`Schedule training saved successfully for ${payloads.length} compan${payloads.length === 1 ? 'y' : 'ies'}`, 'success');
      handleDiscard();
    } catch (error) {
      console.error('Failed to save schedule training:', error);
      showAlertPopup(error.message || 'Failed to save schedule training', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <AdNavbar onToggleSidebar={toggleSidebar} />
      <AdSidebar isOpen={isSidebarOpen} onLogout={onLogout} />

      <div className={styles.content}>
        {/* Training Details Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Training Details</h2>
          <div className={styles.cardContent}>
            {selectedCompanies.length === 0 ? (
              <div className={styles.formRow}>
                <button
                  type="button"
                  onClick={handleAddCompany}
                  className={styles.addBtn}
                  disabled={isLoadingCompanies || isViewMode}
                >
                  <span className={styles.addIcon}>+</span> Add Company
                </button>
              </div>
            ) : (
              <>
                {selectedCompanies.map((item, index) => (
                  <div key={item.id} className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.fieldLabel}>Select Company</label>
                      <select
                        value={item.company}
                        onChange={(e) => handleCompanySelect(item.id, e.target.value)}
                        className={styles.control}
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
                        value={item.companyHR}
                        readOnly
                        placeholder="Auto-fetched"
                        className={styles.control}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.fieldLabel}>Location</label>
                      <input
                        type="text"
                        value={item.companyLocation}
                        readOnly
                        placeholder="Auto-fetched"
                        className={styles.control}
                      />
                    </div>

                    {!isViewMode && (
                      <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveCompany(item.id)}
                          className={styles.removeCompanyBtn}
                          title="Remove this company"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {!isViewMode && (
                  <div className={styles.formRow}>
                    <button
                      type="button"
                      onClick={handleAddCompany}
                      className={styles.addBtn}
                      disabled={isLoadingCompanies}
                    >
                      <span className={styles.addIcon}>+</span> Add Another Company
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Phase Details Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Phase Details</h2>
          <div className={styles.cardContent}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Phase Number</label>
                <div className={styles.phasePrefixInput}>
                  <span className={styles.phasePrefixChip}>Phase</span>
                  <input
                    type="text"
                    value={phaseNumber}
                    onChange={(e) => setPhaseNumber(normalizePhaseNumber(e.target.value))}
                    placeholder="e.g. 1"
                    className={`${styles.control} ${styles.phaseNumberControl}`}
                    disabled={isViewMode}
                    inputMode="numeric"
                    pattern="[0-9]*"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Training Name</label>
                <input
                  type="text"
                  value={trainingName}
                  onChange={(e) => setTrainingName(e.target.value)}
                  placeholder="e.g. Technical"
                  className={styles.control}
                  disabled={isViewMode}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Applicable Year</label>
                <select
                  value={applicableYear}
                  onChange={(e) => setApplicableYear(e.target.value)}
                  className={styles.control}
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
                <label className={styles.fieldLabel}>Start Date</label>
                <Ad_Calendar value={startDate} onChange={setStartDate} disabled={isViewMode} />
              </div>

              <div className={`${styles.formGroup} ${styles.calendarField}`}>
                <label className={styles.fieldLabel}>End Date</label>
                <Ad_Calendar value={endDate} onChange={setEndDate} disabled={isViewMode} />
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
          <div className={styles.cardContent}>
            {selectedCompanies.length === 0 ? (
              <p className={styles.noDataText}>Please add companies first to view available courses</p>
            ) : (
              <div className={styles.companiesCoursesContainer}>
                {selectedCompanies.map((companyItem, companyIndex) => {
                  const trainingInfo = trainingRecords.find(
                    (record) => (record?.companyName || '').toString().trim().toLowerCase() === (companyItem.company || '').trim().toLowerCase()
                  );
                  
                  const coursesList = Array.isArray(trainingInfo?.courses)
                    ? trainingInfo.courses
                        .map(c => (c?.name || c?.courseName || (typeof c === 'string' ? c : '')).toString().trim())
                        .filter(Boolean)
                    : [];

                  return (
                    <div key={companyItem.id}>
                      {companyIndex > 0 && <div className={styles.companySeparator}></div>}
                      <div className={styles.companySection}>
                        <h3 className={styles.companyName}>{companyItem.company || 'Select Company'}</h3>
                        {coursesList.length === 0 ? (
                          <p className={styles.noDataText}>No courses available for this company</p>
                        ) : (
                          <div className={styles.coursesGrid}>
                            {coursesList.map((course, idx) => (
                              <label key={idx} className={styles.courseItem}>
                                <input
                                  type="checkbox"
                                  checked={selectedCourses.includes(course)}
                                  onChange={() => handleCourseToggleWithCompany(companyItem, course)}
                                  className={styles.courseCheckbox}
                                  disabled={isViewMode || !companyItem.company}
                                />
                                <span className={styles.courseName}>{course}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>

        

        {!isViewMode && (
          <div className={styles.actions}>
            <button type="button" className={styles.discardBtn} onClick={handleDiscard} disabled={isSaving}>Discard</button>
            <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}

        {showTrainerPopup && (
          <div className={styles.trainerPopupOverlay} onClick={closeTrainerPopup}>
            <div className={styles.trainerPopupContainer} onClick={(e) => e.stopPropagation()}>
              <div className={styles.trainerPopupHeader}>Trainers</div>
              <div className={styles.trainerPopupBody}>
                <p className={styles.trainerPopupCourse}>Course: {activeCourseForTrainers}</p>
                {trainersForActiveCourse.length === 0 ? (
                  <p className={styles.noDataText}>No trainers mapped for this course</p>
                ) : (
                  <div className={styles.trainerPopupList}>
                    {trainersForActiveCourse.map((trainerName) => (
                      <label key={trainerName} className={styles.trainerRow}>
                        <input
                          type="checkbox"
                          className={styles.trainerCheckbox}
                          checked={pendingTrainerSelection.includes(trainerName)}
                          onChange={() => handleTrainerSelectionToggle(trainerName)}
                        />
                        <span className={styles.trainerName}>{trainerName}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.trainerPopupFooter}>
                <button type="button" className={styles.trainerPopupCloseBtn} onClick={closeTrainerPopup}>Close</button>
                <button type="button" className={styles.trainerPopupSelectBtn} onClick={applyTrainerSelection}>Select</button>
              </div>
            </div>
          </div>
        )}

        {alertPopup.isOpen && (
          <div className={styles.alertPopupOverlay} onClick={closeAlertPopup}>
            <div className={styles.alertPopupContainer} onClick={(e) => e.stopPropagation()}>
              <div className={`${styles.alertPopupHeader} ${styles[`alertPopupHeader${alertPopup.type.charAt(0).toUpperCase()}${alertPopup.type.slice(1)}`]}`}>
                {alertPopup.title}
              </div>
              <div className={styles.alertPopupBody}>
                <div className={styles.alertPopupContent}>
                  <div className={`${styles.alertPopupIconWrapper} ${styles[`alertPopupIconWrapper${alertPopup.type.charAt(0).toUpperCase()}${alertPopup.type.slice(1)}`]}`}>
                    {alertPopup.type === 'success' ? (
                      <svg className={styles.alertPopupSuccessIcon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" aria-hidden="true">
                        <circle className={styles.alertPopupSuccessCircle} cx="26" cy="26" r="25" fill="none" />
                        <path className={styles.alertPopupSuccessCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                      </svg>
                    ) : (
                      <span className={styles.alertPopupIcon}>
                        {alertPopup.type === 'error' ? '!' : 'i'}
                      </span>
                    )}
                  </div>
                  <h3 className={styles.alertPopupTitle}>{alertPopup.title} !</h3>
                  <p className={styles.alertPopupText}>{alertPopup.message}</p>
                </div>
              </div>
              <div className={styles.alertPopupFooter}>
                <button type="button" className={styles.alertPopupCloseBtn} onClick={closeAlertPopup}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminScheduleTraining;
