import React, { useEffect, useState } from 'react';
import styles from './Admin_TrainerDetailsPopup.module.css';

const Admin_TrainerDetailsPopup = ({ isOpen, onClose, onSave, initialData = null, submitLabel = 'Save' }) => {
  const [trainerName, setTrainerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setTrainerName((initialData?.name || '').toString());
      setMobile((initialData?.mobile || '').toString());
      setEmail((initialData?.email || '').toString());
      setGender((initialData?.gender || '').toString());
      return;
    }

    setTrainerName('');
    setMobile('');
    setEmail('');
    setGender('');
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
    onClose();
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
      gender
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
