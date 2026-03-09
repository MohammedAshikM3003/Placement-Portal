import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdNavbar from '../components/Navbar/Adnavbar';
import AdSidebar from '../components/Sidebar/Adsidebar';
import styles from './Admin_Schedule_Training.module.css';

const AdminScheduleTraining = ({ onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [company, setCompany] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [batches, setBatches] = useState([]);

  useEffect(() => {
    const handleCloseSidebar = () => setIsSidebarOpen(false);
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((v) => !v);
  };

  const handleAddBatch = () => {
    setBatches((prev) => [...prev, `Batch ${prev.length + 1}`]);
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
    setBatches(['']);
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
                  {batch}
                </button>
              ))}
              <button type="button" className={styles.addBtn} onClick={handleAddBatch}>
                <span className={styles.addIcon}>+</span> Click to Add Batch
              </button>
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.discardBtn} onClick={handleDiscard}>Discard</button>
          <button type="button" className={styles.saveBtn} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default AdminScheduleTraining;
