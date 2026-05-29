import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../utils/apiConfig';
import Sanavbar from '../components/Navbar/sanavbar.js';
import Sasidebar from '../components/Sidebar/sasidebar.js';
import styles from './saadpage.module.css';

const getInitials = (value) => {
  const text = (value || '').trim();
  if (!text) return 'A';
  const parts = text.split(/\s+/).filter(Boolean);
  return parts.length > 1
    ? `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
    : text.slice(0, 2).toUpperCase();
};

const normalizeAdmin = (admin) => {
  const name = [admin.firstName, admin.lastName].filter(Boolean).join(' ').trim()
    || admin.name
    || admin.adminLoginID
    || 'Admin';

  const subtitleParts = [admin.department, admin.emailId, admin.domainMailId, admin.phoneNumber]
    .filter(Boolean)
    .map((value) => String(value).trim());

  return {
    id: admin._id || admin.id || admin.adminLoginID || name,
    initials: getInitials(name),
    name,
    subtitle: subtitleParts.join(' • '),
    tone: ['neutral', 'blue', 'rose', 'mint'][Math.abs(String(admin.adminLoginID || name).length) % 4],
    adminLoginID: admin.adminLoginID || '',
    department: admin.department || '',
    isBlocked: Boolean(admin.isBlocked),
  };
};

function SaAdPage({ onLogout }) {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    name: '',
    loginId: '',
    department: '',
    status: '',
  });

  useEffect(() => {
    const handleCloseSidebar = () => setIsSidebarOpen(false);
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    const loadAdmins = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`${API_BASE_URL}/public/admins`, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load admins (${response.status})`);
        }

        const result = await response.json();
        const adminsList = Array.isArray(result.data) ? result.data : [];
        setAdmins(adminsList);
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setError('Unable to load admins from the database.');
          setAdmins([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadAdmins();

    return () => abortController.abort();
  }, []);

  const adminCards = useMemo(
    () => admins.map(normalizeAdmin),
    [admins]
  );

  const filteredRows = useMemo(() => {
    const nameQuery = filters.name.trim().toLowerCase();
    const loginIdQuery = filters.loginId.trim().toLowerCase();
    const departmentQuery = filters.department.trim().toLowerCase();
    const statusQuery = filters.status.trim().toLowerCase();

    return adminCards.filter((row) => {
      const statusValue = row.isBlocked ? 'blocked' : 'active';
      const haystack = `${row.name} ${row.subtitle} ${row.adminLoginID} ${row.department} ${statusValue}`.toLowerCase();
      return (
        (!nameQuery || haystack.includes(nameQuery)) &&
        (!loginIdQuery || haystack.includes(loginIdQuery)) &&
        (!departmentQuery || haystack.includes(departmentQuery)) &&
        (!statusQuery || haystack.includes(statusQuery))
      );
    });
  }, [filters, adminCards]);

  const statCards = useMemo(() => {
    const blockedCount = adminCards.filter((admin) => admin.isBlocked).length;
    return [
      { label: 'Admins Loaded', value: String(adminCards.length), accent: 'one' },
      { label: 'Blocked', value: String(blockedCount), accent: 'two' },
    ];
  }, [adminCards]);

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
      <Sasidebar
        isOpen={isSidebarOpen}
        onLogout={handleLogout}
        currentView="saad-page"
      />

      {isSidebarOpen ? (
        <button
          type="button"
          className={styles.backdrop}
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}

      <main className={`${styles.main} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <section className={styles.heroRow}>
          <div className={styles.filterCard}>
            <div className={styles.filterPill}>Admin Filter</div>

            <div className={styles.filterGrid}>
              <label className={styles.field}>
                <span className={styles.srOnly}>Admin Name</span>
                <input
                  type="text"
                  value={filters.name}
                  onChange={(event) => setFilters((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Admin Name"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.srOnly}>Login ID</span>
                <input
                  value={filters.loginId}
                  onChange={(event) => setFilters((prev) => ({ ...prev, loginId: event.target.value }))}
                  placeholder="Login ID"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.srOnly}>Department</span>
                <input
                  type="text"
                  value={filters.department}
                  onChange={(event) => setFilters((prev) => ({ ...prev, department: event.target.value }))}
                  placeholder="Department"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.srOnly}>Status</span>
                <select
                  value={filters.status}
                  onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option value="">Status</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                </select>
              </label>
            </div>

            <div className={styles.filterActions}>
              <button type="button" className={styles.primaryAction}>View Admins</button>
              <button type="button" className={styles.secondaryAction}>Access List</button>
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
          {loading ? <article className={styles.studentCard}><div className={styles.studentText}><h3>Loading admins...</h3></div></article> : null}
          {!loading && error ? <article className={styles.studentCard}><div className={styles.studentText}><h3>{error}</h3></div></article> : null}
          {!loading && !error && filteredRows.length === 0 ? <article className={styles.studentCard}><div className={styles.studentText}><h3>No admins found</h3></div></article> : null}
          {!loading && !error && filteredRows.map((admin) => (
            <article
              key={admin.id}
              className={styles.studentCard}
            >
              <div className={styles.studentMeta}>
                <div className={`${styles.avatar} ${styles[admin.tone]}`}>{admin.initials}</div>
                <div className={styles.studentText}>
                  <h3>{admin.name}</h3>
                  {admin.subtitle ? <p>{admin.subtitle}</p> : null}
                </div>
              </div>

              <button
                type="button"
                className={styles.loginButton}
                onClick={(event) => {
                  event.stopPropagation();
                  navigate('/saad-admin-dashboard', { replace: true });
                }}
              >
                Manage
              </button>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

export default SaAdPage;