import React, { useEffect, useState } from 'react';
import styles from './Admin_TrainerDetailsPopup.module.css';

const RequiredStar = () => <span style={{ color: '#e84343', marginLeft: '4px' }}>*</span>;

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
    mobile.length === 10 &&
    Boolean(email.trim()) &&
    Boolean(gender) &&
    assignedCourses.length > 0 &&
    assignedCourses.every((course) => Boolean((course || '').toString().trim()));

  const handleMobileChange = (e) => {
    let value = e.target.value;
    // Remove leading zeros
    value = value.replace(/^0+/, '');
    // Only allow digits
    value = value.replace(/\D/g, '');
    // Must start with 6, 7, 8, or 9
    if (value.length > 0 && !/^[6-9]/.test(value)) {
      value = '';
    }
    // Limit to 10 digits
    value = value.substring(0, 10);
    setMobile(value);
  };

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
              <label className={styles['form-label']}>Trainer Name <RequiredStar /></label>
              <input
                type="text"
                placeholder="Enter trainer name"
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                className={styles['form-input']}
              />
            </div>

            <div className={styles['form-group']}>
              <label className={styles['form-label']}>Mobile Number <RequiredStar /></label>
              <div className={styles['mobileInputWrapper']}>
                <div className={styles['countryCode']}>+91</div>
                <input
                  type="tel"
                  placeholder="Enter mobile number"
                  value={mobile}
                  onChange={handleMobileChange}
                  className={styles['mobileNumberInput']}
                />
              </div>
            </div>
            <div className={styles['form-group']}>
            <label className={styles['form-label']}>Email Address <RequiredStar /></label>
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles['form-input']}
              />
            </div>
            <div className={styles['form-group']}>
            <label className={styles['form-label']}>Gender <RequiredStar /></label>
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
              <label className={styles['form-label']}>Assigned Course(s) <RequiredStar /></label>
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
