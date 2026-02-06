import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';

import styles from './Coo_ManageStudentsSemester.module.css';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import studentcapicon from "../assets/studentcapicon.svg";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { useNavigate } from "react-router-dom";
import autoTable from 'jspdf-autotable';
import mongoDBService from "../services/mongoDBService.jsx";

const toStringSafe = (value) => (value === undefined || value === null ? '' : String(value).trim());

const toUpperSafe = (value) => toStringSafe(value).toUpperCase();

const readStoredCoordinatorData = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('coordinatorData');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('Failed to read coordinator data:', error);
    return null;
  }
};

const normalizeId = (val) => {
  if (!val) return '';
  if (typeof val === 'object') {
    return val.$oid || val.oid || val.id || '';
  }
  const str = val.toString ? val.toString() : '';
  return str && str !== '[object Object]' ? str : '';
};

const resolveCoordinatorDepartment = (data) => {
  if (!data) return null;
  const deptValue =
    data.department ||
    data.branch ||
    data.dept ||
    data.departmentName ||
    data.coordinatorDepartment ||
    data.assignedDepartment;
  return deptValue ? deptValue.toString().toUpperCase() : null;
};

const toNumberSafe = (value, defaultValue = 0) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
};

const formatGpa = (value) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  const num = Number(value);
  if (Number.isFinite(num)) {
    return num.toFixed(2);
  }
  return String(value).trim();
};

const buildSemesterGpaList = (raw = {}) => (
  Array.from({ length: 8 }, (_, idx) => {
    const candidates = [
      raw[`semester${idx + 1}GPA`],
      raw[`semester${idx + 1}`],
      raw?.semesterGPA?.[idx],
      raw?.semesterCgpa?.[idx],
      raw?.semesters?.[idx]?.gpa,
    ];
    const value = candidates.find((item) => item !== undefined && item !== null && item !== '');
    return formatGpa(value);
  })
);

const normalizeStudentRecord = (raw = {}) => {
  const source = { ...raw };
  const rawId = raw?._id;
  const resolvedId = rawId?.$oid || rawId?.oid || rawId;

  const regNo = toStringSafe(
    raw.regNo ??
    raw.registrationNumber ??
    raw.regno ??
    raw.studentRegNo ??
    raw.studentId ??
    raw.rollNumber
  );

  const id = toStringSafe(
    resolvedId ??
    raw.id ??
    regNo
  );

  const firstName = toStringSafe(raw.firstName ?? raw.firstname ?? '');
  const lastName = toStringSafe(raw.lastName ?? raw.lastname ?? '');
  const fallbackName = toStringSafe(raw.name ?? raw.fullName ?? raw.studentName ?? raw.candidateName ?? regNo);
  const composedName = `${firstName} ${lastName}`.trim();
  const name = composedName || fallbackName || 'Student';

  const year = toUpperSafe(raw.currentYear ?? raw.year ?? raw.studyYear ?? '');
  const semester = toStringSafe(raw.currentSemester ?? raw.semester ?? raw.sem ?? '');
  const section = toUpperSafe(raw.section ?? raw.Section ?? raw.classSection ?? raw.sectionName ?? '');
  const branch = toUpperSafe(raw.branch ?? raw.department ?? raw.degreeBranch ?? raw.program ?? raw.stream ?? '');
  const degree = toUpperSafe(raw.degree ?? raw.course ?? raw.programme ?? '');
  const batch = toStringSafe(raw.batch ?? raw.academicYear ?? raw.yearOfStudy ?? raw.batchYear ?? '');

  const arrears = toNumberSafe(
    raw.currentBacklogs ??
    raw.currentArrears ??
    raw.arrears ??
    raw.backlogs ??
    raw.activeArrears,
    0
  );

  const overallArrears = toNumberSafe(
    raw.clearedBacklogs ??
    raw.totalArrears ??
    raw.overallArrears ??
    raw.backlogsCleared ??
    raw.historyBacklogs,
    0
  );

  const cgpa = formatGpa(
    raw.currentCGPA ??
    raw.cgpa ??
    raw.semesterCGPA ??
    raw.cgpaScore
  );

  const overallCgpa = formatGpa(
    raw.overallCGPA ??
    raw.finalCGPA ??
    raw.cgpa ??
    raw.cgpaScore ??
    cgpa
  );

  const arrearStatus = toUpperSafe(raw.arrearStatus ?? raw.backlogStatus ?? '');

  const semesterGpas = buildSemesterGpaList(raw);

  const photo = toStringSafe(
    raw.profilePicURL ??
    raw.profilePhoto ??
    raw.profilePhotoUrl ??
    raw.photoURL ??
    raw.photo ??
    raw.image ??
    ''
  );

  return {
    id: id || (regNo ? `student-${regNo}` : undefined),
    regNo,
    name,
    year,
    semester,
    section,
    arrears,
    overallArrears,
    cgpa,
    overallCgpa,
    branch,
    batch,
    degree,
    arrearStatus,
    semesterGpas,
    photo,
    source,
  };
};

const formatYearSemester = (year, semester) => {
  const yearPart = toStringSafe(year);
  const semPart = toStringSafe(semester);
  if (yearPart && semPart) return `${yearPart}-${semPart}`;
  if (yearPart) return yearPart;
  if (semPart) return semPart;
  return '-';
};

