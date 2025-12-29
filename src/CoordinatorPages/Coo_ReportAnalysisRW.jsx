import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";

import styles from './Coo_ReportAnalysisRW.module.css';
import Adminicon from "../assets/Adminicon.png";

const cx = (...classNames) => classNames.filter(Boolean).join(' ');

const ExportProgressPopup = ({ isOpen, operation, progress, onClose }) => {
  if (!isOpen) return null;

  const operationText = operation === 'excel' ? 'Exporting...' : 'Downloading...';
  const progressText = operation === 'excel' ? 'Exported' : 'Downloaded';

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={styles["co-ram-export-popup-overlay"]}>
      <div className={styles["co-ram-export-popup-container"]}>
        <div className={styles["co-ram-export-popup-header"]}>{operationText}</div>
        <div className={styles["co-ram-export-popup-body"]}>
          <div className={styles["co-ram-export-progress-circle"]}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke="#e0e0e0"
                strokeWidth="8"
              />
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
            <div className={styles["co-ram-export-progress-text"]}>{progress}%</div>
          </div>
          <h2 className={styles["co-ram-export-popup-title"]}>{progressText} {progress}%</h2>
          <p className={styles["co-ram-export-popup-message"]}>
            The Details have been {operation === 'excel' ? 'Exporting...' : 'Downloading...'}
          </p>
          <p className={styles["co-ram-export-popup-message"]}>Please wait...</p>
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
    <div className={styles["co-ram-export-popup-overlay"]}>
      <div className={styles["co-ram-export-popup-container"]}>
        <div className={styles["co-ram-export-popup-header"]}>{headerText}</div>
        <div className={styles["co-ram-export-popup-body"]}>
          <div className={styles["co-ram-export-success-icon"]}>
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
          <h2 className={styles["co-ram-export-popup-title"]}>{title}</h2>
          <p className={styles["co-ram-export-popup-message"]}>{message}</p>
        </div>
        <div className={styles["co-ram-export-popup-footer"]}>
          <button onClick={onClose} className={styles["co-ram-export-popup-close-btn"]}>Close</button>
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
    <div className={styles["co-ram-export-popup-overlay"]}>
      <div className={styles["co-ram-export-popup-container"]}>
        <div className={styles["co-ram-export-popup-header"]}>{headerText}</div>
        <div className={styles["co-ram-export-popup-body"]}>
          <div className={styles["co-ram-export-failed-icon"]}>
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
          <h2 className={styles["co-ram-export-popup-title"]}>{title}</h2>
          <p className={styles["co-ram-export-popup-message"]}>{message}</p>
        </div>
        <div className={styles["co-ram-export-popup-footer"]}>
          <button onClick={onClose} className={styles["co-ram-export-popup-close-btn"]}>Close</button>
        </div>
      </div>
    </div>
  );
};

