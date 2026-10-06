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
  S: 10,
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

const GRADE_OPTIONS = ['O', 'S', 'A+', 'A', 'B+', 'B', 'C', 'U', 'RA', 'WD'];

const YEAR_OPTIONS = ['I', 'II', 'III', 'IV'];
const YEAR_SEMESTER_MAP = {
  'I': ['1', '2'],
  'II': ['3', '4'],
  'III': ['5', '6'],
  'IV': ['7', '8']
};

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

const normalizeSubjects = (rawSubjects, studentYear = '', studentSemester = '') => {
  const source = Array.isArray(rawSubjects) ? rawSubjects : [];

  return source.map((subject, index) => {
    const code = subject.code || subject.courseCode || subject.subjectCode || subject.id || '';
    const name = subject.name || subject.courseName || subject.subjectName || '';
    const id = subject.id || subject._id || code || `subject-${index + 1}`;

    return {
      id,
      code,
      name,
      credits: subject.credits ?? '',
      grade: subject.grade || subject.currentGrade || 'U',
      year: subject.year || studentYear || '',
      semester: subject.semester || studentSemester || '',
      isNew: Boolean(subject.isNew)
    };
  });
};

const buildSubjectLabel = (subject, isMobile) => {
  let name = subject.name || 'Untitled Subject';
  if (isMobile && name.length > 25) {
    name = name.substring(0, 22) + '...';
  }
  const code = subject.code || subject.id || 'CODE';
  const grade = subject.grade || 'U';
  const semDetails = subject.semester ? ` [Sem ${subject.semester}]` : '';
  return `${name} (${code})${semDetails} - ${grade}`;
};

const createEmptySubject = () => ({
  id: `new-${Date.now()}`,
  code: '',
  name: '',
  credits: '',
  year: '',
  semester: '',
  grade: 'U',
  isNew: true
});

