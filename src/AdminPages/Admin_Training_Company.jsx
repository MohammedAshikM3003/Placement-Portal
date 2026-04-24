import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminAuth from '../utils/useAdminAuth';
import Adnavbar from '../components/Navbar/Adnavbar';
import Adsidebar from '../components/Sidebar/Adsidebar';
import styles from './Admin_Training_Company.module.css';
import Adminicon from '../assets/Adminicon.png';
import AdminAddTrainingCompany from '../assets/Admin_Add_Training_Company.svg';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import mongoDBService from '../services/mongoDBService.jsx';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

const DeleteConfirmationPopup = ({ onClose, onConfirm, selectedCount, isDeleting }) => (
    <div className={styles['Admin-tc-popup-overlay']}>
        <div className={styles['Admin-tc-popup-container']}>
            <div className={styles['Admin-tc-popup-header']}>Delete Company</div>
            <div className={styles['Admin-tc-popup-body']}>
                <div className={styles['Admin-tc-warning-icon']}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className={styles['Admin-tc-warning-icon--circle']} cx="26" cy="26" r="25" fill="none" />
                        <path className={styles['Admin-tc-warning-icon--exclamation']} d="M26 16v12M26 34v2" stroke="#ffffff" strokeWidth="3" fill="none" />
                    </svg>
                </div>
                <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#333', fontWeight: 600 }}>Are you sure?</h2>
                <p style={{ margin: 0, color: '#888', fontSize: 16 }}>
                    Delete {selectedCount} selected compan{selectedCount > 1 ? 'ies' : 'y'}?
                </p>
            </div>
            <div className={styles['Admin-tc-popup-footer']}>
                <button
                    onClick={onClose}
                    className={styles['Admin-tc-popup-cancel-btn']}
                    disabled={isDeleting}
                >
                    Discard
                </button>
                <button
                    onClick={onConfirm}
                    className={styles['Admin-tc-popup-delete-btn']}
                    disabled={isDeleting}
                >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
            </div>
        </div>
    </div>
);

const DeleteSuccessPopup = ({ onClose }) => (
    <div className={styles['Admin-tc-popup-overlay']}>
        <div className={styles['Admin-tc-popup-container']}>
            <div className={styles['Admin-tc-popup-header']}>Deleted !</div>
            <div className={styles['Admin-tc-popup-body']}>
                <div className={styles['Admin-tc-icon-wrapper']}>
                    <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </div>
                <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#000', fontWeight: 700 }}>Company Deleted</h2>
                <p style={{ margin: 0, color: '#888', fontSize: 16 }}>The selected company has been deleted successfully!</p>
            </div>
            <div className={styles['Admin-tc-popup-footer']}>
                <button onClick={onClose} className={styles['Admin-tc-popup-close-btn']}>Close</button>
            </div>
        </div>
    </div>
);