const initialData = [
  { "So No": 1, "Student Name": "Arun Kumar S.", "Register No.": "731523130001", "Department": "CSE", "Batch": "2023-2027", "Section": "A", "Company": "Infosys", "Job Role": "Software Engineer", "Package": "12.0 LPA", "Rounds": "Round 3", "Status": "Passed", "Start Date": "01/08/25", "End Date": "05/08/25" },
  { "So No": 2, "Student Name": "Priya V.", "Register No.": "731523130002", "Department": "CSE", "Batch": "2023-2027", "Section": "B", "Company": "Wipro", "Job Role": "Data Analyst", "Package": "7.0 LPA", "Rounds": "Round 2", "Status": "Rejected", "Start Date": "06/08/25", "End Date": "10/08/25" },
  { "So No": 3, "Student Name": "Gowtham M.", "Register No.": "731523130003", "Department": "CSE", "Batch": "2023-2027", "Section": "A", "Company": "TCS", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 1", "Status": "Rejected", "Start Date": "11/08/25", "End Date": "15/08/25" },
  { "So No": 4, "Student Name": "Nithya R.", "Register No.": "731523130004", "Department": "CSE", "Batch": "2023-2027", "Section": "A", "Company": "TCS", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Passed", "Start Date": "16/08/25", "End Date": "20/08/25" },
  { "So No": 5, "Student Name": "Vikram K.", "Register No.": "731523130005", "Department": "CSE", "Batch": "2023-2027", "Section": "B", "Company": "Wipro", "Job Role": "Software Engineer", "Package": "8.0 LPA", "Rounds": "Round 2", "Status": "Rejected", "Start Date": "21/08/25", "End Date": "25/08/25" },
  { "So No": 6, "Student Name": "Deepika P.", "Register No.": "731523130006", "Department": "CSE", "Batch": "2023-2027", "Section": "C", "Company": "Infosys", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 3", "Status": "Passed", "Start Date": "26/08/25", "End Date": "30/08/25" },
  { "So No": 7, "Student Name": "Sanjay R.", "Register No.": "731523130007", "Department": "CSE", "Batch": "2024-2028", "Section": "A", "Company": "IBM", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Rejected", "Start Date": "01/09/25", "End Date": "05/09/25" },
  { "So No": 8, "Student Name": "Meena L.", "Register No.": "731523130008", "Department": "CSE", "Batch": "2024-2028", "Section": "B", "Company": "TCS", "Job Role": "Software Engineer", "Package": "8.0 LPA", "Rounds": "Round 2", "Status": "Passed", "Start Date": "06/09/25", "End Date": "10/09/25" },
  { "So No": 9, "Student Name": "Kavin S.", "Register No.": "731523130009", "Department": "CSE", "Batch": "2024-2028", "Section": "C", "Company": "Wipro", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 3", "Status": "Rejected", "Start Date": "11/09/25", "End Date": "15/09/25" },
  { "So No": 10, "Student Name": "Harini B.", "Register No.": "731523130010", "Department": "CSE", "Batch": "2024-2028", "Section": "A", "Company": "Infosys", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Passed", "Start Date": "16/09/25", "End Date": "20/09/25" },
  { "So No": 11, "Student Name": "Ramesh C.", "Register No.": "731523130011", "Department": "CSE", "Batch": "2024-2028", "Section": "B", "Company": "IBM", "Job Role": "Software Engineer", "Package": "8.0 LPA", "Rounds": "Round 2", "Status": "Rejected", "Start Date": "21/09/25", "End Date": "25/09/25" },
  { "So No": 12, "Student Name": "Shalini D.", "Register No.": "731523130012", "Department": "CSE", "Batch": "2024-2028", "Section": "C", "Company": "TCS", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 3", "Status": "Passed", "Start Date": "26/09/25", "End Date": "30/09/25" },
  { "So No": 13, "Student Name": "Ajith V.", "Register No.": "731523130013", "Department": "CSE", "Batch": "2025-2029", "Section": "A", "Company": "Wipro", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Rejected", "Start Date": "01/10/25", "End Date": "05/10/25" },
  { "So No": 14, "Student Name": "Sindhu M.", "Register No.": "731523130014", "Department": "CSE", "Batch": "2025-2029", "Section": "B", "Company": "Infosys", "Job Role": "Software Engineer", "Package": "8.0 LPA", "Rounds": "Round 2", "Status": "Passed", "Start Date": "06/10/25", "End Date": "10/10/25" },
  { "So No": 15, "Student Name": "Dinesh S.", "Register No.": "731523130015", "Department": "CSE", "Batch": "2025-2029", "Section": "C", "Company": "IBM", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 3", "Status": "Rejected", "Start Date": "11/10/25", "End Date": "15/10/25" },
  { "So No": 16, "Student Name": "Janani P.", "Register No.": "731523130016", "Department": "CSE", "Batch": "2025-2029", "Section": "A", "Company": "TCS", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Passed", "Start Date": "16/10/25", "End Date": "20/10/25" },
  { "So No": 17, "Student Name": "Praveen J.", "Register No.": "731523130017", "Department": "CSE", "Batch": "2025-2029", "Section": "B", "Company": "Wipro", "Job Role": "Software Engineer", "Package": "8.0 LPA", "Rounds": "Round 2", "Status": "Rejected", "Start Date": "21/10/25", "End Date": "25/10/25" },
  { "So No": 18, "Student Name": "Anjali A.", "Register No.": "731523130018", "Department": "CSE", "Batch": "2025-2029", "Section": "C", "Company": "Infosys", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 3", "Status": "Passed", "Start Date": "26/10/25", "End Date": "30/10/25" }
];

const roundNames = Array.from({ length: 12 }, (_, i) => `Round ${i + 1}`);

function CoReportAnalysismain({ onLogout, onViewChange }) {
  const [filteredData, setFilteredData] = useState(initialData);
  const [companyFilter, setCompanyFilter] = useState('All Companies');
  const [batchFilter, setBatchFilter] = useState('Year / Batch');
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [activeRound, setActiveRound] = useState('Round 1');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [exportPopupState, setExportPopupState] = useState({
    isOpen: false,
    type: null,
    operation: null,
    progress: 0
  });

  const getSortableDateString = (dateInput) => {
    if (!dateInput) return null;

    if (dateInput instanceof Date && !isNaN(dateInput)) {
      const y = dateInput.getFullYear();
      const m = String(dateInput.getMonth() + 1).padStart(2, '0');
      const d = String(dateInput.getDate()).padStart(2, '0');
      return `${y}${m}${d}`;
    }

    if (typeof dateInput === 'string' && dateInput.includes('/')) {
      const dateString = dateInput.trim();
      const parts = dateString.split('/');
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      year = year.length === 2 ? `20${year}` : year;
      return `${year}${month}${day}`;
    }

    return null;
  };

  const toggleStatusFilter = () => {
    setStatusFilter(prevStatus => (prevStatus === 'All' ? 'Passed' : 'All'));
  };

  const handleRoundClick = (roundName) => {
    setActiveRound(roundName);
  };

  const handlePrintClick = (event) => {
    event.stopPropagation();
    setShowExportMenu(prev => !prev);
  };

  const exportMenuRef = useRef(null);

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

  useEffect(() => {
    let currentFilteredData = initialData;

    if (companyFilter !== 'All Companies') {
      currentFilteredData = currentFilteredData.filter(
        (student) => student.Company.trim() === companyFilter.trim()
      );
    }

    if (batchFilter !== 'Year / Batch') {
      currentFilteredData = currentFilteredData.filter(
        (student) => student.Batch.trim() === batchFilter.trim()
      );
    }

    if (startDateFilter) {
      const filterStart = getSortableDateString(startDateFilter);
      if (filterStart) {
        currentFilteredData = currentFilteredData.filter((student) => {
          const studentStart = getSortableDateString(student["Start Date"]);
          return studentStart && studentStart >= filterStart;
        });
      }
    }

    if (endDateFilter) {
      const filterEnd = getSortableDateString(endDateFilter);
      if (filterEnd) {
        currentFilteredData = currentFilteredData.filter((student) => {
          const studentEnd = getSortableDateString(student["End Date"]);
          return studentEnd && studentEnd <= filterEnd;
        });
      }
    }

    if (statusFilter === 'Passed') {
      currentFilteredData = currentFilteredData.filter(
        (student) => student.Status === 'Passed'
      );
    }

    if (activeRound) {
      currentFilteredData = currentFilteredData.filter(
        (student) => student.Rounds.trim() === activeRound.trim()
      );
    }

    setFilteredData(currentFilteredData);
  }, [companyFilter, batchFilter, startDateFilter, endDateFilter, statusFilter, activeRound]);

  const simulateExport = async (operation, exportFunction) => {
    setShowExportMenu(false);

    setExportPopupState({
      isOpen: true,
      type: 'progress',
      operation,
      progress: 0
    });

    let progressInterval;
    let progressTimeout;

    try {
      progressInterval = setInterval(() => {
        setExportPopupState(prev => {
          if (prev.progress < 100 && prev.type === 'progress') {
            return { ...prev, progress: Math.min(prev.progress + 10, 100) };
          }
          return prev;
        });
      }, 200);

      await new Promise((resolve) => {
        progressTimeout = setTimeout(() => {
          clearInterval(progressInterval);
          resolve();
        }, 2000);
      });

      exportFunction();

      setExportPopupState({
        isOpen: true,
        type: 'success',
        operation,
        progress: 100
      });
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      if (progressTimeout) clearTimeout(progressTimeout);

      setExportPopupState({
        isOpen: true,
        type: 'failed',
        operation,
        progress: 0
      });
    }
  };

  const exportToExcel = () => {
    try {
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
      XLSX.utils.book_append_sheet(wb, ws, "Round Analysis Report");
      XLSX.writeFile(wb, "RoundWiseAnalysis.xlsx");

      setShowExportMenu(false);
    } catch (error) {
      throw error;
    }
  };

  const exportToPDF = () => {
    try {
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
      doc.text("Round Wise Analysis Report", 148, 15, null, null, "center");

      autoTable(doc, {
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

      doc.save("RoundWiseAnalysis.pdf");
      setShowExportMenu(false);
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

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleCardClick = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
  };

  const uniqueCompanies = ['All Companies', ...new Set(initialData.map(item => item.Company))];

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
          <div className={styles["co-ram-filter-box"]}>
            <div className={styles["co-ram-tab-container"]}>
              <div className={styles["co-ram-tab-active"]}>Round wise Analysis</div>
              <div
                className={styles["co-ram-tab-inactive"]}
                onClick={() => handleCardClick('report-analysis-cw')}
              >
                Company wise  Analysis
              </div>
              <div
                className={styles["co-ram-tab-inactive"]}
                onClick={() => handleCardClick('report-analysis-sw')}
              >
                Student wise  Analysis
              </div>
            </div>

            <div className={styles["co-ram-filter-inputs"]}>
              <select
                className={styles["co-ram-filter-select-1"]}
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                {uniqueCompanies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>

              <select
                className={styles["co-ram-filter-select-2"]}
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

              <DatePicker
                selected={startDateFilter}
                onChange={(date) => setStartDateFilter(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="Start Date"
                className={styles["co-ram-filter-date-input"]}
                isClearable
              />

              <DatePicker
                selected={endDateFilter}
                onChange={(date) => setEndDateFilter(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="End Date"
                className={styles["co-ram-filter-date-input"]}
                isClearable
                minDate={startDateFilter}
              />
            </div>
          </div>

          <div className={styles["co-ram-round-buttons-container"]}>
            {roundNames.map((roundName) => (
              <button
                key={roundName}
                className={cx(
                  styles["co-ram-round-button"],
                  activeRound === roundName
                    ? styles["co-ram-round-button-active"]
                    : styles["co-ram-round-button-inactive"]
                )}
                onClick={() => handleRoundClick(roundName)}
              >
                {roundName}
              </button>
            ))}
          </div>

          <div className={styles["co-ram-table-section"]}>
            <div className={styles["co-ram-table-header-row"]}>
              <div className={styles["co-ram-table-title"]}>ROUND WISE ANALYSIS</div>
              <div className={styles["co-ram-table-actions"]}>
                <button
                  className={statusFilter === 'Passed'
                    ? styles["co-ram-view-status-btn-filtered"]
                    : styles["co-ram-view-status-btn-all"]}
                  onClick={toggleStatusFilter}
                >
                  {statusFilter === 'Passed' ? 'View All Students' : 'View Passed Students'}
                </button>

                <div ref={exportMenuRef} className={styles["co-ram-print-button-container"]}>
                  <button
                    className={styles["co-ram-print-btn"]}
                    onClick={handlePrintClick}
                  >
                    Print
                  </button>

                  {showExportMenu && (
                    <div className={styles["co-ram-export-menu"]}>
                      <button
                        className={styles["co-ram-export-menu-button"]}
                        onClick={handleExportToExcel}
                      >
                        Export to Excel
                      </button>
                      <button
                        className={styles["co-ram-export-menu-button"]}
                        onClick={handleExportToPDF}
                      >
                        Download as PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles["co-ram-table-body-scroll"]}>
              <table className={styles["co-ram-data-table"]}>
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

                <tbody className={styles["co-ram-table-body"]}>
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
                          ? styles["co-ram-status-cell-passed"]
                          : styles["co-ram-status-cell-rejected"]}
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

      {exportPopupState.isOpen && exportPopupState.type === 'progress' && (
        <ExportProgressPopup
          isOpen
          operation={exportPopupState.operation}
          progress={exportPopupState.progress}
          onClose={() => setExportPopupState({ isOpen: false, type: null, operation: null, progress: 0 })}
        />
      )}

      {exportPopupState.isOpen && exportPopupState.type === 'success' && (
        <ExportSuccessPopup
          isOpen
          operation={exportPopupState.operation}
          onClose={() => setExportPopupState({ isOpen: false, type: null, operation: null, progress: 0 })}
        />
      )}

      {exportPopupState.isOpen && exportPopupState.type === 'failed' && (
        <ExportFailedPopup
          isOpen
          operation={exportPopupState.operation}
          onClose={() => setExportPopupState({ isOpen: false, type: null, operation: null, progress: 0 })}
        />
      )}
    </>
  );
}

export default CoReportAnalysismain;