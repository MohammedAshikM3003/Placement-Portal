import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../utils/apiConfig';
import Sanavbar from '../components/Navbar/sanavbar.js';
import Sasidebar from '../components/Sidebar/sasidebar.js';
import styles from './sastupage.module.css';

const getInitials = (value) => {
  const text = (value || '').trim();
  if (!text) return 'S';
  const parts = text.split(/\s+/).filter(Boolean);
  return parts.length > 1
    ? `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase()
    : text.slice(0, 2).toUpperCase();
};

const normalizeStudent = (student) => {
  const name = [student.firstName, student.lastName].filter(Boolean).join(' ').trim()
    || student.fullName
    || student.name
    || student.regNo
    || 'Student';

  const subtitleParts = [student.department, student.branch, student.batch || student.year, student.currentYear]
    .filter(Boolean)
    .map((value) => String(value).trim());

  return {
    id: student._id || student.id || student.regNo || name,
    initials: getInitials(name),
    name,
    subtitle: subtitleParts.join(' • '),
    tone: ['neutral', 'blue', 'rose', 'mint'][Math.abs(String(student.regNo || name).length) % 4],
    regNo: student.regNo || '',
    department: student.department || '',
    branch: student.branch || '',
    batch: student.batch || student.year || '',
    // Keep original full student object for admin-side operations (e.g. dob lookup)
    raw: student
  };
};

const STUDENT_CACHE_KEY = 'sastuPageStudentsCache_v1';

function SastuPage({ onLogout, onViewChange }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    query: '',
    branch: '',
    batch: '',
  });

  useEffect(() => {
    const handleCloseSidebar = () => setIsSidebarOpen(false);
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, []);

  useEffect(() => {
    const abortController = new AbortController();

    const loadStudents = async () => {
      try {
        setLoading(true);
        setError('');

        const cachedStudents = sessionStorage.getItem(STUDENT_CACHE_KEY);
        if (cachedStudents) {
          const parsedStudents = JSON.parse(cachedStudents);
          if (Array.isArray(parsedStudents)) {
            setStudents(parsedStudents);
            return;
          }
        }

        const authToken = localStorage.getItem('authToken');
        const url = new URL(`${API_BASE_URL}/students`);
        url.searchParams.set('all', 'true');
        url.searchParams.set('includeArchived', 'true');

        const response = await fetch(url.toString(), {
          signal: abortController.signal,
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        });

        if (!response.ok) {
          throw new Error(`Failed to load students (${response.status})`);
        }

        const result = await response.json();
        const nextStudents = Array.isArray(result.students) ? result.students : [];
        setStudents(nextStudents);
        sessionStorage.setItem(STUDENT_CACHE_KEY, JSON.stringify(nextStudents));
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setError('Unable to load students from the database.');
          setStudents([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadStudents();

    return () => abortController.abort();
  }, []);

  const studentCards = useMemo(
    () => students.map(normalizeStudent),
    [students]
  );

  const filteredRows = useMemo(() => {
    const textQuery = filters.query.trim().toLowerCase();
    const branchQuery = filters.branch.trim().toLowerCase();
    const batchQuery = filters.batch.trim().toLowerCase();

    return studentCards.filter((row) => {
      const rowBranch = (row.branch || row.department || '').toString().trim().toLowerCase();
      const rowBatch = (row.batch || '').toString().trim().toLowerCase();
      const haystack = `${row.name} ${row.subtitle} ${row.regNo} ${row.department} ${row.branch} ${row.batch}`.toLowerCase();
      return (
        (!textQuery || haystack.includes(textQuery)) &&
        (!branchQuery || rowBranch === branchQuery) &&
        (!batchQuery || rowBatch === batchQuery)
      );
    });
  }, [filters, studentCards]);

  const branchOptions = useMemo(() => (
    Array.from(
      new Set(
        studentCards
          .map((student) => (student.branch || student.department || '').toString().trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b))
  ), [studentCards]);

  const batchOptions = useMemo(() => (
    Array.from(
      new Set(
        studentCards
          .map((student) => (student.batch || '').toString().trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  ), [studentCards]);

  const statCards = useMemo(() => {
    const branches = new Set(
      studentCards
        .map((student) => (student.branch || student.department || '').toString().trim())
        .filter(Boolean)
    );
    return [
      { label: 'Students Loaded', value: String(studentCards.length), accent: 'one' },
      { label: 'Branches', value: String(branches.size || 0), accent: 'two' },
    ];
  }, [studentCards]);

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
        currentView="sastu-page"
      />

      {isSidebarOpen ? <button type="button" className={styles.backdrop} onClick={() => setIsSidebarOpen(false)} aria-label="Close sidebar" /> : null}

      <main className={`${styles.main} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <section className={styles.heroRow}>
          <div className={styles.filterCard}>
            <div className={styles.filterPill}>Filter &amp; Sort</div>

            <div className={styles.filterGrid}>
              <label className={`${styles.field} ${styles.fieldWide}`}>
                <span className={styles.srOnly}>Student Name / Reg No</span>
                <input
                  type="text"
                  value={filters.query}
                  onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
                  placeholder="Student Name / Reg No"
                />
              </label>

              <label className={styles.field}>
                <span className={styles.srOnly}>Branch</span>
                <select
                  value={filters.branch}
                  onChange={(event) => setFilters((prev) => ({ ...prev, branch: event.target.value }))}
                >
                  <option value="">Branch</option>
                  {branchOptions.map((branch) => (
                    <option key={branch} value={branch}>{branch}</option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.srOnly}>Batch</span>
                <select
                  value={filters.batch}
                  onChange={(event) => setFilters((prev) => ({ ...prev, batch: event.target.value }))}
                >
                  <option value="">Batch</option>
                  {batchOptions.map((batch) => (
                    <option key={batch} value={batch}>{batch}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.filterActions}>
              <button
                type="button"
                className={styles.primaryAction}
                onClick={() => setFilters({ query: '', branch: '', batch: '' })}
              >
                Clear
              </button>
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
          {loading ? <article className={styles.studentCard}><div className={styles.studentText}><h3>Loading students...</h3></div></article> : null}
          {!loading && error ? <article className={styles.studentCard}><div className={styles.studentText}><h3>{error}</h3></div></article> : null}
          {!loading && !error && filteredRows.length === 0 ? <article className={styles.studentCard}><div className={styles.studentText}><h3>No students found</h3></div></article> : null}
          {!loading && !error && filteredRows.map((student) => (
            <article key={student.id} className={styles.studentCard}>
              <div className={styles.studentMeta}>
                <div className={`${styles.avatar} ${styles[student.tone]}`}>{student.initials}</div>
                <div className={styles.studentText}>
                  <h3>{student.name}</h3>
                  {student.subtitle ? <p>{student.subtitle}</p> : null}
                </div>
              </div>

              <button
                type="button"
                className={styles.loginButton}
                onClick={async () => {
                  try {
                    const raw = student.raw || {};
                    const regNo = raw.regNo || student.regNo;
                    const dob = raw.dob || raw.DOB || raw.dateOfBirth || '';

                    if (!regNo) {
                      alert('Student registration number is missing. Cannot open profile.');
                      return;
                    }

                    if (!dob) {
                      // If DOB is missing, ask the admin to confirm.
                      const supplied = window.prompt('Student DOB is required to login as the student. Please enter DOB (YYYY-MM-DD):', '');
                      if (!supplied) return;
                      // attempt login with supplied dob
                      const loginResult = await auth.login(regNo, supplied);
                      if (loginResult && loginResult.success) {
                        navigate('/dashboard');
                      } else {
                        alert(loginResult.error || 'Login failed');
                      }
                      return;
                    }

                    const result = await auth.login(regNo, dob);
                    if (result && result.success) {
                      navigate('/dashboard');
                    } else {
                      alert(result.error || 'Login failed');
                    }
                  } catch (err) {
                    console.error(err);
                    alert('Unable to open profile: ' + (err?.message || 'Unknown error'));
                  }
                }}
              >Open Profile</button>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

export default SastuPage;