const formatYearSection = (year, section) => {
  const yearPart = toStringSafe(year);
  const sectionPart = toUpperSafe(section);
  if (yearPart && sectionPart) return `${yearPart}-${sectionPart}`;
  return yearPart || sectionPart || '-';
};

const getDisplayValue = (value, fallback = '-') => (
  value === undefined || value === null || value === '' ? fallback : value
);

const getDisplayNumber = (value, fallback = '0') => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : value;
};

const parseNumericInput = (value, { allowFloat = false } = {}) => {
  const str = value !== undefined && value !== null ? String(value).trim() : '';
  if (str === '') {
    return { value: undefined };
  }
  const num = Number(str);
  if (!Number.isFinite(num)) {
    return { error: `Invalid number: ${value}` };
  }
  if (!allowFloat && !Number.isInteger(num)) {
    return { error: `Value must be an integer: ${value}` };
  }
  return { value: allowFloat ? Number(num.toFixed(2)) : num };
};

const ExportProgressPopup = ({ isOpen, operation, progress, onClose }) => {
  if (!isOpen) return null;
  
  const operationText = operation === 'excel' ? 'Exporting...' : 'Downloading...';
  const progressText = operation === 'excel' ? 'Exported' : 'Downloaded';
  
  // Calculate the stroke-dasharray for circular progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
      <div className={styles['co-ms-sem-export-popup-overlay']}>
          <div className={styles['co-ms-sem-export-popup-container']}>
              <div className={styles['co-ms-sem-export-popup-header']}>{operationText}</div>
              <div className={styles['co-ms-sem-export-popup-body']}>
                  <div className={styles['co-ms-sem-export-progress-circle']}>
                      <svg width="100" height="100" viewBox="0 0 100 100">
                          {/* Background circle */}
                          <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke="#e0e0e0"
                              strokeWidth="8"
                          />
                          {/* Progress circle */}
                          <circle
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke="#d23b42"
                              strokeWidth="8"
                              strokeDasharray={circumference}
                              strokeDashoffset={offset}
                              strokeLinecap="round"
                              transform="rotate(-90 50 50)"
                              style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                          />
                      </svg>
                     {/* <div className={styles['co-ms-sem-export-progress-text']}>{progress}%</div>*/}
                  </div>
                  <h2 className={styles['co-ms-sem-export-popup-title']}>{progressText} {progress}%</h2>
                  <p className={styles['co-ms-sem-export-popup-message']}>
                      The Details have been {operation === 'excel' ? 'Exporting...' : 'Downloading...'}
                  </p>
                  <p className={styles['co-ms-sem-export-popup-message']}>Please wait...</p>
              </div>
          </div>
      </div>
  );
};

const ExportSuccessPopup = ({ isOpen, operation, onClose }) => {
  if (!isOpen) return null;

  let title;
  let message;
  let headerText;

  if (operation === 'excel') {
    title = 'Exported To Excel ';
    message = 'The Details have been Successfully Exported to Excel in your device.';
    headerText = 'Exported!';
  } else if (operation === 'pdf') {
    title = 'PDF Downloaded ';
    message = 'The Details have been Successfully Downloaded as PDF to your device.';
    headerText = 'Downloaded!';
  } else if (operation === 'semester') {
    title = 'Semester Saved ';
    message = 'Student semester details have been updated successfully.';
    headerText = 'Semester Saved!';
  } else {
    title = 'Action Completed';
    message = 'The requested action finished successfully.';
    headerText = 'Success!';
  }
  
  return (
      <div className={styles['co-ms-sem-export-popup-overlay']}>
          <div className={styles['co-ms-sem-export-popup-container']}>
              <div className={styles['co-ms-sem-export-popup-header']}>{headerText}</div>
              <div className={styles['co-ms-sem-export-popup-body']}>
                  <div className={styles['co-ms-sem-export-success-icon']}>
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox="0 0 52 52" fill="none">
                        <circle className={styles['co-ms-sem-success-icon--circle']} cx="26" cy="26" r="25"/>
                        <path className={styles['co-ms-sem-success-icon--check']} d="M14.1 27.2l7.1 7.2 16.7-16.8" fill="none"
                            />
                        </svg>
                  </div>
                  <h2 className={styles['co-ms-sem-export-popup-title']}>{title}</h2>
                  <p className={styles['co-ms-sem-export-popup-message']}>{message}</p>
              </div>
              <div className={styles['co-ms-sem-export-popup-footer']}>
                  <button onClick={onClose} className={styles['co-ms-sem-export-popup-close-btn']}>Close</button>
              </div>
          </div>
      </div>
  );
};

