import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar/Conavbar";
import Sidebar from "../components/Sidebar/Cosidebar";
import styles from './Coo_ManageStudentView.module.css';
import Download from "../assets/Downloadsemesterviewicon.svg";
import Previewicon from "../assets/Adminpreviewmarksheeticon.svg";
import Adminicons from "../assets/AdmingreenCapicon.svg";
import mongoDBService from '../services/mongoDBService.jsx';

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

const CoordinatorManageStudentView = ({ onLogout, onViewChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const studentData = location.state?.student;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [semesterRecord, setSemesterRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [students, setStudents] = useState([]);

  const studentId = studentData?.studentId || studentData?._id || studentData?.id || '';
  const currentSemester = studentData?.currentSemester || studentData?.semester || '';
  const displayName = studentData?.name
    || studentData?.studentName
    || `${studentData?.firstName || ''} ${studentData?.lastName || ''}`.trim()
    || studentData?.fullName
    || '';

  const student = {
    ...emptyStudent,
    ...studentData,
    name: displayName || studentData?.name || '',
    regNo: studentData?.regNo || studentData?.registerNumber || '',
    year: studentData?.currentYear || studentData?.year || '',
    semester: currentSemester,
    programme: studentData?.programme || studentData?.branch || '',
    examDate: studentData?.examDate || '',
    currentSgpa: studentData?.currentSgpa || studentData?.sgpa || '',
    overallCgpa: studentData?.overallCgpa || studentData?.cgpa || '',
    published: studentData?.published || '',
    attempted: studentData?.attempted || '',
    cleared: studentData?.cleared || '',
    pending: studentData?.pending || ''
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

  // Load semester record on component mount
  useEffect(() => {
    const loadSemesterData = async () => {
      try {
        if (!currentSemester) {
          setIsLoading(false);
          return;
        }

        console.log('📚 Loading semester data for:', {
          studentId,
          regNo: student.regNo,
          semester: currentSemester
        });

        let response = null;

        // Skip DB lookups entirely if we know this is unsaved preview data
        if (studentData?.isPreview || (studentData?.subjects && !/^[0-9a-f]{24}$/i.test(studentId))) {
          console.log('✅ Unsaved extracted data detected. Loading preview data.', {
            isPreview: studentData?.isPreview,
            subjectsCount: studentData?.subjects?.length || 0,
            studentId,
            regNo: studentData?.regNo
          });
          setSemesterRecord(studentData);
          setStudents(Array.isArray(studentData.subjects) ? studentData.subjects : []);
          console.log('✅ Preview data loaded:', Array.isArray(studentData.subjects) ? studentData.subjects.length : 0, 'subjects');
          setIsLoading(false);
          return;
        }

        // Only try ObjectId lookup if studentId looks like a valid MongoDB ObjectId (24 hex chars)
        const isValidObjectId = /^[0-9a-f]{24}$/i.test(studentId);
        
        if (studentId && isValidObjectId) {
          try {
            response = await mongoDBService.getStudentMarksheetByStudentId(studentId, currentSemester);
            console.log('✅ Student marksheet loaded:', response);
          } catch (marksheetError) {
            console.warn('⚠️ StudentMarksheet lookup failed, falling back to semester-records:', marksheetError.message);
          }
        } else if (studentId) {
          console.log('⚠️ Invalid ObjectId format:', studentId, '- skipping ObjectId lookup, using regNo fallback');
        }

        if (!response && student.regNo) {
          try {
            response = await mongoDBService.getSemesterRecordByStudent(student.regNo, currentSemester);
            console.log('✅ Semester record loaded:', response);
          } catch (legacyError) {
            console.warn('⚠️ Legacy semester-record lookup failed:', legacyError.message);
          }
        }

        if (response?.marksheet) {
          setSemesterRecord(response.marksheet);
          setStudents(Array.isArray(response.marksheet.subjects) ? response.marksheet.subjects : []);
        } else if (response?.students && Array.isArray(response.students)) {
          setSemesterRecord(response);
          setStudents(response.students);
        } else if (studentData?.subjects) {
          // This allows viewing extracted PDF data before it is 'Submitted' to DB
          console.log('✅ Using extracted PDF data from navigation state');
          setSemesterRecord(studentData);
          setStudents(studentData.subjects);
        } else {
          setSemesterRecord(null);
          setStudents([]);
        }
      } catch (error) {
        console.error('❌ Error loading data:', error);
        
        // --- BULLETPROOF FALLBACK ---
        if (studentData?.subjects) {
          console.log('✅ 404/Error encountered: Falling back to state-provided subjects.');
          setSemesterRecord(studentData);
          setStudents(studentData.subjects);
        } else {
          setSemesterRecord(null);
          setStudents([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadSemesterData();
  }, [studentData]);

  const handleViewChange = (view) => {
    console.log('🔹 CoordinatorManageStudentView handleViewChange called with view:', view);
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
    navigate(-1);
  };

  const handlePreviewMarksheet = () => {
    console.log('Preview marksheet');
  };

  const handleDownloadMarksheet = () => {
    console.log('Download marksheet');
  };

  return (
    <div className={styles['view-page-container']}>
      <Navbar onLogout={onLogout} onToggleSidebar={handleToggleSidebar} />
      <Sidebar
        isOpen={isSidebarOpen}
        onLogout={onLogout}
        currentView={'manage-students'}
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
          {/* Left Column - Student Card */}
          <div className={styles['view-left-column']}>
            <div className={styles['view-student-card']}>
              <div className={styles['view-student-header']}>
                <img src={Adminicons} alt="Graduation Cap" className={styles['view-cap-icon']} />
              </div>

              <div className={styles['view-student-details']}>
                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Name</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.name || '--'}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Reg No</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.regNo || '--'}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>D O B</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.dob || '--'}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Year</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.year || '--'}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Semester</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.semester || '--'}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Programme</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.programme || '--'}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Exam MM/YY</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.examDate || '--'}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Current SGPA</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.currentSgpa || '--'}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Overall CGPA</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.overallCgpa || '--'}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Published</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.published || '--'}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Attempted</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.attempted || '--'}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Cleared</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.cleared || '--'}</span>
                </div>

                <div className={styles['view-detail-row']}>
                  <span className={styles['view-detail-label']}>Pending</span>
                  <span className={styles['view-detail-colon']}>:</span>
                  <span className={styles['view-detail-value']}>{student.pending || '--'}</span>
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

            {/* Semester Students Table Section */}
            {isLoading ? (
              <div className={styles['view-info-note']}>
                <p style={{ textAlign: 'center', color: '#666' }}>Loading semester data...</p>
              </div>
            ) : students.length > 0 ? (
              <div className={styles['view-info-note']} style={{ marginTop: '20px' }}>
                <h3 className={styles['view-note-title']}>Semester {student.semester} - Subjects ({students.length})</h3>
                <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                  {console.log('🎯 [TABLE RENDER DEBUG] Rendering table with', students.length, 'subjects')}
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Course Code</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Course Name</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Credits</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Grade</th>
                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>{student.courseCode || '-'}</td>
                          <td style={{ padding: '12px' }}>{student.courseName || student.subjectName || '-'}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{student.credits ?? '-'}</td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>{student.grade || '-'}</td>
                          <td style={{ padding: '12px', textAlign: 'center', color: (student.result === 'F' || student.grade === 'U' || student.grade === 'RA') ? '#C53030' : '#4EA24E', fontWeight: '500' }}>
                            {student.result || ((student.grade === 'U' || student.grade === 'RA') ? 'F' : 'P')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {/* Information Note Section */}
            <div className={styles['view-info-note']}>
              <h3 className={styles['view-note-title']}>Student Information</h3>
              <div className={styles['view-note-content']}>
                <p>
                  Use the <strong>Preview Marksheet</strong> and <strong>Download Marksheet</strong> options above to view and manage this student's semester marksheets.
                </p>
                <p>
                  The marksheet data will be automatically synced with the student's profile and academic records in the system.
                </p>
                <p>
                  For any discrepancies or issues with marksheet data, please verify the information with the academic department before making any changes.
                </p>
              </div>
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
      
      {/* Export Popups removed (no longer used) */}
    </div>
  );
};

export default CoordinatorManageStudentView;