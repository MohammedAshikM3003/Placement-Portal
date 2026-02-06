import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx'; 
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// NEW IMPORTS for Date Picker

// Import New Components
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";

// Import CSS Files
// Ensure you have the 'Coreporanalysis2.css' file with 'co-ras' prefixes from the previous step.
import styles from './Coo_ReportAnalysisCW.module.css'; 

// Import necessary assets for the Navbar (Adminicon)
import Adminicon from "../assets/Adminicon.png";

const cx = (...classNames) => classNames.filter(Boolean).join(' ');

const ExportProgressPopup = ({ isOpen, operation, progress, onClose }) => {
  if (!isOpen) return null;
  
  const operationText = operation === 'excel' ? 'Exporting...' : 'Downloading...';
  const progressText = operation === 'excel' ? 'Exported' : 'Downloaded';
  
  // Calculate the stroke-dasharray for circular progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
      <div className={styles["co-ras-export-popup-overlay"]}>
          <div className={styles["co-ras-export-popup-container"]}>
              <div className={styles["co-ras-export-popup-header"]}>{operationText}</div>
              <div className={styles["co-ras-export-popup-body"]}>
                  <div className={styles["co-ras-export-progress-circle"]}>
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
                      <div className={styles["co-ras-export-progress-text"]}>{progress}%</div>
                  </div>
                  <h2 className={styles["co-ras-export-popup-title"]}>{progressText} {progress}%</h2>
                  <p className={styles["co-ras-export-popup-message"]}>
                      The Details have been {operation === 'excel' ? 'Exporting...' : 'Downloading...'}
                  </p>
                  <p className={styles["co-ras-export-popup-message"]}>Please wait...</p>
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
      <div className={styles["co-ras-export-popup-overlay"]}>
          <div className={styles["co-ras-export-popup-container"]}>
              <div className={styles["co-ras-export-popup-header"]}>{headerText}</div>
              <div className={styles["co-ras-export-popup-body"]}>
                  <div className={styles["co-ras-export-success-icon"]}>
                      <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                          <circle cx="40" cy="40" r="38" fill="#28a745" />
                          <path
                              d="M25 40 L35 50 L55 30"
                              stroke="white"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                          />
                      </svg>
                  </div>
                  <h2 className={styles["co-ras-export-popup-title"]}>{title}</h2>
                  <p className={styles["co-ras-export-popup-message"]}>{message}</p>
              </div>
              <div className={styles["co-ras-export-popup-footer"]}>
                  <button onClick={onClose} className={styles["co-ras-export-popup-close-btn"]}>Close</button>
              </div>
          </div>
      </div>
  );
};

const ExportFailedPopup = ({ isOpen, operation, onClose }) => {
  if (!isOpen) return null;
  
  const title = operation === 'excel' ? 'Exported Failed!' : 'Downloaded Failed!';
  const message = operation === 'excel'
      ? 'The Details have been Successfully Exported to Excel in your device.'
      : 'The Details have been Successfully Downloaded as PDF to your device.';
  const headerText = operation === 'excel' ? 'Exported!' : 'Downloaded!';
  
  return (
      <div className={styles["co-ras-export-popup-overlay"]}>
          <div className={styles["co-ras-export-popup-container"]}>
              <div className={styles["co-ras-export-popup-header"]}>{headerText}</div>
              <div className={styles["co-ras-export-popup-body"]}>
                  <div className={styles["co-ras-export-failed-icon"]}>
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
                  <h2 className={styles["co-ras-export-popup-title"]}>{title}</h2>
                  <p className={styles["co-ras-export-popup-message"]}>{message}</p>
              </div>
              <div className={styles["co-ras-export-popup-footer"]}>
                  <button onClick={onClose} className={styles["co-ras-export-popup-close-btn"]}>Close</button>
              </div>
          </div>
      </div>
  );
};


