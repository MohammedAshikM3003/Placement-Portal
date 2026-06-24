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
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert, CertificateDownloadProgressAlert } from '../components/alerts';

// Eye Icon Component
const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4EA24E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

function AdminEsstudapp() {
  const navigate = useNavigate();
  useAdminAuth(); // JWT authentication verification
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
  const [submitProgress, setSubmitProgress] = useState(0);
  const [nasaDate, setNasaDate] = useState('');

  // Export popup states
  const [exportPopupState, setExportPopupState] = useState('none');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('Excel');

  const YEAR_OPTIONS = ['I', 'II', 'III', 'IV'];
  const SEM_OPTIONS_BY_YEAR = {
    I: ['1', '2'],
    II: ['3', '4'],
    III: ['5', '6'],
    IV: ['7', '8'],
  };

  const calculateCurrentYear = (batch) => {
    if (!batch) return '';
    const currentYear = new Date().getFullYear();
    const batchMatch = batch.match(/(\d{4})-(\d{4})/);
    if (!batchMatch) return '';

    const startYear = parseInt(batchMatch[1]);
    const yearDiff = currentYear - startYear;

    if (yearDiff < 1) return 'I';
    if (yearDiff === 1) return 'II';
    if (yearDiff === 2) return 'III';
    if (yearDiff >= 3) return 'IV';
    return 'I';
  };

  const normalizeYearRoman = (value) => {
    const raw = (value ?? '').toString().trim().toUpperCase();
    if (!raw) return '';
    if (YEAR_OPTIONS.includes(raw)) return raw;
    const asNum = Number.parseInt(raw, 10);
    if (asNum === 1) return 'I';
    if (asNum === 2) return 'II';
    if (asNum === 3) return 'III';
    if (asNum === 4) return 'IV';
    return raw;
  };

  const normalizeSemRoman = (value) => {
    const raw = (value ?? '').toString().trim().toUpperCase();
    if (!raw) return '';
    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    if (roman.includes(raw)) return raw;
    const asNum = Number.parseInt(raw, 10);
    if (Number.isFinite(asNum) && asNum >= 1 && asNum <= 8) return roman[asNum - 1];
    return raw;
  };

  const normalizeSemNumeric = (value) => {
    const raw = (value ?? '').toString().trim().toUpperCase();
    if (!raw) return '';
    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
    const idx = roman.indexOf(raw);
    if (idx !== -1) return (idx + 1).toString();
    const asNum = Number.parseInt(raw, 10);
    if (Number.isFinite(asNum) && asNum >= 1 && asNum <= 8) return asNum.toString();
    return raw;
  };

  // Local filter state for the filter card
  const [localFilter, setLocalFilter] = useState({
    searchQuery: '',
    batchStart: '',
    batchEnd: '',
    year: '',
    sem: '',
    branch: ''
  });

  const handleLocalFilterChange = (field, value) => {
    setLocalFilter(prev => ({ ...prev, [field]: value }));
  };

  const handleBatchStartChange = (value) => {
    const startVal = value.trim();
    if (!startVal) {
      setLocalFilter(prev => ({
        ...prev,
        batchStart: '',
        batchEnd: ''
      }));
      return;
    }
    const startNum = parseInt(startVal, 10);
    const endVal = Number.isFinite(startNum) ? (startNum + 4).toString() : '';
    setLocalFilter(prev => ({
      ...prev,
      batchStart: startVal,
      batchEnd: endVal
    }));
  };

  const handleYearChange = (yearValue) => {
    setLocalFilter(prev => ({
      ...prev,
      year: yearValue,
      sem: ''
    }));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Listen for sidebar close event from navigation links
  useEffect(() => {
    const handleCloseSidebar = () => {
      setIsSidebarOpen(false);
    };
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => {
      window.removeEventListener('closeSidebar', handleCloseSidebar);
    };
  }, []);

  // Auto-apply filters when localFilter changes
  useEffect(() => {
    const applyLocalFilter = () => {
      // Apply local filters to the database students list
      const baseStudents = students || [];
      const locallyFiltered = baseStudents.filter(student => {
        const branchMatch = !localFilter.branch || student.branch === localFilter.branch;

        const queryMatch = !localFilter.searchQuery ||
          `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase().includes(localFilter.searchQuery.toLowerCase()) ||
          (student.regNo || '').includes(localFilter.searchQuery);

        const batchString = localFilter.batchStart && localFilter.batchEnd ? `${localFilter.batchStart}-${localFilter.batchEnd}` : '';
        const batchMatch = !batchString || (student.batch || '').trim() === batchString;

        const studentYear = student.currentYear || student.year || calculateCurrentYear(student.batch);
        const yearMatch = !localFilter.year || normalizeYearRoman(studentYear) === normalizeYearRoman(localFilter.year);

        const studentSem = student.currentSemester || student.semester || student.sem || '';
        const semMatch = !localFilter.sem || normalizeSemRoman(studentSem) === normalizeSemRoman(localFilter.sem);

        return branchMatch && queryMatch && batchMatch && yearMatch && semMatch;
      });
      setFilteredStudents(locallyFiltered);
    };

    applyLocalFilter();
  }, [localFilter, students]);

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
    setLocalFilter({
      searchQuery: '',
      batchStart: '',
      batchEnd: '',
      year: '',
      sem: '',
      branch: ''
    });
  };

  const hasActiveFilters = Boolean(
    localFilter.searchQuery ||
    localFilter.batchStart ||
    localFilter.batchEnd ||
    localFilter.year ||
    localFilter.sem ||
    localFilter.branch
  );

  const handleClearFilters = () => {
    setLocalFilter({
      searchQuery: '',
      batchStart: '',
      batchEnd: '',
      year: '',
      sem: '',
      branch: ''
    });
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
    setSubmitProgress(15);

    let submitDone = false;
    let submitInterval = null;

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

    // 1. Run the DB storing operation in an async function
    const performSubmit = async () => {
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
        throw new Error('Drive ID not found. Please go back and select the drive again.');
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
    };

    // Start submit task
    performSubmit()
      .then(() => {
        submitDone = true;
        if (submitInterval) window.clearInterval(submitInterval);
        handleSelectionComplete();
      })
      .catch(error => {
        submitDone = true;
        if (submitInterval) window.clearInterval(submitInterval);
        setIsSubmitting(false);
        console.error('Error storing eligible students:', error);
        console.error('Error details:', error.response || error.message);
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
        const missingFields = error.response?.data?.missingFields || [];
        alert(`Failed to store eligible students: ${errorMessage}${missingFields.length > 0 ? '\nMissing fields: ' + missingFields.join(', ') : ''}`);
      });

    // 2. Animate selection phase smoothly (15% to 60%) while waiting for API
    submitInterval = window.setInterval(() => {
      setSubmitProgress(prev => {
        if (submitDone || prev >= 60) {
          window.clearInterval(submitInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 100);

    // 3. Complete stages sequentially to give user visual feedback
    const handleSelectionComplete = () => {
      setSubmitProgress(90);

      setTimeout(() => {
        setSubmitProgress(100);

        setTimeout(() => {
          setIsSubmitting(false);
          setShowSuccessPopup(true);
          setSelectedStudents([]);
        }, 200);
      }, 300);
    };
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
      department: true, // Always show branch
      batch: true, // Always show batch
    };
    return columns;
  };

  const getVisibleColumnCount = () => {
    const cols = getVisibleColumns();
    let colCount = 6; // Checkbox, S.No, Register Number, Name, Year-sem, View
    if (cols.batch) colCount++;
    if (cols.department) colCount++;
    if (cols.ugCgpa) colCount++;
    if (cols.tenthPercentage) colCount++;
    if (cols.twelfthPercentage) colCount++;
    if (cols.diplomaPercentage) colCount++;
    if (cols.backlogs) colCount++;
    return colCount;
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

      const exportData = filteredStudents.map((student, index) => {
        const studentYear = student.currentYear || student.year || calculateCurrentYear(student.batch);
        const studentSem = student.currentSemester || student.semester || student.sem || '';
        const yearSemStr = studentYear || studentSem 
          ? `${normalizeYearRoman(studentYear)}-${normalizeSemNumeric(studentSem)}` 
          : 'N/A';
        return {
          'S.No': index + 1,
          'Register Number': student.regNo || 'N/A',
          'Name': `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          'Year-sem': yearSemStr,
          'Batch': student.batch || 'N/A',
          'Branch': student.branch || 'N/A',
          'CGPA': student.overallCGPA || 'N/A',
          '10th %': student.tenthPercentage || 'N/A',
          '12th %': student.twelfthPercentage || 'N/A',
          'Diploma %': student.diplomaPercentage || 'N/A',
          'Backlogs': student.currentBacklogs || '0'
        };
      });

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

      const tableData = filteredStudents.map((student, index) => {
        const studentYear = student.currentYear || student.year || calculateCurrentYear(student.batch);
        const studentSem = student.currentSemester || student.semester || student.sem || '';
        const yearSemStr = studentYear || studentSem 
          ? `${normalizeYearRoman(studentYear)}-${normalizeSemNumeric(studentSem)}` 
          : 'N/A';
        return [
          index + 1,
          student.regNo || 'N/A',
          `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          yearSemStr,
          student.batch || 'N/A',
          student.branch || 'N/A',
          student.overallCGPA || 'N/A',
          student.tenthPercentage || 'N/A',
          student.twelfthPercentage || 'N/A',
          student.diplomaPercentage || 'N/A',
          student.currentBacklogs || '0'
        ];
      });

      autoTable(doc, {
        head: [['S.No', 'Register No', 'Name', 'Year-Sem', 'Batch', 'Branch', 'CGPA', '10th %', '12th %', 'Diploma %', 'Backlogs']],
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
  const handleViewProfile = (studentId, student) => {
    navigate(`/admin-student-view/${studentId}`, { state: { student } });
  };

  return (
    <div className={styles['Admin-es-layout']}>

      <AdNavbar onToggleSidebar={toggleSidebar} />
      <AdSidebar isOpen={isSidebarOpen} />
      <div className={styles['Admin-es-main-content']}>
        <div className={styles['Admin-es-summary-cards']}>
          <div
            className={`${styles['Admin-es-action-addcard']} ${styles['Admin-es-add-card']}`}
            onClick={() => navigate('/admin-student-application')}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => event.key === 'Enter' && navigate('/admin-student-application')}
          >
            <div className={styles['Admin-es-summary-card-icon']}>
              <img className={styles['Admin-es-add-icon']} src={PlacedStudentsCap} alt="Eligible Students" />
            </div>
            <h4 className={styles['Admin-es-add-header']}>Eligible <br /> Students</h4>
            <p className={styles['Admin-es-add-description']}>
              View eligible students for this Drive
            </p>
          </div>

          <div className={`${styles['Admin-es-search-filters']} ${styles['Admin-es-company-profile-search']}`}>
            <div className={styles['Admin-es-filter-header-container']}>
              <div className={styles['Admin-es-search-tab']}>
                Eligible Students
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  className={styles['Admin-es-clear-btn-header']}
                  onClick={handleClearFilters}
                >
                  Clear
                </button>
              )}
            </div>
            <div className={styles['Admin-es-search-inputs']}>
              {/* Enter Name / Reg No - Row 1 Column 1 */}
              <div className={styles['Admin-es-input-group']}>
                <label className={styles['Admin-es-input-label']}>Enter Name / Reg No</label>
                <div className={styles['Admin-es-search-input']}>
                  <input
                    type="text"
                    placeholder="Enter Name / Reg No"
                    value={localFilter.searchQuery}
                    onChange={(e) => handleLocalFilterChange('searchQuery', e.target.value)}
                  />
                </div>
              </div>

              {/* Batch - Row 1 Column 2 */}
              <div className={styles['Admin-es-input-group']}>
                <label className={styles['Admin-es-input-label']}>Batch</label>
                <div className={styles['Admin-es-batch-range-inputs']}>
                  <div className={styles['Admin-es-search-input']}>
                    <input
                      type="text"
                      placeholder="Start"
                      inputMode="numeric"
                      value={localFilter.batchStart}
                      onChange={(e) => {
                        const start = (e.target.value || '').replace(/[^\d]/g, '').slice(0, 4);
                        handleBatchStartChange(start);
                      }}
                    />
                  </div>
                  <div className={styles['Admin-es-batch-range-sep']}>-</div>
                  <div className={styles['Admin-es-search-input']}>
                    <input
                      type="text"
                      placeholder="End"
                      value={localFilter.batchEnd}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Year-Sem - Row 2 Column 1 */}
              <div className={styles['Admin-es-input-group']}>
                <label className={styles['Admin-es-input-label']}>Year-Sem</label>
                <div className={styles['Admin-es-yearsem-range-inputs']}>
                  <div className={`${styles['Admin-es-search-input']} ${styles['Admin-es-select-input']}`}>
                    <select
                      value={localFilter.year}
                      onChange={(e) => handleYearChange(e.target.value)}
                    >
                      <option value="">Year</option>
                      {YEAR_OPTIONS.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles['Admin-es-yearsem-range-sep']}>-</div>
                  <div className={`${styles['Admin-es-search-input']} ${styles['Admin-es-select-input']}`}>
                    <select
                      value={localFilter.sem}
                      disabled={!localFilter.year}
                      onChange={(e) => handleLocalFilterChange('sem', e.target.value)}
                    >
                      <option value="">Sem</option>
                      {(SEM_OPTIONS_BY_YEAR[localFilter.year] || []).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Branch Dropdown - Row 2 Column 2 */}
              <div className={styles['Admin-es-input-group']}>
                <label className={styles['Admin-es-input-label']}>Branch</label>
                <div className={`${styles['Admin-es-search-input']} ${styles['Admin-es-select-input']}`}>
                  <select
                    value={localFilter.branch}
                    onChange={(e) => handleLocalFilterChange('branch', e.target.value)}
                  >
                    <option value="">Select Branch</option>
                    {filterCriteria?.department && filterCriteria.department.split(',').map((branch, index) => (
                      <option key={index} value={branch.trim()}>{branch.trim()}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* Company Details Card - Green */}
          <div className={`${styles['Admin-es-summary-card']} ${styles['Admin-es-company-details-card']}`}>
            <div className={styles['Admin-es-company-details-title']}>Company Details</div>
            <div className={styles['Admin-es-company-details-content']}>
              <div className={styles['Admin-es-company-detail-item']}>
                <span className={styles['Admin-es-detail-label']}>Company Name:</span>
                <span className={styles['Admin-es-detail-value']} title={filterCriteria?.companyName || 'N/A'}>
                  {filterCriteria?.companyName || 'N/A'}
                </span>
              </div>
              <div className={styles['Admin-es-company-detail-item']}>
                <span className={styles['Admin-es-detail-label']}>Job Role:</span>
                <span className={styles['Admin-es-detail-value']} title={filterCriteria?.jobRole || filterCriteria?.jobs || 'N/A'}>
                  {filterCriteria?.jobRole || filterCriteria?.jobs || 'N/A'}
                </span>
              </div>
              <div className={styles['Admin-es-company-detail-item']}>
                <span className={styles['Admin-es-detail-label']}>Start Date:</span>
                <span className={styles['Admin-es-detail-value']}>
                  {filterCriteria?.driveStartDate ? new Date(filterCriteria.driveStartDate).toLocaleDateString('en-GB').split('/').join('-') : 'N/A'}
                </span>
              </div>
              <div className={styles['Admin-es-company-detail-item']}>
                <span className={styles['Admin-es-detail-label']}>End Date:</span>
                <span className={styles['Admin-es-detail-value']}>
                  {filterCriteria?.driveEndDate ? new Date(filterCriteria.driveEndDate).toLocaleDateString('en-GB').split('/').join('-') : 'N/A'}
                </span>
              </div>
              <div className={styles['Admin-es-company-detail-item']}>
                <span className={styles['Admin-es-detail-label']}>Rounds:</span>
                <span className={styles['Admin-es-detail-value']}>{filterCriteria?.totalRound || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles['Admin-es-bottom-card']}>
          <div className={styles['Admin-es-profile-header']}>
            <div className={styles['Admin-es-profile-title']}>ELIGIBLE STUDENTS</div>

            <div className={styles['Admin-es-header-progress']}>
              <span className={styles['Admin-es-header-progress-text']}>
                Selected: <strong style={{ color: '#2085f6' }}>{selectedStudents.length}</strong> / {filteredStudents.length}
              </span>
              <div className={styles['Admin-es-header-bar-container']}>
                <div
                  className={styles['Admin-es-header-bar-fill']}
                  style={{
                    width: `${filteredStudents.length > 0 ? (selectedStudents.length / filteredStudents.length) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
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

          <div className={styles['Admin-es-table-container']}>
            <table className={styles['Admin-es-profile-table']} ref={tableRef}>
              <thead>
                <tr>
                  <th className={styles['Admin-es-col-checkbox']}>
                    <input
                      type="checkbox"
                      className={styles['Admin-es-checkbox']}
                      onChange={handleSelectAll}
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                    />
                  </th>
                  <th className={styles['Admin-es-col-sno']}>S.No</th>
                  <th className={styles['Admin-es-col-regno']}>Register Number</th>
                  <th className={styles['Admin-es-col-name']}>Name</th>
                  <th className={styles['Admin-es-col-yearsem']}>Year-sem</th>
                  {getVisibleColumns().batch && <th className={styles['Admin-es-col-batch']}>Batch</th>}
                  {getVisibleColumns().department && <th className={styles['Admin-es-col-branch']}>Branch</th>}
                  {getVisibleColumns().ugCgpa && <th className={styles['Admin-es-col-cgpa']}>CGPA</th>}
                  {getVisibleColumns().tenthPercentage && <th className={styles['Admin-es-col-pct']}>10th %</th>}
                  {getVisibleColumns().twelfthPercentage && <th className={styles['Admin-es-col-pct']}>12th %</th>}
                  {getVisibleColumns().diplomaPercentage && <th className={styles['Admin-es-col-pct']}>Diploma %</th>}
                  {getVisibleColumns().backlogs && <th className={styles['Admin-es-col-backlogs']}>Backlogs</th>}
                  <th className={styles['Admin-es-col-view']}>View</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr className={styles['Admin-es-loading-row']}>
                    <td colSpan={getVisibleColumnCount()} className={styles['Admin-es-loading-cell']}>
                      <div className={styles['Admin-es-loading-wrapper']}>
                        <div className={styles['Admin-es-spinner']}></div>
                        <span className={styles['Admin-es-loading-text']}>Loading students...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr className={styles['Admin-es-empty-row']}>
                    <td colSpan={getVisibleColumnCount()} className={styles['Admin-es-empty-cell']}>
                      No students match the filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, index) => {
                    const studentYear = student.currentYear || student.year || calculateCurrentYear(student.batch);
                    const studentSem = student.currentSemester || student.semester || student.sem || '';
                    const yearSemStr = studentYear || studentSem 
                      ? `${normalizeYearRoman(studentYear)}-${normalizeSemNumeric(studentSem)}` 
                      : 'N/A';
                    return (
                      <tr
                        key={student._id || student.id}
                        onClick={() => handleSelectStudent(student._id || student.id)}
                        className={selectedStudents.includes(student._id || student.id) ? styles['Admin-es-selected-row'] : ''}
                      >
                        <td className={styles['Admin-es-col-checkbox']}>
                          <input
                            type="checkbox"
                            className={styles['Admin-es-checkbox']}
                            checked={selectedStudents.includes(student._id || student.id)}
                            onChange={() => handleSelectStudent(student._id || student.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className={styles['Admin-es-col-sno']}>{index + 1}</td>
                        <td className={styles['Admin-es-col-regno']}>{student.regNo || 'N/A'}</td>
                        <td className={styles['Admin-es-col-name']}>{`${student.firstName || ''} ${student.lastName || ''}`.trim()}</td>
                        <td className={styles['Admin-es-col-yearsem']}>{yearSemStr}</td>
                        {getVisibleColumns().batch && <td className={styles['Admin-es-col-batch']}>{student.batch || 'N/A'}</td>}
                        {getVisibleColumns().department && <td className={styles['Admin-es-col-branch']}>{student.branch || 'N/A'}</td>}
                        {getVisibleColumns().ugCgpa && <td className={styles['Admin-es-col-cgpa']}>{student.overallCGPA || 'N/A'}</td>}
                        {getVisibleColumns().tenthPercentage && <td className={styles['Admin-es-col-pct']}>{student.tenthPercentage || 'N/A'}</td>}
                        {getVisibleColumns().twelfthPercentage && <td className={styles['Admin-es-col-pct']}>{student.twelfthPercentage || 'N/A'}</td>}
                        {getVisibleColumns().diplomaPercentage && <td className={styles['Admin-es-col-pct']}>{student.diplomaPercentage || 'N/A'}</td>}
                        {getVisibleColumns().backlogs && <td className={styles['Admin-es-col-backlogs']}>{student.currentBacklogs || '0'}</td>}
                        <td className={styles['Admin-es-col-view']} style={{ textAlign: 'center', padding: '8px', cursor: 'pointer' }} onClick={(e) => {
                          e.stopPropagation();
                          const studentId = student._id || student.id;
                          if (studentId) {
                            handleViewProfile(studentId, student);
                          }
                        }}>
                          <EyeIcon />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {!isLoading && filteredStudents.length > 0 && (
            <div className={styles['Admin-es-table-footer']}>
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
                disabled={isSubmitting || selectedStudents.length === 0}
                style={{
                  opacity: (isSubmitting || selectedStudents.length === 0) ? 0.5 : 1,
                  cursor: (isSubmitting || selectedStudents.length === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                Select
              </button>
            </div>
          )}
        </div>
      </div>

      {isSidebarOpen && (
        <div
          className={styles['Admin-es-overlay']}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

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
                  <circle className={styles['Admin-es-success-icon-circle']} cx="26" cy="26" r="25" fill="none" />
                  <path className={styles['Admin-es-success-icon-check']} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
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
        onClose={() => { }}
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

      {/* Selection Progress Popup */}
      <CertificateDownloadProgressAlert
        isOpen={isSubmitting}
        progress={submitProgress}
        fileLabel="eligible students"
        title="Selecting..."
        color="#4EA24E"
        progressColor="#4EA24E"
        messages={{
          initial: 'Selecting eligible students...',
          mid: 'Saving selections in database...',
          final: 'Finalizing student selections...'
        }}
      />
    </div>
  );
}

export default AdminEsstudapp;