import React, { useState, useRef, useEffect, useCallback } from "react";
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';
import styles from './SemesterMarksheetUpload.module.css';
import Adminicons from '../assets/BlueAdminicon.png';
import fastDataService from '../services/fastDataService.jsx';
import { API_BASE_URL } from '../utils/apiConfig';
import UploadIcon from '../assets/Uploadblueiocn.svg';
import StuBinIcon from '../assets/StuBinicon.svg';
import StuEyeIcon from '../assets/purpleeyeiconn.svg';

const MdUpload = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path>
    </svg>
);

// Grade to grade-point mapping (K.S.R. College grading system)
const GRADE_POINTS = {
    'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6,
    'C': 5, 'U': 0, 'RA': 0, 'AB': 0, 'SA': 0, 'W': 0,
};

function SemesterMarksheetUpload({ onLogout, onViewChange }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [studentData, setStudentData] = useState(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showSizeExceededPopup, setShowSizeExceededPopup] = useState(false);
    const [fileSizeErrorKB, setFileSizeErrorKB] = useState('');
    const [showAnalysingPopup, setShowAnalysingPopup] = useState(false);
    const [analyseProgress, setAnalyseProgress] = useState(0);
    const [showPreviewingPopup, setShowPreviewingPopup] = useState(false);
    const [previewProgress, setPreviewProgress] = useState(0);
    const [showUploadSuccessPopup, setShowUploadSuccessPopup] = useState(false);
    const [showSubmittedPopup, setShowSubmittedPopup] = useState(false);
    const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
    const [courses, setCourses] = useState([]);
    const [extractedData, setExtractedData] = useState(null);
    const [documentType, setDocumentType] = useState('');
    const [ocrError, setOcrError] = useState('');
    const [showCalculatedSGPA, setShowCalculatedSGPA] = useState(false);
    const [creditValidationError, setCreditValidationError] = useState(false);
    const fileInputRef = useRef(null);

    // Check if this is a temporary result sheet (no SGPA/CGPA from document)
    const isResultSheet = documentType === 'result_sheet';

    // Calculate SGPA from courses with credits
    const calculatedSGPA = React.useMemo(() => {
        if (!courses || courses.length === 0) return null;
        const validCourses = courses.filter(c => {
            const grade = (c.grade || '').toUpperCase();
            const credit = parseFloat(c.credit);
            return grade && grade in GRADE_POINTS && credit > 0 && (c.result === 'P' || c.result === 'PASS');
        });
        if (validCourses.length === 0) return null;
        let totalCredits = 0;
        let totalGP = 0;
        for (const c of validCourses) {
            const credit = parseFloat(c.credit);
            totalCredits += credit;
            totalGP += credit * (GRADE_POINTS[(c.grade || '').toUpperCase()] || 0);
        }
        if (totalCredits === 0) return null;
        return (totalGP / totalCredits).toFixed(3);
    }, [courses]);

    const handleCreditChange = (sno, value) => {
        // Allow only specific credit values: 0, 5, 6, 7, 8, 9, 10
        const validCredits = [0, 5, 6, 7, 8, 9, 10];
        const num = value === '' ? '' : parseInt(value, 10);
        
        if (value !== '') {
            if (isNaN(num)) return;
            if (!validCredits.includes(num)) {
                setCreditValidationError(true);
                setTimeout(() => setCreditValidationError(false), 4000);
                return;
            }
        }
        
        setCourses(prev =>
            prev.map(c => c.sno === sno ? { ...c, credit: value === '' ? '' : num } : c)
        );
    };

    const loadStudentData = useCallback(async () => {
        try {
            const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
            if (!storedStudentData || !storedStudentData._id) return;
            
            const studentId = storedStudentData._id || storedStudentData.id;
            const completeData = await fastDataService.getCompleteStudentData(studentId);
            
            if (completeData && completeData.student) {
                setStudentData(completeData.student);
            } else {
                setStudentData(storedStudentData);
            }
        } catch (error) {
            const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
            if (storedStudentData) setStudentData(storedStudentData);
        } finally {
            setIsInitialLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStudentData();
    }, [loadStudentData]);

    const handleViewChange = (view) => {
        onViewChange(view);
        setIsSidebarOpen(false);
    };

    // Format semester number as Year-Sem (e.g. 3 → "II-3", 1 → "I-1")
    const formatYearSem = (sem) => {
        const s = parseInt(sem);
        if (!s || s < 1 || s > 8) return sem || '-';
        const yearRoman = ['I', 'I', 'II', 'II', 'III', 'III', 'IV', 'IV'];
        return `${yearRoman[s - 1]}-${s}`;
    };

    const [analyseStatus, setAnalyseStatus] = useState('');

    const processFileWithOCR = useCallback(async (file, forceVision = false) => {
        setUploadedFile(file);
        setOcrError('');
        setShowAnalysingPopup(true);
        setAnalyseProgress(0);
        setAnalyseStatus('Extracting text from PDF...');

        // Slow, smooth progress — vision models take 1-3 minutes
        const progressInterval = setInterval(() => {
            setAnalyseProgress(prev => {
                if (prev >= 95) return 95;
                // Very slow curve: ~60% at 30s, ~80% at 60s, ~90% at 90s
                const remaining = 95 - prev;
                const increment = Math.max(0.15, remaining * 0.018 + Math.random() * 0.3);
                return Math.min(95, prev + increment);
            });
        }, 500);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const url = forceVision
                ? `${API_BASE_URL}/marksheet/parse?forceVision=true`
                : `${API_BASE_URL}/marksheet/parse`;

            const token = localStorage.getItem('token');
            const response = await fetch(url, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                body: formData,
            });

            const data = await response.json();

            clearInterval(progressInterval);
            setAnalyseProgress(100);
            setAnalyseStatus('Done!');

            if (data.success) {
                const mergedInfo = {
                    ...(data.student_info || {}),
                    ...(data.gpa_info || {}),
                };
                setExtractedData(mergedInfo);
                setDocumentType(data.document_type || 'unknown');
                if (data.subjects && data.subjects.length > 0) {
                    setCourses(data.subjects);
                }
                setTimeout(() => {
                    setShowAnalysingPopup(false);
                    setShowUploadSuccessPopup(true);
                    setAnalyseProgress(0);
                    setAnalyseStatus('');
                }, 600);
            } else {
                setOcrError(data.error || 'Failed to extract data from the marksheet.');
                setTimeout(() => {
                    setShowAnalysingPopup(false);
                    setAnalyseProgress(0);
                    setAnalyseStatus('');
                }, 400);
            }
        } catch (err) {
            clearInterval(progressInterval);
            console.error('OCR extraction error:', err);
            setOcrError('Could not connect to OCR service. Please ensure it is running.');
            setTimeout(() => {
                setShowAnalysingPopup(false);
                setAnalyseProgress(0);
                setAnalyseStatus('');
            }, 400);
        }
    }, []);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
        
        if (file && acceptedTypes.includes(file.type)) {
            const maxSize = 5 * 1024 * 1024; // 5MB
            const fileSizeKB = (file.size / 1024).toFixed(1);
            
            if (file.size > maxSize) {
                setFileSizeErrorKB(fileSizeKB);
                setShowSizeExceededPopup(true);
                return;
            }
            processFileWithOCR(file);
        } else {
            alert("Please upload a PDF or JPEG/JPG image file only.");
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/jpg'];
        
        if (file && acceptedTypes.includes(file.type)) {
            const maxSize = 5 * 1024 * 1024; // 5MB
            const fileSizeKB = (file.size / 1024).toFixed(1);
            
            if (file.size > maxSize) {
                setFileSizeErrorKB(fileSizeKB);
                setShowSizeExceededPopup(true);
                return;
            }
            processFileWithOCR(file);
        } else {
            alert("Please upload a PDF or JPEG/JPG image file only.");
        }
    };

    const handleDiscard = () => {
        setUploadedFile(null);
        setExtractedData(null);
        setDocumentType('');
        setCourses([]);
        setOcrError('');
        setShowCalculatedSGPA(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handlePreview = () => {
        if (!uploadedFile) return;
        
        // Show previewing popup
        setShowPreviewingPopup(true);
        setPreviewProgress(0);
        
        // Dynamic progress simulation - smoother like achievements.jsx
        let progressInterval = setInterval(() => {
            setPreviewProgress(prev => {
                if (prev >= 85) return prev;
                return prev + Math.random() * 8;
            });
        }, 100);
        
        // Simulate preview time then open file (PDF or Image)
        setTimeout(() => {
            clearInterval(progressInterval);
            setPreviewProgress(100);
            
            // Open file in new tab
            const url = URL.createObjectURL(uploadedFile);
            window.open(url, '_blank');
            
            // Close popup after short delay
            setTimeout(() => {
                setShowPreviewingPopup(false);
                setPreviewProgress(0);
            }, 300);
        }, 2500);
    };

    const handleSubmit = () => {
        if (!uploadedFile) {
            alert("Please upload a marksheet PDF first.");
            return;
        }
        // Show confirmation popup first
        setShowConfirmationPopup(true);
    };

    const handleConfirmSubmit = () => {
        // Close confirmation and show submitted popup
        setShowConfirmationPopup(false);
        setShowSubmittedPopup(true);
    };

    const handleCloseConfirmation = () => {
        setShowConfirmationPopup(false);
    };

    const handleCloseUploadSuccess = () => {
        setShowUploadSuccessPopup(false);
    };

    const handleCloseSubmitted = () => {
        setShowSubmittedPopup(false);
        // Redirect to StuProfile page
        onViewChange('profile');
    };

    const getResultColor = (result) => {
        return result === 'P' ? styles.passResult : styles.failResult;
    };

    if (isInitialLoading) {
        return (
            <div className={styles.container}>
                <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                <div className={styles.main}>
                    <Sidebar
                        isOpen={isSidebarOpen}
                        onLogout={onLogout}
                        currentView={'profile'}
                        onViewChange={handleViewChange}
                        studentData={studentData}
                    />
                    <div className={styles.dashboardArea}>
                        <div className={styles.initialLoaderOverlay}>
                            <div className={styles.initialLoaderCard}>
                                <div className={styles.loadingSpinner}></div>
                                <p>Loading...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className={styles.main}>
                <Sidebar
                    isOpen={isSidebarOpen}
                    onLogout={onLogout}
                    currentView={'profile'}
                    onViewChange={handleViewChange}
                    studentData={studentData}
                />
                <div className={styles.dashboardArea}>
                    <div className={styles.contentWrapper}>
                        {/* Left Side - Profile Card */}
                        <div className={styles.profileCard}>
                            <div className={styles.profileIconContainer}>
                                <img src={Adminicons} alt="Profile" className={styles.profileIcon} />
                            </div>
                            <div className={styles.profileInfo}>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Name</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{extractedData?.name || studentData?.name || 'Student'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Reg No</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{extractedData?.register_number || studentData?.regNo || '-'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>D O B</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{extractedData?.date_of_birth || studentData?.dob || '-'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Year</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{extractedData?.year || studentData?.currentYear || '-'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Semester</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{extractedData?.semester || studentData?.currentSemester || '-'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Programme</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{extractedData?.programme || studentData?.branch || '-'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Exam MM/YY</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{extractedData?.exam_month_year || '-'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Current SGPA</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>
                                        {isResultSheet
                                            ? (showCalculatedSGPA && calculatedSGPA ? calculatedSGPA : 'Enter credits')
                                            : (extractedData?.sgpa || studentData?.overallCGPA || '-')}
                                    </span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Overall CGPA</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{extractedData?.cgpa || studentData?.overallCGPA || '-'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Published</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{extractedData?.published_date || '-'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Attempted</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{extractedData?.credits_attempted || courses.length || '-'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Cleared</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{extractedData?.credits_earned || courses.filter(c => c.result === 'P').length || '-'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Pending</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{extractedData?.credits_pending || courses.filter(c => c.result === 'F').length || '-'}</span>
                                </div>
                                {documentType && (
                                    <div className={styles.infoRow}>
                                        <span className={styles.infoLabel}>Doc Type</span>
                                        <span className={styles.infoColon}>:</span>
                                        <span className={styles.infoValue}>
                                            {documentType === 'result_sheet' ? 'Result Sheet' : 
                                             documentType === 'original_marksheet' ? 'Original Marksheet' : 'Unknown'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Side - Upload Area */}
                        <div className={styles.uploadSection}>
                            {/* Upload Drop Zone */}
                            <div
                                className={`${styles.uploadDropZone} ${isDragging ? styles.dragging : ''}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {uploadedFile && (
                                    <div className={styles.uploadActions}>
                                        <button 
                                            type="button" 
                                            className={styles.actionIconBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDiscard();
                                            }}
                                        >
                                            <img src={StuBinIcon} alt="Clear" className={styles.actionIcon} />
                                            <span>Clear</span>
                                        </button>
                                        <button 
                                            type="button" 
                                            className={styles.actionIconBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handlePreview();
                                            }}
                                        >
                                            <img src={StuEyeIcon} alt="Preview" className={styles.actionIconPreview} />
                                            <span>Preview</span>
                                        </button>
                                    </div>
                                )}
                                {uploadedFile ? (
                                    <div className={styles.fileUploadedView}>
                                        {uploadedFile.type === 'application/pdf' ? (
                                            <svg className={styles.pdfIconLarge} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#D23B42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M14 2V8H20" stroke="#D23B42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M12 18V12" stroke="#D23B42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M9 15L12 12L15 15" stroke="#D23B42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        ) : (
                                            <svg className={styles.pdfIconLarge} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="#197AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M17 8L12 3L7 8" stroke="#197AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M12 3V15" stroke="#197AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        )}
                                        <span className={styles.uploadedFileName}>{uploadedFile.name}</span>
                                    </div>
                                ) : (
                                    <>
                                        <img src={UploadIcon} alt="Upload" className={styles.uploadIconLarge} />
                                        <h2 className={styles.uploadHeading}>Upload Your Marksheet (PDF or Image)</h2>
                                    </>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept=".pdf,.jpg,.jpeg,image/jpeg,image/jpg,application/pdf"
                                    className={styles.hiddenInput}
                                />
                                {uploadedFile && (
                                    <div className={styles.fileName}>
                                        Uploaded: {uploadedFile.name}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className={styles.actionButtonsRow}>
                                <button className={styles.discardTopBtn} onClick={handleDiscard}>Discard</button>
                                <button className={styles.submitBtn} onClick={handleSubmit}>Submit</button>
                            </div>

                            {ocrError && (
                                <div className={styles.ocrErrorMsg}>
                                    {ocrError}
                                    {uploadedFile && (
                                        <button
                                            className={styles.retryVisionBtn}
                                            onClick={() => processFileWithOCR(uploadedFile, true)}
                                        >
                                            Retry with AI Vision
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Credit Validation Error Banner */}
                            {creditValidationError && (
                                <div className={styles.creditErrorBanner}>
                                    <svg className={styles.creditErrorIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="12" cy="12" r="10" fill="#ef4444"/>
                                        <path d="M12 7V13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                        <circle cx="12" cy="16" r="1" fill="white"/>
                                    </svg>
                                    <span>Invalid credit value! Please enter only valid credit points: 0, 5, 6, 7, 8, 9, or 10.</span>
                                </div>
                            )}

                            {/* Retry with AI Vision when extraction looks weak (few/no courses) */}
                            {!ocrError && uploadedFile && courses.length === 0 && extractedData && (
                                <div className={styles.ocrErrorMsg} style={{ background: '#fff7ed', borderColor: '#f59e0b' }}>
                                    No subjects were detected. This may be a scanned or photo document.
                                    <button
                                        className={styles.retryVisionBtn}
                                        onClick={() => processFileWithOCR(uploadedFile, true)}
                                    >
                                        Retry with AI Vision
                                    </button>
                                </div>
                            )}

                            {/* Course Table */}
                            <div className={styles.tableOuter}>
                                {/* Desktop: Separate header and body tables */}
                                <table className={styles.courseTableHeader}>
                                    <thead>
                                        <tr>
                                            <th>S.NO</th>
                                            <th>Year-Sem</th>
                                            <th>Course Code</th>
                                            <th>Course Name</th>
                                            <th>Grade</th>
                                            <th>Credits</th>
                                            <th>Result</th>
                                        </tr>
                                    </thead>
                                </table>
                                <div className={styles.tableScroll}>
                                    <table className={styles.courseTableBody}>
                                        <tbody>
                                            {courses.map((course) => (
                                                <tr key={course.sno}>
                                                    <td>{course.sno}</td>
                                                    <td>{formatYearSem(course.semester)}</td>
                                                    <td>{course.courseCode}</td>
                                                    <td>{course.courseName}</td>
                                                    <td>{course.grade}</td>
                                                    <td>
                                                        {isResultSheet ? (
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="10"
                                                                value={course.credit !== undefined && course.credit !== '' ? course.credit : ''}
                                                                onChange={(e) => handleCreditChange(course.sno, e.target.value)}
                                                                className={styles.creditInput}
                                                                placeholder="-"
                                                            />
                                                        ) : (
                                                            course.credit === 0 || course.credit ? course.credit : '-'
                                                        )}
                                                    </td>
                                                    <td className={getResultColor(course.result)}>{course.result}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {/* Mobile: Single unified table for perfect alignment */}
                                <table className={styles.courseTableMobile}>
                                    <thead>
                                        <tr>
                                            <th>S.NO</th>
                                            <th>Year-Sem</th>
                                            <th>Course Code</th>
                                            <th>Course Name</th>
                                            <th>Grade</th>
                                            <th>Credits</th>
                                            <th>Result</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {courses.map((course) => (
                                            <tr key={course.sno}>
                                                <td>{course.sno}</td>
                                                <td>{formatYearSem(course.semester)}</td>
                                                <td>{course.courseCode}</td>
                                                <td>{course.courseName}</td>
                                                <td>{course.grade}</td>
                                                <td>
                                                    {isResultSheet ? (
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="10"
                                                            value={course.credit !== undefined && course.credit !== '' ? course.credit : ''}
                                                            onChange={(e) => handleCreditChange(course.sno, e.target.value)}
                                                            className={styles.creditInput}
                                                            placeholder="-"
                                                        />
                                                    ) : (
                                                        course.credit === 0 || course.credit ? course.credit : '-'
                                                    )}
                                                </td>
                                                <td className={getResultColor(course.result)}>{course.result}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Action Buttons */}
                            <div className={styles.bottomActionButtons}>
                                {isResultSheet && (
                                    <button 
                                        className={styles.calculateSgpaBtn} 
                                        onClick={() => setShowCalculatedSGPA(true)}
                                        disabled={!calculatedSGPA}
                                    >
                                        Calculate SGPA
                                    </button>
                                )}
                                <button className={styles.discardTopBtn} onClick={handleDiscard}>Discard</button>
                                <button className={styles.submitBtn} onClick={handleSubmit}>Submit</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PDF Size Exceeded Popup */}
            {showSizeExceededPopup && (
                <div className={styles['Semester-popup-overlay']}>
                    <div className={styles['Semester-popup-container']}>
                        <div className={styles['Semester-popup-header']}>
                            Size Exceeded !
                        </div>
                        <div className={styles['Semester-popup-body']}>
                            <div className={styles['Semester-status-icon']}>
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" fill="#197AFF"/>
                                    <path d="M14 2V8H20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <text x="12" y="18" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">PDF</text>
                                </svg>
                            </div>
                            <h2 className={styles['Semester-status-title']}>
                                File Size is Large !
                            </h2>
                            <p className={styles['Semester-status-text']}>
                                Please Upload a file under 5MB.
                            </p>
                        </div>
                        <div className={styles['Semester-popup-footer']}>
                            <button 
                                onClick={() => setShowSizeExceededPopup(false)} 
                                className={styles['Semester-popup-close-btn']}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Analysing Popup - For File Upload */}
            {showAnalysingPopup && (
                <div className={styles['Semester-popup-overlay']}>
                    <div className={styles['Semester-popup-container']}>
                        <div className={styles['Semester-popup-header']}>
                            Analysing
                        </div>
                        <div className={styles['Semester-popup-body']}>
                            <div className={styles['Semester-analysing-spinner-wrapper']}>
                                <svg className={styles['Semester-analysing-spinner-svg']} viewBox="0 0 52 52">
                                    <circle 
                                        className={styles['Semester-analysing-spinner-bg']} 
                                        cx="26" 
                                        cy="26" 
                                        r="20"
                                    />
                                    <circle 
                                        className={styles['Semester-analysing-spinner-progress']} 
                                        cx="26" 
                                        cy="26" 
                                        r="20"
                                        strokeDasharray={`${analyseProgress * 1.256} 125.6`}
                                        transform="rotate(-90 26 26)"
                                    />
                                </svg>
                            </div>
                            <h2 className={styles['Semester-analysing-percentage']}>
                                Analysing... {Math.round(analyseProgress)}%
                            </h2>
                            <p className={styles['Semester-analysing-message']}>
                                {analyseStatus}
                            </p>
                            {analyseProgress > 0 && analyseProgress < 100 && (
                                <p className={styles['Semester-analysing-wait']}>
                                    This may take 20–60 seconds
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Previewing Popup - For Preview Button */}
            {showPreviewingPopup && (
                <div className={styles['Semester-popup-overlay']}>
                    <div className={styles['Semester-popup-container']}>
                        <div className={styles['Semester-popup-header']}>
                            Previewing...
                        </div>
                        <div className={styles['Semester-popup-body']}>
                            <div className={styles['Semester-analysing-spinner-wrapper']}>
                                <svg className={styles['Semester-analysing-spinner-svg']} viewBox="0 0 80 80">
                                    <circle 
                                        className={styles['Semester-analysing-spinner-bg']} 
                                        cx="40" 
                                        cy="40" 
                                        r="36"
                                    />
                                    <circle 
                                        className={styles['Semester-analysing-spinner-progress']} 
                                        cx="40" 
                                        cy="40" 
                                        r="36"
                                        strokeDasharray="226.2"
                                        strokeDashoffset={226.2 - (226.2 * previewProgress / 100)}
                                    />
                                </svg>
                            </div>
                            <h2 className={styles['Semester-analysing-percentage']}>
                                Loaded {Math.round(previewProgress)}%
                            </h2>
                            <p className={styles['Semester-analysing-message']}>
                                The file is being<br/>loaded...
                            </p>
                            <p className={styles['Semester-analysing-wait']}>
                                Please wait...
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Success Popup */}
            {showUploadSuccessPopup && (
                <div className={styles['Semester-popup-overlay']}>
                    <div className={styles['Semester-popup-container']}>
                        <div className={styles['Semester-popup-header']}>
                            Uploaded !
                        </div>
                        <div className={styles['Semester-popup-body']}>
                            <svg className={styles['Semester-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                <circle className={styles['Semester-success-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
                                <path className={styles['Semester-success-icon--check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                            </svg>
                            <h2 className={styles['Semester-status-title']}>
                                Marksheet Uploaded ✓
                            </h2>
                            <p className={styles['Semester-status-text']}>
                                Your Marksheet have been Successfully Uploaded.
                            </p>
                        </div>
                        <div className={styles['Semester-popup-footer']}>
                            <button 
                                onClick={handleCloseUploadSuccess}
                                className={styles['Semester-popup-close-btn']}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Popup - Before Submit */}
            {showConfirmationPopup && (
                <div className={styles['Semester-popup-overlay']}>
                    <div className={styles['Semester-popup-container']}>
                        <div className={styles['Semester-popup-header']}>
                            Confirmation
                        </div>
                        <div className={styles['Semester-popup-body']}>
                            <div className={styles['Semester-status-icon']}>
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="10" fill="#E9DE48"/>
                                    <path d="M12 7V13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                                    <circle cx="12" cy="16" r="1" fill="white"/>
                                </svg>
                            </div>
                            <h2 className={styles['Semester-status-title']}>
                                Are you Sure ?
                            </h2>
                            <p className={styles['Semester-status-text']}>
                                Make sure to confirm you details in the Marksheet is Correct before submitting, because it can be uploaded once.
                            </p>
                        </div>
                        <div className={styles['Semester-popup-footer']}>
                            <button 
                                onClick={handleCloseConfirmation}
                                className={styles['Semester-popup-close-btn']}
                            >
                                Close
                            </button>
                            <button 
                                onClick={handleConfirmSubmit}
                                className={styles['Semester-popup-submit-btn']}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submitted Popup - For Submit Button */}
            {showSubmittedPopup && (
                <div className={styles['Semester-popup-overlay']}>
                    <div className={styles['Semester-popup-container']}>
                        <div className={styles['Semester-popup-header']}>
                            Submitted !
                        </div>
                        <div className={styles['Semester-popup-body']}>
                            <svg className={styles['Semester-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                <circle className={styles['Semester-success-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
                                <path className={styles['Semester-success-icon--check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                            </svg>
                            <h2 className={styles['Semester-status-title']}>
                                Marksheet Submitted ✓
                            </h2>
                            <p className={styles['Semester-status-text']}>
                                Your Marksheet have been Successfully Submitted.
                            </p>
                        </div>
                        <div className={styles['Semester-popup-footer']}>
                            <button 
                                onClick={handleCloseSubmitted}
                                className={styles['Semester-popup-close-btn']}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SemesterMarksheetUpload;
