import React, { useState, useEffect } from 'react';
import styles from './MarksheetDisplay.module.css';
import { joinApiUrl } from '../../utils/apiConfig';

/**
 * Marksheet Display Component
 * ─────────────────────────────────────────────────────────
 * Displays student marksheets fetched from database
 * Shows semester-wise marks, grades, GPA, and arrear status
 */

const MarksheetDisplay = ({ studentId, semester = null, showAllSemesters = true }) => {
  const [marksheets, setMarksheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(semester);

  useEffect(() => {
    if (!studentId) {
      setError('Student ID is required');
      setLoading(false);
      return;
    }

    fetchMarksheets();
  }, [studentId, semester]);

  const fetchMarksheets = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('authToken') || localStorage.getItem('token');
      const endpoint = semester
        ? joinApiUrl(`/marksheets/semester/${studentId}/${semester}`)
        : joinApiUrl(`/marksheets/student/${studentId}`);

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : undefined
        },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 404) {
          setMarksheets([]);
          return;
        }
        throw new Error('Failed to fetch marksheets');
      }

      const data = await response.json();
      
      if (data.marksheet) {
        setMarksheets([data.marksheet]);
        setSelectedSemester(data.marksheet.semester);
      } else if (data.marksheets) {
        setMarksheets(data.marksheets);
      }
    } catch (err) {
      console.error('Error fetching marksheets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading marksheets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Error: {error}</div>
      </div>
    );
  }

  if (!marksheets || marksheets.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.noData}>No marksheets available</div>
      </div>
    );
  }

  // Display single semester or all semesters
  const displayMarksheets = selectedSemester && showAllSemesters
    ? marksheets.filter(m => m.semester === selectedSemester)
    : marksheets;

  return (
    <div className={styles.container}>
      {/* Semester Tabs */}
      {showAllSemesters && marksheets.length > 1 && (
        <div className={styles.semesterTabs}>
          {marksheets.map((marksheet) => (
            <button
              key={marksheet._id}
              className={`${styles.tab} ${selectedSemester === marksheet.semester ? styles.active : ''}`}
              onClick={() => setSelectedSemester(marksheet.semester)}
            >
              Sem {marksheet.semester}
            </button>
          ))}
        </div>
      )}

      {/* Marksheets */}
      {displayMarksheets.map((marksheet) => (
        <div key={marksheet._id} className={styles.marksheetCard}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerInfo}>
              <h3 className={styles.title}>Semester {marksheet.semester}</h3>
              {marksheet.examDate && (
                <p className={styles.examDate}>{marksheet.examDate}</p>
              )}
              {marksheet.programme && (
                <p className={styles.programme}>{marksheet.programme}</p>
              )}
            </div>
            <div className={styles.stats}>
              {marksheet.sgpa !== null && (
                <div className={styles.stat}>
                  <span className={styles.statLabel}>SGPA</span>
                  <span className={styles.statValue}>{marksheet.sgpa}</span>
                </div>
              )}
              {marksheet.cgpa !== null && (
                <div className={styles.stat}>
                  <span className={styles.statLabel}>CGPA</span>
                  <span className={styles.statValue}>{marksheet.cgpa}</span>
                </div>
              )}
              {marksheet.arrearCount > 0 && (
                <div className={`${styles.stat} ${styles.statWarning}`}>
                  <span className={styles.statLabel}>Arears</span>
                  <span className={styles.statValue}>{marksheet.arrearCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Subjects Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Subject Name</th>
                  <th>Credits</th>
                  <th>Grade</th>
                  <th>Result</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {marksheet.subjects && marksheet.subjects.map((subject, idx) => (
                  <tr
                    key={idx}
                    className={`${styles.tableRow} ${
                      subject.result === 'F' ? styles.fail : ''
                    } ${subject.isArrear && !subject.clearedInSemester ? styles.arrear : ''}`}
                  >
                    <td className={styles.code}>{subject.courseCode}</td>
                    <td className={styles.name}>{subject.courseName}</td>
                    <td className={styles.credits}>{subject.credits}</td>
                    <td className={styles.grade}>
                      <span className={`${styles.gradeBadge} ${styles[`grade${subject.grade?.replace('+', 'Plus')}` ] || ''}`}>
                        {subject.grade}
                      </span>
                    </td>
                    <td className={styles.result}>
                      <span className={`${styles.resultBadge} ${subject.result === 'P' ? styles.pass : styles.fail}`}>
                        {subject.result === 'P' ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                    <td className={styles.status}>
                      {subject.isArrear && !subject.clearedInSemester && (
                        <span className={styles.arrearBadge}>Arrear</span>
                      )}
                      {subject.clearedInSemester && (
                        <span className={styles.clearedBadge}>
                          Cleared S{subject.clearedInSemester}
                        </span>
                      )}
                      {!subject.isArrear && (
                        <span className={styles.completedBadge}>Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Stats */}
          <div className={styles.footer}>
            <div className={styles.footerStat}>
              <span>Total Credits: </span>
              <strong>{marksheet.totalCredits || 0}</strong>
            </div>
            <div className={styles.footerStat}>
              <span>Credits Earned: </span>
              <strong className={styles.earned}>{marksheet.creditsEarned || 0}</strong>
            </div>
            {marksheet.arrearCount > 0 && (
              <div className={`${styles.footerStat} ${styles.warning}`}>
                <span>Pending Arrears: </span>
                <strong>{marksheet.arrearCount}</strong>
              </div>
            )}
            {marksheet.uploadedAt && (
              <div className={styles.uploadedInfo}>
                Uploaded: {new Date(marksheet.uploadedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MarksheetDisplay;
