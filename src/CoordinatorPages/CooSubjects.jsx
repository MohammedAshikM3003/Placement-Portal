import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useCoordinatorAuth from '../utils/useCoordinatorAuth.js';
import Navbar from '../components/Navbar/Conavbar.js';
import Sidebar from '../components/Sidebar/Cosidebar.js';
import Dropdown from '../components/common/Dropdown/Dropdown.jsx';
import Adminicon from '../assets/Adminicon.png';
import manageStudentsIcon from '../assets/Coo_ManagestudentsCardicon.svg';
import styles from './CooSubjects.module.css';
import { API_BASE_URL } from '../utils/apiConfig.js';

const YEAR_SEMESTER_MAP = {
  I: ['1', '2'],
  II: ['3', '4'],
  III: ['5', '6'],
  IV: ['7', '8']
};

const SEMESTER_YEAR_MAP = {
  '1': 'I', '2': 'I',
  '3': 'II', '4': 'II',
  '5': 'III', '6': 'III',
  '7': 'IV', '8': 'IV'
};

const ROMAN_YEAR_MAP = {
  '1': 'I',
  '2': 'II',
  '3': 'III',
  '4': 'IV'
};

const InspectIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12" />
    <path d="M7 8l5-5 5 5" />
    <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
  </svg>
);

