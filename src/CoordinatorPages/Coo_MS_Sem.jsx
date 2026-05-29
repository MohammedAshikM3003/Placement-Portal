// Forced rewrite to trigger React HMR
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import styles from './Coo_MS_Sem.module.css';
import Adminicon from '../assets/Adminicon.png';
import { API_BASE_URL } from '../utils/apiConfig';
import mongoDBService from '../services/mongoDBService.jsx';

// Grade to grade-point mapping
const GRADE_POINTS = {
    'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6,
    'C': 5, 'U': 0, 'RA': 0, 'AB': 0, 'SA': 0, 'W': 0,
};

const formatExamDate = (value) => {
    if (!value) return '--';

    const text = String(value).trim();
    if (!text) return '--';

    const parsedDate = new Date(text);
    if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate.toLocaleDateString('en-GB', {
            month: '2-digit',
            year: '2-digit'
        });
    }

    const monthYearMatch = text.match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s*[-/]\s*(\d{4})$/i);
    if (monthYearMatch) {
        const monthIndex = {
            jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
            jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
        }[monthYearMatch[1].slice(0, 3).toLowerCase()];
        return `${monthIndex}/${monthYearMatch[2].slice(-2)}`;
    }

    const compactMonthYearMatch = text.match(/^(\d{2})\s*[-/]\s*(\d{4})$/);
    if (compactMonthYearMatch) {
        return `${compactMonthYearMatch[1]}/${compactMonthYearMatch[2].slice(-2)}`;
    }

    return text;
};

