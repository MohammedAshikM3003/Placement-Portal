import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";

// Import New Components
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";

// Import CSS Files
import './ReportAnalysismain.css'; 

// Import necessary assets for the Navbar (Adminicon)
import Adminicon from "../assets/Adminicon.png";

function CoReportAnalysismain({ onLogout, onViewChange }) {
    // const navigate = useNavigate(); // Unused
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    const handleNavigateToCompanyWise = () => {
        if (onViewChange) {
            onViewChange('report-analysis-cw');
        }
    };

    const handleNavigateToStudentWise = () => {
        if (onViewChange) {
            onViewChange('report-analysis-sw');
        }
    };

    return (
        <>
            <Navbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
            <div className="co-ram-layout">
                <Sidebar 
                    isOpen={isSidebarOpen} 
                    onLogout={onLogout} 
                    currentView="report-analysis" 
                    onViewChange={onViewChange} 
                />
                <div className="co-ram-main-content">
                    <div className="co-ram-header">
                        <h1 className="co-ram-title">Report Analysis</h1>
                        <p className="co-ram-subtitle">Choose the type of analysis you want to generate</p>
                    </div>

                    <div className="co-ram-cards-container">
                        <div className="co-ram-card" onClick={handleNavigateToCompanyWise}>
                            <div className="co-ram-card-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9,22 9,12 15,12 15,22"></polyline>
                                </svg>
                            </div>
                            <h3 className="co-ram-card-title">Company Wise Report</h3>
                            <p className="co-ram-card-description">
                                Generate detailed reports based on company recruitment data, 
                                including placement statistics and company performance metrics.
                            </p>
                            <button className="co-ram-card-button">
                                View Company Reports
                            </button>
                        </div>

                        <div className="co-ram-card" onClick={handleNavigateToStudentWise}>
                            <div className="co-ram-card-icon">
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                            </div>
                            <h3 className="co-ram-card-title">Student Wise Report</h3>
                            <p className="co-ram-card-description">
                                Generate comprehensive reports based on individual student data, 
                                including academic performance and placement outcomes.
                            </p>
                            <button className="co-ram-card-button">
                                View Student Reports
                            </button>
                        </div>
                    </div>

                    <div className="co-ram-info-section">
                        <div className="co-ram-info-card">
                            <h4>Quick Statistics</h4>
                            <div className="co-ram-stats-grid">
                                <div className="co-ram-stat-item">
                                    <span className="co-ram-stat-number">150+</span>
                                    <span className="co-ram-stat-label">Students Placed</span>
                                </div>
                                <div className="co-ram-stat-item">
                                    <span className="co-ram-stat-number">25+</span>
                                    <span className="co-ram-stat-label">Partner Companies</span>
                                </div>
                                <div className="co-ram-stat-item">
                                    <span className="co-ram-stat-number">85%</span>
                                    <span className="co-ram-stat-label">Placement Rate</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default CoReportAnalysismain;