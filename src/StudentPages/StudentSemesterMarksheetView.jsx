import React, { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';
import styles from './StudentSemesterMarksheetView.module.css'; // Reuse CSS
import Adminicons from '../assets/BlueAdminicon.png';
import { CertificateDownloadProgressAlert } from '../components/alerts';
import mongoDBService from '../services/mongoDBService.jsx';
import { API_BASE_URL } from '../utils/apiConfig';

const GRADE_POINTS = {
    'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6,
    'C': 5, 'U': 0, 'RA': 0, 'AB': 0, 'SA': 0, 'W': 0,
};

function StudentSemesterMarksheetView({ onLogout, onViewChange }) {
    const location = useLocation();
    const navigate = useNavigate();
    const loadStartedAtRef = useRef(Date.now());
    const MIN_LOADING_DURATION_MS = 900;
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [studentData, setStudentData] = useState(null);
    const [extractedData, setExtractedData] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(18);
    const [error, setError] = useState('');

    const semester = location.state?.semester;

    const handleToggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleViewChange = (view) => {
        if (onViewChange && typeof onViewChange === 'function') {
            onViewChange(view);
        }
        setIsSidebarOpen(false);
    };

    const handleBack = () => {
        const returnPath = location.state?.returnPath;
        if (returnPath) {
            navigate(returnPath, { state: { fromMarksheetView: true } });
            return;
        }
        navigate('/profile', { state: { fromMarksheetView: true } });
    };

    const finishLoading = useCallback(async () => {
        const elapsed = Date.now() - loadStartedAtRef.current;
        if (elapsed < MIN_LOADING_DURATION_MS) {
            await new Promise((resolve) => setTimeout(resolve, MIN_LOADING_DURATION_MS - elapsed));
        }
        setIsInitialLoading(false);
    }, []);

    const loadSemesterData = useCallback(async () => {
        try {
            loadStartedAtRef.current = Date.now();
            setIsInitialLoading(true);
            const cached = JSON.parse(localStorage.getItem('studentData') || 'null');
            if (cached) {
                setStudentData(cached);
            }

            const regNo = cached?.regNo || cached?.registerNumber || '';
            if (!regNo) {
                setError('Registration number not found.');
                await finishLoading();
                return;
            }

            if (!semester) {
                setError('No semester specified.');
                await finishLoading();
                return;
            }

            const response = await mongoDBService.getSemesterMarksheetByRegNo(regNo, semester);
            if (response && response.success && response.records && response.records.length > 0) {
                const record = response.records[0];
                setExtractedData(record);
                setSubjects(record.subjects || []);
            } else {
                setError(`No records found for Semester ${semester}.`);
            }
        } catch (err) {
            console.error('Error loading semester data:', err);
            setError('Failed to fetch semester data from database.');
        } finally {
            await finishLoading();
        }
    }, [semester, finishLoading]);

    useEffect(() => {
        loadSemesterData();
    }, [location.key, loadSemesterData]);

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

    const generatePDF = (action = 'download') => {
        if (!studentData || !extractedData) return;

        const doc = new jsPDF();
        
        // Add border
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
        
        // College Header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text("K.S.R. COLLEGE OF ENGINEERING", 105, 18, { align: "center" });
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("(Autonomous, Affiliated to Anna University Chennai)", 105, 23, { align: "center" });
        doc.text("Tiruchengode - 637 215, Tamil Nadu", 105, 27, { align: "center" });
        
        doc.setLineWidth(0.3);
        doc.line(10, 31, 200, 31);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text("OFFICE OF THE CONTROLLER OF EXAMINATIONS", 105, 38, { align: "center" });
        doc.text(`SEMESTER MARKSHEET REPORT - SEMESTER ${extractedData.semester || semester || ''}`, 105, 44, { align: "center" });
        
        doc.line(10, 48, 200, 48);
        
        // Student Info
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        
        doc.text("Register Number:", 15, 56);
        doc.text("Student Name:", 15, 62);
        doc.text("Programme/Branch:", 15, 68);
        doc.text("Academic Year:", 15, 74);
        
        doc.text("Exam Month/Year:", 120, 56);
        doc.text("Semester:", 120, 62);
        doc.text("SGPA:", 120, 68);
        doc.text("CGPA:", 120, 74);
        
        doc.setFont("helvetica", "normal");
        doc.text(String(studentData.regNo || studentData.registerNumber || '--'), 50, 56);
        doc.text(String(extractedData?.studentName || studentData.name || (studentData.firstName ? `${studentData.firstName} ${studentData.lastName || ''}`.trim() : '') || 'Student'), 50, 62);
        doc.text(String(studentData.branch || studentData.department || '--'), 50, 68);
        doc.text(String(extractedData.academicYear || '--'), 50, 74);
        
        doc.text(String(extractedData.examMonthYear || '--'), 155, 56);
        doc.text(String(extractedData.semester || semester || '--'), 155, 62);
        doc.text(String(extractedData.sgpa || '0.0'), 155, 68);
        doc.text(String(extractedData.cgpa || '0.0'), 155, 74);
        
        doc.line(10, 80, 200, 80);
        
        // Subjects Table
        const tableBody = subjects.map(s => {
            const rawResult = (s.result || s.status || '').toString().trim().toUpperCase();
            const resultValue = rawResult === 'PASS' || rawResult === 'CLEARED' ? 'PASS' : rawResult === 'FAIL' || rawResult === 'ARREAR' ? 'RA' : rawResult;
            return [
                s.courseCode || s.subjectCode || '--',
                s.courseName || s.subjectName || '--',
                String(s.credits || '0'),
                s.grade || '--',
                resultValue
            ];
        });
        
        autoTable(doc, {
            startY: 85,
            head: [['COURSE CODE', 'COURSE NAME', 'CREDITS', 'GRADE', 'RESULT']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [25, 122, 255], textColor: [255, 255, 255], fontStyle: 'bold' }, // Student blue header
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 90 },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 20, halign: 'center' },
                4: { cellWidth: 25, halign: 'center' }
            }
        });
        
        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.text(`Generated on ${new Date().toLocaleDateString('en-GB')} via Placement Portal`, 15, finalY);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("Controller of Examinations", 150, finalY + 15);
        
        if (action === 'preview') {
            const pdfBlob = doc.output('blob');
            const blobUrl = URL.createObjectURL(pdfBlob);
            window.open(blobUrl, '_blank');
        } else {
            doc.save(`Marksheet_${studentData.regNo || 'Student'}_Sem${extractedData.semester || semester}.pdf`);
        }
    };

    const attemptedSubjects = subjects.length;
    const clearedSubjects = subjects.filter(c => c.grade !== 'U' && c.grade !== 'RA' && c.grade !== 'AB').length;
    const pendingSubjects = attemptedSubjects - clearedSubjects;

    return (
        <div className={styles.container}>
            <CertificateDownloadProgressAlert
                isOpen={isInitialLoading}
                progress={loadingProgress}
                fileLabel="student marksheet"
                title="Loading..."
                color="#197AFF"
                progressColor="#197AFF"
                messages={{
                    initial: 'Fetching student semester marksheet...',
                    mid: 'Loading latest marksheet record...',
                    final: 'Preparing page...'
                }}
            />
            <Navbar onToggleSidebar={handleToggleSidebar} />
            <div className={styles.main}>
                <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView="profile" onViewChange={handleViewChange} studentData={studentData} />
                
                <div className={styles.dashboardArea}>
                    <div className={styles.contentWrapper} style={{ pointerEvents: isInitialLoading ? 'none' : 'auto' }}>
                        {/* Profile Info Left Side */}
                        <div className={styles.profileCard}>
                            <div className={styles.profileIconContainer}>
                                <img src={studentData?.profilePicURL || Adminicons} alt="Profile" className={styles.profileIcon} />
                            </div>
                            <div className={styles.profileInfo}>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Name</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{extractedData?.studentName || studentData?.name || (studentData?.firstName ? `${studentData.firstName} ${studentData.lastName || ''}`.trim() : '') || 'Student'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Reg No</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{studentData?.regNo || '--'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Academic Yr</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{extractedData?.academicYear || '--'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Semester</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{extractedData?.semester || semester || '--'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Exam Date</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{extractedData?.examMonthYear || '--'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>SGPA</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{extractedData?.sgpa || '0.0'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>CGPA</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{extractedData?.cgpa || '0.0'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Attempted</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{attemptedSubjects}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Cleared</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{clearedSubjects}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Pending</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{pendingSubjects}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions and Table Right Side */}
                        <div className={styles.uploadSection}>
                            {error ? (
                                <div style={{ padding: '24px', textAlign: 'center', color: '#D23B42', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
                                    <h3>{error}</h3>
                                    <button type="button" className={styles.backButton} style={{ marginTop: '16px' }} onClick={handleBack}>Back to Profile</button>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div className={styles.uploadDropZone} style={{ cursor: 'pointer', padding: '16px' }} onClick={() => generatePDF('preview')}>
                                            <div className={styles.uploadIconLarge} style={{ fontSize: '32px' }}>👁️</div>
                                            <h3 className={styles.uploadHeading} style={{ fontSize: '16px', margin: '8px 0 4px' }}>Preview PDF</h3>
                                            <p style={{ fontSize: '12px', color: '#888', margin: 0, textAlign: 'center' }}>Click to view the PDF marksheet report in a new tab.</p>
                                        </div>
                                        <div className={styles.uploadDropZone} style={{ cursor: 'pointer', padding: '16px' }} onClick={() => generatePDF('download')}>
                                            <div className={styles.uploadIconLarge} style={{ fontSize: '32px' }}>📥</div>
                                            <h3 className={styles.uploadHeading} style={{ fontSize: '16px', margin: '8px 0 4px' }}>Download PDF</h3>
                                            <p style={{ fontSize: '12px', color: '#888', margin: 0, textAlign: 'center' }}>Click to download the PDF marksheet report to your device.</p>
                                        </div>
                                    </div>

                                    <div className={styles.tableOuter} style={{ padding: '2rem', paddingTop: '0', marginTop: '5px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #197AFF' }}>
                                            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#333', margin: 0 }}>
                                                Semester {extractedData?.semester || semester || ''} - Subjects ({attemptedSubjects})
                                            </h2>
                                            <button 
                                                type="button" 
                                                onClick={handleBack}
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
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{
                                                width: '100%',
                                                borderCollapse: 'collapse',
                                                fontSize: '14px',
                                                fontFamily: 'Poppins, sans-serif'
                                            }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#197AFF', borderBottom: '2px solid #1565D8' }}>
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
                                                    {subjects.length > 0 ? (
                                                        subjects.map((course, index) => {
                                                            const rawResult = (course.result || course.status || '').toString().trim().toUpperCase();
                                                            const resultValue = rawResult === 'PASS' || rawResult === 'CLEARED' ? 'P' : rawResult === 'FAIL' || rawResult === 'ARREAR' ? 'F' : rawResult;
                                                            const isFail = resultValue === 'F' || (course.grade === 'U' || course.grade === 'RA');
                                                            const semesterValue = course.semester || course.sem || semester || '--';

                                                            return (
                                                                <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                                                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>{index + 1}</td>
                                                                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>{semesterValue}</td>
                                                                    <td style={{ padding: '12px 8px', textAlign: 'left' }}>{course.courseCode || course.subjectCode || '--'}</td>
                                                                    <td style={{ padding: '12px 8px', textAlign: 'left' }}>{course.courseName || course.subjectName || '--'}</td>
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
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
                                                                No subjects found for this semester.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default StudentSemesterMarksheetView;
