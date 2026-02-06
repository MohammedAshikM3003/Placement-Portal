import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";

import * as XLSX from 'xlsx'; 
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Import necessary assets for the Navbar (Adminicon)
import Adminicon from "../assets/Adminicon.png";

// NEW IMPORTS for Date Picker
import DatePicker from "react-datepicker";
//import "react-datepicker/dist/react-datepicker.css";

// Import New Components
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";

// Import CSS Files
import styles from './Coo_ReportAnalysisSW.module.css';

const cx = (...classNames) => classNames.filter(Boolean).join(' ');


// Utility functions for validation
const isEmail = (text) => /@/.test(text); // Simple check for '@' symbol
const isMobile = (text) => /^\d{10}$/.test(text); // Exact 10 digits

// Export Popup Components
const ExportProgressPopup = ({ isOpen, operation, progress, onClose }) => {
  if (!isOpen) return null;
  
  const operationText = operation === 'excel' ? 'Exporting...' : 'Downloading...';
  const progressText = operation === 'excel' ? 'Exported' : 'Downloaded';
  
  // Calculate the stroke-dasharray for circular progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
      <div className={styles["co-rat-export-popup-overlay"]}>
          <div className={styles["co-rat-export-popup-container"]}>
              <div className={styles["co-rat-export-popup-header"]}>{operationText}</div>
              <div className={styles["co-rat-export-popup-body"]}>
                  <div className={styles["co-rat-export-progress-circle"]}>
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
                      <div className={styles["co-rat-export-progress-text"]}>{progress}%</div>
                  </div>
                  <h2 className={styles["co-rat-export-popup-title"]}>{progressText} {progress}%</h2>
                  <p className={styles["co-rat-export-popup-message"]}>
                      The Details have been {operation === 'excel' ? 'Exporting...' : 'Downloading...'}
                  </p>
                  <p className={styles["co-rat-export-popup-message"]}>Please wait...</p>
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
      <div className={styles["co-rat-export-popup-overlay"]}>
          <div className={styles["co-rat-export-popup-container"]}>
              <div className={styles["co-rat-export-popup-header"]}>{headerText}</div>
              <div className={styles["co-rat-export-popup-body"]}>
                  <div className={styles["co-rat-export-success-icon"]}>
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
                  <h2 className={styles["co-rat-export-popup-title"]}>{title}</h2>
                  <p className={styles["co-rat-export-popup-message"]}>{message}</p>
              </div>
              <div className={styles["co-rat-export-popup-footer"]}>
                  <button onClick={onClose} className={styles["co-rat-export-popup-close-btn"]}>Close</button>
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
      <div className={styles["co-rat-export-popup-overlay"]}>
          <div className={styles["co-rat-export-popup-container"]}>
              <div className={styles["co-rat-export-popup-header"]}>{headerText}</div>
              <div className={styles["co-rat-export-popup-body"]}>
                  <div className={styles["co-rat-export-failed-icon"]}>
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
                  <h2 className={styles["co-rat-export-popup-title"]}>{title}</h2>
                  <p className={styles["co-rat-export-popup-message"]}>{message}</p>
              </div>
              <div className={styles["co-rat-export-popup-footer"]}>
                  <button onClick={onClose} className={styles["co-rat-export-popup-close-btn"]}>Close</button>
              </div>
          </div>
      </div>
  );
};


