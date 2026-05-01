import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdNavbar from '../components/Navbar/Adnavbar.js';
import AdSidebar from '../components/Sidebar/Adsidebar.js';
import styles from './Admin_Training.module.css';
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

const DeleteConfirmationPopup = ({ onClose, onConfirm, cardName, isDeleting }) => (
  <div className={styles['ad-tr-popup-overlay']}>
    <div className={styles['ad-tr-popup-container']}>
      <div className={styles['ad-tr-popup-header']}>Delete Training</div>
      <div className={styles['ad-tr-popup-body']}>
        <div className={styles['ad-tr-warning-icon']}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className={styles['ad-tr-warning-icon--circle']} cx="26" cy="26" r="25" fill="none" />
            <path className={styles['ad-tr-warning-icon--exclamation']} d="M26 16v12M26 34v2" stroke="#ffffff" strokeWidth="3" fill="none" />
          </svg>
        </div>
        <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#333', fontWeight: 600 }}>Are you sure?</h2>
        <p style={{ margin: 0, color: '#888', fontSize: 16 }}>
          Permanently delete training for <strong>{cardName}</strong>? This action cannot be undone.
        </p>
      </div>
      <div className={styles['ad-tr-popup-footer']}>
        <button onClick={onClose} className={styles['ad-tr-popup-cancel-btn']} disabled={isDeleting}>Cancel</button>
        <button onClick={onConfirm} className={styles['ad-tr-popup-delete-btn']} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete'}</button>
      </div>
    </div>
  </div>
);

const DeleteSuccessPopup = ({ onClose }) => (
  <div className={styles['ad-tr-popup-overlay']}>
    <div className={styles['ad-tr-popup-container']}>
      <div className={styles['ad-tr-popup-header']}>Deleted !</div>
      <div className={styles['ad-tr-popup-body']}>
        <div className={styles['ad-tr-icon-wrapper']}>
          <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </div>
        <h2 style={{ margin: '1rem 0 0.5rem 0', fontSize: 24, color: '#000', fontWeight: 700 }}>Training Deleted ✓</h2>
        <p style={{ margin: 0, color: '#888', fontSize: 16 }}>The training has been permanently deleted!</p>
      </div>
      <div className={styles['ad-tr-popup-footer']}>
        <button onClick={onClose} className={styles['ad-tr-popup-close-btn']}>Close</button>
      </div>
    </div>
  </div>
);

function AdminTrainingsArchive({ onLogout }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [archivedCards, setArchivedCards] = useState([]);
  const [openCardMenuId, setOpenCardMenuId] = useState('');

  const [activePopup, setActivePopup] = useState(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [cardToDelete, setCardToDelete] = useState(null);

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
    setArchivedCards(readArchivedTrainings());
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
        <DeleteConfirmationPopup onClose={closePopup} onConfirm={confirmDelete} cardName={cardToDelete?.companyName || ''} isDeleting={deleteInProgress} />
      )}
      {activePopup === 'deleteSuccess' && <DeleteSuccessPopup onClose={closePopup} />}

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