// Master data array (Batches are mixed) - 18 records
const initialData = [
  { "So No": 1, "Student Name": "Arun Kumar S.", "Register No.": "731523130001", "Department": "CSE", "Batch": "2023-2027", "Section": "A", "Company": "Infosys", "Job Role": "Software Engineer", "Package": "12.0 LPA", "Rounds": "Round 3", "Status": "Passed", "Start Date": "01/08/25", "End Date": "05/08/25" },
  { "So No": 2, "Student Name": "Priya V.", "Register No.": "731523130002", "Department": "CSE", "Batch": "2023-2027", "Section": "B", "Company": "Wipro", "Job Role": "Data Analyst", "Package": "7.0 LPA", "Rounds": "Round 2", "Status": "Rejected", "Start Date": "06/08/25", "End Date": "10/08/25" },
  { "So No": 3, "Student Name": "Gowtham M.", "Register No.": "731523130003", "Department": "CSE", "Batch": "2023-2027", "Section": "A", "Company": "TCS", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 1", "Status": "Rejected", "Start Date": "11/08/25", "End Date": "15/08/25" },
  { "So No": 4, "Student Name": "Nithya R.", "Register No.": "731523130004", "Department": "CSE", "Batch": "2023-2027", "Section": "A", "Company": "TCS", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Passed", "Start Date": "16/08/25", "End Date": "20/08/25" },
  { "So No": 5, "Student Name": "Vikram K.", "Register No.": "731523130005", "Department": "CSE", "Batch": "2023-2027", "Section": "B", "Company": "Wipro", "Job Role": "Software Engineer", "Package": "8.0 LPA", "Rounds": "Round 2", "Status": "Rejected", "Start Date": "21/08/25", "End Date": "25/08/25" },
  { "So No": 6, "Student Name": "Deepika P.", "Register No.": "731523130006", "Department": "CSE", "Batch": "2023-2027", "Section": "C", "Company": "Infosys", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 3", "Status": "Passed", "Start Date": "26/08/25", "End Date": "30/08/25" },
  
  // New Batch: 2024-2028
  { "So No": 7, "Student Name": "Sanjay R.", "Register No.": "731523130007", "Department": "CSE", "Batch": "2024-2028", "Section": "A", "Company": "IBM", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Rejected", "Start Date": "01/09/25", "End Date": "05/09/25" },
  { "So No": 8, "Student Name": "Meena L.", "Register No.": "731523130008", "Department": "CSE", "Batch": "2024-2028", "Section": "B", "Company": "TCS", "Job Role": "Software Engineer", "Package": "8.0 LPA", "Rounds": "Round 2", "Status": "Passed", "Start Date": "06/09/25", "End Date": "10/09/25" },
  { "So No": 9, "Student Name": "Kavin S.", "Register No.": "731523130009", "Department": "CSE", "Batch": "2024-2028", "Section": "C", "Company": "Wipro", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 3", "Status": "Rejected", "Start Date": "11/09/25", "End Date": "15/09/25" },
  { "So No": 10, "Student Name": "Harini B.", "Register No.": "731523130010", "Department": "CSE", "Batch": "2024-2028", "Section": "A", "Company": "Infosys", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Passed", "Start Date": "16/09/25", "End Date": "20/09/25" },
  { "So No": 11, "Student Name": "Ramesh C.", "Register No.": "731523130011", "Department": "CSE", "Batch": "2024-2028", "Section": "B", "Company": "IBM", "Job Role": "Software Engineer", "Package": "8.0 LPA", "Rounds": "Round 2", "Status": "Rejected", "Start Date": "21/09/25", "End Date": "25/09/25" },
  { "So No": 12, "Student Name": "Shalini D.", "Register No.": "731523130012", "Department": "CSE", "Batch": "2024-2028", "Section": "C", "Company": "TCS", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 3", "Status": "Passed", "Start Date": "26/09/25", "End Date": "30/09/25" },
  
  // New Batch: 2025-2029
  { "So No": 13, "Student Name": "Ajith V.", "Register No.": "731523130013", "Department": "CSE", "Batch": "2025-2029", "Section": "A", "Company": "Wipro", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Rejected", "Start Date": "01/10/25", "End Date": "05/10/25" },
  { "So No": 14, "Student Name": "Sindhu M.", "Register No.": "731523130014", "Department": "CSE", "Batch": "2025-2029", "Section": "B", "Company": "Infosys", "Job Role": "Software Engineer", "Package": "8.0 LPA", "Rounds": "Round 2", "Status": "Passed", "Start Date": "06/10/25", "End Date": "10/10/25" },
  { "So No": 15, "Student Name": "Dinesh S.", "Register No.": "731523130015", "Department": "CSE", "Batch": "2025-2029", "Section": "C", "Company": "IBM", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 3", "Status": "Rejected", "Start Date": "11/10/25", "End Date": "15/10/25" },
  { "So No": 16, "Student Name": "Janani P.", "Register No.": "731523130016", "Department": "CSE", "Batch": "2025-2029", "Section": "A", "Company": "TCS", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Passed", "Start Date": "16/10/25", "End Date": "20/10/25" },
  { "So No": 17, "Student Name": "Praveen J.", "Register No.": "731523130017", "Department": "CSE", "Batch": "2025-2029", "Section": "B", "Company": "Wipro", "Job Role": "Software Engineer", "Package": "8.0 LPA", "Rounds": "Round 2", "Status": "Rejected", "Start Date": "21/10/25", "End Date": "25/10/25" },
  { "So No": 18, "Student Name": "Anjali A.", "Register No.": "731523130018", "Department": "CSE", "Batch": "2025-2029", "Section": "C", "Company": "Infosys", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 3", "Status": "Passed", "Start Date": "26/10/25", "End Date": "30/10/25" },
];


function  ReportAnalysisCW({ onLogout, onViewChange }) {

  
  const navigate = useNavigate();
  
  const [filteredData, setFilteredData] = useState(initialData);
  const [companyFilter, setCompanyFilter] = useState('All Companies');
  const [jobRoleFilter, setJobRoleFilter] = useState('All Roles');
  const [batchFilter, setBatchFilter] = useState('Batch');
  const [startDateFilter, setStartDateFilter] = useState(null); 
  const [endDateFilter, setEndDateFilter] = useState(null); 
  const [statusFilter, setStatusFilter] = useState('All'); 
  const [showExportMenu, setShowExportMenu] = useState(false); 
  const [selectedCompanyJob, setSelectedCompanyJob] = useState(null);
  const [isDriveOpen, setIsDriveOpen] = useState(false);
  const [isStartDateOpen, setIsStartDateOpen] = useState(false);
  
  // 🗑️ REMOVED: activeRound state is no longer needed
 const handleCardClick = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  // UPDATED HELPER: Now handles Date objects from state and strings from initialData
  const getSortableDateString = (dateInput) => {
    if (!dateInput) return null;

    // Case 1: Input is a standard JavaScript Date object (from react-datepicker state)
    if (dateInput instanceof Date && !isNaN(dateInput)) {
      const y = dateInput.getFullYear();
      const m = String(dateInput.getMonth() + 1).padStart(2, '0');
      const d = String(dateInput.getDate()).padStart(2, '0');
      return `${y}${m}${d}`; // YYYYMMDD
    }

    // Case 2: Input is a string from the initialData (DD/MM/YY)
    if (typeof dateInput === 'string' && dateInput.includes('/')) {
        const dateString = dateInput.trim();
        const parts = dateString.split('/');
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        let year = parts[2];
        year = (year.length === 2) ? '20' + year : year; 
        return `${year}${month}${day}`; // YYYYMMDD
    } 
    
    return null;
  };

  const formatDisplayDate = (dateInput) => {
    if (!dateInput) return '';
    if (dateInput instanceof Date && !isNaN(dateInput)) {
      const day = String(dateInput.getDate()).padStart(2, '0');
      const month = String(dateInput.getMonth() + 1).padStart(2, '0');
      const year = String(dateInput.getFullYear()).slice(-2);
      return `${day}/${month}/${year}`;
    }
    if (typeof dateInput === 'string') {
      return dateInput;
    }
    return '';
  };

  const groupedDrives = useMemo(() => {
    const driveMap = new Map();

    initialData.forEach((student) => {
      const companyName = student.Company?.trim();
      const jobRole = student["Job Role"]?.trim();
      if (!companyName || !jobRole) return;

      const key = `${companyName}__${jobRole}`;
      if (!driveMap.has(key)) {
        driveMap.set(key, {
          companyName,
          jobRole,
          dates: [],
          endDates: [],
        });
      }

      const group = driveMap.get(key);
      if (student["Start Date"]) {
        group.dates.push(student["Start Date"]);
      }
      if (student["End Date"]) {
        group.endDates.push(student["End Date"]);
      }
    });

    return Array.from(driveMap.values()).map((group) => {
      const uniqueDates = Array.from(new Set(group.dates));
      const sortedDates = uniqueDates.sort((a, b) => {
        const dateA = getSortableDateString(a);
        const dateB = getSortableDateString(b);
        return dateA && dateB ? dateA.localeCompare(dateB) : 0;
      });

      const uniqueEndDates = Array.from(new Set(group.endDates));
      const sortedEndDates = uniqueEndDates.sort((a, b) => {
        const dateA = getSortableDateString(a);
        const dateB = getSortableDateString(b);
        return dateA && dateB ? dateA.localeCompare(dateB) : 0;
      });

      return {
        ...group,
        availableDates: sortedDates,
        latestEndDate: sortedEndDates[sortedEndDates.length - 1] || null,
      };
    });
  }, []);

  const handleCompanyJobSelect = (group) => {
    setSelectedCompanyJob(group);
    setCompanyFilter(group.companyName);
    setJobRoleFilter(group.jobRole);
    setStartDateFilter(null);
    setEndDateFilter(group.latestEndDate || null);
    setIsDriveOpen(false);
    setIsStartDateOpen(false);
  };

  const handleStartDateSelect = (date) => {
    setStartDateFilter(date);
    if (selectedCompanyJob?.latestEndDate) {
      setEndDateFilter(selectedCompanyJob.latestEndDate);
    }
    setIsStartDateOpen(false);
  };


    // Popup states for export operations
    const [exportPopupState, setExportPopupState] = useState({
      isOpen: false,
      type: null, // 'progress', 'success', 'failed'
      operation: null, // 'excel', 'pdf'
      progress: 0
  });
  // Function to toggle the "View status" filter
  const toggleStatusFilter = () => {
      setStatusFilter(prevStatus => prevStatus === 'All' ? 'Passed' : 'All');
  };

  // 🗑️ REMOVED: handleRoundClick function is no longer needed


  // Function to toggle the Print dropdown menu
  const handlePrintClick = (event) => {
    event.stopPropagation();
    setShowExportMenu(prev => !prev);
  }

  // Effect to handle clicks outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showExportMenu &&
        !event.target.closest(`.${styles["co-ras-print-button-container"]}`)
      ) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showExportMenu]);

  // Effect to run filtering whenever any filter state changes
  useEffect(() => {
    let currentFilteredData = initialData;

    // 1. Company & Job Role Filter (Dropdown)
    if (companyFilter !== 'All Companies') {
      currentFilteredData = currentFilteredData.filter(student => student.Company.trim() === companyFilter.trim());
    }

    if (jobRoleFilter !== 'All Roles') {
      currentFilteredData = currentFilteredData.filter(student => student["Job Role"].trim() === jobRoleFilter.trim());
    }

    // 2. Batch Filter (Dropdown)
    if (batchFilter !== 'Batch') {
      currentFilteredData = currentFilteredData.filter(student => 
        student.Batch.trim() === batchFilter.trim()
      );
    }

    // 3. Start Date Filter (Date Picker)
    if (startDateFilter) {
      const filterStart = getSortableDateString(startDateFilter); 
      if (filterStart) {
        currentFilteredData = currentFilteredData.filter(student => {
          const studentStart = getSortableDateString(student["Start Date"]); 
          return studentStart && studentStart >= filterStart; 
        });
      }
    }

    // 4. End Date Filter (Date Picker)
    if (endDateFilter) {
      const filterEnd = getSortableDateString(endDateFilter); 
      if (filterEnd) {
        currentFilteredData = currentFilteredData.filter(student => {
          const studentEnd = getSortableDateString(student["End Date"]); 
          return studentEnd && studentEnd <= filterEnd;
        });
      }
    }
    
    // 5. Status Filter (Passed/All)
    if (statusFilter === 'Passed') {
        currentFilteredData = currentFilteredData.filter(student => student.Status === 'Passed');
    }

    // 🗑️ REMOVED: Round Filter logic is removed

    setFilteredData(currentFilteredData);

    // 🗑️ REMOVED: activeRound dependency is removed
  }, [companyFilter, jobRoleFilter, batchFilter, startDateFilter, endDateFilter, statusFilter]); 
  

  const navigateToCompanyAnalysis = () => {
    navigate('/ReportanalysisCW'); 
  };

   // Function to simulate progress and handle export
   const simulateExport = async (operation, exportFunction) => {
    setShowExportMenu(false);
    
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
    try{
    const header = [
        "So No", "Student Name", "Register No.", "Department", "Batch", "Section", 
        "Company", "Job Role", "Package", "Rounds", "Status", "Start Date", "End Date"
    ];
    
    const data = filteredData.map((item) => [
        item["So No"],
        item["Student Name"],
        item["Register No."],
        item.Department,
        item.Batch,
        item.Section,
        item.Company,
        item["Job Role"],
        item.Package,
        item.Rounds,
        item.Status,
        item["Start Date"],
        item["End Date"]
    ]);
    
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Analysis Report");
    XLSX.writeFile(wb, "ReportAnalysis.xlsx");

    setShowExportMenu(false);
  }catch (error){
    throw error;
  }
  };
  
  const exportToPDF = () => {
    try{
    const doc = new jsPDF('landscape'); 
    
    const tableColumn = [
        "S.No", "Student Name", "Reg No.", "Dept", "Batch", "Sec", 
        "Company", "Job Role", "Package", "Rounds", "Status", "Start Date", "End Date"
    ];
    
    const tableRows = filteredData.map((item) => [
        item["So No"],
        item["Student Name"],
        item["Register No."],
        item.Department,
        item.Batch,
        item.Section,
        item.Company,
        item["Job Role"],
        item.Package,
        item.Rounds,
        item.Status,
        item["Start Date"],
        item["End Date"]
    ]);
    
    doc.setFontSize(14);
    doc.text("Analysis Report", 148, 15, null, null, "center");
    
    autoTable(doc,{
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        styles: {
            fontSize: 7, 
            cellPadding: 1,
            overflow: 'linebreak',
            valign: 'middle',
            halign: 'center',
            minCellHeight: 6
        },
        headStyles: {
            fillColor: [210, 59, 66], 
            textColor: 255,
            fontStyle: 'bold'
        },
        margin: { top: 20, left: 5, right: 5 },
    });
    
    doc.save("ReportAnalysis.pdf");
    setShowExportMenu(false);
  }catch (error){
    throw error;
  }
  };

  
 const handleExportToPDF = () => {
  simulateExport('pdf', exportToPDF);
};

const handleExportToExcel = () => {
  simulateExport('excel', exportToExcel);
};
  // ... (rest of the component)

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return ( 
    <>
      <Navbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} /> 
      <div className={styles["co-layout"]}>
        <Sidebar
          isOpen={isSidebarOpen}
          onLogout={onLogout}
          currentView="report-analysis"
          onViewChange={onViewChange}
        />
        <div className={styles["co-main-content"]}>
          <div className={styles["co-ras-filter-box"]}>
            <div className={styles["co-ras-tab-container"]}>
              {/* Note: The 'Round wise' tab label is kept but its functionality is now removed */}
              <div className={styles["co-ras-tab-inactive"]} onClick={() => handleCardClick('report-analysis-rw')}>Round wise<br /> Analysis</div>
              <div className={styles["co-ras-tab-active"]}>Company <br />wise Analysis</div>
              <div className={styles["co-ras-tab-inactive"]} onClick={() => handleCardClick('report-analysis-sw')}>Student wise<br /> Analysis</div>
            </div>

            <div className={styles["co-ras-filter-inputs"]}>
              <div className={styles["co-ras-dropdown-wrapper"]}>
                <div
                  className={styles["co-ras-dropdown-header"]}
                  onClick={() => setIsDriveOpen(!isDriveOpen)}
                >
                  <span>{selectedCompanyJob ? `${selectedCompanyJob.companyName} - ${selectedCompanyJob.jobRole}` : 'Select Company & Job Role'}</span>
                  <span className={styles["co-ras-dropdown-arrow"]}>{isDriveOpen ? '▲' : '▼'}</span>
                </div>
                {isDriveOpen && (
                  <div className={styles["co-ras-dropdown-menu"]}>
                    {groupedDrives.map((group, index) => (
                      <div
                        key={`${group.companyName}-${group.jobRole}-${index}`}
                        className={styles["co-ras-dropdown-item"]}
                        onClick={() => handleCompanyJobSelect(group)}
                      >
                        {group.companyName} - {group.jobRole}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles["co-ras-dropdown-wrapper"]}>
                <div
                  className={cx(
                    styles["co-ras-dropdown-header"],
                    !selectedCompanyJob && styles["co-ras-dropdown-disabled"]
                  )}
                  onClick={() => selectedCompanyJob && setIsStartDateOpen(!isStartDateOpen)}
                >
                  <span>{startDateFilter ? formatDisplayDate(startDateFilter) : 'Start Date'}</span>
                  <span className={styles["co-ras-dropdown-arrow"]}>{isStartDateOpen ? '▲' : '▼'}</span>
                </div>
                {isStartDateOpen && selectedCompanyJob && (
                  <div className={styles["co-ras-dropdown-menu"]}>
                    {selectedCompanyJob.availableDates.map((dateObj, index) => (
                      <div
                        key={`${dateObj}-${index}`}
                        className={styles["co-ras-dropdown-item"]}
                        onClick={() => handleStartDateSelect(dateObj)}
                      >
                        {formatDisplayDate(dateObj)}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles["co-ras-dropdown-wrapper"]}>
                <div
                  className={cx(
                    styles["co-ras-dropdown-header"],
                    styles["co-ras-dropdown-disabled"]
                  )}
                  title="End date is automatically set based on the selected drive"
                >
                  <span>{endDateFilter ? formatDisplayDate(endDateFilter) : 'End Date'}</span>
                  <span className={styles["co-ras-dropdown-arrow"]}>✓</span>
                </div>
              </div>

              <select
                className={styles["co-ras-filter-select"]}
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
              >
                <option value="Batch">Batch</option>
                <option value="2023-2027">2023-2027</option>
                <option value="2024-2028">2024-2028</option>
                <option value="2025-2029">2025-2029</option>
                <option value="2026-2030">2026-2030</option>
                <option value="2027-2031">2027-2031</option>
                <option value="2028-2032">2028-2032</option>
                <option value="2029-2033">2029-2033</option>
                <option value="2030-2034">2030-2034</option>
              </select>
            </div>
          </div>

        {/* 🗑️ REMOVED: co-ras-round-buttons-container block is removed */}

        <div className={styles["co-ras-table-section"]}>
            <div className={styles["co-ras-table-header-row"]}>
              <div className={styles["co-ras-table-title"]}>COMPANY ANALYSIS REPORT</div>
              <div className={styles["co-ras-table-actions"]}>
                <button 
                  className={statusFilter === 'Passed' ? styles["co-ras-view-status-btn-filtered"] : styles["co-ras-view-status-btn-all"]}
                  onClick={toggleStatusFilter}
                >
                  {statusFilter === 'Passed' ? 'View All Students' : 'View Passed Students'}
                </button>
                
                <div className={styles["co-ras-print-button-container"]}>
                  <button 
                    className={styles["co-ras-print-btn"]} 
                    onClick={handlePrintClick} 
                  >
                    Print
                  </button>
                  
                  {showExportMenu && (
                    <div className={styles["co-ras-export-menu"]}>
                      <button className={styles["co-ras-export-menu-button"]} onClick={handleExportToExcel}>Export to Excel</button>
                      <button className={styles["co-ras-export-menu-button"]} onClick={handleExportToPDF}>Download as PDF</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles["co-ras-table-body-scroll"]}>
                <table className={styles["co-ras-data-table"]}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: "100px" }}>S.No</th>
                      <th style={{ minWidth: "200px" }}>Student Name</th>
                      <th style={{ minWidth: "100px" }}>Register No.</th>
                      <th style={{ minWidth: "150px" }}>Department</th>
                      <th style={{ minWidth: "190px" }}>Batch</th>
                      <th style={{ minWidth: "10px" }}>Section</th>
                      <th style={{ minWidth: "230px" }}>Company</th>
                      <th style={{ minWidth: "100px" }}>Job Role</th>
                      <th style={{ minWidth: "170px" }}>Package</th>
                      <th style={{ minWidth: "130px" }}>Rounds</th>
                      <th style={{ minWidth: "200px" }}>Status</th>
                      <th style={{ minWidth: "90px" }}>Start Date</th>
                      <th style={{ minWidth: "190px" }}>End Date</th>
                    </tr>
                  </thead>

                  <tbody className={styles["co-ras-table-body"]}>
                    {filteredData.map((student, index) => (
                      <tr key={index}>
                        <td style={{ paddingLeft: "40px" }}>{student["So No"]}</td>
                        <td>{student["Student Name"]}</td>
                        <td>{student["Register No."]}</td>
                        <td>{student.Department}</td>
                        <td>{student.Batch}</td>
                        <td>{student.Section}</td>
                        <td>{student.Company}</td>
                        <td>{student["Job Role"]}</td>
                        <td>{student.Package}</td>
                        <td>{student.Rounds}</td>
                        <td>
                          <div className={student.Status === 'Passed'
                            ? styles["co-ras-status-cell-passed"]
                            : styles["co-ras-status-cell-rejected"]}
                          >
                            {student.Status}
                          </div>
                        </td>
                        <td>{student["Start Date"]}</td>
                        <td>{student["End Date"]}</td>
                      </tr>
                    ))}

                    {filteredData.length === 0 && (
                      <tr>
                        <td colSpan="13" style={{ textAlign: 'center', padding: '20px' }}>
                          No students found matching the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
      </div>
      {/* Export Popups */}
        {exportPopupState.isOpen && exportPopupState.type === 'progress' && (
                <ExportProgressPopup
                    isOpen={true}
                    operation={exportPopupState.operation}
                    progress={exportPopupState.progress}
                    onClose={() => {}}
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
         
    </>
  );
}

export default ReportAnalysisCW;






