import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import Viewicon from "../assets/Viewicon.png";
import Dashcompanydrive from '../assets/Dashcompanydrive.png';
import PlacedStudentsCap from '../assets/PlacedStudentsCap.svg';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AdminBrowseStudenticon from "../assets/AdminBrowseStudenticon.png";
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import * as XLSX from 'xlsx';
import styles from './Coo_EligibleStudents.module.css';


// =========================================================================
// !!! START: EXPORT POPUP COMPONENTS (Copied from Coo_CompanyDrive.js) !!!
// =========================================================================

const ExportProgressPopup = ({ isOpen, operation, progress, onClose }) => {
    if (!isOpen) return null;

    const operationText = operation === 'excel' ? 'Exporting...' : 'Downloading...';
    const progressText = operation === 'excel' ? 'Exported' : 'Downloaded';

    // Calculate the stroke-dasharray for circular progress
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className={styles['co-es-export-popup-overlay']}>
            <div className={styles['co-es-export-popup-container']}>
                <div className={styles['co-es-export-popup-header']}>{operationText}</div>
                <div className={styles['co-es-export-popup-body']}>
                    <div className={styles['co-es-export-progress-circle']}>
                        <svg width="100" height="100" viewBox="0 0 100 100">
                            {/* Background circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="none"
                                stroke="#e0e0e0"
                                strokeWidth="8"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="50"
                                cy="50"
                                r={radius}
                                fill="none"
                                stroke="#d23b42"
                                strokeWidth="8"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                transform="rotate(-90 50 50)"
                                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                            />
                        </svg>
                        {/*<div className={styles['co-es-export-progress-text']}>{progress}%</div>*/}
                    </div>
                    <h2 className={styles['co-es-export-popup-title']}>{progressText} {progress}%</h2>
                    <p className={styles['co-es-export-popup-message']}>
                        The Details have been {operation === 'excel' ? 'Exporting...' : 'Downloading...'}
                    </p>
                    <p className={styles['co-es-export-popup-message']}>Please wait...</p>
                </div>
            </div>
        </div>
    );
};

const ExportSuccessPopup = ({ isOpen, operation, onClose }) => {
    if (!isOpen) return null;

    const title = operation === 'excel' ? 'Exported To Excel ✓' : 'PDF Downloaded ✓';
    const message = operation === 'excel'
        ? 'The Details have been Successfully Exported to Excel in your device.'
        : 'The Details have been Successfully Downloaded as PDF to your device.';
    const headerText = operation === 'excel' ? 'Exported!' : 'Downloaded!';

    return (
        <div className={styles['co-es-export-popup-overlay']}>
            <div className={styles['co-es-export-popup-container']}>
                <div className={styles['co-es-export-popup-header']}>{headerText}</div>
                <div className={styles['co-es-export-popup-body']}>
                    <div className={styles['co-es-export-success-icon']}>
                    <svg xmlns='http://www.w3.org/2000/svg' viewBox="0 0 52 52" fill="none">
                        <circle className={styles['co-es-success-icon--circle']} cx="26" cy="26" r="25"/>
                        <path className={styles['co-es-success-icon--check']} d="M14.1 27.2l7.1 7.2 16.7-16.8" fill="none"
                            />
                        </svg>
                    </div>
                    <h2 className={styles['co-es-export-popup-title']}>{title}</h2>
                    <p className={styles['co-es-export-popup-message']}>{message}</p>
                </div>
                <div className={styles['co-es-export-popup-footer']}>
                    <button onClick={onClose} className={styles['co-es-export-popup-close-btn']}>Close</button>
                </div>
            </div>
        </div>
    );
};

