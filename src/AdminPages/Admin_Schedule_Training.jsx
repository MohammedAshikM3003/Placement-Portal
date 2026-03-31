import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdNavbar from '../components/Navbar/Adnavbar';
import AdSidebar from '../components/Sidebar/Adsidebar';
import styles from './Admin_Schedule_Training.module.css';
import Ad_Calendar from '../components/Calendar/Ad_Calendar';
import mongoDBService from '../services/mongoDBService';

const AdminScheduleTraining = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const scheduleMode = (searchParams.get('mode') || 'new').toLowerCase();
  const isEditMode = scheduleMode === 'edit';
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
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [applicableYear, setApplicableYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [duration, setDuration] = useState('');
  const [trainers, setTrainers] = useState([]);

  // Preferred Training state
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);

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
      setSelectedTrainer('');
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
        setSelectedTrainer('');
        setApplicableYear('');
        setStartDate('');
        setEndDate('');
        setDuration('');
        setSelectedCourses([]);
        return;
      }

      if (!isEditMode) {
        setCurrentScheduleId('');
        setPhaseNumber('');
        setSelectedTrainer('');
        setApplicableYear('');
        setStartDate('');
        setEndDate('');
        setDuration('');
        setSelectedCourses([]);
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
          setSelectedTrainer(firstPhase.trainer || '');
          setApplicableYear(firstPhase.applicableYear || '');
          setStartDate(firstPhase.startDate || '');
          setEndDate(firstPhase.endDate || '');
          setDuration(firstPhase.duration || '');
          setSelectedCourses(Array.isArray(firstPhase.applicableCourses) ? firstPhase.applicableCourses : []);
        } else {
          setCurrentScheduleId('');
          setPhaseNumber('');
          setSelectedTrainer('');
          setApplicableYear('');
          setStartDate('');
          setEndDate('');
          setDuration('');
          setSelectedCourses([]);
        }
      } catch (error) {
        console.error('Failed to load schedule for company:', error);
        setCurrentScheduleId('');
        setPhaseNumber('');
        setSelectedTrainer('');
        setApplicableYear('');
        setStartDate('');
        setEndDate('');
        setDuration('');
        setSelectedCourses([]);
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

  const handleDiscard = () => {
    setCurrentScheduleId('');
    setCompany('');
    setCompanyHR('');
    setCompanyLocation('');
    setPhaseNumber('');
    setSelectedTrainer('');
    setApplicableYear('');
    setStartDate('');
    setEndDate('');
    setDuration('');
    setSelectedCourses([]);
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

    if (!selectedTrainer) {
      alert('Please select a trainer');
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
      trainer: selectedTrainer,
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
      phases: phasesToSave
    };

    console.log('Final payload being sent:', JSON.stringify(payload, null, 2));

    setIsSaving(true);
    try {
      await mongoDBService.createScheduledTraining(payload);
      alert('Schedule training saved successfully');
      handleDiscard();
    } catch (error) {
      console.error('Failed to save schedule training:', error);
      alert(error.message || 'Failed to save schedule training');
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
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Select Company</label>
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={styles.control}
                  disabled={isLoadingCompanies}
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
                <label className={styles.fieldLabel}>Enter Phase Number</label>
                <input
                  type="text"
                  value={phaseNumber}
                  onChange={(e) => setPhaseNumber(e.target.value)}
                  placeholder="e.g., Phase 1"
                  className={styles.control}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Trainer</label>
                <select
                  value={selectedTrainer}
                  onChange={(e) => setSelectedTrainer(e.target.value)}
                  className={styles.control}
                  disabled={!company || trainers.length === 0}
                >
                  <option value="">Select Trainer</option>
                  {trainers.map((trainer, idx) => (
                    <option key={idx} value={trainer.name}>
                      {trainer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Applicable Year</label>
                <select
                  value={applicableYear}
                  onChange={(e) => setApplicableYear(e.target.value)}
                  className={styles.control}
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
                <Ad_Calendar value={startDate} onChange={setStartDate} />
              </div>

              <div className={`${styles.formGroup} ${styles.calendarField}`}>
                <label className={styles.fieldLabel}>End Date</label>
                <Ad_Calendar value={endDate} onChange={setEndDate} />
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
            {!company ? (
              <p className={styles.noDataText}>Please select a company first to view available courses</p>
            ) : availableCourses.length === 0 ? (
              <p className={styles.noDataText}>No courses available for selected company</p>
            ) : (
              <div className={styles.coursesGrid}>
                {availableCourses.map((course, idx) => (
                  <label key={idx} className={styles.courseItem}>
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(course)}
                      onChange={() => handleCourseToggle(course)}
                      className={styles.courseCheckbox}
                    />
                    <span className={styles.courseName}>{course}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.discardBtn} onClick={handleDiscard} disabled={isSaving}>Discard</button>
          <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminScheduleTraining;
