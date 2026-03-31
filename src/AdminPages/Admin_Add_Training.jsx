import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './Admin_Add_Training.module.css';
import Adnavbar from '../components/Navbar/Adnavbar';
import Adsidebar from '../components/Sidebar/Adsidebar';
import Admin_TrainerDetailsPopup from '../components/alerts/Admin_TrainerDetailsPopup';
import useAdminAuth from '../utils/useAdminAuth';
import mongoDBService from '../services/mongoDBService';

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

  // track sidebar visibility so hamburger toggle works
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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

  useEffect(() => {
    if (!editingTraining) {
      setEditingTrainingId('');
      return;
    }

    setEditingTrainingId((editingTraining._id || '').toString());
    setCompanyName((editingTraining.companyName || '').toString());
    setCompanyLocation((editingTraining.location || editingTraining.companyLocation || editingTraining.companyInfo || '').toString());
    setCompanyHRName((editingTraining.companyHRName || editingTraining.companyHR || '').toString());
    setCourses(Array.isArray(editingTraining.courses) ? editingTraining.courses : []);
    setTrainers(Array.isArray(editingTraining.trainers) ? editingTraining.trainers : []);
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
    <div className={styles['Admin-aat-outer-wrapper']}>
      <Adnavbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={styles['Admin-aat-layout']}>
        <Adsidebar isOpen={isSidebarOpen} />
        <div className={styles['Admin-aat-main-wrapper']}>
      {/* Company Details Card */}
      <div className={styles['Admin-aat-card']}>
        <h2 className={styles['Admin-aat-section-header']}>Company Details</h2>
        <div className={styles['Admin-aat-form-grid']}>
          <div className={styles['Admin-aat-field']}>
            <label htmlFor="companyName">Company Name <span className={styles['Admin-aat-required']}>*</span></label>
            <input
              id="companyName"
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
              <button className={styles['Admin-aat-add-btn']} onClick={handleAddCourseClick}>
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
              <button className={styles['Admin-aat-add-btn']} onClick={handleAddTrainerClick}>
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

      <div className={styles['Admin-aat-actions']}>
        <button className={styles['Admin-aat-discard-btn']} onClick={handleDiscard}>Discard</button>
        <button className={styles['Admin-aat-save-btn']} onClick={handleSave} disabled={isSaving}>
          {isSaving ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
        </button>
      </div>
        </div>
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
      />

      {showSuccessPopup && <TrainingSavedPopup onClose={() => setShowSuccessPopup(false)} mode={successMode} />}
    </div>
  );
};
export default Admin_Add_Training;