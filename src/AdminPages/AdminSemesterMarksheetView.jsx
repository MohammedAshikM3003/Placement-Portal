import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar/Adnavbar";
import Sidebar from "../components/Sidebar/Adsidebar";
import styles from './AdminSemesterMarksheetView.module.css';
import Download from "../assets/Downloadsemesterviewicon.svg";
import Previewicon from "../assets/Adminpreviewmarksheeticon.svg";
import Adminicons from "../assets/AdmingreenCapicon.svg";

const AdminSemesterMarksheetView = ({ onLogout, onViewChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const studentData = location.state?.student;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [exportPopupState, setExportPopupState] = useState('none'); // 'none', 'progress', 'success', 'failed'
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('PDF');

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

  const courses = [
    { sno: 1, semester: 5, courseCode: '20CS511', courseName: 'Principles of Compiler Design', grade: 'B+', result: 'P' },
    { sno: 2, semester: 5, courseCode: '20CS512', courseName: 'Web Programming', grade: 'B+', result: 'P' },
    { sno: 3, semester: 5, courseCode: '20CS513', courseName: 'Object Oriented Analysis and Design', grade: 'A+', result: 'P' },
    { sno: 4, semester: 5, courseCode: '20CS514', courseName: 'Computer Networks', grade: 'B+', result: 'P' },
    { sno: 5, semester: 5, courseCode: '20CS515', courseName: 'Entrepreneurship Development', grade: 'U', result: 'F' },
    { sno: 6, semester: 5, courseCode: '20CS564', courseName: 'Open Source Technologies', grade: 'A+', result: 'P' },
    { sno: 7, semester: 5, courseCode: '20CS516', courseName: 'Database Management Systems', grade: 'A', result: 'P' },
    { sno: 8, semester: 5, courseCode: '20CS517', courseName: 'Software Engineering', grade: 'B', result: 'P' },
    { sno: 9, semester: 5, courseCode: '20CS518', courseName: 'Machine Learning', grade: 'A+', result: 'P' },
    { sno: 10, semester: 5, courseCode: '20CS519', courseName: 'Cloud Computing', grade: 'B+', result: 'P' },
  ];

  // Default student data if none provided
  const defaultStudent = {
    name: 'Ravinder Kumar',
    regNo: '7315XXXX001',
    dob: '15-08-2003',
    year: 'III',
    semester: '5',
    programme: 'B.E CSE',
    examDate: 'DEC 2025',
    currentSgpa: '8.45',
    overallCgpa: '8.12',
    published: '15-01-2026',
    attempted: '30',
    cleared: '27',
    pending: '3'
  };

  // Merge studentData with defaultStudent to fill missing fields
  const student = studentData ? { ...defaultStudent, ...studentData } : defaultStudent;

  const handleDiscard = () => {
    // Navigate back to student profile view
    if (studentData?.id || studentData?._id) {
      const studentId = studentData._id || studentData.id;
      navigate(`/admin-student-view/${studentId}`);
    } else {
      navigate(-1); // Fallback to browser back
    }
  };

  const handleSubmit = () => {
    console.log('Submit changes');
    // Add your submit logic here
  };

  const handlePreviewMarksheet = () => {
    console.log('Preview marksheet');
    // Show loading popup
    setExportType('Previewing');
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
    
    // Complete loading and close popup
    setTimeout(() => {
      setExportProgress(100);
      clearInterval(progressInterval);
      
      // Close popup after completion
      setTimeout(() => {
        setExportPopupState('none');
        setExportProgress(0);
        // Add your preview logic here
      }, 500); // Longer delay for smooth completion
    }, 2000); // Longer duration for smoother experience
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
        <div className={styles['view-content-wrapper']}>
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
                <h3 className={styles['view-action-title']}>Preview Marksheet</h3>
                <p className={styles['view-action-description']}>
                  View and analyse the student's current semester marksheet.
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
            <div className={styles['view-table-container']}>
              {/* Desktop Table - Header */}
              <table className={styles['view-courses-table-header']}>
                <thead>
                  <tr>
                    <th>S.NO</th>
                    <th>Semester</th>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Grade</th>
                    <th>Result</th>
                  </tr>
                </thead>
              </table>
              {/* Desktop Table - Body with Scroll */}
              <div className={styles['view-table-scroll']}>
                <table className={styles['view-courses-table-body']}>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.sno}>
                        <td>{course.sno}</td>
                        <td>{course.semester}</td>
                        <td>{course.courseCode}</td>
                        <td>{course.courseName}</td>
                        <td>{course.grade}</td>
                        <td className={course.result === 'P' ? styles['result-pass'] : styles['result-fail']}>
                          {course.result}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile Table - Unified */}
              <table className={styles['view-course-table-mobile']}>
                <thead>
                  <tr>
                    <th>S.NO</th>
                    <th>Semester</th>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Grade</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.sno}>
                      <td>{course.sno}</td>
                      <td>{course.semester}</td>
                      <td>{course.courseCode}</td>
                      <td>{course.courseName}</td>
                      <td>{course.grade}</td>
                      <td className={course.result === 'P' ? styles['result-pass'] : styles['result-fail']}>
                        {course.result}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div className={styles['view-action-buttons']}>
              <button className={styles['view-discard-btn']} onClick={handleDiscard}>
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Export Popups */}
      <PreviewProgressPopup />
      <DownloadProgressPopup />
      <ExportSuccessPopup />
    </div>
  );
};

export default AdminSemesterMarksheetView;