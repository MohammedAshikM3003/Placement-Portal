import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useCoordinatorAuth from '../utils/useCoordinatorAuth.js';
import Navbar from '../components/Navbar/Conavbar.js';
import Sidebar from '../components/Sidebar/Cosidebar.js';
import Adminicon from '../assets/Adminicon.png';
import mongoDBService from '../services/mongoDBService.jsx';
import styles from './Coo_MS_SemesterDetail.module.css';

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

  const { 
    fileName = 'No file selected', 
    subjects = [], 
    selectedFile = null, 
    previewUrl = '', 
    fileType = 'application/pdf',
    extractedStudents = []
  } = location.state || {};
  const [resolvedPreviewUrl, setResolvedPreviewUrl] = useState(previewUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  const displayStudents = useMemo(function() {
    if (!extractedStudents || extractedStudents.length === 0) {
      return [];
    }
    console.log('[Coo_MS_SemesterDetail] Mapping extractedStudents to displayStudents:', extractedStudents.length, 'items');
    return extractedStudents.map(function(marksheet, index) {
      const display = {
        id: String(index + 1),
        registerNumber: marksheet.regNo || '',
        name: marksheet.studentName || '',
        year: '1',
        semester: marksheet.semester || '1',
        section: 'A',
        arrears: '0',
        overallArrears: '0',
        sgpa: '0.0',
        overallCgpa: '0.0',
        // CRITICAL: Attach subjects directly to each display student for fast lookup
        subjects: marksheet.subjects || []
      };
      console.log('[Coo_MS_SemesterDetail] Display student', index, ':', { regNo: display.registerNumber, name: display.name, subjectsCount: display.subjects.length });
      return display;
    });
  }, [extractedStudents]);

  useEffect(() => {
    console.log('📊 Semester Detail page loaded');
    console.log('📦 Location state:', location.state);
    console.log('👥 Display students:', displayStudents);
    console.log('📄 Extracted students count:', extractedStudents?.length || 0);
  }, [displayStudents, extractedStudents, location.state]);

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

  const handleBack = () => {
    navigate('/coo-manage-students-semester');
  };

  const handleViewStudent = (row) => {
    console.log('🔍 Eye icon clicked for student:', row);
    
    // CRITICAL: The subjects are now attached directly to row from displayStudents
    const subjects = row.subjects || [];
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
        },
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
      const coordinatorData = JSON.parse(localStorage.getItem('coordinatorData') || 'null');
      const uploadPayload = {
        fileName,
        fileType,
        totalStudents,
        allClearStudents,
        arrearStudents,
        uploadedBy: coordinatorData?.fullName || coordinatorData?.username || 'Coordinator',
        subjects: Array.isArray(subjects) ? subjects : [],
        records: displayStudents.map((student) => ({
          studentId: student.id,
          regNo: student.registerNumber,
          studentName: student.name,
          year: student.year,
          semester: student.semester,
          section: student.section,
          cleared: parseInt(student.semester, 10) - parseInt(student.arrears, 10),
          arrear: parseInt(student.arrears, 10),
          sgpa: student.sgpa,
          cgpa: student.overallCgpa,
          department: 'CSE',
          batch: ''
        }))
      };

      const response = await mongoDBService.saveSemesterRecords(uploadPayload);
      setSubmitMessage(`Saved ${response?.saved || 0} semester record(s) to MongoDB.`);
    } catch (error) {
      setSubmitError(error.message || 'Failed to save semester records');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar onToggleSidebar={() => {}} Adminicon={Adminicon} />
      <div className={styles['co-semester-layout']}>
        <Sidebar isOpen={false} onLogout={onLogout} currentView="manage-students" onViewChange={onViewChange} />

        <main className={styles['semester-content']}>
          <section className={styles['top-grid']}>
            <div className={styles['stats-group']}>
              <div className={styles['stat-card']}>
                <span className={styles['stat-title']}>Total Students</span>
                <span className={styles['stat-count']}>{totalStudents}</span>
              </div>
              <div className={styles['stat-card']}>
                <span className={styles['stat-title']}>All clear Students</span>
                <span className={styles['stat-count']}>{allClearStudents}</span>
              </div>
              <div className={styles['stat-card']}>
                <span className={styles['stat-title']}>Arrear Students</span>
                <span className={styles['stat-count']}>{arrearStudents}</span>
              </div>
            </div>

            <aside className={styles['upload-panel']}>
              <div className={styles['upload-icons']}>
                <button type="button" className={styles['icon-action']} aria-label="Remove uploaded file">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                </button>
                <button type="button" className={styles['icon-action']} aria-label="Preview uploaded file">
                  <EyeIcon />
                </button>
              </div>
              <div className={styles['upload-content']}>
                <div className={styles['upload-graphic']}>
                  <UploadIcon />
                </div>
                <div className={styles['upload-title']}>Upload Your PDF / Drop the PDF</div>
                <h1 className={styles['upload-file-name']}>{fileName}</h1>
                <div className={styles['upload-subtext']}>Confirmed semester file for review</div>
              </div>
            </aside>
          </section>

          <section className={styles['table-card']}>
            <div className={styles['section-header']}>
              <h2>Computer Science &amp; Engineering</h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className={styles['print-button']} onClick={handleSubmit} disabled={isSubmitting || !displayStudents.length}>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
                <button type="button" className={styles['print-button']} onClick={handleBack}>
                  Back
                </button>
              </div>
            </div>

            {(submitMessage || submitError) && (
              <div style={{ marginBottom: '16px', color: submitError ? '#c53030' : '#1f7a1f', fontWeight: 600 }}>
                {submitError || submitMessage}
              </div>
            )}

            <div className={styles['table-wrap']}>
              {displayStudents.length === 0 ? (
                <div style={{padding: '40px', textAlign: 'center', color: '#999'}}>
                  No students to display
                </div>
              ) : (
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
                      <th>View</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayStudents.map(function(student, index) {
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
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

export default CooSemesterDetail;
