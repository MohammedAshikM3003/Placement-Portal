import React, { useState, useMemo, useEffect } from 'react';
import './Coo_ManageStudentsSemester.module.css';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import studentcapicon from "../assets/studentcapicon.svg";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import CooBackbtn from "../assets/CooBackbtn.svg";
import { useNavigate } from "react-router-dom";
import autoTable from 'jspdf-autotable';

const ExportProgressPopup = ({ isOpen, operation, progress, onClose }) => {
  if (!isOpen) return null;
  
  const operationText = operation === 'excel' ? 'Exporting...' : 'Downloading...';
  const progressText = operation === 'excel' ? 'Exported' : 'Downloaded';
  
  // Calculate the stroke-dasharray for circular progress
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  
  return (
      <div className="co-ms-sem-export-popup-overlay">
          <div className="co-ms-sem-export-popup-container">
              <div className="co-ms-sem-export-popup-header">{operationText}</div>
              <div className="co-ms-sem-export-popup-body">
                  <div className="co-ms-sem-export-progress-circle">
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
                     {/* <div className="co-ms-sem-export-progress-text">{progress}%</div>*/}
                  </div>
                  <h2 className="co-ms-sem-export-popup-title">{progressText} {progress}%</h2>
                  <p className="co-ms-sem-export-popup-message">
                      The Details have been {operation === 'excel' ? 'Exporting...' : 'Downloading...'}
                  </p>
                  <p className="co-ms-sem-export-popup-message">Please wait...</p>
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
      <div className="co-ms-sem-export-popup-overlay">
          <div className="co-ms-sem-export-popup-container">
              <div className="co-ms-sem-export-popup-header">{headerText}</div>
              <div className="co-ms-sem-export-popup-body">
                  <div className="co-ms-sem-export-success-icon">
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox="0 0 52 52" fill="none">
                        <circle className="co-ms-sem-success-icon--circle" cx="26" cy="26" r="25"/>
                        <path className="co-ms-sem-success-icon--check" d="M14.1 27.2l7.1 7.2 16.7-16.8" fill="none"
                            />
                        </svg>
                  </div>
                  <h2 className="co-ms-sem-export-popup-title">{title}</h2>
                  <p className="co-ms-sem-export-popup-message">{message}</p>
              </div>
              <div className="co-ms-sem-export-popup-footer">
                  <button onClick={onClose} className="co-ms-sem-export-popup-close-btn">Close</button>
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
      <div className="co-ms-sem-export-popup-overlay">
          <div className="co-ms-sem-export-popup-container">
              <div className="co-ms-sem-export-popup-header">{headerText}</div>
              <div className="co-ms-sem-export-popup-body">
                  <div className="co-ms-sem-export-failed-icon">
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
                  <h2 className="co-ms-sem-export-popup-title">{title}</h2>
                  <p className="co-ms-sem-export-popup-message">{message}</p>
              </div>
              <div className="co-ms-sem-export-popup-footer">
                  <button onClick={onClose} className="co-ms-sem-export-popup-close-btn">Close</button>
              </div>
          </div>
      </div>
  );
};


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

  const [exportPopupState, setExportPopupState] = useState({
    isOpen: false,
    type: null, // 'progress', 'success', 'failed'
    operation: null, // 'excel', 'pdf'
    progress: 0
});

  const handleApplyFilters = () => {
    setActiveFilters(controlFilters);
    console.log("Filters Applied:", controlFilters);
  };

  const handleClearFilters = () => {
    setControlFilters(initialFilters);
    setActiveFilters(initialFilters);
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
  }catch (error){
    throw error;
  }
  };

  const exportToPDF = () => {
    try{
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
   const handleCardClick = (view) => {
    if (onViewChange) {
      onViewChange(view);
    }
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
        onClick={() => handleCardClick('manage-students')}
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
                
                <button className="export-option" onClick={handleExportToExcel}>Export to Excel</button>
                <button className="export-option" onClick={handleExportToPDF}>Save as PDF</button>
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
         
    </div>
  );
}
export default ManageStudentsSemester;