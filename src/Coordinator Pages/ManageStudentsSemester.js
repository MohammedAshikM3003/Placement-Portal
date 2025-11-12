import React, { useState, useMemo } from 'react';
import './ManageStudentsSemester.css';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import studentcapicon from "../assets/studentcapicon.svg";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import CooBackbtn from "../assets/CooBackbtn.svg";
import { useNavigate } from "react-router-dom";
import autoTable from 'jspdf-autotable';

const ALL_STUDENTS = [
  { photo: studentcapicon, regNo: '731510101001', name: 'Renuka', year: 'III', semester: 5, section: 'B', arrears: 0, overallArrears: 0, cgpa: 9.1, overallCgpa: 9.1, },
  { photo: studentcapicon, regNo: '731510101002', name: 'Alice', year: 'II', semester: 3, section: 'A', arrears: 2, overallArrears: 6, cgpa: 7.1, overallCgpa: 7.4, },
  { photo: studentcapicon, regNo: '731510101003', name: 'John', year: 'III', semester: 6, section: 'C', arrears: 1, overallArrears: 10, cgpa: 6.8, overallCgpa: 6.9, },
  { photo: studentcapicon, regNo: '731510101004', name: 'Ananya', year: 'IV', semester: 7, section: 'D', arrears: 0, overallArrears: 0, cgpa: 9.1, overallCgpa: 9.1, },
  { photo: studentcapicon, regNo: '731510101005', name: 'Gowri', year: 'III', semester: 5, section: 'A', arrears: 0, overallArrears: 0, cgpa: 8.3, overallCgpa: 8.1, },
  { photo: studentcapicon, regNo: '731510101006', name: 'Malar', year: 'III', semester: 6, section: 'D', arrears: 2, overallArrears: 4, cgpa: 6.9, overallCgpa: 7.0, },
  { photo: studentcapicon, regNo: '731510101007', name: 'Abi', year: 'II', semester: 4, section: 'A', arrears: 0, overallArrears: 0, cgpa: 8.8, overallCgpa: 8.9, },
  { photo: studentcapicon, regNo: '731510101008', name: 'Anu', year: 'III', semester: 5, section: 'A', arrears: 2, overallArrears: 2, cgpa: 7.1, overallCgpa: 7.3, },
  { photo: studentcapicon, regNo: '731510101009', name: 'Bala', year: 'II', semester: 3, section: 'B', arrears: 0, overallArrears: 0, cgpa: 8.5, overallCgpa: 8.6, },
  { photo: studentcapicon, regNo: '731510101010', name: 'Chitra', year: 'IV', semester: 7, section: 'C', arrears: 1, overallArrears: 1, cgpa: 6.5, overallCgpa: 6.7, },
  { photo: studentcapicon, regNo: '731510101011', name: 'Deepak', year: 'III', semester: 5, section: 'D', arrears: 0, overallArrears: 0, cgpa: 9.3, overallCgpa: 9.2, },
  { photo: studentcapicon, regNo: '731510101012', name: 'Eswari', year: 'II', semester: 4, section: 'A', arrears: 3, overallArrears: 5, cgpa: 7.0, overallCgpa: 7.1, },
  { photo: studentcapicon, regNo: '731510101013', name: 'Farhan', year: 'IV', semester: 8, section: 'B', arrears: 0, overallArrears: 0, cgpa: 9.5, overallCgpa: 9.5, },
  { photo: studentcapicon, regNo: '731510101014', name: 'Gita', year: 'III', semester: 6, section: 'C', arrears: 0, overallArrears: 0, cgpa: 8.0, overallCgpa: 8.2, },
  { photo: studentcapicon, regNo: '731510101015', name: 'Hari', year: 'II', semester: 3, section: 'D', arrears: 1, overallArrears: 2, cgpa: 7.8, overallCgpa: 7.7, },
];

const initialFilters = {
    name: '',
    regNo: '',
    semester: '',
    year: '',
    section: '',
};

