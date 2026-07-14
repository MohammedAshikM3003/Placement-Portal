import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import { API_BASE_URL } from '../utils/apiConfig';
import styles from './CooSemesterHistory.module.css';
import Adminicon from "../assets/Adminicon.png";
import Dropdown from '../components/common/Dropdown/Dropdown.jsx';
import manageStudentsIcon from "../assets/Coo_ManagestudentsCardicon.svg";
import '../components/alerts/AlertStyles.css';

const WarningIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const InspectIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="1.2em" height="1.2em" viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M0 0h24v24H0z" fill="none" />
    <g fill="none" stroke="#d23b42" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
      <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z" />
      <path d="M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" />
    </g>
  </svg>
);

const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const YEAR_SEMESTER_MAP = {
  'I': ['1', '2'],
  'II': ['3', '4'],
  'III': ['5', '6'],
  'IV': ['7', '8']
};

function CooSemesterHistory({ onLogout, onViewChange }) {
  useCoordinatorAuth();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Selection and filter states
  const [selectedUploadIds, setSelectedUploadIds] = useState(new Set());

  // Alert/Popup states
  const [downloadPopupState, setDownloadPopupState] = useState('none');
  const [previewPopupState, setPreviewPopupState] = useState('none');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [previewProgress, setPreviewProgress] = useState(0);

  const [filterInputs, setFilterInputs] = useState({
    fileName: '',
    subjects: '',
    year: '',
    semester: ''
  });
  
  const [fileNameFocused, setFileNameFocused] = useState(false);
  const [subjectsFocused, setSubjectsFocused] = useState(false);

  // Delete Popup States
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError('');
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/semester-history`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });

      if (!response.ok) {
        throw new Error('Failed to fetch semester upload history');
      }

      const data = await response.json();
      setHistoryList(Array.isArray(data.history) ? data.history : []);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err.message || 'Failed to load upload history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Compute filtered records
  const filteredHistory = useMemo(() => {
    return historyList.filter(item => {
      if (filterInputs.fileName && !item.fileName.toLowerCase().includes(filterInputs.fileName.toLowerCase())) {
        return false;
      }
      if (filterInputs.subjects && String(item.uploadedSubjectCount || 0) !== String(filterInputs.subjects).trim()) {
        return false;
      }
      if (filterInputs.year && item.year !== filterInputs.year) {
        return false;
      }
      if (filterInputs.semester && String(item.semester) !== String(filterInputs.semester)) {
        return false;
      }
      return true;
    });
  }, [historyList, filterInputs]);

  const hasActiveFilters = Boolean(
    filterInputs.fileName || 
    filterInputs.subjects || 
    filterInputs.year || 
    filterInputs.semester
  );

  const handleClearFilters = () => {
    setFilterInputs({
      fileName: '',
      subjects: '',
      year: '',
      semester: ''
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUploadIds(new Set(filteredHistory.map(item => item.uploadId)));
    } else {
      setSelectedUploadIds(new Set());
    }
  };

  const handleSelectRow = (uploadId) => {
    console.log('[handleSelectRow] Clicked uploadId:', uploadId);
    setSelectedUploadIds(prev => {
      const next = new Set(prev);
      if (next.has(uploadId)) {
        next.delete(uploadId);
      } else {
        next.add(uploadId);
      }
      console.log('[handleSelectRow] Current selection:', Array.from(next));
      return next;
    });
  };

  const handleView = (upload) => {
    navigate('/coo-ms-semester-detail', {
      state: {
        uploadId: upload.uploadId,
        extractedPdfName: upload.fileName,
        fileName: upload.fileName,
        year: upload.year,
        semester: upload.semester,
        extractedStudents: [] // Trigger automatic list loading inside details page
      }
    });
  };

  const isPreviewActive = selectedUploadIds.size === 1;
  const handlePreviewSelected = async () => {
    console.log('[Preview] isPreviewActive:', isPreviewActive);
    console.log('[Preview] selectedUploadIds:', Array.from(selectedUploadIds));
    if (!isPreviewActive) return;
    const selectedId = Array.from(selectedUploadIds)[0];
    const upload = historyList.find(item => item.uploadId === selectedId);
    console.log('[Preview] Found upload:', upload);
    if (!upload) return;

    if (!upload.gridfsFileId) {
      console.warn('[Preview] Missing gridfsFileId for upload:', upload.uploadId);
      alert('No PDF file associated with this upload record.');
      return;
    }

    let progressInterval;
    try {
      setPreviewPopupState('progress');
      setPreviewProgress(0);

      progressInterval = setInterval(() => {
        setPreviewProgress((prev) => {
          if (prev >= 90) return 90;
          return prev + 15;
        });
      }, 150);

      const authToken = localStorage.getItem('authToken');
      const fileUrl = `${API_BASE_URL}/file/${upload.gridfsFileId}`;
      const response = await fetch(fileUrl, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      });

      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }

      const blob = await response.blob();
      const previewUrl = window.URL.createObjectURL(blob);

      await new Promise((resolve) => setTimeout(resolve, 300));

      const newWindow = window.open(previewUrl, '_blank');
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setPreviewProgress(100);

      if (newWindow) {
        setTimeout(() => setPreviewPopupState('none'), 500);
      } else {
        setPreviewPopupState('failed');
        setTimeout(() => setPreviewPopupState('none'), 3000);
      }
    } catch (err) {
      console.error('Error previewing file:', err);
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setPreviewPopupState('failed');
      setTimeout(() => setPreviewPopupState('none'), 3000);
    }
  };

  const isDownloadActive = selectedUploadIds.size === 1;
  const handleDownloadSelected = () => {
    console.log('[Download] isDownloadActive:', isDownloadActive);
    console.log('[Download] selectedUploadIds:', Array.from(selectedUploadIds));
    if (!isDownloadActive) return;
    const selectedId = Array.from(selectedUploadIds)[0];
    const upload = historyList.find(item => item.uploadId === selectedId);
    console.log('[Download] Found upload:', upload);
    if (upload) handleDownload(upload);
  };

  const handleDownload = async (upload) => {
    console.log('[Download] Starting download for:', upload);
    if (!upload || !upload.gridfsFileId) {
      console.warn('[Download] Missing upload or gridfsFileId');
      alert('No PDF file associated with this upload record.');
      return;
    }

    let progressInterval;
    if (!upload?.gridfsFileId) {
      alert("No PDF file associated with this upload record.");
      return;
    }

    setDownloadPopupState('progress');
    setDownloadProgress(0);

    progressInterval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 85) return prev;
        return prev + Math.random() * 12;
      });
    }, 150);

    try {
      // Simulate preparing the download
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setDownloadProgress(100);

      // Trigger direct native browser download using server content-disposition
      const fileUrl = `${API_BASE_URL}/file/${upload.gridfsFileId}?download=true`;
      const a = document.createElement('a');
      a.href = fileUrl;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
      
      setDownloadPopupState('success');
    } catch (err) {
      console.error('Error downloading file:', err);
      if (progressInterval) {
        clearInterval(progressInterval);
      }
      setDownloadPopupState('failed');
      setTimeout(() => setDownloadPopupState('none'), 3000);
    }
  };

  const closeDownloadPopup = () => {
    setDownloadPopupState('none');
  };

  const closePreviewPopup = () => {
    setPreviewPopupState('none');
  };

  const isDeleteActive = selectedUploadIds.size >= 1;
  const handleDeleteSelected = () => {
    if (!isDeleteActive) return;
    if (selectedUploadIds.size === 1) {
      const selectedId = Array.from(selectedUploadIds)[0];
      const upload = historyList.find(item => item.uploadId === selectedId);
      setSelectedUpload(upload);
    } else {
      setSelectedUpload({
        uploadId: 'BULK_DELETE',
        fileName: `${selectedUploadIds.size} selected records`
      });
    }
    setShowDeletePopup(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedUploadIds.size === 0 && !selectedUpload) return;
    setIsDeleting(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const idsToDelete = selectedUpload?.uploadId === 'BULK_DELETE'
        ? Array.from(selectedUploadIds)
        : [selectedUpload.uploadId];

      for (const id of idsToDelete) {
        const response = await fetch(`${API_BASE_URL}/semester-history/${id}`, {
          method: 'DELETE',
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
        });

        if (!response.ok) {
          throw new Error('Failed to delete upload record');
        }
      }

      setShowDeletePopup(false);
      setSelectedUpload(null);
      setSelectedUploadIds(new Set());
      await fetchHistory();
    } catch (err) {
      console.error('Error deleting upload record:', err);
      alert(err.message || 'Failed to delete upload record');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} Adminicon={Adminicon} />
      <div className={styles['co-ms-layout']}>
        <Sidebar 
          isOpen={isSidebarOpen} 
          onLogout={onLogout} 
          currentView="manage-students" 
          onViewChange={onViewChange}
          onClose={() => setIsSidebarOpen(false)}
        />
        <div className={styles['semester-main-content']}>
          {/* Top Row Cards */}
          <div className={styles['co-history-top-row']}>
            {/* Left Card: Navigation to Manage Students */}
            <div 
              className={styles['co-history-left-card']}
              onClick={() => navigate('/coo-manage-students-semester')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate('/coo-manage-students-semester');
                }
              }}
            >
              <div className={styles['co-history-icon-wrapper']}>
                <img src={manageStudentsIcon} alt="Manage" />
              </div>
              <h2>Manage Students</h2>
              <p>Access and manage student information.</p>
            </div>

            {/* Middle Card: Filter & Sort */}
            <div className={styles['co-history-filter-card']}>
              <div className={styles['co-history-filter-header-container']}>
                <div className={styles['co-history-filter-header']}>Filter & Sort</div>
                {hasActiveFilters && (
                  <button 
                    type="button" 
                    className={styles['co-history-clear-btn']} 
                    onClick={handleClearFilters}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className={styles['co-history-filter-content']}>
                <div className={styles['co-history-input-wrapper']}>
                  <label className={styles['co-history-static-label']}>FileName</label>
                  <div className={`${styles['co-history-text-container']} ${fileNameFocused ? styles['is-focused'] : ''}`}>
                    <input 
                      type="text" 
                      placeholder="Search by FileName" 
                      value={filterInputs.fileName} 
                      onChange={(e) => setFilterInputs(prev => ({ ...prev, fileName: e.target.value }))}
                      onFocus={() => setFileNameFocused(true)}
                      onBlur={() => setFileNameFocused(false)}
                      className={styles['co-history-text-input']}
                    />
                  </div>
                </div>

                <div className={styles['co-history-input-wrapper']}>
                  <label className={styles['co-history-static-label']}>Subjects</label>
                  <div className={`${styles['co-history-text-container']} ${subjectsFocused ? styles['is-focused'] : ''}`}>
                    <input 
                      type="text" 
                      placeholder="Search by Subjects" 
                      value={filterInputs.subjects} 
                      onChange={(e) => setFilterInputs(prev => ({ ...prev, subjects: e.target.value }))}
                      onFocus={() => setSubjectsFocused(true)}
                      onBlur={() => setSubjectsFocused(false)}
                      className={styles['co-history-text-input']}
                    />
                  </div>
                </div>

                <div className={styles['co-history-input-wrapper']}>
                  <label className={styles['co-history-static-label']}>Year</label>
                  <Dropdown
                    options={['I', 'II', 'III', 'IV']}
                    selectedOption={filterInputs.year}
                    onSelect={(val) => setFilterInputs(prev => ({ ...prev, year: val || '', semester: '' }))}
                    placeholder="Select Year"
                    role="coordinator"
                    className={styles['co-history-dropdown-wrapper']}
                    headerClassName={styles['co-history-dropdown-header']}
                  />
                </div>

                <div className={styles['co-history-input-wrapper']}>
                  <label className={styles['co-history-static-label']}>Sem</label>
                  <Dropdown
                    options={filterInputs.year ? (YEAR_SEMESTER_MAP[filterInputs.year] || []) : []}
                    selectedOption={filterInputs.semester}
                    onSelect={(val) => setFilterInputs(prev => ({ ...prev, semester: val || '' }))}
                    placeholder={filterInputs.year ? "Select Sem" : "Select Year First"}
                    disabled={!filterInputs.year}
                    role="coordinator"
                    className={styles['co-history-dropdown-wrapper']}
                    headerClassName={styles['co-history-dropdown-header']}
                  />
                </div>
              </div>
            </div>

            {/* Right Cards: Action Cards */}
            <div className={styles['co-history-action-cards-section']}>
              {/* Preview Action Card */}
              <div className={`${styles['co-history-action-card']} ${isPreviewActive ? styles['card-active'] : styles['card-disabled']}`}>
                <h4 className={isPreviewActive ? styles['header-preview-active'] : styles['header-disabled']}>Preview</h4>
                <p className={styles['co-history-action-description']}>Select one record to preview</p>
                <button 
                  className={`${styles['co-history-action-btn']} ${styles['co-history-preview-btn']}`} 
                  onClick={handlePreviewSelected}
                  disabled={!isPreviewActive}
                >
                  Preview
                </button>
              </div>

              {/* Download Action Card */}
              <div className={`${styles['co-history-action-card']} ${isDownloadActive ? styles['card-active'] : styles['card-disabled']}`}>
                <h4 className={isDownloadActive ? styles['header-download-active'] : styles['header-disabled']}>Download</h4>
                <p className={styles['co-history-action-description']}>Select one record to download</p>
                <button 
                  className={`${styles['co-history-action-btn']} ${styles['co-history-download-btn']}`} 
                  onClick={handleDownloadSelected}
                  disabled={!isDownloadActive}
                >
                  Download
                </button>
              </div>

              {/* Delete Action Card */}
              <div className={`${styles['co-history-action-card']} ${isDeleteActive ? styles['card-active'] : styles['card-disabled']}`}>
                <h4 className={isDeleteActive ? styles['header-delete-active'] : styles['header-disabled']}>Deleting</h4>
                <p className={styles['co-history-action-description']}>Select records to delete</p>
                <button 
                  className={`${styles['co-history-action-btn']} ${styles['co-history-delete-btn']}`} 
                  onClick={handleDeleteSelected}
                  disabled={!isDeleteActive}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          {error && <div style={{ color: 'red', fontWeight: 'bold', marginBottom: '10px' }}>{error}</div>}

          <div className={styles['history-card']}>
            <h3 className={styles['history-table-title']}>SEMESTER UPLOAD HISTORY</h3>
            <div className={styles['table-wrap']}>
              {filteredHistory.length === 0 && !isLoading ? (
                <div className={styles['empty-state']}>No upload history records found.</div>
              ) : (
                <table className={styles['history-table']}>
                  <thead>
                    <tr>
                      <th>
                        <input 
                          type="checkbox" 
                          className={styles['co-history-table-checkbox']} 
                          checked={filteredHistory.length > 0 && selectedUploadIds.size === filteredHistory.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th>S.No</th>
                      <th>Date</th>
                      <th>File Name</th>
                      <th>Year</th>
                      <th>Sem</th>
                      <th>Students</th>
                      <th>Subjects</th>
                      <th style={{ textAlign: 'center' }}>Inspect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr className={styles['co-history-loading-row']}>
                        <td colSpan="9" className={styles['co-history-loading-cell']}>
                          <div className={styles['co-history-loading-wrapper']}>
                            <div className={styles['co-history-spinner']}></div>
                            <span className={styles['co-history-loading-text']}>Loading upload history...</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((item, index) => {
                        const dateStr = formatDate(item.uploadedAt);
                        const isSelected = selectedUploadIds.has(item.uploadId);
                        return (
                          <tr 
                            key={item._id || item.uploadId}
                            onClick={() => handleSelectRow(item.uploadId)}
                            className={isSelected ? styles['row-selected'] : ''}
                          >
                            <td>
                              <input 
                                type="checkbox" 
                                className={styles['co-history-table-checkbox']} 
                                checked={isSelected}
                                onChange={() => handleSelectRow(item.uploadId)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </td>
                            <td>{index + 1}</td>
                            <td>{dateStr}</td>
                            <td style={{ fontWeight: '600' }}>{item.fileName}</td>
                            <td>{item.year}</td>
                            <td>{item.semester}</td>
                            <td>{item.uploadedStudentCount || 0}</td>
                            <td>{item.uploadedSubjectCount || 0}</td>
                            <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                              <button 
                                type="button" 
                                className={styles['action-icon-btn']}
                                onClick={() => handleView(item)}
                                aria-label="Inspect record"
                                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <InspectIcon />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reusable Warning Delete Popup */}
      {showDeletePopup && (
        <div className={styles['ms-popup-overlay']}>
          <div className={styles['ms-popup-container']}>
            <div className={styles['ms-popup-header']}>Warning !</div>
            <div className={styles['ms-popup-body']}>
              <svg className={styles['co-history-warning-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle className={styles['co-history-warning-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
                <path className={styles['co-history-warning-icon--exclamation']} fill="none" d="M26 16v12M26 34v2"/>
              </svg>
              <h2 className={styles['ms-status-title']}>Are you sure?</h2>
              <p className={styles['ms-status-text']}>
                Deleting {selectedUpload?.uploadId === 'BULK_DELETE' ? selectedUpload.fileName : 'this upload'} will permanently remove the associated <strong>uploaded PDF</strong>, <strong>semester records</strong>, <strong>extracted subjects</strong>, <strong>student semester data</strong>, and <strong>semester notifications</strong>.
              </p>
            </div>
            <div className={styles['ms-popup-footer']}>
              <button 
                type="button" 
                onClick={() => {
                  setShowDeletePopup(false);
                  setSelectedUpload(null);
                }} 
                className={styles['discard-btn']}
                disabled={isDeleting}
              >
                Discard
              </button>
              <button 
                type="button" 
                onClick={handleConfirmDelete} 
                className={styles['confirm-delete-btn']}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Components for Previewing and Downloading */}
      <SemesterFileDownloadProgressAlert 
          isOpen={downloadPopupState === 'progress'} 
          progress={downloadProgress}
      />
      <SemesterFileDownloadSuccessAlert 
          isOpen={downloadPopupState === 'success'} 
          onClose={closeDownloadPopup}
      />
      <SemesterFileDownloadFailedAlert 
          isOpen={downloadPopupState === 'failed'} 
          onClose={closeDownloadPopup}
      />
      <SemesterFilePreviewProgressAlert 
          isOpen={previewPopupState === 'progress'} 
          progress={previewProgress} 
      />
      <SemesterFilePreviewFailedAlert 
          isOpen={previewPopupState === 'failed'} 
          onClose={closePreviewPopup}
      />
    </>
  );
}

// ==========================================
// Local Alert/Popup components
// ==========================================

const SemesterFilePreviewProgressAlert = ({ isOpen, progress = 25 }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: '#d23b42' }}>
          Previewing...
        </div>
        <div className="achievement-popup-body">
          <div className="preview-progress-icon-container">
            <svg className="preview-progress-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="preview-progress-icon--bg" cx="26" cy="26" r="20" fill="none" stroke="#BEBFC6" strokeWidth="4"/>
              <circle 
                className="preview-progress-icon--progress" 
                cx="26" 
                cy="26" 
                r="20" 
                fill="none" 
                stroke="#d23b42"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${progress * 1.256} 125.6`}
                transform="rotate(-90 26 26)"
              />
            </svg>
          </div>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
            Loading {Math.round(progress)}%
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            {progress < 85 ? 'Preparing semester file...' : 'Opening preview...'}
          </p>
          <p style={{ margin: "10px 0 0 0", color: "#888", fontSize: "14px" }}>
            {progress >= 100 ? 'Almost ready!' : 'Please wait...'}
          </p>
        </div>
      </div>
    </div>
  );
};

