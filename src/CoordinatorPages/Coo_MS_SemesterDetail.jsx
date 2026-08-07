import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useCoordinatorAuth from '../utils/useCoordinatorAuth.js';
import Navbar from '../components/Navbar/Conavbar.js';
import Sidebar from '../components/Sidebar/Cosidebar.js';
import Adminicon from '../assets/Adminicon.png';
import { API_BASE_URL } from '../utils/apiConfig.js';
import styles from './Coo_MS_SemesterDetail.module.css';
import Dropdown from '../components/common/Dropdown/Dropdown.jsx';
import CoordinatorSaveSuccessAlert from '../components/alerts/CoordinatorSaveSuccessAlert';

const SEMESTER_DETAIL_CACHE_KEY = 'coo-ms-semester-detail-cache';
const SEMESTER_DETAIL_LOCAL_CACHE_KEY = 'semester_detail_cache';

const readSemesterDetailCache = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(SEMESTER_DETAIL_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Failed to read semester detail cache:', error);
    return null;
  }
};

const buildRecordKey = (regNo, semester) => {
  return `${String(regNo || '').trim()}::${String(semester || '').trim()}`;
};

const writeSemesterDetailCache = (payload) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(SEMESTER_DETAIL_CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to write semester detail cache:', error);
  }
};

const clearSemesterDetailCache = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.removeItem(SEMESTER_DETAIL_CACHE_KEY);
  } catch (error) {
    console.warn('Failed to clear semester detail cache:', error);
  }
};

