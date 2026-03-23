import React, { useState } from 'react';
import styles from './Admin_BatchDetailPopup.module.css';

const Admin_BatchDetailPopup = ({ isOpen, onClose, onSave }) => {
  const [batchName, setBatchName] = useState('');
  const [courseName, setCourseName] = useState('');
 



  const isFormValid =
    Boolean(batchName.trim()) &&
    Boolean(courseName) ;

  const handleDiscard = () => {
    setBatchName('');
    setCourseName('');
    onClose();
  };

  const handleSave = () => {
    if (!isFormValid) {
      alert('Please fill in all required fields');
      return;
    }
    
    const batchData = {
      batchName,
      courseName
    };
    
    onSave(batchData);
    handleDiscard();
  };

  if (!isOpen) return null;

  return (
    <div className={styles['popup-overlay']}>
      <div className={styles['popup-container']}>
        <div className={styles['popup-header']}>
          <h3>Batch Details</h3>
        </div>
        
        <div className={styles['popup-content']}>
          <div className={styles['form-grid']}>
            <div className={styles['form-group']}>
              <label>Batch Name</label>
              <input
                type="text"
                placeholder="Enter batch name"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                className={styles['form-input']}
              />
            </div>

            <div className={styles['form-group']}>
              <label>Applicable Years</label>
              <select
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                className={styles['form-input']}
              >
                <option value="">Select Year</option>
                <option value="React Development">I</option>
                <option value="Node.js">II</option>
                <option value="JavaScript">III</option>
                <option value="HTML/CSS">IV</option>
              </select>
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

export default Admin_BatchDetailPopup;
