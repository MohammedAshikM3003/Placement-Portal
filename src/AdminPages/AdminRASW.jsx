import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx'; 
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css"; 

import Adnavbar from '../components/Navbar/Adnavbar.js';
import Adsidebar from '../components/Sidebar/Adsidebar.js';

// FIXED: Import CSS as a Module
import styles from './AdminRASW.module.css';

// Master data array
const initialData = [
  { "So No": 1, "Student Name": "Arun Kumar S.", "Register No.": "7315X00001", "Department": "CSE", "Batch": "2023-2027", "Section": "A", "Company": "Infosys", "Job Role": "Software Engineer", "Package": "12.0 LPA", "Rounds": "Round 5", "Status": "Passed", "Start Date": "01/08/25", "End Date": "05/08/25", "Placement Date": "29/08/25", "Email": "arun.kumar.s@example.com", "Mobile No.": "9788657400" },
  { "So No": 2, "Student Name": "Priya V.", "Register No.": "7315X00002", "Department": "CSE", "Batch": "2023-2027", "Section": "B", "Company": "Wipro", "Job Role": "Data Analyst", "Package": "7.0 LPA", "Rounds": "Round 2", "Status": "Rejected", "Start Date": "06/08/25", "End Date": "10/08/25", "Placement Date": "", "Email": "priya.v@example.com", "Mobile No.": "9788657401" },
  { "So No": 3, "Student Name": "Gowtham M.", "Register No.": "7315X00003", "Department": "CSE", "Batch": "2023-2027", "Section": "A", "Company": "TCS", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 1", "Status": "Rejected", "Start Date": "11/08/25", "End Date": "15/08/25", "Placement Date": "", "Email": "gowtham.m@example.com", "Mobile No.": "9788657402" },
  { "So No": 4, "Student Name": "Nithya R.", "Register No.": "7315X00004", "Department": "CSE", "Batch": "2023-2027", "Section": "A", "Company": "TCS", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Passed", "Start Date": "16/08/25", "End Date": "20/08/25", "Placement Date": "30/08/25", "Email": "nithya.r@example.com", "Mobile No.": "9788657403" },
  { "So No": 5, "Student Name": "Vikram K.", "Register No.": "7315X00005", "Department": "CSE", "Batch": "2023-2027", "Section": "B", "Company": "Wipro", "Job Role": "Software Engineer", "Package": "8.0 LPA", "Rounds": "Round 2", "Status": "Rejected", "Start Date": "21/08/25", "End Date": "25/08/25", "Placement Date": "", "Email": "vikram.k@example.com", "Mobile No.": "9788657404" },
  { "So No": 6, "Student Name": "Deepika P.", "Register No.": "7315X00006", "Department": "CSE", "Batch": "2023-2027", "Section": "C", "Company": "Infosys", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 3", "Status": "Passed", "Start Date": "26/08/25", "End Date": "30/08/25", "Placement Date": "01/09/25", "Email": "deepika.p@example.com", "Mobile No.": "9788657405" },
  { "So No": 7, "Student Name": "Sanjay R.", "Register No.": "7315X00007", "Department": "CSE", "Batch": "2024-2028", "Section": "A", "Company": "IBM", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Rejected", "Start Date": "01/09/25", "End Date": "05/09/25", "Placement Date": "", "Email": "sanjay.r@example.com", "Mobile No.": "9788657406" },
  { "So No": 8, "Student Name": "Meena L.", "Register No.": "7315X00008", "Department": "CSE", "Batch": "2024-2028", "Section": "B", "Company": "TCS", "Job Role": "Software Engineer", "Package": "8.0 LPA", "Rounds": "Round 2", "Status": "Passed", "Start Date": "06/09/25", "End Date": "10/09/25", "Placement Date": "12/09/25", "Email": "meena.l@example.com", "Mobile No.": "9788657407" },
  { "So No": 9, "Student Name": "Kavin S.", "Register No.": "7315X00009", "Department": "CSE", "Batch": "2024-2028", "Section": "C", "Company": "Wipro", "Job Role": "Project Engineer", "Package": "10.0 LPA", "Rounds": "Round 3", "Status": "Rejected", "Start Date": "11/09/25", "End Date": "15/09/25", "Placement Date": "", "Email": "kavin.s@example.com", "Mobile No.": "9788657408" },
  { "So No": 10, "Student Name": "Harini B.", "Register No.": "7315X00010", "Department": "CSE", "Batch": "2024-2028", "Section": "A", "Company": "Infosys", "Job Role": "Data Analyst", "Package": "6.0 LPA", "Rounds": "Round 1", "Status": "Passed", "Start Date": "16/09/25", "End Date": "20/09/25", "Placement Date": "22/09/25", "Email": "harini.b@example.com", "Mobile No.": "9788657409" },
];

function AdminRASW() {
  const navigate = useNavigate();
  
  const [filteredData, setFilteredData] = useState(initialData);
  const [companyFilter, setCompanyFilter] = useState('All Companies');
  const [batchFilter, setBatchFilter] = useState('Batch/Year');
  const [startDateFilter, setStartDateFilter] = useState(null); 
  const [endDateFilter, setEndDateFilter] = useState(null); 
  const [statusFilter, setStatusFilter] = useState('All'); 
  const [showExportMenu, setShowExportMenu] = useState(false); 
  
  const [searchType, setSearchType] = useState('Mobile number');
  const [searchInput, setSearchInput] = useState('');
  const [filteredBySearch, setFilteredBySearch] = useState(initialData);
  const [searchError, setSearchError] = useState('');

  // Helper function to format dates as DD-MM-YYYY
  const formatDisplayDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return '';
    const parts = dateString.split('/');
    if (parts.length !== 3) return dateString; 
  
    let [day, month, year] = parts;
    
    day = day.padStart(2, '0');
    month = month.padStart(2, '0');
  
    if (year.length === 2) {
      year = '20' + year;
    }
  
    return `${day}-${month}-${year}`;
  };

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
        year = (year.length === 2) ? '20' + year : year; 
        return `${year}${month}${day}`;
    } 
    
    return null;
  };

  const toggleStatusFilter = () => {
      setStatusFilter(prevStatus => prevStatus === 'All' ? 'Passed' : 'All');
  };

  const handlePrintClick = (event) => {
    event.stopPropagation();
    setShowExportMenu(prev => !prev);
  }

  const handleSearchClick = () => {
    setSearchError('');
    const trimmedInput = searchInput.trim();

    const isOnlyNumbers = /^\d+$/.test(trimmedInput);

    if (searchType === 'Email' && isOnlyNumbers && trimmedInput !== '') {
        setSearchError('You should select mobile number');
        return; 
    }
    
    if (searchType === 'Mobile number' && !isOnlyNumbers && trimmedInput !== '') {
        setSearchError('You should select email');
        return;
    }

    if (trimmedInput === '') {
        setFilteredBySearch(initialData);
        return;
    }

    const searchKey = searchType === 'Mobile number' ? 'Mobile No.' : 'Email';
    const searchTerm = trimmedInput.toLowerCase();

    const searchResults = initialData.filter(student => 
        student[searchKey] && String(student[searchKey]).toLowerCase().includes(searchTerm)
    );
    
    setFilteredBySearch(searchResults);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // UPDATED CLASS: Admin-rasw-print-button-container
      if (showExportMenu && !event.target.closest(`.${styles['Admin-rasw-print-button-container']}`)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showExportMenu]);

  useEffect(() => {
    let currentFilteredData = filteredBySearch; 

    if (companyFilter !== 'All Companies') {
      currentFilteredData = currentFilteredData.filter(student => student.Company.trim() === companyFilter.trim());
    }

    if (batchFilter !== 'Batch/Year') { 
      currentFilteredData = currentFilteredData.filter(student => 
        student.Batch.trim() === batchFilter.trim()
      );
    }

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
    
    if (statusFilter === 'Passed') {
        currentFilteredData = currentFilteredData.filter(student => student.Status === 'Passed');
    }

    setFilteredData(currentFilteredData);

  }, [companyFilter, batchFilter, startDateFilter, endDateFilter, statusFilter, filteredBySearch]);
  
  const exportToExcel = () => {
    // Corrected header order: Batch added, Status moved
    const header = [
        "So No", "Student Name", "Register No.", "Department", "Section", "Batch",
        "Company", "Job Role", "Package", "Rounds Reached", "Email", "Mobile",
        "Status (Selected Round)", "Start Date", "End Date"
    ];
    
    // Corrected data mapping order
    const data = filteredData.map((item) => [
        item["So No"], item["Student Name"], item["Register No."], item.Department,
        item.Section, item.Batch, item.Company, item["Job Role"], item.Package, item.Rounds,
        item.Email, item["Mobile No."], item.Status, formatDisplayDate(item["Start Date"]), 
        formatDisplayDate(item["End Date"])
    ]);
    
    const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Student Wise Analysis Report");
    XLSX.writeFile(wb, "StudentWiseAnalysis.xlsx");
    setShowExportMenu(false);
  };
  
  const exportToPDF = () => {
    const doc = new jsPDF('landscape'); 
    
    // Corrected column order
    const tableColumn = [
        "S.No", "Name", "Reg No.", "Dept", "Sec", "Batch", "Company", "Job Role", 
        "Package", "Rounds", "Email", "Mobile", "Status", "Start Date", "End Date"
    ];
    
    // Corrected data mapping order
    const tableRows = filteredData.map((item) => [
        item["So No"], item["Student Name"], item["Register No."], item.Department,
        item.Section, item.Batch, item.Company, item["Job Role"], item.Package, item.Rounds,
        item.Email, item["Mobile No."], item.Status, formatDisplayDate(item["Start Date"]),
        formatDisplayDate(item["End Date"])
    ]);
    
    doc.setFontSize(14);
    doc.text("Student Wise Analysis Report", 148, 15, null, null, "center");
    
    doc.autoTable({
        head: [tableColumn], body: tableRows, startY: 20,
        styles: { fontSize: 7, cellPadding: 1, overflow: 'linebreak' },
        headStyles: { fillColor: [78, 162, 78], textColor: 255, fontStyle: 'bold' },
        margin: { top: 20, left: 5, right: 5 },
    });
    
    doc.save("StudentWiseAnalysis.pdf");
    setShowExportMenu(false);
  };

  const uniqueCompanies = ['All Companies', ...new Set(initialData.map(item => item.Company))];

  return ( 
    <>
      <Adnavbar Adminicon={Adminicon} /> 
      {/* UPDATED CLASS: Admin-rasw-layout */}
      <div className={styles['Admin-rasw-layout']}>
        <Adsidebar />
        {/* UPDATED CLASS: Admin-rasw-main-content */}
        <div className={styles['Admin-rasw-main-content']}>
          {/* UPDATED CLASS: Admin-rasw-filter-box */}
          <div className={styles['Admin-rasw-filter-box']}>
            {/* UPDATED CLASSES: Admin-rasw-tab-container, Admin-rasw-tab-inactive, Admin-rasw-tab-active-green */}
            <div className={styles['Admin-rasw-tab-container']}>
              <div className={styles['Admin-rasw-tab-inactive']}>Round wise <br/> Analysis</div>
              <div className={styles['Admin-rasw-tab-inactive']}>Company wise <br/> Analysis</div>
              <div className={styles['Admin-rasw-tab-inactive']}>Department wise <br/>Analysis</div>
              <div className={styles['Admin-rasw-tab-active-green']}>Student wise<br/> Analysis</div>
            </div>

            {/* UPDATED CLASSES: Admin-rasw-filter-inputs, Admin-rasw-filter-select, Admin-rasw-filter-date-input */}
            <div className={styles['Admin-rasw-filter-inputs']}>
              <select className={styles['Admin-rasw-filter-select']} value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
                {uniqueCompanies.map(company => (<option key={company} value={company}>{company}</option>))}
              </select>
              <select className={styles['Admin-rasw-filter-select']} value={batchFilter} onChange={(e) => setBatchFilter(e.target.value)}>
                <option value="Batch/Year">Batch/Year</option>
                <option value="2023-2027">2023-2027</option>
                <option value="2024-2028">2024-2028</option>
                <option value="2025-2029">2025-2029</option>
              </select>
              <DatePicker selected={startDateFilter} onChange={(date) => setStartDateFilter(date)} dateFormat="dd/MM/yyyy" placeholderText="Start Date" className={styles['Admin-rasw-filter-date-input']} isClearable={true}/>
              <DatePicker selected={endDateFilter} onChange={(date) => setEndDateFilter(date)} dateFormat="dd/MM/yyyy" placeholderText="End Date" className={styles['Admin-rasw-filter-date-input']} isClearable={true} minDate={startDateFilter}/>
            </div>

            {/* UPDATED CLASSES: Admin-rasw-search-row, Admin-rasw-select-label, Admin-rasw-select-type-dropdown, Admin-rasw-search-input-field, Admin-rasw-search-btn-blue */}
            <div className={styles['Admin-rasw-search-row']}> 
              <div className={styles['Admin-rasw-select-label']}>Select by:</div>
              <select className={styles['Admin-rasw-select-type-dropdown']} value={searchType} onChange={(e) => { setSearchType(e.target.value); setSearchError(''); }}>
                <option value="Mobile number">Mobile number</option> 
                <option value="Email">Email</option>
              </select>
              <input type="text" placeholder={searchType === 'Mobile number' ? 'Enter Mobile Number' : 'Enter Email'} className={styles['Admin-rasw-search-input-field']} value={searchInput} onChange={(e) => { setSearchInput(e.target.value); setSearchError(''); }}/>
              <button className={styles['Admin-rasw-search-btn-blue']} onClick={handleSearchClick}>Search</button>
            </div>
            {searchError && <div style={{ color: 'red', fontSize: '0.9rem', marginTop: '4px', paddingLeft: '95px' }}>{searchError}</div>}
          </div>
        
          {/* UPDATED CLASS: Admin-rasw-table-section */}
          <div className={styles['Admin-rasw-table-section']}>
            {/* UPDATED CLASSES for table header row, actions, print button */}
            <div className={styles['Admin-rasw-table-header-row']}>
              <div className={styles['Admin-rasw-table-title']}>STUDENT WISE ANALYSIS</div>
              <div className={styles['Admin-rasw-table-actions']}>
                <button className={statusFilter === 'Passed' ? styles['Admin-rasw-view-status-btn-filtered'] : styles['Admin-rasw-view-status-btn-all']} onClick={toggleStatusFilter}>
                  {statusFilter === 'Passed' ? 'View All' : 'View status'}
                </button>
                <div className={styles['Admin-rasw-print-button-container']}>
                  <button className={styles['Admin-rasw-print-btn-green']} onClick={handlePrintClick}>Print</button>
                  {showExportMenu && (
                    <div className={styles['Admin-rasw-export-menu']}>
                      <button onClick={exportToExcel}>Export to Excel</button>
                      <button onClick={exportToPDF}>Download as PDF</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* UPDATED CLASSES for table structure, headers, body, and status cells */}
            <table className={styles['Admin-rasw-data-table']}>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Student Name</th>
                  <th>Register No.</th>
                  <th>Department</th>
                  <th>Section</th>
                  <th>Batch</th> 
                  <th>Company</th>
                  <th>Job Role</th>
                  <th>Package</th>
                  <th>Rounds Reached</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Status</th> 
                  <th>Start Date</th>
                  <th>End Date</th>
                </tr>
              </thead>
              <div className={styles['Admin-rasw-table-body-scroll']}>
                <tbody>
                  {filteredData.map((student, index) => (
                    <tr key={index}>
                      <td>{student["So No"]}</td>
                      <td>{student["Student Name"]}</td>
                      <td>{student["Register No."]}</td>
                      <td>{student.Department}</td>
                      <td>{student.Section}</td>
                      <td>{student.Batch}</td> 
                      <td>{student.Company}</td>
                      <td>{student["Job Role"]}</td>
                      <td>{student.Package}</td>
                      <td>{student.Rounds}</td>
                      <td>{student.Email}</td>
                      <td>{student["Mobile No."]}</td>
                      <td>
                        <div className={student.Status === 'Passed' ? styles['Admin-rasw-status-cell-placed-green'] : styles['Admin-rasw-status-cell-rejected']}>
                          {student.Status === 'Passed' ? 'Placed' : 'Rejected'} 
                        </div>
                      </td>
                      <td>{formatDisplayDate(student["Start Date"])}</td>
                      <td>{formatDisplayDate(student["End Date"])}</td>
                    </tr>
                  ))}

                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan="15" style={{ textAlign: 'center', padding: '20px', width: '100%', display: 'block' }}>
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

export default AdminRASW;