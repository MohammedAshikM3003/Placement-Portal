import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdNavbar from '../components/Navbar/Adnavbar';
import AdSidebar from '../components/Sidebar/Adsidebar';
import styles from './Admin_Schedule_Training.module.css';
import Admin_BatchDetailPopup from '../components/alerts/Admin_BatchDetailPopup';

const AdminScheduleTraining = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [company, setCompany] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [phases, setPhases] = useState([]);

  const [batches, setBatches] = useState([]);
  const [isBatchPopupOpen, setIsBatchPopupOpen] = useState(false);

  useEffect(() => {
    const handleCloseSidebar = () => setIsSidebarOpen(false);
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((v) => !v);
  };

  const handleAddBatch = () => {
    setIsBatchPopupOpen(true);
  };

  const handleSaveBatch = (batchData) => {
    setBatches((prev) => [...prev, batchData]);
    setIsBatchPopupOpen(false);
  };

  const toRoman = (num) => {
    const romanMap = [
      { value: 1000, symbol: 'M' },
      { value: 900, symbol: 'CM' },
      { value: 500, symbol: 'D' },
      { value: 400, symbol: 'CD' },
      { value: 100, symbol: 'C' },
      { value: 90, symbol: 'XC' },
      { value: 50, symbol: 'L' },
      { value: 40, symbol: 'XL' },
      { value: 10, symbol: 'X' },
      { value: 9, symbol: 'IX' },
      { value: 5, symbol: 'V' },
      { value: 4, symbol: 'IV' },
      { value: 1, symbol: 'I' },
    ];

    let n = num;
    let result = '';
    for (const { value, symbol } of romanMap) {
      while (n >= value) {
        result += symbol;
        n -= value;
      }
    }
    return result;
  };

  const handleAddPhase = () => {
    const roman = toRoman(phases.length + 1);
    setPhases((prev) => [...prev, `Phase - ${roman}`]);
  };

  const handleRemovePhase = (index) => {
    setPhases((prev) => prev.filter((_, i) => i !== index));
  };

  // If you want to allow renaming batches, you can add a handler here
  // const handleBatchRename = (idx, value) => {
  //   setBatches((prev) => {
  //     const updated = [...prev];
  //     updated[idx] = value;
  //     return updated;
  //   });
  // };

  const handleDiscard = () => {
    setCompany('');
    setStartDate('');
    setEndDate('');
    setPhases([]);
    setBatches([]);
  };

  const handleSave = () => {
    alert('Schedule training saved!');
  };

  return (
    <div className={styles.page}>
      <AdNavbar onToggleSidebar={toggleSidebar} />
      <AdSidebar isOpen={isSidebarOpen} onLogout={onLogout} />

      <div className={styles.content}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Training Details</h2>
          <div className={styles.cardContent}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <select
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={styles.control}
                >
                  <option value="">Select Company</option>
                  <option value="company-1">Company - 1</option>
                  <option value="company-2">Company - 2</option>
                </select>
              </div>

              <div className={styles.formGroup}>
               
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`${styles.control} ${styles.dateControl}`}
                />
              </div>

              <div className={styles.formGroup}>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`${styles.control} ${styles.dateControl}`}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Phase Details</h2>
          <div className={styles.cardContent}>
            <div className={styles.formRow} style={{ flexWrap: 'wrap', gap: '24px' }}>
              {phases.map((phase, idx) => (
                <div key={`${phase}-${idx}`} className={styles.phaseInputWrapper}>
                  <input
                    type="text"
                    value={phase}
                    readOnly
                    className={styles.control}
                  />
                  <button
                    type="button"
                    className={styles.removePhaseBtn}
                    onClick={() => handleRemovePhase(idx)}
                    aria-label={`Remove ${phase}`}
                  >
                    ×
                  </button>
                </div>
              ))}

              <button type="button" className={styles.addBtn} onClick={handleAddPhase}>
                <span className={styles.addIcon}>+</span> Click to Add Phase
              </button>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Batch Details</h2>
          <div className={styles.cardContent}>
            <div className={styles.formRow} style={{ flexWrap: 'wrap', gap: '24px' }}>
              {batches.map((batch, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.addBtn}
                  style={{ background: '#4caf50', color: '#fff', cursor: 'pointer' }}
                  onClick={() => navigate('/admin-schedule-training-batch')}
                >
                  {batch?.batchName || `Batch ${idx + 1}`}
                </button>
              ))}
              <button type="button" className={styles.addBtn} onClick={handleAddBatch}>
                <span className={styles.addIcon}>+</span> Click to Add Batch
              </button>
            </div>
          </div>
        </div>

        <Admin_BatchDetailPopup
          isOpen={isBatchPopupOpen}
          onClose={() => setIsBatchPopupOpen(false)}
          onSave={handleSaveBatch}
        />
        <div className={styles.actions}>
          <button type="button" className={styles.discardBtn} onClick={handleDiscard}>Discard</button>
          <button type="button" className={styles.saveBtn} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default AdminScheduleTraining;