import { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Assets
import PlacedStudentsCap from '../assets/CompanydriveReportAnalysisicon.svg';
import Navbar from "../components/Navbar/Adnavbar.js";
import Sidebar from "../components/Sidebar/Adsidebar.js";

// Styling - Using the correct Module CSS file provided in your last message
import styles from './AdminCompanyDrivedet.module.css';

function Admincdd() {
  const navigate = useNavigate();
  const tableRef = useRef(null);
  
  // UI State
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeRound, setActiveRound] = useState(1);
  const [isFiltered, setIsFiltered] = useState(false);
  
  // Data State
  const [filterData, setFilterData] = useState({
    batch: '',
    registerNo: '',
    cgpa: '',
    skills: ''
  });

  const [companyInfo] = useState({
    companyName: 'TechNova Solutions',
    rounds: '8 Rounds',
    jobRole: 'Junior Developer',
    currentRound: '5th Round'
  });

  // Sample data logic
  const allRoundsData = {
    1: [
      { id: 1, name: 'Chandan', registerNo: '73152313030', batch: '2023-2027', section: 'A', cgpa: '9.1', skills: 'Python', phone: '9876543210', email: 'chandan2427@ksrce.ac.in' },
      { id: 2, name: 'Maneesh', registerNo: '73152313031', batch: '2022-2026', section: 'B', cgpa: '8.5', skills: 'Java', phone: '9876543210', email: 'maneesh2427@ksrce.ac.in' },
    ],
  };

  const [studentStatuses, setStudentStatuses] = useState({});

  const currentRoundStudents = useMemo(() => {
    return allRoundsData[activeRound] || [];
  }, [activeRound]);

  const displayStudents = useMemo(() => {
    if (!isFiltered) return currentRoundStudents;
    return currentRoundStudents.filter(student => {
      return (
        (!filterData.batch || student.batch === filterData.batch) &&
        (!filterData.registerNo || student.registerNo.includes(filterData.registerNo)) &&
        (!filterData.cgpa || student.cgpa.includes(filterData.cgpa)) &&
        (!filterData.skills || student.skills.toLowerCase().includes(filterData.skills.toLowerCase()))
      );
    });
  }, [isFiltered, filterData, currentRoundStudents]);

  const handleFilterChange = (field, value) => {
    setFilterData(prev => ({ ...prev, [field]: value }));
    setIsFiltered(true);
  };

  const clearFilters = () => {
    setFilterData({ batch: '', registerNo: '', cgpa: '', skills: '' });
    setIsFiltered(false);
  };

  const handleStatusChange = (studentId, statusType) => {
    setStudentStatuses(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        passed: statusType === 'passed',
        failed: statusType === 'failed'
      }
    }));
  };

  const handleExport = (type) => {
    if (type === 'excel') {
      const ws = XLSX.utils.table_to_sheet(tableRef.current);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `Round ${activeRound}`);
      XLSX.writeFile(wb, `Company_Drive_R${activeRound}.xlsx`);
    } else {
      const pdf = new jsPDF('l', 'mm', 'a4');
      autoTable(pdf, { html: tableRef.current });
      pdf.save(`Company_Drive_R${activeRound}.pdf`);
    }
    setShowDropdown(false);
  };

  return (
    <div className={styles['Admin-cdd-main-wrapper']}>
      <Navbar />
      <div className={styles['Admin-cdd-layout-wrapper']}>
        <Sidebar />
        <main className={styles['Admin-cdd-dashboard-area']}>
          
          {/* Top Section with Cards */}
          <section className={styles['Admin-cdd-top-section']}>
            {/* Round Summary Card */}
            <div className={styles['Admin-cdd-summary-card']}>
              <div className={styles['Admin-cdd-round-total-card']}>
                <div className={styles['Admin-cdd-round-number']}>Round {activeRound}</div>
                <div className={styles['Admin-cdd-total-students-text']}>Total Students</div>
                <div className={styles['Admin-cdd-student-count']}>{currentRoundStudents.length}</div>
              </div>
            </div>

            {/* Center Company Info & Search */}
            <div className={styles['Admin-cdd-company-profile-search']}>
              <div className={styles['Admin-cdd-search-tab']}>Company Drive Details</div>
              <div className={styles['Admin-cdd-company-info-grid']}>
                <div className={styles['Admin-cdd-info-field']}>
                    <label className={styles['Admin-cdd-info-label']}>COMPANY NAME</label>
                    <div className={styles['Admin-cdd-info-input']}>{companyInfo.companyName}</div>
                </div>
                <div className={styles['Admin-cdd-info-field']}>
                    <label className={styles['Admin-cdd-info-label']}>JOB ROLE</label>
                    <div className={styles['Admin-cdd-info-input']}>{companyInfo.jobRole}</div>
                </div>
              </div>
              <div className={styles['Admin-cdd-button-container']} style={{marginTop: '20px'}}>
                  <input 
                    type="text" 
                    placeholder="Search Reg No..." 
                    className={styles['Admin-cdd-info-input']}
                    style={{width: '60%'}}
                    value={filterData.registerNo}
                    onChange={(e) => handleFilterChange('registerNo', e.target.value)}
                  />
                  <button className={styles['Admin-cdd-clear-search-btn']} onClick={clearFilters}>Clear</button>
              </div>
            </div>

            {/* Report Analysis Card */}
            <div className={styles['Admin-cdd-summary-card1']} onClick={() => navigate('/report-analysis')}>
              <div className={styles['Admin-cdd-summary-card-icon']}>
                <img src={PlacedStudentsCap} alt="Analysis" />
              </div>
              <div className={styles['Admin-cdd-summary-card-title-2']}>Report Analysis</div>
              <div className={styles['Admin-cdd-summary-card-desc-2']}>Analyze trends</div>
            </div>
          </section>

          {/* Round Navigation Tabs */}
          <nav className={styles['Admin-cdd-round-tabs']}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(round => (
              <button
                key={round}
                className={`${styles['Admin-cdd-round-tab']} ${activeRound === round ? styles['active'] : ''}`}
                onClick={() => setActiveRound(round)}
              >
                Round {round}
              </button>
            ))}
          </nav>

          {/* Main Table Section */}
          <section className={styles['Admin-cdd-company-profile']}>
            <div className={styles['Admin-cdd-profile-header']}>
              <div className={styles['Admin-cdd-profile-title']}>STUDENT LIST - ROUND {activeRound}</div>
              <div className={styles['Admin-cdd-print-btn-container']}>
                <button className={styles['Admin-cdd-print-btn']} onClick={() => setShowDropdown(!showDropdown)}>Export Data</button>
                {showDropdown && (
                  <div className={styles['Admin-cdd-dropdown-menu']}>
                    <div className={styles['Admin-cdd-dropdown-item']}>
                        <span onClick={() => handleExport('excel')}>Excel (.xlsx)</span>
                    </div>
                    <div className={styles['Admin-cdd-dropdown-item']}>
                        <span onClick={() => handleExport('pdf')}>PDF (.pdf)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={styles['Admin-cdd-table-container']}>
              <table className={styles['Admin-cdd-profile-table']} ref={tableRef}>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Photo</th>
                    <th>Reg Number</th>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Passed</th>
                    <th>Failed</th>
                    <th>Confirm</th>
                  </tr>
                </thead>
                <tbody>
                  {displayStudents.map((student, index) => (
                    <tr key={student.id}>
                      <td>{index + 1}</td>
                      <td><div className={styles['Admin-cdd-student-photo']}>🎓</div></td>
                      <td>{student.registerNo}</td>
                      <td>{student.name}</td>
                      <td>{student.phone}</td>
                      <td>{student.email}</td>
                      <td>
                        <div 
                          className={`${styles['Admin-cdd-radio-button']} ${studentStatuses[student.id]?.passed ? styles['passed'] : ''}`}
                          onClick={() => handleStatusChange(student.id, 'passed')}
                        />
                      </td>
                      <td>
                        <div 
                          className={`${styles['Admin-cdd-radio-button']} ${studentStatuses[student.id]?.failed ? styles['failed'] : ''}`}
                          onClick={() => handleStatusChange(student.id, 'failed')}
                        />
                      </td>
                      <td>
                        <div 
                          className={`${styles['Admin-cdd-checkbox']} ${studentStatuses[student.id]?.confirmed ? styles['checked'] : ''}`}
                          onClick={() => setStudentStatuses(prev => ({
                            ...prev, 
                            [student.id]: { ...prev[student.id], confirmed: !prev[student.id]?.confirmed }
                          }))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles['Admin-cdd-action-buttons']}>
              <button className={styles['Admin-cdd-save-btn']} onClick={() => alert('Data Saved')}>Save Selection</button>
              <button className={styles['Admin-cdd-action-clear-btn']} onClick={() => setStudentStatuses({})}>Reset All</button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Admincdd;