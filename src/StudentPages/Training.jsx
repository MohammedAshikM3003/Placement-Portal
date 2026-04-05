import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import styles from "./Training.module.css";
import mongoDBService from '../services/mongoDBService';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

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
    const [trainingData, setTrainingData] = useState({
        company: '-',
        batch: '-',
        course: '-',
        startDate: '-',
        endDate: '-',
        totalDays: 0,
        completedDays: 0
    });
    
    const attendancePercentage = attendanceData.present + attendanceData.absent > 0 
        ? Math.round((attendanceData.present / (attendanceData.present + attendanceData.absent)) * 100) 
        : 0;

    const trainingProgressPercent = trainingData.totalDays > 0
        ? Math.round((trainingData.completedDays / trainingData.totalDays) * 100)
        : 0;

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
                        setSelectedPhase('');
                    }
                    return;
                }

                const [assignment, attendanceResponse] = await Promise.all([
                    mongoDBService.getStudentTrainingAssignment(regNo),
                    mongoDBService.getStudentTrainingAttendanceByRegNo(regNo).catch(() => ({ data: [] }))
                ]);

                if (!isActive) return;

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

                    const phaseOptions = Array.isArray(assignment?.phases)
                        ? assignment.phases
                            .map((phase) => (phase?.phaseNumber || '').toString().trim())
                            .filter(Boolean)
                        : [];

                    setAvailablePhases(phaseOptions);
                    setSelectedPhase((prev) => (prev && phaseOptions.includes(prev) ? prev : (phaseOptions[0] || '')));
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
                    setAvailablePhases([]);
                    setSelectedPhase('');
                }

                const attendanceRows = Array.isArray(attendanceResponse?.data)
                    ? attendanceResponse.data.map((entry) => {
                        const statusRaw = (entry?.status || '-').toString().trim().toLowerCase();
                        let normalizedStatus = '-';
                        if (statusRaw === 'present') normalizedStatus = 'Present';
                        if (statusRaw === 'absent') normalizedStatus = 'Absent';

                        return {
                            date: entry?.attendanceDate || entry?.attendanceDateKey || entry?.date || '',
                            status: normalizedStatus
                        };
                    })
                    : [];

                const present = attendanceRows.filter((item) => item.status === 'Present').length;
                const absent = attendanceRows.filter((item) => item.status === 'Absent').length;
                setAttendanceData({ present, absent, records: attendanceRows });
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
    }, [studentData?.regNo]);

    const handleViewChange = (view) => {
        onViewChange(view);
        setIsSidebarOpen(false);
    };

    const studentName = `${(studentData?.firstName || '').toString().trim()} ${(studentData?.lastName || '').toString().trim()}`.trim() || (studentData?.name || '-');
    const studentEmail = (studentData?.primaryEmail || studentData?.email || '-').toString().trim() || '-';
    const studentMobile = (studentData?.mobileNo || studentData?.mobile || studentData?.phone || '-').toString().trim() || '-';

    const pieData = [
        { name: 'Present', value: attendanceData.present, color: '#16C098' },
        { name: 'Absent', value: attendanceData.absent, color: '#F65C5F' }
    ];

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
                                        <span className={styles.infoValue}>{trainingData.company}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Start Date</span>
                                        <span className={styles.infoColon}>:</span>
                                        <span className={styles.infoValue}>{trainingData.startDate}</span>
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
                                        <span className={styles.infoValue}>{trainingData.batch}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>End Date</span>
                                        <span className={styles.infoColon}>:</span>
                                        <span className={styles.infoValue}>{trainingData.endDate}</span>
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
                                        <span className={styles.infoValue}>{trainingData.course}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Total Days</span>
                                        <span className={styles.infoColon}>:</span>
                                        <span className={styles.infoValue}>{trainingData.totalDays}</span>
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
                                    <option key={phase} value={phase}>{phase}</option>
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
                        {/* Attendance Details Table */}
                        <div className={styles.tableCard}>
                            <div className={styles.tableHeader}>
                                <h2>ATTENDANCE DETAILS</h2>
                            </div>
                            <div className={styles.tableContainer}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>S.No</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                        </tr>
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
                                        ) : attendanceData.records.length > 0 ? (
                                            attendanceData.records.map((record, index) => (
                                                <tr key={index}>
                                                    <td>{index + 1}</td>
                                                    <td>{formatDate(record.date)}</td>
                                                    <td>
                                                        <span className={`${styles.statusText} ${record.status === 'Absent' ? styles.statusAbsentText : styles.statusPresentText}`}>
                                                            {record.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className={styles.noRecordsCell}>
                                                    No attendance records available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
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
                                    <span className={styles.presentCount}>{attendanceData.present}</span>
                                </div>
                                <div className={styles.countItem}>
                                    <span className={styles.countLabel}>Absent</span>
                                    <span className={styles.absentCount}>{attendanceData.absent}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>}
        </div>
    );
}

export default Training;