const ExportFailedPopup = ({ isOpen, operation, onClose }) => {
  if (!isOpen) return null;
  
  const title = operation === 'excel' ? 'Export Failed!' : 'Download Failed!';
  const message = operation === 'excel'
      ? 'The Details could not be exported to Excel.'
      : 'The Details could not be downloaded as PDF.';
  const headerText = operation === 'excel' ? 'Export Failed!' : 'Download Failed!';
  
  return (
      <div className={styles['co-ms-sem-export-popup-overlay']}>
          <div className={styles['co-ms-sem-export-popup-container']}>
              <div className={styles['co-ms-sem-export-popup-header']}>{headerText}</div>
              <div className={styles['co-ms-sem-export-popup-body']}>
                  <div className={styles['co-ms-sem-export-failed-icon']}>
                      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                          <circle cx="40" cy="40" r="38" fill="#dc3545" />
                          <path
                              d="M30 30 L50 50 M50 30 L30 50"
                              stroke="white"
                              strokeWidth="4"
                              strokeLinecap="round"
                          />
                      </svg>
                  </div>
                  <h2 className={styles['co-ms-sem-export-popup-title']}>{title}</h2>
                  <p className={styles['co-ms-sem-export-popup-message']}>{message}</p>
              </div>
              <div className={styles['co-ms-sem-export-popup-footer']}>
                  <button onClick={onClose} className={styles['co-ms-sem-export-popup-close-btn']}>Close</button>
              </div>
          </div>
      </div>
  );
};

