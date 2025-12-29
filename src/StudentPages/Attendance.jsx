import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import styles from "./Attendance.module.css";
import totalpercentagestudenticon from '../assets/totalpercentagestudenticon.png';
import totalpercentageicon from '../assets/totalpercentageicon.png';

function Attendance({ onLogout, onViewChange }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [studentData, setStudentData] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('studentData') || 'null');
        } catch (error) {
            return null;
        }
    });
    const [attendanceData, setAttendanceData] = useState({ present: 0, absent: 0, records: [] });
    
    const attendancePercentage = attendanceData.present + attendanceData.absent > 0 
        ? Math.round((attendanceData.present / (attendanceData.present + attendanceData.absent)) * 100) 
        : 0;
    const absentPercentage = 100 - attendancePercentage;

    useEffect(() => {
        const handleProfileUpdate = async () => {
            try {
                const updatedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
                if (updatedStudentData) {
                    setStudentData(updatedStudentData);
                    setAttendanceData({
                        present: updatedStudentData.attendancePresent || 0,
                        absent: updatedStudentData.attendanceAbsent || 0,
                        records: updatedStudentData.attendanceRecords || []
                    });
                }
            } catch (error) {
                console.error('Error updating student data for sidebar:', error);
            }
        };
        
        const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (storedStudentData) {
            console.log('⚡ Attendance: INSTANT load from localStorage');
            setStudentData(storedStudentData);
            
            setAttendanceData({
                present: storedStudentData.attendancePresent || 0,
                absent: storedStudentData.attendanceAbsent || 0,
                records: storedStudentData.attendanceRecords || []
            });
            
            const cachedAttendance = localStorage.getItem('attendanceData');
            if (cachedAttendance) {
                try {
                    setAttendanceData(JSON.parse(cachedAttendance));
                } catch (error) {
                    console.error('Error parsing cached attendance data:', error);
                }
            }
            
            if (storedStudentData._id) {
                import('../services/fastDataService.jsx').then(({ default: fastDataService }) => {
                    const instantData = fastDataService.getInstantData(storedStudentData._id);
                    if (instantData && instantData.student) {
                        setStudentData(instantData.student);
                    }
                });
            }
            
            if (storedStudentData.profilePicURL) {
                window.dispatchEvent(new CustomEvent('profileUpdated', { 
                    detail: storedStudentData 
                }));
            }
        }
        
        window.addEventListener('storage', handleProfileUpdate);
        window.addEventListener('profileUpdated', handleProfileUpdate);
        window.addEventListener('allDataPreloaded', handleProfileUpdate);
        
        return () => {
            window.removeEventListener('storage', handleProfileUpdate);
            window.removeEventListener('profileUpdated', handleProfileUpdate);
            window.removeEventListener('allDataPreloaded', handleProfileUpdate);
        };
    }, []);

    const getStatusDetails = (percentage) => {
        if (percentage > 90) return { stars: 5, color: 'gold', label: 'Excellent' };
        if (percentage >= 80) return { stars: 4, color: '#B0C4DE', label: 'Good' };
        if (percentage >= 70) return { stars: 3, color: '#CD7F32', label: 'Average' };
        if (percentage >= 60) return { stars: 2, color: '#dc3545', label: 'Needs Improvement' };
        return { stars: 1, color: 'black', label: 'Very Low' };
    };

    const statusDetails = getStatusDetails(attendancePercentage);

    const pieChartStyle = {
        background: `conic-gradient(#f86c6b 0% ${absentPercentage}%, #2dbda8 ${absentPercentage}% 100%)`
    };

    const labelRadius = 35;
    const presentAngle = (absentPercentage / 100 + (attendancePercentage / 100) / 2) * 2 * Math.PI - (Math.PI / 2);
    const absentAngle = ((absentPercentage / 100) / 2) * 2 * Math.PI - (Math.PI / 2);

    const presentLabelStyle = {
        top: `calc(50% + ${Math.sin(presentAngle) * labelRadius}px)`,
        left: `calc(50% + ${Math.cos(presentAngle) * labelRadius}px)`,
    };
    const absentLabelStyle = {
        top: `calc(50% + ${Math.sin(absentAngle) * labelRadius}px)`,
        left: `calc(50% + ${Math.cos(absentAngle) * labelRadius}px)`,
    };
    
    const handleViewChange = (view) => {
        onViewChange(view);
        setIsSidebarOpen(false);
    };

    return (
        <div className={styles.container}>
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className={styles.main}>
                <Sidebar 
                    isOpen={isSidebarOpen} 
                    onLogout={onLogout} 
                    onViewChange={handleViewChange} 
                    currentView={'attendance'} 
                    studentData={studentData}
                />
                <div className={`${styles.attendanceArea} dashboard-area`}>
                    <div className={styles.attendanceCards}>
                        {/* Total Percentage Card */}
                        <div className={`${styles.attendanceCard} ${styles.percentageCard}`}>
                            <h3>Total Percentage</h3>
                            <img src={totalpercentagestudenticon} alt="Student Icon" style={{ width: '100px', height: '100px' }} />
                            <img src={totalpercentageicon} alt="Percentage Icon" style={{ width: '30px', height: '30px', marginTop: '-60px', marginLeft: '90px' }} />
                            <div className={styles.percentageValue} style={{ color: statusDetails.color }}>
                                {attendancePercentage}%
                            </div>
                        </div>

                        {/* Attendance Pie Chart Card */}
                        <div className={styles.attendanceCard}>
                            <h3>Attendance</h3>
                            <div className={styles.attendanceChartContainer}>
                                <div className={styles.pieChartGraphic} style={pieChartStyle}>
                                    {absentPercentage > 0 && <div className={styles.pieLabelAbsent} style={absentLabelStyle}>Absent<br />{absentPercentage}</div>}
                                    {attendancePercentage > 0 && <div className={styles.pieLabelPresent} style={presentLabelStyle}>Present<br />{attendancePercentage}</div>}
                                </div>
                                <div className={styles.attendanceLegend}>
                                    <div className={styles.legendItem}>
                                        <span className={styles.legendText}>Present</span>
                                        <span className={styles.legendValuePresent}>{attendancePercentage}</span>
                                    </div>
                                    <div className={styles.legendItem}>
                                        <span className={styles.legendText}>Absent</span>
                                        <span className={styles.legendValueAbsent}>{absentPercentage}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Overall Status Card */}
                        <div className={`${styles.attendanceCard} ${styles.overallStatusCard}`}>
                            <h3>Overall Status</h3>
                            {/* We pass the star color to the custom property style for hover effects */}
                            <div className={styles.starsDisplay} style={{ '--star-color': statusDetails.color }}>
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <svg 
                                        key={index}
                                        // Use activeStar for stars that should reveal color on hover, inactiveStar stays grey
                                        className={index < statusDetails.stars ? styles.activeStar : styles.inactiveStar}
                                        viewBox="0 0 24 24" 
                                        style={{ width: '40px', height: '40px' }}
                                    >
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                ))}
                            </div>
                            <p style={{ color: statusDetails.color, fontSize: '1.2em', fontWeight: 'bold', marginTop: '15px' }}>
                                {statusDetails.label}
                            </p>
                        </div>
                    </div>

                    {/* Attendance Table */}
                    <div className={styles.attendanceTable}>
                        <div className={styles.tableHeader}><h2>ATTENDANCE DETAILS</h2></div>
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr><th>S.No</th><th>Date</th><th>Type</th><th>Status</th></tr>
                                </thead>
                                <tbody>
                                    {attendanceData.records.length > 0 ? (
                                        attendanceData.records.map((record, index) => (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td>{record.date}</td>
                                                <td>{record.type}</td>
                                                <td>
                                                    <span className={`${styles.statusPill} ${record.status === 'Absent' ? styles.statusAbsent : styles.statusPresent}`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                                No attendance records available
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
             {isSidebarOpen && <div className={styles.overlay} onClick={() => setIsSidebarOpen(false)}></div>}
        </div>
    );
}

export default Attendance;