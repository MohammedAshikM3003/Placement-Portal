import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from "react-router-dom";
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import { API_BASE_URL } from '../utils/apiConfig';
import { CertificatePreviewProgressAlert, PreviewProgressAlert, PreviewFailedAlert } from '../components/alerts';
import styles from './Coo_ManageStudentsSemester_new.module.css';
import Adminicon from "../assets/Adminicon.png";
import semesterUploadIcon from "../assets/Cood_ms_semuploadicon.svg";
import manageStudentsIcon from "../assets/Coo_ManagestudentsCardicon.svg";
import Dropdown from '../components/common/Dropdown/Dropdown.jsx';

// Start with no subjects; show notice before upload
const INITIAL_SUBJECTS = [];

const GRADE_OPTIONS = ['Select Credit', '4 Credits', '3 Credits', '2 Credits', '1 Credit','0 Credit'];
const YEAR_OPTIONS = ['I', 'II', 'III', 'IV'];
const YEAR_SEMESTER_MAP = {
  'I': ['1', '2'],
  'II': ['3', '4'],
  'III': ['5', '6'],
  'IV': ['7', '8']
};
const NO_FILE_SELECTED = 'No file selected';

const BinIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </svg>
);

const EyeIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ClockIcon = () => (
  <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#8A5A44" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ marginBottom: '10px' }}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SelectIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D73D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
  </svg>
);

const UploadFileIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D73D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const VerifyIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D73D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
    <path d="M10 9H8" />
  </svg>
);

const SaveIcon = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D73D3D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

