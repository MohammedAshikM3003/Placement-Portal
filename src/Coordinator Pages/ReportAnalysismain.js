import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx'; 
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// NEW IMPORTS for Date Picker

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Import New Components
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";

import './ReportAnalysismain.css'


// Import necessary assets for the Navbar (Adminicon)
import Adminicon from "../assets/Adminicon.png";

// Master data array (Batches are mixed)
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

// Helper array for easy iteration over rounds
const roundNames = Array.from({ length: 12 }, (_, i) => `Round ${i + 1}`);

function  CoReportAnalysismain({ onLogout, currentView, onViewChange }) {

  
  const navigate = useNavigate();
  
  const [filteredData, setFilteredData] = useState(initialData);
  const [companyFilter, setCompanyFilter] = useState('All Companies');
  const [batchFilter, setBatchFilter] = useState('Year / Batch');
  // UPDATED STATE: Initialize as Date objects or null for react-datepicker
  const [startDateFilter, setStartDateFilter] = useState(null); 
  const [endDateFilter, setEndDateFilter] = useState(null); 
  const [statusFilter, setStatusFilter] = useState('All'); 
  const [showExportMenu, setShowExportMenu] = useState(false); 
  const [activeRound, setActiveRound] = useState('Round 1');


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

  // Function to toggle the "View status" filter
  const toggleStatusFilter = () => {
      setStatusFilter(prevStatus => prevStatus === 'All' ? 'Passed' : 'All');
  };



  

  // Function to handle round button click
  const handleRoundClick = (roundName) => {
    setActiveRound(roundName);
  }

  // Function to toggle the Print dropdown menu
  const handlePrintClick = (event) => {
    event.stopPropagation();
    setShowExportMenu(prev => !prev);
  }

  // Effect to handle clicks outside the menu to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('.co-ram-print-button-container')) {
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

    // 1. Company Filter (Dropdown)
    if (companyFilter !== 'All Companies') {
      currentFilteredData = currentFilteredData.filter(student => student.Company.trim() === companyFilter.trim());
    }

    // 2. Batch Filter (Dropdown)
    if (batchFilter !== 'Year / Batch') {
      currentFilteredData = currentFilteredData.filter(student => 
        student.Batch.trim() === batchFilter.trim()
      );
    }

    // 3. Start Date Filter (Date Picker)
    // NOTE: startDateFilter is now a Date object or null
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
    // NOTE: endDateFilter is now a Date object or null
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

    // 6. Round Filter
    if (activeRound) {
        currentFilteredData = currentFilteredData.filter(student => student.Rounds.trim() === activeRound.trim());
    }


    setFilteredData(currentFilteredData);

  }, [companyFilter, batchFilter, startDateFilter, endDateFilter, statusFilter, activeRound]); 
  

  const navigateToCompanyAnalysis = () => {
    navigate('/ReportanalysisCW'); 
  };
  // ... (exportToExcel and exportToPDF functions remain the same)
  const exportToExcel = () => {
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
  };
  
  const exportToPDF = () => {
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
    
    doc.save("RoundWiseAnalysis.pdf");
    setShowExportMenu(false);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // ... (rest of the component)

  const uniqueCompanies = ['All Companies', ...new Set(initialData.map(item => item.Company))];


  return ( 
    <>
      <Navbar onToggleSidebar={toggleSidebar}  Adminicon={Adminicon} /> 
      <div className="co-layout">
        <Sidebar  isOpen={isSidebarOpen} onLogout={onLogout} currentView="report-analysis" onViewChange={onViewChange} />
        <div className="co-main-content" style={{marginLeft:'295px'
        }}>
          <div className="co-ram-filter-box">
            <div className="co-ram-tab-container">
              <div className="co-ram-tab-active">Round wise Analysis</div>
              <div className="co-ram-tab-inactive"  onClick={() => navigate(`/report-analysiscw`)} >Company wise  Analysis</div>
              <div className="co-ram-tab-inactive"  onClick={() => navigate(`/report-analysissw`)}>Student wise  Analysis</div>
            </div>

            <div className="co-ram-filter-inputs">
              {/* Company Filter (NO CHANGE) */}
              <select 
                className="co-ram-filter-select-1" 
                value={companyFilter} 
                onChange={(e) => setCompanyFilter(e.target.value)}
              >
                {uniqueCompanies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
              {/* Batch Filter (NO CHANGE) */}
              <select 
                className="co-ram-filter-select-2"
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
              
              {/* START DATE PICKER (UPDATED) */}
              <DatePicker
              
                selected={startDateFilter}
                onChange={(date) => setStartDateFilter(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="Start Date"
                className="co-ram-filter-date-input"
                isClearable={true}
              />

              {/* END DATE PICKER (UPDATED) */}
              <DatePicker
                selected={endDateFilter}
                onChange={(date) => setEndDateFilter(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="End Date"
                className="co-ram-filter-date-input"
                isClearable={true}
                minDate={startDateFilter} // Optional: Ensure end date is after start date
              />
              
            </div>
          </div>

        <div className="co-ram-round-buttons-container">
            {roundNames.map((roundName) => (
                <button 
                    key={roundName}
                    className={`co-ram-round-button ${activeRound === roundName ? 'co-ram-round-button-active' : 'co-ram-round-button-inactive'}`}
                    onClick={() => handleRoundClick(roundName)}
                >
                    {roundName}
                </button>
            ))}
        </div>

          <div className="co-ram-table-section">
            <div className="co-ram-table-header-row">
              <div className="co-ram-table-title">ROUND WISE ANALYSIS</div>
              <div className="co-ram-table-actions">
                <button 
                  className={statusFilter === 'Passed' ? "co-ram-view-status-btn-filtered" : "co-ram-view-status-btn-all"}
                  onClick={toggleStatusFilter}
                >
                  {statusFilter === 'Passed' ? 'View All Students' : 'View Passed Students'}
                </button>
                
                <div className="co-ram-print-button-container">
                  <button 
                    className="co-ram-print-btn" 
                    onClick={handlePrintClick} 
                  >
                    Print
                  </button>
                  
                  {showExportMenu && (
                    <div className="co-ram-export-menu">
                      <button onClick={exportToExcel}>Export to Excel</button>
                      <button onClick={exportToPDF}>Download as PDF</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <table className="co-ram-data-table">
              <thead>
                <tr>
                  <th style={{width:"180px"}}>So No</th>
                  <th style={{width:"180px",padding:"7px 0px"}}>Student Name</th>
                  <th style={{width:"180px",padding:"7px 0px 0px 40px"}}>Register No.</th >
                  <th style={{width:"230px",padding:"7px 0px 0px 40px"}}>Department</th>
                  <th style={{width:"180px"}}>Batch</th > 
                  <th style={{width:"180px"}}>Section</th >
                  <th style={{width:"180px"}}>Company</th >
                  <th style={{width:"180px"}}>Job Role</th >
                  <th style={{width:"180px"}}>Package</th >
                  <th style={{width:"180px"}}>Rounds</th >
                  <th style={{width:"180px"}}>Status</th>
                  <th style={{width:"180px",padding:"7px 0px 0px 0px"}}>Start Date</th >
                  <th style={{width:"180px",paddingRight:"20px"}}>End Date</th>
                </tr>
              </thead>
              
              <div className="co-ram-table-body-scroll">
                <tbody>
                  {filteredData.map((student, index) => (
                    <tr key={index} >
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
                        <div className={student.Status === 'Passed' ? "co-ram-status-cell-passed" : "co-ram-status-cell-rejected"}>
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
              </div>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default CoReportAnalysismain;