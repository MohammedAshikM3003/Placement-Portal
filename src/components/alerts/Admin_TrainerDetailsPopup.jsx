import React, { useEffect, useState } from 'react';
import styles from './Admin_TrainerDetailsPopup.module.css';

const Admin_TrainerDetailsPopup = ({ isOpen, onClose, onSave, initialData = null, submitLabel = 'Save', availableCourses = [] }) => {
  const [trainerName, setTrainerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [assignedCourses, setAssignedCourses] = useState(['']);

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setTrainerName((initialData?.name || '').toString());
      setMobile((initialData?.mobile || '').toString());
      setEmail((initialData?.email || '').toString());
      setGender((initialData?.gender || '').toString());
      const initialCourses = Array.isArray(initialData?.courses)
        ? initialData.courses.map((course) => (course || '').toString()).filter(Boolean)
        : [];
      setAssignedCourses(initialCourses.length > 0 ? initialCourses : ['']);
      return;
    }

    setTrainerName('');
    setMobile('');
    setEmail('');
    setGender('');
    setAssignedCourses(['']);
  }, [isOpen, initialData]);

  const isFormValid =
    Boolean(trainerName.trim()) &&
    Boolean(mobile.trim()) &&
    Boolean(email.trim()) &&
    Boolean(gender);

  const handleDiscard = () => {
    setTrainerName('');
    setMobile('');
    setEmail('');
    setGender('');
    setAssignedCourses(['']);
    onClose();
  };

  const handleCourseChange = (index, value) => {
    setAssignedCourses((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddCourseField = () => {
    setAssignedCourses((prev) => [...prev, '']);
  };

  const handleRemoveCourseField = (index) => {
    setAssignedCourses((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      return next.length > 0 ? next : [''];
    });
  };

  const handleSave = () => {
    if (!isFormValid) {
      alert('Please fill in all required fields');
      return;
    }
    
    const trainerData = {
      name: trainerName,
      mobile,
      email,
      gender,
      courses: assignedCourses.map((course) => (course || '').toString().trim()).filter(Boolean)
    };
    
    onSave(trainerData);
    handleDiscard();
  };

  if (!isOpen) return null;

  return (
    <div className={styles['popup-overlay']}>
      <div className={styles['popup-container']}>
        <div className={styles['popup-header']}>
          <h3>Trainer Details</h3>
         
        </div>
        
        <div className={styles['popup-content']}>
          <div className={styles['form-grid']}>
            <div className={styles['form-group']}>
              <label className={styles['form-label']}>Trainer Name</label>
              <input
                type="text"
                placeholder="Enter trainer name"
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                className={styles['form-input']}
              />
            </div>

            <div className={styles['form-group']}>
            <label className={styles['form-label']}>Mobile Number</label>
              <input
                type="tel"
                placeholder="Enter mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className={styles['form-input']}
              />
            </div>
            <div className={styles['form-group']}>
            <label className={styles['form-label']}>Email Address</label>
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles['form-input']}
              />
            </div>
            <div className={styles['form-group']}>
            <label className={styles['form-label']}>Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={styles['form-input']}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className={`${styles['form-group']} ${styles['full-width']}`}>
              <label className={styles['form-label']}>Assigned Course(s)</label>
              <div className={styles['course-list']}>
                {assignedCourses.map((courseValue, index) => (
                  <div className={styles['course-row']} key={`trainer-course-${index}`}>
                    <select
                      value={courseValue}
                      onChange={(e) => handleCourseChange(index, e.target.value)}
                      className={`${styles['form-input']} ${styles['course-select']}`}
                    >
                      <option value="">Select course</option>
                      {availableCourses.map((courseName) => (
                        <option key={`${courseName}-${index}`} value={courseName}>{courseName}</option>
                      ))}
                    </select>
                    {assignedCourses.length > 1 && (
                      <button
                        type="button"
                        className={styles['remove-course-btn']}
                        onClick={() => handleRemoveCourseField(index)}
                        aria-label="Remove course"
                      >
                        x
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className={styles['add-course-btn']}
                  onClick={handleAddCourseField}
                >
                  + Add Course
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className={styles['popup-footer']}>
          <button onClick={handleDiscard} className={styles['discard-btn']}>
            Discard
          </button>
          <button onClick={handleSave} className={styles['save-btn']} disabled={!isFormValid}>
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Admin_TrainerDetailsPopup;
