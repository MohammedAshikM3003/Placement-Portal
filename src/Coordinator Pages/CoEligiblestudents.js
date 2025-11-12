import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Viewicon from "../assets/Viewicon.png";
// import Dashcompanydrive from '../assets/Dashcompanydrive.png'; // Unused
import PlacedStudentsCap from '../assets/PlacedStudentsCap.svg';
import  jsPDF  from 'jspdf';
import autoTable from 'jspdf-autotable';

import AdminBrowseStudenticon from "../assets/AdminBrowseStudenticon.png";
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import * as XLSX from 'xlsx';
import './EligibleStudents.css';
import '../CoordinatorMain.css';
function CoEligiblestudents({ onLogout, currentView, onViewChange }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [filterData, setFilterData] = useState({
    batch: '',
    registerNo: '',
    cgpa: '',
    skills: ''
  });
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
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
    { id: 9, name: 'Student-9', registerNo: '73152316783', batch: '2025-2029', section: 'A', cgpa: '7.2',skills: 'Java', status: 'Unplaced' },
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

  const handleExport = async (type) => {
    if (type === 'excel') {
      try {
        // FIX: Change selector to the correct table class
        const table = document.querySelector('.co-es-profile-table'); 
        if (!table) {
          console.error('Table element not found for Excel export.');
          return;
        }
        const ws = XLSX.utils.table_to_sheet(table);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Eligible Students');
        XLSX.writeFile(wb, 'eligible_students.xlsx');
      } catch (error) {
        console.error('Excel export error:', error);
      }
    } else if (type === 'pdf') {
      try {
        // 3. FIX: Use the direct DOM element reference from the ref
        const tableElement = tableRef.current;
        if (!tableElement) {
          console.error('Table element not found for PDF export.');
          return;
        }
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Pass the DOM element to autoTable
        autoTable(pdf,{ html: tableElement });
        
        pdf.save('eligible_students.pdf');
      } catch (error) {
        console.error('PDF export error:', error);
      }
    }
    setShowDropdown(false);
  };
  return (
    <div className="coordinator-main-wrapper">
      <Navbar onToggleSidebar={toggleSidebar} />
      <div className="coordinator-main-layout">
        <Sidebar isOpen={isSidebarOpen} onLogout={onLogout} currentView="eligible-students" onViewChange={onViewChange} />
        <div className="coordinator-content-area">
          <div className="co-es-container">
            

            <div className="co-es-dashboard-area">
            <div className="co-es-summary-cards">
              <div className="co-es-summary-card co-es-company-drive-card" >
               
                <div className="co-es-summary-card-icon" style={{ background: '#ffffff' }}><img src={AdminBrowseStudenticon} alt="Company Drive" /></div>
                <div className="co-es-summary-card-title-1">Student Database</div>
                <div className="co-es-summary-card-desc-1" style={{marginTop:10}}>Filter, sort and manage Student records</div>
              </div>
              
              <div className="co-es-search-filters co-es-company-profile-search">
                <div className="co-es-search-tab"> CSE Students</div>
                <div className="co-es-search-inputs">
                  <div className={`co-es-search-input ${filterData.batch ? 'filled' : ''}`}>
                    <input type="text" id="Batch" value={filterData.batch} onChange={(e) => handleFilterChange('batch', e.target.value)} list="batch-options" required />
                    <label htmlFor="batch">Batch</label>
                    <datalist id="batch-options">
                      <option value="2022-2026">2022-2026</option>
                      <option value="2023-2027">2023-2027</option>
                      <option value="2024-2028">2024-2028</option>
                      <option value="2025-2029">2025-2029</option>
                    </datalist>
                    <button className="co-es-clear-btn"></button>
                  </div>
                  <div className={`co-es-search-input ${filterData.registerNo  ? 'filled' : ''}`}>
                    <input type="text" id="Register No" value={filterData.registerNo} onChange={(e) => handleFilterChange('registerNo', e.target.value)} required />
                    <label htmlFor="register no">Register no</label>
                    <button className="co-es-clear-btn"></button>
                  </div>
                  <div className={`co-es-search-input ${filterData.cgpa ? 'filled' : ''}`}>
                    <input type="text" id="CGPA" value={filterData.cgpa} onChange={(e) => handleFilterChange('cgpa', e.target.value)} required />
                    <label htmlFor="cgpa">CGPA</label>
                    <button className="co-es-clear-btn"></button>
                  </div>
                  <div className={`co-es-search-input ${filterData.skills ? 'filled' : ''}`}>
                    <input type="text" id="Skills" value={filterData.skills} onChange={(e) => handleFilterChange('skills', e.target.value)} required />
                    <label htmlFor="skills">Skills</label>
                    <button className="co-es-clear-btn"></button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                  <button className="co-es-search-btn-filter" onClick={handleFilter}>Filter</button>
                  <button className="co-es-clear-search-btn" onClick={handleClear}>Clear</button>
                </div>
              </div>
              <div className="co-es-summary-card co-es-placed-students-card"  onClick={() => navigate(`/placed-students`)} >
                <div className="co-es-summary-card-icon" style={{  background: '#ffffff'}}><img src={PlacedStudentsCap} alt="Placed Students" style={{marginTop:-80}}/></div>
                <div className="co-es-summary-card-title-2">Placed Students</div>
                <div className="co-es-summary-card-desc-2" style={{marginTop:-11}}>Success gained through dedication daily</div>
              </div>
            </div>
            <div className="co-es-company-profile company-profile-table">
              <div className="co-es-profile-header">
                <div className="co-es-profile-title">ELIGIBLE STUDENTS</div>
                <div className="co-es-print-btn-container">
                  <button className="co-es-print-btn" onClick={() => setShowDropdown(!showDropdown)}>Print</button>
                  {/* FIX: Conditionally render the dropdown menu */}
                  {showDropdown && (
                    <div className="co-es-dropdown-menu">
                      <div className="co-es-dropdown-item" onClick={() => handleExport('excel')}>Export to Excel</div>
                      <div className="co-es-dropdown-item" onClick={() => handleExport('pdf')}>Save as PDF</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="co-es-table-container">
                <table className="co-es-profile-table" ref={tableRef}>
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
                          <span className={student.status === 'Placed' ? 'co-es-status-badge-one' : 'co-es-status-badge-two'}>
                            {student.status}
                          </span>
                        </td>
                        <td>
                          <img
                            src={Viewicon}
                            alt="View"
                            style={{ width: 25, height: 25, cursor: 'pointer' }}
                            onClick={() => navigate(`/coo-view-page`)}
                          />
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
    </div>
  );
}

export default CoEligiblestudents;