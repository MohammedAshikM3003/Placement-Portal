import React, { useState, useRef, useEffect, useCallback } from "react";
import Navbar from '../components/Navbar/Navbar';
import Sidebar from '../components/Sidebar/Sidebar';
import styles from './SemesterMarksheetUpload.module.css';
import Adminicons from '../assets/BlueAdminicon.png';
import fastDataService from '../services/fastDataService.jsx';
import UploadIcon from '../assets/Uploadblueiocn.svg';
import StuBinIcon from '../assets/StuBinicon.svg';
import StuEyeIcon from '../assets/purpleeyeiconn.svg';

const MdUpload = () => (
    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path>
    </svg>
);

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
    const [courses, setCourses] = useState([
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
    ]);
    const fileInputRef = useRef(null);

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

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type === "application/pdf") {
            const maxSize = 500 * 1024; // 500KB
            const fileSizeKB = (file.size / 1024).toFixed(1);
            
            if (file.size > maxSize) {
                setFileSizeErrorKB(fileSizeKB);
                setShowSizeExceededPopup(true);
                return;
            }
            setUploadedFile(file);
            
            // Show analysing popup first
            setShowAnalysingPopup(true);
            setAnalyseProgress(0);
            
            // Simulate analysing progress
            let progressInterval = setInterval(() => {
                setAnalyseProgress(prev => {
                    if (prev >= 85) return prev;
                    return prev + Math.random() * 8;
                });
            }, 100);
            
            // After analysing completes, show uploaded success popup
            setTimeout(() => {
                clearInterval(progressInterval);
                setAnalyseProgress(100);
                
                setTimeout(() => {
                    setShowAnalysingPopup(false);
                    setShowUploadSuccessPopup(true);
                    setAnalyseProgress(0);
                }, 300);
            }, 2500);
        } else {
            alert("Please upload a PDF file only.");
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
        if (file && file.type === "application/pdf") {
            const maxSize = 500 * 1024; // 500KB
            const fileSizeKB = (file.size / 1024).toFixed(1);
            
            if (file.size > maxSize) {
                setFileSizeErrorKB(fileSizeKB);
                setShowSizeExceededPopup(true);
                return;
            }
            setUploadedFile(file);
        } else {
            alert("Please upload a PDF file only.");
        }
    };

    const handleDiscard = () => {
        setUploadedFile(null);
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
        
        // Simulate preview time then open PDF
        setTimeout(() => {
            clearInterval(progressInterval);
            setPreviewProgress(100);
            
            // Open PDF in new tab
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
                                    <span className={styles.infoValue}>{studentData?.name || 'Student'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Reg No</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{studentData?.regNo || '7315XXXXXXXX'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>D O B</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{studentData?.dob || '30-03-2006'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Year</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{studentData?.currentYear || 'III'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Semester</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{studentData?.currentSemester || 'V'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Programme</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{studentData?.branch || 'B.E CSE'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Exam MM/YY</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>DEC 2025</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Current SGPA</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{studentData?.overallCGPA || '7.127'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Overall CGPA</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{studentData?.overallCGPA || '7.916'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Published</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>10-01-2025</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Attempted</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>9</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>cleared</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>8</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Pending</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>1</span>
                                </div>
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
                                        <svg className={styles.pdfIconLarge} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#D23B42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M14 2V8H20" stroke="#D23B42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M12 18V12" stroke="#D23B42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <path d="M9 15L12 12L15 15" stroke="#D23B42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                        <span className={styles.uploadedFileName}>{uploadedFile.name}</span>
                                    </div>
                                ) : (
                                    <>
                                        <img src={UploadIcon} alt="Upload" className={styles.uploadIconLarge} />
                                        <h2 className={styles.uploadHeading}>Upload Your Marksheet PDF / Drop PDF</h2>
                                    </>
                                )}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept=".pdf"
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

                            {/* Course Table */}
                            <div className={styles.tableOuter}>
                                {/* Desktop: Separate header and body tables */}
                                <table className={styles.courseTableHeader}>
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
                                <div className={styles.tableScroll}>
                                    <table className={styles.courseTableBody}>
                                        <tbody>
                                            {courses.map((course) => (
                                                <tr key={course.sno}>
                                                    <td>{course.sno}</td>
                                                    <td>{course.semester}</td>
                                                    <td>{course.courseCode}</td>
                                                    <td>{course.courseName}</td>
                                                    <td>{course.grade}</td>
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
                                                <td className={getResultColor(course.result)}>{course.result}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Action Buttons */}
                            <div className={styles.bottomActionButtons}>
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
                                PDF Size is Large !
                            </h2>
                            <p className={styles['Semester-status-text']}>
                                Please Upload a PDF under 500kb.
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
                                        strokeDashoffset={226.2 - (226.2 * analyseProgress / 100)}
                                    />
                                </svg>
                            </div>
                            <h2 className={styles['Semester-analysing-percentage']}>
                                Analysed {Math.round(analyseProgress)}%
                            </h2>
                            <p className={styles['Semester-analysing-message']}>
                                The Marksheet have<br/>been Analysing..
                            </p>
                            <p className={styles['Semester-analysing-wait']}>
                                Please wait...
                            </p>
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
                                The pdf have been<br/>Loading...
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
