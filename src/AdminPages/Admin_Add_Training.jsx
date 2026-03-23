import React, { useState } from 'react';
import styles from './Admin_Add_Training.module.css';
import Adnavbar from '../components/Navbar/Adnavbar';
import Adsidebar from '../components/Sidebar/Adsidebar';
import Admin_CourseDetailsPopup from '../components/alerts/Admin_CourseDetailsPopup';
import Admin_TrainerDetailsPopup from '../components/alerts/Admin_TrainerDetailsPopup';

const Admin_Add_Training = () => {
  const [companyName, setCompanyName] = useState('');
  const [companyHR, setCompanyHR] = useState('');
  const [companyInfo, setCompanyInfo] = useState('');
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]);

  // track sidebar visibility so hamburger toggle works
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // popup visibility states
  const [showCoursePopup, setShowCoursePopup] = useState(false);
  const [showTrainerPopup, setShowTrainerPopup] = useState(false);

  const handleAddCourseClick = () => {
    setShowCoursePopup(true);
  };

  const handleAddTrainerClick = () => {
    setShowTrainerPopup(true);
  };

  const handleCourseSave = (courseData) => {
    setCourses([...courses, courseData]);
  };

  const handleTrainerSave = (trainerData) => {
    setTrainers([...trainers, trainerData]);
  };

  const handleRemoveCourse = (index) => {
    const updated = courses.filter((_, i) => i !== index);
    setCourses(updated);
  };

  const handleRemoveTrainer = (index) => {
    const updated = trainers.filter((_, i) => i !== index);
    setTrainers(updated);
  };

  const handleDiscard = () => {
    setCompanyName('');
    setCompanyHR('');
    setCompanyInfo('');
    setCourses([]);
    setTrainers([]);
  };

  const handleSave = () => {
    // Save logic here
    alert('Training details saved!');
  };

  return (
    <div className={styles['Admin-aat-outer-wrapper']}>
      <Adnavbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <div className={styles['Admin-aat-layout']}>
        <Adsidebar isOpen={isSidebarOpen} />
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
          {courses.length === 0 ? (
            <div className={styles['Admin-aat-form-row'] + ' ' + styles['Admin-aat-button-row']}>
              <button className={styles['Admin-aat-add-btn']} onClick={handleAddCourseClick}>
                <span className={styles['Admin-aat-plus']}>+</span> Click to Add Course
              </button>
            </div>
          ) : (
            <>
              {Array.from({ length: Math.ceil(courses.length / 3) }).map((_, rowIdx) => (
                <div className={styles['Admin-aat-form-row'] + ' ' + styles['Admin-aat-dynamic-row']} key={rowIdx}>
                  {courses.slice(rowIdx * 3, rowIdx * 3 + 3).map((course, idx) => (
                    <div className={styles['Admin-aat-form-group']} key={rowIdx * 3 + idx}>
                      <input
                        type="text"
                        placeholder="Course name"
                        value={course.name}
                        readOnly
                        className={styles['Admin-aat-static-input']}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCourse(rowIdx * 3 + idx)}
                        className={styles['Admin-aat-remove-btn']}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {rowIdx === Math.floor((courses.length - 1) / 3) && (courses.length % 3 !== 0) && (
                    <button className={styles['Admin-aat-add-btn']} onClick={handleAddCourseClick}>
                      <span className={styles['Admin-aat-plus']}>+</span> Click to Add Course
                    </button>
                  )}
                </div>
              ))}
              {(courses.length % 3 === 0) && (
                <div className={styles['Admin-aat-form-row'] + ' ' + styles['Admin-aat-dynamic-row'] + ' ' + styles['Admin-aat-button-row']}>
                  <button className={styles['Admin-aat-add-btn']} onClick={handleAddCourseClick}>
                    <span className={styles['Admin-aat-plus']}>+</span> Click to Add Course
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Trainer Details Card */}
      <div className={styles['Admin-aat-card']}>
        <h2 className={styles['Admin-aat-card-title']}>Trainer Details</h2>
        <div className={styles['Admin-aat-card-content']}>
          {trainers.length === 0 ? (
            <div className={styles['Admin-aat-form-row'] + ' ' + styles['Admin-aat-button-row']}>
              <button className={styles['Admin-aat-add-btn']} onClick={handleAddTrainerClick}>
                <span className={styles['Admin-aat-plus']}>+</span> Click to Add Trainer
              </button>
            </div>
          ) : (
            <>
              {Array.from({ length: Math.ceil(trainers.length / 3) }).map((_, rowIdx) => (
                <div className={styles['Admin-aat-form-row'] + ' ' + styles['Admin-aat-dynamic-row']} key={rowIdx}>
                  {trainers.slice(rowIdx * 3, rowIdx * 3 + 3).map((trainer, idx) => (
                    <div className={styles['Admin-aat-form-group']} key={rowIdx * 3 + idx}>
                      <input
                        type="text"
                        placeholder="Trainer name"
                        value={trainer.name}
                        readOnly
                        className={styles['Admin-aat-static-input']}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTrainer(rowIdx * 3 + idx)}
                        className={styles['Admin-aat-remove-btn']}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {rowIdx === Math.floor((trainers.length - 1) / 3) && (trainers.length % 3 !== 0) && (
                    <button className={styles['Admin-aat-add-btn']} onClick={handleAddTrainerClick}>
                      <span className={styles['Admin-aat-plus']}>+</span> Click to Add Trainer
                    </button>
                  )}
                </div>
              ))}
              {(trainers.length % 3 === 0) && (
                <div className={styles['Admin-aat-form-row'] + ' ' + styles['Admin-aat-dynamic-row'] + ' ' + styles['Admin-aat-button-row']}>
                  <button className={styles['Admin-aat-add-btn']} onClick={handleAddTrainerClick}>
                    <span className={styles['Admin-aat-plus']}>+</span> Click to Add Trainer
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className={styles['Admin-aat-actions']}>
        <button className={styles['Admin-aat-discard-btn']} onClick={handleDiscard}>Discard</button>
        <button className={styles['Admin-aat-save-btn']} onClick={handleSave}>Save</button>
      </div>
        </div>
      </div>
      
      {/* Popup Components */}
      <Admin_CourseDetailsPopup
        isOpen={showCoursePopup}
        onClose={() => setShowCoursePopup(false)}
        onSave={handleCourseSave}
      />
      
      <Admin_TrainerDetailsPopup
        isOpen={showTrainerPopup}
        onClose={() => setShowTrainerPopup(false)}
        onSave={handleTrainerSave}
      />
    </div>
  );
};
export default Admin_Add_Training;