import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import "./Attendance.css";
import totalpercentagestudenticon from '../assets/totalpercentagestudenticon.png';
import totalpercentageicon from '../assets/totalpercentageicon.png';

function Attendance({ onLogout, onViewChange }) { // Removed currentView from props
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [studentData, setStudentData] = useState(() => {
        // Initialize immediately with localStorage data
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

    // ⚡ INSTANT: Load student data and attendance data immediately from cache/localStorage
    useEffect(() => {
        const handleProfileUpdate = async () => {
            try {
                const updatedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
                if (updatedStudentData) {
                    setStudentData(updatedStudentData);
                    // TODO: Fetch attendance data from backend
                    // const attendanceResponse = await fetch(`/api/students/${updatedStudentData._id}/attendance`);
                    // const attendanceData = await attendanceResponse.json();
                    // setAttendanceData(attendanceData);
                    
                    // For now, use data from studentData if available
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
        
        // ⚡ INSTANT: Load from localStorage immediately
        const storedStudentData = JSON.parse(localStorage.getItem('studentData') || 'null');
        if (storedStudentData) {
            console.log('⚡ Attendance: INSTANT load from localStorage');
            setStudentData(storedStudentData);
            
            // Load attendance data immediately
            setAttendanceData({
                present: storedStudentData.attendancePresent || 0,
                absent: storedStudentData.attendanceAbsent || 0,
                records: storedStudentData.attendanceRecords || []
            });
            
            // Try to get cached attendance data
            const attendanceData = localStorage.getItem('attendanceData');
            if (attendanceData) {
                try {
                    const parsedAttendance = JSON.parse(attendanceData);
                    console.log('⚡ Attendance: INSTANT attendance data from cache');
                    setAttendanceData(parsedAttendance);
                } catch (error) {
                    console.error('Error parsing cached attendance data:', error);
                }
            }
            
            // Try to get even faster cached data
            if (storedStudentData._id) {
                import('../services/fastDataService.js').then(({ default: fastDataService }) => {
                    const instantData = fastDataService.getInstantData(storedStudentData._id);
                    if (instantData && instantData.student) {
                        console.log('⚡ Attendance: INSTANT load from cache');
                        setStudentData(instantData.student);
                    }
                });
            }
            
            // Dispatch immediate profile update for sidebar
            if (storedStudentData.profilePicURL) {
                console.log('🚀 Attendance: Dispatching immediate profile update for sidebar');
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
    
    // This handler calls the main navigation function and closes the sidebar
    const handleViewChange = (view) => {
        onViewChange(view);
        setIsSidebarOpen(false);
    };

    return (
        <div className="container student-attendance-page">
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className="main">
                <Sidebar 
                    isOpen={isSidebarOpen} 
                    onLogout={onLogout} 
                    onViewChange={handleViewChange} 
                    currentView={'attendance'} // Hardcode 'attendance' for highlighting
                    studentData={studentData}
                />
                <div className="attendance-area dashboard-area">
                    <div className="attendance-cards">
                        <div className="attendance-card percentage-card">
                            <h3>Total Percentage</h3>
                            <img src={totalpercentagestudenticon} alt="Student Icon" style={{ width: '100px', height: '100px' }} />
                            <img src={totalpercentageicon} alt="Percentage Icon" style={{ width: '30px', height: '30px', marginTop: '-60px', marginLeft: '90px' }} />
                            <div className="percentage-value" style={{ color: statusDetails.color }}>
                                {attendancePercentage}%
                            </div>
                        </div>

                        <div className="attendance-card">
                            <h3>Attendance</h3>
                            <div className="attendance-chart-container">
                                <div className="pie-chart-graphic" style={pieChartStyle}>
                                    {absentPercentage > 0 && <div className="pie-label-absent" style={absentLabelStyle}>Absent<br />{absentPercentage}</div>}
                                    {attendancePercentage > 0 && <div className="pie-label-present" style={presentLabelStyle}>Present<br />{attendancePercentage}</div>}
                                </div>
                                <div className="attendance-legend">
                                    <div className="legend-item">
                                        <span className="legend-text">Present</span>
                                        <span className="legend-value-present">{attendancePercentage}</span>
                                    </div>
                                    <div className="legend-item">
                                        <span className="legend-text">Absent</span>
                                        <span className="legend-value-absent">{absentPercentage}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="attendance-card overall-status-card">
                            <h3>Overall Status</h3>
                            <div className="stars-display" style={{ '--star-color': statusDetails.color }}>
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <svg 
                                        key={index}
                                        className={index < statusDetails.stars ? 'active-star' : 'inactive-star'}
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
                    <div className="attendance-table">
                        <div className="table-header"><h2>ATTENDANCE DETAILS</h2></div>
                        <div className="table-container scrollable-table-body">
                            <table className="table">
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
                                                    <span className={`status-pill ${record.status === 'Absent' ? 'status-absent' : 'status-present'}`}>
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
             {isSidebarOpen && <div className="overlay" onClick={() => setIsSidebarOpen(false)}></div>}
        </div>
    );
}

export default Attendance;