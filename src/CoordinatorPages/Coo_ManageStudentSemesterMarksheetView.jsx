import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import styles from './Coo_ManageStudentSemesterMarksheetView.module.css';
import Adminicon from '../assets/Adminicon.png';
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

function Coo_ManageStudentSemesterMarksheetView({ onLogout, onViewChange }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [studentData, setStudentData] = useState(location.state?.student || null);
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [showSizeExceededPopup, setShowSizeExceededPopup] = useState(false);
    const [fileSizeErrorKB, setFileSizeErrorKB] = useState('');
    const [showAnalysingPopup, setShowAnalysingPopup] = useState(false);
    const [analyseProgress, setAnalyseProgress] = useState(0);
    const [showPreviewingPopup, setShowPreviewingPopup] = useState(false);
    const [previewProgress, setPreviewProgress] = useState(0);
    const [extractedData, setExtractedData] = useState(null);
    const [showSubmitPopup, setShowSubmitPopup] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [ocrError, setOcrError] = useState('');
    const [creditError, setCreditError] = useState('');
    const [previewData, setPreviewData] = useState(null);
    const fileInputRef = useRef(null);

    const handleToggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleViewChange = (view) => {
        if (onViewChange && typeof onViewChange === 'function') {
            onViewChange(view);
        }
        setIsSidebarOpen(false);
    };

    const handleDiscard = () => {
        navigate(-1);
    };

    const handleFileSelect = (file) => {
        if (!file) return;

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            setFileSizeErrorKB((file.size / 1024).toFixed(1));
            setShowSizeExceededPopup(true);
            return;
        }

        if (file.type !== 'application/pdf') {
            alert('Please upload a PDF file');
            return;
        }

        setUploadedFile(file);
        setOcrError('');
        setCreditError('');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFileSelect(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files[0];
        handleFileSelect(file);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleDeleteFile = () => {
        setUploadedFile(null);
        setExtractedData(null);
        setOcrError('');
        setCreditError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handlePreview = () => {
        if (!uploadedFile) return;

        // Create blob URL for preview
        const blobUrl = URL.createObjectURL(uploadedFile);
        window.open(blobUrl, '_blank');
    };

    const handleSubmit = () => {
        setShowSubmitPopup(true);
    };

    const confirmSubmit = async () => {
        setShowSubmitPopup(false);
        // Add submit logic here
        setShowSuccessPopup(true);
    };

    // Calculate SGPA
    const calculateSGPA = useCallback(() => {
        if (!extractedData || !extractedData.courses) return null;

        let totalCredits = 0;
        let totalGradePoints = 0;

        extractedData.courses.forEach(course => {
            const credits = parseFloat(course.credits) || 0;
            const gradePoint = GRADE_POINTS[course.grade] || 0;
            totalCredits += credits;
            totalGradePoints += credits * gradePoint;
        });

        if (totalCredits === 0) return 0;
        return (totalGradePoints / totalCredits).toFixed(2);
    }, [extractedData]);

    if (isInitialLoading) {
        return (
            <div className={styles.container}>
                <Navbar Adminicon={Adminicon} onToggleSidebar={handleToggleSidebar} />
                <div className={styles.main}>
                    <Sidebar
                        isOpen={isSidebarOpen}
                        onLogout={onLogout}
                        currentView="manage-students"
                        onViewChange={handleViewChange}
                    />
                    <div className={styles.dashboardArea}>
                        <div className={styles.initialLoaderOverlay}>
                            <div className={styles.initialLoaderCard}>
                                <div className={styles.loadingSpinner}></div>
                                <p>Loading marksheet view...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Navbar Adminicon={Adminicon} onToggleSidebar={handleToggleSidebar} />
            <div className={styles.main}>
                <Sidebar
                    isOpen={isSidebarOpen}
                    onLogout={onLogout}
                    currentView="manage-students"
                    onViewChange={handleViewChange}
                />
                {isSidebarOpen && (
                    <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)} />
                )}
                <div className={styles.dashboardArea}>
                    <div className={styles.contentWrapper}>
                        {/* Left Side - Profile Card */}
                        <div className={styles.profileCard}>
                            <div className={styles.profileIconContainer}>
                                {studentData?.profilePicURL ? (
                                    <img
                                        src={studentData.profilePicURL}
                                        alt="Profile"
                                        className={styles.profileIcon}
                                    />
                                ) : (
                                    <img src={Adminicon} alt="Profile" className={styles.profileIcon} />
                                )}
                            </div>
                            <div className={styles.profileInfo}>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Name</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>
                                        {studentData?.firstName || ''} {studentData?.lastName || ''}
                                    </span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Reg No</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{studentData?.regNo || '--'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Year</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{studentData?.currentYear || '--'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Semester</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{studentData?.currentSemester || '--'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Branch</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{studentData?.branch || '--'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Section</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{studentData?.section || '--'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Upload Section */}
                        <div className={styles.uploadSection}>
                            {/* Upload Drop Zone */}
                            <div
                                className={`${styles.uploadDropZone} ${isDragging ? styles.dragging : ''}`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={handleUploadClick}
                            >
                                {uploadedFile ? (
                                    <div className={styles.fileUploadedView}>
                                        <div className={styles.uploadActions}>
                                            <button
                                                className={styles.actionIconBtn}
                                                onClick={(e) => { e.stopPropagation(); handleDeleteFile(); }}
                                            >
                                                <img src={StuBinIcon} alt="Delete" className={styles.actionIcon} />
                                                <span>Delete</span>
                                            </button>
                                            <button
                                                className={styles.actionIconBtn}
                                                onClick={(e) => { e.stopPropagation(); handlePreview(); }}
                                            >
                                                <img src={StuEyeIcon} alt="Preview" className={styles.actionIconPreview} />
                                                <span>Preview</span>
                                            </button>
                                        </div>
                                        <svg className={styles.pdfIconLarge} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#D73D3D"/>
                                            <path d="M14 2V8H20" fill="#B53138"/>
                                            <text x="12" y="16" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">PDF</text>
                                        </svg>
                                        <span className={styles.uploadedFileName}>{uploadedFile.name}</span>
                                    </div>
                                ) : (
                                    <>
                                        <img src={UploadIcon} alt="Upload" className={styles.uploadIconLarge} />
                                        <h3 className={styles.uploadHeading}>
                                            Drag & Drop or Click to Upload Marksheet
                                        </h3>
                                    </>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileInputChange}
                                    className={styles.hiddenInput}
                                />
                            </div>

                            {/* Course Table */}
                            {extractedData && extractedData.courses && (
                                <div className={styles.tableOuter}>
                                    <table className={styles.courseTableHeader}>
                                        <thead>
                                            <tr>
                                                <th>S.No</th>
                                                <th>Course Code</th>
                                                <th>Course Title</th>
                                                <th>Credits</th>
                                                <th>Grade</th>
                                                <th>Result</th>
                                            </tr>
                                        </thead>
                                    </table>
                                    <div className={styles.tableScroll}>
                                        <table className={styles.courseTableBody}>
                                            <tbody>
                                                {extractedData.courses.map((course, index) => (
                                                    <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td>{course.courseCode}</td>
                                                        <td>{course.courseTitle}</td>
                                                        <td>{course.credits}</td>
                                                        <td>{course.grade}</td>
                                                        <td className={course.grade === 'U' || course.grade === 'RA' ? styles.failResult : styles.passResult}>
                                                            {course.grade === 'U' || course.grade === 'RA' ? 'FAIL' : 'PASS'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* SGPA Display */}
                                    <div className={styles.cgpaInfo}>
                                        <div className={styles.cgpaItem}>
                                            <span className={styles.cgpaLabel}>Calculated SGPA: </span>
                                            <span className={styles.cgpaValue}>{calculateSGPA()}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bottom Action Buttons */}
                            <div className={styles.bottomActionButtons}>
                                <button
                                    type="button"
                                    className={styles.discardTopBtn}
                                    onClick={handleDiscard}
                                >
                                    Discard
                                </button>
                                {extractedData && (
                                    <button
                                        type="button"
                                        className={styles.submitBtn}
                                        onClick={handleSubmit}
                                    >
                                        Submit
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Size Exceeded Popup */}
            {showSizeExceededPopup && (
                <div className={styles['Semester-popup-overlay']} onClick={() => setShowSizeExceededPopup(false)}>
                    <div className={styles['Semester-popup-container']} onClick={e => e.stopPropagation()}>
                        <div className={styles['Semester-popup-header']}>File Too Large!</div>
                        <div className={styles['Semester-popup-body']}>
                            <div className={styles['Semester-status-icon']}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#D73D3D" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="15" y1="9" x2="9" y2="15"/>
                                    <line x1="9" y1="9" x2="15" y2="15"/>
                                </svg>
                            </div>
                            <h2 className={styles['Semester-status-title']}>File Size Exceeded</h2>
                            <p className={styles['Semester-status-text']}>
                                Maximum allowed: 5MB<br/>
                                Your file: {fileSizeErrorKB}KB
                            </p>
                        </div>
                        <div className={styles['Semester-popup-footer']}>
                            <button
                                className={styles['Semester-popup-close-btn']}
                                onClick={() => setShowSizeExceededPopup(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Popup */}
            {showSuccessPopup && (
                <div className={styles['Semester-popup-overlay']} onClick={() => setShowSuccessPopup(false)}>
                    <div className={styles['Semester-popup-container']} onClick={e => e.stopPropagation()}>
                        <div className={styles['Semester-popup-header']}>Success!</div>
                        <div className={styles['Semester-popup-body']}>
                            <svg className={styles['Semester-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                                <circle className={styles['Semester-success-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
                                <path className={styles['Semester-success-icon--check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                            </svg>
                            <h2 className={styles['Semester-status-title']}>Marksheet Saved!</h2>
                            <p className={styles['Semester-status-text']}>
                                The marksheet has been successfully saved.
                            </p>
                        </div>
                        <div className={styles['Semester-popup-footer']}>
                            <button
                                className={styles['Semester-popup-close-btn']}
                                onClick={() => {
                                    setShowSuccessPopup(false);
                                    navigate(-1);
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Submit Confirmation Popup */}
            {showSubmitPopup && (
                <div className={styles['Semester-popup-overlay']}>
                    <div className={styles['Semester-popup-container']} onClick={e => e.stopPropagation()}>
                        <div className={styles['Semester-popup-header']}>Confirm Submit</div>
                        <div className={styles['Semester-popup-body']}>
                            <div className={styles['Semester-status-icon']}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="#D73D3D" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="12"/>
                                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                            </div>
                            <h2 className={styles['Semester-status-title']}>Are you sure?</h2>
                            <p className={styles['Semester-status-text']}>
                                Do you want to submit this marksheet data?
                            </p>
                        </div>
                        <div className={styles['Semester-popup-footer']}>
                            <button
                                className={styles['Semester-popup-close-btn']}
                                onClick={() => setShowSubmitPopup(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles['Semester-popup-submit-btn']}
                                onClick={confirmSubmit}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Coo_ManageStudentSemesterMarksheetView;
