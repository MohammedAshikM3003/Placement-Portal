import React, { useMemo } from 'react';
import styles from './SemesterMarksheetConfirmation.module.css';

const SemesterMarksheetConfirmation = ({
  isOpen,
  onClose,
  onSave,
  onDiscard,
  changedSubjects = [],
  isSaving = false,
  // When true, only render the small toast (no overlay/modal)
  toastOnly = false
}) => {
  // Generate toast subtitle with changed subject names
  const toastSubtitle = useMemo(() => {
    if (!changedSubjects.length) return '';
    // Show all changed subject names (no "+N more" shorthand)
    return changedSubjects.map(s => s.subjectName).join(', ');
  }, [changedSubjects]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (isSaving) return;
    onSave?.();
  };

  const handleDiscard = () => {
    if (isSaving) return;
    onDiscard?.();
  };

  return (
    <>
      {/* Toast Notification (always render when open) */}
      {isOpen && (
        <div className={styles.toast}>
          <div className={styles.toastIconWrapper}>
            <svg
              className={styles.toastIcon}
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16L21 8V19C21 20.1046 20.1046 21 19 21Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17 21V13H7V21"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7 3V8H15"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className={styles.toastContent}>
            <div className={styles.toastTitle}>Unsaved Semester Changes</div>
            <div className={styles.toastSubtitle}>
              <div className={styles.subtitleScroller}>
                <div className={styles.subtitleInner}>Changed: {toastSubtitle}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* If toastOnly is requested, skip rendering the overlay/modal */}
      {(!toastOnly && isOpen) && (
        <div className={styles.overlay} onClick={isSaving ? undefined : onClose}>
          <div className={styles.container} onClick={(event) => event.stopPropagation()}>
            <div className={styles.header}>Semester Marksheet Updated !</div>

            <div className={styles.body}>
              {/* Warning Icon */}
              <svg className={styles.icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className={styles.iconCircle} cx="26" cy="26" r="25" fill="none" />
                <path className={styles.iconExclamation} fill="none" d="M26 14 L26 30" />
                <circle className={styles.iconDot} cx="26" cy="38" r="2.5" />
              </svg>

              <h2 className={styles.title}>Modified Subjects !</h2>

              {changedSubjects.length > 0 && (
                <div className={styles.changedSubjectsContainer}>
                  <div className={styles.subjectsList}>
                    {changedSubjects.map((subject, index) => (
                      <div key={index} className={styles.subjectChange}>
                        <div className={styles.subjectName}>{subject.subjectName}</div>
                        <div className={styles.gradeChange}>
                          <span className={styles.oldGrade}>{subject.oldGrade}</span>
                          <span className={styles.arrow}>→</span>
                          <span className={styles.newGrade}>{subject.newGrade}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {changedSubjects.length === 0 && (
                <p className={styles.message}>No grade changes detected</p>
              )}
            </div>

            <div className={styles.footer}>
              <button
                type="button"
                onClick={handleDiscard}
                className={`${styles.button} ${styles.discardButton}`}
                disabled={isSaving}
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                className={`${styles.button} ${styles.saveButton}`}
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className={styles.saveButtonContent}>
                    <span className={styles.saveSpinner} aria-hidden="true" />
                    Saving...
                  </span>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SemesterMarksheetConfirmation;
