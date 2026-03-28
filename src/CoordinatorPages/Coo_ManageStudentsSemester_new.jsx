import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import styles from './Coo_ManageStudentsSemester_new.module.css';
import studentcapicon from "../assets/studentcapicon.svg";
import Adminicon from "../assets/Adminicon.png";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import mongoDBService from "../services/mongoDBService.jsx";

// Helper functions
const readStoredCoordinatorData = () => {
    if (typeof window === 'undefined') return null;
    try {
        const stored = window.localStorage.getItem('coordinatorData');
        return stored ? JSON.parse(stored) : null;
    } catch (error) {
        console.error('Error reading coordinator data:', error);
        return null;
    }
};

const normalizeId = (val) => {
    if (!val) return '';
    if (typeof val === 'object') {
        return val._id ? normalizeId(val._id) : val.$oid ? String(val.$oid) : '';
    }
    const str = val.toString ? val.toString() : '';
    return str && str !== '[object Object]' ? str : '';
};

const resolveCoordinatorDepartment = (data) => {
    if (!data) return null;
    const deptValue =
        data.department ||
        data.branch ||
        data.dept ||
        data.departmentName ||
        data.coordinatorDepartment ||
        data.assignedDepartment;
    return deptValue ? deptValue.toString().toUpperCase() : null;
};

// Icon components
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }}>
    <circle cx="11" cy="11" r="8"></circle>
    <path d="m21 21-4.35-4.35"></path>
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

// Utility functions
const toStringSafe = (value) => (value === undefined || value === null ? '' : String(value).trim());

const toUpperSafe = (value) => toStringSafe(value).toUpperCase();

const formatGpa = (value) => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  const num = Number(value);
  if (Number.isFinite(num)) {
    return num.toFixed(1);
  }
  return String(value).trim();
};

const getDisplayValue = (value, fallback = '-') => (
  value === undefined || value === null || value === '' ? fallback : value
);

// Sample data - replace with actual API call
const generateSampleData = () => [
  {
    id: '1',
    regNo: '7315XXXXXXX',
    name: 'Ravinder',
    year: 'III',
    semester: '5',
    section: 'B',
    arrears: 0,
    overallArrears: 0,
    cgpa: '9.1',
    overallCgpa: '9.1'
  },
  {
    id: '2',
    regNo: '7315XXXXXXX',
    name: 'Alice',
    year: 'II',
    semester: '3',
    section: 'A',
    arrears: 2,
    overallArrears: 6,
    cgpa: '7.1',
    overallCgpa: '7.4'
  },
  {
    id: '3',
    regNo: '7315XXXXXXX',
    name: 'Jhon',
    year: 'III',
    semester: '6',
    section: 'C',
    arrears: 1,
    overallArrears: 10,
    cgpa: '6.8',
    overallCgpa: '6.9'
  },
  {
    id: '4',
    regNo: '7315XXXXXXX',
    name: 'Ashik',
    year: 'IV',
    semester: '7',
    section: 'D',
    arrears: 0,
    overallArrears: 0,
    cgpa: '9.1',
    overallCgpa: '9.1'
  },
  {
    id: '5',
    regNo: '7315XXXXXXX',
    name: 'Priya',
    year: 'II',
    semester: '4',
    section: 'A',
    arrears: 1,
    overallArrears: 3,
    cgpa: '8.2',
    overallCgpa: '8.0'
  },
  {
    id: '6',
    regNo: '7315XXXXXXX',
    name: 'Kumar',
    year: 'III',
    semester: '5',
    section: 'B',
    arrears: 0,
    overallArrears: 2,
    cgpa: '7.8',
    overallCgpa: '7.9'
  },
  {
    id: '7',
    regNo: '7315XXXXXXX',
    name: 'Sneha',
    year: 'IV',
    semester: '8',
    section: 'C',
    arrears: 0,
    overallArrears: 0,
    cgpa: '9.5',
    overallCgpa: '9.4'
  },
  {
    id: '8',
    regNo: '7315XXXXXXX',
    name: 'Rahul',
    year: 'II',
    semester: '3',
    section: 'D',
    arrears: 3,
    overallArrears: 8,
    cgpa: '6.5',
    overallCgpa: '6.7'
  },
  {
    id: '9',
    regNo: '7315XXXXXXX',
    name: 'Divya',
    year: 'III',
    semester: '6',
    section: 'A',
    arrears: 0,
    overallArrears: 1,
    cgpa: '8.8',
    overallCgpa: '8.6'
  },
  {
    id: '10',
    regNo: '7315XXXXXXX',
    name: 'Arjun',
    year: 'IV',
    semester: '7',
    section: 'B',
    arrears: 1,
    overallArrears: 4,
    cgpa: '7.5',
    overallCgpa: '7.6'
  }
];