const StudentDetailsPopup = ({
  isOpen,
  student,
  onClose,
  onSave,
  isSaving = false,
  errorMessage,
  successMessage,
}) => {
  const buildInitialState = useCallback((sourceStudent) => {
    if (!sourceStudent) {
      return {
        semester1GPA: '',
        semester2GPA: '',
        semester3GPA: '',
        semester4GPA: '',
        semester5GPA: '',
        semester6GPA: '',
        semester7GPA: '',
        semester8GPA: '',
        overallArrears: '',
        overallCgpa: '',
        arrearStatus: '',
      };
    }

    const semesterValues = Array.from({ length: 8 }, (_, idx) =>
      formatGpa(sourceStudent.semesterGpas?.[idx]) || ''
    );

    return {
      semester1GPA: semesterValues[0] ?? '',
      semester2GPA: semesterValues[1] ?? '',
      semester3GPA: semesterValues[2] ?? '',
      semester4GPA: semesterValues[3] ?? '',
      semester5GPA: semesterValues[4] ?? '',
      semester6GPA: semesterValues[5] ?? '',
      semester7GPA: semesterValues[6] ?? '',
      semester8GPA: semesterValues[7] ?? '',
      overallArrears: getDisplayValue(sourceStudent?.overallArrears, ''),
      overallCgpa: formatGpa(sourceStudent?.overallCgpa) || '',
      arrearStatus: getDisplayValue(sourceStudent?.arrearStatus, ''),
    };
  }, []);

  const [formState, setFormState] = useState(buildInitialState(student));

  useEffect(() => {
    setFormState(buildInitialState(student));
  }, [student, buildInitialState]);

  if (!isOpen || !student) return null;

  const {
    name,
    regNo,
    year,
    semester,
    section,
    batch,
    degree,
    branch,
    photo,
  } = student;

  const semesterFieldConfig = [
    { key: 'semester1GPA', label: 'Semester 1' },
    { key: 'semester2GPA', label: 'Semester 2' },
    { key: 'semester3GPA', label: 'Semester 3' },
    { key: 'semester4GPA', label: 'Semester 4' },
    { key: 'semester5GPA', label: 'Semester 5' },
    { key: 'semester6GPA', label: 'Semester 6' },
    { key: 'semester7GPA', label: 'Semester 7' },
    { key: 'semester8GPA', label: 'Semester 8' },
  ];

  const handleChange = (field) => (event) => {
    const { value } = event.target;
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleGpaChange = (field) => (event) => {
    const { value } = event.target;
    const sanitized = value.replace(/[^0-9.]/g, '');
    if (!sanitized) {
      setFormState((prev) => ({ ...prev, [field]: '' }));
      return;
    }
    const [whole, ...decimalParts] = sanitized.split('.');
    let nextValue = whole;
    if (decimalParts.length) {
      nextValue += `.${decimalParts.join('').slice(0, 2)}`;
    }
    setFormState((prev) => ({ ...prev, [field]: nextValue }));
  };

  const handleSaveClick = () => {
    if (isSaving) return;
    onSave?.(formState);
  };

  return (
    <div className={styles['semester-popup-overlay']} onClick={onClose}>
      <div className={styles['semester-popup-container']} onClick={(e) => e.stopPropagation()}>
        <div className={styles['semester-popup-header']}>Semester Details</div>

        <div className={styles['semester-popup-body']}>
          {/* Student Info Card */}
          <div className={styles['semester-student-card']}>
            <img src={photo || studentcapicon} alt="Student" className={styles['semester-student-photo']} />
            <div className={styles['semester-student-info']}>
              <div className={styles['semester-info-grid']}>
                <div className={styles['semester-info-item']}>
                  <span className={styles['semester-info-label']}>Name</span>
                  <span className={styles['semester-info-value']}>{getDisplayValue(name)}</span>
                </div>
                <div className={styles['semester-info-item']}>
                  <span className={styles['semester-info-label']}>Year-sec</span>
                  <span className={styles['semester-info-value']}>{formatYearSection(year, section)}</span>
                </div>
              </div>
              <div className={styles['semester-info-grid']}>
                <div className={styles['semester-info-item']}>
                  <span className={styles['semester-info-label']}>Reg No</span>
                  <span className={styles['semester-info-value']}>{getDisplayValue(regNo)}</span>
                </div>
                <div className={styles['semester-info-item']}>
                  <span className={styles['semester-info-label']}>Semester</span>
                  <span className={styles['semester-info-value']}>{getDisplayValue(semester)}</span>
                </div>
              </div>
              <div className={styles['semester-info-grid']}>
                <div className={styles['semester-info-item']}>
                  <span className={styles['semester-info-label']}>Batch</span>
                  <span className={styles['semester-info-value']}>{getDisplayValue(batch)}</span>
                </div>
                <div className={styles['semester-info-item']}>
                  <span className={styles['semester-info-label']}>Degree.Branch</span>
                  <span className={styles['semester-info-value']}>
                    {getDisplayValue(degree)}{branch ? ` ${branch}` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {(errorMessage || successMessage) && (
            <div
              className={
                errorMessage
                  ? styles['semester-popup-feedback-error']
                  : styles['semester-popup-feedback-success']
              }
            >
              {errorMessage || successMessage}
            </div>
          )}

          {/* Scrollable Semester Inputs - 2 per row */}
          <div className={styles['semester-scroll-container']}>
            {[0, 1, 2, 3].map((rowIdx) => (
              <div key={rowIdx} className={styles['semester-dual-input-row']}>
                {semesterFieldConfig.slice(rowIdx * 2, rowIdx * 2 + 2).map((field) => (
                  <div key={field.key} className={styles['semester-field-wrapper']}>
                    <label className={styles['semester-field-label']}>{field.label}</label>
                    <input
                      type="text"
                      className={styles['semester-input-field']}
                      value={formState[field.key]}
                      onChange={handleGpaChange(field.key)}
                      placeholder="eg. 8.09"
                      disabled={isSaving}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className={styles['semester-field-wrapper']}>
            <label className={styles['semester-field-label']}>Overall Arrear</label>
            <input
              type="text"
              className={styles['semester-input-field']}
              value={formState.overallArrears}
              onChange={handleChange('overallArrears')}
              placeholder="0"
              disabled={isSaving}
            />
          </div>

          <div className={styles['semester-dual-input-row']}>
            <div className={styles['semester-field-wrapper']}>
              <label className={styles['semester-field-label']}>Overall CGPA</label>
              <input
                type="text"
                className={styles['semester-input-field']}
                value={formState.overallCgpa}
                onChange={handleChange('overallCgpa')}
                placeholder="eg. 8.09"
                disabled={isSaving}
              />
            </div>
            <div className={styles['semester-field-wrapper']}>
              <label className={styles['semester-field-label']}>Arrear Status</label>
              <select
                className={styles['semester-select-field']}
                value={formState.arrearStatus}
                onChange={handleChange('arrearStatus')}
                disabled={isSaving}
              >
                <option value="">Select Status</option>
                <option value="NHA">NHA</option>
                <option value="NSA">NSA</option>
                <option value="SA">SA</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles['semester-popup-footer']}>
          <button
            className={styles['semester-discard-btn']}
            onClick={onClose}
            disabled={isSaving}
          >
            Close
          </button>
          <button
            className={styles['semester-save-btn']}
            onClick={handleSaveClick}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

const initialFilters = {
  name: '',
  regNo: '',
  semester: '',
  year: '',
  section: '',
};

function ManageStudentsSemester({ onLogout, currentView, onViewChange }) {
  const navigate = useNavigate();
  const [coordinatorData, setCoordinatorData] = useState(() => readStoredCoordinatorData());
  const coordinatorDepartment = useMemo(
    () => resolveCoordinatorDepartment(coordinatorData) || 'CSE',
    [coordinatorData]
  );

  const [controlFilters, setControlFilters] = useState(initialFilters);
  const [activeFilters, setActiveFilters] = useState(initialFilters);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showStudentPopup, setShowStudentPopup] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [branchName, setBranchName] = useState('');
  const [popupSaving, setPopupSaving] = useState(false);
  const [popupError, setPopupError] = useState('');
  const [popupSuccess, setPopupSuccess] = useState('');
  const [showSemesterSuccessPopup, setShowSemesterSuccessPopup] = useState(false);
  const popupResetTimerRef = useRef(null);

  useEffect(() => {
    const checkForUpdates = () => {
      const fresh = readStoredCoordinatorData();
      if (JSON.stringify(fresh) !== JSON.stringify(coordinatorData)) {
        setCoordinatorData(fresh);
      }
    };
    checkForUpdates();
  }, [coordinatorData]);

  const handleCloseStudentPopup = useCallback(() => {
    setShowStudentPopup(false);
    setSelectedStudent(null);
    setPopupSaving(false);
    setPopupError('');
    setPopupSuccess('');
    setShowSemesterSuccessPopup(false);
    if (popupResetTimerRef.current) {
      clearTimeout(popupResetTimerRef.current);
      popupResetTimerRef.current = null;
    }
  }, []);

  const handleSaveStudentDetails = useCallback(async (formState) => {

    if (!selectedStudent) return;

    const semesterKeys = [
      'semester1GPA','semester2GPA','semester3GPA','semester4GPA',
      'semester5GPA','semester6GPA','semester7GPA','semester8GPA'
    ];

    const errors = [];
    const parsedSemesterValues = semesterKeys.map((key, idx) => {
      const { value, error } = parseNumericInput(formState[key], { allowFloat: true });
      if (error) errors.push(`Semester ${idx + 1}: ${error}`);
      return value;
    });

    const { value: parsedOverallArrears, error: overallArrearError } = parseNumericInput(formState.overallArrears, { allowFloat: false });
    if (overallArrearError) errors.push(`Overall Arrear: ${overallArrearError}`);

    const { value: parsedOverallCgpa, error: overallCgpaError } = parseNumericInput(formState.overallCgpa, { allowFloat: true });
    if (overallCgpaError) errors.push(`Overall CGPA: ${overallCgpaError}`);

    if (errors.length) {
      setPopupError(errors.join('\n'));
      setPopupSuccess('');
      return;
    }

    const studentId = selectedStudent.id || selectedStudent._id || selectedStudent?.source?._id;
    if (!studentId) {
      setPopupError('Student identifier missing.');
      return;
    }

    setPopupSaving(true);
    setPopupError('');
    setPopupSuccess('');

    const updatePayload = {};
    parsedSemesterValues.forEach((val, idx) => {
      if (val !== undefined) {
        const field = idx + 1;
        updatePayload[`semester${field}GPA`] = val;
        updatePayload[`semester${field}`] = val;
      }
    });

    if (parsedSemesterValues.some(val => val !== undefined)) {
      const existingNumbers = Array.from({ length: 8 }, (_, idx) => {
        const existing = selectedStudent.semesterGpas?.[idx];
        const num = Number(existing);
        return Number.isFinite(num) ? Number(num.toFixed(2)) : undefined;
      });

      const mergedNumbers = parsedSemesterValues.map((val, idx) =>
        val !== undefined ? val : existingNumbers[idx]
      );

      updatePayload.semesterGPA = mergedNumbers;
      updatePayload.semesterGpas = mergedNumbers;
    }

    if (parsedOverallArrears !== undefined) {
      updatePayload.clearedBacklogs = parsedOverallArrears;
      updatePayload.overallArrears = parsedOverallArrears;
      updatePayload.totalArrears = parsedOverallArrears;
      updatePayload.backlogsCleared = parsedOverallArrears;
      updatePayload.historyBacklogs = parsedOverallArrears;
    }

    if (parsedOverallCgpa !== undefined) {
      updatePayload.overallCGPA = parsedOverallCgpa;
      updatePayload.finalCGPA = parsedOverallCgpa;
    }

    if (formState.arrearStatus !== undefined) {
      const status = formState.arrearStatus?.toUpperCase?.() || '';
      updatePayload.arrearStatus = status;
      updatePayload.backlogStatus = status;
    }

    try {
      await mongoDBService.updateStudent(studentId, updatePayload);

      const updatedSemesterGpas = Array.from({ length: 8 }, (_, idx) => {
        if (parsedSemesterValues[idx] !== undefined) {
          return formatGpa(parsedSemesterValues[idx]);
        }
        const existing = selectedStudent.semesterGpas?.[idx];
        return existing !== undefined && existing !== null ? existing : '';
      });

      const nextStudent = {
        ...selectedStudent,
        semesterGpas: updatedSemesterGpas,
        overallArrears: parsedOverallArrears !== undefined ? parsedOverallArrears : selectedStudent.overallArrears,
        overallCgpa: parsedOverallCgpa !== undefined ? formatGpa(parsedOverallCgpa) : selectedStudent.overallCgpa,
        arrearStatus: formState.arrearStatus?.toUpperCase?.() || selectedStudent.arrearStatus,
      };

      const matchesStudent = (candidate) => {
        const candidateId = candidate.id || candidate._id || candidate?.source?._id;
        const targetId = nextStudent.id || nextStudent._id || nextStudent?.source?._id;
        if (candidateId && targetId && candidateId === targetId) return true;
        if (candidate.regNo && nextStudent.regNo && candidate.regNo === nextStudent.regNo) return true;
        return false;
      };

      setStudents(prev => prev.map(item => (matchesStudent(item) ? { ...item, ...nextStudent } : item)));
      setSelectedStudent(nextStudent);
      setPopupSuccess('Semester details saved successfully.');
      setShowSemesterSuccessPopup(true);
      popupResetTimerRef.current = setTimeout(() => {
        setPopupSuccess('');
        setShowSemesterSuccessPopup(false);
        popupResetTimerRef.current = null;
      }, 3000);
    } catch (error) {
      console.error('Failed to update semester details:', error);
      setPopupError(error.message || 'Failed to save details.');
      setPopupSuccess('');
    } finally {
      setPopupSaving(false);
    }
  }, [selectedStudent, students, setStudents, setSelectedStudent, setPopupSuccess, setPopupError, setPopupSaving]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (activeFilters.name && !student.name.toLowerCase().includes(activeFilters.name.toLowerCase())) {
        return false;
      }
      if (activeFilters.regNo && !student.regNo.toLowerCase().includes(activeFilters.regNo.toLowerCase())) {
        return false;
      }
      if (activeFilters.semester && student.semester.toString() !== activeFilters.semester) {
        return false;
      }
      if (activeFilters.year && student.year !== activeFilters.year) {
        return false;
      }
      if (activeFilters.section && student.section !== activeFilters.section) {
        return false;
      }
      return true;
    });
  }, [students, activeFilters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setControlFilters(prevFilters => ({
        ...prevFilters,
        [name]: value.startsWith('Search by') ? '' : value
    }));
  };

  const [exportPopupState, setExportPopupState] = useState({
    isOpen: false,
    type: null, // 'progress', 'success', 'failed'
    operation: null, // 'excel', 'pdf'
    progress: 0
});

  const handleApplyFilters = () => {
    setActiveFilters(controlFilters);
  };

  const handleClearFilters = () => {
    setControlFilters(initialFilters);
    setActiveFilters(initialFilters);
  };

  const handleSelectStudent = (idx, student) => {
    const isSelected = selectedStudents.includes(idx);
    
    if (isSelected) {
      setSelectedStudents(prev => prev.filter(i => i !== idx));
    } else {
      setSelectedStudents(prev => [...prev, idx]);
      setSelectedStudent(student);
      setShowStudentPopup(true);
      setPopupError('');
      setPopupSuccess('');
      setShowSemesterSuccessPopup(false);
      if (popupResetTimerRef.current) {
        clearTimeout(popupResetTimerRef.current);
        popupResetTimerRef.current = null;
      }
    }
  };

    // Function to simulate progress and handle export
    const simulateExport = async (operation, exportFunction) => {
      setShowExportMenu(false);
      
      // Show progress popup
      setExportPopupState({
          isOpen: true,
          type: 'progress',
          operation: operation,
          progress: 0
      });

      let progressInterval;
      let progressTimeout;

      try {
          // Simulate progress from 0 to 100
          progressInterval = setInterval(() => {
              setExportPopupState(prev => {
                  if (prev.progress < 100 && prev.type === 'progress') {
                      return { ...prev, progress: Math.min(prev.progress + 10, 100) };
                  }
                  return prev;
              });
          }, 200);

          // Wait for progress animation to complete
          await new Promise(resolve => {
              progressTimeout = setTimeout(() => {
                  clearInterval(progressInterval);
                  resolve();
              }, 2000);
          });
          
          // Perform the actual export
          exportFunction();
          
          // Show success popup
          setExportPopupState({
              isOpen: true,
              type: 'success',
              operation: operation,
              progress: 100
          });
      } catch (error) {
          if (progressInterval) clearInterval(progressInterval);
          if (progressTimeout) clearTimeout(progressTimeout);
          
          // Show failed popup
          setExportPopupState({
              isOpen: true,
              type: 'failed',
              operation: operation,
              progress: 0
          });
      }
  };

  
  const exportToExcel = () => {
    try{
    const data = filteredStudents.map((s, i) => ({
      SNo: i + 1,
      RegisterNumber: s.regNo,
      Name: s.name,
      "Year-Sec": formatYearSection(s.year, s.section),
      Semester: s.semester,
      Arrears: s.overallArrears,
      "Overall CGPA": s.overallCgpa,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, 'Students_Semester_Performance.xlsx');
    setShowExportMenu(false);
  }catch (error){
    throw error;
  }
  };

  const exportToPDF = () => {
    try{
    const doc = new jsPDF();
    doc.text('Students List', 14, 16);
    const head = [["S.No","Register Number","Name","Year-Sec","Sem","Arrears","Overall CGPA"]];
    const body = filteredStudents.map((s, i) => [
      i + 1,
      s.regNo,
      s.name,
      formatYearSection(s.year, s.section),
      s.semester,
      s.overallArrears,
      s.overallCgpa,
    ]);
  autoTable(doc, { head, body, startY: 22 });
    doc.save('Students_SemesterPerformance.pdf');
    setShowExportMenu(false);
  }catch (error){
    throw error;
  }
  };
  const handleExportToPDF = () => {
    simulateExport('pdf', exportToPDF);
  };
  
  const handleExportToExcel = () => {
    simulateExport('excel', exportToExcel);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };
   const handleCardClick = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const fetchStudents = async () => {
      if (!coordinatorDepartment) {
        setStudents([]);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const normalizedDept = coordinatorDepartment.trim();

        const resolveList = (payload) => (
          Array.isArray(payload)
            ? payload
            : payload?.students || payload?.data || []
        );

        // First try: fetch by department
        let response = await mongoDBService.getStudents({
          department: normalizedDept,
          includeCgpa: 'true',
          includeSemesterData: 'true'
        });

        if (!isMounted) return;

        let list = resolveList(response);

        // Second try: fetch by branch if department didn't work
        if ((!list || list.length === 0) && normalizedDept) {
          response = await mongoDBService.getStudents({
            branch: normalizedDept,
            includeCgpa: 'true',
            includeSemesterData: 'true'
          });
          if (!isMounted) return;
          list = resolveList(response);
        }

        // Third try: fetch all and filter locally
        if (!list || list.length === 0) {
          response = await mongoDBService.getStudents({
            includeCgpa: 'true',
            includeSemesterData: 'true'
          });
          if (!isMounted) return;
          list = resolveList(response);
        }

        const normalized = (list || [])
          .map(normalizeStudentRecord)
          .filter(student => {
            if (!student || !student.regNo) return false;
            // Filter by coordinator's department
            const studentDept = (student.branch || '').toString().toUpperCase();
            return studentDept === normalizedDept;
          });

        setStudents(normalized);
        setBranchName(normalizedDept);
      } catch (error) {
        if (!isMounted) return;
        console.error('Failed to load students:', error);
        setLoadError(error.message || 'Failed to load students.');
        setStudents([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchStudents();

    return () => {
      isMounted = false;
    };
  }, [coordinatorDepartment]);

  useEffect(() => {
    if (filteredStudents.length > 0) {
      setBranchName(filteredStudents[0].branch || 'STUDENTS');
      return;
    }

    const uniqueBranches = [...new Set(students.map(student => student.branch).filter(Boolean))];
    if (uniqueBranches.length === 1) {
      setBranchName(uniqueBranches[0]);
    } else if (!uniqueBranches.length) {
      setBranchName('STUDENTS');
    }
  }, [filteredStudents, students]);

  return (
   
    <div className={styles['co-ms-sem-main-content']}>
      <style>{`
        .filter-header {
            background: #dbdada;
            border-radius: 20px;
            padding: 30px 0px;
            margin-bottom: 10px;
            display: flex;
            flex-direction: column;
            margin-top: 40px;
            width: 1062px;
            margin-left: 330px;
            height: 237px;
            box-sizing: border-box;
            font-family: 'Poppins', sans-serif;
        }

        .semester-btn {
            align-self: flex-end;
            background: #c93544;
            color: #fff;
            border: none;
            padding: 10px 30px;
            border-radius: 20px;
            font-weight: 600;
            cursor: pointer;
            width: 200px;
            height: 70px;
            font-size: 1.05rem;
            margin-right: 428px;
            margin-top: -10px;
        }

        .filters-row {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            align-items: center;
            margin-left: 38px;
            margin-top: 10px;
        }

        .dropdown, .dropdown-alt {
            padding: 10px 18px;
            border-radius: 12px;
            background: #fff;
            font-size: 16px;
            height: 60px;
            outline: none;
            width: 315px;
            border: none;
            color: #8a8a8a;
            cursor: pointer;
        }

        .dropdown-alt {
            margin-left: 20px;
        }

        .floating-field {
            position: relative;
            width: 315px;
        }

        .floating-input {
            width: 100%;
            padding: 35px 14px 6px 14px;
            border-radius: 12px;
            border: none;
            background: #fff;
            font-size: 16px;
            color: #4a4848;
            box-sizing: border-box;
        }

        .floating-label {
            position: absolute;
            left: 14px;
            top: 18px;
            color: #8a8a8a;
            font-size: 1.05rem;
            pointer-events: none;
            transition: transform 150ms ease, font-size 150ms ease, top 150ms ease, color 150ms ease;
        }

        .floating-field.filled .floating-label,
        .floating-input:focus + .floating-label {
            top: -17px;
            font-size: 13px;
            color: #c93544;
        }

        .filter-btn {
            background: #fff;
            border: 2px solid #c93544;
            color: #c93544;
            font-weight: 600;
            border-radius: 8px;
            padding: 10px 20px;
            cursor: pointer;
            margin-left: 20px;
            transition: all 150ms ease;
        }

        .filter-btn:hover {
            background: #c93544;
            color: #fff;
        }

        .filter-btn-clear {
            background: #e9e9e9;
            border: 2px solid #4a4848;
            color: #4a4848;
            font-weight: 600;
            border-radius: 8px;
            padding: 10px 20px;
            cursor: pointer;
            margin-left: 10px;
            transition: all 150ms ease;
        }

        .filter-btn-clear:hover {
            background-color: #fff;
            border: 2px solid #c93544;
            color: #c93544;
        }

        @media (max-width: 768px) {
            .filter-header {
                width: 100%;
                margin-left: 0;
                height: auto;
                padding: 16px;
            }
            .semester-btn {
                margin-right: 0;
                width: 100%;
            }
            .filters-row {
                margin-left: 0;
                flex-direction: column;
                align-items: stretch;
            }
            .floating-field, .dropdown, .dropdown-alt {
                width: 100%;
                margin-left: 0;
            }
        }
      `}</style>
      
      <Navbar  onToggleSidebar={toggleSidebar}  onHamburgerClick={() => setSidebarOpen(prev => !prev)} isMenuOpen={sidebarOpen} />
      <Sidebar 
        isOpen={isSidebarOpen} 
        onLogout={onLogout} 
        visible={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        currentView="manage-students"
        onViewChange={handleCardClick}
      />

      {/* Filter Card */}
      <div className="filter-card-container" style={{padding: '10px 20px'}}>
        <div className="filter-header">
          <button className="semester-btn">Semester</button>

          <div className="filters-row">
            <div className={`floating-field ${controlFilters.name ? 'filled' : ''}`}>
              <input
                className="floating-input"
                name="name"
                value={controlFilters.name}
                onChange={handleInputChange}
              />
              <label className="floating-label">Search by Name</label>
            </div>

            <select
              className="dropdown"
              name="semester"
              value={controlFilters.semester || 'Search by Sem'}
              onChange={handleInputChange}
            >
              <option disabled value="Search by Sem">Search by Sem</option>
              {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'].map((val, idx) => (
                <option key={idx} value={idx + 1}>{val}</option>
              ))}
            </select>

            <select
              className="dropdown"
              name="year"
              value={controlFilters.year || 'Search by Year'}
              onChange={handleInputChange}
            >
              <option disabled value="Search by Year">Search by Year</option>
              {['I', 'II', 'III', 'IV'].map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>

            <div className={`floating-field ${controlFilters.regNo ? 'filled' : ''}`}>
              <input
                className="floating-input"
                name="regNo"
                value={controlFilters.regNo}
                onChange={handleInputChange}
              />
              <label className="floating-label">Search by Reg.no</label>
            </div>

            
            
            <button className="filter-btn" onClick={handleApplyFilters}>
              Apply Filters
            </button>
            
            <button className="filter-btn-clear" onClick={handleClearFilters}>
              Clear Filters
            </button>
            <select
              className="dropdown-alt"
              name="section"
              value={controlFilters.section || 'Search by Section'}
              onChange={handleInputChange}
            >
              <option disabled value="Search by Section">Search by Section</option>
              {['A', 'B', 'C', 'D'].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
        
      <div className={styles['co-ms-sem-main-content__table-section']}>
        <div className={styles['co-ms-sem-main-content__table-header']}>
          <span className={styles['co-ms-sem-main-content__table-title']}>
            {branchName || 'STUDENTS'}: {filteredStudents.length} Students
          </span>
          <div className={styles['export-wrap']}>
            <button
              className={styles['co-ms-sem-main-content__print-btn']}
              onClick={() => setShowExportMenu(prev => !prev)}
            >
              Print
            </button>
            {showExportMenu && (
              <div className={styles['export-dropdown']}>
                
                <button className={styles['export-option']} onClick={handleExportToExcel}>Export to Excel</button>
                <button className={styles['export-option']} onClick={handleExportToPDF}>Save as PDF</button>
              </div>
            )}
          </div>
        </div>
        <div className={styles['co-ms-sem-main-content__table-wrapper']}>
          <table className={styles['co-ms-sem-main-content__table']}>
            <thead>
              <tr>
                <th className={styles['co-ms-sem-col-select']}>Select</th>
                <th className={styles['co-ms-sem-col-sno']}>S.No</th>
                <th className={styles['co-ms-sem-col-regno']}>Reg.No</th>
                <th className={styles['co-ms-sem-col-name']}>Name</th>
                <th className={styles['co-ms-sem-col-yearsec']}>Year-Sec</th>
                <th className={styles['co-ms-sem-col-sem']}>Sem</th>
                <th className={styles['co-ms-sem-col-arrears']}>Arrears</th>
                <th className={styles['co-ms-sem-col-cgpa']}>Overall CGPA</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td className={styles['co-ms-sem-loading']} colSpan="8">Loading students…</td>
                </tr>
              )}
              {loadError && !isLoading && (
                <tr>
                  <td className={styles['co-ms-sem-error']} colSpan="8">{loadError}</td>
                </tr>
              )}
              {!isLoading && !loadError && filteredStudents.map((student, i) => (
                <tr key={student.id || `${student.regNo}-${i}`}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedStudents.includes(i)}
                      onChange={() => handleSelectStudent(i, student)}
                    />
                  </td>
                  <td>{i + 1}</td>
                  <td>{getDisplayValue(student.regNo)}</td>
                  <td>{getDisplayValue(student.name)}</td>
                  <td>{formatYearSection(student.year, student.section)}</td>
                  <td>{getDisplayValue(student.semester)}</td>
                  <td>{getDisplayNumber(student.overallArrears)}</td>
                  <td>{getDisplayValue(student.overallCgpa, '-')}</td>
                </tr>
              ))}
              {!isLoading && !loadError && filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="8" style={{fontFamily:"'Poppins','sans-serif'",fontSize:"1.08rem"}}>No students match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        {/* Export Popups */}
        {exportPopupState.isOpen && exportPopupState.type === 'progress' && (
                <ExportProgressPopup
                    isOpen={true}
                    operation={exportPopupState.operation}
                    progress={exportPopupState.progress}
                    onClose={() => {}}
                />
            )}
            
            {exportPopupState.isOpen && exportPopupState.type === 'success' && (
                <ExportSuccessPopup
                    isOpen={true}
                    operation={exportPopupState.operation}
                    onClose={() => setExportPopupState({ isOpen: false, type: null, operation: null, progress: 0 })}
                />
            )}
            
            {exportPopupState.isOpen && exportPopupState.type === 'failed' && (
                <ExportFailedPopup
                    isOpen={true}
                    operation={exportPopupState.operation}
                    onClose={() => setExportPopupState({ isOpen: false, type: null, operation: null, progress: 0 })}
                />
            )}

            {/* Student Details Popup */}
            <StudentDetailsPopup
                isOpen={showStudentPopup}
                student={selectedStudent}
                onClose={handleCloseStudentPopup}
                onSave={handleSaveStudentDetails}
                isSaving={popupSaving}
                errorMessage={popupError}
                successMessage={popupSuccess}
            />

            {showSemesterSuccessPopup && (
              <ExportSuccessPopup
                isOpen={true}
                operation="semester"
                onClose={() => setShowSemesterSuccessPopup(false)}
              />
            )}
    </div>
  );
}
export default ManageStudentsSemester;