function Coo_MS_Sem({ onLogout, onViewChange }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [studentData, setStudentData] = useState(location.state?.student || null);
    const [isInitialLoading, setIsInitialLoading] = useState(false);
    const [extractedData, setExtractedData] = useState(location.state?.student || null); // Initialize with student data
    const [semesterLoading, setSemesterLoading] = useState(false);
    const [semesterError, setSemesterError] = useState('');
    const [masterSubjects, setMasterSubjects] = useState([]);

    // Calculate SGPA
    const calculateSGPA = useCallback(() => {
        if (!extractedData || !extractedData.subjects) return studentData?.sgpa || '0.0';

        let totalCredits = 0;
        let totalGradePoints = 0;

        extractedData.subjects.forEach(course => {
            const credits = parseFloat(course.credits) || 0;
            const gradePoint = GRADE_POINTS[course.grade] || 0;
            totalCredits += credits;
            totalGradePoints += credits * gradePoint;
        });

        if (totalCredits === 0) return '0.0';
        return (totalGradePoints / totalCredits).toFixed(2);
    }, [extractedData, studentData]);

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
        navigate(-1);
    };

    useEffect(() => {
        // If data is passed from a previous page, use it directly
        if (location.state?.student) {
            setStudentData(location.state.student);
            setExtractedData(location.state.student); // Use this for display
        }
    }, [location.state]);

    useEffect(() => {
        const loadMasterSubjects = async () => {
            try {
                const authToken = localStorage.getItem('authToken');
                const response = await fetch(`${API_BASE_URL}/subjects`, {
                    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
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
            const code = String(subject.courseCode || '').trim().toUpperCase();
            if (!code) continue;
            lookup.set(code, subject.credits ?? null);
        }
        return lookup;
    }, [masterSubjects]);

    if (isInitialLoading) {
        return (
            <div className={styles.container}>
                <Navbar Adminicon={Adminicon} onToggleSidebar={handleToggleSidebar} />
                <div className={styles.main}>
                    <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView="manage-students" onViewChange={handleViewChange} />
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

    const attemptedSubjects = extractedData?.subjects?.length || 0;
    const clearedSubjects = extractedData?.subjects?.filter(c => c.grade !== 'U' && c.grade !== 'RA').length || 0;
    const pendingSubjects = attemptedSubjects - clearedSubjects;

    return (
        <div className={styles.container}>
            <Navbar Adminicon={Adminicon} onToggleSidebar={handleToggleSidebar} />
            <div className={styles.main}>
                <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView="manage-students" onViewChange={handleViewChange} />
                {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)} />}
                
                <div className={styles.dashboardArea}>
                    <div className={styles.contentWrapper}>
                        {/* Left Side - Profile Card */}
                        <div className={styles.profileCard}>
                            <div className={styles.profileIconContainer}>
                                <img src={studentData?.profilePicURL || Adminicon} alt="Profile" className={styles.profileIcon} />
                            </div>
                            <div className={styles.profileInfo}>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Name</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{studentData?.name || `${studentData?.firstName || ''} ${studentData?.lastName || ''}`}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Reg No</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{studentData?.regNo || '--'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Year</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{studentData?.year || studentData?.currentYear || '--'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Semester</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{studentData?.semester || studentData?.currentSemester || '--'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Current SGPA</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{calculateSGPA()}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Overall CGPA</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{studentData?.overallCgpa || '0.0'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Exam Date MM/YY</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{formatExamDate(extractedData?.examDate || extractedData?.exam_month_year || extractedData?.student_info?.exam_month_year)}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Attempted</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{attemptedSubjects !== null ? attemptedSubjects : '--'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Cleared</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{clearedSubjects !== null ? clearedSubjects : '--'}</span>
                                </div>
                                <div className={styles.infoRow}>
                                    <span className={styles.infoLabel}>Pending</span>
                                    <span className={styles.infoColon}>:</span>
                                    <span className={styles.infoValue}>{pendingSubjects !== null ? pendingSubjects : '--'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Subjects Table Section */}
                        <div className={styles.uploadSection}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div className={styles.actionBox}>
                                    <div className={styles.actionBoxIcon}>✏️</div>
                                    <div className={styles.actionBoxTitle}>Edit Marksheet</div>
                                    <div className={styles.actionBoxSubtitle}>Review, Edit and Update Student Semester Marksheet Records.</div>
                                </div>
                                <div className={styles.actionBox}>
                                    <div className={styles.actionBoxIcon}>⬇️</div>
                                    <div className={styles.actionBoxTitle}>Download Marksheet</div>
                                    <div className={styles.actionBoxSubtitle}>Download the student's current semester marksheet.</div>
                                </div>
                            </div>

                            <div className={styles.tableOuter}>
                                <div className={styles.subjectsHeader}>
                                    <h2>Semester {studentData?.semester || studentData?.currentSemester || ''} - Subjects ({attemptedSubjects})</h2>
                                    <button type="button" className={styles.backButton} onClick={handleBack}>Back</button>
                                </div>
                                <table className={styles.courseTableHeader}>
                                    <thead>
                                        <tr>
                                            <th>S.NO</th>
                                            <th>SEM</th>
                                            <th>COURSE CODE</th>
                                            <th>COURSE NAME</th>
                                            <th>CREDITS</th>
                                            <th>GRADE</th>
                                            <th>RESULT</th>
                                        </tr>
                                    </thead>
                                </table>
                                <div className={styles.tableScroll}>
                                    {semesterLoading ? (
                                        <div style={{ padding: '24px', textAlign: 'center' }}>Loading subjects...</div>
                                    ) : (
                                        <table className={styles.courseTableBody}>
                                            <tbody>
                                                {extractedData?.subjects && extractedData.subjects.length > 0 ? (
                                                    extractedData.subjects.map((course, index) => {
                                                        const courseCode = String(course.courseCode || '').trim().toUpperCase();
                                                        const masterCredits = masterCreditLookup.get(courseCode);
                                                        const rawCredits = course.credits;
                                                        const normalizedCredits = (rawCredits === '' || rawCredits === null || rawCredits === undefined)
                                                            ? null
                                                            : rawCredits;
                                                        const creditsValue = normalizedCredits ?? masterCredits;
                                                        const creditsDisplay = (creditsValue === null || creditsValue === undefined || creditsValue === '')
                                                            ? '--'
                                                            : creditsValue;
                                                        const rawResult = (course.result || '').toString().trim().toUpperCase();
                                                        const resultValue = rawResult === 'PASS' ? 'P' : rawResult === 'FAIL' ? 'F' : rawResult;
                                                        const isFail = resultValue
                                                            ? resultValue === 'F'
                                                            : (course.grade === 'U' || course.grade === 'RA');

                                                        return (
                                                            <tr key={index}>
                                                                <td>{index + 1}</td>
                                                                <td>{course.semester || course.sem || studentData?.semester || studentData?.currentSemester || '--'}</td>
                                                                <td>{course.courseCode || '--'}</td>
                                                                <td>{course.courseName || '--'}</td>
                                                                <td>{creditsDisplay}</td>
                                                                <td style={{ fontWeight: '600' }}>{course.grade || '--'}</td>
                                                                <td style={{ color: isFail ? '#C53030' : '#4EA24E', fontWeight: '600' }}>
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
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Coo_MS_Sem;