function CooMsEditPage({ onLogout, onViewChange }) {
  useCoordinatorAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
    () => normalizeSubjects(location.state?.subjects || persistedState?.subjects || DEFAULT_SUBJECTS, student.year, student.semester),
    [location.state?.subjects, persistedState?.subjects, student.year, student.semester]
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
  const [isBackNavigationPending, setIsBackNavigationPending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { alerts, showSuccess, showError, closeAlert } = useAlert();
  const [deleteConfirmState, setDeleteConfirmState] = useState({
    isOpen: false,
    subjectId: null,
    subjectName: ''
  });

  // Detect changed subjects
  const detectChangedSubjects = () => {
    const changed = [];
    
    subjects.forEach((currentSubject) => {
      if (currentSubject.isNew) {
        changed.push({
          subjectName: currentSubject.name || 'New Subject',
          id: currentSubject.id,
          oldGrade: '--',
          newGrade: currentSubject.grade || 'U',
          changes: [
            { field: 'grade', from: '', to: currentSubject.grade || 'U' },
            { field: 'name', from: '', to: currentSubject.name || '' },
            { field: 'code', from: '', to: currentSubject.code || '' },
            { field: 'credits', from: '', to: currentSubject.credits || '' },
            { field: 'year', from: '', to: currentSubject.year || '' },
            { field: 'semester', from: '', to: currentSubject.semester || '' }
          ]
        });
        return;
      }

      const originalSubject = (initialSubjectsRef.current || []).find(
        (orig) => orig.id === currentSubject.id
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
        const oldYear = (originalSubject.year || '').toString();
        const newYear = (currentSubject.year || '').toString();
        const oldSemester = (originalSubject.semester || '').toString();
        const newSemester = (currentSubject.semester || '').toString();

        const fieldChanges = [];
        if (oldGrade !== newGrade) fieldChanges.push({ field: 'grade', from: oldGrade, to: newGrade });
        if (oldName !== newName) fieldChanges.push({ field: 'name', from: oldName, to: newName });
        if (oldCode !== newCode) fieldChanges.push({ field: 'code', from: oldCode, to: newCode });
        if (oldCredits !== newCredits) fieldChanges.push({ field: 'credits', from: oldCredits, to: newCredits });
        if (oldYear !== newYear) fieldChanges.push({ field: 'year', from: oldYear, to: newYear });
        if (oldSemester !== newSemester) fieldChanges.push({ field: 'semester', from: oldSemester, to: newSemester });

        if (fieldChanges.length > 0) {
          console.log(`📘 Subject changed: ${currentSubject.name}`, fieldChanges);
          changed.push({
            subjectName: currentSubject.name || originalSubject.name || '',
            id: currentSubject.id,
            oldGrade,
            newGrade,
            changes: fieldChanges
          });
        }
      }
    });
    
    console.log('📘 Changed subjects:', changed);
    return changed;
  };

  const hasChanges = useMemo(() => {
    return detectChangedSubjects().length > 0;
  }, [subjects]);

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
    const newSubject = {
      ...createEmptySubject(),
      year: student.year || '',
      semester: student.semester || ''
    };
    setSubjects((prev) => [...prev, newSubject]);
    setActiveSubjectId(newSubject.id);
  };

  const handleSubjectFieldChange = (subjectId, field, value) => {
    setSubjects((prev) => prev.map((subject) => {
      if (subject.id !== subjectId) return subject;

      if (field === 'year') {
        const allowedSems = YEAR_SEMESTER_MAP[value] || [];
        return {
          ...subject,
          year: value,
          semester: allowedSems[0] || ''
        };
      }

      return { ...subject, [field]: value };
    }));
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
        selectedSubjectId: activeSubjectId,
        returnPath: location.state?.returnPath || persistedState?.returnPath || ''
      }));
    } catch (error) {
      console.warn('⚠️ Unable to cache semester edit state:', error.message);
    }
  }, [student, activeSubjectId, location.state?.semesterRecord]);

  const handleDiscard = () => {
    setShowUnsavedToast(false);
    const returnPath = location.state?.returnPath || persistedState?.returnPath || '/coo-manage-students-semester/marksheet';
    navigate(returnPath, {
      state: {
        regNo: student.regNo || student.registerNumber || '',
        semester: student.semester || student.currentSemester || '',
        year: student.year || student.currentYear || '',
        refresh: true,
        discard: true,
        updatedAt: Date.now()
      }
    });
  };

  const handleBackButtonClick = () => {
    const changed = detectChangedSubjects();
    if (changed.length > 0) {
      setChangedSubjects(changed);
      setIsBackNavigationPending(true);
      setShowConfirmation(true);
    } else {
      handleDiscard();
    }
  };

  const handleUpdate = () => {
    // Validate that all subjects have a code and name and credits
    for (const subject of subjects) {
      if (subject.isNew || subject.isEditing) {
        if (!subject.code || !subject.code.toString().trim()) {
          showError('Validation Error', 'Please enter a Subject Code.');
          return;
        }
        if (!subject.name || !subject.name.toString().trim()) {
          showError('Validation Error', 'Please enter a Subject Name.');
          return;
        }
        if (!subject.year || !subject.year.toString().trim()) {
          showError('Validation Error', 'Please enter a Year.');
          return;
        }
        if (!subject.semester || !subject.semester.toString().trim()) {
          showError('Validation Error', 'Please enter a Semester.');
          return;
        }
        if (subject.credits === '' || isNaN(Number(subject.credits)) || Number(subject.credits) < 0) {
          showError('Validation Error', 'Please enter valid credits.');
          return;
        }
      }
    }

    const changed = detectChangedSubjects();
    
    if (changed.length === 0) {
      showError('No Changes', 'No grade changes detected');
      return;
    }
    
    setChangedSubjects(changed);
    setShowConfirmation(true);
    setShowUnsavedToast(true);
  };

  const calculateSgpaForSubjects = (subjectsList) => {
    const totals = subjectsList.reduce((acc, subject) => {
      const credits = Number(subject.credits) || 0;
      const points = GRADE_POINTS[subject.grade] ?? 0;
      return {
        credits: acc.credits + credits,
        points: acc.points + credits * points
      };
    }, { credits: 0, points: 0 });

    if (!totals.credits) return '0.0';
    return (totals.points / totals.credits).toFixed(1);
  };

  const handleDeleteSubject = (subjectId) => {
    const subjectToDelete = subjects.find(s => s.id === subjectId);
    if (!subjectToDelete) return;

    if (subjectToDelete.isNew) {
      setSubjects((prev) => prev.filter(s => s.id !== subjectId));
      return;
    }

    setDeleteConfirmState({
      isOpen: true,
      subjectId,
      subjectName: subjectToDelete.name || subjectToDelete.code
    });
  };

  const confirmDeleteSubject = async () => {
    const subjectId = deleteConfirmState.subjectId;
    setDeleteConfirmState({ isOpen: false, subjectId: null, subjectName: '' });

    setIsDeleting(true);
    try {
      const remainingInitial = (initialSubjectsRef.current || []).filter(s => s.id !== subjectId);
      const remainingState = subjects.filter(s => s.id !== subjectId);

      const regNo = (student.regNo || student.registerNumber || '').toString().trim();
      const studentName = (student.name || student.studentName || '').toString().trim();
      const semester = (student.semester || student.currentSemester || '').toString().trim();
      const year = (student.year || student.currentYear || '').toString().trim();
      const recordId = student._id || student.recordId || student.semesterRecordId || student.id || location.state?.semesterRecord?._id || persistedState?.semesterRecord?._id || '';

      const normalizedSubjects = remainingInitial.map((sub) => {
        const grade = sub.grade || 'U';
        const isFail = grade === 'U' || grade === 'RA' || grade === 'WD';
        const subYear = (sub.year || year).toString().trim();
        const subSemester = (sub.semester || semester).toString().trim();
        return {
          courseCode: (sub.code || sub.courseCode || sub.id || '').toString().trim().toUpperCase(),
          courseName: (sub.name || sub.courseName || sub.subjectName || '').toString().trim(),
          credits: Number(sub.credits) || 0,
          grade,
          result: isFail ? 'F' : 'P',
          year: subYear || undefined,
          semester: subSemester || undefined
        };
      });

      const newSgpa = calculateSgpaForSubjects(remainingInitial);

      const payload = {
        _id: recordId,
        regNo,
        registerNumber: regNo,
        studentName,
        year,
        semester,
        sgpa: newSgpa,
        cgpa: newSgpa,
        subjects: normalizedSubjects
      };

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
        throw new Error(data?.error || data?.message || 'Failed to delete subject');
      }

      setSubjects(remainingState);
      initialSubjectsRef.current = normalizeSubjects(remainingInitial, student.year, student.semester);
      showSuccess('Deleted', 'Subject deleted successfully.');
    } catch (err) {
      showError('Delete failed', err.message || 'Failed to delete subject');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleEdit = (subjectId) => {
    setSubjects((prev) => prev.map((s) => {
      if (s.id !== subjectId) return s;

      // if currently editing, revert changes to original and stop editing
      if (s.isEditing) {
        const orig = (initialSubjectsRef.current || []).find(o => o.id === s.id) || null;
        if (orig) {
          return { ...s, name: orig.name || '', code: orig.code || '', credits: orig.credits ?? '', grade: orig.grade || 'U', year: orig.year || '', semester: orig.semester || '', isEditing: false, isNew: false };
        }
        return { ...s, isEditing: false };
      }

      // start editing
      return { ...s, isEditing: true };
    }));
    // keep focus on the same subject in the dropdown
    setActiveSubjectId(subjectId);
    setShowUnsavedToast(false);
  };

  const handleConfirmationDiscard = () => {
    setShowConfirmation(false);
    setChangedSubjects([]);
    setShowUnsavedToast(false);
    if (isBackNavigationPending) {
      setIsBackNavigationPending(false);
      setSubjects(initialSubjectsRef.current);
      handleDiscard();
    }
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
    const recordId = student._id || student.recordId || student.semesterRecordId || student.id || location.state?.semesterRecord?._id || persistedState?.semesterRecord?._id || '';

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
      const subYear = (subject.year || year).toString().trim();
      const subSemester = (subject.semester || semester).toString().trim();
      return {
        courseCode: (subject.code || subject.courseCode || subject.id || '').toString().trim().toUpperCase(),
        courseName: (subject.name || subject.courseName || subject.subjectName || '').toString().trim(),
        credits: Number(subject.credits) || 0,
        grade,
        result: isFail ? 'F' : 'P',
        year: subYear || undefined,
        semester: subSemester || undefined
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
        const refreshedSubjects = normalizeSubjects(updatedRecord.subjects, student.year, student.semester);
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
        onClose={() => {
          const isUpdate = alerts.success.title === 'Updated';
          closeAlert('success');
          if (isUpdate) {
            handleDiscard();
          }
        }}
        title={alerts.success.title}
        message={alerts.success.message}
      />
      <ErrorAlert
        isOpen={alerts.error.isOpen}
        onClose={() => closeAlert('error')}
        title={alerts.error.title}
        message={alerts.error.message}
      />
      {deleteConfirmState.isOpen && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmCard}>
            <div className={styles.confirmHeader}>
              Delete Subject
            </div>
            <div className={styles.confirmBody}>
              <div className={styles.confirmIconWrapper}>
                <span className={styles.confirmIconText}>!</span>
              </div>
              <h3 className={styles.confirmTitle}>Are you sure?</h3>
              <p className={styles.confirmMessage}>
                Delete "{deleteConfirmState.subjectName}"?
              </p>
            </div>
            <div className={styles.confirmFooter}>
              <button
                type="button"
                className={styles.confirmCancelBtn}
                onClick={() => setDeleteConfirmState({ isOpen: false, subjectId: null, subjectName: '' })}
              >
                Discard
              </button>
               <button
                type="button"
                className={styles.confirmDeleteBtn}
                onClick={confirmDeleteSubject}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <SemesterMarksheetConfirmation
        isOpen={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setIsBackNavigationPending(false);
        }}
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
                          {buildSubjectLabel(subject, isMobile)}
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
                          <div className={styles.subjectTitleRow}>
                            <h3 className={styles.subjectTitle}>{activeSubject.isNew ? 'New Subject' : activeSubject.name}</h3>
                            <span className={styles.currentGrade}>
                              Current: {activeGrade} {isFailGrade ? '- (Fail)' : ''}
                            </span>
                          </div>
                          <div className={styles.newSubjectInputs}>
                            <div className={styles.subjectEditTwoColRow}>
                              <input
                                ref={subjectNameRef}
                                className={`${styles.subjectInput} ${styles.subjectInputTitle}`}
                                type="text"
                                value={activeSubject.name}
                                placeholder="Enter Subject Name"
                                onChange={(event) => handleSubjectFieldChange(activeSubject.id, 'name', event.target.value)}
                              />
                              <input
                                className={styles.subjectInput}
                                type="text"
                                value={activeSubject.code}
                                placeholder="Enter Subject Code"
                                onChange={(event) => handleSubjectFieldChange(activeSubject.id, 'code', event.target.value)}
                              />
                            </div>
                            <div className={styles.subjectEditThreeColRow}>
                              <select
                                className={`${styles.subjectInput} ${styles.subjectInputSmall}`}
                                value={activeSubject.year}
                                onChange={(event) => handleSubjectFieldChange(activeSubject.id, 'year', event.target.value)}
                              >
                                <option value="">Select Year</option>
                                {YEAR_OPTIONS.map((y) => (
                                  <option key={y} value={y}>{y}</option>
                                ))}
                              </select>
                              <select
                                className={`${styles.subjectInput} ${styles.subjectInputSmall}`}
                                value={activeSubject.semester}
                                onChange={(event) => handleSubjectFieldChange(activeSubject.id, 'semester', event.target.value)}
                                disabled={!activeSubject.year}
                              >
                                <option value="">Select Sem</option>
                                {(YEAR_SEMESTER_MAP[activeSubject.year] || []).map((sem) => (
                                  <option key={sem} value={sem}>{sem}</option>
                                ))}
                              </select>
                              <select
                                className={`${styles.subjectInput} ${styles.subjectInputSmall}`}
                                value={activeSubject.credits}
                                onChange={(event) => handleSubjectFieldChange(activeSubject.id, 'credits', event.target.value)}
                              >
                                <option value="">Credits</option>
                                {['0', '1', '2', '3', '4', '5'].map((cr) => (
                                  <option key={cr} value={cr}>{cr}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={styles.subjectTitleRow}>
                            <h3 className={styles.subjectTitle}>{activeSubject.name}</h3>
                            <span className={styles.currentGrade}>
                              Current: {activeGrade} {isFailGrade ? '- (Fail)' : ''}
                            </span>
                          </div>
                          <div className={styles.subjectMeta}>
                            <span className={styles.subjectCode}>{activeSubject.code || activeSubject.id}</span>
                            <span className={styles.credits}>Year: {activeSubject.year || '--'}</span>
                            <span className={styles.credits}>Semester: {activeSubject.semester || '--'}</span>
                            <span className={styles.credits}>Credits : {(activeSubject.credits !== '' && activeSubject.credits !== undefined && activeSubject.credits !== null) ? activeSubject.credits : '--'}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className={styles.subjectHeaderRight}>
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
                      <button
                        type="button"
                        className={styles.deleteButton}
                        title="Delete subject"
                        onClick={() => handleDeleteSubject(activeSubject.id)}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        className={styles.backButton}
                        onClick={handleBackButtonClick}
                      >
                        Back
                      </button>
                    </div>

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
                    <button
                      type="button"
                      className={styles.discardButton}
                      onClick={handleBackButtonClick}
                      disabled={isSaving || isDeleting || !hasChanges}
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      className={styles.updateButton}
                      onClick={handleUpdate}
                      disabled={isSaving || isDeleting || !hasChanges}
                    >
                      {isSaving ? 'Updating...' : 'Update'}
                    </button>
                  </div>

                  {/* {(saveMessage || saveError) && (
                    <div className={saveError ? styles.saveError : styles.saveMessage}>
                      {saveError || saveMessage}
                    </div>
                  )} */}
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