function AdminTrainingCompany({ onLogout }) {
    const navigate = useNavigate();
    useAdminAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Filter states
    const [tempFilterCompany, setTempFilterCompany] = useState('');
    const [tempFilterBranch, setTempFilterBranch] = useState('');
    const [tempFilterTraining, setTempFilterTraining] = useState('');
    const [tempFilterPhase, setTempFilterPhase] = useState('');

    // Focus states
    const [companyFocused, setCompanyFocused] = useState(false);
    const [branchFocused, setBranchFocused] = useState(false);
    const [trainingFocused, setTrainingFocused] = useState(false);
    const [phaseFocused, setPhaseFocused] = useState(false);

    // Applied filter states
    const [filterCompany, setFilterCompany] = useState('');
    const [filterBranch, setFilterBranch] = useState('');
    const [filterTraining, setFilterTraining] = useState('');
    const [filterPhase, setFilterPhase] = useState('');

    // Dropdown options
    const [companyOptions, setCompanyOptions] = useState([]);
    const [branchOptions, setBranchOptions] = useState([]);
    const [trainingOptions, setTrainingOptions] = useState([]);
    const [phaseOptions, setPhaseOptions] = useState([]);

    const [showExportMenu, setShowExportMenu] = useState(false);
    const [activePopup, setActivePopup] = useState(null);
    const [deleteInProgress, setDeleteInProgress] = useState(false);
    const [exportPopupState, setExportPopupState] = useState('none');
    const [exportProgress, setExportProgress] = useState(0);
    const [exportType, setExportType] = useState('Excel');
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Training companies data
    const [trainingCompanies, setTrainingCompanies] = useState([]);
    const [selectedCompanyIds, setSelectedCompanyIds] = useState(new Set());

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

    const fetchTrainingCompanies = useCallback(async () => {
        try {
            // Fetch scheduled trainings which contain company and phase info
            const schedules = await mongoDBService.getScheduledTrainings();
            const normalizedSchedules = Array.isArray(schedules) ? schedules : [];

            // Fetch trainings for company details (HR, location, courses, trainers) - this is the source of truth
            const trainings = await mongoDBService.getTrainings();
            const normalizedTrainings = Array.isArray(trainings) ? trainings : [];

            // Create a map of training companies data (source of truth for company details)
            const trainingDataMap = new Map();
            normalizedTrainings.forEach((training) => {
                const companyName = (training?.companyName || '').toString().trim().toLowerCase();
                if (companyName) {
                    trainingDataMap.set(companyName, training);
                }
            });

            // Create a map to store unique companies
            const companyMap = new Map();
            const companySet = new Set();
            const branchSet = new Set();
            const trainingSet = new Set();
            const phaseSet = new Set();

            // First, add all companies from training_companies collection (source of truth)
            normalizedTrainings.forEach((training) => {
                const companyName = (training?.companyName || '').toString().trim();
                if (!companyName) return;

                const courses = Array.isArray(training?.courses) ? training.courses : [];
                const trainers = Array.isArray(training?.trainers) ? training.trainers : [];

                companySet.add(companyName);
                trainingSet.add(companyName);

                companyMap.set(companyName, {
                    _id: training._id,
                    scheduleId: '',
                    companyName,
                    companyHR: training?.companyHR || training?.hrName || '-',
                    location: training?.location || '-',
                    coursesCount: courses.length,
                    trainersCount: trainers.length,
                    branch: '-',
                    trainingData: training,
                    courses: courses,
                    trainers: trainers
                });
            });

            // Then, update with schedule info but keep training_companies data for HR, location, courses, trainers
            normalizedSchedules.forEach((schedule) => {
                const companyName = (schedule?.companyName || '').toString().trim();
                if (!companyName) return;

                // Get branches from batches
                const branches = [];
                if (Array.isArray(schedule?.batches)) {
                    schedule.batches.forEach(batch => {
                        if (batch?.branch) {
                            branches.push(batch.branch);
                            branchSet.add(batch.branch);
                        }
                    });
                }

                // Get phases
                const phases = Array.isArray(schedule?.phases) ? schedule.phases : [];
                phases.forEach((phase, idx) => {
                    const phaseName = phase?.phaseName || `Phase ${idx + 1}`;
                    phaseSet.add(phaseName);
                });

                companySet.add(companyName);
                trainingSet.add(companyName);

                // Get training data from training_companies collection
                const trainingData = trainingDataMap.get(companyName.toLowerCase());

                if (companyMap.has(companyName)) {
                    // Update existing entry with schedule ID and branch, keep training_companies data
                    const existing = companyMap.get(companyName);
                    existing.scheduleId = schedule._id;
                    if (branches.length > 0) {
                        existing.branch = branches.join(', ');
                    }
                } else {
                    // Company only in schedule but not in training_companies - use training data if available
                    const courses = trainingData?.courses || [];
                    const trainers = trainingData?.trainers || [];

                    companyMap.set(companyName, {
                        _id: schedule._id,
                        scheduleId: schedule._id,
                        companyName,
                        companyHR: trainingData?.companyHR || schedule?.companyHR || schedule?.hrName || '-',
                        location: trainingData?.location || schedule?.location || '-',
                        coursesCount: courses.length,
                        trainersCount: trainers.length,
                        branch: branches.length > 0 ? branches.join(', ') : '-',
                        trainingData: trainingData || schedule,
                        courses: courses,
                        trainers: trainers
                    });
                }
            });

            const companiesList = Array.from(companyMap.values());

            setTrainingCompanies(companiesList);
            setCompanyOptions(['', ...Array.from(companySet).sort()]);
            setBranchOptions(['', ...Array.from(branchSet).sort()]);
            setTrainingOptions(['', ...Array.from(trainingSet).sort()]);
            setPhaseOptions(['', ...Array.from(phaseSet).sort()]);
        } catch (error) {
            console.error("Failed to fetch training companies:", error);
            setTrainingCompanies([]);
        } finally {
            setIsInitialLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrainingCompanies();
    }, [fetchTrainingCompanies]);

    useEffect(() => {
        setFilterCompany(tempFilterCompany);
        setFilterBranch(tempFilterBranch);
        setFilterTraining(tempFilterTraining);
        setFilterPhase(tempFilterPhase);
    }, [tempFilterCompany, tempFilterBranch, tempFilterTraining, tempFilterPhase]);

    const handleCompanySelect = (id) => {
        setSelectedCompanyIds(prevIds => {
            const newIds = new Set(prevIds);
            if (newIds.has(id)) {
                newIds.delete(id);
            } else {
                newIds.add(id);
            }
            return newIds;
        });
    };

    const isCompanySelected = selectedCompanyIds.size > 0;
    const isSingleCompanySelected = selectedCompanyIds.size === 1;

    const handleEdit = () => {
        if (selectedCompanyIds.size === 1) {
            const companyId = Array.from(selectedCompanyIds)[0];
            const company = trainingCompanies.find(c => c._id === companyId);

            if (!company) {
                alert("Selected company could not be found. Please refresh and try again.");
                return;
            }

            navigate('/admin-add-training', {
                state: {
                    editMode: true,
                    editingTraining: company.trainingData || {
                        _id: company.trainingId,
                        companyName: company.companyName,
                        courses: [],
                        trainers: []
                    }
                }
            });
        } else if (selectedCompanyIds.size === 0) {
            alert("Please select a company to Edit.");
        } else {
            alert("Please select only one company to Edit.");
        }
    };

    const handleDeleteClick = () => {
        if (selectedCompanyIds.size > 0) {
            setActivePopup('deleteWarning');
        } else {
            alert("Please select company(s) to Delete.");
        }
    };

    const confirmDelete = async () => {
        setDeleteInProgress(true);
        try {
            // Get unique schedule IDs to delete
            const scheduleIds = new Set();
            Array.from(selectedCompanyIds).forEach(id => {
                const company = trainingCompanies.find(c => c._id === id);
                if (company?.scheduleId) {
                    scheduleIds.add(company.scheduleId);
                }
            });

            const promises = Array.from(scheduleIds).map(id =>
                mongoDBService.deleteScheduledTraining(id)
            );
            await Promise.all(promises);

            await fetchTrainingCompanies();
            setSelectedCompanyIds(new Set());
            setActivePopup('deleteSuccess');
        } catch (error) {
            console.error("Failed to delete training companies:", error);
            alert("An error occurred while deleting. Please try again.");
            setActivePopup(null);
        } finally {
            setDeleteInProgress(false);
        }
    };

    const closePopup = () => {
        setActivePopup(null);
    };

    const handleAddCompany = () => {
        navigate('/admin-add-training');
    };

    const handleViewCompany = (company) => {
        const query = new URLSearchParams({
            mode: 'view',
            company: company.companyName || ''
        });

        if (company.scheduleId) {
            query.set('scheduleId', company.scheduleId);
        }

        navigate(`/admin-schedule-training?${query.toString()}`);
    };

    const filteredCompanies = trainingCompanies.filter(company => {
        const companyMatch = filterCompany === '' || company.companyName.toLowerCase().includes(filterCompany.toLowerCase());
        const branchMatch = filterBranch === '' || company.branch.toLowerCase().includes(filterBranch.toLowerCase());
        const trainingMatch = filterTraining === '' || company.trainingName.toLowerCase().includes(filterTraining.toLowerCase());
        const phaseMatch = filterPhase === '' || company.phaseName === filterPhase;

        return companyMatch && branchMatch && trainingMatch && phaseMatch;
    });

    const exportToExcel = async () => {
        setShowExportMenu(false);
        if (!filteredCompanies.length) {
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

            const data = filteredCompanies.map(company => [
                company.companyName,
                company.companyHR || '-',
                company.location || '-',
                company.coursesCount || 0,
                company.trainersCount || 0
            ]);
            const header = ["Company Name", "Company HR", "Location", "Courses", "Trainers"];
            const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Training Companies");
            XLSX.writeFile(wb, "Training_Companies_Report.xlsx");

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
        if (!filteredCompanies.length) {
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
            const columns = ["Company Name", "Company HR", "Location", "Courses", "Trainers"];
            const rows = filteredCompanies.map(company => [
                company.companyName,
                company.companyHR || '-',
                company.location || '-',
                company.coursesCount || 0,
                company.trainersCount || 0
            ]);
            doc.text("Training Companies Report", 14, 15);
            autoTable(doc, { head: [columns], body: rows, startY: 20, styles: { fontSize: 8 } });
            doc.save("Training_Companies_Report.pdf");

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

    return (
        <>
            {activePopup === 'deleteWarning' && (
                <DeleteConfirmationPopup
                    onClose={closePopup}
                    onConfirm={confirmDelete}
                    selectedCount={selectedCompanyIds.size}
                    isDeleting={deleteInProgress}
                />
            )}
            {activePopup === 'deleteSuccess' && (
                <DeleteSuccessPopup onClose={closePopup} />
            )}
            {isSidebarOpen && (
                <div
                    className={styles['Admin-tc-overlay']}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            <Adnavbar Adminicon={Adminicon} onLogout={onLogout} onToggleSidebar={toggleSidebar} />
            <div className={styles['Admin-tc-layout']}>
                <Adsidebar isOpen={isSidebarOpen} onLogout={onLogout} />
                <div className={styles['Admin-tc-main-content']}>
                    <div className={styles['Admin-tc-top-card']}>

                        {/* Add Company Card */}
                        <div className={`${styles['Admin-tc-action-addcard']} ${styles['Admin-tc-add-card']}`} onClick={handleAddCompany}>
                            <div className={styles['Admin-tc-add-icon']}>
                                <img src={AdminAddTrainingCompany} alt="Add Company" />
                            </div>
                            <h4 className={styles['Admin-tc-add-header']}>Add <br/> Company</h4>
                            <p className={styles['Admin-tc-add-description']}>
                                Add new Training<br/>Company
                            </p>
                        </div>

                        {/* Filter Section */}
                        <div className={styles['Admin-tc-filter-section']}>
                            <div className={styles['Admin-tc-filter-header-container']}>
                                <div className={styles['Admin-tc-filter-header']}>Training Company</div>
                            </div>
                            <div className={styles['Admin-tc-filter-content']}>
                                {/* Company Name Filter */}
                                <div className={styles['Admin-tc-input-wrapper']}>
                                    <label className={styles['Admin-tc-static-label']}>Company Name</label>
                                    <div className={`${styles['Admin-tc-text-container']} ${companyFocused ? styles['is-focused'] : ''}`}>
                                        <select
                                            className={styles['Admin-tc-text']}
                                            value={tempFilterCompany}
                                            onChange={(e) => setTempFilterCompany(e.target.value)}
                                            onFocus={() => setCompanyFocused(true)}
                                            onBlur={() => setCompanyFocused(false)}
                                        >
                                            {companyOptions.map((opt, idx) => (
                                                <option key={idx} value={opt}>{opt === '' ? 'All Companies' : opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Branch Filter */}
                                <div className={styles['Admin-tc-input-wrapper']}>
                                    <label className={styles['Admin-tc-static-label']}>Branch</label>
                                    <div className={`${styles['Admin-tc-text-container']} ${branchFocused ? styles['is-focused'] : ''}`}>
                                        <select
                                            className={styles['Admin-tc-text']}
                                            value={tempFilterBranch}
                                            onChange={(e) => setTempFilterBranch(e.target.value)}
                                            onFocus={() => setBranchFocused(true)}
                                            onBlur={() => setBranchFocused(false)}
                                        >
                                            {branchOptions.map((opt, idx) => (
                                                <option key={idx} value={opt}>{opt === '' ? 'All Branches' : opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Training Name Filter */}
                                <div className={styles['Admin-tc-input-wrapper']}>
                                    <label className={styles['Admin-tc-static-label']}>Training Name</label>
                                    <div className={`${styles['Admin-tc-text-container']} ${trainingFocused ? styles['is-focused'] : ''}`}>
                                        <select
                                            className={styles['Admin-tc-text']}
                                            value={tempFilterTraining}
                                            onChange={(e) => setTempFilterTraining(e.target.value)}
                                            onFocus={() => setTrainingFocused(true)}
                                            onBlur={() => setTrainingFocused(false)}
                                        >
                                            {trainingOptions.map((opt, idx) => (
                                                <option key={idx} value={opt}>{opt === '' ? 'All Trainings' : opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Phase Filter */}
                                <div className={styles['Admin-tc-input-wrapper']}>
                                    <label className={styles['Admin-tc-static-label']}>Phase</label>
                                    <div className={`${styles['Admin-tc-text-container']} ${phaseFocused ? styles['is-focused'] : ''}`}>
                                        <select
                                            className={styles['Admin-tc-text']}
                                            value={tempFilterPhase}
                                            onChange={(e) => setTempFilterPhase(e.target.value)}
                                            onFocus={() => setPhaseFocused(true)}
                                            onBlur={() => setPhaseFocused(false)}
                                        >
                                            {phaseOptions.map((opt, idx) => (
                                                <option key={idx} value={opt}>{opt === '' ? 'All Phases' : opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Cards Section */}
                        <div className={styles['Admin-tc-action-cards-section']}>
                            {/* Edit Card */}
                            <div className={styles['Admin-tc-action-card']}>
                                <h4 className={styles['Admin-tc-action-header']}>Editing</h4>
                                <p className={styles['Admin-tc-action-description']}>
                                    Select The<br/>Company<br/>Before<br/>Editing
                                </p>
                                <button
                                    className={`${styles['Admin-tc-action-btn']} ${styles['Admin-tc-edit-btn']}`}
                                    onClick={handleEdit}
                                    disabled={!isSingleCompanySelected}
                                >
                                    Edit
                                </button>
                            </div>

                            {/* Delete Card */}
                            <div className={styles['Admin-tc-action-card']}>
                                <h4 className={styles['Admin-tc-action-header']}>Deleting</h4>
                                <p className={styles['Admin-tc-action-description']}>
                                    Select The<br/>Company<br/>Before<br/>Deleting
                                </p>
                                <button
                                    className={`${styles['Admin-tc-action-btn']} ${styles['Admin-tc-delete-btn']}`}
                                    onClick={handleDeleteClick}
                                    disabled={!isCompanySelected}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Training Company Table Section */}
                    <div className={styles['Admin-tc-bottom-card']}>
                        <div className={styles['Admin-tc-table-header-row']}>
                            <h3 className={styles['Admin-tc-table-title']}>TRAINING COMPANY</h3>
                            <div className={styles['Admin-tc-table-actions']}>
                                <div className={styles['Admin-tc-print-button-container']}>
                                    <button
                                        className={styles['Admin-tc-print-btn']}
                                        onClick={() => setShowExportMenu(!showExportMenu)}
                                    >
                                        Print
                                    </button>
                                    {showExportMenu && (
                                        <div className={styles['Admin-tc-export-menu']}>
                                            <button onClick={exportToExcel}>Export to Excel</button>
                                            <button onClick={exportToPDF}>Export to PDF</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className={styles['Admin-tc-table-container']}>
                            <table className={styles['Admin-tc-students-table']}>
                                <thead>
                                    <tr className={styles['Admin-tc-table-head-row']}>
                                        <th className={`${styles['Admin-tc-th']} ${styles['Admin-tc-checkbox']}`}>SELECT</th>
                                        <th className={`${styles['Admin-tc-th']} ${styles['Admin-tc-sno']}`}>S.No</th>
                                        <th className={`${styles['Admin-tc-th']} ${styles['Admin-tc-company']}`}>Company Name</th>
                                        <th className={`${styles['Admin-tc-th']} ${styles['Admin-tc-hr']}`}>Company HR</th>
                                        <th className={`${styles['Admin-tc-th']} ${styles['Admin-tc-location']}`}>Location</th>
                                        <th className={`${styles['Admin-tc-th']} ${styles['Admin-tc-courses']}`}>courses</th>
                                        <th className={`${styles['Admin-tc-th']} ${styles['Admin-tc-trainers']}`}>Trainers</th>
                                        <th className={`${styles['Admin-tc-th']} ${styles['Admin-tc-history']}`}>History</th>
                                        <th className={`${styles['Admin-tc-th']} ${styles['Admin-tc-view']}`}>View</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isInitialLoading ? (
                                        <tr className={styles['Admin-tc-loading-row']}>
                                            <td colSpan="9" className={styles['Admin-tc-loading-cell']}>
                                                <div className={styles['Admin-tc-loading-wrapper']}>
                                                    <div className={styles['Admin-tc-spinner']}></div>
                                                    <span className={styles['Admin-tc-loading-text']}>Loading training companies...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredCompanies.length === 0 ? (
                                        <tr className={styles['Admin-tc-table-row']}>
                                            <td colSpan="9" className={styles['Admin-tc-td']} style={{ textAlign: 'center' }}>
                                                No companies found matching your criteria.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCompanies.map((company, index) => (
                                            <tr
                                                key={company._id}
                                                className={`${styles['Admin-tc-table-row']} ${selectedCompanyIds.has(company._id) ? styles['Admin-tc-selected-row'] : ''}`}
                                                onClick={() => handleCompanySelect(company._id)}
                                            >
                                                <td className={`${styles['Admin-tc-td']} ${styles['Admin-tc-checkbox']}`}>
                                                    <input
                                                        type="checkbox"
                                                        className={styles['Admin-tc-checkbox-input']}
                                                        checked={selectedCompanyIds.has(company._id)}
                                                        onChange={() => handleCompanySelect(company._id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </td>
                                                <td className={`${styles['Admin-tc-td']} ${styles['Admin-tc-sno']}`}>{index + 1}</td>
                                                <td className={`${styles['Admin-tc-td']} ${styles['Admin-tc-company']}`}>{company.companyName}</td>
                                                <td className={`${styles['Admin-tc-td']} ${styles['Admin-tc-hr']}`}>{company.companyHR || '-'}</td>
                                                <td className={`${styles['Admin-tc-td']} ${styles['Admin-tc-location']}`}>{company.location || '-'}</td>
                                                <td className={`${styles['Admin-tc-td']} ${styles['Admin-tc-courses']}`}>{company.coursesCount || 0}</td>
                                                <td className={`${styles['Admin-tc-td']} ${styles['Admin-tc-trainers']}`}>{company.trainersCount || 0}</td>
                                                <td className={`${styles['Admin-tc-td']} ${styles['Admin-tc-history']}`}>
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        style={{ cursor: 'pointer', margin: '0 auto', display: 'block' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate('/admin-training-history', {
                                                                state: { companyName: company.companyName }
                                                            });
                                                        }}
                                                    >
                                                        <path fill="#4EA24E" fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10S2 17.523 2 12m11-4a1 1 0 1 0-2 0v4a1 1 0 0 0 .293.707l3 3a1 1 0 0 0 1.414-1.414L13 11.586z" clipRule="evenodd"/>
                                                    </svg>
                                                </td>
                                                <td className={`${styles['Admin-tc-td']} ${styles['Admin-tc-view']}`}>
                                                    <svg
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        style={{ cursor: 'pointer', margin: '0 auto', display: 'block' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewCompany(company);
                                                        }}
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

export default AdminTrainingCompany;
