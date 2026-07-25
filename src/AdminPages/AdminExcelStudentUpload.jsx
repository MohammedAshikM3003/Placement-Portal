import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import mongoDBService from '../services/mongoDBService.jsx';
import styles from './AdminExcelStudentUpload.module.css';

const AdminExcelStudentUpload = ({ onLogout }) => {
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
  const normalizeRowKeys = (row, rowIndex = 0) => {
    const normalized = { ...row };
    let rawNameVal = '';

    Object.keys(row).forEach((key) => {
      const val = row[key];
      if (val === undefined || val === null || String(val).trim() === '') return;
      const strVal = String(val).trim();
      const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

      // 1. Register Number / Roll No / Student ID
      if (['regno', 'registerno', 'regnumber', 'rollno', 'rollnumber', 'registrationno', 'registrationnumber', 'studentid', 'studentidno', 'studentidnumber', 'univregno', 'universityregno', 'enrollmentno', 'enrollmentnumber', 'slno', 'sno'].includes(cleanKey)) {
        normalized.regNo = strVal;
      } else if (!normalized.regNo && (cleanKey.includes('reg') || cleanKey.includes('roll') || cleanKey.includes('enroll'))) {
        normalized.regNo = strVal;
      }

      // 2. Names
      if (['firstname', 'first_name', 'fname'].includes(cleanKey)) {
        normalized.firstName = strVal;
      } else if (['lastname', 'last_name', 'lname', 'surname'].includes(cleanKey)) {
        normalized.lastName = strVal;
      } else if (['name', 'studentname', 'fullname', 'nameofthestudent', 'candidatename', 'nameofthecandidate'].includes(cleanKey)) {
        rawNameVal = strVal;
      } else if (!rawNameVal && cleanKey.includes('name')) {
        rawNameVal = strVal;
      }

      // 3. Date of Birth
      if (['dob', 'dateofbirth', 'birthdate', 'dobddmmyyyy'].includes(cleanKey) || cleanKey.includes('dob') || cleanKey.includes('birth')) {
        let parsedDob = strVal;
        if (typeof val === 'number') {
          try {
            const dateObj = XLSX.SSF.parse_date_code(val);
            if (dateObj) {
              const day = String(dateObj.d).padStart(2, '0');
              const month = String(dateObj.m).padStart(2, '0');
              const year = String(dateObj.y);
              parsedDob = `${day}${month}${year}`;
            }
          } catch (e) {
            // keep strVal
          }
        } else {
          const digits = parsedDob.replace(/[^0-9]/g, '');
          if (digits.length >= 8) {
            parsedDob = digits.slice(0, 8);
          }
        }
        normalized.dob = parsedDob;
      }

      // 4. Primary Email
      if (['primaryemail', 'email', 'emailid', 'mail', 'mailid', 'studentemail', 'emailaddress', 'personalemail'].includes(cleanKey) || (cleanKey.includes('email') || cleanKey.includes('mail'))) {
        if (!cleanKey.includes('domain') && !cleanKey.includes('college') && !cleanKey.includes('official')) {
          normalized.primaryEmail = strVal;
        }
      }

      // 5. Domain Email
      if (['domainemail', 'collegeemail', 'officialemail', 'institutionalemail', 'ksrctemail', 'collegemail', 'instemail'].includes(cleanKey) || (cleanKey.includes('email') && (cleanKey.includes('college') || cleanKey.includes('official') || cleanKey.includes('domain')))) {
        normalized.domainEmail = strVal;
      }

      // 6. Branch / Dept
      if (['branch', 'dept', 'department', 'stream', 'branchname', 'deptname'].includes(cleanKey) || cleanKey.includes('branch') || cleanKey.includes('dept')) {
        normalized.branch = strVal;
      }

      // 7. Degree
      if (['degree', 'programme', 'program', 'course', 'degreebranch'].includes(cleanKey) || cleanKey.includes('degree') || cleanKey.includes('program')) {
        normalized.degree = strVal;
      }

      // 8. Batch
      if (['batch', 'batchyear', 'passoutyear', 'passedoutyear', 'yearofpassing', 'yop', 'academicbatch'].includes(cleanKey) || cleanKey.includes('batch') || cleanKey.includes('passout')) {
        normalized.batch = strVal;
      }

      // 9. Current Year
      if (['currentyear', 'year', 'yearofstudy', 'academicyear'].includes(cleanKey)) {
        normalized.currentYear = strVal;
      }

      // 10. Current Semester
      if (['currentsemester', 'semester', 'sem'].includes(cleanKey) || cleanKey.includes('sem')) {
        normalized.currentSemester = strVal;
      }

      // 11. Section
      if (['section', 'sec'].includes(cleanKey) || cleanKey.includes('sec')) {
        normalized.section = strVal;
      }

      // 12. Gender
      if (['gender', 'sex'].includes(cleanKey)) {
        normalized.gender = strVal;
      }

      // 13. Mobile No
      if (['mobileno', 'mobilenumber', 'mobile', 'phone', 'phoneno', 'phonenumber', 'contact', 'contactno', 'cell', 'cellno', 'whatsappno'].includes(cleanKey) || cleanKey.includes('mobile') || cleanKey.includes('phone') || cleanKey.includes('contact')) {
        normalized.mobileNo = strVal;
      }

      // 14. Father Name
      if (['fathername', 'fathersname', 'father_name', 'parentname'].includes(cleanKey) || cleanKey.includes('father')) {
        normalized.fatherName = strVal;
      }

      // 15. Father Occupation
      if (['fatheroccupation', 'fathersoccupation', 'parentoccupation'].includes(cleanKey)) {
        normalized.fatherOccupation = strVal;
      }

      // 16. Address & City
      if (['address'].includes(cleanKey)) normalized.address = strVal;
      if (['city', 'town', 'location', 'district'].includes(cleanKey)) normalized.city = strVal;

      // 17. Study Category & Quota
      if (['studycategory', 'category', 'admissiontype', '12thdiploma'].includes(cleanKey)) normalized.studyCategory = strVal;
      if (['quota', 'admissionquota', 'categoryquota'].includes(cleanKey) || (cleanKey.includes('quota') && !cleanKey.includes('study'))) normalized.quota = strVal;

      // 18. Residential Status
      if (['residentialstatus', 'hostellerdayscholar', 'hostelldayscholar', 'residentialstatus'].includes(cleanKey) || cleanKey.includes('residential') || cleanKey.includes('dayscholar')) normalized.residentialStatus = strVal;

      // 19. First Graduate
      if (['firstgraduate', 'fg', 'isfirstgraduate'].includes(cleanKey) || (cleanKey.includes('first') && cleanKey.includes('graduate'))) normalized.firstGraduate = strVal;

      // 20. Value Added Courses
      if (['valueaddedcourses', 'vac', 'valueaddedcourse', 'certifications'].includes(cleanKey) || cleanKey.includes('valueadded')) normalized.valueAddedCourses = strVal;

      // 21. About Sibling
      if (['aboutsibling', 'siblingdetails', 'siblings', 'sibling'].includes(cleanKey) || cleanKey.includes('sibling')) normalized.aboutSibling = strVal;

      // 22. Ration Card No
      if (['rationcardno', 'rationcardnumber', 'smartcardno', 'rationcard'].includes(cleanKey) || cleanKey.includes('ration')) normalized.rationCardNo = strVal;

      // 23. Willing to Sign Bond
      if (['willingtosignbond', 'bondwillingness', 'bond'].includes(cleanKey) || cleanKey.includes('bond')) normalized.willingToSignBond = strVal;

      // 24. Preferred Mode of Drive
      if (['preferredmodeofdrive', 'drivemode', 'preferreddrivemode', 'modeofdrive'].includes(cleanKey) || (cleanKey.includes('mode') && cleanKey.includes('drive'))) normalized.preferredModeOfDrive = strVal;
    });

    // Smart Name Split if firstName was not directly provided
    if (!normalized.firstName && rawNameVal) {
      const parts = rawNameVal.split(/\s+/);
      normalized.firstName = parts[0] || 'Student';
      normalized.lastName = parts.slice(1).join(' ') || (normalized.lastName || '');
    }

    // Smart Fallback for Reg No if not found
    if (!normalized.regNo) {
      const keys = Object.keys(row);
      for (const k of keys) {
        const v = String(row[k] || '').trim();
        if (v && /^[A-Za-z0-9]{4,20}$/.test(v) && !v.includes('@')) {
          normalized.regNo = v;
          break;
        }
      }
    }

    if (!normalized.regNo) {
      normalized.regNo = `STU${String(rowIndex + 1).padStart(4, '0')}`;
    }

    if (!normalized.firstName) normalized.firstName = 'Student';
    if (!normalized.dob) normalized.dob = '01012000';
    if (!normalized.primaryEmail) normalized.primaryEmail = `${normalized.regNo.toLowerCase()}@ksrict.ac.in`;

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

        const normalizedRows = rawJson.map((row, idx) => normalizeRowKeys(row, idx));
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
