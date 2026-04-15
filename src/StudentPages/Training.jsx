import React, { useMemo, useState, useEffect } from "react";
import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import styles from "./Training.module.css";
import mongoDBService from '../services/mongoDBService';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { TrainingCourseEnrolledAlert } from '../components/alerts';

const normalizeCourseName = (value) => (value || '').toString().trim();

const normalizeYearToken = (value = '') => {
    const raw = value.toString().trim().toUpperCase();
    if (!raw) return '';

    const compact = raw.replace(/[^A-Z0-9]/g, '');
    if (!compact) return '';

    const yearAliases = {
        '1': 'I', '01': 'I', '1ST': 'I', '1STYEAR': 'I', 'FIRST': 'I', 'FIRSTYEAR': 'I', 'I': 'I',
        '2': 'II', '02': 'II', '2ND': 'II', '2NDYEAR': 'II', 'SECOND': 'II', 'SECONDYEAR': 'II', 'II': 'II',
        '3': 'III', '03': 'III', '3RD': 'III', '3RDYEAR': 'III', 'THIRD': 'III', 'THIRDYEAR': 'III', 'III': 'III',
        '4': 'IV', '04': 'IV', '4TH': 'IV', '4THYEAR': 'IV', 'FOURTH': 'IV', 'FOURTHYEAR': 'IV', 'IV': 'IV'
    };

    return yearAliases[compact] || compact;
};

const pickLatestPhase = (phases) => {
    if (!Array.isArray(phases) || phases.length === 0) return '';

    let latest = phases[0];
    let latestNumber = Number.NaN;

    phases.forEach((phase) => {
        const phaseText = (phase || '').toString().trim();
        const match = phaseText.match(/\d+/);
        const phaseNumber = match ? Number.parseInt(match[0], 10) : Number.NaN;

        if (Number.isNaN(phaseNumber)) {
            if (Number.isNaN(latestNumber)) {
                latest = phaseText;
            }
            return;
        }

        if (Number.isNaN(latestNumber) || phaseNumber > latestNumber) {
            latestNumber = phaseNumber;
            latest = phaseText;
        }
    });

    return latest;
};