// Master data array (Email IDs are long to demonstrate size fix)
const initialData = [
  { "So No": 1, "Student Name": "Arun Kumar S.", "Register No.": "731523130001", "Department": "CSE", "Batch": "2023-2027", "Section": "A", "Company": "Infosys", "Job Role": "Software Engineer", "Package": "12.0 LPA", "Rounds": "Round 3", "Status": "Passed", "Start Date": "01/08/25", "End Date": "05/08/25", "Mobile": "9876543201", "Email": "arunkumars.placement.longemail@gmail.com" },
  { "So No": 2, "Student Name": "Priya V.", "Register No.": "731523130002", "Department": "CSE", "Batch": "2023-2027", "Section": "B", "Company": "Wipro", "Job Role": "Data Analyst", "Package": "7.0 LPA", "Rounds": "Round 2", "Status": "Rejected", "Start Date": "06/08/25", "End Date": "10/08/25", "Mobile": "9876543202", "Email": "priyav.data.longemail@gmail.com" },
  { "So No": 3, "Student Name": "Gowtham M.", "Register No.": "731523130003", "Department": "CSE", "Batch": "2023-2027", "Section": "A", "Company": "TCS", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 1", "Status": "Rejected", "Start Date": "11/08/25", "End Date": "15/08/25", "Mobile": "9876543203", "Email": "gowthamm.project@gmail.com" },
  { "So No": 4, "Student Name": "Nithya R.", "Register No.": "731523130004", "Department": "CSE", "Batch": "2023-2027", "Section": "A", "Company": "TCS", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Passed", "Start Date": "16/08/25", "End Date": "20/08/25", "Mobile": "9876543204", "Email": "nithyar.jobs@gmail.com" },
  { "So No": 5, "Student Name": "Vikram K.", "Register No.": "731523130005", "Department": "CSE", "Batch": "2023-2027", "Section": "B", "Company": "Wipro", "Job Role": "Software Engineer", "Package": "8.0 LPA", "Rounds": "Round 2", "Status": "Rejected", "Start Date": "21/08/25", "End Date": "25/08/25", "Mobile": "9876543205", "Email": "vikramk.software@gmail.com" },
  { "So No": 6, "Student Name": "Deepika P.", "Register No.": "731523130006", "Department": "CSE", "Batch": "2023-2027", "Section": "C", "Company": "Infosys", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 3", "Status": "Passed", "Start Date": "26/08/25", "End Date": "30/08/25", "Mobile": "9876543206", "Email": "deepikap.college@gmail.com" },
  
  // New Batch: 2024-2028
  { "So No": 7, "Student Name": "Sanjay R.", "Register No.": "731523130007", "Department": "CSE", "Batch": "2024-2028", "Section": "A", "Company": "IBM", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Rejected", "Start Date": "01/09/25", "End Date": "05/09/25", "Mobile": "9876543207", "Email": "sanjayr.analysis@gmail.com" },
  { "So No": 8, "Student Name": "Meena L.", "Register No.": "731523130008", "Department": "CSE", "Batch": "2024-2028", "Section": "B", "Company": "TCS", "Job Role": "Software Engineer", "Package": "8.0 LPA", "Rounds": "Round 2", "Status": "Passed", "Start Date": "06/09/25", "End Date": "10/09/25", "Mobile": "9876543208", "Email": "meenal.tech@gmail.com" },
  { "So No": 9, "Student Name": "Kavin S.", "Register No.": "731523130009", "Department": "CSE", "Batch": "2024-2028", "Section": "C", "Company": "Wipro", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 3", "Status": "Rejected", "Start Date": "11/09/25", "End Date": "15/09/25", "Mobile": "9876543209", "Email": "kavins.campus@gmail.com" },
  { "So No": 10, "Student Name": "Harini B.", "Register No.": "731523130010", "Department": "CSE", "Batch": "2024-2028", "Section": "A", "Company": "Infosys", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Passed", "Start Date": "16/09/25", "End Date": "20/09/25", "Mobile": "9876543210", "Email": "harinib.placement@gmail.com" },
  { "So No": 11, "Student Name": "Ramesh C.", "Register No.": "731523130011", "Department": "CSE", "Batch": "2024-2028", "Section": "B", "Company": "IBM", "Job Role": "Software Engineer", "Package": "8.0 LPA", "Rounds": "Round 2", "Status": "Rejected", "Start Date": "21/09/25", "End Date": "25/09/25", "Mobile": "9876543211", "Email": "rameshc.eng@gmail.com" },
  { "So No": 12, "Student Name": "Shalini D.", "Register No.": "731523130012", "Department": "CSE", "Batch": "2024-2028", "Section": "C", "Company": "TCS", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 3", "Status": "Passed", "Start Date": "26/09/25", "End Date": "30/09/25", "Mobile": "9876543212", "Email": "shalinid.project@gmail.com" },
  
  // New Batch: 2025-2029
  { "So No": 13, "Student Name": "Ajith V.", "Register No.": "731523130013", "Department": "CSE", "Batch": "2025-2029", "Section": "A", "Company": "Wipro", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Rejected", "Start Date": "01/10/25", "End Date": "05/10/25", "Mobile": "9876543213", "Email": "ajithv.data@gmail.com" },
  { "So No": 14, "Student Name": "Sindhu M.", "Register No.": "731523130014", "Department": "CSE", "Batch": "2025-2029", "Section": "B", "Company": "Infosys", "Job Role": "Software Engineer", "Package": "8.0 LPA", "Rounds": "Round 2", "Status": "Passed", "Start Date": "06/10/25", "End Date": "10/10/25", "Mobile": "9876543214", "Email": "sindhum.eng@gmail.com" },
  { "So No": 15, "Student Name": "Dinesh S.", "Register No.": "731523130015", "Department": "CSE", "Batch": "2025-2029", "Section": "C", "Company": "IBM", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 3", "Status": "Rejected", "Start Date": "11/10/25", "End Date": "15/10/25", "Mobile": "9876543215", "Email": "dineshs.tech@gmail.com" },
  { "So No": 16, "Student Name": "Janani P.", "Register No.": "731523130016", "Department": "CSE", "Batch": "2025-2029", "Section": "A", "Company": "TCS", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Passed", "Start Date": "16/10/25", "End Date": "20/10/25", "Mobile": "9876543216", "Email": "jananip.placement@gmail.com" },
  { "So No": 17, "Student Name": "Praveen J.", "Register No.": "731523130017", "Department": "CSE", "Batch": "2025-2029", "Section": "B", "Company": "Wipro", "Job Role": "Software Engineer", "Package": "8.0 LPA", "Rounds": "Round 2", "Status": "Rejected", "Start Date": "21/10/25", "End Date": "25/10/25", "Mobile": "9876543217", "Email": "praveenj.software@gmail.com" },
  { "So No": 18, "Student Name": "Anjali A.", "Register No.": "731523130018", "Department": "CSE", "Batch": "2025-2029", "Section": "C", "Company": "Infosys", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 3", "Status": "Passed", "Start Date": "26/10/25", "End Date": "30/10/25", "Mobile": "9876543218", "Email": "anjalia.college@gmail.com" },
];


function  ReportAnalysisSW({ onLogout, onViewChange }) {

  
  const navigate = useNavigate();
  
  const [filteredData, setFilteredData] = useState(initialData);
  const [companyFilter, setCompanyFilter] = useState('All Companies');
  const [batchFilter, setBatchFilter] = useState('Year / Batch');
  const [startDateFilter, setStartDateFilter] = useState(null); 
  const [endDateFilter, setEndDateFilter] = useState(null); 
  const [statusFilter, setStatusFilter] = useState('All'); 
  const [showExportMenu, setShowExportMenu] = useState(false); 
  
  // States for the text input (updates immediately)
  const [searchField, setSearchField] = useState('Mobile');
  const [searchText, setSearchText] = useState('');

  // States that store the values only after the 'Search' button is clicked
  const [appliedSearchField, setAppliedSearchField] = useState('Mobile');
  const [appliedSearchText, setAppliedSearchText] = useState('');

  // NEW State for search error/feedback
  const [searchError, setSearchError] = useState('');

  // UPDATED HELPER: Date formatter
  const getSortableDateString = (dateInput) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date && !isNaN(dateInput)) {
      const y = dateInput.getFullYear();
      const m = String(dateInput.getMonth() + 1).padStart(2, '0');
      const d = String(dateInput.getDate()).padStart(2, '0');
      return `${y}${m}${d}`; // YYYYMMDD
    }
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

  // Function to toggle the Print dropdown menu
  const handlePrintClick = (event) => {
    event.stopPropagation();
    setShowExportMenu(prev => !prev);
  }
  
  // Function to handle the Search button click (TRIGGER FOR SEARCH & VALIDATION)
  const handleSearchClick = () => {
      const currentSearchText = searchText.trim();
      setSearchError(''); // Clear previous error

      if (!currentSearchText) {
          // Allow empty search to clear the filter, but don't show an error
          setAppliedSearchText('');
          setAppliedSearchField('Mobile');
          return;
      }
      
      let error = '';
      
      // 1. Check for field mismatch (Intimation logic)
      if (searchField === 'Mobile') {
          if (isEmail(currentSearchText)) {
              error = "Please change the dropdown to 'Email' to search for an email address.";
          } 
      } else if (searchField === 'Email') {
          if (isMobile(currentSearchText)) {
              error = "Please change the dropdown to 'Mobile' to search for a 10-digit number.";
          }
      }

      if (error) {
          setSearchError(`❌ Search Error: ${error}`);
          // Do NOT apply the filter if there's a validation error
          setAppliedSearchText('INVALID'); // Use a placeholder that won't match any data
      } else {
          // Validation passed: apply the filter and clear any previous filter-related warnings
          setAppliedSearchText(currentSearchText);
          setAppliedSearchField(searchField);
      }
  };

  const exportMenuRef = useRef(null);

  // Effect to handle clicks outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showExportMenu]);

  // Effect to run filtering whenever any filter state changes (UPDATED DEPENDENCIES)
  useEffect(() => {
    let currentFilteredData = initialData;

    // 1. Apply all regular filters
    
    // Company Filter (Dropdown)
    if (companyFilter !== 'All Companies') {
      currentFilteredData = currentFilteredData.filter(student => student.Company.trim() === companyFilter.trim());
    }

    // Batch Filter (Dropdown)
    if (batchFilter !== 'Year / Batch') {
      currentFilteredData = currentFilteredData.filter(student => 
        student.Batch.trim() === batchFilter.trim()
      );
    }

    // Date Filters
    if (startDateFilter) {
      const filterStart = getSortableDateString(startDateFilter); 
      if (filterStart) {
        currentFilteredData = currentFilteredData.filter(student => {
          const studentStart = getSortableDateString(student["Start Date"]); 
          return studentStart && studentStart >= filterStart; 
        });
      }
    }

    if (endDateFilter) {
      const filterEnd = getSortableDateString(endDateFilter); 
      if (filterEnd) {
        currentFilteredData = currentFilteredData.filter(student => {
          const studentEnd = getSortableDateString(student["End Date"]); 
          return studentEnd && studentEnd <= filterEnd;
        });
      }
    }
    
    // Status Filter (Passed/All)
    if (statusFilter === 'Passed') {
        currentFilteredData = currentFilteredData.filter(student => student.Status === 'Passed');
    }

    // 2. Apply Text Search Filter (Uses the 'applied' state)
    const lowerCaseSearchText = appliedSearchText.toLowerCase().trim();
    if (lowerCaseSearchText) {
        // Only run this filter if appliedSearchText is NOT the 'INVALID' placeholder
        if (lowerCaseSearchText !== 'invalid') {
            const preSearchCount = currentFilteredData.length;
            const searchResults = currentFilteredData.filter(student => {
                const fieldToSearch = student[appliedSearchField];
                if (fieldToSearch) {
                    return String(fieldToSearch).toLowerCase().includes(lowerCaseSearchText);
                }
                return false;
            });
            currentFilteredData = searchResults;

            // 3. Intimate if no results found for the specific text search
            if (currentFilteredData.length === 0 && preSearchCount > 0) {
                setSearchError(` No matching record found for "${appliedSearchText}" in the selected column.`);
            } else if (currentFilteredData.length > 0) {
                setSearchError(''); // Clear no-match error if results are found
            }
        }
    } else {
        // Clear search-related errors if search text is empty (filter is off)
        setSearchError('');
    }


    setFilteredData(currentFilteredData);

    // Dependencies now include applied search states
  }, [companyFilter, batchFilter, startDateFilter, endDateFilter, statusFilter, appliedSearchField, appliedSearchText]); 
  

  const navigateToCompanyAnalysis = () => {
    navigate('/ReportanalysisCW'); 
  };
  
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

  // Export functions (kept the 'Rounds' column for data consistency)
  const exportToExcel = () => {
    try{
    const header = [
        "So No", "Student Name", "Register No.", "Department", "Batch", "Section", 
        "Company", "Job Role", "Package", "Rounds", "Status", "Start Date", "End Date", "Mobile", "Email"
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
        item["End Date"],
        item.Mobile,
        item.Email
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
    
    // UPDATED: Added Mobile and Email columns
    const tableColumn = [
        "S.No", "Student Name", "Reg No.", "Dept", "Batch", "Sec", 
        "Company", "Job Role", "Package", "Rounds", "Status", "Start Date", "End Date", "Mobile", "Email" 
    ];
    
    // UPDATED: Added Mobile and Email data
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
        item["End Date"],
        item.Mobile,
        item.Email
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
  
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const uniqueCompanies = ['All Companies', ...new Set(initialData.map(item => item.Company))];
const handleCardClick = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
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
        <div className={styles["co-main-content"]}  >
          <div className={styles["co-rat-filter-box"]}>
            <div className={styles["co-rat-tab-container"]}>
              <div className={styles["co-rat-tab-inactive"]} onClick={() => handleCardClick('report-analysis-rw')}>Round wise Analysis</div>
              <div className={styles["co-rat-tab-inactive"]} onClick={() => handleCardClick('report-analysis-cw')} >Company wise Analysis</div>
              <div className={styles["co-rat-tab-active"]}>Student wise Analysis</div>
            </div>

            <div className={styles["co-rat-filter-inputs"]}>
              {/* Company Filter */}
              <select 
                className={styles["co-rat-filter-select-1"]} 
                value={companyFilter} 
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                {uniqueCompanies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
              {/* Batch Filter */}
              <select 
                className={styles["co-rat-filter-select-2"]}
                value={batchFilter} 
                onChange={(e) => setBatchFilter(e.target.value)}
              >
                <option value="Year / Batch">Year / Batch</option>
                <option value="2023-2027">2023-2027</option>
                <option value="2024-2028">2024-2028</option>
                <option value="2025-2029">2025-2029</option>
                <option value="2026-2030">2026-2030</option>
                <option value="2027-2031">2027-2031</option>
                <option value="2028-2032">2028-2032</option>
                <option value="2029-2033">2029-2033</option>
                <option value="2030-2034">2030-2034</option>
              </select>
              
              {/* START DATE PICKER */}
              <DatePicker
                selected={startDateFilter}
                onChange={(date) => setStartDateFilter(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="Start Date"
                wrapperClassName={styles["co-rat-filter-date-input"]}
                isClearable={true}
              />

              {/* END DATE PICKER */}
              <DatePicker
                selected={endDateFilter}
                onChange={(date) => setEndDateFilter(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="End Date"
                wrapperClassName={styles["co-rat-filter-date-input"]}
                isClearable={true}
                minDate={startDateFilter} 
              />
              
            </div>
            
            {/* NEW SEARCH ROW CONTAINER */}
            <div className={styles["co-rat-search-row"]}>
                <span className={styles["co-rat-filter-label"]}>Select by text:</span>
                <select 
                    className={styles["co-rat-search-select"]} 
                    value={searchField}
                    onChange={(e) => setSearchField(e.target.value)}
                >
                    <option value="Mobile">Mobile</option>
                    <option value="Email">Email</option>
                </select>
                <input 
                    type="text" 
                    className={cx(
                      styles["co-rat-search-input"],
                      searchError && styles["co-rat-search-input-error"]
                    )}
                    placeholder={`Enter ${searchField}...`}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                          handleSearchClick();
                      }
                    }}
                />
                <button 
                    className={styles["co-rat-search-btn"]}
                    onClick={handleSearchClick} 
                >
                    Search
                </button>
            </div>

            {/* NEW: Error message display */}
            {searchError && (
                <div className={styles["co-rat-search-error"]}>
                    {searchError}
                </div>
            )}
`

          </div>

          <div className={styles["co-rat-table-section"]}>
            <div className={styles["co-rat-table-header-row"]}>
              <div className={styles["co-rat-table-title"]}>STUDENT ANALYSIS REPORT</div>
              <div className={styles["co-rat-table-actions"]}>
                <button 
                  className={statusFilter === 'Passed' ? styles["co-rat-view-status-btn-filtered"] : styles["co-rat-view-status-btn-all"]}
                  onClick={toggleStatusFilter}
                >
                  {statusFilter === 'Passed' ? 'View All Students' : 'View Passed Students'}
                </button>
                
                <div ref={exportMenuRef} className={styles["co-rat-print-button-container"]}>
                  <button 
                    className={styles["co-rat-print-btn"]} 
                    onClick={handlePrintClick} 
                  >
                    Print
                  </button>
                  
                  {showExportMenu && (
                    <div className={styles["co-rat-export-menu"]}>
                      <button className={styles["co-rat-export-menu-button"]} onClick={handleExportToExcel}>Export to Excel</button>
                      <button className={styles["co-rat-export-menu-button"]} onClick={handleExportToPDF}>Download as PDF</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <table className={styles["co-rat-data-table"]}>
              <div className={styles["co-rat-table-body-scroll"]}>
              <thead>
                <tr>

                  <th style={{width:"180px"}}>S.No</th>
                  <th style={{width:"180px",padding:"7px 0px"}}>Student Name</th>
                  <th style={{width:"190px",padding:"7px 0px 0px 40px"}}>Register No.</th>
                  <th style={{width:"230px",padding:"7px 0px 0px 40px"}}>Department</th>
                  <th style={{width:"180px"}}>Batch</th> 
                  <th style={{width:"180px"}}>Section</th>
                  <th style={{width:"180px"}}>Company</th>
                  <th style={{width:"180px"}}>Job Role</th>
                  <th style={{width:"180px"}}>Package</th>
                  <th style={{width:"180px"}}>Rounds</th>
                  <th style={{width:"180px"}}>Status</th>
                  <th style={{width:"180px",padding:"7px 0px 0px 0px", position:"relative", left:"15px"}}>Start Date</th>
                  <th style={{width:"180px",paddingRight:"10px", position:"relative", left:"20px"}}>End Date</th>
                  <th style={{width:"180px", position:"relative", left:"30px"}}>Mobile</th>
                  <th style={{width:"180px", position:"relative", left:"15px"}}>Email</th> 
                </tr>
              </thead>
              
              
                <tbody className={styles["co-rat-table-body"]}>
                  {filteredData.map((student, index) => (
                    <tr key={index}>
                      <td>{student["So No"]}</td>

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
                        <div className={student.Status === 'Passed' ? styles["co-rat-status-cell-passed"] : styles["co-rat-status-cell-rejected"]}>
                          {student.Status}
                        </div>
                      </td>

                      <td>{student["Start Date"]}</td>
                      <td>{student["End Date"]}</td>
                      <td>{student.Mobile}</td>
                      <td>{student.Email}</td> 
                    </tr>
                  ))}

                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan="15" style={{ textAlign: 'center', padding: '20px' }}>
                        No students found matching the current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </div>
            </table>
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

export default ReportAnalysisSW;