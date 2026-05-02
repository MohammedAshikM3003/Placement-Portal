import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sanavbar from '../components/Navbar/sanavbar.js';
import Sasidebar from '../components/Sidebar/sasidebar.js';
import styles from './sastupage.module.css';

const studentRows = [
  { initials: 'W', name: 'Student - 1', subtitle: '', tone: 'neutral' },
  { initials: 'T', name: 'Student - 2', subtitle: 'Computer Science Engineer', tone: 'blue' },
  { initials: 'H', name: 'Student - 3', subtitle: 'Computer Design Engineer', tone: 'rose' },
  { initials: 'I', name: 'Infosys', subtitle: 'System Engineer', tone: 'mint' },
];

const statCards = [
  { label: 'Accepted', value: '128', accent: 'one' },
  { label: 'Pending', value: '42', accent: 'two' },
];

function SastuPage({ onLogout, onViewChange }) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filters, setFilters] = useState({
    name: '',
    department: '',
    regno: '',
    batch: '',
  });

  useEffect(() => {
    const handleCloseSidebar = () => setIsSidebarOpen(false);
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, []);

  const filteredRows = useMemo(() => {
    const nameQuery = filters.name.trim().toLowerCase();
    const departmentQuery = filters.department.trim().toLowerCase();
    const regnoQuery = filters.regno.trim().toLowerCase();
    const batchQuery = filters.batch.trim().toLowerCase();

    return studentRows.filter((row) => {
      const haystack = `${row.name} ${row.subtitle}`.toLowerCase();
      return (
        (!nameQuery || haystack.includes(nameQuery)) &&
        (!departmentQuery || haystack.includes(departmentQuery)) &&
        (!regnoQuery || haystack.includes(regnoQuery)) &&
        (!batchQuery || haystack.includes(batchQuery))
      );
    });
  }, [filters]);

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
      return;
    }
    navigate('/');
  };

  return (
    <div className={styles.pageShell}>
      <Sanavbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
      <Sasidebar isOpen={isSidebarOpen} onLogout={handleLogout} onViewChange={onViewChange} />

      {isSidebarOpen ? <button type="button" className={styles.backdrop} onClick={() => setIsSidebarOpen(false)} aria-label="Close sidebar" /> : null}

      <main className={`${styles.main} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <section className={styles.heroRow}>
          <div className={styles.filterCard}>
            <div className={styles.filterPill}>Filter &amp; Sort</div>

            <div className={styles.filterGrid}>
              <label className={styles.field}>
                <span className={styles.srOnly}>Name</span>
                <input
                  type="text"
                  value={filters.name}
                  onChange={(event) => setFilters((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Name"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.srOnly}>Department</span>
                <select
                  value={filters.department}
                  onChange={(event) => setFilters((prev) => ({ ...prev, department: event.target.value }))}
                >
                  <option value="">Department</option>
                  <option value="computer science">Computer Science</option>
                  <option value="electrical">Electrical</option>
                  <option value="mechanical">Mechanical</option>
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.srOnly}>Regno</span>
                <input
                  type="text"
                  value={filters.regno}
                  onChange={(event) => setFilters((prev) => ({ ...prev, regno: event.target.value }))}
                  placeholder="Regno"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.srOnly}>Batch</span>
                <select
                  value={filters.batch}
                  onChange={(event) => setFilters((prev) => ({ ...prev, batch: event.target.value }))}
                >
                  <option value="">Batch</option>
                  <option value="2021">2021</option>
                  <option value="2022">2022</option>
                  <option value="2023">2023</option>
                </select>
              </label>
            </div>

            <div className={styles.filterActions}>
              <button type="button" className={styles.primaryAction}>View Students</button>
              <button type="button" className={styles.secondaryAction}>Blocklist</button>
            </div>
          </div>

          <div className={styles.statsGrid}>
            {statCards.map((card) => (
              <article key={card.label} className={`${styles.statCard} ${styles[card.accent]}`}>
                <span className={styles.statLabel}>{card.label}</span>
                <strong className={styles.statValue}>{card.value}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.listSection}>
          {filteredRows.map((student) => (
            <article key={student.name} className={styles.studentCard}>
              <div className={styles.studentMeta}>
                <div className={`${styles.avatar} ${styles[student.tone]}`}>{student.initials}</div>
                <div className={styles.studentText}>
                  <h3>{student.name}</h3>
                  {student.subtitle ? <p>{student.subtitle}</p> : null}
                </div>
              </div>

              <button type="button" className={styles.loginButton}>Login</button>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

export default SastuPage;