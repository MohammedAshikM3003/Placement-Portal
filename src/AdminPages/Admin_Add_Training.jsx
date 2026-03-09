import React, { useState } from 'react';
import styles from './Admin_Add_Training.module.css';
import Adnavbar from '../components/Navbar/Adnavbar';
import Adsidebar from '../components/Sidebar/Adsidebar';

const Admin_Add_Training = () => {
  const [companyName, setCompanyName] = useState('');
  const [companyHR, setCompanyHR] = useState('');
  const [companyInfo, setCompanyInfo] = useState('');
  const [courses, setCourses] = useState(['']);
  const [trainers, setTrainers] = useState(['']);

  const handleAddCourse = () => {
    setCourses([...courses, '']);
  };

  const handleCourseChange = (idx, value) => {
    const updated = [...courses];
    updated[idx] = value;
    setCourses(updated);
  };

  const handleAddTrainer = () => {
    setTrainers([...trainers, '']);
  };

  const handleTrainerChange = (idx, value) => {
    const updated = [...trainers];
    updated[idx] = value;
    setTrainers(updated);
  };

  const handleDiscard = () => {
    setCompanyName('');
    setCompanyHR('');
    setCompanyInfo('');
    setCourses(['']);
    setTrainers(['']);
  };

  const handleSave = () => {
    // Save logic here
    alert('Training details saved!');
  };

  return (
    <div className={styles['Admin-aat-outer-wrapper']}>
      <Adnavbar />
      <div className={styles['Admin-aat-layout']}>
        <Adsidebar />
        <div className={styles['Admin-aat-main-wrapper']}>
      {/* Company Details Card */}
      <div className={styles['Admin-aat-card']}>
        <h2 className={styles['Admin-aat-card-title']}>Company Details</h2>
        <div className={styles['Admin-aat-card-content']}>
          <div className={styles['Admin-aat-form-row']}>
            <div className={styles['Admin-aat-form-group']}>
              <input
                id="companyName"
                type="text"
                placeholder="Enter company name"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
              />
            </div>
            <div className={styles['Admin-aat-form-group']}>
              <select
                id="companyHR"
                value={companyHR}
                onChange={e => setCompanyHR(e.target.value)}
              >
                <option value="">Company HR</option>
                <option value="Bibin Kishore">Bibin Kishore</option>
                <option value="Chandan">Chandan</option>
              </select>
            </div>
            <div className={styles['Admin-aat-form-group']}>
              <input
                id="companyInfo"
                type="text"
                placeholder="Company info"
                value={companyInfo}
                onChange={e => setCompanyInfo(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Course Details Card */}
      <div className={styles['Admin-aat-card']}>
        <h2 className={styles['Admin-aat-card-title']}>Course Details</h2>
        <div className={styles['Admin-aat-card-content']}>
          {Array.from({ length: Math.ceil(courses.length / 3) }).map((_, rowIdx) => (
            <div className={styles['Admin-aat-form-row'] + ' ' + styles['Admin-aat-dynamic-row']} key={rowIdx}>
              {courses.slice(rowIdx * 3, rowIdx * 3 + 3).map((course, idx) => (
                <div className={styles['Admin-aat-form-group']} key={rowIdx * 3 + idx}>
                  <input
                    type="text"
                    placeholder="Course name"
                    value={course}
                    onChange={e => handleCourseChange(rowIdx * 3 + idx, e.target.value)}
                  />
                </div>
              ))}
              {rowIdx === Math.floor((courses.length - 1) / 3) && (courses.length % 3 !== 0) && (
                <button className={styles['Admin-aat-add-btn']} onClick={handleAddCourse}>
                  <span className={styles['Admin-aat-plus']}>+</span> Click to Add Course
                </button>
              )}
            </div>
          ))}
          {(courses.length % 3 === 0) && (
            <div className={styles['Admin-aat-form-row'] + ' ' + styles['Admin-aat-dynamic-row'] + ' ' + styles['Admin-aat-button-row']}>
              <button className={styles['Admin-aat-add-btn']} onClick={handleAddCourse}>
                <span className={styles['Admin-aat-plus']}>+</span> Click to Add Course
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Trainer Details Card */}
      <div className={styles['Admin-aat-card']}>
        <h2 className={styles['Admin-aat-card-title']}>Trainer Details</h2>
        <div className={styles['Admin-aat-card-content']}>
          {Array.from({ length: Math.ceil(trainers.length / 3) }).map((_, rowIdx) => (
            <div className={styles['Admin-aat-form-row'] + ' ' + styles['Admin-aat-dynamic-row']} key={rowIdx}>
              {trainers.slice(rowIdx * 3, rowIdx * 3 + 3).map((trainer, idx) => (
                <div className={styles['Admin-aat-form-group']} key={rowIdx * 3 + idx}>
                  <input
                    type="text"
                    placeholder="Trainer name"
                    value={trainer}
                    onChange={e => handleTrainerChange(rowIdx * 3 + idx, e.target.value)}
                  />
                </div>
              ))}
              {rowIdx === Math.floor((trainers.length - 1) / 3) && (trainers.length % 3 !== 0) && (
                <button className={styles['Admin-aat-add-btn']} onClick={handleAddTrainer}>
                  <span className={styles['Admin-aat-plus']}>+</span> Click to Add Trainer
                </button>
              )}
            </div>
          ))}
          {(trainers.length % 3 === 0) && (
            <div className={styles['Admin-aat-form-row'] + ' ' + styles['Admin-aat-dynamic-row'] + ' ' + styles['Admin-aat-button-row']}>
              <button className={styles['Admin-aat-add-btn']} onClick={handleAddTrainer}>
                <span className={styles['Admin-aat-plus']}>+</span> Click to Add Trainer
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles['Admin-aat-actions']}>
        <button className={styles['Admin-aat-discard-btn']} onClick={handleDiscard}>Discard</button>
        <button className={styles['Admin-aat-save-btn']} onClick={handleSave}>Save</button>
      </div>
        </div>
      </div>
    </div>
  );
};
export default Admin_Add_Training;