function ManageStudentsSemester({ onLogout, onViewChange }) {
  useCoordinatorAuth(); // JWT authentication verification
  const navigate = useNavigate();

  // Sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const uploadInputRef = useRef(null);
  const previewUrlRef = useRef(null);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const [fileName, setFileName] = useState(NO_FILE_SELECTED);
  const [selectedFile, setSelectedFile] = useState(null);
  const [subjects, setSubjects] = useState(INITIAL_SUBJECTS);
  const [masterSubjects, setMasterSubjects] = useState([]);
  const [hasPreviewData, setHasPreviewData] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showUploadingPopup, setShowUploadingPopup] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadFailedPopup, setShowUploadFailedPopup] = useState(false);
  const [uploadFailedMessage, setUploadFailedMessage] = useState('');
  const [isSavingSubjects, setIsSavingSubjects] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [extractedStudents, setExtractedStudents] = useState([]);
  const [extractedPdfName, setExtractedPdfName] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [uploadId, setUploadId] = useState('');
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [showSemNotePopup, setShowSemNotePopup] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(null);
  const [previewPopupState, setPreviewPopupState] = useState('none');
  const [previewProgress, setPreviewProgress] = useState(0);

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    setSelectedSemester('');
  };

  const handleYearSelect = (val) => {
    setSelectedYear(val);
    setSelectedSemester('');
  };

  const availableSemesters = selectedYear ? YEAR_SEMESTER_MAP[selectedYear] : [];

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        window.URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const loadMasterSubjects = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/subjects`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
        });

        if (!response.ok) {
          throw new Error('Failed to load subject master list');
        }

        const data = await response.json();
        setMasterSubjects(Array.isArray(data.subjects) ? data.subjects : []);
      } catch (error) {
        console.error('Error loading subject master list:', error);
        setMasterSubjects([]);
      }
    };

    loadMasterSubjects();
  }, []);

  const allCreditsSelected = useMemo(
    () => subjects.every((subject) => {
      // If subject exists in master with explicit credits (including 0), it's considered filled.
      if (subject.existsInMaster && subject.masterCredits !== null && subject.masterCredits !== undefined) return true;
      // Otherwise user must select a credit value
      return Boolean(subject.grade && subject.grade !== 'Select Credit');
    }),
    [subjects]
  );

  const masterSubjectLookup = useMemo(() => {
    const lookup = new Map();
    for (const subject of masterSubjects) {
      lookup.set(String(subject.courseCode || '').trim().toUpperCase(), subject);
    }
    return lookup;
  }, [masterSubjects]);

  const unavailableSubjects = useMemo(() => {
    if (!hasPreviewData) {
      return [];
    }

    const uploadedCodes = new Set(
      subjects.map((subject) => String(subject.code || subject.id || '').trim().toUpperCase()).filter(Boolean)
    );

    return masterSubjects
      .filter((subject) => !uploadedCodes.has(String(subject.courseCode || '').trim().toUpperCase()))
      .map((subject) => ({
        id: subject.courseCode,
        code: subject.courseCode,
        name: subject.courseName,
        credits: subject.credits ?? null,
      }));
  }, [hasPreviewData, masterSubjects, subjects]);

  const buildSubjectRows = (rawSubjects) => {
    console.log("Input subjects:", rawSubjects.length);
    console.log('🔄 [buildSubjectRows] Received raw subjects:', rawSubjects.slice(0, 2).map(s => ({code: s.courseCode, semester: s.semester})));
    
    // Log duplicates using courseCode + semester key
    const freq = {};
    for (const s of rawSubjects) {
      const code = s.courseCode || s.code || '';
      const sem = s.semester || s.sem || '';
      const key = `${code}_${sem}`;
      freq[key] = (freq[key] || 0) + 1;
    }
    console.log("Subject frequency table (duplicates before name key integration):");
    console.table(
      Object.entries(freq).filter(([k, v]) => v > 1)
    );

    const subjectMap = new Map();

    for (const rawSubject of rawSubjects) {
      const courseCode = String(rawSubject.courseCode || rawSubject.course_code || '').trim().toUpperCase();
      if (!courseCode) continue;

      const masterSubject = masterSubjectLookup.get(courseCode);
      // Fix: treat string 'undefined' as falsy
      const rawSemCandidate = rawSubject.semester ?? rawSubject.sem ?? null;
      const rawSem = rawSemCandidate && rawSemCandidate !== 'undefined' ? rawSemCandidate : null;
      const semesterValue = rawSem || '';
      const semesterKey = semesterValue ? String(semesterValue) : 'NA';
      
      // Use name in mapKey to prevent distinct subjects (like Technical English-I and II) from collapsing
      const nameValue = String(rawSubject.originalCourseName || rawSubject.courseName || rawSubject.course_name || '').trim().toUpperCase();
      const mapKey = `${courseCode}_${semesterKey}_${nameValue}`;

      if (!subjectMap.has(mapKey)) {
        console.log(`🔍 [${courseCode}] rawSem=${rawSem}, final=${semesterValue}, name=${nameValue}`);
        const semesterNumber = Number(semesterValue) || 0;
        const yearValue = semesterNumber ? Math.ceil(semesterNumber / 2) : (masterSubject?.year || '');

        subjectMap.set(mapKey, {
          id: mapKey,
          semester: semesterValue,
          year: yearValue,
          code: courseCode,
          name: rawSubject.courseName || rawSubject.course_name || rawSubject.course_title || '',
          grade: masterSubject && masterSubject.credits !== null && masterSubject.credits !== undefined
            ? `${masterSubject.credits} Credits`
            : '',
          existsInMaster: Boolean(masterSubject),
          masterCredits: masterSubject?.credits ?? null,
          sem: rawSubject.sem ?? null,
        });
      } else {
        console.log(
          "Duplicate removed (collided on identical key):",
          mapKey,
          "Existing in Map:",
          subjectMap.get(mapKey),
          "New Duplicate Attempt:",
          rawSubject
        );
      }
    }

    const rows = Array.from(subjectMap.values());
    console.log("Output rows:", rows.length);

    const inputCodes = rawSubjects.map(s => s.courseCode || s.code);
    const outputCodes = rows.map(r => r.courseCode || r.code);
    console.log("Missing course codes in output:", inputCodes.filter(x => !outputCodes.includes(x)));

    return rows;
  };

  const handleGradeChange = (subjectId, grade) => {
    setSubjects((prev) =>
      prev.map((subject) => (subject.id === subjectId ? { ...subject, grade } : subject))
    );
  };

  const handleDiscard = () => {
    setSubjects([]);
    setHasPreviewData(false);
    setFileName(NO_FILE_SELECTED);
    setSelectedFile(null);
    setExtractedPdfName('');
    if (uploadInputRef.current) uploadInputRef.current.value = '';
  };

  const handleConfirm = () => {
    if (!allCreditsSelected) {
      return;
    }

    setIsSavingSubjects(true);
    setErrorMessage('');
    setSuccessMessage('');

    const saveSubjectsToDatabase = async () => {
      try {
        const subjectsToSave = subjects.map(function(subject) {
          const semesterNum = parseInt(subject.semester, 10) || 0;
          const yearNum = Number(subject.year) || Math.ceil(semesterNum / 2) || 0;
          let credits = 0;
          if (subject.grade && typeof subject.grade === 'string') {
            const pattern = /(\d+)\s+Credit/;
            const creditMatch = subject.grade.match(pattern);
            if (creditMatch && creditMatch.length > 1) {
              credits = parseInt(creditMatch[1], 10);
            }
          }
          return {
            courseCode: String(subject.code || '').trim().toUpperCase(),
            courseName: subject.name,
            credits: credits,
            semester: semesterNum,
            year: yearNum
          };
        });

        const authToken = localStorage.getItem('authToken');
        const fetchHeaders = {
          'Content-Type': 'application/json'
        };
        if (authToken) {
          fetchHeaders['Authorization'] = 'Bearer ' + authToken;
        }

        const response = await fetch(API_BASE_URL + '/subjects', {
          method: 'POST',
          headers: fetchHeaders,
          body: JSON.stringify({ subjects: subjectsToSave, uploadId: uploadId })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save subjects');
        }

        const data = await response.json();
        setSuccessMessage('Success! ' + data.saved + ' subjects saved.');
        setShowSuccessPopup(true);
      } catch (error) {
        console.error('Error saving subjects:', error);
        setErrorMessage(error.message || 'Failed to save subjects');
        setShowErrorPopup(true);
      } finally {
        setIsSavingSubjects(false);
      }
    };

    saveSubjectsToDatabase();
  };

  const handleSuccessOkClick = () => {
    setShowSuccessPopup(false);
    navigate('/coo-ms-semester-detail', {
      state: {
        fileName: fileName,
        subjects: subjects,
        selectedFile: selectedFile,
        extractedStudents: extractedStudents,
        extractedPdfName: extractedPdfName,
        uploadId: uploadId,
        year: selectedYear,
        semester: selectedSemester
      }
    });
  };

  const handleRemoveFile = () => {
    setFileName(NO_FILE_SELECTED);
    setSelectedFile(null);
    setSubjects([]);
    setHasPreviewData(false);
    setExtractedPdfName('');
    if (previewUrlRef.current) {
      window.URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    if (uploadInputRef.current) {
      uploadInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    if (uploadInputRef.current) {
      uploadInputRef.current.click();
    }
  };

  const handleFileSelected = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setSelectedFile(file);
    setHasPreviewData(false);
    if (previewUrlRef.current) {
      window.URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  };

  const handleDiscardPopup = () => {
    setFileName(NO_FILE_SELECTED);
    setSelectedFile(null);
    setSelectedYear('');
    setSelectedSemester('');
    setShowUploadPopup(false);
    if (uploadInputRef.current) {
      uploadInputRef.current.value = '';
    }
  };

  const handleUploadSubmit = () => {
    if (!selectedFile) {
      setErrorMessage("Please select a file first.");
      setShowErrorPopup(true);
      return;
    }
    if (!selectedYear || !selectedSemester) {
      setErrorMessage("Please select Year and Semester first.");
      setShowErrorPopup(true);
      return;
    }

    setShowUploadPopup(false);
    setIsLoadingPreview(true);
    setShowUploadingPopup(true);
    setUploadProgress(10);

    const jobId = 'job_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    setExtractionProgress({
      totalMarksheets: 0,
      processedMarksheets: 0,
      currentRegisterNo: '',
      currentStage: 'Running OCR',
      status: 'processing'
    });

    let progressInterval = setInterval(async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        const pResp = await fetch(`${API_BASE_URL}/marksheets/progress/${jobId}`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
        });
        if (pResp.ok) {
          const progressData = await pResp.json();
          if (progressData && progressData.status === 'processing') {
            setExtractionProgress(progressData);
          }
        }
      } catch (err) {
        console.warn('Error polling progress:', err);
      }
    }, 500);

    // Upload file to backend for preview extraction and subject lookup
    (async () => {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('semester', selectedSemester);
        formData.append('jobId', jobId);
        console.log('📘 Selected Semester:', selectedSemester);

        const authToken = localStorage.getItem('authToken');
        const uploadUrl = `${API_BASE_URL}/marksheets/upload`;
        console.log('📤 Upload URL:', uploadUrl);
        const resp = await fetch(uploadUrl, {
          method: 'POST',
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          body: formData
        });

        // simulate progress to give user feedback if server doesn't stream progress
        let fakeProgress = null;
        const startFakeProgress = () => {
          if (fakeProgress) return;
          fakeProgress = setInterval(() => {
            setUploadProgress((p) => {
              const max = 94; // cap until server responds
              if (p >= max) return p;
              const delta = Math.random() * 3 + 0.5; // small smooth increments
              return Math.min(max, +(p + delta).toFixed(1));
            });
          }, 200);
        };
        startFakeProgress();

        if (!resp.ok) {
          const text = await resp.text().catch(() => 'Upload failed');
          throw new Error(text || 'Preview upload failed');
        }

        const body = await resp.json();
        console.log('✅ Upload response:', body);
        setUploadId(body.uploadId || '');
        if (fakeProgress) {
          clearInterval(fakeProgress);
          fakeProgress = null;
        }
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }

        // smoothly animate to 100% using requestAnimationFrame
        const animateTo100 = () => {
          let animId = null;
          const step = () => {
            setUploadProgress((p) => {
              if (p >= 100) {
                if (animId) cancelAnimationFrame(animId);
                return 100;
              }
              const remaining = 100 - p;
              const inc = Math.max(0.6, Math.min(6, remaining * 0.08));
              const next = Math.min(100, +(p + inc).toFixed(1));
              return next;
            });
            animId = requestAnimationFrame(step);
          };
          step();
          setTimeout(() => {
            setShowUploadingPopup(false);
            setShowSemNotePopup(true);
            setExtractionProgress(null);
          }, 600);
        };

        animateTo100();
        const extracted = Array.isArray(body.extractedMarksheets) ? body.extractedMarksheets : [];
        const extractedPdf = body.extractedPdfName || selectedFile.name || '';
        setExtractedPdfName(extractedPdf);
        console.log('📥 [Frontend] Extracted marksheets from backend:', JSON.stringify(extracted.map(m => ({regNo: m.regNo, semester: m.semester, subjectCount: m.subjects?.length}))));
        
        const uploadedSubjects = extracted.flatMap(function(marksheet) { 
          if (!Array.isArray(marksheet.subjects)) return [];
          // Add semester from marksheet to each subject
          console.log(`📥 [Frontend] Marksheet ${marksheet.regNo} semester=${marksheet.semester}, subjects count=${marksheet.subjects.length}`);
          return marksheet.subjects.map(subject => ({
            ...subject,
            semester: subject.semester || subject.sem || marksheet.semester || marksheet.sem || ''
          }));
        });
        
        console.log('📋 [Frontend] After mapping subjects with semester:', uploadedSubjects.slice(0, 2).map(s => ({code: s.courseCode, sem: s.semester})));

        let finalSubjects = buildSubjectRows(uploadedSubjects);
        let studentData = extracted.map((marksheet) => ({
          ...marksheet,
          extractedPdfName: extractedPdf,
          submitted: Boolean(marksheet.submitted)
        }));

        // End of fallback removal

        setExtractedStudents(studentData);
        setSubjects(finalSubjects);
        setHasPreviewData(true);
      } catch (err) {
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        console.error('Error extracting preview:', err);
        setSubjects([]);
        setHasPreviewData(false);
        setUploadFailedMessage(err.message || 'Failed to process uploaded file');
        setShowUploadFailedPopup(true);
        setShowUploadingPopup(false);
        setExtractionProgress(null);
      } finally {
        setIsLoadingPreview(false);
      }
    })();
  };

  const handlePreviewFile = () => {
    if (!selectedFile) {
      return;
    }

    setPreviewPopupState('progress');
    setPreviewProgress(0);

    const progressInterval = setInterval(() => {
      setPreviewProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(progressInterval);
      setPreviewProgress(100);

      const previewUrl = window.URL.createObjectURL(selectedFile);
      previewUrlRef.current = previewUrl;
      const previewWindow = window.open(previewUrl, '_blank', 'noopener,noreferrer');

      if (!previewWindow) {
        window.URL.revokeObjectURL(previewUrl);
        previewUrlRef.current = null;
      }

      setTimeout(() => {
        setPreviewPopupState('none');
      }, 500);
    }, 1000);
  };

  return (
    <>
      <Navbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
      <div className={styles["co-ms-layout"]}>
        <Sidebar 
          isOpen={isSidebarOpen} 
          onLogout={onLogout} 
          currentView="manage-students" 
          onViewChange={onViewChange}
          onClose={() => setIsSidebarOpen(false)}
        />
        <div className={styles['semester-main-content']}>
          {/* Top Cards Row */}
          <div className={styles['top-cards-row']}>
            {/* Student Database Card */}
            <div 
              className={`${styles['co-card']} ${styles['card-student-db']}`}
              role="button"
              tabIndex={0}
              onClick={() => onViewChange?.("manage-students")}
            >
              <div className={styles['co-icon-wrapper']}>
                <img src={manageStudentsIcon} alt="Manage" />
              </div>
              <h2>Manage Students</h2>
              <p>Access and manage student information.</p>
            </div>

            {/* Upload Card */}
            {selectedFile ? (
              <div className={`${styles['co-card']} ${styles['card-upload-uploaded']}`}>
                <div className={styles['uploaded-card-info']}>
                  <div className={styles['uploaded-meta-row']}>
                    <span className={styles['uploaded-meta-label']}>File Name</span>
                    <span className={styles['uploaded-file-name-text']} title={selectedFile.name}>
                      {selectedFile.name}
                    </span>
                  </div>
                  <div className={styles['uploaded-meta-row']}>
                    <span className={styles['uploaded-meta-label']}>Year</span>
                    <span className={styles['uploaded-meta-value']}>{selectedYear}</span>
                  </div>
                  <div className={styles['uploaded-meta-row']}>
                    <span className={styles['uploaded-meta-label']}>Semester</span>
                    <span className={styles['uploaded-meta-value']}>{selectedSemester}</span>
                  </div>
                  <div className={styles['uploaded-meta-row']}>
                    <span className={styles['uploaded-meta-label']}>Subjects</span>
                    <span className={styles['uploaded-meta-value']}>{subjects.length}</span>
                  </div>
                  <div className={styles['uploaded-meta-row']}>
                    <span className={styles['uploaded-meta-label']}>Students</span>
                    <span className={styles['uploaded-meta-value']}>{extractedStudents.length}</span>
                  </div>
                </div>
                <div className={styles['uploaded-card-actions']}>
                  <button 
                    type="button" 
                    onClick={handlePreviewFile} 
                    className={styles['uploaded-preview-btn']}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="1.1em" height="1.1em" viewBox="0 0 24 24" style={{ marginRight: '6px' }}>
                      <path fill="currentColor" d="M12 9a3 3 0 0 0-3 3a3 3 0 0 0 3 3a3 3 0 0 0 3-3a3 3 0 0 0-3-3m0 8a5 5 0 0 1-5-5a5 5 0 0 1 5-5a5 5 0 0 1 5 5a5 5 0 0 1-5 5m0-12.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5" />
                    </svg>
                    Preview
                  </button>
                  <button 
                    type="button" 
                    onClick={handleRemoveFile} 
                    className={styles['uploaded-clear-btn']}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="1.1em" height="1.1em" viewBox="0 0 24 24" style={{ marginRight: '6px' }}>
                      <path fill="currentColor" d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z" />
                    </svg>
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className={`${styles['co-card']} ${styles['card-upload']}`}
                role="button"
                tabIndex={0}
                onClick={() => setShowUploadPopup(true)}
              >
                <div className={styles['co-icon-wrapper-upload']}>
                  <img src={semesterUploadIcon} alt="Upload" className={styles['upload-icon-image']} />
                </div>
                <h2>Upload Semester Marksheet</h2>
                <p>Select Year, Semester, and PDF file to extract subjects.</p>
              </div>
            )}

            {/* History Card */}
            <div 
              className={`${styles['co-card']} ${styles['card-history']}`}
              role="button"
              tabIndex={0}
              onClick={() => navigate('/coo-semester-history')}
            >
              <div className={styles['co-icon-wrapper']}>
                <ClockIcon />
              </div>
              <h2>History</h2>
              <p>View upload history and past student records.</p>
            </div>
          </div>

          {/* Upload Popup */}
          {showUploadPopup && (
            <div className={styles['popup-overlay']}>
              <div className={styles['popup-container']} onClick={(e) => e.stopPropagation()}>
                <div className={styles['popup-header']}>
                  Upload Semester Marksheet
                </div>
                <div className={styles['popup-body']}>
                  {/* Dashed upload panel inside the popup */}
                  <div 
                    className={styles['popup-upload-panel']} 
                    onClick={handleUploadClick}
                  >
                    <input
                      ref={uploadInputRef}
                      type="file"
                      className={styles['popup-upload-input']}
                      onChange={handleFileSelected}
                    />
                    <div className={styles['popup-upload-symbol']}>
                      <img src={semesterUploadIcon} alt="Upload" className={styles['popup-upload-icon-image']} />
                    </div>
                    <h3 className={styles['popup-upload-file-name']}>{fileName}</h3>
                  </div>

                  {/* Year & Semester selectors inside the popup */}
                  <div className={styles['popup-selectors-container']}>
                    <div className={styles['popup-selector-group']}>
                      <label htmlFor="popup-year-select" className={styles['popup-label']}>Year</label>
                      <Dropdown
                        options={YEAR_OPTIONS}
                        selectedOption={selectedYear}
                        onSelect={handleYearSelect}
                        placeholder="Select Year"
                        role="coo"
                        className={styles['popup-dropdown-custom']}
                      />
                    </div>

                    <div className={styles['popup-selector-group']}>
                      <label htmlFor="popup-semester-select" className={styles['popup-label']}>Semester</label>
                      <Dropdown
                        options={availableSemesters}
                        selectedOption={selectedSemester}
                        onSelect={(val) => setSelectedSemester(val)}
                        placeholder="Select Semester"
                        disabled={!selectedYear}
                        role="coo"
                        className={styles['popup-dropdown-custom']}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles['popup-footer']}>
                  <button 
                    type="button" 
                    onClick={handleDiscardPopup} 
                    className={styles['popup-discard-btn']}
                  >
                    Discard
                  </button>
                  <button 
                    type="button" 
                    onClick={handleUploadSubmit} 
                    className={styles['popup-upload-btn']}
                    disabled={!selectedFile || !selectedYear || !selectedSemester}
                  >
                    Upload
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SemNotepopup (Matches Image 3 success popup style) */}
          {showSemNotePopup && (
            <div className={styles['popup-overlay']}>
              <div className={styles['note-popup-container']} onClick={(e) => e.stopPropagation()}>
                <div className={styles['popup-header']}>Note</div>
                <div className={styles['note-popup-body']}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="80"
                    height="80"
                    viewBox="0 0 24 24"
                    style={{ display: 'block', margin: '0 auto 10px' }}
                  >
                    <path d="M0 0h24v24H0z" fill="none" />
                    <path fill="#ffa500" d="M5 19q-.425 0-.712-.288T4 18t.288-.712T5 17h1v-7q0-2.075 1.25-3.687T10.5 4.2v-.7q0-.625.438-1.062T12 2t1.063.438T13.5 3.5v.7q2 .5 3.25 2.113T18 10v7h1q.425 0 .713.288T20 18t-.288.713T19 19zm7 3q-.825 0-1.412-.587T10 20h4q0 .825-.587 1.413T12 22m.713-9.287Q13 12.425 13 12V9q0-.425-.288-.712T12 8t-.712.288T11 9v3q0 .425.288.713T12 13t.713-.288M12 16q.425 0 .713-.288T13 15t-.288-.712T12 14t-.712.288T11 15t.288.713T12 16" />
                  </svg>
                  <h2 className={styles['note-popup-title']}>Important Note</h2>
                  <p className={styles['note-popup-message']}>
                    Before assigning credits to each subject, ensure that you are assigning suitable grades for the
                    appropriate subjects, as this may affect students SGPA and CGPA.
                  </p>
                  
                  {/* Centered Close button with opacity: 0.2 */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px', width: '100%' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowSemNotePopup(false)} 
                      className={styles['popup-close-btn']}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Failed Popup */}
          {showUploadFailedPopup && (
            <div className={styles['ms-popup-overlay']}>
              <div className={styles['ms-popup-container']}>
                <div className={styles['ms-popup-header']}>Upload Failed</div>
                <div className={styles['ms-popup-body']}>
                  <h2 className={styles['ms-status-title']}>Upload Error</h2>
                  <p className={styles['ms-status-text']}>{uploadFailedMessage}</p>
                </div>
                <div className={styles['ms-popup-footer']}>
                  <button onClick={() => setShowUploadFailedPopup(false)} className={styles['ms-popup-close-btn']}>Close</button>
                </div>
              </div>
            </div>
          )}

          <CertificatePreviewProgressAlert
            isOpen={showUploadingPopup}
            progress={uploadProgress}
            title="Uploading..."
            fileLabel="semester marksheet"
            extractionProgress={extractionProgress}
            messages={{
              initial: 'Extracting subjects from PDF...',
              mid: 'Matching marksheets with students...',
              final: 'Preparing preview...'
            }}
          />

          <PreviewProgressAlert 
            isOpen={previewPopupState === 'progress'} 
            progress={previewProgress} 
            fileLabel="marksheet"
            color="var(--coo-red, #d23b42)"
            progressColor="var(--coo-red, #d23b42)"
            title="Previewing..."
            messages={{
              initial: 'Fetching marksheet from database...',
              mid: 'Preparing preview...',
              final: 'Rendering document...'
            }}
          />
          
          <PreviewFailedAlert 
            isOpen={previewPopupState === 'failed'} 
            onClose={() => setPreviewPopupState('none')}
            color="var(--coo-red, #d23b42)"
          />

          {/* Success Popup */}
          {showSuccessPopup && (
            <div className={styles['ms-popup-overlay']}>
              <div className={styles['ms-popup-container']}>
                <div className={`${styles['ms-popup-header']} ${styles['ms-popup-success-header']}`}>Saved!</div>
                <div className={styles['ms-popup-body']}>
                  <svg className={styles['ms-popup-success-icon']} xmlns="http://www.w3.org/2000/svg" width="80px" height="80px" viewBox="0 0 512 512">
                    <path d="M0 0h512v512H0z" fill="none" />
                    <path fill="#19b86d" d="M169 57v430h78V57zM25 105v190h46V105zm158 23h18v320h-18zm128.725 7.69l-45.276 8.124l61.825 344.497l45.276-8.124zM89 153v270h62V153zm281.502 28.68l-27.594 11.773l5.494 12.877l27.594-11.773zm12.56 29.433l-27.597 11.772l5.494 12.877l27.593-11.772l-5.492-12.877zm12.555 29.434l-27.594 11.77l99.674 233.628l27.594-11.773zM25 313v30h46v-30zm190 7h18v128h-18zM25 361v126h46V361zm64 80v46h62v-46z" />
                  </svg>
                  <h2 className={styles['ms-status-title']}>Subjects Saved ✓</h2>
                  <p className={styles['ms-status-text']}>{successMessage}</p>
                </div>
                <div className={styles['ms-popup-success-footer']}>
                  <button onClick={handleSuccessOkClick} className={styles['ms-popup-success-close-btn']}>OK</button>
                </div>
              </div>
            </div>
          )}

          {/* Error Popup */}
          {showErrorPopup && (
            <div className={styles['ms-popup-overlay']}>
              <div className={styles['ms-popup-container']}>
                <div className={styles['ms-popup-header']} style={{ backgroundColor: '#F44336' }}>
                  {errorMessage.includes('select Year and Semester') ? 'Validation Error' : 'Error'}
                </div>
                <div className={styles['ms-popup-body']}>
                  <h2 className={styles['ms-status-title']}>
                    {errorMessage.includes('select Year and Semester') ? 'Validation Alert' : 'Failed to Save Subjects'}
                  </h2>
                  <p className={styles['ms-status-text']}>{errorMessage}</p>
                </div>
                <div className={styles['ms-popup-footer']}>
                  <button onClick={() => setShowErrorPopup(false)} className={styles['ms-popup-close-btn']}>Close</button>
                </div>
              </div>
            </div>
          )}

          <section className={styles['subject-shell']}>
            <div className={styles['subject-card']}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--coo-red)', padding: '18px 25px' }}>
                <h2 className={styles['section-title']} style={{ padding: 0, background: 'none', boxShadow: 'none' }}>
                  {subjects.length === 0 ? 'Instructions' : 'Extracted Subjects'}
                </h2>
              </div>

              <div className={styles['table-wrap']}>
                {subjects.length === 0 ? (
                  isLoadingPreview ? (
                    <div className={styles['empty-note']}>
                      Extracting subjects from PDF...
                    </div>
                  ) : (
                    <div className={styles['instruction-panel']}>
                      <h2 className={styles['instruction-title']}>Semester Marksheet Upload Instructions</h2>
                      <p className={styles['instruction-subtitle']}>
                        Follow the steps below to upload and extract subject lists from the marksheet PDF.
                      </p>
                      
                      <div className={styles['instruction-cards-row']}>
                        <div className={styles['instruction-step-card']}>
                          <div className={styles['instruction-step-num']}>1</div>
                          <div className={styles['instruction-step-icon']}><SelectIcon /></div>
                          <h3>Select Year & Sem</h3>
                          <p>Select the academic year and semester for the marksheets.</p>
                        </div>
                        
                        <div className={styles['instruction-step-card']}>
                          <div className={styles['instruction-step-num']}>2</div>
                          <div className={styles['instruction-step-icon']}><UploadFileIcon /></div>
                          <h3>Browse & Upload</h3>
                          <p>Select and upload the PDF file containing student marksheets.</p>
                        </div>
                        
                        <div className={styles['instruction-step-card']}>
                          <div className={styles['instruction-step-num']}>3</div>
                          <div className={styles['instruction-step-icon']}><VerifyIcon /></div>
                          <h3>Verify Subjects</h3>
                          <p>Review extracted subjects and set credit values for each course.</p>
                        </div>
                        
                        <div className={styles['instruction-step-card']}>
                          <div className={styles['instruction-step-num']}>4</div>
                          <div className={styles['instruction-step-icon']}><SaveIcon /></div>
                          <h3>Confirm & Save</h3>
                          <p>Confirm the extracted records to save them into the database.</p>
                        </div>
                      </div>
                      
                      <p className={styles['instruction-warning']}>* Read instructions carefully before uploading the marksheets</p>
                      <button 
                        type="button" 
                        className={styles['instruction-btn']} 
                        onClick={() => setShowUploadPopup(true)}
                      >
                        Click to Upload Marksheet →
                      </button>
                    </div>
                  )
                ) : (
                  <table className={styles['subject-table']}>
                    <thead>
                      <tr>
                        <th>S.NO</th>
                        <th>Semester</th>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((subject, index) => {
                        const displaySemester = subject.semester || subject.sem || null;
                        return (
                        <tr key={subject.id}>
                          <td>{index + 1}</td>
                          <td>
                            {(subject.existsInMaster && displaySemester) ? (
                              <span className={styles['credit-badge']}>Sem {displaySemester}</span>
                            ) : (
                              <span>{displaySemester || '--'}</span>
                            )}
                          </td>
                          <td>{subject.code}</td>
                          <td>{subject.name}</td>
                          <td>
                            {(subject.existsInMaster && subject.masterCredits !== null && subject.masterCredits !== undefined) ? (
                              <span className={styles['credit-badge']}>{subject.masterCredits} Credits</span>
                            ) : (
                              <select
                                value={subject.grade || 'Select Credit'}
                                onChange={(event) => handleGradeChange(subject.id, event.target.value)}
                                className={styles['grade-select']}
                                aria-label={`Select grade for ${subject.code}`}
                              >
                                {GRADE_OPTIONS.map((option) => (
                                  <option key={`${subject.id}-${option}`} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Card actions footer placed outside table-wrap */}
              {subjects.length > 0 && (
                <div className={styles['subject-card-footer']}>
                  <button 
                    type="button" 
                    className={styles['table-discard-btn']} 
                    onClick={handleDiscard} 
                    disabled={isSavingSubjects}
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    className={styles['table-confirm-btn']}
                    onClick={handleConfirm}
                    disabled={!allCreditsSelected || isSavingSubjects}
                  >
                    {isSavingSubjects ? 'Saving...' : 'Confirm'}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default ManageStudentsSemester;