const initialFilters = {
  name: '',
  regNo: '',
  semester: '',
  year: '',
  section: '',
};

function ManageStudentsSemester({ onLogout, onViewChange }) {
  useCoordinatorAuth(); // JWT authentication verification
  const navigate = useNavigate();
  
  // Coordinator data and department
  const [coordinatorData, setCoordinatorData] = useState(() => readStoredCoordinatorData());
  const coordinatorDepartment = useMemo(
    () => resolveCoordinatorDepartment(coordinatorData) || 'CSE',
    [coordinatorData]
  );

  // Sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Student and filter states
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  
  // Ref for tbody to control scroll position
  const tbodyRef = useRef(null);
  const printMenuRef = useRef(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        const data = generateSampleData();
        setStudents(data);
      } catch (error) {
        console.error('Error loading students:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Ensure table scrolls to top when students data changes
  useEffect(() => {
    if (tbodyRef.current) {
      tbodyRef.current.scrollTop = 0;
    }
  }, [students]);

  // Filter students based on applied filters
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const nameMatch = !appliedFilters.name || 
        toStringSafe(student.name).toUpperCase().includes(appliedFilters.name.toUpperCase());
      
      const regNoMatch = !appliedFilters.regNo || 
        toStringSafe(student.regNo).toUpperCase().includes(appliedFilters.regNo.toUpperCase());
      
      const semesterMatch = !appliedFilters.semester || 
        toStringSafe(student.semester) === appliedFilters.semester;
      
      const yearMatch = !appliedFilters.year || 
        toUpperSafe(student.year).includes(appliedFilters.year.toUpperCase());
      
      const sectionMatch = !appliedFilters.section || 
        toUpperSafe(student.section) === toUpperSafe(appliedFilters.section);

      return nameMatch && regNoMatch && semesterMatch && yearMatch && sectionMatch;
    });
  }, [students, appliedFilters]);

  const handleFilterChange = (field) => (event) => {
    setFilters(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const handleViewStudent = (student) => {
    console.log('View student:', student);
    navigate('/coo-manage-students-semester/view', { state: { student } });
  };

  const togglePrintMenu = () => {
    setShowPrintMenu(!showPrintMenu);
  };

  const handleExportToExcel = () => {
    const exportData = filteredStudents.map((student, index) => ({
      'S.No': index + 1,
      'Register Number': student.regNo,
      'Name': student.name,
      'Year': student.year,
      'Semester': student.semester,
      'Section': student.section,
      'Arrears': student.arrears,
      'Overall Arrears': student.overallArrears,
      'CGPA': student.cgpa,
      'Overall CGPA': student.overallCgpa
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'Students_Data.xlsx');
    setShowPrintMenu(false);
  };

  const handleSaveAsPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(16);
    doc.text('COMPUTER SCIENCE & ENGINEERING', 14, 15);
    
    const tableData = filteredStudents.map((student, index) => [
      index + 1,
      student.regNo,
      student.name,
      student.year,
      student.semester,
      student.section,
      student.arrears,
      student.overallArrears,
      student.cgpa,
      student.overallCgpa
    ]);

    autoTable(doc, {
      head: [['S.No', 'Register Number', 'Name', 'Year', 'Semester', 'Section', 'Arrears', 'Overall Arrears', 'CGPA', 'Overall CGPA']],
      body: tableData,
      startY: 25,
      theme: 'grid',
      headStyles: { fillColor: [148, 148, 148] },
      styles: { fontSize: 9, cellPadding: 3 }
    });

    doc.save('Students_Data.pdf');
    setShowPrintMenu(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (printMenuRef.current && !printMenuRef.current.contains(event.target)) {
        setShowPrintMenu(false);
      }
    };

    if (showPrintMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPrintMenu]);

  return (
    <>
      <Navbar onToggleSidebar={toggleSidebar} Adminicon={Adminicon} />
      <div className={styles["co-ms-layout"]}>
        <Sidebar 
          isOpen={isSidebarOpen} 
          onLogout={onLogout} 
          currentView="manage-students" 
          onViewChange={onViewChange} 
        />
        <div className={styles['marks-main-content']}>
          {/* Filter Section */}
          <div className={styles['marks-filter-card-container']}>
        <div className={styles['marks-filter-header']}>
          <div className={styles['marks-filter-header-inner']}>
            {/* Semester Badge */}
            <button className={styles['marks-semester-btn']}>
              Semester
            </button>

            {/* Filter Inputs */}
            <div className={styles['marks-filters-row']}>
              {/* Row 1: Name, Semester, Year */}
              {/* Search by Name */}
              <div className={styles['marks-floating-field']}>
                <input
                  type="text"
                  className={styles['marks-floating-input']}
                  placeholder="Search by Name"
                  value={filters.name}
                  onChange={handleFilterChange('name')}
                />
                <span className={styles['marks-search-icon']}>
                  <SearchIcon />
                </span>
              </div>

              {/* Search by Sem */}
              <div className={styles['marks-dropdown-wrapper']}>
                <select
                  className={styles['marks-dropdown']}
                  value={filters.semester}
                  onChange={handleFilterChange('semester')}
                >
                  <option value="">All Semesters</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                  <option value="6">6</option>
                  <option value="7">7</option>
                  <option value="8">8</option>
                </select>
              </div>

              {/* Search by Year */}
              <div className={styles['marks-floating-field']}>
                <input
                  type="text"
                  className={styles['marks-floating-input']}
                  placeholder="Search by Year"
                  value={filters.year}
                  onChange={handleFilterChange('year')}
                />
                <span className={styles['marks-search-icon']}>
                  <SearchIcon />
                </span>
              </div>

              {/* Row 2: Reg no, Buttons (centered), Section */}
              {/* Search by Reg no. */}
              <div className={styles['marks-floating-field']}>
                <input
                  type="text"
                  className={styles['marks-floating-input']}
                  placeholder="Search by Reg no."
                  value={filters.regNo}
                  onChange={handleFilterChange('regNo')}
                />
                <span className={styles['marks-search-icon']}>
                  <SearchIcon />
                </span>
              </div>

              {/* Filter Actions - Centered in middle column */}
              <div className={styles['marks-filter-actions']}>
                <button 
                  className={styles['marks-filter-btn']}
                  onClick={handleApplyFilters}
                >
                  Apply Filters
                </button>
                <button 
                  className={styles['marks-filter-btn-clear']}
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
              </div>

              {/* Search by Section */}
              <div className={styles['marks-dropdown-wrapper']}>
                <select
                  className={styles['marks-dropdown']}
                  value={filters.section}
                  onChange={handleFilterChange('section')}
                >
                  <option value="">All Sections</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className={styles['marks-table-section']}>
        <div className={styles['marks-table-header']}>
          <h2 className={styles['marks-table-title']}>COMPUTER SCIENCE & ENGINEERING</h2>
          <div className={styles['marks-print-menu-container']} ref={printMenuRef}>
            <button 
              className={styles['marks-print-btn']}
              onClick={togglePrintMenu}
            >
              Print
            </button>
            {showPrintMenu && (
              <div className={styles['marks-print-dropdown']}>
                <button 
                  className={styles['marks-dropdown-item']}
                  onClick={handleExportToExcel}
                >
                  Export to Excel
                </button>
                <button 
                  className={styles['marks-dropdown-item']}
                  onClick={handleSaveAsPDF}
                >
                  Save as PDF
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={styles['marks-table-wrapper']}>
          <table className={styles['marks-table']}>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Register Number</th>
                <th>Name</th>
                <th>Year</th>
                <th>Semester</th>
                <th>Section</th>
                <th>Arrears</th>
                <th>Overall Arrears</th>
                <th>CGPA</th>
                <th>Overall CGPA</th>
                <th>View</th>
              </tr>
            </thead>
            <tbody ref={tbodyRef}>
              {isLoading ? (
                <tr>
                  <td colSpan="11" className={styles['marks-loading']}>
                    Loading students...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="11" className={styles['marks-no-data']}>
                    No students found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, index) => (
                  <tr key={student.id}>
                    <td>{index + 1}</td>
                    <td>{getDisplayValue(student.regNo)}</td>
                    <td>{getDisplayValue(student.name)}</td>
                    <td>{getDisplayValue(student.year)}</td>
                    <td>{getDisplayValue(student.semester)}</td>
                    <td>{getDisplayValue(student.section)}</td>
                    <td>{getDisplayValue(student.arrears, '0')}</td>
                    <td>{getDisplayValue(student.overallArrears, '0')}</td>
                    <td>{formatGpa(student.cgpa)}</td>
                    <td>{formatGpa(student.overallCgpa)}</td>
                    <td>
                      <button
                        className={styles['marks-view-btn']}
                        onClick={() => handleViewStudent(student)}
                        aria-label="View student details"
                      >
                        <EyeIcon />
                      </button>
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
    </>
  );
}

export default ManageStudentsSemester;