const UploadIcon = () => (
  <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 3v12" />
    <path d="M7 8l5-5 5 5" />
    <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

function CooSemesterDetail({ onLogout, onViewChange }) {
  useCoordinatorAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [hydratedState, setHydratedState] = useState(() => {
    if (location.state) {
      return location.state;
    }

    return readSemesterDetailCache() || {};
  });

  const { 
    fileName = 'No file selected', 
    subjects = [], 
    selectedFile = null, 
    previewUrl = '', 
    fileType = 'application/pdf',
    extractedStudents = [],
    extractedPdfName = '',
    selectedDepartment = '',
    selectedSemester = '',
    selectedYear = '',
    extractedData = null,
    uploadId = '',
    year = '',
    semester = ''
  } = hydratedState || {};
  const [resolvedPreviewUrl, setResolvedPreviewUrl] = useState(previewUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [semesterRecords, setSemesterRecords] = useState([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMinSgpa, setFilterMinSgpa] = useState('');
  const [filterMaxSgpa, setFilterMaxSgpa] = useState('');
  const [filterMinCgpa, setFilterMinCgpa] = useState('');
  const [filterMaxCgpa, setFilterMaxCgpa] = useState('');

  const effectivePdfName = extractedPdfName || fileName;

  const fetchSemesterRecords = async () => {
    if (!effectivePdfName || effectivePdfName === 'No file selected') {
      return;
    }

    setIsLoadingRecords(true);
    try {
      const authToken = localStorage.getItem('authToken');
      let url = `${API_BASE_URL}/semester/list?extractedPdfName=${encodeURIComponent(effectivePdfName)}`;
      if (uploadId) {
        url += `&uploadId=${encodeURIComponent(uploadId)}`;
      }
      const response = await fetch(url, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });

      if (!response.ok) {
        throw new Error('Failed to load semester records');
      }

      const data = await response.json();
      setSemesterRecords(Array.isArray(data.records) ? data.records : []);
    } catch (error) {
      console.warn('Failed to fetch semester records:', error.message);
      setSemesterRecords([]);
    } finally {
      setIsLoadingRecords(false);
    }
  };

  const displayStudents = useMemo(function() {
    const submittedLookup = new Map(
      (semesterRecords || []).map((record) => [
        buildRecordKey(record.regNo || record.registerNumber, record.semester),
        record
      ])
    );

    if (!extractedStudents || extractedStudents.length === 0) {
      if (!semesterRecords || semesterRecords.length === 0) {
        return [];
      }

      return semesterRecords.map(function(record, index) {
        return {
          id: String(index + 1),
          registerNumber: record.regNo || record.registerNumber || '',
          name: record.studentName || '',
          year: record.year || '',
          semester: record.semester || '',
          examDate: record.examDate || '',
          section: record.section || '',
          arrears: record.arrearSubjects ?? record.arrear ?? 0,
          overallArrears: record.arrearSubjects ?? record.arrear ?? 0,
          sgpa: record.sgpa || '0.0',
          overallCgpa: record.cgpa || '0.0',
          subjects: record.subjects || [],
          submitted: Boolean(record.submitted),
          pdfPage: null
        };
      });
    }

    console.log('[Coo_MS_SemesterDetail] Mapping extractedStudents to displayStudents:', extractedStudents.length, 'items');
    return extractedStudents.map(function(marksheet, index) {
      const key = buildRecordKey(marksheet.regNo, marksheet.semester || '1');
      const matched = submittedLookup.get(key);
      const display = {
        id: String(index + 1),
        registerNumber: marksheet.regNo || '',
        name: marksheet.studentName || '',
        year: '1',
        semester: marksheet.semester || '1',
        examDate: marksheet.examDate || marksheet.exam_month_year || '',
        section: 'A',
        arrears: '0',
        overallArrears: '0',
        sgpa: '0.0',
        overallCgpa: '0.0',
        submitted: matched ? Boolean(matched.submitted) : Boolean(marksheet.submitted),
        // CRITICAL: Attach subjects directly to each display student for fast lookup
        subjects: marksheet.subjects || [],
        pdfPage: index + 1 // Assuming each student corresponds to one page sequentially
      };
      console.log('[Coo_MS_SemesterDetail] Display student', index, ':', { regNo: display.registerNumber, name: display.name, subjectsCount: display.subjects.length });
      return display;
    });
  }, [extractedStudents, semesterRecords]);

  const filteredStudents = useMemo(() => {
    return displayStudents.filter((student) => {
      // 1. Search filter: student name or register number
      if (filterSearch.trim()) {
        const query = filterSearch.toLowerCase().trim();
        const matchesName = (student.name || '').toLowerCase().includes(query);
        const matchesRegNo = (student.registerNumber || '').toLowerCase().includes(query);
        if (!matchesName && !matchesRegNo) {
          return false;
        }
      }

      // 2. Status filter: Arrear Students (arrears > 0), Cleared Students (arrears === 0)
      if (filterStatus !== 'all') {
        const arrearsCount = parseInt(student.arrears) || 0;
        if (filterStatus === 'arrear' && arrearsCount === 0) {
          return false;
        }
        if (filterStatus === 'cleared' && arrearsCount > 0) {
          return false;
        }
      }

      // 3. SGPA range filter
      if (filterMinSgpa.trim()) {
        const minSgpa = parseFloat(filterMinSgpa);
        const studentSgpa = parseFloat(student.sgpa) || 0;
        if (studentSgpa < minSgpa) {
          return false;
        }
      }
      if (filterMaxSgpa.trim()) {
        const maxSgpa = parseFloat(filterMaxSgpa);
        const studentSgpa = parseFloat(student.sgpa) || 0;
        if (studentSgpa > maxSgpa) {
          return false;
        }
      }

      // 4. CGPA range filter
      if (filterMinCgpa.trim()) {
        const minCgpa = parseFloat(filterMinCgpa);
        const studentCgpa = parseFloat(student.overallCgpa) || 0;
        if (studentCgpa < minCgpa) {
          return false;
        }
      }
      if (filterMaxCgpa.trim()) {
        const maxCgpa = parseFloat(filterMaxCgpa);
        const studentCgpa = parseFloat(student.overallCgpa) || 0;
        if (studentCgpa > maxCgpa) {
          return false;
        }
      }

      return true;
    });
  }, [displayStudents, filterSearch, filterStatus, filterMinSgpa, filterMaxSgpa, filterMinCgpa, filterMaxCgpa]);

  useEffect(() => {
    console.log('📊 Semester Detail page loaded');
    console.log('📦 Location state:', location.state);
    console.log('👥 Display students:', displayStudents);
    console.log('📄 Extracted students count:', extractedStudents?.length || 0);
  }, [displayStudents, extractedStudents, location.state]);

  useEffect(() => {
    if (location.state) {
      setHydratedState(location.state);
    }
  }, [location.state]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const savedCache = localStorage.getItem(SEMESTER_DETAIL_LOCAL_CACHE_KEY);
      if (!savedCache) {
        return;
      }

      const parsed = JSON.parse(savedCache);
      console.log('📦 Restoring semester cache:', parsed);

      if (parsed?.extractedStudents && parsed.extractedStudents.length > 0) {
        setHydratedState((current) => {
          const currentStudents = current?.extractedStudents;
          if (Array.isArray(currentStudents) && currentStudents.length > 0) {
            return current;
          }

          return {
            ...current,
            extractedStudents: parsed.extractedStudents,
            fileName: parsed.uploadedFileName || parsed.fileName || current?.fileName || 'No file selected',
            extractedPdfName: parsed.extractedPdfName || current?.extractedPdfName || '',
            previewUrl: parsed.previewUrl || current?.previewUrl || '',
            fileType: parsed.fileType || current?.fileType || 'application/pdf',
            subjects: parsed.subjects || current?.subjects || [],
            selectedDepartment: parsed.selectedDepartment || current?.selectedDepartment || '',
            selectedSemester: parsed.selectedSemester || current?.selectedSemester || '',
            selectedYear: parsed.selectedYear || current?.selectedYear || '',
            extractedData: parsed.extractedData || current?.extractedData || null
          };
        });

        console.log('✅ Semester detail restored from cache');
      }
    } catch (error) {
      console.error('❌ Failed to restore semester cache', error);
    }
  }, []);

  useEffect(() => {
    if (!Array.isArray(extractedStudents) || extractedStudents.length === 0) {
      return;
    }

    writeSemesterDetailCache({
      fileName,
      subjects,
      previewUrl,
      fileType,
      extractedStudents,
      extractedPdfName: effectivePdfName,
      uploadId,
      year,
      semester
    });
  }, [extractedStudents, fileName, fileType, previewUrl, subjects, effectivePdfName, uploadId, year, semester]);

  useEffect(() => {
    fetchSemesterRecords();
  }, [effectivePdfName]);

  useEffect(() => {
    if (selectedFile instanceof File) {
      const objectUrl = window.URL.createObjectURL(selectedFile);
      setResolvedPreviewUrl(objectUrl);

      return () => {
        window.URL.revokeObjectURL(objectUrl);
      };
    }

    if (previewUrl) {
      setResolvedPreviewUrl(previewUrl);
    }

    return undefined;
  }, [previewUrl, selectedFile]);

  const totalStudents = displayStudents.length;
  const allClearStudents = displayStudents.filter(function(row) { 
    return row.arrears === '0' && row.overallArrears === '0'; 
  }).length;
  const arrearStudents = totalStudents - allClearStudents;
  const allSubmitted = displayStudents.length > 0 && displayStudents.every((student) => student.submitted);

  const hasActiveFilters = 
    filterSearch.trim() !== '' ||
    filterStatus !== 'all' ||
    filterMinSgpa.trim() !== '' ||
    filterMaxSgpa.trim() !== '' ||
    filterMinCgpa.trim() !== '' ||
    filterMaxCgpa.trim() !== '';

  useEffect(() => {
    if (!Array.isArray(extractedStudents) || extractedStudents.length === 0) {
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const cacheData = {
      extractedStudents,
      uploadedFileName: fileName,
      stats: {
        totalStudents,
        allClearStudents,
        arrearStudents
      },
      selectedDepartment,
      selectedSemester,
      selectedYear,
      extractedData,
      fileName,
      extractedPdfName: effectivePdfName,
      previewUrl,
      fileType,
      subjects,
      timestamp: Date.now()
    };

    localStorage.setItem(SEMESTER_DETAIL_LOCAL_CACHE_KEY, JSON.stringify(cacheData));
    console.log('📦 Semester detail cache saved:', extractedStudents.length);
  }, [
    extractedStudents,
    fileName,
    totalStudents,
    allClearStudents,
    arrearStudents,
    selectedDepartment,
    selectedSemester,
    selectedYear,
    extractedData,
    effectivePdfName,
    previewUrl,
    fileType,
    subjects
  ]);

  const handleBack = () => {
    navigate('/coo-manage-students-semester');
  };

  const handleClearFilters = () => {
    setFilterSearch('');
    setFilterStatus('all');
    setFilterMinSgpa('');
    setFilterMaxSgpa('');
    setFilterMinCgpa('');
    setFilterMaxCgpa('');
  };

  const handleRemoveFile = () => {
    clearSemesterDetailCache();
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(SEMESTER_DETAIL_LOCAL_CACHE_KEY);
      } catch (error) {
        console.warn('Failed to clear semester detail local cache:', error);
      }
    }
    setResolvedPreviewUrl('');
    setHydratedState({});
  };

  const handleViewStudent = (row) => {
    console.log('🔍 Eye icon clicked for student:', row);
    
    // CRITICAL: Find the full record to get programme, examDate, etc.
    const fullRecord = extractedStudents.find(s => s.regNo === row.registerNumber);
    
    // CRITICAL: The subjects are now attached directly to row from displayStudents
    const subjects = fullRecord?.subjects || row.subjects || [];
    console.log('📊 Subjects found on row:', subjects.length, 'items');
    console.log('📊 Full subjects data:', JSON.stringify(subjects.slice(0, 2))); // Log first 2 subjects as sample

    const [firstName = '', ...restName] = (row.name || '').split(' ');
    const lastName = restName.join(' ');

    console.log('📍 Navigating to marksheet page with:', {
      regNo: row.registerNumber,
      firstName,
      lastName,
      semester: row.semester,
      subjectsCount: subjects.length
    });

    navigate('/coo-manage-students-semester/marksheet', {
      state: {
        student: {
          ...row,
          programme: fullRecord?.programme || '',
          examDate: fullRecord?.examDate || '',
          studentId: row.id,
          regNo: row.registerNumber,
          registerNumber: row.registerNumber,
          firstName,
          lastName,
          currentYear: row.year,
          currentSgpa: row.sgpa,
          overallCgpa: row.overallCgpa,
          semester: row.semester,
          currentSemester: row.semester,
          section: row.section,
          arrearStatus: row.arrears === '0' ? 'NHA' : 'SA',
          overallArrears: row.overallArrears,
          sgpa: row.sgpa,
          semesterRecord: row,
          isPreview: true, // Flag to prevent 404 API calls on the next page
          subjects: subjects,
          pdfPage: row.pdfPage
        },
        previewUrl: resolvedPreviewUrl || previewUrl, 
        fileData: selectedFile
      },
    });
  };

  const handleSubmit = async () => {
    if (!displayStudents.length || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitMessage('');

    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/semester/submit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ 
          extractedPdfName: effectivePdfName,
          uploadId,
          year,
          semester
        })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Failed to submit semester records');
      }

      setSubmitMessage('Semester records submitted successfully.');
      await fetchSemesterRecords();
    } catch (error) {
      setSubmitError(error.message || 'Failed to submit semester records');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <CoordinatorSaveSuccessAlert
        isOpen={!!submitMessage}
        onClose={() => {
          setSubmitMessage('');
          navigate('/coo-manage-students-semester');
        }}
        title="Submitted!"
        heading="Semester Submitted ✓"
        message="Semester records have been Successfully submitted in the Portal"
      />
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} Adminicon={Adminicon} />
      <div className={styles['co-semester-layout']}>
        <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView="manage-students" onViewChange={onViewChange}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className={styles['semester-content']}>
          <section className={styles['top-grid']}>
            <div className={`${styles['stat-card']} ${styles['stat-card-total-students']}`}>
              <span className={styles['stat-title']}>Total Students</span>
              <span className={styles['stat-count']}>{totalStudents}</span>
            </div>

            <div className={`${styles['stat-card']} ${styles['stat-card-all-clear']}`}>
              <span className={styles['stat-title']}>All clear Students</span>
              <span className={styles['stat-count']}>{allClearStudents}</span>
            </div>

            <div className={styles['filter-card']}>
              <div className={styles['filter-header-container']}>
                <span className={styles['filter-badge']}>Filter & Sort</span>
                {hasActiveFilters && (
                  <button 
                    type="button" 
                    className={styles['clear-btn-header']} 
                    onClick={handleClearFilters}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className={styles['fields-container']}>
                <div className={styles['filter-row']}>
                  <div className={styles['input-wrapper']}>
                    <label className={styles['static-label']}>Student Name / Register Number</label>
                    <div className={styles['input-container']}>
                      <input 
                        type="text" 
                        className={styles['text-input']}
                        placeholder="Enter Name or Reg No" 
                        value={filterSearch} 
                        onChange={(e) => setFilterSearch(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className={styles['input-wrapper']}>
                    <label className={styles['static-label']}>Status</label>
                    <Dropdown
                      options={[
                        { label: 'All Students', value: 'all' },
                        { label: 'Cleared Students', value: 'cleared' },
                        { label: 'Arrear Students', value: 'arrear' }
                      ]}
                      selectedOption={filterStatus}
                      onSelect={(val) => setFilterStatus(val || 'all')}
                      placeholder="All Students"
                      role="coo"
                      className={styles['dropdown-wrapper']}
                      headerClassName={styles['dropdown-header']}
                    />
                  </div>
                </div>

                <div className={styles['filter-row']}>
                  <div className={styles['input-wrapper']}>
                    <label className={styles['static-label']}>SGPA Range</label>
                    <div className={styles['range-inputs']}>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        max="10"
                        placeholder="Min" 
                        value={filterMinSgpa} 
                        onChange={(e) => setFilterMinSgpa(e.target.value)} 
                      />
                      <span>to</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        max="10"
                        placeholder="Max" 
                        value={filterMaxSgpa} 
                        onChange={(e) => setFilterMaxSgpa(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className={styles['input-wrapper']}>
                    <label className={styles['static-label']}>CGPA Range</label>
                    <div className={styles['range-inputs']}>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        max="10"
                        placeholder="Min" 
                        value={filterMinCgpa} 
                        onChange={(e) => setFilterMinCgpa(e.target.value)} 
                      />
                      <span>to</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        max="10"
                        placeholder="Max" 
                        value={filterMaxCgpa} 
                        onChange={(e) => setFilterMaxCgpa(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${styles['stat-card']} ${styles['stat-card-arrear-students']}`}>
              <span className={styles['stat-title']}>Arrear Students</span>
              <span className={styles['stat-count']}>{arrearStudents}</span>
            </div>

            <div className={`${styles['stat-card']} ${styles['stat-card-total-subjects']}`}>
              <span className={styles['stat-title']}>Total Subjects</span>
              <span className={styles['stat-count']}>{subjects.length}</span>
            </div>
          </section>

          <section className={styles['table-card']}>
            <div className={styles['section-header']}>
              <h2>Computer Science &amp; Engineering</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="button" 
                  className={styles['print-btn']} 
                  onClick={() => window.print()}
                >
                  Print
                </button>
              </div>
            </div>

            {submitError && (
              <div style={{ marginBottom: '16px', color: '#c53030', fontWeight: 600 }}>
                {submitError}
              </div>
            )}

            <div className={styles['table-wrap']}>
              <table className={styles['subject-table']}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Student Name</th>
                    <th>Register Number</th>
                    <th>Semester</th>
                    <th>Cleared</th>
                    <th>Arrear</th>
                    <th>SGPA</th>
                    <th>CGPA</th>
                    <th>Submitted</th>
                    <th>View</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingRecords ? (
                    <tr className={styles['co-history-loading-row']}>
                      <td colSpan="10" className={styles['co-history-loading-cell']}>
                        <div className={styles['co-history-loading-wrapper']}>
                          <div className={styles['co-history-spinner']}></div>
                          <span className={styles['co-history-loading-text']}>Loading semester records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ padding: '40px', textAlign: 'center', color: '#999', backgroundColor: 'transparent' }}>
                        {displayStudents.length === 0 ? 'No students to display' : 'No students matching the applied filters'}
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(function(student, index) {
                      const isSubmitted = Boolean(student.submitted);
                      return (
                        <tr key={student.id}>
                          <td>{index + 1}</td>
                          <td>{student.name}</td>
                          <td>{student.registerNumber}</td>
                          <td>{student.semester}</td>
                          <td>{parseInt(student.semester) - parseInt(student.arrears)}</td>
                          <td>{student.arrears}</td>
                          <td>{student.sgpa}</td>
                          <td>{student.overallCgpa}</td>
                          <td>
                            <span className={isSubmitted ? styles['yes-badge'] : styles['no-badge']}>
                              {isSubmitted ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleViewStudent(student)}
                              aria-label={`View semester record for ${student.name}`}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                cursor: 'pointer',
                                color: '#4EA24E',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <EyeIcon />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className={styles['sticky-action-bar']}>
              <button 
                type="button" 
                className={styles['back-btn']} 
                onClick={handleBack}
              >
                Back
              </button>
              <button 
                type="button" 
                className={styles['submit-btn']} 
                onClick={handleSubmit} 
                disabled={isSubmitting || !displayStudents.length || allSubmitted || !!submitMessage}
              >
                {(allSubmitted || !!submitMessage) ? 'Submitted' : (isSubmitting ? 'Submitting...' : 'Submit')}
              </button>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default CooSemesterDetail;
