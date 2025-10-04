import React, { useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import "./Attendance.css";
import totalpercentagestudenticon from './assets/totalpercentagestudenticon.png';
import totalpercentageicon from './assets/totalpercentageicon.png';

function Attendance({ onLogout, onViewChange }) { // Removed currentView from props
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const attendancePercentage = 100;
    const absentPercentage = 100 - attendancePercentage;

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
        <div className="container">
            <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
            <div className="main">
                <Sidebar 
                    isOpen={isSidebarOpen} 
                    onLogout={onLogout} 
                    onViewChange={handleViewChange} 
                    currentView={'attendance'} // Hardcode 'attendance' for highlighting
                />
                <div className={`attendance-area dashboard-area`}>
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
                                    {[...Array(15).keys()].map(i => (
                                        <tr key={i}>
                                            <td>{i + 1}</td>
                                            <td>{`${i + 1 < 10 ? '0' : ''}${i + 1}/08/2025`}</td>
                                            <td>Training Event</td>
                                            <td>
                                                <span className={`status-pill ${i % 3 === 2 ? 'status-absent' : 'status-present'}`}>
                                                    {i % 3 === 2 ? 'Absent' : 'Present'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
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