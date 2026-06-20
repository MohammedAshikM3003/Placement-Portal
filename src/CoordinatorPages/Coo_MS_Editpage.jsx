import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useCoordinatorAuth from '../utils/useCoordinatorAuth.js';
import Navbar from '../components/Navbar/Conavbar.js';
import Sidebar from '../components/Sidebar/Cosidebar.js';
import Adminicon from '../assets/Adminicon.png';
import { API_BASE_URL } from '../utils/apiConfig.js';
import { SuccessAlert, ErrorAlert, useAlert } from '../components/alerts';
import SemesterMarksheetConfirmation from '../components/alerts/SemesterMarksheetConfirmation';
import styles from './Coo_MS_Editpage.module.css';

const GRADE_POINTS = {
  O: 10,
  'A+': 9,
  A: 8,
  'B+': 7,
  B: 6,
  C: 5,
  U: 0,
  RA: 0,
  SA: 0,
  WD: 0
};

const GRADE_OPTIONS = ['O', 'A+', 'A', 'B+', 'B', 'C', 'U', 'RA', 'WD'];

const DEFAULT_STUDENT = {
  name: '',
  regNo: '',
  programme: '',
  year: '',
  semester: '',
  examDate: ''
};

const DEFAULT_SUBJECTS = [];
const SEMESTER_CACHE_KEY = 'cooSemesterMarksheetState';

const normalizeSubjects = (rawSubjects) => {
  const source = Array.isArray(rawSubjects) ? rawSubjects : [];

  return source.map((subject, index) => {
    const code = subject.code || subject.courseCode || subject.subjectCode || subject.id || '';
    const name = subject.name || subject.courseName || subject.subjectName || '';
    const id = subject.id || code || `subject-${index + 1}`;

    return {
      id,
      code,
      name,
      credits: subject.credits ?? '',
      grade: subject.grade || subject.currentGrade || 'U',
      isNew: Boolean(subject.isNew)
    };
  });
};

const buildSubjectLabel = (subject) => {
  const name = subject.name || 'Untitled Subject';
  const code = subject.code || subject.id || 'CODE';
  const grade = subject.grade || 'U';
  return `${name} (${code}) - ${grade}`;
};

const createEmptySubject = () => ({
  id: `new-${Date.now()}`,
  code: '',
  name: '',
  credits: '',
  grade: 'U',
  isNew: true
});

