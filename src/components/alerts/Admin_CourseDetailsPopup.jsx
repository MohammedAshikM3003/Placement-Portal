import React, { useEffect, useState } from 'react';
import styles from './Admin_CourseDetailsPopup.module.css';

const Admin_CourseDetailsPopup = ({ isOpen, onClose, onSave, initialData = null, submitLabel = 'Save' }) => {
  const [courseName, setCourseName] = useState('');
  const [syllabusDetails, setSyllabusDetails] = useState([]);
  const [draftTopic, setDraftTopic] = useState('');
  const [durationStart, setDurationStart] = useState('');
  const [durationEnd, setDurationEnd] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setCourseName((initialData?.name || '').toString());
      setSyllabusDetails(Array.isArray(initialData?.syllabus) ? initialData.syllabus : []);
      setDraftTopic('');
      setDurationStart((initialData?.durationStart || '').toString());
      setDurationEnd((initialData?.durationEnd || '').toString());
      return;
    }

    setCourseName('');
    setSyllabusDetails([]);
    setDraftTopic('');
    setDurationStart('');
    setDurationEnd('');
  }, [isOpen, initialData]);

  const hasValidDates =
    Boolean(durationStart) &&
    Boolean(durationEnd) &&
    new Date(durationStart).getTime() <= new Date(durationEnd).getTime();

  const isFormValid =
    Boolean(courseName.trim()) &&
    (syllabusDetails.length > 0 || Boolean(draftTopic.trim())) &&
    hasValidDates;

  const handleAddTopic = () => {
    const next = draftTopic.trim();
    if (!next) return;
    setSyllabusDetails([...syllabusDetails, next]);
    setDraftTopic('');
  };

  const handleRemoveTopic = (index) => {
    const updated = syllabusDetails.filter((_, i) => i !== index);
    setSyllabusDetails(updated);
  };

  const handleDiscard = () => {
    setCourseName('');
    setSyllabusDetails([]);
    setDraftTopic('');
    setDurationStart('');
    setDurationEnd('');
    onClose();
  };

  const handleSave = () => {
    if (!isFormValid) {
      alert('Please fill in all required fields');
      return;
    }

    const finalSyllabus = [
      ...syllabusDetails,
      ...(draftTopic.trim() ? [draftTopic.trim()] : [])
    ];
    
    const courseData = {
      name: courseName,
      syllabus: finalSyllabus.filter(topic => topic.trim() !== ''),
      durationStart,
      durationEnd
    };
    
    onSave(courseData);
    handleDiscard();
  };

  if (!isOpen) return null;

  return (
    <div className={styles['popup-overlay']}>
      <div className={styles['popup-container']}>
        <div className={styles['popup-header']}>
          <h3>Course Details</h3>
        </div>
        
        <div className={styles['popup-content']}>
          <div className={styles['form-group']}>
            <label>Course Name</label>
            <input
              type="text"
              placeholder="Enter course name"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className={styles['form-input']}
            />
          </div>

          <div className={styles['form-group']}>
            <label>Syllabus Details</label>
            <div className={styles['syllabus-grid-container']}>
              {syllabusDetails.map((topic, index) => (
                <div key={`${topic}-${index}`} className={styles['topic-input-wrapper']}>
                  <input
                    type="text"
                    value={topic}
                    readOnly
                    className={styles['form-input']}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(index)}
                    className={styles['remove-topic-btn']}
                    aria-label={`Remove topic ${topic}`}
                  >
                    ×
                  </button>
                </div>
              ))}

              <div className={styles['topic-input-wrapper']}>
                <input
                  type="text"
                  placeholder="Enter Topic"
                  value={draftTopic}
                  onChange={(e) => setDraftTopic(e.target.value)}
                  className={styles['form-input']}
                />
              </div>
              <button
                type="button"
                onClick={handleAddTopic}
                className={styles['add-topic-btn']}
                disabled={!draftTopic.trim()}
              >
                <span className={styles['add-topic-icon']} aria-hidden="true">+</span>
                Click to Add Topic
              </button>
            </div>
          </div>

          <div className={styles['form-group']}>
            <label>Duration</label>
            <div className={styles['duration-group']}>
              <input
                type="date"
                placeholder="Starting Date"
                value={durationStart}
                onChange={(e) => setDurationStart(e.target.value)}
                className={styles['date-input']}
              />
              <input
                type="date"
                placeholder="Ending Date"
                value={durationEnd}
                onChange={(e) => setDurationEnd(e.target.value)}
                className={styles['date-input']}
              />
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

export default Admin_CourseDetailsPopup;
