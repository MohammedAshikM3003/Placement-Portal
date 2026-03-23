import React, { useState, useEffect, useCallback } from 'react';
import AdNavbar from '../components/Navbar/Adnavbar.js';
import AdSidebar from '../components/Sidebar/Adsidebar.js';
import AdminTrainAddPopup from '../components/alerts/Admin_TrainAddPopup.jsx';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ExportProgressAlert, ExportSuccessAlert, ExportFailedAlert } from '../components/alerts';
import styles from './Admin_schedule_training_batch.module.css';

function AdminScheduleTrainingBatch({ onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportPopupState, setExportPopupState] = useState('none');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportType, setExportType] = useState('Excel');
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false);

  useEffect(() => {
    const handleCloseSidebar = () => setIsSidebarOpen(false);
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((v) => !v);
  };

  const students = [
    { id: 1, name: 'S. Maneesh Adhithya', regNo: '7315XXXX19', dept: 'CSE', year: 'III', section: 'A', cgpa: '8.1', mobile: '9788657300' },
    { id: 2, name: 'S. Mohan', regNo: '7315XXXX20', dept: 'CSE', year: 'III', section: 'A', cgpa: '8.5', mobile: '9380100759' },
    { id: 3, name: 'N. Chandan', regNo: '7315XXXX21', dept: 'CSE', year: 'III', section: 'A', cgpa: '8.0', mobile: '9944802196' },
    { id: 4, name: 'B. Mahalakshmi', regNo: '7315XXXX22', dept: 'CSE', year: 'III', section: 'A', cgpa: '8.6', mobile: '9688465458' },
    { id: 5, name: 'M. Pavan', regNo: '7315XXXX23', dept: 'CSE', year: 'III', section: 'A', cgpa: '7.9', mobile: '9751275125' },
    { id: 6, name: 'K. Rithika', regNo: '7315XXXX24', dept: 'CSE', year: 'III', section: 'A', cgpa: '8.2', mobile: '9790011223' },
    { id: 7, name: 'P. Arjun', regNo: '7315XXXX25', dept: 'CSE', year: 'III', section: 'A', cgpa: '8.4', mobile: '9876543210' },
    { id: 8, name: 'R. Meenakshi', regNo: '7315XXXX26', dept: 'CSE', year: 'III', section: 'A', cgpa: '8.3', mobile: '9887766554' },
    { id: 9, name: 'T. Sanjay', regNo: '7315XXXX27', dept: 'CSE', year: 'III', section: 'A', cgpa: '8.0', mobile: '9798098765' },
    { id: 10, name: 'L. Harini', regNo: '7315XXXX28', dept: 'CSE', year: 'III', section: 'A', cgpa: '8.7', mobile: '9865432109' },
  ];

  const handleRowToggle = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleClearSelections = () => {
    setSelectedRows([]);
  };

  const handleToggleExportMenu = () => {
    setShowExportMenu((v) => !v);
  };

  const handleAddButtonClick = () => {
    if (selectedRows.length === 0) {
      alert('Please select at least one student before adding.');
      return;
    }
    setIsAddPopupOpen(true);
  };

  const handleCloseAddPopup = () => {
    setIsAddPopupOpen(false);
  };

  const handleConfirmAdd = () => {
    console.log('Selected students:', selectedRows);
    setIsAddPopupOpen(false);
    // Add your logic here for handling the confirmation
    alert(`${selectedRows.length} student(s) added to the batch successfully!`);
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
    const rows = students.map((s) => [
      s.id,
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
  }, [students]);

  const exportToPDF = useCallback(async () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const head = [['S.No', 'Student Name', 'Register Number', 'Department', 'Year', 'Section', 'CGPA', 'Mobile']];
    const body = students.map((s) => [
      s.id,
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
  }, [students]);

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
              <div className={styles['ad-stb-field']}>
                <input
                  className={styles['ad-stb-input']}
                  placeholder=" "
                />
                <label className={styles['ad-stb-label']}>Enter Batch Name</label>
              </div>
              <select className={styles['ad-stb-input']} defaultValue=""> 
                <option value="" disabled>Select Trainer</option>
              </select>
              <select className={styles['ad-stb-input']} defaultValue="">
                <option value="" disabled>Select Course</option>
              </select>
              <select className={styles['ad-stb-input']} defaultValue="">
                <option value="" disabled>Select Department</option>
              </select>
              <select className={styles['ad-stb-input']} defaultValue="">
                <option value="" disabled>Select Year</option>
              </select>
              <select className={styles['ad-stb-input']} defaultValue="">
                <option value="" disabled>Select Section</option>
              </select>
              <div className={styles['ad-stb-search-group']}>
                <input
                  className={styles['ad-stb-input']}
                  placeholder=" "
                />
                <label className={styles['ad-stb-label']}>Search Name</label>
              </div>
              <div className={styles['ad-stb-search-group']}>
                <input
                  className={styles['ad-stb-input']}
                  placeholder=" "
                />
                <label className={styles['ad-stb-label']}>Search Regno</label>
              </div>
            </div>
          </div>

          <div className={styles['ad-stb-batch-card']}>
            <div className={styles['ad-stb-batch-header']}>Batch - I</div>
            <div className={styles['ad-stb-batch-inner']}>
              <div className={styles['ad-stb-batch-body']}>
                <div><span>Trainer :</span> <strong>Bibin Kishore</strong></div>
                <div><span>Departments :</span> <strong>CSE, ECE, IT</strong></div>
                <div><span>Course :</span> <strong>Java FSD</strong></div>
                <div><span>Starting Date :</span> <strong>10 July 2025</strong></div>
                <div><span>Ending Date :</span> <strong>30 July 2025</strong></div>
              </div>
            </div>
          </div>
        </div>

        {/* Table section */}
        <div className={styles['ad-stb-table-card']}>
          <div className={styles['ad-stb-table-header']}>
            <div className={styles['ad-stb-table-title']}>COMPUTER SCIENCE &amp; ENGINEERING</div>
            <div className={styles['ad-stb-print-button-container']}>
              <button
                type="button"
                className={styles['ad-stb-print-btn']}
                onClick={handleToggleExportMenu}
              >
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
                  <th>S.No</th>
                  <th>Student Name</th>
                  <th>Register Number</th>
                  <th>Department</th>
                  <th>Year</th>
                  <th>Section</th>
                  <th>CGPA</th>
                  <th>Mobile</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const isSelected = selectedRows.includes(student.id);
                  return (
                    <tr
                      key={student.id}
                      onClick={() => handleRowToggle(student.id)}
                      className={isSelected ? styles['ad-stb-row-selected'] : ''}
                    >
                      <td>{student.id}</td>
                      <td>{student.name}</td>
                      <td>{student.regNo}</td>
                      <td>{student.dept}</td>
                      <td>{student.year}</td>
                      <td>{student.section}</td>
                      <td>{student.cgpa}</td>
                      <td>{student.mobile}</td>
                      <td className={styles['ad-stb-action-cell']}>
                        <span
                          className={
                            isSelected
                              ? `${styles['ad-stb-action-tick-box']} ${styles['ad-stb-action-tick-box--selected']}`
                              : styles['ad-stb-action-tick-box']
                          }
                        >
                          {isSelected ? '✔' : ''}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={styles['ad-stb-inner-actions-row']}>
            <div className={styles['ad-stb-actions-right']}>
              <button
                type="button"
                className={styles['ad-stb-btn-light']}
                onClick={handleClearSelections}
              >
                Clear
              </button>
              <button 
                type="button"
                className={styles['ad-stb-btn-primary']}
                onClick={handleAddButtonClick}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* <div className={styles['ad-stb-footer-actions']}>
          <button className={styles['ad-stb-btn-secondary']}>Discard</button>
          <button className={styles['ad-stb-footer-save']}>Save</button>
        </div> */}
      </div>

      <AdminTrainAddPopup 
        isOpen={isAddPopupOpen}
        onClose={handleCloseAddPopup}
        onConfirm={handleConfirmAdd}
        selectedCount={selectedRows.length}
      />

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

export default AdminScheduleTrainingBatch;