const SemesterFilePreviewFailedAlert = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: '#d23b42' }}>
          Preview Failed !
        </div>
        <div className="achievement-popup-body">
          <div className="preview-error-icon-container">
            <svg className="preview-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="preview-error-icon--circle" cx="26" cy="26" r="25" fill="#B84349"/>
              <path className="preview-error-icon--cross" fill="white" d="M16 16l20 20M36 16L16 36" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
            Preview Failed !
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            Unable to preview the semester file.<br />
            Please try downloading it instead.
          </p>
        </div>
        <div className="achievement-popup-footer">
          <button onClick={onClose} className="achievement-popup-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const SemesterFileDownloadProgressAlert = ({ isOpen, progress = 25 }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: '#d23b42' }}>
          Downloading...
        </div>
        <div className="achievement-popup-body">
          <div className="download-progress-icon-container">
            <svg className="download-progress-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="download-progress-icon--bg" cx="26" cy="26" r="20" fill="none" stroke="#BEBFC6" strokeWidth="4"/>
              <circle 
                className="download-progress-icon--progress" 
                cx="26" 
                cy="26" 
                r="20" 
                fill="none" 
                stroke="#d23b42"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${progress * 1.256} 125.6`}
                transform="rotate(-90 26 26)"
              />
            </svg>
          </div>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
            Downloading {Math.round(progress)}%
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            {progress < 85 ? 'Preparing semester file for download...' : 'Finalizing download...'}
          </p>
          <p style={{ margin: "10px 0 0 0", color: "#888", fontSize: "14px" }}>
            {progress >= 100 ? 'Almost ready!' : 'Please wait...'}
          </p>
        </div>
      </div>
    </div>
  );
};

const SemesterFileDownloadSuccessAlert = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: '#d23b42' }}>
          Downloaded !
        </div>
        <div className="achievement-popup-body">
          <svg className="download-success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className="download-success-icon--circle" cx="26" cy="26" r="25" fill="none"/>
            <path className="download-success-icon--check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
          </svg>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
             Sem File Downloaded ✓
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            The semester file has been successfully
            <br />
            downloaded as PDF to your device.
          </p>
        </div>
        <div className="achievement-popup-footer">
          <button onClick={onClose} className="achievement-popup-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const SemesterFileDownloadFailedAlert = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="alert-overlay">
      <div className="achievement-popup-container">
        <div className="achievement-popup-header" style={{ backgroundColor: '#d23b42' }}>
          Download Failed !
        </div>
        <div className="achievement-popup-body">
          <div className="download-error-icon-container">
            <svg className="download-error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className="download-error-icon--circle" cx="26" cy="26" r="25" fill="#B84349"/>
              <path className="download-error-icon--cross" fill="white" d="M16 16l20 20M36 16L16 36" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "24px", color: "#000", fontWeight: "700" }}>
            Download Failed !
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "16px" }}>
            Unable to download the semester file.<br />
            Please try again or contact support.
          </p>
        </div>
        <div className="achievement-popup-footer">
          <button onClick={onClose} className="achievement-popup-close-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CooSemesterHistory;
