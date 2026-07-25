import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import useAdminAuth from '../utils/useAdminAuth';

import mongoDBService from '../services/mongoDBService.jsx';
import styles from './AdminExcelStudentUpload.module.css';

const AdminExcelStudentUpload = ({ onLogout }) => {
  // Check Admin authentication
  useAdminAuth();
  const navigate = useNavigate();

  // State management
  const [excelStudents, setExcelStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingList, setFetchingList] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [uploadStatus, setUploadStatus] = useState({ message: '', type: '' });
  
  // Preview modal states
  const [previewData, setPreviewData] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [fileName, setFileName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Delete confirm modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [clearAllModalOpen, setClearAllModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef(null);

  // Fetch Excel-Uploaded Students from MongoDB
  const fetchExcelStudentsList = useCallback(async () => {
    setFetchingList(true);
    try {
      const response = await mongoDBService.getExcelStudents({
        search: searchTerm,
        branch: selectedBranch,
        batch: selectedBatch
      });
      if (response && response.students) {
        setExcelStudents(response.students);
      }
    } catch (err) {
      console.error('Failed to fetch Excel students:', err);
    } finally {
      setFetchingList(false);
    }
  }, [searchTerm, selectedBranch, selectedBatch]);

  useEffect(() => {
    fetchExcelStudentsList();
  }, [fetchExcelStudentsList]);

  // Helper to normalize Excel Row Keys
  const normalizeRowKeys = (row) => {
    const normalized = {};
    Object.keys(row).forEach((key) => {
      const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      if (['regno', 'registerno', 'regnumber', 'rollno', 'registrationno'].includes(cleanKey)) {
        normalized.regNo = String(row[key] || '').trim();
      } else if (['firstname', 'first_name', 'fname', 'name'].includes(cleanKey)) {
        normalized.firstName = String(row[key] || '').trim();
      } else if (['lastname', 'last_name', 'lname', 'surname'].includes(cleanKey)) {
        normalized.lastName = String(row[key] || '').trim();
      } else if (['dob', 'dateofbirth', 'birthdate'].includes(cleanKey)) {
        let val = String(row[key] || '').trim();
        // Convert Excel Serial Date if applicable
        if (typeof row[key] === 'number') {
          const dateObj = XLSX.SSF.parse_date_code(row[key]);
          if (dateObj) {
            const day = String(dateObj.d).padStart(2, '0');
            const month = String(dateObj.m).padStart(2, '0');
            const year = String(dateObj.y);
            val = `${day}${month}${year}`;
          }
        }
        normalized.dob = val;
      } else if (['primaryemail', 'email', 'emailid', 'mail'].includes(cleanKey)) {
        normalized.primaryEmail = String(row[key] || '').trim();
      } else if (['domainemail', 'collegeemail'].includes(cleanKey)) {
        normalized.domainEmail = String(row[key] || '').trim();
      } else if (['branch', 'dept', 'department'].includes(cleanKey)) {
        normalized.branch = String(row[key] || '').trim();
      } else if (['degree', 'course'].includes(cleanKey)) {
        normalized.degree = String(row[key] || '').trim();
      } else if (['batch', 'batchyear', 'passoutyear'].includes(cleanKey)) {
        normalized.batch = String(row[key] || '').trim();
      } else if (['currentyear', 'year'].includes(cleanKey)) {
        normalized.currentYear = String(row[key] || '').trim();
      } else if (['currentsemester', 'semester', 'sem'].includes(cleanKey)) {
        normalized.currentSemester = String(row[key] || '').trim();
      } else if (['section', 'sec'].includes(cleanKey)) {
        normalized.section = String(row[key] || '').trim();
      } else if (['gender', 'sex'].includes(cleanKey)) {
        normalized.gender = String(row[key] || '').trim();
      } else if (['mobileno', 'mobile', 'phone', 'contact'].includes(cleanKey)) {
        normalized.mobileNo = String(row[key] || '').trim();
      } else if (['fathername', 'father_name'].includes(cleanKey)) {
        normalized.fatherName = String(row[key] || '').trim();
      } else if (['fatheroccupation'].includes(cleanKey)) {
        normalized.fatherOccupation = String(row[key] || '').trim();
      } else if (['address'].includes(cleanKey)) {
        normalized.address = String(row[key] || '').trim();
      } else if (['city'].includes(cleanKey)) {
        normalized.city = String(row[key] || '').trim();
      }
    });

    // Fallbacks
    if (!normalized.regNo && row['Reg No']) normalized.regNo = String(row['Reg No']);
    if (!normalized.firstName && row['First Name']) normalized.firstName = String(row['First Name']);
    if (!normalized.lastName && row['Last Name']) normalized.lastName = String(row['Last Name']);

    return normalized;
  };

  // Process File Selection
  const handleFileSelect = (file) => {
    if (!file) return;
    setFileName(file.name);
    setUploadStatus({ message: '', type: '' });

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          setUploadStatus({ message: 'The selected Excel file is empty.', type: 'error' });
          return;
        }

        const normalizedRows = rawJson.map((row) => normalizeRowKeys(row));
        setPreviewData(normalizedRows);
        setShowPreviewModal(true);
      } catch (err) {
        console.error('Error parsing Excel file:', err);
        setUploadStatus({ message: 'Failed to read Excel file. Please verify file format.', type: 'error' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Submit Excel parsed data to MongoDB
  const handleConfirmUpload = async () => {
    if (!previewData || previewData.length === 0) return;

    setIsUploading(true);
    setUploadStatus({ message: 'Uploading student records directly to MongoDB...', type: 'info' });

    try {
      const res = await mongoDBService.uploadExcelStudents(previewData);
      if (res && res.success) {
        setUploadStatus({
          message: `Successfully uploaded ${res.total || previewData.length} students into MongoDB! (${res.inserted || 0} inserted, ${res.updated || 0} updated)`,
          type: 'success'
        });
        setShowPreviewModal(false);
        setPreviewData([]);
        fetchExcelStudentsList();
      } else {
        setUploadStatus({ message: res?.error || 'Failed to upload students to database.', type: 'error' });
      }
    } catch (err) {
      console.error('Upload to Mongo failed:', err);
      setUploadStatus({ message: err.message || 'An error occurred during database upload.', type: 'error' });
    } finally {
      setIsUploading(false);
    }
  };

  // Download Sample Excel Template
  const handleDownloadSample = () => {
    const sampleData = [
      {
        'Reg No': '73162310286',
        'First Name': 'Ravi',
        'Last Name': 'Singh',
        'DOB': '11102003',
        'Primary Email': 'rs8592297@gmail.com',
        'Domain Email': '23cs60@ksrict.ac.in',
        'Branch': 'IOT',
        'Degree': 'Bachelor of Engineering',
        'Batch': '2023-2027',
        'Current Year': 'III',
        'Current Semester': '6',
        'Section': 'D',
        'Gender': 'male',
        'Mobile No': '+919797559042',
        'Father Name': 'Omkar Singh',
        'Father Occupation': 'Farmer',
        'Address': 'Kharote',
        'City': 'Kathua'
      },
      {
        'Reg No': '73162310287',
        'First Name': 'Priya',
        'Last Name': 'Sharma',
        'DOB': '15042003',
        'Primary Email': 'priya.s@gmail.com',
        'Domain Email': '23cs61@ksrict.ac.in',
        'Branch': 'CSE',
        'Degree': 'Bachelor of Engineering',
        'Batch': '2023-2027',
        'Current Year': 'III',
        'Current Semester': '6',
        'Section': 'A',
        'Gender': 'female',
        'Mobile No': '+919876543210',
        'Father Name': 'Rajesh Sharma',
        'Father Occupation': 'Business',
        'Address': 'Gandhi Nagar',
        'City': 'Jammu'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students_Sample');
    XLSX.writeFile(wb, 'Students_Data_Upload_Template.xlsx');
  };

  // Export current list to Excel
  const handleExportList = () => {
    if (!excelStudents || excelStudents.length === 0) return;
    const exportData = excelStudents.map((s) => ({
      'Register No': s.regNo,
      'First Name': s.firstName,
      'Last Name': s.lastName,
      'DOB': s.dob,
      'Email': s.primaryEmail || s.email,
      'Branch': s.branch,
      'Degree': s.degree,
      'Batch': s.batch,
      'Current Year': s.currentYear,
      'Current Semester': s.currentSemester,
      'Section': s.section,
      'Gender': s.gender,
      'Mobile': s.mobileNo,
      'Father Name': s.fatherName
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Excel_Students');
    XLSX.writeFile(wb, 'Excel_Uploaded_Students_Report.xlsx');
  };

  // Delete Individual Student
  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await mongoDBService.deleteExcelStudent(studentToDelete._id || studentToDelete.regNo);
      setDeleteModalOpen(false);
      setStudentToDelete(null);
      fetchExcelStudentsList();
    } catch (err) {
      console.error('Delete student failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Clear All Excel Students
  const handleClearAll = async () => {
    setIsDeleting(true);
    try {
      await mongoDBService.clearAllExcelStudents();
      setClearAllModalOpen(false);
      fetchExcelStudentsList();
    } catch (err) {
      console.error('Clear all failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Extract unique branches and batches for filter options
  const uniqueBranches = Array.from(new Set(excelStudents.map((s) => s.branch).filter(Boolean)));
  const uniqueBatches = Array.from(new Set(excelStudents.map((s) => s.batch).filter(Boolean)));

  return (
    <div className={styles.container}>
      <div className={styles.mainLayout}>
        <div className={styles.contentWrapper}>
          
          {/* Page Header */}
          <div className={styles.pageHeader}>
            <div className={styles.headerTitleGroup}>
              <h1 className={styles.title}>
                Excel Students Data Upload
                <span className={styles.titleBadge}>MongoDB Sync</span>
              </h1>
              <p className={styles.subtitle}>
                Upload Excel sheets (300+ records) directly to MongoDB students collection and manage uploaded entries.
              </p>
            </div>
            <div className={styles.headerActions}>
              <button className={styles.btnSecondary} onClick={handleDownloadSample}>
                📥 Download Excel Template
              </button>
              {excelStudents.length > 0 && (
                <button className={styles.btnSecondary} onClick={handleExportList}>
                  📊 Export Current List
                </button>
              )}
              {excelStudents.length > 0 && (
                <button className={styles.btnDanger} onClick={() => setClearAllModalOpen(true)}>
                  🗑️ Clear All Excel Data
                </button>
              )}
            </div>
          </div>

          {/* Upload Status Banner */}
          {uploadStatus.message && (
            <div
              style={{
                padding: '14px 20px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontWeight: 600,
                fontSize: '0.92rem',
                backgroundColor:
                  uploadStatus.type === 'success'
                    ? 'rgba(34, 197, 94, 0.15)'
                    : uploadStatus.type === 'error'
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(59, 130, 246, 0.15)',
                color:
                  uploadStatus.type === 'success'
                    ? '#4ade80'
                    : uploadStatus.type === 'error'
                    ? '#f87171'
                    : '#60a5fa',
                border: `1px solid ${
                  uploadStatus.type === 'success'
                    ? 'rgba(34, 197, 94, 0.3)'
                    : uploadStatus.type === 'error'
                    ? 'rgba(239, 68, 68, 0.3)'
                    : 'rgba(59, 130, 246, 0.3)'
                }`
              }}
            >
              {uploadStatus.message}
            </div>
          )}

          {/* Stats Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.iconBlue}`}>🎓</div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{excelStudents.length}</span>
                <span className={styles.statLabel}>Uploaded Excel Students</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.iconGreen}`}>🏫</div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{uniqueBranches.length}</span>
                <span className={styles.statLabel}>Branches Represented</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.iconPurple}`}>📅</div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>{uniqueBatches.length}</span>
                <span className={styles.statLabel}>Academic Batches</span>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.iconAmber}`}>⚡</div>
              <div className={styles.statContent}>
                <span className={styles.statValue}>Direct</span>
                <span className={styles.statLabel}>MongoDB Collection</span>
              </div>
            </div>
          </div>

          {/* Excel Dropzone */}
          <div className={styles.uploadCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>📂 Upload Student Excel Sheet</h2>
            </div>
            <div
              className={styles.dropzone}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className={styles.uploadCloudIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className={styles.dropzoneText}>
                Click to browse or drag and drop your Excel file here
              </p>
              <p className={styles.dropzoneHint}>
                Supports .xlsx, .xls, and .csv files (Supports 300+ student rows per upload)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className={styles.hiddenFileInput}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
            </div>
          </div>

          {/* Excel Students Data Table */}
          <div className={styles.tableContainerCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>📋 Excel Students Database</h2>
            </div>

            {/* Filter Bar */}
            <div className={styles.filterBar}>
              <div className={styles.searchInputWrapper}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Search by Reg No, Name, or Email..."
                  className={styles.searchInput}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className={styles.filterSelect}
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="all">All Branches</option>
                {uniqueBranches.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>

              <select
                className={styles.filterSelect}
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
              >
                <option value="all">All Batches</option>
                {uniqueBatches.map((bt) => (
                  <option key={bt} value={bt}>
                    {bt}
                  </option>
                ))}
              </select>
            </div>

            {/* Data Table */}
            <div className={styles.responsiveTableWrapper}>
              {fetchingList ? (
                <div className={styles.emptyState}>
                  <p>Loading Excel student data from MongoDB...</p>
                </div>
              ) : excelStudents.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyStateIcon}>📂</div>
                  <p>No Excel uploaded student data found.</p>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Upload an Excel file above to see student records populated here.
                  </span>
                </div>
              ) : (
                <table className={styles.excelTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Register No</th>
                      <th>Name</th>
                      <th>DOB</th>
                      <th>Email</th>
                      <th>Branch</th>
                      <th>Batch</th>
                      <th>Sec</th>
                      <th>Mobile</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excelStudents.map((s, idx) => (
                      <tr key={s._id || s.regNo || idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: '#60a5fa' }}>{s.regNo}</td>
                        <td>{`${s.firstName || ''} ${s.lastName || ''}`}</td>
                        <td>{s.dob}</td>
                        <td>{s.primaryEmail || s.email}</td>
                        <td>
                          <span className={styles.badgeBranch}>{s.branch || 'CSE'}</span>
                        </td>
                        <td>
                          <span className={styles.badgeBatch}>{s.batch || '2023-2027'}</span>
                        </td>
                        <td>{s.section || 'A'}</td>
                        <td>{s.mobileNo || '-'}</td>
                        <td>
                          <button
                            className={styles.tableActionBtn}
                            title="Delete Student"
                            onClick={() => {
                              setStudentToDelete(s);
                              setDeleteModalOpen(true);
                            }}
                          >
                            ❌
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Preview Modal before submitting to MongoDB */}
      {showPreviewModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                Parsed Excel Preview ({previewData.length} Rows Found)
              </h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setShowPreviewModal(false)}
              >
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '16px' }}>
                File: <strong>{fileName}</strong>. Review the parsed student entries below before saving directly to MongoDB:
              </p>
              <div className={styles.responsiveTableWrapper} style={{ maxHeight: '400px' }}>
                <table className={styles.excelTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Reg No</th>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>DOB</th>
                      <th>Email</th>
                      <th>Branch</th>
                      <th>Batch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 50).map((row, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600, color: '#60a5fa' }}>{row.regNo || 'MISSING'}</td>
                        <td>{row.firstName || '-'}</td>
                        <td>{row.lastName || '-'}</td>
                        <td>{row.dob || '-'}</td>
                        <td>{row.primaryEmail || '-'}</td>
                        <td>{row.branch || '-'}</td>
                        <td>{row.batch || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewData.length > 50 && (
                <p style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '10px' }}>
                  Showing first 50 of {previewData.length} records. All {previewData.length} records will be saved to MongoDB.
                </p>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnSecondary}
                onClick={() => setShowPreviewModal(false)}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                className={styles.btnPrimary}
                onClick={handleConfirmUpload}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading to MongoDB...' : `Upload ${previewData.length} Students to MongoDB`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Confirm Modal */}
      {deleteModalOpen && studentToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '480px' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Confirm Delete Student</h3>
              <button className={styles.modalCloseBtn} onClick={() => setDeleteModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: '#e2e8f0', fontSize: '0.95rem' }}>
                Are you sure you want to delete student <strong>{studentToDelete.firstName} {studentToDelete.lastName} ({studentToDelete.regNo})</strong> from MongoDB?
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
                Cancel
              </button>
              <button className={styles.btnDanger} onClick={handleDeleteStudent} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirm Modal */}
      {clearAllModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Clear All Excel Student Data</h3>
              <button className={styles.modalCloseBtn} onClick={() => setClearAllModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.95rem' }}>
                ⚠️ Warning: This action will permanently delete all {excelStudents.length} Excel uploaded student records from MongoDB.
              </p>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
                Are you sure you want to proceed?
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setClearAllModalOpen(false)} disabled={isDeleting}>
                Cancel
              </button>
              <button className={styles.btnDanger} onClick={handleClearAll} disabled={isDeleting}>
                {isDeleting ? 'Clearing All...' : 'Yes, Delete All Excel Students'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminExcelStudentUpload;
