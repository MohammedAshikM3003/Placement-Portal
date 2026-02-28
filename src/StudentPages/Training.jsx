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
    // Generate mock attendance data
    const generateMockData = () => {
        const mockRecords = [
            { date: '2025-07-12', status: 'Present' },
            { date: '2025-07-13', status: 'Present' },
            { date: '2025-07-14', status: 'Absent' },
            { date: '2025-07-15', status: 'Present' },
            { date: '2025-07-16', status: 'Present' },
            { date: '2025-07-17', status: 'Present' },
            { date: '2025-07-18', status: 'Present' },
            { date: '2025-07-19', status: 'Present' },
            { date: '2025-07-20', status: 'Absent' },
            { date: '2025-07-21', status: 'Present' }
        ];
        const present = mockRecords.filter(r => r.status === 'Present').length;
        const absent = mockRecords.filter(r => r.status === 'Absent').length;
        return { present, absent, records: mockRecords };
    };

    const [attendanceData, setAttendanceData] = useState(generateMockData());
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPhase, setSelectedPhase] = useState('');
    const [trainingData, setTrainingData] = useState({
        company: 'R - Sequence',
        batch: 'Batch - II',
        course: 'Java FSD',
        startDate: '12-07-2025',
        endDate: '02-08-2025',
        totalDays: 22,
        completedDays: 11
    });
    
    const attendancePercentage = attendanceData.present + attendanceData.absent > 0 
        ? Math.round((attendanceData.present / (attendanceData.present + attendanceData.absent)) * 100) 
        : 0;
    const absentPercentage = 100 - attendancePercentage;

    const trainingProgressPercent = trainingData.totalDays > 0
        ? Math.round((trainingData.completedDays / trainingData.totalDays) * 100)
        : 0;

    useEffect(() => {
        setIsLoading(false);
    }, []);

    const handleViewChange = (view) => {
        onViewChange(view);
        setIsSidebarOpen(false);
    };

    const handleBackClick = () => {
        onViewChange('dashboard');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

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
                                <h1 className={styles.studentName}>Ravinder Singh</h1>
                            </div>
                            <div className={styles.infoBox}>
                                <div className={styles.infoRow}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Email</span>
                                        <span className={styles.infoColon}>:</span>
                                        <span className={styles.infoValue}>singhravinder4560@gmial.com</span>
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
                                        <span className={styles.infoValue}>7006540212</span>
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
                                required
                            >
                                <option value="" disabled>Select Phase</option>
                                <option value="Phase-I">Phase-I</option>
                                <option value="Phase-II">Phase-II</option>
                                <option value="Phase-III">Phase-III</option>
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
                                <div className={styles.chartContainer}>
                                    <ResponsiveContainer width="100%" height={180}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={70}
                                                fill="#8884d8"
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                <Cell fill="#16C098" />
                                                <Cell fill="#F65C5F" />
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className={styles.chartLabels}>
                                        <div className={styles.absentLabel}>A {absentPercentage}%</div>
                                        <div className={styles.presentLabel}>P {attendancePercentage}%</div>
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