function CooSubjects({ onLogout, onViewChange }) {
  useCoordinatorAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Route pre-filters if passed from history page
  const routeState = location.state || {};
  const initialYear = routeState.year || '';
  const initialSemester = routeState.semester ? String(routeState.semester) : '';

  // Layout states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterInputs, setFilterInputs] = useState({
    code: '',
    name: '',
    credits: '',
    year: initialYear,
    semester: initialSemester
  });
  const [codeFocused, setCodeFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  // Selections
  const [selectedSubjectIds, setSelectedSubjectIds] = useState(new Set());

  // Add / Edit Popup State
  const [popupMode, setPopupMode] = useState('none'); // 'none' | 'add' | 'edit'
  const [popupData, setPopupData] = useState({
    _id: '',
    courseCode: '',
    courseName: '',
    credits: '3',
    year: 'I',
    semester: '1'
  });
  const [popupError, setPopupError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete Popup State
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch subjects for department
  const fetchSubjects = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/subjects`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });

      if (!response.ok) {
        let errMsg = 'Failed to load subject list from database';
        try {
          const errData = await response.json();
          if (errData.details || errData.error) {
            errMsg += ` (${errData.details || errData.error})`;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      setSubjects(Array.isArray(data.subjects) ? data.subjects : []);
    } catch (err) {
      console.error('Error fetching subjects:', err);
      setError(err.message || 'Failed to fetch subjects');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Sync route filters if location state changes
  useEffect(() => {
    if (location.state?.year || location.state?.semester) {
      setFilterInputs((prev) => ({
        ...prev,
        year: location.state.year || '',
        semester: location.state.semester ? String(location.state.semester) : ''
      }));
    }
  }, [location.state]);

  // Dropdown options based on chosen year
  const semesterOptionsForPopup = useMemo(() => {
    return popupData.year ? (YEAR_SEMESTER_MAP[popupData.year] || []) : [];
  }, [popupData.year]);

  // Filtering Logic
  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const codeMatches = (subject.courseCode || '').toLowerCase().includes(filterInputs.code.toLowerCase().trim());
      const nameMatches = (subject.courseName || '').toLowerCase().includes(filterInputs.name.toLowerCase().trim());
      
      const yearMatches = !filterInputs.year || String(subject.year) === String(
        filterInputs.year === 'I' ? 1 : filterInputs.year === 'II' ? 2 : filterInputs.year === 'III' ? 3 : 4
      );
      
      const semMatches = !filterInputs.semester || String(subject.semester) === String(filterInputs.semester);
      const creditsMatches = !filterInputs.credits || String(subject.credits) === String(filterInputs.credits);

      return codeMatches && nameMatches && yearMatches && semMatches && creditsMatches;
    });
  }, [subjects, filterInputs]);

  // Selections helper
  const handleSelectRow = (id) => {
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedSubjectIds.size === filteredSubjects.length) {
      setSelectedSubjectIds(new Set());
    } else {
      setSelectedSubjectIds(new Set(filteredSubjects.map(s => s._id)));
    }
  };

  const handleClearFilters = () => {
    setFilterInputs({
      code: '',
      name: '',
      credits: '',
      year: '',
      semester: ''
    });
  };

  // Popup Triggers
  const openAddPopup = () => {
    setPopupData({
      _id: '',
      courseCode: '',
      courseName: '',
      credits: '3',
      year: 'I',
      semester: '1'
    });
    setPopupError('');
    setPopupMode('add');
  };

  const openEditPopup = () => {
    if (selectedSubjectIds.size !== 1) return;
    const selectedId = Array.from(selectedSubjectIds)[0];
    const subject = subjects.find(s => s._id === selectedId);
    if (!subject) return;

    const numericSem = subject.semester ? String(subject.semester) : '1';
    const mappedYear = SEMESTER_YEAR_MAP[numericSem] || 'I';

    setPopupData({
      _id: subject._id,
      courseCode: subject.courseCode || '',
      courseName: subject.courseName || '',
      credits: String(subject.credits ?? '3'),
      year: mappedYear,
      semester: numericSem
    });
    setPopupError('');
    setPopupMode('edit');
  };

  // Save Add/Edit
  const handleSaveSubject = async (e) => {
    e.preventDefault();
    if (!popupData.courseCode.trim() || !popupData.courseName.trim()) {
      setPopupError('Course Code and Course Name are required');
      return;
    }

    setIsSaving(true);
    setPopupError('');

    try {
      const authToken = localStorage.getItem('authToken');
      const url = popupMode === 'add' 
        ? `${API_BASE_URL}/subjects/add` 
        : `${API_BASE_URL}/subjects/${popupData._id}`;
      
      const method = popupMode === 'add' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          courseCode: popupData.courseCode.trim().toUpperCase(),
          courseName: popupData.courseName.trim(),
          credits: parseInt(popupData.credits, 10) || 0,
          semester: parseInt(popupData.semester, 10) || 1,
          year: popupData.year === 'I' ? 1 : popupData.year === 'II' ? 2 : popupData.year === 'III' ? 3 : 4
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to save subject');
      }

      setPopupMode('none');
      setSelectedSubjectIds(new Set());
      await fetchSubjects();
    } catch (err) {
      console.error(err);
      setPopupError(err.message || 'Server error saving subject');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete
  const handleDeleteSelected = async () => {
    if (selectedSubjectIds.size === 0) return;
    setIsDeleting(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/subjects`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          ids: Array.from(selectedSubjectIds)
        })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete subjects');
      }

      setShowDeletePopup(false);
      setSelectedSubjectIds(new Set());
      await fetchSubjects();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete subjects');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleViewChange = (view) => {
    if (onViewChange && typeof onViewChange === 'function') {
      onViewChange(view);
    }
    setIsSidebarOpen(false);
  };

  const isEditActive = selectedSubjectIds.size === 1;
  const isDeleteActive = selectedSubjectIds.size > 0;

  return (
    <>
      <Navbar onToggleSidebar={handleToggleSidebar} Adminicon={Adminicon} />
      <div className={styles['co-ms-layout']}>
        <Sidebar 
          isOpen={isSidebarOpen} 
          onLogout={onLogout} 
          currentView="subjects" 
          onViewChange={handleViewChange}
          onClose={() => setIsSidebarOpen(false)}
        />
        <div className={styles['semester-main-content']}>
          {/* Top Row Cards */}
          <div className={styles['co-history-top-row']}>
            
            {/* Left Card: Navigation back to history */}
            <div 
              className={styles['co-history-left-card']}
              onClick={() => navigate('/coo-semester-history')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate('/coo-semester-history');
                }
              }}
            >
              <img src={manageStudentsIcon} alt="Semester History" className={styles['co-history-left-card-image']} />
              <h4 className={styles['co-history-card-title']}>Semester Records</h4>
              <p className={styles['co-history-card-desc']}>Access and manage semester records.</p>
            </div>

            {/* Middle Card: Filter & Sort */}
            <div className={styles['co-history-filter-card']}>
              <div className={styles['co-history-filter-header-container']}>
                <div className={styles['co-history-filter-header']}>Subjects</div>
                {(filterInputs.code || filterInputs.name || filterInputs.credits || filterInputs.year || filterInputs.semester) && (
                  <button 
                    type="button" 
                    className={styles['co-history-clear-btn']} 
                    onClick={handleClearFilters}
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className={styles['co-history-filter-content']}>
                <div className={styles['co-history-input-wrapper']}>
                  <label className={styles['co-history-static-label']}>Subject Code</label>
                  <div className={`${styles['co-history-text-container']} ${codeFocused ? styles['is-focused'] : ''}`}>
                    <input 
                      type="text" 
                      placeholder="Search by Code" 
                      value={filterInputs.code} 
                      onChange={(e) => setFilterInputs(prev => ({ ...prev, code: e.target.value }))}
                      onFocus={() => setCodeFocused(true)}
                      onBlur={() => setCodeFocused(false)}
                      className={styles['co-history-text-input']}
                    />
                  </div>
                </div>

                <div className={styles['co-history-input-wrapper']}>
                  <label className={styles['co-history-static-label']}>Subject Name</label>
                  <div className={`${styles['co-history-text-container']} ${nameFocused ? styles['is-focused'] : ''}`}>
                    <input 
                      type="text" 
                      placeholder="Search by Name" 
                      value={filterInputs.name} 
                      onChange={(e) => setFilterInputs(prev => ({ ...prev, name: e.target.value }))}
                      onFocus={() => setNameFocused(true)}
                      onBlur={() => setNameFocused(false)}
                      className={styles['co-history-text-input']}
                    />
                  </div>
                </div>

                <div className={styles['co-history-input-wrapper']}>
                  <label className={styles['co-history-static-label']}>Credits</label>
                  <Dropdown
                    options={['0', '1', '2', '3', '4', '5']}
                    selectedOption={filterInputs.credits}
                    onSelect={(val) => setFilterInputs(prev => ({ ...prev, credits: val || '' }))}
                    placeholder="Select Credits"
                    role="coordinator"
                    className={styles['co-history-dropdown-wrapper']}
                    headerClassName={styles['co-history-dropdown-header']}
                  />
                </div>

                <div className={styles['co-history-input-wrapper']}>
                  <label className={styles['co-history-static-label']}>Year</label>
                  <Dropdown
                    options={['I', 'II', 'III', 'IV']}
                    selectedOption={filterInputs.year}
                    onSelect={(val) => setFilterInputs(prev => ({ ...prev, year: val || '', semester: '' }))}
                    placeholder="Select Year"
                    role="coordinator"
                    className={styles['co-history-dropdown-wrapper']}
                    headerClassName={styles['co-history-dropdown-header']}
                  />
                </div>

                <div className={styles['co-history-input-wrapper']}>
                  <label className={styles['co-history-static-label']}>Sem</label>
                  <Dropdown
                    options={filterInputs.year ? (YEAR_SEMESTER_MAP[filterInputs.year] || []) : []}
                    selectedOption={filterInputs.semester}
                    onSelect={(val) => setFilterInputs(prev => ({ ...prev, semester: val || '' }))}
                    placeholder={filterInputs.year ? "Select Sem" : "Select Year First"}
                    disabled={!filterInputs.year}
                    role="coordinator"
                    className={styles['co-history-dropdown-wrapper']}
                    headerClassName={styles['co-history-dropdown-header']}
                  />
                </div>
              </div>
            </div>

            {/* Right Cards: Add, Edit, Delete Actions */}
            <div className={styles['co-history-action-cards-section']}>
              
              {/* Add Action Card */}
              <div className={`${styles['co-history-action-card']} ${styles['card-active']}`}>
                <h4 className={styles['header-create-active']}>Create</h4>
                <p className={styles['co-history-action-description']}>Add new subject to department</p>
                <button 
                  className={`${styles['co-history-action-btn']} ${styles['co-history-create-btn']}`} 
                  onClick={openAddPopup}
                >
                  Create
                </button>
              </div>

              {/* Edit Action Card */}
              <div className={`${styles['co-history-action-card']} ${isEditActive ? styles['card-active'] : styles['card-disabled']}`}>
                <h4 className={isEditActive ? styles['header-preview-active'] : styles['header-disabled']}>Edit</h4>
                <p className={styles['co-history-action-description']}>Select one subject to edit</p>
                <button 
                  className={`${styles['co-history-action-btn']} ${styles['co-history-preview-btn']}`} 
                  onClick={openEditPopup}
                  disabled={!isEditActive}
                >
                  Edit
                </button>
              </div>

              {/* Delete Action Card */}
              <div className={`${styles['co-history-action-card']} ${isDeleteActive ? styles['card-active'] : styles['card-disabled']}`}>
                <h4 className={isDeleteActive ? styles['header-delete-active'] : styles['header-disabled']}>Delete</h4>
                <p className={styles['co-history-action-description']}>Select subjects to delete</p>
                <button 
                  className={`${styles['co-history-action-btn']} ${styles['co-history-delete-btn']}`} 
                  onClick={() => setShowDeletePopup(true)}
                  disabled={!isDeleteActive}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>

          {error && <div style={{ color: 'red', fontWeight: 'bold', margin: '5px 0' }}>{error}</div>}

          {/* Subjects Table Card */}
          <div className={styles['history-card']}>
            <h3 className={styles['history-table-title']}>DEPARTMENT SUBJECT MASTER</h3>
            <div className={styles['table-wrap']}>
              <table className={styles['history-table']}>
                <thead>
                  <tr className={styles['table-head-row']}>
                    <th className={`${styles['co-history-th']} ${styles['co-history-th-checkbox']}`}>
                      <input 
                        type="checkbox" 
                        className={styles['co-history-table-checkbox']} 
                        checked={filteredSubjects.length > 0 && selectedSubjectIds.size === filteredSubjects.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className={`${styles['co-history-th']} ${styles['co-history-th-sno']}`}>S.No</th>
                    <th className={`${styles['co-history-th']} ${styles['co-history-th-code']}`}>Subject Code</th>
                    <th className={`${styles['co-history-th']} ${styles['co-history-th-name']}`}>Subject Name</th>
                    <th className={`${styles['co-history-th']} ${styles['co-history-th-year']}`}>Year</th>
                    <th className={`${styles['co-history-th']} ${styles['co-history-th-sem']}`}>Semester</th>
                    <th className={`${styles['co-history-th']} ${styles['co-history-th-credits']}`}>Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr className={styles['loading-row']}>
                      <td colSpan="7" className={styles['loading-cell']}>
                        <div className={styles['loading-wrapper']}>
                          <div className={styles['table-spinner']}></div>
                          <span className={styles['loading-text']}>Loading subjects…</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredSubjects.length === 0 ? (
                    <tr>
                      <td colSpan="7" className={styles['empty-state']} style={{ textAlign: 'center', padding: '2rem 0' }}>
                        No subjects found.
                      </td>
                    </tr>
                  ) : (
                    filteredSubjects.map((item, index) => {
                      const isSelected = selectedSubjectIds.has(item._id);
                      return (
                        <tr 
                          key={item._id}
                          onClick={() => handleSelectRow(item._id)}
                          className={`${styles['co-history-table-row']} ${isSelected ? styles['co-history-selected-row'] : ''}`}
                        >
                          <td className={`${styles['co-history-td']} ${styles['co-history-th-checkbox']}`}>
                            <input 
                              type="checkbox" 
                              className={styles['co-history-table-checkbox']} 
                              checked={isSelected}
                              onChange={() => handleSelectRow(item._id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className={`${styles['co-history-td']} ${styles['co-history-th-sno']}`}>{index + 1}</td>
                          <td className={`${styles['co-history-td']} ${styles['co-history-th-code']}`} style={{ fontWeight: '600' }}>{item.courseCode}</td>
                          <td className={`${styles['co-history-td']} ${styles['co-history-td-name-cell']} ${styles['co-history-th-name']}`}>{item.courseName}</td>
                          <td className={`${styles['co-history-td']} ${styles['co-history-th-year']}`}>{ROMAN_YEAR_MAP[String(item.year)] || item.year || '--'}</td>
                          <td className={`${styles['co-history-td']} ${styles['co-history-th-sem']}`}>{item.semester || '--'}</td>
                          <td className={`${styles['co-history-td']} ${styles['co-history-th-credits']}`}>{item.credits ?? 0} Credits</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal Popup */}
      {popupMode !== 'none' && (
        <div className={styles['ms-popup-overlay']}>
          <div className={styles['ms-popup-container']}>
            <div className={styles['ms-popup-header']}>
              {popupMode === 'add' ? 'Create Subject' : 'Edit Subject'}
            </div>
            <form onSubmit={handleSaveSubject}>
              <div className={styles['ms-popup-body']}>
                {popupError && <div style={{ color: 'red', fontWeight: 'bold' }}>{popupError}</div>}
                
                <div className={styles['form-row']}>
                  <div className={styles['form-group']}>
                    <label>Subject Code</label>
                    <input 
                      type="text" 
                      value={popupData.courseCode} 
                      onChange={(e) => setPopupData(prev => ({ ...prev, courseCode: e.target.value }))}
                      className={styles['form-input']}
                      placeholder="e.g. 20CS601"
                      required
                      disabled={popupMode === 'edit'} // Code is usually immutable once set in master to preserve joins
                    />
                  </div>

                  <div className={styles['form-group']} style={{ flex: 1.5 }}>
                    <label>Subject Name</label>
                    <input 
                      type="text" 
                      value={popupData.courseName} 
                      onChange={(e) => setPopupData(prev => ({ ...prev, courseName: e.target.value }))}
                      className={styles['form-input']}
                      placeholder="e.g. Compiler Design"
                      required
                    />
                  </div>
                </div>

                <div className={styles['form-row']}>
                  <div className={styles['form-group']}>
                    <label>Credits</label>
                    <Dropdown
                      options={['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']}
                      selectedOption={popupData.credits}
                      onSelect={(val) => setPopupData(prev => ({ ...prev, credits: val || '3' }))}
                      placeholder="Select Credits"
                      role="coordinator"
                      className={styles['popup-dropdown-wrapper']}
                      headerClassName={styles['popup-dropdown-header']}
                    />
                  </div>

                  <div className={styles['form-group']}>
                    <label>Year</label>
                    <Dropdown
                      options={['I', 'II', 'III', 'IV']}
                      selectedOption={popupData.year}
                      onSelect={(val) => setPopupData(prev => ({ ...prev, year: val || 'I', semester: YEAR_SEMESTER_MAP[val || 'I'][0] }))}
                      placeholder="Select Year"
                      role="coordinator"
                      className={styles['popup-dropdown-wrapper']}
                      headerClassName={styles['popup-dropdown-header']}
                    />
                  </div>
                </div>

                <div className={styles['form-row']}>
                  <div className={styles['form-group']}>
                    <label>Semester</label>
                    <Dropdown
                      options={semesterOptionsForPopup}
                      selectedOption={popupData.semester}
                      onSelect={(val) => setPopupData(prev => ({ ...prev, semester: val || '1' }))}
                      placeholder="Select Semester"
                      role="coordinator"
                      className={styles['popup-dropdown-wrapper']}
                      headerClassName={styles['popup-dropdown-header']}
                    />
                  </div>
                </div>
              </div>
              <div className={styles['ms-popup-footer']}>
                <button 
                  type="button" 
                  onClick={() => setPopupMode('none')} 
                  className={styles['btn-secondary']}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles['btn-primary']}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Popup */}
      {showDeletePopup && (
        <div className={styles['ms-popup-overlay']}>
          <div className={styles['ms-popup-container']}>
            <div className={`${styles['ms-popup-header']} ${styles['delete-warning-header']}`}>Warning !</div>
            <div className={styles['ms-popup-body-center']}>
              <div className={styles['co-ms-StuProfile-warning-icon-container']}>
                <svg className={styles['co-ms-StuProfile-warning-icon']} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                  <circle className={styles['co-ms-StuProfile-warning-icon--circle']} cx="26" cy="26" r="25" fill="none"/>
                  <path className={styles['co-ms-StuProfile-warning-icon--exclamation']} fill="none" d="M26 16v12M26 34v2"/>
                </svg>
              </div>
              <h2>Are you sure?</h2>
              <p>Delete {selectedSubjectIds.size} selected subject{selectedSubjectIds.size > 1 ? 's' : ''}?</p>
            </div>
            <div className={styles['ms-popup-delete-footer']}>
              <button 
                type="button" 
                onClick={() => setShowDeletePopup(false)} 
                className={styles['ms-popup-delete-back-btn']}
                disabled={isDeleting}
              >
                Discard
              </button>
              <button 
                type="button" 
                onClick={handleDeleteSelected} 
                className={styles['ms-popup-delete-confirm-btn']}
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

export default CooSubjects;
