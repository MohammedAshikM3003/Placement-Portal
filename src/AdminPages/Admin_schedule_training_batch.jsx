import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import AdNavbar from '../components/Navbar/Adnavbar.js';
import AdSidebar from '../components/Sidebar/Adsidebar.js';
import AdminTrainAddPopup from '../components/alerts/Admin_TrainAddPopup.jsx';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';
import mongoDBService from '../services/mongoDBService.jsx';
import styles from './Admin_schedule_training_batch.module.css';

const parseMultiValue = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (item || '').toString().trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeYearToken = (value = '') => {
  const raw = value.toString().trim().toUpperCase();
  if (!raw) return '';

  const compact = raw.replace(/[^A-Z0-9]/g, '');
  if (!compact) return '';

  const yearAliases = {
    '1': 'I',
    '01': 'I',
    '1ST': 'I',
    '1STYEAR': 'I',
    'FIRST': 'I',
    'FIRSTYEAR': 'I',
    'I': 'I',
    '2': 'II',
    '02': 'II',
    '2ND': 'II',
    '2NDYEAR': 'II',
    'SECOND': 'II',
    'SECONDYEAR': 'II',
    'II': 'II',
    '3': 'III',
    '03': 'III',
    '3RD': 'III',
    '3RDYEAR': 'III',
    'THIRD': 'III',
    'THIRDYEAR': 'III',
    'III': 'III',
    '4': 'IV',
    '04': 'IV',
    '4TH': 'IV',
    '4THYEAR': 'IV',
    'FOURTH': 'IV',
    'FOURTHYEAR': 'IV',
    'IV': 'IV'
  };

  return yearAliases[compact] || compact;
};

const formatDateToDDMMYYYY = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  } catch (error) {
    return dateString;
  }
};

