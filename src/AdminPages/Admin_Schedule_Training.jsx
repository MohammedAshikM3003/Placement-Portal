import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdNavbar from '../components/Navbar/Adnavbar';
import AdSidebar from '../components/Sidebar/Adsidebar';
import styles from './Admin_Schedule_Training.module.css';
import Admin_BatchDetailPopup from '../components/alerts/Admin_BatchDetailPopup';
import Admin_PhaseDetailPopup from '../components/alerts/Admin_PhaseDetailPopup';
import mongoDBService from '../services/mongoDBService';

const AdminScheduleTraining = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const scheduleMode = (searchParams.get('mode') || 'new').toLowerCase();
  const isEditMode = scheduleMode === 'edit';
  const scheduleIdParam = (searchParams.get('scheduleId') || '').toString().trim();

  const [company, setCompany] = useState('');
  const [companies, setCompanies] = useState([]);
  const [trainingRecords, setTrainingRecords] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [currentScheduleId, setCurrentScheduleId] = useState('');

  const [phases, setPhases] = useState([]);
  const [isPhasePopupOpen, setIsPhasePopupOpen] = useState(false);
  const [editingPhaseIndex, setEditingPhaseIndex] = useState(null);

  const [batches, setBatches] = useState([]);
  const [isBatchPopupOpen, setIsBatchPopupOpen] = useState(false);

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

  // Load schedule data when company is selected in edit mode
  useEffect(() => {
    const loadScheduleForCompany = async () => {
      if (!company) {
        // Clear form when company is deselected
        setCurrentScheduleId('');
        setStartDate('');
        setEndDate('');
        setPhases([]);
        setBatches([]);
        return;
      }

      // In create mode, keep form fresh even when a company is selected.
      if (!isEditMode) {
        setCurrentScheduleId('');
        setStartDate('');
        setEndDate('');
        setPhases([]);
        setBatches([]);
        return;
      }

      setIsLoadingSchedule(true);
      try {
        const schedules = await mongoDBService.getScheduledTrainings();
        const normalizedSchedules = Array.isArray(schedules) ? schedules : [];
        
        // In edit mode, prefer exact schedule id to support multiple schedules for same company.
        const existingSchedule = scheduleIdParam
          ? normalizedSchedules.find((s) => (s?._id || '').toString() === scheduleIdParam)
          : normalizedSchedules.find(
              (s) => (s?.companyName || '').toString().trim() === company.trim()
            );

        if (existingSchedule) {
          setCurrentScheduleId((existingSchedule?._id || '').toString());
          // Pre-fill form with existing data
          setStartDate(existingSchedule.startDate || '');
          setEndDate(existingSchedule.endDate || '');
          
          // Ensure phases are proper objects, filter out any corrupted data
          const validPhases = (Array.isArray(existingSchedule.phases) 
            ? existingSchedule.phases
                .filter((phase) => {
                  // Skip invalid phases
                  if (!phase || typeof phase !== 'object') return false;
                  if (!phase.phaseNumber || typeof phase.phaseNumber !== 'string') return false;
                  if (!Array.isArray(phase.applicableCourses)) return false;
                  // Skip phases with corrupted course data
                  if (!phase.applicableCourses.every((course) => typeof course === 'string')) return false;
                  return true;
                })
                .map((phase) => ({
                  phaseNumber: phase.phaseNumber.trim(),
                  applicableCourses: phase.applicableCourses
                }))
            : []);
          
          setPhases(validPhases);
          setBatches(Array.isArray(existingSchedule.batches) ? existingSchedule.batches : []);
        } else {
          // Clear dates and phases/batches for new schedule
          setCurrentScheduleId('');
          setStartDate('');
          setEndDate('');
          setPhases([]);
          setBatches([]);
        }
      } catch (error) {
        console.error('Failed to load schedule for company:', error);
        setCurrentScheduleId('');
        setStartDate('');
        setEndDate('');
        setPhases([]);
        setBatches([]);
      } finally {
        setIsLoadingSchedule(false);
      }
    };

    loadScheduleForCompany();
  }, [company, isEditMode, scheduleIdParam]);

  const toggleSidebar = () => {
    setIsSidebarOpen((v) => !v);
  };

  const handleAddBatch = () => {
    setIsBatchPopupOpen(true);
  };

  const handleSaveBatch = (batchData) => {
    setBatches((prev) => [...prev, batchData]);
    setIsBatchPopupOpen(false);
  };

  const phaseCourseOptions = useMemo(() => {
    const targetCompany = (company || '').toString().trim();
    const relatedTrainings = targetCompany
      ? trainingRecords.filter((item) => (item?.companyName || '').toString().trim() === targetCompany)
      : trainingRecords;

    return [...new Set(
      relatedTrainings.flatMap((record) =>
        Array.isArray(record?.courses)
          ? record.courses
              .map((course) => (course?.name || '').toString().trim())
              .filter(Boolean)
          : []
      )
    )];
  }, [company, trainingRecords]);

  const handleAddPhase = () => {
    if (!company) {
      alert('Please select company before adding phase details');
      return;
    }

    if (!phaseCourseOptions.length) {
      alert('No courses found for selected company. Please add courses in Add Training page first.');
      return;
    }

    setEditingPhaseIndex(null);
    setIsPhasePopupOpen(true);
  };

  const handleEditPhase = (index) => {
    setEditingPhaseIndex(index);
    setIsPhasePopupOpen(true);
  };

  const handleSavePhase = (phaseData) => {
    console.log('handleSavePhase - received data:', phaseData);
    console.log('handleSavePhase - type check:', {
      phaseData,
      type: typeof phaseData,
      phaseNumber: phaseData?.phaseNumber,
      phaseNumberType: typeof phaseData?.phaseNumber,
      applicableCourses: phaseData?.applicableCourses,
      isArray: Array.isArray(phaseData?.applicableCourses)
    });

    setPhases((prev) => {
      if (editingPhaseIndex === null || editingPhaseIndex < 0 || editingPhaseIndex >= prev.length) {
        const newPhases = [...prev, phaseData];
        console.log('handleSavePhase - adding new phase. New phases array:', newPhases);
        return newPhases;
      }

      const updated = [...prev];
      updated[editingPhaseIndex] = phaseData;
      console.log('handleSavePhase - updated existing phase. Updated phases array:', updated);
      return updated;
    });
    setEditingPhaseIndex(null);
    setIsPhasePopupOpen(false);
  };

  const handleRemovePhase = (index) => {
    setPhases((prev) => prev.filter((_, i) => i !== index));
    if (editingPhaseIndex === index) {
      setEditingPhaseIndex(null);
    }
  };

  // If you want to allow renaming batches, you can add a handler here
  // const handleBatchRename = (idx, value) => {
  //   setBatches((prev) => {
  //     const updated = [...prev];
  //     updated[idx] = value;
  //     return updated;
  //   });
  // };

  const handleDiscard = () => {
    setCurrentScheduleId('');
    setCompany('');
    setStartDate('');
    setEndDate('');
    setPhases([]);
    setBatches([]);
  };

  const handleSave = async () => {
    if (!company) {
      alert('Please select company');
      return;
    }

    if (!startDate || !endDate) {
      alert('Please select start and end date');
      return;
    }

    if (!batches.length) {
      alert('Please add at least one batch');
      return;
    }

    // Debug: Log phases before sanitization
    console.log('Phases before sanitization:', phases);
    console.log('Phases type check:', phases.map(p => ({
      phase: p,
      type: typeof p,
      phaseNumber: p?.phaseNumber,
      phaseNumberType: typeof p?.phaseNumber,
      applicableCourses: p?.applicableCourses,
      isArray: Array.isArray(p?.applicableCourses)
    })));

    // Robust phase sanitization - remove any corrupted/invalid phases
    const sanitizedPhases = phases
      .filter((phase) => {
        // Must be a valid object
        if (!phase || typeof phase !== 'object') {
          console.warn('Invalid phase - not an object:', phase);
          return false;
        }

        // Must have phaseNumber as a string
        if (!phase.phaseNumber || typeof phase.phaseNumber !== 'string') {
          console.warn('Invalid phase - phaseNumber issue:', phase);
          return false;
        }

        // Must have applicableCourses as an array
        if (!Array.isArray(phase.applicableCourses)) {
          console.warn('Invalid phase - applicableCourses not array:', phase);
          return false;
        }

        // applicableCourses must contain only strings, no objects
        if (!phase.applicableCourses.every((course) => typeof course === 'string')) {
          console.warn('Invalid phase - courses contain non-strings:', phase);
          return false;
        }

        return true;
      })
      .map((phase) => ({
        phaseNumber: phase.phaseNumber.trim(),
        applicableCourses: phase.applicableCourses
          .map((course) => (course || '').toString().trim())
          .filter(Boolean)
      }))
      .filter((phase) => phase.phaseNumber && phase.applicableCourses.length > 0);

    console.log('Sanitized phases:', sanitizedPhases);

    if (!sanitizedPhases.length) {
      alert('Please add at least one phase with applicable trainings');
      return;
    }

    const payload = {
      ...(isEditMode && currentScheduleId ? { scheduleId: currentScheduleId } : {}),
      companyName: company,
      startDate,
      endDate,
      phases: sanitizedPhases,
      batches: batches.map((batch) => ({
        batchName: (batch?.batchName || '').toString().trim(),
        applicableYear: (batch?.applicableYear || batch?.courseName || '').toString().trim().toUpperCase()
      }))
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
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Training Details</h2>
          <div className={styles.cardContent}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
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
               
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`${styles.control} ${styles.dateControl}`}
                />
              </div>

              <div className={styles.formGroup}>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`${styles.control} ${styles.dateControl}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Phase Details</h2>
          <div className={styles.cardContent}>
            <div className={styles.formRow} style={{ flexWrap: 'wrap', gap: '24px' }}>
              {phases.map((phase, idx) => {
                // Ensure phase is a valid object
                const isValidPhase = phase && typeof phase === 'object' && phase.phaseNumber;
                const displayText = isValidPhase ? `Phase - ${phase.phaseNumber}` : `Invalid Phase`;
                
                return (
                  <div key={`${phase?.phaseNumber || `phase-${idx}`}-${idx}`} className={styles.phaseInputWrapper}>
                    <input
                      type="text"
                      value={displayText}
                      readOnly
                      className={styles.control}
                      onClick={() => handleEditPhase(idx)}
                      style={{ cursor: 'pointer' }}
                      title={isValidPhase ? 'Click to edit phase' : 'Invalid phase data'}
                    />
                    <button
                      type="button"
                      className={styles.removePhaseBtn}
                      onClick={() => handleRemovePhase(idx)}
                      aria-label={`Remove ${displayText}`}
                    >
                      ×
                    </button>
                  </div>
                );
              })}

              <button type="button" className={styles.addBtn} onClick={handleAddPhase}>
                <span className={styles.addIcon}>+</span> Click to Add Phase
              </button>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Batch Details</h2>
          <div className={styles.cardContent}>
            <div className={styles.formRow} style={{ flexWrap: 'wrap', gap: '24px' }}>
              {batches.map((batch, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.addBtn}
                  style={{ background: '#4caf50', color: '#fff', cursor: 'pointer' }}
                  onClick={() => navigate('/admin-schedule-training-batch')}
                >
                  {batch?.batchName || `Batch ${idx + 1}`}
                </button>
              ))}
              <button type="button" className={styles.addBtn} onClick={handleAddBatch}>
                <span className={styles.addIcon}>+</span> Click to Add Batch
              </button>
            </div>
          </div>
        </div>

        <Admin_BatchDetailPopup
          isOpen={isBatchPopupOpen}
          onClose={() => setIsBatchPopupOpen(false)}
          onSave={handleSaveBatch}
        />

        <Admin_PhaseDetailPopup
          isOpen={isPhasePopupOpen}
          onClose={() => {
            setIsPhasePopupOpen(false);
            setEditingPhaseIndex(null);
          }}
          onSave={handleSavePhase}
          courseOptions={phaseCourseOptions}
          initialData={editingPhaseIndex !== null ? phases[editingPhaseIndex] : null}
        />
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