function CooMsEditPage({ onLogout, onViewChange }) {
  useCoordinatorAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const persistedState = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      return JSON.parse(sessionStorage.getItem(SEMESTER_CACHE_KEY) || 'null');
    } catch (error) {
      console.warn('⚠️ Unable to read cached semester edit state:', error.message);
      return null;
    }
  }, [location.key]);

  const student = location.state?.student || persistedState?.student || DEFAULT_STUDENT;
  const initialSubjects = useMemo(
    () => normalizeSubjects(location.state?.subjects || persistedState?.subjects || DEFAULT_SUBJECTS),
    [location.state?.subjects, persistedState?.subjects]
  );
  const initialSelectedSubjectId = location.state?.selectedSubjectId
    || persistedState?.selectedSubjectId
    || initialSubjects[0]?.id
    || '';
  const [subjects, setSubjects] = useState(initialSubjects);
  const initialSubjectsRef = useRef(initialSubjects);
  const [activeSubjectId, setActiveSubjectId] = useState(initialSelectedSubjectId);
  const activeCardRef = useRef(null);
  const subjectNameRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [changedSubjects, setChangedSubjects] = useState([]);
  const [showUnsavedToast, setShowUnsavedToast] = useState(false);
  const { alerts, showSuccess, showError, closeAlert } = useAlert();

  // Detect changed subjects
  const detectChangedSubjects = () => {
    const changed = [];
    
    subjects.forEach((currentSubject) => {
      const originalSubject = (initialSubjectsRef.current || []).find(
        (orig) => orig.id === currentSubject.id || orig.code === currentSubject.code
      );

      if (originalSubject) {
        const oldGrade = originalSubject.grade || 'U';
        const newGrade = currentSubject.grade || 'U';
        const oldName = (originalSubject.name || '').toString();
        const newName = (currentSubject.name || '').toString();
        const oldCode = (originalSubject.code || '').toString();
        const newCode = (currentSubject.code || '').toString();
        const oldCredits = String(originalSubject.credits ?? '');
        const newCredits = String(currentSubject.credits ?? '');

        const fieldChanges = [];
        if (oldGrade !== newGrade) fieldChanges.push({ field: 'grade', from: oldGrade, to: newGrade });
        if (oldName !== newName) fieldChanges.push({ field: 'name', from: oldName, to: newName });
        if (oldCode !== newCode) fieldChanges.push({ field: 'code', from: oldCode, to: newCode });
        if (oldCredits !== newCredits) fieldChanges.push({ field: 'credits', from: oldCredits, to: newCredits });

        if (fieldChanges.length > 0) {
          console.log(`📘 Subject changed: ${currentSubject.name}`, fieldChanges);
          changed.push({
            subjectName: currentSubject.name || originalSubject.name || '',
            id: currentSubject.id,
            changes: fieldChanges
          });
        }
      }
    });
    
    console.log('📘 Changed subjects:', changed);
    return changed;
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen((open) => !open);
  };

  const handleViewChange = (view) => {
    if (onViewChange && typeof onViewChange === 'function') {
      onViewChange(view);
    }
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    setSubjects(initialSubjects);
    setActiveSubjectId(initialSelectedSubjectId || initialSubjects[0]?.id || '');
    initialSubjectsRef.current = initialSubjects;
  }, [initialSubjects, initialSelectedSubjectId]);

  useEffect(() => {
    if (!subjects.length) {
      if (activeSubjectId) {
        setActiveSubjectId('');
      }
      return;
    }

    const stillExists = subjects.some((subject) => subject.id === activeSubjectId);
    if (!stillExists) {
      setActiveSubjectId(subjects[0].id);
    }
  }, [subjects, activeSubjectId]);

  const activeSubject = useMemo(
    () => subjects.find((subject) => subject.id === activeSubjectId) || null,
    [subjects, activeSubjectId]
  );

  // Build select options from original cached subjects so dropdown doesn't reflect in-card edits
  const selectOptions = useMemo(() => {
    const originals = Array.isArray(initialSubjectsRef.current) ? initialSubjectsRef.current : [];
    const extras = subjects.filter(s => !originals.some(o => o.id === s.id));
    return [...originals, ...extras];
  }, [subjects]);

  useEffect(() => {
    if (!activeSubject?.isNew) {
      return;
    }

    if (activeCardRef.current) {
      activeCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (subjectNameRef.current) {
      subjectNameRef.current.focus();
    }
  }, [activeSubjectId, activeSubject?.isNew]);

  const handleAddSubject = () => {
    const newSubject = createEmptySubject();
    setSubjects((prev) => [...prev, newSubject]);
    setActiveSubjectId(newSubject.id);
  };

  const handleSubjectFieldChange = (subjectId, field, value) => {
    setSubjects((prev) => prev.map((subject) => (
      subject.id === subjectId ? { ...subject, [field]: value } : subject
    )));
  };

  const handleGradeChange = (subjectId, grade) => {
    setSubjects((prev) => prev.map((subject) => (
      subject.id === subjectId ? { ...subject, grade } : subject
    )));
  };

  useEffect(() => {
    if (!student?.regNo && !student?.name) return;
    try {
      sessionStorage.setItem(SEMESTER_CACHE_KEY, JSON.stringify({
        student,
        subjects: initialSubjectsRef.current,
        semesterRecord: location.state?.semesterRecord || null,
        selectedSubjectId: activeSubjectId
      }));
    } catch (error) {
      console.warn('⚠️ Unable to cache semester edit state:', error.message);
    }
  }, [student, activeSubjectId, location.state?.semesterRecord]);

  const handleDiscard = () => {
    const studentData = student;
    // hide unsaved toast when discarding/navigating away
    setShowUnsavedToast(false);
    navigate('/coo-manage-students-semester/marksheet', {
      state: {
        regNo: studentData.registerNumber || studentData.regNo || '',
        semester: studentData.semester || studentData.currentSemester || '',
        year: studentData.year || studentData.currentYear || '',
        refresh: true,
        discard: true,
        updatedAt: Date.now()
      }
    });
  };

  const handleUpdate = () => {
    // Detect changes
    const changed = detectChangedSubjects();
    
    if (changed.length === 0) {
      showError('No Changes', 'No grade changes detected');
      return;
    }
    
    // Show confirmation modal
    setChangedSubjects(changed);
    setShowConfirmation(true);
    // also show the toast immediately
    setShowUnsavedToast(true);
  };

  const handleToggleEdit = (subjectId) => {
    setSubjects((prev) => prev.map((s) => {
      if (s.id !== subjectId) return s;

      // if currently editing, revert changes to original and stop editing
      if (s.isEditing) {
        const orig = (initialSubjectsRef.current || []).find(o => o.id === s.id || o.code === s.code) || null;
        if (orig) {
          return { ...s, name: orig.name || '', code: orig.code || '', credits: orig.credits ?? '', grade: orig.grade || 'U', isEditing: false, isNew: false };
        }
        return { ...s, isEditing: false };
      }

      // start editing
      return { ...s, isEditing: true };
    }));
    // keep focus on the same subject in the dropdown (do not mutate select labels from edits)
    setActiveSubjectId(subjectId);
    // do not show unsaved toast just for entering edit mode
    setShowUnsavedToast(false);
  };

  const handleConfirmationDiscard = () => {
    setShowConfirmation(false);
    setChangedSubjects([]);
    setShowUnsavedToast(false);
  };

  const performSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    setSaveError('');
    setSaveMessage('');

    const regNo = (student.regNo || student.registerNumber || '').toString().trim();
    const studentName = (student.name || student.studentName || '').toString().trim();
    const semester = (student.semester || student.currentSemester || '').toString().trim();
    const year = (student.year || student.currentYear || '').toString().trim();
    const recordId = student._id || student.recordId || student.semesterRecordId || student.id || '';

    if (!recordId && (!regNo || !semester || !year)) {
      const errorMessage = 'Missing semester record identity. Please reopen the record and try again.';
      setSaveError(errorMessage);
      showError('Update failed', errorMessage);
      setIsSaving(false);
      return;
    }

    const normalizedSubjects = subjects.map((subject) => {
      const grade = subject.grade || 'U';
      const isFail = grade === 'U' || grade === 'RA' || grade === 'WD';
      return {
        courseCode: (subject.code || subject.courseCode || subject.id || '').toString().trim().toUpperCase(),
        courseName: (subject.name || subject.courseName || subject.subjectName || '').toString().trim(),
        credits: Number(subject.credits) || 0,
        grade,
        result: isFail ? 'F' : 'P'
      };
    });

    const payload = {
      _id: recordId,
      regNo,
      registerNumber: regNo,
      studentName,
      year,
      semester,
      sgpa,
      cgpa,
      subjects: normalizedSubjects
    };

    try {
      const authToken = localStorage.getItem('authToken');
      const endpoint = recordId
        ? `${API_BASE_URL}/semester-records/${encodeURIComponent(recordId)}`
        : `${API_BASE_URL}/semester-records/update`;

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Failed to update semester record');
      }

      const updatedRecord = data?.updatedRecord || null;
      const updatedData = {
        ...(updatedRecord || {}),
        regNo: updatedRecord?.regNo || regNo,
        registerNumber: updatedRecord?.registerNumber || regNo,
        studentName: updatedRecord?.studentName || studentName,
        year: updatedRecord?.year || year,
        semester: updatedRecord?.semester || semester,
        sgpa: updatedRecord?.sgpa || sgpa,
        cgpa: updatedRecord?.cgpa || cgpa,
        subjects: updatedRecord?.subjects || normalizedSubjects
      };
      if (updatedRecord?.subjects) {
        const refreshedSubjects = normalizeSubjects(updatedRecord.subjects);
        const selectedKey = activeSubject?.code || activeSubject?.id || activeSubjectId;

        setSubjects(refreshedSubjects);
        initialSubjectsRef.current = refreshedSubjects;

        if (selectedKey) {
          const matched = refreshedSubjects.find((subject) => subject.id === selectedKey || subject.code === selectedKey);
          setActiveSubjectId(matched ? matched.id : (refreshedSubjects[0]?.id || ''));
        } else if (refreshedSubjects[0]?.id) {
          setActiveSubjectId(refreshedSubjects[0].id);
        }
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('current_student_marksheet');
          localStorage.setItem('current_student_marksheet', JSON.stringify(updatedData));
        } catch (storageError) {
          console.warn('⚠️ Unable to update marksheet cache:', storageError.message);
        }
      }

      setSaveMessage('Semester record updated successfully.');
      showSuccess('Updated', 'Semester record updated successfully.');
      
      console.log('✅ Semester changes confirmed');
      setShowConfirmation(false);
      setChangedSubjects([]);
      setShowUnsavedToast(false);

      navigate('/coo-manage-students-semester/marksheet', {
        state: {
          regNo,
          semester,
          year,
          refresh: true,
          updatedAt: Date.now()
        }
      });
    } catch (error) {
      const message = error.message || 'Failed to update semester record';
      setSaveError(message);
      showError('Update failed', message);
    } finally {
      setIsSaving(false);
    }
  };

    // Auto-detect changes and show toast immediately when subjects deviate from initial state
    useEffect(() => {
      try {
        const changed = detectChangedSubjects();
        if (changed.length > 0) {
          setChangedSubjects(changed);
          setShowUnsavedToast(true);
        } else {
          setChangedSubjects([]);
          setShowUnsavedToast(false);
        }
      } catch (err) {
        console.warn('Failed to detect subject changes for toast:', err);
      }
    }, [subjects]);

  const sgpa = useMemo(() => {
    const totals = subjects.reduce((acc, subject) => {
      const credits = Number(subject.credits) || 0;
      const points = GRADE_POINTS[subject.grade] ?? 0;
      return {
        credits: acc.credits + credits,
        points: acc.points + credits * points
      };
    }, { credits: 0, points: 0 });

    if (!totals.credits) return '0.0';
    return (totals.points / totals.credits).toFixed(1);
  }, [subjects]);

  const cgpa = sgpa;
  const activeGrade = activeSubject?.grade || 'U';
  const isFailGrade = activeGrade === 'U' || activeGrade === 'RA';

  return (
    <div className={styles.page}>
      <Navbar Adminicon={Adminicon} onToggleSidebar={handleToggleSidebar} />
      <SuccessAlert
        isOpen={alerts.success.isOpen}
        onClose={() => closeAlert('success')}
        title={alerts.success.title}
        message={alerts.success.message}
      />
      <ErrorAlert
        isOpen={alerts.error.isOpen}
        onClose={() => closeAlert('error')}
        title={alerts.error.title}
        message={alerts.error.message}
      />
      <SemesterMarksheetConfirmation
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onSave={performSave}
        onDiscard={handleConfirmationDiscard}
        changedSubjects={changedSubjects}
        isSaving={isSaving}
      />
      {/* Lightweight toast-only banner shown immediately on edits */}
      <SemesterMarksheetConfirmation
        isOpen={showUnsavedToast}
        toastOnly={true}
        onClose={() => setShowUnsavedToast(false)}
        onSave={performSave}
        onDiscard={() => { handleConfirmationDiscard(); setShowUnsavedToast(false); }}
        changedSubjects={changedSubjects}
        isSaving={isSaving}
      />
      <div className={styles.main}>
        <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView="manage-students" onViewChange={handleViewChange}
          onClose={() => setIsSidebarOpen(false)}
        />
        {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)} />}

        <div className={styles.content}>
          <div className={styles.headerRow}>
            <div className={styles.profileCard}>
              <div className={styles.profileHeader}>
                <div>
                  <h2 className={styles.profileName}>{student.name}</h2>
                  <span className={styles.profileReg}>- {student.regNo}</span>
                </div>
                <div className={styles.profileMeta}>{student.programme}</div>
                <div className={styles.profileMeta}>{student.year} - {student.semester}</div>
                <div className={styles.profileMeta}>{student.examDate}</div>
              </div>

              <div className={styles.profileActions}>
                <div className={styles.selectWrap}>
                  <select
                    className={`${styles.select} ${subjects.length ? styles.selectActive : ''}`}
                    value={activeSubjectId}
                    onChange={(event) => setActiveSubjectId(event.target.value)}
                    disabled={!subjects.length}
                  >
                    {selectOptions.length ? (
                      selectOptions.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {buildSubjectLabel(subject)}
                        </option>
                      ))
                    ) : (
                      <option value="">No subjects added yet</option>
                    )}
                  </select>
                </div>
                <button type="button" className={styles.addButton} onClick={handleAddSubject}>
                  + Add Subject
                </button>
              </div>
            </div>

            <div className={styles.statCards}>
              <div className={`${styles.statCard} ${styles.sgpaCard}`}>
                <span className={styles.statTitle}>Semester Grade Point Average (SGPA)</span>
                <span className={styles.statValue}>{sgpa}</span>
              </div>
              <div className={`${styles.statCard} ${styles.cgpaCard}`}>
                <span className={styles.statTitle}>Cumulative Grade Point Average (CGPA)</span>
                <span className={styles.statValue}>{cgpa}</span>
              </div>
            </div>
          </div>

          <div className={styles.subjectList}>
            {!subjects.length ? (
              <div className={styles.emptyState}>
                <h3 className={styles.emptyStateTitle}>No subjects added yet</h3>
                <p className={styles.emptyStateText}>Add the first subject to start editing grades.</p>
                <button type="button" className={styles.emptyStateButton} onClick={handleAddSubject}>
                  Add First Subject
                </button>
              </div>
            ) : (
              activeSubject && (
                <div
                  key={activeSubject.id}
                  className={`${styles.subjectCard} ${styles.subjectCardActive}`}
                  ref={activeCardRef}
                >
                  <div className={styles.subjectHeader}>
                    <div className={styles.subjectHeaderLeft}>
                      {activeSubject.isNew || activeSubject.isEditing ? (
                        <>
                          <h3 className={styles.subjectTitle}>{activeSubject.isNew ? 'New Subject' : activeSubject.name}</h3>
                          <div className={styles.newSubjectInputs}>
                            <input
                              ref={subjectNameRef}
                              className={`${styles.subjectInput} ${styles.subjectInputTitle}`}
                              type="text"
                              value={activeSubject.name}
                              placeholder="Enter Subject Name"
                              onChange={(event) => handleSubjectFieldChange(activeSubject.id, 'name', event.target.value)}
                            />
                            <div className={styles.newSubjectRow}>
                              <input
                                className={styles.subjectInput}
                                type="text"
                                value={activeSubject.code}
                                placeholder="Enter Subject Code"
                                onChange={(event) => handleSubjectFieldChange(activeSubject.id, 'code', event.target.value)}
                              />
                              <input
                                className={`${styles.subjectInput} ${styles.subjectInputSmall}`}
                                type="text"
                                inputMode="numeric"
                                value={activeSubject.credits}
                                placeholder="Credits"
                                onChange={(event) => handleSubjectFieldChange(activeSubject.id, 'credits', event.target.value)}
                              />
                            </div>
                          </div>
                          <div className={styles.subjectMeta}>
                            <span className={styles.currentGrade}>
                              Current: {activeGrade} {isFailGrade ? '- (Fail)' : ''}
                            </span>
                          </div>
                        </>
                    ) : (
                        <>
                          <h3 className={styles.subjectTitle}>{activeSubject.name}</h3>
                          <div className={styles.subjectMeta}>
                            <span className={styles.subjectCode}>{activeSubject.code || activeSubject.id}</span>
                            <span className={styles.currentGrade}>
                              Current: {activeGrade} {isFailGrade ? '- (Fail)' : ''}
                            </span>
                            <span className={styles.credits}>Credits : {activeSubject.credits || '--'}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      className={styles.editIconButton}
                      title={activeSubject?.isEditing ? 'Discard edits' : 'Edit subject'}
                      onClick={() => handleToggleEdit(activeSubject.id)}
                    >
                      {activeSubject?.isEditing ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z" fill="#fff" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="#fff"/>
                          <path d="M20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" fill="#fff"/>
                        </svg>
                      )}
                    </button>

                  </div>

                  <div className={styles.gradeSection}>
                    <span className={styles.gradeLabel}>Select New Grade</span>
                    <div className={styles.gradeButtons}>
                      {GRADE_OPTIONS.map((grade) => (
                        <button
                          key={`${activeSubject.id}-${grade}`}
                          type="button"
                          className={`${styles.gradeButton} ${activeGrade === grade ? styles.gradeButtonActive : ''}`}
                          onClick={() => handleGradeChange(activeSubject.id, grade)}
                        >
                          {grade}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button type="button" className={styles.discardButton} onClick={handleDiscard}>
                      Discard
                    </button>
                    <button type="button" className={styles.updateButton} onClick={handleUpdate} disabled={isSaving}>
                      {isSaving ? 'Updating...' : 'Update'}
                    </button>
                  </div>

                  {(saveMessage || saveError) && (
                    <div className={saveError ? styles.saveError : styles.saveMessage}>
                      {saveError || saveMessage}
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CooMsEditPage;