const ExportFailedPopup = ({ isOpen, operation, onClose }) => {
    if (!isOpen) return null;

    // FIX: Corrected the static success message in the original file to reflect failure
    const title = operation === 'excel' ? 'Export Failed!' : 'Download Failed!';
    const message = operation === 'excel'
        ? 'An error occurred during Excel export. Please try again.'
        : 'An error occurred during PDF download. Please try again.';
    const headerText = operation === 'excel' ? 'Export Failed!' : 'Download Failed!';

    return (
        <div className={styles['co-es-export-popup-overlay']}>
            <div className={styles['co-es-export-popup-container']}>
                <div className={styles['co-es-export-popup-header']}>{headerText}</div>
                <div className={styles['co-es-export-popup-body']}>
                    <div className={styles['co-es-export-failed-icon']}>
                        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                            <circle cx="40" cy="40" r="38" fill="#dc3545" />
                            <path
                                d="M30 30 L50 50 M50 30 L30 50"
                                stroke="white"
                                strokeWidth="4"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                    <h2 className={styles['co-es-export-popup-title']}>{title}</h2>
                    <p className={styles['co-es-export-popup-message']}>{message}</p>
                </div>
                <div className={styles['co-es-export-popup-footer']}>
                    <button onClick={onClose} className={styles['co-es-export-popup-close-btn']}>Close</button>
                </div>
            </div>
        </div>
    );
};

// =======================================================================
// !!! END: EXPORT POPUP COMPONENTS (Copied from Coo_CompanyDrive.js) !!!
// =======================================================================


