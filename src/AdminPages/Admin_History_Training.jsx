import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';
import Adnavbar from '../components/Navbar/Adnavbar';
import Adsidebar from '../components/Sidebar/Adsidebar';
import styles from './Admin_History_Training.module.css';
import Adminicon from '../assets/Adminicon.png';
import AdminAddTrainingIcon from '../assets/ad_addtrainingicon.svg';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import mongoDBService from '../services/mongoDBService.jsx';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

const DeleteConfirmationPopup = ({ onClose, onConfirm, isDeleting }) => (
    <div className={styles['Admin-ht-popup-overlay']}>
        <div className={styles['Admin-ht-popup-container']}>
            <div className={styles['Admin-ht-popup-header']}>Delete Training History</div>
            <div className={styles['Admin-ht-popup-body']}>
                <div className={styles['Admin-ht-warning-icon']}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className={styles['Admin-ht-warning-icon--circle']} cx="26" cy="26" r="25" fill="none" />
                        <path className={styles['Admin-ht-warning-icon--exclamation']} d="M26 16v12M26 34v2" stroke="#ffffff" strokeWidth="3" fill="none" />
                    </svg>
                </div>
                <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#333', fontWeight: 600 }}>Are you sure?</h2>
                <p style={{ margin: 0, color: '#888', fontSize: 16 }}>
                    Delete this training history?
                </p>
            </div>
            <div className={styles['Admin-ht-popup-footer']}>
                <button
                    onClick={onClose}
                    className={styles['Admin-ht-popup-cancel-btn']}
                    disabled={isDeleting}
                >
                    Discard
                </button>
                <button
                    onClick={onConfirm}
                    className={styles['Admin-ht-popup-delete-btn']}
                    disabled={isDeleting}
                >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    </div>
);

const DeleteSuccessPopup = ({ onClose }) => (
    <div className={styles['Admin-ht-popup-overlay']}>
        <div className={styles['Admin-ht-popup-container']}>
            <div className={styles['Admin-ht-popup-header']}>Deleted !</div>
            <div className={styles['Admin-ht-popup-body']}>
                <div className={styles['Admin-ht-icon-wrapper']}>
                    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </div>
                <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#000', fontWeight: 700 }}>History Deleted</h2>
                <p style={{ margin: 0, color: '#888', fontSize: 16 }}>The training history has been deleted successfully!</p>
            </div>
            <div className={styles['Admin-ht-popup-footer']}>
                <button onClick={onClose} className={styles['Admin-ht-popup-close-btn']}>Close</button>
            </div>
        </div>
    </div>
);

