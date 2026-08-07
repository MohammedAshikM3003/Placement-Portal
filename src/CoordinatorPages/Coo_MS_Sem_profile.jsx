import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Navbar from "../components/Navbar/Conavbar";
import Sidebar from "../components/Sidebar/Cosidebar";
import styles from './Coo_MS_Sem.module.css';
import Download from "../assets/Downloadsemesterviewicon.svg";
import Previewicon from "../assets/Adminpreviewmarksheeticon.svg";
import Adminicons from "../assets/AdmingreenCapicon.svg";
import { CertificateDownloadProgressAlert } from '../components/alerts';
import mongoDBService from '../services/mongoDBService.jsx';
import { API_BASE_URL } from '../utils/apiConfig';

const emptyStudent = {
  name: '',
  regNo: '',
  dob: '',
  year: '',
  semester: '',
  programme: '',
  examDate: '',
  currentSgpa: '',
  overallCgpa: '',
  published: '',
  attempted: '',
  cleared: '',
  pending: ''
};

const SEMESTER_CACHE_KEY = 'cooSemesterMarksheetState';
const MIN_LOADING_DURATION_MS = 900;

const CoordinatorManageStudentViewProfile = ({ onLogout, onViewChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const loadStartedAtRef = useRef(Date.now());
  const studentData = location.state?.student || null;
  const initialSubjects = Array.isArray(location.state?.subjects) ? location.state.subjects : [];
  const initialSemesterRecord = location.state?.semesterRecord || null;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [semesterRecord, setSemesterRecord] = useState(initialSemesterRecord);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(18);
  const [students, setStudents] = useState(initialSubjects);
  const [masterSubjects, setMasterSubjects] = useState([]);
  const normalizeCourseCode = (value) => String(value || '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '');
  
  // States for PDF splitting & loading UI
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingType, setProcessingType] = useState('Previewing'); // 'Previewing' or 'Downloading'
  const [progress, setProgress] = useState(0);

  const studentSource = studentData?.isPreview
    ? (studentData || semesterRecord || {})
    : (semesterRecord || studentData || {});
  const studentId = studentSource?.studentId || studentSource?._id || studentSource?.id || '';
  const currentSemester = studentSource?.currentSemester || studentSource?.semester || '';
  const displayName = studentSource?.name
    || studentSource?.studentName
    || `${studentSource?.firstName || ''} ${studentSource?.lastName || ''}`.trim()
    || studentSource?.fullName
    || '';

  const student = {
    ...emptyStudent,
    ...studentSource,
    name: displayName || studentSource?.name || '',
    regNo: studentSource?.regNo || studentSource?.registerNumber || '',
    year: studentSource?.currentYear || studentSource?.year || '',
    semester: currentSemester,
    programme: studentSource?.programme || '',
    examDate: studentSource?.examDate || '',
    currentSgpa: studentSource?.currentSgpa || studentSource?.sgpa || '',
    overallCgpa: studentSource?.overallCgpa || studentSource?.cgpa || '',
    published: studentSource?.examDate || studentSource?.published || '',
    attempted: studentSource?.subjects ? studentSource.subjects.length : (studentSource?.attempted ?? ''),
    cleared: studentSource?.subjects ? studentSource.subjects.filter(s => s.grade !== 'U' && s.grade !== 'RA').length : (studentSource?.cleared ?? ''),
    pending: studentSource?.subjects ? (studentSource.subjects.length - studentSource.subjects.filter(s => s.grade !== 'U' && s.grade !== 'RA').length) : (studentSource?.pending ?? '')
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // DEBUG: Log state at render time
  useEffect(() => {
    console.log('🔍 [RENDER DEBUG] Coo_ManageStudentView state snapshot:', {
      studentDataExists: !!studentData,
      studentDataKeys: studentData ? Object.keys(studentData) : [],
      studentDataSubjects: studentData?.subjects,
      studentDataSubjectsLength: Array.isArray(studentData?.subjects) ? studentData.subjects.length : 'NOT_ARRAY',
      studentsStateLength: students.length,
      isLoading,
      studentId,
      currentSemester
    });
  }, [students, isLoading]);

  useEffect(() => {
    const loadMasterSubjects = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/subjects`, {
          headers: localStorage.getItem('authToken')
            ? { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
            : {}
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

  const masterCreditLookup = useMemo(() => {
    const lookup = new Map();
    for (const subject of masterSubjects) {
      const code = normalizeCourseCode(subject.courseCode);
      if (!code) continue;
      lookup.set(code, subject.credits ?? null);
    }
    return lookup;
  }, [masterSubjects]);

  const fetchLatestStudentMarksheet = useCallback(async (options = {}) => {
    const shouldManageLoadingState = options.setLoading !== false;
    const targetRegNo = options.regNo
      || location.state?.regNo
      || studentData?.regNo
      || studentData?.registerNumber;
    const targetSemester = options.semester
      || location.state?.semester
      || studentData?.currentSemester
      || studentData?.semester;
    const targetYear = options.year
      || location.state?.year
      || studentData?.currentYear
      || studentData?.year
      || '';

    if (!targetRegNo || !targetSemester) {
      console.warn('⚠️ Missing regNo/semester for refresh fetch', { targetRegNo, targetSemester });
      return;
    }

    if (shouldManageLoadingState) {
      setIsLoading(true);
    }

    try {
      console.log('🔄 Fetching latest marksheet...');
      const response = await mongoDBService.getSemesterMarksheetByRegNo(targetRegNo, targetSemester, targetYear);
      let record = response?.marksheet
        || response?.record
        || (Array.isArray(response?.records) ? response.records[0] : null);

      if (!record && targetYear) {
        console.log('🔄 Retrying marksheet fetch without year filter...');
        const fallbackResponse = await mongoDBService.getSemesterMarksheetByRegNo(targetRegNo, targetSemester, '');
        record = fallbackResponse?.marksheet
          || fallbackResponse?.record
          || (Array.isArray(fallbackResponse?.records) ? fallbackResponse.records[0] : null);
      }

      if (record) {
        setSemesterRecord(record);
        setStudents(Array.isArray(record.subjects) ? record.subjects : []);

        console.log('✅ Fresh marksheet received');
        return record;
      } else {
        console.warn('⚠️ No marksheet record found for refresh', {
          regNo: targetRegNo,
          semester: targetSemester,
          year: targetYear
        });
        return null;
      }
    } catch (error) {
      console.error('❌ Fetch failed', error);
      return null;
    } finally {
      if (shouldManageLoadingState) {
        setIsLoading(false);
      }
    }
  }, [location.state, studentData]);

  useEffect(() => {
    if (location.state?.refresh || location.state?.discard) {
      console.log('🔄 Refetching latest marksheet after discard');
      fetchLatestStudentMarksheet({
        regNo: location.state?.regNo,
        semester: location.state?.semester,
        year: location.state?.year,
        setLoading: false
      });
    }
  }, [location.state?.refresh, location.state?.discard, location.state?.regNo, location.state?.semester, location.state?.year, fetchLatestStudentMarksheet]);

  useEffect(() => {
    if (!isLoading) {
      setLoadingProgress(100);
      return;
    }

    setLoadingProgress(18);
    const intervalId = setInterval(() => {
      setLoadingProgress((currentProgress) => {
        if (currentProgress >= 92) return currentProgress;
        if (currentProgress >= 70) return Math.min(currentProgress + 2, 92);
        if (currentProgress >= 35) return Math.min(currentProgress + 4, 70);
        return Math.min(currentProgress + 6, 35);
      });
    }, 140);

    return () => clearInterval(intervalId);
  }, [isLoading]);

  useEffect(() => {
    console.log('📚 Subjects loaded:', students?.length || 0);
  }, [students]);

  const finishLoading = useCallback(async () => {
    const elapsed = Date.now() - loadStartedAtRef.current;
    if (elapsed < MIN_LOADING_DURATION_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_DURATION_MS - elapsed));
    }
    setIsLoading(false);
  }, []);

  // Load semester record on component mount
  useEffect(() => {
    const loadSemesterData = async () => {
      try {
        loadStartedAtRef.current = Date.now();
        setIsLoading(true);
        const reg = studentData?.regNo || studentData?.registerNumber || '';
        const sem = studentData?.currentSemester || studentData?.semester || '';
        const yr = studentData?.currentYear || studentData?.year || '';

        if (!sem) {
          if (Array.isArray(initialSubjects) && initialSubjects.length > 0) {
            setStudents(initialSubjects);
          }
          await finishLoading();
          return;
        }

        console.log('📚 Loading semester data for:', {
          regNo: reg,
          semester: sem
        });

        const fallbackSubjects = Array.isArray(initialSubjects) ? initialSubjects : [];
        const previewSubjects = Array.isArray(studentData?.subjects) ? studentData.subjects : fallbackSubjects;
        const isPreviewData = Boolean(studentData?.isPreview) && !location.state?.refresh && !location.state?.discard;

        // Skip DB lookups entirely if we know this is unsaved preview data
        if (isPreviewData && previewSubjects.length > 0) {
          console.log('✅ Unsaved extracted data detected. Loading preview data.', {
            isPreview: studentData?.isPreview,
            subjectsCount: previewSubjects.length,
            regNo: studentData?.regNo
          });
          setSemesterRecord(studentData);
          setStudents(previewSubjects);
          console.log('✅ Preview data loaded:', previewSubjects.length, 'subjects');
          await finishLoading();
          return;
        }
        const fetchedRecord = await fetchLatestStudentMarksheet({
          regNo: reg,
          semester: sem,
          year: yr,
          setLoading: false
        });

        if (fetchedRecord?.subjects && Array.isArray(fetchedRecord.subjects)) {
          setSemesterRecord(fetchedRecord);
          setStudents(fetchedRecord.subjects);
        }
      } catch (error) {
        console.error('❌ Error loading data:', error);
        setSemesterRecord(null);
        setStudents(Array.isArray(initialSubjects) ? initialSubjects : []);
      } finally {
        await finishLoading();
      }
    };

    loadSemesterData();
  }, [location.key, fetchLatestStudentMarksheet, finishLoading]);

  const handleViewChange = (view) => {
    console.log('🔹 CoordinatorManageStudentViewProfile handleViewChange called with view:', view);
    console.log('🔹 onViewChange prop exists:', !!onViewChange);
    console.log('🔹 onViewChange type:', typeof onViewChange);

    if (onViewChange && typeof onViewChange === 'function') {
      console.log('🔹 Calling onViewChange with view:', view);
      try {
        onViewChange(view);
        console.log('✅ onViewChange called successfully');
      } catch (error) {
        console.error('❌ Error calling onViewChange:', error);
      }
    } else {
      console.error('❌ onViewChange is not a function!');
    }

    setIsSidebarOpen(false);
    console.log('🔹 Sidebar closed');
  };

  // Use provided student data; avoid using mock defaults
  const handleDiscard = () => {
    const returnPath = location.state?.returnPath;
    if (returnPath) {
      navigate(returnPath);
      return;
    }

    if (studentId) {
      navigate(`/coo-manage-students/view/${studentId}`);
    } else {
      navigate('/coo-manage-students');
    }
  };

  const extractPdfPage = async () => {
    try {
      const sourceUrl = location.state?.previewUrl;
      const pageNum = studentData?.pdfPage; // 1-indexed

      if (!sourceUrl) {
        alert("Original PDF data not found. Please re-upload.");
        return null;
      }
      if (!pageNum) {
        alert("Could not identify the page number for this student.");
        return null;
      }

      console.log(`Fetching PDF from ${sourceUrl} to extract page ${pageNum}`);
      const existingPdfBytes = await fetch(sourceUrl).then(res => res.arrayBuffer());
      
      setProgress(50); // halfway

      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const newPdfDoc = await PDFDocument.create();
      
      const totalPages = pdfDoc.getPageCount();
      if (pageNum > totalPages) {
        alert(`Page number ${pageNum} exceeds total pages ${totalPages} in PDF.`);
        return null;
      }
      
      // pdfPage is 1-indexed, copyPages uses 0-indexed
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNum - 1]);
      newPdfDoc.addPage(copiedPage);
      
      setProgress(85); 

      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      return blob;
    } catch (e) {
      console.error('PDF extraction failed:', e);
      alert("Failed to extract marksheet page from original PDF.");
      return null;
    }
  };

  const handlePreviewMarksheet = async () => {
    try {
      sessionStorage.setItem(SEMESTER_CACHE_KEY, JSON.stringify({
        student,
        subjects: students,
        semesterRecord,
        selectedSubjectId: location.state?.selectedSubjectId || ''
      }));
    } catch (error) {
      console.warn('⚠️ Unable to cache semester view before edit:', error.message);
    }

    navigate('/coo-manage-students-semester/edit', {
      state: {
        student,
        subjects: students,
        semesterRecord,
        returnPath: location.pathname,
        selectedSubjectId: location.state?.selectedSubjectId || ''
      }
    });
  };

  const handleDownloadMarksheet = async () => {
    setProcessingType("Downloading");
    setIsProcessing(true);
    setProgress(10);
    
    const interval = setInterval(() => {
        setProgress(p => Math.min(p + 15, 30));
    }, 100);

    const blob = await extractPdfPage();
    clearInterval(interval);
    setProgress(100);
    
    setTimeout(() => {
      setIsProcessing(false);
      if (blob) {
         const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `Marksheet_${student.regNo || 'Unknown'}_Sem${student.semester || 'Unknown'}.pdf`;
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
         
         // Cleanup
         setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    }, 500);
  };

  const showLoadingCard = isLoading && !(student.name || student.regNo);
  const renderValue = (value) => {
    if (showLoadingCard) return 'Loading...';
    if (value === '' || value === null || value === undefined) return '--';
    return value;
  };

  return (
    <div className={styles['view-page-container']}>
      <CertificateDownloadProgressAlert
        isOpen={isLoading}
        progress={loadingProgress}
        fileLabel="student marksheet"
        title="Loading..."
        color="#D23B42"
        progressColor="#D23B42"
        messages={{
          initial: 'Fetching student semester marksheet...',
          mid: 'Loading latest marksheet record...',
          final: 'Preparing page...'
        }}
      />
      <Navbar onLogout={onLogout} onToggleSidebar={handleToggleSidebar} />
      <Sidebar
        isOpen={isSidebarOpen}
        onLogout={onLogout}
        currentView={'manage-students'}
        onViewChange={handleViewChange}
          onClose={() => setIsSidebarOpen(false)}
        />

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className={styles['sidebar-overlay']}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Processing Modal (Like Image 2) */}
      {isProcessing && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', width: '350px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#d32f2f', color: 'white', padding: '16px', textAlign: 'center', fontWeight: 'bold', fontSize: '18px' }}>
              {processingType}...
            </div>
            
            <div style={{ padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '50%', border: '4px solid #f3f3f3', borderTop: '4px solid #d32f2f', animation: 'spin 1s linear infinite', marginBottom: '20px' }} />
              <style>{`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}</style>
              
              <h2 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#333' }}>Loading {progress}%</h2>
              <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>Fetching marksheet from original PDF...</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>Please wait...</p>
            </div>
          </div>
        </div>
      )}

      <div
        className={styles['view-content']}
        style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
      >
        <div className={styles['view-content-wrapper']}>
          {/* Left Column - Student Card */}
          <div className={styles['view-left-column']}>
            <div className={styles['view-student-card']}>
              <div className={styles['view-student-header']}>
                <img src={Adminicons} alt="Graduation Cap" className={styles['view-cap-icon']} />
              </div>

              <div className={styles['view-student-details']}>
                {showLoadingCard && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', border: '4px solid #f3f3f3', borderTop: '4px solid #d32f2f', animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                    <style>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                    `}</style>
                    <span style={{ fontSize: '13px', color: '#777' }}>Loading student record...</span>
                  </div>
                )}
                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Name</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{renderValue(student.name)}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Reg No</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{renderValue(student.regNo)}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Year</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{renderValue(student.year)}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Semester</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{renderValue(student.semester)}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Current SGPA</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{renderValue(student.currentSgpa)}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Overall CGPA</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{renderValue(student.overallCgpa)}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Exam Date</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{renderValue(student.published)}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Attempted</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{renderValue(student.attempted)}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Cleared</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{renderValue(student.cleared)}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Pending</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{renderValue(student.pending)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - White Cards + Table */}
          <div className={styles['view-right-column']}>
            {/* Preview & Download Cards */}
            <div className={styles['view-action-cards']}>
              <div className={styles['view-action-card']} onClick={handlePreviewMarksheet}>
                <img src={Previewicon} alt="Preview" className={styles['view-action-icon']} />
                <h3 className={styles['view-action-title']}>Edit Marksheet</h3>
                <p className={styles['view-action-description']}>
                  Review, Edits and Update Student Semester Marksheet Records.
                </p>
              </div>

              <div className={styles['view-action-card']} onClick={handleDownloadMarksheet}>
                <img src={Download} alt="Download" className={styles['view-action-icon-download']} />
                <h3 className={styles['view-action-title']}>Download Marksheet</h3>
                <p className={styles['view-action-description']}>
                  Download the student's current semester marksheet.
                </p>
              </div>
            </div>

            {/* Semester Students Table Section */}
            {(() => {
              const hasSubjects = Array.isArray(students) && students.length > 0;

              if (hasSubjects) {
                return (
                  <div className={styles['view-info-note']} style={{ marginTop: '5px', paddingTop: '0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0' }}>
                      <h3 className={styles['view-note-title']} style={{ margin: '0 0 0 0' }}>Semester {student.semester} - Subjects ({students.length})</h3>
                      <button className={styles['view-discard-btn']} onClick={handleDiscard} style={{ marginTop: '0', width: 'auto', padding: '8px 24px' }}>
                        Back
                      </button>
                    </div>
                    <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                      {console.log('🎯 [TABLE RENDER DEBUG] Rendering table with', students.length, 'subjects')}
                      <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '14px'
                      }}>
                        <thead>
                          <tr style={{ backgroundColor: '#E63946', borderBottom: '2px solid #C94855' }}>
                            <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#fff', textTransform: 'uppercase', fontSize: '12px', width: '50px' }}>S.NO</th>
                            <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#fff', textTransform: 'uppercase', fontSize: '12px', width: '60px' }}>Sem</th>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600', color: '#fff', textTransform: 'uppercase', fontSize: '12px' }}>Course Code</th>
                            <th style={{ padding: '8px', textAlign: 'left', fontWeight: '600', color: '#fff', textTransform: 'uppercase', fontSize: '12px' }}>Course Name</th>
                            <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#fff', textTransform: 'uppercase', fontSize: '12px', width: '80px' }}>Credits</th>
                            <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#fff', textTransform: 'uppercase', fontSize: '12px', width: '80px' }}>Grade</th>
                            <th style={{ padding: '8px', textAlign: 'center', fontWeight: '600', color: '#fff', textTransform: 'uppercase', fontSize: '12px', width: '80px' }}>Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.map((subject, index) => {
                            const courseCode = normalizeCourseCode(subject.courseCode);
                            const masterCredits = masterCreditLookup.get(courseCode);
                            const rawCredits = subject.credits;
                            const normalizedCredits = (rawCredits === '' || rawCredits === null || rawCredits === undefined)
                              ? null
                              : rawCredits;
                            const creditsValue = normalizedCredits ?? masterCredits;
                            const creditsDisplay = (creditsValue === null || creditsValue === undefined || creditsValue === '')
                              ? '--'
                              : creditsValue;
                            const semesterValue = subject.semester || subject.sem || currentSemester || '--';
                            return (
                              <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '8px', textAlign: 'center' }}>{index + 1}</td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>{semesterValue}</td>
                                <td style={{ padding: '8px' }}>{subject.courseCode || ''}</td>
                                <td style={{ padding: '8px' }}>{subject.courseName || subject.subjectName || ''}</td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>{creditsDisplay}</td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>{subject.grade || ''}</td>
                                <td style={{ padding: '8px', textAlign: 'center', color: (subject.result === 'F' || subject.grade === 'U' || subject.grade === 'RA') ? '#C53030' : '#4EA24E', fontWeight: '500' }}>
                                  {subject.result || ((subject.grade === 'U' || subject.grade === 'RA') ? 'F' : 'P')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              if (isLoading) {
                return (
                  <div className={styles['view-info-note']}>
                    <p style={{ textAlign: 'center', color: '#666' }}>Loading semester data...</p>
                  </div>
                );
              }

              return (
                <div className={styles['view-info-note']}>
                  <p style={{ textAlign: 'center', color: '#666' }}>No subjects found.</p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
      
      {/* Export Popups removed (no longer used) */}
    </div>
  );
};

export default CoordinatorManageStudentViewProfile;