function CoEligiblestudents({ onLogout, currentView, onViewChange }) {
    useCoordinatorAuth(); // JWT authentication verification
    const navigate = useNavigate();
    
    // START: MODIFIED/NEW STATE FOR EXPORT POPUPS
    const [showDropdown, setShowDropdown] = useState(false);
    const [exportPopupState, setExportPopupState] = useState({
        isOpen: false,
        type: null, // 'progress', 'success', 'failed'
        operation: null, // 'excel', 'pdf'
        progress: 0
    });
    // END: MODIFIED/NEW STATE FOR EXPORT POPUPS

    const [filterData, setFilterData] = useState({
        batch: '',
        registerNo: '',
        cgpa: '',
        skills: ''
    });
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [isFiltered, setIsFiltered] = useState(false); // **FIXED LINE**
    const tableRef = useRef(null);
    // Sample student data
    const studentData = [
        { id: 1, name: 'Student-1', registerNo: '73151929345', batch: '2023-2027', section: 'A', cgpa: '9.1', skills: 'Python', status: 'Unplaced' },
        { id: 2, name: 'Student-2', registerNo: '73153498762', batch: '2022-2026', section: 'B', cgpa: '8.5', skills: 'Java', status: 'Unplaced' },
        { id: 3, name: 'Student-3', registerNo: '73153456789', batch: '2023-2027', section: 'A', cgpa: '8.1', skills: 'Java', status: 'Placed' },
        { id: 4, name: 'Student-4', registerNo: '73159876543', batch: '2022-2026', section: 'B', cgpa: '9.0', skills: 'Javascript', status: 'Placed' },
        { id: 5, name: 'Student-5', registerNo: '73152313132', batch: '2023-2027', section: 'A', cgpa: '7.9', skills: 'Data Analysis', status: 'Placed' },
        { id: 6, name: 'Student-6', registerNo: '73152378906', batch: '2024-2028', section: 'C', cgpa: '6.8', skills: 'Python', status: 'Unplaced' },
        { id: 7, name: 'Student-7', registerNo: '73152345678', batch: '2024-2028', section: 'A', cgpa: '8.6', skills: 'Frontend', status: 'Placed' },
        { id: 8, name: 'Student-8', registerNo: '73152316545', batch: '2022-2028', section: 'A', cgpa: '8.1', skills: 'Blockchain', status: 'Unplaced' },
        { id: 9, name: 'Student-9', registerNo: '73152316783', batch: '2025-2029', section: 'A', cgpa: '7.2', skills: 'Java', status: 'Unplaced' },
        { id: 10, name: 'Student-10', registerNo: '73152318908', batch: '2023-2027', section: 'B', cgpa: '6.9', skills: 'Python', status: 'Unplaced' }
    ];

    const handleFilterChange = (field, value) => {
        setFilterData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFilter = () => {
        const filtered = studentData.filter(student => {
            const batchMatch = !filterData.batch || student.batch === filterData.batch;
            const regMatch = !filterData.registerNo || student.registerNo.includes(filterData.registerNo);
            const cgpaMatch = !filterData.cgpa || student.cgpa.includes(filterData.cgpa);
            const skillsMatch = !filterData.skills || student.skills.toLowerCase().includes(filterData.skills.toLowerCase());
            return batchMatch && regMatch && cgpaMatch && skillsMatch;
        });
        setFilteredStudents(filtered);
        setIsFiltered(true);
    };

    const [activeItem, setActiveItem] = useState("Eligible Students");

    const handleItemClick = (itemName) => {
        setActiveItem(itemName);
    };
    const handleClear = () => {
        setFilterData({
            batch: '',
            registerNo: '',
            cgpa: '',
            skills: ''
        });
        setFilteredStudents([]);
        setIsFiltered(false);
    };

    const displayStudents = isFiltered ? filteredStudents : studentData;

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };
    const EyeIcon = () => (
        <svg className={styles['co-es-profile-eye-icon']} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
    );

    // =========================================================================
    // !!! START: NEW/MODIFIED EXPORT LOGIC (Copied/Adapted from Coo_CompanyDrive.js) !!!
    // =========================================================================

    // Function to simulate progress and handle export
    const simulateExport = async (operation, exportFunction) => {
        setShowDropdown(false);

        // Show progress popup
        setExportPopupState({
            isOpen: true,
            type: 'progress',
            operation: operation,
            progress: 0
        });

        let progressInterval;
        let progressTimeout;

        try {
            // Simulate progress from 0 to 100
            progressInterval = setInterval(() => {
                setExportPopupState(prev => {
                    if (prev.progress < 100 && prev.type === 'progress') {
                        return { ...prev, progress: Math.min(prev.progress + 10, 100) };
                    }
                    return prev;
                });
            }, 200);

            // Wait for progress animation to complete
            await new Promise(resolve => {
                progressTimeout = setTimeout(() => {
                    clearInterval(progressInterval);
                    resolve();
                }, 2000);
            });

            // Perform the actual export
            exportFunction();

            // Show success popup
            setExportPopupState({
                isOpen: true,
                type: 'success',
                operation: operation,
                progress: 100
            });
        } catch (error) {
            if (progressInterval) clearInterval(progressInterval);
            if (progressTimeout) clearTimeout(progressTimeout);

            // Show failed popup
            setExportPopupState({
                isOpen: true,
                type: 'failed',
                operation: operation,
                progress: 0
            });
        }
    };

    const exportToExcel = () => {
        try {
            const header = ["S.No", "Student Name", "Register Number", "Batch", "Section", "CGPA", "Skills", "Placement status"];
            const data = displayStudents.map((item, index) => [
                index + 1,
                item.name,
                item.registerNo,
                item.batch,
                item.section,
                item.cgpa,
                item.skills,
                item.status
            ]);
            const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Eligible Students");
            XLSX.writeFile(wb, "eligible_students.xlsx");
            setShowDropdown(false);
        } catch (error) {
            throw error;
        }
    };

    const exportToPDF = () => {
        try {
            const doc = new jsPDF();

            // Define the table headers
            const tableColumn = ["S.No", "Student Name", "Register Number", "Batch", "Section", "CGPA", "Skills", "Placement status"];

            // Prepare the data rows from your filtered data
            const tableRows = displayStudents.map((item, index) => [
                index + 1,
                item.name,
                item.registerNo,
                item.batch,
                item.section,
                item.cgpa,
                item.skills,
                item.status
            ]);

            // Add a title to the PDF
            doc.setFontSize(16);
            doc.text("Eligible Students Report", 14, 15);

            // Generate the table using autoTable
            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 20, // Start the table 20mm from the top
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    overflow: 'linebreak',
                    valign: 'middle',
                    halign: 'center',
                    minCellHeight: 8
                },
                headStyles: {
                    fillColor: [215, 61, 61], // Red color for header
                    textColor: 255, // White text
                    fontStyle: 'bold'
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 10 },
                    1: { halign: 'left', cellWidth: 30 },
                    2: { halign: 'center', cellWidth: 30 },
                    3: { halign: 'center', cellWidth: 20 },
                    4: { halign: 'center', cellWidth: 15 },
                    5: { halign: 'center', cellWidth: 15 },
                    6: { halign: 'left', cellWidth: 30 },
                    7: { halign: 'center', cellWidth: 'auto' }
                },
                margin: { top: 20 },
            });

            // Save the PDF
            doc.save("eligible_students.pdf");
            setShowDropdown(false);
        } catch (error) {
            throw error;
        }
    };

    const handleExportToPDF = () => {
        simulateExport('pdf', exportToPDF);
    };

    const handleExportToExcel = () => {
        simulateExport('excel', exportToExcel);
    };
    // =======================================================================
    // !!! END: NEW/MODIFIED EXPORT LOGIC !!!
    // =======================================================================

    const handleCardClick = (view) => {
        if (onViewChange) {
            onViewChange(view);
        }
    };
    return (
        <div className={styles['coordinator-main-wrapper']}>
            <Navbar onToggleSidebar={toggleSidebar} />
            <div className={styles['coordinator-main-layout']}>
                <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView="eligible-students" onViewChange={onViewChange} />
                <div className={styles['coordinator-content-area']}>
                    <div className={styles['co-es-container']}>
                        <div className={styles['co-es-dashboard-area']}>
                            <div className={styles['co-es-summary-cards']}>
                                <div className={`${styles['co-es-summary-card']} ${styles['co-es-company-drive-card']}`} >

                                    <div className={styles['co-es-summary-card-icon']} style={{ background: '#ffffff' }}><img src={AdminBrowseStudenticon} alt="Company Drive" /></div>
                                    <div className={styles['co-es-summary-card-title-1']}>Student Database</div>
                                    <div className={styles['co-es-summary-card-desc-1']} >Filter, sort and manage Student records</div>
                                </div>
                                <div className={`${styles['co-es-search-filters']} ${styles['co-es-company-profile-search']}`}>
                                    <div className={styles['co-es-search-tab']}> CSE Students</div>
                                    <div className={styles['co-es-search-inputs']}>
                                        <div className={`${styles['co-es-search-input']} ${filterData.batch ? styles['filled'] : ''}`}>
                                            <input type="text" id="Batch" value={filterData.batch} onChange={(e) => handleFilterChange('batch', e.target.value)} list="batch-options" required />
                                            <label htmlFor="batch">Batch</label>
                                            <datalist id="batch-options">
                                                <option value="2022-2026">2022-2026</option>
                                                <option value="2023-2027">2023-2027</option>
                                                <option value="2024-2028">2024-2028</option>
                                                <option value="2025-2029">2025-2029</option>
                                            </datalist>
                                            <button className={styles['co-es-clear-btn']}></button>
                                        </div>
                                        <div className={`${styles['co-es-search-input']} ${filterData.registerNo ? styles['filled'] : ''}`}>
                                            <input type="text" id="Register No" value={filterData.registerNo} onChange={(e) => handleFilterChange('registerNo', e.target.value)} required />
                                            <label htmlFor="register no">Register no</label>
                                            <button className={styles['co-es-clear-btn']}></button>
                                        </div>
                                        <div className={`${styles['co-es-search-input']} ${filterData.cgpa ? styles['filled'] : ''}`}>
                                            <input type="text" id="CGPA" value={filterData.cgpa} onChange={(e) => handleFilterChange('cgpa', e.target.value)} required />
                                            <label htmlFor="cgpa">CGPA</label>
                                            <button className={styles['co-es-clear-btn']}></button>
                                        </div>
                                        <div className={`${styles['co-es-search-input']} ${filterData.skills ? styles['filled'] : ''}`}>
                                            <input type="text" id="Skills" value={filterData.skills} onChange={(e) => handleFilterChange('skills', e.target.value)} required />
                                            <label htmlFor="skills">Skills</label>
                                            <button className={styles['co-es-clear-btn']}></button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                                        <button className={styles['co-es-search-btn-filter']} onClick={handleFilter}>Filter</button>
                                        <button className={styles['co-es-clear-search-btn']} onClick={handleClear}>Clear</button>
                                    </div>
                                </div>
                                <div className={`${styles['co-es-summary-card']} ${styles['co-es-placed-students-card']}`} onClick={() => handleCardClick('placed-students')} >
                                    <div className={styles['co-es-summary-card-icon']} style={{ background: '#ffffff', marginTop: 5 }}><img src={PlacedStudentsCap} alt="Placed Students" /></div>
                                    <div className={styles['co-es-summary-card-title-2']} style={{ marginTop: 35 }}>Placed Students</div>
                                    <div className={styles['co-es-summary-card-desc-2']} >Success gained through dedication daily</div>
                                </div>
                            </div>
                            <div className={`${styles['co-es-company-profile']} ${styles['company-profile-table']}`}>
                                <div className={styles['co-es-profile-header']}>
                                    <div className={styles['co-es-profile-title']}>ELIGIBLE STUDENTS</div>
                                    <div className={styles['co-es-print-btn-container']}>
                                        <button className={styles['co-es-print-btn']} onClick={() => setShowDropdown(!showDropdown)}>Print</button>
                                        {showDropdown && (
                                            <div className={styles['co-es-dropdown-menu']}>
                                                {/* MODIFIED HANDLERS */}
                                                <div className={styles['co-es-dropdown-item']} onClick={handleExportToExcel}>Export to Excel</div>
                                                <div className={styles['co-es-dropdown-item']} onClick={handleExportToPDF}>Save as PDF</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className={styles['co-es-table-container']}>
                                    <table className={styles['co-es-profile-table']} ref={tableRef}>
                                        <thead>
                                            <tr>
                                                <th>S.No</th>
                                                <th>Student Name</th>
                                                <th>Register Number</th>
                                                <th>Batch</th>
                                                <th>Section</th>
                                                <th>CGPA</th>
                                                <th>Skills</th>
                                                <th>Placement status</th>
                                                <th>View</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {displayStudents.map((student, index) => (
                                                <tr key={student.id}>
                                                    <td>{index + 1}</td>
                                                    <td>{student.name}</td>
                                                    <td>{student.registerNo}</td>
                                                    <td>{student.batch}</td>
                                                    <td>{student.section}</td>
                                                    <td>{student.cgpa}</td>
                                                    <td>{student.skills}</td>
                                                    <td>
                                                        <span className={student.status === 'Placed' ? styles['co-es-status-badge-one'] : styles['co-es-status-badge-two']}>
                                                            {student.status}
                                                        </span>
                                                    </td>
                                                    <td onClick={() => handleCardClick('coo-view-page')}>
                                                        <EyeIcon />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* START: NEW EXPORT POPUP RENDERING */}
            {exportPopupState.isOpen && exportPopupState.type === 'progress' && (
                <ExportProgressPopup
                    isOpen={true}
                    operation={exportPopupState.operation}
                    progress={exportPopupState.progress}
                    onClose={() => { }}
                />
            )}

            {exportPopupState.isOpen && exportPopupState.type === 'success' && (
                <ExportSuccessPopup
                    isOpen={true}
                    operation={exportPopupState.operation}
                    onClose={() => setExportPopupState({ isOpen: false, type: null, operation: null, progress: 0 })}
                />
            )}

            {exportPopupState.isOpen && exportPopupState.type === 'failed' && (
                <ExportFailedPopup
                    isOpen={true}
                    operation={exportPopupState.operation}
                    onClose={() => setExportPopupState({ isOpen: false, type: null, operation: null, progress: 0 })}
                />
            )}
            {/* END: NEW EXPORT POPUP RENDERING */}
        </div>
    );
}

export default CoEligiblestudents;