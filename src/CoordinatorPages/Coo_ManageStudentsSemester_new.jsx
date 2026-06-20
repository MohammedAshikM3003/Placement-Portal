import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from "react-router-dom";
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import { API_BASE_URL } from '../utils/apiConfig';
import { CertificatePreviewProgressAlert } from '../components/alerts';
import styles from './Coo_ManageStudentsSemester_new.module.css';
import Adminicon from "../assets/Adminicon.png";
import semesterUploadIcon from "../assets/Cood_ms_semuploadicon.svg";

// Start with no subjects; show notice before upload
const INITIAL_SUBJECTS = [];

const GRADE_OPTIONS = ['Select Credit', '4 Credits', '3 Credits', '2 Credits', '1 Credit','0 Credit'];
const SEMESTER_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8'];
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
  const [selectedSemester, setSelectedSemester] = useState('');

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
    console.log('🔄 [buildSubjectRows] Received raw subjects:', rawSubjects.slice(0, 2).map(s => ({code: s.courseCode, semester: s.semester})));
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
      const mapKey = `${courseCode}_${semesterKey}`;

      if (!subjectMap.has(mapKey)) {
        console.log(`🔍 [${courseCode}] rawSem=${rawSem}, final=${semesterValue}`);
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
      }
    }

    return Array.from(subjectMap.values());
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
          body: JSON.stringify({ subjects: subjectsToSave })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to save subjects');
        }

        const data = await response.json();
        setSuccessMessage('Success! ' + data.saved + ' subjects saved.');
        setShowSuccessPopup(true);

        setTimeout(function() {
          navigate('/coo-ms-semester-detail', {
            state: {
              fileName: fileName,
              subjects: subjects,
              selectedFile: selectedFile,
              extractedStudents: extractedStudents,
              extractedPdfName: extractedPdfName
            }
          });
        }, 2000);
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
    const selectedFile = event.target.files && event.target.files[0];
    if (!selectedFile) return;
    setFileName(selectedFile.name);
    setSelectedFile(selectedFile);
    setHasPreviewData(false);
    if (previewUrlRef.current) {
      window.URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    // Upload file to backend for preview extraction and subject lookup
    (async () => {
      try {
        setIsLoadingPreview(true);
        setShowUploadingPopup(true);
        setUploadProgress(10);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('semester', selectedSemester);
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
        if (fakeProgress) {
          clearInterval(fakeProgress);
          fakeProgress = null;
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
          setTimeout(() => setShowUploadingPopup(false), 600);
        };

        animateTo100();
        const extracted = Array.isArray(body.extractedMarksheets) ? body.extractedMarksheets : [];
        const extractedPdf = body.extractedPdfName || selectedFile.name || '';
        setExtractedPdfName(extractedPdf);
        console.log('📥 [Frontend] Extracted marksheets from backend:', JSON.stringify(extracted.map(m => ({regNo: m.regNo, semester: m.semester, subjectCount: m.subjects?.length}))));
        
        const uploadedSubjects = extracted.flatMap(function(marksheet) { 
          if (!Array.isArray(marksheet.subjects)) return [];
          // Add semester from marksheet to each subject (semester is at marksheet level, not per-subject)
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

        if (finalSubjects.length === 0 || extracted.length === 0) {
          const parseFormData = new FormData();
          parseFormData.append('file', selectedFile);

          const parseUrl = API_BASE_URL + '/marksheet/parse';
          console.log('📤 Upload URL:', parseUrl);
          const parseResponse = await fetch(parseUrl, {
            method: 'POST',
            body: parseFormData,
          });

          if (parseResponse.ok) {
            const parseBody = await parseResponse.json();
            const marksheetSemester = parseBody.student_info?.semester ?? null;
            // Add semester from marksheet to each subject
            const enrichedSubjects = Array.isArray(parseBody.subjects) 
              ? parseBody.subjects.map(subject => ({
                  ...subject,
                  semester: subject.semester || subject.sem || marksheetSemester || ''
                }))
              : [];
            finalSubjects = buildSubjectRows(enrichedSubjects);
            
            if (parseBody.student_info) {
              const studentMarksheet = {
                regNo: parseBody.student_info.register_number || '',
                studentName: parseBody.student_info.name || '',
                programme: parseBody.student_info.programme || '',
                examDate: parseBody.student_info.examDate || parseBody.student_info.exam_month_year || '',
                semester: marksheetSemester,
                subjects: enrichedSubjects
              };
              studentData = [{
                ...studentMarksheet,
                extractedPdfName: extractedPdf,
                submitted: Boolean(studentMarksheet.submitted)
              }];
            }
          }
        }

        setExtractedStudents(studentData);
        setSubjects(finalSubjects);
        setHasPreviewData(true);
      } catch (err) {
        console.error('Error extracting preview:', err);
        setSubjects([]);
        setHasPreviewData(false);
        setUploadFailedMessage(err.message || 'Failed to process uploaded file');
        setShowUploadFailedPopup(true);
        setShowUploadingPopup(false);
      } finally {
        setIsLoadingPreview(false);
      }
    })();
  };

  const handlePreviewFile = () => {
    if (!selectedFile) {
      return;
    }

    const previewUrl = window.URL.createObjectURL(selectedFile);
    previewUrlRef.current = previewUrl;
    const previewWindow = window.open(previewUrl, '_blank', 'noopener,noreferrer');

    if (!previewWindow) {
      window.URL.revokeObjectURL(previewUrl);
      previewUrlRef.current = null;
    }
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
          <div className={styles['semester-controls']}>
            <label htmlFor="semester-select" className={styles['semester-label']}>Semester</label>
            <select
              id="semester-select"
              className={styles['semester-select']}
              value={selectedSemester}
              onChange={(event) => setSelectedSemester(event.target.value)}
            >
              <option value="">Select semester</option>
              {SEMESTER_OPTIONS.map((option) => (
                <option key={`semester-${option}`} value={option}>
                  Semester {option}
                </option>
              ))}
            </select>
          </div>
          <section
            className={styles['upload-panel']}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleUploadClick();
              }
            }}
            aria-label="Upload semester file"
          >
            <input
              ref={uploadInputRef}
              type="file"
              className={styles['upload-input']}
              onChange={handleFileSelected}
            />
            <div className={styles['upload-icons']}>
              <button type="button" className={styles['icon-action']} onClick={(event) => { event.stopPropagation(); handleRemoveFile(); }} aria-label="Remove uploaded file">
                <BinIcon />
              </button>
              <button type="button" className={styles['icon-action']} onClick={(event) => { event.stopPropagation(); handlePreviewFile(); }} aria-label="Preview uploaded file">
                <EyeIcon />
              </button>
            </div>
            <div className={styles['upload-symbol']}>
              <img src={semesterUploadIcon} alt="Upload" className={styles['upload-icon-image']} />
            </div>
            <h1 className={styles['upload-file-name']}>{fileName}</h1>
          </section>

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
            messages={{
              initial: 'Extracting subjects from PDF...',
              mid: 'Matching marksheets with students...',
              final: 'Preparing preview...'
            }}
          />

          {/* Success Popup */}
          {showSuccessPopup && (
            <div className={styles['ms-popup-overlay']}>
              <div className={styles['ms-popup-container']}>
                <div className={styles['ms-popup-header']} style={{ backgroundColor: '#4CAF50' }}>Success</div>
                <div className={styles['ms-popup-body']}>
                  <h2 className={styles['ms-status-title']}>Subjects Saved</h2>
                  <p className={styles['ms-status-text']}>{successMessage}</p>
                </div>
                <div className={styles['ms-popup-footer']}>
                  <button onClick={() => setShowSuccessPopup(false)} className={styles['ms-popup-close-btn']}>OK</button>
                </div>
              </div>
            </div>
          )}

          {/* Error Popup */}
          {showErrorPopup && (
            <div className={styles['ms-popup-overlay']}>
              <div className={styles['ms-popup-container']}>
                <div className={styles['ms-popup-header']} style={{ backgroundColor: '#F44336' }}>Error</div>
                <div className={styles['ms-popup-body']}>
                  <h2 className={styles['ms-status-title']}>Failed to Save Subjects</h2>
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
              <h2 className={styles['section-title']}>Unavailable Subjects in MongoDB</h2>

              <div className={styles['table-wrap']}>
                {!hasPreviewData ? (
                  <div className={styles['empty-note']}>
                    Upload a semester PDF to compare it against the Subject collection.
                  </div>
                ) : masterSubjects.length === 0 ? (
                  <div className={styles['empty-note']}>
                    The Subject collection is empty in MongoDB. Add master subjects first to show unavailable subjects.
                  </div>
                ) : unavailableSubjects.length === 0 ? (
                  <div className={styles['empty-note']}>
                    No unavailable subjects found. Every master subject is present in the uploaded PDF.
                  </div>
                ) : (
                  <table className={styles['subject-table']}>
                    <thead>
                      <tr>
                        <th>S.NO</th>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Credits</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unavailableSubjects.map((subject, index) => (
                        <tr key={subject.id}>
                          <td>{index + 1}</td>
                          <td>{subject.code}</td>
                          <td>{subject.name}</td>
                          <td>{subject.credits ?? '--'}</td>
                          <td>
                            <span className={styles['credit-badge']}>Unavailable</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className={styles['subject-card']}>
              <h2 className={styles['section-title']}>Extracted Subjects</h2>

              <div className={styles['table-wrap']}>
                {subjects.length === 0 ? (
                  <div className={styles['empty-note']}>
                    {isLoadingPreview ? 'Extracting subjects from PDF...' : 'No subjects loaded. Upload a semester PDF to extract subject list.'}
                  </div>
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
            </div>

            <div className={styles['right-rail']}>
              <aside className={styles['note-panel']}>
                <h3 className={styles['note-title']}>Note</h3>
                <div className={styles['note-box']}>
                  Before assigning credits to each subject, ensure that you are assigning suitable grades for the
                  appropriate subjects, as this may affect students SGPA and CGPA.
                </div>
              </aside>

              <div className={styles['action-row']}>
                <button type="button" className={styles['discard-btn']} onClick={handleDiscard} disabled={isSavingSubjects}>
                  Discard
                </button>
                <button
                  type="button"
                  className={styles['confirm-btn']}
                  onClick={handleConfirm}
                  disabled={!allCreditsSelected || isSavingSubjects}
                >
                  {isSavingSubjects ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default ManageStudentsSemester;