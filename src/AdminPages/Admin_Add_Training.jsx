import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Admin_Add_Training.module.css';
import Adnavbar from '../components/Navbar/Adnavbar';
import Adsidebar from '../components/Sidebar/Adsidebar';
import Admin_TrainerDetailsPopup from '../components/alerts/Admin_TrainerDetailsPopup';
import useAdminAuth from '../utils/useAdminAuth';
import mongoDBService from '../services/mongoDBService';
import PageLayout from '../components/layout/PageLayout/PageLayout';
import { CertificateDownloadProgressAlert } from '../components/alerts/DownloadPreviewAlerts';

const TrainingSavedPopup = ({ onClose, mode = 'create' }) => {
  const isUpdate = mode === 'update';

  return (
    <div className={styles['Admin-aat-Success-overlay']} onClick={onClose}>
      <div className={styles['Admin-aat-Success-container']} onClick={(e) => e.stopPropagation()}>
        <div className={styles['Admin-aat-Success-header']}>
          {isUpdate ? 'Updated !' : 'Saved !'}
        </div>
        <div className={styles['Admin-aat-Success-content']}>
          <div className={styles['Admin-aat-Success-icon-wrapper']}>
            <svg className={styles['Admin-aat-Success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className={styles['Admin-aat-Success-icon-circle']} cx="26" cy="26" r="25" fill="none"/>
              <path className={styles['Admin-aat-Success-icon-check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
          <h3 className={styles['Admin-aat-Success-title']}>
            {isUpdate ? 'Training Updated ✓' : 'Training Saved ✓'}
          </h3>
          <p className={styles['Admin-aat-Success-text']}>
            {isUpdate
              ? 'Training details have been successfully updated in the portal'
              : 'Training details have been successfully saved in the portal'}
          </p>
        </div>
        <div className={styles['Admin-aat-Success-footer']}>
          <button className={styles['Admin-aat-Success-close-btn']} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const Admin_Add_Training = () => {
  useAdminAuth(); // JWT authentication verification
  const location = useLocation();
  const navigate = useNavigate();
  const editingTraining = location?.state?.editMode ? (location?.state?.editingTraining || null) : null;
  const isEditMode = Boolean(editingTraining?._id);

  const [companyName, setCompanyName] = useState('');
  const [companyLocation, setCompanyLocation] = useState('');
  const [companyHRName, setCompanyHRName] = useState('');
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [editingTrainingId, setEditingTrainingId] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMode, setSuccessMode] = useState('create');
  const [isInitialLoading, setIsInitialLoading] = useState(() => isEditMode);
  const [loadingProgress, setLoadingProgress] = useState(15);

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
    if (!companyName.trim()) {
      missing.push({ field: 'companyName', label: 'Company Name' });
    }
    if (courses.length === 0) {
      missing.push({ field: 'courses', label: 'Minimum one course' });
    }
    if (trainers.length === 0) {
      missing.push({ field: 'trainers', label: 'Minimum one trainer' });
    }
    return missing;
  }, [companyName, courses, trainers]);


  
  // popup visibility states
  const [showTrainerPopup, setShowTrainerPopup] = useState(false);
  const [editingTrainerIndex, setEditingTrainerIndex] = useState(null);

  const handleAddCourseClick = () => {
    setCourses((prevCourses) => ([
      ...prevCourses,
      {
        name: '',
        syllabus: [],
        durationStart: '',
        durationEnd: ''
      }
    ]));
  };

  const handleAddTrainerClick = () => {
    setEditingTrainerIndex(null);
    setShowTrainerPopup(true);
  };

  const handleEditTrainerClick = (index) => {
    setEditingTrainerIndex(index);
    setShowTrainerPopup(true);
  };

  const handleCourseNameChange = (index, value) => {
    setCourses((prevCourses) => {
      const updatedCourses = [...prevCourses];
      const current = updatedCourses[index] || {};
      updatedCourses[index] = {
        ...current,
        name: value
      };
      return updatedCourses;
    });
  };

  const handleTrainerSave = (trainerData) => {
    if (editingTrainerIndex !== null) {
      const updatedTrainers = [...trainers];
      updatedTrainers[editingTrainerIndex] = trainerData;
      setTrainers(updatedTrainers);
      setEditingTrainerIndex(null);
      return;
    }

    setTrainers([...trainers, trainerData]);
  };

  const handleRemoveCourse = (index) => {
    const updated = courses.filter((_, i) => i !== index);
    setCourses(updated);
  };

  const handleRemoveTrainer = (index) => {
    const updated = trainers.filter((_, i) => i !== index);
    setTrainers(updated);
    if (editingTrainerIndex === index) {
      setEditingTrainerIndex(null);
    }
  };

  const handleDiscard = () => {
    setCompanyName('');
    setCompanyLocation('');
    setCompanyHRName('');
    setCourses([]);
    setTrainers([]);
  };

  // Dynamic progress loader logic matching student profile edit page
  useEffect(() => {
    if (!isInitialLoading) return undefined;

    setLoadingProgress(15);
    const timer = window.setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 95) return 95;
        if (prev < 50) return prev + 12;
        if (prev < 80) return prev + 6;
        return prev + 3;
      });
    }, 150);

    return () => window.clearInterval(timer);
  }, [isInitialLoading]);

  // Sync editingTraining initially and fetch fresh database values
  useEffect(() => {
    if (!editingTraining) {
      setEditingTrainingId('');
      return;
    }

    const tId = (editingTraining._id || '').toString();
    setEditingTrainingId(tId);

    // Set initial values from state to ensure fast render
    setCompanyName((editingTraining.companyName || '').toString());
    setCompanyLocation((editingTraining.location || editingTraining.companyLocation || editingTraining.companyInfo || '').toString());
    setCompanyHRName((editingTraining.companyHRName || editingTraining.companyHR || '').toString());
    setCourses(Array.isArray(editingTraining.courses) ? editingTraining.courses : []);
    setTrainers(Array.isArray(editingTraining.trainers) ? editingTraining.trainers : []);

    let isSubscribed = true;
    const fetchLatestTraining = async () => {
      try {
        // Fetch all training records to get the absolute fresh version of this training
        const trainingsList = await mongoDBService.getTrainings();
        if (!isSubscribed) return;

        const freshTraining = trainingsList.find(t => (t._id || '').toString() === tId);
        if (freshTraining) {
          setCompanyName((freshTraining.companyName || '').toString());
          setCompanyLocation((freshTraining.location || freshTraining.companyLocation || freshTraining.companyInfo || '').toString());
          setCompanyHRName((freshTraining.companyHRName || freshTraining.companyHR || '').toString());
          setCourses(Array.isArray(freshTraining.courses) ? freshTraining.courses : []);
          setTrainers(Array.isArray(freshTraining.trainers) ? freshTraining.trainers : []);
        }
      } catch (err) {
        console.error("Failed to load fresh training details:", err);
      } finally {
        if (isSubscribed) {
          setLoadingProgress(100);
          setTimeout(() => {
            if (isSubscribed) {
              setIsInitialLoading(false);
            }
          }, 300);
        }
      }
    };

    setIsInitialLoading(true);
    fetchLatestTraining();

    return () => {
      isSubscribed = false;
    };
  }, [editingTraining]);

  const handleSave = async () => {
    if (!companyName.trim()) {
      alert('Please enter company name');
      return;
    }

    const payload = {
      companyName: companyName.trim(),
      location: companyLocation.trim(),
      companyHR: companyHRName.trim(),
      companyHRName: companyHRName.trim(),
      courses,
      trainers
    };

    setIsSaving(true);
    try {
      if (isEditMode && editingTrainingId) {
        await mongoDBService.updateTraining(editingTrainingId, payload);
        setSuccessMode('update');
      } else {
        await mongoDBService.createTraining(payload);
        setSuccessMode('create');
        handleDiscard();
      }
      setShowSuccessPopup(true);
    } catch (error) {
      console.error('Failed to save/update training details:', error);
      alert(error.message || 'Failed to save/update training details');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageLayout navbar={<Adnavbar />} sidebar={<Adsidebar />}>
      {/* Company Details Card */}
      <div className={styles['Admin-aat-card']}>
        <h2 className={styles['Admin-aat-section-header']}>Company Details</h2>
        <div className={styles['Admin-aat-form-grid']}>
          <div className={styles['Admin-aat-field']}>
            <label htmlFor="companyName">Company Name <span className={styles['Admin-aat-required']}>*</span></label>
            <input
              id="companyName"
              ref={registerFieldRef('companyName')}
              className={highlightedField === 'companyName' ? styles.fieldHighlight : ''}
              type="text"
              placeholder="Enter company name"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
            />
          </div>
          <div className={styles['Admin-aat-field']}>
            <label htmlFor="companyHRName">Company HR Name</label>
            <input
              id="companyHRName"
              type="text"
              placeholder="Enter HR name"
              value={companyHRName}
              onChange={e => setCompanyHRName(e.target.value)}
            />
          </div>
          <div className={styles['Admin-aat-field']}>
            <label htmlFor="companyLocation">Company Location</label>
            <input
              id="companyLocation"
              type="text"
              placeholder="Enter location"
              value={companyLocation}
              onChange={e => setCompanyLocation(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Course Details Card */}
      <div className={styles['Admin-aat-card']}>
        <h2 className={styles['Admin-aat-section-header']}>Course Details</h2>
        <div className={styles['Admin-aat-form-grid']}>
          {courses.length === 0 ? (
            <div className={styles['Admin-aat-add-btn-wrapper']}>
              <button
                ref={registerFieldRef('courses')}
                className={`${styles['Admin-aat-add-btn']} ${highlightedField === 'courses' ? styles.fieldHighlight : ''}`}
                onClick={handleAddCourseClick}
              >
                <span className={styles['Admin-aat-plus']}>+</span> Click to Add Course
              </button>
            </div>
          ) : (
            <>
              {courses.map((course, idx) => (
                <div className={styles['Admin-aat-field']} key={idx}>
                  <label htmlFor={`course-${idx}`}>Course {idx + 1}</label>
                  <div className={styles['Admin-aat-input-with-remove']}>
                    <input
                      id={`course-${idx}`}
                      type="text"
                      placeholder="Enter course name"
                      value={course.name}
                      onChange={(e) => handleCourseNameChange(idx, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCourse(idx)}
                      className={styles['Admin-aat-remove-btn']}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              <div className={styles['Admin-aat-add-btn-wrapper']}>
                <button className={styles['Admin-aat-add-btn']} onClick={handleAddCourseClick}>
                  <span className={styles['Admin-aat-plus']}>+</span> Add More
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Trainer Details Card */}
      <div className={styles['Admin-aat-card']}>
        <h2 className={styles['Admin-aat-section-header']}>Trainer Details</h2>
        <div className={styles['Admin-aat-form-grid']}>
          {trainers.length === 0 ? (
            <div className={styles['Admin-aat-add-btn-wrapper']}>
              <button
                ref={registerFieldRef('trainers')}
                className={`${styles['Admin-aat-add-btn']} ${highlightedField === 'trainers' ? styles.fieldHighlight : ''}`}
                onClick={handleAddTrainerClick}
              >
                <span className={styles['Admin-aat-plus']}>+</span> Click to Add Trainer
              </button>
            </div>
          ) : (
            <>
              {trainers.map((trainer, idx) => (
                <div className={styles['Admin-aat-field']} key={idx}>
                  <label htmlFor={`trainer-${idx}`}>Trainer {idx + 1}</label>
                  <div className={styles['Admin-aat-input-with-remove']}>
                    <input
                      id={`trainer-${idx}`}
                      type="text"
                      placeholder="Trainer name"
                      value={trainer.name}
                      readOnly
                      className={styles['Admin-aat-static-input']}
                      onClick={() => handleEditTrainerClick(idx)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleEditTrainerClick(idx);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      title="Click to edit trainer"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTrainer(idx)}
                      className={styles['Admin-aat-remove-btn']}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              <div className={styles['Admin-aat-add-btn-wrapper']}>
                <button className={styles['Admin-aat-add-btn']} onClick={handleAddTrainerClick}>
                  <span className={styles['Admin-aat-plus']}>+</span> Add More
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {missingFields.length > 0 && (
        <div className={styles['Admin-aat-validation-box']}>
          <h4 className={styles['Admin-aat-validation-heading']}>
            <span className={styles['Admin-aat-validation-icon']} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" role="img" focusable="false">
                <path fill="currentColor" d="M1 21h22L12 2L1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
            </span>
            Required Fields Missing:
          </h4>
          <ul className={styles['Admin-aat-validation-list']}>
            {missingFields.map((error, index) => (
              <li
                key={`${error.field}-${index}`}
                className={styles['Admin-aat-validation-item']}
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

      <div className={styles['Admin-aat-actions']}>
        <button className={styles['Admin-aat-discard-btn']} onClick={handleDiscard}>Discard</button>
        <button className={styles['Admin-aat-save-btn']} onClick={handleSave} disabled={isSaving || missingFields.length > 0}>
          {isSaving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
        </button>
      </div>

      {/* Popup Components */}
      <Admin_TrainerDetailsPopup
        isOpen={showTrainerPopup}
        onClose={() => {
          setShowTrainerPopup(false);
          setEditingTrainerIndex(null);
        }}
        onSave={handleTrainerSave}
        initialData={editingTrainerIndex !== null ? trainers[editingTrainerIndex] : null}
        submitLabel={editingTrainerIndex !== null ? 'Update' : 'Save'}
        availableCourses={courses.map((course) => (course?.name || '').toString().trim()).filter(Boolean)}
      />

      {showSuccessPopup && (
        <TrainingSavedPopup
          onClose={() => {
            setShowSuccessPopup(false);
            navigate('/admin-training');
          }}
          mode={successMode}
        />
      )}

      <CertificateDownloadProgressAlert
        isOpen={isInitialLoading}
        progress={loadingProgress}
        fileLabel="company profile"
        title="Loading..."
        color="#4EA24E"
        progressColor="#4EA24E"
        messages={{
          initial: 'Fetching company details...',
          mid: 'Loading training syllabus...',
          final: 'Preparing page...'
        }}
      />

      {errorTooltip.visible && (
        <div
          className={styles.pointerTooltip}
          style={{ left: `${errorTooltip.x}px`, top: `${errorTooltip.y}px` }}
        >
          Click to navigate
        </div>
      )}
    </PageLayout>
  );
};
export default Admin_Add_Training;