function AdminScheduleTrainingBatch({ onLogout }) {
  const location = useLocation();
  const scheduleContext = location.state || {};

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportPopupState, setExportPopupState] = useState('none');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('Excel');
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false);
  const [addPopupMode, setAddPopupMode] = useState('confirm');
  const [lastAddedCount, setLastAddedCount] = useState(0);
  const [popupBatchLabel, setPopupBatchLabel] = useState('Batch 1');
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [allStudents, setAllStudents] = useState([]);
  const [batchAssignments, setBatchAssignments] = useState([]);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);

  // Filters
  const [batchName, setBatchName] = useState('');
  const [trainerFilter, setTrainerFilter] = useState((scheduleContext.trainer || '').toString().trim());
  const [courseFilter, setCourseFilter] = useState((scheduleContext.selectedCourse || '').toString().trim());
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [yearFilter, setYearFilter] = useState((scheduleContext.applicableYear || '').toString().trim());
  const [sectionFilter, setSectionFilter] = useState('');
  const [nameOrRegFilter, setNameOrRegFilter] = useState('');
  const [mobileFilter, setMobileFilter] = useState('');
  const [cgpaFromFilter, setCgpaFromFilter] = useState('');
  const [cgpaToFilter, setCgpaToFilter] = useState('');

  useEffect(() => {
    const handleCloseSidebar = () => setIsSidebarOpen(false);
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      setIsLoadingStudents(true);
      try {
        const mergedStudents = [];
        const pageSize = 200;
        let page = 1;

        while (page <= 30) {
          const response = await mongoDBService.getStudentsPaginated({
            page,
            limit: pageSize,
            includeImages: 'false'
          });

          const rows = Array.isArray(response?.students) ? response.students : [];
          mergedStudents.push(...rows);

          const hasMore = Boolean(response?.pagination?.hasMore);
          if (!hasMore || rows.length < pageSize) {
            break;
          }

          page += 1;
        }

        const normalized = mergedStudents.map((student, index) => {
          const firstName = (student?.firstName || '').toString().trim();
          const lastName = (student?.lastName || '').toString().trim();
          const fullName =
            (student?.fullName || '').toString().trim() ||
            `${firstName} ${lastName}`.trim() ||
            (student?.name || '').toString().trim() ||
            '-';

          return {
            id: (student?._id || student?.id || student?.regNo || `row-${index}`).toString(),
            name: fullName,
            regNo: (student?.regNo || '').toString().trim(),
            dept: (student?.department || student?.branch || '').toString().trim() || '-',
            year: (student?.currentYear || student?.year || '').toString().trim() || '-',
            section: (student?.section || '').toString().trim() || '-',
            cgpa: (student?.cgpa || student?.overallCGPA || student?.gpa || '').toString().trim() || '-',
            mobile: (student?.mobile || student?.mobileNumber || student?.phone || '').toString().trim() || '-',
            preferredTraining: parseMultiValue(student?.preferredTraining)
          };
        });

        setAllStudents(normalized);
      } catch (error) {
        console.error('Failed to load students for batch mapping:', error);
        setAllStudents([]);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    loadStudents();
  }, []);

  useEffect(() => {
    const loadBatchAssignments = async () => {
      try {
        const assignments = await mongoDBService.getScheduledTrainingBatchAssignments({
          scheduleId: scheduleContext.scheduleId || '',
          companyName: scheduleContext.companyName || '',
          courseName: courseFilter || scheduleContext.selectedCourse || '',
          applicableYear: yearFilter || scheduleContext.applicableYear || ''
        });

        setBatchAssignments(assignments);
        setActiveBatchIndex((prev) => {
          if (assignments.length === 0) return 0;
          return Math.min(prev, assignments.length - 1);
        });
      } catch (error) {
        const message = (error?.message || '').toString();
        if (!message.toLowerCase().includes('route not found') && !message.toLowerCase().includes('not found')) {
          console.error('Failed to load batch assignments:', error);
        }
        setBatchAssignments([]);
        setActiveBatchIndex(0);
      }
    };

    loadBatchAssignments();
  }, [scheduleContext.scheduleId, scheduleContext.companyName, scheduleContext.selectedCourse, scheduleContext.applicableYear, courseFilter, yearFilter]);

  const toggleSidebar = () => {
    setIsSidebarOpen((v) => !v);
  };

  const courseOptions = useMemo(() => {
    const fromSchedule = Array.isArray(scheduleContext.availableCourses)
      ? scheduleContext.availableCourses.map((course) => (course || '').toString().trim()).filter(Boolean)
      : [];

    const fromStudents = allStudents.flatMap((student) => student.preferredTraining || []);
    return [...new Set([...fromSchedule, ...fromStudents])];
  }, [scheduleContext.availableCourses, allStudents]);

  const filteredStudents = useMemo(() => {
    const normalizedCourse = (courseFilter || '').toString().trim().toLowerCase();
    const normalizedYear = normalizeYearToken(yearFilter || '');
    const normalizedDept = (departmentFilter || '').toString().trim().toLowerCase();
    const normalizedSection = (sectionFilter || '').toString().trim().toLowerCase();
    const normalizedNameOrReg = (nameOrRegFilter || '').toString().trim().toLowerCase();
    const normalizedMobile = (mobileFilter || '').toString().trim().toLowerCase();
    const cgpaFrom = Number.parseFloat(cgpaFromFilter);
    const cgpaTo = Number.parseFloat(cgpaToFilter);
    const hasCgpaFrom = !Number.isNaN(cgpaFrom);
    const hasCgpaTo = !Number.isNaN(cgpaTo);

    return allStudents.filter((student) => {
      const preferredTrainings = Array.isArray(student.preferredTraining)
        ? student.preferredTraining.map((course) => (course || '').toString().trim().toLowerCase())
        : [];

      const studentYear = normalizeYearToken(student.year || '');
      const studentDept = (student.dept || '').toString().trim().toLowerCase();
      const studentSection = (student.section || '').toString().trim().toLowerCase();
      const studentName = (student.name || '').toString().trim().toLowerCase();
      const studentRegNo = (student.regNo || '').toString().trim().toLowerCase();
      const studentMobile = (student.mobile || '').toString().trim().toLowerCase();
      const studentCgpa = Number.parseFloat(student.cgpa);

      if (normalizedCourse && !preferredTrainings.includes(normalizedCourse)) {
        return false;
      }

      if (normalizedYear && studentYear !== normalizedYear) {
        return false;
      }

      if (normalizedDept && studentDept !== normalizedDept) {
        return false;
      }

      if (normalizedSection && studentSection !== normalizedSection) {
        return false;
      }

      if (normalizedNameOrReg && !studentName.includes(normalizedNameOrReg) && !studentRegNo.includes(normalizedNameOrReg)) {
        return false;
      }

      if (normalizedMobile && !studentMobile.includes(normalizedMobile)) {
        return false;
      }

      if ((hasCgpaFrom || hasCgpaTo) && Number.isNaN(studentCgpa)) {
        return false;
      }

      if (hasCgpaFrom && studentCgpa < cgpaFrom) {
        return false;
      }

      if (hasCgpaTo && studentCgpa > cgpaTo) {
        return false;
      }

      // Trainer is schedule-level context here; if a different trainer is chosen, return no rows.
      if (trainerFilter && scheduleContext.trainer && trainerFilter !== scheduleContext.trainer) {
        return false;
      }

      return true;
    });
  }, [
    allStudents,
    courseFilter,
    yearFilter,
    departmentFilter,
    sectionFilter,
    nameOrRegFilter,
    mobileFilter,
    cgpaFromFilter,
    cgpaToFilter,
    trainerFilter,
    scheduleContext.trainer
  ]);

  const batchTabs = useMemo(() => {
    if (batchAssignments.length > 0) {
      return batchAssignments.map((assignment, index) => ({
        key: assignment._id || `${assignment.batchName || 'batch'}-${index}`,
        label: `Batch ${index + 1}`,
        batchName: assignment.batchName || `Batch ${index + 1}`,
        students: Array.isArray(assignment.students) ? assignment.students : []
      }));
    }

    return [{
      key: 'batch-1',
      label: 'Batch 1',
      batchName: batchName || `Batch - ${courseFilter || 'Training'}`,
      students: filteredStudents
    }];
  }, [batchAssignments, batchName, courseFilter, filteredStudents]);

  const activeBatchTab = batchTabs[activeBatchIndex] || batchTabs[0];

  const activeBatchStudents = useMemo(() => {
    const students = activeBatchTab?.students || [];
    if (!Array.isArray(students) || students.length === 0) {
      return filteredStudents;
    }

    return students.map((student, index) => ({
      id: (student?.studentId || student?.regNo || `batch-row-${index}`).toString(),
      name: (student?.name || '-').toString(),
      regNo: (student?.regNo || '').toString(),
      dept: (student?.dept || '-').toString(),
      year: (student?.year || '-').toString(),
      section: (student?.section || '-').toString(),
      cgpa: (student?.cgpa || '-').toString(),
      mobile: (student?.mobile || '-').toString(),
      preferredTraining: []
    }));
  }, [activeBatchTab, filteredStudents]);

  const departmentOptions = useMemo(() => {
    return [...new Set(
      activeBatchStudents
        .map((student) => (student.dept || '').toString().trim())
        .filter((value) => value && value !== '-')
    )].sort((a, b) => a.localeCompare(b));
  }, [activeBatchStudents]);

  const yearOptions = useMemo(() => {
    return [...new Set(
      activeBatchStudents
        .map((student) => normalizeYearToken(student.year))
        .filter((value) => value && value !== '-')
    )].sort((a, b) => a.localeCompare(b));
  }, [activeBatchStudents]);

  const sectionOptions = useMemo(() => {
    return [...new Set(
      activeBatchStudents
        .map((student) => (student.section || '').toString().trim().toUpperCase())
        .filter((value) => value && value !== '-')
    )].sort((a, b) => a.localeCompare(b));
  }, [activeBatchStudents]);

  const selectedStudentIds = useMemo(() => new Set(selectedRows), [selectedRows]);

  const displayedDepartment = useMemo(() => {
    const deptSet = [...new Set(activeBatchStudents.map((student) => student.dept).filter(Boolean))];
    return deptSet.length > 0 ? deptSet.join(', ') : 'No Department';
  }, [activeBatchStudents]);

  const isAllVisibleSelected = useMemo(() => {
    if (activeBatchStudents.length === 0) {
      return false;
    }

    return activeBatchStudents.every((student) => selectedStudentIds.has(student.id));
  }, [activeBatchStudents, selectedStudentIds]);

  const handleRowToggle = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAllVisible = (event) => {
    if (event.target.checked) {
      setSelectedRows(activeBatchStudents.map((student) => student.id));
      return;
    }

    setSelectedRows([]);
  };

  const handleClearSelections = () => {
    setSelectedRows([]);
  };

  const handleToggleExportMenu = () => {
    setShowExportMenu((v) => !v);
  };

  const handleAddButtonClick = async () => {
    if (selectedRows.length === 0) {
      alert('Please select at least one student before adding.');
      return;
    }

    const selectedStudents = activeBatchStudents.filter((student) => selectedStudentIds.has(student.id));
    if (!selectedStudents.length) {
      alert('Selected students are not available in the current filtered list. Please reselect and try again.');
      return;
    }

    try {
      const scheduleId = (scheduleContext.scheduleId || '').toString().trim();
      const companyName = (scheduleContext.companyName || '').toString().trim();
      const courseName = (courseFilter || scheduleContext.selectedCourse || '').toString().trim();
      const trainerName = (trainerFilter || scheduleContext.trainer || '').toString().trim();
      const applicableYear = (yearFilter || scheduleContext.applicableYear || '').toString().trim();
      const startDate = (scheduleContext.scheduleStartDate || '').toString().trim();
      const endDate = (scheduleContext.scheduleEndDate || '').toString().trim();
      const currentBatchNumber = (activeBatchIndex || 0) + 1;
      const normalizedCompanyToken = (companyName || 'company').toString().trim().toLowerCase().replace(/\s+/g, '-');
      const normalizedCourseToken = (courseName || 'course').toString().trim().toLowerCase().replace(/\s+/g, '-');
      const currentBatchName = `${normalizedCompanyToken}-${normalizedCourseToken}-${currentBatchNumber}`;
      const nextBatchNumber = currentBatchNumber + 1;
      const nextBatchName = `${normalizedCompanyToken}-${normalizedCourseToken}-${nextBatchNumber}`;
      const remainingStudents = activeBatchStudents.filter((student) => !selectedStudentIds.has(student.id));

      setLastAddedCount(selectedStudents.length);
      setPopupBatchLabel(`Batch ${currentBatchNumber}`);
      setAddPopupMode('progress');
      setIsAddPopupOpen(true);

      await mongoDBService.saveScheduledTrainingBatchAssignment({
        scheduleId,
        companyName,
        courseName,
        trainer: trainerName,
        applicableYear,
        startDate,
        endDate,
        batchNumber: currentBatchNumber,
        batchName: currentBatchName,
        students: selectedStudents.map((student) => ({
          studentId: student.id,
          regNo: student.regNo,
          name: student.name,
          dept: student.dept,
          year: student.year,
          section: student.section,
          mobile: student.mobile,
          cgpa: student.cgpa
        }))
      });

      if (remainingStudents.length > 0) {
        await mongoDBService.saveScheduledTrainingBatchAssignment({
          scheduleId,
          companyName,
          courseName,
          trainer: trainerName,
          applicableYear,
          startDate,
          endDate,
          batchNumber: nextBatchNumber,
          batchName: nextBatchName,
          students: remainingStudents.map((student) => ({
            studentId: student.id,
            regNo: student.regNo,
            name: student.name,
            dept: student.dept,
            year: student.year,
            section: student.section,
            mobile: student.mobile,
            cgpa: student.cgpa
          }))
        });
      }

      const refreshedAssignments = await mongoDBService.getScheduledTrainingBatchAssignments({
        scheduleId: scheduleContext.scheduleId || '',
        companyName: scheduleContext.companyName || '',
        courseName: courseFilter || scheduleContext.selectedCourse || '',
        applicableYear: yearFilter || scheduleContext.applicableYear || ''
      });

      setBatchAssignments(refreshedAssignments);
      if (remainingStudents.length > 0) {
        const nextIndex = refreshedAssignments.findIndex((assignment) => assignment.batchName === nextBatchName);
        setActiveBatchIndex(nextIndex >= 0 ? nextIndex : Math.min(activeBatchIndex + 1, refreshedAssignments.length - 1));
        setTimeout(() => {
          setIsAddPopupOpen(false);
          setAddPopupMode('progress');
        }, 900);
      } else {
        const matchedIndex = refreshedAssignments.findIndex((assignment) => assignment.batchName === currentBatchName);
        setActiveBatchIndex(matchedIndex >= 0 ? matchedIndex : 0);
        setAddPopupMode('success');
      }

      setSelectedRows([]);
    } catch (error) {
      console.error('Failed to save batch assignment:', error);
      setIsAddPopupOpen(false);
      alert(error?.message || 'Failed to add students to training batch');
    }
  };

  const handleCloseAddPopup = () => {
    if (addPopupMode === 'progress') return;
    setIsAddPopupOpen(false);
    setAddPopupMode('progress');
    setLastAddedCount(0);
  };

  const simulateExport = useCallback(async (type, exportFn) => {
    setShowExportMenu(false);
    setExportType(type);
    setExportProgress(0);
    setExportPopupState('progress');

    let progressInterval;
    try {
      progressInterval = setInterval(() => {
        setExportProgress((prevProgress) => {
          if (prevProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prevProgress + 10;
        });
      }, 120);

      await new Promise((resolve) => setTimeout(resolve, 300));
      await exportFn();

      clearInterval(progressInterval);
      setExportProgress(100);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setExportPopupState('success');
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      console.error('Export failed:', error);
      setExportPopupState('failed');
    }
  }, []);

  const exportToExcel = useCallback(async () => {
    const header = ['S.No', 'Student Name', 'Register Number', 'Department', 'Year', 'Section', 'CGPA', 'Mobile'];
    const rows = activeBatchStudents.map((s, index) => [
      index + 1,
      s.name,
      s.regNo,
      s.dept,
      s.year,
      s.section,
      s.cgpa,
      s.mobile,
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Training Batch');
    XLSX.writeFile(workbook, 'Training_Batch_Report.xlsx');
  }, [activeBatchStudents]);

  const exportToPDF = useCallback(async () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const head = [['S.No', 'Student Name', 'Register Number', 'Department', 'Year', 'Section', 'CGPA', 'Mobile']];
    const body = activeBatchStudents.map((s, index) => [
      index + 1,
      s.name,
      s.regNo,
      s.dept,
      s.year,
      s.section,
      s.cgpa,
      s.mobile,
    ]);

    doc.text('Training Batch Report', 14, 15);
    autoTable(doc, {
      head,
      body,
      startY: 20,
      styles: { fontSize: 8 },
    });
    doc.save('Training_Batch_Report.pdf');
  }, [activeBatchStudents]);

  const handleExportExcel = () => {
    simulateExport('Excel', exportToExcel);
  };

  const handleExportPdf = () => {
    simulateExport('PDF', exportToPDF);
  };

  return (
    <div className={styles['ad-stb-page']}>
      <AdNavbar onToggleSidebar={toggleSidebar} />
      <AdSidebar isOpen={isSidebarOpen} onLogout={onLogout} />

      <div className={styles['ad-stb-content']}>
        {/* Filters + batch card row */}
        <div className={styles['ad-stb-top-row']}>
          <div className={styles['ad-stb-filters-card']}>
            <div className={styles['ad-stb-training-pill']}>Training</div>
            <div className={styles['ad-stb-filters-grid']}>
              <div className={styles['ad-stb-filter-group']}>
                <label className={styles['ad-stb-filter-label']}>Name / Register Number</label>
                <input
                  className={styles['ad-stb-input']}
                  placeholder="Enter Name/RegisterNumber"
                  value={nameOrRegFilter}
                  onChange={(e) => setNameOrRegFilter(e.target.value)}
                />
              </div>

              <div className={styles['ad-stb-filter-group']}>
                <label className={styles['ad-stb-filter-label']}>Department</label>
                <select className={styles['ad-stb-input']} value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
                  <option value="">Select Department</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className={styles['ad-stb-filter-group']}>
                <label className={styles['ad-stb-filter-label']}>Year</label>
                <select className={styles['ad-stb-input']} value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
                  <option value="">Select Year</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className={styles['ad-stb-filter-group']}>
                <label className={styles['ad-stb-filter-label']}>Section</label>
                <select className={styles['ad-stb-input']} value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                  <option value="">Select Section</option>
                  {sectionOptions.map((section) => (
                    <option key={section} value={section}>{section}</option>
                  ))}
                </select>
              </div>

              <div className={styles['ad-stb-filter-group']}>
                <label className={styles['ad-stb-filter-label']}>Mobile Number</label>
                <input
                  className={styles['ad-stb-input']}
                  placeholder="Enter Mobile Number"
                  value={mobileFilter}
                  onChange={(e) => setMobileFilter(e.target.value)}
                />
              </div>

              <div className={styles['ad-stb-filter-group']}>
                <label className={styles['ad-stb-filter-label']}>CGPA</label>
                <div className={styles['ad-stb-cgpa-range']}>
                  <input
                    className={styles['ad-stb-input']}
                    placeholder="From"
                    value={cgpaFromFilter}
                    onChange={(e) => setCgpaFromFilter(e.target.value)}
                  />
                  <span className={styles['ad-stb-cgpa-separator']}>-</span>
                  <input
                    className={styles['ad-stb-input']}
                    placeholder="To"
                    value={cgpaToFilter}
                    onChange={(e) => setCgpaToFilter(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles['ad-stb-batch-card']}>
            <div className={styles['ad-stb-batch-header']}>
              {scheduleContext.companyName && scheduleContext.selectedCourse
                ? `${scheduleContext.companyName}-${scheduleContext.selectedCourse}-1`
                : batchName || `Batch - ${courseFilter || 'Training'}`
              }
            </div>
            <div className={styles['ad-stb-batch-inner']}>
              <div className={styles['ad-stb-batch-body']}>
                <div><span>Company :</span> <strong>{scheduleContext.companyName || '-'}</strong></div>
                <div><span>Trainer :</span> <strong>{scheduleContext.trainer || '-'}</strong></div>
                <div><span>Departments :</span> <strong>{displayedDepartment}</strong></div>
                <div><span>Course :</span> <strong>{courseFilter || '-'}</strong></div>
                <div><span>Starting Date :</span> <strong>{formatDateToDDMMYYYY(scheduleContext.scheduleStartDate) || '-'}</strong></div>
                <div><span>Ending Date :</span> <strong>{formatDateToDDMMYYYY(scheduleContext.scheduleEndDate) || '-'}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles['ad-stb-batch-tabs']}>
          {batchTabs.map((tab, index) => (
            <button
              key={tab.key}
              type="button"
              className={`${styles['ad-stb-batch-tab']} ${index === activeBatchIndex ? styles['ad-stb-batch-tab-active'] : ''}`}
              onClick={() => {
                setActiveBatchIndex(index);
                setBatchName(tab.batchName);
                setSelectedRows([]);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table section */}
        <div className={styles['ad-stb-table-card']}>
          <div className={styles['ad-stb-table-header']}>
            <div className={styles['ad-stb-table-title']}>
              {`${(scheduleContext.companyName || 'JIO').toString().trim() || 'JIO'}-${(courseFilter || scheduleContext.selectedCourse || 'DTH').toString().trim() || 'DTH'}-1`.toUpperCase()}
            </div>
            <div className={styles['ad-stb-selected-count']}>
              Selected Students : {selectedRows.length}
            </div>
            <div className={styles['ad-stb-print-button-container']}>
              <button type="button" className={styles['ad-stb-print-btn']} onClick={handleToggleExportMenu}>
                Print
              </button>
              {showExportMenu && (
                <div className={styles['ad-stb-export-menu']}>
                  <button type="button" onClick={handleExportExcel}>Export to Excel</button>
                  <button type="button" onClick={handleExportPdf}>Export to PDF</button>
                </div>
              )}
            </div>
          </div>

          <div className={styles['ad-stb-table-wrapper']}>
            <table className={styles['ad-stb-table']}>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      className={styles['ad-stb-checkbox']}
                      checked={isAllVisibleSelected}
                      onChange={handleSelectAllVisible}
                      aria-label="Select all students"
                    />
                  </th>
                  <th>S.No</th>
                  <th>Student Name</th>
                  <th>Register Number</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>Section</th>
                  <th>CGPA</th>
                  <th>Mobile</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingStudents ? (
                  <tr><td colSpan="9" style={{ textAlign: 'center' }}>Loading students...</td></tr>
                ) : activeBatchStudents.length === 0 ? (
                  <tr><td colSpan="9" style={{ textAlign: 'center' }}>No students found for this training course and year.</td></tr>
                ) : activeBatchStudents.map((student, index) => {
                  const isSelected = selectedStudentIds.has(student.id);
                  return (
                    <tr key={student.id} className={isSelected ? styles['ad-stb-row-selected'] : ''}>
                      <td className={styles['ad-stb-action-cell']}>
                        <input
                          type="checkbox"
                          className={styles['ad-stb-checkbox']}
                          checked={isSelected}
                          onChange={() => handleRowToggle(student.id)}
                          aria-label={`Select ${student.name}`}
                        />
                      </td>
                      <td>{index + 1}</td>
                      <td>{student.name}</td>
                      <td>{student.regNo}</td>
                      <td>{student.dept}</td>
                      <td>{student.year}</td>
                      <td>{student.section}</td>
                      <td>{student.cgpa}</td>
                      <td>{student.mobile}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles['ad-stb-inner-actions-row']}>
            <div className={styles['ad-stb-actions-right']}>
              <button type="button" className={styles['ad-stb-btn-light']} onClick={handleClearSelections}>Clear</button>
              <button type="button" className={styles['ad-stb-btn-primary']} onClick={handleAddButtonClick}>Add</button>
            </div>
          </div>
        </div>
      </div>

      {isAddPopupOpen ? (
        <AdminTrainAddPopup
          isOpen={isAddPopupOpen}
          onClose={handleCloseAddPopup}
          selectedCount={lastAddedCount}
          mode={addPopupMode}
          batchLabel={popupBatchLabel}
        />
      ) : null}

      <ExportProgressAlert isOpen={exportPopupState === 'progress'} onClose={() => {}} progress={exportProgress} exportType={exportType} />
      <ExportSuccessAlert isOpen={exportPopupState === 'success'} onClose={() => setExportPopupState('none')} exportType={exportType} />
      <ExportFailedAlert isOpen={exportPopupState === 'failed'} onClose={() => setExportPopupState('none')} exportType={exportType} />
    </div>
  );
}

export default AdminScheduleTrainingBatch;
