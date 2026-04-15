import React from 'react';
import './AlertStyles.css';

const TrainingCourseEnrolledAlert = ({
  isOpen,
  onClose,
  courseName = '',
  startDate = '',
  endDate = '',
  totalDays = ''
}) => {
  if (!isOpen) return null;

  const safeCourse = (courseName || '').toString().trim() || 'Selected course';
  const safeStartDate = (startDate || '').toString().trim();
  const safeEndDate = (endDate || '').toString().trim();
  const safeTotalDays = (totalDays ?? '').toString().trim();
  const hasTimeline = Boolean(safeStartDate || safeEndDate || safeTotalDays);

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: '#197AFF' }}>
          Enrolled !
        </div>
        <div className="achievement-popup-body">
          <svg className="download-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="download-success-icon--circle" cx="26" cy="26" r="25" fill="none" />
            <path className="download-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
          <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: '24px', color: '#000', fontWeight: '700' }}>
            Training Course Enrolled ✓
          </h2>
          <p style={{ margin: 0, color: '#888', fontSize: '16px', lineHeight: 1.5 }}>
            {safeCourse} enrolled successfully.
            {hasTimeline && (
              <>
                <br />
                {safeStartDate || '-'} to {safeEndDate || '-'} | Total Days: {safeTotalDays || '-'}
              </>
            )}
          </p>
        </div>
        <div className="achievement-popup-footer">
          <button onClick={onClose} className="achievement-popup-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrainingCourseEnrolledAlert;
