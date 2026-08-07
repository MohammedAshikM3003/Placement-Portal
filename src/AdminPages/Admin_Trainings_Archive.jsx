import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdNavbar from '../components/Navbar/Adnavbar.js';
import AdSidebar from '../components/Sidebar/Adsidebar.js';
import styles from './Admin_Trainings_Archive.module.css';
import mongoDBService from '../services/mongoDBService';

const TRAINING_ARCHIVE_STORAGE_KEY = 'placement-portal-admin-training-archives';

const getTrainingArchiveKey = (card) => card?.archiveKey || card?.scheduleId || card?.id || card?.companyName || '';

const readArchivedTrainings = () => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(TRAINING_ARCHIVE_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((c) => ({ ...c, archiveKey: getTrainingArchiveKey(c), archivedAt: c?.archivedAt || '' }));
  } catch (e) {
    return [];
  }
};

const writeArchivedTrainings = (cards) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TRAINING_ARCHIVE_STORAGE_KEY, JSON.stringify(cards));
  } catch (e) {
    // ignore
  }
};

function AdminTrainingsArchive({ onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [archivedCards, setArchivedCards] = useState([]);
  const [openCardMenuId, setOpenCardMenuId] = useState('');
  const [activePopup, setActivePopup] = useState(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);
  const [studentCountMap, setStudentCountMap] = useState({});

  useEffect(() => {
    const handleCloseSidebar = () => setIsSidebarOpen(false);
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, []);

  useEffect(() => {
    const handleDocClick = (e) => {
      if (!e.target.closest('[data-training-card-menu="true"]')) setOpenCardMenuId('');
    };
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  useEffect(() => {
    const cards = readArchivedTrainings();
    setArchivedCards(cards);

    // Fetch batch assignments to compute student counts
    const fetchStudentCounts = async () => {
      try {
        const assignments = await mongoDBService.getScheduledTrainingBatchAssignments();
        const normalized = Array.isArray(assignments) ? assignments : [];
        const countMap = {};
        normalized.forEach((assignment) => {
          const sid = (assignment?.scheduleId || '').toString().trim();
          if (sid) {
            const count = Array.isArray(assignment?.students) ? assignment.students.length : 0;
            countMap[sid] = (countMap[sid] || 0) + count;
          }
        });
        setStudentCountMap(countMap);
      } catch (err) {
        console.error('Failed to load student counts for archive:', err);
      }
    };

    fetchStudentCounts();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

  const formatDateForDisplay = (rawDate) => {
    if (!rawDate) return '-';
    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) return '-';
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleOpenCard = (card) => {
    const companyName = (card?.companyName || '').toString().trim();
    const scheduleId = (card?.scheduleId || '').toString().trim();

    if (!companyName) {
      return;
    }

    const query = new URLSearchParams({
      mode: 'edit',
      company: companyName
    });

    if (scheduleId) {
      query.set('scheduleId', scheduleId);
    }

    navigate(`/admin-preferred-training-students?${query.toString()}`);
  };

  const handleRestoreCard = (card) => {
    const archiveKey = getTrainingArchiveKey(card);
    if (!archiveKey) return;
    const next = archivedCards.filter((c) => getTrainingArchiveKey(c) !== archiveKey);
    writeArchivedTrainings(next);
    setArchivedCards(next);
    setOpenCardMenuId('');
    navigate('/admin-training');
  };

  const handleDeleteCard = (card) => {
    if (!card) return;
    setCardToDelete(card);
    setActivePopup('deleteWarning');
    setOpenCardMenuId('');
  };

  const confirmDelete = async () => {
    if (!cardToDelete) return;
    setDeleteInProgress(true);
    try {
      if (cardToDelete.scheduleId) {
        await mongoDBService.deleteScheduledTraining(cardToDelete.scheduleId);
      }
      const archiveKey = getTrainingArchiveKey(cardToDelete);
      const next = archivedCards.filter((c) => getTrainingArchiveKey(c) !== archiveKey);
      writeArchivedTrainings(next);
      setArchivedCards(next);
      setActivePopup('deleteSuccess');
    } catch (err) {
      console.error('Failed to delete:', err);
      alert(err?.message || 'Failed to delete training.');
      setActivePopup(null);
    } finally {
      setDeleteInProgress(false);
    }
  };

  const closePopup = () => {
    setActivePopup(null);
    setCardToDelete(null);
  };

  return (
    <div className={styles['ad-tr-page']}>
      {activePopup === 'deleteWarning' && (
        <div className={styles['ad-tr-popup-overlay']}>
          <div className={styles['ad-tr-popup-container']}>
            <div className={styles['ad-tr-popup-header']}>Delete Training</div>
            <div className={styles['ad-tr-popup-body']}>
              <div className={styles['ad-tr-warning-icon']}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="55" fill="none" stroke="#ffa500" strokeWidth="2" />
                  <text x="60" y="75" textAnchor="middle" fill="#ffffff" fontSize="48" fontWeight="700" fontFamily="Arial">!</text>
                </svg>
              </div>
              <h2>Are you sure?</h2>
              <p>Permanently delete training for <strong>{cardToDelete?.companyName}</strong>? This action cannot be undone.</p>
            </div>
            <div className={styles['ad-tr-popup-footer']}>
              <button onClick={closePopup} className={styles['ad-tr-popup-cancel-btn']} disabled={deleteInProgress}>Discard</button>
              <button onClick={confirmDelete} className={styles['ad-tr-popup-delete-btn']} disabled={deleteInProgress}>
                {deleteInProgress ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {activePopup === 'deleteSuccess' && (
        <div className={styles['ad-tr-popup-overlay']}>
          <div className={styles['ad-tr-popup-container']}>
            <div className={styles['ad-tr-popup-header']}>Deleted !</div>
            <div className={styles['ad-tr-popup-body']}>
              <div className={styles['ad-tr-icon-wrapper']}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h2>Training Deleted ✓</h2>
              <p>The training has been permanently deleted!</p>
            </div>
            <div className={styles['ad-tr-popup-footer']}>
              <button onClick={closePopup} className={styles['ad-tr-popup-close-btn']}>Close</button>
            </div>
          </div>
        </div>
      )}

      <AdNavbar onToggleSidebar={toggleSidebar} />
      <AdSidebar isOpen={isSidebarOpen} onLogout={onLogout} />

      <div className={styles['ad-tr-content']}>
        <div className={styles['ad-tr-header-row']}>
          <div className={styles['ad-tr-breadcrumb']} />
        </div>

        <div className={styles['ad-tr-section-header']}>
          <div className={styles['ad-tr-section-header-title']}>Archived Trainings</div>
          <button type="button" className={styles['ad-tr-section-archive-btn']} onClick={() => navigate('/admin-training')} style={{ background: '#4EA24E' }}>
            <span>Back to Active</span>
          </button>
        </div>

        <div className={styles['ad-tr-training-grid']}>
          {archivedCards.length === 0 ? (
            <div className={styles['ad-tr-training-empty']}>No archived trainings.</div>
          ) : (
            archivedCards.map((card, index) => {
              const cardClass = index % 2 === 0 ? styles['ad-tr-training-card'] : styles['ad-tr-training-card-alt'];
              const logoClass = index % 2 === 0 ? styles['ad-tr-training-logo'] : styles['ad-tr-training-logo-alt'];

              return (
                <div
                  key={getTrainingArchiveKey(card) || `${index}`}
                  className={cardClass}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleOpenCard(card)}
                >
                  <div className={styles['ad-tr-training-card-menu']} data-training-card-menu="true">
                    <button
                      type="button"
                      className={styles['ad-tr-training-card-menu-btn']}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenCardMenuId((cur) => (cur === getTrainingArchiveKey(card) ? '' : getTrainingArchiveKey(card)));
                      }}
                      aria-label="Open card actions"
                    >
                      <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                        <circle cx="8" cy="3" r="1.4" />
                        <circle cx="8" cy="8" r="1.4" />
                        <circle cx="8" cy="13" r="1.4" />
                      </svg>
                    </button>

                    {openCardMenuId === getTrainingArchiveKey(card) && (
                      <div className={styles['ad-tr-training-card-menu-dropdown']}>
                        <button type="button" className={styles['ad-tr-training-card-menu-item']} onClick={(e) => { e.stopPropagation(); handleRestoreCard(card); }}>
                          Restore
                        </button>
                        <button type="button" className={styles['ad-tr-training-card-menu-item']} onClick={(e) => { e.stopPropagation(); handleDeleteCard(card); }}>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={logoClass}>{card.logoText || (card.companyName || 'T').charAt(0).toUpperCase()}</div>
                  <div className={styles['ad-tr-training-name']}>{card.companyName}</div>
                  <div className={styles['ad-tr-training-meta']}>Year: {card.yearText || '-'}</div>
                  <div className={styles['ad-tr-training-meta']}>Phase: {card.phaseText || '-'}</div>
                  <div className={styles['ad-tr-training-meta']}>Students: {studentCountMap[(card.scheduleId || '').toString()] || 0}</div>
                  <div className={styles['ad-tr-training-meta']}>Start Date: {formatDateForDisplay(card.startDate)}</div>
                  <div className={styles['ad-tr-training-meta']}>End Date: {formatDateForDisplay(card.endDate)}</div>
                  <div className={styles['ad-tr-training-meta']}>Duration: {card.durationText || '-'}</div>
                  {card.archivedAt && (
                    <div className={styles['ad-tr-training-meta']} style={{ fontSize: '10px', opacity: 0.7 }}>Archived: {formatDateForDisplay(card.archivedAt)}</div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminTrainingsArchive;
