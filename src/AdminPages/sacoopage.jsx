import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../utils/apiConfig';
import Sanavbar from '../components/Navbar/sanavbar.js';
import Sasidebar from '../components/Sidebar/sasidebar.js';
import styles from './sacoopage.module.css';

const getInitials = (value) => {
  const text = (value || '').trim();
  if (!text) return 'C';
  const parts = text.split(/\s+/).filter(Boolean);
  return parts.length > 1
    ? `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
    : text.slice(0, 2).toUpperCase();
};

const normalizeCoordinator = (coordinator) => {
  const name = [coordinator.firstName, coordinator.lastName].filter(Boolean).join(' ').trim()
    || coordinator.fullName
    || coordinator.username
    || coordinator.coordinatorId
    || 'Coordinator';

  const subtitleParts = [coordinator.department, coordinator.branch, coordinator.staffId, coordinator.domainEmail]
    .filter(Boolean)
    .map((value) => String(value).trim());

  return {
    id: coordinator._id || coordinator.id || coordinator.coordinatorId || name,
    initials: getInitials(name),
    name,
    subtitle: subtitleParts.join(' • '),
    tone: ['neutral', 'blue', 'rose', 'mint'][Math.abs(String(coordinator.coordinatorId || name).length) % 4],
    coordinatorId: coordinator.coordinatorId || '',
    department: coordinator.department || '',
    branch: coordinator.branch || '',
    staffId: coordinator.staffId || '',
    username: coordinator.username || '',
    isBlocked: Boolean(coordinator.isBlocked),
    raw: coordinator
  };
};

function SaCooPage({ onLogout }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [coordinators, setCoordinators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    name: '',
    department: '',
    coordinatorId: '',
    branch: '',
  });

  useEffect(() => {
    const handleCloseSidebar = () => setIsSidebarOpen(false);
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    const loadCoordinators = async () => {
      try {
        setLoading(true);
        setError('');

        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/coordinators`, {
          signal: abortController.signal,
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        });

        if (!response.ok) {
          throw new Error(`Failed to load coordinators (${response.status})`);
        }

        const result = await response.json();
        setCoordinators(Array.isArray(result.coordinators) ? result.coordinators : []);
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setError('Unable to load coordinators from the database.');
          setCoordinators([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadCoordinators();

    return () => abortController.abort();
  }, []);

  const coordinatorCards = useMemo(
    () => coordinators.map(normalizeCoordinator),
    [coordinators]
  );

  const filteredRows = useMemo(() => {
    const nameQuery = filters.name.trim().toLowerCase();
    const departmentQuery = filters.department.trim().toLowerCase();
    const coordinatorIdQuery = filters.coordinatorId.trim().toLowerCase();
    const branchQuery = filters.branch.trim().toLowerCase();

    return coordinatorCards.filter((row) => {
      const haystack = `${row.name} ${row.subtitle} ${row.coordinatorId} ${row.department} ${row.branch} ${row.staffId} ${row.username}`.toLowerCase();
      return (
        (!nameQuery || haystack.includes(nameQuery)) &&
        (!departmentQuery || haystack.includes(departmentQuery)) &&
        (!coordinatorIdQuery || haystack.includes(coordinatorIdQuery)) &&
        (!branchQuery || haystack.includes(branchQuery))
      );
    });
  }, [filters, coordinatorCards]);

  const statCards = useMemo(() => {
    const blockedCount = coordinatorCards.filter((coordinator) => coordinator.isBlocked).length;
    return [
      { label: 'Coordinators Loaded', value: String(coordinatorCards.length), accent: 'one' },
      { label: 'Blocked', value: String(blockedCount), accent: 'two' },
    ];
  }, [coordinatorCards]);

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
        currentView="sacoo-page"
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
            <div className={styles.filterPill}>Coordinator Filter</div>

            <div className={styles.filterGrid}>
              <label className={styles.field}>
                <span className={styles.srOnly}>Coordinator Name</span>
                <input
                  type="text"
                  value={filters.name}
                  onChange={(event) => setFilters((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Coordinator Name"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.srOnly}>Department</span>
                <select
                  value={filters.department}
                  onChange={(event) => setFilters((prev) => ({ ...prev, department: event.target.value }))}
                >
                  <option value="">Department</option>
                  <option value="CSE">CSE</option>
                  <option value="ECE">ECE</option>
                  <option value="MECH">MECH</option>
                  <option value="EEE">EEE</option>
                  <option value="IT">IT</option>
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.srOnly}>Coordinator ID</span>
                <input
                  type="text"
                  value={filters.coordinatorId}
                  onChange={(event) => setFilters((prev) => ({ ...prev, coordinatorId: event.target.value }))}
                  placeholder="Coordinator ID"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.srOnly}>Branch</span>
                <input
                  value={filters.branch}
                  onChange={(event) => setFilters((prev) => ({ ...prev, branch: event.target.value }))}
                  placeholder="Branch"
                />
              </label>
            </div>

            <div className={styles.filterActions}>
              <button type="button" className={styles.primaryAction}>View Coordinators</button>
              <button type="button" className={styles.secondaryAction}>Blocked</button>
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
          {loading ? <article className={styles.studentCard}><div className={styles.studentText}><h3>Loading coordinators...</h3></div></article> : null}
          {!loading && error ? <article className={styles.studentCard}><div className={styles.studentText}><h3>{error}</h3></div></article> : null}
          {!loading && !error && filteredRows.length === 0 ? <article className={styles.studentCard}><div className={styles.studentText}><h3>No coordinators found</h3></div></article> : null}
          {!loading && !error && filteredRows.map((coordinator) => (
            <article key={coordinator.id} className={styles.studentCard}>
              <div className={styles.studentMeta}>
                <div className={`${styles.avatar} ${styles[coordinator.tone]}`}>{coordinator.initials}</div>
                <div className={styles.studentText}>
                  <h3>{coordinator.name}</h3>
                  {coordinator.subtitle ? <p>{coordinator.subtitle}</p> : null}
                  <button
                    type="button"
                    className={styles.loginButton}
                    onClick={async () => {
                      try {
                        const identifier = coordinator.coordinatorId || coordinator.username || '';
                        const raw = coordinator.raw || {};
                        const dob = raw.dob || raw.DOB || raw.dateOfBirth || '';

                        if (!identifier) {
                          alert('Coordinator ID is missing. Cannot open profile.');
                          return;
                        }

                        if (!dob) {
                          const supplied = window.prompt('Coordinator DOB is required to login as the coordinator. Please enter DOB (YYYY-MM-DD or DDMMYYYY):', '');
                          if (!supplied) return;
                          const loginResult = await auth.login(identifier, supplied);
                          if (loginResult && loginResult.success) {
                            navigate('/coo-dashboard');
                          } else {
                            alert(loginResult.error || 'Login failed');
                          }
                          return;
                        }

                        const result = await auth.login(identifier, dob);
                        if (result && result.success) {
                          navigate('/coo-dashboard');
                        } else {
                          alert(result.error || 'Login failed');
                        }
                      } catch (err) {
                        console.error('Coordinator login failed', err);
                        alert('Unable to open coordinator dashboard: ' + (err?.message || 'Unknown error'));
                      }
                    }}
                  >
                    Open Profile
                  </button>
                </div>

              </div> {/* close studentMeta */}
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

export default SaCooPage;