function ManageStudentsSemester({ onLogout, currentView, onViewChange }) {
  const [controlFilters, setControlFilters] = useState(initialFilters);
  const [activeFilters, setActiveFilters] = useState(initialFilters);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const filteredStudents = useMemo(() => {

    


    return ALL_STUDENTS.filter(student => {
      if (activeFilters.name && !student.name.toLowerCase().includes(activeFilters.name.toLowerCase())) {
        return false;
      }
      if (activeFilters.regNo && !student.regNo.includes(activeFilters.regNo)) {
        return false;
      }
      // Filter by Semester
      if (activeFilters.semester && student.semester.toString() !== activeFilters.semester) {
        return false;
      }
      // Filter by Year
      if (activeFilters.year && student.year !== activeFilters.year) {
        return false;
      }
      // Filter by Section
      if (activeFilters.section && student.section !== activeFilters.section) {
        return false;
      }
      return true;
    });
  }, [activeFilters]); 
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setControlFilters(prevFilters => ({
        ...prevFilters,
        [name]: value.startsWith('Search by') ? '' : value
    }));
  };

  const handleApplyFilters = () => {
    setActiveFilters(controlFilters);
    console.log("Filters Applied:", controlFilters);
  };

  const handleClearFilters = () => {
    setControlFilters(initialFilters);
    setActiveFilters(initialFilters);
  };

  const exportToExcel = () => {
    const data = filteredStudents.map((s, i) => ({
      SNo: i + 1,
      RegisterNumber: s.regNo,
      Name: s.name,
      Year: s.year,
      Semester: s.semester,
      Section: s.section,
      Arrears: s.arrears,
      OverallArrears: s.overallArrears,
      CGPA: s.cgpa,
      OverallCGPA: s.overallCgpa,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, 'Students_Semester_Performance.xlsx');
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Students List', 14, 16);
    const head = [["S.No","Register Number","Name","Year","Semester","Section","Arrears","Overall Arrears","CGPA","Overall CGPA"]];
    const body = filteredStudents.map((s, i) => [
      i + 1,
      s.regNo,
      s.name,
      s.year,
      s.semester,
      s.section,
      s.arrears,
      s.overallArrears,
      s.cgpa,
      s.overallCgpa,
    ]);
  autoTable(doc, { head, body, startY: 22 });
    doc.save('Students_SemesterPerformance.pdf');
    setShowExportMenu(false);
  };

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
   
    <div className="co-ms-sem-main-content">
      <Navbar  onToggleSidebar={toggleSidebar}  onHamburgerClick={() => setSidebarOpen(prev => !prev)} isMenuOpen={sidebarOpen} />
      <Sidebar isOpen={isSidebarOpen} onLogout={() => console.log('Logout Clicked')}  visible={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="co-ms-sem-main-content__header">
        <button className="co-ms-sem-main-content__semester-btn">Semester</button>
        
        <div className="co-ms-sem-main-content__filters">
          <div className={`co-ms-sem-floating-field ${controlFilters.name ? 'filled' : ''}`}>
            <input
              className="co-ms-sem-main-content__search co-ms-sem-floating-input"
              name="name"
              value={controlFilters.name}
              onChange={handleInputChange}
            />
            <label className="co-ms-sem-floating-label">Search by Name</label>
          </div>
          
          <select 
            className="co-ms-sem-main-content__dropdown"
            name="semester"
            value={controlFilters.semester || "Search by Sem"}
            onChange={handleInputChange}
          >
            <option disabled value="Search by Sem">Search by Sem</option>
             <option value="1">I</option>
            <option value="2">II</option>
            <option value="3">III</option>
            <option value="4">IV</option>
            <option value="5">V</option>
            <option value="6">VI</option>
            <option value="7">VII</option>
            <option value="8">VIII</option>           
          </select>
          <select 
            className="co-ms-sem-main-content__dropdown"
            name="year"
            value={controlFilters.year || "Search by Year"}
            onChange={handleInputChange}
          >
            <option disabled value="Search by Year">Search by Year</option>
            <option value="I">I</option>
            <option value="II">II</option>
            <option value="III">III</option>
            <option value="IV">IV</option>
          </select>          
          <div className={`co-ms-sem-floating-field ${controlFilters.regNo ? 'filled' : ''}`}>
            <input
              className="co-ms-sem-main-content__search co-ms-sem-floating-input"
              name="regNo"
              value={controlFilters.regNo}
              onChange={handleInputChange}
            />
            <label className="co-ms-sem-floating-label">Search by Reg.no</label>
          </div>
          <button 
            className="co-ms-sem-main-content__filter-btn"
            onClick={handleApplyFilters}
          >
            Apply Filters
          </button>
          <button 
            className="co-ms-sem-main-content__filter-btn co-ms-sem-main-content__filter-btn--clear"
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
          <select 
            className="co-ms-sem-main-content__dropdown-1" 
            
            name="section"
            value={controlFilters.section || "Search by Section"}
            onChange={handleInputChange}
          >
            <option disabled value="Search by Section">Search by Section</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
      </div>
      <button className="co-coms-backbtn" 
        onClick={() =>{
                                        
            navigate(`/manage-students`);
        }}
        >Back<img classname="co-coms-backbtn-icon" src={CooBackbtn} alt="<-"  /></button>
        
      <div className="co-ms-sem-main-content__table-section">
        <div className="co-ms-sem-main-content__table-header">
          <span className="co-ms-sem-main-content__table-title">
            COMPUTER SCIENCE &amp; ENGINEERING 
          </span>
          <div className="export-wrap">
            <button
              className="co-ms-sem-main-content__print-btn"
              onClick={() => setShowExportMenu(prev => !prev)}
            >
              Print
            </button>
            {showExportMenu && (
              <div className="export-dropdown">
                <button className="export-option" onClick={exportToPDF}>Save as PDF</button>
                <button className="export-option" onClick={exportToExcel}>Export to Excel</button>
              </div>
            )}
          </div>
        </div>
        <div className="co-ms-sem-main-content__table-wrapper">
          <table className="co-ms-sem-main-content__table">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Photo</th>
                <th>Register Number</th>
                <th>Name</th>
                <th>Year</th>
                <th>Semester</th>
                <th>Section</th>
                <th>Arrears</th>
                <th>Overall Arrears</th>
                <th>CGPA</th>
                <th>Overall CGPA</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td><img src={studentcapicon} alt={student.name} width="40" height="40" /></td>
                  <td>{student.regNo}</td>
                  <td>{student.name}</td>
                  <td>{student.year}</td>
                  <td>{student.semester}</td>
                  <td>{student.section}</td>
                  <td>{student.arrears}</td>
                  <td>{student.overallArrears}</td>
                  <td>{student.cgpa}</td>
                  <td>{student.overallCgpa}</td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="11" style={{fontFamily:"'Poppins','sans-serif'",fontSize:"1.08rem"}}>No students match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default ManageStudentsSemester;