function AdminHistoryTraining({ onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    useAdminAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Get company name from navigation state
    const companyFromState = location?.state?.companyName || '';

    // Filter states
    const [filterCourse, setFilterCourse] = useState('');
    const [filterBatch, setFilterBatch] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    // Focus states
    const [courseFocused, setCourseFocused] = useState(false);
    const [batchFocused, setBatchFocused] = useState(false);
    const [startDateFocused, setStartDateFocused] = useState(false);
    const [endDateFocused, setEndDateFocused] = useState(false);

    // Dropdown options
    const [courseOptions, setCourseOptions] = useState([]);
    const [batchOptions, setBatchOptions] = useState([]);

    const [showExportMenu, setShowExportMenu] = useState(false);
    const [activePopup, setActivePopup] = useState(null);
    const [deleteInProgress, setDeleteInProgress] = useState(false);
    const [exportPopupState, setExportPopupState] = useState('none');
    const [exportProgress, setExportProgress] = useState(0);
    const [exportType, setExportType] = useState('Excel');
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Training history data
    const [trainingHistory, setTrainingHistory] = useState([]);
    const [selectedHistoryIds, setSelectedHistoryIds] = useState(new Set());

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    useEffect(() => {
        const handleCloseSidebar = () => {
            setIsSidebarOpen(false);
        };
        window.addEventListener('closeSidebar', handleCloseSidebar);
        return () => {
            window.removeEventListener('closeSidebar', handleCloseSidebar);
        };
    }, []);

    const fetchTrainingHistory = useCallback(async () => {
        try {
            // Fetch scheduled trainings from trainning_schedule collection
            const schedules = await mongoDBService.getScheduledTrainings();
            const normalizedSchedules = Array.isArray(schedules) ? schedules : [];

            const historyList = [];
            const courseSet = new Set();
            const batchSet = new Set();

            // Filter schedules for the selected company
            const companySchedules = companyFromState
                ? normalizedSchedules.filter(
                    (s) => (s?.companyName || '').toString().trim().toLowerCase() === companyFromState.toLowerCase()
                )
                : normalizedSchedules;

            companySchedules.forEach((schedule) => {
                const companyName = (schedule?.companyName || '').toString().trim();
                const phases = Array.isArray(schedule?.phases) ? schedule.phases : [];
                const batches = Array.isArray(schedule?.batches) ? schedule.batches : [];

                // Add batches to options
                batches.forEach(batch => {
                    if (batch?.batchName) {
                        batchSet.add(batch.batchName);
                    }
                    if (batch?.applicableYear) {
                        batchSet.add(batch.applicableYear);
                    }
                });

                // Process each phase
                phases.forEach((phase, phaseIdx) => {
                    const phaseNumber = phase?.phaseNumber || `Phase ${phaseIdx + 1}`;
                    const trainer = phase?.trainer || '-';
                    const applicableYear = phase?.applicableYear || '-';
                    const phaseStartDate = phase?.startDate || schedule?.startDate || '-';
                    const phaseEndDate = phase?.endDate || schedule?.endDate || '-';
                    const phaseDuration = phase?.duration || '-';
                    const applicableCourses = Array.isArray(phase?.applicableCourses) ? phase.applicableCourses : [];

                    // Add courses to options
                    applicableCourses.forEach(course => {
                        if (course) courseSet.add(course);
                    });

                    // Create a history entry for each course in the phase
                    if (applicableCourses.length > 0) {
                        applicableCourses.forEach((course, courseIdx) => {
                            const batchDisplay = batches.length > 0
                                ? batches.map(b => b.batchName || b.applicableYear).filter(Boolean).join(', ')
                                : applicableYear;

                            historyList.push({
                                _id: `${schedule._id}-${phaseIdx}-${courseIdx}`,
                                scheduleId: schedule._id,
                                companyName,
                                courseName: course || '-',
                                startDate: phaseStartDate,
                                endDate: phaseEndDate,
                                trainer: trainer,
                                phase: phaseNumber,
                                batch: batchDisplay || '-',
                                duration: phaseDuration
                            });
                        });
                    } else {
                        // If no courses, still create one entry for the phase
                        const batchDisplay = batches.length > 0
                            ? batches.map(b => b.batchName || b.applicableYear).filter(Boolean).join(', ')
                            : applicableYear;

                        historyList.push({
                            _id: `${schedule._id}-${phaseIdx}`,
                            scheduleId: schedule._id,
                            companyName,
                            courseName: '-',
                            startDate: phaseStartDate,
                            endDate: phaseEndDate,
                            trainer: trainer,
                            phase: phaseNumber,
                            batch: batchDisplay || '-',
                            duration: phaseDuration
                        });
                    }
                });
            });

            setTrainingHistory(historyList);
            setCourseOptions(['', ...Array.from(courseSet).sort()]);
            setBatchOptions(['', ...Array.from(batchSet).sort()]);
        } catch (error) {
            console.error("Failed to fetch training history:", error);
            setTrainingHistory([]);
        } finally {
            setIsInitialLoading(false);
        }
    }, [companyFromState]);

    useEffect(() => {
        fetchTrainingHistory();
    }, [fetchTrainingHistory]);

    const handleHistorySelect = (id) => {
        setSelectedHistoryIds(prevIds => {
            const newIds = new Set(prevIds);
            if (newIds.has(id)) {
                newIds.delete(id);
            } else {
                newIds.add(id);
            }
            return newIds;
        });
    };

    const isHistorySelected = selectedHistoryIds.size > 0;

    const handleEdit = () => {
        if (companyFromState) {
            navigate('/admin-add-training', {
                state: {
                    editMode: true,
                    companyName: companyFromState
                }
            });
        } else {
            alert("No company selected. Please go back and select a company.");
        }
    };

    const handleDeleteClick = () => {
        if (companyFromState && selectedHistoryIds.size > 0) {
            setActivePopup('deleteWarning');
        } else {
            alert("Please select history entries to delete.");
        }
    };

    const confirmDelete = async () => {
        setDeleteInProgress(true);
        try {
            // Get unique schedule IDs from selected history entries
            const scheduleIds = new Set();
            selectedHistoryIds.forEach(id => {
                const history = trainingHistory.find(h => h._id === id);
                if (history?.scheduleId) {
                    scheduleIds.add(history.scheduleId);
                }
            });

            const promises = Array.from(scheduleIds).map(id =>
                mongoDBService.deleteScheduledTraining(id)
            );
            await Promise.all(promises);

            await fetchTrainingHistory();
            setSelectedHistoryIds(new Set());
            setActivePopup('deleteSuccess');
        } catch (error) {
            console.error("Failed to delete training history:", error);
            alert("An error occurred while deleting. Please try again.");
            setActivePopup(null);
        } finally {
            setDeleteInProgress(false);
        }
    };

    const closePopup = () => {
        setActivePopup(null);
    };

    const handleViewHistory = (history) => {
        navigate('/admin-training-history/view', {
            state: {
                viewMode: true,
                historyData: history
            }
        });
    };

    const filteredHistory = trainingHistory.filter(history => {
        const courseMatch = filterCourse === '' || history.courseName.toLowerCase().includes(filterCourse.toLowerCase());
        const batchMatch = filterBatch === '' || history.batch.toLowerCase().includes(filterBatch.toLowerCase());
        const startDateMatch = filterStartDate === '' || history.startDate === filterStartDate;
        const endDateMatch = filterEndDate === '' || history.endDate === filterEndDate;

        return courseMatch && batchMatch && startDateMatch && endDateMatch;
    });

    const exportToExcel = async () => {
        setShowExportMenu(false);
        if (!filteredHistory.length) {
            alert('No records available for export.');
            return;
        }

        setExportType('Excel');
        setExportPopupState('progress');
        setExportProgress(0);

        const progressInterval = setInterval(() => {
            setExportProgress((prevProgress) => {
                if (prevProgress >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prevProgress + 15;
            });
        }, 100);

        try {
            await new Promise((resolve) => setTimeout(resolve, 300));

            const data = filteredHistory.map((history, index) => [
                index + 1,
                history.courseName,
                history.startDate,
                history.endDate,
                history.trainer,
                history.phase,
                history.batch,
                history.duration
            ]);
            const header = ["S.No", "Course", "Start Date", "End Date", "Trainer", "Phase", "Batch", "Duration"];
            const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Training History");
            XLSX.writeFile(wb, "Training_History_Report.xlsx");

            clearInterval(progressInterval);
            setExportProgress(100);
            await new Promise((resolve) => setTimeout(resolve, 300));
            setExportPopupState('success');
        } catch (error) {
            clearInterval(progressInterval);
            console.error('Export to Excel failed:', error);
            setExportPopupState('failed');
        }
    };

    const exportToPDF = async () => {
        setShowExportMenu(false);
        if (!filteredHistory.length) {
            alert('No records available for export.');
            return;
        }

        setExportType('PDF');
        setExportPopupState('progress');
        setExportProgress(0);

        const progressInterval = setInterval(() => {
            setExportProgress((prevProgress) => {
                if (prevProgress >= 90) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prevProgress + 15;
            });
        }, 100);

        try {
            await new Promise((resolve) => setTimeout(resolve, 300));

            const doc = new jsPDF('landscape');
            const columns = ["S.No", "Course", "Start Date", "End Date", "Trainer", "Phase", "Batch", "Duration"];
            const rows = filteredHistory.map((history, index) => [
                index + 1,
                history.courseName,
                history.startDate,
                history.endDate,
                history.trainer,
                history.phase,
                history.batch,
                history.duration
            ]);
            doc.text("Training History Report", 14, 15);
            autoTable(doc, { head: [columns], body: rows, startY: 20, styles: { fontSize: 8 } });
            doc.save("Training_History_Report.pdf");

            clearInterval(progressInterval);
            setExportProgress(100);
            await new Promise((resolve) => setTimeout(resolve, 300));
            setExportPopupState('success');
        } catch (error) {
            clearInterval(progressInterval);
            console.error('Export to PDF failed:', error);
            setExportPopupState('failed');
        }
    };

    // Get current company name for history section header
    const currentCompanyName = companyFromState || 'COMPANY NAME';

    return (
        <>
            {activePopup === 'deleteWarning' && (
                <DeleteConfirmationPopup
                    onClose={closePopup}
                    onConfirm={confirmDelete}
                    isDeleting={deleteInProgress}
                />
            )}
            {activePopup === 'deleteSuccess' && (
                <DeleteSuccessPopup onClose={closePopup} />
            )}
            {isSidebarOpen && (
                <div
                    className={styles['Admin-ht-overlay']}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            <Adnavbar Adminicon={Adminicon} onLogout={onLogout} onToggleSidebar={toggleSidebar} />
            <div className={styles['Admin-ht-layout']}>
                <Adsidebar isOpen={isSidebarOpen} onLogout={onLogout} />
                <div className={styles['Admin-ht-main-content']}>
                    <div className={styles['Admin-ht-top-card']}>
                        {/* Training Companies Card */}
                        <div
                            className={`${styles['Admin-ht-action-addcard']} ${styles['Admin-ht-add-card']}`}
                            onClick={() => navigate('/admin-training-company')}
                        >
                            <div className={styles['Admin-ht-add-icon']}>
                                <img src={AdminAddTrainingIcon} alt="Training Companies" />
                            </div>
                            <h4 className={styles['Admin-ht-add-header']}>
                                Training<br/>Companies
                            </h4>
                            <p className={styles['Admin-ht-add-description']}>
                                Click to Manage<br/>Training Companies
                            </p>
                        </div>

                        {/* Filter Section */}
                        <div className={styles['Admin-ht-filter-section']}>
                            <div className={styles['Admin-ht-filter-header-container']}>
                                <div className={styles['Admin-ht-filter-header']}>Training companies</div>
                            </div>
                            <div className={styles['Admin-ht-filter-content']}>
                                {/* Course */}
                                <div className={styles['Admin-ht-input-wrapper']}>
                                    <label className={styles['Admin-ht-static-label']}>Course</label>
                                    <div className={`${styles['Admin-ht-text-container']} ${courseFocused ? styles['is-focused'] : ''}`}>
                                        <select
                                            className={styles['Admin-ht-text']}
                                            value={filterCourse}
                                            onChange={(e) => setFilterCourse(e.target.value)}
                                            onFocus={() => setCourseFocused(true)}
                                            onBlur={() => setCourseFocused(false)}
                                        >
                                            {courseOptions.map((opt, idx) => (
                                                <option key={idx} value={opt}>{opt === '' ? 'Select Course' : opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Batch */}
                                <div className={styles['Admin-ht-input-wrapper']}>
                                    <label className={styles['Admin-ht-static-label']}>Batch</label>
                                    <div className={`${styles['Admin-ht-text-container']} ${batchFocused ? styles['is-focused'] : ''}`}>
                                        <select
                                            className={styles['Admin-ht-text']}
                                            value={filterBatch}
                                            onChange={(e) => setFilterBatch(e.target.value)}
                                            onFocus={() => setBatchFocused(true)}
                                            onBlur={() => setBatchFocused(false)}
                                        >
                                            {batchOptions.map((opt, idx) => (
                                                <option key={idx} value={opt}>{opt === '' ? 'Select Batch' : opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Start Date */}
                                <div className={styles['Admin-ht-input-wrapper']}>
                                    <label className={styles['Admin-ht-static-label']}>Start Date</label>
                                    <div className={`${styles['Admin-ht-text-container']} ${startDateFocused ? styles['is-focused'] : ''}`}>
                                        <input
                                            type="date"
                                            className={styles['Admin-ht-text']}
                                            value={filterStartDate}
                                            onChange={(e) => setFilterStartDate(e.target.value)}
                                            onFocus={() => setStartDateFocused(true)}
                                            onBlur={() => setStartDateFocused(false)}
                                        />
                                    </div>
                                </div>

                                {/* End Date */}
                                <div className={styles['Admin-ht-input-wrapper']}>
                                    <label className={styles['Admin-ht-static-label']}>End Date</label>
                                    <div className={`${styles['Admin-ht-text-container']} ${endDateFocused ? styles['is-focused'] : ''}`}>
                                        <input
                                            type="date"
                                            className={styles['Admin-ht-text']}
                                            value={filterEndDate}
                                            onChange={(e) => setFilterEndDate(e.target.value)}
                                            onFocus={() => setEndDateFocused(true)}
                                            onBlur={() => setEndDateFocused(false)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Cards Section */}
                        <div className={styles['Admin-ht-action-cards-section']}>
                            {/* Edit Card */}
                            <div className={styles['Admin-ht-action-card']}>
                                <h4 className={styles['Admin-ht-action-header']}>Editing</h4>
                                <p className={styles['Admin-ht-action-description']}>
                                    Select The<br/>Company<br/>Before<br/>Editing
                                </p>
                                <button
                                    className={`${styles['Admin-ht-action-btn']} ${styles['Admin-ht-edit-btn']}`}
                                    onClick={handleEdit}
                                >
                                    Edit
                                </button>
                            </div>

                            {/* Delete Card */}
                            <div className={styles['Admin-ht-action-card']}>
                                <h4 className={styles['Admin-ht-action-header']}>Deleting</h4>
                                <p className={styles['Admin-ht-action-description']}>
                                    Select The<br/>Company<br/>Before<br/>Deleting
                                </p>
                                <button
                                    className={`${styles['Admin-ht-action-btn']} ${styles['Admin-ht-delete-btn']}`}
                                    onClick={handleDeleteClick}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Training History Table Section */}
                    <div className={styles['Admin-ht-bottom-card']}>
                        <div className={styles['Admin-ht-table-header-row']}>
                            <h3 className={styles['Admin-ht-table-title']}># {currentCompanyName.toUpperCase()} HISTORY</h3>
                            <div className={styles['Admin-ht-table-actions']}>
                                <div className={styles['Admin-ht-print-button-container']}>
                                    <button
                                        className={styles['Admin-ht-print-btn']}
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                    >
                                        Print
                                    </button>
                                    {showExportMenu && (
                                        <div className={styles['Admin-ht-export-menu']}>
                                            <button onClick={exportToExcel}>Export to Excel</button>
                                            <button onClick={exportToPDF}>Export to PDF</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles['Admin-ht-table-container']}>
                            <table className={styles['Admin-ht-history-table']}>
                                <thead>
                                    <tr className={styles['Admin-ht-table-head-row']}>
                                        <th className={`${styles['Admin-ht-th']} ${styles['Admin-ht-sno']}`}>S.No</th>
                                        <th className={`${styles['Admin-ht-th']} ${styles['Admin-ht-course']}`}>Course</th>
                                        <th className={`${styles['Admin-ht-th']} ${styles['Admin-ht-startdate']}`}>Start Date</th>
                                        <th className={`${styles['Admin-ht-th']} ${styles['Admin-ht-enddate']}`}>End Date</th>
                                        <th className={`${styles['Admin-ht-th']} ${styles['Admin-ht-trainer']}`}>Trainer</th>
                                        <th className={`${styles['Admin-ht-th']} ${styles['Admin-ht-phase']}`}>Phase</th>
                                        <th className={`${styles['Admin-ht-th']} ${styles['Admin-ht-batch']}`}>Batch</th>
                                        <th className={`${styles['Admin-ht-th']} ${styles['Admin-ht-duration']}`}>Duration</th>
                                        <th className={`${styles['Admin-ht-th']} ${styles['Admin-ht-view']}`}>View</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isInitialLoading ? (
                                        <tr className={styles['Admin-ht-loading-row']}>
                                            <td colSpan="9" className={styles['Admin-ht-loading-cell']}>
                                                <div className={styles['Admin-ht-loading-wrapper']}>
                                                    <div className={styles['Admin-ht-spinner']}></div>
                                                    <span className={styles['Admin-ht-loading-text']}>Loading training history...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredHistory.length === 0 ? (
                                        <tr className={styles['Admin-ht-table-row']}>
                                            <td colSpan="9" className={styles['Admin-ht-td']} style={{ textAlign: 'center' }}>
                                                No training history found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredHistory.map((history, index) => (
                                            <tr
                                                key={history._id}
                                                className={`${styles['Admin-ht-table-row']} ${selectedHistoryIds.has(history._id) ? styles['Admin-ht-selected-row'] : ''}`}
                                            >
                                                <td className={`${styles['Admin-ht-td']} ${styles['Admin-ht-sno']}`}>{index + 1}</td>
                                                <td className={`${styles['Admin-ht-td']} ${styles['Admin-ht-course']}`}>{history.courseName}</td>
                                                <td className={`${styles['Admin-ht-td']} ${styles['Admin-ht-startdate']}`}>{history.startDate}</td>
                                                <td className={`${styles['Admin-ht-td']} ${styles['Admin-ht-enddate']}`}>{history.endDate}</td>
                                                <td className={`${styles['Admin-ht-td']} ${styles['Admin-ht-trainer']}`}>{history.trainer}</td>
                                                <td className={`${styles['Admin-ht-td']} ${styles['Admin-ht-phase']}`}>{history.phase}</td>
                                                <td className={`${styles['Admin-ht-td']} ${styles['Admin-ht-batch']}`}>{history.batch}</td>
                                                <td className={`${styles['Admin-ht-td']} ${styles['Admin-ht-duration']}`}>{history.duration}</td>
                                                <td className={`${styles['Admin-ht-td']} ${styles['Admin-ht-view']}`}>
                                                    <svg
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        style={{ cursor: 'pointer', margin: '0 auto', display: 'block' }}
                                                        onClick={() => handleViewHistory(history)}
                                                    >
                                                        <path d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z" fill="#4EA24E" opacity="0.3"/>
                                                        <circle cx="12" cy="12.5" r="3.5" fill="#4EA24E"/>
                                                    </svg>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <ExportProgressAlert
                isOpen={exportPopupState === 'progress'}
                onClose={() => {}}
                progress={exportProgress}
                exportType={exportType}
            />

            <ExportSuccessAlert
                isOpen={exportPopupState === 'success'}
                onClose={() => setExportPopupState('none')}
                exportType={exportType}
            />

            <ExportFailedAlert
                isOpen={exportPopupState === 'failed'}
                onClose={() => setExportPopupState('none')}
                exportType={exportType}
            />
        </>
    );
}

export default AdminHistoryTraining;
