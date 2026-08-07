

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar/Adnavbar";
import Sidebar from "../components/Sidebar/Adsidebar";
import styles from './AdminSemesterMarksheetView.module.css';
import Download from "../assets/Downloadsemesterviewicon.svg";
import Previewicon from "../assets/Adminpreviewmarksheeticon.svg";
import Adminicons from "../assets/AdmingreenCapicon.svg";
import mongoDBService from '../services/mongoDBService.jsx';
import { CertificateDownloadProgressAlert } from '../components/alerts/DownloadPreviewAlerts';

const AdminSemesterMarksheetView = ({ onLogout, onViewChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const studentData = location.state?.student;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [exportPopupState, setExportPopupState] = useState('none'); // 'none', 'progress', 'success', 'failed'
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('PDF');

  const [semesterRecord, setSemesterRecord] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(18);

  const loadStartedAtRef = useRef(Date.now());
  const MIN_LOADING_DURATION_MS = 900;

  const targetRegNo = studentData?.regNo || studentData?.registerNumber || '';
  const targetSemester = studentData?.currentSemester || studentData?.semester || '';
  const targetYear = studentData?.year || '';

  const finishLoading = useCallback(async () => {
    const elapsed = Date.now() - loadStartedAtRef.current;
    if (elapsed < MIN_LOADING_DURATION_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_DURATION_MS - elapsed));
    }
    setIsInitialLoading(false);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!targetRegNo || !targetSemester) {
        setIsLoading(false);
        await finishLoading();
        return;
      }
      try {
        loadStartedAtRef.current = Date.now();
        setIsInitialLoading(true);
        setIsLoading(true);
        const response = await mongoDBService.getSemesterMarksheetByRegNo(targetRegNo, targetSemester, targetYear);
        let record = response?.marksheet
          || response?.record
          || (Array.isArray(response?.records) ? response.records[0] : null);
        
        if (!record) {
          const fallback = await mongoDBService.getSemesterMarksheetByRegNo(targetRegNo, targetSemester, '');
          record = fallback?.marksheet
            || fallback?.record
            || (Array.isArray(fallback?.records) ? fallback.records[0] : null);
        }

        if (record) {
          setSemesterRecord(record);
          setCourses(Array.isArray(record.subjects) ? record.subjects : []);
        }
      } catch (error) {
        console.error("Failed to fetch semester marksheet:", error);
      } finally {
        setIsLoading(false);
        await finishLoading();
      }
    };
    loadData();
  }, [targetRegNo, targetSemester, targetYear, finishLoading]);

  useEffect(() => {
    if (!isInitialLoading) {
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
  }, [isInitialLoading]);

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleViewChange = (view) => {
    console.log('🔹 AdminSemesterMarksheetView handleViewChange called with view:', view);
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

  const studentSource = semesterRecord || studentData || {};
  const student = {
    id: studentSource.id || studentSource._id || '',
    _id: studentSource._id || studentSource.id || '',
    name: studentSource.studentName || studentSource.name || '',
    regNo: studentSource.regNo || studentSource.registerNumber || '',
    dob: studentSource.dob || '',
    year: studentSource.academicYear || studentSource.year || '',
    semester: studentSource.semester || targetSemester || '',
    programme: studentSource.programme || studentSource.department || '',
    examDate: studentSource.examMonthYear || studentSource.examDate || '',
    currentSgpa: studentSource.sgpa || '',
    overallCgpa: studentSource.cgpa || '',
    published: studentSource.published || studentSource.examDate || '',
    attempted: Array.isArray(courses) ? courses.length : 0,
    cleared: Array.isArray(courses) ? courses.filter(s => s.grade !== 'U' && s.grade !== 'RA' && s.grade !== 'SA').length : 0,
    pending: Array.isArray(courses) ? courses.filter(s => s.grade === 'U' || s.grade === 'RA' || s.grade === 'SA').length : 0
  };

  const handleDiscard = () => {
    const returnPath = location.state?.returnPath;
    if (returnPath) {
      navigate(returnPath, { state: { fromMarksheetView: true } });
      return;
    }
    // Navigate back to student profile view
    if (studentData?.id || studentData?._id) {
      const studentId = studentData._id || studentData.id;
      navigate(`/admin-student-view/${studentId}`, { state: { fromMarksheetView: true } });
    } else {
      navigate(-1); // Fallback to browser back
    }
  };

  const handleSubmit = () => {
    console.log('Submit changes');
    // Add your submit logic here
  };

  const handlePreviewMarksheet = () => {
    const studentId = studentData?.id || studentData?._id || semesterRecord?.studentId || '';
    navigate(`/admin-semester-edit/${studentId}`, {
      state: {
        student: student,
        subjects: courses,
        semesterRecord: semesterRecord
      }
    });
  };

  const handleDownloadMarksheet = () => {
    console.log('Download marksheet');
    setExportType('Marksheet');
    setExportPopupState('progress');
    setExportProgress(0);
    
    // Slower, smoother progress updates
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10; // Smaller increments for smoother animation
      });
    }, 300); // Slower interval for smoother updates
    
    // Simulate download completion
    setTimeout(() => {
      setExportProgress(100);
      clearInterval(progressInterval);
      
      // Show success popup
      setTimeout(() => {
        setExportPopupState('success');
        setExportProgress(0);
      }, 500); // Longer delay for smooth completion
    }, 2000); // Longer duration for smoother experience
  };

  // Preview Progress Popup Component
  const PreviewProgressPopup = () => {
    if (exportPopupState !== 'progress' || exportType !== 'Previewing') return null;

    const messages = {
      initial: 'Previewing Marksheet...',
      mid: 'Generating Preview...',
      final: 'Preparing Preview...',
    };

    return (
      <div className={styles['alert-overlay']}>
        <div className={styles['achievement-popup-container']}>
          <div className={styles['achievement-popup-header']} style={{ backgroundColor: '#4ea24e' }}>
            Previewing...
          </div>
          <div className={styles['achievement-popup-body']}>
            <div className={styles['preview-progress-icon-container']}>
              <svg className={styles['preview-progress-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className={styles['preview-progress-icon--bg']} cx="26" cy="26" r="20" fill="none" stroke="#BEBFC6" strokeWidth="4"/>
                <circle 
                  className={styles['preview-progress-icon--progress']} 
                  cx="26" 
                  cy="26" 
                  r="20" 
                  fill="none" 
                  stroke="#4ea24e"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${exportProgress * 1.256} 125.6`}
                  transform="rotate(-90 26 26)"
                />
              </svg>
            </div>
            <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
              Previewing {Math.round(exportProgress)}%
            </h2>
            <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
              {exportProgress < 40
                ? messages.initial
                : exportProgress < 85
                  ? messages.mid
                  : messages.final}
            </p>
            <p style={{ margin: "10px 0 0 0", color: "#888", fontSize: "14px" }}>
              {exportProgress >= 100 ? 'Preview starting...' : 'Please wait...'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Download Progress Popup Component
  const DownloadProgressPopup = () => {
    if (exportPopupState !== 'progress' || exportType !== 'Marksheet') return null;

    const messages = {
      initial: 'Preparing Marksheet download...',
      mid: 'Generating Marksheet file...',
      final: 'Finalizing Marksheet download...',
    };

    return (
      <div className={styles['alert-overlay']}>
        <div className={styles['achievement-popup-container']}>
          <div className={styles['achievement-popup-header']} style={{ backgroundColor: '#4ea24e' }}>
            Downloading...
          </div>
          <div className={styles['achievement-popup-body']}>
            <div className={styles['preview-progress-icon-container']}>
              <svg className={styles['preview-progress-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className={styles['preview-progress-icon--bg']} cx="26" cy="26" r="20" fill="none" stroke="#BEBFC6" strokeWidth="4"/>
                <circle 
                  className={styles['preview-progress-icon--progress']} 
                  cx="26" 
                  cy="26" 
                  r="20" 
                  fill="none" 
                  stroke="#4ea24e"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${exportProgress * 1.256} 125.6`}
                  transform="rotate(-90 26 26)"
                />
              </svg>
            </div>
            <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
              Downloading {Math.round(exportProgress)}%
            </h2>
            <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
              {exportProgress < 40
                ? messages.initial
                : exportProgress < 85
                  ? messages.mid
                  : messages.final}
            </p>
            <p style={{ margin: "10px 0 0 0", color: "#888", fontSize: "14px" }}>
              {exportProgress >= 100 ? 'Download starting...' : 'Please wait...'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Export Success Popup Component (From AdminDownloadPreviewAlerts.js)
  const ExportSuccessPopup = () => {
    if (exportPopupState !== 'success') return null;

    const headerText = exportType === 'Previewing' ? 'Preview Complete!' : 'Download Complete!';
    const titleText = exportType === 'Previewing' ? 'Marksheet Previewed!' : `${exportType} Downloaded!`;

    return (
      <div className={styles['alert-overlay']}>
        <div className={styles['achievement-popup-container']}>
          <div className={styles['achievement-popup-header']} style={{ backgroundColor: '#4ea24e' }}>
            {headerText}
          </div>
          <div className={styles['achievement-popup-body']}>
            <svg className={styles['achievement-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className={styles['achievement-success-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
              <path className={styles['achievement-success-icon--check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
              {titleText}
            </h2>
            <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
              {exportType === 'Previewing' 
                ? <>Your marksheet preview has been<br />generated successfully</>
                : <>Your {exportType} has been<br />downloaded successfully</>
              }
            </p>
          </div>
          <div className={styles['achievement-popup-footer']}>
            <button type="button" onClick={() => setExportPopupState('none')} className={styles['achievement-popup-close-btn']}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles['view-page-container']}>
      <Navbar onLogout={onLogout} onToggleSidebar={handleToggleSidebar} />
      <Sidebar
        isOpen={isSidebarOpen}
        onLogout={onLogout}
        currentView={'student-database'}
        onViewChange={handleViewChange}
      />

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className={styles['sidebar-overlay']}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={styles['view-content']}>
        <div className={styles['view-content-wrapper']} style={{ pointerEvents: isInitialLoading ? 'none' : 'auto' }}>
          {/* Left Column - Green Student Card */}
          <div className={styles['view-left-column']}>
            <div className={styles['view-student-card']}>
              <div className={styles['view-student-header']}>
                <img src={Adminicons} alt="Graduation Cap" className={styles['view-cap-icon']} />
              </div>

              <div className={styles['view-student-details']}>
                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Name</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.name}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Reg No</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.regNo}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>D O B</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.dob}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Year</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.year}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Semester</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.semester}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Programme</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.programme}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Exam MM/YY</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.examDate}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Current SGPA</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.currentSgpa}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Overall CGPA</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.overallCgpa}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Published</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.published}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Attempted</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.attempted}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Cleared</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.cleared}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Pending</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.pending}</span>
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
                  Review, Edit and Update Student Semester Marksheet Records
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

            {/* Courses Table */}
            <div className={styles['view-table-container']} style={{ padding: '2rem', paddingTop: '0', marginTop: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #4EA24E' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333', margin: 0 }}>
                  Semester {student.semester || targetSemester || ''} - Subjects ({student.attempted})
                </h2>
                <button 
                  type="button" 
                  onClick={handleDiscard}
                  style={{ 
                    backgroundColor: '#808080', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 24px', 
                    borderRadius: '8px', 
                    fontWeight: '600', 
                    fontSize: '0.9rem', 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#707070'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#808080'}
                >
                  Back
                </button>
              </div>
              
              {courses.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666', fontSize: '16px' }}>
                  {isLoading ? 'Loading semester marksheet data...' : 'No marksheet subjects found for this semester record.'}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '14px',
                    fontFamily: 'Poppins, sans-serif'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#4EA24E', borderBottom: '2px solid #3d8a3d' }}>
                        <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#fff', fontSize: '12px', width: '50px' }}>S.NO</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#fff', fontSize: '12px', width: '60px' }}>SEM</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#fff', fontSize: '12px', width: '120px' }}>COURSE CODE</th>
                        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: '600', color: '#fff', fontSize: '12px' }}>COURSE NAME</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#fff', fontSize: '12px', width: '80px' }}>CREDITS</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#fff', fontSize: '12px', width: '80px' }}>GRADE</th>
                        <th style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: '#fff', fontSize: '12px', width: '80px' }}>RESULT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map((course, index) => {
                        const courseCode = course.courseCode || course.subjectCode || '--';
                        const courseName = course.courseName || course.subjectName || '--';
                        const rawResult = (course.result || course.status || '').toString().trim().toUpperCase();
                        const resultValue = rawResult === 'PASS' || rawResult === 'CLEARED' ? 'P' : rawResult === 'FAIL' || rawResult === 'ARREAR' ? 'F' : rawResult;
                        const isFail = resultValue === 'F' || (course.grade === 'U' || course.grade === 'RA');
                        const semesterValue = course.semester || course.sem || student.semester || '--';

                        return (
                          <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>{index + 1}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>{semesterValue}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'left' }}>{courseCode}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'left' }}>{courseName}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>{course.credits || '0'}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>{course.grade || '--'}</td>
                            <td style={{ 
                              padding: '12px 8px', 
                              textAlign: 'center', 
                              color: isFail ? '#C53030' : '#4EA24E', 
                              fontWeight: '500' 
                            }}>
                              {resultValue || (isFail ? 'F' : 'P')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Export Popups */}
      <CertificateDownloadProgressAlert
        isOpen={isInitialLoading}
        progress={loadingProgress}
        fileLabel="student semester marksheet"
        title="Loading..."
        color="#4EA24E"
        progressColor="#4EA24E"
        messages={{
            initial: 'Fetching student semester marksheet...',
            mid: 'Loading latest marksheet record...',
            final: 'Preparing page...'
        }}
      />
      <PreviewProgressPopup />
      <DownloadProgressPopup />
      <ExportSuccessPopup />
    </div>
  );
};

export default AdminSemesterMarksheetView;