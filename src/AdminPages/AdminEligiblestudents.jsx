import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAdminAuth from '../utils/useAdminAuth';
import Viewicon from "../assets/Viewicon.svg";
import PlacedStudentsCap from '../assets/AdminEligiblestudapp.svg';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AdminBrowseStudenticon from "../assets/AdminBrowseStudenticon.png";
import AdNavbar from "../components/Navbar/Adnavbar.js";
import AdSidebar from "../components/Sidebar/Adsidebar.js";
import * as XLSX from 'xlsx';
import mongoDBService from '../services/mongoDBService';
import styles from './AdminEligibleStudents.module.css';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';

// Eye Icon Component
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4EA24E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

function AdminEsstudapp () {
  const navigate = useNavigate();
  useAdminAuth(); // JWT authentication verification
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterCriteria, setFilterCriteria] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const tableRef = useRef(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectedCompanyName, setSelectedCompanyName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nasaDate, setNasaDate] = useState('');
  
  // Export popup states
  const [exportPopupState, setExportPopupState] = useState('none');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('Excel');
  
  // Local filter state for the filter card
  const [localFilter, setLocalFilter] = useState({
    branch: '',
    name: '',
    registerNo: '',
    cgpa: ''
  });

  const handleLocalFilterChange = (field, value) => {
    setLocalFilter(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyLocalFilter = () => {
    // If only branch is selected, show all students from that branch
    if (localFilter.branch && !localFilter.name && !localFilter.registerNo && !localFilter.cgpa) {
      const branchFiltered = students.filter(student => student.branch === localFilter.branch);
      setFilteredStudents(branchFiltered);
      return;
    }
    
    // Apply local filters to the already filtered students
    const baseStudents = filteredStudents.length > 0 ? filteredStudents : students;
    const locallyFiltered = baseStudents.filter(student => {
      const branchMatch = !localFilter.branch || student.branch === localFilter.branch;
      const nameMatch = !localFilter.name || 
        `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase().includes(localFilter.name.toLowerCase());
      const regMatch = !localFilter.registerNo || 
        (student.regNo || '').includes(localFilter.registerNo);
      const cgpaMatch = !localFilter.cgpa || 
        parseFloat(student.overallCGPA || 0) >= parseFloat(localFilter.cgpa);
      return branchMatch && nameMatch && regMatch && cgpaMatch;
    });
    setFilteredStudents(locallyFiltered);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Select all visible (filtered) students
      const visibleIds = filteredStudents.map(student => student._id || student.id);
      setSelectedStudents(visibleIds);
    } else {
      setSelectedStudents([]);
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleClearSelection = () => {
    setSelectedStudents([]);
  };

  const handleConfirmSelection = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    // Use company name from filter criteria or default
    const companyName = filterCriteria?.companyName || 'Company Drive';
    const defaultJobRole = filterCriteria?.jobs || filterCriteria?.jobRole || 'Software Engineer';
    const driveStartDate = filterCriteria?.driveStartDate || new Date().toISOString().split('T')[0];
    const driveEndDate = filterCriteria?.driveEndDate || driveStartDate;

    console.log('Store Eligible Students - Data:', {
      companyName,
      driveStartDate,
      driveEndDate,
      defaultJobRole,
      selectedStudentsCount: selectedStudents.length
    });

    setIsSubmitting(true);
    try {
      // Prepare student data with full details
      const studentsData = filteredStudents
        .filter(student => selectedStudents.includes(student._id || student.id))
        .map(student => ({
          studentId: student._id || student.id,
          regNo: student.regNo || 'N/A',
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'N/A',
          branch: student.branch || 'N/A',
          batch: student.batch || 'N/A'
        }));

      console.log('Students Data:', studentsData);

      // Get the drive ID from filter criteria or selectedDrive prop
      let driveId = filterCriteria?._id || filterCriteria?.driveId || location.state?.selectedDrive?._id;
      
      // If still not found, try to find it from the company drives
      if (!driveId && companyName && driveStartDate) {
        try {
          const drives = await mongoDBService.getCompanyDrives();
          const matchingDrive = drives.find(drive => 
            drive.companyName === companyName && 
            drive.startingDate && 
            drive.startingDate.split('T')[0] === driveStartDate
          );
          if (matchingDrive) {
            driveId = matchingDrive._id;
            console.log('Found drive ID from company drives:', driveId);
          }
        } catch (error) {
          console.error('Error fetching drives to get ID:', error);
        }
      }
      
      if (!driveId) {
        console.error('Drive ID not found in filter criteria:', filterCriteria);
        console.error('Location state:', location.state);
        alert('Error: Drive ID not found. Please go back and select the drive again.');
        setIsSubmitting(false);
        return;
      }

      console.log('Using drive ID:', driveId);

      // Store eligible students in DB
      await mongoDBService.storeEligibleStudents(
        companyName,
        driveStartDate,
        driveEndDate,
        defaultJobRole,
        filterCriteria,
        studentsData,
        driveId // Pass the unique drive ID
      );
      
      setSelectedCount(selectedStudents.length);
      setSelectedCompanyName(companyName);
      // Notify other pages that eligible students were added for a drive
      try {
        window.dispatchEvent(new CustomEvent('eligibleStudentsAdded', {
          detail: { companyName, driveStartDate, driveEndDate, jobRole: defaultJobRole }
        }));
      } catch (evtError) {
        console.warn('Could not dispatch eligibleStudentsAdded event', evtError);
      }
      setShowSuccessPopup(true);
      setSelectedStudents([]);
    } catch (error) {
      console.error('Error storing eligible students:', error);
      console.error('Error details:', error.response || error.message);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      const missingFields = error.response?.data?.missingFields || [];
      alert(`Failed to store eligible students: ${errorMessage}${missingFields.length > 0 ? '\nMissing fields: ' + missingFields.join(', ') : ''}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccessPopup = () => {
    setShowSuccessPopup(false);
    // Navigate back to the AdminEsstudapp filter page (correct route)
    navigate('/admin-student-application');
  };

  // Determine which columns to show based on filter criteria
  const getVisibleColumns = () => {
    const columns = {
      tenthPercentage: filterCriteria?.tenthPercentage,
      twelfthPercentage: filterCriteria?.twelfthPercentage,
      diplomaPercentage: filterCriteria?.diplomaPercentage,
      ugCgpa: filterCriteria?.ugCgpa,
      backlogs: filterCriteria?.backlogs,
      department: filterCriteria?.department,
      batch: true, // Always show batch
    };
    return columns;
  };

  // Set NASA date from filter criteria
  useEffect(() => {
    if (filterCriteria?.nasaDate) {
      setNasaDate(filterCriteria.nasaDate);
    }
  }, [filterCriteria]);

  // Fetch students from database and apply filters
  useEffect(() => {
    const fetchAndFilterStudents = async () => {
      try {
        setIsLoading(true);

        // If caller prefetched students & filtered list, use them to avoid extra network call
        const prefetched = location.state?.preFetchedStudents;
        const prefiltered = location.state?.preFilteredStudents;
        const filters = location.state?.filterData;
        console.log('Filter Criteria Received:', filters);
        setFilterCriteria(filters);

        if (prefetched) {
          setStudents(prefetched || []);
          if (prefiltered) {
            setFilteredStudents(prefiltered || []);
          } else if (filters) {
            const filtered = (prefetched || []).filter(student => {
              if (filters.tenthPercentage && parseFloat(student.tenthPercentage) < parseFloat(filters.tenthPercentage)) return false;
              if (filters.twelfthPercentage && parseFloat(student.twelfthPercentage) < parseFloat(filters.twelfthPercentage)) return false;
              if (filters.diplomaPercentage && student.diplomaPercentage && parseFloat(student.diplomaPercentage) < parseFloat(filters.diplomaPercentage)) return false;
              if (filters.ugCgpa && parseFloat(student.overallCGPA) < parseFloat(filters.ugCgpa)) return false;
              if (filters.backlogs && parseInt(student.currentBacklogs || 0) > parseInt(filters.backlogs)) return false;
              if (filters.department && !filters.department.split(',').map(d => d.trim()).includes(student.branch)) return false;
              if (filters.arrearStatus && student.arrearStatus !== filters.arrearStatus) return false;
              if (filters.bondWillingness && student.willingToSignBond !== filters.bondWillingness) return false;
              if (filters.driveMode && student.preferredModeOfDrive !== filters.driveMode) return false;
              if (filters.companyType) {
                const studentCompanyTypes = (student.companyTypes || '').split(',').map(ct => ct.trim());
                if (!studentCompanyTypes.includes(filters.companyType)) return false;
              }
              return true;
            });
            setFilteredStudents(filtered);
          } else {
            setFilteredStudents(prefetched || []);
          }
        } else {
          // No prefetched data available; fetch normally
          const allStudents = await mongoDBService.getStudents();
          setStudents(allStudents || []);

          if (filters) {
            const filtered = (allStudents || []).filter(student => {
              if (filters.tenthPercentage && parseFloat(student.tenthPercentage) < parseFloat(filters.tenthPercentage)) return false;
              if (filters.twelfthPercentage && parseFloat(student.twelfthPercentage) < parseFloat(filters.twelfthPercentage)) return false;
              if (filters.diplomaPercentage && student.diplomaPercentage && parseFloat(student.diplomaPercentage) < parseFloat(filters.diplomaPercentage)) return false;
              if (filters.ugCgpa && parseFloat(student.overallCGPA) < parseFloat(filters.ugCgpa)) return false;
              if (filters.backlogs && parseInt(student.currentBacklogs || 0) > parseInt(filters.backlogs)) return false;
              if (filters.department && !filters.department.split(',').map(d => d.trim()).includes(student.branch)) return false;
              if (filters.arrearStatus && student.arrearStatus !== filters.arrearStatus) return false;
              if (filters.bondWillingness && student.willingToSignBond !== filters.bondWillingness) return false;
              if (filters.driveMode && student.preferredModeOfDrive !== filters.driveMode) return false;
              if (filters.companyType) {
                const studentCompanyTypes = (student.companyTypes || '').split(',').map(ct => ct.trim());
                if (!studentCompanyTypes.includes(filters.companyType)) return false;
              }
              return true;
            });
            setFilteredStudents(filtered);
          } else {
            setFilteredStudents(allStudents || []);
          }
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        setStudents([]);
        setFilteredStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndFilterStudents();
  }, [location.state]);

  const exportToExcel = async () => {
    setShowDropdown(false);
    setExportType('Excel');
    setExportPopupState('progress');
    setExportProgress(0);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setExportProgress(30);

      const exportData = filteredStudents.map((student, index) => ({
        'S.No': index + 1,
        'Student Name': `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        'Register Number': student.regNo || 'N/A',
        'Batch': student.batch || 'N/A',
        'Branch': student.branch || 'N/A',
        'CGPA': student.overallCGPA || 'N/A',
        '10th %': student.tenthPercentage || 'N/A',
        '12th %': student.twelfthPercentage || 'N/A',
        'Diploma %': student.diplomaPercentage || 'N/A',
        'Backlogs': student.currentBacklogs || '0'
      }));

      setExportProgress(60);
      await new Promise(resolve => setTimeout(resolve, 500));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Eligible Students');

      setExportProgress(90);
      await new Promise(resolve => setTimeout(resolve, 300));

      const companyName = filterCriteria?.companyName || 'Company';
      const fileName = `${companyName}_Eligible_Students_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      setExportProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      setExportPopupState('success');
    } catch (error) {
      console.error('Excel export error:', error);
      setExportPopupState('failed');
    }
  };

  const exportToPDF = async () => {
    setShowDropdown(false);
    setExportType('PDF');
    setExportPopupState('progress');
    setExportProgress(0);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setExportProgress(30);

      const doc = new jsPDF('l', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      doc.setFillColor(78, 162, 78);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Eligible Students Report', pageWidth / 2, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const companyName = filterCriteria?.companyName || 'Company Drive';
      const jobRole = filterCriteria?.jobs || filterCriteria?.jobRole || 'Job Role';
      doc.text(`${companyName} - ${jobRole}`, pageWidth / 2, 25, { align: 'center' });

      setExportProgress(60);
      await new Promise(resolve => setTimeout(resolve, 500));

      const tableData = filteredStudents.map((student, index) => [
        index + 1,
        `${student.firstName || ''} ${student.lastName || ''}`.trim(),
        student.regNo || 'N/A',
        student.batch || 'N/A',
        student.branch || 'N/A',
        student.overallCGPA || 'N/A',
        student.tenthPercentage || 'N/A',
        student.twelfthPercentage || 'N/A',
        student.diplomaPercentage || 'N/A',
        student.currentBacklogs || '0'
      ]);

      autoTable(doc, {
        head: [['S.No', 'Name', 'Register No', 'Batch', 'Branch', 'CGPA', '10th %', '12th %', 'Diploma %', 'Backlogs']],
        body: tableData,
        startY: 40,
        theme: 'grid',
        headStyles: { fillColor: [78, 162, 78], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { top: 40, left: 10, right: 10 }
      });

      setExportProgress(90);
      await new Promise(resolve => setTimeout(resolve, 300));

      const fileName = `${companyName}_Eligible_Students_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`;
      doc.save(fileName);

      setExportProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));
      setExportPopupState('success');
    } catch (error) {
      console.error('PDF export error:', error);
      setExportPopupState('failed');
    }
  };

  // Navigate to student application page
  const handleStudentApplicationClick = () => {
    navigate('/admin-student-application');
  };

  // Navigate to student profile page
  const handleViewProfile = (studentId) => {
    navigate(`/admin-student-profile/${studentId}`);
  };
  
  return (
    <div className={styles['Admin-es-layout']}>
      <AdNavbar />
      <AdSidebar />
      <div className={styles['Admin-es-main-content']}>
            <div className={styles['Admin-es-summary-cards']}>
              <div 
                className={`${styles['Admin-es-summary-card']} ${styles['Admin-es-company-drive-card']} ${styles['Admin-es-company-drive-card-sized']}`}
                onClick={() => navigate('/admin-student-application')}
                style={{ cursor: 'pointer' }}
              >
                <div className={`${styles['Admin-es-summary-card-icon']} ${styles['Admin-es-icon-bg-white']}`}>
                  <img src={PlacedStudentsCap} alt="Eligible Students" className={styles['Admin-es-placed-cap-icon']}/>
                </div>
                <div className={styles['Admin-es-summary-card-title-1']}>Eligible<br/>Students</div>
                <div className={`${styles['Admin-es-summary-card-desc-1']} ${styles['Admin-es-summary-card-desc-1-margin']}`}>View eligible students <br/>for this Drive</div>
              </div>
              
              <div className={`${styles['Admin-es-search-filters']} ${styles['Admin-es-company-profile-search']}`}>
                <div className={styles['Admin-es-search-tab']}>
                  {filterCriteria?.companyName || 'Company Drive'} : {filterCriteria?.jobs || filterCriteria?.jobRole || 'Job Role'}  {filterCriteria?.driveStartDate 
                    ? (typeof filterCriteria.driveStartDate === 'string' 
                        ? new Date(filterCriteria.driveStartDate).toLocaleDateString('en-GB').split('/').join('-')
                        : new Date(filterCriteria.driveStartDate).toLocaleDateString('en-GB').split('/').join('-'))
                    : 'DD-MM-YYYY'} to {filterCriteria?.driveEndDate 
                    ? (typeof filterCriteria.driveEndDate === 'string' 
                        ? new Date(filterCriteria.driveEndDate).toLocaleDateString('en-GB').split('/').join('-')
                        : new Date(filterCriteria.driveEndDate).toLocaleDateString('en-GB').split('/').join('-'))
                    : 'DD-MM-YYYY'}
                </div>
                <div className={styles['Admin-es-search-inputs']}>
                  <div className={styles['Admin-es-search-input']}>
                    <select 
                      value={localFilter.branch} 
                      onChange={(e) => handleLocalFilterChange('branch', e.target.value)}
                      className={styles['Admin-es-select']}
                    >
                      <option value="">Branches</option>
                      {filterCriteria?.department && filterCriteria.department.split(',').map((branch, index) => (
                        <option key={index} value={branch.trim()}>{branch.trim()}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles['Admin-es-search-input']}>
                    <input
                      type="text"
                      placeholder="Name"
                      value={localFilter.name}
                      onChange={(e) => handleLocalFilterChange('name', e.target.value)}
                      className={styles['Admin-es-input']}
                    />
                  </div>
                  <div className={styles['Admin-es-search-input']}>
                    <input
                      type="text"
                      placeholder="Register No."
                      value={localFilter.registerNo}
                      onChange={(e) => handleLocalFilterChange('registerNo', e.target.value)}
                      className={styles['Admin-es-input']}
                    />
                  </div>
                  <div className={styles['Admin-es-search-input']}>
                    <input
                      type="text"
                      placeholder="CGPA"
                      value={localFilter.cgpa}
                      onChange={(e) => handleLocalFilterChange('cgpa', e.target.value)}
                      className={styles['Admin-es-input']}
                    />
                  </div>
                </div>
                <div className={styles['Admin-es-button-container']}>
                  <button className={styles['Admin-es-search-btn-filter']} onClick={handleApplyLocalFilter}>Filter</button>
                </div>
              </div>
              
              {/* Filtered Students Count Card - Green */}
              <div className={`${styles['Admin-es-summary-card']} ${styles['Admin-es-filtered-students-card']}`}>
                <div className={styles['Admin-es-filtered-title']}>Filtered<br/>Students</div>
                <div className={styles['Admin-es-filtered-count']}>{filteredStudents.length}</div>
                <div className={styles['Admin-es-filtered-desc']}>Number of Students<br/>Eligible for Drive</div>
              </div>
            </div>
            
            <div className={styles['Admin-es-bottom-card']}>
              <div className={styles['Admin-es-profile-header']}>
                <div className={styles['Admin-es-profile-title']}>ELIGIBLE STUDENTS</div>
                <div className={styles['Admin-es-print-btn-container']}>
                  <button className={styles['Admin-es-print-btn']} onClick={() => setShowDropdown(!showDropdown)}>Print</button>
                  {showDropdown && (
                    <div className={styles['Admin-es-dropdown-menu']}>
                      <div className={styles['Admin-es-dropdown-item']} onClick={exportToExcel}>Export to Excel</div>
                      <div className={styles['Admin-es-dropdown-item']} onClick={exportToPDF}>Save as PDF</div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles['Admin-es-table-container']} style={{ display: 'flex', flexDirection: 'column', maxHeight: '60vh' }}>
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    Loading students...
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    No students match the filter criteria.
                  </div>
                ) : (
                  <>
                    <div className={styles['Admin-es-table-scroll']} style={{ flex: 1 }}>
                      <table className={styles['Admin-es-profile-table']} ref={tableRef}>
                      <thead>
                        <tr>
                          <th>
                            <input
                              type="checkbox"
                              className={styles['Admin-es-checkbox']}
                              onChange={handleSelectAll}
                              checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                            />
                          </th>
                          <th>S.No</th>
                          <th>Student Name</th>
                          <th>Register Number</th>
                          {getVisibleColumns().batch && <th>Batch</th>}
                          {getVisibleColumns().department && <th>Branch</th>}
                          {getVisibleColumns().ugCgpa && <th>CGPA</th>}
                          {getVisibleColumns().tenthPercentage && <th>10th %</th>}
                          {getVisibleColumns().twelfthPercentage && <th>12th %</th>}
                          {getVisibleColumns().diplomaPercentage && <th>Diploma %</th>}
                          {getVisibleColumns().backlogs && <th>Backlogs</th>}
                          <th>View</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student, index) => (
                          <tr key={student._id || student.id}>
                            <td>
                              <input
                                type="checkbox"
                                className={styles['Admin-es-checkbox']}
                                checked={selectedStudents.includes(student._id || student.id)}
                                onChange={() => handleSelectStudent(student._id || student.id)}
                              />
                            </td>
                            <td>{index + 1}</td>
                            <td>{`${student.firstName || ''} ${student.lastName || ''}`.trim()}</td>
                            <td>{student.regNo || 'N/A'}</td>
                            {getVisibleColumns().batch && <td>{student.batch || 'N/A'}</td>}
                            {getVisibleColumns().department && <td>{student.branch || 'N/A'}</td>}
                            {getVisibleColumns().ugCgpa && <td>{student.overallCGPA || 'N/A'}</td>}
                            {getVisibleColumns().tenthPercentage && <td>{student.tenthPercentage || 'N/A'}</td>}
                            {getVisibleColumns().twelfthPercentage && <td>{student.twelfthPercentage || 'N/A'}</td>}
                            {getVisibleColumns().diplomaPercentage && <td>{student.diplomaPercentage || 'N/A'}</td>}
                            {getVisibleColumns().backlogs && <td>{student.currentBacklogs || '0'}</td>}
                            <td style={{ textAlign: 'center', padding: '8px', cursor: 'pointer' }} onClick={() => {
                              const studentId = student._id || student.id;
                              if (studentId) {
                                navigate(`/admin-profile/${studentId}`);
                              }
                            }}>
                              <EyeIcon />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      </table>
                    </div>
                    <div className={styles['Admin-es-table-footer']} style={{ position: 'sticky', bottom: 0, background: 'white', paddingTop: '12px', zIndex: 5 }}>
                      <button 
                        className={styles['Admin-es-clear-btn']} 
                        onClick={handleClearSelection}
                        disabled={isSubmitting}
                        style={{ opacity: isSubmitting ? 0.5 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                      >
                        Clear
                      </button>
                      <button 
                        className={styles['Admin-es-select-btn']} 
                        onClick={handleConfirmSelection}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Selecting...' : 'Select'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className={styles['Admin-es-success-overlay']} onClick={handleCloseSuccessPopup}>
          <div className={styles['Admin-es-success-container']} onClick={(e) => e.stopPropagation()}>
            <div className={styles['Admin-es-success-header']}>
              Selected!
            </div>
            <div className={styles['Admin-es-success-content']}>
              <div className={styles['Admin-es-success-icon-wrapper']}>
                <svg className={styles['Admin-es-success-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                  <circle className={styles['Admin-es-success-icon-circle']} cx="26" cy="26" r="25" fill="none"/>
                  <path className={styles['Admin-es-success-icon-check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
              </div>
              <h3 className={styles['Admin-es-success-title']}>
                {selectedCount} Student{selectedCount !== 1 ? 's' : ''} Selected ✓
              </h3>
              <p className={styles['Admin-es-success-text']}>
                These selected Students are Eligible to attend this<br />
                <strong>{selectedCompanyName} : {filterCriteria?.jobs || 'Job Role'}</strong><br />
                {filterCriteria?.driveStartDate ? new Date(filterCriteria.driveStartDate).toLocaleDateString('en-GB').split('/').join('-') : ''} to {filterCriteria?.driveEndDate ? new Date(filterCriteria.driveEndDate).toLocaleDateString('en-GB').split('/').join('-') : ''}
              </p>
            </div>
            <div className={styles['Admin-es-success-footer']}>
              <button className={styles['Admin-es-success-close-btn']} onClick={handleCloseSuccessPopup}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Popups */}
      <ExportProgressAlert
        isOpen={exportPopupState === 'progress'}
        onClose={() => {}}
        progress={exportProgress}
        exportType={exportType}
      />
      <ExportSuccessAlert
        isOpen={exportPopupState === 'success'}
        onClose={() => setExportPopupState('none')}
        exportType={exportType}
      />
      <ExportFailedAlert
        isOpen={exportPopupState === 'failed'}
        onClose={() => setExportPopupState('none')}
        exportType={exportType}
      />
    </div>
  );
}

export default  AdminEsstudapp ;