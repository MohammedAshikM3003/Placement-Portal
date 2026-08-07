import React, { useEffect, useMemo, useState } from 'react';
import styles from './Admin_PhaseDetailPopup.module.css';

const Admin_PhaseDetailPopup = ({ isOpen, onClose, onSave, courseOptions = [], initialData = null }) => {
  const [phaseNumber, setPhaseNumber] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([]);

  const normalizedCourseOptions = useMemo(() => {
    return [...new Set(
      (Array.isArray(courseOptions) ? courseOptions : [])
        .map((option) => (option || '').toString().trim())
        .filter(Boolean)
    )];
  }, [courseOptions]);

  const isFormValid = Boolean(phaseNumber.trim()) && selectedCourses.length > 0;

  useEffect(() => {
    if (!isOpen) return;

    // Handle both valid objects and corrupted data
    let initialPhaseNumber = '';
    let initialCourses = [];
    
    if (initialData && typeof initialData === 'object') {
      initialPhaseNumber = (initialData?.phaseNumber || '').toString().trim();
      initialCourses = Array.isArray(initialData?.applicableCourses)
        ? initialData.applicableCourses
            .map((course) => (course || '').toString().trim())
            .filter(Boolean)
        : [];
    }

    setPhaseNumber(initialPhaseNumber);
    setSelectedCourses(initialCourses);
  }, [isOpen, initialData]);

  const handleDiscard = () => {
    setPhaseNumber('');
    setSelectedCourses([]);
    onClose();
  };

  const handleCourseToggle = (courseName) => {
    setSelectedCourses((prev) => {
      if (prev.includes(courseName)) {
        return prev.filter((item) => item !== courseName);
      }
      return [...prev, courseName];
    });
  };

  const handleSave = () => {
    if (!isFormValid) {
      alert('Please enter phase number and select at least one applicable training');
      return;
    }

    const phaseData = {
      phaseNumber: phaseNumber.trim(),
      applicableCourses: selectedCourses
    };

    console.log('Phase popup - saving data:', phaseData);
    console.log('Phase popup - data type check:', {
      phaseNumber: phaseNumber.trim(),
      phaseNumberType: typeof phaseNumber.trim(),
      applicableCourses: selectedCourses,
      isArray: Array.isArray(selectedCourses),
      courses: selectedCourses.map(c => ({ course: c, type: typeof c }))
    });

    onSave(phaseData);

    handleDiscard();
  };

  if (!isOpen) return null;

  return (
    <div className={styles['popup-overlay']}>
      <div className={styles['popup-container']}>
        <div className={styles['popup-header']}>
          <h3>Phase Details</h3>
        </div>

        <div className={styles['popup-content']}>
          <div className={styles['form-group']}>
            <label>Phase Number</label>
            <input
              type="text"
              placeholder="Enter phase number"
              value={phaseNumber}
              onChange={(e) => setPhaseNumber(e.target.value)}
              className={styles['form-input']}
            />
          </div>

          <div className={styles['checkbox-card']}>
            <span className={styles['checkbox-card-label']}>Preferred Training</span>
            <div className={styles['checkbox-options']}>
              {normalizedCourseOptions.length === 0 ? (
                <div className={styles['empty-state']}>No training courses available for the selected company.</div>
              ) : (
                normalizedCourseOptions.map((option) => (
                  <label key={option} className={styles['checkbox-option']}>
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(option)}
                      onChange={() => handleCourseToggle(option)}
                    />
                    <span>{option}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={styles['popup-footer']}>
          <button onClick={handleDiscard} className={styles['discard-btn']}>
            Discard
          </button>
          <button onClick={handleSave} className={styles['save-btn']} disabled={!isFormValid}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Admin_PhaseDetailPopup;
