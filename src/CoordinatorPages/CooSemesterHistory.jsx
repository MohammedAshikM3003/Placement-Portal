import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useCoordinatorAuth from '../utils/useCoordinatorAuth';
import Navbar from "../components/Navbar/Conavbar.js";
import Sidebar from "../components/Sidebar/Cosidebar.js";
import { API_BASE_URL } from '../utils/apiConfig';
import styles from './CooSemesterHistory.module.css';
import Adminicon from "../assets/Adminicon.png";

const WarningIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

function CooSemesterHistory({ onLogout, onViewChange }) {
  useCoordinatorAuth();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
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

  const handleOpenDelete = (upload) => {
    setSelectedUpload(upload);
    setShowDeletePopup(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUpload) return;
    setIsDeleting(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/semester-history/${selectedUpload.uploadId}`, {
        method: 'DELETE',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });

      if (!response.ok) {
        throw new Error('Failed to delete upload record');
      }

      setShowDeletePopup(false);
      setSelectedUpload(null);
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
          <div className={styles['history-header']}>
            <h1 className={styles['history-title']}>Semester Upload History</h1>
            <button 
              type="button" 
              className={styles['back-btn']} 
              onClick={() => navigate('/coo-manage-students-semester')}
            >
              Back to Upload
            </button>
          </div>

          {error && <div style={{ color: 'red', fontWeight: 'bold' }}>{error}</div>}

          <div className={styles['history-card']}>
            <div className={styles['table-wrap']}>
              {isLoading ? (
                <div className={styles['empty-state']}>Loading upload history...</div>
              ) : historyList.length === 0 ? (
                <div className={styles['empty-state']}>No upload history records found.</div>
              ) : (
                <table className={styles['history-table']}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>File Name</th>
                      <th>Year</th>
                      <th>Sem</th>
                      <th>Students</th>
                      <th>Subjects</th>
                      <th>View</th>
                      <th>Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyList.map((item) => {
                      const dateObj = new Date(item.uploadedAt);
                      const dateStr = dateObj.toLocaleDateString();
                      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      return (
                        <tr key={item._id || item.uploadId}>
                          <td>{dateStr}</td>
                          <td>{timeStr}</td>
                          <td style={{ fontWeight: '600' }}>{item.fileName}</td>
                          <td>{item.year}</td>
                          <td>{item.semester}</td>
                          <td>{item.uploadedStudentCount || 0}</td>
                          <td>{item.uploadedSubjectCount || 0}</td>
                          <td>
                            <button 
                              type="button" 
                              className={`${styles['action-icon-btn']} ${styles['view-btn']}`}
                              onClick={() => handleView(item)}
                              aria-label="View details"
                            >
                              <EyeIcon />
                            </button>
                          </td>
                          <td>
                            <button 
                              type="button" 
                              className={`${styles['action-icon-btn']} ${styles['delete-btn']}`}
                              onClick={() => handleOpenDelete(item)}
                              aria-label="Delete upload record"
                            >
                              <TrashIcon />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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
            <div className={styles['ms-popup-header']}>Warning!</div>
            <div className={styles['ms-popup-body']}>
              <div className={styles['warning-icon-wrapper']}>
                <WarningIcon />
              </div>
              <h2 className={styles['ms-status-title']}>Are you sure?</h2>
              <p className={styles['ms-status-text']}>
                Deleting this upload will permanently remove:
              </p>
              <ul className={styles['bullet-list']}>
                <li>• Uploaded PDF</li>
                <li>• Semester records</li>
                <li>• Extracted subjects</li>
                <li>• Student semester data</li>
                <li>• Semester notifications</li>
              </ul>
              <p style={{ color: '#d73d3d', fontSize: '0.9rem', fontWeight: '700', marginTop: '10px' }}>
                This action cannot be undone.
              </p>
            </div>
            <div className={styles['ms-popup-footer']}>
              <button 
                type="button" 
                onClick={() => setShowDeletePopup(false)} 
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
    </>
  );
}

export default CooSemesterHistory;