function Training({ onLogout, onViewChange }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [studentData, setStudentData] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('studentData') || 'null');
        } catch (error) {
            return null;
        }
    });
    const [attendanceData, setAttendanceData] = useState({ present: 0, absent: 0, records: [] });
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPhase, setSelectedPhase] = useState('');
    const [availablePhases, setAvailablePhases] = useState([]);
    const [phaseMetaMap, setPhaseMetaMap] = useState({});
    const [selectedCourse, setSelectedCourse] = useState('');
    const [isCourseSubmitting, setIsCourseSubmitting] = useState(false);
    const [isCourseEnrolledPopupOpen, setIsCourseEnrolledPopupOpen] = useState(false);
    const [recentlyEnrolledCourse, setRecentlyEnrolledCourse] = useState('');
    const [trainingData, setTrainingData] = useState({
        company: '-',
        batch: '-',
        course: '-',
        startDate: '-',
        endDate: '-',
        totalDays: 0,
        completedDays: 0
    });
    
    const normalizePhase = (value) => {
        const text = (value || '').toString().trim();
        const match = text.match(/\d+/);
        return match ? match[0] : text.toLowerCase();
    };

    const scopedAttendanceRecords = useMemo(() => {
        if (!selectedPhase) return attendanceData.records;
        const selectedKey = normalizePhase(selectedPhase);
        const records = attendanceData.records || [];

        const hasPhaseTag = records.some((record) => normalizePhase(record?.phaseNumber || record?.phase || ''));
        if (!hasPhaseTag) {
            return records;
        }

        return records.filter((record) => {
            const recordKey = normalizePhase(record?.phaseNumber || record?.phase || '');
            return recordKey && recordKey === selectedKey;
        });
    }, [attendanceData.records, selectedPhase]);

    const presentCount = scopedAttendanceRecords.filter((item) => item.status === 'Present').length;
    const absentCount = scopedAttendanceRecords.filter((item) => item.status === 'Absent').length;

    const attendancePercentage = presentCount + absentCount > 0
        ? Math.round((presentCount / (presentCount + absentCount)) * 100)
        : 0;

    const trainingProgressPercent = trainingData.totalDays > 0
        ? Math.round((trainingData.completedDays / trainingData.totalDays) * 100)
        : 0;

    const parseDurationToDays = (durationValue) => {
        const raw = (durationValue || '').toString().trim().toLowerCase();
        if (!raw) return 0;

        const match = raw.match(/\d+/);
        if (!match) return 0;

        const parsed = Number.parseInt(match[0], 10);
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const preferredTrainingRows = useMemo(() => {
        const selectedPhaseKey = normalizePhase(selectedPhase);
        const selectedPhaseCourses = phaseMetaMap[selectedPhaseKey]?.courses || [];

        return [...new Set(
            selectedPhaseCourses
            .map((course) => normalizeCourseName(course))
            .filter((course) => course && course !== '-')
        )];
    }, [phaseMetaMap, selectedPhase]);

    const selectedPhaseDetails = useMemo(() => {
        return phaseMetaMap[normalizePhase(selectedPhase)] || null;
    }, [phaseMetaMap, selectedPhase]);

    const enrolledCourseForSelectedPhase = useMemo(() => {
        const preferred = (studentData?.preferredTraining || '').toString().trim();
        if (!preferred) return '';

        const preferredLower = preferred.toLowerCase();
        const existsInPhase = preferredTrainingRows.some((course) => course.toLowerCase() === preferredLower);
        return existsInPhase ? preferred : '';
    }, [preferredTrainingRows, studentData?.preferredTraining]);

    const isCurrentPhaseSubmitted = Boolean(enrolledCourseForSelectedPhase);

    useEffect(() => {
        const preferred = (studentData?.preferredTraining || '').toString().split(',').map((item) => item.trim()).filter(Boolean);
        const currentPreferred = preferred[0] || '';

        if (currentPreferred && preferredTrainingRows.some((course) => course.toLowerCase() === currentPreferred.toLowerCase())) {
            setSelectedCourse(currentPreferred);
            return;
        }

        setSelectedCourse('');
    }, [preferredTrainingRows, studentData?.preferredTraining]);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (Number.isNaN(date.getTime())) return dateString;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    const getTotalDays = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
        const diff = Math.floor((end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
        return diff >= 0 ? diff + 1 : 0;
    };

    const getCompletedDays = (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const today = new Date();
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

        const effectiveEnd = today < end ? today : end;
        const diff = Math.floor((effectiveEnd.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
        return diff >= 0 ? diff + 1 : 0;
    };

    useEffect(() => {
        let isActive = true;

        const loadTrainingData = async () => {
            setIsLoading(true);
            try {
                const regNo = (studentData?.regNo || '').toString().trim();
                if (!regNo) {
                    if (isActive) {
                        setAttendanceData({ present: 0, absent: 0, records: [] });
                        setTrainingData({
                            company: '-',
                            batch: '-',
                            course: '-',
                            startDate: '-',
                            endDate: '-',
                            totalDays: 0,
                            completedDays: 0
                        });
                        setAvailablePhases([]);
                        setPhaseMetaMap({});
                        setSelectedPhase('');
                    }
                    return;
                }

                const [assignment, attendanceResponse, schedulesResponse] = await Promise.all([
                    mongoDBService.getStudentTrainingAssignment(regNo),
                    mongoDBService.getStudentTrainingAttendanceByRegNo(regNo).catch(() => ({ data: [] })),
                    mongoDBService.getScheduledTrainings().catch(() => [])
                ]);

                if (!isActive) return;

                const activeYear = normalizeYearToken(studentData?.currentYear || studentData?.year || assignment?.applicableYear || '');
                const allSchedules = Array.isArray(schedulesResponse) ? schedulesResponse : [];

                const phaseEntries = [];

                allSchedules.forEach((schedule) => {
                    const scheduleBatches = Array.isArray(schedule?.batches) ? schedule.batches : [];
                    const schedulePhases = Array.isArray(schedule?.phases) ? schedule.phases : [];

                    const scheduleHasMatchingBatch = activeYear
                        ? scheduleBatches.some((batch) => normalizeYearToken(batch?.applicableYear || '') === activeYear)
                        : true;

                    const scheduleUpdatedAt = new Date(schedule?.updatedAt || schedule?.createdAt || 0).getTime() || 0;

                    schedulePhases.forEach((phase) => {
                        const phaseNumber = (phase?.phaseNumber || '').toString().trim();
                        if (!phaseNumber) return;

                        const phaseYear = normalizeYearToken(phase?.applicableYear || '');
                        const includePhase = !activeYear || phaseYear === activeYear || (!phaseYear && scheduleHasMatchingBatch);
                        if (!includePhase) return;

                        const phaseKey = normalizePhase(phaseNumber);
                        const phaseCourses = Array.isArray(phase?.applicableCourses)
                            ? phase.applicableCourses.map((course) => normalizeCourseName(course)).filter(Boolean)
                            : [];

                        const phaseStartRaw = (phase?.startDate || schedule?.startDate || '').toString().trim();
                        const phaseEndRaw = (phase?.endDate || schedule?.endDate || '').toString().trim();
                        const computedTotalDays = parseDurationToDays(phase?.duration) || getTotalDays(phaseStartRaw, phaseEndRaw);

                        phaseEntries.push({
                            phaseKey,
                            phaseNumber,
                            courses: [...new Set(phaseCourses)],
                            companyName: (schedule?.companyName || assignment?.companyName || '-').toString().trim(),
                            startDate: phaseStartRaw,
                            endDate: phaseEndRaw,
                            totalDays: computedTotalDays,
                            updatedAt: scheduleUpdatedAt
                        });
                    });
                });

                const phaseMapFromSchedules = phaseEntries.reduce((acc, entry) => {
                    const previous = acc[entry.phaseKey];
                    if (!previous || entry.updatedAt >= previous.updatedAt) {
                        acc[entry.phaseKey] = entry;
                    }
                    return acc;
                }, {});

                const phaseOptions = Object.values(phaseMapFromSchedules)
                    .map((entry) => (entry?.phaseNumber || '').toString().trim())
                    .map((phaseKey) => {
                        const numeric = Number.parseInt(phaseKey, 10);
                        return Number.isFinite(numeric) ? numeric.toString() : phaseKey;
                    })
                    .filter(Boolean)
                    .sort((left, right) => {
                        const a = Number.parseInt(left, 10);
                        const b = Number.parseInt(right, 10);
                        if (Number.isFinite(a) && Number.isFinite(b)) return a - b;
                        return left.localeCompare(right);
                    });

                setPhaseMetaMap(phaseMapFromSchedules);
                setAvailablePhases(phaseOptions);
                setSelectedPhase((prev) => {
                    if (prev && phaseOptions.includes(prev)) return prev;
                    return pickLatestPhase(phaseOptions);
                });

                if (assignment) {
                    const startDate = assignment?.startDate || '';
                    const endDate = assignment?.endDate || '';
                    const totalDays = getTotalDays(startDate, endDate);
                    const completedDays = getCompletedDays(startDate, endDate);

                    const attendanceRowsRaw = Array.isArray(attendanceResponse?.data) ? attendanceResponse.data : [];
                    const batchNumberFromAttendance = attendanceRowsRaw
                        .map((entry) => (entry?.batchNumber ?? '').toString().trim())
                        .find(Boolean);

                    setTrainingData({
                        company: assignment?.companyName || '-',
                        batch: batchNumberFromAttendance || (assignment?.batchNumber ?? '').toString().trim() || assignment?.batchName || '-',
                        course: assignment?.courseName || '-',
                        startDate: formatDate(startDate),
                        endDate: formatDate(endDate),
                        totalDays,
                        completedDays: Math.min(completedDays, totalDays)
                    });
                } else {
                    setTrainingData({
                        company: '-',
                        batch: '-',
                        course: '-',
                        startDate: '-',
                        endDate: '-',
                        totalDays: 0,
                        completedDays: 0
                    });
                }

                const attendanceRows = Array.isArray(attendanceResponse?.data)
                    ? attendanceResponse.data.map((entry) => {
                        const statusRaw = (entry?.status || '-').toString().trim().toLowerCase();
                        let normalizedStatus = '-';
                        if (statusRaw === 'present') normalizedStatus = 'Present';
                        if (statusRaw === 'absent') normalizedStatus = 'Absent';

                        return {
                            date: entry?.attendanceDate || entry?.attendanceDateKey || entry?.date || '',
                            status: normalizedStatus,
                            phaseNumber: entry?.phaseNumber || entry?.phase || '',
                            courseName: entry?.courseName || entry?.course || ''
                        };
                    })
                    : [];
                setAttendanceData({ present: 0, absent: 0, records: attendanceRows });
            } catch (error) {
                console.error('Failed to load training data for student:', error);
                if (!isActive) return;
                setAttendanceData({ present: 0, absent: 0, records: [] });
                setTrainingData({
                    company: '-',
                    batch: '-',
                    course: '-',
                    startDate: '-',
                    endDate: '-',
                    totalDays: 0,
                    completedDays: 0
                });
                setAvailablePhases([]);
                setPhaseMetaMap({});
                setSelectedPhase('');
            } finally {
                if (isActive) {
                    setIsLoading(false);
                }
            }
        };

        loadTrainingData();

        return () => {
            isActive = false;
        };
    }, [studentData?.currentYear, studentData?.regNo, studentData?.year]);

    const handleViewChange = (view) => {
        onViewChange(view);
        setIsSidebarOpen(false);
    };

    const resolveStudentId = () => {
        const idFromStudentData = studentData?._id || studentData?.id;
        if (idFromStudentData) return idFromStudentData;

        try {
            const full = JSON.parse(localStorage.getItem('completeStudentData') || 'null');
            const idFromFull = full?.student?._id || full?.student?.id;
            if (idFromFull) return idFromFull;
        } catch (error) {
            console.error('Failed to parse completeStudentData for student ID:', error);
        }

        return null;
    };

    const handleCourseSubmit = async () => {
        const chosen = (selectedCourse || '').toString().trim();
        if (!chosen || isCourseSubmitting) return;

        const studentId = resolveStudentId();
        if (!studentId) {
            alert('Unable to identify student. Please login again and retry.');
            return;
        }

        try {
            setIsCourseSubmitting(true);
            await mongoDBService.updateStudent(studentId, { preferredTraining: chosen });

            setStudentData((prev) => {
                const updated = { ...(prev || {}), preferredTraining: chosen };
                try {
                    localStorage.setItem('studentData', JSON.stringify(updated));

                    const full = JSON.parse(localStorage.getItem('completeStudentData') || 'null');
                    if (full?.student) {
                        const updatedFull = {
                            ...full,
                            student: {
                                ...full.student,
                                preferredTraining: chosen
                            }
                        };
                        localStorage.setItem('completeStudentData', JSON.stringify(updatedFull));
                    }
                } catch (storageError) {
                    console.error('Failed to sync preferred training to localStorage:', storageError);
                }
                return updated;
            });

            setRecentlyEnrolledCourse(chosen);
            setIsCourseEnrolledPopupOpen(true);
        } catch (error) {
            console.error('Failed to submit preferred training:', error);
            alert('Failed to enroll in the selected training course. Please try again.');
        } finally {
            setIsCourseSubmitting(false);
        }
    };

    const studentName = `${(studentData?.firstName || '').toString().trim()} ${(studentData?.lastName || '').toString().trim()}`.trim() || (studentData?.name || '-');
    const studentEmail = (studentData?.primaryEmail || studentData?.email || '-').toString().trim() || '-';
    const studentMobile = (studentData?.mobileNo || studentData?.mobile || studentData?.phone || '-').toString().trim() || '-';

    const pieData = [
        { name: 'Present', value: presentCount, color: '#16C098' },
        { name: 'Absent', value: absentCount, color: '#F65C5F' }
    ];

    const displayCompany = selectedPhaseDetails?.companyName || trainingData.company;
    const displayStartDate = selectedPhaseDetails?.startDate ? formatDate(selectedPhaseDetails.startDate) : trainingData.startDate;
    const displayEndDate = selectedPhaseDetails?.endDate ? formatDate(selectedPhaseDetails.endDate) : trainingData.endDate;
    const displayTotalDays = selectedPhaseDetails ? selectedPhaseDetails.totalDays : trainingData.totalDays;
    const displayBatch = trainingData.batch || '-';
    const displayCourse = selectedPhaseDetails
        ? (enrolledCourseForSelectedPhase || '-')
        : trainingData.course;
    const isAttendanceTableMode = scopedAttendanceRecords.length > 0;

    return (
        <div className={styles.container}>
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className={styles.main}>
                <Sidebar 
                    isOpen={isSidebarOpen} 
                    onLogout={onLogout} 
                    onViewChange={handleViewChange} 
                    currentView={'training'} 
                    studentData={studentData}
                />
                <div className={styles.attendanceArea}>
                    {/* Profile Header Card */}
                    <div className={styles.profileHeaderCard}>
                        <div className={styles.profileHeaderContent}>
                            <div className={styles.studentNameSection}>
                                <h1 className={styles.studentName}>{studentName}</h1>
                            </div>
                            <div className={styles.infoBox}>
                                <div className={styles.infoRow}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Email</span>
                                        <span className={styles.infoColon}>:</span>
                                        <span className={styles.infoValue}>{studentEmail}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Company</span>
                                        <span className={styles.infoColon}>:</span>
                                        <span className={styles.infoValue}>{displayCompany}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Start Date</span>
                                        <span className={styles.infoColon}>:</span>
                                        <span className={styles.infoValue}>{displayStartDate}</span>
                                    </div>
                                </div>
                                <div className={styles.infoRow}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Mobile No</span>
                                        <span className={styles.infoColon}>:</span>
                                        <span className={styles.infoValue}>{studentMobile}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Batch</span>
                                        <span className={styles.infoColon}>:</span>
                                        <span className={styles.infoValue}>{displayBatch}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>End Date</span>
                                        <span className={styles.infoColon}>:</span>
                                        <span className={styles.infoValue}>{displayEndDate}</span>
                                    </div>
                                </div>
                                <div className={styles.infoRow}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Reg No</span>
                                        <span className={styles.infoColon}>:</span>
                                        <span className={styles.infoValue}>{studentData?.regNo || 'N/A'}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Course</span>
                                        <span className={styles.infoColon}>:</span>
                                        <span className={styles.infoValue}>{displayCourse}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Total Days</span>
                                        <span className={styles.infoColon}>:</span>
                                        <span className={styles.infoValue}>{displayTotalDays}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bars Section */}
                    <div className={styles.progressSection}>
                        {/* Phase Selector */}
                        <div className={styles.progressItem}>
                            <select 
                                value={selectedPhase} 
                                onChange={(e) => setSelectedPhase(e.target.value)}
                                className={styles.phaseSelect}
                            >
                                <option value="" disabled>{availablePhases.length ? 'Select Phase' : 'No Phases Assigned'}</option>
                                {availablePhases.map((phase) => (
                                    <option key={phase} value={phase}>{phase.toLowerCase().includes('phase') ? phase : `Phase - ${phase}`}</option>
                                ))}
                            </select>
                        </div>

                        {/* Training Progress */}
                        <div className={styles.progressItem}>
                            <div className={styles.progressLabel}>
                                <span className={styles.progressTitle}>Training Progress</span>
                                <span className={styles.progressCount}> : {trainingData.completedDays}/{trainingData.totalDays} Days</span>
                            </div>
                            <div className={styles.progressBarContainer}>
                                <div 
                                    className={styles.progressBarFillBlue}
                                    style={{ width: `${trainingProgressPercent}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Attendance Percentage */}
                        <div className={styles.progressItem}>
                            <div className={styles.progressLabel}>
                                <span className={styles.progressTitle}>Attendance %</span>
                                <span className={styles.progressStatus}> : {attendancePercentage >= 80 ? 'Good !' : 'Average'}</span>
                            </div>
                            <div className={styles.progressBarContainer}>
                                <div 
                                    className={styles.progressBarFillGreen}
                                    style={{ width: `${attendancePercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section - Table and Chart */}
                    <div className={styles.bottomSection}>
                        {/* Preferred Training Table */}
                        <div className={styles.tableCard}>
                            <div className={styles.tableHeader}>
                                <h2>{isAttendanceTableMode ? 'ATTENDANCE DETAILS' : 'PREFERRED TRAINING'}</h2>
                            </div>
                            <div className={styles.tableContainer}>
                                <table className={styles.table}>
                                    <thead>
                                        {isAttendanceTableMode ? (
                                            <tr>
                                                <th>S.No</th>
                                                <th>Date</th>
                                                <th>Status</th>
                                            </tr>
                                        ) : (
                                            <tr>
                                                <th>S.No</th>
                                                <th>Course</th>
                                                <th>Select</th>
                                            </tr>
                                        )}
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr className={styles.loadingRow}>
                                                <td colSpan="3" className={styles.loadingCell}>
                                                    <div className={styles.loadingWrapper}>
                                                        <div className={styles.spinner}></div>
                                                        <span className={styles.loadingText}>Loading...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : isAttendanceTableMode ? (
                                            scopedAttendanceRecords.map((record, index) => (
                                                <tr key={`${record?.date || 'date'}-${index}`}>
                                                    <td>{index + 1}</td>
                                                    <td>{formatDate(record?.date)}</td>
                                                    <td>
                                                        <span className={`${styles.statusText} ${record?.status === 'Absent' ? styles.statusAbsentText : styles.statusPresentText}`}>
                                                            {record?.status || '-'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : preferredTrainingRows.length > 0 ? (
                                            preferredTrainingRows.map((course, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>{course}</td>
                                                    <td className={styles.trainingCheckboxCell}>
                                                        <input
                                                            type="checkbox"
                                                            className={styles.trainingCheckbox}
                                                            checked={selectedCourse.toLowerCase() === course.toLowerCase()}
                                                            onChange={() => setSelectedCourse(course)}
                                                            disabled={isCourseSubmitting}
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className={styles.noRecordsCell}>
                                                    No preferred training available for your year
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {!isAttendanceTableMode && !isCurrentPhaseSubmitted && (
                                <div className={styles.tableSubmitBar}>
                                    <button
                                        type="button"
                                        className={styles.tableSubmitBtn}
                                        onClick={handleCourseSubmit}
                                        disabled={!selectedCourse || isCourseSubmitting}
                                    >
                                        {isCourseSubmitting ? 'Submitting..' : 'Submit'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Attendance Overview Card */}
                        <div className={styles.overviewCard}>
                            <h3 className={styles.overviewTitle}>Attendance Overview</h3>
                            <div className={styles.chartSection}>
                                <div className={styles.overviewChartContent}>
                                    <div className={styles.chartContainer}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={55}
                                                    outerRadius={75}
                                                    startAngle={90}
                                                    endAngle={-270}
                                                    paddingAngle={0}
                                                    dataKey="value"
                                                    animationBegin={0}
                                                    animationDuration={800}
                                                    animationEasing="ease-out"
                                                    stroke="none"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`attendance-overview-cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className={styles.chartCenterText}>
                                            <div className={styles.chartCenterValue}>{attendancePercentage}%</div>
                                            <div className={styles.chartCenterLabel}>Present</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.countsSection}>
                                <div className={styles.countItem}>
                                    <span className={styles.countLabel}>Present</span>
                                    <span className={styles.presentCount}>{presentCount}</span>
                                </div>
                                <div className={styles.countItem}>
                                    <span className={styles.countLabel}>Absent</span>
                                    <span className={styles.absentCount}>{absentCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>}
            <TrainingCourseEnrolledAlert
                isOpen={isCourseEnrolledPopupOpen}
                onClose={() => setIsCourseEnrolledPopupOpen(false)}
                courseName={recentlyEnrolledCourse}
                startDate={displayStartDate}
                endDate={displayEndDate}
                totalDays={displayTotalDays}
            />
        </div>
    );
}

export default Training;
